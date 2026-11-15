"""Lifecycle for the optional account-wide Smart Energy module."""

from __future__ import annotations

import asyncio
from collections.abc import Iterable
from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import Event, HomeAssistant
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
_P1_PRODUCTS = (PRODUCT_P1METERKIT, PRODUCT_WATERP1METERKIT)
_RECONFIGURE_TASK = "energy_runtime_reconfigure_task"
_RECONFIGURE_TARGET = "energy_runtime_reconfigure_target"
_ACCOUNT_REFRESH_TASK = "account_price_refresh_task"
_ACCOUNT_ENTITY_PREFIXES = (
    f"{DOMAIN}_price_",
    f"{DOMAIN}_smart_savings_",
    f"{DOMAIN}_battery_",
    f"{DOMAIN}_schedule_",
    f"{DOMAIN}_ev_",
    f"{DOMAIN}_load_",
)
_ACCOUNT_DEVICE_IDENTIFIERS = (
    (DOMAIN, "energy_prices"),
    (DOMAIN, "battery_planner"),
    (DOMAIN, "smart_ev"),
    (DOMAIN, "smart_loads"),
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
    smart_loads = getattr(store, "get_smart_loads", dict)()
    if (
        store.get_battery().get("enabled")
        or store.get_schedules()
        or smart_loads.get("loads")
    ):
        return True
    return any(
        entry.data.get(CONF_PRODUCT_TYPE) in _P1_PRODUCTS
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


async def async_enable_energy_for_first_p1(
    hass: HomeAssistant, product_type: str
) -> None:
    """Turn Smart Energy on when the first P1 kit joins a sensor-only setup.

    This only runs while a product is being added, so a preference the user
    changed later stays untouched on every restart.
    """
    if product_type not in _P1_PRODUCTS:
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None or energy_runtime_enabled(hass):
        return
    if any(
        entry.data.get(CONF_PRODUCT_TYPE) in _P1_PRODUCTS
        for entry in hass.config_entries.async_entries(DOMAIN)
    ):
        return
    await store.async_set_energy_sources(
        {**store.get_energy_sources(), ENERGY_ENABLED: True}
    )
    LOGGER.info("Enabled Smart Energy for the first P1 kit")
    async_schedule_energy_reconfigure(hass, True)


async def _async_initial_energy_refresh(
    prices: Any,
    solar_forecast: Any,
    battery_plan: Any,
    smart_ev: Any,
    smart_loads: Any,
) -> None:
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
        await asyncio.wait_for(solar_forecast.async_refresh(), timeout=35)
    except TimeoutError:
        LOGGER.warning("Initial solar forecast refresh timed out after 35 seconds")
    except asyncio.CancelledError:
        raise
    except Exception as err:
        LOGGER.warning("Initial solar forecast refresh failed: %s", err)

    try:
        await asyncio.wait_for(battery_plan.async_refresh(), timeout=10)
    except TimeoutError:
        LOGGER.warning("Initial battery plan refresh timed out after 10 seconds")
    except asyncio.CancelledError:
        raise
    except Exception as err:
        LOGGER.warning("Initial battery plan refresh failed: %s", err)

    try:
        await asyncio.wait_for(smart_ev.async_refresh(), timeout=35)
    except TimeoutError:
        LOGGER.warning("Initial Smart EV refresh timed out after 35 seconds")
    except asyncio.CancelledError:
        raise
    except Exception as err:
        LOGGER.warning("Initial Smart EV refresh failed: %s", err)

    try:
        await asyncio.wait_for(smart_loads.async_refresh(), timeout=35)
    except TimeoutError:
        LOGGER.warning("Initial Smart Loads refresh timed out after 35 seconds")
    except asyncio.CancelledError:
        raise
    except Exception as err:
        LOGGER.warning("Initial Smart Loads refresh failed: %s", err)


async def async_setup_energy_runtime(hass: HomeAssistant) -> None:
    """Start account-wide Energy services when the feature is enabled."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if not energy_runtime_enabled(hass) or domain_data.get("prices") is not None:
        return

    from .battery_control import async_register_battery_services
    from .battery_coordinator import BatteryPlanCoordinator
    from .ev_coordinator import SmartEVCoordinator
    from .price_coordinator import PriceCoordinator
    from .savings_tracker import async_setup_savings
    from .smart_load_coordinator import SmartLoadCoordinator
    from .solar_forecast import SolarForecastCoordinator

    prices = PriceCoordinator(hass)
    solar_forecast = SolarForecastCoordinator(hass, prices)
    battery_plan = BatteryPlanCoordinator(hass, prices)
    smart_ev = SmartEVCoordinator(hass, prices)
    smart_loads = SmartLoadCoordinator(hass, prices)
    domain_data["prices"] = prices
    domain_data["solar_forecast"] = solar_forecast
    domain_data["battery_plan"] = battery_plan
    domain_data["smart_ev"] = smart_ev
    domain_data["smart_loads"] = smart_loads
    async_setup_savings(hass, prices)

    previous_unsubscribe = domain_data.pop("battery_price_unsubscribe", None)
    if previous_unsubscribe:
        previous_unsubscribe()
    domain_data["battery_price_unsubscribe"] = prices.async_add_listener(
        lambda: hass.async_create_task(battery_plan.async_request_refresh())
    )
    domain_data["ev_price_unsubscribe"] = prices.async_add_listener(
        lambda: hass.async_create_task(smart_ev.async_request_refresh())
    )
    domain_data["loads_price_unsubscribe"] = prices.async_add_listener(
        lambda: hass.async_create_task(smart_loads.async_request_refresh())
    )
    # Automatic EV control must keep evaluating even if a user disables every
    # optional plan/status entity in the registry. A coordinator only polls
    # while it has a listener, so retain one for the account-wide runtime.
    domain_data["smart_ev_runtime_unsubscribe"] = smart_ev.async_add_listener(
        lambda: None
    )
    domain_data["smart_loads_runtime_unsubscribe"] = smart_loads.async_add_listener(
        lambda: None
    )

    async def _async_stop_smart_ev(_event: Event) -> None:
        """Stop owned chargers while Home Assistant is still operational."""
        await smart_ev.async_shutdown()

    previous_stop_unsubscribe = domain_data.pop(
        "smart_ev_stop_unsubscribe", None
    )
    if previous_stop_unsubscribe:
        previous_stop_unsubscribe()
    domain_data["smart_ev_stop_unsubscribe"] = hass.bus.async_listen_once(
        EVENT_HOMEASSISTANT_STOP,
        _async_stop_smart_ev,
    )

    async def _async_stop_smart_loads(_event: Event) -> None:
        """Stop only owned Smart Loads while Home Assistant is operational."""
        await smart_loads.async_shutdown()

    previous_load_stop = domain_data.pop("smart_loads_stop_unsubscribe", None)
    if previous_load_stop:
        previous_load_stop()
    domain_data["smart_loads_stop_unsubscribe"] = hass.bus.async_listen_once(
        EVENT_HOMEASSISTANT_STOP,
        _async_stop_smart_loads,
    )
    # A coordinator only polls while something listens. The planner reads the
    # forecast without listening, and accounts without one have no sensors.
    domain_data["solar_forecast_unsubscribe"] = solar_forecast.async_add_listener(
        lambda: None
    )
    await async_register_battery_services(hass)
    domain_data["initial_energy_refresh_task"] = hass.async_create_task(
        _async_initial_energy_refresh(
            prices, solar_forecast, battery_plan, smart_ev, smart_loads
        ),
        f"{DOMAIN}_initial_energy_refresh",
    )


async def async_stop_energy_runtime(hass: HomeAssistant) -> None:
    """Stop Energy background work while retaining the user's configuration."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    for key in ("initial_energy_refresh_task", _ACCOUNT_REFRESH_TASK):
        task = domain_data.pop(key, None)
        if task is not None and not task.done():
            task.cancel()

    for key in (
        "battery_price_unsubscribe",
        "ev_price_unsubscribe",
        "loads_price_unsubscribe",
        "solar_forecast_unsubscribe",
        "smart_ev_runtime_unsubscribe",
        "smart_ev_stop_unsubscribe",
        "smart_loads_runtime_unsubscribe",
        "smart_loads_stop_unsubscribe",
    ):
        unsubscribe = domain_data.pop(key, None)
        if unsubscribe:
            unsubscribe()
    domain_data.pop("solar_forecast", None)

    savings = domain_data.pop("savings", None)
    if savings is not None:
        savings.async_shutdown()
    prices = domain_data.pop("prices", None)
    if prices is not None:
        prices.async_shutdown()
    domain_data.pop("battery_plan", None)
    smart_ev = domain_data.pop("smart_ev", None)
    if smart_ev is not None:
        await smart_ev.async_shutdown()
    smart_loads = domain_data.pop("smart_loads", None)
    if smart_loads is not None:
        await smart_loads.async_shutdown()
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
        for device in _account_devices(device_registry, identifier):
            device_registry.async_remove_device(device.id)


def remove_feature_registry_entries(
    hass: HomeAssistant,
    entity_domain: str,
    unique_ids: Iterable[str],
    device_identifier: tuple[str, str] | None = None,
) -> None:
    """Remove registry entries of Smart EV or Smart Loads entities not provided.

    With a device identifier, the service device is removed as well once no
    entity uses it anymore, so a feature that is turned off leaves nothing.
    """
    entity_registry = er.async_get(hass)
    for unique_id in unique_ids:
        entity_id = entity_registry.async_get_entity_id(entity_domain, DOMAIN, unique_id)
        if entity_id:
            entity_registry.async_remove(entity_id)
    if device_identifier is None:
        return
    device_registry = dr.async_get(hass)
    for device in _account_devices(device_registry, device_identifier):
        if not er.async_entries_for_device(
            entity_registry, device.id, include_disabled_entities=True
        ):
            device_registry.async_remove_device(device.id)


def _account_devices(
    device_registry: dr.DeviceRegistry, identifier: tuple[str, str]
) -> list[dr.DeviceEntry]:
    """Return every registered device with an account identifier.

    Home Assistant 2026.9 deprecated ``async_get_device`` because identifiers
    are only unique per config entry; ``async_get_devices`` (added in 2026.8)
    returns every match.  Older versions only have the single-device lookup.
    """
    get_devices = getattr(device_registry, "async_get_devices", None)
    if callable(get_devices):
        return list(get_devices(identifiers={identifier}))
    device = device_registry.async_get_device(identifiers={identifier})
    return [device] if device is not None else []


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
