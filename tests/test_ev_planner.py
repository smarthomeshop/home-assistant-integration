"""Tests for the pure Smart EV household planner."""

from __future__ import annotations

import importlib.util
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

MODULE_PATH = (
    Path(__file__).parents[1] / "custom_components" / "smarthomeshop" / "ev_planner.py"
)
SPEC = importlib.util.spec_from_file_location("smarthomeshop_ev_planner", MODULE_PATH)
assert SPEC and SPEC.loader
PLANNER = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = PLANNER
SPEC.loader.exec_module(PLANNER)

NOW = datetime(2026, 11, 9, 12, 0, tzinfo=UTC)


def _rows(prices: list[float], *, solar: list[float] | None = None):
    return [
        {
            "start": (NOW + timedelta(hours=index)).isoformat(),
            "end": (NOW + timedelta(hours=index + 1)).isoformat(),
            "consumer": price,
            "feed_in": 0.08,
            "solar_kw": (solar or [0.0] * len(prices))[index],
            "load_kw": 0.5,
            "confidence": 1.0,
            "kind": "confirmed",
        }
        for index, price in enumerate(prices)
    ]


def _config(vehicle_id: str = "car-1", **overrides):
    result = {
        "id": vehicle_id,
        "name": "Family EV",
        "enabled": True,
        "mode": "smart",
        "capacity_kwh": 60,
        "target_soc": 80,
        "minimum_soc": 20,
        "charge_power_kw": 11,
        "charge_efficiency": 0.9,
        "ready_by": "20:00",
        "energy_preference": "balanced",
    }
    result.update(overrides)
    return result


def _state(soc: float = 50, **overrides):
    result = {"soc": soc, "plugged": True, "home": True}
    result.update(overrides)
    return result


def test_chooses_lowest_cost_periods_before_deadline() -> None:
    plan = PLANNER.build_ev_plan(
        _config(),
        _state(),
        _rows([0.50, 0.40, 0.10, 0.12, 0.60, 0.70, 0.30, 0.35]),
        now=NOW,
    )

    assert plan["status"] == "scheduled"
    assert [item["start"] for item in plan["segments"]] == [
        (NOW + timedelta(hours=2)).isoformat(),
        (NOW + timedelta(hours=3)).isoformat(),
    ]
    assert plan["savings"] > 0


def test_solar_first_can_prefer_self_consumption() -> None:
    plan = PLANNER.build_ev_plan(
        _config(energy_preference="solar_first"),
        _state(65),
        _rows([0.10, 0.14, 0.18], solar=[0.0, 0.0, 12.0]),
        now=NOW,
    )

    assert plan["segments"][0]["start"] == (NOW + timedelta(hours=2)).isoformat()
    assert plan["solar_kwh"] > 0


def test_minimum_soc_forces_early_charging() -> None:
    plan = PLANNER.build_ev_plan(
        _config(minimum_soc=30),
        _state(10),
        _rows([0.50, 0.45, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10]),
        now=NOW,
    )

    assert plan["segments"][0]["start"] == NOW.isoformat()


def test_zero_minimum_soc_is_respected() -> None:
    plan = PLANNER.build_ev_plan(
        _config(minimum_soc=0, target_soc=20),
        _state(10),
        _rows([0.90, 0.80, 0.05, 0.06, 0.70, 0.60, 0.50, 0.40]),
        now=NOW,
    )

    assert plan["segments"][0]["start"] == (NOW + timedelta(hours=2)).isoformat()


def test_daily_fallback_applies_on_days_without_a_weekday_override() -> None:
    # Monday's override passed; Tuesday uses the daily fallback instead of
    # leaving the vehicle without a deadline until the following Monday.
    deadline, target, source = PLANNER.resolve_deadline(
        _config(
            schedule={"mon": {"enabled": True, "ready_by": "11:00", "target_soc": 90}}
        ),
        NOW,
    )

    assert deadline == datetime(2026, 11, 10, 20, tzinfo=UTC)
    assert target == 80
    assert source == "daily"


def test_ready_by_uses_the_home_assistant_local_timezone() -> None:
    amsterdam = ZoneInfo("Europe/Amsterdam")
    local_now = datetime(2026, 7, 1, 6, 0, tzinfo=amsterdam)

    deadline, _target, _source = PLANNER.resolve_deadline(
        _config(ready_by="07:00"), local_now
    )

    assert deadline == datetime(2026, 7, 1, 7, 0, tzinfo=amsterdam)
    assert deadline.astimezone(UTC) == datetime(2026, 7, 1, 5, 0, tzinfo=UTC)


