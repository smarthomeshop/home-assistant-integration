"""Tests for bounded local Smart Energy storage."""

from __future__ import annotations

import asyncio
import copy
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from custom_components.smarthomeshop.storage import SmartHomeShopStore


def _store() -> SmartHomeShopStore:
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store._data = {
        "energy_journal": [],
        "energy_learning": {},
        "smart_ev": {
            "enabled": False,
            "execution_mode": "advice",
            "vehicles": [],
            "learning": {},
            "plans": {},
            "control_owners": {},
            "journal": [],
        },
        "smart_loads": {
            "enabled": False,
            "execution_mode": "advice",
            "loads": [],
            "learning": {},
            "plans": {},
            "control_owners": {},
            "control_pauses": {},
            "journal": [],
            "runs": [],
        },
    }
    store.async_save = AsyncMock()
    return store


def test_journal_suppresses_an_identical_command_within_ten_minutes():
    store = _store()
    entry = {
        "kind": "execution",
        "mode": "automatic",
        "status": "sent",
        "action": "charge",
        "target_power_w": 2030,
        "control_entity": "number.battery_power",
        "guard_status": "safe",
    }

    async def run():
        first = await store.async_append_energy_journal(entry)
        second = await store.async_append_energy_journal(
            {**entry, "target_power_w": 2049}
        )
        return first, second

    first, second = asyncio.run(run())
    assert second["id"] == first["id"]
    assert len(store.get_energy_journal()) == 1
    store.async_save.assert_awaited_once()


def test_learning_storage_returns_defensive_copies():
    store = _store()
    asyncio.run(
        store.async_set_energy_learning(
            {
                "samples": [{"ts": "2026-11-08T12:00:00+00:00", "grid_w": 100}],
                "model": {"use": {}},
            }
        )
    )
    result = store.get_energy_learning()
    result["samples"][0]["grid_w"] = 999
    assert store.get_energy_learning()["samples"][0]["grid_w"] == 100


def test_journal_keeps_distinct_failure_reasons():
    store = _store()
    base = {
        "kind": "execution",
        "mode": "automatic",
        "status": "failed",
        "action": "charge",
        "target_power_w": 2000,
        "control_entity": "number.battery_power",
        "guard_status": "safe",
    }

    async def run():
        await store.async_append_energy_journal({**base, "reason": "Device offline"})
        await store.async_append_energy_journal({**base, "reason": "Service rejected"})

    asyncio.run(run())
    assert [row["reason"] for row in store.get_energy_journal()] == [
        "Service rejected",
        "Device offline",
    ]


def test_smart_ev_configuration_preserves_runtime_learning_and_plans():
    store = _store()
    asyncio.run(
        store.async_set_smart_ev_runtime(
            plans={"car": {"status": "scheduled"}},
            learning={"car": {"charge_power_kw": 10.6}},
            control_owners={
                "switch.wallbox": {
                    "vehicle_id": "car",
                    "config": {"control_entity": "switch.wallbox"},
                }
            },
        )
    )
    asyncio.run(
        store.async_set_smart_ev(
            {
                "enabled": True,
                "execution_mode": "shadow",
                "vehicles": [{"id": "car", "name": "Family EV"}],
            }
        )
    )

    stored = store.get_smart_ev()
    assert stored["plans"]["car"]["status"] == "scheduled"
    assert stored["learning"]["car"]["charge_power_kw"] == 10.6
    assert stored["control_owners"]["switch.wallbox"]["vehicle_id"] == "car"
    assert stored["vehicles"][0]["name"] == "Family EV"


def test_identical_smart_ev_runtime_does_not_rewrite_storage():
    store = _store()
    runtime = {"car": {"status": "scheduled"}}

    asyncio.run(store.async_set_smart_ev_runtime(plans=runtime))
    asyncio.run(store.async_set_smart_ev_runtime(plans=runtime))

    store.async_save.assert_awaited_once()


