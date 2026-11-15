"""Safety tests for Smart EV charger execution."""

from __future__ import annotations

import asyncio
import copy
import unittest
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from custom_components.smarthomeshop import ev_coordinator
from custom_components.smarthomeshop.ev_coordinator import (
    SmartEVCoordinator,
    _defer_to_active_shared_control,
    _minimum_controllable_power_w,
)


def _coordinator() -> SmartEVCoordinator:
    coordinator = object.__new__(SmartEVCoordinator)
    coordinator.hass = SimpleNamespace(states=_States({}), data={})
    coordinator._reconcile_failures = set()
    coordinator._reconcile_failed_vehicles = set()
    coordinator._failed_intents = {}
    coordinator._guard_stopped_at = {}
    coordinator._owned_controls = {}
    coordinator._control_pauses = {}
    coordinator._abandoned_control_owners = set()
    coordinator._confirmed_stopped_controls = set()
    coordinator._command_locks = {}
    coordinator._stopping = False
    return coordinator


class _States:
    def __init__(self, values: dict[str, str | tuple[str, dict]]) -> None:
        self._values = values

    def get(self, entity_id: str | None):
        value = self._values.get(str(entity_id))
        state, attributes = value if isinstance(value, tuple) else (value, {})
        return (
            SimpleNamespace(state=state, attributes=attributes)
            if value is not None
            else None
        )


def _safe_measurement(power_w: float = 8_000) -> dict:
    return {
        "entity_id": "sensor.grid_power",
        "power_w": power_w,
        "fresh": True,
    }


def test_switch_requires_headroom_for_the_complete_charge_power(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement()
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 10_000,
            "fresh": True,
            "phase_count": 3,
        },
    )

    result = _coordinator()._guard(
        {
            "control_kind": "switch",
            "charge_power_kw": 11,
            "grid_guard": True,
            "grid_import_limit_w": 10_000,
            "grid_safety_margin_w": 250,
            "power_entity": "sensor.car_power",
        },
        {"power_w": 0, "power_fresh": True},
        "charge",
    )

    assert result["status"] == "blocked"
    assert result["allowed_power_w"] == 0
    assert "cannot safely use" in result["reason"]


def test_current_control_can_reduce_only_to_its_minimum(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement()
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 10_000,
            "fresh": True,
            "phase_count": 3,
        },
    )
    coordinator = _coordinator()
    config = {
        "control_kind": "number",
        "charge_power_kw": 11,
        "grid_guard": True,
        "grid_import_limit_w": 13_000,
        "grid_safety_margin_w": 250,
        "phases": 3,
        "voltage": 230,
        "min_current_a": 6,
        "power_entity": "sensor.car_power",
    }

    limited = coordinator._guard(config, {"power_w": 0, "power_fresh": True}, "charge")
    assert limited["status"] == "limited"
    assert limited["allowed_power_w"] == 4_250

    config["grid_import_limit_w"] = 12_000
    blocked = coordinator._guard(config, {"power_w": 0, "power_fresh": True}, "charge")
    assert blocked["status"] == "blocked"
    assert blocked["allowed_power_w"] == 0


def test_negative_fuse_headroom_reduces_an_existing_charge(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(1_000)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": -500,
            "fresh": True,
            "phase_count": 3,
        },
    )
    coordinator = _coordinator()
    coordinator.hass.states = _States(
        {"number.charger": ("8.7", {"min": 0, "max": 16, "step": 0.1})}
    )

    result = coordinator._guard(
        {
            "control_entity": "number.charger",
            "control_kind": "number",
            "charge_power_kw": 11,
            "grid_guard": True,
            "grid_import_limit_w": 30_000,
            "grid_safety_margin_w": 0,
            "phases": 3,
            "voltage": 230,
            "min_current_a": 6,
            "power_entity": "sensor.car_power",
        },
        {"power_w": 6_000, "power_fresh": True},
        "charge",
    )

    assert result["status"] == "limited"
    assert result["allowed_power_w"] == 4_500


def test_minimum_controllable_power_matches_control_capability() -> None:
    assert _minimum_controllable_power_w({"control_kind": "switch"}, 11_000) == 11_000
    assert (
        _minimum_controllable_power_w(
            {
                "control_kind": "number",
                "phases": 3,
                "voltage": 230,
                "min_current_a": 6,
            },
            11_000,
        )
        == 4_140
    )


def test_ev_guard_budget_includes_outstanding_smart_load_dispatch() -> None:
    coordinator = _coordinator()
    reported = datetime.now(UTC)
    power_state = SimpleNamespace(
        state="500",
        attributes={"unit_of_measurement": "W"},
        last_updated=reported,
        last_reported=reported,
    )
    coordinator.hass.states = SimpleNamespace(
        get=lambda entity_id: power_state
        if entity_id == "sensor.pool_power"
        else None
    )

    class Store:
        def get_smart_loads(self):
            return {
                "loads": [
                    {
                        "id": "pool",
                        "power_entity": "sensor.pool_power",
                        "power_w": 2000,
                    }
                ],
                "control_owners": {
                    "pool": {
                        "expected_power_w": 2000,
                        "command_attempted_at": reported.isoformat(),
                        "reservation_until": (
                            reported + timedelta(seconds=120)
                        ).isoformat(),
                    }
                },
            }

    coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": Store()}}

    assert coordinator._smart_load_dispatch_reservation_w() == 2000


def test_state_of_charge_is_required_but_control_is_optional_for_advice() -> None:
    coordinator = _coordinator()
    coordinator.hass.states = _States({"sensor.car_soc": "54"})

    missing_soc = coordinator._vehicle_state({"control_entity": "switch.charger"})
    advice_only = coordinator._vehicle_state({"soc_entity": "sensor.car_soc"})

    assert missing_soc["required_unavailable"] is True
    assert advice_only["soc"] == 54
    assert advice_only["required_unavailable"] is False


def test_invalid_state_of_charge_is_never_treated_as_zero() -> None:
    coordinator = _coordinator()
    coordinator.hass.states = _States(
        {
            "sensor.nan_soc": "nan",
            "sensor.negative_soc": "-1",
            "sensor.high_soc": "101",
        }
    )

    for entity_id in ("sensor.nan_soc", "sensor.negative_soc", "sensor.high_soc"):
        state = coordinator._vehicle_state({"soc_entity": entity_id})
        assert state["soc"] is None
        assert state["required_unavailable"] is True


def test_missing_fuse_headroom_blocks_automatic_guard(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(1_000)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {"entity_id": None, "power_w": None, "fresh": False},
    )

    result = _coordinator()._guard(
        {"control_kind": "switch", "charge_power_kw": 3.7, "grid_guard": True},
        {"power_w": 0},
        "charge",
    )

    assert result["status"] == "blocked"
    assert "phase headroom" in result["reason"]


def test_three_phase_vehicle_blocks_on_one_observed_p1_phase(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(500)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 7_000,
            "fresh": True,
            "phase_count": 1,
        },
    )

    result = _coordinator()._guard(
        {
            "control_kind": "number",
            "charge_power_kw": 11,
            "grid_guard": True,
            "phases": 3,
            "power_entity": "sensor.car_power",
        },
        {"power_w": 0, "power_fresh": True},
        "charge",
    )

    assert result["status"] == "blocked"
    assert "phase coverage" in result["reason"]


def test_automatic_battery_plan_requires_fresh_live_power(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(500)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 7_000,
            "fresh": True,
            "phase_count": 3,
        },
    )

    result = _coordinator()._guard(
        {
            "control_kind": "number",
            "charge_power_kw": 11,
            "grid_guard": True,
            "phases": 3,
            "power_entity": "sensor.car_power",
        },
        {"power_w": 0, "power_fresh": True},
        "charge",
        battery_data_fresh=False,
    )

    assert result["status"] == "blocked"
    assert "battery" in result["reason"].lower()


def test_home_battery_discharge_blocks_when_support_is_disabled(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(500)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 7_000,
            "fresh": True,
            "phase_count": 3,
        },
    )
    config = {
        "control_kind": "number",
        "charge_power_kw": 11,
        "grid_guard": True,
        "phases": 3,
        "power_entity": "sensor.car_power",
        "allow_home_battery_support": False,
    }

    result = _coordinator()._guard(
        config,
        {"power_w": 0, "power_fresh": True},
        "charge",
        battery_discharging=True,
    )

    assert result["status"] == "blocked"
    assert "battery" in result["reason"].lower()


def test_shared_cycle_budget_is_reserved_between_separate_chargers(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(1_000)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 20_000,
            "fresh": True,
            "phase_count": 3,
        },
    )
    coordinator = _coordinator()
    config = {
        "control_kind": "switch",
        "charge_power_kw": 3.7,
        "grid_guard": True,
        "grid_import_limit_w": 6_000,
        "grid_safety_margin_w": 250,
        "phases": 1,
        "power_entity": "sensor.car_power",
    }

    first = coordinator._guard(config, {"power_w": 0, "power_fresh": True}, "charge")
    second = coordinator._guard(
        config,
        {"power_w": 0, "power_fresh": True},
        "charge",
        reserved_grid_w=first["allowed_power_w"],
        reserved_phase_w=first["allowed_power_w"],
    )

    assert first["status"] == "safe"
    assert second["status"] == "blocked"


def test_existing_ev_load_is_added_back_but_real_overload_forces_stop(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(8_000)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 10_000,
            "fresh": True,
            "phase_count": 3,
        },
    )
    config = {
        "control_kind": "switch",
        "charge_power_kw": 3.7,
        "grid_guard": True,
        "grid_import_limit_w": 6_000,
        "grid_safety_margin_w": 250,
        "phases": 1,
        "power_entity": "sensor.car_power",
    }

    result = _coordinator()._guard(
        config, {"power_w": 3_700, "power_fresh": True}, "charge"
    )

    assert result["status"] == "blocked"
    assert result["allowed_power_w"] == 0


def test_existing_ev_load_does_not_consume_its_budget_twice(monkeypatch) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(11_000)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 2_000,
            "fresh": True,
            "phase_count": 3,
        },
    )
    config = {
        "control_kind": "switch",
        "charge_power_kw": 11,
        "grid_guard": True,
        "grid_import_limit_w": 17_000,
        "grid_safety_margin_w": 250,
        "phases": 3,
        "power_entity": "sensor.car_power",
    }

    result = _coordinator()._guard(
        config, {"power_w": 11_000, "power_fresh": True}, "charge"
    )

    assert result["status"] == "safe"
    assert result["allowed_power_w"] == 11_000


def test_non_modulating_charger_cannot_hide_unsafe_power_with_low_config(
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        ev_coordinator, "grid_measurement", lambda *args: _safe_measurement(1_000)
    )
    monkeypatch.setattr(
        ev_coordinator,
        "fuse_headroom_measurement",
        lambda *args: {
            "entity_id": "sensor.fuse_headroom",
            "power_w": 10_000,
            "fresh": True,
            "phase_count": 3,
        },
    )

    result = _coordinator()._guard(
        {
            "control_kind": "switch",
            "charge_power_kw": 3.7,
            "grid_guard": True,
            "grid_import_limit_w": 17_000,
            "phases": 3,
            "power_entity": "sensor.car_power",
        },
        {"power_w": 11_000, "power_fresh": True},
        "charge",
    )

    assert result["status"] == "blocked"
    assert "configured charger power" in result["reason"]


def test_current_setpoint_uses_entity_step_without_rounding_up() -> None:
    coordinator = _coordinator()
    coordinator.hass.states = _States(
        {"number.wallbox": ("6", {"min": 6, "max": 32, "step": 1})}
    )

    assert (
        coordinator._normalise_number_setpoint("number.wallbox", 15.9, round_down=True)
        == 15
    )
    assert not coordinator._number_can_stop(
        {
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "off_current_a": 0,
        }
    )


def test_inactive_car_never_stops_an_active_shared_charger() -> None:
    config = {"control_entity": "switch.shared_wallbox"}
    active_controls = {"switch.shared_wallbox"}

    assert _defer_to_active_shared_control(
        config, {"action": "hold"}, "automatic", active_controls
    )
    assert not _defer_to_active_shared_control(
        config, {"action": "charge"}, "automatic", active_controls
    )
    assert not _defer_to_active_shared_control(
        config, {"action": "hold"}, "shadow", active_controls
    )


class TestControlTransactions(unittest.IsolatedAsyncioTestCase):
    async def test_number_is_confirmed_before_stop_switch_is_energised(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "number.current": ("0", {"min": 0, "max": 16, "step": 1}),
                "switch.enable": "off",
            }
        )
        coordinator._owned_controls = {}
        events: list[str] = []
        coordinator._intent_authorised = lambda *_args: True
        coordinator._remember_owner = lambda _config, *_args, **_kwargs: events.append(
            "remember"
        )
        coordinator._persist_owners = AsyncMock(
            side_effect=lambda: events.append("persist")
        )

        async def send(entity_id, _kind, _desired):
            events.append(f"send:{entity_id}")

        async def wait(entity_id, _kind, _desired):
            events.append(f"confirm:{entity_id}")
            return True

        coordinator._send_control = send
        coordinator._wait_target = wait
        config = {
            "id": "car",
            "control_entity": "number.current",
            "control_kind": "number",
            "stop_entity": "switch.enable",
        }

        await coordinator._send_transaction(
            config,
            "charge",
            [
                ("number.current", "number", 6),
                ("switch.enable", "switch", True),
            ],
        )

        self.assertEqual(
            events,
            [
                "remember",
                "persist",
                "send:number.current",
                "confirm:number.current",
                "send:switch.enable",
                "confirm:switch.enable",
            ],
        )

    async def test_transaction_rechecks_authorisation_before_every_step(self) -> None:
        coordinator = _coordinator()
        coordinator._owned_controls = {}
        decisions = iter((True, False))
        coordinator._intent_authorised = lambda *_args: next(decisions)
        coordinator._remember_owner = lambda _config, *_args, **_kwargs: None
        coordinator._persist_owners = AsyncMock()
        coordinator._send_control = AsyncMock()
        coordinator._wait_target = AsyncMock(return_value=True)

        with self.assertRaises(ev_coordinator._IntentCancelled):
            await coordinator._send_transaction(
                {"id": "car", "control_entity": "number.current"},
                "charge",
                [
                    ("number.current", "number", 6),
                    ("switch.enable", "switch", True),
                ],
            )

        coordinator._send_control.assert_not_awaited()

    async def test_transaction_rechecks_live_safety_before_every_step(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "number.current": ("0", {"min": 0, "max": 16, "step": 1}),
                "switch.enable": "off",
            }
        )
        coordinator._intent_authorised = lambda *_args: True
        coordinator._remember_owner = lambda *_args, **_kwargs: None
        coordinator._persist_owners = AsyncMock()
        coordinator._send_control = AsyncMock()
        coordinator._wait_target = AsyncMock(return_value=True)
        safety = AsyncMock(
            side_effect=(None, ev_coordinator._SafetyBlocked("P1 became stale"))
        )

        with self.assertRaisesRegex(ev_coordinator._SafetyBlocked, "P1 became stale"):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "number.current",
                    "control_kind": "number",
                    "stop_entity": "switch.enable",
                },
                "charge",
                [
                    ("number.current", "number", 6),
                    ("switch.enable", "switch", True),
                ],
                safety_check=safety,
            )

        coordinator._send_control.assert_awaited_once_with(
            "number.current", "number", 6
        )
        self.assertEqual(safety.await_count, 2)

    async def test_route_change_must_release_old_control_before_new_use(self) -> None:
        coordinator = _coordinator()
        coordinator._owned_controls = {
            "switch.old": {
                "vehicle_id": "car",
                "config": {
                    "id": "car",
                    "control_entity": "switch.old",
                    "control_kind": "switch",
                },
            }
        }
        coordinator._reconcile_failures = set()
        coordinator._release_owner = AsyncMock(return_value=False)

        await coordinator._reconcile_control_owners(
            [
                {
                    "id": "car",
                    "enabled": True,
                    "control_entity": "switch.new",
                    "control_kind": "switch",
                }
            ],
            automatic=True,
        )

        coordinator._release_owner.assert_awaited_once_with("switch.old")
        self.assertEqual(coordinator._reconcile_failures, {"switch.old"})
        self.assertEqual(coordinator._reconcile_failed_vehicles, {"car"})

    async def test_real_task_cancellation_is_not_swallowed(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "on"})
        config = {
            "id": "car",
            "control_entity": "switch.charger",
            "control_kind": "switch",
        }
        coordinator._owned_controls = {
            "switch.charger": {
                "vehicle_id": "car",
                "config": dict(config),
            }
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._send_control = AsyncMock(side_effect=asyncio.CancelledError)
        coordinator._wait_target = AsyncMock(return_value=True)

        with self.assertRaises(asyncio.CancelledError):
            await coordinator._send_transaction(
                config, "charge", [("switch.charger", "switch", True)]
            )

    async def test_each_energising_retry_requires_durable_ownership(self) -> None:
        coordinator = _coordinator()
        coordinator._owned_controls = {}
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock(side_effect=RuntimeError("disk full"))
        coordinator._send_control = AsyncMock()

        for _ in range(2):
            with self.assertRaises(ev_coordinator._OwnershipPersistenceFailed):
                await coordinator._send_transaction(
                    {"id": "car", "control_entity": "switch.charger"},
                    "charge",
                    [("switch.charger", "switch", True)],
                    expected_power_w=3_700,
                )

        self.assertEqual(coordinator._persist_owners.await_count, 2)
        coordinator._send_control.assert_not_awaited()

    async def test_external_start_during_ownership_save_is_never_claimed(self) -> None:
        coordinator = _coordinator()
        states = {"switch.charger": "off"}
        coordinator.hass.states = _States(states)
        coordinator._intent_authorised = lambda *_args: True

        async def persist():
            states["switch.charger"] = "on"

        coordinator._persist_owners = AsyncMock(side_effect=persist)
        coordinator._send_control = AsyncMock()

        with self.assertRaises(ev_coordinator._ExternalControl):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )

        self.assertNotIn("switch.charger", coordinator._owned_controls)
        self.assertEqual(coordinator._persist_owners.await_count, 2)
        coordinator._send_control.assert_not_awaited()

    async def test_owned_number_can_stop_when_number_is_unavailable(self) -> None:
        coordinator = _coordinator()
        states = {"switch.stop": "on"}
        coordinator.hass.states = _States(states)
        coordinator._owned_controls = {
            "number.current": {
                "vehicle_id": "car",
                "config": {
                    "id": "car",
                    "control_entity": "number.current",
                    "control_kind": "number",
                    "stop_entity": "switch.stop",
                },
            }
        }
        coordinator._command_locks = {}

        async def send(entity_id, _kind, desired):
            states[entity_id] = "on" if desired else "off"

        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)
        coordinator._persist_owners = AsyncMock()

        released = await coordinator._release_owner("number.current")

        self.assertTrue(released)
        self.assertEqual(states["switch.stop"], "off")
        self.assertNotIn("number.current", coordinator._owned_controls)

    async def test_missing_stop_switch_reduces_current_but_retains_owner(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {"number.current": ("12", {"min": 6, "max": 16, "step": 1})}
        )
        coordinator._owned_controls = {
            "number.current": {
                "vehicle_id": "car",
                "config": {
                    "id": "car",
                    "control_entity": "number.current",
                    "control_kind": "number",
                    "stop_entity": "switch.stop",
                },
            }
        }
        coordinator._send_control = AsyncMock()
        coordinator._wait_target = AsyncMock(return_value=True)

        released = await coordinator._release_owner("number.current")

        self.assertFalse(released)
        coordinator._send_control.assert_awaited_once_with(
            "number.current", "number", 6
        )
        self.assertIn("number.current", coordinator._owned_controls)


