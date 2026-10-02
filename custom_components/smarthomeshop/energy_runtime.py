"""Lifecycle for the optional account-wide Smart Energy module."""

from __future__ import annotations

import asyncio
from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import (
    CONF_PRODUCT_TYPE,
    DOMAIN,
    LOGGER,
    PRODUCT_P1METERKIT,
    PRODUCT_WATERP1METERKIT,
)

ENERGY_ENABLED = "energy_dashboard_enabled"
_RECONFIGURE_TASK = "energy_runtime_reconfigure_task"
_RECONFIGURE_TARGET = "energy_runtime_reconfigure_target"
_ACCOUNT_REFRESH_TASK = "account_price_refresh_task"
_ACCOUNT_ENTITY_PREFIXES = (
    f"{DOMAIN}_price_",
    f"{DOMAIN}_smart_savings_",
    f"{DOMAIN}_battery_",
    f"{DOMAIN}_schedule_",
)
_ACCOUNT_DEVICE_IDENTIFIERS = (
    (DOMAIN, "energy_prices"),
    (DOMAIN, "battery_planner"),
)


def energy_runtime_enabled(hass: HomeAssistant) -> bool:
    """Return the persisted Smart Energy preference."""
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        return False
    return store.get_energy_sources().get(ENERGY_ENABLED, False) is not False


def _legacy_installation_uses_energy(hass: HomeAssistant, store: Any) -> bool:
    """Preserve Energy for installations that used it before opt-in existed."""
    sources = store.get_energy_sources()
    source_keys = (
        "p1_device",
        "solar_power",
        "battery_power",
        "battery_soc",
        "battery_capacity_kwh",
        "battery_capacity_entity",
        "pv_forecast",
    )
    if any(sources.get(key) not in (None, "", 0) for key in source_keys):
        return True
    if store.get_account().get("api_key"):
        return True
    if store.get_battery().get("enabled") or store.get_schedules():
        return True
    return any(
        entry.data.get(CONF_PRODUCT_TYPE)
        in (PRODUCT_P1METERKIT, PRODUCT_WATERP1METERKIT)
        for entry in hass.config_entries.async_entries(DOMAIN)
    )


async def async_ensure_energy_preference(hass: HomeAssistant) -> bool:
    """Migrate the old implicit Energy module to an explicit preference.

    Existing Energy users keep their setup. Sensor-only installations become
    clean opt-in installations and no longer receive unrelated price and
    battery service devices under their first product entry.
    """
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        return False
    sources = store.get_energy_sources()
    if ENERGY_ENABLED in sources:
        return sources[ENERGY_ENABLED] is not False
    enabled = _legacy_installation_uses_energy(hass, store)
    sources[ENERGY_ENABLED] = enabled
    await store.async_set_energy_sources(sources)
    LOGGER.info(
        "Migrated Smart Energy to explicit %s state",
        "enabled" if enabled else "disabled",
    )
    return enabled


async def _async_initial_energy_refresh(prices: Any, battery_plan: Any) -> None:
    """Warm the enabled Energy coordinators without delaying setup."""
    try:
        await asyncio.wait_for(prices.async_refresh(), timeout=35)
    except TimeoutError:
        LOGGER.warning("Initial energy price refresh timed out after 35 seconds")
    except asyncio.CancelledError:
        raise
    except Exception as err:  # External account errors must not fail setup.
        LOGGER.warning("Initial energy price refresh failed: %s", err)

    try:
        await asyncio.wait_for(battery_plan.async_refresh(), timeout=10)
    except TimeoutError:
        LOGGER.warning("Initial battery plan refresh timed out after 10 seconds")
    except asyncio.CancelledError:
        raise
    except Exception as err:
        LOGGER.warning("Initial battery plan refresh failed: %s", err)


