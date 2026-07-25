/**
 * SmartHomeShop.io Lovelace Cards
 *
 * Custom cards for SmartHomeShop products:
 * - smarthomeshop-water-card: Water monitoring (WaterMeterKit, WaterFlowKit)
 * - smarthomeshop-waterp1-card: Water + Energy monitoring (WaterP1MeterKit)
 * - smarthomeshop-ultimatesensor-card: Presence detection & environment (UltimateSensor, UltimateSensor Mini)
 * - smarthomeshop-p1meterkit-card: Electricity, tariff and phase monitoring (P1MeterKit)
 * - smarthomeshop-ceilsense-card: Ceiling presence, zones and room climate (CeilSense)
 * - smarthomeshop-energy-*-card: Live energy, prices, history and savings
 */

// Import cards and editors
import { SmartHomeShopWaterCard } from './components/water-card';
import { SmartHomeShopWaterP1Card } from './components/waterp1-card';
import { SmartHomeShopWaterFlowKitCard, SmartHomeShopWaterFlowKitCardEditor } from './components/waterflowkit-card';
import {
  SmartHomeShopUltimateSensorCard,
  SmartHomeShopUltimateSensorCardEditor,
} from './components/ultimatesensor-card';
import { SmartHomeShopP1MeterKitCard, SmartHomeShopP1MeterKitCardEditor } from './components/p1meterkit-card';
import { SmartHomeShopCeilSenseCard, SmartHomeShopCeilSenseCardEditor } from './components/ceilsense-card';
import { SmartHomeShopSensorSettings } from './components/sensor-settings';
import { SmartHomeShopZoneEditor } from './components/zone-editor';
import {
  SmartHomeShopWaterCardEditor,
  SmartHomeShopWaterP1CardEditor,
} from './components/card-editors';
import { SmartHomeShopEnergyLiveCard } from './components/energy-live-card';
import { SmartHomeShopEnergyPriceCard } from './components/energy-price-card';
import { SmartHomeShopEnergyPowerCard } from './components/energy-power-card';
import { SmartHomeShopEnergyCostCard } from './components/energy-cost-card';
import { SmartHomeShopEnergySavingsCard } from './components/energy-savings-card';
import { SmartHomeShopEnergyAutomationsCard } from './components/energy-automations-card';
import { SmartHomeShopEnergyCardEditor } from './components/energy-card-editor';

// @ts-ignore - VERSION is replaced by rollup at build time
const VERSION = '__VERSION__';

console.info(
  `%c SMARTHOMESHOP-CARDS %c ${VERSION} `,
  'color: white; background: #2196f3; font-weight: bold; padding: 2px 4px; border-radius: 4px 0 0 4px;',
  'color: #2196f3; background: #e3f2fd; font-weight: bold; padding: 2px 4px; border-radius: 0 4px 4px 0;'
);

// Declare global window interface
declare global {
  interface Window {
    customIcons?: Record<
      string,
      {
        getIcon: (iconName: string) => Promise<{ path: string; viewBox?: string }>;
      }
    >;
    customIconsets?: Record<
      string,
      (iconName: string) => Promise<{ path: string; viewBox?: string }>
    >;
    customCards?: Array<{
      type: string;
      name: string;
      description?: string;
      preview?: boolean;
      documentationURL?: string;
    }>;
  }
}

/**
 * Register the official SmartHomeShop house-with-face mark as a native
 * Home Assistant icon set. The sidebar can then render `shs:logo` through
 * `<ha-icon>`, inheriting the current theme/active color just like MDI icons.
 */
const SHS_LOGO_PATH = [
  'M636.8 285.9c-.5-10.6-11-15.9-18.8-21.6L392.7 97.4c-3.2-2.4-9.4-2.4-12.6 0L147.8 269.5c-3.2 2.4-8.1 5.2-10.1 8.6-4.8 8.3-1.7 24.7-1.7 33.6v283.4c0 6.7 5.7 12.5 12.5 12.5h92.8c16.1 0 16.1-25 0-25h-80.4v-292l225.5-167 225.4 167v292.1h-80.4c-16.1 0-16.1 25 0 25h92.8c6.7 0 12.5-5.7 12.5-12.5V327.2c.1-13.8.7-27.6.1-41.3z',
  'M261.7 428.8c0 27.7 13.7 53.7 36 69.9 17.3 12.5 37.1 16 58 16h55.4c19.1 0 37.3-.9 54.7-10.2 27.6-14.6 45.4-44.5 45.4-75.7 0-16.1-25-16.1-25 0 0 29.1-21.2 54.6-49.8 60-16 3-33.9 1-50 1s-34 2-50-1c-28.6-5.4-49.8-30.9-49.8-60 0-16-24.9-16.1-24.9 0z',
  'M332.3 351.6a21.4 21.4 0 1 1-42.8 0 21.4 21.4 0 1 1 42.8 0z',
  'M483.4 351.6a21.4 21.4 0 1 1-42.8 0 21.4 21.4 0 1 1 42.8 0z',
  'M767.5 279.4 392.8 1.7c-3.2-2.4-9.4-2.4-12.6 0L5.4 279.4c-12.8 9.5-.3 31.1 12.6 21.5L386.6 28 755 300.9c12.8 9.6 25.3-12.1 12.5-21.5z',
].join('');

