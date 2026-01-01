"""Number entities for UltimateSensor Radar component."""
import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import number
from esphome.const import (
    CONF_ID,
    CONF_MODE,
    UNIT_MILLIMETER,
    UNIT_SECOND,
    UNIT_PERCENT,
    ENTITY_CATEGORY_CONFIG,
)
from . import (
    UltimateSensorRadarComponent,
    CONF_ULTIMATESENSOR_RADAR_ID,
)

DEPENDENCIES = ["ultimatesensor_radar"]

# Configuration keys
CONF_MAX_DISTANCE = "max_distance"
CONF_INSTALLATION_ANGLE = "installation_angle"
CONF_ASSUMED_PRESENT_TIMEOUT = "assumed_present_timeout"
CONF_EXIT_THRESHOLD_PCT = "exit_threshold_pct"
CONF_OCCUPANCY_OFF_DELAY = "occupancy_off_delay"
CONF_ZONE_OFF_DELAYS = "zone_off_delays"
CONF_ZONE_COORDINATES = "zone_coordinates"
CONF_EXCLUSION_COORDINATES = "exclusion_coordinates"
CONF_ENTRY_ZONE_COORDINATES = "entry_zone_coordinates"

ultimatesensor_radar_ns = cg.esphome_ns.namespace("ultimatesensor_radar")
UltimateSensorNumber = ultimatesensor_radar_ns.class_(
    "UltimateSensorNumber", number.Number, cg.Component
)

ZONE_OFF_DELAY_SCHEMA = cv.Schema(
    {
        cv.Required("zone"): cv.int_range(min=1, max=4),
    }
).extend(
    number.number_schema(
        UltimateSensorNumber,
        unit_of_measurement=UNIT_SECOND,
        entity_category=ENTITY_CATEGORY_CONFIG,
    )
)

ZONE_COORD_SCHEMA = cv.Schema(
    {
        cv.Required("zone"): cv.int_range(min=1, max=4),
        cv.Required("coord"): cv.one_of("begin_x", "end_x", "begin_y", "end_y"),
    }
).extend(number.number_schema(UltimateSensorNumber, unit_of_measurement=UNIT_MILLIMETER))

EXCLUSION_COORD_SCHEMA = cv.Schema(
    {
        cv.Required("zone"): cv.int_range(min=1, max=2),
        cv.Required("coord"): cv.one_of("begin_x", "end_x", "begin_y", "end_y"),
    }
).extend(
    number.number_schema(
        UltimateSensorNumber,
        unit_of_measurement=UNIT_MILLIMETER,
        entity_category=ENTITY_CATEGORY_CONFIG,
    )
)

ENTRY_ZONE_COORD_SCHEMA = cv.Schema(
    {
        cv.Required("zone"): cv.int_range(min=1, max=2),
        cv.Required("coord"): cv.one_of("begin_x", "end_x", "begin_y", "end_y"),
    }
).extend(
    number.number_schema(
        UltimateSensorNumber,
        unit_of_measurement=UNIT_MILLIMETER,
        entity_category=ENTITY_CATEGORY_CONFIG,
    )
)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(CONF_ULTIMATESENSOR_RADAR_ID): cv.use_id(UltimateSensorRadarComponent),
        cv.Optional(CONF_MAX_DISTANCE): number.number_schema(
            UltimateSensorNumber,
            unit_of_measurement="cm",
        ),
        cv.Optional(CONF_INSTALLATION_ANGLE): number.number_schema(
            UltimateSensorNumber,
            unit_of_measurement="°",
        ),
        cv.Optional(CONF_ASSUMED_PRESENT_TIMEOUT): number.number_schema(
            UltimateSensorNumber,
            unit_of_measurement=UNIT_SECOND,
            entity_category=ENTITY_CATEGORY_CONFIG,
        ),
        cv.Optional(CONF_EXIT_THRESHOLD_PCT): number.number_schema(
            UltimateSensorNumber,
            unit_of_measurement=UNIT_PERCENT,
            entity_category=ENTITY_CATEGORY_CONFIG,
        ),
        cv.Optional(CONF_OCCUPANCY_OFF_DELAY): number.number_schema(
            UltimateSensorNumber,
            unit_of_measurement=UNIT_SECOND,
            entity_category=ENTITY_CATEGORY_CONFIG,
        ),
        cv.Optional(CONF_ZONE_OFF_DELAYS): cv.ensure_list(ZONE_OFF_DELAY_SCHEMA),
        cv.Optional(CONF_ZONE_COORDINATES): cv.ensure_list(ZONE_COORD_SCHEMA),
        cv.Optional(CONF_EXCLUSION_COORDINATES): cv.ensure_list(EXCLUSION_COORD_SCHEMA),
        cv.Optional(CONF_ENTRY_ZONE_COORDINATES): cv.ensure_list(ENTRY_ZONE_COORD_SCHEMA),
    }
)


