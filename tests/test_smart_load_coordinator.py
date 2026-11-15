"""Safety and lifecycle tests for native Smart Loads execution."""

from __future__ import annotations

import asyncio
import copy
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

import custom_components.smarthomeshop.smart_load_coordinator as module
from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop.smart_load_coordinator import SmartLoadCoordinator


class Services:
    def __init__(self, *, failure: Exception | None = None, on_call=None):
        self.calls = []
        self.failure = failure
        self.on_call = on_call

    def has_service(self, _domain, _service):
        return True

    async def async_call(self, domain, service, data, blocking=False):
        self.calls.append((domain, service, data, blocking))
        if self.failure:
            raise self.failure
        if self.on_call:
            self.on_call(domain, service, data)


class Store:
    def __init__(self):
        self.runtime = []
        self.smart_loads = {"loads": []}

    async def async_set_smart_loads_runtime(self, **kwargs):
        self.runtime.append(copy.deepcopy(kwargs))

    def get_energy_sources(self):
        return {}

    def get_smart_loads(self):
        return copy.deepcopy(self.smart_loads)

    def get_smart_ev(self):
        return {"vehicles": []}

    def get_energy_learning(self):
        return {}


def state(value, unit=None):
    return SimpleNamespace(
        state=str(value),
        attributes={"unit_of_measurement": unit} if unit else {},
        last_updated=datetime.now(UTC),
        last_reported=datetime.now(UTC),
    )


def coordinator(states=None, *, services=None):
    item = SmartLoadCoordinator.__new__(SmartLoadCoordinator)
    store = Store()
    item.hass = SimpleNamespace(
        states=SimpleNamespace(get=(states or {}).get),
        services=services or Services(),
        data={DOMAIN: {"store": store}},
    )
    item.prices = SimpleNamespace(
        electricity_price=lambda: 0.2,
        today=lambda: [{"consumer": 0.3}],
    )
    item._owned = {}
    item._pauses = {}
    return item, store


def appliance(**overrides):
    return {
        "id": "washer",
        "name": "Washer",
        "category": "appliance",
        "start_entity": "button.washer_start",
        "stop_entity": "switch.washer_power",
        "status_entity": "sensor.washer_status",
        "power_entity": "sensor.washer_power",
        "ready_states": "ready",
        "running_states": "running",
        "power_w": 1800,
        **overrides,
    }


def test_readiness_explains_open_door_and_disabled_remote_start() -> None:
    item, _ = coordinator(
        {
            "sensor.washer_status": state("ready"),
            "binary_sensor.washer_door": state("on"),
            "binary_sensor.washer_remote": state("off"),
            "sensor.washer_power": state(0, "W"),
        }
    )
    result = item._load_state(
        appliance(
            door_entity="binary_sensor.washer_door",
            remote_entity="binary_sensor.washer_remote",
        )
    )
    assert result["ready"] is False
    assert "door is open" in result["reason"]
    assert "remote start is off" in result["reason"]


def test_power_feedback_confirms_running_with_arbitrary_entity_id() -> None:
    item, _ = coordinator(
        {
            "sensor.washer_status": state("ready"),
            "sensor.washer_power": state(0.42, "kW"),
        }
    )
    result = item._load_state(appliance())
    assert result["running"] is True
    assert result["power_w"] == pytest.approx(420)


def test_control_on_wins_when_optional_power_feedback_is_unavailable() -> None:
    item, _ = coordinator(
        {
            "switch.pool": state("on"),
            "sensor.pool_power": state("unavailable", "W"),
        }
    )
    result = item._load_state(
        appliance(
            status_entity=None,
            control_entity="switch.pool",
            power_entity="sensor.pool_power",
        )
    )
    assert result["running"] is True
    assert result["stopped_confirmed"] is False


def test_unavailable_feedback_is_never_treated_as_confirmed_off() -> None:
    item, _ = coordinator(
        {
            "sensor.washer_status": state("unavailable"),
            "sensor.washer_power": state("unavailable", "W"),
        }
    )
    result = item._load_state(appliance())
    assert result["running"] is False
    assert result["stopped_confirmed"] is False


def test_control_actions_cover_buttons_switches_and_climate() -> None:
    item, _ = coordinator()
    assert item._actions(appliance(), True)[0]["service"] == "press"
    assert item._actions(appliance(), False)[0]["service"] == "turn_off"
    climate = appliance(
        category="climate",
        start_entity=None,
        stop_entity=None,
        control_entity="climate.office",
        climate_mode="heat",
        climate_temperature=19,
    )
    assert [action["service"] for action in item._actions(climate, True)] == [
        "set_temperature",
        "set_hvac_mode",
    ]
    assert item._entity_action("script.stop_pool", False)["service"] == "turn_on"


