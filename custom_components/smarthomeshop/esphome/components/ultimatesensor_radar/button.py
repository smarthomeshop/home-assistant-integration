"""Button entities for UltimateSensor Radar component."""
import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import button
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
CONF_RESET_PEOPLE_COUNT = "reset_people_count"

ultimatesensor_radar_ns = cg.esphome_ns.namespace("ultimatesensor_radar")
UltimateSensorButton = ultimatesensor_radar_ns.class_(
    "UltimateSensorButton", button.Button, cg.Component
)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(CONF_ULTIMATESENSOR_RADAR_ID): cv.use_id(UltimateSensorRadarComponent),
        cv.Optional(CONF_RESET_PEOPLE_COUNT): button.button_schema(
            UltimateSensorButton,
            entity_category=ENTITY_CATEGORY_CONFIG,
            icon="mdi:account-remove",
        ),
    }
)


async def to_code(config):
    parent = await cg.get_variable(config[CONF_ULTIMATESENSOR_RADAR_ID])

    if CONF_RESET_PEOPLE_COUNT in config:
        b = await button.new_button(config[CONF_RESET_PEOPLE_COUNT])
        cg.add(b.set_parent(parent))
        cg.add(b.set_type(0))  # TYPE_RESET_PEOPLE_COUNT

