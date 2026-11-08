"""Safe, explicit execution of a battery planner recommendation."""

from __future__ import annotations

import asyncio
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall

from .const import DOMAIN, LOGGER
from .energy_guard import current_battery_power_w, evaluate_battery_guard
from .energy_intelligence import number

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

    async def _journal(entry: dict[str, Any]) -> None:
        store = hass.data.get(DOMAIN, {}).get("store")
        if store is None:
            return
        try:
            await store.async_append_energy_journal(entry)
        except Exception:  # A journal failure must never make control unsafe.
            LOGGER.warning(
                "Could not persist Smart Energy decision journal", exc_info=True
            )

    async def _verify_follow_up(
        *, target_power_w: float, action: str, entity_id: str
    ) -> None:
        """Verify that the mapped battery flow follows a sent command."""
        await asyncio.sleep(30)
        actual = current_battery_power_w(hass)
        tolerance = max(250.0, abs(target_power_w) * 0.25)
        if actual is None:
            status = "unavailable"
            reason = "Battery feedback sensor is unavailable"
        elif action == "hold":
            status = "following" if abs(actual) <= tolerance else "not_following"
            reason = (
                "Battery is idle"
                if status == "following"
                else "Battery still reports active power"
            )
        elif action == "charge":
            status = (
                "following"
                if actual > 0 and abs(actual - target_power_w) <= tolerance
                else "not_following"
            )
            reason = (
                "Battery is charging near the requested power"
                if status == "following"
                else "Battery charge power does not yet match the request"
            )
        else:
            status = (
                "following"
                if actual < 0 and abs(actual - target_power_w) <= tolerance
                else "not_following"
            )
            reason = (
                "Battery is discharging near the requested power"
                if status == "following"
                else "Battery discharge power does not yet match the request"
            )
        await _journal(
            {
                "kind": "verification",
                "mode": "automatic",
                "status": status,
                "action": action,
                "target_power_w": round(target_power_w),
                "actual_power_w": round(actual) if actual is not None else None,
                "control_entity": entity_id,
                "reason": reason,
            }
        )

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

        mode = config.get("execution_mode") or (
            "automatic" if config.get("automatic_control") else "advice"
        )
        if explicit_action == "charge":
            requested_power = abs(number(config.get("charge_power"), 0.0) or 0.0)
        elif explicit_action == "discharge":
            requested_power = -abs(
                number(config.get("max_discharge_power"), 0.0) or 0.0
            )
        elif explicit_action == "hold":
            requested_power = 0.0
        else:
            requested_power = number(
                plan.get("requested_power_w", plan.get("target_power_w")), 0.0
            ) or 0.0
        capacity_limit = number((plan.get("capacity_tariff") or {}).get("limit_w"))
        guard_config = dict(config)
        if (plan.get("capacity_tariff") or {}).get("enabled"):
            guard_config["grid_guard_enabled"] = True
        guard = evaluate_battery_guard(
            hass,
            guard_config,
            requested_power,
            capacity_limit_w=capacity_limit,
        )
        allowed_power = number(guard.get("allowed_power_w"), requested_power) or 0.0
        guarded_action = (
            "charge" if allowed_power > 0 else "discharge" if allowed_power < 0 else "hold"
        )

        if mode != "automatic":
            await _journal({
                "kind": "execution",
                "mode": mode,
                "status": "would_apply" if mode == "shadow" else "advice_only",
                "action": guarded_action,
                "requested_power_w": round(requested_power),
                "target_power_w": round(allowed_power),
                "guard_status": guard.get("status"),
                "reason": (
                    "Simulation mode: no command was sent"
                    if mode == "shadow"
                    else "Advice mode: no command was sent"
                ),
            })
            return

        entity_id = config.get("control_entity")
        kind = config.get("control_kind")
        if not entity_id or kind not in ("switch", "number", "select"):
            raise vol.Invalid("Configure a supported battery control entity first")
        state = hass.states.get(entity_id)
        if state is None:
            raise vol.Invalid(f"Battery control entity {entity_id} was not found")
        control_domain = str(entity_id).split(".", 1)[0]
        allowed_domains = {
            "switch": {"switch", "input_boolean"},
            "number": {"number"},
            "select": {"select"},
        }
        if control_domain not in allowed_domains[kind]:
            raise vol.Invalid(
                f"Configured {kind} control does not match {entity_id}"
            )

        if kind == "number":
            minimum = number(state.attributes.get("min"))
            maximum = number(state.attributes.get("max"))
            if (minimum is not None and minimum > 0) or (
                maximum is not None and maximum < 0
            ):
                raise vol.Invalid(
                    "The selected power number cannot represent the safe idle value 0"
                )

        # A switch or select cannot express a reduced power. Holding is safer
        # than enabling full power after the live guard has limited a request.
        if kind in ("switch", "select") and abs(allowed_power - requested_power) >= 1:
            action = "hold"
            allowed_power = 0.0
        else:
            action = guarded_action
        if kind == "switch" and action != "charge":
            action = "hold"
            allowed_power = 0.0

        try:
            if kind == "switch":
                service = "turn_on" if action == "charge" else "turn_off"
                await hass.services.async_call(
                    control_domain,
                    service,
                    {"entity_id": entity_id},
                    blocking=True,
                )
            elif kind == "number":
                cap = (
                    abs(float(config.get("charge_power") or 0))
                    if allowed_power > 0
                    else abs(float(config.get("max_discharge_power") or 0))
                )
                value = allowed_power
                if cap:
                    value = max(-cap, min(cap, value))
                value = _clamp(
                    value, state.attributes.get("min"), state.attributes.get("max")
                )
                await hass.services.async_call(
                    "number",
                    "set_value",
                    {"entity_id": entity_id, "value": value},
                    blocking=True,
                )
                allowed_power = value
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
        except Exception as err:
            await _journal({
                "kind": "execution",
                "mode": mode,
                "status": "failed",
                "action": action,
                "target_power_w": round(allowed_power),
                "control_entity": entity_id,
                "guard_status": guard.get("status"),
                "reason": str(err),
            })
            raise
        await _journal(
            {
                "kind": "execution",
                "mode": mode,
                "status": "sent",
                "action": action,
                "requested_power_w": round(requested_power),
                "target_power_w": round(allowed_power),
                "control_entity": entity_id,
                "guard_status": guard.get("status"),
                "reason": guard.get("reason"),
            }
        )
        hass.async_create_task(
            _verify_follow_up(
                target_power_w=allowed_power,
                action=action,
                entity_id=entity_id,
            ),
            f"{DOMAIN}_battery_command_verification",
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
