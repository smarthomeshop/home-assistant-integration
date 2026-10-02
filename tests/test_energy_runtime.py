"""Tests for the opt-in Smart Energy lifecycle."""

import asyncio
from types import SimpleNamespace

from custom_components.smarthomeshop.const import (
    CONF_PRODUCT_TYPE,
    DOMAIN,
    PRODUCT_P1METERKIT,
    PRODUCT_ULTIMATESENSOR,
)
from custom_components.smarthomeshop.energy_runtime import (
    async_ensure_energy_preference,
    energy_runtime_enabled,
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
