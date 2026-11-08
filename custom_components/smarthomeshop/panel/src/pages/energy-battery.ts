import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';
import { panelText } from '../utils/panel-translations';

type ControlKind = 'switch' | 'number' | 'select';
type ExecutionMode = 'advice' | 'shadow' | 'automatic';

interface BatteryConfig {
  enabled?: boolean;
  automatic_control?: boolean;
  execution_mode?: ExecutionMode;
  control_kind?: ControlKind;
  control_entity?: string;
  charge_power?: number;
  max_discharge_power?: number;
  off_min?: number;
  charge_option?: string;
  idle_option?: string;
  discharge_option?: string;
  soc_sensor?: string;
  target_soc?: number;
  reserve_soc?: number;
  charge_hours?: number;
  capacity_kwh?: number;
  pv_forecast_sensor?: string;
  load_forecast_sensor?: string;
  charge_efficiency?: number;
  discharge_efficiency?: number;
  cycle_cost?: number;
  assumed_load_power?: number;
  grid_import_limit?: number;
  grid_export_limit?: number;
  minimum_confidence?: number;
  planning_hours?: number;
  grid_guard_enabled?: boolean;
  grid_power_sensor?: string;
  grid_safety_margin?: number;
  grid_data_max_age?: number;
  capacity_tariff_enabled?: boolean;
  capacity_tariff_top_n?: number;
  capacity_tariff_steps?: number[];
  capacity_tariff_target_kw?: number;
  learning_enabled?: boolean;
  learning_use_for_planning?: boolean;
}

interface BatteryPlan {
  status?: string;
  recommendation?: string;
  target_power_w?: number;
  target_soc?: number;
  expected_savings?: number;
  confidence?: number;
  reason?: string;
  uses_predicted_prices?: boolean;
  forecast_hours?: number;
  timeline?: Array<Record<string, unknown>>;
  execution_mode?: ExecutionMode;
  requested_power_w?: number;
  guard_status?: string;
  guard?: Record<string, any>;
  capacity_limit_w?: number;
  capacity_tariff?: Record<string, any>;
  learning_summary?: string;
  learning?: Record<string, any>;
}

interface EnergyJournalEntry {
  id?: string;
  timestamp?: string;
  kind?: string;
  mode?: string;
  status?: string;
  action?: string;
  target_power_w?: number;
  actual_power_w?: number;
  reason?: string;
}

const dom = (entityId: string): string => entityId.split('.')[0];
const BATT_ID = 'shs_batt';
const LEGACY_IDS = ['shs_batt_charge', 'shs_batt_discharge'];
const numOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function plannerAutomation(alias: string) {
  return {
    alias,
    description: 'Created with the SmartHomeShop.io battery planner',
    mode: 'restart',
    trigger: [
      { platform: 'time_pattern', minutes: '/5' },
      { platform: 'homeassistant', event: 'start' },
    ],
    condition: [],
    action: [{ service: 'smarthomeshop.apply_battery_recommendation' }],
  };
}

