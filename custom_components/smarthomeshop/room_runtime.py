"""Freshness-safe room presence and climate aggregation."""

from __future__ import annotations

import asyncio
import math
import re
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant, State, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .const import DOMAIN, LOGGER
from .radar_profiles import RadarDeviceProfile, discover_radar_device_profiles
from .room_config import CLIMATE_METRICS, normalize_room_config

INVALID_STATES = {"", "unknown", "unavailable", "none", "null", "nan"}
ROOM_RUNTIME_COORDINATOR = "room_runtime"


@dataclass(frozen=True, slots=True)
class SourceSignal:
    """One source's evaluated presence signal."""

    source_id: str
    device_id: str | None
    status: str
    entity_ids: tuple[str, ...]
    age_seconds: float | None
    radar_modules: tuple[str, ...]


def _timestamp(value: datetime | float | str | None) -> float | None:
    if isinstance(value, datetime):
        return value.timestamp()
    if isinstance(value, (float, int)) and math.isfinite(float(value)):
        return float(value)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value).timestamp()
        except ValueError:
            return None
    return None


def _fresh_age(updated_at: Any, now: float, freshness_seconds: int) -> float | None:
    recorded = _timestamp(updated_at)
    if recorded is None or recorded > now:
        return None
    age = max(0.0, now - recorded)
    return age if age <= freshness_seconds else None


def _state_report_age(state: State | None, now: float) -> float | None:
    """Return report age without confusing an unchanged value with a dead device."""
    if state is None:
        return None
    reported = getattr(state, "last_reported", None) or state.last_updated
    recorded = _timestamp(reported)
    if recorded is None or recorded > now:
        return None
    return max(0.0, now - recorded)


def _climate_report_is_fresh(
    state: State | None, now: float, freshness_seconds: int
) -> bool:
    """Trust Home Assistant availability for steady ESPHome measurements.

    ESPHome can suppress identical updates before they reach an entity, so an
    unchanged last_reported is not proof that the device is stale. Disconnects
    are represented by HA as unavailable and are rejected by _state_value.
    """
    if state is None or _state_value(state) is None:
        return False
    reported = getattr(state, "last_reported", None) or state.last_updated
    recorded = _timestamp(reported)
    # Steady ESPHome values may legitimately keep an old timestamp, but a
    # timestamp from the future can never be accepted as current evidence.
    return recorded is None or recorded <= now


def _presence_state_status(
    state: State | None, now: float, freshness_seconds: int
) -> tuple[str, float | None]:
    """Classify presence without letting a cached report clear a room."""
    value = _state_value(state)
    age = _state_report_age(state, now)
    reported = (
        getattr(state, "last_reported", None) or state.last_updated
        if state is not None
        else None
    )
    recorded = _timestamp(reported)
    if recorded is not None and recorded > now:
        return "unknown", None
    if value is None:
        return "unknown", age
    # ESPHome does not guarantee that repeated identical values advance
    # last_reported. Home Assistant availability is the liveness contract;
    # cached unavailable/unknown states have already been rejected above.
    return (
        "positive" if value in {"on", "true", "home", "occupied", "1"} else "negative",
        age,
    )


def _target_count_state_status(
    state: State | None, now: float
) -> tuple[str, float | None]:
    """Classify a numeric radar target count as presence evidence."""
    value = _state_value(state)
    age = _state_report_age(state, now)
    reported = (
        getattr(state, "last_reported", None) or state.last_updated
        if state is not None
        else None
    )
    recorded = _timestamp(reported)
    if recorded is not None and recorded > now:
        return "unknown", None
    if value is None:
        return "unknown", age
    try:
        count = float(value)
    except (TypeError, ValueError):
        return "unknown", age
    if not math.isfinite(count) or count < 0:
        return "unknown", age
    return ("positive" if count > 0 else "negative"), age


def _normalise_climate_value(metric: str, state: State | None) -> float | None:
    """Normalize supported climate units to the room entity's native units."""
    if state is None or _state_value(state) is None:
        return None
    try:
        value = float(state.state)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(value):
        return None
    if metric != "temperature":
        return value
    unit = str(state.attributes.get("unit_of_measurement") or "°C").strip().lower()
    if unit in {"°c", "c", "celsius"}:
        return value
    if unit in {"°f", "f", "fahrenheit"}:
        return (value - 32) * 5 / 9
    if unit in {"k", "kelvin"}:
        return value - 273.15
    return None


