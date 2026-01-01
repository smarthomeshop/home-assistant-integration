"""Load JavaScript frontend plugins for SmartHomeShop.io."""

from __future__ import annotations

import logging

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import VERSION

_LOGGER = logging.getLogger(__name__)


async def load_plugins(hass: HomeAssistant, name: str) -> None:
    """Load JavaScript plugins for SmartHomeShop.io cards.

    This registers a static path to serve the JavaScript files from the
    custom_components/smarthomeshop/js/ folder and adds the main JS file
    to the frontend.

    Args:
        hass: Home Assistant instance
        name: The domain name (smarthomeshop)
    """
    _LOGGER.info("Loading SmartHomeShop.io frontend plugins (version: %s)", VERSION)

    # Register the static path for serving JS files
    # This makes /smarthomeshop/js/* serve files from custom_components/smarthomeshop/js/
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                f"/{name}/js",
                hass.config.path(f"custom_components/{name}/js"),
                cache_headers=True,
            )
        ]
    )

    # Add the main JavaScript file to the frontend
    # The version parameter is used for cache busting
    add_extra_js_url(hass, f"/{name}/js/smarthomeshop-cards.js?v={VERSION}")

    _LOGGER.info("SmartHomeShop.io frontend plugins registered at /%s/js/", name)







