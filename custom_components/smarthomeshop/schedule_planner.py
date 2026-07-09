"""Deadline-aware cheapest-hours planner.

Given the day-ahead hourly prices and a schedule (hours needed, an optional
earliest start, and a "ready by" deadline), decide whether the load should run
in the current hour. The rule is the one every dynamic-tariff supplier ships:
pick the cheapest hours that still finish before the deadline, but if there is
no longer any slack, run regardless of price so the deadline is met
(deadline beats price).

This is pure and side-effect free so it can be unit-tested and called from a
binary sensor's state computation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from homeassistant.util import dt as dt_util


@dataclass
class SchedulePlan:
    active: bool = False
    next_start: str | None = None
    planned: list[str] = field(default_factory=list)
    hours_remaining: int = 0
    hours_needed: int = 0
    forced: bool = False  # running because the deadline no longer has slack
    reason: str = "idle"


def _parse(value: Any) -> datetime | None:
    dt = dt_util.parse_datetime(str(value))
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=dt_util.get_default_time_zone())
    return dt


def _resolve_deadline(now: datetime, ready_by: str | None) -> datetime | None:
    """Turn a 'HH:MM' ready-by time into the next such datetime from now."""
    if not ready_by:
        return None
    try:
        hh, mm = (int(x) for x in ready_by.split(":")[:2])
    except (ValueError, TypeError):
        return None
    target = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return target


def _resolve_earliest(now: datetime, earliest: str | None, deadline: datetime) -> datetime:
    """Earliest a slot may be used; defaults to the start of the current hour."""
    hour_start = now.replace(minute=0, second=0, microsecond=0)
    if not earliest:
        return hour_start
    try:
        hh, mm = (int(x) for x in earliest.split(":")[:2])
    except (ValueError, TypeError):
        return hour_start
    target = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
    # Pick the occurrence that falls in the [now-ish, deadline] planning window.
    if target > deadline:
        target -= timedelta(days=1)
    return max(target, hour_start) if target <= hour_start else target


def compute_plan(
    now: datetime,
    price_rows: list[dict[str, Any]],
    hours_needed: int,
    ready_by: str | None,
    earliest: str | None = None,
) -> SchedulePlan:
    """Decide whether the load should run right now.

    price_rows: hourly rows with at least {"start": iso, "consumer": float},
    typically today + tomorrow from the price coordinator.
    """
    if hours_needed <= 0:
        return SchedulePlan(hours_needed=hours_needed, reason="nothing_needed")

    deadline = _resolve_deadline(now, ready_by)
    if deadline is None:
        return SchedulePlan(hours_needed=hours_needed, reason="no_deadline")

    earliest_dt = _resolve_earliest(now, earliest, deadline)

    slots: list[tuple[datetime, float]] = []
    for row in price_rows:
        start = _parse(row.get("start"))
        price = row.get("consumer")
        if start is None or not isinstance(price, (int, float)):
            continue
        slots.append((start, float(price)))
    slots.sort(key=lambda s: s[0])

    # Usable = whole hours that are inside [earliest, deadline) and not fully
    # in the past (their hour has not completely elapsed yet).
    usable = [
        (start, price)
        for start, price in slots
        if start >= earliest_dt and start < deadline and start + timedelta(hours=1) > now
    ]

    if not usable:
        return SchedulePlan(hours_needed=hours_needed, reason="deadline_passed")

    hours_remaining = len(usable)
    forced = hours_remaining <= hours_needed
    if forced:
        chosen = {start for start, _ in usable}
    else:
        cheapest = sorted(usable, key=lambda s: s[1])[:hours_needed]
        chosen = {start for start, _ in cheapest}

    # Current hour slot: is it one we chose to run?
    current_start = now.replace(minute=0, second=0, microsecond=0)
    active = current_start in chosen

    upcoming = sorted(s for s in chosen if s + timedelta(hours=1) > now)
    next_start = upcoming[0].isoformat() if upcoming else None

    return SchedulePlan(
        active=active,
        next_start=next_start,
        planned=[s.isoformat() for s in sorted(chosen)],
        hours_remaining=hours_remaining,
        hours_needed=hours_needed,
        forced=forced and active,
        reason="deadline_forced" if (forced and active) else ("running" if active else "waiting"),
    )
