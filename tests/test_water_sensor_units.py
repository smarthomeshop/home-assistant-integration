"""Water usage periods share one unit without touching existing statistics."""

from math import floor, log10

from homeassistant.components.sensor import SensorDeviceClass, SensorStateClass
from homeassistant.components.sensor.const import (
    DEVICE_CLASS_STATE_CLASSES,
    DEVICE_CLASS_UNITS,
)
from homeassistant.const import UnitOfVolume
from homeassistant.util.unit_conversion import VolumeConverter

from custom_components.smarthomeshop.products.base.water.coordinator import WaterUsageData
from custom_components.smarthomeshop.products.base.water.sensors import WATER_SENSORS

PERIODS = ("today_usage", "week_usage", "month_usage", "year_usage")


def period(key: str):
    return next(item for item in WATER_SENSORS if item.key == key)


def test_period_sensors_are_water_sensors_that_suggest_litres() -> None:
    for key in PERIODS:
        description = period(key)

        assert description.device_class is SensorDeviceClass.WATER
        assert description.suggested_unit_of_measurement == UnitOfVolume.LITERS
        assert description.state_class is SensorStateClass.TOTAL
        assert description.state_class in DEVICE_CLASS_STATE_CLASSES[SensorDeviceClass.WATER]
        assert description.native_unit_of_measurement in DEVICE_CLASS_UNITS[SensorDeviceClass.WATER]
        assert description.suggested_unit_of_measurement in DEVICE_CLASS_UNITS[SensorDeviceClass.WATER]


def test_native_units_and_values_stay_as_existing_installations_record_them() -> None:
    # A new native unit would change the state existing installations record
    # in their statistics and that dashboards, automations and cards read.
    assert {key: period(key).native_unit_of_measurement for key in PERIODS} == {
        "today_usage": UnitOfVolume.LITERS,
        "week_usage": UnitOfVolume.LITERS,
        "month_usage": UnitOfVolume.LITERS,
        "year_usage": UnitOfVolume.CUBIC_METERS,
    }
    data = WaterUsageData(today_usage=312.04, month_usage=12345.4, year_usage=123456.0)
    assert period("today_usage").value_fn(data) == 312.0
    assert period("month_usage").value_fn(data) == 12345
    assert period("year_usage").value_fn(data) == 123.456


def test_display_precision_is_whole_litres_and_three_decimals_in_m3() -> None:
    # Home Assistant counts suggested_display_precision in the suggested unit
    # and adds log10 of the unit ratio when a sensor is shown in another one.
    assert all(period(key).suggested_display_precision == 0 for key in PERIODS)
    ratio = VolumeConverter.get_unit_ratio(UnitOfVolume.LITERS, UnitOfVolume.CUBIC_METERS)
    assert floor(log10(ratio) + 1e-9) == 3
