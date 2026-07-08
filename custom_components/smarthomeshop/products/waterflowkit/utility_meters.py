"""Automatic Utility Meter creation for WaterFlowKit (dual sensors)."""

from __future__ import annotations

import re

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ...const import LOGGER

# Utility meter cycles to create
METER_CYCLES = ["daily", "weekly", "monthly", "yearly"]

# Config keys
CONF_FLOW1_WATER_SENSOR = "flow1_water_sensor"
CONF_FLOW2_WATER_SENSOR = "flow2_water_sensor"


async def async_setup_utility_meters(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Set up utility meters for WaterFlowKit (both Flow1 and Flow2).

    Creates utility meter helpers for:
    - Flow1: Daily/Weekly/Monthly/Yearly water consumption
    - Flow2: Daily/Weekly/Monthly/Yearly water consumption
    - Combined: Daily/Weekly/Monthly/Yearly total water consumption

    These are created as official Home Assistant Utility Meter helpers,
    which are persistent and work correctly with the Energy Dashboard.
    """
    # Extract device ID from sensor entity names
    flow1_sensor = entry.data.get(CONF_FLOW1_WATER_SENSOR, "")
    flow2_sensor = entry.data.get(CONF_FLOW2_WATER_SENSOR, "")

    # Try to get short_id from either sensor
    # Pattern matches: sensor.waterflowkit_XXXXX_flow1_total_consumption
    # or sensor.waterflowkit_flow1_total_consumption (without device ID)
    match = re.search(r"waterflowkit_([a-f0-9]+)_flow", flow1_sensor.lower())
    if not match:
        match = re.search(r"waterflowkit_([a-f0-9]+)_flow", flow2_sensor.lower())

    # If no match with hex ID, try extracting any word between waterflowkit and flow
    if not match:
        match = re.search(r"waterflowkit_(\w+)_flow", flow1_sensor.lower())
    if not match:
        match = re.search(r"waterflowkit_(\w+)_flow", flow2_sensor.lower())

    # Last resort: use entry_id
    if not match:
        short_id = entry.entry_id[:8]
        LOGGER.info(
            "Using entry_id as device ID for utility meters: %s",
            short_id,
        )
    else:
        short_id = match.group(1)
    meters_created = 0

    # Create Flow1 meters
    if flow1_sensor:
        for cycle in METER_CYCLES:
            if await _create_single_utility_meter(
                hass,
                name=f"WaterFlowKit {short_id} Flow1 {cycle.capitalize()}",
                source=flow1_sensor,
                cycle=cycle,
                unique_id=f"waterflowkit_{short_id}_flow1_{cycle}",
            ):
                meters_created += 1

    # Create Flow2 meters
    if flow2_sensor:
        for cycle in METER_CYCLES:
            if await _create_single_utility_meter(
                hass,
                name=f"WaterFlowKit {short_id} Flow2 {cycle.capitalize()}",
                source=flow2_sensor,
                cycle=cycle,
                unique_id=f"waterflowkit_{short_id}_flow2_{cycle}",
            ):
                meters_created += 1

    LOGGER.info(
        "Utility meters setup complete for WaterFlowKit %s (%d meters for 2 sensors)",
        short_id,
        meters_created,
    )


async def _create_single_utility_meter(
    hass: HomeAssistant,
    name: str,
    source: str,
    cycle: str,
    unique_id: str,
) -> bool:
    """Create a single utility meter helper if it doesn't exist."""
    # Check if config entry already exists with this name
    for config_entry in hass.config_entries.async_entries("utility_meter"):
        entry_name = config_entry.options.get("name", config_entry.title)
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
                "periodically_resetting": False,
                "always_available": True,
            },
        )

        if result.get("type") == "create_entry":
            LOGGER.info(
                "Created utility meter: %s (source: %s, cycle: %s)", name, source, cycle
            )
            return True
        elif result.get("type") == "form":
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
                        "periodically_resetting": False,
                        "always_available": True,
                    },
                )
                if result.get("type") == "create_entry":
                    LOGGER.info("Created utility meter: %s", name)
                    return True

        return False

    except Exception as err:
        LOGGER.warning("Could not create utility meter %s: %s", name, err)
        return False

