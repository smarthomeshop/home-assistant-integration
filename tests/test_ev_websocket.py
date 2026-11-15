"""Validation tests for the Smart EV WebSocket configuration."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
import voluptuous as vol

from custom_components.smarthomeshop.websocket_api import _sanitise_smart_ev


def _vehicle(vehicle_id: str = "family-car", **overrides):
    value = {
        "id": vehicle_id,
        "name": "Family EV",
        "soc_entity": "sensor.any_prefix_battery_level",
        "control_kind": "number",
        "control_entity": "number.completely_renamed_charge_current",
    }
    value.update(overrides)
    return value


def test_keeps_registry_selected_entities_with_arbitrary_prefixes() -> None:
    config = _sanitise_smart_ev(
        {"enabled": True, "execution_mode": "shadow", "vehicles": [_vehicle()]}
    )

    saved = config["vehicles"][0]
    assert saved["soc_entity"] == "sensor.any_prefix_battery_level"
    assert saved["control_entity"] == "number.completely_renamed_charge_current"
    assert config["execution_mode"] == "shadow"


def test_rejects_a_control_entity_from_the_wrong_domain() -> None:
    with pytest.raises(vol.Invalid, match="number domain"):
        _sanitise_smart_ev({"vehicles": [_vehicle(control_entity="switch.wallbox")]})


def test_bounds_numbers_and_keeps_a_valid_weekday_schedule() -> None:
    config = _sanitise_smart_ev(
        {
            "vehicles": [
                _vehicle(
                    target_soc=80,
                    minimum_soc=95,
                    max_current_a=16,
                    min_current_a=32,
                    schedule={
                        "mon": {
                            "enabled": True,
                            "ready_by": "06:45",
                            "target_soc": 90,
                        }
                    },
                )
            ]
        }
    )

    saved = config["vehicles"][0]
    assert saved["minimum_soc"] == 80
    assert saved["min_current_a"] == 16
    assert saved["schedule"]["mon"] == {
        "enabled": True,
        "ready_by": "06:45",
        "target_soc": 90,
    }


@pytest.mark.parametrize("value", [0, "", None, -1])
def test_rejects_non_positive_explicit_charge_power(value) -> None:
    with pytest.raises(vol.Invalid, match="positive number"):
        _sanitise_smart_ev({"vehicles": [_vehicle(charge_power_kw=value)]})


def test_missing_charge_power_uses_the_safe_default() -> None:
    config = _sanitise_smart_ev({"vehicles": [_vehicle()]})

    assert config["vehicles"][0]["charge_power_kw"] == 11


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("capacity_kwh", ""),
        ("target_soc", 101),
        ("minimum_soc", -1),
        ("max_current_a", float("nan")),
        ("min_current_a", 0.5),
        ("min_current_a", 81),
        ("planning_hours", 5),
        ("grid_safety_margin_w", -1),
        ("phases", 2.5),
    ],
)
def test_rejects_invalid_explicit_numeric_values(field, value) -> None:
    with pytest.raises(vol.Invalid, match=field):
        _sanitise_smart_ev({"vehicles": [_vehicle(**{field: value})]})


def test_number_off_current_must_be_below_charging_minimum() -> None:
    with pytest.raises(vol.Invalid, match="off_current_a"):
        _sanitise_smart_ev({"vehicles": [_vehicle(min_current_a=6, off_current_a=6)]})


def test_select_charge_and_pause_options_must_be_distinct() -> None:
    with pytest.raises(vol.Invalid, match="different non-empty options"):
        _sanitise_smart_ev(
            {
                "vehicles": [
                    _vehicle(
                        control_kind="select",
                        control_entity="select.wallbox_mode",
                        charge_option="Charge",
                        pause_option=" Charge ",
                    )
                ]
            }
        )


@pytest.mark.parametrize("field", ["charge_option", "pause_option"])
@pytest.mark.parametrize("value", ["", "   ", None])
def test_select_explicit_empty_option_is_never_replaced_by_a_default(
    field, value
) -> None:
    options = {"charge_option": "Charge", "pause_option": "Off"}
    options[field] = value
    with pytest.raises(vol.Invalid, match="different non-empty options"):
        _sanitise_smart_ev(
            {
                "vehicles": [
                    _vehicle(
                        control_kind="select",
                        control_entity="select.wallbox_mode",
                        **options,
                    )
                ]
            }
        )


def test_automatic_select_requires_options_exposed_by_the_entity() -> None:
    states = {
        "select.any_wallbox_mode": SimpleNamespace(
            state="Eco", attributes={"options": ["Eco", "Stop"]}
        ),
        "sensor.any_wallbox_live_load": SimpleNamespace(
            state="0", attributes={"unit_of_measurement": "W"}
        ),
    }
    hass = SimpleNamespace(states=SimpleNamespace(get=states.get))

    with pytest.raises(vol.Invalid, match="options exposed"):
        _sanitise_smart_ev(
            {
                "enabled": True,
                "execution_mode": "automatic",
                "vehicles": [
                    _vehicle(
                        control_kind="select",
                        control_entity="select.any_wallbox_mode",
                        charge_option="Charge",
                        pause_option="Off",
                    power_entity="sensor.any_wallbox_live_load",
                        grid_guard=False,
                    )
                ],
            },
            hass,
        )

    valid = _sanitise_smart_ev(
        {
            "enabled": True,
            "execution_mode": "automatic",
            "vehicles": [
                _vehicle(
                    control_kind="select",
                    control_entity="select.any_wallbox_mode",
                    charge_option="Eco",
                    pause_option="Stop",
                    power_entity="sensor.any_wallbox_live_load",
                    grid_guard=False,
                )
            ],
        },
        hass,
    )
    assert valid["vehicles"][0]["charge_option"] == "Eco"


def test_rejects_duplicate_ids_and_limits_the_household_to_eight_cars() -> None:
    with pytest.raises(vol.Invalid, match="unique id"):
        _sanitise_smart_ev({"vehicles": [_vehicle("same"), _vehicle("same")]})

    config = _sanitise_smart_ev(
        {"vehicles": [_vehicle(f"car-{index}") for index in range(10)]}
    )
    assert len(config["vehicles"]) == 8


def test_automatic_grid_guard_requires_live_vehicle_power_feedback() -> None:
    states = {
        "number.completely_renamed_charge_current": SimpleNamespace(
            state="0", attributes={"min": 0}
        )
    }
    hass = SimpleNamespace(states=SimpleNamespace(get=states.get))

    with pytest.raises(vol.Invalid, match="charging-power sensor"):
        _sanitise_smart_ev(
            {
                "enabled": True,
                "execution_mode": "automatic",
                "vehicles": [_vehicle()],
            },
            hass,
        )


def test_automatic_grid_guard_accepts_arbitrarily_named_live_power_sensor() -> None:
    states = {
        "number.completely_renamed_charge_current": SimpleNamespace(
            state="0", attributes={"min": 0}
        ),
        "sensor.any_wallbox_live_load": SimpleNamespace(
            state="1250", attributes={"unit_of_measurement": "W"}
        ),
    }
    hass = SimpleNamespace(states=SimpleNamespace(get=states.get))

    config = _sanitise_smart_ev(
        {
            "enabled": True,
            "execution_mode": "automatic",
            "vehicles": [_vehicle(power_entity="sensor.any_wallbox_live_load")],
        },
        hass,
    )

    assert config["vehicles"][0]["power_entity"] == "sensor.any_wallbox_live_load"


@pytest.mark.parametrize("off_current", [0.9, 2])
def test_automatic_number_route_rejects_nonzero_off_without_stop_switch(
    off_current,
) -> None:
    states = {
        "number.completely_renamed_charge_current": SimpleNamespace(
            state="0", attributes={"min": 0, "max": 32}
        ),
        "sensor.any_wallbox_live_load": SimpleNamespace(
            state="0", attributes={"unit_of_measurement": "W"}
        ),
    }
    hass = SimpleNamespace(states=SimpleNamespace(get=states.get))

    with pytest.raises(vol.Invalid, match="separate stop switch"):
        _sanitise_smart_ev(
            {
                "enabled": True,
                "execution_mode": "automatic",
                "vehicles": [
                    _vehicle(
                        off_current_a=off_current,
                        min_current_a=6,
                        power_entity="sensor.any_wallbox_live_load",
                        grid_guard=False,
                    )
                ],
            },
            hass,
        )


def test_automatic_number_route_rejects_unavailable_stop_switch() -> None:
    states = {
        "number.completely_renamed_charge_current": SimpleNamespace(
            state="6", attributes={"min": 6, "max": 32}
        ),
        "switch.any_stop": SimpleNamespace(state="unavailable", attributes={}),
        "sensor.any_wallbox_live_load": SimpleNamespace(
            state="0", attributes={"unit_of_measurement": "W"}
        ),
    }
    hass = SimpleNamespace(states=SimpleNamespace(get=states.get))

    with pytest.raises(vol.Invalid, match="separate stop switch"):
        _sanitise_smart_ev(
            {
                "enabled": True,
                "execution_mode": "automatic",
                "vehicles": [
                    _vehicle(
                        stop_entity="switch.any_stop",
                        min_current_a=6,
                        off_current_a=0,
                        power_entity="sensor.any_wallbox_live_load",
                        grid_guard=False,
                    )
                ],
            },
            hass,
        )


def test_shared_control_requires_one_identical_stop_route() -> None:
    with pytest.raises(vol.Invalid, match="same stop route"):
        _sanitise_smart_ev(
            {
                "vehicles": [
                    _vehicle("car-a", stop_entity="switch.stop"),
                    _vehicle("car-b", stop_entity=None),
                ]
            }
        )


class _ConflictStore:
    def __init__(self, *, schedules=None, smart_ev=None, smart_loads=None):
        self.schedules = schedules or []
        self.smart_ev = smart_ev or {}
        self.smart_loads = smart_loads or {}

    def get_schedules(self):
        return self.schedules

    def get_smart_ev(self):
        return self.smart_ev

    def get_smart_loads(self):
        return self.smart_loads

    def get_battery(self):
        return {}


def _automatic_hass(store):
    from custom_components.smarthomeshop.const import DOMAIN

    states = {
        "switch.wallbox": SimpleNamespace(state="off", attributes={}),
        "sensor.wallbox_power": SimpleNamespace(state="0", attributes={}),
    }
    return SimpleNamespace(
        states=SimpleNamespace(get=states.get),
        data={DOMAIN: {"store": store}},
    )


def _switch_vehicle():
    return _vehicle(
        control_kind="switch",
        control_entity="switch.wallbox",
        power_entity="sensor.wallbox_power",
    )


def test_automatic_ev_refuses_a_charger_used_by_a_legacy_deadline_schedule() -> None:
    store = _ConflictStore(
        schedules=[{"target_entity": "switch.wallbox", "enabled": True}]
    )
    raw = {"enabled": True, "execution_mode": "automatic", "vehicles": [_switch_vehicle()]}

    with pytest.raises(vol.Invalid, match="legacy deadline schedule"):
        _sanitise_smart_ev(raw, _automatic_hass(store))

    # A disabled schedule no longer switches the charger, so it may stay.
    store.schedules[0]["enabled"] = False
    config = _sanitise_smart_ev(raw, _automatic_hass(store))
    assert config["execution_mode"] == "automatic"


def test_advice_mode_ev_may_share_a_charger_with_a_deadline_schedule() -> None:
    store = _ConflictStore(
        schedules=[{"target_entity": "switch.wallbox", "enabled": True}]
    )
    config = _sanitise_smart_ev(
        {"enabled": True, "execution_mode": "advice", "vehicles": [_switch_vehicle()]},
        _automatic_hass(store),
    )
    assert config["execution_mode"] == "advice"


def test_deadline_schedule_refuses_a_charger_controlled_by_automatic_smart_ev() -> None:
    from custom_components.smarthomeshop.websocket_api import (
        _schedule_control_conflict,
    )

    store = _ConflictStore(
        smart_ev={
            "enabled": True,
            "execution_mode": "automatic",
            "vehicles": [{"enabled": True, "control_entity": "switch.wallbox"}],
        }
    )

    assert _schedule_control_conflict(
        store, {"target_entity": "switch.wallbox"}
    ) == "This entity is already controlled by automatic Smart EV"
    assert (
        _schedule_control_conflict(
            store, {"target_entity": "switch.wallbox", "enabled": False}
        )
        is None
    )
    assert _schedule_control_conflict(store, {"target_entity": "switch.pool"}) is None


def test_smart_ev_refresh_error_names_smart_ev() -> None:
    from custom_components.smarthomeshop.const import DOMAIN
    from custom_components.smarthomeshop.websocket_api import _smart_ev_result

    hass = SimpleNamespace(
        data={
            DOMAIN: {
                "store": _ConflictStore(),
                "smart_ev": SimpleNamespace(data={}, last_update_success=False),
            }
        }
    )

    result = _smart_ev_result(hass)

    assert result["available"] is False
    assert result["coordinator_error"] == "Smart EV could not refresh its current state"


def test_clearing_history_also_clears_the_live_coordinator_copy() -> None:
    import asyncio

    from custom_components.smarthomeshop.const import DOMAIN
    from custom_components.smarthomeshop.websocket_api import (
        _async_clear_live_history,
        _smart_ev_result,
        _smart_loads_result,
    )

    class _Store(_ConflictStore):
        cleared: list[str] = []

        async def async_clear_smart_ev_journal(self):
            self.cleared.append("ev")

        async def async_clear_smart_loads_history(self):
            self.cleared.append("loads")

    async def run():
        store = _Store()
        smart_ev = SimpleNamespace(
            data={"plans": {"car": {}}, "journal": [{"action": "charge"}]},
            last_update_success=True,
            _cycle_lock=asyncio.Lock(),
        )
        smart_loads = SimpleNamespace(
            data={"plans": {}, "runs": [{"load_id": "a"}], "journal": [{}]},
            _cycle_lock=asyncio.Lock(),
        )
        hass = SimpleNamespace(
            data={
                DOMAIN: {
                    "store": store,
                    "smart_ev": smart_ev,
                    "smart_loads": smart_loads,
                }
            }
        )
        await _async_clear_live_history(
            hass, "smart_ev", store.async_clear_smart_ev_journal, ("journal",)
        )
        await _async_clear_live_history(
            hass,
            "smart_loads",
            store.async_clear_smart_loads_history,
            ("runs", "journal"),
        )
        return store, smart_ev, _smart_ev_result(hass), _smart_loads_result(hass)

    store, smart_ev, ev_result, loads_result = asyncio.run(run())

    assert store.cleared == ["ev", "loads"]
    assert smart_ev.data["plans"] == {"car": {}}
    assert ev_result["journal"] == []
    assert loads_result["runs"] == []
    assert loads_result["journal"] == []
