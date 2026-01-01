import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, SmartHomeShopDevice, DeviceEntity } from '../types';

@customElement('shs-settings-page')
export class SettingsPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public selectedDeviceId?: string;
  @state() private _devices: SmartHomeShopDevice[] = [];
  @state() private _selectedDevice?: SmartHomeShopDevice;
  @state() private _entities: DeviceEntity[] = [];
  @state() private _loading = true;

  static styles = css`
    :host { display: block; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 28px; font-weight: 600; color: var(--primary-text-color); margin: 0 0 8px 0; }
    .page-subtitle { color: var(--secondary-text-color); margin: 0; }
    .settings-layout { display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
    .panel { background: var(--card-background-color); border-radius: 16px; padding: 20px; box-shadow: var(--material-shadow-elevation-2dp); }
    .panel-title { font-size: 14px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
    .panel-title ha-icon { color: var(--shs-primary); --mdc-icon-size: 18px; }
    .device-list { display: flex; flex-direction: column; gap: 8px; }
    .device-item { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--secondary-background-color); border-radius: 12px; cursor: pointer; border: 2px solid transparent; }
    .device-item:hover { background: var(--primary-background-color); transform: translateX(4px); }
    .device-item.selected { border-color: var(--shs-primary); background: rgba(255, 107, 53, 0.1); }
    .device-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #9c27b0, #673ab7); color: white; }
    .device-info { flex: 1; }
    .device-name { font-weight: 500; color: var(--primary-text-color); }
    .device-type { font-size: 12px; color: var(--secondary-text-color); }
    .settings-panel { display: flex; flex-direction: column; gap: 20px; }
    .settings-group { background: var(--card-background-color); border-radius: 16px; overflow: hidden; box-shadow: var(--material-shadow-elevation-2dp); }
    .group-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: var(--secondary-background-color); border-bottom: 1px solid var(--divider-color); }
    .group-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--shs-primary); color: white; }
    .group-title { font-size: 16px; font-weight: 600; color: var(--primary-text-color); }
    .settings-list { padding: 8px; }
    .setting-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 10px; }
    .setting-item:hover { background: var(--secondary-background-color); }
    .setting-name { font-weight: 500; color: var(--primary-text-color); }
    .setting-entity { font-size: 11px; color: var(--secondary-text-color); font-family: monospace; }
    .setting-value { font-size: 14px; color: var(--secondary-text-color); }
    .empty-state { text-align: center; padding: 48px; }
    .empty-state ha-icon { --mdc-icon-size: 64px; color: var(--secondary-text-color); opacity: 0.3; margin-bottom: 16px; }
    .loading { display: flex; align-items: center; justify-content: center; padding: 48px; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._loadDevices();
  }

  private async _loadDevices(): Promise<void> {
    this._loading = true;
    try {
      const result = await this.hass.callWS<{ devices: SmartHomeShopDevice[] }>({ type: 'smarthomeshop/devices' });
      this._devices = result.devices.filter(d => d.product_type?.includes('sensor'));
      if (this._devices.length > 0) await this._selectDevice(this._devices[0]);
    } catch (err) { console.error('Failed to load devices:', err); }
    this._loading = false;
  }

  private async _selectDevice(device: SmartHomeShopDevice): Promise<void> {
    this._selectedDevice = device;
    this.dispatchEvent(new CustomEvent('device-select', { detail: { deviceId: device.id } }));
    try {
      const result = await this.hass.callWS<{ entities: DeviceEntity[] }>({ type: 'smarthomeshop/device/entities', device_id: device.id });
      this._entities = result.entities.filter(e => ['number', 'select', 'switch'].includes(e.domain));
    } catch (err) { console.error('Failed to load entities:', err); }
  }

  protected render() {
    if (this._loading) return html`<div class="page-header"><h1 class="page-title">Device Settings</h1></div><div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;

    return html`
      <div class="page-header">
        <h1 class="page-title">Device Settings</h1>
        <p class="page-subtitle">Configure your SmartHomeShop sensor settings</p>
      </div>
      <div class="settings-layout">
        <div class="panel">
          <h3 class="panel-title"><ha-icon icon="mdi:devices"></ha-icon>Select Device</h3>
          <div class="device-list">
            ${this._devices.map(device => html`
              <div class="device-item ${this._selectedDevice?.id === device.id ? 'selected' : ''}" @click=${() => this._selectDevice(device)}>
                <div class="device-icon"><ha-icon icon="mdi:radar"></ha-icon></div>
                <div class="device-info">
                  <div class="device-name">${device.name}</div>
                  <div class="device-type">${device.product_name}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
        <div class="settings-panel">
          ${this._selectedDevice ? html`
            <div class="settings-group">
              <div class="group-header">
                <div class="group-icon"><ha-icon icon="mdi:tune"></ha-icon></div>
                <span class="group-title">Settings</span>
              </div>
              <div class="settings-list">
                ${this._entities.slice(0, 10).map(entity => html`
                  <div class="setting-item">
                    <div>
                      <div class="setting-name">${entity.name}</div>
                      <div class="setting-entity">${entity.entity_id}</div>
                    </div>
                    <span class="setting-value">${entity.state || 'N/A'}</span>
                  </div>
                `)}
              </div>
            </div>
          ` : html`
            <div class="empty-state">
              <ha-icon icon="mdi:radar"></ha-icon>
              <h3>No device selected</h3>
              <p>Select a device from the list to configure its settings</p>
            </div>
          `}
        </div>
      </div>
    `;
  }
}
