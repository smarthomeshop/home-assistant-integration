"""Validation tests for the Smart Loads WebSocket configuration."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
import voluptuous as vol

from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop.websocket_api import _sanitise_smart_loads


def _load(load_id: str = "dishwasher", **overrides):
    value = {
        "id": load_id,
        "name": "Dishwasher",
        "category": "appliance",
        "start_entity": "button.arbitrary_prefix_remote_start",
        "status_entity": "sensor.renamed_program_status",
        "power_entity": "sensor.any_plug_power",
        "ready_by": "07:00",
        "power_w": 1900,
        "duration_min": 95,
    }
    value.update(overrides)
    return value


class _Store:
    def __init__(self, schedules=None, smart_loads=None, smart_ev=None, battery=None):
        self.schedules = schedules or []
        self.smart_loads = smart_loads or {}
        self.smart_ev = smart_ev or {}
        self.battery = battery or {}

    def get_schedules(self):
        return self.schedules

    def get_smart_loads(self):
        return self.smart_loads

    def get_smart_ev(self):
        return self.smart_ev

    def get_battery(self):
        return self.battery


def _hass(
    states=None,
    schedules=None,
    services=None,
    smart_loads=None,
    smart_ev=None,
    battery=None,
):
    states = states or {}
    services = services or {("button", "press")}
    return SimpleNamespace(
        states=SimpleNamespace(get=states.get),
        services=SimpleNamespace(
            has_service=lambda domain, service: (domain, service) in services
        ),
        data={DOMAIN: {"store": _Store(schedules, smart_loads, smart_ev, battery)}},
    )


def test_preserves_arbitrary_home_assistant_entity_prefixes() -> None:
    config = _sanitise_smart_loads(
        {"enabled": True, "execution_mode": "shadow", "loads": [_load()]}
    )
    saved = config["loads"][0]
    assert saved["start_entity"] == "button.arbitrary_prefix_remote_start"
    assert saved["status_entity"] == "sensor.renamed_program_status"
    assert saved["power_entity"] == "sensor.any_plug_power"


def test_main_fuse_protection_cannot_be_disabled() -> None:
    config = _sanitise_smart_loads({"grid_guard": False, "loads": [_load()]})
    assert config["loads"][0]["grid_guard"] is True


@pytest.mark.parametrize(
    "category", ["appliance", "switch", "climate", "water_heater", "custom"]
)
def test_all_supported_load_categories_are_accepted(category: str) -> None:
    overrides = {"category": category}
    if category == "climate":
        overrides.update(control_entity="climate.living_room")
    elif category == "water_heater":
        overrides.update(control_entity="water_heater.boiler")
    elif category == "switch":
        overrides.update(control_entity="switch.pool_pump")
    config = _sanitise_smart_loads({"loads": [_load(**overrides)]})
    assert config["loads"][0]["category"] == category


def test_custom_actions_are_limited_to_normal_service_calls() -> None:
    config = _sanitise_smart_loads(
        {
            "loads": [
                _load(
                    category="custom",
                    start_entity=None,
                    start_action={
                        "service": "script.turn_on",
                        "entity_id": "script.start_spa",
                        "data": {"mode": "eco"},
                    },
                )
            ]
        }
    )
    assert config["loads"][0]["start_action"]["service"] == "script.turn_on"

    canonical = _sanitise_smart_loads(
        {
            "loads": [
                _load(
                    category="custom",
                    start_entity=None,
                    start_action={
                        "service": "switch.turn_on",
                        "data": {"entity_id": "switch.shared"},
                    },
                )
            ]
        }
    )
    assert canonical["loads"][0]["start_action"]["entity_id"] == "switch.shared"
    assert "entity_id" not in canonical["loads"][0]["start_action"]["data"]

    with pytest.raises(vol.Invalid, match="target safety"):
        _sanitise_smart_loads(
            {
                "loads": [
                    _load(
                        start_action={
                            "service": "homeassistant.turn_on",
                            "data": {"device_id": "hidden-device-target"},
                        }
                    )
                ]
            }
        )

    with pytest.raises(vol.Invalid, match="templates"):
        _sanitise_smart_loads(
            {
                "loads": [
                    _load(
                        start_action={
                            "service": "script.turn_on",
                            "data": {"value": "{{ states('sensor.secret') }}"},
                        }
                    )
                ]
            }
        )


def test_rejects_duplicate_control_routes() -> None:
    with pytest.raises(vol.Invalid, match="shares a control route"):
        _sanitise_smart_loads({"loads": [_load("one"), _load("two", name="Dryer")]})


def test_legacy_schedule_conflict_checks_stop_and_custom_action_routes() -> None:
    states = {
        "button.arbitrary_prefix_remote_start": SimpleNamespace(state="unknown"),
        "sensor.renamed_program_status": SimpleNamespace(state="ready"),
    }
    for field, route in (
        ("stop_entity", "switch.shared_route"),
        (
            "stop_action",
            {
                "service": "switch.turn_off",
                "entity_id": "switch.shared_route",
            },
        ),
        (
            "stop_action",
            {
                "service": "switch.turn_off",
                "data": {"entity_id": "switch.shared_route"},
            },
        ),
    ):
        with pytest.raises(vol.Invalid, match="legacy deadline schedule"):
            _sanitise_smart_loads(
                {
                    "enabled": True,
                    "execution_mode": "automatic",
                    "loads": [_load(**{field: route})],
                },
                _hass(
                    states,
                    schedules=[
                        {"target_entity": "switch.shared_route", "enabled": True}
                    ],
                    services={("button", "press"), ("switch", "turn_off")},
                ),
            )


def test_automatic_mode_requires_feedback_and_an_available_start_route() -> None:
    states = {
        "button.arbitrary_prefix_remote_start": SimpleNamespace(state="unknown"),
        "sensor.renamed_program_status": SimpleNamespace(state="ready"),
    }
    config = _sanitise_smart_loads(
        {"enabled": True, "execution_mode": "automatic", "loads": [_load()]},
        _hass(states),
    )
    assert config["execution_mode"] == "automatic"

    with pytest.raises(vol.Invalid, match="running or power feedback"):
        _sanitise_smart_loads(
            {
                "enabled": True,
                "execution_mode": "automatic",
                "loads": [
                    _load(
                        status_entity=None,
                        power_entity=None,
                        running_entity=None,
                        control_entity=None,
                    )
                ],
            },
            _hass(states),
        )


def test_automatic_mode_refuses_legacy_schedule_conflict() -> None:
    states = {
        "switch.pool": SimpleNamespace(state="off"),
        "sensor.pool_power": SimpleNamespace(state="0"),
    }
    with pytest.raises(vol.Invalid, match="legacy deadline schedule"):
        _sanitise_smart_loads(
            {
                "enabled": True,
                "execution_mode": "automatic",
                "loads": [
                    _load(
                        category="switch",
                        start_entity=None,
                        control_entity="switch.pool",
                        power_entity="sensor.pool_power",
                    )
                ],
            },
            _hass(
                states,
                schedules=[{"target_entity": "switch.pool", "enabled": True}],
                services={("switch", "turn_on")},
            ),
        )


def test_automatic_mode_refuses_smart_ev_and_battery_control_routes() -> None:
    states = {
        "switch.pool": SimpleNamespace(state="off"),
        "sensor.pool_power": SimpleNamespace(state="0"),
    }
    raw = {
        "enabled": True,
        "execution_mode": "automatic",
        "loads": [
            _load(
                category="switch",
                start_entity=None,
                control_entity="switch.pool",
                power_entity="sensor.pool_power",
            )
        ],
    }
    with pytest.raises(vol.Invalid, match="Smart EV"):
        _sanitise_smart_loads(
            raw,
            _hass(
                states,
                services={("switch", "turn_on")},
                smart_ev={
                    "enabled": True,
                    "execution_mode": "automatic",
                    "vehicles": [{"enabled": True, "control_entity": "switch.pool"}],
                },
            ),
        )

    with pytest.raises(vol.Invalid, match="battery control"):
        _sanitise_smart_loads(
            raw,
            _hass(
                states,
                services={("switch", "turn_on")},
                battery={
                    "enabled": True,
                    "execution_mode": "automatic",
                    "control_entity": "switch.pool",
                },
            ),
        )


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("power_w", 0),
        ("power_w", float("nan")),
        ("duration_min", 1),
        ("duration_min", 2000),
        ("minimum_run_min", 0),
        ("running_above_w", -1),
    ],
)
def test_rejects_invalid_explicit_numeric_values(field, value) -> None:
    with pytest.raises(vol.Invalid, match=field):
        _sanitise_smart_loads({"loads": [_load(**{field: value})]})


def test_weekday_schedule_and_operational_states_are_persisted() -> None:
    config = _sanitise_smart_loads(
        {
            "loads": [
                _load(
                    ready_states="ready, waiting_for_start",
                    running_states="running, paused",
                    schedule={"mon": {"enabled": True, "ready_by": "06:45"}},
                )
            ]
        }
    )
    saved = config["loads"][0]
    assert saved["schedule"]["mon"] == {"enabled": True, "ready_by": "06:45"}
    assert saved["ready_states"] == "ready, waiting_for_start"
    assert saved["running_states"] == "running, paused"


def test_cannot_remove_a_load_while_smart_loads_owns_its_cycle() -> None:
    hass = _hass(
        smart_loads={
            "control_owners": {"dishwasher": {"status": "running"}},
            "loads": [_load()],
        }
    )
    with pytest.raises(vol.Invalid, match="finish before removing"):
        _sanitise_smart_loads(
            {"enabled": True, "execution_mode": "advice", "loads": []},
            hass,
        )


def test_cannot_change_an_owned_load_route_or_policy() -> None:
    hass = _hass(
        smart_loads={
            "control_owners": {"dishwasher": {"status": "running"}},
            "loads": [_load()],
        }
    )
    with pytest.raises(vol.Invalid, match="finish before changing"):
        _sanitise_smart_loads(
            {
                "enabled": True,
                "execution_mode": "advice",
                "loads": [_load(power_entity="sensor.changed_power")],
            },
            hass,
        )


def test_nested_templates_are_rejected_in_custom_action_data() -> None:
    with pytest.raises(vol.Invalid, match="templates"):
        _sanitise_smart_loads(
            {
                "loads": [
                    _load(
                        start_action={
                            "service": "script.turn_on",
                            "data": {"variables": {"unsafe": "{{ states('x') }}"}},
                        }
                    )
                ]
            }
        )


def test_interruptible_automatic_load_requires_a_stop_route() -> None:
    states = {
        "button.arbitrary_prefix_remote_start": SimpleNamespace(state="unknown"),
        "sensor.renamed_program_status": SimpleNamespace(state="ready"),
    }
    with pytest.raises(vol.Invalid, match="needs a stop action"):
        _sanitise_smart_loads(
            {
                "enabled": True,
                "execution_mode": "automatic",
                "loads": [_load(interruptible=True, stop_entity=None)],
            },
            _hass(states),
        )
