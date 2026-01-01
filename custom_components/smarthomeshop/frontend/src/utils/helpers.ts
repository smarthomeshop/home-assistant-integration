/**
 * Shared helper functions for SmartHomeShop cards
 */

import type { HomeAssistant, HassEntity } from '../types/home-assistant';

/**
 * Get entity state object
 */
export function getEntityState(
  hass: HomeAssistant | undefined,
  entityId: string | undefined
): HassEntity | null {
  if (!hass || !entityId || !hass.states[entityId]) {
    return null;
  }
  return hass.states[entityId];
}

/**
 * Get numeric value from entity
 */
export function getEntityValue(
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
  defaultValue = 0
): number {
  const state = getEntityState(hass, entityId);
  if (!state || state.state === 'unavailable' || state.state === 'unknown') {
    return defaultValue;
  }
  const value = parseFloat(state.state);
  return isNaN(value) ? defaultValue : value;
}

/**
 * Format number with decimals
 */
export function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  return value.toFixed(decimals);
}

/**
 * Fire more-info event to open entity details
 */
export function fireMoreInfo(element: HTMLElement, entityId: string): void {
  if (!entityId) return;

  element.dispatchEvent(
    new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId },
    })
  );
}

/**
 * Find entity by friendly name patterns
 */
export function findEntityByFriendlyName(
  hass: HomeAssistant | undefined,
  keywords: string[],
  domain = 'sensor',
  productPatterns = ['waterp1meterkit', 'watermeterkit', 'waterflowkit', 'smarthomeshop']
): string {
  if (!hass) return '';

  const entityId = Object.keys(hass.states).find((id) => {
    if (!id.startsWith(domain + '.')) return false;
    const state = hass.states[id];
    if (!state?.attributes) return false;

    const friendlyName = (state.attributes.friendly_name || '').toLowerCase();
    const isSmartHomeShop = productPatterns.some((p) => friendlyName.includes(p));
    if (!isSmartHomeShop) return false;

    return keywords.some((kw) => friendlyName.includes(kw.toLowerCase()));
  });

  return entityId || '';
}

/**
 * Find entity by entity_id patterns
 */
export function findEntityByEntityId(
  hass: HomeAssistant | undefined,
  patterns: string[],
  domain = 'sensor',
  productPatterns = ['waterp1meterkit', 'watermeterkit', 'waterflowkit']
): string {
  if (!hass) return '';

  const entityId = Object.keys(hass.states).find((id) => {
    if (!id.startsWith(domain + '.')) return false;
    const isSmartHomeShop = productPatterns.some((p) => id.toLowerCase().includes(p));
    if (!isSmartHomeShop) return false;

    return patterns.some((p) => id.toLowerCase().includes(p.toLowerCase()));
  });

  return entityId || '';
}

/**
 * Detect product type from entities
 */
export function detectProductType(hass: HomeAssistant | undefined): string {
  if (!hass) return 'SmartHomeShop';

  const entities = Object.keys(hass.states);

  if (entities.some((e) => e.includes('waterp1meterkit'))) {
    return 'WaterP1MeterKit';
  }
  if (entities.some((e) => e.includes('watermeterkit'))) {
    return 'WaterMeterKit';
  }
  if (entities.some((e) => e.includes('waterflowkit'))) {
    return 'WaterFlowKit';
  }

  return 'SmartHomeShop';
}

/**
 * Generate SVG sparkline path from data points
 */
export function generateSparkline(data: number[] | null, width = 300, height = 50): string {
  const points = data?.length === 24
    ? data
    : new Array(24).fill(0).map((_, i) =>
        i > 6 && i < 9 ? 2 : i > 17 && i < 21 ? 3 : 0.5
      );

  const max = Math.max(...points, 0.1);
  const normalized = points.map((p) => (p / max) * (height - 5));

  let path = `M 0 ${height - normalized[0]}`;
  normalized.forEach((p, i) => {
    if (i > 0) {
      path += ` L ${i * (width / 23)} ${height - p}`;
    }
  });

  return path;
}

/**
 * Process history data into hourly buckets
 */
export function processHistoryData(
  history: Array<{ lu?: number; last_updated?: string; s?: string; state?: string }>
): number[] {
  if (!history?.length) return [];

  const buckets = new Array(24).fill(null).map(() => ({ sum: 0, count: 0 }));
  const now = new Date();

  history.forEach((state) => {
    const timestamp = new Date(state.lu ? state.lu * 1000 : state.last_updated || 0);
    const hoursAgo = Math.floor((now.getTime() - timestamp.getTime()) / (60 * 60 * 1000));
    const bucketIndex = 23 - Math.min(hoursAgo, 23);
    const value = parseFloat(state.s || state.state || '0');

    if (!isNaN(value) && bucketIndex >= 0 && bucketIndex < 24) {
      buckets[bucketIndex].sum += value;
      buckets[bucketIndex].count++;
    }
  });

  return buckets.map((b) => (b.count > 0 ? b.sum / b.count : 0));
}







