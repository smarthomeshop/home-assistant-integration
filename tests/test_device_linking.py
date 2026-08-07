"""Regression tests for Home Assistant 2026.8 single-owner devices."""

import asyncio
import inspect
from types import SimpleNamespace

import custom_components.smarthomeshop as integration
from custom_components.smarthomeshop import device_linking, websocket_api


def _config_entry(entry_id: str, domain: str, **data):
    return SimpleNamespace(
        entry_id=entry_id,
        domain=domain,
        data=data,
        title=entry_id,
        unique_id=None,
        version=1,
        minor_version=1,
    )


def _device(
    device_id: str,
    entry_id: str,
    *,
    composite_id: str | None = None,
    identifier: str = "aa:bb:cc",
):
    return SimpleNamespace(
        id=device_id,
        config_entry_id=entry_id,
        config_entries={entry_id},
        composite_device_id=composite_id,
        identifiers={("esphome", identifier)},
        connections=set(),
        manufacturer="SmartHomeShop",
        model="ultimatesensor_mini_v2",
        name=f"Device {device_id}",
        name_by_user=None,
    )


def _entity(entity_id: str, device_id: str, platform: str, config_entry_id: str):
    return SimpleNamespace(
        entity_id=entity_id,
        device_id=device_id,
        platform=platform,
        config_entry_id=config_entry_id,
        domain=entity_id.split(".", 1)[0],
        original_device_class=None,
    )


class _DeviceRegistry:
    def __init__(self, devices, composite=None):
        self.devices = {device.id: device for device in devices}
        self._composite = composite or {}

    def async_get(self, device_id):
        if device_id in self.devices:
            return self.devices[device_id]
        splits = self._composite.get(device_id, [])
        if not splits:
            return None
        first = splits[0]
        return SimpleNamespace(
            id=device_id,
            identifiers=set(first.identifiers),
            connections=set(first.connections),
            composite_device_id=None,
        )

    def async_get_devices_for_composite_device_id(self, device_id):
        return list(self._composite.get(device_id, []))


class _EntityRegistry:
    def __init__(self, entities):
        self.entities = {entity.entity_id: entity for entity in entities}

    def async_get(self, entity_id):
        return self.entities.get(entity_id)


class _ConfigEntries:
    def __init__(self, entries):
        self._entries = {entry.entry_id: entry for entry in entries}
        self.updated = []

    def async_get_entry(self, entry_id):
        return self._entries.get(entry_id)

    def async_entries(self, domain):
        return [entry for entry in self._entries.values() if entry.domain == domain]

    def async_update_entry(self, entry, **changes):
        self.updated.append((entry, changes))
        if "data" in changes:
            entry.data = changes["data"]
        if "unique_id" in changes:
            entry.unique_id = changes["unique_id"]
        if "version" in changes:
            entry.version = changes["version"]
        if "minor_version" in changes:
            entry.minor_version = changes["minor_version"]


def _install(monkeypatch, devices, entities, entries, composite=None):
    device_registry = _DeviceRegistry(devices, composite)
    entity_registry = _EntityRegistry(entities)
    hass = SimpleNamespace(config_entries=_ConfigEntries(entries))
    monkeypatch.setattr(device_linking.dr, "async_get", lambda _hass: device_registry)
    monkeypatch.setattr(device_linking.er, "async_get", lambda _hass: entity_registry)

    def entries_for_device(_registry, device_id, **_kwargs):
        concrete_ids = {device_id}
        concrete_ids.update(
            device.id for device in (composite or {}).get(device_id, [])
        )
        return [
            entity
            for entity in entity_registry.entities.values()
            if entity.device_id in concrete_ids
        ]

    monkeypatch.setattr(
        device_linking.er, "async_entries_for_device", entries_for_device
    )
    return hass


def test_ha_2026_8_composite_and_all_splits_resolve_to_esphome(monkeypatch) -> None:
    esphome = _device("esp-device", "esp-entry", composite_id="old-device")
    smarthomeshop = _device("shs-device", "shs-entry", composite_id="old-device")
    protect = _device("protect-device", "protect-entry", composite_id="old-device")
    entities = [
        _entity("sensor.room_temperature", esphome.id, "esphome", "esp-entry"),
        _entity("sensor.room_quality", smarthomeshop.id, "smarthomeshop", "shs-entry"),
        _entity("update.room_firmware", protect.id, "protect", "protect-entry"),
    ]
    entries = [
        _config_entry("esp-entry", "esphome"),
        _config_entry("shs-entry", "smarthomeshop"),
        _config_entry("protect-entry", "protect"),
    ]
    splits = {"old-device": [esphome, smarthomeshop, protect]}
    hass = _install(
        monkeypatch, [esphome, smarthomeshop, protect], entities, entries, splits
    )

    for device_id in ("old-device", esphome.id, smarthomeshop.id, protect.id):
        assert device_linking.resolve_source_device(hass, device_id) is esphome

    assert list(device_linking.iter_esphome_source_devices(hass)) == [esphome]


def test_post_2026_8_helper_fork_resolves_by_copied_identity(monkeypatch) -> None:
    esphome = _device("esp-device", "esp-entry")
    helper_fork = _device("helper-fork", "shs-entry")
    hass = _install(
        monkeypatch,
        [helper_fork, esphome],
        [_entity("sensor.any_prefix_temperature", esphome.id, "esphome", "esp-entry")],
        [
            _config_entry("esp-entry", "esphome"),
            _config_entry("shs-entry", "smarthomeshop"),
        ],
    )

    assert device_linking.resolve_source_device(hass, helper_fork.id) is esphome


