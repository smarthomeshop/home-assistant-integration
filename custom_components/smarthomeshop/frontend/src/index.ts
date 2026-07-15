/**
 * SmartHomeShop.io Lovelace Cards
 *
 * Custom cards for SmartHomeShop products:
 * - smarthomeshop-water-card: Water monitoring (WaterMeterKit, WaterFlowKit)
 * - smarthomeshop-waterp1-card: Water + Energy monitoring (WaterP1MeterKit)
 * - smarthomeshop-ultimatesensor-card: Presence detection & environment (UltimateSensor, UltimateSensor Mini)
 * - smarthomeshop-p1meterkit-card: Electricity, tariff and phase monitoring (P1MeterKit)
 * - smarthomeshop-ceilsense-card: Ceiling presence, zones and room climate (CeilSense)
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
  ['smarthomeshop-water-card-editor', SmartHomeShopWaterCardEditor],
  ['smarthomeshop-waterp1-card-editor', SmartHomeShopWaterP1CardEditor],
  ['smarthomeshop-waterflowkit-card-editor', SmartHomeShopWaterFlowKitCardEditor],
  ['smarthomeshop-ultimatesensor-card-editor', SmartHomeShopUltimateSensorCardEditor],
  ['smarthomeshop-p1meterkit-card-editor', SmartHomeShopP1MeterKitCardEditor],
  ['smarthomeshop-ceilsense-card-editor', SmartHomeShopCeilSenseCardEditor],
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
  SmartHomeShopSensorSettings,
  SmartHomeShopZoneEditor
};
