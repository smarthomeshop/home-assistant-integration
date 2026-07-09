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
    ),
    PriceSensorDescription(
        key="highest_price_today",
        name="Highest price today",
        icon="mdi:trending-up",
        native_unit_of_measurement="€/kWh",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=4,
        value_fn=lambda c: c.highest_today(),
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
    if not block or not block.get("start"):
        return None
    try:
        return datetime.fromisoformat(block["start"])
    except (ValueError, TypeError):
        return None


def _block_attrs(block: dict[str, Any] | None) -> dict[str, Any]:
    if not block:
        return {}
    return {"end": block.get("end"), "average_price": block.get("average")}


class SmartHomeShopPriceSensor(CoordinatorEntity[PriceCoordinator], SensorEntity):
    """A dynamic energy price sensor backed by the price coordinator."""

    _attr_has_entity_name = True
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