def evaluate_room_presence(
    signals: list[SourceSignal],
    previous: Mapping[str, Any] | None,
    *,
    now: float,
    vacancy_delay_seconds: int,
) -> dict[str, Any]:
    """Combine sources without treating missing data as an empty room."""
    positive = [signal for signal in signals if signal.status == "positive"]
    negative = [signal for signal in signals if signal.status == "negative"]
    unknown = [signal for signal in signals if signal.status == "unknown"]
    previous = dict(previous or {})
    pending = _timestamp(previous.get("pending_clear_since"))
    last_known_occupied = previous.get("last_known_occupied") is True
    if previous.get("occupied") is True:
        last_known_occupied = True

    if positive:
        occupied: bool | None = True
        status = "occupied"
        pending = None
        last_known_occupied = True
    elif signals and len(negative) == len(signals):
        if last_known_occupied and vacancy_delay_seconds > 0:
            pending = pending if pending is not None and pending <= now else now
            if now - pending < vacancy_delay_seconds:
                occupied = True
                status = "clearing"
            else:
                occupied = False
                status = "clear"
                pending = None
                last_known_occupied = False
        else:
            occupied = False
            status = "clear"
            pending = None
            last_known_occupied = False
    else:
        occupied = None
        status = "unknown"
        # Uncertainty breaks a continuous-clear interval but must not erase the
        # fact that the room was occupied before data became uncertain.
        pending = None

    return {
        "occupied": occupied,
        "status": status,
        "degraded": bool(unknown),
        "pending_clear_since": pending,
        "last_known_occupied": last_known_occupied,
        "positive_sources": [signal.source_id for signal in positive],
        "negative_sources": [signal.source_id for signal in negative],
        "unknown_sources": [signal.source_id for signal in unknown],
    }


def _normalise(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (value or "").lower()).strip("_")


def _profile_for_source(
    profiles: list[RadarDeviceProfile], device_id: str | None
) -> RadarDeviceProfile | None:
    if not device_id:
        return None
    return next(
        (
            profile
            for profile in profiles
            if device_id == profile.device_id
            or device_id == profile.entity_prefix
            or device_id in profile.aliases
        ),
        None,
    )


def _state_value(state: State | None) -> str | None:
    value = str(state.state if state is not None else "").strip().lower()
    return None if value in INVALID_STATES else value


def _state_number(state: State | None) -> float | None:
    value = _state_value(state)
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _point_in_polygon(point: tuple[float, float], polygon: list[tuple[float, float]]) -> bool:
    """Return whether a room-local point is inside a polygon."""
    inside = False
    x, y = point
    previous = len(polygon) - 1
    for current, (current_x, current_y) in enumerate(polygon):
        previous_x, previous_y = polygon[previous]
        intersects = ((current_y > y) != (previous_y > y)) and (
            x
            < (previous_x - current_x)
            * (y - current_y)
            / ((previous_y - current_y) or 1e-12)
            + current_x
        )
        if intersects:
            inside = not inside
        previous = current
    return inside


OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM = 350.0


def _distance_to_polygon_boundary(
    point: tuple[float, float], polygon: list[tuple[float, float]]
) -> float:
    """Return the shortest distance from a point to a polygon edge."""
    if len(polygon) < 2:
        return math.inf
    minimum = math.inf
    point_x, point_y = point
    for index, (start_x, start_y) in enumerate(polygon):
        end_x, end_y = polygon[(index + 1) % len(polygon)]
        delta_x = end_x - start_x
        delta_y = end_y - start_y
        length_squared = delta_x * delta_x + delta_y * delta_y
        fraction = (
            max(
                0.0,
                min(
                    1.0,
                    ((point_x - start_x) * delta_x + (point_y - start_y) * delta_y)
                    / length_squared,
                ),
            )
            if length_squared > 0
            else 0.0
        )
        minimum = min(
            minimum,
            math.hypot(
                point_x - (start_x + fraction * delta_x),
                point_y - (start_y + fraction * delta_y),
            ),
        )
    return minimum


def _safely_outside_room(
    point: tuple[float, float], polygon: list[tuple[float, float]]
) -> bool:
    """Only suppress a point clearly outside the measured room boundary."""
    return (
        len(polygon) >= 3
        and not _point_in_polygon(point, polygon)
        and _distance_to_polygon_boundary(point, polygon)
        >= OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM
    )


