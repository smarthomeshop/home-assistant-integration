"""Config flow for SmartHomeShop.io integration."""

from __future__ import annotations

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
    CONF_FLOW_SENSOR,
    CONF_PRODUCT_TYPE,
    CONF_WATER_SENSOR,
    DEFAULT_CONTINUOUS_FLOW_MINUTES,
    DEFAULT_NIGHT_END,
    DEFAULT_NIGHT_START,
    DOMAIN,
    LOGGER,
    PRODUCT_CEILSENSE,
    PRODUCT_NAMES,
    PRODUCT_P1METERKIT,
    PRODUCT_PATTERNS,
    PRODUCT_ULTIMATESENSOR,
    PRODUCT_ULTIMATESENSOR_MINI,
    PRODUCT_WATERFLOWKIT,
    PRODUCT_WATERMETERKIT,
    PRODUCT_WATERP1METERKIT,
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

            # Get all entities for this device
            device_entities = list(
                er.async_entries_for_device(entity_registry, device.id)
            )

            # Check if any entity matches our product pattern
            is_match = False
            for entity in device_entities:
                entity_id_lower = entity.entity_id.lower()
                for pattern in patterns:
                    if pattern in entity_id_lower:
                        is_match = True
                        LOGGER.debug("Found matching entity: %s", entity.entity_id)
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

        water_sensor: str | None = None
        flow_sensor: str | None = None

        for entity in er.async_entries_for_device(entity_registry, device_id):
            if entity.domain != "sensor":
                continue

            entity_id = entity.entity_id.lower()

            # Find water meter total sensor
            if (
                entity.original_device_class == "water"
                or "water_total_consumption" in entity_id
                or "water_meter_total" in entity_id
            ):
                if "total" in entity_id or "consumption" in entity_id:
                    water_sensor = entity.entity_id
                    LOGGER.debug("Found water sensor: %s", water_sensor)

            # Find flow rate sensor
            if (
                entity.original_device_class == "volume_flow_rate"
                or "water_current_usage" in entity_id
                or "flow_rate" in entity_id
            ):
                flow_sensor = entity.entity_id
                LOGGER.debug("Found flow sensor: %s", flow_sensor)

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
                                    label=product_name,
                                )
                                for product_id, product_name in PRODUCT_NAMES.items()
                            ],
                            mode=selector.SelectSelectorMode.LIST,
                        )
                    )
                }
            ),
        )

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

                        # For other products, create entry directly
                        return self._create_entry()
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
                "product_name": PRODUCT_NAMES.get(self._product_type, self._product_type)
            },
        )

    async def async_step_water_options(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle water product options."""
        if user_input is not None:
            return self._create_entry(options=user_input)

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
            return self.async_create_entry(title="", data=user_input)

        product_type = self.config_entry.data.get(CONF_PRODUCT_TYPE)

        # Water product options
        if product_type in (PRODUCT_WATERP1METERKIT, PRODUCT_WATERMETERKIT, PRODUCT_WATERFLOWKIT):
            current_options = self.config_entry.options

            return self.async_show_form(
                step_id="init",
                data_schema=vol.Schema(
                    {
                        vol.Required(
                            CONF_CONTINUOUS_FLOW_MINUTES,
                            default=current_options.get(
                                CONF_CONTINUOUS_FLOW_MINUTES, DEFAULT_CONTINUOUS_FLOW_MINUTES
                            ),
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
                            default=current_options.get(CONF_NIGHT_START, DEFAULT_NIGHT_START),
                        ): selector.TimeSelector(),
                        vol.Required(
                            CONF_NIGHT_END,
                            default=current_options.get(CONF_NIGHT_END, DEFAULT_NIGHT_END),
                        ): selector.TimeSelector(),
                        vol.Optional(
                            CONF_VACATION_MODE_ENTITY,
                            default=current_options.get(CONF_VACATION_MODE_ENTITY, ""),
                        ): selector.EntitySelector(
                            selector.EntitySelectorConfig(domain="input_boolean")
                        ),
                    }
                ),
            )

        # Default: no options
        return self.async_create_entry(title="", data={})







