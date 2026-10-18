"""The integration reports the version it was released as."""

import json
from pathlib import Path

from custom_components.smarthomeshop.const import VERSION


def test_the_reported_version_is_the_released_version() -> None:
    manifest = json.loads(
        (Path(__file__).parents[1] / "custom_components" / "smarthomeshop" / "manifest.json").read_text()
    )

    assert VERSION == manifest["version"]
