import { css, html, nothing, svg } from 'lit';
import { state } from 'lit/decorators.js';
import {
  EnergyCardBase,
  energyCardStyles,
  fireMoreInfo,
  formatPower,
  gridPower,
  isGridUnavailable,
  isEntityUnavailable,
  stateNumber,
  type BaseEnergyCardConfig,
} from './energy-card-common';
import { energyText } from '../utils/energy-translations';
import './energy-card-editor';

export interface EnergyLiveCardConfig extends BaseEnergyCardConfig {
  show_flow?: boolean;
  animate_flow?: boolean;
  show_details?: boolean;
  show_home?: boolean;
  show_grid?: boolean;
  show_solar?: boolean;
  show_battery?: boolean;
}

const DEFAULTS: Required<Omit<EnergyLiveCardConfig, 'type' | 'title'>> = {
  show_header: true,
  show_flow: false,
  animate_flow: true,
  show_details: true,
  show_home: true,
  show_grid: true,
  show_solar: true,
  show_battery: true,
};

export class SmartHomeShopEnergyLiveCard extends EnergyCardBase<EnergyLiveCardConfig> {
  protected config: EnergyLiveCardConfig = { ...DEFAULTS };
  @state() private flowPaused = false;

  static styles = [
    energyCardStyles,
    css`
      .live-layout {
        display: grid;
        grid-template-columns: minmax(190px, .78fr) minmax(250px, 1.22fr);
        margin: 0 -18px -18px;
        border-top: 1px solid var(--shs-line);
      }
      .home {
        min-height: 204px;
        padding: 23px 22px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: var(--shs-blue-soft);
        border-right: 1px solid var(--shs-line);
      }
      .home-label {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--secondary-text-color);
        font-size: 10.5px;
        font-weight: 720;
        letter-spacing: .55px;
        text-transform: uppercase;
      }
      .home-label ha-icon { --mdc-icon-size: 16px; color: var(--shs-blue); }
      .home-power {
        margin-top: 17px;
        color: var(--primary-text-color);
        font-size: clamp(35px, 8cqi, 49px);
        font-weight: 760;
        letter-spacing: -.025em;
        line-height: .95;
      }
      .home-power span {
        margin-left: 4px;
        color: var(--secondary-text-color);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0;
      }
      .home-caption {
        margin-top: 11px;
        color: var(--secondary-text-color);
        font-size: 11px;
        line-height: 1.4;
      }
      .home-caption.error { color: var(--error-color, var(--shs-red)); }
      .source-pill {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 14px;
        padding: 5px 9px;
        border-radius: 999px;
        color: var(--shs-green);
        background: var(--shs-green-soft);
        font-size: 10.5px;
        font-weight: 680;
      }
      .source-pill.grid { color: var(--shs-amber); background: var(--shs-amber-soft); }
      .source-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      .source-pill ha-icon { --mdc-icon-size: 14px; }
      .sources { display: grid; align-content: stretch; }
      .source-row {
        appearance: none;
        width: 100%;
        min-height: 68px;
        padding: 12px 16px;
        display: grid;
        grid-template-columns: 36px minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        border: 0;
        border-bottom: 1px solid var(--shs-line);
        background: transparent;
        color: inherit;
        text-align: left;
      }
      button.source-row { cursor: pointer; }
      button.source-row:hover { background: var(--shs-surface); }
      .source-row:last-child { border-bottom: 0; }
      .source-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        color: var(--secondary-text-color);
        background: var(--shs-surface);
      }
      .source-icon ha-icon { --mdc-icon-size: 20px; }
      .source-icon.import { color: var(--shs-red); background: var(--shs-red-soft); }
      .source-icon.export, .source-icon.solar { color: var(--shs-green); background: var(--shs-green-soft); }
      .source-icon.battery { color: var(--shs-blue); background: var(--shs-blue-soft); }
      .source-name { font-size: 12px; font-weight: 710; }
      .source-status { margin-top: 2px; color: var(--secondary-text-color); font-size: 10.5px; }
      .source-status.good { color: var(--shs-green); }
      .source-status.bad { color: var(--error-color, var(--shs-red)); }
      .source-value { display: flex; align-items: baseline; gap: 4px; font-size: 19px; font-weight: 740; white-space: nowrap; }
      .source-value span { color: var(--secondary-text-color); font-size: 10.5px; font-weight: 600; }
      .battery-meta { margin-top: 5px; display: flex; align-items: center; justify-content: flex-end; gap: 5px; }
      .battery-glyph {
        width: 27px; height: 12px; padding: 2px;
        position: relative; display: block;
        border: 1px solid var(--secondary-text-color); border-radius: 3px;
      }
      .battery-glyph::after {
        content: ''; position: absolute; right: -4px; top: 3px;
        width: 2px; height: 5px; border-radius: 0 2px 2px 0;
        background: var(--secondary-text-color);
      }
      .battery-glyph i { display: block; height: 100%; border-radius: 1px; background: var(--shs-green); }
      .battery-meta small { color: var(--secondary-text-color); font-size: 9.5px; }
      .flow-panel {
        margin: 0 -18px;
        padding: 13px 18px 17px;
        border-top: 1px solid var(--shs-line);
        background: var(--shs-surface);
      }
      .flow-panel.flow-only { margin-bottom: -18px; }
      .flow-toolbar {
        min-height: 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .flow-heading { min-width: 0; }
      .flow-heading strong {
        display: block;
        color: var(--primary-text-color);
        font-size: 11.5px;
        font-weight: 710;
        line-height: 1.25;
      }
      .flow-heading span {
        display: block;
        margin-top: 2px;
        color: var(--secondary-text-color);
        font-size: 9.5px;
        line-height: 1.3;
      }
      .flow-control {
        width: 30px;
        height: 30px;
        flex: 0 0 30px;
        display: grid;
        place-items: center;
        border: 1px solid var(--shs-line);
        border-radius: 50%;
        background: var(--card-background-color);
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .flow-control:hover { color: var(--shs-blue); border-color: var(--shs-blue); }
      .flow-control ha-icon { --mdc-icon-size: 16px; }
      .flow-map {
        height: 252px;
        position: relative;
        isolation: isolate;
      }
      .flow-lines {
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: visible;
        pointer-events: none;
      }
      .flow-track, .flow-line {
        fill: none;
        vector-effect: non-scaling-stroke;
        stroke-linecap: round;
      }
      .flow-track {
        stroke: color-mix(in srgb, var(--secondary-text-color) 21%, transparent);
        stroke-width: 1.5;
      }
      .flow-line {
        stroke: var(--flow-color, var(--shs-blue));
        stroke-width: 3;
        stroke-dasharray: 1.5 7;
        filter: drop-shadow(0 0 1px color-mix(in srgb, var(--flow-color) 38%, transparent));
      }
      .flow-line.moving {
        animation: shs-flow-forward var(--flow-duration, 2s) linear infinite;
      }
      .flow-line.moving.reverse { animation-name: shs-flow-reverse; }
      @keyframes shs-flow-forward { to { stroke-dashoffset: -17; } }
      @keyframes shs-flow-reverse { to { stroke-dashoffset: 17; } }
      .flow-node {
        width: 136px;
        min-height: 58px;
        padding: 5px 0;
        position: absolute;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 9px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
      }
      button.flow-node { cursor: pointer; }
      button.flow-node:hover .flow-orb { border-color: currentColor; transform: scale(1.04); }
      .flow-node.left { flex-direction: row-reverse; text-align: right; }
      .flow-node.grid { left: 0; top: 12px; color: var(--flow-node-color, var(--shs-red)); }
      .flow-node.solar { left: 0; bottom: 12px; color: var(--shs-amber); --flow-node-color: var(--shs-amber); }
      .flow-node.battery { right: 0; top: calc(50% - 29px); color: var(--shs-blue); --flow-node-color: var(--shs-blue); }
      .flow-node.home {
        width: 112px;
        height: 112px;
        min-height: 112px;
        padding: 0;
        left: 50%;
        top: 50%;
        display: grid;
        place-items: center;
        transform: translate(-50%, -50%);
        border: 1px solid color-mix(in srgb, var(--shs-blue) 26%, var(--shs-line));
        border-radius: 50%;
        background: var(--card-background-color);
        box-shadow: 0 8px 22px color-mix(in srgb, var(--primary-text-color) 8%, transparent);
        text-align: center;
      }
      .flow-orb {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        display: grid;
        place-items: center;
        border: 1px solid color-mix(in srgb, currentColor 30%, var(--shs-line));
        border-radius: 50%;
        background: color-mix(in srgb, currentColor 10%, var(--card-background-color));
        transition: transform 160ms ease-out, border-color 160ms ease-out;
      }
      .flow-orb ha-icon { --mdc-icon-size: 21px; }
      .flow-node.unavailable { color: var(--secondary-text-color); }
      .flow-node.unavailable .flow-orb {
        border-style: dashed;
        background: var(--card-background-color);
      }
      .flow-copy { min-width: 0; color: var(--primary-text-color); }
      .flow-copy span {
        display: block;
        color: var(--secondary-text-color);
        font-size: 9px;
        font-weight: 690;
        letter-spacing: .45px;
        line-height: 1.2;
        text-transform: uppercase;
      }
      .flow-copy strong {
        display: block;
        margin-top: 2px;
        font-size: 16px;
        font-weight: 740;
        letter-spacing: -.01em;
        line-height: 1.15;
        white-space: nowrap;
      }
      .flow-copy strong small {
        margin-left: 2px;
        color: var(--secondary-text-color);
        font-size: 9px;
        font-weight: 610;
      }
      .flow-copy em {
        display: block;
        margin-top: 2px;
        color: var(--flow-node-color, var(--secondary-text-color));
        font-size: 9px;
        font-style: normal;
        line-height: 1.2;
      }
      .flow-home-content { width: 92px; color: var(--primary-text-color); }
      .flow-home-content ha-icon { --mdc-icon-size: 20px; color: var(--shs-blue); }
      .flow-home-content span {
        display: block;
        margin-top: 4px;
        color: var(--secondary-text-color);
        font-size: 8.5px;
        font-weight: 700;
        letter-spacing: .5px;
        text-transform: uppercase;
      }
      .flow-home-content strong {
        display: block;
        margin-top: 3px;
        font-size: 18px;
        font-weight: 760;
        line-height: 1.1;
        white-space: nowrap;
      }
      .flow-home-content strong small {
        margin-left: 2px;
        color: var(--secondary-text-color);
        font-size: 9px;
        font-weight: 610;
      }
      .flow-home-content em {
        display: block;
        margin-top: 4px;
        color: var(--secondary-text-color);
        font-size: 8.5px;
        font-style: normal;
        line-height: 1.15;
      }
      .no-home .sources { grid-column: 1 / -1; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
      .no-home .source-row { border-right: 1px solid var(--shs-line); }

      @container (max-width: 540px) {
        .live-layout { grid-template-columns: 1fr; margin: 0 -14px -14px; }
        .home { min-height: 168px; padding: 20px; border-right: 0; border-bottom: 1px solid var(--shs-line); }
        .home-power { font-size: 40px; }
        .flow-panel { margin: 0 -14px; padding-inline: 14px; }
        .flow-panel.flow-only { margin-bottom: -14px; }
        .flow-map { height: 270px; }
        .flow-node { width: 112px; gap: 7px; }
        .flow-node.home { width: 94px; height: 94px; min-height: 94px; }
        .flow-home-content { width: 78px; }
        .flow-home-content strong { font-size: 16px; }
        .flow-orb { width: 36px; height: 36px; flex-basis: 36px; }
        .flow-orb ha-icon { --mdc-icon-size: 18px; }
        .flow-copy strong { font-size: 14px; }
      }

      @container (max-width: 350px) {
        .flow-heading span { display: none; }
        .flow-map { height: 286px; }
        .flow-node { width: 100px; }
        .flow-node.grid { top: 7px; }
        .flow-node.solar { bottom: 7px; }
        .flow-copy em { max-width: 64px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .flow-line.moving { animation: none; }
        .flow-orb { transition: none; }
      }
    `,
  ];

