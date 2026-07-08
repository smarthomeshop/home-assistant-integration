"""Automatic Utility Meter creation for WaterMeterKit and WaterFlowKit."""

from __future__ import annotations

import re

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ...const import CONF_WATER_SENSOR, LOGGER

# Utility meter cycles to create
METER_CYCLES = ["daily", "weekly", "monthly", "yearly"]


async def async_setup_utility_meters(
    hass: HomeAssistant, entry: ConfigEntry, product_prefix: str = "watermeterkit"
) -> None:
    """Set up utility meters for WaterMeterKit/WaterFlowKit.

    Creates utility meter helpers for:
    - Daily/Weekly/Monthly/Yearly water consumption

    These are created as official Home Assistant Utility Meter helpers,
    which are persistent and work correctly with the Energy Dashboard.
    """
    # Extract short device ID from water sensor entity name
    water_sensor = entry.data.get(CONF_WATER_SENSOR, "")
    match = re.search(rf"{product_prefix}_([a-f0-9]+)_", water_sensor.lower())

    if not match:
        LOGGER.warning("Could not extract device ID for utility meters from %s", water_sensor)
        return

    short_id = match.group(1)

    # Water source entity (from ESPHome water meter)
    water_entity = f"sensor.{product_prefix}_{short_id}_water_total_consumption"

    meters_created = 0

    # Create water meters for all cycles
    for cycle in METER_CYCLES:
        if await _create_single_utility_meter(
            hass,
            name=f"{product_prefix.capitalize()} {short_id} Water {cycle.capitalize()} (CC)",
            source=water_entity,
            cycle=cycle,
            unique_id=f"{product_prefix}_{short_id}_water_{cycle}",
        ):
            meters_created += 1

    LOGGER.info(
        "Utility meters setup complete for %s %s (%d meters)",
        product_prefix, short_id, meters_created
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
                "periodically_resetting": False,
                "always_available": True,
            },
        )

        if result.get("type") == "create_entry":
            LOGGER.info("Created utility meter: %s (source: %s, cycle: %s)", name, source, cycle)
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