const getSmartHomeShopIcon = async (iconName: string) => {
  if (iconName !== 'logo') {
    return { path: '', viewBox: '0 0 772.9 607.6' };
  }

  return {
    path: SHS_LOGO_PATH,
    viewBox: '0 0 772.9 607.6',
  };
};

// Home Assistant 2026.6+ uses customIcons. Keep customIconsets as a
// compatibility bridge for older supported Home Assistant installations.
window.customIcons = window.customIcons || {};
window.customIcons.shs = { getIcon: getSmartHomeShopIcon };
window.customIconsets = window.customIconsets || {};
window.customIconsets.shs = getSmartHomeShopIcon;

/**
 * Extra frontend modules are loaded asynchronously. On a cold HA load the
 * sidebar can request `shs:logo` just before this module registers the set.
 * Refresh only that icon once registration is ready; future renders resolve
 * it immediately through customIcons.
 */
function refreshSmartHomeShopIcons(): void {
  const roots: Array<Document | ShadowRoot> = [document];

  for (let index = 0; index < roots.length; index += 1) {
    const root = roots[index];

    root.querySelectorAll('*').forEach((element) => {
      if (element.shadowRoot) {
        roots.push(element.shadowRoot);
      }

      if (
        element.localName === 'ha-icon'
        && (element as HTMLElement & { icon?: string }).icon === 'shs:logo'
      ) {
        const icon = element as HTMLElement & { icon?: string };
        icon.icon = undefined;
        requestAnimationFrame(() => {
          icon.icon = 'shs:logo';
        });
      }
    });
  }
}

[0, 50, 250, 1000, 3000].forEach((delay) => {
  window.setTimeout(refreshSmartHomeShopIcons, delay);
});

/**
 * Lit's @customElement decorator normally performs this registration for us.
 * Home Assistant can load decorator/polyfill runtimes that take a different
 * path, so keep an explicit idempotent fallback at the bundle boundary.
 */
function registerCustomElement(
  tagName: string,
  elementClass: CustomElementConstructor,
): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass);
  }
}

const customElementRegistrations: Array<[string, CustomElementConstructor]> = [
  ['smarthomeshop-water-card', SmartHomeShopWaterCard],
  ['smarthomeshop-waterp1-card', SmartHomeShopWaterP1Card],
  ['smarthomeshop-waterflowkit-card', SmartHomeShopWaterFlowKitCard],
  ['smarthomeshop-ultimatesensor-card', SmartHomeShopUltimateSensorCard],
  ['smarthomeshop-p1meterkit-card', SmartHomeShopP1MeterKitCard],
  ['smarthomeshop-ceilsense-card', SmartHomeShopCeilSenseCard],
  ['smarthomeshop-energy-live-card', SmartHomeShopEnergyLiveCard],
  ['smarthomeshop-energy-price-card', SmartHomeShopEnergyPriceCard],
  ['smarthomeshop-energy-power-card', SmartHomeShopEnergyPowerCard],
  ['smarthomeshop-energy-cost-card', SmartHomeShopEnergyCostCard],
  ['smarthomeshop-energy-savings-card', SmartHomeShopEnergySavingsCard],
  ['smarthomeshop-water-card-editor', SmartHomeShopWaterCardEditor],
  ['smarthomeshop-waterp1-card-editor', SmartHomeShopWaterP1CardEditor],
  ['smarthomeshop-waterflowkit-card-editor', SmartHomeShopWaterFlowKitCardEditor],
  ['smarthomeshop-ultimatesensor-card-editor', SmartHomeShopUltimateSensorCardEditor],
  ['smarthomeshop-p1meterkit-card-editor', SmartHomeShopP1MeterKitCardEditor],
  ['smarthomeshop-ceilsense-card-editor', SmartHomeShopCeilSenseCardEditor],
  ['smarthomeshop-energy-card-editor', SmartHomeShopEnergyCardEditor],
  ['smarthomeshop-sensor-settings', SmartHomeShopSensorSettings],
  ['smarthomeshop-zone-editor', SmartHomeShopZoneEditor],
];

