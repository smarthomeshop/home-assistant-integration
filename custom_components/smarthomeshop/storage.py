"""Storage for SmartHomeShop room configurations."""
from __future__ import annotations

import uuid
from typing import Any
from datetime import datetime

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, LOGGER

STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.rooms"


class SmartHomeShopStore:
    """Store for SmartHomeShop room configurations."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {"rooms": {}}

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
        room_id = room_data.get("id")
        if not room_id:
            room_id = str(uuid.uuid4())
            room_data["id"] = room_id
            room_data["created_at"] = datetime.now().isoformat()
        room_data["updated_at"] = datetime.now().isoformat()
        if "rooms" not in self._data:
            self._data["rooms"] = {}
        self._data["rooms"][room_id] = room_data
        await self.async_save()
        LOGGER.info("Saved room: %s (%s)", room_data.get("name", "Unnamed"), room_id)
        return room_data

    async def async_delete_room(self, room_id: str) -> bool:
        """Delete a room configuration."""
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
