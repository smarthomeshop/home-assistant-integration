"""Keep water and energy helpers linked to renamed ESPHome entities."""

import asyncio
from types import SimpleNamespace

from custom_components.smarthomeshop.products.base import utility_sources
from custom_components.smarthomeshop.products.base.p1.utility_meters import create_single_utility_meter
from custom_components.smarthomeshop.products.waterp1meterkit import utility_meters


def entry():
    return SimpleNamespace(entry_id="entry1234", data={"water_sensor": "sensor.hal_waterp1meterkit_water_meter_total", "device_id": "physical"})


def registry_entries():
    return [SimpleNamespace(
        entity_id=f"sensor.renamed_{index}", unique_id=f"aabbccf06384-{suffix}",
        original_name=suffix.replace("_", " "), domain="sensor", platform="esphome", disabled_by=None,
    ) for index, suffix in enumerate(["water_total_consumption", "energy_consumed_tariff_1", "energy_consumed_tariff_2", "gas_consumed"]) ]


def mock_registry(monkeypatch):
    entities = registry_entries()
    device = SimpleNamespace(id="physical", connections={("mac", "aa:bb:cc:f0:63:84")}, identifiers=set())
    monkeypatch.setattr(utility_sources, "resolve_source_device", lambda *args, **kwargs: device)
    monkeypatch.setattr(utility_sources.er, "async_get", lambda hass: object())
    monkeypatch.setattr(utility_sources.er, "async_entries_for_device", lambda registry, device_id: entities)
    return entities


def test_renamed_water_and_energy_sources_use_registry_identity(monkeypatch):
    entities = mock_registry(monkeypatch)
    sources = utility_sources.meter_sources(SimpleNamespace(), entry())
    assert sources["water_total_consumption"] == entities[0].entity_id
    assert sources["energy_consumed_tariff_1"] == entities[1].entity_id
    assert sources["energy_consumed_tariff_2"] == entities[2].entity_id
    assert utility_sources.waterp1_short_id(SimpleNamespace(), entry()) == "f06384"


def test_existing_mac_based_helper_names_are_preserved(monkeypatch):
    mock_registry(monkeypatch)
    config = entry()
    config.data["water_sensor"] = "sensor.waterp1meterkit_123abc_water_meter_total"
    assert utility_sources.waterp1_short_id(SimpleNamespace(), config) == "123abc"


def test_setup_creates_persistent_helpers_for_renamed_sources(monkeypatch):
    entities = mock_registry(monkeypatch)
    captured = []

    async def create(hass, **kwargs):
        captured.append(kwargs)
        return True

    monkeypatch.setattr(utility_meters, "_create_single_utility_meter", create)
    hass = SimpleNamespace(states={})
    asyncio.run(utility_meters.async_setup_utility_meters(hass, entry()))
    water = [item for item in captured if " Water " in item["name"]]
    energy = [item for item in captured if " Energy " in item["name"] and "Returned" not in item["name"]]
    assert len(water) == 4
    assert all(item["source"] == entities[0].entity_id and item["periodically_resetting"] is True for item in water)
    assert {item["source"] for item in energy} == {entities[1].entity_id, entities[2].entity_id}


def test_existing_water_helper_gains_reset_handling_without_losing_options():
    existing = SimpleNamespace(title="Water Daily", options={"name": "Water Daily", "source": "sensor.raw_water", "periodically_resetting": False, "keep": "custom"})
    updates = []
    config_entries = SimpleNamespace(
        async_entries=lambda domain: [existing],
        async_update_entry=lambda target, *, options: updates.append(options),
    )
    assert asyncio.run(create_single_utility_meter(SimpleNamespace(config_entries=config_entries), name="Water Daily", source="sensor.raw_water", cycle="daily", unique_id="water_daily", periodically_resetting=True))
    assert updates == [{**existing.options, "periodically_resetting": True}]


def test_missing_raw_source_never_counts_absolute_meter_as_a_reset(monkeypatch):
    captured = []

    async def create(hass, **kwargs):
        captured.append(kwargs)
        return True

    monkeypatch.setattr(utility_meters, "_create_single_utility_meter", create)
    hass = SimpleNamespace(states={})
    asyncio.run(utility_meters._create_all_utility_meters(
        hass, "f06384", {}, "sensor.renamed_absolute_water"
    ))
    water = [item for item in captured if " Water " in item["name"]]
    assert all(item["source"] == "sensor.renamed_absolute_water" and item["periodically_resetting"] is False for item in water)


def test_user_named_energy_sensor_cannot_be_mistaken_for_water_pulses(monkeypatch):
    entities = mock_registry(monkeypatch)
    entities.insert(0, SimpleNamespace(entity_id="sensor.total_consumption", unique_id="mac-energy_consumed_tariff_1", original_name="Energy consumed tariff 1", platform="esphome", domain="sensor", disabled_by=None))
    assert utility_sources.meter_sources(SimpleNamespace(), entry())["water_total_consumption"] == entities[1].entity_id
