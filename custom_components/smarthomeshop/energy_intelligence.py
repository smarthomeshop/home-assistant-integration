"""Pure Smart Energy safety, learning and capacity-tariff helpers.

The functions in this module deliberately avoid Home Assistant imports.  They
turn measurements into bounded advice; configured hardware limits always win.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone, tzinfo
from math import isfinite, sqrt
from statistics import median
from typing import Any

MIN_SEGMENT_SOC = 5.0
MIN_SEGMENTS = 3
MIN_ACTIVE_POWER_W = 150.0
MAX_SAMPLE_GAP_S = 20 * 60
# Forty days always covers the full current capacity-tariff month while still
# keeping the local store small (roughly 3,840 quarter-hour rows).
MAX_LEARNING_DAYS = 40


def number(value: Any, default: float | None = None) -> float | None:
    """Return one finite float without accepting booleans or NaN."""
    if isinstance(value, bool):
        return default
    try:
        result = float(value)
    except (TypeError, ValueError):
        return default
    return result if isfinite(result) else default


def timestamp(value: Any) -> datetime | None:
    """Parse one timezone-aware timestamp."""
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def trim_samples(
    samples: list[dict[str, Any]],
    sample: dict[str, Any] | None = None,
    *,
    now: datetime | None = None,
    keep_days: int = MAX_LEARNING_DAYS,
    maximum: int = 4000,
) -> list[dict[str, Any]]:
    """Append a measurement and retain a bounded, ordered learning window."""
    moment = now or datetime.now(timezone.utc)
    cutoff = moment - timedelta(days=max(1, keep_days))
    rows = [
        dict(item)
        for item in samples
        if timestamp(item.get("ts")) and timestamp(item["ts"]) >= cutoff
    ]
    if sample and timestamp(sample.get("ts")):
        rows.append(dict(sample))
    rows.sort(
        key=lambda item: timestamp(item.get("ts"))
        or datetime.min.replace(tzinfo=timezone.utc)
    )
    return rows[-maximum:]


def _direction(power_w: float | None) -> str | None:
    if power_w is None:
        return None
    if power_w >= MIN_ACTIVE_POWER_W:
        return "charge"
    if power_w <= -MIN_ACTIVE_POWER_W:
        return "discharge"
    return None


def battery_segments(samples: list[dict[str, Any]]) -> list[dict[str, float | str]]:
    """Integrate coherent charge/discharge runs into energy/SoC segments.

    ``battery_w`` follows the planner convention: positive charges and negative
    discharges.  Gaps, idle readings and direction changes close a segment.
    """
    ordered = sorted(
        (
            (
                timestamp(item.get("ts")),
                number(item.get("soc")),
                number(item.get("battery_w")),
            )
            for item in samples
        ),
        key=lambda item: item[0] or datetime.min.replace(tzinfo=timezone.utc),
    )
    result: list[dict[str, float | str]] = []
    current: dict[str, Any] | None = None
    previous: tuple[datetime, float, float] | None = None

    def finish() -> None:
        nonlocal current
        if not current:
            return
        delta_soc = abs(float(current["soc1"]) - float(current["soc0"]))
        if delta_soc >= MIN_SEGMENT_SOC and float(current["kwh"]) > 0.05:
            result.append(
                {
                    "direction": current["direction"],
                    "kwh": round(float(current["kwh"]), 6),
                    "delta_soc": round(delta_soc, 4),
                }
            )
        current = None

    for stamp, soc, power in ordered:
        if stamp is None or soc is None or power is None:
            finish()
            previous = None
            continue
        direction = _direction(power)
        if previous is not None:
            dt = (stamp - previous[0]).total_seconds()
            previous_direction = _direction(previous[2])
            if (
                dt <= 0
                or dt > MAX_SAMPLE_GAP_S
                or direction is None
                or direction != previous_direction
            ):
                finish()
            elif current is None:
                current = {
                    "direction": direction,
                    "soc0": previous[1],
                    "soc1": soc,
                    "kwh": 0.0,
                }
            if current is not None:
                average_power = (abs(previous[2]) + abs(power)) / 2
                current["kwh"] += average_power * dt / 3_600_000
                current["soc1"] = soc
        previous = (stamp, soc, power)
    finish()
    return result


def _percentile(values: list[float], percentile: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = round((len(ordered) - 1) * max(0.0, min(1.0, percentile)))
    return ordered[index]


def learned_load_profile(
    samples: list[dict[str, Any]],
    min_days: int = 3,
    *,
    local_timezone: tzinfo | None = None,
) -> dict[str, float]:
    """Median house load per local weekday/hour after enough distinct days."""
    per_hour: dict[tuple[str, int, int], list[float]] = defaultdict(list)
    for item in samples:
        stamp = timestamp(item.get("ts"))
        grid = number(item.get("grid_w"))
        solar = number(item.get("solar_w"), 0.0)
        # Stored battery power is +charge/-discharge.  House load equals grid
        # import + solar generation - the battery's grid effect.
        battery = number(item.get("battery_w"), 0.0)
        if stamp is None or grid is None:
            continue
        load = max(0.0, grid + (solar or 0.0) - (battery or 0.0)) / 1000
        local = stamp.astimezone(local_timezone)
        per_hour[(local.date().isoformat(), local.weekday(), local.hour)].append(load)

    by_slot: dict[tuple[int, int], list[float]] = defaultdict(list)
    for (_day, weekday, hour), values in per_hour.items():
        by_slot[(weekday, hour)].append(sum(values) / len(values))
    return {
        f"{weekday}:{hour}": round(median(values), 3)
        for (weekday, hour), values in by_slot.items()
        if len(values) >= min_days
    }


def learn_battery(
    samples: list[dict[str, Any]],
    configured: dict[str, Any],
    *,
    local_timezone: tzinfo | None = None,
) -> dict[str, Any]:
    """Learn bounded battery characteristics without overriding hard limits."""
    segments = battery_segments(samples)
    charge = [item for item in segments if item["direction"] == "charge"]
    discharge = [item for item in segments if item["direction"] == "discharge"]
    learned: dict[str, Any] = {
        "samples": len(samples),
        "charge_segments": len(charge),
        "discharge_segments": len(discharge),
    }
    usable: dict[str, Any] = {}

    if len(charge) >= MIN_SEGMENTS and len(discharge) >= MIN_SEGMENTS:
        charge_kwh_per_pct = median(
            float(item["kwh"]) / float(item["delta_soc"]) for item in charge
        )
        discharge_kwh_per_pct = median(
            float(item["kwh"]) / float(item["delta_soc"]) for item in discharge
        )
        roundtrip = discharge_kwh_per_pct / charge_kwh_per_pct
        capacity = 100 * sqrt(charge_kwh_per_pct * discharge_kwh_per_pct)
        learned.update(
            roundtrip_efficiency=round(roundtrip, 3),
            capacity_kwh=round(capacity, 2),
        )

        configured_capacity = number(configured.get("capacity_kwh"))
        if 0.70 <= roundtrip <= 0.98:
            usable["roundtrip_efficiency"] = round(roundtrip, 3)
        if (
            configured_capacity
            and configured_capacity * 0.5 <= capacity <= configured_capacity * 1.3
        ):
            usable["capacity_kwh"] = round(capacity, 2)

    charge_power = [
        float(value)
        for item in samples
        if (value := number(item.get("battery_w")))
        and value > MIN_ACTIVE_POWER_W
    ]
    discharge_power = [
        abs(float(value))
        for item in samples
        if (value := number(item.get("battery_w")))
        and value < -MIN_ACTIVE_POWER_W
    ]
    configured_charge = number(configured.get("charge_power"), 0.0) or 0.0
    configured_discharge = number(configured.get("max_discharge_power"), 0.0) or 0.0
    if len(charge_power) >= 12:
        value = _percentile(charge_power, 0.95)
        if value is not None:
            learned["charge_power_w"] = round(value)
            if (
                configured_charge
                and configured_charge * 0.3 <= value <= configured_charge * 1.5
            ):
                usable["charge_power_w"] = min(round(value), round(configured_charge))
    if len(discharge_power) >= 12:
        value = _percentile(discharge_power, 0.95)
        if value is not None:
            learned["discharge_power_w"] = round(value)
            if (
                configured_discharge
                and configured_discharge * 0.3
                <= value
                <= configured_discharge * 1.5
            ):
                usable["discharge_power_w"] = min(round(value), round(configured_discharge))

    profile = learned_load_profile(samples, local_timezone=local_timezone)
    learned["load_profile_slots"] = len(profile)
    if len(profile) >= 24:
        usable["load_profile"] = profile

    return {"learned": learned, "use": usable}


def load_series_from_profile(
    profile: dict[str, Any],
    starts: list[str],
    *,
    local_timezone: tzinfo | None = None,
) -> list[float] | None:
    """Map a learned weekday/hour profile to planner periods."""
    if not profile:
        return None
    result: list[float] = []
    found = 0
    for raw in starts:
        stamp = timestamp(raw)
        if stamp is None:
            result.append(0.0)
            continue
        local = stamp.astimezone(local_timezone)
        value = number(profile.get(f"{local.weekday()}:{local.hour}"))
        if value is None:
            result.append(0.0)
        else:
            result.append(max(0.0, value))
            found += 1
    return result if found >= max(1, len(result) // 2) else None


def hourly_import_peaks(
    samples: list[dict[str, Any]], *, local_timezone: tzinfo | None = None
) -> list[tuple[str, float]]:
    """Return hourly average import kW, identified by local day."""
    buckets: dict[tuple[str, int], list[float]] = defaultdict(list)
    for item in samples:
        stamp = timestamp(item.get("ts"))
        grid = number(item.get("grid_w"))
        if stamp is None or grid is None:
            continue
        local = stamp.astimezone(local_timezone)
        buckets[(local.date().isoformat(), local.hour)].append(max(0.0, grid) / 1000)
    return [
        (day, sum(values) / len(values))
        for (day, _hour), values in buckets.items()
        if values
    ]


def capacity_tariff_limit(
    samples: list[dict[str, Any]],
    config: dict[str, Any],
    *,
    now: datetime | None = None,
    local_timezone: tzinfo | None = None,
) -> dict[str, Any]:
    """Calculate the import ceiling that avoids the configured next tier."""
    if not config.get("capacity_tariff_enabled"):
        return {"enabled": False, "limit_w": None}
    steps = sorted(
        {
            float(item)
            for item in (config.get("capacity_tariff_steps") or [])
            if number(item) and float(item) > 0
        }
    )
    target_kw = number(config.get("capacity_tariff_target_kw"))
    if not steps and not target_kw:
        return {"enabled": True, "status": "not_configured", "limit_w": None}
    top_n = max(1, min(5, int(number(config.get("capacity_tariff_top_n"), 3) or 3)))
    moment = (now or datetime.now(timezone.utc)).astimezone(local_timezone)
    month = moment.strftime("%Y-%m")
    peaks = [
        (day, kw)
        for day, kw in hourly_import_peaks(samples, local_timezone=local_timezone)
        if day.startswith(month)
    ]
    per_day: dict[str, float] = {}
    for day, kw in peaks:
        per_day[day] = max(per_day.get(day, 0.0), kw)
    top = sorted(per_day.items(), key=lambda item: item[1], reverse=True)[:top_n]
    padded = [item[1] for item in top] + [0.0] * max(0, top_n - len(top))
    current_average = sum(padded[:top_n]) / top_n
    current_tier = next(
        (step for step in steps if current_average <= step),
        max(steps[-1], current_average) if steps else current_average,
    )
    if target_kw is None:
        tier = current_tier
    elif steps:
        requested_tier = next(
            (step for step in steps if step >= target_kw),
            max(steps[-1], target_kw),
        )
        # Once the measured monthly average already sits in a higher tier,
        # targeting a lower historical tier would create an impossible limit.
        # Protect the current tier instead and avoid needlessly blocking the
        # house or battery for the rest of the month.
        tier = max(current_tier, requested_tier)
    else:
        tier = max(current_tier, target_kw)

    today = moment.date().isoformat()
    other_days = sorted(
        (kw for day, kw in top if day != today), reverse=True
    )[: max(0, top_n - 1)]
    today_peak = per_day.get(today, 0.0)
    remaining = max(0.0, float(tier) * top_n - sum(other_days))
    limit_kw = max(today_peak, remaining)
    return {
        "enabled": True,
        "status": "ready" if peaks else "learning",
        "limit_w": round(limit_kw * 1000),
        "tier_kw": round(float(tier), 3),
        "current_average_kw": round(current_average, 3),
        "top_kw": [round(value, 3) for value in padded[:top_n]],
        "days": len(per_day),
    }


def guard_battery_power(
    requested_power_w: float,
    *,
    grid_power_w: float | None,
    current_battery_power_w: float | None = None,
    import_limit_w: float | None = None,
    export_limit_w: float | None = None,
    capacity_limit_w: float | None = None,
    safety_margin_w: float = 0.0,
    data_fresh: bool = True,
) -> dict[str, Any]:
    """Bound one battery target against fresh, measured grid headroom.

    Positive battery power charges; negative power discharges. Grid power is
    positive import. The current battery target is removed from the measured
    grid value before the requested target is projected.
    """
    requested = float(number(requested_power_w, 0.0) or 0.0)
    current = float(number(current_battery_power_w, 0.0) or 0.0)
    limits = [
        value
        for value in (number(import_limit_w), number(capacity_limit_w))
        if value and value > 0
    ]
    import_limit = min(limits) if limits else None
    export_limit = number(export_limit_w)
    margin = max(0.0, float(number(safety_margin_w, 0.0) or 0.0))

    if grid_power_w is None or not data_fresh:
        relevant_limit = (
            (requested > 0 and import_limit is not None)
            or (requested < 0 and export_limit is not None and export_limit > 0)
        )
        if relevant_limit:
            return {
                "status": "blocked",
                "reason": (
                    "Grid measurement is unavailable or stale; the limited "
                    "battery action is held safely"
                ),
                "requested_power_w": round(requested),
                "allowed_power_w": 0,
                "grid_power_w": grid_power_w,
                "data_fresh": False,
            }
        return {
            "status": "unavailable",
            "reason": (
                "Grid measurement is unavailable; no active grid limit applies "
                "to this action"
            ),
            "requested_power_w": round(requested),
            "allowed_power_w": round(requested),
            "grid_power_w": grid_power_w,
            "data_fresh": False,
        }

    grid = float(grid_power_w)
    base_grid = grid - current
    allowed = requested
    reasons: list[str] = []
    if import_limit is not None:
        working_limit = max(0.0, import_limit - margin)
        allowed = min(allowed, working_limit - base_grid)
        if allowed < requested - 1:
            reasons.append("Grid import headroom limited the battery target")
    if export_limit and export_limit > 0:
        working_export = max(0.0, export_limit - margin)
        allowed = max(allowed, -working_export - base_grid)
        if allowed > requested + 1:
            reasons.append("Grid export headroom limited the battery target")
    # A guard may reduce power or hold, but must never reverse the planner's
    # action by turning a charge request into forced discharge (or vice versa).
    if requested > 0:
        allowed = max(0.0, allowed)
    elif requested < 0:
        allowed = min(0.0, allowed)
    else:
        allowed = 0.0
    projected = base_grid + allowed
    status = "safe"
    if abs(allowed) < 1 and abs(requested) >= 1:
        status = "blocked"
    elif abs(allowed - requested) >= 1:
        status = "limited"
    return {
        "status": status,
        "reason": (
            "; ".join(reasons)
            if reasons
            else "Battery target fits inside the live grid limits"
        ),
        "requested_power_w": round(requested),
        "allowed_power_w": round(allowed),
        "grid_power_w": round(grid),
        "projected_grid_power_w": round(projected),
        "import_limit_w": round(import_limit) if import_limit is not None else None,
        "export_limit_w": round(export_limit) if export_limit else None,
        "safety_margin_w": round(margin),
        "data_fresh": True,
    }


def describe_learning(model: dict[str, Any]) -> str:
    """Human-readable, stable summary for UI and journal payloads."""
    learned = model.get("learned") or {}
    usable = model.get("use") or {}
    parts: list[str] = []
    if "roundtrip_efficiency" in usable:
        parts.append(f"round-trip efficiency {usable['roundtrip_efficiency'] * 100:.0f}%")
    if "capacity_kwh" in usable:
        parts.append(f"usable capacity {usable['capacity_kwh']:.1f} kWh")
    if "charge_power_w" in usable:
        parts.append(f"charge power {usable['charge_power_w']:.0f} W")
    if "discharge_power_w" in usable:
        parts.append(f"discharge power {usable['discharge_power_w']:.0f} W")
    if usable.get("load_profile"):
        parts.append("a learned hourly house-load profile")
    if parts:
        return "Using learned " + ", ".join(parts) + "."
    needed = max(
        0,
        MIN_SEGMENTS
        - min(
            int(learned.get("charge_segments", 0)),
            int(learned.get("discharge_segments", 0)),
        ),
    )
    if needed:
        return (
            f"Learning safely; at least {needed} more complete charge and "
            "discharge runs are needed."
        )
    return "Learning safely; more representative measurements are needed."
