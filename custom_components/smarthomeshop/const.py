"""Constants for the SmartHomeShop.io integration."""

from __future__ import annotations

import logging
from typing import Final

LOGGER = logging.getLogger(__package__)

DOMAIN: Final = "smarthomeshop"
VERSION: Final = "0.0.8"
MANUFACTURER: Final = "SmartHomeShop.io"

# Product types
PRODUCT_WATERP1METERKIT: Final = "waterp1meterkit"
PRODUCT_WATERMETERKIT: Final = "watermeterkit"
PRODUCT_WATERFLOWKIT: Final = "waterflowkit"
PRODUCT_ULTIMATESENSOR: Final = "ultimatesensor"
PRODUCT_ULTIMATESENSOR_MINI: Final = "ultimatesensor_mini"
PRODUCT_P1METERKIT: Final = "p1meterkit"
PRODUCT_CEILSENSE: Final = "ceilsense"

# Product display names
PRODUCT_NAMES: Final = {
    PRODUCT_WATERP1METERKIT: "WaterP1MeterKit",
    PRODUCT_WATERMETERKIT: "WaterMeterKit",
    PRODUCT_WATERFLOWKIT: "WaterFlowKit",
    PRODUCT_ULTIMATESENSOR: "UltimateSensor",
    PRODUCT_ULTIMATESENSOR_MINI: "UltimateSensor Mini",
    PRODUCT_P1METERKIT: "P1MeterKit",
    PRODUCT_CEILSENSE: "CeilSense",
}

# Product labels shown in Home Assistant's native config flow.
PRODUCT_SELECT_LABELS: Final = {
    PRODUCT_WATERP1METERKIT: "WaterP1MeterKit - P1, water and gas readings",
    PRODUCT_WATERMETERKIT: "WaterMeterKit - smart water meter",
    PRODUCT_WATERFLOWKIT: "WaterFlowKit - dual water flow monitoring",
    PRODUCT_ULTIMATESENSOR: "UltimateSensor - room comfort sensor",
    PRODUCT_ULTIMATESENSOR_MINI: "UltimateSensor Mini - compact room sensor",
    PRODUCT_P1METERKIT: "P1MeterKit - energy meter gateway",
    PRODUCT_CEILSENSE: "CeilSense - ceiling presence sensor",
}

PRODUCT_DESCRIPTIONS: Final = {
    PRODUCT_WATERP1METERKIT: (
        "Combines P1 smart meter data with water and gas monitoring."
    ),
    PRODUCT_WATERMETERKIT: "Adds water usage tracking and leak detection.",
    PRODUCT_WATERFLOWKIT: (
        "Adds flow monitoring for two water lines, including leak detection."
    ),
    PRODUCT_ULTIMATESENSOR: (
        "Adds room comfort and presence sensors for a SmartHomeShop UltimateSensor."
    ),
    PRODUCT_ULTIMATESENSOR_MINI: (
        "Adds compact room comfort and presence sensors."
    ),
    PRODUCT_P1METERKIT: "Adds electricity and gas readings from your P1 smart meter.",
    PRODUCT_CEILSENSE: "Adds ceiling-mounted presence and room sensing.",
}

# Product detection patterns (entity_id patterns)
PRODUCT_PATTERNS: Final = {
    PRODUCT_WATERP1METERKIT: ["waterp1meterkit"],
    PRODUCT_WATERMETERKIT: ["watermeterkit"],
    PRODUCT_WATERFLOWKIT: ["waterflowkit"],
    PRODUCT_ULTIMATESENSOR: ["ultimatesensor"],
    PRODUCT_ULTIMATESENSOR_MINI: ["ultimatesensor_mini", "ultimatesensormini"],
    PRODUCT_P1METERKIT: ["p1meterkit"],
    PRODUCT_CEILSENSE: ["ceilsense"],
}

