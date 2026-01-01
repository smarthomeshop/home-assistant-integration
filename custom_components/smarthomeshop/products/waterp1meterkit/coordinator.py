"""WaterP1MeterKit coordinator - extends water coordinator with P1/energy."""

from __future__ import annotations

import re
from dataclasses import dataclass

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant

from ..base.water import WaterCoordinator, WaterUsageData
from ...const import CONF_WATER_SENSOR, LOGGER


@dataclass
class EnergyUsageData:
    """Energy usage data container."""
    power_consumed: float = 0.0
    energy_tariff1_total: float = 0.0
    energy_tariff2_total: float = 0.0
    energy_total: float = 0.0
    gas_total: float = 0.0


class WaterP1MeterKitCoordinator(WaterCoordinator):
    """WaterP1MeterKit coordinator with water + P1/energy support.

    This coordinator reads P1 meter data (power, energy tariffs, gas) from ESPHome.

    Energy period tracking (daily, weekly, monthly, yearly) is handled by
    automatically created Utility Meter helpers, which are:
    - Persistent across HA restarts
    - Compatible with the Energy Dashboard
    - Reset automatically at the correct times
    """

    def __init__(self, hass: HomeAssistant, config_entry: ConfigEntry) -> None:
        """Initialize the WaterP1MeterKit coordinator."""
        super().__init__(hass, config_entry)

        # Extract short device ID from water sensor entity name
        # e.g., sensor.waterp1meterkit_776c6c_water_total_consumption -> 776c6c
        water_sensor = config_entry.data.get(CONF_WATER_SENSOR, "")
        match = re.search(r"waterp1meterkit_([a-f0-9]+)_", water_sensor.lower())

        if match:
            short_id = match.group(1)
        else:
            # Fallback to device_id
            short_id = config_entry.data.get("device_id", "unknown")

        self._short_device_id = short_id

        # Build entity IDs using the short ID
        base = f"sensor.waterp1meterkit_{short_id}"
        self._energy_tariff1_sensor = f"{base}_energy_consumed_tariff_1"
        self._energy_tariff2_sensor = f"{base}_energy_consumed_tariff_2"
        self._power_sensor = f"{base}_power_consumed"
        self._gas_sensor = f"{base}_gas_consumed"

        LOGGER.info(
            "WaterP1MeterKit using short_id=%s, sensors: tariff1=%s, power=%s",
            short_id, self._energy_tariff1_sensor, self._power_sensor,
        )

        self._energy_data = EnergyUsageData()

        LOGGER.info("WaterP1MeterKit coordinator initialized")

    def _get_sensor_value(self, entity_id: str) -> float:
        """Get value from a sensor entity."""
        if not entity_id:
            return 0.0

        state = self.hass.states.get(entity_id)
        if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN, ""):
            return 0.0

        try:
            return float(state.state)
        except (ValueError, TypeError):
            return 0.0

    async def _async_update_extra_data(self, data: WaterUsageData) -> None:
        """Add P1/energy data to the water data."""
        # Get energy readings from ESPHome sensors
        tariff1 = self._get_sensor_value(self._energy_tariff1_sensor)
        tariff2 = self._get_sensor_value(self._energy_tariff2_sensor)
        power = self._get_sensor_value(self._power_sensor)
        gas = self._get_sensor_value(self._gas_sensor)

        # Update energy data
        self._energy_data.energy_tariff1_total = tariff1
        self._energy_data.energy_tariff2_total = tariff2
        self._energy_data.energy_total = tariff1 + tariff2
        self._energy_data.power_consumed = power
        self._energy_data.gas_total = gas

        # Store in extra_data for the card to use
        data.extra_data["energy"] = {
            "power_consumed": self._energy_data.power_consumed,
            "energy_total": self._energy_data.energy_total,
            "tariff1_total": self._energy_data.energy_tariff1_total,
            "tariff2_total": self._energy_data.energy_tariff2_total,
            "gas_total": self._energy_data.gas_total,
        }

    @property
    def energy_data(self) -> EnergyUsageData:
        """Return the current energy data."""
        return self._energy_data

    @property
    def short_device_id(self) -> str:
        """Return the short device ID (e.g., '776c6c')."""
        return self._short_device_id
