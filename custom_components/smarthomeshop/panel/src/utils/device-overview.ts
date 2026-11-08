import type { SmartHomeShopDevice } from '../types';

export type DeviceFilter = 'all' | 'online' | 'offline' | 'unlinked';

export interface DeviceSummary {
  total: number;
  online: number;
  offline: number;
  unlinked: number;
}

export const summarizeDevices = (devices: SmartHomeShopDevice[]): DeviceSummary => ({
  total: devices.length,
  online: devices.filter(device => device.online !== false).length,
  offline: devices.filter(device => device.online === false).length,
  unlinked: devices.filter(device => device.integration_linked === false).length,
});

/**
 * A long list of old offline devices hides the devices that need daily use.
 * Start on Online only when that meaningfully reduces a crowded overview;
 * otherwise preserve the familiar All view.
 */
export const chooseInitialDeviceFilter = (devices: SmartHomeShopDevice[]): DeviceFilter => {
  const summary = summarizeDevices(devices);
  return summary.online > 0 && summary.offline >= 5 && summary.offline > summary.online
    ? 'online'
    : 'all';
};

const searchableDeviceText = (device: SmartHomeShopDevice): string => [
  device.name,
  device.product_name,
  device.product_type,
  device.model,
].filter(Boolean).join(' ').toLocaleLowerCase();

export const filterAndSortDevices = <T extends SmartHomeShopDevice>(
  devices: T[],
  query: string,
  filter: DeviceFilter,
): T[] => {
  const needle = query.trim().toLocaleLowerCase();
  return devices
    .filter(device => {
      if (filter === 'online' && device.online === false) return false;
      if (filter === 'offline' && device.online !== false) return false;
      if (filter === 'unlinked' && device.integration_linked !== false) return false;
      return !needle || searchableDeviceText(device).includes(needle);
    })
    .sort((left, right) => {
      const onlineDifference = Number(left.online === false) - Number(right.online === false);
      if (onlineDifference) return onlineDifference;
      const linkedDifference = Number(left.integration_linked === false)
        - Number(right.integration_linked === false);
      if (linkedDifference) return linkedDifference;
      return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' });
    });
};