def test_calendar_target_wins_when_deadline_equals_daily_rule() -> None:
    deadline, target, source = PLANNER.resolve_deadline(
        _config(ready_by="20:00", target_soc=80),
        NOW,
        calendar_deadline=datetime(2026, 11, 9, 20, 0, tzinfo=UTC),
        calendar_target_soc=90,
    )

    assert deadline == datetime(2026, 11, 9, 20, 0, tzinfo=UTC)
    assert target == 90
    assert source == "calendar"


def test_price_slots_keep_real_elapsed_time_across_spring_dst() -> None:
    amsterdam = ZoneInfo("Europe/Amsterdam")
    now = datetime(2027, 3, 28, 0, 0, tzinfo=UTC).astimezone(amsterdam)
    slots = PLANNER.normalise_slots(
        [
            {
                "start": "2027-03-28T00:00:00+00:00",
                "end": "2027-03-28T01:00:00+00:00",
                "consumer": 0.2,
            }
        ],
        now,
        horizon=datetime(2027, 3, 28, 4, 0, tzinfo=UTC),
    )

    assert len(slots) == 1
    assert slots[0].duration_hours == 1


def test_both_repeated_autumn_hours_remain_available() -> None:
    amsterdam = ZoneInfo("Europe/Amsterdam")
    now = datetime(2027, 10, 31, 0, 0, tzinfo=UTC).astimezone(amsterdam)
    slots = PLANNER.normalise_slots(
        [
            {
                "start": "2027-10-31T00:00:00+00:00",
                "end": "2027-10-31T01:00:00+00:00",
                "consumer": 0.2,
            },
            {
                "start": "2027-10-31T01:00:00+00:00",
                "end": "2027-10-31T02:00:00+00:00",
                "consumer": 0.1,
            },
        ],
        now,
        horizon=datetime(2027, 10, 31, 3, 0, tzinfo=UTC),
    )

    assert len(slots) == 2
    assert sum(slot.duration_hours for slot in slots) == 2


def test_first_autumn_fold_calendar_deadline_is_past_during_second_fold() -> None:
    amsterdam = ZoneInfo("Europe/Amsterdam")
    now = datetime(2027, 10, 31, 2, 15, tzinfo=amsterdam, fold=1)
    first_fold_deadline = datetime(2027, 10, 31, 2, 30, tzinfo=amsterdam, fold=0)

    deadline, _target, source = PLANNER.resolve_deadline(
        _config(ready_by="20:00"),
        now,
        calendar_deadline=first_fold_deadline,
        calendar_target_soc=95,
    )

    assert source == "daily"
    assert deadline.astimezone(UTC) > now.astimezone(UTC)


def test_spring_gap_ready_time_normalises_to_a_real_instant() -> None:
    amsterdam = ZoneInfo("Europe/Amsterdam")
    now = datetime(2027, 3, 28, 1, 45, tzinfo=amsterdam)

    deadline, _target, _source = PLANNER.resolve_deadline(
        _config(ready_by="02:30"), now
    )

    assert deadline.hour == 3
    assert deadline.minute == 30
    assert deadline.astimezone(UTC) > now.astimezone(UTC)


def test_fallback_protects_deadline_without_prices() -> None:
    plan = PLANNER.build_ev_plan(_config(), _state(), [], now=NOW)

    assert plan["fallback"] is True
    assert plan["status"] == "fallback"
    assert (
        plan["segments"][0]["end"] < datetime(2026, 11, 9, 20, tzinfo=UTC).isoformat()
    )


def test_unpriced_fallback_protects_emergency_minimum_immediately() -> None:
    plan = PLANNER.build_ev_plan(
        _config(minimum_soc=30),
        _state(10),
        [],
        now=NOW,
    )

    assert plan["segments"][0]["start"] == NOW.isoformat()
    assert plan["segments"][0]["minimum"] is True
    assert plan["action"] == "charge"


def test_insufficient_priced_plan_never_reintroduces_battery_discharge_slots() -> None:
    rows = _rows([0.10, 0.11, 0.12, 0.13])
    rows[1]["battery_target_w"] = -2_000
    rows[3]["battery_target_w"] = -2_000

    plan = PLANNER.build_ev_plan(
        _config(capacity_kwh=100, target_soc=100),
        _state(0),
        rows,
        now=NOW,
    )

    assert plan["status"] == "insufficient_horizon"
    assert plan["fallback"] is False
    starts = {item["start"] for item in plan["segments"]}
    assert (NOW + timedelta(hours=1)).isoformat() not in starts
    assert (NOW + timedelta(hours=3)).isoformat() not in starts


def test_insufficient_priced_horizon_uses_every_safe_partial_slot() -> None:
    plan = PLANNER.build_ev_plan(
        _config(capacity_kwh=100, target_soc=100),
        _state(50),
        _rows([0.10, 0.11, 0.12, 0.13]),
        now=NOW,
    )

    assert plan["status"] == "insufficient_horizon"
    assert plan["action"] == "charge"
    assert [item["start"] for item in plan["segments"]] == [
        (NOW + timedelta(hours=index)).isoformat() for index in range(4)
    ]


