"""Dynamic energy price coordinator.

Polls the SmartHomeShop.io account API (api.smarthomeshop.io) for spot
energy prices using the user's personal API token, and exposes the current
price plus today/tomorrow arrays. One instance per Home Assistant, shared by
all devices (the API key is account-wide, not per device).
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any
from urllib.parse import urlparse

import aiohttp

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .const import DOMAIN, LOGGER, resolve_api_base_url

PRICES_PATH = "/api/v1/energy/prices"
CONTRACTS_PATH = "/api/v1/energy/contracts"
UPDATE_INTERVAL = timedelta(minutes=30)
REQUEST_TIMEOUT = 30
ACCOUNT_CHECK_TIMEOUT = 8


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
        # ISO timestamp of the last successful sync with the account API.
        self.last_synced: str | None = None
        self.last_error: str | None = None
        # Push a fresh state to all price entities at the top of every hour:
        # the current-hour row changes then, independent of the 30-min poll.
        from homeassistant.helpers.event import async_track_time_change

        async_track_time_change(hass, self._handle_hour_tick, minute=0, second=5)

    @callback
    def _handle_hour_tick(self, _now) -> None:
        self.async_update_listeners()

    @property
    def update_interval_minutes(self) -> int:
        return int(UPDATE_INTERVAL.total_seconds() // 60)

    def _account(self) -> dict[str, Any]:
        store = self.hass.data.get(DOMAIN, {}).get("store")
        return store.get_account() if store else {}

    @property
    def has_key(self) -> bool:
        return bool(self._account().get("api_key"))

    @property
    def base_url(self) -> str:
        return resolve_api_base_url(self._account().get("base_url"))

    @property
    def contract_id(self) -> str | None:
        value = self._account().get("contract_id")
        return str(value) if value not in (None, "") else None

    @property
    def location_id(self) -> str | None:
        value = self._account().get("location_id")
        return str(value) if value not in (None, "") else None

    def _ssl_option(self, url: str):
        """Return an aiohttp ssl arg; disable verification for local dev hosts."""
        hostname = (urlparse(url).hostname or "").lower()
        if hostname in {
            "localhost",
            "127.0.0.1",
            "::1",
            "host-gateway",
        } or hostname.endswith(".test"):
            return False
        return None  # default (verify)

    async def _async_update_data(self) -> dict[str, Any]:
        account = self._account()
        api_key = account.get("api_key")
        if not api_key:
            self.status = "unconfigured"
            self.last_error = None
            return {}

        url = f"{self.base_url}{PRICES_PATH}"
        # A pinned contract wins over a location (matching the server, which
        # checks ?contract= before ?location=); with neither the server uses
        # the account's active contract for today.
        params = {}
        if self.contract_id:
            params["contract"] = self.contract_id
        elif self.location_id:
            params["location"] = self.location_id
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        }
        try:
            async with self._session.get(
                url,
                params=params,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
                ssl=self._ssl_option(url),
            ) as resp:
                if resp.status == 401:
                    self.status = "unauthorized"
                    self.last_error = "The API key is invalid or was revoked."
                    raise UpdateFailed("Invalid or revoked API key")
                if resp.status == 403:
                    # Prices are on the free tier, so a 403 here is a token
                    # ability/permission problem, not a subscription issue.
                    self.status = "forbidden"
                    self.last_error = (
                        "This API key is not allowed to read prices. "
                        "Create a new key in your SmartHomeShop account."
                    )
                    raise UpdateFailed("API key lacks the prices permission")
                if resp.status == 422:
                    # No active contract for the selected location. This is an
                    # expected, user-fixable state, not a service error, so it
                    # keeps its own status and does not spam the logs. Clear
                    # stale price data so nothing renders a wrong tariff.
                    body = {}
                    try:
                        parsed = await resp.json()
                        if isinstance(parsed, dict):
                            body = parsed
                    except (aiohttp.ClientError, ValueError):
                        pass
                    if body.get("code") == "energy_contract_required":
                        self.status = "no_contract"
                        self.last_error = (
                            "No active energy contract for the selected location. "
                            "Connect one in your SmartHomeShop account."
                        )
                        return {}
                    self.status = "error"
                    self.last_error = "The price service rejected the request (HTTP 422)."
                    raise UpdateFailed("HTTP 422")
                if resp.status != 200:
                    self.status = "error"
                    self.last_error = f"The price service returned HTTP {resp.status}."
                    raise UpdateFailed(f"HTTP {resp.status}")
                data = await resp.json()
        except UpdateFailed:
            raise
        except TimeoutError as err:
            self.status = "error"
            self.last_error = (
                f"The price service did not respond within {REQUEST_TIMEOUT} seconds."
            )
            raise UpdateFailed(self.last_error) from err
        except aiohttp.ClientConnectorCertificateError as err:
            self.status = "error"
            self.last_error = "The TLS certificate of the price service could not be verified."
            raise UpdateFailed(self.last_error) from err
        except aiohttp.ClientError as err:
            self.status = "error"
            self.last_error = "Could not connect to the dynamic energy price service."
            raise UpdateFailed(f"{self.last_error} {err}") from err
        except ValueError as err:  # invalid JSON body on a 200 response
            self.status = "error"
            self.last_error = "The price service returned an invalid response."
            raise UpdateFailed(f"Invalid JSON response: {err}") from err

        if not isinstance(data, dict):
            self.status = "error"
            self.last_error = "The price service returned an unexpected response."
            raise UpdateFailed("Unexpected response format")

        self.status = "ok"
        self.last_error = None
        self.last_synced = dt_util.utcnow().isoformat()
        return data or {}

    # ---- Convenience accessors for sensors / panel ----

    @staticmethod
    def _float_or_none(value: Any) -> float | None:
        """Only accept real numbers from the API; never a bool or string."""
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return None
        return float(value)

    def _elec(self) -> dict[str, Any]:
        return (self.data or {}).get("electricity") or {}

    def current_electricity(self) -> dict[str, Any] | None:
        # Select the row for the CURRENT hour locally instead of trusting the
        # server-computed "current": with a 30-minute poll interval the server
        # value can be up to 30 minutes stale after each hour change.
        from homeassistant.util import dt as dt_util

        now = dt_util.now()
        for row in self.today() + self.tomorrow():
            start = dt_util.parse_datetime(str(row.get("start")))
            if start is None:
                continue
            if start.tzinfo is None:
                start = start.replace(tzinfo=dt_util.get_default_time_zone())
            if start <= now < start + timedelta(hours=1):
                return row
        return self._elec().get("current")

    def electricity_price(self) -> float | None:
        cur = self.current_electricity()
        return self._float_or_none(cur.get("consumer")) if cur else None

    def electricity_market_price(self) -> float | None:
        cur = self.current_electricity()
        return self._float_or_none(cur.get("market")) if cur else None

    def electricity_feed_in(self) -> float | None:
        cur = self.current_electricity()
        return self._float_or_none(cur.get("feed_in")) if cur else None

    def electricity_level(self) -> str | None:
        return self._elec().get("level")

    def gas_price(self) -> float | None:
        gas = (self.data or {}).get("gas") or {}
        cur = gas.get("current") or {}
        return self._float_or_none(cur.get("consumer"))

    def today(self) -> list[dict[str, Any]]:
        return self._elec().get("today") or []

    def tomorrow(self) -> list[dict[str, Any]]:
        return self._elec().get("tomorrow") or []

    def forecast(self) -> list[dict[str, Any]]:
        """Return the confirmed and predicted hourly price horizon."""
        return self._elec().get("forecast") or []

    def forecast_meta(self) -> dict[str, Any]:
        """Return metadata describing the available forecast horizon."""
        return self._elec().get("forecast_meta") or {}

    def contract(self) -> dict[str, Any] | None:
        return (self.data or {}).get("contract")

    def contract_active(self) -> bool:
        """True when a contract is connected and its prices apply."""
        return self.status == "ok" and self.contract() is not None

    def contract_tariffs(self) -> dict[str, Any]:
        """Per-unit prices from the connected contract (empty if none)."""
        contract = self.contract()
        return (contract or {}).get("tariffs") or {}

    def contract_price(self, key: str) -> float | None:
        """A single contract tariff (electricity_t1/t2, feed_in, gas, water).

        Returns None when no contract is connected or the value is unset, so
        callers can fall back to the user's own configured price.
        """
        if not self.contract_active():
            return None
        return self._float_or_none(self.contract_tariffs().get(key))

    def _summary(self) -> dict[str, Any]:
        return (self.data or {}).get("summary") or {}

    def average_today(self) -> float | None:
        return self._float_or_none(self._summary().get("average_today"))

    def lowest_today(self) -> float | None:
        return self._float_or_none(self._summary().get("lowest_today"))

    def highest_today(self) -> float | None:
        return self._float_or_none(self._summary().get("highest_today"))

    def cheap_now(self) -> bool | None:
        return self._summary().get("cheap_now")

    def difference_from_average(self) -> float | None:
        data = self._summary().get("current_vs_average") or {}
        return self._float_or_none(data.get("amount"))

    def difference_percentage_from_average(self) -> float | None:
        data = self._summary().get("current_vs_average") or {}
        return self._float_or_none(data.get("percentage"))

    def current_price_rank(self) -> int | None:
        data = self._summary().get("current_rank") or {}
        value = data.get("position")
        return value if isinstance(value, int) and not isinstance(value, bool) else None

    def ranked_price_hours(self) -> int | None:
        data = self._summary().get("current_rank") or {}
        value = data.get("total")
        return value if isinstance(value, int) and not isinstance(value, bool) else None

    def lowest_period(self) -> dict[str, Any] | None:
        return self._summary().get("lowest_period")

    def highest_period(self) -> dict[str, Any] | None:
        return self._summary().get("highest_period")

    def next_lower_period(self) -> dict[str, Any] | None:
        return self._summary().get("next_lower_period")

    def price_spread_today(self) -> float | None:
        return self._float_or_none(self._summary().get("price_spread_today"))

    def negative_hours_today(self) -> int | None:
        value = self._summary().get("negative_hours_today")
        return value if isinstance(value, int) and not isinstance(value, bool) else None

    def cheapest_block(self, hours: int) -> dict[str, Any] | None:
        return (self._summary().get("cheapest_blocks") or {}).get(str(hours))

    def forecast_cheapest_block(self, hours: int) -> dict[str, Any] | None:
        """Return the cheapest block across the full forecast horizon."""
        return (self._summary().get("forecast_cheapest_blocks") or {}).get(
            str(hours)
        )

    async def _async_fetch_contracts(
        self, *, update_status: bool
    ) -> tuple[bool, list[dict[str, Any]], list[dict[str, Any]]]:
        """Fetch contracts and locations, optionally validating the account."""
        account = self._account()
        api_key = account.get("api_key")
        if not api_key:
            if update_status:
                self.status = "unconfigured"
                self.last_error = None
            return False, [], []
        url = f"{self.base_url}{CONTRACTS_PATH}"
        headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
        try:
            async with self._session.get(
                url,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=ACCOUNT_CHECK_TIMEOUT),
                ssl=self._ssl_option(url),
            ) as resp:
                if resp.status == 401:
                    if update_status:
                        self.status = "unauthorized"
                        self.last_error = "The API key is invalid or was revoked."
                    return False, [], []
                if resp.status == 403:
                    if update_status:
                        self.status = "forbidden"
                        self.last_error = "This account cannot access dynamic energy prices."
                    return False, [], []
                if resp.status != 200:
                    if update_status:
                        self.status = "error"
                        self.last_error = (
                            f"The account service returned HTTP {resp.status}."
                        )
                    return False, [], []
                data = await resp.json()
                if not isinstance(data, dict):
                    if update_status:
                        self.status = "error"
                        self.last_error = "The account service returned an invalid response."
                    return False, [], []
                contracts = data.get("contracts", []) or []
                locations = data.get("locations", []) or []
                if update_status:
                    self.status = "ok"
                    self.last_error = None
                return (
                    True,
                    contracts if isinstance(contracts, list) else [],
                    locations if isinstance(locations, list) else [],
                )
        except TimeoutError:
            if update_status:
                self.status = "error"
                self.last_error = (
                    "The account service did not respond within "
                    f"{ACCOUNT_CHECK_TIMEOUT} seconds."
                )
        except aiohttp.ClientConnectorCertificateError:
            if update_status:
                self.status = "error"
                self.last_error = (
                    "The TLS certificate of the account service could not be verified."
                )
        except aiohttp.ClientError:
            if update_status:
                self.status = "error"
                self.last_error = "Could not connect to the SmartHomeShop account service."
        except ValueError:
            if update_status:
                self.status = "error"
                self.last_error = "The account service returned an invalid response."
        return False, [], []

    async def async_validate_account(self) -> bool:
        """Validate the configured token without waiting for a full forecast."""
        valid, _, _ = await self._async_fetch_contracts(update_status=True)
        return valid

    async def async_fetch_contracts(self) -> dict[str, list[dict[str, Any]]]:
        """Fetch the user's contracts and locations (for the panel picker)."""
        _, contracts, locations = await self._async_fetch_contracts(
            update_status=False
        )
        return {"contracts": contracts, "locations": locations}