def test_smart_ev_journal_collapses_identical_decisions_and_can_be_cleared():
    store = _store()
    row = {
        "vehicle_id": "car",
        "mode": "smart",
        "action": "charge",
        "status": "following",
        "reason": "Selected low-cost period",
    }
    asyncio.run(store.async_set_smart_ev_runtime(journal_entry=row))
    asyncio.run(store.async_set_smart_ev_runtime(journal_entry=row))

    assert len(store.get_smart_ev()["journal"]) == 1
    asyncio.run(store.async_clear_smart_ev_journal())
    assert store.get_smart_ev()["journal"] == []


def test_smart_load_configuration_preserves_learning_ownership_and_runs():
    store = _store()
    load = {"id": "dishwasher", "name": "Dishwasher"}
    asyncio.run(
        store.async_set_smart_loads(
            {"enabled": False, "execution_mode": "advice", "loads": [load]}
        )
    )
    asyncio.run(
        store.async_set_smart_loads_runtime(
            plans={"dishwasher": {"status": "scheduled"}},
            learning={"dishwasher": {"duration_min": 82}},
            control_owners={"dishwasher": {"status": "running"}},
            completed_runs=[{"load_id": "dishwasher", "result": "completed"}],
            immediate=True,
        )
    )
    asyncio.run(
        store.async_set_smart_loads(
            {
                "revision": store.get_smart_loads()["revision"],
                "enabled": True,
                "execution_mode": "shadow",
                "loads": [load],
            }
        )
    )

    stored = store.get_smart_loads()
    assert stored["plans"]["dishwasher"]["status"] == "scheduled"
    assert stored["learning"]["dishwasher"]["duration_min"] == 82
    assert stored["control_owners"]["dishwasher"]["status"] == "running"
    assert stored["runs"][0]["result"] == "completed"


def test_smart_load_configuration_rejects_a_stale_editor_revision():
    store = _store()
    asyncio.run(
        store.async_set_smart_loads({"revision": 0, "enabled": False, "loads": []})
    )

    with pytest.raises(ValueError, match="reload before saving"):
        asyncio.run(
            store.async_set_smart_loads({"revision": 0, "enabled": True, "loads": []})
        )


def test_smart_load_mode_clears_manual_pause_for_explicit_retry():
    store = _store()
    store._data["smart_loads"].update(
        loads=[{"id": "dishwasher", "mode": "paused"}],
        control_pauses={"dishwasher": {"kind": "manual_stop"}},
    )
    result = asyncio.run(store.async_set_smart_load_mode("dishwasher", "run_now"))

    assert result is not None
    assert result["loads"][0]["mode"] == "run_now"
    assert result["control_pauses"] == {}


def test_smart_mode_preserves_measured_interruptible_progress():
    store = _store()
    progress = {
        "kind": "progress",
        "completed_min": 24,
        "remaining_min": 36,
    }
    store._data["smart_loads"].update(
        loads=[{"id": "dishwasher", "mode": "paused"}],
        control_pauses={"dishwasher": progress},
    )

    result = asyncio.run(store.async_set_smart_load_mode("dishwasher", "smart"))

    assert result is not None
    assert result["loads"][0]["mode"] == "smart"
    assert result["control_pauses"]["dishwasher"] == progress


def test_smart_load_safety_ownership_is_saved_immediately():
    store = _store()
    store._store = SimpleNamespace(async_delay_save=Mock())
    asyncio.run(
        store.async_set_smart_loads_runtime(
            control_owners={"dishwasher": {"status": "starting"}},
            immediate=True,
        )
    )

    store.async_save.assert_awaited_once()
    store._store.async_delay_save.assert_not_called()


def test_smart_load_safety_write_requires_positive_storage_readback():
    store = _store()
    original = copy.deepcopy(store._data["smart_loads"])
    store._store = SimpleNamespace(
        async_load=AsyncMock(return_value={"smart_loads": original}),
        async_delay_save=Mock(),
    )

    with pytest.raises(OSError, match="was not confirmed"):
        asyncio.run(
            store.async_set_smart_loads_runtime(
                control_owners={"dishwasher": {"status": "starting"}},
                immediate=True,
            )
        )

    assert store.get_smart_loads()["control_owners"] == {}