# ESPHome project detection via the device registry. The ESPHome
# `project: name: "smarthomeshop.<model>"` ends up in the device registry as
# manufacturer "smarthomeshop" and model "<model>". Prefixes are ordered
# most-specific first so "ultimatesensor_mini_v2" resolves to the Mini and
# not to the regular UltimateSensor.
SMARTHOMESHOP_MANUFACTURER: Final = "smarthomeshop"
PRODUCT_MODEL_PREFIXES: Final = (
    ("ultimatesensor_mini", PRODUCT_ULTIMATESENSOR_MINI),
    ("ultimatesensor", PRODUCT_ULTIMATESENSOR),
    ("waterp1meterkit", PRODUCT_WATERP1METERKIT),
    ("watermeterkit", PRODUCT_WATERMETERKIT),
    ("waterflowkit", PRODUCT_WATERFLOWKIT),
    ("p1meterkit", PRODUCT_P1METERKIT),
    ("ceilsense", PRODUCT_CEILSENSE),
)


def product_for_device(manufacturer: str | None, model: str | None) -> str | None:
    """Map device registry manufacturer/model to a SmartHomeShop product type."""
    if (manufacturer or "").lower() != SMARTHOMESHOP_MANUFACTURER:
        return None
    model_key = (model or "").lower().replace("-", "_")
    for prefix, product_type in PRODUCT_MODEL_PREFIXES:
        if model_key.startswith(prefix):
            return product_type
    return None

# Configuration keys
CONF_PRODUCT_TYPE: Final = "product_type"
CONF_DEVICE_ID: Final = "device_id"
CONF_WATER_SENSOR: Final = "water_sensor"
CONF_FLOW_SENSOR: Final = "flow_sensor"

# Leak detection defaults
DEFAULT_CONTINUOUS_FLOW_MINUTES: Final = 30
DEFAULT_NIGHT_START: Final = "00:00"
DEFAULT_NIGHT_END: Final = "06:00"

# Update interval
UPDATE_INTERVAL_SECONDS: Final = 30

# Water leak detection thresholds
LEAK_MIN_FLOW_RATE: Final = 0.1  # L/min
MICRO_LEAK_THRESHOLD: Final = 0.5  # L/min

# Device recognition patterns (L/min)
DEVICE_PATTERNS: Final = {
    "shower": {"min_flow": 8, "max_flow": 12, "min_duration": 300, "max_duration": 900},
    "toilet": {"min_flow": 6, "max_flow": 15, "min_duration": 10, "max_duration": 60},
    "washing_machine": {
        "min_flow": 3,
        "max_flow": 10,
        "min_duration": 1800,
        "max_duration": 5400,
    },
    "dishwasher": {
        "min_flow": 2,
        "max_flow": 6,
        "min_duration": 3600,
        "max_duration": 10800,
    },
    "faucet": {"min_flow": 4, "max_flow": 15, "min_duration": 5, "max_duration": 120},
}

# Energy pricing options (shared by P1MeterKit and WaterP1MeterKit)
CONF_PRICE_T1: Final = "price_electricity_t1"
CONF_PRICE_T2: Final = "price_electricity_t2"
CONF_PRICE_FEED_IN: Final = "price_feed_in"
CONF_PRICE_GAS: Final = "price_gas"
CONF_PRICE_WATER: Final = "price_water"
CONF_MAIN_FUSE_AMPS: Final = "main_fuse_amps"
DEFAULT_PRICE_T1: Final = 0.25   # EUR per kWh
DEFAULT_PRICE_T2: Final = 0.25   # EUR per kWh
DEFAULT_PRICE_FEED_IN: Final = 0.08  # EUR per kWh
DEFAULT_PRICE_GAS: Final = 1.30  # EUR per m3
DEFAULT_PRICE_WATER: Final = 1.55  # EUR per m3
DEFAULT_MAIN_FUSE_AMPS: Final = 25.0

# Events fired by the water leak engine
EVENT_LEAK_DETECTED: Final = "smarthomeshop_leak_detected"
EVENT_LEAK_CLEARED: Final = "smarthomeshop_leak_cleared"

# Advanced leak detection configuration
CONF_LEAK_SCORE_THRESHOLD: Final = "leak_score_threshold"
CONF_MIN_LEARNING_DAYS: Final = "min_learning_days"
CONF_NIGHT_USAGE_THRESHOLD: Final = "night_usage_threshold"
DEFAULT_LEAK_SCORE_THRESHOLD: Final = 60.0
DEFAULT_MIN_LEARNING_DAYS: Final = 7
DEFAULT_NIGHT_USAGE_THRESHOLD: Final = 2.0  # Liters
