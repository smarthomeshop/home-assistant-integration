"""WebSocket contract tests for authoritative room runtime health."""

from __future__ import annotations

import asyncio
import inspect
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop.room_runtime import ROOM_RUNTIME_COORDINATOR
from custom_components.smarthomeshop import websocket_api


class _Connection:
    def __init__(self) -> None:
        self.result = None
        self.error = None
        self.user = SimpleNamespace(is_admin=True)

    def send_result(self, _message_id, result) -> None:
        self.result = result

    def send_error(self, _message_id, code, message) -> None:
        self.error = (code, message)


def test_device_radar_snapshot_rejects_stale_coordinate_slots() -> None:
    now = datetime.now(UTC)
    target = SimpleNamespace(
        index=1,
        x_entity_id="sensor.any_prefix_target_1_x",
        y_entity_id="sensor.any_prefix_target_1_y",
        z_entity_id="sensor.any_prefix_target_1_z",
        presence_entity_id=None,
    )
    radar = SimpleNamespace(
        coordinate_scale_to_mm=1000,
        installation_height_m=2.6,
        mounting_height_mm=2600,
        required_installation_mode=None,
        current_hardware_mode=None,
        installation_angle_deg=None,
        radar_model="ld6002b",
        positioning_available=True,
        mounting_mode="ceiling",
        coordinate_projection="floor_xy",
        coordinate_frame="x_lateral_y_forward_z_height",
        maximum_range_mm=6000,
        field_of_view_deg=120,
        maximum_targets=1,
        detection_distance_m=None,
        detection_start_angle_deg=None,
        detection_end_angle_deg=None,
    )

    def state(value: str, age_seconds: int):
        return SimpleNamespace(
            state=value,
            last_reported=now - timedelta(seconds=age_seconds),
            last_updated=now - timedelta(seconds=age_seconds),
        )

    states = {
        target.x_entity_id: state("1.2", 2),
        target.y_entity_id: state("0.8", 30),
        target.z_entity_id: state("1.1", 30),
    }
    hass = SimpleNamespace(states=SimpleNamespace(get=states.get))
    profile = SimpleNamespace(profile=radar, targets=[target])

    assert websocket_api._radar_live_snapshot(hass, profile)["targets"] == []

    states[target.y_entity_id] = state("0.8", 2)
    snapshot = websocket_api._radar_live_snapshot(hass, profile)
    assert len(snapshot["targets"]) == 1
    target_snapshot = snapshot["targets"][0]
    assert target_snapshot["index"] == 1
    assert target_snapshot["x_mm"] == 1200.0
    assert target_snapshot["y_mm"] == 800.0
    assert target_snapshot["z_mm"] is None
    assert target_snapshot["presence"] is None
    assert target_snapshot["updated_at"] == states[target.y_entity_id].last_reported.isoformat()
    assert 1900 <= target_snapshot["age_ms"] <= 2500

    states[target.z_entity_id] = state("1.1", 2)
    snapshot = websocket_api._radar_live_snapshot(hass, profile)
    assert snapshot["targets"][0]["z_mm"] == 1100.0


def test_device_radar_room_context_uses_canonical_device_association() -> None:
    room = {
        "id": "living-room",
        "name": "Living room",
        "ceilingHeightMm": 2750,
        "walls": [{"x1": 0, "y1": 0, "x2": 4000, "y2": 0}],
        "zones": [{"id": "sofa", "points": [{"x": 100, "y": 200}]}],
        "furniture": [{"id": "seat", "x": 500, "y": 600}],
        "sensors": [
            {"id": "source-one", "deviceId": "source-device", "x": 20, "y": 30},
        ],
    }

    class _Store:
        def get_rooms(self):
            return [room]

    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    profile = SimpleNamespace(device_id="source-device", aliases=("radar-alias",))
    result = websocket_api._room_context_for_radar(hass, "source-device", profile)

    assert result is not None
    assert result["id"] == "living-room"
    assert result["linked_sensor_id"] == "source-one"
    assert result["ceiling_height_mm"] == 2750
    # The device page receives a safe copy, never the mutable stored object.
    result["walls"][0]["x1"] = 999
    assert room["walls"][0]["x1"] == 0


def test_device_radar_room_context_supports_legacy_profile_alias_and_unlinked() -> None:
    class _Store:
        def get_rooms(self):
            return [{
                "id": "legacy",
                "sensors": [{"id": "legacy-source", "deviceId": "radar-alias"}],
            }]

    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    profile = SimpleNamespace(device_id="source-device", aliases=("radar-alias",))
    assert websocket_api._room_context_for_radar(hass, "source-device", profile)[
        "linked_sensor_id"
    ] == "legacy-source"

    unlinked = SimpleNamespace(device_id="other", aliases=("other-alias",))
    assert websocket_api._room_context_for_radar(hass, "other", unlinked) is None


