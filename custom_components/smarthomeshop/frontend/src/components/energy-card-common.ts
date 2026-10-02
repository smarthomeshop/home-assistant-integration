import { css, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';
import { loadHistorySeries, type HistoryPoint } from '../utils/history';
import { CardLocalizationController } from '../utils/runtime-translations';

export type { HistoryPoint } from '../utils/history';

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
  end?: string;
  resolution?: 'hour' | 'quarter-hour';
  market?: number;
  consumer: number;
  feed_in?: number;
  kind?: 'confirmed' | 'predicted';
  confidence?: number;
}

export interface DailyElectricityCost {
  importedKwh: number;
  exportedKwh: number;
  importCost: number;
  exportValue: number;
  netCost: number;
  averageImportPrice: number | null;
  averageExportPrice: number | null;
  coverage: number;
  predictedPrices: boolean;
}

export interface EnergyContext {
  sources: EnergySources;
  netEntity?: string;
  gridImportEntity?: string;
  gridExportEntity?: string;
  priceEntity?: string;
  priceEntities: Record<string, string | null>;
  account: Record<string, any>;
  savings: Record<string, any>;
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

const resolveGridEntities = (
  hass: HomeAssistant,
  sources: EnergySources,
): Pick<EnergyContext, 'netEntity' | 'gridImportEntity' | 'gridExportEntity'> => {
  const entries = Object.values(hass.entities || {});
  const selected = sources.p1_device
    ? entries.filter((entry) =>
      entry.device_id === sources.p1_device && entry.entity_id.startsWith('sensor.'))
    : [];
  const netEntity = selected.find((entry) => entry.entity_id.includes('_net_grid_power'))?.entity_id;
  const gridImportEntity = selected.find((entry) => entry.entity_id.endsWith('_power_consumed'))?.entity_id;
  const gridExportEntity = selected.find((entry) => entry.entity_id.endsWith('_power_produced'))?.entity_id;
  if (netEntity || gridImportEntity || gridExportEntity) {
    return { netEntity, gridImportEntity, gridExportEntity };
  }

  return {
    netEntity: Object.keys(hass.states || {})
      .find((entityId) => entityId.startsWith('sensor.') && entityId.includes('_net_grid_power')),
    gridImportEntity: undefined,
    gridExportEntity: undefined,
  };
};

export const loadEnergyContext = async (
  hass: HomeAssistant,
  force = false,
): Promise<EnergyContext> => {
  const fresh = contextCache && Date.now() - contextCache.loadedAt < 30000;
  if (!force && fresh) {
    const grid = resolveGridEntities(hass, contextCache!.value.sources);
    return {
      ...contextCache!.value,
      ...grid,
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
      callWS<{ savings: Record<string, any> }>(hass, { type: 'smarthomeshop/savings' }),
    ]);

    const sources = sourcesResult.status === 'fulfilled' ? sourcesResult.value.sources || {} : {};
    const grid = resolveGridEntities(hass, sources);
    const value: EnergyContext = {
      sources,
      ...grid,
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
    context.gridImportEntity,
    context.gridExportEntity,
    context.sources.solar_power,
    context.sources.battery_power,
  ].filter(Boolean) as string[];
  if (!ids.length) return {};

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return loadHistorySeries(hass, ids, start, new Date(), {
    period: '5minute',
    maxPoints: 360,
    significantChangesOnly: true,
    factor: (entityId) => {
      const invert = entityId === context.sources.solar_power
        ? !!context.sources.solar_invert
        : entityId === context.sources.battery_power
          ? !!context.sources.battery_invert
          : false;
      return unitScale(hass, entityId) * (invert ? -1 : 1);
    },
  });
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

export const gridPower = (
  hass: HomeAssistant,
  context: EnergyContext | undefined,
): number | null => {
  if (!context) return null;
  const net = stateNumber(hass, context.netEntity);
  if (net !== null) return net;
  const imported = stateNumber(hass, context.gridImportEntity);
  const exported = stateNumber(hass, context.gridExportEntity);
  if ((context.gridImportEntity && imported === null)
    || (context.gridExportEntity && exported === null)) return null;
  if (imported === null && exported === null) return null;
  return (imported ?? 0) - (exported ?? 0);
};

export const isGridUnavailable = (
  hass: HomeAssistant,
  context: EnergyContext | undefined,
): boolean => {
  if (!context) return false;
  if (context.netEntity && !isEntityUnavailable(hass, context.netEntity)) return false;
  const rawIds = [context.gridImportEntity, context.gridExportEntity].filter(Boolean) as string[];
  if (rawIds.length) return rawIds.some((entityId) => isEntityUnavailable(hass, entityId));
  return !!context.netEntity && isEntityUnavailable(hass, context.netEntity);
};

export const gridHistory = (
  context: EnergyContext | undefined,
  history: Record<string, HistoryPoint[]>,
): HistoryPoint[] => {
  if (!context) return [];
  const imported = context.gridImportEntity ? history[context.gridImportEntity] || [] : [];
  const exported = context.gridExportEntity ? history[context.gridExportEntity] || [] : [];
  const net = context.netEntity ? history[context.netEntity] || [] : [];
  // Raw import/export entities often have a full Recorder history while the
  // integration's combined helper may only exist since the last restart.
  // Prefer the raw pair once it contains a useful series, otherwise fall back
  // to the signed helper.
  if (imported.length + exported.length < 2) return net;

  const timestamps = [...new Set([
    ...imported.map((point) => point.t),
    ...exported.map((point) => point.t),
  ])].sort((a, b) => a - b);
  let importIndex = 0;
  let exportIndex = 0;
  let importPoint: HistoryPoint | undefined;
  let exportPoint: HistoryPoint | undefined;
  return timestamps.map((timestamp) => {
    while (importIndex < imported.length && imported[importIndex].t <= timestamp) {
      importPoint = imported[importIndex++];
    }
    while (exportIndex < exported.length && exported[exportIndex].t <= timestamp) {
      exportPoint = exported[exportIndex++];
    }
    const importedValue = importPoint?.v ?? 0;
    const exportedValue = exportPoint?.v ?? 0;
    return {
      t: timestamp,
      end: Math.max(importPoint?.end ?? timestamp, exportPoint?.end ?? timestamp),
      v: importedValue - exportedValue,
      min: (importPoint?.min ?? importedValue) - (exportPoint?.max ?? exportedValue),
      max: (importPoint?.max ?? importedValue) - (exportPoint?.min ?? exportedValue),
    };
  });
};

export const formatPower = (
  watts: number | null,
  absolute = false,
): { value: string; unit: string } => {
  if (watts === null) return { value: '-', unit: '' };
  const value = absolute ? Math.abs(watts) : watts;
  if (Math.abs(value) >= 1000) return { value: (value / 1000).toFixed(2), unit: 'kW' };
  return { value: String(Math.round(value)), unit: 'W' };
};

export const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '-';
  return `€ ${Number(value).toFixed(3)}`;
};

export const formatEuro = (value: number): string =>
  `${value < 0 ? '−' : ''}€ ${Math.abs(value).toFixed(2)}`;

export const formatTime = (value: string | number): string => {
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (!Number.isFinite(date.getTime())) return '-';
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
  const confirmed = day === 'today' ? attributes?.prices_today : attributes?.prices_tomorrow;
  const rows = Array.isArray(confirmed) && confirmed.length
    ? confirmed
    : (Array.isArray(attributes?.forecast)
      ? attributes.forecast.filter((row: any) => {
        if (!row || typeof row.start !== 'string') return false;
        const target = new Date();
        if (day === 'tomorrow') target.setDate(target.getDate() + 1);
        const start = new Date(row.start);
        return Number.isFinite(start.getTime())
          && start.getFullYear() === target.getFullYear()
          && start.getMonth() === target.getMonth()
          && start.getDate() === target.getDate();
      })
      : []);
  return rows
    .filter((row: any) =>
      row && typeof row.start === 'string' && Number.isFinite(Number(row.consumer)))
    .map((row: any) => ({
        start: row.start,
        end: typeof row.end === 'string' ? row.end : undefined,
        resolution: row.resolution === 'quarter-hour' ? 'quarter-hour' : 'hour',
        market: Number.isFinite(Number(row.market)) ? Number(row.market) : undefined,
        consumer: Number(row.consumer),
        feed_in: Number.isFinite(Number(row.feed_in)) ? Number(row.feed_in) : undefined,
        kind: row.kind === 'predicted' ? 'predicted' : 'confirmed',
        confidence: Number.isFinite(Number(row.confidence))
          ? Math.max(0, Math.min(1, Number(row.confidence)))
          : undefined,
      }));
};

const priceRowEnd = (row: PriceRow): number => {
  const explicit = row.end ? Date.parse(row.end) : Number.NaN;
  if (Number.isFinite(explicit)) return explicit;
  return Date.parse(row.start) + (row.resolution === 'quarter-hour' ? 900000 : 3600000);
};

export const calculateDailyElectricityCost = (
  hass: HomeAssistant,
  context: EnergyContext | undefined,
  history: Record<string, HistoryPoint[]>,
): DailyElectricityCost | null => {
  if (!context) return null;
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const current = gridPower(hass, context);
  const recorded = gridHistory(context, history);
  const points = [
    ...recorded.filter((point) => point.t < now),
    ...(current === null ? [] : [{ t: now, end: now, v: current, min: current, max: current }]),
  ]
    .filter((point) => point.t <= now && (point.end ?? point.t) >= startOfDay.getTime())
    .sort((first, second) => first.t - second.t);
  if (points.length < 2) return null;

  const contractType = String(context.account?.contract?.type || '').toLowerCase();
  const dynamic = contractType === 'dynamic';
  const rows = dynamic ? priceRows(hass, context, 'today') : [];
  const staticImportPrice = Number(context.account?.current?.electricity);
  const staticExportPrice = Number(context.account?.current?.feed_in);

  let importedKwh = 0;
  let exportedKwh = 0;
  let importCost = 0;
  let exportValue = 0;
  let pricedKwh = 0;
  let measuredKwh = 0;

  const pricesAt = (timestamp: number): { imported: number; exported: number } => {
    if (!dynamic) return { imported: staticImportPrice, exported: staticExportPrice };
    const row = rows.find((item) => {
      const start = Date.parse(item.start);
      return Number.isFinite(start) && start <= timestamp && priceRowEnd(item) > timestamp;
    });
    return {
      imported: Number(row?.consumer),
      exported: Number(row?.feed_in ?? context.account?.current?.feed_in),
    };
  };

  for (let index = 0; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    const segmentStart = Math.max(startOfDay.getTime(), point.t);
    const segmentEnd = Math.min(now, point.end ?? next.t, next.t);
    if (!Number.isFinite(point.v) || segmentEnd <= segmentStart) continue;

    const energyKwh = Math.abs(point.v) / 1000 * ((segmentEnd - segmentStart) / 3600000);
    if (!Number.isFinite(energyKwh)) continue;
    measuredKwh += energyKwh;
    const prices = pricesAt(segmentStart + (segmentEnd - segmentStart) / 2);

    if (point.v >= 0) {
      importedKwh += energyKwh;
      if (Number.isFinite(prices.imported)) {
        importCost += energyKwh * prices.imported;
        pricedKwh += energyKwh;
      }
    } else {
      exportedKwh += energyKwh;
      if (Number.isFinite(prices.exported)) {
        exportValue += energyKwh * prices.exported;
        pricedKwh += energyKwh;
      }
    }
  }

  if (importedKwh === 0 && exportedKwh === 0) return null;
  return {
    importedKwh,
    exportedKwh,
    importCost,
    exportValue,
    netCost: importCost - exportValue,
    averageImportPrice: importedKwh > 0 ? importCost / importedKwh : null,
    averageExportPrice: exportedKwh > 0 ? exportValue / exportedKwh : null,
    coverage: measuredKwh > 0 ? Math.max(0, Math.min(1, pricedKwh / measuredKwh)) : 1,
    predictedPrices: dynamic && rows.length > 0 && rows.every((row) => row.kind === 'predicted'),
  };
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
  protected readonly _localization = new CardLocalizationController(this, () => this.hass);
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
