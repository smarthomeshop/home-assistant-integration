"""Registry-driven SPS30 Quiet Hours capability tests."""

from types import SimpleNamespace

import pytest

from custom_components.smarthomeshop import websocket_api


def _entity(
    key: str,
    *,
    device_id: str = "device-quiet",
    prefix: str = "user_chosen_prefix",
    platform: str = "esphome",
    original_name: str | None = None,
):
    specifications = {
        "enabled": ("switch", "sps30_quiet_hours_enabled", "SPS30 Quiet Hours"),
        "start_hour": ("number", "sps30_quiet_start_hour", "SPS30 Quiet Start Hour"),
        "end_hour": ("number", "sps30_quiet_end_hour", "SPS30 Quiet End Hour"),
        "active": (
            "binary_sensor",
            "sps30_quiet_hours_active_sensor",
            "SPS30 Quiet Hours Active",
        ),
        "pm_sensor": ("switch", "pm_sensor_switch", "PM Sensor"),
        "idle_interval": ("number", "sps30_idle_interval", "SPS30 Idle Interval"),
    }
    domain, object_id, firmware_name = specifications[key]
    return SimpleNamespace(
        entity_id=f"{domain}.{prefix}_{key}",
        unique_id=f"02:00:00:ab:cd:ef-{prefix}-{object_id}",
        original_name=firmware_name if original_name is None else original_name,
        name="A user can rename this",
        domain=domain,
        platform=platform,
        device_id=device_id,
    )


def _resolve(monkeypatch, entries, device_id="device-quiet"):
    monkeypatch.setattr(
        websocket_api.er,
        "async_entries_for_device",
        lambda _registry, requested_device_id: list(entries)
        if requested_device_id == device_id
        else [],
    )
    return websocket_api.resolve_sps30_quiet_hours_entities(object(), device_id)


@pytest.mark.parametrize(
    ("generation", "prefix"),
    [
        ("UltimateSensor V1 Complete LD2450", "bedroom_v1_ld2450"),
        ("UltimateSensor V2 Complete LD2460", "office_v2_ld2460"),
        ("UltimateSensor Mini V1 Complete LD2450", "hall_mini_v1"),
        ("UltimateSensor Mini V2 Complete LD2460", "attic_mini_v2"),
    ],
)
def test_complete_capability_supports_all_generations_and_arbitrary_prefixes(
    monkeypatch, generation, prefix
) -> None:
    del generation  # The entity contract, not a hardcoded model name, is decisive.
    entries = [_entity(key, prefix=prefix) for key in (
        "enabled", "start_hour", "end_hour", "active", "pm_sensor", "idle_interval"
    )]

    result = _resolve(monkeypatch, entries)

    assert result["status"] == "complete"
    assert result["missing"] == []
    assert result["entities"] == {
        "enabled": f"switch.{prefix}_enabled",
        "start_hour": f"number.{prefix}_start_hour",
        "end_hour": f"number.{prefix}_end_hour",
        "active": f"binary_sensor.{prefix}_active",
        "pm_sensor": f"switch.{prefix}_pm_sensor",
        "idle_interval": f"number.{prefix}_idle_interval",
    }


def test_original_name_is_used_when_unique_id_does_not_expose_object_id(
    monkeypatch,
) -> None:
    entries = [_entity(key) for key in (
        "enabled", "start_hour", "end_hour", "active", "idle_interval"
    )]
    for index, entry in enumerate(entries):
        entry.unique_id = f"opaque-{index}"

    assert _resolve(monkeypatch, entries)["status"] == "complete"


def test_missing_idle_interval_keeps_core_quiet_hours_available(monkeypatch) -> None:
    entries = [_entity(key) for key in (
        "enabled", "start_hour", "end_hour", "active", "pm_sensor"
    )]

    result = _resolve(monkeypatch, entries)

    assert result["status"] == "complete"
    assert "idle_interval" not in result["entities"]


@pytest.mark.parametrize(
    ("entries", "expected_status", "expected_missing"),
    [
        ([], "unsupported", ["active", "enabled", "end_hour", "start_hour"]),
        (
            [_entity("pm_sensor")],
            "partial",
            ["active", "enabled", "end_hour", "start_hour"],
        ),
        (
            [_entity(key) for key in ("enabled", "start_hour", "end_hour")],
            "partial",
            ["active"],
        ),
    ],
)
def test_missing_and_partial_entity_sets(
    monkeypatch, entries, expected_status, expected_missing
) -> None:
    result = _resolve(monkeypatch, entries)
    assert result["status"] == expected_status
    assert result["missing"] == expected_missing


def test_basic_device_without_sps30_entities_is_not_supported(monkeypatch) -> None:
    unrelated = SimpleNamespace(
        entity_id="sensor.ultimate_basic_temperature",
        unique_id="basic-temperature",
        original_name="Temperature",
        name="Temperature",
        domain="sensor",
        platform="esphome",
        device_id="device-quiet",
    )

    assert _resolve(monkeypatch, [unrelated])["status"] == "unsupported"


def test_non_esphome_and_other_device_entities_are_ignored(monkeypatch) -> None:
    entries = [_entity("enabled", platform="template")]
    entries += [
        _entity(key, device_id="another-device")
        for key in ("enabled", "start_hour", "end_hour", "active")
    ]

    assert _resolve(monkeypatch, entries)["status"] == "unsupported"
