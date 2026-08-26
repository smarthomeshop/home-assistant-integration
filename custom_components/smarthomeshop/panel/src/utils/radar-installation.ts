export type RadarInstallationEntityState = {
  state: string;
  last_updated?: string;
};

export type RadarInstallationEntityStatus = 'ready' | 'unknown' | 'unavailable' | 'missing';
export type RadarInstallationControlAvailability = 'complete' | 'partial' | 'firmware_update' | 'not_applicable';

export const LD2460_HEIGHT_RANGE = { minimum: 0.1, maximum: 10, step: 0.01 } as const;
export const LD2460_ANGLE_RANGE = { minimum: 0, maximum: 90, step: 0.1 } as const;
export const LD2460_DETECTION_DISTANCE_RANGE = { minimum: 0.1, maximum: 6, step: 0.1 } as const;
export const LD2460_DETECTION_ANGLE_RANGE = { minimum: -60, maximum: 60, step: 0.1 } as const;

export type RadarDetectionSector = {
  distanceM: number;
  startAngleDeg: number;
  endAngleDeg: number;
};

export type RadarMovementSample = { x: number; y: number };

export const validateRadarDetectionSector = (
  sector: RadarDetectionSector,
): 'ready' | 'range' | 'angle_order' => {
  if (
    !Number.isFinite(sector.distanceM)
    || sector.distanceM < LD2460_DETECTION_DISTANCE_RANGE.minimum
    || sector.distanceM > LD2460_DETECTION_DISTANCE_RANGE.maximum
    || !Number.isFinite(sector.startAngleDeg)
    || !Number.isFinite(sector.endAngleDeg)
    || sector.startAngleDeg < LD2460_DETECTION_ANGLE_RANGE.minimum
    || sector.startAngleDeg > LD2460_DETECTION_ANGLE_RANGE.maximum
    || sector.endAngleDeg < LD2460_DETECTION_ANGLE_RANGE.minimum
    || sector.endAngleDeg > LD2460_DETECTION_ANGLE_RANGE.maximum
  ) return 'range';
  return sector.startAngleDeg < sector.endAngleDeg ? 'ready' : 'angle_order';
};

const movementDelta = (samples: RadarMovementSample[]): RadarMovementSample | null => {
  const usable = samples.filter(sample => Number.isFinite(sample.x) && Number.isFinite(sample.y));
  if (usable.length < 2) return null;
  const xs = usable.map(sample => sample.x);
  const ys = usable.map(sample => sample.y);
  return {
    x: Math.max(...xs) - Math.min(...xs),
    y: Math.max(...ys) - Math.min(...ys),
  };
};

/** Validate the physical LD2460 orientation from actual normalized X/Y motion. */
export const evaluateRadarOrientationWalk = (
  kind: 'forward' | 'sideways',
  samples: RadarMovementSample[],
): boolean => {
  const delta = movementDelta(samples);
  if (!delta) return false;
  return kind === 'forward'
    ? delta.y >= 500 && delta.y >= delta.x * 1.5
    : delta.x >= 500 && delta.x >= delta.y * 1.25;
};

export const parseRadarInstallationNumber = (
  raw: unknown,
  minimum: number,
  maximum: number,
): number | null => {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= minimum && value <= maximum ? value : null;
};

export const radarInstallationEntityStatus = (
  entity: RadarInstallationEntityState | undefined,
): RadarInstallationEntityStatus => {
  if (!entity) return 'missing';
  const state = entity.state.trim().toLowerCase();
  if (state === 'unavailable') return 'unavailable';
  if (!state || ['unknown', 'none', 'null', 'nan'].includes(state)) return 'unknown';
  return 'ready';
};

export const radarInstallationAvailability = (
  radarModel: string,
  requiredMode: string | null,
  heightEntityId: string | null,
  angleEntityId: string | null,
): RadarInstallationControlAvailability => {
  if (radarModel.toLowerCase() !== 'ld2460' || requiredMode !== 'side') return 'not_applicable';
  if (heightEntityId && angleEntityId) return 'complete';
  if (heightEntityId || angleEntityId) return 'partial';
  return 'firmware_update';
};

export class RadarInstallationUpdateError extends Error {
  public readonly kind: 'service' | 'timeout';

  constructor(
    kind: 'service' | 'timeout',
    message: string,
  ) {
    super(message);
    this.name = 'RadarInstallationUpdateError';
    this.kind = kind;
  }
}

export const performConfirmedRadarUpdate = async <T extends RadarInstallationEntityState>(
  callService: () => Promise<unknown>,
  readState: () => T | undefined,
  accepted: (state: string) => boolean,
  timeoutMs = 10_000,
  pollMs = 100,
): Promise<T> => {
  const before = readState();
  try {
    await callService();
  } catch (error: any) {
    const detail = typeof error?.message === 'string' && error.message.trim()
      ? error.message.trim()
      : 'Home Assistant rejected the service call.';
    throw new RadarInstallationUpdateError('service', detail);
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    const current = readState();
    const changed = !!current && (
      !before
      || current.state !== before.state
      || current.last_updated !== before.last_updated
    );
    if (current && changed && accepted(current.state)) return current;
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }
  throw new RadarInstallationUpdateError(
    'timeout',
    'The radar did not confirm the new value in time.',
  );
};
