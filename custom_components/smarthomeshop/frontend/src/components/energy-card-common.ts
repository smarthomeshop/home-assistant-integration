import { css, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';

export interface EnergySources {
  p1_device?: string;
  solar_power?: string;
  solar_invert?: boolean;
  battery_power?: string;
  battery_invert?: boolean;
  battery_soc?: string;
}

export interface PriceRow {
  start: string;
  market?: number;
  consumer: number;
  feed_in?: number;
}

export interface HistoryPoint {
  t: number;
  v: number;
  min?: number;
  max?: number;
  end?: number;
}

export interface EnergyContext {
  sources: EnergySources;
  netEntity?: string;
  priceEntity?: string;
  priceEntities: Record<string, string | null>;
  account: Record<string, any>;
  savings: Record<string, number>;
}

export interface BaseEnergyCardConfig {
  type?: string;
  title?: string;
  show_header?: boolean;
}

let contextCache: { loadedAt: number; value: EnergyContext } | undefined;
let contextRequest: Promise<EnergyContext> | undefined;
const refreshListeners = new Set<() => void>();
let refreshTimer: number | undefined;

const subscribeEnergyRefresh = (listener: () => void): (() => void) => {
  refreshListeners.add(listener);
  if (refreshTimer === undefined) {
    refreshTimer = window.setInterval(() => {
      refreshListeners.forEach((refresh) => refresh());
    }, 60000);
  }
  return () => {
    refreshListeners.delete(listener);
    if (!refreshListeners.size && refreshTimer !== undefined) {
      window.clearInterval(refreshTimer);
      refreshTimer = undefined;
    }
  };
};

const callWS = async <T>(
  hass: HomeAssistant,
  message: { type: string; [key: string]: unknown },
  timeoutMs = 8000,
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

const resolveNetEntity = (hass: HomeAssistant, sources: EnergySources): string | undefined => {
  const entries = Object.values(hass.entities || {});
  const selected = sources.p1_device
    ? entries.find((entry) =>
      entry.device_id === sources.p1_device
      && entry.entity_id.startsWith('sensor.')
      && entry.entity_id.includes('_net_grid_power'))
    : undefined;
  if (selected) return selected.entity_id;

  return Object.keys(hass.states || {})
    .find((entityId) => entityId.startsWith('sensor.') && entityId.includes('_net_grid_power'));
};

export const loadEnergyContext = async (
  hass: HomeAssistant,
  force = false,
): Promise<EnergyContext> => {
  const fresh = contextCache && Date.now() - contextCache.loadedAt < 30000;
  if (!force && fresh) {
    return {
      ...contextCache!.value,
      netEntity: resolveNetEntity(hass, contextCache!.value.sources),
    };
  }
  // A forced refresh may bypass the cache, but never an identical request that
  // is already in flight. This keeps a dashboard with several Energy cards to
  // one sources/prices/account/savings request per refresh cycle.
  if (contextRequest) return contextRequest;

  contextRequest = (async () => {
    const [sourcesResult, pricesResult, accountResult, savingsResult] = await Promise.allSettled([
      callWS<{ sources: EnergySources }>(hass, { type: 'smarthomeshop/energy_sources' }),
      callWS<{ entities: Record<string, string | null> }>(hass, { type: 'smarthomeshop/prices/entities' }),
      callWS<Record<string, any>>(hass, { type: 'smarthomeshop/account' }, 12000),
      callWS<{ savings: Record<string, number> }>(hass, { type: 'smarthomeshop/savings' }),
    ]);

    const sources = sourcesResult.status === 'fulfilled' ? sourcesResult.value.sources || {} : {};
    const value: EnergyContext = {
      sources,
      netEntity: resolveNetEntity(hass, sources),
      priceEntity: pricesResult.status === 'fulfilled'
        ? pricesResult.value.entities?.electricity_price || undefined
        : undefined,
      priceEntities: pricesResult.status === 'fulfilled'
        ? pricesResult.value.entities || {}
        : {},
      account: accountResult.status === 'fulfilled' ? accountResult.value || {} : {},
      savings: savingsResult.status === 'fulfilled' ? savingsResult.value.savings || {} : {},
    };
    contextCache = { loadedAt: Date.now(), value };
    return value;
  })().finally(() => {
    contextRequest = undefined;
  });

  return contextRequest;
};

export const loadPowerHistory = async (
  hass: HomeAssistant,
  context: EnergyContext,
): Promise<Record<string, HistoryPoint[]>> => {
  const ids = [
    context.netEntity,
    context.sources.solar_power,
    context.sources.battery_power,
  ].filter(Boolean) as string[];
  if (!ids.length) return {};

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [statisticsResult, historyResult] = await Promise.allSettled([
    callWS<Record<string, any[]>>(hass, {
      type: 'recorder/statistics_during_period',
      start_time: start.toISOString(),
      end_time: new Date().toISOString(),
      statistic_ids: ids,
      period: '5minute',
      types: ['mean', 'min', 'max'],
    }, 25000),
    callWS<Record<string, any[]>>(hass, {
      type: 'history/history_during_period',
      start_time: start.toISOString(),
      entity_ids: ids,
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: true,
    }, 25000),
  ]);

  const output: Record<string, HistoryPoint[]> = {};
  ids.forEach((entityId) => {
    const invert = entityId === context.sources.solar_power
      ? !!context.sources.solar_invert
      : entityId === context.sources.battery_power
        ? !!context.sources.battery_invert
        : false;
    const factor = unitScale(hass, entityId) * (invert ? -1 : 1);
    const statistics = statisticsResult.status === 'fulfilled'
      ? statisticsResult.value[entityId] || []
      : [];
    const statisticPoints = statistics.map((point: any) => {
      const mean = Number(point.mean);
      const rawMinimum = Number(point.min);
      const rawMaximum = Number(point.max);
      const minimum = factor < 0 ? rawMaximum * factor : rawMinimum * factor;
      const maximum = factor < 0 ? rawMinimum * factor : rawMaximum * factor;
      return {
        t: normaliseTimestamp(point.start),
        end: normaliseTimestamp(point.end),
        v: mean * factor,
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
      output[entityId] = statisticPoints;
      return;
    }

    const history = historyResult.status === 'fulfilled'
      ? historyResult.value[entityId] || []
      : [];
    const points = history.map((point: any) => {
      const rawTime = point.lu ?? point.lc ?? point.last_updated ?? point.last_changed;
      const numericTime = normaliseTimestamp(rawTime);
      return { t: numericTime, v: factor * Number(point.s ?? point.state) };
    }).filter((point: HistoryPoint) =>
      Number.isFinite(point.t) && point.t > 0 && Number.isFinite(point.v));
    output[entityId] = downsample(points, 360);
  });
  return output;
};

const normaliseTimestamp = (value: unknown): number => {
  if (typeof value === 'number') return value > 1000000000000 ? value : value * 1000;
  return Date.parse(String(value));
};

interface CardHelpers {
  createCardElement(config: Record<string, unknown>): HTMLElement;
}

declare global {
  interface Window {
    loadCardHelpers?: () => Promise<CardHelpers>;
    __shsStatisticsChartReady?: Promise<boolean>;
  }
}

export const ensureStatisticsChart = async (probeEntity?: string): Promise<boolean> => {
  if (customElements.get('statistics-chart')) return true;
  if (!window.loadCardHelpers) return false;
  if (!window.__shsStatisticsChartReady) {
    window.__shsStatisticsChartReady = (async () => {
      const helpers = await window.loadCardHelpers!();
      helpers.createCardElement({
        type: 'statistics-graph',
        entities: probeEntity ? [probeEntity] : ['sensor.invalid'],
      });
      return Promise.race([
        customElements.whenDefined('statistics-chart').then(() => true),
        new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 8000)),
      ]);
    })().catch(() => false);
  }
  return window.__shsStatisticsChartReady;
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

export const unitScale = (hass: HomeAssistant, entityId?: string): number => {
  const unit = String(entityId ? hass.states[entityId]?.attributes?.unit_of_measurement || '' : '');
  return /^kw$/i.test(unit) ? 1000 : 1;
};

export const stateNumber = (
  hass: HomeAssistant,
  entityId?: string,
  invert = false,
): number | null => {
  if (!entityId) return null;
  const state = hass.states[entityId];
  if (!state || state.state === 'unknown' || state.state === 'unavailable') return null;
  const value = Number(state.state);
  if (!Number.isFinite(value)) return null;
  return value * unitScale(hass, entityId) * (invert ? -1 : 1);
};

export const isEntityUnavailable = (hass: HomeAssistant, entityId?: string): boolean => {
  if (!entityId) return false;
  const state = hass.states[entityId];
  return !state || state.state === 'unknown' || state.state === 'unavailable';
};

export const formatPower = (
  watts: number | null,
  absolute = false,
): { value: string; unit: string } => {
  if (watts === null) return { value: '—', unit: '' };
  const value = absolute ? Math.abs(watts) : watts;
  if (Math.abs(value) >= 1000) return { value: (value / 1000).toFixed(2), unit: 'kW' };
  return { value: String(Math.round(value)), unit: 'W' };
};

export const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  return `€ ${Number(value).toFixed(3)}`;
};

export const formatEuro = (value: number): string =>
  `${value < 0 ? '−' : ''}€ ${Math.abs(value).toFixed(2)}`;

export const formatTime = (value: string | number): string => {
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const priceRows = (
  hass: HomeAssistant,
  context: EnergyContext | undefined,
  day: 'today' | 'tomorrow',
): PriceRow[] => {
  const attributes = context?.priceEntity
    ? hass.states[context.priceEntity]?.attributes
    : undefined;
  const rows = day === 'today' ? attributes?.prices_today : attributes?.prices_tomorrow;
  return Array.isArray(rows)
    ? rows.filter((row: any) =>
      row && typeof row.start === 'string' && Number.isFinite(Number(row.consumer)))
      .map((row: any) => ({
        start: row.start,
        market: Number.isFinite(Number(row.market)) ? Number(row.market) : undefined,
        consumer: Number(row.consumer),
        feed_in: Number.isFinite(Number(row.feed_in)) ? Number(row.feed_in) : undefined,
      }))
    : [];
};

export const fireMoreInfo = (element: HTMLElement, entityId?: string): void => {
  if (!entityId) return;
  element.dispatchEvent(new CustomEvent('hass-more-info', {
    detail: { entityId },
    bubbles: true,
    composed: true,
  }));
};

export abstract class EnergyCardBase<T extends BaseEnergyCardConfig> extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() protected context?: EnergyContext;
  @state() protected loading = true;
  @state() protected loadError = '';
  protected config!: T;
  private unsubscribeRefresh?: () => void;
  private loadStarted = false;

  public connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribeRefresh = subscribeEnergyRefresh(() => void this.load(true));
  }

  public disconnectedCallback(): void {
    this.unsubscribeRefresh?.();
    this.unsubscribeRefresh = undefined;
    super.disconnectedCallback();
  }

  protected firstUpdated(): void {
    if (!this.loadStarted) void this.load();
  }

  protected async load(force = false): Promise<void> {
    if (!this.hass) return;
    this.loadStarted = true;
    if (!this.context) this.loading = true;
    try {
      this.context = await loadEnergyContext(this.hass, force);
      this.loadError = '';
      await this.afterContextLoaded();
    } catch (error: any) {
      this.loadError = error?.message || 'Smart Energy data could not be loaded.';
    } finally {
      this.loading = false;
    }
  }

  protected async afterContextLoaded(): Promise<void> {}

  protected renderHeader(defaultTitle: string, subtitle: string, icon: string) {
    if (this.config.show_header === false) return null;
    return {
      title: this.config.title || defaultTitle,
      subtitle,
      icon,
    };
  }
}

export const energyCardStyles = css`
  :host {
    display: block;
    color: var(--primary-text-color);
    --shs-blue: var(--primary-color, #4361ee);
    --shs-green: var(--success-color, #159957);
    --shs-amber: var(--warning-color, #d8890b);
    --shs-red: var(--error-color, #d34a4a);
    --shs-blue-soft: color-mix(in srgb, var(--shs-blue) 11%, var(--card-background-color));
    --shs-green-soft: color-mix(in srgb, var(--shs-green) 11%, var(--card-background-color));
    --shs-amber-soft: color-mix(in srgb, var(--shs-amber) 12%, var(--card-background-color));
    --shs-red-soft: color-mix(in srgb, var(--shs-red) 10%, var(--card-background-color));
    --shs-line: color-mix(in srgb, var(--divider-color) 82%, transparent);
    --shs-surface: color-mix(in srgb, var(--secondary-background-color) 72%, var(--card-background-color));
  }

  * { box-sizing: border-box; }
  ha-card { overflow: hidden; container-type: inline-size; }
  button { font: inherit; -webkit-tap-highlight-color: transparent; }
  button:focus-visible, [tabindex="0"]:focus-visible {
    outline: 2px solid var(--shs-blue);
    outline-offset: 2px;
  }
  .sr-only {
    width: 1px;
    height: 1px;
    padding: 0;
    position: absolute;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .card-shell { padding: 18px; }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 16px;
  }
  .head-main { display: flex; align-items: center; min-width: 0; gap: 11px; }
  .head-icon {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--shs-blue);
    background: var(--shs-blue-soft);
  }
  .head-icon ha-icon { --mdc-icon-size: 20px; }
  .head-title { margin: 0; font-size: 15px; font-weight: 720; line-height: 1.25; }
  .head-subtitle {
    margin-top: 2px;
    color: var(--secondary-text-color);
    font-size: 11px;
    line-height: 1.3;
  }
  .loading, .empty {
    min-height: 132px;
    padding: 24px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 9px;
    color: var(--secondary-text-color);
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
  }
  .empty ha-icon { --mdc-icon-size: 28px; color: var(--shs-blue); }
  .empty strong { color: var(--primary-text-color); font-size: 14px; }
  .skeleton {
    width: min(280px, 80%);
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--shs-surface), var(--shs-line), var(--shs-surface));
    background-size: 200% 100%;
    animation: shs-energy-loading 1.4s ease-in-out infinite;
  }
  @keyframes shs-energy-loading { to { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }

  @container (max-width: 420px) {
    .card-shell { padding: 14px; }
    .card-head { margin-bottom: 13px; }
    .head-icon { width: 31px; height: 31px; flex-basis: 31px; border-radius: 9px; }
  }
`;
