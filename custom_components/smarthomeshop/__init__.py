"""The SmartHomeShop.io integration for smart home devices."""

from __future__ import annotations

from homeassistant.const import Platform
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.config import ConfigType
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import (
    DOMAIN,
    LOGGER,
    VERSION,
    CONF_PRODUCT_TYPE,
    PRODUCT_WATERP1METERKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
)
from .load_plugins import load_plugins
from .websocket_api import async_register_websocket_api

# Import product-specific coordinators
from .products.waterp1meterkit import WaterP1MeterKitCoordinator
from .products.watermeterkit import WaterMeterKitCoordinator
from .products.waterflowkit import WaterFlowKitCoordinator
from .products.ultimatesensor import UltimateSensorCoordinator

# NUMBER must be before SENSOR so meter_number is available for meter reading sensor
PLATFORMS = [Platform.NUMBER, Platform.SENSOR, Platform.BINARY_SENSOR]

# Panel constants
PANEL_URL = "/smarthomeshop_panel"
PANEL_TITLE = "SmartHomeShop.io"
PANEL_ICON = "mdi:store"
PANEL_NAME = "smarthomeshop-panel"

type SmartHomeShopConfigEntry = ConfigEntry


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

    return True


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the SmartHomeShop Configurator panel."""
    # Only register if not already registered
    if DOMAIN in hass.data.get("frontend_panels", {}):
        return

    # Register static path for panel files
    panel_path = hass.config.path("custom_components/smarthomeshop/panel/dist")

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                PANEL_URL,
                path=panel_path,
                cache_headers=False,
            )
        ]
    )

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

    elif product_type in (PRODUCT_ULTIMATESENSOR, PRODUCT_ULTIMATESENSOR_MINI):
        coordinator = UltimateSensorCoordinator(hass, entry)

    else:
        LOGGER.warning(
            "Unknown product type %s, using WaterMeterKit coordinator", product_type
        )
        coordinator = WaterMeterKitCoordinator(hass, entry)

    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    LOGGER.info("SmartHomeShop.io integration setup complete for %s", entry.title)
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: SmartHomeShopConfigEntry
) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
