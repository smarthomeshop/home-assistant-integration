"""Tests for room storage: loading, repair, saving and revisions."""

import asyncio

from custom_components.smarthomeshop import storage as storage_module
from custom_components.smarthomeshop.storage import (
    RoomConfigConflictError,
    SmartHomeShopStore,
)


def test_load_migrates_legacy_rooms_to_revision_checked_storage():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)

    class LegacyStore:
        saved = None

        async def async_load(self):
            return {"rooms": {"legacy": {"id": "legacy", "name": "Legacy"}}}

        async def async_save(self, data):
            self.saved = data

    backend = LegacyStore()
    store._store = backend
    asyncio.run(store.async_load())
    revision = store._data["rooms"]["legacy"].get("updated_at")
    assert isinstance(revision, str) and revision
    assert backend.saved["rooms"]["legacy"]["updated_at"] == revision


def test_load_isolates_one_corrupt_room_and_preserves_it_for_recovery(monkeypatch):
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original_normalize = storage_module.normalize_room_config

    def normalize(room):
        if room.get("id") == "broken":
            raise ValueError("simulated corrupt persisted room")
        return original_normalize(room)

    monkeypatch.setattr(storage_module, "normalize_room_config", normalize)

    class CorruptStore:
        saved = None

        async def async_load(self):
            return {"rooms": {
                "broken": {"id": "broken", "name": "Original corrupt data"},
                "working": {"id": "working", "name": "Working room"},
            }}

        async def async_save(self, data):
            self.saved = data

    backend = CorruptStore()
    store._store = backend
    asyncio.run(store.async_load())

    assert list(store._data["rooms"]) == ["working"]
    assert store._data["invalid_rooms"]["broken"]["name"] == "Original corrupt data"
    assert backend.saved["invalid_rooms"]["broken"]["id"] == "broken"
    assert store.get_invalid_room_summary() == {"count": 1}


def test_load_repairs_malformed_rooms_instead_of_hiding_them():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)

    class CorruptStore:
        saved = None

        async def async_load(self):
            return {"rooms": {
                "missing-id": {"name": "Missing identifier"},
                "bad-doors": {"id": "bad-doors", "name": "Hall", "doors": [None, {"id": "door"}]},
                "bad-zone": {
                    "id": "bad-zone", "name": "Office",
                    "zones": [{"id": "z1", "points": [{"x": "nan", "y": 1}]}, {"id": "z2", "points": []}],
                    "sensors": [{"id": "s", "deviceId": "radar", "x": "broken", "y": 200}],
                },
                "working": {"id": "working", "name": "Working room"},
            }}

        async def async_save(self, data):
            self.saved = data

    backend = CorruptStore()
    store._store = backend
    asyncio.run(store.async_load())

    assert set(store._data["rooms"]) == {"missing-id", "bad-doors", "bad-zone", "working"}
    assert store._data["rooms"]["missing-id"]["id"] == "missing-id"
    assert store._data["rooms"]["bad-doors"]["doors"] == [{"id": "door"}]
    office = store._data["rooms"]["bad-zone"]
    assert [zone["id"] for zone in office["zones"]] == ["z2"]
    assert office["sensors"][0]["deviceId"] == "radar"
    assert "x" not in office["sensors"][0] and office["sensors"][0]["y"] == 200
    # The originals stay until the user confirms in Repairs.
    assert set(store._data["repaired_rooms"]) == {"missing-id", "bad-doors", "bad-zone"}
    assert store._data["repaired_rooms"]["bad-doors"]["original"]["doors"][0] is None
    assert "invalid_rooms" not in store._data
    assert backend.saved["rooms"]["working"]["id"] == "working"


def test_rooms_an_earlier_start_could_not_read_come_back():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)

    class OldStore:
        saved = None

        async def async_load(self):
            return {
                "rooms": {"working": {"id": "working", "name": "Working"}},
                "invalid_rooms": {
                    "hall": {"id": "hall", "name": "Hall", "windows": "broken"},
                    "junk": "not a room",
                },
            }

        async def async_save(self, data):
            self.saved = data

    store._store = OldStore()
    asyncio.run(store.async_load())

    assert set(store._data["rooms"]) == {"working", "hall"}
    assert store._data["rooms"]["hall"]["windows"] == []
    assert store._data["invalid_rooms"] == {"junk": "not a room"}
    assert store.get_invalid_room_summary() == {"count": 1}


