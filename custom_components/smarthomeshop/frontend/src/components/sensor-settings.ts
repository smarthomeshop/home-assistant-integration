/**
import './zone-editor';
 * UltimateSensor Settings Modal
 * Configure mmWave radar settings, zones, and calibration
 */

import { LitElement, html, css, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';

interface SettingEntity {
  entityId: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  group: string;
}

interface ZoneConfig {
  id: number;
  beginX: number;
  endX: number;
  beginY: number;
  endY: number;
}

@customElement('smarthomeshop-sensor-settings')
export class SmartHomeShopSensorSettings extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property() public entityPrefix: string = '';
  @property() public deviceName: string = '';
  @property({ type: Boolean }) public isOpen: boolean = false;

  @state() private _settings: SettingEntity[] = [];
  @state() private _zones: ZoneConfig[] = [];
  @state() private _activeTab: 'mmwave' | 'zones' | 'calibration' = 'mmwave';
  @state() private _showZoneEditor: boolean = false;
  @state() private _loading: boolean = false;
  @state() private _saving: boolean = false;
  @state() private _pendingChanges: Map<string, number> = new Map();

  static styles = css`
    :host { display: block; }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: var(--card-background-color, #1c1c1c);
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .close-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px; height: 32px;
      border-radius: 50%;
      cursor: pointer;
    }

    .tabs {
      display: flex;
      gap: 4px;
      padding: 10px 16px;
      background: var(--secondary-background-color, #2a2a2a);
      border-bottom: 1px solid var(--divider-color, #333);
    }

    .tab {
      padding: 8px 14px;
      border-radius: 6px;
      background: transparent;
      border: none;
      color: var(--secondary-text-color);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tab:hover { background: var(--divider-color, #333); }
    .tab.active { background: var(--primary-color, #9c27b0); color: white; }
    .tab ha-icon { --mdc-icon-size: 16px; }

    .modal-content {
      padding: 16px;
      overflow-y: auto;
      max-height: calc(80vh - 180px);
    }

    .group-title {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--secondary-text-color);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: var(--secondary-background-color, #2a2a2a);
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .setting-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .setting-value {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
    }

    .number-control {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--card-background-color, #1c1c1c);
      border-radius: 6px;
      padding: 3px;
    }

    .number-btn {
      width: 28px; height: 28px;
      border: none;
      background: var(--primary-color, #9c27b0);
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1.1rem;
    }

    .number-btn:disabled { opacity: 0.3; }

    .number-input {
      width: 60px;
      text-align: center;
      border: none;
      background: transparent;
      color: var(--primary-text-color);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .number-unit {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      margin-left: 4px;
    }

    .zone-editor {
      background: var(--secondary-background-color, #2a2a2a);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .zone-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .zone-title {
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zone-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
    }

    .zone-badge.active { background: rgba(76,175,80,0.2); color: #4caf50; }
    .zone-badge.inactive { background: rgba(158,158,158,0.2); color: #9e9e9e; }

    .zone-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .zone-input-group label {
      display: block;
      font-size: 0.65rem;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }

    .zone-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid var(--divider-color, #333);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.85rem;
      box-sizing: border-box;
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-top: 1px solid var(--divider-color, #333);
      background: var(--secondary-background-color);
    }

    .changes-badge {
      font-size: 0.75rem;
      color: #ff9800;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }

    .btn-secondary {
      background: var(--divider-color, #333);
      color: var(--primary-text-color);
    }

    .btn-primary {
      background: var(--primary-color, #9c27b0);
      color: white;
      margin-left: 8px;
    }

    .btn-primary:disabled { opacity: 0.5; }

    .empty-state {
      text-align: center;
      padding: 30px;
      color: var(--secondary-text-color);
    }

    .save-zone-btn {
      padding: 4px 10px;
      font-size: 0.7rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `;

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has('isOpen') && this.isOpen) {
      this._loadSettings();
    }
  }

  private _loadSettings(): void {
    if (!this.hass || !this.entityPrefix) return;
    this._loading = true;

    const settings: SettingEntity[] = [];
    const prefix = this.entityPrefix;

    // mmWave settings
    const mmwave = [
      { suffix: 'max_distance', name: 'Max Afstand', unit: 'mm', min: 100, max: 6000, step: 100 },
    ];

    mmwave.forEach(s => {
      const entityId = `number.${prefix}_${s.suffix}`;
      const state = this.hass!.states[entityId];
      if (state && state.state !== 'unavailable') {
        settings.push({
          entityId, name: s.name, value: parseFloat(state.state),
          min: s.min, max: s.max, step: s.step, unit: s.unit, group: 'mmwave'
        });
      }
    });

    // Calibration
    const calib = [
      { suffix: 'temperature_offset', name: 'Temp Offset', unit: '°C', min: -10, max: 10, step: 0.1 },
      { suffix: 'humidity_offset', name: 'Humidity Offset', unit: '%', min: -20, max: 20, step: 1 },
    ];

    calib.forEach(s => {
      const entityId = `number.${prefix}_${s.suffix}`;
      const state = this.hass!.states[entityId];
      if (state && state.state !== 'unavailable') {
        settings.push({
          entityId, name: s.name, value: parseFloat(state.state),
          min: s.min, max: s.max, step: s.step, unit: s.unit, group: 'calibration'
        });
      }
    });

    // Zones
    const zones: ZoneConfig[] = [];
    for (let i = 1; i <= 4; i++) {
      zones.push({
        id: i,
        beginX: this._getNum(`zone_${i}_begin_x`),
        endX: this._getNum(`zone_${i}_end_x`),
        beginY: this._getNum(`zone_${i}_begin_y`),
        endY: this._getNum(`zone_${i}_end_y`),
      });
    }

    this._settings = settings;
    this._zones = zones;
    this._loading = false;
  }

  private _getNum(suffix: string): number {
    const entityId = `number.${this.entityPrefix}_${suffix}`;
    const state = this.hass?.states[entityId]?.state;
    return state && state !== 'unavailable' ? parseFloat(state) : 0;
  }

  private _handleChange(entityId: string, value: number): void {
    this._pendingChanges.set(entityId, value);
    this.requestUpdate();
  }

  private async _saveChanges(): Promise<void> {
    if (!this.hass || this._pendingChanges.size === 0) return;
    this._saving = true;

    try {
      for (const [entityId, value] of this._pendingChanges) {
        await this.hass.callService('number', 'set_value', { entity_id: entityId, value });
      }
      this._pendingChanges.clear();
      setTimeout(() => this._loadSettings(), 500);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      this._saving = false;
    }
  }

  private async _saveZone(zone: ZoneConfig): Promise<void> {
    if (!this.hass) return;
    this._saving = true;

    try {
      const prefix = this.entityPrefix;
      await Promise.all([
        this.hass.callService('number', 'set_value', { entity_id: `number.${prefix}_zone_${zone.id}_begin_x`, value: zone.beginX }),
        this.hass.callService('number', 'set_value', { entity_id: `number.${prefix}_zone_${zone.id}_end_x`, value: zone.endX }),
        this.hass.callService('number', 'set_value', { entity_id: `number.${prefix}_zone_${zone.id}_begin_y`, value: zone.beginY }),
        this.hass.callService('number', 'set_value', { entity_id: `number.${prefix}_zone_${zone.id}_end_y`, value: zone.endY }),
      ]);
    } catch (e) {
      console.error('Zone save failed:', e);
    } finally {
      this._saving = false;
    }
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent('close'));
  }

  private _renderSetting(s: SettingEntity) {
    const val = this._pendingChanges.has(s.entityId) ? this._pendingChanges.get(s.entityId)! : s.value;
    return html`
      <div class="setting-item">
        <div>
          <div class="setting-name">${s.name}</div>
          <div class="setting-value">${s.value}${s.unit ? ' ' + s.unit : ''}</div>
        </div>
        <div class="number-control">
          <button class="number-btn" @click=${() => this._handleChange(s.entityId, Math.max(s.min, val - s.step))} ?disabled=${val <= s.min}>−</button>
          <input class="number-input" type="number" .value=${val.toString()} @change=${(e: Event) => this._handleChange(s.entityId, parseFloat((e.target as HTMLInputElement).value))} />
          <button class="number-btn" @click=${() => this._handleChange(s.entityId, Math.min(s.max, val + s.step))} ?disabled=${val >= s.max}>+</button>
          ${s.unit ? html`<span class="number-unit">${s.unit}</span>` : nothing}
        </div>
      </div>
    `;
  }

  private _renderZone(z: ZoneConfig) {
    const active = z.beginX !== 0 || z.endX !== 0 || z.beginY !== 0 || z.endY !== 0;
    return html`
      <div class="zone-editor">
        <div class="zone-header">
          <div class="zone-title">
            <ha-icon icon="mdi:vector-square"></ha-icon>
            Zone ${z.id}
            <span class="zone-badge ${active ? 'active' : 'inactive'}">${active ? 'Actief' : 'Leeg'}</span>
          </div>
          <button class="save-zone-btn" @click=${() => this._saveZone(z)} ?disabled=${this._saving}>Opslaan</button>
        </div>
        <div class="zone-grid">
          <div class="zone-input-group">
            <label>Begin X (mm)</label>
            <input class="zone-input" type="number" .value=${z.beginX.toString()} @change=${(e: Event) => { z.beginX = parseFloat((e.target as HTMLInputElement).value); this.requestUpdate(); }} />
          </div>
          <div class="zone-input-group">
            <label>Eind X (mm)</label>
            <input class="zone-input" type="number" .value=${z.endX.toString()} @change=${(e: Event) => { z.endX = parseFloat((e.target as HTMLInputElement).value); this.requestUpdate(); }} />
          </div>
          <div class="zone-input-group">
            <label>Begin Y (mm)</label>
            <input class="zone-input" type="number" .value=${z.beginY.toString()} @change=${(e: Event) => { z.beginY = parseFloat((e.target as HTMLInputElement).value); this.requestUpdate(); }} />
          </div>
          <div class="zone-input-group">
            <label>Eind Y (mm)</label>
            <input class="zone-input" type="number" .value=${z.endY.toString()} @change=${(e: Event) => { z.endY = parseFloat((e.target as HTMLInputElement).value); this.requestUpdate(); }} />
          </div>
        </div>
      </div>
    `;
  }

  protected render() {
    if (!this.isOpen) return nothing;

    const mmwave = this._settings.filter(s => s.group === 'mmwave');
    const calib = this._settings.filter(s => s.group === 'calibration');

    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <ha-icon icon="mdi:cog"></ha-icon>
              ${this.deviceName || 'Sensor'} Instellingen
            </div>
            <button class="close-btn" @click=${this._close}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>

          <div class="tabs">
            <button class="tab ${this._activeTab === 'mmwave' ? 'active' : ''}" @click=${() => this._activeTab = 'mmwave'}>
              <ha-icon icon="mdi:radar"></ha-icon> mmWave
            </button>
            <button class="tab ${this._activeTab === 'zones' ? 'active' : ''}" @click=${() => this._activeTab = 'zones'}>
              <ha-icon icon="mdi:vector-square"></ha-icon> Zones
            </button>
            <button class="tab ${this._activeTab === 'calibration' ? 'active' : ''}" @click=${() => this._activeTab = 'calibration'}>
              <ha-icon icon="mdi:tune"></ha-icon> Calibratie
            </button>
          </div>

          <div class="modal-content">
            ${this._activeTab === 'mmwave' ? html`
              ${mmwave.length > 0 ? html`
                <div class="group-title"><ha-icon icon="mdi:radar"></ha-icon> Radar Instellingen</div>
                ${mmwave.map(s => this._renderSetting(s))}
              ` : html`<div class="empty-state">Geen mmWave instellingen gevonden</div>`}
            ` : nothing}

            ${this._activeTab === 'zones' ? html`
              <div class="group-title"><ha-icon icon="mdi:vector-square"></ha-icon> Zone Configuratie</div>
              <button class="btn btn-primary" style="width: 100%; margin-bottom: 16px; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;" @click=${() => this._showZoneEditor = true}>
                <ha-icon icon="mdi:pencil-ruler"></ha-icon> Open Visuele Editor
              </button>
              ${this._zones.map(z => this._renderZone(z))}
            ` : nothing}

            ${this._activeTab === 'calibration' ? html`
              ${calib.length > 0 ? html`
                <div class="group-title"><ha-icon icon="mdi:tune"></ha-icon> Sensor Calibratie</div>
                ${calib.map(s => this._renderSetting(s))}
              ` : html`<div class="empty-state">Geen calibratie instellingen gevonden</div>`}
            ` : nothing}
          </div>

          <div class="modal-footer">
            <div class="changes-badge">
              ${this._pendingChanges.size > 0 ? html`<ha-icon icon="mdi:alert-circle"></ha-icon> ${this._pendingChanges.size} wijzigingen` : nothing}
            </div>
            <div>
              <button class="btn btn-secondary" @click=${this._close}>Sluiten</button>
              <button class="btn btn-primary" @click=${this._saveChanges} ?disabled=${this._pendingChanges.size === 0 || this._saving}>
                ${this._saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      </div>

        <smarthomeshop-zone-editor
          .hass=${this.hass}
          .entityPrefix=${this.entityPrefix}
          .deviceName=${this.deviceName}
          .isOpen=${this._showZoneEditor}
          @close=${() => { this._showZoneEditor = false; this._loadSettings(); }}
        ></smarthomeshop-zone-editor>
    `;
  }
}
