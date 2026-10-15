"""Automatic Utility Meter creation for WaterMeterKit and WaterFlowKit."""

from __future__ import annotations

import re

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ...const import CONF_DEVICE_ID, CONF_WATER_SENSOR, LOGGER
from ..base.utility_sources import meter_sources
from ..base.p1.utility_meters import create_single_utility_meter

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
    sources = meter_sources(hass, entry)
    water_entity = sources.get("water_total_consumption") or _pulse_total_source(hass, entry, water_sensor)
    pulse_source = bool(sources.get("water_total_consumption") or water_entity != water_sensor
                        or "total_consumption" in water_entity)
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
            periodically_resetting=pulse_source,
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
    periodically_resetting: bool = True,
) -> bool:
    """Create or migrate a helper that accepts the pulse counter's resets."""
    return await create_single_utility_meter(
        hass, name=name, source=source, cycle=cycle, unique_id=unique_id,
        periodically_resetting=periodically_resetting,
    )