def test_repaired_and_unreadable_rooms_show_in_repairs_until_confirmed(monkeypatch):
    from types import SimpleNamespace

    issues = {}
    monkeypatch.setattr(
        storage_module.ir, "async_create_issue",
        lambda _hass, _domain, issue_id, **kwargs: issues.__setitem__(issue_id, kwargs),
    )
    monkeypatch.setattr(
        storage_module.ir, "async_delete_issue",
        lambda _hass, _domain, issue_id: issues.pop(issue_id, None),
    )
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store.hass = SimpleNamespace()

    class OldStore:
        async def async_load(self):
            return {"rooms": {
                "hall": {"id": "hall", "name": "Hall", "doors": [None]},
                "junk": "not a room",
            }}

        async def async_save(self, data):
            return None

    store._store = OldStore()
    asyncio.run(store.async_load())
    assert issues["room_data_repaired"]["translation_placeholders"] == {"rooms": "Hall"}
    assert issues["room_data_unreadable"]["translation_placeholders"] == {"count": "1"}

    asyncio.run(store.async_clear_room_recovery("room_data_repaired"))
    assert "repaired_rooms" not in store._data
    assert set(issues) == {"room_data_unreadable"}
    asyncio.run(store.async_clear_room_recovery("room_data_unreadable"))
    assert issues == {}
    assert "hall" in store._data["rooms"]


def test_storage_upgrade_keeps_one_backup_of_the_original(monkeypatch, tmp_path):
    from pathlib import Path
    from types import SimpleNamespace

    saved = []

    class FakeStore:
        def __init__(self, _hass, version, key, minor_version=1):
            self.path = str(tmp_path / key)
            self.version = (version, minor_version)

        async def async_save(self, data):
            saved.append((self.version, data))
            Path(self.path).write_text("{}")

    async def executor(func, *args):
        return func(*args)

    monkeypatch.setattr(storage_module, "Store", FakeStore)
    rooms_store = storage_module._RoomsStore.__new__(storage_module._RoomsStore)
    rooms_store.hass = SimpleNamespace(async_add_executor_job=executor)
    original = {"rooms": {"hall": {"id": "hall", "sensor": {"deviceId": "radar"}}}}

    assert asyncio.run(rooms_store._async_migrate_func(1, 1, original)) is original
    assert saved == [((1, 1), original)]
    assert saved[0][1] is not original
    # A later upgrade (after a downgrade) never replaces the first backup.
    asyncio.run(rooms_store._async_migrate_func(1, 1, {"rooms": {}}))
    assert len(saved) == 1
    assert storage_module.STORAGE_VERSION == 1
    assert storage_module.STORAGE_MINOR_VERSION == 2


def test_load_quarantines_a_non_mapping_rooms_root():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)

    class CorruptStore:
        saved = None

        async def async_load(self):
            return {"rooms": [{"id": "not-a-room-map"}]}

        async def async_save(self, data):
            self.saved = data

    backend = CorruptStore()
    store._store = backend
    asyncio.run(store.async_load())

    assert store._data["rooms"] == {}
    assert store._data["invalid_rooms"]["__rooms__"] == [
        {"id": "not-a-room-map"}
    ]
    assert backend.saved["invalid_rooms"]["__rooms__"] == [
        {"id": "not-a-room-map"}
    ]
    assert store.get_invalid_room_summary() == {"count": 1}


def test_room_designer_save_preserves_the_stored_house_placement():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    stored_house = {"x": 500, "y": 250, "floor": 1, "rotationDeg": 90, "visible": True}
    store._data = {"rooms": {"one": {
        "id": "one", "name": "Old", "updated_at": "revision", "house": stored_house,
    }}}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_save_room({
        "id": "one", "name": "Renamed",
        "walls": [{"x1": 0, "y1": 0, "x2": 1000, "y2": 0}],
        "updated_at": "revision",
        "house": {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
    }))
    assert result["name"] == "Renamed"
    assert result["walls"] == [{"x1": 0, "y1": 0, "x2": 1000, "y2": 0}]
    assert result["house"] == stored_house


