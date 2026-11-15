"""Sensor platform for SmartHomeShop.io."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any

from homeassistant.components.recorder.statistics import (
    async_list_statistic_ids,
    async_update_statistics_metadata,
)
from homeassistant.components.sensor import RestoreSensor, SensorEntity
from homeassistant.config_entries import (
    SIGNAL_CONFIG_ENTRY_CHANGED,
    ConfigEntry,
    ConfigEntryChange,
    ConfigEntryState,
)
from homeassistant.const import UnitOfTime
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util.unit_conversion import DurationConverter

from .const import (
    CONF_PRODUCT_TYPE,
    DOMAIN,
    PRODUCT_CEILSENSE,
    PRODUCT_P1METERKIT,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
)
from .energy_runtime import energy_runtime_enabled
from .room_entities import (
    claim_room_host,
    setup_room_climate_entities,
    track_room_host,
)
from .products.base.p1 import P1_SENSORS, P1SensorDescription

# Import shared water sensors from base module
from .products.base.water import (
    WATER_SENSORS,
    WaterCoordinator,
    WaterSensorEntityDescription,
)

# Import UltimateSensor room quality sensors
from .products.ultimatesensor import (
    ROOM_QUALITY_SENSORS,
    RoomQualitySensorDescription,
    UltimateSensorCoordinator,
)

# Key under hass.data[DOMAIN] holding the entry that carries the account-wide
# entities (prices, savings, battery plan, deadline schedules).
ACCOUNT_HOST = "account_host"
LEGACY_BASELINE_LEARNING_DAYS_UNIT = "dagen"

_LOGGER = logging.getLogger(__name__)


async def async_migrate_baseline_learning_days_statistics(
    hass: HomeAssistant, config_entry: ConfigEntry
) -> None:
    """Migrate the legacy Dutch statistics unit to Home Assistant's day unit.

    Releases through 1.14 accidentally published the Dutch word ``dagen`` as
    the native unit. The values were already counts of days, so only the
    recorder metadata needs to be normalised; the historical numbers must not
    be converted or deleted.
    """
    if "recorder" not in hass.config.components:
        return

    registry = er.async_get(hass)
    entity_id = registry.async_get_entity_id(
        "sensor",
        DOMAIN,
        f"{config_entry.entry_id}_baseline_learning_days",
    )
    if entity_id is None:
        return

    try:
        metadata = await async_list_statistic_ids(hass, {entity_id})
    except Exception:  # Recorder must never prevent the device from loading.
        _LOGGER.debug(
            "Could not inspect legacy statistics metadata for %s",
            entity_id,
            exc_info=True,
        )
        return

    statistic = next(
        (item for item in metadata if item.get("statistic_id") == entity_id),
        None,
    )
    if (
        statistic is None
        or statistic.get("unit_of_measurement") != LEGACY_BASELINE_LEARNING_DAYS_UNIT
    ):
        return

    migrated = asyncio.Event()

    def _migration_done() -> None:
        hass.loop.call_soon_threadsafe(migrated.set)

    async_update_statistics_metadata(
        hass,
        entity_id,
        new_unit_class=DurationConverter.UNIT_CLASS,
        new_unit_of_measurement=UnitOfTime.DAYS,
        on_done=_migration_done,
    )
    try:
        await asyncio.wait_for(migrated.wait(), timeout=10)
    except TimeoutError:
        _LOGGER.warning(
            "Timed out while migrating statistics metadata for %s", entity_id
        )


@callback
def _entry_is_usable(hass: HomeAssistant, entry_id: str | None) -> bool:
    """Does this entry still exist and is it still enabled?"""
    if not entry_id:
        return False
    return any(
        entry.entry_id == entry_id and not entry.disabled_by
        for entry in hass.config_entries.async_entries(DOMAIN)
    )


@callback
def claim_account_host(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Return True when this entry carries the account-wide entities.

    Prices, savings, the battery plan and the deadline schedules belong to the
    account and not to one device, so exactly one entry hosts them. The role
    sticks to the entry that holds it - a reload must not move it - and is only
    handed over once that entry is removed or disabled.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    host = domain_data.get(ACCOUNT_HOST)
    if host != config_entry.entry_id and _entry_is_usable(hass, host):
        return False
    domain_data[ACCOUNT_HOST] = config_entry.entry_id
    return True


@callback
def track_account_host(hass: HomeAssistant, config_entry: ConfigEntry) -> None:
    """Take the account-wide entities over when their host disappears.

    Removing or disabling an entry drops every entity it carried and Home
    Assistant does not reload the sibling entries, so without this the prices,
    battery plan and schedules would stay gone until the next restart.
    """

    @callback
    def _entry_changed(change: ConfigEntryChange, entry: ConfigEntry) -> None:
        if entry.domain != DOMAIN:
            return
        if not energy_runtime_enabled(hass):
            return
        domain_data = hass.data.setdefault(DOMAIN, {})
        host = domain_data.get(ACCOUNT_HOST)
        if host == config_entry.entry_id or _entry_is_usable(hass, host):
            return
        loaded = sorted(
            e.entry_id
            for e in hass.config_entries.async_entries(DOMAIN)
            if not e.disabled_by and e.state is ConfigEntryState.LOADED
        )
        if not loaded or loaded[0] != config_entry.entry_id:
            return
        # Claim before reloading, so the burst of entry updates that follows
        # cannot schedule the same reload again.
        domain_data[ACCOUNT_HOST] = config_entry.entry_id
        hass.config_entries.async_schedule_reload(config_entry.entry_id)

    config_entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_CONFIG_ENTRY_CHANGED, _entry_changed)
    )


@callback
def adopt_account_entities(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    entity_domain: str,
    entities: list[Any],
) -> None:
    """Re-enable entities a disabled previous host left behind.

    Disabling an entry disables everything it carried, including the
    account-wide entities, which would otherwise stay disabled under their new
    host. Entities the user disabled by hand keep their setting.
    """
    registry = er.async_get(hass)
    for entity in entities:
        unique_id = entity.unique_id
        if not unique_id:
            continue
        entity_id = registry.async_get_entity_id(entity_domain, DOMAIN, unique_id)
        if entity_id is None:
            continue
        entry = registry.async_get(entity_id)
        if (
            entry is not None
            and entry.disabled_by is er.RegistryEntryDisabler.CONFIG_ENTRY
            and entry.config_entry_id != config_entry.entry_id
        ):
            registry.async_update_entity(entity_id, disabled_by=None)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up SmartHomeShop sensors."""
    coordinator = config_entry.runtime_data
    product_type = config_entry.data.get(CONF_PRODUCT_TYPE)

    entities: list[SensorEntity] = []

    # Every loaded entry watches the election. The current host's listener is
    # removed with that entry, so failover needs a surviving listener already
    # registered before the host is disabled or removed.
    track_room_host(hass, config_entry)
    is_room_host = claim_room_host(hass, config_entry)
    if is_room_host:
        setup_room_climate_entities(
            hass, config_entry, async_add_entities, entities
        )

    # Water product sensors (shared between WaterP1MeterKit, WaterMeterKit)
    # WaterFlowKit uses ESPHome sensors directly + utility meters
    if product_type in (
        PRODUCT_WATERP1METERKIT,
        PRODUCT_WATERMETERKIT,
    ):
        await async_migrate_baseline_learning_days_statistics(hass, config_entry)
        entities.extend(
            SmartHomeShopWaterSensor(coordinator, description, config_entry)
            for description in WATER_SENSORS
        )

    # Shared P1 energy sensors (P1MeterKit and WaterP1MeterKit)
    if product_type in (PRODUCT_P1METERKIT, PRODUCT_WATERP1METERKIT):
        entities.extend(
            SmartHomeShopP1Sensor(coordinator, description, config_entry)
            for description in P1_SENSORS
        )

    # UltimateSensor / CeilSense room quality sensors
    if product_type in (
        PRODUCT_ULTIMATESENSOR,
        PRODUCT_ULTIMATESENSOR_MINI,
        PRODUCT_CEILSENSE,
    ):
        entities.extend(
            SmartHomeShopRoomQualitySensor(coordinator, description, config_entry)
            for description in ROOM_QUALITY_SENSORS
        )

    # Note: Energy period tracking (daily, weekly, monthly, yearly) is now handled
    # by automatically created Utility Meter helpers. See:
    # products/waterp1meterkit/utility_meters.py

    # Account-wide Energy entities only exist while the user has enabled the
    # complete Smart Energy module. This keeps sensor-only installations free
    # from unrelated service devices.
    energy_enabled = energy_runtime_enabled(hass)
    is_account_host = (
        claim_account_host(hass, config_entry) if energy_enabled else False
    )
    if energy_enabled:
        track_account_host(hass, config_entry)
    prices = hass.data.get(DOMAIN, {}).get("prices")
    if prices is not None and is_account_host:
        from .price_sensors import PRICE_SENSORS, SmartHomeShopPriceSensor

        entities.extend(
            SmartHomeShopPriceSensor(prices, description)
            for description in PRICE_SENSORS
        )

        savings = hass.data.get(DOMAIN, {}).get("savings")
        if savings is not None:
            from .savings_sensors import build_savings_sensors

            entities.extend(build_savings_sensors(savings))

    battery_plan = hass.data.get(DOMAIN, {}).get("battery_plan")
    if is_account_host and battery_plan is not None:
        from .battery_entities import BATTERY_SENSORS, SmartHomeShopBatterySensor

        entities.extend(
            SmartHomeShopBatterySensor(battery_plan, description)
            for description in BATTERY_SENSORS
        )

    smart_ev = hass.data.get(DOMAIN, {}).get("smart_ev")
    if is_account_host and smart_ev is not None:
        _setup_ev_plan_sensors(
            hass, config_entry, smart_ev, async_add_entities, entities
        )

    smart_loads = hass.data.get(DOMAIN, {}).get("smart_loads")
    if is_account_host and smart_loads is not None:
        _setup_load_plan_sensors(
            hass, config_entry, smart_loads, async_add_entities, entities
        )

    if is_account_host or is_room_host:
        adopt_account_entities(hass, config_entry, "sensor", entities)

    async_add_entities(entities)

    solar_forecast = hass.data.get(DOMAIN, {}).get("solar_forecast")
    if is_account_host and solar_forecast is not None:
        _add_solar_sensors_when_available(
            hass, config_entry, solar_forecast, async_add_entities
        )