def test_battery_transition_from_discharge_to_idle_reserves_full_swing(
    monkeypatch,
) -> None:
    coordinator = _coordinator()
    now = datetime(2026, 11, 9, 12, tzinfo=UTC)

    class Store:
        def get_battery(self):
            return {"enabled": True, "execution_mode": "automatic"}

    coordinator.hass.data = {
        ev_coordinator.DOMAIN: {
            "store": Store(),
            "battery_plan": SimpleNamespace(
                data={
                    "execution_mode": "automatic",
                    "status": "ready",
                    "calculated_at": ev_coordinator.dt_util.utcnow().isoformat(),
                    "timeline": [
                        {
                            "start": (now.replace(hour=11)).isoformat(),
                            "end": (now.replace(hour=13)).isoformat(),
                            "power_w": 0,
                        }
                    ],
                }
            ),
        }
    }
    monkeypatch.setattr(
        ev_coordinator,
        "battery_power_measurement",
        lambda _hass, _max_age: {"power_w": -3_000, "fresh": True},
    )

    assert coordinator._current_battery_reservation_w(now) == (
        3_000,
        3_000,
        True,
        True,
    )


def test_missing_automatic_battery_power_is_fail_safe(monkeypatch) -> None:
    coordinator = _coordinator()
    now = datetime(2026, 11, 9, 12, tzinfo=UTC)

    class Store:
        def get_battery(self):
            return {"enabled": True, "execution_mode": "automatic"}

    coordinator.hass.data = {
        ev_coordinator.DOMAIN: {
            "store": Store(),
            "battery_plan": SimpleNamespace(
                data={
                    "execution_mode": "automatic",
                    "status": "ready",
                    "calculated_at": ev_coordinator.dt_util.utcnow().isoformat(),
                    "timeline": [],
                }
            ),
        }
    }
    monkeypatch.setattr(
        ev_coordinator,
        "battery_power_measurement",
        lambda _hass, _max_age: {"power_w": None, "fresh": False},
    )

    assert coordinator._current_battery_reservation_w(now) == (
        0.0,
        0.0,
        False,
        False,
    )


def test_missing_live_automatic_battery_plan_is_fail_safe() -> None:
    coordinator = _coordinator()
    now = datetime(2026, 11, 9, 12, tzinfo=UTC)

    class Store:
        def get_battery(self):
            return {"enabled": True, "execution_mode": "automatic"}

    coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": Store()}}

    assert coordinator._current_battery_reservation_w(now) == (
        0.0,
        0.0,
        False,
        False,
    )


def test_nonautomatic_battery_discharge_is_still_reported(monkeypatch) -> None:
    coordinator = _coordinator()

    class Store:
        def get_battery(self):
            return {"enabled": False, "execution_mode": "advice"}

    coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": Store()}}
    monkeypatch.setattr(
        ev_coordinator,
        "battery_power_measurement",
        lambda _hass, _max_age: {"power_w": -700, "fresh": True},
    )

    assert coordinator._current_battery_reservation_w(datetime.now(UTC)) == (
        0.0,
        0.0,
        True,
        True,
    )


def test_stale_automatic_battery_plan_is_fail_safe(monkeypatch) -> None:
    coordinator = _coordinator()

    class Store:
        def get_battery(self):
            return {"enabled": True, "execution_mode": "automatic"}

    coordinator.hass.data = {
        ev_coordinator.DOMAIN: {
            "store": Store(),
            "battery_plan": SimpleNamespace(
                data={
                    "execution_mode": "automatic",
                    "status": "ready",
                    "calculated_at": (
                        ev_coordinator.dt_util.utcnow() - timedelta(minutes=20)
                    ).isoformat(),
                    "timeline": [],
                }
            ),
        }
    }
    measurement = Mock(return_value={"power_w": 0, "fresh": True})
    monkeypatch.setattr(ev_coordinator, "battery_power_measurement", measurement)

    assert coordinator._current_battery_reservation_w(datetime.now(UTC)) == (
        0.0,
        0.0,
        False,
        False,
    )
    measurement.assert_not_called()


def test_complete_cycle_accepts_the_refreshed_reservation_ledger(monkeypatch) -> None:
    coordinator = _coordinator()
    coordinator._last_actions = {}
    coordinator._last_runtime_fingerprint = ""
    config = {
        "enabled": True,
        "execution_mode": "advice",
        "vehicles": [{"id": "car", "mode": "smart", "charge_power_kw": 3.7}],
        "learning": {},
        "plans": {},
    }
    coordinator._config = lambda: config
    coordinator._vehicle_state = lambda _config: {
        "soc": 50,
        "plugged": True,
        "home": True,
        "power_w": 0,
        "power_fresh": False,
    }
    coordinator._learn = lambda _prepared, _previous: {}
    coordinator._enriched_rows = list
    coordinator._current_battery_reservation_w = lambda _now: (0.0, 0.0, True, False)
    coordinator._reconcile_control_owners = AsyncMock()
    monkeypatch.setattr(
        ev_coordinator,
        "plan_household",
        lambda *_args, **_kwargs: {
            "car": {"vehicle_id": "car", "action": "hold", "status": "idle"}
        },
    )

    result = asyncio.run(coordinator._async_update_locked(calendar_rules={}))

    assert result["plans"]["car"]["guard"]["status"] == "inactive"


def test_one_vehicle_failure_does_not_skip_later_safety_work(monkeypatch) -> None:
    coordinator = _coordinator()
    coordinator._last_actions = {}
    coordinator._last_runtime_fingerprint = ""
    config = {
        "enabled": True,
        "execution_mode": "automatic",
        "vehicles": [
            {"id": "car-a", "mode": "smart", "charge_power_kw": 3.7},
            {"id": "car-b", "mode": "smart", "charge_power_kw": 3.7},
        ],
        "learning": {},
        "plans": {},
    }
    coordinator._config = lambda: config
    coordinator._vehicle_state = lambda _config: {
        "soc": 50,
        "plugged": True,
        "home": True,
        "power_w": 0,
        "power_fresh": True,
    }
    coordinator._learn = lambda _prepared, _previous: {}
    coordinator._enriched_rows = list
    coordinator._current_battery_reservation_w = lambda _now: (0.0, 0.0, True, False)
    coordinator._reconcile_control_owners = AsyncMock()
    coordinator._guard = Mock(
        return_value={"status": "inactive", "allowed_power_w": 3_700}
    )
    plans = {
        "car-a": {"vehicle_id": "car-a", "action": "hold", "status": "idle"},
        "car-b": {"vehicle_id": "car-b", "action": "hold", "status": "idle"},
    }
    monkeypatch.setattr(
        ev_coordinator,
        "plan_household",
        lambda *_args, **_kwargs: plans,
    )

    async def apply(config, _state, plan, _mode, **_kwargs):
        if config["id"] == "car-a":
            raise RuntimeError("storage unavailable")
        plan["execution"] = {"status": "idle"}
        return plan

    coordinator._apply = AsyncMock(side_effect=apply)

    result = asyncio.run(coordinator._async_update_locked(calendar_rules={}))

    assert coordinator._apply.await_count == 2
    assert result["plans"]["car-a"]["execution"]["status"] == "not_following"
    assert result["plans"]["car-b"]["execution"]["status"] == "idle"


def test_complete_cycle_uses_the_resolved_weekday_or_calendar_target(
    monkeypatch,
) -> None:
    coordinator = _coordinator()
    coordinator._last_actions = {}
    coordinator._last_runtime_fingerprint = ""
    config = {
        "enabled": True,
        "execution_mode": "advice",
        "vehicles": [
            {
                "id": "car",
                "mode": "smart",
                "target_soc": 80,
                "charge_power_kw": 3.7,
                "grid_guard": False,
            }
        ],
        "learning": {},
        "plans": {},
    }
    coordinator._config = lambda: config
    coordinator._vehicle_state = lambda _config: {
        "soc": 85,
        "target_soc": None,
        "plugged": True,
        "home": True,
        "power_w": 0,
        "power_fresh": True,
    }
    coordinator._learn = lambda _prepared, _previous: {}
    coordinator._enriched_rows = list
    coordinator._current_battery_reservation_w = lambda _now: (0.0, 0.0, True, False)
    coordinator._reconcile_control_owners = AsyncMock()
    monkeypatch.setattr(
        ev_coordinator,
        "plan_household",
        lambda *_args, **_kwargs: {
            "car": {
                "vehicle_id": "car",
                "target_soc": 90,
                "action": "charge",
                "status": "charging",
            }
        },
    )

    result = asyncio.run(coordinator._async_update_locked(calendar_rules={}))

    assert result["plans"]["car"]["action"] == "charge"
    assert result["plans"]["car"]["guard"]["status"] == "inactive"


class TestPersistentSafetyPauses(unittest.IsolatedAsyncioTestCase):
    async def test_guard_cooldown_is_restored_after_restart(self) -> None:
        coordinator = _coordinator()
        stopped_at = ev_coordinator.dt_util.utcnow().isoformat()
        coordinator._load_control_owners(
            {
                "control_owners": {},
                "control_pauses": {},
                "guard_stopped_at": {"switch.charger": stopped_at},
            }
        )
        coordinator.hass.states = _States({"switch.charger": "off"})

        plan = await coordinator._apply(
            {
                "id": "car",
                "mode": "smart",
                "control_entity": "switch.charger",
                "control_kind": "switch",
                "charge_power_kw": 3.7,
            },
            {"charging": False, "power_w": 0, "plugged": True},
            {"action": "charge"},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )

        self.assertEqual(plan["execution"]["status"], "cooldown")

    async def test_manual_pause_survives_reload_until_mode_changes(self) -> None:
        coordinator = _coordinator()
        config = {
            "id": "car",
            "mode": "smart",
            "control_entity": "switch.charger",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
        }
        coordinator._control_pauses = {
            "switch.charger": {
                "vehicle_id": "car",
                "kind": "manual",
                "reason": "Manual stop",
                "signature": coordinator._control_pause_signature(config),
            }
        }
        coordinator.hass.states = _States({"switch.charger": "off"})

        paused = await coordinator._apply(
            config,
            {"charging": False, "power_w": 0, "plugged": True},
            {"action": "charge"},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )
        self.assertEqual(paused["execution"]["status"], "manual_override")

        changed = {**config, "mode": "charge_now"}
        coordinator._persist_owners = AsyncMock()
        self.assertIsNone(
            await coordinator._active_control_pause(changed, {"plugged": True})
        )
        self.assertNotIn("switch.charger", coordinator._control_pauses)

    async def test_live_vehicle_state_is_checked_before_every_start_step(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "number.current": ("0", {"min": 0, "max": 32, "step": 1}),
                "switch.enable": "off",
            }
        )
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        coordinator._wait_target = AsyncMock(return_value=True)
        coordinator._send_control = AsyncMock()
        safety = AsyncMock(
            side_effect=[None, None, ev_coordinator._SafetyBlocked("unplugged")]
        )

        with self.assertRaises(ev_coordinator._SafetyBlocked):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "number.current",
                    "control_kind": "number",
                    "stop_entity": "switch.enable",
                },
                "charge",
                [
                    ("number.current", "number", 10),
                    ("switch.enable", "switch", True),
                ],
                expected_power_w=6_900,
                safety_check=safety,
            )

        coordinator._send_control.assert_awaited_once_with(
            "number.current", "number", 10
        )

    async def test_unplugging_between_number_and_enable_write_blocks_relay(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "number.current": ("0", {"min": 0, "max": 32, "step": 1}),
            "switch.enable": "off",
        }
        coordinator.hass.states = _States(states)
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        coordinator._refresh_guard_context = lambda context: context or {}
        safe_state = {
            "soc": 40,
            "target_soc": 80,
            "plugged": True,
            "home": True,
            "power_w": 0,
            "power_fresh": True,
        }
        unplugged_state = {**safe_state, "plugged": False}
        coordinator._vehicle_state = Mock(
            side_effect=[safe_state, safe_state, unplugged_state]
        )

        def guard(_config, state, _action, **_context):
            return (
                {
                    "status": "blocked",
                    "allowed_power_w": 0,
                    "reason": "The charging cable is not connected",
                }
                if state.get("plugged") is False
                else {"status": "safe", "allowed_power_w": 6_900}
            )

        coordinator._guard = guard
        writes = []

        async def send(entity_id, kind, desired):
            writes.append((entity_id, kind, desired))
            previous = states.get(entity_id)
            attributes = previous[1] if isinstance(previous, tuple) else {}
            value = (
                "on"
                if kind == "switch" and desired
                else "off"
                if kind == "switch"
                else str(desired)
            )
            states[entity_id] = (value, attributes) if attributes else value

        coordinator._send_control = send

        plan = await coordinator._apply(
            {
                "id": "car",
                "enabled": True,
                "mode": "charge_now",
                "control_entity": "number.current",
                "control_kind": "number",
                "stop_entity": "switch.enable",
                "charge_power_kw": 6.9,
                "min_current_a": 6,
                "max_current_a": 32,
                "phases": 3,
                "voltage": 230,
            },
            safe_state,
            {"action": "charge"},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 6_900},
            guard_context={},
        )

        self.assertEqual(plan["execution"]["status"], "blocked_by_grid")
        self.assertEqual(writes, [])
        self.assertNotIn("number.current", coordinator._owned_controls)


