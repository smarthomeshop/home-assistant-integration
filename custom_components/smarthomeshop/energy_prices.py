"""Best-effort read of static prices from the Home Assistant Energy Dashboard.

Used only as a default for our own cost sensors when the user has not set a
price in the SmartHomeShop options. One-directional and read-only: we never
write to the Energy Dashboard preferences.
"""

from __future__ import annotations

from homeassistant.core import HomeAssistant

from .const import (
    CONF_PRICE_T1,
    CONF_PRICE_T2,
    CONF_PRICE_FEED_IN,
    CONF_PRICE_GAS,
    CONF_PRICE_WATER,
)


async def async_ha_energy_prices(hass: HomeAssistant) -> dict[str, float]:
    """Return static prices configured in the HA Energy Dashboard, if any.

    HA has no T1/T2 split, so the single grid import price is used for both.
    """
    prices: dict[str, float] = {}
    try:
        from homeassistant.components.energy.data import async_get_manager

        manager = await async_get_manager(hass)
        data = manager.data
    except Exception:  # energy component not set up, or API changed
        return prices

    if not data:
        return prices

    for source in data.get("energy_sources", []) or []:
        stype = source.get("type")
        if stype == "grid":
            # HA 2026.6+ stores one unified grid source. Keep the legacy
            # flow_from/flow_to fallback so upgrades from older HA releases
            # continue to provide sensible defaults.
            import_price = source.get("number_energy_price")
            export_price = source.get("number_energy_price_export")
            if import_price is not None:
                prices.setdefault(CONF_PRICE_T1, float(import_price))
                prices.setdefault(CONF_PRICE_T2, float(import_price))
            if export_price is not None:
                prices.setdefault(CONF_PRICE_FEED_IN, float(export_price))
            for flow in source.get("flow_from", []) or []:
                price = flow.get("number_energy_price")
                if price is not None:
                    prices.setdefault(CONF_PRICE_T1, float(price))
                    prices.setdefault(CONF_PRICE_T2, float(price))
            for flow in source.get("flow_to", []) or []:
                price = flow.get("number_energy_price")
                if price is not None:
                    prices.setdefault(CONF_PRICE_FEED_IN, float(price))
        elif stype == "gas":
            price = source.get("number_energy_price")
            if price is not None:
                prices.setdefault(CONF_PRICE_GAS, float(price))
        elif stype == "water":
            price = source.get("number_energy_price")
            if price is not None:
                prices.setdefault(CONF_PRICE_WATER, float(price))

    return prices