def test_smart_load_history_is_bounded_and_clearable():
    store = _store()
    runs = [{"load_id": "load", "sequence": index} for index in range(250)]
    asyncio.run(store.async_set_smart_loads_runtime(completed_runs=runs))
    assert len(store.get_smart_loads()["runs"]) == 200
    assert store.get_smart_loads()["runs"][0]["sequence"] == 50
    asyncio.run(store.async_clear_smart_loads_history())
    assert store.get_smart_loads()["runs"] == []


def test_noncritical_runtime_updates_are_coalesced() -> None:
    store = _store()
    delayed = Mock()
    store._store = SimpleNamespace(async_delay_save=delayed)

    asyncio.run(
        store.async_set_smart_ev_runtime(plans={"car": {"status": "scheduled"}})
    )

    store.async_save.assert_not_awaited()
    delayed.assert_called_once()
    assert delayed.call_args.kwargs["delay"] == 60


def test_control_ownership_is_always_saved_immediately() -> None:
    store = _store()
    store._store = SimpleNamespace(async_delay_save=Mock())
    owners = {
        "switch.wallbox": {
            "vehicle_id": "car",
            "config": {"control_entity": "switch.wallbox"},
        }
    }

    asyncio.run(
        store.async_set_smart_ev_runtime(
            control_owners=owners,
            immediate=True,
        )
    )
    # Repeating the same payload still creates a durable write: the previous
    # write may have failed after in-memory state was updated.
    asyncio.run(
        store.async_set_smart_ev_runtime(
            control_owners=owners,
            immediate=True,
        )
    )

    assert store.async_save.await_count == 2


def test_failed_configuration_save_restores_the_previous_in_memory_value() -> None:
    store = _store()
    before = store.get_smart_ev()
    store.async_save = AsyncMock(side_effect=RuntimeError("disk full"))

    with pytest.raises(RuntimeError, match="disk full"):
        asyncio.run(
            store.async_set_smart_ev(
                {
                    "enabled": True,
                    "execution_mode": "automatic",
                    "vehicles": [{"id": "car"}],
                }
            )
        )

    assert store.get_smart_ev() == before


def test_failed_safety_runtime_save_restores_owners_and_pauses() -> None:
    store = _store()
    before = store.get_smart_ev()
    store.async_save = AsyncMock(side_effect=RuntimeError("disk full"))

    with pytest.raises(RuntimeError, match="disk full"):
        asyncio.run(
            store.async_set_smart_ev_runtime(
                control_owners={"switch.wallbox": {"vehicle_id": "car"}},
                control_pauses={"switch.wallbox": {"kind": "manual"}},
                guard_stopped_at={"switch.wallbox": "2026-11-09T12:00:00+00:00"},
                immediate=True,
            )
        )

    assert store.get_smart_ev() == before


def test_vehicle_mode_mutation_preserves_a_newer_global_disable() -> None:
    store = _store()
    store._data["smart_ev"].update(
        enabled=True,
        execution_mode="automatic",
        vehicles=[{"id": "car", "mode": "smart", "name": "Family EV"}],
    )

    async def run() -> None:
        lock = store._ev_lock()
        await lock.acquire()
        disable = asyncio.create_task(
            store.async_set_smart_ev(
                {
                    "enabled": False,
                    "execution_mode": "advice",
                    "vehicles": [{"id": "car", "mode": "smart", "name": "Family EV"}],
                }
            )
        )
        await asyncio.sleep(0)
        mode = asyncio.create_task(
            store.async_set_smart_ev_vehicle_mode("car", "charge_now")
        )
        await asyncio.sleep(0)
        lock.release()
        await asyncio.gather(disable, mode)

    asyncio.run(run())

    saved = store.get_smart_ev()
    assert saved["enabled"] is False
    assert saved["execution_mode"] == "advice"
    assert saved["vehicles"][0]["mode"] == "charge_now"
