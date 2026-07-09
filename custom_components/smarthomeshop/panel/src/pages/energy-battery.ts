import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';

// Home-battery arbitrage (smart-energy Phase 3). There is no universal HA
// battery-control domain, so the user maps their inverter's own entities
// (a grid-charge switch, a charge-power number, or a mode select) plus an
// optional state-of-charge sensor and an optional PV-forecast sensor. From
// that mapping we generate a safe "charge in the cheapest hours up to a target
// SoC" automation (skipping grid-charge when solar is forecast to fill it),
// and — if a mode select with a discharge option is mapped — a "cover the
// evening peak down to a reserve SoC" automation.

type ControlKind = 'switch' | 'number' | 'select';

interface BatteryConfig {
  enabled?: boolean;
  control_kind?: ControlKind;
  control_entity?: string;
  charge_power?: number;
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
}

const dom = (e: string): string => e.split('.')[0];
const CHARGE_ID = 'shs_batt_charge';
const DISCHARGE_ID = 'shs_batt_discharge';
const NON_PEAK = ['very_low', 'low', 'medium', 'high'];

const turn = (entity: string, on: boolean) => ({ service: `${dom(entity)}.${on ? 'turn_on' : 'turn_off'}`, target: { entity_id: entity } });
const setNumber = (entity: string, value: number) => ({ service: 'number.set_value', target: { entity_id: entity }, data: { value } });
const selectOption = (entity: string, option: string) => ({ service: 'select.select_option', target: { entity_id: entity }, data: { option } });

function chargeControl(c: BatteryConfig, on: boolean) {
  if (c.control_kind === 'switch') return turn(c.control_entity!, on);
  if (c.control_kind === 'number') return setNumber(c.control_entity!, on ? (c.charge_power ?? 0) : (c.off_min ?? 0));
  return selectOption(c.control_entity!, on ? (c.charge_option || '') : (c.idle_option || ''));
}

function chargeAutomation(c: BatteryConfig, px: Record<string, string | null>, alias: string) {
  const N = c.charge_hours || 3;
  const win = px[`cheapest_${N}h_window_now`];
  const startConds: Record<string, unknown>[] = [
    { condition: 'state', entity_id: win, state: 'on' },
    { condition: 'state', entity_id: px.contract_active, state: 'on' },
  ];
  if (c.soc_sensor) startConds.push({ condition: 'numeric_state', entity_id: c.soc_sensor, below: c.target_soc ?? 100 });
  if (c.pv_forecast_sensor && c.soc_sensor && c.capacity_kwh) {
    // Only grid-charge when the forecast solar left today is LESS than the kWh
    // still needed to reach the target — otherwise let the sun fill it.
    startConds.push({ condition: 'template', value_template:
      `{{ (states('${c.pv_forecast_sensor}')|float(0)) < ((${c.target_soc ?? 100} - states('${c.soc_sensor}')|float(0)) / 100 * ${c.capacity_kwh}) }}` });
  }
  const trigger: Record<string, unknown>[] = [
    { platform: 'state', entity_id: win, to: 'on', id: 'edge' },
    { platform: 'state', entity_id: win, to: ['off', 'unavailable'], id: 'edge' },
    { platform: 'homeassistant', event: 'start', id: 'boot' },
  ];
  if (c.soc_sensor) trigger.push({ platform: 'numeric_state', entity_id: c.soc_sensor, above: (c.target_soc ?? 100) - 0.001, id: 'soc_full' });
  if (c.control_kind === 'switch') trigger.push({ platform: 'state', entity_id: c.control_entity!, to: 'on', for: { hours: N + 2 }, id: 'watchdog' });
  return {
    alias, description: 'Created with the SmartHomeShop.io panel · battery charge', mode: 'restart',
    trigger, condition: [],
    action: [{ choose: [
      { conditions: [{ condition: 'trigger', id: 'watchdog' }], sequence: [chargeControl(c, false)] },
      { conditions: startConds, sequence: [chargeControl(c, true)] },
    ], default: [chargeControl(c, false)] }],
  };
}

function dischargeAutomation(c: BatteryConfig, px: Record<string, string | null>, alias: string) {
  // Only meaningful for a mode select with a discharge option + a SoC sensor.
  const reserve = c.reserve_soc ?? 10;
  return {
    alias, description: 'Created with the SmartHomeShop.io panel · battery discharge', mode: 'restart',
    trigger: [
      { platform: 'state', entity_id: px.price_level, to: 'peak', id: 'peak' },
      { platform: 'state', entity_id: px.price_level, to: NON_PEAK, id: 'offpeak' },
      { platform: 'numeric_state', entity_id: c.soc_sensor!, below: reserve, id: 'reserve' },
      { platform: 'homeassistant', event: 'start', id: 'boot' },
    ],
    condition: [],
    action: [{ choose: [
      // Protect the reserve first — never discharge below it.
      { conditions: [{ condition: 'numeric_state', entity_id: c.soc_sensor!, below: reserve }], sequence: [selectOption(c.control_entity!, c.idle_option || '')] },
      // At peak with charge to spare, discharge to cover the expensive hours.
      { conditions: [
        { condition: 'state', entity_id: px.price_level, state: 'peak' },
        { condition: 'state', entity_id: px.contract_active, state: 'on' },
      ], sequence: [selectOption(c.control_entity!, c.discharge_option || '')] },
    ], default: [selectOption(c.control_entity!, c.idle_option || '')] }],
  };
}

