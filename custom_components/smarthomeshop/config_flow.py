"""Config flow for SmartHomeShop.io integration."""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import selector

from .const import (
    CONF_DEVICE_ID,
    CONF_MAIN_FUSE_AMPS,
    CONF_PRICE_FEED_IN,
    CONF_PRICE_GAS,
    CONF_PRICE_T1,
    CONF_PRICE_T2,
    CONF_PRICE_WATER,
    DEFAULT_MAIN_FUSE_AMPS,
    DEFAULT_PRICE_FEED_IN,
    DEFAULT_PRICE_GAS,
    DEFAULT_PRICE_T1,
    DEFAULT_PRICE_T2,
    DEFAULT_PRICE_WATER,
    CONF_FLOW_SENSOR,
    CONF_PRODUCT_TYPE,
    CONF_WATER_SENSOR,
    DEFAULT_CONTINUOUS_FLOW_MINUTES,
    DEFAULT_NIGHT_END,
    DEFAULT_NIGHT_START,
    DOMAIN,
    LOGGER,
    PRODUCT_CEILSENSE,
    PRODUCT_DESCRIPTIONS,
    PRODUCT_NAMES,
    PRODUCT_P1METERKIT,
    PRODUCT_PATTERNS,
    PRODUCT_SELECT_LABELS,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
    product_for_device,
)

# WaterFlowKit dual sensor config keys
CONF_FLOW1_WATER_SENSOR = "flow1_water_sensor"
CONF_FLOW1_FLOW_SENSOR = "flow1_flow_sensor"
CONF_FLOW2_WATER_SENSOR = "flow2_water_sensor"
CONF_FLOW2_FLOW_SENSOR = "flow2_flow_sensor"

CONF_CONTINUOUS_FLOW_MINUTES = "continuous_flow_minutes"
CONF_NIGHT_START = "night_start"
CONF_NIGHT_END = "night_end"
CONF_VACATION_MODE_ENTITY = "vacation_mode_entity"


class SmartHomeShopConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for SmartHomeShop.io."""

    VERSION = 1
    MINOR_VERSION = 1

    def __init__(self) -> None:
        """Initialize the config flow."""
        self._product_type: str | None = None
        self._device_id: str | None = None
        self._device_name: str | None = None
        self._water_sensor: str | None = None
        self._flow_sensor: str | None = None
        # WaterFlowKit dual sensors
        self._flow1_water_sensor: str | None = None
        self._flow1_flow_sensor: str | None = None
        self._flow2_water_sensor: str | None = None
        self._flow2_flow_sensor: str | None = None
        self._pending_options: dict[str, Any] | None = None

    def _find_devices_for_product(self, product_type: str) -> dict[str, str]:
        """Find all ESPHome devices matching the product type."""
        device_registry = dr.async_get(self.hass)
        entity_registry = er.async_get(self.hass)

        devices: dict[str, str] = {}
        patterns = PRODUCT_PATTERNS.get(product_type, [])

        LOGGER.debug("Searching for %s devices with patterns: %s", product_type, patterns)

        for device in device_registry.devices.values():
            if not device.name:
                continue

            # Prefer the ESPHome project info from the device registry
            # (manufacturer "smarthomeshop" + model), since entity IDs are
            # based on the user-chosen device name.
            model_product = product_for_device(device.manufacturer, device.model)
            if model_product is not None and model_product != product_type:
                # SmartHomeShop device, but a different product
                continue

            is_match = model_product == product_type
            if is_match:
                LOGGER.debug(
                    "Matched device %s via model %s", device.name, device.model
                )
            else:
                # Fallback for firmware without ESPHome project info:
                # check if any entity_id matches the product pattern
                device_entities = list(
                    er.async_entries_for_device(entity_registry, device.id)
                )
                for entity in device_entities:
                    entity_id_lower = entity.entity_id.lower()
                    for pattern in patterns:
                        if pattern in entity_id_lower:
                            is_match = True
                            LOGGER.debug(
                                "Found matching entity: %s", entity.entity_id
                            )
                            break
                    if is_match:
                        break

            if is_match:
                # Check if already configured
                existing_entries = self._async_current_entries()
                already_configured = any(
                    entry.data.get(CONF_DEVICE_ID) == device.id
                    for entry in existing_entries
                )

                if not already_configured:
                    devices[device.id] = device.name
                    LOGGER.debug("Adding device: %s (%s)", device.name, device.id)

        LOGGER.info("Found %d %s device(s)", len(devices), product_type)
        return devices

    def _find_sensors_for_device(self, device_id: str) -> tuple[str | None, str | None]:
        """Find water and flow sensors for a device."""
        entity_registry = er.async_get(self.hass)

        water_meter_total: str | None = None
        water_total_consumption: str | None = None
        water_generic: str | None = None
        flow_sensor: str | None = None

        for entity in er.async_entries_for_device(entity_registry, device_id):
            if entity.domain != "sensor" or entity.disabled_by is not None:
                continue

            entity_id = entity.entity_id.lower()
            entity_identity = re.sub(
                r"[^a-z0-9]+",
                "_",
                " ".join(
                    value or ""
                    for value in (
                        entity.entity_id,
                        entity.unique_id,
                        entity.name,
                        entity.original_name,
                    )
                ).lower(),
            )

            # Water total: prefer the firmware's calibrated "Water Meter Total"
            # (persisted on-device via "Water Meter Initial Value") over the raw
            # pulse counter "Water Total Consumption".
            if "water_meter_total" in entity_identity:
                water_meter_total = entity.entity_id
            elif "water_total_consumption" in entity_identity:
                water_total_consumption = entity.entity_id
            elif entity.original_device_class == "water" and (
                "total" in entity_id or "consumption" in entity_id
            ):
                water_generic = entity.entity_id

            # Find flow rate sensor
            if (
                entity.original_device_class == "volume_flow_rate"
                or "water_current_usage" in entity_id
                or "flow_rate" in entity_id
            ):
                flow_sensor = entity.entity_id
                LOGGER.debug("Found flow sensor: %s", flow_sensor)

        water_sensor = water_meter_total or water_total_consumption or water_generic
        if water_sensor:
            LOGGER.debug("Found water sensor: %s", water_sensor)

        return water_sensor, flow_sensor

    def _find_waterflowkit_sensors(
        self, device_id: str
    ) -> dict[str, str | None]:
        """Find Flow1 and Flow2 sensors for WaterFlowKit device."""
        entity_registry = er.async_get(self.hass)

        sensors: dict[str, str | None] = {
            "flow1_water": None,
            "flow1_flow": None,
            "flow2_water": None,
            "flow2_flow": None,
        }

        for entity in er.async_entries_for_device(entity_registry, device_id):
            if entity.domain != "sensor":
                continue

            entity_id = entity.entity_id.lower()

            # Flow1 sensors
            if "flow1" in entity_id:
                if "total_consumption" in entity_id:
                    sensors["flow1_water"] = entity.entity_id
                    LOGGER.debug("Found Flow1 water sensor: %s", entity.entity_id)
                elif "current" in entity_id and "usage" in entity_id:
                    sensors["flow1_flow"] = entity.entity_id
                    LOGGER.debug("Found Flow1 flow sensor: %s", entity.entity_id)

            # Flow2 sensors
            if "flow2" in entity_id:
                if "total_consumption" in entity_id:
                    sensors["flow2_water"] = entity.entity_id
                    LOGGER.debug("Found Flow2 water sensor: %s", entity.entity_id)
                elif "current" in entity_id and "usage" in entity_id:
                    sensors["flow2_flow"] = entity.entity_id
                    LOGGER.debug("Found Flow2 flow sensor: %s", entity.entity_id)

        LOGGER.info(
            "WaterFlowKit sensors found - Flow1: %s, Flow2: %s",
            sensors["flow1_water"],
            sensors["flow2_water"],
        )
        return sensors

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step - select product type."""
        if user_input is not None:
            self._product_type = user_input[CONF_PRODUCT_TYPE]
            return await self.async_step_device()

        # Show product selection
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_PRODUCT_TYPE): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[
                                selector.SelectOptionDict(
                                    value=product_id,
                                    label=PRODUCT_SELECT_LABELS.get(
                                        product_id, product_name
                                    ),
                                )
                                for product_id, product_name in PRODUCT_NAMES.items()
                            ],
                            mode=selector.SelectSelectorMode.LIST,
                        )
                    )
                }
            ),
        )

    async def async_step_import(
        self, import_data: dict[str, Any]
    ) -> ConfigFlowResult:
        """Create an entry programmatically (one-click link from the panel).

        Runs the same device validation and sensor detection as the UI flow,
        but without any forms. Water products get the default leak-detection
        options; everything is tunable afterwards in the panel Settings tab.
        """
        product_type = import_data.get(CONF_PRODUCT_TYPE)
        device_id = import_data.get(CONF_DEVICE_ID)
        if not device_id or product_type not in PRODUCT_NAMES:
            return self.async_abort(reason="invalid_link_request")

        device = dr.async_get(self.hass).async_get(device_id)
        if device is None:
            return self.async_abort(reason="device_not_found")

        self._product_type = product_type
        self._device_id = device_id
        self._device_name = device.name_by_user or device.name or "Device"

        await self.async_set_unique_id(f"{product_type}_{device_id}")
        self._abort_if_unique_id_configured()

        if product_type == PRODUCT_WATERFLOWKIT:
            sensors = self._find_waterflowkit_sensors(device_id)
            if not sensors["flow1_water"] and not sensors["flow2_water"]:
                return self.async_abort(reason="no_water_sensor")
            self._flow1_water_sensor = sensors["flow1_water"]
            self._flow1_flow_sensor = sensors["flow1_flow"]
            self._flow2_water_sensor = sensors["flow2_water"]
            self._flow2_flow_sensor = sensors["flow2_flow"]
        else:
            water_sensor, flow_sensor = self._find_sensors_for_device(device_id)
            if not water_sensor and product_type in (
                PRODUCT_WATERP1METERKIT, PRODUCT_WATERMETERKIT
            ):
                return self.async_abort(reason="no_water_sensor")
            self._water_sensor = water_sensor
            self._flow_sensor = flow_sensor

        options: dict[str, Any] | None = None
        if product_type in (
            PRODUCT_WATERP1METERKIT, PRODUCT_WATERMETERKIT, PRODUCT_WATERFLOWKIT
        ):
            options = {
                CONF_CONTINUOUS_FLOW_MINUTES: DEFAULT_CONTINUOUS_FLOW_MINUTES,
                CONF_NIGHT_START: DEFAULT_NIGHT_START,
                CONF_NIGHT_END: DEFAULT_NIGHT_END,
            }

        return self._create_entry(options=options)

    async def async_step_device(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the device selection step."""
        errors: dict[str, str] = {}

        # Find devices for selected product
        devices = self._find_devices_for_product(self._product_type)

        if not devices:
            return self.async_abort(reason="no_devices_found")

        if user_input is not None:
            device_id = user_input.get(CONF_DEVICE_ID)

            if device_id and device_id in devices:
                self._device_id = device_id
                self._device_name = devices[device_id]

                # WaterFlowKit has dual sensors
                if self._product_type == PRODUCT_WATERFLOWKIT:
                    sensors = self._find_waterflowkit_sensors(device_id)

                    if not sensors["flow1_water"] and not sensors["flow2_water"]:
                        errors["base"] = "no_water_sensor"
                    else:
                        self._flow1_water_sensor = sensors["flow1_water"]
                        self._flow1_flow_sensor = sensors["flow1_flow"]
                        self._flow2_water_sensor = sensors["flow2_water"]
                        self._flow2_flow_sensor = sensors["flow2_flow"]

                        # Set unique ID
                        await self.async_set_unique_id(f"{self._product_type}_{device_id}")
                        self._abort_if_unique_id_configured()

                        return await self.async_step_water_options()
                else:
                    # Find sensors automatically for other products
                    water_sensor, flow_sensor = self._find_sensors_for_device(device_id)

                    if not water_sensor and self._product_type in (
                        PRODUCT_WATERP1METERKIT, PRODUCT_WATERMETERKIT
                    ):
                        errors["base"] = "no_water_sensor"
                    else:
                        self._water_sensor = water_sensor
                        self._flow_sensor = flow_sensor

                        # Set unique ID
                        await self.async_set_unique_id(f"{self._product_type}_{device_id}")
                        self._abort_if_unique_id_configured()

                        # For water products, go to options step
                        if self._product_type in (PRODUCT_WATERP1METERKIT, PRODUCT_WATERMETERKIT):
                            return await self.async_step_water_options()

                        # For other products, show the summary step
                        self._pending_options = None
                        return await self.async_step_summary()
            else:
                errors[CONF_DEVICE_ID] = "device_not_found"

        return self.async_show_form(
            step_id="device",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_DEVICE_ID): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[
                                selector.SelectOptionDict(value=dev_id, label=dev_name)
                                for dev_id, dev_name in devices.items()
                            ],
                            mode=selector.SelectSelectorMode.LIST,
                        )
                    )
                }
            ),
            errors=errors,
            description_placeholders={
                "product_name": PRODUCT_NAMES.get(
                    self._product_type, self._product_type
                ),
                "product_description": PRODUCT_DESCRIPTIONS.get(
                    self._product_type, ""
                ),
            },
        )

    async def async_step_water_options(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle water product options."""
        if user_input is not None:
            self._pending_options = user_input
            return await self.async_step_summary()

        return self.async_show_form(
            step_id="water_options",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_CONTINUOUS_FLOW_MINUTES,
                        default=DEFAULT_CONTINUOUS_FLOW_MINUTES,
                    ): selector.NumberSelector(
                        selector.NumberSelectorConfig(
                            min=5,
                            max=120,
                            step=5,
                            mode=selector.NumberSelectorMode.SLIDER,
                            unit_of_measurement="min",
                        )
                    ),
                    vol.Required(
                        CONF_NIGHT_START,
                        default=DEFAULT_NIGHT_START,
                    ): selector.TimeSelector(),
                    vol.Required(
                        CONF_NIGHT_END,
                        default=DEFAULT_NIGHT_END,
                    ): selector.TimeSelector(),
                    vol.Optional(CONF_VACATION_MODE_ENTITY): selector.EntitySelector(
                        selector.EntitySelectorConfig(domain="input_boolean")
                    ),
                }
            ),
            description_placeholders=self._get_water_placeholders(),
        )

    async def async_step_summary(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show which entities will be created before finishing."""
        if user_input is not None:
            return self._create_entry(options=self._pending_options)

        return self.async_show_form(
            step_id="summary",
            data_schema=vol.Schema({}),
            description_placeholders={
                "product_name": PRODUCT_NAMES.get(self._product_type, "Device"),
                "device_name": self._device_name or "",
                "entities": self._entity_overview(),
            },
        )

    def _entity_overview(self) -> str:
        """Human readable list of entities this product will add."""
        if self._product_type in (PRODUCT_WATERP1METERKIT, PRODUCT_WATERMETERKIT):
            return (
                "- Current water usage + usage today / this week / this month / this year\n"
                "- Water meter reading with manual calibration\n"
                "- Leak alarm with smart leak detection (continuous flow, night usage, micro leak, vacation mode)\n"
                "- Leak score with continuous-flow, night-usage and micro-leak sub-scores\n"
                "- Water cost today, usage vs 7-day average and last water session\n"
                "- Daily / weekly / monthly / yearly utility meters for the Home Assistant energy dashboard"
            )
        if self._product_type == PRODUCT_WATERFLOWKIT:
            return (
                "- Usage and utility meters for both water lines (Flow 1 and Flow 2)\n"
                "- Leak alarm with smart leak detection per line\n"
                "- Daily / weekly / monthly / yearly utility meters"
            )
        if self._product_type in (PRODUCT_ULTIMATESENSOR, PRODUCT_ULTIMATESENSOR_MINI):
            return (
                "- Room Quality score (1-10) based on CO2, particulate matter, VOC, temperature and humidity\n"
                "- Room Quality label and percentage with ventilation recommendations\n"
                "- Access to the Room Designer panel for zones, entry lines and people counting"
            )
        if self._product_type == PRODUCT_P1METERKIT:
            return (
                "- Standby (always-on) power with estimated yearly cost\n"
                "- Month peak power (quarter-hour average, for capacity tariffs)\n"
                "- Energy cost today and this month, using your own rates (set via Configure)\n"
                "- Highest phase load compared to your main fuse\n"
                "- Daily / weekly / monthly / yearly energy and gas utility meters"
            )
        return "- SmartHomeShop enhancements for this product"

    def _get_water_placeholders(self) -> dict[str, str]:
        """Get description placeholders for water options step."""
        if self._product_type == PRODUCT_WATERFLOWKIT:
            return {
                "water_sensor": (
                    f"Flow1: {self._flow1_water_sensor or 'Not found'}, "
                    f"Flow2: {self._flow2_water_sensor or 'Not found'}"
                ),
                "flow_sensor": (
                    f"Flow1: {self._flow1_flow_sensor or 'Not found'}, "
                    f"Flow2: {self._flow2_flow_sensor or 'Not found'}"
                ),
            }
        return {
            "water_sensor": self._water_sensor or "Not found",
            "flow_sensor": self._flow_sensor or "Not found",
        }

    def _create_entry(self, options: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Create the config entry."""
        data: dict[str, Any] = {
            CONF_PRODUCT_TYPE: self._product_type,
            CONF_DEVICE_ID: self._device_id,
        }

        # WaterFlowKit has dual sensors
        if self._product_type == PRODUCT_WATERFLOWKIT:
            data[CONF_FLOW1_WATER_SENSOR] = self._flow1_water_sensor
            data[CONF_FLOW1_FLOW_SENSOR] = self._flow1_flow_sensor
            data[CONF_FLOW2_WATER_SENSOR] = self._flow2_water_sensor
            data[CONF_FLOW2_FLOW_SENSOR] = self._flow2_flow_sensor
        else:
            data[CONF_WATER_SENSOR] = self._water_sensor
            data[CONF_FLOW_SENSOR] = self._flow_sensor

        title = f"{PRODUCT_NAMES.get(self._product_type, 'Device')} - {self._device_name}"

        return self.async_create_entry(
            title=title,
            data=data,
            options=options or {},
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Get the options flow for this handler."""
        return SmartHomeShopOptionsFlow()


class SmartHomeShopOptionsFlow(OptionsFlow):
    """Handle SmartHomeShop options."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the options."""
        if user_input is not None:
            # An omitted vacation entity means "none": store it as empty so a
            # previously chosen entity is actually cleared.
            user_input.setdefault(CONF_VACATION_MODE_ENTITY, "")
            return self.async_create_entry(title="", data=user_input)

        product_type = self.config_entry.data.get(CONF_PRODUCT_TYPE)
        current = self.config_entry.options
        schema: dict[Any, Any] = {}

        is_water = product_type in (
            PRODUCT_WATERP1METERKIT, PRODUCT_WATERMETERKIT, PRODUCT_WATERFLOWKIT
        )
        is_energy = product_type in (PRODUCT_WATERP1METERKIT, PRODUCT_P1METERKIT)

        if is_water:
            schema[vol.Required(
                CONF_CONTINUOUS_FLOW_MINUTES,
                default=current.get(CONF_CONTINUOUS_FLOW_MINUTES, DEFAULT_CONTINUOUS_FLOW_MINUTES),
            )] = selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=5, max=120, step=5,
                    mode=selector.NumberSelectorMode.SLIDER,
                    unit_of_measurement="min",
                )
            )
            schema[vol.Required(
                CONF_NIGHT_START,
                default=current.get(CONF_NIGHT_START, DEFAULT_NIGHT_START),
            )] = selector.TimeSelector()
            schema[vol.Required(
                CONF_NIGHT_END,
                default=current.get(CONF_NIGHT_END, DEFAULT_NIGHT_END),
            )] = selector.TimeSelector()
            # No empty-string default here: EntitySelector rejects "" during
            # schema validation, which blocked saving any option when no
            # vacation entity was picked and made a chosen one impossible to
            # clear. suggested_value prefills without forcing a value.
            schema[vol.Optional(
                CONF_VACATION_MODE_ENTITY,
                description={
                    "suggested_value": current.get(CONF_VACATION_MODE_ENTITY) or None
                },
            )] = selector.EntitySelector(
                selector.EntitySelectorConfig(domain="input_boolean")
            )
            schema[vol.Required(
                CONF_PRICE_WATER,
                default=current.get(CONF_PRICE_WATER, DEFAULT_PRICE_WATER),
            )] = selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0, max=15, step=0.01,
                    mode=selector.NumberSelectorMode.BOX,
                    unit_of_measurement="€/m³",
                )
            )

        if is_energy:
            price_box = lambda unit, maximum=5.0: selector.NumberSelector(  # noqa: E731
                selector.NumberSelectorConfig(
                    min=0, max=maximum, step=0.001,
                    mode=selector.NumberSelectorMode.BOX,
                    unit_of_measurement=unit,
                )
            )
            schema[vol.Required(
                CONF_PRICE_T1, default=current.get(CONF_PRICE_T1, DEFAULT_PRICE_T1),
            )] = price_box("€/kWh")
            schema[vol.Required(
                CONF_PRICE_T2, default=current.get(CONF_PRICE_T2, DEFAULT_PRICE_T2),
            )] = price_box("€/kWh")
            schema[vol.Required(
                CONF_PRICE_FEED_IN, default=current.get(CONF_PRICE_FEED_IN, DEFAULT_PRICE_FEED_IN),
            )] = price_box("€/kWh")
            schema[vol.Required(
                CONF_PRICE_GAS, default=current.get(CONF_PRICE_GAS, DEFAULT_PRICE_GAS),
            )] = price_box("€/m³", 15.0)
            schema[vol.Required(
                CONF_MAIN_FUSE_AMPS, default=current.get(CONF_MAIN_FUSE_AMPS, DEFAULT_MAIN_FUSE_AMPS),
            )] = selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=10, max=80, step=1,
                    mode=selector.NumberSelectorMode.BOX,
                    unit_of_measurement="A",
                )
            )

        if schema:
            return self.async_show_form(step_id="init", data_schema=vol.Schema(schema))

        # Default: no options
        return self.async_create_entry(title="", data={})




