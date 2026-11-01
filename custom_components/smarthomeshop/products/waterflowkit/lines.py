"""Flow lines of a WaterFlowKit and the ESPHome sensors behind them."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er

from ...const import LOGGER

# Flow inputs a WaterFlowKit can have. Flow1 and Flow2 are always reported,
# the V2 board adds two more.
FLOW_LINES = ("flow1", "flow2", "flow3", "flow4")
BASE_FLOW_LINES = ("flow1", "flow2")


def line_label(line: str) -> str:
    """Return the name of a line as entities show it: flow3 becomes Flow 3."""
    return f"Flow {line.removeprefix('flow')}"


def find_flow_sensors(hass: HomeAssistant, device_id: str) -> dict[str, str]:
    """Find the water and flow sensor of every line, keyed like the entry data."""
    entity_registry = er.async_get(hass)
    sensors: dict[str, str] = {}
    for entity in er.async_entries_for_device(entity_registry, device_id):
        if entity.domain != "sensor":
            continue
        entity_id = entity.entity_id.lower()
        for line in FLOW_LINES:
            if line not in entity_id:
                continue
            if "total_consumption" in entity_id:
                sensors[f"{line}_water_sensor"] = entity.entity_id
            elif "current" in entity_id and "usage" in entity_id:
                sensors[f"{line}_flow_sensor"] = entity.entity_id
    LOGGER.debug("WaterFlowKit sensors found: %s", sensors)
    return sensors


@callback
def add_new_flow_lines(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Give an existing entry the lines it was created without.

    Entries made before Flow 3 and Flow 4 were supported only hold the first
    two, while the sensors of the V2 board have been there all along.
    """
    device_id = entry.data.get("device_id")
    if not device_id:
        return
    missing = {
        key: sensor
        for key, sensor in find_flow_sensors(hass, device_id).items()
        if not entry.data.get(key)
    }
    if missing:
        hass.config_entries.async_update_entry(
            entry, data={**entry.data, **missing}
        )
