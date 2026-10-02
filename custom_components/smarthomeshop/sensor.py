"""Sensor platform for SmartHomeShop.io."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import RestoreSensor, SensorEntity
from homeassistant.config_entries import (
    SIGNAL_CONFIG_ENTRY_CHANGED,
    ConfigEntry,
    ConfigEntryChange,
    ConfigEntryState,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    DOMAIN,
    CONF_PRODUCT_TYPE,
    PRODUCT_P1METERKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
    PRODUCT_CEILSENSE,
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
from .energy_runtime import energy_runtime_enabled

# Key under hass.data[DOMAIN] holding the entry that carries the account-wide
# entities (prices, savings, battery plan, deadline schedules).
ACCOUNT_HOST = "account_host"


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

    # Water product sensors (shared between WaterP1MeterKit, WaterMeterKit)
    # WaterFlowKit uses ESPHome sensors directly + utility meters
    if product_type in (
        PRODUCT_WATERP1METERKIT,
        PRODUCT_WATERMETERKIT,
    ):
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

    if is_account_host:
        adopt_account_entities(hass, config_entry, "sensor", entities)

    async_add_entities(entities)


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

    def __init__(self, coordinator, description: P1SensorDescription, config_entry: ConfigEntry) -> None:
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
            tracker.restore_standby(value, last_state.attributes.get("measured_night", ""))

    @property
    def _p1_data(self):
        tracker = getattr(self.coordinator, "energy_tracker", None)
        return tracker.data if tracker else None

    @property
    def native_value(self):
        data = self._p1_data
        if data is None:
            return None
        return self.entity_description.value_fn(data)

    @property
    def extra_state_attributes(self):
        data = self._p1_data
        if data is None or self.entity_description.attr_fn is None:
            return None
        return self.entity_description.attr_fn(data)