def _safe_room_polygon(raw_walls: Any) -> list[tuple[float, float]]:
    """Return a polygon only when the stored wall chain is trustworthy.

    Outside-room suppression is allowed to hide a target, so malformed,
    unordered or self-intersecting walls must fail open and disable that
    suppression rather than guessing a room boundary.
    """
    if not isinstance(raw_walls, list) or len(raw_walls) < 3:
        return []
    segments: list[tuple[tuple[float, float], tuple[float, float]]] = []
    for wall in raw_walls:
        if not isinstance(wall, Mapping):
            return []
        start = (_stateful_finite(wall.get("x1")), _stateful_finite(wall.get("y1")))
        end = (_stateful_finite(wall.get("x2")), _stateful_finite(wall.get("y2")))
        if None in (*start, *end):
            return []
        typed_start = (float(start[0]), float(start[1]))
        typed_end = (float(end[0]), float(end[1]))
        if math.dist(typed_start, typed_end) <= 1e-6:
            return []
        segments.append((typed_start, typed_end))
    for index, (_start, end) in enumerate(segments):
        if math.dist(end, segments[(index + 1) % len(segments)][0]) > 1e-3:
            return []

    points = [segment[0] for segment in segments]
    if any(
        math.dist(point, other) <= 1e-3
        for index, point in enumerate(points)
        for other in points[index + 1 :]
    ):
        # A simple polygon visits every vertex exactly once. Repeated laps and
        # pinched/touching outlines can otherwise manufacture an "outside".
        return []

    def _orientation(
        first: tuple[float, float],
        second: tuple[float, float],
        third: tuple[float, float],
    ) -> float:
        return ((second[0] - first[0]) * (third[1] - first[1])
                - (second[1] - first[1]) * (third[0] - first[0]))

    def _on_segment(
        first: tuple[float, float],
        second: tuple[float, float],
        point: tuple[float, float],
    ) -> bool:
        return (
            abs(_orientation(first, second, point)) <= 1e-6
            and min(first[0], second[0]) - 1e-6 <= point[0] <= max(first[0], second[0]) + 1e-6
            and min(first[1], second[1]) - 1e-6 <= point[1] <= max(first[1], second[1]) + 1e-6
        )

    def _segments_intersect_or_touch(
        first_start: tuple[float, float],
        first_end: tuple[float, float],
        second_start: tuple[float, float],
        second_end: tuple[float, float],
    ) -> bool:
        first_side_a = _orientation(first_start, first_end, second_start)
        first_side_b = _orientation(first_start, first_end, second_end)
        second_side_a = _orientation(second_start, second_end, first_start)
        second_side_b = _orientation(second_start, second_end, first_end)
        if first_side_a * first_side_b < 0 and second_side_a * second_side_b < 0:
            return True
        return (
            _on_segment(first_start, first_end, second_start)
            or _on_segment(first_start, first_end, second_end)
            or _on_segment(second_start, second_end, first_start)
            or _on_segment(second_start, second_end, first_end)
        )

    for first_index, (first_start, first_end) in enumerate(segments):
        for second_index in range(first_index + 1, len(segments)):
            if second_index in {
                first_index,
                (first_index + 1) % len(segments),
                (first_index - 1) % len(segments),
            }:
                continue
            second_start, second_end = segments[second_index]
            if _segments_intersect_or_touch(
                first_start, first_end, second_start, second_end
            ):
                return []

    # Adjacent edges may share their endpoint, but must not double back over
    # one another. Straight wall segments that continue forward stay valid.
    for index, (first_start, first_end) in enumerate(segments):
        _second_start, second_end = segments[(index + 1) % len(segments)]
        if (
            _on_segment(first_start, first_end, second_end)
            and math.dist(second_end, first_end) > 1e-3
        ):
            return []
    area_twice = sum(
        point[0] * points[(index + 1) % len(points)][1]
        - points[(index + 1) % len(points)][0] * point[1]
        for index, point in enumerate(points)
    )
    return points if abs(area_twice) > 1e-3 else []


def _installation_mode_safe(hass: HomeAssistant, profile: RadarDeviceProfile) -> bool:
    """Return whether configurable radar geometry is in its required mode."""
    radar_model = getattr(profile.profile, "radar_model", None)
    required_mode = getattr(profile.profile, "required_installation_mode", None)
    if radar_model not in {"ld2460", "ld6002b"} or required_mode not in {"top", "side"}:
        return True
    mode_entity = getattr(profile.profile, "reported_installation_mode_entity_id", None)
    current_mode: str | None = None
    if mode_entity:
        state = hass.states.get(mode_entity)
        value = str(getattr(state, "state", "")).strip().lower()
        current_mode = value if value in {"top", "side"} else None
    elif getattr(profile.profile, "current_hardware_mode", None) in {"top", "side"}:
        current_mode = str(profile.profile.current_hardware_mode)
    return current_mode == required_mode


def _polygon_points(raw_points: Any) -> list[tuple[float, float]]:
    if not isinstance(raw_points, list):
        return []
    points: list[tuple[float, float]] = []
    for raw in raw_points:
        if not isinstance(raw, Mapping):
            continue
        x = _stateful_finite(raw.get("x"))
        y = _stateful_finite(raw.get("y"))
        if x is not None and y is not None:
            points.append((x, y))
    return points


def _stateful_finite(value: Any) -> float | None:
    """Parse finite configuration geometry without accepting booleans."""
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _source_geometry_safe(source: Mapping[str, Any]) -> bool:
    """Reject explicitly malformed placement instead of substituting zero."""
    return all(
        field not in source
        or source.get(field) is None
        or _stateful_finite(source.get(field)) is not None
        for field in (
            "x", "y", "x_m", "y_m", "heightMm", "height_m",
            "rotation", "orientation_deg",
        )
    )


