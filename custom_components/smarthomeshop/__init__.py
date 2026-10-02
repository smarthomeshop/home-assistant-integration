"""The SmartHomeShop.io integration for smart home devices."""

from __future__ import annotations

from pathlib import Path

from homeassistant.const import Platform
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.config import ConfigType
from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
import homeassistant.helpers.config_validation as cv
from homeassistant.helpers import issue_registry as ir

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
from .device_linking import (
    prepare_config_entry_source_device,
    source_device_storage_key,
)
from .energy_runtime import (
    async_ensure_energy_preference,
    async_setup_energy_runtime,
    remove_account_energy_registry_entries,
)

# Import product-specific coordinators
from .products.waterp1meterkit import WaterP1MeterKitCoordinator
from .products.watermeterkit import WaterMeterKitCoordinator
from .products.waterflowkit import WaterFlowKitCoordinator
from .products.ultimatesensor import UltimateSensorCoordinator

PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR]
CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)

# Panel constants
PANEL_URL = "/smarthomeshop_panel"
PANEL_TITLE = "SmartHomeShop.io"
PANEL_ICON = "shs:logo"
PANEL_NAME = "smarthomeshop-panel"
_PANEL_STATIC_PATH_REGISTERED = "panel_static_path_registered"

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

    # Smart Energy is a real opt-in module. Existing installations with an
    # account, P1 product or source mappings are migrated as enabled; a fresh
    # sensor-only setup stays clean and receives no unrelated service devices.
    try:
        energy_enabled = await async_ensure_energy_preference(hass)
        if energy_enabled:
            await async_setup_energy_runtime(hass)
        else:
            remove_account_energy_registry_entries(hass)
    except Exception as err:
        LOGGER.error("Failed to apply the Smart Energy preference: %s", err)

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
    panel_file = Path(panel_path) / "smarthomeshop-panel.js"
    build_token = panel_file.stat().st_mtime_ns if panel_file.exists() else 0
    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=DOMAIN,
        webcomponent_name=PANEL_NAME,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=(
            f"{PANEL_URL}/smarthomeshop-panel.js"
            f"?v={VERSION}&build={build_token}"
        ),
        embed_iframe=False,
        require_admin=False,
        config={"version": VERSION},
    )


async def async_setup_entry(
    hass: HomeAssistant, entry: SmartHomeShopConfigEntry
) -> bool:
    """Set up SmartHomeShop from a config entry."""
    # HA 2026.8 split formerly shared devices into one registry device per
    # integration.  Always canonicalise to the physical ESPHome split and
    # remove our obsolete duplicate before entities are created.
    source_device = prepare_config_entry_source_device(hass, entry)
    store = hass.data.get(DOMAIN, {}).get("store")
    if source_device is not None and store is not None:
        await store.async_unhide_device(
            source_device_storage_key(hass, source_device)
        )

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
        from .products.waterp1meterkit.entity_resolver import (
            migrate_water_total_source,
        )

        # WaterMeterKit firmware grew the same reboot-safe "Water Meter Total"
        # as the WaterP1; entries made on older firmware still point at the
        # pulse counter that starts over at zero after every reboot.
        migrate_water_total_source(hass, entry)
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

    # Apply option changes (prices, leak settings, fuse, ...) without a restart.
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    if product_type in (PRODUCT_P1METERKIT, PRODUCT_WATERP1METERKIT):
        prices = hass.data.get(DOMAIN, {}).get("prices")
        if prices is not None:
            prices.async_refresh_tariff_source()

    LOGGER.info("SmartHomeShop.io integration setup complete for %s", entry.title)
    return True


async def async_migrate_entry(
    hass: HomeAssistant, entry: SmartHomeShopConfigEntry
) -> bool:
    """Migrate product entries to canonical ESPHome source-device links."""
    if entry.version > 2:
        LOGGER.error(
            "Cannot migrate %s from unsupported future version %s",
            entry.title,
            entry.version,
        )
        return False

    prepare_config_entry_source_device(hass, entry)
    if entry.version < 2 or entry.minor_version < 1:
        hass.config_entries.async_update_entry(
            entry, version=2, minor_version=1
        )
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


async def async_remove_entry(
    hass: HomeAssistant, entry: SmartHomeShopConfigEntry
) -> None:
    """Clean up what outlives the config entry."""
    # A leak repair issue has no owner once the device is gone, so it would
    # keep warning about a device that is no longer there.
    ir.async_delete_issue(hass, DOMAIN, f"leak_{entry.entry_id}")
