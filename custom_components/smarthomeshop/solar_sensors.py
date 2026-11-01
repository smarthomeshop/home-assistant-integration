"""Sensors for the solar forecast of the SmartHomeShop account."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
)
from homeassistant.const import UnitOfEnergy, UnitOfPower
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import energy_api
from .const import DOMAIN
from .price_binary_sensors import _prices_device_info
from .solar_forecast import SolarForecastCoordinator


@dataclass(frozen=True, kw_only=True)
class SolarSensorDescription(SensorEntityDescription):
    value_key: str


def _energy(key: str, name: str, value_key: str) -> SolarSensorDescription:
    return SolarSensorDescription(
        key=key,
        name=name,
        icon="mdi:solar-power-variant",
        device_class=SensorDeviceClass.ENERGY,
        native_unit_of_measurement=UnitOfEnergy.KILO_WATT_HOUR,
        suggested_display_precision=1,
        value_key=value_key,
    )


SOLAR_SENSORS: tuple[SolarSensorDescription, ...] = (
    _energy("solar_forecast_today", "Solar forecast today", "energy_today_kwh"),
    _energy(
        "solar_forecast_remaining_today",
        "Solar forecast remaining today",
        "energy_remaining_today_kwh",
    ),
    _energy(
        "solar_forecast_tomorrow", "Solar forecast tomorrow", "energy_tomorrow_kwh"
    ),
    SolarSensorDescription(
        key="solar_forecast_power_now",
        name="Solar forecast power now",
        icon="mdi:solar-power",
        device_class=SensorDeviceClass.POWER,
        native_unit_of_measurement=UnitOfPower.WATT,
        value_key="power_now_w",
    ),
)


class SmartHomeShopSolarSensor(
    CoordinatorEntity[SolarForecastCoordinator], SensorEntity
):
    """A value from the account solar forecast."""

    _attr_has_entity_name = True
    # Forecast rows are for the UI and automations; the recorder has no use for
    # them and they would pass its attribute size limit.
    _unrecorded_attributes = frozenset({"hourly"})
    entity_description: SolarSensorDescription

    def __init__(
        self,
        coordinator: SolarForecastCoordinator,
        description: SolarSensorDescription,
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        # The price_ prefix removes these with the other account entities when
        # Smart Energy is turned off.
        self._attr_unique_id = f"{DOMAIN}_price_{description.key}"
        self._attr_device_info = _prices_device_info()

    @property
    def native_value(self) -> float | None:
        return energy_api.number(
            energy_api.mapping(self.coordinator.data).get(
                self.entity_description.value_key
            )
        )

    @property
    def available(self) -> bool:
        return super().available and self.coordinator.available

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = energy_api.mapping(self.coordinator.data)
        attributes: dict[str, Any] = {
            "stale": data.get("stale") is True,
            "fetched_at": data.get("fetched_at"),
        }
        if self.entity_description.key == "solar_forecast_remaining_today":
            # In the format of the battery planner's forecast sensor option.
            attributes["hourly"] = [
                {
                    "datetime": row.get("timestamp"),
                    "power": row.get("power_w"),
                    "unit": "W",
                }
                for row in self.coordinator.rows()
            ]
        return attributes


def build_solar_sensors(
    coordinator: SolarForecastCoordinator,
) -> list[SmartHomeShopSolarSensor]:
    return [
        SmartHomeShopSolarSensor(coordinator, description)
        for description in SOLAR_SENSORS
    ]
