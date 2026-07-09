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
from .schedule_planner import SchedulePlan, compute_plan


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

    @callback
    def update_schedule(self, schedule: dict[str, Any]) -> None:
        """Apply new parameters from the store and refresh."""
        self._schedule = schedule
        self._attr_name = schedule.get("name") or "Smart schedule"
        self.async_write_ha_state()

    def _rows(self) -> list[dict[str, Any]]:
        return (self.coordinator.today() or []) + (self.coordinator.tomorrow() or [])

    def _plan(self) -> SchedulePlan:
        return compute_plan(
            dt_util.now(),
            self._rows(),
            int(self._schedule.get("hours", 0) or 0),
            self._schedule.get("ready_by"),
            self._schedule.get("earliest"),
        )

    @property
    def is_on(self) -> bool:
        if not self._schedule.get("enabled", True):
            return False
        return self._plan().active

    @property
    def available(self) -> bool:
        return self.coordinator.status == "ok" and bool(self._rows())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        plan = self._plan()
        return {
            "next_start": plan.next_start,
            "planned_hours": plan.planned,
            "hours_needed": plan.hours_needed,
            "hours_remaining": plan.hours_remaining,
            "forced": plan.forced,
            "reason": plan.reason,
            "ready_by": self._schedule.get("ready_by"),
            "earliest": self._schedule.get("earliest"),
            "target_entity": self._schedule.get("target_entity"),
            "enabled": self._schedule.get("enabled", True),
        }

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        # Re-evaluate at the top of every hour (slots are hourly).
        self._unsub_tick = async_track_time_change(
            self.hass, self._handle_tick, minute=0, second=5
        )

    @callback
    def _handle_tick(self, _now) -> None:
        self.async_write_ha_state()

    async def async_will_remove_from_hass(self) -> None:
        if self._unsub_tick is not None:
            self._unsub_tick()
            self._unsub_tick = None
        await super().async_will_remove_from_hass()
