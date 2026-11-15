"""Home Assistant entities for the account-wide Smart EV planner."""

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
from .ev_coordinator import SmartEVCoordinator


def smart_ev_entity_vehicles(config: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Return the vehicles that get entities; none while Smart EV is off."""
    if not config.get("enabled"):
        return {}
    return {
        str(item["id"]): item
        for item in config.get("vehicles", [])
        if isinstance(item, dict) and item.get("id")
    }


def _vehicle_name(vehicle: dict[str, Any]) -> str:
    return str(vehicle.get("name") or "Electric vehicle")


def _set_name_placeholder(entity: Any, name: str) -> None:
    """Show a renamed vehicle in the translated entity name."""
    placeholders = {"name": name}
    if getattr(entity, "_attr_translation_placeholders", None) == placeholders:
        return
    entity._attr_translation_placeholders = placeholders
    # Home Assistant caches the translated name; drop it so the new
    # placeholder is used on the next state write.
    entity.__dict__.pop("name", None)


def ev_device_info() -> DeviceInfo:
    """Return the shared service device for all configured vehicles."""
    return DeviceInfo(
        identifiers={(DOMAIN, "smart_ev")},
        name="SmartHomeShop Smart EV",
        manufacturer=MANUFACTURER,
        model="Solar and price aware EV planner",
        entry_type=DeviceEntryType.SERVICE,
        sw_version=VERSION,
    )


class SmartHomeShopEVPlanSensor(CoordinatorEntity[SmartEVCoordinator], SensorEntity):
    """Expose one vehicle's current plan and explanation."""

    _attr_has_entity_name = True
    _attr_translation_key = "ev_plan"
    _attr_icon = "mdi:car-electric"
    _unrecorded_attributes = frozenset({"segments", "guard", "execution", "learning"})

    def __init__(
        self, coordinator: SmartEVCoordinator, vehicle: dict[str, Any]
    ) -> None:
        super().__init__(coordinator)
        self.vehicle_id = str(vehicle["id"])
        self._attr_translation_placeholders = {"name": _vehicle_name(vehicle)}
        self._attr_unique_id = f"{DOMAIN}_ev_{self.vehicle_id}_plan"
        self._attr_device_info = ev_device_info()

    def update_vehicle(self, vehicle: dict[str, Any]) -> None:
        """Refresh display metadata after an in-place config update."""
        _set_name_placeholder(self, _vehicle_name(vehicle))
        if self.hass is not None:
            self.async_write_ha_state()

    def _plan(self) -> dict[str, Any]:
        return ((self.coordinator.data or {}).get("plans") or {}).get(
            self.vehicle_id, {}
        )

    @property
    def native_value(self) -> str | None:
        plan = self._plan()
        return str(plan.get("status")) if plan else None

    @property
    def available(self) -> bool:
        return super().available and bool(self._plan())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        plan = self._plan()
        return {
            "action": plan.get("action"),
            "reason": plan.get("reason"),
            "state_of_charge": plan.get("soc"),
            "target_state_of_charge": plan.get("target_soc"),
            "ready_by": plan.get("deadline"),
            "energy_needed_kwh": plan.get("energy_needed_kwh"),
            "expected_cost": plan.get("cost"),
            "expected_savings": plan.get("savings"),
            "solar_energy_kwh": plan.get("solar_kwh"),
            "segments": plan.get("segments", []),
            "guard": plan.get("guard", {}),
            "execution": plan.get("execution", {}),
            "learning": plan.get("learning", {}),
        }


class SmartHomeShopEVBinarySensor(
    CoordinatorEntity[SmartEVCoordinator], BinarySensorEntity
):
    """Expose whether one vehicle should charge or needs attention."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: SmartEVCoordinator,
        vehicle: dict[str, Any],
        kind: str,
    ) -> None:
        super().__init__(coordinator)
        self.vehicle_id = str(vehicle["id"])
        self.kind = kind
        self._attr_translation_key = (
            "ev_charging_planned" if kind == "charging" else "ev_problem"
        )
        self._attr_translation_placeholders = {"name": _vehicle_name(vehicle)}
        self._attr_unique_id = f"{DOMAIN}_ev_{self.vehicle_id}_{kind}"
        self._attr_icon = "mdi:ev-station" if kind == "charging" else "mdi:car-wrench"
        if kind == "problem":
            self._attr_device_class = BinarySensorDeviceClass.PROBLEM
        self._attr_device_info = ev_device_info()

    def update_vehicle(self, vehicle: dict[str, Any]) -> None:
        """Refresh display metadata after an in-place config update."""
        _set_name_placeholder(self, _vehicle_name(vehicle))
        if self.hass is not None:
            self.async_write_ha_state()

    def _plan(self) -> dict[str, Any]:
        return ((self.coordinator.data or {}).get("plans") or {}).get(
            self.vehicle_id, {}
        )

    @property
    def is_on(self) -> bool:
        plan = self._plan()
        if self.kind == "charging":
            return plan.get("action") == "charge"
        execution = plan.get("execution") or {}
        return plan.get("status") in {
            "unavailable",
            "insufficient_horizon",
        } or execution.get("status") in {
            "unavailable",
            "not_following",
            "not_charging",
            "confirmation_wait",
            "unsafe_control",
            "safety_lockout",
            "manual_override",
            "blocked_by_grid",
            "not_owned",
            "external_control",
        }

    @property
    def available(self) -> bool:
        return super().available and bool(self._plan())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        plan = self._plan()
        return {
            "status": plan.get("status"),
            "reason": (plan.get("execution") or {}).get("reason") or plan.get("reason"),
        }
