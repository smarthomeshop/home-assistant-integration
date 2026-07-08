"""Coordinator for the P1MeterKit energy gateway."""

from __future__ import annotations

import re
from datetime import timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from ...const import CONF_DEVICE_ID, DOMAIN, LOGGER, UPDATE_INTERVAL_SECONDS
from ..base.p1 import EnergyData, EnergyTracker


class P1MeterKitCoordinator(DataUpdateCoordinator[EnergyData]):
    """Coordinator for P1MeterKit: standby power, month peak and costs."""

    def __init__(self, hass: HomeAssistant, config_entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_p1meterkit",
            update_interval=timedelta(seconds=UPDATE_INTERVAL_SECONDS),
            config_entry=config_entry,
        )
        self._device_id = config_entry.data.get(CONF_DEVICE_ID)
        self._device_info = self._get_source_device_info()

        prefix, short_id = self._resolve_entity_prefix()
        self.entity_prefix = prefix
        self.short_device_id = short_id
        self.energy_tracker = EnergyTracker(
            hass, config_entry, prefix, f"p1_{short_id}"
        )

        LOGGER.info(
            "P1MeterKit coordinator using prefix=%s short_id=%s", prefix, short_id
        )

    def _resolve_entity_prefix(self) -> tuple[str, str]:
        """Find the ESPHome entity prefix for this device.

        Looks for the power_consumed sensor that belongs to the configured
        device so renamed devices keep working.
        """
        if self._device_id:
            ent_reg = er.async_get(self.hass)
            for entity in er.async_entries_for_device(ent_reg, self._device_id):
                match = re.match(r"^sensor\.(.+)_power_consumed$", entity.entity_id)
                if match:
                    slug = match.group(1)
                    return f"sensor.{slug}", self._short_id_from_slug(slug)

        # Fallback: first p1meterkit power sensor in the state machine
        for entity_id in self.hass.states.async_entity_ids("sensor"):
            match = re.match(r"^sensor\.(p1meterkit[^.]*)_power_consumed$", entity_id)
            if match:
                slug = match.group(1)
                return f"sensor.{slug}", self._short_id_from_slug(slug)

        LOGGER.warning("P1MeterKit: no power_consumed sensor found yet")
        return "sensor.p1meterkit", "unknown"

    @staticmethod
    def _short_id_from_slug(slug: str) -> str:
        tail = slug.rsplit("_", 1)[-1]
        return tail if re.fullmatch(r"[a-f0-9]{6,}", tail) else slug

    def _get_source_device_info(self) -> DeviceInfo | None:
        """Link our entities to the existing ESPHome device."""
        if not self._device_id:
            return None
        device = dr.async_get(self.hass).async_get(self._device_id)
        if not device:
            return None
        if device.identifiers:
            return DeviceInfo(identifiers=device.identifiers)
        if device.connections:
            return DeviceInfo(connections=device.connections)
        return None

    @property
    def device_info(self) -> DeviceInfo | None:
        return self._device_info

    async def _async_update_data(self) -> EnergyData:
        await self.energy_tracker.async_load_ha_prices()
        return self.energy_tracker.update()
