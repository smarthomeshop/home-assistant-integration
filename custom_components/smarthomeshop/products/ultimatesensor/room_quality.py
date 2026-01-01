"""Room Quality sensors for UltimateSensor."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntityDescription,
    SensorStateClass,
)

from .coordinator import RoomQualityData


@dataclass(frozen=True, kw_only=True)
class RoomQualitySensorDescription(SensorEntityDescription):
    """Describes a Room Quality sensor."""

    value_fn: Callable[[RoomQualityData], Any]
    attr_fn: Callable[[RoomQualityData], dict[str, Any] | None] | None = None


ROOM_QUALITY_SENSORS: tuple[RoomQualitySensorDescription, ...] = (
    RoomQualitySensorDescription(
        key="room_quality",
        name="Room Quality (CC)",
        icon="mdi:home-heart",
        native_unit_of_measurement=None,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data.score,
        attr_fn=lambda data: {
            "score_percentage": data.score_percentage,
            "label": data.label,
            "color": data.color,
            "recommendations": data.recommendations,
            "co2": data.co2,
            "co2_status": data.co2_status,
            "pm2_5": data.pm25,
            "pm2_5_status": data.pm25_status,
            "voc": data.voc,
            "voc_status": data.voc_status,
            "temperature": data.temperature,
            "temperature_status": data.temperature_status,
            "humidity": data.humidity,
            "humidity_status": data.humidity_status,
            "illuminance": data.illuminance,
        },
    ),
    RoomQualitySensorDescription(
        key="room_quality_label",
        name="Room Quality Label (CC)",
        icon="mdi:tag",
        value_fn=lambda data: data.label,
        attr_fn=lambda data: {"color": data.color},
    ),
    RoomQualitySensorDescription(
        key="room_quality_percentage",
        name="Room Quality Percentage (CC)",
        icon="mdi:percent",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data.score_percentage,
    ),
)

