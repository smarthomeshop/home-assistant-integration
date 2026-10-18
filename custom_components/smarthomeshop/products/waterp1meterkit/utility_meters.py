"""Automatic Utility Meter creation for WaterP1MeterKit."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback

from ...const import CONF_WATER_SENSOR, LOGGER
from ..base.utility_sources import meter_sources, waterp1_short_id
from ..base.p1.utility_meters import (
    async_create_gas_meters_once_seen,
    create_single_utility_meter as _create_single_utility_meter,
)

# Utility meter cycles to create
METER_CYCLES = ["daily", "weekly", "monthly", "yearly"]


async def async_setup_utility_meters(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Set up utility meters for WaterP1MeterKit.

    Creates utility meter helpers for:

    ENERGY:
    - Daily/Weekly/Monthly/Yearly energy (tariff 1 + tariff 2)

    WATER:
    - Daily/Weekly/Monthly/Yearly water consumption

    These are created as official Home Assistant Utility Meter helpers,
    which are persistent and work correctly with the Energy Dashboard.
    Gas meters follow the first gas reading, see async_setup_gas_meters.
    """
    short_id = waterp1_short_id(hass, entry)
    await _create_all_utility_meters(hass, short_id, meter_sources(hass, entry), entry.data.get(CONF_WATER_SENSOR, ""))


@callback
def async_setup_gas_meters(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Create the gas utility meters once the P1 meter reports gas."""
    short_id = waterp1_short_id(hass, entry)
    async_create_gas_meters_once_seen(
        hass,
        entry,
        label=f"WaterP1 {short_id}",
        uid_prefix=f"waterp1_{short_id}",
        entity_base=f"sensor.waterp1meterkit_{short_id}",
        sources=meter_sources(hass, entry),
    )


async def _create_all_utility_meters(
    hass: HomeAssistant, short_id: str, sources: dict[str, str] | None = None, water_sensor: str = ""
) -> None:
    """Create all utility meters for a WaterP1MeterKit device."""

    sources = sources or {}

    # Energy CONSUMED source entities (from ESPHome P1 meter)
    consumed_t1_entity = sources.get("energy_consumed_tariff_1", f"sensor.waterp1meterkit_{short_id}_energy_consumed_tariff_1")
    consumed_t2_entity = sources.get("energy_consumed_tariff_2", f"sensor.waterp1meterkit_{short_id}_energy_consumed_tariff_2")

    # Energy RETURNED source entities (for solar/teruglevering). Firmware
    # variants name these either energy_returned_tariff_X or
    # energy_produced_tariff_X; pick whichever actually exists.
    def _returned_entity(tariff: int) -> str:
        returned = sources.get(f"energy_returned_tariff_{tariff}", f"sensor.waterp1meterkit_{short_id}_energy_returned_tariff_{tariff}")
        produced = sources.get(f"energy_produced_tariff_{tariff}", f"sensor.waterp1meterkit_{short_id}_energy_produced_tariff_{tariff}")
        return returned if sources.get(f"energy_returned_tariff_{tariff}") or hass.states.get(returned) else produced

    returned_t1_entity = _returned_entity(1)
    returned_t2_entity = _returned_entity(2)

    # The raw pulse total is intentional here. Utility meters calculate period
    # deltas and handle source resets, while the absolute Water Meter Total can
    # be changed by calibration and must only be used as the displayed reading.
    pulse_entity = sources.get("water_total_consumption") or f"sensor.waterp1meterkit_{short_id}_water_total_consumption"
    pulse_source = bool(sources.get("water_total_consumption") or hass.states.get(pulse_entity) or not water_sensor)
    water_entity = pulse_entity if pulse_source else water_sensor

    meters_created = 0

    # Create energy CONSUMED meters for both tariffs
    for cycle in METER_CYCLES:
        # Tariff 1
        if await _create_single_utility_meter(
            hass,
            name=f"WaterP1 {short_id} Energy {cycle.capitalize()} T1 (CC)",
            source=consumed_t1_entity,
            cycle=cycle,
            unique_id=f"waterp1_{short_id}_energy_{cycle}_t1",
            periodically_resetting=False,  # P1 meter totals never reset
        ):
            meters_created += 1

        # Tariff 2
        if await _create_single_utility_meter(
            hass,
            name=f"WaterP1 {short_id} Energy {cycle.capitalize()} T2 (CC)",
            source=consumed_t2_entity,
            cycle=cycle,
            unique_id=f"waterp1_{short_id}_energy_{cycle}_t2",
            periodically_resetting=False,
        ):
            meters_created += 1

    # Create energy RETURNED meters for both tariffs (solar/teruglevering)
    # These are optional - only if the source entity exists (user has solar panels)
    if hass.states.get(returned_t1_entity) or hass.states.get(returned_t2_entity):
        for cycle in METER_CYCLES:
            # Returned Tariff 1
            if await _create_single_utility_meter(
                hass,
                name=f"WaterP1 {short_id} Energy Returned {cycle.capitalize()} T1 (CC)",
                source=returned_t1_entity,
                cycle=cycle,
                unique_id=f"waterp1_{short_id}_energy_returned_{cycle}_t1",
                periodically_resetting=False,
            ):
                meters_created += 1

            # Returned Tariff 2
            if await _create_single_utility_meter(
                hass,
                name=f"WaterP1 {short_id} Energy Returned {cycle.capitalize()} T2 (CC)",
                source=returned_t2_entity,
                cycle=cycle,
                unique_id=f"waterp1_{short_id}_energy_returned_{cycle}_t2",
                periodically_resetting=False,
            ):
                meters_created += 1

    # Create water meters
    for cycle in METER_CYCLES:
        if await _create_single_utility_meter(
            hass,
            name=f"WaterP1 {short_id} Water {cycle.capitalize()} (CC)",
            source=water_entity,
            cycle=cycle,
            unique_id=f"waterp1_{short_id}_water_{cycle}",
            periodically_resetting=pulse_source,
        ):
            meters_created += 1

    # Total expected:
    # - 8 energy consumed (4 cycles x 2 tariffs)
    # - 8 energy returned (4 cycles x 2 tariffs) - if solar present
    # - 4 water
    # = 12 to 20 meters, plus 4 gas meters once the P1 meter reports gas
    LOGGER.info(
        "Utility meters setup complete for WaterP1MeterKit %s (%d meters)",
        short_id, meters_created
    )