  public setConfig(config: EnergyLiveCardConfig): void {
    if (!config) throw new Error('Energy Live card configuration is required.');
    this.config = { ...DEFAULTS, ...config };
  }

  public getCardSize(): number { return 4; }

  public static getStubConfig(): EnergyLiveCardConfig {
    return {
      show_header: true,
      show_flow: true,
      animate_flow: true,
      show_details: true,
      show_home: true,
      show_grid: true,
      show_solar: true,
      show_battery: true,
    };
  }

  public static getConfigElement(): HTMLElement {
    const editor = document.createElement('smarthomeshop-energy-card-editor') as HTMLElement & { cardType?: string };
    editor.cardType = 'live';
    return editor;
  }

  private _t(source: string, variables?: Record<string, string | number>): string {
    return energyText(this.hass, source, variables);
  }

  private _sourcePill(house: number | null, grid: number | null, solar: number, battery: number) {
    if (house === null || house <= 0) return null;
    const gridToHome = Math.max(0, house - Math.max(0, solar) - Math.max(0, battery));
    if (grid !== null && grid > 5 && gridToHome > 5) {
      const share = Math.min(100, Math.round(gridToHome / house * 100));
      return html`<div class="source-pill grid"><ha-icon icon="mdi:transmission-tower-import"></ha-icon>${this._t('{share}% from grid', { share })}</div>`;
    }
    if (solar > 5 && battery > 5) return html`<div class="source-pill"><span class="dot"></span>${this._t('Solar + battery')}</div>`;
    if (solar > 5) return html`<div class="source-pill"><span class="dot"></span>${this._t('Running on solar')}</div>`;
    if (battery > 5) return html`<div class="source-pill"><span class="dot"></span>${this._t('Running on battery')}</div>`;
    return null;
  }

