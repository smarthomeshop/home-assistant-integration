"""Tests for local Smart Energy safety, tariff and learning helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from custom_components.smarthomeshop.energy_intelligence import (
    battery_segments,
    capacity_tariff_limit,
    guard_battery_power,
    learn_battery,
    learned_load_profile,
    load_series_from_profile,
    trim_samples,
)


def _sample(moment: datetime, **values):
    return {"ts": moment.isoformat(), **values}


def test_grid_guard_limits_charge_without_reversing_direction():
    result = guard_battery_power(
        3000,
        grid_power_w=4200,
        current_battery_power_w=1000,
        import_limit_w=5000,
        safety_margin_w=250,
    )
    assert result["status"] == "limited"
    assert result["allowed_power_w"] == 1550
    assert result["projected_grid_power_w"] == 4750


def test_grid_guard_limits_export_and_never_turns_discharge_into_charge():
    result = guard_battery_power(
        -4000,
        grid_power_w=-1000,
        current_battery_power_w=-1000,
        export_limit_w=2500,
        safety_margin_w=200,
    )
    assert result["status"] == "limited"
    assert result["allowed_power_w"] == -2300
    assert result["allowed_power_w"] <= 0


def test_stale_grid_only_blocks_actions_with_a_relevant_live_limit():
    blocked = guard_battery_power(
        2000, grid_power_w=None, import_limit_w=5000, data_fresh=False
    )
    unbounded = guard_battery_power(2000, grid_power_w=None, data_fresh=False)
    assert blocked["status"] == "blocked"
    assert blocked["allowed_power_w"] == 0
    assert unbounded["status"] == "unavailable"
    assert unbounded["allowed_power_w"] == 2000


def test_capacity_tariff_uses_distinct_daily_peaks_and_target_tier():
    now = datetime(2026, 11, 20, 12, tzinfo=timezone.utc)
    samples = []
    for day, powers in ((1, [2100, 3200]), (2, [1900, 4100]), (20, [1000, 2500])):
        for hour, power in enumerate(powers, start=8):
            for quarter in range(4):
                samples.append(_sample(
                    datetime(2026, 11, day, hour, quarter * 15, tzinfo=timezone.utc),
                    grid_w=power,
                ))
    result = capacity_tariff_limit(
        samples,
        {
            "capacity_tariff_enabled": True,
            "capacity_tariff_top_n": 3,
            "capacity_tariff_steps": [2, 5, 10],
            "capacity_tariff_target_kw": 5,
        },
        now=now,
    )
    assert result["status"] == "ready"
    assert result["tier_kw"] == 5
    assert result["top_kw"] == [4.1, 3.2, 2.5]
    assert result["limit_w"] == 7700


def test_capacity_tariff_never_targets_a_tier_already_exceeded():
    now = datetime(2026, 11, 20, 12, tzinfo=timezone.utc)
    samples = []
    for day, power in ((1, 11000), (2, 10000), (3, 9000)):
        for quarter in range(4):
            samples.append(
                _sample(
                    datetime(
                        2026, 11, day, 8, quarter * 15, tzinfo=timezone.utc
                    ),
                    grid_w=power,
                )
            )
    result = capacity_tariff_limit(
        samples,
        {
            "capacity_tariff_enabled": True,
            "capacity_tariff_top_n": 3,
            "capacity_tariff_steps": [2, 5, 10, 15],
            "capacity_tariff_target_kw": 5,
        },
        now=now,
    )
    assert result["current_average_kw"] == 10
    assert result["tier_kw"] == 10
    assert result["limit_w"] == 9000


def test_battery_learning_requires_repeated_complete_runs_and_stays_bounded():
    start = datetime(2026, 10, 1, tzinfo=timezone.utc)
    samples = []
    moment = start
    for run in range(3):
        base = 20 + run
        for step in range(4):
            samples.append(_sample(moment, soc=base + step * 3, battery_w=1000, grid_w=1200, solar_w=200))
            moment += timedelta(minutes=15)
        samples.append(_sample(moment, soc=base + 9, battery_w=0, grid_w=200, solar_w=0))
        moment += timedelta(minutes=15)
        for step in range(4):
            samples.append(_sample(moment, soc=base + 9 - step * 3, battery_w=-800, grid_w=-400, solar_w=400))
            moment += timedelta(minutes=15)
        samples.append(_sample(moment, soc=base, battery_w=0, grid_w=200, solar_w=0))
        moment += timedelta(minutes=15)

    assert len(battery_segments(samples)) == 6
    model = learn_battery(
        samples,
        {"capacity_kwh": 10, "charge_power": 3000, "max_discharge_power": 3000},
    )
    assert model["use"]["roundtrip_efficiency"] == 0.8
    assert 7 < model["use"]["capacity_kwh"] < 8
    # Learned observed power can only reduce, never raise, configured limits.
    assert model["use"]["charge_power_w"] == 1000
    assert model["learned"]["discharge_power_w"] == 800
    # A low observed value is reported but not treated as a proven hardware
    # maximum until it is representative enough compared with configuration.
    assert "discharge_power_w" not in model["use"]


def test_load_profile_and_forecast_mapping_need_three_matching_days():
    samples = []
    for week in range(3):
        moment = datetime(2026, 10, 5, 18, tzinfo=timezone.utc) + timedelta(days=7 * week)
        samples.append(_sample(moment, grid_w=1200, solar_w=500, battery_w=200))
    amsterdam = ZoneInfo("Europe/Amsterdam")
    profile = learned_load_profile(samples, local_timezone=amsterdam)
    assert profile == {"0:20": 1.5}
    series = load_series_from_profile(
        profile,
        [datetime(2026, 10, 26, 19, tzinfo=timezone.utc).isoformat()],
        local_timezone=amsterdam,
    )
    assert series == [1.5]


def test_trim_samples_discards_old_rows_and_keeps_a_bounded_order():
    now = datetime(2026, 11, 8, tzinfo=timezone.utc)
    rows = [
        _sample(now - timedelta(days=30), grid_w=1),
        _sample(now - timedelta(minutes=5), grid_w=2),
    ]
    result = trim_samples(rows, _sample(now, grid_w=3), now=now, maximum=2)
    assert [row["grid_w"] for row in result] == [2, 3]
