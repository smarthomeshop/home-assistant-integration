"""Tests for narrow Live Home room placement updates."""

import asyncio

from custom_components.smarthomeshop.storage import RoomHouseConflictError, SmartHomeShopStore


def test_save_room_house_preserves_room_designer_fields():
    """A placement save must not replace walls, sensors or zones."""
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {
        "id": "kitchen",
        "name": "Kitchen",
        "walls": [{"x1": 0, "y1": 0, "x2": 3000, "y2": 0}],
        "sensors": [{"deviceId": "radar-one"}],
        "zones": [{"id": "cooking"}],
        "house": {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
    }
    store._data = {"rooms": {"kitchen": original}}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_save_room_house(
        "kitchen",
        {"x": 1250.0, "y": -500.0, "floor": 1, "rotationDeg": 90, "visible": False},
    ))

    assert result is not None
    assert result["walls"] == original["walls"]
    assert result["sensors"] == original["sensors"]
    assert result["zones"] == original["zones"]
    assert result["house"] == {
        "x": 1250.0,
        "y": -500.0,
        "floor": 1,
        "rotationDeg": 90,
        "visible": False,
    }
    assert result is not original


def test_save_room_house_returns_none_for_missing_room():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store._data = {"rooms": {}}

    async def save():
        raise AssertionError("missing rooms must not trigger a store write")

    store.async_save = save
    assert asyncio.run(store.async_save_room_house("missing", {})) is None


def test_save_room_houses_is_atomic_and_rejects_missing_room():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {"one": {"id": "one", "name": "One", "walls": [1]}}
    store._data = {"rooms": original}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_save_room_houses([
        {"room_id": "one", "house": {"x": 1}},
        {"room_id": "missing", "house": {"x": 2}},
    ]))
    assert result is None
    assert store._data["rooms"] is original


def test_save_room_houses_rolls_back_memory_when_store_write_fails():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {"one": {"id": "one", "name": "One", "walls": [1]}}
    store._data = {"rooms": original}

    async def save():
        raise OSError("disk unavailable")

    store.async_save = save
    try:
        asyncio.run(store.async_save_room_houses([
            {"room_id": "one", "house": {"x": 1}},
        ]))
    except OSError:
        pass
    else:
        raise AssertionError("the storage error should be propagated")
    assert store._data["rooms"] is original


def test_room_designer_save_preserves_the_stored_house_placement():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    stored_house = {"x": 500, "y": 250, "floor": 1, "rotationDeg": 90, "visible": True}
    store._data = {"rooms": {"one": {"id": "one", "name": "Old", "house": stored_house}}}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_save_room({
        "id": "one", "name": "Renamed", "walls": [1],
        "house": {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
    }))
    assert result["name"] == "Renamed"
    assert result["walls"] == [1]
    assert result["house"] == stored_house


def test_new_or_imported_room_cannot_claim_a_house_placement():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    store._data = {"rooms": {}}

    async def save():
        return None

    store.async_save = save
    result = asyncio.run(store.async_save_room({
        "id": "imported", "name": "Imported", "walls": [1],
        "house": {"x": 500, "y": 600, "floor": 2, "rotationDeg": 90},
    }))
    assert "house" not in result


def test_stale_live_home_save_cannot_overwrite_a_newer_room_change():
    store = SmartHomeShopStore.__new__(SmartHomeShopStore)
    original = {
        "id": "one", "name": "Renamed elsewhere", "updated_at": "newer",
        "house": {"x": 0, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
    }
    store._data = {"rooms": {"one": original}}

    async def save():
        raise AssertionError("a conflicting placement must not reach storage")

    store.async_save = save
    try:
        asyncio.run(store.async_save_room_houses([{
            "room_id": "one",
            "expected_updated_at": "older",
            "house": {"x": 500, "y": 0, "floor": 0, "rotationDeg": 0, "visible": True},
        }]))
    except RoomHouseConflictError:
        pass
    else:
        raise AssertionError("stale placement should be rejected")
    assert store._data["rooms"]["one"] is original
