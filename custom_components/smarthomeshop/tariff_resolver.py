"""Resolve DSMR/P1 tariff indicator values without guessing."""

from __future__ import annotations

import re
from typing import Any


def normalise_tariff_code(value: Any) -> str | None:
    """Return ``t1`` or ``t2`` for known P1 tariff representations.

    DSMR commonly publishes ``0001``/``0002``. Firmware and MQTT bridges may
    expose the same value as ``1``/``2``, ``T1``/``T2`` or a named tariff.
    Unknown values deliberately remain unresolved.
    """
    if value is None or isinstance(value, bool):
        return None
    text = str(value).strip().lower()
    if not text or text in {"unknown", "unavailable", "none", "null"}:
        return None

    compact = re.sub(r"[\s_-]+", "", text)
    if compact in {
        "1",
        "01",
        "001",
        "0001",
        "t1",
        "tariff1",
        "tarief1",
        "low",
        "offpeak",
        "dal",
    }:
        return "t1"
    if compact in {
        "2",
        "02",
        "002",
        "0002",
        "t2",
        "tariff2",
        "tarief2",
        "normal",
        "normalpeak",
        "peak",
        "high",
        "hoog",
    }:
        return "t2"
    return None