customElementRegistrations.forEach(([tagName, elementClass]) => {
  registerCustomElement(tagName, elementClass);
});

/**
 * Home Assistant may create card-picker previews before this module finishes
 * loading. Those previews are temporary hui-error-card elements inside one or
 * more open shadow roots. Rebuild them after registration so the picker does
 * not remain stuck on a spinner until the page is refreshed.
 */
function rebuildPendingLovelaceCards(): void {
  const roots: Array<Document | ShadowRoot> = [document];

  for (let index = 0; index < roots.length; index += 1) {
    const root = roots[index];

    root.querySelectorAll('*').forEach((element) => {
      if (element.shadowRoot) {
        roots.push(element.shadowRoot);
      }

      if (element.localName === 'hui-error-card') {
        element.dispatchEvent(
          new CustomEvent('ll-rebuild', {
            bubbles: true,
            composed: true,
          }),
        );
      }
    });
  }
}

// The picker can be inserted a frame after the module is evaluated. A few
// short passes cover both the initial render and dialogs opened immediately.
[0, 100, 500, 1500].forEach((delay) => {
  window.setTimeout(rebuildPendingLovelaceCards, delay);
});

// Register custom cards in card picker
window.customCards = window.customCards || [];

window.customCards.push({
  type: 'smarthomeshop-water-card',
  name: 'SmartHomeShop Water Card',
  description: 'Water monitoring voor WaterMeterKit en WaterFlowKit',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-waterp1-card',
  name: 'SmartHomeShop WaterP1 Card',
  description: 'Water + Energy monitoring voor WaterP1MeterKit',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-ultimatesensor-card',
  name: 'SmartHomeShop UltimateSensor Card',
  description: 'Presence detection & omgevingssensoren voor UltimateSensor en UltimateSensor Mini',
  preview: true,
  documentationURL: 'https://docs.smarthomeshop.io/en/ultimatesensor/home-assistant-card',
});

window.customCards.push({
  type: 'smarthomeshop-waterflowkit-card',
  name: 'SmartHomeShop WaterFlowKit Card',
  description: 'Dual flow water monitoring met geanimeerde leidingen voor WaterFlowKit',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-p1meterkit-card',
  name: 'SmartHomeShop P1MeterKit Card',
  description: 'Live grid power, tariffs, phases and energy insights for P1MeterKit',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-ceilsense-card',
  name: 'SmartHomeShop CeilSense Card',
  description: 'Ceiling presence, target zones, distance and room climate for CeilSense',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-energy-live-card',
  name: 'SmartHomeShop Live Energy Card',
  description: 'Live home consumption, grid, solar and battery power',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-energy-price-card',
  name: 'SmartHomeShop Price Outlook Card',
  description: 'Interactive hourly energy prices and the cheapest consecutive block',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-energy-power-card',
  name: 'SmartHomeShop Power Trend Card',
  description: 'Today’s grid import, grid export, solar and battery power history',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-energy-cost-card',
  name: 'SmartHomeShop Energy Costs Card',
  description: 'Today’s imported electricity cost, return value and net balance',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-energy-savings-card',
  name: 'SmartHomeShop Smart Savings Card',
  description: 'Measured savings from battery control and smart schedules',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

window.customCards.push({
  type: 'smarthomeshop-energy-automations-card',
  name: 'SmartHomeShop Smart Automations Card',
  description: 'Live status, next action and controls for Smart Energy automations and schedules',
  preview: true,
  documentationURL: 'https://smarthomeshop.io',
});

console.log('SmartHomeShop.io Cards loaded successfully!');

// Export for external use
export {
  SmartHomeShopWaterCard,
  SmartHomeShopWaterP1Card,
  SmartHomeShopWaterFlowKitCard,
  SmartHomeShopWaterFlowKitCardEditor,
  SmartHomeShopUltimateSensorCard,
  SmartHomeShopP1MeterKitCard,
  SmartHomeShopP1MeterKitCardEditor,
  SmartHomeShopCeilSenseCard,
  SmartHomeShopCeilSenseCardEditor,
  SmartHomeShopEnergyLiveCard,
  SmartHomeShopEnergyPriceCard,
  SmartHomeShopEnergyPowerCard,
  SmartHomeShopEnergyCostCard,
  SmartHomeShopEnergySavingsCard,
  SmartHomeShopEnergyAutomationsCard,
  SmartHomeShopEnergyCardEditor,
  SmartHomeShopSensorSettings,
  SmartHomeShopZoneEditor
};
