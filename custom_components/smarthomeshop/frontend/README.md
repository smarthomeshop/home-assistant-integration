# SmartHomeShop Frontend

This is the frontend folder for the SmartHomeShop Home Assistant integration. It contains all Lovelace custom cards for SmartHomeShop products.

## Folder Structure

```
frontend/
├── src/                    # Source code (TypeScript)
│   ├── index.ts            # Entry point - registers all cards
│   ├── components/         # Card components
│   │   ├── base-card.ts    # Base class with shared functionality
│   │   ├── water-card.ts   # WaterMeterKit card
│   │   ├── waterp1-card.ts # WaterP1MeterKit card (water + energy)
│   │   ├── waterflowkit-card.ts # WaterFlowKit card (dual flow)
│   │   ├── ultimatesensor-card.ts # UltimateSensor card
│   │   ├── p1meterkit-card.ts # P1MeterKit card (grid, tariffs and phases)
│   │   ├── ceilsense-card.ts # CeilSense card (presence, zones and climate)
│   │   ├── energy-card-common.ts # Shared Smart Energy data and styles
│   │   ├── energy-live-card.ts # Live home, grid, solar and battery power
│   │   ├── energy-price-card.ts # Hourly price outlook and cheapest block
│   │   ├── energy-power-card.ts # Today's interactive power trend
│   │   ├── energy-savings-card.ts # Measured Smart Savings
│   │   ├── energy-automations-card.ts # Smart automations and deadline schedules
│   │   ├── energy-card-editor.ts # Visual editor for all Energy cards
│   │   ├── product-card-utils.ts # Registry-first product/entity resolution
│   │   ├── card-editors.ts # Configuration editors for all cards
│   │   ├── sensor-settings.ts # Sensor settings component
│   │   ├── zone-editor.ts  # Zone editor for UltimateSensor
│   │   ├── radar-card.ts   # Radar visualization
│   │   └── history-graph-host.ts # History graph component
│   ├── utils/              # Helper functions
│   │   ├── helpers.ts      # Entity helpers, formatting, sparklines
│   │   ├── styles.ts       # Shared CSS styles (HA theming)
│   │   ├── translations.ts # Shared i18n and HA language detection
│   │   ├── energy-translations.ts # Smart Energy translations
│   │   └── runtime-translations.ts # Complete card/editor translations
│   └── types/              # TypeScript definitions
│       └── home-assistant.ts # HA types (entities, devices, etc.)
├── dist/                   # Compiled output
│   └── smarthomeshop-cards.js # Bundled JavaScript file
├── node_modules/           # NPM dependencies
├── package.json            # Project configuration and scripts
├── tsconfig.json           # TypeScript configuration
└── rollup.config.js        # Rollup bundler configuration
```

## Available Cards

| Card | Type | Description |
|------|------|-------------|
| **Water Card** | `smarthomeshop-water-card` | Water monitoring for WaterMeterKit and WaterFlowKit |
| **WaterP1 Card** | `smarthomeshop-waterp1-card` | Water + energy monitoring for WaterP1MeterKit |
| **WaterFlowKit Card** | `smarthomeshop-waterflowkit-card` | Dual flow monitoring with animated pipes |
| **UltimateSensor Card** | `smarthomeshop-ultimatesensor-card` | Presence detection and environment sensors |
| **P1MeterKit Card** | `smarthomeshop-p1meterkit-card` | Live electricity, grid direction, tariffs, phases and energy insights |
| **CeilSense Card** | `smarthomeshop-ceilsense-card` | Ceiling presence, target zones, distance, energy and room climate |
| **Live Energy Card** | `smarthomeshop-energy-live-card` | Live home consumption plus optional animated grid, solar and battery power flow |
| **Price Outlook Card** | `smarthomeshop-energy-price-card` | Hourly prices, price insights and cheapest consecutive block |
| **Power Trend Card** | `smarthomeshop-energy-power-card` | Today's grid import/export, solar and battery as native HA 5-minute statistics |
| **Smart Savings Card** | `smarthomeshop-energy-savings-card` | Measured battery and schedule savings |
| **Smart Automations Card** | `smarthomeshop-energy-automations-card` | Live status, targets and controls for Smart Energy automations and schedules |

## Visibility Options

Every card exposes these options in the Home Assistant visual card editor. All
options default to visible, so existing dashboards keep their current layout.

| Card | Configurable content |
|------|----------------------|
| **Water Card** | Header, status, current usage, period totals, today, week, month, year, 24-hour graph, total meter reading and leak detection |
| **WaterP1 Card** | All Water Card options plus complete water/energy sections, current power, electricity today, returned energy and gas today |
| **WaterFlowKit Card** | Header, combined status, pipe visualization, pipe detail cards, total consumption, hourly rate, both pipes and temperature per pipe |
| **UltimateSensor Card** | Header, presence status, room score, climate values, individual environment sensors, CO2 meter, PM section, PM gauge, PM value cards, NOx, radar/room view and person distance details |
| **P1MeterKit Card** | Header, connection status, live power flow, tariff totals, phase load, energy insights, gas and device environment |
| **CeilSense Card** | Header, connection status, live presence radar, zones, distance and signal energy, environment values and room-quality insights |
| **Live Energy Card** | Header, live power flow, motion, source details, home consumption, grid, solar and battery |
| **Price Outlook Card** | Header, initial day, price insights, cheapest block and 1-6 hour duration |
| **Power Trend Card** | Header, current/peak summary and independently toggleable grid import, grid export, solar and battery statistics |
| **Smart Savings Card** | Header, battery/schedule breakdown and measurement explanation |
| **Smart Automations Card** | Header, compact/expanded density, deadline schedules, quick controls and last-triggered information |

### UltimateSensor room view

