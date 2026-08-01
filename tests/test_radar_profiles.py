"""Fixtures for universal radar mounting and coordinate discovery."""

from custom_components.smarthomeshop.radar_profiles import (
    RadarEntitySnapshot,
    resolve_radar_device_profile,
)


def _entity(
    entity_id: str,
    name: str,
    state: str = "0",
    *,
    platform: str = "esphome",
    options: tuple[str, ...] = (),
) -> RadarEntitySnapshot:
    return RadarEntitySnapshot(
        entity_id=entity_id,
        original_name=name,
        platform=platform,
        state=state,
        attributes={"options": list(options)} if options else {},
    )


def _metadata(prefix: str, *, mounting: str, model: str) -> list[RadarEntitySnapshot]:
    ceiling = mounting == "ceiling"
    radar = {
        "ld2450": ("x_lateral_y_forward", "fixed", "1", "3"),
        "ld2460": ("x_lateral_y_forward", "top_or_side", "1000", "5"),
        "ld6002b": ("x_y_z", "top_or_side", "1000", "3"),
    }[model]
    return [
        _entity(f"text_sensor.{prefix}_radar_mounting_mode", "Radar Mounting Mode", mounting),
        _entity(f"text_sensor.{prefix}_radar_coordinate_projection", "Radar Coordinate Projection", "floor_xy" if ceiling else "forward_xy"),
        _entity(f"text_sensor.{prefix}_radar_required_installation_mode", "Radar Required Installation Mode", "top" if ceiling else "side"),
        _entity(f"sensor.{prefix}_radar_default_mounting_height", "Radar Default Mounting Height", "2500" if ceiling else "1500"),
        _entity(f"sensor.{prefix}_radar_default_range", "Radar Default Range", "6000"),
        _entity(f"sensor.{prefix}_radar_default_field_of_view", "Radar Default Field Of View", "120"),
        _entity(f"text_sensor.{prefix}_radar_model", "Radar Model", model),
        _entity(f"text_sensor.{prefix}_radar_coordinate_frame", "Radar Coordinate Frame", radar[0]),
        _entity(f"text_sensor.{prefix}_radar_hardware_mounting_modes", "Radar Hardware Mounting Modes", radar[1]),
        _entity(f"sensor.{prefix}_radar_coordinate_scale_to_millimetres", "Radar Coordinate Scale To Millimetres", radar[2]),
        _entity(f"sensor.{prefix}_radar_maximum_targets", "Radar Maximum Targets", radar[3]),
    ]


def _targets(prefix: str, count: int, *, tracking: bool = False, z: bool = False) -> list[RadarEntitySnapshot]:
    entries: list[RadarEntitySnapshot] = []
    label_prefix = "Tracking " if tracking else ""
    id_prefix = "tracking_" if tracking else ""
    for index in range(1, count + 1):
        entries.extend(
            [
                _entity(f"sensor.{prefix}_{id_prefix}target_{index}_x", f"{label_prefix}Target {index} X"),
                _entity(f"sensor.{prefix}_{id_prefix}target_{index}_y", f"{label_prefix}Target {index} Y"),
            ]
        )
        if z:
            entries.append(_entity(f"sensor.{prefix}_{id_prefix}target_{index}_z", f"{label_prefix}Target {index} Z"))
    return entries


def _resolve(name: str, model: str, entries: list[RadarEntitySnapshot]):
    return resolve_radar_device_profile(
        device_id="device-123",
        name=name,
        manufacturer="smarthomeshop",
        model=model,
        entities=entries,
    )


def test_mini_v1_ld2450_uses_wall_firmware_metadata() -> None:
    entries = _metadata("mini_v1", mounting="wall", model="ld2450") + _targets("mini_v1", 3)
    radar = _resolve("Kitchen Mini", "ultimatesensor_mini_v1", entries)

    assert radar.profile.metadata_source == "firmware"
    assert radar.profile.mounting_mode == "wall"
    assert radar.profile.coordinate_projection == "forward_xy"
    assert radar.profile.radar_model == "ld2450"
    assert radar.profile.coordinate_scale_to_mm == 1
    assert radar.profile.maximum_targets == 3
    assert radar.profile.hardware_mode_capability == "fixed"
    assert radar.profile.missing_metadata_entities == ()
    assert len(radar.targets) == 3


def test_mini_v1_legacy_firmware_falls_back_to_ld2450_wall() -> None:
    radar = _resolve(
        "UltimateSensor Mini V1",
        "ultimatesensor_mini_v1",
        _targets("ultimate_sensor_mini", 3),
    )

    assert radar.profile.metadata_source == "legacy_fallback"
    assert radar.profile.mounting_mode == "wall"
    assert radar.profile.radar_model == "ld2450"
    assert radar.profile.coordinate_scale_to_mm == 1
    assert radar.profile.missing_metadata_entities


def test_mini_v2_ld2412_is_supplementary_to_ld2450() -> None:
    entries = _metadata("mini_v2", mounting="wall", model="ld2450")
    entries += _targets("mini_v2", 3, tracking=True)
    entries.append(_entity("binary_sensor.mini_v2_ld2412_presence", "LD2412 Presence", "on"))
    radar = _resolve("Mini V2", "ultimatesensor_mini_v2", entries)

    assert radar.profile.radar_model == "ld2450"
    assert radar.profile.maximum_targets == 3
    assert radar.profile.supplementary_presence_sensors == (
        "binary_sensor.mini_v2_ld2412_presence",
    )


