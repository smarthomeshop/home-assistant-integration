"""Safe, explicit execution of a battery planner recommendation."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall

from .const import DOMAIN, LOGGER

SERVICE_APPLY_RECOMMENDATION = "apply_battery_recommendation"


def _clamp(value: float, low: Any, high: Any) -> float:
    try:
        minimum = float(low)
    except (TypeError, ValueError):
        minimum = value
    try:
        maximum = float(high)
    except (TypeError, ValueError):
        maximum = value
    return max(minimum, min(maximum, value))


async def async_register_battery_services(hass: HomeAssistant) -> None:
    """Register the manual/automation-facing battery execution service."""
    if hass.services.has_service(DOMAIN, SERVICE_APPLY_RECOMMENDATION):
        return

    async def _apply(call: ServiceCall) -> None:
        store = hass.data.get(DOMAIN, {}).get("store")
        planner = hass.data.get(DOMAIN, {}).get("battery_plan")
        config = store.get_battery() if store else {}
        explicit_action = call.data.get("action")
        if planner and not explicit_action:
            await planner.async_request_refresh()
        plan = (planner.data if planner else None) or {}
        action = explicit_action or plan.get("recommendation")
        if action not in ("charge", "hold", "discharge"):
            if explicit_action:
                raise vol.Invalid("No actionable battery recommendation is available")
            # A missing or non-actionable plan must not leave the battery in
            # its last commanded state (it could sit charging from the grid
            # indefinitely): fall back to a safe hold.
            LOGGER.warning(
                "No actionable battery recommendation; holding the battery idle"
            )
            action = "hold"
        if not config.get("enabled"):
            raise vol.Invalid("Battery planning is disabled")

        entity_id = config.get("control_entity")
        kind = config.get("control_kind")
        if not entity_id or kind not in ("switch", "number", "select"):
            raise vol.Invalid("Configure a supported battery control entity first")
        state = hass.states.get(entity_id)
        if state is None:
            raise vol.Invalid(f"Battery control entity {entity_id} was not found")

        if kind == "switch":
            service = "turn_on" if action == "charge" else "turn_off"
            await hass.services.async_call(
                "switch", service, {"entity_id": entity_id}, blocking=True
            )
        elif kind == "number":
            if action == "charge":
                value = abs(float(config.get("charge_power") or 0))
            elif action == "discharge":
                value = -abs(float(config.get("max_discharge_power") or 0))
            else:
                # Hold means idle. On a SIGNED power number the entity minimum
                # is full discharge, so never use it as the idle value; write 0
                # (clamped into range for unsigned charge-power numbers).
                value = 0.0
            value = _clamp(value, state.attributes.get("min"), state.attributes.get("max"))
            await hass.services.async_call(
                "number",
                "set_value",
                {"entity_id": entity_id, "value": value},
                blocking=True,
            )
        else:
            option = config.get(f"{action}_option")
            if action == "hold":
                option = config.get("idle_option")
            if not option:
                raise vol.Invalid(f"No select option configured for {action}")
            await hass.services.async_call(
                "select",
                "select_option",
                {"entity_id": entity_id, "option": option},
                blocking=True,
            )
        LOGGER.info("Applied battery planner action %s to %s", action, entity_id)

    hass.services.async_register(
        DOMAIN,
        SERVICE_APPLY_RECOMMENDATION,
        _apply,
        schema=vol.Schema(
            {vol.Optional("action"): vol.In(["charge", "hold", "discharge"])}
        ),
    )
