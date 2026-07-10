import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';

// Energy sources (smart-energy). Our P1 meter only sees the grid connection
// point, so it cannot see solar production or what a home battery charges and
// discharges. Here the user maps their own HA entities for those (they already
// have the hardware in HA), which lets us compute true PV surplus and gate the
// battery on a real state-of-charge. Read-only: we never touch the HA Energy
// Dashboard preferences.

interface EnergySources {
  solar_power?: string;
  solar_invert?: boolean;
  battery_power?: string;
  battery_invert?: boolean;
  battery_soc?: string;
  battery_capacity_kwh?: number | null;
  pv_forecast?: string;
}

const dom = (e: string): string => e.split('.')[0];

@customElement('shs-energy-sources')
export class EnergySourcesCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _loaded = false;
  @state() private _cfg: EnergySources = {};
  @state() private _modal = false;
  @state() private _busy = false;
  @state() private _error = '';
  @state() private _form: EnergySources = {};

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; margin-top: 24px; }
    .head { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin: -4px 0 12px; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .row { display: flex; align-items: center; gap: 12px; }
    .row-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(234,179,8,.14); color: #eab308; flex-shrink: 0; }
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
    .live { font-size: 11.5px; margin-top: 4px; }
    .live.ok { color: #16a34a; }
    .live.dead { color: #ef4444; }
    select, input[type="number"] { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    select:focus, input:focus { outline: none; border-color: var(--shs-primary); }
    .check { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--primary-text-color); margin-top: 6px; }
    .check input { width: auto; }
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
      const res = await this.hass.callWS<{ sources: EnergySources }>({ type: 'smarthomeshop/energy_sources' });
      this._cfg = res.sources || {};
    } catch (err) { console.error('energy-sources: load failed', err); }
    this._loaded = true;
  }

  private _options(kind: 'power' | 'battery' | 'energy'): Array<{ value: string; label: string }> {
    const out = [{ value: '', label: 'None' }];
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      if (dom(entityId) !== 'sensor') continue;
      const dc = st.attributes?.device_class;
      const unit = String(st.attributes?.unit_of_measurement || '');
      if (kind === 'power' && dc !== 'power' && !/^k?W$/i.test(unit)) continue;
      if (kind === 'battery' && dc !== 'battery' && unit !== '%') continue;
      if (kind === 'energy' && dc !== 'energy' && !/^k?Wh$/i.test(unit)) continue;
      out.push({ value: entityId, label: (st.attributes?.friendly_name as string) || entityId });
    }
    return [out[0], ...out.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
  }

  private _liveValue(entityId?: string, invert = false): { text: string; dead: boolean } | null {
    if (!entityId) return null;
    const st = this.hass.states[entityId];
    if (!st || st.state === 'unavailable' || st.state === 'unknown') return { text: 'unavailable', dead: true };
    const n = Number(st.state);
    const unit = st.attributes?.unit_of_measurement || '';
    if (Number.isFinite(n)) {
      const v = invert ? -n : n;
      return { text: `now: ${v} ${unit}`, dead: false };
    }
    return { text: `now: ${st.state}`, dead: false };
  }

  private _set<K extends keyof EnergySources>(key: K, value: EnergySources[K]): void {
    this._form = { ...this._form, [key]: value };
  }

  private _openModal(): void {
    this._error = '';
    this._form = { ...this._cfg };
    this._modal = true;
  }

  private async _save(): Promise<void> {
    if (this._busy) return;
    if (!this.hass.user?.is_admin) { this._error = 'Administrator required.'; return; }
    this._busy = true; this._error = '';
    try {
      await this.hass.callWS({ type: 'smarthomeshop/energy_sources/set', config: this._form });
      this._cfg = { ...this._form };
      this._modal = false;
      // Let sibling cards (battery prefill) pick up the change.
      this.dispatchEvent(new CustomEvent('shs-energy-sources-changed', { bubbles: true, composed: true }));
    } catch (err: any) {
      console.error('energy-sources: save failed', err);
      this._error = `Could not save. ${err?.message || ''}`;
    }
    this._busy = false;
  }

  private _summary(): string {
    const c = this._cfg;
    const bits: string[] = [];
    if (c.solar_power) bits.push('solar');
    if (c.battery_power || c.battery_soc) bits.push('battery');
    if (c.pv_forecast) bits.push('forecast');
    return bits.length ? `Connected: ${bits.join(', ')}` : '';
  }

  private _hasDead(): boolean {
    return [this._cfg.solar_power, this._cfg.battery_power, this._cfg.battery_soc, this._cfg.pv_forecast]
      .some(e => e && this._liveValue(e)?.dead);
  }

  private _picker(label: string, key: keyof EnergySources, kind: 'power' | 'battery' | 'energy', invertKey?: keyof EnergySources, help?: string) {
    const val = this._form[key] as string | undefined;
    const live = this._liveValue(val, invertKey ? !!this._form[invertKey] : false);
    return html`
      <div class="field">
        <label class="f">${label}</label>
        <select @change=${(e: Event) => this._set(key, (e.target as HTMLSelectElement).value as any)}>
          ${this._options(kind).map(o => html`<option value=${o.value} ?selected=${o.value === val}>${o.label}</option>`)}
        </select>
        ${help ? html`<div class="help">${help}</div>` : nothing}
        ${live ? html`<div class="live ${live.dead ? 'dead' : 'ok'}">${live.text}</div>` : nothing}
        ${invertKey && val ? html`
          <label class="check">
            <input type="checkbox" ?checked=${!!this._form[invertKey]}
              @change=${(e: Event) => this._set(invertKey, (e.target as HTMLInputElement).checked as any)} />
            Reverse the sign (if charging/production shows the wrong way)
          </label>` : nothing}
      </div>`;
  }

  private _renderModal() {
    if (!this._modal) return nothing;
    return html`
      <div class="modal-backdrop" @click=${() => { this._modal = false; }}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-head">
            <div class="row-icon"><ha-icon icon="mdi:solar-power-variant"></ha-icon></div>
            <div class="modal-title">Solar &amp; battery entities</div>
            <button class="modal-x" @click=${() => { this._modal = false; }}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="modal-body">
            <div class="section">Solar</div>
            ${this._picker('Solar production power (W)', 'solar_power', 'power', 'solar_invert',
              'Live PV power from your inverter, shown in the energy overview. (The true-surplus calculation uses the battery power below.)')}
            ${this._picker('Solar forecast today (kWh left)', 'pv_forecast', 'energy', undefined,
              'A Forecast.Solar / Solcast "remaining today" sensor. Used to skip grid-charging when the sun will fill the battery.')}

            <div class="section">Battery</div>
            ${this._picker('Battery power (W, + discharge / - charge)', 'battery_power', 'power', 'battery_invert',
              'Signed battery power. With solar power this gives true PV surplus; check the sign against the live value below.')}
            ${this._picker('Battery state of charge (%)', 'battery_soc', 'battery', undefined,
              'Used to stop charging at the target and to protect the reserve in battery arbitrage.')}
            <div class="field">
              <label class="f">Battery capacity (kWh)</label>
              <input type="number" min="1" max="200" step="0.5" .value=${this._form.battery_capacity_kwh != null ? String(this._form.battery_capacity_kwh) : ''}
                @input=${(e: Event) => this._set('battery_capacity_kwh', parseFloat((e.target as HTMLInputElement).value))} />
            </div>

            ${this._error ? html`<div class="warn">${this._error}</div>` : nothing}
          </div>
          <div class="modal-foot">
            <span></span>
            <div class="right">
              <button class="btn ghost" @click=${() => { this._modal = false; }}>Cancel</button>
              <button class="btn" ?disabled=${this._busy} @click=${this._save}><ha-icon icon="mdi:check"></ha-icon> ${this._busy ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  protected render() {
    if (!this._loaded) return nothing;
    const isAdmin = !!this.hass.user?.is_admin;
    const configured = !!(this._cfg.solar_power || this._cfg.battery_power || this._cfg.battery_soc || this._cfg.pv_forecast);
    return html`
      <div class="head">
        <span class="head-title">Solar &amp; battery</span>
      </div>
      <div class="sub">
        Your P1 meter only sees the grid. Connect your solar and battery entities (you already have them in
        Home Assistant) so we can see real solar surplus and your battery's charge level.
      </div>
      <div class="card">
        <div class="row">
          <div class="row-icon"><ha-icon icon="mdi:solar-power-variant"></ha-icon></div>
          <div class="row-main">
            <div class="row-title">${configured ? (this._hasDead() ? 'Some entities are unavailable' : 'Solar / battery connected') : 'Not connected'}</div>
            <div class="row-meta">${configured ? this._summary() : 'Map your solar-production and battery entities to unlock true surplus and state-of-charge control.'}</div>
          </div>
          ${isAdmin ? html`<button class="btn ${configured ? 'ghost' : ''}" @click=${this._openModal}>
            <ha-icon icon=${configured ? 'mdi:cog-outline' : 'mdi:plus'}></ha-icon> ${configured ? 'Edit' : 'Connect'}
          </button>` : nothing}
        </div>
      </div>
      ${this._renderModal()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-energy-sources': EnergySourcesCard;
  }
}
