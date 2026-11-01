"""Tests for the solar forecast from the SmartHomeShop account."""

from __future__ import annotations

import asyncio
import unittest
from types import SimpleNamespace

import aiohttp
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.smarthomeshop.battery_coordinator import BatteryPlanCoordinator
from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop.solar_forecast import (
    SolarForecastCoordinator,
    hourly_kw,
)
from custom_components.smarthomeshop.solar_sensors import (
    SOLAR_SENSORS,
    SmartHomeShopSolarSensor,
)

ROWS = [
    {"timestamp": "2026-10-31T07:48:00+01:00", "power_w": 0, "energy_wh": 0},
    {"timestamp": "2026-10-31T12:00:00+01:00", "power_w": 2500, "energy_wh": 2300},
    {"timestamp": "2026-10-31T13:00:00+01:00", "power_w": 3000, "energy_wh": 2800},
    {"timestamp": "2026-10-31T13:40:00+01:00", "power_w": 0, "energy_wh": 100},
]


class _Response:
    def __init__(self, status: int, payload=None, error: Exception | None = None):
        self.status = status
        self.payload = payload
        self.error = error

    async def __aenter__(self):
        if self.error:
            raise self.error
        return self

    async def __aexit__(self, *_args):
        return False

    async def json(self):
        return self.payload


def _coordinator(response, *, has_key=True, location=None, data=None):
    calls = []

    def get(url, **kwargs):
        calls.append((url, kwargs))
        return response

    coordinator = SimpleNamespace(
        prices=SimpleNamespace(
            has_key=has_key,
            base_url="https://example.test",
            location_id=location,
            _account=lambda: {"api_key": "secret"},
            _ssl_option=lambda _url: False,
        ),
        _session=SimpleNamespace(get=get),
        data=data,
    )
    coordinator.calls = calls
    return coordinator


def _update(coordinator):
    return asyncio.run(SolarForecastCoordinator._async_update_data(coordinator))


def _with_forecast(payload) -> SimpleNamespace:
    coordinator = SimpleNamespace(data=payload)
    coordinator.available = SolarForecastCoordinator.available.fget(coordinator)
    coordinator.rows = lambda: SolarForecastCoordinator.rows(coordinator)
    return coordinator


class TestHourlyForecast(unittest.TestCase):
    def test_rows_become_kw_per_utc_hour(self) -> None:
        self.assertEqual(
            hourly_kw(ROWS),
            {
                "2026-10-31T06": 0.0,
                "2026-10-31T11": 2.5,
                "2026-10-31T12": 3.0,
            },
        )

    def test_unusable_rows_are_skipped(self) -> None:
        rows = [
            {"timestamp": "not a date", "power_w": 100},
            {"timestamp": "2026-10-31T12:00:00", "power_w": 100},
            {"timestamp": "2026-10-31T12:00:00+01:00", "power_w": None},
        ]

        self.assertEqual(hourly_kw(rows), {})

    def test_series_follows_the_planning_periods(self) -> None:
        coordinator = _with_forecast({"available": True, "hourly": ROWS})

        series = SolarForecastCoordinator.series(
            coordinator,
            [
                "2026-10-31T11:00:00+00:00",
                "2026-10-31T11:15:00+00:00",
                "2026-10-31T23:00:00+00:00",
            ],
        )

        self.assertEqual(series, [2.5, 2.5, 0.0])

    def test_no_series_without_a_forecast(self) -> None:
        for payload in (None, {}, {"available": False, "hourly": ROWS}):
            coordinator = _with_forecast(payload)
            self.assertIsNone(
                SolarForecastCoordinator.series(coordinator, ["2026-10-31T11:00:00Z"])
            )


class TestForecastRequest(unittest.TestCase):
    def test_no_request_without_an_api_key(self) -> None:
        coordinator = _coordinator(_Response(200, {}), has_key=False)

        self.assertEqual(_update(coordinator), {})
        self.assertEqual(coordinator.calls, [])

    def test_forecast_is_returned_for_the_selected_location(self) -> None:
        coordinator = _coordinator(
            _Response(200, {"available": True, "hourly": ROWS}), location="4"
        )

        self.assertTrue(_update(coordinator)["available"])
        url, kwargs = coordinator.calls[0]
        self.assertEqual(url, "https://example.test/api/v1/energy/solar-forecast")
        self.assertEqual(kwargs["params"], {"location_id": "4"})
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer secret")

    def test_accounts_without_a_forecast_are_not_an_error(self) -> None:
        for status in (401, 403, 404):
            self.assertEqual(_update(_coordinator(_Response(status))), {})

    def test_failures_keep_the_last_forecast(self) -> None:
        for response in (
            _Response(500),
            _Response(200, error=aiohttp.ClientError("offline")),
            _Response(200, error=TimeoutError()),
        ):
            with self.assertRaises(UpdateFailed):
                _update(_coordinator(response))


class TestBatteryPlanSource(unittest.TestCase):
    def test_planner_falls_back_to_the_account_forecast(self) -> None:
        forecast = SimpleNamespace(series=lambda starts: [1.5] * len(starts))
        coordinator = SimpleNamespace(
            hass=SimpleNamespace(data={DOMAIN: {"solar_forecast": forecast}})
        )

        self.assertEqual(
            BatteryPlanCoordinator._account_solar_series(coordinator, ["a", "b"]),
            [1.5, 1.5],
        )

    def test_planner_works_without_an_account_forecast(self) -> None:
        coordinator = SimpleNamespace(hass=SimpleNamespace(data={DOMAIN: {}}))

        self.assertIsNone(
            BatteryPlanCoordinator._account_solar_series(coordinator, ["a"])
        )


class TestSolarSensors(unittest.TestCase):
    def _sensor(self, key: str, payload: dict) -> SmartHomeShopSolarSensor:
        description = next(item for item in SOLAR_SENSORS if item.key == key)
        coordinator = _with_forecast(payload)
        return SmartHomeShopSolarSensor(coordinator, description)

    def test_unique_ids_are_removed_with_the_account_entities(self) -> None:
        sensor = self._sensor("solar_forecast_today", {})

        self.assertTrue(sensor.unique_id.startswith(f"{DOMAIN}_price_"))

    def test_value_comes_from_the_forecast(self) -> None:
        sensor = self._sensor("solar_forecast_today", {"energy_today_kwh": 12.4})

        self.assertEqual(sensor.native_value, 12.4)

    def test_remaining_today_is_usable_as_planner_forecast_sensor(self) -> None:
        sensor = self._sensor(
            "solar_forecast_remaining_today",
            {"available": True, "stale": True, "hourly": ROWS[:2]},
        )

        attributes = sensor.extra_state_attributes
        self.assertTrue(attributes["stale"])
        self.assertEqual(
            attributes["hourly"][1],
            {"datetime": "2026-10-31T12:00:00+01:00", "power": 2500, "unit": "W"},
        )
        self.assertNotIn(
            "hourly",
            self._sensor("solar_forecast_today", {}).extra_state_attributes,
        )
