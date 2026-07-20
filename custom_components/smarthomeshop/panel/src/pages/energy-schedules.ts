import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, DeviceEntity } from '../types';

// Deadline schedules (smart-energy Phase 2): "have this load done by <time>,
// it needs <N> hours" → the integration computes a binary sensor that is on
// during the cheapest hours that still hit the deadline (deadline beats price),
// and this UI generates a safe HA automation that runs the target on it.

interface Schedule {
  id: string;
  name: string;
  target_entity: string;
  hours: number;
  ready_by: string;
  earliest?: string | null;
  interruptible?: boolean;
  guard?: boolean;
  load_power?: number | null;
  enabled?: boolean;
  entity_id?: string | null;
  active?: boolean;
  next_start?: string | null;
  forced?: boolean;
  reason?: string;
}

interface Guard { available: string; loadPower: number; }

const dom = (e: string): string => e.split('.')[0];
const autoId = (id: string) => `shs_sched_${id.slice(0, 8)}`;
const turn = (target: string, on: boolean) => ({
  service: `${dom(target)}.${on ? 'turn_on' : 'turn_off'}`,
  target: { entity_id: target },
});

// Generated automation: runs the target while its schedule sensor is on.
// - watchdog force-offs after a safety cap;
// - boot re-asserts the correct state on restart;
// - there is no blanket default, so 'unavailable'/'unknown' (e.g. the price
//   feed dropping out) holds the load's last state instead of cutting it.
// With a fuse guard, the headroom check is START-ONLY: an already-running load
// is kept on regardless of headroom (its own draw lowers the headroom), so it
// never switches itself off; a load that is off only starts when there is room.
function scheduleAutomation(alias: string, flag: string, target: string, watchdogHours: number, guard?: Guard | null) {
  const trigger: Record<string, unknown>[] = [
    { platform: 'state', entity_id: flag, to: 'on', id: 'edge_on' },
    { platform: 'state', entity_id: flag, to: 'off', id: 'edge_off' },
    { platform: 'homeassistant', event: 'start', id: 'boot' },
    { platform: 'state', entity_id: target, to: 'on', for: { hours: watchdogHours }, id: 'watchdog' },
  ];
  const branches: Record<string, unknown>[] = [
    { conditions: [{ condition: 'trigger', id: 'watchdog' }], sequence: [turn(target, false)] },
    { conditions: [{ condition: 'state', entity_id: flag, state: 'off' }], sequence: [turn(target, false)] },
  ];
  if (guard) {
    // Retry the start when headroom recovers.
    trigger.push({ platform: 'numeric_state', entity_id: guard.available, above: guard.loadPower - 1, id: 'headroom' });
    // Keep an already-running load on without re-checking headroom.
    branches.push({ conditions: [{ condition: 'state', entity_id: flag, state: 'on' }, { condition: 'state', entity_id: target, state: 'on' }], sequence: [turn(target, true)] });
    // Start only when the load is off and there is room for it.
    branches.push({ conditions: [
      { condition: 'state', entity_id: flag, state: 'on' },
      { condition: 'state', entity_id: target, state: 'off' },
      { condition: 'numeric_state', entity_id: guard.available, above: guard.loadPower - 1 },
    ], sequence: [turn(target, true)] });
  } else {
    branches.push({ conditions: [{ condition: 'state', entity_id: flag, state: 'on' }], sequence: [turn(target, true)] });
  }
  return {
    alias, description: 'Created with the SmartHomeShop.io panel · smart schedule', mode: 'restart',
    trigger, condition: [], action: [{ choose: branches }],
  };
}

