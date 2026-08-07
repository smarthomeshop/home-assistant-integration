"""WaterFlowKit coordinator - multi water flow monitoring.

WaterFlowKit = 2 Water Flow Sensors (V1), 4 on the V2 board
- Flow1: First water flow sensor (e.g., hot water)
- Flow2: Second water flow sensor (e.g., cold water)
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceEntry
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from ...const import (
    DEFAULT_CONTINUOUS_FLOW_MINUTES,
    DEFAULT_NIGHT_END,
    DEFAULT_NIGHT_START,
    DEFAULT_NIGHT_USAGE_THRESHOLD,
    DOMAIN,
    LEAK_MIN_FLOW_RATE,
    LOGGER,
    MICRO_LEAK_THRESHOLD,
    UPDATE_INTERVAL_SECONDS,
)
from ...device_linking import resolve_source_device
from ..base.water.coordinator import (
    CONF_CONTINUOUS_FLOW_MINUTES,
    CONF_LEAK_SCORE_THRESHOLD,
    CONF_MIN_LEARNING_DAYS,
    CONF_NIGHT_END,
    CONF_NIGHT_START,
    CONF_VACATION_MODE_ENTITY,
)
from ..base.water.leak_detection import (
    LeakDetectionConfig,
    LeakDetectionEngine,
    is_meter_jump,
)

# Config keys for dual sensors
CONF_FLOW1_WATER_SENSOR = "flow1_water_sensor"
CONF_FLOW1_FLOW_SENSOR = "flow1_flow_sensor"
CONF_FLOW2_WATER_SENSOR = "flow2_water_sensor"
CONF_FLOW2_FLOW_SENSOR = "flow2_flow_sensor"

# Flow inputs a WaterFlowKit can have. Flow1 and Flow2 are always reported,
# the V2 board adds two more.
FLOW_LINES = ("flow1", "flow2", "flow3", "flow4")
BASE_FLOW_LINES = ("flow1", "flow2")


class _LineTracker:
    """Per-line usage, history, session and leak tracking.

    Mirrors the shared water coordinator but scoped to one flow line so
    both lines get their own baseline and leak scores.
    """

    def __init__(
        self, hass: HomeAssistant, storage_key: str,
        leak_config: LeakDetectionConfig | None = None,
    ) -> None:
        self.config = leak_config or LeakDetectionConfig()
        self.engine = LeakDetectionEngine(hass, storage_key, self.config)
        self.flow_history: list[tuple[float, float]] = []
        self.last_session: dict[str, Any] | None = None
        self._day_start: float | None = None
        self._day = ""
        self._day_carry = 0.0
        self._last_total: float | None = None
        self._last_seen: datetime | None = None
        self._session_active = False
        self._session_start: datetime | None = None
        self._session_liters = 0.0
        self._session_last_flow: datetime | None = None

    def restore(self, anchors: dict[str, Any]) -> None:
        """Restore the day anchor so a restart does not zero "Today"."""
        day_start = anchors.get("day_start")
        if isinstance(day_start, (int, float)):
            self._day_start = float(day_start)
        day = anchors.get("day")
        if isinstance(day, str):
            self._day = day
        carry = anchors.get("day_carry")
        if isinstance(carry, (int, float)):
            self._day_carry = float(carry)

    def anchors(self) -> dict[str, Any]:
        """Return the day anchor for storage."""
        return {
            "day": self._day,
            "day_start": self._day_start,
            "day_carry": self._day_carry,
        }

    def update(
        self, flow: float | None, total: float | None, now: datetime,
        vacation: bool = False,
    ) -> dict[str, Any]:
        flow = flow or 0.0
        result: dict[str, Any] = {}

        # Flow history for the panel graph (last ~20 min)
        ts = now.timestamp()
        self.flow_history.append((ts, flow))
        cutoff = ts - 1200
        self.flow_history = [s for s in self.flow_history if s[0] >= cutoff]

        # Usage today from the day-start meter reading
        if total is not None:
            self._update_day_anchor(total, now)
            result["today_usage"] = round(
                self._day_carry + max(0.0, (total - self._day_start) * 1000), 1
            )
            self._last_total = total
            self._last_seen = now
        else:
            result["today_usage"] = None

        # Leak analysis needs the meter total
        leak = self.engine.analyze(flow, total, now) if total is not None else None
        if leak is not None and vacation and flow >= self.config.min_flow_rate:
            # Nobody is home, so water that keeps running is always suspect.
            leak.is_leak_likely = True
            if leak.leak_type == "none":
                leak.leak_type = "vacation"
                leak.description = "Water usage while vacation mode is on"
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

    def _update_day_anchor(self, total: float, now: datetime) -> None:
        """Keep the day anchor on the meter, including when the meter steps.

        A reboot restarts the flow counter at zero and a calibration makes it
        jump, so the anchor follows the meter instead of the step showing up
        as usage (or freezing "Today" at zero for the rest of the day).
        """
        today = now.strftime("%Y-%m-%d")
        if self._day != today or self._day_start is None:
            self._day = today
            self._day_start = total
            self._day_carry = 0.0
            return

        if total < self._day_start:
            reference = (
                self._last_total if self._last_total is not None else self._day_start
            )
            self._day_carry += max(0.0, (reference - self._day_start) * 1000)
            self._day_start = total
            return

        if self._last_total is None or self._last_seen is None:
            return
        delta_liters = (total - self._last_total) * 1000
        elapsed = (now - self._last_seen).total_seconds()
        if is_meter_jump(delta_liters, elapsed):
            self._day_start += total - self._last_total


class WaterFlowKitCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """WaterFlowKit coordinator - multi water flow monitoring.

    Tracks every configured flow line for water consumption.
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

        # Get sensor entity IDs from config. Flow1 and Flow2 stay available as
        # attributes because they are the two lines every kit has.
        self._lines = self._configured_lines(config_entry)
        self._water_sensors = {
            line: config_entry.data.get(f"{line}_water_sensor")
            for line in self._lines
        }
        self._flow_sensors = {
            line: config_entry.data.get(f"{line}_flow_sensor")
            for line in self._lines
        }
        self.flow1_water_sensor = self._water_sensors.get("flow1")
        self.flow1_flow_sensor = self._flow_sensors.get("flow1")
        self.flow2_water_sensor = self._water_sensors.get("flow2")
        self.flow2_flow_sensor = self._flow_sensors.get("flow2")

        self._device_entry = resolve_source_device(
            hass,
            config_entry.data.get("device_id"),
            source_entity_ids=(
                *self._water_sensors.values(),
                *self._flow_sensors.values(),
            ),
        )

        # Per-line trackers (leak detection, history, sessions). The leak
        # engine follows the same options the panel advertises for water
        # products instead of silently using its defaults.
        options = config_entry.options
        self._vacation_mode_entity = options.get(CONF_VACATION_MODE_ENTITY, "")
        leak_config = LeakDetectionConfig(
            min_flow_rate=LEAK_MIN_FLOW_RATE,
            micro_leak_threshold=MICRO_LEAK_THRESHOLD,
            continuous_flow_minutes=int(options.get(
                CONF_CONTINUOUS_FLOW_MINUTES, DEFAULT_CONTINUOUS_FLOW_MINUTES
            )),
            night_start=options.get(CONF_NIGHT_START, DEFAULT_NIGHT_START),
            night_end=options.get(CONF_NIGHT_END, DEFAULT_NIGHT_END),
            night_usage_threshold=DEFAULT_NIGHT_USAGE_THRESHOLD,
            leak_score_threshold=float(
                options.get(CONF_LEAK_SCORE_THRESHOLD, 60.0)
            ),
            min_learning_days=int(options.get(CONF_MIN_LEARNING_DAYS, 7)),
            vacation_mode_entity=self._vacation_mode_entity,
        )
        device_key = config_entry.data.get("device_id", config_entry.entry_id)
        self._trackers = {
            line: _LineTracker(hass, f"{device_key}_{line}", leak_config)
            for line in self._lines
        }
        self._engines_loaded = False
        self._saved_anchors: dict[str, Any] | None = None

        LOGGER.info(
            "WaterFlowKit coordinator initialized with lines: %s",
            ", ".join(self._lines),
        )

    @staticmethod
    def _configured_lines(config_entry: ConfigEntry) -> tuple[str, ...]:
        """Return the flow lines this kit has, Flow1 and Flow2 always."""
        configured = tuple(
            line
            for line in FLOW_LINES
            if config_entry.data.get(f"{line}_water_sensor")
            or config_entry.data.get(f"{line}_flow_sensor")
        )
        return tuple(dict.fromkeys(BASE_FLOW_LINES + configured))

    @property
    def device_entry(self) -> DeviceEntry | None:
        """Return the concrete ESPHome registry device."""
        return self._device_entry

    async def async_config_entry_first_refresh(self) -> None:
        """Load the learned baselines and day anchors before the first update."""
        for tracker in self._trackers.values():
            await tracker.engine.async_load()
        self._engines_loaded = True
        self._restore_line_anchors()
        await super().async_config_entry_first_refresh()

    def _restore_line_anchors(self) -> None:
        """Restore the per-line day anchors saved by the previous run."""
        store = self.hass.data.get(DOMAIN, {}).get("store")
        if store is None:
            return
        lines = store.get_water_anchors(self.config_entry.entry_id).get("lines")
        if not isinstance(lines, dict):
            return
        for line, tracker in self._trackers.items():
            anchors = lines.get(line)
            if isinstance(anchors, dict):
                tracker.restore(anchors)

    def _persist_line_anchors(self) -> None:
        """Persist the per-line day anchors when they change."""
        store = self.hass.data.get(DOMAIN, {}).get("store")
        if store is None:
            return
        anchors = {
            "lines": {
                line: tracker.anchors()
                for line, tracker in self._trackers.items()
            }
        }
        if anchors != self._saved_anchors:
            self._saved_anchors = anchors
            self.hass.async_create_task(
                store.async_set_water_anchors(self.config_entry.entry_id, anchors)
            )

    def _vacation_active(self) -> bool:
        """Whether the configured vacation toggle says nobody is home."""
        if not self._vacation_mode_entity:
            return False
        state = self.hass.states.get(self._vacation_mode_entity)
        return bool(state and state.state == "on")

    def _sensor_value(self, entity_id: str | None) -> float | None:
        """Numeric value of a source sensor, or None when it has no reading."""
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if state and state.state not in ("unknown", "unavailable"):
            try:
                return float(state.state)
            except (ValueError, TypeError):
                return None
        return None

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from every configured flow sensor."""
        data: dict[str, Any] = {
            line: {
                "total": self._sensor_value(self._water_sensors.get(line)),
                "current_flow": self._sensor_value(self._flow_sensors.get(line)),
            }
            for line in self._lines
        }

        # Calculate combined totals
        data["combined_total"] = sum(
            data[line]["total"] or 0 for line in self._lines
        )
        data["combined_flow"] = sum(
            data[line]["current_flow"] or 0 for line in self._lines
        )

        # Per-line leak detection, history and sessions
        if not self._engines_loaded:
            for tracker in self._trackers.values():
                await tracker.engine.async_load()
            self._engines_loaded = True

        now = dt_util.now()
        vacation = self._vacation_active()
        for line in self._lines:
            data[line].update(
                self._trackers[line].update(
                    data[line]["current_flow"], data[line]["total"], now, vacation
                )
            )

        # Keep "Today" over a restart, the same way the other water products do.
        self._persist_line_anchors()

        # Persist the learned baselines periodically (every hour)
        if now.minute == 0 and now.second < UPDATE_INTERVAL_SECONDS:
            for tracker in self._trackers.values():
                await tracker.engine.async_save()

        return data
