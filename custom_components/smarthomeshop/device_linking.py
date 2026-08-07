"""Compatibility helpers for linking SmartHomeShop entities to ESPHome devices.

Home Assistant 2026.8 changed the device registry from devices shared by several
config entries to one concrete device per config entry.  SmartHomeShop is a
helper-style integration: its calculated entities belong to our config entry,
but they must *link* to the physical ESPHome device instead of claiming a copy
of that device through ``DeviceInfo``.

This module intentionally supports both registry layouts.  That lets people
upgrade the integration before or after upgrading Home Assistant without
having to remove and re-add any products.
"""

from __future__ import annotations

from collections.abc import Iterable

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import CONF_DEVICE_ID, CONF_PRODUCT_TYPE, LOGGER


def _entries_for_device(
    entity_registry: er.EntityRegistry, device_id: str
) -> list[er.RegistryEntry]:
    """Return registry entries for old, concrete and composite device ids."""
    try:
        return list(
            er.async_entries_for_device(
                entity_registry, device_id, include_disabled_entities=True
            )
        )
    except TypeError:
        # Kept for older Home Assistant/test doubles whose helper did not yet
        # expose the include_disabled_entities keyword.
        return list(er.async_entries_for_device(entity_registry, device_id))


def device_config_entry_ids(device: dr.DeviceEntry) -> set[str]:
    """Return the config entries associated with either registry generation."""
    config_entry_id = getattr(device, "config_entry_id", None)
    if config_entry_id:
        return {config_entry_id}
    return set(getattr(device, "config_entries", ()) or ())


def _config_entry_domain(hass: HomeAssistant, config_entry_id: str) -> str | None:
    entry = hass.config_entries.async_get_entry(config_entry_id)
    return entry.domain if entry is not None else None


def _is_esphome_source_device(
    hass: HomeAssistant,
    device: dr.DeviceEntry,
    entity_registry: er.EntityRegistry,
) -> bool:
    """Return whether this is the physical ESPHome-owned device."""
    if any(
        entity.platform == "esphome"
        for entity in _entries_for_device(entity_registry, device.id)
    ):
        return True
    return any(
        _config_entry_domain(hass, entry_id) == "esphome"
        for entry_id in device_config_entry_ids(device)
    )


def iter_esphome_source_devices(hass: HomeAssistant) -> Iterable[dr.DeviceEntry]:
    """Yield each concrete ESPHome device exactly once.

    In HA <= 2026.7 this may be a historically shared registry device.  In
    HA >= 2026.8 it is only the ESPHome split, never the Protect or
    SmartHomeShop split which copied the same product metadata.
    """
    device_registry = dr.async_get(hass)
    entity_registry = er.async_get(hass)
    seen: set[str] = set()
    for device in device_registry.devices.values():
        if device.id in seen or not _is_esphome_source_device(
            hass, device, entity_registry
        ):
            continue
        seen.add(device.id)
        yield device


def source_entity_ids_from_entry(entry: ConfigEntry) -> tuple[str, ...]:
    """Return ESPHome source entities stored in a product config entry."""
    return tuple(
        value
        for key, value in entry.data.items()
        if key.endswith("_sensor") and isinstance(value, str) and value
    )


def resolve_source_device(
    hass: HomeAssistant,
    device_id: str | None,
    *,
    source_entity_ids: Iterable[str] = (),
) -> dr.DeviceEntry | None:
    """Resolve any old/shared/split/fork id to the physical ESPHome device.

    Resolution first follows source entities because their registry
    association is unambiguous.  It then follows HA 2026.8 composite-device
    links and finally copied identifiers/connections, which covers forks made
    by versions of this integration that returned the source ``DeviceInfo``.
    """
    device_registry = dr.async_get(hass)
    entity_registry = er.async_get(hass)
    candidates: dict[str, dr.DeviceEntry] = {}
    preferred_ids: list[str] = []

    def add_concrete(candidate_id: str | None, *, preferred: bool = False) -> None:
        if not candidate_id:
            return
        candidate = device_registry.async_get(candidate_id)
        # A composite id can synthesize a read-only entry.  Only return live,
        # concrete devices from the registry mapping.
        if candidate is None or candidate_id not in device_registry.devices:
            return
        candidates[candidate.id] = candidate
        if preferred:
            preferred_ids.append(candidate.id)

    for entity_id in source_entity_ids:
        if not entity_id:
            continue
        entity = entity_registry.async_get(entity_id)
        if entity is not None:
            add_concrete(entity.device_id, preferred=True)

    requested_device = device_registry.async_get(device_id) if device_id else None
    add_concrete(device_id, preferred=True)

    # Entity lookups on a pre-2026.8 composite id fan out to all of its split
    # devices.  Their concrete device_id values let us select only ESPHome.
    if device_id:
        for entity in _entries_for_device(entity_registry, device_id):
            add_concrete(entity.device_id)

    composite_ids = {
        value
        for value in (
            device_id,
            getattr(requested_device, "composite_device_id", None),
        )
        if value
    }
    get_splits = getattr(
        device_registry, "async_get_devices_for_composite_device_id", None
    )
    if get_splits is not None:
        for composite_id in composite_ids:
            for split in get_splits(composite_id):
                add_concrete(split.id)

    # A post-2026.8 helper fork has no composite id, but it copied the source
    # identity.  Match across config entries and let the ESPHome ownership
    # filter below disambiguate it.
    if requested_device is not None:
        identifiers = set(getattr(requested_device, "identifiers", ()) or ())
        connections = set(getattr(requested_device, "connections", ()) or ())
        if identifiers or connections:
            for candidate in device_registry.devices.values():
                if (
                    identifiers
                    and identifiers
                    & set(getattr(candidate, "identifiers", ()) or ())
                ) or (
                    connections
                    and connections
                    & set(getattr(candidate, "connections", ()) or ())
                ):
                    add_concrete(candidate.id)

    sources = {
        candidate_id: candidate
        for candidate_id, candidate in candidates.items()
        if _is_esphome_source_device(hass, candidate, entity_registry)
    }
    if not sources:
        return None

    for preferred_id in preferred_ids:
        if preferred_id in sources:
            return sources[preferred_id]

    if len(sources) > 1:
        LOGGER.warning(
            "Several ESPHome source devices matched registry id %s: %s; "
            "using the stable first match",
            device_id,
            ", ".join(sorted(sources)),
        )
    return sources[min(sources)]


