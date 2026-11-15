"""Binary sensor platform for SmartHomeShop.io."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    CONF_PRODUCT_TYPE,
    DOMAIN,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
)
from .energy_runtime import energy_runtime_enabled
from .room_entities import claim_room_host, setup_room_binary_entities

# Import shared water binary sensors from base module
from .products.base.water import (
    WATER_BINARY_SENSORS,
    WaterBinarySensorEntityDescription,
    WaterCoordinator,
)
from .products.waterflowkit.lines import line_label

# The account-host election lives in the sensor platform so both platforms
# agree on which entry carries the account-wide entities.
from .sensor import adopt_account_entities, claim_account_host


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up SmartHomeShop binary sensors."""
    coordinator = config_entry.runtime_data
    product_type = config_entry.data.get(CONF_PRODUCT_TYPE)

    entities: list[BinarySensorEntity] = []

    is_room_host = claim_room_host(hass, config_entry)
    if is_room_host:
        setup_room_binary_entities(
            hass, config_entry, async_add_entities, entities
        )

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
            WaterFlowKitLeakBinarySensor(
                coordinator, config_entry, line, line_label(line)
            )
            for line in coordinator.lines
        )

    # Account-wide controls are absent when the complete Smart Energy module
    # is disabled, rather than lingering below an unrelated product entry.
    energy_enabled = energy_runtime_enabled(hass)
    is_account_host = (
        claim_account_host(hass, config_entry) if energy_enabled else False
    )
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

    if is_account_host or is_room_host:
        adopt_account_entities(hass, config_entry, "binary_sensor", entities)

    smart_ev = hass.data.get(DOMAIN, {}).get("smart_ev")
    if is_account_host and smart_ev is not None:
        _setup_ev_binary_sensors(
            hass, config_entry, smart_ev, async_add_entities, entities
        )

    smart_loads = hass.data.get(DOMAIN, {}).get("smart_loads")
    if is_account_host and smart_loads is not None:
        _setup_load_binary_sensors(
            hass, config_entry, smart_loads, async_add_entities, entities
        )

    async_add_entities(entities)


@callback
def _setup_ev_binary_sensors(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    coordinator: Any,
    async_add_entities: AddConfigEntryEntitiesCallback,
    initial_entities: list[BinarySensorEntity],
) -> None:
    """Add/update/remove the charging and problem entities per vehicle.

    Nothing is created while Smart EV is turned off; see the plan sensors.
    """
    from .const import SIGNAL_SMART_EV_CHANGED
    from .energy_runtime import remove_feature_registry_entries
    from .ev_entities import SmartHomeShopEVBinarySensor, smart_ev_entity_vehicles

    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        return
    known: dict[tuple[str, str], SmartHomeShopEVBinarySensor] = {}

    def _vehicles() -> dict[str, dict[str, Any]]:
        return smart_ev_entity_vehicles(store.get_smart_ev())

    @callback
    def _sync() -> None:
        vehicles = _vehicles()
        new: list[SmartHomeShopEVBinarySensor] = []
        for vehicle_id, vehicle in vehicles.items():
            for kind in ("charging", "problem"):
                key = (vehicle_id, kind)
                if key in known:
                    known[key].update_vehicle(vehicle)
                else:
                    entity = SmartHomeShopEVBinarySensor(coordinator, vehicle, kind)
                    known[key] = entity
                    new.append(entity)
        if new:
            adopt_account_entities(hass, config_entry, "binary_sensor", new)
            async_add_entities(new)
        removed: list[str] = []
        for key in list(known):
            vehicle_id, kind = key
            if vehicle_id in vehicles:
                continue
            entity = known.pop(key)
            hass.async_create_task(entity.async_remove(force_remove=True))
            removed.append(f"{DOMAIN}_ev_{vehicle_id}_{kind}")
        remove_feature_registry_entries(
            hass, "binary_sensor", removed, None if vehicles else (DOMAIN, "smart_ev")
        )

    wanted = _vehicles()
    for vehicle_id, vehicle in wanted.items():
        for kind in ("charging", "problem"):
            entity = SmartHomeShopEVBinarySensor(coordinator, vehicle, kind)
            known[(vehicle_id, kind)] = entity
            initial_entities.append(entity)
    remove_feature_registry_entries(
        hass,
        "binary_sensor",
        [
            f"{DOMAIN}_ev_{item.get('id')}_{kind}"
            for item in store.get_smart_ev().get("vehicles", [])
            if isinstance(item, dict) and str(item.get("id") or "") not in wanted
            for kind in ("charging", "problem")
        ],
        None if wanted else (DOMAIN, "smart_ev"),
    )
    adopt_account_entities(hass, config_entry, "binary_sensor", list(known.values()))
    config_entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_SMART_EV_CHANGED, _sync)
    )


