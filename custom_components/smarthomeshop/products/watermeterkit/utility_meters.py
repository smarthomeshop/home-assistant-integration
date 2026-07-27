"""Automatic Utility Meter creation for WaterMeterKit and WaterFlowKit."""

from __future__ import annotations

import re

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ...const import CONF_DEVICE_ID, CONF_WATER_SENSOR, LOGGER

# Utility meter cycles to create
METER_CYCLES = ["daily", "weekly", "monthly", "yearly"]


def _short_device_id(entry: ConfigEntry, water_sensor: str, product_prefix: str) -> str:
    """Return the short id used to name this device's utility meters.

    The default device name is <product>-<mac6>, but ESPHome lets the owner
    name the device at adoption, so a device called "watermeterkit-garage"
    must still get its meters.
    """
    for pattern in (rf"{product_prefix}_([a-f0-9]+)_", rf"{product_prefix}_(\w+?)_"):
        match = re.search(pattern, water_sensor.lower())
        if match:
            return match.group(1)

    LOGGER.info(
        "Could not read a device id from %s, naming the utility meters after "
        "the config entry instead",
        water_sensor or "an unset water sensor",
    )
    return entry.entry_id[:8]


def _pulse_total_source(
    hass: HomeAssistant, entry: ConfigEntry, water_sensor: str
) -> str:
    """Return the firmware total the utility meters have to count.

    The configured water sensor is the calibrated "Water Meter Total", which
    jumps the moment the owner enters the reading of the physical meter.
    Utility meters need the plain pulse total instead, which only ever
    counts up (and whose reboots they handle themselves).
    """
    registry = er.async_get(hass)
    device_id = entry.data.get(CONF_DEVICE_ID)
    if not device_id and water_sensor:
        configured = registry.async_get(water_sensor)
        device_id = configured.device_id if configured else None
    if not device_id:
        return water_sensor

    for entity in er.async_entries_for_device(registry, device_id):
        if entity.domain != "sensor" or entity.disabled_by is not None:
            continue
        identity = " ".join(
            value or ""
            for value in (entity.entity_id, entity.unique_id, entity.original_name)
        ).lower()
        identity = re.sub(r"[^a-z0-9]+", "_", identity)
        if "total_consumption" in identity and "water_meter_total" not in identity:
            return entity.entity_id

    return water_sensor


async def async_setup_utility_meters(
    hass: HomeAssistant, entry: ConfigEntry, product_prefix: str = "watermeterkit"
) -> None:
    """Set up utility meters for WaterMeterKit/WaterFlowKit.

    Creates utility meter helpers for:
    - Daily/Weekly/Monthly/Yearly water consumption

    These are created as official Home Assistant Utility Meter helpers,
    which are persistent and work correctly with the Energy Dashboard.
    """
    water_sensor = entry.data.get(CONF_WATER_SENSOR, "")
    short_id = _short_device_id(entry, water_sensor, product_prefix)

    # Water source entity (from ESPHome water meter)
    water_entity = _pulse_total_source(hass, entry, water_sensor)
    if not water_entity:
        LOGGER.warning(
            "No water sensor for %s yet, skipping the utility meters", entry.title
        )
        return

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
    ent_reg = er.async_get(hass)
    for entry in hass.config_entries.async_entries("utility_meter"):
        entry_name = entry.options.get("name", entry.title)
        if entry_name != name:
            continue
        stored_source = entry.options.get("source")
        if stored_source and stored_source != source and not ent_reg.async_get(
            stored_source
        ):
            # An earlier version pointed these meters at an entity the
            # firmware never created, so they never counted a litre.
            hass.config_entries.async_update_entry(
                entry, options={**entry.options, "source": source}
            )
            hass.config_entries.async_schedule_reload(entry.entry_id)
            LOGGER.info(
                "Utility meter '%s' now counts %s instead of the missing %s",
                name, source, stored_source,
            )
        else:
            LOGGER.debug("Utility meter config entry for '%s' already exists", name)
        return True

    # Also check by entity registry as fallback
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
