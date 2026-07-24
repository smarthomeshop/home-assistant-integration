"""Regression tests for stale energy-contract recovery."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock

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


if __name__ == "__main__":
    unittest.main()
