"""Contract tests for SmartHomeShop Cloud Energy API schema v2."""

from custom_components.smarthomeshop import energy_api


def _contract(contract_type: str = "dynamic") -> dict:
    return {
        "name": "Test contract",
        "type": contract_type,
        "provider_details": {"name": "Test Energy"},
        "cost_breakdown": {
            "net_fixed_cost_daily": 0.42,
            "net_fixed_cost_yearly": 153.3,
        },
        "commodities": {
            "electricity": {
                "import": {
                    "tariffs": [
                        {"code": "T1", "name": "Dal", "price": 0.23},
                        {"code": "T2", "name": "Normaal", "price": 0.31},
                    ]
                },
                "export": {
                    "tariffs": [
                        {"code": "T1", "price": 0.08},
                        {"code": "T2", "price": 0.09},
                    ]
                },
            },
            "gas": {"price": 1.21},
            "water": {"price": 1.05},
        },
    }


def test_schema_v2_uses_authoritative_import_and_export_flows() -> None:
    payload = {
        "schema_version": 2,
        "contract": _contract(),
        "electricity": {
            # Deliberately wrong legacy data: schema v2 must ignore it.
            "current": {"consumer": 99, "feed_in": 99},
            "import": {
                "mode": "dynamic_auto",
                "effective_resolution": "quarter-hour",
                "configured_resolution": "quarter-hour",
                "is_fallback": False,
                "current": {"start": "2026-07-25T12:00:00+02:00", "price": 0.19, "market": 0.07},
                "today": [
                    {
                        "start": "2026-07-25T12:00:00+02:00",
                        "end": "2026-07-25T12:15:00+02:00",
                        "resolution": "quarter-hour",
                        "market": 0.07,
                        "price": 0.19,
                    }
                ],
            },
            "export": {
                "current": {"price": 0.06, "market": 0.07},
                "today": [
                    {
                        "start": "2026-07-25T12:00:00+02:00",
                        "end": "2026-07-25T12:15:00+02:00",
                        "resolution": "quarter-hour",
                        "market": 0.07,
                        "price": 0.06,
                    }
                ],
            },
            "summary": {"average_today": 0.22},
        },
    }

    assert energy_api.current_electricity(payload)["consumer"] == 0.19
    assert energy_api.current_electricity(payload)["feed_in"] == 0.06
    assert energy_api.electricity_periods(payload, "today")[0]["consumer"] == 0.19
    assert energy_api.electricity_periods(payload, "today")[0]["feed_in"] == 0.06
    assert energy_api.effective_resolution(payload) == "quarter-hour"
    assert energy_api.price_optimisation_supported(payload) is True
    assert energy_api.electricity_summary(payload)["average_today"] == 0.22


def test_fixed_dual_tariff_is_never_guessed() -> None:
    payload = {
        "schema_version": 2,
        "contract": _contract("fixed"),
        "electricity": {
            "import": {
                "mode": "fixed",
                "effective_resolution": "tariff",
                "current": {
                    "price": None,
                    "requires_tariff_selection": True,
                },
            },
            "export": {"mode": "fixed", "current": {"price": None}},
        },
    }

    assert energy_api.current_electricity(payload)["consumer"] is None
    assert energy_api.requires_tariff_selection(payload) is True
    assert energy_api.price_optimisation_supported(payload) is False
    assert energy_api.tariff_price(payload, "import", "t1") == 0.23
    assert energy_api.tariff_price(payload, "import", "t2") == 0.31
    assert energy_api.tariff_price(payload, "export", "t1") == 0.08
    assert energy_api.tariff_price(payload, "export", "t2") == 0.09


def test_variable_contract_exposes_commodities_and_fixed_costs() -> None:
    payload = {
        "schema_version": 2,
        "contract": _contract("variable"),
        "electricity": {
            "import": {
                "mode": "fixed",
                "effective_resolution": "tariff",
                "current": {"price": 0.27},
            },
            "export": {"mode": "fixed", "current": {"price": 0.1}},
        },
        "gas": {"configured": True, "current": {"market": None, "consumer": 1.21}},
        "water": {"configured": True, "current": {"market": None, "consumer": 1.05}},
    }

    assert energy_api.contract_type(payload) == "variable"
    assert energy_api.contract_provider(payload) == "Test Energy"
    assert energy_api.commodity_price(payload, "gas") == 1.21
    assert energy_api.commodity_price(payload, "water") == 1.05
    assert energy_api.fixed_cost(payload, "daily") == 0.42
    assert energy_api.fixed_cost(payload, "yearly") == 153.3
    assert energy_api.price_optimisation_supported(payload) is False


def test_hourly_fallback_is_reported_without_losing_dynamic_capability() -> None:
    payload = {
        "schema_version": 2,
        "contract": _contract(),
        "electricity": {
            "import": {
                "mode": "dynamic",
                "configured_resolution": "quarter-hour",
                "effective_resolution": "hour",
                "is_fallback": True,
            },
            "export": {},
        },
    }

    assert energy_api.effective_resolution(payload) == "hour"
    assert energy_api.is_fallback(payload) is True
    assert energy_api.price_optimisation_supported(payload) is True