In `view_mode: room`, the card automatically opens the Room Designer room
linked to the configured `device_id`. Each card therefore follows its own
UltimateSensor, even when a dashboard contains several sensors. The visual
editor also offers a room override and a 300, 360, 480 or 600-pixel room-view
height. Sections dashboards can resize the card horizontally and the card asks
for a full row by default.

```yaml
type: custom:smarthomeshop-ultimatesensor-card
device_id: your_home_assistant_device_id
view_mode: room
room_view_mode: 2d
room_height: 480
```

If the card cannot find a room automatically, open Room Designer and link that
exact Home Assistant device to a sensor placement. A room can also be selected
explicitly in the visual card editor.

The compact `Total meter reading` row stays available on firmware without a
calibration entity. Firmware that supports meter calibration also shows a
`Set` action in the same row.

The Energy cards use the contract and entities configured once in
**SmartHomeShop.io → Energy → Settings**. They do not duplicate entity
configuration in each Lovelace card. All Energy cards are available in Home
Assistant's visual card picker, or can be added as YAML:

```yaml
type: custom:smarthomeshop-energy-live-card
show_flow: true
animate_flow: true
show_details: true
```

`show_flow` adds the live directional view. Grid and battery paths reverse
automatically when power is exported or the battery is charging. The animation
speed follows the measured wattage and can also be paused directly on the card.
Set `show_details: false` for a compact flow-only card. Existing dashboards keep
their original overview until the flow is enabled in the visual editor.

The Power Trend card and the matching Energy panel section use Home
Assistant's native `statistics-chart` renderer. Recorder's 5-minute `mean`,
`min` and `max` statistics provide the line and range, while sources without
statistics fall back to state history. A shared live sample is appended so
every available series reaches the current time.

## Source Files

### Components (`src/components/`)

- **base-card.ts** - Abstract base class containing shared functionality:
  - Auto-detection of SmartHomeShop entities
  - History data fetching via WebSocket
  - Helper methods for entity values

- **water-card.ts** - Displays water usage with sparkline graph
- **waterp1-card.ts** - Combines water and P1 energy data
- **waterflowkit-card.ts** - Dual flow visualization with animations
- **ultimatesensor-card.ts** - Room score, presence, CO2, VOC, air quality
- **p1meterkit-card.ts** - Grid import/export, tariff totals, phase load and energy insights
- **ceilsense-card.ts** - Presence targets, zones, distance, signal energy and room climate
- **energy-card-common.ts** - Cached Energy API context, live values, history and shared responsive styling
- **energy-live-card.ts** - Live home consumption, directional power flow and configured energy sources
- **energy-price-card.ts** - Interactive hourly prices and configurable cheapest block
- **energy-power-card.ts** - Native HA statistics graph with mean/min/max ranges and per-series visibility
- **energy-savings-card.ts** - Today, month, all-time and contribution values
- **energy-automations-card.ts** - Managed HA automations and deadline schedules with live status, shared editing and controls
- **energy-card-editor.ts** - Shared visual card editor for all five Energy cards
- **product-card-utils.ts** - Shared registry-first product and entity matching
- **card-editors.ts** - Visual configuration editors for Lovelace UI
- **sensor-settings.ts** - Settings panel for sensors
- **zone-editor.ts** - Zone configuration for presence detection
- **radar-card.ts** - Radar visualization component
- **history-graph-host.ts** - Wrapper for HA history graphs

### Utils (`src/utils/`)

- **helpers.ts** - Utility functions:
  - `getEntityState()` / `getEntityValue()` - Fetch entity data
  - `formatNumber()` - Format numbers
  - `fireMoreInfo()` - Open more-info dialog
  - `findEntityByFriendlyName()` - Search entity by name
  - `generateSparkline()` - Generate SVG sparkline
  - `processHistoryData()` - Convert history to hourly buckets

- **styles.ts** - CSS with Home Assistant variables:
  - Theming support (light/dark mode)
  - Card layouts and animations
  - Status badges and icons

- **translations.ts**, **energy-translations.ts** and **runtime-translations.ts** - Internationalization:
  - Complete English, Dutch, German, French and Spanish card/editor coverage
  - Automatic per-user language detection through Home Assistant
  - Regional language variants such as `nl-NL`, `de-DE` and `fr-FR`
  - Safe English fallback for unsupported languages

### Types (`src/types/`)

- **home-assistant.ts** - TypeScript interfaces:
  - `HomeAssistant` - Main HA object
  - `HassEntity` - Entity state
  - `HassDevice` - Device registry
  - `LovelaceCard` / `LovelaceCardEditor` - Card interfaces

## Development

### Requirements

- Node.js 18+
- npm

### Installation

```bash
cd frontend
npm install
```

### Commands

```bash
# Build for production (output to dist/ and ../www/)
npm run build

# Watch mode for development
npm run watch

# Build + watch
npm run dev

# Type checking without build
npm run type-check

# Copy to www/ only
npm run copy

# Clean dist folder
npm run clean
```

### Build Output

Running `npm run build` creates:
1. `dist/smarthomeshop-cards.js` - Compiled bundle
2. Automatically copies to `../www/` for use in HA

## Technology

- **Lit** (v3) - Web Components library
- **TypeScript** - Type-safe JavaScript
- **Rollup** - Module bundler
- **Terser** - JavaScript minification (production)

## Theming

The cards use Home Assistant CSS variables for consistent theming:

```css
--primary-text-color      /* Main text */
--secondary-text-color    /* Secondary text */
--primary-color           /* Accent color */
--card-background-color   /* Card background */
--success-color           /* Green (OK status) */
--error-color             /* Red (alerts) */
--warning-color           /* Orange (warnings) */
--info-color              /* Blue (information) */
```