@callback
def _setup_load_binary_sensors(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    coordinator: Any,
    async_add_entities: AddConfigEntryEntitiesCallback,
    initial_entities: list[BinarySensorEntity],
) -> None:
    """Add/update/remove active and problem entities per Smart Load.

    Nothing is created while Smart Loads is turned off; see the plan sensors.
    """
    from .const import SIGNAL_SMART_LOADS_CHANGED
    from .energy_runtime import remove_feature_registry_entries
    from .smart_load_entities import (
        SmartHomeShopLoadBinarySensor,
        smart_load_entity_loads,
    )

    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        return
    known: dict[tuple[str, str], SmartHomeShopLoadBinarySensor] = {}

    def _loads() -> dict[str, dict[str, Any]]:
        return smart_load_entity_loads(store.get_smart_loads())

    @callback
    def _sync() -> None:
        loads = _loads()
        new: list[SmartHomeShopLoadBinarySensor] = []
        for load_id, load in loads.items():
            for kind in ("active", "problem"):
                key = (load_id, kind)
                if key in known:
                    known[key].update_load(load)
                else:
                    entity = SmartHomeShopLoadBinarySensor(coordinator, load, kind)
                    known[key] = entity
                    new.append(entity)
        if new:
            adopt_account_entities(hass, config_entry, "binary_sensor", new)
            async_add_entities(new)
        removed: list[str] = []
        for key in list(known):
            load_id, kind = key
            if load_id in loads:
                continue
            entity = known.pop(key)
            hass.async_create_task(entity.async_remove(force_remove=True))
            removed.append(f"{DOMAIN}_load_{load_id}_{kind}")
        remove_feature_registry_entries(
            hass, "binary_sensor", removed, None if loads else (DOMAIN, "smart_loads")
        )

    wanted = _loads()
    for load_id, load in wanted.items():
        for kind in ("active", "problem"):
            entity = SmartHomeShopLoadBinarySensor(coordinator, load, kind)
            known[(load_id, kind)] = entity
            initial_entities.append(entity)
    remove_feature_registry_entries(
        hass,
        "binary_sensor",
        [
            f"{DOMAIN}_load_{item.get('id')}_{kind}"
            for item in store.get_smart_loads().get("loads", [])
            if isinstance(item, dict) and str(item.get("id") or "") not in wanted
            for kind in ("active", "problem")
        ],
        None if wanted else (DOMAIN, "smart_loads"),
    )
    adopt_account_entities(
        hass, config_entry, "binary_sensor", list(known.values())
    )
    config_entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_SMART_LOADS_CHANGED, _sync)
    )


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
    existing: list[SmartHomeShopScheduleBinarySensor] = []
    for schedule in store.get_schedules():
        if schedule["id"] not in known:
            entity = SmartHomeShopScheduleBinarySensor(prices, schedule)
            known[schedule["id"]] = entity
            existing.append(entity)
    if existing:
        adopt_account_entities(hass, config_entry, "binary_sensor", existing)
        async_add_entities(existing)

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
        if getattr(coordinator, "device_entry", None):
            self.device_entry = coordinator.device_entry

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

        if coordinator.device_entry:
            self.device_entry = coordinator.device_entry

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
