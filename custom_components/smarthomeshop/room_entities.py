"""Stable Home Assistant entities for aggregated multi-sensor rooms."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import (
    SIGNAL_CONFIG_ENTRY_CHANGED,
    ConfigEntry,
    ConfigEntryChange,
    ConfigEntryState,
)
from homeassistant.const import (
    CONCENTRATION_PARTS_PER_MILLION,
    PERCENTAGE,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, MANUFACTURER, SIGNAL_ROOMS_CHANGED
from .room_runtime import ROOM_RUNTIME_COORDINATOR, RoomRuntimeCoordinator

ROOM_HOST = "room_entity_host"
ROOM_HOST_PENDING = "room_entity_host_pending"


@callback
def _host_is_usable(hass: HomeAssistant, entry_id: str | None) -> bool:
    if not entry_id:
        return False
    active_states = {
        ConfigEntryState.LOADED,
        ConfigEntryState.SETUP_IN_PROGRESS,
        ConfigEntryState.UNLOAD_IN_PROGRESS,
        ConfigEntryState.NOT_LOADED,
    }
    return any(
        entry.entry_id == entry_id
        and not entry.disabled_by
        and entry.state in active_states
        for entry in hass.config_entries.async_entries(DOMAIN)
    )


@callback
def claim_room_host(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Elect exactly one config entry to host account-wide room entities."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get(ROOM_HOST_PENDING) == config_entry.entry_id:
        domain_data[ROOM_HOST] = config_entry.entry_id
        domain_data.pop(ROOM_HOST_PENDING, None)
        return True
    host = domain_data.get(ROOM_HOST)
    if host != config_entry.entry_id and _host_is_usable(hass, host):
        return False
    domain_data[ROOM_HOST] = config_entry.entry_id
    return True


@callback
def track_room_host(hass: HomeAssistant, config_entry: ConfigEntry) -> None:
    """Move room entities when their current host is disabled or removed."""

    @callback
    def _entry_changed(change: ConfigEntryChange, entry: ConfigEntry) -> None:
        if entry.domain != DOMAIN:
            return
        domain_data = hass.data.setdefault(DOMAIN, {})
        host = domain_data.get(ROOM_HOST)
        if _host_is_usable(hass, host):
            return
        loaded = sorted(
            candidate.entry_id
            for candidate in hass.config_entries.async_entries(DOMAIN)
            if not candidate.disabled_by and candidate.state is ConfigEntryState.LOADED
        )
        if not loaded or loaded[0] != config_entry.entry_id:
            return
        domain_data[ROOM_HOST] = config_entry.entry_id
        domain_data[ROOM_HOST_PENDING] = config_entry.entry_id
        hass.config_entries.async_schedule_reload(config_entry.entry_id)

    config_entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_CONFIG_ENTRY_CHANGED, _entry_changed)
    )


class _RoomEntity(CoordinatorEntity[RoomRuntimeCoordinator]):
    """Common room identity and update behavior."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: RoomRuntimeCoordinator,
        room: dict[str, Any],
        suffix: str,
    ) -> None:
        super().__init__(coordinator)
        self._room = dict(room)
        self._room_id = str(room["id"])
        self._attr_unique_id = f"{DOMAIN}_room_{self._room_id}_{suffix}"

    def update_room(self, room: dict[str, Any]) -> None:
        """Apply a rename/configuration update without replacing the entity."""
        self._room = dict(room)
        if self.hass:
            registry = dr.async_get(self.hass)
            device = registry.async_get_device(
                identifiers={(DOMAIN, f"room:{self._room_id}")}
            )
            if device is not None and device.name != self.device_info["name"]:
                registry.async_update_device(device.id, name=self.device_info["name"])
            self.async_write_ha_state()

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={(DOMAIN, f"room:{self._room_id}")},
            name=str(self._room.get("name") or "Room"),
            manufacturer=MANUFACTURER,
            model="Multi-sensor room",
        )

    @property
    def _snapshot(self) -> dict[str, Any]:
        return (self.coordinator.data or {}).get(self._room_id, {})


class SmartHomeShopRoomOccupancyBinarySensor(_RoomEntity, BinarySensorEntity):
    """Combined presence: any positive wins, unknown never becomes clear."""

    _attr_translation_key = "room_occupancy"
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    def __init__(self, coordinator: RoomRuntimeCoordinator, room: dict[str, Any]) -> None:
        super().__init__(coordinator, room, "occupancy")

    @property
    def available(self) -> bool:
        return self.coordinator.last_update_success and self._snapshot.get("presence", {}).get("occupied") is not None

    @property
    def is_on(self) -> bool | None:
        return self._snapshot.get("presence", {}).get("occupied")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        snapshot = self._snapshot
        presence = snapshot.get("presence", {})
        return {
            "status": presence.get("status", "unknown"),
            "degraded": bool(presence.get("degraded", True)),
            "positive_sources": presence.get("positive_sources", []),
            "negative_sources": presence.get("negative_sources", []),
            "unknown_sources": presence.get("unknown_sources", []),
            "freshness_seconds": snapshot.get("freshness_seconds"),
            "vacancy_delay_seconds": snapshot.get("vacancy_delay_seconds"),
            "source_count": len(snapshot.get("sources", [])),
        }


