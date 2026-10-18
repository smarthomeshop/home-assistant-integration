"""Totals that restart every period tell Home Assistant when they restarted."""

from datetime import datetime
from types import SimpleNamespace
from zoneinfo import ZoneInfo

import pytest
from homeassistant.components.sensor import SensorStateClass
from homeassistant.util import dt as dt_util

from custom_components.smarthomeshop.products.base.p1 import P1_SENSORS
from custom_components.smarthomeshop.products.base.p1.coordinator import EnergyData, EnergyTracker
from custom_components.smarthomeshop.products.base.water.coordinator import WaterUsageData
from custom_components.smarthomeshop.products.base.water.sensors import WATER_SENSORS
from custom_components.smarthomeshop.sensor import SmartHomeShopP1Sensor, SmartHomeShopWaterSensor

AMSTERDAM = ZoneInfo("Europe/Amsterdam")
RESETTING_WATER = {
    "water_cost_today": "day",
    "today_usage": "day",
    "week_usage": "week",
    "month_usage": "month",
    "year_usage": "year",
}
RESETTING_P1 = {
    "energy_cost_today": "daily_reset",
    "energy_used_today": "daily_reset",
    "energy_cost_month": "monthly_reset",
}


@pytest.fixture(autouse=True)
def amsterdam_time_zone():
    previous = dt_util.get_default_time_zone()
    dt_util.set_default_time_zone(AMSTERDAM)
    yield
    dt_util.set_default_time_zone(previous)


def water(key: str):
    return next(item for item in WATER_SENSORS if item.key == key)


def p1(key: str):
    return next(item for item in P1_SENSORS if item.key == key)


def test_every_water_total_that_restarts_reports_its_period_start() -> None:
    totals = {item.key for item in WATER_SENSORS if item.state_class is SensorStateClass.TOTAL}

    assert totals == set(RESETTING_WATER)
    assert all(water(key).last_reset_fn is not None for key in totals)


@pytest.mark.parametrize(
    ("key", "expected"),
    [
        ("water_cost_today", datetime(2026, 10, 21, tzinfo=AMSTERDAM)),
        ("today_usage", datetime(2026, 10, 21, tzinfo=AMSTERDAM)),
        ("week_usage", datetime(2026, 10, 19, tzinfo=AMSTERDAM)),
        ("month_usage", datetime(2026, 10, 1, tzinfo=AMSTERDAM)),
        ("year_usage", datetime(2026, 1, 1, tzinfo=AMSTERDAM)),
    ],
)
def test_water_periods_reset_at_the_start_of_the_period_they_were_counted_in(key, expected) -> None:
    # Wednesday afternoon: the ISO week started on Monday 19 October.
    data = WaterUsageData(last_update=datetime(2026, 10, 21, 15, 30, tzinfo=AMSTERDAM))

    assert water(key).last_reset_fn(data) == expected


def test_the_reset_follows_the_update_that_counted_the_value_not_the_clock() -> None:
    # Counted just before midnight and read after it: still yesterday's total.
    data = WaterUsageData(last_update=datetime(2026, 10, 21, 23, 59, 50, tzinfo=AMSTERDAM))

    assert water("today_usage").last_reset_fn(data) == datetime(2026, 10, 21, tzinfo=AMSTERDAM)


def test_the_day_the_clocks_go_back_starts_at_local_midnight() -> None:
    # 25 October 2026 starts in summer time (+02:00) and ends in winter time.
    data = WaterUsageData(last_update=datetime(2026, 10, 25, 3, 30, tzinfo=AMSTERDAM))

    reset = water("today_usage").last_reset_fn(data)

    assert reset == datetime(2026, 10, 25, tzinfo=AMSTERDAM)
    assert reset.utcoffset().total_seconds() == 2 * 3600


def test_water_periods_report_no_reset_before_the_first_update() -> None:
    assert all(water(key).last_reset_fn(WaterUsageData()) is None for key in RESETTING_WATER)


def test_daily_and_monthly_p1_totals_report_the_reset_of_their_utility_meters() -> None:
    daily = datetime(2026, 10, 21, tzinfo=AMSTERDAM)
    monthly = datetime(2026, 10, 1, tzinfo=AMSTERDAM)
    data = EnergyData(daily_reset=daily, monthly_reset=monthly)

    assert {key: p1(key).last_reset_fn(data) for key in RESETTING_P1} == {
        "energy_cost_today": daily,
        "energy_used_today": daily,
        "energy_cost_month": monthly,
    }
    totals = {item.key for item in P1_SENSORS if item.state_class is SensorStateClass.TOTAL}
    assert totals == set(RESETTING_P1)


def _tracker_with_meters(states: dict[str, SimpleNamespace]) -> EnergyTracker:
    tracker = object.__new__(EnergyTracker)
    tracker.hass = SimpleNamespace(states=SimpleNamespace(get=states.get))
    tracker._meter_entity_id = lambda suffix: f"sensor.meter_{suffix}"
    return tracker


def _meter(state: str, last_reset: str | None) -> SimpleNamespace:
    attributes = {} if last_reset is None else {"last_reset": last_reset}
    return SimpleNamespace(state=state, attributes=attributes)


def test_the_cycle_reset_is_the_latest_reset_of_its_utility_meters() -> None:
    tracker = _tracker_with_meters({
        "sensor.meter_energy_daily_t1_cc": _meter("3.2", "2026-10-21T00:00:00+02:00"),
        "sensor.meter_energy_daily_t2_cc": _meter("1.1", "2026-10-20T00:00:00+02:00"),
        "sensor.meter_gas_daily_cc": _meter("0.4", "not a date"),
        "sensor.meter_energy_returned_daily_t1_cc": _meter("unavailable", "2026-10-22T00:00:00+02:00"),
    })

    assert tracker._cycle_reset("daily") == datetime(2026, 10, 21, tzinfo=AMSTERDAM)


def test_a_cycle_without_utility_meters_reports_no_reset() -> None:
    assert _tracker_with_meters({})._cycle_reset("monthly") is None


def test_the_entities_publish_the_reset_of_their_description() -> None:
    entry = SimpleNamespace(entry_id="entry")
    water_data = WaterUsageData(last_update=datetime(2026, 10, 21, 9, 0, tzinfo=AMSTERDAM))
    water_sensor = SmartHomeShopWaterSensor(SimpleNamespace(data=water_data, device_entry=None), water("week_usage"), entry)
    p1_data = EnergyData(daily_reset=datetime(2026, 10, 21, tzinfo=AMSTERDAM))
    p1_sensor = SmartHomeShopP1Sensor(
        SimpleNamespace(energy_tracker=SimpleNamespace(data=p1_data), device_entry=None), p1("energy_used_today"), entry
    )
    flow = SmartHomeShopWaterSensor(SimpleNamespace(data=water_data, device_entry=None), water("current_flow_rate"), entry)

    assert water_sensor.last_reset == datetime(2026, 10, 19, tzinfo=AMSTERDAM)
    assert p1_sensor.last_reset == datetime(2026, 10, 21, tzinfo=AMSTERDAM)
    assert flow.last_reset is None
