import type { HomeAssistant } from '../types/home-assistant';

export interface HistoryPoint {
  t: number;
  v: number;
  min?: number;
  max?: number;
  end?: number;
}

interface HistoryLoadOptions {
  period?: '5minute' | 'hour' | 'day' | 'week' | 'month';
  maxPoints?: number;
  significantChangesOnly?: boolean;
  timeoutMs?: number;
  factor?: (entityId: string) => number;
}

const normaliseTimestamp = (value: unknown): number => {
  if (typeof value === 'number') return value > 1000000000000 ? value : value * 1000;
  return Date.parse(String(value));
};

const callWithTimeout = async <T>(
  hass: HomeAssistant,
  message: { type: string; [key: string]: unknown },
  timeoutMs: number,
): Promise<T> => {
  let timer: number | undefined;
  try {
    return await Promise.race([
      hass.callWS<T>(message),
      new Promise<T>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(`${message.type} timed out`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
};

const downsample = (points: HistoryPoint[], maxPoints: number): HistoryPoint[] => {
  if (points.length <= maxPoints) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const interior = points.slice(1, -1);
  const bucketCount = Math.max(1, Math.floor((maxPoints - 2) / 2));
  const sampled: HistoryPoint[] = [first];

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const from = Math.floor(bucket * interior.length / bucketCount);
    const to = Math.floor((bucket + 1) * interior.length / bucketCount);
    const values = interior.slice(from, to);
    if (!values.length) continue;
    const minimum = values.reduce((best, point) => point.v < best.v ? point : best);
    const maximum = values.reduce((best, point) => point.v > best.v ? point : best);
    sampled.push(...(minimum.t <= maximum.t ? [minimum, maximum] : [maximum, minimum]));
  }

  sampled.push(last);
  return sampled.filter((point, index, all) =>
    index === 0 || point.t !== all[index - 1].t || point.v !== all[index - 1].v);
};

/**
 * Load Recorder statistics with raw history as a fallback.
 *
 * Energy and environmental charts use this shared path so they agree on
 * timestamps, min/max ranges, downsampling and Recorder edge cases.
 */
export const loadHistorySeries = async (
  hass: HomeAssistant,
  entityIds: string[],
  start: Date,
  end: Date,
  options: HistoryLoadOptions = {},
): Promise<Record<string, HistoryPoint[]>> => {
  const ids = [...new Set(entityIds.filter(Boolean))];
  if (!ids.length) return {};

  const period = options.period ?? '5minute';
  const maxPoints = Math.max(2, options.maxPoints ?? 360);
  const timeoutMs = options.timeoutMs ?? 25000;
  const [statisticsResult, historyResult] = await Promise.allSettled([
    callWithTimeout<Record<string, any[]>>(hass, {
      type: 'recorder/statistics_during_period',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      statistic_ids: ids,
      period,
      types: ['mean', 'min', 'max'],
    }, timeoutMs),
    callWithTimeout<Record<string, any[]>>(hass, {
      type: 'history/history_during_period',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      entity_ids: ids,
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: options.significantChangesOnly ?? true,
    }, timeoutMs),
  ]);

  const output: Record<string, HistoryPoint[]> = {};
  for (const entityId of ids) {
    const factor = options.factor?.(entityId) ?? 1;
    const statistics = statisticsResult.status === 'fulfilled'
      ? statisticsResult.value[entityId] || []
      : [];
    const statisticPoints = statistics.map((point: any) => {
      const rawMean = Number(point.mean);
      const rawMinimum = Number(point.min ?? point.mean);
      const rawMaximum = Number(point.max ?? point.mean);
      const minimum = factor < 0 ? rawMaximum * factor : rawMinimum * factor;
      const maximum = factor < 0 ? rawMinimum * factor : rawMaximum * factor;
      return {
        t: normaliseTimestamp(point.start),
        end: normaliseTimestamp(point.end),
        v: rawMean * factor,
        min: minimum,
        max: maximum,
      };
    }).filter((point: HistoryPoint) =>
      Number.isFinite(point.t)
      && point.t > 0
      && Number.isFinite(point.v)
      && Number.isFinite(point.min)
      && Number.isFinite(point.max));

    if (statisticPoints.length > 1) {
      output[entityId] = downsample(statisticPoints, maxPoints);
      continue;
    }

    const history = historyResult.status === 'fulfilled'
      ? historyResult.value[entityId] || []
      : [];
    const points = history.map((point: any) => {
      const rawTime = point.lu ?? point.lc ?? point.last_updated ?? point.last_changed;
      return {
        t: normaliseTimestamp(rawTime),
        v: factor * Number(point.s ?? point.state),
      };
    }).filter((point: HistoryPoint) =>
      Number.isFinite(point.t) && point.t > 0 && Number.isFinite(point.v));
    output[entityId] = downsample(points, maxPoints);
  }

  return output;
};