def test_rooms_response_exposes_recovery_count_without_corrupt_payloads() -> None:
    class _Store:
        def get_rooms(self):
            return [{"id": "working"}]

        def get_invalid_room_summary(self):
            return {"count": 2}

    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    connection = _Connection()
    inspect.unwrap(websocket_api.ws_get_rooms)(hass, connection, {"id": 0})
    assert connection.result == {
        "rooms": [{"id": "working"}],
        "recovery": {"count": 2},
    }


def test_room_runtime_exposes_failed_coordinator_as_unavailable() -> None:
    coordinator = SimpleNamespace(
        last_update_success=False,
        data={
            "office": {
                "updated_at": "2026-11-10T08:00:00+00:00",
                "presence": {"occupied": False, "status": "clear"},
            }
        },
    )
    hass = SimpleNamespace(data={DOMAIN: {ROOM_RUNTIME_COORDINATOR: coordinator}})
    connection = _Connection()

    inspect.unwrap(websocket_api.ws_get_room_runtime)(hass, connection, {"id": 1})

    assert connection.result["available"] is False
    assert connection.result["rooms"]["office"]["presence"]["status"] == "clear"
    assert connection.result["updated_at"] == "2026-11-10T08:00:00+00:00"


def test_room_runtime_requires_a_recent_successful_snapshot() -> None:
    coordinator = SimpleNamespace(
        last_update_success=True,
        data={"office": {"updated_at": datetime.now(UTC).isoformat()}},
    )
    hass = SimpleNamespace(data={DOMAIN: {ROOM_RUNTIME_COORDINATOR: coordinator}})
    connection = _Connection()

    inspect.unwrap(websocket_api.ws_get_room_runtime)(hass, connection, {"id": 2})

    assert connection.result["available"] is True


def test_room_runtime_overlays_durable_tracking_when_coordinator_is_stale() -> None:
    coordinator = SimpleNamespace(
        last_update_success=False,
        data={
            "office": {
                "updated_at": "2026-11-10T08:00:00+00:00",
                "tracking": {
                    "experimental_fusion": True,
                    "source_alignments": {"stale": {"sample_count": 4}},
                },
            }
        },
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "office",
                "aggregation": {
                    "tracking": {
                        "experimental_fusion": False,
                        "source_alignments": {},
                        "alignment_revoked_at": "2026-11-12T10:00:00Z",
                    }
                },
            }]

    hass = SimpleNamespace(data={DOMAIN: {
        ROOM_RUNTIME_COORDINATOR: coordinator,
        "store": _Store(),
    }})
    connection = _Connection()

    inspect.unwrap(websocket_api.ws_get_room_runtime)(hass, connection, {"id": 22})

    assert connection.result["tracking_authoritative"] is True
    assert connection.result["rooms"]["office"]["tracking"] == {
        "experimental_fusion": False,
        "source_alignments": {},
        "alignment_revoked_at": "2026-11-12T10:00:00Z",
    }
    assert connection.result["available"] is False


def test_room_save_rejects_aliases_of_the_same_physical_radar(monkeypatch) -> None:
    profile = SimpleNamespace(
        device_id="registry-device",
        entity_prefix="legacy-prefix",
        aliases=("friendly-alias",),
    )
    monkeypatch.setattr(
        websocket_api,
        "discover_radar_device_profiles",
        lambda _hass: [profile],
    )
    hass = SimpleNamespace(data={DOMAIN: {"store": object()}})
    connection = _Connection()
    message = {
        "id": 3,
        "room": {
            "name": "Office",
            "sensors": [
                {"id": "first", "deviceId": "registry-device"},
                {"id": "second", "deviceId": "friendly-alias"},
            ],
        },
    }

    asyncio.run(
        inspect.unwrap(websocket_api.ws_save_room)(hass, connection, message)
    )

    assert connection.error is not None
    assert connection.error[0] == "invalid_format"