def test_source_entity_wins_with_arbitrary_entity_prefix(monkeypatch) -> None:
    esphome = _device("esp-device", "esp-entry", identifier="physical")
    unrelated = _device("other-device", "other-entry", identifier="other")
    source = _entity(
        "sensor.kitchen_custom_water_total", esphome.id, "esphome", "esp-entry"
    )
    hass = _install(
        monkeypatch,
        [unrelated, esphome],
        [source],
        [
            _config_entry("esp-entry", "esphome"),
            _config_entry("other-entry", "esphome"),
        ],
    )

    assert (
        device_linking.resolve_source_device(
            hass,
            unrelated.id,
            source_entity_ids=(source.entity_id,),
        )
        is esphome
    )


def test_prepare_migrates_saved_split_and_cleans_duplicate(monkeypatch) -> None:
    esphome = _device("esp-device", "esp-entry", composite_id="old-device")
    helper = _device("helper-device", "shs-entry", composite_id="old-device")
    entry = _config_entry(
        "shs-entry",
        "smarthomeshop",
        device_id=helper.id,
        product_type="ultimatesensor_mini",
    )
    hass = _install(
        monkeypatch,
        [esphome, helper],
        [_entity("sensor.any_name_temperature", esphome.id, "esphome", "esp-entry")],
        [entry, _config_entry("esp-entry", "esphome")],
        {"old-device": [esphome, helper]},
    )
    cleaned = []
    monkeypatch.setattr(
        device_linking,
        "_remove_legacy_helper_device",
        lambda _hass, helper_id, source_id: cleaned.append((helper_id, source_id)),
    )

    assert device_linking.prepare_config_entry_source_device(hass, entry) is esphome
    assert entry.data["device_id"] == esphome.id
    assert entry.unique_id == f"ultimatesensor_mini_{esphome.id}"
    assert cleaned == [(entry.entry_id, esphome.id)]


def test_pre_2026_8_shared_device_remains_the_source(monkeypatch) -> None:
    shared = SimpleNamespace(
        id="shared-device",
        config_entry_id=None,
        config_entries={"esp-entry", "shs-entry"},
        composite_device_id=None,
        identifiers={("esphome", "physical")},
        connections=set(),
        manufacturer="SmartHomeShop",
        model="p1meterkit",
        name="P1",
        name_by_user=None,
    )
    hass = _install(
        monkeypatch,
        [shared],
        [
            _entity("sensor.house_power", shared.id, "esphome", "esp-entry"),
            _entity("sensor.house_cost", shared.id, "smarthomeshop", "shs-entry"),
        ],
        [
            _config_entry("esp-entry", "esphome"),
            _config_entry("shs-entry", "smarthomeshop"),
        ],
    )

    assert device_linking.resolve_source_device(hass, shared.id) is shared
    assert list(device_linking.iter_esphome_source_devices(hass)) == [shared]


def test_dashboard_returns_one_card_for_three_2026_8_splits(monkeypatch) -> None:
    esphome = _device("esp-device", "esp-entry", composite_id="old-device")
    helper = _device("helper-device", "shs-entry", composite_id="old-device")
    protect = _device("protect-device", "protect-entry", composite_id="old-device")
    entities = [
        _entity("sensor.office_temperature", esphome.id, "esphome", "esp-entry"),
        _entity("sensor.office_quality", helper.id, "smarthomeshop", "shs-entry"),
        _entity("update.office_firmware", protect.id, "protect", "protect-entry"),
    ]
    shs_entry = _config_entry(
        "shs-entry",
        "smarthomeshop",
        device_id=helper.id,
        product_type="ultimatesensor_mini",
    )
    splits = {"old-device": [esphome, helper, protect]}
    hass = _install(
        monkeypatch,
        [esphome, helper, protect],
        entities,
        [
            _config_entry("esp-entry", "esphome"),
            shs_entry,
            _config_entry("protect-entry", "protect"),
        ],
        splits,
    )
    hass.states = {}
    entity_registry = device_linking.er.async_get(hass)
    monkeypatch.setattr(websocket_api.er, "async_get", lambda _hass: entity_registry)
    monkeypatch.setattr(
        websocket_api.er,
        "async_entries_for_device",
        device_linking.er.async_entries_for_device,
    )
    connection = SimpleNamespace(
        result=None,
        send_result=lambda _message_id, result: setattr(connection, "result", result),
    )

    inspect.unwrap(websocket_api.ws_get_devices)(
        hass, connection, {"id": 1}
    )

    assert [device["id"] for device in connection.result["devices"]] == [esphome.id]
    assert connection.result["devices"][0]["integration_linked"] is True


def test_config_entry_schema_migration_prepares_source_and_updates_version(
    monkeypatch,
) -> None:
    entry = _config_entry("shs-entry", "smarthomeshop")
    hass = SimpleNamespace(config_entries=_ConfigEntries([entry]))
    prepared = []
    monkeypatch.setattr(
        integration,
        "prepare_config_entry_source_device",
        lambda _hass, candidate: prepared.append(candidate),
    )

    assert asyncio.run(integration.async_migrate_entry(hass, entry)) is True
    assert prepared == [entry]
    assert (entry.version, entry.minor_version) == (2, 1)
