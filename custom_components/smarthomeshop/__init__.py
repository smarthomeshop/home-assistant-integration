"""The SmartHomeShop.io integration for smart home devices."""

from __future__ import annotations

import asyncio

from homeassistant.const import Platform
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.config import ConfigType
from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import (
    DOMAIN,
    LOGGER,
    VERSION,
    CONF_PRODUCT_TYPE,
    PRODUCT_WATERP1METERKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_P1METERKIT,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
    PRODUCT_CEILSENSE,
)
from .load_plugins import load_plugins
from .websocket_api import async_register_websocket_api

# Import product-specific coordinators
from .products.waterp1meterkit import WaterP1MeterKitCoordinator
from .products.watermeterkit import WaterMeterKitCoordinator
from .products.waterflowkit import WaterFlowKitCoordinator
from .products.ultimatesensor import UltimateSensorCoordinator

PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR]

# Panel constants
PANEL_URL = "/smarthomeshop_panel"
PANEL_TITLE = "SmartHomeShop.io"
PANEL_ICON = "mdi:store"
PANEL_NAME = "smarthomeshop-panel"
_PANEL_STATIC_PATH_REGISTERED = "panel_static_path_registered"

type SmartHomeShopConfigEntry = ConfigEntry

_INITIAL_PRICE_REFRESH_TIMEOUT = 35
_INITIAL_BATTERY_REFRESH_TIMEOUT = 10