  private _flowDuration(watts: number): number {
    const magnitude = Math.max(0, Math.abs(watts));
    const ratio = Math.min(1, Math.log10(magnitude + 1) / Math.log10(5001));
    return Number((3.2 - ratio * 2.25).toFixed(2));
  }

  private _flowPath(
    path: string,
    watts: number | null,
    reverse: boolean,
    color: string,
  ) {
    const active = watts !== null && Math.abs(watts) > 5;
    const moving = active && this.config.animate_flow !== false && !this.flowPaused;
    return svg`
      <path class="flow-track" d=${path} pathLength="100"></path>
      ${active ? svg`
        <path
          class="flow-line ${moving ? 'moving' : ''} ${reverse ? 'reverse' : ''}"
          d=${path}
          pathLength="100"
          style=${`--flow-color:${color};--flow-duration:${this._flowDuration(watts ?? 0)}s`}
        ></path>
      ` : nothing}
    `;
  }

  private _flowNode(
    kind: 'grid' | 'solar' | 'battery',
    label: string,
    entityId: string | undefined,
    value: number | null,
    icon: string,
    status: string,
    color: string,
  ) {
    const unavailable = isEntityUnavailable(this.hass!, entityId) || value === null;
    const metric = formatPower(value, true);
    const content = html`
      <div class="flow-orb"><ha-icon icon=${icon}></ha-icon></div>
      <div class="flow-copy">
        <span>${label}</span>
        <strong>${metric.value}<small>${metric.unit}</small></strong>
        <em>${unavailable ? this._t('Sensor unavailable') : status}</em>
      </div>
    `;
    const className = `flow-node ${kind} ${kind === 'grid' || kind === 'solar' ? 'left' : ''} ${unavailable ? 'unavailable' : ''}`;
    const style = `--flow-node-color:${unavailable ? 'var(--secondary-text-color)' : color}`;
    const ariaLabel = `${label}: ${metric.value} ${metric.unit}. ${unavailable ? this._t('Sensor unavailable') : status}`;

    return entityId
      ? html`<button
          class=${className}
          style=${style}
          type="button"
          aria-label=${ariaLabel}
          @click=${() => fireMoreInfo(this, entityId)}
        >${content}</button>`
      : html`<div class=${className} style=${style} aria-label=${ariaLabel}>${content}</div>`;
  }