async def to_code(config):
    parent = await cg.get_variable(config[CONF_ULTIMATESENSOR_RADAR_ID])

    if CONF_MAX_DISTANCE in config:
        n = await number.new_number(
            config[CONF_MAX_DISTANCE],
            min_value=0,
            max_value=600,
            step=1,
        )
        cg.add(n.set_parent(parent))
        cg.add(n.set_type(0))  # TYPE_MAX_DISTANCE

    if CONF_INSTALLATION_ANGLE in config:
        n = await number.new_number(
            config[CONF_INSTALLATION_ANGLE],
            min_value=-45,
            max_value=45,
            step=1,
        )
        cg.add(n.set_parent(parent))
        cg.add(n.set_type(1))  # TYPE_INSTALLATION_ANGLE

    if CONF_ASSUMED_PRESENT_TIMEOUT in config:
        n = await number.new_number(
            config[CONF_ASSUMED_PRESENT_TIMEOUT],
            min_value=0,
            max_value=300,
            step=1,
        )
        cg.add(n.set_parent(parent))
        cg.add(n.set_type(2))  # TYPE_ASSUMED_PRESENT_TIMEOUT

    if CONF_EXIT_THRESHOLD_PCT in config:
        n = await number.new_number(
            config[CONF_EXIT_THRESHOLD_PCT],
            min_value=0,
            max_value=100,
            step=5,
        )
        cg.add(n.set_parent(parent))
        cg.add(n.set_type(3))  # TYPE_EXIT_THRESHOLD

    if CONF_OCCUPANCY_OFF_DELAY in config:
        n = await number.new_number(
            config[CONF_OCCUPANCY_OFF_DELAY],
            min_value=0,
            max_value=600,
            step=1,
        )
        cg.add(n.set_parent(parent))
        cg.add(n.set_type(4))  # TYPE_OCCUPANCY_OFF_DELAY

    if CONF_ZONE_OFF_DELAYS in config:
        for conf in config[CONF_ZONE_OFF_DELAYS]:
            n = await number.new_number(conf, min_value=0, max_value=600, step=1)
            cg.add(n.set_parent(parent))
            cg.add(n.set_type(10 + conf["zone"] - 1))  # TYPE_ZONE_OFF_DELAY_1-4

    if CONF_ZONE_COORDINATES in config:
        for conf in config[CONF_ZONE_COORDINATES]:
            zone = conf["zone"]
            coord = conf["coord"]
            coord_idx = {"begin_x": 0, "end_x": 1, "begin_y": 2, "end_y": 3}[coord]
            min_val = -4000 if "x" in coord else 0
            max_val = 4000 if "x" in coord else 6000
            n = await number.new_number(conf, min_value=min_val, max_value=max_val, step=10)
            cg.add(n.set_parent(parent))
            cg.add(n.set_type(20 + (zone - 1) * 4 + coord_idx))  # TYPE_ZONE_COORD

    if CONF_EXCLUSION_COORDINATES in config:
        for conf in config[CONF_EXCLUSION_COORDINATES]:
            zone = conf["zone"]
            coord = conf["coord"]
            coord_idx = {"begin_x": 0, "end_x": 1, "begin_y": 2, "end_y": 3}[coord]
            min_val = -4000 if "x" in coord else 0
            max_val = 4000 if "x" in coord else 6000
            n = await number.new_number(conf, min_value=min_val, max_value=max_val, step=10)
            cg.add(n.set_parent(parent))
            cg.add(n.set_type(40 + (zone - 1) * 4 + coord_idx))  # TYPE_EXCLUSION_COORD

    if CONF_ENTRY_ZONE_COORDINATES in config:
        for conf in config[CONF_ENTRY_ZONE_COORDINATES]:
            zone = conf["zone"]
            coord = conf["coord"]
            coord_idx = {"begin_x": 0, "end_x": 1, "begin_y": 2, "end_y": 3}[coord]
            min_val = -4000 if "x" in coord else 0
            max_val = 4000 if "x" in coord else 6000
            n = await number.new_number(conf, min_value=min_val, max_value=max_val, step=10)
            cg.add(n.set_parent(parent))
            cg.add(n.set_type(50 + (zone - 1) * 4 + coord_idx))  # TYPE_ENTRY_ZONE_COORD

