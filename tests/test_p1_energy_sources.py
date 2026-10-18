"""Regression tests for P1 sources used by the HA Energy integration."""

import asyncio
from types import SimpleNamespace

import pytest

from custom_components.smarthomeshop.products.base.p1.coordinator import EnergyData
from custom_components.smarthomeshop.products.base.p1.sensors import P1_SENSORS
from custom_components.smarthomeshop.products.base.p1.utility_meters import (
    create_single_utility_meter,
    resolve_gas_source,
)
from custom_components.smarthomeshop.sensor import SmartHomeShopP1Sensor


def reading(value: str) -> SimpleNamespace:
    return SimpleNamespace(state=value)


def gas_description():
    return next(item for item in P1_SENSORS if item.key == "gas_consumption")


def test_normalised_gas_sensor_uses_tracker_fallback_value() -> None:
    description = gas_description()

    assert description.value_fn(EnergyData(gas_total=123.456)) == 123.456
    assert description.device_class == "gas"
    assert description.state_class == "total_increasing"


def test_gas_sensor_is_unavailable_until_the_meter_reports_gas() -> None:
    description = gas_description()

    assert description.available_fn(EnergyData()) is False
    # A brand-new gas meter that reads exactly zero still reports gas.
    assert description.available_fn(EnergyData(gas_total=0.0)) is True
    assert all(
        item.available_fn is None for item in P1_SENSORS if item.key != "gas_consumption"
    )


def p1_sensor(description, data: EnergyData, *, coordinator_ok: bool = True):
    sensor = object.__new__(SmartHomeShopP1Sensor)
    sensor.entity_description = description
    sensor.coordinator = SimpleNamespace(
        last_update_success=coordinator_ok,
        energy_tracker=SimpleNamespace(data=data),
    )
    return sensor


def test_gas_entity_follows_the_gas_reading_and_the_coordinator() -> None:
    assert p1_sensor(gas_description(), EnergyData()).available is False
    assert p1_sensor(gas_description(), EnergyData(gas_total=12.5)).available is True
    assert p1_sensor(
        gas_description(), EnergyData(gas_total=12.5), coordinator_ok=False
    ).available is False


def test_other_p1_entities_stay_available_without_data() -> None:
    standby = next(item for item in P1_SENSORS if item.key == "standby_power")

    assert p1_sensor(standby, EnergyData()).available is True


def test_belgian_gas_source_is_used_when_standard_source_is_absent() -> None:
    hass = SimpleNamespace(
        states={"sensor.waterp1meterkit_123abc_gas_consumed_belgium": reading("1234.567")}
    )

    assert resolve_gas_source(hass, "sensor.waterp1meterkit_123abc") == (
        "sensor.waterp1meterkit_123abc_gas_consumed_belgium"
    )


def test_standard_gas_source_stays_preferred_when_both_exist() -> None:
    hass = SimpleNamespace(
        states={
            "sensor.p1meterkit_123abc_gas_consumed": reading("1234.567"),
            "sensor.p1meterkit_123abc_gas_consumed_belgium": reading("89.012"),
        }
    )

    assert resolve_gas_source(hass, "sensor.p1meterkit_123abc") == (
        "sensor.p1meterkit_123abc_gas_consumed"
    )


@pytest.mark.parametrize("state", ["unknown", "unavailable", "", None])
def test_gas_entity_without_a_reading_is_not_a_source(state) -> None:
    states = {} if state is None else {"sensor.p1meterkit_123abc_gas_consumed": reading(state)}
    hass = SimpleNamespace(states=states)

    assert resolve_gas_source(hass, "sensor.p1meterkit_123abc") is None


def test_belgian_reading_wins_over_an_empty_dutch_register() -> None:
    hass = SimpleNamespace(
        states={
            "sensor.p1meterkit_123abc_gas_consumed": reading("unknown"),
            "sensor.p1meterkit_123abc_gas_consumed_belgium": reading("89.012"),
        }
    )

    assert resolve_gas_source(hass, "sensor.p1meterkit_123abc") == (
        "sensor.p1meterkit_123abc_gas_consumed_belgium"
    )


def test_renamed_registry_gas_entity_is_tried_first() -> None:
    hass = SimpleNamespace(
        states={
            "sensor.kitchen_gas": reading("1234.567"),
            "sensor.waterp1meterkit_123abc_gas_consumed": reading("1234.567"),
        }
    )

    assert resolve_gas_source(
        hass, "sensor.waterp1meterkit_123abc", {"gas_consumed": "sensor.kitchen_gas"}
    ) == "sensor.kitchen_gas"


def test_existing_gas_meter_is_migrated_to_resolved_source() -> None:
    entry = SimpleNamespace(
        title="WaterP1 123abc Gas Daily (CC)",
        options={
            "name": "WaterP1 123abc Gas Daily (CC)",
            "source": "sensor.waterp1meterkit_123abc_gas_consumed",
        },
    )

    class ConfigEntries:
        def __init__(self) -> None:
            self.updated: dict | None = None

        def async_entries(self, domain: str):
            assert domain == "utility_meter"
            return [entry]

        def async_update_entry(self, target, *, options: dict) -> None:
            assert target is entry
            self.updated = options

    config_entries = ConfigEntries()
    hass = SimpleNamespace(config_entries=config_entries)

    created = asyncio.run(
        create_single_utility_meter(
            hass,
            name=entry.title,
            source="sensor.waterp1meterkit_123abc_gas_consumed_belgium",
            cycle="daily",
            unique_id="waterp1_123abc_gas_daily",
        )
    )

    assert created is True
    assert config_entries.updated == {
        "name": entry.title,
        "source": "sensor.waterp1meterkit_123abc_gas_consumed_belgium",
    }
