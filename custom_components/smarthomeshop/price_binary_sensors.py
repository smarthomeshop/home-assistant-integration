"""Binary sensor for the dynamic energy prices (is it cheap right now)."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, VERSION
from .price_coordinator import PriceCoordinator


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
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, "energy_prices")},
            name="SmartHomeShop Energy Prices",
            manufacturer="SmartHomeShop.io",
            model="Dynamic energy prices",
            entry_type=DeviceEntryType.SERVICE,
            sw_version=VERSION,
        )

    @property
    def is_on(self) -> bool | None:
        return self.coordinator.cheap_now()

    @property
    def available(self) -> bool:
        return self.coordinator.status == "ok" and self.coordinator.cheap_now() is not None
