"""Water meter reading tracking with calibration support.

This module provides:
- A number entity to set/calibrate the current meter reading
- A sensor showing the actual meter reading (calibrated + usage since)
- History of calibrations with timestamps

Example usage:
1. User reads physical meter: 123.456 m³
2. User enters this value in the number entity
3. System stores: calibration_value=123.456, calibration_time=now, pulse_at_calibration=current_pulses
4. Meter reading sensor = calibration_value + (current_pulses - pulse_at_calibration)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import UnitOfVolume
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.util import dt as dt_util

from ....const import LOGGER


@dataclass
class MeterCalibration:
    """A single meter calibration entry."""

    value: float  # The meter reading entered by user (m³)
    timestamp: datetime  # When the calibration was made
    pulse_total_at_calibration: float  # The pulse meter total at calibration time
    note: str = ""  # Optional note (e.g., "Annual check")


@dataclass
class MeterReadingData:
    """Data for meter reading tracking."""

    # Current calibration
    calibration_value: float = 0.0
    calibration_timestamp: datetime | None = None
    pulse_at_calibration: float = 0.0

    # History of calibrations (last 12)
    calibration_history: list[dict[str, Any]] = field(default_factory=list)

    # Current pulse meter total (from ESPHome sensor)
    current_pulse_total: float = 0.0

    @property
    def current_reading(self) -> float:
        """Calculate current meter reading."""
        if self.calibration_timestamp is None:
            return self.current_pulse_total  # No calibration, use raw pulses

        usage_since_calibration = self.current_pulse_total - self.pulse_at_calibration
        return self.calibration_value + max(0, usage_since_calibration)

    def calibrate(self, new_value: float, current_pulses: float, note: str = "") -> None:
        """Set a new calibration point."""
        now = dt_util.utcnow()

        # Store in history
        history_entry = {
            "value": new_value,
            "timestamp": now.isoformat(),
            "pulse_total": current_pulses,
            "previous_value": self.calibration_value,
            "note": note,
        }
        self.calibration_history.append(history_entry)

        # Keep only last 12 calibrations
        if len(self.calibration_history) > 12:
            self.calibration_history = self.calibration_history[-12:]

        # Update current calibration
        self.calibration_value = new_value
        self.calibration_timestamp = now
        self.pulse_at_calibration = current_pulses

        LOGGER.info(
            "Meter calibrated to %.3f m³ at pulse total %.3f",
            new_value, current_pulses
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "calibration_value": self.calibration_value,
            "calibration_timestamp": (
                self.calibration_timestamp.isoformat()
                if self.calibration_timestamp else None
            ),
            "pulse_at_calibration": self.pulse_at_calibration,
            "calibration_history": self.calibration_history,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "MeterReadingData":
        """Create from dictionary."""
        instance = cls()
        instance.calibration_value = data.get("calibration_value", 0.0)

        ts = data.get("calibration_timestamp")
        if ts:
            instance.calibration_timestamp = datetime.fromisoformat(ts)

        instance.pulse_at_calibration = data.get("pulse_at_calibration", 0.0)
        instance.calibration_history = data.get("calibration_history", [])

        return instance


class WaterMeterReadingNumber(NumberEntity, RestoreEntity):
    """Number entity to set/calibrate the water meter reading."""

    _attr_has_entity_name = True
    _attr_name = "Meterstand invoeren (CC)"
    _attr_icon = "mdi:water-check"
    _attr_native_unit_of_measurement = UnitOfVolume.CUBIC_METERS
    _attr_device_class = SensorDeviceClass.WATER
    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.BOX
    _attr_native_min_value = 0
    _attr_native_max_value = 999999.999
    _attr_native_step = 0.001

    def __init__(
        self,
        coordinator,
        config_entry,
        pulse_sensor_entity_id: str,
    ) -> None:
        """Initialize the number entity."""
        self.coordinator = coordinator
        self._config_entry = config_entry
        self._pulse_sensor_entity_id = pulse_sensor_entity_id
        self._attr_unique_id = f"{config_entry.entry_id}_meter_reading_input"

        # Meter reading data
        self._meter_data = MeterReadingData()

        # Link to device
        if coordinator.device_info:
            self._attr_device_info = coordinator.device_info

    async def async_added_to_hass(self) -> None:
        """Restore state when added to hass."""
        await super().async_added_to_hass()

        # Restore previous state
        if (last_state := await self.async_get_last_state()) is not None:
            if last_state.state not in (None, "unknown", "unavailable"):
                try:
                    self._attr_native_value = float(last_state.state)
                except (ValueError, TypeError):
                    self._attr_native_value = 0.0

            # Restore extra attributes
            if last_state.attributes:
                stored_data = last_state.attributes.get("meter_data")
                if stored_data and isinstance(stored_data, dict):
                    self._meter_data = MeterReadingData.from_dict(stored_data)
                    LOGGER.debug("Restored meter data: %s", stored_data)

    @property
    def native_value(self) -> float | None:
        """Return the current calibration value."""
        return self._meter_data.calibration_value or None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return extra attributes for storage and display."""
        attrs = {
            "meter_data": self._meter_data.to_dict(),
            "calibration_count": len(self._meter_data.calibration_history),
        }

        if self._meter_data.calibration_timestamp:
            attrs["last_calibration"] = self._meter_data.calibration_timestamp.isoformat()

        if self._meter_data.calibration_history:
            # Show last 3 calibrations
            attrs["recent_calibrations"] = self._meter_data.calibration_history[-3:]

        return attrs

    async def async_set_native_value(self, value: float) -> None:
        """Set the meter reading calibration."""
        # Get current pulse total from source sensor
        pulse_state = self.hass.states.get(self._pulse_sensor_entity_id)
        current_pulses = 0.0

        if pulse_state and pulse_state.state not in ("unknown", "unavailable"):
            try:
                current_pulses = float(pulse_state.state)
            except (ValueError, TypeError):
                current_pulses = 0.0

        # Calibrate
        self._meter_data.calibrate(value, current_pulses)
        self._attr_native_value = value

        # Notify the meter reading sensor to update
        self.async_write_ha_state()

        # Fire event for other entities to update
        self.hass.bus.async_fire(
            "smarthomeshop_meter_calibrated",
            {
                "entry_id": self._config_entry.entry_id,
                "value": value,
                "pulse_total": current_pulses,
            }
        )

    @property
    def meter_data(self) -> MeterReadingData:
        """Get meter reading data."""
        return self._meter_data


