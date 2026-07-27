"""Binary sensors for energy prices.

These are the steering primitives automations trigger on: "cheap right now"
(below today's average), "inside the cheapest N-hour window now" (the correct
on/off primitive for continuous steering), whether a contract is connected
(so control automations can self-disable), and whether tomorrow's prices are
published yet (so day-ahead automations trigger on availability, not a clock).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.event import async_track_point_in_time
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import DOMAIN, VERSION
from .price_coordinator import PriceCoordinator

# Statuses that only mean the poll itself did not get through. The contract is
# not gone, so the last known answer still stands.
TRANSIENT_STATUSES = {"error", "connecting"}


def _prices_device_info() -> DeviceInfo:
    return DeviceInfo(
        identifiers={(DOMAIN, "energy_prices")},
        name="SmartHomeShop Energy Prices",
        manufacturer="SmartHomeShop.io",
        model="Cloud energy contract",
        entry_type=DeviceEntryType.SERVICE,
        sw_version=VERSION,
    )


class SmartHomeShopCheapNowBinarySensor(
    CoordinatorEntity[PriceCoordinator], BinarySensorEntity
):
    """On when the current electricity price is at or below today's average."""

    _attr_has_entity_name = True
    _attr_name = "Cheap electricity now"
    _attr_icon = "mdi:cash-clock"

    def __init__(self, coordinator: PriceCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_price_cheap_now"
        self._attr_device_info = _prices_device_info()

    @property
    def is_on(self) -> bool | None:
        return self.coordinator.cheap_now()

    @property
    def available(self) -> bool:
        return (
            self.coordinator.status == "ok"
            and self.coordinator.supports_price_optimisation()
            and self.coordinator.cheap_now() is not None
        )


class SmartHomeShopContractActiveBinarySensor(
    CoordinatorEntity[PriceCoordinator], BinarySensorEntity
):
    """On when an energy contract is connected and its prices apply.

    Control automations add this as a condition so they self-disable if the
    contract lapses (the price sensors keep publishing on the free tier).
    """

    _attr_has_entity_name = True
    _attr_name = "Energy contract connected"
    _attr_icon = "mdi:file-document-check-outline"

    def __init__(self, coordinator: PriceCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_price_contract_active"
        self._attr_device_info = _prices_device_info()

    def _connected(self) -> bool:
        if self.coordinator.contract() is None:
            return False
        return (
            self.coordinator.status == "ok"
            or self.coordinator.status in TRANSIENT_STATUSES
        )

    @property
    def is_on(self) -> bool:
        return self._connected()

    @property
    def available(self) -> bool:
        # Automations condition on this gate, so a failed poll must not turn it
        # 'unavailable': that sends them down their stop branch exactly when a
        # cheap window opens. Keep answering from the cached contract instead.
        return self.coordinator.last_update_success or self._connected()


class SmartHomeShopTomorrowPricesBinarySensor(
    CoordinatorEntity[PriceCoordinator], BinarySensorEntity
):
    """On when tomorrow's day-ahead prices are available (~13:00 CET)."""

    _attr_has_entity_name = True
    _attr_name = "Tomorrow prices available"
    _attr_icon = "mdi:calendar-clock"

    def __init__(self, coordinator: PriceCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{DOMAIN}_price_tomorrow_available"
        self._attr_device_info = _prices_device_info()

    @property
    def is_on(self) -> bool:
        return bool(self.coordinator.tomorrow())

    @property
    def available(self) -> bool:
        return (
            self.coordinator.status == "ok"
            and self.coordinator.supports_price_optimisation()
        )


class SmartHomeShopCheapestWindowNowBinarySensor(
    CoordinatorEntity[PriceCoordinator], BinarySensorEntity
):
    """On while the current time is inside today's cheapest N-hour block.

    Unlike "cheap now" (a below-average flag), this is the correct primitive
    for continuous on/off steering: an automation turns a load on when this
    goes on and off when it goes off, and it re-evaluates correctly after a
    Home Assistant restart. The entity schedules its own transition at the
    block start/end so switching is exact, not bound to the 30-min poll.
    """

    _attr_has_entity_name = True
    _attr_icon = "mdi:clock-check-outline"

    def __init__(self, coordinator: PriceCoordinator, hours: int) -> None:
        super().__init__(coordinator)
        self._hours = hours
        self._attr_name = f"Cheapest {hours}h window now"
        self._attr_unique_id = f"{DOMAIN}_price_cheapest_{hours}h_window_now"
        self._attr_device_info = _prices_device_info()
        self._unsub_timer: Any = None

    def _window(self) -> tuple[datetime, datetime] | None:
        block = self.coordinator.cheapest_block(self._hours)
        if not block or not block.get("start") or not block.get("end"):
            return None
        start = dt_util.parse_datetime(str(block["start"]))
        end = dt_util.parse_datetime(str(block["end"]))
        if start is None or end is None:
            return None
        # Guard against a naive timestamp (would raise when compared to an
        # aware now()): assume Home Assistant's local timezone.
        if start.tzinfo is None:
            start = start.replace(tzinfo=dt_util.get_default_time_zone())
        if end.tzinfo is None:
            end = end.replace(tzinfo=dt_util.get_default_time_zone())
        return start, end

    @property
    def is_on(self) -> bool | None:
        window = self._window()
        if window is None:
            return None
        now = dt_util.now()
        return window[0] <= now < window[1]

    @property
    def available(self) -> bool:
        # Stay available on cached price data during a transient poll failure,
        # matching the schedule sensors: a hiccup must not flip steering
        # automations to 'unavailable' mid-window.
        return (
            self.coordinator.supports_price_optimisation()
            and self._window() is not None
        )

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        block = self.coordinator.cheapest_block(self._hours) or {}
        return {
            "start": block.get("start"),
            "end": block.get("end"),
            "average_price": block.get("average"),
        }

    def _schedule_next_transition(self) -> None:
        self._cancel_timer()
        window = self._window()
        if window is None:
            return
        now = dt_util.now()
        target: datetime | None = None
        if now < window[0]:
            target = window[0]
        elif now < window[1]:
            target = window[1]
        if target is not None:
            self._unsub_timer = async_track_point_in_time(
                self.hass, self._handle_transition, target
            )

    def _cancel_timer(self) -> None:
        if self._unsub_timer is not None:
            self._unsub_timer()
            self._unsub_timer = None

    @callback
    def _handle_transition(self, _now: datetime) -> None:
        self._unsub_timer = None
        self.async_write_ha_state()
        self._schedule_next_transition()

    @callback
    def _handle_coordinator_update(self) -> None:
        self._schedule_next_transition()
        super()._handle_coordinator_update()

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self._schedule_next_transition()

    async def async_will_remove_from_hass(self) -> None:
        self._cancel_timer()
        await super().async_will_remove_from_hass()
