"""Shared water coordinator for all SmartHomeShop water products.

This coordinator provides:
- Water consumption tracking (today, week, month, year)
- Advanced leak detection with baseline learning
- Smart leak scoring system
- Device recognition (shower, toilet, washing machine, etc.)

Used by: WaterP1MeterKit, WaterMeterKit, WaterFlowKit
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntry
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.helpers import issue_registry as ir
from homeassistant.util import dt as dt_util

from ....const import (
    CONF_DEVICE_ID,
    CONF_FLOW_SENSOR,
    CONF_WATER_SENSOR,
    DEFAULT_CONTINUOUS_FLOW_MINUTES,
    DEFAULT_NIGHT_END,
    DEFAULT_NIGHT_START,
    DOMAIN,
    LEAK_MIN_FLOW_RATE,
    LOGGER,
    MICRO_LEAK_THRESHOLD,
    UPDATE_INTERVAL_SECONDS,
    CONF_PRICE_WATER,
    DEFAULT_NIGHT_USAGE_THRESHOLD,
    DEFAULT_PRICE_WATER,
    EVENT_LEAK_CLEARED,
    EVENT_LEAK_DETECTED,
)
from ....device_linking import resolve_source_device
from .leak_detection import (
    LeakDetectionConfig,
    LeakDetectionEngine,
    LeakScore,
    is_meter_jump,
)

# Config keys
CONF_CONTINUOUS_FLOW_MINUTES = "continuous_flow_minutes"
CONF_NIGHT_START = "night_start"
CONF_NIGHT_END = "night_end"
CONF_VACATION_MODE_ENTITY = "vacation_mode_entity"
CONF_LEAK_SCORE_THRESHOLD = "leak_score_threshold"
CONF_MIN_LEARNING_DAYS = "min_learning_days"

# Night usage only looks like a leak when the water keeps coming back: one
# toilet flush falls in a single slot of the night, a running toilet or a
# dripping tap keeps showing up slot after slot.
NIGHT_SLOT_SECONDS = 900
NIGHT_LEAK_MIN_SLOTS = 4


@dataclass
class WaterUsageData:
    """Water usage data container - shared by all water products."""

    # Current values
    current_flow_rate: float = 0.0
    meter_total: float = 0.0

    # Period consumption (in liters)
    today_usage: float = 0.0
    week_usage: float = 0.0
    month_usage: float = 0.0
    year_usage: float = 0.0

    # Legacy leak detection (for backwards compatibility)
    continuous_flow_detected: bool = False
    continuous_flow_duration: int = 0
    night_usage_detected: bool = False
    night_usage_amount: float = 0.0
    micro_leak_detected: bool = False
    vacation_mode_leak: bool = False

    # NEW: Smart leak detection
    leak_score: LeakScore | None = None
    baseline_status: dict[str, Any] | None = None

    # Tracking
    flow_start_time: datetime | None = None
    last_update: datetime | None = None

    # Costs and comparisons
    water_cost_today: float | None = None
    usage_vs_average: float | None = None

    # Last completed water session (duration, liters)
    last_session: dict[str, Any] | None = None

    # Extension point for product-specific data
    extra_data: dict[str, Any] = field(default_factory=dict)


class WaterCoordinator(DataUpdateCoordinator[WaterUsageData]):
    """Shared water data coordinator with consumption tracking and smart leak detection.

    This base coordinator can be used directly by WaterMeterKit/WaterFlowKit
    or extended by WaterP1MeterKit to add energy functionality.
    """

    config_entry: ConfigEntry

    def __init__(
        self, hass: HomeAssistant, config_entry: ConfigEntry
    ) -> None:
        """Initialize the water coordinator."""
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_water",
            update_interval=timedelta(seconds=UPDATE_INTERVAL_SECONDS),
            config_entry=config_entry,
        )

        self._water_sensor = config_entry.data.get(CONF_WATER_SENSOR, "")
        self._flow_sensor = config_entry.data.get(CONF_FLOW_SENSOR, "")
        self._product_type = config_entry.data.get("product_type", "unknown")

        # Options
        self._load_options(config_entry.options)

        # Internal tracking for consumption
        self._last_meter_reading: float | None = None
        self._day_start_reading: float | None = None
        self._week_start_reading: float | None = None
        self._month_start_reading: float | None = None
        self._year_start_reading: float | None = None

        # Litres already counted in the running period before the meter
        # itself was reset, so a firmware reboot does not zero the sensors.
        self._period_carry: dict[str, float] = {
            "day": 0.0,
            "week": 0.0,
            "month": 0.0,
            "year": 0.0,
        }

        # Internal tracking for flow/leak detection (legacy)
        self._flow_start_time: datetime | None = None
        self._last_flow_time: datetime | None = None
        self._night_start_reading: float | None = None
        self._night_active_slots: set[int] = set()

        # Current period for resets
        self._current_day: int | None = None
        # (ISO year, ISO week) - the year is included so week 1 of a new year
        # never matches week 1 of a previous year.
        self._current_week: tuple[int, int] | None = None
        self._current_month: int | None = None
        self._current_year: int | None = None

        # NEW: Smart leak detection engine
        device_id = config_entry.data.get(CONF_DEVICE_ID, config_entry.entry_id)
        self._leak_engine = LeakDetectionEngine(
            hass, device_id, self._create_leak_config()
        )

        self._device_entry = resolve_source_device(
            hass,
            config_entry.data.get(CONF_DEVICE_ID),
            source_entity_ids=(self._water_sensor, self._flow_sensor),
        )

        # Session tracking (for "last session" statistics)
        self._session_active = False
        self._session_start: datetime | None = None
        self._session_liters = 0.0
        self._session_last_flow: datetime | None = None
        self._last_session: dict[str, Any] | None = None
        self._recent_sessions: list[dict[str, Any]] = []
        self._flow_history: list[tuple[float, float]] = []

        # Leak alarm state for events and repair issues
        self._leak_active = False
        self._leak_score_snapshot: dict[str, Any] | None = None
        self._leak_hold_until: datetime | None = None

    def _create_leak_config(self) -> LeakDetectionConfig:
        """Create leak detection configuration from options."""
        return LeakDetectionConfig(
            min_flow_rate=LEAK_MIN_FLOW_RATE,
            micro_leak_threshold=MICRO_LEAK_THRESHOLD,
            continuous_flow_minutes=self._continuous_flow_minutes,
            night_start=self._night_start,
            night_end=self._night_end,
            night_usage_threshold=DEFAULT_NIGHT_USAGE_THRESHOLD,
            leak_score_threshold=self._leak_score_threshold,
            min_learning_days=self._min_learning_days,
            vacation_mode_entity=self._vacation_mode_entity,
        )

    def _load_options(self, options: dict[str, Any]) -> None:
        """Load options from config entry."""
        self._continuous_flow_minutes = options.get(
            CONF_CONTINUOUS_FLOW_MINUTES, DEFAULT_CONTINUOUS_FLOW_MINUTES
        )
        self._night_start = options.get(CONF_NIGHT_START, DEFAULT_NIGHT_START)
        self._night_end = options.get(CONF_NIGHT_END, DEFAULT_NIGHT_END)
        self._vacation_mode_entity = options.get(CONF_VACATION_MODE_ENTITY, "")
        self._leak_score_threshold = options.get(CONF_LEAK_SCORE_THRESHOLD, 60.0)
        self._min_learning_days = options.get(CONF_MIN_LEARNING_DAYS, 7)

    @property
    def water_sensor_entity_id(self) -> str:
        """Return the water sensor entity ID."""
        return self._water_sensor

    @property
    def flow_sensor_entity_id(self) -> str:
        """Return the flow sensor entity ID."""
        return self._flow_sensor

    @property
    def product_type(self) -> str:
        """Return the product type."""
        return self._product_type

    @property
    def device_entry(self) -> DeviceEntry | None:
        """Return the concrete ESPHome registry device."""
        return self._device_entry

    async def async_config_entry_first_refresh(self) -> None:
        """Handle first refresh - load baseline data."""
        await self._leak_engine.async_load()
        self._restore_period_anchors()
        # Best-effort water price default from the HA Energy Dashboard
        try:
            from ....energy_prices import async_ha_energy_prices

            self._ha_water_price = (
                await async_ha_energy_prices(self.hass)
            ).get(CONF_PRICE_WATER)
        except Exception:  # noqa: BLE001
            self._ha_water_price = None
        await super().async_config_entry_first_refresh()

    def _restore_period_anchors(self) -> None:
        """Restore day/week/month/year meter anchors after a restart, so the
        usage sensors do not reset to zero every time HA restarts."""
        store = self.hass.data.get(DOMAIN, {}).get("store")
        if store is None:
            return
        anchors = store.get_water_anchors(self.config_entry.entry_id)
        if not anchors:
            return
        # Anchors are meter readings, so they only mean something on the meter
        # they were taken from. Switching to the calibrated total (which starts
        # at the reading of the physical meter) would otherwise turn the first
        # subtraction into years of usage in one period.
        stored_source = anchors.get("source")
        if stored_source and stored_source != self._water_sensor:
            LOGGER.info(
                "Water meter source changed from %s to %s; usage periods start "
                "again from the new reading",
                stored_source,
                self._water_sensor,
            )
            return
        self._day_start_reading = anchors.get("day_start")
        self._week_start_reading = anchors.get("week_start")
        self._month_start_reading = anchors.get("month_start")
        self._year_start_reading = anchors.get("year_start")
        self._night_start_reading = anchors.get("night_start")
        self._current_day = anchors.get("current_day")
        week = anchors.get("current_week")
        self._current_week = tuple(week) if isinstance(week, list) else week
        self._current_month = anchors.get("current_month")
        self._current_year = anchors.get("current_year")
        carry = anchors.get("period_carry")
        if isinstance(carry, dict):
            for period in self._period_carry:
                value = carry.get(period)
                if isinstance(value, (int, float)):
                    self._period_carry[period] = float(value)
        self._restore_leak_state(anchors)

    def _restore_leak_state(self, anchors: dict[str, Any]) -> None:
        """Pick the leak alarm back up where the previous run left it.

        Saving a setting in the panel reloads the entry and a restart rebuilds
        the leak engine from scratch, both of which leave the engine without
        any flow history. Without this the alarm would silently drop and the
        repair issue would be left behind with nobody to clear it.
        """
        self._leak_active = bool(anchors.get("leak_active"))
        snapshot = anchors.get("leak_score")
        self._leak_score_snapshot = snapshot if isinstance(snapshot, dict) else None
        if not self._leak_active:
            return
        # Give the engine a full continuous-flow window to judge the situation
        # itself before the restored alarm is allowed to clear.
        self._leak_hold_until = dt_util.now() + timedelta(
            minutes=self._continuous_flow_minutes
        )
        self._async_create_leak_issue(
            (self._leak_score_snapshot or {}).get("leak_type", "unknown")
        )

    def _persist_period_anchors(self) -> None:
        """Persist the period anchors when they change (rollover or init)."""
        store = self.hass.data.get(DOMAIN, {}).get("store")
        if store is None:
            return
        anchors = {
            "source": self._water_sensor,
            "day_start": self._day_start_reading,
            "week_start": self._week_start_reading,
            "month_start": self._month_start_reading,
            "year_start": self._year_start_reading,
            "night_start": self._night_start_reading,
            "current_day": self._current_day,
            "current_week": list(self._current_week) if self._current_week else None,
            "current_month": self._current_month,
            "current_year": self._current_year,
            "period_carry": dict(self._period_carry),
            "leak_active": self._leak_active,
            "leak_score": self._leak_score_snapshot,
        }
        if anchors != getattr(self, "_saved_anchors", None):
            self._saved_anchors = anchors
            self.hass.async_create_task(
                store.async_set_water_anchors(self.config_entry.entry_id, anchors)
            )

    def _contract_water_price(self) -> float | None:
        """Water price from a connected contract, if one is active."""
        prices = self.hass.data.get(DOMAIN, {}).get("prices")
        if prices is None:
            return None
        price = prices.contract_price("water")
        return price if price and price > 0 else None

    async def _async_update_data(self) -> WaterUsageData:
        """Fetch data from sensors and calculate leak detection."""
        data = WaterUsageData()
        now = dt_util.now()
        data.last_update = now

        # Get current meter reading. An offline/unknown meter must never be
        # read as 0.0: that would anchor phantom usage, fire false leak alarms
        # and record a huge jump when the device reconnects. Hold the last
        # known state instead, which on a cold start is nothing at all: the
        # sensors then stay unknown rather than reporting a meter that has
        # never been seen as empty.
        raw_total = self._get_sensor_value_or_none(self._water_sensor)
        if raw_total is None:
            return self.data
        data.meter_total = raw_total

        # Get current flow rate
        if self._flow_sensor:
            data.current_flow_rate = self._get_sensor_value(self._flow_sensor)
        else:
            data.current_flow_rate = self._calculate_flow_rate(data.meter_total, now)

        # Update period tracking
        self._update_period_tracking(data, now)

        # Legacy leak detection (for backwards compatibility)
        self._detect_leaks(data, now)

        # NEW: Smart leak detection with scoring
        data.leak_score = self._leak_engine.analyze(
            data.current_flow_rate, data.meter_total, now
        )
        data.baseline_status = self._leak_engine.baseline_status
        self._apply_leak_hold(data, now)

        # Sync smart detection to legacy fields for card compatibility.
        # The engine tracks seconds; the sensor (and the legacy path below)
        # report minutes.
        if data.leak_score:
            data.continuous_flow_duration = int(
                self._leak_engine.current_flow_duration / 60
            )
            if data.leak_score.is_leak_likely:
                if data.leak_score.leak_type == "continuous":
                    data.continuous_flow_detected = True
                elif data.leak_score.leak_type == "night":
                    data.night_usage_detected = True
                elif data.leak_score.leak_type == "micro":
                    data.micro_leak_detected = True

        # Update tracking
        self._last_meter_reading = data.meter_total

        # Save baseline periodically (every hour)
        if now.minute == 0 and now.second < 30:
            await self._leak_engine.async_save()

        # Keep a short flow history for the panel sparkline (last ~20 min)
        self._flow_history.append((now.timestamp(), data.current_flow_rate or 0.0))
        cutoff = now.timestamp() - 1200
        self._flow_history = [s for s in self._flow_history if s[0] >= cutoff]

        # Track water sessions for "last session" statistics
        self._track_session(data, now)
        data.last_session = self._last_session

        # Water cost today, based on the price per m3. A connected energy
        # contract is the single source of truth; otherwise the configured
        # price, then the HA Energy Dashboard water price, then the default.
        price_water = self._contract_water_price()
        if price_water is None:
            price_opt = self.config_entry.options.get(CONF_PRICE_WATER)
            if price_opt in (None, ""):
                price_opt = getattr(self, "_ha_water_price", None)
            try:
                price_water = float(price_opt) if price_opt is not None else DEFAULT_PRICE_WATER
            except (ValueError, TypeError):
                price_water = DEFAULT_PRICE_WATER
        if price_water > 0:
            data.water_cost_today = round(data.today_usage / 1000 * price_water, 2)

        # Usage compared to the learned 7-day average
        if data.baseline_status and data.baseline_status.get("is_ready"):
            avg = data.baseline_status.get("avg_daily_usage_liters") or 0
            if avg > 0:
                data.usage_vs_average = round((data.today_usage / avg - 1) * 100, 0)

        # Fire events and manage a repair issue on leak state changes
        self._handle_leak_notifications(data)

        # Allow subclasses to add extra data
        await self._async_update_extra_data(data)

        return data

    def _track_session(self, data: WaterUsageData, now: datetime) -> None:
        """Detect start/stop of water sessions and remember the last one."""
        flow = data.current_flow_rate or 0.0
        interval = UPDATE_INTERVAL_SECONDS

        if flow > 0.2:
            if not self._session_active:
                self._session_active = True
                self._session_start = now
                self._session_liters = 0.0
            self._session_liters += flow * interval / 60
            self._session_last_flow = now
        elif self._session_active and self._session_last_flow:
            # Close the session after 90 seconds without flow
            if (now - self._session_last_flow).total_seconds() > 90:
                duration = (self._session_last_flow - (self._session_start or now)).total_seconds()
                if self._session_liters >= 1 and duration >= 5:
                    self._last_session = {
                        "duration_min": round(duration / 60, 1),
                        "liters": round(self._session_liters, 1),
                        "ended": self._session_last_flow.isoformat(),
                    }
                    self._recent_sessions.insert(0, self._last_session)
                    del self._recent_sessions[10:]
                self._session_active = False
                self._session_start = None
                self._session_liters = 0.0

    @property
    def recent_sessions(self) -> list[dict[str, Any]]:
        """Return the most recent completed water sessions."""
        return self._recent_sessions

    @property
    def flow_history(self) -> list[tuple[float, float]]:
        """Return (timestamp, flow) samples of the last ~20 minutes."""
        return self._flow_history

    def _apply_leak_hold(self, data: WaterUsageData, now: datetime) -> None:
        """Report the leak of the previous run while the engine catches up.

        A reload or restart rebuilds the leak engine with an empty flow
        history, so its score starts at zero even though the water is still
        running. The engine needs more than one continuous-flow window to
        rebuild the pattern and history parts of its score, so the hold ends
        on the situation rather than on a timer: it is released once the
        engine confirms the leak itself, or once the water has actually
        stopped. Only a long stop clears it, so a leak that pauses briefly
        does not get an all clear.
        """
        if self._leak_hold_until is None:
            return
        if data.leak_score and data.leak_score.is_leak_likely:
            # The engine caught up and owns the verdict again.
            self._leak_hold_until = None
            return
        if data.current_flow_rate is not None and data.current_flow_rate > LEAK_MIN_FLOW_RATE:
            # Still running: keep the alarm and push the deadline out, so the
            # hold only expires after the flow has genuinely stopped.
            self._leak_hold_until = now + timedelta(
                minutes=self._continuous_flow_minutes
            )
        elif now >= self._leak_hold_until:
            self._leak_hold_until = None
            return
        if self._leak_score_snapshot:
            data.leak_score = LeakScore(
                **{
                    key: value
                    for key, value in self._leak_score_snapshot.items()
                    if key in LeakScore.__dataclass_fields__
                }
            )

    def _async_create_leak_issue(self, leak_type: str) -> None:
        """Raise the repair issue that tells the owner about the leak."""
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            f"leak_{self.config_entry.entry_id}",
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key="leak_detected",
            translation_placeholders={
                "device": self.config_entry.title,
                "leak_type": leak_type,
            },
        )

    def _handle_leak_notifications(self, data: WaterUsageData) -> None:
        """Fire events and manage a repair issue when the leak alarm flips."""
        leak_now = bool(data.leak_score and data.leak_score.is_leak_likely)
        if leak_now == self._leak_active:
            return
        self._leak_active = leak_now

        device_name = self.config_entry.title
        leak_type = data.leak_score.leak_type if data.leak_score else "unknown"

        if leak_now:
            self._leak_score_snapshot = (
                data.leak_score.to_dict() if data.leak_score else None
            )
            self.hass.bus.async_fire(
                EVENT_LEAK_DETECTED,
                {
                    "entry_id": self.config_entry.entry_id,
                    "device": device_name,
                    "leak_type": leak_type,
                    "score": data.leak_score.total_score if data.leak_score else None,
                },
            )
            self._async_create_leak_issue(leak_type)
            LOGGER.warning("Leak detected on %s (%s)", device_name, leak_type)
        else:
            self._leak_score_snapshot = None
            self.hass.bus.async_fire(
                EVENT_LEAK_CLEARED,
                {"entry_id": self.config_entry.entry_id, "device": device_name},
            )
            ir.async_delete_issue(
                self.hass, DOMAIN, f"leak_{self.config_entry.entry_id}"
            )
            LOGGER.info("Leak cleared on %s", device_name)

        # The alarm has to survive a reload, so store the new state right away.
        self._persist_period_anchors()

    async def _async_update_extra_data(self, data: WaterUsageData) -> None:
        """Override in subclasses to add product-specific data."""
        pass

    def _get_sensor_value(self, entity_id: str) -> float:
        """Get numeric value from a sensor."""
        value = self._get_sensor_value_or_none(entity_id)
        return 0.0 if value is None else value

    def _get_sensor_value_or_none(self, entity_id: str) -> float | None:
        """Numeric value from a sensor, or None when it has no valid reading."""
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if state and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            try:
                return float(state.state)
            except (ValueError, TypeError):
                pass
        return None

    def _calculate_flow_rate(self, current_reading: float, now: datetime) -> float:
        """Calculate flow rate from meter readings."""
        if self._last_meter_reading is None or self.data is None:
            return 0.0

        time_diff = (now - (self.data.last_update or now)).total_seconds()
        if time_diff <= 0:
            return 0.0

        volume_diff = current_reading - self._last_meter_reading
        if volume_diff < 0:
            return 0.0
        if is_meter_jump(volume_diff * 1000, time_diff):
            # A recalibrated meter is not a river; see _apply_meter_discontinuity.
            return 0.0

        flow_rate = (volume_diff * 1000) / (time_diff / 60)
        return round(flow_rate, 2)

    def _update_period_tracking(self, data: WaterUsageData, now: datetime) -> None:
        """Update daily, weekly, monthly, and yearly consumption."""
        self._apply_meter_discontinuity(data.meter_total, now)

        # Initialize readings if not set
        if self._day_start_reading is None:
            self._day_start_reading = data.meter_total
        if self._week_start_reading is None:
            self._week_start_reading = data.meter_total
        if self._month_start_reading is None:
            self._month_start_reading = data.meter_total
        if self._year_start_reading is None:
            self._year_start_reading = data.meter_total

        # Daily reset
        if self._current_day != now.day:
            self._day_start_reading = data.meter_total
            self._period_carry["day"] = 0.0
            self._current_day = now.day
            self._night_start_reading = None
            self._night_active_slots = set()

        # Weekly reset (Monday is 0)
        iso_week = now.isocalendar()[:2]
        if self._current_week != iso_week:
            self._week_start_reading = data.meter_total
            self._period_carry["week"] = 0.0
            self._current_week = iso_week

        # Monthly reset
        if self._current_month != now.month:
            self._month_start_reading = data.meter_total
            self._period_carry["month"] = 0.0
            self._current_month = now.month

        # Yearly reset
        if self._current_year != now.year:
            self._year_start_reading = data.meter_total
            self._period_carry["year"] = 0.0
            self._current_year = now.year

        # Calculate usage (in liters)
        data.today_usage = self._period_usage("day", self._day_start_reading, data)
        data.week_usage = self._period_usage("week", self._week_start_reading, data)
        data.month_usage = self._period_usage("month", self._month_start_reading, data)
        data.year_usage = self._period_usage("year", self._year_start_reading, data)

        # Persist the anchors so a restart does not reset the usage sensors.
        self._persist_period_anchors()

    def _period_usage(
        self, period: str, anchor: float, data: WaterUsageData
    ) -> float:
        """Litres used in a period, including what a reset meter left behind."""
        return self._period_carry[period] + max(
            0.0, (data.meter_total - anchor) * 1000
        )

    def _apply_meter_discontinuity(self, meter_total: float, now: datetime) -> None:
        """Keep the period anchors aligned when the meter itself steps.

        A firmware reboot restarts the raw pulse counter at zero and entering
        the physical meter reading through the card makes the total jump.
        Neither is water that flowed through the pipe, so a step down keeps
        what was already counted and re-anchors, and a step up that no pipe
        can deliver moves the anchors along with it.
        """
        anchors = {
            "day": self._day_start_reading,
            "week": self._week_start_reading,
            "month": self._month_start_reading,
            "year": self._year_start_reading,
        }
        known = [value for value in anchors.values() if value is not None]
        if not known:
            return

        if any(meter_total < value for value in known):
            reference = (
                self._last_meter_reading
                if self._last_meter_reading is not None
                else max(known)
            )
            for period, anchor in anchors.items():
                if anchor is None:
                    continue
                self._period_carry[period] += max(0.0, (reference - anchor) * 1000)
            self._day_start_reading = meter_total
            self._week_start_reading = meter_total
            self._month_start_reading = meter_total
            self._year_start_reading = meter_total
            if self._night_start_reading is not None:
                self._night_start_reading = meter_total
            LOGGER.info(
                "Water meter of %s stepped back to %s; usage counted so far is kept",
                self.config_entry.title,
                meter_total,
            )
            return

        # A jump up can only be judged against a known previous reading and
        # the time it took, so the very first reading after a restart is left
        # alone: catching up after hours offline is real usage.
        if self._last_meter_reading is None or self.data is None:
            return
        delta_liters = (meter_total - self._last_meter_reading) * 1000
        elapsed = (now - (self.data.last_update or now)).total_seconds()
        if not is_meter_jump(delta_liters, elapsed):
            return

        shift = meter_total - self._last_meter_reading
        if self._day_start_reading is not None:
            self._day_start_reading += shift
        if self._week_start_reading is not None:
            self._week_start_reading += shift
        if self._month_start_reading is not None:
            self._month_start_reading += shift
        if self._year_start_reading is not None:
            self._year_start_reading += shift
        if self._night_start_reading is not None:
            self._night_start_reading += shift
        LOGGER.info(
            "Water meter of %s was set to %s; period usage keeps running from there",
            self.config_entry.title,
            meter_total,
        )

    def _detect_leaks(self, data: WaterUsageData, now: datetime) -> None:
        """Detect various types of leaks (legacy method)."""
        # Continuous flow detection
        if data.current_flow_rate >= LEAK_MIN_FLOW_RATE:
            if self._flow_start_time is None:
                self._flow_start_time = now
            else:
                flow_duration = (now - self._flow_start_time).total_seconds() / 60
                data.continuous_flow_duration = int(flow_duration)
                if flow_duration >= self._continuous_flow_minutes:
                    data.continuous_flow_detected = True
            self._last_flow_time = now
        else:
            if self._last_flow_time and (now - self._last_flow_time).total_seconds() > 120:
                self._flow_start_time = None
                data.continuous_flow_duration = 0
                data.continuous_flow_detected = False

        # Night usage detection
        self._detect_night_usage(data, now)

        # Micro leak detection
        if (
            0 < data.current_flow_rate <= MICRO_LEAK_THRESHOLD
            and data.continuous_flow_duration > (self._continuous_flow_minutes / 2)
        ):
            data.micro_leak_detected = True
        else:
            data.micro_leak_detected = False

        # Vacation mode leak detection
        if self._vacation_mode_entity:
            vacation_state = self.hass.states.get(self._vacation_mode_entity)
            if vacation_state and vacation_state.state == "on":
                if data.current_flow_rate > LEAK_MIN_FLOW_RATE:
                    data.vacation_mode_leak = True
            else:
                data.vacation_mode_leak = False
        else:
            data.vacation_mode_leak = False

    def _detect_night_usage(self, data: WaterUsageData, now: datetime) -> None:
        """Detect unexpected water usage during night hours.

        Water at night is only unexpected when it keeps coming back. One
        toilet flush lands in a single slot of the night window, while a
        running toilet or a dripping tap turns up in slot after slot. Only
        that pattern raises the flag, so the leak alarm this feeds is not
        tripped by a normal night visit; the litres themselves stay
        available as the raw signal.
        """
        try:
            night_start_parts = self._night_start.split(":")
            night_end_parts = self._night_end.split(":")
            night_start_time = now.replace(
                hour=int(night_start_parts[0]),
                minute=int(night_start_parts[1]),
                second=0,
                microsecond=0,
            )
            night_end_time = now.replace(
                hour=int(night_end_parts[0]),
                minute=int(night_end_parts[1]),
                second=0,
                microsecond=0,
            )

            is_night = False
            if night_start_time > night_end_time:
                is_night = now >= night_start_time or now <= night_end_time
            else:
                is_night = night_start_time <= now <= night_end_time

            if is_night:
                if self._night_start_reading is None:
                    self._night_start_reading = data.meter_total
                    self._night_active_slots = set()

                night_usage = (data.meter_total - self._night_start_reading) * 1000
                data.night_usage_amount = round(max(0.0, night_usage), 2)

                water_moved = data.current_flow_rate >= LEAK_MIN_FLOW_RATE or (
                    self._last_meter_reading is not None
                    and data.meter_total > self._last_meter_reading
                )
                if water_moved:
                    self._night_active_slots.add(
                        int(now.timestamp() // NIGHT_SLOT_SECONDS)
                    )

                data.night_usage_detected = (
                    night_usage > DEFAULT_NIGHT_USAGE_THRESHOLD
                    and len(self._night_active_slots) >= NIGHT_LEAK_MIN_SLOTS
                )
            else:
                # Record night usage for learning when night ends
                if self._night_start_reading is not None:
                    night_total = (data.meter_total - self._night_start_reading) * 1000
                    self._leak_engine.record_night_usage(night_total)
                self._night_start_reading = None
                self._night_active_slots = set()
                data.night_usage_detected = False
                data.night_usage_amount = 0.0

        except (ValueError, IndexError):
            LOGGER.warning("Invalid night time configuration")

    @callback
    def async_update_options(self) -> None:
        """Update options from config entry."""
        self._load_options(self.config_entry.options)
        self._leak_engine.update_config(self._create_leak_config())
        self.async_set_updated_data(self.data)



