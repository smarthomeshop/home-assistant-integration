"""Advanced device detection using pattern analysis and probabilistic matching.

This module provides intelligent detection of water-consuming devices by analyzing:
- Flow rate patterns (average, variance, peaks)
- Duration characteristics
- Cyclic behavior (wash cycles, rinse cycles)
- Time-of-day probabilities
- Historical usage patterns

Supported devices:
- Shower: High flow, moderate duration, morning peak
- Toilet: High flow, very short duration, uniform throughout day
- Washing Machine: Medium flow, long duration, cyclic pattern
- Dishwasher: Low-medium flow, very long duration, evening peak
- Faucet: Variable flow, short duration
- Garden Hose: High flow, variable duration, afternoon/evening
- Bath: Very high flow, long duration, evening peak
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, time
from enum import Enum
from typing import Final

from homeassistant.util import dt as dt_util


class DeviceType(Enum):
    """Known water-consuming device types."""

    UNKNOWN = "unknown"
    SHOWER = "shower"
    TOILET = "toilet"
    WASHING_MACHINE = "washing_machine"
    DISHWASHER = "dishwasher"
    FAUCET = "faucet"
    GARDEN_HOSE = "garden_hose"
    BATH = "bath"
    OUTDOOR_TAP = "outdoor_tap"


@dataclass
class DeviceSignature:
    """Signature defining a device's water usage characteristics."""

    device_type: DeviceType
    name: str
    icon: str

    # Flow rate characteristics (L/min)
    flow_min: float
    flow_max: float
    flow_typical: float

    # Duration characteristics (seconds)
    duration_min: int
    duration_max: int
    duration_typical: int

    # Pattern characteristics
    is_cyclic: bool = False  # Has wash/rinse cycles
    cycle_count_min: int = 0
    cycle_count_max: int = 0
    cycle_duration_min: int = 0  # seconds per cycle
    cycle_duration_max: int = 0

    # Flow variance (0 = steady, 1 = highly variable)
    flow_variance: float = 0.2

    # Time-of-day probability weights (0-24 hours, higher = more likely)
    time_weights: dict[int, float] = field(default_factory=dict)

    # Day-of-week weights (0=Monday, 6=Sunday)
    day_weights: dict[int, float] = field(default_factory=dict)

    # Base probability weight
    base_weight: float = 1.0


