"""Pure battery planning logic for dynamic electricity prices.

The module deliberately has no Home Assistant imports. Keeping the optimiser
pure makes its decisions repeatable, testable and reusable by entities, the
panel and future hardware adapters.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from math import isfinite
from statistics import median
from typing import Any


@dataclass(frozen=True)
class _Hour:
    start: datetime
    end: datetime
    consumer: float
    consumer_low: float
    consumer_high: float
    feed_in: float
    feed_in_low: float
    kind: str
    confidence: float

    @property
    def duration(self) -> float:
        return max(0.25, min(2.0, (self.end - self.start).total_seconds() / 3600))


def _number(value: Any, default: float = 0.0) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    return parsed if isfinite(parsed) else default


def normalize_hourly_kw(value: Any, unit: str | None) -> float | None:
    """Normalize an hourly power or energy forecast value to average kW."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not isfinite(number):
        return None
    normalized = (unit or "").strip().lower().replace(" ", "")
    if normalized in ("w", "wh"):
        number /= 1000
    elif normalized in ("mw", "mwh"):
        number *= 1000
    elif normalized not in ("kw", "kwh", ""):
        return None
    elif not normalized and abs(number) > 100:
        # Most unlabelled forecasts use watts. This prevents a 3500 W value
        # from becoming 3500 kW while retaining common small kW values.
        number /= 1000
    return max(0.0, number)


def _timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _hours(rows: list[dict[str, Any]], now: datetime, horizon: int) -> list[_Hour]:
    result: list[_Hour] = []
    for row in rows:
        start = _timestamp(row.get("start"))
        end = _timestamp(row.get("end"))
        if start is None or end is None or end <= now:
            continue
        consumer = _number(row.get("consumer"), float("nan"))
        if not isfinite(consumer):
            continue
        feed_in = _number(row.get("feed_in"), consumer)
        effective_start = max(start, now)
        result.append(
            _Hour(
                start=effective_start,
                end=end,
                consumer=consumer,
                consumer_low=_number(row.get("consumer_low"), consumer),
                consumer_high=_number(row.get("consumer_high"), consumer),
                feed_in=feed_in,
                feed_in_low=_number(row.get("feed_in_low"), feed_in),
                kind=str(row.get("kind") or "confirmed"),
                confidence=max(0.0, min(1.0, _number(row.get("confidence"), 1.0))),
            )
        )
    result.sort(key=lambda item: item.start)
    return result[:horizon]


def _series_value(series: list[float] | None, index: int, fallback: float) -> float:
    if not series or index >= len(series):
        return fallback
    return max(0.0, _number(series[index], fallback))


def empty_plan(status: str, reason: str) -> dict[str, Any]:
    """Return a stable payload for disabled and unavailable states."""
    return {
        "status": status,
        "recommendation": "disabled" if status == "disabled" else "unavailable",
        "target_power_w": 0,
        "target_soc": None,
        "expected_savings": 0.0,
        "confidence": 0.0,
        "reason": reason,
        "uses_predicted_prices": False,
        "timeline": [],
    }


