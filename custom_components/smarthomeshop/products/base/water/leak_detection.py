"""Advanced leak detection system for SmartHomeShop water products.

Features:
- Baseline learning: learns normal usage patterns over time
- Smart scoring: calculates leak probability based on multiple factors
- Historical analysis: compares current usage with past patterns
- Configurable thresholds: all parameters can be adjusted
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
import statistics

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from ....const import DOMAIN, LOGGER

STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}_leak_baseline"


@dataclass
class LeakScore:
    """Leak detection score with breakdown."""

    total_score: float = 0.0
    confidence: float = 0.0
    continuous_flow_score: float = 0.0
    night_usage_score: float = 0.0
    pattern_anomaly_score: float = 0.0
    micro_leak_score: float = 0.0
    historical_deviation_score: float = 0.0
    is_leak_likely: bool = False
    leak_type: str = "none"
    description: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for attributes."""
        return {
            "total_score": round(self.total_score, 1),
            "confidence": round(self.confidence, 1),
            "continuous_flow_score": round(self.continuous_flow_score, 1),
            "night_usage_score": round(self.night_usage_score, 1),
            "pattern_anomaly_score": round(self.pattern_anomaly_score, 1),
            "micro_leak_score": round(self.micro_leak_score, 1),
            "historical_deviation_score": round(self.historical_deviation_score, 1),
            "is_leak_likely": self.is_leak_likely,
            "leak_type": self.leak_type,
            "description": self.description,
        }


@dataclass
class BaselineData:
    """Learned baseline usage patterns."""

    hourly_usage: dict[int, list[float]] = field(default_factory=dict)
    daily_usage: dict[int, list[float]] = field(default_factory=dict)
    flow_durations: list[float] = field(default_factory=list)
    night_usage_history: list[float] = field(default_factory=list)
    avg_daily_usage: float = 0.0
    std_daily_usage: float = 0.0
    avg_flow_duration: float = 0.0
    max_normal_flow_duration: float = 1800.0
    learning_days: int = 0
    last_update: str = ""
    is_baseline_ready: bool = False

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "hourly_usage": self.hourly_usage,
            "daily_usage": self.daily_usage,
            "flow_durations": self.flow_durations[-100:],
            "night_usage_history": self.night_usage_history[-30:],
            "avg_daily_usage": self.avg_daily_usage,
            "std_daily_usage": self.std_daily_usage,
            "avg_flow_duration": self.avg_flow_duration,
            "max_normal_flow_duration": self.max_normal_flow_duration,
            "learning_days": self.learning_days,
            "last_update": self.last_update,
            "is_baseline_ready": self.is_baseline_ready,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "BaselineData":
        """Create from dictionary."""
        baseline = cls()
        baseline.hourly_usage = {int(k): v for k, v in data.get("hourly_usage", {}).items()}
        baseline.daily_usage = {int(k): v for k, v in data.get("daily_usage", {}).items()}
        baseline.flow_durations = data.get("flow_durations", [])
        baseline.night_usage_history = data.get("night_usage_history", [])
        baseline.avg_daily_usage = data.get("avg_daily_usage", 0.0)
        baseline.std_daily_usage = data.get("std_daily_usage", 0.0)
        baseline.avg_flow_duration = data.get("avg_flow_duration", 0.0)
        baseline.max_normal_flow_duration = data.get("max_normal_flow_duration", 1800.0)
        baseline.learning_days = data.get("learning_days", 0)
        baseline.last_update = data.get("last_update", "")
        baseline.is_baseline_ready = data.get("is_baseline_ready", False)
        return baseline


@dataclass
class LeakDetectionConfig:
    """Configuration for leak detection."""

    min_flow_rate: float = 0.1
    micro_leak_threshold: float = 0.5
    continuous_flow_minutes: int = 30
    night_start: str = "00:00"
    night_end: str = "06:00"
    night_usage_threshold: float = 2.0
    leak_score_threshold: float = 60.0
    high_confidence_threshold: float = 75.0
    min_learning_days: int = 7
    anomaly_std_multiplier: float = 2.5
    vacation_mode_entity: str = ""


