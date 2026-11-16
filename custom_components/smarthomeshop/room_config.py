"""Versioned multi-sensor room configuration helpers."""

from __future__ import annotations

import copy
import hashlib
import math
from typing import Any

ROOM_SCHEMA_VERSION = 2
DEFAULT_ROOM_FRESHNESS_SECONDS = 120
DEFAULT_ROOM_VACANCY_DELAY_SECONDS = 30
DEFAULT_TRACK_FUSION_DISTANCE_MM = 650
DEFAULT_TRACK_OBSERVATION_FRESHNESS_MS = 5000
DEFAULT_TRACK_HANDOFF_HOLD_MS = 1800
DEFAULT_TRACK_Z_TOLERANCE_MM = 700
CLIMATE_METRICS = ("temperature", "humidity", "co2")
CLIMATE_STRATEGIES = {"average", "primary", "separate"}


def _source_id(room_id: str, source: dict[str, Any], index: int) -> str:
    """Return a deterministic ID for a legacy source without one."""
    existing = str(source.get("id") or "").strip()
    if existing:
        return existing
    identity = str(source.get("deviceId") or source.get("device_id") or index)
    digest = hashlib.sha256(f"{room_id}:{identity}:{index}".encode()).hexdigest()[:10]
    return f"source-{digest}"