# Device signature definitions based on real-world data
DEVICE_SIGNATURES: Final[dict[DeviceType, DeviceSignature]] = {
    DeviceType.SHOWER: DeviceSignature(
        device_type=DeviceType.SHOWER,
        name="Douche",
        icon="mdi:shower",
        flow_min=6.0,
        flow_max=14.0,
        flow_typical=9.0,
        duration_min=180,  # 3 min
        duration_max=1200,  # 20 min
        duration_typical=480,  # 8 min
        flow_variance=0.15,  # Fairly steady
        time_weights={
            6: 2.0, 7: 3.0, 8: 2.5, 9: 1.5,  # Morning peak
            18: 1.2, 19: 1.5, 20: 1.8, 21: 1.5, 22: 1.2,  # Evening
        },
        base_weight=1.2,
    ),
    DeviceType.TOILET: DeviceSignature(
        device_type=DeviceType.TOILET,
        name="Toilet",
        icon="mdi:toilet",
        flow_min=5.0,
        flow_max=18.0,
        flow_typical=10.0,
        duration_min=8,
        duration_max=45,
        duration_typical=20,
        flow_variance=0.3,  # Initial surge then decline
        time_weights={h: 1.0 for h in range(24)},  # Uniform throughout day
        base_weight=1.5,  # Very common
    ),
    DeviceType.WASHING_MACHINE: DeviceSignature(
        device_type=DeviceType.WASHING_MACHINE,
        name="Wasmachine",
        icon="mdi:washing-machine",
        flow_min=2.0,
        flow_max=12.0,
        flow_typical=6.0,
        duration_min=1800,  # 30 min
        duration_max=7200,  # 2 hours
        duration_typical=3600,  # 1 hour
        is_cyclic=True,
        cycle_count_min=3,
        cycle_count_max=8,
        cycle_duration_min=120,
        cycle_duration_max=600,
        flow_variance=0.8,  # Very variable (fill, pause, fill, drain)
        time_weights={
            8: 1.5, 9: 2.0, 10: 2.0, 11: 1.5,  # Morning
            14: 1.2, 15: 1.5, 16: 1.5,  # Afternoon
            19: 1.3, 20: 1.2,  # Evening
        },
        day_weights={5: 1.5, 6: 1.8},  # Weekend higher
        base_weight=1.0,
    ),
    DeviceType.DISHWASHER: DeviceSignature(
        device_type=DeviceType.DISHWASHER,
        name="Vaatwasser",
        icon="mdi:dishwasher",
        flow_min=1.5,
        flow_max=7.0,
        flow_typical=3.5,
        duration_min=2700,  # 45 min
        duration_max=14400,  # 4 hours (eco mode)
        duration_typical=5400,  # 1.5 hours
        is_cyclic=True,
        cycle_count_min=2,
        cycle_count_max=5,
        cycle_duration_min=180,
        cycle_duration_max=900,
        flow_variance=0.7,  # Variable (rinse cycles)
        time_weights={
            12: 1.2, 13: 1.5,  # After lunch
            19: 1.8, 20: 2.5, 21: 2.0, 22: 1.5,  # After dinner peak
        },
        base_weight=0.9,
    ),
    DeviceType.FAUCET: DeviceSignature(
        device_type=DeviceType.FAUCET,
        name="Kraan",
        icon="mdi:faucet",
        flow_min=2.0,
        flow_max=15.0,
        flow_typical=8.0,
        duration_min=3,
        duration_max=180,  # 3 min
        duration_typical=30,
        flow_variance=0.5,  # Variable (adjusting flow)
        time_weights={
            7: 1.5, 8: 1.3,  # Morning
            12: 1.3, 13: 1.2,  # Lunch
            18: 1.5, 19: 1.8, 20: 1.5,  # Dinner prep/cleanup
        },
        base_weight=1.3,  # Very common
    ),
    DeviceType.BATH: DeviceSignature(
        device_type=DeviceType.BATH,
        name="Bad",
        icon="mdi:bathtub",
        flow_min=10.0,
        flow_max=20.0,
        flow_typical=14.0,
        duration_min=300,  # 5 min
        duration_max=1200,  # 20 min filling
        duration_typical=600,  # 10 min
        flow_variance=0.1,  # Very steady (just filling)
        time_weights={
            19: 1.5, 20: 2.0, 21: 2.5, 22: 2.0,  # Evening bath time
        },
        day_weights={4: 1.2, 5: 1.5, 6: 1.5},  # Weekend/Friday evening
        base_weight=0.5,  # Less common than shower
    ),
    DeviceType.GARDEN_HOSE: DeviceSignature(
        device_type=DeviceType.GARDEN_HOSE,
        name="Tuinslang",
        icon="mdi:sprinkler",
        flow_min=8.0,
        flow_max=25.0,
        flow_typical=15.0,
        duration_min=60,
        duration_max=3600,  # 1 hour
        duration_typical=600,  # 10 min
        flow_variance=0.4,
        time_weights={
            6: 1.5, 7: 1.8,  # Early morning watering
            18: 1.5, 19: 2.0, 20: 1.8,  # Evening watering
        },
        day_weights={5: 1.5, 6: 2.0},  # Weekend
        base_weight=0.4,  # Seasonal
    ),
}


@dataclass
class FlowSample:
    """A single flow rate sample with timestamp."""

    timestamp: datetime
    flow_rate: float


@dataclass
class UsageSession:
    """Represents a continuous water usage session."""

    start_time: datetime
    samples: list[FlowSample] = field(default_factory=list)
    end_time: datetime | None = None

    # Computed statistics
    avg_flow: float = 0.0
    max_flow: float = 0.0
    min_flow: float = 0.0
    flow_variance: float = 0.0
    total_volume: float = 0.0

    # Cycle detection
    cycles_detected: int = 0
    cycle_durations: list[float] = field(default_factory=list)

    @property
    def duration_seconds(self) -> float:
        """Get session duration in seconds."""
        end = self.end_time or dt_util.utcnow()
        return (end - self.start_time).total_seconds()

    @property
    def is_active(self) -> bool:
        """Check if session is still active."""
        return self.end_time is None

    def add_sample(self, flow_rate: float, timestamp: datetime | None = None) -> None:
        """Add a flow sample to the session."""
        if timestamp is None:
            timestamp = dt_util.utcnow()
        self.samples.append(FlowSample(timestamp=timestamp, flow_rate=flow_rate))
        self._update_statistics()

    def close(self, timestamp: datetime | None = None) -> None:
        """Close the session."""
        self.end_time = timestamp or dt_util.utcnow()
        self._detect_cycles()

    def _update_statistics(self) -> None:
        """Update computed statistics from samples."""
        if not self.samples:
            return

        flows = [s.flow_rate for s in self.samples]
        self.avg_flow = sum(flows) / len(flows)
        self.max_flow = max(flows)
        self.min_flow = min(flows)

        if len(flows) > 1:
            mean = self.avg_flow
            variance = sum((f - mean) ** 2 for f in flows) / len(flows)
            self.flow_variance = (variance ** 0.5) / mean if mean > 0 else 0

        # Estimate total volume (simple integration)
        if len(self.samples) >= 2:
            total = 0.0
            for i in range(1, len(self.samples)):
                dt = (self.samples[i].timestamp - self.samples[i - 1].timestamp).total_seconds()
                avg_flow = (self.samples[i].flow_rate + self.samples[i - 1].flow_rate) / 2
                total += avg_flow * dt / 60  # Convert to liters
            self.total_volume = total

    def _detect_cycles(self) -> None:
        """Detect wash/rinse cycles in the flow pattern."""
        if len(self.samples) < 10:
            return

        flows = [s.flow_rate for s in self.samples]
        threshold = self.avg_flow * 0.3  # 30% of average as "off" threshold

        # Find transitions from low to high flow
        in_cycle = False
        cycle_start = 0
        cycles = []

        for i, flow in enumerate(flows):
            if not in_cycle and flow > threshold:
                in_cycle = True
                cycle_start = i
            elif in_cycle and flow < threshold:
                in_cycle = False
                if i - cycle_start >= 3:  # Minimum 3 samples for a cycle
                    cycles.append((cycle_start, i))

        self.cycles_detected = len(cycles)

        # Calculate cycle durations
        if cycles:
            for start_idx, end_idx in cycles:
                if end_idx < len(self.samples) and start_idx < len(self.samples):
                    duration = (
                        self.samples[end_idx].timestamp - self.samples[start_idx].timestamp
                    ).total_seconds()
                    self.cycle_durations.append(duration)


