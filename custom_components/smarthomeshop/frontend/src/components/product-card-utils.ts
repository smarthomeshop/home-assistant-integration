import type {
  HassDevice,
  HassEntity,
  HassEntityRegistryEntry,
  HomeAssistant,
} from '../types/home-assistant';

export interface ProductDeviceMatcher {
  aliases: string[];
  exclude?: string[];
}

export interface EntityMatcher {
  domains?: string[];
  suffixes?: string[];
  exactNames?: string[];
  includesAll?: string[];
  includesAny?: string[];
  excludes?: string[];
  deviceClasses?: string[];
  units?: string[];
}

export interface DeviceConnectionState {
  offline: boolean;
  lastSeen: string | null;
  hasEntities: boolean;
}

interface EntityCandidate {
  entityId: string;
  state: HassEntity;
  registry?: HassEntityRegistryEntry;
}

export const normalizeEntityText = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const compactEntityText = (value: unknown): string =>
  normalizeEntityText(value).replace(/\s+/g, '');

const deviceSearchText = (device: HassDevice): string => {
  const identifiers = (device.identifiers ?? [])
    .flatMap((identifier) => identifier)
    .join(' ');
  return normalizeEntityText([
    device.name,
    device.name_by_user,
    device.model,
    device.manufacturer,
    identifiers,
  ].join(' '));
};

const matchesProductText = (
  value: string,
  matcher: ProductDeviceMatcher,
): boolean => {
  const compact = compactEntityText(value);
  if (matcher.exclude?.some((token) => compact.includes(compactEntityText(token)))) {
    return false;
  }
  return matcher.aliases.some((token) => compact.includes(compactEntityText(token)));
};

export const findProductDevices = (
  hass: HomeAssistant | undefined,
  matcher: ProductDeviceMatcher,
): HassDevice[] => {
  if (!hass?.devices) return [];

  const matched = new Map<string, HassDevice>();
  for (const device of Object.values(hass.devices)) {
    if (matchesProductText(deviceSearchText(device), matcher)) {
      matched.set(device.id, device);
    }
  }

  if (hass.entities) {
    for (const [entityId, entry] of Object.entries(hass.entities)) {
      if (!entry.device_id) continue;
      const state = hass.states[entityId];
      const source = `${entityId} ${state?.attributes.friendly_name ?? ''}`;
      if (!matchesProductText(source, matcher)) continue;
      const device = hass.devices[entry.device_id];
      if (device) matched.set(device.id, device);
    }
  }

  return [...matched.values()].sort((left, right) =>
    productDeviceName(left).localeCompare(productDeviceName(right)),
  );
};

export const productDeviceName = (device: HassDevice | undefined): string =>
  device?.name_by_user || device?.name || device?.model || 'SmartHomeShop device';

export const resolveProductDevice = (
  hass: HomeAssistant | undefined,
  deviceId: string | undefined,
  matcher: ProductDeviceMatcher,
): HassDevice | undefined => {
  if (deviceId && hass?.devices?.[deviceId]) return hass.devices[deviceId];
  return findProductDevices(hass, matcher)[0];
};

const entityCandidates = (
  hass: HomeAssistant,
  deviceId?: string,
  productMatcher?: ProductDeviceMatcher,
): EntityCandidate[] => {
  const candidates: EntityCandidate[] = [];
  for (const [entityId, state] of Object.entries(hass.states)) {
    const registry = hass.entities?.[entityId];
    if (deviceId && hass.entities && registry?.device_id !== deviceId) continue;
    if (!deviceId && productMatcher) {
      const source = `${entityId} ${state.attributes.friendly_name ?? ''}`;
      if (!matchesProductText(source, productMatcher)) continue;
    }
    candidates.push({ entityId, state, registry });
  }
  return candidates;
};

const normalizedList = (values: string[] | undefined): string[] =>
  (values ?? []).map(compactEntityText).filter(Boolean);

