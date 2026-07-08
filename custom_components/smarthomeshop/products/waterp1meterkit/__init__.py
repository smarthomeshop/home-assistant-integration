"""WaterP1MeterKit product module - Water monitoring + P1/Energy meter.

This product extends the base water functionality with P1/energy readings.
"""

from .coordinator import WaterP1MeterKitCoordinator

__all__ = [
    "WaterP1MeterKitCoordinator",
]
