"""Shared P1 energy tracking for P1MeterKit and WaterP1MeterKit."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from homeassistant.util import slugify

from ....const import (
    CONF_MAIN_FUSE_AMPS,
    CONF_MAIN_PHASES,
    CONF_PRICE_FEED_IN,
    CONF_PRICE_GAS,
    CONF_PRICE_T1,
    CONF_PRICE_T2,
    DEFAULT_MAIN_FUSE_AMPS,
    DEFAULT_MAIN_PHASES,
    DEFAULT_PRICE_FEED_IN,
    DEFAULT_PRICE_GAS,
    DEFAULT_PRICE_T1,
    DEFAULT_PRICE_T2,
    DOMAIN,
    LOGGER,
)

# Night window used to determine standby (always-on) power
STANDBY_WINDOW_START = 2  # 02:00
STANDBY_WINDOW_END = 5  # 05:00
SAFETY_SOURCE_MAX_AGE_SECONDS = 90
# In auto mode a phase entity that never reports a value within this window
# after the meter comes online is treated as absent (a one-phase connection).
PHASE_DETECTION_SECONDS = SAFETY_SOURCE_MAX_AGE_SECONDS

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
    energy_today_kwh: float | None = None
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
    # When the utility meters behind the daily and monthly values last reset
    daily_reset: datetime | None = None
    monthly_reset: datetime | None = None

    phase_max_load_pct: float | None = None
    phase_imbalance_a: float | None = None
    phase_currents: dict[str, float] = field(default_factory=dict)
    phase_count: int = 0
    observed_phase_count: int = 0
    # User-facing headroom, never below 0 W (as in 1.16.0).
    available_grid_w: float | None = None
    # Signed headroom for the guards; negative while a phase is overloaded.
    signed_available_grid_w: float | None = None
    net_source_fresh: bool = False
    net_source_age_seconds: float | None = None
    phase_source_fresh: bool = False
    phase_source_age_seconds: float | None = None


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
        source_entities: dict[str, str] | None = None,
    ) -> None:
        self.hass = hass
        self.entry = entry
        self._source_entities = source_entities or {}
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

        # Fuse-headroom tracking: remember how many phases normally report and
        # the last trustworthy headroom, so a momentarily missing phase current
        # cannot inflate the available-grid-power reading (which would let the
        # fuse guard start a load onto an already-loaded, unreported phase).
        configured_phases = str(
            entry.options.get(CONF_MAIN_PHASES, DEFAULT_MAIN_PHASES)
        )
        self._configured_phases = (
            int(configured_phases) if configured_phases in {"1", "3"} else 0
        )
        self._phase_count = self._configured_phases
        # Phases that reported a value since start. They never drop out of the
        # expected set, so a phase outage blocks the guard instead of
        # silently turning a three-phase meter into a one-phase one.
        self._seen_phases: set[str] = set()
        self._phase_detection_started: float | None = None
        self._phase_detection_done = False
        self._last_signed_available_w: float | None = None

        # Resolved utility meter entity ids, keyed by meter suffix
        self._meter_entities: dict[str, str] = {}

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
        if month == current_month and (
            self._month_peak is None or value > self._month_peak
        ):
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
        state = self._raw_state(
            getattr(self, "_source_entities", {}).get(
                suffix, f"{self._prefix}_{suffix}"
            )
        )
        if state is None:
            return None
        try:
            return float(state.state)
        except (ValueError, TypeError):
            return None

    def _value_watts(self, suffix: str) -> float | None:
        """Read a power value and normalise to watts (DSMR uses kW)."""
        state = self._raw_state(
            getattr(self, "_source_entities", {}).get(
                suffix, f"{self._prefix}_{suffix}"
            )
        )
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

    def _source_age_seconds(self, suffix: str) -> float | None:
        """Return the age of the underlying ESPHome report, not this helper."""
        entity_id = getattr(self, "_source_entities", {}).get(
            suffix, f"{self._prefix}_{suffix}"
        )
        state = self.hass.states.get(entity_id)
        if state is None:
            return None
        reported_at = max(
            state.last_updated,
            getattr(state, "last_reported", state.last_updated),
        )
        return max(0.0, (dt_util.utcnow() - reported_at).total_seconds())

    def _entity_disabled(self, entity_id: str) -> bool:
        """Return whether the registry disabled this source entity."""
        entry = er.async_get(self.hass).async_get(entity_id)
        return entry is not None and entry.disabled_by is not None

    def _phase_may_report(self, phase: int) -> bool:
        """Return whether a silent phase entity is enabled and can still report."""
        suffix = f"current_phase_{phase}"
        sources = getattr(self, "_source_entities", {})
        entity_id = sources.get(suffix, f"{self._prefix}_{suffix}")
        if suffix not in sources and self.hass.states.get(entity_id) is None:
            return False
        return not self._entity_disabled(entity_id)

    def _expected_phase_count(self, now_ts: float, observed: set[str]) -> int:
        """Return how many phases must report before headroom is trusted.

        An explicit 1 or 3 phase option is a minimum. In auto mode, phases seen
        since start always count. Enabled phase entities that have not reported
        yet also count during a short window after the meter comes online, so
        a three-phase meter is never judged on a partial first reading. After
        that window a phase that never reported is treated as absent.
        """
        self._seen_phases.update(observed)
        if self._phase_detection_started is None:
            self._phase_detection_started = now_ts
        expected = set(self._seen_phases)
        if self._configured_phases:
            return max(self._configured_phases, len(expected))
        detecting = now_ts - self._phase_detection_started < PHASE_DETECTION_SECONDS
        if not detecting and self._phase_detection_done:
            return len(expected)
        silent = {
            f"L{phase}"
            for phase in (1, 2, 3)
            if f"L{phase}" not in expected and self._phase_may_report(phase)
        }
        if detecting:
            expected |= silent
        else:
            self._phase_detection_done = True
            if silent:
                LOGGER.info(
                    "P1 phases %s never reported a value; using %d-phase fuse "
                    "headroom. Set the main connection to 3 phases to require "
                    "them",
                    ", ".join(sorted(silent)),
                    len(expected),
                )
        return len(expected)

    def _meter_entity_id(self, suffix: str) -> str:
        """Resolve the entity id of one utility meter helper.

        Home Assistant links the helper to the device of its source sensor, so
        the helper entity id gets the device slug prepended and cannot be
        rebuilt from the meter prefix. Look it up through its own config entry
        instead: the slugified helper name is exactly "<prefix>_<suffix>".
        """
        registry = er.async_get(self.hass)
        cached = self._meter_entities.get(suffix)
        if cached is not None and registry.async_get(cached) is not None:
            return cached

        wanted = f"{self._meter_prefix}_{suffix}"
        for entry in self.hass.config_entries.async_entries("utility_meter"):
            name = entry.options.get("name") or entry.title
            if slugify(str(name)) != wanted:
                continue
            for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
                self._meter_entities[suffix] = entity.entity_id
                return entity.entity_id
        # A helper whose source has no device keeps the plain slug.
        return f"sensor.{wanted}"

    def _meter_value(self, suffix: str) -> float | None:
        state = self._raw_state(self._meter_entity_id(suffix))
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
        net_sources_valid = [data.power_w is not None]
        net_ages = [self._source_age_seconds("power_consumed")]
        produced_entity = getattr(self, "_source_entities", {}).get(
            "power_produced", f"{self._prefix}_power_produced"
        )
        if (
            "power_produced" in getattr(self, "_source_entities", {})
            or self.hass.states.get(produced_entity) is not None
        ):
            net_ages.append(self._source_age_seconds("power_produced"))
            net_sources_valid.append(data.power_produced_w is not None)
        numeric_net_ages = [age for age in net_ages if age is not None]
        data.net_source_age_seconds = (
            max(numeric_net_ages) if numeric_net_ages else None
        )
        data.net_source_fresh = bool(
            data.power_w is not None
            and all(net_sources_valid)
            and len(numeric_net_ages) == len(net_ages)
            and data.net_source_age_seconds is not None
            and data.net_source_age_seconds <= SAFETY_SOURCE_MAX_AGE_SECONDS
        )
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
        if data.energy_t1 is None and data.energy_t2 is None:
            # Luxembourg firmware exposes one cumulative register instead of
            # DSMR tariff 1/2. Treat its second tariff as zero so the combined
            # HA Energy sensor remains a valid total-increasing statistic.
            combined = self._value("energy_consumed_luxembourg")
            if combined is not None:
                data.energy_t1 = combined
                data.energy_t2 = 0.0
        daily_t1 = self._meter_value("energy_daily_t1_cc")
        daily_t2 = self._meter_value("energy_daily_t2_cc")
        if daily_t1 is not None or daily_t2 is not None:
            data.energy_today_kwh = round((daily_t1 or 0.0) + (daily_t2 or 0.0), 3)
        data.energy_returned_t1 = self._value("energy_produced_tariff_1")
        if data.energy_returned_t1 is None:
            data.energy_returned_t1 = self._value("energy_returned_tariff_1")
        data.energy_returned_t2 = self._value("energy_produced_tariff_2")
        if data.energy_returned_t2 is None:
            data.energy_returned_t2 = self._value("energy_returned_tariff_2")
        if data.energy_returned_t1 is None and data.energy_returned_t2 is None:
            combined_returned = self._value("energy_produced_luxembourg")
            if combined_returned is not None:
                data.energy_returned_t1 = combined_returned
                data.energy_returned_t2 = 0.0
        data.gas_total = self._value("gas_consumed")
        if data.gas_total is None:
            # Belgian meters publish gas on OBIS 24.2.3, which the firmware
            # exposes as its own register instead of the Dutch 24.2.1 one.
            data.gas_total = self._value("gas_consumed_belgium")

        # Phase currents and load against the main fuse
        fuse = self._price(CONF_MAIN_FUSE_AMPS, DEFAULT_MAIN_FUSE_AMPS)
        currents = {}
        phase_ages: list[float] = []
        for phase in (1, 2, 3):
            amps = self._value(f"current_phase_{phase}")
            if amps is not None:
                currents[f"L{phase}"] = amps
                age = self._source_age_seconds(f"current_phase_{phase}")
                if age is not None:
                    phase_ages.append(age)
        data.phase_currents = currents
        data.observed_phase_count = len(currents)
        if len(currents) >= 2:
            data.phase_imbalance_a = round(
                max(currents.values()) - min(currents.values()), 1
            )
        if currents and fuse > 0:
            max_current = max(currents.values())
            data.phase_max_load_pct = round(max_current / fuse * 100, 1)
            # Headroom in watts before the main fuse on the tightest phase, so
            # automations can avoid switching on a big load that would trip it.
            self._phase_count = self._expected_phase_count(ts_now, set(currents))
            data.phase_count = self._phase_count
            if len(currents) >= self._phase_count:
                # All expected phases report: trust the tightest-phase headroom.
                self._last_signed_available_w = round(
                    (fuse - max_current) * 230, 0
                )
            # A missing phase never inflates the headroom: hold the last
            # trustworthy value, marked stale through phase_source_fresh.
            data.signed_available_grid_w = self._last_signed_available_w
            if data.signed_available_grid_w is not None:
                data.available_grid_w = max(0.0, data.signed_available_grid_w)
            data.phase_source_age_seconds = max(phase_ages) if phase_ages else None
            data.phase_source_fresh = bool(
                len(phase_ages) == len(currents)
                and len(currents) >= self._phase_count
                and data.phase_source_age_seconds is not None
                and data.phase_source_age_seconds <= SAFETY_SOURCE_MAX_AGE_SECONDS
            )

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
                    avg = sum(s[1] for s in self._power_samples) / len(
                        self._power_samples
                    )
                    candidate = avg / 1000

        month = now.strftime("%Y-%m")
        if self._peak_month != month:
            self._month_peak = None
            self._peak_month = month
        if candidate is not None and (
            self._month_peak is None or candidate > self._month_peak
        ):
            self._month_peak = round(candidate, 3)
        data.month_peak_kw = self._month_peak
        data.peak_month = self._peak_month

        # ---- Standby power (minimum during the night window) ----
        today = now.strftime("%Y-%m-%d")
        if STANDBY_WINDOW_START <= now.hour < STANDBY_WINDOW_END:
            if self._window_day != today:
                self._window_day = today
                self._window_min = None
            if (
                data.power_w is not None
                and data.power_w > 0
                and (self._window_min is None or data.power_w < self._window_min)
            ):
                self._window_min = data.power_w
        elif (
            now.hour >= STANDBY_WINDOW_END
            and self._window_day == today
            and self._window_min is not None
        ):
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
            data.standby_cost_year = round(
                self._standby_w / 1000 * 24 * 365 * avg_price, 0
            )

        # ---- Costs from the daily/monthly utility meters ----
        data.cost_today = self._cost_for_cycle(
            "daily", price_t1, price_t2, price_feed, price_gas
        )
        data.cost_month = self._cost_for_cycle(
            "monthly", price_t1, price_t2, price_feed, price_gas
        )
        data.daily_reset = self._cycle_reset("daily")
        data.monthly_reset = self._cycle_reset("monthly")

        self.data = data
        return data

    def _cycle_reset(self, cycle: str) -> datetime | None:
        """When the utility meters of a daily or monthly cycle last reset.

        The daily and monthly values are read from these helpers, so their own
        last_reset keeps a value and its reset from ever belonging to
        different periods, even when the helpers reset a moment after or
        before this update.
        """
        resets = []
        for suffix in (
            f"energy_{cycle}_t1_cc",
            f"energy_{cycle}_t2_cc",
            f"energy_returned_{cycle}_t1_cc",
            f"energy_returned_{cycle}_t2_cc",
            f"gas_{cycle}_cc",
        ):
            state = self._raw_state(self._meter_entity_id(suffix))
            if state is None:
                continue
            reset = dt_util.parse_datetime(
                str(state.attributes.get("last_reset") or "")
            )
            if reset is not None:
                resets.append(reset)
        return max(resets, default=None)

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
