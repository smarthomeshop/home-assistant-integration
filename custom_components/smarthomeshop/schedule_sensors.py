"""Deadline-schedule binary sensors (smart-energy Phase 2).

One binary sensor per user schedule, on when the load should run in the
current hour to finish the needed hours before the "ready by" deadline in the
cheapest slots (deadline beats price). Schedules live in the HA Store and are
added/updated/removed live via a dispatcher signal, so the user can manage
them from the panel without a reload.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import callback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .price_binary_sensors import _prices_device_info
from .price_coordinator import PriceCoordinator
from .schedule_planner import SchedulePlan, _resolve_deadline, compute_plan

# Persist accumulated runtime at most this often (seconds).
_PERSIST_EVERY = 300


class SmartHomeShopScheduleBinarySensor(
    CoordinatorEntity[PriceCoordinator], BinarySensorEntity
):
    """On while a deadline schedule wants its load to run right now."""

    _attr_has_entity_name = True
    _attr_icon = "mdi:calendar-clock"

    def __init__(self, coordinator: PriceCoordinator, schedule: dict[str, Any]) -> None:
        super().__init__(coordinator)
        self._schedule = schedule
        self._attr_unique_id = f"{DOMAIN}_schedule_{schedule['id']}"
        self._attr_name = schedule.get("name") or "Smart schedule"
        self._attr_device_info = _prices_device_info()
        self._unsub_tick: Any = None
        # Runtime accounting for the current deadline cycle, so a load that
        # already ran its hours is not forced on again at the deadline.
        self._cycle_key = ""
        self._run_seconds = 0.0
        self._was_on = False
        self._last_eval = None
        self._last_persist = 0.0
        self._last_plan: SchedulePlan | None = None

    @callback
    def update_schedule(self, schedule: dict[str, Any]) -> None:
        """Apply new parameters from the store and refresh."""
        self._schedule = schedule
        self._attr_name = schedule.get("name") or "Smart schedule"
        if self.hass is not None and self.entity_id:
            self.async_write_ha_state()

    def _rows(self) -> list[dict[str, Any]]:
        return (self.coordinator.today() or []) + (self.coordinator.tomorrow() or [])

    def _store(self):
        return self.hass.data.get(DOMAIN, {}).get("store") if self.hass else None

    def _plan(self) -> SchedulePlan:
        """Evaluate the plan, accounting for hours already run this cycle."""
        now = dt_util.now()

        # Cycle bookkeeping: a new deadline starts a fresh cycle.
        deadline = _resolve_deadline(now, self._schedule.get("ready_by"))
        cycle = deadline.isoformat() if deadline else ""
        if cycle != self._cycle_key:
            self._cycle_key = cycle
            self._run_seconds = 0.0
            self._persist_runtime(now, force=True)

        # Accumulate the interval since the previous evaluation while on.
        if self._last_eval is not None and self._was_on:
            self._run_seconds += max(0.0, (now - self._last_eval).total_seconds())
            self._persist_runtime(now)
        self._last_eval = now

        plan = compute_plan(
            now,
            self._rows(),
            int(self._schedule.get("hours", 0) or 0),
            self._schedule.get("ready_by"),
            self._schedule.get("earliest"),
            bool(self._schedule.get("interruptible", True)),
            hours_done=self._run_seconds / 3600,
        )
        self._was_on = bool(plan.active and self._schedule.get("enabled", True))
        self._last_plan = plan
        return plan

    def _persist_runtime(self, now, force: bool = False) -> None:
        store = self._store()
        if store is None:
            return
        stamp = now.timestamp()
        if not force and stamp - self._last_persist < _PERSIST_EVERY:
            return
        self._last_persist = stamp
        self.hass.async_create_task(
            store.async_set_schedule_runtime(
                self._schedule["id"],
                {"cycle": self._cycle_key, "run_seconds": round(self._run_seconds)},
            )
        )

    def _restore_runtime(self) -> None:
        store = self._store()
        if store is None:
            return
        runtime = store.get_schedule_runtime(self._schedule["id"])
        if runtime.get("cycle"):
            self._cycle_key = runtime["cycle"]
            try:
                self._run_seconds = float(runtime.get("run_seconds") or 0.0)
            except (TypeError, ValueError):
                self._run_seconds = 0.0

    @property
    def is_on(self) -> bool:
        if not self._schedule.get("enabled", True):
            return False
        return self._plan().active

    @property
    def available(self) -> bool:
        # Stay available on any cached price data so a transient API hiccup does
        # not flip the sensor to unavailable and drop the load mid-deadline;
        # the coordinator keeps the last-known prices when a poll fails.
        return bool(self._rows())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        plan = self._last_plan or self._plan()
        return {
            "next_start": plan.next_start,
            "planned_hours": plan.planned,
            "hours_needed": plan.hours_needed,
            "hours_remaining": plan.hours_remaining,
            "hours_done": round(self._run_seconds / 3600, 2),
            "forced": plan.forced,
            "reason": plan.reason,
            "ready_by": self._schedule.get("ready_by"),
            "earliest": self._schedule.get("earliest"),
            "interruptible": self._schedule.get("interruptible", True),
            "target_entity": self._schedule.get("target_entity"),
            "enabled": self._schedule.get("enabled", True),
        }

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self._restore_runtime()
        # Re-evaluate at the top of every hour (slots are hourly) and a few
        # times in between so run-time accounting stays fresh.
        self._unsub_tick = async_track_time_change(
            self.hass, self._handle_tick, minute=[0, 15, 30, 45], second=5
        )

    @callback
    def _handle_tick(self, _now) -> None:
        self.async_write_ha_state()

    async def async_will_remove_from_hass(self) -> None:
        if self._unsub_tick is not None:
            self._unsub_tick()
            self._unsub_tick = None
        await super().async_will_remove_from_hass()
