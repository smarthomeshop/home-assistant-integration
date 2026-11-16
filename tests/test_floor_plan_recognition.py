"""The Floorplan Designer asks the account service to find rooms on a plan."""

from __future__ import annotations

import asyncio
import inspect
from types import SimpleNamespace

import aiohttp
import pytest

from custom_components.smarthomeshop import floor_plan_recognition, websocket_api
from custom_components.smarthomeshop.const import DOMAIN
from custom_components.smarthomeshop.floor_plan_recognition import (
    FloorPlanRecognitionError,
    async_recognise_floor_plan,
)

IMAGE = "data:image/jpeg;base64," + "A" * 64
RECOGNITION = {"width_m": 12.5, "rooms": [{"name": "Kitchen", "points": [[0.1, 0.1], [0.5, 0.1], [0.5, 0.6]]}], "doors": [], "windows": []}
QUOTA = {"used": 1, "limit": 3, "resets_at": "2026-12-01T00:00:00Z"}


class _Response:
    def __init__(self, status, body):
        self.status = status
        self._body = body

    async def json(self, content_type=None):
        if isinstance(self._body, Exception):
            raise self._body
        return self._body

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False


class _Session:
    def __init__(self, response):
        self.response = response
        self.calls = []

    def post(self, url, **kwargs):
        self.calls.append((url, kwargs))
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


def _use(monkeypatch, response) -> _Session:
    session = _Session(response)
    monkeypatch.setattr(floor_plan_recognition, "async_get_clientsession", lambda _hass: session)
    return session


def test_a_recognition_is_requested_with_the_account_key(monkeypatch) -> None:
    session = _use(monkeypatch, _Response(200, {"recognition": RECOGNITION, "quota": QUOTA}))
    # An environment override for the service address must not decide this test.
    monkeypatch.setattr(floor_plan_recognition, "resolve_api_base_url", lambda base: base.rstrip("/"))
    account = {"api_key": " secret-key ", "base_url": "https://example.test"}

    result = asyncio.run(async_recognise_floor_plan(object(), account, IMAGE))

    assert result == {"recognition": RECOGNITION, "quota": QUOTA}
    url, kwargs = session.calls[0]
    assert url == "https://example.test/api/v1/floor-plan/recognitions"
    assert kwargs["json"] == {"image": IMAGE}
    assert kwargs["headers"]["Authorization"] == "Bearer secret-key"
    # Certificate checks are only skipped for local development hosts.
    assert kwargs["ssl"] is False
    assert floor_plan_recognition._ssl_option("https://api.smarthomeshop.io/x") is None


def test_no_linked_account_never_sends_the_image(monkeypatch) -> None:
    session = _use(monkeypatch, _Response(200, {}))
    with pytest.raises(FloorPlanRecognitionError) as raised:
        asyncio.run(async_recognise_floor_plan(object(), {}, IMAGE))
    assert raised.value.code == "account_required"
    assert session.calls == []


@pytest.mark.parametrize(
    ("status", "body", "code", "quota"),
    [
        (401, {"message": "Unauthenticated."}, "account_invalid", None),
        (429, {"error": {"code": "quota_exceeded", "message": "Limit reached"}, "quota": QUOTA}, "quota_exceeded", QUOTA),
        (422, {"error": {"code": "no_rooms_found", "message": "No rooms"}}, "no_rooms_found", None),
        (422, {"error": {"code": "invalid_image", "message": "Bad image"}}, "invalid_image", None),
        (503, {"error": {"code": "unavailable", "message": "Off"}}, "unavailable", None),
        # Unknown codes, odd bodies and a 200 without a recognition all fail closed.
        (500, {"error": {"code": "<script>", "message": 5}}, "recognition_failed", None),
        (502, "not json", "recognition_failed", None),
        (200, {"quota": QUOTA}, "recognition_failed", QUOTA),
        (200, ValueError("broken"), "recognition_failed", None),
    ],
)
def test_service_answers_become_codes_the_designer_knows(monkeypatch, status, body, code, quota) -> None:
    _use(monkeypatch, _Response(status, body))
    with pytest.raises(FloorPlanRecognitionError) as raised:
        asyncio.run(async_recognise_floor_plan(object(), {"api_key": "key"}, IMAGE))
    assert raised.value.code == code
    assert raised.value.quota == quota


def test_an_unreachable_service_is_reported_without_logging_the_plan(monkeypatch, caplog) -> None:
    _use(monkeypatch, aiohttp.ClientConnectionError("down"))
    with pytest.raises(FloorPlanRecognitionError) as raised:
        asyncio.run(async_recognise_floor_plan(object(), {"api_key": "key"}, IMAGE))
    assert raised.value.code == "unreachable"
    assert IMAGE not in caplog.text


class _Connection:
    def __init__(self, admin=True) -> None:
        self.result = None
        self.error = None
        self.user = SimpleNamespace(is_admin=admin)

    def send_result(self, _message_id, result) -> None:
        self.result = result

    def send_error(self, _message_id, code, message) -> None:
        self.error = (code, message)


def _hass(account):
    return SimpleNamespace(data={DOMAIN: {"store": SimpleNamespace(get_account=lambda: account)}})


def test_websocket_returns_rooms_or_an_error_with_the_quota(monkeypatch) -> None:
    handler = inspect.unwrap(websocket_api.ws_recognise_floor_plan)

    async def found(_hass, account, image):
        assert account == {"api_key": "key"} and image == IMAGE
        return {"recognition": RECOGNITION, "quota": QUOTA}

    monkeypatch.setattr(websocket_api, "async_recognise_floor_plan", found)
    connection = _Connection()
    asyncio.run(handler(_hass({"api_key": "key"}), connection, {"id": 1, "image": IMAGE}))
    assert connection.result == {"recognition": RECOGNITION, "quota": QUOTA}

    async def limited(*_args):
        raise FloorPlanRecognitionError("quota_exceeded", "Limit reached", QUOTA)

    monkeypatch.setattr(websocket_api, "async_recognise_floor_plan", limited)
    connection = _Connection()
    asyncio.run(handler(_hass({"api_key": "key"}), connection, {"id": 2, "image": IMAGE}))
    assert connection.error is None
    assert connection.result == {"error": {"code": "quota_exceeded", "message": "Limit reached"}, "quota": QUOTA}


def test_websocket_is_for_administrators_and_jpeg_data_urls_only(monkeypatch) -> None:
    async def never(*_args):
        raise AssertionError("must not reach the service")

    monkeypatch.setattr(websocket_api, "async_recognise_floor_plan", never)
    connection = _Connection(admin=False)
    asyncio.run(inspect.unwrap(websocket_api.ws_recognise_floor_plan)(_hass({"api_key": "key"}), connection, {"id": 3, "image": IMAGE}))
    assert connection.error[0] == "unauthorized"

    schema = websocket_api.ws_recognise_floor_plan._ws_schema
    assert schema({"id": 4, "type": "smarthomeshop/floor_plan/recognise", "image": IMAGE})
    for bad in ("data:image/png;base64," + "A" * 64, "https://example.com/plan.jpg", IMAGE + "!", "A" * 10):
        with pytest.raises(Exception):
            schema({"id": 4, "type": "smarthomeshop/floor_plan/recognise", "image": bad})