def test_grid_guard_blocks_stale_p1_and_capacity_overrun(monkeypatch) -> None:
    item, _ = coordinator()
    monkeypatch.setattr(
        module,
        "grid_measurement",
        lambda _hass, _config: {"fresh": False, "power_w": 500},
    )
    monkeypatch.setattr(
        module,
        "fuse_headroom_measurement",
        lambda _hass, _config: {"fresh": True, "power_w": 5000},
    )
    result = item._guard(appliance(), {}, {"power_w": 0}, 0, None)
    assert result["allowed"] is False
    assert "stale" in result["reason"]

    monkeypatch.setattr(
        module,
        "grid_measurement",
        lambda _hass, _config: {"fresh": True, "power_w": 1500},
    )
    result = item._guard(
        appliance(),
        {"grid_safety_margin_w": 100},
        {"power_w": 0},
        0,
        2500,
    )
    assert result["allowed"] is False
    assert "capacity-tariff" in result["reason"]


def test_grid_guard_uses_conservative_learned_plan_power(monkeypatch) -> None:
    item, _ = coordinator()
    monkeypatch.setattr(
        module,
        "grid_measurement",
        lambda _hass, _config: {"fresh": True, "power_w": 0},
    )
    monkeypatch.setattr(
        module,
        "fuse_headroom_measurement",
        lambda _hass, _config: {"fresh": True, "power_w": 1600},
    )
    result = item._guard(
        appliance(power_w=1000),
        {"grid_safety_margin_w": 250},
        {"power_w": 0},
        0,
        None,
        1500,
    )
    assert result["allowed"] is False
    assert result["requested_w"] == 1500


def test_start_failure_retains_stop_responsibility_until_feedback_confirms_off() -> (
    None
):
    item, store = coordinator(
        {
            "sensor.washer_status": state("ready"),
            "sensor.washer_power": state(0, "W"),
        },
        services=Services(failure=RuntimeError("device offline")),
    )
    load = appliance()
    store.smart_loads = {
        "enabled": True,
        "execution_mode": "automatic",
        "loads": [load],
    }
    result, journal = asyncio.run(
        item._start(
            load,
            {
                "deadline": "2026-11-16T07:00:00+00:00",
                "duration_min": 60,
                "power_w": 1800,
            },
            {"running": False},
            datetime.now(UTC),
        )
    )
    assert result["status"] == "start_failed"
    assert item._owned["washer"]["status"] == "starting_uncertain"
    assert item._pauses == {}
    assert journal["status"] == "failed"
    assert len(store.runtime) >= 2


def test_successful_start_persists_ownership_before_service_call() -> None:
    states = {
        "sensor.washer_status": state("ready"),
        "sensor.washer_power": state(0, "W"),
    }

    def mark_running(_domain, _service, _data):
        states["sensor.washer_status"] = state("running")
        states["sensor.washer_power"] = state(500, "W")

    services = Services(on_call=mark_running)
    item, store = coordinator(
        states,
        services=services,
    )
    load = appliance()
    store.smart_loads = {
        "enabled": True,
        "execution_mode": "automatic",
        "loads": [load],
    }
    result, _journal = asyncio.run(
        item._start(
            load,
            {
                "deadline": "2026-11-16T07:00:00+00:00",
                "duration_min": 60,
                "power_w": 1800,
            },
            {"running": False},
            datetime.now(UTC),
        )
    )
    assert result["status"] == "running"
    assert item._owned["washer"]["status"] == "running"
    assert store.runtime[0]["control_owners"]["washer"]["status"] == "starting"
    assert any(
        saved.get("control_owners", {}).get("washer", {}).get("command_attempted_at")
        for saved in store.runtime
    )
    assert services.calls[0][:2] == ("button", "press")


def test_unconfirmed_storage_write_prevents_hardware_start() -> None:
    services = Services()
    item, store = coordinator(
        {
            "sensor.washer_status": state("ready"),
            "sensor.washer_power": state(0, "W"),
        },
        services=services,
    )
    store.async_set_smart_loads_runtime = AsyncMock(
        side_effect=OSError("storage write was not confirmed")
    )

    with pytest.raises(OSError, match="not confirmed"):
        asyncio.run(
            item._start(
                appliance(),
                {"duration_min": 60, "power_w": 1800},
                {"running": False},
                datetime.now(UTC),
            )
        )

    assert services.calls == []


