import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, DeviceEntity } from '../types';

type TriggerKind = 'above' | 'below' | 'to_on' | 'to_off';
type Group = 'climate' | 'water' | 'energy';

interface Scenario {
  key: string;
  group: Group;
  title: string;
  desc: string;
  icon: string;
  color: string;
  match: { domain: 'sensor' | 'binary_sensor'; suffix: string[]; excl?: string[] };
  kind: TriggerKind;
  threshold?: number;
  unit?: string;
  forMin?: number;
  msgTitle: string; // {room}
  msg: string; // {room}, {value}
}

// Products mapped to the scenario groups they support
const PRODUCT_GROUPS: Record<string, Group[]> = {
  ultimatesensor: ['climate'],
  ultimatesensor_mini: ['climate'],
  ceilsense: ['climate'],
  waterp1meterkit: ['water', 'energy'],
  watermeterkit: ['water'],
  waterflowkit: ['water'],
  p1meterkit: ['energy'],
};

const SCENARIOS: Scenario[] = [
  // ---- Climate ----
  {
    key: 'co2_high', group: 'climate', title: 'High CO₂', color: '#22c55e',
    desc: 'Notify when CO₂ stays too high — time to ventilate.',
    icon: 'mdi:molecule-co2', match: { domain: 'sensor', suffix: ['co2'], excl: ['calibrat', 'manual', 'offset', 'target'] },
    kind: 'above', threshold: 1000, unit: 'ppm', forMin: 5,
    msgTitle: 'High CO₂ in {room}', msg: 'CO₂ is {value} ppm. Open a window to get some fresh air.',
  },
  {
    key: 'pm25_high', group: 'climate', title: 'Poor air quality (PM2.5)', color: '#f59e0b',
    desc: 'Notify when fine dust rises above a healthy level.',
    icon: 'mdi:air-filter', match: { domain: 'sensor', suffix: ['pm_2_5', 'pm2_5', 'pm25'], excl: ['number', 'count'] },
    kind: 'above', threshold: 35, unit: 'µg/m³', forMin: 5,
    msgTitle: 'Poor air quality in {room}', msg: 'Fine dust (PM2.5) is {value} µg/m³.',
  },
  {
    key: 'voc_high', group: 'climate', title: 'High VOC', color: '#a855f7',
    desc: 'Notify when chemical pollutants (VOC) rise.',
    icon: 'mdi:scent', match: { domain: 'sensor', suffix: ['voc_index', 'voc'], excl: ['calibrat'] },
    kind: 'above', threshold: 250, unit: '', forMin: 5,
    msgTitle: 'High VOC in {room}', msg: 'VOC index is {value}. Ventilate the room.',
  },
  {
    key: 'humid_high', group: 'climate', title: 'Too humid', color: '#0096c7',
    desc: 'Notify at high humidity (risk of mould).',
    icon: 'mdi:water-percent', match: { domain: 'sensor', suffix: ['humidity'], excl: ['offset', 'calibrat'] },
    kind: 'above', threshold: 70, unit: '%', forMin: 15,
    msgTitle: 'High humidity in {room}', msg: 'Humidity is {value}%. Ventilate to prevent mould.',
  },
  {
    key: 'humid_low', group: 'climate', title: 'Too dry', color: '#94a3b8',
    desc: 'Notify when the air gets very dry.',
    icon: 'mdi:water-off', match: { domain: 'sensor', suffix: ['humidity'], excl: ['offset', 'calibrat'] },
    kind: 'below', threshold: 30, unit: '%', forMin: 15,
    msgTitle: 'Dry air in {room}', msg: 'Humidity is only {value}%.',
  },
  {
    key: 'temp_high', group: 'climate', title: 'Too warm', color: '#ef4444',
    desc: 'Notify when the temperature climbs too high.',
    icon: 'mdi:thermometer-high', match: { domain: 'sensor', suffix: ['temperature'], excl: ['offset', 'calibrat'] },
    kind: 'above', threshold: 27, unit: '°C', forMin: 10,
    msgTitle: 'It is warm in {room}', msg: 'Temperature is {value}°C.',
  },
  {
    key: 'temp_low', group: 'climate', title: 'Too cold', color: '#38bdf8',
    desc: 'Notify when it gets cold in the room.',
    icon: 'mdi:thermometer-low', match: { domain: 'sensor', suffix: ['temperature'], excl: ['offset', 'calibrat'] },
    kind: 'below', threshold: 16, unit: '°C', forMin: 10,
    msgTitle: 'It is cold in {room}', msg: 'Temperature is {value}°C.',
  },
  {
    key: 'presence_on', group: 'climate', title: 'Motion detected', color: '#4361ee',
    desc: 'Notify on presence — handy as an away alarm.',
    icon: 'mdi:motion-sensor', match: { domain: 'binary_sensor', suffix: ['occupancy'], excl: ['zone'] },
    kind: 'to_on', msgTitle: 'Motion in {room}', msg: '{room} detected presence.',
  },
  {
    key: 'vacant', group: 'climate', title: 'Room became empty', color: '#64748b',
    desc: 'Notify when nobody has been present for a while.',
    icon: 'mdi:motion-sensor-off', match: { domain: 'binary_sensor', suffix: ['occupancy'], excl: ['zone'] },
    kind: 'to_off', forMin: 10, msgTitle: '{room} is empty', msg: 'No presence in {room} for {min} minutes.',
  },
  // ---- Water ----
  {
    key: 'leak_alarm', group: 'water', title: 'Possible water leak', color: '#ef4444',
    desc: 'Notify when smart leak detection flags unusual usage.',
    icon: 'mdi:water-alert', match: { domain: 'binary_sensor', suffix: ['leak_alarm_cc', 'smart_leak_detection_cc'] },
    kind: 'to_on', msgTitle: 'Possible water leak ({room})', msg: 'Smart leak detection flagged unusual water usage.',
  },
  {
    key: 'hw_leak', group: 'water', title: 'Water leak sensor wet', color: '#dc2626',
    desc: 'Notify the moment the hardware leak sensor detects water.',
    icon: 'mdi:water', match: { domain: 'binary_sensor', suffix: ['water_leak_sensor', 'water_leak'] },
    kind: 'to_on', msgTitle: '💧 Water detected!', msg: 'The water leak sensor is wet — check immediately.',
  },
  {
    key: 'night_usage', group: 'water', title: 'Night-time water usage', color: '#6366f1',
    desc: 'Notify when water is used during the night.',
    icon: 'mdi:weather-night', match: { domain: 'binary_sensor', suffix: ['night_usage_cc'] },
    kind: 'to_on', msgTitle: 'Night-time water usage ({room})', msg: 'Water is being used during the night.',
  },
  {
    key: 'continuous', group: 'water', title: 'Continuous water flow', color: '#f59e0b',
    desc: 'Notify when water flows non-stop (running tap or leak).',
    icon: 'mdi:water-pump', match: { domain: 'binary_sensor', suffix: ['continuous_flow_leak_cc', 'continuous_flow_cc'] },
    kind: 'to_on', msgTitle: 'Continuous water flow ({room})', msg: 'Water has been flowing non-stop — possible leak or running tap.',
  },
  {
    key: 'usage_high', group: 'water', title: 'High water usage today', color: '#0096c7',
    desc: 'Notify when today’s water usage passes a limit.',
    icon: 'mdi:cup-water', match: { domain: 'sensor', suffix: ['usage_today_cc'] },
    kind: 'above', threshold: 500, unit: 'L',
    msgTitle: 'High water usage today ({room})', msg: 'You have used {value} L today.',
  },
  // ---- Energy ----
  {
    key: 'power_high', group: 'energy', title: 'High power usage', color: '#f72585',
    desc: 'Notify when power draw stays above a limit.',
    icon: 'mdi:flash-alert', match: { domain: 'sensor', suffix: ['power_consumed'], excl: ['phase'] },
    kind: 'above', threshold: 3500, unit: 'W', forMin: 5,
    msgTitle: 'High power usage', msg: 'You are drawing {value} W right now.',
  },
  {
    key: 'fuse_near', group: 'energy', title: 'Close to fuse limit', color: '#e11d48',
    desc: 'Notify when a phase gets close to your main fuse.',
    icon: 'mdi:gauge-full', match: { domain: 'sensor', suffix: ['highest_phase_load_cc'] },
    kind: 'above', threshold: 80, unit: '%', forMin: 1,
    msgTitle: 'Close to fuse limit', msg: 'Phase load is at {value}% of your main fuse.',
  },
];