async def _async_initial_energy_refresh(prices, battery_plan) -> None:
    """Warm the energy coordinators without delaying integration setup."""
    try:
        await asyncio.wait_for(
            prices.async_refresh(), timeout=_INITIAL_PRICE_REFRESH_TIMEOUT
        )
    except TimeoutError:
        LOGGER.warning(
            "Initial energy price refresh timed out after %s seconds; "
            "the integration will retry in the background",
            _INITIAL_PRICE_REFRESH_TIMEOUT,
        )
    except Exception as err:
        LOGGER.warning("Initial energy price refresh failed: %s", err)

    try:
        await asyncio.wait_for(
            battery_plan.async_refresh(), timeout=_INITIAL_BATTERY_REFRESH_TIMEOUT
        )
    except TimeoutError:
        LOGGER.warning(
            "Initial battery plan refresh timed out after %s seconds",
            _INITIAL_BATTERY_REFRESH_TIMEOUT,
        )
    except Exception as err:
        LOGGER.warning("Initial battery plan refresh failed: %s", err)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up SmartHomeShop.io integration."""
    LOGGER.info("Setting up SmartHomeShop.io integration (version %s)", VERSION)

    # Initialize domain data
    hass.data.setdefault(DOMAIN, {})

    # Load frontend JavaScript plugins (cards)
    try:
        await load_plugins(hass, DOMAIN)
        LOGGER.info("SmartHomeShop.io frontend cards loaded successfully")
    except Exception as err:
        LOGGER.error("Failed to load SmartHomeShop.io frontend cards: %s", err)

    # Register WebSocket API
    try:
        await async_register_websocket_api(hass)
        LOGGER.info("SmartHomeShop.io WebSocket API registered")
    except Exception as err:
        LOGGER.error("Failed to register WebSocket API: %s", err)

    # Register Side Panel
    try:
        await async_register_panel(hass)
        LOGGER.info("SmartHomeShop.io Configurator Panel registered")
    except Exception as err:
        LOGGER.error("Failed to register panel: %s", err)

    # Account-wide dynamic energy price coordinator
    try:
        from .price_coordinator import PriceCoordinator

        prices = PriceCoordinator(hass)
        hass.data[DOMAIN]["prices"] = prices

        from .savings_tracker import async_setup_savings

        async_setup_savings(hass, prices)

        from .battery_control import async_register_battery_services
        from .battery_coordinator import BatteryPlanCoordinator

        battery_plan = BatteryPlanCoordinator(hass, prices)
        hass.data[DOMAIN]["battery_plan"] = battery_plan
        previous_unsubscribe = hass.data[DOMAIN].pop(
            "battery_price_unsubscribe", None
        )
        if previous_unsubscribe:
            previous_unsubscribe()
        hass.data[DOMAIN]["battery_price_unsubscribe"] = prices.async_add_listener(
            lambda: hass.async_create_task(battery_plan.async_request_refresh())
        )
        await async_register_battery_services(hass)
        hass.data[DOMAIN]["initial_energy_refresh_task"] = hass.async_create_task(
            _async_initial_energy_refresh(prices, battery_plan),
            f"{DOMAIN}_initial_energy_refresh",
        )
    except Exception as err:
        LOGGER.error("Failed to set up energy coordinators: %s", err)

    return True


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the SmartHomeShop Configurator panel."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    # Static routes live for the lifetime of Home Assistant and cannot be
    # registered twice. The panel definition itself is replaced below so an
    # integration reload also updates the versioned frontend module URL.
    if not domain_data.get(_PANEL_STATIC_PATH_REGISTERED):
        panel_path = hass.config.path("custom_components/smarthomeshop/www")
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    PANEL_URL,
                    path=panel_path,
                    cache_headers=False,
                )
            ]
        )
        domain_data[_PANEL_STATIC_PATH_REGISTERED] = True

    if frontend.async_panel_exists(hass, DOMAIN):
        frontend.async_remove_panel(hass, DOMAIN)

    # Register the panel
    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=DOMAIN,
        webcomponent_name=PANEL_NAME,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=f"{PANEL_URL}/smarthomeshop-panel.js?v={VERSION}",
        embed_iframe=False,
        require_admin=False,
        config={"version": VERSION},
    )


async def async_setup_entry(
    hass: HomeAssistant, entry: SmartHomeShopConfigEntry
) -> bool:
    """Set up SmartHomeShop from a config entry."""
    product_type = entry.data.get(CONF_PRODUCT_TYPE)

    LOGGER.info("Setting up SmartHomeShop device: %s (%s)", entry.title, product_type)

    # Create the appropriate coordinator based on product type
    if product_type == PRODUCT_WATERP1METERKIT:
        from .products.waterp1meterkit.entity_resolver import (
            migrate_water_total_source,
        )

        # Older config entries stored the raw pulse counter. Prefer the
        # firmware's reboot-safe absolute meter reading whenever available.
        migrate_water_total_source(hass, entry)
        coordinator = WaterP1MeterKitCoordinator(hass, entry)

        # Create utility meter helpers for energy + water tracking
        # These are persistent and work with the Energy Dashboard
        from .products.waterp1meterkit.utility_meters import async_setup_utility_meters

        hass.async_create_task(async_setup_utility_meters(hass, entry))

    elif product_type == PRODUCT_WATERMETERKIT:
        coordinator = WaterMeterKitCoordinator(hass, entry)

        # Create utility meter helpers for water tracking
        from .products.watermeterkit.utility_meters import (
            async_setup_utility_meters as setup_water_meters,
        )

        hass.async_create_task(setup_water_meters(hass, entry, "watermeterkit"))

    elif product_type == PRODUCT_WATERFLOWKIT:
        coordinator = WaterFlowKitCoordinator(hass, entry)

        # Create utility meter helpers for both Flow1 and Flow2
        from .products.waterflowkit.utility_meters import (
            async_setup_utility_meters as setup_flowkit_meters,
        )

        hass.async_create_task(setup_flowkit_meters(hass, entry))

    elif product_type == PRODUCT_P1METERKIT:
        from .products.p1meterkit import P1MeterKitCoordinator
        from .products.base.p1.utility_meters import async_setup_energy_utility_meters

        coordinator = P1MeterKitCoordinator(hass, entry)
        hass.async_create_task(
            async_setup_energy_utility_meters(
                hass,
                label=f"P1 {coordinator.short_device_id}",
                uid_prefix=f"p1_{coordinator.short_device_id}",
                entity_base=coordinator.entity_prefix,
            )
        )

    elif product_type in (
        PRODUCT_ULTIMATESENSOR,
        PRODUCT_ULTIMATESENSOR_MINI,
        PRODUCT_CEILSENSE,
    ):
        # CeilSense shares the sensor coordinator: room quality degrades
        # gracefully to whatever climate sensors the device exposes.
        coordinator = UltimateSensorCoordinator(hass, entry)

    else:
        LOGGER.warning(
            "Unknown product type %s, using WaterMeterKit coordinator", product_type
        )
        coordinator = WaterMeterKitCoordinator(hass, entry)

    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Apply option changes (prices, leak settings, fuse, …) without a restart.
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    LOGGER.info("SmartHomeShop.io integration setup complete for %s", entry.title)
    return True


async def _async_update_listener(
    hass: HomeAssistant, entry: SmartHomeShopConfigEntry
) -> None:
    """Reload the entry when its options change so new settings take effect."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(
    hass: HomeAssistant, entry: SmartHomeShopConfigEntry
) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
