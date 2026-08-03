"""Shared P1 energy sensor descriptions for P1MeterKit and WaterP1MeterKit."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntityDescription,
    SensorStateClass,
)

from .coordinator import EnergyData


@dataclass(frozen=True, kw_only=True)
class P1SensorDescription(SensorEntityDescription):
    """Describes a shared P1 energy sensor."""

    value_fn: Callable[[EnergyData], Any]
    attr_fn: Callable[[EnergyData], dict[str, Any] | None] | None = None
    # Restore the value across restarts (month peak / standby power)
    restore: bool = False


def _sum_cumulative(first: float | None, second: float | None) -> float | None:
    """Sum both tariffs without ever publishing a temporary lower total."""
    if first is None or second is None:
        return None
    return round(first + second, 3)


P1_SENSORS: tuple[P1SensorDescription, ...] = (
    # HA Energy expects one cumulative import and export statistic per grid
    # connection. DSMR exposes tariff 1 and tariff 2 separately, so publish
    # stable combined totals specifically for a clean one-click setup.
    P1SensorDescription(
        key="grid_import_energy",
        name="Grid import energy (CC)",
        icon="mdi:transmission-tower-import",
        native_unit_of_measurement="kWh",
        device_class=SensorDeviceClass.ENERGY,
        state_class=SensorStateClass.TOTAL_INCREASING,
        suggested_display_precision=3,
        value_fn=lambda data: _sum_cumulative(data.energy_t1, data.energy_t2),
    ),
    P1SensorDescription(
        key="grid_export_energy",
        name="Grid export energy (CC)",
        icon="mdi:transmission-tower-export",
        native_unit_of_measurement="kWh",
        device_class=SensorDeviceClass.ENERGY,
        state_class=SensorStateClass.TOTAL_INCREASING,
        suggested_display_precision=3,
        value_fn=lambda data: _sum_cumulative(
            data.energy_returned_t1, data.energy_returned_t2
        ),
    ),
    # Publish one stable gas total for both DSMR naming variants. Belgian
    # meters commonly expose ``gas_consumed_belgium`` instead of
    # ``gas_consumed``; EnergyTracker already normalises both into gas_total.
    P1SensorDescription(
        key="gas_consumption",
        name="Gas consumption (CC)",
        icon="mdi:fire",
        native_unit_of_measurement="m³",
        device_class=SensorDeviceClass.GAS,
        state_class=SensorStateClass.TOTAL_INCREASING,
        suggested_display_precision=3,
        value_fn=lambda data: data.gas_total,
    ),
    P1SensorDescription(
        key="standby_power",
        name="Standby power (CC)",
        icon="mdi:power-sleep",
        native_unit_of_measurement="W",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        restore=True,
        value_fn=lambda data: data.standby_w,
        attr_fn=lambda data: {"measured_night": data.standby_day} if data.standby_day else None,
    ),
    P1SensorDescription(
        key="standby_cost_year",
        name="Standby cost per year (CC)",
        icon="mdi:currency-eur",
        native_unit_of_measurement="EUR",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: data.standby_cost_year,
    ),
    P1SensorDescription(
        key="month_peak",
        name="Month peak (CC)",
        icon="mdi:transmission-tower",
        native_unit_of_measurement="kW",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=3,
        restore=True,
        value_fn=lambda data: data.month_peak_kw,
        attr_fn=lambda data: {"month": data.peak_month} if data.peak_month else None,
    ),
    P1SensorDescription(
        key="energy_cost_today",
        name="Energy cost today (CC)",
        icon="mdi:currency-eur",
        native_unit_of_measurement="EUR",
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        value_fn=lambda data: data.cost_today,
    ),
    P1SensorDescription(
        key="energy_cost_month",
        name="Energy cost this month (CC)",
        icon="mdi:currency-eur",
        native_unit_of_measurement="EUR",
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        value_fn=lambda data: data.cost_month,
    ),
    P1SensorDescription(
        key="energy_used_today",
        name="Energy used today (CC)",
        icon="mdi:counter",
        native_unit_of_measurement="kWh",
        device_class=SensorDeviceClass.ENERGY,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        value_fn=lambda data: data.energy_today_kwh,
    ),
    P1SensorDescription(
        key="grid_import_power",
        name="Grid import power (CC)",
        icon="mdi:transmission-tower-import",
        native_unit_of_measurement="W",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: data.power_w,
    ),
    P1SensorDescription(
        key="grid_export_power",
        name="Grid export power (CC)",
        icon="mdi:transmission-tower-export",
        native_unit_of_measurement="W",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: data.power_produced_w,
    ),
    P1SensorDescription(
        key="phase_max_load",
        name="Highest phase load (CC)",
        icon="mdi:speedometer",
        native_unit_of_measurement="%",
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: data.phase_max_load_pct,
        attr_fn=lambda data: dict(data.phase_currents) if data.phase_currents else None,
    ),
    P1SensorDescription(
        key="phase_imbalance",
        name="Phase imbalance (CC)",
        icon="mdi:current-ac",
        native_unit_of_measurement="A",
        device_class=SensorDeviceClass.CURRENT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda data: data.phase_imbalance_a,
        attr_fn=lambda data: dict(data.phase_currents) if data.phase_currents else None,
    ),
    # Signed net grid power (+import / -export). Always in W, so solar-surplus
    # automations have one unambiguous trigger regardless of the raw meter unit.
    P1SensorDescription(
        key="net_power",
        name="Net grid power (CC)",
        icon="mdi:transmission-tower",
        native_unit_of_measurement="W",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: data.net_power_w,
    ),
    # Headroom before the main fuse on the tightest phase, so automations can
    # avoid switching on a heavy load that would trip the connection.
    P1SensorDescription(
        key="available_grid_power",
        name="Available grid power (CC)",
        icon="mdi:gauge",
        native_unit_of_measurement="W",
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=0,
        value_fn=lambda data: data.available_grid_w,
    ),
)
