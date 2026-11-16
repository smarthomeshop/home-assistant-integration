"""WebSocket API for SmartHomeShop Configurator Panel."""

from __future__ import annotations

import asyncio
import copy
import math
import re
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.config_entries import SOURCE_IMPORT
from homeassistant.core import HomeAssistant, callback, valid_entity_id
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .const import (
    CONF_DEVICE_ID,
    CONF_MAIN_FUSE_AMPS,
    CONF_PRICE_FEED_IN,
    CONF_PRICE_GAS,
    CONF_PRICE_T1,
    CONF_PRICE_T2,
    CONF_PRICE_WATER,
    CONF_PRODUCT_TYPE,
    DEFAULT_CONTINUOUS_FLOW_MINUTES,
    DEFAULT_MAIN_FUSE_AMPS,
    DEFAULT_NIGHT_END,
    DEFAULT_NIGHT_START,
    DEFAULT_PRICE_FEED_IN,
    DEFAULT_PRICE_GAS,
    DEFAULT_PRICE_T1,
    DEFAULT_PRICE_T2,
    DEFAULT_PRICE_WATER,
    DOMAIN,
    LOGGER,
    PRODUCT_NAMES,
    PRODUCT_PATTERNS,
    SIGNAL_ROOMS_CHANGED,
    VERSION,
    product_for_device,
    resolve_api_base_url,
)
from .device_linking import (
    config_entries_for_device_domain,
    entry_matches_source_device,
    iter_esphome_source_devices,
    resolve_source_device,
    source_device_storage_key,
)
from .energy_runtime import async_schedule_energy_reconfigure
from .floor_plan_recognition import (
    MAX_IMAGE_CHARACTERS,
    FloorPlanRecognitionError,
    async_recognise_floor_plan,
)
from .products.waterflowkit.lines import FLOW_LINES
from .radar_profiles import discover_radar_device_profiles, radar_profile_for_device
from .room_config import normalize_room_config
from .room_runtime import ROOM_RUNTIME_COORDINATOR, async_setup_room_runtime
from .storage import (
    RoomConfigConflictError,
    RoomDeviceConflictError,
    SmartHomeShopStore,
)

# Water option keys (mirror config_flow); stored in entry.options
CONF_CONTINUOUS_FLOW_MINUTES = "continuous_flow_minutes"
CONF_NIGHT_START = "night_start"
CONF_NIGHT_END = "night_end"
CONF_VACATION_MODE_ENTITY = "vacation_mode_entity"

_WATER_PRODUCTS = ("waterp1meterkit", "watermeterkit", "waterflowkit")
# WaterFlowKit has no cost path at all (no water sensors, no cost entities and
# no reader of the water price), so only these products get the price field.
_WATER_COST_PRODUCTS = ("waterp1meterkit", "watermeterkit")
# Entity-id pattern fallback ordered longest-first, so a specific pattern
# ("ultimatesensor_mini") wins from a product whose pattern is its substring
# ("ultimatesensor"). Mirrors the ordering rule of PRODUCT_MODEL_PREFIXES.
_PATTERNS_MOST_SPECIFIC_FIRST = sorted(
    (
        (pattern, product)
        for product, patterns in PRODUCT_PATTERNS.items()
        for pattern in patterns
    ),
    key=lambda item: len(item[0]),
    reverse=True,
)
_ENERGY_PRODUCTS = ("waterp1meterkit", "p1meterkit")
_ACCOUNT_REFRESH_TIMEOUT = 35
_ACCOUNT_REFRESH_TASK = "account_price_refresh_task"
_RADAR_POSITION_FRESHNESS_SECONDS = 15

_SPS30_QUIET_HOURS_ENTITIES: dict[str, tuple[str, str, str]] = {
    # key: (domain, ESPHome object-id suffix, original name)
    "enabled": ("switch", "sps30_quiet_hours_enabled", "SPS30 Quiet Hours"),
    "start_hour": ("number", "sps30_quiet_start_hour", "SPS30 Quiet Start Hour"),
    "end_hour": ("number", "sps30_quiet_end_hour", "SPS30 Quiet End Hour"),
    "active": (
        "binary_sensor",
        "sps30_quiet_hours_active_sensor",
        "SPS30 Quiet Hours Active",
    ),
    "pm_sensor": ("switch", "pm_sensor_switch", "PM Sensor"),
    "idle_interval": ("number", "sps30_idle_interval", "SPS30 Idle Interval"),
}
_SPS30_QUIET_HOURS_REQUIRED = frozenset({"enabled", "start_hour", "end_hour", "active"})


def _normalise_registry_identity(value: str | None) -> str:
    """Normalise stable ESPHome registry metadata, never the generated entity id."""
    return re.sub(r"[^a-z0-9]+", "_", (value or "").lower()).strip("_")


def resolve_sps30_quiet_hours_entities(
    entity_registry, device_id: str
) -> dict[str, Any]:
    """Resolve the SPS30 quiet-hours capability from one HA device registry.

    ESPHome entity IDs include a user-controlled device prefix and can be renamed.
    The resolver therefore uses the device association plus the ESPHome platform,
    entity domain, stable unique-id suffix and original firmware name.
    """
    resolved: dict[str, str] = {}
    scores: dict[str, int] = {}

    for entity in er.async_entries_for_device(entity_registry, device_id):
        if entity.platform != "esphome" or entity.device_id != device_id:
            continue

        unique_id = _normalise_registry_identity(getattr(entity, "unique_id", None))
        original_name = _normalise_registry_identity(
            getattr(entity, "original_name", None)
        )
        for key, (
            domain,
            object_id,
            firmware_name,
        ) in _SPS30_QUIET_HOURS_ENTITIES.items():
            if entity.domain != domain:
                continue
            stable_suffix = _normalise_registry_identity(object_id)
            stable_name = _normalise_registry_identity(firmware_name)
            unique_match = bool(unique_id) and unique_id.endswith(stable_suffix)
            original_name_match = bool(original_name) and original_name == stable_name
            if not unique_match and not original_name_match:
                continue

            score = 2 if unique_match else 1
            if score > scores.get(key, -1):
                resolved[key] = entity.entity_id
                scores[key] = score

    missing = sorted(_SPS30_QUIET_HOURS_REQUIRED.difference(resolved))
    if not resolved:
        status = "unsupported"
    elif missing:
        status = "partial"
    else:
        status = "complete"

    return {
        "status": status,
        "entities": resolved,
        "missing": missing,
    }