@customElement('shs-automations-page')
export class AutomationsPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public deviceId!: string;
  @property() public deviceName = '';
  @property() public productType = '';
  @state() private _entities: DeviceEntity[] = [];
  @state() private _related: string[] = [];
  @state() private _loading = true;
  @state() private _notifyTarget = 'persistent_notification.create';
  @state() private _thresholds: Record<string, number> = {};
  @state() private _created: Record<string, string> = {}; // scenario key -> automation id
  @state() private _busy = '';
  @state() private _error = '';
  @state() private _modalScenario: Scenario | null = null;
  @state() private _modalEntityId = '';

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; }
    .intro { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; margin-bottom: 20px; }
    .warn { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--primary-text-color); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; }
    .group-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); margin: 20px 0 12px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .card { display: flex; flex-direction: column; gap: 10px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .card-head { display: flex; align-items: flex-start; gap: 10px; }
    .card-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-icon ha-icon { --mdc-icon-size: 20px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .card-desc { font-size: 12px; color: var(--secondary-text-color); line-height: 1.4; margin-top: 2px; }
    .card-foot { display: flex; align-items: center; gap: 8px; margin-top: auto; }
    .create-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .create-btn:disabled { opacity: 0.5; cursor: default; }
    .create-btn ha-icon { --mdc-icon-size: 15px; }
    .created { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #22c55e; }
    .created a { color: var(--shs-primary); text-decoration: none; }
    .created a:hover { text-decoration: underline; }
    .existing { margin-top: 28px; }
    .existing-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 10px; margin-bottom: 8px; }
    .existing-name { flex: 1; font-size: 13.5px; color: var(--primary-text-color); }
    .existing-item a { font-size: 12.5px; color: var(--shs-primary); text-decoration: none; }
    .toggle { position: relative; width: 40px; height: 22px; border-radius: 11px; background: var(--divider-color); border: none; cursor: pointer; flex-shrink: 0; }
    .toggle.on { background: var(--shs-primary); }
    .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: transform 0.15s; }
    .toggle.on::after { transform: translateX(18px); }
    .empty { font-size: 13px; color: var(--secondary-text-color); }
    .config-hint { margin-top: 24px; font-size: 12px; color: var(--secondary-text-color); line-height: 1.5; opacity: 0.8; }
    .config-hint code { background: var(--secondary-background-color); padding: 1px 5px; border-radius: 4px; font-size: 11.5px; }
    .loading { padding: 40px; text-align: center; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 440px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); overflow: hidden; }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-sub { font-size: 12.5px; color: var(--secondary-text-color); margin-top: 1px; }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-x ha-icon { --mdc-icon-size: 20px; }
    .modal-body { padding: 18px 20px; }
    .modal-desc { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; margin: 0 0 16px; }
    .modal-label { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .modal-thresh { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .modal-thresh span { font-size: 13px; color: var(--secondary-text-color); }
    .modal-thresh input { flex: 1; max-width: 120px; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; text-align: right; }
    .modal-thresh input:focus { outline: none; border-color: var(--shs-primary); }
    .modal-unit { min-width: 30px; }
    .modal-select { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .modal-select:focus { outline: none; border-color: var(--shs-primary); }
    .modal-when { display: flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 12.5px; color: var(--secondary-text-color); }
    .modal-when ha-icon { --mdc-icon-size: 15px; color: var(--shs-primary); }
    .modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); }
    .btn-ghost { padding: 9px 16px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--primary-text-color); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; }
    .btn-ghost:hover { border-color: var(--secondary-text-color); }
    .modal-foot .create-btn { margin-left: 0; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  private async _load(): Promise<void> {
    this._loading = true;
    try {
      const result = await this.hass.callWS<{ entities: DeviceEntity[] }>({
        type: 'smarthomeshop/device/entities', device_id: this.deviceId,
      });
      this._entities = result.entities || [];
    } catch (err) { console.error('automations: failed to load entities', err); }
    await this._loadRelated();
    this._loading = false;
  }

  private async _loadRelated(): Promise<void> {
    // Same source HA uses for the device "Related" panel: any automation
    // that references this device or one of its entities.
    try {
      const res = await this.hass.callWS<Record<string, string[]>>({
        type: 'search/related', item_type: 'device', item_id: this.deviceId,
      });
      this._related = res.automation || [];
    } catch (err) {
      console.error('automations: search/related failed', err);
      this._related = [];
    }
  }

  private _notifyOptions(): Array<{ value: string; label: string }> {
    const opts = [{ value: 'persistent_notification.create', label: 'Home Assistant notification' }];
    const notify = (this.hass.services?.notify || {}) as Record<string, unknown>;
    for (const name of Object.keys(notify).sort()) {
      if (name === 'persistent_notification') continue;
      const pretty = name.replace(/^mobile_app_/, '📱 ').replace(/_/g, ' ');
      opts.push({ value: `notify.${name}`, label: `Notify: ${pretty}` });
    }
    return opts;
  }

  private _findEntity(s: Scenario): string | null {
    const excl = s.match.excl || [];
    const cand = this._entities.filter(e =>
      e.entity_id.startsWith(s.match.domain + '.') &&
      !excl.some(x => e.entity_id.toLowerCase().includes(x))
    );
    for (const suf of s.match.suffix) {
      const hit = cand.find(e => e.entity_id.toLowerCase().endsWith(`_${suf}`));
      if (hit) return hit.entity_id;
    }
    return null;
  }

  private _threshold(s: Scenario): number {
    return this._thresholds[s.key] ?? s.threshold ?? 0;
  }

  private _buildConfig(s: Scenario, entityId: string) {
    const room = this.deviceName || 'the room';
    const valueTpl = `{{ states('${entityId}') }}`;
    const min = s.forMin ?? 0;
    const fill = (t: string) => t
      .replace(/{room}/g, room)
      .replace(/{value}/g, valueTpl)
      .replace(/{min}/g, String(min));

    let trigger: Record<string, unknown>;
    if (s.kind === 'above' || s.kind === 'below') {
      trigger = {
        platform: 'numeric_state',
        entity_id: entityId,
        [s.kind]: this._threshold(s),
      };
      if (s.forMin) trigger.for = { minutes: s.forMin };
    } else {
      trigger = { platform: 'state', entity_id: entityId, to: s.kind === 'to_on' ? 'on' : 'off' };
      if (s.forMin) trigger.for = { minutes: s.forMin };
    }

    const [domain, service] = this._notifyTarget.split('.');
    const action = { service: `${domain}.${service}`, data: { title: fill(s.msgTitle), message: fill(s.msg) } };

    return {
      alias: `${room} – ${s.title}`,
      description: `Created with the SmartHomeShop.io panel`,
      mode: 'single',
      trigger: [trigger],
      condition: [],
      action: [action],
    };
  }

  private _openModal(s: Scenario, entityId: string): void {
    this._error = '';
    this._modalScenario = s;
    this._modalEntityId = entityId;
  }

  private _closeModal(): void {
    this._modalScenario = null;
    this._modalEntityId = '';
  }

  private async _create(s: Scenario, entityId: string): Promise<boolean> {
    if (!this.hass.user?.is_admin) return false;
    this._busy = s.key;
    this._error = '';
    const id = `shs_${this.deviceId.slice(0, 6)}_${s.key}_${Date.now()}`;
    let ok = false;
    try {
      await this.hass.callApi('POST', `config/automation/config/${id}`, this._buildConfig(s, entityId));
      this._created = { ...this._created, [s.key]: id };
      // The new automation registers as an entity shortly after; refresh.
      window.setTimeout(() => this._loadRelated(), 1200);
      ok = true;
    } catch (err: any) {
      console.error('automations: create failed', err);
      this._error = `Could not create "${s.title}". ${err?.message || ''}`;
    }
    this._busy = '';
    return ok;
  }

  private async _confirmModal(): Promise<void> {
    if (!this._modalScenario) return;
    const ok = await this._create(this._modalScenario, this._modalEntityId);
    if (ok) this._closeModal();
  }

  private _existingAutomations(): Array<{ entityId: string; name: string; on: boolean; id?: string }> {
    const out = [];
    for (const entityId of this._related) {
      const st = this.hass.states[entityId];
      if (!st) continue;
      out.push({
        entityId,
        name: (st.attributes?.friendly_name as string) || entityId,
        on: st.state === 'on',
        id: st.attributes?.id as string | undefined,
      });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  private _scenarioAutomationId(s: Scenario): string | undefined {
    // An automation already exists for this scenario if one of the device's
    // related automations carries our exact alias.
    const alias = `${this.deviceName || 'the room'} – ${s.title}`;
    for (const entityId of this._related) {
      const st = this.hass.states[entityId];
      if (st && st.attributes?.friendly_name === alias) {
        return (st.attributes?.id as string | undefined) || undefined;
      }
    }
    return this._created[s.key];
  }

  private _renderScenario(s: Scenario) {
    const entityId = this._findEntity(s);
    if (!entityId) return nothing;
    const createdId = this._scenarioAutomationId(s);
    const isAdmin = !!this.hass.user?.is_admin;

    return html`
      <div class="card">
        <div class="card-head">
          <div class="card-icon" style="background: ${s.color}1f; color: ${s.color};">
            <ha-icon icon=${s.icon}></ha-icon>
          </div>
          <div>
            <div class="card-title">${s.title}</div>
            <div class="card-desc">${s.desc}</div>
          </div>
        </div>
        <div class="card-foot">
          ${createdId ? html`
            <span class="created">
              <ha-icon icon="mdi:check-circle" style="--mdc-icon-size: 15px;"></ha-icon>
              Created · <a href="/config/automation/edit/${createdId}">Edit</a>
            </span>
          ` : html`
            <button class="create-btn" ?disabled=${!isAdmin}
              @click=${() => this._openModal(s, entityId)}>
              <ha-icon icon="mdi:plus"></ha-icon>
              Create
            </button>
          `}
        </div>
      </div>
    `;
  }

  private _renderModal() {
    const s = this._modalScenario;
    if (!s) return nothing;
    const numeric = s.kind === 'above' || s.kind === 'below';
    const room = this.deviceName || 'this device';
    const forTxt = s.forMin ? ` for ${s.forMin} min` : '';
    let when: string;
    if (numeric) {
      when = `When it goes ${s.kind === 'above' ? 'above' : 'below'} ${this._threshold(s)} ${s.unit}${forTxt}`;
    } else {
      when = s.kind === 'to_on' ? `When it triggers${forTxt}` : `When it clears${forTxt}`;
    }

    return html`
      <div class="modal-backdrop" @click=${this._closeModal}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-head">
            <div class="card-icon" style="background: ${s.color}1f; color: ${s.color};">
              <ha-icon icon=${s.icon}></ha-icon>
            </div>
            <div>
              <div class="modal-title">${s.title}</div>
              <div class="modal-sub">${room}</div>
            </div>
            <button class="modal-x" @click=${this._closeModal}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>

          <div class="modal-body">
            <p class="modal-desc">${s.desc}</p>

            ${numeric ? html`
              <label class="modal-label">Trigger threshold</label>
              <div class="modal-thresh">
                <span>${s.kind === 'above' ? 'Above' : 'Below'}</span>
                <input type="number" .value=${String(this._threshold(s))}
                  @input=${(e: Event) => { this._thresholds = { ...this._thresholds, [s.key]: parseFloat((e.target as HTMLInputElement).value) }; }} />
                <span class="modal-unit">${s.unit || ''}</span>
              </div>
            ` : nothing}

            <label class="modal-label">Send notification to</label>
            <select class="modal-select"
              @change=${(e: Event) => { this._notifyTarget = (e.target as HTMLSelectElement).value; }}>
              ${this._notifyOptions().map(o => html`<option value=${o.value} ?selected=${o.value === this._notifyTarget}>${o.label}</option>`)}
            </select>

            <div class="modal-when"><ha-icon icon="mdi:flash"></ha-icon> ${when}</div>
            ${this._error ? html`<div class="warn" style="margin-top: 12px;">${this._error}</div>` : nothing}
          </div>

          <div class="modal-foot">
            <button class="btn-ghost" @click=${this._closeModal}>Cancel</button>
            <button class="create-btn" ?disabled=${this._busy === s.key} @click=${this._confirmModal}>
              <ha-icon icon="mdi:plus"></ha-icon>
              ${this._busy === s.key ? 'Creating…' : 'Create automation'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  protected render() {
    if (this._loading) {
      return html`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;
    }

    const groups = PRODUCT_GROUPS[this.productType] || [];
    const isAdmin = !!this.hass.user?.is_admin;
    const existing = this._existingAutomations();
    const groupLabel: Record<Group, string> = { climate: 'Air quality & climate', water: 'Water', energy: 'Energy' };

    const anyScenario = groups.some(g =>
      SCENARIOS.some(s => s.group === g && this._findEntity(s)));

    return html`
      <div class="intro">
        One-click automations for this device — pick the ones you want and choose where the
        notification goes. Each becomes a normal Home Assistant automation you can fine-tune
        later in the automation editor.
      </div>

      ${!isAdmin ? html`
        <div class="warn">You need an administrator account to create automations.</div>
      ` : nothing}
      ${this._error && !this._modalScenario ? html`<div class="warn">${this._error}</div>` : nothing}

      ${!anyScenario ? html`
        <div class="empty">No quick automations available for this device type yet.</div>
      ` : groups.map(g => {
        const scen = SCENARIOS.filter(s => s.group === g && this._findEntity(s));
        if (scen.length === 0) return nothing;
        return html`
          <div class="group-title">${groupLabel[g]}</div>
          <div class="cards">${scen.map(s => this._renderScenario(s))}</div>
        `;
      })}

      ${existing.length > 0 ? html`
        <div class="existing">
          <div class="group-title">Automations for this device</div>
          ${existing.map(a => html`
            <div class="existing-item">
              <button class="toggle ${a.on ? 'on' : ''}"
                @click=${() => this.hass.callService('automation', a.on ? 'turn_off' : 'turn_on', { entity_id: a.entityId })}></button>
              <span class="existing-name">${a.name}</span>
              ${a.id ? html`<a href="/config/automation/edit/${a.id}">Edit</a>` : nothing}
            </div>
          `)}
        </div>
      ` : nothing}

      ${anyScenario ? html`
        <div class="config-hint">
          A new automation doesn't appear under <b>Settings → Automations</b>? Make sure your
          <code>configuration.yaml</code> contains <code>automation: !include automations.yaml</code>
          (standard on a normal Home Assistant install).
        </div>
      ` : nothing}

      ${this._renderModal()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-automations-page': AutomationsPage;
  }
}
