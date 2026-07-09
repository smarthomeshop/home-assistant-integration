"""WebSocket API for SmartHomeShop Configurator Panel."""
from __future__ import annotations

import voluptuous as vol
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er

from .const import (
    DOMAIN,
    LOGGER,
    VERSION,
    PRODUCT_PATTERNS,
    PRODUCT_NAMES,
    product_for_device,
    CONF_PRODUCT_TYPE,
    CONF_PRICE_T1,
    CONF_PRICE_T2,
    CONF_PRICE_FEED_IN,
    CONF_PRICE_GAS,
    CONF_PRICE_WATER,
    CONF_MAIN_FUSE_AMPS,
    DEFAULT_PRICE_T1,
    DEFAULT_PRICE_T2,
    DEFAULT_PRICE_FEED_IN,
    DEFAULT_PRICE_GAS,
    DEFAULT_PRICE_WATER,
    DEFAULT_MAIN_FUSE_AMPS,
    DEFAULT_CONTINUOUS_FLOW_MINUTES,
    DEFAULT_NIGHT_START,
    DEFAULT_NIGHT_END,
)
from .storage import SmartHomeShopStore

# Water option keys (mirror config_flow); stored in entry.options
CONF_CONTINUOUS_FLOW_MINUTES = "continuous_flow_minutes"
CONF_NIGHT_START = "night_start"
CONF_NIGHT_END = "night_end"
CONF_VACATION_MODE_ENTITY = "vacation_mode_entity"

_WATER_PRODUCTS = ("waterp1meterkit", "watermeterkit", "waterflowkit")
_ENERGY_PRODUCTS = ("waterp1meterkit", "p1meterkit")


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
    websocket_api.async_register_command(hass, ws_get_device_insights)
    websocket_api.async_register_command(hass, ws_get_device_config)
    websocket_api.async_register_command(hass, ws_set_device_config)
    websocket_api.async_register_command(hass, ws_get_account)
    websocket_api.async_register_command(hass, ws_set_account)


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
        for entity in entity_registry.entities.values():
            if entity.device_id == device_entry.id:
                entity_count += 1

                if entity.platform == "esphome" and entity.domain in (
                    "sensor",
                    "binary_sensor",
                ):
                    state = hass.states.get(entity.entity_id)
                    if state is not None:
                        # The ESPHome status sensor is authoritative: it
                        # stays available and flips to 'off' on disconnect.
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
                    for product, patterns in PRODUCT_PATTERNS.items():
                        for pattern in patterns:
                            if pattern in entity_id_lower:
                                detected_product = product
                                break
                        if detected_product:
                            break

        if status_off_since is not None and not online:
            last_seen = status_off_since

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
            "online": online,
            "last_seen": last_seen.isoformat() if (not online and last_seen) else None,
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