def test_partial_horizon_keeps_battery_discharge_slots_excluded_above_minimum() -> None:
    rows = _rows([0.10, 0.11, 0.12, 0.13])
    rows[1]["battery_target_w"] = -2_000
    rows[3]["battery_target_w"] = -2_000

    plan = PLANNER.build_ev_plan(
        _config(capacity_kwh=100, target_soc=100),
        _state(50),
        rows,
        now=NOW,
    )

    assert plan["status"] == "insufficient_horizon"
    assert plan["action"] == "charge"
    assert [item["start"] for item in plan["segments"]] == [
        NOW.isoformat(),
        (NOW + timedelta(hours=2)).isoformat(),
    ]


def test_fallback_never_violates_earliest_start() -> None:
    plan = PLANNER.build_ev_plan(
        _config(
            earliest_start="18:00",
            ready_by="20:00",
            capacity_kwh=80,
            target_soc=100,
        ),
        _state(0),
        [],
        now=NOW,
    )

    assert plan["status"] == "insufficient_horizon"
    assert (
        plan["segments"][0]["start"]
        == datetime(2026, 11, 9, 18, tzinfo=UTC).isoformat()
    )
    assert all(
        (PLANNER.timestamp(item["start"]) or NOW).hour >= 18
        for item in plan["segments"]
    )


def test_charge_now_and_pause_modes_are_explicit() -> None:
    now_plan = PLANNER.build_ev_plan(
        _config(mode="charge_now"), _state(), _rows([0.5]), now=NOW
    )
    paused = PLANNER.build_ev_plan(
        _config(mode="pause"), _state(), _rows([0.5]), now=NOW
    )

    assert now_plan["action"] == "charge"
    assert now_plan["status"] == "charging_now"
    assert paused["action"] == "hold"
    assert paused["status"] == "pause"


def test_unplugged_vehicle_never_receives_charge_action() -> None:
    plan = PLANNER.build_ev_plan(
        _config(), _state(plugged=False), _rows([0.01] * 8), now=NOW
    )

    assert plan["status"] == "unplugged"
    assert plan["action"] == "hold"


def test_invalid_soc_remains_unknown_and_never_starts_charging() -> None:
    plan = PLANNER.build_ev_plan(
        _config(),
        _state(soc=float("nan"), required_unavailable=True),
        _rows([0.01] * 8),
        now=NOW,
    )

    assert plan["status"] == "unavailable"
    assert plan["action"] == "hold"
    assert plan["soc"] is None
    assert plan["energy_needed_kwh"] is None


def test_slots_without_a_price_are_not_selected_as_free_energy() -> None:
    rows = _rows([0.20, 0.30, 0.40])
    rows[0]["consumer"] = None
    plan = PLANNER.build_ev_plan(_config(), _state(70), rows, now=NOW)

    assert all(item["start"] != NOW.isoformat() for item in plan["segments"])


def test_previous_plan_is_kept_for_small_price_difference() -> None:
    rows = _rows([0.10, 0.11, 0.105, 0.50, 0.60, 0.70, 0.80, 0.90])
    initial = PLANNER.build_ev_plan(_config(), _state(65), rows, now=NOW)
    updated = PLANNER.build_ev_plan(
        _config(plan_stability_eur=0.50),
        _state(65),
        _rows([0.11, 0.10, 0.105, 0.50, 0.60, 0.70, 0.80, 0.90]),
        now=NOW,
        previous_plan=initial,
    )

    assert updated["segments"] == initial["segments"]
    assert updated["plan_kept"] is True


def test_zero_plan_stability_switches_to_the_strictly_cheapest_slot() -> None:
    initial = PLANNER.build_ev_plan(
        _config(target_soc=70),
        _state(65),
        _rows([0.10, 0.20, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00]),
        now=NOW,
    )
    updated = PLANNER.build_ev_plan(
        _config(target_soc=70, plan_stability_eur=0),
        _state(65),
        _rows([0.10, 0.09, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00]),
        now=NOW,
        previous_plan=initial,
    )

    assert updated["segments"][0]["start"] == (NOW + timedelta(hours=1)).isoformat()
    assert updated.get("plan_kept") is not True


def test_previous_plan_never_bypasses_emergency_minimum_soc() -> None:
    previous = PLANNER.build_ev_plan(
        _config(target_soc=70),
        _state(65),
        _rows([0.90, 0.80, 0.05, 0.06, 0.70, 0.60, 0.50, 0.40]),
        now=NOW,
    )
    updated = PLANNER.build_ev_plan(
        _config(minimum_soc=30, plan_stability_eur=10),
        _state(10),
        _rows([0.90, 0.80, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10]),
        now=NOW,
        previous_plan=previous,
    )

    assert updated["segments"][0]["start"] == NOW.isoformat()
    assert updated.get("plan_kept") is not True


