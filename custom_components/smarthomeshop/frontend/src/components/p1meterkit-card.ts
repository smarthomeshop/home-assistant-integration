import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { fireMoreInfo } from '../utils/helpers';
import { productLogo } from '../utils/product-logos';
import { baseStyles } from '../utils/styles';
import type { HomeAssistant } from '../types/home-assistant';
import {
  connectionStateForDevice,
  findProductDevices,
  formatMetric,
  formatPowerMetric,
  productDeviceName,
  resolveProductDevice,
  resolveProductEntity,
  stateNumber,
  stateUnit,
  type ProductDeviceMatcher,
} from './product-card-utils';

interface P1MeterKitCardConfig {
  device_id?: string;
  title?: string;
  show_header?: boolean;
  show_status?: boolean;
  show_power_flow?: boolean;
  show_energy_totals?: boolean;
  show_phases?: boolean;
  show_insights?: boolean;
  show_gas?: boolean;
  show_environment?: boolean;
}

interface P1Entities {
  connectivity?: string;
  powerConsumed?: string;
  powerProduced?: string;
  netPower?: string;
  consumedTariff1?: string;
  consumedTariff2?: string;
  producedTariff1?: string;
  producedTariff2?: string;
  currentPhase1?: string;
  currentPhase2?: string;
  currentPhase3?: string;
  powerPhase1?: string;
  powerPhase2?: string;
  powerPhase3?: string;
  standbyPower?: string;
  standbyCost?: string;
  monthPeak?: string;
  costToday?: string;
  costMonth?: string;
  phaseMaxLoad?: string;
  availableGridPower?: string;
  gas?: string;
  temperature?: string;
  humidity?: string;
}

const P1_MATCHER: ProductDeviceMatcher = {
  aliases: ['p1meterkit', 'p1 meter kit'],
  exclude: ['waterp1meterkit', 'water p1 meter kit'],
};

const P1_DEFAULTS: Required<Omit<P1MeterKitCardConfig, 'device_id' | 'title'>> = {
  show_header: true,
  show_status: true,
  show_power_flow: true,
  show_energy_totals: true,
  show_phases: true,
  show_insights: true,
  show_gas: true,
  show_environment: true,
};

