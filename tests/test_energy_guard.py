"""Tests for registry-based live grid and fuse guarding."""

from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

from custom_components.smarthomeshop import energy_guard
from custom_components.smarthomeshop.const import DOMAIN


class _Store:
    def __init__(self, sources):
        self.sources = sources

    def get_energy_sources(self):
        return dict(self.sources)


class _Registry:
    def __init__(self, entries):
        self.entities = {entry.entity_id: entry for entry in entries}


def _entry(entity_id, unique_id, device_id):
    return SimpleNamespace(
        entity_id=entity_id,
        unique_id=unique_id,
        device_id=device_id,
        domain="sensor",
        platform=DOMAIN,
        disabled_by=None,
    )


def _hass(sources, states=None):
    return SimpleNamespace(
        data={DOMAIN: {"store": _Store(sources)}},
        states=states or {},
    )


def _install_registry(monkeypatch, entries):
    registry = _Registry(entries)
    monkeypatch.setattr(energy_guard.er, "async_get", lambda _hass: registry)
    monkeypatch.setattr(
        energy_guard.er,
        "async_entries_for_device",
        lambda _registry, device_id: [
            entry for entry in entries if entry.device_id == device_id
        ],
    )


def test_resolves_arbitrary_entity_ids_by_unique_id_and_selected_device(monkeypatch):
    entries = [
        _entry("sensor.renamed_live_grid", "entry_a_net_power", "selected"),
        _entry(
            "sensor.renamed_fuse_space",
            "entry_a_available_grid_power",
            "selected",
        ),
    ]
    _install_registry(monkeypatch, entries)
    hass = _hass({"p1_device": "selected"})
    assert energy_guard.resolve_grid_power_entity(hass) == "sensor.renamed_live_grid"
    assert (
        energy_guard.resolve_fuse_headroom_entity(hass)
        == "sensor.renamed_fuse_space"
    )


def test_never_falls_back_to_a_different_p1_when_one_is_selected(monkeypatch):
    entries = [_entry("sensor.other_grid", "entry_b_net_power", "other")]
    _install_registry(monkeypatch, entries)
    hass = _hass({"p1_device": "selected"})
    assert energy_guard.resolve_grid_power_entity(hass) is None


def test_fresh_main_fuse_headroom_limits_battery_charging(monkeypatch):
    entries = [
        _entry("sensor.grid_any_name", "entry_a_net_power", "selected"),
        _entry("sensor.fuse_any_name", "entry_a_available_grid_power", "selected"),
    ]
    _install_registry(monkeypatch, entries)
    now = datetime.now(timezone.utc)
    state = lambda value: SimpleNamespace(
        state=str(value),
        attributes={"unit_of_measurement": "W"},
        last_updated=now,
    )
    hass = _hass(
        {"p1_device": "selected"},
        {
            "sensor.grid_any_name": state(500),
            "sensor.fuse_any_name": state(1000),
        },
    )
    result = energy_guard.evaluate_battery_guard(
        hass,
        {"grid_guard_enabled": True, "grid_safety_margin": 250},
        2000,
    )
    assert result["status"] == "limited"
    assert result["allowed_power_w"] == 750
    assert result["fuse_entity_id"] == "sensor.fuse_any_name"
