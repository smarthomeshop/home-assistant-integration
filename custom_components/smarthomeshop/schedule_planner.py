"""Deadline-aware cheapest-hours planner.

Given the day-ahead hourly prices and a schedule (hours needed, an optional
earliest start, and a "ready by" deadline), decide whether the load should run
in the current hour. The rule is the one every dynamic-tariff supplier ships:
pick the cheapest hours that still finish before the deadline, but if there is
no longer any slack, run regardless of price so the deadline is met
(deadline beats price) — provided we actually have prices covering the
deadline; if tomorrow's prices are not published yet we wait rather than force
the load on at today's peak.

This is pure and side-effect free so it can be unit-tested and called from a
binary sensor's state computation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from homeassistant.util import dt as dt_util

HOUR = timedelta(hours=1)


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
    hm = _parse_hhmm(ready_by)
    if hm is None:
        return None
    target = now.replace(hour=hm[0], minute=hm[1], second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return target


def _resolve_earliest(now: datetime, earliest: str | None, deadline: datetime) -> datetime:
    """Earliest a slot may be used; defaults to the start of the current hour.

    Picks the 'HH:MM' occurrence that falls inside the planning window
    [start of current hour, deadline], rolling a day forward or backward as
    needed so an overnight "not before" time is honoured.
    """
    hour_start = now.replace(minute=0, second=0, microsecond=0)
    hm = _parse_hhmm(earliest)
    if hm is None:
        return hour_start
    target = now.replace(hour=hm[0], minute=hm[1], second=0, microsecond=0)
    # Roll onto the day that places the occurrence in [hour_start, deadline).
    if target < hour_start:
        nxt = target + timedelta(days=1)
        if nxt < deadline:
            target = nxt
    elif target > deadline:
        target -= timedelta(days=1)
    return max(target, hour_start)


def _parse_hhmm(value: str | None) -> tuple[int, int] | None:
    if not value:
        return None
    try:
        parts = str(value).split(":")
        hh, mm = int(parts[0]), int(parts[1])
    except (ValueError, IndexError, TypeError):
        return None
    if not (0 <= hh <= 23 and 0 <= mm <= 59):
        return None
    return hh, mm


def compute_plan(
    now: datetime,
    price_rows: list[dict[str, Any]],
    hours_needed: int,
    ready_by: str | None,
    earliest: str | None = None,
    interruptible: bool = True,
    hours_done: float = 0.0,
) -> SchedulePlan:
    """Decide whether the load should run right now.

    price_rows: hourly rows with at least {"start": iso, "consumer": float},
    typically today + tomorrow from the price coordinator.
    interruptible: if False, choose the cheapest CONTIGUOUS block (for loads
    like a dishwasher that cannot pause); if True, the cheapest hours overall.
    hours_done: hours the load already ran in the current deadline cycle, so a
    finished load is not forced on again as the deadline approaches.
    """
    if hours_needed <= 0:
        return SchedulePlan(hours_needed=hours_needed, reason="nothing_needed")

    deadline = _resolve_deadline(now, ready_by)
    if deadline is None:
        return SchedulePlan(hours_needed=hours_needed, reason="no_deadline")

    # Subtract what already ran this cycle; done means done until the next
    # deadline rolls the cycle over.
    remaining_needed = hours_needed - int(hours_done)
    if remaining_needed <= 0:
        return SchedulePlan(
            hours_needed=hours_needed,
            reason="done",
        )
    hours_needed = remaining_needed

    earliest_dt = _resolve_earliest(now, earliest, deadline)

    slots: list[tuple[datetime, float]] = []
    for row in price_rows:
        start = _parse(row.get("start"))
        price = row.get("consumer")
        if start is None or not isinstance(price, (int, float)):
            continue
        slots.append((start, float(price)))
    slots.sort(key=lambda s: s[0])

    # Usable = whole hours that finish before the deadline, are at/after the
    # earliest, and are not already fully in the past.
    usable = [
        (start, price)
        for start, price in slots
        if start >= earliest_dt and start + HOUR <= deadline and start + HOUR > now
    ]

    if not usable:
        return SchedulePlan(hours_needed=hours_needed, reason="deadline_passed")

    # Only trust the "no slack left → force on" failsafe when we actually have
    # prices covering the deadline. Otherwise (tomorrow not published yet) wait.
    last_start = slots[-1][0]
    horizon_covers_deadline = last_start + HOUR >= deadline

    hours_remaining = len(usable)
    forced = hours_remaining <= hours_needed and horizon_covers_deadline
    if forced:
        chosen = {start for start, _ in usable}
    elif interruptible:
        cheapest = sorted(usable, key=lambda s: s[1])[:hours_needed]
        chosen = {start for start, _ in cheapest}
    else:
        chosen = _cheapest_contiguous(usable, hours_needed)

    # Current slot: the one whose [start, start+1h) contains now.
    current_start = next(
        (start for start, _ in slots if start <= now < start + HOUR), None
    )
    active = current_start is not None and current_start in chosen

    upcoming = sorted(s for s in chosen if s + HOUR > now)
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


def _cheapest_contiguous(
    usable: list[tuple[datetime, float]], hours_needed: int
) -> set[datetime]:
    """Cheapest run of hours_needed consecutive usable hours (for loads that
    cannot pause). Falls back to the cheapest single hours if the usable slots
    are not contiguous enough to form a full block."""
    if len(usable) <= hours_needed:
        return {start for start, _ in usable}
    best_sum: float | None = None
    best: list[datetime] = []
    for i in range(len(usable) - hours_needed + 1):
        window = usable[i : i + hours_needed]
        # Only accept truly consecutive hours.
        if window[-1][0] - window[0][0] != HOUR * (hours_needed - 1):
            continue
        total = sum(price for _, price in window)
        if best_sum is None or total < best_sum:
            best_sum = total
            best = [start for start, _ in window]
    if best:
        return set(best)
    # No contiguous block available: fall back to cheapest individual hours.
    return {start for start, _ in sorted(usable, key=lambda s: s[1])[:hours_needed]}
