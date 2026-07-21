"""Coordinator for UltimateSensor products."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import slugify

from ...const import CONF_DEVICE_ID, DOMAIN, LOGGER, UPDATE_INTERVAL_SECONDS


@dataclass
class RoomQualityData:
    """Data class for room quality calculation."""

    score: float | None
    score_percentage: int | None
    label: str
    color: str
    recommendations: list[str]
    co2: float | None
    co2_status: str
    pm25: float | None
    pm25_status: str
    voc: float | None
    voc_status: str
    temperature: float | None
    temperature_status: str
    humidity: float | None
    humidity_status: str
    illuminance: float | None


class UltimateSensorCoordinator(DataUpdateCoordinator[RoomQualityData]):
    """Coordinator for UltimateSensor data updates."""

    def __init__(self, hass: HomeAssistant, config_entry: ConfigEntry) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_ultimatesensor",
            update_interval=timedelta(seconds=UPDATE_INTERVAL_SECONDS),
            config_entry=config_entry,
        )
        self._config_entry = config_entry
        self._device_id = config_entry.data.get(CONF_DEVICE_ID)

        # Get device info from source ESPHome device (links to existing device)
        self._device_info = self._get_source_device_info()

        # Sensor entity IDs (populated during first update)
        self._sensor_ids: dict[str, str] = {}

    def _get_source_device_info(self) -> DeviceInfo | None:
        """Get device info from the source ESPHome device to link entities."""
        if not self._device_id:
            LOGGER.warning("No device_id configured for UltimateSensor")
            return None

        device_registry = dr.async_get(self.hass)
        device = device_registry.async_get(self._device_id)

        if not device:
            LOGGER.warning("Device %s not found in registry", self._device_id)
            return None

        # Link to existing device via identifiers - this merges with ESPHome device
        if device.identifiers:
            LOGGER.info("Linking UltimateSensor to existing device: %s", device.name)
            return DeviceInfo(identifiers=device.identifiers)
        if device.connections:
            return DeviceInfo(connections=device.connections)

        return None

    @property
    def device_info(self) -> DeviceInfo | None:
        """Return device info - links to existing ESPHome device."""
        return self._device_info

    def _entity_match_key(self, entity) -> str:
        """Slug of the entity's own name, without the device-name prefix.

        ESPHome sets original_name to the configured entity name ("SCD41
        Temperature"). Only when that is missing do we fall back to the
        object_id with the device slug stripped off.
        """
        name = entity.name or entity.original_name
        if name:
            return slugify(name)
        object_id = entity.entity_id.split(".", 1)[1].lower()
        device_slug = self._device_slug()
        if device_slug and object_id.startswith(f"{device_slug}_"):
            return object_id[len(device_slug) + 1:]
        return object_id

    def _device_slug(self) -> str:
        """Slug of this device's name, used to strip the entity_id prefix."""
        if self._device_id is None:
            return ""
        device = dr.async_get(self.hass).async_get(self._device_id)
        if device is None:
            return ""
        return slugify(device.name_by_user or device.name or "")

    def _find_sensor_entity(self, sensor_type: str) -> str | None:
        """Find the entity_id for a specific sensor type."""
        # Common patterns for UltimateSensor entities
        # Most specific pattern first: a device exposes several entities that
        # end in "_temperature" (the SCD41 climate sensor and the ESP32 chip
        # temperature), and the climate sensor is the one that measures the
        # room. Generic patterns stay last as a fallback for other hardware.
        patterns = {
            "co2": ["scd41_co2", "scd4x_co2", "co2"],
            "temperature": [
                "scd41_temperature",
                "scd4x_temperature",
                "sht4x_temperature",
                "bme280_temperature",
                "aht10_temperature",
                "temperature",
            ],
            "humidity": [
                "scd41_humidity",
                "scd4x_humidity",
                "sht4x_humidity",
                "bme280_humidity",
                "aht10_humidity",
                "humidity",
            ],
            # Air quality is scored in ug/m3, so the weight concentration is
            # the one to read; the particle count is a different unit. The
            # v1 firmware writes "PM <2.5um ..." with a micro sign, which
            # slugifies to "2_5mm", while v2 writes a plain "um".
            "pm25": [
                "pm_2_5mm_weight_concentration",
                "pm_2_5um_weight_concentration",
                "pm_2_5_weight_concentration",
                "pm2_5_weight_concentration",
                "pm_2_5",
                "pm2_5",
                "pm25",
            ],
            "voc": ["voc_index", "voc"],
            "illuminance": ["bh1750_illuminance", "illuminance", "lux"],
        }

        if sensor_type not in patterns:
            return None

        if not self._device_id:
            LOGGER.debug("No device_id configured, cannot find sensor %s", sensor_type)
            return None

        # Get entity registry
        entity_registry = er.async_get(self.hass)

        # Collect this device's sensor entities, skipping settings/diagnostic
        # entities that share the same words (offsets, calibration targets).
        # Board diagnostics ("CPU temperature") measure the chip, not the
        # room, and must never be read as a climate value.
        excluded = (
            "offset",
            "calibrat",
            "target",
            "interval",
            "threshold",
            "manual",
            "cpu",
            "esp32",
            "chip_temp",
            "internal_temp",
            "board_temp",
            # Particle counts (#/cm3) are never the air-quality value we score.
            "number_concentration",
        )
        # Match on the entity's OWN name, never on the full entity_id: the
        # entity_id also carries the device name, so a device called
        # "CO2 meter" or "ESP32 hal" would otherwise match or exclude every
        # entity it owns.
        candidates: list[tuple[str, str]] = []
        for entity in entity_registry.entities.values():
            if entity.device_id != self._device_id:
                continue
            if entity.domain != "sensor":
                continue
            key = self._entity_match_key(entity)
            if any(word in key for word in excluded):
                continue
            candidates.append((entity.entity_id, key))
        # Sorted so the choice is deterministic instead of registry-order
        # dependent.
        candidates.sort()

        # Prefer an exact suffix match (e.g. ..._co2); fall back to a
        # substring match only when no suffix match exists.
        for pattern in patterns[sensor_type]:
            for entity_id, key in candidates:
                if key.endswith(f"_{pattern}") or key == pattern:
                    LOGGER.debug("Found sensor %s: %s", sensor_type, entity_id)
                    return entity_id
        for pattern in patterns[sensor_type]:
            for entity_id, key in candidates:
                if pattern in key:
                    LOGGER.debug("Found sensor %s (substring): %s", sensor_type, entity_id)
                    return entity_id

        LOGGER.debug("No sensor found for type %s on device %s", sensor_type, self._device_id)
        return None

    def _get_sensor_value(self, sensor_type: str) -> float | None:
        """Get the current value of a sensor."""
        # Cached entity id, revalidated: a renamed/removed entity must not
        # pin the lookup to a dead id forever.
        entity_id = self._sensor_ids.get(sensor_type)
        if entity_id and self.hass.states.get(entity_id) is None:
            self._sensor_ids.pop(sensor_type, None)
            entity_id = None
        if not entity_id:
            entity_id = self._find_sensor_entity(sensor_type)
            if entity_id:
                self._sensor_ids[sensor_type] = entity_id

        if not entity_id:
            return None

        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unknown", "unavailable"):
            return None

        try:
            value = float(state.state)
        except (ValueError, TypeError):
            return None

        # Home Assistant serves sensor states in the user's display unit, so
        # a household on Fahrenheit would be scored against Celsius comfort
        # bands. Bring temperature back to Celsius before scoring.
        if sensor_type == "temperature":
            unit = str(state.attributes.get("unit_of_measurement") or "")
            if unit.strip().upper().endswith("F"):
                value = (value - 32) * 5 / 9
        return value

    def _calculate_room_quality(self) -> RoomQualityData:
        """Calculate room quality score using weighted average method.

        Weights based on health impact:
        - CO2: 30% (primary ventilation indicator)
        - PM2.5: 25% (direct health impact from particulates)
        - VOC: 15% (chemical pollutants)
        - Temperature: 15% (comfort)
        - Humidity: 15% (comfort + health)

        Each sensor gets a score 0-10, then weighted average is calculated.
        If a sensor is unavailable, its weight is redistributed.
        """
        recommendations: list[tuple[str, int]] = []  # (text, priority)
        total_score = 0.0
        weight_sum = 0.0

        # Sensor weights
        weights = {
            "co2": 0.30,
            "pm25": 0.25,
            "voc": 0.15,
            "temperature": 0.15,
            "humidity": 0.15,
        }

        # Get sensor values
        co2 = self._get_sensor_value("co2")
        pm25 = self._get_sensor_value("pm25")
        voc = self._get_sensor_value("voc")
        temperature = self._get_sensor_value("temperature")
        humidity = self._get_sensor_value("humidity")
        illuminance = self._get_sensor_value("illuminance")

        # === CO2 Score (ideal: <600ppm, bad: >2000ppm) ===
        co2_status = "unknown"
        if co2 is not None:
            co2_score = 10.0
            if co2 > 2000:
                co2_score = 1.0
                co2_status = "dangerous"
                recommendations.append(("Ventilate now! CO₂ dangerously high", 10))
            elif co2 > 1500:
                co2_score = 3.0
                co2_status = "unhealthy"
                recommendations.append(("CO₂ unhealthy, ventilate immediately", 8))
            elif co2 > 1000:
                co2_score = 5.0
                co2_status = "elevated"
                recommendations.append(("Ventilation recommended", 6))
            elif co2 > 800:
                co2_score = 7.0
                co2_status = "moderate"
            elif co2 > 600:
                co2_score = 9.0
                co2_status = "good"
            else:
                co2_status = "excellent"

            total_score += co2_score * weights["co2"]
            weight_sum += weights["co2"]

        # === PM2.5 Score (ideal: <12µg/m³, WHO guideline) ===
        pm25_status = "unknown"
        if pm25 is not None:
            pm25_score = 10.0
            if pm25 > 150:
                pm25_score = 1.0
                pm25_status = "dangerous"
                recommendations.append(("Particulate matter dangerously high!", 9))
            elif pm25 > 55:
                pm25_score = 3.0
                pm25_status = "unhealthy"
                recommendations.append(("Particulate matter high, turn on air filtering", 7))
            elif pm25 > 35:
                pm25_score = 5.0
                pm25_status = "elevated"
                recommendations.append(("Particulate matter elevated", 4))
            elif pm25 > 12:
                pm25_score = 7.0
                pm25_status = "moderate"
            else:
                pm25_status = "good"

            total_score += pm25_score * weights["pm25"]
            weight_sum += weights["pm25"]

        # === VOC Index Score (Sensirion scale: 100=normal, >250=high) ===
        voc_status = "unknown"
        if voc is not None:
            voc_score = 10.0
            if voc > 400:
                voc_score = 2.0
                voc_status = "high"
                recommendations.append(("High VOC, ventilate the room", 5))
            elif voc > 250:
                voc_score = 5.0
                voc_status = "elevated"
                recommendations.append(("Elevated VOC levels", 3))
            elif voc > 150:
                voc_score = 7.0
                voc_status = "moderate"
            elif voc > 100:
                voc_score = 9.0
                voc_status = "good"
            else:
                voc_status = "excellent"

            total_score += voc_score * weights["voc"]
            weight_sum += weights["voc"]

        # === Temperature Score (ideal: 19-22°C) ===
        temp_status = "unknown"
        if temperature is not None:
            temp_score = 10.0
            if temperature < 16:
                temp_score = 4.0
                temp_status = "cold"
                recommendations.append(("Warm up the room", 4))
            elif temperature < 18:
                temp_score = 7.0
                temp_status = "cool"
                recommendations.append(("It is a bit cool", 2))
            elif temperature > 28:
                temp_score = 3.0
                temp_status = "hot"
                recommendations.append(("Cool down the room", 4))
            elif temperature > 25:
                temp_score = 6.0
                temp_status = "warm"
                recommendations.append(("It is a bit warm", 2))
            elif temperature > 22:
                temp_score = 8.0
                temp_status = "good"
            elif 19 <= temperature <= 22:
                temp_status = "ideal"
            else:
                temp_score = 9.0
                temp_status = "good"

            total_score += temp_score * weights["temperature"]
            weight_sum += weights["temperature"]

        # === Humidity Score (ideal: 40-60%) ===
        humidity_status = "unknown"
        if humidity is not None:
            humidity_score = 10.0
            if humidity < 25:
                humidity_score = 4.0
                humidity_status = "dry"
                recommendations.append(("Air too dry", 3))
            elif humidity < 35:
                humidity_score = 7.0
                humidity_status = "fairly dry"
                recommendations.append(("Air is dry", 1))
            elif humidity > 75:
                humidity_score = 4.0
                humidity_status = "humid"
                recommendations.append(("Air too humid", 3))
            elif humidity > 65:
                humidity_score = 7.0
                humidity_status = "fairly humid"
                recommendations.append(("Air is humid", 1))
            elif 40 <= humidity <= 60:
                humidity_status = "ideal"
            else:
                humidity_score = 9.0
                humidity_status = "good"

            total_score += humidity_score * weights["humidity"]
            weight_sum += weights["humidity"]

        # Calculate final score (weighted average). With no readable sensors
        # (device offline) report unknown instead of inventing a mid-scale
        # score that looks like a real reading.
        if weight_sum > 0:
            score = max(0.0, min(10.0, total_score / weight_sum))
        else:
            score = None

        # Determine label and color based on score
        if score is None:
            label = "Unknown"
            color = "#9CA3AF"  # Gray
        elif score >= 8.5:
            label = "Excellent"
            color = "#22C55E"  # Green
        elif score >= 7.0:
            label = "Good"
            color = "#84CC16"  # Lime
        elif score >= 5.5:
            label = "Fair"
            color = "#F59E0B"  # Amber/Orange
        elif score >= 4.0:
            label = "Moderate"
            color = "#F97316"  # Orange
        else:
            label = "Poor"
            color = "#EF4444"  # Red

        # Sort recommendations by priority (highest first) and extract text
        recommendations.sort(key=lambda x: x[1], reverse=True)
        sorted_recommendations = [rec[0] for rec in recommendations[:5]]

        return RoomQualityData(
            score=round(score, 1) if score is not None else None,
            score_percentage=int(score * 10) if score is not None else None,
            label=label,
            color=color,
            recommendations=sorted_recommendations,
            co2=co2,
            co2_status=co2_status,
            pm25=pm25,
            pm25_status=pm25_status,
            voc=voc,
            voc_status=voc_status,
            temperature=temperature,
            temperature_status=temp_status,
            humidity=humidity,
            humidity_status=humidity_status,
            illuminance=illuminance,
        )

    async def _async_update_data(self) -> RoomQualityData:
        """Fetch and calculate room quality data."""
        LOGGER.debug("Updating UltimateSensor room quality data")
        return self._calculate_room_quality()

