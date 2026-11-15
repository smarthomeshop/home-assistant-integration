"""Tests for the pure Smart Loads household planner."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from custom_components.smarthomeshop.smart_load_planner import (
    build_load_plan,
    normalise_slots,
    planned_power_series,
    reserve_plan,
    resolve_deadline,
)

NOW = datetime(2026, 11, 15, 10, 0, tzinfo=UTC)


def rows(*prices: float, solar: dict[int, float] | None = None):
    solar = solar or {}
    return [
        {
            "start": (NOW + timedelta(minutes=15 * index)).isoformat(),
            "end": (NOW + timedelta(minutes=15 * (index + 1))).isoformat(),
            "consumer": price,
            "feed_in": 0.05,
            "solar_kw": solar.get(index, 0),
            "load_kw": 0.4,
            "resolution": "quarter-hour",
        }
        for index, price in enumerate(prices)
    ]


def load(**overrides):
    return {
        "id": "dishwasher",
        "name": "Dishwasher",
        "enabled": True,
        "mode": "smart",
        "ready_by": "13:00",
        "earliest_start": "",
        "duration_min": 30,
        "power_w": 1000,
        "interruptible": False,
        "energy_preference": "balanced",
        **overrides,
    }


def test_hourly_rows_are_split_into_quarters() -> None:
    result = normalise_slots(
        [
            {
                "start": NOW.isoformat(),
                "end": (NOW + timedelta(hours=1)).isoformat(),
                "consumer": 0.2,
            }
        ]
    )
    assert len(result) == 4
    assert all(item.hours == pytest.approx(0.25) for item in result)


def test_picks_cheapest_contiguous_window() -> None:
    plan = build_load_plan(rows(0.4, 0.1, 0.09, 0.3, 0.2), load(), now=NOW)
    assert plan["status"] == "scheduled"
    assert plan["segments"][0]["start"] == (NOW + timedelta(minutes=15)).isoformat()
    assert plan["segments"][0]["end"] == (NOW + timedelta(minutes=45)).isoformat()


def test_interruptible_load_uses_separate_cheapest_slots() -> None:
    plan = build_load_plan(
        rows(0.05, 0.6, 0.04, 0.5),
        load(interruptible=True),
        now=NOW,
    )
    assert len(plan["segments"]) == 2
    assert len(plan["selected_starts"]) == 2


def test_solar_can_make_a_higher_market_price_cheaper_effectively() -> None:
    plan = build_load_plan(
        rows(0.12, 0.12, 0.16, 0.16, solar={2: 1.0, 3: 1.0}),
        load(energy_preference="solar"),
        now=NOW,
    )
    assert plan["segments"][0]["start"] == (NOW + timedelta(minutes=30)).isoformat()
    # 0.4 kW household base load consumes solar before the flexible load.
    assert plan["solar_kwh"] == pytest.approx(0.3)


def test_reserved_loads_do_not_claim_the_same_solar_twice() -> None:
    values = rows(0.2, 0.2, solar={0: 1.4, 1: 1.4})
    first = build_load_plan(values, load(id="one"), now=NOW)
    second = build_load_plan(
        reserve_plan(values, first, 1000),
        load(id="two"),
        now=NOW,
    )
    assert first["solar_kwh"] == pytest.approx(0.5)
    assert second["solar_kwh"] == pytest.approx(0.0)


def test_slots_must_fit_fully_between_earliest_start_and_deadline() -> None:
    config = load(
        earliest_start="10:10",
        ready_by="10:50",
        duration_min=15,
    )
    plan = build_load_plan(rows(0.01, 0.4, 0.2, 0.01), config, now=NOW)
    assert plan["selected_starts"] == [(NOW + timedelta(minutes=30)).isoformat()]


def test_in_progress_quarter_is_clipped_to_real_now_and_becomes_active() -> None:
    actual_now = NOW + timedelta(minutes=7, seconds=31, microseconds=400_000)
    plan = build_load_plan(
        rows(0.01, 0.5, 0.5),
        load(duration_min=15),
        now=actual_now,
    )
    assert plan["active"] is True
    assert plan["segments"][0]["start"] == actual_now.astimezone(UTC).isoformat()
    assert sum(
        (
            datetime.fromisoformat(item["end"]) - datetime.fromisoformat(item["start"])
        ).total_seconds()
        for item in plan["segments"]
    ) == pytest.approx(15 * 60)


def test_capacity_limit_avoids_reserved_slot() -> None:
    values = rows(0.01, 0.01, 0.3, 0.3)
    values[0]["ev_reserved_w"] = 1500
    values[1]["battery_target_w"] = 1500
    plan = build_load_plan(values, load(), now=NOW, capacity_limit_w=2200)
    assert plan["segments"][0]["start"] == (NOW + timedelta(minutes=30)).isoformat()


def test_deadline_never_overrides_capacity_when_no_safe_slots_remain() -> None:
    values = rows(0.1, 0.1)
    for item in values:
        item["ev_reserved_w"] = 5000
    plan = build_load_plan(values, load(), now=NOW, capacity_limit_w=2200)
    assert plan["status"] == "capacity_blocked"
    assert plan["forced"] is False
    assert plan["segments"] == []


def test_not_ready_device_is_not_planned() -> None:
    plan = build_load_plan(rows(0.1, 0.2), load(), now=NOW, ready=False)
    assert plan["status"] == "not_ready"
    assert not plan["active"]


def test_running_device_stays_plannable_when_ready_signal_drops() -> None:
    plan = build_load_plan(rows(0.1, 0.2), load(), now=NOW, ready=False, running=True)
    assert plan["status"] in {"running", "scheduled"}


def test_run_now_works_without_prices() -> None:
    plan = build_load_plan([], load(mode="run_now"), now=NOW)
    assert plan["active"] is True
    assert plan["forced"] is True


def test_paused_and_disabled_modes_never_plan() -> None:
    assert (
        build_load_plan(rows(0.1), load(mode="paused"), now=NOW)["status"] == "paused"
    )
    assert (
        build_load_plan(rows(0.1), load(enabled=False), now=NOW)["status"] == "disabled"
    )


def test_learned_duration_never_undercuts_configured_safety_minimum() -> None:
    plan = build_load_plan(
        rows(*([0.1] * 8)),
        load(duration_min=60, power_w=1000),
        now=NOW,
        learned={"duration_min": 30, "power_w": 1200},
    )
    assert plan["duration_min"] == 60
    assert plan["power_w"] == 1200
    assert len(plan["selected_starts"]) == 4


def test_longer_learned_duration_is_used_conservatively() -> None:
    plan = build_load_plan(
        rows(*([0.1] * 8)),
        load(duration_min=60, power_w=1000),
        now=NOW,
        learned={"duration_min": 90, "power_w": 1200},
    )
    assert plan["duration_min"] == 90
    assert plan["required_duration_min"] == 90


def test_learned_duration_is_bounded_against_stale_outliers() -> None:
    plan = build_load_plan(
        rows(*([0.1] * 16)),
        load(duration_min=30, ready_by="13:00"),
        now=NOW,
        learned={"duration_min": 600, "power_w": 1200},
    )

    assert plan["required_duration_min"] == 90


def test_non_interruptible_split_capacity_never_creates_an_unsafe_plan() -> None:
    split = rows(*([0.1] * 8))
    for index, row in enumerate(split):
        row["load_kw"] = 0.4 if index in {0, 1, 4, 5} else 2.0
    plan = build_load_plan(
        split,
        load(duration_min=60, ready_by="12:00", interruptible=False),
        now=NOW,
        capacity_limit_w=1800,
    )

    assert plan["status"] == "capacity_blocked"
    assert plan["forced"] is False
    assert plan["segments"] == []


@pytest.mark.parametrize("interruptible", [False, True])
def test_polling_grace_allows_immediate_start_seconds_into_final_window(
    interruptible: bool,
) -> None:
    actual_now = NOW + timedelta(minutes=30, seconds=20)
    plan = build_load_plan(
        rows(*([0.2] * 4)),
        load(
            ready_by="11:00",
            earliest_start="10:30",
            duration_min=30,
            interruptible=interruptible,
        ),
        now=actual_now,
    )

    assert plan["active"] is True
    assert plan["deadline_grace"] is True
    assert plan["forced"] is True
    assert datetime.fromisoformat(plan["segments"][-1]["end"]) == datetime(
        2026, 11, 15, 11, 0, 20, tzinfo=UTC
    )


def test_learned_power_is_bounded_against_bad_sample() -> None:
    plan = build_load_plan(
        rows(0.1, 0.1),
        load(power_w=1000),
        now=NOW,
        learned={"power_w": 20_000},
    )
    assert plan["power_w"] == 1500


def test_learned_power_never_undercuts_configured_safety_value() -> None:
    plan = build_load_plan(
        rows(0.1, 0.1),
        load(power_w=1000),
        now=NOW,
        learned={"power_w": 250},
    )
    assert plan["power_w"] == 1000


def test_cost_savings_and_predicted_flag_are_explained() -> None:
    values = rows(0.1, 0.1, 0.5, 0.5)
    values[0]["predicted"] = True
    plan = build_load_plan(values, load(), now=NOW)
    assert plan["cost"] == pytest.approx(0.05)
    assert plan["baseline_cost"] == pytest.approx(0.15)
    assert plan["savings"] == pytest.approx(0.1)
    assert plan["predicted"] is True


def test_reserve_plan_prevents_next_load_from_reusing_capacity() -> None:
    first_rows = rows(0.01, 0.01, 0.3, 0.3)
    first = build_load_plan(first_rows, load(id="one"), now=NOW)
    reserved = reserve_plan(first_rows, first, 1000)
    second = build_load_plan(
        reserved,
        load(id="two"),
        now=NOW,
        capacity_limit_w=1800,
    )
    assert second["segments"][0]["start"] == (NOW + timedelta(minutes=30)).isoformat()


def test_weekday_schedule_can_skip_disabled_day() -> None:
    config = load(
        ready_by="07:00",
        schedule={
            "sun": {"enabled": False, "ready_by": "12:00"},
            "mon": {"enabled": True, "ready_by": "08:30"},
        },
    )
    assert resolve_deadline(config, NOW) == datetime(2026, 11, 16, 8, 30, tzinfo=UTC)


def test_invalid_rows_are_ignored() -> None:
    assert normalise_slots([{"start": "bad", "consumer": 0.1}]) == []


def test_planned_power_series_maps_quarters_to_hourly_forecast() -> None:
    forecast = [
        {
            "start": NOW.isoformat(),
            "end": (NOW + timedelta(hours=1)).isoformat(),
            "resolution": "hour",
        },
        {
            "start": (NOW + timedelta(hours=1)).isoformat(),
            "end": (NOW + timedelta(hours=2)).isoformat(),
            "resolution": "hour",
        },
    ]
    plans = {
        "dishwasher": {
            "power_w": 1200,
            "segments": [
                {
                    "start": (NOW + timedelta(minutes=15)).isoformat(),
                    "end": (NOW + timedelta(minutes=45)).isoformat(),
                }
            ],
        }
    }
    assert planned_power_series(forecast, plans) == [1200, 0]


def test_planned_power_series_counts_each_load_once_per_row() -> None:
    forecast = [
        {
            "start": NOW.isoformat(),
            "end": (NOW + timedelta(hours=1)).isoformat(),
        }
    ]
    plans = {
        "pump": {
            "power_w": 500,
            "segments": [
                {
                    "start": NOW.isoformat(),
                    "end": (NOW + timedelta(minutes=15)).isoformat(),
                },
                {
                    "start": (NOW + timedelta(minutes=30)).isoformat(),
                    "end": (NOW + timedelta(minutes=45)).isoformat(),
                },
            ],
        }
    }
    assert planned_power_series(forecast, plans) == [500]


def test_spring_dst_gap_normalises_ready_by_safely() -> None:
    zone = ZoneInfo("Europe/Amsterdam")
    now = datetime(2026, 3, 29, 0, 30, tzinfo=zone)
    deadline = resolve_deadline(load(ready_by="02:30"), now)
    assert deadline is not None
    assert deadline.hour == 3
    assert deadline.minute == 30


def test_autumn_dst_overlap_uses_first_ready_by_occurrence() -> None:
    zone = ZoneInfo("Europe/Amsterdam")
    now = datetime(2026, 10, 25, 0, 30, tzinfo=zone)
    deadline = resolve_deadline(load(ready_by="02:30"), now)
    assert deadline is not None
    assert deadline.hour == 2
    assert deadline.fold == 0
