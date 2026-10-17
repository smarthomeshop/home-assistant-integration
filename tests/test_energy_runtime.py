"""Tests for the opt-in Smart Energy lifecycle."""

import asyncio
from types import SimpleNamespace

from custom_components.smarthomeshop.const import (
    CONF_PRODUCT_TYPE,
    DOMAIN,
    PRODUCT_P1METERKIT,
    PRODUCT_ULTIMATESENSOR,
)
from custom_components.smarthomeshop import energy_runtime
from custom_components.smarthomeshop.energy_runtime import (
    async_ensure_energy_preference,
    energy_runtime_enabled,
    remove_account_energy_registry_entries,
)


class _Store:
    def __init__(self, *, sources=None, account=None, battery=None, schedules=None):
        self.sources = dict(sources or {})
        self.account = dict(account or {})
        self.battery = dict(battery or {})
        self.schedules = list(schedules or [])

    def get_energy_sources(self):
        return dict(self.sources)

    async def async_set_energy_sources(self, sources):
        self.sources = dict(sources)
        return dict(self.sources)

    def get_account(self):
        return dict(self.account)

    def get_battery(self):
        return dict(self.battery)

    def get_schedules(self):
        return list(self.schedules)


def _hass(store, product_type):
    entry = SimpleNamespace(data={CONF_PRODUCT_TYPE: product_type})
    config_entries = SimpleNamespace(
        async_entries=lambda domain: [entry] if domain == DOMAIN else []
    )
    return SimpleNamespace(
        data={DOMAIN: {"store": store}},
        config_entries=config_entries,
    )


class _LegacyDeviceRegistry:
    """Device registry before HA 2026.8, with only the single-device lookup."""

    def __init__(self, devices):
        self.devices = {device.id: device for device in devices}
        self.removed = []

    def _matching(self, identifiers):
        return [
            device
            for device in self.devices.values()
            if identifiers and identifiers & device.identifiers
        ]

    def async_get_device(self, identifiers=None, connections=None):
        matches = self._matching(identifiers)
        return matches[0] if matches else None

    def async_remove_device(self, device_id):
        self.removed.append(device_id)
        del self.devices[device_id]


class _DeviceRegistry(_LegacyDeviceRegistry):
    """Device registry since HA 2026.8, where identifiers are per config entry."""

    def async_get_devices(
        self, *, identifiers=None, connections=None, config_entry_id=None
    ):
        return self._matching(identifiers)

    def async_get_device(self, identifiers=None, connections=None):
        raise AssertionError("deprecated async_get_device() was used on HA 2026.9")


class _EntityRegistry:
    def __init__(self, entities):
        self.entities = {entity.entity_id: entity for entity in entities}

    def async_remove(self, entity_id):
        del self.entities[entity_id]


def _device(device_id, *identifiers):
    return SimpleNamespace(id=device_id, identifiers=set(identifiers))


def _entity(entity_id, platform, unique_id):
    return SimpleNamespace(entity_id=entity_id, platform=platform, unique_id=unique_id)


def _install_registries(monkeypatch, device_registry, entities=()):
    entity_registry = _EntityRegistry(entities)
    monkeypatch.setattr(energy_runtime.dr, "async_get", lambda _hass: device_registry)
    monkeypatch.setattr(energy_runtime.er, "async_get", lambda _hass: entity_registry)
    return entity_registry


def test_sensor_only_installation_defaults_energy_to_disabled() -> None:
    store = _Store()
    hass = _hass(store, PRODUCT_ULTIMATESENSOR)

    assert asyncio.run(async_ensure_energy_preference(hass)) is False
    assert store.sources["energy_dashboard_enabled"] is False
    assert energy_runtime_enabled(hass) is False


def test_existing_p1_installation_keeps_energy_enabled() -> None:
    store = _Store()
    hass = _hass(store, PRODUCT_P1METERKIT)

    assert asyncio.run(async_ensure_energy_preference(hass)) is True
    assert store.sources["energy_dashboard_enabled"] is True


def test_existing_account_connection_keeps_energy_enabled() -> None:
    store = _Store(account={"api_key": "secret"})
    hass = _hass(store, PRODUCT_ULTIMATESENSOR)

    assert asyncio.run(async_ensure_energy_preference(hass)) is True


def test_explicit_disabled_preference_is_never_overridden() -> None:
    store = _Store(
        sources={"energy_dashboard_enabled": False},
        account={"api_key": "secret"},
    )
    hass = _hass(store, PRODUCT_P1METERKIT)

    assert asyncio.run(async_ensure_energy_preference(hass)) is False


def test_disabling_energy_removes_account_devices_of_every_config_entry(
    monkeypatch,
) -> None:
    device_registry = _DeviceRegistry(
        [
            _device("prices", (DOMAIN, "energy_prices")),
            _device("prices-split", (DOMAIN, "energy_prices")),
            _device("planner", (DOMAIN, "battery_planner")),
            _device("p1meterkit", ("esphome", "p1meterkit-1a2b3c")),
        ]
    )
    entity_registry = _install_registries(
        monkeypatch,
        device_registry,
        [
            _entity("sensor.energy_price", DOMAIN, f"{DOMAIN}_price_current"),
            _entity("sensor.battery_plan", DOMAIN, f"{DOMAIN}_battery_plan"),
            _entity("sensor.power", DOMAIN, "p1meterkit-1a2b3c_power"),
            _entity("sensor.other_price", "other", f"{DOMAIN}_price_current"),
        ],
    )

    remove_account_energy_registry_entries(SimpleNamespace())

    assert device_registry.removed == ["prices", "prices-split", "planner"]
    assert list(device_registry.devices) == ["p1meterkit"]
    assert list(entity_registry.entities) == ["sensor.power", "sensor.other_price"]


def test_disabling_energy_removes_account_devices_before_ha_2026_8(
    monkeypatch,
) -> None:
    device_registry = _LegacyDeviceRegistry(
        [
            _device("prices", (DOMAIN, "energy_prices")),
            _device("p1meterkit", ("esphome", "p1meterkit-1a2b3c")),
        ]
    )
    _install_registries(monkeypatch, device_registry)

    remove_account_energy_registry_entries(SimpleNamespace())

    assert device_registry.removed == ["prices"]
    assert list(device_registry.devices) == ["p1meterkit"]
