"""Tests for Smart EV diagnostic entities."""

from types import SimpleNamespace

from custom_components.smarthomeshop.ev_entities import SmartHomeShopEVBinarySensor


def test_safety_lockout_turns_on_the_problem_sensor() -> None:
    entity = object.__new__(SmartHomeShopEVBinarySensor)
    entity.kind = "problem"
    entity.vehicle_id = "car"
    entity.coordinator = SimpleNamespace(
        data={
            "plans": {
                "car": {
                    "status": "scheduled",
                    "execution": {"status": "safety_lockout"},
                }
            }
        }
    )

    assert entity.is_on is True


def test_manual_override_turns_on_the_problem_sensor() -> None:
    entity = object.__new__(SmartHomeShopEVBinarySensor)
    entity.kind = "problem"
    entity.vehicle_id = "car"
    entity.coordinator = SimpleNamespace(
        data={
            "plans": {
                "car": {
                    "status": "scheduled",
                    "execution": {"status": "manual_override"},
                }
            }
        }
    )

    assert entity.is_on is True