@callback
def _setup_ev_plan_sensors(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    coordinator: Any,
    async_add_entities: AddConfigEntryEntitiesCallback,
    initial_entities: list[SensorEntity],
) -> None:
    """Add/update/remove one Smart EV plan sensor per configured vehicle.

    No entities exist while Smart EV is turned off. Turning it on or off
    sends SIGNAL_SMART_EV_CHANGED, so entities follow without a reload. The
    coordinator keeps running either way and releases owned chargers.
    """
    from .const import SIGNAL_SMART_EV_CHANGED
    from .energy_runtime import remove_feature_registry_entries
    from .ev_entities import SmartHomeShopEVPlanSensor, smart_ev_entity_vehicles

    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        return
    known: dict[str, SmartHomeShopEVPlanSensor] = {}

    def _vehicles() -> dict[str, dict[str, Any]]:
        return smart_ev_entity_vehicles(store.get_smart_ev())

    @callback
    def _sync() -> None:
        vehicles = _vehicles()
        new: list[SmartHomeShopEVPlanSensor] = []
        for vehicle_id, vehicle in vehicles.items():
            if vehicle_id in known:
                known[vehicle_id].update_vehicle(vehicle)
            else:
                entity = SmartHomeShopEVPlanSensor(coordinator, vehicle)
                known[vehicle_id] = entity
                new.append(entity)
        if new:
            adopt_account_entities(hass, config_entry, "sensor", new)
            async_add_entities(new)
        removed: list[str] = []
        for vehicle_id in list(known):
            if vehicle_id in vehicles:
                continue
            entity = known.pop(vehicle_id)
            hass.async_create_task(entity.async_remove(force_remove=True))
            removed.append(f"{DOMAIN}_ev_{vehicle_id}_plan")
        remove_feature_registry_entries(
            hass, "sensor", removed, None if vehicles else (DOMAIN, "smart_ev")
        )

    wanted = _vehicles()
    for vehicle_id, vehicle in wanted.items():
        entity = SmartHomeShopEVPlanSensor(coordinator, vehicle)
        known[vehicle_id] = entity
        initial_entities.append(entity)
    # Entries left from a run where Smart EV was still on.
    remove_feature_registry_entries(
        hass,
        "sensor",
        [
            f"{DOMAIN}_ev_{item.get('id')}_plan"
            for item in store.get_smart_ev().get("vehicles", [])
            if isinstance(item, dict) and str(item.get("id") or "") not in wanted
        ],
        None if wanted else (DOMAIN, "smart_ev"),
    )
    config_entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_SMART_EV_CHANGED, _sync)
    )


