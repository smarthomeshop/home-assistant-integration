export interface DeviceRegistryEntity {
  entity_id?: string;
  device_id?: string;
  platform?: string;
  original_name?: string | null;
}

const entityBody = (entityId: string): string => entityId.split('.', 2)[1]?.toLowerCase() || '';

const normaliseName = (value: string | null | undefined): string =>
  String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const matchesSuffix = (entityId: string, suffix: string): boolean => {
  const body = entityBody(entityId);
  const wanted = suffix.toLowerCase();
  return body === wanted || body.endsWith(`_${wanted}`);
};

/** Resolve an ESPHome entity by its HA device association, never by a generated prefix. */
export const findDeviceEntity = (
  entities: Record<string, DeviceRegistryEntity> | undefined,
  deviceId: string,
  domain: string,
  suffixes: string[],
  originalNames: string[] = [],
): string | null => {
  if (!entities || !deviceId) return null;
  const wantedNames = new Set(originalNames.map(normaliseName));
  const matches: Array<{ rank: number; entityId: string }> = [];

  Object.entries(entities).forEach(([registryId, entry]) => {
    const entityId = entry.entity_id || registryId;
    if (entry.device_id !== deviceId || entry.platform !== 'esphome' || !entityId.startsWith(`${domain}.`)) return;
    if (wantedNames.has(normaliseName(entry.original_name))) {
      matches.push({ rank: 0, entityId });
      return;
    }
    if (suffixes.some(suffix => matchesSuffix(entityId, suffix))) {
      matches.push({ rank: 1, entityId });
    }
  });

  matches.sort((left, right) => left.rank - right.rank || left.entityId.localeCompare(right.entityId));
  return matches[0]?.entityId || null;
};

/**
 * Resolve an ESPHome user service to one HA device.
 *
 * ESPHome services are not part of the entity registry, but their node prefix
 * is shared by entities on the owning device. Matching the registered service
 * against those device-associated entity IDs avoids guessing or truncating
 * node suffixes such as `_a2799c`.
 */
export const resolveESPHomeDeviceService = (
  services: Record<string, Record<string, unknown>> | undefined,
  entities: Record<string, DeviceRegistryEntity> | undefined,
  deviceId: string,
  action: string,
  fallbackPrefixes: string[] = [],
): string | null => {
  const available = Object.keys(services?.esphome || {});
  const actionSuffix = `_${action.toLowerCase()}`;
  const actionServices = available.filter(service => service.toLowerCase().endsWith(actionSuffix));
  if (!actionServices.length) return null;

  const ownedBodies = Object.entries(entities || {})
    .filter(([, entry]) => entry.device_id === deviceId && entry.platform === 'esphome')
    .map(([registryId, entry]) => entityBody(entry.entity_id || registryId));

  const ranked = actionServices.map(service => {
    const prefix = service.slice(0, -actionSuffix.length).toLowerCase();
    const ownershipMatches = ownedBodies.filter(body => body === prefix || body.startsWith(`${prefix}_`)).length;
    return { service, ownershipMatches };
  }).filter(item => item.ownershipMatches > 0)
    .sort((left, right) => right.ownershipMatches - left.ownershipMatches || right.service.length - left.service.length);

  if (ranked.length) return ranked[0].service;

  for (const prefix of fallbackPrefixes) {
    const exact = `${prefix}_${action}`;
    if (available.includes(exact)) return exact;
  }
  return null;
};
