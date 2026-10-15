"""Resolve physical meter sources without relying on user-editable names."""

from __future__ import annotations

import re

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ...const import CONF_DEVICE_ID, CONF_WATER_SENSOR
from ...device_linking import resolve_source_device


def meter_sources(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, str]:
    """Map firmware sensor names to their current registry entity ids."""
    registry = er.async_get(hass)
    water = entry.data.get(CONF_WATER_SENSOR, "")
    device = resolve_source_device(
        hass, entry.data.get(CONF_DEVICE_ID), source_entity_ids=(water,)
    )
    if device is None:
        return {}
    suffixes = (
        "power_consumed", "energy_consumed_tariff_1", "energy_consumed_tariff_2",
        "energy_returned_tariff_1", "energy_returned_tariff_2",
        "energy_produced_tariff_1", "energy_produced_tariff_2",
        "gas_consumed", "gas_consumed_belgium", "water_total_consumption",
    )
    result = {}
    for entity in er.async_entries_for_device(registry, device.id):
        if entity.platform != "esphome" or entity.domain != "sensor" or entity.disabled_by is not None:
            continue
        identities = [
            re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")
            for value in (entity.entity_id, entity.unique_id, entity.original_name)
        ]
        for suffix in suffixes:
            aliases = ((suffix, "total_consumption")
                       if suffix == "water_total_consumption" and entry.data.get("product_type") == "watermeterkit"
                       else (suffix,))
            if any(identity == alias or identity.endswith("_" + alias)
                   for identity in identities for alias in aliases):
                result.setdefault(suffix, entity.entity_id)
    return result


def waterp1_short_id(hass: HomeAssistant, entry: ConfigEntry) -> str:
    """Preserve existing helper names and use physical identity after a rename."""
    water = entry.data.get(CONF_WATER_SENSOR, "")
    match = re.search(r"waterp1meterkit_([a-f0-9]{6})_", water.lower())
    if match:
        return match.group(1)
    device = resolve_source_device(hass, entry.data.get(CONF_DEVICE_ID), source_entity_ids=(water,))
    if device:
        for _, value in sorted(device.connections | device.identifiers):
            mac = re.fullmatch(r"(?:[a-f0-9]{2}[:-]){5}[a-f0-9]{2}|[a-f0-9]{12}", str(value).lower())
            if mac:
                return re.sub(r"[^a-f0-9]", "", mac.group())[-6:]
    return entry.entry_id[:8]
