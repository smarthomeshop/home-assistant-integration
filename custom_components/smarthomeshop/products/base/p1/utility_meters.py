"""Shared utility meter creation for P1 energy products."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ....const import LOGGER

METER_CYCLES = ["daily", "weekly", "monthly", "yearly"]


async def async_setup_energy_utility_meters(
    hass: HomeAssistant,
    label: str,
    uid_prefix: str,
    entity_base: str,
) -> None:
    """Create daily/weekly/monthly/yearly energy (+gas) utility meters.

    label:       display prefix, e.g. "P1 776c6c"
    uid_prefix:  unique id prefix, e.g. "p1_776c6c"
    entity_base: ESPHome entity prefix, e.g. "sensor.p1meterkit_776c6c"
    """
    consumed_t1 = f"{entity_base}_energy_consumed_tariff_1"
    consumed_t2 = f"{entity_base}_energy_consumed_tariff_2"
    gas_entity = f"{entity_base}_gas_consumed"

    # Returned energy entities differ per firmware generation
    returned_entities = {
        "t1": [f"{entity_base}_energy_produced_tariff_1", f"{entity_base}_energy_returned_tariff_1"],
        "t2": [f"{entity_base}_energy_produced_tariff_2", f"{entity_base}_energy_returned_tariff_2"],
    }

    created = 0
    for cycle in METER_CYCLES:
        if await create_single_utility_meter(
            hass,
            name=f"{label} Energy {cycle.capitalize()} T1 (CC)",
            source=consumed_t1,
            cycle=cycle,
            unique_id=f"{uid_prefix}_energy_{cycle}_t1",
        ):
            created += 1
        if await create_single_utility_meter(
            hass,
            name=f"{label} Energy {cycle.capitalize()} T2 (CC)",
            source=consumed_t2,
            cycle=cycle,
            unique_id=f"{uid_prefix}_energy_{cycle}_t2",
        ):
            created += 1

    for tariff, candidates in returned_entities.items():
        source = next((e for e in candidates if hass.states.get(e)), None)
        if not source:
            continue
        for cycle in METER_CYCLES:
            if await create_single_utility_meter(
                hass,
                name=f"{label} Energy Returned {cycle.capitalize()} {tariff.upper()} (CC)",
                source=source,
                cycle=cycle,
                unique_id=f"{uid_prefix}_energy_returned_{cycle}_{tariff}",
            ):
                created += 1

    if hass.states.get(gas_entity):
        for cycle in METER_CYCLES:
            if await create_single_utility_meter(
                hass,
                name=f"{label} Gas {cycle.capitalize()} (CC)",
                source=gas_entity,
                cycle=cycle,
                unique_id=f"{uid_prefix}_gas_{cycle}",
            ):
                created += 1

    LOGGER.info("Energy utility meters ready for %s (%d meters)", label, created)


async def create_single_utility_meter(
    hass: HomeAssistant,
    name: str,
    source: str,
    cycle: str,
    unique_id: str,
    periodically_resetting: bool = False,
) -> bool:
    """Create a single utility meter helper if it doesn't exist yet."""
    for entry in hass.config_entries.async_entries("utility_meter"):
        entry_name = entry.options.get("name", entry.title)
        if entry_name == name:
            LOGGER.debug("Utility meter config entry for '%s' already exists", name)
            return True

    ent_reg = er.async_get(hass)
    name_slug = name.lower().replace(" ", "_").replace("-", "_")
    for entity in ent_reg.entities.values():
        if entity.platform == "utility_meter" and name_slug in entity.entity_id:
            LOGGER.debug("Utility meter entity for '%s' already exists", name)
            return True

    try:
        result = await hass.config_entries.flow.async_init(
            "utility_meter",
            context={"source": "user"},
            data={
                "name": name,
                "source": source,
                "cycle": cycle,
                "offset": 0,
                "tariffs": [],
                "net_consumption": False,
                "delta_values": False,
                "periodically_resetting": periodically_resetting,
                "always_available": True,
            },
        )

        if result.get("type") == "create_entry":
            LOGGER.info("Created utility meter: %s (source: %s, cycle: %s)", name, source, cycle)
            return True
        if result.get("type") == "form" and result.get("step_id") == "user":
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"],
                user_input={
                    "name": name,
                    "source": source,
                    "cycle": cycle,
                    "offset": 0,
                    "net_consumption": False,
                    "delta_values": False,
                    "periodically_resetting": periodically_resetting,
                    "always_available": True,
                },
            )
            if result.get("type") == "create_entry":
                LOGGER.info("Created utility meter: %s", name)
                return True

        LOGGER.debug("Utility meter flow result for %s: %s", name, result.get("type"))
        return False

    except Exception as err:  # noqa: BLE001
        LOGGER.warning("Could not create utility meter %s: %s", name, err)
        return False
