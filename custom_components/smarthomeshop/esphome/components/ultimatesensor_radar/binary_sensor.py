"""Binary sensors for UltimateSensor Radar component."""

import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import binary_sensor
from esphome.const import (
    CONF_ID,
    DEVICE_CLASS_OCCUPANCY,
    DEVICE_CLASS_MOTION,
)
from . import (
    UltimateSensorRadarComponent,
    CONF_ULTIMATESENSOR_RADAR_ID,
)

DEPENDENCIES = ["ultimatesensor_radar"]

# Configuration keys
CONF_OCCUPANCY = "occupancy"
CONF_ASSUMED_PRESENT = "assumed_present"
CONF_ZONE_OCCUPANCY = "zone_occupancy"
CONF_TARGET_ACTIVE = "target_active"
CONF_ENTRY_LINE_CROSSED = "entry_line_crossed"
CONF_TARGET = "target"
CONF_ZONE = "zone"
CONF_LINE = "line"

ZONE_BINARY_SENSOR_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_ZONE): cv.int_range(min=1, max=4),
    }
).extend(binary_sensor.binary_sensor_schema(device_class=DEVICE_CLASS_OCCUPANCY))

TARGET_BINARY_SENSOR_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_TARGET): cv.int_range(min=1, max=3),
    }
).extend(binary_sensor.binary_sensor_schema())

LINE_BINARY_SENSOR_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_LINE): cv.int_range(min=1, max=2),
    }
).extend(binary_sensor.binary_sensor_schema(icon="mdi:door-open"))

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(CONF_ULTIMATESENSOR_RADAR_ID): cv.use_id(
            UltimateSensorRadarComponent
        ),
        cv.Optional(CONF_OCCUPANCY): binary_sensor.binary_sensor_schema(
            device_class=DEVICE_CLASS_OCCUPANCY,
        ),
        cv.Optional(CONF_ASSUMED_PRESENT): binary_sensor.binary_sensor_schema(
            device_class=DEVICE_CLASS_OCCUPANCY,
            icon="mdi:account-question",
        ),
        cv.Optional(CONF_ZONE_OCCUPANCY): cv.ensure_list(ZONE_BINARY_SENSOR_SCHEMA),
        cv.Optional(CONF_TARGET_ACTIVE): cv.ensure_list(TARGET_BINARY_SENSOR_SCHEMA),
        cv.Optional(CONF_ENTRY_LINE_CROSSED): cv.ensure_list(LINE_BINARY_SENSOR_SCHEMA),
    }
)


async def to_code(config):
    parent = await cg.get_variable(config[CONF_ULTIMATESENSOR_RADAR_ID])

    if CONF_OCCUPANCY in config:
        sens = await binary_sensor.new_binary_sensor(config[CONF_OCCUPANCY])
        cg.add(parent.set_occupancy_binary_sensor(sens))

    if CONF_ASSUMED_PRESENT in config:
        sens = await binary_sensor.new_binary_sensor(config[CONF_ASSUMED_PRESENT])
        cg.add(parent.set_assumed_present_binary_sensor(sens))

    if CONF_ZONE_OCCUPANCY in config:
        for conf in config[CONF_ZONE_OCCUPANCY]:
            sens = await binary_sensor.new_binary_sensor(conf)
            cg.add(parent.set_zone_occupancy_binary_sensor(conf[CONF_ZONE] - 1, sens))

    if CONF_TARGET_ACTIVE in config:
        for conf in config[CONF_TARGET_ACTIVE]:
            sens = await binary_sensor.new_binary_sensor(conf)
            cg.add(parent.set_target_active_binary_sensor(conf[CONF_TARGET] - 1, sens))

    if CONF_ENTRY_LINE_CROSSED in config:
        for conf in config[CONF_ENTRY_LINE_CROSSED]:
            sens = await binary_sensor.new_binary_sensor(conf)
            cg.add(
                parent.set_entry_line_crossed_binary_sensor(conf[CONF_LINE] - 1, sens)
            )