@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/device/insights",
    vol.Required("device_id"): str,
})
@callback
def ws_get_device_insights(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return internal product insights for a configured device."""
    device_id = msg["device_id"]

    entry = None
    for candidate in hass.config_entries.async_entries(DOMAIN):
        if candidate.data.get("device_id") == device_id:
            entry = candidate
            break

    online, last_seen = _connectivity_for_device(hass, device_id)

    if entry is None or getattr(entry, "runtime_data", None) is None:
        connection.send_result(
            msg["id"],
            {"configured": False, "online": online, "last_seen": last_seen},
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
    if product_type in water_products and data is not None and hasattr(data, "current_flow_rate"):
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
        for line in ("flow1", "flow2"):
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
                {"key": "co2", "label": "CO₂", "value": data.co2, "unit": "ppm", "status": data.co2_status},
                {"key": "pm25", "label": "PM2.5", "value": data.pm25, "unit": "µg/m³", "status": data.pm25_status},
                {"key": "voc", "label": "VOC index", "value": data.voc, "unit": "", "status": data.voc_status},
                {"key": "temperature", "label": "Temperature", "value": data.temperature, "unit": "°C", "status": data.temperature_status},
                {"key": "humidity", "label": "Humidity", "value": data.humidity, "unit": "%", "status": data.humidity_status},
            ],
            "illuminance": data.illuminance,
        }

    # Live radar overview for presence products (scanned from the device entities)
    if product_type in ("ultimatesensor", "ultimatesensor_mini", "ceilsense"):
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
    """Return the SmartHomeShop config entry that owns this device."""
    from .const import CONF_DEVICE_ID

    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.data.get(CONF_DEVICE_ID) == device_id:
            return entry
    return None


def _config_fields(
    product_type: str | None, options: dict, ha_prices: dict | None = None
) -> list[dict]:
    """Editable product options, mirroring the config/options flow.

    Price fields fall back to the HA Energy Dashboard static price (if set)
    before the hardcoded default, so the panel prefills what HA already uses.
    """
    ha_prices = ha_prices or {}

    def pick(key: str, default):
        if options.get(key) not in (None, ""):
            return options.get(key)
        return ha_prices.get(key, default)

    fields: list[dict] = []
    if product_type in _WATER_PRODUCTS:
        fields += [
            {"key": CONF_CONTINUOUS_FLOW_MINUTES, "label": "Continuous-flow window",
             "help": "How long water must flow non-stop before it counts as continuous flow.",
             "type": "number", "unit": "min", "min": 5, "max": 120, "step": 5,
             "value": options.get(CONF_CONTINUOUS_FLOW_MINUTES, DEFAULT_CONTINUOUS_FLOW_MINUTES)},
            {"key": CONF_NIGHT_START, "label": "Night starts",
             "help": "Start of the night window used for night-usage leak detection.",
             "type": "time", "value": options.get(CONF_NIGHT_START, DEFAULT_NIGHT_START)},
            {"key": CONF_NIGHT_END, "label": "Night ends", "type": "time",
             "value": options.get(CONF_NIGHT_END, DEFAULT_NIGHT_END)},
            {"key": CONF_VACATION_MODE_ENTITY, "label": "Vacation mode toggle",
             "help": "Optional input_boolean that marks you as away (stricter leak checks).",
             "type": "entity", "domain": "input_boolean",
             "value": options.get(CONF_VACATION_MODE_ENTITY, "")},
            {"key": CONF_PRICE_WATER, "label": "Water price",
             "type": "number", "unit": "€/m³", "min": 0, "max": 15, "step": 0.01,
             "value": pick(CONF_PRICE_WATER, DEFAULT_PRICE_WATER)},
        ]
    if product_type in _ENERGY_PRODUCTS:
        fields += [
            {"key": CONF_PRICE_T1, "label": "Electricity price (T1)", "type": "number",
             "unit": "€/kWh", "min": 0, "max": 5, "step": 0.001,
             "value": pick(CONF_PRICE_T1, DEFAULT_PRICE_T1)},
            {"key": CONF_PRICE_T2, "label": "Electricity price (T2)", "type": "number",
             "unit": "€/kWh", "min": 0, "max": 5, "step": 0.001,
             "value": pick(CONF_PRICE_T2, DEFAULT_PRICE_T2)},
            {"key": CONF_PRICE_FEED_IN, "label": "Feed-in price", "type": "number",
             "unit": "€/kWh", "min": 0, "max": 5, "step": 0.001,
             "value": pick(CONF_PRICE_FEED_IN, DEFAULT_PRICE_FEED_IN)},
            {"key": CONF_PRICE_GAS, "label": "Gas price", "type": "number",
             "unit": "€/m³", "min": 0, "max": 15, "step": 0.001,
             "value": pick(CONF_PRICE_GAS, DEFAULT_PRICE_GAS)},
            {"key": CONF_MAIN_FUSE_AMPS, "label": "Main fuse",
             "help": "Your main fuse rating, used for the phase-load percentage.",
             "type": "number", "unit": "A", "min": 10, "max": 80, "step": 1,
             "value": options.get(CONF_MAIN_FUSE_AMPS, DEFAULT_MAIN_FUSE_AMPS)},
        ]
    return fields


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/device/config",
    vol.Required("device_id"): str,
})
@websocket_api.async_response
async def ws_get_device_config(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the editable product options for a device."""
    entry = _entry_for_device(hass, msg["device_id"])
    if entry is None:
        connection.send_result(msg["id"], {"configured": False, "fields": []})
        return
    product_type = entry.data.get(CONF_PRODUCT_TYPE)
    from .energy_prices import async_ha_energy_prices

    ha_prices = await async_ha_energy_prices(hass)
    connection.send_result(msg["id"], {
        "configured": True,
        "product_type": product_type,
        "fields": _config_fields(product_type, dict(entry.options), ha_prices),
    })


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/device/config/set",
    vol.Required("device_id"): str,
    vol.Required("values"): dict,
})
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
    allowed = {f["key"]: f for f in _config_fields(product_type, dict(entry.options))}
    new_options = dict(entry.options)
    for key, value in (msg["values"] or {}).items():
        field = allowed.get(key)
        if field is None:
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
        else:
            new_options[key] = value

    hass.config_entries.async_update_entry(entry, options=new_options)
    connection.send_result(msg["id"], {"ok": True})


