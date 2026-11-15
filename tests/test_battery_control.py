"""Concurrency and reservation tests for guarded battery dispatch."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

import custom_components.smarthomeshop.battery_control as module
from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop.energy_guard import energy_dispatch_lock


class Services:
    def __init__(self, hass, *, failure: Exception | None = None):
        self.hass = hass
        self.failure = failure
        self.handlers = {}
        self.calls = []

    def has_service(self, domain, service):
        return (domain, service) in self.handlers

    def async_register(self, domain, service, handler, schema=None):
        self.handlers[(domain, service)] = handler

    async def async_call(self, domain, service, data, blocking=False):
        assert energy_dispatch_lock(self.hass).locked()
        reservation = self.hass.data[DOMAIN].get("battery_dispatch_reservation")
        assert reservation and reservation["expected_power_w"] == 600
        self.calls.append((domain, service, data, blocking))
        if self.failure:
            raise self.failure


def make_hass(*, failure: Exception | None = None):
    now = datetime.now(UTC)
    control = SimpleNamespace(
        state="0",
        attributes={"min": -2000, "max": 2000},
        last_updated=now,
        last_reported=now,
    )
    store = SimpleNamespace(
        get_battery=lambda: {
            "enabled": True,
            "execution_mode": "automatic",
            "control_entity": "number.battery_power",
            "control_kind": "number",
            "charge_power": 1000,
            "max_discharge_power": 1000,
            "grid_guard_enabled": True,
        },
        get_smart_loads=lambda: {"control_owners": {}, "loads": []},
        get_smart_ev=lambda: {"control_owners": {}, "vehicles": []},
        async_append_energy_journal=AsyncMock(),
    )
    hass = SimpleNamespace(
        data={DOMAIN: {"store": store}},
        states=SimpleNamespace(get={"number.battery_power": control}.get),
    )
    hass.services = Services(hass, failure=failure)

    def create_task(coro, _name):
        coro.close()
        return None

    hass.async_create_task = create_task
    return hass


@pytest.mark.parametrize("failure", [None, RuntimeError("dispatch failed")])
def test_battery_dispatch_is_locked_and_reserved_before_service(
    monkeypatch, failure
) -> None:
    hass = make_hass(failure=failure)
    monkeypatch.setattr(module, "_other_dispatch_reservation_w", lambda _hass: 400)
    monkeypatch.setattr(
        module,
        "evaluate_battery_guard",
        lambda _hass, _config, requested, **_kwargs: {
            "status": "safe",
            "allowed_power_w": min(float(requested), 1000),
            "reason": "safe",
        },
    )
    asyncio.run(module.async_register_battery_services(hass))
    handler = hass.services.handlers[(DOMAIN, module.SERVICE_APPLY_RECOMMENDATION)]

    if failure:
        with pytest.raises(RuntimeError, match="dispatch failed"):
            asyncio.run(handler(SimpleNamespace(data={"action": "charge"})))
    else:
        asyncio.run(handler(SimpleNamespace(data={"action": "charge"})))

    assert hass.data[DOMAIN]["battery_dispatch_reservation"]["expected_power_w"] == 600
    assert not energy_dispatch_lock(hass).locked()
