"""UltimateSensor Radar - Advanced LD2450 component with polygon zones and people counting."""

import esphome.codegen as cg
from esphome.components import uart
import esphome.config_validation as cv
from esphome.const import CONF_ID

CODEOWNERS = ["@smarthomeshop"]
DEPENDENCIES = ["uart"]
MULTI_CONF = True

ultimatesensor_radar_ns = cg.esphome_ns.namespace("ultimatesensor_radar")
UltimateSensorRadarComponent = ultimatesensor_radar_ns.class_(
    "UltimateSensorRadarComponent", cg.Component, uart.UARTDevice
)

CONF_ULTIMATESENSOR_RADAR_ID = "ultimatesensor_radar_id"
CONF_MAX_DISTANCE = "max_distance"
CONF_INSTALLATION_ANGLE = "installation_angle"
CONF_INVERT_X = "invert_x"

# Entry/exit detection configs
CONF_ENTRY_EXIT_ENABLED = "entry_exit_enabled"
CONF_ASSUMED_PRESENT_TIMEOUT = "assumed_present_timeout"
CONF_EXIT_THRESHOLD_PCT = "exit_threshold_pct"
CONF_OCCUPANCY_OFF_DELAY = "occupancy_off_delay"
CONF_ZONE_OFF_DELAY = "zone_off_delay"

# Polygon zone configs
CONF_POLYGON_ZONES = "polygon_zones"
CONF_POLYGON = "polygon"
CONF_ZONE_ID = "zone_id"

# Entry line configs
CONF_ENTRY_LINES = "entry_lines"
CONF_LINE = "line"
CONF_LINE_ID = "line_id"

# Exclusion zone configs
CONF_EXCLUSION_ZONES = "exclusion_zones"

# Entry zone configs (for exit detection)
CONF_ENTRY_ZONES = "entry_zones"

POLYGON_ZONE_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_ZONE_ID): cv.int_range(min=1, max=4),
        cv.Required(CONF_POLYGON): cv.string,
        cv.Optional(CONF_ZONE_OFF_DELAY, default=15): cv.int_range(min=0, max=3600),
    }
)

ENTRY_LINE_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_LINE_ID): cv.int_range(min=1, max=2),
        cv.Required(CONF_LINE): cv.string,
    }
)

EXCLUSION_ZONE_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_ZONE_ID): cv.int_range(min=1, max=2),
        cv.Required(CONF_POLYGON): cv.string,
    }
)

ENTRY_ZONE_SCHEMA = cv.Schema(
    {
        cv.Required(CONF_ZONE_ID): cv.int_range(min=1, max=2),
        cv.Required(CONF_POLYGON): cv.string,
    }
)

CONFIG_SCHEMA = cv.All(
    cv.Schema(
        {
            cv.GenerateID(): cv.declare_id(UltimateSensorRadarComponent),
            cv.Optional(CONF_MAX_DISTANCE, default=6000): cv.int_range(min=0, max=6000),
            cv.Optional(CONF_INSTALLATION_ANGLE, default=0): cv.int_range(
                min=-45, max=45
            ),
            cv.Optional(CONF_INVERT_X, default=False): cv.boolean,
            # Entry/exit detection
            cv.Optional(CONF_ENTRY_EXIT_ENABLED, default=False): cv.boolean,
            cv.Optional(CONF_ASSUMED_PRESENT_TIMEOUT, default=60): cv.int_range(
                min=0, max=3600
            ),
            cv.Optional(CONF_EXIT_THRESHOLD_PCT, default=50): cv.int_range(
                min=0, max=200
            ),
            cv.Optional(CONF_OCCUPANCY_OFF_DELAY, default=15): cv.int_range(
                min=0, max=3600
            ),
            # Zone configurations
            cv.Optional(CONF_POLYGON_ZONES): cv.ensure_list(POLYGON_ZONE_SCHEMA),
            cv.Optional(CONF_ENTRY_LINES): cv.ensure_list(ENTRY_LINE_SCHEMA),
            cv.Optional(CONF_EXCLUSION_ZONES): cv.ensure_list(EXCLUSION_ZONE_SCHEMA),
            cv.Optional(CONF_ENTRY_ZONES): cv.ensure_list(ENTRY_ZONE_SCHEMA),
        }
    )
    .extend(uart.UART_DEVICE_SCHEMA)
    .extend(cv.COMPONENT_SCHEMA)
)

FINAL_VALIDATE_SCHEMA = uart.final_validate_device_schema(
    "ultimatesensor_radar",
    require_tx=True,
    require_rx=True,
    baud_rate=256000,
    parity="NONE",
    stop_bits=1,
)


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    await uart.register_uart_device(var, config)

    cg.add(var.set_max_distance(config[CONF_MAX_DISTANCE]))
    cg.add(var.set_installation_angle(config[CONF_INSTALLATION_ANGLE]))
    cg.add(var.set_invert_x(config[CONF_INVERT_X]))

    # Entry/exit detection settings
    cg.add(var.set_entry_exit_enabled(config[CONF_ENTRY_EXIT_ENABLED]))
    cg.add(var.set_assumed_present_timeout(config[CONF_ASSUMED_PRESENT_TIMEOUT]))
    cg.add(var.set_exit_threshold_pct(config[CONF_EXIT_THRESHOLD_PCT]))
    cg.add(var.set_occupancy_off_delay(config[CONF_OCCUPANCY_OFF_DELAY]))

    # Add polygon zones with off delays
    if CONF_POLYGON_ZONES in config:
        for zone in config[CONF_POLYGON_ZONES]:
            cg.add(var.add_polygon_zone(zone[CONF_ZONE_ID], zone[CONF_POLYGON]))
            cg.add(
                var.set_zone_off_delay(
                    zone[CONF_ZONE_ID] - 1, zone[CONF_ZONE_OFF_DELAY]
                )
            )

    # Add entry lines
    if CONF_ENTRY_LINES in config:
        for line in config[CONF_ENTRY_LINES]:
            cg.add(var.add_entry_line(line[CONF_LINE_ID], line[CONF_LINE]))

    # Add exclusion zones
    if CONF_EXCLUSION_ZONES in config:
        for zone in config[CONF_EXCLUSION_ZONES]:
            cg.add(var.add_exclusion_zone(zone[CONF_ZONE_ID], zone[CONF_POLYGON]))

    # Add entry zones (for exit detection)
    if CONF_ENTRY_ZONES in config:
        for zone in config[CONF_ENTRY_ZONES]:
            cg.add(var.add_entry_zone(zone[CONF_ZONE_ID], zone[CONF_POLYGON]))
