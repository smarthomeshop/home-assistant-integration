"""UltimateSensor product module."""

from .coordinator import UltimateSensorCoordinator
from .room_quality import (
    ROOM_QUALITY_SENSORS,
    RoomQualitySensorDescription,
)

__all__ = [
    "UltimateSensorCoordinator",
    "ROOM_QUALITY_SENSORS",
    "RoomQualitySensorDescription",
]

