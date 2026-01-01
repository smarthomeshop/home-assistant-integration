"""Sensor platform for SmartHomeShop.io."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    CONF_PRODUCT_TYPE,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
)

# Import shared water sensors from base module
from .const import CONF_WATER_SENSOR, DOMAIN

from .products.base.water import (
    WATER_SENSORS,
    WaterCoordinator,
    WaterSensorEntityDescription,
)
from .products.base.water.meter_reading import WaterMeterReadingSensor

# Import UltimateSensor room quality sensors
from .products.ultimatesensor import (
    ROOM_QUALITY_SENSORS,
    RoomQualitySensorDescription,
    UltimateSensorCoordinator,
)
from .products.ultimatesensor.coordinator import RoomQualityData


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up SmartHomeShop sensors."""
    coordinator = config_entry.runtime_data
    product_type = config_entry.data.get(CONF_PRODUCT_TYPE)

    entities: list[SensorEntity] = []

    # Water product sensors (shared between WaterP1MeterKit, WaterMeterKit)
    # WaterFlowKit uses ESPHome sensors directly + utility meters
    if product_type in (
        PRODUCT_WATERP1METERKIT,
        PRODUCT_WATERMETERKIT,
    ):
        entities.extend(
            SmartHomeShopWaterSensor(coordinator, description, config_entry)
            for description in WATER_SENSORS
        )

        # Add meter reading sensor if we have the number entity
        meter_number = hass.data.get(DOMAIN, {}).get(f"{config_entry.entry_id}_meter_number")
        if meter_number:
            water_sensor = config_entry.data.get(CONF_WATER_SENSOR, "")
            if water_sensor:
                entities.append(
                    WaterMeterReadingSensor(
                        coordinator=coordinator,
                        config_entry=config_entry,
                        pulse_sensor_entity_id=water_sensor,
                        calibration_number=meter_number,
                    )
                )

    # UltimateSensor room quality sensors
    if product_type in (PRODUCT_ULTIMATESENSOR, PRODUCT_ULTIMATESENSOR_MINI):
        entities.extend(
            SmartHomeShopRoomQualitySensor(coordinator, description, config_entry)
            for description in ROOM_QUALITY_SENSORS
        )

    # Note: Energy period tracking (daily, weekly, monthly, yearly) is now handled
    # by automatically created Utility Meter helpers. See:
    # products/waterp1meterkit/utility_meters.py

    async_add_entities(entities)


class SmartHomeShopWaterSensor(CoordinatorEntity[WaterCoordinator], SensorEntity):
    """SmartHomeShop water sensor entity."""

    entity_description: WaterSensorEntityDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: WaterCoordinator,
        description: WaterSensorEntityDescription,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._config_entry = config_entry

        # Create unique ID
        self._attr_unique_id = f"{config_entry.entry_id}_{description.key}"

        # Link to existing ESPHome device
        if coordinator.device_info:
            self._attr_device_info = coordinator.device_info

    @property
    def native_value(self) -> Any:
        """Return the sensor value."""
        if self.coordinator.data is None:
            return None
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra state attributes."""
        if self.coordinator.data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(self.coordinator.data)


class SmartHomeShopRoomQualitySensor(
    CoordinatorEntity[UltimateSensorCoordinator], SensorEntity
):
    """SmartHomeShop room quality sensor entity."""

    entity_description: RoomQualitySensorDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: UltimateSensorCoordinator,
        description: RoomQualitySensorDescription,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._config_entry = config_entry

        # Create unique ID
        self._attr_unique_id = f"{config_entry.entry_id}_{description.key}"

        # Link to existing ESPHome device
        if coordinator.device_info:
            self._attr_device_info = coordinator.device_info

    @property
    def native_value(self) -> Any:
        """Return the sensor value."""
        if self.coordinator.data is None:
            return None
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra state attributes."""
        if self.coordinator.data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(self.coordinator.data)
