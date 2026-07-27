import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DeviceEntity, HomeAssistant } from '../types';

type EnergySource = Record<string, any> & { type: string };

interface EnergyPreferences {
  energy_sources: EnergySource[];
  device_consumption: Array<Record<string, any>>;
  device_consumption_water?: Array<Record<string, any>>;
}

interface SyncTarget {
  sources: EnergySource[];
  items: Array<{ label: string; entity?: string; optional?: boolean }>;
  missing: string[];
}

const EMPTY_PREFS: EnergyPreferences = {
  energy_sources: [],
  device_consumption: [],
  device_consumption_water: [],
};

@customElement('shs-ha-energy-sync')
export class HaEnergySync extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public deviceId = '';
  @property() public deviceName = '';
  @property({ attribute: false }) public deviceEntities: DeviceEntity[] = [];
  @property({ type: Boolean }) public compact = false;

  @state() private _prefs: EnergyPreferences = { ...EMPTY_PREFS };
  @state() private _loading = true;
  @state() private _busy = false;
  @state() private _reviewConflicts = false;
  @state() private _message = '';
  @state() private _error = '';

  static styles = css`
    :host { display: block; --sync-blue: var(--shs-blue, var(--shs-primary, #4361ee)); }
    .shell {
      overflow: hidden;
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color);
    }
    .head {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 18px;
      border-bottom: 1px solid var(--divider-color);
    }
    .head-icon {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 10px;
      color: var(--sync-blue);
      background: color-mix(in srgb, var(--sync-blue) 11%, var(--card-background-color));
    }
    .head-icon ha-icon { --mdc-icon-size: 21px; }
    .head-copy { flex: 1; min-width: 0; }
    .title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .title { color: var(--primary-text-color); font-size: 14.5px; font-weight: 700; }
    .sub { margin-top: 3px; color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.45; }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      color: var(--secondary-text-color);
      background: var(--secondary-background-color);
      font-size: 11px;
      font-weight: 650;
    }
    .status.good { color: #16864b; background: color-mix(in srgb, #22c55e 12%, var(--card-background-color)); }
    .status.warn { color: #a65a00; background: color-mix(in srgb, #f59e0b 13%, var(--card-background-color)); }
    .status ha-icon { --mdc-icon-size: 14px; }
    .body { padding: 16px 18px 18px; }
    .map { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 12px; align-items: stretch; }
    .side { min-width: 0; padding: 14px; border-radius: 10px; background: var(--secondary-background-color); }
    .side-kicker { color: var(--secondary-text-color); font-size: 10.5px; font-weight: 700; letter-spacing: .55px; text-transform: uppercase; }
    .side-title { margin-top: 5px; color: var(--primary-text-color); font-size: 13.5px; font-weight: 700; }
    .side-copy { margin-top: 4px; color: var(--secondary-text-color); font-size: 11.8px; line-height: 1.45; }
    .bridge { display: grid; place-items: center; color: var(--secondary-text-color); }
    .bridge ha-icon { --mdc-icon-size: 22px; }
    .rows { margin-top: 14px; border-top: 1px solid var(--divider-color); }
    .row { display: flex; align-items: center; gap: 10px; min-height: 38px; border-bottom: 1px solid var(--divider-color); font-size: 12.5px; }
    .row ha-icon { --mdc-icon-size: 17px; color: var(--sync-blue); }
    .row-label { flex: 1; min-width: 0; color: var(--primary-text-color); }
    .row-entity { max-width: 55%; overflow: hidden; color: var(--secondary-text-color); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    .row-state { display: inline-flex; align-items: center; gap: 4px; color: #16864b; font-size: 11.5px; }
    .row-state ha-icon { --mdc-icon-size: 14px; color: currentColor; }
    .notice {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      margin-top: 14px;
      padding: 11px 12px;
      border-radius: 9px;
      color: var(--secondary-text-color);
      background: color-mix(in srgb, #f59e0b 10%, var(--card-background-color));
      font-size: 12px;
      line-height: 1.45;
    }
    .notice.error { color: var(--error-color, #d32f2f); background: color-mix(in srgb, #ef4444 8%, var(--card-background-color)); }
    .notice.success { color: #16864b; background: color-mix(in srgb, #22c55e 9%, var(--card-background-color)); }
    .notice ha-icon { --mdc-icon-size: 17px; flex: 0 0 auto; margin-top: 1px; }
    .actions { display: flex; align-items: center; gap: 9px; margin-top: 16px; flex-wrap: wrap; }
    button, .link-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 38px;
      padding: 8px 14px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      background: transparent;
      color: var(--primary-text-color);
      font: 650 12.5px/1 inherit;
      text-decoration: none;
      cursor: pointer;
    }
    button.primary { border-color: var(--sync-blue); background: var(--sync-blue); color: #fff; }
    button.danger { border-color: color-mix(in srgb, #ef4444 45%, var(--divider-color)); color: var(--error-color, #d32f2f); }
    button:disabled { opacity: .5; cursor: default; }
    button:not(:disabled):hover, .link-btn:hover { border-color: var(--sync-blue); }
    button ha-icon, .link-btn ha-icon { --mdc-icon-size: 16px; }
    .loading { display: flex; align-items: center; gap: 10px; padding: 18px; color: var(--secondary-text-color); font-size: 12.5px; }
    .loading ha-circular-progress { width: 22px; height: 22px; }

    .shell.compact .head { border-bottom: 0; padding-bottom: 12px; }
    .shell.compact .body { padding-top: 0; }
    .compact-line { display: flex; align-items: center; gap: 12px; }
    .compact-copy { flex: 1; min-width: 0; color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.45; }

    @media (max-width: 680px) {
      .map { grid-template-columns: 1fr; }
      .bridge { transform: rotate(90deg); min-height: 20px; }
      .row { align-items: flex-start; padding: 9px 0; flex-wrap: wrap; }
      .row-entity { max-width: calc(100% - 28px); margin-left: 27px; }
      .compact-line { align-items: stretch; flex-direction: column; }
      button, .link-btn { min-height: 42px; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('deviceId') || changed.has('deviceEntities')) {
      this._load();
      if (
        changed.has('deviceEntities')
        && !this._target().missing.length
        && this._message.startsWith('SmartHomeShop setup completed.')
      ) {
        this._message = 'SmartHomeShop setup complete. The new energy sensors are ready.';
      }
    }
  }

  public async refresh(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    if (!this.hass || !this.deviceId) {
      this._loading = false;
      return;
    }
    this._loading = true;
    this._error = '';
    try {
      this._prefs = await this.hass.callWS<EnergyPreferences>({ type: 'energy/get_prefs' });
    } catch (err: any) {
      if (err?.code === 'not_found' || /no prefs/i.test(err?.message || '')) {
        this._prefs = { ...EMPTY_PREFS };
      } else {
        this._error = `Could not read HA Energy settings. ${err?.message || ''}`.trim();
      }
    }
    this._loading = false;
  }

  private _entity(...needles: string[]): string | undefined {
    const entities = this.deviceEntities || [];
    const wanted = needles.map(value => value.toLowerCase());
    return entities.find(entity => {
      const haystack = `${entity.entity_id} ${entity.name}`.toLowerCase();
      return wanted.some(needle => haystack.includes(needle));
    })?.entity_id;
  }

  private _priceEntity(key: 'electricity_price' | 'electricity_feed_in_price' | 'gas_price' | 'water_price'): string | undefined {
    const exact = `sensor.smarthomeshop_energy_prices_${key}`;
    const usable = (entityId: string): boolean => {
      const state = this.hass.states[entityId]?.state;
      return !!state && state !== 'unavailable' && state !== 'unknown';
    };
    if (usable(exact)) return exact;
    return Object.keys(this.hass.states).find(entityId =>
      entityId.startsWith('sensor.') && entityId.includes(`energy_prices_${key}`) && usable(entityId));
  }

  private _target(): SyncTarget {
    const imported = this._entity('grid_import_energy_cc', 'grid import energy (cc)');
    const exported = this._entity('grid_export_energy_cc', 'grid export energy (cc)');
    const importPower = this._entity('grid_import_power_cc', 'grid import power (cc)', '_power_consumed');
    const exportPower = this._entity('grid_export_power_cc', 'grid export power (cc)', '_power_produced');
    const gas = this._entity('_gas_consumed');
    const water = this._entity('_water_total_consumption');
    const importPrice = this._priceEntity('electricity_price');
    const exportPrice = this._priceEntity('electricity_feed_in_price');
    const gasPrice = this._priceEntity('gas_price');
    const waterPrice = this._priceEntity('water_price');
    const name = `SmartHomeShop - ${this.deviceName || 'P1 meter'}`;
    const sources: EnergySource[] = [];

    if (imported) {
      const grid: EnergySource = {
        type: 'grid',
        stat_energy_from: imported,
        stat_energy_to: exported || null,
        stat_cost: null,
        entity_energy_price: importPrice || null,
        number_energy_price: null,
        stat_compensation: null,
        entity_energy_price_export: exportPrice || null,
        number_energy_price_export: null,
        cost_adjustment_day: 0,
        name,
      };
      if (importPower && exportPower) {
        grid.power_config = {
          stat_rate_from: importPower,
          stat_rate_to: exportPower,
        };
      }
      sources.push(grid);
    }

    if (gas) {
      sources.push({
        type: 'gas',
        stat_energy_from: gas,
        stat_cost: null,
        entity_energy_price: gasPrice || null,
        number_energy_price: null,
        name,
      });
    }

    if (water) {
      sources.push({
        type: 'water',
        stat_energy_from: water,
        stat_cost: null,
        entity_energy_price: waterPrice || null,
        number_energy_price: null,
        name,
      });
    }

    const items = [
      { label: 'Electricity imported', entity: imported },
      { label: 'Electricity returned', entity: exported, optional: true },
      { label: 'Live grid power', entity: importPower && exportPower ? `${importPower} + ${exportPower}` : undefined, optional: true },
      { label: 'Contract import price', entity: importPrice, optional: true },
      { label: 'Contract feed-in price', entity: exportPrice, optional: true },
      { label: 'Gas', entity: gas, optional: true },
      { label: 'Water', entity: water, optional: true },
    ];
    const missing = imported ? [] : ['Combined grid import energy sensor'];
    return { sources, items, missing };
  }

  private _hasSmartHomeShopSetup(): boolean {
    return this.deviceEntities.some(entity => entity.platform === 'smarthomeshop');
  }

  private async _linkDevice(): Promise<void> {
    if (this._busy || !this.hass.user?.is_admin) return;
    this._busy = true;
    this._error = '';
    this._message = '';
    try {
      await this.hass.callWS({
        type: 'smarthomeshop/device/link',
        device_id: this.deviceId,
      });
      this._message = 'SmartHomeShop setup completed. Loading the new energy sensors...';
      await new Promise(resolve => window.setTimeout(resolve, 900));
      this.dispatchEvent(new CustomEvent('ha-energy-synced', {
        detail: { deviceLinked: true },
        bubbles: true,
        composed: true,
      }));
    } catch (err: any) {
      this._error = `Could not complete SmartHomeShop setup. ${err?.message || ''}`.trim();
    } finally {
      this._busy = false;
    }
  }

  private _sourceKey(source: EnergySource): string {
    if (source.type === 'grid') return String(source.stat_energy_from || '');
    return String(source.stat_energy_from || '');
  }

  private _sameTarget(existing: EnergySource, target: EnergySource): boolean {
    return existing.type === target.type && !!this._sourceKey(target)
      && this._sourceKey(existing) === this._sourceKey(target);
  }

  private _conflicts(target = this._target()): EnergySource[] {
    return target.sources.flatMap(source => {
      const sameType = this._prefs.energy_sources.filter(existing => existing.type === source.type);
      return sameType.some(existing => this._sameTarget(existing, source)) ? [] : sameType;
    });
  }

  private _isInSync(target = this._target()): boolean {
    if (!target.sources.length || target.missing.length) return false;
    return target.sources.every(source => {
      const existing = this._prefs.energy_sources.find(item => this._sameTarget(item, source));
      if (!existing) return false;
      const keys = source.type === 'grid'
        ? ['stat_energy_from', 'stat_energy_to', 'entity_energy_price', 'entity_energy_price_export', 'power_config']
        : ['stat_energy_from', 'entity_energy_price'];
      return keys.every(key => JSON.stringify(existing[key] ?? null) === JSON.stringify(source[key] ?? null));
    });
  }

  private _mergeToHa(replaceConflicts: boolean): EnergySource[] {
    const targets = this._target().sources;
    let result = [...(this._prefs.energy_sources || [])];
    for (const target of targets) {
      const exactIndex = result.findIndex(existing => this._sameTarget(existing, target));
      if (exactIndex >= 0) {
        result[exactIndex] = { ...result[exactIndex], ...target };
        continue;
      }
      if (replaceConflicts) result = result.filter(existing => existing.type !== target.type);
      result.push(target);
    }
    return result;
  }

  private async _syncToHa(replaceConflicts = false): Promise<void> {
    if (this._busy || !this.hass.user?.is_admin) return;
    const target = this._target();
    if (target.missing.length) {
      this._error = 'The combined P1 energy sensors are not available yet. Restart Home Assistant after updating the integration.';
      return;
    }
    const conflicts = this._conflicts(target);
    if (conflicts.length && !replaceConflicts) {
      this._reviewConflicts = true;
      this._message = '';
      return;
    }

    this._busy = true;
    this._error = '';
    this._message = '';
    try {
      const energy_sources = this._mergeToHa(replaceConflicts);
      this._prefs = await this.hass.callWS<EnergyPreferences>({
        type: 'energy/save_prefs',
        energy_sources,
      });
      await this.hass.callWS({
        type: 'smarthomeshop/energy_sources/set',
        config: { p1_device: this.deviceId },
      });
      this._reviewConflicts = false;
      this._message = 'HA Energy is now linked to this P1 meter. Existing solar, battery and device sources were kept.';
      this.dispatchEvent(new CustomEvent('ha-energy-synced', { bubbles: true, composed: true }));
    } catch (err: any) {
      this._error = `Could not update HA Energy. ${err?.message || ''}`.trim();
    }
    this._busy = false;
  }

  private async _syncFromHa(): Promise<void> {
    if (this._busy || !this.hass.user?.is_admin) return;
    this._busy = true;
    this._error = '';
    this._message = '';
    try {
      const current = await this.hass.callWS<{ sources: Record<string, any> }>({
        type: 'smarthomeshop/energy_sources',
      });
      const config: Record<string, any> = {
        ...(current.sources || {}),
        p1_device: this.deviceId,
      };
      const solar = this._prefs.energy_sources.find(source => source.type === 'solar');
      const battery = this._prefs.energy_sources.find(source => source.type === 'battery');
      if (solar?.stat_rate && this.hass.states[solar.stat_rate]) {
        config.solar_power = solar.stat_rate;
        config.solar_invert = false;
      }
      if (battery?.stat_rate && this.hass.states[battery.stat_rate]) {
        config.battery_power = battery.stat_rate;
        config.battery_invert = false;
      }
      if (battery?.stat_soc && this.hass.states[battery.stat_soc]) {
        config.battery_soc = battery.stat_soc;
      }
      await this.hass.callWS({
        type: 'smarthomeshop/energy_sources/set',
        config,
      });
      this._message = solar || battery
        ? 'Compatible P1, solar and battery mappings were imported from HA Energy. Your SmartHomeShop contract remains the price source.'
        : 'This P1 meter is now selected for Smart Energy. HA Energy has no compatible solar or battery power mappings to import.';
      this.dispatchEvent(new CustomEvent('ha-energy-synced', { bubbles: true, composed: true }));
    } catch (err: any) {
      this._error = `Could not import HA Energy settings. ${err?.message || ''}`.trim();
    }
    this._busy = false;
  }

  private _status(target = this._target()): { label: string; kind: string; icon: string } {
    if (target.missing.length && !this._hasSmartHomeShopSetup()) {
      return { label: 'SmartHomeShop setup required', kind: 'warn', icon: 'mdi:link-variant-plus' };
    }
    if (target.missing.length) return { label: 'Restart required', kind: 'warn', icon: 'mdi:restart-alert' };
    if (this._isInSync(target)) return { label: 'In sync', kind: 'good', icon: 'mdi:check-circle' };
    if (!this._prefs.energy_sources.length) return { label: 'Not configured', kind: '', icon: 'mdi:circle-outline' };
    if (this._conflicts(target).length) return { label: 'Review required', kind: 'warn', icon: 'mdi:alert-circle-outline' };
    return { label: 'Ready to sync', kind: '', icon: 'mdi:sync' };
  }

  protected render() {
    if (this._loading) {
      return html`<div class="shell"><div class="loading"><ha-circular-progress active></ha-circular-progress>Checking HA Energy...</div></div>`;
    }
    const target = this._target();
    const status = this._status(target);
    const inSync = this._isInSync(target);
    const conflicts = this._conflicts(target);
    const admin = !!this.hass.user?.is_admin;
    const setupRequired = !!target.missing.length && !this._hasSmartHomeShopSetup();

    if (this.compact) {
      return html`
        <div class="shell compact">
          <div class="head">
            <div class="head-icon"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></div>
            <div class="head-copy">
              <div class="title-row">
                <div class="title">Home Assistant Energy Dashboard</div>
                <span class="status ${status.kind}"><ha-icon icon=${status.icon}></ha-icon>${status.label}</span>
              </div>
              <div class="sub">Use this P1 meter for grid import, return, live power${this._entity('_gas_consumed') ? ', gas' : ''}${this._entity('_water_total_consumption') ? ' and water' : ''}.</div>
            </div>
          </div>
          <div class="body">
            <div class="compact-line">
              <div class="compact-copy">
                ${inSync
                  ? 'The Energy Dashboard already uses the recommended SmartHomeShop entities.'
                  : conflicts.length
                    ? 'HA Energy already has another meter. Review before replacing it.'
                    : 'SmartHomeShop chooses the correct cumulative sensors and keeps other Energy Dashboard sources.'}
              </div>
              ${inSync ? html`
                <a class="link-btn" href="/config/energy"><ha-icon icon="mdi:open-in-new"></ha-icon>Open HA Energy</a>
              ` : setupRequired ? html`
                <button class="primary" ?disabled=${!admin || this._busy}
                  @click=${this._linkDevice}>
                  <ha-icon icon="mdi:link-variant-plus"></ha-icon>
                  ${this._busy ? 'Completing setup...' : 'Complete SmartHomeShop setup'}
                </button>
              ` : html`
                <button class="primary" ?disabled=${!admin || this._busy || !!target.missing.length}
                  @click=${() => this._syncToHa(false)}>
                  <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
                  ${this._busy ? 'Setting up...' : conflicts.length ? 'Review setup' : 'Set up in HA Energy'}
                </button>
              `}
            </div>
            ${this._reviewConflicts ? html`
              <div class="notice"><ha-icon icon="mdi:alert-outline"></ha-icon>
                HA Energy already has ${conflicts.map(source => source.type).join(', ')} configured. Solar, battery and individual device sources will stay untouched.
              </div>
              <div class="actions">
                <button class="danger" ?disabled=${this._busy} @click=${() => this._syncToHa(true)}>Replace matching meter sources</button>
                <button @click=${() => { this._reviewConflicts = false; }}>Cancel</button>
              </div>
            ` : nothing}
            ${this._message ? html`<div class="notice success"><ha-icon icon="mdi:check-circle"></ha-icon>${this._message}</div>` : nothing}
            ${this._error ? html`<div class="notice error"><ha-icon icon="mdi:alert-circle"></ha-icon>${this._error}</div>` : nothing}
          </div>
        </div>
      `;
    }

    return html`
      <div class="shell">
        <div class="head">
          <div class="head-icon"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></div>
          <div class="head-copy">
            <div class="title-row">
              <div class="title">Home Assistant Energy Dashboard</div>
              <span class="status ${status.kind}"><ha-icon icon=${status.icon}></ha-icon>${status.label}</span>
            </div>
            <div class="sub">Keep HA Energy and Smart Energy aligned without overwriting unrelated solar, battery or device sources.</div>
          </div>
          <a class="link-btn" href="/config/energy"><ha-icon icon="mdi:open-in-new"></ha-icon>Open HA Energy</a>
        </div>
        <div class="body">
          <div class="map">
            <div class="side">
              <div class="side-kicker">SmartHomeShop</div>
              <div class="side-title">${this.deviceName || 'Selected P1 meter'}</div>
              <div class="side-copy">Recommended cumulative meters, live grid power and connected contract prices.</div>
            </div>
            <div class="bridge"><ha-icon icon="mdi:swap-horizontal"></ha-icon></div>
            <div class="side">
              <div class="side-kicker">Home Assistant</div>
              <div class="side-title">${this._prefs.energy_sources.length ? `${this._prefs.energy_sources.length} energy source${this._prefs.energy_sources.length === 1 ? '' : 's'}` : 'Energy Dashboard not configured'}</div>
              <div class="side-copy">The sync changes only compatible grid, gas and water sources. Other sources stay in place.</div>
            </div>
          </div>
          <div class="rows">
            ${target.items.filter(item => item.entity || !item.optional).map(item => html`
              <div class="row">
                <ha-icon icon=${item.entity ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}></ha-icon>
                <span class="row-label">${item.label}</span>
                <span class="row-entity" title=${item.entity || ''}>${item.entity || 'Not available'}</span>
                ${item.entity ? html`<span class="row-state"><ha-icon icon="mdi:check"></ha-icon>Ready</span>` : nothing}
              </div>
            `)}
          </div>
          ${this._reviewConflicts ? html`
            <div class="notice"><ha-icon icon="mdi:alert-outline"></ha-icon>
              HA Energy already has ${conflicts.map(source => source.type).join(', ')} configured.
              Replacing affects only those meter source types; solar, batteries and individual devices remain unchanged.
            </div>
          ` : nothing}
          ${target.missing.length ? html`
            <div class="notice">
              <ha-icon icon=${setupRequired ? 'mdi:link-variant-plus' : 'mdi:restart-alert'}></ha-icon>
              ${setupRequired
                ? 'This P1 meter is available through ESPHome, but its SmartHomeShop setup is missing. Complete setup to create the cumulative import and export sensors.'
                : 'Restart Home Assistant once to load the newly added cumulative import and export sensors needed by the Energy Dashboard.'}
            </div>
          ` : nothing}
          ${this._message ? html`<div class="notice success"><ha-icon icon="mdi:check-circle"></ha-icon>${this._message}</div>` : nothing}
          ${this._error ? html`<div class="notice error"><ha-icon icon="mdi:alert-circle"></ha-icon>${this._error}</div>` : nothing}
          <div class="actions">
            ${setupRequired ? html`
              <button class="primary" ?disabled=${!admin || this._busy}
                @click=${this._linkDevice}>
                <ha-icon icon="mdi:link-variant-plus"></ha-icon>
                ${this._busy ? 'Completing setup...' : 'Complete SmartHomeShop setup'}
              </button>
            ` : html`
              <button class="primary" ?disabled=${!admin || this._busy || !!target.missing.length || inSync}
                @click=${() => this._syncToHa(this._reviewConflicts)}>
                <ha-icon icon="mdi:arrow-right"></ha-icon>
                ${this._busy ? 'Syncing...' : inSync ? 'Already in sync' : this._reviewConflicts ? 'Replace and sync to HA Energy' : 'Sync to HA Energy'}
              </button>
            `}
            <button ?disabled=${!admin || this._busy || !this._prefs.energy_sources.length}
              @click=${this._syncFromHa}>
              <ha-icon icon="mdi:arrow-left"></ha-icon>
              Import compatible setup from HA
            </button>
            ${this._reviewConflicts ? html`
              <button @click=${() => { this._reviewConflicts = false; }}>Cancel review</button>
            ` : conflicts.length ? html`
              <button @click=${() => { this._reviewConflicts = true; }}>Review ${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'}</button>
            ` : nothing}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-ha-energy-sync': HaEnergySync;
  }
}