async def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register WebSocket API commands."""
    store = SmartHomeShopStore(hass)
    await store.async_load()
    hass.data[DOMAIN]["store"] = store
    await async_setup_room_runtime(hass, store)

    websocket_api.async_register_command(hass, ws_get_config)
    websocket_api.async_register_command(hass, ws_get_devices)
    websocket_api.async_register_command(hass, ws_get_radar_profiles)
    websocket_api.async_register_command(hass, ws_get_rooms)
    websocket_api.async_register_command(hass, ws_get_floor_plan)
    websocket_api.async_register_command(hass, ws_save_floor_plan)
    websocket_api.async_register_command(hass, ws_recognise_floor_plan)
    websocket_api.async_register_command(hass, ws_get_room_runtime)
    websocket_api.async_register_command(hass, ws_save_room)
    websocket_api.async_register_command(hass, ws_revoke_room_alignment)
    websocket_api.async_register_command(hass, ws_delete_room)
    websocket_api.async_register_command(hass, ws_get_device_entities)
    websocket_api.async_register_command(hass, ws_enable_device_entity)
    websocket_api.async_register_command(hass, ws_get_device_insights)
    websocket_api.async_register_command(hass, ws_get_device_config)
    websocket_api.async_register_command(hass, ws_set_device_config)
    websocket_api.async_register_command(hass, ws_link_device)
    websocket_api.async_register_command(hass, ws_remove_device)
    websocket_api.async_register_command(hass, ws_unhide_device)
    websocket_api.async_register_command(hass, ws_get_account)
    websocket_api.async_register_command(hass, ws_set_account)
    websocket_api.async_register_command(hass, ws_refresh_account)
    websocket_api.async_register_command(hass, ws_get_price_entities)
    websocket_api.async_register_command(hass, ws_get_contracts)
    websocket_api.async_register_command(hass, ws_get_schedules)
    websocket_api.async_register_command(hass, ws_set_schedule)
    websocket_api.async_register_command(hass, ws_delete_schedule)
    websocket_api.async_register_command(hass, ws_get_savings)
    websocket_api.async_register_command(hass, ws_get_battery)
    websocket_api.async_register_command(hass, ws_get_battery_plan)
    websocket_api.async_register_command(hass, ws_get_energy_journal)
    websocket_api.async_register_command(hass, ws_clear_energy_journal)
    websocket_api.async_register_command(hass, ws_set_battery)
    websocket_api.async_register_command(hass, ws_get_energy_sources)
    websocket_api.async_register_command(hass, ws_set_energy_sources)
    websocket_api.async_register_command(hass, ws_get_smart_ev)
    websocket_api.async_register_command(hass, ws_set_smart_ev)
    websocket_api.async_register_command(hass, ws_set_smart_ev_mode)
    websocket_api.async_register_command(hass, ws_refresh_smart_ev)
    websocket_api.async_register_command(hass, ws_clear_smart_ev_journal)
    websocket_api.async_register_command(hass, ws_get_smart_loads)
    websocket_api.async_register_command(hass, ws_set_smart_loads)
    websocket_api.async_register_command(hass, ws_set_smart_load_mode)
    websocket_api.async_register_command(hass, ws_release_smart_load_control)
    websocket_api.async_register_command(hass, ws_refresh_smart_loads)
    websocket_api.async_register_command(hass, ws_clear_smart_loads_history)


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


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/devices",
        vol.Optional("product_type"): str,
    }
)
@callback
def ws_get_devices(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get SmartHomeShop devices."""
    entity_registry = er.async_get(hass)
    store = getattr(hass, "data", {}).get(DOMAIN, {}).get("store")

    devices = []
    hidden_devices = []
    product_filter = msg.get("product_type")

    for device_entry in iter_esphome_source_devices(hass):
        # Prefer the ESPHome project info (manufacturer/model); entity_id
        # patterns are only a fallback for firmware without project info.
        detected_product = product_for_device(
            device_entry.manufacturer, device_entry.model
        )
        entity_count = 0
        online = False
        last_seen = None
        status_off_since = None

        # Count entities, detect product type and determine connectivity.
        # Only ESPHome sensor entities count for online state: our own
        # coordinator entities, update entities and the voice-assistant
        # selects stay available even when the device itself is offline.
        device_entities = er.async_entries_for_device(
            entity_registry,
            device_entry.id,
            include_disabled_entities=True,
        )
        entity_area_ids = {
            entity.area_id
            for entity in device_entities
            if getattr(entity, "area_id", None)
        }
        effective_area_id = getattr(device_entry, "area_id", None) or (
            next(iter(entity_area_ids)) if len(entity_area_ids) == 1 else None
        )
        entity_count = len(device_entities)
        for entity in device_entities:
            if entity.platform == "esphome" and entity.domain in (
                "sensor",
                "binary_sensor",
            ):
                state = hass.states.get(entity.entity_id)
                if state is not None:
                    # The ESPHome status sensor is authoritative: it stays
                    # available and flips to 'off' on disconnect.
                    if entity.original_device_class == "connectivity":
                        if state.state == "on":
                            online = True
                        elif state.state == "off":
                            status_off_since = state.last_changed
                    elif state.state not in ("unavailable", "unknown"):
                        online = True
                    elif state.last_changed and (
                        last_seen is None or state.last_changed > last_seen
                    ):
                        last_seen = state.last_changed

            if not detected_product:
                entity_id_lower = entity.entity_id.lower()
                for pattern, product in _PATTERNS_MOST_SPECIFIC_FIRST:
                    if pattern in entity_id_lower:
                        detected_product = product
                        break

        if status_off_since is not None and not online:
            last_seen = status_off_since

        # Skip if no SmartHomeShop product detected
        if not detected_product:
            continue

        # Apply product filter if specified
        if product_filter and detected_product != product_filter:
            continue

        device = {
            "id": device_entry.id,
            "name": device_entry.name_by_user or device_entry.name or "Unknown",
            "model": device_entry.model,
            "manufacturer": device_entry.manufacturer,
            "product_type": detected_product,
            "product_name": PRODUCT_NAMES.get(detected_product, "Unknown"),
            "entity_count": entity_count,
            "online": online,
            "last_seen": last_seen.isoformat() if (not online and last_seen) else None,
            "area_id": effective_area_id,
            "integration_linked": _entry_for_device(hass, device_entry.id) is not None,
            "esphome_configured": True,
        }
        device_key = source_device_storage_key(hass, device_entry)
        if store is not None and store.is_device_hidden(device_key):
            device["hidden"] = True
            hidden_devices.append(device)
        else:
            devices.append(device)

    LOGGER.debug(
        "Found %d visible and %d hidden SmartHomeShop devices",
        len(devices),
        len(hidden_devices),
    )
    connection.send_result(
        msg["id"], {"devices": devices, "hidden_devices": hidden_devices}
    )


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/radar/profiles"})
@callback
def ws_get_radar_profiles(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return metadata-first radar profiles for Room Designer."""
    profiles = discover_radar_device_profiles(hass)
    connection.send_result(
        msg["id"], {"devices": [profile.as_dict() for profile in profiles]}
    )


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
    connection.send_result(
        msg["id"],
        {"rooms": rooms, "recovery": store.get_invalid_room_summary()},
    )


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/floor_plan"})
@callback
def ws_get_floor_plan(hass: HomeAssistant, connection, msg: dict[str, Any]) -> None:
    """Return a consistent floor plan and room revision snapshot."""
    connection.send_result(msg["id"], hass.data[DOMAIN]["store"].get_floor_plan())


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/floor_plan/recognise",
    vol.Required("image"): vol.All(
        str,
        vol.Length(min=32, max=MAX_IMAGE_CHARACTERS),
        vol.Match(r"^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$"),
    ),
})
@websocket_api.async_response
async def ws_recognise_floor_plan(hass: HomeAssistant, connection, msg: dict[str, Any]) -> None:
    """Find the rooms on an uploaded floor plan through the linked account.

    A recognition that fails on the service side is a normal answer with an
    error code, so the remaining quota can travel with it.
    """
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    account = hass.data[DOMAIN]["store"].get_account()
    try:
        result = await async_recognise_floor_plan(hass, account, msg["image"])
    except FloorPlanRecognitionError as err:
        connection.send_result(msg["id"], {
            "error": {"code": err.code, "message": str(err)},
            "quota": err.quota,
        })
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {vol.Required("type"): "smarthomeshop/rooms/runtime"}
)
@callback
def ws_get_room_runtime(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return combined room state and per-source diagnostics."""
    coordinator = hass.data.get(DOMAIN, {}).get(ROOM_RUNTIME_COORDINATOR)
    rooms = copy.deepcopy(coordinator.data if coordinator is not None else {})
    store: SmartHomeShopStore | None = hass.data.get(DOMAIN, {}).get("store")
    if store is not None:
        # Tracking permission is safety configuration, not cached telemetry.
        # Overlay it directly from durable storage so revocations are visible
        # immediately even while the runtime coordinator is refreshing.
        for stored_room in store.get_rooms():
            room_id = stored_room.get("id")
            tracking = stored_room.get("aggregation", {}).get("tracking")
            if not room_id or not isinstance(tracking, dict):
                continue
            runtime_room = rooms.setdefault(str(room_id), {})
            runtime_room["tracking"] = copy.deepcopy(tracking)
    updated_at = max(
        (
            str(room.get("updated_at") or "")
            for room in rooms.values()
            if isinstance(room, dict)
        ),
        default="",
    )
    snapshot_current = not rooms
    if updated_at:
        try:
            snapshot_time = datetime.fromisoformat(updated_at)
            snapshot_current = 0 <= (datetime.now(UTC) - snapshot_time).total_seconds() <= 20
        except ValueError:
            snapshot_current = False
    connection.send_result(
        msg["id"],
        {
            "rooms": rooms,
            "available": bool(
                coordinator is not None
                and coordinator.last_update_success
                and snapshot_current
            ),
            "updated_at": updated_at,
            "tracking_authoritative": store is not None,
        },
    )


_ROOM_SCHEMA = vol.Schema(
    {
        vol.Optional("id"): str,
        vol.Required("name"): vol.All(str, vol.Length(min=1, max=120)),
        vol.Optional("walls"): vol.All(list, vol.Length(max=100), [dict]),
        vol.Optional("furniture"): vol.All(list, vol.Length(max=500), [dict]),
        vol.Optional("devices"): vol.All(list, vol.Length(max=100), [dict]),
        vol.Optional("doors"): vol.All(list, vol.Length(max=100), [dict]),
        vol.Optional("windows"): vol.All(list, vol.Length(max=100), [dict]),
        vol.Optional("mirrors"): vol.All(list, vol.Length(max=100), [dict]),
        vol.Optional("sensors"): vol.All(list, vol.Length(max=100), [dict]),
        vol.Optional("zones"): vol.All(list, vol.Length(max=100), [dict]),
        vol.Optional("sensor"): vol.Any(None, dict),
        vol.Optional("calibration"): dict,
        vol.Optional("haAreaId"): vol.Any(
            None, vol.All(str, vol.Length(min=1, max=255))
        ),
        vol.Optional("haFloorId"): vol.Any(
            None, vol.All(str, vol.Length(min=1, max=255))
        ),
    },
    extra=vol.ALLOW_EXTRA,
)


def _radar_alias_map(hass: HomeAssistant) -> dict[str, str]:
    """Map every known radar identity to its physical HA device ID."""
    aliases: dict[str, str] = {}
    for profile in discover_radar_device_profiles(hass):
        for identity in (profile.device_id, profile.entity_prefix, *profile.aliases):
            if identity:
                aliases[str(identity)] = profile.device_id
    return aliases


def _room_device_owners(
    rooms: list[dict[str, Any]], aliases: dict[str, str]
) -> dict[str, list[tuple[str, str]]]:
    """Map every physical radar to the rooms it is linked to, in order."""
    owners: dict[str, list[tuple[str, str]]] = {}
    for room in rooms:
        room_id = str(room.get("id") or "")
        room_name = str(room.get("name") or room_id or "Room")
        for source in room.get("sensors", []):
            if not isinstance(source, dict):
                continue
            raw_device = str(
                source.get("deviceId") or source.get("device_id") or ""
            ).strip()
            if not raw_device:
                continue
            linked = owners.setdefault(aliases.get(raw_device, raw_device), [])
            if all(owner[0] != room_id for owner in linked):
                linked.append((room_id, room_name))
    return owners


def _duplicate_room_device(
    rooms: list[dict[str, Any]],
    aliases: dict[str, str],
    before: list[dict[str, Any]] | None = None,
) -> tuple[str, str, str] | None:
    """Return the first physical radar linked to more than one room.

    With ``before``, only a new link counts: a radar that was already in the
    same rooms before this save (stored by an older version) does not block
    saving, so the user can still edit other rooms and unlink it later.
    """
    known = _room_device_owners(before, aliases) if before is not None else {}
    for device_id, owners in _room_device_owners(rooms, aliases).items():
        if len(owners) < 2:
            continue
        earlier = {owner[0] for owner in known.get(device_id, [])}
        if before is not None and {owner[0] for owner in owners} <= earlier:
            continue
        return device_id, owners[0][1], owners[1][1]
    return None


def _finite_number(value: Any) -> float:
    """Coerce a finite numeric placement value."""
    number = float(value)
    if not math.isfinite(number):
        raise vol.Invalid("must be a finite number")
    return number


_HOUSE_PLACEMENT_SCHEMA = vol.Schema(
    {
        vol.Required("x"): _finite_number,
        vol.Required("y"): _finite_number,
        vol.Required("floor"): vol.All(vol.Coerce(int), vol.Range(min=-5, max=20)),
        vol.Required("rotationDeg"): vol.In((0, 90, 180, 270)),
        vol.Required("visible"): bool,
    }
)


_FLOOR_PLAN_ROOM = _ROOM_SCHEMA.extend({
    vol.Required("id"): vol.All(str, vol.Length(min=1, max=120)),
    vol.Required("house"): _HOUSE_PLACEMENT_SCHEMA,
})
_FLOOR_PLAN_FIELDS = {
    "id", "name", "walls", "doors", "windows", "mirrors", "furniture", "sensors", "zones", "house", "ceilingHeightMm",
    "haAreaId", "haFloorId",
}


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/floor_plan/save",
    vol.Required("project"): dict,
    vol.Required("changes"): vol.All(list, vol.Length(max=960), [_FLOOR_PLAN_ROOM]),
    vol.Required("removed"): vol.All(list, vol.Length(max=960), [str]),
    vol.Required("revisions"): {str: vol.Any(None, str)},
    vol.Required("version"): str,
})
@websocket_api.async_response
async def ws_save_floor_plan(hass: HomeAssistant, connection, msg: dict[str, Any]) -> None:
    """Save shared editor changes without replacing calibration or runtime settings."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    changes = [{key: value for key, value in room.items() if key in _FLOOR_PLAN_FIELDS} for room in msg["changes"]]
    changed_ids = {room["id"] for room in changes}
    removed = set(msg["removed"])
    if (len(changed_ids) != len(changes) or len(removed) != len(msg["removed"])
            or removed & changed_ids or removed - msg["revisions"].keys()):
        connection.send_error(msg["id"], "invalid_format", "Invalid room changes")
        return
    store: SmartHomeShopStore = hass.data[DOMAIN]["store"]
    aliases = _radar_alias_map(hass)
    previous_sources = {
        (source.get("id"), source.get("deviceId") or source.get("device_id"))
        for room in store.get_rooms() for source in room.get("sensors", [])
    }
    for room in changes:
        # One radar twice in one room would be merged silently on save.
        linked = [
            aliases.get(str(device_id), str(device_id))
            for source in room.get("sensors", [])
            if (device_id := source.get("deviceId") or source.get("device_id"))
        ]
        if len(set(linked)) != len(linked):
            connection.send_error(
                msg["id"], "invalid_format", "Every room sensor must use a unique physical device."
            )
            return
        for source in room.get("sensors", []):
            device_id = source.get("deviceId") or source.get("device_id")
            if (source.get("id"), device_id) in previous_sources:
                continue
            profile = radar_profile_for_device(hass, device_id) if isinstance(device_id, str) else None
            if profile is None or profile.device_id != device_id:
                connection.send_error(msg["id"], "invalid_device", "Choose an available Home Assistant radar.")
                return
    final_rooms: dict[str, dict[str, Any]] = {
        str(room.get("id")): room
        for room in store.get_rooms()
        if room.get("id") and str(room.get("id")) not in removed
    }
    # Floorplan changes are partial room patches. Validate the same merged
    # transaction that storage will commit; replacing a room with its patch
    # here could temporarily hide a retained radar and miss a cross-room link.
    for room in changes:
        room_id = str(room["id"])
        final_rooms[room_id] = {**final_rooms.get(room_id, {}), **room}
    duplicate = _duplicate_room_device(
        list(final_rooms.values()), aliases, store.get_rooms()
    )
    if duplicate is not None:
        _device_id, first_room, second_room = duplicate
        connection.send_error(
            msg["id"],
            "duplicate_device",
            f"One radar cannot be linked to both {first_room} and {second_room}.",
        )
        return
    try:
        result = await store.async_save_floor_plan(msg["project"], changes, msg["removed"], msg["revisions"], msg["version"])
    except RoomConfigConflictError:
        connection.send_error(msg["id"], "conflict", "The floor plan changed elsewhere. Reload before saving again.")
        return
    except Exception:
        LOGGER.exception("Failed to save the floor plan")
        connection.send_error(msg["id"], "save_failed", "The floor plan could not be saved.")
        return
    coordinator = hass.data.get(DOMAIN, {}).get(ROOM_RUNTIME_COORDINATOR)
    if coordinator is not None:
        coordinator.async_rooms_changed()
    async_dispatcher_send(hass, SIGNAL_ROOMS_CHANGED)
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/room/save",
        vol.Required("room"): dict,
        vol.Optional("create", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_save_room(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Save a room configuration (admin only, like every other write)."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store: SmartHomeShopStore = hass.data[DOMAIN]["store"]
    try:
        room_data = normalize_room_config(_ROOM_SCHEMA(msg["room"]))
    except (vol.Invalid, TypeError, ValueError) as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    seen_source_ids: set[str] = set()
    seen_device_ids: set[str] = set()
    profile_by_alias = _radar_alias_map(hass)
    for source in room_data.get("sensors", []):
        source_id = str(source.get("id") or "").strip()
        device_id = str(source.get("deviceId") or source.get("device_id") or "").strip()
        canonical_device_id = profile_by_alias.get(device_id, device_id)
        if (source_id and source_id in seen_source_ids) or (
            canonical_device_id and canonical_device_id in seen_device_ids
        ):
            connection.send_error(
                msg["id"],
                "invalid_format",
                "Every room sensor must use a unique source and physical device.",
            )
            return
        if source_id:
            seen_source_ids.add(source_id)
        if canonical_device_id:
            seen_device_ids.add(canonical_device_id)
    existing_rooms = [
        room for room in store.get_rooms()
        if msg["create"] or str(room.get("id") or "") != str(room_data.get("id") or "")
    ]
    duplicate = _duplicate_room_device(
        [*existing_rooms, room_data], profile_by_alias, store.get_rooms()
    )
    if duplicate is not None:
        _device_id, first_room, second_room = duplicate
        connection.send_error(
            msg["id"],
            "duplicate_device",
            f"One radar cannot be linked to both {first_room} and {second_room}.",
        )
        return
    try:
        def _validate_device_ownership(rooms: list[dict[str, Any]]) -> None:
            # Storage calls this under its lock before it swaps in the new
            # rooms, so get_rooms() is still the state before this save.
            if _duplicate_room_device(rooms, profile_by_alias, store.get_rooms()) is not None:
                raise RoomDeviceConflictError

        room = await store.async_save_room(
            room_data,
            create=msg["create"],
            validate_rooms=_validate_device_ownership,
        )
        coordinator = hass.data.get(DOMAIN, {}).get(ROOM_RUNTIME_COORDINATOR)
        if coordinator is not None:
            coordinator.async_rooms_changed()
        async_dispatcher_send(hass, SIGNAL_ROOMS_CHANGED)
        connection.send_result(msg["id"], {"room": room})
    except RoomConfigConflictError:
        connection.send_error(
            msg["id"],
            "conflict",
            "This room changed in another browser. Reload it before saving again.",
        )
    except RoomDeviceConflictError:
        connection.send_error(
            msg["id"],
            "duplicate_device",
            "One physical radar can only be linked to one room.",
        )
    except Exception:
        LOGGER.exception("Failed to save room")
        connection.send_error(msg["id"], "save_failed", "The room could not be saved.")


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/room/alignment/revoke",
        vol.Required("room_id"): str,
    }
)
@websocket_api.async_response
async def ws_revoke_room_alignment(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Persist a fail-closed calibration revocation without replacing a room."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store: SmartHomeShopStore = hass.data[DOMAIN]["store"]
    try:
        result = await store.async_revoke_room_alignment(msg["room_id"])
        if result is None:
            connection.send_error(msg["id"], "not_found", "Room not found")
            return
        coordinator = hass.data.get(DOMAIN, {}).get(ROOM_RUNTIME_COORDINATOR)
        if coordinator is not None:
            coordinator.async_rooms_changed()
        async_dispatcher_send(hass, SIGNAL_ROOMS_CHANGED)
        connection.send_result(msg["id"], result)
    except Exception as err:
        LOGGER.error("Failed to revoke room alignment: %s", err)
        connection.send_error(msg["id"], "save_failed", str(err))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/room/delete",
        vol.Required("room_id"): str,
    }
)
@websocket_api.async_response
async def ws_delete_room(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete a room configuration (admin only)."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store: SmartHomeShopStore = hass.data[DOMAIN]["store"]
    try:
        await store.async_delete_room(msg["room_id"])
        coordinator = hass.data.get(DOMAIN, {}).get(ROOM_RUNTIME_COORDINATOR)
        if coordinator is not None:
            coordinator.async_rooms_changed()
        async_dispatcher_send(hass, SIGNAL_ROOMS_CHANGED)
        connection.send_result(msg["id"], {"success": True})
    except Exception as err:
        LOGGER.error("Failed to delete room: %s", err)
        connection.send_error(msg["id"], "delete_failed", str(err))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/device/entities",
        vol.Required("device_id"): str,
    }
)
@callback
def ws_get_device_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get all entities for a specific device."""
    entity_registry = er.async_get(hass)
    requested_device_id = msg["device_id"]
    source_device = resolve_source_device(hass, requested_device_id)
    device_id = source_device.id if source_device is not None else requested_device_id
    quiet_hours = resolve_sps30_quiet_hours_entities(entity_registry, device_id)
    radar_profile = radar_profile_for_device(hass, device_id)

    entities = []
    for entity in entity_registry.entities.values():
        if entity.device_id == device_id:
            state = hass.states.get(entity.entity_id)
            entities.append(
                {
                    "entity_id": entity.entity_id,
                    "name": entity.name or entity.original_name or entity.entity_id,
                    "platform": entity.platform,
                    "domain": entity.domain,
                    "device_id": entity.device_id,
                    "unique_id": getattr(entity, "unique_id", None),
                    "original_name": getattr(entity, "original_name", None),
                    "disabled_by": (
                        getattr(entity.disabled_by, "value", entity.disabled_by)
                        if entity.disabled_by is not None
                        else None
                    ),
                    "entity_category": (
                        getattr(entity.entity_category, "value", entity.entity_category)
                        if entity.entity_category is not None
                        else None
                    ),
                    "state": state.state if state else None,
                    "attributes": dict(state.attributes) if state else {},
                }
            )

    connection.send_result(
        msg["id"],
        {
            "entities": entities,
            "quiet_hours": quiet_hours,
            "radar_profile": radar_profile.as_dict() if radar_profile else None,
        },
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/device/entity/enable",
        vol.Required("device_id"): str,
        vol.Required("entity_id"): str,
    }
)
@websocket_api.async_response
async def ws_enable_device_entity(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Enable an explicitly selected disabled ESPHome entity for a device."""
    entity_registry = er.async_get(hass)
    entity = entity_registry.async_get(msg["entity_id"])
    source_device = resolve_source_device(hass, msg["device_id"])
    device_id = source_device.id if source_device is not None else msg["device_id"]

    if entity is None or entity.device_id != device_id:
        connection.send_error(
            msg["id"], "entity_not_found", "The entity does not belong to this device"
        )
        return

    if entity.platform != "esphome":
        connection.send_error(
            msg["id"],
            "unsupported_entity",
            "Only ESPHome device entities can be enabled here",
        )
        return

    if entity.disabled_by is None:
        connection.send_result(msg["id"], {"success": True, "already_enabled": True})
        return

    config_entry_id = entity.config_entry_id
    entity_registry.async_update_entity(entity.entity_id, disabled_by=None)

    # Disabled-by-default ESPHome entities are not instantiated until their
    # config entry reloads. Awaiting the reload means the panel can return with
    # a real state instead of leaving a misleading grey control behind.
    if config_entry_id and hass.config_entries.async_get_entry(config_entry_id):
        await hass.config_entries.async_reload(config_entry_id)

    connection.send_result(msg["id"], {"success": True, "already_enabled": False})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/device/insights",
        vol.Required("device_id"): str,
    }
)
@callback
def ws_get_device_insights(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return internal product insights for a configured device."""
    requested_device_id = msg["device_id"]
    source_device = resolve_source_device(hass, requested_device_id)
    device_id = source_device.id if source_device is not None else requested_device_id

    entry = _entry_for_device(hass, device_id)

    online, last_seen = _connectivity_for_device(hass, device_id)

    if entry is None or getattr(entry, "runtime_data", None) is None:
        # Distinguish "no entry at all" (panel offers one-click link) from
        # "entry exists but is not loaded" (disabled, or still setting up),
        # so the panel never offers to link a device that already has one.
        connection.send_result(
            msg["id"],
            {
                "configured": False,
                "online": online,
                "last_seen": last_seen,
                "entry_exists": entry is not None,
                "entry_disabled": bool(entry.disabled_by) if entry else False,
            },
        )
        return

    coordinator = entry.runtime_data
    result: dict[str, Any] = {
        "configured": True,
        "entry_id": entry.entry_id,
        "product_type": entry.data.get("product_type"),
        "title": entry.title,
        "online": online,
        "last_seen": last_seen,
    }

    product_type = entry.data.get("product_type")
    water_products = ("waterp1meterkit", "watermeterkit", "waterflowkit")

    data = getattr(coordinator, "data", None)
    if (
        product_type in water_products
        and data is not None
        and hasattr(data, "current_flow_rate")
    ):
        leak_score = getattr(data, "leak_score", None)
        result["water"] = {
            "flow_rate": data.current_flow_rate,
            "today_usage": data.today_usage,
            "meter_total": data.meter_total,
            "water_cost_today": getattr(data, "water_cost_today", None),
            "usage_vs_average": getattr(data, "usage_vs_average", None),
            "leak_score": leak_score.to_dict() if leak_score else None,
            "baseline": data.baseline_status,
            "last_session": getattr(data, "last_session", None),
        }
        result["water"]["recent_sessions"] = list(
            getattr(coordinator, "recent_sessions", []) or []
        )
        result["water"]["flow_history"] = [
            [round(ts), flow] for ts, flow in getattr(coordinator, "flow_history", [])
        ]

        # Firmware calibration input ("Water Meter Initial Value") so the
        # panel can offer setting the meter reading; stored on the device.
        entity_registry = er.async_get(hass)
        for entity in er.async_entries_for_device(entity_registry, device_id):
            if entity.domain == "number" and "water_meter_initial" in entity.entity_id:
                result["water"]["meter_initial_entity"] = entity.entity_id
                break

    # WaterFlowKit: rich per-line data from the coordinator
    if product_type == "waterflowkit":
        flows = {}
        cdata = data if isinstance(data, dict) else {}
        for line in FLOW_LINES:
            if not entry.data.get(f"{line}_flow_sensor") and not entry.data.get(
                f"{line}_water_sensor"
            ):
                continue
            line_data = cdata.get(line) or {}
            flows[line] = {
                "flow_rate": line_data.get("current_flow"),
                "total": line_data.get("total"),
                "today_usage": line_data.get("today_usage"),
                "leak_score": line_data.get("leak_score"),
                "baseline": line_data.get("baseline"),
                "last_session": line_data.get("last_session"),
                "flow_history": [
                    [round(ts), flow]
                    for ts, flow in (line_data.get("flow_history") or [])
                ],
            }
        result["flows"] = flows

    # Room quality (UltimateSensor / UltimateSensor Mini)
    if data is not None and hasattr(data, "score_percentage"):
        result["room"] = {
            "score": data.score,
            "score_percentage": data.score_percentage,
            "label": data.label,
            "color": data.color,
            "recommendations": data.recommendations,
            "metrics": [
                {
                    "key": "co2",
                    "label": "CO₂",
                    "value": data.co2,
                    "unit": "ppm",
                    "status": data.co2_status,
                },
                {
                    "key": "pm25",
                    "label": "PM2.5",
                    "value": data.pm25,
                    "unit": "µg/m³",
                    "status": data.pm25_status,
                },
                {
                    "key": "voc",
                    "label": "VOC index",
                    "value": data.voc,
                    "unit": "",
                    "status": data.voc_status,
                },
                {
                    "key": "temperature",
                    "label": "Temperature",
                    "value": data.temperature,
                    "unit": "°C",
                    "status": data.temperature_status,
                },
                {
                    "key": "humidity",
                    "label": "Humidity",
                    "value": data.humidity,
                    "unit": "%",
                    "status": data.humidity_status,
                },
            ],
            "illuminance": data.illuminance,
            "sensors_present": list(getattr(data, "sensors_present", []) or []),
        }

    # Live radar overview for presence products (scanned from the device entities)
    if product_type in (
        "ultimatesensor",
        "ultimatesensor_mini",
        "ceilsense",
        "wallsense",
    ):
        result["radar"] = _radar_overview(hass, device_id)

    tracker = getattr(coordinator, "energy_tracker", None)
    if tracker is not None:
        e = tracker.data
        result["energy"] = {
            "power_w": e.power_w,
            "net_power_w": e.net_power_w,
            "standby_w": e.standby_w,
            "standby_cost_year": e.standby_cost_year,
            "month_peak_kw": e.month_peak_kw,
            "peak_month": e.peak_month,
            "cost_today": e.cost_today,
            "cost_month": e.cost_month,
            "phase_currents": e.phase_currents,
            "phase_max_load_pct": e.phase_max_load_pct,
            "gas_total": e.gas_total,
            "power_history": [
                [round(ts), w] for ts, w in getattr(tracker, "power_history", [])
            ],
        }

    connection.send_result(msg["id"], result)


def _entry_for_device(hass: HomeAssistant, device_id: str):
    """Return the SmartHomeShop entry linked to an ESPHome source device."""
    source = resolve_source_device(hass, device_id)
    source_device_id = source.id if source is not None else device_id
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry_matches_source_device(hass, entry, source_device_id):
            return entry
    return None


def _product_for_registry_device(hass: HomeAssistant, device) -> str | None:
    """Resolve a supported product from metadata or its registered entities."""
    device = resolve_source_device(hass, device.id) or device
    product_type = product_for_device(device.manufacturer, device.model)
    if product_type is not None:
        return product_type

    entity_registry = er.async_get(hass)
    for entity in er.async_entries_for_device(
        entity_registry, device.id, include_disabled_entities=True
    ):
        entity_id_lower = entity.entity_id.lower()
        for pattern, product in _PATTERNS_MOST_SPECIFIC_FIRST:
            if pattern in entity_id_lower:
                return product
    return None


# Accepted clock values for a "time" field: HH:MM as the panel input sends it,
# and the HH:MM:SS the options-flow TimeSelector may have stored, so an
# untouched field survives a save from the panel.
_TIME_VALUE = re.compile(r"^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$")

# Local price option -> tariff key from a connected contract. A field is
# "managed" (hidden in the panel, driven by the contract) only when the
# contract actually supplies that value, matching the coordinator logic.
_CONTRACT_TARIFF_KEYS = {
    CONF_PRICE_T1: "electricity_t1",
    CONF_PRICE_T2: "electricity_t2",
    CONF_PRICE_FEED_IN: "feed_in",
    CONF_PRICE_GAS: "gas",
    CONF_PRICE_WATER: "water",
}


def _config_fields(
    product_type: str | None,
    options: dict,
    ha_prices: dict | None = None,
    contract_tariffs: dict | None = None,
) -> list[dict]:
    """Editable product options, mirroring the config/options flow.

    Price fields fall back to the HA Energy Dashboard static price (if set)
    before the hardcoded default, so the panel prefills what HA already uses.
    When a contract supplies a price, the field is flagged ``managed`` so the
    panel hides it (the contract is the source of truth).
    """
    ha_prices = ha_prices or {}
    contract_tariffs = contract_tariffs or {}

    def pick(key: str, default):
        if options.get(key) not in (None, ""):
            return options.get(key)
        return ha_prices.get(key, default)

    def managed(key: str) -> bool:
        value = contract_tariffs.get(_CONTRACT_TARIFF_KEYS.get(key, ""))
        if not isinstance(value, (int, float)):
            return False
        # Water only counts when a real price is set (coordinator ignores 0).
        return value > 0 if key == CONF_PRICE_WATER else True

    def price_field(field: dict) -> dict:
        field["price"] = True
        field["managed"] = managed(field["key"])
        return field

    fields: list[dict] = []
    if product_type in _WATER_PRODUCTS:
        fields += [
            {
                "key": CONF_CONTINUOUS_FLOW_MINUTES,
                "label": "Continuous-flow window",
                "help": "How long water must flow non-stop before it counts as continuous flow.",
                "type": "number",
                "unit": "min",
                "min": 5,
                "max": 120,
                "step": 5,
                "value": options.get(
                    CONF_CONTINUOUS_FLOW_MINUTES, DEFAULT_CONTINUOUS_FLOW_MINUTES
                ),
            },
            {
                "key": CONF_NIGHT_START,
                "label": "Night starts",
                "help": "Start of the night window used for night-usage leak detection.",
                "type": "time",
                "value": options.get(CONF_NIGHT_START, DEFAULT_NIGHT_START),
            },
            {
                "key": CONF_NIGHT_END,
                "label": "Night ends",
                "type": "time",
                "value": options.get(CONF_NIGHT_END, DEFAULT_NIGHT_END),
            },
            {
                "key": CONF_VACATION_MODE_ENTITY,
                "label": "Vacation mode toggle",
                "help": "Optional input_boolean that marks you as away (stricter leak checks).",
                "type": "entity",
                "domain": "input_boolean",
                "value": options.get(CONF_VACATION_MODE_ENTITY, ""),
            },
            {
                "key": "leak_score_threshold",
                "label": "Leak alarm sensitivity",
                "help": "Alarm when the smart leak score stays above this. Lower = more sensitive.",
                "type": "number",
                "unit": "score",
                "min": 20,
                "max": 95,
                "step": 5,
                "value": options.get("leak_score_threshold", 60),
            },
            {
                "key": "min_learning_days",
                "label": "Learning period",
                "help": "Days of normal usage the leak detection learns from before pattern alarms arm.",
                "type": "number",
                "unit": "days",
                "min": 1,
                "max": 30,
                "step": 1,
                "value": options.get("min_learning_days", 7),
            },
        ]
    if product_type in _WATER_COST_PRODUCTS:
        fields.append(
            price_field(
                {
                    "key": CONF_PRICE_WATER,
                    "label": "Water price",
                    "type": "number",
                    "unit": "€/m³",
                    "min": 0,
                    "max": 15,
                    "step": 0.01,
                    "value": pick(CONF_PRICE_WATER, DEFAULT_PRICE_WATER),
                }
            )
        )
    if product_type in _ENERGY_PRODUCTS:
        fields += [
            price_field(
                {
                    "key": CONF_PRICE_T1,
                    "label": "Electricity price (T1)",
                    "type": "number",
                    "unit": "€/kWh",
                    "min": 0,
                    "max": 5,
                    "step": 0.001,
                    "value": pick(CONF_PRICE_T1, DEFAULT_PRICE_T1),
                }
            ),
            price_field(
                {
                    "key": CONF_PRICE_T2,
                    "label": "Electricity price (T2)",
                    "type": "number",
                    "unit": "€/kWh",
                    "min": 0,
                    "max": 5,
                    "step": 0.001,
                    "value": pick(CONF_PRICE_T2, DEFAULT_PRICE_T2),
                }
            ),
            price_field(
                {
                    "key": CONF_PRICE_FEED_IN,
                    "label": "Feed-in price",
                    "type": "number",
                    "unit": "€/kWh",
                    "min": 0,
                    "max": 5,
                    "step": 0.001,
                    "value": pick(CONF_PRICE_FEED_IN, DEFAULT_PRICE_FEED_IN),
                }
            ),
            price_field(
                {
                    "key": CONF_PRICE_GAS,
                    "label": "Gas price",
                    "type": "number",
                    "unit": "€/m³",
                    "min": 0,
                    "max": 15,
                    "step": 0.001,
                    "value": pick(CONF_PRICE_GAS, DEFAULT_PRICE_GAS),
                }
            ),
            {
                "key": CONF_MAIN_FUSE_AMPS,
                "label": "Main fuse",
                "help": "Your main fuse rating, used for the phase-load percentage.",
                "type": "number",
                "unit": "A",
                "min": 10,
                "max": 80,
                "step": 1,
                "value": options.get(CONF_MAIN_FUSE_AMPS, DEFAULT_MAIN_FUSE_AMPS),
            },
        ]
    return fields


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/device/config",
        vol.Required("device_id"): str,
    }
)
@websocket_api.async_response
async def ws_get_device_config(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the editable product options for a device."""
    prices = hass.data.get(DOMAIN, {}).get("prices")
    contract = prices.contract() if prices and prices.contract_active() else None
    # The contract facts belong to the account, not to the device, so they go
    # out for an unlinked device too: the Automations tab reads them to tell
    # "no dynamic contract" apart from "this device is not linked yet".
    account = {
        "contract_active": contract is not None,
        "contract_name": (contract or {}).get("name"),
        "price_optimisation": bool(prices and prices.supports_price_optimisation()),
        "contract_type": prices.contract_type() if prices else None,
    }

    entry = _entry_for_device(hass, msg["device_id"])
    if entry is None:
        connection.send_result(
            msg["id"], {"configured": False, "fields": [], **account}
        )
        return
    product_type = entry.data.get(CONF_PRODUCT_TYPE)
    from .energy_prices import async_ha_energy_prices

    ha_prices = await async_ha_energy_prices(hass)
    tariffs = prices.contract_tariffs() if contract else {}
    connection.send_result(
        msg["id"],
        {
            "configured": True,
            "product_type": product_type,
            "fields": _config_fields(
                product_type, dict(entry.options), ha_prices, tariffs
            ),
            **account,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/device/config/set",
        vol.Required("device_id"): str,
        vol.Required("values"): dict,
    }
)
@websocket_api.async_response
async def ws_set_device_config(hass: HomeAssistant, connection, msg: dict) -> None:
    """Update the product options; reloads the entry via the update listener."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    entry = _entry_for_device(hass, msg["device_id"])
    if entry is None:
        connection.send_error(msg["id"], "not_found", "Device not linked")
        return

    product_type = entry.data.get(CONF_PRODUCT_TYPE)
    prices = hass.data.get(DOMAIN, {}).get("prices")
    tariffs = (
        prices.contract_tariffs()
        if prices is not None and prices.contract_active()
        else {}
    )
    allowed = {
        f["key"]: f
        for f in _config_fields(
            product_type, dict(entry.options), contract_tariffs=tariffs
        )
    }
    new_options = dict(entry.options)
    for key, value in (msg["values"] or {}).items():
        field = allowed.get(key)
        if field is None:
            continue
        # Contract-managed prices are read-only (the contract is the source
        # of truth); the panel hides them, so reject writes here too.
        if field.get("managed"):
            continue
        if field["type"] == "number":
            try:
                num = float(value)
            except (TypeError, ValueError):
                continue
            lo, hi = field.get("min"), field.get("max")
            if lo is not None:
                num = max(lo, num)
            if hi is not None:
                num = min(hi, num)
            new_options[key] = num
        elif field["type"] == "time":
            # A cleared or half-typed time input arrives as "", which the
            # coordinators cannot parse and would break night detection for
            # good, so only a real clock value replaces the stored one.
            if not isinstance(value, str) or not _TIME_VALUE.match(value):
                continue
            new_options[key] = value
        elif field["type"] == "entity":
            # An empty value clears the picker; anything else has to be a
            # real entity id in the domain this field asks for.
            if not isinstance(value, str):
                continue
            entity_id = value.strip()
            domain = field.get("domain")
            if entity_id and (
                not valid_entity_id(entity_id)
                or (domain and entity_id.split(".", 1)[0] != domain)
            ):
                continue
            new_options[key] = entity_id
        else:
            # Every declared field type is validated above; a new type must
            # add its own check here before its value can reach the options.
            continue

    hass.config_entries.async_update_entry(entry, options=new_options)
    connection.send_result(msg["id"], {"ok": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/device/link",
        vol.Required("device_id"): str,
    }
)
@websocket_api.async_response
async def ws_link_device(hass: HomeAssistant, connection, msg: dict) -> None:
    """One-click link: create the config entry for a detected device.

    The panel shows this for SmartHomeShop devices that are discovered via
    ESPHome but have no config entry yet, so the user never has to walk
    through Settings -> Devices & Services by hand.
    """
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return

    device_id = msg["device_id"]
    device = resolve_source_device(hass, device_id)
    if device is None:
        connection.send_error(msg["id"], "not_found", "Device not found")
        return
    device_id = device.id

    if _entry_for_device(hass, device_id) is not None:
        connection.send_error(
            msg["id"], "already_linked", "This device is already linked"
        )
        return

    # ESPHome project metadata wins; entity ids cover older firmware. The
    # shared resolver also protects the removal endpoint from being used for
    # arbitrary non-SmartHomeShop devices.
    product_type = _product_for_registry_device(hass, device)
    if product_type is None:
        connection.send_error(
            msg["id"],
            "unknown_product",
            "Could not detect which SmartHomeShop product this device is",
        )
        return

    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": SOURCE_IMPORT},
        data={CONF_PRODUCT_TYPE: product_type, CONF_DEVICE_ID: device_id},
    )

    if result.get("type") == FlowResultType.CREATE_ENTRY:
        entry = result.get("result")
        LOGGER.info(
            "Linked device %s as %s from the panel",
            device.name_by_user or device.name,
            product_type,
        )
        connection.send_result(
            msg["id"],
            {
                "ok": True,
                "entry_id": entry.entry_id if entry else None,
                "product_type": product_type,
            },
        )
        return

    reason = result.get("reason", "unknown")
    messages = {
        "already_configured": "This device is already linked",
        "already_in_progress": (
            "A setup for this device is already open. Finish or close the "
            "dialog in Settings, then try again."
        ),
        "no_water_sensor": (
            "No water sensor was found on this device. Make sure the device "
            "is online and its water sensors are enabled in Home Assistant, "
            "then try again."
        ),
        "device_not_found": "Device not found",
    }
    connection.send_error(
        msg["id"],
        "link_failed",
        messages.get(reason, f"Could not link this device ({reason})"),
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/device/remove",
        vol.Required("device_id"): str,
        vol.Required("mode"): vol.In(("hide", "unlink", "full")),
    }
)
@websocket_api.async_response
async def ws_remove_device(hass: HomeAssistant, connection, msg: dict) -> None:
    """Hide, unlink, or fully remove a discovered SmartHomeShop device."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return

    device_id = msg["device_id"]
    mode = msg["mode"]
    device = resolve_source_device(hass, device_id)
    if device is None:
        connection.send_error(msg["id"], "not_found", "Device not found")
        return
    device_id = device.id

    # A caller can provide any registry id over WebSocket. Never let this
    # convenience endpoint remove a device outside the products shown by our
    # panel, even for an administrator.
    product_type = _product_for_registry_device(hass, device)
    if product_type is None:
        connection.send_error(
            msg["id"], "unsupported_device", "This is not a SmartHomeShop device"
        )
        return

    integration_entry = _entry_for_device(hass, device_id)
    esphome_entries = config_entries_for_device_domain(hass, device_id, "esphome")
    store = hass.data.get(DOMAIN, {}).get("store")

    if mode == "unlink" and integration_entry is None:
        connection.send_error(
            msg["id"], "not_linked", "This device is not linked to SmartHomeShop"
        )
        return
    if mode == "hide" and store is None:
        connection.send_error(
            msg["id"], "not_ready", "SmartHomeShop storage is not ready"
        )
        return
    if mode == "full" and not esphome_entries:
        connection.send_error(
            msg["id"],
            "esphome_not_found",
            "No ESPHome configuration was found for this device",
        )
        return

    removed_domains: list[str] = []
    require_restart = False
    try:
        # Remove our layer first. If that fails, the ESPHome source and its
        # entities remain untouched. The full option only continues after the
        # SmartHomeShop cleanup has completed successfully.
        if integration_entry is not None:
            result = await hass.config_entries.async_remove(integration_entry.entry_id)
            require_restart = require_restart or bool(result.get("require_restart"))
            removed_domains.append(DOMAIN)

        if mode == "full":
            for entry in esphome_entries:
                result = await hass.config_entries.async_remove(entry.entry_id)
                require_restart = require_restart or bool(result.get("require_restart"))
                removed_domains.append("esphome")
        elif mode == "hide":
            await store.async_hide_device(
                source_device_storage_key(hass, device),
                {
                    "name": getattr(device, "name_by_user", None)
                    or getattr(device, "name", None)
                    or "Unknown",
                    "model": getattr(device, "model", None),
                    "product_type": product_type,
                },
            )
    except Exception:  # Home Assistant logs the underlying integration error.
        LOGGER.exception(
            "Failed to remove device %s in mode %s after removing %s",
            device_id,
            mode,
            removed_domains,
        )
        detail = (
            "The SmartHomeShop link was removed, but Home Assistant could not "
            "finish removing ESPHome. Open Devices & Services to review it."
            if DOMAIN in removed_domains and mode == "full"
            else "Home Assistant could not remove this device. No ESPHome entry was removed."
        )
        connection.send_error(msg["id"], "remove_failed", detail)
        return

    LOGGER.info(
        "Removed device %s (%s) from %s",
        device_id,
        product_type,
        ", ".join(removed_domains),
    )
    connection.send_result(
        msg["id"],
        {
            "ok": True,
            "mode": mode,
            "hidden": mode == "hide",
            "removed_smarthomeshop": DOMAIN in removed_domains,
            "removed_esphome": "esphome" in removed_domains,
            "require_restart": require_restart,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/device/unhide",
        vol.Required("device_id"): str,
    }
)
@websocket_api.async_response
async def ws_unhide_device(hass: HomeAssistant, connection, msg: dict) -> None:
    """Restore a hidden device to the panel without changing ESPHome."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    device = resolve_source_device(hass, msg["device_id"])
    if device is None or _product_for_registry_device(hass, device) is None:
        connection.send_error(msg["id"], "not_found", "Device not found")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(
            msg["id"], "not_ready", "SmartHomeShop storage is not ready"
        )
        return
    restored = await store.async_unhide_device(source_device_storage_key(hass, device))
    connection.send_result(msg["id"], {"ok": True, "restored": restored})


