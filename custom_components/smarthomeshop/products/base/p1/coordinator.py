"""Shared P1 energy tracking for P1MeterKit and WaterP1MeterKit."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from ....const import (
    CONF_MAIN_FUSE_AMPS,
    CONF_PRICE_FEED_IN,
    CONF_PRICE_GAS,
    CONF_PRICE_T1,
    CONF_PRICE_T2,
    DEFAULT_MAIN_FUSE_AMPS,
    DEFAULT_PRICE_FEED_IN,
    DEFAULT_PRICE_GAS,
    DEFAULT_PRICE_T1,
    DEFAULT_PRICE_T2,
    DOMAIN,
    LOGGER,
)

# Night window used to determine standby (always-on) power
STANDBY_WINDOW_START = 2  # 02:00
STANDBY_WINDOW_END = 5    # 05:00

# Maps a local price option to the matching tariff key from a connected
# contract, so a connected contract drives the cost sensors too.
CONTRACT_TARIFF_KEYS = {
    CONF_PRICE_T1: "electricity_t1",
    CONF_PRICE_T2: "electricity_t2",
    CONF_PRICE_FEED_IN: "feed_in",
    CONF_PRICE_GAS: "gas",
}


@dataclass
class EnergyData:
    """Computed P1 energy data shared by P1MeterKit and WaterP1MeterKit."""

    power_w: float | None = None
    power_produced_w: float | None = None
    net_power_w: float | None = None
    energy_t1: float | None = None
    energy_t2: float | None = None
    energy_returned_t1: float | None = None
    energy_returned_t2: float | None = None
    gas_total: float | None = None

    avg_demand_kw: float | None = None
    month_peak_kw: float | None = None
    peak_month: str = ""

    standby_w: float | None = None
    standby_day: str = ""
    standby_cost_year: float | None = None

    cost_today: float | None = None
    cost_month: float | None = None

    phase_max_load_pct: float | None = None
    phase_currents: dict[str, float] = field(default_factory=dict)
    available_grid_w: float | None = None


class EnergyTracker:
    """Reads P1 sensors and computes standby, month peak and cost values.

    entity_prefix: ESPHome entity prefix, e.g. "sensor.p1meterkit_776c6c"
    meter_prefix:  utility meter slug prefix, e.g. "p1_776c6c" or "waterp1_776c6c"
    """

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        entity_prefix: str,
        meter_prefix: str,
    ) -> None:
        self.hass = hass
        self.entry = entry
        self._prefix = entity_prefix
        self._meter_prefix = meter_prefix

        self.data = EnergyData()

        # 15-minute rolling window for peak calculation when the meter
        # does not provide DSMR "current average demand"
        self._power_samples: deque[tuple[float, float]] = deque()

        # (timestamp, watts) samples of the last ~20 minutes for the panel graph
        self._power_history: list[tuple[float, float]] = []

        self._month_peak: float | None = None
        self._peak_month = ""
        self._standby_w: float | None = None
        self._standby_day = ""
        self._window_min: float | None = None
        self._window_day = ""

        # Best-effort defaults from the HA Energy Dashboard (loaded once)
        self._ha_prices: dict[str, float] = {}
        self._ha_prices_loaded = False

    async def async_load_ha_prices(self) -> None:
        """Load HA Energy Dashboard static prices to use as price defaults."""
        if self._ha_prices_loaded:
            return
        from ....energy_prices import async_ha_energy_prices

        self._ha_prices = await async_ha_energy_prices(self.hass)
        self._ha_prices_loaded = True

    @property
    def power_history(self) -> list[tuple[float, float]]:
        """(timestamp, watts) samples of the last ~20 minutes."""
        return self._power_history

    # ---- persistence hooks (called by RestoreSensor entities) ----

    def restore_month_peak(self, value: float, month: str) -> None:
        """Restore the month peak after a Home Assistant restart."""
        current_month = dt_util.now().strftime("%Y-%m")
        if month == current_month and (self._month_peak is None or value > self._month_peak):
            self._month_peak = value
            self._peak_month = month

    def restore_standby(self, value: float, day: str) -> None:
        """Restore the standby power after a Home Assistant restart."""
        if self._standby_w is None:
            self._standby_w = value
            self._standby_day = day

    # ---- sensor helpers ----

    def _raw_state(self, entity_id: str):
        state = self.hass.states.get(entity_id)
        if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN, ""):
            return None
        return state

    def _value(self, suffix: str) -> float | None:
        state = self._raw_state(f"{self._prefix}_{suffix}")
        if state is None:
            return None
        try:
            return float(state.state)
        except (ValueError, TypeError):
            return None

    def _value_watts(self, suffix: str) -> float | None:
        """Read a power value and normalise to watts (DSMR uses kW)."""
        state = self._raw_state(f"{self._prefix}_{suffix}")
        if state is None:
            return None
        try:
            value = float(state.state)
        except (ValueError, TypeError):
            return None
        unit = (state.attributes.get("unit_of_measurement") or "").lower()
        if unit == "kw":
            return value * 1000
        return value

    def _meter_value(self, suffix: str) -> float | None:
        state = self._raw_state(f"sensor.{self._meter_prefix}_{suffix}")
        if state is None:
            return None
        try:
            return float(state.state)
        except (ValueError, TypeError):
            return None

    def _price(self, key: str, default: float) -> float:
        # A connected energy contract is the single source of truth: it drives
        # the cost sensors so prices only need to be set in one place.
        contract_price = self._contract_price(key)
        if contract_price is not None:
            return contract_price
        value = self.entry.options.get(key)
        if value in (None, ""):
            value = self._ha_prices.get(key, default)
        try:
            return float(value)
        except (ValueError, TypeError):
            return default

    def _contract_price(self, key: str) -> float | None:
        tariff_key = CONTRACT_TARIFF_KEYS.get(key)
        if tariff_key is None:
            return None
        prices = self.hass.data.get(DOMAIN, {}).get("prices")
        if prices is None:
            return None
        return prices.contract_price(tariff_key)

    # ---- main update ----

    def update(self) -> EnergyData:
        data = EnergyData()
        now = dt_util.now()

        data.power_w = self._value_watts("power_consumed")
        data.power_produced_w = self._value_watts("power_produced")
        if data.power_w is not None:
            produced = data.power_produced_w or 0.0
            data.net_power_w = data.power_w - produced

        # Keep a short power history for the panel graph (last ~20 min)
        ts_now = now.timestamp()
        self._power_history.append((ts_now, data.power_w or 0.0))
        cutoff = ts_now - 1200
        self._power_history = [s for s in self._power_history if s[0] >= cutoff]

        data.energy_t1 = self._value("energy_consumed_tariff_1")
        data.energy_t2 = self._value("energy_consumed_tariff_2")
        data.energy_returned_t1 = self._value("energy_produced_tariff_1")
        if data.energy_returned_t1 is None:
            data.energy_returned_t1 = self._value("energy_returned_tariff_1")
        data.energy_returned_t2 = self._value("energy_produced_tariff_2")
        if data.energy_returned_t2 is None:
            data.energy_returned_t2 = self._value("energy_returned_tariff_2")
        data.gas_total = self._value("gas_consumed")

        # Phase currents and load against the main fuse
        fuse = self._price(CONF_MAIN_FUSE_AMPS, DEFAULT_MAIN_FUSE_AMPS)
        currents = {}
        for phase in (1, 2, 3):
            amps = self._value(f"current_phase_{phase}")
            if amps is not None:
                currents[f"L{phase}"] = amps
        data.phase_currents = currents
        if currents and fuse > 0:
            max_current = max(currents.values())
            data.phase_max_load_pct = round(max_current / fuse * 100, 1)
            # Headroom in watts before the main fuse on the tightest phase, so
            # automations can avoid switching on a big load that would trip it.
            data.available_grid_w = round(max(0.0, fuse - max_current) * 230, 0)

        # ---- Month peak (quarter-hour average power) ----
        avg_demand = self._value_watts("current_average_demand")
        if avg_demand is not None:
            data.avg_demand_kw = round(avg_demand / 1000, 3)
            candidate = avg_demand / 1000
        else:
            # Fallback: rolling 15-minute average of the live power
            candidate = None
            if data.power_w is not None:
                ts = now.timestamp()
                self._power_samples.append((ts, data.power_w))
                while self._power_samples and ts - self._power_samples[0][0] > 900:
                    self._power_samples.popleft()
                # Require at least ~5 minutes of samples before trusting the average
                if self._power_samples and ts - self._power_samples[0][0] > 300:
                    avg = sum(s[1] for s in self._power_samples) / len(self._power_samples)
                    candidate = avg / 1000

        month = now.strftime("%Y-%m")
        if self._peak_month != month:
            self._month_peak = None
            self._peak_month = month
        if candidate is not None and (self._month_peak is None or candidate > self._month_peak):
            self._month_peak = round(candidate, 3)
        data.month_peak_kw = self._month_peak
        data.peak_month = self._peak_month

        # ---- Standby power (minimum during the night window) ----
        today = now.strftime("%Y-%m-%d")
        if STANDBY_WINDOW_START <= now.hour < STANDBY_WINDOW_END:
            if self._window_day != today:
                self._window_day = today
                self._window_min = None
            if data.power_w is not None and data.power_w > 0:
                if self._window_min is None or data.power_w < self._window_min:
                    self._window_min = data.power_w
        elif now.hour >= STANDBY_WINDOW_END and self._window_day == today and self._window_min is not None:
            self._standby_w = round(self._window_min, 1)
            self._standby_day = today
            self._window_min = None
            self._window_day = ""
            LOGGER.debug("Standby power for %s: %.1f W", today, self._standby_w)

        data.standby_w = self._standby_w
        data.standby_day = self._standby_day

        price_t1 = self._price(CONF_PRICE_T1, DEFAULT_PRICE_T1)
        price_t2 = self._price(CONF_PRICE_T2, DEFAULT_PRICE_T2)
        price_feed = self._price(CONF_PRICE_FEED_IN, DEFAULT_PRICE_FEED_IN)
        price_gas = self._price(CONF_PRICE_GAS, DEFAULT_PRICE_GAS)

        if self._standby_w is not None:
            avg_price = (price_t1 + price_t2) / 2
            data.standby_cost_year = round(self._standby_w / 1000 * 24 * 365 * avg_price, 0)

        # ---- Costs from the daily/monthly utility meters ----
        data.cost_today = self._cost_for_cycle("daily", price_t1, price_t2, price_feed, price_gas)
        data.cost_month = self._cost_for_cycle("monthly", price_t1, price_t2, price_feed, price_gas)

        self.data = data
        return data

    def _cost_for_cycle(
        self,
        cycle: str,
        price_t1: float,
        price_t2: float,
        price_feed: float,
        price_gas: float,
    ) -> float | None:
        t1 = self._meter_value(f"energy_{cycle}_t1_cc")
        t2 = self._meter_value(f"energy_{cycle}_t2_cc")
        if t1 is None and t2 is None:
            return None
        cost = (t1 or 0.0) * price_t1 + (t2 or 0.0) * price_t2

        r1 = self._meter_value(f"energy_returned_{cycle}_t1_cc")
        r2 = self._meter_value(f"energy_returned_{cycle}_t2_cc")
        cost -= ((r1 or 0.0) + (r2 or 0.0)) * price_feed

        gas = self._meter_value(f"gas_{cycle}_cc")
        if gas is not None:
            cost += gas * price_gas

        return round(cost, 2)
