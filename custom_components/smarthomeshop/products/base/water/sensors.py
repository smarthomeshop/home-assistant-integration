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
        key="water_cost_today",
        name="Water cost today (CC)",
        icon="mdi:currency-eur",
        native_unit_of_measurement="EUR",
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        value_fn=lambda data: data.water_cost_today,
    ),
    WaterSensorEntityDescription(
        key="usage_vs_average",
        name="Usage vs 7-day average (CC)",
        icon="mdi:chart-bell-curve",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: data.usage_vs_average,
    ),
    WaterSensorEntityDescription(
        key="last_session",
        name="Last water session (CC)",
        icon="mdi:water-sync",
        native_unit_of_measurement="L",
        value_fn=lambda data: (data.last_session or {}).get("liters"),
        attr_fn=lambda data: data.last_session,
    ),

    WaterSensorEntityDescription(
        key="current_flow_rate",
        name="Current water usage (CC)",
        device_class=SensorDeviceClass.VOLUME_FLOW_RATE,
        native_unit_of_measurement=UnitOfVolumeFlowRate.LITERS_PER_MINUTE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: round(data.current_flow_rate, 2),
    ),
    WaterSensorEntityDescription(
        key="today_usage",
        name="Usage today (CC)",
        icon="mdi:water-check",
        native_unit_of_measurement=UnitOfVolume.LITERS,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        value_fn=lambda data: round(data.today_usage, 1),
    ),
    WaterSensorEntityDescription(
        key="week_usage",
        name="Usage this week (CC)",
        icon="mdi:water-check",
        native_unit_of_measurement=UnitOfVolume.LITERS,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        value_fn=lambda data: round(data.week_usage, 1),
    ),
    WaterSensorEntityDescription(
        key="month_usage",
        name="Usage this month (CC)",
        icon="mdi:water-check",
        native_unit_of_measurement=UnitOfVolume.LITERS,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=0,
        value_fn=lambda data: round(data.month_usage, 0),
    ),
    WaterSensorEntityDescription(
        key="year_usage",
        name="Usage this year (CC)",
        icon="mdi:water-check",
        native_unit_of_measurement=UnitOfVolume.CUBIC_METERS,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=3,
        value_fn=lambda data: round(data.year_usage / 1000, 3),
    ),
    # Smart leak score sensor
    WaterSensorEntityDescription(
        key="leak_score",
        name="Leak score (CC)",
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
        name="Leak detection confidence (CC)",
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
        name="Baseline learning days (CC)",
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
        key="continuous_flow_duration",
        name="Continuous flow duration (CC)",
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





