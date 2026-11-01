"""Solar forecast from the SmartHomeShop account, on plans with API access."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from . import energy_api
from .const import DOMAIN, LOGGER
from .price_coordinator import REQUEST_TIMEOUT, PriceCoordinator

SOLAR_FORECAST_PATH = "/api/v1/energy/solar-forecast"
UPDATE_INTERVAL = timedelta(minutes=60)


def _hour_key(stamp: Any) -> str | None:
    """Return the UTC hour of an ISO timestamp, the unit the planner works in."""
    try:
        parsed = datetime.fromisoformat(str(stamp).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(timezone.utc).strftime("%Y-%m-%dT%H")


def hourly_kw(rows: list[dict[str, Any]]) -> dict[str, float]:
    """Return the forecast power per UTC hour in kW."""
    by_hour: dict[str, float] = {}
    for row in rows:
        key = _hour_key(row.get("timestamp"))
        power = energy_api.number(row.get("power_w"))
        if key is None or power is None:
            continue
        # Sunrise and sunset get their own row inside an hour, at 0 W. They
        # must not replace the production of that hour.
        by_hour[key] = max(by_hour.get(key, 0.0), power / 1000)
    return by_hour


class SolarForecastCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Poll the account forecast, separate from prices so it cannot affect them."""

    def __init__(self, hass: HomeAssistant, prices: PriceCoordinator) -> None:
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_solar_forecast",
            update_interval=UPDATE_INTERVAL,
        )
        self.prices = prices
        self._session = async_get_clientsession(hass)

    @property
    def available(self) -> bool:
        return energy_api.mapping(self.data).get("available") is True

    def rows(self) -> list[dict[str, Any]]:
        return energy_api.rows(energy_api.mapping(self.data).get("hourly"))

    def series(self, starts: list[str]) -> list[float] | None:
        """Return the forecast in kW for each planning period."""
        if not self.available:
            return None
        by_hour = hourly_kw(self.rows())
        if not by_hour:
            return None
        return [by_hour.get(_hour_key(start) or "", 0.0) for start in starts]

    async def _async_update_data(self) -> dict[str, Any]:
        if not self.prices.has_key:
            return {}
        url = f"{self.prices.base_url}{SOLAR_FORECAST_PATH}"
        location = self.prices.location_id
        api_key = self.prices._account().get("api_key")
        try:
            async with self._session.get(
                url,
                params={"location_id": location} if location else {},
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Accept": "application/json",
                },
                timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
                ssl=self.prices._ssl_option(url),
            ) as resp:
                # No forecast for this account: the plan has no API access, the
                # key does not cover it, or the App has no solar installation.
                if resp.status in (401, 403, 404):
                    return {}
                if resp.status != 200:
                    raise UpdateFailed(f"HTTP {resp.status}")
                data = await resp.json()
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            raise UpdateFailed(f"Solar forecast request failed: {err}") from err
        return energy_api.mapping(data)