def test_mini_v2_ld2460_uses_scale_and_hardware_mode() -> None:
    entries = _metadata("mini_v2", mounting="wall", model="ld2460")
    entries += _targets("mini_v2", 5, tracking=True)
    entries += [
        _entity("binary_sensor.mini_v2_ld2412_presence", "LD2412 Presence", "on"),
        _entity(
            "select.mini_v2_tracking_installation_mode",
            "Tracking Installation Mode",
            "top",
            options=("side", "top"),
        ),
    ]
    radar = _resolve("Mini V2 LD2460", "ultimatesensor_mini_v2", entries)

    assert radar.profile.radar_model == "ld2460"
    assert radar.profile.coordinate_scale_to_mm == 1000
    assert radar.profile.maximum_targets == 5
    assert radar.profile.required_installation_mode == "side"
    assert radar.profile.current_hardware_mode == "top"
    assert radar.profile.installation_mode_options == ("side", "top")
    assert len(radar.targets) == 5


def test_ultimate_sensor_v1_is_a_supported_ld2450_product() -> None:
    radar = _resolve(
        "UltimateSensor V1",
        "ultimatesensor_v1",
        _targets("ultimate_sensor", 3),
    )

    assert radar.profile.detected_product == "ultimatesensor"
    assert radar.profile.radar_model == "ld2450"
    assert radar.profile.positioning_available is True


def test_ultimate_sensor_v2_keeps_pir_and_ld2412_supplementary() -> None:
    entries = _metadata("ultimate_v2", mounting="wall", model="ld2460")
    entries += _targets("ultimate_v2", 5, tracking=True)
    entries += [
        _entity("binary_sensor.ultimate_v2_ld2412_presence", "LD2412 Presence", "on"),
        _entity("binary_sensor.ultimate_v2_pir_motion", "PIR Motion", "off"),
    ]
    radar = _resolve("UltimateSensor V2", "ultimatesensor_v2", entries)

    assert radar.profile.radar_model == "ld2460"
    assert radar.profile.maximum_targets == 5
    assert radar.profile.supplementary_presence_sensors == (
        "binary_sensor.ultimate_v2_ld2412_presence",
        "binary_sensor.ultimate_v2_pir_motion",
    )


def test_ceilsense_ld2450_uses_floor_projection() -> None:
    entries = _metadata("ceilsense", mounting="ceiling", model="ld2450") + _targets("ceilsense", 3)
    radar = _resolve("CeilSense", "ceilsense_v1", entries)

    assert radar.profile.mounting_mode == "ceiling"
    assert radar.profile.coordinate_projection == "floor_xy"
    assert radar.profile.required_installation_mode == "top"
    assert radar.profile.positioning_available is True


def test_ceilsense_ld2412_never_invents_positioning_targets() -> None:
    entries = [
        _entity("binary_sensor.ceilsense_ld2412_presence", "LD2412 Presence", "on"),
        _entity("sensor.ceilsense_ld2412_moving_distance", "LD2412 Moving Distance", "1.2"),
    ]
    radar = _resolve("CeilSense LD2412", "ceilsense_v1", entries)

    assert radar.profile.metadata_source == "legacy_fallback"
    assert radar.profile.radar_model == "ld2412"
    assert radar.profile.mounting_mode == "ceiling"
    assert radar.profile.maximum_targets == 0
    assert radar.profile.positioning_available is False
    assert radar.targets == ()


def test_ld6002b_maps_xyz_targets_but_uses_floor_xy_projection() -> None:
    entries = _metadata("ceilsense", mounting="ceiling", model="ld6002b")
    entries += _targets("ceilsense", 3, z=True)
    entries.append(
        _entity(
            "select.ceilsense_ld6002b_installation_mode",
            "Radar Installation Mode",
            "top",
            options=("top", "side"),
        )
    )
    radar = _resolve("CeilSense LD6002B", "ceilsense_v1", entries)

    assert radar.profile.radar_model == "ld6002b"
    assert radar.profile.coordinate_frame == "x_y_z"
    assert radar.profile.coordinate_projection == "floor_xy"
    assert radar.profile.coordinate_scale_to_mm == 1000
    assert all(target.z_entity_id for target in radar.targets)


def test_invalid_metadata_is_reported_and_legacy_defaults_remain_safe() -> None:
    entries = _metadata("mini", mounting="wall", model="ld2450") + _targets("mini", 3)
    entries = [
        _entity(entry.entity_id, entry.original_name or "", "NaN")
        if entry.original_name == "Radar Coordinate Scale To Millimetres"
        else entry
        for entry in entries
    ]
    radar = _resolve("Mini", "ultimatesensor_mini_v1", entries)

    assert radar.profile.coordinate_scale_to_mm == 1
    assert radar.profile.invalid_metadata_entities == (
        "Radar Coordinate Scale To Millimetres",
    )
