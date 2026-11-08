"""Regression tests for one-time recorder metadata migrations."""

import asyncio
from types import SimpleNamespace

from homeassistant.const import UnitOfTime
from homeassistant.util.unit_conversion import DurationConverter

from custom_components.smarthomeshop import sensor


class _Registry:
    def __init__(self, entity_id: str | None) -> None:
        self.entity_id = entity_id

    def async_get_entity_id(self, domain: str, platform: str, unique_id: str):
        assert domain == "sensor"
        assert platform == "smarthomeshop"
        assert unique_id == "entry_baseline_learning_days"
        return self.entity_id


def _hass(loop: asyncio.AbstractEventLoop):
    return SimpleNamespace(
        config=SimpleNamespace(components={"recorder"}),
        loop=loop,
    )


def _entry():
    return SimpleNamespace(entry_id="entry")


def test_legacy_dutch_day_unit_is_migrated_without_value_conversion(
    monkeypatch,
) -> None:
    async def run() -> None:
        calls = []
        hass = _hass(asyncio.get_running_loop())
        monkeypatch.setattr(
            sensor.er, "async_get", lambda _hass: _Registry("sensor.days")
        )

        async def list_statistics(_hass, statistic_ids):
            assert statistic_ids == {"sensor.days"}
            return [
                {
                    "statistic_id": "sensor.days",
                    "unit_of_measurement": "dagen",
                }
            ]

        def update_statistics(_hass, statistic_id, **kwargs):
            calls.append((statistic_id, kwargs))
            kwargs["on_done"]()

        monkeypatch.setattr(sensor, "async_list_statistic_ids", list_statistics)
        monkeypatch.setattr(
            sensor, "async_update_statistics_metadata", update_statistics
        )

        await sensor.async_migrate_baseline_learning_days_statistics(hass, _entry())

        assert len(calls) == 1
        statistic_id, kwargs = calls[0]
        assert statistic_id == "sensor.days"
        assert kwargs["new_unit_class"] == DurationConverter.UNIT_CLASS
        assert kwargs["new_unit_of_measurement"] == UnitOfTime.DAYS

    asyncio.run(run())


def test_current_unit_is_left_unchanged(monkeypatch) -> None:
    async def run() -> None:
        hass = _hass(asyncio.get_running_loop())
        monkeypatch.setattr(
            sensor.er, "async_get", lambda _hass: _Registry("sensor.days")
        )

        async def list_statistics(_hass, _statistic_ids):
            return [
                {
                    "statistic_id": "sensor.days",
                    "unit_of_measurement": UnitOfTime.DAYS,
                }
            ]

        monkeypatch.setattr(sensor, "async_list_statistic_ids", list_statistics)
        monkeypatch.setattr(
            sensor,
            "async_update_statistics_metadata",
            lambda *_args, **_kwargs: (_ for _ in ()).throw(
                AssertionError("current metadata must not be rewritten")
            ),
        )

        await sensor.async_migrate_baseline_learning_days_statistics(hass, _entry())

    asyncio.run(run())


def test_missing_recorder_or_registry_entity_is_ignored(monkeypatch) -> None:
    async def run() -> None:
        loop = asyncio.get_running_loop()
        hass = _hass(loop)
        hass.config.components = set()
        await sensor.async_migrate_baseline_learning_days_statistics(hass, _entry())

        hass.config.components = {"recorder"}
        monkeypatch.setattr(sensor.er, "async_get", lambda _hass: _Registry(None))
        await sensor.async_migrate_baseline_learning_days_statistics(hass, _entry())

    asyncio.run(run())
