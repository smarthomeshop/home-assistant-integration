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

from ...const import CONF_DEVICE_ID, DOMAIN, LOGGER, UPDATE_INTERVAL_SECONDS


@dataclass
class RoomQualityData:
    """Data class for room quality calculation."""

    score: float
    score_percentage: int
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

    def _find_sensor_entity(self, sensor_type: str) -> str | None:
        """Find the entity_id for a specific sensor type."""
        # Common patterns for UltimateSensor entities
        patterns = {
            "co2": ["co2", "scd41_co2", "scd4x_co2"],
            "temperature": ["temperature", "scd41_temperature", "scd4x_temperature"],
            "humidity": ["humidity", "scd41_humidity", "scd4x_humidity"],
            "pm25": ["pm_2_5", "pm2_5", "pm25"],
            "voc": ["voc_index", "voc"],
            "illuminance": ["illuminance", "bh1750_illuminance", "lux"],
        }

        if sensor_type not in patterns:
            return None

        if not self._device_id:
            LOGGER.debug("No device_id configured, cannot find sensor %s", sensor_type)
            return None

        # Get entity registry
        entity_registry = er.async_get(self.hass)

        # Find all entities for this device directly by device_id
        for entity in entity_registry.entities.values():
            if entity.device_id == self._device_id:
                entity_id_lower = entity.entity_id.lower()
                for pattern in patterns[sensor_type]:
                    if pattern in entity_id_lower:
                        LOGGER.debug("Found sensor %s: %s", sensor_type, entity.entity_id)
                        return entity.entity_id

        LOGGER.debug("No sensor found for type %s on device %s", sensor_type, self._device_id)
        return None

    def _get_sensor_value(self, sensor_type: str) -> float | None:
        """Get the current value of a sensor."""
        # First check cached entity ID
        if sensor_type in self._sensor_ids:
            entity_id = self._sensor_ids[sensor_type]
        else:
            entity_id = self._find_sensor_entity(sensor_type)
            if entity_id:
                self._sensor_ids[sensor_type] = entity_id

        if not entity_id:
            return None

        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unknown", "unavailable"):
            return None

        try:
            return float(state.state)
        except (ValueError, TypeError):
            return None

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
        co2_status = "onbekend"
        if co2 is not None:
            co2_score = 10.0
            if co2 > 2000:
                co2_score = 1.0
                co2_status = "gevaarlijk"
                recommendations.append(("Ventileer nu! CO₂ gevaarlijk hoog", 10))
            elif co2 > 1500:
                co2_score = 3.0
                co2_status = "ongezond"
                recommendations.append(("CO₂ ongezond, ventileer direct", 8))
            elif co2 > 1000:
                co2_score = 5.0
                co2_status = "verhoogd"
                recommendations.append(("Ventileren aanbevolen", 6))
            elif co2 > 800:
                co2_score = 7.0
                co2_status = "matig"
            elif co2 > 600:
                co2_score = 9.0
                co2_status = "goed"
            else:
                co2_status = "uitstekend"

            total_score += co2_score * weights["co2"]
            weight_sum += weights["co2"]

        # === PM2.5 Score (ideal: <12µg/m³, WHO guideline) ===
        pm25_status = "onbekend"
        if pm25 is not None:
            pm25_score = 10.0
            if pm25 > 150:
                pm25_score = 1.0
                pm25_status = "gevaarlijk"
                recommendations.append(("Fijnstof gevaarlijk hoog!", 9))
            elif pm25 > 55:
                pm25_score = 3.0
                pm25_status = "ongezond"
                recommendations.append(("Fijnstof hoog, zet filter aan", 7))
            elif pm25 > 35:
                pm25_score = 5.0
                pm25_status = "verhoogd"
                recommendations.append(("Fijnstof verhoogd", 4))
            elif pm25 > 12:
                pm25_score = 7.0
                pm25_status = "matig"
            else:
                pm25_status = "goed"

            total_score += pm25_score * weights["pm25"]
            weight_sum += weights["pm25"]

        # === VOC Index Score (Sensirion scale: 100=normal, >250=high) ===
        voc_status = "onbekend"
        if voc is not None:
            voc_score = 10.0
            if voc > 400:
                voc_score = 2.0
                voc_status = "hoog"
                recommendations.append(("Hoge VOC, ventileer de ruimte", 5))
            elif voc > 250:
                voc_score = 5.0
                voc_status = "verhoogd"
                recommendations.append(("Verhoogde VOC waarden", 3))
            elif voc > 150:
                voc_score = 7.0
                voc_status = "matig"
            elif voc > 100:
                voc_score = 9.0
                voc_status = "goed"
            else:
                voc_status = "uitstekend"

            total_score += voc_score * weights["voc"]
            weight_sum += weights["voc"]

        # === Temperature Score (ideal: 19-22°C) ===
        temp_status = "onbekend"
        if temperature is not None:
            temp_score = 10.0
            if temperature < 16:
                temp_score = 4.0
                temp_status = "koud"
                recommendations.append(("Verwarm de ruimte", 4))
            elif temperature < 18:
                temp_score = 7.0
                temp_status = "koel"
                recommendations.append(("Het is wat koel", 2))
            elif temperature > 28:
                temp_score = 3.0
                temp_status = "heet"
                recommendations.append(("Koel de ruimte af", 4))
            elif temperature > 25:
                temp_score = 6.0
                temp_status = "warm"
                recommendations.append(("Het is wat warm", 2))
            elif temperature > 22:
                temp_score = 8.0
                temp_status = "goed"
            elif 19 <= temperature <= 22:
                temp_status = "ideaal"
            else:
                temp_score = 9.0
                temp_status = "goed"

            total_score += temp_score * weights["temperature"]
            weight_sum += weights["temperature"]

        # === Humidity Score (ideal: 40-60%) ===
        humidity_status = "onbekend"
        if humidity is not None:
            humidity_score = 10.0
            if humidity < 25:
                humidity_score = 4.0
                humidity_status = "droog"
                recommendations.append(("Lucht te droog", 3))
            elif humidity < 35:
                humidity_score = 7.0
                humidity_status = "vrij droog"
                recommendations.append(("Lucht is droog", 1))
            elif humidity > 75:
                humidity_score = 4.0
                humidity_status = "vochtig"
                recommendations.append(("Lucht te vochtig", 3))
            elif humidity > 65:
                humidity_score = 7.0
                humidity_status = "vrij vochtig"
                recommendations.append(("Lucht is vochtig", 1))
            elif 40 <= humidity <= 60:
                humidity_status = "ideaal"
            else:
                humidity_score = 9.0
                humidity_status = "goed"

            total_score += humidity_score * weights["humidity"]
            weight_sum += weights["humidity"]

        # Calculate final score (weighted average)
        if weight_sum > 0:
            score = total_score / weight_sum
        else:
            score = 5.0  # Default if no sensors available

        # Clamp score
        score = max(0.0, min(10.0, score))

        # Determine label and color based on score
        if score >= 8.5:
            label = "Uitstekend"
            color = "#22C55E"  # Green
        elif score >= 7.0:
            label = "Goed"
            color = "#84CC16"  # Lime
        elif score >= 5.5:
            label = "Redelijk"
            color = "#F59E0B"  # Amber/Orange
        elif score >= 4.0:
            label = "Matig"
            color = "#F97316"  # Orange
        else:
            label = "Slecht"
            color = "#EF4444"  # Red

        # Sort recommendations by priority (highest first) and extract text
        recommendations.sort(key=lambda x: x[1], reverse=True)
        sorted_recommendations = [rec[0] for rec in recommendations[:5]]

        return RoomQualityData(
            score=round(score, 1),
            score_percentage=int(score * 10),
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

