"""Load JavaScript frontend plugins for SmartHomeShop.io."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import VERSION

_LOGGER = logging.getLogger(__name__)

# URL path for serving frontend files
FRONTEND_URL_BASE = "/smarthomeshop_files"


async def load_plugins(hass: HomeAssistant, name: str) -> None:
    """Load JavaScript plugins for SmartHomeShop.io cards.

    This registers a static path to serve the JavaScript files from the
    custom_components/smarthomeshop/www/ folder and adds the main JS file
    to the frontend.

    Args:
        hass: Home Assistant instance
        name: The domain name (smarthomeshop)
    """
    _LOGGER.info("Loading SmartHomeShop.io frontend plugins (version: %s)", VERSION)

    # Register the static path for serving JS files
    # Using underscore in path to avoid proxy issues with /smarthomeshop/
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                FRONTEND_URL_BASE,
                hass.config.path(f"custom_components/{name}/www"),
                cache_headers=True,
            )
        ]
    )

    # Add the main JavaScript file to the frontend
    # The version parameter is used for cache busting
    frontend_file = Path(
        hass.config.path(f"custom_components/{name}/www/smarthomeshop-cards.js")
    )
    build_token = frontend_file.stat().st_mtime_ns if frontend_file.exists() else 0
    add_extra_js_url(
        hass,
        (
            f"{FRONTEND_URL_BASE}/smarthomeshop-cards.js"
            f"?v={VERSION}&build={build_token}"
        ),
    )

    _LOGGER.info("SmartHomeShop.io frontend plugins registered at %s/", FRONTEND_URL_BASE)