@callback
def _setup_load_plan_sensors(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    coordinator: Any,
    async_add_entities: AddConfigEntryEntitiesCallback,
    initial_entities: list[SensorEntity],
) -> None:
    """Add/update/remove one plan sensor per configured Smart Load.

    No entities exist while Smart Loads is turned off; the change signal adds
    or removes them live. The coordinator keeps running to finish or stop
    owned devices safely.
    """
    from .const import SIGNAL_SMART_LOADS_CHANGED
    from .energy_runtime import remove_feature_registry_entries
    from .smart_load_entities import (
        SmartHomeShopLoadPlanSensor,
        smart_load_entity_loads,
    )

    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        return
    known: dict[str, SmartHomeShopLoadPlanSensor] = {}

    def _loads() -> dict[str, dict[str, Any]]:
        return smart_load_entity_loads(store.get_smart_loads())

    @callback
    def _sync() -> None:
        loads = _loads()
        new: list[SmartHomeShopLoadPlanSensor] = []
        for load_id, load in loads.items():
            if load_id in known:
                known[load_id].update_load(load)
            else:
                entity = SmartHomeShopLoadPlanSensor(coordinator, load)
                known[load_id] = entity
                new.append(entity)
        if new:
            adopt_account_entities(hass, config_entry, "sensor", new)
            async_add_entities(new)
        removed: list[str] = []
        for load_id in list(known):
            if load_id in loads:
                continue
            entity = known.pop(load_id)
            hass.async_create_task(entity.async_remove(force_remove=True))
            removed.append(f"{DOMAIN}_load_{load_id}_plan")
        remove_feature_registry_entries(
            hass, "sensor", removed, None if loads else (DOMAIN, "smart_loads")
        )

    wanted = _loads()
    for load_id, load in wanted.items():
        entity = SmartHomeShopLoadPlanSensor(coordinator, load)
        known[load_id] = entity
        initial_entities.append(entity)
    # Entries left from a run where Smart Loads was still on.
    remove_feature_registry_entries(
        hass,
        "sensor",
        [
            f"{DOMAIN}_load_{item.get('id')}_plan"
            for item in store.get_smart_loads().get("loads", [])
            if isinstance(item, dict) and str(item.get("id") or "") not in wanted
        ],
        None if wanted else (DOMAIN, "smart_loads"),
    )
    adopt_account_entities(hass, config_entry, "sensor", list(known.values()))
    config_entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_SMART_LOADS_CHANGED, _sync)
    )


