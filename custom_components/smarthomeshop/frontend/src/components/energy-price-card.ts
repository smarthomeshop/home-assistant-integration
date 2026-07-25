import { css, html, nothing, svg } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  EnergyCardBase,
  energyCardStyles,
  fireMoreInfo,
  formatPrice,
  formatTime,
  priceRows,
  type BaseEnergyCardConfig,
  type PriceRow,
} from './energy-card-common';
import { energyText } from '../utils/energy-translations';
import './energy-card-editor';

export interface EnergyPriceCardConfig extends BaseEnergyCardConfig {
  day?: 'today' | 'tomorrow' | 'auto';
  cheapest_hours?: number;
  show_facts?: boolean;
  show_cheapest_block?: boolean;
}

const DEFAULTS: Required<Omit<EnergyPriceCardConfig, 'type' | 'title'>> = {
  show_header: true,
  day: 'auto',
  cheapest_hours: 3,
  show_facts: true,
  show_cheapest_block: true,
};

@customElement('smarthomeshop-energy-price-card')
export class SmartHomeShopEnergyPriceCard extends EnergyCardBase<EnergyPriceCardConfig> {
  protected config: EnergyPriceCardConfig = { ...DEFAULTS };
  @state() private selectedDay: 'today' | 'tomorrow' = 'today';
  @state() private hoverIndex = -1;
  @state() private chartWidth = 620;
  private chartObserver?: ResizeObserver;
  private chartElement?: Element;

