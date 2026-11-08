"""Tests for bounded local Smart Energy storage."""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock

from custom_components.smarthomeshop.storage import SmartHomeShopStore


def _store() -> SmartHomeShopStore:
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store._data = {"energy_journal": [], "energy_learning": {}}
    store.async_save = AsyncMock()
    return store


def test_journal_suppresses_an_identical_command_within_ten_minutes():
    store = _store()
    entry = {
        "kind": "execution",
        "mode": "automatic",
        "status": "sent",
        "action": "charge",
        "target_power_w": 2030,
        "control_entity": "number.battery_power",
        "guard_status": "safe",
    }

    async def run():
        first = await store.async_append_energy_journal(entry)
        second = await store.async_append_energy_journal(
            {**entry, "target_power_w": 2049}
        )
        return first, second

    first, second = asyncio.run(run())
    assert second["id"] == first["id"]
    assert len(store.get_energy_journal()) == 1
    store.async_save.assert_awaited_once()


def test_learning_storage_returns_defensive_copies():
    store = _store()
    asyncio.run(
        store.async_set_energy_learning(
            {
                "samples": [{"ts": "2026-11-08T12:00:00+00:00", "grid_w": 100}],
                "model": {"use": {}},
            }
        )
    )
    result = store.get_energy_learning()
    result["samples"][0]["grid_w"] = 999
    assert store.get_energy_learning()["samples"][0]["grid_w"] == 100


def test_journal_keeps_distinct_failure_reasons():
    store = _store()
    base = {
        "kind": "execution",
        "mode": "automatic",
        "status": "failed",
        "action": "charge",
        "target_power_w": 2000,
        "control_entity": "number.battery_power",
        "guard_status": "safe",
    }

    async def run():
        await store.async_append_energy_journal({**base, "reason": "Device offline"})
        await store.async_append_energy_journal({**base, "reason": "Service rejected"})

    asyncio.run(run())
    assert [row["reason"] for row in store.get_energy_journal()] == [
        "Service rejected",
        "Device offline",
    ]
