"""Number platform for SmartHomeShop integration."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    CONF_WATER_SENSOR,
    DOMAIN,
    LOGGER,
    PRODUCT_WATERP1METERKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERFLOWKIT,
)
from .products.base.water.meter_reading import WaterMeterReadingNumber


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up SmartHomeShop number entities."""
    product_type = config_entry.data.get("product_type", "unknown")
    coordinator = config_entry.runtime_data

    entities = []

    # Water products get meter reading number
    if product_type in (
        PRODUCT_WATERP1METERKIT,
        PRODUCT_WATERMETERKIT,
        PRODUCT_WATERFLOWKIT,
    ):
        # Get the pulse sensor entity ID (water total consumption)
        water_sensor = config_entry.data.get(CONF_WATER_SENSOR, "")
        
        if water_sensor:
            LOGGER.info("Setting up meter reading number for %s", product_type)
            
            meter_number = WaterMeterReadingNumber(
                coordinator=coordinator,
                config_entry=config_entry,
                pulse_sensor_entity_id=water_sensor,
            )
            entities.append(meter_number)
            
            # Store reference for sensor to use
            if DOMAIN not in hass.data:
                hass.data[DOMAIN] = {}
            hass.data[DOMAIN][f"{config_entry.entry_id}_meter_number"] = meter_number

    async_add_entities(entities)

