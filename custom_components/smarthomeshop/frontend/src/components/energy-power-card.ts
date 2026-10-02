import { css, html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import {
  EnergyCardBase,
  energyCardStyles,
  ensureStatisticsChart,
  formatPower,
  gridHistory,
  gridPower,
  loadPowerHistory,
  stateNumber,
  type BaseEnergyCardConfig,
  type HistoryPoint,
} from './energy-card-common';
import { energyText } from '../utils/energy-translations';
import './energy-card-editor';

export interface EnergyPowerCardConfig extends BaseEnergyCardConfig {
  show_summary?: boolean;
  show_grid_import?: boolean;
  show_grid_export?: boolean;
  show_solar?: boolean;
  show_battery?: boolean;
}

interface PowerSeries {
  key: string;
  label: string;
  color: string;
  points: HistoryPoint[];
}

interface StatisticValue {
  start: number;
  end: number;
  mean: number;
  min: number;
  max: number;
}

const DEFAULTS: Required<Omit<EnergyPowerCardConfig, 'type' | 'title'>> = {
  show_header: true,
  show_summary: true,
  show_grid_import: true,
  show_grid_export: true,
  show_solar: true,
  show_battery: true,
};

export class SmartHomeShopEnergyPowerCard extends EnergyCardBase<EnergyPowerCardConfig> {
  protected config: EnergyPowerCardConfig = { ...DEFAULTS };
  @state() private history: Record<string, HistoryPoint[]> = {};
  @state() private statisticsChartReady = false;

  static styles = [
    energyCardStyles,
    css`
      .summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 0 -18px;
        border-top: 1px solid var(--shs-line);
        border-bottom: 1px solid var(--shs-line);
      }
      .stat { padding: 13px 18px; border-right: 1px solid var(--shs-line); }
      .stat:last-child { border-right: 0; }
      .stat-label {
        color: var(--secondary-text-color);
        font-size: 9.5px;
        font-weight: 650;
        letter-spacing: .35px;
        text-transform: uppercase;
      }
      .stat-value { margin-top: 3px; font-size: 16px; font-weight: 740; }
      .chart-wrap { margin: 0 -10px -8px; padding: 16px 0 0; }
      .chart-label {
        padding: 0 10px 5px;
        font-size: 10.5px;
        font-weight: 700;
      }
      statistics-chart {
        display: block;
        width: 100%;
        height: 278px;
        --chart-max-height: 278px;
      }
      .chart-loading {
        min-height: 250px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 9px;
        color: var(--secondary-text-color);
        font-size: 11px;
      }
      @container (max-width: 520px) {
        .summary { margin: 0 -14px; }
        .stat { padding: 11px 12px; }
        .stat-value { font-size: 14px; }
        statistics-chart {
          height: 252px;
          --chart-max-height: 252px;
        }
      }
    `,
  ];

  public setConfig(config: EnergyPowerCardConfig): void {
    if (!config) throw new Error('Energy Power Trend card configuration is required.');
    this.config = { ...DEFAULTS, ...config };
  }

  public getCardSize(): number { return 5; }

  public getGridOptions(): { columns: number; min_columns: number; min_rows: number } {
    return { columns: 12, min_columns: 6, min_rows: 3 };
  }

  public static getStubConfig(): EnergyPowerCardConfig {
    return {
      type: 'custom:smarthomeshop-energy-power-card',
      ...DEFAULTS,
    };
  }

  public static getConfigElement(): HTMLElement {
    const editor = document.createElement('smarthomeshop-energy-card-editor') as HTMLElement & { cardType?: string };
    editor.cardType = 'power';
    return editor;
  }

  private _t(source: string, variables?: Record<string, string | number>): string {
    return energyText(this.hass, source, variables);
  }

  protected async afterContextLoaded(): Promise<void> {
    if (!this.hass || !this.context) return;
    const probe = this.context.netEntity
      || this.context.gridImportEntity
      || this.context.gridExportEntity
      || this.context.sources.solar_power
      || this.context.sources.battery_power;
    const [historyResult, chartReady] = await Promise.all([
      loadPowerHistory(this.hass, this.context).catch(() => undefined),
      ensureStatisticsChart(probe),
    ]);
    if (historyResult) this.history = historyResult;
    this.statisticsChartReady = chartReady;
  }

  private _withCurrent(
    entityId: string | undefined,
    points: HistoryPoint[],
    now: number,
    invert = false,
  ): HistoryPoint[] {
    if (!this.hass) return points;
    const current = stateNumber(this.hass, entityId, invert);
    if (current === null) return points;
    return [
      ...points.filter((point) => point.t < now),
      { t: now, end: now, v: current, min: current, max: current },
    ];
  }

  private _mapPoint(
    point: HistoryPoint,
    transform: (value: number) => number,
    reverseBounds = false,
  ): HistoryPoint {
    const rawMinimum = point.min ?? point.v;
    const rawMaximum = point.max ?? point.v;
    const minimum = transform(reverseBounds ? rawMaximum : rawMinimum);
    const maximum = transform(reverseBounds ? rawMinimum : rawMaximum);
    return {
      ...point,
      v: transform(point.v),
      min: Math.min(minimum, maximum),
      max: Math.max(minimum, maximum),
    };
  }

  private _gridWithCurrent(now: number): HistoryPoint[] {
    if (!this.hass || !this.context) return [];
    const points = gridHistory(this.context, this.history);
    const current = gridPower(this.hass, this.context);
    if (current === null) return points;
    return [
      ...points.filter((point) => point.t < now),
      { t: now, end: now, v: current, min: current, max: current },
    ];
  }

  private _series(): PowerSeries[] {
    if (!this.context) return [];
    const result: PowerSeries[] = [];
    const sources = this.context.sources;
    const now = Date.now();
    const grid = this._gridWithCurrent(now);
    if (grid.length > 1 && this.config.show_grid_import !== false) {
      result.push({
        key: 'grid-import',
        label: this._t('Grid import'),
        color: '#d34a4a',
        points: grid.map((point) => this._mapPoint(point, (value) => Math.max(0, value))),
      });
    }
    if (grid.length > 1 && this.config.show_grid_export !== false) {
      result.push({
        key: 'grid-export',
        label: this._t('Grid export'),
        color: '#159957',
        points: grid.map((point) =>
          this._mapPoint(point, (value) => Math.max(0, -value), true)),
      });
    }
    if (sources.solar_power && this.config.show_solar !== false) {
      const points = this._withCurrent(
        sources.solar_power,
        this.history[sources.solar_power] || [],
        now,
        !!sources.solar_invert,
      );
      if (points.length > 1) result.push({
        key: 'solar',
        label: this._t('Solar'),
        color: '#d8890b',
        points: points.map((point) => this._mapPoint(point, (value) => Math.max(0, value))),
      });
    }
    if (sources.battery_power && this.config.show_battery !== false) {
      const points = this._withCurrent(
        sources.battery_power,
        this.history[sources.battery_power] || [],
        now,
        !!sources.battery_invert,
      );
      if (points.length > 1) result.push({
        key: 'battery',
        label: this._t('Battery'),
        color: '#4361ee',
        points,
      });
    }
    return result;
  }

  private _statistics(series: PowerSeries[]): Record<string, StatisticValue[]> {
    const now = Date.now();
    return Object.fromEntries(series.map((item) => [
      `shs:${item.key}`,
      item.points.map((point, index) => ({
        start: point.t,
        end: point.end
          || item.points[index + 1]?.t
          || Math.min(now, point.t + 5 * 60 * 1000),
        mean: point.v,
        min: point.min ?? point.v,
        max: point.max ?? point.v,
      })),
    ]));
  }

  private _metadata(series: PowerSeries[]) {
    return Object.fromEntries(series.map((item) => [
      `shs:${item.key}`,
      {
        statistic_id: `shs:${item.key}`,
        source: 'smarthomeshop',
        name: item.label,
        statistics_unit_of_measurement: 'W',
        unit_class: 'power',
        has_sum: false,
        mean_type: 1,
      },
    ]));
  }

  private _names(series: PowerSeries[]): Record<string, string> {
    return Object.fromEntries(series.map((item) => [`shs:${item.key}`, item.label]));
  }

  private _colors(series: PowerSeries[]): Record<string, string> {
    return Object.fromEntries(series.map((item) => [`shs:${item.key}`, item.color]));
  }

  protected render() {
    if (!this.hass) return nothing;
    if ((this.loading && !this.context) || (this.context && !Object.keys(this.history).length && this.loading)) {
      return html`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div></div></ha-card>`;
    }
    const series = this._series();
    if (!series.length) {
      return html`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:chart-line-variant"></ha-icon>
            <strong>${this._t('No power statistics available')}</strong>
            <span>${this._t('Configure a P1 meter, solar or battery power source in SmartHomeShop Energy Settings.')}</span>
          </div>
        </ha-card>
      `;
    }

    const grid = gridPower(this.hass, this.context);
    const historicalGrid = gridHistory(this.context, this.history);
    const peakImport = Math.max(0, grid ?? 0, ...historicalGrid.map((point) => point.max ?? point.v));
    const peakExport = Math.abs(Math.min(0, grid ?? 0, ...historicalGrid.map((point) => point.min ?? point.v)));
    const current = formatPower(grid, true);
    const importPeak = formatPower(peakImport);
    const exportPeak = formatPower(peakExport);
    const gridLabel = this._t(grid === null ? 'Grid now' : grid < 0 ? 'Export now' : 'Import now');
    const header = this.renderHeader(this._t('Power trend'), this._t('Today · 5-minute statistics to now'), 'mdi:chart-timeline-variant');
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return html`
      <ha-card>
        <div class="card-shell">
          ${header ? html`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${header.icon}></ha-icon></div>
                <div><h2 class="head-title">${header.title}</h2><div class="head-subtitle">${header.subtitle}</div></div>
              </div>
            </div>
          ` : nothing}
          ${this.config.show_summary !== false ? html`
            <div class="summary">
              <div class="stat"><div class="stat-label">${gridLabel}</div><div class="stat-value">${current.value} ${current.unit}</div></div>
              <div class="stat"><div class="stat-label">${this._t('Peak import')}</div><div class="stat-value">${importPeak.value} ${importPeak.unit}</div></div>
              <div class="stat"><div class="stat-label">${this._t('Peak export')}</div><div class="stat-value">${exportPeak.value} ${exportPeak.unit}</div></div>
            </div>
          ` : nothing}
          <div class="chart-wrap">
            <div class="chart-label">${this._t('Power (W) · mean with min/max range')}</div>
            ${this.statisticsChartReady ? html`
              <statistics-chart
                .hass=${this.hass}
                .statisticsData=${this._statistics(series)}
                .metadata=${this._metadata(series)}
                .names=${this._names(series)}
                .colors=${this._colors(series)}
                .statTypes=${['mean', 'min', 'max']}
                .chartType=${'line'}
                .period=${'5minute'}
                .startTime=${start}
                .endTime=${new Date()}
                .unit=${'W'}
                .height=${'100%'}
                .clickForMoreInfo=${false}
              ></statistics-chart>
            ` : html`
              <div class="chart-loading" role="status" aria-live="polite"><div class="skeleton"></div><span>${this._t('Loading Home Assistant chart...')}</span></div>
            `}
          </div>
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-energy-power-card': SmartHomeShopEnergyPowerCard;
  }
}
