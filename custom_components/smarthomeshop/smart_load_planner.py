"""Pure quarter-hour planning helpers for Smart Loads.

The planner is deliberately independent from Home Assistant.  It combines
price, solar, household-load, battery and already-reserved load data into one
explainable plan.  Hardware execution and ownership live in
``smart_load_coordinator``.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import UTC, datetime, time, timedelta, tzinfo
from math import isfinite
from typing import Any

DEFAULT_SLOT = timedelta(minutes=15)
DEADLINE_START_GRACE = timedelta(minutes=2)
WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


def number(value: Any, default: float | None = None) -> float | None:
    """Return a finite float, otherwise ``default``."""
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    return parsed if isfinite(parsed) else default


def timestamp(value: Any, *, naive_tz: tzinfo = UTC) -> datetime | None:
    """Parse an ISO timestamp and make it timezone-aware."""
    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(str(value))
        except (TypeError, ValueError):
            return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=naive_tz)


def hhmm(value: Any) -> tuple[int, int] | None:
    """Parse a local HH:MM value."""
    try:
        hour, minute = str(value).strip().split(":", 1)
        result = int(hour), int(minute)
    except (TypeError, ValueError):
        return None
    return result if 0 <= result[0] <= 23 and 0 <= result[1] <= 59 else None


def _local(day: Any, value: tuple[int, int], zone: tzinfo) -> datetime:
    """Resolve a wall-clock value through UTC so DST gaps are normalized."""
    candidate = datetime.combine(day, time(*value), tzinfo=zone).replace(fold=0)
    return candidate.astimezone(UTC).astimezone(zone)


def resolve_deadline(config: dict[str, Any], now: datetime) -> datetime | None:
    """Return the next enabled weekday or daily ready-by deadline."""
    zone = now.tzinfo or UTC
    schedule = (
        config.get("schedule") if isinstance(config.get("schedule"), dict) else {}
    )
    fallback = hhmm(config.get("ready_by"))
    for days_ahead in range(8):
        day = (now + timedelta(days=days_ahead)).date()
        rule = schedule.get(WEEKDAYS[day.weekday()])
        if isinstance(rule, dict):
            if rule.get("enabled") is False:
                continue
            ready = hhmm(rule.get("ready_by")) or fallback
        else:
            ready = fallback
        if ready is None:
            continue
        candidate = _local(day, ready, zone)
        if candidate.astimezone(UTC) > now.astimezone(UTC):
            return candidate
    return None


def resolve_earliest(
    config: dict[str, Any], now: datetime, deadline: datetime
) -> datetime:
    """Return the start of the load's allowed planning window."""
    parsed = hhmm(config.get("earliest_start"))
    if parsed is None:
        return now
    zone = deadline.tzinfo or now.tzinfo or UTC
    candidate = _local(deadline.date(), parsed, zone)
    if candidate.astimezone(UTC) >= deadline.astimezone(UTC):
        candidate = _local(deadline.date() - timedelta(days=1), parsed, zone)
    return max(candidate.astimezone(UTC), now.astimezone(UTC)).astimezone(zone)


@dataclass(frozen=True, slots=True)
class LoadSlot:
    """One planning interval enriched with household energy context."""

    start: datetime
    end: datetime
    price: float | None
    feed_in: float
    solar_kw: float
    base_load_kw: float
    battery_target_w: float
    ev_reserved_w: float
    load_reserved_w: float
    predicted: bool
    confidence: float

    @property
    def hours(self) -> float:
        return max(
            0.0,
            (self.end.astimezone(UTC) - self.start.astimezone(UTC)).total_seconds()
            / 3600,
        )


def _row_end(row: dict[str, Any], start: datetime) -> datetime:
    end = timestamp(row.get("end"), naive_tz=start.tzinfo or UTC)
    if end is not None and end > start:
        return end
    resolution = str(row.get("resolution") or row.get("source_resolution") or "")
    return start + (
        timedelta(minutes=15) if "quarter" in resolution else timedelta(hours=1)
    )


