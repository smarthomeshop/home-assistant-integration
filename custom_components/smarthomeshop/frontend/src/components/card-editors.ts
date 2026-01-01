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
        <label>Options</label>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="show_graph"
            .checked=${this._config.show_graph !== false}
            @change=${(e: Event) =>
              this._valueChanged('show_graph', (e.target as HTMLInputElement).checked)}
          />
          <label for="show_graph">Show 24-hour graph</label>
        </div>
        <div class="info">
          If no device is selected, entities are automatically detected.
          Click on the graph to open full Home Assistant history.
        </div>
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
        <div class="section-title">Sections</div>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="show_water"
            .checked=${this._config.show_water !== false}
            @change=${(e: Event) =>
              this._valueChanged('show_water', (e.target as HTMLInputElement).checked)}
          />
          <label for="show_water">Show water section</label>
        </div>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="show_energy"
            .checked=${this._config.show_energy !== false}
            @change=${(e: Event) =>
              this._valueChanged('show_energy', (e.target as HTMLInputElement).checked)}
          />
          <label for="show_energy">Show energy section</label>
        </div>
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Options</div>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="show_graph"
            .checked=${this._config.show_graph !== false}
            @change=${(e: Event) =>
              this._valueChanged('show_graph', (e.target as HTMLInputElement).checked)}
          />
          <label for="show_graph">Show 24-hour graph</label>
        </div>
        <div class="info">
          Click on the graph to open full Home Assistant history.
        </div>
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <div class="section-title">Hardware Features (V3)</div>
        <div class="checkbox-row">
          <input
            type="checkbox"
            id="has_water_leak_sensor"
            .checked=${this._config.has_water_leak_sensor === true}
            @change=${(e: Event) =>
              this._valueChanged('has_water_leak_sensor', (e.target as HTMLInputElement).checked)}
          />
          <label for="has_water_leak_sensor">I have a water leak sensor connected</label>
        </div>
        <div class="feature-info">
          Enable this if you have connected the optional water leak sensor to your WaterP1MeterKit V3.
          When enabled, the card will show the sensor status and flash a red alert when water is detected.
        </div>
      </div>
    `;
  }
}
