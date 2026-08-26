# SmartHomeShop.io Integration for Home Assistant

[![HACS Default](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/default/pull/9476)

Custom integration for Home Assistant to integrate SmartHomeShop.io devices.

## Installation

### HACS (Recommended)

SmartHomeShop.io is included in the default HACS store. You no longer need to
add this repository as a custom repository.

1. Open **HACS** in Home Assistant.
2. Search for **SmartHomeShop.io**.
3. Open the integration and click **Download**.
4. Restart Home Assistant.
5. Go to **Settings > Devices & services > Add integration** and search for
   **SmartHomeShop.io**.

You can also use this button to open the repository directly in HACS:

[![Open your Home Assistant instance and open the SmartHomeShop.io repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=smarthomeshop&repository=home-assistant-integration&category=integration)

The repository was [approved and merged into the HACS default repository
list](https://github.com/hacs/default/pull/9476) on August 1, 2026.

## See SmartHomeShop.io in action

WaterP1MeterKit, WaterMeterKit and P1MeterKit include purpose-built Lovelace
cards. The Smart Energy panel adds live grid, solar and battery flow, source
mapping, Home Assistant Energy sync, ready-to-use automations and complete home
battery planning. The demo below walks through the cards and the full energy
management experience.

[![Watch the SmartHomeShop.io utility card demo](https://raw.githubusercontent.com/smarthomeshop/home-assistant-integration/main/docs/media/smarthomeshop-utility-cards-demo.webp)](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-utility-cards-demo.mp4)

[Watch the full-quality demo video](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-utility-cards-demo.mp4)

### WaterFlowKit

[![Watch the SmartHomeShop.io WaterFlowKit demo](https://raw.githubusercontent.com/smarthomeshop/home-assistant-integration/main/docs/media/smarthomeshop-waterflowkit-demo.webp)](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-waterflowkit-demo.mp4)

### CeilSense

[![Watch the SmartHomeShop.io CeilSense demo](https://raw.githubusercontent.com/smarthomeshop/home-assistant-integration/main/docs/media/smarthomeshop-ceilsense-demo.webp)](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-ceilsense-demo.mp4)

### UltimateSensor and UltimateSensor Mini

[![Watch the SmartHomeShop.io UltimateSensor demo](https://raw.githubusercontent.com/smarthomeshop/home-assistant-integration/main/docs/media/smarthomeshop-ultimatesensor-demo.webp)](https://github.com/smarthomeshop/home-assistant-integration/blob/main/docs/media/smarthomeshop-ultimatesensor-demo.mp4)

### Manual Installation

1. Download the latest release
2. Copy the `custom_components/smarthomeshop` folder to your Home Assistant `custom_components` directory
3. Restart Home Assistant

## Configuration

1. Go to **Settings** > **Devices & Services**
2. Click **Add Integration**
3. Search for "SmartHomeShop.io"
4. Follow the configuration steps

## Dynamic energy and battery planning

The Energy page combines live contract prices with an hourly outlook. Stored
market prices are treated as confirmed; missing future hours can be supplied
as predictions with a confidence score and conservative lower/upper bounds.

The home battery planner is **advice only by default**. Configure it from the
Energy page with:

- the battery state-of-charge sensor, usable capacity and protected reserve;
- maximum charge/discharge power and round-trip efficiency;
- optional solar and house-load forecast sensors;
- battery wear cost, grid import/export limits and a minimum confidence level.

It exposes a recommendation, target power, target state of charge, expected
plan savings and confidence as Home Assistant entities. Charge and discharge
recommendations are also available as binary sensors for your own automations.

Automatic execution is opt-in. It supports a grid-charge switch, a signed
battery-power number entity or a battery-mode select. Keep this disabled until
the suggested actions and configured limits have been verified for your
specific inverter or battery system.

The current recommendation can also be applied manually or from an automation:

```yaml
action: smarthomeshop.apply_battery_recommendation
data: {}
```

Use `action: charge`, `hold` or `discharge` in `data` only when deliberately
overriding the current recommendation.

## Universal radar support in Room Designer

Room Designer reads the mounting and coordinate contract published by current
SmartHomeShop ESPHome firmware. It discovers the metadata through Home
Assistant's device and entity registries, so renamed devices and entity-ID
prefixes remain supported.

- LD2450, LD2460 and LD6002B coordinates are normalized to millimetres before
  room geometry is calculated.
- Wall-mounted `forward_xy` and ceiling-mounted `floor_xy` projections are
  handled explicitly.
- LD2412 and PIR entities remain supplementary occupancy sources and are never
  treated as positioning targets.
- A `top_or_side` radar reports a visible mismatch when its hardware mode does
  not suit the mounting profile. Changing that mode always requires explicit
  user confirmation.
- Wall-mounted LD2460 devices expose their radar-stored mounting height and
  downward angle directly in Room Designer. Values are written through Home
  Assistant and only shown as saved after the radar reports them back.
- The LD2460 hardware detection sector is drawn separately from room polygons.
  Distance and left/right angles are debounced and confirmed by the radar
  before another change is sent.
- LD2460 calibration checks the reported side mode, live height and angle, then
  verifies a forward-Y and sideways-X walk. A physically rotated module is
  never hidden with a software X/Y swap.
- Missing or unavailable target slots are removed immediately, so a previous
  coordinate cannot remain visible while the radar applies a setting.
- Detection and exclusion polygons use integer millimetres and enforce the
  firmware limit of 20 vertices per polygon.
- Existing saved rooms keep their range, field of view, height and projection
  until the user chooses to adopt new firmware defaults.
- Coverage measurement uses near/far and left/right from the radar's own
  viewpoint. “Measure again” starts with four fresh points without deleting the
  saved area until Save is pressed. Moving or rotating the sensor placement
  keeps that measured coverage attached to the sensor.
- Polygon services are matched through the Home Assistant device registry, so
  ESPHome node suffixes such as `_a2799c` are retained and zones cannot be sent
  to another similarly named sensor.
- Older firmware continues to work through a clearly identified legacy
  profile; diagnostics list the metadata needed for a firmware upgrade.

The shared firmware contract lives in the
[radar-mounting repository](https://github.com/smarthomeshop/radar-mounting).

## Support

- [Documentation](https://docs.smarthomeshop.io)
- [Issue Tracker](https://github.com/smarthomeshop/home-assistant-integration/issues)

## License

Copyright (c) 2025-2026 SmartHomeShop.io.

The integration source code is licensed under the
[GNU Affero General Public License v3.0](LICENSE). Modified versions and
network-accessible derivatives must remain available under the AGPL.

The SmartHomeShop.io name, logos, product names and brand assets are not
licensed under the AGPL. See [TRADEMARKS.md](TRADEMARKS.md). A separate
commercial license is available for organizations that want to incorporate
this software without the AGPL obligations; contact info@smarthomeshop.io.