def _account_result(hass: HomeAssistant) -> dict:
    """Build the account/price status payload for the panel."""
    store = hass.data.get(DOMAIN, {}).get("store")
    prices = hass.data.get(DOMAIN, {}).get("prices")
    account = store.get_account() if store else {}
    result = {
        "has_key": bool(account.get("api_key")),
        "base_url": account.get("base_url") or "https://api.smarthomeshop.io",
        "status": getattr(prices, "status", "unconfigured"),
    }
    if prices is not None and prices.status == "ok":
        result["current"] = {
            "electricity": prices.electricity_price(),
            "electricity_market": prices.electricity_market_price(),
            "feed_in": prices.electricity_feed_in(),
            "gas": prices.gas_price(),
            "level": prices.electricity_level(),
        }
    return result


@websocket_api.websocket_command({vol.Required("type"): "smarthomeshop/account"})
@callback
def ws_get_account(hass: HomeAssistant, connection, msg: dict) -> None:
    """Return the account/API-key status and current prices."""
    connection.send_result(msg["id"], _account_result(hass))


@websocket_api.websocket_command({
    vol.Required("type"): "smarthomeshop/account/set",
    vol.Optional("api_key"): vol.Any(str, None),
    vol.Optional("base_url"): vol.Any(str, None),
})
@websocket_api.async_response
async def ws_set_account(hass: HomeAssistant, connection, msg: dict) -> None:
    """Store the API key / base URL and refresh prices immediately."""
    if not connection.user.is_admin:
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    store = hass.data.get(DOMAIN, {}).get("store")
    prices = hass.data.get(DOMAIN, {}).get("prices")
    if store is None:
        connection.send_error(msg["id"], "not_ready", "Store not loaded")
        return

    account = store.get_account()
    if "api_key" in msg:
        account["api_key"] = (msg.get("api_key") or "").strip()
    if "base_url" in msg:
        account["base_url"] = (msg.get("base_url") or "").strip() or None
    await store.async_set_account(account)

    # Refresh prices against the new key so we can report the status back.
    if prices is not None:
        await prices.async_refresh()

    # Materialise/remove the price sensors by reloading the host entry.
    entries = hass.config_entries.async_entries(DOMAIN)
    if entries:
        host = min(entries, key=lambda e: e.entry_id)
        hass.async_create_task(hass.config_entries.async_reload(host.entry_id))

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
        return float(state.state)
    except (ValueError, TypeError):
        return None


def _radar_overview(hass: HomeAssistant, device_id: str) -> dict[str, Any]:
    """Collect live radar values for a presence device."""
    entity_registry = er.async_get(hass)
    overview: dict[str, Any] = {"zones": []}

    for entity in er.async_entries_for_device(entity_registry, device_id):
        eid = entity.entity_id
        state = hass.states.get(eid)
        if state is None:
            continue

        if eid.startswith("binary_sensor.") and eid.endswith("_presence") and "zone" not in eid:
            overview["presence"] = state.state == "on"
        elif eid.startswith("binary_sensor.") and "_polygon_zone_" in eid and eid.endswith("_presence"):
            try:
                zone_num = int(eid.split("_polygon_zone_")[1].split("_")[0])
            except (ValueError, IndexError):
                continue
            overview["zones"].append({"zone": zone_num, "occupied": state.state == "on"})
        elif eid.endswith("_people_count"):
            overview["people_count"] = _float_or_none(state)
        elif eid.endswith("_last_crossing_direction"):
            overview["last_crossing"] = state.state
        elif eid.endswith("_radar_target_count"):
            overview["target_count"] = _float_or_none(state)
        elif eid.endswith("_occupancy") and eid.startswith("binary_sensor.") and "presence" not in overview:
            overview.setdefault("presence", state.state == "on")

    overview["zones"].sort(key=lambda z: z["zone"])
    return overview

