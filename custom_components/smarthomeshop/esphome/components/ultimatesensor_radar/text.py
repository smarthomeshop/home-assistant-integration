"""Text entities for UltimateSensor Radar component."""
import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import text
from esphome.const import (
    CONF_ID,
    CONF_MODE,
    ENTITY_CATEGORY_CONFIG,
)
from . import (
    UltimateSensorRadarComponent,
    CONF_ULTIMATESENSOR_RADAR_ID,
)

DEPENDENCIES = ["ultimatesensor_radar"]

# Configuration keys
CONF_POLYGON_ZONES = "polygon_zones"
CONF_POLYGON_EXCLUSIONS = "polygon_exclusions"
CONF_POLYGON_ENTRIES = "polygon_entries"
CONF_ENTRY_LINES = "entry_lines"

ultimatesensor_radar_ns = cg.esphome_ns.namespace("ultimatesensor_radar")
UltimateSensorText = ultimatesensor_radar_ns.class_(
    "UltimateSensorText", text.Text, cg.Component
)

POLYGON_ZONE_SCHEMA = cv.Schema(
    {
        cv.Required("zone"): cv.int_range(min=1, max=4),
    }
).extend(
    text.text_schema(
        UltimateSensorText,
        entity_category=ENTITY_CATEGORY_CONFIG,
    )
)

POLYGON_EXCLUSION_SCHEMA = cv.Schema(
    {
        cv.Required("zone"): cv.int_range(min=1, max=2),
    }
).extend(
    text.text_schema(
        UltimateSensorText,
        entity_category=ENTITY_CATEGORY_CONFIG,
    )
)

POLYGON_ENTRY_SCHEMA = cv.Schema(
    {
        cv.Required("zone"): cv.int_range(min=1, max=2),
    }
).extend(
    text.text_schema(
        UltimateSensorText,
        entity_category=ENTITY_CATEGORY_CONFIG,
    )
)

ENTRY_LINE_SCHEMA = cv.Schema(
    {
        cv.Required("line"): cv.int_range(min=1, max=2),
    }
).extend(
    text.text_schema(
        UltimateSensorText,
        entity_category=ENTITY_CATEGORY_CONFIG,
    )
)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(CONF_ULTIMATESENSOR_RADAR_ID): cv.use_id(UltimateSensorRadarComponent),
        cv.Optional(CONF_POLYGON_ZONES): cv.ensure_list(POLYGON_ZONE_SCHEMA),
        cv.Optional(CONF_POLYGON_EXCLUSIONS): cv.ensure_list(POLYGON_EXCLUSION_SCHEMA),
        cv.Optional(CONF_POLYGON_ENTRIES): cv.ensure_list(POLYGON_ENTRY_SCHEMA),
        cv.Optional(CONF_ENTRY_LINES): cv.ensure_list(ENTRY_LINE_SCHEMA),
    }
)


async def to_code(config):
    parent = await cg.get_variable(config[CONF_ULTIMATESENSOR_RADAR_ID])

    if CONF_POLYGON_ZONES in config:
        for conf in config[CONF_POLYGON_ZONES]:
            t = await text.new_text(conf)
            cg.add(t.set_parent(parent))
            cg.add(t.set_type(0 + conf["zone"] - 1))  # TYPE_POLYGON_ZONE_1-4

    if CONF_POLYGON_EXCLUSIONS in config:
        for conf in config[CONF_POLYGON_EXCLUSIONS]:
            t = await text.new_text(conf)
            cg.add(t.set_parent(parent))
            cg.add(t.set_type(10 + conf["zone"] - 1))  # TYPE_POLYGON_EXCLUSION_1-2

    if CONF_POLYGON_ENTRIES in config:
        for conf in config[CONF_POLYGON_ENTRIES]:
            t = await text.new_text(conf)
            cg.add(t.set_parent(parent))
            cg.add(t.set_type(20 + conf["zone"] - 1))  # TYPE_POLYGON_ENTRY_1-2

    if CONF_ENTRY_LINES in config:
        for conf in config[CONF_ENTRY_LINES]:
            t = await text.new_text(conf)
            cg.add(t.set_parent(parent))
            cg.add(t.set_type(30 + conf["line"] - 1))  # TYPE_ENTRY_LINE_1-2

