import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';

type ControlKind = 'switch' | 'number' | 'select';

interface BatteryConfig {
  enabled?: boolean;
  automatic_control?: boolean;
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
    .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    select, input[type='number'] { width: 100%; box-sizing: border-box; min-height: 40px; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
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
        const [battery, sources, plan] = await Promise.all([
          this.hass.callWS<{ battery: BatteryConfig }>({ type: 'smarthomeshop/battery' }),
          this.hass.callWS<{ sources: Record<string, any> }>({ type: 'smarthomeshop/energy_sources' }),
          this.hass.callWS<{ plan: BatteryPlan }>({ type: 'smarthomeshop/battery/plan' }),
        ]);
        this._cfg = battery.battery || {};
        this._sources = sources.sources || {};
        this._plan = plan.plan || {};
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
    if (['unauthorized', 'forbidden'].includes(this._accountStatus)) {
      return 'The saved SmartHomeShop.io API key is invalid or was revoked. Replace it to enable dynamic prices and battery planning.';
    }
    if (this._accountStatus === 'unconfigured') {
      return 'Enter your SmartHomeShop.io API key to enable dynamic prices, forecasts and home battery planning.';
    }
    return 'Dynamic price data is unavailable. Check the SmartHomeShop.io API key to enable home battery planning.';
  }

