"""WaterFlowKit coordinator - Dual water flow monitoring.

WaterFlowKit = 2 Water Flow Sensors
- Flow1: First water flow sensor (e.g., hot water)
- Flow2: Second water flow sensor (e.g., cold water)
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from ...const import (
    DOMAIN,
    LOGGER,
    UPDATE_INTERVAL_SECONDS,
)
from ..base.water.leak_detection import LeakDetectionConfig, LeakDetectionEngine

# Config keys for dual sensors
CONF_FLOW1_WATER_SENSOR = "flow1_water_sensor"
CONF_FLOW1_FLOW_SENSOR = "flow1_flow_sensor"
CONF_FLOW2_WATER_SENSOR = "flow2_water_sensor"
CONF_FLOW2_FLOW_SENSOR = "flow2_flow_sensor"


class _LineTracker:
    """Per-line usage, history, session and leak tracking.

    Mirrors the shared water coordinator but scoped to one flow line so
    both lines get their own baseline and leak scores.
    """

    def __init__(self, hass: HomeAssistant, storage_key: str) -> None:
        self.engine = LeakDetectionEngine(hass, storage_key, LeakDetectionConfig())
        self.flow_history: list[tuple[float, float]] = []
        self.last_session: dict[str, Any] | None = None
        self._day_start: float | None = None
        self._day = ""
        self._session_active = False
        self._session_start: datetime | None = None
        self._session_liters = 0.0
        self._session_last_flow: datetime | None = None

    def update(
        self, flow: float | None, total: float | None, now: datetime
    ) -> dict[str, Any]:
        flow = flow or 0.0
        result: dict[str, Any] = {}

        # Flow history for the panel graph (last ~20 min)
        ts = now.timestamp()
        self.flow_history.append((ts, flow))
        cutoff = ts - 1200
        self.flow_history = [s for s in self.flow_history if s[0] >= cutoff]

        # Usage today from the day-start meter reading
        today = now.strftime("%Y-%m-%d")
        if total is not None:
            if self._day != today or self._day_start is None or total < self._day_start:
                self._day = today
                self._day_start = total
            result["today_usage"] = round(max(0.0, (total - self._day_start) * 1000), 1)
        else:
            result["today_usage"] = None

        # Leak analysis needs the meter total
        leak = self.engine.analyze(flow, total, now) if total is not None else None
        result["leak_score"] = leak.to_dict() if leak else None
        result["baseline"] = self.engine.baseline_status

        # Session tracking (same rules as the shared water coordinator)
        if flow > 0.2:
            if not self._session_active:
                self._session_active = True
                self._session_start = now
                self._session_liters = 0.0
            self._session_liters += flow * UPDATE_INTERVAL_SECONDS / 60
            self._session_last_flow = now
        elif self._session_active and self._session_last_flow:
            if (now - self._session_last_flow).total_seconds() > 90:
                duration = (
                    self._session_last_flow - (self._session_start or now)
                ).total_seconds()
                if self._session_liters >= 1 and duration >= 5:
                    self.last_session = {
                        "duration_min": round(duration / 60, 1),
                        "liters": round(self._session_liters, 1),
                        "ended": self._session_last_flow.isoformat(),
                    }
                self._session_active = False
                self._session_start = None
                self._session_liters = 0.0

        result["last_session"] = self.last_session
        result["flow_history"] = list(self.flow_history)
        return result


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

        # Per-line trackers (leak detection, history, sessions)
        device_key = config_entry.data.get("device_id", config_entry.entry_id)
        self._trackers = {
            "flow1": _LineTracker(hass, f"{device_key}_flow1"),
            "flow2": _LineTracker(hass, f"{device_key}_flow2"),
        }
        self._engines_loaded = False

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

        # Per-line leak detection, history and sessions
        if not self._engines_loaded:
            for tracker in self._trackers.values():
                await tracker.engine.async_load()
            self._engines_loaded = True

        now = dt_util.now()
        for line in ("flow1", "flow2"):
            data[line].update(
                self._trackers[line].update(
                    data[line]["current_flow"], data[line]["total"], now
                )
            )

        # Persist the learned baselines periodically (every hour)
        if now.minute == 0 and now.second < UPDATE_INTERVAL_SECONDS:
            for tracker in self._trackers.values():
                await tracker.engine.async_save()

        return data