def test_cancelled_claim_before_dispatch_is_rolled_back() -> None:
    services = Services()
    item, store = coordinator(
        {
            "sensor.washer_status": state("ready"),
            "sensor.washer_power": state(0, "W"),
        },
        services=services,
    )
    store.async_set_smart_loads_runtime = AsyncMock(
        side_effect=[asyncio.CancelledError(), None]
    )

    with pytest.raises(asyncio.CancelledError):
        asyncio.run(
            item._start(
                appliance(),
                {"duration_min": 60, "power_w": 1800},
                {"running": False},
                datetime.now(UTC),
            )
        )

    assert services.calls == []
    assert item._owned == {}


def test_external_start_detected_immediately_before_dispatch_is_never_claimed() -> None:
    services = Services()
    states = {
        "sensor.washer_status": state("running"),
        "sensor.washer_power": state(500, "W"),
    }
    item, store = coordinator(states, services=services)
    load = appliance()
    store.smart_loads = {
        "enabled": True,
        "execution_mode": "automatic",
        "loads": [load],
    }

    result, _journal = asyncio.run(
        item._start(
            load,
            {"duration_min": 60, "power_w": 1800},
            {"running": False},
            datetime.now(UTC),
        )
    )

    assert result["status"] == "external_control"
    assert item._owned == {}
    assert services.calls == []


def test_non_interruptible_unconfirmed_start_is_never_stopped() -> None:
    services = Services()
    item, store = coordinator(
        {
            "sensor.washer_status": state("unavailable"),
            "sensor.washer_power": state("unavailable", "W"),
        },
        services=services,
    )
    load = appliance(interruptible=False)
    store.smart_loads = {
        "enabled": True,
        "execution_mode": "automatic",
        "loads": [load],
    }
    item._owned = {
        "washer": {
            "load_id": "washer",
            "status": "starting_uncertain",
            "interruptible": False,
            "confirm_by": None,
            "start_error": "Feedback was lost",
            "started_at": "2026-11-15T09:00:00+00:00",
            "sampled_at": "2026-11-15T09:00:00+00:00",
            "expected_end": "2026-11-15T10:00:00+00:00",
            "expected_power_w": 1800,
            "stop_actions": [
                {
                    "domain": "switch",
                    "service": "turn_off",
                    "entity_id": "switch.washer_power",
                }
            ],
        }
    }
    item._guard = lambda *_args: {"allowed": True, "status": "safe"}

    outcome, _journal, run = asyncio.run(
        item._execute(
            {"enabled": True, "execution_mode": "automatic"},
            load,
            {"active": False, "duration_min": 60, "power_w": 1800},
            item._load_state(load),
            datetime(2026, 11, 15, 10, 30, tzinfo=UTC),
            0,
            None,
        )
    )

    assert outcome["status"] == "not_following"
    assert outcome["owned"] is True
    assert run is None
    assert services.calls == []
    assert "washer" in item._owned


def test_run_now_completion_latches_and_prevents_restart() -> None:
    services = Services()
    item, store = coordinator(
        {
            "sensor.washer_status": state("ready"),
            "sensor.washer_power": state(0, "W"),
        },
        services=services,
    )
    load = appliance(mode="run_now", interruptible=False)
    store.smart_loads = {
        "enabled": True,
        "execution_mode": "automatic",
        "loads": [load],
    }
    item._owned = {
        "washer": {
            "load_id": "washer",
            "status": "running",
            "run_mode": "run_now",
            "interruptible": False,
            "started_at": "2026-11-15T09:00:00+00:00",
            "sampled_at": "2026-11-15T09:00:00+00:00",
            "expected_end": "2026-11-15T10:00:00+00:00",
            "expected_power_w": 1800,
            "energy_kwh": 1.2,
            "peak_power_w": 1800,
        }
    }
    item._guard = lambda *_args: {"allowed": True, "status": "safe"}
    plan = {
        "active": True,
        "deadline": None,
        "duration_min": 60,
        "power_w": 1800,
    }
    now = datetime(2026, 11, 15, 10, 30, tzinfo=UTC)

    first, _journal, run = asyncio.run(
        item._execute(
            {"enabled": True, "execution_mode": "automatic"},
            load,
            plan,
            item._load_state(load),
            now,
            0,
            None,
        )
    )
    second, _journal, second_run = asyncio.run(
        item._execute(
            {"enabled": True, "execution_mode": "automatic"},
            load,
            plan,
            item._load_state(load),
            now + timedelta(minutes=1),
            0,
            None,
        )
    )

    assert first["status"] == "completed"
    assert run is not None
    assert item._pauses["washer"]["kind"] == "completed"
    assert second["status"] == "completed"
    assert second_run is None
    assert services.calls == []


