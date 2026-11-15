"""Smart EV and Smart Loads entities follow their feature switch."""

from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from custom_components.smarthomeshop import binary_sensor, energy_runtime, sensor
from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop.ev_entities import (
    SmartHomeShopEVBinarySensor,
    SmartHomeShopEVPlanSensor,
    smart_ev_entity_vehicles,
)
from custom_components.smarthomeshop.smart_load_entities import (
    SmartHomeShopLoadBinarySensor,
    SmartHomeShopLoadPlanSensor,
    smart_load_entity_loads,
)

INTEGRATION = Path(__file__).parents[1] / "custom_components" / "smarthomeshop"


class _Store:
    def __init__(self, smart_ev=None, smart_loads=None):
        self.smart_ev = smart_ev or {}
        self.smart_loads = smart_loads or {}

    def get_smart_ev(self):
        return dict(self.smart_ev)

    def get_smart_loads(self):
        return dict(self.smart_loads)


class _EntityRegistry:
    def __init__(self, entries):
        # entries: {entity_id: (domain, unique_id, device_id)}
        self.entries = dict(entries)

    def async_get_entity_id(self, domain, platform, unique_id):
        assert platform == DOMAIN
        for entity_id, (entry_domain, entry_unique, _device) in self.entries.items():
            if entry_domain == domain and entry_unique == unique_id:
                return entity_id
        return None

    def async_remove(self, entity_id):
        del self.entries[entity_id]


class _DeviceRegistry:
    def __init__(self, devices):
        self.devices = dict(devices)

    def async_get_devices(self, *, identifiers=None, **_kwargs):
        return [
            SimpleNamespace(id=device_id)
            for device_id, identifier in self.devices.items()
            if identifier in (identifiers or set())
        ]

    def async_remove_device(self, device_id):
        del self.devices[device_id]


class _Platform:
    """Collects what one platform setup does with Home Assistant."""

    def __init__(self, monkeypatch, module, store, entries, devices):
        self.added: list = []
        self.removed_tasks = 0
        self.listeners: list = []
        self.entity_registry = _EntityRegistry(entries)
        self.device_registry = _DeviceRegistry(devices)

        def create_task(coro):
            self.removed_tasks += 1
            coro.close()

        self.hass = SimpleNamespace(
            data={DOMAIN: {"store": store}}, async_create_task=create_task
        )
        self.entry = SimpleNamespace(async_on_unload=lambda _unsub: None)
        monkeypatch.setattr(
            module,
            "async_dispatcher_connect",
            lambda _hass, _signal, target: self.listeners.append(target),
        )
        monkeypatch.setattr(module, "adopt_account_entities", lambda *_args: None)
        monkeypatch.setattr(
            energy_runtime.er, "async_get", lambda _hass: self.entity_registry
        )
        monkeypatch.setattr(
            energy_runtime.dr, "async_get", lambda _hass: self.device_registry
        )
        monkeypatch.setattr(
            energy_runtime.er,
            "async_entries_for_device",
            lambda registry, device_id, include_disabled_entities=False: [
                entity_id
                for entity_id, (_domain, _unique, device) in registry.entries.items()
                if device == device_id
            ],
        )

    def add_entities(self, entities):
        self.added.extend(entities)

    def sync(self):
        for listener in self.listeners:
            listener()


def _vehicle(name="Family car"):
    return {"id": "car", "name": name}


def _load(name="Dishwasher"):
    return {"id": "dishwasher", "name": name}


def test_entity_lists_are_empty_while_the_feature_is_off() -> None:
    assert smart_ev_entity_vehicles({"enabled": False, "vehicles": [_vehicle()]}) == {}
    assert smart_ev_entity_vehicles({"vehicles": [_vehicle()]}) == {}
    assert list(
        smart_ev_entity_vehicles({"enabled": True, "vehicles": [_vehicle(), "bad"]})
    ) == ["car"]
    assert smart_load_entity_loads({"enabled": False, "loads": [_load()]}) == {}
    assert list(
        smart_load_entity_loads({"enabled": True, "loads": [_load()]})
    ) == ["dishwasher"]


def test_ev_plan_sensor_follows_the_smart_ev_switch_without_a_reload(
    monkeypatch,
) -> None:
    store = _Store(smart_ev={"enabled": False, "vehicles": [_vehicle()]})
    platform = _Platform(
        monkeypatch,
        sensor,
        store,
        # Left behind by a run where Smart EV was still on.
        {"sensor.old_plan": ("sensor", f"{DOMAIN}_ev_car_plan", "ev-device")},
        {"ev-device": (DOMAIN, "smart_ev")},
    )
    initial: list = []

    sensor._setup_ev_plan_sensors(
        platform.hass, platform.entry, SimpleNamespace(), platform.add_entities, initial
    )

    assert initial == []
    assert platform.entity_registry.entries == {}
    assert platform.device_registry.devices == {}

    store.smart_ev["enabled"] = True
    platform.sync()

    assert len(platform.added) == 1
    assert isinstance(platform.added[0], SmartHomeShopEVPlanSensor)

    platform.entity_registry.entries["sensor.family_car_plan"] = (
        "sensor",
        f"{DOMAIN}_ev_car_plan",
        "ev-device",
    )
    platform.device_registry.devices["ev-device"] = (DOMAIN, "smart_ev")
    store.smart_ev["enabled"] = False
    platform.sync()

    assert platform.removed_tasks == 1
    assert platform.entity_registry.entries == {}
    assert platform.device_registry.devices == {}


