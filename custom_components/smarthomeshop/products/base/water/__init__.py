"""Shared water monitoring module for SmartHomeShop.io water products."""

from .coordinator import WaterCoordinator, WaterUsageData
from .sensors import WATER_SENSORS, WaterSensorEntityDescription
from .binary_sensors import WATER_BINARY_SENSORS, WaterBinarySensorEntityDescription

__all__ = [
    "WaterCoordinator",
    "WaterUsageData",
    "WATER_SENSORS",
    "WaterSensorEntityDescription",
    "WATER_BINARY_SENSORS",
    "WaterBinarySensorEntityDescription",
]







