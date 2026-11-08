"""Storage for SmartHomeShop room configurations."""
from __future__ import annotations

import asyncio
import uuid
from typing import Any
from datetime import datetime, timedelta, timezone

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, LOGGER

STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.rooms"


class RoomHouseConflictError(Exception):
    """Raised when a Live Home save is based on stale room data."""


class SmartHomeShopStore:
    """Store for SmartHomeShop room configurations."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {"rooms": {}}
        self._room_lock = asyncio.Lock()

    def _rooms_lock(self) -> asyncio.Lock:
        """Return the shared room mutation lock, including lightweight tests."""
        lock = getattr(self, "_room_lock", None)
        if lock is None:
            lock = self._room_lock = asyncio.Lock()
        return lock

    async def async_load(self) -> None:
        """Load data from storage."""
        data = await self._store.async_load()
        if data:
            self._data = data
        else:
            self._data = {"rooms": {}}
        self._data.setdefault("rooms", {})
        self._data.setdefault("account", {})
        self._data.setdefault("schedules", {})
        self._data.setdefault("battery", {})
        self._data.setdefault("energy_sources", {})
        self._data.setdefault("water_anchors", {})
        self._data.setdefault("schedule_runtime", {})
        self._data.setdefault("savings", {})
        self._data.setdefault("hidden_devices", {})
        self._data.setdefault("energy_learning", {"samples": [], "model": {}})
        self._data.setdefault("energy_journal", [])
        LOGGER.debug("Loaded %d rooms from storage", len(self._data.get("rooms", {})))

    async def async_save(self) -> None:
        """Save data to storage."""
        await self._store.async_save(self._data)

    def get_account(self) -> dict[str, Any]:
        """Return the account settings (API key, base URL)."""
        return dict(self._data.get("account", {}))

    async def async_set_account(self, account: dict[str, Any]) -> None:
        """Save the account settings."""
        self._data["account"] = account
        await self.async_save()

    def get_rooms(self) -> list[dict[str, Any]]:
        """Get all rooms as a list."""
        return list(self._data.get("rooms", {}).values())

    def get_room(self, room_id: str) -> dict[str, Any] | None:
        """Get a specific room by ID."""
        return self._data.get("rooms", {}).get(room_id)

    async def async_save_room(self, room_data: dict[str, Any]) -> dict[str, Any]:
        """Save or update a room configuration."""
        async with self._rooms_lock():
            room_data = dict(room_data)
            rooms = self._data.setdefault("rooms", {})
            room_id = room_data.get("id")
            existing = rooms.get(room_id) if room_id else None
            if not room_id:
                room_id = str(uuid.uuid4())
                room_data["id"] = room_id
                room_data["created_at"] = datetime.now().isoformat()
                room_data.pop("house", None)
            elif existing is None:
                # New/imported rooms receive a fresh non-overlapping Live Home
                # suggestion; portable backups never own a house placement.
                room_data.pop("house", None)
            elif existing is not None:
                # Room Designer owns the room contents; Live Home owns house.
                # A stale designer tab must never restore or remove a placement.
                if "house" in existing:
                    room_data["house"] = existing["house"]
                else:
                    room_data.pop("house", None)
            room_data["updated_at"] = datetime.now().isoformat()
            rooms[room_id] = room_data
            await self.async_save()
            LOGGER.info("Saved room: %s (%s)", room_data.get("name", "Unnamed"), room_id)
            return room_data

    async def async_save_room_house(
        self, room_id: str, house: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Update only a room's whole-home placement.

        Live Home deliberately writes a narrow patch so a simultaneous Room
        Designer save cannot be undone by an older copy of the room payload.
        """
        result = await self.async_save_room_houses([{"room_id": room_id, "house": house}])
        return result[0] if result else None

    async def async_save_room_houses(
        self, placements: list[dict[str, Any]]
    ) -> list[dict[str, Any]] | None:
        """Atomically merge a complete set of Live Home placements."""
        async with self._rooms_lock():
            rooms = self._data.setdefault("rooms", {})
            room_ids = [placement["room_id"] for placement in placements]
            if len(room_ids) != len(set(room_ids)) or any(room_id not in rooms for room_id in room_ids):
                return None
            for placement in placements:
                expected = placement.get("expected_updated_at")
                if expected is not None and rooms[placement["room_id"]].get("updated_at") != expected:
                    raise RoomHouseConflictError(placement["room_id"])
            previous_rooms = rooms
            next_rooms = dict(rooms)
            updated_rooms: list[dict[str, Any]] = []
            timestamp = datetime.now().isoformat()
            for placement in placements:
                room_id = placement["room_id"]
                updated = dict(rooms[room_id])
                updated["house"] = dict(placement["house"])
                updated["updated_at"] = timestamp
                next_rooms[room_id] = updated
                updated_rooms.append(updated)
            self._data["rooms"] = next_rooms
            try:
                await self.async_save()
            except Exception:
                self._data["rooms"] = previous_rooms
                raise
            LOGGER.info("Saved %d Live Home room placements", len(updated_rooms))
            return updated_rooms

    async def async_delete_room(self, room_id: str) -> bool:
        """Delete a room configuration."""
        async with self._rooms_lock():
            if room_id in self._data.get("rooms", {}):
                del self._data["rooms"][room_id]
                await self.async_save()
                return True
            return False

    # ---- Smart-energy deadline schedules ----

    def get_schedules(self) -> list[dict[str, Any]]:
        """Return all deadline schedules."""
        return list(self._data.get("schedules", {}).values())

    async def async_save_schedule(self, schedule: dict[str, Any]) -> dict[str, Any]:
        """Create or update a deadline schedule.

        On update, merge over the stored entry so created_at and untouched
        keys survive; an update to a missing id becomes a fresh create.
        """
        schedules = self._data.setdefault("schedules", {})
        schedule_id = schedule.get("id")
        existing = schedules.get(schedule_id) if schedule_id else None
        merged = dict(existing) if existing else {}
        merged.update(schedule)
        if not schedule_id or existing is None:
            schedule_id = schedule_id or str(uuid.uuid4())
            merged["id"] = schedule_id
            merged.setdefault("created_at", datetime.now().isoformat())
        merged["updated_at"] = datetime.now().isoformat()
        schedules[schedule_id] = merged
        await self.async_save()
        LOGGER.info("Saved schedule: %s (%s)", merged.get("name", "Unnamed"), schedule_id)
        return merged

    async def async_delete_schedule(self, schedule_id: str) -> bool:
        """Delete a deadline schedule."""
        if schedule_id in self._data.get("schedules", {}):
            del self._data["schedules"][schedule_id]
            await self.async_save()
            return True
        return False

    # ---- Home-battery arbitrage mapping (account-wide) ----

    def get_battery(self) -> dict[str, Any]:
        """Return the home-battery control mapping."""
        return dict(self._data.get("battery", {}))

    async def async_set_battery(self, battery: dict[str, Any]) -> dict[str, Any]:
        """Save the home-battery control mapping."""
        self._data["battery"] = battery
        await self.async_save()
        return battery

    # ---- Energy-source entity mapping (solar / battery measurement) ----

    def get_energy_sources(self) -> dict[str, Any]:
        """Return the mapped solar/battery measurement entities."""
        return dict(self._data.get("energy_sources", {}))

    async def async_set_energy_sources(self, sources: dict[str, Any]) -> dict[str, Any]:
        """Save the solar/battery measurement entity mapping."""
        self._data["energy_sources"] = sources
        await self.async_save()
        return sources

    # ---- Water usage period anchors (per config entry) ----
    # Meter readings at the start of day/week/month/year, persisted so the
    # usage sensors survive a Home Assistant restart instead of resetting.

    def get_water_anchors(self, entry_id: str) -> dict[str, Any]:
        """Return the persisted period anchors for a water device."""
        return dict(self._data.get("water_anchors", {}).get(entry_id, {}))

    async def async_set_water_anchors(self, entry_id: str, anchors: dict[str, Any]) -> None:
        """Persist the period anchors for a water device."""
        self._data.setdefault("water_anchors", {})[entry_id] = anchors
        await self.async_save()

    # ---- Deadline-schedule runtime (per schedule, per deadline cycle) ----
    # How long a scheduled load already ran this cycle, so a finished load is
    # not forced on again at the deadline (and survives restarts).

    def get_schedule_runtime(self, schedule_id: str) -> dict[str, Any]:
        """Return the persisted runtime state for a schedule."""
        return dict(self._data.get("schedule_runtime", {}).get(schedule_id, {}))

    async def async_set_schedule_runtime(
        self, schedule_id: str, runtime: dict[str, Any]
    ) -> None:
        """Persist the runtime state for a schedule."""
        self._data.setdefault("schedule_runtime", {})[schedule_id] = runtime
        await self.async_save()

    # ---- Smart-energy savings totals ----

    def get_savings(self) -> dict[str, Any]:
        """Return the accumulated smart-energy savings."""
        return dict(self._data.get("savings", {}))

    async def async_set_savings(self, savings: dict[str, Any]) -> None:
        """Persist the accumulated smart-energy savings."""
        self._data["savings"] = savings
        await self.async_save()

    # ---- Smart Energy learning and explainable decision journal ----

    def get_energy_learning(self) -> dict[str, Any]:
        """Return local measurements and the last bounded learning model."""
        learning = self._data.get("energy_learning", {})
        return {
            "samples": [dict(item) for item in learning.get("samples", [])],
            "model": dict(learning.get("model", {})),
            "updated_at": learning.get("updated_at"),
        }

    async def async_set_energy_learning(self, learning: dict[str, Any]) -> None:
        """Persist local learning data without sending it outside Home Assistant."""
        payload = dict(learning)
        payload["samples"] = [dict(item) for item in payload.get("samples", [])]
        payload["model"] = dict(payload.get("model", {}))
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._data["energy_learning"] = payload
        await self.async_save()

    def get_energy_journal(self, limit: int = 100) -> list[dict[str, Any]]:
        """Return newest Smart Energy decisions first."""
        safe_limit = max(1, min(500, int(limit)))
        rows = self._data.get("energy_journal", [])
        return [dict(item) for item in reversed(rows[-safe_limit:])]

    async def async_append_energy_journal(
        self, entry: dict[str, Any], *, maximum: int = 300
    ) -> dict[str, Any]:
        """Append one explainable decision and keep storage bounded."""
        row = dict(entry)
        now = datetime.now(timezone.utc)
        row.setdefault("id", str(uuid.uuid4()))
        row.setdefault("timestamp", now.isoformat())
        journal = self._data.setdefault("energy_journal", [])
        target = row.get("target_power_w")
        try:
            target_bucket = round(float(target) / 100) if target is not None else None
        except (TypeError, ValueError):
            target_bucket = None
        # Repeated successful decisions are intentionally collapsed, but a
        # different failure/verification reason is operationally meaningful
        # and must remain visible in the journal.
        reason_key = (
            row.get("reason")
            if row.get("status") in {"failed", "not_following", "unavailable"}
            else None
        )
        key = (
            row.get("kind"),
            row.get("mode"),
            row.get("status"),
            row.get("action"),
            target_bucket,
            row.get("control_entity"),
            row.get("guard_status"),
            reason_key,
        )
        for previous in reversed(journal[-20:]):
            previous_target = previous.get("target_power_w")
            try:
                previous_bucket = (
                    round(float(previous_target) / 100)
                    if previous_target is not None
                    else None
                )
            except (TypeError, ValueError):
                previous_bucket = None
            previous_reason_key = (
                previous.get("reason")
                if previous.get("status")
                in {"failed", "not_following", "unavailable"}
                else None
            )
            previous_key = (
                previous.get("kind"),
                previous.get("mode"),
                previous.get("status"),
                previous.get("action"),
                previous_bucket,
                previous.get("control_entity"),
                previous.get("guard_status"),
                previous_reason_key,
            )
            if previous_key != key:
                continue
            try:
                previous_time = datetime.fromisoformat(
                    str(previous.get("timestamp") or "").replace("Z", "+00:00")
                )
                if previous_time.tzinfo is None:
                    previous_time = previous_time.replace(tzinfo=timezone.utc)
            except ValueError:
                break
            if now - previous_time < timedelta(minutes=10):
                return dict(previous)
            break
        journal.append(row)
        self._data["energy_journal"] = journal[-max(10, min(1000, maximum)):]
        await self.async_save()
        return row

    async def async_clear_energy_journal(self) -> None:
        """Clear the local Smart Energy decision history."""
        self._data["energy_journal"] = []
        await self.async_save()

    # ---- Devices hidden from the SmartHomeShop panel ----

    def get_hidden_devices(self) -> dict[str, dict[str, Any]]:
        """Return devices hidden from the panel, keyed by stable source identity."""
        return {
            str(key): dict(value)
            for key, value in self._data.get("hidden_devices", {}).items()
            if isinstance(value, dict)
        }

    def is_device_hidden(self, device_key: str) -> bool:
        """Return whether a source device is hidden from the panel."""
        return device_key in self._data.get("hidden_devices", {})

    async def async_hide_device(
        self, device_key: str, device: dict[str, Any]
    ) -> None:
        """Hide a source device without touching ESPHome or its entities."""
        self._data.setdefault("hidden_devices", {})[device_key] = dict(device)
        await self.async_save()

    async def async_unhide_device(self, device_key: str) -> bool:
        """Make a previously hidden source device visible again."""
        hidden = self._data.setdefault("hidden_devices", {})
        if device_key not in hidden:
            return False
        del hidden[device_key]
        await self.async_save()
        return True
