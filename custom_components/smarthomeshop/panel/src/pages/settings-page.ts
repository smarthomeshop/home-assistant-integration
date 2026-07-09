import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, SmartHomeShopDevice, DeviceEntity } from '../types';
import '../components/account-prices';

const ENERGY_PRODUCTS = ['waterp1meterkit', 'p1meterkit'];

interface SettingGroup {
  key: string;
  title: string;
  icon: string;
  match: RegExp;
}

// Ordered: first matching group wins
const GROUPS: SettingGroup[] = [
  {
    key: 'radar',
    title: 'Radar & Presence',
    icon: 'mdi:radar',
    match: /radar|presence|target|zone|polygon|entry|people|distance|mount|angle|occupancy|timeout|bluetooth|multi/i,
  },
  {
    key: 'voice',
    title: 'Voice Assistant',
    icon: 'mdi:microphone',
    match: /wake|assist|spraak|wekwoord|voice|speaker|volume|mute|sound|audio/i,
  },
  {
    key: 'air',
    title: 'Air Quality & Climate',
    icon: 'mdi:air-filter',
    match: /sps30|co2|voc|nox|pm|temperature|humidity|offset|calibrat|pressure|ambient/i,
  },
  {
    key: 'other',
    title: 'Other',
    icon: 'mdi:tune',
    match: /.*/,
  },
];

const COLLAPSE_THRESHOLD = 12;

