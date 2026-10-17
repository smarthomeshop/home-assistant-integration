"""Regression tests for stale energy-contract recovery."""

from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from custom_components.smarthomeshop import price_coordinator
from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop.price_coordinator import PriceCoordinator


class _Store:
    def __init__(self, account: dict) -> None:
        self.account = dict(account)
        self.saved: list[dict] = []

    def get_account(self) -> dict:
        return dict(self.account)

    async def async_set_account(self, account: dict) -> None:
        self.account = dict(account)
        self.saved.append(dict(account))


def _coordinator(store: _Store, contracts: list[dict]) -> SimpleNamespace:
    coordinator = SimpleNamespace(
        hass=SimpleNamespace(data={DOMAIN: {"store": store}}),
        _async_fetch_contracts=AsyncMock(return_value=(True, contracts, [])),
        _account_request_key=PriceCoordinator._account_request_key,
    )
    return coordinator


class TestMissingContractPin(unittest.IsolatedAsyncioTestCase):
    async def test_missing_pin_is_cleared_without_touching_other_settings(self) -> None:
        account = {
            "api_key": "secret",
            "base_url": "https://example.test",
            "contract_id": "2",
            "location_id": "4",
        }
        store = _Store(account)
        coordinator = _coordinator(store, [{"id": 8}])
        request_key = PriceCoordinator._account_request_key(account)

        cleared = await PriceCoordinator._async_clear_missing_contract_pin(
            coordinator, "2", request_key
        )

        self.assertTrue(cleared)
        self.assertIsNone(store.account["contract_id"])
        self.assertEqual(store.account["api_key"], "secret")
        self.assertEqual(store.account["location_id"], "4")
        self.assertEqual(len(store.saved), 1)

    async def test_existing_pin_is_not_cleared(self) -> None:
        account = {"api_key": "secret", "contract_id": "2"}
        store = _Store(account)
        coordinator = _coordinator(store, [{"id": 2}, {"id": 8}])

        cleared = await PriceCoordinator._async_clear_missing_contract_pin(
            coordinator, "2", PriceCoordinator._account_request_key(account)
        )

        self.assertFalse(cleared)
        self.assertEqual(store.account["contract_id"], "2")
        self.assertEqual(store.saved, [])

    async def test_changed_account_is_not_modified(self) -> None:
        account = {
            "api_key": "old-key",
            "base_url": "https://old.example.test",
            "contract_id": "2",
        }
        store = _Store(account)
        coordinator = _coordinator(store, [])

        async def fetch_contracts(*, update_status: bool):
            self.assertFalse(update_status)
            store.account["api_key"] = "new-key"
            return True, [{"id": 8}], []

        coordinator._async_fetch_contracts = fetch_contracts

        cleared = await PriceCoordinator._async_clear_missing_contract_pin(
            coordinator, "2", PriceCoordinator._account_request_key(account)
        )

        self.assertFalse(cleared)
        self.assertEqual(store.account["contract_id"], "2")
        self.assertEqual(store.account["api_key"], "new-key")
        self.assertEqual(store.saved, [])


_NOW = datetime(2026, 10, 17, 12, 30, tzinfo=timezone.utc)


def _price_state(
    status: str,
    periods: list[dict],
    *,
    contract: dict | None = None,
    data: dict | None = None,
) -> SimpleNamespace:
    """A coordinator stand-in holding the data of the last successful poll."""
    state = SimpleNamespace(
        status=status,
        data={"electricity": {}} if data is None else data,
        today=lambda: periods,
        tomorrow=lambda: [],
        contract=lambda: contract,
    )
    state._cached_period = lambda: PriceCoordinator._cached_period(state)
    return state


def _period(start: datetime) -> dict:
    return {
        "start": start.isoformat(),
        "end": (start + timedelta(hours=1)).isoformat(),
        "consumer": 0.21,
    }


class TestCachedPricesAfterFailedPoll(unittest.TestCase):
    def setUp(self) -> None:
        patcher = patch.object(price_coordinator.dt_util, "now", return_value=_NOW)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_failed_poll_keeps_a_period_that_covers_now(self) -> None:
        state = _price_state("error", [_period(_NOW - timedelta(minutes=30))])

        self.assertTrue(PriceCoordinator.has_usable_prices(state))

    def test_failed_poll_ends_once_the_cached_periods_run_out(self) -> None:
        state = _price_state("error", [_period(_NOW - timedelta(hours=2))])

        self.assertFalse(PriceCoordinator.has_usable_prices(state))

    def test_revoked_key_never_serves_cached_prices(self) -> None:
        state = _price_state("unauthorized", [_period(_NOW - timedelta(minutes=30))])

        self.assertFalse(PriceCoordinator.has_usable_prices(state))

    def test_fixed_tariff_without_periods_stays_usable(self) -> None:
        state = _price_state("error", [], contract={"id": 3})

        self.assertTrue(PriceCoordinator.has_usable_prices(state))

    def test_failed_first_poll_has_nothing_to_serve(self) -> None:
        state = _price_state("error", [], data={})

        self.assertFalse(PriceCoordinator.has_usable_prices(state))

    def test_successful_poll_is_always_usable(self) -> None:
        state = _price_state("ok", [], data={})

        self.assertTrue(PriceCoordinator.has_usable_prices(state))


if __name__ == "__main__":
    unittest.main()
