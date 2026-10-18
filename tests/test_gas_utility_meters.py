"""Gas utility meters are only made once the P1 meter has reported gas."""

import asyncio
from types import SimpleNamespace

from custom_components.smarthomeshop.products.base.p1 import utility_meters
from custom_components.smarthomeshop.products.waterp1meterkit import (
    utility_meters as waterp1_meters,
)

BASE = "sensor.p1meterkit_123abc"


def reading(value: str) -> SimpleNamespace:
    return SimpleNamespace(state=value)


def watch(monkeypatch, states: dict):
    """Start the gas watcher with the meter creation and state tracking faked."""
    created = []
    subscriptions = []

    async def setup_gas(hass, label, uid_prefix, source):
        created.append((label, uid_prefix, source))
        return 4

    def track(hass, entity_ids, action):
        subscription = SimpleNamespace(entity_ids=list(entity_ids), action=action, cancelled=0)
        subscriptions.append(subscription)

        def cancel():
            subscription.cancelled += 1

        return cancel

    monkeypatch.setattr(utility_meters, "async_setup_gas_utility_meters", setup_gas)
    monkeypatch.setattr(utility_meters, "async_track_state_change_event", track)
    hass = SimpleNamespace(states=states, async_create_task=asyncio.run)
    unload = []
    entry = SimpleNamespace(async_on_unload=unload.append)
    utility_meters.async_create_gas_meters_once_seen(
        hass, entry, label="P1 123abc", uid_prefix="p1_123abc", entity_base=BASE
    )
    return created, subscriptions, unload


def test_gas_meters_are_made_right_away_when_the_meter_reports_gas(monkeypatch):
    created, subscriptions, unload = watch(
        monkeypatch, {f"{BASE}_gas_consumed": reading("1234.567")}
    )

    assert created == [("P1 123abc", "p1_123abc", f"{BASE}_gas_consumed")]
    assert subscriptions == []
    assert unload == []


def test_gas_meters_follow_the_first_gas_reading(monkeypatch):
    states = {f"{BASE}_gas_consumed": reading("unavailable")}
    created, subscriptions, unload = watch(monkeypatch, states)

    assert created == []
    [subscription] = subscriptions
    assert subscription.entity_ids == [f"{BASE}_gas_consumed", f"{BASE}_gas_consumed_belgium"]

    subscription.action(None)
    assert created == []

    states[f"{BASE}_gas_consumed_belgium"] = reading("89.012")
    subscription.action(None)
    subscription.action(None)
    assert created == [("P1 123abc", "p1_123abc", f"{BASE}_gas_consumed_belgium")]
    assert subscription.cancelled == 1

    # Unloading the entry afterwards must not cancel the tracker twice.
    for stop in unload:
        stop()
    assert subscription.cancelled == 1


def test_homes_without_gas_never_get_gas_meters(monkeypatch):
    states = {
        f"{BASE}_gas_consumed": reading("unknown"),
        f"{BASE}_gas_consumed_belgium": reading("unknown"),
    }
    created, subscriptions, unload = watch(monkeypatch, states)

    subscriptions[0].action(None)
    for stop in unload:
        stop()

    assert created == []
    assert subscriptions[0].cancelled == 1


def capture_meters(monkeypatch) -> list[dict]:
    captured = []

    async def create(hass, **kwargs):
        captured.append(kwargs)
        return True

    monkeypatch.setattr(utility_meters, "create_single_utility_meter", create)
    monkeypatch.setattr(waterp1_meters, "_create_single_utility_meter", create)
    return captured


def test_gas_meters_keep_the_names_of_existing_helpers(monkeypatch):
    captured = capture_meters(monkeypatch)

    created = asyncio.run(
        utility_meters.async_setup_gas_utility_meters(
            SimpleNamespace(), "WaterP1 123abc", "waterp1_123abc", "sensor.gas"
        )
    )

    cycles = ("daily", "weekly", "monthly", "yearly")
    assert created == 4
    assert [item["name"] for item in captured] == [
        f"WaterP1 123abc Gas {cycle.capitalize()} (CC)" for cycle in cycles
    ]
    assert [item["unique_id"] for item in captured] == [
        f"waterp1_123abc_gas_{cycle}" for cycle in cycles
    ]
    assert {item["source"] for item in captured} == {"sensor.gas"}


def test_energy_and_water_setup_leave_gas_to_the_watcher(monkeypatch):
    captured = capture_meters(monkeypatch)
    gas = "sensor.waterp1meterkit_123abc_gas_consumed"
    hass = SimpleNamespace(states={f"{BASE}_gas_consumed": reading("1.0"), gas: reading("1.0")})

    asyncio.run(utility_meters.async_setup_energy_utility_meters(
        hass, label="P1 123abc", uid_prefix="p1_123abc", entity_base=BASE
    ))
    asyncio.run(waterp1_meters._create_all_utility_meters(hass, "123abc", {"gas_consumed": gas}))

    assert captured
    assert [item["name"] for item in captured if " Gas " in item["name"]] == []


def test_waterp1_watches_its_renamed_gas_entity(monkeypatch):
    calls = []
    monkeypatch.setattr(waterp1_meters, "waterp1_short_id", lambda hass, entry: "f06384")
    monkeypatch.setattr(
        waterp1_meters, "meter_sources", lambda hass, entry: {"gas_consumed": "sensor.renamed_gas"}
    )
    monkeypatch.setattr(
        waterp1_meters,
        "async_create_gas_meters_once_seen",
        lambda hass, entry, **kwargs: calls.append(kwargs),
    )

    waterp1_meters.async_setup_gas_meters(SimpleNamespace(), SimpleNamespace())

    assert calls == [{
        "label": "WaterP1 f06384",
        "uid_prefix": "waterp1_f06384",
        "entity_base": "sensor.waterp1meterkit_f06384",
        "sources": {"gas_consumed": "sensor.renamed_gas"},
    }]
