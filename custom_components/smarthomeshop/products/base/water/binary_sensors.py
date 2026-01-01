"""Shared water binary sensor definitions for SmartHomeShop water products.

These sensors are used by: WaterP1MeterKit, WaterMeterKit, WaterFlowKit
Includes: Advanced smart leak detection with scoring system
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntityDescription,
)

from .coordinator import WaterUsageData


@dataclass(frozen=True, kw_only=True)
class WaterBinarySensorEntityDescription(BinarySensorEntityDescription):
    """Describes a water binary sensor entity."""

    value_fn: Callable[[WaterUsageData], bool]
    attr_fn: Callable[[WaterUsageData], dict[str, Any]] | None = None


WATER_BINARY_SENSORS: tuple[WaterBinarySensorEntityDescription, ...] = (
    # Smart Leak Detection (NEW - main sensor)
    WaterBinarySensorEntityDescription(
        key="smart_leak_detected",
        name="Smart lek detectie (CC)",
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda data: data.leak_score.is_leak_likely if data.leak_score else False,
        attr_fn=lambda data: {
            **(data.leak_score.to_dict() if data.leak_score else {}),
            "baseline_status": data.baseline_status or {},
        },
    ),
    # Legacy sensors (still useful for specific alerts)
    WaterBinarySensorEntityDescription(
        key="continuous_flow_leak",
        name="Continue flow lek (CC)",
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda data: data.continuous_flow_detected,
        attr_fn=lambda data: {
            "duration_minutes": data.continuous_flow_duration,
            "current_flow_rate": f"{data.current_flow_rate:.2f} L/min",
        },
    ),
    WaterBinarySensorEntityDescription(
        key="night_usage_detected",
        name="Nachtelijk verbruik (CC)",
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda data: data.night_usage_detected,
        attr_fn=lambda data: {
            "night_usage_liters": data.night_usage_amount,
        },
    ),
    WaterBinarySensorEntityDescription(
        key="micro_leak_detected",
        name="Micro lek (CC)",
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda data: data.micro_leak_detected,
        attr_fn=lambda data: {
            "flow_rate": f"{data.current_flow_rate:.3f} L/min",
            "description": "Small constant flow detected (possible dripping tap)",
        },
    ),
    WaterBinarySensorEntityDescription(
        key="vacation_mode_leak",
        name="Vakantie lek (CC)",
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda data: data.vacation_mode_leak,
        attr_fn=lambda data: {
            "flow_rate": f"{data.current_flow_rate:.2f} L/min",
            "warning": "Water usage detected while vacation mode is active!",
        },
    ),
    WaterBinarySensorEntityDescription(
        key="water_flowing",
        name="Water stroomt (CC)",
        device_class=BinarySensorDeviceClass.RUNNING,
        value_fn=lambda data: data.current_flow_rate > 0.1,
        attr_fn=lambda data: {
            "flow_rate": f"{data.current_flow_rate:.2f} L/min",
            "detected_device": data.detected_device or "unknown",
        },
    ),
    WaterBinarySensorEntityDescription(
        key="any_leak_alert",
        name="Lek alarm (CC)",
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda data: (
            (data.leak_score.is_leak_likely if data.leak_score else False)
            or data.continuous_flow_detected
            or data.night_usage_detected
            or data.micro_leak_detected
            or data.vacation_mode_leak
        ),
        attr_fn=lambda data: {
            "smart_leak": data.leak_score.is_leak_likely if data.leak_score else False,
            "smart_leak_score": data.leak_score.total_score if data.leak_score else 0,
            "smart_leak_type": data.leak_score.leak_type if data.leak_score else "none",
            "continuous_flow": data.continuous_flow_detected,
            "night_usage": data.night_usage_detected,
            "micro_leak": data.micro_leak_detected,
            "vacation_leak": data.vacation_mode_leak,
        },
    ),
    # Baseline learning status
    WaterBinarySensorEntityDescription(
        key="baseline_ready",
        name="Baseline geleerd (CC)",
        device_class=None,
        value_fn=lambda data: data.baseline_status.get("is_ready", False) if data.baseline_status else False,
        attr_fn=lambda data: data.baseline_status or {},
    ),
)





