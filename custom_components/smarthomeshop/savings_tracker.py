"""Smart-energy savings tracker.

Measures what smart energy actually earned, compared with running the same
energy at the day-average price:

- Battery: every quarter hour the mapped battery power sensor is sampled.
  Charging below the day average earns (average - price) per kWh; discharging
  above it earns (price - average) per kWh. This uses the real measured flows,
  so it also works for advice-only users who follow the planner by hand.
- Deadline schedules: while a schedule's sensor is on and the schedule has a
  known load power, the shifted energy earns (average - price) per kWh.

Totals accumulate per day, per month and all-time in the HA Store, and are
exposed as sensors plus a websocket snapshot for the panel.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from .const import DOMAIN, LOGGER

SAMPLE_HOURS = 0.25
# Ignore battery noise below this power.
MIN_BATTERY_W = 25.0


class SavingsTracker:
    """Accumulates measured smart-energy savings versus the day average."""

    def __init__(self, hass: HomeAssistant, prices) -> None:
        self.hass = hass
        self._prices = prices
        self._data: dict[str, Any] = {}
        self._loaded = False
        async_track_time_change(
            hass, self._handle_sample, minute=[1, 16, 31, 46], second=30
        )

    # ---- persistence ----

    def _store(self):
        return self.hass.data.get(DOMAIN, {}).get("store")

    def _load(self) -> None:
        if self._loaded:
            return
        store = self._store()
        if store is not None:
            self._data = store.get_savings()
            self._loaded = True

    def snapshot(self) -> dict[str, Any]:
        """Current savings state for sensors and the panel."""
        self._load()
        now = dt_util.now()
        day_ok = self._data.get("day_date") == now.date().isoformat()
        month_ok = self._data.get("month_key") == now.strftime("%Y-%m")
        return {
            "today_eur": round(self._data.get("day_eur", 0.0), 4) if day_ok else 0.0,
            "today_battery_eur": round(self._data.get("day_battery_eur", 0.0), 4) if day_ok else 0.0,
            "today_schedule_eur": round(self._data.get("day_schedule_eur", 0.0), 4) if day_ok else 0.0,
            "month_eur": round(self._data.get("month_eur", 0.0), 4) if month_ok else 0.0,
            "total_eur": round(self._data.get("total_eur", 0.0), 4),
        }

    # ---- sampling ----

    @callback
    def _handle_sample(self, _now) -> None:
        self.hass.async_create_task(self._async_sample())

    async def _async_sample(self) -> None:
        self._load()
        store = self._store()
        if store is None:
            return

        price = self._prices.electricity_price()
        average = self._prices.average_today()
        if price is None or average is None:
            return

        battery_eur = self._battery_sample(float(price), float(average))
        schedule_eur = self._schedule_sample(float(price), float(average))
        earned = battery_eur + schedule_eur
        if abs(earned) < 1e-9:
            # Still roll the day/month over so stale totals do not linger.
            self._rollover()
            return

        self._rollover()
        self._data["day_eur"] = self._data.get("day_eur", 0.0) + earned
        self._data["day_battery_eur"] = self._data.get("day_battery_eur", 0.0) + battery_eur
        self._data["day_schedule_eur"] = self._data.get("day_schedule_eur", 0.0) + schedule_eur
        self._data["month_eur"] = self._data.get("month_eur", 0.0) + earned
        self._data["total_eur"] = self._data.get("total_eur", 0.0) + earned
        await store.async_set_savings(self._data)

    def _rollover(self) -> None:
        now = dt_util.now()
        today = now.date().isoformat()
        month = now.strftime("%Y-%m")
        if self._data.get("day_date") != today:
            self._data["day_date"] = today
            self._data["day_eur"] = 0.0
            self._data["day_battery_eur"] = 0.0
            self._data["day_schedule_eur"] = 0.0
        if self._data.get("month_key") != month:
            self._data["month_key"] = month
            self._data["month_eur"] = 0.0

    def _battery_sample(self, price: float, average: float) -> float:
        """Value of the battery flow this quarter versus the day average."""
        store = self._store()
        sources = store.get_energy_sources() if store else {}
        entity_id = sources.get("battery_power")
        if not entity_id:
            return 0.0
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unavailable", "unknown"):
            return 0.0
        try:
            power = float(state.state)
        except (ValueError, TypeError):
            return 0.0
        unit = str(state.attributes.get("unit_of_measurement") or "")
        if unit.lower() == "kw":
            power *= 1000
        if sources.get("battery_invert"):
            power = -power
        # Convention: + discharge / - charge.
        if abs(power) < MIN_BATTERY_W:
            return 0.0
        kwh = abs(power) / 1000 * SAMPLE_HOURS
        if power < 0:  # charging
            return (average - price) * kwh
        return (price - average) * kwh  # discharging

    def _schedule_sample(self, price: float, average: float) -> float:
        """Value of schedule loads running this quarter versus the average."""
        store = self._store()
        if store is None:
            return 0.0
        registry = er.async_get(self.hass)
        earned = 0.0
        for schedule in store.get_schedules():
            if not schedule.get("enabled", True):
                continue
            try:
                load_w = float(schedule.get("load_power") or 0)
            except (ValueError, TypeError):
                continue
            if load_w <= 0:
                continue
            entity_id = registry.async_get_entity_id(
                "binary_sensor", DOMAIN, f"{DOMAIN}_schedule_{schedule['id']}"
            )
            if not entity_id:
                continue
            state = self.hass.states.get(entity_id)
            if state is None or state.state != "on":
                continue
            earned += (average - price) * (load_w / 1000) * SAMPLE_HOURS
        return earned


def async_setup_savings(hass: HomeAssistant, prices) -> SavingsTracker:
    """Create the tracker once and share it via hass.data."""
    tracker = hass.data.get(DOMAIN, {}).get("savings")
    if tracker is None:
        tracker = SavingsTracker(hass, prices)
        hass.data[DOMAIN]["savings"] = tracker
        LOGGER.debug("Smart-energy savings tracker started")
    return tracker