async def async_setup_energy_runtime(hass: HomeAssistant) -> None:
    """Start account-wide Energy services when the feature is enabled."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if not energy_runtime_enabled(hass) or domain_data.get("prices") is not None:
        return

    from .battery_control import async_register_battery_services
    from .battery_coordinator import BatteryPlanCoordinator
    from .price_coordinator import PriceCoordinator
    from .savings_tracker import async_setup_savings

    prices = PriceCoordinator(hass)
    battery_plan = BatteryPlanCoordinator(hass, prices)
    domain_data["prices"] = prices
    domain_data["battery_plan"] = battery_plan
    async_setup_savings(hass, prices)

    previous_unsubscribe = domain_data.pop("battery_price_unsubscribe", None)
    if previous_unsubscribe:
        previous_unsubscribe()
    domain_data["battery_price_unsubscribe"] = prices.async_add_listener(
        lambda: hass.async_create_task(battery_plan.async_request_refresh())
    )
    await async_register_battery_services(hass)
    domain_data["initial_energy_refresh_task"] = hass.async_create_task(
        _async_initial_energy_refresh(prices, battery_plan),
        f"{DOMAIN}_initial_energy_refresh",
    )


async def async_stop_energy_runtime(hass: HomeAssistant) -> None:
    """Stop Energy background work while retaining the user's configuration."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    for key in ("initial_energy_refresh_task", _ACCOUNT_REFRESH_TASK):
        task = domain_data.pop(key, None)
        if task is not None and not task.done():
            task.cancel()

    unsubscribe = domain_data.pop("battery_price_unsubscribe", None)
    if unsubscribe:
        unsubscribe()

    savings = domain_data.pop("savings", None)
    if savings is not None:
        savings.async_shutdown()
    prices = domain_data.pop("prices", None)
    if prices is not None:
        prices.async_shutdown()
    domain_data.pop("battery_plan", None)
    domain_data.pop("account_host", None)

    from .battery_control import SERVICE_APPLY_RECOMMENDATION

    if hass.services.has_service(DOMAIN, SERVICE_APPLY_RECOMMENDATION):
        hass.services.async_remove(DOMAIN, SERVICE_APPLY_RECOMMENDATION)


def remove_account_energy_registry_entries(hass: HomeAssistant) -> None:
    """Remove disabled Energy entities and their empty service devices."""
    entity_registry = er.async_get(hass)
    for entry in list(entity_registry.entities.values()):
        unique_id = str(entry.unique_id or "")
        if entry.platform == DOMAIN and unique_id.startswith(_ACCOUNT_ENTITY_PREFIXES):
            entity_registry.async_remove(entry.entity_id)

    device_registry = dr.async_get(hass)
    for identifier in _ACCOUNT_DEVICE_IDENTIFIERS:
        device = device_registry.async_get_device(identifiers={identifier})
        if device is not None:
            device_registry.async_remove_device(device.id)


async def _async_reconfigure_energy(hass: HomeAssistant, enabled: bool) -> None:
    """Apply a saved Energy preference and reload product platforms."""
    if enabled:
        await async_setup_energy_runtime(hass)
    else:
        await async_stop_energy_runtime(hass)

    entries = [
        entry
        for entry in hass.config_entries.async_entries(DOMAIN)
        if not entry.disabled_by and entry.state is ConfigEntryState.LOADED
    ]
    for entry in entries:
        try:
            await hass.config_entries.async_reload(entry.entry_id)
        except Exception:
            LOGGER.exception(
                "Could not reload %s after changing Smart Energy", entry.title
            )

    if not enabled:
        remove_account_energy_registry_entries(hass)


def async_schedule_energy_reconfigure(hass: HomeAssistant, enabled: bool) -> None:
    """Apply Energy state in the background so the panel call stays responsive."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    domain_data[_RECONFIGURE_TARGET] = enabled
    current = domain_data.get(_RECONFIGURE_TASK)
    if current is not None and not current.done():
        return

    async def _worker() -> None:
        try:
            while True:
                target = bool(domain_data[_RECONFIGURE_TARGET])
                await _async_reconfigure_energy(hass, target)
                if bool(domain_data[_RECONFIGURE_TARGET]) == target:
                    return
        finally:
            domain_data.pop(_RECONFIGURE_TASK, None)

    task = hass.async_create_task(_worker(), f"{DOMAIN}_energy_reconfigure")
    domain_data[_RECONFIGURE_TASK] = task
