"""Storage for SmartHomeShop room configurations."""

from __future__ import annotations

import asyncio
import copy
import hashlib
import json
import os
import uuid
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.storage import Store

from .const import DOMAIN, LOGGER
from .room_config import normalize_room_config, repair_room_config

STORAGE_VERSION = 1
# 1.2 (release 1.17): rooms with several sensors. Only the minor version
# changes, so an older release can still read the file after a downgrade.
STORAGE_MINOR_VERSION = 2
STORAGE_KEY = f"{DOMAIN}.rooms"
# A copy of the data exactly as it was before the first upgrade to 1.2.
BACKUP_KEY = f"{DOMAIN}.rooms.backup_1_1"
ROOM_DATA_REPAIRED_ISSUE = "room_data_repaired"
ROOM_DATA_UNREADABLE_ISSUE = "room_data_unreadable"


class _RoomsStore(Store):
    """Room storage that keeps a backup before every format upgrade."""

    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: Any
    ) -> Any:
        backup = Store(
            self.hass, old_major_version, BACKUP_KEY, minor_version=old_minor_version
        )
        # Never replace an earlier backup: the first one is the original data.
        if not await self.hass.async_add_executor_job(os.path.exists, backup.path):
            await backup.async_save(copy.deepcopy(old_data))
            LOGGER.info(
                "Saved a copy of the SmartHomeShop rooms from storage version %s.%s as %s",
                old_major_version,
                old_minor_version,
                backup.path,
            )
        # The rooms themselves are upgraded in SmartHomeShopStore.async_load.
        return old_data


def _merged_sources(room: dict[str, Any], normalized: dict[str, Any]) -> int:
    """Count sensors that normalizing merged because they share one radar."""
    raw = room.get("sensors")
    if not isinstance(raw, list) or not raw:
        raw = [room["sensor"]] if isinstance(room.get("sensor"), dict) else []
    linked = [
        source for source in raw
        if isinstance(source, dict) and (source.get("deviceId") or source.get("device_id"))
    ]
    kept = [
        source for source in normalized.get("sensors", [])
        if source.get("deviceId") or source.get("device_id")
    ]
    return max(0, len(linked) - len(kept))


class RoomConfigConflictError(Exception):
    """Raised when Room Designer tries to replace a newer room revision."""


class RoomDeviceConflictError(Exception):
    """Raised when one physical radar would become owned by two rooms."""