def test_room_save_migrates_legacy_sensor_and_preserves_zones():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store._data = {"rooms": {}}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_save_room({
        "id": "legacy",
        "name": "Legacy room",
        "sensor": {"deviceId": "device-a", "x": 1000, "y": 2000},
        "zones": [{"id": "desk", "name": "Desk"}],
    }, create=True))
    assert "sensor" not in result
    assert result["sensors"][0]["deviceId"] == "device-a"
    assert result["sensors"][0]["x_m"] == 1.0
    assert result["zones"] == [{"id": "desk", "name": "Desk"}]
    assert result["schema_version"] == 2


def test_room_device_ownership_validation_runs_inside_atomic_save() -> None:
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {
        "id": "one",
        "name": "One",
        "updated_at": "revision",
        "sensors": [{"id": "source-one", "deviceId": "shared-device"}],
    }
    store._data = {"rooms": {"one": original}}

    async def save():
        raise AssertionError("invalid ownership must not reach persistence")

    def validate(rooms):
        devices = [
            source.get("deviceId")
            for room in rooms
            for source in room.get("sensors", [])
            if source.get("deviceId")
        ]
        if len(devices) != len(set(devices)):
            raise ValueError("duplicate physical device")

    store.async_save = save
    try:
        asyncio.run(store.async_save_room({
            "id": "two",
            "name": "Two",
            "sensor": {"deviceId": "shared-device"},
        }, create=True, validate_rooms=validate))
    except ValueError as error:
        assert str(error) == "duplicate physical device"
    else:
        raise AssertionError("duplicate ownership must fail")
    assert store._data["rooms"] == {"one": original}


def test_runtime_clear_progress_is_coalesced_but_new_occupancy_is_immediate():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)

    class Backend:
        delayed = None

        def async_delay_save(self, callback, *, delay):
            self.delayed = (callback, delay)

    backend = Backend()
    store._store = backend
    store._data = {"room_runtime": {"office": {"occupied": False}}}
    saves = []

    async def save():
        saves.append(store.get_room_runtime())

    store.async_save = save
    asyncio.run(store.async_set_room_runtime({
        "office": {"occupied": False, "pending_clear_since": 10},
    }))
    assert saves == []
    assert backend.delayed is not None
    callback, delay = backend.delayed
    assert delay == 15
    assert callback()["room_runtime"]["office"]["pending_clear_since"] == 10

    asyncio.run(store.async_set_room_runtime({
        "office": {"occupied": True, "pending_clear_since": None},
    }))
    assert saves[-1]["office"]["occupied"] is True

    store._data["room_runtime"] = {
        "office": {"occupied": True, "pending_clear_since": 25},
    }
    saves.clear()
    asyncio.run(store.async_set_room_runtime({
        "office": {"occupied": True, "pending_clear_since": None},
    }))
    assert saves[-1]["office"]["pending_clear_since"] is None


def test_new_or_imported_room_cannot_claim_a_house_placement():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store._data = {"rooms": {}}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_save_room({
        "id": "imported", "name": "Imported",
        "walls": [{"x1": 0, "y1": 0, "x2": 1000, "y2": 0}],
        "house": {"x": 500, "y": 600, "floor": 2, "rotationDeg": 90},
    }, create=True))
    assert "house" not in result
    assert result["id"] != "imported"


def test_room_update_without_revision_is_rejected():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {"id": "one", "name": "Original", "updated_at": "revision"}
    store._data = {"rooms": {"one": original}}

    async def save():
        raise AssertionError("a revisionless update must not reach storage")

    store.async_save = save
    try:
        asyncio.run(store.async_save_room({"id": "one", "name": "Stale"}))
    except RoomConfigConflictError:
        pass
    else:
        raise AssertionError("revisionless updates must be rejected")
    assert store._data["rooms"]["one"] is original


def test_explicit_create_uses_a_fresh_server_identifier():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store._data = {"rooms": {}}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_save_room({
        "id": "deleted-room", "name": "New room", "updated_at": "stale",
    }, create=True))
    assert result["id"] != "deleted-room"
    assert result["updated_at"] != "stale"