def _target_suppression(
    hass: HomeAssistant,
    room: Mapping[str, Any],
    source: Mapping[str, Any],
    profile: RadarDeviceProfile,
    *,
    now: float,
    coordinate_freshness_seconds: float,
) -> tuple[set[str], bool, set[str], str]:
    """Identify radar positives fully explained by room exclusion geometry.

    This is deliberately conservative: aggregate presence/count are suppressed
    only when every reported target is represented by a current coordinate in
    an exclusion polygon or outside the room. Supplementary PIR/radar inputs
    are never part of this suppression decision.
    """
    room_points = _safe_room_polygon(room.get("walls", []))
    exclusion_polygons: list[list[tuple[float, float]]] = []
    raw_zones = room.get("zones", [])
    for zone in raw_zones if isinstance(raw_zones, list) else []:
        if not isinstance(zone, Mapping) or zone.get("type") != "exclusion":
            continue
        owner = zone.get("sensorId") or zone.get("sensor_id")
        if owner not in (None, "", source.get("id")):
            continue
        parts = [zone.get("points")]
        if isinstance(zone.get("parts"), list):
            parts.extend(zone["parts"])
        exclusion_polygons.extend(
            polygon for part in parts if len(polygon := _polygon_points(part)) >= 3
        )
    targets = tuple(getattr(profile, "targets", ()) or ())
    if not targets or any(
        not getattr(target, "x_entity_id", None)
        or not getattr(target, "y_entity_id", None)
        for target in targets
    ):
        return set(), False, set(), "unknown"
    coordinate_entities = {
        entity_id
        for target in targets
        for entity_id in (target.x_entity_id, target.y_entity_id)
        if entity_id
    }
    if not _source_geometry_safe(source):
        return set(), False, coordinate_entities, "unknown"
    if not _installation_mode_safe(hass, profile):
        # Coordinates produced in the wrong/unknown LD2460 mode are not safe
        # geometry evidence. Keep presence inputs positive/unknown instead of
        # using those coordinates to manufacture a clear room.
        return set(), False, coordinate_entities, "unknown"
    scale = (
        _stateful_finite(
            getattr(profile.profile, "coordinate_scale_to_mm", None)
        )
        or 1.0
    )
    source_x = _stateful_finite(source.get("x_m"))
    source_y = _stateful_finite(source.get("y_m"))
    source_x = source_x * 1000 if source_x is not None else (_stateful_finite(source.get("x")) or 0.0)
    source_y = source_y * 1000 if source_y is not None else (_stateful_finite(source.get("y")) or 0.0)
    orientation = _stateful_finite(source.get("orientation_deg"))
    if orientation is None:
        orientation = _stateful_finite(source.get("rotation")) or 0.0
    rotation = math.radians(orientation - 90)

    suppressed_presence_entities: set[str] = set()
    coordinate_entities = set(coordinate_entities)
    suppressed_active = 0
    unsuppressed_active = 0
    explicit_presence_complete = True
    explicit_positive = 0
    all_targets_have_presence = bool(targets)
    all_coordinate_slots_current = bool(targets)
    all_current_coordinates_empty = bool(targets)
    for target in targets:
        coordinate_entities.update((target.x_entity_id, target.y_entity_id))
        x_state = hass.states.get(target.x_entity_id)
        y_state = hass.states.get(target.y_entity_id)
        x_fresh = _fresh_age(
            getattr(x_state, "last_reported", None) or getattr(x_state, "last_updated", None),
            now,
            coordinate_freshness_seconds,
        ) is not None
        y_fresh = _fresh_age(
            getattr(y_state, "last_reported", None) or getattr(y_state, "last_updated", None),
            now,
            coordinate_freshness_seconds,
        ) is not None
        raw_x = _state_number(x_state) if x_fresh else None
        raw_y = _state_number(y_state) if y_fresh else None
        all_coordinate_slots_current = (
            all_coordinate_slots_current and raw_x is not None and raw_y is not None
        )
        all_current_coordinates_empty = (
            all_current_coordinates_empty
            and raw_x == 0
            and raw_y == 0
        )
        presence_entity = target.presence_entity_id
        presence_state = hass.states.get(presence_entity) if presence_entity else None
        presence_value = _state_value(presence_state)
        if presence_entity:
            explicit_presence_complete = explicit_presence_complete and presence_value is not None
            explicit_presence_positive = presence_value in {
                "on", "true", "home", "occupied", "1"
            }
            explicit_positive += int(explicit_presence_positive)
        else:
            all_targets_have_presence = False
        # Fresh non-zero coordinates are direct physical evidence and must not
        # be hidden by a lagging or unavailable per-target flag.
        positive = raw_x is not None and raw_y is not None and (
            raw_x != 0 or raw_y != 0
        )
        if not positive or raw_x is None or raw_y is None:
            continue
        x = raw_x * scale
        y = raw_y * scale
        local = (
            source_x + y * math.cos(rotation) - x * math.sin(rotation),
            source_y + y * math.sin(rotation) + x * math.cos(rotation),
        )
        suppressed = (
            _safely_outside_room(local, room_points)
            or any(_point_in_polygon(local, polygon) for polygon in exclusion_polygons)
        )
        if suppressed:
            suppressed_active += 1
            if presence_entity:
                suppressed_presence_entities.add(presence_entity)
        else:
            unsuppressed_active += 1

    count_entity = profile.profile.tracking_target_count_entity_id
    count_state = hass.states.get(count_entity) if count_entity else None
    raw_reported_count = (
        _state_number(count_state)
        if count_state is not None
        and _fresh_age(
            getattr(count_state, "last_reported", None)
            or getattr(count_state, "last_updated", None),
            now,
            coordinate_freshness_seconds,
        ) is not None
        else None
    )
    reported_count = (
        int(raw_reported_count)
        if raw_reported_count is not None
        and raw_reported_count >= 0
        and raw_reported_count.is_integer()
        else None
    )
    count_explained = (
        reported_count is not None
        and reported_count > 0
        and suppressed_active == reported_count
        and unsuppressed_active == 0
    )
    explicit_explained = (
        all_targets_have_presence
        and explicit_presence_complete
        and explicit_positive > 0
        and suppressed_active == explicit_positive
        and unsuppressed_active == 0
    )
    aggregate_explained = count_explained if count_entity else explicit_explained
    coordinate_status = (
        "positive"
        if unsuppressed_active > 0
        else "negative"
        if all_coordinate_slots_current
        and (all_current_coordinates_empty or suppressed_active > 0)
        else "unknown"
    )
    return (
        suppressed_presence_entities,
        aggregate_explained,
        coordinate_entities,
        coordinate_status,
    )


