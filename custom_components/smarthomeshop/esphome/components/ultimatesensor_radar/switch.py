"""Switch entities for UltimateSensor Radar component."""
import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import switch
from esphome.const import (
    CONF_ID,
    ENTITY_CATEGORY_CONFIG,
)
from . import (
    UltimateSensorRadarComponent,
    CONF_ULTIMATESENSOR_RADAR_ID,
)

DEPENDENCIES = ["ultimatesensor_radar"]

# Configuration keys
CONF_INVERT_X = "invert_x"
CONF_ENTRY_EXIT_ENABLED = "entry_exit_enabled"

ultimatesensor_radar_ns = cg.esphome_ns.namespace("ultimatesensor_radar")
UltimateSensorSwitch = ultimatesensor_radar_ns.class_(
    "UltimateSensorSwitch", switch.Switch, cg.Component
)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(CONF_ULTIMATESENSOR_RADAR_ID): cv.use_id(UltimateSensorRadarComponent),
        cv.Optional(CONF_INVERT_X): switch.switch_schema(
            UltimateSensorSwitch,
            entity_category=ENTITY_CATEGORY_CONFIG,
            icon="mdi:rotate-3d-variant",
        ),
        cv.Optional(CONF_ENTRY_EXIT_ENABLED): switch.switch_schema(
            UltimateSensorSwitch,
            entity_category=ENTITY_CATEGORY_CONFIG,
            icon="mdi:door-open",
        ),
    }
)


async def to_code(config):
    parent = await cg.get_variable(config[CONF_ULTIMATESENSOR_RADAR_ID])

    if CONF_INVERT_X in config:
        s = await switch.new_switch(config[CONF_INVERT_X])
        cg.add(s.set_parent(parent))
        cg.add(s.set_type(0))  # TYPE_INVERT_X

    if CONF_ENTRY_EXIT_ENABLED in config:
        s = await switch.new_switch(config[CONF_ENTRY_EXIT_ENABLED])
        cg.add(s.set_parent(parent))
        cg.add(s.set_type(1))  # TYPE_ENTRY_EXIT_ENABLED