@customElement('shs-settings-page')
export class SettingsPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public selectedDeviceId?: string;
  @property({ type: Boolean }) public embedded = false;
  @state() private _devices: SmartHomeShopDevice[] = [];
  @state() private _selectedDevice?: SmartHomeShopDevice;
  @state() private _entities: DeviceEntity[] = [];
  @state() private _loading = true;
  @state() private _filter = '';
  @state() private _expandedGroups: Set<string> = new Set();
  @state() private _configFields: any[] = [];
  @state() private _configValues: Record<string, any> = {};
  @state() private _productType = '';
  @state() private _savingConfig = false;
  @state() private _configSaved = false;
  @state() private _contractActive = false;
  @state() private _contractName: string | null = null;

  static styles = css`
    :host { display: block; max-width: 1100px; margin: 0 auto; --shs-primary: #4361ee; }
    .page-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .page-title { font-size: 16px; font-weight: 600; color: var(--primary-text-color); margin: 0; }
    .ha-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--shs-primary); text-decoration: none; }
    .ha-link:hover { text-decoration: underline; }
    .ha-link ha-icon { --mdc-icon-size: 14px; }
    .settings-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; align-items: start; }
    .panel { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 16px; }
    .panel-title { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; }
    .device-list { display: flex; flex-direction: column; gap: 8px; }
    .device-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--divider-color); border-radius: 10px; cursor: pointer; }
    .device-item:hover, .device-item.selected { border-color: var(--shs-primary); }
    .device-item.selected { box-shadow: inset 0 0 0 1px var(--shs-primary); }
    .device-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(67, 97, 238, 0.12); color: #4361ee; flex-shrink: 0; }
    .device-icon ha-icon { --mdc-icon-size: 20px; }
    .device-name { font-size: 14px; font-weight: 500; color: var(--primary-text-color); }
    .device-type { font-size: 12px; color: var(--secondary-text-color); }
    .search-box { width: 100%; box-sizing: border-box; padding: 10px 12px; margin-bottom: 16px; border: 1px solid var(--divider-color); border-radius: 10px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .search-box:focus { outline: none; border-color: var(--shs-primary); }
    .settings-group { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; margin-bottom: 16px; }
    .group-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--divider-color); }
    .group-header ha-icon { color: var(--shs-primary); --mdc-icon-size: 18px; }
    .group-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); flex: 1; }
    .group-count { font-size: 12px; color: var(--secondary-text-color); }
    .setting-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 16px; }
    .setting-item + .setting-item { border-top: 1px solid var(--divider-color); }
    .setting-item.unavailable { opacity: 0.45; }
    .setting-info { min-width: 0; }
    .setting-name { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color); }
    .setting-entity { font-size: 11px; color: var(--secondary-text-color); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .setting-control { flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
    .setting-control select, .setting-control input[type="number"] {
      padding: 6px 10px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-family: inherit;
    }
    .setting-control input[type="number"] { width: 90px; text-align: right; }
    .setting-control select:focus, .setting-control input:focus { outline: none; border-color: var(--shs-primary); }
    .unit { font-size: 12px; color: var(--secondary-text-color); }
    .toggle { position: relative; width: 40px; height: 22px; border-radius: 11px; background: var(--divider-color); border: none; cursor: pointer; transition: background 0.15s ease; padding: 0; }
    .toggle.on { background: var(--shs-primary); }
    .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: transform 0.15s ease; }
    .toggle.on::after { transform: translateX(18px); }
    .press-btn { padding: 6px 14px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--shs-primary); font-size: 13px; font-family: inherit; cursor: pointer; }
    .press-btn:hover { border-color: var(--shs-primary); }
    .show-all { display: block; width: 100%; padding: 10px; border: none; border-top: 1px solid var(--divider-color); background: none; color: var(--shs-primary); font-size: 13px; font-family: inherit; cursor: pointer; }
    .show-all:hover { background: var(--secondary-background-color); }
    .empty-state { text-align: center; padding: 48px 24px; border: 1px dashed var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); }
    .empty-state ha-icon { --mdc-icon-size: 40px; color: var(--secondary-text-color); margin-bottom: 12px; }
    .empty-state h3 { font-size: 16px; color: var(--primary-text-color); margin: 0 0 8px 0; }
    .empty-state p { font-size: 13.5px; color: var(--secondary-text-color); margin: 0; }
    .loading { display: flex; align-items: center; justify-content: center; padding: 48px; }
    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
    }

    /* Product settings (config entry options) */
    .cfg-card { margin-bottom: 20px; }
    .cfg-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; }
    .cfg-row + .cfg-row { border-top: 1px solid var(--divider-color); }
    .cfg-info { min-width: 0; }
    .cfg-label { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color); }
    .cfg-help { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 2px; line-height: 1.4; }
    .cfg-note { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; font-size: 12.5px; line-height: 1.5; color: var(--secondary-text-color); background: var(--shs-primary-10, rgba(3, 169, 244, 0.08)); border-bottom: 1px solid var(--divider-color); }
    .cfg-note ha-icon { --mdc-icon-size: 18px; color: var(--shs-primary); flex-shrink: 0; margin-top: 1px; }
    .cfg-note strong { color: var(--primary-text-color); }
    .cfg-control { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .cfg-control input, .cfg-control select {
      padding: 7px 10px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-family: inherit;
    }
    .cfg-control input[type="number"] { width: 90px; text-align: right; }
    .cfg-control input:focus, .cfg-control select:focus { outline: none; border-color: var(--shs-primary); }
    .cfg-unit { font-size: 12px; color: var(--secondary-text-color); min-width: 34px; }
    .cfg-foot { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--divider-color); }
    .cfg-saved { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: #22c55e; }
    .cfg-saved ha-icon { --mdc-icon-size: 15px; }
    .cfg-save { padding: 9px 18px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .cfg-save:disabled { opacity: 0.5; cursor: default; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    if (this.embedded && this.selectedDeviceId) {
      this._loadEmbedded();
    } else {
      this._loadDevices();
    }
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

  private async _loadEmbedded(): Promise<void> {
    this._loading = true;
    this._selectedDevice = { id: this.selectedDeviceId!, name: '', entity_count: 0 };
    await this._loadEntities(this.selectedDeviceId!);
    this._loading = false;
  }

  private async _selectDevice(device: SmartHomeShopDevice): Promise<void> {
    this._selectedDevice = device;
    this._expandedGroups = new Set();
    this.dispatchEvent(new CustomEvent('device-select', { detail: { deviceId: device.id } }));
    await this._loadEntities(device.id);
  }

  private async _loadEntities(deviceId: string): Promise<void> {
    try {
      const result = await this.hass.callWS<{ entities: DeviceEntity[] }>({ type: 'smarthomeshop/device/entities', device_id: deviceId });
      this._entities = result.entities.filter(e => ['number', 'select', 'switch', 'button'].includes(e.domain));
    } catch (err) { console.error('Failed to load entities:', err); }
    await this._loadConfig(deviceId);
  }

  private async _loadConfig(deviceId: string): Promise<void> {
    try {
      const res = await this.hass.callWS<{ fields: any[]; product_type?: string; contract_active?: boolean; contract_name?: string | null }>({ type: 'smarthomeshop/device/config', device_id: deviceId });
      this._configFields = res.fields || [];
      this._productType = res.product_type || '';
      this._contractActive = !!res.contract_active;
      this._contractName = res.contract_name || null;
      const values: Record<string, any> = {};
      for (const f of this._configFields) values[f.key] = f.value;
      this._configValues = values;
    } catch (err) {
      console.error('Failed to load config:', err);
      this._configFields = [];
    }
  }

  private async _saveConfig(): Promise<void> {
    if (!this._selectedDevice || this._savingConfig) return;
    this._savingConfig = true;
    this._configSaved = false;
    try {
      await this.hass.callWS({
        type: 'smarthomeshop/device/config/set',
        device_id: this._selectedDevice.id,
        values: this._configValues,
      });
      this._configSaved = true;
      window.setTimeout(() => { this._configSaved = false; }, 2500);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
    this._savingConfig = false;
  }

  private _inputBooleanOptions(): Array<{ value: string; label: string }> {
    const out = [{ value: '', label: 'None' }];
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      if (!entityId.startsWith('input_boolean.')) continue;
      out.push({ value: entityId, label: (st.attributes?.friendly_name as string) || entityId });
    }
    return out;
  }

  private _renderConfigField(f: any) {
    const val = this._configValues[f.key];
    const set = (v: any) => { this._configValues = { ...this._configValues, [f.key]: v }; };
    let control;
    if (f.type === 'number') {
      control = html`
        <input type="number" .value=${val ?? ''} min=${f.min ?? nothing} max=${f.max ?? nothing} step=${f.step ?? nothing}
          @input=${(e: Event) => set(parseFloat((e.target as HTMLInputElement).value))} />
        ${f.unit ? html`<span class="cfg-unit">${f.unit}</span>` : nothing}`;
    } else if (f.type === 'time') {
      control = html`<input type="time" .value=${val ?? ''} @input=${(e: Event) => set((e.target as HTMLInputElement).value)} />`;
    } else if (f.type === 'entity') {
      control = html`
        <select @change=${(e: Event) => set((e.target as HTMLSelectElement).value)}>
          ${this._inputBooleanOptions().map(o => html`<option value=${o.value} ?selected=${o.value === (val || '')}>${o.label}</option>`)}
        </select>`;
    } else {
      control = html`<input type="text" .value=${val ?? ''} @input=${(e: Event) => set((e.target as HTMLInputElement).value)} />`;
    }
    return html`
      <div class="cfg-row">
        <div class="cfg-info">
          <div class="cfg-label">${f.label}</div>
          ${f.help ? html`<div class="cfg-help">${f.help}</div>` : nothing}
        </div>
        <div class="cfg-control">${control}</div>
      </div>`;
  }

  private _renderConfigCard() {
    if (this._configFields.length === 0) return nothing;
    const isAdmin = !!this.hass.user?.is_admin;
    // When a contract supplies a price it is the single source of truth, so
    // hide those fields (flagged "managed" by the backend) and explain why.
    const visibleFields = this._configFields.filter(f => !f.managed);
    const hidePrices = this._contractActive && visibleFields.length !== this._configFields.length;
    return html`
      <div class="settings-group cfg-card">
        <div class="group-header">
          <ha-icon icon="mdi:cog-outline"></ha-icon>
          <span class="group-title">Product settings</span>
        </div>
        ${hidePrices ? html`
          <div class="cfg-note">
            <ha-icon icon="mdi:file-document-check-outline"></ha-icon>
            <span>Prices come from your connected energy contract${this._contractName ? html` <strong>${this._contractName}</strong>` : nothing}. Change them in your SmartHomeShop account, or disconnect below to set prices manually.</span>
          </div>` : nothing}
        ${visibleFields.map(f => this._renderConfigField(f))}
        <div class="cfg-foot">
          ${this._configSaved ? html`<span class="cfg-saved"><ha-icon icon="mdi:check-circle"></ha-icon> Saved</span>` : nothing}
          <button class="cfg-save" ?disabled=${!isAdmin || this._savingConfig} @click=${this._saveConfig}>
            ${this._savingConfig ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>`;
  }

  private _groupEntities(): Map<string, DeviceEntity[]> {
    const filter = this._filter.trim().toLowerCase();
    const grouped = new Map<string, DeviceEntity[]>();
    for (const group of GROUPS) grouped.set(group.key, []);

    for (const entity of this._entities) {
      const haystack = `${entity.name} ${entity.entity_id}`;
      if (filter && !haystack.toLowerCase().includes(filter)) continue;
      const group = GROUPS.find(g => g.match.test(haystack))!;
      grouped.get(group.key)!.push(entity);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return grouped;
  }

  private _callService(domain: string, service: string, entityId: string, data: Record<string, unknown> = {}): void {
    this.hass.callService(domain, service, { entity_id: entityId, ...data });
  }

  private _renderControl(entity: DeviceEntity) {
    const stateObj = this.hass.states[entity.entity_id];
    const state = stateObj?.state;
    const attrs = (stateObj?.attributes || {}) as Record<string, unknown>;
    const unavailable = !stateObj || state === 'unavailable' || state === 'unknown';

    if (entity.domain === 'switch') {
      const isOn = state === 'on';
      return html`
        <button class="toggle ${isOn ? 'on' : ''}" ?disabled=${unavailable}
          @click=${() => this._callService('switch', isOn ? 'turn_off' : 'turn_on', entity.entity_id)}></button>
      `;
    }

    if (entity.domain === 'select') {
      const options = (attrs.options as string[]) || [];
      return html`
        <select ?disabled=${unavailable}
          @change=${(e: Event) => this._callService('select', 'select_option', entity.entity_id, { option: (e.target as HTMLSelectElement).value })}>
          ${options.map(opt => html`<option value=${opt} ?selected=${opt === state}>${opt}</option>`)}
        </select>
      `;
    }

    if (entity.domain === 'number') {
      const unit = attrs.unit_of_measurement as string | undefined;
      return html`
        <input type="number" .value=${unavailable ? '' : String(state)}
          min=${(attrs.min as number) ?? nothing} max=${(attrs.max as number) ?? nothing} step=${(attrs.step as number) ?? nothing}
          ?disabled=${unavailable}
          @change=${(e: Event) => {
            const value = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(value)) this._callService('number', 'set_value', entity.entity_id, { value });
          }}/>
        ${unit ? html`<span class="unit">${unit}</span>` : nothing}
      `;
    }

    if (entity.domain === 'button') {
      return html`
        <button class="press-btn" ?disabled=${unavailable}
          @click=${() => this._callService('button', 'press', entity.entity_id)}>Press</button>
      `;
    }

    return html`<span class="unit">${state ?? '-'}</span>`;
  }

  private _renderGroup(group: SettingGroup, entities: DeviceEntity[]) {
    if (entities.length === 0) return nothing;
    const expanded = this._expandedGroups.has(group.key) || this._filter.trim().length > 0;
    const visible = expanded ? entities : entities.slice(0, COLLAPSE_THRESHOLD);
    const hidden = entities.length - visible.length;

    return html`
      <div class="settings-group">
        <div class="group-header">
          <ha-icon icon=${group.icon}></ha-icon>
          <span class="group-title">${group.title}</span>
          <span class="group-count">${entities.length}</span>
        </div>
        ${visible.map(entity => {
          const stateObj = this.hass.states[entity.entity_id];
          const unavailable = !stateObj || stateObj.state === 'unavailable';
          return html`
            <div class="setting-item ${unavailable ? 'unavailable' : ''}">
              <div class="setting-info">
                <div class="setting-name">${entity.name}</div>
                <div class="setting-entity">${entity.entity_id}</div>
              </div>
              <div class="setting-control">${this._renderControl(entity)}</div>
            </div>
          `;
        })}
        ${hidden > 0 ? html`
          <button class="show-all" @click=${() => { this._expandedGroups = new Set([...this._expandedGroups, group.key]); }}>
            Show all (${hidden} more)
          </button>
        ` : nothing}
      </div>
    `;
  }

  protected render() {
    if (this._loading) {
      return html`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;
    }

    const grouped = this._selectedDevice ? this._groupEntities() : null;

    if (this.embedded) {
      return html`
        ${this._renderConfigCard()}
        ${ENERGY_PRODUCTS.includes(this._productType)
          ? html`<shs-account-prices .hass=${this.hass}></shs-account-prices>`
          : nothing}
        ${this._selectedDevice && grouped ? html`
          <input type="search" class="search-box" placeholder="Search settings..."
            .value=${this._filter}
            @input=${(e: Event) => this._filter = (e.target as HTMLInputElement).value} />
          ${GROUPS.map(group => this._renderGroup(group, grouped.get(group.key) || []))}
        ` : html`
          <div class="empty-state">
            <ha-icon icon="mdi:tune"></ha-icon>
            <h3>No settings found</h3>
            <p>This device does not expose any configurable entities.</p>
          </div>
        `}
      `;
    }

    return html`
      <div class="page-header">
        <h1 class="page-title">Device Settings</h1>
        ${this._selectedDevice ? html`
          <a class="ha-link" href="/config/devices/device/${this._selectedDevice.id}">
            Open in Home Assistant
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
        ` : nothing}
      </div>
      <div class="settings-layout">
        <div class="panel">
          <h3 class="panel-title">Devices</h3>
          <div class="device-list">
            ${this._devices.length === 0 ? html`
              <p class="device-type">No sensor devices found.</p>
            ` : this._devices.map(device => html`
              <div class="device-item ${this._selectedDevice?.id === device.id ? 'selected' : ''}" @click=${() => this._selectDevice(device)}>
                <div class="device-icon"><ha-icon icon="mdi:radar"></ha-icon></div>
                <div>
                  <div class="device-name">${device.name}</div>
                  <div class="device-type">${device.product_name}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
        <div>
          ${this._selectedDevice && grouped ? html`
            <input type="search" class="search-box" placeholder="Search settings..."
              .value=${this._filter}
              @input=${(e: Event) => this._filter = (e.target as HTMLInputElement).value} />
            ${GROUPS.map(group => this._renderGroup(group, grouped.get(group.key) || []))}
          ` : html`
            <div class="empty-state">
              <ha-icon icon="mdi:radar"></ha-icon>
              <h3>No device selected</h3>
              <p>Select a device on the left to configure its settings.</p>
            </div>
          `}
        </div>
      </div>
    `;
  }
}