@customElement('shs-energy-battery')
export class EnergyBattery extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public deviceName = '';

  @state() private _pricesOk = false;
  @state() private _loaded = false;
  @state() private _cfg: BatteryConfig = {};
  @state() private _px: Record<string, string | null> = {};
  @state() private _modal = false;
  @state() private _busy = false;
  @state() private _error = '';
  @state() private _form: BatteryConfig = {};

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; margin-top: 24px; }
    .head { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin: -4px 0 12px; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .row { display: flex; align-items: center; gap: 12px; }
    .row-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(16,185,129,.12); color: #10b981; flex-shrink: 0; }
    .row-main { flex: 1; min-width: 0; }
    .row-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .row-meta { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .btn ha-icon { --mdc-icon-size: 15px; }
    .warn { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: 10px; padding: 12px 14px; margin: 8px 0; font-size: 13px; color: var(--primary-text-color); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); position: sticky; top: 0; background: var(--card-background-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-body { padding: 18px 20px; }
    .section { font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--secondary-text-color); margin: 18px 0 10px; }
    .section:first-child { margin-top: 0; }
    .field { margin-bottom: 14px; }
    label.f { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); margin: 0 0 6px; }
    .field .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    select, input[type="number"] { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    select:focus, input:focus { outline: none; border-color: var(--shs-primary); }
    .two { display: flex; gap: 10px; }
    .two > div { flex: 1; }
    .modal-foot { display: flex; justify-content: space-between; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); position: sticky; bottom: 0; background: var(--card-background-color); }
    .modal-foot .right { display: flex; gap: 10px; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    try {
      const acc = await this.hass.callWS<{ status?: string }>({ type: 'smarthomeshop/account' });
      this._pricesOk = acc.status === 'ok';
      if (this._pricesOk) {
        const px = await this.hass.callWS<{ entities: Record<string, string | null> }>({ type: 'smarthomeshop/prices/entities' });
        this._px = px.entities || {};
        const b = await this.hass.callWS<{ battery: BatteryConfig }>({ type: 'smarthomeshop/battery' });
        this._cfg = b.battery || {};
      }
    } catch (err) { console.error('energy-battery: load failed', err); }
    this._loaded = true;
  }

  private _entityOptions(domains: string[], deviceClass?: string): Array<{ value: string; label: string }> {
    const out = [{ value: '', label: 'Select…' }];
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      if (!domains.includes(dom(entityId))) continue;
      if (deviceClass && st.attributes?.device_class !== deviceClass && st.attributes?.unit_of_measurement !== '%') continue;
      out.push({ value: entityId, label: (st.attributes?.friendly_name as string) || entityId });
    }
    return [out[0], ...out.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
  }

  private _selectOptions(entityId?: string): string[] {
    if (!entityId) return [];
    return (this.hass.states[entityId]?.attributes?.options as string[]) || [];
  }

  private _openModal(): void {
    this._error = '';
    this._form = {
      control_kind: 'switch', target_soc: 100, reserve_soc: 10, charge_hours: 3,
      ...this._cfg,
    };
    this._modal = true;
  }

  private _set<K extends keyof BatteryConfig>(key: K, value: BatteryConfig[K]): void {
    this._form = { ...this._form, [key]: value };
  }

  private async _save(): Promise<void> {
    if (this._busy) return;
    if (!this.hass.user?.is_admin) { this._error = 'Administrator required.'; return; }
    const f = this._form;
    if (!f.control_entity) { this._error = 'Pick the entity that controls charging.'; return; }
    if (f.control_kind === 'number' && !(f.charge_power! > 0)) { this._error = 'Set the charge power.'; return; }
    if (f.control_kind === 'select' && (!f.charge_option || !f.idle_option)) { this._error = 'Pick the charge and idle options.'; return; }
    this._busy = true; this._error = '';
    try {
      if (f.control_kind === 'number') {
        const min = Number(this.hass.states[f.control_entity]?.attributes?.min);
        f.off_min = Number.isFinite(min) ? min : 0;
      }
      await this.hass.callWS({ type: 'smarthomeshop/battery/set', config: f });
      this._cfg = { ...f };
      // (Re)generate the charge automation.
      await this.hass.callApi('POST', `config/automation/config/${CHARGE_ID}`,
        chargeAutomation(f, this._px, `${this.deviceName || 'Battery'} – Charge in cheapest hours`));
      // Discharge automation only when a mode select with a discharge option is set.
      if (f.control_kind === 'select' && f.discharge_option && f.soc_sensor) {
        await this.hass.callApi('POST', `config/automation/config/${DISCHARGE_ID}`,
          dischargeAutomation(f, this._px, `${this.deviceName || 'Battery'} – Cover the peak`));
      } else {
        try { await this.hass.callApi('DELETE', `config/automation/config/${DISCHARGE_ID}`); } catch { /* none */ }
      }
      this._modal = false;
    } catch (err: any) {
      console.error('energy-battery: save failed', err);
      this._error = `Could not save. ${err?.message || ''}`;
    }
    this._busy = false;
  }

  private async _remove(): Promise<void> {
    if (!this.hass.user?.is_admin) return;
    if (!window.confirm('Remove the battery setup and its automations?')) return;
    try {
      await this.hass.callWS({ type: 'smarthomeshop/battery/set', config: {} });
      this._cfg = {};
      for (const id of [CHARGE_ID, DISCHARGE_ID]) {
        try { await this.hass.callApi('DELETE', `config/automation/config/${id}`); } catch { /* none */ }
      }
      this._modal = false;
    } catch (err) { console.error('energy-battery: remove failed', err); }
  }

  private _summary(): string {
    const c = this._cfg;
    if (!c.control_entity) return '';
    const name = (this.hass.states[c.control_entity]?.attributes?.friendly_name as string) || c.control_entity;
    const bits = [`via ${name}`, `${c.charge_hours || 3}h`, `to ${c.target_soc ?? 100}%`];
    if (c.pv_forecast_sensor) bits.push('solar-aware');
    if (c.control_kind === 'select' && c.discharge_option) bits.push(`covers peak (reserve ${c.reserve_soc ?? 10}%)`);
    return bits.join(' · ');
  }

  private _renderModal() {
    if (!this._modal) return nothing;
    const f = this._form;
    const kind = f.control_kind || 'switch';
    const controlDomains = kind === 'switch' ? ['switch', 'input_boolean'] : kind === 'number' ? ['number'] : ['select'];
    const opts = this._selectOptions(f.control_entity);
    return html`
      <div class="modal-backdrop" @click=${() => { this._modal = false; }}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-head">
            <div class="row-icon"><ha-icon icon="mdi:home-battery"></ha-icon></div>
            <div class="modal-title">Home battery setup</div>
            <button class="modal-x" @click=${() => { this._modal = false; }}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="modal-body">
            <div class="section">How charging is controlled</div>
            <div class="field">
              <label class="f">Control type</label>
              <select @change=${(e: Event) => { this._set('control_kind', (e.target as HTMLSelectElement).value as ControlKind); this._set('control_entity', ''); }}>
                <option value="switch" ?selected=${kind === 'switch'}>A grid-charge switch (on/off)</option>
                <option value="number" ?selected=${kind === 'number'}>A charge-power number (Watt)</option>
                <option value="select" ?selected=${kind === 'select'}>A battery-mode select (charge/idle/discharge)</option>
              </select>
              <div class="help">Every inverter names these differently — pick your own entity. No universal battery control exists in Home Assistant.</div>
            </div>
            <div class="field">
              <label class="f">Control entity</label>
              <select @change=${(e: Event) => this._set('control_entity', (e.target as HTMLSelectElement).value)}>
                ${this._entityOptions(controlDomains).map(o => html`<option value=${o.value} ?selected=${o.value === f.control_entity}>${o.label}</option>`)}
              </select>
            </div>
            ${kind === 'number' ? html`
              <div class="field">
                <label class="f">Charge power</label>
                <input type="number" min="100" max="20000" step="100" .value=${String(f.charge_power ?? 2000)}
                  @input=${(e: Event) => this._set('charge_power', parseFloat((e.target as HTMLInputElement).value))} />
                <span class="help">Watt to set while charging. Stops by setting the number’s own minimum.</span>
              </div>` : nothing}
            ${kind === 'select' ? html`
              <div class="two">
                <div class="field">
                  <label class="f">Charge option</label>
                  <select @change=${(e: Event) => this._set('charge_option', (e.target as HTMLSelectElement).value)}>
                    <option value="">Select…</option>
                    ${opts.map(o => html`<option value=${o} ?selected=${o === f.charge_option}>${o}</option>`)}
                  </select>
                </div>
                <div class="field">
                  <label class="f">Idle / self-use option</label>
                  <select @change=${(e: Event) => this._set('idle_option', (e.target as HTMLSelectElement).value)}>
                    <option value="">Select…</option>
                    ${opts.map(o => html`<option value=${o} ?selected=${o === f.idle_option}>${o}</option>`)}
                  </select>
                </div>
              </div>
              <div class="field">
                <label class="f">Discharge option (optional — enables peak cover)</label>
                <select @change=${(e: Event) => this._set('discharge_option', (e.target as HTMLSelectElement).value)}>
                  <option value="">None</option>
                  ${opts.map(o => html`<option value=${o} ?selected=${o === f.discharge_option}>${o}</option>`)}
                </select>
              </div>` : nothing}

            <div class="section">Battery state &amp; limits</div>
            <div class="field">
              <label class="f">State-of-charge sensor (optional)</label>
              <select @change=${(e: Event) => this._set('soc_sensor', (e.target as HTMLSelectElement).value)}>
                ${this._entityOptions(['sensor'], 'battery').map(o => html`<option value=${o.value} ?selected=${o.value === f.soc_sensor}>${o.label}</option>`)}
              </select>
              <div class="help">Used to stop charging at the target and to protect the reserve. Without it, charging simply follows the cheapest window.</div>
            </div>
            <div class="two">
              <div class="field">
                <label class="f">Target SoC</label>
                <input type="number" min="10" max="100" step="1" .value=${String(f.target_soc ?? 100)}
                  @input=${(e: Event) => this._set('target_soc', parseFloat((e.target as HTMLInputElement).value))} />
              </div>
              <div class="field">
                <label class="f">Reserve SoC</label>
                <input type="number" min="0" max="90" step="1" .value=${String(f.reserve_soc ?? 10)}
                  @input=${(e: Event) => this._set('reserve_soc', parseFloat((e.target as HTMLInputElement).value))} />
              </div>
            </div>
            <div class="field">
              <label class="f">Cheapest block length</label>
              <input type="number" min="1" max="6" step="1" .value=${String(f.charge_hours ?? 3)}
                @input=${(e: Event) => this._set('charge_hours', parseFloat((e.target as HTMLInputElement).value))} />
            </div>

            <div class="section">Solar-aware (optional)</div>
            <div class="two">
              <div class="field">
                <label class="f">Battery capacity (kWh)</label>
                <input type="number" min="1" max="200" step="0.5" .value=${f.capacity_kwh != null ? String(f.capacity_kwh) : ''}
                  @input=${(e: Event) => this._set('capacity_kwh', parseFloat((e.target as HTMLInputElement).value))} />
              </div>
              <div class="field">
                <label class="f">PV forecast sensor (kWh left today)</label>
                <select @change=${(e: Event) => this._set('pv_forecast_sensor', (e.target as HTMLSelectElement).value)}>
                  ${this._entityOptions(['sensor']).map(o => html`<option value=${o.value} ?selected=${o.value === f.pv_forecast_sensor}>${o.label}</option>`)}
                </select>
              </div>
            </div>
            <div class="help" style="margin-top:-6px;">With both set, grid-charging is skipped when the forecast solar left today already covers what’s needed to reach the target (e.g. a Forecast.Solar / Solcast “remaining today” sensor).</div>

            ${this._error ? html`<div class="warn">${this._error}</div>` : nothing}
          </div>
          <div class="modal-foot">
            ${this._cfg.control_entity ? html`<button class="btn ghost" @click=${this._remove}>Remove</button>` : html`<span></span>`}
            <div class="right">
              <button class="btn ghost" @click=${() => { this._modal = false; }}>Cancel</button>
              <button class="btn" ?disabled=${this._busy} @click=${this._save}><ha-icon icon="mdi:check"></ha-icon> ${this._busy ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  protected render() {
    if (!this._loaded || !this._pricesOk) return nothing;
    const isAdmin = !!this.hass.user?.is_admin;
    const configured = !!this._cfg.control_entity;
    return html`
      <div class="head">
        <span class="head-title">Home battery</span>
      </div>
      <div class="sub">
        Charge your battery in the cheapest hours (and skip it when solar will fill it), so it covers the
        expensive evening — using your inverter’s own control entities.
      </div>
      <div class="card">
        <div class="row">
          <div class="row-icon"><ha-icon icon="mdi:home-battery"></ha-icon></div>
          <div class="row-main">
            <div class="row-title">${configured ? 'Battery arbitrage active' : 'Not set up yet'}</div>
            <div class="row-meta">${configured ? this._summary() : 'Map your inverter’s charge control to charge cheap and cover the peak.'}</div>
          </div>
          ${isAdmin ? html`<button class="btn ${configured ? 'ghost' : ''}" @click=${this._openModal}>
            <ha-icon icon=${configured ? 'mdi:cog-outline' : 'mdi:plus'}></ha-icon> ${configured ? 'Configure' : 'Set up'}
          </button>` : nothing}
        </div>
      </div>
      ${this._renderModal()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-energy-battery': EnergyBattery;
  }
}