class WaterMeterReadingSensor(SensorEntity, RestoreEntity):
    """Sensor showing the actual water meter reading."""

    _attr_has_entity_name = True
    _attr_name = "Meterstand (CC)"
    _attr_icon = "mdi:counter"
    _attr_native_unit_of_measurement = UnitOfVolume.CUBIC_METERS
    _attr_device_class = SensorDeviceClass.WATER
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_suggested_display_precision = 3

    def __init__(
        self,
        coordinator,
        config_entry,
        pulse_sensor_entity_id: str,
        calibration_number: WaterMeterReadingNumber,
    ) -> None:
        """Initialize the sensor."""
        self.coordinator = coordinator
        self._config_entry = config_entry
        self._pulse_sensor_entity_id = pulse_sensor_entity_id
        self._calibration_number = calibration_number
        self._attr_unique_id = f"{config_entry.entry_id}_meter_reading"

        # Link to device
        if coordinator.device_info:
            self._attr_device_info = coordinator.device_info

        self._remove_listener = None

    async def async_added_to_hass(self) -> None:
        """Subscribe to state changes."""
        await super().async_added_to_hass()

        # Listen to pulse sensor changes
        @callback
        def _handle_state_change(event):
            """Handle state changes - must be called on event loop."""
            if event.data.get("entity_id") == self._pulse_sensor_entity_id:
                self.async_write_ha_state()

        @callback
        def _handle_calibration(event):
            """Handle calibration events - must be called on event loop."""
            if event.data.get("entry_id") == self._config_entry.entry_id:
                self.async_write_ha_state()

        self._remove_listener = self.hass.bus.async_listen(
            "state_changed", _handle_state_change
        )

        # Also listen to calibration events
        self.hass.bus.async_listen(
            "smarthomeshop_meter_calibrated", _handle_calibration
        )

    async def async_will_remove_from_hass(self) -> None:
        """Unsubscribe from events."""
        if self._remove_listener:
            self._remove_listener()

    @property
    def native_value(self) -> float | None:
        """Return the current meter reading."""
        # Get current pulse total
        pulse_state = self.hass.states.get(self._pulse_sensor_entity_id)
        if not pulse_state or pulse_state.state in ("unknown", "unavailable"):
            return None

        try:
            current_pulses = float(pulse_state.state)
        except (ValueError, TypeError):
            return None

        # Get meter data from calibration number
        meter_data = self._calibration_number.meter_data
        meter_data.current_pulse_total = current_pulses

        return round(meter_data.current_reading, 3)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return extra attributes."""
        meter_data = self._calibration_number.meter_data

        attrs = {
            "calibration_value": meter_data.calibration_value,
            "usage_since_calibration": round(
                meter_data.current_pulse_total - meter_data.pulse_at_calibration, 3
            ),
        }

        if meter_data.calibration_timestamp:
            attrs["last_calibration"] = meter_data.calibration_timestamp.isoformat()
            # Calculate days since calibration
            days = (dt_util.utcnow() - meter_data.calibration_timestamp).days
            attrs["days_since_calibration"] = days

        return attrs

