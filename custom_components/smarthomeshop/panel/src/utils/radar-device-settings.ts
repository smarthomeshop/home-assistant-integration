import type { DeviceEntity, RadarDeviceProfilePayload } from '../types';

export type RadarFallRole =
  | 'enabled'
  | 'mounting_height'
  | 'low_height'
  | 'fall_hold'
  | 'low_hold'
  | 'possible_fall'
  | 'prolonged_low'
  | 'status';

export interface RadarDeviceSettingsCapability {
  profile?: RadarDeviceProfilePayload | null;
  fall: {
    status: 'complete' | 'partial' | 'unsupported';
    entities: Partial<Record<RadarFallRole, string>>;
    missing: RadarFallRole[];
  };
}

interface RoleSpec {
  domain: string;
  names: string[];
  suffixes: string[];
}

const FALL_SPECS: Record<RadarFallRole, RoleSpec> = {
  enabled: {
    domain: 'switch',
    names: ['Experimental Fall Detection'],
    suffixes: ['ld6002b_fall_enabled', 'experimental_fall_detection'],
  },
  mounting_height: {
    domain: 'number',
    names: ['Fall Detection Mounting Height'],
    suffixes: ['ld6002b_fall_height', 'fall_detection_mounting_height'],
  },
  low_height: {
    domain: 'number',
    names: ['Fall Detection Low Height Threshold'],
    suffixes: ['ld6002b_fall_low_height', 'fall_detection_low_height_threshold'],
  },
  fall_hold: {
    domain: 'number',
    names: ['Possible Fall Hold Time'],
    suffixes: ['ld6002b_fall_hold', 'possible_fall_hold_time'],
  },
  low_hold: {
    domain: 'number',
    names: ['Prolonged Low Hold Time'],
    suffixes: ['ld6002b_fall_low_hold', 'prolonged_low_hold_time'],
  },
  possible_fall: {
    domain: 'binary_sensor',
    names: ['Possible Fall (Experimental)'],
    suffixes: ['ld6002b_possible_fall', 'possible_fall_experimental'],
  },
  prolonged_low: {
    domain: 'binary_sensor',
    names: ['Prolonged Low (Experimental)'],
    suffixes: ['ld6002b_prolonged_low', 'prolonged_low_experimental'],
  },
  status: {
    domain: 'sensor',
    names: ['Fall Detection Status (Experimental)'],
    suffixes: ['ld6002b_fall_detection_status', 'fall_detection_status_experimental'],
  },
};

const normalise = (value: unknown): string => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const identitySuffix = (value: unknown, suffix: string): boolean => {
  const identity = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return identity === suffix || identity.endsWith(`_${suffix}`);
};

/** Resolve a device-associated ESPHome entity without assuming its generated prefix. */
export const resolveRadarRoleEntity = (
  entities: readonly DeviceEntity[],
  spec: RoleSpec,
): DeviceEntity | undefined => {
  const names = new Set(spec.names.map(normalise));
  return entities
    .filter(entity => entity.platform === 'esphome' && entity.domain === spec.domain)
    .map(entity => {
      const originalMatch = names.has(normalise(entity.original_name));
      const suffixMatch = spec.suffixes.some(suffix =>
        [entity.unique_id, entity.entity_id].some(value => identitySuffix(value, suffix)));
      return { entity, rank: originalMatch ? 0 : suffixMatch ? 1 : 2 };
    })
    .filter(candidate => candidate.rank < 2)
    .sort((left, right) => left.rank - right.rank || left.entity.entity_id.localeCompare(right.entity.entity_id))[0]?.entity;
};

export const resolveRadarDeviceSettings = (
  entities: readonly DeviceEntity[],
  profile?: RadarDeviceProfilePayload | null,
): RadarDeviceSettingsCapability => {
  const resolved = Object.fromEntries(
    (Object.entries(FALL_SPECS) as Array<[RadarFallRole, RoleSpec]>)
      .map(([role, spec]) => [role, resolveRadarRoleEntity(entities, spec)?.entity_id])
      .filter(([, entityId]) => !!entityId),
  ) as Partial<Record<RadarFallRole, string>>;

  const required: RadarFallRole[] = ['enabled', 'mounting_height', 'low_height', 'fall_hold', 'low_hold'];
  const missing = required.filter(role => !resolved[role]);
  const anyFallEntity = Object.keys(resolved).length > 0;
  const modelSupportsFall = profile?.profile.radar_model === 'ld6002b';
  const status = !modelSupportsFall && !anyFallEntity
    ? 'unsupported'
    : missing.length
      ? 'partial'
      : 'complete';

  return { profile, fall: { status, entities: resolved, missing } };
};

export const radarEntityState = (
  entity: DeviceEntity | undefined,
  states: Record<string, { state: string }> | undefined,
): 'missing' | 'unavailable' | 'unknown' | 'ready' => {
  if (!entity) return 'missing';
  // Once the live HA state map is available it is authoritative. Falling back
  // to the registry snapshot after an entity disappears can falsely show an
  // old `off` state as a current, safe fall-detection status.
  const state = states === undefined ? entity.state : states[entity.entity_id]?.state;
  if (state === 'unavailable') return 'unavailable';
  if (state === undefined || state === null || state === '' || state === 'unknown') return 'unknown';
  return 'ready';
};