@customElement('shs-energy-schedules')
export class EnergySchedules extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public deviceId = '';
  @property() public deviceName = '';
  @property({ attribute: false }) public deviceEntities: DeviceEntity[] = [];

  @state() private _pricesOk = false;
  @state() private _loaded = false;
  @state() private _schedules: Schedule[] = [];
  @state() private _modal = false;
  @state() private _busy = false;
  @state() private _error = '';
  // form
  @state() private _editId = '';
  @state() private _name = '';
  @state() private _target = '';
  @state() private _hours = 4;
  @state() private _readyBy = '07:00';
  @state() private _earliest = '';
  @state() private _interruptible = true;
  @state() private _guard = false;
  @state() private _loadPower = 2000;

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; margin-top: 24px; }
    .head { display: flex; align-items: center; gap: 10px; margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .add-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .add-btn ha-icon { --mdc-icon-size: 15px; }
    .sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin: -4px 0 12px; }
    .item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 10px; margin-bottom: 8px; }
    .item-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(14,165,233,.12); color: #0ea5e9; flex-shrink: 0; }
    .item-main { flex: 1; min-width: 0; }
    .item-name { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .item-meta { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
    .badge { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
    .badge.on { background: rgba(34,197,94,.15); color: #16a34a; }
    .badge.off { background: var(--secondary-background-color); color: var(--secondary-text-color); }
    .badge.forced { background: rgba(245,158,11,.15); color: #b45309; }
    .iconbtn { background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .iconbtn:hover { color: var(--primary-text-color); }
    .iconbtn.del:hover { color: #ef4444; }
    .iconbtn ha-icon { --mdc-icon-size: 18px; }
    .empty { font-size: 13px; color: var(--secondary-text-color); }
    .warn { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: 10px; padding: 12px 14px; margin: 8px 0; font-size: 13px; color: var(--primary-text-color); }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-body { padding: 18px 20px; }
    .field { margin-bottom: 14px; }
    label.f { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .4px; margin: 0 0 6px; }
    .field .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    select, input[type="text"], input[type="number"], input[type="time"] { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    select:focus, input:focus { outline: none; border-color: var(--shs-primary); }
    .two { display: flex; gap: 10px; }
    .two > div { flex: 1; }
    .check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--primary-text-color); }
    .check input { width: auto; }
    .row { display: flex; align-items: center; gap: 8px; }
    .row input { max-width: 140px; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); }
    .btn-ghost { padding: 9px 16px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--primary-text-color); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; }
    .create-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .create-btn:disabled { opacity: .5; cursor: default; }
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
      if (this._pricesOk) await this._loadSchedules();
    } catch (err) { console.error('energy-schedules: load failed', err); }
    this._loaded = true;
  }

  private async _loadSchedules(): Promise<void> {
    const res = await this.hass.callWS<{ schedules: Schedule[] }>({ type: 'smarthomeshop/schedules' });
    this._schedules = res.schedules || [];
  }

  private _switchOptions(excludeUsed = true): Array<{ value: string; label: string }> {
    const used = new Set(
      this._schedules.filter(s => s.id !== this._editId).map(s => s.target_entity)
    );
    const out = [{ value: '', label: 'Select a device...' }];
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      const d = dom(entityId);
      if (d !== 'switch' && d !== 'input_boolean') continue;
      if (excludeUsed && used.has(entityId) && entityId !== this._target) continue;
      out.push({ value: entityId, label: (st.attributes?.friendly_name as string) || entityId });
    }
    return [out[0], ...out.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
  }

  private _openModal(s?: Schedule): void {
    this._error = '';
    this._editId = s?.id || '';
    this._name = s?.name || '';
    this._target = s?.target_entity || '';
    this._hours = s?.hours ?? 4;
    this._readyBy = s?.ready_by || '07:00';
    this._earliest = s?.earliest || '';
    this._interruptible = s?.interruptible ?? true;
    this._guard = s?.guard ?? false;
    this._loadPower = s?.load_power ?? 2000;
    this._modal = true;
  }

  private _availableEntity(): string | undefined {
    // Prefer this device's own meter, fall back to any P1 meter; only usable
    // when it currently has a numeric reading (a non-numeric state would block
    // guarded starts with no basis).
    const ent = this.deviceEntities.find(e => e.entity_id.includes('available_grid_power'))?.entity_id
      || Object.keys(this.hass.states || {}).find(e => e.includes('available_grid_power'));
    if (!ent) return undefined;
    const st = this.hass.states[ent];
    return st && Number.isFinite(Number(st.state)) ? ent : undefined;
  }

  private async _save(): Promise<void> {
    if (this._busy) return;
    if (!this.hass.user?.is_admin) { this._error = 'Administrator required.'; return; }
    const hours = Math.round(this._hours);
    if (!this._name.trim()) { this._error = 'Give the schedule a name.'; return; }
    if (!this._target) { this._error = 'Pick a device to run.'; return; }
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(this._readyBy)) { this._error = 'Enter a valid ready-by time.'; return; }
    if (!Number.isFinite(hours) || hours < 1 || hours > 24) { this._error = 'Hours needed must be 1-24.'; return; }
    this._busy = true;
    this._error = '';
    try {
      const avail = this._availableEntity();
      const guardOn = this._guard && !!avail;
      const res = await this.hass.callWS<{ schedule: Schedule }>({
        type: 'smarthomeshop/schedules/set',
        ...(this._editId ? { schedule_id: this._editId } : {}),
        name: this._name.trim(),
        target_entity: this._target,
        hours,
        ready_by: this._readyBy,
        earliest: this._earliest || null,
        interruptible: this._interruptible,
        guard: guardOn,
        load_power: Number.isFinite(this._loadPower) && this._loadPower > 0
          ? Math.max(1, Math.round(this._loadPower)) : null,
      });
      const sched = res.schedule;
      this._editId = sched.id; // so a retry updates instead of duplicating
      // The sensor is created on the same tick; poll briefly for its entity_id.
      let flag = sched.entity_id;
      for (let i = 0; i < 8 && !flag; i++) {
        await new Promise(r => window.setTimeout(r, 400));
        await this._loadSchedules();
        flag = this._schedules.find(s => s.id === sched.id)?.entity_id;
      }
      if (!flag) {
        this._error = 'Schedule saved, but its sensor is not ready yet. Reopen and save again to create the automation.';
        await this._loadSchedules();
        this._busy = false;
        return;
      }
      const guardObj = (guardOn && avail) ? { available: avail, loadPower: Math.max(1, Math.round(this._loadPower)) } : null;
      await this.hass.callApi('POST', `config/automation/config/${autoId(sched.id)}`,
        scheduleAutomation(`${this.deviceName || 'Schedule'} - ${sched.name}`, flag, this._target, hours + 2, guardObj));
      await this._loadSchedules();
      this._modal = false;
    } catch (err: any) {
      console.error('energy-schedules: save failed', err);
      this._error = `Could not save. ${err?.message || ''}`;
    }
    this._busy = false;
  }

  private async _delete(s: Schedule): Promise<void> {
    if (!this.hass.user?.is_admin) return;
    if (!window.confirm(`Delete "${s.name}" and its automation?`)) return;
    try {
      await this.hass.callWS({ type: 'smarthomeshop/schedules/delete', schedule_id: s.id });
      // Remove the generated automation too, so it can't keep steering the load.
      try {
        await this.hass.callApi('DELETE', `config/automation/config/${autoId(s.id)}`);
      } catch { /* already gone / never created */ }
      await this._loadSchedules();
    } catch (err) {
      console.error('energy-schedules: delete failed', err);
      this._error = 'Could not delete the schedule. Administrator rights are required.';
    }
  }

  private _live(s: Schedule): { active: boolean; next_start?: string | null; forced?: boolean } {
    const st = s.entity_id ? this.hass.states[s.entity_id] : undefined;
    if (st) {
      return {
        active: st.state === 'on',
        next_start: st.attributes?.next_start as string | undefined,
        forced: st.attributes?.forced as boolean | undefined,
      };
    }
    return { active: !!s.active, next_start: s.next_start, forced: s.forced };
  }

  private _hm(iso?: string | null): string {
    if (!iso) return '';
    try {
      const tz = this.hass.config?.time_zone;
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', ...(tz ? { timeZone: tz } : {}) });
    } catch { return ''; }
  }

  private _targetName(entityId: string): string {
    return (this.hass.states[entityId]?.attributes?.friendly_name as string) || entityId;
  }

  private _renderItem(s: Schedule, isAdmin: boolean) {
    const live = this._live(s);
    const targetOn = this.hass.states[s.target_entity]?.state === 'on';
    const blocked = !!s.guard && live.active && !targetOn;
    const badge = blocked
      ? html`<span class="badge forced">Waiting for capacity</span>`
      : live.active
        ? (live.forced ? html`<span class="badge forced">Running (deadline)</span>` : html`<span class="badge on">Running now</span>`)
        : html`<span class="badge off">${live.next_start ? `Next ${this._hm(live.next_start)}` : 'Waiting'}</span>`;
    return html`
      <div class="item">
        <div class="item-icon"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
        <div class="item-main">
          <div class="item-name">${s.name}</div>
          <div class="item-meta">${this._targetName(s.target_entity)} · ${s.hours}h · ready by ${s.ready_by}${s.earliest ? ` · from ${s.earliest}` : ''}${s.interruptible === false ? ' · one block' : ''}${s.guard ? ' · fuse-safe' : ''}</div>
        </div>
        ${badge}
        ${isAdmin ? html`
          <button class="iconbtn" title="Edit" @click=${() => this._openModal(s)}><ha-icon icon="mdi:pencil-outline"></ha-icon></button>
          <button class="iconbtn del" title="Delete" @click=${() => this._delete(s)}><ha-icon icon="mdi:trash-can-outline"></ha-icon></button>
        ` : nothing}
      </div>`;
  }

  private _renderModal() {
    if (!this._modal) return nothing;
    return html`
      <div class="modal-backdrop" @click=${() => { this._modal = false; }}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-head">
            <div class="item-icon"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
            <div class="modal-title">${this._editId ? 'Edit schedule' : 'New deadline schedule'}</div>
            <button class="modal-x" @click=${() => { this._modal = false; }}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label class="f">Name</label>
              <input type="text" placeholder="e.g. Car ready in the morning" .value=${this._name}
                @input=${(e: Event) => { this._name = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="field">
              <label class="f">Device to run</label>
              <select @change=${(e: Event) => { this._target = (e.target as HTMLSelectElement).value; }}>
                ${this._switchOptions().map(o => html`<option value=${o.value} ?selected=${o.value === this._target}>${o.label}</option>`)}
              </select>
              <div class="help">A switch or smart plug (EV charger, appliance). It is fully controlled by this schedule. Devices already used by another schedule are hidden.</div>
            </div>
            <div class="two">
              <div class="field">
                <label class="f">Hours needed</label>
                <input type="number" min="1" max="24" step="1" .value=${String(this._hours)}
                  @input=${(e: Event) => { this._hours = parseFloat((e.target as HTMLInputElement).value); }} />
              </div>
              <div class="field">
                <label class="f">Ready by</label>
                <input type="time" .value=${this._readyBy}
                  @input=${(e: Event) => { this._readyBy = (e.target as HTMLInputElement).value; }} />
              </div>
            </div>
            <div class="field">
              <label class="f">Not before (optional)</label>
              <input type="time" .value=${this._earliest}
                @input=${(e: Event) => { this._earliest = (e.target as HTMLInputElement).value; }} />
              <div class="help">Leave empty to allow starting any time before the deadline. The deadline is always met while prices are available.</div>
            </div>
            <div class="field">
              <label class="check">
                <input type="checkbox" ?checked=${!this._interruptible}
                  @change=${(e: Event) => { this._interruptible = !(e.target as HTMLInputElement).checked; }} />
                Run in one continuous block (for loads that can't pause, e.g. a dishwasher)
              </label>
            </div>
            <div class="field">
              <label class="f">This load draws about (optional)</label>
              <div class="row"><input type="number" min="100" max="25000" step="100" .value=${String(this._loadPower)}
                @input=${(e: Event) => { this._loadPower = parseFloat((e.target as HTMLInputElement).value); }} /><span style="font-size:12px;color:var(--secondary-text-color);">W</span></div>
              <div class="help">Used for the smart-savings estimate and the fuse guard below.</div>
            </div>
            ${this._availableEntity() ? html`
              <div class="field">
                <label class="check">
                  <input type="checkbox" ?checked=${this._guard}
                    @change=${(e: Event) => { this._guard = (e.target as HTMLInputElement).checked; }} />
                  Don't start if it would overload my main fuse
                </label>
                ${this._guard ? html`
                  <div class="help">The schedule waits for enough free capacity on your P1 connection before switching this on. A load that is already running is never cut off. If there is never enough capacity, fuse safety wins and the deadline can be delayed or missed.</div>` : nothing}
              </div>
            ` : nothing}
            ${this._error ? html`<div class="warn">${this._error}</div>` : nothing}
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click=${() => { this._modal = false; }}>Cancel</button>
            <button class="create-btn" ?disabled=${this._busy} @click=${this._save}>
              <ha-icon icon="mdi:check"></ha-icon> ${this._busy ? 'Saving...' : (this._editId ? 'Save schedule' : 'Create schedule')}
            </button>
          </div>
        </div>
      </div>`;
  }

  protected render() {
    if (!this._loaded || !this._pricesOk) return nothing;
    const isAdmin = !!this.hass.user?.is_admin;
    return html`
      <div class="head">
        <span class="head-title">Deadline schedules</span>
        ${isAdmin ? html`<button class="add-btn" @click=${() => this._openModal()}><ha-icon icon="mdi:plus"></ha-icon> Add schedule</button>` : nothing}
      </div>
      <div class="sub">
        Have a load finished by a set time in the cheapest hours - e.g. "car ready by 07:00, needs 4 hours".
        The deadline is met whenever the price feed is available (unless the optional fuse guard is waiting for free capacity).
      </div>
      ${this._error && !this._modal ? html`<div class="warn">${this._error}</div>` : nothing}
      ${this._schedules.length === 0
        ? html`<div class="empty">No schedules yet. Add one to charge or run a device by a deadline in the cheapest hours.</div>`
        : this._schedules.map(s => this._renderItem(s, isAdmin))}
      ${this._renderModal()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-energy-schedules': EnergySchedules;
  }
}
