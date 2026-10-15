"""Regression checks for firmware resets, measured sessions and learned baselines."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from custom_components.smarthomeshop.products.base.water.coordinator import WaterCoordinator
from custom_components.smarthomeshop.products.base.water.leak_detection import (
    BaselineData, LeakDetectionConfig, LeakDetectionEngine,
)


def coordinator():
    obj = object.__new__(WaterCoordinator)
    obj.config_entry = SimpleNamespace(title="Water")
    obj._period_carry = dict.fromkeys(("day", "week", "month", "year"), 0.0)
    for period in obj._period_carry:
        setattr(obj, f"_{period}_start_reading", 1625.0)
    obj._night_start_reading = 1625.0
    obj._last_meter_reading = 1625.018
    obj.data = SimpleNamespace(last_update=datetime(2026, 10, 15, tzinfo=timezone.utc))
    return obj


@pytest.mark.parametrize("restored", [1625.0, 1625.010, 1624.0])
def test_usage_is_preserved_when_counter_falls_to_or_above_period_anchor(restored):
    obj = coordinator()
    obj._apply_meter_discontinuity(restored, obj.data.last_update)
    assert obj._period_usage("day", obj._day_start_reading, SimpleNamespace(meter_total=restored)) == pytest.approx(18)
    assert obj._period_usage("day", obj._day_start_reading, SimpleNamespace(meter_total=restored + .004)) == pytest.approx(22)
    assert (restored - obj._night_start_reading) * 1000 == pytest.approx(18)


def test_repeated_resets_do_not_double_count_carry():
    obj = coordinator()
    obj._apply_meter_discontinuity(1625.0, obj.data.last_update)
    obj._last_meter_reading = 1625.004
    obj._apply_meter_discontinuity(1625.0, obj.data.last_update)
    assert obj._period_usage("day", obj._day_start_reading, SimpleNamespace(meter_total=1625.0)) == pytest.approx(22)


def session_coordinator():
    obj = coordinator()
    obj._session_active = False
    obj._session_start = None
    obj._session_liters = 0.0
    obj._session_last_flow = None
    obj._session_last_meter = None
    obj._session_last_sample = None
    obj._last_session = None
    obj._recent_sessions = []
    return obj


def test_flow_tail_cannot_add_liters_to_a_seven_liter_session():
    obj = session_coordinator()
    now = datetime(2026, 10, 15, tzinfo=timezone.utc)
    for seconds, total in [(0, 1625), (30, 1625.003), (60, 1625.007), (90, 1625.007), (120, 1625.007), (180, 1625.007)]:
        obj._track_session(SimpleNamespace(meter_total=total, current_flow_rate=7.4), now + timedelta(seconds=seconds))
    assert obj.recent_sessions[0]["liters"] == 7.0


def test_session_keeps_counted_volume_through_a_reset_and_ignores_calibration_jump():
    obj = session_coordinator()
    now = datetime(2026, 10, 15, tzinfo=timezone.utc)
    for seconds, total in [(0, 1625), (30, 1625.003), (60, 1625), (90, 1625.004), (120, 1800), (240, 1800)]:
        obj._track_session(SimpleNamespace(meter_total=total, current_flow_rate=0), now + timedelta(seconds=seconds))
    assert obj.recent_sessions[0]["liters"] == 7.0


def test_single_liter_pulse_is_a_measured_session_even_at_zero_flow():
    obj = session_coordinator()
    now = datetime(2026, 10, 15, tzinfo=timezone.utc)
    for seconds, total in [(0, 1625), (30, 1625.001), (150, 1625.001)]:
        obj._track_session(SimpleNamespace(meter_total=total, current_flow_rate=0), now + timedelta(seconds=seconds))
    assert obj.recent_sessions[0]["liters"] == 1.0


def engine():
    obj = object.__new__(LeakDetectionEngine)
    obj.config = LeakDetectionConfig(min_learning_days=7)
    obj._baseline = BaselineData(learning_days=6)
    obj._today_start_reading = 1625.0
    obj._today_start_day = "2026-10-15"
    obj._today_from_midnight = True
    obj._last_meter_total = 1625.018
    obj._last_meter_time = datetime(2026, 10, 15, 12, tzinfo=timezone.utc)
    obj._hourly_readings = {0: 1625.0, 12: 1625.018}
    obj._night_start_reading = 1625.0
    return obj


def test_meter_reset_preserves_full_day_learning_and_existing_history():
    obj = engine()
    obj._update_period_tracking(1625.0, obj._last_meter_time + timedelta(seconds=30))
    assert obj._today_from_midnight is True
    assert obj._baseline.learning_days == 6
    assert (1625.0 - obj._today_start_reading) * 1000 == pytest.approx(18)
    obj._last_meter_time = datetime(2026, 10, 15, 23, 59, 30, tzinfo=timezone.utc)
    obj._update_period_tracking(1625.006, datetime(2026, 10, 16, tzinfo=timezone.utc))
    assert obj._baseline.learning_days == 7
    assert obj._baseline.is_baseline_ready is True
    assert obj._baseline.avg_daily_usage == pytest.approx(24)


def test_day_tracking_roundtrip_retains_latest_reading_and_old_storage_still_loads():
    obj = engine()
    stored = obj._day_tracking()
    restored = engine()
    restored._restore_day_tracking(stored)
    restored._apply_meter_discontinuity(1625.0, obj._last_meter_time + timedelta(seconds=30))
    assert restored._today_from_midnight is True
    assert (1625.0 - restored._today_start_reading) * 1000 == pytest.approx(18)
    restored._restore_day_tracking({"today_start_reading": 1625.0, "today_start_day": "2026-10-15", "today_from_midnight": True})
    assert restored._last_meter_total is None
    assert restored._last_meter_time is None
