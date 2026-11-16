"""Ask the SmartHomeShop account service to find the rooms on a floor plan.

The Floorplan Designer can turn an uploaded floor plan image into a first
draft of rooms. That runs in the SmartHomeShop account service, with the same
account key the integration already uses for energy prices. The image is only
sent when the user asks for it in the designer.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import LOGGER, resolve_api_base_url

RECOGNITION_PATH = "/api/v1/floor-plan/recognitions"
# Reading a plan takes the service a while; the designer shows a busy state.
REQUEST_TIMEOUT = 120
# The designer shrinks every image to a JPEG data URL well below this.
MAX_IMAGE_CHARACTERS = 450_000

# Error codes the designer has its own text for.
_SERVICE_ERRORS = {
    "invalid_image",
    "quota_exceeded",
    "no_rooms_found",
    "recognition_failed",
    "unavailable",
}


class FloorPlanRecognitionError(Exception):
    """A recognition that did not give rooms, with a code the designer knows."""

    def __init__(
        self, code: str, message: str, quota: dict[str, Any] | None = None
    ) -> None:
        super().__init__(message)
        self.code = code
        self.quota = quota


def _ssl_option(url: str) -> bool | None:
    """Skip certificate checks for local development hosts only."""
    hostname = (urlparse(url).hostname or "").lower()
    if hostname in {"localhost", "127.0.0.1", "::1", "host-gateway"} or hostname.endswith(".test"):
        return False
    return None


def _quota(body: dict[str, Any]) -> dict[str, Any] | None:
    quota = body.get("quota")
    return quota if isinstance(quota, dict) else None


async def async_recognise_floor_plan(
    hass: HomeAssistant, account: dict[str, Any], image: str
) -> dict[str, Any]:
    """Return {"recognition": ..., "quota": ...} for a JPEG data URL."""
    api_key = str(account.get("api_key") or "").strip()
    if not api_key:
        raise FloorPlanRecognitionError(
            "account_required", "Connect a SmartHomeShop account first."
        )
    url = f"{resolve_api_base_url(account.get('base_url'))}{RECOGNITION_PATH}"
    try:
        async with async_get_clientsession(hass).post(
            url,
            json={"image": image},
            headers={
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
            },
            timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT),
            ssl=_ssl_option(url),
        ) as response:
            status = response.status
            try:
                body = await response.json(content_type=None)
            except (ValueError, aiohttp.ClientError):
                body = None
    except (aiohttp.ClientError, TimeoutError) as err:
        # Never log the request: it carries the user's floor plan.
        LOGGER.warning("Floor plan recognition could not be reached: %s", type(err).__name__)
        raise FloorPlanRecognitionError(
            "unreachable", "The SmartHomeShop service could not be reached."
        ) from err

    if not isinstance(body, dict):
        body = {}
    quota = _quota(body)
    if status == 200 and isinstance(body.get("recognition"), dict):
        return {"recognition": body["recognition"], "quota": quota}
    if status == 401:
        raise FloorPlanRecognitionError(
            "account_invalid", "The SmartHomeShop account key is invalid or was revoked."
        )
    error = body.get("error") if isinstance(body.get("error"), dict) else {}
    code = error.get("code") if error.get("code") in _SERVICE_ERRORS else "recognition_failed"
    message = error.get("message") if isinstance(error.get("message"), str) else ""
    raise FloorPlanRecognitionError(
        code, message[:300] or "The floor plan could not be recognised.", quota
    )
