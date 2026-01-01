/**
 * SmartHomeShop.io Lovelace Cards
 *
 * Custom cards for SmartHomeShop products:
 * - smarthomeshop-water-card: Water monitoring (WaterMeterKit, WaterFlowKit)
 * - smarthomeshop-waterp1-card: Water + Energy monitoring (WaterP1MeterKit)
 * - smarthomeshop-ultimatesensor-card: Presence detection & environment (UltimateSensor, UltimateSensor Mini)
 */

// Import cards and editors
import { SmartHomeShopWaterCard } from './components/water-card';
import { SmartHomeShopWaterP1Card } from './components/waterp1-card';
import { SmartHomeShopWaterFlowKitCard, SmartHomeShopWaterFlowKitCardEditor } from './components/waterflowkit-card';
import { SmartHomeShopUltimateSensorCard } from './components/ultimatesensor-card';
import { SmartHomeShopSensorSettings } from './components/sensor-settings';
import { SmartHomeShopZoneEditor } from './components/zone-editor';
import './components/card-editors';

const VERSION = '0.0.3';

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

console.log('SmartHomeShop.io Cards loaded successfully!');

// Export for external use
export {
  SmartHomeShopWaterCard,
  SmartHomeShopWaterP1Card,
  SmartHomeShopWaterFlowKitCard,
  SmartHomeShopWaterFlowKitCardEditor,
  SmartHomeShopUltimateSensorCard,
  SmartHomeShopSensorSettings,
  SmartHomeShopZoneEditor
};
