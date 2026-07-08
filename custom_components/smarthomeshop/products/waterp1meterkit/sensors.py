"""Sensors for WaterP1MeterKit.

Note: Energy period tracking (daily, weekly, monthly, yearly) is now handled by
automatically created Utility Meter helpers. These are more reliable because:
- They are persistent across Home Assistant restarts
- They work correctly with the Energy Dashboard
- They reset automatically at the correct times (midnight, start of week/month/year)

The Utility Meters are created automatically in utility_meters.py when a
WaterP1MeterKit is set up.
"""

from __future__ import annotations

from collections.abc import Callable

from .coordinator import WaterP1MeterKitCoordinator


async def async_setup_energy_sensors(
    coordinator: WaterP1MeterKitCoordinator,
    async_add_entities: Callable,
) -> None:
    """Set up energy consumption sensors.

    Note: Energy tracking sensors are now created as Utility Meter helpers
    instead of custom sensors. This provides better persistence and
    compatibility with the Energy Dashboard.

    The following Utility Meters are created automatically:
    - WaterP1 {device_id} Energy Daily T1/T2
    - WaterP1 {device_id} Energy Weekly T1/T2
    - WaterP1 {device_id} Energy Monthly T1/T2
    - WaterP1 {device_id} Energy Yearly T1/T2
    """
    # No custom sensors needed - Utility Meters handle period tracking
    pass