def test_limited_guard_session_is_not_learned_as_full_vehicle_power() -> None:
    coordinator = _coordinator()
    coordinator._owned_controls = {
        "number.charger": {
            "vehicle_id": "car",
            "expected_power_w": 4_140,
        }
    }
    previous = {
        "car": {
            "charge_power_kw": 11,
            "last_sample": {
                "at": (datetime.now(UTC) - timedelta(minutes=30)).isoformat(),
                "soc": 40,
            },
        }
    }
    result = coordinator._learn(
        [
            {
                "config": {
                    "id": "car",
                    "control_entity": "number.charger",
                    "charge_power_kw": 11,
                },
                "state": {"charging": True, "power_w": 4_000, "soc": 42},
            }
        ],
        previous,
    )

    assert result["car"]["charge_power_kw"] == 11
    assert "speed_pct_per_hour" not in result["car"]
    assert result["car"]["last_sample"]["soc"] == 42


def test_runtime_fingerprint_ignores_moving_active_segment_start() -> None:
    coordinator = _coordinator()
    base = {
        "car": {
            "action": "charge",
            "status": "charging",
            "segments": [
                {
                    "start": "2026-11-09T12:00:00+00:00",
                    "end": "2026-11-09T13:00:00+00:00",
                    "price": 0.2,
                    "predicted": False,
                }
            ],
        }
    }
    moved = {
        "car": {
            **base["car"],
            "segments": [
                {**base["car"]["segments"][0], "start": "2026-11-09T12:01:00+00:00"}
            ],
        }
    }

    assert coordinator._runtime_plan_fingerprint(
        base
    ) == coordinator._runtime_plan_fingerprint(moved)


def test_load_series_uses_weekday_hour_profile() -> None:
    coordinator = _coordinator()

    class Store:
        def get_energy_learning(self):
            return {"model": {"use": {"load_profile": {"0:12": 1.75}}}}

        def get_smart_ev(self):
            return {"vehicles": []}

    coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": Store()}}

    assert coordinator._load_series(["2026-11-09T12:00:00+00:00"]) == [1.75]


def test_live_load_fallback_subtracts_ev_and_battery_feedback(monkeypatch) -> None:
    coordinator = _coordinator()
    now = datetime.now(UTC)
    power_state = SimpleNamespace(
        state="3000",
        attributes={"unit_of_measurement": "W"},
        last_updated=now,
        last_reported=now,
    )
    coordinator.hass.states = SimpleNamespace(
        get=lambda entity_id: power_state if entity_id == "sensor.ev_power" else None
    )

    class Store:
        def get_energy_learning(self):
            return {"model": {"use": {}}}

        def get_smart_ev(self):
            return {"vehicles": [{"power_entity": "sensor.ev_power"}]}

    coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": Store()}}
    monkeypatch.setattr(
        ev_coordinator,
        "grid_measurement",
        lambda _hass: {"power_w": 5_000, "fresh": True},
    )
    monkeypatch.setattr(ev_coordinator, "solar_power_w", lambda _hass: 2_000)
    monkeypatch.setattr(ev_coordinator, "current_battery_power_w", lambda _hass: 1_000)

    assert coordinator._load_series(["2026-11-09T12:00:00+00:00"]) == [3.0]


def test_ev_plan_reserves_smart_load_power() -> None:
    coordinator = _coordinator()
    row = {
        "start": "2026-11-09T12:00:00+00:00",
        "end": "2026-11-09T13:00:00+00:00",
        "consumer": 0.2,
    }
    coordinator._price_rows = lambda: [row]
    coordinator._solar_series = lambda _starts: [0.0]
    coordinator._load_series = lambda _starts: [0.5]
    coordinator._battery_targets = lambda _rows: [0.0]
    coordinator.hass.data = {
        ev_coordinator.DOMAIN: {
            "smart_loads": SimpleNamespace(
                data={
                    "plans": {
                        "dishwasher": {
                            "power_w": 1200,
                            "segments": [
                                {
                                    "start": "2026-11-09T12:15:00+00:00",
                                    "end": "2026-11-09T12:45:00+00:00",
                                }
                            ],
                        }
                    }
                }
            )
        }
    }

    result = coordinator._enriched_rows()

    assert result[0]["load_kw"] == 1.7
    assert result[0]["smart_load_reserved_w"] == 1200


class TestNeutralExecutionStatus(unittest.IsolatedAsyncioTestCase):
    async def test_failed_shared_charger_transfer_restores_previous_owner(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "on"})
        previous = {
            "vehicle_id": "first",
            "config": {
                "id": "first",
                "control_entity": "switch.charger",
                "control_kind": "switch",
            },
        }
        coordinator._owned_controls = {"switch.charger": dict(previous)}
        coordinator._persist_owners = AsyncMock(side_effect=RuntimeError("disk full"))

        plan = await coordinator._apply(
            {
                "id": "second",
                "control_entity": "switch.charger",
                "control_kind": "switch",
                "charge_power_kw": 3.7,
            },
            {"charging": True, "power_w": 3_700, "plugged": True},
            {"action": "charge"},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )

        self.assertEqual(plan["execution"]["status"], "not_following")
        self.assertEqual(
            coordinator._owned_controls["switch.charger"]["vehicle_id"],
            "first",
        )

    async def test_inactive_unowned_charger_is_neutral_idle(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "off"})
        coordinator._owned_controls = {}

        plan = await coordinator._apply(
            {
                "id": "car",
                "control_entity": "switch.charger",
                "control_kind": "switch",
            },
            {"charging": False, "power_w": 0},
            {"action": "hold", "reason": "No charging is needed"},
            "automatic",
            guard_override={"status": "inactive", "allowed_power_w": 0},
        )

        self.assertEqual(plan["execution"]["status"], "idle")
        self.assertEqual(plan["execution"]["reason"], "No charging is needed")

    async def test_externally_active_session_is_reported_but_not_stopped(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "on"})
        coordinator._owned_controls = {}
        coordinator._release_owner = AsyncMock()

        plan = await coordinator._apply(
            {
                "id": "car",
                "control_entity": "switch.charger",
                "control_kind": "switch",
            },
            {"charging": True, "power_w": 3_000},
            {"action": "hold", "reason": "Waiting for selected period"},
            "automatic",
            guard_override={"status": "inactive", "allowed_power_w": 0},
        )

        self.assertEqual(plan["execution"]["status"], "external_control")
        coordinator._release_owner.assert_not_awaited()

    async def test_charge_request_never_changes_an_external_session(self) -> None:
        cases = (
            (
                {"number.charger": ("8", {"min": 6, "max": 32, "step": 1})},
                {
                    "control_entity": "number.charger",
                    "control_kind": "number",
                    "min_current_a": 6,
                    "max_current_a": 32,
                },
            ),
            (
                {"number.charger": ("20", {"min": 6, "max": 32, "step": 1})},
                {
                    "control_entity": "number.charger",
                    "control_kind": "number",
                    "min_current_a": 6,
                    "max_current_a": 32,
                },
            ),
            (
                {"select.charger": "Charge"},
                {
                    "control_entity": "select.charger",
                    "control_kind": "select",
                    "charge_option": "Charge",
                },
            ),
        )
        for states, route in cases:
            with self.subTest(route=route):
                coordinator = _coordinator()
                coordinator.hass.states = _States(states)
                coordinator._owned_controls = {}
                coordinator._send_control = AsyncMock()
                plan = await coordinator._apply(
                    {"id": "car", "charge_power_kw": 11, **route},
                    {"charging": True, "power_w": 3_000},
                    {"action": "charge"},
                    "automatic",
                    guard_override={"status": "safe", "allowed_power_w": 11_000},
                )
                self.assertEqual(plan["execution"]["status"], "external_control")
                self.assertNotIn(route["control_entity"], coordinator._owned_controls)
                coordinator._send_control.assert_not_awaited()

    async def test_owned_unavailable_number_uses_stored_stop_route(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.stop": "on"})
        coordinator._owned_controls = {
            "number.charger": {
                "vehicle_id": "car",
                "config": {
                    "id": "car",
                    "control_entity": "number.charger",
                    "control_kind": "number",
                    "stop_entity": "switch.stop",
                },
            }
        }
        coordinator._release_owner = AsyncMock(return_value=True)

        plan = await coordinator._apply(
            {
                "id": "car",
                "control_entity": "number.charger",
                "control_kind": "number",
                "stop_entity": "switch.stop",
            },
            {"charging": False, "power_w": 0},
            {"action": "charge"},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 1_380},
        )

        self.assertEqual(plan["execution"]["status"], "stopped")
        coordinator._release_owner.assert_awaited_once_with("number.charger")

    async def test_confirmed_setpoint_without_physical_reduction_stops(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "number.charger": ("6", {"min": 6, "max": 32, "step": 1}),
                "switch.stop": "on",
            }
        )
        coordinator._owned_controls = {
            "number.charger": {
                "vehicle_id": "car",
                "started_at": (datetime.now(UTC) - timedelta(minutes=5)).isoformat(),
                "commanded_at": (datetime.now(UTC) - timedelta(minutes=3)).isoformat(),
                "unmet_since": (datetime.now(UTC) - timedelta(minutes=3)).isoformat(),
                "expected_power_w": 4_140,
                "config": {
                    "id": "car",
                    "control_entity": "number.charger",
                    "control_kind": "number",
                    "stop_entity": "switch.stop",
                },
            }
        }
        coordinator._release_owner = AsyncMock(return_value=True)

        plan = await coordinator._apply(
            {
                "id": "car",
                "control_entity": "number.charger",
                "control_kind": "number",
                "stop_entity": "switch.stop",
                "charge_power_kw": 11,
                "phases": 3,
                "voltage": 230,
                "min_current_a": 6,
                "max_current_a": 32,
            },
            {"charging": True, "power_w": 8_000},
            {"action": "charge"},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 4_140},
        )

        self.assertEqual(plan["execution"]["status"], "safety_lockout")
        coordinator._release_owner.assert_awaited_once_with(
            "number.charger", persist=False
        )
        self.assertEqual(
            coordinator._control_pauses["number.charger"]["kind"], "safety"
        )

    async def test_retry_rechecks_guard_and_never_reuses_stale_targets(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "off"})
        coordinator._owned_controls = {}
        coordinator._command_locks = {}
        coordinator._failed_intents = {}
        coordinator._intent_authorised = lambda *_args: True
        coordinator._vehicle_state = lambda _config: {
            "charging": False,
            "power_w": 0,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            side_effect=(
                {"status": "safe", "allowed_power_w": 3_700},
                {
                    "status": "blocked",
                    "allowed_power_w": 0,
                    "reason": "P1 telemetry became stale",
                },
            )
        )
        coordinator._send_transaction = AsyncMock(
            side_effect=RuntimeError("first command failed")
        )

        plan = await coordinator._apply(
            {
                "id": "car",
                "enabled": True,
                "mode": "charge_now",
                "control_entity": "switch.charger",
                "control_kind": "switch",
                "charge_power_kw": 3.7,
            },
            {"charging": False, "power_w": 0, "power_fresh": True},
            {"action": "charge"},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )

        self.assertEqual(plan["execution"]["status"], "blocked_by_grid")
        self.assertEqual(coordinator._send_transaction.await_count, 1)

    async def test_blocked_retry_while_holding_command_lock_never_deadlocks(
        self,
    ) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "number.charger": ("10", {"min": 6, "max": 32, "step": 1}),
                "switch.enable": "on",
            }
        )
        config = {
            "id": "car",
            "enabled": True,
            "mode": "charge_now",
            "control_entity": "number.charger",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "min_current_a": 6,
            "max_current_a": 32,
            "phases": 1,
            "voltage": 230,
            "charge_power_kw": 3.7,
        }
        coordinator._owned_controls = {
            "number.charger": {
                "vehicle_id": "car",
                "expected_power_w": 3_700,
                "config": dict(config),
            }
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._vehicle_state = lambda _config: {
            "charging": True,
            "power_w": 2_000,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            side_effect=(
                {"status": "safe", "allowed_power_w": 3_700},
                {
                    "status": "blocked",
                    "allowed_power_w": 0,
                    "reason": "P1 telemetry became stale",
                },
            )
        )
        coordinator._send_transaction = AsyncMock(
            side_effect=RuntimeError("first command failed")
        )
        coordinator._emergency_stop = AsyncMock(return_value=False)

        plan = await asyncio.wait_for(
            coordinator._apply(
                config,
                {"charging": True, "power_w": 2_000, "power_fresh": True},
                {"action": "charge"},
                "automatic",
                guard_override={"status": "safe", "allowed_power_w": 3_700},
            ),
            timeout=1,
        )

        self.assertEqual(plan["execution"]["status"], "not_following")
        self.assertEqual(coordinator._emergency_stop.await_count, 1)

    async def test_failed_start_backoff_expires_after_five_minutes(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "off"})
        coordinator._owned_controls = {}
        coordinator._intent_authorised = lambda *_args: True
        coordinator._vehicle_state = lambda _config: {
            "charging": False,
            "power_w": 0,
            "power_fresh": True,
        }
        coordinator._guard = lambda *_args, **_kwargs: {
            "status": "safe",
            "allowed_power_w": 3_700,
        }
        coordinator._send_transaction = AsyncMock()
        intent = repr([("switch.charger", "switch", True)])
        coordinator._failed_intents["switch.charger"] = (
            intent,
            ev_coordinator.dt_util.utcnow(),
        )
        config = {
            "id": "car",
            "enabled": True,
            "mode": "charge_now",
            "control_entity": "switch.charger",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
        }

        blocked = await coordinator._apply(
            config,
            {"charging": False, "power_w": 0, "power_fresh": True},
            {"action": "charge"},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )
        self.assertEqual(blocked["execution"]["status"], "confirmation_wait")
        coordinator._send_transaction.assert_not_awaited()

        coordinator._failed_intents["switch.charger"] = (
            intent,
            ev_coordinator.dt_util.utcnow() - timedelta(seconds=301),
        )
        retried = await coordinator._apply(
            config,
            {"charging": False, "power_w": 0, "power_fresh": True},
            {"action": "charge"},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )

        self.assertNotEqual(retried["execution"]["status"], "confirmation_wait")
        coordinator._send_transaction.assert_awaited_once()


class TestCalendarSafety(unittest.IsolatedAsyncioTestCase):
    async def test_hanging_calendar_is_bounded_and_falls_back_to_state(
        self,
    ) -> None:
        async def hanging_call(*_args, **_kwargs):
            await asyncio.sleep(1)

        calendar_state = SimpleNamespace(
            attributes={
                "summary": "Charge 90%",
                "start_time": "2026-11-10T07:00:00+01:00",
            }
        )
        hass = SimpleNamespace(
            states=SimpleNamespace(get=lambda _entity: calendar_state),
            services=SimpleNamespace(
                has_service=lambda *_args: True,
                async_call=hanging_call,
            ),
        )
        original = ev_coordinator._CALENDAR_TIMEOUT
        ev_coordinator._CALENDAR_TIMEOUT = 0.01
        try:
            deadline, target = await ev_coordinator._calendar_rule(
                hass,
                {
                    "calendar_entity": "calendar.car",
                    "calendar_keyword": "charge",
                },
                datetime(2026, 11, 9, 12, tzinfo=UTC),
            )
        finally:
            ev_coordinator._CALENDAR_TIMEOUT = original

        self.assertEqual(deadline, datetime(2026, 11, 10, 6, tzinfo=UTC))
        self.assertEqual(target, 90)