def _account_result(hass: HomeAssistant) -> dict:
    """Build the account/price status payload for the panel."""
    domain_data = hass.data.get(DOMAIN, {})
    store = domain_data.get("store")
    prices = domain_data.get("prices")
    refresh_task = domain_data.get(_ACCOUNT_REFRESH_TASK)
    account = store.get_account() if store else {}
    result = {
        "has_key": bool(account.get("api_key")),
        "base_url": resolve_api_base_url(account.get("base_url")),
        "contract_id": account.get("contract_id"),
        "location_id": account.get("location_id"),
        "status": getattr(prices, "status", "unconfigured"),
        "last_error": getattr(prices, "last_error", None),
        "last_synced": getattr(prices, "last_synced", None),
        "interval_minutes": getattr(prices, "update_interval_minutes", 30),
        "refreshing": bool(refresh_task and not refresh_task.done()),
    }
    # Resolve the price entity_ids so the panel can open their more-info dialog
    # (robust against renames: looked up by unique_id, not a hardcoded id).
    ent_reg = er.async_get(hass)

    def _price_entity(key: str) -> str | None:
        return ent_reg.async_get_entity_id("sensor", DOMAIN, f"{DOMAIN}_price_{key}")

    result["entities"] = {
        "electricity": _price_entity("electricity_price"),
        "level": _price_entity("electricity_price_level"),
        "feed_in": _price_entity("electricity_feed_in_price"),
        "gas": _price_entity("gas_price"),
        "water": _price_entity("water_price"),
        "contract_name": _price_entity("contract_name"),
        "provider": _price_entity("energy_provider"),
        "contract_type": _price_entity("contract_type"),
        "import_t1": _price_entity("electricity_import_t1_price"),
        "import_t2": _price_entity("electricity_import_t2_price"),
        "feed_in_t1": _price_entity("electricity_export_t1_price"),
        "feed_in_t2": _price_entity("electricity_export_t2_price"),
        "fixed_daily": _price_entity("net_fixed_cost_daily"),
        "fixed_yearly": _price_entity("net_fixed_cost_yearly"),
    }
    if prices is not None and prices.status == "ok":
        result["current"] = {
            "electricity": prices.electricity_price(),
            "electricity_market": prices.electricity_market_price(),
            "feed_in": prices.electricity_feed_in(),
            "gas": prices.gas_price(),
            "water": prices.water_price(),
            "level": prices.electricity_level(),
        }
        result["contract"] = prices.contract()
        result["capabilities"] = {
            "price_optimisation": prices.supports_price_optimisation(),
            "requires_tariff_selection": (
                prices.requires_tariff_selection()
                and prices.active_tariff_code() is None
            ),
            "contract_requires_tariff_selection": (prices.requires_tariff_selection()),
            "active_tariff": prices.active_tariff_code(),
            "tariff_entity": prices.active_tariff_entity_id(),
            "tariff_raw": prices.active_tariff_raw(),
            "effective_resolution": prices.effective_resolution(),
            "is_fallback": prices.price_is_fallback(),
        }
        result["tariffs"] = prices.contract_tariffs()
        result["fixed_costs"] = {
            "daily": prices.net_fixed_cost_daily(),
            "yearly": prices.net_fixed_cost_yearly(),
        }
        result["summary"] = {
            "average": prices.average_today(),
            "lowest": prices.lowest_today(),
            "highest": prices.highest_today(),
            "cheap_now": prices.cheap_now(),
            "difference": prices.difference_from_average(),
            "difference_percentage": prices.difference_percentage_from_average(),
            "rank": prices.current_price_rank(),
            "ranked_hours": prices.ranked_price_hours(),
            "lowest_period": prices.lowest_period(),
            "highest_period": prices.highest_period(),
            "next_lower_period": prices.next_lower_period(),
            "spread": prices.price_spread_today(),
            "negative_hours": prices.negative_hours_today(),
            "cheapest_3h": prices.cheapest_block(3),
        }
    return result