@dataclass
class DeviceMatch:
    """Result of device matching with confidence score."""

    device_type: DeviceType
    confidence: float  # 0.0 to 1.0
    signature: DeviceSignature
    match_details: dict[str, float] = field(default_factory=dict)

    @property
    def name(self) -> str:
        """Get device name."""
        return self.signature.name

    @property
    def icon(self) -> str:
        """Get device icon."""
        return self.signature.icon


class DeviceDetector:
    """Advanced device detector using probabilistic pattern matching."""

    def __init__(self) -> None:
        """Initialize the detector."""
        self._current_session: UsageSession | None = None
        self._recent_sessions: list[UsageSession] = []
        self._max_recent_sessions = 100

        # Learning data (device confirmations from user)
        self._confirmed_patterns: dict[DeviceType, list[UsageSession]] = {
            dt: [] for dt in DeviceType
        }

    def process_flow_reading(
        self, flow_rate: float, min_flow_threshold: float = 0.1
    ) -> DeviceMatch | None:
        """Process a flow reading and return device match if confident enough.

        Args:
            flow_rate: Current flow rate in L/min
            min_flow_threshold: Minimum flow to consider as active

        Returns:
            DeviceMatch if a device is detected with sufficient confidence, else None
        """
        now = dt_util.utcnow()

        if flow_rate < min_flow_threshold:
            # Flow stopped - close session if active
            if self._current_session and self._current_session.is_active:
                self._current_session.close(now)
                result = self._analyze_session(self._current_session)
                self._store_session(self._current_session)
                self._current_session = None
                return result
            return None

        # Flow is active
        if self._current_session is None:
            self._current_session = UsageSession(start_time=now)

        self._current_session.add_sample(flow_rate, now)

        # Return preliminary match for ongoing session
        return self._analyze_session(self._current_session)

    def _analyze_session(self, session: UsageSession) -> DeviceMatch | None:
        """Analyze a session and return the best device match."""
        if not session.samples:
            return None

        matches: list[DeviceMatch] = []

        for device_type, signature in DEVICE_SIGNATURES.items():
            confidence, details = self._calculate_match_confidence(session, signature)
            if confidence > 0.1:  # Minimum threshold
                matches.append(
                    DeviceMatch(
                        device_type=device_type,
                        confidence=confidence,
                        signature=signature,
                        match_details=details,
                    )
                )

        if not matches:
            return DeviceMatch(
                device_type=DeviceType.UNKNOWN,
                confidence=0.5,
                signature=DeviceSignature(
                    device_type=DeviceType.UNKNOWN,
                    name="Onbekend",
                    icon="mdi:help-circle",
                    flow_min=0,
                    flow_max=100,
                    flow_typical=10,
                    duration_min=0,
                    duration_max=86400,
                    duration_typical=60,
                ),
                match_details={"reason": "no_match"},
            )

        # Sort by confidence and return best match
        matches.sort(key=lambda m: m.confidence, reverse=True)
        return matches[0]

    def _calculate_match_confidence(
        self, session: UsageSession, signature: DeviceSignature
    ) -> tuple[float, dict[str, float]]:
        """Calculate confidence score for a device signature match.

        Returns:
            Tuple of (confidence_score, match_details_dict)
        """
        scores: dict[str, float] = {}

        # 1. Flow rate match (0-1)
        flow_score = self._score_range_match(
            session.avg_flow,
            signature.flow_min,
            signature.flow_max,
            signature.flow_typical,
        )
        scores["flow_rate"] = flow_score

        # 2. Duration match (0-1)
        duration = session.duration_seconds
        duration_score = self._score_range_match(
            duration,
            signature.duration_min,
            signature.duration_max,
            signature.duration_typical,
        )
        # Penalize if session is too short (still ongoing)
        if session.is_active and duration < signature.duration_min:
            # Scale score based on how close we are to minimum
            duration_score *= min(1.0, duration / signature.duration_min)
        scores["duration"] = duration_score

        # 3. Flow variance match (0-1)
        variance_diff = abs(session.flow_variance - signature.flow_variance)
        variance_score = max(0, 1 - variance_diff * 2)
        scores["variance"] = variance_score

        # 4. Cyclic pattern match (0-1)
        if signature.is_cyclic:
            if session.cycles_detected >= signature.cycle_count_min:
                cycle_score = min(
                    1.0,
                    session.cycles_detected / signature.cycle_count_max
                    if signature.cycle_count_max > 0
                    else 1.0,
                )
            else:
                # Penalize non-cyclic session for cyclic device
                cycle_score = 0.3 if session.is_active else 0.1
            scores["cycles"] = cycle_score
        else:
            # Non-cyclic device shouldn't have many cycles
            if session.cycles_detected > 2:
                scores["cycles"] = 0.5
            else:
                scores["cycles"] = 1.0

        # 5. Time-of-day match (0-1)
        current_hour = session.start_time.hour
        time_weight = signature.time_weights.get(current_hour, 0.5)
        time_score = min(1.0, time_weight / 2.0)  # Normalize (2.0 = max weight)
        scores["time_of_day"] = time_score

        # 6. Day-of-week match (0-1)
        current_day = session.start_time.weekday()
        day_weight = signature.day_weights.get(current_day, 1.0)
        day_score = min(1.0, day_weight / 2.0)
        scores["day_of_week"] = day_score

        # Calculate weighted average
        weights = {
            "flow_rate": 0.30,
            "duration": 0.25,
            "variance": 0.15,
            "cycles": 0.15,
            "time_of_day": 0.10,
            "day_of_week": 0.05,
        }

        total_score = sum(scores[k] * weights[k] for k in weights)

        # Apply base weight
        total_score *= signature.base_weight

        # Clamp to 0-1
        total_score = max(0.0, min(1.0, total_score))

        return total_score, scores

    def _score_range_match(
        self, value: float, min_val: float, max_val: float, typical: float
    ) -> float:
        """Score how well a value matches an expected range.

        Returns 1.0 for perfect match (at typical), decreasing toward edges and beyond.
        """
        if min_val <= value <= max_val:
            # Inside range - score based on distance from typical
            if value <= typical:
                range_size = typical - min_val
                if range_size > 0:
                    return 0.7 + 0.3 * (1 - abs(value - typical) / range_size)
            else:
                range_size = max_val - typical
                if range_size > 0:
                    return 0.7 + 0.3 * (1 - abs(value - typical) / range_size)
            return 0.8

        # Outside range - score decreases rapidly
        if value < min_val:
            distance = (min_val - value) / min_val if min_val > 0 else 1
            return max(0, 0.5 - distance)
        else:  # value > max_val
            distance = (value - max_val) / max_val if max_val > 0 else 1
            return max(0, 0.5 - distance)

    def _store_session(self, session: UsageSession) -> None:
        """Store a completed session for historical analysis."""
        self._recent_sessions.append(session)
        if len(self._recent_sessions) > self._max_recent_sessions:
            self._recent_sessions.pop(0)

    def confirm_device(self, session: UsageSession, device_type: DeviceType) -> None:
        """Confirm a device detection (for learning).

        This allows the detector to learn from user feedback.
        """
        self._confirmed_patterns[device_type].append(session)
        # Keep only last 20 confirmations per device
        if len(self._confirmed_patterns[device_type]) > 20:
            self._confirmed_patterns[device_type].pop(0)

    def get_device_statistics(self) -> dict[str, Any]:
        """Get statistics about detected devices."""
        stats: dict[str, Any] = {
            "total_sessions": len(self._recent_sessions),
            "device_counts": {},
        }

        for session in self._recent_sessions:
            match = self._analyze_session(session)
            if match:
                device_name = match.name
                stats["device_counts"][device_name] = (
                    stats["device_counts"].get(device_name, 0) + 1
                )

        return stats