def test_non_interruptible_cycle_completes_when_plug_stays_on() -> None:
    item, store = coordinator(
        {
            "switch.washer_power": state("on"),
            "sensor.washer_status": state("unavailable"),
            "sensor.washer_power": state(1, "W"),
        }
    )
    load = appliance(
        interruptible=False,
        control_entity="switch.washer_power",
    )
    store.smart_loads = {"loads": [load]}
    deadline = "2026-11-15T10:00:00+00:00"
    item._owned = {
        "washer": {
            "load_id": "washer",
            "status": "running",
            "interruptible": False,
            "started_at": "2026-11-15T09:00:00+00:00",
            "sampled_at": "2026-11-15T09:58:00+00:00",
            "observed_runtime_seconds": 3480,
            "expected_end": deadline,
            "expected_power_w": 1800,
            "deadline": deadline,
        }
    }
    item._guard = lambda *_args: {"allowed": True, "status": "safe"}
    plan = {
        "active": False,
        "deadline": "2026-11-16T10:00:00+00:00",
        "duration_min": 60,
        "power_w": 1800,
    }

    first, _journal, first_run = asyncio.run(
        item._execute(
            {"enabled": True, "execution_mode": "automatic"},
            load,
            plan,
            item._load_state(load),
            datetime(2026, 11, 15, 10, 1, tzinfo=UTC),
            0,
            None,
        )
    )
    second, _journal, run = asyncio.run(
        item._execute(
            {"enabled": True, "execution_mode": "automatic"},
            load,
            plan,
            item._load_state(load),
            datetime(2026, 11, 15, 10, 2, tzinfo=UTC),
            0,
            None,
        )
    )

    assert first["status"] == "confirmation_wait"
    assert first_run is None
    assert second["status"] == "completed"
    assert run is not None
    assert "washer" not in item._owned
    assert item._pauses["washer"]["deadline"] == deadline


def test_completed_run_uses_observed_runtime_not_home_assistant_downtime() -> None:
    item, _ = coordinator()
    started = datetime(2026, 11, 15, 8, 0, tzinfo=UTC)
    owner = {
        "started_at": started.isoformat(),
        "observed_runtime_seconds": 12 * 60,
        "interruptible": True,
    }

    run = item._completed_run(
        appliance(), owner, started + timedelta(hours=5), "shutdown"
    )

    assert run["duration_min"] == 12


def test_interruptible_segment_progress_is_retained_without_learning() -> None:
    item, _store = coordinator()
    load = appliance(interruptible=True, duration_min=30)
    owner = {
        "load_id": "washer",
        "interruptible": True,
        "run_mode": "smart",
        "deadline": "2026-11-16T07:00:00+00:00",
        "required_duration_min": 30,
        "progress_before_min": 5,
    }
    run = {
        "load_id": "washer",
        "result": "segment_end",
        "duration_min": 10,
        "energy_kwh": 0.4,
        "peak_power_w": 1800,
        "interruptible": True,
    }
    item._record_stop_progress(
        load,
        {"deadline": owner["deadline"], "required_duration_min": 30},
        owner,
        run,
        "segment_end",
        datetime.now(UTC),
    )
    learning = {}
    item._learn(learning, {**run, "result": "completed"})

    assert item._pauses["washer"]["completed_min"] == 15
    assert item._pauses["washer"]["remaining_min"] == 15
    assert learning["washer"]["sample_count"] == 0


def test_admin_recovery_releases_unknown_feedback_without_sending_a_command() -> None:
    services = Services()
    item, store = coordinator(
        {
            "sensor.washer_status": state("unavailable"),
            "sensor.washer_power": state("unavailable", "W"),
        },
        services=services,
    )
    load = appliance()
    store.smart_loads = {
        "loads": [load],
        "control_owners": {
            "washer": {
                "load_id": "washer",
                "status": "starting_uncertain",
                "load_snapshot": load,
            }
        },
        "control_pauses": {},
    }
    item._cycle_lock = asyncio.Lock()

    result = asyncio.run(item.async_confirm_stopped_and_release("washer"))

    assert result["released"] is True
    assert item._owned == {}
    assert item._pauses["washer"]["kind"] == "manual_recovery"
    assert store.runtime[-1]["control_owners"] == {}
    assert services.calls == []


