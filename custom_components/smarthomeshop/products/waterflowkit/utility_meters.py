"""Automatic Utility Meter creation for WaterFlowKit (one set per flow line)."""

from __future__ import annotations

import re

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event

from ...const import LOGGER
from .lines import BASE_FLOW_LINES, FLOW_LINES

# Utility meter cycles to create
METER_CYCLES = ["daily", "weekly", "monthly", "yearly"]


def _short_id(sources: list[str], entry: ConfigEntry) -> str:
    """Return the device ID used in the names of the meters.

    Sensors look like sensor.waterflowkit_XXXXX_flow1_total_consumption, or
    sensor.waterflowkit_flow1_total_consumption without a device ID.
    """
    for pattern in (r"waterflowkit_([a-f0-9]+)_flow", r"waterflowkit_(\w+)_flow"):
        for source in sources:
            match = re.search(pattern, source.lower())
            if match:
                return match.group(1)
    short_id = entry.entry_id[:8]
    LOGGER.info("Using entry_id as device ID for utility meters: %s", short_id)
    return short_id


def _has_counted_water(hass: HomeAssistant, source: str) -> bool:
    """Return whether a line has ever measured water."""
    state = hass.states.get(source)
    try:
        return state is not None and float(state.state) > 0
    except ValueError:
        return False


async def _create_line_meters(
    hass: HomeAssistant, short_id: str, line: str, source: str
) -> int:
    """Create the daily to yearly meters of one flow line."""
    created = 0
    for cycle in METER_CYCLES:
        if await _create_single_utility_meter(
            hass,
            name=f"WaterFlowKit {short_id} {line.capitalize()} {cycle.capitalize()}",
            source=source,
            cycle=cycle,
            unique_id=f"waterflowkit_{short_id}_{line}_{cycle}",
        ):
            created += 1
    return created


@callback
def _create_line_meters_once_used(
    hass: HomeAssistant, entry: ConfigEntry, short_id: str, line: str, source: str
) -> None:
    """Create the meters of Flow 3 or 4 once a sensor on that line counts water.

    The V2 board reports these lines without a sensor connected, and meters on
    a total that stays 0 only fill the helpers list. Waiting also covers a kit
    that is offline at startup and a sensor that is connected later.
    """
    if _has_counted_water(hass, source):
        hass.async_create_task(_create_line_meters(hass, short_id, line, source))
        return

    stop_watching = None

    @callback
    def _state_changed(_event) -> None:
        nonlocal stop_watching
        if stop_watching is None or not _has_counted_water(hass, source):
            return
        stop_watching()
        stop_watching = None
        hass.async_create_task(_create_line_meters(hass, short_id, line, source))

    @callback
    def _stop() -> None:
        if stop_watching is not None:
            stop_watching()

    stop_watching = async_track_state_change_event(hass, [source], _state_changed)
    entry.async_on_unload(_stop)


async def async_setup_utility_meters(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Set up utility meters for WaterFlowKit.

    Creates Daily/Weekly/Monthly/Yearly water consumption helpers per flow
    line, as official Home Assistant Utility Meter helpers, which are
    persistent and work correctly with the Energy Dashboard.
    """
    sources = {
        line: entry.data.get(f"{line}_water_sensor") or "" for line in FLOW_LINES
    }
    short_id = _short_id([source for source in sources.values() if source], entry)
    meters_created = 0

    for line, source in sources.items():
        if not source:
            continue
        if line in BASE_FLOW_LINES:
            meters_created += await _create_line_meters(hass, short_id, line, source)
        else:
            _create_line_meters_once_used(hass, entry, short_id, line, source)

    LOGGER.info(
        "Utility meters setup complete for WaterFlowKit %s (%d meters)",
        short_id,
        meters_created,
    )


async def _create_single_utility_meter(
    hass: HomeAssistant,
    name: str,
    source: str,
    cycle: str,
    unique_id: str,
) -> bool:
    """Create a single utility meter helper if it doesn't exist."""
    # Check if config entry already exists with this name
    for config_entry in hass.config_entries.async_entries("utility_meter"):
        entry_name = config_entry.options.get("name", config_entry.title)
        if entry_name == name:
            LOGGER.debug("Utility meter config entry for '%s' already exists", name)
            return True

    # Also check by entity registry as fallback
    ent_reg = er.async_get(hass)
    name_slug = name.lower().replace(" ", "_").replace("-", "_")
    for entity in ent_reg.entities.values():
        if entity.platform == "utility_meter" and name_slug in entity.entity_id:
            LOGGER.debug("Utility meter entity for '%s' already exists", name)
            return True

    # Create via config flow
    try:
        result = await hass.config_entries.flow.async_init(
            "utility_meter",
            context={"source": "user"},
            data={
                "name": name,
                "source": source,
                "cycle": cycle,
                "offset": 0,
                "tariffs": [],
                "net_consumption": False,
                "delta_values": False,
                "periodically_resetting": False,
                "always_available": True,
            },
        )

        if result.get("type") == "create_entry":
            LOGGER.info(
                "Created utility meter: %s (source: %s, cycle: %s)", name, source, cycle
            )
            return True
        elif result.get("type") == "form":
            if result.get("step_id") == "user":
                result = await hass.config_entries.flow.async_configure(
                    result["flow_id"],
                    user_input={
                        "name": name,
                        "source": source,
                        "cycle": cycle,
                        "offset": 0,
                        "net_consumption": False,
                        "delta_values": False,
                        "periodically_resetting": False,
                        "always_available": True,
                    },
                )
                if result.get("type") == "create_entry":
                    LOGGER.info("Created utility meter: %s", name)
                    return True

        return False

    except Exception as err:
        LOGGER.warning("Could not create utility meter %s: %s", name, err)
        return False