def _finite(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(parsed):
        return None
    return parsed


def _bounded_integer(value: Any, default: int, minimum: int, maximum: int) -> int:
    """Return a safe integer for a user-editable aggregation setting."""
    parsed = _finite(value)
    if parsed is None:
        return default
    return max(minimum, min(maximum, round(parsed)))


def normalize_room_config(room: dict[str, Any]) -> dict[str, Any]:
    """Migrate one room without losing legacy geometry or automation fields."""
    normalized = copy.deepcopy(room)
    room_id = str(normalized.get("id") or "").strip()
    if not room_id:
        raise ValueError("room id is required")
    normalized["id"] = room_id

    # Optional links to Home Assistant's area and floor registries. Keep the
    # IDs rather than translated names so renames and language changes are
    # harmless. A null/empty value means the link was deliberately cleared.
    for field in ("haAreaId", "haFloorId"):
        value = normalized.get(field)
        if value is None or value == "":
            normalized.pop(field, None)
            continue
        if not isinstance(value, str) or not value.strip() or len(value) > 255:
            raise ValueError(f"room {field} must be a Home Assistant registry id")
        normalized[field] = value.strip()

    for field in ("walls", "furniture", "devices", "doors", "windows", "mirrors", "zones"):
        if field not in normalized:
            continue
        items = normalized[field]
        if not isinstance(items, list) or any(not isinstance(item, dict) for item in items):
            raise ValueError(f"room {field} must be a list of objects")

    # Canonicalize legacy zone ownership without ever turning an owned zone
    # into a shared zone. Explicit current ownership wins when non-empty;
    # otherwise the legacy owner remains authoritative until the UI removes it.
    for zone in normalized.get("zones", []):
        owner = zone.get("sensorId") or zone.get("sensor_id")
        zone.pop("sensor_id", None)
        if owner:
            zone["sensorId"] = str(owner)
        elif "sensorId" in zone:
            zone["sensorId"] = None
        points = zone.get("points")
        if points is not None and (
            not isinstance(points, list)
            or any(
                not isinstance(point, dict)
                or _finite(point.get("x")) is None
                or _finite(point.get("y")) is None
                for point in points
            )
        ):
            raise ValueError("room zone points must be finite coordinate objects")
        if isinstance(points, list):
            for point in points:
                point["x"] = float(point["x"])
                point["y"] = float(point["y"])
        parts = zone.get("parts")
        if parts is not None and (
            not isinstance(parts, list)
            or any(
                not isinstance(part, list)
                or any(
                    not isinstance(point, dict)
                    or _finite(point.get("x")) is None
                    or _finite(point.get("y")) is None
                    for point in part
                )
                for part in parts
            )
        ):
            raise ValueError("room zone parts must contain finite coordinate objects")
        if isinstance(parts, list):
            for part in parts:
                for point in part:
                    point["x"] = float(point["x"])
                    point["y"] = float(point["y"])

    calibration = normalized.get("calibration")
    if calibration is not None:
        if not isinstance(calibration, dict):
            raise ValueError("room calibration must be an object")
        corners = calibration.get("corners", [])
        if not isinstance(corners, list) or len(corners) > 4 or any(
            not isinstance(point, dict)
            or _finite(point.get("x")) is None
            or _finite(point.get("y")) is None
            for point in corners
        ):
            raise ValueError("room calibration corners must be finite points")
        if calibration.get("enabled") is True and len(corners) != 4:
            raise ValueError("enabled room calibration requires four corners")
        for point in corners:
            point["x"] = float(point["x"])
            point["y"] = float(point["y"])

    raw_sources = normalized.get("sensors")
    if not isinstance(raw_sources, list) or not any(
        isinstance(item, dict) for item in raw_sources
    ):
        legacy = normalized.get("sensor")
        if isinstance(legacy, dict):
            raw_sources = [legacy]
        elif not isinstance(raw_sources, list):
            raw_sources = []

    sources: list[dict[str, Any]] = []
    seen_source_ids: set[str] = set()
    source_devices_by_id: dict[str, str] = {}
    seen_device_ids: set[str] = set()
    raw_aggregation = normalized.get("aggregation")
    raw_presence = raw_aggregation.get("presence") if isinstance(raw_aggregation, dict) else None
    raw_selected = raw_presence.get("source_ids", []) if isinstance(raw_presence, dict) else []
    if not isinstance(raw_selected, list):
        raw_selected = []
    raw_selected_ids = {
        str(source_id)
        for source_id in raw_selected
        if source_id
    }
    preferred_device_indexes: dict[str, tuple[int, bool]] = {}
    for index, raw_source in enumerate(raw_sources):
        if not isinstance(raw_source, dict):
            continue
        device_id = str(
            raw_source.get("deviceId") or raw_source.get("device_id") or ""
        ).strip()
        if not device_id:
            continue
        selected = _source_id(room_id, raw_source, index) in raw_selected_ids
        existing = preferred_device_indexes.get(device_id)
        if existing is None or (selected and not existing[1]):
            preferred_device_indexes[device_id] = (index, selected)
    source_id_remap: dict[str, str] = {}
    for index, raw_source in enumerate(raw_sources):
        if not isinstance(raw_source, dict):
            continue
        device_id = str(
            raw_source.get("deviceId") or raw_source.get("device_id") or ""
        ).strip()
        preferred = preferred_device_indexes.get(device_id) if device_id else None
        if preferred is None or preferred[0] == index:
            continue
        preferred_source = raw_sources[preferred[0]]
        if isinstance(preferred_source, dict):
            source_id_remap[_source_id(room_id, raw_source, index)] = _source_id(
                room_id, preferred_source, preferred[0]
            )
    for index, raw_source in enumerate(raw_sources):
        if not isinstance(raw_source, dict):
            continue
        source = copy.deepcopy(raw_source)
        source["id"] = _source_id(room_id, source, index)
        device_id = str(source.get("deviceId") or source.get("device_id") or "").strip()
        if device_id and preferred_device_indexes.get(device_id, (index, False))[0] != index:
            continue
        previous_device_id = source_devices_by_id.get(source["id"])
        if previous_device_id is not None:
            if device_id and previous_device_id and device_id != previous_device_id:
                raise ValueError("room source id belongs to more than one device")
            # Identical legacy rows can safely collapse to the preferred row.
            continue
        if device_id and device_id in seen_device_ids:
            continue
        seen_source_ids.add(source["id"])
        source_devices_by_id[source["id"]] = device_id
        if device_id:
            seen_device_ids.add(device_id)
        source.setdefault("source_version", 1)
        if not source.get("configured_at"):
            configured_at = normalized.get("updated_at") or normalized.get("created_at")
            if configured_at:
                source["configured_at"] = configured_at

        for field in (
            "x", "y", "x_m", "y_m", "heightMm", "height_m",
            "rotation", "orientation_deg",
        ):
            if field in source and source[field] is not None and _finite(source[field]) is None:
                raise ValueError(f"room source {field} must be finite")

        x_mm = _finite(source.get("x"))
        y_mm = _finite(source.get("y"))
        x_m = _finite(source.get("x_m"))
        y_m = _finite(source.get("y_m"))
        if x_m is None and x_mm is not None:
            source["x_m"] = round(x_mm / 1000, 4)
        if y_m is None and y_mm is not None:
            source["y_m"] = round(y_mm / 1000, 4)

        height_mm = _finite(source.get("heightMm"))
        if _finite(source.get("height_m")) is None and height_mm is not None:
            source["height_m"] = round(height_mm / 1000, 4)
        if _finite(source.get("orientation_deg")) is None:
            rotation = _finite(source.get("rotation"))
            if rotation is not None:
                source["orientation_deg"] = rotation % 360
        z_mapping = source.get("z_mapping")
        if not isinstance(z_mapping, dict):
            z_mapping = {}
        z_mode = str(z_mapping.get("mode") or "raw")
        verified = z_mapping.get("verified") is True and z_mode != "raw"
        verification_fingerprint = z_mapping.get("verification_fingerprint")
        source["z_mapping"] = {
            **copy.deepcopy(z_mapping),
            "mode": z_mode if z_mode in {"raw", "floor_up", "sensor_down"} else "raw",
            "verified": verified,
        }
        if verified and isinstance(verification_fingerprint, str) and verification_fingerprint:
            source["z_mapping"]["verification_fingerprint"] = verification_fingerprint[:512]
        sources.append(source)

    normalized["sensors"] = sources
    normalized.pop("sensor", None)
    normalized["schema_version"] = ROOM_SCHEMA_VERSION

    aggregation = normalized.get("aggregation")
    if not isinstance(aggregation, dict):
        aggregation = {}
    aggregation["version"] = 2

    presence = aggregation.get("presence")
    if not isinstance(presence, dict):
        presence = {}
    presence["freshness_seconds"] = _bounded_integer(
        presence.get("freshness_seconds"),
        DEFAULT_ROOM_FRESHNESS_SECONDS,
        15,
        600,
    )
    presence["vacancy_delay_seconds"] = _bounded_integer(
        presence.get("vacancy_delay_seconds"),
        DEFAULT_ROOM_VACANCY_DELAY_SECONDS,
        0,
        600,
    )
    source_ids = presence.get("source_ids")
    known_source_ids = {source["id"] for source in sources}
    presence["source_ids"] = (
        list(
            dict.fromkeys(
                str(source_id)
                for source_id in source_ids
                if source_id and str(source_id) in known_source_ids
            )
        )
        if isinstance(source_ids, list)
        else []
    )
    aggregation["presence"] = presence

    climate = aggregation.get("climate")
    if not isinstance(climate, dict):
        climate = {}
    for metric in CLIMATE_METRICS:
        setting = climate.get(metric)
        if not isinstance(setting, dict):
            setting = {}
        strategy = str(setting.get("strategy") or "average")
        setting["strategy"] = (
            strategy if strategy in CLIMATE_STRATEGIES else "average"
        )
        primary_source_id = setting.get("primary_source_id")
        remapped_primary_source_id = source_id_remap.get(
            str(primary_source_id), str(primary_source_id)
        )
        setting["primary_source_id"] = (
            remapped_primary_source_id
            if primary_source_id and remapped_primary_source_id in known_source_ids
            else None
        )
        climate[metric] = setting
    aggregation["climate"] = climate

    tracking = aggregation.get("tracking")
    if not isinstance(tracking, dict):
        tracking = {}
    tracking["experimental_fusion"] = tracking.get("experimental_fusion") is True
    tracking["duplicate_distance_mm"] = _bounded_integer(
        tracking.get("duplicate_distance_mm"),
        DEFAULT_TRACK_FUSION_DISTANCE_MM,
        150,
        1500,
    )
    tracking["observation_freshness_ms"] = _bounded_integer(
        tracking.get("observation_freshness_ms"),
        DEFAULT_TRACK_OBSERVATION_FRESHNESS_MS,
        1000,
        15000,
    )
    tracking["handoff_hold_ms"] = _bounded_integer(
        tracking.get("handoff_hold_ms"),
        DEFAULT_TRACK_HANDOFF_HOLD_MS,
        0,
        5000,
    )
    tracking["z_tolerance_mm"] = _bounded_integer(
        tracking.get("z_tolerance_mm"),
        DEFAULT_TRACK_Z_TOLERANCE_MM,
        100,
        2000,
    )
    alignment_revoked_at = tracking.get("alignment_revoked_at")
    if isinstance(alignment_revoked_at, str) and alignment_revoked_at.strip():
        tracking["alignment_revoked_at"] = alignment_revoked_at.strip()[:80]
    else:
        tracking.pop("alignment_revoked_at", None)
    raw_alignments = tracking.get("source_alignments")
    alignments: dict[str, dict[str, Any]] = {}
    if isinstance(raw_alignments, dict):
        for raw_source_id, raw_alignment in raw_alignments.items():
            source_id = str(raw_source_id)
            if source_id not in known_source_ids or not isinstance(raw_alignment, dict):
                continue
            fingerprint = str(raw_alignment.get("placement_fingerprint") or "").strip()
            verified_at = str(raw_alignment.get("verified_at") or "").strip()
            rmse = _finite(raw_alignment.get("rmse_mm"))
            alignment_distance = _finite(raw_alignment.get("duplicate_distance_mm"))
            sample_count = _bounded_integer(raw_alignment.get("sample_count"), 0, 0, 100)
            maximum_rmse = min(450, tracking["duplicate_distance_mm"] * 0.6)
            if (
                not fingerprint
                or not verified_at
                or rmse is None
                or not 0 <= rmse <= maximum_rmse
                or alignment_distance != tracking["duplicate_distance_mm"]
                or sample_count < 3
            ):
                continue
            alignments[source_id] = {
                **copy.deepcopy(raw_alignment),
                "placement_fingerprint": fingerprint[:300],
                "verified_at": verified_at[:80],
                "sample_count": sample_count,
                "rmse_mm": round(rmse),
                "duplicate_distance_mm": tracking["duplicate_distance_mm"],
            }
    tracking["source_alignments"] = alignments
    aggregation["tracking"] = tracking
    normalized["aggregation"] = aggregation
    return normalized


def room_sources(room: dict[str, Any]) -> list[dict[str, Any]]:
    """Return normalized source dictionaries."""
    return normalize_room_config(room)["sensors"]


_SOURCE_NUMBERS = (
    "x", "y", "x_m", "y_m", "heightMm", "height_m", "rotation", "orientation_deg",
)


def _valid_points(points: Any) -> bool:
    return isinstance(points, list) and all(
        isinstance(point, dict)
        and _finite(point.get("x")) is not None
        and _finite(point.get("y")) is not None
        for point in points
    )


def repair_room_config(room_id: str, room: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """Remove only the broken parts of a stored room that fails to load.

    Returns the repaired copy and a short note per removed part. The caller
    still runs normalize_room_config on the copy and keeps the original.
    """
    repaired = copy.deepcopy(room)
    notes: list[str] = []
    if not str(repaired.get("id") or "").strip():
        repaired["id"] = room_id
        notes.append("missing id restored")
    for field in ("walls", "furniture", "devices", "doors", "windows", "mirrors", "zones", "sensors"):
        if field not in repaired:
            continue
        items = repaired[field]
        if not isinstance(items, list):
            repaired[field] = []
            notes.append(f"{field} reset")
            continue
        kept = [item for item in items if isinstance(item, dict)]
        if len(kept) != len(items):
            repaired[field] = kept
            notes.append(f"{len(items) - len(kept)} invalid {field} removed")
    zones = repaired.get("zones", [])
    kept_zones = [
        zone for zone in zones
        if (zone.get("points") is None or _valid_points(zone.get("points")))
        and (
            zone.get("parts") is None
            or (isinstance(zone.get("parts"), list) and all(_valid_points(part) for part in zone["parts"]))
        )
    ]
    if len(kept_zones) != len(zones):
        repaired["zones"] = kept_zones
        notes.append(f"{len(zones) - len(kept_zones)} zones with invalid points removed")
    calibration = repaired.get("calibration")
    if calibration is not None and (
        not isinstance(calibration, dict)
        or not isinstance(calibration.get("corners", []), list)
        or len(calibration.get("corners", [])) > 4
        or not _valid_points(calibration.get("corners", []))
    ):
        repaired.pop("calibration")
        notes.append("invalid calibration removed")
    elif isinstance(calibration, dict) and calibration.get("enabled") is True and len(calibration.get("corners", [])) != 4:
        calibration["enabled"] = False
        notes.append("incomplete calibration turned off")
    sources = repaired.get("sensors", [])
    devices_by_id: dict[str, str] = {}
    for source in sources:
        for field in _SOURCE_NUMBERS:
            if source.get(field) is not None and _finite(source[field]) is None:
                source.pop(field)
                notes.append(f"invalid sensor {field} removed")
        source_id = str(source.get("id") or "").strip()
        device_id = str(source.get("deviceId") or source.get("device_id") or "").strip()
        if source_id and source_id in devices_by_id and devices_by_id[source_id] != device_id:
            # Two devices under one source id: give the later one its own id.
            source.pop("id")
            notes.append("duplicate sensor id replaced")
        elif source_id:
            devices_by_id[source_id] = device_id
    return repaired, notes