def test_home_battery_discharge_slots_require_explicit_support() -> None:
    rows = _rows([0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17])
    for row in rows:
        row["battery_target_w"] = -3_000

    blocked = PLANNER.build_ev_plan(
        _config(allow_home_battery_support=False),
        _state(70),
        rows,
        now=NOW,
    )
    allowed = PLANNER.build_ev_plan(
        _config(allow_home_battery_support=True),
        _state(70),
        rows,
        now=NOW,
    )

    assert blocked["status"] == "battery_support_disabled"
    assert blocked["action"] == "hold"
    assert allowed["status"] in {"scheduled", "charging"}
    assert allowed["segments"]


def test_active_previous_segment_survives_now_clipping() -> None:
    rows = _rows([0.10, 0.11, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00])
    initial = PLANNER.build_ev_plan(_config(), _state(65), rows, now=NOW)
    updated = PLANNER.build_ev_plan(
        _config(plan_stability_eur=0.50),
        _state(65),
        rows,
        now=NOW + timedelta(minutes=5),
        previous_plan=initial,
    )

    assert updated["plan_kept"] is True
    assert updated["segments"] == initial["segments"]
    assert updated["action"] == "charge"


def test_shared_charger_does_not_double_book() -> None:
    plans = PLANNER.plan_household(
        [
            {"config": _config("first", charger_id="driveway"), "state": _state(70)},
            {"config": _config("second", charger_id="driveway"), "state": _state(70)},
        ],
        _rows([0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17]),
        now=NOW,
    )

    first = {(item["start"], item["end"]) for item in plans["first"]["segments"]}
    second = {(item["start"], item["end"]) for item in plans["second"]["segments"]}
    assert first.isdisjoint(second)


def test_same_control_entity_is_automatically_one_shared_charger() -> None:
    plans = PLANNER.plan_household(
        [
            {
                "config": _config(
                    "first", control_entity="switch.shared", charger_id="first"
                ),
                "state": _state(70),
            },
            {
                "config": _config(
                    "second", control_entity="switch.shared", charger_id="second"
                ),
                "state": _state(70),
            },
        ],
        _rows([0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17]),
        now=NOW,
    )

    first = {(item["start"], item["end"]) for item in plans["first"]["segments"]}
    second = {(item["start"], item["end"]) for item in plans["second"]["segments"]}
    assert first.isdisjoint(second)


def test_same_control_cannot_be_split_across_explicit_groups() -> None:
    plans = PLANNER.plan_household(
        [
            {
                "config": _config(
                    "first", control_entity="switch.shared", charger_id="driveway-a"
                ),
                "state": _state(70),
            },
            {
                "config": _config(
                    "second", control_entity="switch.shared", charger_id="driveway-b"
                ),
                "state": _state(70),
            },
        ],
        _rows([0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17]),
        now=NOW,
    )

    first = {(item["start"], item["end"]) for item in plans["first"]["segments"]}
    second = {(item["start"], item["end"]) for item in plans["second"]["segments"]}
    assert first.isdisjoint(second)


def test_same_control_reserves_across_explicit_and_default_groups() -> None:
    plans = PLANNER.plan_household(
        [
            {
                "config": _config(
                    "first", control_entity="switch.shared", charger_id="driveway"
                ),
                "state": _state(70),
            },
            {
                "config": _config(
                    "second", control_entity="switch.shared", charger_id="second"
                ),
                "state": _state(70),
            },
        ],
        _rows([0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17]),
        now=NOW,
    )

    first = {(item["start"], item["end"]) for item in plans["first"]["segments"]}
    second = {(item["start"], item["end"]) for item in plans["second"]["segments"]}
    assert first.isdisjoint(second)


def test_charge_now_has_priority_and_never_overlaps_shared_fallback() -> None:
    plans = PLANNER.plan_household(
        [
            {
                "config": _config(
                    "smart", control_entity="switch.shared", charger_id="smart"
                ),
                "state": _state(70),
            },
            {
                "config": _config(
                    "manual",
                    mode="charge_now",
                    control_entity="switch.shared",
                    charger_id="manual",
                ),
                "state": _state(70),
            },
        ],
        [],
        now=NOW,
    )

    assert plans["manual"]["action"] == "charge"
    assert plans["smart"]["segments"] == []


def test_learning_curve_can_extend_required_time() -> None:
    need = PLANNER.charging_need(
        _config(),
        80,
        90,
        {"curve_pct_per_hour": {"80_100": 5}},
    )

    assert need["hours"] >= 2
