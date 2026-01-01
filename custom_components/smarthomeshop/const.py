"""Constants for the SmartHomeShop.io integration."""

from __future__ import annotations

import logging
from typing import Final

LOGGER = logging.getLogger(__package__)

DOMAIN: Final = "smarthomeshop"
VERSION: Final = "0.0.3"
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

# Advanced leak detection configuration
CONF_LEAK_SCORE_THRESHOLD: Final = "leak_score_threshold"
CONF_MIN_LEARNING_DAYS: Final = "min_learning_days"
CONF_NIGHT_USAGE_THRESHOLD: Final = "night_usage_threshold"
DEFAULT_LEAK_SCORE_THRESHOLD: Final = 60.0
DEFAULT_MIN_LEARNING_DAYS: Final = 7
DEFAULT_NIGHT_USAGE_THRESHOLD: Final = 2.0  # Liters
