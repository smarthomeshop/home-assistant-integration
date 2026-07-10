import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';

// Whole-home energy hub (top-level "Energy" tab). Our P1 measures the grid;
// the solar and battery live power come from the entities the user mapped in
// "Solar & battery". House consumption is derived: house = solar + net_grid +
// battery_signed (HA battery convention + discharge / - charge). Also shows the
// current dynamic price and the status of the smart-energy features.

interface Sources {
  solar_power?: string; solar_invert?: boolean;
  battery_power?: string; battery_invert?: boolean;
  battery_soc?: string; battery_capacity_kwh?: number; pv_forecast?: string;
}

@customElement('shs-energy-hub')
export class EnergyHub extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _loaded = false;
  @state() private _sources: Sources = {};
  @state() private _account: any = null;
  @state() private _schedules: any[] = [];
  @state() private _battery: any = {};

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; padding: 20px; max-width: 960px; margin: 0 auto; box-sizing: border-box; }
    .title { font-size: 20px; font-weight: 700; color: var(--primary-text-color); }
    .subtitle { font-size: 13px; color: var(--secondary-text-color); margin-top: 2px; margin-bottom: 20px; }
    .section-label { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); margin: 22px 0 12px; }

    .flow { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .node { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 14px; padding: 16px; }
    .node-head { display: flex; align-items: center; gap: 10px; }
    .node-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .node-icon ha-icon { --mdc-icon-size: 22px; }
    .node-label { font-size: 12.5px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .4px; }
    .node-value { font-size: 26px; font-weight: 700; color: var(--primary-text-color); margin-top: 10px; line-height: 1; }
    .node-value .u { font-size: 14px; font-weight: 500; color: var(--secondary-text-color); }
    .node-dir { font-size: 12.5px; margin-top: 6px; font-weight: 600; }
    .node-dir.in { color: #ef4444; } .node-dir.out { color: #16a34a; } .node-dir.idle { color: var(--secondary-text-color); }
    .soc { margin-top: 10px; height: 8px; border-radius: 5px; background: var(--secondary-background-color); overflow: hidden; }
    .soc > span { display: block; height: 100%; background: #10b981; }
    .soc-txt { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 4px; }
    .dead { font-size: 11.5px; color: #ef4444; margin-top: 6px; }

    .chips { display: flex; flex-wrap: wrap; gap: 10px; }
    .chip { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 12px 14px; min-width: 130px; }
    .chip-label { font-size: 11.5px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .4px; }
    .chip-value { font-size: 18px; font-weight: 700; color: var(--primary-text-color); margin-top: 4px; }
    .chip-value.cap { text-transform: capitalize; }
    .tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 600; padding: 8px 12px; border-radius: 10px; }
    .tag.good { background: rgba(34,197,94,.15); color: #16a34a; }
    .tag.flat { background: var(--secondary-background-color); color: var(--secondary-text-color); }
    .tag ha-icon { --mdc-icon-size: 15px; }
    .status-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

    .empty { background: var(--card-background-color); border: 1px dashed var(--divider-color); border-radius: 14px; padding: 16px; font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; }
    .empty b { color: var(--primary-text-color); }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    try {
      const s = await this.hass.callWS<{ sources: Sources }>({ type: 'smarthomeshop/energy_sources' });
      this._sources = s.sources || {};
    } catch { /* none */ }
    try { this._account = await this.hass.callWS({ type: 'smarthomeshop/account' }); } catch { /* none */ }
    try { const r = await this.hass.callWS<{ schedules: any[] }>({ type: 'smarthomeshop/schedules' }); this._schedules = r.schedules || []; } catch { /* none */ }
    try { const b = await this.hass.callWS<{ battery: any }>({ type: 'smarthomeshop/battery' }); this._battery = b.battery || {}; } catch { /* none */ }
    this._loaded = true;
  }

  private _netEntity(): string | undefined {
    return Object.keys(this.hass.states || {}).find(e => e.includes('net_grid_power'));
  }

  private _scale(entityId?: string): number {
    const u = String((entityId && this.hass.states[entityId]?.attributes?.unit_of_measurement) || '');
    return /kw/i.test(u) ? 1000 : 1;
  }

  private _num(entityId?: string, invert = false): number | null {
    if (!entityId) return null;
    const st = this.hass.states[entityId];
    if (!st || st.state === 'unavailable' || st.state === 'unknown') return null;
    const n = Number(st.state);
    if (!Number.isFinite(n)) return null;
    return (invert ? -1 : 1) * this._scale(entityId) * n;
  }

  private _isDead(entityId?: string): boolean {
    if (!entityId) return false;
    const st = this.hass.states[entityId];
    return !st || st.state === 'unavailable' || st.state === 'unknown';
  }

  private _fmt(w: number | null): { v: string; u: string } {
    if (w === null) return { v: '—', u: '' };
    const a = Math.abs(w);
    if (a >= 1000) return { v: (w / 1000).toFixed(2), u: 'kW' };
    return { v: String(Math.round(w)), u: 'W' };
  }

  private _node(o: { label: string; icon: string; color: string; value: number | null; dir?: { text: string; cls: string }; dead?: boolean; extra?: unknown }) {
    const f = this._fmt(o.value);
    return html`
      <div class="node">
        <div class="node-head">
          <div class="node-icon" style="background:${o.color}1f;color:${o.color};"><ha-icon icon=${o.icon}></ha-icon></div>
          <div class="node-label">${o.label}</div>
        </div>
        <div class="node-value">${f.v} <span class="u">${f.u}</span></div>
        ${o.dead ? html`<div class="dead">sensor unavailable</div>`
          : o.dir ? html`<div class="node-dir ${o.dir.cls}">${o.dir.text}</div>` : nothing}
        ${o.extra ?? nothing}
      </div>`;
  }

  protected render() {
    if (!this._loaded) return nothing;
    const net = this._netEntity();
    const s = this._sources;

    const grid = this._num(net);                                   // + import / - export
    const solar = s.solar_power ? Math.max(0, this._num(s.solar_power, s.solar_invert) ?? 0) : null;
    const batt = s.battery_power ? this._num(s.battery_power, s.battery_invert) : null; // + discharge / - charge
    const house = grid !== null ? (grid + (solar ?? 0) + (batt ?? 0)) : null;
    const soc = this._num(s.battery_soc);

    const cur = this._account?.current;
    const sum = this._account?.summary;
    const priceOk = this._account?.status === 'ok';
    const activeSchedules = this._schedules.filter(x => x.active).length;
    const battOn = !!this._battery?.control_entity;

    return html`
      <div class="title">Energy</div>
      <div class="subtitle">Your whole home at a glance — grid, solar and battery, with your dynamic price.</div>

      <div class="section-label">Live now</div>
      <div class="flow">
        ${this._node({
          label: 'Home', icon: 'mdi:home', color: '#4361ee', value: house,
          dir: house !== null ? { text: 'consumption', cls: 'idle' } : undefined,
        })}
        ${this._node({
          label: 'Grid', icon: 'mdi:transmission-tower', color: grid !== null && grid < -5 ? '#16a34a' : '#ef4444',
          value: grid !== null ? Math.abs(grid) : null, dead: this._isDead(net),
          dir: grid === null ? undefined : grid > 5 ? { text: 'importing', cls: 'in' } : grid < -5 ? { text: 'exporting', cls: 'out' } : { text: 'balanced', cls: 'idle' },
        })}
        ${s.solar_power ? this._node({
          label: 'Solar', icon: 'mdi:solar-power-variant', color: '#eab308', value: solar,
          dead: this._isDead(s.solar_power),
          dir: solar === null ? undefined : solar > 5 ? { text: 'producing', cls: 'out' } : { text: 'idle', cls: 'idle' },
        }) : nothing}
        ${s.battery_power ? this._node({
          label: 'Battery', icon: 'mdi:home-battery', color: '#10b981', value: batt !== null ? Math.abs(batt) : null,
          dead: this._isDead(s.battery_power),
          dir: batt === null ? undefined : batt > 5 ? { text: 'discharging', cls: 'out' } : batt < -5 ? { text: 'charging', cls: 'in' } : { text: 'idle', cls: 'idle' },
          extra: soc !== null ? html`<div class="soc"><span style="width:${Math.max(0, Math.min(100, soc))}%"></span></div><div class="soc-txt">${Math.round(soc)}% charged</div>` : nothing,
        }) : nothing}
      </div>

      ${!s.solar_power && !s.battery_power ? html`
        <div class="empty" style="margin-top:12px;">
          Only the grid is shown. To see solar and battery here, open a P1 device's
          <b>Automations</b> tab and connect them under <b>Solar &amp; battery</b>.
        </div>` : nothing}

      ${priceOk && cur ? html`
        <div class="section-label">Price now</div>
        <div class="chips">
          <div class="chip"><div class="chip-label">Electricity</div><div class="chip-value">€ ${(cur.electricity ?? 0).toFixed(3)} <span style="font-size:12px;color:var(--secondary-text-color);">/kWh</span></div></div>
          ${cur.level ? html`<div class="chip"><div class="chip-label">Tariff level</div><div class="chip-value cap">${String(cur.level).replace('_', ' ')}</div></div>` : nothing}
          ${cur.feed_in != null ? html`<div class="chip"><div class="chip-label">Feed-in</div><div class="chip-value">€ ${cur.feed_in.toFixed(3)}</div></div>` : nothing}
          ${sum?.average != null ? html`<div class="chip"><div class="chip-label">Avg today</div><div class="chip-value">€ ${Number(sum.average).toFixed(3)}</div></div>` : nothing}
        </div>` : nothing}

      <div class="section-label">Smart energy</div>
      <div class="status-row">
        ${priceOk && sum?.cheap_now != null ? html`
          <span class="tag ${sum.cheap_now ? 'good' : 'flat'}">
            <ha-icon icon=${sum.cheap_now ? 'mdi:cash-clock' : 'mdi:clock-outline'}></ha-icon>
            ${sum.cheap_now ? 'Cheap right now' : 'Above average now'}
          </span>` : nothing}
        ${sum?.cheapest_3h ? html`<span class="tag flat"><ha-icon icon="mdi:clock-star-four-points-outline"></ha-icon> Cheapest 3h from ${this._hm(sum.cheapest_3h.start)}</span>` : nothing}
        <span class="tag flat"><ha-icon icon="mdi:calendar-clock"></ha-icon> ${activeSchedules} schedule${activeSchedules === 1 ? '' : 's'} running</span>
        ${battOn ? html`<span class="tag good"><ha-icon icon="mdi:battery-charging-high"></ha-icon> Battery arbitrage on</span>` : nothing}
      </div>
      ${!priceOk ? html`<div class="empty" style="margin-top:12px;">Connect your SmartHomeShop account on a P1 device to see live prices and smart-energy status.</div>` : nothing}
    `;
  }

  private _hm(iso?: string | null): string {
    if (!iso) return '';
    try {
      const tz = this.hass.config?.time_zone;
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', ...(tz ? { timeZone: tz } : {}) });
    } catch { return ''; }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-energy-hub': EnergyHub;
  }
}