@customElement('smarthomeshop-p1meterkit-card')
export class SmartHomeShopP1MeterKitCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: P1MeterKitCardConfig = { ...P1_DEFAULTS };

  private _cachedDeviceId?: string;
  private _cachedRegistry?: HomeAssistant['entities'];
  private _cachedEntities: P1Entities = {};

  static styles = [
    baseStyles,
    css`
      .card-content {
        display: grid;
        gap: 14px;
      }

      .header { margin-bottom: 0; }
      .header-icon {
        background: color-mix(in srgb, var(--warning-color) 14%, transparent);
        color: var(--warning-color);
      }
      .header-icon svg { color: currentColor; }

      .status-badge.offline {
        background: color-mix(in srgb, var(--error-color) 14%, transparent);
        color: var(--error-color);
      }
      .status-badge.importing {
        background: color-mix(in srgb, var(--warning-color) 14%, transparent);
        color: color-mix(in srgb, var(--warning-color) 88%, var(--primary-text-color));
      }
      .status-badge.exporting {
        background: color-mix(in srgb, var(--success-color) 14%, transparent);
        color: var(--success-color);
      }
      .status-badge.balanced {
        background: var(--shs-surface);
        color: var(--secondary-text-color);
      }

      .power-flow {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: stretch;
        gap: 10px;
      }
      .power-side,
      .net-power {
        border: 1px solid var(--shs-outline);
        border-radius: 12px;
        background: var(--shs-surface);
      }
      .power-side {
        appearance: none;
        color: inherit;
        font: inherit;
        min-width: 0;
        padding: 13px;
        text-align: left;
        cursor: pointer;
        transition: border-color 160ms ease, background-color 160ms ease;
      }
      .power-side:hover {
        border-color: color-mix(in srgb, var(--primary-color) 38%, var(--divider-color));
        background: var(--shs-surface-hover);
      }
      .power-side.export { text-align: right; }
      .power-label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--secondary-text-color);
        font-size: 11px;
        font-weight: 650;
        text-transform: uppercase;
      }
      .power-side.export .power-label { justify-content: flex-end; }
      .power-label ha-icon { --mdc-icon-size: 17px; }
      .power-reading {
        margin-top: 8px;
        color: var(--primary-text-color);
        font-size: 25px;
        font-weight: 700;
        line-height: 1;
      }
      .power-reading span {
        margin-left: 3px;
        color: var(--secondary-text-color);
        font-size: 12px;
        font-weight: 550;
      }
      .net-power {
        width: 88px;
        padding: 10px 8px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 4px;
        text-align: center;
      }
      .net-icon {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--primary-color) 13%, transparent);
        color: var(--primary-color);
      }
      .net-icon ha-icon { --mdc-icon-size: 20px; }
      .net-value { font-size: 14px; font-weight: 700; color: var(--primary-text-color); }
      .net-caption { font-size: 10px; color: var(--secondary-text-color); }

      .section {
        display: grid;
        gap: 9px;
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 650;
      }
      .section-title ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color); }
      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .metric {
        appearance: none;
        min-width: 0;
        border: 1px solid var(--shs-outline);
        border-radius: 10px;
        background: var(--shs-surface);
        color: inherit;
        font: inherit;
        padding: 11px;
        text-align: left;
        cursor: pointer;
      }
      .metric:hover { background: var(--shs-surface-hover); }
      .metric-label {
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 600;
        line-height: 1.25;
        text-transform: uppercase;
      }
      .metric-value {
        margin-top: 5px;
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 17px;
        font-weight: 680;
        line-height: 1.15;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .metric-value span {
        margin-left: 3px;
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 500;
      }

      .phase-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .phase {
        border: 1px solid var(--shs-outline);
        border-radius: 10px;
        padding: 10px;
        background: var(--shs-surface);
      }
      .phase-top { display: flex; align-items: baseline; justify-content: space-between; gap: 4px; }
      .phase-name { color: var(--secondary-text-color); font-size: 10px; font-weight: 700; }
      .phase-current { color: var(--primary-text-color); font-size: 14px; font-weight: 700; }
      .phase-current span { color: var(--secondary-text-color); font-size: 9px; }
      .phase-bar {
        height: 4px;
        margin-top: 8px;
        overflow: hidden;
        border-radius: 2px;
        background: color-mix(in srgb, var(--divider-color) 75%, transparent);
      }
      .phase-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--primary-color);
      }
      .phase-power { margin-top: 6px; color: var(--secondary-text-color); font-size: 10px; }

      .empty-state {
        display: grid;
        place-items: center;
        gap: 8px;
        min-height: 140px;
        padding: 20px;
        border: 1px dashed var(--shs-outline);
        border-radius: 12px;
        color: var(--secondary-text-color);
        text-align: center;
      }
      .empty-state ha-icon { --mdc-icon-size: 30px; color: var(--warning-color); }
      .empty-state .product-logo {
        display: block;
        width: 38px;
        height: 38px;
        color: var(--warning-color);
      }
      .empty-state .product-logo svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .empty-state strong { color: var(--primary-text-color); }
      .empty-state span { max-width: 300px; font-size: 12px; line-height: 1.45; }

      @container (max-width: 390px) {
        .card-content { padding: 13px; gap: 12px; }
        .power-flow { grid-template-columns: minmax(0, 1fr) 70px minmax(0, 1fr); gap: 6px; }
        .power-side { padding: 10px; }
        .power-reading { font-size: 20px; }
        .net-power { width: 52px; }
        .header-title { font-size: 0.95rem; }
        .status-badge { padding: 5px 8px; }
      }
    `,
  ];

  public setConfig(config: P1MeterKitCardConfig): void {
    this._config = { ...P1_DEFAULTS, ...config };
    this._cachedDeviceId = undefined;
  }

  public getCardSize(): number {
    return 6;
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement('smarthomeshop-p1meterkit-card-editor');
  }

  public static getStubConfig(): P1MeterKitCardConfig {
    return { ...P1_DEFAULTS };
  }

  private _device() {
    return resolveProductDevice(this.hass, this._config.device_id, P1_MATCHER);
  }

  private _resolveEntities(): P1Entities {
    const device = this._device();
    const deviceId = device?.id;
    if (this._cachedDeviceId === deviceId && this._cachedRegistry === this.hass?.entities) {
      return this._cachedEntities;
    }

    const find = (matcher: Parameters<typeof resolveProductEntity>[2]) =>
      resolveProductEntity(this.hass, deviceId, matcher, P1_MATCHER);
    this._cachedEntities = {
      connectivity: find({ domains: ['binary_sensor'], deviceClasses: ['connectivity'] }),
      powerConsumed: find({ domains: ['sensor'], suffixes: ['power_consumed'], excludes: ['phase', 'net'] }),
      powerProduced: find({ domains: ['sensor'], suffixes: ['power_produced'], excludes: ['phase'] }),
      netPower: find({ domains: ['sensor'], suffixes: ['net_grid_power_cc', 'net_power_cc'], includesAll: ['net', 'power'] }),
      consumedTariff1: find({ domains: ['sensor'], suffixes: ['energy_consumed_tariff_1'] }),
      consumedTariff2: find({ domains: ['sensor'], suffixes: ['energy_consumed_tariff_2'] }),
      producedTariff1: find({ domains: ['sensor'], suffixes: ['energy_produced_tariff_1'] }),
      producedTariff2: find({ domains: ['sensor'], suffixes: ['energy_produced_tariff_2'] }),
      currentPhase1: find({ domains: ['sensor'], suffixes: ['current_phase_1'] }),
      currentPhase2: find({ domains: ['sensor'], suffixes: ['current_phase_2'] }),
      currentPhase3: find({ domains: ['sensor'], suffixes: ['current_phase_3'] }),
      powerPhase1: find({ domains: ['sensor'], suffixes: ['power_consumed_phase_1'] }),
      powerPhase2: find({ domains: ['sensor'], suffixes: ['power_consumed_phase_2'] }),
      powerPhase3: find({ domains: ['sensor'], suffixes: ['power_consumed_phase_3'] }),
      standbyPower: find({ domains: ['sensor'], suffixes: ['standby_power_cc'] }),
      standbyCost: find({ domains: ['sensor'], suffixes: ['standby_cost_per_year_cc', 'standby_cost_year_cc'] }),
      monthPeak: find({ domains: ['sensor'], suffixes: ['month_peak_cc'] }),
      costToday: find({ domains: ['sensor'], suffixes: ['energy_cost_today_cc'] }),
      costMonth: find({ domains: ['sensor'], suffixes: ['energy_cost_this_month_cc', 'energy_cost_month_cc'] }),
      phaseMaxLoad: find({ domains: ['sensor'], suffixes: ['highest_phase_load_cc', 'phase_max_load_cc'] }),
      availableGridPower: find({ domains: ['sensor'], suffixes: ['available_grid_power_cc'] }),
      gas: find({ domains: ['sensor'], suffixes: ['gas_consumed'], deviceClasses: ['gas'] }),
      temperature: find({ domains: ['sensor'], suffixes: ['temperature'], deviceClasses: ['temperature'], excludes: ['cpu'] }),
      humidity: find({ domains: ['sensor'], suffixes: ['humidity'], deviceClasses: ['humidity'] }),
    };
    this._cachedDeviceId = deviceId;
    this._cachedRegistry = this.hass?.entities;
    return this._cachedEntities;
  }

  private _watts(entityId: string | undefined): number | null {
    const value = stateNumber(this.hass, entityId);
    if (value === null) return null;
    return stateUnit(this.hass, entityId).toLowerCase() === 'kw' ? value * 1000 : value;
  }

  private _metric(label: string, entityId: string | undefined, digits = 2, unit?: string) {
    const value = stateNumber(this.hass, entityId);
    if (value === null) return nothing;
    const resolvedUnit = unit ?? stateUnit(this.hass, entityId);
    return html`
      <button class="metric" type="button" @click=${() => entityId && fireMoreInfo(this, entityId)}>
        <div class="metric-label">${label}</div>
        <div class="metric-value">${formatMetric(value, digits)}<span>${resolvedUnit}</span></div>
      </button>
    `;
  }

  private _phase(name: string, currentEntity: string | undefined, powerEntity: string | undefined, max: number) {
    const current = stateNumber(this.hass, currentEntity);
    const power = this._watts(powerEntity);
    if (current === null && power === null) return nothing;
    const width = current === null || max <= 0 ? 0 : Math.min(100, (current / max) * 100);
    const formattedPower = formatPowerMetric(power);
    return html`
      <div class="phase">
        <div class="phase-top">
          <span class="phase-name">${name}</span>
          <span class="phase-current">${formatMetric(current, 1)}<span>A</span></span>
        </div>
        <div class="phase-bar"><span style="width:${width}%"></span></div>
        <div class="phase-power">${formattedPower.value} ${formattedPower.unit}</div>
      </div>
    `;
  }

  protected render() {
    if (!this.hass) return nothing;
    const device = this._device();
    const entities = this._resolveEntities();
    const logo = productLogo('p1meterkit');

    if (!device) {
      return html`
        <ha-card>
          <div class="card-content">
            <div class="empty-state">
              ${logo
                ? html`<span class="product-logo">${unsafeHTML(logo)}</span>`
                : html`<ha-icon icon="mdi:meter-electric-outline"></ha-icon>`}
              <strong>No P1MeterKit found</strong>
              <span>Add the P1MeterKit to Home Assistant or select its device in the card editor.</span>
            </div>
          </div>
        </ha-card>
      `;
    }

    const connection = connectionStateForDevice(this.hass, device.id);
    const consumed = this._watts(entities.powerConsumed) ?? 0;
    const produced = this._watts(entities.powerProduced) ?? 0;
    const directNet = this._watts(entities.netPower);
    const net = directNet ?? consumed - produced;
    const direction = net > 10 ? 'importing' : net < -10 ? 'exporting' : 'balanced';
    const directionLabel = direction === 'importing' ? 'Importing' : direction === 'exporting' ? 'Exporting' : 'Balanced';
    const netMetric = formatPowerMetric(net);
    const consumedMetric = formatPowerMetric(consumed);
    const producedMetric = formatPowerMetric(produced);

    const currents = [
      stateNumber(this.hass, entities.currentPhase1),
      stateNumber(this.hass, entities.currentPhase2),
      stateNumber(this.hass, entities.currentPhase3),
    ];
    const maxCurrent = Math.max(1, ...currents.map((value) => value ?? 0));
    const hasPhases = currents.some((value) => value !== null);
    const totalEntities = [
      entities.consumedTariff1,
      entities.consumedTariff2,
      entities.producedTariff1,
      entities.producedTariff2,
    ];
    const hasTotals = totalEntities.some((entityId) => stateNumber(this.hass, entityId) !== null);
    const insightEntities = [
      entities.costToday,
      entities.costMonth,
      entities.standbyPower,
      entities.standbyCost,
      entities.monthPeak,
      entities.phaseMaxLoad,
      entities.availableGridPower,
    ];
    const hasInsights = insightEntities.some((entityId) => stateNumber(this.hass, entityId) !== null);
    const hasEnvironment = stateNumber(this.hass, entities.temperature) !== null || stateNumber(this.hass, entities.humidity) !== null;

    return html`
      <ha-card>
        <div class="card-content">
          ${this._config.show_header !== false ? html`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${logo
                    ? unsafeHTML(logo)
                    : html`<ha-icon icon="mdi:meter-electric-outline"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${this._config.title || productDeviceName(device)}</h2>
                  <div class="header-subtitle">Energy monitoring</div>
                </div>
              </div>
              ${this._config.show_status !== false ? html`
                <div class="status-badge ${connection.offline ? 'offline' : direction}">
                  <ha-icon icon="${connection.offline
                    ? 'mdi:lan-disconnect'
                    : direction === 'exporting'
                      ? 'mdi:transmission-tower-export'
                      : direction === 'importing'
                        ? 'mdi:transmission-tower-import'
                        : 'mdi:check-circle'}"></ha-icon>
                  <span>${connection.offline ? 'Offline' : directionLabel}</span>
                </div>
              ` : nothing}
            </div>
          ` : nothing}

          ${this._config.show_power_flow !== false ? html`
            <div class="power-flow">
              <button class="power-side" type="button" @click=${() => entities.powerConsumed && fireMoreInfo(this, entities.powerConsumed)}>
                <div class="power-label"><ha-icon icon="mdi:transmission-tower-import"></ha-icon>From grid</div>
                <div class="power-reading">${consumedMetric.value}<span>${consumedMetric.unit}</span></div>
              </button>
              <div class="net-power">
                <div class="net-icon"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></div>
                <div class="net-value">${netMetric.value} ${netMetric.unit}</div>
                <div class="net-caption">${directionLabel}</div>
              </div>
              <button class="power-side export" type="button" @click=${() => entities.powerProduced && fireMoreInfo(this, entities.powerProduced)}>
                <div class="power-label">To grid<ha-icon icon="mdi:transmission-tower-export"></ha-icon></div>
                <div class="power-reading">${producedMetric.value}<span>${producedMetric.unit}</span></div>
              </button>
            </div>
          ` : nothing}

          ${this._config.show_phases !== false && hasPhases ? html`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:sine-wave"></ha-icon>Phase load</div>
              <div class="phase-grid">
                ${this._phase('L1', entities.currentPhase1, entities.powerPhase1, maxCurrent)}
                ${this._phase('L2', entities.currentPhase2, entities.powerPhase2, maxCurrent)}
                ${this._phase('L3', entities.currentPhase3, entities.powerPhase3, maxCurrent)}
              </div>
            </section>
          ` : nothing}

          ${this._config.show_energy_totals !== false && hasTotals ? html`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:counter"></ha-icon>Meter totals</div>
              <div class="metric-grid">
                ${this._metric('Imported · tariff 1', entities.consumedTariff1, 3)}
                ${this._metric('Imported · tariff 2', entities.consumedTariff2, 3)}
                ${this._metric('Returned · tariff 1', entities.producedTariff1, 3)}
                ${this._metric('Returned · tariff 2', entities.producedTariff2, 3)}
              </div>
            </section>
          ` : nothing}

          ${this._config.show_insights !== false && hasInsights ? html`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:chart-box-outline"></ha-icon>Energy insights</div>
              <div class="metric-grid">
                ${this._metric('Cost today', entities.costToday, 2)}
                ${this._metric('Cost this month', entities.costMonth, 2)}
                ${this._metric('Standby power', entities.standbyPower, 0)}
                ${this._metric('Standby cost / year', entities.standbyCost, 0)}
                ${this._metric('Month peak', entities.monthPeak, 2)}
                ${this._metric('Highest phase load', entities.phaseMaxLoad, 0)}
                ${this._metric('Grid capacity available', entities.availableGridPower, 0)}
              </div>
            </section>
          ` : nothing}

          ${this._config.show_gas !== false && stateNumber(this.hass, entities.gas) !== null ? html`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:fire"></ha-icon>Gas</div>
              <div class="metric-grid">${this._metric('Total gas consumed', entities.gas, 3)}</div>
            </section>
          ` : nothing}

          ${this._config.show_environment !== false && hasEnvironment ? html`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:thermometer-lines"></ha-icon>Meter environment</div>
              <div class="metric-grid">
                ${this._metric('Temperature', entities.temperature, 1)}
                ${this._metric('Humidity', entities.humidity, 0)}
              </div>
            </section>
          ` : nothing}
        </div>
      </ha-card>
    `;
  }
}

@customElement('smarthomeshop-p1meterkit-card-editor')
export class SmartHomeShopP1MeterKitCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: P1MeterKitCardConfig = { ...P1_DEFAULTS };

  static styles = css`
    :host { display: block; }
    .editor { display: grid; gap: 16px; padding: 4px 0; }
    .field { display: grid; gap: 6px; }
    label, .group-title { color: var(--primary-text-color); font-size: 13px; font-weight: 600; }
    select, input[type='text'] {
      width: 100%;
      box-sizing: border-box;
      min-height: 42px;
      padding: 9px 11px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }
    .options {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: var(--secondary-background-color);
    }
    .check { display: flex; align-items: center; gap: 9px; color: var(--primary-text-color); font-size: 13px; }
    .check input { width: 18px; height: 18px; margin: 0; accent-color: var(--primary-color); }
    .hint { color: var(--secondary-text-color); font-size: 11px; line-height: 1.4; }
  `;

  public setConfig(config: P1MeterKitCardConfig): void {
    this._config = { ...P1_DEFAULTS, ...config };
  }

  private _change(key: keyof P1MeterKitCardConfig, value: string | boolean): void {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }

  protected render() {
    const devices = findProductDevices(this.hass, P1_MATCHER);
    const options: Array<[keyof P1MeterKitCardConfig, string]> = [
      ['show_header', 'Header'],
      ['show_status', 'Connection and grid status'],
      ['show_power_flow', 'Live import and export'],
      ['show_phases', 'Phase load'],
      ['show_energy_totals', 'Meter totals'],
      ['show_insights', 'Costs, peak and standby insights'],
      ['show_gas', 'Gas meter'],
      ['show_environment', 'Meter temperature and humidity'],
    ];
    return html`
      <div class="editor">
        <div class="field">
          <label for="device">P1MeterKit device</label>
          <select id="device" .value=${this._config.device_id ?? ''} @change=${(event: Event) => this._change('device_id', (event.target as HTMLSelectElement).value)}>
            <option value="">Automatic</option>
            ${devices.map((device) => html`<option value=${device.id}>${productDeviceName(device)}</option>`)}
          </select>
          <div class="hint">The card links entities through the Home Assistant device registry, so renamed entity IDs keep working.</div>
        </div>
        <div class="field">
          <label for="title">Card title</label>
          <input id="title" type="text" .value=${this._config.title ?? ''} placeholder="Use device name" @input=${(event: Event) => this._change('title', (event.target as HTMLInputElement).value)}>
        </div>
        <div class="options">
          <div class="group-title">Visible sections</div>
          ${options.map(([key, label]) => html`
            <label class="check">
              <input type="checkbox" .checked=${this._config[key] !== false} @change=${(event: Event) => this._change(key, (event.target as HTMLInputElement).checked)}>
              <span>${label}</span>
            </label>
          `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-p1meterkit-card': SmartHomeShopP1MeterKitCard;
    'smarthomeshop-p1meterkit-card-editor': SmartHomeShopP1MeterKitCardEditor;
  }
}