@callback
def _add_solar_sensors_when_available(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    solar_forecast: Any,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add the forecast sensors once the account turns out to have a forecast.

    The answer arrives after setup, and an account without solar forecast
    should not carry a row of unavailable sensors.
    """
    from .solar_sensors import build_solar_sensors

    added = False

    @callback
    def _add() -> None:
        nonlocal added
        if added or not solar_forecast.available:
            return
        added = True
        entities = build_solar_sensors(solar_forecast)
        adopt_account_entities(hass, config_entry, "sensor", entities)
        async_add_entities(entities)

    config_entry.async_on_unload(solar_forecast.async_add_listener(_add))
    _add()


class SmartHomeShopWaterSensor(CoordinatorEntity[WaterCoordinator], SensorEntity):
    """SmartHomeShop water sensor entity."""

    entity_description: WaterSensorEntityDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: WaterCoordinator,
        description: WaterSensorEntityDescription,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._config_entry = config_entry

        # Create unique ID
        self._attr_unique_id = f"{config_entry.entry_id}_{description.key}"

        # Link to the physical ESPHome device without claiming ownership of a
        # duplicate SmartHomeShop registry device (required by HA 2026.8).
        if coordinator.device_entry:
            self.device_entry = coordinator.device_entry

    @property
    def native_value(self) -> Any:
        """Return the sensor value."""
        if self.coordinator.data is None:
            return None
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def last_reset(self) -> datetime | None:
        """Start of the period a total that restarts every period counts from."""
        if (
            self.coordinator.data is None
            or self.entity_description.last_reset_fn is None
        ):
            return None
        return self.entity_description.last_reset_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra state attributes."""
        if self.coordinator.data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(self.coordinator.data)


class SmartHomeShopRoomQualitySensor(
    CoordinatorEntity[UltimateSensorCoordinator], SensorEntity
):
    """SmartHomeShop room quality sensor entity."""

    entity_description: RoomQualitySensorDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: UltimateSensorCoordinator,
        description: RoomQualitySensorDescription,
        config_entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._config_entry = config_entry

        # Create unique ID
        self._attr_unique_id = f"{config_entry.entry_id}_{description.key}"

        if coordinator.device_entry:
            self.device_entry = coordinator.device_entry

    @property
    def native_value(self) -> Any:
        """Return the sensor value."""
        if self.coordinator.data is None:
            return None
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra state attributes."""
        if self.coordinator.data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(self.coordinator.data)


class SmartHomeShopP1Sensor(CoordinatorEntity, RestoreSensor):
    """Shared P1 energy sensor (standby power, month peak, costs)."""

    entity_description: P1SensorDescription
    _attr_has_entity_name = True

    def __init__(
        self, coordinator, description: P1SensorDescription, config_entry: ConfigEntry
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._config_entry = config_entry
        self._attr_unique_id = f"{config_entry.entry_id}_{description.key}"
        if coordinator.device_entry:
            self.device_entry = coordinator.device_entry

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        if not self.entity_description.restore:
            return
        last = await self.async_get_last_sensor_data()
        last_state = await self.async_get_last_state()
        if last is None or last.native_value is None or last_state is None:
            return
        try:
            value = float(last.native_value)
        except (ValueError, TypeError):
            return
        tracker = getattr(self.coordinator, "energy_tracker", None)
        if tracker is None:
            return
        if self.entity_description.key == "month_peak":
            tracker.restore_month_peak(value, last_state.attributes.get("month", ""))
        elif self.entity_description.key == "standby_power":
            tracker.restore_standby(
                value, last_state.attributes.get("measured_night", "")
            )

    @property
    def _p1_data(self):
        tracker = getattr(self.coordinator, "energy_tracker", None)
        return tracker.data if tracker else None

    @property
    def available(self) -> bool:
        if not super().available:
            return False
        available_fn = self.entity_description.available_fn
        if available_fn is None:
            return True
        data = self._p1_data
        return data is not None and available_fn(data)

    @property
    def native_value(self):
        data = self._p1_data
        if data is None:
            return None
        return self.entity_description.value_fn(data)

    @property
    def last_reset(self) -> datetime | None:
        data = self._p1_data
        if data is None or self.entity_description.last_reset_fn is None:
            return None
        return self.entity_description.last_reset_fn(data)

    @property
    def extra_state_attributes(self):
        data = self._p1_data
        if data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(data)