  private _entityOptions(domains: string[], kind?: 'battery' | 'energy' | 'power' | 'forecast'): Array<{ value: string; label: string }> {
    const out = [{ value: '', label: 'Select...' }];
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      if (!domains.includes(dom(entityId))) continue;
      const deviceClass = String(st.attributes?.device_class || '');
      const unit = String(st.attributes?.unit_of_measurement || '');
      if (kind === 'battery' && deviceClass !== 'battery' && unit !== '%') continue;
      if (kind === 'energy' && deviceClass !== 'energy' && !/^k?Wh$/i.test(unit)) continue;
      if (kind === 'power' && deviceClass !== 'power' && !/^(k|m)?W$/i.test(unit)) continue;
      if (kind === 'forecast' && !['energy', 'power'].includes(deviceClass) && !/^(k|m)?W(h)?$/i.test(unit)) continue;
      out.push({ value: entityId, label: (st.attributes?.friendly_name as string) || entityId });
    }
    return [out[0], ...out.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
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
      control_kind: 'switch',
      target_soc: 90,
      reserve_soc: 15,
      capacity_kwh: sources.battery_capacity_kwh ?? undefined,
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
      ...this._cfg,
    };
    this._modal = true;
  }

  private _set<K extends keyof BatteryConfig>(key: K, value: BatteryConfig[K]): void {
    this._form = { ...this._form, [key]: value };
  }

  private async _deleteAutomation(): Promise<void> {
    for (const id of [BATT_ID, ...LEGACY_IDS]) {
      try { await this.hass.callApi('DELETE', `config/automation/config/${id}`); } catch { /* Automation does not exist. */ }
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
    const form = { ...this._form, enabled: true };
    const target = numOr(form.target_soc, NaN);
    const reserve = numOr(form.reserve_soc, NaN);
    if (!form.soc_sensor) { this._error = 'Select the battery state-of-charge sensor.'; return; }
    if (!(numOr(form.capacity_kwh, 0) > 0)) { this._error = 'Enter the usable battery capacity.'; return; }
    if (!(numOr(form.charge_power, 0) > 0) || !(numOr(form.max_discharge_power, 0) > 0)) {
      this._error = 'Set both maximum charge and discharge power.'; return;
    }
    if (!Number.isFinite(target) || target < 10 || target > 100) { this._error = 'Target SoC must be 10-100%.'; return; }
    if (!Number.isFinite(reserve) || reserve < 0 || reserve >= target) { this._error = 'Reserve SoC must be below the target.'; return; }
    if (form.automatic_control) {
      if (!form.control_entity) { this._error = 'Select a control entity before enabling automatic control.'; return; }
      if (form.control_kind === 'select' && (!form.charge_option || !form.idle_option || !form.discharge_option)) {
        this._error = 'Select the charge, self-use and discharge options.'; return;
      }
    }

    this._busy = true;
    this._error = '';
    try {
      if (form.control_kind === 'number') form.off_min = this._numberMin(form.control_entity);
      else form.off_min = 0;
      if (form.automatic_control) {
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
      this._modal = false;
    } catch (err: any) {
      console.error('energy-battery: save failed', err);
      this._error = `Could not save. ${err?.message || ''}`;
    }
    this._busy = false;
  }

  private async _remove(): Promise<void> {
    if (!this.hass.user?.is_admin || !window.confirm('Remove the battery planner and its automation?')) return;
    try {
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
      <label class="f">${label}</label>
      <input type="number" min=${min} max=${max} step=${step} .value=${String(value ?? fallback)}
        @input=${(event: Event) => this._set(key, parseFloat((event.target as HTMLInputElement).value) as never)} />
      ${help ? html`<div class="help">${help}</div>` : nothing}
    </div>`;
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
                <select @change=${(event: Event) => this._set('soc_sensor', (event.target as HTMLSelectElement).value)}>
                  ${this._entityOptions(['sensor'], 'battery').map(option => html`<option value=${option.value} ?selected=${option.value === form.soc_sensor}>${option.label}</option>`)}
                </select>
              </div>
              ${this._renderNumber('capacity_kwh', 'Usable capacity (kWh)', 10, 0.5, 500, 0.1)}
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
                <select @change=${(event: Event) => this._set('pv_forecast_sensor', (event.target as HTMLSelectElement).value)}>
                  ${this._entityOptions(['sensor'], 'forecast').map(option => html`<option value=${option.value} ?selected=${option.value === form.pv_forecast_sensor}>${option.label}</option>`)}
                </select>
                <div class="help">Hourly forecast attributes are used when available.</div>
              </div>
              <div class="field">
                <label class="f">House load forecast (optional)</label>
                <select @change=${(event: Event) => this._set('load_forecast_sensor', (event.target as HTMLSelectElement).value)}>
                  ${this._entityOptions(['sensor'], 'forecast').map(option => html`<option value=${option.value} ?selected=${option.value === form.load_forecast_sensor}>${option.label}</option>`)}
                </select>
              </div>
            </div>
            <div class="two">
              ${this._renderNumber('assumed_load_power', 'Fallback house load (W)', 0, 0, 50000, 50, 'Used when no load forecast is selected.')}
              ${this._renderNumber('planning_hours', 'Planning horizon (hours)', 36, 6, 48, 1)}
            </div>

            <div class="section">Efficiency, wear &amp; safety</div>
            <div class="three">
              ${this._renderNumber('charge_efficiency', 'Charge efficiency', 0.95, 0.5, 1, 0.01)}
              ${this._renderNumber('discharge_efficiency', 'Discharge efficiency', 0.95, 0.5, 1, 0.01)}
              ${this._renderNumber('cycle_cost', 'Battery wear (€/kWh)', 0.03, 0, 1, 0.005)}
            </div>
            <div class="three">
              ${this._renderNumber('grid_import_limit', 'Grid import limit (W)', 0, 0, 100000, 100, '0 disables the limit.')}
              ${this._renderNumber('grid_export_limit', 'Grid export limit (W)', 0, 0, 100000, 100, '0 disables the limit.')}
              ${this._renderNumber('minimum_confidence', 'Minimum confidence', 0.55, 0, 1, 0.05, 'Below this level the planner holds.')}
            </div>
            <div class="note">The planner uses confirmed prices first and conservative bounds for predicted prices. It never moves below the reserve or outside the configured grid limits.</div>

            <div class="section">Execution</div>
            <div class="toggle-row">
              <div class="toggle-copy">
                <div class="toggle-title">Automatically apply recommendations</div>
                <div class="help">Off by default. With this disabled, Home Assistant only exposes advice sensors.</div>
              </div>
              <ha-switch .checked=${!!form.automatic_control} @change=${(event: Event) => this._set('automatic_control', (event.target as HTMLInputElement).checked)}></ha-switch>
            </div>
            ${form.automatic_control ? html`
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
                <select @change=${(event: Event) => this._set('control_entity', (event.target as HTMLSelectElement).value)}>
                  ${this._entityOptions(controlDomains).map(option => html`<option value=${option.value} ?selected=${option.value === form.control_entity}>${option.label}</option>`)}
                </select>
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

            ${this._error ? html`<div class="warn">${this._error}</div>` : nothing}
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
            <div class="row-icon"><ha-icon icon="mdi:account-key-outline"></ha-icon></div>
            <div class="row-main">
              <div class="row-title">SmartHomeShop.io API key required</div>
              <div class="row-meta">${this._accountMessage()}${!this.hass.user?.is_admin ? ' Ask a Home Assistant administrator to add or replace the key.' : ''}</div>
              <div class="requirement"><ha-icon icon="mdi:lock-outline"></ha-icon>Battery planner unavailable until connected</div>
            </div>
            ${this.hass.user?.is_admin ? html`
              <button class="btn ghost" @click=${this._openAccountSettings}>
                <ha-icon icon="mdi:key-outline"></ha-icon>
                ${['unauthorized', 'forbidden'].includes(this._accountStatus) ? 'Replace API key' : 'Enter API key'}
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
              <span class="chip">${this._cfg.automatic_control ? 'Automatic execution on' : 'Advice only'}</span>
            </div>` : nothing}
          </div>
          ${this.hass.user?.is_admin ? html`<button class="btn ${configured ? 'ghost' : ''}" @click=${this._openModal}><ha-icon icon=${configured ? 'mdi:cog-outline' : 'mdi:plus'}></ha-icon>${configured ? 'Configure' : 'Set up'}</button>` : nothing}
        </div>
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