def normalise_slots(rows: list[dict[str, Any]]) -> list[LoadSlot]:
    """Normalize arbitrary hourly/quarter-hour rows to 15-minute slots."""
    result: list[LoadSlot] = []
    for row in rows:
        start = timestamp(row.get("start"))
        price = number(row.get("consumer", row.get("price")))
        if start is None:
            continue
        end = _row_end(row, start)
        if end <= start:
            continue
        cursor = start
        while cursor < end:
            slot_end = min(end, cursor + DEFAULT_SLOT)
            result.append(
                LoadSlot(
                    start=cursor,
                    end=slot_end,
                    price=price,
                    feed_in=number(row.get("feed_in"), 0.0) or 0.0,
                    solar_kw=max(0.0, number(row.get("solar_kw"), 0.0) or 0.0),
                    base_load_kw=max(0.0, number(row.get("load_kw"), 0.0) or 0.0),
                    battery_target_w=number(row.get("battery_target_w"), 0.0) or 0.0,
                    ev_reserved_w=max(
                        0.0, number(row.get("ev_reserved_w"), 0.0) or 0.0
                    ),
                    load_reserved_w=max(
                        0.0, number(row.get("load_reserved_w"), 0.0) or 0.0
                    ),
                    predicted=bool(
                        row.get("predicted") or row.get("kind") == "predicted"
                    ),
                    confidence=max(
                        0.0, min(1.0, number(row.get("confidence"), 1.0) or 0.0)
                    ),
                )
            )
            cursor = slot_end
    unique: dict[datetime, LoadSlot] = {}
    for slot in result:
        unique[slot.start.astimezone(UTC)] = slot
    return [unique[key] for key in sorted(unique)]


def _available_solar_kw(slot: LoadSlot) -> float:
    """Return solar left after fixed demand and already reserved flexible demand."""
    reserved_kw = (
        slot.base_load_kw
        + max(0.0, slot.battery_target_w) / 1000
        + slot.ev_reserved_w / 1000
        + slot.load_reserved_w / 1000
    )
    return max(0.0, slot.solar_kw - reserved_kw)


def _effective_price(slot: LoadSlot, power_kw: float, preference: str) -> float:
    """Value solar at avoided import cost and apply small stability penalties."""
    price = slot.price if slot.price is not None else 1_000.0
    solar_share = min(1.0, _available_solar_kw(slot) / max(0.1, power_kw))
    solar_weight = (
        1.35 if preference == "solar" else 0.65 if preference == "price" else 1.0
    )
    solar_share = min(1.0, solar_share * solar_weight)
    effective = price * (1 - solar_share) + slot.feed_in * solar_share
    if slot.battery_target_w > 100:
        effective += 0.03 + min(0.12, slot.battery_target_w / 100_000)
    if slot.battery_target_w < -100:
        effective -= min(0.06, abs(slot.battery_target_w) / 100_000)
    if slot.predicted:
        effective += 0.01 + (1 - slot.confidence) * 0.03
    return effective


def _fits_capacity(slot: LoadSlot, power_w: float, limit_w: float | None) -> bool:
    if limit_w is None or limit_w <= 0:
        return True
    projected = (
        slot.base_load_kw * 1000
        + max(0.0, slot.battery_target_w)
        + slot.ev_reserved_w
        + slot.load_reserved_w
        + power_w
        - slot.solar_kw * 1000
    )
    return max(0.0, projected) <= limit_w + 1


def _segments(slots: list[LoadSlot]) -> list[dict[str, Any]]:
    """Collapse selected adjacent slots into readable execution segments."""
    if not slots:
        return []
    ordered = sorted(slots, key=lambda item: item.start.astimezone(UTC))
    groups: list[list[LoadSlot]] = [[ordered[0]]]
    for slot in ordered[1:]:
        if groups[-1][-1].end.astimezone(UTC) == slot.start.astimezone(UTC):
            groups[-1].append(slot)
        else:
            groups.append([slot])
    result: list[dict[str, Any]] = []
    for group in groups:
        priced = [item.price for item in group if item.price is not None]
        result.append(
            {
                "start": group[0].start.isoformat(),
                "end": group[-1].end.isoformat(),
                "average_price": round(sum(priced) / len(priced), 6)
                if priced
                else None,
                "predicted": any(item.predicted for item in group),
            }
        )
    return result