class LeakDetectionEngine:
    """Advanced leak detection engine with learning capabilities."""

    def __init__(
        self,
        hass: HomeAssistant,
        device_id: str,
        config: LeakDetectionConfig | None = None,
    ) -> None:
        """Initialize leak detection engine."""
        self.hass = hass
        self.device_id = device_id
        self.config = config or LeakDetectionConfig()
        self._store = Store(hass, STORAGE_VERSION, f"{STORAGE_KEY}_{device_id}")
        self._baseline = BaselineData()
        self._loaded = False
        self._flow_start_time: datetime | None = None
        self._last_flow_time: datetime | None = None
        self._current_flow_duration: int = 0
        self._night_start_reading: float | None = None
        self._today_start_reading: float | None = None
        self._current_day: int | None = None
        self._hourly_readings: dict[int, float] = {}

    async def async_load(self) -> None:
        """Load baseline data from storage."""
        if self._loaded:
            return
        data = await self._store.async_load()
        if data:
            self._baseline = BaselineData.from_dict(data)
            LOGGER.debug("Loaded baseline for %s: %d learning days", self.device_id, self._baseline.learning_days)
        self._loaded = True

    async def async_save(self) -> None:
        """Save baseline data to storage."""
        self._baseline.last_update = dt_util.now().isoformat()
        await self._store.async_save(self._baseline.to_dict())

    def update_config(self, config: LeakDetectionConfig) -> None:
        """Update configuration."""
        self.config = config

    def analyze(self, current_flow_rate: float, meter_total: float, now: datetime | None = None) -> LeakScore:
        """Analyze current state and return leak score."""
        if now is None:
            now = dt_util.now()
        score = LeakScore()
        self._update_flow_tracking(current_flow_rate, now)
        self._update_period_tracking(meter_total, now)
        score.continuous_flow_score = self._calc_continuous_flow_score(now)
        score.night_usage_score = self._calc_night_usage_score(meter_total, now)
        score.micro_leak_score = self._calc_micro_leak_score(current_flow_rate)
        score.pattern_anomaly_score = self._calc_pattern_anomaly_score(meter_total, now)
        score.historical_deviation_score = self._calc_historical_deviation_score(meter_total, now)
        
        weights = {"continuous": 0.35, "night": 0.25, "micro": 0.15, "pattern": 0.15, "historical": 0.10}
        score.total_score = (
            score.continuous_flow_score * weights["continuous"]
            + score.night_usage_score * weights["night"]
            + score.micro_leak_score * weights["micro"]
            + score.pattern_anomaly_score * weights["pattern"]
            + score.historical_deviation_score * weights["historical"]
        )
        score.confidence = self._calc_confidence()
        score.is_leak_likely = score.total_score >= self.config.leak_score_threshold and score.confidence >= 50
        score.leak_type, score.description = self._determine_leak_type(score)
        return score

    def _update_flow_tracking(self, flow_rate: float, now: datetime) -> None:
        """Update flow tracking state."""
        if flow_rate >= self.config.min_flow_rate:
            if self._flow_start_time is None:
                self._flow_start_time = now
            self._current_flow_duration = int((now - self._flow_start_time).total_seconds())
            self._last_flow_time = now
        else:
            if self._flow_start_time and self._current_flow_duration > 10:
                self._baseline.flow_durations.append(self._current_flow_duration)
                if len(self._baseline.flow_durations) >= 10:
                    self._baseline.avg_flow_duration = statistics.mean(self._baseline.flow_durations[-50:])
                    sorted_durations = sorted(self._baseline.flow_durations[-50:])
                    idx = int(len(sorted_durations) * 0.95)
                    self._baseline.max_normal_flow_duration = sorted_durations[idx]
            if self._last_flow_time and (now - self._last_flow_time).total_seconds() > 120:
                self._flow_start_time = None
                self._current_flow_duration = 0

    def _update_period_tracking(self, meter_total: float, now: datetime) -> None:
        """Update period tracking and learn patterns."""
        hour = now.hour
        day_of_week = now.weekday()
        if hour not in self._hourly_readings:
            self._hourly_readings[hour] = meter_total
        if self._current_day != now.day:
            if self._today_start_reading is not None and self._current_day is not None:
                yesterday_usage = (meter_total - self._today_start_reading) * 1000
                if yesterday_usage > 0:
                    yesterday_dow = (day_of_week - 1) % 7
                    if yesterday_dow not in self._baseline.daily_usage:
                        self._baseline.daily_usage[yesterday_dow] = []
                    self._baseline.daily_usage[yesterday_dow].append(yesterday_usage)
                    for h, reading in self._hourly_readings.items():
                        next_h = (h + 1) % 24
                        if next_h in self._hourly_readings:
                            hourly_usage = (self._hourly_readings[next_h] - reading) * 1000
                            if hourly_usage >= 0:
                                if h not in self._baseline.hourly_usage:
                                    self._baseline.hourly_usage[h] = []
                                self._baseline.hourly_usage[h].append(hourly_usage)
                    all_daily = []
                    for values in self._baseline.daily_usage.values():
                        all_daily.extend(values)
                    if all_daily:
                        self._baseline.avg_daily_usage = statistics.mean(all_daily)
                        if len(all_daily) >= 3:
                            self._baseline.std_daily_usage = statistics.stdev(all_daily)
                    self._baseline.learning_days += 1
                    if self._baseline.learning_days >= self.config.min_learning_days:
                        self._baseline.is_baseline_ready = True
            self._today_start_reading = meter_total
            self._current_day = now.day
            self._hourly_readings = {hour: meter_total}
            self._night_start_reading = None
        self._hourly_readings[hour] = meter_total

    def _calc_continuous_flow_score(self, now: datetime) -> float:
        """Calculate continuous flow score (0-100)."""
        if self._current_flow_duration == 0:
            return 0.0
        threshold_seconds = self.config.continuous_flow_minutes * 60
        if self._baseline.is_baseline_ready:
            learned_max = self._baseline.max_normal_flow_duration
            threshold_seconds = max(threshold_seconds, learned_max * 1.5)
        if self._current_flow_duration < threshold_seconds * 0.5:
            return 0.0
        elif self._current_flow_duration < threshold_seconds:
            progress = (self._current_flow_duration - threshold_seconds * 0.5) / (threshold_seconds * 0.5)
            return progress * 50
        else:
            over_ratio = self._current_flow_duration / threshold_seconds
            return min(100, 50 + (over_ratio - 1) * 25)

    def _calc_night_usage_score(self, meter_total: float, now: datetime) -> float:
        """Calculate night usage score (0-100)."""
        if not self._is_night_time(now):
            return 0.0
        if self._night_start_reading is None:
            self._night_start_reading = meter_total
            return 0.0
        night_usage = (meter_total - self._night_start_reading) * 1000
        expected_night = self.config.night_usage_threshold
        if self._baseline.night_usage_history:
            expected_night = statistics.mean(self._baseline.night_usage_history) + (
                statistics.stdev(self._baseline.night_usage_history)
                if len(self._baseline.night_usage_history) >= 3 else 0
            )
        if night_usage <= expected_night:
            return 0.0
        over_ratio = night_usage / max(expected_night, 1)
        return min(100, (over_ratio - 1) * 50)

    def _calc_micro_leak_score(self, flow_rate: float) -> float:
        """Calculate micro leak score (0-100)."""
        if flow_rate <= 0 or flow_rate > self.config.micro_leak_threshold:
            return 0.0
        if self._current_flow_duration < self.config.continuous_flow_minutes * 30:
            return 0.0
        duration_minutes = self._current_flow_duration / 60
        base_score = min(50, duration_minutes / self.config.continuous_flow_minutes * 50)
        if flow_rate < 0.2:
            base_score *= 1.5
        return min(100, base_score)

    def _calc_pattern_anomaly_score(self, meter_total: float, now: datetime) -> float:
        """Calculate pattern anomaly score (0-100)."""
        if not self._baseline.is_baseline_ready:
            return 0.0
        hour = now.hour
        if hour not in self._baseline.hourly_usage:
            return 0.0
        hourly_history = self._baseline.hourly_usage[hour]
        if len(hourly_history) < 5:
            return 0.0
        prev_hour = (hour - 1) % 24
        if prev_hour not in self._hourly_readings:
            return 0.0
        current_hourly = (meter_total - self._hourly_readings.get(prev_hour, meter_total)) * 1000
        avg = statistics.mean(hourly_history)
        std = statistics.stdev(hourly_history) if len(hourly_history) >= 3 else avg * 0.3
        if std == 0:
            return 0.0
        z_score = (current_hourly - avg) / std
        if z_score <= self.config.anomaly_std_multiplier:
            return 0.0
        return min(100, (z_score - self.config.anomaly_std_multiplier) * 25)

    def _calc_historical_deviation_score(self, meter_total: float, now: datetime) -> float:
        """Calculate historical deviation score (0-100)."""
        if not self._baseline.is_baseline_ready or self._today_start_reading is None:
            return 0.0
        today_usage = (meter_total - self._today_start_reading) * 1000
        hour_fraction = now.hour / 24
        expected_so_far = self._baseline.avg_daily_usage * hour_fraction
        if expected_so_far <= 0:
            return 0.0
        ratio = today_usage / expected_so_far
        if ratio <= 1.5:
            return 0.0
        return min(100, (ratio - 1.5) * 33)

    def _calc_confidence(self) -> float:
        """Calculate confidence in the leak score (0-100)."""
        confidence = 50.0
        if self._baseline.is_baseline_ready:
            confidence += 20
            confidence += min(20, self._baseline.learning_days - self.config.min_learning_days)
        now = dt_util.now()
        if self._is_night_time(now):
            confidence += 10
        return min(100, confidence)

    def _is_night_time(self, now: datetime) -> bool:
        """Check if current time is in night period."""
        try:
            start_parts = self.config.night_start.split(":")
            end_parts = self.config.night_end.split(":")
            start_hour, start_min = int(start_parts[0]), int(start_parts[1])
            end_hour, end_min = int(end_parts[0]), int(end_parts[1])
            current_minutes = now.hour * 60 + now.minute
            start_minutes = start_hour * 60 + start_min
            end_minutes = end_hour * 60 + end_min
            if start_minutes > end_minutes:
                return current_minutes >= start_minutes or current_minutes <= end_minutes
            return start_minutes <= current_minutes <= end_minutes
        except (ValueError, IndexError):
            return False

    def _determine_leak_type(self, score: LeakScore) -> tuple[str, str]:
        """Determine the type of leak and generate description."""
        if not score.is_leak_likely:
            return "none", "Geen lek gedetecteerd"
        scores = {
            "continuous": score.continuous_flow_score,
            "night": score.night_usage_score,
            "micro": score.micro_leak_score,
            "pattern": score.pattern_anomaly_score,
        }
        max_type = max(scores, key=scores.get)
        descriptions = {
            "continuous": f"Continu waterverbruik ({self._current_flow_duration // 60} min)",
            "night": "Onverwacht nachtelijk waterverbruik",
            "micro": "Mogelijk klein lek (druppelende kraan?)",
            "pattern": "Afwijkend verbruikspatroon",
        }
        return max_type, descriptions.get(max_type, "Mogelijk lek gedetecteerd")

    def record_night_usage(self, liters: float) -> None:
        """Record night usage for learning."""
        if liters >= 0:
            self._baseline.night_usage_history.append(liters)

    @property
    def baseline_status(self) -> dict[str, Any]:
        """Get baseline learning status."""
        return {
            "is_ready": self._baseline.is_baseline_ready,
            "learning_days": self._baseline.learning_days,
            "min_days_required": self.config.min_learning_days,
            "avg_daily_usage_liters": round(self._baseline.avg_daily_usage, 1),
            "avg_flow_duration_seconds": round(self._baseline.avg_flow_duration, 0),
        }

    @property
    def current_flow_duration(self) -> int:
        """Get current flow duration in seconds."""
        return self._current_flow_duration
