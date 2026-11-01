"""Tests for the four flow lines of the WaterFlowKit."""

from __future__ import annotations

import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from custom_components.smarthomeshop.config_flow import SmartHomeShopConfigFlow
from custom_components.smarthomeshop.products.waterflowkit import (
    lines,
    utility_meters,
)
from custom_components.smarthomeshop.products.waterflowkit.coordinator import (
    WaterFlowKitCoordinator,
)
from custom_components.smarthomeshop.products.waterflowkit.lines import (
    add_new_flow_lines,
    find_flow_sensors,
    line_label,
)


def _entity(entity_id: str) -> SimpleNamespace:
    return SimpleNamespace(domain=entity_id.split(".")[0], entity_id=entity_id)


def _registry_with(*entity_ids: str):
    return patch.object(
        lines.er,
        "async_entries_for_device",
        lambda _registry, _device: [_entity(item) for item in entity_ids],
    )


V2_SENSORS = (
    "sensor.waterflowkit_a1b2c3_flow1_total_consumption",
    "sensor.waterflowkit_a1b2c3_flow1_current_water_usage",
    "sensor.waterflowkit_a1b2c3_flow2_total_consumption",
    "sensor.waterflowkit_a1b2c3_flow2_current_water_usage",
    "sensor.waterflowkit_a1b2c3_flow3_total_consumption",
    "sensor.waterflowkit_a1b2c3_flow3_current_water_usage",
    "sensor.waterflowkit_a1b2c3_flow4_total_consumption",
    "sensor.waterflowkit_a1b2c3_flow4_current_water_usage",
    "sensor.waterflowkit_a1b2c3_flow4_water_temperature",
    "number.waterflowkit_a1b2c3_flow4_calibration",
)


class TestFlowLines(unittest.TestCase):
    def setUp(self) -> None:
        patcher = patch.object(lines.er, "async_get", lambda _hass: object())
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_labels_match_the_entity_names(self) -> None:
        self.assertEqual(line_label("flow3"), "Flow 3")

    def test_every_line_of_a_v2_kit_is_found(self) -> None:
        with _registry_with(*V2_SENSORS):
            sensors = find_flow_sensors(object(), "device")

        self.assertEqual(len(sensors), 8)
        self.assertEqual(
            sensors["flow4_water_sensor"],
            "sensor.waterflowkit_a1b2c3_flow4_total_consumption",
        )
        self.assertEqual(
            sensors["flow3_flow_sensor"],
            "sensor.waterflowkit_a1b2c3_flow3_current_water_usage",
        )

    def test_a_v1_kit_keeps_two_lines(self) -> None:
        with _registry_with(*V2_SENSORS[:4]):
            sensors = find_flow_sensors(object(), "device")

        self.assertEqual(
            sorted(sensors),
            [
                "flow1_flow_sensor",
                "flow1_water_sensor",
                "flow2_flow_sensor",
                "flow2_water_sensor",
            ],
        )

    def test_existing_entry_gets_the_missing_lines_once(self) -> None:
        updates = []
        entry = SimpleNamespace(
            data={
                "device_id": "device",
                "flow1_water_sensor": "sensor.custom_flow1_total_consumption",
                "flow2_water_sensor": None,
            }
        )

        def update(_entry, data):
            updates.append(data)
            entry.data = data

        hass = SimpleNamespace(
            config_entries=SimpleNamespace(async_update_entry=update)
        )
        with _registry_with(*V2_SENSORS):
            add_new_flow_lines(hass, entry)
            add_new_flow_lines(hass, entry)

        self.assertEqual(len(updates), 1)
        self.assertEqual(
            entry.data["flow1_water_sensor"],
            "sensor.custom_flow1_total_consumption",
        )
        self.assertEqual(
            entry.data["flow2_water_sensor"],
            "sensor.waterflowkit_a1b2c3_flow2_total_consumption",
        )
        self.assertIn("flow4_flow_sensor", entry.data)

    def test_entry_without_a_device_is_left_alone(self) -> None:
        hass = SimpleNamespace(config_entries=None)

        add_new_flow_lines(hass, SimpleNamespace(data={}))

    def test_coordinator_tracks_the_configured_lines(self) -> None:
        two = SimpleNamespace(data={"flow1_water_sensor": "a"})
        four = SimpleNamespace(
            data={"flow3_water_sensor": "c", "flow4_flow_sensor": "d"}
        )

        self.assertEqual(
            WaterFlowKitCoordinator._configured_lines(two), ("flow1", "flow2")
        )
        self.assertEqual(
            WaterFlowKitCoordinator._configured_lines(four),
            ("flow1", "flow2", "flow3", "flow4"),
        )