def _clip_slots(
    slots: list[LoadSlot], earliest: datetime, deadline: datetime
) -> list[LoadSlot]:
    """Clip every overlapping slot to the exact allowed execution window."""
    start_limit = earliest.astimezone(UTC)
    end_limit = deadline.astimezone(UTC)
    result: list[LoadSlot] = []
    for slot in slots:
        start = max(slot.start.astimezone(UTC), start_limit)
        end = min(slot.end.astimezone(UTC), end_limit)
        if end > start:
            result.append(replace(slot, start=start, end=end))
    return result


def _take_duration(slots: list[LoadSlot], duration_min: float) -> list[LoadSlot]:
    """Take an exact duration from ordered slots, trimming the final interval."""
    remaining = duration_min * 60
    selected: list[LoadSlot] = []
    for slot in slots:
        if remaining <= 0:
            break
        seconds = slot.hours * 3600
        if seconds <= 0:
            continue
        if seconds > remaining:
            selected.append(
                replace(slot, end=slot.start + timedelta(seconds=remaining))
            )
            remaining = 0
        else:
            selected.append(slot)
            remaining -= seconds
    return selected if remaining <= 0.01 else []


def _contiguous_windows(
    slots: list[LoadSlot], duration_min: float
) -> list[list[LoadSlot]]:
    """Return every exact-duration uninterrupted window in chronological order."""
    windows: list[list[LoadSlot]] = []
    ordered = sorted(slots, key=lambda item: item.start)
    for index in range(len(ordered)):
        contiguous: list[LoadSlot] = []
        for slot in ordered[index:]:
            if contiguous and contiguous[-1].end.astimezone(
                UTC
            ) != slot.start.astimezone(UTC):
                break
            contiguous.append(slot)
            taken = _take_duration(contiguous, duration_min)
            if taken:
                windows.append(taken)
                break
    return windows


def _extend_deadline_slot(
    slots: list[LoadSlot], deadline: datetime, grace_end: datetime
) -> list[LoadSlot]:
    """Extend the forecast slot ending at a deadline through polling grace."""
    deadline_utc = deadline.astimezone(UTC)
    grace_utc = grace_end.astimezone(UTC)
    if any(slot.start.astimezone(UTC) == deadline_utc for slot in slots):
        return slots
    result: list[LoadSlot] = []
    for slot in slots:
        if slot.end.astimezone(UTC) == deadline_utc:
            result.append(replace(slot, end=grace_utc))
        else:
            result.append(slot)
    return result


