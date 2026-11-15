"""Repairs flows for SmartHomeShop room data."""

from __future__ import annotations

from typing import Any

from homeassistant.components.repairs import ConfirmRepairFlow, RepairsFlow
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .storage import ROOM_DATA_REPAIRED_ISSUE, ROOM_DATA_UNREADABLE_ISSUE


class RoomDataRepairFlow(ConfirmRepairFlow):
    """Confirm, then forget the kept copy of repaired or unreadable rooms."""

    async def async_step_confirm(
        self, user_input: dict[str, str] | None = None
    ) -> Any:
        if user_input is not None:
            store = self.hass.data.get(DOMAIN, {}).get("store")
            if store is not None:
                await store.async_clear_room_recovery(self.issue_id)
        return await super().async_step_confirm(user_input)


async def async_create_fix_flow(
    hass: HomeAssistant,
    issue_id: str,
    data: dict[str, str | int | float | None] | None,
) -> RepairsFlow:
    """Create the flow for a fixable SmartHomeShop issue."""
    if issue_id in (ROOM_DATA_REPAIRED_ISSUE, ROOM_DATA_UNREADABLE_ISSUE):
        return RoomDataRepairFlow()
    return ConfirmRepairFlow()
