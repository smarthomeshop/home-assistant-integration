"""Safety tests for dashboard device removal."""

import asyncio
from types import SimpleNamespace

from custom_components.smarthomeshop import websocket_api


_remove_device = websocket_api.ws_remove_device.__wrapped__


class _Connection:
    def __init__(self, *, admin: bool = True) -> None:
        self.user = SimpleNamespace(is_admin=admin)
        self.result = None
        self.error = None

    def send_result(self, _message_id, result) -> None:
        self.result = result

    def send_error(self, _message_id, code, message) -> None:
        self.error = (code, message)


class _ConfigEntries:
    def __init__(self, entries) -> None:
        self._entries = {entry.entry_id: entry for entry in entries}
        self.removed: list[str] = []

    def async_entries(self, domain):
        return [entry for entry in self._entries.values() if entry.domain == domain]

    def async_get_entry(self, entry_id):
        return self._entries.get(entry_id)

    async def async_remove(self, entry_id):
        self.removed.append(entry_id)
        self._entries.pop(entry_id)
        return {"require_restart": False}


def _entry(entry_id: str, domain: str, device_id: str | None = None):
    return SimpleNamespace(
        entry_id=entry_id,
        domain=domain,
        data={websocket_api.CONF_DEVICE_ID: device_id} if device_id else {},
    )


def _hass(monkeypatch, *, linked: bool = True, esphome: bool = True):
    device_id = "device-1"
    entries = []
    config_entry_ids = set()
    if linked:
        entries.append(_entry("shs-entry", websocket_api.DOMAIN, device_id))
        config_entry_ids.add("shs-entry")
    if esphome:
        entries.append(_entry("esphome-entry", "esphome"))
        config_entry_ids.add("esphome-entry")
    device = SimpleNamespace(id=device_id, config_entries=config_entry_ids)
    registry = SimpleNamespace(async_get=lambda requested: device if requested == device_id else None)
    monkeypatch.setattr(websocket_api.dr, "async_get", lambda _hass: registry)
    monkeypatch.setattr(
        websocket_api,
        "_product_for_registry_device",
        lambda _hass, _device: "ceilsense",
    )
    return SimpleNamespace(config_entries=_ConfigEntries(entries)), device_id


def test_unlink_removes_only_smarthomeshop(monkeypatch) -> None:
    hass, device_id = _hass(monkeypatch)
    connection = _Connection()

    asyncio.run(
        _remove_device(
            hass,
            connection,
            {"id": 1, "device_id": device_id, "mode": "unlink"},
        )
    )

    assert connection.error is None
    assert connection.result["removed_smarthomeshop"] is True
    assert connection.result["removed_esphome"] is False
    assert hass.config_entries.removed == ["shs-entry"]


def test_full_removal_unlinks_before_removing_esphome(monkeypatch) -> None:
    hass, device_id = _hass(monkeypatch)
    connection = _Connection()

    asyncio.run(
        _remove_device(
            hass,
            connection,
            {"id": 2, "device_id": device_id, "mode": "full"},
        )
    )

    assert connection.error is None
    assert connection.result["removed_smarthomeshop"] is True
    assert connection.result["removed_esphome"] is True
    assert hass.config_entries.removed == ["shs-entry", "esphome-entry"]


def test_non_admin_cannot_remove_any_entry(monkeypatch) -> None:
    hass, device_id = _hass(monkeypatch)
    connection = _Connection(admin=False)

    asyncio.run(
        _remove_device(
            hass,
            connection,
            {"id": 3, "device_id": device_id, "mode": "full"},
        )
    )

    assert connection.error == ("unauthorized", "Administrator required")
    assert hass.config_entries.removed == []