def _radar_modules(profile: RadarDeviceProfile | None) -> tuple[str, ...]:
    if profile is None:
        return ()
    modules = {profile.profile.radar_model}
    for entity_id in profile.profile.supplementary_presence_sensors:
        identity = _normalise(entity_id)
        for module in ("ld2412", "ld2450", "ld2460", "ld6002b"):
            if module in identity:
                modules.add(module)
    return tuple(sorted(module for module in modules if module and module != "unknown"))


_CLIMATE_NAMES = {
    "temperature": {
        "temperature",
        "scd40_temperature",
        "scd41_temperature",
        "scd4x_temperature",
        "room_temperature",
    },
    "humidity": {
        "humidity",
        "scd40_humidity",
        "scd41_humidity",
        "scd4x_humidity",
        "room_humidity",
    },
    "co2": {
        "co2",
        "carbon_dioxide",
        "scd40_co2",
        "scd41_co2",
        "scd4x_co2",
    },
}


def _resolve_climate_entities(
    hass: HomeAssistant, device_id: str | None
) -> dict[str, str]:
    if not device_id:
        return {}
    registry = er.async_get(hass)
    matches: dict[str, tuple[int, str]] = {}
    for entry in er.async_entries_for_device(registry, device_id):
        if (
            entry.platform != "esphome"
            or entry.domain != "sensor"
            or entry.disabled_by is not None
        ):
            continue
        state = hass.states.get(entry.entity_id)
        original = _normalise(getattr(entry, "original_name", None))
        unique = _normalise(getattr(entry, "unique_id", None))
        identity = f"_{original}_{unique}_"
        if any(
            marker in identity
            for marker in (
                "_internal_temperature_",
                "_device_temperature_",
                "_board_temperature_",
                "_cpu_temperature_",
                "_esp_temperature_",
            )
        ):
            continue
        device_class = _normalise(
            getattr(entry, "original_device_class", None)
            or (state.attributes.get("device_class") if state else None)
        )
        for metric, names in _CLIMATE_NAMES.items():
            exact = original in names
            suffix = any(unique.endswith(name) for name in names)
            class_match = device_class in ({"temperature"} if metric == "temperature" else {"humidity"} if metric == "humidity" else {"carbon_dioxide", "co2"})
            if not (exact or suffix or class_match):
                continue
            # Explicit SCD4x and exact original names win over a generic
            # device-class match. This avoids selecting a board-temperature
            # diagnostic when the room sensor is also present.
            score = 5 if "scd4" in identity else 4 if exact else 2 if suffix else 1
            if score > matches.get(metric, (-1, ""))[0]:
                matches[metric] = (score, entry.entity_id)
    return {metric: match[1] for metric, match in matches.items()}


def _sync_shared_radar_issues(
    hass: HomeAssistant,
    previous: dict[str, tuple[str, list[str]]],
    shared: dict[str, tuple[str, list[str]]],
) -> None:
    """Show one Repairs issue per radar that more than one room uses.

    Older versions allowed this. Such a radar cannot tell which room it sees,
    so those rooms stay unknown until the user unlinks it from all but one.
    """
    for device_id in previous.keys() - shared.keys():
        ir.async_delete_issue(hass, DOMAIN, f"radar_in_two_rooms_{device_id}")
    for device_id, (radar, rooms) in shared.items():
        if previous.get(device_id) == (radar, rooms):
            continue
        ir.async_create_issue(
            hass,
            DOMAIN,
            f"radar_in_two_rooms_{device_id}",
            is_fixable=False,
            is_persistent=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key="radar_in_two_rooms",
            translation_placeholders={"radar": radar, "rooms": ", ".join(rooms)},
        )