class TestUtilityMeters(unittest.TestCase):
    def _entry(self, **data) -> SimpleNamespace:
        return SimpleNamespace(
            entry_id="abcdefgh1234",
            data=data,
            unloads=[],
            async_on_unload=lambda stop: None,
        )

    def test_short_id_uses_any_line(self) -> None:
        self.assertEqual(
            utility_meters._short_id(
                ["sensor.waterflowkit_a1b2c3_flow3_total_consumption"],
                self._entry(),
            ),
            "a1b2c3",
        )

    def test_short_id_falls_back_to_the_entry(self) -> None:
        self.assertEqual(utility_meters._short_id([], self._entry()), "abcdefgh")

    def test_a_line_counts_as_used_after_measuring_water(self) -> None:
        states = {"sensor.used": "12.5", "sensor.empty": "0", "sensor.odd": "unknown"}
        hass = SimpleNamespace(
            states=SimpleNamespace(
                get=lambda entity_id: (
                    SimpleNamespace(state=states[entity_id])
                    if entity_id in states
                    else None
                )
            )
        )

        self.assertTrue(utility_meters._has_counted_water(hass, "sensor.used"))
        self.assertFalse(utility_meters._has_counted_water(hass, "sensor.empty"))
        self.assertFalse(utility_meters._has_counted_water(hass, "sensor.odd"))
        self.assertFalse(utility_meters._has_counted_water(hass, "sensor.gone"))

    def test_base_lines_get_meters_and_new_lines_wait_for_water(self) -> None:
        created = []
        waiting = []

        async def create(_hass, short_id, line, source):
            created.append((short_id, line, source))
            return 4

        entry = self._entry(
            flow1_water_sensor="sensor.waterflowkit_a1b2c3_flow1_total_consumption",
            flow2_water_sensor=None,
            flow3_water_sensor="sensor.waterflowkit_a1b2c3_flow3_total_consumption",
        )
        with (
            patch.object(utility_meters, "_create_line_meters", create),
            patch.object(
                utility_meters,
                "_create_line_meters_once_used",
                lambda _hass, _entry, _id, line, _source: waiting.append(line),
            ),
        ):
            asyncio.run(utility_meters.async_setup_utility_meters(object(), entry))

        self.assertEqual(
            created,
            [
                (
                    "a1b2c3",
                    "flow1",
                    "sensor.waterflowkit_a1b2c3_flow1_total_consumption",
                )
            ],
        )
        self.assertEqual(waiting, ["flow3"])


class TestConfigFlow(unittest.TestCase):
    def _flow(self, sensors: dict) -> SmartHomeShopConfigFlow:
        flow = SmartHomeShopConfigFlow()
        flow._flow_line_sensors = sensors
        return flow

    def test_summary_lists_extra_lines_only_when_the_kit_has_them(self) -> None:
        two = self._flow({"flow1_water_sensor": "sensor.one"})
        four = self._flow(
            {"flow1_water_sensor": "sensor.one", "flow4_water_sensor": "sensor.four"}
        )

        self.assertEqual(
            two._flow_line_summary("water"),
            "Flow1: sensor.one, Flow2: Not found",
        )
        self.assertEqual(
            four._flow_line_summary("water"),
            "Flow1: sensor.one, Flow2: Not found, Flow4: sensor.four",
        )

    def test_a_kit_needs_water_on_a_base_line(self) -> None:
        has_sensor = SmartHomeShopConfigFlow._has_water_sensor

        self.assertTrue(has_sensor({"flow2_water_sensor": "sensor.two"}))
        self.assertFalse(has_sensor({"flow3_water_sensor": "sensor.three"}))