def test_admin_recovery_refuses_positive_running_feedback() -> None:
    item, store = coordinator(
        {
            "sensor.washer_status": state("running"),
            "sensor.washer_power": state(500, "W"),
        }
    )
    load = appliance()
    store.smart_loads = {
        "loads": [load],
        "control_owners": {
            "washer": {
                "load_id": "washer",
                "status": "running",
                "load_snapshot": load,
            }
        },
        "control_pauses": {},
    }
    item._cycle_lock = asyncio.Lock()

    with pytest.raises(ValueError, match="still reports"):
        asyncio.run(item.async_confirm_stopped_and_release("washer"))

    assert "washer" in item._owned


def test_learning_requires_three_successful_runs_and_uses_medians() -> None:
    item, _ = coordinator()
    learning = {}
    first = {
        "load_id": "washer",
        "result": "completed",
        "duration_min": 80,
        "energy_kwh": 1.1,
        "peak_power_w": 1900,
    }
    item._learn(learning, first)
    assert learning["washer"].get("trusted") is not True
    item._learn(
        learning,
        {**first, "duration_min": 100, "energy_kwh": 1.3, "peak_power_w": 2100},
    )
    assert learning["washer"].get("trusted") is not True
    item._learn(
        learning,
        {**first, "duration_min": 90, "energy_kwh": 1.2, "peak_power_w": 2000},
    )
    assert learning["washer"]["trusted"] is True
    assert learning["washer"]["duration_min"] == 90
    assert learning["washer"]["power_w"] == 2000


def test_custom_service_call_preserves_service_data() -> None:
    services = Services()
    item, _ = coordinator(services=services)
    asyncio.run(
        item._call_actions(
            [
                {
                    "domain": "script",
                    "service": "turn_on",
                    "entity_id": "script.start_spa",
                    "data": {"mode": "eco"},
                }
            ]
        )
    )
    assert services.calls == [
        (
            "script",
            "turn_on",
            {"mode": "eco", "entity_id": "script.start_spa"},
            True,
        )
    ]


def test_leaving_automatic_mode_does_not_stop_non_interruptible_cycle() -> None:
    services = Services()
    item, _ = coordinator(services=services)
    item._owned = {
        "washer": {
            "load_id": "washer",
            "interruptible": False,
            "stop_actions": [
                {
                    "domain": "switch",
                    "service": "turn_off",
                    "entity_id": "switch.washer_power",
                }
            ],
        }
    }

    journal, completed = asyncio.run(
        item._release_missing_or_disabled(
            [appliance(interruptible=False)], automatic=False
        )
    )

    assert journal == []
    assert completed == []
    assert "washer" in item._owned
    assert services.calls == []


def test_leaving_automatic_mode_keeps_owner_until_stop_is_confirmed() -> None:
    services = Services()
    item, _ = coordinator(services=services)
    item._owned = {
        "washer": {
            "load_id": "washer",
            "interruptible": True,
            "stop_actions": [
                {
                    "domain": "switch",
                    "service": "turn_off",
                    "entity_id": "switch.washer_power",
                }
            ],
        }
    }

    journal, completed = asyncio.run(
        item._release_missing_or_disabled(
            [appliance(interruptible=True)], automatic=False
        )
    )

    assert journal[0]["status"] == "sent"
    assert completed == []
    assert item._owned["washer"]["status"] == "stopping"
    assert services.calls[0][:2] == ("switch", "turn_off")


def test_stop_with_unknown_feedback_never_releases_ownership() -> None:
    services = Services()
    item, _ = coordinator(
        {
            "sensor.washer_status": state("unavailable"),
            "sensor.washer_power": state("unavailable", "W"),
        },
        services=services,
    )
    owner = {
        "load_id": "washer",
        "status": "running",
        "stop_actions": [
            {
                "domain": "switch",
                "service": "turn_off",
                "entity_id": "switch.washer_power",
            }
        ],
    }
    item._owned = {"washer": owner}

    outcome, _entry, run = asyncio.run(
        item._stop(appliance(), owner, datetime.now(UTC), result="completed")
    )

    assert outcome["status"] == "confirmation_wait"
    assert run is None
    assert item._owned["washer"]["status"] == "stopping"


