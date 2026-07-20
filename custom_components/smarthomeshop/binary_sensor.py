"""Binary sensor platform for SmartHomeShop.io."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    DOMAIN,
    CONF_PRODUCT_TYPE,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
)

# Import shared water binary sensors from base module
from .products.base.water import (
    WATER_BINARY_SENSORS,
    WaterBinarySensorEntityDescription,
    WaterCoordinator,
)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up SmartHomeShop binary sensors."""
    coordinator = config_entry.runtime_data
    product_type = config_entry.data.get(CONF_PRODUCT_TYPE)

    entities: list[BinarySensorEntity] = []

    # Water product binary sensors (shared between WaterP1MeterKit, WaterMeterKit)
    # WaterFlowKit uses ESPHome sensors directly + utility meters
    if product_type in (
        PRODUCT_WATERP1METERKIT,
        PRODUCT_WATERMETERKIT,
    ):
        entities.extend(
            SmartHomeShopWaterBinarySensor(coordinator, description, config_entry)
            for description in WATER_BINARY_SENSORS
        )

    # WaterFlowKit: per-line smart leak alarms, so the leak engine's scores
    # are visible in HA and the one-click leak automations have an entity.
    if product_type == PRODUCT_WATERFLOWKIT:
        entities.extend(
            WaterFlowKitLeakBinarySensor(coordinator, config_entry, line, label)
            for line, label in (("flow1", "Flow 1"), ("flow2", "Flow 2"))
        )

    # Account-wide price binary sensors are always hosted by one entry. They
    # remain unavailable until an API key is connected, avoiding a reload when
    # account settings change.
    entry_ids = [e.entry_id for e in hass.config_entries.async_entries(DOMAIN)]
    is_account_host = bool(entry_ids and config_entry.entry_id == min(entry_ids))
    prices = hass.data.get(DOMAIN, {}).get("prices")
    if prices is not None and is_account_host:
        from .price_binary_sensors import (
            SmartHomeShopCheapestWindowNowBinarySensor,
            SmartHomeShopCheapNowBinarySensor,
            SmartHomeShopContractActiveBinarySensor,
            SmartHomeShopTomorrowPricesBinarySensor,
        )

        entities.append(SmartHomeShopCheapNowBinarySensor(prices))
        entities.append(SmartHomeShopContractActiveBinarySensor(prices))
        entities.append(SmartHomeShopTomorrowPricesBinarySensor(prices))
        entities.extend(
            SmartHomeShopCheapestWindowNowBinarySensor(prices, hours)
            for hours in range(1, 7)
        )

        _setup_schedule_sensors(hass, config_entry, prices, async_add_entities)

    battery_plan = hass.data.get(DOMAIN, {}).get("battery_plan")
    if is_account_host and battery_plan is not None:
        from .battery_entities import SmartHomeShopBatteryActionBinarySensor

        entities.extend(
            SmartHomeShopBatteryActionBinarySensor(battery_plan, action)
            for action in ("charge", "discharge")
        )

    async_add_entities(entities)


def _setup_schedule_sensors(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    prices: Any,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add deadline-schedule sensors and keep them in sync with the store."""
    from homeassistant.helpers.dispatcher import async_dispatcher_connect

    from .const import SIGNAL_SCHEDULES_CHANGED
    from .schedule_sensors import SmartHomeShopScheduleBinarySensor

    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        return
    # Local to this setup (NOT hass.data): a host-entry reload unloads these
    # entities, so it must start from an empty registry and re-add them all.
    known: dict[str, SmartHomeShopScheduleBinarySensor] = {}

    def _sync() -> None:
        schedules = {s["id"]: s for s in store.get_schedules()}
        new: list[SmartHomeShopScheduleBinarySensor] = []
        for sid, schedule in schedules.items():
            if sid in known:
                known[sid].update_schedule(schedule)
            else:
                entity = SmartHomeShopScheduleBinarySensor(prices, schedule)
                known[sid] = entity
                new.append(entity)
        if new:
            async_add_entities(new)
        for sid in list(known):
            if sid not in schedules:
                entity = known.pop(sid)
                hass.async_create_task(entity.async_remove(force_remove=True))
                # Also drop the registry entry so a deleted schedule does not
                # linger as a restorable orphan in the entity registry.
                from homeassistant.helpers import entity_registry as er

                registry = er.async_get(hass)
                entity_id = registry.async_get_entity_id(
                    "binary_sensor", DOMAIN, f"{DOMAIN}_schedule_{sid}"
                )
                if entity_id:
                    registry.async_remove(entity_id)

    # Add the schedules that already exist, then keep in sync on every change.
    for schedule in store.get_schedules():
        if schedule["id"] not in known:
            entity = SmartHomeShopScheduleBinarySensor(prices, schedule)
            known[schedule["id"]] = entity
            async_add_entities([entity])

    config_entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_SCHEDULES_CHANGED, _sync)
    )


class WaterFlowKitLeakBinarySensor(CoordinatorEntity, BinarySensorEntity):
    """Smart leak alarm for one WaterFlowKit line, driven by the leak engine."""

    _attr_has_entity_name = True
    _attr_icon = "mdi:water-alert"

    def __init__(self, coordinator, config_entry: ConfigEntry, line: str, label: str) -> None:
        super().__init__(coordinator)
        self._line = line
        self._attr_name = f"{label} leak alarm (CC)"
        self._attr_unique_id = f"{config_entry.entry_id}_{line}_leak_alarm_cc"
        if getattr(coordinator, "device_info", None):
            self._attr_device_info = coordinator.device_info

    def _score(self) -> dict[str, Any] | None:
        line = (self.coordinator.data or {}).get(self._line) or {}
        return line.get("leak_score")

    @property
    def is_on(self) -> bool:
        score = self._score() or {}
        return bool(score.get("is_leak_likely"))

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        score = self._score()
        if not score:
            return None
        return {
            "leak_type": score.get("leak_type"),
            "total_score": score.get("total_score"),
            "confidence": score.get("confidence"),
        }


class SmartHomeShopWaterBinarySensor(
    CoordinatorEntity[WaterCoordinator], BinarySensorEntity
):
    """SmartHomeShop water binary sensor entity."""

    entity_description: WaterBinarySensorEntityDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: WaterCoordinator,
        description: WaterBinarySensorEntityDescription,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._config_entry = config_entry

        # Create unique ID
        self._attr_unique_id = f"{config_entry.entry_id}_{description.key}"

        # Link to existing ESPHome device
        if coordinator.device_info:
            self._attr_device_info = coordinator.device_info

    @property
    def is_on(self) -> bool:
        """Return true if the binary sensor is on."""
        if self.coordinator.data is None:
            return False
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra state attributes."""
        if self.coordinator.data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(self.coordinator.data)
