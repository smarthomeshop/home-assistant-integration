"""Normalisation helpers for SmartHomeShop Cloud Energy API schema v2."""

from __future__ import annotations

from typing import Any


def mapping(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def rows(value: Any) -> list[dict[str, Any]]:
    return (
        [item for item in value if isinstance(item, dict)]
        if isinstance(value, list)
        else []
    )


def number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)


def schema_version(data: dict[str, Any] | None) -> int:
    value = mapping(data).get("schema_version")
    return value if isinstance(value, int) and not isinstance(value, bool) else 1


def contract(data: dict[str, Any] | None) -> dict[str, Any]:
    return mapping(mapping(data).get("contract"))


def contract_type(data: dict[str, Any] | None) -> str | None:
    value = contract(data).get("type")
    return str(value).lower() if value else None


def electricity(data: dict[str, Any] | None) -> dict[str, Any]:
    return mapping(mapping(data).get("electricity"))


def electricity_flow(data: dict[str, Any] | None, direction: str) -> dict[str, Any]:
    return mapping(electricity(data).get(direction))


def is_v2(data: dict[str, Any] | None) -> bool:
    elec = electricity(data)
    return schema_version(data) >= 2 and (
        isinstance(elec.get("import"), dict) or isinstance(elec.get("export"), dict)
    )


def price_optimisation_supported(data: dict[str, Any] | None) -> bool:
    if is_v2(data):
        flow = electricity_flow(data, "import")
        return flow.get("mode") in {"dynamic", "dynamic_auto"} and flow.get(
            "effective_resolution"
        ) in {"hour", "quarter-hour"}
    return bool(rows(electricity(data).get("today")))


def effective_resolution(data: dict[str, Any] | None) -> str | None:
    flow = electricity_flow(data, "import")
    value = flow.get("effective_resolution") or flow.get("configured_resolution")
    if value:
        return str(value)
    return "hour" if rows(electricity(data).get("today")) else None


def is_fallback(data: dict[str, Any] | None) -> bool:
    return bool(electricity_flow(data, "import").get("is_fallback"))


def requires_tariff_selection(data: dict[str, Any] | None) -> bool:
    current = mapping(electricity_flow(data, "import").get("current"))
    return bool(current.get("requires_tariff_selection"))


def electricity_periods(
    data: dict[str, Any] | None, day: str
) -> list[dict[str, Any]]:
    """Return periods in the integration's canonical consumer/feed-in shape."""
    elec = electricity(data)
    if not is_v2(data):
        return rows(elec.get(day))
    imports = rows(electricity_flow(data, "import").get(day))
    exports = {
        str(item.get("start") or ""): item
        for item in rows(electricity_flow(data, "export").get(day))
    }
    return [
        {
            **item,
            "consumer": number(item.get("price")),
            "feed_in": number(
                exports.get(str(item.get("start") or ""), {}).get("price")
            ),
            "export_market": number(
                exports.get(str(item.get("start") or ""), {}).get("market")
            ),
        }
        for item in imports
    ]


def current_electricity(data: dict[str, Any] | None) -> dict[str, Any] | None:
    elec = electricity(data)
    if not is_v2(data):
        current = elec.get("current")
        return current if isinstance(current, dict) else None
    imported = mapping(electricity_flow(data, "import").get("current"))
    exported = mapping(electricity_flow(data, "export").get("current"))
    if not imported and not exported:
        return None
    return {
        **imported,
        "consumer": number(imported.get("price")),
        "feed_in": number(exported.get("price")),
        "export_market": number(exported.get("market")),
    }


def electricity_summary(data: dict[str, Any] | None) -> dict[str, Any]:
    return mapping(electricity(data).get("summary")) or mapping(
        mapping(data).get("summary")
    )


def electricity_forecast(data: dict[str, Any] | None) -> list[dict[str, Any]]:
    return rows(electricity(data).get("forecast"))


def commodity_price(data: dict[str, Any] | None, commodity: str) -> float | None:
    current = mapping(mapping(mapping(data).get(commodity)).get("current"))
    return number(current.get("consumer", current.get("price")))


def _tariffs(flow: dict[str, Any]) -> dict[str, float]:
    result: dict[str, float] = {}
    for tariff in rows(flow.get("tariffs")):
        code = str(tariff.get("code") or "").strip().lower()
        price = number(tariff.get("price"))
        if code and price is not None:
            result[code] = price
    return result


def _is_dynamic_mode(mode: Any) -> bool:
    """Whether a commodity flow is priced dynamically rather than per tariff."""
    return str(mode or "").strip().lower() in ("dynamic", "dynamic_auto")


def contract_tariffs(data: dict[str, Any] | None) -> dict[str, float]:
    item = contract(data)
    # The flat tariffs dict is what the server resolved for this request: on a
    # dynamic contract it holds the live price and the feed-in price, where the
    # commodity configuration only keeps the unused fixed-tariff columns.
    resolved = {
        key: value
        for key, raw in mapping(item.get("tariffs")).items()
        if (value := number(raw)) is not None
    }
    if not is_v2(data):
        return resolved
    commodities = mapping(item.get("commodities"))
    elec = mapping(commodities.get("electricity"))
    result: dict[str, float] = {}
    for direction, prefix in (("import", "electricity"), ("export", "feed_in")):
        flow = mapping(elec.get(direction))
        # Per-tariff columns are only a real price on a fixed contract; a
        # dynamic one leaves them at 0 because they are never filled in. A
        # payload that does not state a mode predates the field, so it is
        # read as fixed and keeps working exactly as before.
        if _is_dynamic_mode(flow.get("mode")):
            continue
        # A register the owner never filled in reports 0. That is an absent
        # price, not a free one, so it stays out: the panel keeps the field
        # editable and the cost sensors keep using the owner's own value.
        tariffs = {
            code: value for code, value in _tariffs(flow).items() if value > 0
        }
        result.update(
            {f"{prefix}_{code}": value for code, value in tariffs.items()}
        )
        # One fixed export price for both registers is simply "the" feed-in
        # price, which is the key the cost sensors read.
        if direction == "export" and len(set(tariffs.values())) == 1:
            result["feed_in"] = next(iter(tariffs.values()))
    for name in ("gas", "water"):
        commodity = mapping(commodities.get(name))
        value = number(commodity.get("price"))
        # An unconfigured commodity reports 0, which must not pass as a
        # contract price and hide the user's own price field. Only an explicit
        # denial counts: a payload that predates the flag keeps its price.
        if commodity.get("configured", True) and value is not None:
            result[name] = value
    result.update(resolved)
    return result


def fixed_cost(data: dict[str, Any] | None, period: str) -> float | None:
    return number(
        mapping(contract(data).get("cost_breakdown")).get(
            f"net_fixed_cost_{period}"
        )
    )


def contract_provider(data: dict[str, Any] | None) -> str | None:
    item = contract(data)
    details = mapping(item.get("provider_details"))
    value = details.get("name") or item.get("provider") or item.get("supplier")
    return str(value) if value else None


def tariff_price(
    data: dict[str, Any] | None, direction: str, code: str
) -> float | None:
    prefix = "electricity" if direction == "import" else "feed_in"
    return number(contract_tariffs(data).get(f"{prefix}_{code.lower()}"))
