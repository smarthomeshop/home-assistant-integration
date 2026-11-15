"""P1 safety helpers preserve overloads and raw-source freshness."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from custom_components.smarthomeshop.products.base.p1 import coordinator as p1_coordinator
from custom_components.smarthomeshop.products.base.p1.coordinator import (
    PHASE_DETECTION_SECONDS,
    EnergyTracker,
)


class _States:
    def __init__(self, values):
        self._values = values

    def get(self, entity_id):
        return self._values.get(entity_id)


def _state(value: float, *, age_seconds: float = 0) -> SimpleNamespace:
    reported = datetime.now(UTC) - timedelta(seconds=age_seconds)
    return SimpleNamespace(
        state=str(value),
        attributes={"unit_of_measurement": "A"},
        last_updated=reported,
        last_reported=reported,
    )


def _unknown(*, age_seconds: float = 0) -> SimpleNamespace:
    reported = datetime.now(UTC) - timedelta(seconds=age_seconds)
    return SimpleNamespace(
        state="unknown",
        attributes={"unit_of_measurement": "A"},
        last_updated=reported,
        last_reported=reported,
    )


def _tracker(
    states: dict[str, SimpleNamespace],
    *,
    phases: str = "auto",
    disabled: tuple[str, ...] = (),
) -> EnergyTracker:
    sources = {
        "power_consumed": "sensor.raw_import",
        "power_produced": "sensor.raw_export",
        "current_phase_1": "sensor.raw_l1",
        "current_phase_2": "sensor.raw_l2",
        "current_phase_3": "sensor.raw_l3",
    }
    tracker = EnergyTracker(
        SimpleNamespace(states=_States(states), data={}),
        SimpleNamespace(options={"main_connection_phases": phases}),
        "sensor.p1",
        "p1",
        sources,
    )
    tracker._meter_value = lambda _suffix: None
    tracker._cost_for_cycle = lambda *_args: None
    tracker._cycle_reset = lambda _cycle: None
    tracker._entity_disabled = lambda entity_id: entity_id in disabled
    return tracker


def _three_phase_states(l2=None) -> dict[str, SimpleNamespace]:
    return {
        "sensor.raw_import": _state(1_000),
        "sensor.raw_export": _state(0),
        "sensor.raw_l1": _state(10),
        "sensor.raw_l2": l2 if l2 is not None else _state(12),
        "sensor.raw_l3": _state(8),
    }


def _end_detection_window(tracker: EnergyTracker) -> None:
    tracker._phase_detection_started -= PHASE_DETECTION_SECONDS + 1


def test_overloaded_phase_publishes_negative_headroom() -> None:
    tracker = _tracker(
        {
            "sensor.raw_import": _state(1_000),
            "sensor.raw_export": _state(0),
            "sensor.raw_l1": _state(40),
            "sensor.raw_l2": _state(10),
            "sensor.raw_l3": _state(10),
        }
    )

    data = tracker.update()

    # The user-facing value keeps the 1.16.0 floor of 0 W; the guards get
    # the signed overload through a separate field.
    assert data.available_grid_w == 0
    assert data.signed_available_grid_w is not None
    assert data.signed_available_grid_w < 0
    assert data.phase_source_fresh is True


def test_stale_raw_phase_marks_fresh_helper_unsafe() -> None:
    tracker = _tracker(
        {
            "sensor.raw_import": _state(1_000),
            "sensor.raw_export": _state(0),
            "sensor.raw_l1": _state(10),
            "sensor.raw_l2": _state(10, age_seconds=180),
            "sensor.raw_l3": _state(10),
        }
    )

    data = tracker.update()

    assert data.phase_source_fresh is False
    assert data.phase_source_age_seconds is not None
    assert data.phase_source_age_seconds >= 180


def test_auto_topology_waits_for_every_registered_physical_phase() -> None:
    tracker = _tracker(
        {
            "sensor.raw_import": _state(1_000),
            "sensor.raw_export": _state(0),
            "sensor.raw_l1": _state(10),
        }
    )

    data = tracker.update()

    assert data.phase_count == 3
    assert data.observed_phase_count == 1
    assert data.available_grid_w is None
    assert data.phase_source_fresh is False


def test_explicit_single_phase_topology_accepts_one_reporting_phase() -> None:
    tracker = _tracker(
        {
            "sensor.raw_import": _state(1_000),
            "sensor.raw_export": _state(0),
            "sensor.raw_l1": _state(10),
        },
        phases="1",
    )

    data = tracker.update()

    assert data.phase_count == 1
    assert data.observed_phase_count == 1
    assert data.available_grid_w is not None
    assert data.phase_source_fresh is True


def test_unavailable_mapped_export_source_invalidates_net_power() -> None:
    tracker = _tracker(
        {
            "sensor.raw_import": _state(1_000),
            "sensor.raw_l1": _state(10),
            "sensor.raw_l2": _state(10),
            "sensor.raw_l3": _state(10),
        }
    )

    data = tracker.update()

    assert data.net_power_w == 1_000
    assert data.net_source_fresh is False


def test_tracker_without_mapping_reports_only_observed_phase_count() -> None:
    tracker = EnergyTracker(
        SimpleNamespace(
            states=_States(
                {
                    "sensor.p1_power_consumed": _state(1_000),
                    "sensor.p1_power_produced": _state(0),
                    "sensor.p1_current_phase_1": _state(10),
                }
            ),
            data={},
        ),
        SimpleNamespace(options={}),
        "sensor.p1",
        "p1",
    )
    tracker._meter_value = lambda _suffix: None
    tracker._cost_for_cycle = lambda *_args: None
    tracker._cycle_reset = lambda _cycle: None

    data = tracker.update()

    assert data.phase_count == 1
    assert data.phase_source_fresh is True


def test_single_phase_home_ignores_registry_disabled_phase_entities(
    monkeypatch,
) -> None:
    """Disabled L2/L3 entities can never report and must not block the guard."""
    tracker = _tracker(
        {
            "sensor.raw_import": _state(1_000),
            "sensor.raw_export": _state(0),
            "sensor.raw_l1": _state(10),
        }
    )
    registry = SimpleNamespace(
        async_get=lambda entity_id: SimpleNamespace(
            disabled_by="integration"
            if entity_id in {"sensor.raw_l2", "sensor.raw_l3"}
            else None
        )
    )
    monkeypatch.setattr(p1_coordinator.er, "async_get", lambda _hass: registry)
    del tracker._entity_disabled

    data = tracker.update()

    assert data.phase_count == 1
    assert data.available_grid_w == 15 * 230
    assert data.phase_source_fresh is True


def test_single_phase_home_with_silent_enabled_phases_settles_on_one_phase() -> None:
    tracker = _tracker(
        {
            "sensor.raw_import": _state(1_000),
            "sensor.raw_export": _state(0),
            "sensor.raw_l1": _state(10),
            "sensor.raw_l2": _unknown(),
            "sensor.raw_l3": _unknown(),
        }
    )

    first = tracker.update()
    # Right after start a silent phase may still be on its way: fail safe.
    assert first.phase_count == 3
    assert first.phase_source_fresh is False
    assert first.available_grid_w is None

    _end_detection_window(tracker)
    settled = tracker.update()

    assert settled.phase_count == 1
    assert settled.observed_phase_count == 1
    assert settled.available_grid_w == 15 * 230
    assert settled.phase_source_fresh is True


def test_genuine_three_phase_meter_is_detected_in_auto_mode() -> None:
    tracker = _tracker(_three_phase_states())

    data = tracker.update()
    _end_detection_window(tracker)
    later = tracker.update()

    assert data.phase_count == 3
    assert data.phase_source_fresh is True
    assert later.phase_count == 3
    assert later.available_grid_w == round((25 - 12) * 230)


def test_brief_phase_outage_on_three_phase_meter_never_downgrades() -> None:
    states = _three_phase_states()
    tracker = _tracker(states)
    tracker.update()
    _end_detection_window(tracker)

    # L2 carries the highest load and briefly drops out well after start.
    states["sensor.raw_l2"] = SimpleNamespace(
        state="unavailable",
        attributes={},
        last_updated=datetime.now(UTC),
        last_reported=datetime.now(UTC),
    )
    states["sensor.raw_l1"] = _state(2)
    data = tracker.update()

    assert data.phase_count == 3
    assert data.observed_phase_count == 2
    assert data.phase_source_fresh is False
    # Headroom from L1/L3 alone would be inflated; the last value is held.
    assert data.available_grid_w == round((25 - 12) * 230)

    tracker._phase_detection_started -= 3600
    still = tracker.update()
    assert still.phase_count == 3
    assert still.phase_source_fresh is False


def test_available_grid_power_sensor_never_reports_below_zero() -> None:
    from custom_components.smarthomeshop.products.base.p1 import P1_SENSORS

    description = next(
        item for item in P1_SENSORS if item.key == "available_grid_power"
    )
    tracker = _tracker(
        {
            "sensor.raw_import": _state(1_000),
            "sensor.raw_export": _state(0),
            "sensor.raw_l1": _state(40),
            "sensor.raw_l2": _state(10),
            "sensor.raw_l3": _state(10),
        }
    )

    data = tracker.update()

    assert description.value_fn(data) == 0
    assert description.attr_fn(data)["signed_headroom_w"] == round((25 - 40) * 230)
