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
│   │   ├── card-editors.ts # Configuration editors for all cards
│   │   ├── sensor-settings.ts # Sensor settings component
│   │   ├── zone-editor.ts  # Zone editor for UltimateSensor
│   │   ├── radar-card.ts   # Radar visualization
│   │   └── history-graph-host.ts # History graph component
│   ├── utils/              # Helper functions
│   │   ├── helpers.ts      # Entity helpers, formatting, sparklines
│   │   ├── styles.ts       # Shared CSS styles (HA theming)
│   │   └── translations.ts # i18n translations (8 languages)
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

- **translations.ts** - Internationalization:
  - English (default), Dutch, German, French
  - Spanish, Italian, Portuguese, Polish
  - Automatic language detection via HA

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
