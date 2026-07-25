"""Energy contract and price coordinator.

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
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from . import energy_api
from .const import DOMAIN, LOGGER, resolve_api_base_url
from .tariff_resolver import normalise_tariff_code

PRICES_PATH = "/api/v1/energy/prices"
CONTRACTS_PATH = "/api/v1/energy/contracts"
UPDATE_INTERVAL = timedelta(minutes=60)
REQUEST_TIMEOUT = 30
ACCOUNT_CHECK_TIMEOUT = 8


class PriceCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Fetch resolved energy prices from the SmartHomeShop account API."""

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
        self._tariff_entity_id: str | None = None
        self._tariff_unsubscribe = None
        # Update locally when a price period rolls over, independently of the
        # API poll. Hourly contracts only change on the first item in the list.
        from homeassistant.helpers.event import async_track_time_change

        async_track_time_change(
            hass, self._handle_period_tick, minute=[0, 15, 30, 45], second=5
        )
        self.async_refresh_tariff_source()

    @callback
    def _handle_period_tick(self, _now) -> None:
        self.async_update_listeners()

    @callback
    def _handle_tariff_change(self, _event) -> None:
        """Publish a new current price as soon as the P1 tariff changes."""
        self.async_update_listeners()

    @callback
    def async_refresh_tariff_source(self) -> None:
        """Follow the tariff indicator of the P1 meter selected for Energy."""
        entity_id = self._find_tariff_entity_id()
        if entity_id == self._tariff_entity_id:
            return
        if self._tariff_unsubscribe is not None:
            self._tariff_unsubscribe()
            self._tariff_unsubscribe = None
        self._tariff_entity_id = entity_id
        if entity_id:
            self._tariff_unsubscribe = async_track_state_change_event(
                self.hass, [entity_id], self._handle_tariff_change
            )
        self.async_update_listeners()

    def _find_tariff_entity_id(self) -> str | None:
        """Find an electricity-tariff entity on the selected P1 device."""
        store = self.hass.data.get(DOMAIN, {}).get("store")
        sources = store.get_energy_sources() if store else {}
        selected_device = sources.get("p1_device")
        registry = er.async_get(self.hass)
        candidates = [
            entry.entity_id
            for entry in registry.entities.values()
            if entry.entity_id.startswith("sensor.")
            and "electricity_tariff" in entry.entity_id
            and entry.disabled_by is None
            and (not selected_device or entry.device_id == selected_device)
        ]
        if selected_device:
            return sorted(candidates)[0] if candidates else None

        # With no explicit selection, auto-resolve only when exactly one P1
        # tariff indicator exists. Multiple meters require a deliberate pick.
        all_candidates = [
            entry.entity_id
            for entry in registry.entities.values()
            if entry.entity_id.startswith("sensor.")
            and "electricity_tariff" in entry.entity_id
            and entry.disabled_by is None
        ]
        return all_candidates[0] if len(all_candidates) == 1 else None

    def active_tariff_entity_id(self) -> str | None:
        return self._tariff_entity_id

    def active_tariff_raw(self) -> str | None:
        state = (
            self.hass.states.get(self._tariff_entity_id)
            if self._tariff_entity_id
            else None
        )
        return str(state.state) if state is not None else None

    def active_tariff_code(self) -> str | None:
        """Return the currently active contract tariff from the P1 meter."""
        return normalise_tariff_code(self.active_tariff_raw())

    @property
    def update_interval_minutes(self) -> int:
        interval = self.update_interval or UPDATE_INTERVAL
        return int(interval.total_seconds() // 60)

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
        return await self._async_update_data_attempt(recovery_attempted=False)

    async def _async_update_data_attempt(
        self, *, recovery_attempted: bool
    ) -> dict[str, Any]:
        account = self._account()
        api_key = account.get("api_key")
        if not api_key:
            self.status = "unconfigured"
            self.last_error = None
            return {}

        request_key = self._account_request_key(account)
        requested_contract = request_key[2]
        requested_location = request_key[3]
        url = f"{request_key[1]}{PRICES_PATH}"
        # A pinned contract wins over a location (matching the server, which
        # checks ?contract= before ?location=); with neither the server uses
        # the account's active contract for today.
        params = {}
        if requested_contract:
            params["contract"] = requested_contract
        elif requested_location:
            params["location"] = requested_location
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
                        if self._account_request_key(self._account()) != request_key:
                            if recovery_attempted:
                                self.status = "connecting"
                                raise UpdateFailed(
                                    "Account selection changed during price refresh"
                                )
                            resp.release()
                            return await self._async_update_data_attempt(
                                recovery_attempted=True
                            )
                        if (
                            requested_contract
                            and not recovery_attempted
                            and await self._async_clear_missing_contract_pin(
                                requested_contract, request_key
                            )
                        ):
                            LOGGER.info(
                                "Removed missing energy contract pin %s; "
                                "retrying with the active account contract",
                                requested_contract,
                            )
                            resp.release()
                            return await self._async_update_data_attempt(
                                recovery_attempted=True
                            )
                        if self._account_request_key(self._account()) != request_key:
                            if recovery_attempted:
                                self.status = "connecting"
                                raise UpdateFailed(
                                    "Account selection changed during price refresh"
                                )
                            resp.release()
                            return await self._async_update_data_attempt(
                                recovery_attempted=True
                            )
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
            self.last_error = "Could not connect to the energy price service."
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
        self.update_interval = timedelta(
            minutes=15
            if energy_api.effective_resolution(data) == "quarter-hour"
            else 60
        )
        return data or {}

    @staticmethod
    def _account_request_key(account: dict[str, Any]) -> tuple[str, str, str, str]:
        """Snapshot the account fields that determine a prices request."""
        contract = account.get("contract_id")
        location = account.get("location_id")
        return (
            str(account.get("api_key") or ""),
            resolve_api_base_url(account.get("base_url")),
            str(contract) if contract not in (None, "") else "",
            str(location) if location not in (None, "") else "",
        )

    # ---- Convenience accessors for sensors / panel ----

    @staticmethod
    def _float_or_none(value: Any) -> float | None:
        """Only accept real numbers from the API; never a bool or string."""
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return None
        return float(value)

    def _elec(self) -> dict[str, Any]:
        return energy_api.electricity(self.data)

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
            end = (
                dt_util.parse_datetime(str(row.get("end")))
                if row.get("end")
                else None
            )
            if end is None:
                end = start + (
                    timedelta(minutes=15)
                    if row.get("resolution") == "quarter-hour"
                    else timedelta(hours=1)
                )
            elif end.tzinfo is None:
                end = end.replace(tzinfo=dt_util.get_default_time_zone())
            if start <= now < end:
                return row
        return energy_api.current_electricity(self.data)

    def electricity_price(self) -> float | None:
        cur = self.current_electricity()
        current = self._float_or_none(cur.get("consumer")) if cur else None
        if current is not None or not self.requires_tariff_selection():
            return current
        tariff = self.active_tariff_code()
        return self.tariff_price("import", tariff) if tariff else None

    def electricity_market_price(self) -> float | None:
        cur = self.current_electricity()
        return self._float_or_none(cur.get("market")) if cur else None

    def electricity_feed_in(self) -> float | None:
        cur = self.current_electricity()
        current = self._float_or_none(cur.get("feed_in")) if cur else None
        if current is not None or not self.requires_tariff_selection():
            return current
        tariff = self.active_tariff_code()
        return self.tariff_price("export", tariff) if tariff else None

    def electricity_level(self) -> str | None:
        level = self._elec().get("level")
        if level:
            return str(level)
        tariff = self.active_tariff_code()
        return f"tariff_{tariff[-1]}" if tariff else None

    def gas_price(self) -> float | None:
        return energy_api.commodity_price(self.data, "gas")

    def water_price(self) -> float | None:
        return energy_api.commodity_price(self.data, "water")

    def today(self) -> list[dict[str, Any]]:
        return energy_api.electricity_periods(self.data, "today")

    def tomorrow(self) -> list[dict[str, Any]]:
        return energy_api.electricity_periods(self.data, "tomorrow")

    def planning_rows(self) -> list[dict[str, Any]]:
        """Return hourly prices for planners, averaging quarter-hour periods."""
        source = self.today() + self.tomorrow()
        if self.effective_resolution() != "quarter-hour":
            return source
        grouped: dict[str, list[dict[str, Any]]] = {}
        for row in source:
            start = dt_util.parse_datetime(str(row.get("start") or ""))
            price = self._float_or_none(row.get("consumer"))
            if start is None or price is None:
                continue
            if start.tzinfo is None:
                start = start.replace(tzinfo=dt_util.get_default_time_zone())
            key = start.replace(minute=0, second=0, microsecond=0).isoformat()
            grouped.setdefault(key, []).append(row)
        result: list[dict[str, Any]] = []
        for start, periods in sorted(grouped.items()):
            prices = [
                value
                for row in periods
                if (value := self._float_or_none(row.get("consumer"))) is not None
            ]
            if not prices:
                continue
            result.append(
                {
                    "start": start,
                    "end": (
                        dt_util.parse_datetime(start) + timedelta(hours=1)
                    ).isoformat(),
                    "consumer": sum(prices) / len(prices),
                    "resolution": "hour",
                    "source_resolution": "quarter-hour",
                }
            )
        return result

    def forecast(self) -> list[dict[str, Any]]:
        """Return the confirmed and predicted hourly price horizon."""
        return energy_api.electricity_forecast(self.data)

    def forecast_meta(self) -> dict[str, Any]:
        """Return metadata describing the available forecast horizon."""
        return self._elec().get("forecast_meta") or {}

    def contract(self) -> dict[str, Any] | None:
        return energy_api.contract(self.data) or None

    def contract_name(self) -> str | None:
        item = self.contract() or {}
        return str(item["name"]) if item.get("name") else None

    def contract_type(self) -> str | None:
        return energy_api.contract_type(self.data)

    def contract_provider(self) -> str | None:
        return energy_api.contract_provider(self.data)

    def supports_price_optimisation(self) -> bool:
        return energy_api.price_optimisation_supported(self.data)

    def effective_resolution(self) -> str | None:
        return energy_api.effective_resolution(self.data)

    def price_is_fallback(self) -> bool:
        return energy_api.is_fallback(self.data)

    def requires_tariff_selection(self) -> bool:
        return energy_api.requires_tariff_selection(self.data)

    def contract_active(self) -> bool:
        """True when a contract is connected and its prices apply."""
        return self.status == "ok" and self.contract() is not None

    def contract_tariffs(self) -> dict[str, Any]:
        """Per-unit prices from the connected contract (empty if none)."""
        return energy_api.contract_tariffs(self.data)

    def contract_price(self, key: str) -> float | None:
        """A single contract tariff (electricity_t1/t2, feed_in, gas, water).

        Returns None when no contract is connected or the value is unset, so
        callers can fall back to the user's own configured price.
        """
        if not self.contract_active():
            return None
        return self._float_or_none(self.contract_tariffs().get(key))

    def tariff_price(self, direction: str, code: str) -> float | None:
        return energy_api.tariff_price(self.data, direction, code)

    def net_fixed_cost_daily(self) -> float | None:
        return energy_api.fixed_cost(self.data, "daily")

    def net_fixed_cost_yearly(self) -> float | None:
        return energy_api.fixed_cost(self.data, "yearly")

    def _summary(self) -> dict[str, Any]:
        return energy_api.electricity_summary(self.data)

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

    def negative_hours_today(self) -> float | None:
        return self._float_or_none(self._summary().get("negative_hours_today"))

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
                        self.last_error = (
                            "This API key is missing the prices:read permission."
                        )
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
                contracts = data.get("contracts")
                locations = data.get("locations", []) or []
                if not isinstance(contracts, list) or not isinstance(locations, list):
                    if update_status:
                        self.status = "error"
                        self.last_error = "The account service returned an invalid response."
                    return False, [], []
                if update_status:
                    self.status = "ok"
                    self.last_error = None
                return True, contracts, locations
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

    async def _async_clear_missing_contract_pin(
        self,
        pinned_id: str,
        expected_request_key: tuple[str, str, str, str],
    ) -> bool:
        """Clear a pinned contract only when the account confirms it is gone."""
        valid, contracts, _ = await self._async_fetch_contracts(update_status=False)
        if not valid or any(
            str(contract.get("id")) == pinned_id
            for contract in contracts
            if isinstance(contract, dict)
        ):
            return False

        store = self.hass.data.get(DOMAIN, {}).get("store")
        if store is None:
            return False
        account = store.get_account()
        if self._account_request_key(account) != expected_request_key:
            # The user changed the selection while the account check was in
            # flight. Leave the newer choice untouched.
            return False

        account["contract_id"] = None
        await store.async_set_account(account)
        return True

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
