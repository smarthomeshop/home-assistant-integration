"""Tests for versioned rooms and freshness-safe multi-sensor presence."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from homeassistant.core import State

from custom_components.smarthomeshop.room_config import normalize_room_config
from custom_components.smarthomeshop.room_runtime import (
    RoomRuntimeCoordinator,
    SourceSignal,
    _climate_report_is_fresh,
    _fresh_age,
    _normalise_climate_value,
    _presence_state_status,
    _resolve_climate_entities,
    _safe_room_polygon,
    _target_suppression,
    evaluate_room_presence,
)


def _signal(source_id: str, status: str) -> SourceSignal:
    return SourceSignal(source_id, f"device-{source_id}", status, (), 1.0, ())


def test_legacy_single_sensor_migrates_without_losing_room_content() -> None:
    room = normalize_room_config(
        {
            "id": "living",
            "name": "Living room",
            "walls": [{"x1": 0, "y1": 0}],
            "zones": [{"id": "sofa"}],
            "sensor": {
                "deviceId": "arbitrary-registry-device",
                "x": 1250,
                "y": -500,
                "heightMm": 2600,
                "rotation": 90,
            },
        }
    )

    assert room["walls"] == [{"x1": 0, "y1": 0}]
    assert room["zones"] == [{"id": "sofa"}]
    assert "sensor" not in room
    assert len(room["sensors"]) == 1
    assert room["sensors"][0]["deviceId"] == "arbitrary-registry-device"
    assert room["sensors"][0]["x_m"] == 1.25
    assert room["sensors"][0]["y_m"] == -0.5
    assert room["sensors"][0]["height_m"] == 2.6
    assert room["sensors"][0]["orientation_deg"] == 90
    assert room["aggregation"]["tracking"]["experimental_fusion"] is False


def test_legacy_source_id_is_stable_across_reloads() -> None:
    payload = {"id": "room", "name": "Room", "sensor": {"deviceId": "device-a"}}
    first = normalize_room_config(payload)
    second = normalize_room_config(payload)
    assert first["sensors"][0]["id"] == second["sensors"][0]["id"]


def test_outside_room_suppression_requires_an_ordered_simple_wall_chain() -> None:
    ordered = [
        {"x1": 0, "y1": 0, "x2": 5000, "y2": 0},
        {"x1": 5000, "y1": 0, "x2": 5000, "y2": 4000},
        {"x1": 5000, "y1": 4000, "x2": 0, "y2": 4000},
        {"x1": 0, "y1": 4000, "x2": 0, "y2": 0},
    ]
    assert len(_safe_room_polygon(ordered)) == 4
    assert _safe_room_polygon([ordered[0], ordered[2], ordered[1], ordered[3]]) == []
    assert _safe_room_polygon([
        {"x1": 0, "y1": 0, "x2": 4000, "y2": 4000},
        {"x1": 4000, "y1": 4000, "x2": 0, "y2": 4000},
        {"x1": 0, "y1": 4000, "x2": 4000, "y2": 0},
        {"x1": 4000, "y1": 0, "x2": 0, "y2": 0},
    ]) == []
    repeated_lap = ordered + ordered
    assert _safe_room_polygon(repeated_lap) == []
    assert _safe_room_polygon([
        {"x1": 0, "y1": 0, "x2": 4000, "y2": 0},
        {"x1": 4000, "y1": 0, "x2": 4000, "y2": 4000},
        {"x1": 4000, "y1": 4000, "x2": 2000, "y2": 0},
        {"x1": 2000, "y1": 0, "x2": 0, "y2": 4000},
        {"x1": 0, "y1": 4000, "x2": 0, "y2": 0},
    ]) == []


def test_empty_new_sensor_array_still_migrates_populated_legacy_sensor() -> None:
    room = normalize_room_config(
        {
            "id": "mixed-legacy",
            "sensors": [None],
            "sensor": {"deviceId": "legacy-device", "x": 500, "y": 750},
        }
    )
    assert len(room["sensors"]) == 1
    assert room["sensors"][0]["deviceId"] == "legacy-device"
    assert "sensor" not in room


def test_duplicate_source_id_for_distinct_devices_is_rejected() -> None:
    with pytest.raises(ValueError, match="more than one device"):
        normalize_room_config(
            {
                "id": "office",
                "sensors": [
                    {"id": "a", "deviceId": "device-a"},
                    {"id": "a", "deviceId": "device-b"},
                ],
            }
        )


def test_duplicate_physical_device_is_kept_only_once() -> None:
    room = normalize_room_config(
        {
            "id": "office",
            "sensors": [
                {"id": "a", "deviceId": "device-a"},
                {"id": "c", "deviceId": "device-a"},
                {"id": "d", "deviceId": "device-d"},
            ],
        }
    )
    assert [(source["id"], source["deviceId"]) for source in room["sensors"]] == [
        ("a", "device-a"),
        ("d", "device-d"),
    ]


@pytest.mark.parametrize("field", ["x", "y", "x_m", "y_m", "rotation", "orientation_deg"])
def test_malformed_source_placement_is_rejected(field: str) -> None:
    with pytest.raises(ValueError, match=field):
        normalize_room_config({
            "id": "office",
            "sensors": [{"id": "a", "deviceId": "device-a", field: "NaN"}],
        })


def test_selected_legacy_duplicate_is_preserved_during_normalization() -> None:
    room = normalize_room_config(
        {
            "id": "office",
            "sensors": [
                {"id": "old", "deviceId": "device-a"},
                {"id": "selected", "deviceId": "device-a"},
                {"id": "other", "deviceId": "device-b"},
            ],
            "aggregation": {
                "presence": {"source_ids": ["selected", "other"]},
            },
        }
    )
    assert [(source["id"], source["deviceId"]) for source in room["sensors"]] == [
        ("selected", "device-a"),
        ("other", "device-b"),
    ]
    assert room["aggregation"]["presence"]["source_ids"] == ["selected", "other"]


def test_null_legacy_presence_source_ids_cannot_break_room_migration() -> None:
    room = normalize_room_config(
        {
            "id": "malformed-presence",
            "sensors": [{"id": "source-a", "deviceId": "device-a"}],
            "aggregation": {"presence": {"source_ids": None}},
        }
    )

    assert room["aggregation"]["presence"]["source_ids"] == []
    assert room["sensors"][0]["id"] == "source-a"


def test_legacy_climate_primary_is_remapped_to_retained_physical_source() -> None:
    room = normalize_room_config(
        {
            "id": "office",
            "sensors": [
                {"id": "presence-choice", "deviceId": "device-a"},
                {"id": "climate-choice", "deviceId": "device-a"},
            ],
            "aggregation": {
                "presence": {"source_ids": ["presence-choice"]},
                "climate": {
                    "temperature": {
                        "strategy": "primary",
                        "primary_source_id": "climate-choice",
                    }
                },
            },
        }
    )
    assert [source["id"] for source in room["sensors"]] == ["presence-choice"]
    assert room["aggregation"]["climate"]["temperature"] == {
        "strategy": "primary",
        "primary_source_id": "presence-choice",
    }


def test_climate_discovery_prefers_room_sensor_and_skips_disabled_diagnostics(
    monkeypatch,
) -> None:
    from types import SimpleNamespace

    from custom_components.smarthomeshop import room_runtime

    entries = [
        SimpleNamespace(
            platform="esphome",
            domain="sensor",
            disabled_by="integration",
            entity_id="sensor.board_temperature",
            original_name="Internal Temperature",
            unique_id="device_internal_temperature",
            original_device_class="temperature",
        ),
        SimpleNamespace(
            platform="esphome",
            domain="sensor",
            disabled_by=None,
            entity_id="sensor.room_temperature",
            original_name="Temperature",
            unique_id="arbitrary_room_temperature",
            original_device_class="temperature",
        ),
    ]
    monkeypatch.setattr(room_runtime.er, "async_get", lambda _hass: object())
    monkeypatch.setattr(
        room_runtime.er,
        "async_entries_for_device",
        lambda _registry, _device_id: entries,
    )
    hass = SimpleNamespace(states=SimpleNamespace(get=lambda _entity_id: None))

    assert _resolve_climate_entities(hass, "device-a")["temperature"] == (
        "sensor.room_temperature"
    )


def test_unlinked_room_placeholder_does_not_block_a_linked_clear_sensor(
    monkeypatch,
) -> None:
    from custom_components.smarthomeshop import room_runtime

    profile_contract = SimpleNamespace(
        radar_model="ld2412",
        supplementary_presence_sensors=(),
        tracking_presence_entity_id="binary_sensor.real_presence",
        positioning_available=False,
        coordinate_frame=None,
    )
    profile = SimpleNamespace(
        device_id="registry-real",
        entity_prefix="real-prefix",
        aliases=("real-device",),
        name="Real sensor",
        profile=profile_contract,
    )
    monkeypatch.setattr(
        room_runtime,
        "discover_radar_device_profiles",
        lambda _hass: [profile],
    )
    monkeypatch.setattr(room_runtime.er, "async_get", lambda _hass: object())
    monkeypatch.setattr(
        room_runtime.er,
        "async_entries_for_device",
        lambda _registry, _device_id: [],
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "office",
                "name": "Office",
                "sensors": [
                    {"id": "real", "deviceId": "real-device"},
                    {"id": "placeholder", "deviceId": None},
                ],
            }]

        def get_room_runtime(self):
            return {}

        async def async_set_room_runtime(self, _runtime):
            return None

    states = {"binary_sensor.real_presence": State("binary_sensor.real_presence", "off")}
    fake = SimpleNamespace(
        hass=SimpleNamespace(states=SimpleNamespace(get=states.get)),
        store=_Store(),
        _refresh_listener=lambda _entities: None,
    )

    result = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert result["office"]["presence"]["status"] == "clear"
    assert result["office"]["presence"]["unknown_sources"] == []


def test_one_physical_radar_linked_to_two_rooms_fails_closed(monkeypatch) -> None:
    from custom_components.smarthomeshop import room_runtime

    monkeypatch.setattr(room_runtime.ir, "async_create_issue", lambda *_args, **_kwargs: None)

    profile = SimpleNamespace(
        device_id="registry-radar",
        entity_prefix="legacy-prefix",
        aliases=("friendly-alias",),
        name="Shared radar",
        profile=SimpleNamespace(
            radar_model="ld2412",
            supplementary_presence_sensors=(),
            tracking_presence_entity_id="binary_sensor.shared_presence",
            tracking_target_count_entity_id=None,
            positioning_available=False,
            coordinate_frame=None,
        ),
        targets=(),
    )
    monkeypatch.setattr(
        room_runtime, "discover_radar_device_profiles", lambda _hass: [profile]
    )
    monkeypatch.setattr(room_runtime.er, "async_get", lambda _hass: object())
    monkeypatch.setattr(
        room_runtime.er,
        "async_entries_for_device",
        lambda _registry, _device_id: [],
    )

    class _Store:
        def get_rooms(self):
            return [
                {"id": "living", "sensors": [{"id": "one", "deviceId": "registry-radar"}]},
                {"id": "office", "sensors": [{"id": "two", "deviceId": "friendly-alias"}]},
            ]

        def get_room_runtime(self):
            return {}

        async def async_set_room_runtime(self, _runtime):
            return None

    fake = SimpleNamespace(
        hass=SimpleNamespace(states=SimpleNamespace(get={
            "binary_sensor.shared_presence": State(
                "binary_sensor.shared_presence", "on"
            )
        }.get)),
        store=_Store(),
        _refresh_listener=lambda _entities: None,
    )
    result = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    for room_id in ("living", "office"):
        assert result[room_id]["presence"]["status"] == "unknown"
        assert result[room_id]["presence"]["occupied"] is None


def test_excluded_radar_target_does_not_revive_room_presence(
    monkeypatch,
) -> None:
    """Aggregate radar presence is ignored only when geometry explains it fully."""
    from custom_components.smarthomeshop import room_runtime

    target = SimpleNamespace(
        index=1,
        x_entity_id="sensor.radar_target_x",
        y_entity_id="sensor.radar_target_y",
        z_entity_id=None,
        presence_entity_id=None,
    )
    profile_contract = SimpleNamespace(
        radar_model="ld2450",
        supplementary_presence_sensors=("binary_sensor.room_pir",),
        tracking_presence_entity_id="binary_sensor.radar_presence",
        tracking_target_count_entity_id="sensor.radar_target_count",
        coordinate_projection="forward_xy",
        coordinate_scale_to_mm=1,
        positioning_available=True,
        coordinate_frame="x_lateral_y_forward",
    )
    profile = SimpleNamespace(
        device_id="registry-radar",
        entity_prefix="unrelated-prefix",
        aliases=("room-radar",),
        name="Room radar",
        profile=profile_contract,
        targets=(target,),
    )
    monkeypatch.setattr(
        room_runtime,
        "discover_radar_device_profiles",
        lambda _hass: [profile],
    )
    monkeypatch.setattr(room_runtime.er, "async_get", lambda _hass: object())
    monkeypatch.setattr(
        room_runtime.er,
        "async_entries_for_device",
        lambda _registry, _device_id: [],
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "mirror",
                "name": "Mirror room",
                "walls": [
                    {"x1": -2000, "y1": -1500},
                    {"x1": 2000, "y1": -1500},
                    {"x1": 2000, "y1": 1500},
                    {"x1": -2000, "y1": 1500},
                ],
                "zones": [{
                    "id": "reflection",
                    "type": "exclusion",
                    "points": [
                        {"x": 300, "y": 1000}, {"x": 900, "y": 1000},
                        {"x": 900, "y": 1600}, {"x": 300, "y": 1600},
                    ],
                }],
                "sensors": [{
                    "id": "radar-source", "deviceId": "room-radar",
                    "x": 0, "y": -1200, "rotation": 90,
                }],
            }]

        def get_room_runtime(self):
            return {}

        async def async_set_room_runtime(self, _runtime):
            return None

    states = {
        "binary_sensor.radar_presence": State("binary_sensor.radar_presence", "on"),
        "binary_sensor.room_pir": State("binary_sensor.room_pir", "off"),
        "sensor.radar_target_count": State("sensor.radar_target_count", "1"),
        "sensor.radar_target_x": State("sensor.radar_target_x", "2500"),
        "sensor.radar_target_y": State("sensor.radar_target_y", "500"),
    }
    fake = SimpleNamespace(
        hass=SimpleNamespace(states=SimpleNamespace(get=states.get)),
        store=_Store(),
        _refresh_listener=lambda _entities: None,
    )

    excluded = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert excluded["mirror"]["presence"]["status"] == "clear"
    assert excluded["mirror"]["sources"][0]["geometry_suppressed"] is True

    states["binary_sensor.room_pir"] = State("binary_sensor.room_pir", "on")
    supplementary = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert supplementary["mirror"]["presence"]["status"] == "occupied"


def test_exclusion_never_hides_unexplained_count_or_uses_stale_coordinates() -> None:
    now = datetime.now(UTC)
    room = {
        "walls": [
            {"x1": -2000, "y1": -1500}, {"x1": 2000, "y1": -1500},
            {"x1": 2000, "y1": 1500}, {"x1": -2000, "y1": 1500},
        ],
        "zones": [{
            "type": "exclusion",
            "points": [
                {"x": 300, "y": 1000}, {"x": 900, "y": 1000},
                {"x": 900, "y": 1600}, {"x": 300, "y": 1600},
            ],
        }],
    }
    source = {"id": "radar-source", "x": 0, "y": -1200, "rotation": 90}
    targets = (
        SimpleNamespace(
            x_entity_id="sensor.target_1_x", y_entity_id="sensor.target_1_y",
            presence_entity_id="binary_sensor.target_1_presence",
        ),
        SimpleNamespace(
            x_entity_id="sensor.target_2_x", y_entity_id="sensor.target_2_y",
            presence_entity_id="binary_sensor.target_2_presence",
        ),
    )
    profile = SimpleNamespace(
        targets=targets,
        profile=SimpleNamespace(
            coordinate_scale_to_mm=1,
            tracking_target_count_entity_id="sensor.target_count",
        ),
    )
    states = {
        "sensor.target_1_x": State("sensor.target_1_x", "2500", last_reported=now),
        "sensor.target_1_y": State("sensor.target_1_y", "500", last_reported=now),
        "binary_sensor.target_1_presence": State("binary_sensor.target_1_presence", "on"),
        "sensor.target_2_x": State("sensor.target_2_x", "0", last_reported=now),
        "sensor.target_2_y": State("sensor.target_2_y", "0", last_reported=now),
        "binary_sensor.target_2_presence": State("binary_sensor.target_2_presence", "off"),
        "sensor.target_count": State("sensor.target_count", "2"),
    }
    hass = SimpleNamespace(states=SimpleNamespace(get=states.get))
    suppressed, aggregate, _coordinates, _coordinate_status = _target_suppression(
        hass, room, source, profile,
        now=now.timestamp(), coordinate_freshness_seconds=5,
    )
    assert suppressed == {"binary_sensor.target_1_presence"}
    assert aggregate is False

    # A zone owned by a different radar is not a global exclusion.
    room["zones"][0]["sensorId"] = "other-source"
    suppressed, aggregate, _coordinates, _coordinate_status = _target_suppression(
        hass, room, source, profile,
        now=now.timestamp(), coordinate_freshness_seconds=5,
    )
    assert suppressed == set()
    assert aggregate is False
    room["zones"][0]["sensorId"] = "radar-source"

    # Fractional or stale counts are contract errors, not evidence that an
    # exclusion fully explains aggregate presence.
    for invalid_count in (
        State("sensor.target_count", "1.5", last_reported=now),
        State(
            "sensor.target_count", "1",
            last_reported=now - timedelta(seconds=6),
        ),
    ):
        states["sensor.target_count"] = invalid_count
        suppressed, aggregate, _coordinates, _coordinate_status = _target_suppression(
            hass, room, source, profile,
            now=now.timestamp(), coordinate_freshness_seconds=5,
        )
        assert suppressed == {"binary_sensor.target_1_presence"}
        assert aggregate is False

    # More excluded coordinate slots than the aggregate count is a contract
    # mismatch, never proof that all reported presence is a reflection.
    states["sensor.target_2_x"] = State(
        "sensor.target_2_x", "2600", last_reported=now
    )
    states["sensor.target_2_y"] = State(
        "sensor.target_2_y", "500", last_reported=now
    )
    states["binary_sensor.target_2_presence"] = State(
        "binary_sensor.target_2_presence", "on"
    )
    states["sensor.target_count"] = State("sensor.target_count", "1")
    suppressed, aggregate, _coordinates, _coordinate_status = _target_suppression(
        hass, room, source, profile,
        now=now.timestamp(), coordinate_freshness_seconds=5,
    )
    assert suppressed == {
        "binary_sensor.target_1_presence",
        "binary_sensor.target_2_presence",
    }
    assert aggregate is False

    states["sensor.target_2_x"] = State("sensor.target_2_x", "0", last_reported=now)
    states["sensor.target_2_y"] = State("sensor.target_2_y", "0", last_reported=now)
    states["binary_sensor.target_2_presence"] = State(
        "binary_sensor.target_2_presence", "off"
    )
    stale = now - timedelta(seconds=6)
    states["sensor.target_1_x"] = State("sensor.target_1_x", "2500", last_reported=stale)
    states["sensor.target_1_y"] = State("sensor.target_1_y", "500", last_reported=stale)
    suppressed, aggregate, _coordinates, _coordinate_status = _target_suppression(
        hass, room, source, profile,
        now=now.timestamp(), coordinate_freshness_seconds=5,
    )
    assert suppressed == set()
    assert aggregate is False

    states["sensor.target_1_x"] = State(
        "sensor.target_1_x", "1200", last_reported=now
    )
    states["sensor.target_1_y"] = State(
        "sensor.target_1_y", "2100", last_reported=now
    )
    states["binary_sensor.target_1_presence"] = State(
        "binary_sensor.target_1_presence", "on"
    )
    states["sensor.target_count"] = State("sensor.target_count", "1")
    suppressed, aggregate, _coordinates, coordinate_status = _target_suppression(
        hass,
        room,
        source,
        profile,
        now=now.timestamp(),
        coordinate_freshness_seconds=5,
    )
    assert suppressed == set()
    assert aggregate is False
    assert coordinate_status == "positive"

    states["binary_sensor.target_1_presence"] = State(
        "binary_sensor.target_1_presence", "off"
    )
    states["sensor.target_count"] = State("sensor.target_count", "0")
    suppressed, aggregate, _coordinates, coordinate_status = _target_suppression(
        hass,
        room,
        source,
        profile,
        now=now.timestamp(),
        coordinate_freshness_seconds=5,
    )
    assert suppressed == set()
    assert aggregate is False
    assert coordinate_status == "positive"


def test_coordinate_only_profile_requires_fresh_slots_even_with_pir(monkeypatch) -> None:
    """A supplementary PIR cannot turn stale legacy coordinates into a clear room."""
    from custom_components.smarthomeshop import room_runtime

    target = SimpleNamespace(
        index=1,
        x_entity_id="sensor.legacy_target_x",
        y_entity_id="sensor.legacy_target_y",
        z_entity_id=None,
        presence_entity_id=None,
    )
    profile = SimpleNamespace(
        device_id="registry-legacy",
        entity_prefix="unrelated-prefix",
        aliases=("legacy-radar",),
        name="Legacy radar",
        profile=SimpleNamespace(
            radar_model="ld2450",
            supplementary_presence_sensors=("binary_sensor.legacy_pir",),
            tracking_presence_entity_id=None,
            tracking_target_count_entity_id=None,
            coordinate_projection="forward_xy",
            coordinate_scale_to_mm=1,
            positioning_available=True,
            coordinate_frame="x_lateral_y_forward",
        ),
        targets=(target,),
    )
    monkeypatch.setattr(
        room_runtime, "discover_radar_device_profiles", lambda _hass: [profile]
    )
    monkeypatch.setattr(room_runtime.er, "async_get", lambda _hass: object())
    monkeypatch.setattr(
        room_runtime.er,
        "async_entries_for_device",
        lambda _registry, _device_id: [],
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "legacy-room",
                "name": "Legacy room",
                "walls": [
                    {"x1": -2000, "y1": -1500},
                    {"x1": 2000, "y1": -1500},
                    {"x1": 2000, "y1": 1500},
                    {"x1": -2000, "y1": 1500},
                ],
                "sensors": [{
                    "id": "legacy-source",
                    "deviceId": "legacy-radar",
                    "x": 0,
                    "y": -1200,
                    "rotation": 90,
                }],
            }]

        def get_room_runtime(self):
            return {}

        async def async_set_room_runtime(self, _runtime):
            return None

    states = {
        "sensor.legacy_target_x": State("sensor.legacy_target_x", "100"),
        "sensor.legacy_target_y": State("sensor.legacy_target_y", "500"),
        "binary_sensor.legacy_pir": State("binary_sensor.legacy_pir", "off"),
    }
    fake = SimpleNamespace(
        hass=SimpleNamespace(states=SimpleNamespace(get=states.get)),
        store=_Store(),
        _refresh_listener=lambda _entities: None,
    )
    occupied = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert occupied["legacy-room"]["presence"]["status"] == "occupied"

    stale = datetime.now(UTC) - timedelta(seconds=20)
    states["sensor.legacy_target_x"] = State(
        "sensor.legacy_target_x", "100", last_reported=stale
    )
    states["sensor.legacy_target_y"] = State(
        "sensor.legacy_target_y", "500", last_reported=stale
    )
    stale_result = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert stale_result["legacy-room"]["presence"]["status"] == "unknown"

    states["sensor.legacy_target_x"] = State(
        "sensor.legacy_target_x", "unavailable"
    )
    states["sensor.legacy_target_y"] = State(
        "sensor.legacy_target_y", "unavailable"
    )
    unavailable = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert unavailable["legacy-room"]["presence"]["status"] == "unknown"

    states["sensor.legacy_target_x"] = State("sensor.legacy_target_x", "0")
    states["sensor.legacy_target_y"] = State("sensor.legacy_target_y", "0")
    clear = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert clear["legacy-room"]["presence"]["status"] == "clear"


def test_missing_previously_linked_sensor_keeps_room_unknown(
    monkeypatch,
) -> None:
    from custom_components.smarthomeshop import room_runtime

    profile_contract = SimpleNamespace(
        radar_model="ld2412",
        supplementary_presence_sensors=(),
        tracking_presence_entity_id="binary_sensor.real_presence",
        positioning_available=False,
        coordinate_frame=None,
    )
    profile = SimpleNamespace(
        device_id="registry-real",
        entity_prefix="real-prefix",
        aliases=("real-device",),
        name="Real sensor",
        profile=profile_contract,
    )
    monkeypatch.setattr(
        room_runtime,
        "discover_radar_device_profiles",
        lambda _hass: [profile],
    )
    monkeypatch.setattr(room_runtime.er, "async_get", lambda _hass: object())
    monkeypatch.setattr(
        room_runtime.er,
        "async_entries_for_device",
        lambda _registry, _device_id: [],
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "office",
                "name": "Office",
                "sensors": [
                    {"id": "real", "deviceId": "real-device"},
                    {"id": "missing", "deviceId": "old-registry-device"},
                ],
            }]

        def get_room_runtime(self):
            return {}

        async def async_set_room_runtime(self, _runtime):
            return None

    states = {"binary_sensor.real_presence": State("binary_sensor.real_presence", "off")}
    fake = SimpleNamespace(
        hass=SimpleNamespace(states=SimpleNamespace(get=states.get)),
        store=_Store(),
        _refresh_listener=lambda _entities: None,
    )

    result = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert result["office"]["presence"]["status"] == "unknown"
    assert result["office"]["presence"]["occupied"] is None
    assert result["office"]["presence"]["unknown_sources"] == ["missing"]


def _run_radar_room(
    monkeypatch,
    *,
    sensors: list[dict[str, object]],
    selected_ids: list[str] | None = None,
    states: dict[str, State] | None = None,
    aggregation: dict[str, object] | None = None,
    reported_mode: str | None = None,
) -> dict[str, object]:
    """Run one room snapshot with registry aliases and target evidence."""
    from custom_components.smarthomeshop import room_runtime

    profile_contract = SimpleNamespace(
        radar_model="ld2460",
        supplementary_presence_sensors=(),
        tracking_presence_entity_id="binary_sensor.radar_presence",
        tracking_target_count_entity_id="sensor.radar_target_count",
        positioning_available=True,
        coordinate_frame="x_lateral_y_forward",
        required_installation_mode="side",
        current_hardware_mode="side",
        reported_installation_mode_entity_id=(
            "sensor.radar_reported_mode" if reported_mode is not None else None
        ),
    )
    profile = SimpleNamespace(
        device_id="registry-radar",
        entity_prefix="arbitrary-prefix",
        aliases=("legacy-alias-a", "legacy-alias-b"),
        name="Radar",
        profile=profile_contract,
        targets=(
            SimpleNamespace(
                presence_entity_id="binary_sensor.radar_target_1_presence"
            ),
        ),
    )
    monkeypatch.setattr(
        room_runtime, "discover_radar_device_profiles", lambda _hass: [profile]
    )
    monkeypatch.setattr(room_runtime.er, "async_get", lambda _hass: object())
    monkeypatch.setattr(
        room_runtime.er,
        "async_entries_for_device",
        lambda _registry, _device_id: [],
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "office",
                "name": "Office",
                "sensors": sensors,
                "aggregation": aggregation or {
                    "presence": {"source_ids": selected_ids or []},
                },
            }]

        def get_room_runtime(self):
            return {}

        async def async_set_room_runtime(self, _runtime):
            return None

    state_map = dict(states or {})
    if reported_mode is not None:
        state_map["sensor.radar_reported_mode"] = State(
            "sensor.radar_reported_mode", reported_mode
        )
    fake = SimpleNamespace(
        hass=SimpleNamespace(states=SimpleNamespace(get=state_map.get)),
        store=_Store(),
        _refresh_listener=lambda _entities: None,
    )
    return asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))["office"]


def test_target_presence_overrides_conflicting_primary_clear(monkeypatch) -> None:
    room = _run_radar_room(
        monkeypatch,
        sensors=[{"id": "radar", "deviceId": "legacy-alias-a"}],
        states={
            "binary_sensor.radar_presence": State(
                "binary_sensor.radar_presence", "off"
            ),
            "sensor.radar_target_count": State("sensor.radar_target_count", "0"),
            "binary_sensor.radar_target_1_presence": State(
                "binary_sensor.radar_target_1_presence", "on"
            ),
        },
    )
    assert room["presence"]["occupied"] is True
    assert room["presence"]["positive_sources"] == ["radar"]


def test_target_count_overrides_conflicting_primary_clear(monkeypatch) -> None:
    room = _run_radar_room(
        monkeypatch,
        sensors=[{"id": "radar", "deviceId": "legacy-alias-a"}],
        states={
            "binary_sensor.radar_presence": State(
                "binary_sensor.radar_presence", "off"
            ),
            "sensor.radar_target_count": State("sensor.radar_target_count", "2"),
            "binary_sensor.radar_target_1_presence": State(
                "binary_sensor.radar_target_1_presence", "off"
            ),
        },
    )
    assert room["presence"]["occupied"] is True
    assert room["presence"]["positive_sources"] == ["radar"]


@pytest.mark.parametrize("reported_mode", ["top", "unknown", "unavailable"])
def test_wrong_or_unknown_configurable_radar_mode_never_reports_clear(
    monkeypatch, reported_mode: str
) -> None:
    room = _run_radar_room(
        monkeypatch,
        sensors=[{"id": "radar", "deviceId": "legacy-alias-a"}],
        reported_mode=reported_mode,
        states={
            "binary_sensor.radar_presence": State(
                "binary_sensor.radar_presence", "off"
            ),
            "sensor.radar_target_count": State("sensor.radar_target_count", "0"),
            "binary_sensor.radar_target_1_presence": State(
                "binary_sensor.radar_target_1_presence", "off"
            ),
        },
    )
    assert room["presence"]["occupied"] is None
    assert room["presence"]["status"] == "unknown"


def test_selected_legacy_alias_wins_physical_device_deduplication(monkeypatch) -> None:
    room = _run_radar_room(
        monkeypatch,
        sensors=[
            {"id": "unselected", "deviceId": "legacy-alias-a"},
            {"id": "selected", "deviceId": "legacy-alias-b"},
        ],
        selected_ids=["selected"],
        states={
            "binary_sensor.radar_presence": State(
                "binary_sensor.radar_presence", "on"
            ),
            "sensor.radar_target_count": State("sensor.radar_target_count", "1"),
            "binary_sensor.radar_target_1_presence": State(
                "binary_sensor.radar_target_1_presence", "on"
            ),
        },
    )
    assert room["presence"]["occupied"] is True
    assert room["presence"]["positive_sources"] == ["selected"]
    assert [source["source_id"] for source in room["sources"]] == ["selected"]


def test_climate_primary_alias_maps_to_retained_physical_source(monkeypatch) -> None:
    """Two registry aliases of one device must not orphan primary climate."""
    from custom_components.smarthomeshop import room_runtime

    monkeypatch.setattr(
        room_runtime,
        "_resolve_climate_entities",
        lambda _hass, _device_id: {"temperature": "sensor.room_temperature"},
    )
    room = _run_radar_room(
        monkeypatch,
        sensors=[
            {"id": "retained", "deviceId": "legacy-alias-a"},
            {"id": "climate-choice", "deviceId": "legacy-alias-b"},
        ],
        aggregation={
            "presence": {"source_ids": []},
            "climate": {
                "temperature": {
                    "strategy": "primary",
                    "primary_source_id": "climate-choice",
                }
            },
        },
        states={
            "binary_sensor.radar_presence": State(
                "binary_sensor.radar_presence", "off"
            ),
            "sensor.radar_target_count": State("sensor.radar_target_count", "0"),
            "binary_sensor.radar_target_1_presence": State(
                "binary_sensor.radar_target_1_presence", "off"
            ),
            "sensor.room_temperature": State(
                "sensor.room_temperature", "21.5", {"unit_of_measurement": "°C"}
            ),
        },
    )
    assert room["climate"]["temperature"]["value"] == 21.5
    assert room["climate"]["temperature"]["primary_source_id"] == "retained"
    assert room["climate"]["temperature"]["source_ids"] == ["retained"]


def test_invalid_aggregation_settings_are_normalized_safely() -> None:
    room = normalize_room_config(
        {
            "id": "office",
            "sensors": [{"id": "source-a", "deviceId": "device-a"}],
            "aggregation": {
                "presence": {
                    "freshness_seconds": "broken",
                    "vacancy_delay_seconds": 900,
                    "source_ids": ["source-a", "missing", "source-a"],
                },
                "climate": {
                    "temperature": {
                        "strategy": "invented",
                        "primary_source_id": "missing",
                    }
                },
                "tracking": {
                    "experimental_fusion": "yes",
                    "duplicate_distance_mm": 9999,
                },
            },
        }
    )

    assert room["aggregation"]["presence"] == {
        "freshness_seconds": 120,
        "vacancy_delay_seconds": 600,
        "source_ids": ["source-a"],
    }
    assert room["aggregation"]["climate"]["temperature"] == {
        "strategy": "average",
        "primary_source_id": None,
    }
    assert room["aggregation"]["tracking"] == {
        "experimental_fusion": False,
        "duplicate_distance_mm": 1500,
        "observation_freshness_ms": 5000,
        "handoff_hold_ms": 1800,
        "z_tolerance_mm": 700,
        "source_alignments": {},
    }


def test_tracking_alignment_and_z_mapping_are_normalized_without_unknown_sources() -> None:
    room = normalize_room_config(
        {
            "id": "office",
            "sensors": [
                {
                    "id": "source-a",
                    "deviceId": "device-a",
                    "z_mapping": {
                        "mode": "sensor_down",
                        "verified": True,
                        "verification_fingerprint": "device-a|placement",
                    },
                }
            ],
            "aggregation": {
                "tracking": {
                    "observation_freshness_ms": 99999,
                    "handoff_hold_ms": -1,
                    "z_tolerance_mm": 1,
                    "source_alignments": {
                        "source-a": {
                            "placement_fingerprint": "device-a|0|0|0|0||1",
                            "verified_at": "2026-11-09T12:00:00Z",
                            "sample_count": 3,
                            "rmse_mm": 123.4,
                            "duplicate_distance_mm": 650,
                        },
                        "missing": {
                            "placement_fingerprint": "wrong",
                            "verified_at": "now",
                            "sample_count": 3,
                            "rmse_mm": 10,
                        },
                    },
                }
            },
        }
    )
    assert room["sensors"][0]["z_mapping"] == {
        "mode": "sensor_down",
        "verified": True,
        "verification_fingerprint": "device-a|placement",
    }
    assert room["aggregation"]["tracking"]["observation_freshness_ms"] == 15000
    assert room["aggregation"]["tracking"]["handoff_hold_ms"] == 0
    assert room["aggregation"]["tracking"]["z_tolerance_mm"] == 100
    assert list(room["aggregation"]["tracking"]["source_alignments"]) == ["source-a"]
    assert room["aggregation"]["tracking"]["source_alignments"]["source-a"][
        "duplicate_distance_mm"
    ] == 650


def test_any_fresh_positive_source_keeps_room_occupied() -> None:
    result = evaluate_room_presence(
        [_signal("a", "positive"), _signal("b", "unknown")],
        {"occupied": False},
        now=100,
        vacancy_delay_seconds=30,
    )
    assert result["occupied"] is True
    assert result["degraded"] is True
    assert result["positive_sources"] == ["a"]
    assert result["unknown_sources"] == ["b"]


def test_missing_source_never_turns_room_clear() -> None:
    result = evaluate_room_presence(
        [_signal("a", "negative"), _signal("b", "unknown")],
        {"occupied": True},
        now=100,
        vacancy_delay_seconds=30,
    )
    assert result["occupied"] is None
    assert result["status"] == "unknown"
    assert result["degraded"] is True


def test_all_negative_sources_respect_persisted_vacancy_delay_after_restart() -> None:
    signals = [_signal("a", "negative"), _signal("b", "negative")]
    pending = evaluate_room_presence(
        signals,
        {"occupied": True},
        now=100,
        vacancy_delay_seconds=30,
    )
    assert pending["occupied"] is True
    assert pending["status"] == "clearing"
    assert pending["pending_clear_since"] == 100

    # The second call models a fresh coordinator after restart.
    restored = evaluate_room_presence(
        signals,
        pending,
        now=131,
        vacancy_delay_seconds=30,
    )
    assert restored["occupied"] is False
    assert restored["status"] == "clear"


def test_empty_source_set_is_unknown() -> None:
    result = evaluate_room_presence(
        [], {"occupied": False}, now=100, vacancy_delay_seconds=30
    )
    assert result["occupied"] is None
    assert result["status"] == "unknown"


def test_freshness_rejects_stale_and_future_timestamps() -> None:
    assert _fresh_age(95, 100, 10) == 5
    assert _fresh_age(80, 100, 10) is None
    assert _fresh_age(101, 100, 10) is None
    assert _fresh_age(106, 100, 10) is None


def test_duplicate_updates_do_not_restart_clear_delay() -> None:
    signal = [_signal("a", "negative")]
    first = evaluate_room_presence(
        signal, {"occupied": True}, now=100, vacancy_delay_seconds=30
    )
    duplicate = evaluate_room_presence(
        signal, first, now=110, vacancy_delay_seconds=30
    )
    assert duplicate["pending_clear_since"] == 100


def test_unknown_interval_restarts_continuous_clear_delay() -> None:
    first_negative = evaluate_room_presence(
        [_signal("a", "negative")],
        {"occupied": True},
        now=100,
        vacancy_delay_seconds=30,
    )
    uncertain = evaluate_room_presence(
        [_signal("a", "unknown")],
        first_negative,
        now=120,
        vacancy_delay_seconds=30,
    )
    assert uncertain["occupied"] is None
    assert uncertain["pending_clear_since"] is None
    assert uncertain["last_known_occupied"] is True

    negative_again = evaluate_room_presence(
        [_signal("a", "negative")],
        uncertain,
        now=125,
        vacancy_delay_seconds=30,
    )
    assert negative_again["occupied"] is True
    assert negative_again["status"] == "clearing"
    assert negative_again["pending_clear_since"] == 125


def test_temperature_values_are_normalized_before_room_average() -> None:
    now = datetime.now(UTC)
    fahrenheit = State(
        "sensor.reference_f",
        "68",
        {"unit_of_measurement": "°F"},
        last_changed=now,
        last_reported=now,
        last_updated=now,
    )
    kelvin = State(
        "sensor.reference_k",
        "293.15",
        {"unit_of_measurement": "K"},
        last_changed=now,
        last_reported=now,
        last_updated=now,
    )
    unsupported = State(
        "sensor.reference_unknown",
        "20",
        {"unit_of_measurement": "degrees"},
        last_changed=now,
        last_reported=now,
        last_updated=now,
    )
    assert _normalise_climate_value("temperature", fahrenheit) == 20
    assert round(_normalise_climate_value("temperature", kelvin) or -1, 5) == 20
    assert _normalise_climate_value("temperature", unsupported) is None


def test_steady_presence_trusts_home_assistant_availability() -> None:
    now = datetime.now(UTC)
    stale = State(
        "binary_sensor.stale_presence",
        "off",
        last_changed=now,
        last_reported=datetime.fromtimestamp(now.timestamp() - 121, UTC),
        last_updated=now,
    )
    future = State(
        "binary_sensor.future_presence",
        "on",
        last_changed=now,
        last_reported=datetime.fromtimestamp(now.timestamp() + 6, UTC),
        last_updated=now,
    )
    fresh = State(
        "binary_sensor.fresh_presence",
        "on",
        last_changed=now,
        last_reported=now,
        last_updated=now,
    )
    assert _presence_state_status(stale, now.timestamp(), 120)[0] == "negative"
    assert _presence_state_status(future, now.timestamp(), 120)[0] == "unknown"
    assert _presence_state_status(fresh, now.timestamp(), 120)[0] == "positive"
    unavailable = State(
        "binary_sensor.unavailable_presence",
        "unavailable",
        last_changed=now,
        last_reported=now,
        last_updated=now,
    )
    assert _presence_state_status(unavailable, now.timestamp(), 120)[0] == "unknown"


def test_climate_rejects_future_reports_but_keeps_steady_available_values() -> None:
    now = datetime.now(UTC)
    old = State(
        "sensor.steady_temperature",
        "21.5",
        last_changed=now - timedelta(hours=2),
        last_reported=now - timedelta(hours=2),
        last_updated=now - timedelta(hours=2),
    )
    future = State(
        "sensor.future_temperature",
        "22.0",
        last_changed=now,
        last_reported=now + timedelta(seconds=1),
        last_updated=now,
    )
    assert _climate_report_is_fresh(old, now.timestamp(), 120) is True
    assert _climate_report_is_fresh(future, now.timestamp(), 120) is False


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "Missing identifier"},
        {"id": "broken-walls", "walls": None},
        {"id": "broken-doors", "doors": [None]},
        {"id": "broken-zones", "zones": "not-a-list"},
        {"id": "broken-zone-parts", "zones": [{"id": "bad", "parts": {}}]},
        {"id": "broken-zone-points", "zones": [{"id": "bad", "points": [None]}]},
        {"id": "broken-zone-x", "zones": [{"id": "bad", "points": [{"x": "NaN", "y": 0}]}]},
        {"id": "broken-zone-bool", "zones": [{"id": "bad", "points": [{"x": True, "y": 0}]}]},
        {"id": "broken-zone-part-y", "zones": [{"id": "bad", "parts": [[{"x": 0, "y": float("inf")}]]}]},
        {"id": "broken-calibration", "calibration": "0,0;1,1"},
        {"id": "broken-calibration-corners", "calibration": {"corners": "0,0"}},
        {"id": "broken-calibration-point", "calibration": {"corners": [{"x": 0, "y": "NaN"}]}},
        {"id": "broken-enabled-calibration", "calibration": {"enabled": True, "corners": []}},
    ],
)
def test_malformed_room_structure_is_rejected_before_runtime(payload) -> None:
    with pytest.raises(ValueError):
        normalize_room_config(payload)


def test_room_normalization_preserves_unknown_nested_metadata() -> None:
    room = normalize_room_config(
        {
            "id": "future-room",
            "sensors": [
                {
                    "id": "source-a",
                    "deviceId": "device-a",
                    "z_mapping": {
                        "mode": "floor_up",
                        "verified": True,
                        "verification_fingerprint": "fingerprint",
                        "future_mapping_field": {"keep": True},
                    },
                }
            ],
            "aggregation": {
                "future_aggregation_field": "keep",
                "tracking": {
                    "experimental_fusion": True,
                    "duplicate_distance_mm": 650,
                    "future_tracking_field": "keep",
                    "source_alignments": {
                        "source-a": {
                            "placement_fingerprint": "device-a|placement",
                            "verified_at": "2026-11-12T10:00:00Z",
                            "sample_count": 4,
                            "rmse_mm": 80,
                            "duplicate_distance_mm": 650,
                            "future_alignment_field": {"keep": True},
                        }
                    },
                },
            },
        }
    )
    assert room["sensors"][0]["z_mapping"]["future_mapping_field"] == {"keep": True}
    assert room["aggregation"]["future_aggregation_field"] == "keep"
    assert room["aggregation"]["tracking"]["future_tracking_field"] == "keep"
    assert room["aggregation"]["tracking"]["source_alignments"]["source-a"][
        "future_alignment_field"
    ] == {"keep": True}


def test_legacy_zone_owner_is_canonicalized_without_broadening() -> None:
    room = normalize_room_config({
        "id": "owned-zone",
        "zones": [{
            "id": "reflection",
            "sensorId": None,
            "sensor_id": "source-a",
            "points": [{"x": 0, "y": 0}, {"x": 1, "y": 0}, {"x": 1, "y": 1}],
        }],
    })
    assert room["zones"][0]["sensorId"] == "source-a"
    assert "sensor_id" not in room["zones"][0]


def test_alignment_with_excessive_error_is_not_restored() -> None:
    room = normalize_room_config(
        {
            "id": "office",
            "sensors": [{"id": "source-a", "deviceId": "device-a"}],
            "aggregation": {
                "tracking": {
                    "source_alignments": {
                        "source-a": {
                            "placement_fingerprint": "device-a|placement",
                            "verified_at": "2026-11-09T12:00:00Z",
                            "sample_count": 3,
                            "rmse_mm": 451,
                        }
                    }
                }
            },
        }
    )
    assert room["aggregation"]["tracking"]["source_alignments"] == {}


def test_alignment_with_a_different_duplicate_distance_is_not_restored() -> None:
    room = normalize_room_config(
        {
            "id": "office",
            "sensors": [{"id": "source-a", "deviceId": "device-a"}],
            "aggregation": {
                "tracking": {
                    "duplicate_distance_mm": 500,
                    "source_alignments": {
                        "source-a": {
                            "placement_fingerprint": "device-a|placement",
                            "verified_at": "2026-11-09T12:00:00Z",
                            "sample_count": 3,
                            "rmse_mm": 100,
                            "duplicate_distance_mm": 650,
                        }
                    },
                }
            },
        }
    )
    assert room["aggregation"]["tracking"]["source_alignments"] == {}


def test_a_radar_in_two_rooms_stays_unknown_and_raises_a_repair(monkeypatch) -> None:
    """Rooms stored by an older version may share a radar; tell the user."""
    from custom_components.smarthomeshop import room_runtime

    profile = SimpleNamespace(
        device_id="registry-radar",
        entity_prefix="arbitrary-prefix",
        aliases=("legacy-alias-a",),
        name="Hall radar",
        profile=SimpleNamespace(
            radar_model="ld2450",
            supplementary_presence_sensors=(),
            tracking_presence_entity_id="binary_sensor.radar_presence",
            tracking_target_count_entity_id=None,
            positioning_available=True,
            coordinate_frame="x_lateral_y_forward",
            required_installation_mode="side",
            current_hardware_mode="side",
            reported_installation_mode_entity_id=None,
        ),
        targets=(),
    )
    monkeypatch.setattr(room_runtime, "discover_radar_device_profiles", lambda _hass: [profile])
    monkeypatch.setattr(room_runtime.er, "async_get", lambda _hass: object())
    monkeypatch.setattr(room_runtime.er, "async_entries_for_device", lambda _registry, _device_id: [])
    issues: dict[str, dict[str, object]] = {}
    monkeypatch.setattr(
        room_runtime.ir, "async_create_issue",
        lambda _hass, _domain, issue_id, **kwargs: issues.__setitem__(issue_id, kwargs),
    )
    monkeypatch.setattr(
        room_runtime.ir, "async_delete_issue",
        lambda _hass, _domain, issue_id: issues.pop(issue_id, None),
    )
    rooms = [
        {"id": "hall", "name": "Hall", "sensors": [{"id": "a", "deviceId": "registry-radar"}]},
        {"id": "stairs", "name": "Stairs", "sensors": [{"id": "b", "deviceId": "legacy-alias-a"}]},
    ]

    class _Store:
        def get_rooms(self):
            return rooms

        def get_room_runtime(self):
            return {}

        async def async_set_room_runtime(self, _runtime):
            return None

    now = datetime.now(UTC)
    states = {"binary_sensor.radar_presence": State(
        "binary_sensor.radar_presence", "on", last_reported=now, last_updated=now,
    )}
    fake = SimpleNamespace(
        hass=SimpleNamespace(states=SimpleNamespace(get=states.get)),
        store=_Store(),
        _refresh_listener=lambda _entities: None,
        _shared_radar_issues={},
    )

    snapshot = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert snapshot["hall"]["sources"][0]["status"] == "unknown"
    assert snapshot["stairs"]["sources"][0]["status"] == "unknown"
    assert issues["radar_in_two_rooms_registry-radar"]["translation_key"] == "radar_in_two_rooms"
    assert issues["radar_in_two_rooms_registry-radar"]["translation_placeholders"] == {
        "radar": "Hall radar", "rooms": "Hall, Stairs",
    }

    rooms[1]["sensors"] = []
    snapshot = asyncio.run(RoomRuntimeCoordinator._async_update_data(fake))
    assert snapshot["hall"]["sources"][0]["status"] == "positive"
    assert issues == {}