def build_load_plan(
    rows: list[dict[str, Any]],
    config: dict[str, Any],
    *,
    now: datetime,
    ready: bool = True,
    running: bool = False,
    learned: dict[str, Any] | None = None,
    capacity_limit_w: float | None = None,
) -> dict[str, Any]:
    """Build one deadline, price and solar-aware load plan."""
    learned = learned or {}
    mode = str(config.get("mode") or "smart")
    configured_duration = max(5.0, number(config.get("duration_min"), 60.0) or 60.0)
    learned_duration = number(learned.get("duration_min"))
    # The user's configured duration is a safety minimum. Learning may extend
    # a cycle, but a few short/noisy measurements may never make it shorter or
    # turn one stale ownership sample into an unbounded multi-day requirement.
    if learned_duration and learned_duration > 0:
        learned_duration = min(learned_duration, configured_duration * 3)
    required_duration_min = max(
        configured_duration,
        learned_duration if learned_duration and learned_duration > 0 else 0.0,
    )
    duration_min = max(
        0.25,
        min(
            required_duration_min,
            number(config.get("remaining_duration_min"), required_duration_min)
            or required_duration_min,
        ),
    )
    configured_power = max(1.0, number(config.get("power_w"), 1000.0) or 1000.0)
    learned_power = number(learned.get("power_w"))
    power_w = (
        max(configured_power, min(configured_power * 1.5, learned_power))
        if learned_power and learned_power > 0
        else configured_power
    )
    power_kw = power_w / 1000
    deadline = resolve_deadline(config, now)

    base = {
        "load_id": str(config.get("id") or ""),
        "calculated_at": now.isoformat(),
        "deadline": deadline.isoformat() if deadline else None,
        "duration_min": round(duration_min, 1),
        "required_duration_min": round(required_duration_min, 1),
        "power_w": round(power_w),
        "ready": ready,
        "running": running,
        "mode": mode,
        "segments": [],
        "selected_starts": [],
        "active": False,
        "forced": False,
        "predicted": False,
        "cost": None,
        "baseline_cost": None,
        "savings": None,
        "solar_kwh": 0.0,
    }
    if not config.get("enabled", True):
        return {**base, "status": "disabled", "reason": "Load is disabled"}
    if mode == "paused":
        return {**base, "status": "paused", "reason": "Load is paused"}
    if mode != "run_now" and not ready and not running:
        return {**base, "status": "not_ready", "reason": "The device is not ready"}
    if deadline is None and mode != "run_now":
        return {
            **base,
            "status": "not_ready",
            "reason": "No ready-by deadline is configured",
        }

    slots = normalise_slots(rows)
    deadline_grace = False
    if mode == "run_now":
        horizon = now + timedelta(minutes=duration_min)
        selected = _take_duration(_clip_slots(slots, now, horizon), duration_min)
        if not selected:
            selected = [
                LoadSlot(
                    start=now,
                    end=horizon,
                    price=None,
                    feed_in=0,
                    solar_kw=0,
                    base_load_kw=0,
                    battery_target_w=0,
                    ev_reserved_w=0,
                    load_reserved_w=0,
                    predicted=False,
                    confidence=0,
                )
            ]
        forced = True
    else:
        earliest = resolve_earliest(config, now, deadline)
        candidates = _clip_slots(slots, earliest, deadline)
        preference = str(config.get("energy_preference") or "balanced")
        safe = [
            slot
            for slot in candidates
            if _fits_capacity(slot, power_w, capacity_limit_w)
        ]
        safe_minutes = sum(slot.hours * 60 for slot in safe)
        interruptible = bool(config.get("interruptible", False))
        forced = (
            safe_minutes + 0.01 < duration_min
            if interruptible
            else not bool(_contiguous_windows(safe, duration_min))
        )
        # Capacity and household reservations are hard constraints. A deadline
        # may explain why no safe plan exists, but it must never turn an unsafe
        # forecast slot into an executable automatic plan.
        pool = safe
        if interruptible:
            selected = _take_duration(
                sorted(
                    pool,
                    key=lambda slot: (
                        _effective_price(slot, power_kw, preference),
                        slot.start,
                    ),
                ),
                duration_min,
            )
        else:
            windows = _contiguous_windows(pool, duration_min)
            selected = []
            if windows:
                selected = min(
                    windows,
                    key=lambda window: (
                        sum(
                            _effective_price(slot, power_kw, preference) * slot.hours
                            for slot in window
                        ),
                        window[0].start,
                    ),
                )

        # The coordinator polls once per minute. Without a small tolerance, a
        # plan that becomes due seconds after a poll can be rejected even though
        # it can start immediately and miss the requested deadline by only that
        # polling delay. Grace is used solely for an immediate start, never to
        # schedule a deliberately late future cycle.
        if not selected and now.astimezone(UTC) <= (
            deadline + DEADLINE_START_GRACE
        ).astimezone(UTC):
            grace_end = deadline + DEADLINE_START_GRACE
            grace_slots = _extend_deadline_slot(slots, deadline, grace_end)
            grace_candidates = _clip_slots(grace_slots, earliest, grace_end)
            grace_safe = [
                slot
                for slot in grace_candidates
                if _fits_capacity(slot, power_w, capacity_limit_w)
            ]
            grace_pool = grace_safe
            if interruptible:
                immediate = _take_duration(
                    sorted(grace_pool, key=lambda slot: slot.start), duration_min
                )
            else:
                immediate_windows = _contiguous_windows(grace_pool, duration_min)
                immediate = immediate_windows[0] if immediate_windows else []
            if immediate and immediate[0].start.astimezone(UTC) <= now.astimezone(
                UTC
            ) < immediate[0].end.astimezone(UTC):
                selected = immediate
                forced = True
                deadline_grace = True

        if not candidates and not selected:
            return {
                **base,
                "status": "no_horizon",
                "reason": "No price horizon before the deadline",
            }
        if forced and not selected:
            return {
                **base,
                "status": "capacity_blocked",
                "reason": "No safe capacity window fits before the deadline",
                "forced": False,
            }
        if not selected and not config.get("interruptible", False):
            return {
                **base,
                "status": "insufficient_horizon",
                "reason": "No uninterrupted window fits before the deadline",
            }

    if not selected:
        return {
            **base,
            "status": "insufficient_horizon",
            "reason": "Not enough time remains before the deadline",
        }

    selected = sorted(selected, key=lambda item: item.start)
    priced = [slot.price for slot in selected if slot.price is not None]
    selected_hours = sum(slot.hours for slot in selected)
    cost = sum((slot.price or 0.0) * power_kw * slot.hours for slot in selected)
    price_window = candidates if mode != "run_now" else selected
    all_prices = [slot.price for slot in price_window if slot.price is not None]
    average = sum(all_prices) / len(all_prices) if all_prices else None
    baseline = average * power_kw * selected_hours if average is not None else None
    solar_kwh = sum(
        min(power_kw, _available_solar_kw(slot)) * slot.hours for slot in selected
    )
    active = any(
        slot.start.astimezone(UTC) <= now.astimezone(UTC) < slot.end.astimezone(UTC)
        for slot in selected
    )
    next_start = next(
        (
            slot.start.isoformat()
            for slot in selected
            if slot.start.astimezone(UTC) > now.astimezone(UTC)
        ),
        None,
    )
    reason = (
        "Running now was requested"
        if mode == "run_now"
        else "Polling tolerance forced an immediate start to meet the deadline"
        if deadline_grace
        else "Deadline capacity forced the remaining window"
        if forced
        else "Selected the lowest effective price before the deadline"
    )
    return {
        **base,
        "status": "running" if active else "scheduled",
        "reason": reason,
        "active": active,
        "forced": forced,
        "deadline_grace": deadline_grace,
        "predicted": any(slot.predicted for slot in selected),
        "next_start": next_start,
        "segments": _segments(selected),
        "selected_starts": [
            slot.start.astimezone(UTC).isoformat() for slot in selected
        ],
        "average_price": round(sum(priced) / len(priced), 6) if priced else None,
        "cost": round(cost, 4) if priced else None,
        "baseline_cost": round(baseline, 4) if baseline is not None else None,
        "savings": round(baseline - cost, 4)
        if baseline is not None and priced
        else None,
        "solar_kwh": round(solar_kwh, 3),
    }


