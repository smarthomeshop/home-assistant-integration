"""Sensors for the measured smart-energy savings."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass

from .const import DOMAIN
from .price_binary_sensors import _prices_device_info
from .savings_tracker import SavingsTracker


class SmartHomeShopSavingsSensor(SensorEntity):
    """Accumulated smart-energy savings versus the day-average price."""

    _attr_has_entity_name = True
    _attr_icon = "mdi:piggy-bank-outline"
    _attr_native_unit_of_measurement = "EUR"
    _attr_state_class = SensorStateClass.TOTAL
    _attr_suggested_display_precision = 2
    _attr_should_poll = True

    def __init__(self, tracker: SavingsTracker, period: str, name: str) -> None:
        self._tracker = tracker
        self._period = period
        self._attr_name = name
        self._attr_unique_id = f"{DOMAIN}_smart_savings_{period}"
        self._attr_device_info = _prices_device_info()

    @property
    def native_value(self) -> float:
        return self._tracker.snapshot().get(f"{self._period}_eur", 0.0)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if self._period != "today":
            return None
        snapshot = self._tracker.snapshot()
        return {
            "battery_eur": snapshot.get("today_battery_eur"),
            "schedules_eur": snapshot.get("today_schedule_eur"),
            "compared_with": "day-average electricity price",
        }


def build_savings_sensors(tracker: SavingsTracker) -> list[SmartHomeShopSavingsSensor]:
    return [
        SmartHomeShopSavingsSensor(tracker, "today", "Smart savings today"),
        SmartHomeShopSavingsSensor(tracker, "month", "Smart savings this month"),
        SmartHomeShopSavingsSensor(tracker, "total", "Smart savings total"),
    ]
