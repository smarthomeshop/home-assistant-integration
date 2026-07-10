import { LitElement, html, svg, css, nothing } from 'lit';
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
  @state() private _priceEntity?: string;
  @state() private _priceTab: 'today' | 'tomorrow' = 'today';
  @state() private _history: Record<string, Array<{ t: number; v: number }>> = {};
  @state() private _hoverBar = -1;

  private static readonly APP_STATS_URL = 'https://app.smarthomeshop.io/energy-prices';

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

    .chart-card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 14px; padding: 16px; }
    .chart-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .chart-title { font-size: 13px; font-weight: 600; color: var(--primary-text-color); }
    .chart-legend { margin-left: auto; display: flex; gap: 12px; font-size: 11px; color: var(--secondary-text-color); }
    .chart-legend span { display: inline-flex; align-items: center; gap: 4px; }
    .chart-legend i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
    .seg { display: inline-flex; border: 1px solid var(--divider-color); border-radius: 8px; overflow: hidden; }
    .seg button { border: none; background: transparent; color: var(--secondary-text-color); font-size: 12px; font-weight: 600; font-family: inherit; padding: 5px 12px; cursor: pointer; }
    .seg button.on { background: var(--shs-primary); color: #fff; }
    .chart svg { width: 100%; height: auto; display: block; }
    .chart text { fill: var(--secondary-text-color); font-size: 10px; }
    .chart .zero, .chart .grid { stroke: var(--divider-color); stroke-width: 1; }
    .chart .grid { opacity: 0.5; }
    .chart .axis { stroke: var(--divider-color); stroke-width: 1; }
    .chart .nowline { stroke: var(--shs-primary); stroke-width: 1.5; stroke-dasharray: 3 3; }
    .chart .hit { fill: transparent; cursor: pointer; }
    .chart .tip-bg { fill: var(--card-background-color); stroke: var(--divider-color); }
    .chart .tip-h { fill: var(--primary-text-color); font-weight: 700; }
    .chart .tip-p { fill: var(--secondary-text-color); }
    .chart-link { margin-left: auto; font-size: 12px; color: var(--shs-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 3px; }
    .chart-link:hover { text-decoration: underline; }
    .chart-link ha-icon { --mdc-icon-size: 14px; }
  `;

  private _loadStarted = false;
  private _timer?: number;

  connectedCallback(): void {
    super.connectedCallback();
    // Refresh the price/schedule/battery snapshot periodically so it doesn't
    // freeze on an always-on dashboard (the live power is already reactive).
    this._timer = window.setInterval(() => this._load(), 60000);
  }

  disconnectedCallback(): void {
    if (this._timer) { window.clearInterval(this._timer); this._timer = undefined; }
    super.disconnectedCallback();
  }

  protected willUpdate(): void {
    // Fire the one-shot load as soon as hass is available (connectedCallback
    // may run before the hass property is set).
    if (this.hass && !this._loadStarted) {
      this._loadStarted = true;
      this._load();
    }
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    try {
      const s = await this.hass.callWS<{ sources: Sources }>({ type: 'smarthomeshop/energy_sources' });
      this._sources = s.sources || {};
    } catch { /* none */ }
    try { this._account = await this.hass.callWS({ type: 'smarthomeshop/account' }); } catch { /* none */ }
    try { const p = await this.hass.callWS<{ entities: Record<string, string | null> }>({ type: 'smarthomeshop/prices/entities' }); this._priceEntity = p.entities?.electricity_price || undefined; } catch { /* none */ }
    try { const r = await this.hass.callWS<{ schedules: any[] }>({ type: 'smarthomeshop/schedules' }); this._schedules = r.schedules || []; } catch { /* none */ }
    try { const b = await this.hass.callWS<{ battery: any }>({ type: 'smarthomeshop/battery' }); this._battery = b.battery || {}; } catch { /* none */ }
    await this._loadHistory();
    this._loaded = true;
  }

  // Last 2 hours of grid (and solar/battery, if mapped) power for the trend
  // chart. Signs and kW->W scale match the live tiles.
  private async _loadHistory(): Promise<void> {
    const ids = [this._netEntity(), this._sources.solar_power, this._sources.battery_power].filter(Boolean) as string[];
    if (!ids.length) { this._history = {}; return; }
    try {
      const start = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      const res = await this.hass.callWS<Record<string, any[]>>({
        type: 'history/history_during_period', start_time: start,
        entity_ids: ids, minimal_response: true, no_attributes: true,
      });
      const out: Record<string, Array<{ t: number; v: number }>> = {};
      for (const id of ids) {
        const invert = id === this._sources.solar_power ? !!this._sources.solar_invert
          : id === this._sources.battery_power ? !!this._sources.battery_invert : false;
        const scale = this._scale(id);
        out[id] = (res[id] || []).map((p: any) => ({
          t: Math.round((p.lu ?? p.lc ?? p.last_updated ?? 0) * 1000),
          v: (invert ? -1 : 1) * scale * Number(p.s ?? p.state),
        })).filter(p => Number.isFinite(p.v) && p.t > 0);
      }
      this._history = out;
    } catch { /* history unavailable */ }
  }

  private _netEntity(): string | undefined {
    return Object.keys(this.hass.states || {})
      .find(e => e.startsWith('sensor.') && e.includes('_net_grid_power'));
  }

  private _scale(entityId?: string): number {
    const u = String((entityId && this.hass.states[entityId]?.attributes?.unit_of_measurement) || '');
    return /^kw$/i.test(u) ? 1000 : 1;  // kW -> W (do not match kWh)
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
    if (w === null) return { v: '-', u: '' };
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

  private _priceRows(which: 'today' | 'tomorrow'): Array<{ start: string; consumer: number }> {
    const attrs = this._priceEntity ? this.hass.states[this._priceEntity]?.attributes : undefined;
    const arr = which === 'today' ? attrs?.prices_today : attrs?.prices_tomorrow;
    return Array.isArray(arr) ? arr.filter((r: any) => r && typeof r.consumer === 'number') : [];
  }

  // A day-ahead hourly price bar chart: cheapest hours green, most expensive
  // red, a dashed marker on the current hour, a left axis, and a hover tooltip
  // per bar showing the hour and its price.
  private _priceChart(rows: Array<{ start: string; consumer: number }>) {
    const W = 720, H = 178, x0 = 42, x1 = 712, y0 = 12, yb = 150;
    const n = rows.length;
    const vals = rows.map(r => r.consumer);
    const min = Math.min(...vals), max = Math.max(...vals);
    const yMax = (max <= 0 ? 0.01 : max) * 1.06;
    const yMin = Math.min(0, min) * 1.06;
    const sY = (v: number) => y0 + (yMax - v) / (yMax - yMin) * (yb - y0);
    const zeroY = sY(0);
    const barW = (x1 - x0) / n;
    const now = new Date();
    const nowIdx = rows.findIndex(r => {
      const s = new Date(r.start).getTime();
      return s <= now.getTime() && s + 3600000 > now.getTime();
    });
    const tier = (v: number) => {
      const p = max === min ? 0.5 : (v - min) / (max - min);
      return p <= 0.34 ? '#22c55e' : p <= 0.67 ? '#f59e0b' : '#ef4444';
    };
    const ticks = yMin < 0 ? [yMax, 0, yMin] : [yMax, yMax / 2, 0];
    const hov = this._hoverBar >= 0 && this._hoverBar < n ? this._hoverBar : -1;

    return html`
      <div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Hourly electricity price"
          @mouseleave=${() => { this._hoverBar = -1; }}>
        <line class="axis" x1=${x0} y1=${y0} x2=${x0} y2=${yb}></line>
        ${ticks.map(t => svg`
          <line class="grid" x1=${x0} y1=${sY(t)} x2=${x1} y2=${sY(t)}></line>
          <text x=${x0 - 5} y=${sY(t) + 3} text-anchor="end">${t.toFixed(2)}</text>`)}
        ${rows.map((r, i) => {
          const top = sY(r.consumer);
          const ry = Math.min(zeroY, top);
          const rh = Math.max(1.5, Math.abs(top - zeroY));
          return svg`<rect x=${x0 + i * barW + 1} y=${ry} width=${Math.max(1, barW - 2)} height=${rh} rx="1.5" fill=${tier(r.consumer)} opacity=${i === nowIdx || i === hov ? 1 : 0.5}></rect>`;
        })}
        ${nowIdx >= 0 ? svg`<line class="nowline" x1=${x0 + nowIdx * barW + barW / 2} y1=${y0} x2=${x0 + nowIdx * barW + barW / 2} y2=${yb}></line>` : nothing}
        ${[0, 6, 12, 18].map(h => svg`<text x=${x0 + h * barW + barW / 2} y=${H - 4} text-anchor="middle">${String(h).padStart(2, '0')}:00</text>`)}
        ${rows.map((r, i) => svg`<rect class="hit" x=${x0 + i * barW} y=${y0} width=${barW} height=${yb - y0}
          @mouseenter=${() => { this._hoverBar = i; }}><title>${r.start.slice(11, 16)}  EUR ${r.consumer.toFixed(3)}</title></rect>`)}
        ${hov >= 0 ? this._priceTip(rows[hov], x0 + hov * barW + barW / 2, x0, x1, y0) : nothing}
      </svg></div>`;
  }

  private _priceTip(row: { start: string; consumer: number }, cx: number, x0: number, x1: number, y0: number) {
    const tw = 74, th = 30;
    const tx = Math.max(x0 + tw / 2, Math.min(x1 - tw / 2, cx));
    return svg`
      <g pointer-events="none">
        <rect class="tip-bg" x=${tx - tw / 2} y=${y0} width=${tw} height=${th} rx="4"></rect>
        <text class="tip-h" x=${tx} y=${y0 + 12} text-anchor="middle">${row.start.slice(11, 16)}</text>
        <text class="tip-p" x=${tx} y=${y0 + 24} text-anchor="middle">EUR ${row.consumer.toFixed(3)}</text>
      </g>`;
  }

  private _renderPriceChart() {
    const today = this._priceRows('today');
    const tomorrow = this._priceRows('tomorrow');
    if (!today.length && !tomorrow.length) return nothing;
    const rows = this._priceTab === 'tomorrow' && tomorrow.length ? tomorrow : today;
    if (!rows.length) return nothing;
    return html`
      <div class="section-label">Price ${this._priceTab === 'tomorrow' ? 'tomorrow' : 'today'}</div>
      <div class="chart-card">
        <div class="chart-head">
          <span class="chart-title">Electricity price per hour (EUR/kWh)</span>
          <div class="chart-legend"><span><i style="background:#22c55e"></i>cheap</span><span><i style="background:#ef4444"></i>expensive</span></div>
        </div>
        ${this._priceChart(rows)}
        <div style="display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap;">
          ${tomorrow.length ? html`
            <div class="seg">
              <button class=${this._priceTab === 'today' ? 'on' : ''} @click=${() => { this._priceTab = 'today'; this._hoverBar = -1; }}>Today</button>
              <button class=${this._priceTab === 'tomorrow' ? 'on' : ''} @click=${() => { this._priceTab = 'tomorrow'; this._hoverBar = -1; }}>Tomorrow</button>
            </div>` : nothing}
          <a class="chart-link" href=${EnergyHub.APP_STATS_URL} target="_blank" rel="noopener">
            More statistics <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
        </div>
      </div>`;
  }

  private _renderPowerChart() {
    const net = this._netEntity();
    const series = [
      { id: net, label: 'Grid', color: '#4361ee' },
      { id: this._sources.solar_power, label: 'Solar', color: '#eab308' },
      { id: this._sources.battery_power, label: 'Battery', color: '#10b981' },
    ].filter(x => x.id && (this._history[x.id]?.length ?? 0) > 1) as Array<{ id: string; label: string; color: string }>;
    if (!series.length) return nothing;

    const W = 720, H = 176, x0 = 44, x1 = 712, y0 = 12, y1 = 150;
    const pts = series.flatMap(s => this._history[s.id]);
    const tMin = Math.min(...pts.map(p => p.t)), tMax = Math.max(...pts.map(p => p.t));
    const vMax = Math.max(0, ...pts.map(p => p.v)) * 1.08 || 1;
    const vMin = Math.min(0, ...pts.map(p => p.v)) * 1.08;
    const sX = (t: number) => tMax === tMin ? x1 : x0 + (t - tMin) / (tMax - tMin) * (x1 - x0);
    const sY = (v: number) => y0 + (vMax - v) / (vMax - vMin) * (y1 - y0);
    const zeroY = sY(0);
    const fmtY = (v: number) => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));

    return html`
      <div class="section-label">Power - last 2 hours</div>
      <div class="chart-card">
        <div class="chart-head">
          <span class="chart-title">Live power (W)</span>
          <div class="chart-legend">${series.map(s => html`<span><i style="background:${s.color}"></i>${s.label}</span>`)}</div>
        </div>
        <div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Power over the last 2 hours">
          <line class="zero" x1=${x0} y1=${zeroY} x2=${x1} y2=${zeroY}></line>
          <text x=${x0 - 6} y=${y0 + 4} text-anchor="end">${fmtY(vMax)}</text>
          <text x=${x0 - 6} y=${zeroY + 3} text-anchor="end">0</text>
          ${vMin < 0 ? svg`<text x=${x0 - 6} y=${y1} text-anchor="end">${fmtY(vMin)}</text>` : nothing}
          ${series.map(s => {
            const d = this._history[s.id].map((p, i) => `${i === 0 ? 'M' : 'L'}${sX(p.t).toFixed(1)},${sY(p.v).toFixed(1)}`).join(' ');
            return svg`<path d=${d} fill="none" stroke=${s.color} stroke-width="2" stroke-linejoin="round"></path>`;
          })}
        </svg></div>
      </div>`;
  }

  protected render() {
    if (!this._loaded) return nothing;
    const net = this._netEntity();
    const s = this._sources;

    const grid = this._num(net);                                   // + import / - export
    const solar = s.solar_power ? Math.max(0, this._num(s.solar_power, s.solar_invert) ?? 0) : null;
    const batt = s.battery_power ? this._num(s.battery_power, s.battery_invert) : null; // + discharge / - charge
    const soc = this._num(s.battery_soc);
    // Home consumption = solar + net grid + signed battery. Only trustworthy
    // when the grid and every mapped contributor is available; a dead sensor
    // must not silently count as 0, and it can never be negative.
    const contributorDead = this._isDead(net)
      || (!!s.solar_power && this._isDead(s.solar_power))
      || (!!s.battery_power && this._isDead(s.battery_power));
    const house = (grid !== null && !contributorDead)
      ? Math.max(0, grid + (solar ?? 0) + (batt ?? 0))
      : null;

    const cur = this._account?.current;
    const sum = this._account?.summary;
    const priceOk = this._account?.status === 'ok';
    // Read the live schedule sensor state so the count updates without a refetch.
    const activeSchedules = this._schedules.filter(x =>
      x.entity_id ? this.hass.states[x.entity_id]?.state === 'on' : x.active).length;
    const battOn = !!this._battery?.control_entity;

    return html`
      <div class="title">Energy</div>
      <div class="subtitle">Your whole home at a glance - grid, solar and battery, with your dynamic price.</div>

      <div class="section-label">Live now</div>
      <div class="flow">
        ${this._node({
          label: 'Home', icon: 'mdi:home', color: '#4361ee', value: house,
          dead: house === null && contributorDead,
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

      ${priceOk ? this._renderPriceChart() : nothing}

      ${this._renderPowerChart()}

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