def test_stale_room_designer_save_cannot_restore_old_calibration():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {
        "id": "one",
        "name": "Room",
        "updated_at": "newer",
        "aggregation": {"tracking": {"source_alignments": {}}},
    }
    store._data = {"rooms": {"one": original}}

    async def save():
        raise AssertionError("a conflicting room must not reach storage")

    store.async_save = save
    try:
        asyncio.run(store.async_save_room({
            "id": "one",
            "name": "Room",
            "updated_at": "older",
            "aggregation": {
                "tracking": {
                    "source_alignments": {"sensor": {"placement_fingerprint": "old"}},
                }
            },
        }))
    except RoomConfigConflictError:
        pass
    else:
        raise AssertionError("stale Room Designer save should be rejected")
    assert store._data["rooms"]["one"] is original


def test_stale_room_designer_tab_cannot_recreate_deleted_room():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store._data = {"rooms": {}}

    async def save():
        raise AssertionError("a stale deleted room must not reach storage")

    store.async_save = save
    try:
        asyncio.run(store.async_save_room({
            "id": "deleted",
            "name": "Deleted elsewhere",
            "updated_at": "old-revision",
        }))
    except RoomConfigConflictError:
        pass
    else:
        raise AssertionError("a stale tab should not recreate a deleted room")
    assert store._data["rooms"] == {}


def test_room_save_rolls_back_memory_when_store_write_fails():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {"one": {"id": "one", "name": "Old", "updated_at": "revision"}}
    store._data = {"rooms": original}

    async def save():
        raise OSError("disk unavailable")

    store.async_save = save
    try:
        asyncio.run(store.async_save_room({
            "id": "one", "name": "New", "updated_at": "revision",
        }))
    except OSError:
        pass
    else:
        raise AssertionError("the storage error should be propagated")
    assert store._data["rooms"] is original


def test_room_save_detects_store_failures_that_home_assistant_only_logs():
    """A swallowed Store write error must still roll the room transaction back."""
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {"one": {"id": "one", "name": "Old", "updated_at": "revision"}}
    store._data = {"rooms": original}

    class SwallowingStore:
        async def async_save(self, _data):
            return None

        async def async_load(self):
            return {"rooms": original}

    store._store = SwallowingStore()
    try:
        asyncio.run(store.async_save_room({
            "id": "one", "name": "New", "updated_at": "revision",
        }))
    except OSError as error:
        assert "not confirmed" in str(error)
    else:
        raise AssertionError("the swallowed write failure should be detected")
    assert store._data["rooms"] is original


def test_alignment_revocation_is_narrow_and_revision_independent():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {
        "id": "one",
        "name": "Room",
        "walls": [{"x1": 0}],
        "updated_at": "newer-than-browser",
        "aggregation": {
            "tracking": {
                "experimental_fusion": True,
                "source_alignments": {"radar": {"placement_fingerprint": "old"}},
            }
        },
    }
    store._data = {"rooms": {"one": original}}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_revoke_room_alignment("one"))
    assert result is not None
    assert result["replaced_updated_at"] == "newer-than-browser"
    assert result["room"]["walls"] == original["walls"]
    assert result["room"]["aggregation"]["tracking"]["experimental_fusion"] is False
    assert result["room"]["aggregation"]["tracking"]["source_alignments"] == {}
    assert result["room"]["aggregation"]["tracking"]["alignment_revoked_at"] == result["room"]["updated_at"]
    assert result["room"]["updated_at"] != "newer-than-browser"


def test_alignment_revocation_rolls_back_when_store_write_fails():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {
        "one": {
            "id": "one",
            "name": "Room",
            "aggregation": {
                "tracking": {
                    "experimental_fusion": True,
                    "source_alignments": {"radar": {"placement_fingerprint": "old"}},
                }
            },
        }
    }
    store._data = {"rooms": original}

    async def save():
        raise OSError("disk unavailable")

    store.async_save = save
    try:
        asyncio.run(store.async_revoke_room_alignment("one"))
    except OSError:
        pass
    else:
        raise AssertionError("the storage error should be propagated")
    assert store._data["rooms"] is original
