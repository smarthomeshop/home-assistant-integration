"""WaterFlowKit product module - Dual water flow monitoring.

This product has up to 4 water flow sensors (Flow1 to Flow4).
"""

from .coordinator import WaterFlowKitCoordinator
from .utility_meters import async_setup_utility_meters

__all__ = [
    "WaterFlowKitCoordinator",
    "async_setup_utility_meters",
]

