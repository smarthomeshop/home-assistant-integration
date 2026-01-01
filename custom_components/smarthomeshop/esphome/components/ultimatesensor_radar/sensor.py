"""Sensors for UltimateSensor Radar component."""

import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import sensor
from esphome.const import (
    CONF_ID,
    CONF_DISTANCE,
    CONF_SPEED,
    DEVICE_CLASS_DISTANCE,
    ICON_ACCOUNT,
    STATE_CLASS_MEASUREMENT,
    UNIT_MILLIMETER,
    UNIT_DEGREES,
)
from . import (
    UltimateSensorRadarComponent,
    CONF_ULTIMATESENSOR_RADAR_ID,
)

DEPENDENCIES = ["ultimatesensor_radar"]

# Configuration keys
CONF_TARGET_X = "target_x"
CONF_TARGET_Y = "target_y"
CONF_TARGET_SPEED = "target_speed"
CONF_TARGET_DISTANCE = "target_distance"
CONF_TARGET_ANGLE = "target_angle"
CONF_TARGET_RESOLUTION = "target_resolution"
CONF_ZONE_TARGET_COUNT = "zone_target_count"
CONF_PEOPLE_COUNT = "people_count"
CONF_ASSUMED_PRESENT_REMAINING = "assumed_present_remaining"
CONF_TARGET = "target"
CONF_ZONE = "zone"

TARGET_SENSOR_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_TARGET): cv.int_range(min=1, max=3),
    }
).extend(sensor.sensor_schema())

ZONE_SENSOR_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_ZONE): cv.int_range(min=1, max=4),
    }
).extend(sensor.sensor_schema())

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(CONF_ULTIMATESENSOR_RADAR_ID): cv.use_id(
            UltimateSensorRadarComponent
        ),
        cv.Optional(CONF_TARGET_X): cv.ensure_list(
            TARGET_SENSOR_SCHEMA.extend(
                sensor.sensor_schema(
                    unit_of_measurement=UNIT_MILLIMETER,
                    accuracy_decimals=0,
                    state_class=STATE_CLASS_MEASUREMENT,
                )
            )
        ),
        cv.Optional(CONF_TARGET_Y): cv.ensure_list(
            TARGET_SENSOR_SCHEMA.extend(
                sensor.sensor_schema(
                    unit_of_measurement=UNIT_MILLIMETER,
                    accuracy_decimals=0,
                    state_class=STATE_CLASS_MEASUREMENT,
                )
            )
        ),
        cv.Optional(CONF_TARGET_SPEED): cv.ensure_list(
            TARGET_SENSOR_SCHEMA.extend(
                sensor.sensor_schema(
                    unit_of_measurement="cm/s",
                    accuracy_decimals=0,
                    state_class=STATE_CLASS_MEASUREMENT,
                )
            )
        ),
        cv.Optional(CONF_TARGET_DISTANCE): cv.ensure_list(
            TARGET_SENSOR_SCHEMA.extend(
                sensor.sensor_schema(
                    unit_of_measurement=UNIT_MILLIMETER,
                    accuracy_decimals=0,
                    device_class=DEVICE_CLASS_DISTANCE,
                    state_class=STATE_CLASS_MEASUREMENT,
                )
            )
        ),
        cv.Optional(CONF_TARGET_ANGLE): cv.ensure_list(
            TARGET_SENSOR_SCHEMA.extend(
                sensor.sensor_schema(
                    unit_of_measurement=UNIT_DEGREES,
                    accuracy_decimals=1,
                    state_class=STATE_CLASS_MEASUREMENT,
                )
            )
        ),
        cv.Optional(CONF_TARGET_RESOLUTION): cv.ensure_list(
            TARGET_SENSOR_SCHEMA.extend(
                sensor.sensor_schema(
                    unit_of_measurement=UNIT_MILLIMETER,
                    accuracy_decimals=0,
                    state_class=STATE_CLASS_MEASUREMENT,
                )
            )
        ),
        cv.Optional(CONF_ZONE_TARGET_COUNT): cv.ensure_list(
            ZONE_SENSOR_SCHEMA.extend(
                sensor.sensor_schema(
                    accuracy_decimals=0,
                    state_class=STATE_CLASS_MEASUREMENT,
                )
            )
        ),
        cv.Optional(CONF_PEOPLE_COUNT): sensor.sensor_schema(
            icon=ICON_ACCOUNT,
            accuracy_decimals=0,
            state_class=STATE_CLASS_MEASUREMENT,
        ),
        cv.Optional(CONF_ASSUMED_PRESENT_REMAINING): sensor.sensor_schema(
            unit_of_measurement="s",
            icon="mdi:timer-outline",
            accuracy_decimals=0,
            state_class=STATE_CLASS_MEASUREMENT,
        ),
    }
)


async def to_code(config):
    parent = await cg.get_variable(config[CONF_ULTIMATESENSOR_RADAR_ID])

    if CONF_TARGET_X in config:
        for conf in config[CONF_TARGET_X]:
            sens = await sensor.new_sensor(conf)
            cg.add(parent.set_target_x_sensor(conf[CONF_TARGET] - 1, sens))

    if CONF_TARGET_Y in config:
        for conf in config[CONF_TARGET_Y]:
            sens = await sensor.new_sensor(conf)
            cg.add(parent.set_target_y_sensor(conf[CONF_TARGET] - 1, sens))

    if CONF_TARGET_SPEED in config:
        for conf in config[CONF_TARGET_SPEED]:
            sens = await sensor.new_sensor(conf)
            cg.add(parent.set_target_speed_sensor(conf[CONF_TARGET] - 1, sens))

    if CONF_TARGET_DISTANCE in config:
        for conf in config[CONF_TARGET_DISTANCE]:
            sens = await sensor.new_sensor(conf)
            cg.add(parent.set_target_distance_sensor(conf[CONF_TARGET] - 1, sens))

    if CONF_TARGET_ANGLE in config:
        for conf in config[CONF_TARGET_ANGLE]:
            sens = await sensor.new_sensor(conf)
            cg.add(parent.set_target_angle_sensor(conf[CONF_TARGET] - 1, sens))

    if CONF_TARGET_RESOLUTION in config:
        for conf in config[CONF_TARGET_RESOLUTION]:
            sens = await sensor.new_sensor(conf)
            cg.add(parent.set_target_resolution_sensor(conf[CONF_TARGET] - 1, sens))

    if CONF_ZONE_TARGET_COUNT in config:
        for conf in config[CONF_ZONE_TARGET_COUNT]:
            sens = await sensor.new_sensor(conf)
            cg.add(parent.set_zone_target_count_sensor(conf[CONF_ZONE] - 1, sens))

    if CONF_PEOPLE_COUNT in config:
        sens = await sensor.new_sensor(config[CONF_PEOPLE_COUNT])
        cg.add(parent.set_people_count_sensor(sens))

    if CONF_ASSUMED_PRESENT_REMAINING in config:
        sens = await sensor.new_sensor(config[CONF_ASSUMED_PRESENT_REMAINING])
        cg.add(parent.set_assumed_present_remaining_sensor(sens))