class SmartHomeShopStore:
    """Store for SmartHomeShop room configurations."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the store."""
        self.hass = hass
        self._store = _RoomsStore(
            hass, STORAGE_VERSION, STORAGE_KEY, minor_version=STORAGE_MINOR_VERSION
        )
        self._data: dict[str, Any] = {"rooms": {}}
        self._room_lock = asyncio.Lock()
        self._smart_ev_lock = asyncio.Lock()
        self._smart_loads_lock = asyncio.Lock()

    def _rooms_lock(self) -> asyncio.Lock:
        """Return the shared room mutation lock, including lightweight tests."""
        lock = getattr(self, "_room_lock", None)
        if lock is None:
            lock = self._room_lock = asyncio.Lock()
        return lock

    def _ev_lock(self) -> asyncio.Lock:
        """Return the Smart EV mutation lock, including lightweight tests."""
        lock = getattr(self, "_smart_ev_lock", None)
        if lock is None:
            lock = self._smart_ev_lock = asyncio.Lock()
        return lock

    def _loads_lock(self) -> asyncio.Lock:
        """Return the Smart Loads mutation lock, including lightweight tests."""
        lock = getattr(self, "_smart_loads_lock", None)
        if lock is None:
            lock = self._smart_loads_lock = asyncio.Lock()
        return lock

    async def async_load(self) -> None:
        """Load data from storage."""
        data = await self._store.async_load()
        if data:
            self._data = data
        else:
            self._data = {"rooms": {}}
        raw_rooms = self._data.get("rooms", {})
        invalid_root = None
        if not isinstance(raw_rooms, dict):
            invalid_root = copy.deepcopy(raw_rooms)
            self._data["rooms"] = {}
        else:
            self._data.setdefault("rooms", {})
        self._data.setdefault("room_runtime", {})
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
        self._data.setdefault(
            "smart_ev",
            {
                "enabled": False,
                "execution_mode": "advice",
                "vehicles": [],
                "learning": {},
                "plans": {},
                "journal": [],
            },
        )
        self._data.setdefault(
            "smart_loads",
            {
                "enabled": False,
                "execution_mode": "advice",
                "loads": [],
                "learning": {},
                "plans": {},
                "control_owners": {},
                "control_pauses": {},
                "journal": [],
                "runs": [],
            },
        )
        LOGGER.debug("Loaded %d rooms from storage", len(self._data.get("rooms", {})))

        migration_revision = datetime.now(UTC).isoformat()
        normalized_rooms: dict[str, dict[str, Any]] = {}
        original_invalid_rooms = copy.deepcopy(self._data.get("invalid_rooms", {}))
        invalid_rooms = copy.deepcopy(original_invalid_rooms)
        if not isinstance(invalid_rooms, dict):
            invalid_rooms = {}
        if invalid_root is not None:
            invalid_rooms["__rooms__"] = invalid_root
        original_repaired_rooms = copy.deepcopy(self._data.get("repaired_rooms", {}))
        repaired_rooms = copy.deepcopy(original_repaired_rooms)
        if not isinstance(repaired_rooms, dict):
            repaired_rooms = {}
        stored_rooms = self._data.get("rooms", {})
        # Rooms an earlier start could not read get another chance, so they
        # come back as soon as they can be repaired.
        candidates = [
            *stored_rooms.items(),
            *(
                (room_id, room) for room_id, room in invalid_rooms.items()
                if room_id != "__rooms__" and room_id not in stored_rooms and isinstance(room, dict)
            ),
        ]
        for room_id, room in candidates:
            if not isinstance(room, dict):
                invalid_rooms[str(room_id)] = copy.deepcopy(room)
                continue
            try:
                normalized = normalize_room_config(room)
            except Exception:  # noqa: BLE001 - isolate corrupt persisted records
                # Drop only the broken parts, so the room and its entities
                # stay. The original is kept until the user confirms in Repairs.
                repaired, notes = repair_room_config(str(room_id), room)
                try:
                    normalized = normalize_room_config(repaired)
                except Exception:  # noqa: BLE001
                    LOGGER.exception(
                        "Could not load SmartHomeShop room %s; keeping it for recovery",
                        room_id,
                    )
                    invalid_rooms[str(room_id)] = copy.deepcopy(room)
                    continue
                LOGGER.warning(
                    "Repaired SmartHomeShop room %s: %s", room_id, ", ".join(notes) or "cleaned"
                )
                repaired_rooms.setdefault(str(room_id), {
                    "name": str(normalized.get("name") or room_id),
                    "original": copy.deepcopy(room),
                    "notes": notes,
                    "repaired_at": migration_revision,
                })
            dropped = _merged_sources(room, normalized)
            if dropped:
                LOGGER.warning(
                    "Room %s listed the same radar %d more time(s); kept one sensor for it",
                    room_id,
                    dropped,
                )
            # Every editable room needs a revision. Without one, an old tab
            # cannot distinguish an update from an intentional import and may
            # overwrite or recreate a room after another client changed it.
            normalized.setdefault("updated_at", migration_revision)
            normalized_rooms[room_id] = normalized
            invalid_rooms.pop(str(room_id), None)
        if invalid_rooms:
            self._data["invalid_rooms"] = invalid_rooms
        else:
            self._data.pop("invalid_rooms", None)
        repaired_rooms = {
            room_id: entry for room_id, entry in repaired_rooms.items()
            if room_id in normalized_rooms
        }
        if repaired_rooms:
            self._data["repaired_rooms"] = repaired_rooms
        else:
            self._data.pop("repaired_rooms", None)
        rooms_changed = normalized_rooms != self._data.get("rooms", {})
        recovery_changed = (
            invalid_rooms != original_invalid_rooms
            or repaired_rooms != original_repaired_rooms
        )
        if rooms_changed:
            self._data["rooms"] = normalized_rooms
        if rooms_changed or recovery_changed:
            await self.async_save()
        self._sync_room_data_issues()

    def _sync_room_data_issues(self) -> None:
        """Show repaired and unreadable room data in Home Assistant Repairs."""
        hass = getattr(self, "hass", None)
        if hass is None:
            return
        repaired = self._data.get("repaired_rooms") or {}
        if repaired:
            ir.async_create_issue(
                hass,
                DOMAIN,
                ROOM_DATA_REPAIRED_ISSUE,
                is_fixable=True,
                is_persistent=False,
                severity=ir.IssueSeverity.WARNING,
                translation_key=ROOM_DATA_REPAIRED_ISSUE,
                translation_placeholders={
                    "rooms": ", ".join(sorted(entry.get("name", room_id) for room_id, entry in repaired.items())),
                },
            )
        else:
            ir.async_delete_issue(hass, DOMAIN, ROOM_DATA_REPAIRED_ISSUE)
        unreadable = self._data.get("invalid_rooms") or {}
        if unreadable:
            ir.async_create_issue(
                hass,
                DOMAIN,
                ROOM_DATA_UNREADABLE_ISSUE,
                is_fixable=True,
                is_persistent=False,
                severity=ir.IssueSeverity.WARNING,
                translation_key=ROOM_DATA_UNREADABLE_ISSUE,
                translation_placeholders={"count": str(len(unreadable))},
            )
        else:
            ir.async_delete_issue(hass, DOMAIN, ROOM_DATA_UNREADABLE_ISSUE)

    async def async_clear_room_recovery(self, issue_id: str) -> None:
        """Forget kept originals once the user confirmed in Repairs."""
        key = {
            ROOM_DATA_REPAIRED_ISSUE: "repaired_rooms",
            ROOM_DATA_UNREADABLE_ISSUE: "invalid_rooms",
        }.get(issue_id)
        if key is None:
            return
        async with self._rooms_lock():
            if self._data.pop(key, None) is not None:
                await self.async_save()
        self._sync_room_data_issues()

    async def async_save(self) -> None:
        """Save data to storage."""
        await self._store.async_save(self._data)

    async def _async_save_rooms_verified(self) -> None:
        """Persist rooms and verify Home Assistant actually wrote them.

        Home Assistant's Store logs low-level serialization/write failures
        instead of re-raising them. Room mutations need a positive read-back
        before their in-memory transaction can be committed safely.
        """
        expected_rooms = copy.deepcopy(self._data.get("rooms", {}))
        await self.async_save()
        store = getattr(self, "_store", None)
        if store is None:
            # Lightweight unit stores replace async_save directly.
            return
        persisted = await store.async_load()
        if not isinstance(persisted, dict) or persisted.get("rooms") != expected_rooms:
            raise OSError("SmartHomeShop room storage write was not confirmed")

    async def _async_save_smart_loads_verified(self) -> None:
        """Persist safety-critical Smart Loads state and confirm read-back."""
        expected = copy.deepcopy(self._data.get("smart_loads", {}))
        await self.async_save()
        store = getattr(self, "_store", None)
        if store is None or not hasattr(store, "async_load"):
            # Lightweight tests replace async_save and do not own an HA Store.
            return
        persisted = await store.async_load()
        if not isinstance(persisted, dict) or persisted.get("smart_loads") != expected:
            raise OSError("Smart Loads safety state storage write was not confirmed")

    def get_account(self) -> dict[str, Any]:
        """Return the account settings (API key, base URL)."""
        return dict(self._data.get("account", {}))

    async def async_set_account(self, account: dict[str, Any]) -> None:
        """Save the account settings."""
        self._data["account"] = account
        await self.async_save()

    def get_rooms(self) -> list[dict[str, Any]]:
        """Get all rooms as a list."""
        return [normalize_room_config(room) for room in self._data.get("rooms", {}).values()]

    def get_room(self, room_id: str) -> dict[str, Any] | None:
        """Get a specific room by ID."""
        room = self._data.get("rooms", {}).get(room_id)
        return normalize_room_config(room) if isinstance(room, dict) else None

    def get_floor_plan(self) -> dict[str, Any]:
        """Read the shared editor document and the canonical room records."""
        rooms = self.get_rooms()
        revisions = {room["id"]: room.get("updated_at") for room in rooms}
        saved = self._data.get("floor_plan", {})
        return {
            "rooms": rooms,
            "revisions": revisions,
            "version": saved.get("version", ""),
            "recovery": self.get_invalid_room_summary(),
            "project": copy.deepcopy(saved.get("project")) if (
                saved.get("revisions") == revisions
                or saved.get("geometry") == self._floor_plan_geometry(rooms)
            ) else None,
        }

    @staticmethod
    def _floor_plan_geometry(rooms: list[dict[str, Any]]) -> str:
        """Detect design changes independently of calibration and runtime revisions."""
        fields = ("id", "name", "walls", "doors", "windows", "mirrors", "furniture", "zones", "house", "ceilingHeightMm")
        source_fields = ("id", "deviceId", "device_id", "x", "y", "x_m", "y_m", "heightMm", "height_m",
                         "rotation", "orientation_deg", "mountingMode")
        geometry = [{**{key: room[key] for key in fields if key in room}, "sensors": [
            {key: source[key] for key in source_fields if key in source} for source in room.get("sensors", [])
        ]} for room in sorted(rooms, key=lambda room: room["id"])]
        return hashlib.sha256(json.dumps(geometry, sort_keys=True).encode()).hexdigest()

    async def async_save_floor_plan(
        self, project: dict[str, Any], changes: list[dict[str, Any]], removed: list[str],
        revisions: dict[str, str | None], version: str,
    ) -> dict[str, Any]:
        """Commit the editor and its Home Assistant room records together."""
        async with self._rooms_lock():
            previous = self._data["rooms"]
            old_plan = self._data.get("floor_plan")
            current_version = old_plan.get("version", "") if old_plan else ""
            current_revisions = {key: room.get("updated_at") for key, room in previous.items()}
            if revisions != current_revisions or version != current_version:
                raise RoomConfigConflictError("floor plan")
            rooms = dict(previous)
            timestamp = datetime.now(UTC).isoformat()
            for room_id in removed:
                rooms.pop(room_id)
            for change in changes:
                room_id = change["id"]
                existing = previous.get(room_id, {})
                room = {**existing, **change, "updated_at": timestamp}
                room.setdefault("created_at", timestamp)
                rooms[room_id] = normalize_room_config(room)
            self._data["rooms"] = rooms
            self._data["floor_plan"] = {
                "project": project,
                "version": str(uuid.uuid4()),
                "revisions": {key: room.get("updated_at") for key, room in rooms.items()},
                "geometry": self._floor_plan_geometry(list(rooms.values())),
            }
            try:
                await self._async_save_rooms_verified()
                persisted = await self._store.async_load()
                if persisted.get("floor_plan") != self._data["floor_plan"]:
                    raise OSError("SmartHomeShop floor plan write was not confirmed")
            except Exception:
                self._data["rooms"] = previous
                if old_plan is None:
                    self._data.pop("floor_plan", None)
                else:
                    self._data["floor_plan"] = old_plan
                raise
            return self.get_floor_plan()

    def get_room_runtime(self) -> dict[str, dict[str, Any]]:
        """Return durable room hysteresis state."""
        return copy.deepcopy(self._data.get("room_runtime", {}))

    def get_invalid_room_summary(self) -> dict[str, Any]:
        """Expose recovery status without returning malformed room payloads."""
        invalid = self._data.get("invalid_rooms", {})
        if not isinstance(invalid, dict):
            return {"count": 0}
        return {"count": len(invalid)}

    async def async_set_room_runtime(
        self, runtime: dict[str, dict[str, Any]]
    ) -> None:
        """Persist only state needed to survive a restart during clear delay."""
        previous = self._data.get("room_runtime", {})
        previous_rooms = previous if isinstance(previous, dict) else {}
        self._data["room_runtime"] = copy.deepcopy(runtime)
        newly_occupied = any(
            state.get("occupied") is True
            and previous_rooms.get(room_id, {}).get("occupied") is not True
            for room_id, state in runtime.items()
            if isinstance(state, dict)
        )
        cancelled_pending_clear = any(
            isinstance(state, dict)
            and state.get("occupied") is True
            and state.get("pending_clear_since") is None
            and isinstance(previous_rooms.get(room_id), dict)
            and previous_rooms[room_id].get("pending_clear_since") is not None
            for room_id, state in runtime.items()
        )
        delayed_save = getattr(getattr(self, "_store", None), "async_delay_save", None)
        if newly_occupied or cancelled_pending_clear or not callable(delayed_save):
            await self.async_save()
        else:
            # Clear-delay progress can change several times per minute. HA's
            # Store coalesces these durable snapshots into one atomic write.
            delayed_save(lambda: self._data, delay=15)

    async def async_save_room(
        self,
        room_data: dict[str, Any],
        *,
        create: bool = False,
        validate_rooms: Callable[[list[dict[str, Any]]], None] | None = None,
    ) -> dict[str, Any]:
        """Save or update a room configuration."""
        async with self._rooms_lock():
            room_data = dict(room_data)
            rooms = self._data.setdefault("rooms", {})
            room_id = room_data.get("id")
            existing = rooms.get(room_id) if room_id else None
            expected_updated_at = room_data.get("updated_at")
            if create:
                # Creation/import is an explicit operation. Never trust a
                # client-supplied identifier or revision: a stale editor must
                # not be able to recreate a deleted room under its old ID.
                room_id = str(uuid.uuid4())
                room_data["id"] = room_id
                room_data["created_at"] = datetime.now(UTC).isoformat()
                room_data.pop("updated_at", None)
                room_data.pop("house", None)
            else:
                if not room_id or existing is None:
                    raise RoomConfigConflictError(str(room_id or "missing"))
                if (
                    expected_updated_at is None
                    or existing.get("updated_at") != expected_updated_at
                ):
                    raise RoomConfigConflictError(str(room_id))
                # Room Designer owns the room contents; Live Home owns house.
                # A stale designer tab must never restore or remove a placement.
                if "house" in existing:
                    room_data["house"] = existing["house"]
                else:
                    room_data.pop("house", None)
            room_data = normalize_room_config(room_data)
            room_data["updated_at"] = datetime.now(UTC).isoformat()
            previous_rooms = rooms
            next_rooms = dict(rooms)
            next_rooms[room_id] = room_data
            if validate_rooms is not None:
                validate_rooms(list(next_rooms.values()))
            self._data["rooms"] = next_rooms
            try:
                await self._async_save_rooms_verified()
            except Exception:
                self._data["rooms"] = previous_rooms
                raise
            LOGGER.info(
                "Saved room: %s (%s)", room_data.get("name", "Unnamed"), room_id
            )
            return room_data

    async def async_revoke_room_alignment(
        self, room_id: str
    ) -> dict[str, Any] | None:
        """Fail closed by revoking disproved fusion calibration.

        This is intentionally a narrow, revision-independent safety mutation.
        It can only remove trust; it can never enable fusion or replace room
        geometry. Serializing it under the room lock makes it safe beside a
        normal Room Designer save.
        """
        async with self._rooms_lock():
            rooms = self._data.setdefault("rooms", {})
            existing = rooms.get(room_id)
            if not isinstance(existing, dict):
                return None
            replaced_updated_at = existing.get("updated_at")

            updated = normalize_room_config(existing)
            aggregation = dict(updated.get("aggregation") or {})
            tracking = dict(aggregation.get("tracking") or {})
            revoked_at = datetime.now(UTC).isoformat()
            tracking["experimental_fusion"] = False
            tracking["source_alignments"] = {}
            tracking["alignment_revoked_at"] = revoked_at
            aggregation["tracking"] = tracking
            updated["aggregation"] = aggregation
            updated["updated_at"] = revoked_at

            previous_rooms = rooms
            next_rooms = dict(rooms)
            next_rooms[room_id] = updated
            self._data["rooms"] = next_rooms
            try:
                await self._async_save_rooms_verified()
            except Exception:
                self._data["rooms"] = previous_rooms
                raise
            LOGGER.warning("Revoked disproved room alignment: %s", room_id)
            return {
                "room": updated,
                "replaced_updated_at": replaced_updated_at,
            }

    async def async_delete_room(self, room_id: str) -> bool:
        """Delete a room configuration."""
        async with self._rooms_lock():
            if room_id in self._data.get("rooms", {}):
                previous_rooms = self._data.get("rooms", {})
                previous_runtime = self._data.get("room_runtime", {})
                next_rooms = dict(previous_rooms)
                next_runtime = dict(previous_runtime)
                del next_rooms[room_id]
                next_runtime.pop(room_id, None)
                self._data["rooms"] = next_rooms
                self._data["room_runtime"] = next_runtime
                try:
                    await self._async_save_rooms_verified()
                except Exception:
                    self._data["rooms"] = previous_rooms
                    self._data["room_runtime"] = previous_runtime
                    raise
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
            merged.setdefault("created_at", datetime.now(UTC).isoformat())
        merged["updated_at"] = datetime.now(UTC).isoformat()
        schedules[schedule_id] = merged
        await self.async_save()
        LOGGER.info(
            "Saved schedule: %s (%s)", merged.get("name", "Unnamed"), schedule_id
        )
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

    async def async_set_water_anchors(
        self, entry_id: str, anchors: dict[str, Any]
    ) -> None:
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
        payload["updated_at"] = datetime.now(UTC).isoformat()
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
        now = datetime.now(UTC)
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
                if previous.get("status") in {"failed", "not_following", "unavailable"}
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
                    str(previous.get("timestamp") or "")
                )
                if previous_time.tzinfo is None:
                    previous_time = previous_time.replace(tzinfo=UTC)
            except ValueError:
                break
            if now - previous_time < timedelta(minutes=10):
                return dict(previous)
            break
        journal.append(row)
        self._data["energy_journal"] = journal[-max(10, min(1000, maximum)) :]
        await self.async_save()
        return row

    async def async_clear_energy_journal(self) -> None:
        """Clear the local Smart Energy decision history."""
        self._data["energy_journal"] = []
        await self.async_save()

    # ---- Native Smart EV planning and guarded charger control ----

    def get_smart_ev(self) -> dict[str, Any]:
        """Return the complete account-wide Smart EV configuration."""
        value = self._data.get("smart_ev", {})
        return {
            **dict(value),
            "vehicles": [dict(item) for item in value.get("vehicles", [])],
            "learning": {
                str(key): dict(item)
                for key, item in value.get("learning", {}).items()
                if isinstance(item, dict)
            },
            "plans": {
                str(key): dict(item)
                for key, item in value.get("plans", {}).items()
                if isinstance(item, dict)
            },
            "control_owners": {
                str(key): dict(item)
                for key, item in value.get("control_owners", {}).items()
                if isinstance(item, dict)
            },
            "control_pauses": {
                str(key): dict(item)
                for key, item in value.get("control_pauses", {}).items()
                if isinstance(item, dict)
            },
            "guard_stopped_at": {
                str(key): str(item)
                for key, item in value.get("guard_stopped_at", {}).items()
                if item
            },
            "journal": [dict(item) for item in value.get("journal", [])],
        }

    async def async_set_smart_ev(self, smart_ev: dict[str, Any]) -> dict[str, Any]:
        """Persist Smart EV configuration while retaining bounded runtime data."""
        async with self._ev_lock():
            previous_raw = copy.deepcopy(self._data.get("smart_ev", {}))
            previous = self.get_smart_ev()
            payload = {
                **previous,
                **dict(smart_ev),
                "vehicles": [dict(item) for item in smart_ev.get("vehicles", [])],
                "learning": dict(previous.get("learning", {})),
                "plans": dict(previous.get("plans", {})),
                "control_owners": dict(previous.get("control_owners", {})),
                "control_pauses": dict(previous.get("control_pauses", {})),
                "guard_stopped_at": dict(previous.get("guard_stopped_at", {})),
                "journal": list(previous.get("journal", []))[-300:],
            }
            self._data["smart_ev"] = payload
            try:
                await self.async_save()
            except Exception:
                self._data["smart_ev"] = previous_raw
                raise
        return self.get_smart_ev()

    async def async_set_smart_ev_vehicle_mode(
        self, vehicle_id: str, mode: str
    ) -> dict[str, Any] | None:
        """Atomically change one vehicle mode without replacing newer settings."""
        async with self._ev_lock():
            previous_raw = copy.deepcopy(self._data.get("smart_ev", {}))
            payload = copy.deepcopy(previous_raw)
            found = False
            vehicles: list[dict[str, Any]] = []
            for item in payload.get("vehicles", []):
                vehicle = dict(item)
                if str(vehicle.get("id")) == vehicle_id:
                    vehicle["mode"] = mode
                    found = True
                vehicles.append(vehicle)
            if not found:
                return None
            payload["vehicles"] = vehicles
            self._data["smart_ev"] = payload
            try:
                await self.async_save()
            except Exception:
                self._data["smart_ev"] = previous_raw
                raise
        return self.get_smart_ev()

    async def async_set_smart_ev_runtime(
        self,
        *,
        plans: dict[str, dict[str, Any]] | None = None,
        learning: dict[str, dict[str, Any]] | None = None,
        control_owners: dict[str, dict[str, Any]] | None = None,
        control_pauses: dict[str, dict[str, Any]] | None = None,
        guard_stopped_at: dict[str, str] | None = None,
        journal_entry: dict[str, Any] | None = None,
        journal_entries: list[dict[str, Any]] | None = None,
        immediate: bool = False,
    ) -> None:
        """Update EV plans, learning or its explainable journal atomically."""
        async with self._ev_lock():
            previous_raw = copy.deepcopy(self._data.get("smart_ev", {}))
            payload = copy.deepcopy(previous_raw)
            changed = False
            safety_changed = False
            if plans is not None:
                normalised_plans = {
                    str(key): dict(value) for key, value in plans.items()
                }
                if payload.get("plans") != normalised_plans:
                    payload["plans"] = normalised_plans
                    changed = True
            if learning is not None:
                normalised_learning = {
                    str(key): dict(value) for key, value in learning.items()
                }
                if payload.get("learning") != normalised_learning:
                    payload["learning"] = normalised_learning
                    changed = True
            for key, raw_value in (
                ("control_owners", control_owners),
                ("control_pauses", control_pauses),
            ):
                if raw_value is None:
                    continue
                normalised = {
                    str(item_key): dict(value) for item_key, value in raw_value.items()
                }
                if payload.get(key) != normalised:
                    payload[key] = normalised
                    changed = True
                    safety_changed = True
            if guard_stopped_at is not None:
                normalised_stops = {
                    str(key): str(value)
                    for key, value in guard_stopped_at.items()
                    if value
                }
                if payload.get("guard_stopped_at") != normalised_stops:
                    payload["guard_stopped_at"] = normalised_stops
                    changed = True
                    safety_changed = True
            pending_journal = list(journal_entries or [])
            if journal_entry is not None:
                pending_journal.append(journal_entry)
            for journal_item in pending_journal:
                row = dict(journal_item)
                row.setdefault("id", str(uuid.uuid4()))
                row.setdefault("timestamp", datetime.now(UTC).isoformat())
                journal = payload.setdefault("journal", [])
                fingerprint = (
                    row.get("vehicle_id"),
                    row.get("mode"),
                    row.get("action"),
                    row.get("status"),
                    row.get("reason"),
                )
                previous = journal[-1] if journal else None
                previous_fingerprint = (
                    (
                        previous.get("vehicle_id"),
                        previous.get("mode"),
                        previous.get("action"),
                        previous.get("status"),
                        previous.get("reason"),
                    )
                    if previous
                    else None
                )
                if previous_fingerprint != fingerprint:
                    journal.append(row)
                    payload["journal"] = journal[-300:]
                    changed = True
            must_save = changed or (immediate and control_owners is not None)
            if not must_save:
                return
            self._data["smart_ev"] = payload
            if immediate or safety_changed or not hasattr(self, "_store"):
                try:
                    await self.async_save()
                except Exception:
                    self._data["smart_ev"] = previous_raw
                    raise
            else:
                # Plans, learning and journal updates are not safety-critical.
                # Coalesce their frequent small changes into one disk write.
                self._store.async_delay_save(lambda: self._data, delay=60)

    async def async_clear_smart_ev_journal(self) -> None:
        """Clear Smart EV's local decision history without changing plans."""
        self._data.setdefault("smart_ev", {})["journal"] = []
        await self.async_save()

    # ---- Native Smart Loads planning and guarded device control ----

    def get_smart_loads(self) -> dict[str, Any]:
        """Return the complete account-wide Smart Loads state."""
        value = self._data.get("smart_loads", {})
        return {
            **dict(value),
            "loads": [dict(item) for item in value.get("loads", [])],
            "learning": {
                str(key): dict(item)
                for key, item in value.get("learning", {}).items()
                if isinstance(item, dict)
            },
            "plans": {
                str(key): dict(item)
                for key, item in value.get("plans", {}).items()
                if isinstance(item, dict)
            },
            "control_owners": {
                str(key): dict(item)
                for key, item in value.get("control_owners", {}).items()
                if isinstance(item, dict)
            },
            "control_pauses": {
                str(key): dict(item)
                for key, item in value.get("control_pauses", {}).items()
                if isinstance(item, dict)
            },
            "journal": [dict(item) for item in value.get("journal", [])],
            "runs": [dict(item) for item in value.get("runs", [])],
        }

    async def async_set_smart_loads(
        self, smart_loads: dict[str, Any]
    ) -> dict[str, Any]:
        """Persist Smart Loads configuration while retaining runtime state."""
        async with self._loads_lock():
            previous_raw = copy.deepcopy(self._data.get("smart_loads", {}))
            previous = self.get_smart_loads()
            current_revision = int(previous.get("revision", 0) or 0)
            incoming_revision = int(smart_loads.get("revision", 0) or 0)
            if incoming_revision != current_revision:
                raise ValueError(
                    "Smart Loads configuration changed; reload before saving"
                )
            owners = set(previous.get("control_owners", {}))
            if owners:
                previous_loads = {
                    str(item.get("id") or ""): item
                    for item in previous.get("loads", [])
                    if isinstance(item, dict)
                }
                incoming_loads = {
                    str(item.get("id") or ""): item
                    for item in smart_loads.get("loads", [])
                    if isinstance(item, dict)
                }
                if any(
                    load_id not in incoming_loads
                    or incoming_loads[load_id] != previous_loads.get(load_id)
                    for load_id in owners
                ):
                    raise ValueError(
                        "Wait for running Smart Loads to finish before changing them"
                    )
            payload = {
                **previous,
                **dict(smart_loads),
                "revision": current_revision + 1,
                "loads": [dict(item) for item in smart_loads.get("loads", [])],
                "learning": dict(previous.get("learning", {})),
                "plans": dict(previous.get("plans", {})),
                "control_owners": dict(previous.get("control_owners", {})),
                "control_pauses": dict(previous.get("control_pauses", {})),
                "journal": list(previous.get("journal", []))[-300:],
                "runs": list(previous.get("runs", []))[-200:],
            }
            self._data["smart_loads"] = payload
            try:
                await self._async_save_smart_loads_verified()
            except Exception:
                self._data["smart_loads"] = previous_raw
                raise
        return self.get_smart_loads()

    async def async_set_smart_load_mode(
        self, load_id: str, mode: str
    ) -> dict[str, Any] | None:
        """Atomically change one load mode without replacing newer settings."""
        async with self._loads_lock():
            previous_raw = copy.deepcopy(self._data.get("smart_loads", {}))
            payload = copy.deepcopy(previous_raw)
            found = False
            loads: list[dict[str, Any]] = []
            for item in payload.get("loads", []):
                load = dict(item)
                if str(load.get("id")) == load_id:
                    load["mode"] = mode
                    found = True
                loads.append(load)
            if not found:
                return None
            payload["loads"] = loads
            payload["revision"] = int(payload.get("revision", 0) or 0) + 1
            # Run-now is an explicit fresh cycle. Returning to smart clears
            # lockouts, but must retain safely measured progress from an
            # interrupted cycle so a restart cannot overrun the appliance.
            pauses = payload.setdefault("control_pauses", {})
            current_pause = pauses.get(load_id) or {}
            if mode == "run_now" or (
                mode == "smart" and current_pause.get("kind") != "progress"
            ):
                pauses.pop(load_id, None)
            self._data["smart_loads"] = payload
            try:
                await self._async_save_smart_loads_verified()
            except Exception:
                self._data["smart_loads"] = previous_raw
                raise
        return self.get_smart_loads()

    async def async_set_smart_loads_runtime(
        self,
        *,
        plans: dict[str, dict[str, Any]] | None = None,
        learning: dict[str, dict[str, Any]] | None = None,
        control_owners: dict[str, dict[str, Any]] | None = None,
        control_pauses: dict[str, dict[str, Any]] | None = None,
        journal_entries: list[dict[str, Any]] | None = None,
        completed_runs: list[dict[str, Any]] | None = None,
        immediate: bool = False,
    ) -> None:
        """Update Smart Loads plans, ownership, learning and history atomically."""
        async with self._loads_lock():
            previous_raw = copy.deepcopy(self._data.get("smart_loads", {}))
            payload = copy.deepcopy(previous_raw)
            changed = False
            safety_changed = False
            for key, raw_value in (
                ("plans", plans),
                ("learning", learning),
                ("control_owners", control_owners),
                ("control_pauses", control_pauses),
            ):
                if raw_value is None:
                    continue
                normalised = {
                    str(item_key): dict(value)
                    for item_key, value in raw_value.items()
                }
                if payload.get(key) != normalised:
                    previous_value = payload.get(key) or {}
                    payload[key] = normalised
                    changed = True
                    if key == "control_owners":
                        telemetry_keys = {
                            "baseline_cost",
                            "cost",
                            "cycle_stopped_since",
                            "energy_kwh",
                            "estimated_runtime_seconds",
                            "observed_runtime_seconds",
                            "peak_power_w",
                            "power_stopped_since",
                            "sampled_at",
                        }

                        def safety_view(value: dict[str, Any]) -> dict[str, Any]:
                            return {
                                owner_id: {
                                    field: field_value
                                    for field, field_value in owner.items()
                                    if field not in telemetry_keys
                                }
                                for owner_id, owner in value.items()
                            }

                        safety_changed = safety_changed or safety_view(
                            previous_value
                        ) != safety_view(normalised)
                    elif key == "control_pauses":
                        safety_changed = True
            for raw in journal_entries or []:
                row = dict(raw)
                row.setdefault("id", str(uuid.uuid4()))
                row.setdefault("timestamp", datetime.now(UTC).isoformat())
                journal = payload.setdefault("journal", [])
                fingerprint = tuple(
                    row.get(key)
                    for key in ("load_id", "action", "status", "reason")
                )
                previous = next(
                    (
                        item
                        for item in reversed(journal)
                        if item.get("load_id") == row.get("load_id")
                    ),
                    None,
                )
                previous_fingerprint = (
                    tuple(
                        previous.get(key)
                        for key in ("load_id", "action", "status", "reason")
                    )
                    if previous
                    else None
                )
                if fingerprint != previous_fingerprint:
                    journal.append(row)
                    payload["journal"] = journal[-300:]
                    changed = True
            if completed_runs:
                runs = payload.setdefault("runs", [])
                runs.extend(dict(item) for item in completed_runs)
                payload["runs"] = runs[-200:]
                changed = True
            if not changed and not immediate:
                return
            self._data["smart_loads"] = payload
            if immediate or safety_changed or not hasattr(self, "_store"):
                try:
                    await self._async_save_smart_loads_verified()
                except Exception:
                    self._data["smart_loads"] = previous_raw
                    raise
            else:
                self._store.async_delay_save(lambda: self._data, delay=60)

    async def async_clear_smart_loads_history(self) -> None:
        """Clear Smart Loads decision history and completed runs."""
        async with self._loads_lock():
            payload = self._data.setdefault("smart_loads", {})
            payload["journal"] = []
            payload["runs"] = []
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

    async def async_hide_device(self, device_key: str, device: dict[str, Any]) -> None:
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
