"""Regression tests for P1 sources used by the HA Energy integration."""

import asyncio
from types import SimpleNamespace

from custom_components.smarthomeshop.products.base.p1.coordinator import EnergyData
from custom_components.smarthomeshop.products.base.p1.sensors import P1_SENSORS
from custom_components.smarthomeshop.products.base.p1.utility_meters import (
    create_single_utility_meter,
    resolve_gas_source,
)


def test_normalised_gas_sensor_uses_tracker_fallback_value() -> None:
    description = next(item for item in P1_SENSORS if item.key == "gas_consumption")

    assert description.value_fn(EnergyData(gas_total=123.456)) == 123.456
    assert description.device_class == "gas"
    assert description.state_class == "total_increasing"


def test_belgian_gas_source_is_used_when_standard_source_is_absent() -> None:
    hass = SimpleNamespace(
        states={"sensor.waterp1meterkit_123abc_gas_consumed_belgium": object()}
    )

    assert resolve_gas_source(hass, "sensor.waterp1meterkit_123abc") == (
        "sensor.waterp1meterkit_123abc_gas_consumed_belgium"
    )


def test_standard_gas_source_stays_preferred_when_both_exist() -> None:
    hass = SimpleNamespace(
        states={
            "sensor.p1meterkit_123abc_gas_consumed": object(),
            "sensor.p1meterkit_123abc_gas_consumed_belgium": object(),
        }
    )

    assert resolve_gas_source(hass, "sensor.p1meterkit_123abc") == (
        "sensor.p1meterkit_123abc_gas_consumed"
    )


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
