"""Automatic Utility Meter creation for WaterP1MeterKit."""

from __future__ import annotations

import re
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ...const import CONF_WATER_SENSOR, LOGGER

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
    """
    # Extract short device ID from water sensor entity name
    water_sensor = entry.data.get(CONF_WATER_SENSOR, "")
    match = re.search(r"waterp1meterkit_([a-f0-9]+)_", water_sensor.lower())

    if not match:
        LOGGER.warning("Could not extract device ID for utility meters from %s", water_sensor)
        return

    short_id = match.group(1)

    # Create all utility meters
    await _create_all_utility_meters(hass, short_id)


async def _create_all_utility_meters(hass: HomeAssistant, short_id: str) -> None:
    """Create all utility meters for a WaterP1MeterKit device."""

    # Energy CONSUMED source entities (from ESPHome P1 meter)
    consumed_t1_entity = f"sensor.waterp1meterkit_{short_id}_energy_consumed_tariff_1"
    consumed_t2_entity = f"sensor.waterp1meterkit_{short_id}_energy_consumed_tariff_2"

    # Energy RETURNED source entities (for solar/teruglevering)
    returned_t1_entity = f"sensor.waterp1meterkit_{short_id}_energy_returned_tariff_1"
    returned_t2_entity = f"sensor.waterp1meterkit_{short_id}_energy_returned_tariff_2"

    # Water source entity (from ESPHome water meter)
    water_entity = f"sensor.waterp1meterkit_{short_id}_water_total_consumption"

    # Gas source entity (from ESPHome P1 meter)
    gas_entity = f"sensor.waterp1meterkit_{short_id}_gas_consumed"

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
            periodically_resetting=False,  # Water meter totals never reset
        ):
            meters_created += 1

    # Create gas meters
    for cycle in METER_CYCLES:
        if await _create_single_utility_meter(
            hass,
            name=f"WaterP1 {short_id} Gas {cycle.capitalize()} (CC)",
            source=gas_entity,
            cycle=cycle,
            unique_id=f"waterp1_{short_id}_gas_{cycle}",
            periodically_resetting=False,  # Gas meter totals never reset
        ):
            meters_created += 1

    # Total expected:
    # - 8 energy consumed (4 cycles x 2 tariffs)
    # - 8 energy returned (4 cycles x 2 tariffs) - if solar present
    # - 4 water
    # - 4 gas
    # = 16 to 24 meters
    LOGGER.info(
        "Utility meters setup complete for WaterP1MeterKit %s (%d meters)",
        short_id, meters_created
    )


async def _create_single_utility_meter(
    hass: HomeAssistant,
    name: str,
    source: str,
    cycle: str,
    unique_id: str,
    periodically_resetting: bool = False,
) -> bool:
    """Create a single utility meter helper if it doesn't exist.

    Returns True if created (or already exists), False on error.
    """
    # Check if config entry already exists with this name
    # utility_meter stores the name in options.name
    for entry in hass.config_entries.async_entries("utility_meter"):
        entry_name = entry.options.get("name", entry.title)
        if entry_name == name:
            LOGGER.debug("Utility meter config entry for '%s' already exists", name)
            return True

    # Also check by entity registry as fallback
    ent_reg = er.async_get(hass)
    name_slug = name.lower().replace(" ", "_").replace("-", "_")
    for entity in ent_reg.entities.values():
        if entity.platform == "utility_meter" and name_slug in entity.entity_id:
            LOGGER.debug("Utility meter entity for '%s' already exists", name)
            return True

    # Create via config flow
    try:
        result = await hass.config_entries.flow.async_init(
            "utility_meter",
            context={"source": "user"},
            data={
                "name": name,
                "source": source,
                "cycle": cycle,
                "offset": 0,
                "tariffs": [],
                "net_consumption": False,
                "delta_values": False,
                "periodically_resetting": periodically_resetting,
                "always_available": True,
            },
        )

        if result.get("type") == "create_entry":
            LOGGER.info("Created utility meter: %s (source: %s, cycle: %s)", name, source, cycle)
            return True
        elif result.get("type") == "form":
            # Flow requires more steps, try to complete it
            if result.get("step_id") == "user":
                result = await hass.config_entries.flow.async_configure(
                    result["flow_id"],
                    user_input={
                        "name": name,
                        "source": source,
                        "cycle": cycle,
                        "offset": 0,
                        "net_consumption": False,
                        "delta_values": False,
                        "periodically_resetting": periodically_resetting,
                        "always_available": True,
                    },
                )
                if result.get("type") == "create_entry":
                    LOGGER.info("Created utility meter: %s", name)
                    return True

        LOGGER.debug("Utility meter flow result for %s: %s", name, result.get("type"))
        return False

    except Exception as err:
        LOGGER.warning("Could not create utility meter %s: %s", name, err)
        return False