const scoreEntity = (candidate: EntityCandidate, matcher: EntityMatcher): number => {
  const [domain, objectId = ''] = candidate.entityId.split('.', 2);
  if (matcher.domains && !matcher.domains.includes(domain)) return -1;

  const friendlyName = String(candidate.state.attributes.friendly_name ?? '');
  const objectCompact = compactEntityText(objectId);
  const friendlyCompact = compactEntityText(friendlyName);
  const sourceCompact = `${objectCompact}${friendlyCompact}`;
  const excludes = normalizedList(matcher.excludes);
  if (excludes.some((token) => sourceCompact.includes(token))) return -1;

  let score = 0;
  let matched = false;
  const suffixes = normalizedList(matcher.suffixes);
  for (const suffix of suffixes) {
    if (objectCompact.endsWith(suffix)) {
      score = Math.max(score, 120 + suffix.length);
      matched = true;
    } else if (friendlyCompact.endsWith(suffix)) {
      score = Math.max(score, 105 + suffix.length);
      matched = true;
    }
  }

  const exactNames = normalizedList(matcher.exactNames);
  for (const name of exactNames) {
    if (objectCompact === name || friendlyCompact === name) {
      score = Math.max(score, 140 + name.length);
      matched = true;
    }
  }

  const includesAll = normalizedList(matcher.includesAll);
  if (includesAll.length > 0 && includesAll.every((token) => sourceCompact.includes(token))) {
    score = Math.max(score, 70 + includesAll.reduce((total, token) => total + token.length, 0));
    matched = true;
  }

  const includesAny = normalizedList(matcher.includesAny);
  const anyMatches = includesAny.filter((token) => sourceCompact.includes(token));
  if (anyMatches.length > 0) {
    score = Math.max(score, 40 + anyMatches.reduce((total, token) => total + token.length, 0));
    matched = true;
  }

  const deviceClass = compactEntityText(candidate.state.attributes.device_class);
  if (normalizedList(matcher.deviceClasses).includes(deviceClass)) {
    score += 18;
    matched = true;
  }

  const unit = compactEntityText(candidate.state.attributes.unit_of_measurement);
  if (normalizedList(matcher.units).includes(unit)) {
    score += 8;
    matched = true;
  }

  if (!matched) return -1;
  if (candidate.state.state !== 'unknown' && candidate.state.state !== 'unavailable') score += 4;
  if (candidate.registry?.platform === 'esphome') score += 2;
  return score;
};

export const resolveProductEntity = (
  hass: HomeAssistant | undefined,
  deviceId: string | undefined,
  matcher: EntityMatcher,
  productMatcher?: ProductDeviceMatcher,
): string | undefined => {
  if (!hass) return undefined;
  let best: { entityId: string; score: number } | undefined;
  for (const candidate of entityCandidates(hass, deviceId, productMatcher)) {
    const score = scoreEntity(candidate, matcher);
    if (score < 0 || (best && best.score >= score)) continue;
    best = { entityId: candidate.entityId, score };
  }
  return best?.entityId;
};

export const stateNumber = (
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
): number | null => {
  if (!hass || !entityId) return null;
  const state = hass.states[entityId]?.state;
  if (!state || state === 'unknown' || state === 'unavailable') return null;
  const value = Number(state);
  return Number.isFinite(value) ? value : null;
};

export const stateBoolean = (
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
): boolean | null => {
  if (!hass || !entityId) return null;
  const state = hass.states[entityId]?.state;
  if (!state || state === 'unknown' || state === 'unavailable') return null;
  if (['on', 'home', 'open', 'detected', 'occupied', 'true'].includes(state.toLowerCase())) return true;
  if (['off', 'not_home', 'closed', 'clear', 'idle', 'false'].includes(state.toLowerCase())) return false;
  return null;
};

export const stateUnit = (
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
): string =>
  (entityId && hass?.states[entityId]?.attributes.unit_of_measurement) || '';

export const connectionStateForDevice = (
  hass: HomeAssistant | undefined,
  deviceId: string | undefined,
): DeviceConnectionState => {
  if (!hass || !deviceId || !hass.entities) {
    return { offline: false, lastSeen: null, hasEntities: false };
  }

  let hasEntities = false;
  let hasAvailableEntity = false;
  let lastSeen: string | null = null;
  let connectivityOffSince: string | null = null;

  for (const [entityId, entry] of Object.entries(hass.entities)) {
    if (entry.device_id !== deviceId || entry.disabled_by) continue;
    const state = hass.states[entityId];
    if (!state) continue;
    hasEntities = true;
    if (state.attributes.device_class === 'connectivity') {
      if (state.state === 'on') {
        return { offline: false, lastSeen: null, hasEntities: true };
      }
      if (state.state === 'off') connectivityOffSince = state.last_changed;
      continue;
    }
    if (entry.platform === 'esphome' && state.state !== 'unavailable') {
      hasAvailableEntity = true;
    }
    if (state.last_changed && (!lastSeen || state.last_changed > lastSeen)) {
      lastSeen = state.last_changed;
    }
  }

  if (connectivityOffSince) {
    return { offline: true, lastSeen: connectivityOffSince, hasEntities };
  }
  return { offline: hasEntities && !hasAvailableEntity, lastSeen, hasEntities };
};

export const formatMetric = (
  value: number | null,
  digits = 0,
  fallback = '—',
): string => {
  if (value === null) return fallback;
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

export const formatPowerMetric = (watts: number | null): { value: string; unit: string } => {
  if (watts === null) return { value: '—', unit: 'W' };
  const absolute = Math.abs(watts);
  if (absolute >= 1000) {
    return { value: formatMetric(absolute / 1000, absolute >= 10000 ? 1 : 2), unit: 'kW' };
  }
  return { value: formatMetric(absolute, 0), unit: 'W' };
};

export const relativeStateTime = (
  hass: HomeAssistant | undefined,
  entityId: string | undefined,
): string | null => {
  if (!hass || !entityId) return null;
  const changed = hass.states[entityId]?.last_changed;
  if (!changed) return null;
  const elapsed = Math.max(0, Date.now() - new Date(changed).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
};