def test_load_binary_sensors_follow_the_smart_loads_switch(monkeypatch) -> None:
    store = _Store(smart_loads={"enabled": True, "loads": [_load()]})
    platform = _Platform(monkeypatch, binary_sensor, store, {}, {})
    initial: list = []

    binary_sensor._setup_load_binary_sensors(
        platform.hass, platform.entry, SimpleNamespace(), platform.add_entities, initial
    )

    assert {entity.kind for entity in initial} == {"active", "problem"}
    assert all(isinstance(item, SmartHomeShopLoadBinarySensor) for item in initial)

    platform.entity_registry.entries = {
        f"binary_sensor.dishwasher_{kind}": (
            "binary_sensor",
            f"{DOMAIN}_load_dishwasher_{kind}",
            "loads-device",
        )
        for kind in ("active", "problem")
    }
    platform.device_registry.devices["loads-device"] = (DOMAIN, "smart_loads")
    store.smart_loads["enabled"] = False
    platform.sync()

    assert platform.removed_tasks == 2
    assert platform.entity_registry.entries == {}
    assert platform.device_registry.devices == {}

    store.smart_loads["enabled"] = True
    platform.sync()

    assert {entity.kind for entity in platform.added} == {"active", "problem"}


def test_service_device_stays_while_another_platform_still_uses_it(
    monkeypatch,
) -> None:
    store = _Store(smart_ev={"enabled": False, "vehicles": [_vehicle()]})
    platform = _Platform(
        monkeypatch,
        sensor,
        store,
        {
            "sensor.old_plan": ("sensor", f"{DOMAIN}_ev_car_plan", "ev-device"),
            "binary_sensor.old_problem": (
                "binary_sensor",
                f"{DOMAIN}_ev_car_problem",
                "ev-device",
            ),
        },
        {"ev-device": (DOMAIN, "smart_ev")},
    )

    sensor._setup_ev_plan_sensors(
        platform.hass, platform.entry, SimpleNamespace(), platform.add_entities, []
    )

    assert list(platform.entity_registry.entries) == ["binary_sensor.old_problem"]
    assert list(platform.device_registry.devices) == ["ev-device"]


@pytest.mark.parametrize(
    ("factory", "key"),
    [
        (lambda: SmartHomeShopEVPlanSensor(SimpleNamespace(), _vehicle()), "ev_plan"),
        (
            lambda: SmartHomeShopEVBinarySensor(SimpleNamespace(), _vehicle(), "charging"),
            "ev_charging_planned",
        ),
        (
            lambda: SmartHomeShopEVBinarySensor(SimpleNamespace(), _vehicle(), "problem"),
            "ev_problem",
        ),
        (
            lambda: SmartHomeShopLoadPlanSensor(SimpleNamespace(), _load()),
            "smart_load_plan",
        ),
        (
            lambda: SmartHomeShopLoadBinarySensor(SimpleNamespace(), _load(), "active"),
            "smart_load_active",
        ),
        (
            lambda: SmartHomeShopLoadBinarySensor(SimpleNamespace(), _load(), "problem"),
            "smart_load_problem",
        ),
    ],
)
def test_entities_use_translated_names_with_the_user_label(factory, key) -> None:
    entity = factory()
    platform = "sensor" if key in {"ev_plan", "smart_load_plan"} else "binary_sensor"

    assert entity.has_entity_name is True
    assert entity.translation_key == key
    assert not hasattr(entity, "_attr_name")
    label = entity.translation_placeholders["name"]
    assert label in {"Family car", "Dishwasher"}

    for path in [INTEGRATION / "strings.json"] + sorted(
        (INTEGRATION / "translations").glob("*.json")
    ):
        catalog = json.loads(path.read_text())
        name = catalog["entity"][platform][key]["name"]
        assert "{name}" in name, path.name


def test_renaming_refreshes_the_translated_name_placeholder() -> None:
    plan = SmartHomeShopEVPlanSensor(SimpleNamespace(), _vehicle())
    load = SmartHomeShopLoadBinarySensor(SimpleNamespace(), _load(), "problem")
    # Simulate the name Home Assistant cached after the first state write.
    plan.__dict__["name"] = "Family car plan"
    load.__dict__["name"] = "Dishwasher problem"

    plan.update_vehicle(_vehicle("Work car"))
    load.update_load(_load("Washer"))

    assert plan.translation_placeholders == {"name": "Work car"}
    assert load.translation_placeholders == {"name": "Washer"}
    assert "name" not in plan.__dict__
    assert "name" not in load.__dict__
