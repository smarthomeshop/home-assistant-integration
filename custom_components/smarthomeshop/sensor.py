"""Sensor platform for SmartHomeShop.io."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import RestoreSensor, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    CONF_PRODUCT_TYPE,
    PRODUCT_P1METERKIT,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
    PRODUCT_CEILSENSE,
)
from .products.base.p1 import P1_SENSORS, P1SensorDescription

# Import shared water sensors from base module

from .products.base.water import (
    WATER_SENSORS,
    WaterCoordinator,
    WaterSensorEntityDescription,
)

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

    # Shared P1 energy sensors (P1MeterKit and WaterP1MeterKit)
    if product_type in (PRODUCT_P1METERKIT, PRODUCT_WATERP1METERKIT):
        entities.extend(
            SmartHomeShopP1Sensor(coordinator, description, config_entry)
            for description in P1_SENSORS
        )

    # UltimateSensor / CeilSense room quality sensors
    if product_type in (
        PRODUCT_ULTIMATESENSOR,
        PRODUCT_ULTIMATESENSOR_MINI,
        PRODUCT_CEILSENSE,
    ):
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


class SmartHomeShopP1Sensor(CoordinatorEntity, RestoreSensor):
    """Shared P1 energy sensor (standby power, month peak, costs)."""

    entity_description: P1SensorDescription
    _attr_has_entity_name = True

    def __init__(self, coordinator, description: P1SensorDescription, config_entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._config_entry = config_entry
        self._attr_unique_id = f"{config_entry.entry_id}_{description.key}"
        if coordinator.device_info:
            self._attr_device_info = coordinator.device_info

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        if not self.entity_description.restore:
            return
        last = await self.async_get_last_sensor_data()
        last_state = await self.async_get_last_state()
        if last is None or last.native_value is None or last_state is None:
            return
        try:
            value = float(last.native_value)
        except (ValueError, TypeError):
            return
        tracker = getattr(self.coordinator, "energy_tracker", None)
        if tracker is None:
            return
        if self.entity_description.key == "month_peak":
            tracker.restore_month_peak(value, last_state.attributes.get("month", ""))
        elif self.entity_description.key == "standby_power":
            tracker.restore_standby(value, last_state.attributes.get("measured_night", ""))

    @property
    def _p1_data(self):
        tracker = getattr(self.coordinator, "energy_tracker", None)
        return tracker.data if tracker else None

    @property
    def native_value(self):
        data = self._p1_data
        if data is None:
            return None
        return self.entity_description.value_fn(data)

    @property
    def extra_state_attributes(self):
        data = self._p1_data
        if data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(data)
