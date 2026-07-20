from __future__ import annotations

from datetime import datetime, timedelta, timezone
import importlib.util
from pathlib import Path
import sys
import unittest


MODULE_PATH = (
    Path(__file__).parents[1]
    / "custom_components"
    / "smarthomeshop"
    / "battery_planner.py"
)
SPEC = importlib.util.spec_from_file_location("smarthomeshop_battery_planner", MODULE_PATH)
assert SPEC and SPEC.loader
PLANNER = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = PLANNER
SPEC.loader.exec_module(PLANNER)


class BatteryPlannerTest(unittest.TestCase):
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def setUp(self) -> None:
        self.config = {
            "enabled": True,
            "capacity_kwh": 10,
            "reserve_soc": 10,
            "target_soc": 90,
            "planning_hours": 6,
            "charge_power": 3000,
            "max_discharge_power": 3000,
            "charge_efficiency": 0.95,
            "discharge_efficiency": 0.95,
            "cycle_cost": 0.01,
            "minimum_confidence": 0.55,
        }

    def forecast(
        self,
        prices: list[float],
        *,
        confidence: float = 1.0,
        kind: str = "confirmed",
    ) -> list[dict[str, object]]:
        return [
            {
                "start": (self.now + timedelta(hours=index)).isoformat(),
                "end": (self.now + timedelta(hours=index + 1)).isoformat(),
                "consumer": price,
                "consumer_low": price,
                "consumer_high": price,
                "feed_in": 0.05,
                "feed_in_low": 0.05,
                "kind": kind,
                "confidence": confidence,
            }
            for index, price in enumerate(prices)
        ]

    def test_charges_before_expensive_hours(self) -> None:
        plan = PLANNER.build_battery_plan(
            self.forecast([0.10, 0.10, 0.60, 0.60, 0.60, 0.60]),
            self.config,
            20,
            now=self.now,
        )

        self.assertEqual(plan["status"], "ready")
        self.assertEqual(plan["recommendation"], "charge")
        self.assertGreater(plan["target_power_w"], 0)
        self.assertGreater(plan["expected_savings"], 0)

    def test_holds_when_now_is_not_cheaper(self) -> None:
        plan = PLANNER.build_battery_plan(
            self.forecast([0.60, 0.60, 0.10, 0.10, 0.10, 0.10]),
            self.config,
            80,
            now=self.now,
        )

        self.assertEqual(plan["recommendation"], "hold")
        self.assertEqual(plan["target_power_w"], 0)

    def test_low_confidence_blocks_automatic_action(self) -> None:
        plan = PLANNER.build_battery_plan(
            self.forecast(
                [0.10, 0.10, 0.60, 0.60, 0.60, 0.60],
                confidence=0.30,
                kind="predicted",
            ),
            self.config,
            20,
            now=self.now,
        )

        self.assertEqual(plan["recommendation"], "hold")
        self.assertEqual(plan["target_power_w"], 0)
        self.assertEqual(plan["timeline"][0]["action"], "hold")
        self.assertIn("confidence", plan["reason"].lower())

    def test_disabled_planner_has_stable_payload(self) -> None:
        plan = PLANNER.build_battery_plan([], {"enabled": False}, None, now=self.now)

        self.assertEqual(plan["status"], "disabled")
        self.assertEqual(plan["recommendation"], "disabled")
        self.assertEqual(plan["timeline"], [])

    def test_forecast_units_are_normalized_to_kw(self) -> None:
        self.assertEqual(PLANNER.normalize_hourly_kw(3500, "W"), 3.5)
        self.assertEqual(PLANNER.normalize_hourly_kw(3.5, "kW"), 3.5)
        self.assertEqual(PLANNER.normalize_hourly_kw(2.4, "kWh"), 2.4)
        self.assertEqual(PLANNER.normalize_hourly_kw(2400, "Wh"), 2.4)
        self.assertEqual(PLANNER.normalize_hourly_kw(3500, None), 3.5)
        self.assertIsNone(PLANNER.normalize_hourly_kw(10, "°C"))

    def test_current_price_hour_only_uses_remaining_time(self) -> None:
        now = self.now + timedelta(minutes=30)
        plan = PLANNER.build_battery_plan(
            self.forecast([0.10, 0.60, 0.60, 0.60, 0.60, 0.60]),
            self.config,
            20,
            now=now,
        )

        self.assertEqual(plan["status"], "ready")
        self.assertEqual(plan["timeline"][0]["start"], now.isoformat())


if __name__ == "__main__":
    unittest.main()