def test_room_save_rejects_one_physical_radar_in_two_rooms(monkeypatch) -> None:
    profile = SimpleNamespace(
        device_id="registry-device",
        entity_prefix="legacy-prefix",
        aliases=("friendly-alias",),
    )
    monkeypatch.setattr(
        websocket_api,
        "discover_radar_device_profiles",
        lambda _hass: [profile],
    )
    monkeypatch.setattr(
        websocket_api,
        "radar_profile_for_device",
        lambda _hass, device_id: profile if device_id == "registry-device" else None,
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "living",
                "name": "Living",
                "sensors": [{"id": "living-radar", "deviceId": "registry-device"}],
            }]

        async def async_save_room(self, *_args, **_kwargs):
            raise AssertionError("a conflicting room must never be saved")

    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    connection = _Connection()
    asyncio.run(inspect.unwrap(websocket_api.ws_save_room)(hass, connection, {
        "id": 31,
        "create": True,
        "room": {
            "id": "office",
            "name": "Office",
            "sensors": [{"id": "office-radar", "deviceId": "friendly-alias"}],
        },
    }))
    assert connection.error is not None
    assert connection.error[0] == "duplicate_device"


def test_floor_plan_save_rejects_cross_room_radar_conflict(monkeypatch) -> None:
    profile = SimpleNamespace(
        device_id="registry-device",
        entity_prefix="legacy-prefix",
        aliases=("friendly-alias",),
    )
    monkeypatch.setattr(
        websocket_api,
        "discover_radar_device_profiles",
        lambda _hass: [profile],
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "living",
                "name": "Living",
                "sensors": [{"id": "shared-source", "deviceId": "registry-device"}],
            }]

        async def async_save_floor_plan(self, *_args, **_kwargs):
            raise AssertionError("a conflicting plan must never be saved")

    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    connection = _Connection()
    asyncio.run(inspect.unwrap(websocket_api.ws_save_floor_plan)(hass, connection, {
        "id": 32,
        "project": {},
        "changes": [{
            "id": "office",
            "name": "Office",
            "house": {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
            "sensors": [{"id": "shared-source", "deviceId": "registry-device"}],
        }],
        "removed": [],
        "revisions": {"office": None},
        "version": "test",
    }))
    assert connection.error is not None
    assert connection.error[0] == "duplicate_device"


def test_floor_plan_duplicate_check_merges_partial_room_patches(monkeypatch) -> None:
    profile = SimpleNamespace(
        device_id="registry-device",
        entity_prefix="legacy-prefix",
        aliases=(),
    )
    monkeypatch.setattr(
        websocket_api,
        "discover_radar_device_profiles",
        lambda _hass: [profile],
    )
    monkeypatch.setattr(
        websocket_api,
        "radar_profile_for_device",
        lambda _hass, device_id: profile if device_id == "registry-device" else None,
    )

    class _Store:
        def get_rooms(self):
            return [{
                "id": "living",
                "name": "Living",
                "sensors": [{"id": "living-source", "deviceId": "registry-device"}],
            }]

        async def async_save_floor_plan(self, *_args, **_kwargs):
            raise AssertionError("merged retained sensors must be validated")

    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    connection = _Connection()
    asyncio.run(inspect.unwrap(websocket_api.ws_save_floor_plan)(hass, connection, {
        "id": 33,
        "project": {},
        "changes": [
            {
                "id": "living",
                "name": "Renamed Living",
                "house": {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
            },
            {
                "id": "office",
                "name": "Office",
                "house": {"x": 5000, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
                "sensors": [{"id": "office-source", "deviceId": "registry-device"}],
            },
        ],
        "removed": [],
        "revisions": {"living": "old", "office": None},
        "version": "test",
    }))
    assert connection.error is not None
    assert connection.error[0] == "duplicate_device"


def test_alignment_revocation_uses_narrow_store_mutation(monkeypatch) -> None:
    saved = {
        "id": "office",
        "name": "Office",
        "aggregation": {
            "tracking": {"experimental_fusion": False, "source_alignments": {}}
        },
    }

    class _Store:
        async def async_revoke_room_alignment(self, room_id):
            assert room_id == "office"
            return {"room": saved, "replaced_updated_at": "previous"}

    coordinator = SimpleNamespace(async_rooms_changed=lambda: None)
    hass = SimpleNamespace(data={DOMAIN: {
        "store": _Store(),
        ROOM_RUNTIME_COORDINATOR: coordinator,
    }})
    connection = _Connection()
    monkeypatch.setattr(websocket_api, "async_dispatcher_send", lambda *_args: None)

    asyncio.run(inspect.unwrap(websocket_api.ws_revoke_room_alignment)(
        hass, connection, {"id": 4, "room_id": "office"}
    ))

    assert connection.error is None
    assert connection.result == {"room": saved, "replaced_updated_at": "previous"}


def _shared_radar_rooms():
    """Two rooms that share one radar, as an older version could store them."""
    return [
        {"id": "living", "name": "Living", "sensors": [{"id": "a", "deviceId": "registry-device"}]},
        {"id": "kitchen", "name": "Kitchen", "sensors": [{"id": "b", "deviceId": "legacy-prefix"}]},
        {"id": "office", "name": "Office", "sensors": []},
    ]


def test_an_existing_shared_radar_never_blocks_other_saves(monkeypatch) -> None:
    profile = SimpleNamespace(device_id="registry-device", entity_prefix="legacy-prefix", aliases=())
    monkeypatch.setattr(websocket_api, "discover_radar_device_profiles", lambda _hass: [profile])
    monkeypatch.setattr(
        websocket_api, "radar_profile_for_device",
        lambda _hass, device_id: profile if device_id == "registry-device" else None,
    )
    saved: list[str] = []

    class _Store:
        def get_rooms(self):
            return _shared_radar_rooms()

        async def async_save_floor_plan(self, *_args, **_kwargs):
            saved.append("plan")
            return {"rooms": []}

        async def async_save_room(self, room, *, create, validate_rooms):
            rooms = [item for item in self.get_rooms() if item["id"] != room["id"]]
            validate_rooms([*rooms, room])
            saved.append(room["id"])
            return room

    monkeypatch.setattr(websocket_api, "async_dispatcher_send", lambda *_args: None)
    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    house = {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True}

    connection = _Connection()
    asyncio.run(inspect.unwrap(websocket_api.ws_save_floor_plan)(hass, connection, {
        "id": 40, "project": {}, "removed": [], "version": "test",
        "changes": [{"id": "office", "name": "Study", "house": house}],
        "revisions": {"office": None},
    }))
    assert connection.error is None

    connection = _Connection()
    asyncio.run(inspect.unwrap(websocket_api.ws_save_room)(hass, connection, {
        "id": 41, "create": False,
        "room": {"id": "living", "name": "Living room", "updated_at": "r1",
                 "sensors": [{"id": "a", "deviceId": "registry-device"}]},
    }))
    assert connection.error is None
    assert saved == ["plan", "living"]


def test_a_shared_radar_cannot_spread_to_another_room(monkeypatch) -> None:
    profile = SimpleNamespace(device_id="registry-device", entity_prefix="legacy-prefix", aliases=())
    monkeypatch.setattr(websocket_api, "discover_radar_device_profiles", lambda _hass: [profile])
    monkeypatch.setattr(
        websocket_api, "radar_profile_for_device",
        lambda _hass, device_id: profile if device_id == "registry-device" else None,
    )

    class _Store:
        def get_rooms(self):
            return _shared_radar_rooms()

        async def async_save_floor_plan(self, *_args, **_kwargs):
            raise AssertionError("a new shared link must never be saved")

    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    connection = _Connection()
    asyncio.run(inspect.unwrap(websocket_api.ws_save_floor_plan)(hass, connection, {
        "id": 42, "project": {}, "removed": [], "version": "test",
        "changes": [{
            "id": "office", "name": "Office",
            "house": {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
            "sensors": [{"id": "c", "deviceId": "registry-device"}],
        }],
        "revisions": {"office": None},
    }))
    assert connection.error is not None
    assert connection.error[0] == "duplicate_device"

    # Moving it from the kitchen to the office while the living room keeps
    # it is also a new link.
    aliases = {"legacy-prefix": "registry-device"}
    moved = _shared_radar_rooms()
    moved[1]["sensors"] = []
    moved[2]["sensors"] = [{"id": "c", "deviceId": "registry-device"}]
    assert websocket_api._duplicate_room_device(moved, aliases, _shared_radar_rooms()) == (
        "registry-device", "Living", "Office",
    )
    unlinked = _shared_radar_rooms()
    unlinked[1]["sensors"] = []
    assert websocket_api._duplicate_room_device(unlinked, aliases, _shared_radar_rooms()) is None


def test_floor_plan_save_rejects_one_radar_twice_in_one_room(monkeypatch) -> None:
    profile = SimpleNamespace(device_id="registry-device", entity_prefix="legacy-prefix", aliases=())
    monkeypatch.setattr(websocket_api, "discover_radar_device_profiles", lambda _hass: [profile])

    class _Store:
        def get_rooms(self):
            return []

        async def async_save_floor_plan(self, *_args, **_kwargs):
            raise AssertionError("a sensor would be merged away silently")

    hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    connection = _Connection()
    asyncio.run(inspect.unwrap(websocket_api.ws_save_floor_plan)(hass, connection, {
        "id": 43, "project": {}, "removed": [], "version": "test",
        "changes": [{
            "id": "office", "name": "Office",
            "house": {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
            "sensors": [
                {"id": "a", "deviceId": "registry-device"},
                {"id": "b", "deviceId": "legacy-prefix"},
            ],
        }],
        "revisions": {"office": None},
    }))
    assert connection.error is not None
    assert connection.error[0] == "invalid_format"
