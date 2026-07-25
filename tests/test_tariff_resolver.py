"""Tests for resolving P1/DSMR active-tariff values."""

from custom_components.smarthomeshop.tariff_resolver import normalise_tariff_code


def test_normalises_common_dsmr_and_firmware_tariff_values() -> None:
    for value in ("0001", "1", "T1", "Tariff 1", "tarief_1", "dal", "off-peak"):
        assert normalise_tariff_code(value) == "t1"
    for value in ("0002", "2", "T2", "Tariff 2", "tarief_2", "normal", "hoog"):
        assert normalise_tariff_code(value) == "t2"


def test_unknown_tariff_values_are_never_guessed() -> None:
    for value in (None, "", "unknown", "unavailable", "weekend", True):
        assert normalise_tariff_code(value) is None
