"""Pure Smart EV planning helpers.

The planner deliberately has no Home Assistant dependencies.  It turns live
vehicle state plus price/solar/load rows into a stable, explainable charging
plan.  Hardware execution and safety checks live in :mod:`ev_coordinator`.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime, time, timedelta, tzinfo
from math import isfinite
from typing import Any

EPSILON = 1e-9
DEFAULT_SLOT = timedelta(minutes=15)
WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


@dataclass(frozen=True, slots=True)
class EVSlot:
    """One price interval enriched with household-energy context."""

    start: datetime
    end: datetime
    price: float | None
    feed_in: float
    solar_kw: float
    load_kw: float
    battery_target_w: float
    confidence: float
    predicted: bool

    @property
    def duration_hours(self) -> float:
        # ZoneInfo deliberately uses wall-clock arithmetic when both values
        # share the same timezone object.  Convert to UTC first so the repeated
        # and skipped DST hours retain their real elapsed duration.
        return max(
            0.0,
            (self.end.astimezone(UTC) - self.start.astimezone(UTC)).total_seconds()
            / 3600,
        )


def number(value: Any, default: float | None = None) -> float | None:
    """Return a finite float, otherwise ``default``."""
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    if not isfinite(parsed):
        return default
    return parsed


def timestamp(value: Any, *, naive_tz: tzinfo = UTC) -> datetime | None:
    """Parse an ISO timestamp and attach the supplied zone when it is naive."""
    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(str(value))
        except (TypeError, ValueError):
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=naive_tz)
    return parsed


def _hhmm(value: Any) -> tuple[int, int] | None:
    try:
        hour, minute = str(value).strip().split(":", 1)
        result = int(hour), int(minute)
    except (TypeError, ValueError):
        return None
    if not (0 <= result[0] <= 23 and 0 <= result[1] <= 59):
        return None
    return result


def _local_datetime(day: Any, hour: int, minute: int, zone: tzinfo) -> datetime:
    """Create a real local instant for a wall-clock rule.

    The first occurrence is used during the repeated autumn hour.  A time in
    the skipped spring hour is normalised forward through UTC to the first
    corresponding real local instant instead of producing an imaginary
    datetime.
    """
    candidate = datetime.combine(day, time(hour, minute), tzinfo=zone).replace(fold=0)
    return candidate.astimezone(UTC).astimezone(zone)


def _next_occurrence(now: datetime, weekday: int, value: str) -> datetime | None:
    parsed = _hhmm(value)
    if parsed is None:
        return None
    days = (weekday - now.weekday()) % 7
    candidate = _local_datetime(
        (now + timedelta(days=days)).date(),
        parsed[0],
        parsed[1],
        now.tzinfo or UTC,
    )
    if candidate.astimezone(UTC) <= now.astimezone(UTC):
        next_day = candidate.date() + timedelta(days=7)
        candidate = _local_datetime(next_day, parsed[0], parsed[1], now.tzinfo or UTC)
    return candidate


def resolve_deadline(
    config: dict[str, Any],
    now: datetime,
    *,
    calendar_deadline: datetime | None = None,
    calendar_target_soc: float | None = None,
) -> tuple[datetime | None, float, str]:
    """Resolve the earliest calendar, weekday or daily local-time deadline."""
    fallback_target = max(
        1.0, min(100.0, number(config.get("target_soc"), 80.0) or 80.0)
    )
    schedule = config.get("schedule") or {}
    fallback_time = _hhmm(config.get("ready_by"))
    candidates: list[tuple[datetime, float, str]] = []
    for days_ahead in range(8):
        day = (now + timedelta(days=days_ahead)).date()
        weekday = day.weekday()
        item = schedule.get(WEEKDAYS[weekday]) if isinstance(schedule, dict) else None
        if isinstance(item, dict) and item.get("enabled") is True:
            ready_by = _hhmm(item.get("ready_by"))
            target = max(
                1.0,
                min(
                    100.0,
                    number(item.get("target_soc"), fallback_target) or fallback_target,
                ),
            )
            source = "weekday"
        else:
            ready_by = fallback_time
            target = fallback_target
            source = "daily"
        if ready_by is None:
            continue
        candidate = _local_datetime(
            day,
            ready_by[0],
            ready_by[1],
            now.tzinfo or UTC,
        )
        if candidate.astimezone(UTC) > now.astimezone(UTC):
            candidates.append((candidate, target, source))

    if calendar_deadline is not None and calendar_deadline.astimezone(
        UTC
    ) > now.astimezone(UTC):
        candidates.append(
            (
                calendar_deadline.astimezone(now.tzinfo),
                max(1.0, min(100.0, calendar_target_soc or fallback_target)),
                "calendar",
            )
        )
    if not candidates:
        return None, fallback_target, "horizon"
    # An explicit calendar target wins when it has exactly the same deadline
    # as the recurring rule; otherwise ``min`` would silently keep the daily
    # target because it was appended first.
    return min(
        candidates,
        key=lambda item: (
            item[0].astimezone(UTC),
            0 if item[2] == "calendar" else 1,
        ),
    )


def _earliest_start(now: datetime, deadline: datetime, value: Any) -> datetime:
    parsed = _hhmm(value)
    if parsed is None:
        return now
    candidate = _local_datetime(
        deadline.date(),
        parsed[0],
        parsed[1],
        deadline.tzinfo or UTC,
    )
    if candidate.astimezone(UTC) >= deadline.astimezone(UTC):
        previous_day = deadline.date() - timedelta(days=1)
        candidate = _local_datetime(
            previous_day,
            parsed[0],
            parsed[1],
            deadline.tzinfo or UTC,
        )
    earliest_utc = max(now.astimezone(UTC), candidate.astimezone(UTC))
    return min(deadline.astimezone(UTC), earliest_utc).astimezone(
        deadline.tzinfo or UTC
    )


def charge_power_kw(config: dict[str, Any], learning: dict[str, Any] | None) -> float:
    """Return conservative real charging power for planning."""
    learning = learning or {}
    learned = number(learning.get("charge_power_kw"))
    configured = number(config.get("charge_power_kw"))
    if configured is None:
        amps = max(1.0, number(config.get("max_current_a"), 16.0) or 16.0)
        phases = max(1.0, min(3.0, number(config.get("phases"), 3.0) or 3.0))
        voltage = max(100.0, number(config.get("voltage"), 230.0) or 230.0)
        configured = amps * phases * voltage / 1000
    if learned and learned > 0:
        return max(0.1, min(configured, learned))
    return max(0.1, configured)


def _curve_hours(
    current_soc: float,
    target_soc: float,
    learning: dict[str, Any] | None,
) -> float | None:
    learning = learning or {}
    curve = learning.get("curve_pct_per_hour") or {}
    bands = ((0.0, 50.0, "0_50"), (50.0, 80.0, "50_80"), (80.0, 100.0, "80_100"))
    total = 0.0
    used = False
    for low, high, key in bands:
        overlap = max(0.0, min(target_soc, high) - max(current_soc, low))
        if overlap <= 0:
            continue
        speed = number(curve.get(key))
        if speed is None or speed <= 0:
            return None
        total += overlap / speed
        used = True
    return total if used else None


def charging_need(
    config: dict[str, Any],
    current_soc: float,
    target_soc: float,
    learning: dict[str, Any] | None = None,
) -> dict[str, float]:
    """Calculate grid energy and time required to reach the target."""
    capacity = max(1.0, number(config.get("capacity_kwh"), 60.0) or 60.0)
    efficiency = max(0.5, min(1.0, number(config.get("charge_efficiency"), 0.9) or 0.9))
    delta = max(0.0, target_soc - current_soc)
    battery_kwh = capacity * delta / 100
    grid_kwh = battery_kwh / efficiency
    power_kw = charge_power_kw(config, learning)
    hours = grid_kwh / power_kw if power_kw > 0 else 0.0
    curve_hours = _curve_hours(current_soc, target_soc, learning)
    speed = number((learning or {}).get("speed_pct_per_hour"))
    if curve_hours is not None:
        hours = max(hours * 0.65, curve_hours)
    elif speed and speed > 0:
        hours = max(hours * 0.65, delta / speed)
    return {
        "battery_kwh": round(battery_kwh, 3),
        "grid_kwh": round(grid_kwh, 3),
        "hours": max(0.0, hours),
        "power_kw": power_kw,
    }


def normalise_slots(
    rows: Iterable[dict[str, Any]],
    now: datetime,
    *,
    horizon: datetime,
) -> list[EVSlot]:
    """Normalise mixed hourly/quarter-hour price rows."""
    local_zone = now.tzinfo or UTC
    now_utc = now.astimezone(UTC)
    horizon_utc = horizon.astimezone(UTC)
    parsed: list[tuple[datetime, dict[str, Any]]] = []
    for row in rows:
        start = timestamp(row.get("start"), naive_tz=local_zone)
        if start is not None:
            parsed.append((start.astimezone(UTC), row))
    parsed.sort(key=lambda item: item[0])
    result: list[EVSlot] = []
    for index, (start, row) in enumerate(parsed):
        end = timestamp(row.get("end"), naive_tz=local_zone)
        if end is not None:
            end = end.astimezone(UTC)
        elif index + 1 < len(parsed):
            end = parsed[index + 1][0]
        else:
            resolution = str(
                row.get("resolution") or row.get("source_resolution") or ""
            )
            end = start + (
                DEFAULT_SLOT if "quarter" in resolution else timedelta(hours=1)
            )
        if end <= now_utc or start >= horizon_utc or end <= start:
            continue
        clipped_start = max(start, now_utc)
        clipped_end = min(end, horizon_utc)
        if clipped_end <= clipped_start:
            continue
        price = number(row.get("consumer"))
        if price is None:
            continue
        result.append(
            EVSlot(
                start=clipped_start,
                end=clipped_end,
                price=price,
                feed_in=number(row.get("feed_in"), 0.0) or 0.0,
                solar_kw=max(0.0, number(row.get("solar_kw"), 0.0) or 0.0),
                load_kw=max(0.0, number(row.get("load_kw"), 0.0) or 0.0),
                battery_target_w=number(row.get("battery_target_w"), 0.0) or 0.0,
                confidence=max(
                    0.0,
                    min(
                        1.0,
                        1.0
                        if number(row.get("confidence"), 1.0) is None
                        else float(number(row.get("confidence"), 1.0)),
                    ),
                ),
                predicted=str(row.get("kind") or "confirmed") == "predicted",
            )
        )
    return result


def _slot_key(slot: EVSlot) -> tuple[str, str]:
    return slot.start.isoformat(), slot.end.isoformat()


def _overlaps_reserved(slot: EVSlot, reserved: Iterable[dict[str, Any]]) -> bool:
    for item in reserved:
        start = timestamp(item.get("start"))
        end = timestamp(item.get("end"))
        if start is None or end is None:
            continue
        if slot.start.astimezone(UTC) < end.astimezone(UTC) and slot.end.astimezone(
            UTC
        ) > start.astimezone(UTC):
            return True
    return False


def _slot_metrics(
    slot: EVSlot, config: dict[str, Any], power_kw: float
) -> dict[str, float]:
    available_solar = max(
        0.0,
        slot.solar_kw - slot.load_kw - max(0.0, slot.battery_target_w / 1000),
    )
    solar_fraction = min(1.0, available_solar / max(0.1, power_kw))
    price = slot.price if slot.price is not None else 0.0
    effective = price * (1.0 - solar_fraction) + max(0.0, slot.feed_in) * solar_fraction
    preference = str(config.get("energy_preference") or "balanced")
    if preference == "solar_first":
        effective -= solar_fraction * 0.08
    elif preference == "price_first":
        effective += solar_fraction * 0.015
    if slot.predicted:
        effective += (1.0 - slot.confidence) * 0.025
    if slot.battery_target_w < -50 and not config.get(
        "allow_home_battery_support", False
    ):
        effective += min(0.30, abs(slot.battery_target_w) / 10000)
    energy = power_kw * slot.duration_hours
    return {
        "effective_price": effective,
        "solar_fraction": solar_fraction,
        "energy_kwh": energy,
        "cost": energy * effective,
    }


def _choose_contiguous(
    slots: list[EVSlot],
    required_hours: float,
    config: dict[str, Any],
    power_kw: float,
) -> list[EVSlot]:
    candidates: list[tuple[float, datetime, list[EVSlot]]] = []
    for index in range(len(slots)):
        block: list[EVSlot] = []
        hours = 0.0
        previous_end: datetime | None = None
        for slot in slots[index:]:
            if (
                previous_end is not None
                and abs(
                    (
                        slot.start.astimezone(UTC) - previous_end.astimezone(UTC)
                    ).total_seconds()
                )
                > 1
            ):
                break
            block.append(slot)
            hours += slot.duration_hours
            previous_end = slot.end
            if hours + EPSILON >= required_hours:
                score = sum(
                    _slot_metrics(item, config, power_kw)["cost"] for item in block
                )
                candidates.append((score, block[0].start, block))
                break
    if not candidates:
        return []
    return min(candidates, key=lambda item: (item[0], item[1]))[2]


def _choose_split(
    slots: list[EVSlot],
    required_hours: float,
    config: dict[str, Any],
    power_kw: float,
) -> list[EVSlot]:
    ranked = sorted(
        slots,
        key=lambda slot: (
            _slot_metrics(slot, config, power_kw)["effective_price"],
            slot.start,
        ),
    )
    selected: list[EVSlot] = []
    hours = 0.0
    for slot in ranked:
        selected.append(slot)
        hours += slot.duration_hours
        if hours + EPSILON >= required_hours:
            break
    # Keep every safe slot when the available horizon cannot fully satisfy the
    # requested energy. Returning an empty selection here made the least
    # achievable deadline receive no charge at all, even though partial charge
    # is strictly better and the slots were already filtered for reservations,
    # earliest-start rules and home-battery discharge.
    return sorted(selected, key=lambda item: item.start)


def _segment_payload(
    slot: EVSlot, config: dict[str, Any], power_kw: float
) -> dict[str, Any]:
    metrics = _slot_metrics(slot, config, power_kw)
    return {
        "start": slot.start.isoformat(),
        "end": slot.end.isoformat(),
        "price": slot.price,
        "effective_price": round(metrics["effective_price"], 5),
        "solar_fraction": round(metrics["solar_fraction"], 3),
        "predicted": slot.predicted,
        "confidence": round(slot.confidence, 3),
    }


def _segments_valid(
    segments: list[dict[str, Any]],
    slots: list[EVSlot],
    required_hours: float,
) -> bool:
    available = {_slot_key(slot): slot for slot in slots}
    by_end = {slot.end.isoformat(): slot for slot in slots}
    hours = 0.0
    for item in segments:
        start = timestamp(item.get("start"))
        end = timestamp(item.get("end"))
        if start is None or end is None:
            return False
        key = (start.isoformat(), end.isoformat())
        slot = available.get(key)
        # An active tariff slot is clipped to ``now`` during normalisation.
        # Keep a previously selected active segment stable when its original
        # start lies in the past but its end still identifies the same slot.
        if slot is None:
            candidate = by_end.get(end.isoformat())
            if candidate is not None and start <= candidate.start < end:
                slot = candidate
        if slot is None:
            return False
        hours += slot.duration_hours
    return hours + EPSILON >= required_hours


def _cost_for_segments(
    segments: list[dict[str, Any]],
    slots: list[EVSlot],
    config: dict[str, Any],
    power_kw: float,
) -> float:
    by_key = {_slot_key(slot): slot for slot in slots}
    by_end = {slot.end.isoformat(): slot for slot in slots}
    total = 0.0
    for item in segments:
        start = timestamp(item.get("start"))
        end = timestamp(item.get("end"))
        if start is None or end is None:
            continue
        slot = by_key.get((start.isoformat(), end.isoformat()))
        if slot is None:
            candidate = by_end.get(end.isoformat())
            if candidate is not None and start <= candidate.start < end:
                slot = candidate
        if slot is not None:
            total += _slot_metrics(slot, config, power_kw)["cost"]
    return total


def _fallback_segments(
    now: datetime,
    deadline: datetime,
    required_hours: float,
    margin_minutes: int,
    reserved: Iterable[dict[str, Any]] | None = None,
    earliest: datetime | None = None,
) -> list[dict[str, Any]]:
    now_utc = now.astimezone(UTC)
    deadline_utc = deadline.astimezone(UTC)
    end = max(now_utc, deadline_utc - timedelta(minutes=max(0, margin_minutes)))
    earliest_utc = earliest.astimezone(UTC) if earliest else now_utc
    start = max(now_utc, earliest_utc, end - timedelta(hours=required_hours))
    if end <= start:
        return []
    segment = {"start": start.isoformat(), "end": end.isoformat(), "fallback": True}
    probe = EVSlot(start, end, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, False)
    return [] if _overlaps_reserved(probe, reserved or []) else [segment]


def _unpriced_segments(
    start: datetime,
    end: datetime,
    required_hours: float,
    reserved: Iterable[dict[str, Any]] | None = None,
    *,
    earliest_first: bool,
    minimum: bool = False,
) -> list[dict[str, Any]]:
    """Allocate safe fallback time without crossing shared-charger reservations."""
    start_utc = start.astimezone(UTC)
    end_utc = end.astimezone(UTC)
    if end_utc <= start_utc or required_hours <= EPSILON:
        return []
    blocked: list[tuple[datetime, datetime]] = []
    for item in reserved or []:
        item_start = timestamp(item.get("start"))
        item_end = timestamp(item.get("end"))
        if item_start is None or item_end is None:
            continue
        left = max(start_utc, item_start.astimezone(UTC))
        right = min(end_utc, item_end.astimezone(UTC))
        if right > left:
            blocked.append((left, right))
    blocked.sort()
    merged: list[tuple[datetime, datetime]] = []
    for left, right in blocked:
        if merged and left <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], right))
        else:
            merged.append((left, right))
    windows: list[tuple[datetime, datetime]] = []
    cursor = start_utc
    for left, right in merged:
        if left > cursor:
            windows.append((cursor, left))
        cursor = max(cursor, right)
    if cursor < end_utc:
        windows.append((cursor, end_utc))
    if not earliest_first:
        windows.reverse()

    remaining = required_hours
    result: list[dict[str, Any]] = []
    for left, right in windows:
        available_hours = (right - left).total_seconds() / 3600
        duration = min(remaining, available_hours)
        if duration <= EPSILON:
            continue
        if earliest_first:
            segment_start = left
            segment_end = left + timedelta(hours=duration)
        else:
            segment_end = right
            segment_start = right - timedelta(hours=duration)
        result.append(
            {
                "start": segment_start.isoformat(),
                "end": segment_end.isoformat(),
                "fallback": True,
                **({"minimum": True} if minimum else {}),
            }
        )
        remaining -= duration
        if remaining <= EPSILON:
            break
    return sorted(result, key=lambda item: str(item["start"]))


def build_ev_plan(
    config: dict[str, Any],
    state: dict[str, Any],
    price_rows: list[dict[str, Any]],
    *,
    now: datetime,
    learning: dict[str, Any] | None = None,
    reserved: list[dict[str, Any]] | None = None,
    previous_plan: dict[str, Any] | None = None,
    calendar_deadline: datetime | None = None,
    calendar_target_soc: float | None = None,
) -> dict[str, Any]:
    """Build one stable, solar-aware EV charging plan."""
    now = now if now.tzinfo else now.replace(tzinfo=UTC)
    now_utc = now.astimezone(UTC)
    mode = str(config.get("mode") or "smart")
    parsed_soc = number(state.get("soc"))
    current_soc = (
        parsed_soc if parsed_soc is not None and 0.0 <= parsed_soc <= 100.0 else None
    )
    deadline, target_soc, deadline_source = resolve_deadline(
        config,
        now,
        calendar_deadline=calendar_deadline,
        calendar_target_soc=calendar_target_soc,
    )
    target_from_entity = number(state.get("target_soc"))
    if target_from_entity is not None:
        target_soc = min(target_soc, max(1.0, min(100.0, target_from_entity)))
    minimum_value = number(config.get("minimum_soc"), 20.0)
    minimum_soc = max(
        0.0, min(target_soc, 20.0 if minimum_value is None else minimum_value)
    )
    need = (
        charging_need(config, current_soc, target_soc, learning)
        if current_soc is not None
        else {
            "battery_kwh": None,
            "grid_kwh": None,
            "power_kw": charge_power_kw(config, learning),
            "hours": None,
        }
    )
    margin_value = number((learning or {}).get("margin_minutes"), 10.0)
    margin = int(max(0.0, min(90.0, 10.0 if margin_value is None else margin_value)))
    planning_horizon = now_utc + timedelta(
        hours=max(1, min(72, int(number(config.get("planning_hours"), 36) or 36)))
    )
    deadline_utc = deadline.astimezone(UTC) if deadline else None
    horizon = min(deadline_utc, planning_horizon) if deadline_utc else planning_horizon

    base = {
        "vehicle_id": config.get("id"),
        "name": config.get("name") or "Electric vehicle",
        "mode": mode,
        "soc": round(current_soc, 1) if current_soc is not None else None,
        "target_soc": round(target_soc, 1),
        "minimum_soc": round(minimum_soc, 1),
        "deadline": deadline.isoformat() if deadline else None,
        "deadline_source": deadline_source,
        "energy_needed_kwh": need["grid_kwh"],
        "battery_energy_needed_kwh": need["battery_kwh"],
        "charging_hours": round(need["hours"], 2)
        if need["hours"] is not None
        else None,
        "charge_power_kw": round(need["power_kw"], 2),
        "segments": [],
        "action": "hold",
        "status": "idle",
        "reason": "No charging is needed",
        "cost": 0.0,
        "savings": 0.0,
        "solar_kwh": 0.0,
        "uses_predicted_prices": False,
        "plan_kept": False,
        "fallback": False,
    }
    if not config.get("enabled", True):
        return {
            **base,
            "status": "disabled",
            "reason": "Smart EV is disabled for this vehicle",
        }
    if mode in {"off", "pause"}:
        return {
            **base,
            "status": mode,
            "reason": "Vehicle charging is switched off"
            if mode == "off"
            else "Vehicle charging is paused",
        }
    if state.get("home") is False:
        return {**base, "status": "away", "reason": "The vehicle is not at home"}
    if state.get("plugged") is False:
        return {
            **base,
            "status": "unplugged",
            "reason": "The charging cable is not connected",
        }
    if state.get("required_unavailable") or current_soc is None:
        return {
            **base,
            "status": "unavailable",
            "reason": "A required vehicle or charger entity is unavailable",
        }
    if current_soc + 0.05 >= target_soc or need["hours"] <= EPSILON:
        return {
            **base,
            "status": "ready",
            "reason": "The target charge level has been reached",
        }

    if mode == "charge_now":
        charge_now_slot = EVSlot(now_utc, horizon, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, False)
        if _overlaps_reserved(charge_now_slot, reserved or []):
            return {
                **base,
                "status": "shared_wait",
                "reason": "Another vehicle has priority on this shared charger",
            }
        return {
            **base,
            "status": "charging_now",
            "action": "charge",
            "segments": [
                {
                    "start": now_utc.isoformat(),
                    "end": horizon.isoformat(),
                    "manual": True,
                }
            ],
            "reason": "Charge now mode ignores the planned price window",
        }

    earliest = _earliest_start(
        now,
        (deadline or horizon.astimezone(now.tzinfo)),
        config.get("earliest_start"),
    ).astimezone(UTC)
    candidate_slots = [
        slot
        for slot in normalise_slots(price_rows, now, horizon=horizon)
        if slot.start >= earliest and not _overlaps_reserved(slot, reserved or [])
    ]
    battery_blocked_slots = [
        slot
        for slot in candidate_slots
        if slot.battery_target_w < -50
        and not config.get("allow_home_battery_support", False)
    ]
    slots = [slot for slot in candidate_slots if slot not in battery_blocked_slots]
    if not slots:
        if candidate_slots and battery_blocked_slots:
            return {
                **base,
                "status": "battery_support_disabled",
                "action": "hold",
                "segments": [],
                "reason": (
                    "No charging period is available without home-battery support"
                ),
            }
        if deadline or current_soc < minimum_soc:
            fallback_deadline = deadline or horizon
            fallback_end = max(
                now_utc,
                fallback_deadline.astimezone(UTC) - timedelta(minutes=max(0, margin)),
            )
            minimum_segments: list[dict[str, Any]] = []
            if current_soc < minimum_soc:
                minimum_need = charging_need(config, current_soc, minimum_soc, learning)
                minimum_segments = _unpriced_segments(
                    max(now_utc, earliest),
                    fallback_end,
                    minimum_need["hours"],
                    reserved,
                    earliest_first=True,
                    minimum=True,
                )
            minimum_hours = sum(
                max(
                    0.0,
                    (
                        (timestamp(item["end"]) or now_utc)
                        - (timestamp(item["start"]) or now_utc)
                    ).total_seconds()
                    / 3600,
                )
                for item in minimum_segments
            )
            remaining_hours = max(0.0, need["hours"] - minimum_hours)
            fallback_tail = _unpriced_segments(
                max(now_utc, earliest),
                fallback_end,
                remaining_hours,
                list(reserved or []) + minimum_segments,
                earliest_first=False,
            )
            fallback = sorted(
                minimum_segments + fallback_tail,
                key=lambda item: str(item["start"]),
            )
            fallback_hours = sum(
                max(
                    0.0,
                    (
                        (timestamp(item.get("end")) or now_utc)
                        - (timestamp(item.get("start")) or now_utc)
                    ).total_seconds()
                    / 3600,
                )
                for item in fallback
            )
            complete = fallback_hours + EPSILON >= need["hours"]
            active = any(
                (timestamp(item["start"]) or now_utc)
                <= now_utc
                < (timestamp(item["end"]) or now_utc)
                for item in fallback
            )
            impossible_window = (
                not fallback
                and earliest
                >= fallback_deadline.astimezone(UTC) - timedelta(minutes=max(0, margin))
            )
            return {
                **base,
                "status": (
                    "fallback"
                    if fallback and complete
                    else "insufficient_horizon"
                    if fallback
                    else "insufficient_horizon"
                    if impossible_window
                    else "waiting_for_prices"
                ),
                "action": "charge" if active else "hold",
                "segments": fallback,
                "fallback": bool(fallback),
                "reason": (
                    "Price data is unavailable; a just-in-time safety plan "
                    "protects the deadline"
                    if fallback and complete
                    else "The configured earliest start leaves too little time to reach the target"
                    if fallback
                    else "The configured earliest start leaves no usable charging window"
                    if impossible_window
                    else "Waiting for usable electricity prices"
                ),
            }
        return {
            **base,
            "status": "waiting_for_prices",
            "reason": "Waiting for usable electricity prices",
        }

    # Below the emergency minimum the earliest available slots win until that
    # minimum is protected; the remaining energy is still price optimised.
    forced: list[EVSlot] = []
    remaining_hours = need["hours"]
    if current_soc < minimum_soc:
        minimum_need = charging_need(config, current_soc, minimum_soc, learning)
        forced_hours = minimum_need["hours"]
        for slot in slots:
            forced.append(slot)
            forced_hours -= slot.duration_hours
            remaining_hours -= slot.duration_hours
            if forced_hours <= EPSILON:
                break
    available = [slot for slot in slots if slot not in forced]
    remaining_hours = max(0.0, remaining_hours)
    split = (
        _choose_split(available, remaining_hours, config, need["power_kw"])
        if remaining_hours
        else []
    )
    selected = split

    finish_together = bool(config.get("finish_in_one_go"))
    if finish_together and remaining_hours > EPSILON:
        continuous = _choose_contiguous(
            available, remaining_hours, config, need["power_kw"]
        )
        if continuous:
            split_cost = sum(
                _slot_metrics(item, config, need["power_kw"])["cost"] for item in split
            )
            continuous_cost = sum(
                _slot_metrics(item, config, need["power_kw"])["cost"]
                for item in continuous
            )
            tolerance_value = number(config.get("one_go_extra_eur"), 0.35)
            tolerance = max(0.0, 0.35 if tolerance_value is None else tolerance_value)
            if continuous_cost <= split_cost + tolerance + EPSILON:
                selected = continuous

    selected = sorted({_slot_key(item) for item in forced + selected})
    by_key = {_slot_key(slot): slot for slot in slots}
    chosen = [by_key[key] for key in selected if key in by_key]
    if sum(slot.duration_hours for slot in chosen) + EPSILON < need["hours"]:
        segments = [_segment_payload(slot, config, need["power_kw"]) for slot in chosen]
        active = any(
            (timestamp(item.get("start")) or now_utc)
            <= now_utc
            < (timestamp(item.get("end")) or now_utc)
            for item in segments
        )
        return {
            **base,
            "status": "insufficient_horizon",
            "action": "charge" if active else "hold",
            "segments": segments,
            "fallback": False,
            "reason": (
                "Not enough safe priced charging time is available before the "
                "deadline; excluded battery-discharge periods remain blocked"
            ),
        }

    segments = [_segment_payload(slot, config, need["power_kw"]) for slot in chosen]
    chosen_cost = _cost_for_segments(segments, slots, config, need["power_kw"])
    stability_value = number(config.get("plan_stability_eur"), 0.15)
    stability = max(0.0, 0.15 if stability_value is None else stability_value)
    previous_segments = (previous_plan or {}).get("segments") or []
    if (
        current_soc >= minimum_soc
        and previous_segments
        and _segments_valid(previous_segments, slots, need["hours"])
    ):
        previous_cost = _cost_for_segments(
            previous_segments, slots, config, need["power_kw"]
        )
        if previous_cost <= chosen_cost + stability + EPSILON:
            segments = previous_segments
            chosen_cost = previous_cost
            by_end = {slot.end.isoformat(): slot for slot in slots}
            chosen = []
            for item in segments:
                segment_start = timestamp(item.get("start"))
                segment_end = timestamp(item.get("end"))
                if segment_start is None or segment_end is None:
                    continue
                slot = by_key.get((segment_start.isoformat(), segment_end.isoformat()))
                if slot is None:
                    candidate = by_end.get(segment_end.isoformat())
                    if (
                        candidate is not None
                        and segment_start <= candidate.start < segment_end
                    ):
                        slot = candidate
                if slot is not None:
                    chosen.append(slot)
            base["plan_kept"] = True

    active = any(slot.start <= now_utc < slot.end for slot in chosen)
    immediate: list[EVSlot] = []
    hours = 0.0
    for slot in slots:
        immediate.append(slot)
        hours += slot.duration_hours
        if hours + EPSILON >= need["hours"]:
            break
    immediate_cost = sum(
        _slot_metrics(item, config, need["power_kw"])["cost"] for item in immediate
    )
    solar_kwh = sum(
        _slot_metrics(slot, config, need["power_kw"])["energy_kwh"]
        * _slot_metrics(slot, config, need["power_kw"])["solar_fraction"]
        for slot in chosen
    )
    return {
        **base,
        "status": "charging" if active else "scheduled",
        "action": "charge" if active else "hold",
        "segments": segments,
        "cost": round(chosen_cost, 2),
        "savings": round(max(0.0, immediate_cost - chosen_cost), 2),
        "solar_kwh": round(solar_kwh, 2),
        "uses_predicted_prices": any(slot.predicted for slot in chosen),
        "reason": (
            "Charging now in a selected low-cost energy period"
            if active
            else "Waiting for the selected price and solar periods"
        ),
    }


def plan_household(
    vehicles: list[dict[str, Any]],
    price_rows: list[dict[str, Any]],
    *,
    now: datetime,
    previous: dict[str, dict[str, Any]] | None = None,
) -> dict[str, dict[str, Any]]:
    """Plan multiple vehicles and reserve a shared charger's selected slots."""
    previous = previous or {}
    prepared: list[tuple[int, datetime, int, dict[str, Any]]] = []
    for index, item in enumerate(vehicles):
        config = item.get("config") or item
        deadline, _target, _source = resolve_deadline(
            config,
            now,
            calendar_deadline=item.get("calendar_deadline"),
            calendar_target_soc=item.get("calendar_target_soc"),
        )
        priority = 0 if str(config.get("mode") or "smart") == "charge_now" else 1
        prepared.append(
            (
                priority,
                (deadline or now + timedelta(days=30)).astimezone(UTC),
                index,
                item,
            )
        )
    prepared.sort(key=lambda item: (item[0], item[1], item[2]))

    reservations: dict[str, list[dict[str, Any]]] = {}
    result: dict[str, dict[str, Any]] = {}
    for _priority, _deadline, _index, item in prepared:
        config = item.get("config") or item
        vehicle_id = str(config.get("id") or _index)
        configured_group = str(config.get("charger_id") or "").strip()
        control_entity = str(config.get("control_entity") or "").strip()
        # A user-defined group reserves a shared electrical resource, while a
        # shared control entity always reserves the same physical charger.
        # Track both dimensions so different custom group labels can never
        # double-book one wallbox.
        reservation_keys: set[str] = set()
        if configured_group and configured_group != vehicle_id:
            reservation_keys.add(f"group:{configured_group}")
        if control_entity:
            reservation_keys.add(f"control:{control_entity}")
        if not reservation_keys:
            reservation_keys.add(f"vehicle:{configured_group or vehicle_id}")
        reserved: list[dict[str, Any]] = []
        seen_segments: set[tuple[Any, Any]] = set()
        for key in reservation_keys:
            for segment in reservations.get(key, []):
                signature = (segment.get("start"), segment.get("end"))
                if signature not in seen_segments:
                    seen_segments.add(signature)
                    reserved.append(segment)
        plan = build_ev_plan(
            config,
            item.get("state") or {},
            price_rows,
            now=now,
            learning=item.get("learning") or {},
            reserved=reserved,
            previous_plan=previous.get(vehicle_id),
            calendar_deadline=item.get("calendar_deadline"),
            calendar_target_soc=item.get("calendar_target_soc"),
        )
        result[vehicle_id] = plan
        if plan.get("status") not in {"away", "unplugged", "disabled", "off", "pause"}:
            for key in reservation_keys:
                reservations.setdefault(key, []).extend(plan.get("segments") or [])
    return result