async def _async_refresh_account_prices(prices: Any) -> None:
    """Refresh prices without leaving a WebSocket request unanswered."""
    if prices is None:
        return
    try:
        await asyncio.wait_for(prices.async_refresh(), timeout=_ACCOUNT_REFRESH_TIMEOUT)
    except TimeoutError:
        prices.status = "error"
        prices.last_error = f"The price service did not respond within {_ACCOUNT_REFRESH_TIMEOUT} seconds."
        LOGGER.warning(
            "Dynamic energy price refresh timed out after %s seconds",
            _ACCOUNT_REFRESH_TIMEOUT,
        )
    except Exception as err:  # Coordinator errors must not strand the panel.
        prices.status = "error"
        if not getattr(prices, "last_error", None):
            prices.last_error = "Could not refresh dynamic energy prices."
        LOGGER.warning("Dynamic energy price refresh failed: %s", err)


async def _async_run_account_refresh(hass: HomeAssistant, prices: Any) -> None:
    """Run one account refresh and release its shared task slot."""
    try:
        await _async_refresh_account_prices(prices)
    finally:
        domain_data = hass.data.get(DOMAIN, {})
        if domain_data.get(_ACCOUNT_REFRESH_TASK) is asyncio.current_task():
            domain_data.pop(_ACCOUNT_REFRESH_TASK, None)


def _account_selection(account: dict) -> tuple[str, str, str, str]:
    """The account fields that decide which prices get fetched."""
    return (
        (account.get("api_key") or "").strip(),
        resolve_api_base_url(account.get("base_url")),
        str(account.get("contract_id") or ""),
        str(account.get("location_id") or ""),
    )