def test_guard_uses_resolved_plan_target_and_live_entity_cap() -> None:
    coordinator = _coordinator()
    config = {"target_soc": 80, "grid_guard": False, "charge_power_kw": 3.7}

    below_planned = coordinator._guard(
        config,
        {"soc": 85, "target_soc": None},
        "charge",
        target_soc=90,
    )
    at_planned = coordinator._guard(
        config,
        {"soc": 90, "target_soc": None},
        "charge",
        target_soc=90,
    )
    entity_cap = coordinator._guard(
        config,
        {"soc": 85, "target_soc": 85},
        "charge",
        target_soc=90,
    )

    assert below_planned["status"] == "inactive"
    assert at_planned["status"] == "blocked"
    assert entity_cap["status"] == "blocked"


def test_battery_timeline_is_mapped_by_overlap_and_normalised_in_utc() -> None:
    coordinator = _coordinator()
    coordinator.hass.data = {
        ev_coordinator.DOMAIN: {
            "battery_plan": SimpleNamespace(
                data={
                    "timeline": [
                        {
                            "start": "2026-11-09T13:00:00+01:00",
                            "end": "2026-11-09T14:00:00+01:00",
                            "power_w": -2_000,
                        }
                    ]
                }
            )
        }
    }
    rows = [
        {
            "start": (
                datetime(2026, 11, 9, 12, tzinfo=UTC) + timedelta(minutes=15 * index)
            ).isoformat(),
            "end": (
                datetime(2026, 11, 9, 12, tzinfo=UTC)
                + timedelta(minutes=15 * (index + 1))
            ).isoformat(),
        }
        for index in range(4)
    ]

    assert coordinator._battery_targets(rows) == [-2_000.0] * 4