_METRIC_ENTITY = {
    "temperature": (
        "room_temperature",
        SensorDeviceClass.TEMPERATURE,
        UnitOfTemperature.CELSIUS,
    ),
    "humidity": ("room_humidity", SensorDeviceClass.HUMIDITY, PERCENTAGE),
    "co2": (
        "room_co2",
        SensorDeviceClass.CO2,
        CONCENTRATION_PARTS_PER_MILLION,
    ),
}


class SmartHomeShopRoomClimateSensor(_RoomEntity, SensorEntity):
    """One configured primary or average climate value for a room."""

    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(
        self,
        coordinator: RoomRuntimeCoordinator,
        room: dict[str, Any],
        metric: str,
    ) -> None:
        super().__init__(coordinator, room, metric)
        self.metric = metric
        translation_key, device_class, unit = _METRIC_ENTITY[metric]
        self._attr_translation_key = translation_key
        self._attr_device_class = device_class
        self._attr_native_unit_of_measurement = unit

    @property
    def available(self) -> bool:
        return self.coordinator.last_update_success and bool(self._snapshot.get("climate", {}).get(self.metric, {}).get("available"))

    @property
    def native_value(self) -> float | None:
        return self._snapshot.get("climate", {}).get(self.metric, {}).get("value")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        result = dict(self._snapshot.get("climate", {}).get(self.metric, {}))
        result.pop("value", None)
        result.pop("available", None)
        return result


def _remove_entity_from_registry(
    hass: HomeAssistant, domain: str, unique_id: str
) -> None:
    registry = er.async_get(hass)
    entity_id = registry.async_get_entity_id(domain, DOMAIN, unique_id)
    if entity_id:
        registry.async_remove(entity_id)


def _remove_room_device_if_orphaned(hass: HomeAssistant, room_id: str) -> None:
    """Remove a deleted virtual room device after its final entity is gone."""
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    device = device_registry.async_get_device(
        identifiers={(DOMAIN, f"room:{room_id}")}
    )
    if device is None:
        return
    if er.async_entries_for_device(
        entity_registry, device.id, include_disabled_entities=True
    ):
        return
    device_registry.async_remove_device(device.id)


@callback
def setup_room_binary_entities(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
    initial_entities: list[BinarySensorEntity],
) -> None:
    """Add/remove stable combined room occupancy entities live."""
    coordinator = hass.data.get(DOMAIN, {}).get(ROOM_RUNTIME_COORDINATOR)
    store = hass.data.get(DOMAIN, {}).get("store")
    if not isinstance(coordinator, RoomRuntimeCoordinator) or store is None:
        return
    known: dict[str, SmartHomeShopRoomOccupancyBinarySensor] = {}

    @callback
    def _sync() -> None:
        rooms = {str(room["id"]): room for room in store.get_rooms() if room.get("id")}
        new: list[BinarySensorEntity] = []
        for room_id, room in rooms.items():
            if room_id in known:
                known[room_id].update_room(room)
            else:
                entity = SmartHomeShopRoomOccupancyBinarySensor(coordinator, room)
                known[room_id] = entity
                new.append(entity)
        if new:
            async_add_entities(new)
        for room_id in list(known):
            if room_id in rooms:
                continue
            entity = known.pop(room_id)
            hass.async_create_task(entity.async_remove(force_remove=True))
            _remove_entity_from_registry(hass, "binary_sensor", entity.unique_id)
            _remove_room_device_if_orphaned(hass, room_id)

    for room in store.get_rooms():
        if not room.get("id"):
            continue
        entity = SmartHomeShopRoomOccupancyBinarySensor(coordinator, room)
        known[str(room["id"])] = entity
        initial_entities.append(entity)
    config_entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_ROOMS_CHANGED, _sync))


@callback
def setup_room_climate_entities(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
    initial_entities: list[SensorEntity],
) -> None:
    """Add/remove the three stable combined climate entities per room."""
    coordinator = hass.data.get(DOMAIN, {}).get(ROOM_RUNTIME_COORDINATOR)
    store = hass.data.get(DOMAIN, {}).get("store")
    if not isinstance(coordinator, RoomRuntimeCoordinator) or store is None:
        return
    known: dict[tuple[str, str], SmartHomeShopRoomClimateSensor] = {}

    @callback
    def _sync() -> None:
        rooms = {str(room["id"]): room for room in store.get_rooms() if room.get("id")}
        new: list[SensorEntity] = []
        for room_id, room in rooms.items():
            for metric in _METRIC_ENTITY:
                key = (room_id, metric)
                if key in known:
                    known[key].update_room(room)
                else:
                    entity = SmartHomeShopRoomClimateSensor(coordinator, room, metric)
                    known[key] = entity
                    new.append(entity)
        if new:
            async_add_entities(new)
        for key in list(known):
            if key[0] in rooms:
                continue
            entity = known.pop(key)
            hass.async_create_task(entity.async_remove(force_remove=True))
            _remove_entity_from_registry(hass, "sensor", entity.unique_id)
            _remove_room_device_if_orphaned(hass, key[0])

    for room in store.get_rooms():
        if not room.get("id"):
            continue
        for metric in _METRIC_ENTITY:
            entity = SmartHomeShopRoomClimateSensor(coordinator, room, metric)
            known[(str(room["id"]), metric)] = entity
            initial_entities.append(entity)
    config_entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_ROOMS_CHANGED, _sync))
