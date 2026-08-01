"""Universal radar-profile discovery for Room Designer.

Firmware exposes mounting and radar metadata as diagnostic ESPHome entities.
This module turns that public contract into one normalized profile and keeps a
small, explicit legacy fallback for devices that have not been updated yet.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
import math
import re
from typing import Any, Iterable, Mapping

from .const import (
    PRODUCT_CEILSENSE,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
    product_for_device,
)

UNAVAILABLE_STATES = {"", "none", "null", "nan", "unknown", "unavailable"}
POSITIONING_RADARS = {"ld2450", "ld2460", "ld6002b"}
RADAR_PRODUCTS = {
    PRODUCT_CEILSENSE,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
}


@dataclass(frozen=True, slots=True)
class RadarEntitySnapshot:
    """Registry identity plus the current state of one ESPHome entity."""

    entity_id: str
    original_name: str | None
    platform: str
    state: str | None
    attributes: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class RadarTargetEntities:
    """Entity IDs belonging to one positioning target."""

    index: int
    x_entity_id: str
    y_entity_id: str
    z_entity_id: str | None = None
    presence_entity_id: str | None = None


@dataclass(frozen=True, slots=True)
class RadarCapabilities:
    """Room Designer features exposed by the radar firmware."""

    coordinate_mode: str
    polygon_zones: bool
    entry_lines: bool
    zone_profiles: bool
    interference_zones: bool
    smoothing: bool
    cross_zone_tracking: bool


@dataclass(frozen=True, slots=True)
class RadarProfile:
    """Normalized mounting and coordinate behavior for one radar device."""

    mounting_mode: str
    coordinate_projection: str
    required_installation_mode: str | None
    mounting_height_mm: float | None
    maximum_range_mm: float | None
    field_of_view_deg: float | None
    radar_model: str
    coordinate_frame: str | None
    coordinate_scale_to_mm: float
    maximum_targets: int
    hardware_mode_capability: str | None
    metadata_source: str
    detected_product: str | None
    supplementary_presence_sensors: tuple[str, ...]
    current_hardware_mode: str | None
    installation_mode_entity_id: str | None
    installation_mode_options: tuple[str, ...]
    missing_metadata_entities: tuple[str, ...]
    invalid_metadata_entities: tuple[str, ...]
    positioning_available: bool


@dataclass(frozen=True, slots=True)
class RadarDeviceProfile:
    """A discovered device, its normalized profile and target entity map."""

    device_id: str
    name: str
    manufacturer: str | None
    model: str | None
    entity_prefix: str
    aliases: tuple[str, ...]
    profile: RadarProfile
    targets: tuple[RadarTargetEntities, ...]
    capabilities: RadarCapabilities

    def as_dict(self) -> dict[str, Any]:
        """Return a WebSocket-safe representation."""
        return asdict(self)


@dataclass(frozen=True, slots=True)
class _MetadataSpec:
    original_name: str
    suffix: str
    kind: str


_METADATA: dict[str, _MetadataSpec] = {
    "mounting_mode": _MetadataSpec("Radar Mounting Mode", "radar_mounting_mode", "mounting"),
    "coordinate_projection": _MetadataSpec("Radar Coordinate Projection", "radar_coordinate_projection", "projection"),
    "required_installation_mode": _MetadataSpec("Radar Required Installation Mode", "radar_required_installation_mode", "required_mode"),
    "mounting_height_mm": _MetadataSpec("Radar Default Mounting Height", "radar_default_mounting_height", "positive_float"),
    "maximum_range_mm": _MetadataSpec("Radar Default Range", "radar_default_range", "positive_float"),
    "field_of_view_deg": _MetadataSpec("Radar Default Field Of View", "radar_default_field_of_view", "fov"),
    "radar_model": _MetadataSpec("Radar Model", "radar_model", "model"),
    "coordinate_frame": _MetadataSpec("Radar Coordinate Frame", "radar_coordinate_frame", "coordinate_frame"),
    "hardware_mode_capability": _MetadataSpec("Radar Hardware Mounting Modes", "radar_hardware_mounting_modes", "capability"),
    "coordinate_scale_to_mm": _MetadataSpec("Radar Coordinate Scale To Millimetres", "radar_coordinate_scale_to_millimetres", "positive_float"),
    "maximum_targets": _MetadataSpec("Radar Maximum Targets", "radar_maximum_targets", "target_count"),
}

_RADAR_DEFAULTS: dict[str, dict[str, Any]] = {
    "ld2450": {
        "coordinate_frame": "x_lateral_y_forward",
        "coordinate_scale_to_mm": 1.0,
        "maximum_targets": 3,
        "hardware_mode_capability": "fixed",
    },
    "ld2460": {
        "coordinate_frame": "x_lateral_y_forward",
        "coordinate_scale_to_mm": 1000.0,
        "maximum_targets": 5,
        "hardware_mode_capability": "top_or_side",
    },
    "ld6002b": {
        "coordinate_frame": "x_y_z",
        "coordinate_scale_to_mm": 1000.0,
        "maximum_targets": 3,
        "hardware_mode_capability": "top_or_side",
    },
    "ld2412": {
        "coordinate_frame": None,
        "coordinate_scale_to_mm": 1.0,
        "maximum_targets": 0,
        "hardware_mode_capability": None,
    },
}


def _normalise(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def _entity_body(entity_id: str) -> str:
    return entity_id.split(".", 1)[-1].lower()


def _safe_suffix(entity_id: str, suffix: str) -> bool:
    body = _entity_body(entity_id)
    return body == suffix or body.endswith(f"_{suffix}")


def _valid_state(value: str | None) -> str | None:
    state = (value or "").strip().lower()
    return None if state in UNAVAILABLE_STATES else state


def _parse_metadata_value(kind: str, state: str | None) -> Any | None:
    value = _valid_state(state)
    if value is None:
        return None
    if kind == "mounting":
        return value if value in {"wall", "ceiling"} else None
    if kind == "projection":
        return value if value in {"forward_xy", "floor_xy"} else None
    if kind == "required_mode":
        return value if value in {"side", "top"} else None
    if kind == "capability":
        return value if value in {"fixed", "top_or_side"} else None
    if kind == "model":
        return value if re.fullmatch(r"[a-z0-9][a-z0-9_-]{1,31}", value) else None
    if kind == "coordinate_frame":
        return value if re.fullmatch(r"[a-z][a-z0-9_-]{1,63}", value) else None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number) or number <= 0:
        return None
    if kind == "fov":
        return number if number <= 360 else None
    if kind == "target_count":
        rounded = int(number)
        return rounded if number == rounded and rounded <= 10 else None
    return number


def _find_metadata_entity(
    entities: Iterable[RadarEntitySnapshot], spec: _MetadataSpec
) -> RadarEntitySnapshot | None:
    expected_name = _normalise(spec.original_name)
    ranked: list[tuple[int, str, RadarEntitySnapshot]] = []
    for entity in entities:
        if entity.platform != "esphome":
            continue
        if _normalise(entity.original_name) == expected_name:
            ranked.append((0, entity.entity_id, entity))
        elif _safe_suffix(entity.entity_id, spec.suffix):
            ranked.append((1, entity.entity_id, entity))
    if not ranked:
        return None
    return min(ranked, key=lambda item: (item[0], item[1]))[2]


def _target_axis(entity: RadarEntitySnapshot) -> tuple[int, str] | None:
    if entity.platform != "esphome" or not entity.entity_id.startswith("sensor."):
        return None
    name_match = re.fullmatch(
        r"(?:tracking )?target (\d+) ([xyz])", _normalise(entity.original_name)
    )
    if name_match:
        return int(name_match.group(1)), name_match.group(2)
    id_match = re.search(
        r"_(?:tracking_)?target_?(\d+)_([xyz])$", _entity_body(entity.entity_id)
    )
    if id_match:
        return int(id_match.group(1)), id_match.group(2)
    return None


def _target_presence_index(entity: RadarEntitySnapshot) -> int | None:
    if entity.platform != "esphome" or not entity.entity_id.startswith("binary_sensor."):
        return None
    name_match = re.fullmatch(
        r"(?:tracking )?target (\d+) presence", _normalise(entity.original_name)
    )
    if name_match:
        return int(name_match.group(1))
    id_match = re.search(
        r"_(?:tracking_)?target_?(\d+)_presence$", _entity_body(entity.entity_id)
    )
    return int(id_match.group(1)) if id_match else None


def _discover_targets(
    entities: Iterable[RadarEntitySnapshot], maximum_targets: int
) -> tuple[RadarTargetEntities, ...]:
    axes: dict[int, dict[str, str]] = {}
    presence: dict[int, str] = {}
    for entity in entities:
        axis = _target_axis(entity)
        if axis is not None:
            target, coordinate = axis
            axes.setdefault(target, {})[coordinate] = entity.entity_id
        presence_index = _target_presence_index(entity)
        if presence_index is not None:
            presence[presence_index] = entity.entity_id

    targets = []
    for index in sorted(axes):
        coordinates = axes[index]
        if index > maximum_targets or "x" not in coordinates or "y" not in coordinates:
            continue
        targets.append(
            RadarTargetEntities(
                index=index,
                x_entity_id=coordinates["x"],
                y_entity_id=coordinates["y"],
                z_entity_id=coordinates.get("z"),
                presence_entity_id=presence.get(index),
            )
        )
    return tuple(targets)


def _target_prefix(entity_id: str) -> str:
    body = _entity_body(entity_id)
    match = re.match(r"(.+?)_(?:tracking_)?target_?\d+_[xyz]$", body)
    return match.group(1) if match else body


def _metadata_prefix(
    entities: Iterable[RadarEntitySnapshot], fallback: str
) -> str:
    for spec in _METADATA.values():
        for entity in entities:
            if _safe_suffix(entity.entity_id, spec.suffix):
                body = _entity_body(entity.entity_id)
                return body[: -(len(spec.suffix) + 1)]
    return fallback


def _identity(
    name: str,
    manufacturer: str | None,
    model: str | None,
    entities: Iterable[RadarEntitySnapshot],
) -> str:
    parts = [name, manufacturer or "", model or ""]
    for entity in entities:
        parts.extend((entity.entity_id, entity.original_name or ""))
    return _normalise(" ".join(parts))


def _legacy_product(identity: str, manufacturer: str | None, model: str | None) -> str | None:
    detected = product_for_device(manufacturer, model)
    if detected:
        return detected
    if "ceilsense" in identity or "ceil sense" in identity:
        return PRODUCT_CEILSENSE
    if "ultimatesensor mini" in identity or "ultimate sensor mini" in identity:
        return PRODUCT_ULTIMATESENSOR_MINI
    if "ultimatesensor" in identity or "ultimate sensor" in identity:
        return PRODUCT_ULTIMATESENSOR
    return None


def _legacy_model(identity: str, product: str | None, target_pairs: int) -> str:
    if "ld6002b" in identity:
        return "ld6002b"
    if "ld2460" in identity:
        return "ld2460"
    if product == PRODUCT_CEILSENSE and "ld2412" in identity and target_pairs == 0:
        return "ld2412"
    if "ld2450" in identity:
        return "ld2450"
    if target_pairs > 3:
        return "ld2460"
    if target_pairs > 0:
        return "ld2450"
    if product == PRODUCT_CEILSENSE:
        return "ld2412"
    return "unknown"


def _supplementary_presence_sensors(
    entities: Iterable[RadarEntitySnapshot], primary_model: str
) -> tuple[str, ...]:
    found: list[str] = []
    for entity in entities:
        if entity.platform != "esphome" or not entity.entity_id.startswith("binary_sensor."):
            continue
        identity = _normalise(f"{entity.original_name or ''} {entity.entity_id}")
        is_ld2412 = "ld2412" in identity and any(
            marker in identity for marker in ("presence", "moving target", "still target")
        )
        is_pir = "pir" in identity and any(
            marker in identity for marker in ("presence", "motion", "occupancy")
        )
        if (is_ld2412 and primary_model != "ld2412") or is_pir:
            found.append(entity.entity_id)
    return tuple(sorted(set(found)))


def _installation_mode(
    entities: Iterable[RadarEntitySnapshot],
) -> tuple[str | None, str | None, tuple[str, ...]]:
    candidates: list[tuple[int, str, RadarEntitySnapshot]] = []
    for entity in entities:
        if entity.platform != "esphome" or not entity.entity_id.startswith("select."):
            continue
        original = _normalise(entity.original_name)
        body = _entity_body(entity.entity_id)
        if original in {"radar installation mode", "tracking installation mode", "installation mode"}:
            candidates.append((0, entity.entity_id, entity))
        elif any(
            _safe_suffix(entity.entity_id, suffix)
            for suffix in (
                "radar_installation_mode",
                "tracking_installation_mode",
                "ld2460_installation_mode",
                "ld6002b_installation_mode",
                "installation_mode",
            )
        ) and "required_installation_mode" not in body:
            candidates.append((1, entity.entity_id, entity))
    if not candidates:
        return None, None, ()
    entity = min(candidates, key=lambda item: (item[0], item[1]))[2]
    state = _valid_state(entity.state)
    current = state if state in {"top", "side"} else None
    raw_options = entity.attributes.get("options", ())
    options = tuple(
        str(option) for option in raw_options
        if str(option).strip().lower() in {"top", "side"}
    ) if isinstance(raw_options, (list, tuple)) else ()
    return current, entity.entity_id, options


def _has_entity(
    entities: Iterable[RadarEntitySnapshot], suffixes: tuple[str, ...], names: tuple[str, ...] = ()
) -> bool:
    normal_names = {_normalise(name) for name in names}
    return any(
        entity.platform == "esphome"
        and (
            _normalise(entity.original_name) in normal_names
            or any(_safe_suffix(entity.entity_id, suffix) for suffix in suffixes)
        )
        for entity in entities
    )


def _capabilities(entities: tuple[RadarEntitySnapshot, ...], targets: tuple[RadarTargetEntities, ...]) -> RadarCapabilities:
    coordinate_mode = "tracking-target" if any(
        "tracking_target" in target.x_entity_id for target in targets
    ) else "target" if targets else "unknown"
    return RadarCapabilities(
        coordinate_mode=coordinate_mode,
        polygon_zones=_has_entity(entities, ("polygon_zone_1",), ("Polygon Zone 1",)),
        entry_lines=_has_entity(entities, ("entry_line_1",), ("Entry Line 1",)),
        zone_profiles=_has_entity(entities, ("zone_profile_1",), ("Zone Profile 1",)),
        interference_zones=_has_entity(entities, ("interference_zone_1",), ("Interference Zone 1",)),
        smoothing=_has_entity(entities, ("target_smoothing_enabled", "target_smoothing")),
        cross_zone_tracking=_has_entity(entities, ("cross_zone_tracking",)),
    )


def resolve_radar_device_profile(
    *,
    device_id: str,
    name: str,
    manufacturer: str | None,
    model: str | None,
    entities: Iterable[RadarEntitySnapshot],
) -> RadarDeviceProfile:
    """Resolve one device using firmware metadata first and legacy rules second."""
    snapshots = tuple(entities)
    identity = _identity(name, manufacturer, model, snapshots)
    product = _legacy_product(identity, manufacturer, model)

    raw_target_axes = {
        axis for entity in snapshots if (axis := _target_axis(entity)) is not None
    }
    target_pair_count = sum(
        1 for index in {item[0] for item in raw_target_axes}
        if (index, "x") in raw_target_axes and (index, "y") in raw_target_axes
    )
    legacy_model = _legacy_model(identity, product, target_pair_count)
    legacy_mounting = "ceiling" if product == PRODUCT_CEILSENSE else "wall"

    values: dict[str, Any] = {}
    missing: list[str] = []
    invalid: list[str] = []
    valid_metadata = 0
    for field_name, spec in _METADATA.items():
        entity = _find_metadata_entity(snapshots, spec)
        if entity is None:
            missing.append(spec.original_name)
            continue
        parsed = _parse_metadata_value(spec.kind, entity.state)
        if parsed is None:
            invalid.append(spec.original_name)
            continue
        values[field_name] = parsed
        valid_metadata += 1

    radar_model = str(values.get("radar_model") or legacy_model)
    defaults = _RADAR_DEFAULTS.get(radar_model, {})
    mounting_mode = str(values.get("mounting_mode") or legacy_mounting)
    coordinate_projection = str(
        values.get("coordinate_projection")
        or ("floor_xy" if mounting_mode == "ceiling" else "forward_xy")
    )
    required_mode = values.get("required_installation_mode")
    if required_mode is None and radar_model in POSITIONING_RADARS:
        required_mode = "top" if mounting_mode == "ceiling" else "side"

    maximum_targets = int(values.get("maximum_targets") or defaults.get("maximum_targets", target_pair_count))
    targets = _discover_targets(snapshots, maximum_targets)
    current_mode, mode_entity, mode_options = _installation_mode(snapshots)
    supplementary = _supplementary_presence_sensors(snapshots, radar_model)

    if targets:
        prefix = _target_prefix(targets[0].x_entity_id)
    else:
        fallback_prefix = _normalise(name).replace(" ", "_") or device_id
        prefix = _metadata_prefix(snapshots, fallback_prefix)

    aliases = tuple(sorted({device_id, prefix}))
    profile = RadarProfile(
        mounting_mode=mounting_mode,
        coordinate_projection=coordinate_projection,
        required_installation_mode=str(required_mode) if required_mode else None,
        mounting_height_mm=float(values.get("mounting_height_mm") or (2500 if mounting_mode == "ceiling" else 1500)),
        maximum_range_mm=float(values.get("maximum_range_mm") or 6000),
        field_of_view_deg=float(values.get("field_of_view_deg") or 120),
        radar_model=radar_model,
        coordinate_frame=values.get("coordinate_frame", defaults.get("coordinate_frame")),
        coordinate_scale_to_mm=float(values.get("coordinate_scale_to_mm") or defaults.get("coordinate_scale_to_mm", 1)),
        maximum_targets=maximum_targets,
        hardware_mode_capability=values.get("hardware_mode_capability", defaults.get("hardware_mode_capability")),
        metadata_source="firmware" if valid_metadata else "legacy_fallback",
        detected_product=product,
        supplementary_presence_sensors=supplementary,
        current_hardware_mode=current_mode,
        installation_mode_entity_id=mode_entity,
        installation_mode_options=mode_options,
        missing_metadata_entities=tuple(missing),
        invalid_metadata_entities=tuple(invalid),
        positioning_available=radar_model in POSITIONING_RADARS and bool(targets),
    )
    return RadarDeviceProfile(
        device_id=device_id,
        name=name,
        manufacturer=manufacturer,
        model=model,
        entity_prefix=prefix,
        aliases=aliases,
        profile=profile,
        targets=targets,
        capabilities=_capabilities(snapshots, targets),
    )


def _snapshots_for_device(hass: Any, device_id: str) -> tuple[RadarEntitySnapshot, ...]:
    """Build stable snapshots from Home Assistant's entity registry."""
    from homeassistant.helpers import entity_registry as er

    registry = er.async_get(hass)
    snapshots = []
    for entry in er.async_entries_for_device(
        registry, device_id, include_disabled_entities=True
    ):
        state = hass.states.get(entry.entity_id)
        snapshots.append(
            RadarEntitySnapshot(
                entity_id=entry.entity_id,
                original_name=entry.original_name,
                platform=entry.platform,
                state=state.state if state is not None else None,
                attributes=dict(state.attributes) if state is not None else {},
            )
        )
    return tuple(snapshots)


