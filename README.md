# SmartHomeShop.io Integration for Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

Custom integration for Home Assistant to integrate SmartHomeShop.io devices.

## Installation

### HACS (Recommended)

Use this installation method if you have HACS installed in Home Assistant.

1. Click the My Home Assistant button below to open this repository in HACS.

   [![Open your Home Assistant instance and add this repository to HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=smarthomeshop&repository=home-assistant-integration&category=integration)

2. Click **Add**.
3. Search for **SmartHomeShop.io** in HACS and install it.
4. Restart Home Assistant.

If the button does not work:

1. Open **HACS** in Home Assistant.
2. Go to **Integrations**.
3. Click the three dots in the top right corner and select **Custom repositories**.
4. Add this repository URL:

   ```text
   https://github.com/smarthomeshop/home-assistant-integration
   ```

5. Select **Integration** as the category.
6. Click **Add**.
7. Search for **SmartHomeShop.io** and install it.
8. Restart Home Assistant.

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

> **Work in progress:** Test work Dwains regarding energy prices and automatic
> control of home battery - WORK IN PROGRESS.

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

## Support

- [Documentation](https://docs.smarthomeshop.io)
- [Issue Tracker](https://github.com/smarthomeshop/home-assistant-integration/issues)

## License

Copyright (c) 2025 SmartHomeShop.io - All Rights Reserved.

This software is proprietary. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without prior written permission from SmartHomeShop.io.
