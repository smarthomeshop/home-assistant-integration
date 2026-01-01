"""Shared water sensor definitions for SmartHomeShop water products.

These sensors are used by: WaterP1MeterKit, WaterMeterKit, WaterFlowKit
Includes: Smart leak detection score sensor
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import PERCENTAGE, UnitOfVolume, UnitOfVolumeFlowRate

from .coordinator import WaterUsageData


@dataclass(frozen=True, kw_only=True)
class WaterSensorEntityDescription(SensorEntityDescription):
    """Describes a water sensor entity."""

    value_fn: Callable[[WaterUsageData], Any]
    attr_fn: Callable[[WaterUsageData], dict[str, Any]] | None = None


WATER_SENSORS: tuple[WaterSensorEntityDescription, ...] = (
    WaterSensorEntityDescription(
        key="current_flow_rate",
        name="Huidig waterverbruik (CC)",
        device_class=SensorDeviceClass.VOLUME_FLOW_RATE,
        native_unit_of_measurement=UnitOfVolumeFlowRate.LITERS_PER_MINUTE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: round(data.current_flow_rate, 2),
    ),
    WaterSensorEntityDescription(
        key="today_usage",
        name="Verbruik vandaag (CC)",
        icon="mdi:water-check",
        native_unit_of_measurement=UnitOfVolume.LITERS,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        value_fn=lambda data: round(data.today_usage, 1),
    ),
    WaterSensorEntityDescription(
        key="week_usage",
        name="Verbruik deze week (CC)",
        icon="mdi:water-check",
        native_unit_of_measurement=UnitOfVolume.LITERS,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        value_fn=lambda data: round(data.week_usage, 1),
    ),
    WaterSensorEntityDescription(
        key="month_usage",
        name="Verbruik deze maand (CC)",
        icon="mdi:water-check",
        native_unit_of_measurement=UnitOfVolume.LITERS,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        value_fn=lambda data: round(data.month_usage, 0),
    ),
    WaterSensorEntityDescription(
        key="year_usage",
        name="Verbruik dit jaar (CC)",
        icon="mdi:water-check",
        native_unit_of_measurement=UnitOfVolume.CUBIC_METERS,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=3,
        value_fn=lambda data: round(data.year_usage / 1000, 3),
    ),
    # Smart leak score sensor
    WaterSensorEntityDescription(
        key="leak_score",
        name="Lek score (CC)",
        icon="mdi:water-alert",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: round(data.leak_score.total_score, 0) if data.leak_score else 0,
        attr_fn=lambda data: (
            {
                **(data.leak_score.to_dict() if data.leak_score else {}),
                "baseline_ready": data.baseline_status.get("is_ready", False) if data.baseline_status else False,
                "learning_days": data.baseline_status.get("learning_days", 0) if data.baseline_status else 0,
            }
        ),
    ),
    # Confidence sensor
    WaterSensorEntityDescription(
        key="leak_confidence",
        name="Lek detectie zekerheid (CC)",
        icon="mdi:shield-check",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: round(data.leak_score.confidence, 0) if data.leak_score else 0,
        attr_fn=lambda data: data.baseline_status or {},
    ),
    # Learning progress sensor
    WaterSensorEntityDescription(
        key="baseline_learning_days",
        name="Baseline leerdagen (CC)",
        icon="mdi:school",
        native_unit_of_measurement="dagen",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data.baseline_status.get("learning_days", 0) if data.baseline_status else 0,
        attr_fn=lambda data: {
            "min_days_required": data.baseline_status.get("min_days_required", 7) if data.baseline_status else 7,
            "is_ready": data.baseline_status.get("is_ready", False) if data.baseline_status else False,
            "avg_daily_usage": data.baseline_status.get("avg_daily_usage_liters", 0) if data.baseline_status else 0,
        },
    ),
    WaterSensorEntityDescription(
        key="detected_device",
        name="Gedetecteerd apparaat (CC)",
        icon="mdi:washing-machine",
        value_fn=lambda data: data.detected_device or "none",
        attr_fn=lambda data: {
            "confidence": f"{data.detected_device_confidence:.0f}%",
            "icon": data.detected_device_icon,
            "flow_rate": f"{data.current_flow_rate:.1f} L/min",
            "duration": f"{data.continuous_flow_duration} min",
            "pattern": data.current_usage_pattern,
            "match_details": (
                data.device_match.match_details if data.device_match else {}
            ),
        },
    ),
    WaterSensorEntityDescription(
        key="continuous_flow_duration",
        name="Continue flow duur (CC)",
        icon="mdi:timer-alert",
        native_unit_of_measurement="min",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data.continuous_flow_duration,
        attr_fn=lambda data: {
            "leak_detected": data.continuous_flow_detected,
            "smart_leak_type": data.leak_score.leak_type if data.leak_score else "none",
        },
    ),
)