def discover_radar_device_profiles(hass: Any) -> list[RadarDeviceProfile]:
    """Discover SmartHomeShop radar devices through their registry association."""
    from homeassistant.helpers import device_registry as dr

    devices = dr.async_get(hass)
    discovered: list[RadarDeviceProfile] = []
    metadata_suffixes = tuple(spec.suffix for spec in _METADATA.values())

    for device in devices.devices.values():
        snapshots = _snapshots_for_device(hass, device.id)
        if not snapshots:
            continue
        known_product = product_for_device(device.manufacturer, device.model)
        identity = _identity(
            device.name_by_user or device.name or "",
            device.manufacturer,
            device.model,
            snapshots,
        )
        has_metadata = any(
            entity.platform == "esphome"
            and any(_safe_suffix(entity.entity_id, suffix) for suffix in metadata_suffixes)
            for entity in snapshots
        )
        has_known_identity = any(
            marker in identity
            for marker in ("ceilsense", "ceil sense", "ultimatesensor", "ultimate sensor")
        )
        if not known_product and not has_metadata and not has_known_identity:
            continue

        resolved = resolve_radar_device_profile(
            device_id=device.id,
            name=device.name_by_user or device.name or "Radar device",
            manufacturer=device.manufacturer,
            model=device.model,
            entities=snapshots,
        )
        # Presence-only CeilSense devices remain useful diagnostics, but the
        # frontend marks them unavailable for placement instead of inventing
        # coordinates. Other known products without tracking are omitted.
        if (
            resolved.profile.positioning_available
            or resolved.profile.metadata_source == "firmware"
            or resolved.profile.detected_product == PRODUCT_CEILSENSE
        ):
            discovered.append(resolved)

    return sorted(discovered, key=lambda item: item.name.lower())


def radar_profile_for_device(hass: Any, device_id: str) -> RadarDeviceProfile | None:
    """Resolve one registry device for diagnostics."""
    from homeassistant.helpers import device_registry as dr

    device = dr.async_get(hass).async_get(device_id)
    if device is None:
        return None
    resolved = resolve_radar_device_profile(
        device_id=device.id,
        name=device.name_by_user or device.name or "Radar device",
        manufacturer=device.manufacturer,
        model=device.model,
        entities=_snapshots_for_device(hass, device.id),
    )
    if (
        not resolved.profile.positioning_available
        and resolved.profile.metadata_source != "firmware"
        and resolved.profile.detected_product not in RADAR_PRODUCTS
    ):
        return None
    return resolved
