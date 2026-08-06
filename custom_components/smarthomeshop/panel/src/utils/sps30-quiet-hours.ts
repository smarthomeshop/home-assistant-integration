export type QuietHoursEntityStatus = 'ready' | 'unknown' | 'unavailable' | 'missing';

export interface QuietHoursStateSnapshot {
  state: string;
  last_updated?: string;
}

export class QuietHoursUpdateError extends Error {
  readonly kind: 'service' | 'timeout';

  constructor(kind: 'service' | 'timeout', message: string) {
    super(message);
    this.name = 'QuietHoursUpdateError';
    this.kind = kind;
  }
}

export const QUIET_HOUR_VALUES = Object.freeze(
  Array.from({ length: 24 }, (_, hour) => hour),
);

export const SPS30_IDLE_INTERVAL_CHOICES = Object.freeze([0, 5, 10, 15, 30]);
export const SPS30_IDLE_INTERVAL_DEFAULT = 5;

export const parseQuietHour = (value: unknown): number | null => {
  const hour = Number(value);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
};

export const formatQuietHour = (value: unknown): string => {
  const hour = parseQuietHour(value);
  return hour === null ? '—' : `${String(hour).padStart(2, '0')}:00`;
};

export const isQuietScheduleAllDay = (start: unknown, end: unknown): boolean => {
  const startHour = parseQuietHour(start);
  const endHour = parseQuietHour(end);
  return startHour !== null && endHour !== null && startHour === endHour;
};

export const parseSps30IdleInterval = (value: unknown): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 0 && minutes <= 30 ? minutes : null;
};

export const sps30IdleIntervalAvailability = (
  quietHoursStatus: 'complete' | 'partial' | 'unsupported' | undefined,
  hasEntity: boolean,
): 'control' | 'firmware_update' | 'hidden' => {
  if (quietHoursStatus !== 'complete') return 'hidden';
  return hasEntity ? 'control' : 'firmware_update';
};

export const sps30IdleIntervalPresentation = (
  value: unknown,
  quietHoursActive: boolean,
): { configuredMinutes: number | null; temporarilyOverridden: boolean } => ({
  configuredMinutes: parseSps30IdleInterval(value),
  temporarilyOverridden: quietHoursActive,
});

export const shouldRenderQuietHours = (
  status: 'complete' | 'partial' | 'unsupported' | undefined,
): boolean => status === 'complete' || status === 'partial';

export const quietHoursEntityStatus = (
  snapshot: QuietHoursStateSnapshot | undefined,
): QuietHoursEntityStatus => {
  if (!snapshot) return 'missing';
  if (snapshot.state === 'unavailable') return 'unavailable';
  if (snapshot.state === 'unknown' || snapshot.state === '') return 'unknown';
  return 'ready';
};

export const performConfirmedEntityUpdate = async (
  action: () => Promise<void>,
  readState: () => QuietHoursStateSnapshot | undefined,
  matchesExpectedState: (state: string) => boolean,
  timeoutMs = 8000,
  pollMs = 100,
): Promise<QuietHoursStateSnapshot> => {
  const previous = readState();
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new QuietHoursUpdateError('service', message);
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    const current = readState();
    const receivedUpdate = !!current && (
      !previous
      || current.last_updated !== previous.last_updated
      || current.state !== previous.state
    );
    if (current && receivedUpdate && matchesExpectedState(current.state)) return current;
    await new Promise<void>(resolve => globalThis.setTimeout(resolve, pollMs));
  }

  throw new QuietHoursUpdateError(
    'timeout',
    'Home Assistant did not receive the expected entity state in time.',
  );
};
