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
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from ....const import (
    CONF_DEVICE_ID,
    CONF_FLOW_SENSOR,
    CONF_WATER_SENSOR,
    DEFAULT_CONTINUOUS_FLOW_MINUTES,
    DEFAULT_NIGHT_END,
    DEFAULT_NIGHT_START,
    DEVICE_PATTERNS,
    DOMAIN,
    LEAK_MIN_FLOW_RATE,
    LOGGER,
    MICRO_LEAK_THRESHOLD,
    UPDATE_INTERVAL_SECONDS,
)
from .device_detection import DeviceDetector, DeviceMatch, DeviceType
from .leak_detection import LeakDetectionConfig, LeakDetectionEngine, LeakScore

# Config keys
CONF_CONTINUOUS_FLOW_MINUTES = "continuous_flow_minutes"
CONF_NIGHT_START = "night_start"
CONF_NIGHT_END = "night_end"
CONF_VACATION_MODE_ENTITY = "vacation_mode_entity"
CONF_LEAK_SCORE_THRESHOLD = "leak_score_threshold"
CONF_MIN_LEARNING_DAYS = "min_learning_days"


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

    # Device detection (advanced)
    detected_device: str | None = None
    detected_device_icon: str = "mdi:help-circle"
    detected_device_confidence: float = 0.0
    current_usage_pattern: str = "idle"
    device_match: DeviceMatch | None = None

    # Tracking
    flow_start_time: datetime | None = None
    last_update: datetime | None = None

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

        # Internal tracking for flow/leak detection (legacy)
        self._flow_start_time: datetime | None = None
        self._last_flow_time: datetime | None = None
        self._night_start_reading: float | None = None

        # Current period for resets
        self._current_day: int | None = None
        self._current_week: int | None = None
        self._current_month: int | None = None
        self._current_year: int | None = None

        # NEW: Smart leak detection engine
        device_id = config_entry.data.get(CONF_DEVICE_ID, config_entry.entry_id)
        self._leak_engine = LeakDetectionEngine(
            hass, device_id, self._create_leak_config()
        )

        # NEW: Advanced device detector
        self._device_detector = DeviceDetector()

        # Get device info from source entity
        self._device_info = self._get_source_device_info()

    def _create_leak_config(self) -> LeakDetectionConfig:
        """Create leak detection configuration from options."""
        return LeakDetectionConfig(
            min_flow_rate=LEAK_MIN_FLOW_RATE,
            micro_leak_threshold=MICRO_LEAK_THRESHOLD,
            continuous_flow_minutes=self._continuous_flow_minutes,
            night_start=self._night_start,
            night_end=self._night_end,
            night_usage_threshold=2.0,
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

    def _get_source_device_info(self) -> DeviceInfo | None:
        """Get device info from the source water sensor entity."""
        if not self._water_sensor:
            return None

        entity_registry = er.async_get(self.hass)
        entity_entry = entity_registry.async_get(self._water_sensor)

        if not entity_entry or not entity_entry.device_id:
            LOGGER.warning("Source entity %s not found in registry", self._water_sensor)
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

    async def async_config_entry_first_refresh(self) -> None:
        """Handle first refresh - load baseline data."""
        await self._leak_engine.async_load()
        await super().async_config_entry_first_refresh()

    async def _async_update_data(self) -> WaterUsageData:
        """Fetch data from sensors and calculate leak detection."""
        data = WaterUsageData()
        now = dt_util.now()
        data.last_update = now

        # Get current meter reading
        data.meter_total = self._get_sensor_value(self._water_sensor)

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

        # Sync smart detection to legacy fields for card compatibility
        if data.leak_score:
            data.continuous_flow_duration = self._leak_engine.current_flow_duration
            if data.leak_score.is_leak_likely:
                if data.leak_score.leak_type == "continuous":
                    data.continuous_flow_detected = True
                elif data.leak_score.leak_type == "night":
                    data.night_usage_detected = True
                elif data.leak_score.leak_type == "micro":
                    data.micro_leak_detected = True

        # Device detection
        self._detect_device(data)

        # Update tracking
        self._last_meter_reading = data.meter_total

        # Save baseline periodically (every hour)
        if now.minute == 0 and now.second < 30:
            await self._leak_engine.async_save()

        # Allow subclasses to add extra data
        await self._async_update_extra_data(data)

        return data

    async def _async_update_extra_data(self, data: WaterUsageData) -> None:
        """Override in subclasses to add product-specific data."""
        pass

    def _get_sensor_value(self, entity_id: str) -> float:
        """Get numeric value from a sensor."""
        if not entity_id:
            return 0.0
        state = self.hass.states.get(entity_id)
        if state and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            try:
                return float(state.state)
            except (ValueError, TypeError):
                pass
        return 0.0

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

        flow_rate = (volume_diff * 1000) / (time_diff / 60)
        return round(flow_rate, 2)

    def _update_period_tracking(self, data: WaterUsageData, now: datetime) -> None:
        """Update daily, weekly, monthly, and yearly consumption."""
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
            self._current_day = now.day
            self._night_start_reading = None

        # Weekly reset (Monday is 0)
        if self._current_week != now.isocalendar()[1]:
            self._week_start_reading = data.meter_total
            self._current_week = now.isocalendar()[1]

        # Monthly reset
        if self._current_month != now.month:
            self._month_start_reading = data.meter_total
            self._current_month = now.month

        # Yearly reset
        if self._current_year != now.year:
            self._year_start_reading = data.meter_total
            self._current_year = now.year

        # Calculate usage (in liters)
        data.today_usage = max(0, (data.meter_total - self._day_start_reading) * 1000)
        data.week_usage = max(0, (data.meter_total - self._week_start_reading) * 1000)
        data.month_usage = max(0, (data.meter_total - self._month_start_reading) * 1000)
        data.year_usage = max(0, (data.meter_total - self._year_start_reading) * 1000)

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
        """Detect unexpected water usage during night hours."""
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

                night_usage = (data.meter_total - self._night_start_reading) * 1000
                if night_usage > 1:
                    data.night_usage_detected = True
                    data.night_usage_amount = round(night_usage, 2)
                else:
                    data.night_usage_detected = False
                    data.night_usage_amount = 0.0
            else:
                # Record night usage for learning when night ends
                if self._night_start_reading is not None:
                    night_total = (data.meter_total - self._night_start_reading) * 1000
                    self._leak_engine.record_night_usage(night_total)
                self._night_start_reading = None
                data.night_usage_detected = False
                data.night_usage_amount = 0.0

        except (ValueError, IndexError):
            LOGGER.warning("Invalid night time configuration")

    def _detect_device(self, data: WaterUsageData) -> None:
        """Detect which device might be using water using advanced pattern analysis.

        Uses the DeviceDetector which analyzes:
        - Flow rate patterns (average, variance, peaks)
        - Duration characteristics
        - Cyclic behavior (wash cycles)
        - Time-of-day probabilities
        """
        # Use advanced detector
        match = self._device_detector.process_flow_reading(
            data.current_flow_rate, LEAK_MIN_FLOW_RATE
        )

        if match is None or data.current_flow_rate < LEAK_MIN_FLOW_RATE:
            data.current_usage_pattern = "idle"
            data.detected_device = None
            data.detected_device_icon = "mdi:water-off"
            data.detected_device_confidence = 0.0
            data.device_match = None
            return

        data.current_usage_pattern = "active"
        data.device_match = match
        data.detected_device = match.name
        data.detected_device_icon = match.icon
        data.detected_device_confidence = round(match.confidence * 100, 1)

        # Log detection for debugging
        if match.confidence > 0.5:
            LOGGER.debug(
                "Device detected: %s (confidence: %.1f%%, flow: %.1f L/min)",
                match.name,
                match.confidence * 100,
                data.current_flow_rate,
            )

    @callback
    def async_update_options(self) -> None:
        """Update options from config entry."""
        self._load_options(self.config_entry.options)
        self._leak_engine.update_config(self._create_leak_config())
        self.async_set_updated_data(self.data)





