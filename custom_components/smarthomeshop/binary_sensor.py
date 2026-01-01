"""Binary sensor platform for SmartHomeShop.io."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    CONF_PRODUCT_TYPE,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
)

# Import shared water binary sensors from base module
from .products.base.water import (
    WATER_BINARY_SENSORS,
    WaterBinarySensorEntityDescription,
    WaterCoordinator,
)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up SmartHomeShop binary sensors."""
    coordinator = config_entry.runtime_data
    product_type = config_entry.data.get(CONF_PRODUCT_TYPE)

    entities: list[SmartHomeShopWaterBinarySensor] = []

    # Water product binary sensors (shared between WaterP1MeterKit, WaterMeterKit)
    # WaterFlowKit uses ESPHome sensors directly + utility meters
    if product_type in (
        PRODUCT_WATERP1METERKIT,
        PRODUCT_WATERMETERKIT,
    ):
        entities.extend(
            SmartHomeShopWaterBinarySensor(coordinator, description, config_entry)
            for description in WATER_BINARY_SENSORS
        )

    async_add_entities(entities)


class SmartHomeShopWaterBinarySensor(
    CoordinatorEntity[WaterCoordinator], BinarySensorEntity
):
    """SmartHomeShop water binary sensor entity."""

    entity_description: WaterBinarySensorEntityDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: WaterCoordinator,
        description: WaterBinarySensorEntityDescription,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._config_entry = config_entry

        # Create unique ID
        self._attr_unique_id = f"{config_entry.entry_id}_{description.key}"

        # Link to existing ESPHome device
        if coordinator.device_info:
            self._attr_device_info = coordinator.device_info

    @property
    def is_on(self) -> bool:
        """Return true if the binary sensor is on."""
        if self.coordinator.data is None:
            return False
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra state attributes."""
        if self.coordinator.data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(self.coordinator.data)