@pytest.mark.parametrize(
    ("interruptible", "expected_service_calls"),
    [(False, 0), (True, 1)],
)
def test_expected_duration_only_stops_interruptible_loads(
    interruptible: bool, expected_service_calls: int
) -> None:
    services = Services()
    item, store = coordinator(
        {
            "sensor.washer_status": state("running"),
            "sensor.washer_power": state(500, "W"),
        },
        services=services,
    )
    load = appliance(interruptible=interruptible)
    store.smart_loads = {"loads": [load]}
    item._owned = {
        "washer": {
            "load_id": "washer",
            "status": "running",
            "interruptible": interruptible,
            "started_at": "2026-11-15T09:00:00+00:00",
            "sampled_at": "2026-11-15T09:00:00+00:00",
            "expected_end": "2026-11-15T09:30:00+00:00",
            "expected_power_w": 1800,
            "stop_actions": [
                {
                    "domain": "switch",
                    "service": "turn_off",
                    "entity_id": "switch.washer_power",
                }
            ],
        }
    }
    item._guard = lambda *_args: {"allowed": True, "status": "safe"}

    outcome, _journal, _run = asyncio.run(
        item._execute(
            {"enabled": True, "execution_mode": "automatic"},
            load,
            {"active": True, "duration_min": 30, "power_w": 1800},
            item._load_state(load),
            datetime(2026, 11, 15, 10, 0, tzinfo=UTC),
            0,
            None,
        )
    )

    assert len(services.calls) == expected_service_calls
    if interruptible:
        assert outcome["status"] == "confirmation_wait"
    else:
        assert outcome["status"] == "running"
        assert "washer" in item._owned


def test_shutdown_retains_owner_when_stop_feedback_is_unknown() -> None:
    services = Services()
    item, store = coordinator(
        {
            "sensor.washer_status": state("unavailable"),
            "sensor.washer_power": state("unavailable", "W"),
        },
        services=services,
    )
    load = appliance(interruptible=True)
    store.smart_loads = {
        "loads": [load],
        "control_owners": {
            "washer": {
                "load_id": "washer",
                "status": "running",
                "interruptible": True,
                "stop_actions": [
                    {
                        "domain": "switch",
                        "service": "turn_off",
                        "entity_id": "switch.washer_power",
                    }
                ],
                "load_snapshot": load,
            }
        },
        "control_pauses": {},
    }
    item._cycle_lock = asyncio.Lock()
    item._stopping = False
    item._unsub_refresh = None
    item._unsub_shutdown = None
    item._debounced_refresh = SimpleNamespace(async_shutdown=lambda: None)

    asyncio.run(item.async_shutdown())

    assert item._owned["washer"]["status"] == "stopping"
    assert services.calls[0][:2] == ("switch", "turn_off")


def test_start_rechecks_live_grid_after_durable_ownership() -> None:
    services = Services()
    item, store = coordinator(
        {
            "sensor.washer_status": state("ready"),
            "sensor.washer_power": state(0, "W"),
        },
        services=services,
    )
    load = appliance(interruptible=True)
    store.smart_loads = {
        "enabled": True,
        "execution_mode": "automatic",
        "loads": [load],
        "control_owners": {},
        "control_pauses": {},
    }
    item._capacity_limit = lambda _config: None
    guard_calls = 0

    def changing_guard(*_args):
        nonlocal guard_calls
        guard_calls += 1
        return {
            "allowed": guard_calls == 1,
            "status": "safe" if guard_calls == 1 else "blocked",
            "reason": "grid import limit",
        }

    item._guard = changing_guard

    outcome, entry = asyncio.run(
        item._start(
            load,
            {
                "duration_min": 30,
                "required_duration_min": 30,
                "power_w": 1800,
            },
            item._load_state(load),
            datetime.now(UTC),
            config=store.smart_loads,
            reserved_w=0,
        )
    )

    assert outcome["status"] == "blocked_by_grid"
    assert entry["status"] == "blocked"
    assert guard_calls == 2
    assert any(saved.get("control_owners", {}).get("washer") for saved in store.runtime)
    assert store.runtime[-1].get("control_owners") == {}
    assert "washer" not in item._owned
    assert services.calls == []


