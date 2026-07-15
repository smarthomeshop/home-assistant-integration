"""Resolve the persistent water meter entity for WaterP1MeterKit."""

from __future__ import annotations

import re

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ...const import CONF_DEVICE_ID, CONF_WATER_SENSOR, LOGGER

PERSISTENT_TOTAL_MARKER = "water_meter_total"
RAW_TOTAL_MARKER = "water_total_consumption"


def _search_text(entity: er.RegistryEntry) -> str:
    """Return normalized registry metadata used for firmware entity matching."""
    values = (
        entity.entity_id,
        entity.unique_id,
        entity.name,
        entity.original_name,
    )
    return re.sub(
        r"[^a-z0-9]+",
        "_",
        " ".join(value or "" for value in values).lower(),
    )


def resolve_persistent_water_total(
    hass: HomeAssistant, entry: ConfigEntry
) -> str | None:
    """Find the firmware's reboot-safe Water Meter Total sensor."""
    registry = er.async_get(hass)
    device_id = entry.data.get(CONF_DEVICE_ID)
    configured_entity = entry.data.get(CONF_WATER_SENSOR, "")

    if not device_id and configured_entity:
        configured_registry_entry = registry.async_get(configured_entity)
        if configured_registry_entry:
            device_id = configured_registry_entry.device_id

    candidates = [
        entity
        for entity in registry.entities.values()
        if entity.domain == "sensor"
        and (not device_id or entity.device_id == device_id)
        and entity.disabled_by is None
        and PERSISTENT_TOTAL_MARKER in _search_text(entity)
    ]

    if candidates:
        # Prefer an entity that is already loaded, while still accepting a
        # temporarily unavailable registry entity during Home Assistant start.
        candidates.sort(
            key=lambda entity: hass.states.get(entity.entity_id) is None
        )
        return candidates[0].entity_id

    # Registry metadata can lag behind ESPHome during startup. Fall back to
    # the canonical entity id belonging to the configured WaterP1 device.
    match = re.search(r"waterp1meterkit_([a-f0-9]+)_", configured_entity.lower())
    if match:
        short_id = match.group(1)
        state_entity = next(
            (
                entity_id
                for entity_id in hass.states.async_entity_ids("sensor")
                if f"waterp1meterkit_{short_id}_" in entity_id.lower()
                and PERSISTENT_TOTAL_MARKER in entity_id.lower()
            ),
            None,
        )
        if state_entity:
            return state_entity

    return None


def migrate_water_total_source(hass: HomeAssistant, entry: ConfigEntry) -> str:
    """Move an existing config entry from the reboot counter to meter total."""
    configured_entity = entry.data.get(CONF_WATER_SENSOR, "")
    persistent_entity = resolve_persistent_water_total(hass, entry)

    if persistent_entity and persistent_entity != configured_entity:
        data = dict(entry.data)
        data[CONF_WATER_SENSOR] = persistent_entity
        hass.config_entries.async_update_entry(entry, data=data)
        LOGGER.info(
            "WaterP1MeterKit %s now uses persistent meter total %s instead of %s",
            entry.title,
            persistent_entity,
            configured_entity or "an unset source",
        )
        return persistent_entity

    if RAW_TOTAL_MARKER in configured_entity.lower() and not persistent_entity:
        LOGGER.warning(
            "WaterP1MeterKit %s still exposes only the reboot-resetting %s. "
            "Update the device firmware to use Water Meter Total as the meter reading.",
            entry.title,
            configured_entity,
        )

    return configured_entity