  static styles = [
    energyCardStyles,
    css`
      .day-switch {
        display: inline-flex;
        padding: 3px;
        border-radius: 9px;
        background: var(--shs-surface);
      }
      .day-switch button {
        min-height: 34px;
        padding: 0 10px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: var(--secondary-text-color);
        font-size: 10.5px;
        font-weight: 670;
        cursor: pointer;
      }
      .day-switch button.active {
        color: var(--primary-text-color);
        background: var(--card-background-color);
        box-shadow: 0 1px 2px color-mix(in srgb, var(--primary-text-color) 10%, transparent);
      }
      .price-layout {
        display: grid;
        grid-template-columns: minmax(210px, .72fr) minmax(320px, 1.28fr);
        margin: 0 -18px;
        border-top: 1px solid var(--shs-line);
        border-bottom: 1px solid var(--shs-line);
      }
      .summary {
        appearance: none;
        width: 100%;
        padding: 22px;
        border: 0;
        background: var(--shs-amber-soft);
        border-right: 1px solid var(--shs-line);
        color: inherit;
        text-align: left;
        cursor: pointer;
      }
      .summary:hover { filter: brightness(.99); }
      .summary-label {
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 730;
        letter-spacing: .55px;
        text-transform: uppercase;
      }
      .summary-price {
        margin-top: 15px;
        font-size: clamp(33px, 7cqi, 45px);
        font-weight: 760;
        line-height: .95;
        letter-spacing: -.025em;
      }
      .summary-price span {
        margin-left: 3px;
        color: var(--secondary-text-color);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0;
      }
      .price-state {
        margin-top: 9px;
        display: flex;
        align-items: center;
        gap: 5px;
        color: var(--shs-green);
        font-size: 10.5px;
        font-weight: 700;
      }
      .price-state.high { color: var(--shs-red); }
      .price-state ha-icon { --mdc-icon-size: 15px; }
      .facts {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 19px;
        border-top: 1px solid var(--shs-line);
      }
      .fact { min-width: 0; padding: 10px 8px 0 0; }
      .fact:nth-child(even) { padding-left: 10px; border-left: 1px solid var(--shs-line); }
      .fact:nth-child(n + 3) { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--shs-line); }
      .fact-label { color: var(--secondary-text-color); font-size: 9.5px; }
      .fact-value { margin-top: 2px; font-size: 11px; font-weight: 700; line-height: 1.25; overflow-wrap: anywhere; }
      .chart-column { min-width: 0; padding: 18px 14px 10px; }
      .chart-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 5px;
      }
      .chart-title { font-size: 10.5px; font-weight: 700; }
      .legend { display: flex; gap: 10px; color: var(--secondary-text-color); font-size: 9px; }
      .legend span { display: inline-flex; align-items: center; gap: 4px; }
      .legend i { width: 7px; height: 7px; border-radius: 2px; }
      .chart-host { width: 100%; min-height: 202px; }
      svg { width: 100%; height: 215px; display: block; overflow: visible; }
      svg:focus-visible { outline-offset: -2px; }
      svg text { fill: var(--secondary-text-color); font-family: inherit; font-size: 9px; }
      svg .grid { stroke: var(--shs-line); stroke-width: 1; }
      svg .now-line { stroke: var(--shs-blue); stroke-width: 1.2; stroke-dasharray: 4 3; }
      svg .now-text { fill: var(--shs-blue); font-size: 9px; font-weight: 720; }
      svg .hit { fill: transparent; cursor: crosshair; }
      svg .tip-bg { fill: var(--card-background-color); stroke: var(--shs-line); stroke-width: 1; }
      svg .tip-time { fill: var(--primary-text-color); font-size: 9px; font-weight: 720; }
      svg .tip-price { fill: var(--secondary-text-color); font-size: 8.5px; }
      .cheapest {
        margin: 0 -18px -18px;
        padding: 13px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        background: var(--shs-surface);
      }
      .cheapest-label { color: var(--secondary-text-color); font-size: 9px; font-weight: 720; letter-spacing: .4px; text-transform: uppercase; }
      .cheapest-value { margin-top: 3px; font-size: 13px; font-weight: 740; }
      .cheapest-value span { margin-left: 7px; color: var(--secondary-text-color); font-size: 10px; font-weight: 500; }
      .hours { display: inline-flex; padding: 3px; border: 1px solid var(--shs-line); border-radius: 9px; background: var(--card-background-color); }
      .hours button {
        width: 38px; min-height: 34px; border: 0; border-radius: 6px;
        background: transparent; color: var(--secondary-text-color);
        font-size: 10px; font-weight: 680; cursor: pointer;
      }
      .hours button.active { color: var(--primary-text-color); background: var(--shs-surface); }
      .contract-overview {
        padding: 18px;
        display: grid;
        gap: 14px;
        border: 1px solid var(--shs-line);
        border-radius: 14px;
        background: var(--shs-surface);
      }
      .contract-banner { display: flex; align-items: center; gap: 12px; }
      .contract-banner ha-icon {
        width: 38px; height: 38px; padding: 9px; border-radius: 11px;
        color: var(--shs-blue); background: var(--shs-blue-soft);
      }
      .contract-name { font-size: 15px; font-weight: 740; }
      .contract-meta { margin-top: 3px; color: var(--secondary-text-color); font-size: 10.5px; }
      .tariff-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 9px; }
      .tariff { min-width: 0; padding: 12px; border-radius: 10px; background: var(--card-background-color); }
      .tariff-label { color: var(--secondary-text-color); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
      .tariff-value { margin-top: 4px; font-size: 15px; font-weight: 740; }
      .tariff-value span { color: var(--secondary-text-color); font-size: 9px; font-weight: 500; }
      .contract-note { color: var(--secondary-text-color); font-size: 10.5px; line-height: 1.45; }

      @container (max-width: 690px) {
        .price-layout { grid-template-columns: 1fr; margin: 0 -14px; }
        .summary { padding: 20px; border-right: 0; border-bottom: 1px solid var(--shs-line); }
        .facts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .fact, .fact:nth-child(even) { padding-left: 10px; border-left: 1px solid var(--shs-line); }
        .fact:nth-child(3n + 1) { padding-left: 0; border-left: 0; }
        .fact:nth-child(n + 3) { margin-top: 0; padding-top: 10px; border-top: 0; }
        .fact:nth-child(n + 4) { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--shs-line); }
        .cheapest { margin: 0 -14px -14px; }
      }
      @container (max-width: 430px) {
        .card-head { align-items: flex-start; }
        .day-switch { margin-left: auto; }
        .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .fact:nth-child(3n + 1) { padding-left: 10px; border-left: 1px solid var(--shs-line); }
        .fact:nth-child(odd) { padding-left: 0; border-left: 0; }
        .fact:nth-child(n + 3) { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--shs-line); }
        .chart-column { padding-inline: 8px; }
        .cheapest { align-items: flex-start; flex-direction: column; }
        .hours { width: 100%; }
        .hours button { flex: 1; }
      }
      @media (pointer: coarse) {
        .day-switch button, .hours button { min-height: 44px; }
        .day-switch button { padding-inline: 14px; }
      }
    `,
  ];

