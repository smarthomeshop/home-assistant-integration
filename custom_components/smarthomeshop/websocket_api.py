"""WebSocket API for SmartHomeShop Configurator Panel."""
from __future__ import annotations

import voluptuous as vol
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er

from .const import DOMAIN, LOGGER, VERSION, PRODUCT_PATTERNS, PRODUCT_NAMES
from .storage import SmartHomeShopStore


async def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register WebSocket API commands."""
    store = SmartHomeShopStore(hass)
    await store.async_load()
    hass.data[DOMAIN]["store"] = store

    websocket_api.async_register_command(hass, ws_get_config)
    websocket_api.async_register_command(hass, ws_get_devices)
    websocket_api.async_register_command(hass, ws_get_rooms)
    websocket_api.async_register_command(hass, ws_save_room)
    websocket_api.async_register_command(hass, ws_delete_room)
    websocket_api.async_register_command(hass, ws_get_device_entities)


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/config"})
@callback
def ws_get_config(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get SmartHomeShop configuration."""
    connection.send_result(
        msg["id"],
        {
            "version": VERSION,
            "domain": DOMAIN,
            "product_types": list(PRODUCT_NAMES.keys()),
            "product_names": PRODUCT_NAMES,
        },
    )


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/devices",
    vol.Optional("product_type"): str,
})
@callback
def ws_get_devices(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get SmartHomeShop devices."""
    device_registry = dr.async_get(hass)
    entity_registry = er.async_get(hass)

    devices = []
    product_filter = msg.get("product_type")

    for device_entry in device_registry.devices.values():
        detected_product = None
        entity_count = 0

        # Count entities and detect product type
        for entity in entity_registry.entities.values():
            if entity.device_id == device_entry.id:
                entity_count += 1
                if not detected_product:
                    entity_id_lower = entity.entity_id.lower()
                    for product, patterns in PRODUCT_PATTERNS.items():
                        for pattern in patterns:
                            if pattern in entity_id_lower:
                                detected_product = product
                                break
                        if detected_product:
                            break

        # Skip if no SmartHomeShop product detected
        if not detected_product:
            continue

        # Apply product filter if specified
        if product_filter and detected_product != product_filter:
            continue

        devices.append({
            "id": device_entry.id,
            "name": device_entry.name or device_entry.name_by_user or "Unknown",
            "model": device_entry.model,
            "manufacturer": device_entry.manufacturer,
            "product_type": detected_product,
            "product_name": PRODUCT_NAMES.get(detected_product, "Unknown"),
            "entity_count": entity_count,
        })

    LOGGER.debug("Found %d SmartHomeShop devices", len(devices))
    connection.send_result(msg["id"], {"devices": devices})


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/rooms"})
@callback
def ws_get_rooms(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get all room configurations."""
    store: SmartHomeShopStore = hass.data[DOMAIN]["store"]
    rooms = store.get_rooms()
    connection.send_result(msg["id"], {"rooms": rooms})


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/room/save",
    vol.Required("room"): dict,
})
@websocket_api.async_response
async def ws_save_room(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Save a room configuration."""
    store: SmartHomeShopStore = hass.data[DOMAIN]["store"]
    room_data = msg["room"]
    try:
        room = await store.async_save_room(room_data)
        connection.send_result(msg["id"], {"room": room})
    except Exception as err:
        LOGGER.error("Failed to save room: %s", err)
        connection.send_error(msg["id"], "save_failed", str(err))


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/room/delete",
    vol.Required("room_id"): str,
})
@websocket_api.async_response
async def ws_delete_room(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete a room configuration."""
    store: SmartHomeShopStore = hass.data[DOMAIN]["store"]
    try:
        await store.async_delete_room(msg["room_id"])
        connection.send_result(msg["id"], {"success": True})
    except Exception as err:
        LOGGER.error("Failed to delete room: %s", err)
        connection.send_error(msg["id"], "delete_failed", str(err))


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/device/entities",
    vol.Required("device_id"): str,
})
@callback
def ws_get_device_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get all entities for a specific device."""
    entity_registry = er.async_get(hass)
    device_id = msg["device_id"]

    entities = []
    for entity in entity_registry.entities.values():
        if entity.device_id == device_id:
            state = hass.states.get(entity.entity_id)
            entities.append({
                "entity_id": entity.entity_id,
                "name": entity.name or entity.original_name or entity.entity_id,
                "platform": entity.platform,
                "domain": entity.domain,
                "state": state.state if state else None,
                "attributes": dict(state.attributes) if state else {},
            })

    connection.send_result(msg["id"], {"entities": entities})
