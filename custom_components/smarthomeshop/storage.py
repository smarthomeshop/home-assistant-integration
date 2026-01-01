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
        LOGGER.debug("Loaded %d rooms from storage", len(self._data.get("rooms", {})))

    async def async_save(self) -> None:
        """Save data to storage."""
        await self._store.async_save(self._data)

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
