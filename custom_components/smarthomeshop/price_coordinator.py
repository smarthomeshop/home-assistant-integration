"""Dynamic energy price coordinator.

Polls the SmartHomeShop.io account API (api.smarthomeshop.io) for spot
energy prices using the user's personal API token, and exposes the current
price plus today/tomorrow arrays. One instance per Home Assistant, shared by
all devices (the API key is account-wide, not per device).
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import DOMAIN, LOGGER

DEFAULT_BASE_URL = "https://api.smarthomeshop.io"
PRICES_PATH = "/api/v1/energy/prices"
UPDATE_INTERVAL = timedelta(minutes=30)
REQUEST_TIMEOUT = 20


class PriceCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Fetch dynamic energy prices from the SmartHomeShop account API."""

    def __init__(self, hass: HomeAssistant) -> None:
        super().__init__(
            hass,
            LOGGER,
            name=f"{DOMAIN}_prices",
            update_interval=UPDATE_INTERVAL,
        )
        self._session = async_get_clientsession(hass)
        # Connection status for the panel: unconfigured | ok | unauthorized |
        # forbidden | error
        self.status: str = "unconfigured"
        self.account_email: str | None = None

    def _account(self) -> dict[str, Any]:
        store = self.hass.data.get(DOMAIN, {}).get("store")
        return store.get_account() if store else {}

    @property
    def has_key(self) -> bool:
        return bool(self._account().get("api_key"))

    @property
    def base_url(self) -> str:
        return (self._account().get("base_url") or DEFAULT_BASE_URL).rstrip("/")

    def _ssl_option(self, url: str):
        """Return an aiohttp ssl arg; disable verification for local dev hosts."""
        lowered = url.lower()
        if any(
            token in lowered
            for token in (".test/", "://localhost", "127.0.0.1", "host-gateway", ".local/")
        ):
            return False
        return None  # default (verify)

    async def _async_update_data(self) -> dict[str, Any]:
        account = self._account()
        api_key = account.get("api_key")
        if not api_key:
            self.status = "unconfigured"
            return {}

        url = f"{self.base_url}{PRICES_PATH}"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        }
        try:
            async with self._session.get(
                url,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
                ssl=self._ssl_option(url),
            ) as resp:
                if resp.status == 401:
                    self.status = "unauthorized"
                    raise UpdateFailed("Invalid or revoked API key")
                if resp.status == 403:
                    self.status = "forbidden"
                    raise UpdateFailed("API subscription tier required")
                if resp.status != 200:
                    self.status = "error"
                    raise UpdateFailed(f"HTTP {resp.status}")
                data = await resp.json()
        except UpdateFailed:
            raise
        except (aiohttp.ClientError, TimeoutError) as err:
            self.status = "error"
            raise UpdateFailed(f"Connection error: {err}") from err

        self.status = "ok"
        return data or {}

    # ---- Convenience accessors for sensors / panel ----

    def _elec(self) -> dict[str, Any]:
        return (self.data or {}).get("electricity") or {}

    def current_electricity(self) -> dict[str, Any] | None:
        return self._elec().get("current")

    def electricity_price(self) -> float | None:
        cur = self.current_electricity()
        return cur.get("consumer") if cur else None

    def electricity_market_price(self) -> float | None:
        cur = self.current_electricity()
        return cur.get("market") if cur else None

    def electricity_feed_in(self) -> float | None:
        cur = self.current_electricity()
        return cur.get("feed_in") if cur else None

    def electricity_level(self) -> str | None:
        return self._elec().get("level")

    def gas_price(self) -> float | None:
        gas = (self.data or {}).get("gas") or {}
        cur = gas.get("current") or {}
        return cur.get("consumer")

    def today(self) -> list[dict[str, Any]]:
        return self._elec().get("today") or []

    def tomorrow(self) -> list[dict[str, Any]]:
        return self._elec().get("tomorrow") or []
