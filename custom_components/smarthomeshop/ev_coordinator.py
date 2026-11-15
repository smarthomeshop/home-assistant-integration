"""Native Smart EV planning, learning and guarded charger execution."""

from __future__ import annotations

import asyncio
import copy
import json
import re
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from math import floor
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .const import DOMAIN, LOGGER
from .energy_guard import (
    battery_power_measurement,
    current_battery_power_w,
    energy_dispatch_lock,
    fuse_headroom_measurement,
    grid_measurement,
    solar_power_w,
)
from .energy_intelligence import load_series_from_profile
from .ev_planner import number, plan_household, timestamp
from .smart_load_planner import planned_power_series

_INVALID_STATES = {"", "none", "unknown", "unavailable"}
_VERIFY_TIMEOUT = 8
_SERVICE_TIMEOUT = 10
_CHARGE_FEEDBACK_TIMEOUT = 180
_CALENDAR_TIMEOUT = 5
_CALENDAR_CACHE_SECONDS = 600
_FAILED_START_RETRY_SECONDS = 300
_SAFETY_EFFECT_TIMEOUT = 120
_SAFETY_POWER_TOLERANCE_W = 500
_START_HYSTERESIS_W = 500
_GUARD_STOP_COOLDOWN_SECONDS = 300
_BATTERY_DISCHARGE_THRESHOLD_W = 250
_BATTERY_PLAN_MAX_AGE_SECONDS = 900


class _IntentCancelled(Exception):
    """Internal signal for a command invalidated by changed settings."""


class _SafetyBlocked(Exception):
    """Internal signal for live safety becoming stricter during a command."""

    def __init__(self, message: str, *, control_error: bool = False) -> None:
        super().__init__(message)
        self.control_error = control_error


class _ExternalControl(Exception):
    """Internal signal for a user or other automation starting the charger."""


class _OwnershipPersistenceFailed(Exception):
    """Internal signal for a start aborted before any hardware write."""


class _ManualOverride(Exception):
    """Internal signal for an owned charger stopped during a transaction."""


def _state_value(hass: HomeAssistant, entity_id: str | None) -> str | None:
    if not entity_id:
        return None
    state = hass.states.get(entity_id)
    if state is None or str(state.state).lower() in _INVALID_STATES:
        return None
    return str(state.state)


def _state_number(hass: HomeAssistant, entity_id: str | None) -> float | None:
    return number(_state_value(hass, entity_id))


def _state_bool(
    hass: HomeAssistant,
    entity_id: str | None,
    *,
    default: bool | None = None,
) -> bool | None:
    value = _state_value(hass, entity_id)
    if value is None:
        return default
    normalised = value.lower()
    if normalised in {"on", "home", "connected", "charging", "true", "yes", "1"}:
        return True
    if normalised in {"off", "not_home", "disconnected", "false", "no", "0"}:
        return False
    return default


def _minimum_controllable_power_w(
    config: dict[str, Any], requested_power_w: float
) -> float:
    """Return the lowest safe power the configured charger can actually use."""
    kind = str(config.get("control_kind") or "switch")
    if kind != "number":
        # A switch or mode select cannot modulate. It may only start when the
        # full planned charging power fits inside the live grid headroom.
        return requested_power_w
    phases = max(1.0, min(3.0, float(config.get("phases") or 3)))
    voltage = max(100.0, float(config.get("voltage") or 230))
    minimum_current = max(0.0, float(config.get("min_current_a") or 6))
    return max(100.0, phases * voltage * minimum_current)


def _select_option(config: dict[str, Any], key: str, default: str) -> str:
    """Use a legacy default only when an option key is genuinely absent."""
    raw = config[key] if key in config else default  # noqa: SIM401
    return str(raw if raw is not None else "").strip()


def _defer_to_active_shared_control(
    config: dict[str, Any],
    plan: dict[str, Any],
    execution_mode: str,
    active_controls: set[str],
) -> bool:
    """Return whether this inactive plan shares an actively used control."""
    control_entity = str(config.get("control_entity") or "")
    return (
        execution_mode == "automatic"
        and bool(control_entity)
        and control_entity in active_controls
        and plan.get("action") != "charge"
    )


async def _calendar_rule(
    hass: HomeAssistant, config: dict[str, Any], now: datetime
) -> tuple[datetime | None, float | None]:
    """Find the earliest matching calendar event in the planning horizon."""
    entity_id = config.get("calendar_entity")
    state = hass.states.get(entity_id) if entity_id else None
    if state is None:
        return None, None
    keyword = str(config.get("calendar_keyword") or "charge").strip().lower()
    events: list[dict[str, Any]] = []
    if hass.services.has_service("calendar", "get_events"):
        try:
            async with asyncio.timeout(_CALENDAR_TIMEOUT):
                response = await hass.services.async_call(
                    "calendar",
                    "get_events",
                    {
                        "entity_id": entity_id,
                        "start_date_time": now.isoformat(),
                        "end_date_time": (now + timedelta(days=8)).isoformat(),
                    },
                    blocking=True,
                    return_response=True,
                )
            bucket = (response or {}).get(entity_id, {})
            events = list(bucket.get("events", [])) if isinstance(bucket, dict) else []
        except Exception:  # noqa: BLE001  # Older calendar platforms may not respond.
            events = []
    if not events:
        events = [dict(state.attributes)]

    matches: list[tuple[datetime, float | None]] = []
    for event in events:
        summary = str(event.get("summary") or event.get("message") or "")
        if keyword and keyword not in summary.lower():
            continue
        start = timestamp(
            event.get("start")
            or event.get("start_time")
            or event.get("end")
            or event.get("end_time"),
            naive_tz=dt_util.DEFAULT_TIME_ZONE,
        )
        if start is None or start.astimezone(UTC) <= now.astimezone(UTC):
            continue
        match = re.search(r"(?<!\d)(100|[1-9]?\d)\s*%", summary)
        target = float(match.group(1)) if match else None
        matches.append((start.astimezone(now.tzinfo), target))
    return (
        min(matches, key=lambda item: item[0].astimezone(UTC))
        if matches
        else (None, None)
    )


class SmartEVCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Plan all cars together and, when enabled, control their chargers."""

    def __init__(self, hass: HomeAssistant, prices: Any) -> None:
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_smart_ev",
            update_interval=timedelta(minutes=1),
        )
        self.prices = prices
        self._command_locks: dict[str, asyncio.Lock] = {}
        self._cycle_lock = asyncio.Lock()
        self._last_actions: dict[str, str] = {}
        self._failed_intents: dict[str, tuple[str, datetime]] = {}
        self._guard_stopped_at: dict[str, datetime] = {}
        self._owned_controls: dict[str, dict[str, Any]] = {}
        self._control_pauses: dict[str, dict[str, Any]] = {}
        self._calendar_cache: dict[
            tuple[str, str], tuple[datetime, tuple[datetime | None, float | None]]
        ] = {}
        self._stopping = False
        self._last_runtime_fingerprint = ""
        self._reconcile_failures: set[str] = set()
        self._reconcile_failed_vehicles: set[str] = set()
        # A provisional claim has not reached the hardware yet. If clearing
        # such an unsent claim from storage fails, never hydrate it back into
        # this running coordinator and retry the cleanup on the next successful
        # runtime write. A dispatching claim is different: the service call may
        # already have reached the charger and therefore retains stop ownership.
        self._abandoned_control_owners: set[str] = set()
        # A confirmed stop can precede the durable runtime write that removes
        # its owner. Keep that fact in memory so a one-off storage failure can
        # never turn Smart EV's own stop into a manual-override pause.
        self._confirmed_stopped_controls: set[str] = set()

    def _store(self) -> Any:
        return getattr(self.hass, "data", {}).get(DOMAIN, {}).get("store")

    def _config(self) -> dict[str, Any]:
        store = self._store()
        return store.get_smart_ev() if store else {}

    def _price_rows(self) -> list[dict[str, Any]]:
        """Keep supplier resolution and add predicted rows only after confirmed data."""
        confirmed = list(self.prices.today()) + list(self.prices.tomorrow())
        forecast = list(self.prices.forecast())
        used = {str(item.get("start")) for item in confirmed}
        return confirmed + [
            item for item in forecast if str(item.get("start")) not in used
        ]

    async def _calendar_rules(
        self, vehicles: list[dict[str, Any]], now: datetime
    ) -> dict[str, tuple[datetime | None, float | None, str, str]]:
        """Fetch calendar rules concurrently, outside the command-cycle lock."""
        current = dt_util.utcnow()

        async def one(
            vehicle: dict[str, Any],
        ) -> tuple[str, tuple[datetime | None, float | None, str, str]]:
            vehicle_id = str(vehicle.get("id") or "")
            entity_id = str(vehicle.get("calendar_entity") or "")
            keyword = str(vehicle.get("calendar_keyword") or "charge").lower()
            key = (entity_id, keyword)
            cached = self._calendar_cache.get(key)
            if (
                cached
                and (current - cached[0]).total_seconds() < _CALENDAR_CACHE_SECONDS
            ):
                return vehicle_id, (*cached[1], entity_id, keyword)
            result = await _calendar_rule(self.hass, vehicle, now)
            self._calendar_cache[key] = (current, result)
            return vehicle_id, (*result, entity_id, keyword)

        rows = await asyncio.gather(*(one(vehicle) for vehicle in vehicles))
        return dict(rows)

    def _solar_series(self, starts: list[str]) -> list[float]:
        forecast = self.hass.data.get(DOMAIN, {}).get("solar_forecast")
        values = forecast.series(starts) if forecast is not None else None
        if values is not None:
            return values
        store = self._store()
        sources = store.get_energy_sources() if store else {}
        live = _state_number(self.hass, sources.get("solar_power")) or 0.0
        state = (
            self.hass.states.get(sources.get("solar_power"))
            if sources.get("solar_power")
            else None
        )
        if (
            state
            and str(state.attributes.get("unit_of_measurement") or "W").lower() == "w"
        ):
            live /= 1000
        if sources.get("solar_invert"):
            live *= -1
        return [max(0.0, live)] * len(starts)

    def _load_series(self, starts: list[str]) -> list[float]:
        """Use the local learned household profile, falling back to live load."""
        store = self._store()
        model = store.get_energy_learning().get("model", {}) if store else {}
        profile = (model.get("use") or {}).get("load_profile", {})
        learned = load_series_from_profile(
            profile, starts, local_timezone=dt_util.DEFAULT_TIME_ZONE
        )
        if learned is not None:
            return learned

        # Derive the household's base demand from the power balance.  Raw grid
        # import contains the EV itself, and using that value directly creates
        # a feedback loop where Smart EV repeatedly starts and stops charging.
        grid = grid_measurement(self.hass)
        solar = float(solar_power_w(self.hass) or 0.0)
        battery = float(current_battery_power_w(self.hass) or 0.0)
        ev_power = 0.0
        seen: set[str] = set()
        now = datetime.now(UTC)
        for vehicle in self._config().get("vehicles", []):
            entity_id = str(vehicle.get("power_entity") or "")
            if not entity_id or entity_id in seen:
                continue
            seen.add(entity_id)
            state = self.hass.states.get(entity_id)
            value = self._power_w(entity_id)
            if state is None or value is None:
                continue
            reported = max(
                state.last_updated,
                getattr(state, "last_reported", state.last_updated),
            )
            if (now - reported).total_seconds() <= 90:
                ev_power += max(0.0, value)
        # Smart Loads are flexible demand too. Remove their fresh live power
        # from base demand so a running appliance is not reserved twice.
        smart_load_power = 0.0
        store = self._store()
        loads_config = getattr(store, "get_smart_loads", dict)() if store else {}
        for load in loads_config.get("loads", []):
            entity_id = str(load.get("power_entity") or "")
            if not entity_id or entity_id in seen:
                continue
            seen.add(entity_id)
            state = self.hass.states.get(entity_id)
            value = self._power_w(entity_id)
            if state is None or value is None:
                continue
            reported = max(
                state.last_updated,
                getattr(state, "last_reported", state.last_updated),
            )
            if (now - reported).total_seconds() <= 90:
                smart_load_power += max(0.0, value)
        live_kw = max(
            0.0,
            (
                float(grid.get("power_w") or 0.0)
                + solar
                - battery
                - ev_power
                - smart_load_power
            )
            / 1000,
        )
        return [live_kw] * len(starts)

    def _battery_targets(self, rows: list[dict[str, Any]]) -> list[float]:
        """Map battery power to every overlapping EV price interval.

        Battery timelines may use hourly periods while the supplier exposes
        quarter-hour prices, and the active battery period may be clipped to
        ``now``. Matching only identical start strings therefore missed most
        discharge windows. A negative overlap wins conservatively because EV
        charging must not be planned in any part of a protected discharge
        period. Positive overlaps use the highest requested charging power.
        """
        battery = self.hass.data.get(DOMAIN, {}).get("battery_plan")
        timeline = (battery.data or {}).get("timeline", []) if battery else []
        periods: list[tuple[datetime, datetime, float]] = []
        for item in timeline:
            start = timestamp(item.get("start"))
            end = timestamp(item.get("end"))
            if start is None or end is None or end <= start:
                continue
            periods.append(
                (
                    start.astimezone(UTC),
                    end.astimezone(UTC),
                    float(number(item.get("power_w"), 0.0) or 0.0),
                )
            )

        result: list[float] = []
        parsed_starts = [timestamp(row.get("start")) for row in rows]
        ordered_starts = sorted(start for start in parsed_starts if start is not None)
        for row_start, row in zip(parsed_starts, rows, strict=True):
            if row_start is None:
                result.append(0.0)
                continue
            row_end = timestamp(row.get("end"))
            if row_end is None:
                next_start = next(
                    (start for start in ordered_starts if start > row_start), None
                )
                if next_start is not None:
                    row_end = next_start
                else:
                    resolution = str(
                        row.get("resolution") or row.get("source_resolution") or ""
                    )
                    row_end = row_start + (
                        timedelta(minutes=15)
                        if "quarter" in resolution
                        else timedelta(hours=1)
                    )
            if row_end <= row_start:
                result.append(0.0)
                continue
            overlaps = [
                power
                for start, end, power in periods
                if start < row_end.astimezone(UTC) and end > row_start.astimezone(UTC)
            ]
            negative = [power for power in overlaps if power < 0]
            result.append(min(negative) if negative else max(overlaps, default=0.0))
        return result

    def _enriched_rows(self) -> list[dict[str, Any]]:
        rows = self._price_rows()
        starts = [str(item.get("start") or "") for item in rows]
        solar = self._solar_series(starts)
        load = self._load_series(starts)
        battery = self._battery_targets(rows)
        smart_loads = self.hass.data.get(DOMAIN, {}).get("smart_loads")
        load_plans = (smart_loads.data or {}).get("plans", {}) if smart_loads else {}
        smart_load_reserved = planned_power_series(rows, load_plans)
        return [
            {
                **item,
                "solar_kw": solar[index],
                "load_kw": load[index] + smart_load_reserved[index] / 1000,
                "battery_target_w": battery[index],
                "smart_load_reserved_w": smart_load_reserved[index],
            }
            for index, item in enumerate(rows)
        ]

    def _vehicle_state(self, config: dict[str, Any]) -> dict[str, Any]:
        soc_entity = config.get("soc_entity")
        # A reliable state of charge is required for every plan.  The charger
        # control itself is deliberately optional in advice and shadow mode;
        # automatic mode reports it as unavailable when it is actually needed.
        soc = _state_number(self.hass, soc_entity)
        plugged_entity = config.get("plugged_entity")
        home_entity = config.get("home_entity")
        charging_entity = config.get("charging_entity")
        plugged = _state_bool(
            self.hass,
            plugged_entity,
            default=True if not plugged_entity else None,
        )
        home = _state_bool(
            self.hass,
            home_entity,
            default=True if not home_entity else None,
        )
        charging = _state_bool(
            self.hass,
            charging_entity,
            default=False if not charging_entity else None,
        )
        power_entity = config.get("power_entity")
        power_state = self.hass.states.get(power_entity) if power_entity else None
        power_w = self._power_w(power_entity)
        power_age: float | None = None
        if power_state is not None:
            reported_at = max(
                power_state.last_updated,
                getattr(power_state, "last_reported", power_state.last_updated),
            )
            power_age = max(0.0, (datetime.now(UTC) - reported_at).total_seconds())
        power_fresh = power_w is not None and power_age is not None and power_age <= 90
        missing = (
            not soc_entity
            or soc is None
            or not 0 <= soc <= 100
            or (bool(plugged_entity) and plugged is None)
            or (bool(home_entity) and home is None)
        )
        return {
            "soc": soc if soc is not None and 0 <= soc <= 100 else None,
            "target_soc": _state_number(self.hass, config.get("target_soc_entity")),
            "plugged": plugged,
            "home": home,
            "charging": charging,
            "power_w": power_w,
            "power_fresh": power_fresh,
            "power_age_seconds": round(power_age, 1) if power_age is not None else None,
            "control_state": _state_value(self.hass, config.get("control_entity")),
            "required_unavailable": missing,
        }

    def _power_w(self, entity_id: str | None) -> float | None:
        value = _state_number(self.hass, entity_id)
        if value is None:
            return None
        state = self.hass.states.get(entity_id) if entity_id else None
        unit = str(
            (state.attributes if state else {}).get("unit_of_measurement") or "W"
        ).lower()
        if unit == "kw":
            value *= 1000
        return value if unit in {"w", "kw", ""} else None

    def _learn(
        self,
        vehicles: list[dict[str, Any]],
        previous: dict[str, dict[str, Any]],
    ) -> dict[str, dict[str, Any]]:
        """Conservatively learn real power and percent/hour from live sessions."""
        learning = {str(key): dict(value) for key, value in previous.items()}
        now = dt_util.utcnow()
        for item in vehicles:
            config = item["config"]
            state = item["state"]
            vehicle_id = str(config.get("id"))
            current = dict(learning.get(vehicle_id, {}))
            power_w = number(state.get("power_w"))
            owner = (
                self._owned_controls.get(str(config.get("control_entity") or "")) or {}
            )
            expected_power_w = number(owner.get("expected_power_w"))
            requested_power_w = self._requested_power_w(config)
            limited_by_guard = bool(
                owner
                and expected_power_w is not None
                and expected_power_w
                < requested_power_w
                - max(_SAFETY_POWER_TOLERANCE_W, requested_power_w * 0.1)
            )
            if (
                not limited_by_guard
                and state.get("charging")
                and power_w
                and power_w > 100
            ):
                measured_kw = power_w / 1000
                old_power = number(current.get("charge_power_kw"))
                learned_power = round(
                    measured_kw
                    if old_power is None
                    else old_power * 0.8 + measured_kw * 0.2,
                    3,
                )
                if old_power is None or abs(learned_power - old_power) >= 0.05:
                    current["charge_power_kw"] = learned_power
            previous_sample = current.get("last_sample") or {}
            previous_at = timestamp(previous_sample.get("at"))
            previous_soc = number(previous_sample.get("soc"))
            soc = number(state.get("soc"))
            learned_sample = False
            sample_expired = False
            if (
                not limited_by_guard
                and state.get("charging")
                and previous_at is not None
                and previous_soc is not None
                and soc is not None
                and soc > previous_soc
            ):
                hours = (now - previous_at).total_seconds() / 3600
                sample_expired = hours > 3
                if 0.08 <= hours <= 3:
                    speed = (soc - previous_soc) / hours
                    if 0 < speed < 100:
                        old_speed = number(current.get("speed_pct_per_hour"))
                        current["speed_pct_per_hour"] = round(
                            speed
                            if old_speed is None
                            else old_speed * 0.8 + speed * 0.2,
                            3,
                        )
                        learned_sample = True
            charging = bool(state.get("charging"))
            was_charging = bool(current.get("was_charging"))
            if (
                previous_at is None
                or learned_sample
                or sample_expired
                or limited_by_guard
                or charging != was_charging
                or (soc is not None and previous_soc is not None and soc < previous_soc)
            ):
                current["last_sample"] = {"at": now.isoformat(), "soc": soc}
            current["was_charging"] = charging
            learning[vehicle_id] = current
        return learning

    def _requested_power_w(self, config: dict[str, Any]) -> float:
        """Return the vehicle's configured full charging power in watts."""
        requested = float(config.get("charge_power_kw") or 0.0) * 1000
        if requested <= 0:
            amps = float(config.get("max_current_a") or 16)
            phases = max(1.0, min(3.0, float(config.get("phases") or 3)))
            requested = amps * phases * float(config.get("voltage") or 230)
        return requested

    def _vehicle_charge_block_reason(
        self,
        config: dict[str, Any],
        state: dict[str, Any],
        target_soc: float | None = None,
    ) -> str | None:
        """Return a live vehicle reason that makes energising unsafe."""
        if state.get("required_unavailable"):
            return "A required vehicle state is unavailable"
        if state.get("home") is False:
            return "The vehicle is not at home"
        if state.get("plugged") is False:
            return "The charging cable is not connected"
        soc = number(state.get("soc"))
        planned_target = number(target_soc)
        if planned_target is None:
            planned_target = number(config.get("target_soc"), 80.0)
        entity_target = number(state.get("target_soc"))
        target = (
            min(planned_target, entity_target)
            if planned_target is not None and entity_target is not None
            else entity_target
            if entity_target is not None
            else planned_target
        )
        if soc is not None and target is not None and soc >= target:
            return "The target charge level has been reached"
        return None

    def _guard(
        self,
        config: dict[str, Any],
        state: dict[str, Any],
        action: str,
        *,
        reserved_grid_w: float = 0.0,
        reserved_phase_w: float = 0.0,
        battery_data_fresh: bool = True,
        battery_discharging: bool = False,
        battery_reserved_grid_w: float = 0.0,
        battery_reserved_phase_w: float = 0.0,
        smart_load_reserved_w: float = 0.0,
        target_soc: float | None = None,
    ) -> dict[str, Any]:
        """Apply one shared-cycle grid and tightest-phase power budget."""
        # These two fields belong to the reservation ledger. They are accepted
        # explicitly because the same context is refreshed between hardware
        # writes; only ``reserved_*`` participates in the actual budget.
        _ = (
            battery_reserved_grid_w,
            battery_reserved_phase_w,
            smart_load_reserved_w,
        )
        requested = self._requested_power_w(config)
        if action != "charge":
            return {"status": "inactive", "allowed_power_w": requested}
        unavailable_reason = self._vehicle_charge_block_reason(
            config, state, target_soc
        )
        if unavailable_reason:
            return {
                "status": "blocked",
                "allowed_power_w": 0.0,
                "reason": unavailable_reason,
            }
        # Home-battery support is an independent user preference, not part of
        # the optional P1 import/fuse guard. Keep enforcing it when the user
        # deliberately disables grid guarding.
        battery_support = bool(config.get("allow_home_battery_support", False))
        if not battery_data_fresh and (
            config.get("grid_guard", True) or not battery_support
        ):
            return {
                "status": "blocked",
                "allowed_power_w": 0.0,
                "reason": "Automatic battery power data is unavailable or stale",
            }
        if battery_discharging and not battery_support:
            return {
                "status": "blocked",
                "allowed_power_w": 0.0,
                "reason": (
                    "Home-battery discharge is active while battery support is disabled"
                ),
            }
        if not config.get("grid_guard", True):
            return {"status": "inactive", "allowed_power_w": requested}
        grid = grid_measurement(self.hass, config)
        fuse = fuse_headroom_measurement(self.hass, config)
        if not grid.get("fresh"):
            return {
                "status": "blocked",
                "allowed_power_w": 0.0,
                "reason": "The live P1 measurement is unavailable or stale",
                "grid": grid,
                "fuse": fuse,
            }
        if not fuse.get("entity_id") or not fuse.get("fresh"):
            return {
                "status": "blocked",
                "allowed_power_w": 0.0,
                "reason": ("The P1 main-fuse phase headroom is unavailable or stale"),
                "grid": grid,
                "fuse": fuse,
            }
        configured_phases = max(1, min(3, int(float(config.get("phases") or 3))))
        observed_phases = int(fuse.get("phase_count") or 0)
        if configured_phases > observed_phases:
            return {
                "status": "blocked",
                "allowed_power_w": 0.0,
                "reason": (
                    "The charger phase setting exceeds the currently confirmed "
                    "P1 phase coverage"
                ),
                "grid": grid,
                "fuse": fuse,
            }
        if not config.get("power_entity") or not state.get("power_fresh"):
            return {
                "status": "blocked",
                "allowed_power_w": 0.0,
                "reason": "The vehicle charging-power measurement is unavailable or stale",
                "grid": grid,
                "fuse": fuse,
            }
        current = max(0.0, float(state.get("power_w") or 0.0))
        control_kind = str(config.get("control_kind") or "switch")
        if control_kind in {"switch", "select"} and current > requested + max(
            _SAFETY_POWER_TOLERANCE_W, requested * 0.1
        ):
            return {
                "status": "blocked",
                "allowed_power_w": 0.0,
                "reason": "Measured charging power exceeds the configured charger power",
                "grid": grid,
                "fuse": fuse,
            }
        configured_margin = number(config.get("grid_safety_margin_w"), 250.0)
        margin = max(
            0.0, float(250.0 if configured_margin is None else configured_margin)
        )
        entity_id = str(config.get("control_entity") or "")
        owner = getattr(self, "_owned_controls", {}).get(entity_id) or {}
        starting = current <= 100 and not owner
        if starting:
            margin += _START_HYSTERESIS_W
        limit = number(config.get("grid_import_limit_w"))
        allowed = requested
        reasons: list[str] = []
        if limit is not None:
            additional_grid = limit - float(grid["power_w"]) - margin - reserved_grid_w
            # The P1 value already contains the current EV load.  Adding the
            # measured EV power back yields the maximum *total* EV target.
            # Keep a negative headroom value so an existing overload causes a
            # real reduction instead of preserving the previous setpoint.
            allowed = max(0.0, min(allowed, current + additional_grid))
            if allowed < requested:
                reasons.append("grid import limit")
        phases = max(1.0, min(3.0, float(config.get("phases") or 3)))
        phase_margin = margin / phases
        additional_phase = (
            float(fuse.get("power_w") or 0.0) - phase_margin - reserved_phase_w
        )
        allowed = max(0.0, min(allowed, current + additional_phase * phases))
        if allowed < requested:
            reasons.append("main-fuse phase headroom")
        controllable_floor = _minimum_controllable_power_w(config, requested)
        if control_kind == "number":
            minimum, _maximum, _step = self._number_limits(
                str(config.get("control_entity") or "")
            )
            phases = max(1.0, min(3.0, float(config.get("phases") or 3)))
            voltage = max(100.0, float(config.get("voltage") or 230))
            controllable_floor = max(controllable_floor, minimum * phases * voltage)
        if allowed + 1 < controllable_floor:
            allowed = 0.0
            reasons.append("charger control cannot safely use the available headroom")
        return {
            "status": "blocked"
            if allowed < 100
            else "limited"
            if allowed < requested - 1
            else "safe",
            "requested_power_w": round(requested),
            "allowed_power_w": round(allowed),
            "reason": ", ".join(dict.fromkeys(reasons))
            or "Live grid limits allow charging",
            "grid": grid,
            "fuse": fuse,
        }

    def _desired_control(
        self,
        config: dict[str, Any],
        action: str,
        guard: dict[str, Any],
    ) -> tuple[str, Any]:
        kind = str(config.get("control_kind") or "switch")
        allowed = max(0.0, float(guard.get("allowed_power_w") or 0.0))
        if action != "charge" or allowed < 100:
            if kind == "select":
                return "select", _select_option(config, "pause_option", "Off")
            if kind == "number":
                desired = float(config.get("off_current_a") or 0.0)
                return "number", self._normalise_number_setpoint(
                    str(config.get("control_entity") or ""), desired
                )
            return "switch", False
        if kind == "select":
            return "select", _select_option(config, "charge_option", "Charge")
        if kind == "number":
            phases = max(1.0, min(3.0, float(config.get("phases") or 3)))
            voltage = max(100.0, float(config.get("voltage") or 230))
            amps = allowed / phases / voltage
            minimum = max(0.0, float(config.get("min_current_a") or 6))
            maximum = max(minimum, float(config.get("max_current_a") or 16))
            return "number", self._normalise_number_setpoint(
                str(config.get("control_entity") or ""),
                max(minimum, min(maximum, amps)),
                round_down=True,
            )
        return "switch", True

    def _number_limits(self, entity_id: str) -> tuple[float, float, float]:
        """Return finite Home Assistant number min/max/step metadata."""
        state = self.hass.states.get(entity_id)
        attributes = state.attributes if state else {}
        minimum = float(number(attributes.get("min"), 0.0) or 0.0)
        maximum = float(number(attributes.get("max"), 80.0) or 80.0)
        step = max(0.01, float(number(attributes.get("step"), 0.1) or 0.1))
        return minimum, max(minimum, maximum), step

    def _normalise_number_setpoint(
        self, entity_id: str, value: float, *, round_down: bool = False
    ) -> float:
        """Clamp a current setpoint and never round a safety limit upwards."""
        minimum, maximum, step = self._number_limits(entity_id)
        clamped = max(minimum, min(maximum, value))
        units = (clamped - minimum) / step
        snapped = floor(units + 1e-9) if round_down else round(units)
        return round(minimum + snapped * step, 6)

    def _number_can_stop(self, config: dict[str, Any]) -> bool:
        """Return whether a current controller has a real zero/disable route."""
        if config.get("stop_entity"):
            return _state_value(self.hass, str(config["stop_entity"])) is not None
        entity_id = str(config.get("control_entity") or "")
        if not entity_id:
            return False
        minimum, maximum, _step = self._number_limits(entity_id)
        off = float(config.get("off_current_a") or 0.0)
        return minimum <= off <= maximum and abs(off) <= 0.01

    def _control_targets(
        self, config: dict[str, Any], action: str, guard: dict[str, Any]
    ) -> list[tuple[str, str, Any]]:
        """Build an ordered, fully verifiable control transaction."""
        entity_id = str(config.get("control_entity") or "")
        if str(config.get("control_kind") or "switch") == "select":
            charge_option = _select_option(config, "charge_option", "Charge")
            pause_option = _select_option(config, "pause_option", "Off")
            if not pause_option or charge_option == pause_option:
                raise ValueError(
                    "Automatic select control needs different charge and pause options"
                )
            if action == "charge":
                error = self._select_charge_route_error(config)
                if error:
                    raise ValueError(error)
        kind, desired = self._desired_control(config, action, guard)
        if kind != "number":
            return [(entity_id, kind, desired)]
        stop_entity = str(config.get("stop_entity") or "")
        if action != "charge" and not self._number_can_stop(config):
            raise ValueError(
                "Automatic current control needs a real 0 A value or a separate stop switch"
            )
        if action != "charge":
            return (
                [(stop_entity, "switch", False)]
                if stop_entity
                else [(entity_id, "number", desired)]
            )
        current_setpoint = _state_number(self.hass, entity_id)
        owner = self._owned_controls.get(entity_id) or {}
        strict_owned_reduction = bool(
            owner
            and current_setpoint is not None
            and float(desired) < current_setpoint - 0.01
        )
        targets = [(entity_id, "number", desired)]
        if stop_entity and _state_value(self.hass, stop_entity) is not None:
            targets.append((stop_entity, "switch", True))
        elif (
            not stop_entity
            and not self._number_can_stop(config)
            and not strict_owned_reduction
        ):
            raise ValueError(
                "Automatic current control needs a real 0 A value or a separate stop switch"
            )
        return targets

    def _select_charge_route_error(self, config: dict[str, Any]) -> str | None:
        """Return why a live select route cannot safely start and later stop."""
        entity_id = str(config.get("control_entity") or "")
        state = self.hass.states.get(entity_id)
        raw_options = (state.attributes if state else {}).get("options")
        options = (
            {str(item) for item in raw_options}
            if isinstance(raw_options, (list, tuple))
            else set()
        )
        charge_option = _select_option(config, "charge_option", "Charge")
        pause_option = _select_option(config, "pause_option", "Off")
        if (
            _state_value(self.hass, entity_id) is None
            or not charge_option
            or charge_option not in options
            or pause_option not in options
        ):
            return (
                "Automatic select control needs charge and pause options "
                "exposed by the entity"
            )
        return None

    def _energising_control_error(
        self,
        config: dict[str, Any],
        target_entity: str,
        kind: str,
        desired: Any,
        owner: dict[str, Any],
    ) -> str | None:
        """Recheck the live stop route at the final pre-service boundary."""
        control_entity = str(config.get("control_entity") or "")
        control_kind = str(config.get("control_kind") or "switch")
        if control_kind == "select":
            return self._select_charge_route_error(config)
        if _state_value(self.hass, target_entity) is None:
            if target_entity == str(config.get("stop_entity") or ""):
                return "The separate charger stop switch is unavailable"
            return "The charger control is unavailable"
        if control_kind != "number":
            return None
        stop_entity = str(config.get("stop_entity") or "")
        if stop_entity and _state_value(self.hass, stop_entity) is not None:
            return None
        current_setpoint = _state_number(self.hass, control_entity)
        strict_reduction = bool(
            owner
            and kind == "number"
            and current_setpoint is not None
            and float(desired) < current_setpoint - 0.01
        )
        if strict_reduction:
            return None
        if stop_entity:
            return "The separate charger stop switch is unavailable"
        if not self._number_can_stop(config):
            return (
                "Automatic current control needs a real 0 A value or a separate "
                "stop switch"
            )
        return None

    def _available_charge_targets(
        self,
        config: dict[str, Any],
        targets: list[tuple[str, str, Any]],
        owner: dict[str, Any],
    ) -> tuple[list[tuple[str, str, Any]], bool]:
        """Reject a current increase whenever its authoritative stop route is lost."""
        if str(config.get("control_kind") or "switch") != "number":
            return targets, False
        entity_id = str(config.get("control_entity") or "")
        current_setpoint = _state_number(self.hass, entity_id)
        requested_setpoint = float(targets[0][2])
        safety_reduction = bool(
            owner
            and current_setpoint is not None
            and requested_setpoint < current_setpoint - 0.01
        )
        stop_entity = str(config.get("stop_entity") or "")
        if stop_entity and _state_value(self.hass, stop_entity) is None:
            if not safety_reduction:
                raise ValueError("The separate charger stop switch is unavailable")
            return [targets[0]], True
        return targets, safety_reduction

    def _targets_match(self, targets: list[tuple[str, str, Any]]) -> bool:
        return all(
            self._control_matches(entity_id, kind, desired)
            for entity_id, kind, desired in targets
        )

    def _intent_authorised(self, expected: dict[str, Any], action: str) -> bool:
        """Reject stale commands after a user changes execution or vehicle mode."""
        if self._stopping:
            return False
        current = self._config()
        if not current.get("enabled") or current.get("execution_mode") != "automatic":
            return False
        vehicle_id = str(expected.get("id") or "")
        vehicle = next(
            (
                item
                for item in current.get("vehicles", [])
                if str(item.get("id")) == vehicle_id
            ),
            None,
        )
        if not vehicle or not vehicle.get("enabled", True):
            return False
        if json.dumps(vehicle, sort_keys=True, default=str) != json.dumps(
            expected, sort_keys=True, default=str
        ):
            return False
        return not (
            action == "charge"
            and str(vehicle.get("mode") or "smart") in {"pause", "off"}
        )

    def _charging_feedback(
        self, config: dict[str, Any], state: dict[str, Any]
    ) -> dict[str, Any]:
        """Distinguish a confirmed setpoint from confirmed physical charging."""
        entity_id = str(config.get("control_entity") or "")
        owner = self._owned_controls.get(entity_id) or {}
        has_feedback = bool(config.get("charging_entity") or config.get("power_entity"))
        if state.get("charging") is True or float(state.get("power_w") or 0.0) > 100:
            return {"status": "following", "reason": "Charging feedback is active"}
        if not has_feedback:
            return {
                "status": "control_confirmed",
                "reason": "The charger confirmed its setpoint; physical charging feedback is not configured",
            }
        started = timestamp(owner.get("started_at"))
        if (
            started
            and (dt_util.utcnow() - started.astimezone(dt_util.UTC)).total_seconds()
            >= _CHARGE_FEEDBACK_TIMEOUT
        ):
            return {
                "status": "not_charging",
                "reason": "The charger accepted the command but no charging feedback appeared",
            }
        return {
            "status": "starting",
            "reason": "The charger confirmed its setpoint; waiting for charging feedback",
        }

    def _remember_owner(
        self,
        config: dict[str, Any],
        expected_power_w: float | None = None,
        *,
        ownership_state: str | None = None,
    ) -> None:
        entity_id = str(config.get("control_entity") or "")
        getattr(self, "_confirmed_stopped_controls", set()).discard(entity_id)
        previous = self._owned_controls.get(entity_id) or {}
        owner = {
            "vehicle_id": str(config.get("id") or ""),
            "started_at": previous.get("started_at") or dt_util.utcnow().isoformat(),
            "config": dict(config),
            "ownership_state": ownership_state
            or previous.get("ownership_state")
            or "confirmed",
        }
        for key in ("unmet_since", "rollback_until"):
            if key in previous:
                owner[key] = previous[key]
        if expected_power_w is not None:
            owner.update(
                expected_power_w=round(max(0.0, expected_power_w)),
                commanded_at=dt_util.utcnow().isoformat(),
            )
        else:
            for key in ("expected_power_w", "commanded_at"):
                if key in previous:
                    owner[key] = previous[key]
        self._owned_controls[entity_id] = owner

    def _owner_matches_config(self, config: dict[str, Any]) -> bool:
        entity_id = str(config.get("control_entity") or "")
        owner = self._owned_controls.get(entity_id) or {}
        return owner.get("vehicle_id") == str(config.get("id") or "") and all(
            str((owner.get("config") or {}).get(key) or "")
            == str(config.get(key) or "")
            for key in ("control_entity", "control_kind", "stop_entity")
        )

    @staticmethod
    def _owner_had_confirmed_session(owner: dict[str, Any]) -> bool:
        """Return whether manual-off detection is valid for this owner."""
        return bool(owner) and owner.get("ownership_state") not in {
            "provisional",
            "dispatching",
            "command_sent",
            "rollback_watch",
        }

    async def _persist_owners(self) -> None:
        """Durably record stop responsibility before energising hardware."""
        store = self._store()
        if store:
            await store.async_set_smart_ev_runtime(
                control_owners=self._owned_controls,
                control_pauses=getattr(self, "_control_pauses", {}),
                guard_stopped_at={
                    key: value.isoformat()
                    for key, value in self._guard_stopped_at.items()
                },
                immediate=True,
            )
        self._abandoned_control_owners.clear()
        getattr(self, "_confirmed_stopped_controls", set()).clear()

    async def _abandon_unsent_owner(self, entity_id: str) -> None:
        """Drop a never-sent claim and retain an in-memory cleanup tombstone."""
        self._owned_controls.pop(entity_id, None)
        self._abandoned_control_owners.add(entity_id)
        try:
            await self._persist_owners()
        except Exception:  # noqa: BLE001 - never re-claim or stop the external session.
            LOGGER.warning(
                "Could not clear unsent Smart EV ownership for %s; "
                "cleanup will be retried without rehydrating the claim",
                entity_id,
                exc_info=True,
            )

    async def _mark_guard_stop(self, entity_id: str) -> None:
        """Persist a bounded restart cooldown after a live guard stop."""
        if not entity_id:
            return
        self._guard_stopped_at[entity_id] = dt_util.utcnow()
        try:
            await self._persist_owners()
        except Exception:  # noqa: BLE001 - keep the in-memory cooldown and retry later.
            LOGGER.warning(
                "Could not persist the Smart EV safety cooldown for %s; "
                "the local cooldown remains active",
                entity_id,
                exc_info=True,
            )

    async def _record_guard_lockout(
        self,
        entity_id: str,
        config: dict[str, Any],
        kind: str,
        reason: str,
    ) -> None:
        """Record cooldown and persistent lockout before one atomic save attempt."""
        if not entity_id:
            return
        self._guard_stopped_at[entity_id] = dt_util.utcnow()
        self._control_pauses[entity_id] = {
            "vehicle_id": str(config.get("id") or ""),
            "kind": kind,
            "reason": reason,
            "signature": self._control_pause_signature(config),
            "at": dt_util.utcnow().isoformat(),
        }
        try:
            await self._persist_owners()
        except Exception:  # noqa: BLE001 - local lockout remains active and is retried.
            LOGGER.warning(
                "Could not persist the Smart EV %s lockout for %s; "
                "the local lockout remains active",
                kind,
                entity_id,
                exc_info=True,
            )

    @staticmethod
    def _hardware_fault_reason(reason: Any) -> bool:
        """Return whether a guard reason requires an explicit user reset."""
        return str(reason or "") in {
            "Measured charging power exceeds the configured charger power",
            (
                "The charger confirmed lower setpoints, but measured power "
                "remained above the safe limit"
            ),
        }

    async def _wait_target(self, entity_id: str, kind: str, desired: Any) -> bool:
        for _ in range(_VERIFY_TIMEOUT * 2):
            if self._control_matches(entity_id, kind, desired):
                return True
            await asyncio.sleep(0.5)
        return False

    async def _send_transaction(
        self,
        config: dict[str, Any],
        action: str,
        targets: list[tuple[str, str, Any]],
        *,
        expected_power_w: float | None = None,
        safety_check: Callable[[], Awaitable[None]] | None = None,
    ) -> None:
        """Send and confirm each step, persisting ownership before start."""
        control_entity = str(config.get("control_entity") or "")
        previous_owner = self._owned_controls.get(control_entity)
        if (previous_owner or {}).get("ownership_state") == "provisional":
            # Provisional means no hardware call was reached. Never carry such
            # an interrupted local claim into a retry or shared transfer.
            await self._abandon_unsent_owner(control_entity)
            previous_owner = None
        matching_owner = bool(previous_owner and self._owner_matches_config(config))
        owner_route_config = dict((previous_owner or {}).get("config") or config)
        owned_session_active = bool(
            action == "charge"
            and self._owner_had_confirmed_session(previous_owner or {})
            and self._control_route_active(owner_route_config) is True
        )
        # An existing matching owner was already durably recorded before its
        # original start. Reductions and setpoint changes must remain possible
        # when storage is temporarily unavailable.
        owner_persisted = action != "charge" or matching_owner
        for entity_id, kind, desired in targets:
            if not self._intent_authorised(config, action):
                raise _IntentCancelled
            energises = action == "charge" and (
                (kind == "switch" and bool(desired))
                or kind == "select"
                or (kind == "number" and float(desired) >= 1.0)
            )
            if (
                energises
                and owned_session_active
                and self._control_route_active(owner_route_config) is False
            ):
                raise _ManualOverride
            if energises and not owner_persisted:
                if previous_owner is None and self._new_claim_externally_active(config):
                    raise _ExternalControl
                # New or transferred ownership must be durable before the
                # first energising write. A matching owner was already stored
                # before the existing session started.
                ownership_state = (
                    "provisional"
                    if previous_owner is None
                    else str(previous_owner.get("ownership_state") or "confirmed")
                )
                if expected_power_w is None:
                    self._remember_owner(config, ownership_state=ownership_state)
                else:
                    self._remember_owner(
                        config,
                        expected_power_w,
                        ownership_state=ownership_state,
                    )
                try:
                    await self._persist_owners()
                except asyncio.CancelledError:
                    if previous_owner is None:
                        self._owned_controls.pop(control_entity, None)
                        self._abandoned_control_owners.add(control_entity)
                    else:
                        self._owned_controls[control_entity] = previous_owner
                    raise
                except Exception as err:
                    if previous_owner is None:
                        self._owned_controls.pop(control_entity, None)
                    else:
                        self._owned_controls[control_entity] = previous_owner
                    raise _OwnershipPersistenceFailed from err
                owner_persisted = True
                # Persistence is awaited and can race both an external start
                # and a settings change. External activity must win: an
                # invalidated provisional claim must never stop a session that
                # Smart EV did not start.
                if previous_owner is None and self._new_claim_externally_active(config):
                    await self._abandon_unsent_owner(control_entity)
                    raise _ExternalControl
                if not self._intent_authorised(config, action):
                    if previous_owner is None:
                        await self._abandon_unsent_owner(control_entity)
                    raise _IntentCancelled
            if energises and safety_check is not None:
                try:
                    await safety_check()
                except BaseException:
                    if (
                        previous_owner is None
                        and (self._owned_controls.get(control_entity) or {}).get(
                            "ownership_state"
                        )
                        == "provisional"
                    ):
                        await self._abandon_unsent_owner(control_entity)
                    raise
            current_owner = self._owned_controls.get(control_entity) or {}
            if (
                energises
                and previous_owner is None
                and current_owner.get("ownership_state") == "provisional"
            ):
                # Persist the point of no return before entering the Home
                # Assistant service call. A crash can happen after the charger
                # receives the command but before this coroutine resumes; a
                # restored dispatching claim must therefore retain stop duty.
                self._remember_owner(
                    config,
                    expected_power_w,
                    ownership_state="dispatching",
                )
                try:
                    await self._persist_owners()
                except asyncio.CancelledError:
                    self._owned_controls.pop(control_entity, None)
                    self._abandoned_control_owners.add(control_entity)
                    raise
                except Exception as err:
                    self._owned_controls.pop(control_entity, None)
                    self._abandoned_control_owners.add(control_entity)
                    raise _OwnershipPersistenceFailed from err
                # Persistence can yield long enough for an external start or a
                # settings change. We still know no command was sent by this
                # coroutine, so discard the unsent claim instead of taking over.
                if self._new_claim_externally_active(config):
                    await self._abandon_unsent_owner(control_entity)
                    raise _ExternalControl
                if not self._intent_authorised(config, action):
                    await self._abandon_unsent_owner(control_entity)
                    raise _IntentCancelled
                if safety_check is not None:
                    try:
                        # The durable dispatching write can be slow. This is
                        # the decisive live check at the last await boundary
                        # before an energising hardware service call.
                        await safety_check()
                    except BaseException:
                        await self._abandon_unsent_owner(control_entity)
                        raise
            if (
                energises
                and owned_session_active
                and self._control_route_active(owner_route_config) is False
            ):
                raise _ManualOverride
            if energises:
                current_claim = self._owned_controls.get(control_entity) or {}
                claim_is_unsent = previous_owner is None and str(
                    current_claim.get("ownership_state") or ""
                ) in {"provisional", "dispatching"}
                if previous_owner is None and self._new_claim_externally_active(config):
                    if claim_is_unsent:
                        await self._abandon_unsent_owner(control_entity)
                        raise _ExternalControl
                    # At least one earlier target has already been written. Keep
                    # the durable stop responsibility: external activity can no
                    # longer prove that this session was not started by us.
                    raise _SafetyBlocked(
                        "The charger became active while the command was being sent"
                    )
                control_error = self._energising_control_error(
                    config,
                    entity_id,
                    kind,
                    desired,
                    previous_owner or {},
                )
                if control_error:
                    if claim_is_unsent:
                        await self._abandon_unsent_owner(control_entity)
                    raise _SafetyBlocked(control_error, control_error=True)
            await self._send_control(entity_id, kind, desired)
            current_owner = self._owned_controls.get(control_entity) or {}
            if (
                action == "charge"
                and previous_owner is None
                and current_owner.get("ownership_state") == "dispatching"
            ):
                self._remember_owner(
                    config,
                    expected_power_w,
                    ownership_state="command_sent",
                )
                try:
                    await self._persist_owners()
                except Exception as err:
                    raise RuntimeError(
                        "Smart EV sent the charger command but could not save "
                        "the stop responsibility"
                    ) from err
            confirmed = await self._wait_target(entity_id, kind, desired)
            if (
                energises
                and owned_session_active
                and self._control_route_active(owner_route_config) is False
            ):
                raise _ManualOverride
            if not confirmed:
                raise RuntimeError("The charger did not confirm the requested state")
        if action == "charge" and self._owned_controls.get(control_entity):
            current_owner = self._owned_controls[control_entity]
            ownership_state = str(current_owner.get("ownership_state") or "confirmed")
            if ownership_state in {"dispatching", "command_sent"} and (
                self._control_route_active(dict(current_owner.get("config") or config))
                is True
            ):
                ownership_state = "confirmed"
            self._remember_owner(
                config,
                expected_power_w,
                ownership_state=ownership_state,
            )
            try:
                await self._persist_owners()
            except Exception:  # noqa: BLE001 - the existing durable stop route remains valid.
                LOGGER.warning(
                    "Smart EV could not update runtime ownership telemetry for %s",
                    control_entity,
                    exc_info=True,
                )

    def _safety_effect_failed(
        self,
        config: dict[str, Any],
        state: dict[str, Any],
        guard: dict[str, Any],
    ) -> bool:
        """Detect a confirmed setpoint that did not reduce physical power."""
        owner = self._owned_controls.get(str(config.get("control_entity") or "")) or {}
        if not owner:
            return False
        if guard.get("status") not in {"safe", "limited"}:
            owner.pop("unmet_since", None)
            return False
        allowed = min(
            float(owner.get("expected_power_w") or float("inf")),
            float(guard.get("allowed_power_w") or 0.0),
        )
        actual = max(0.0, float(state.get("power_w") or 0.0))
        tolerance = max(_SAFETY_POWER_TOLERANCE_W, allowed * 0.1)
        if actual <= allowed + tolerance:
            owner.pop("unmet_since", None)
            return False
        unmet_since = timestamp(owner.get("unmet_since"))
        if unmet_since is None:
            owner["unmet_since"] = dt_util.utcnow().isoformat()
            return False
        elapsed = (
            dt_util.utcnow() - unmet_since.astimezone(dt_util.UTC)
        ).total_seconds()
        return elapsed >= _SAFETY_EFFECT_TIMEOUT

    async def _reduce_number_to_minimum(self, config: dict[str, Any]) -> bool:
        """Strictly reduce current and report whether that confirms a full stop."""
        if str(config.get("control_kind") or "") != "number":
            return False
        entity_id = str(config.get("control_entity") or "")
        current = _state_number(self.hass, entity_id)
        if current is None:
            return False
        if self._control_route_active(config) is False:
            return True
        minimum, _maximum, _step = self._number_limits(entity_id)
        # A fallback used by a stop path must never raise the current. This also
        # covers restored dispatching claims whose old 0 A value is below a new
        # live minimum such as 6 A.
        if current <= minimum + 0.01:
            return False
        try:
            await self._send_control(entity_id, "number", minimum)
            confirmed = await self._wait_target(entity_id, "number", minimum)
            return confirmed and self._control_route_active(config) is False
        except Exception as err:  # noqa: BLE001 - retain ownership and retry later.
            LOGGER.debug(
                "Could not reduce unavailable-stop charger %s: %s",
                entity_id,
                err,
            )
            return False

    def _inactive_unconfirmed_stop_cannot_be_written(
        self, config: dict[str, Any]
    ) -> bool:
        """Return whether repeating an inactive number stop would raise current."""
        if str(config.get("control_kind") or "") != "number" or config.get(
            "stop_entity"
        ):
            return False
        entity_id = str(config.get("control_entity") or "")
        current = _state_number(self.hass, entity_id)
        if current is None or self._control_route_active(config) is not False:
            return False
        minimum, _maximum, _step = self._number_limits(entity_id)
        off = max(0.0, float(config.get("off_current_a") or 0.0))
        return minimum > off + 0.01 and current <= minimum + 0.01

    async def _drop_stopped_owner(
        self, entity_id: str, *, persist: bool = True
    ) -> bool:
        """Forget ownership only after a route is confirmed stopped or external."""
        stopped = getattr(self, "_confirmed_stopped_controls", None)
        if stopped is None:
            stopped = self._confirmed_stopped_controls = set()
        stopped.add(entity_id)
        previous_owner = self._owned_controls.pop(entity_id, None)
        if not persist:
            return True
        try:
            await self._persist_owners()
            return True
        except Exception:  # noqa: BLE001 - restore durable stop responsibility.
            if previous_owner is not None:
                previous_owner["stop_confirmed"] = True
                self._owned_controls[entity_id] = previous_owner
            return False

    async def _arm_rollback_watch(
        self,
        entity_id: str,
        config: dict[str, Any],
        *,
        persist: bool,
    ) -> bool:
        """Keep stop duty briefly after an uncertain start may arrive late."""
        owner = self._owned_controls.get(entity_id)
        if not owner:
            return False
        owner["config"] = dict(config)
        owner["ownership_state"] = "rollback_watch"
        owner["rollback_until"] = (
            dt_util.utcnow() + timedelta(seconds=_FAILED_START_RETRY_SECONDS)
        ).isoformat()
        owner.pop("stop_confirmed", None)
        if not persist:
            return True
        try:
            await self._persist_owners()
        except Exception:  # noqa: BLE001 - the earlier durable claim still retains stop duty.
            LOGGER.warning(
                "Smart EV confirmed the rollback for %s but could not persist "
                "its late-start watch; in-memory stop duty remains active",
                entity_id,
                exc_info=True,
            )
        return True

    async def _complete_confirmed_stop(
        self,
        entity_id: str,
        config: dict[str, Any],
        *,
        persist: bool,
        watch_late_start: bool,
    ) -> bool:
        """Finish a verified stop, optionally watching for a delayed start."""
        if watch_late_start:
            return await self._arm_rollback_watch(entity_id, config, persist=persist)
        return await self._drop_stopped_owner(entity_id, persist=persist)

    async def _finish_minimum_fallback(
        self,
        entity_id: str,
        config: dict[str, Any],
        *,
        persist: bool,
        watch_late_start: bool = False,
    ) -> bool:
        """Reduce without energising and release only after a confirmed real stop."""
        if not await self._reduce_number_to_minimum(config):
            return False
        if self._control_route_active(config) is not False:
            return False
        return await self._complete_confirmed_stop(
            entity_id,
            config,
            persist=persist,
            watch_late_start=watch_late_start,
        )

    def _select_is_external_mode(self, config: dict[str, Any]) -> bool:
        """Return whether an owned select was moved to a third-party mode."""
        if str(config.get("control_kind") or "") != "select":
            return False
        entity_id = str(config.get("control_entity") or "")
        current = _state_value(self.hass, entity_id)
        charge_option = _select_option(config, "charge_option", "Charge")
        pause_option = _select_option(config, "pause_option", "Off")
        return current is not None and current not in {charge_option, pause_option}

    async def _emergency_stop(
        self,
        config: dict[str, Any],
        *,
        persist: bool = True,
        watch_late_start: bool = False,
    ) -> bool:
        """Best-effort rollback used after a partially completed start."""
        entity_id = str(config.get("control_entity") or "")
        if self._select_is_external_mode(config):
            return await self._drop_stopped_owner(entity_id, persist=persist)
        if self._control_route_active(config) is False:
            owner = self._owned_controls.get(entity_id) or {}
            unconfirmed = not self._owner_had_confirmed_session(owner)
            if not (
                unconfirmed
                and not self._inactive_unconfirmed_stop_cannot_be_written(config)
            ):
                return await self._complete_confirmed_stop(
                    entity_id,
                    config,
                    persist=persist,
                    watch_late_start=watch_late_start,
                )
        if (
            str(config.get("control_kind") or "") == "number"
            and config.get("stop_entity")
            and _state_value(self.hass, str(config["stop_entity"])) is None
        ):
            return await self._finish_minimum_fallback(
                entity_id,
                config,
                persist=persist,
                watch_late_start=watch_late_start,
            )
        try:
            try:
                targets = self._control_targets(
                    config, "hold", {"status": "inactive", "allowed_power_w": 0.0}
                )
            except ValueError:
                return await self._finish_minimum_fallback(
                    entity_id,
                    config,
                    persist=persist,
                    watch_late_start=watch_late_start,
                )
            for target_entity, kind, desired in targets:
                try:
                    await self._send_control(target_entity, kind, desired)
                    confirmed = await self._wait_target(target_entity, kind, desired)
                except Exception:  # noqa: BLE001 - fallback and retain ownership.
                    return await self._finish_minimum_fallback(
                        entity_id,
                        config,
                        persist=persist,
                        watch_late_start=watch_late_start,
                    )
                if not confirmed:
                    return await self._finish_minimum_fallback(
                        entity_id,
                        config,
                        persist=persist,
                        watch_late_start=watch_late_start,
                    )
            if self._control_route_active(config) is not False:
                return await self._finish_minimum_fallback(
                    entity_id,
                    config,
                    persist=persist,
                    watch_late_start=watch_late_start,
                )
            return await self._complete_confirmed_stop(
                entity_id,
                config,
                persist=persist,
                watch_late_start=watch_late_start,
            )
        except Exception:  # noqa: BLE001 - retain ownership for a later safety retry.
            return False

    async def _release_owner(self, entity_id: str, *, persist: bool = True) -> bool:
        """Stop only a session that Smart EV previously started and owns."""
        owner = self._owned_controls.get(entity_id)
        config = dict((owner or {}).get("config") or {})
        if not owner or not config:
            return True
        if self._select_is_external_mode(config):
            return await self._drop_stopped_owner(entity_id, persist=persist)
        if self._control_route_active(config) is False:
            unconfirmed = not self._owner_had_confirmed_session(owner)
            if not (
                unconfirmed
                and not self._inactive_unconfirmed_stop_cannot_be_written(config)
            ):
                return await self._drop_stopped_owner(entity_id, persist=persist)
        guard = {"status": "inactive", "allowed_power_w": 0.0}
        if (
            str(config.get("control_kind") or "") == "number"
            and config.get("stop_entity")
            and _state_value(self.hass, str(config["stop_entity"])) is None
        ):
            # The authoritative stop route is temporarily unavailable. Reduce
            # to the number entity's real minimum when that route still works,
            # but retain ownership because this is not a confirmed stop.
            return await self._finish_minimum_fallback(
                entity_id, config, persist=persist
            )
        try:
            targets = self._control_targets(config, "hold", guard)
        except ValueError:
            return await self._finish_minimum_fallback(
                entity_id, config, persist=persist
            )
        lock = self._command_locks.setdefault(entity_id, asyncio.Lock())
        async with lock:
            try:
                for _attempt in range(2):
                    # A user can select a third mode while we wait for a stop
                    # confirmation. Never overwrite that external choice with
                    # a second retry.
                    if self._select_is_external_mode(config):
                        return await self._drop_stopped_owner(
                            entity_id, persist=persist
                        )
                    confirmed = True
                    for target_entity, kind, desired in targets:
                        try:
                            await self._send_control(target_entity, kind, desired)
                            target_confirmed = await self._wait_target(
                                target_entity, kind, desired
                            )
                        except Exception:  # noqa: BLE001 - retain stop duty.
                            return await self._finish_minimum_fallback(
                                entity_id, config, persist=persist
                            )
                        if not target_confirmed:
                            if self._select_is_external_mode(config):
                                return await self._drop_stopped_owner(
                                    entity_id, persist=persist
                                )
                            if await self._finish_minimum_fallback(
                                entity_id, config, persist=persist
                            ):
                                return True
                            confirmed = False
                            break
                    if confirmed:
                        if self._control_route_active(config) is not False:
                            return await self._finish_minimum_fallback(
                                entity_id, config, persist=persist
                            )
                        return await self._drop_stopped_owner(
                            entity_id, persist=persist
                        )
            except Exception:  # noqa: BLE001  # Keep ownership so a later cycle retries safely.
                return False
        return False

    def _control_pause_signature(self, config: dict[str, Any]) -> str:
        """Identify the explicit configuration that a pause belongs to."""
        return json.dumps(
            {
                key: config.get(key)
                for key in (
                    "id",
                    "enabled",
                    "mode",
                    "control_entity",
                    "control_kind",
                    "stop_entity",
                    "charge_option",
                    "pause_option",
                    "charge_power_kw",
                    "phases",
                    "voltage",
                    "min_current_a",
                    "max_current_a",
                    "off_current_a",
                    "power_entity",
                    "plugged_entity",
                    "home_entity",
                    "soc_entity",
                    "target_soc_entity",
                    "grid_guard",
                    "grid_import_limit_w",
                    "grid_safety_margin_w",
                    "allow_home_battery_support",
                )
            },
            sort_keys=True,
            default=str,
        )

    @staticmethod
    def _pause_config(
        owner: dict[str, Any], current_config: dict[str, Any]
    ) -> dict[str, Any]:
        """Use current settings for the same vehicle, but retain shared-owner data."""
        if str(owner.get("vehicle_id") or "") == str(current_config.get("id") or ""):
            return dict(current_config)
        return dict(owner.get("config") or current_config)

    async def _active_control_pause(
        self, config: dict[str, Any], state: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Return a matching persistent pause, clearing it after explicit change."""
        entity_id = str(config.get("control_entity") or "")
        pauses = getattr(self, "_control_pauses", {})
        pause = pauses.get(entity_id)
        if not pause:
            return None
        pause_vehicle = str(pause.get("vehicle_id") or "")
        current_vehicle = str(config.get("id") or "")
        # A second vehicle sharing this charger must respect the first
        # vehicle's manual/safety lockout and may never clear it.
        if pause_vehicle and pause_vehicle != current_vehicle:
            return pause
        if pause.get("kind") == "battery" and config.get(
            "allow_home_battery_support", False
        ):
            pauses.pop(entity_id, None)
            await self._persist_owners()
            return None
        still_matches = (
            pause.get("signature") == self._control_pause_signature(config)
            and state.get("plugged") is not False
        )
        if still_matches:
            return pause
        pauses.pop(entity_id, None)
        await self._persist_owners()
        return None

    @staticmethod
    def _guard_pause_kind(reason: Any) -> str | None:
        """Return the persistent pause type required by a guard stop."""
        text = str(reason or "")
        if SmartEVCoordinator._hardware_fault_reason(text):
            return "safety"
        if text == (
            "Home-battery discharge is active while battery support is disabled"
        ):
            return "battery"
        return None

    async def _forget_inactive_owner(
        self, entity_id: str, config: dict[str, Any]
    ) -> bool:
        """Relinquish ownership after a user manually stopped the charger."""
        previous = self._owned_controls.pop(entity_id, None)
        pause_config = self._pause_config(previous or {}, config)
        pause_vehicle_id = str(
            (previous or {}).get("vehicle_id") or pause_config.get("id") or ""
        )
        pauses = getattr(self, "_control_pauses", None)
        if pauses is None:
            pauses = self._control_pauses = {}
        pause = {
            "vehicle_id": pause_vehicle_id,
            "kind": "manual",
            "reason": (
                "The charger was stopped outside Smart EV; automatic restart "
                "requires an explicit mode or configuration change"
            ),
            "signature": self._control_pause_signature(pause_config),
            "at": dt_util.utcnow().isoformat(),
        }
        previous_pause = pauses.get(entity_id)
        pauses[entity_id] = pause
        try:
            await self._persist_owners()
            return True
        except Exception:  # noqa: BLE001 - keep stop responsibility on disk failure.
            if previous is not None:
                self._owned_controls[entity_id] = previous
            if previous_pause is None:
                pauses.pop(entity_id, None)
            else:
                pauses[entity_id] = previous_pause
            return False

    def _control_route_active(self, config: dict[str, Any]) -> bool | None:
        """Read the authoritative charger route independently from feedback."""
        entity_id = str(config.get("control_entity") or "")
        current = _state_value(self.hass, entity_id)
        kind = str(config.get("control_kind") or "switch")
        if kind == "switch":
            return None if current is None else current == "on"
        if kind == "select":
            return (
                None
                if current is None
                else current == _select_option(config, "charge_option", "Charge")
            )
        stop_entity = str(config.get("stop_entity") or "")
        if stop_entity:
            stop = _state_value(self.hass, stop_entity)
            if stop == "off":
                return False
            if stop == "on":
                value = number(current)
                return True if value is None else value > 0.01
            return None
        if current is None:
            return None
        value = number(current)
        if value is None:
            return None
        # A number-only route has no independent hardware stop confirmation.
        # Only a real zero can prove it is inactive; a configured positive
        # "off" value may still be actively charging.
        return value > 0.01

    def _control_is_active(self, config: dict[str, Any], state: dict[str, Any]) -> bool:
        """Return whether an unowned charger appears externally active."""
        route_active = self._control_route_active(config)
        if route_active is False:
            if str(config.get("control_kind") or "switch") != "select":
                return False
            current = _state_value(self.hass, str(config.get("control_entity") or ""))
            if current == _select_option(config, "pause_option", "Off"):
                return False
        if state.get("charging") is True or float(state.get("power_w") or 0.0) > 100:
            return True
        if (
            str(config.get("control_kind") or "switch") == "select"
            and route_active is False
        ):
            # A third mode such as PV or Eco may energise the charger. Treat it
            # as external control unless it is the configured pause option.
            return True
        return route_active is True

    def _new_claim_externally_active(self, config: dict[str, Any]) -> bool:
        """Detect an external start without consuming unrelated live guard state."""
        if str(config.get("control_kind") or "switch") == "select":
            return self._control_is_active(config, self._vehicle_state(config))
        return self._control_route_active(config) is True

    def _control_matches(self, entity_id: str, kind: str, desired: Any) -> bool:
        current = _state_value(self.hass, entity_id)
        if current is None:
            return False
        if kind == "switch":
            return (current == "on") is bool(desired)
        if kind == "number":
            actual = number(current)
            _minimum, _maximum, step = self._number_limits(entity_id)
            if abs(float(desired)) <= 0.01:
                return actual is not None and abs(actual) <= 0.05
            return actual is not None and abs(actual - float(desired)) <= max(
                0.05, step / 2 + 0.001
            )
        return current == str(desired)

    async def _send_control(self, entity_id: str, kind: str, desired: Any) -> None:
        async with asyncio.timeout(_SERVICE_TIMEOUT):
            if kind == "switch":
                service = "turn_on" if desired else "turn_off"
                await self.hass.services.async_call(
                    "switch", service, {"entity_id": entity_id}, blocking=True
                )
            elif kind == "number":
                await self.hass.services.async_call(
                    "number",
                    "set_value",
                    {"entity_id": entity_id, "value": desired},
                    blocking=True,
                )
            else:
                await self.hass.services.async_call(
                    "select",
                    "select_option",
                    {"entity_id": entity_id, "option": desired},
                    blocking=True,
                )

    async def _apply(
        self,
        config: dict[str, Any],
        state: dict[str, Any],
        plan: dict[str, Any],
        execution_mode: str,
        *,
        guard_override: dict[str, Any] | None = None,
        guard_context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        requested_action = str(plan.get("action") or "hold")
        action = requested_action
        planned_target_soc = number(plan.get("target_soc"))
        guard = guard_override or self._guard(
            config, state, action, target_soc=planned_target_soc
        )
        if guard.get("status") == "blocked":
            action = "hold"
        plan["guard"] = guard
        plan["action"] = action
        plan["execution_mode"] = execution_mode
        if execution_mode != "automatic":
            plan["execution"] = {
                "status": "would_apply"
                if execution_mode == "shadow"
                else "advice_only",
                "reason": "No charger command is sent in this execution mode",
            }
            return plan

        entity_id = str(config.get("control_entity") or "")
        vehicle_id = str(config.get("id") or "")
        if vehicle_id in self._reconcile_failed_vehicles:
            plan["execution"] = {
                "status": "unsafe_control",
                "reason": "The previous charger route has not confirmed its stop yet",
            }
            return plan
        owner = self._owned_controls.get(entity_id) or {}
        if owner.get("ownership_state") == "provisional":
            # No service call can have started for a provisional owner. Clear
            # an interrupted in-memory claim before evaluating live activity.
            await self._abandon_unsent_owner(entity_id)
            owner = {}
        pause = await self._active_control_pause(config, state)
        if pause:
            released = True
            if owner:
                released = await self._release_owner(entity_id)
            plan["action"] = "hold"
            plan["execution"] = {
                "status": (
                    "not_following"
                    if owner and not released
                    else "manual_override"
                    if pause.get("kind") == "manual"
                    else "safety_lockout"
                ),
                "reason": str(
                    pause.get("reason")
                    or "Automatic charging is paused until the charger settings change"
                ),
            }
            return plan
        owner_route_config = dict(owner.get("config") or config)
        if (
            owner
            and (
                owner.get("stop_confirmed")
                or entity_id in getattr(self, "_confirmed_stopped_controls", set())
            )
            and self._control_route_active(owner_route_config) is False
        ):
            if not await self._drop_stopped_owner(entity_id):
                plan["action"] = "hold"
                plan["execution"] = {
                    "status": "unsafe_control",
                    "reason": (
                        "Smart EV confirmed the charger stop but could not "
                        "save the released stop responsibility"
                    ),
                }
                return plan
            owner = {}
            owner_route_config = dict(config)
        if owner.get("ownership_state") == "rollback_watch":
            route_active = self._control_route_active(owner_route_config)
            rollback_until = timestamp(owner.get("rollback_until"))
            watch_active = bool(
                rollback_until
                and dt_util.utcnow() < rollback_until.astimezone(dt_util.UTC)
            )
            if route_active is not False:
                released = await self._emergency_stop(
                    owner_route_config, watch_late_start=True
                )
                self._failed_intents[entity_id] = ("charge", dt_util.utcnow())
                plan["action"] = "hold"
                plan["execution"] = {
                    "status": "stopped" if released else "not_following",
                    "reason": (
                        "A delayed charger start was stopped during the safety watch"
                        if released
                        else "A delayed charger start could not be stopped safely"
                    ),
                }
                return plan
            if watch_active:
                plan["action"] = "hold"
                plan["execution"] = {
                    "status": "confirmation_wait",
                    "reason": (
                        "Smart EV is watching for a delayed charger start after "
                        "the confirmed rollback"
                    ),
                }
                return plan
            if not await self._drop_stopped_owner(entity_id):
                plan["action"] = "hold"
                plan["execution"] = {
                    "status": "unsafe_control",
                    "reason": (
                        "Smart EV could not release the expired late-start watch"
                    ),
                }
                return plan
            owner = {}
            owner_route_config = dict(config)
        if owner and self._control_route_active(owner_route_config) is False:
            if not self._owner_had_confirmed_session(owner):
                released = await self._emergency_stop(
                    owner_route_config, watch_late_start=True
                )
                self._failed_intents[entity_id] = ("charge", dt_util.utcnow())
                plan["action"] = "hold"
                plan["execution"] = {
                    "status": "stopped" if released else "not_following",
                    "reason": (
                        "The unconfirmed charger start was stopped and will not be retried immediately"
                        if released
                        else "The unconfirmed charger start could not be stopped safely"
                    ),
                }
                return plan
            forgotten = await self._forget_inactive_owner(entity_id, config)
            plan["action"] = "hold"
            plan["execution"] = {
                "status": "manual_override" if forgotten else "unsafe_control",
                "reason": (
                    "The charger was stopped outside Smart EV; automatic restart is paused"
                    if forgotten
                    else "The manual stop was detected but ownership could not be persisted"
                ),
            }
            return plan
        if action != "charge" and owner:
            guard_stop = bool(
                requested_action == "charge" and guard.get("status") == "blocked"
            )
            released = (
                await self._release_owner(entity_id, persist=False)
                if guard_stop
                else await self._release_owner(entity_id)
            )
            pause_kind: str | None = None
            if guard_stop:
                pause_kind = self._guard_pause_kind(guard.get("reason"))
                if pause_kind:
                    await self._record_guard_lockout(
                        entity_id,
                        self._pause_config(owner, config),
                        pause_kind,
                        str(guard.get("reason")),
                    )
                else:
                    await self._mark_guard_stop(entity_id)
            plan["execution"] = {
                "status": (
                    "safety_lockout"
                    if released and pause_kind
                    else "stopped"
                    if released
                    else "not_following"
                ),
                "reason": guard.get("reason")
                if requested_action == "charge" and guard.get("status") == "blocked"
                else (
                    "The Smart EV-owned shared charger was stopped"
                    if released
                    else "The Smart EV-owned charger did not confirm the safety stop"
                ),
            }
            return plan
        stopped_at = self._guard_stopped_at.get(entity_id)
        if (
            action == "charge"
            and not owner
            and stopped_at is not None
            and (dt_util.utcnow() - stopped_at).total_seconds()
            < _GUARD_STOP_COOLDOWN_SECONDS
        ):
            plan["execution"] = {
                "status": "cooldown",
                "reason": "Charging is waiting after a recent safety stop",
            }
            return plan
        if action != "charge":
            externally_active = self._control_is_active(config, state)
            plan["execution"] = {
                "status": "blocked_by_grid"
                if requested_action == "charge" and guard.get("status") == "blocked"
                else "external_control"
                if externally_active
                else "idle",
                "reason": guard.get("reason")
                if requested_action == "charge" and guard.get("status") == "blocked"
                else "Smart EV did not start this charger session and will not stop it"
                if externally_active
                else str(
                    plan.get("reason")
                    or "The charger is inactive and no command is needed"
                ),
            }
            return plan
        if not owner and self._control_is_active(config, state):
            plan["execution"] = {
                "status": "external_control",
                "reason": (
                    "This charger session was already active outside Smart EV; "
                    "its setpoint and stop control remain untouched"
                ),
            }
            return plan
        if not entity_id or _state_value(self.hass, entity_id) is None:
            if owner:
                released = await self._release_owner(entity_id)
                plan["execution"] = {
                    "status": "stopped" if released else "not_following",
                    "reason": (
                        "The charger control became unavailable; Smart EV used its "
                        "stored stop route"
                        if released
                        else "The unavailable charger did not confirm its safety stop"
                    ),
                }
                return plan
            plan["execution"] = {
                "status": "unavailable",
                "reason": "The charger control is unavailable",
            }
            return plan
        if entity_id in self._reconcile_failures:
            plan["execution"] = {
                "status": "unsafe_control",
                "reason": "The previous charger route has not confirmed its stop yet",
            }
            return plan

        if owner and self._safety_effect_failed(config, state, guard):
            released = await self._release_owner(entity_id, persist=False)
            reason = (
                "The charger confirmed lower setpoints, but measured power "
                "remained above the safe limit"
            )
            await self._record_guard_lockout(
                entity_id,
                self._pause_config(owner, config),
                "safety",
                reason,
            )
            plan["execution"] = {
                "status": "safety_lockout" if released else "not_following",
                "reason": reason,
            }
            return plan

        try:
            targets = self._control_targets(config, action, guard)
        except ValueError as err:
            plan["execution"] = {"status": "unsafe_control", "reason": str(err)}
            return plan
        desired = targets[-1][2]
        if self._targets_match(targets):
            self._failed_intents.pop(entity_id, None)
            if action == "charge":
                if owner.get("vehicle_id") == str(config.get("id")):
                    if (
                        owner.get("ownership_state") in {"dispatching", "command_sent"}
                        and self._control_route_active(
                            dict(owner.get("config") or config)
                        )
                        is True
                    ):
                        # A restart may recover the last durable snapshot from
                        # around the service call. Once the requested route is
                        # visibly active, promote it so a later manual Off is
                        # respected as a persistent manual override.
                        self._remember_owner(
                            config,
                            float(guard.get("allowed_power_w") or 0.0),
                            ownership_state="confirmed",
                        )
                        try:
                            await self._persist_owners()
                        except Exception:  # noqa: BLE001 - restored stop responsibility remains valid.
                            LOGGER.warning(
                                "Smart EV could not persist confirmed recovered ownership for %s",
                                entity_id,
                                exc_info=True,
                            )
                    plan["execution"] = {
                        **self._charging_feedback(config, state),
                        "desired": desired,
                    }
                elif owner:
                    # Consecutive vehicles may intentionally share one
                    # physical wallbox.  Transfer only Smart EV's existing
                    # ownership; never claim an externally started session.
                    previous_owner = copy.deepcopy(owner)
                    self._remember_owner(
                        config, float(guard.get("allowed_power_w") or 0.0)
                    )
                    try:
                        await self._persist_owners()
                    except Exception:  # noqa: BLE001 - keep the prior durable owner on any storage failure.
                        self._owned_controls[entity_id] = previous_owner
                        plan["execution"] = {
                            "status": "not_following",
                            "desired": desired,
                            "reason": (
                                "Smart EV could not durably transfer this shared "
                                "charger, so the existing session remains unchanged"
                            ),
                        }
                        return plan
                    plan["execution"] = {
                        **self._charging_feedback(config, state),
                        "desired": desired,
                        "reason": "Smart EV transferred this shared charger to the active vehicle",
                    }
                else:
                    plan["execution"] = {
                        "status": "external_control",
                        "desired": desired,
                        "reason": "The charger already matched this request; Smart EV did not claim ownership",
                    }
            else:
                self._owned_controls.pop(entity_id, None)
                plan["execution"] = {"status": "stopped", "desired": desired}
            return plan

        command_lock = self._command_locks.setdefault(entity_id, asyncio.Lock())
        async with command_lock:
            if not self._intent_authorised(config, action):
                plan["execution"] = {
                    "status": "cancelled",
                    "reason": "The command was cancelled because Smart EV settings changed",
                }
                return plan
            if action == "charge":
                fresh_state = self._vehicle_state(config)
                guard_context = self._refresh_guard_context(guard_context)
                fresh_guard = self._guard(
                    config,
                    fresh_state,
                    action,
                    target_soc=planned_target_soc,
                    **(guard_context or {}),
                )
                initial_allowed = float(guard.get("allowed_power_w") or 0.0)
                fresh_allowed = float(fresh_guard.get("allowed_power_w") or 0.0)
                fresh_guard["allowed_power_w"] = round(
                    min(initial_allowed, fresh_allowed)
                )
                if fresh_guard.get("allowed_power_w", 0) < 100:
                    fresh_guard["status"] = "blocked"
                elif (
                    fresh_guard["allowed_power_w"] < self._requested_power_w(config) - 1
                ):
                    fresh_guard["status"] = "limited"
                plan["guard"] = fresh_guard
                guard = fresh_guard
                state = fresh_state
                if fresh_guard.get("status") == "blocked":
                    action = "hold"
                    plan["action"] = "hold"
                try:
                    targets = self._control_targets(config, action, fresh_guard)
                except ValueError as err:
                    existing_owner = self._owned_controls.get(entity_id) or {}
                    if action == "hold" and existing_owner:
                        released = await self._emergency_stop(
                            dict(existing_owner.get("config") or config),
                            persist=False,
                        )
                        pause_kind = self._guard_pause_kind(fresh_guard.get("reason"))
                        if pause_kind:
                            await self._record_guard_lockout(
                                entity_id,
                                self._pause_config(existing_owner, config),
                                pause_kind,
                                str(fresh_guard.get("reason")),
                            )
                        else:
                            await self._mark_guard_stop(entity_id)
                        plan["execution"] = {
                            "status": (
                                "safety_lockout"
                                if released and pause_kind
                                else "stopped"
                                if released
                                else "not_following"
                            ),
                            "reason": fresh_guard.get("reason") or str(err),
                        }
                        return plan
                    plan["execution"] = {
                        "status": "unsafe_control",
                        "reason": str(err),
                    }
                    return plan
                desired = targets[-1][2]

            owner = self._owned_controls.get(entity_id) or {}
            if (
                action == "charge"
                and not owner
                and self._control_is_active(config, state)
            ):
                plan["execution"] = {
                    "status": "external_control",
                    "reason": (
                        "This charger became active outside Smart EV while the "
                        "command was being prepared; it remains untouched"
                    ),
                }
                return plan
            if (
                action == "charge"
                and owner
                and self._safety_effect_failed(config, state, guard)
            ):
                released = await self._emergency_stop(
                    dict(owner.get("config") or config), persist=False
                )
                reason = (
                    "The charger confirmed lower setpoints, but measured power "
                    "remained above the safe limit"
                )
                await self._record_guard_lockout(
                    entity_id,
                    self._pause_config(owner, config),
                    "safety",
                    reason,
                )
                plan["execution"] = {
                    "status": "safety_lockout" if released else "not_following",
                    "reason": reason,
                }
                return plan
            if action == "hold" and owner:
                # A formerly selected vehicle may have lost its guard budget.
                # Stop the existing Smart EV-owned shared session even when
                # ownership still names another vehicle.
                released = await self._emergency_stop(
                    dict(owner.get("config") or config), persist=False
                )
                pause_kind: str | None = None
                pause_kind = self._guard_pause_kind(guard.get("reason"))
                if pause_kind:
                    await self._record_guard_lockout(
                        entity_id,
                        self._pause_config(owner, config),
                        pause_kind,
                        str(guard.get("reason")),
                    )
                else:
                    await self._mark_guard_stop(entity_id)
                plan["execution"] = {
                    "status": (
                        "safety_lockout"
                        if released and pause_kind
                        else "stopped"
                        if released
                        else "not_following"
                    ),
                    "reason": guard.get("reason")
                    or "The charger did not confirm the safety stop",
                }
                return plan
            if action == "hold":
                plan["execution"] = {
                    "status": "blocked_by_grid",
                    "reason": guard.get("reason")
                    or "The live safety guard blocked charging",
                }
                return plan

            safety_reduction = False
            if action == "charge":
                try:
                    targets, safety_reduction = self._available_charge_targets(
                        config, targets, owner
                    )
                except ValueError as err:
                    plan["execution"] = {
                        "status": "unsafe_control",
                        "reason": str(err),
                    }
                    return plan
                desired = targets[-1][2]

            # Avoid rewriting targets that already match. In particular, an
            # already-on enable switch must not be toggled again after a safe
            # current adjustment.
            targets = [
                target
                for target in targets
                if not self._control_matches(target[0], target[1], target[2])
            ]
            if not targets:
                plan["execution"] = {
                    **self._charging_feedback(config, state),
                    "desired": desired,
                }
                return plan

            failed_intent = self._failed_intents.get(entity_id)
            failed_matches = bool(
                failed_intent
                and (dt_util.utcnow() - failed_intent[1]).total_seconds()
                < _FAILED_START_RETRY_SECONDS
            )
            if failed_intent and not failed_matches:
                self._failed_intents.pop(entity_id, None)
            if action == "charge" and not safety_reduction and failed_matches:
                plan["execution"] = {
                    "status": "confirmation_wait",
                    "desired": desired,
                    "reason": (
                        "Smart EV is waiting after an unconfirmed charger command; "
                        "it can try this command again after five minutes"
                    ),
                }
                return plan
            error = "The charger did not confirm the requested state"
            for attempt in range(2):
                try:
                    if attempt:
                        # Safety can change during a failed service call. Never
                        # reuse the first attempt's stale power budget.
                        retry_state = self._vehicle_state(config)
                        guard_context = self._refresh_guard_context(guard_context)
                        retry_guard = self._guard(
                            config,
                            retry_state,
                            "charge",
                            target_soc=planned_target_soc,
                            **(guard_context or {}),
                        )
                        retry_guard["allowed_power_w"] = round(
                            min(
                                float(guard.get("allowed_power_w") or 0.0),
                                float(retry_guard.get("allowed_power_w") or 0.0),
                            )
                        )
                        if retry_guard["allowed_power_w"] < 100:
                            retry_guard["status"] = "blocked"
                        elif (
                            retry_guard["allowed_power_w"]
                            < self._requested_power_w(config) - 1
                        ):
                            retry_guard["status"] = "limited"
                        plan["guard"] = retry_guard
                        guard = retry_guard
                        state = retry_state
                        owner = self._owned_controls.get(entity_id) or {}
                        retry_owner_config = dict(owner.get("config") or config)
                        if (
                            owner
                            and self._control_route_active(retry_owner_config) is False
                        ):
                            if not self._owner_had_confirmed_session(owner):
                                # The command lock is already held here, so use
                                # the lock-free rollback helper rather than
                                # trying to acquire the same lock recursively.
                                released = await self._emergency_stop(
                                    retry_owner_config, watch_late_start=True
                                )
                                self._failed_intents[entity_id] = (
                                    "charge",
                                    dt_util.utcnow(),
                                )
                                plan["action"] = "hold"
                                plan["execution"] = {
                                    "status": (
                                        "stopped" if released else "not_following"
                                    ),
                                    "reason": (
                                        "The unconfirmed charger start was stopped and will not be retried immediately"
                                        if released
                                        else "The unconfirmed charger start could not be stopped safely"
                                    ),
                                }
                                return plan
                            forgotten = await self._forget_inactive_owner(
                                entity_id, config
                            )
                            plan["action"] = "hold"
                            plan["execution"] = {
                                "status": (
                                    "manual_override" if forgotten else "unsafe_control"
                                ),
                                "reason": (
                                    "The charger was stopped outside Smart EV; automatic restart is paused"
                                    if forgotten
                                    else "The manual stop was detected but ownership could not be persisted"
                                ),
                            }
                            return plan
                        if retry_guard.get("status") == "blocked":
                            pause_kind: str | None = None
                            released = (
                                await self._emergency_stop(
                                    dict(owner.get("config") or config),
                                    persist=False,
                                )
                                if owner
                                else True
                            )
                            if owner:
                                pause_kind = self._guard_pause_kind(
                                    retry_guard.get("reason")
                                )
                                if pause_kind:
                                    await self._record_guard_lockout(
                                        entity_id,
                                        self._pause_config(owner, config),
                                        pause_kind,
                                        str(retry_guard.get("reason")),
                                    )
                                else:
                                    await self._mark_guard_stop(entity_id)
                            plan["action"] = "hold"
                            plan["execution"] = {
                                "status": (
                                    "safety_lockout"
                                    if owner and released and pause_kind
                                    else "stopped"
                                    if owner and released
                                    else "not_following"
                                    if owner
                                    else "blocked_by_grid"
                                ),
                                "reason": retry_guard.get("reason"),
                            }
                            return plan
                        if not owner and self._control_is_active(config, retry_state):
                            plan["execution"] = {
                                "status": "external_control",
                                "reason": (
                                    "The charger became externally active before "
                                    "the safety retry and remains untouched"
                                ),
                            }
                            return plan
                        targets = self._control_targets(config, "charge", retry_guard)
                        try:
                            targets, safety_reduction = self._available_charge_targets(
                                config, targets, owner
                            )
                        except ValueError as err:
                            plan["execution"] = {
                                "status": "unsafe_control",
                                "reason": str(err),
                            }
                            return plan
                        desired = targets[-1][2]
                    if not self._intent_authorised(config, action):
                        plan["execution"] = {
                            "status": "cancelled",
                            "reason": "The command was cancelled because Smart EV settings changed",
                        }
                        return plan
                    expected_allowed = float(guard.get("allowed_power_w") or 0.0)

                    async def assert_live_safety(
                        expected_limit: float = expected_allowed,
                    ) -> None:
                        nonlocal guard_context
                        guard_context = self._refresh_guard_context(guard_context)
                        live_state = self._vehicle_state(config)
                        live_guard = self._guard(
                            config,
                            live_state,
                            "charge",
                            target_soc=planned_target_soc,
                            **guard_context,
                        )
                        live_allowed = float(live_guard.get("allowed_power_w") or 0.0)
                        if (
                            live_guard.get("status") == "blocked"
                            or live_allowed + 1 < expected_limit
                        ):
                            raise _SafetyBlocked(
                                str(
                                    live_guard.get("reason")
                                    or "Live safety conditions changed during the command"
                                )
                            )

                    async with energy_dispatch_lock(self.hass):
                        await self._send_transaction(
                            config,
                            action,
                            targets,
                            expected_power_w=expected_allowed,
                            safety_check=assert_live_safety,
                        )
                    self._failed_intents.pop(entity_id, None)
                    if action == "charge":
                        plan["execution"] = {
                            **self._charging_feedback(config, state),
                            "desired": desired,
                            "attempts": attempt + 1,
                        }
                    else:
                        self._owned_controls.pop(entity_id, None)
                        await self._persist_owners()
                        plan["execution"] = {
                            "status": "stopped",
                            "desired": desired,
                            "attempts": attempt + 1,
                        }
                    return plan
                except _SafetyBlocked as err:
                    owner = self._owned_controls.get(entity_id) or {}
                    pause_kind: str | None = None
                    released = (
                        await self._emergency_stop(
                            dict(owner.get("config") or config), persist=False
                        )
                        if owner
                        else True
                    )
                    if owner:
                        pause_kind = self._guard_pause_kind(str(err))
                        if pause_kind:
                            await self._record_guard_lockout(
                                entity_id,
                                self._pause_config(owner, config),
                                pause_kind,
                                str(err),
                            )
                        else:
                            await self._mark_guard_stop(entity_id)
                    plan["action"] = "hold"
                    plan["execution"] = {
                        "status": (
                            "safety_lockout"
                            if owner and released and pause_kind
                            else "stopped"
                            if owner and released
                            else "not_following"
                            if owner
                            else "unsafe_control"
                            if err.control_error
                            else "blocked_by_grid"
                        ),
                        "reason": str(err),
                    }
                    return plan
                except _ManualOverride:
                    forgotten = await self._forget_inactive_owner(entity_id, config)
                    plan["action"] = "hold"
                    plan["execution"] = {
                        "status": "manual_override" if forgotten else "unsafe_control",
                        "reason": (
                            "The charger was stopped outside Smart EV; automatic restart is paused"
                            if forgotten
                            else "The manual stop was detected but ownership could not be persisted"
                        ),
                    }
                    return plan
                except _IntentCancelled:
                    cancelled_owner = self._owned_controls.get(entity_id) or {}
                    if action == "charge" and cancelled_owner:
                        await self._emergency_stop(
                            dict(cancelled_owner.get("config") or config),
                            watch_late_start=not self._owner_had_confirmed_session(
                                cancelled_owner
                            ),
                        )
                    plan["execution"] = {
                        "status": "cancelled",
                        "reason": "The command was cancelled because Smart EV settings changed",
                    }
                    return plan
                except _ExternalControl:
                    plan["execution"] = {
                        "status": "external_control",
                        "reason": (
                            "The charger became active outside Smart EV before "
                            "the command was sent; it remains untouched"
                        ),
                    }
                    return plan
                except _OwnershipPersistenceFailed:
                    plan["execution"] = {
                        "status": "not_following",
                        "reason": (
                            "Smart EV could not save stop responsibility, so no "
                            "charger command was sent"
                        ),
                    }
                    return plan
                except Exception as err:  # noqa: BLE001  # HA supplies the service error.
                    error = str(err)
                    owner = self._owned_controls.get(entity_id) or {}
                    owner_config = dict(owner.get("config") or config)
                    if (
                        action == "charge"
                        and owner
                        and not self._owner_had_confirmed_session(owner)
                    ):
                        released = await self._emergency_stop(
                            owner_config, watch_late_start=True
                        )
                        self._failed_intents[entity_id] = (
                            "charge",
                            dt_util.utcnow(),
                        )
                        plan["action"] = "hold"
                        plan["execution"] = {
                            "status": "stopped" if released else "not_following",
                            "reason": (
                                "The unconfirmed charger start was stopped and will not be retried immediately"
                                if released
                                else "The unconfirmed charger start could not be stopped safely"
                            ),
                        }
                        return plan
                    if (
                        action == "charge"
                        and owner
                        and self._control_route_active(owner_config) is False
                    ):
                        forgotten = await self._forget_inactive_owner(entity_id, config)
                        plan["action"] = "hold"
                        plan["execution"] = {
                            "status": (
                                "manual_override" if forgotten else "unsafe_control"
                            ),
                            "reason": (
                                "The charger was stopped outside Smart EV; automatic restart is paused"
                                if forgotten
                                else "The manual stop was detected but ownership could not be persisted"
                            ),
                        }
                        return plan
                    if action == "charge" and owner:
                        released = await self._emergency_stop(owner_config)
                        if not released:
                            self._failed_intents[entity_id] = (
                                "charge",
                                dt_util.utcnow(),
                            )
                            plan["action"] = "hold"
                            plan["execution"] = {
                                "status": "not_following",
                                "desired": desired,
                                "reason": (
                                    "The owned charger could not confirm a safety "
                                    "stop after the failed adjustment"
                                ),
                                "attempts": attempt + 1,
                            }
                            return plan
            if action == "charge" and not safety_reduction:
                self._failed_intents[entity_id] = ("charge", dt_util.utcnow())
            plan["execution"] = {
                "status": "not_following",
                "desired": desired,
                "reason": error,
                "attempts": 2,
            }
            return plan

    def _load_control_owners(self, config: dict[str, Any]) -> None:
        if not getattr(self, "_owned_controls", {}):
            stored_owners = config.get("control_owners") or {}
            self._abandoned_control_owners.update(
                str(key)
                for key, value in stored_owners.items()
                if isinstance(value, dict)
                and value.get("ownership_state") == "provisional"
            )
            self._owned_controls = {
                str(key): dict(value)
                for key, value in stored_owners.items()
                if isinstance(value, dict)
                and value.get("ownership_state") != "provisional"
                and str(key) not in self._abandoned_control_owners
                and str(key) not in getattr(self, "_confirmed_stopped_controls", set())
            }
        if not getattr(self, "_control_pauses", {}):
            self._control_pauses = {
                str(key): dict(value)
                for key, value in (config.get("control_pauses") or {}).items()
                if isinstance(value, dict)
            }
        if not self._guard_stopped_at:
            for key, value in (config.get("guard_stopped_at") or {}).items():
                stopped_at = timestamp(value)
                if stopped_at is not None:
                    self._guard_stopped_at[str(key)] = stopped_at.astimezone(
                        dt_util.UTC
                    )

    async def _reconcile_control_owners(
        self,
        vehicles: list[dict[str, Any]],
        *,
        automatic: bool,
    ) -> None:
        """Release controls when automatic ownership no longer has a valid owner."""
        self._reconcile_failures.clear()
        self._reconcile_failed_vehicles.clear()
        by_id = {str(item.get("id")): item for item in vehicles}
        previous_owners = copy.deepcopy(self._owned_controls)
        owner_config_changed = False
        for entity_id, owner in list(self._owned_controls.items()):
            vehicle_id = str(owner.get("vehicle_id") or "")
            current_vehicle = by_id.get(vehicle_id) if automatic else None
            owner_config = dict(owner.get("config") or {})
            if current_vehicle is not None:
                route_keys = ["control_entity", "control_kind", "stop_entity"]
                if str(owner_config.get("control_kind") or "switch") == "select":
                    route_keys.extend(("charge_option", "pause_option"))
                elif str(owner_config.get("control_kind") or "switch") == "number":
                    route_keys.append("off_current_a")
                same_route = all(
                    str(current_vehicle.get(key) or "")
                    == str(owner_config.get(key) or "")
                    for key in route_keys
                )
                if same_route and current_vehicle.get("enabled", True):
                    if owner_config != current_vehicle:
                        owner["config"] = dict(current_vehicle)
                        owner_config_changed = True
                    continue
                # Release with the stored route before adopting any newly
                # configured entity or stop switch.
                if not await self._release_owner(entity_id):
                    self._reconcile_failures.add(entity_id)
                    self._reconcile_failed_vehicles.add(vehicle_id)
                    LOGGER.warning(
                        "Smart EV could not confirm the safety stop for %s (%s)",
                        vehicle_id,
                        entity_id,
                    )
                continue
            if not await self._release_owner(entity_id):
                self._reconcile_failures.add(entity_id)
                self._reconcile_failed_vehicles.add(vehicle_id)
                LOGGER.warning(
                    "Smart EV retained ownership because %s did not confirm its stop",
                    entity_id,
                )
        if owner_config_changed:
            try:
                await self._persist_owners()
            except Exception:  # noqa: BLE001 - keep the last durable stop route.
                # Restore only refreshed snapshots that still exist. Owners
                # already released and durably removed during this same pass
                # must never be resurrected.
                for entity_id, owner in self._owned_controls.items():
                    previous_owner = previous_owners.get(entity_id)
                    if previous_owner is not None:
                        owner["config"] = dict(previous_owner.get("config") or {})
                LOGGER.warning(
                    "Smart EV could not persist refreshed charger ownership; "
                    "the previous durable stop route remains active",
                    exc_info=True,
                )

    async def _reconcile_control_pauses(
        self,
        vehicles: list[dict[str, Any]],
        *,
        automatic: bool,
    ) -> None:
        """Remove pauses whose owning vehicle or explicit reset condition changed."""
        pauses = self._control_pauses
        if not pauses:
            return
        previous = copy.deepcopy(pauses)
        by_id = {str(item.get("id") or ""): item for item in vehicles}
        for entity_id, pause in list(pauses.items()):
            vehicle = by_id.get(str(pause.get("vehicle_id") or ""))
            remove = bool(
                not automatic
                or vehicle is None
                or not vehicle.get("enabled", True)
                or str(vehicle.get("control_entity") or "") != entity_id
            )
            if not remove and vehicle is not None:
                state = self._vehicle_state(vehicle)
                remove = bool(
                    state.get("plugged") is False
                    or pause.get("signature") != self._control_pause_signature(vehicle)
                    or (
                        pause.get("kind") == "battery"
                        and vehicle.get("allow_home_battery_support", False)
                    )
                )
            if remove:
                pauses.pop(entity_id, None)
        if pauses == previous:
            return
        try:
            await self._persist_owners()
        except Exception:  # noqa: BLE001 - retain the durable pause and retry next cycle.
            self._control_pauses = previous
            LOGGER.warning(
                "Smart EV could not persist reconciled charger pauses; "
                "the safe lockout remains active",
                exc_info=True,
            )

    def _current_battery_reservation_w(
        self, now: datetime
    ) -> tuple[float, float, bool, bool]:
        """Return automatic battery load, freshness and discharge state."""
        domain_data = getattr(self.hass, "data", {}).get(DOMAIN, {})
        battery = domain_data.get("battery_plan")
        live_plan = (battery.data or {}) if battery else {}
        store = self._store()
        battery_config = store.get_battery() if store else {}
        automatic = bool(battery_config.get("enabled")) and (
            str(battery_config.get("execution_mode") or "advice") == "automatic"
            or bool(battery_config.get("automatic_control"))
        )
        if automatic and (
            not live_plan
            or str(live_plan.get("execution_mode") or "") != "automatic"
            or str(live_plan.get("status") or "") != "ready"
        ):
            return 0.0, 0.0, False, False
        if automatic:
            calculated_at = timestamp(live_plan.get("calculated_at"))
            if (
                calculated_at is None
                or (
                    dt_util.utcnow() - calculated_at.astimezone(dt_util.UTC)
                ).total_seconds()
                > _BATTERY_PLAN_MAX_AGE_SECONDS
            ):
                return 0.0, 0.0, False, False
        max_age = max(
            15.0,
            float(number(battery_config.get("grid_data_max_age"), 90.0) or 90.0),
        )
        measurement = battery_power_measurement(self.hass, max_age)
        actual = (
            float(measurement.get("power_w") or 0.0)
            if measurement.get("fresh")
            else 0.0
        )
        measured_discharging = (
            bool(measurement.get("fresh")) and actual < -_BATTERY_DISCHARGE_THRESHOLD_W
        )
        if not automatic:
            # No mapped battery source means there is no battery uncertainty
            # to guard. A mapped but stale source is different: when support
            # is disallowed Smart EV must not assume that it is idle.
            source_configured = bool(measurement.get("entity_id"))
            return (
                0.0,
                0.0,
                not source_configured or bool(measurement.get("fresh")),
                measured_discharging,
            )
        if not measurement.get("fresh"):
            return 0.0, 0.0, False, False
        timeline = live_plan.get("timeline", [])
        planned_now: float | None = None
        for item in timeline:
            start = timestamp(item.get("start"))
            end = timestamp(item.get("end"))
            if (
                start
                and end
                and start.astimezone(UTC) <= now.astimezone(UTC) < end.astimezone(UTC)
            ):
                planned = float(number(item.get("power_w"), 0.0) or 0.0)
                planned_now = planned
                break
        if planned_now is None:
            return 0.0, 0.0, False, measured_discharging
        additional = max(0.0, planned_now - actual)
        discharging = (
            planned_now < -_BATTERY_DISCHARGE_THRESHOLD_W or measured_discharging
        )
        # Battery phase topology is not part of the source mapping.
        # Conservatively reserve the full additional load on the tightest
        # phase rather than assuming a balanced 3-phase unit.
        return additional, additional, True, discharging

    def _smart_load_dispatch_reservation_w(self) -> float:
        """Reserve unresolved Smart Load demand not already visible by sensor."""
        store = self._store()
        smart_loads = store.get_smart_loads() if store else {}
        by_id = {
            str(item.get("id") or ""): dict(item)
            for item in smart_loads.get("loads", [])
            if isinstance(item, dict)
        }
        total = 0.0
        now = dt_util.utcnow()
        for load_id, owner in (smart_loads.get("control_owners") or {}).items():
            if not isinstance(owner, dict):
                continue
            attempted = timestamp(owner.get("command_attempted_at"))
            reserve_until = timestamp(owner.get("reservation_until"))
            load = by_id.get(str(load_id)) or dict(owner.get("load_snapshot") or {})
            expected = max(
                0.0,
                number(owner.get("expected_power_w"), load.get("power_w")) or 0.0,
            )
            # Keep the full reservation during the P1/phase propagation window;
            # an appliance sensor commonly updates before the meter does.
            if (
                attempted is None
                or reserve_until is None
                or now <= reserve_until.astimezone(UTC)
            ):
                total += expected
                continue
            power_entity = str(load.get("power_entity") or "")
            power_state = self.hass.states.get(power_entity) if power_entity else None
            measured = self._power_w(power_entity) if power_state is not None else None
            if power_state is not None:
                reported = max(
                    power_state.last_updated,
                    getattr(power_state, "last_reported", power_state.last_updated),
                )
                if (now - reported).total_seconds() > 90:
                    measured = None
            total += max(0.0, expected - max(0.0, measured or 0.0))
        return total

    def _refresh_guard_context(self, context: dict[str, Any] | None) -> dict[str, Any]:
        """Refresh the battery part of a previously reserved household budget."""
        result = dict(context or {})
        old_grid = float(result.get("battery_reserved_grid_w") or 0.0)
        old_phase = float(result.get("battery_reserved_phase_w") or 0.0)
        old_smart_load = float(result.get("smart_load_reserved_w") or 0.0)
        new_grid, new_phase, fresh, discharging = self._current_battery_reservation_w(
            dt_util.as_local(dt_util.utcnow())
        )
        result["reserved_grid_w"] = max(
            0.0, float(result.get("reserved_grid_w") or 0.0) - old_grid + new_grid
        )
        result["reserved_phase_w"] = max(
            0.0, float(result.get("reserved_phase_w") or 0.0) - old_phase + new_phase
        )
        new_smart_load = self._smart_load_dispatch_reservation_w()
        result["reserved_grid_w"] = max(
            0.0,
            float(result.get("reserved_grid_w") or 0.0)
            - old_smart_load
            + new_smart_load,
        )
        result["reserved_phase_w"] = max(
            0.0,
            float(result.get("reserved_phase_w") or 0.0)
            - old_smart_load
            + new_smart_load,
        )
        result["battery_reserved_grid_w"] = new_grid
        result["battery_reserved_phase_w"] = new_phase
        result["smart_load_reserved_w"] = new_smart_load
        result["battery_data_fresh"] = fresh
        result["battery_discharging"] = discharging
        return result

    def _plans_for_storage(
        self, plans: dict[str, dict[str, Any]]
    ) -> dict[str, dict[str, Any]]:
        """Remove volatile telemetry before persisting explainable plans."""
        payload = copy.deepcopy(plans)
        for plan in payload.values():
            plan.pop("state", None)
            guard = plan.get("guard") or {}
            for measurement in (guard.get("grid"), guard.get("fuse")):
                if isinstance(measurement, dict):
                    measurement.pop("age_seconds", None)
        return payload

    def _runtime_plan_fingerprint(self, plans: dict[str, dict[str, Any]]) -> str:
        """Fingerprint meaningful changes, excluding the moving charge-now window."""
        summary: dict[str, Any] = {}
        for vehicle_id, plan in plans.items():
            segments = [
                "manual"
                if item.get("manual")
                # The start of an already active slot follows "now" and must
                # not trigger a storage write every minute.
                else (item.get("end"), item.get("price"), item.get("predicted"))
                for item in plan.get("segments", [])
            ]
            summary[vehicle_id] = {
                "action": plan.get("action"),
                "status": plan.get("status"),
                "deadline": plan.get("deadline"),
                "segments": segments,
                "execution": (plan.get("execution") or {}).get("status"),
                "guard": (plan.get("guard") or {}).get("status"),
            }
        return json.dumps(summary, sort_keys=True, default=str)

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch optional calendars without blocking the command safety lock."""
        if self._stopping:
            return self.data or {"enabled": False, "vehicles": [], "plans": {}}
        snapshot = self._config()
        vehicles = [
            dict(item)
            for item in snapshot.get("vehicles", [])
            if isinstance(item, dict) and item.get("id")
        ]
        now = dt_util.as_local(dt_util.utcnow())
        calendar_rules = await self._calendar_rules(vehicles, now)
        if self._stopping:
            return self.data or {"enabled": False, "vehicles": [], "plans": {}}
        async with self._cycle_lock:
            if self._stopping:
                return self.data or {"enabled": False, "vehicles": [], "plans": {}}
            return await self._async_update_locked(calendar_rules=calendar_rules)

    async def _async_update_locked(
        self,
        *,
        calendar_rules: dict[str, tuple[datetime | None, float | None, str, str]]
        | None = None,
    ) -> dict[str, Any]:
        config = self._config()
        self._load_control_owners(config)
        vehicles_config = [
            dict(item)
            for item in config.get("vehicles", [])
            if isinstance(item, dict) and item.get("id")
        ]
        execution_mode = str(config.get("execution_mode") or "advice")
        await self._reconcile_control_owners(
            vehicles_config,
            automatic=bool(config.get("enabled")) and execution_mode == "automatic",
        )
        await self._reconcile_control_pauses(
            vehicles_config,
            automatic=bool(config.get("enabled")) and execution_mode == "automatic",
        )
        if not config.get("enabled"):
            store = self._store()
            if store:
                await store.async_set_smart_ev_runtime(
                    control_owners=self._owned_controls,
                    control_pauses=self._control_pauses,
                    guard_stopped_at={
                        key: value.isoformat()
                        for key, value in self._guard_stopped_at.items()
                    },
                )
                self._abandoned_control_owners.clear()
            return {
                "enabled": False,
                "execution_mode": config.get("execution_mode", "advice"),
                "vehicles": [],
                "plans": {},
            }

        previous_learning = config.get("learning", {})
        prepared: list[dict[str, Any]] = []
        now = dt_util.as_local(dt_util.utcnow())
        for vehicle in vehicles_config:
            state = self._vehicle_state(vehicle)
            calendar_rule = (calendar_rules or {}).get(str(vehicle["id"]))
            current_calendar = str(vehicle.get("calendar_entity") or "")
            current_keyword = str(vehicle.get("calendar_keyword") or "charge").lower()
            if (
                calendar_rule is not None
                and calendar_rule[2] == current_calendar
                and calendar_rule[3] == current_keyword
            ):
                calendar_deadline, calendar_target = calendar_rule[:2]
            else:
                calendar_deadline, calendar_target = None, None
            prepared.append(
                {
                    "config": vehicle,
                    "state": state,
                    "learning": previous_learning.get(str(vehicle["id"]), {}),
                    "calendar_deadline": calendar_deadline,
                    "calendar_target_soc": calendar_target,
                }
            )
        learning = self._learn(prepared, previous_learning)
        journal_entries: list[dict[str, Any]] = []
        for item in prepared:
            item["learning"] = learning.get(str(item["config"]["id"]), {})

        try:
            plans = plan_household(
                prepared,
                self._enriched_rows(),
                now=now,
                previous=config.get("plans", {}),
            )
        except Exception as err:  # noqa: BLE001 - owned chargers must still get a stop pass.
            LOGGER.exception(
                "Smart EV planning failed; applying a safe hold to every vehicle"
            )
            plans = {
                str(item["config"]["id"]): {
                    "vehicle_id": str(item["config"]["id"]),
                    "action": "hold",
                    "status": "unavailable",
                    "reason": f"Smart EV planning failed safely: {err}",
                }
                for item in prepared
            }
        (
            battery_grid_w,
            battery_phase_w,
            battery_data_fresh,
            battery_discharging,
        ) = self._current_battery_reservation_w(now)
        smart_load_reservation_w = self._smart_load_dispatch_reservation_w()
        reserved_grid_w = battery_grid_w + smart_load_reservation_w
        # Smart Load phase topology is unknown, so reserve its full outstanding
        # dispatch on the tightest phase rather than assuming balanced phases.
        reserved_phase_w = battery_phase_w + smart_load_reservation_w
        ordered = sorted(
            prepared,
            key=lambda item: (
                0 if str(item["config"].get("mode") or "smart") == "charge_now" else 1,
                timestamp(plans[str(item["config"]["id"])].get("deadline"))
                or now + timedelta(days=30),
            ),
        )
        guards: dict[str, dict[str, Any]] = {}
        guard_contexts: dict[str, dict[str, Any]] = {}
        active_controls: set[str] = set()
        for item in ordered:
            vehicle = item["config"]
            plan = plans[str(vehicle["id"])]
            context = {
                "reserved_grid_w": reserved_grid_w,
                "reserved_phase_w": reserved_phase_w,
                "battery_reserved_grid_w": battery_grid_w,
                "battery_reserved_phase_w": battery_phase_w,
                "battery_data_fresh": battery_data_fresh,
                "battery_discharging": battery_discharging,
                "smart_load_reserved_w": smart_load_reservation_w,
            }
            guard = self._guard(
                vehicle,
                item["state"],
                str(plan.get("action") or "hold"),
                target_soc=number(plan.get("target_soc")),
                **context,
            )
            vehicle_id = str(vehicle["id"])
            guards[vehicle_id] = guard
            guard_contexts[vehicle_id] = context
            if plan.get("action") == "charge" and guard.get("status") != "blocked":
                current = max(0.0, float(item["state"].get("power_w") or 0.0))
                additional = max(
                    0.0, float(guard.get("allowed_power_w") or 0.0) - current
                )
                phases = max(1.0, min(3.0, float(vehicle.get("phases") or 3)))
                reserved_grid_w += additional
                reserved_phase_w += additional / phases
                control_entity = str(vehicle.get("control_entity") or "")
                if control_entity:
                    active_controls.add(control_entity)

        # Planning priority determines the household power budget above. For
        # physical execution, however, an existing shared-control owner must
        # be evaluated first. Otherwise an unplugged sibling can accidentally
        # consume or clear the actual owner's manual/safety stop state.
        application_order = sorted(
            enumerate(ordered),
            key=lambda indexed: (
                0
                if (
                    (
                        self._owned_controls.get(
                            str(indexed[1]["config"].get("control_entity") or "")
                        )
                        or {}
                    ).get("vehicle_id")
                    == str(indexed[1]["config"].get("id") or "")
                )
                else 1,
                indexed[0],
            ),
        )
        for _original_index, item in application_order:
            vehicle = item["config"]
            vehicle_id = str(vehicle["id"])
            plan = plans[vehicle_id]
            if _defer_to_active_shared_control(
                vehicle, plan, execution_mode, active_controls
            ):
                plan["execution_mode"] = execution_mode
                plan["execution"] = {
                    "status": "shared_control",
                    "reason": "Another safely assigned vehicle is using this shared charger",
                }
                continue
            try:
                await self._apply(
                    vehicle,
                    item["state"],
                    plan,
                    execution_mode,
                    guard_override=guards[vehicle_id],
                    guard_context=guard_contexts[vehicle_id],
                )
            except Exception as err:  # noqa: BLE001 - one charger must not prevent safety work for the others.
                LOGGER.exception("Smart EV execution failed for %s", vehicle_id)
                plan["action"] = "hold"
                plan["execution_mode"] = execution_mode
                plan["execution"] = {
                    "status": "not_following",
                    "reason": f"Smart EV could not complete this charger update: {err}",
                }
        for item in prepared:
            vehicle = item["config"]
            vehicle_id = str(vehicle["id"])
            plan = plans[vehicle_id]
            plan["state"] = item["state"]
            plan["learning"] = learning.get(vehicle_id, {})
            execution_status = (plan.get("execution") or {}).get("status")
            fingerprint = (
                f"{plan.get('action')}:{execution_status}:{plan.get('status')}"
            )
            if self._last_actions.get(vehicle_id) != fingerprint:
                journal_entries.append(
                    {
                        "vehicle_id": vehicle_id,
                        "vehicle_name": vehicle.get("name"),
                        "mode": vehicle.get("mode", "smart"),
                        "action": plan.get("action"),
                        "status": (plan.get("execution") or {}).get("status"),
                        "reason": (plan.get("execution") or {}).get("reason")
                        or plan.get("reason"),
                    }
                )
                self._last_actions[vehicle_id] = fingerprint

        store = self._store()
        if store:
            runtime_fingerprint = self._runtime_plan_fingerprint(plans)
            persisted_plans = (
                self._plans_for_storage(plans)
                if runtime_fingerprint != self._last_runtime_fingerprint
                else None
            )
            await store.async_set_smart_ev_runtime(
                plans=persisted_plans,
                learning=learning,
                control_owners=self._owned_controls,
                control_pauses=self._control_pauses,
                guard_stopped_at={
                    key: value.isoformat()
                    for key, value in self._guard_stopped_at.items()
                },
                journal_entries=journal_entries,
            )
            self._abandoned_control_owners.clear()
            self._last_runtime_fingerprint = runtime_fingerprint
        current = self._config()
        return {
            "enabled": True,
            "execution_mode": execution_mode,
            "vehicles": vehicles_config,
            "plans": plans,
            "journal": list(reversed(current.get("journal", [])[-100:])),
        }

    async def async_shutdown(self) -> None:
        """Safely release Smart EV-owned chargers before stopping the runtime."""
        if self._stopping:
            return
        self._stopping = True
        # Cancel scheduled/debounced coordinator refreshes before waiting for
        # the command lock. A refresh that was already queued will observe the
        # stopping flag both before planning and before every physical step.
        await super().async_shutdown()
        async with self._cycle_lock:
            # Shutdown can happen while the first calendar/price update is
            # still waiting. Restore durable stop responsibility before
            # deciding which chargers must be released.
            self._load_control_owners(self._config())
            for entity_id in list(self._owned_controls):
                if not await self._release_owner(entity_id):
                    LOGGER.warning(
                        "Smart EV shutdown could not confirm the safety stop for %s; "
                        "ownership remains persisted for the next startup",
                        entity_id,
                    )
            store = self._store()
            if store:
                await store.async_set_smart_ev_runtime(
                    control_owners=self._owned_controls,
                    control_pauses=self._control_pauses,
                    guard_stopped_at={
                        key: value.isoformat()
                        for key, value in self._guard_stopped_at.items()
                    },
                )
