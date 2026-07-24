import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import {
  EnergyCardBase,
  energyCardStyles,
  fireMoreInfo,
  formatPower,
  isEntityUnavailable,
  stateNumber,
  type BaseEnergyCardConfig,
} from './energy-card-common';
import { energyText } from '../utils/energy-translations';
import './energy-card-editor';

export interface EnergyLiveCardConfig extends BaseEnergyCardConfig {
  show_home?: boolean;
  show_grid?: boolean;
  show_solar?: boolean;
  show_battery?: boolean;
}

const DEFAULTS: Required<Omit<EnergyLiveCardConfig, 'type' | 'title'>> = {
  show_header: true,
  show_home: true,
  show_grid: true,
  show_solar: true,
  show_battery: true,
};

@customElement('smarthomeshop-energy-live-card')
export class SmartHomeShopEnergyLiveCard extends EnergyCardBase<EnergyLiveCardConfig> {
  protected config: EnergyLiveCardConfig = { ...DEFAULTS };

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
      .no-home .sources { grid-column: 1 / -1; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
      .no-home .source-row { border-right: 1px solid var(--shs-line); }

      @container (max-width: 540px) {
        .live-layout { grid-template-columns: 1fr; margin: 0 -14px -14px; }
        .home { min-height: 168px; padding: 20px; border-right: 0; border-bottom: 1px solid var(--shs-line); }
        .home-power { font-size: 40px; }
      }
    `,
  ];

  public setConfig(config: EnergyLiveCardConfig): void {
    if (!config) throw new Error('Energy Live card configuration is required.');
    this.config = { ...DEFAULTS, ...config };
  }

  public getCardSize(): number { return 4; }

  public static getStubConfig(): EnergyLiveCardConfig {
    return { show_header: true, show_home: true, show_grid: true, show_solar: true, show_battery: true };
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
    const grid = stateNumber(this.hass, this.context.netEntity);
    const solar = sources.solar_power
      ? Math.max(0, stateNumber(this.hass, sources.solar_power, !!sources.solar_invert) ?? 0)
      : 0;
    const battery = sources.battery_power
      ? stateNumber(this.hass, sources.battery_power, !!sources.battery_invert)
      : null;
    const soc = stateNumber(this.hass, sources.battery_soc);
    const contributorDead = isEntityUnavailable(this.hass, this.context.netEntity)
      || (!!sources.solar_power && isEntityUnavailable(this.hass, sources.solar_power))
      || (!!sources.battery_power && isEntityUnavailable(this.hass, sources.battery_power));
    const house = grid !== null && !contributorDead
      ? Math.max(0, grid + solar + (battery ?? 0))
      : null;
    const homeMetric = formatPower(house);
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
          this.context.netEntity,
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
          <div class="live-layout ${this.config.show_home === false ? 'no-home' : ''}">
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
          </div>
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