@customElement('shs-energy-battery')
export class EnergyBattery extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public deviceName = '';

  @state() private _pricesOk = false;
  @state() private _accountStatus = 'unconfigured';
  @state() private _loaded = false;
  @state() private _cfg: BatteryConfig = {};
  @state() private _plan: BatteryPlan = {};
  @state() private _modal = false;
  @state() private _busy = false;
  @state() private _error = '';
  @state() private _form: BatteryConfig = {};
  @state() private _sources: Record<string, any> = {};
  @state() private _journal: EnergyJournalEntry[] = [];

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; margin-top: 24px; }
    .head { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin: -4px 0 12px; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .card.unavailable { background: var(--secondary-background-color); border-style: dashed; }
    .card.unavailable .row-icon { background: color-mix(in srgb, var(--secondary-text-color) 12%, transparent); color: var(--secondary-text-color); }
    .card.unavailable .row-title { color: var(--secondary-text-color); }
    .requirement { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; color: var(--secondary-text-color); font-size: 11px; font-weight: 650; }
    .requirement ha-icon { --mdc-icon-size: 14px; }
    .row { display: flex; align-items: center; gap: 12px; }
    .row-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(16,185,129,.12); color: #10b981; flex-shrink: 0; }
    .row-icon.charge { background: rgba(67,97,238,.12); color: #4361ee; }
    .row-icon.discharge { background: rgba(245,158,11,.14); color: #d97706; }
    .row-main { flex: 1; min-width: 0; }
    .row-title { font-size: 14px; font-weight: 650; color: var(--primary-text-color); }
    .row-meta { font-size: 12px; color: var(--secondary-text-color); margin-top: 3px; line-height: 1.4; }
    .plan-stats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
    .chip { border-radius: 999px; padding: 4px 8px; background: var(--secondary-background-color); color: var(--secondary-text-color); font-size: 11px; font-weight: 600; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; padding: 8px 14px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .btn ha-icon { --mdc-icon-size: 15px; }
    .warn { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: 10px; padding: 12px 14px; margin: 12px 0 0; font-size: 13px; color: var(--primary-text-color); }
    .legacy-note { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 12px 14px; border: 1px solid rgba(245,158,11,.4); background: rgba(245,158,11,.08); border-radius: 10px; font-size: 12.5px; color: var(--primary-text-color); line-height: 1.45; }
    .legacy-note ha-icon { --mdc-icon-size: 18px; color: #b45309; flex: 0 0 auto; }
    .legacy-note > div { flex: 1; }
    .legacy-note .btn { padding: 7px 12px; font-size: 12px; }
    .note { border-left: 3px solid var(--shs-primary); background: color-mix(in srgb, var(--shs-primary) 8%, transparent); border-radius: 0 8px 8px 0; padding: 10px 12px; font-size: 12px; line-height: 1.45; color: var(--secondary-text-color); }
    .insights { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
    .insight { border: 1px solid var(--divider-color); border-radius: 9px; padding: 9px 10px; background: var(--secondary-background-color); }
    .insight-label { color: var(--secondary-text-color); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .45px; }
    .insight-value { color: var(--primary-text-color); font-size: 12.5px; font-weight: 650; margin-top: 4px; line-height: 1.35; }
    .journal { margin-top: 10px; border: 1px solid var(--divider-color); border-radius: 10px; overflow: hidden; }
    .journal-head { display: flex; align-items: center; justify-content: space-between; padding: 9px 11px; background: var(--secondary-background-color); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .45px; color: var(--secondary-text-color); }
    .journal-clear { border: 0; background: transparent; color: var(--shs-primary); font: inherit; cursor: pointer; text-transform: none; letter-spacing: 0; }
    .journal-row { display: grid; grid-template-columns: 74px minmax(90px, .7fr) minmax(0, 2fr); gap: 9px; padding: 9px 11px; border-top: 1px solid var(--divider-color); align-items: start; font-size: 11.5px; }
    .journal-time, .journal-reason { color: var(--secondary-text-color); }
    .journal-action { color: var(--primary-text-color); font-weight: 650; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 620px; max-height: 92vh; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); position: sticky; top: 0; z-index: 2; background: var(--card-background-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-subtitle { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 2px; }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-body { padding: 18px 20px; }
    .section { font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--secondary-text-color); margin: 22px 0 10px; }
    .section:first-child { margin-top: 0; }
    .field { margin-bottom: 14px; min-width: 0; }
    label.f { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); margin: 0 0 6px; }
    .locked { padding: 9px 12px; border: 1px dashed var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 13.5px; }
    .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    select, input[type='number'], input[type='text'] { width: 100%; box-sizing: border-box; min-height: 40px; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    ha-entity-picker { display: block; width: 100%; --mdc-theme-primary: var(--shs-primary); }
    select:focus, input:focus { outline: none; border-color: var(--shs-primary); }
    .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .three { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .toggle-row { display: flex; align-items: center; gap: 12px; border: 1px solid var(--divider-color); border-radius: 10px; padding: 12px; margin-bottom: 14px; }
    .toggle-copy { flex: 1; min-width: 0; }
    .toggle-title { color: var(--primary-text-color); font-size: 13px; font-weight: 650; }
    .modal-foot { display: flex; justify-content: space-between; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); position: sticky; bottom: 0; z-index: 2; background: var(--card-background-color); }
    .modal-foot .right { display: flex; gap: 10px; }
    @media (max-width: 600px) {
      .modal-backdrop { align-items: flex-end; padding: 0; }
      .modal { max-height: 94vh; border-radius: 16px 16px 0 0; }
      .two, .three { grid-template-columns: 1fr; gap: 0; }
      .insights { grid-template-columns: 1fr; }
      .journal-row { grid-template-columns: 64px minmax(75px, .6fr) minmax(0, 1.4fr); }
      .row { align-items: flex-start; flex-wrap: wrap; }
      .row-main { min-width: calc(100% - 54px); }
      .card .btn { margin-left: 50px; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  public refresh(): Promise<void> {
    return this._load();
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    try {
      const acc = await this.hass.callWS<{ status?: string }>({ type: 'smarthomeshop/account' });
      this._accountStatus = acc.status || 'unconfigured';
      this._pricesOk = this._accountStatus === 'ok';
      if (this._pricesOk) {
        const [battery, sources, plan, journal] = await Promise.all([
          this.hass.callWS<{ battery: BatteryConfig }>({ type: 'smarthomeshop/battery' }),
          this.hass.callWS<{ sources: Record<string, any> }>({ type: 'smarthomeshop/energy_sources' }),
          this.hass.callWS<{ plan: BatteryPlan }>({ type: 'smarthomeshop/battery/plan' }),
          this.hass.callWS<{ entries: EnergyJournalEntry[] }>({ type: 'smarthomeshop/energy/journal', limit: 20 }),
        ]);
        this._cfg = battery.battery || {};
        this._sources = sources.sources || {};
        this._plan = plan.plan || {};
        this._journal = journal.entries || [];
      }
    } catch (err) {
      console.error('energy-battery: load failed', err);
    }
    this._loaded = true;
  }

  private _openAccountSettings(): void {
    this.dispatchEvent(new CustomEvent('open-device-settings', {
      bubbles: true,
      composed: true,
    }));
  }

  private _accountMessage(): string {
    if (this._accountStatus === 'no_contract') {
      return 'Your API key works, but the selected location has no active energy contract, so there are no prices to plan against. Add or activate a contract in your SmartHomeShop account, or pick another location in Settings.';
    }
    if (['unauthorized', 'forbidden'].includes(this._accountStatus)) {
      return 'The saved SmartHomeShop.io API key is invalid or was revoked. Replace it to enable dynamic prices and battery planning.';
    }
    if (this._accountStatus === 'unconfigured') {
      return 'Enter your SmartHomeShop.io API key to enable dynamic prices, forecasts and home battery planning.';
    }
    return 'Dynamic price data is unavailable. Check the SmartHomeShop.io API key to enable home battery planning.';
  }

  // No contract is not a key problem, so the gate must not talk about keys.
  private _noContract(): boolean {
    return this._accountStatus === 'no_contract';
  }

  private _matchesEntity(
    entity: string | { entity_id?: string },
    domains: string[],
    kind?: 'battery' | 'energy' | 'power' | 'forecast',
  ): boolean {
    const entityId = typeof entity === 'string' ? entity : entity.entity_id || '';
    if (!domains.includes(dom(entityId))) return false;
    const state = this.hass.states[entityId];
    const deviceClass = String(state?.attributes?.device_class || '');
    const unit = String(state?.attributes?.unit_of_measurement || '');
    if (kind === 'battery') return deviceClass === 'battery' || unit === '%';
    if (kind === 'energy') return deviceClass === 'energy' || /^k?Wh$/i.test(unit);
    if (kind === 'power') return deviceClass === 'power' || /^(k|m)?W$/i.test(unit);
    if (kind === 'forecast') {
      return ['energy', 'power'].includes(deviceClass) || /^(k|m)?W(h)?$/i.test(unit);
    }
    return true;
  }

  private _selectOptions(entityId?: string): string[] {
    if (!entityId) return [];
    return (this.hass.states[entityId]?.attributes?.options as string[]) || [];
  }

  private _numberMin(entityId?: string): number {
    if (!entityId) return 0;
    const minimum = Number(this.hass.states[entityId]?.attributes?.min);
    return Number.isFinite(minimum) ? minimum : 0;
  }

  private _sourceCapacityKwh(): number | undefined {
    const entityId = this._sources?.battery_capacity_entity;
    if (entityId) {
      const state = this.hass.states?.[entityId];
      const value = Number(state?.state);
      const unit = String(state?.attributes?.unit_of_measurement || '').trim().toLowerCase();
      if (Number.isFinite(value) && value > 0) {
        if (unit === 'wh') return value / 1000;
        if (unit === 'kwh') return value;
        if (unit === 'mwh') return value * 1000;
      }
    }
    const fixed = Number(this._sources?.battery_capacity_kwh);
    return Number.isFinite(fixed) && fixed > 0 ? fixed : undefined;
  }

  private async _openModal(): Promise<void> {
    this._error = '';
    try {
      const response = await this.hass.callWS<{ sources: Record<string, any> }>({ type: 'smarthomeshop/energy_sources' });
      this._sources = response.sources || {};
    } catch { /* Keep the last source mapping. */ }
    const sources = this._sources || {};
    this._form = {
      enabled: true,
      automatic_control: false,
      execution_mode: 'advice',
      control_kind: 'switch',
      target_soc: 90,
      reserve_soc: 15,
      capacity_kwh: this._sourceCapacityKwh(),
      soc_sensor: sources.battery_soc || undefined,
      pv_forecast_sensor: sources.pv_forecast || undefined,
      charge_power: 3000,
      max_discharge_power: 3000,
      charge_efficiency: 0.95,
      discharge_efficiency: 0.95,
      cycle_cost: 0.03,
      assumed_load_power: 0,
      grid_import_limit: 0,
      grid_export_limit: 0,
      minimum_confidence: 0.55,
      planning_hours: 36,
      grid_guard_enabled: true,
      grid_safety_margin: 250,
      grid_data_max_age: 90,
      capacity_tariff_enabled: false,
      capacity_tariff_top_n: 3,
      capacity_tariff_steps: [2, 5, 10, 15, 20, 25, 50],
      capacity_tariff_target_kw: 5,
      learning_enabled: true,
      learning_use_for_planning: true,
      ...this._cfg,
    };
    if (!this._form.execution_mode) {
      this._form.execution_mode = this._form.automatic_control ? 'automatic' : 'advice';
    }
    this._form.automatic_control = this._form.execution_mode === 'automatic';
    // The Solar & battery mapping is the single source of truth for these:
    // when mapped there, it overrides whatever was saved here before.
    if (sources.battery_soc) this._form.soc_sensor = sources.battery_soc;
    const sourceCapacity = this._sourceCapacityKwh();
    if (sourceCapacity != null) this._form.capacity_kwh = sourceCapacity;
    if (sources.pv_forecast) this._form.pv_forecast_sensor = sources.pv_forecast;
    this._modal = true;
  }

  private _friendly(entityId?: string): string {
    if (!entityId) return '';
    return (this.hass.states[entityId]?.attributes?.friendly_name as string) || entityId;
  }

  private _set<K extends keyof BatteryConfig>(key: K, value: BatteryConfig[K]): void {
    this._form = { ...this._form, [key]: value };
  }

  private _setExecutionMode(mode: ExecutionMode): void {
    this._form = {
      ...this._form,
      execution_mode: mode,
      automatic_control: mode === 'automatic',
    };
  }

  private _setCapacitySteps(raw: string): void {
    const values = raw.split(',')
      .map(value => Number(value.trim()))
      .filter(value => Number.isFinite(value) && value > 0 && value <= 250);
    this._set('capacity_tariff_steps', [...new Set(values)].sort((a, b) => a - b));
  }

  private async _clearJournal(): Promise<void> {
    if (!this.hass.user?.is_admin) return;
    await this.hass.callWS({ type: 'smarthomeshop/energy/journal/clear' });
    this._journal = [];
  }

  private _journalTime(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(this.hass.language || 'en', {
      hour: '2-digit', minute: '2-digit',
    }).format(date);
  }

  private _learningSummary(): string {
    const use = this._plan.learning?.use || {};
    if (Object.keys(use).length) {
      return panelText(this.hass, 'Validated learned values are active within your configured limits.');
    }
    if (Number(this._plan.learning?.learned?.samples || 0) > 0) {
      return panelText(this.hass, 'Learning safely; more representative measurements are needed.');
    }
    return panelText(this.hass, 'Learning starts after the first local samples.');
  }

  private _translatedReason(value: string): string {
    return value.split('; ').map(part => panelText(this.hass, part)).join('; ');
  }

  private async _deleteAutomation(): Promise<void> {
    for (const id of [BATT_ID, ...LEGACY_IDS]) {
      try { await this.hass.callApi('DELETE', `config/automation/config/${id}`); } catch { /* Automation does not exist. */ }
    }
  }

  // The planner automation is the only caller of the apply service, so the
  // battery must be parked idle before that automation is deleted or pointed
  // at another entity: a grid-charge switch left on (or a select left on the
  // charge option, or a signed power number left at +charge) would otherwise
  // keep charging from the grid with nothing left to stop it. The service
  // reads the STORED config, so this must run before the new config is saved.
  private async _stopBatteryControl(): Promise<void> {
    const current = this._cfg;
    const automatic = current.execution_mode === 'automatic' || current.automatic_control;
    if (!current.enabled || !automatic || !current.control_entity) return;
    try {
      await this.hass.callService('smarthomeshop', 'apply_battery_recommendation', { action: 'hold' });
    } catch (err) {
      // The battery may already be idle or unavailable; that must not block
      // removing the planner.
      console.error('energy-battery: could not park the battery', err);
    }
  }

  // Battery automations created from the old device-page card would fight the
  // planner over the same control entity; surface them so they can be removed.
  private _legacyDeviceAutomations(): Array<{ entityId: string; name: string; configId: string }> {
    const out: Array<{ entityId: string; name: string; configId: string }> = [];
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      if (!entityId.startsWith('automation.')) continue;
      const configId = st.attributes?.id as string | undefined;
      if (configId && configId.includes('_battery_charge_cheap_hold_peak_')) {
        out.push({ entityId, name: (st.attributes?.friendly_name as string) || entityId, configId });
      }
    }
    return out;
  }

  private async _removeLegacyAutomation(configId: string): Promise<void> {
    if (!this.hass.user?.is_admin) return;
    try {
      await this.hass.callApi('DELETE', `config/automation/config/${configId}`);
      this.requestUpdate();
    } catch (err) { console.error('energy-battery: legacy cleanup failed', err); }
  }

  private async _save(): Promise<void> {
    if (this._busy) return;
    if (!this.hass.user?.is_admin) { this._error = 'Administrator required.'; return; }
    const form = {
      ...this._form,
      enabled: true,
      automatic_control: this._form.execution_mode === 'automatic',
    };
    const target = numOr(form.target_soc, NaN);
    const reserve = numOr(form.reserve_soc, NaN);
    if (!form.soc_sensor) { this._error = 'Select the battery state-of-charge sensor.'; return; }
    if (!(numOr(form.capacity_kwh, 0) > 0)) {
      this._error = this._sources?.battery_capacity_entity
        ? 'The selected battery capacity entity is unavailable. Set a fixed fallback under Energy settings.'
        : 'Enter the usable battery capacity.';
      return;
    }
    if (!(numOr(form.charge_power, 0) > 0) || !(numOr(form.max_discharge_power, 0) > 0)) {
      this._error = 'Set both maximum charge and discharge power.'; return;
    }
    if (!Number.isFinite(target) || target < 10 || target > 100) { this._error = 'Target SoC must be 10-100%.'; return; }
    if (!Number.isFinite(reserve) || reserve < 0 || reserve >= target) { this._error = 'Reserve SoC must be below the target.'; return; }
    if (form.execution_mode === 'automatic') {
      if (!form.control_entity) { this._error = 'Select a control entity before enabling automatic control.'; return; }
      if (form.control_kind === 'number' && this._numberMin(form.control_entity) > 0) {
        this._error = 'The selected power number cannot represent the safe idle value 0.'; return;
      }
      if (form.control_kind === 'select' && (!form.charge_option || !form.idle_option || !form.discharge_option)) {
        this._error = 'Select the charge, self-use and discharge options.'; return;
      }
    }

    this._busy = true;
    this._error = '';
    try {
      if (form.control_kind === 'number') form.off_min = this._numberMin(form.control_entity);
      else form.off_min = 0;
      const previous = this._cfg;
      if (previous.control_entity !== form.control_entity
        || previous.control_kind !== form.control_kind
        || form.execution_mode !== 'automatic') {
        await this._stopBatteryControl();
      }
      if (form.execution_mode === 'automatic') {
        await this.hass.callApi('POST', `config/automation/config/${BATT_ID}`, plannerAutomation(`${this.deviceName || 'Battery'} - Smart battery plan`));
        for (const id of LEGACY_IDS) {
          try { await this.hass.callApi('DELETE', `config/automation/config/${id}`); } catch { /* none */ }
        }
      } else {
        await this._deleteAutomation();
      }
      const saved = await this.hass.callWS<{ battery: BatteryConfig }>({ type: 'smarthomeshop/battery/set', config: form });
      this._cfg = saved.battery || form;
      const response = await this.hass.callWS<{ plan: BatteryPlan }>({ type: 'smarthomeshop/battery/plan' });
      this._plan = response.plan || {};
      const journal = await this.hass.callWS<{ entries: EnergyJournalEntry[] }>({ type: 'smarthomeshop/energy/journal', limit: 20 });
      this._journal = journal.entries || [];
      this._modal = false;
    } catch (err: any) {
      console.error('energy-battery: save failed', err);
      this._error = `Could not save. ${err?.message || ''}`;
    }
    this._busy = false;
  }

  private async _remove(): Promise<void> {
    if (!this.hass.user?.is_admin
      || !window.confirm(panelText(this.hass, 'Remove the battery planner and its automation?'))) return;
    try {
      await this._stopBatteryControl();
      await this.hass.callWS({ type: 'smarthomeshop/battery/set', config: {} });
      await this._deleteAutomation();
      this._cfg = {};
      this._plan = {};
      this._modal = false;
    } catch (err) {
      console.error('energy-battery: remove failed', err);
    }
  }

  private _hasUnavailableEntity(): boolean {
    return [this._cfg.control_entity, this._cfg.soc_sensor, this._cfg.pv_forecast_sensor, this._cfg.load_forecast_sensor]
      .some(entityId => entityId && (!this.hass.states[entityId] || ['unavailable', 'unknown'].includes(this.hass.states[entityId].state)));
  }

  private _planTitle(): string {
    if (!this._cfg.enabled) return 'Not set up yet';
    if (this._hasUnavailableEntity()) return 'A configured entity is unavailable';
    if (this._plan.status !== 'ready') return 'Planner needs more information';
    const action = this._plan.recommendation || 'hold';
    return `${action.charAt(0).toUpperCase()}${action.slice(1)} recommended`;
  }

  private _planIcon(): string {
    if (this._plan.recommendation === 'charge') return 'mdi:battery-arrow-up-outline';
    if (this._plan.recommendation === 'discharge') return 'mdi:battery-arrow-down-outline';
    return 'mdi:home-battery-outline';
  }

  private _renderNumber(key: keyof BatteryConfig, label: string, fallback: number, min: number, max: number, step: number, help = '') {
    const value = this._form[key] as number | undefined;
    return html`<div class="field">
      <label class="f">${panelText(this.hass, label)}</label>
      <input type="number" min=${min} max=${max} step=${step} .value=${String(value ?? fallback)}
        aria-label=${panelText(this.hass, label)}
        @input=${(event: Event) => this._set(key, parseFloat((event.target as HTMLInputElement).value) as never)} />
      ${help ? html`<div class="help">${panelText(this.hass, help)}</div>` : nothing}
    </div>`;
  }

  private _renderCapacityField() {
    const entityId = this._sources?.battery_capacity_entity;
    const fixed = Number(this._sources?.battery_capacity_kwh);
    const configured = Boolean(entityId) || (Number.isFinite(fixed) && fixed > 0);
    if (!configured) {
      return this._renderNumber('capacity_kwh', 'Usable capacity (kWh)', 10, 0.5, 500, 0.1);
    }
    const capacity = this._sourceCapacityKwh();
    const label = entityId
      ? this.hass.states?.[entityId]?.attributes?.friendly_name || entityId
      : 'Fixed capacity from Energy settings';
    return html`
      <div class="field">
        <label class="f">Usable capacity (kWh)</label>
        <div class="locked">${capacity != null ? `${capacity.toFixed(2).replace(/\.?0+$/, '')} kWh` : 'Unavailable'}</div>
        <div class="help">${label}. Configured under Energy settings.</div>
      </div>
    `;
  }

  private _renderModal() {
    if (!this._modal) return nothing;
    const form = this._form;
    const kind = form.control_kind || 'switch';
    const controlDomains = kind === 'switch' ? ['switch', 'input_boolean'] : kind === 'number' ? ['number'] : ['select'];
    const options = this._selectOptions(form.control_entity);
    return html`
      <div class="modal-backdrop" @click=${() => { this._modal = false; }}>
        <div class="modal" @click=${(event: Event) => event.stopPropagation()}>
          <div class="modal-head">
            <div class="row-icon"><ha-icon icon="mdi:home-battery"></ha-icon></div>
            <div>
              <div class="modal-title">Home battery planner</div>
              <div class="modal-subtitle">Price, solar, battery wear and grid limits in one plan</div>
            </div>
            <button class="modal-x" title="Close" @click=${() => { this._modal = false; }}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="modal-body">
            <div class="section">Battery</div>
            <div class="two">
              <div class="field">
                <label class="f">State-of-charge sensor</label>
                ${this._sources?.battery_soc ? html`
                  <div class="locked">${this._friendly(this._sources.battery_soc)}</div>
                  <div class="help">From Solar &amp; battery - change it there.</div>
                ` : html`
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${form.soc_sensor || ''}
                    .includeDomains=${['sensor']}
                    .entityFilter=${(entity: string | { entity_id?: string }) =>
                      this._matchesEntity(entity, ['sensor'], 'battery')}
                    .allowCustomEntity=${false}
                    @value-changed=${(event: CustomEvent<{ value?: string }>) =>
                      this._set('soc_sensor', event.detail?.value || undefined)}
                  ></ha-entity-picker>
                `}
              </div>
              ${this._renderCapacityField()}
            </div>
            <div class="two">
              ${this._renderNumber('reserve_soc', 'Protected reserve SoC (%)', 15, 0, 90, 1)}
              ${this._renderNumber('target_soc', 'Preferred target SoC (%)', 90, 10, 100, 1)}
            </div>
            <div class="two">
              ${this._renderNumber('charge_power', 'Maximum charge power (W)', 3000, 100, 50000, 100)}
              ${this._renderNumber('max_discharge_power', 'Maximum discharge power (W)', 3000, 100, 50000, 100)}
            </div>

            <div class="section">Forecast inputs</div>
            <div class="two">
              <div class="field">
                <label class="f">Solar forecast (optional)</label>
                ${this._sources?.pv_forecast ? html`
                  <div class="locked">${this._friendly(this._sources.pv_forecast)}</div>
                  <div class="help">From Solar &amp; battery - change it there.</div>
                ` : html`
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${form.pv_forecast_sensor || ''}
                    .includeDomains=${['sensor']}
                    .entityFilter=${(entity: string | { entity_id?: string }) =>
                      this._matchesEntity(entity, ['sensor'], 'forecast')}
                    .allowCustomEntity=${false}
                    @value-changed=${(event: CustomEvent<{ value?: string }>) =>
                      this._set('pv_forecast_sensor', event.detail?.value || undefined)}
                  ></ha-entity-picker>
                  <div class="help">Hourly forecast attributes are used when available.</div>
                `}
              </div>
              <div class="field">
                <label class="f">House load forecast (optional)</label>
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${form.load_forecast_sensor || ''}
                  .includeDomains=${['sensor']}
                  .entityFilter=${(entity: string | { entity_id?: string }) =>
                    this._matchesEntity(entity, ['sensor'], 'forecast')}
                  .allowCustomEntity=${false}
                  @value-changed=${(event: CustomEvent<{ value?: string }>) =>
                    this._set('load_forecast_sensor', event.detail?.value || undefined)}
                ></ha-entity-picker>
              </div>
            </div>
            <div class="two">
              ${this._renderNumber('assumed_load_power', 'Fallback house load (W)', 0, 0, 50000, 50, 'Used when no load forecast is selected.')}
              ${this._renderNumber('planning_hours', 'Planning horizon (hours)', 36, 6, 48, 1)}
            </div>

            <div class="section">${panelText(this.hass, 'Efficiency & wear')}</div>
            <div class="three">
              ${this._renderNumber('charge_efficiency', 'Charge efficiency', 0.95, 0.5, 1, 0.01)}
              ${this._renderNumber('discharge_efficiency', 'Discharge efficiency', 0.95, 0.5, 1, 0.01)}
              ${this._renderNumber('cycle_cost', 'Battery wear (€/kWh)', 0.03, 0, 1, 0.005)}
            </div>
            <div class="two">
              ${this._renderNumber('minimum_confidence', 'Minimum confidence', 0.55, 0, 1, 0.05, 'Below this level the planner holds.')}
              <div></div>
            </div>

            <div class="section">${panelText(this.hass, 'Live grid safety')}</div>
            <div class="toggle-row">
              <div class="toggle-copy">
                <div class="toggle-title">${panelText(this.hass, 'Live grid and fuse guard')}</div>
                <div class="help">${panelText(this.hass, 'Checks fresh P1 net power immediately before every battery command and safely limits or blocks it.')}</div>
              </div>
              <ha-switch aria-label=${panelText(this.hass, 'Live grid and fuse guard')} .checked=${form.grid_guard_enabled !== false} @change=${(event: Event) => this._set('grid_guard_enabled', (event.target as HTMLInputElement).checked)}></ha-switch>
            </div>
            ${form.grid_guard_enabled !== false ? html`
              <div class="field">
                <label class="f">${panelText(this.hass, 'Net grid power sensor (optional)')}</label>
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${form.grid_power_sensor || ''}
                  .includeDomains=${['sensor']}
                  .entityFilter=${(entity: string | { entity_id?: string }) => this._matchesEntity(entity, ['sensor'], 'power')}
                  .allowCustomEntity=${false}
                  @value-changed=${(event: CustomEvent<{ value?: string }>) => this._set('grid_power_sensor', event.detail?.value || undefined)}
                ></ha-entity-picker>
                <div class="help">${panelText(this.hass, 'Leave empty to use the net-power sensor from the selected P1 meter automatically. Positive must mean import and negative export.')}</div>
              </div>
              <div class="three">
                ${this._renderNumber('grid_import_limit', 'Grid import limit (W)', 0, 0, 100000, 100, '0 disables this side of the limit.')}
                ${this._renderNumber('grid_export_limit', 'Grid export limit (W)', 0, 0, 100000, 100, '0 disables this side of the limit.')}
                ${this._renderNumber('grid_safety_margin', 'Safety margin (W)', 250, 0, 10000, 50)}
              </div>
              ${this._renderNumber('grid_data_max_age', 'Maximum meter age (seconds)', 90, 15, 600, 5, 'A limited action is held when the P1 reading is older than this.')}
            ` : nothing}

            <div class="section">${panelText(this.hass, 'Capacity tariff & peak shaving')}</div>
            <div class="toggle-row">
              <div class="toggle-copy">
                <div class="toggle-title">${panelText(this.hass, 'Protect a capacity-tariff tier')}</div>
                <div class="help">${panelText(this.hass, "Learns this month's highest hourly imports and limits charging before the selected tier becomes more expensive.")}</div>
              </div>
              <ha-switch aria-label=${panelText(this.hass, 'Protect a capacity-tariff tier')} .checked=${!!form.capacity_tariff_enabled} @change=${(event: Event) => this._set('capacity_tariff_enabled', (event.target as HTMLInputElement).checked)}></ha-switch>
            </div>
            ${form.capacity_tariff_enabled ? html`
              <div class="three">
                ${this._renderNumber('capacity_tariff_top_n', 'Highest hours counted', 3, 1, 5, 1)}
                ${this._renderNumber('capacity_tariff_target_kw', 'Preferred tier (kW)', 5, 0.1, 250, 0.1)}
                <div class="field">
                  <label class="f">${panelText(this.hass, 'Tariff tiers (kW)')}</label>
                  <input type="text" aria-label=${panelText(this.hass, 'Tariff tiers (kW)')} .value=${(form.capacity_tariff_steps || []).join(', ')} @change=${(event: Event) => this._setCapacitySteps((event.target as HTMLInputElement).value)} />
                  <div class="help">${panelText(this.hass, 'Comma-separated upper limits supplied by your grid operator.')}</div>
                </div>
              </div>
              <div class="note">${panelText(this.hass, 'The capacity limit also activates live P1 guarding. It never forces the battery in the opposite direction.')}</div>
            ` : nothing}

            <div class="section">${panelText(this.hass, 'Safe self-learning')}</div>
            <div class="toggle-row">
              <div class="toggle-copy">
                <div class="toggle-title">${panelText(this.hass, 'Learn from this battery')}</div>
                <div class="help">${panelText(this.hass, 'Stores local 15-minute samples to estimate usable capacity, efficiency, real power and the normal house-load profile.')}</div>
              </div>
              <ha-switch aria-label=${panelText(this.hass, 'Learn from this battery')} .checked=${!!form.learning_enabled} @change=${(event: Event) => this._set('learning_enabled', (event.target as HTMLInputElement).checked)}></ha-switch>
            </div>
            ${form.learning_enabled ? html`
              <div class="toggle-row">
                <div class="toggle-copy">
                  <div class="toggle-title">${panelText(this.hass, 'Use validated learned values for planning')}</div>
                  <div class="help">${panelText(this.hass, 'Only conservative values inside safe configured bounds are used. Your configured maximums always win.')}</div>
                </div>
                <ha-switch aria-label=${panelText(this.hass, 'Use validated learned values for planning')} .checked=${!!form.learning_use_for_planning} @change=${(event: Event) => this._set('learning_use_for_planning', (event.target as HTMLInputElement).checked)}></ha-switch>
              </div>
            ` : nothing}
            <div class="note">${panelText(this.hass, 'The planner uses confirmed prices first and conservative bounds for predicted prices. Learning stays inside Home Assistant.')}</div>

            <div class="section">${panelText(this.hass, 'Execution')}</div>
            <div class="field">
              <label class="f">${panelText(this.hass, 'Execution mode')}</label>
              <select @change=${(event: Event) => this._setExecutionMode((event.target as HTMLSelectElement).value as ExecutionMode)}>
                <option value="advice" ?selected=${form.execution_mode === 'advice'}>${panelText(this.hass, 'Advice only')}</option>
                <option value="shadow" ?selected=${form.execution_mode === 'shadow'}>${panelText(this.hass, 'Simulation / shadow mode')}</option>
                <option value="automatic" ?selected=${form.execution_mode === 'automatic'}>${panelText(this.hass, 'Automatic execution')}</option>
              </select>
              <div class="help">${panelText(this.hass, 'Advice only exposes the plan. Simulation records what it would do without writing to hardware. Automatic applies guarded commands.')}</div>
            </div>
            ${form.execution_mode === 'automatic' ? html`
              <div class="field">
                <label class="f">Control type</label>
                <select @change=${(event: Event) => { this._set('control_kind', (event.target as HTMLSelectElement).value as ControlKind); this._set('control_entity', ''); }}>
                  <option value="switch" ?selected=${kind === 'switch'}>Grid-charge switch</option>
                  <option value="number" ?selected=${kind === 'number'}>Signed battery-power number</option>
                  <option value="select" ?selected=${kind === 'select'}>Battery mode select</option>
                </select>
              </div>
              <div class="field">
                <label class="f">Control entity</label>
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${form.control_entity || ''}
                  .includeDomains=${controlDomains}
                  .entityFilter=${(entity: string | { entity_id?: string }) =>
                    this._matchesEntity(entity, controlDomains)}
                  .allowCustomEntity=${false}
                  @value-changed=${(event: CustomEvent<{ value?: string }>) =>
                    this._set('control_entity', event.detail?.value || undefined)}
                ></ha-entity-picker>
              </div>
              ${kind === 'number' && this._numberMin(form.control_entity) > 0 ? html`<div class="warn">This number cannot be set to zero. Use a mode select or switch if the battery must have a true idle state.</div>` : nothing}
              ${kind === 'select' ? html`
                <div class="three">
                  ${(['charge_option', 'idle_option', 'discharge_option'] as const).map((key, index) => html`<div class="field">
                    <label class="f">${['Charge option', 'Self-use / idle option', 'Discharge option'][index]}</label>
                    <select @change=${(event: Event) => this._set(key, (event.target as HTMLSelectElement).value)}>
                      <option value="">Select...</option>
                      ${options.map(option => html`<option value=${option} ?selected=${option === form[key]}>${option}</option>`)}
                    </select>
                  </div>`)}
                </div>` : nothing}
            ` : nothing}

            ${this._error ? html`<div class="warn">${panelText(this.hass, this._error)}</div>` : nothing}
          </div>
          <div class="modal-foot">
            ${this._cfg.enabled ? html`<button class="btn ghost" @click=${this._remove}>Remove</button>` : html`<span></span>`}
            <div class="right">
              <button class="btn ghost" @click=${() => { this._modal = false; }}>Cancel</button>
              <button class="btn" ?disabled=${this._busy} @click=${this._save}><ha-icon icon="mdi:check"></ha-icon>${this._busy ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  protected render() {
    if (!this._loaded) return nothing;
    if (!this._pricesOk) {
      return html`
        <div class="head"><span class="head-title">Home battery</span></div>
        <div class="sub">Plan charging and discharging against confirmed and predicted prices, solar, house load, efficiency and battery wear.</div>
        <div class="card unavailable">
          <div class="row">
            <div class="row-icon"><ha-icon icon=${this._noContract() ? 'mdi:file-document-alert-outline' : 'mdi:account-key-outline'}></ha-icon></div>
            <div class="row-main">
              <div class="row-title">${this._noContract() ? 'Energy contract required' : 'SmartHomeShop.io API key required'}</div>
              <div class="row-meta">${this._accountMessage()}${!this.hass.user?.is_admin && !this._noContract() ? ' Ask a Home Assistant administrator to add or replace the key.' : ''}</div>
              <div class="requirement"><ha-icon icon="mdi:lock-outline"></ha-icon>Battery planner unavailable until ${this._noContract() ? 'a contract is active' : 'connected'}</div>
            </div>
            ${this.hass.user?.is_admin ? html`
              <button class="btn ghost" @click=${this._openAccountSettings}>
                <ha-icon icon=${this._noContract() ? 'mdi:cog-outline' : 'mdi:key-outline'}></ha-icon>
                ${this._noContract() ? 'Open settings' : ['unauthorized', 'forbidden'].includes(this._accountStatus) ? 'Replace API key' : 'Enter API key'}
              </button>
            ` : nothing}
          </div>
        </div>
      `;
    }
    const configured = !!this._cfg.enabled;
    const action = this._plan.recommendation || 'hold';
    const power = Math.abs(numOr(this._plan.target_power_w, 0));
    const confidence = Math.round(numOr(this._plan.confidence, 0) * 100);
    const mode = this._cfg.execution_mode || (this._cfg.automatic_control ? 'automatic' : 'advice');
    const modeLabel = panelText(this.hass, mode === 'automatic' ? 'Automatic execution' : mode === 'shadow' ? 'Simulation / shadow mode' : 'Advice only');
    const guard = this._plan.guard || {};
    const capacity = this._plan.capacity_tariff || {};
    return html`
      <div class="head"><span class="head-title">Home battery</span></div>
      <div class="sub">Plan charging and discharging against confirmed and predicted prices, solar, house load, efficiency and battery wear.</div>
      <div class="card">
        <div class="row">
          <div class="row-icon ${action}"><ha-icon icon=${this._planIcon()}></ha-icon></div>
          <div class="row-main">
            <div class="row-title">${this._planTitle()}</div>
            <div class="row-meta">${configured ? (this._plan.reason || 'Waiting for the first complete plan.') : 'Configure battery details to start with advice-only planning.'}</div>
            ${configured ? html`<div class="plan-stats">
              ${this._plan.status === 'ready' ? html`<span class="chip">${power ? `${power} W` : 'No power change'}</span><span class="chip">Target ${this._plan.target_soc ?? '-'}%</span><span class="chip">${confidence}% confidence</span><span class="chip">€ ${numOr(this._plan.expected_savings, 0).toFixed(2)} plan value</span>` : nothing}
              <span class="chip">${modeLabel}</span>
              ${guard.status ? html`<span class="chip">${panelText(this.hass, 'Grid guard: {status}', { status: panelText(this.hass, String(guard.status)) })}</span>` : nothing}
              ${guard.grid_power_w != null && Number.isFinite(Number(guard.grid_power_w)) ? html`<span class="chip">${panelText(this.hass, 'Grid {power} W', { power: Math.round(Number(guard.grid_power_w)) })}</span>` : nothing}
              ${guard.fuse_headroom_w != null && Number.isFinite(Number(guard.fuse_headroom_w)) ? html`<span class="chip">${panelText(this.hass, 'Fuse headroom {power} W', { power: Math.round(Number(guard.fuse_headroom_w)) })}</span>` : nothing}
              ${capacity.limit_w ? html`<span class="chip">${panelText(this.hass, 'Peak limit {power} W', { power: Math.round(Number(capacity.limit_w)) })}</span>` : nothing}
            </div>` : nothing}
          </div>
          ${this.hass.user?.is_admin ? html`<button class="btn ${configured ? 'ghost' : ''}" @click=${this._openModal}><ha-icon icon=${configured ? 'mdi:cog-outline' : 'mdi:plus'}></ha-icon>${configured ? 'Configure' : 'Set up'}</button>` : nothing}
        </div>
        ${configured ? html`
          <div class="insights">
            <div class="insight">
              <div class="insight-label">${panelText(this.hass, 'Execution')}</div>
              <div class="insight-value">${modeLabel}</div>
            </div>
            <div class="insight">
              <div class="insight-label">${panelText(this.hass, 'Live safety')}</div>
              <div class="insight-value">${this._translatedReason(guard.reason || 'Waiting for a live grid measurement.')}</div>
            </div>
            <div class="insight">
              <div class="insight-label">${panelText(this.hass, 'Self-learning')}</div>
              <div class="insight-value">${this._learningSummary()}</div>
            </div>
          </div>
          <div class="journal">
            <div class="journal-head">
              <span>${panelText(this.hass, 'Decision journal')}</span>
              ${this.hass.user?.is_admin && this._journal.length ? html`<button class="journal-clear" @click=${this._clearJournal}>${panelText(this.hass, 'Clear')}</button>` : nothing}
            </div>
            ${this._journal.length ? this._journal.slice(0, 8).map(entry => html`
              <div class="journal-row">
                <span class="journal-time">${this._journalTime(entry.timestamp)}</span>
                <span class="journal-action">${panelText(this.hass, entry.action || entry.status || '-')}</span>
                <span class="journal-reason">${this._translatedReason(entry.reason || entry.status || '-')}</span>
              </div>
            `) : html`<div class="journal-row"><span></span><span class="journal-action">${panelText(this.hass, 'No decisions yet')}</span><span class="journal-reason">${panelText(this.hass, 'The next completed plan will appear here.')}</span></div>`}
          </div>
        ` : nothing}
      </div>
      ${this._legacyDeviceAutomations().map(legacy => html`
        <div class="legacy-note">
          <ha-icon icon="mdi:alert-outline"></ha-icon>
          <div>An older battery automation (<b>${legacy.name}</b>) still steers the battery and can conflict with this planner.</div>
          ${this.hass.user?.is_admin ? html`<button class="btn ghost" @click=${() => this._removeLegacyAutomation(legacy.configId)}>Remove</button>` : nothing}
        </div>
      `)}
      ${this._renderModal()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-energy-battery': EnergyBattery;
  }
}