class RoomRuntimeCoordinator(DataUpdateCoordinator[dict[str, dict[str, Any]]]):
    """Compute one reliable runtime snapshot for every configured room."""

    def __init__(self, hass: HomeAssistant, store: Any) -> None:
        super().__init__(
            hass,
            LOGGER,
            config_entry=None,
            name="SmartHomeShop rooms",
            update_interval=timedelta(seconds=5),
        )
        self.store = store
        self._tracked_entities: set[str] = set()
        self._remove_state_listener: Any = None
        self._remove_keepalive_listener: Any = None
        self._event_refresh_task: asyncio.Task[Any] | None = None
        self._event_refresh_dirty = False
        self._shared_radar_issues: dict[str, tuple[str, list[str]]] = {}
        self.data = {}

    async def async_setup(self) -> None:
        """Start tracking source state changes."""
        # Room aggregation is account-wide and intentionally has no single
        # ConfigEntry owner, so use the generic coordinator refresh path.
        await self.async_refresh()
        # DataUpdateCoordinator only schedules periodic refreshes while it has
        # listeners. Keep expiry/hysteresis alive even when all room entities
        # are disabled and the panel is closed.
        if self._remove_keepalive_listener is None:
            self._remove_keepalive_listener = self.async_add_listener(lambda: None)

    @callback
    def _request_refresh(self) -> None:
        if self._event_refresh_task is not None and not self._event_refresh_task.done():
            self._event_refresh_dirty = True
            return

        async def _refresh_after_event_batch() -> None:
            # Coalesce each ESPHome packet, and run once more if a state event
            # arrived while the refresh itself was in progress.
            while True:
                self._event_refresh_dirty = False
                await asyncio.sleep(0.05)
                await self.async_refresh()
                if not self._event_refresh_dirty:
                    break

        self._event_refresh_task = self.hass.async_create_task(
            _refresh_after_event_batch()
        )

    @callback
    def async_rooms_changed(self) -> None:
        """Refresh discovery after a room/source change."""
        self._request_refresh()

    @callback
    def _states_changed(self, _event: Any) -> None:
        self._request_refresh()

    def _refresh_listener(self, entity_ids: set[str]) -> None:
        if entity_ids == self._tracked_entities:
            return
        if self._remove_state_listener is not None:
            self._remove_state_listener()
            self._remove_state_listener = None
        self._tracked_entities = entity_ids
        if entity_ids:
            self._remove_state_listener = async_track_state_change_event(
                self.hass, sorted(entity_ids), self._states_changed
            )

    async def _async_update_data(self) -> dict[str, dict[str, Any]]:
        profiles = list(discover_radar_device_profiles(self.hass))
        now = dt_util.utcnow().timestamp()
        rooms: dict[str, dict[str, Any]] = {}
        tracked: set[str] = set()
        durable_runtime = self.store.get_room_runtime()
        next_durable: dict[str, dict[str, Any]] = {}
        configured_rooms = [
            normalize_room_config(raw_room) for raw_room in self.store.get_rooms()
        ]
        rooms_by_device: dict[str, set[str]] = {}
        for configured_room in configured_rooms:
            configured_room_id = str(configured_room.get("id") or "")
            for configured_source in configured_room.get("sensors", []):
                raw_device_id = configured_source.get("deviceId") or configured_source.get("device_id")
                profile = _profile_for_source(
                    profiles, str(raw_device_id) if raw_device_id else None
                )
                physical_device_id = (
                    profile.device_id
                    if profile
                    else str(raw_device_id) if raw_device_id else None
                )
                if physical_device_id and configured_room_id:
                    rooms_by_device.setdefault(physical_device_id, set()).add(
                        configured_room_id
                    )
        duplicate_devices = {
            device_id for device_id, room_ids in rooms_by_device.items()
            if len(room_ids) > 1
        }
        room_names = {
            str(room.get("id") or ""): str(room.get("name") or room.get("id") or "")
            for room in configured_rooms
        }
        shared_radars = {
            device_id: (
                next(
                    (profile.name for profile in profiles if profile.device_id == device_id),
                    device_id,
                ),
                sorted(room_names.get(room_id, room_id) for room_id in rooms_by_device[device_id]),
            )
            for device_id in sorted(duplicate_devices)
        }
        previous_shared = getattr(self, "_shared_radar_issues", {})
        if shared_radars != previous_shared:
            _sync_shared_radar_issues(self.hass, previous_shared, shared_radars)
            self._shared_radar_issues = shared_radars

        for room in configured_rooms:
            room_id = str(room.get("id") or "")
            if not room_id:
                continue
            aggregation = room["aggregation"]
            presence_config = aggregation["presence"]
            freshness = max(15, min(600, int(presence_config.get("freshness_seconds", 120))))
            delay = max(0, min(600, int(presence_config.get("vacancy_delay_seconds", 30))))
            selected_ids = {
                str(item) for item in presence_config.get("source_ids", []) if item
            }
            source_details: list[dict[str, Any]] = []
            signals: list[SourceSignal] = []
            seen_physical_devices: set[str] = set()
            retained_source_by_device: dict[str, str] = {}
            runtime_source_id_remap: dict[str, str] = {}

            room_sources = list(room["sensors"])
            if selected_ids:
                # Prefer an explicitly selected alias when legacy storage still
                # contains two entries for the same physical device. Current
                # saves reject those duplicates, but migration must not drop the
                # selected source before physical-device deduplication.
                room_sources = [item for _, item in sorted(
                    enumerate(room_sources),
                    key=lambda indexed: (
                        str(indexed[1].get("id") or indexed[1].get("deviceId") or "")
                        not in selected_ids,
                        indexed[0],
                    ),
                )]

            for source in room_sources:
                source_id = str(source.get("id") or source.get("deviceId") or "")
                if not source_id:
                    continue
                use_for_presence = not selected_ids or source_id in selected_ids
                device_id = source.get("deviceId") or source.get("device_id")
                profile = _profile_for_source(profiles, str(device_id) if device_id else None)
                resolved_device_id = profile.device_id if profile else (str(device_id) if device_id else None)
                if resolved_device_id and resolved_device_id in seen_physical_devices:
                    retained_source_id = retained_source_by_device.get(resolved_device_id)
                    if retained_source_id:
                        runtime_source_id_remap[source_id] = retained_source_id
                    continue
                if resolved_device_id:
                    seen_physical_devices.add(resolved_device_id)
                    retained_source_by_device[resolved_device_id] = source_id
                duplicated_across_rooms = resolved_device_id in duplicate_devices
                entities: list[str] = []
                count_entity: str | None = None
                primary_presence_entity: str | None = None
                suppressed_entities: set[str] = set()
                suppress_aggregate_presence = False
                coordinate_status = "unknown"
                installation_mode_safe = True
                if profile:
                    installation_mode_safe = _installation_mode_safe(self.hass, profile)
                    mode_entity = getattr(
                        profile.profile, "reported_installation_mode_entity_id", None
                    )
                    if mode_entity:
                        tracked.add(mode_entity)
                    if profile.profile.tracking_presence_entity_id:
                        primary_presence_entity = profile.profile.tracking_presence_entity_id
                        entities.append(primary_presence_entity)
                    entities.extend(profile.profile.supplementary_presence_sensors)
                    entities.extend(
                        getattr(target, "presence_entity_id", None)
                        for target in getattr(profile, "targets", ())
                        if getattr(target, "presence_entity_id", None)
                    )
                    count_entity = getattr(
                        profile.profile, "tracking_target_count_entity_id", None
                    )
                    if count_entity:
                        entities.append(count_entity)
                    (
                        suppressed_entities,
                        suppress_aggregate_presence,
                        coordinate_entities,
                        coordinate_status,
                    ) = _target_suppression(
                        self.hass,
                        room,
                        source,
                        profile,
                        now=now,
                        coordinate_freshness_seconds=max(
                            1.0,
                            min(
                                15.0,
                                float(aggregation["tracking"]["observation_freshness_ms"])
                                / 1000,
                            ),
                        ),
                    )
                    tracked.update(coordinate_entities)
                entities = list(dict.fromkeys(entities))
                tracked.update(entities)
                entity_statuses: list[str] = []
                ages: list[float] = []
                for entity_id in entities:
                    state = self.hass.states.get(entity_id)
                    status, age = (
                        _target_count_state_status(state, now)
                        if entity_id == count_entity
                        else _presence_state_status(state, now, freshness)
                    )
                    if status == "positive" and (
                        entity_id in suppressed_entities
                        or (
                            suppress_aggregate_presence
                            and entity_id in {primary_presence_entity, count_entity}
                        )
                    ):
                        status = "negative"
                    if age is not None:
                        ages.append(age)
                    entity_statuses.append(status)
                profile_targets = tuple(getattr(profile, "targets", ())) if profile else ()
                coordinate_only_contract = bool(profile_targets) and not any(
                    (
                        primary_presence_entity,
                        count_entity,
                        *(
                            getattr(target, "presence_entity_id", None)
                            for target in profile_targets
                        ),
                    )
                )
                if coordinate_status == "positive":
                    entity_statuses.append("positive")
                elif not installation_mode_safe:
                    # Presence/count `off` cannot prove a clear room while a
                    # configurable radar reports the wrong or unknown mode.
                    entity_statuses.append("unknown")
                elif coordinate_only_contract or not entities:
                    # Older coordinate-only radar contracts can also expose a
                    # supplementary PIR. That PIR may confirm presence, but it
                    # cannot prove that missing/stale radar coordinates are a
                    # current clear signal. Keep the room unknown until every
                    # coordinate slot has fresh zero evidence.
                    entity_statuses.append(coordinate_status)
                if "positive" in entity_statuses:
                    signal_status = "positive"
                elif entity_statuses and all(
                    status == "negative" for status in entity_statuses
                ):
                    signal_status = "negative"
                else:
                    signal_status = "unknown"
                if duplicated_across_rooms:
                    # A physical radar cannot prove which of two rooms it is
                    # observing. Existing legacy conflicts therefore fail
                    # closed until the device is unlinked from one room.
                    signal_status = "unknown"
                configured_modules = source.get("radar_modules")
                modules = _radar_modules(profile)
                if not modules and isinstance(configured_modules, list):
                    modules = tuple(
                        str(module).lower()
                        for module in configured_modules
                        if isinstance(module, str) and module
                    )
                configured_capabilities = source.get("capabilities")
                if not isinstance(configured_capabilities, dict):
                    configured_capabilities = {}
                signal = SourceSignal(
                    source_id=source_id,
                    device_id=resolved_device_id,
                    status=signal_status,
                    entity_ids=tuple(entities),
                    age_seconds=min(ages) if ages else None,
                    radar_modules=modules,
                )
                # A Room Designer placeholder without a linked device is not a
                # sensor and must not keep an otherwise clear room unknown. A
                # saved device link that no longer resolves is different: the
                # physical source is missing and must remain unknown/degraded
                # rather than letting the remaining sensors produce a false
                # clear state.
                if use_for_presence and (entities or device_id):
                    signals.append(signal)
                climate_entities = _resolve_climate_entities(self.hass, resolved_device_id)
                tracked.update(climate_entities.values())
                source_climate: dict[str, dict[str, Any]] = {}
                for metric, entity_id in climate_entities.items():
                    state = self.hass.states.get(entity_id)
                    age = _state_report_age(state, now)
                    report_fresh = (
                        not duplicated_across_rooms
                        and _climate_report_is_fresh(state, now, freshness)
                    )
                    value = _normalise_climate_value(metric, state)
                    source_climate[metric] = {
                        "entity_id": entity_id,
                        "value": value if report_fresh else None,
                        "age_seconds": round(age, 1) if age is not None else None,
                        "fresh": report_fresh and value is not None,
                    }
                source_details.append(
                    {
                        "source_id": source_id,
                        "device_id": resolved_device_id,
                        "name": profile.name if profile else str(device_id or source_id),
                        "status": signal_status,
                        "age_seconds": round(signal.age_seconds, 1) if signal.age_seconds is not None else None,
                        "presence_entities": entities,
                        "geometry_suppressed": suppress_aggregate_presence,
                        "radar_modules": list(modules),
                        "positioning": bool(
                            profile.profile.positioning_available
                            if profile
                            else configured_capabilities.get("positioning") is True
                        ),
                        "coordinate_frame": (
                            profile.profile.coordinate_frame
                            if profile
                            else configured_capabilities.get("coordinate_frame")
                        ),
                        "configured_at": source.get("configured_at"),
                        "climate": source_climate,
                    }
                )

            previous = durable_runtime.get(room_id, {})
            presence = evaluate_room_presence(
                signals,
                previous,
                now=now,
                vacancy_delay_seconds=delay,
            )
            next_durable[room_id] = {
                "occupied": presence["occupied"],
                "pending_clear_since": presence["pending_clear_since"],
                "last_known_occupied": presence["last_known_occupied"],
            }

            climate_result: dict[str, dict[str, Any]] = {}
            for metric in CLIMATE_METRICS:
                setting = aggregation["climate"][metric]
                strategy = setting.get("strategy", "average")
                configured_primary = setting.get("primary_source_id")
                primary = runtime_source_id_remap.get(
                    str(configured_primary), configured_primary
                )
                candidates = [
                    (detail["source_id"], detail["climate"].get(metric))
                    for detail in source_details
                    if detail["climate"].get(metric) is not None
                ]
                fresh_candidates = [
                    (source_id, sample)
                    for source_id, sample in candidates
                    if sample.get("fresh")
                ]
                selected = fresh_candidates
                if strategy == "primary":
                    selected = [item for item in fresh_candidates if item[0] == primary]
                elif strategy == "separate":
                    selected = []
                values = [float(sample["value"]) for _, sample in selected]
                value = round(sum(values) / len(values), 2) if values else None
                climate_result[metric] = {
                    "value": value,
                    "available": value is not None,
                    "strategy": strategy,
                    "primary_source_id": primary,
                    "source_ids": [source_id for source_id, _ in selected],
                    "capable_sources": len(candidates),
                    "fresh_sources": len(fresh_candidates),
                    "degraded": bool(candidates) and len(fresh_candidates) < len(candidates),
                }

            rooms[room_id] = {
                "room_id": room_id,
                "room_name": room.get("name", "Room"),
                "schema_version": room.get("schema_version"),
                "presence": presence,
                "climate": climate_result,
                "sources": source_details,
                "freshness_seconds": freshness,
                "vacancy_delay_seconds": delay,
                "tracking": aggregation["tracking"],
                "updated_at": datetime.now(UTC).isoformat(),
            }

        self._refresh_listener(tracked)
        if next_durable != durable_runtime:
            await self.store.async_set_room_runtime(next_durable)
        return rooms


async def async_setup_room_runtime(hass: HomeAssistant, store: Any) -> RoomRuntimeCoordinator:
    """Create the integration-wide room coordinator once."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    existing = domain_data.get(ROOM_RUNTIME_COORDINATOR)
    if isinstance(existing, RoomRuntimeCoordinator):
        return existing
    coordinator = RoomRuntimeCoordinator(hass, store)
    domain_data[ROOM_RUNTIME_COORDINATOR] = coordinator
    await coordinator.async_setup()
    return coordinator