def test_owned_dispatch_reservation_survives_refresh_until_power_is_visible() -> None:
    item, _ = coordinator({"sensor.washer_power": state(0, "W")})
    load = appliance()
    now = datetime.now(UTC)
    owner = {
        "expected_power_w": 1800,
        "command_attempted_at": now.isoformat(),
        "reservation_until": (now + timedelta(seconds=120)).isoformat(),
    }
    assert item._owner_reservation_w(load, owner) == 1800

    owner["reservation_until"] = (now - timedelta(seconds=1)).isoformat()
    assert item._owner_reservation_w(load, owner) == 1800

    item.hass.states.get = {"sensor.washer_power": state(1200, "W")}.get
    assert item._owner_reservation_w(load, owner) == 600

    owner["reservation_until"] = (now + timedelta(seconds=120)).isoformat()
    assert item._owner_reservation_w(load, owner) == 1800


def test_recent_ev_dispatch_keeps_full_reservation_until_p1_catches_up() -> None:
    item, store = coordinator({"sensor.ev_power": state(7000, "W")})
    now = datetime.now(UTC)
    store.get_smart_ev = lambda: {
        "control_owners": {
            "switch.charger": {
                "expected_power_w": 11000,
                "commanded_at": now.isoformat(),
                "config": {
                    "control_entity": "switch.charger",
                    "power_entity": "sensor.ev_power",
                },
            }
        }
    }

    assert item._ev_dispatch_reservation_w() == 11000


def test_recent_battery_dispatch_keeps_full_reservation_until_p1_catches_up() -> None:
    item, _ = coordinator()
    now = datetime.now(UTC)
    item.hass.data[DOMAIN]["battery_dispatch_reservation"] = {
        "expected_power_w": 2500,
        "reservation_until": (now + timedelta(seconds=120)).isoformat(),
    }

    assert item._battery_dispatch_reservation_w(now) == 2500

    item.hass.data[DOMAIN]["battery_dispatch_reservation"]["reservation_until"] = (
        now - timedelta(seconds=1)
    ).isoformat()
    assert item._battery_dispatch_reservation_w(now) == 0


def test_interruptible_idle_relay_is_switched_off_before_release() -> None:
    states = {
        "switch.boiler": state("on"),
        "sensor.boiler_power": state(1, "W"),
    }

    def mark_off(_domain, _service, _data):
        states["switch.boiler"] = state("off")

    services = Services(on_call=mark_off)
    item, _ = coordinator(states, services=services)
    load = appliance(
        category="switch",
        status_entity=None,
        control_entity="switch.boiler",
        power_entity="sensor.boiler_power",
        interruptible=True,
    )
    owner = {
        "load_id": "washer",
        "status": "running",
        "interruptible": True,
        "observed_runtime_seconds": 1800,
        "stop_actions": [
            {
                "domain": "switch",
                "service": "turn_off",
                "entity_id": "switch.boiler",
            }
        ],
    }
    item._owned = {"washer": owner}

    outcome, _entry, run = asyncio.run(
        item._stop(load, owner, datetime.now(UTC), result="completed")
    )

    assert outcome["status"] == "completed"
    assert run is not None
    assert services.calls[0][:2] == ("switch", "turn_off")
    assert "washer" not in item._owned


def test_stopping_owner_never_releases_while_its_relay_stays_on() -> None:
    states = {
        "switch.boiler": state("on"),
        "sensor.boiler_power": state(1, "W"),
    }
    services = Services()
    item, _ = coordinator(states, services=services)
    load = appliance(
        category="switch",
        status_entity=None,
        control_entity="switch.boiler",
        power_entity="sensor.boiler_power",
        interruptible=True,
    )
    owner = {
        "load_id": "washer",
        "status": "stopping",
        "interruptible": True,
        "confirm_by": (datetime.now(UTC) - timedelta(seconds=1)).isoformat(),
        "stop_attempts": 1,
        "stop_actions": [
            {
                "domain": "switch",
                "service": "turn_off",
                "entity_id": "switch.boiler",
            }
        ],
    }
    item._owned = {"washer": owner}
    item._guard = lambda *_args: {"allowed": True, "status": "safe"}

    outcome, _journal, run = asyncio.run(
        item._execute(
            {"enabled": True, "execution_mode": "automatic"},
            load,
            {"active": False, "duration_min": 30, "power_w": 1800},
            item._load_state(load),
            datetime.now(UTC),
            0,
            None,
        )
    )

    assert outcome["status"] == "confirmation_wait"
    assert run is None
    assert "washer" in item._owned
    assert services.calls[-1][:2] == ("switch", "turn_off")


