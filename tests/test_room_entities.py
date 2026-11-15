"""Tests for stable multi-sensor room entity hosting."""

from __future__ import annotations

from types import SimpleNamespace

from homeassistant.config_entries import ConfigEntryState

from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop import room_entities
from custom_components.smarthomeshop import sensor as sensor_platform


class _Entry(SimpleNamespace):
    def async_on_unload(self, callback):
        self.unload_callback = callback


class _Entries:
    def __init__(self, entries):
        self.entries = entries
        self.reloads: list[str] = []

    def async_entries(self, domain):
        assert domain == DOMAIN
        return self.entries

    def async_schedule_reload(self, entry_id):
        self.reloads.append(entry_id)


def test_surviving_entry_claims_room_entities_after_host_unloads(monkeypatch) -> None:
    old_host = _Entry(
        entry_id="entry-a",
        domain=DOMAIN,
        disabled_by="user",
        state=ConfigEntryState.NOT_LOADED,
    )
    survivor = _Entry(
        entry_id="entry-b",
        domain=DOMAIN,
        disabled_by=None,
        state=ConfigEntryState.LOADED,
    )
    manager = _Entries([old_host, survivor])
    hass = SimpleNamespace(
        data={DOMAIN: {room_entities.ROOM_HOST: old_host.entry_id}},
        config_entries=manager,
    )
    callbacks = []

    def _connect(_hass, _signal, callback):
        callbacks.append(callback)
        return lambda: None

    monkeypatch.setattr(room_entities, "async_dispatcher_connect", _connect)
    room_entities.track_room_host(hass, survivor)
    callbacks[0](None, old_host)

    assert hass.data[DOMAIN][room_entities.ROOM_HOST] == survivor.entry_id
    assert hass.data[DOMAIN][room_entities.ROOM_HOST_PENDING] == survivor.entry_id
    assert manager.reloads == [survivor.entry_id]

    survivor.state = ConfigEntryState.SETUP_IN_PROGRESS
    assert room_entities.claim_room_host(hass, survivor) is True
    assert room_entities.ROOM_HOST_PENDING not in hass.data[DOMAIN]


def test_loaded_host_is_not_stolen_by_another_entry() -> None:
    first = _Entry(
        entry_id="entry-a",
        domain=DOMAIN,
        disabled_by=None,
        state=ConfigEntryState.LOADED,
    )
    second = _Entry(
        entry_id="entry-b",
        domain=DOMAIN,
        disabled_by=None,
        state=ConfigEntryState.LOADED,
    )
    manager = _Entries([first, second])
    hass = SimpleNamespace(
        data={DOMAIN: {room_entities.ROOM_HOST: first.entry_id}},
        config_entries=manager,
    )

    assert room_entities.claim_room_host(hass, second) is False
    assert hass.data[DOMAIN][room_entities.ROOM_HOST] == first.entry_id


def test_normal_host_reload_does_not_trigger_failover(monkeypatch) -> None:
    reloading_host = _Entry(
        entry_id="entry-a",
        domain=DOMAIN,
        disabled_by=None,
        state=ConfigEntryState.UNLOAD_IN_PROGRESS,
    )
    survivor = _Entry(
        entry_id="entry-b",
        domain=DOMAIN,
        disabled_by=None,
        state=ConfigEntryState.LOADED,
    )
    manager = _Entries([reloading_host, survivor])
    hass = SimpleNamespace(
        data={DOMAIN: {room_entities.ROOM_HOST: reloading_host.entry_id}},
        config_entries=manager,
    )
    callbacks = []

    def _connect(_hass, _signal, callback):
        callbacks.append(callback)
        return lambda: None

    monkeypatch.setattr(room_entities, "async_dispatcher_connect", _connect)
    room_entities.track_room_host(hass, survivor)
    callbacks[0](None, reloading_host)

    assert hass.data[DOMAIN][room_entities.ROOM_HOST] == reloading_host.entry_id
    assert manager.reloads == []


def test_setup_in_progress_reserves_the_host_during_parallel_startup() -> None:
    first = _Entry(
        entry_id="entry-a",
        domain=DOMAIN,
        disabled_by=None,
        state=ConfigEntryState.SETUP_IN_PROGRESS,
    )
    second = _Entry(
        entry_id="entry-b",
        domain=DOMAIN,
        disabled_by=None,
        state=ConfigEntryState.SETUP_IN_PROGRESS,
    )
    manager = _Entries([first, second])
    hass = SimpleNamespace(data={DOMAIN: {}}, config_entries=manager)

    assert room_entities.claim_room_host(hass, first) is True
    assert room_entities.claim_room_host(hass, second) is False


def test_room_occupancy_attributes_do_not_publish_changing_source_ages() -> None:
    entity = object.__new__(room_entities.SmartHomeShopRoomOccupancyBinarySensor)
    entity.coordinator = SimpleNamespace(
        data={
            "office": {
                "presence": {
                    "status": "occupied",
                    "degraded": False,
                    "positive_sources": ["a"],
                    "negative_sources": [],
                    "unknown_sources": [],
                },
                "freshness_seconds": 120,
                "vacancy_delay_seconds": 30,
                "sources": [{"source_id": "a", "age_seconds": 0.2}],
            }
        }
    )
    entity._room_id = "office"

    attributes = entity.extra_state_attributes
    assert attributes["source_count"] == 1
    assert "sources" not in attributes
    assert "age_seconds" not in repr(attributes)


def test_deleted_room_device_is_removed_only_after_its_last_entity(monkeypatch) -> None:
    entity_registry = object()
    device = SimpleNamespace(id="room-device")
    removed: list[str] = []
    device_registry = SimpleNamespace(
        async_get_device=lambda **_kwargs: device,
        async_remove_device=removed.append,
    )
    remaining = [SimpleNamespace(entity_id="sensor.room_temperature")]
    monkeypatch.setattr(room_entities.er, "async_get", lambda _hass: entity_registry)
    monkeypatch.setattr(room_entities.dr, "async_get", lambda _hass: device_registry)
    monkeypatch.setattr(
        room_entities.er,
        "async_entries_for_device",
        lambda _registry, _device_id, include_disabled_entities: list(remaining),
    )

    room_entities._remove_room_device_if_orphaned(SimpleNamespace(), "office")
    assert removed == []

    remaining.clear()
    room_entities._remove_room_device_if_orphaned(SimpleNamespace(), "office")
    assert removed == ["room-device"]


def test_new_room_host_reenables_entities_disabled_with_the_old_host(
    monkeypatch,
) -> None:
    registry_entry = SimpleNamespace(
        disabled_by=sensor_platform.er.RegistryEntryDisabler.CONFIG_ENTRY,
        config_entry_id="old-host",
    )
    updates = []
    registry = SimpleNamespace(
        async_get_entity_id=lambda _domain, _platform, _unique_id: (
            "binary_sensor.room_occupancy"
        ),
        async_get=lambda _entity_id: registry_entry,
        async_update_entity=lambda entity_id, **changes: updates.append(
            (entity_id, changes)
        ),
    )
    monkeypatch.setattr(sensor_platform.er, "async_get", lambda _hass: registry)
    entity = SimpleNamespace(unique_id="smarthomeshop_room_office_occupancy")

    sensor_platform.adopt_account_entities(
        SimpleNamespace(),
        SimpleNamespace(entry_id="new-host"),
        "binary_sensor",
        [entity],
    )

    assert updates == [("binary_sensor.room_occupancy", {"disabled_by": None})]