class TestCouncilRoundSevenRegressions(unittest.IsolatedAsyncioTestCase):
    async def test_manual_stop_between_number_and_enable_is_never_reversed(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "number.current": ("10", {"min": 0, "max": 32, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "number.current",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "min_current_a": 6,
        }
        coordinator._owned_controls = {
            "number.current": {
                "vehicle_id": "car",
                "config": dict(config),
            }
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        writes: list[tuple[str, str, object]] = []

        async def send(entity_id, kind, desired):
            writes.append((entity_id, kind, desired))
            if entity_id == "number.current":
                states["number.current"] = (
                    str(desired),
                    {"min": 0, "max": 32, "step": 1},
                )
                states["switch.enable"] = "off"

        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)

        with self.assertRaises(ev_coordinator._ManualOverride):
            await coordinator._send_transaction(
                config,
                "charge",
                [
                    ("number.current", "number", 6),
                    ("switch.enable", "switch", True),
                ],
                expected_power_w=4_140,
            )

        self.assertEqual(writes, [("number.current", "number", 6)])

    async def test_apply_persists_manual_stop_during_current_adjustment(self) -> None:
        coordinator = _coordinator()
        states = {
            "number.current": ("10", {"min": 0, "max": 32, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.current",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "charge_power_kw": 11,
            "min_current_a": 6,
            "max_current_a": 32,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.current": {
                "vehicle_id": "car",
                "config": dict(config),
            }
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: {
            "soc": 40,
            "target_soc": None,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 2_000,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            return_value={"status": "limited", "allowed_power_w": 4_140}
        )
        writes: list[tuple[str, str, object]] = []

        async def send(entity_id, kind, desired):
            writes.append((entity_id, kind, desired))
            if entity_id == "number.current":
                states["number.current"] = (
                    str(desired),
                    {"min": 0, "max": 32, "step": 1},
                )
                states["switch.enable"] = "off"

        coordinator._send_control = send

        plan = await coordinator._apply(
            config,
            coordinator._vehicle_state(config),
            {"action": "charge", "target_soc": 90},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 4_140},
            guard_context={},
        )

        self.assertEqual(plan["execution"]["status"], "manual_override")
        self.assertEqual(writes, [("number.current", "number", 6.0)])
        self.assertEqual(
            coordinator._control_pauses["number.current"]["kind"], "manual"
        )

    async def test_external_start_wins_over_simultaneous_intent_cancellation(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {"switch.charger": "off"}
        coordinator.hass.states = _States(states)
        authorised = Mock(side_effect=[True, False])
        coordinator._intent_authorised = authorised

        async def persist():
            states["switch.charger"] = "on"

        coordinator._persist_owners = AsyncMock(side_effect=persist)
        coordinator._send_control = AsyncMock()

        with self.assertRaises(ev_coordinator._ExternalControl):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )

        self.assertEqual(authorised.call_count, 1)
        coordinator._send_control.assert_not_awaited()

    async def test_shared_vehicle_cannot_clear_another_vehicles_pause(self) -> None:
        coordinator = _coordinator()
        coordinator._control_pauses = {
            "switch.wallbox": {
                "vehicle_id": "car-a",
                "kind": "safety",
                "signature": "a",
            }
        }
        coordinator._persist_owners = AsyncMock()

        pause = await coordinator._active_control_pause(
            {
                "id": "car-b",
                "control_entity": "switch.wallbox",
                "control_kind": "switch",
            },
            {"plugged": True},
        )

        self.assertEqual(pause["vehicle_id"], "car-a")
        self.assertIn("switch.wallbox", coordinator._control_pauses)
        coordinator._persist_owners.assert_not_awaited()

    async def test_battery_discharge_stop_creates_persistent_visible_lockout(
        self,
    ) -> None:
        coordinator = _coordinator()
        config = {
            "id": "car",
            "mode": "smart",
            "control_entity": "switch.charger",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
        }
        coordinator._owned_controls = {
            "switch.charger": {"vehicle_id": "car", "config": dict(config)}
        }
        coordinator._release_owner = AsyncMock(return_value=True)
        coordinator._record_guard_lockout = AsyncMock()
        reason = "Home-battery discharge is active while battery support is disabled"

        stopped = await coordinator._apply(
            config,
            {"charging": True, "power_w": 3_700, "plugged": True},
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={
                "status": "blocked",
                "allowed_power_w": 0,
                "reason": reason,
            },
        )

        self.assertEqual(stopped["execution"]["status"], "safety_lockout")
        coordinator._record_guard_lockout.assert_awaited_once_with(
            "switch.charger", config, "battery", reason
        )

        coordinator._owned_controls = {}
        coordinator._control_pauses = {
            "switch.charger": {
                "vehicle_id": "car",
                "kind": "battery",
                "reason": reason,
                "signature": coordinator._control_pause_signature(config),
            }
        }
        visible = await coordinator._apply(
            config,
            {"charging": False, "power_w": 0, "plugged": True},
            {"action": "hold", "target_soc": 80},
            "automatic",
            guard_override={"status": "inactive", "allowed_power_w": 3_700},
        )
        self.assertEqual(visible["execution"]["status"], "safety_lockout")

        coordinator._send_control = AsyncMock()
        still_paused = await coordinator._apply(
            config,
            {"charging": False, "power_w": 0, "plugged": True},
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )
        self.assertEqual(still_paused["execution"]["status"], "safety_lockout")
        coordinator._send_control.assert_not_awaited()

    async def test_shutdown_loads_and_retries_persisted_owner_before_first_cycle(
        self,
    ) -> None:
        coordinator = _coordinator()
        coordinator._cycle_lock = asyncio.Lock()
        owner = {
            "switch.charger": {
                "vehicle_id": "car",
                "config": {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
            }
        }

        class Store:
            def get_smart_ev(self):
                return {"control_owners": owner}

            async_set_smart_ev_runtime = AsyncMock()

        store = Store()
        coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": store}}
        coordinator._release_owner = AsyncMock(return_value=False)

        original = ev_coordinator.DataUpdateCoordinator.async_shutdown
        ev_coordinator.DataUpdateCoordinator.async_shutdown = AsyncMock()
        try:
            await coordinator.async_shutdown()
        finally:
            ev_coordinator.DataUpdateCoordinator.async_shutdown = original

        coordinator._release_owner.assert_awaited_once_with("switch.charger")
        persisted = store.async_set_smart_ev_runtime.await_args.kwargs["control_owners"]
        self.assertIn("switch.charger", persisted)


class TestCouncilRoundEightRegressions(unittest.IsolatedAsyncioTestCase):
    async def test_manual_zero_during_failed_confirmation_is_not_retried(self) -> None:
        coordinator = _coordinator()
        states = {
            "number.current": ("10", {"min": 0, "max": 32, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.current",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "charge_power_kw": 11,
            "min_current_a": 6,
            "max_current_a": 32,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.current": {"vehicle_id": "car", "config": dict(config)}
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 2_000,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            return_value={"status": "limited", "allowed_power_w": 4_140}
        )
        writes: list[tuple[str, str, object]] = []

        async def send(entity_id, kind, desired):
            writes.append((entity_id, kind, desired))

        async def fail_after_manual_stop(_entity_id, _kind, _desired):
            states["number.current"] = (
                "0",
                {"min": 0, "max": 32, "step": 1},
            )
            return False

        coordinator._send_control = send
        coordinator._wait_target = fail_after_manual_stop

        plan = await coordinator._apply(
            config,
            coordinator._vehicle_state(config),
            {"action": "charge", "target_soc": 90},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 4_140},
            guard_context={},
        )

        self.assertEqual(plan["execution"]["status"], "manual_override")
        self.assertEqual(writes, [("number.current", "number", 6.0)])
        self.assertEqual(
            coordinator._control_pauses["number.current"]["kind"], "manual"
        )

    async def test_manual_zero_during_service_exception_is_not_retried(self) -> None:
        coordinator = _coordinator()
        states = {
            "number.current": ("10", {"min": 0, "max": 32, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.current",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "charge_power_kw": 11,
            "min_current_a": 6,
            "max_current_a": 32,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.current": {"vehicle_id": "car", "config": dict(config)}
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 2_000,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            return_value={"status": "limited", "allowed_power_w": 4_140}
        )
        writes: list[tuple[str, str, object]] = []

        async def fail_after_manual_stop(entity_id, kind, desired):
            writes.append((entity_id, kind, desired))
            states["number.current"] = (
                "0",
                {"min": 0, "max": 32, "step": 1},
            )
            raise RuntimeError("service timeout")

        coordinator._send_control = fail_after_manual_stop

        plan = await coordinator._apply(
            config,
            coordinator._vehicle_state(config),
            {"action": "charge", "target_soc": 90},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 4_140},
            guard_context={},
        )

        self.assertEqual(plan["execution"]["status"], "manual_override")
        self.assertEqual(writes, [("number.current", "number", 6.0)])
        self.assertEqual(
            coordinator._control_pauses["number.current"]["kind"], "manual"
        )

    async def test_failed_external_claim_cleanup_is_never_rehydrated(self) -> None:
        coordinator = _coordinator()
        states = {"switch.charger": "off"}
        coordinator.hass.states = _States(states)
        coordinator._intent_authorised = lambda *_args: True

        persist_calls = 0

        async def persist():
            nonlocal persist_calls
            persist_calls += 1
            if persist_calls == 1:
                states["switch.charger"] = "on"
                return
            raise RuntimeError("disk full")

        coordinator._persist_owners = AsyncMock(side_effect=persist)

        with self.assertRaises(ev_coordinator._ExternalControl):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )

        self.assertIn("switch.charger", coordinator._abandoned_control_owners)
        coordinator._load_control_owners(
            {
                "control_owners": {
                    "switch.charger": {
                        "vehicle_id": "car",
                        "config": {
                            "id": "car",
                            "control_entity": "switch.charger",
                            "control_kind": "switch",
                        },
                    }
                }
            }
        )
        self.assertNotIn("switch.charger", coordinator._owned_controls)

    async def test_provisional_external_claim_is_ignored_after_restart(self) -> None:
        coordinator = _coordinator()
        states = {"switch.charger": "off"}
        coordinator.hass.states = _States(states)
        coordinator._intent_authorised = lambda *_args: True
        stored: dict = {}
        persist_calls = 0

        async def persist():
            nonlocal persist_calls, stored
            persist_calls += 1
            if persist_calls == 1:
                stored = {
                    key: dict(value)
                    for key, value in coordinator._owned_controls.items()
                }
                states["switch.charger"] = "on"
                return
            raise RuntimeError("disk full")

        coordinator._persist_owners = AsyncMock(side_effect=persist)

        with self.assertRaises(ev_coordinator._ExternalControl):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )

        self.assertEqual(stored["switch.charger"]["ownership_state"], "provisional")
        restarted = _coordinator()
        restarted._load_control_owners({"control_owners": stored})
        self.assertEqual(restarted._owned_controls, {})
        self.assertIn("switch.charger", restarted._abandoned_control_owners)

    async def test_select_option_change_releases_the_stored_route(self) -> None:
        coordinator = _coordinator()
        coordinator._owned_controls = {
            "select.wallbox": {
                "vehicle_id": "car",
                "config": {
                    "id": "car",
                    "control_entity": "select.wallbox",
                    "control_kind": "select",
                    "charge_option": "Fast",
                    "pause_option": "Off",
                },
            }
        }
        coordinator._release_owner = AsyncMock(return_value=True)

        await coordinator._reconcile_control_owners(
            [
                {
                    "id": "car",
                    "enabled": True,
                    "control_entity": "select.wallbox",
                    "control_kind": "select",
                    "charge_option": "Eco",
                    "pause_option": "Off",
                }
            ],
            automatic=True,
        )

        coordinator._release_owner.assert_awaited_once_with("select.wallbox")

    async def test_new_minimum_does_not_misclassify_an_owned_session_as_off(
        self,
    ) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "number.current": ("8", {"min": 0, "max": 32, "step": 1}),
                "switch.enable": "on",
            }
        )
        old_config = {
            "id": "car",
            "control_entity": "number.current",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "min_current_a": 6,
        }
        config = {
            **old_config,
            "min_current_a": 10,
            "max_current_a": 32,
            "phases": 3,
            "voltage": 230,
            "charge_power_kw": 11,
        }
        coordinator._owned_controls = {
            "number.current": {"vehicle_id": "car", "config": old_config}
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: {
            "charging": True,
            "power_w": 5_500,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            return_value={"status": "safe", "allowed_power_w": 6_900}
        )
        coordinator._send_transaction = AsyncMock()
        coordinator._forget_inactive_owner = AsyncMock(return_value=True)

        plan = await coordinator._apply(
            config,
            {"charging": True, "power_w": 5_500, "power_fresh": True},
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 6_900},
        )

        self.assertNotEqual(plan["execution"]["status"], "manual_override")
        coordinator._forget_inactive_owner.assert_not_awaited()

    async def test_lower_minimum_keeps_ownership_and_later_off_stops_session(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "number.current": ("10", {"min": 0, "max": 32, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        old_config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.current",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "charge_power_kw": 11,
            "min_current_a": 8,
            "max_current_a": 32,
            "off_current_a": 0,
            "phases": 3,
            "voltage": 230,
        }
        config = {**old_config, "min_current_a": 6}
        coordinator._owned_controls = {
            "number.current": {"vehicle_id": "car", "config": old_config}
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 4_800,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            return_value={"status": "limited", "allowed_power_w": 4_830}
        )
        writes: list[tuple[str, str, object]] = []

        async def send(entity_id, kind, desired):
            writes.append((entity_id, kind, desired))
            previous = states.get(entity_id)
            attributes = previous[1] if isinstance(previous, tuple) else {}
            value = (
                "on"
                if kind == "switch" and desired
                else "off"
                if kind == "switch"
                else str(desired)
            )
            states[entity_id] = (value, attributes) if attributes else value

        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)

        plan = await coordinator._apply(
            config,
            coordinator._vehicle_state(config),
            {"action": "charge", "target_soc": 90},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 4_830},
            guard_context={},
        )

        self.assertIn(plan["execution"]["status"], {"following", "starting"})
        self.assertEqual(writes, [("number.current", "number", 7.0)])
        self.assertEqual(
            coordinator._owned_controls["number.current"]["config"]["min_current_a"],
            6,
        )
        self.assertEqual(coordinator._control_pauses, {})

        await coordinator._apply(
            {**config, "mode": "off"},
            coordinator._vehicle_state(config),
            {"action": "hold", "target_soc": 90},
            "automatic",
            guard_override={"status": "inactive", "allowed_power_w": 11_000},
        )

        self.assertNotIn("number.current", coordinator._owned_controls)
        self.assertIn(("switch.enable", "switch", False), writes)

    async def test_retry_after_raised_minimum_never_forgets_active_owner(
        self,
    ) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "number.current": ("8", {"min": 0, "max": 32, "step": 1}),
                "switch.enable": "on",
            }
        )
        old_config = {
            "id": "car",
            "control_entity": "number.current",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "min_current_a": 6,
            "off_current_a": 0,
        }
        config = {
            **old_config,
            "min_current_a": 10,
            "max_current_a": 32,
            "charge_power_kw": 11,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.current": {"vehicle_id": "car", "config": old_config}
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: {
            "charging": True,
            "power_w": 5_500,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            return_value={"status": "safe", "allowed_power_w": 6_900}
        )
        coordinator._send_transaction = AsyncMock(
            side_effect=RuntimeError("control unavailable")
        )
        coordinator._emergency_stop = AsyncMock(return_value=False)
        coordinator._forget_inactive_owner = AsyncMock(return_value=True)

        plan = await coordinator._apply(
            config,
            coordinator._vehicle_state(config),
            {"action": "charge", "target_soc": 90},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 6_900},
            guard_context={},
        )

        self.assertEqual(plan["execution"]["status"], "not_following")
        self.assertIn("number.current", coordinator._owned_controls)
        coordinator._forget_inactive_owner.assert_not_awaited()
        self.assertEqual(coordinator._emergency_stop.await_count, 1)

    async def test_removed_vehicle_pause_does_not_block_a_replacement(self) -> None:
        coordinator = _coordinator()
        coordinator._load_control_owners(
            {
                "control_pauses": {
                    "switch.wallbox": {
                        "vehicle_id": "car-a",
                        "kind": "manual",
                        "signature": "old",
                    }
                }
            }
        )
        coordinator._persist_owners = AsyncMock()
        coordinator._vehicle_state = lambda _config: {"plugged": True}

        await coordinator._reconcile_control_pauses(
            [
                {
                    "id": "car-b",
                    "enabled": True,
                    "control_entity": "switch.wallbox",
                    "control_kind": "switch",
                }
            ],
            automatic=True,
        )

        self.assertEqual(coordinator._control_pauses, {})
        coordinator._persist_owners.assert_awaited_once()

    async def test_unplugged_shared_owner_pause_is_cleared_before_deferral(
        self,
    ) -> None:
        coordinator = _coordinator()
        car_a = {
            "id": "car-a",
            "enabled": True,
            "mode": "smart",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
        }
        coordinator._control_pauses = {
            "switch.wallbox": {
                "vehicle_id": "car-a",
                "kind": "manual",
                "signature": coordinator._control_pause_signature(car_a),
            }
        }
        coordinator._persist_owners = AsyncMock()
        coordinator._vehicle_state = lambda config: {"plugged": config["id"] != "car-a"}

        await coordinator._reconcile_control_pauses(
            [
                car_a,
                {
                    "id": "car-b",
                    "enabled": True,
                    "control_entity": "switch.wallbox",
                    "control_kind": "switch",
                },
            ],
            automatic=True,
        )

        self.assertEqual(coordinator._control_pauses, {})

    async def test_enabling_battery_support_clears_battery_lockout(self) -> None:
        coordinator = _coordinator()
        vehicle = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
            "allow_home_battery_support": True,
        }
        coordinator._control_pauses = {
            "switch.wallbox": {
                "vehicle_id": "car",
                "kind": "battery",
                "signature": "support-was-disabled",
            }
        }
        coordinator._persist_owners = AsyncMock()
        coordinator._vehicle_state = lambda _config: {"plugged": True}

        await coordinator._reconcile_control_pauses([vehicle], automatic=True)

        self.assertEqual(coordinator._control_pauses, {})

    async def test_pause_reconcile_storage_failure_restores_safe_lockout(self) -> None:
        coordinator = _coordinator()
        pause = {
            "vehicle_id": "removed-car",
            "kind": "manual",
            "signature": "old",
        }
        coordinator._control_pauses = {"switch.wallbox": pause}
        coordinator._persist_owners = AsyncMock(side_effect=RuntimeError("disk full"))

        await coordinator._reconcile_control_pauses([], automatic=True)

        self.assertEqual(coordinator._control_pauses["switch.wallbox"], pause)

    async def test_guard_lockout_survives_failed_save_and_restart_retry(self) -> None:
        coordinator = _coordinator()

        class Store:
            def __init__(self):
                self.calls = 0
                self.saved: dict = {}

            async def async_set_smart_ev_runtime(self, **kwargs):
                self.calls += 1
                if self.calls == 1:
                    raise RuntimeError("disk full")
                self.saved = {
                    "control_owners": {
                        key: dict(value)
                        for key, value in kwargs["control_owners"].items()
                    },
                    "control_pauses": {
                        key: dict(value)
                        for key, value in kwargs["control_pauses"].items()
                    },
                    "guard_stopped_at": dict(kwargs["guard_stopped_at"]),
                }

        store = Store()
        coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": store}}
        config = {
            "id": "car",
            "mode": "smart",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
        }

        await coordinator._record_guard_lockout(
            "switch.wallbox", config, "battery", "battery discharge"
        )
        self.assertIn("switch.wallbox", coordinator._control_pauses)
        self.assertIn("switch.wallbox", coordinator._guard_stopped_at)

        await coordinator._persist_owners()
        restarted = _coordinator()
        restarted._load_control_owners(store.saved)
        self.assertEqual(restarted._control_pauses["switch.wallbox"]["kind"], "battery")
        self.assertIn("switch.wallbox", restarted._guard_stopped_at)

    async def test_unconfirmed_new_start_is_stopped_without_manual_pause(self) -> None:
        for variant in ("confirmation_timeout", "service_timeout", "late_on"):
            with self.subTest(variant=variant):
                coordinator = _coordinator()
                states = {"switch.charger": "off"}
                coordinator.hass.states = _States(states)
                config = {
                    "id": "car",
                    "enabled": True,
                    "mode": "smart",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                    "charge_power_kw": 3.7,
                }
                coordinator._intent_authorised = lambda *_args: True
                coordinator._persist_owners = AsyncMock()
                coordinator._refresh_guard_context = lambda context: context or {}
                coordinator._vehicle_state = lambda _config: {
                    "soc": 40,
                    "plugged": True,
                    "home": True,
                    "charging": False,
                    "power_w": 0,
                    "power_fresh": True,
                }
                coordinator._guard = Mock(
                    return_value={"status": "safe", "allowed_power_w": 3_700}
                )
                writes: list[tuple[str, str, object]] = []

                async def send(
                    entity_id,
                    kind,
                    desired,
                    *,
                    _writes=writes,
                    _variant=variant,
                    _states=states,
                ):
                    _writes.append((entity_id, kind, desired))
                    if desired is True and _variant == "service_timeout":
                        raise TimeoutError("cloud timeout")
                    if desired is True and _variant == "late_on":
                        _states[entity_id] = "on"
                    if desired is False:
                        _states[entity_id] = "off"

                async def wait(_entity_id, _kind, desired):
                    return desired is False

                coordinator._send_control = send
                coordinator._wait_target = wait

                plan = await coordinator._apply(
                    config,
                    coordinator._vehicle_state(config),
                    {"action": "charge", "target_soc": 80},
                    "automatic",
                    guard_override={"status": "safe", "allowed_power_w": 3_700},
                    guard_context={},
                )

                self.assertEqual(plan["execution"]["status"], "stopped")
                expected = [
                    ("switch.charger", "switch", True),
                    ("switch.charger", "switch", False),
                ]
                self.assertEqual(writes, expected)
                self.assertEqual(coordinator._control_pauses, {})
                self.assertIn("switch.charger", coordinator._failed_intents)
                self.assertEqual(
                    coordinator._owned_controls["switch.charger"]["ownership_state"],
                    "rollback_watch",
                )

                waiting = await coordinator._apply(
                    config,
                    coordinator._vehicle_state(config),
                    {"action": "charge", "target_soc": 80},
                    "automatic",
                    guard_override={"status": "safe", "allowed_power_w": 3_700},
                    guard_context={},
                )
                self.assertEqual(waiting["execution"]["status"], "confirmation_wait")
                self.assertEqual(
                    waiting["execution"]["reason"],
                    "Smart EV is watching for a delayed charger start after "
                    "the confirmed rollback",
                )

                states["switch.charger"] = "on"
                late = await coordinator._apply(
                    config,
                    coordinator._vehicle_state(config),
                    {"action": "hold", "target_soc": 80},
                    "automatic",
                    guard_override={"status": "inactive", "allowed_power_w": 0},
                )
                self.assertEqual(late["execution"]["status"], "stopped")
                self.assertEqual(writes[-1], ("switch.charger", "switch", False))
                self.assertEqual(states["switch.charger"], "off")

    async def test_dispatching_wait_rechecks_every_live_safety_failure(self) -> None:
        reasons = (
            "The live P1 measurement is unavailable or stale",
            "The P1 main-fuse phase headroom is unavailable or stale",
            "The charging cable is not connected",
            "Home-battery discharge is active while battery support is disabled",
        )
        for reason in reasons:
            with self.subTest(reason=reason):
                coordinator = _coordinator()
                coordinator.hass.states = _States({"switch.charger": "off"})
                coordinator._intent_authorised = lambda *_args: True
                coordinator._persist_owners = AsyncMock()
                coordinator._send_control = AsyncMock()
                safety = AsyncMock(
                    side_effect=[None, ev_coordinator._SafetyBlocked(reason)]
                )

                with self.assertRaises(ev_coordinator._SafetyBlocked):
                    await coordinator._send_transaction(
                        {
                            "id": "car",
                            "control_entity": "switch.charger",
                            "control_kind": "switch",
                        },
                        "charge",
                        [("switch.charger", "switch", True)],
                        expected_power_w=3_700,
                        safety_check=safety,
                    )

                self.assertEqual(safety.await_count, 2)
                coordinator._send_control.assert_not_awaited()
                self.assertNotIn("switch.charger", coordinator._owned_controls)
                self.assertEqual(coordinator._control_pauses, {})

    async def test_dispatching_save_failure_never_reaches_hardware(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "off"})
        coordinator._intent_authorised = lambda *_args: True
        persist_calls = 0

        async def persist():
            nonlocal persist_calls
            persist_calls += 1
            if persist_calls == 2:
                raise RuntimeError("disk full")

        coordinator._persist_owners = persist
        coordinator._send_control = AsyncMock()

        with self.assertRaises(ev_coordinator._OwnershipPersistenceFailed):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )

        coordinator._send_control.assert_not_awaited()
        self.assertNotIn("switch.charger", coordinator._owned_controls)
        self.assertIn("switch.charger", coordinator._abandoned_control_owners)

    async def test_external_start_during_dispatching_save_is_never_claimed(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {"switch.charger": "off"}
        coordinator.hass.states = _States(states)
        coordinator._intent_authorised = lambda *_args: True
        persist_calls = 0

        async def persist():
            nonlocal persist_calls
            persist_calls += 1
            if persist_calls == 2:
                states["switch.charger"] = "on"

        coordinator._persist_owners = persist
        coordinator._send_control = AsyncMock()

        with self.assertRaises(ev_coordinator._ExternalControl):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )

        coordinator._send_control.assert_not_awaited()
        self.assertNotIn("switch.charger", coordinator._owned_controls)

    async def test_intent_change_during_dispatching_save_sends_nothing(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "off"})
        coordinator._intent_authorised = Mock(side_effect=[True, True, False])
        coordinator._persist_owners = AsyncMock()
        coordinator._send_control = AsyncMock()

        with self.assertRaises(ev_coordinator._IntentCancelled):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )

        coordinator._send_control.assert_not_awaited()
        self.assertNotIn("switch.charger", coordinator._owned_controls)

    async def test_cancelled_provisional_save_leaves_no_local_claim(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.charger": "off"})
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock(side_effect=asyncio.CancelledError)
        coordinator._send_control = AsyncMock()

        with self.assertRaises(asyncio.CancelledError):
            await coordinator._send_transaction(
                {
                    "id": "car",
                    "control_entity": "switch.charger",
                    "control_kind": "switch",
                },
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )

        coordinator._send_control.assert_not_awaited()
        self.assertNotIn("switch.charger", coordinator._owned_controls)
        self.assertIn("switch.charger", coordinator._abandoned_control_owners)

    async def test_unavailable_stop_route_never_confirms_recovered_owner(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("16", {"min": 0, "max": 32, "step": 1}),
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "charge_power_kw": 11,
            "min_current_a": 6,
            "max_current_a": 16,
            "off_current_a": 0,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "command_sent",
                "config": dict(config),
            }
        }
        coordinator._persist_owners = AsyncMock()
        coordinator._intent_authorised = lambda *_args: True
        live_state = {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 6_900,
            "power_fresh": True,
        }
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: live_state
        coordinator._guard = Mock(
            return_value={"status": "limited", "allowed_power_w": 6_900}
        )

        async def send(entity_id, _kind, desired):
            previous = states[entity_id]
            states[entity_id] = (str(desired), previous[1])

        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)

        pending = await coordinator._apply(
            config,
            live_state,
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 6_900},
            guard_context={},
        )
        self.assertEqual(pending["execution"]["status"], "following")
        self.assertEqual(states["number.wallbox"][0], "10.0")
        self.assertEqual(
            coordinator._owned_controls["number.wallbox"]["ownership_state"],
            "command_sent",
        )

        states["switch.enable"] = "off"

        async def emergency(_config, **_kwargs):
            coordinator._owned_controls.pop("number.wallbox", None)
            return True

        coordinator._emergency_stop = emergency
        stopped = await coordinator._apply(
            config,
            {"plugged": True, "charging": False, "power_w": 0},
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 6_900},
        )
        self.assertEqual(stopped["execution"]["status"], "stopped")
        self.assertEqual(coordinator._control_pauses, {})

    async def test_invalid_stored_select_route_never_releases_owner(self) -> None:
        coordinator = _coordinator()
        config = {
            "id": "car",
            "control_entity": "select.wallbox_mode",
            "control_kind": "select",
            "charge_option": "Charge",
            "pause_option": "Charge",
        }
        coordinator.hass.states = _States({"select.wallbox_mode": "Charge"})
        coordinator._owned_controls = {
            "select.wallbox_mode": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        coordinator._send_control = AsyncMock()

        released = await coordinator._release_owner("select.wallbox_mode")

        self.assertFalse(released)
        self.assertIn("select.wallbox_mode", coordinator._owned_controls)
        coordinator._send_control.assert_not_awaited()

    async def test_manual_stop_during_hold_persists_across_restart(self) -> None:
        coordinator = _coordinator()
        states = {"switch.charger": "off"}
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "switch.charger",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
        }
        coordinator._owned_controls = {
            "switch.charger": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        saved: dict = {}

        async def persist():
            nonlocal saved
            saved = {
                "control_owners": copy.deepcopy(coordinator._owned_controls),
                "control_pauses": copy.deepcopy(coordinator._control_pauses),
            }

        coordinator._persist_owners = persist
        held = await coordinator._apply(
            config,
            {"plugged": True, "charging": False, "power_w": 0},
            {"action": "hold", "reason": "Outside the planned window"},
            "automatic",
            guard_override={"status": "inactive", "allowed_power_w": 0},
        )

        self.assertEqual(held["execution"]["status"], "manual_override")
        self.assertEqual(saved["control_pauses"]["switch.charger"]["kind"], "manual")
        self.assertEqual(saved["control_owners"], {})

        restarted = _coordinator()
        restarted.hass.states = _States(states)
        restarted._load_control_owners(saved)
        restarted._send_control = AsyncMock()
        future = await restarted._apply(
            config,
            {"plugged": True, "charging": False, "power_w": 0},
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )
        self.assertEqual(future["execution"]["status"], "manual_override")
        restarted._send_control.assert_not_awaited()

    async def test_manual_zero_during_shared_transfer_is_never_overwritten(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {"number.wallbox": ("10", {"min": 0, "max": 32, "step": 1})}
        coordinator.hass.states = _States(states)
        owner_config = {
            "id": "car-a",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "off_current_a": 0,
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car-a",
                "ownership_state": "confirmed",
                "config": owner_config,
            }
        }
        coordinator._intent_authorised = lambda *_args: True

        async def persist():
            states["number.wallbox"] = (
                "0",
                {"min": 0, "max": 32, "step": 1},
            )

        coordinator._persist_owners = persist
        coordinator._send_control = AsyncMock()

        with self.assertRaises(ev_coordinator._ManualOverride):
            await coordinator._send_transaction(
                {
                    "id": "car-b",
                    "control_entity": "number.wallbox",
                    "control_kind": "number",
                    "off_current_a": 0,
                },
                "charge",
                [("number.wallbox", "number", 6)],
                expected_power_w=4_140,
            )

        coordinator._send_control.assert_not_awaited()

    async def test_shared_transfer_remains_durable_if_final_save_fails(self) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("10", {"min": 0, "max": 32, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        owner_a = {
            "vehicle_id": "car-a",
            "ownership_state": "confirmed",
            "config": {
                "id": "car-a",
                "control_entity": "number.wallbox",
                "control_kind": "number",
                "stop_entity": "switch.enable",
                "off_current_a": 0,
            },
        }
        coordinator._owned_controls = {"number.wallbox": owner_a}
        coordinator._intent_authorised = lambda *_args: True
        stored: dict = {}
        persist_calls = 0

        async def persist():
            nonlocal stored, persist_calls
            persist_calls += 1
            if persist_calls == 1:
                stored = {
                    key: dict(value)
                    for key, value in coordinator._owned_controls.items()
                }
                return
            raise RuntimeError("final save failed")

        async def send(entity_id, _kind, desired):
            previous = states[entity_id]
            states[entity_id] = (str(desired), previous[1])

        coordinator._persist_owners = AsyncMock(side_effect=persist)
        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)
        config_b = {
            "id": "car-b",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "off_current_a": 0,
        }

        await coordinator._send_transaction(
            config_b,
            "charge",
            [("number.wallbox", "number", 6)],
            expected_power_w=4_140,
        )

        self.assertEqual(stored["number.wallbox"]["vehicle_id"], "car-b")
        self.assertEqual(stored["number.wallbox"]["ownership_state"], "confirmed")
        restarted = _coordinator()
        restarted._load_control_owners({"control_owners": stored})
        self.assertEqual(
            restarted._owned_controls["number.wallbox"]["vehicle_id"], "car-b"
        )

    async def test_command_sent_state_restores_stop_responsibility(self) -> None:
        coordinator = _coordinator()
        states = {"switch.charger": "off"}
        coordinator.hass.states = _States(states)
        coordinator._intent_authorised = lambda *_args: True
        snapshots: list[dict] = []

        async def persist():
            snapshots.append(
                {key: dict(value) for key, value in coordinator._owned_controls.items()}
            )

        async def send(entity_id, _kind, desired):
            states[entity_id] = "on" if desired else "off"

        coordinator._persist_owners = persist
        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)
        config = {
            "id": "car",
            "control_entity": "switch.charger",
            "control_kind": "switch",
        }

        await coordinator._send_transaction(
            config,
            "charge",
            [("switch.charger", "switch", True)],
            expected_power_w=3_700,
        )

        self.assertEqual(
            [snapshot["switch.charger"]["ownership_state"] for snapshot in snapshots],
            ["provisional", "dispatching", "command_sent", "confirmed"],
        )
        restarted = _coordinator()
        restarted._load_control_owners({"control_owners": snapshots[2]})
        self.assertEqual(
            restarted._owned_controls["switch.charger"]["ownership_state"],
            "command_sent",
        )

    async def test_dispatching_crash_restores_and_confirms_stop_responsibility(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {"switch.charger": "off"}
        coordinator.hass.states = _States(states)
        coordinator._intent_authorised = lambda *_args: True
        command_sent_save_started = asyncio.Event()
        never_complete = asyncio.Event()
        durable: dict = {}

        async def persist():
            nonlocal durable
            snapshot = copy.deepcopy(coordinator._owned_controls)
            if (
                snapshot.get("switch.charger", {}).get("ownership_state")
                == "command_sent"
            ):
                command_sent_save_started.set()
                await never_complete.wait()
            durable = snapshot

        async def send(entity_id, _kind, desired):
            states[entity_id] = "on" if desired else "off"

        coordinator._persist_owners = persist
        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "switch.charger",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
        }

        task = asyncio.create_task(
            coordinator._send_transaction(
                config,
                "charge",
                [("switch.charger", "switch", True)],
                expected_power_w=3_700,
            )
        )
        await asyncio.wait_for(command_sent_save_started.wait(), timeout=1)
        self.assertEqual(states["switch.charger"], "on")
        self.assertEqual(durable["switch.charger"]["ownership_state"], "dispatching")
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task

        restarted = _coordinator()
        restarted.hass.states = _States(states)
        restarted._load_control_owners({"control_owners": durable})
        restarted._persist_owners = AsyncMock()
        active = await restarted._apply(
            config,
            {
                "soc": 40,
                "plugged": True,
                "home": True,
                "charging": True,
                "power_w": 3_700,
                "power_fresh": True,
            },
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )
        self.assertEqual(active["execution"]["status"], "following")
        self.assertEqual(
            restarted._owned_controls["switch.charger"]["ownership_state"],
            "confirmed",
        )

        states["switch.charger"] = "off"
        stopped = await restarted._apply(
            config,
            {
                "soc": 40,
                "plugged": True,
                "home": True,
                "charging": False,
                "power_w": 0,
                "power_fresh": True,
            },
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )
        self.assertEqual(stopped["execution"]["status"], "manual_override")
        self.assertEqual(restarted._control_pauses["switch.charger"]["kind"], "manual")

        restored_pause = _coordinator()
        restored_pause.hass.states = _States(states)
        restored_pause._load_control_owners(
            {"control_owners": {}, "control_pauses": restarted._control_pauses}
        )
        paused = await restored_pause._apply(
            config,
            {"plugged": True, "charging": False, "power_w": 0},
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )
        self.assertEqual(paused["execution"]["status"], "manual_override")

    async def test_reconcile_failure_never_resurrects_released_owner(self) -> None:
        coordinator = _coordinator()
        coordinator._owned_controls = {
            "switch.removed": {
                "vehicle_id": "removed",
                "config": {
                    "id": "removed",
                    "control_entity": "switch.removed",
                    "control_kind": "switch",
                },
            },
            "switch.active": {
                "vehicle_id": "active",
                "config": {
                    "id": "active",
                    "control_entity": "switch.active",
                    "control_kind": "switch",
                    "mode": "smart",
                },
            },
        }

        async def release(entity_id):
            coordinator._owned_controls.pop(entity_id, None)
            return True

        coordinator._release_owner = release
        coordinator._persist_owners = AsyncMock(side_effect=RuntimeError("disk full"))

        await coordinator._reconcile_control_owners(
            [
                {
                    "id": "active",
                    "enabled": True,
                    "control_entity": "switch.active",
                    "control_kind": "switch",
                    "mode": "charge_now",
                }
            ],
            automatic=True,
        )

        self.assertNotIn("switch.removed", coordinator._owned_controls)
        self.assertEqual(
            coordinator._owned_controls["switch.active"]["config"]["mode"],
            "smart",
        )

    async def test_failed_cooldown_save_is_retried_by_normal_cycle(self) -> None:
        coordinator = _coordinator()

        class Store:
            def __init__(self):
                self.calls = 0
                self.saved: dict = {}

            def get_smart_ev(self):
                return {
                    "enabled": False,
                    "execution_mode": "automatic",
                    "vehicles": [],
                    **self.saved,
                }

            async def async_set_smart_ev_runtime(self, **kwargs):
                self.calls += 1
                if self.calls == 1:
                    raise RuntimeError("temporary storage failure")
                self.saved = {
                    "control_owners": dict(kwargs.get("control_owners") or {}),
                    "control_pauses": dict(kwargs.get("control_pauses") or {}),
                    "guard_stopped_at": dict(kwargs.get("guard_stopped_at") or {}),
                }

        store = Store()
        coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": store}}

        await coordinator._mark_guard_stop("switch.wallbox")
        await coordinator._async_update_locked(calendar_rules={})

        restarted = _coordinator()
        restarted._load_control_owners(store.get_smart_ev())
        self.assertIn("switch.wallbox", restarted._guard_stopped_at)

    async def test_retry_never_increases_current_after_stop_route_disappears(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("10", {"min": 0, "max": 16, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "charge_power_kw": 11,
            "min_current_a": 6,
            "max_current_a": 16,
            "off_current_a": 0,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 6_900,
            "power_fresh": True,
        }
        coordinator._guard = Mock(
            return_value={"status": "safe", "allowed_power_w": 11_040}
        )

        async def first_attempt(*_args, **_kwargs):
            states.pop("switch.enable")
            raise RuntimeError("transient service failure")

        coordinator._send_transaction = AsyncMock(side_effect=first_attempt)
        coordinator._send_control = AsyncMock(
            side_effect=RuntimeError("fallback reduction failed")
        )

        result = await coordinator._apply(
            config,
            coordinator._vehicle_state(config),
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 11_040},
            guard_context={},
        )

        self.assertEqual(result["execution"]["status"], "not_following")
        self.assertIn("could not confirm a safety stop", result["execution"]["reason"])
        coordinator._send_transaction.assert_awaited_once()
        self.assertIn("number.wallbox", coordinator._owned_controls)

    async def test_guard_lockout_is_atomic_with_owner_removal(self) -> None:
        coordinator = _coordinator()
        states = {"switch.wallbox": "on"}
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
        }
        durable = {
            "control_owners": {
                "switch.wallbox": {
                    "vehicle_id": "car",
                    "ownership_state": "confirmed",
                    "config": dict(config),
                }
            }
        }
        coordinator._owned_controls = copy.deepcopy(durable["control_owners"])

        async def send(entity_id, _kind, desired):
            states[entity_id] = "on" if desired else "off"

        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)
        coordinator._persist_owners = AsyncMock(
            side_effect=RuntimeError("lockout save failed")
        )

        released = await coordinator._release_owner("switch.wallbox", persist=False)
        await coordinator._record_guard_lockout(
            "switch.wallbox", config, "safety", "unsafe power"
        )

        self.assertTrue(released)
        restarted = _coordinator()
        restarted._load_control_owners(durable)
        self.assertIn("switch.wallbox", restarted._owned_controls)

    async def test_shared_control_owner_is_applied_before_configured_sibling(
        self,
    ) -> None:
        coordinator = _coordinator()
        coordinator._last_actions = {}
        coordinator._last_runtime_fingerprint = ""
        car_b = {
            "id": "car-b",
            "mode": "smart",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
        }
        car_a = {**car_b, "id": "car-a"}
        coordinator._owned_controls = {
            "switch.wallbox": {
                "vehicle_id": "car-a",
                "ownership_state": "confirmed",
                "config": dict(car_a),
            }
        }
        coordinator._config = lambda: {
            "enabled": True,
            "execution_mode": "automatic",
            "vehicles": [car_b, car_a],
            "learning": {},
            "plans": {},
        }
        coordinator._reconcile_control_owners = AsyncMock()
        coordinator._reconcile_control_pauses = AsyncMock()
        coordinator._vehicle_state = lambda config: {
            "soc": 50,
            "plugged": config["id"] == "car-a",
            "home": True,
            "charging": False,
            "power_w": 0,
            "power_fresh": True,
        }
        coordinator._learn = lambda _prepared, _previous: {}
        coordinator._enriched_rows = list
        coordinator._current_battery_reservation_w = lambda _now: (
            0.0,
            0.0,
            True,
            False,
        )
        coordinator._guard = Mock(
            return_value={"status": "inactive", "allowed_power_w": 0}
        )
        applied: list[str] = []

        async def apply(config, _state, plan, _mode, **_kwargs):
            applied.append(config["id"])
            plan["execution"] = {"status": "idle"}
            return plan

        coordinator._apply = AsyncMock(side_effect=apply)
        original_planner = ev_coordinator.plan_household
        ev_coordinator.plan_household = lambda *_args, **_kwargs: {
            "car-b": {"vehicle_id": "car-b", "action": "hold", "status": "idle"},
            "car-a": {"vehicle_id": "car-a", "action": "hold", "status": "idle"},
        }
        try:
            await coordinator._async_update_locked(calendar_rules={})
        finally:
            ev_coordinator.plan_household = original_planner

        self.assertEqual(applied, ["car-a", "car-b"])

    async def test_shared_manual_pause_belongs_to_the_actual_owner(self) -> None:
        coordinator = _coordinator()
        owner_config = {
            "id": "car-a",
            "mode": "smart",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
        }
        sibling_config = {**owner_config, "id": "car-b", "mode": "charge_now"}
        coordinator._owned_controls = {
            "switch.wallbox": {
                "vehicle_id": "car-a",
                "ownership_state": "confirmed",
                "config": dict(owner_config),
            }
        }
        coordinator._persist_owners = AsyncMock()

        forgotten = await coordinator._forget_inactive_owner(
            "switch.wallbox", sibling_config
        )

        self.assertTrue(forgotten)
        pause = coordinator._control_pauses["switch.wallbox"]
        self.assertEqual(pause["vehicle_id"], "car-a")
        self.assertEqual(
            pause["signature"], coordinator._control_pause_signature(owner_config)
        )

    def test_select_route_requires_live_options_before_charging(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "select.wallbox": (
                    "Eco",
                    {"options": ["Eco", "Stop"]},
                )
            }
        )
        config = {
            "control_entity": "select.wallbox",
            "control_kind": "select",
            "charge_option": "Charge",
            "pause_option": "Off",
        }

        with self.assertRaisesRegex(ValueError, "options exposed"):
            coordinator._control_targets(config, "charge", {"allowed_power_w": 3_700})

        config.update(charge_option="Eco", pause_option="Stop")
        self.assertEqual(
            coordinator._control_targets(config, "charge", {"allowed_power_w": 3_700}),
            [("select.wallbox", "select", "Eco")],
        )

    def test_third_select_mode_is_external_active_control(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {"select.wallbox": ("Solar", {"options": ["Charge", "Off", "Solar"]})}
        )
        config = {
            "control_entity": "select.wallbox",
            "control_kind": "select",
            "charge_option": "Charge",
            "pause_option": "Off",
        }

        self.assertTrue(
            coordinator._control_is_active(config, {"charging": False, "power_w": 0})
        )

    async def test_number_emergency_stop_removes_control_owner(self) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("10", {"min": 0, "max": 16, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "off_current_a": 0,
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        coordinator._persist_owners = AsyncMock()

        async def send(entity_id, _kind, desired):
            previous = states[entity_id]
            attributes = previous[1] if isinstance(previous, tuple) else {}
            states[entity_id] = (
                "on"
                if desired is True
                else "off"
                if desired is False
                else str(desired),
                attributes,
            )

        coordinator._send_control = send

        released = await coordinator._emergency_stop(config)

        self.assertTrue(released)
        self.assertNotIn("number.wallbox", coordinator._owned_controls)
        coordinator._persist_owners.assert_awaited_once()

    async def test_failed_owned_adjustment_stops_then_restarts_without_manual_pause(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("10", {"min": 0, "max": 16, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "charge_power_kw": 11,
            "min_current_a": 6,
            "max_current_a": 16,
            "off_current_a": 0,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        live_state = {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 5_520,
            "power_fresh": True,
        }
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._vehicle_state = lambda _config: live_state
        coordinator._guard = Mock(
            return_value={"status": "limited", "allowed_power_w": 5_520}
        )
        first_adjustment = True
        writes: list[tuple[str, object]] = []

        async def send(entity_id, _kind, desired):
            nonlocal first_adjustment
            writes.append((entity_id, desired))
            if entity_id == "number.wallbox" and first_adjustment:
                first_adjustment = False
                raise RuntimeError("temporary current service failure")
            previous = states[entity_id]
            attributes = previous[1] if isinstance(previous, tuple) else {}
            states[entity_id] = (
                "on"
                if desired is True
                else "off"
                if desired is False
                else str(desired),
                attributes,
            )

        coordinator._send_control = send

        result = await coordinator._apply(
            config,
            live_state,
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 5_520},
            guard_context={},
        )

        self.assertNotEqual(result["execution"]["status"], "manual_override")
        self.assertEqual(coordinator._control_pauses, {})
        self.assertIn(("switch.enable", False), writes)
        self.assertIn(("switch.enable", True), writes)

    async def test_stop_route_loss_during_dispatching_save_blocks_hardware(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("0", {"min": 0, "max": 16, "step": 1}),
            "switch.enable": "off",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "off_current_a": 0,
        }
        coordinator._intent_authorised = lambda *_args: True
        persist_calls = 0

        async def persist():
            nonlocal persist_calls
            persist_calls += 1
            if persist_calls == 2:
                states.pop("switch.enable")

        coordinator._persist_owners = persist
        coordinator._send_control = AsyncMock()

        with self.assertRaisesRegex(
            ev_coordinator._SafetyBlocked, "stop switch is unavailable"
        ):
            await coordinator._send_transaction(
                config,
                "charge",
                [
                    ("number.wallbox", "number", 6),
                    ("switch.enable", "switch", True),
                ],
                expected_power_w=4_140,
                safety_check=AsyncMock(),
            )

        coordinator._send_control.assert_not_awaited()
        self.assertNotIn("number.wallbox", coordinator._owned_controls)

    async def test_external_select_mode_during_each_save_is_never_overwritten(
        self,
    ) -> None:
        for change_at in (1, 2):
            with self.subTest(change_at=change_at):
                coordinator = _coordinator()
                states = {
                    "select.wallbox": (
                        "Off",
                        {"options": ["Off", "Charge", "Eco"]},
                    )
                }
                coordinator.hass.states = _States(states)
                config = {
                    "id": "car",
                    "control_entity": "select.wallbox",
                    "control_kind": "select",
                    "charge_option": "Charge",
                    "pause_option": "Off",
                }
                coordinator._intent_authorised = lambda *_args: True
                persist_calls = 0

                async def persist(_change_at=change_at, _states=states):
                    nonlocal persist_calls
                    persist_calls += 1
                    if persist_calls == _change_at:
                        _states["select.wallbox"] = (
                            "Eco",
                            {"options": ["Off", "Charge", "Eco"]},
                        )

                coordinator._persist_owners = persist
                coordinator._send_control = AsyncMock()

                with self.assertRaises(ev_coordinator._ExternalControl):
                    await coordinator._send_transaction(
                        config,
                        "charge",
                        [("select.wallbox", "select", "Charge")],
                        expected_power_w=3_700,
                        safety_check=AsyncMock(),
                    )

                coordinator._send_control.assert_not_awaited()
                self.assertNotIn("select.wallbox", coordinator._owned_controls)

    async def test_select_stop_option_loss_during_dispatching_blocks_hardware(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "select.wallbox": (
                "Off",
                {"options": ["Off", "Charge"]},
            )
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "select.wallbox",
            "control_kind": "select",
            "charge_option": "Charge",
            "pause_option": "Off",
        }
        coordinator._intent_authorised = lambda *_args: True
        persist_calls = 0

        async def persist():
            nonlocal persist_calls
            persist_calls += 1
            if persist_calls == 2:
                states["select.wallbox"] = ("Off", {"options": ["Charge"]})

        coordinator._persist_owners = persist
        coordinator._send_control = AsyncMock()

        with self.assertRaisesRegex(ev_coordinator._SafetyBlocked, "options exposed"):
            await coordinator._send_transaction(
                config,
                "charge",
                [("select.wallbox", "select", "Charge")],
                expected_power_w=3_700,
                safety_check=AsyncMock(),
            )

        coordinator._send_control.assert_not_awaited()
        self.assertNotIn("select.wallbox", coordinator._owned_controls)

    async def test_release_does_not_overwrite_external_select_mode(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {
                "select.wallbox": (
                    "Eco",
                    {"options": ["Off", "Charge", "Eco"]},
                )
            }
        )
        config = {
            "id": "car",
            "control_entity": "select.wallbox",
            "control_kind": "select",
            "charge_option": "Charge",
            "pause_option": "Off",
        }
        coordinator._owned_controls = {
            "select.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        coordinator._persist_owners = AsyncMock()
        coordinator._send_control = AsyncMock()

        released = await coordinator._release_owner("select.wallbox")

        self.assertTrue(released)
        coordinator._send_control.assert_not_awaited()
        self.assertNotIn("select.wallbox", coordinator._owned_controls)

    async def test_failed_atomic_lockout_save_restart_never_energises(self) -> None:
        coordinator = _coordinator()
        states = {"switch.wallbox": "on"}
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
        }
        durable = {
            "control_owners": {
                "switch.wallbox": {
                    "vehicle_id": "car",
                    "ownership_state": "confirmed",
                    "config": dict(config),
                }
            },
            "control_pauses": {},
            "guard_stopped_at": {},
        }
        coordinator._owned_controls = copy.deepcopy(durable["control_owners"])

        class Store:
            def get_smart_ev(self):
                return copy.deepcopy(durable)

            async def async_set_smart_ev_runtime(self, **_kwargs):
                raise RuntimeError("disk full during atomic lockout save")

        coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": Store()}}

        async def send(entity_id, _kind, desired):
            states[entity_id] = "on" if desired else "off"

        coordinator._send_control = send
        blocked = await coordinator._apply(
            config,
            {"plugged": True, "charging": True, "power_w": 3_700},
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={
                "status": "blocked",
                "allowed_power_w": 0,
                "reason": "Home-battery discharge is active while battery support is disabled",
            },
        )
        self.assertEqual(blocked["execution"]["status"], "safety_lockout")
        self.assertEqual(states["switch.wallbox"], "off")

        restarted = _coordinator()
        restarted.hass.states = _States(states)
        restarted._load_control_owners(Store().get_smart_ev())
        restarted._persist_owners = AsyncMock()
        restarted._send_control = AsyncMock()
        after_restart = await restarted._apply(
            config,
            {"plugged": True, "charging": False, "power_w": 0},
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )

        self.assertEqual(after_restart["execution"]["status"], "manual_override")
        restarted._send_control.assert_not_awaited()


class TestCouncilRoundSeventeenRegressions(unittest.IsolatedAsyncioTestCase):
    async def test_live_number_minimum_change_blocks_each_unsent_start_boundary(
        self,
    ) -> None:
        for change_at in (1, 2):
            with self.subTest(change_at=change_at):
                coordinator = _coordinator()
                states = {"number.wallbox": ("0", {"min": 0, "max": 16, "step": 1})}
                coordinator.hass.states = _States(states)
                config = {
                    "id": "car",
                    "control_entity": "number.wallbox",
                    "control_kind": "number",
                    "off_current_a": 0,
                }
                coordinator._intent_authorised = lambda *_args: True
                persist_calls = 0

                async def persist(_change_at=change_at, _states=states):
                    nonlocal persist_calls
                    persist_calls += 1
                    if persist_calls == _change_at:
                        _states["number.wallbox"] = (
                            "0",
                            {"min": 6, "max": 16, "step": 1},
                        )

                coordinator._persist_owners = persist
                coordinator._send_control = AsyncMock()

                with self.assertRaisesRegex(
                    ev_coordinator._SafetyBlocked, "real 0 A value"
                ):
                    await coordinator._send_transaction(
                        config,
                        "charge",
                        [("number.wallbox", "number", 6)],
                        expected_power_w=4_140,
                        safety_check=AsyncMock(),
                    )

                coordinator._send_control.assert_not_awaited()
                self.assertNotIn("number.wallbox", coordinator._owned_controls)

    async def test_command_sent_owner_survives_stop_route_loss(self) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("0", {"min": 0, "max": 16, "step": 1}),
            "switch.enable": "off",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "off_current_a": 0,
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        writes: list[tuple[str, object]] = []

        async def send(entity_id, _kind, desired):
            writes.append((entity_id, desired))
            if entity_id == "number.wallbox":
                states[entity_id] = (
                    str(desired),
                    {"min": 0, "max": 16, "step": 1},
                )
                states.pop("switch.enable")

        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)

        with self.assertRaisesRegex(
            ev_coordinator._SafetyBlocked, "stop switch is unavailable"
        ):
            await coordinator._send_transaction(
                config,
                "charge",
                [
                    ("number.wallbox", "number", 6),
                    ("switch.enable", "switch", True),
                ],
                expected_power_w=4_140,
            )

        self.assertEqual(writes, [("number.wallbox", 6)])
        self.assertEqual(
            coordinator._owned_controls["number.wallbox"]["ownership_state"],
            "command_sent",
        )

    async def test_command_sent_owner_survives_automatic_enable(self) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("0", {"min": 0, "max": 16, "step": 1}),
            "switch.enable": "off",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "off_current_a": 0,
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        writes: list[tuple[str, object]] = []

        async def send(entity_id, _kind, desired):
            writes.append((entity_id, desired))
            if entity_id == "number.wallbox":
                states[entity_id] = (
                    str(desired),
                    {"min": 0, "max": 16, "step": 1},
                )
                states["switch.enable"] = "on"
            elif entity_id == "switch.enable":
                states[entity_id] = "on" if desired else "off"

        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)

        with self.assertRaisesRegex(
            ev_coordinator._SafetyBlocked, "while the command was being sent"
        ):
            await coordinator._send_transaction(
                config,
                "charge",
                [
                    ("number.wallbox", "number", 6),
                    ("switch.enable", "switch", True),
                ],
                expected_power_w=4_140,
            )

        self.assertEqual(
            coordinator._owned_controls["number.wallbox"]["ownership_state"],
            "command_sent",
        )
        released = await coordinator._release_owner("number.wallbox")
        self.assertTrue(released)
        self.assertNotIn("number.wallbox", coordinator._owned_controls)
        self.assertEqual(writes[-1], ("switch.enable", False))

    async def test_failed_emergency_stop_reduces_current_and_prevents_retry(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("10", {"min": 6, "max": 16, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
            "charge_power_kw": 11,
            "min_current_a": 6,
            "max_current_a": 16,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        coordinator._refresh_guard_context = lambda context: context or {}
        live_state = {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 6_900,
            "power_fresh": True,
        }
        coordinator._vehicle_state = lambda _config: live_state
        coordinator._guard = Mock(
            return_value={"status": "safe", "allowed_power_w": 11_040}
        )
        writes: list[tuple[str, object]] = []

        async def send(entity_id, _kind, desired):
            writes.append((entity_id, desired))
            if entity_id == "number.wallbox" and float(desired) > 6:
                raise RuntimeError("current adjustment failed")
            if entity_id == "switch.enable":
                raise RuntimeError("stop service failed")
            states[entity_id] = (
                str(desired),
                {"min": 6, "max": 16, "step": 1},
            )

        coordinator._send_control = send

        result = await coordinator._apply(
            config,
            live_state,
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 11_040},
            guard_context={},
        )

        self.assertEqual(result["execution"]["status"], "not_following")
        self.assertEqual(
            writes,
            [
                ("number.wallbox", 16.0),
                ("switch.enable", False),
                ("number.wallbox", 6.0),
            ],
        )
        self.assertIn("number.wallbox", coordinator._owned_controls)

    async def test_unconfirmed_emergency_stop_uses_minimum_fallback(self) -> None:
        coordinator = _coordinator()
        states = {
            "number.wallbox": ("10", {"min": 6, "max": 16, "step": 1}),
            "switch.enable": "on",
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "stop_entity": "switch.enable",
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        writes: list[tuple[str, object]] = []

        async def send(entity_id, _kind, desired):
            writes.append((entity_id, desired))
            if entity_id == "number.wallbox":
                states[entity_id] = (
                    str(desired),
                    {"min": 6, "max": 16, "step": 1},
                )

        async def wait(entity_id, _kind, _desired):
            return entity_id == "number.wallbox"

        coordinator._send_control = send
        coordinator._wait_target = wait

        released = await coordinator._emergency_stop(config)

        self.assertFalse(released)
        self.assertEqual(
            writes,
            [("switch.enable", False), ("number.wallbox", 6.0)],
        )
        self.assertIn("number.wallbox", coordinator._owned_controls)

    async def test_release_never_overwrites_select_changed_during_wait(self) -> None:
        coordinator = _coordinator()
        states = {
            "select.wallbox": (
                "Charge",
                {"options": ["Off", "Charge", "Eco"]},
            )
        }
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "control_entity": "select.wallbox",
            "control_kind": "select",
            "charge_option": "Charge",
            "pause_option": "Off",
        }
        coordinator._owned_controls = {
            "select.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        coordinator._persist_owners = AsyncMock()
        writes: list[tuple[str, object]] = []

        async def send(entity_id, _kind, desired):
            writes.append((entity_id, desired))

        async def wait(_entity_id, _kind, _desired):
            states["select.wallbox"] = (
                "Eco",
                {"options": ["Off", "Charge", "Eco"]},
            )
            return False

        coordinator._send_control = send
        coordinator._wait_target = wait

        released = await coordinator._release_owner("select.wallbox")

        self.assertTrue(released)
        self.assertEqual(writes, [("select.wallbox", "Off")])
        self.assertNotIn("select.wallbox", coordinator._owned_controls)

    def test_strict_owned_reduction_remains_allowed_without_stop_route(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {"number.wallbox": ("10", {"min": 6, "max": 16, "step": 1})}
        )
        config = {
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "off_current_a": 0,
        }

        error = coordinator._energising_control_error(
            config,
            "number.wallbox",
            "number",
            6,
            {"vehicle_id": "car"},
        )

        self.assertIsNone(error)

    async def test_owned_number_only_session_reduces_after_live_minimum_change(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {"number.wallbox": ("16", {"min": 6, "max": 16, "step": 1})}
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "off_current_a": 0,
            "min_current_a": 6,
            "max_current_a": 16,
            "charge_power_kw": 11,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "expected_power_w": 11_040,
                "config": dict(config),
            }
        }
        coordinator._intent_authorised = lambda *_args: True
        coordinator._persist_owners = AsyncMock()
        coordinator._refresh_guard_context = lambda context: context or {}
        live_state = {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": True,
            "power_w": 8_000,
            "power_fresh": True,
        }
        coordinator._vehicle_state = lambda _config: live_state
        coordinator._guard = Mock(
            return_value={"status": "limited", "allowed_power_w": 5_520}
        )
        writes: list[float] = []

        async def send(entity_id, _kind, desired):
            writes.append(float(desired))
            states[entity_id] = (
                str(desired),
                {"min": 6, "max": 16, "step": 1},
            )

        coordinator._send_control = send

        result = await coordinator._apply(
            config,
            live_state,
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "limited", "allowed_power_w": 5_520},
            guard_context={},
        )

        self.assertEqual(writes, [8.0])
        self.assertIn("number.wallbox", coordinator._owned_controls)
        self.assertNotEqual(result["execution"]["status"], "unsafe_control")

    async def test_number_only_stop_paths_reduce_to_live_minimum(self) -> None:
        for path in ("release", "emergency"):
            with self.subTest(path=path):
                coordinator = _coordinator()
                states = {"number.wallbox": ("16", {"min": 6, "max": 16, "step": 1})}
                coordinator.hass.states = _States(states)
                config = {
                    "id": "car",
                    "control_entity": "number.wallbox",
                    "control_kind": "number",
                    "off_current_a": 0,
                }
                coordinator._owned_controls = {
                    "number.wallbox": {
                        "vehicle_id": "car",
                        "ownership_state": "confirmed",
                        "config": dict(config),
                    }
                }
                writes: list[float] = []

                async def send(
                    entity_id,
                    _kind,
                    desired,
                    _writes=writes,
                    _states=states,
                ):
                    _writes.append(float(desired))
                    _states[entity_id] = (
                        str(desired),
                        {"min": 6, "max": 16, "step": 1},
                    )

                coordinator._send_control = send
                released = (
                    await coordinator._release_owner("number.wallbox")
                    if path == "release"
                    else await coordinator._emergency_stop(config)
                )

                self.assertFalse(released)
                self.assertEqual(writes, [6.0])
                self.assertIn("number.wallbox", coordinator._owned_controls)

    async def test_normal_release_falls_back_on_stop_failure_or_no_confirmation(
        self,
    ) -> None:
        for failure in ("exception", "unconfirmed"):
            with self.subTest(failure=failure):
                coordinator = _coordinator()
                states = {
                    "number.wallbox": (
                        "10",
                        {"min": 6, "max": 16, "step": 1},
                    ),
                    "switch.enable": "on",
                }
                coordinator.hass.states = _States(states)
                config = {
                    "id": "car",
                    "control_entity": "number.wallbox",
                    "control_kind": "number",
                    "stop_entity": "switch.enable",
                }
                coordinator._owned_controls = {
                    "number.wallbox": {
                        "vehicle_id": "car",
                        "ownership_state": "confirmed",
                        "config": dict(config),
                    }
                }
                writes: list[tuple[str, object]] = []

                async def send(
                    entity_id,
                    _kind,
                    desired,
                    _failure=failure,
                    _writes=writes,
                    _states=states,
                ):
                    _writes.append((entity_id, desired))
                    if entity_id == "switch.enable" and _failure == "exception":
                        raise RuntimeError("stop failed")
                    if entity_id == "number.wallbox":
                        _states[entity_id] = (
                            str(desired),
                            {"min": 6, "max": 16, "step": 1},
                        )

                async def wait(
                    entity_id,
                    kind,
                    desired,
                    _failure=failure,
                    _coordinator=coordinator,
                ):
                    if entity_id == "switch.enable" and _failure == "unconfirmed":
                        return False
                    return _coordinator._control_matches(entity_id, kind, desired)

                coordinator._send_control = send
                coordinator._wait_target = wait

                released = await coordinator._release_owner("number.wallbox")

                self.assertFalse(released)
                self.assertIn(("number.wallbox", 6.0), writes)
                self.assertEqual(writes.count(("number.wallbox", 6.0)), 1)
                self.assertIn("number.wallbox", coordinator._owned_controls)

    async def test_grid_guard_off_still_enforces_home_battery_preference(self) -> None:
        coordinator = _coordinator()
        states = {"switch.wallbox": "off"}
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "charge_now",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
            "grid_guard": False,
            "allow_home_battery_support": False,
        }
        live_state = {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": False,
            "power_w": 0,
            "power_fresh": True,
        }
        guard = coordinator._guard(
            config,
            live_state,
            "charge",
            battery_data_fresh=True,
            battery_discharging=True,
        )
        coordinator._send_control = AsyncMock()

        start = await coordinator._apply(
            config,
            live_state,
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override=guard,
        )

        self.assertEqual(start["execution"]["status"], "blocked_by_grid")
        coordinator._send_control.assert_not_awaited()

        coordinator._owned_controls = {
            "switch.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }
        states["switch.wallbox"] = "on"
        live_state.update(charging=True, power_w=3_700)
        coordinator._persist_owners = AsyncMock()

        async def send(entity_id, _kind, desired):
            states[entity_id] = "on" if desired else "off"

        coordinator._send_control = send
        stopped = await coordinator._apply(
            config,
            live_state,
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override=guard,
        )

        self.assertEqual(stopped["execution"]["status"], "safety_lockout")
        self.assertEqual(states["switch.wallbox"], "off")

        allowed = coordinator._guard(
            {**config, "allow_home_battery_support": True},
            live_state,
            "charge",
            battery_data_fresh=True,
            battery_discharging=True,
        )
        self.assertEqual(allowed["status"], "inactive")

    async def test_last_boundary_control_error_reports_unsafe_control(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States({"switch.wallbox": "off"})
        coordinator._intent_authorised = lambda *_args: True
        live_state = {
            "soc": 40,
            "plugged": True,
            "home": True,
            "charging": False,
            "power_w": 0,
            "power_fresh": True,
        }
        coordinator._vehicle_state = lambda _config: live_state
        coordinator._refresh_guard_context = lambda context: context or {}
        coordinator._guard = Mock(
            return_value={"status": "safe", "allowed_power_w": 3_700}
        )
        coordinator._send_transaction = AsyncMock(
            side_effect=ev_coordinator._SafetyBlocked(
                "The separate charger stop switch is unavailable",
                control_error=True,
            )
        )

        result = await coordinator._apply(
            {
                "id": "car",
                "enabled": True,
                "mode": "charge_now",
                "control_entity": "switch.wallbox",
                "control_kind": "switch",
                "charge_power_kw": 3.7,
            },
            live_state,
            {"action": "charge", "target_soc": 80},
            "automatic",
            guard_override={"status": "safe", "allowed_power_w": 3_700},
        )

        self.assertEqual(result["execution"]["status"], "unsafe_control")

    async def test_stop_fallback_never_raises_current(self) -> None:
        for path in ("release", "emergency"):
            for current, minimum, expected_release in (
                (0, 6, True),
                (6, 10, False),
            ):
                with self.subTest(
                    path=path,
                    current=current,
                    minimum=minimum,
                ):
                    coordinator = _coordinator()
                    states = {
                        "number.wallbox": (
                            str(current),
                            {"min": minimum, "max": 16, "step": 1},
                        )
                    }
                    coordinator.hass.states = _States(states)
                    config = {
                        "id": "car",
                        "control_entity": "number.wallbox",
                        "control_kind": "number",
                        "off_current_a": 0,
                    }
                    coordinator._owned_controls = {
                        "number.wallbox": {
                            "vehicle_id": "car",
                            "ownership_state": "dispatching",
                            "config": dict(config),
                        }
                    }
                    coordinator._persist_owners = AsyncMock()
                    coordinator._send_control = AsyncMock()

                    released = (
                        await coordinator._release_owner("number.wallbox")
                        if path == "release"
                        else await coordinator._emergency_stop(config)
                    )

                    self.assertEqual(released, expected_release)
                    coordinator._send_control.assert_not_awaited()
                    if expected_release:
                        self.assertNotIn("number.wallbox", coordinator._owned_controls)
                    else:
                        self.assertIn("number.wallbox", coordinator._owned_controls)

    async def test_restored_dispatching_zero_is_released_without_energising(
        self,
    ) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {"number.wallbox": ("0", {"min": 6, "max": 16, "step": 1})}
        )
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "number.wallbox",
            "control_kind": "number",
            "off_current_a": 0,
            "min_current_a": 6,
            "max_current_a": 16,
            "charge_power_kw": 11,
            "phases": 3,
            "voltage": 230,
        }
        coordinator._owned_controls = {
            "number.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "dispatching",
                "config": dict(config),
            }
        }
        coordinator._persist_owners = AsyncMock()
        coordinator._send_control = AsyncMock()

        result = await coordinator._apply(
            config,
            {
                "soc": 40,
                "plugged": True,
                "home": True,
                "charging": False,
                "power_w": 0,
                "power_fresh": True,
            },
            {"action": "hold", "target_soc": 80},
            "automatic",
            guard_override={"status": "inactive", "allowed_power_w": 0},
        )

        self.assertEqual(result["execution"]["status"], "stopped")
        coordinator._send_control.assert_not_awaited()
        self.assertEqual(
            coordinator._owned_controls["number.wallbox"]["ownership_state"],
            "rollback_watch",
        )

    async def test_confirmed_real_zero_fallback_releases_owner(self) -> None:
        for failure in ("exception", "unconfirmed"):
            with self.subTest(failure=failure):
                coordinator = _coordinator()
                states = {
                    "number.wallbox": (
                        "10",
                        {"min": 0, "max": 16, "step": 1},
                    ),
                    "switch.enable": "on",
                }
                coordinator.hass.states = _States(states)
                config = {
                    "id": "car",
                    "control_entity": "number.wallbox",
                    "control_kind": "number",
                    "stop_entity": "switch.enable",
                    "off_current_a": 0,
                }
                coordinator._owned_controls = {
                    "number.wallbox": {
                        "vehicle_id": "car",
                        "ownership_state": "confirmed",
                        "config": dict(config),
                    }
                }
                coordinator._persist_owners = AsyncMock()
                writes: list[tuple[str, object]] = []

                async def send(
                    entity_id,
                    _kind,
                    desired,
                    _failure=failure,
                    _writes=writes,
                    _states=states,
                ):
                    _writes.append((entity_id, desired))
                    if entity_id == "switch.enable" and _failure == "exception":
                        raise RuntimeError("stop failed")
                    if entity_id == "number.wallbox":
                        _states[entity_id] = (
                            str(desired),
                            {"min": 0, "max": 16, "step": 1},
                        )

                async def wait(
                    entity_id,
                    kind,
                    desired,
                    _failure=failure,
                    _coordinator=coordinator,
                ):
                    if entity_id == "switch.enable" and _failure == "unconfirmed":
                        return False
                    return _coordinator._control_matches(entity_id, kind, desired)

                coordinator._send_control = send
                coordinator._wait_target = wait

                released = await coordinator._release_owner("number.wallbox")

                self.assertTrue(released)
                self.assertEqual(writes[-1], ("number.wallbox", 0.0))
                self.assertNotIn("number.wallbox", coordinator._owned_controls)

    def test_grid_guard_off_allows_stale_battery_data_when_support_is_enabled(
        self,
    ) -> None:
        coordinator = _coordinator()
        result = coordinator._guard(
            {
                "control_kind": "switch",
                "charge_power_kw": 3.7,
                "grid_guard": False,
                "allow_home_battery_support": True,
            },
            {"power_w": 0},
            "charge",
            battery_data_fresh=False,
            battery_discharging=False,
        )

        self.assertEqual(result["status"], "inactive")
        self.assertEqual(result["allowed_power_w"], 3_700)

    def test_zero_confirmation_uses_absolute_tolerance_not_number_step(self) -> None:
        coordinator = _coordinator()
        coordinator.hass.states = _States(
            {"number.wallbox": ("6", {"min": 0, "max": 32, "step": 16})}
        )

        self.assertFalse(coordinator._control_matches("number.wallbox", "number", 0))

    async def test_nonzero_off_with_enabled_stop_never_confirms_full_stop(
        self,
    ) -> None:
        for path in ("release", "emergency", "apply"):
            with self.subTest(path=path):
                coordinator = _coordinator()
                states = {
                    "number.wallbox": (
                        "16",
                        {"min": 6, "max": 32, "step": 1},
                    ),
                    "switch.enable": "on",
                }
                coordinator.hass.states = _States(states)
                config = {
                    "id": "car",
                    "enabled": True,
                    "mode": "smart",
                    "control_entity": "number.wallbox",
                    "control_kind": "number",
                    "stop_entity": "switch.enable",
                    "off_current_a": 6,
                    "min_current_a": 10,
                    "max_current_a": 32,
                    "charge_power_kw": 11,
                    "phases": 3,
                    "voltage": 230,
                }
                coordinator._owned_controls = {
                    "number.wallbox": {
                        "vehicle_id": "car",
                        "ownership_state": "confirmed",
                        "config": dict(config),
                    }
                }
                coordinator._persist_owners = AsyncMock()
                writes: list[tuple[str, object]] = []

                async def send(
                    entity_id,
                    _kind,
                    desired,
                    *,
                    _writes=writes,
                    _states=states,
                ):
                    _writes.append((entity_id, desired))
                    if entity_id == "switch.enable":
                        raise RuntimeError("stop failed")
                    _states[entity_id] = (
                        str(desired),
                        {"min": 6, "max": 32, "step": 1},
                    )

                coordinator._send_control = send
                coordinator._wait_target = AsyncMock(return_value=True)

                if path == "release":
                    stopped = await coordinator._release_owner("number.wallbox")
                elif path == "emergency":
                    stopped = await coordinator._emergency_stop(config)
                else:
                    result = await coordinator._apply(
                        config,
                        {
                            "soc": 50,
                            "plugged": True,
                            "home": True,
                            "charging": True,
                            "power_w": 3_700,
                            "power_fresh": True,
                        },
                        {"action": "hold", "target_soc": 80},
                        "automatic",
                        guard_override={"status": "inactive", "allowed_power_w": 0},
                    )
                    stopped = result["execution"]["status"] == "stopped"

                self.assertFalse(stopped)
                self.assertEqual(states["number.wallbox"][0], "6.0")
                self.assertEqual(states["switch.enable"], "on")
                self.assertIn("number.wallbox", coordinator._owned_controls)

    async def test_confirmed_stop_persistence_retry_is_not_manual_override(
        self,
    ) -> None:
        coordinator = _coordinator()
        states = {"switch.wallbox": "on"}
        coordinator.hass.states = _States(states)
        config = {
            "id": "car",
            "enabled": True,
            "mode": "smart",
            "control_entity": "switch.wallbox",
            "control_kind": "switch",
            "charge_power_kw": 3.7,
        }
        coordinator._owned_controls = {
            "switch.wallbox": {
                "vehicle_id": "car",
                "ownership_state": "confirmed",
                "config": dict(config),
            }
        }

        async def send(entity_id, _kind, desired):
            states[entity_id] = "on" if desired else "off"

        coordinator._send_control = send
        coordinator._wait_target = AsyncMock(return_value=True)
        coordinator._persist_owners = AsyncMock(
            side_effect=[RuntimeError("disk busy"), None]
        )

        self.assertFalse(await coordinator._release_owner("switch.wallbox"))
        self.assertTrue(coordinator._owned_controls["switch.wallbox"]["stop_confirmed"])

        result = await coordinator._apply(
            config,
            {
                "soc": 50,
                "plugged": True,
                "home": True,
                "charging": False,
                "power_w": 0,
                "power_fresh": True,
            },
            {"action": "hold", "target_soc": 80},
            "automatic",
            guard_override={"status": "inactive", "allowed_power_w": 0},
        )

        self.assertEqual(result["execution"]["status"], "idle")
        self.assertNotIn("switch.wallbox", coordinator._owned_controls)
        self.assertNotIn("switch.wallbox", coordinator._control_pauses)

    def test_stale_mapped_advice_battery_source_is_reported_unknown(self) -> None:
        coordinator = _coordinator()

        class Store:
            def get_battery(self):
                return {"enabled": False, "execution_mode": "advice"}

        coordinator.hass.data = {ev_coordinator.DOMAIN: {"store": Store()}}
        with patch.object(
            ev_coordinator,
            "battery_power_measurement",
            return_value={
                "entity_id": "sensor.home_battery_power",
                "power_w": None,
                "fresh": False,
            },
        ):
            reservation = coordinator._current_battery_reservation_w(datetime.now(UTC))

        self.assertEqual(reservation, (0.0, 0.0, False, False))


def test_battery_timeline_without_row_end_uses_the_next_start() -> None:
    coordinator = _coordinator()
    coordinator.hass.data = {
        ev_coordinator.DOMAIN: {
            "battery_plan": SimpleNamespace(
                data={
                    "timeline": [
                        {
                            "start": "2026-11-09T12:00:00+00:00",
                            "end": "2026-11-09T12:30:00+00:00",
                            "power_w": -2_000,
                        }
                    ]
                }
            )
        }
    }
    rows = [
        {"start": "2026-11-09T12:00:00+00:00"},
        {"start": "2026-11-09T12:15:00+00:00"},
        {
            "start": "2026-11-09T12:30:00+00:00",
            "resolution": "quarter-hour",
        },
    ]

    assert coordinator._battery_targets(rows) == [-2_000.0, -2_000.0, 0.0]


def test_planner_failure_still_releases_an_owned_charger(monkeypatch) -> None:
    coordinator = _coordinator()
    coordinator._last_actions = {}
    coordinator._last_runtime_fingerprint = ""
    vehicle = {
        "id": "car",
        "enabled": True,
        "mode": "smart",
        "control_entity": "switch.charger",
        "control_kind": "switch",
        "charge_power_kw": 3.7,
    }
    coordinator._owned_controls = {
        "switch.charger": {"vehicle_id": "car", "config": dict(vehicle)}
    }
    coordinator._config = lambda: {
        "enabled": True,
        "execution_mode": "automatic",
        "vehicles": [vehicle],
        "learning": {},
        "plans": {},
    }
    coordinator._vehicle_state = lambda _config: {
        "soc": 50,
        "plugged": True,
        "home": True,
        "charging": True,
        "power_w": 3_700,
        "power_fresh": True,
    }
    coordinator._learn = lambda _prepared, _previous: {}
    coordinator._enriched_rows = list
    coordinator._current_battery_reservation_w = lambda _now: (0.0, 0.0, True, False)
    coordinator._release_owner = AsyncMock(return_value=True)
    monkeypatch.setattr(
        ev_coordinator,
        "plan_household",
        Mock(side_effect=RuntimeError("planner failed")),
    )

    result = asyncio.run(coordinator._async_update_locked(calendar_rules={}))

    coordinator._release_owner.assert_awaited_once_with("switch.charger")
    assert result["plans"]["car"]["execution"]["status"] == "stopped"