def test_uncertain_idle_start_switches_relay_off_before_release() -> None:
    states = {
        "switch.boiler": state("on"),
        "sensor.boiler_power": state(1, "W"),
    }

    def mark_off(_domain, _service, _data):
        states["switch.boiler"] = state("off")

    services = Services(on_call=mark_off)
    item, _ = coordinator(states, services=services)
    load = appliance(
        category="switch",
        status_entity=None,
        control_entity="switch.boiler",
        power_entity="sensor.boiler_power",
        interruptible=True,
    )
    owner = {
        "load_id": "washer",
        "status": "starting_uncertain",
        "interruptible": True,
        "confirm_by": None,
        "stop_actions": [
            {
                "domain": "switch",
                "service": "turn_off",
                "entity_id": "switch.boiler",
            }
        ],
    }
    item._owned = {"washer": owner}
    item._guard = lambda *_args: {"allowed": True, "status": "safe"}

    outcome, _journal, _run = asyncio.run(
        item._execute(
            {"enabled": True, "execution_mode": "automatic"},
            load,
            {"active": False, "duration_min": 30, "power_w": 1800},
            item._load_state(load),
            datetime.now(UTC),
            0,
            None,
        )
    )

    assert outcome["status"] == "not_following"
    assert services.calls[-1][:2] == ("switch", "turn_off")
    assert "washer" not in item._owned


def test_water_heater_non_off_mode_is_running_feedback() -> None:
    item, _ = coordinator({"water_heater.tank": state("eco")})
    result = item._load_state(
        appliance(
            category="water_heater",
            status_entity=None,
            power_entity=None,
            control_entity="water_heater.tank",
        )
    )

    assert result["running"] is True
    assert result["stopped_confirmed"] is False


def test_power_only_stop_requires_stable_feedback() -> None:
    item, _ = coordinator()
    owner: dict = {}
    stopped = {
        "running": False,
        "stopped_confirmed": True,
        "stopped_by_power": True,
        "stopped_by_entity": False,
        "stopped_by_status": False,
        "stopped_by_control": False,
    }
    now = datetime(2026, 11, 15, 10, 0, tzinfo=UTC)

    assert item._stopped_feedback_is_stable(owner, stopped, now) is False
    assert (
        item._stopped_feedback_is_stable(owner, stopped, now + timedelta(seconds=59))
        is False
    )
    assert (
        item._stopped_feedback_is_stable(owner, stopped, now + timedelta(seconds=60))
        is True
    )


def test_completed_latch_survives_temporary_readiness_loss() -> None:
    item, _ = coordinator()
    item._pauses = {
        "washer": {
            "kind": "completed",
            "deadline": "2026-11-16T07:00:00+00:00",
        }
    }
    pause = item._pause_active(
        appliance(),
        {"deadline": "2026-11-16T07:00:00+00:00"},
        {"ready": False},
    )
    assert pause is not None
    assert pause["kind"] == "completed"


@pytest.mark.parametrize("result", ["released", "shutdown"])
def test_lifecycle_stop_preserves_interruptible_progress(result: str) -> None:
    item, _ = coordinator()
    owner = {
        "interruptible": True,
        "progress_before_min": 12,
        "required_duration_min": 60,
        "deadline": "2026-11-16T07:00:00+00:00",
    }
    item._record_stop_progress(
        appliance(interruptible=True),
        {"required_duration_min": 60},
        owner,
        {"duration_min": 8},
        result,
        datetime.now(UTC),
    )
    assert item._pauses["washer"]["kind"] == "progress"
    assert item._pauses["washer"]["completed_min"] == 20
    assert item._pauses["washer"]["remaining_min"] == 40


@pytest.mark.parametrize(
    ("configured", "expected_allowed"),
    [(0, True), (None, False), ("not-a-number", False), (float("nan"), False)],
)
def test_grid_guard_keeps_an_explicit_zero_safety_margin(
    monkeypatch, configured, expected_allowed
) -> None:
    item, _ = coordinator()
    monkeypatch.setattr(
        module,
        "grid_measurement",
        lambda _hass, _config: {"fresh": True, "power_w": 0},
    )
    # Exactly enough phase headroom for the load without any margin.
    monkeypatch.setattr(
        module,
        "fuse_headroom_measurement",
        lambda _hass, _config: {"fresh": True, "power_w": 1800},
    )
    config = {} if configured is None else {"grid_safety_margin_w": configured}

    result = item._guard(appliance(), config, {"power_w": 0}, 0, None)

    assert result["allowed"] is expected_allowed
