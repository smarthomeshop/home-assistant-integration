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
  items: SyncItem[];
  missing: string[];
}

interface SyncItem {
  label: string;
  entity?: string;
  optional?: boolean;
  issue?: string;
}

interface PriceEntities {
  electricity_price?: string | null;
  feed_in_price?: string | null;
  gas_price?: string | null;
  water_price?: string | null;
}

type CompatibilityKind = 'energy' | 'gas' | 'water' | 'power' | 'price';

interface EntityCompatibility {
  compatible: boolean;
  ready: boolean;
  issue?: string;
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
  @state() private _priceEntities: PriceEntities = {};
  @state() private _lastImportedMappings: Array<{ label: string; entity: string }> = [];

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
    .row-state.warn { color: #a65a00; }
    .row-state.muted { color: var(--secondary-text-color); }
    .imported-map { margin-top: 14px; padding: 12px; border-radius: 9px; background: color-mix(in srgb, #22c55e 8%, var(--card-background-color)); }
    .imported-title { color: #16864b; font-size: 12px; font-weight: 700; }
    .imported-item { display: flex; gap: 8px; margin-top: 7px; color: var(--secondary-text-color); font-size: 11.5px; }
    .imported-item strong { min-width: 94px; color: var(--primary-text-color); }
    .imported-item span { min-width: 0; overflow-wrap: anywhere; }
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
    const [preferences, priceEntities] = await Promise.allSettled([
      this.hass.callWS<EnergyPreferences>({ type: 'energy/get_prefs' }),
      this.hass.callWS<{ entities: PriceEntities }>({ type: 'smarthomeshop/prices/entities' }),
    ]);
    if (preferences.status === 'fulfilled') {
      this._prefs = preferences.value;
    } else {
      const err = preferences.reason;
      if (err?.code === 'not_found' || /no prefs/i.test(err?.message || '')) {
        this._prefs = { ...EMPTY_PREFS };
      } else {
        this._error = `Could not read HA Energy settings. ${err?.message || ''}`.trim();
      }
    }
    this._priceEntities = priceEntities.status === 'fulfilled'
      ? priceEntities.value.entities || {}
      : {};
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

  private _entityBySuffix(...suffixes: string[]): string | undefined {
    for (const suffix of suffixes) {
      const wanted = suffix.toLowerCase();
      const match = (this.deviceEntities || []).find(
        entity => entity.entity_id.toLowerCase().endsWith(wanted),
      );
      if (match) return match.entity_id;
    }
    return undefined;
  }

  private _priceEntity(key: 'electricity_price' | 'electricity_feed_in_price' | 'gas_price' | 'water_price'): string | undefined {
    const resolvedKey = key === 'electricity_feed_in_price' ? 'feed_in_price' : key;
    const resolved = this._priceEntities[resolvedKey as keyof PriceEntities];
    const legacyAliases: Record<typeof key, string[]> = {
      electricity_price: [
        'sensor.smarthomeshop_energy_prices_electricity_import_price_now',
        'sensor.smarthomeshop_energy_prices_electricity_price',
      ],
      electricity_feed_in_price: [
        'sensor.smarthomeshop_energy_prices_electricity_feed_in_price',
      ],
      gas_price: ['sensor.smarthomeshop_energy_prices_gas_price'],
      water_price: ['sensor.smarthomeshop_energy_prices_water_price'],
    };
    const candidates = [resolved || '', ...legacyAliases[key]].filter(Boolean);
    return candidates.find(entityId => this._entityCompatibility(entityId, 'price').compatible);
  }

  private _entityCompatibility(entityId: string | undefined, kind: CompatibilityKind): EntityCompatibility {
    if (!entityId) return { compatible: false, ready: false, issue: 'Not available' };
    const state = this.hass.states[entityId];
    if (!state) return { compatible: false, ready: false, issue: 'Entity is not loaded' };

    const attributes = state.attributes || {};
    const stateClass = String(attributes.state_class || '').toLowerCase();
    const deviceClass = String(attributes.device_class || '').toLowerCase();
    const unit = String(attributes.unit_of_measurement || '');
    const available = state.state !== 'unknown' && state.state !== 'unavailable' && state.state !== '';
    const numeric = available && Number.isFinite(Number(state.state));

    if (kind === 'price') {
      if (!numeric) return { compatible: false, ready: false, issue: 'Price is not numeric' };
      return { compatible: true, ready: true };
    }
    if (kind === 'power') {
      const compatible = deviceClass === 'power' && /^(m?w|kw)$/i.test(unit);
      if (!compatible) return { compatible: false, ready: false, issue: 'Not a compatible power sensor' };
      return { compatible: true, ready: available, issue: available ? undefined : 'Unavailable now' };
    }

    const cumulative = stateClass === 'total' || stateClass === 'total_increasing';
    const classMatches = kind === 'energy'
      ? deviceClass === 'energy'
      : deviceClass === kind || (kind === 'water' && deviceClass === 'volume');
    if (!cumulative || !classMatches) {
      return { compatible: false, ready: false, issue: `Missing ${kind} total metadata` };
    }
    return { compatible: true, ready: available, issue: available ? undefined : 'Unavailable now' };
  }

  private _target(): SyncTarget {
    const importedCandidate = this._entityBySuffix('_grid_import_energy_cc', '_grid_import_energy');
    const exportedCandidate = this._entityBySuffix('_grid_export_energy_cc', '_grid_export_energy');
    const netPowerCandidate = this._entityBySuffix('_net_grid_power_cc', '_net_power_cc');
    const importPowerCandidate = this._entityBySuffix('_grid_import_power_cc', '_grid_import_power', '_power_consumed');
    const gasCandidate = this._entityBySuffix(
      '_gas_consumption_cc',
      '_gas_consumption',
      '_gas_consumed',
      '_gas_consumed_belgium',
    );
    const waterCandidate = this._entityBySuffix('_water_meter_total', '_water_total_consumption');
    const importedCheck = this._entityCompatibility(importedCandidate, 'energy');
    const exportedCheck = this._entityCompatibility(exportedCandidate, 'energy');
    const netPowerCheck = this._entityCompatibility(netPowerCandidate, 'power');
    const importPowerCheck = this._entityCompatibility(importPowerCandidate, 'power');
    const gasCheck = this._entityCompatibility(gasCandidate, 'gas');
    const waterCheck = this._entityCompatibility(waterCandidate, 'water');
    const imported = importedCheck.compatible && importedCheck.ready ? importedCandidate : undefined;
    // Return totals are optional. Never put an unknown/unavailable statistic in
    // HA Energy: installations without export would otherwise get a permanent
    // statistics warning for a source that can never produce a value.
    const exported = exportedCheck.compatible && exportedCheck.ready ? exportedCandidate : undefined;
    // Prefer the signed SmartHomeShop net-power sensor. Supplying separate
    // import/export power sensors makes HA create its own generated helper;
    // re-saving an older malformed setup can then produce recursively growing
    // entity IDs. A direct stat_rate is both simpler and stable.
    const netPower = netPowerCheck.compatible && netPowerCheck.ready ? netPowerCandidate : undefined;
    const importPower = importPowerCheck.compatible && importPowerCheck.ready ? importPowerCandidate : undefined;
    const gridPower = netPower || importPower;
    const gas = gasCheck.compatible && gasCheck.ready ? gasCandidate : undefined;
    const water = waterCheck.compatible && waterCheck.ready ? waterCandidate : undefined;
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
        entity_energy_price_export: exported ? exportPrice || null : null,
        number_energy_price_export: null,
        cost_adjustment_day: 0,
        name,
      };
      if (gridPower) {
        grid.power_config = {
          stat_rate: gridPower,
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

    const items: SyncItem[] = [
      { label: 'Electricity imported', entity: importedCandidate, issue: importedCheck.issue },
      {
        label: 'Electricity returned',
        entity: exportedCandidate,
        issue: exportedCheck.compatible && !exportedCheck.ready
          ? 'No return reading — omitted from HA Energy'
          : exportedCheck.issue,
        optional: true,
      },
      {
        label: 'Live grid power',
        entity: netPowerCandidate || importPowerCandidate,
        issue: netPowerCandidate
          ? netPowerCheck.issue
          : importPowerCheck.issue,
        optional: true,
      },
      { label: 'Contract import price', entity: importPrice, issue: this._entityCompatibility(importPrice, 'price').issue, optional: true },
      { label: 'Contract feed-in price', entity: exportPrice, issue: this._entityCompatibility(exportPrice, 'price').issue, optional: true },
      { label: 'Gas total', entity: gasCandidate, issue: gasCheck.issue, optional: true },
      { label: 'Contract gas price', entity: gasPrice, issue: this._entityCompatibility(gasPrice, 'price').issue, optional: true },
      { label: 'Water total', entity: waterCandidate, issue: waterCheck.issue, optional: true },
      { label: 'Contract water price', entity: waterPrice, issue: this._entityCompatibility(waterPrice, 'price').issue, optional: true },
    ];
    const missing = imported ? [] : [importedCheck.issue || 'Combined grid import energy sensor'];
    return { sources, items, missing };
  }

  private _hasSmartHomeShopSetup(): boolean {
    return this.deviceEntities.some(entity => entity.platform === 'smarthomeshop');
  }

  private _hasCombinedImportSensor(): boolean {
    return !!this._entityBySuffix('_grid_import_energy_cc', '_grid_import_energy');
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
        ? ['stat_energy_from', 'stat_energy_to', 'entity_energy_price', 'entity_energy_price_export']
        : ['stat_energy_from', 'entity_energy_price'];
      if (!keys.every(key => JSON.stringify(existing[key] ?? null) === JSON.stringify(source[key] ?? null))) {
        return false;
      }
      if (source.type === 'grid' && source.power_config) {
        if (JSON.stringify(existing.power_config ?? null) !== JSON.stringify(source.power_config)) return false;
        // HA persists the effective power sensor separately. Checking it here
        // makes a stale generated net-power helper repairable with one sync.
        if (source.power_config.stat_rate && existing.stat_rate !== source.power_config.stat_rate) return false;
      }
      return true;
    });
  }

  private _mergeToHa(replaceConflicts: boolean): EnergySource[] {
    const targets = this._target().sources;
    let result = [...(this._prefs.energy_sources || [])];
    for (const target of targets) {
      const exactIndex = result.findIndex(existing => this._sameTarget(existing, target));
      if (exactIndex >= 0) {
        const merged = { ...result[exactIndex], ...target };
        if (target.power_config) {
          // The Energy backend derives stat_rate from power_config. Do not send
          // a stale generated helper from an earlier configuration back into
          // the next save operation.
          delete merged.stat_rate;
        }
        result[exactIndex] = merged;
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
      };
      const solar = this._prefs.energy_sources.find(source => source.type === 'solar');
      const battery = this._prefs.energy_sources.find(source => source.type === 'battery');
      const imported: Array<{ label: string; entity: string }> = [];
      const haP1 = this._p1DeviceFromHaEnergy();
      if (haP1) {
        config.p1_device = haP1.deviceId;
        imported.push({ label: 'P1 meter', entity: haP1.entity });
      } else if (!config.p1_device) {
        config.p1_device = this.deviceId;
      }
      if (solar?.stat_rate && this._entityCompatibility(solar.stat_rate, 'power').compatible) {
        config.solar_power = solar.stat_rate;
        config.solar_invert = false;
        imported.push({ label: 'Solar power', entity: solar.stat_rate });
      }
      if (battery?.stat_rate && this._entityCompatibility(battery.stat_rate, 'power').compatible) {
        config.battery_power = battery.stat_rate;
        config.battery_invert = false;
        imported.push({ label: 'Battery power', entity: battery.stat_rate });
      }
      if (battery?.stat_soc && this.hass.states[battery.stat_soc]) {
        config.battery_soc = battery.stat_soc;
        imported.push({ label: 'Battery state of charge', entity: battery.stat_soc });
      }
      await this.hass.callWS({
        type: 'smarthomeshop/energy_sources/set',
        config,
      });
      this._lastImportedMappings = imported;
      this._message = imported.length
        ? `${imported.length} compatible ${imported.length === 1 ? 'mapping was' : 'mappings were'} imported into Smart Energy. Contract prices continue to come from SmartHomeShop.`
        : 'HA Energy does not expose compatible P1, live solar or battery mappings to import. Nothing was changed.';
      this.dispatchEvent(new CustomEvent('ha-energy-synced', {
        detail: { importedMappings: imported, p1Device: haP1?.deviceId },
        bubbles: true,
        composed: true,
      }));
    } catch (err: any) {
      this._error = `Could not import HA Energy settings. ${err?.message || ''}`.trim();
    }
    this._busy = false;
  }

  private _p1DeviceFromHaEnergy(): { deviceId: string; entity: string } | undefined {
    const references: string[] = [];
    for (const source of this._prefs.energy_sources || []) {
      if (!['grid', 'gas', 'water'].includes(source.type)) continue;
      for (const key of ['stat_energy_from', 'stat_energy_to']) {
        if (typeof source[key] === 'string') references.push(source[key]);
      }
      for (const key of ['stat_rate_from', 'stat_rate_to']) {
        if (typeof source.power_config?.[key] === 'string') references.push(source.power_config[key]);
      }
    }

    const registryEntities = Object.values(this.hass.entities || {});
    for (const entityId of references) {
      const deviceId = this.hass.entities?.[entityId]?.device_id;
      if (!deviceId) continue;
      const linkedP1 = registryEntities.some(entity =>
        entity.device_id === deviceId
        && entity.platform === 'smarthomeshop'
        && /_grid_import_energy(?:_cc)?$/.test(entity.entity_id));
      if (linkedP1) return { deviceId, entity: entityId };
    }

    const selectedIds = new Set((this.deviceEntities || []).map(entity => entity.entity_id));
    const selectedReference = references.find(entityId => selectedIds.has(entityId));
    return selectedReference ? { deviceId: this.deviceId, entity: selectedReference } : undefined;
  }

  private _status(target = this._target()): { label: string; kind: string; icon: string } {
    if (target.missing.length && !this._hasSmartHomeShopSetup()) {
      return { label: 'SmartHomeShop setup required', kind: 'warn', icon: 'mdi:link-variant-plus' };
    }
    if (target.missing.length) {
      return this._hasCombinedImportSensor()
        ? { label: 'Needs attention', kind: 'warn', icon: 'mdi:alert-circle-outline' }
        : { label: 'Restart required', kind: 'warn', icon: 'mdi:restart-alert' };
    }
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
    const restartRequired = !!target.missing.length && this._hasSmartHomeShopSetup() && !this._hasCombinedImportSensor();

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
              <div class="sub">Use this P1 meter for grid import, return, live power${this._entityBySuffix('_gas_consumption_cc', '_gas_consumed', '_gas_consumed_belgium') ? ', gas' : ''}${this._entityBySuffix('_water_meter_total', '_water_total_consumption') ? ' and water' : ''}.</div>
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
            ${target.items.map(item => html`
              <div class="row">
                <ha-icon icon=${item.entity && !item.issue
                  ? 'mdi:check-circle-outline'
                  : item.optional
                    ? 'mdi:minus-circle-outline'
                    : 'mdi:alert-outline'}></ha-icon>
                <span class="row-label">${item.label}</span>
                <span class="row-entity" title=${item.entity || ''}>${item.entity || 'Not available'}</span>
                ${item.entity && !item.issue
                  ? html`<span class="row-state"><ha-icon icon="mdi:check"></ha-icon>Ready</span>`
                  : item.entity && !item.optional
                    ? html`<span class="row-state warn"><ha-icon icon="mdi:alert-outline"></ha-icon>${item.issue || 'Needs attention'}</span>`
                    : html`<span class="row-state muted">${item.issue || 'Optional'}</span>`}
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
                : restartRequired
                  ? 'Restart Home Assistant once to load the newly added cumulative import, export and normalised gas sensors needed by the Energy Dashboard.'
                  : `The selected import sensor is not compatible with HA Energy: ${target.missing.join(', ')}.`}
            </div>
          ` : nothing}
          ${this._lastImportedMappings.length ? html`
            <div class="imported-map">
              <div class="imported-title">Imported into Smart Energy</div>
              ${this._lastImportedMappings.map(mapping => html`
                <div class="imported-item"><strong>${mapping.label}</strong><span>${mapping.entity}</span></div>
              `)}
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
              Import Smart Energy sources from HA
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
