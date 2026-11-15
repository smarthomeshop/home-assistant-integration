"""Home Assistant entities for the account-wide Smart Loads planner."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, MANUFACTURER, VERSION
from .smart_load_coordinator import SmartLoadCoordinator


def smart_load_entity_loads(config: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Return the loads that get entities; none while Smart Loads is off."""
    if not config.get("enabled"):
        return {}
    return {
        str(item["id"]): item
        for item in config.get("loads", [])
        if isinstance(item, dict) and item.get("id")
    }


def _load_name(load: dict[str, Any]) -> str:
    return str(load.get("name") or "Smart load")


def _set_name_placeholder(entity: Any, name: str) -> None:
    """Show a renamed load in the translated entity name."""
    placeholders = {"name": name}
    if getattr(entity, "_attr_translation_placeholders", None) == placeholders:
        return
    entity._attr_translation_placeholders = placeholders
    # Home Assistant caches the translated name; drop it so the new
    # placeholder is used on the next state write.
    entity.__dict__.pop("name", None)


def smart_loads_device_info() -> DeviceInfo:
    """Return the shared service device for all configured smart loads."""
    return DeviceInfo(
        identifiers={(DOMAIN, "smart_loads")},
        name="SmartHomeShop Smart Loads",
        manufacturer=MANUFACTURER,
        model="Price, solar and capacity-aware load planner",
        entry_type=DeviceEntryType.SERVICE,
        sw_version=VERSION,
    )


class SmartHomeShopLoadPlanSensor(
    CoordinatorEntity[SmartLoadCoordinator], SensorEntity
):
    """Expose one load's current plan and explanation."""

    _attr_has_entity_name = True
    _attr_translation_key = "smart_load_plan"
    _attr_icon = "mdi:calendar-lightning-bolt"
    _unrecorded_attributes = frozenset({"segments", "guard", "execution", "learning"})

    def __init__(self, coordinator: SmartLoadCoordinator, load: dict[str, Any]) -> None:
        super().__init__(coordinator)
        self.load_id = str(load["id"])
        self._attr_translation_placeholders = {"name": _load_name(load)}
        self._attr_unique_id = f"{DOMAIN}_load_{self.load_id}_plan"
        self._attr_device_info = smart_loads_device_info()

    def update_load(self, load: dict[str, Any]) -> None:
        """Refresh display metadata after an in-place config update."""
        _set_name_placeholder(self, _load_name(load))
        if self.hass is not None:
            self.async_write_ha_state()

    def _plan(self) -> dict[str, Any]:
        return ((self.coordinator.data or {}).get("plans") or {}).get(self.load_id, {})

    @property
    def native_value(self) -> str | None:
        plan = self._plan()
        execution = plan.get("execution") or {}
        return str(execution.get("status") or plan.get("status")) if plan else None

    @property
    def available(self) -> bool:
        return super().available and bool(self._plan())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        plan = self._plan()
        return {
            "reason": plan.get("reason"),
            "ready_by": plan.get("deadline"),
            "next_start": plan.get("next_start"),
            "duration_minutes": plan.get("duration_min"),
            "expected_power_w": plan.get("power_w"),
            "expected_cost": plan.get("cost"),
            "expected_savings": plan.get("savings"),
            "expected_solar_energy_kwh": plan.get("solar_kwh"),
            "segments": plan.get("segments", []),
            "guard": plan.get("guard", {}),
            "execution": plan.get("execution", {}),
            "learning": ((self.coordinator.data or {}).get("learning") or {}).get(
                self.load_id, {}
            ),
        }


class SmartHomeShopLoadBinarySensor(
    CoordinatorEntity[SmartLoadCoordinator], BinarySensorEntity
):
    """Expose whether one load is running/planned or needs attention."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: SmartLoadCoordinator,
        load: dict[str, Any],
        kind: str,
    ) -> None:
        super().__init__(coordinator)
        self.load_id = str(load["id"])
        self.kind = kind
        self._attr_translation_key = (
            "smart_load_active" if kind == "active" else "smart_load_problem"
        )
        self._attr_translation_placeholders = {"name": _load_name(load)}
        self._attr_unique_id = f"{DOMAIN}_load_{self.load_id}_{kind}"
        self._attr_icon = (
            "mdi:power-plug" if kind == "active" else "mdi:alert-circle-outline"
        )
        if kind == "problem":
            self._attr_device_class = BinarySensorDeviceClass.PROBLEM
        self._attr_device_info = smart_loads_device_info()

    def update_load(self, load: dict[str, Any]) -> None:
        """Refresh display metadata after an in-place config update."""
        _set_name_placeholder(self, _load_name(load))
        if self.hass is not None:
            self.async_write_ha_state()

    def _plan(self) -> dict[str, Any]:
        return ((self.coordinator.data or {}).get("plans") or {}).get(self.load_id, {})

    @property
    def is_on(self) -> bool:
        plan = self._plan()
        execution = plan.get("execution") or {}
        if self.kind == "active":
            return bool(
                (plan.get("state") or {}).get("running")
                or execution.get("status") == "running"
            )
        return execution.get("status") in {
            "blocked_by_grid",
            "configuration_changed",
            "manual_override",
            "not_following",
            "planning_failed",
            "start_failed",
            "stop_failed",
            "unsafe_control",
            "unavailable",
        } or plan.get("status") in {
            "capacity_blocked",
            "insufficient_horizon",
            "no_horizon",
        }

    @property
    def available(self) -> bool:
        return super().available and bool(self._plan())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        plan = self._plan()
        execution = plan.get("execution") or {}
        return {
            "status": execution.get("status") or plan.get("status"),
            "reason": execution.get("reason") or plan.get("reason"),
        }
