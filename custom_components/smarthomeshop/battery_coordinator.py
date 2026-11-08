"""Home Assistant coordinator for the SmartHomeShop battery planner."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from math import sqrt
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .battery_planner import (
    build_battery_plan,
    capacity_to_kwh,
    empty_plan,
    normalize_hourly_kw,
)
from .const import DOMAIN, LOGGER
from .energy_guard import (
    current_battery_power_w,
    evaluate_battery_guard,
    grid_measurement,
    solar_power_w,
)
from .energy_intelligence import (
    capacity_tariff_limit,
    describe_learning,
    learn_battery,
    load_series_from_profile,
    number,
    timestamp,
    trim_samples,
)
from .price_coordinator import PriceCoordinator

_SAMPLE_INTERVAL = timedelta(minutes=15)
_JOURNAL_REPEAT = timedelta(minutes=30)


class BatteryPlanCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Recalculate the battery recommendation from live HA and API state."""

    def __init__(self, hass: HomeAssistant, prices: PriceCoordinator) -> None:
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_battery_plan",
            update_interval=timedelta(minutes=5),
        )
        self.prices = prices
        self._last_journal_fingerprint: str | None = None
        self._last_journal_at: datetime | None = None

    def _config(self) -> dict[str, Any]:
        store = self.hass.data.get(DOMAIN, {}).get("store")
        if not store:
            return {}

        config = dict(store.get_battery())
        sources = store.get_energy_sources()
        capacity = self._capacity_kwh(sources.get("battery_capacity_entity"))
        if capacity is None:
            capacity = capacity_to_kwh(
                sources.get("battery_capacity_kwh"), "kWh"
            )
        if capacity is not None:
            config["capacity_kwh"] = capacity
        config.setdefault(
            "execution_mode",
            "automatic" if config.get("automatic_control") else "advice",
        )
        return config

    def _capacity_kwh(self, entity_id: str | None) -> float | None:
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unknown", "unavailable", "none"):
            return None
        return capacity_to_kwh(
            state.state, state.attributes.get("unit_of_measurement")
        )

    def _state_number(self, entity_id: str | None) -> float | None:
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unknown", "unavailable", "none"):
            return None
        try:
            return float(state.state)
        except (TypeError, ValueError):
            return None

    def _forecast_series(
        self,
        entity_id: str | None,
        starts: list[str],
        *,
        missing_value_kw: float = 0.0,
    ) -> list[float] | None:
        if not entity_id:
            return None
        state = self.hass.states.get(entity_id)
        if state is None:
            return None
        default_unit = state.attributes.get("unit_of_measurement")
        raw = state.attributes.get("forecast") or state.attributes.get("hourly")
        if not isinstance(raw, list):
            value = self._state_number(entity_id)
            if value is None:
                return None
            converted = normalize_hourly_kw(value, default_unit)
            return [converted] * len(starts) if converted is not None else None

        by_hour: dict[str, float] = {}
        for item in raw:
            if not isinstance(item, dict):
                continue
            stamp = (
                item.get("datetime")
                or item.get("period_start")
                or item.get("start")
                or item.get("time")
            )
            try:
                parsed = datetime.fromisoformat(str(stamp).replace("Z", "+00:00"))
            except (TypeError, ValueError):
                continue
            value = item.get(
                "power",
                item.get(
                    "watts",
                    item.get("pv_estimate", item.get("value", item.get("energy"))),
                ),
            )
            unit = item.get("unit") or item.get("unit_of_measurement") or default_unit
            number = normalize_hourly_kw(value, unit)
            if number is None:
                continue
            by_hour[parsed.astimezone(timezone.utc).strftime("%Y-%m-%dT%H")] = number
        result: list[float] = []
        for start in starts:
            try:
                parsed = datetime.fromisoformat(start.replace("Z", "+00:00"))
            except ValueError:
                result.append(missing_value_kw)
                continue
            value = by_hour.get(
                parsed.astimezone(timezone.utc).strftime("%Y-%m-%dT%H"),
                missing_value_kw,
            )
            result.append(value)
        return result

    def _account_solar_series(self, starts: list[str]) -> list[float] | None:
        """Use the account forecast when no Home Assistant forecast is selected."""
        forecast = self.hass.data.get(DOMAIN, {}).get("solar_forecast")
        return forecast.series(starts) if forecast is not None else None

    async def _learning_state(
        self, config: dict[str, Any], soc: float | None
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        """Sample local energy flows at most once per quarter hour."""
        store = self.hass.data.get(DOMAIN, {}).get("store")
        if store is None:
            return [], {}
        stored = store.get_energy_learning()
        samples = list(stored.get("samples", []))
        model = dict(stored.get("model", {}))
        if not (
            config.get("learning_enabled")
            or config.get("capacity_tariff_enabled")
        ):
            return samples, model

        now = dt_util.utcnow()
        last = timestamp(samples[-1].get("ts")) if samples else None
        if last is not None and now - last < _SAMPLE_INTERVAL - timedelta(seconds=30):
            return samples, model

        grid = grid_measurement(self.hass, config)
        grid_w = grid.get("power_w") if grid.get("fresh") else None
        battery_w = current_battery_power_w(self.hass)
        solar_w = solar_power_w(self.hass)
        if grid_w is None and battery_w is None and solar_w is None:
            return samples, model
        sample = {
            "ts": now.isoformat(),
            # Stale P1 values must never become tariff peaks or teach the
            # household load model. They remain visible in live guard
            # diagnostics, but are deliberately excluded from learning.
            "grid_w": grid_w,
            "battery_w": battery_w,
            "solar_w": solar_w,
            "soc": soc,
        }
        samples = trim_samples(samples, sample, now=now)
        model = (
            learn_battery(
                samples,
                config,
                local_timezone=dt_util.DEFAULT_TIME_ZONE,
            )
            if config.get("learning_enabled")
            else {}
        )
        await store.async_set_energy_learning({"samples": samples, "model": model})
        return samples, model

    def _apply_learning(
        self, config: dict[str, Any], model: dict[str, Any]
    ) -> dict[str, Any]:
        """Use only validated learned values and never exceed configured limits."""
        effective = dict(config)
        if not config.get("learning_enabled") or not config.get(
            "learning_use_for_planning"
        ):
            return effective
        usable = model.get("use") or {}
        configured_capacity = number(config.get("capacity_kwh"))
        learned_capacity = number(usable.get("capacity_kwh"))
        if configured_capacity and learned_capacity:
            effective["capacity_kwh"] = min(configured_capacity, learned_capacity)
        roundtrip = number(usable.get("roundtrip_efficiency"))
        if roundtrip:
            one_way = max(0.5, min(1.0, sqrt(roundtrip)))
            effective["charge_efficiency"] = min(
                number(config.get("charge_efficiency"), 1.0) or 1.0, one_way
            )
            effective["discharge_efficiency"] = min(
                number(config.get("discharge_efficiency"), 1.0) or 1.0, one_way
            )
        learned_charge = number(usable.get("charge_power_w"))
        if learned_charge:
            effective["charge_power"] = min(
                number(config.get("charge_power"), learned_charge) or learned_charge,
                learned_charge,
            )
        learned_discharge = number(usable.get("discharge_power_w"))
        if learned_discharge:
            effective["max_discharge_power"] = min(
                number(config.get("max_discharge_power"), learned_discharge)
                or learned_discharge,
                learned_discharge,
            )
        return effective

    async def _journal_decision(self, plan: dict[str, Any]) -> None:
        """Record meaningful planner changes without filling the local store."""
        store = self.hass.data.get(DOMAIN, {}).get("store")
        if store is None:
            return
        guard = plan.get("guard") or {}
        capacity = plan.get("capacity_tariff") or {}
        payload = {
            "kind": "decision",
            "mode": plan.get("execution_mode"),
            "status": plan.get("status"),
            "action": plan.get("recommendation"),
            "requested_power_w": plan.get(
                "requested_power_w", plan.get("target_power_w")
            ),
            "target_power_w": plan.get("target_power_w"),
            "guard_status": guard.get("status"),
            "grid_power_w": guard.get("grid_power_w"),
            "capacity_limit_w": capacity.get("limit_w"),
            "reason": plan.get("reason"),
        }
        target = number(payload.get("target_power_w"), 0.0) or 0.0
        capacity_limit = number(payload.get("capacity_limit_w"), 0.0) or 0.0
        fingerprint = json.dumps(
            {
                "mode": payload["mode"],
                "status": payload["status"],
                "action": payload["action"],
                "target_100w": round(target / 100),
                "guard_status": payload["guard_status"],
                "capacity_100w": round(capacity_limit / 100),
            },
            sort_keys=True,
        )
        now = dt_util.utcnow()
        if (
            fingerprint == self._last_journal_fingerprint
            and self._last_journal_at is not None
            and now - self._last_journal_at < _JOURNAL_REPEAT
        ):
            return
        await store.async_append_energy_journal(payload)
        self._last_journal_fingerprint = fingerprint
        self._last_journal_at = now

    async def _async_update_data(self) -> dict[str, Any]:
        config = self._config()
        if not config.get("enabled"):
            return empty_plan("disabled", "Battery planning is disabled")
        if not self.prices.supports_price_optimisation():
            return empty_plan(
                "not_ready",
                "Battery price optimisation requires a dynamic energy contract",
            )
        forecast = self.prices.forecast()
        starts = [str(item.get("start") or "") for item in forecast]
        soc = self._state_number(config.get("soc_sensor"))
        samples, model = await self._learning_state(config, soc)
        effective = self._apply_learning(config, model)
        capacity = capacity_tariff_limit(
            samples,
            config,
            now=dt_util.utcnow(),
            local_timezone=dt_util.DEFAULT_TIME_ZONE,
        )
        capacity_limit = number(capacity.get("limit_w"))
        configured_import = number(effective.get("grid_import_limit"))
        if capacity_limit and configured_import:
            effective["grid_import_limit"] = min(capacity_limit, configured_import)
        elif capacity_limit:
            effective["grid_import_limit"] = capacity_limit
        solar = self._forecast_series(config.get("pv_forecast_sensor"), starts)
        if solar is None:
            solar = self._account_solar_series(starts)
        try:
            fallback_load_kw = max(
                0.0, float(config.get("assumed_load_power") or 0.0) / 1000
            )
        except (TypeError, ValueError):
            fallback_load_kw = 0.0
        load = self._forecast_series(
            config.get("load_forecast_sensor"),
            starts,
            missing_value_kw=fallback_load_kw,
        )
        if load is None and config.get("learning_use_for_planning"):
            load = load_series_from_profile(
                (model.get("use") or {}).get("load_profile", {}),
                starts,
                local_timezone=dt_util.DEFAULT_TIME_ZONE,
            )
        plan = build_battery_plan(
            forecast,
            effective,
            soc,
            solar_forecast=solar,
            load_forecast=load,
            now=dt_util.utcnow(),
        )
        requested = number(plan.get("target_power_w"), 0.0) or 0.0
        guard_config = dict(config)
        if capacity.get("enabled"):
            guard_config["grid_guard_enabled"] = True
        guard = evaluate_battery_guard(
            self.hass,
            guard_config,
            requested,
            capacity_limit_w=capacity_limit,
        )
        guard_allowed = number(guard.get("allowed_power_w"), requested) or 0.0
        allowed = guard_allowed
        original_action = plan.get("recommendation")
        control_note = ""
        if (
            config.get("execution_mode") == "automatic"
            and config.get("control_kind") == "switch"
            and allowed < 0
        ):
            allowed = 0.0
            control_note = (
                "The selected switch supports charging only; automatic "
                "execution holds instead of discharging."
            )
        plan.update(
            execution_mode=config.get("execution_mode", "advice"),
            requested_power_w=round(requested),
            original_recommendation=original_action,
            target_power_w=round(allowed),
            guard=guard,
            guard_status=guard.get("status"),
            capacity_tariff=capacity,
            capacity_limit_w=capacity.get("limit_w"),
            learning=model,
            learning_summary=describe_learning(model),
            learned_roundtrip_efficiency=(model.get("use") or {}).get(
                "roundtrip_efficiency"
            ),
        )
        if plan.get("status") == "ready" and abs(allowed - requested) >= 1:
            plan["recommendation"] = (
                "charge" if allowed > 0 else "discharge" if allowed < 0 else "hold"
            )
        if plan.get("status") == "ready" and abs(guard_allowed - requested) >= 1:
            plan["reason"] = (
                f"{plan.get('reason', '')} Safety guard: "
                f"{guard.get('reason', '')}"
            ).strip()
        if control_note:
            plan["reason"] = f"{plan.get('reason', '')} {control_note}".strip()
        await self._journal_decision(plan)
        return plan
