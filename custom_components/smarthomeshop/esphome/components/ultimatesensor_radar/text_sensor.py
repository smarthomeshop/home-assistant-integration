"""Text sensors for UltimateSensor Radar component."""
import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import text_sensor
from . import (
    UltimateSensorRadarComponent,
    CONF_ULTIMATESENSOR_RADAR_ID,
)

DEPENDENCIES = ["ultimatesensor_radar"]

CONF_LAST_CROSSING_DIRECTION = "last_crossing_direction"

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(CONF_ULTIMATESENSOR_RADAR_ID): cv.use_id(UltimateSensorRadarComponent),
        cv.Optional(CONF_LAST_CROSSING_DIRECTION): text_sensor.text_sensor_schema(
            icon="mdi:arrow-left-right",
        ),
    }
)


async def to_code(config):
    parent = await cg.get_variable(config[CONF_ULTIMATESENSOR_RADAR_ID])

    if CONF_LAST_CROSSING_DIRECTION in config:
        sens = await text_sensor.new_text_sensor(config[CONF_LAST_CROSSING_DIRECTION])
        cg.add(parent.set_last_crossing_direction_sensor(sens))

