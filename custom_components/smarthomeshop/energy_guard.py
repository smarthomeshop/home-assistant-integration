"""Live grid measurements and fail-safe battery target guarding."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from homeassistant.core import HomeAssistant, State
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN
from .energy_intelligence import guard_battery_power, number

_INVALID_STATES = {"", "none", "unknown", "unavailable"}


def _power_w(state: State | None) -> float | None:
    """Read a finite power state and normalize it to watts."""
    if state is None or str(state.state).lower() in _INVALID_STATES:
        return None
    value = number(state.state)
    if value is None:
        return None
    unit = str(state.attributes.get("unit_of_measurement") or "W").strip().lower()
    if unit == "kw":
        value *= 1000
    elif unit == "mw":
        value *= 1_000_000
    elif unit not in ("w", ""):
        return None
    return value


def _resolve_p1_helper(
    hass: HomeAssistant, unique_suffix: str, entity_fragment: str
) -> str | None:
    """Resolve one SmartHomeShop P1 helper through registry/device ownership."""
    store = hass.data.get(DOMAIN, {}).get("store")
    sources = store.get_energy_sources() if store else {}
    selected_device = sources.get("p1_device")
    registry = er.async_get(hass)

    def usable(entry: er.RegistryEntry) -> bool:
        unique = str(entry.unique_id or "")
        return (
            entry.domain == "sensor"
            and entry.platform == DOMAIN
            and entry.disabled_by is None
            and (unique.endswith(unique_suffix) or entity_fragment in entry.entity_id)
        )

    if selected_device:
        matches = [
            entry.entity_id
            for entry in er.async_entries_for_device(registry, selected_device)
            if usable(entry)
        ]
        if len(matches) == 1:
            return matches[0]
        return None

    matches = [
        entry.entity_id for entry in registry.entities.values() if usable(entry)
    ]
    return matches[0] if len(matches) == 1 else None


def resolve_grid_power_entity(
    hass: HomeAssistant, config: dict[str, Any] | None = None
) -> str | None:
    """Resolve the selected P1 net-power entity without generated IDs."""
    config = config or {}
    explicit = str(config.get("grid_power_sensor") or "").strip()
    return explicit or _resolve_p1_helper(hass, "_net_power", "_net_grid_power")


def resolve_fuse_headroom_entity(hass: HomeAssistant) -> str | None:
    """Resolve P1 headroom on the most heavily loaded phase."""
    return _resolve_p1_helper(
        hass, "_available_grid_power", "_available_grid_power"
    )


def _measurement(
    hass: HomeAssistant, entity_id: str | None, max_age: float
) -> dict[str, Any]:
    state = hass.states.get(entity_id) if entity_id else None
    value = _power_w(state)
    age: float | None = None
    if state is not None:
        age = max(
            0.0,
            (datetime.now(timezone.utc) - state.last_updated).total_seconds(),
        )
    return {
        "entity_id": entity_id,
        "power_w": value,
        "age_seconds": round(age, 1) if age is not None else None,
        "fresh": value is not None and age is not None and age <= max_age,
        "max_age_seconds": round(max_age),
    }


def grid_measurement(
    hass: HomeAssistant, config: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Return the signed grid measurement and freshness metadata."""
    config = config or {}
    max_age = max(
        15.0,
        float(number(config.get("grid_data_max_age"), 90.0) or 90.0),
    )
    return _measurement(hass, resolve_grid_power_entity(hass, config), max_age)


def fuse_headroom_measurement(
    hass: HomeAssistant, config: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Return main-fuse headroom derived from the selected P1 phase loads."""
    config = config or {}
    max_age = max(
        15.0,
        float(number(config.get("grid_data_max_age"), 90.0) or 90.0),
    )
    return _measurement(hass, resolve_fuse_headroom_entity(hass), max_age)


def source_power_w(hass: HomeAssistant, key: str) -> float | None:
    """Read a mapped solar or battery source with its configured direction."""
    store = hass.data.get(DOMAIN, {}).get("store")
    sources = store.get_energy_sources() if store else {}
    entity_id = sources.get(key)
    value = _power_w(hass.states.get(entity_id)) if entity_id else None
    if value is not None and sources.get(f"{key.removesuffix('_power')}_invert"):
        value = -value
    return value


def current_battery_power_w(hass: HomeAssistant) -> float | None:
    """Return battery power using planner convention: +charge, -discharge."""
    source_value = source_power_w(hass, "battery_power")
    return -source_value if source_value is not None else None


def solar_power_w(hass: HomeAssistant) -> float | None:
    """Return non-negative mapped solar production in watts."""
    source_value = source_power_w(hass, "solar_power")
    return max(0.0, source_value) if source_value is not None else None


def evaluate_battery_guard(
    hass: HomeAssistant,
    config: dict[str, Any],
    requested_power_w: float,
    *,
    capacity_limit_w: float | None = None,
) -> dict[str, Any]:
    """Apply configured live limits to one requested battery target."""
    measurement = grid_measurement(hass, config)
    fuse = fuse_headroom_measurement(hass, config)
    if not config.get("grid_guard_enabled", True):
        return {
            "status": "disabled",
            "reason": "Live grid guard is disabled",
            "requested_power_w": round(requested_power_w),
            "allowed_power_w": round(requested_power_w),
            "grid_power_w": measurement["power_w"],
            "grid_entity_id": measurement["entity_id"],
            "data_fresh": measurement["fresh"],
            "fuse_headroom_w": fuse["power_w"],
            "fuse_entity_id": fuse["entity_id"],
        }
    result = guard_battery_power(
        requested_power_w,
        grid_power_w=measurement["power_w"],
        current_battery_power_w=current_battery_power_w(hass),
        import_limit_w=number(config.get("grid_import_limit")),
        export_limit_w=number(config.get("grid_export_limit")),
        capacity_limit_w=capacity_limit_w,
        safety_margin_w=number(config.get("grid_safety_margin"), 250.0) or 0.0,
        data_fresh=bool(measurement["fresh"]),
    )
    result.update(
        grid_entity_id=measurement["entity_id"],
        data_age_seconds=measurement["age_seconds"],
        max_age_seconds=measurement["max_age_seconds"],
        fuse_headroom_w=fuse["power_w"],
        fuse_entity_id=fuse["entity_id"],
        fuse_data_fresh=fuse["fresh"],
    )
    if requested_power_w > 0 and fuse["entity_id"]:
        if not fuse["fresh"]:
            result.update(
                status="blocked",
                allowed_power_w=0,
                reason="P1 fuse headroom is stale; charging is held safely",
            )
        else:
            current = current_battery_power_w(hass) or 0.0
            margin = max(
                0.0, number(config.get("grid_safety_margin"), 250.0) or 0.0
            )
            fuse_limit = max(0.0, float(fuse["power_w"] or 0.0) - margin)
            fuse_allowed = max(0.0, current + fuse_limit)
            previous = float(
                number(result.get("allowed_power_w"), requested_power_w) or 0.0
            )
            allowed = min(previous, fuse_allowed)
            if allowed < previous - 1:
                reason = str(result.get("reason") or "")
                fuse_reason = "Main-fuse phase headroom limited the battery target"
                projected = None
                if measurement["power_w"] is not None:
                    projected = round(
                        float(measurement["power_w"]) - current + allowed
                    )
                result.update(
                    status="blocked" if allowed < 1 else "limited",
                    reason=f"{reason}; {fuse_reason}" if reason else fuse_reason,
                    allowed_power_w=round(allowed),
                    projected_grid_power_w=projected,
                )
    return result
