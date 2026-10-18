"""Shared utility meter creation for P1 energy products."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event

from ....const import LOGGER

METER_CYCLES = ["daily", "weekly", "monthly", "yearly"]

# Dutch meters publish gas on OBIS 24.2.1, Belgian meters on 24.2.3, which
# the firmware exposes as its own register.
GAS_SOURCE_SUFFIXES = ("gas_consumed", "gas_consumed_belgium")


def gas_source_candidates(
    entity_base: str, sources: dict[str, str] | None = None
) -> list[str]:
    """List the possible DSMR gas totals, renamed registry entities first."""
    sources = sources or {}
    candidates = [sources[suffix] for suffix in GAS_SOURCE_SUFFIXES if sources.get(suffix)]
    candidates.extend(f"{entity_base}_{suffix}" for suffix in GAS_SOURCE_SUFFIXES)
    return list(dict.fromkeys(candidates))


def _has_reading(hass: HomeAssistant, entity_id: str) -> bool:
    """Has this sensor published a number rather than unknown or unavailable?"""
    state = hass.states.get(entity_id)
    if state is None:
        return False
    try:
        float(state.state)
    except (TypeError, ValueError):
        return False
    return True


def resolve_gas_source(
    hass: HomeAssistant, entity_base: str, sources: dict[str, str] | None = None
) -> str | None:
    """Return the DSMR gas total that reports a reading, including the Belgian variant.

    The firmware defines its gas sensors whether or not a gas meter is
    connected, so an existing entity proves nothing: without a gas meter it
    never gets a reading, and a Belgian meter only fills its own register.
    """
    return next(
        (
            entity_id
            for entity_id in gas_source_candidates(entity_base, sources)
            if _has_reading(hass, entity_id)
        ),
        None,
    )


async def async_setup_gas_utility_meters(
    hass: HomeAssistant, label: str, uid_prefix: str, source: str
) -> int:
    """Create the daily/weekly/monthly/yearly gas meters for one gas total."""
    created = 0
    for cycle in METER_CYCLES:
        if await create_single_utility_meter(
            hass,
            name=f"{label} Gas {cycle.capitalize()} (CC)",
            source=source,
            cycle=cycle,
            unique_id=f"{uid_prefix}_gas_{cycle}",
        ):
            created += 1
    LOGGER.info("Gas utility meters ready for %s (%d meters)", label, created)
    return created


@callback
def async_create_gas_meters_once_seen(
    hass: HomeAssistant,
    entry: ConfigEntry,
    label: str,
    uid_prefix: str,
    entity_base: str,
    sources: dict[str, str] | None = None,
) -> None:
    """Create the gas utility meters once the P1 meter has reported gas.

    Meters made from a gas total without readings stay unknown in every home
    without a gas meter. Waiting for the first reading also covers a device
    that is still offline at startup and a gas meter that is added later.
    This is the only place that creates gas meters, so a reading that arrives
    during setup cannot create them twice.
    """
    unsubscribe: CALLBACK_TYPE | None = None

    @callback
    def _create(source: str) -> None:
        hass.async_create_task(
            async_setup_gas_utility_meters(hass, label, uid_prefix, source)
        )

    @callback
    def _state_changed(_event) -> None:
        nonlocal unsubscribe
        if unsubscribe is None:
            return
        source = resolve_gas_source(hass, entity_base, sources)
        if source is None:
            return
        unsubscribe()
        unsubscribe = None
        _create(source)

    @callback
    def _stop_watching() -> None:
        if unsubscribe is not None:
            unsubscribe()

    source = resolve_gas_source(hass, entity_base, sources)
    if source is not None:
        _create(source)
        return

    LOGGER.debug("No gas reading for %s yet; gas meters follow the first one", label)
    unsubscribe = async_track_state_change_event(
        hass, gas_source_candidates(entity_base, sources), _state_changed
    )
    entry.async_on_unload(_stop_watching)


async def async_setup_energy_utility_meters(
    hass: HomeAssistant,
    label: str,
    uid_prefix: str,
    entity_base: str,
) -> None:
    """Create daily/weekly/monthly/yearly energy utility meters.

    Gas meters follow the first gas reading instead, see
    async_create_gas_meters_once_seen.

    label:       display prefix, e.g. "P1 776c6c"
    uid_prefix:  unique id prefix, e.g. "p1_776c6c"
    entity_base: ESPHome entity prefix, e.g. "sensor.p1meterkit_776c6c"
    """
    consumed_t1 = f"{entity_base}_energy_consumed_tariff_1"
    consumed_t2 = f"{entity_base}_energy_consumed_tariff_2"

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
            current_source = entry.options.get("source")
            needs_reset_mode = entry.options.get("periodically_resetting", False) != periodically_resetting
            if current_source != source or needs_reset_mode:
                hass.config_entries.async_update_entry(
                    entry,
                    options={**entry.options, "source": source, **({"periodically_resetting": periodically_resetting} if needs_reset_mode else {})},
                )
                LOGGER.info(
                    "Updated utility meter %s source from %s to %s",
                    name,
                    current_source or "an unset entity",
                    source,
                )
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