def _schedule_account_price_refresh(
    hass: HomeAssistant, prices: Any, restart: bool = False
) -> asyncio.Task | None:
    """Start one non-blocking account refresh, reusing an active task.

    A fetch that is already running answers the selection it started with, so
    after a contract or location change it is dropped instead of reused: its
    200 would otherwise land as the prices of the location the user just left.
    """
    if prices is None:
        return None

    domain_data = hass.data.setdefault(DOMAIN, {})
    active_task = domain_data.get(_ACCOUNT_REFRESH_TASK)
    if active_task is not None and not active_task.done():
        if not restart:
            return active_task
        active_task.cancel()

    task = hass.async_create_task(_async_run_account_refresh(hass, prices))
    domain_data[_ACCOUNT_REFRESH_TASK] = task
    return task


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/account"})
@callback
def ws_get_account(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the account/API-key status and current prices."""
    connection.send_result(msg["id"], _account_result(hass))


@websocket_api.websocket_command(
    {vol.Required("type"): "smarthomeshop/account/refresh"}
)
@callback
def ws_refresh_account(hass: HomeAssistant, connection, msg: dict) -> None:
    """Start a price refresh and immediately return its current status."""
    prices = hass.data.get(DOMAIN, {}).get("prices")
    _schedule_account_price_refresh(hass, prices)
    connection.send_result(msg["id"], _account_result(hass))


@websocket_api.websocket_command(
    {vol.Required("type"): "smarthomeshop/prices/entities"}
)
@callback
def ws_get_price_entities(hass: HomeAssistant, connection, msg: dict) -> None:
    """Resolve the energy-price entity_ids so automations trigger on the right
    entities (looked up by unique_id, robust against user renames)."""
    ent_reg = er.async_get(hass)

    def eid(platform: str, key: str) -> str | None:
        return ent_reg.async_get_entity_id(platform, DOMAIN, f"{DOMAIN}_price_{key}")

    entities: dict[str, str | None] = {
        "electricity_price": eid("sensor", "electricity_price"),
        "price_level": eid("sensor", "electricity_price_level"),
        "feed_in_price": eid("sensor", "electricity_feed_in_price"),
        "gas_price": eid("sensor", "gas_price"),
        "water_price": eid("sensor", "water_price"),
        "contract_name": eid("sensor", "contract_name"),
        "energy_provider": eid("sensor", "energy_provider"),
        "contract_type": eid("sensor", "contract_type"),
        "electricity_import_t1_price": eid("sensor", "electricity_import_t1_price"),
        "electricity_import_t2_price": eid("sensor", "electricity_import_t2_price"),
        "electricity_export_t1_price": eid("sensor", "electricity_export_t1_price"),
        "electricity_export_t2_price": eid("sensor", "electricity_export_t2_price"),
        "net_fixed_cost_daily": eid("sensor", "net_fixed_cost_daily"),
        "net_fixed_cost_yearly": eid("sensor", "net_fixed_cost_yearly"),
        "cheap_now": eid("binary_sensor", "cheap_now"),
        "contract_active": eid("binary_sensor", "contract_active"),
        "tomorrow_available": eid("binary_sensor", "tomorrow_available"),
    }
    for hours in range(1, 7):
        entities[f"cheapest_{hours}h_start"] = eid("sensor", f"cheapest_{hours}h_start")
        entities[f"cheapest_{hours}h_window_now"] = eid(
            "binary_sensor", f"cheapest_{hours}h_window_now"
        )
    connection.send_result(msg["id"], {"entities": entities})


def _schedule_payload(hass: HomeAssistant, schedule: dict) -> dict:
    """A schedule plus its resolved entity_id and live plan state."""
    ent_reg = er.async_get(hass)
    eid = ent_reg.async_get_entity_id(
        "binary_sensor", DOMAIN, f"{DOMAIN}_schedule_{schedule['id']}"
    )
    item = dict(schedule)
    item["entity_id"] = eid
    state = hass.states.get(eid) if eid else None
    if state is not None:
        item["active"] = state.state == "on"
        item["next_start"] = state.attributes.get("next_start")
        item["forced"] = state.attributes.get("forced")
        item["reason"] = state.attributes.get("reason")
    return item


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/schedules"})
@callback
def ws_get_schedules(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the smart-energy deadline schedules with their live plan."""
    store = hass.data.get(DOMAIN, {}).get("store")
    schedules = store.get_schedules() if store else []
    connection.send_result(
        msg["id"], {"schedules": [_schedule_payload(hass, s) for s in schedules]}
    )


_HHMM = vol.Match(r"^([01]?\d|2[0-3]):[0-5]\d$")


def _valid_hhmm(value: str) -> bool:
    """Return whether a nested Smart Energy time has a valid HH:MM value."""
    return re.fullmatch(r"^([01]?\d|2[0-3]):[0-5]\d$", value) is not None


# The field is called schedule_id (not id): every HA websocket message already
# carries a required integer "id", so an "id" key in the command schema would
# override that base field and reject every call.
@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/schedules/set",
        vol.Optional("schedule_id"): str,
        vol.Required("name"): vol.All(str, vol.Length(min=1, max=80)),
        vol.Required("target_entity"): str,
        vol.Required("hours"): vol.All(vol.Coerce(int), vol.Range(min=1, max=24)),
        vol.Required("ready_by"): _HHMM,
        vol.Optional("earliest"): vol.Any(_HHMM, None),
        vol.Optional("interruptible"): bool,
        vol.Optional("guard"): bool,
        vol.Optional("load_power"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0, max=25000))
        ),
        vol.Optional("enabled"): bool,
    }
)
@websocket_api.async_response
async def ws_set_schedule(hass: HomeAssistant, connection, msg: dict) -> None:
    """Create or update a deadline schedule and refresh its sensor."""
    from homeassistant.helpers.dispatcher import async_dispatcher_send

    from .const import SIGNAL_SCHEDULES_CHANGED

    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    schedule = {
        k: msg[k]
        for k in (
            "name",
            "target_entity",
            "hours",
            "ready_by",
            "earliest",
            "interruptible",
            "guard",
            "load_power",
            "enabled",
        )
        if k in msg
    }
    if msg.get("schedule_id"):
        schedule["id"] = msg["schedule_id"]
    async def validate_and_save() -> dict[str, Any]:
        conflict = _schedule_control_conflict(store, schedule)
        if conflict:
            raise vol.Invalid(conflict)
        return await store.async_save_schedule(schedule)

    coordinator = hass.data.get(DOMAIN, {}).get("smart_loads")
    try:
        if coordinator is not None:
            async with coordinator._cycle_lock:
                saved = await validate_and_save()
        else:
            saved = await validate_and_save()
    except vol.Invalid as err:
        connection.send_error(msg["id"], "control_conflict", str(err))
        return
    async_dispatcher_send(hass, SIGNAL_SCHEDULES_CHANGED)
    connection.send_result(msg["id"], {"schedule": _schedule_payload(hass, saved)})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/schedules/delete",
        vol.Required("schedule_id"): str,
    }
)
@websocket_api.async_response
async def ws_delete_schedule(hass: HomeAssistant, connection, msg: dict) -> None:
    """Delete a deadline schedule and remove its sensor."""
    from homeassistant.helpers.dispatcher import async_dispatcher_send

    from .const import SIGNAL_SCHEDULES_CHANGED

    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    ok = await store.async_delete_schedule(msg["schedule_id"])
    async_dispatcher_send(hass, SIGNAL_SCHEDULES_CHANGED)
    connection.send_result(msg["id"], {"ok": ok})


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/savings"})
@callback
def ws_get_savings(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the measured smart-energy savings totals."""
    tracker = hass.data.get(DOMAIN, {}).get("savings")
    connection.send_result(
        msg["id"], {"savings": tracker.snapshot() if tracker else {}}
    )


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/battery"})
@callback
def ws_get_battery(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the home-battery control mapping."""
    store = hass.data.get(DOMAIN, {}).get("store")
    connection.send_result(msg["id"], {"battery": store.get_battery() if store else {}})


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/battery/plan"})
@callback
def ws_get_battery_plan(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the latest account-wide battery recommendation."""
    planner = hass.data.get(DOMAIN, {}).get("battery_plan")
    connection.send_result(
        msg["id"],
        {"plan": dict(planner.data or {}) if planner is not None else {}},
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/energy/journal",
        vol.Optional("limit", default=100): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=500)
        ),
    }
)
@callback
def ws_get_energy_journal(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return local Smart Energy decisions and learning metadata."""
    store = hass.data.get(DOMAIN, {}).get("store")
    connection.send_result(
        msg["id"],
        {
            "entries": store.get_energy_journal(msg["limit"]) if store else [],
            "learning": store.get_energy_learning() if store else {},
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/energy/journal/clear",
    }
)
@websocket_api.async_response
async def ws_clear_energy_journal(hass: HomeAssistant, connection, msg: dict) -> None:
    """Clear the local Smart Energy decision journal."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    await store.async_clear_energy_journal()
    connection.send_result(msg["id"], {"ok": True})


_BATTERY_SCHEMA = vol.Schema(
    {
        vol.Optional("enabled"): bool,
        vol.Optional("control_kind"): vol.In(["switch", "number", "select"]),
        vol.Optional("control_entity"): str,
        vol.Optional("charge_power"): vol.Any(None, vol.Coerce(float)),
        vol.Optional("max_discharge_power"): vol.Any(None, vol.Coerce(float)),
        vol.Optional("off_min"): vol.Any(None, vol.Coerce(float)),
        vol.Optional("charge_option"): vol.Any(None, str),
        vol.Optional("idle_option"): vol.Any(None, str),
        vol.Optional("discharge_option"): vol.Any(None, str),
        vol.Optional("soc_sensor"): vol.Any(None, str),
        vol.Optional("target_soc"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0, max=100))
        ),
        vol.Optional("reserve_soc"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0, max=100))
        ),
        vol.Optional("charge_hours"): vol.Any(
            None, vol.All(vol.Coerce(int), vol.Range(min=1, max=6))
        ),
        vol.Optional("capacity_kwh"): vol.Any(None, vol.Coerce(float)),
        vol.Optional("pv_forecast_sensor"): vol.Any(None, str),
        vol.Optional("load_forecast_sensor"): vol.Any(None, str),
        vol.Optional("charge_efficiency"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0.5, max=1))
        ),
        vol.Optional("discharge_efficiency"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0.5, max=1))
        ),
        vol.Optional("cycle_cost"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0))
        ),
        vol.Optional("assumed_load_power"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0))
        ),
        vol.Optional("grid_import_limit"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0))
        ),
        vol.Optional("grid_export_limit"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0))
        ),
        vol.Optional("minimum_confidence"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0, max=1))
        ),
        vol.Optional("planning_hours"): vol.Any(
            None, vol.All(vol.Coerce(int), vol.Range(min=6, max=48))
        ),
        vol.Optional("automatic_control"): bool,
        vol.Optional("execution_mode"): vol.In(["advice", "shadow", "automatic"]),
        vol.Optional("grid_guard_enabled"): bool,
        vol.Optional("grid_power_sensor"): vol.Any(None, str),
        vol.Optional("grid_safety_margin"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0, max=10000))
        ),
        vol.Optional("grid_data_max_age"): vol.Any(
            None, vol.All(vol.Coerce(int), vol.Range(min=15, max=600))
        ),
        vol.Optional("capacity_tariff_enabled"): bool,
        vol.Optional("capacity_tariff_top_n"): vol.Any(
            None, vol.All(vol.Coerce(int), vol.Range(min=1, max=5))
        ),
        vol.Optional("capacity_tariff_steps"): vol.Any(
            None,
            [vol.All(vol.Coerce(float), vol.Range(min=0.1, max=250))],
        ),
        vol.Optional("capacity_tariff_target_kw"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0.1, max=250))
        ),
        vol.Optional("learning_enabled"): bool,
        vol.Optional("learning_use_for_planning"): bool,
    },
    extra=vol.REMOVE_EXTRA,
)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/battery/set",
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def ws_set_battery(hass: HomeAssistant, connection, msg: dict) -> None:
    """Save the home-battery control mapping (validated, unknown keys dropped)."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    try:
        config = _BATTERY_SCHEMA(msg["config"])
    except vol.Invalid as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    if "execution_mode" not in config:
        config["execution_mode"] = (
            "automatic" if config.get("automatic_control") else "advice"
        )
    config["automatic_control"] = config["execution_mode"] == "automatic"
    if config.get("enabled") and config["automatic_control"]:
        route = str(config.get("control_entity") or "")
        if route and route in _active_smart_load_routes(store.get_smart_loads()):
            connection.send_error(
                msg["id"],
                "control_conflict",
                "Battery control is already used by automatic Smart Loads",
            )
            return
        if route and route in _active_smart_ev_routes(store.get_smart_ev()):
            connection.send_error(
                msg["id"],
                "control_conflict",
                "Battery control is already used by automatic Smart EV",
            )
            return
    coordinator = hass.data.get(DOMAIN, {}).get("smart_loads")
    if coordinator is not None:
        async with coordinator._cycle_lock:
            saved = await store.async_set_battery(config)
    else:
        saved = await store.async_set_battery(config)
    planner = hass.data.get(DOMAIN, {}).get("battery_plan")
    if planner is not None:
        await planner.async_request_refresh()
    connection.send_result(msg["id"], {"battery": saved})


_EV_ENTITY_FIELDS = (
    "soc_entity",
    "target_soc_entity",
    "plugged_entity",
    "home_entity",
    "charging_entity",
    "power_entity",
    "control_entity",
    "stop_entity",
    "calendar_entity",
)
_EV_NUMBER_RANGES: dict[str, tuple[float, float, float]] = {
    "capacity_kwh": (1, 250, 60),
    "target_soc": (1, 100, 80),
    "minimum_soc": (0, 100, 20),
    "charge_power_kw": (0.1, 50, 11),
    "max_current_a": (1, 80, 16),
    "min_current_a": (1, 80, 6),
    "off_current_a": (0, 80, 0),
    "phases": (1, 3, 3),
    "voltage": (100, 500, 230),
    "charge_efficiency": (0.5, 1, 0.9),
    "planning_hours": (6, 72, 36),
    "one_go_extra_eur": (0, 20, 0.35),
    "plan_stability_eur": (0, 20, 0.15),
    "grid_import_limit_w": (0, 100000, 17000),
    "grid_safety_margin_w": (0, 10000, 250),
}
_EV_MODES = {"smart", "charge_now", "pause", "off"}
_EV_EXECUTION_MODES = {"advice", "shadow", "automatic"}
_EV_CONTROL_KINDS = {"switch", "number", "select"}
_EV_PREFERENCES = {"balanced", "solar_first", "price_first"}


def _bounded_ev_number(value: Any, key: str) -> float:
    minimum, maximum, default = _EV_NUMBER_RANGES[key]
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = default
    if not math.isfinite(parsed):
        parsed = default
    return max(minimum, min(maximum, parsed))


def _validated_ev_number(value: Any, key: str) -> float:
    """Validate an explicitly submitted EV number without silently clamping it."""
    minimum, maximum, _default = _EV_NUMBER_RANGES[key]
    message = (
        "charge_power_kw must be a positive number"
        if key == "charge_power_kw"
        else f"{key} must be between {minimum:g} and {maximum:g}"
    )
    try:
        parsed = float(value)
    except (TypeError, ValueError) as err:
        raise vol.Invalid(message) from err
    if not math.isfinite(parsed) or not minimum <= parsed <= maximum:
        raise vol.Invalid(message)
    if key == "phases" and parsed not in {1.0, 3.0}:
        raise vol.Invalid("phases must be 1 or 3")
    return parsed


def _optional_entity(value: Any, field: str) -> str | None:
    entity_id = str(value or "").strip()
    if not entity_id:
        return None
    if not valid_entity_id(entity_id):
        raise vol.Invalid(f"{field} is not a valid Home Assistant entity id")
    return entity_id


def _smart_ev_vehicle(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise vol.Invalid("Every vehicle must be an object")
    vehicle_id = re.sub(r"[^a-zA-Z0-9_-]", "", str(raw.get("id") or ""))[:64]
    vehicle_id = vehicle_id or str(uuid.uuid4())
    name = str(raw.get("name") or "Electric vehicle").strip()[:80]
    control_kind = str(raw.get("control_kind") or "switch")
    if control_kind not in _EV_CONTROL_KINDS:
        raise vol.Invalid("control_kind must be switch, number or select")
    mode = str(raw.get("mode") or "smart")
    if mode not in _EV_MODES:
        raise vol.Invalid("Unknown vehicle mode")
    preference = str(raw.get("energy_preference") or "balanced")
    if preference not in _EV_PREFERENCES:
        raise vol.Invalid("Unknown energy preference")
    raw_charge_option = (
        raw["charge_option"] if "charge_option" in raw else "Charge"  # noqa: SIM401
    )
    raw_pause_option = (
        raw["pause_option"] if "pause_option" in raw else "Off"  # noqa: SIM401
    )
    result: dict[str, Any] = {
        "id": vehicle_id,
        "name": name,
        "enabled": bool(raw.get("enabled", True)),
        "mode": mode,
        "control_kind": control_kind,
        "energy_preference": preference,
        "ready_by": str(raw.get("ready_by") or "07:00"),
        "earliest_start": str(raw.get("earliest_start") or ""),
        "calendar_keyword": str(raw.get("calendar_keyword") or "charge")[:80],
        "charge_option": str(
            raw_charge_option if raw_charge_option is not None else ""
        ).strip()[:80],
        "pause_option": str(
            raw_pause_option if raw_pause_option is not None else ""
        ).strip()[:80],
        "charger_id": str(raw.get("charger_id") or vehicle_id)[:80],
        "allow_home_battery_support": bool(
            raw.get("allow_home_battery_support", False)
        ),
        "finish_in_one_go": bool(raw.get("finish_in_one_go", False)),
        # Fresh P1 and phase-headroom checks are mandatory in automatic mode.
        "grid_guard": True,
    }
    if not _valid_hhmm(str(result["ready_by"])):
        raise vol.Invalid("ready_by must be HH:MM")
    if result["earliest_start"] and not _valid_hhmm(str(result["earliest_start"])):
        raise vol.Invalid("earliest_start must be HH:MM")
    for field in _EV_ENTITY_FIELDS:
        result[field] = _optional_entity(raw.get(field), field)
    for key in _EV_NUMBER_RANGES:
        result[key] = (
            _validated_ev_number(raw.get(key), key)
            if key in raw
            else _EV_NUMBER_RANGES[key][2]
        )
    result["minimum_soc"] = min(result["minimum_soc"], result["target_soc"])
    result["min_current_a"] = min(result["min_current_a"], result["max_current_a"])
    if control_kind == "number" and result["off_current_a"] >= result["min_current_a"]:
        raise vol.Invalid("off_current_a must be lower than min_current_a")
    if control_kind == "select" and (
        not result["charge_option"]
        or not result["pause_option"]
        or result["charge_option"] == result["pause_option"]
    ):
        raise vol.Invalid(
            "charge_option and pause_option must be different non-empty options"
        )

    control_entity = result.get("control_entity")
    if control_entity and control_entity.split(".", 1)[0] != control_kind:
        raise vol.Invalid(f"control_entity must belong to the {control_kind} domain")
    stop_entity = result.get("stop_entity")
    if stop_entity and not stop_entity.startswith("switch."):
        raise vol.Invalid("stop_entity must belong to the switch domain")

    schedule: dict[str, dict[str, Any]] = {}
    raw_schedule = raw.get("schedule") if isinstance(raw.get("schedule"), dict) else {}
    for weekday in ("mon", "tue", "wed", "thu", "fri", "sat", "sun"):
        item = raw_schedule.get(weekday)
        if not isinstance(item, dict):
            continue
        ready_by = str(item.get("ready_by") or result["ready_by"])
        if not _valid_hhmm(ready_by):
            raise vol.Invalid(f"{weekday} ready_by must be HH:MM")
        schedule[weekday] = {
            "enabled": bool(item.get("enabled", True)),
            "ready_by": ready_by,
            "target_soc": (
                _validated_ev_number(item.get("target_soc"), "target_soc")
                if "target_soc" in item
                else result["target_soc"]
            ),
        }
    result["schedule"] = schedule
    return result


def _sanitise_smart_ev(raw: Any, hass: HomeAssistant | None = None) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise vol.Invalid("Smart EV configuration must be an object")
    execution_mode = str(raw.get("execution_mode") or "advice")
    if execution_mode not in _EV_EXECUTION_MODES:
        raise vol.Invalid("Unknown execution mode")
    vehicles = [_smart_ev_vehicle(item) for item in list(raw.get("vehicles") or [])[:8]]
    ids = [item["id"] for item in vehicles]
    if len(ids) != len(set(ids)):
        raise vol.Invalid("Every vehicle must have a unique id")
    shared_routes: dict[str, tuple[Any, ...]] = {}
    for vehicle in vehicles:
        control_entity = str(vehicle.get("control_entity") or "")
        if not control_entity:
            continue
        kind = str(vehicle.get("control_kind") or "switch")
        route = (
            kind,
            str(vehicle.get("stop_entity") or ""),
            float(vehicle.get("off_current_a") or 0) if kind == "number" else None,
            str(vehicle.get("charge_option") or "") if kind == "select" else None,
            str(vehicle.get("pause_option") or "") if kind == "select" else None,
        )
        previous_route = shared_routes.setdefault(control_entity, route)
        if previous_route != route:
            raise vol.Invalid(
                "Vehicles sharing one charger control must use the same stop route"
            )
    enabled = bool(raw.get("enabled", bool(vehicles)))
    if enabled and execution_mode == "automatic" and hass is not None:
        store = getattr(hass, "data", {}).get(DOMAIN, {}).get("store")
        smart_load_routes = _active_smart_load_routes(
            store.get_smart_loads() if store else {}
        )
        battery = store.get_battery() if store else {}
        battery_route = (
            str(battery.get("control_entity") or "")
            if battery.get("enabled")
            and str(battery.get("execution_mode") or "advice") == "automatic"
            else ""
        )
        # Same rule as Smart Loads: an enabled deadline schedule keeps
        # switching its target, so automatic charging must not share it.
        legacy_targets = _enabled_schedule_targets(store)
        for vehicle in vehicles:
            if not vehicle.get("enabled", True):
                continue
            vehicle_routes = {
                str(route)
                for route in (
                    vehicle.get("control_entity"),
                    vehicle.get("stop_entity"),
                )
                if route
            }
            if vehicle_routes & smart_load_routes:
                raise vol.Invalid(
                    f"{vehicle['name']}: a control is already used by automatic Smart Loads"
                )
            if vehicle_routes & legacy_targets:
                raise vol.Invalid(
                    f"{vehicle['name']}: one of its controls is still used by an enabled legacy deadline schedule"
                )
            if battery_route and battery_route in vehicle_routes:
                raise vol.Invalid(
                    f"{vehicle['name']}: a control is already used by automatic battery control"
                )
    if enabled and execution_mode == "automatic" and hass is not None:
        for vehicle in vehicles:
            if not vehicle.get("enabled", True):
                continue
            control_entity = vehicle.get("control_entity")
            if not control_entity or hass.states.get(str(control_entity)) is None:
                raise vol.Invalid(f"{vehicle['name']}: charger control is unavailable")
            if vehicle.get("control_kind") == "select":
                select_state = hass.states.get(str(control_entity))
                raw_options = (
                    select_state.attributes.get("options") if select_state else None
                )
                options = (
                    {str(item) for item in raw_options}
                    if isinstance(raw_options, (list, tuple))
                    else set()
                )
                if (
                    str(select_state.state).lower()
                    in {"unknown", "unavailable", "none"}
                    or vehicle["charge_option"] not in options
                    or vehicle["pause_option"] not in options
                ):
                    raise vol.Invalid(
                        f"{vehicle['name']}: choose charge and pause options exposed by the mode select"
                    )
            if vehicle.get("grid_guard", True):
                power_entity = vehicle.get("power_entity")
                power_state = (
                    hass.states.get(str(power_entity)) if power_entity else None
                )
                if power_state is None or str(power_state.state).lower() in {
                    "unknown",
                    "unavailable",
                    "none",
                }:
                    raise vol.Invalid(
                        f"{vehicle['name']}: choose an available charging-power sensor for safe automatic grid control"
                    )
            if vehicle.get("control_kind") != "number":
                continue
            state = hass.states.get(control_entity) if control_entity else None
            if state is None:
                raise vol.Invalid(f"{vehicle['name']}: current control is unavailable")
            minimum = float(state.attributes.get("min", 0) or 0)
            off_current = float(vehicle.get("off_current_a") or 0)
            stop_entity = vehicle.get("stop_entity")
            stop_state = hass.states.get(str(stop_entity)) if stop_entity else None
            stop_available = bool(
                stop_state is not None
                and str(stop_state.state).lower()
                not in {"", "none", "unknown", "unavailable"}
            )
            if (minimum > off_current or abs(off_current) > 0.01) and not stop_available:
                raise vol.Invalid(
                    f"{vehicle['name']}: choose a separate stop switch because the current control cannot accept the configured off current"
                )
    return {
        "enabled": enabled,
        "execution_mode": execution_mode,
        "vehicles": vehicles,
    }


def _smart_ev_result(hass: HomeAssistant) -> dict[str, Any]:
    store = hass.data.get(DOMAIN, {}).get("store")
    config = store.get_smart_ev() if store else {}
    coordinator = hass.data.get(DOMAIN, {}).get("smart_ev")
    live = coordinator.data or {} if coordinator else {}
    return {
        "config": {
            "enabled": config.get("enabled", False),
            "execution_mode": config.get("execution_mode", "advice"),
            "vehicles": config.get("vehicles", []),
        },
        "plans": live.get("plans", config.get("plans", {})),
        "journal": live.get(
            "journal", list(reversed(config.get("journal", [])[-100:]))
        ),
        "available": bool(
            coordinator is not None
            and getattr(coordinator, "last_update_success", True)
        ),
        "calculated_at": live.get("calculated_at"),
        "coordinator_error": (
            "Smart EV could not refresh its current state"
            if coordinator is not None
            and not getattr(coordinator, "last_update_success", True)
            else None
        ),
        "updating": bool(
            coordinator and getattr(coordinator, "update_in_progress", False)
        ),
    }


async def _async_clear_live_history(
    hass: HomeAssistant,
    coordinator_key: str,
    clear: Callable[[], Awaitable[None]],
    keys: tuple[str, ...],
) -> None:
    """Clear stored Smart EV or Smart Loads history and its live copy together."""
    coordinator = hass.data.get(DOMAIN, {}).get(coordinator_key)
    lock = getattr(coordinator, "_cycle_lock", None)

    async def _clear() -> None:
        await clear()
        # The live copy is only rebuilt on the next cycle; without this the
        # cleared rows would come back on the next panel poll.
        if coordinator is not None and isinstance(coordinator.data, dict):
            coordinator.data = {**coordinator.data, **{key: [] for key in keys}}

    if lock is not None:
        async with lock:
            await _clear()
    else:
        await _clear()


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/smart_ev"})
@callback
def ws_get_smart_ev(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return Smart EV configuration, live plans and its decision journal."""
    connection.send_result(msg["id"], _smart_ev_result(hass))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/smart_ev/set",
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def ws_set_smart_ev(hass: HomeAssistant, connection, msg: dict) -> None:
    """Validate and save the complete Smart EV configuration."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    try:
        config = _sanitise_smart_ev(msg["config"], hass)
    except vol.Invalid as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    await store.async_set_smart_ev(config)
    from homeassistant.helpers.dispatcher import async_dispatcher_send

    from .const import SIGNAL_SMART_EV_CHANGED

    async_dispatcher_send(hass, SIGNAL_SMART_EV_CHANGED)
    coordinator = hass.data.get(DOMAIN, {}).get("smart_ev")
    if coordinator is not None:
        await coordinator.async_refresh()
    connection.send_result(msg["id"], _smart_ev_result(hass))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/smart_ev/mode",
        vol.Required("vehicle_id"): str,
        vol.Required("mode"): vol.In(sorted(_EV_MODES)),
    }
)
@websocket_api.async_response
async def ws_set_smart_ev_mode(hass: HomeAssistant, connection, msg: dict) -> None:
    """Apply an explicit per-vehicle mode without rewriting form fields."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    saved = await store.async_set_smart_ev_vehicle_mode(msg["vehicle_id"], msg["mode"])
    if saved is None:
        connection.send_error(msg["id"], "not_found", "Vehicle not found")
        return
    coordinator = hass.data.get(DOMAIN, {}).get("smart_ev")
    if coordinator is not None:
        await coordinator.async_refresh()
    connection.send_result(msg["id"], _smart_ev_result(hass))


@websocket_api.websocket_command(
    {vol.Required("type"): "smarthomeshop/smart_ev/refresh"}
)
@websocket_api.async_response
async def ws_refresh_smart_ev(hass: HomeAssistant, connection, msg: dict) -> None:
    """Recalculate plans immediately and wait for guarded execution feedback."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    coordinator = hass.data.get(DOMAIN, {}).get("smart_ev")
    if coordinator is None:
        connection.send_error(msg["id"], "not_ready", "Smart Energy is disabled")
        return
    await coordinator.async_refresh()
    connection.send_result(msg["id"], _smart_ev_result(hass))


@websocket_api.websocket_command(
    {vol.Required("type"): "smarthomeshop/smart_ev/journal/clear"}
)
@websocket_api.async_response
async def ws_clear_smart_ev_journal(hass: HomeAssistant, connection, msg: dict) -> None:
    """Clear only Smart EV's explainable local decision history."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    await _async_clear_live_history(
        hass, "smart_ev", store.async_clear_smart_ev_journal, ("journal",)
    )
    connection.send_result(msg["id"], {**_smart_ev_result(hass), "journal": []})


_SMART_LOAD_CATEGORIES = {"appliance", "switch", "climate", "water_heater", "custom"}
_SMART_LOAD_MODES = {"smart", "run_now", "paused"}
_SMART_LOAD_EXECUTION_MODES = {"advice", "shadow", "automatic"}
_SMART_LOAD_PREFERENCES = {"balanced", "solar", "price"}
_SMART_LOAD_ENTITY_FIELDS = (
    "control_entity",
    "start_entity",
    "stop_entity",
    "status_entity",
    "ready_entity",
    "running_entity",
    "power_entity",
    "energy_entity",
    "door_entity",
    "remote_entity",
)


def _load_number(raw: dict[str, Any], key: str, minimum: float, maximum: float, default: float) -> float:
    """Validate a finite Smart Load number without silently accepting typos."""
    if key not in raw:
        return default
    try:
        value = float(raw[key])
    except (TypeError, ValueError) as err:
        raise vol.Invalid(f"{key} must be a number") from err
    if not math.isfinite(value) or not minimum <= value <= maximum:
        raise vol.Invalid(f"{key} must be between {minimum:g} and {maximum:g}")
    return value


def _smart_load_action(raw: Any, field: str) -> dict[str, Any] | None:
    """Accept one explicit HA service action; templates are intentionally excluded."""
    if raw in (None, {}, ""):
        return None
    if not isinstance(raw, dict):
        raise vol.Invalid(f"{field} must be an action object")
    service = str(raw.get("service") or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9_]+\.[a-z0-9_]+", service):
        raise vol.Invalid(f"{field}.service must be domain.service")
    data = raw.get("data") or {}
    if not isinstance(data, dict):
        raise vol.Invalid(f"{field}.data must be an object")
    entity_id = _optional_entity(raw.get("entity_id"), f"{field}.entity_id")
    data_entity = data.get("entity_id")
    if data_entity is not None:
        canonical = _optional_entity(data_entity, f"{field}.data.entity_id")
        if entity_id and canonical != entity_id:
            raise vol.Invalid(
                f"{field} contains two different entity targets"
            )
        entity_id = canonical
        data = {key: value for key, value in data.items() if key != "entity_id"}
    alternate_targets = {"device_id", "area_id", "floor_id", "label_id"} & set(data)
    if alternate_targets:
        raise vol.Invalid(
            f"{field}.data must use the explicit entity_id field for target safety"
        )
    def contains_template(value: Any) -> bool:
        if isinstance(value, str):
            return "{{" in value or "{%" in value
        if isinstance(value, dict):
            return any(contains_template(item) for item in value.values())
        if isinstance(value, (list, tuple)):
            return any(contains_template(item) for item in value)
        return False

    if contains_template(data):
        raise vol.Invalid(f"{field}.data does not accept templates")
    return {"service": service, "entity_id": entity_id, "data": dict(data)}


def _smart_load(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise vol.Invalid("Every Smart Load must be an object")
    load_id = re.sub(r"[^a-zA-Z0-9_-]", "", str(raw.get("id") or ""))[:64] or str(uuid.uuid4())
    name = str(raw.get("name") or "Smart load").strip()[:80]
    if not name:
        raise vol.Invalid("Every Smart Load needs a name")
    category = str(raw.get("category") or "switch")
    if category not in _SMART_LOAD_CATEGORIES:
        raise vol.Invalid("Unknown Smart Load category")
    mode = str(raw.get("mode") or "smart")
    if mode not in _SMART_LOAD_MODES:
        raise vol.Invalid("Unknown Smart Load mode")
    preference = str(raw.get("energy_preference") or "balanced")
    if preference not in _SMART_LOAD_PREFERENCES:
        raise vol.Invalid("Unknown Smart Load energy preference")
    ready_by = str(raw.get("ready_by") or "07:00")
    earliest = str(raw.get("earliest_start") or "")
    if not _valid_hhmm(ready_by):
        raise vol.Invalid("ready_by must be HH:MM")
    if earliest and not _valid_hhmm(earliest):
        raise vol.Invalid("earliest_start must be HH:MM")
    result: dict[str, Any] = {
        "id": load_id,
        "name": name,
        "category": category,
        "enabled": bool(raw.get("enabled", True)),
        "mode": mode,
        "ready_by": ready_by,
        "earliest_start": earliest,
        "interruptible": bool(raw.get("interruptible", category in {"switch", "climate", "water_heater"})),
        # Fresh P1 import and phase-headroom checks are mandatory. Preserve the
        # field for backwards-compatible stored data, but never allow it off.
        "grid_guard": True,
        "energy_preference": preference,
        "power_w": _load_number(raw, "power_w", 1, 50_000, 1000),
        "duration_min": _load_number(raw, "duration_min", 5, 1440, 60),
        "minimum_run_min": _load_number(raw, "minimum_run_min", 1, 1440, 2),
        "running_above_w": _load_number(raw, "running_above_w", 0, 50_000, 15),
        "climate_temperature": (
            _load_number(raw, "climate_temperature", 5, 40, 20)
            if category == "climate"
            else None
        ),
        "climate_mode": str(raw.get("climate_mode") or "heat")[:32],
        "ready_states": str(raw.get("ready_states") or "ready,programmed,waiting,idle")[:300],
        "running_states": str(raw.get("running_states") or "running,on,active,heating,drying,washing")[:300],
        "ready_on_state": str(raw.get("ready_on_state") or "on")[:80],
        "running_on_state": str(raw.get("running_on_state") or "on")[:80],
        "door_open_state": str(raw.get("door_open_state") or "on")[:80],
        "remote_on_state": str(raw.get("remote_on_state") or "on")[:80],
        "start_action": _smart_load_action(raw.get("start_action"), "start_action"),
        "stop_action": _smart_load_action(raw.get("stop_action"), "stop_action"),
    }
    for field in _SMART_LOAD_ENTITY_FIELDS:
        result[field] = _optional_entity(raw.get(field), field)
    schedule: dict[str, dict[str, Any]] = {}
    raw_schedule = raw.get("schedule") if isinstance(raw.get("schedule"), dict) else {}
    for weekday in ("mon", "tue", "wed", "thu", "fri", "sat", "sun"):
        item = raw_schedule.get(weekday)
        if not isinstance(item, dict):
            continue
        item_ready = str(item.get("ready_by") or ready_by)
        if not _valid_hhmm(item_ready):
            raise vol.Invalid(f"{weekday} ready_by must be HH:MM")
        schedule[weekday] = {"enabled": bool(item.get("enabled", True)), "ready_by": item_ready}
    result["schedule"] = schedule

    if category in {"switch", "water_heater", "climate"}:
        control = result.get("control_entity")
        expected_domains = (
            {"climate"}
            if category == "climate"
            else {"water_heater"}
            if category == "water_heater"
            else {"switch", "input_boolean"}
        )
        if control and str(control).split(".", 1)[0] not in expected_domains:
            raise vol.Invalid(
                "control_entity must belong to "
                + " or ".join(sorted(expected_domains))
            )
    return result


def _smart_load_start_key(load: dict[str, Any]) -> str:
    action = load.get("start_action") or {}
    return str(action.get("entity_id") or load.get("start_entity") or load.get("control_entity") or "")


def _smart_load_control_routes(load: dict[str, Any]) -> set[str]:
    """Return every entity a Smart Load may start, stop or otherwise control."""
    actions = [load.get("start_action") or {}, load.get("stop_action") or {}]
    return {
        str(route)
        for route in (
            load.get("control_entity"),
            load.get("start_entity"),
            load.get("stop_entity"),
            *(action.get("entity_id") for action in actions),
        )
        if route
    }


def _active_smart_load_routes(config: dict[str, Any]) -> set[str]:
    """Return routes that automatic Smart Loads or durable owners may control."""
    automatic = bool(config.get("enabled")) and str(
        config.get("execution_mode") or "advice"
    ) == "automatic"
    owners = config.get("control_owners") or {}
    routes: set[str] = set()
    for load in config.get("loads", []):
        load_id = str(load.get("id") or "")
        if (automatic and load.get("enabled", True)) or load_id in owners:
            routes.update(_smart_load_control_routes(load))
    for owner in owners.values():
        if isinstance(owner, dict):
            routes.update(
                _smart_load_control_routes(dict(owner.get("load_snapshot") or {}))
            )
    return routes


def _active_smart_ev_routes(config: dict[str, Any]) -> set[str]:
    """Return routes that automatic Smart EV or durable owners may control."""
    automatic = bool(config.get("enabled")) and str(
        config.get("execution_mode") or "advice"
    ) == "automatic"
    owners = config.get("control_owners") or {}
    routes: set[str] = set()
    for vehicle in config.get("vehicles", []):
        control = str(vehicle.get("control_entity") or "")
        if (automatic and vehicle.get("enabled", True)) or control in owners:
            routes.update(
                str(route)
                for route in (control, vehicle.get("stop_entity"))
                if route
            )
    for owner in owners.values():
        if isinstance(owner, dict):
            vehicle = dict(owner.get("config") or {})
            routes.update(
                str(route)
                for route in (
                    vehicle.get("control_entity"),
                    vehicle.get("stop_entity"),
                )
                if route
            )
    return routes


def _enabled_schedule_targets(store: Any) -> set[str]:
    """Return entities that enabled legacy deadline schedules switch."""
    schedules = store.get_schedules() if store else []
    return {
        str(item.get("target_entity") or "")
        for item in schedules
        if item.get("enabled", True) and item.get("target_entity")
    }


def _schedule_control_conflict(store: Any, schedule: dict[str, Any]) -> str | None:
    """Return why an enabled schedule may not use its target, if it may not."""
    if not schedule.get("enabled", True):
        return None
    target = str(schedule.get("target_entity") or "")
    if target in _active_smart_load_routes(store.get_smart_loads()):
        return "This entity is already controlled by automatic Smart Loads"
    if target in _active_smart_ev_routes(store.get_smart_ev()):
        return "This entity is already controlled by automatic Smart EV"
    return None


def _sanitise_smart_loads(raw: Any, hass: HomeAssistant | None = None) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise vol.Invalid("Smart Loads configuration must be an object")
    execution_mode = str(raw.get("execution_mode") or "advice")
    if execution_mode not in _SMART_LOAD_EXECUTION_MODES:
        raise vol.Invalid("Unknown Smart Loads execution mode")
    loads = [_smart_load(item) for item in list(raw.get("loads") or [])[:16]]
    ids = [item["id"] for item in loads]
    if len(ids) != len(set(ids)):
        raise vol.Invalid("Every Smart Load must have a unique id")
    routes: dict[str, str] = {}
    for load in loads:
        for route in _smart_load_control_routes(load):
            if route in routes:
                raise vol.Invalid(
                    f"{load['name']} shares a control route with {routes[route]}"
                )
            routes[route] = load["name"]

    enabled = bool(raw.get("enabled", bool(loads)))
    if hass is not None:
        store = hass.data.get(DOMAIN, {}).get("store")
        saved = store.get_smart_loads() if store else {}
        owned_ids = set(saved.get("control_owners") or {})
        removed_owned = owned_ids - set(ids)
        if removed_owned:
            raise vol.Invalid(
                "Wait for running Smart Loads to finish before removing them"
            )
        previous_by_id = {
            str(item.get("id") or ""): _smart_load(item)
            for item in saved.get("loads", [])
            if isinstance(item, dict) and item.get("id")
        }
        current_by_id = {str(item["id"]): item for item in loads}
        changed_owned = {
            load_id
            for load_id in owned_ids
            if load_id in previous_by_id
            and current_by_id.get(load_id) != previous_by_id[load_id]
        }
        if changed_owned:
            raise vol.Invalid(
                "Wait for running Smart Loads to finish before changing their configuration"
            )
        if enabled and execution_mode == "automatic":
            ev_routes = _active_smart_ev_routes(store.get_smart_ev() if store else {})
            battery = store.get_battery() if store else {}
            battery_route = (
                str(battery.get("control_entity") or "")
                if battery.get("enabled")
                and str(battery.get("execution_mode") or "advice") == "automatic"
                else ""
            )
            for load in loads:
                if not load.get("enabled", True):
                    continue
                load_routes = _smart_load_control_routes(load)
                if load_routes & ev_routes:
                    raise vol.Invalid(
                        f"{load['name']}: a control is already used by automatic Smart EV"
                    )
                if battery_route and battery_route in load_routes:
                    raise vol.Invalid(
                        f"{load['name']}: a control is already used by automatic battery control"
                    )
    if enabled and execution_mode == "automatic" and hass is not None:
        store = hass.data.get(DOMAIN, {}).get("store")
        legacy_targets = {
            str(item.get("target_entity") or "")
            for item in (store.get_schedules() if store else [])
            if item.get("enabled", True)
        }
        for load in loads:
            if not load.get("enabled", True):
                continue
            route = _smart_load_start_key(load)
            if not route:
                raise vol.Invalid(f"{load['name']}: choose a control, start entity or custom start action")
            if _smart_load_control_routes(load) & legacy_targets:
                raise vol.Invalid(
                    f"{load['name']}: one of its controls is still used by an enabled legacy deadline schedule"
                )
            start_action = load.get("start_action") or {}
            if start_action:
                domain, service = str(start_action["service"]).split(".", 1)
                if not hass.services.has_service(domain, service):
                    raise vol.Invalid(f"{load['name']}: start service {domain}.{service} is unavailable")
            elif hass.states.get(route) is None:
                raise vol.Invalid(f"{load['name']}: start control is unavailable")
            feedback = any(
                load.get(field)
                for field in ("running_entity", "status_entity", "power_entity", "control_entity")
            )
            if not feedback:
                raise vol.Invalid(f"{load['name']}: automatic control needs running or power feedback")
            stop_action = load.get("stop_action") or {}
            stop_route = bool(
                stop_action.get("service")
                or load.get("stop_entity")
                or load.get("control_entity")
            )
            if load.get("interruptible") and not stop_route:
                raise vol.Invalid(
                    f"{load['name']}: interruptible automatic control needs a stop action"
                )
    return {
        "revision": max(0, int(raw.get("revision", 0) or 0)),
        "enabled": enabled,
        "execution_mode": execution_mode,
        "grid_import_limit_w": _load_number(raw, "grid_import_limit_w", 0, 100_000, 17_000),
        "grid_safety_margin_w": _load_number(raw, "grid_safety_margin_w", 0, 10_000, 250),
        "capacity_limit_w": _load_number(raw, "capacity_limit_w", 0, 100_000, 0),
        "loads": loads,
    }


def _smart_loads_result(hass: HomeAssistant) -> dict[str, Any]:
    store = hass.data.get(DOMAIN, {}).get("store")
    config = store.get_smart_loads() if store else {}
    coordinator = hass.data.get(DOMAIN, {}).get("smart_loads")
    live = coordinator.data or {} if coordinator else {}
    return {
        "config": {
            "revision": int(config.get("revision", 0) or 0),
            "enabled": config.get("enabled", False),
            "execution_mode": config.get("execution_mode", "advice"),
            "grid_import_limit_w": config.get("grid_import_limit_w", 17_000),
            "grid_safety_margin_w": config.get("grid_safety_margin_w", 250),
            "capacity_limit_w": config.get("capacity_limit_w", 0),
            "loads": config.get("loads", []),
        },
        "plans": live.get("plans", config.get("plans", {})),
        "learning": live.get("learning", config.get("learning", {})),
        "runs": live.get("runs", list(reversed(config.get("runs", [])[-100:]))),
        "journal": live.get("journal", list(reversed(config.get("journal", [])[-100:]))),
        "available": coordinator is not None,
        "updating": bool(coordinator and getattr(coordinator, "update_in_progress", False)),
    }


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/smart_loads"})
@callback
def ws_get_smart_loads(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return Smart Loads configuration, plans, learning and history."""
    connection.send_result(msg["id"], _smart_loads_result(hass))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/smart_loads/set",
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def ws_set_smart_loads(hass: HomeAssistant, connection, msg: dict) -> None:
    """Validate and save the complete Smart Loads configuration."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    coordinator = hass.data.get(DOMAIN, {}).get("smart_loads")
    try:
        if coordinator is not None:
            async with coordinator._cycle_lock:
                config = _sanitise_smart_loads(msg["config"], hass)
                await store.async_set_smart_loads(config)
        else:
            config = _sanitise_smart_loads(msg["config"], hass)
            await store.async_set_smart_loads(config)
    except vol.Invalid as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    except ValueError as err:
        connection.send_error(msg["id"], "active_load", str(err))
        return
    from .const import SIGNAL_SMART_LOADS_CHANGED

    async_dispatcher_send(hass, SIGNAL_SMART_LOADS_CHANGED)
    if coordinator is not None:
        await coordinator.async_refresh()
    connection.send_result(msg["id"], _smart_loads_result(hass))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/smart_loads/mode",
        vol.Required("load_id"): str,
        vol.Required("mode"): vol.In(sorted(_SMART_LOAD_MODES)),
    }
)
@websocket_api.async_response
async def ws_set_smart_load_mode(hass: HomeAssistant, connection, msg: dict) -> None:
    """Apply an explicit per-load mode without replacing editor fields."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    coordinator = hass.data.get(DOMAIN, {}).get("smart_loads")
    if coordinator is not None:
        async with coordinator._cycle_lock:
            saved = await store.async_set_smart_load_mode(
                msg["load_id"], msg["mode"]
            )
    else:
        saved = await store.async_set_smart_load_mode(msg["load_id"], msg["mode"])
    if saved is None:
        connection.send_error(msg["id"], "not_found", "Smart Load not found")
        return
    if coordinator is not None:
        await coordinator.async_refresh()
    connection.send_result(msg["id"], _smart_loads_result(hass))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/smart_loads/release",
        vol.Required("load_id"): str,
        vol.Required("confirm_physically_off"): True,
    }
)
@websocket_api.async_response
async def ws_release_smart_load_control(
    hass: HomeAssistant, connection, msg: dict
) -> None:
    """Release stranded ownership after an explicit physical-off confirmation."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    coordinator = hass.data.get(DOMAIN, {}).get("smart_loads")
    if coordinator is None:
        connection.send_error(msg["id"], "not_ready", "Smart Energy is disabled")
        return
    try:
        await coordinator.async_confirm_stopped_and_release(msg["load_id"])
    except ValueError as err:
        connection.send_error(msg["id"], "unsafe_release", str(err))
        return
    await coordinator.async_refresh()
    connection.send_result(msg["id"], _smart_loads_result(hass))


@websocket_api.websocket_command(
    {vol.Required("type"): "smarthomeshop/smart_loads/refresh"}
)
@websocket_api.async_response
async def ws_refresh_smart_loads(hass: HomeAssistant, connection, msg: dict) -> None:
    """Recalculate Smart Loads and wait for guarded execution feedback."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    coordinator = hass.data.get(DOMAIN, {}).get("smart_loads")
    if coordinator is None:
        connection.send_error(msg["id"], "not_ready", "Smart Energy is disabled")
        return
    await coordinator.async_refresh()
    connection.send_result(msg["id"], _smart_loads_result(hass))