def reserve_plan(
    rows: list[dict[str, Any]], plan: dict[str, Any], power_w: float
) -> list[dict[str, Any]]:
    """Return rows with this plan added to their per-slot load reservation."""
    planned = {"load": {**plan, "power_w": power_w}}
    powers = planned_power_series(rows, planned)
    result: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        result.append(
            {
                **row,
                "load_reserved_w": (number(row.get("load_reserved_w"), 0.0) or 0.0)
                + powers[index],
            }
        )
    return result


def planned_power_series(
    rows: list[dict[str, Any]], plans: dict[str, dict[str, Any]]
) -> list[float]:
    """Map planned load power to forecast rows using interval overlap."""
    periods: list[tuple[datetime, datetime, float, str]] = []
    for load_id, plan in plans.items():
        power_w = max(0.0, number(plan.get("power_w"), 0.0) or 0.0)
        if power_w <= 0:
            continue
        for segment in plan.get("segments", []):
            start = timestamp(segment.get("start"))
            end = timestamp(segment.get("end"))
            if start is None or end is None or end <= start:
                continue
            periods.append(
                (start.astimezone(UTC), end.astimezone(UTC), power_w, str(load_id))
            )

    result: list[float] = []
    for row in rows:
        start = timestamp(row.get("start"))
        if start is None:
            result.append(0.0)
            continue
        end = _row_end(row, start)
        overlapping: dict[str, float] = {}
        for period_start, period_end, power_w, load_id in periods:
            if period_start < end.astimezone(UTC) and period_end > start.astimezone(
                UTC
            ):
                overlapping[load_id] = max(overlapping.get(load_id, 0.0), power_w)
        result.append(sum(overlapping.values()))
    return result