  public setConfig(config: EnergyPriceCardConfig): void {
    if (!config) throw new Error('Energy Price Outlook card configuration is required.');
    this.config = {
      ...DEFAULTS,
      ...config,
      cheapest_hours: Math.max(1, Math.min(6, Number(config.cheapest_hours ?? 3))),
    };
    if (config.day === 'tomorrow') this.selectedDay = 'tomorrow';
    if (config.day === 'today') this.selectedDay = 'today';
  }

  public getCardSize(): number { return 6; }

  public static getStubConfig(): EnergyPriceCardConfig {
    return { show_header: true, day: 'auto', cheapest_hours: 3, show_facts: true, show_cheapest_block: true };
  }

  public static getConfigElement(): HTMLElement {
    const editor = document.createElement('smarthomeshop-energy-card-editor') as HTMLElement & { cardType?: string };
    editor.cardType = 'price';
    return editor;
  }

  private _t(source: string, variables?: Record<string, string | number>): string {
    return energyText(this.hass, source, variables);
  }

  public disconnectedCallback(): void {
    this.chartObserver?.disconnect();
    this.chartObserver = undefined;
    super.disconnectedCallback();
  }

  protected updated(): void {
    const element = this.renderRoot.querySelector('.chart-host');
    if (!element || element === this.chartElement) return;
    this.chartObserver?.disconnect();
    this.chartElement = element;
    this.chartObserver = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      if (width > 0 && Math.abs(width - this.chartWidth) > 2) this.chartWidth = width;
    });
    this.chartObserver.observe(element);
  }

  private _insights(today: PriceRow[], tomorrow: PriceRow[]) {
    if (!today.length) return null;
    const now = Date.now();
    const currentRow = today.find((row) => {
      const start = Date.parse(row.start);
      return start <= now && this._rowEnd(row) > now;
    });
    const current = currentRow?.consumer ?? Number(this.context?.account?.current?.electricity);
    if (!Number.isFinite(current)) return null;
    const average = today.reduce((sum, row) => sum + row.consumer, 0) / today.length;
    const lowest = today.reduce((best, row) => row.consumer < best.consumer ? row : best);
    const highest = today.reduce((best, row) => row.consumer > best.consumer ? row : best);
    const nextLower = [...today, ...tomorrow]
      .filter((row) => Date.parse(row.start) > now && row.consumer < current)
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
    return {
      current,
      average,
      difference: current - average,
      percentage: Math.abs(average) > .000001 ? (current - average) / Math.abs(average) * 100 : null,
      lowest,
      highest,
      nextLower,
      feedIn: currentRow?.feed_in ?? Number(this.context?.account?.current?.feed_in),
      spread: highest.consumer - lowest.consumer,
      negative: today
        .filter((row) => row.consumer < 0)
        .reduce((sum, row) => sum + (this._rowEnd(row) - Date.parse(row.start)) / 3600000, 0),
    };
  }

  private _rowEnd(row: PriceRow): number {
    const explicit = row.end ? Date.parse(row.end) : Number.NaN;
    if (Number.isFinite(explicit)) return explicit;
    return Date.parse(row.start) + (row.resolution === 'quarter-hour' ? 900000 : 3600000);
  }

  private _cheapest(rows: PriceRow[], hours: number) {
    const sorted = [...rows].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    let result: { start: string; end: number; average: number } | null = null;
    for (let index = 0; index < sorted.length; index += 1) {
      const block: PriceRow[] = [];
      const targetEnd = Date.parse(sorted[index].start) + hours * 3600000;
      let cursor = Date.parse(sorted[index].start);
      for (let offset = index; offset < sorted.length && cursor < targetEnd; offset += 1) {
        const row = sorted[offset];
        if (Math.abs(Date.parse(row.start) - cursor) >= 1000) break;
        block.push(row);
        cursor = this._rowEnd(row);
      }
      if (!block.length || Math.abs(cursor - targetEnd) >= 1000) continue;
      const duration = block.reduce(
        (sum, row) => sum + (this._rowEnd(row) - Date.parse(row.start)) / 3600000,
        0,
      );
      const average = block.reduce(
        (sum, row) => sum + row.consumer * ((this._rowEnd(row) - Date.parse(row.start)) / 3600000),
        0,
      ) / duration;
      if (!result || average < result.average) {
        result = { start: block[0].start, end: cursor, average };
      }
    }
    return result;
  }

  private _chart(rows: PriceRow[]) {
    const width = Math.max(280, this.chartWidth);
    const height = width < 430 ? 195 : 215;
    const left = width < 400 ? 34 : 42;
    const right = width - 8;
    const top = 22;
    const bottom = height - 27;
    const values = rows.map((row) => row.consumer);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const yMax = Math.max(.01, maximum * 1.08);
    const yMin = Math.min(0, minimum * 1.08);
    const range = Math.max(.001, yMax - yMin);
    const y = (value: number) => top + (yMax - value) / range * (bottom - top);
    const zero = y(0);
    const barWidth = (right - left) / rows.length;
    const now = Date.now();
    const nowIndex = rows.findIndex((row) => {
      const start = Date.parse(row.start);
      return start <= now && this._rowEnd(row) > now;
    });
    const color = (value: number) => {
      const ratio = maximum === minimum ? .5 : (value - minimum) / (maximum - minimum);
      return ratio <= .34 ? '#159957' : ratio <= .67 ? '#d8890b' : '#d34a4a';
    };
    const ticks = yMin < 0 ? [yMax, 0, yMin] : [yMax, yMax / 2, 0];
    const labelCount = width < 400 ? 3 : 4;
    const hourIndexes = Array.from({ length: labelCount }, (_, index) =>
      Math.min(rows.length - 1, Math.floor(index * rows.length / labelCount)));
    const hover = this.hoverIndex >= 0 && this.hoverIndex < rows.length ? this.hoverIndex : -1;
    const selected = hover >= 0
      ? `${formatTime(rows[hover].start)} ${formatPrice(rows[hover].consumer)}/kWh`
      : '';
    const chartLabel = [
      this._t(rows[0]?.resolution === 'quarter-hour' ? 'Quarter-hour electricity prices' : 'Hourly electricity prices'),
      this._t('Use the left and right arrow keys to inspect each price period.'),
      selected,
    ].filter(Boolean).join(' ');

    return html`
      <svg viewBox="0 0 ${width} ${height}" role="img" tabindex="0" aria-label=${chartLabel}
        @keydown=${(event: KeyboardEvent) => this._onChartKeydown(event, rows)}
        @pointerleave=${() => { this.hoverIndex = -1; }}>
        ${ticks.map((tick) => svg`
          <line class="grid" x1=${left} y1=${y(tick)} x2=${right} y2=${y(tick)}></line>
          <text x=${left - 5} y=${y(tick) + 3} text-anchor="end">${tick.toFixed(2)}</text>
        `)}
        ${rows.map((row, index) => {
          const rowY = y(row.consumer);
          return svg`
            <rect
              x=${left + index * barWidth + 1}
              y=${Math.min(zero, rowY)}
              width=${Math.max(2, barWidth - 2)}
              height=${Math.max(2, Math.abs(rowY - zero))}
              rx="2"
              fill=${color(row.consumer)}
              opacity=${index === nowIndex || index === hover ? 1 : .62}
            ></rect>
          `;
        })}
        ${nowIndex >= 0 ? svg`
          <line class="now-line" x1=${left + (nowIndex + .5) * barWidth} y1=${top} x2=${left + (nowIndex + .5) * barWidth} y2=${bottom}></line>
          <text class="now-text" x=${left + (nowIndex + .5) * barWidth} y="12" text-anchor="middle">${this._t('Now')}</text>
        ` : nothing}
        ${hourIndexes.map((index, tickIndex) => svg`
          <text x=${left + (index + .5) * barWidth} y=${height - 7} text-anchor=${tickIndex === 0 ? 'start' : 'middle'}>${formatTime(rows[index].start)}</text>
        `)}
        ${rows.map((row, index) => svg`
          <rect class="hit" x=${left + index * barWidth} y=${top} width=${barWidth} height=${bottom - top}
            @pointerenter=${() => { this.hoverIndex = index; }}
            @click=${() => { this.hoverIndex = index; }}>
            <title>${formatTime(row.start)} ${formatPrice(row.consumer)}/kWh</title>
          </rect>
        `)}
        ${hover >= 0 ? this._tooltip(rows[hover], left + (hover + .5) * barWidth, left, right, top) : nothing}
      </svg>
      <div class="sr-only" aria-live="polite">${selected}</div>
      <table class="sr-only">
        <caption>${this._t(rows[0]?.resolution === 'quarter-hour' ? 'Quarter-hour electricity prices' : 'Hourly electricity prices')}</caption>
        <tbody>
          ${rows.map(row => html`<tr><th>${formatTime(row.start)}</th><td>${formatPrice(row.consumer)}/kWh</td></tr>`)}
        </tbody>
      </table>
    `;
  }

  private _onChartKeydown(event: KeyboardEvent, rows: PriceRow[]): void {
    if (!rows.length) return;
    let next = this.hoverIndex;
    if (event.key === 'ArrowRight') next = Math.min(rows.length - 1, Math.max(0, next + 1));
    else if (event.key === 'ArrowLeft') next = next < 0 ? rows.length - 1 : Math.max(0, next - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = rows.length - 1;
    else if (event.key === 'Escape') next = -1;
    else return;
    event.preventDefault();
    this.hoverIndex = next;
  }

  private _tooltip(row: PriceRow, center: number, left: number, right: number, top: number) {
    const width = 104;
    const x = Math.max(left + width / 2, Math.min(right - width / 2, center));
    return svg`
      <g pointer-events="none">
        <rect class="tip-bg" x=${x - width / 2} y=${top + 2} width=${width} height="38" rx="6"></rect>
        <text class="tip-time" x=${x} y=${top + 17} text-anchor="middle">${formatTime(row.start)}</text>
        <text class="tip-price" x=${x} y=${top + 32} text-anchor="middle">${formatPrice(row.consumer)}/kWh</text>
      </g>
    `;
  }

  private _renderContractOverview() {
    const account = this.context?.account || {};
    const contract = account.contract || {};
    const tariffs = account.tariffs || {};
    const current = account.current || {};
    const fixed = account.fixed_costs || {};
    const type = String(contract.type || 'fixed');
    let values: Array<[string, unknown, string]> = account.capabilities?.requires_tariff_selection
      ? [
        ['Import T1', tariffs.electricity_t1, '/kWh'],
        ['Import T2', tariffs.electricity_t2, '/kWh'],
        ['Feed-in T1', tariffs.feed_in_t1, '/kWh'],
        ['Feed-in T2', tariffs.feed_in_t2, '/kWh'],
      ]
      : [
        ['Import now', current.electricity, '/kWh'],
        ['Feed-in now', current.feed_in, '/kWh'],
      ];
    if (!values.some(([, value]) => Number.isFinite(Number(value)))) {
      const labels: Record<string, string> = {
        electricity_t1: 'Import T1',
        electricity_t2: 'Import T2',
        electricity_single: 'Import',
        feed_in_t1: 'Feed-in T1',
        feed_in_t2: 'Feed-in T2',
        feed_in_single: 'Feed-in',
        feed_in: 'Feed-in',
      };
      values = Object.entries(tariffs)
        .filter(([key, value]) =>
          (key.startsWith('electricity_') || key.startsWith('feed_in'))
          && Number.isFinite(Number(value)))
        .map(([key, value]) => [labels[key] || key.split('_').join(' '), value, '/kWh']);
    }
    values.push(
      ['Gas', current.gas ?? tariffs.gas, '/m³'],
      ['Water', current.water ?? tariffs.water, '/m³'],
      ['Fixed cost/day', fixed.daily, '/day'],
      ['Fixed cost/year', fixed.yearly, '/year'],
    );
    return html`
      <ha-card>
        <div class="card-shell">
          ${this.renderHeader(
            this._t('Energy prices'),
            `${contract.name || this._t('Energy contract')} · ${type.charAt(0).toUpperCase()}${type.slice(1)}`,
            'mdi:file-document-outline',
          ) ? html`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon="mdi:file-document-outline"></ha-icon></div>
                <div><h2 class="head-title">${this._t('Energy prices')}</h2><div class="head-subtitle">${contract.name || this._t('Energy contract')}</div></div>
              </div>
            </div>` : nothing}
          <div class="contract-overview">
            <div class="contract-banner">
              <ha-icon icon="mdi:receipt-text-outline"></ha-icon>
              <div><div class="contract-name">${contract.provider_details?.name || contract.provider || contract.supplier || contract.name}</div>
              <div class="contract-meta">${type.charAt(0).toUpperCase()}${type.slice(1)} contract${contract.product ? ` · ${contract.product}` : ''}</div></div>
            </div>
            <div class="tariff-grid">
              ${values
                .filter(([, value]) => Number.isFinite(Number(value)))
                .map(([label, value, unit]) => html`
                  <div class="tariff"><div class="tariff-label">${label}</div>
                  <div class="tariff-value">${formatPrice(Number(value))}<span>${unit}</span></div></div>
                `)}
            </div>
            <div class="contract-note">
              ${account.capabilities?.requires_tariff_selection
                ? this._t('The active T1/T2 tariff is unknown. Both tariffs are shown separately; SmartHomeShop never guesses.')
                : this._t('This contract has no changing intraday price curve, so cheapest-hour controls and price optimisation are not shown.')}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  protected render() {
    if (!this.hass) return nothing;
    if (this.loading && !this.context) {
      return html`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div></div></ha-card>`;
    }
    const today = priceRows(this.hass, this.context, 'today');
    const tomorrow = priceRows(this.hass, this.context, 'tomorrow');
    if (
      this.context?.account?.status === 'ok'
      && this.context.account?.capabilities?.price_optimisation === false
    ) {
      return this._renderContractOverview();
    }
    if (!today.length && !tomorrow.length) {
      const noContract = this.context?.account?.status === 'no_contract';
      const activeDynamic = this.context?.account?.status === 'ok'
        && this.context?.account?.contract?.type === 'dynamic';
      return html`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon=${noContract ? 'mdi:file-document-alert-outline' : 'mdi:chart-timeline-variant-shimmer'}></ha-icon>
            <strong>${this._t(noContract
              ? 'No active energy contract'
              : activeDynamic ? 'Price data is being fetched' : 'No contract prices available')}</strong>
            <span>${this._t(noContract
              ? 'Select an active SmartHomeShop energy contract in Energy Settings.'
              : activeDynamic
                ? 'Your dynamic contract is active. Daily prices appear here as soon as confirmed prices or a forecast is available.'
                : 'Check the selected contract in SmartHomeShop Energy Settings.')}</span>
          </div>
        </ha-card>
      `;
    }

    const configuredDay = this.config.day || 'auto';
    const day = configuredDay === 'today'
      ? 'today'
      : configuredDay === 'tomorrow'
        ? (tomorrow.length ? 'tomorrow' : 'today')
        : (this.selectedDay === 'tomorrow' && tomorrow.length ? 'tomorrow' : 'today');
    const rows = day === 'tomorrow' ? tomorrow : today;
    const insights = this._insights(today, tomorrow);
    if (!rows.length || !insights) return nothing;
    const predicted = rows.every((row) => row.kind === 'predicted');
    const confidenceValues = rows
      .map((row) => row.confidence)
      .filter((value): value is number => Number.isFinite(value));
    const confidence = confidenceValues.length
      ? confidenceValues.reduce((total, value) => total + value, 0) / confidenceValues.length
      : null;
    const below = insights.difference <= 0;
    const hours = Math.max(1, Math.min(6, Number(this.config.cheapest_hours || 3)));
    const cheapest = this._cheapest(rows, hours);
    const contractName = this.context?.account?.contract?.name;
    const header = this.renderHeader(
      this._t('Price outlook'),
      contractName
        ? `${contractName} · ${this._t(predicted ? 'Predicted all-in price' : 'all-in price')}`
        : this._t(predicted ? 'Predicted all-in consumer price' : 'All-in consumer price'),
      'mdi:chart-bar',
    );

    return html`
      <ha-card>
        <div class="card-shell">
          ${header ? html`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${header.icon}></ha-icon></div>
                <div><h2 class="head-title">${header.title}</h2><div class="head-subtitle">${header.subtitle}</div></div>
              </div>
              ${configuredDay === 'auto' && tomorrow.length ? html`
                <div class="day-switch" role="group" aria-label=${this._t('Price day')}>
                  <button type="button" class=${day === 'today' ? 'active' : ''} aria-pressed=${day === 'today'}
                    @click=${() => { this.selectedDay = 'today'; this.hoverIndex = -1; }}>${this._t('Today')}</button>
                  <button type="button" class=${day === 'tomorrow' ? 'active' : ''} aria-pressed=${day === 'tomorrow'}
                    @click=${() => { this.selectedDay = 'tomorrow'; this.hoverIndex = -1; }}>${this._t('Tomorrow')}</button>
                </div>
              ` : nothing}
            </div>
          ` : nothing}

          <div class="price-layout">
            <button class="summary" type="button" aria-label=${this._t('Open price entity details')}
              @click=${() => fireMoreInfo(this, this.context?.priceEntity)}>
              <div class="summary-label">${this._t(predicted
                ? (day === 'tomorrow' ? 'Estimated price' : 'Estimated price now')
                : (day === 'tomorrow' ? 'Current price' : 'Price now'))}</div>
              <div class="summary-price">${formatPrice(insights.current)}<span>/kWh</span></div>
              <div class="price-state ${below ? '' : 'high'}">
                <ha-icon icon=${predicted ? 'mdi:chart-timeline-variant-shimmer' : (below ? 'mdi:trending-down' : 'mdi:trending-up')}></ha-icon>
                ${predicted
                  ? this._t(
                    confidence === null ? 'Forecast · not used for automation' : 'Forecast · {value}% confidence',
                    { value: confidence === null ? '' : Math.round(confidence * 100) },
                  )
                  : insights.percentage === null
                  ? this._t(below ? 'Below daily average' : 'Above daily average')
                  : this._t(below ? '{value}% below average' : '{value}% above average', {
                    value: Math.abs(insights.percentage).toFixed(0),
                  })}
              </div>
              ${this.config.show_facts !== false ? html`
                <div class="facts">
                  <div class="fact"><div class="fact-label">${this._t(predicted ? 'Forecast average' : 'Daily average')}</div><div class="fact-value">${formatPrice(insights.average)}</div></div>
                  <div class="fact"><div class="fact-label">${this._t(predicted ? 'Estimated feed-in now' : 'Feed-in now')}</div><div class="fact-value">${formatPrice(insights.feedIn)}</div></div>
                  <div class="fact"><div class="fact-label">${this._t('Next lower')}</div><div class="fact-value">${insights.nextLower
                    ? this._t('{time}, save {price}', { time: formatTime(insights.nextLower.start), price: formatPrice(insights.current - insights.nextLower.consumer) })
                    : this._t('None today')}</div></div>
                  <div class="fact"><div class="fact-label">${this._t('Lowest')}</div><div class="fact-value">${this._t('{price} at {time}', { price: formatPrice(insights.lowest.consumer), time: formatTime(insights.lowest.start) })}</div></div>
                  <div class="fact"><div class="fact-label">${this._t('Highest')}</div><div class="fact-value">${this._t('{price} at {time}', { price: formatPrice(insights.highest.consumer), time: formatTime(insights.highest.start) })}</div></div>
                  <div class="fact"><div class="fact-label">${this._t(insights.negative ? 'Negative prices' : 'Daily spread')}</div><div class="fact-value">${insights.negative
                    ? this._t(insights.negative === 1 ? '{count} hour' : '{count} hours', { count: insights.negative })
                    : formatPrice(insights.spread)}</div></div>
                </div>
              ` : nothing}
            </button>
            <div class="chart-column">
              <div class="chart-heading">
                <div class="chart-title">${this._t(
                  rows[0]?.resolution === 'quarter-hour'
                    ? (predicted ? '{day} forecast by quarter hour (EUR/kWh)' : '{day} by quarter hour (EUR/kWh)')
                    : (predicted ? '{day} forecast by hour (EUR/kWh)' : '{day} by hour (EUR/kWh)'),
                  { day: this._t(day === 'tomorrow' ? 'Tomorrow' : 'Today') },
                )}</div>
                <div class="legend"><span><i style="background:#159957"></i>${this._t('Lower')}</span><span><i style="background:#d34a4a"></i>${this._t('Higher')}</span></div>
              </div>
              <div class="chart-host">${this._chart(rows)}</div>
            </div>
          </div>

          ${this.config.show_cheapest_block !== false ? html`
            <div class="cheapest">
              <div>
                <div class="cheapest-label">${this._t(
                  predicted ? 'Cheapest predicted block · {day}' : 'Cheapest consecutive block · {day}',
                  { day: this._t(day === 'tomorrow' ? 'Tomorrow' : 'Today') },
                )}</div>
                <div class="cheapest-value">
                  ${cheapest
                    ? html`${formatTime(cheapest.start)}–${formatTime(cheapest.end)}<span>${this._t('{price}/kWh average', { price: formatPrice(cheapest.average) })}</span>`
                    : this._t('Not available')}
                </div>
              </div>
              <div class="hours" role="group" aria-label=${this._t('Cheapest block duration')}>
                ${[1, 2, 3, 4, 5, 6].map((option) => html`
                  <button type="button" class=${hours === option ? 'active' : ''} aria-pressed=${hours === option}
                    @click=${() => { this.config = { ...this.config, cheapest_hours: option }; }}>${option}h</button>
                `)}
              </div>
            </div>
          ` : nothing}
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-energy-price-card': SmartHomeShopEnergyPriceCard;
  }
}
