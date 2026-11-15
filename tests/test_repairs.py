"""Repairs flows for room data."""

import asyncio
from types import SimpleNamespace

from custom_components.smarthomeshop import repairs
from custom_components.smarthomeshop.const import DOMAIN


def test_confirming_a_room_data_issue_forgets_the_kept_copy() -> None:
    cleared: list[str] = []

    class _Store:
        async def async_clear_room_recovery(self, issue_id):
            cleared.append(issue_id)

    flow = asyncio.run(repairs.async_create_fix_flow(None, "room_data_repaired", None))
    assert isinstance(flow, repairs.RoomDataRepairFlow)
    flow.hass = SimpleNamespace(data={DOMAIN: {"store": _Store()}})
    flow.issue_id = "room_data_repaired"
    flow.handler = DOMAIN
    flow.flow_id = "flow"

    result = asyncio.run(flow.async_step_confirm({}))

    assert cleared == ["room_data_repaired"]
    assert result["type"] == "create_entry"


def test_other_issues_get_a_plain_confirm_flow() -> None:
    flow = asyncio.run(repairs.async_create_fix_flow(None, "something_else", None))
    assert not isinstance(flow, repairs.RoomDataRepairFlow)
