"""Translation catalog coverage tests."""

from __future__ import annotations

import json
from pathlib import Path
import re


INTEGRATION = Path(__file__).parents[1] / "custom_components" / "smarthomeshop"
REQUIRED_LANGUAGES = ("en", "nl", "de", "fr", "es")


def _flatten(value: object, prefix: str = "") -> dict[str, str]:
    if not isinstance(value, dict):
        return {prefix: str(value)}
    result: dict[str, str] = {}
    for key, child in value.items():
        path = f"{prefix}.{key}" if prefix else key
        result.update(_flatten(child, path))
    return result


def _placeholders(value: str) -> list[str]:
    return sorted(re.findall(r"\{[a-zA-Z0-9_]+\}", value))


def test_required_home_assistant_languages_are_complete() -> None:
    source = _flatten(json.loads((INTEGRATION / "strings.json").read_text()))

    for language in REQUIRED_LANGUAGES:
        translated = _flatten(
            json.loads((INTEGRATION / "translations" / f"{language}.json").read_text())
        )
        assert translated.keys() == source.keys()
        assert all(value.strip() for value in translated.values())
        assert {
            key: _placeholders(value) for key, value in translated.items()
        } == {key: _placeholders(value) for key, value in source.items()}