def resolve_entry_source_device(
    hass: HomeAssistant, entry: ConfigEntry
) -> dr.DeviceEntry | None:
    """Resolve the physical source for one SmartHomeShop config entry."""
    return resolve_source_device(
        hass,
        entry.data.get(CONF_DEVICE_ID),
        source_entity_ids=source_entity_ids_from_entry(entry),
    )


def entry_matches_source_device(
    hass: HomeAssistant, entry: ConfigEntry, source_device_id: str
) -> bool:
    """Return whether an entry belongs to a canonical ESPHome source."""
    if entry.data.get(CONF_DEVICE_ID) == source_device_id:
        return True
    source = resolve_entry_source_device(hass, entry)
    return source is not None and source.id == source_device_id


def config_entries_for_device_domain(
    hass: HomeAssistant, device_id: str, domain: str
) -> list[ConfigEntry]:
    """Find owning config entries without relying on deprecated config_entries."""
    device_registry = dr.async_get(hass)
    entity_registry = er.async_get(hass)
    device = device_registry.async_get(device_id)
    entry_ids: set[str] = set()

    if device is not None:
        entry_ids.update(device_config_entry_ids(device))
    for entity in _entries_for_device(entity_registry, device_id):
        if entity.platform == domain and entity.config_entry_id:
            entry_ids.add(entity.config_entry_id)

    return [
        entry
        for entry_id in sorted(entry_ids)
        if (entry := hass.config_entries.async_get_entry(entry_id)) is not None
        and entry.domain == domain
    ]


def _remove_legacy_helper_device(
    hass: HomeAssistant, helper_config_entry_id: str, source_device_id: str
) -> None:
    """Use the cleanup API available in the running Home Assistant version."""
    try:
        from homeassistant.helpers.helper_integration import (
            async_remove_helper_devices,
        )
    except ImportError:
        # HA 2025.7-2026.7 used the old name and still had shared devices.
        from homeassistant.helpers.helper_integration import (
            async_remove_helper_config_entry_from_source_device,
        )

        async_remove_helper_config_entry_from_source_device(
            hass,
            helper_config_entry_id=helper_config_entry_id,
            source_device_id=source_device_id,
        )
        return

    async_remove_helper_devices(
        hass,
        helper_config_entry_id=helper_config_entry_id,
        source_device_id=source_device_id,
    )


def prepare_config_entry_source_device(
    hass: HomeAssistant, entry: ConfigEntry
) -> dr.DeviceEntry | None:
    """Canonicalise an entry and clean up its obsolete shared/forked device.

    This runs on every setup, not only once during schema migration.  It is
    idempotent and therefore also repairs an installation where Home Assistant
    was upgraded to 2026.8 after SmartHomeShop had already migrated its entry.
    """
    source = resolve_entry_source_device(hass, entry)
    if source is None:
        LOGGER.warning(
            "Could not resolve the ESPHome source device for %s (%s)",
            entry.title,
            entry.data.get(CONF_DEVICE_ID),
        )
        return None

    old_device_id = entry.data.get(CONF_DEVICE_ID)
    if old_device_id != source.id:
        data = dict(entry.data)
        data[CONF_DEVICE_ID] = source.id
        product_type = data.get(CONF_PRODUCT_TYPE)
        unique_id = f"{product_type}_{source.id}" if product_type else entry.unique_id
        hass.config_entries.async_update_entry(
            entry, data=data, unique_id=unique_id
        )
        LOGGER.info(
            "Migrated %s from registry device %s to ESPHome source %s",
            entry.title,
            old_device_id,
            source.id,
        )

    _remove_legacy_helper_device(hass, entry.entry_id, source.id)
    return source
