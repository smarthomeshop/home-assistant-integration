"""Home Assistant coordinator for the SmartHomeShop battery planner."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .battery_planner import build_battery_plan, empty_plan, normalize_hourly_kw
from .const import DOMAIN, LOGGER
from .price_coordinator import PriceCoordinator


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

    def _config(self) -> dict[str, Any]:
        store = self.hass.data.get(DOMAIN, {}).get("store")
        return store.get_battery() if store else {}

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

    async def _async_update_data(self) -> dict[str, Any]:
        config = self._config()
        if not config.get("enabled"):
            return empty_plan("disabled", "Battery planning is disabled")
        forecast = self.prices.forecast()
        starts = [str(item.get("start") or "") for item in forecast]
        soc = self._state_number(config.get("soc_sensor"))
        solar = self._forecast_series(config.get("pv_forecast_sensor"), starts)
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
        return build_battery_plan(
            forecast,
            config,
            soc,
            solar_forecast=solar,
            load_forecast=load,
            now=dt_util.utcnow(),
        )
