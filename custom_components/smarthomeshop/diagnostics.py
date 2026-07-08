"""Diagnostics support for SmartHomeShop.io."""

from __future__ import annotations

from dataclasses import asdict, is_dataclass
from typing import Any

from homeassistant.core import HomeAssistant

from .const import CONF_PRODUCT_TYPE, VERSION

TO_REDACT = {"deviceId", "device_id"}


def _serialise(value: Any) -> Any:
    if is_dataclass(value) and not isinstance(value, type):
        try:
            return asdict(value)
        except (TypeError, ValueError):
            return str(value)
    if isinstance(value, dict):
        return {k: _serialise(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialise(v) for v in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator = getattr(entry, "runtime_data", None)

    data: dict[str, Any] = {
        "integration_version": VERSION,
        "product_type": entry.data.get(CONF_PRODUCT_TYPE),
        "entry_data": dict(entry.data),
        "entry_options": dict(entry.options),
    }

    if coordinator is not None:
        data["coordinator"] = {
            "type": type(coordinator).__name__,
            "last_update_success": coordinator.last_update_success,
            "data": _serialise(getattr(coordinator, "data", None)),
        }
        tracker = getattr(coordinator, "energy_tracker", None)
        if tracker is not None:
            data["energy"] = _serialise(tracker.data)

    return data
