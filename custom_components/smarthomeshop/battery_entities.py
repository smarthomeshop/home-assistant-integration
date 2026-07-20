"""Entities exposing the account-wide battery planning result."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.components.sensor import SensorEntity, SensorEntityDescription
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .battery_coordinator import BatteryPlanCoordinator
from .const import DOMAIN, MANUFACTURER, VERSION


def battery_device_info() -> DeviceInfo:
    """Return the service device shared by all battery planner entities."""
    return DeviceInfo(
        identifiers={(DOMAIN, "battery_planner")},
        name="SmartHomeShop Battery Planner",
        manufacturer=MANUFACTURER,
        model="Dynamic battery planner",
        entry_type=DeviceEntryType.SERVICE,
        sw_version=VERSION,
    )


@dataclass(frozen=True, kw_only=True)
class BatterySensorDescription(SensorEntityDescription):
    data_key: str


BATTERY_SENSORS: tuple[BatterySensorDescription, ...] = (
    BatterySensorDescription(
        key="battery_recommendation",
        name="Recommendation",
        icon="mdi:home-battery-outline",
        data_key="recommendation",
    ),
    BatterySensorDescription(
        key="battery_target_power",
        name="Target power",
        icon="mdi:battery-charging-outline",
        native_unit_of_measurement="W",
        data_key="target_power_w",
    ),
    BatterySensorDescription(
        key="battery_target_soc",
        name="Target state of charge",
        icon="mdi:battery-sync-outline",
        native_unit_of_measurement="%",
        data_key="target_soc",
    ),
    BatterySensorDescription(
        key="battery_expected_savings",
        name="Expected plan savings",
        icon="mdi:cash-check",
        native_unit_of_measurement="€",
        data_key="expected_savings",
    ),
    BatterySensorDescription(
        key="battery_plan_confidence",
        name="Planning confidence",
        icon="mdi:shield-check-outline",
        native_unit_of_measurement="%",
        data_key="confidence",
    ),
)


class SmartHomeShopBatterySensor(
    CoordinatorEntity[BatteryPlanCoordinator], SensorEntity
):
    """A single value from the latest battery plan."""

    entity_description: BatterySensorDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: BatteryPlanCoordinator,
        description: BatterySensorDescription,
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{DOMAIN}_{description.key}"
        self._attr_device_info = battery_device_info()

    @property
    def native_value(self) -> Any:
        value = (self.coordinator.data or {}).get(self.entity_description.data_key)
        if self.entity_description.data_key == "confidence" and value is not None:
            return round(float(value) * 100, 1)
        return value

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if self.entity_description.data_key != "recommendation":
            return None
        data = self.coordinator.data or {}
        return {
            "status": data.get("status"),
            "reason": data.get("reason"),
            "uses_predicted_prices": data.get("uses_predicted_prices", False),
            "forecast_hours": data.get("forecast_hours", 0),
            "timeline": data.get("timeline", []),
        }


class SmartHomeShopBatteryActionBinarySensor(
    CoordinatorEntity[BatteryPlanCoordinator], BinarySensorEntity
):
    """On when the planner recommends one specific battery action."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: BatteryPlanCoordinator, action: str) -> None:
        super().__init__(coordinator)
        self._action = action
        self._attr_name = f"{action.title()} recommended"
        self._attr_unique_id = f"{DOMAIN}_battery_{action}_recommended"
        self._attr_icon = (
            "mdi:battery-arrow-up-outline"
            if action == "charge"
            else "mdi:battery-arrow-down-outline"
        )
        self._attr_device_info = battery_device_info()

    @property
    def is_on(self) -> bool:
        return (self.coordinator.data or {}).get("recommendation") == self._action

    @property
    def available(self) -> bool:
        return (self.coordinator.data or {}).get("status") == "ready"
