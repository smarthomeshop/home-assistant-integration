"""WaterMeterKit coordinator - uses base water coordinator directly.

WaterMeterKit = Water Monitoring Only
- All water functionality from base.water
- No additional features
"""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from ..base.water import WaterCoordinator
from ...const import LOGGER


class WaterMeterKitCoordinator(WaterCoordinator):
    """WaterMeterKit coordinator - water monitoring only.

    Uses the base water coordinator directly without modifications.
    Includes: consumption tracking, leak detection, device recognition.
    """

    def __init__(
        self, hass: HomeAssistant, config_entry: ConfigEntry
    ) -> None:
        """Initialize the WaterMeterKit coordinator."""
        super().__init__(hass, config_entry)
        LOGGER.info("WaterMeterKit coordinator initialized")