@websocket_api.websocket_command(
    {vol.Required("type"): "smarthomeshop/smart_loads/history/clear"}
)
@websocket_api.async_response
async def ws_clear_smart_loads_history(hass: HomeAssistant, connection, msg: dict) -> None:
    """Clear only Smart Loads decisions and completed runs."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    await _async_clear_live_history(
        hass,
        "smart_loads",
        store.async_clear_smart_loads_history,
        ("runs", "journal"),
    )
    connection.send_result(msg["id"], {**_smart_loads_result(hass), "runs": [], "journal": []})


_ENERGY_SOURCES_SCHEMA = vol.Schema(
    {
        # Which P1 meter feeds the whole-home Energy tab. Auto-selected when
        # there is exactly one; the panel offers a picker for multi-P1 homes.
        vol.Optional("p1_device"): vol.Any(None, str),
        vol.Optional("solar_power"): vol.Any(None, str),
        vol.Optional("solar_invert"): bool,
        vol.Optional("battery_power"): vol.Any(None, str),
        vol.Optional("battery_invert"): bool,
        vol.Optional("battery_soc"): vol.Any(None, str),
        vol.Optional("battery_capacity_kwh"): vol.Any(None, vol.Coerce(float)),
        vol.Optional("battery_capacity_entity"): vol.Any(None, str),
        vol.Optional("pv_forecast"): vol.Any(None, str),
        vol.Optional("energy_dashboard_enabled"): bool,
        vol.Optional("show_smart_savings"): bool,
    },
    extra=vol.REMOVE_EXTRA,
)


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/energy_sources"})
@callback
def ws_get_energy_sources(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the mapped solar/battery measurement entities."""
    store = hass.data.get(DOMAIN, {}).get("store")
    connection.send_result(
        msg["id"], {"sources": store.get_energy_sources() if store else {}}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/energy_sources/set",
        vol.Required("config"): dict,
    }
)
@websocket_api.async_response
async def ws_set_energy_sources(hass: HomeAssistant, connection, msg: dict) -> None:
    """Save the solar/battery measurement entity mapping (validated)."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return
    try:
        config = _ENERGY_SOURCES_SCHEMA(msg["config"])
    except vol.Invalid as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    # Merge over the stored mapping: the solar/battery card and the P1
    # picker are separate writers to this one slot, so keys a writer does
    # not send must survive its save. Clearing a field still works because
    # the panel sends an explicit empty value for it.
    previous_sources = store.get_energy_sources()
    saved = await store.async_set_energy_sources({**previous_sources, **config})
    if "energy_dashboard_enabled" in config and config[
        "energy_dashboard_enabled"
    ] != previous_sources.get("energy_dashboard_enabled"):
        async_schedule_energy_reconfigure(
            hass, bool(config["energy_dashboard_enabled"])
        )
    prices = hass.data.get(DOMAIN, {}).get("prices")
    if prices is not None:
        prices.async_refresh_tariff_source()
    connection.send_result(msg["id"], {"sources": saved})


@websocket_api.websocket_command(
    {vol.Required("type"): "smarthomeshop/account/contracts"}
)
@websocket_api.async_response
async def ws_get_contracts(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the user's energy contracts and locations for the panel picker."""
    prices = hass.data.get(DOMAIN, {}).get("prices")
    data = (
        await prices.async_fetch_contracts()
        if prices is not None
        else {"contracts": [], "locations": []}
    )
    connection.send_result(
        msg["id"],
        {
            "contracts": data.get("contracts", []),
            "locations": data.get("locations", []),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "smarthomeshop/account/set",
        vol.Optional("api_key"): vol.Any(str, None),
        vol.Optional("base_url"): vol.Any(str, None),
        vol.Optional("contract_id"): vol.Any(str, int, None),
        vol.Optional("location_id"): vol.Any(str, int, None),
    }
)
@websocket_api.async_response
async def ws_set_account(hass: HomeAssistant, connection, msg: dict) -> None:
    """Store account settings and refresh prices in the background."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    prices = hass.data.get(DOMAIN, {}).get("prices")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return

    account = store.get_account()
    previous_selection = _account_selection(account)
    if "api_key" in msg:
        # An explicit None disconnects; an empty string is ignored so a
        # partial form submit can never wipe a working key by accident.
        new_key = (msg.get("api_key") or "").strip()
        if new_key or msg.get("api_key") is None:
            account["api_key"] = new_key
    if "base_url" in msg:
        account["base_url"] = (msg.get("base_url") or "").strip() or None
    if "contract_id" in msg:
        account["contract_id"] = (
            (str(msg.get("contract_id")).strip() or None)
            if msg.get("contract_id") not in (None, "")
            else None
        )
    if "location_id" in msg:
        account["location_id"] = (
            (str(msg.get("location_id")).strip() or None)
            if msg.get("location_id") not in (None, "")
            else None
        )
    await store.async_set_account(account)
    selection_changed = _account_selection(account) != previous_selection

    has_key = bool(account.get("api_key"))
    if prices is not None:
        if has_key:
            # Never wait for the external API in this WebSocket request. The
            # panel can poll the shared refresh task without losing its reply
            # when the price service is slow or temporarily unavailable.
            prices.status = "connecting"
            prices.last_error = None
            _schedule_account_price_refresh(hass, prices, restart=selection_changed)
        else:
            refresh_task = hass.data.get(DOMAIN, {}).pop(_ACCOUNT_REFRESH_TASK, None)
            if refresh_task is not None and not refresh_task.done():
                refresh_task.cancel()
            prices.status = "unconfigured"
            prices.last_error = None

    connection.send_result(msg["id"], _account_result(hass))


def _connectivity_for_device(
    hass: HomeAssistant, device_id: str
) -> tuple[bool, str | None]:
    """Return (online, last_seen_iso) for an ESPHome-backed device.

    Mirrors the logic in ws_get_devices: only ESPHome sensor entities count,
    and the status sensor (device_class connectivity) is authoritative
    because it stays available and flips to 'off' on disconnect.
    """
    entity_registry = er.async_get(hass)
    online = False
    last_seen = None
    status_off_since = None

    for entity in er.async_entries_for_device(entity_registry, device_id):
        if entity.platform != "esphome" or entity.domain not in (
            "sensor",
            "binary_sensor",
        ):
            continue
        state = hass.states.get(entity.entity_id)
        if state is None:
            continue
        if entity.original_device_class == "connectivity":
            if state.state == "on":
                online = True
            elif state.state == "off":
                status_off_since = state.last_changed
        elif state.state not in ("unavailable", "unknown"):
            online = True
        elif state.last_changed and (
            last_seen is None or state.last_changed > last_seen
        ):
            last_seen = state.last_changed

    if status_off_since is not None and not online:
        last_seen = status_off_since

    if online:
        return True, None
    return False, last_seen.isoformat() if last_seen else None


def _float_or_none(state) -> float | None:
    """Parse a state object into a float, or None."""
    if state is None or state.state in ("unknown", "unavailable", ""):
        return None
    try:
        value = float(state.state)
    except (ValueError, TypeError):
        return None
    return value if math.isfinite(value) else None


def _radar_coordinate_age_seconds(state, now: datetime) -> float | None:
    """Return a skew-free server-side report age for one radar coordinate."""
    if state is None:
        return None
    reported = getattr(state, "last_reported", None) or getattr(
        state, "last_updated", None
    )
    if reported is None:
        return None
    if reported.tzinfo is None:
        reported = reported.replace(tzinfo=UTC)
    age = (now - reported.astimezone(UTC)).total_seconds()
    return age if age >= 0 else None


def _radar_coordinate_is_fresh(state, now: datetime) -> bool:
    """Reject retained/future coordinates while accepting current radar reports."""
    age = _radar_coordinate_age_seconds(state, now)
    return age is not None and age <= _RADAR_POSITION_FRESHNESS_SECONDS


def _radar_live_snapshot(hass: HomeAssistant, profile) -> dict[str, Any]:
    """Return one normalized, non-retaining live positioning snapshot.

    Radar coordinates are normalized to millimetres here so the device page,
    Room Designer and Lovelace never need competing product-name heuristics.
    Unavailable/NaN slots are omitted on every refresh; their previous
    coordinates can therefore never remain visible.
    """
    radar = profile.profile
    scale = radar.coordinate_scale_to_mm
    targets: list[dict[str, Any]] = []
    now = datetime.now(UTC)

    for target in profile.targets:
        x_state = hass.states.get(target.x_entity_id)
        y_state = hass.states.get(target.y_entity_id)
        if not (
            _radar_coordinate_is_fresh(x_state, now)
            and _radar_coordinate_is_fresh(y_state, now)
        ):
            continue
        x = _float_or_none(x_state)
        y = _float_or_none(y_state)
        if x is None or y is None:
            continue

        presence: bool | None = None
        if target.presence_entity_id:
            presence_state = hass.states.get(target.presence_entity_id)
            if presence_state is None or presence_state.state in {
                "unknown",
                "unavailable",
                "",
            }:
                continue
            presence = presence_state.state == "on"
            if not presence:
                continue

        z_state = hass.states.get(target.z_entity_id) if target.z_entity_id else None
        z = (
            _float_or_none(z_state)
            if _radar_coordinate_is_fresh(z_state, now)
            else None
        )
        timestamps = [
            getattr(state, "last_reported", None)
            or getattr(state, "last_updated", None)
            for state in (x_state, y_state)
            if state is not None
        ]
        updated = max((stamp for stamp in timestamps if stamp is not None), default=None)
        coordinate_ages = [
            age
            for state in (x_state, y_state)
            if (age := _radar_coordinate_age_seconds(state, now)) is not None
        ]
        targets.append(
            {
                "index": target.index,
                "x_mm": round(x * scale, 2),
                "y_mm": round(y * scale, 2),
                "z_mm": round(z * scale, 2) if z is not None else None,
                "presence": presence,
                "updated_at": updated.isoformat() if updated is not None else None,
                # The browser expires the received snapshot using this server-
                # computed age plus local elapsed time. This avoids comparing
                # Home Assistant's clock directly with the browser's clock.
                "age_ms": round(max(coordinate_ages, default=0) * 1000),
            }
        )

    actual_height_mm = (
        radar.installation_height_m * 1000
        if radar.installation_height_m is not None
        else radar.mounting_height_mm
    )
    required_mode = radar.required_installation_mode
    current_mode = radar.current_hardware_mode
    installation_ready = True
    if radar.radar_model == "ld2460":
        installation_ready = bool(
            (not required_mode or current_mode == required_mode)
            and radar.installation_height_m is not None
            and radar.installation_angle_deg is not None
        )
    elif radar.radar_model == "ld6002b":
        # Ceiling-mounted LD6002B coordinates already include their Z axis.
        # Unlike an LD2460 side installation, no separate downward angle is
        # required to display the firmware-reported floor position.
        installation_ready = bool(
            (not required_mode or current_mode == required_mode)
            and actual_height_mm is not None
        )

    return {
        "supported": radar.positioning_available
        and radar.radar_model in {"ld2450", "ld2460", "ld6002b"},
        "radar_model": radar.radar_model,
        "mounting_mode": radar.mounting_mode,
        "coordinate_projection": radar.coordinate_projection,
        "coordinate_frame": radar.coordinate_frame,
        "maximum_range_mm": radar.maximum_range_mm,
        "field_of_view_deg": radar.field_of_view_deg,
        "maximum_targets": radar.maximum_targets,
        "mounting_height_mm": actual_height_mm,
        "installation_angle_deg": radar.installation_angle_deg,
        "required_installation_mode": required_mode,
        "current_hardware_mode": current_mode,
        "installation_ready": installation_ready,
        "detection_sector": {
            "distance_mm": (
                radar.detection_distance_m * 1000
                if radar.detection_distance_m is not None
                else None
            ),
            "start_angle_deg": radar.detection_start_angle_deg,
            "end_angle_deg": radar.detection_end_angle_deg,
        },
        "targets": targets,
    }


def _room_context_for_radar(
    hass: HomeAssistant, device_id: str, profile
) -> dict[str, Any] | None:
    """Return the saved room geometry containing this physical radar.

    Current rooms store the canonical registry device id, while older rooms
    can still contain the metadata-derived radar alias.  Matching the explicit
    aliases preserves those rooms without inferring anything from product
    names or generated Home Assistant entity prefixes.
    """
    store: SmartHomeShopStore | None = hass.data.get(DOMAIN, {}).get("store")
    if store is None:
        return None

    aliases = {device_id, profile.device_id, *profile.aliases}
    for room in store.get_rooms():
        for source in room.get("sensors", []):
            source_device_id = str(
                source.get("deviceId") or source.get("device_id") or ""
            ).strip()
            if source_device_id not in aliases:
                continue
            return {
                "id": room.get("id"),
                "name": room.get("name") or "Room",
                "ceiling_height_mm": room.get("ceilingHeightMm", 2600),
                "walls": copy.deepcopy(room.get("walls", [])),
                "zones": copy.deepcopy(room.get("zones", [])),
                "furniture": copy.deepcopy(room.get("furniture", [])),
                "sensors": copy.deepcopy(room.get("sensors", [])),
                "linked_sensor_id": source.get("id"),
            }
    return None


def _zone_num_from_entity(entity_id: str, marker: str) -> int | None:
    """Extract a zone number from entity IDs like *_zone_1_*."""
    try:
        return int(entity_id.split(marker, 1)[1].split("_", 1)[0])
    except (ValueError, IndexError):
        return None


def _radar_overview(hass: HomeAssistant, device_id: str) -> dict[str, Any]:
    """Collect live radar values for a presence device."""
    entity_registry = er.async_get(hass)
    zones: dict[int, dict[str, Any]] = {}
    overview: dict[str, Any] = {"zones": []}

    profile = radar_profile_for_device(hass, device_id)
    if profile is not None:
        live_view = _radar_live_snapshot(hass, profile)
        live_view["room_context"] = _room_context_for_radar(hass, device_id, profile)
        overview["live_view"] = live_view

    def zone_data(zone_num: int) -> dict[str, Any]:
        return zones.setdefault(zone_num, {"zone": zone_num})

    for entity in er.async_entries_for_device(entity_registry, device_id):
        eid = entity.entity_id
        state = hass.states.get(eid)
        if state is None:
            continue

        if (
            eid.startswith("binary_sensor.")
            and eid.endswith("_presence")
            and "_zone_" not in eid
            and "_polygon_zone_" not in eid
        ):
            if eid.endswith("_still_presence"):
                overview["still_presence"] = state.state == "on"
            else:
                overview["presence"] = state.state == "on"
        elif (
            eid.startswith("binary_sensor.")
            and "_polygon_zone_" in eid
            and eid.endswith("_presence")
        ):
            zone_num = _zone_num_from_entity(eid, "_polygon_zone_")
            if zone_num is None:
                continue
            zone_data(zone_num)["occupied"] = state.state == "on"
        elif (
            eid.startswith("binary_sensor.")
            and "_zone_" in eid
            and (eid.endswith("_presence") or eid.endswith("_occupancy"))
        ):
            zone_num = _zone_num_from_entity(eid, "_zone_")
            if zone_num is None:
                continue
            zone_data(zone_num).setdefault("occupied", state.state == "on")
        elif eid.endswith("_people_count"):
            overview["people_count"] = _float_or_none(state)
        elif eid.endswith("_last_crossing_direction"):
            overview["last_crossing"] = state.state
        elif eid.endswith("_radar_target_count"):
            overview["target_count"] = _float_or_none(state)
        elif eid.endswith("_tracking_target_count") and "target_count" not in overview:
            overview["target_count"] = _float_or_none(state)
        elif (
            eid.startswith("sensor.")
            and "_polygon_zone_" in eid
            and eid.endswith("_target_count")
        ):
            zone_num = _zone_num_from_entity(eid, "_polygon_zone_")
            if zone_num is None:
                continue
            zone_data(zone_num)["target_count"] = _float_or_none(state)
        elif (
            eid.startswith("sensor.")
            and "_zone_" in eid
            and eid.endswith("_target_count")
        ):
            zone_num = _zone_num_from_entity(eid, "_zone_")
            if zone_num is None:
                continue
            zdata = zone_data(zone_num)
            if eid.endswith("_still_target_count"):
                zdata["still_target_count"] = _float_or_none(state)
            elif eid.endswith("_moving_target_count"):
                zdata["moving_target_count"] = _float_or_none(state)
            else:
                zdata.setdefault("target_count", _float_or_none(state))
        elif (
            eid.endswith("_occupancy")
            and eid.startswith("binary_sensor.")
            and "_zone_" not in eid
            and "presence" not in overview
        ):
            overview.setdefault("presence", state.state == "on")

    overview["zones"] = [zones[key] for key in sorted(zones)]
    return overview
