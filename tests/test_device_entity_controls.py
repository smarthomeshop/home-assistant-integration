"""Tests for disabled ESPHome controls exposed by the device settings page."""

import asyncio
import inspect
from types import SimpleNamespace

from custom_components.smarthomeshop import websocket_api


class _Connection:
    def __init__(self) -> None:
        self.result = None
        self.error = None

    def send_result(self, _message_id, result) -> None:
        self.result = result

    def send_error(self, _message_id, code, message) -> None:
        self.error = (code, message)


class _EntityEntries(dict):
    def get_entries_for_device_id(
        self, device_id, _include_disabled_entities=False
    ):
        return [
            entity for entity in self.values() if entity.device_id == device_id
        ]


class _Registry:
    def __init__(self, entity) -> None:
        self.entities = _EntityEntries({entity.entity_id: entity})
        self.updated = None

    def async_get(self, entity_id):
        return self.entities.get(entity_id)

    def async_update_entity(self, entity_id, **changes) -> None:
        self.updated = (entity_id, changes)
        for key, value in changes.items():
            setattr(self.entities[entity_id], key, value)


class _ConfigEntries:
    def __init__(self) -> None:
        self.reloaded = []

    def async_get_entry(self, entry_id):
        return SimpleNamespace(entry_id=entry_id) if entry_id == "esphome-entry" else None

    async def async_reload(self, entry_id):
        self.reloaded.append(entry_id)
        return True


def _entity(**overrides):
    values = {
        "entity_id": "button.ultimate_co2_manual_calibration",
        "device_id": "device-1",
        "name": None,
        "original_name": "CO2 Manual Calibration",
        "platform": "esphome",
        "domain": "button",
        "disabled_by": SimpleNamespace(value="integration"),
        "entity_category": SimpleNamespace(value="config"),
        "config_entry_id": "esphome-entry",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_device_entities_report_registry_disabled_state(monkeypatch) -> None:
    entity = _entity()
    registry = _Registry(entity)
    monkeypatch.setattr(websocket_api.er, "async_get", lambda _hass: registry)
    hass = SimpleNamespace(states={})
    connection = _Connection()

    inspect.unwrap(websocket_api.ws_get_device_entities)(
        hass, connection, {"id": 1, "device_id": "device-1"}
    )

    assert connection.error is None
    assert connection.result["entities"][0]["disabled_by"] == "integration"
    assert connection.result["entities"][0]["entity_category"] == "config"
    assert connection.result["entities"][0]["state"] is None


def test_enable_device_entity_enables_and_reloads_esphome(monkeypatch) -> None:
    entity = _entity()
    registry = _Registry(entity)
    monkeypatch.setattr(websocket_api.er, "async_get", lambda _hass: registry)
    config_entries = _ConfigEntries()
    hass = SimpleNamespace(config_entries=config_entries)
    connection = _Connection()

    asyncio.run(
        inspect.unwrap(websocket_api.ws_enable_device_entity)(
            hass,
            connection,
            {
                "id": 2,
                "device_id": "device-1",
                "entity_id": entity.entity_id,
            },
        )
    )

    assert connection.error is None
    assert connection.result == {"success": True, "already_enabled": False}
    assert registry.updated == (entity.entity_id, {"disabled_by": None})
    assert config_entries.reloaded == ["esphome-entry"]


def test_enable_rejects_entity_from_another_device(monkeypatch) -> None:
    entity = _entity(device_id="another-device")
    registry = _Registry(entity)
    monkeypatch.setattr(websocket_api.er, "async_get", lambda _hass: registry)
    hass = SimpleNamespace(config_entries=_ConfigEntries())
    connection = _Connection()

    asyncio.run(
        inspect.unwrap(websocket_api.ws_enable_device_entity)(
            hass,
            connection,
            {
                "id": 3,
                "device_id": "device-1",
                "entity_id": entity.entity_id,
            },
        )
    )

    assert connection.result is None
    assert connection.error == (
        "entity_not_found",
        "The entity does not belong to this device",
    )
    assert registry.updated is None
