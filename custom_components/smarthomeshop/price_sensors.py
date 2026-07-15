"""Dynamic energy price sensors (account-wide).

Exposed as a single "SmartHomeShop Energy Prices" service device so the
current spot price can be graphed, automated on, or wired into the Home
Assistant Energy Dashboard ("use an entity with current price").
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import DOMAIN, VERSION
from .price_coordinator import PriceCoordinator


@dataclass(frozen=True, kw_only=True)
class PriceSensorDescription(SensorEntityDescription):
    value_fn: Callable[[PriceCoordinator], Any]
    attr_fn: Callable[[PriceCoordinator], dict[str, Any]] | None = None


PRICE_SENSORS: tuple[PriceSensorDescription, ...] = (
    PriceSensorDescription(
        key="electricity_price",
        name="Electricity price",
        icon="mdi:flash",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.electricity_price(),
        attr_fn=lambda c: {
            "market_price": c.electricity_market_price(),
            "feed_in_price": c.electricity_feed_in(),
            "level": c.electricity_level(),
            "difference_from_average": c.difference_from_average(),
            "difference_percentage_from_average": (
                c.difference_percentage_from_average()
            ),
            "price_rank": c.current_price_rank(),
            "ranked_hours": c.ranked_price_hours(),
            "next_lower_price_start": (c.next_lower_period() or {}).get("start"),
            "prices_today": c.today(),
            "prices_tomorrow": c.tomorrow(),
        },
    ),
    PriceSensorDescription(
        key="electricity_market_price",
        name="Electricity market price",
        icon="mdi:transmission-tower",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.electricity_market_price(),
    ),
    PriceSensorDescription(
        key="electricity_feed_in_price",
        name="Electricity feed-in price",
        icon="mdi:solar-power",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.electricity_feed_in(),
    ),
    PriceSensorDescription(
        key="gas_price",
        name="Gas price",
        icon="mdi:fire",
        native_unit_of_measurement="€/m³",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.gas_price(),
    ),
    PriceSensorDescription(
        key="electricity_price_level",
        name="Electricity price level",
        icon="mdi:chart-line-variant",
        value_fn=lambda c: c.electricity_level(),
    ),
    PriceSensorDescription(
        key="average_price_today",
        name="Average price today",
        icon="mdi:chart-bell-curve",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.average_today(),
    ),
    PriceSensorDescription(
        key="lowest_price_today",
        name="Lowest price today",
        icon="mdi:trending-down",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.lowest_today(),
        attr_fn=lambda c: _period_attrs(c.lowest_period()),
    ),
    PriceSensorDescription(
        key="highest_price_today",
        name="Highest price today",
        icon="mdi:trending-up",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.highest_today(),
        attr_fn=lambda c: _period_attrs(c.highest_period()),
    ),
    PriceSensorDescription(
        key="price_difference_from_average",
        name="Price difference from average",
        icon="mdi:compare-horizontal",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.difference_from_average(),
    ),
    PriceSensorDescription(
        key="price_difference_percentage",
        name="Price difference percentage",
        icon="mdi:percent-outline",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda c: c.difference_percentage_from_average(),
    ),
    PriceSensorDescription(
        key="current_price_rank",
        name="Current price rank",
        icon="mdi:podium",
        value_fn=lambda c: c.current_price_rank(),
        attr_fn=lambda c: {"total_hours": c.ranked_price_hours()},
    ),
    PriceSensorDescription(
        key="price_spread_today",
        name="Price spread today",
        icon="mdi:arrow-expand-vertical",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.price_spread_today(),
    ),
    PriceSensorDescription(
        key="negative_price_hours_today",
        name="Negative price hours today",
        icon="mdi:cash-minus",
        native_unit_of_measurement="h",
        value_fn=lambda c: c.negative_hours_today(),
    ),
    PriceSensorDescription(
        key="next_lower_price_start",
        name="Next lower price start",
        icon="mdi:clock-fast",
        device_class=SensorDeviceClass.TIMESTAMP,
        value_fn=lambda c: _period_start(c.next_lower_period()),
        attr_fn=lambda c: _period_attrs(c.next_lower_period()),
    ),
    *(
        PriceSensorDescription(
            key=f"cheapest_{h}h_start",
            name=f"Cheapest {h}h block start",
            icon="mdi:clock-star-four-points-outline",
            device_class=SensorDeviceClass.TIMESTAMP,
            value_fn=(lambda c, hours=h: _block_start(c.cheapest_block(hours))),
            attr_fn=(lambda c, hours=h: _block_attrs(c.cheapest_block(hours))),
        )
        for h in range(1, 7)
    ),
)


def _block_start(block: dict[str, Any] | None) -> datetime | None:
    """Parse a block start into a timezone-aware datetime (TIMESTAMP class)."""
    if not block or not block.get("start"):
        return None
    parsed = dt_util.parse_datetime(str(block["start"]))
    if parsed is None:
        return None
    if parsed.tzinfo is None:
        # Naive timestamps from the API are in the HA-configured timezone.
        parsed = parsed.replace(tzinfo=dt_util.get_default_time_zone())
    return parsed


def _period_start(period: dict[str, Any] | None) -> datetime | None:
    """Parse a summary price period into a timestamp sensor value."""
    if not period:
        return None
    return _block_start({"start": period.get("start")})


def _block_attrs(block: dict[str, Any] | None) -> dict[str, Any]:
    if not block:
        return {}
    return {"end": block.get("end"), "average_price": block.get("average")}


def _period_attrs(period: dict[str, Any] | None) -> dict[str, Any]:
    if not period:
        return {}
    return {
        "end": period.get("end"),
        "price": period.get("price"),
        "saving": period.get("saving"),
    }


class SmartHomeShopPriceSensor(CoordinatorEntity[PriceCoordinator], SensorEntity):
    """A dynamic energy price sensor backed by the price coordinator."""

    _attr_has_entity_name = True
    # The hourly arrays are for the UI/automations only; keeping them out of
    # the recorder avoids writing ~100 rows of price data on every state.
    _unrecorded_attributes = frozenset({"prices_today", "prices_tomorrow"})
    entity_description: PriceSensorDescription

    def __init__(
        self, coordinator: PriceCoordinator, description: PriceSensorDescription
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{DOMAIN}_price_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, "energy_prices")},
            name="SmartHomeShop Energy Prices",
            manufacturer="SmartHomeShop.io",
            model="Dynamic energy prices",
            entry_type=DeviceEntryType.SERVICE,
            sw_version=VERSION,
        )

    @property
    def native_value(self) -> Any:
        return self.entity_description.value_fn(self.coordinator)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(self.coordinator)

    @property
    def available(self) -> bool:
        return self.coordinator.status == "ok"