  private _renderFlow(
    grid: number | null,
    solar: number,
    battery: number | null,
    soc: number | null,
    house: number | null,
    contributorUnavailable: boolean,
  ) {
    const sources = this.context!.sources;
    const showGrid = this.config.show_grid !== false;
    const showSolar = this.config.show_solar !== false && !!sources.solar_power;
    const showBattery = this.config.show_battery !== false && !!sources.battery_power;
    const gridExporting = grid !== null && grid < -5;
    const batteryCharging = battery !== null && battery < -5;
    const gridColor = gridExporting ? 'var(--shs-green)' : 'var(--shs-red)';
    const homeMetric = formatPower(house);
    const gridStatus = this._t(grid === null
      ? 'No reading'
      : grid > 5
        ? 'Importing from grid'
        : grid < -5
          ? 'Exporting to grid'
          : 'Grid balanced');
    const solarStatus = this._t(solar > 5 ? 'Producing now' : 'No production');
    const batteryStatus = `${this._t(battery === null
      ? 'No reading'
      : battery > 5
        ? 'Discharging'
        : battery < -5
          ? 'Charging'
          : 'Idle')}${soc !== null ? ` · ${Math.round(soc)}%` : ''}`;
    const motionLabel = this.flowPaused
      ? this._t('Resume flow animation')
      : this._t('Pause flow animation');

    return html`
      <section class="flow-panel ${this.config.show_details === false ? 'flow-only' : ''}" aria-label=${this._t('Live power flow')}>
        <div class="flow-toolbar">
          <div class="flow-heading">
            <strong>${this._t('Live power flow')}</strong>
            <span>${this._t('Direction and speed follow the power moving right now')}</span>
          </div>
          ${this.config.animate_flow !== false ? html`
            <button
              class="flow-control"
              type="button"
              title=${motionLabel}
              aria-label=${motionLabel}
              aria-pressed=${this.flowPaused ? 'true' : 'false'}
              @click=${() => { this.flowPaused = !this.flowPaused; }}
            >
              <ha-icon icon=${this.flowPaused ? 'mdi:play' : 'mdi:pause'}></ha-icon>
            </button>
          ` : nothing}
        </div>
        <div class="flow-map">
          <svg class="flow-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${showGrid ? this._flowPath('M 24 16 C 35 16 37 38 42 46', grid, gridExporting, gridColor) : nothing}
            ${showSolar ? this._flowPath('M 24 84 C 35 84 37 62 42 54', solar, false, 'var(--shs-amber)') : nothing}
            ${showBattery ? this._flowPath('M 76 50 C 69 50 65 50 58 50', battery, batteryCharging, 'var(--shs-blue)') : nothing}
          </svg>

          ${showGrid ? this._flowNode(
            'grid',
            this._t('Grid'),
            this.context!.netEntity || this.context!.gridImportEntity || this.context!.gridExportEntity,
            grid,
            gridExporting ? 'mdi:transmission-tower-export' : 'mdi:transmission-tower-import',
            gridStatus,
            gridColor,
          ) : nothing}
          ${showSolar ? this._flowNode(
            'solar',
            this._t('Solar'),
            sources.solar_power,
            solar,
            'mdi:solar-power-variant',
            solarStatus,
            'var(--shs-amber)',
          ) : nothing}
          ${showBattery ? this._flowNode(
            'battery',
            this._t('Battery'),
            sources.battery_power,
            battery,
            batteryCharging ? 'mdi:battery-arrow-up-outline' : 'mdi:battery-arrow-down-outline',
            batteryStatus,
            'var(--shs-blue)',
          ) : nothing}

          <div
            class="flow-node home ${contributorUnavailable || house === null ? 'unavailable' : ''}"
            aria-label=${`${this._t('Home consumption')}: ${homeMetric.value} ${homeMetric.unit}`}
          >
            <div class="flow-home-content">
              <ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon>
              <span>${this._t('Home')}</span>
              <strong>${homeMetric.value}<small>${homeMetric.unit}</small></strong>
              <em>${this._t(contributorUnavailable ? 'Incomplete sensor data' : 'Live usage')}</em>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  private _row(
    label: string,
    entityId: string | undefined,
    value: number | null,
    icon: string,
    iconClass: string,
    status: string,
    statusClass = '',
    soc?: number | null,
  ) {
    const metric = formatPower(value, true);
    const unavailable = isEntityUnavailable(this.hass!, entityId);
    const content = html`
      <div class="source-icon ${iconClass}"><ha-icon icon=${icon}></ha-icon></div>
      <div>
        <div class="source-name">${label}</div>
        <div class="source-status ${unavailable ? 'bad' : statusClass}">${unavailable ? this._t('Sensor unavailable') : status}</div>
      </div>
      <div>
        <div class="source-value">${metric.value}<span>${metric.unit}</span></div>
        ${soc !== undefined && soc !== null ? html`
          <div class="battery-meta">
            <span class="battery-glyph"><i style="width:${Math.max(0, Math.min(100, soc))}%"></i></span>
            <small>${Math.round(soc)}%</small>
          </div>
        ` : nothing}
      </div>
    `;
    return entityId
      ? html`<button class="source-row" type="button" @click=${() => fireMoreInfo(this, entityId)}>${content}</button>`
      : html`<div class="source-row">${content}</div>`;
  }

  protected render() {
    if (!this.hass) return nothing;
    if (this.loading && !this.context) {
      return html`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div></div></ha-card>`;
    }
    if (!this.context) {
      return html`<ha-card><div class="empty" role="alert"><ha-icon icon="mdi:cloud-alert-outline"></ha-icon><strong>${this._t('Live energy unavailable')}</strong><span>${this.loadError}</span></div></ha-card>`;
    }

    const sources = this.context.sources;
    const grid = gridPower(this.hass, this.context);
    const solar = sources.solar_power
      ? Math.max(0, stateNumber(this.hass, sources.solar_power, !!sources.solar_invert) ?? 0)
      : 0;
    const battery = sources.battery_power
      ? stateNumber(this.hass, sources.battery_power, !!sources.battery_invert)
      : null;
    const soc = stateNumber(this.hass, sources.battery_soc);
    const contributorDead = isGridUnavailable(this.hass, this.context)
      || (!!sources.solar_power && isEntityUnavailable(this.hass, sources.solar_power))
      || (!!sources.battery_power && isEntityUnavailable(this.hass, sources.battery_power));
    const house = grid !== null && !contributorDead
      ? Math.max(0, grid + solar + (battery ?? 0))
      : null;
    const homeMetric = formatPower(house);
    const showFlow = this.config.show_flow === true;
    const showDetails = !showFlow || this.config.show_details !== false;
    const sourceCount = 1 + (sources.solar_power ? 1 : 0) + (sources.battery_power ? 1 : 0);
    const header = this.renderHeader(
      this._t('Live energy'),
      this._t(sourceCount === 1 ? '{count} source connected' : '{count} sources connected', { count: sourceCount }),
      'mdi:home-lightning-bolt-outline',
    );
    const rows = [
      this.config.show_grid !== false
        ? this._row(
          this._t('Grid'),
          this.context.netEntity || this.context.gridImportEntity || this.context.gridExportEntity,
          grid,
          grid !== null && grid < -5 ? 'mdi:transmission-tower-export' : 'mdi:transmission-tower-import',
          grid === null || Math.abs(grid) <= 5 ? '' : grid > 5 ? 'import' : 'export',
          this._t(grid === null ? 'No reading' : grid > 5 ? 'Importing from grid' : grid < -5 ? 'Exporting to grid' : 'Grid balanced'),
          grid !== null && grid < -5 ? 'good' : '',
        )
        : nothing,
      this.config.show_solar !== false && sources.solar_power
        ? this._row(
          this._t('Solar'),
          sources.solar_power,
          solar,
          'mdi:solar-power-variant',
          'solar',
          this._t(solar > 5 ? 'Producing now' : 'No production'),
          solar > 5 ? 'good' : '',
        )
        : nothing,
      this.config.show_battery !== false && sources.battery_power
        ? this._row(
          this._t('Battery'),
          sources.battery_power,
          battery,
          battery !== null && battery < -5 ? 'mdi:battery-arrow-up-outline' : 'mdi:battery-arrow-down-outline',
          'battery',
          this._t(battery === null ? 'No reading' : battery > 5 ? 'Discharging' : battery < -5 ? 'Charging' : 'Idle'),
          battery !== null && battery > 5 ? 'good' : '',
          soc,
        )
        : nothing,
    ];

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
          ${showFlow ? this._renderFlow(grid, solar, battery, soc, house, contributorDead) : nothing}
          ${showDetails ? html`<div class="live-layout ${this.config.show_home === false ? 'no-home' : ''}">
            ${this.config.show_home !== false ? html`
              <div class="home">
                <div class="home-label"><ha-icon icon="mdi:home-outline"></ha-icon>${this._t('Home consumption')}</div>
                <div class="home-power">${homeMetric.value}<span>${homeMetric.unit}</span></div>
                <div class="home-caption ${contributorDead ? 'error' : ''}">
                  ${this._t(contributorDead ? 'A connected power sensor is unavailable' : 'Power used by your home right now')}
                </div>
                ${this._sourcePill(house, grid, solar, battery ?? 0)}
              </div>
            ` : nothing}
            <div class="sources">${rows}</div>
          </div>` : nothing}
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-energy-live-card': SmartHomeShopEnergyLiveCard;
  }
}
