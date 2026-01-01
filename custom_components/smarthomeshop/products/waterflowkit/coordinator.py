"""WaterFlowKit coordinator - Dual water flow monitoring.

WaterFlowKit = 2 Water Flow Sensors
- Flow1: First water flow sensor (e.g., hot water)
- Flow2: Second water flow sensor (e.g., cold water)
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from ...const import (
    DOMAIN,
    LOGGER,
    UPDATE_INTERVAL_SECONDS,
)

# Config keys for dual sensors
CONF_FLOW1_WATER_SENSOR = "flow1_water_sensor"
CONF_FLOW1_FLOW_SENSOR = "flow1_flow_sensor"
CONF_FLOW2_WATER_SENSOR = "flow2_water_sensor"
CONF_FLOW2_FLOW_SENSOR = "flow2_flow_sensor"


class WaterFlowKitCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """WaterFlowKit coordinator - dual water flow monitoring.

    Tracks both Flow1 and Flow2 sensors for water consumption.
    """

    config_entry: ConfigEntry

    def __init__(
        self, hass: HomeAssistant, config_entry: ConfigEntry
    ) -> None:
        """Initialize the WaterFlowKit coordinator."""
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_waterflowkit",
            update_interval=timedelta(seconds=UPDATE_INTERVAL_SECONDS),
            config_entry=config_entry,
        )

        # Get sensor entity IDs from config
        self.flow1_water_sensor = config_entry.data.get(CONF_FLOW1_WATER_SENSOR)
        self.flow1_flow_sensor = config_entry.data.get(CONF_FLOW1_FLOW_SENSOR)
        self.flow2_water_sensor = config_entry.data.get(CONF_FLOW2_WATER_SENSOR)
        self.flow2_flow_sensor = config_entry.data.get(CONF_FLOW2_FLOW_SENSOR)

        # Get device info from source entity
        self._device_info = self._get_source_device_info()

        LOGGER.info(
            "WaterFlowKit coordinator initialized with Flow1: %s, Flow2: %s",
            self.flow1_water_sensor,
            self.flow2_water_sensor,
        )

    def _get_source_device_info(self) -> DeviceInfo | None:
        """Get device info from the source water sensor entity."""
        # Try Flow1 first, then Flow2
        water_sensor = self.flow1_water_sensor or self.flow2_water_sensor
        if not water_sensor:
            return None

        entity_registry = er.async_get(self.hass)
        entity_entry = entity_registry.async_get(water_sensor)

        if not entity_entry or not entity_entry.device_id:
            LOGGER.warning("Source entity %s not found in registry", water_sensor)
            return None

        device_registry = dr.async_get(self.hass)
        device = device_registry.async_get(entity_entry.device_id)

        if not device:
            LOGGER.warning("Device %s not found", entity_entry.device_id)
            return None

        # Link to existing device via identifiers or connections
        if device.identifiers:
            return DeviceInfo(identifiers=device.identifiers)
        if device.connections:
            return DeviceInfo(connections=device.connections)

        return None

    @property
    def device_info(self) -> DeviceInfo | None:
        """Return device information - links to existing ESPHome device."""
        return self._device_info

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from both flow sensors."""
        data: dict[str, Any] = {
            "flow1": {
                "total": None,
                "current_flow": None,
            },
            "flow2": {
                "total": None,
                "current_flow": None,
            },
            "combined_total": None,
            "combined_flow": None,
        }

        # Get Flow1 data
        if self.flow1_water_sensor:
            state = self.hass.states.get(self.flow1_water_sensor)
            if state and state.state not in ("unknown", "unavailable"):
                try:
                    data["flow1"]["total"] = float(state.state)
                except (ValueError, TypeError):
                    pass

        if self.flow1_flow_sensor:
            state = self.hass.states.get(self.flow1_flow_sensor)
            if state and state.state not in ("unknown", "unavailable"):
                try:
                    data["flow1"]["current_flow"] = float(state.state)
                except (ValueError, TypeError):
                    pass

        # Get Flow2 data
        if self.flow2_water_sensor:
            state = self.hass.states.get(self.flow2_water_sensor)
            if state and state.state not in ("unknown", "unavailable"):
                try:
                    data["flow2"]["total"] = float(state.state)
                except (ValueError, TypeError):
                    pass

        if self.flow2_flow_sensor:
            state = self.hass.states.get(self.flow2_flow_sensor)
            if state and state.state not in ("unknown", "unavailable"):
                try:
                    data["flow2"]["current_flow"] = float(state.state)
                except (ValueError, TypeError):
                    pass

        # Calculate combined totals
        flow1_total = data["flow1"]["total"] or 0
        flow2_total = data["flow2"]["total"] or 0
        data["combined_total"] = flow1_total + flow2_total

        flow1_current = data["flow1"]["current_flow"] or 0
        flow2_current = data["flow2"]["current_flow"] or 0
        data["combined_flow"] = flow1_current + flow2_current

        return data