def build_battery_plan(
    forecast: list[dict[str, Any]],
    config: dict[str, Any],
    current_soc: float | None,
    *,
    solar_forecast: list[float] | None = None,
    load_forecast: list[float] | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Optimise battery power over the configured horizon.

    Positive power charges the battery and negative power discharges it. The
    dynamic program works in 2.5% SoC increments, which is accurate enough for
    hourly planning while remaining inexpensive on Home Assistant hardware.
    """
    if not config.get("enabled"):
        return empty_plan("disabled", "Battery planning is disabled")

    capacity = _number(config.get("capacity_kwh"))
    if capacity <= 0 or current_soc is None:
        return empty_plan(
            "not_ready", "Select a state-of-charge sensor and battery capacity"
        )

    current_soc = max(0.0, min(100.0, _number(current_soc)))
    reserve = max(0.0, min(100.0, _number(config.get("reserve_soc"), 15.0)))
    target = max(reserve, min(100.0, _number(config.get("target_soc"), 90.0)))
    horizon = max(6, min(48, int(_number(config.get("planning_hours"), 36))))
    moment = now or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    periods = _hours(forecast, moment, horizon)
    if len(periods) < 2:
        return empty_plan("not_ready", "No usable electricity price forecast")

    charge_kw = max(0.0, _number(config.get("charge_power"), 3000.0) / 1000)
    discharge_kw = max(
        0.0, _number(config.get("max_discharge_power"), charge_kw * 1000) / 1000
    )
    if charge_kw <= 0 and discharge_kw <= 0:
        return empty_plan("not_ready", "Configure battery charge or discharge power")

    charge_eff = max(0.5, min(1.0, _number(config.get("charge_efficiency"), 0.95)))
    discharge_eff = max(
        0.5, min(1.0, _number(config.get("discharge_efficiency"), 0.95))
    )
    cycle_cost = max(0.0, _number(config.get("cycle_cost"), 0.03))
    base_load = max(0.0, _number(config.get("assumed_load_power"), 0.0) / 1000)
    import_limit = _number(config.get("grid_import_limit"), 0.0) / 1000
    export_limit = _number(config.get("grid_export_limit"), 0.0) / 1000
    minimum_confidence = max(
        0.0, min(1.0, _number(config.get("minimum_confidence"), 0.55))
    )

    step = 2.5
    state_count = int(100 / step) + 1
    reserve_state = int((reserve + step - 0.001) // step)
    # Honest initial state: when the battery is BELOW the reserve we must not
    # pretend it is at the reserve (that hides energy that is not there). The
    # floor drops to the actual level so the plan can hold/charge its way up,
    # while discharging below the floor stays forbidden.
    initial_state = max(0, min(state_count - 1, int(round(current_soc / step))))
    floor_state = min(reserve_state, initial_state)
    floor_soc = floor_state * step
    target_state = min(state_count - 1, int(round(target / step)))
    actions = sorted(
        {
            round(-discharge_kw, 6),
            round(-discharge_kw / 2, 6),
            0.0,
            round(charge_kw / 2, 6),
            round(charge_kw, 6),
        }
    )

    typical_price = median(item.consumer for item in periods)
    terminal_value_per_kwh = max(0.0, typical_price * discharge_eff - cycle_cost / 2)
    inf = float("inf")
    costs = [inf] * state_count
    costs[initial_state] = 0.0
    parents: list[list[tuple[int, float] | None]] = []

    for index, period in enumerate(periods):
        next_costs = [inf] * state_count
        next_parents: list[tuple[int, float] | None] = [None] * state_count
        solar_kw = _series_value(solar_forecast, index, 0.0)
        load_kw = _series_value(load_forecast, index, base_load)
        for state, accumulated in enumerate(costs):
            if not isfinite(accumulated):
                continue
            soc_kwh = state * step / 100 * capacity
            for action_kw in actions:
                if action_kw >= 0:
                    delta_kwh = action_kw * period.duration * charge_eff
                else:
                    delta_kwh = action_kw * period.duration / discharge_eff
                next_kwh = soc_kwh + delta_kwh
                next_soc = next_kwh / capacity * 100
                if next_soc < floor_soc - 0.01 or next_soc > 100.01:
                    continue
                next_state = max(
                    floor_state,
                    min(state_count - 1, int(round(next_soc / step))),
                )
                grid_kw = load_kw - solar_kw + action_kw
                if import_limit > 0 and grid_kw > import_limit + 1e-6:
                    continue
                if export_limit > 0 and grid_kw < -export_limit - 1e-6:
                    continue

                predicted = period.kind == "predicted"
                buy_price = period.consumer_high if predicted else period.consumer
                sell_price = period.feed_in_low if predicted else period.feed_in
                energy_cost = (
                    max(0.0, grid_kw) * buy_price
                    - max(0.0, -grid_kw) * sell_price
                ) * period.duration
                wear = abs(action_kw) * period.duration * cycle_cost / 2
                candidate = accumulated + energy_cost + wear
                if candidate < next_costs[next_state]:
                    next_costs[next_state] = candidate
                    next_parents[next_state] = (state, action_kw)
        costs = next_costs
        parents.append(next_parents)

    best_state = min(
        range(min(reserve_state, initial_state), state_count),
        key=lambda state: costs[state]
        - state * step / 100 * capacity * terminal_value_per_kwh
        + max(0, target_state - state) * step / 100 * capacity * typical_price * 0.08,
    )
    if not isfinite(costs[best_state]):
        return empty_plan("not_ready", "No feasible plan within the configured limits")

    path: list[tuple[int, float]] = []
    state = best_state
    for index in range(len(periods) - 1, -1, -1):
        parent = parents[index][state]
        if parent is None:
            return empty_plan("not_ready", "The optimiser could not reconstruct its plan")
        previous, action = parent
        path.append((state, action))
        state = previous
    path.reverse()

    baseline_cost = 0.0
    timeline: list[dict[str, Any]] = []
    for index, (planned_state, action_kw) in enumerate(path):
        period = periods[index]
        solar_kw = _series_value(solar_forecast, index, 0.0)
        load_kw = _series_value(load_forecast, index, base_load)
        baseline_grid = load_kw - solar_kw
        baseline_cost += (
            max(0.0, baseline_grid) * period.consumer
            - max(0.0, -baseline_grid) * period.feed_in
        ) * period.duration
        timeline.append(
            {
                "start": period.start.isoformat(),
                "end": period.end.isoformat(),
                "action": (
                    "charge" if action_kw > 0.01 else "discharge" if action_kw < -0.01 else "hold"
                ),
                "power_w": int(round(action_kw * 1000)),
                "target_soc": round(planned_state * step, 1),
                "consumer_price": round(period.consumer, 6),
                "kind": period.kind,
                "confidence": round(period.confidence, 3),
            }
        )

    first = timeline[0]
    confidence = min(item.confidence for item in periods[: min(12, len(periods))])
    uses_prediction = any(item.kind == "predicted" for item in periods)
    recommendation = first["action"]
    reason = {
        "charge": "Charging now is cheaper than the expected value of stored energy",
        "discharge": "Using stored energy now avoids a higher grid price",
        "hold": "Holding the battery is currently the lowest-cost option",
    }[recommendation]
    if confidence < minimum_confidence and recommendation != "hold":
        recommendation = "hold"
        first = dict(first, action="hold", power_w=0, target_soc=round(current_soc, 1))
        timeline[0] = first
        reason = "Forecast confidence is below the configured safety threshold"

    initial_kwh = initial_state * step / 100 * capacity
    final_kwh = best_state * step / 100 * capacity
    baseline_effective_cost = baseline_cost - initial_kwh * terminal_value_per_kwh
    plan_effective_cost = costs[best_state] - final_kwh * terminal_value_per_kwh

    return {
        "status": "ready",
        "recommendation": recommendation,
        "target_power_w": first["power_w"],
        "target_soc": first["target_soc"],
        "expected_savings": round(
            max(0.0, baseline_effective_cost - plan_effective_cost), 3
        ),
        "confidence": round(confidence, 3),
        "reason": reason,
        "uses_predicted_prices": uses_prediction,
        "forecast_hours": len(periods),
        "timeline": timeline,
    }
