/**
 * Card editors for SmartHomeShop cards
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';

interface SmartHomeShopDevice {
  id: string;
  name: string;
  type: string;
}

const editorStyles = css`
  .form-row {
    margin-bottom: 16px;
  }
  label {
    display: block;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--primary-text-color);
  }
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 8px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 14px;
    cursor: pointer;
  }
  select:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .checkbox-row input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  .checkbox-row label {
    margin-bottom: 0;
    cursor: pointer;
  }
  .option-group {
    padding: 12px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 10px;
    background: color-mix(
      in srgb,
      var(--secondary-background-color) 72%,
      var(--card-background-color)
    );
    margin-bottom: 10px;
  }
  .option-group .checkbox-row:last-child {
    margin-bottom: 0;
  }
  .nested-options {
    margin: 8px 0 0 25px;
    padding: 8px 0 0 12px;
    border-left: 2px solid var(--divider-color, #e0e0e0);
  }
  .nested-options .checkbox-row {
    margin-bottom: 7px;
  }
  .option-description {
    margin: -2px 0 9px 26px;
    font-size: 11px;
    line-height: 1.4;
    color: var(--secondary-text-color);
  }
  .info {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-top: 8px;
  }
  .device-info {
    margin-top: 8px;
    padding: 10px;
    background: var(--secondary-background-color);
    border-radius: 8px;
    font-size: 12px;
  }
  .device-info span {
    color: var(--secondary-text-color);
  }
  .divider {
    height: 1px;
    background: var(--divider-color, #e0e0e0);
    margin: 16px 0;
  }
  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--secondary-text-color);
    margin-bottom: 10px;
  }
  .feature-info {
    font-size: 11px;
    color: var(--secondary-text-color);
    margin-left: 26px;
    margin-top: -4px;
    margin-bottom: 8px;
  }
`;

function findSmartHomeShopDevices(hass: HomeAssistant | undefined): SmartHomeShopDevice[] {
  if (!hass) return [];

  const devices: Map<string, SmartHomeShopDevice> = new Map();
  const productPatterns = [
    { pattern: 'waterp1meterkit', type: 'WaterP1MeterKit' },
    { pattern: 'watermeterkit', type: 'WaterMeterKit' },
    { pattern: 'waterflowkit', type: 'WaterFlowKit' },
  ];

  Object.keys(hass.states).forEach((entityId) => {
    const state = hass.states[entityId];
    const friendlyName = (state?.attributes?.friendly_name || '').toLowerCase();
    const entityIdLower = entityId.toLowerCase();

    for (const { pattern, type } of productPatterns) {
      if (friendlyName.includes(pattern) || entityIdLower.includes(pattern)) {
        // Extract device identifier (usually MAC suffix)
        const match = entityIdLower.match(new RegExp(`${pattern}[_-]?([a-f0-9]{6})`));
        const deviceId = match ? match[1] : pattern;

        if (!devices.has(deviceId)) {
          // Get nice name from friendly name
          const nameParts = (state?.attributes?.friendly_name || '').split(' ');
          const deviceName = nameParts.slice(0, 2).join(' ') || `${type} ${deviceId.toUpperCase()}`;

          devices.set(deviceId, {
            id: deviceId,
            name: deviceName,
            type: type,
          });
        }
        break;
      }
    }
  });

  return Array.from(devices.values());
}

@customElement('smarthomeshop-water-card-editor')
export class SmartHomeShopWaterCardEditor extends LitElement {
  static styles = editorStyles;

  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  @state() private _devices: SmartHomeShopDevice[] = [];

  public setConfig(config: Record<string, unknown>): void {
    this._config = config;
  }

  protected updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('hass') && this.hass) {
      this._devices = findSmartHomeShopDevices(this.hass).filter(
        (d) => d.type === 'WaterMeterKit' || d.type === 'WaterFlowKit'
      );
    }
  }

  private _valueChanged(key: string, value: unknown): void {
    if (this._config[key] === value) return;

    const newConfig = { ...this._config, [key]: value };

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render() {
    const selectedDevice = this._devices.find((d) => d.id === this._config.device_id);

    return html`
      <div class="form-row">
        <label>Device</label>
        <select
          @change=${(e: Event) =>
            this._valueChanged('device_id', (e.target as HTMLSelectElement).value || undefined)}
        >
          <option value="">Auto detect</option>
          ${this._devices.map(
            (device) => html`
              <option value=${device.id} ?selected=${device.id === this._config.device_id}>
                ${device.name} (${device.type})
              </option>
            `
          )}
        </select>
        ${selectedDevice
          ? html`
              <div class="device-info">
                <span>Type:</span> ${selectedDevice.type}<br />
                <span>ID:</span> ${selectedDevice.id.toUpperCase()}
              </div>
            `
          : nothing}
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Visible content</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_header"
              .checked=${this._config.show_header !== false}
              @change=${(e: Event) => this._valueChanged('show_header', (e.target as HTMLInputElement).checked)} />
            <label for="show_header">Header</label>
          </div>
          ${this._config.show_header !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_status"
                  .checked=${this._config.show_status !== false}
                  @change=${(e: Event) => this._valueChanged('show_status', (e.target as HTMLInputElement).checked)} />
                <label for="show_status">Status badge</label>
              </div>
            </div>
          ` : nothing}
        </div>

        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_water_current"
              .checked=${this._config.show_water_current !== false}
              @change=${(e: Event) => this._valueChanged('show_water_current', (e.target as HTMLInputElement).checked)} />
            <label for="show_water_current">Current water usage</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_water_totals"
              .checked=${this._config.show_water_totals !== false}
              @change=${(e: Event) => this._valueChanged('show_water_totals', (e.target as HTMLInputElement).checked)} />
            <label for="show_water_totals">Period totals</label>
          </div>
          ${this._config.show_water_totals !== false ? html`
            <div class="nested-options">
              ${(['today', 'week', 'month', 'year'] as const).map((period) => html`
                <div class="checkbox-row">
                  <input type="checkbox" id=${`show_${period}`}
                    .checked=${this._config[`show_${period}`] !== false}
                    @change=${(e: Event) => this._valueChanged(`show_${period}`, (e.target as HTMLInputElement).checked)} />
                  <label for=${`show_${period}`}>${period[0].toUpperCase()}${period.slice(1)}</label>
                </div>
              `)}
            </div>
          ` : nothing}
        </div>

        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_graph"
              .checked=${this._config.show_graph !== false}
              @change=${(e: Event) => this._valueChanged('show_graph', (e.target as HTMLInputElement).checked)} />
            <label for="show_graph">24-hour usage graph</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_meter_reading"
              .checked=${this._config.show_meter_reading !== false}
              @change=${(e: Event) => this._valueChanged('show_meter_reading', (e.target as HTMLInputElement).checked)} />
            <label for="show_meter_reading">Total meter reading</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_leak_detection"
              .checked=${this._config.show_leak_detection !== false}
              @change=${(e: Event) => this._valueChanged('show_leak_detection', (e.target as HTMLInputElement).checked)} />
            <label for="show_leak_detection">Leak detection</label>
          </div>
        </div>
        <div class="info">If no device is selected, entities are automatically detected.</div>
      </div>
    `;
  }
}

@customElement('smarthomeshop-waterp1-card-editor')
export class SmartHomeShopWaterP1CardEditor extends LitElement {
  static styles = editorStyles;

  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: Record<string, unknown> = {};
  @state() private _devices: SmartHomeShopDevice[] = [];

  public setConfig(config: Record<string, unknown>): void {
    this._config = config;
  }

  protected updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('hass') && this.hass) {
      this._devices = findSmartHomeShopDevices(this.hass).filter(
        (d) => d.type === 'WaterP1MeterKit'
      );
    }
  }

  private _valueChanged(key: string, value: unknown): void {
    if (this._config[key] === value) return;

    const newConfig = { ...this._config, [key]: value };

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render() {
    const selectedDevice = this._devices.find((d) => d.id === this._config.device_id);

    return html`
      <div class="form-row">
        <label>Device</label>
        <select
          @change=${(e: Event) =>
            this._valueChanged('device_id', (e.target as HTMLSelectElement).value || undefined)}
        >
          <option value="">Auto detect</option>
          ${this._devices.map(
            (device) => html`
              <option value=${device.id} ?selected=${device.id === this._config.device_id}>
                ${device.name}
              </option>
            `
          )}
        </select>
        ${selectedDevice
          ? html`
              <div class="device-info">
                <span>Type:</span> ${selectedDevice.type}<br />
                <span>ID:</span> ${selectedDevice.id.toUpperCase()}
              </div>
            `
          : nothing}
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Card</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_header"
              .checked=${this._config.show_header !== false}
              @change=${(e: Event) => this._valueChanged('show_header', (e.target as HTMLInputElement).checked)} />
            <label for="show_header">Header</label>
          </div>
          ${this._config.show_header !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_status"
                  .checked=${this._config.show_status !== false}
                  @change=${(e: Event) => this._valueChanged('show_status', (e.target as HTMLInputElement).checked)} />
                <label for="show_status">Status badge</label>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>

      <div class="form-row">
        <div class="section-title">Water</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_water"
              .checked=${this._config.show_water !== false}
              @change=${(e: Event) => this._valueChanged('show_water', (e.target as HTMLInputElement).checked)} />
            <label for="show_water">Water section</label>
          </div>
          ${this._config.show_water !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_water_current"
                  .checked=${this._config.show_water_current !== false}
                  @change=${(e: Event) => this._valueChanged('show_water_current', (e.target as HTMLInputElement).checked)} />
                <label for="show_water_current">Current water usage</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_water_totals"
                  .checked=${this._config.show_water_totals !== false}
                  @change=${(e: Event) => this._valueChanged('show_water_totals', (e.target as HTMLInputElement).checked)} />
                <label for="show_water_totals">Period totals</label>
              </div>
              ${this._config.show_water_totals !== false ? html`
                <div class="nested-options">
                  ${(['today', 'week', 'month', 'year'] as const).map((period) => html`
                    <div class="checkbox-row">
                      <input type="checkbox" id=${`waterp1_show_${period}`}
                        .checked=${this._config[`show_${period}`] !== false}
                        @change=${(e: Event) => this._valueChanged(`show_${period}`, (e.target as HTMLInputElement).checked)} />
                      <label for=${`waterp1_show_${period}`}>${period[0].toUpperCase()}${period.slice(1)}</label>
                    </div>
                  `)}
                </div>
              ` : nothing}
              <div class="checkbox-row">
                <input type="checkbox" id="show_graph"
                  .checked=${this._config.show_graph !== false}
                  @change=${(e: Event) => this._valueChanged('show_graph', (e.target as HTMLInputElement).checked)} />
                <label for="show_graph">24-hour usage graph</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_meter_reading"
                  .checked=${this._config.show_meter_reading !== false}
                  @change=${(e: Event) => this._valueChanged('show_meter_reading', (e.target as HTMLInputElement).checked)} />
                <label for="show_meter_reading">Total meter reading</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_leak_detection"
                  .checked=${this._config.show_leak_detection !== false}
                  @change=${(e: Event) => this._valueChanged('show_leak_detection', (e.target as HTMLInputElement).checked)} />
                <label for="show_leak_detection">Leak detection</label>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>

      <div class="form-row">
        <div class="section-title">Energy</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_energy"
              .checked=${this._config.show_energy !== false}
              @change=${(e: Event) => this._valueChanged('show_energy', (e.target as HTMLInputElement).checked)} />
            <label for="show_energy">Energy section</label>
          </div>
          ${this._config.show_energy !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_energy_current"
                  .checked=${this._config.show_energy_current !== false}
                  @change=${(e: Event) => this._valueChanged('show_energy_current', (e.target as HTMLInputElement).checked)} />
                <label for="show_energy_current">Current power usage</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_energy_today"
                  .checked=${this._config.show_energy_today !== false}
                  @change=${(e: Event) => this._valueChanged('show_energy_today', (e.target as HTMLInputElement).checked)} />
                <label for="show_energy_today">Electricity today</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_energy_returned"
                  .checked=${this._config.show_energy_returned !== false}
                  @change=${(e: Event) => this._valueChanged('show_energy_returned', (e.target as HTMLInputElement).checked)} />
                <label for="show_energy_returned">Returned energy</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_gas_today"
                  .checked=${this._config.show_gas_today !== false}
                  @change=${(e: Event) => this._valueChanged('show_gas_today', (e.target as HTMLInputElement).checked)} />
                <label for="show_gas_today">Gas today</label>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Hardware features (V3)</div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="has_water_leak_sensor"
              .checked=${this._config.has_water_leak_sensor === true}
              @change=${(e: Event) => this._valueChanged('has_water_leak_sensor', (e.target as HTMLInputElement).checked)} />
            <label for="has_water_leak_sensor">Optional water leak sensor connected</label>
          </div>
        </div>
        <div class="feature-info">
          Enable this if you have connected the optional water leak sensor to your WaterP1MeterKit V3.
          Critical leak alerts remain visible even when other content is hidden.
        </div>
      </div>
    `;
  }
}
