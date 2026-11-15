"""Native Smart Loads planning, learning and guarded device execution."""

from __future__ import annotations

import asyncio
import copy
from datetime import UTC, datetime, timedelta
from statistics import median
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .const import DOMAIN, LOGGER
from .energy_guard import (
    current_battery_power_w,
    energy_dispatch_lock,
    fuse_headroom_measurement,
    grid_measurement,
    solar_power_w,
)
from .energy_intelligence import capacity_tariff_limit, load_series_from_profile
from .smart_load_planner import (
    build_load_plan,
    normalise_slots,
    number,
    planned_power_series,
    reserve_plan,
    timestamp,
)

UPDATE_INTERVAL = timedelta(minutes=1)
INVALID_STATES = {"", "none", "unknown", "unavailable"}
CONFIRMATION_SECONDS = 90
POWER_RUNNING_DEFAULT_W = 15.0
MAX_SAMPLE_SECONDS = 180.0
POWER_STOP_STABLE_SECONDS = 60.0
POWER_ONLY_APPLIANCE_STABLE_SECONDS = 300.0
FEEDBACK_MAX_AGE_SECONDS = 90.0
BATTERY_PLAN_MAX_AGE_SECONDS = 900.0
DISPATCH_RESERVATION_SECONDS = 120.0


def _state_value(hass: HomeAssistant, entity_id: Any) -> str | None:
    """Return a usable lower-case entity state."""
    state = hass.states.get(str(entity_id or ""))
    if state is None:
        return None
    value = str(state.state).strip().lower()
    return None if value in INVALID_STATES else value


def _power_w(hass: HomeAssistant, entity_id: Any) -> float | None:
    """Read a power entity and normalize it to watts."""
    state = hass.states.get(str(entity_id or ""))
    value = number(state.state) if state is not None else None
    if value is None or state is None:
        return None
    unit = str(state.attributes.get("unit_of_measurement") or "W").lower()
    if unit == "kw":
        value *= 1000
    elif unit == "mw":
        value *= 1_000_000
    elif unit not in {"w", ""}:
        return None
    return value


def _energy_kwh(hass: HomeAssistant, entity_id: Any) -> float | None:
    """Read an energy entity and normalize it to kWh."""
    state = hass.states.get(str(entity_id or ""))
    value = number(state.state) if state is not None else None
    if value is None or state is None:
        return None
    unit = str(state.attributes.get("unit_of_measurement") or "kWh").lower()
    if unit == "wh":
        value /= 1000
    elif unit == "mwh":
        value *= 1000
    elif unit not in {"kwh", ""}:
        return None
    return value


def _csv_states(value: Any, fallback: set[str]) -> set[str]:
    """Normalize stored status lists without using translated labels."""
    if isinstance(value, list):
        parsed = {str(item).strip().lower() for item in value if str(item).strip()}
    else:
        parsed = {
            item.strip().lower() for item in str(value or "").split(",") if item.strip()
        }
    return parsed or fallback


class SmartLoadCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinate whole-home planning and fail-safe load execution."""

    def __init__(self, hass: HomeAssistant, prices: Any) -> None:
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_smart_loads",
            update_interval=UPDATE_INTERVAL,
        )
        self.prices = prices
        self._cycle_lock = asyncio.Lock()
        self._stopping = False
        self._owned: dict[str, dict[str, Any]] = {}
        self._pauses: dict[str, dict[str, Any]] = {}
        self._runtime_loaded = False

    def _store(self) -> Any:
        return self.hass.data.get(DOMAIN, {}).get("store")

    def _config(self) -> dict[str, Any]:
        store = self._store()
        return store.get_smart_loads() if store else {}

    def _load_runtime(self, config: dict[str, Any]) -> None:
        self._owned = {
            str(key): dict(value)
            for key, value in config.get("control_owners", {}).items()
            if isinstance(value, dict)
        }
        self._pauses = {
            str(key): dict(value)
            for key, value in config.get("control_pauses", {}).items()
            if isinstance(value, dict)
        }
        if not getattr(self, "_runtime_loaded", False):
            # The interval before Home Assistant finished starting was not
            # observed. Rebase sampling so downtime can never become progress.
            restored_at = dt_util.as_local(dt_util.utcnow()).isoformat()
            for owner in self._owned.values():
                owner["sampled_at"] = restored_at
            self._runtime_loaded = True

    def _load_state(self, load: dict[str, Any]) -> dict[str, Any]:
        """Resolve readiness and running feedback from Home Assistant."""
        reasons: list[str] = []
        power = _power_w(self.hass, load.get("power_entity"))
        power_state = self.hass.states.get(str(load.get("power_entity") or ""))
        if power_state is not None and power is not None:
            reported = max(
                power_state.last_updated,
                getattr(power_state, "last_reported", power_state.last_updated),
            )
            if (dt_util.utcnow() - reported).total_seconds() > FEEDBACK_MAX_AGE_SECONDS:
                power = None
        status = _state_value(self.hass, load.get("status_entity"))
        running_value = _state_value(self.hass, load.get("running_entity"))
        ready_value = _state_value(self.hass, load.get("ready_entity"))
        control_value = _state_value(self.hass, load.get("control_entity"))
        ready_states = _csv_states(
            load.get("ready_states"), {"ready", "programmed", "waiting", "idle"}
        )
        running_states = _csv_states(
            load.get("running_states"),
            {"running", "on", "active", "heating", "drying", "washing"},
        )
        if (
            load.get("ready_entity")
            and ready_value != str(load.get("ready_on_state") or "on").lower()
        ):
            reasons.append("ready signal is off")
        if load.get("status_entity"):
            if status is None:
                reasons.append("status is unavailable")
            elif status not in ready_states and status not in running_states:
                reasons.append(f"device status is {status}")
        door = _state_value(self.hass, load.get("door_entity"))
        if load.get("door_entity") and door is None:
            reasons.append("door state is unavailable")
        elif door == str(load.get("door_open_state") or "on").lower():
            reasons.append("door is open")
        remote = _state_value(self.hass, load.get("remote_entity"))
        if load.get("remote_entity") and remote is None:
            reasons.append("remote start is unavailable")
        elif (
            load.get("remote_entity")
            and remote != str(load.get("remote_on_state") or "on").lower()
        ):
            reasons.append("remote start is off")

        threshold = max(
            1.0,
            number(load.get("running_above_w"), POWER_RUNNING_DEFAULT_W)
            or POWER_RUNNING_DEFAULT_W,
        )
        running_by_entity = bool(
            load.get("running_entity")
            and running_value == str(load.get("running_on_state") or "on").lower()
        )
        running_by_status = bool(status is not None and status in running_states)
        running_by_power = bool(power is not None and power >= threshold)
        running_by_control = bool(
            load.get("control_entity")
            and (
                control_value in {"on", "heat", "cool", "auto"}
                or (
                    str(load.get("category") or "") == "water_heater"
                    and control_value not in {None, "off", "idle", "standby"}
                )
            )
        )
        stopped_by_entity = bool(
            load.get("running_entity")
            and running_value is not None
            and running_value != str(load.get("running_on_state") or "on").lower()
        )
        stopped_by_status = bool(status is not None and status in ready_states)
        stopped_by_power = bool(
            load.get("power_entity") and power is not None and power < threshold
        )
        stopped_by_control = bool(
            load.get("control_entity") and control_value in {"off", "idle", "standby"}
        )
        running_evidence = [
            running_by_entity,
            running_by_status,
            running_by_power,
            running_by_control,
        ]
        stopped_evidence = [
            stopped_by_entity,
            stopped_by_status,
            stopped_by_power,
            stopped_by_control,
        ]
        running = any(running_evidence)
        # Conflicting telemetry is resolved conservatively: any running signal
        # wins. A start is only safe when at least one source positively proves
        # the device is stopped; unavailable feedback is never treated as off.
        stopped_confirmed = not running and any(stopped_evidence)
        cycle_feedback_available = bool(
            running_by_entity
            or running_by_status
            or running_by_power
            or stopped_by_entity
            or stopped_by_status
            or stopped_by_power
        )
        cycle_running = bool(
            running_by_entity
            or running_by_status
            or running_by_power
            or (running_by_control and not cycle_feedback_available)
        )
        # A smart plug may intentionally remain on after the appliance behind it
        # has finished. For natural-cycle completion, explicit status/running or
        # stable low-power feedback is therefore authoritative over the relay.
        cycle_stopped_confirmed = bool(
            not (running_by_entity or running_by_status or running_by_power)
            and (
                stopped_by_entity
                or stopped_by_status
                or stopped_by_power
                or (stopped_by_control and not cycle_feedback_available)
            )
        )
        # When explicit cycle feedback exists, the relay state describes power
        # availability rather than whether the appliance program is running.
        # Fall back to the relay only for control-only devices.
        running = cycle_running
        stopped_confirmed = cycle_stopped_confirmed
        feedback_entities = [
            load.get("running_entity"),
            load.get("status_entity"),
            load.get("power_entity"),
            load.get("control_entity"),
        ]
        feedback_available = any(
            entity and _state_value(self.hass, entity) is not None
            for entity in feedback_entities
        )
        return {
            "ready": not reasons or running,
            "running": running,
            "power_w": power,
            "status": status,
            "reason": ", ".join(reasons),
            "feedback_available": feedback_available,
            "stopped_confirmed": stopped_confirmed,
            "stopped_by_entity": stopped_by_entity,
            "stopped_by_status": stopped_by_status,
            "stopped_by_power": stopped_by_power,
            "stopped_by_control": stopped_by_control,
            "cycle_running": cycle_running,
            "cycle_stopped_confirmed": cycle_stopped_confirmed,
            "control_active": running_by_control,
        }

    def _price_rows(self) -> list[dict[str, Any]]:
        raw = self.prices.forecast() if self.prices is not None else []
        if not raw and self.prices is not None:
            raw = list(self.prices.today()) + list(self.prices.tomorrow())
        slots = normalise_slots(raw)
        return [
            {
                "start": slot.start.isoformat(),
                "end": slot.end.isoformat(),
                "consumer": slot.price,
                "feed_in": slot.feed_in,
                "predicted": slot.predicted,
                "confidence": slot.confidence,
                "resolution": "quarter-hour",
            }
            for slot in slots
        ]

    def _solar_series(self, starts: list[str]) -> list[float]:
        forecast = self.hass.data.get(DOMAIN, {}).get("solar_forecast")
        values = forecast.series(starts) if forecast is not None else None
        if values is not None:
            return values
        store = self._store()
        sources = store.get_energy_sources() if store else {}
        power = _power_w(self.hass, sources.get("solar_power")) or 0.0
        if sources.get("solar_invert"):
            power *= -1
        return [max(0.0, power / 1000)] * len(starts)

    def _base_load_series(self, starts: list[str]) -> list[float]:
        store = self._store()
        model = store.get_energy_learning().get("model", {}) if store else {}
        learned = load_series_from_profile(
            (model.get("use") or {}).get("load_profile", {}),
            starts,
            local_timezone=dt_util.DEFAULT_TIME_ZONE,
        )
        if learned is not None:
            return learned
        grid = grid_measurement(self.hass)
        solar = float(solar_power_w(self.hass) or 0.0)
        battery = float(current_battery_power_w(self.hass) or 0.0)
        flexible = self._active_flexible_power_w()
        live = max(
            0.0,
            (float(grid.get("power_w") or 0.0) + solar - battery - flexible) / 1000,
        )
        return [live] * len(starts)

    def _active_flexible_power_w(self) -> float:
        """Return fresh EV and Smart Load demand already present in P1 power."""
        store = self._store()
        vehicles = store.get_smart_ev().get("vehicles", []) if store else []
        loads = store.get_smart_loads().get("loads", []) if store else []
        total = 0.0
        seen: set[str] = set()
        now = datetime.now(UTC)
        for item in [*vehicles, *loads]:
            entity_id = str(item.get("power_entity") or "")
            if not entity_id or entity_id in seen:
                continue
            seen.add(entity_id)
            state = self.hass.states.get(entity_id)
            value = _power_w(self.hass, entity_id)
            if state is None or value is None:
                continue
            reported = max(
                state.last_updated,
                getattr(state, "last_reported", state.last_updated),
            )
            if (now - reported).total_seconds() <= 90:
                total += max(0.0, value)
        return total

    def _fresh_power_w(self, entity_id: Any) -> float:
        """Return fresh positive appliance power, otherwise zero."""
        state = self.hass.states.get(str(entity_id or ""))
        value = _power_w(self.hass, entity_id)
        if state is None or value is None:
            return 0.0
        reported = max(
            state.last_updated,
            getattr(state, "last_reported", state.last_updated),
        )
        if (dt_util.utcnow() - reported).total_seconds() > FEEDBACK_MAX_AGE_SECONDS:
            return 0.0
        return max(0.0, value)

    def _owner_reservation_w(
        self,
        load: dict[str, Any],
        owner: dict[str, Any] | None,
    ) -> float:
        """Reserve unresolved owned demand without double-counting live power."""
        if owner is None:
            return 0.0
        expected = max(
            0.0,
            number(owner.get("expected_power_w"), load.get("power_w")) or 0.0,
        )
        attempted = timestamp(owner.get("command_attempted_at"))
        reserve_until = timestamp(owner.get("reservation_until"))
        # Do not release this reservation merely because the appliance sensor
        # updates first. P1 and phase samples can lag behind it; retaining the
        # full expected demand for two minutes prevents a second dispatch from
        # spending the same physical headroom.
        if attempted is None or reserve_until is None:
            return expected
        if dt_util.utcnow() <= reserve_until:
            return expected
        # Once the propagation window has elapsed, P1 should contain the
        # appliance's measured demand. Reserve the remaining expected peak so
        # low-power fill/idle phases cannot make a later heater peak disappear
        # from the household budget. Missing or stale telemetry returns zero
        # measured power and therefore keeps the full conservative reservation.
        return max(0.0, expected - self._fresh_power_w(load.get("power_entity")))

    def _smart_load_dispatch_reservation_w(self, *, exclude: str = "") -> float:
        """Return outstanding dispatches for all other owned Smart Loads."""
        config = self._config()
        by_id = {
            str(item.get("id") or ""): dict(item)
            for item in config.get("loads", [])
            if isinstance(item, dict)
        }
        return sum(
            self._owner_reservation_w(
                by_id.get(load_id) or dict(owner.get("load_snapshot") or {}), owner
            )
            for load_id, owner in self._owned.items()
            if load_id != exclude
        )

    def _ev_dispatch_reservation_w(self) -> float:
        """Include outstanding Smart EV dispatches in the shared start budget."""
        store = self._store()
        smart_ev = store.get_smart_ev() if store else {}
        total = 0.0
        seen: set[str] = set()
        for owner in (smart_ev.get("control_owners") or {}).values():
            if not isinstance(owner, dict):
                continue
            vehicle = dict(owner.get("config") or {})
            control = str(vehicle.get("control_entity") or "")
            if control and control in seen:
                continue
            if control:
                seen.add(control)
            expected = max(
                0.0,
                number(
                    owner.get("expected_power_w"),
                    vehicle.get("charge_power_kw", 0.0),
                )
                or 0.0,
            )
            if expected and expected < 100:
                expected *= 1000
            commanded_at = timestamp(owner.get("commanded_at"))
            if (
                commanded_at
                and (dt_util.utcnow() - commanded_at.astimezone(UTC)).total_seconds()
                <= DISPATCH_RESERVATION_SECONDS
            ):
                total += expected
            else:
                total += max(
                    0.0,
                    expected - self._fresh_power_w(vehicle.get("power_entity")),
                )
        return total

    def _battery_dispatch_reservation_w(self, now: datetime | None = None) -> float:
        """Reserve an automatic battery charge not yet reflected in live P1."""
        reference = now or dt_util.as_local(dt_util.utcnow())
        recent = self.hass.data.get(DOMAIN, {}).get("battery_dispatch_reservation")
        if isinstance(recent, dict):
            reserve_until = timestamp(recent.get("reservation_until"))
            if reserve_until and reference.astimezone(UTC) <= reserve_until.astimezone(
                UTC
            ):
                return max(0.0, number(recent.get("expected_power_w"), 0.0) or 0.0)
        store = self._store()
        config = getattr(store, "get_battery", dict)() if store else {}
        automatic = bool(config.get("enabled")) and (
            str(config.get("execution_mode") or "advice") == "automatic"
            or bool(config.get("automatic_control"))
        )
        battery = self.hass.data.get(DOMAIN, {}).get("battery_plan")
        plan = (battery.data or {}) if battery else {}
        if not automatic or str(plan.get("status") or "") != "ready":
            return 0.0
        calculated_at = timestamp(plan.get("calculated_at"))
        if (
            calculated_at is None
            or (
                reference.astimezone(UTC) - calculated_at.astimezone(UTC)
            ).total_seconds()
            > BATTERY_PLAN_MAX_AGE_SECONDS
        ):
            return 0.0
        target = 0.0
        for item in plan.get("timeline", []):
            start, end = timestamp(item.get("start")), timestamp(item.get("end"))
            if start and end and start <= reference < end:
                target = max(0.0, number(item.get("power_w"), 0.0) or 0.0)
                break
        actual = max(0.0, current_battery_power_w(self.hass) or 0.0)
        return max(0.0, target - actual)

    def _overlap_series(
        self,
        rows: list[dict[str, Any]],
        periods: list[tuple[datetime, datetime, float]],
    ) -> list[float]:
        values: list[float] = []
        for row in rows:
            start = timestamp(row.get("start"))
            end = timestamp(row.get("end"))
            if start is None or end is None:
                values.append(0.0)
                continue
            matches = [
                value
                for period_start, period_end, value in periods
                if period_start.astimezone(UTC) < end.astimezone(UTC)
                and period_end.astimezone(UTC) > start.astimezone(UTC)
            ]
            values.append(max(matches, default=0.0))
        return values

    def _battery_series(self, rows: list[dict[str, Any]]) -> list[float]:
        battery = self.hass.data.get(DOMAIN, {}).get("battery_plan")
        timeline = (battery.data or {}).get("timeline", []) if battery else []
        periods: list[tuple[datetime, datetime, float]] = []
        for item in timeline:
            start, end = timestamp(item.get("start")), timestamp(item.get("end"))
            if start and end and end > start:
                periods.append((start, end, number(item.get("power_w"), 0.0) or 0.0))
        values: list[float] = []
        for row in rows:
            start, end = timestamp(row.get("start")), timestamp(row.get("end"))
            matches = [
                value
                for period_start, period_end, value in periods
                if start and end and period_start < end and period_end > start
            ]
            negative = [value for value in matches if value < 0]
            values.append(min(negative) if negative else max(matches, default=0.0))
        return values

    def _ev_series(self, rows: list[dict[str, Any]]) -> list[float]:
        ev = self.hass.data.get(DOMAIN, {}).get("smart_ev")
        plans = (ev.data or {}).get("plans", {}) if ev else {}
        normalized: dict[str, dict[str, Any]] = {}
        for vehicle_id, plan in plans.items():
            power = max(0.0, number(plan.get("charge_power_kw"), 0.0) or 0.0) * 1000
            if not power:
                power = max(
                    0.0,
                    number((plan.get("guard") or {}).get("allowed_power_w"), 0.0)
                    or 0.0,
                )
            normalized[str(vehicle_id)] = {
                "power_w": power,
                "segments": list(plan.get("segments", [])),
            }
        return planned_power_series(rows, normalized)

    def _enriched_rows(self) -> list[dict[str, Any]]:
        rows = self._price_rows()
        starts = [str(item.get("start") or "") for item in rows]
        solar = self._solar_series(starts)
        base = self._base_load_series(starts)
        battery = self._battery_series(rows)
        ev = self._ev_series(rows)
        return [
            {
                **row,
                "solar_kw": solar[index],
                "load_kw": base[index],
                "battery_target_w": battery[index],
                "ev_reserved_w": ev[index],
                "load_reserved_w": 0.0,
            }
            for index, row in enumerate(rows)
        ]

    def _capacity_limit(self, config: dict[str, Any]) -> float | None:
        explicit = number(config.get("capacity_limit_w"))
        if explicit and explicit > 0:
            return explicit
        battery = self.hass.data.get(DOMAIN, {}).get("battery_plan")
        live = battery.data or {} if battery else {}
        value = number((live.get("capacity_tariff") or {}).get("limit_w"))
        if value and value > 0:
            return value
        store = self._store()
        battery_config = store.get_battery() if store else {}
        learning = store.get_energy_learning() if store else {}
        capacity = capacity_tariff_limit(
            learning.get("samples", []),
            battery_config,
            now=dt_util.utcnow(),
            local_timezone=dt_util.DEFAULT_TIME_ZONE,
        )
        return number(capacity.get("limit_w"))

    def _pause_active(
        self,
        load: dict[str, Any],
        plan: dict[str, Any],
        state: dict[str, Any],
    ) -> dict[str, Any] | None:
        load_id = str(load.get("id") or "")
        pause = self._pauses.get(load_id)
        if not pause:
            return None
        if pause.get("kind") == "manual_recovery":
            # Only another explicit Smart/Run-now mode choice clears an
            # administrator recovery lockout in storage.
            return pause
        if str(load.get("mode") or "smart") == "run_now" and pause.get("kind") in {
            "completed",
            "manual_stop",
            "start_failed",
        }:
            return pause
        if pause.get("kind") == "progress":
            if pause.get("deadline") != plan.get("deadline"):
                self._pauses.pop(load_id, None)
                return None
            blocked_until = timestamp(pause.get("blocked_until"))
            if blocked_until and dt_util.utcnow() < blocked_until.astimezone(UTC):
                return pause
            return None
        if pause.get("kind") == "completed":
            if pause.get("deadline") != plan.get("deadline"):
                self._pauses.pop(load_id, None)
                return None
            # A completed cycle stays latched for this deadline even if its
            # readiness entity temporarily becomes unknown or unavailable.
            return pause
        if not state.get("ready") or pause.get("deadline") != plan.get("deadline"):
            self._pauses.pop(load_id, None)
            return None
        return pause

    def _guard(
        self,
        load: dict[str, Any],
        config: dict[str, Any],
        state: dict[str, Any],
        reserved_w: float,
        capacity_limit_w: float | None,
        requested_w: float | None = None,
    ) -> dict[str, Any]:
        """Reserve P1 import and tightest-phase headroom before a start."""
        requested = max(
            0.0,
            number(requested_w, number(load.get("power_w"), 1000.0)) or 1000.0,
        )
        current = max(0.0, number(state.get("power_w"), 0.0) or 0.0)
        additional = max(0.0, requested - current)
        grid = grid_measurement(self.hass, config)
        fuse = fuse_headroom_measurement(self.hass, config)
        if not grid.get("fresh") or not fuse.get("fresh"):
            return {
                "status": "blocked",
                "allowed": False,
                "reason": "P1 grid or phase headroom is unavailable or stale",
                "grid": grid,
                "fuse": fuse,
            }
        # Only a missing or invalid margin falls back to 250 W; 0 W is valid.
        configured_margin = number(config.get("grid_safety_margin_w"))
        margin = max(
            0.0, 250.0 if configured_margin is None else configured_margin
        )
        reasons: list[str] = []
        allowed = True
        limit = number(config.get("grid_import_limit_w"))
        projected = float(grid.get("power_w") or 0.0) + additional + reserved_w
        if limit and projected > limit - margin:
            allowed = False
            reasons.append("grid import limit")
        if capacity_limit_w and projected > capacity_limit_w - margin:
            allowed = False
            reasons.append("capacity-tariff target")
        if float(fuse.get("power_w") or 0.0) < additional + reserved_w + margin:
            allowed = False
            reasons.append("main-fuse phase headroom")
        if current_battery_power_w(self.hass) is None and load.get(
            "require_battery_data"
        ):
            allowed = False
            reasons.append("battery power is unavailable")
        return {
            "status": "safe" if allowed else "blocked",
            "allowed": allowed,
            "reason": ", ".join(reasons) or "Live P1 limits allow this start",
            "requested_w": round(requested),
            "additional_w": round(additional),
            "projected_grid_w": round(projected),
            "grid": grid,
            "fuse": fuse,
            "capacity_limit_w": capacity_limit_w,
        }

    def _entity_action(self, entity_id: str, start: bool) -> dict[str, Any]:
        domain = entity_id.split(".", 1)[0]
        if domain == "button":
            return {"domain": "button", "service": "press", "entity_id": entity_id}
        if domain in {"scene", "script"}:
            return {"domain": domain, "service": "turn_on", "entity_id": entity_id}
        return {
            "domain": domain,
            "service": "turn_on" if start else "turn_off",
            "entity_id": entity_id,
        }

    def _actions(self, load: dict[str, Any], start: bool) -> list[dict[str, Any]]:
        custom = load.get("start_action" if start else "stop_action")
        actions: list[dict[str, Any]] = []
        if isinstance(custom, dict) and custom.get("service"):
            service = str(custom["service"])
            if "." in service:
                domain, name = service.split(".", 1)
                actions.append(
                    {
                        "domain": domain,
                        "service": name,
                        "entity_id": custom.get("entity_id"),
                        "data": dict(custom.get("data") or {}),
                    }
                )
        category = str(load.get("category") or "switch")
        if actions:
            return actions
        if category == "climate":
            entity = str(load.get("control_entity") or "")
            if start:
                if load.get("climate_temperature") is not None:
                    actions.append(
                        {
                            "domain": "climate",
                            "service": "set_temperature",
                            "entity_id": entity,
                            "data": {"temperature": load["climate_temperature"]},
                        }
                    )
                actions.append(
                    {
                        "domain": "climate",
                        "service": "set_hvac_mode",
                        "entity_id": entity,
                        "data": {"hvac_mode": str(load.get("climate_mode") or "heat")},
                    }
                )
                return actions
            return [{"domain": "climate", "service": "turn_off", "entity_id": entity}]
        entity = str(
            load.get("start_entity" if start else "stop_entity")
            or load.get("control_entity")
            or ""
        )
        return [self._entity_action(entity, start)] if entity else []

    @staticmethod
    def _execution_signature(load: dict[str, Any]) -> dict[str, Any]:
        """Return fields that must not change between planning and dispatch."""
        fields = set(load) - {"name"}
        return {key: copy.deepcopy(load.get(key)) for key in fields}

    def _current_load_matches(self, planned: dict[str, Any]) -> bool:
        """Return whether the persisted load still matches this planned load."""
        load_id = str(planned.get("id") or "")
        config = self._config()
        current = next(
            (
                item
                for item in config.get("loads", [])
                if str(item.get("id") or "") == load_id
            ),
            None,
        )
        return bool(
            current
            and current.get("enabled", True)
            and self._execution_signature(current) == self._execution_signature(planned)
        )

    def _load_is_current(self, planned: dict[str, Any]) -> bool:
        """Reject stale config or authorization immediately before dispatch."""
        config = self._config()
        return bool(
            config.get("enabled")
            and config.get("execution_mode") == "automatic"
            and self._current_load_matches(planned)
        )

    def _load_is_current_for_shadow(self, planned: dict[str, Any]) -> bool:
        """Describe only starts the current shadow configuration would allow."""
        config = self._config()
        return bool(
            config.get("enabled")
            and config.get("execution_mode") == "shadow"
            and self._current_load_matches(planned)
        )

    async def _call_actions(self, actions: list[dict[str, Any]]) -> None:
        for action in actions:
            domain = str(action.get("domain") or "")
            service = str(action.get("service") or "")
            if (
                not domain
                or not service
                or not self.hass.services.has_service(domain, service)
            ):
                raise RuntimeError(
                    f"Home Assistant service {domain}.{service} is unavailable"
                )
            data = dict(action.get("data") or {})
            if action.get("entity_id"):
                data["entity_id"] = action["entity_id"]
            try:
                await asyncio.wait_for(
                    self.hass.services.async_call(domain, service, data, blocking=True),
                    timeout=30,
                )
            except TimeoutError as err:
                raise RuntimeError(
                    f"Home Assistant service {domain}.{service} did not respond within 30 seconds"
                ) from err

    def _sample_owner(
        self, owner: dict[str, Any], state: dict[str, Any], now: datetime
    ) -> None:
        previous = timestamp(owner.get("sampled_at")) or now
        seconds = min(MAX_SAMPLE_SECONDS, max(0.0, (now - previous).total_seconds()))
        running_seconds = (
            seconds
            if state.get("cycle_running", state.get("running"))
            and str(owner.get("status") or "") != "stopping"
            else 0.0
        )
        measured_power = number(state.get("power_w"))
        power = max(
            0.0,
            measured_power
            if measured_power is not None
            else number(owner.get("expected_power_w"), 0.0) or 0.0,
        )
        if running_seconds <= 0:
            power = 0.0
        elif measured_power is None:
            owner["estimated_runtime_seconds"] = round(
                max(
                    0.0,
                    number(owner.get("estimated_runtime_seconds"), 0.0) or 0.0,
                )
                + running_seconds,
                1,
            )
        owner["observed_runtime_seconds"] = round(
            max(0.0, number(owner.get("observed_runtime_seconds"), 0.0) or 0.0)
            + running_seconds,
            1,
        )
        owner["energy_kwh"] = round(
            float(owner.get("energy_kwh") or 0.0) + power * running_seconds / 3_600_000,
            6,
        )
        if measured_power is not None:
            owner["peak_power_w"] = round(
                max(float(owner.get("peak_power_w") or 0.0), power)
            )
        current_price = (
            number(self.prices.electricity_price()) if self.prices is not None else None
        )
        average = None
        if self.prices is not None:
            prices = [number(row.get("consumer")) for row in self.prices.today()]
            valid = [value for value in prices if value is not None]
            average = sum(valid) / len(valid) if valid else None
        if current_price is not None:
            owner["cost"] = round(
                float(owner.get("cost") or 0.0)
                + power * running_seconds / 3_600_000 * current_price,
                6,
            )
        if average is not None:
            owner["baseline_cost"] = round(
                float(owner.get("baseline_cost") or 0.0)
                + power * running_seconds / 3_600_000 * average,
                6,
            )
        owner["sampled_at"] = now.isoformat()

    def _completed_run(
        self, load: dict[str, Any], owner: dict[str, Any], now: datetime, result: str
    ) -> dict[str, Any]:
        started = timestamp(owner.get("started_at")) or now
        meter_start = number(owner.get("energy_meter_start"))
        meter_end = _energy_kwh(self.hass, load.get("energy_entity"))
        meter_measured = bool(
            meter_start is not None
            and meter_end is not None
            and meter_end >= meter_start
        )
        measured = (
            max(0.0, meter_end - meter_start)
            if meter_measured
            else max(0.0, number(owner.get("energy_kwh"), 0.0) or 0.0)
        )
        # Negative dynamic prices are real income, not zero-cost energy.
        cost = number(owner.get("cost"), 0.0) or 0.0
        baseline = number(owner.get("baseline_cost"), cost)
        if baseline is None:
            baseline = cost
        observed_seconds = number(owner.get("observed_runtime_seconds"))
        if observed_seconds is None:
            ended = timestamp(owner.get("stop_requested_at")) or now
            observed_seconds = max(0.0, (ended - started).total_seconds())
        estimated_seconds = max(
            0.0, number(owner.get("estimated_runtime_seconds"), 0.0) or 0.0
        )
        measurement = (
            "measured"
            if meter_measured or estimated_seconds <= 0
            else "estimated"
            if estimated_seconds + 1 >= observed_seconds
            else "mixed"
        )
        return {
            "id": f"{load['id']}-{int(now.timestamp())}",
            "load_id": load["id"],
            "name": load.get("name"),
            "started_at": started.isoformat(),
            "ended_at": now.isoformat(),
            "duration_min": round(max(0.0, observed_seconds / 60), 1),
            "energy_kwh": round(measured, 3),
            "peak_power_w": round(number(owner.get("peak_power_w"), 0.0) or 0.0),
            "cost": round(cost, 3),
            "savings": round(baseline - cost, 3),
            "result": result,
            "interruptible": bool(owner.get("interruptible", False)),
            "measurement": measurement,
        }

    def _stopped_feedback_is_stable(
        self,
        owner: dict[str, Any],
        state: dict[str, Any],
        now: datetime,
    ) -> bool:
        """Debounce power-only completion while trusting explicit device states."""
        if state.get("running"):
            owner.pop("power_stopped_since", None)
            return False
        power_only = bool(
            state.get("stopped_confirmed")
            and state.get("stopped_by_power")
            and not state.get("stopped_by_entity")
            and not state.get("stopped_by_status")
            and not state.get("stopped_by_control")
        )
        if not power_only:
            owner.pop("power_stopped_since", None)
            return bool(state.get("stopped_confirmed"))
        first_seen = timestamp(owner.get("power_stopped_since"))
        if first_seen is None:
            owner["power_stopped_since"] = now.isoformat()
            return False
        load = dict(owner.get("load_snapshot") or {})
        power_only_appliance = bool(
            not owner.get("interruptible", False)
            and load.get("power_entity")
            and not load.get("status_entity")
            and not load.get("running_entity")
        )
        stable_seconds = (
            POWER_ONLY_APPLIANCE_STABLE_SECONDS
            if power_only_appliance
            else POWER_STOP_STABLE_SECONDS
        )
        return (now - first_seen).total_seconds() >= stable_seconds

    def _natural_completion_is_stable(
        self,
        owner: dict[str, Any],
        state: dict[str, Any],
        now: datetime,
    ) -> bool:
        """Confirm an appliance cycle ended even when its smart plug stays on."""
        if not state.get("cycle_stopped_confirmed"):
            owner.pop("cycle_stopped_since", None)
            return False
        power_only = bool(
            state.get("stopped_by_power")
            and not state.get("stopped_by_entity")
            and not state.get("stopped_by_status")
        )
        if not power_only:
            owner.pop("cycle_stopped_since", None)
            return True
        first_seen = timestamp(owner.get("cycle_stopped_since"))
        if first_seen is None:
            owner["cycle_stopped_since"] = now.isoformat()
            return False
        load = dict(owner.get("load_snapshot") or {})
        power_only_appliance = bool(
            not owner.get("interruptible", False)
            and load.get("power_entity")
            and not load.get("status_entity")
            and not load.get("running_entity")
        )
        stable_seconds = (
            POWER_ONLY_APPLIANCE_STABLE_SECONDS
            if power_only_appliance
            else POWER_STOP_STABLE_SECONDS
        )
        return (now - first_seen).total_seconds() >= stable_seconds

    def _record_stop_progress(
        self,
        load: dict[str, Any],
        plan: dict[str, Any],
        owner: dict[str, Any],
        run: dict[str, Any] | None,
        result: str,
        now: datetime,
    ) -> None:
        """Latch run-now completion and retain interruptible cycle progress."""
        if run is None or result not in {
            "completed",
            "segment_end",
            "guard_paused",
            "released",
            "shutdown",
        }:
            return
        load_id = str(load["id"])
        mode = str(owner.get("run_mode") or load.get("mode") or "smart")
        if mode == "run_now" and result == "completed":
            self._pauses[load_id] = {
                "kind": "completed",
                "deadline": owner.get("deadline") or plan.get("deadline"),
                "reason": "Run now completed; choose a new mode to run again",
            }
            return
        if not bool(owner.get("interruptible", False)):
            return
        previous = max(0.0, number(owner.get("progress_before_min"), 0.0) or 0.0)
        completed = previous + max(0.0, number(run.get("duration_min"), 0.0) or 0.0)
        required = max(
            0.25,
            number(
                owner.get("required_duration_min"),
                plan.get("required_duration_min", load.get("duration_min")),
            )
            or 0.25,
        )
        if completed + 0.25 >= required:
            self._pauses[load_id] = {
                "kind": "completed",
                "deadline": owner.get("deadline") or plan.get("deadline"),
                "completed_min": round(completed, 2),
                "reason": "Required running time completed",
            }
            return
        pause: dict[str, Any] = {
            "kind": "progress",
            "deadline": owner.get("deadline") or plan.get("deadline"),
            "completed_min": round(completed, 2),
            "remaining_min": round(required - completed, 2),
            "reason": "Waiting for the next planned segment",
        }
        if result == "guard_paused":
            pause["blocked_until"] = (now + timedelta(minutes=5)).isoformat()
            pause["reason"] = "Grid protection paused this load for five minutes"
        elif result == "segment_end":
            pause["blocked_until"] = (now + timedelta(minutes=5)).isoformat()
            pause["reason"] = "Minimum off time protects this device from short cycling"
        elif result in {"released", "shutdown"}:
            pause["reason"] = "Run paused; completed time was preserved"
        self._pauses[load_id] = pause

    def _learn(
        self,
        learning: dict[str, dict[str, Any]],
        run: dict[str, Any],
    ) -> None:
        load_id = str(run["load_id"])
        current = dict(learning.get(load_id, {}))
        samples = [dict(item) for item in current.get("samples", [])]
        if (
            run.get("result") == "completed"
            and not run.get("interruptible")
            and number(run.get("duration_min"), 0.0) > 1
        ):
            samples.append(
                {
                    "duration_min": run.get("duration_min"),
                    "energy_kwh": run.get("energy_kwh"),
                    "peak_power_w": run.get("peak_power_w"),
                    "measurement": run.get("measurement"),
                }
            )
        samples = samples[-10:]
        current["samples"] = samples
        current["sample_count"] = len(samples)
        if len(samples) >= 3:
            durations = [
                float(item["duration_min"])
                for item in samples
                if number(item.get("duration_min"))
            ]
            peaks = [
                float(item["peak_power_w"])
                for item in samples
                if item.get("measurement") != "estimated"
                and number(item.get("peak_power_w"), 0.0) > 0
            ]
            energies = [
                float(item["energy_kwh"])
                for item in samples
                if item.get("measurement") != "estimated"
                and number(item.get("energy_kwh"), 0.0) > 0
            ]
            if durations:
                current["duration_min"] = round(median(durations), 1)
            if peaks:
                current["power_w"] = round(median(peaks))
            if energies:
                current["energy_kwh"] = round(median(energies), 3)
            current["trusted"] = True
        current["updated_at"] = datetime.now(UTC).isoformat()
        learning[load_id] = current

    async def _persist_safety(self) -> None:
        store = self._store()
        if store:
            await store.async_set_smart_loads_runtime(
                control_owners=self._owned,
                control_pauses=self._pauses,
                immediate=True,
            )

    async def async_confirm_stopped_and_release(self, load_id: str) -> dict[str, Any]:
        """Release stranded ownership after an administrator confirms power is off.

        This sends no hardware command. Positive running feedback always wins
        and blocks recovery; unavailable feedback can only be overridden by
        this explicit administrator action.
        """
        async with self._cycle_lock:
            config = self._config()
            self._load_runtime(config)
            owner = self._owned.get(load_id)
            if owner is None:
                raise ValueError("Smart Load is not currently owned")
            load = next(
                (
                    dict(item)
                    for item in config.get("loads", [])
                    if str(item.get("id") or "") == load_id
                ),
                dict(owner.get("load_snapshot") or {}),
            )
            if load and self._load_state(load).get("running"):
                raise ValueError(
                    "The device still reports that it is running; switch it off first"
                )
            released = self._owned.pop(load_id)
            previous_pause = copy.deepcopy(self._pauses.get(load_id))
            self._pauses[load_id] = {
                "kind": "manual_recovery",
                "deadline": released.get("deadline"),
                "reason": "Administrator confirmed the device is physically off",
            }
            store = self._store()
            if store:
                try:
                    await store.async_set_smart_loads_runtime(
                        control_owners=self._owned,
                        control_pauses=self._pauses,
                        journal_entries=[
                            {
                                "load_id": load_id,
                                "action": "release",
                                "status": "confirmed_off",
                                "reason": "Administrator confirmed the device is physically off",
                            }
                        ],
                        immediate=True,
                    )
                except Exception:
                    self._owned[load_id] = released
                    if previous_pause is None:
                        self._pauses.pop(load_id, None)
                    else:
                        self._pauses[load_id] = previous_pause
                    raise
            return {
                "load_id": load_id,
                "released": True,
                "reason": self._pauses[load_id]["reason"],
            }

    async def _start(
        self,
        load: dict[str, Any],
        plan: dict[str, Any],
        state: dict[str, Any],
        now: datetime,
        *,
        config: dict[str, Any] | None = None,
        reserved_w: float = 0.0,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        actions = self._actions(load, True)
        if not actions:
            return {
                "status": "unavailable",
                "reason": "No start action is configured",
            }, {
                "load_id": load["id"],
                "action": "start",
                "status": "failed",
                "reason": "No start action is configured",
            }
        unavailable = next(
            (
                f"{action.get('domain')}.{action.get('service')}"
                for action in actions
                if not self.hass.services.has_service(
                    str(action.get("domain") or ""),
                    str(action.get("service") or ""),
                )
            ),
            None,
        )
        if unavailable:
            reason = f"Home Assistant service {unavailable} is unavailable"
            return {
                "status": "unavailable",
                "reason": reason,
            }, {
                "load_id": load["id"],
                "action": "start",
                "status": "failed",
                "reason": reason,
            }
        power_only_appliance = bool(
            not load.get("interruptible", False)
            and load.get("power_entity")
            and not load.get("status_entity")
            and not load.get("running_entity")
        )
        confirmation_seconds = (
            POWER_ONLY_APPLIANCE_STABLE_SECONDS
            if power_only_appliance
            else CONFIRMATION_SECONDS
        )
        owner = {
            "load_id": load["id"],
            "status": "starting",
            "started_at": now.isoformat(),
            "sampled_at": now.isoformat(),
            "confirm_by": (now + timedelta(seconds=confirmation_seconds)).isoformat(),
            "expected_end": (
                now + timedelta(minutes=float(plan.get("duration_min") or 60))
            ).isoformat(),
            "expected_power_w": plan.get("power_w"),
            "interruptible": bool(load.get("interruptible", False)),
            "run_mode": str(load.get("mode") or "smart"),
            "deadline": plan.get("deadline"),
            "required_duration_min": plan.get(
                "required_duration_min", plan.get("duration_min")
            ),
            "progress_before_min": plan.get("completed_duration_min", 0.0),
            "energy_meter_start": _energy_kwh(self.hass, load.get("energy_entity")),
            "energy_kwh": 0.0,
            "peak_power_w": 0.0,
            "cost": 0.0,
            "baseline_cost": 0.0,
            "observed_runtime_seconds": 0.0,
            "estimated_runtime_seconds": 0.0,
            "stop_actions": self._actions(load, False),
            "load_snapshot": copy.deepcopy(load),
        }
        async with energy_dispatch_lock(self.hass):
            fresh_state = self._load_state(load)
            if (
                config is not None and not self._load_is_current(load)
            ) or not fresh_state.get("ready"):
                reason = "Configuration or readiness changed before dispatch"
                return {"status": "configuration_changed", "reason": reason}, {
                    "load_id": load["id"],
                    "action": "start",
                    "status": "cancelled",
                    "reason": reason,
                }
            if (
                fresh_state.get("running")
                or fresh_state.get("control_active")
                or not fresh_state.get("stopped_confirmed")
            ):
                reason = (
                    "Device started outside Smart Loads before dispatch"
                    if fresh_state.get("running") or fresh_state.get("control_active")
                    else "Stopped feedback changed before dispatch"
                )
                return {"status": "external_control", "reason": reason}, {
                    "load_id": load["id"],
                    "action": "start",
                    "status": "cancelled",
                    "reason": reason,
                }
            if config is not None:
                current_config = self._config()
                live_reserved = (
                    self._smart_load_dispatch_reservation_w(exclude=str(load["id"]))
                    + self._ev_dispatch_reservation_w()
                    + self._battery_dispatch_reservation_w(now)
                )
                fresh_guard = self._guard(
                    load,
                    current_config,
                    fresh_state,
                    max(reserved_w, live_reserved),
                    self._capacity_limit(current_config),
                    number(plan.get("power_w")),
                )
                if not fresh_guard.get("allowed"):
                    reason = str(
                        fresh_guard.get("reason")
                        or "Live grid protection changed before dispatch"
                    )
                    return {
                        "status": "blocked_by_grid",
                        "reason": reason,
                        "guard": fresh_guard,
                    }, {
                        "load_id": load["id"],
                        "action": "start",
                        "status": "blocked",
                        "reason": reason,
                    }
            dispatch_task: asyncio.Task[None] | None = None
            self._owned[str(load["id"])] = owner
            try:
                # The durable claim is made only after the serialized final
                # readiness/grid checks. If cancellation strikes before a
                # service task exists, the claim is rolled back. Once the task
                # exists it is shielded so an owned start always corresponds to
                # a command that was actually attempted.
                await self._persist_safety()
                # Persistence is an await and external P1/device state can move
                # while it completes. Repeat every safety decision after the
                # verified write, with no await between this check and task
                # creation.
                fresh_state = self._load_state(load)
                if (
                    (config is not None and not self._load_is_current(load))
                    or not fresh_state.get("ready")
                    or fresh_state.get("running")
                    or fresh_state.get("control_active")
                    or not fresh_state.get("stopped_confirmed")
                ):
                    self._owned.pop(str(load["id"]), None)
                    await self._persist_safety()
                    reason = (
                        "Device started outside Smart Loads before dispatch"
                        if fresh_state.get("running")
                        or fresh_state.get("control_active")
                        else "Configuration or readiness changed before dispatch"
                    )
                    return {"status": "configuration_changed", "reason": reason}, {
                        "load_id": load["id"],
                        "action": "start",
                        "status": "cancelled",
                        "reason": reason,
                    }
                if config is not None:
                    current_config = self._config()
                    live_reserved = (
                        self._smart_load_dispatch_reservation_w(exclude=str(load["id"]))
                        + self._ev_dispatch_reservation_w()
                        + self._battery_dispatch_reservation_w(
                            dt_util.as_local(dt_util.utcnow())
                        )
                    )
                    final_guard = self._guard(
                        load,
                        current_config,
                        fresh_state,
                        max(reserved_w, live_reserved),
                        self._capacity_limit(current_config),
                        number(plan.get("power_w")),
                    )
                    if not final_guard.get("allowed"):
                        self._owned.pop(str(load["id"]), None)
                        await self._persist_safety()
                        reason = str(
                            final_guard.get("reason")
                            or "Live grid protection changed before dispatch"
                        )
                        return {
                            "status": "blocked_by_grid",
                            "reason": reason,
                            "guard": final_guard,
                        }, {
                            "load_id": load["id"],
                            "action": "start",
                            "status": "blocked",
                            "reason": reason,
                        }
                attempted_at = dt_util.as_local(dt_util.utcnow())
                owner["command_attempted_at"] = attempted_at.isoformat()
                owner["reservation_until"] = (
                    attempted_at + timedelta(seconds=DISPATCH_RESERVATION_SECONDS)
                ).isoformat()
                dispatch_task = asyncio.create_task(self._call_actions(actions))
                await asyncio.shield(dispatch_task)
                # Keep the lock until the timestamped dispatch reservation is
                # durably visible to Smart EV and later Smart Load cycles.
                await self._persist_safety()
            except asyncio.CancelledError:
                if dispatch_task is None:
                    self._owned.pop(str(load["id"]), None)
                    await asyncio.shield(self._persist_safety())
                else:
                    try:
                        await asyncio.shield(dispatch_task)
                    except Exception as err:  # noqa: BLE001 - preserve uncertainty.
                        owner["start_error"] = str(err)
                    owner["status"] = "starting_uncertain"
                    owner["confirm_by"] = None
                    owner.setdefault(
                        "start_error",
                        "Start dispatch was interrupted; device feedback must confirm the outcome",
                    )
                    await asyncio.shield(self._persist_safety())
                raise
            except Exception as err:
                if dispatch_task is None:
                    self._owned.pop(str(load["id"]), None)
                    await self._persist_safety()
                    raise
                # A service exception does not prove that the device received no
                # command. Retain stop responsibility until feedback confirms off.
                owner["status"] = "starting_uncertain"
                owner["start_error"] = str(err)
                await self._persist_safety()
                return {
                    "status": "start_failed",
                    "reason": str(err),
                    "owned": True,
                }, {
                    "load_id": load["id"],
                    "action": "start",
                    "status": "failed",
                    "reason": str(err),
                }
            state = self._load_state(load)
            if state.get("running"):
                owner["status"] = "running"
                await self._persist_safety()
                status = "running"
                reason = "Start confirmed by device feedback"
            else:
                status = "confirmation_wait"
                reason = "Start sent; waiting for device feedback"
            return {"status": status, "reason": reason}, {
                "load_id": load["id"],
                "action": "start",
                "status": "sent",
                "reason": reason,
            }

    async def _stop(
        self,
        load: dict[str, Any],
        owner: dict[str, Any],
        now: datetime,
        *,
        result: str,
    ) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any] | None]:
        owner["stop_result"] = result
        owner.setdefault("stop_requested_at", now.isoformat())
        owner["stop_attempts"] = int(number(owner.get("stop_attempts"), 0.0) or 0) + 1
        actions = [
            dict(item) for item in owner.get("stop_actions", [])
        ] or self._actions(load, False)
        before = self._load_state(load)
        must_deactivate_control = bool(
            owner.get("interruptible", False)
            and before.get("control_active")
            and load.get("control_entity")
            and actions
        )
        if before.get("stopped_confirmed") and not must_deactivate_control:
            if not self._stopped_feedback_is_stable(owner, before, now):
                owner["status"] = "stopping"
                owner["confirm_by"] = (
                    now + timedelta(seconds=CONFIRMATION_SECONDS)
                ).isoformat()
                await self._persist_safety()
                return (
                    {
                        "status": "confirmation_wait",
                        "reason": "Low power is being verified before completion",
                        "owned": True,
                    },
                    {
                        "load_id": load["id"],
                        "action": "stop",
                        "status": "waiting",
                        "reason": "Low power is being verified before completion",
                    },
                    None,
                )
            self._sample_owner(owner, before, now)
            run = self._completed_run(load, owner, now, result)
            self._owned.pop(str(load["id"]), None)
            return (
                {"status": "completed", "reason": "Stop confirmed"},
                {
                    "load_id": load["id"],
                    "action": "stop",
                    "status": "confirmed",
                    "reason": "Stop confirmed",
                },
                run,
            )
        if not actions:
            owner["status"] = "stopping"
            owner["stop_error"] = "No stop action is configured"
            await self._persist_safety()
            return (
                {
                    "status": "stop_failed",
                    "reason": "No stop action is configured",
                    "owned": True,
                },
                {
                    "load_id": load["id"],
                    "action": "stop",
                    "status": "failed",
                    "reason": "No stop action is configured",
                },
                None,
            )
        if actions:
            try:
                await self._call_actions(actions)
            except Exception as err:  # noqa: BLE001 - HA service integrations vary.
                owner["status"] = "stopping"
                owner["stop_error"] = str(err)
                owner["confirm_by"] = (
                    now + timedelta(seconds=CONFIRMATION_SECONDS)
                ).isoformat()
                await self._persist_safety()
                return (
                    {"status": "stop_failed", "reason": str(err)},
                    {
                        "load_id": load["id"],
                        "action": "stop",
                        "status": "failed",
                        "reason": str(err),
                    },
                    None,
                )
        state = self._load_state(load)
        if not state.get("stopped_confirmed") or (
            must_deactivate_control and state.get("control_active")
        ):
            owner["status"] = "stopping"
            owner["confirm_by"] = (
                now + timedelta(seconds=CONFIRMATION_SECONDS)
            ).isoformat()
            await self._persist_safety()
            return (
                {
                    "status": "confirmation_wait",
                    "reason": "Stop sent; waiting for device feedback",
                },
                {
                    "load_id": load["id"],
                    "action": "stop",
                    "status": "sent",
                    "reason": "Waiting for stop confirmation",
                },
                None,
            )
        if not self._stopped_feedback_is_stable(owner, state, now):
            owner["status"] = "stopping"
            owner["confirm_by"] = (
                now + timedelta(seconds=CONFIRMATION_SECONDS)
            ).isoformat()
            await self._persist_safety()
            return (
                {
                    "status": "confirmation_wait",
                    "reason": "Low power is being verified before completion",
                    "owned": True,
                },
                {
                    "load_id": load["id"],
                    "action": "stop",
                    "status": "waiting",
                    "reason": "Low power is being verified before completion",
                },
                None,
            )
        self._sample_owner(owner, state, now)
        run = self._completed_run(load, owner, now, result)
        self._owned.pop(str(load["id"]), None)
        return (
            {"status": "completed", "reason": "Run completed and control was released"},
            {
                "load_id": load["id"],
                "action": "stop",
                "status": "confirmed",
                "reason": "Run completed",
            },
            run,
        )

    async def _execute(
        self,
        config: dict[str, Any],
        load: dict[str, Any],
        plan: dict[str, Any],
        state: dict[str, Any],
        now: datetime,
        reserved_w: float,
        capacity_limit_w: float | None,
    ) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any] | None]:
        load_id = str(load["id"])
        owner = self._owned.get(load_id)
        execution_mode = str(config.get("execution_mode") or "advice")
        automatic = bool(config.get("enabled")) and execution_mode == "automatic"
        pause = self._pause_active(load, plan, state)
        guard = self._guard(
            load,
            config,
            state,
            reserved_w,
            capacity_limit_w,
            number(plan.get("power_w")),
        )
        desired = bool(plan.get("active")) and not pause
        journal: list[dict[str, Any]] = []

        if owner:
            self._sample_owner(owner, state, now)
            status = str(owner.get("status") or "running")
            confirm_by = timestamp(owner.get("confirm_by"))
            if status in {"starting", "starting_uncertain"}:
                if status == "starting_uncertain" and state.get("stopped_confirmed"):
                    if state.get("control_active"):
                        if not bool(owner.get("interruptible", False)):
                            return (
                                {
                                    "status": "not_following",
                                    "reason": "Start remains uncertain while the control is still on",
                                    "owned": True,
                                    "guard": guard,
                                },
                                journal,
                                None,
                            )
                        outcome, entry, run = await self._stop(
                            load, owner, now, result="start_failed"
                        )
                        return (
                            {
                                **outcome,
                                "status": "not_following",
                                "reason": "The device stayed idle; its control is being switched off",
                                "guard": guard,
                                "owned": load_id in self._owned,
                            },
                            [entry],
                            run,
                        )
                    self._owned.pop(load_id, None)
                    self._pauses[load_id] = {
                        "kind": "start_failed",
                        "deadline": owner.get("deadline") or plan.get("deadline"),
                        "reason": "Device feedback confirmed the uncertain start remained off",
                    }
                    await self._persist_safety()
                    return (
                        {
                            "status": "not_following",
                            "reason": "Device feedback confirmed the uncertain start remained off",
                            "owned": False,
                            "guard": guard,
                        },
                        [
                            {
                                "load_id": load_id,
                                "action": "start",
                                "status": "not_following",
                                "reason": "Device feedback confirmed the uncertain start remained off",
                            }
                        ],
                        None,
                    )
                if state.get("running"):
                    owner["status"] = "running"
                    await self._persist_safety()
                elif status == "starting_uncertain" and confirm_by is None:
                    # A non-interruptible appliance may have received the start
                    # command even when feedback disappeared. Keep ownership and
                    # never issue an automatic stop based on that uncertainty.
                    return (
                        {
                            "status": "not_following",
                            "reason": str(
                                owner.get("start_error")
                                or "Start feedback is unavailable; automatic stop is disabled"
                            ),
                            "owned": True,
                            "guard": guard,
                        },
                        journal,
                        None,
                    )
                elif confirm_by and now >= confirm_by:
                    if state.get("stopped_confirmed"):
                        if state.get("control_active"):
                            if not bool(owner.get("interruptible", False)):
                                owner["status"] = "starting_uncertain"
                                owner["confirm_by"] = None
                                owner["start_error"] = (
                                    "Start feedback is absent while the control is still on"
                                )
                                await self._persist_safety()
                                return (
                                    {
                                        "status": "not_following",
                                        "reason": owner["start_error"],
                                        "owned": True,
                                        "guard": guard,
                                    },
                                    journal,
                                    None,
                                )
                            stop_result, entry, run = await self._stop(
                                load, owner, now, result="start_failed"
                            )
                            self._pauses[load_id] = {
                                "kind": "start_failed",
                                "deadline": plan.get("deadline"),
                                "reason": "No running feedback after the start command",
                            }
                            await self._persist_safety()
                            return (
                                {
                                    **stop_result,
                                    "status": "not_following",
                                    "reason": "The device did not confirm its start",
                                    "guard": guard,
                                    "owned": load_id in self._owned,
                                },
                                [entry],
                                run,
                            )
                        self._owned.pop(load_id, None)
                        self._pauses[load_id] = {
                            "kind": "start_failed",
                            "deadline": plan.get("deadline"),
                            "reason": "No running feedback after the start command",
                        }
                        await self._persist_safety()
                        return (
                            {
                                "status": "not_following",
                                "reason": "The device did not confirm its start",
                                "guard": guard,
                            },
                            [
                                {
                                    "load_id": load_id,
                                    "action": "start",
                                    "status": "not_following",
                                    "reason": "Device feedback confirmed it remained off",
                                }
                            ],
                            None,
                        )
                    if not bool(owner.get("interruptible", False)):
                        owner["status"] = "starting_uncertain"
                        owner["confirm_by"] = None
                        owner["start_error"] = (
                            "Feedback was lost; the non-interruptible cycle will not be stopped"
                        )
                        await self._persist_safety()
                        return (
                            {
                                "status": "not_following",
                                "reason": owner["start_error"],
                                "owned": True,
                                "guard": guard,
                            },
                            [
                                {
                                    "load_id": load_id,
                                    "action": "start",
                                    "status": "unconfirmed",
                                    "reason": owner["start_error"],
                                }
                            ],
                            None,
                        )
                    stop_result, entry, _run = await self._stop(
                        load, owner, now, result="start_failed"
                    )
                    self._pauses[load_id] = {
                        "kind": "start_failed",
                        "deadline": plan.get("deadline"),
                        "reason": "No running feedback after the start command",
                    }
                    await self._persist_safety()
                    return (
                        {
                            **stop_result,
                            "status": "not_following",
                            "reason": "The device did not confirm its start",
                            "guard": guard,
                        },
                        [entry],
                        None,
                    )
                else:
                    return (
                        {
                            "status": "confirmation_wait",
                            "reason": "Waiting for start confirmation",
                            "owned": True,
                            "guard": guard,
                        },
                        journal,
                        None,
                    )
            elif status == "stopping":
                physically_released = not (
                    bool(owner.get("interruptible", False))
                    and state.get("control_active")
                )
                if state.get("stopped_confirmed") and physically_released:
                    if not self._stopped_feedback_is_stable(owner, state, now):
                        await self._persist_safety()
                        return (
                            {
                                "status": "confirmation_wait",
                                "reason": "Low power is being verified before completion",
                                "owned": True,
                                "guard": guard,
                            },
                            journal,
                            None,
                        )
                    self._sample_owner(owner, state, now)
                    stop_result = str(owner.get("stop_result") or "completed")
                    run = self._completed_run(load, owner, now, stop_result)
                    self._owned.pop(load_id, None)
                    self._record_stop_progress(load, plan, owner, run, stop_result, now)
                    await self._persist_safety()
                    return (
                        {
                            "status": "completed",
                            "reason": "Stop confirmed",
                            "guard": guard,
                        },
                        journal,
                        run,
                    )
                if confirm_by and now >= confirm_by:
                    if (
                        bool(owner.get("interruptible", False))
                        and int(number(owner.get("stop_attempts"), 0.0) or 0) < 3
                    ):
                        outcome, entry, run = await self._stop(
                            load,
                            owner,
                            now,
                            result=str(owner.get("stop_result") or "guard_paused"),
                        )
                        if run:
                            self._record_stop_progress(
                                load,
                                plan,
                                owner,
                                run,
                                str(owner.get("stop_result") or "guard_paused"),
                                now,
                            )
                            await self._persist_safety()
                        return (
                            {
                                **outcome,
                                "guard": guard,
                                "owned": load_id in self._owned,
                            },
                            [entry],
                            run,
                        )
                    return (
                        {
                            "status": "stop_failed",
                            "reason": "The device did not confirm its stop",
                            "owned": True,
                            "guard": guard,
                        },
                        journal,
                        None,
                    )
                return (
                    {
                        "status": "confirmation_wait",
                        "reason": "Waiting for stop confirmation",
                        "owned": True,
                        "guard": guard,
                    },
                    journal,
                    None,
                )

            started = timestamp(owner.get("started_at")) or now
            minimum_run = max(1.0, number(load.get("minimum_run_min"), 2.0) or 2.0)
            runtime_min = max(0.0, (now - started).total_seconds() / 60)
            interruptible = bool(
                owner.get("interruptible", load.get("interruptible", False))
            )
            natural_stopped = bool(state.get("cycle_stopped_confirmed"))
            if natural_stopped and not self._natural_completion_is_stable(
                owner, state, now
            ):
                await self._persist_safety()
                return (
                    {
                        "status": "confirmation_wait",
                        "reason": "Low power is being verified before completion",
                        "owned": True,
                        "guard": guard,
                    },
                    journal,
                    None,
                )
            if natural_stopped and runtime_min >= minimum_run:
                if interruptible and state.get("control_active"):
                    outcome, entry, run = await self._stop(
                        load, owner, now, result="completed"
                    )
                    if run:
                        self._record_stop_progress(
                            load, plan, owner, run, "completed", now
                        )
                        await self._persist_safety()
                    return (
                        {**outcome, "guard": guard, "owned": load_id in self._owned},
                        [entry],
                        run,
                    )
                run = self._completed_run(load, owner, now, "completed")
                self._owned.pop(load_id, None)
                self._pauses[load_id] = {
                    "kind": "completed",
                    "deadline": owner.get("deadline") or plan.get("deadline"),
                    "reason": "Device reported completion",
                }
                await self._persist_safety()
                return (
                    {
                        "status": "completed",
                        "reason": "Device reported completion",
                        "guard": guard,
                    },
                    journal,
                    run,
                )
            if natural_stopped and runtime_min < minimum_run:
                if interruptible and state.get("control_active"):
                    outcome, entry, run = await self._stop(
                        load, owner, now, result="start_failed"
                    )
                    self._pauses[load_id] = {
                        "kind": "start_failed",
                        "deadline": owner.get("deadline") or plan.get("deadline"),
                        "reason": "The device stayed idle after the start command",
                    }
                    await self._persist_safety()
                    return (
                        {
                            **outcome,
                            "status": "not_following",
                            "reason": "The device stayed idle; its control is being switched off",
                            "guard": guard,
                            "owned": load_id in self._owned,
                        },
                        [entry],
                        run,
                    )
                self._owned.pop(load_id, None)
                self._pauses[load_id] = {
                    "kind": "manual_stop",
                    "deadline": owner.get("deadline") or plan.get("deadline"),
                    "reason": "The device was stopped outside Smart Loads",
                }
                await self._persist_safety()
                return (
                    {
                        "status": "manual_override",
                        "reason": "Manual stop detected; automatic restart is paused",
                        "guard": guard,
                    },
                    journal,
                    None,
                )

            expected_end = timestamp(owner.get("expected_end")) or now
            overloaded = not guard.get("allowed")
            observed_total = max(
                0.0,
                number(owner.get("progress_before_min"), 0.0) or 0.0,
            ) + max(
                0.0,
                (number(owner.get("observed_runtime_seconds"), 0.0) or 0.0) / 60,
            )
            required_total = max(
                0.25,
                number(
                    owner.get("required_duration_min"),
                    plan.get("required_duration_min", load.get("duration_min")),
                )
                or 0.25,
            )
            time_complete = interruptible and observed_total + 0.25 >= required_total
            if not state.get("feedback_available") and not (
                automatic
                and interruptible
                and (time_complete or not desired or overloaded)
            ):
                return (
                    {
                        "status": "not_following",
                        "reason": "Running feedback is unavailable; control remains owned",
                        "owned": True,
                        "guard": guard,
                        "runtime_min": round(runtime_min, 1),
                    },
                    journal,
                    None,
                )
            plan_stop = not desired and runtime_min >= minimum_run
            if (
                automatic
                and interruptible
                and (time_complete or plan_stop or overloaded)
            ):
                outcome, entry, run = await self._stop(
                    load,
                    owner,
                    now,
                    result=(
                        "completed"
                        if time_complete
                        else "segment_end"
                        if plan_stop
                        else "guard_paused"
                    ),
                )
                stop_result = (
                    "completed"
                    if time_complete
                    else "segment_end"
                    if plan_stop
                    else "guard_paused"
                )
                if run:
                    self._record_stop_progress(load, plan, owner, run, stop_result, now)
                    await self._persist_safety()
                journal.append(entry)
                return (
                    {**outcome, "guard": guard, "owned": load_id in self._owned},
                    journal,
                    run,
                )
            return (
                {
                    "status": "running" if automatic else "owned_advice",
                    "reason": (
                        "Non-interruptible run continues despite a new grid limit"
                        if overloaded and not interruptible
                        else "Non-interruptible cycle waits for device completion"
                        if not interruptible and now >= expected_end
                        else "Smart Loads owns this running device"
                    ),
                    "owned": True,
                    "guard": guard,
                    "runtime_min": round(runtime_min, 1),
                },
                journal,
                None,
            )

        if state.get("running") or state.get("control_active"):
            return (
                {
                    "status": "external_control",
                    "reason": "Device control is active but Smart Loads does not own it",
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        if not automatic:
            if execution_mode == "shadow" and desired:
                shadow_ready = bool(
                    state.get("ready")
                    and state.get("stopped_confirmed")
                    and guard.get("allowed")
                    and self._load_is_current_for_shadow(load)
                )
                journal.append(
                    {
                        "load_id": load_id,
                        "action": "simulate_start",
                        "status": "would_start" if shadow_ready else "blocked",
                        "reason": (
                            "Shadow plan is ready but does not control the device"
                            if shadow_ready
                            else str(
                                state.get("reason")
                                or guard.get("reason")
                                or "Stopped feedback is not confirmed"
                            )
                        ),
                    }
                )
            return (
                {
                    "status": execution_mode,
                    "reason": "Automatic execution is not enabled",
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        if pause:
            return (
                {
                    "status": str(pause.get("kind") or "paused"),
                    "reason": str(pause.get("reason") or "This cycle is paused"),
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        if not desired:
            if plan.get("status") in {
                "capacity_blocked",
                "no_horizon",
                "insufficient_horizon",
            }:
                return (
                    {
                        "status": "planning_failed",
                        "reason": str(plan.get("reason") or "No executable plan"),
                        "owned": False,
                        "guard": guard,
                    },
                    journal,
                    None,
                )
            return (
                {
                    "status": "waiting",
                    "reason": "Waiting for the planned slot",
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        if not state.get("ready"):
            journal.append(
                {
                    "load_id": load_id,
                    "action": "start",
                    "status": "blocked",
                    "reason": str(state.get("reason") or "Device is not ready"),
                }
            )
            return (
                {
                    "status": "not_ready",
                    "reason": str(state.get("reason") or "Device is not ready"),
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        if not state.get("stopped_confirmed"):
            journal.append(
                {
                    "load_id": load_id,
                    "action": "start",
                    "status": "blocked",
                    "reason": "Automatic start needs feedback that confirms the device is off",
                }
            )
            return (
                {
                    "status": "unsafe_control",
                    "reason": "Automatic start needs feedback that confirms the device is off",
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        if not guard.get("allowed"):
            journal.append(
                {
                    "load_id": load_id,
                    "action": "start",
                    "status": "blocked",
                    "reason": str(guard.get("reason")),
                }
            )
            return (
                {
                    "status": "blocked_by_grid",
                    "reason": str(guard.get("reason")),
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        fresh_state = self._load_state(load)
        if fresh_state.get("running") or fresh_state.get("control_active"):
            return (
                {
                    "status": "external_control",
                    "reason": "Device started outside Smart Loads before dispatch",
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        if (
            not fresh_state.get("ready")
            or not fresh_state.get("stopped_confirmed")
            or not self._load_is_current(load)
        ):
            return (
                {
                    "status": "configuration_changed",
                    "reason": "Device configuration changed; the plan was cancelled before start",
                    "owned": False,
                    "guard": guard,
                },
                journal,
                None,
            )
        outcome, entry = await self._start(
            load,
            plan,
            state,
            now,
            config=config,
            reserved_w=reserved_w,
        )
        journal.append(entry)
        return (
            {
                **outcome,
                "owned": load_id in self._owned,
                "guard": outcome.get("guard", guard),
            },
            journal,
            None,
        )

    async def _release_missing_or_disabled(
        self, loads: list[dict[str, Any]], automatic: bool
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """Release controls removed from config or when automatic mode is disabled."""
        by_id = {str(item.get("id") or ""): item for item in loads}
        journal: list[dict[str, Any]] = []
        completed: list[dict[str, Any]] = []
        for load_id, owner in list(self._owned.items()):
            load = by_id.get(load_id)
            if automatic and load and load.get("enabled", True):
                continue
            # A washer/dishwasher cycle must be allowed to finish even when
            # the user leaves automatic mode. The coordinator keeps ownership
            # only so completion can still be observed and recorded.
            if not bool(
                owner.get(
                    "interruptible",
                    load.get("interruptible", False) if load else False,
                )
            ):
                continue
            target = load or dict(owner.get("load_snapshot") or {})
            if not target:
                owner["status"] = "stopping"
                owner["stop_error"] = "The original load configuration is unavailable"
                journal.append(
                    {
                        "load_id": load_id,
                        "action": "release",
                        "status": "failed",
                        "reason": owner["stop_error"],
                    }
                )
                continue
            now = dt_util.as_local(dt_util.utcnow())
            if owner.get("status") == "stopping":
                state = self._load_state(target)
                confirm_by = timestamp(owner.get("confirm_by"))
                attempts = int(number(owner.get("stop_attempts"), 0.0) or 0)
                if not state.get("stopped_confirmed") and (
                    (confirm_by and now < confirm_by) or attempts >= 3
                ):
                    journal.append(
                        {
                            "load_id": load_id,
                            "action": "release",
                            "status": "waiting" if attempts < 3 else "failed",
                            "reason": (
                                "Waiting for stop confirmation"
                                if attempts < 3
                                else "The device did not confirm its stop after three attempts"
                            ),
                        }
                    )
                    continue
            outcome, entry, run = await self._stop(
                target,
                owner,
                now,
                result="released",
            )
            if run:
                self._record_stop_progress(
                    target,
                    {
                        "deadline": owner.get("deadline"),
                        "required_duration_min": owner.get(
                            "required_duration_min", target.get("duration_min")
                        ),
                    },
                    owner,
                    run,
                    "released",
                    now,
                )
                completed.append(run)
            journal.append(
                {
                    **entry,
                    "action": "release",
                    "reason": (
                        "Automatic control disabled or load removed"
                        if outcome.get("status") == "completed"
                        else entry.get("reason")
                    ),
                }
            )
        if journal or self._owned:
            await self._persist_safety()
        return journal, completed

    async def _async_update_data(self) -> dict[str, Any]:
        if self._stopping:
            return self.data or {"enabled": False, "loads": [], "plans": {}}
        async with self._cycle_lock:
            if self._stopping:
                return self.data or {"enabled": False, "loads": [], "plans": {}}
            config = self._config()
            self._load_runtime(config)
            loads = [
                dict(item)
                for item in config.get("loads", [])
                if isinstance(item, dict) and item.get("id")
            ]
            automatic = (
                bool(config.get("enabled"))
                and str(config.get("execution_mode") or "advice") == "automatic"
            )
            journal, completed = await self._release_missing_or_disabled(
                loads, automatic
            )
            now = dt_util.as_local(dt_util.utcnow())
            rows = self._enriched_rows()
            capacity_limit = self._capacity_limit(config)
            planning_limits = [
                value
                for value in (
                    capacity_limit,
                    number(config.get("grid_import_limit_w")),
                )
                if value is not None and value > 0
            ]
            planning_capacity_limit = (
                max(
                    0.0,
                    min(planning_limits)
                    - max(
                        0.0,
                        number(config.get("grid_safety_margin_w"), 250.0) or 0.0,
                    ),
                )
                if planning_limits
                else None
            )
            learning = {
                str(key): dict(value)
                for key, value in config.get("learning", {}).items()
            }
            plans: dict[str, dict[str, Any]] = {}
            states: dict[str, dict[str, Any]] = {}
            # Stable order makes simultaneous loads reserve capacity predictably.
            for load in sorted(
                loads,
                key=lambda item: (
                    0 if str(item.get("id") or "") in self._owned else 1,
                    str(item.get("ready_by") or "23:59"),
                    str(item.get("id")),
                ),
            ):
                load_id = str(load["id"])
                state = self._load_state(load)
                states[load_id] = state
                planning_load = dict(load)
                progress = self._pauses.get(load_id, {})
                owner = self._owned.get(load_id)
                learning_for_plan = dict(learning.get(load_id) or {})
                configured_duration = max(
                    5.0, number(load.get("duration_min"), 60.0) or 60.0
                )
                learned_duration = number(learning_for_plan.get("duration_min"))
                if learned_duration is not None:
                    learning_for_plan["duration_min"] = min(
                        learned_duration, configured_duration * 3
                    )
                # Resolve the new deadline before consuming stored progress.
                # Completed/progress latches from yesterday must never shorten
                # today's required runtime.
                base_plan = build_load_plan(
                    rows,
                    planning_load,
                    now=now,
                    ready=bool(state.get("ready")),
                    running=bool(state.get("running")),
                    learned=learning_for_plan,
                    capacity_limit_w=planning_capacity_limit,
                )
                if (
                    progress
                    and progress.get("kind") != "manual_recovery"
                    and str(load.get("mode") or "smart") != "run_now"
                    and progress.get("deadline") != base_plan.get("deadline")
                ):
                    self._pauses.pop(load_id, None)
                    progress = {}
                stored_completed = max(
                    0.0, number(progress.get("completed_min"), 0.0) or 0.0
                )
                live_completed = stored_completed
                if (
                    owner
                    and bool(owner.get("interruptible", False))
                    and state.get("running")
                ):
                    before = max(
                        stored_completed,
                        number(owner.get("progress_before_min"), 0.0) or 0.0,
                    )
                    live_completed = before + max(
                        0.0,
                        (number(owner.get("observed_runtime_seconds"), 0.0) or 0.0)
                        / 60,
                    )
                required_duration = max(
                    5.0,
                    configured_duration,
                    number(learning_for_plan.get("duration_min"), 0.0) or 0.0,
                )
                if live_completed > 0:
                    planning_load["remaining_duration_min"] = max(
                        0.25, required_duration - live_completed
                    )
                    plan = build_load_plan(
                        rows,
                        planning_load,
                        now=now,
                        ready=bool(state.get("ready")),
                        running=bool(state.get("running")),
                        learned=learning_for_plan,
                        capacity_limit_w=planning_capacity_limit,
                    )
                else:
                    plan = base_plan
                plan["completed_duration_min"] = max(0.0, live_completed)
                if owner and not bool(owner.get("interruptible", False)):
                    forecast_end = timestamp(owner.get("expected_end")) or now
                    forecast_end = max(forecast_end, now + timedelta(minutes=15))
                    plan.update(
                        {
                            "status": "running",
                            "reason": "Non-interruptible cycle is still running",
                            "active": True,
                            "power_w": round(
                                number(
                                    owner.get("expected_power_w"), load.get("power_w")
                                )
                                or 0.0
                            ),
                            "segments": [
                                {
                                    "start": now.isoformat(),
                                    "end": forecast_end.isoformat(),
                                    "average_price": None,
                                    "predicted": True,
                                }
                            ],
                            "selected_starts": [now.astimezone(UTC).isoformat()],
                        }
                    )
                forecast_pause = self._pause_active(load, plan, state)
                if forecast_pause and owner is None:
                    # Execution latches are authoritative before the shared
                    # household forecast is reserved. A completed or blocked
                    # load must not consume capacity it will never dispatch.
                    plan.update(
                        {
                            "status": str(forecast_pause.get("kind") or "paused"),
                            "reason": str(
                                forecast_pause.get("reason") or "Load is paused"
                            ),
                            "active": False,
                            "segments": [],
                            "selected_starts": [],
                        }
                    )
                plans[load_id] = plan
                rows = reserve_plan(rows, plan, float(plan.get("power_w") or 0.0))

            reserved_running = (
                self._ev_dispatch_reservation_w()
                + self._battery_dispatch_reservation_w(now)
            )
            reservations = {
                str(load["id"]): self._owner_reservation_w(
                    load, self._owned.get(str(load["id"]))
                )
                for load in loads
            }
            reserved_running += sum(reservations.values())
            for load in loads:
                load_id = str(load["id"])
                plan = plans[load_id]
                previous_reservation = reservations.get(load_id, 0.0)
                execution, entries, run = await self._execute(
                    config,
                    load,
                    plan,
                    states[load_id],
                    now,
                    max(0.0, reserved_running - previous_reservation),
                    capacity_limit,
                )
                journal.extend(entries)
                current_reservation = self._owner_reservation_w(
                    load, self._owned.get(load_id)
                )
                reservations[load_id] = current_reservation
                reserved_running = max(
                    0.0,
                    reserved_running - previous_reservation + current_reservation,
                )
                if run:
                    completed.append(run)
                    self._learn(learning, run)
                plan["state"] = states[load_id]
                plan["execution"] = execution
                plan["guard"] = execution.get("guard", {})
                if pause := self._pauses.get(load_id):
                    plan["pause"] = dict(pause)

            store = self._store()
            if store:
                await store.async_set_smart_loads_runtime(
                    plans=plans,
                    learning=learning,
                    control_owners=self._owned,
                    control_pauses=self._pauses,
                    journal_entries=journal,
                    completed_runs=completed,
                    immediate=bool(journal or completed),
                )
                stored = store.get_smart_loads()
                history = list(reversed(stored.get("runs", [])[-100:]))
                decisions = list(reversed(stored.get("journal", [])[-100:]))
            else:
                history = list(reversed(completed))
                decisions = list(reversed(journal))
            return {
                "enabled": bool(config.get("enabled")),
                "execution_mode": str(config.get("execution_mode") or "advice"),
                "loads": loads,
                "plans": plans,
                "learning": learning,
                "runs": history,
                "journal": decisions,
                "capacity_limit_w": capacity_limit,
                "calculated_at": now.isoformat(),
            }

    async def async_shutdown(self) -> None:
        """Stop only loads Smart Loads owns while Home Assistant still works."""
        self._stopping = True
        async with self._cycle_lock:
            config = self._config()
            self._load_runtime(config)
            loads = {
                str(item.get("id") or ""): dict(item)
                for item in config.get("loads", [])
                if isinstance(item, dict)
            }
            completed: list[dict[str, Any]] = []
            for load_id, owner in list(self._owned.items()):
                if not bool(owner.get("interruptible", False)):
                    LOGGER.info(
                        "Leaving non-interruptible Smart Load %s running during shutdown",
                        load_id,
                    )
                    continue
                target = loads.get(load_id) or dict(owner.get("load_snapshot") or {})
                if not target:
                    LOGGER.error(
                        "Could not resolve Smart Load %s during shutdown", load_id
                    )
                    continue
                try:
                    stopped_at = dt_util.as_local(dt_util.utcnow())
                    _outcome, _entry, run = await self._stop(
                        target,
                        owner,
                        stopped_at,
                        result="shutdown",
                    )
                    if run:
                        self._record_stop_progress(
                            target,
                            {
                                "deadline": owner.get("deadline"),
                                "required_duration_min": owner.get(
                                    "required_duration_min", target.get("duration_min")
                                ),
                            },
                            owner,
                            run,
                            "shutdown",
                            stopped_at,
                        )
                        completed.append(run)
                except Exception:  # noqa: BLE001 - best-effort shutdown safety.
                    LOGGER.exception(
                        "Could not safely stop Smart Load %s during shutdown", load_id
                    )
            await self._persist_safety()
            store = self._store()
            if store and completed:
                await store.async_set_smart_loads_runtime(
                    completed_runs=completed,
                    immediate=True,
                )
        await super().async_shutdown()
