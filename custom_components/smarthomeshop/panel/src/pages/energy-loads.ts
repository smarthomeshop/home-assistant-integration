import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';
import { panelText } from '../utils/panel-translations';

type LoadMode = 'smart' | 'run_now' | 'paused';
type ExecutionMode = 'advice' | 'shadow' | 'automatic';
type LoadCategory = 'appliance' | 'switch' | 'climate' | 'water_heater' | 'custom';
type EnergyPreference = 'balanced' | 'solar' | 'price';

interface LoadAction {
  service: string;
  entity_id?: string | null;
  data?: Record<string, unknown>;
}

interface DayRule { enabled: boolean; ready_by: string; }

interface SmartLoad {
  id: string;
  name: string;
  category: LoadCategory;
  enabled: boolean;
  mode: LoadMode;
  ready_by: string;
  earliest_start: string;
  duration_min: number;
  power_w: number;
  minimum_run_min: number;
  running_above_w: number;
  interruptible: boolean;
  grid_guard: boolean;
  energy_preference: EnergyPreference;
  control_entity?: string | null;
  start_entity?: string | null;
  stop_entity?: string | null;
  status_entity?: string | null;
  ready_entity?: string | null;
  running_entity?: string | null;
  power_entity?: string | null;
  energy_entity?: string | null;
  door_entity?: string | null;
  remote_entity?: string | null;
  ready_states: string;
  running_states: string;
  ready_on_state: string;
  running_on_state: string;
  door_open_state: string;
  remote_on_state: string;
  climate_mode: string;
  climate_temperature?: number | null;
  start_action?: LoadAction | null;
  stop_action?: LoadAction | null;
  schedule: Record<string, DayRule>;
}

interface SmartLoadsConfig {
  revision: number;
  enabled: boolean;
  execution_mode: ExecutionMode;
  grid_import_limit_w: number;
  grid_safety_margin_w: number;
  capacity_limit_w: number;
  loads: SmartLoad[];
}

interface LoadPlan {
  status?: string;
  reason?: string;
  deadline?: string;
  next_start?: string;
  duration_min?: number;
  power_w?: number;
  cost?: number | null;
  savings?: number | null;
  solar_kwh?: number;
  active?: boolean;
  forced?: boolean;
  predicted?: boolean;
  state?: { ready?: boolean; running?: boolean; reason?: string; power_w?: number | null };
  execution?: { status?: string; reason?: string; owned?: boolean; runtime_min?: number };
  guard?: { status?: string; reason?: string; projected_grid_w?: number; capacity_limit_w?: number };
  segments?: Array<{ start: string; end: string; average_price?: number | null; predicted?: boolean }>;
}

interface SmartLoadsPayload {
  config: SmartLoadsConfig;
  plans: Record<string, LoadPlan>;
  learning: Record<string, { trusted?: boolean; sample_count?: number; duration_min?: number; power_w?: number; energy_kwh?: number }>;
  runs: Array<Record<string, any>>;
  journal: Array<Record<string, any>>;
  available: boolean;
  updating: boolean;
  calculated_at?: string | null;
  coordinator_error?: string | null;
}

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export class EnergyLoads extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public compact = false;

  @state() private _loaded = false;
  @state() private _config: SmartLoadsConfig = this._blankConfig();
  @state() private _plans: Record<string, LoadPlan> = {};
  @state() private _learning: SmartLoadsPayload['learning'] = {};
  @state() private _runs: SmartLoadsPayload['runs'] = [];
  @state() private _journal: SmartLoadsPayload['journal'] = [];
  @state() private _view: 'plan' | 'runs' | 'setup' = 'plan';
  @state() private _openLoad = '';
  @state() private _dirty = false;
  @state() private _saving = false;
  @state() private _refreshing = false;
  @state() private _modePending = 0;
  @state() private _error = '';
  @state() private _saved = false;
  private _loadStarted = false;
  private _timer?: number;
  private _editVersion = 0;
  private _request = 0;

  static styles = css`
    :host { display: block; color: var(--primary-text-color); --load-blue: #4361ee; --load-green: #159957; --load-amber: #c47b08; --load-red: #cf3f3f; --load-border: color-mix(in srgb, var(--divider-color) 82%, transparent); }
    * { box-sizing: border-box; }
    button, input, select { font: inherit; }
    button { cursor: pointer; }
    .surface { border: 1px solid var(--load-border); border-radius: 12px; background: var(--card-background-color); overflow: hidden; }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
    .title { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .title-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 10px; color: var(--load-blue); background: color-mix(in srgb, var(--load-blue) 11%, var(--card-background-color)); }
    .title-icon ha-icon { --mdc-icon-size: 21px; }
    h2 { margin: 0; font-size: 18px; }
    .subtitle, .muted { color: var(--secondary-text-color); font-size: 12px; line-height: 1.45; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 38px; padding: 8px 13px; border: 1px solid var(--load-border); border-radius: 9px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 12px; font-weight: 680; }
    .btn:hover { border-color: var(--load-blue); color: var(--load-blue); }
    .btn.primary { border-color: var(--load-blue); background: var(--load-blue); color: white; }
    .btn.danger { color: var(--load-red); }
    .btn:disabled { opacity: .55; cursor: default; }
    .btn ha-icon { --mdc-icon-size: 17px; }
    .tabs { display: flex; gap: 3px; margin-bottom: 14px; padding: 3px; width: fit-content; border: 1px solid var(--load-border); border-radius: 10px; background: var(--secondary-background-color); }
    .tabs button { min-height: 33px; padding: 7px 13px; border: 0; border-radius: 7px; background: transparent; color: var(--secondary-text-color); font-size: 12px; font-weight: 650; }
    .tabs button.active { color: var(--load-blue); background: var(--card-background-color); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .notice { display: flex; align-items: flex-start; gap: 9px; margin-bottom: 13px; padding: 11px 13px; border: 1px solid var(--load-border); border-radius: 10px; color: var(--secondary-text-color); font-size: 12px; line-height: 1.45; }
    .notice.error { color: var(--load-red); border-color: color-mix(in srgb, var(--load-red) 35%, var(--load-border)); }
    .notice.safe { background: color-mix(in srgb, var(--load-green) 7%, var(--card-background-color)); }
    .notice ha-icon { --mdc-icon-size: 18px; color: var(--load-blue); flex: 0 0 auto; }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); margin-bottom: 14px; }
    .stat { padding: 13px 15px; }
    .stat + .stat { border-left: 1px solid var(--load-border); }
    .stat small { display: block; color: var(--secondary-text-color); font-size: 9.5px; letter-spacing: .55px; text-transform: uppercase; }
    .stat strong { display: block; margin-top: 5px; font-size: 17px; }
    .loads { display: grid; gap: 12px; }
    .load-head { display: flex; align-items: center; gap: 12px; padding: 14px 15px; }
    .load-icon { width: 38px; height: 38px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 10px; color: var(--load-blue); background: color-mix(in srgb, var(--load-blue) 10%, var(--card-background-color)); }
    .load-icon ha-icon { --mdc-icon-size: 21px; }
    .load-main { flex: 1; min-width: 0; }
    .load-name { font-size: 14px; font-weight: 730; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .load-status { display: flex; align-items: center; gap: 6px; margin-top: 3px; color: var(--secondary-text-color); font-size: 11.5px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--load-amber); }
    .dot.good { background: var(--load-green); }
    .dot.bad { background: var(--load-red); }
    .modes { display: flex; gap: 2px; padding: 3px; border: 1px solid var(--load-border); border-radius: 9px; background: var(--secondary-background-color); }
    .modes button { min-height: 30px; padding: 5px 9px; border: 0; border-radius: 6px; background: transparent; color: var(--secondary-text-color); font-size: 11px; font-weight: 650; }
    .modes button.on { background: var(--card-background-color); color: var(--load-blue); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .metrics { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); border-top: 1px solid var(--load-border); }
    .metric { min-width: 0; padding: 11px 13px; }
    .metric + .metric { border-left: 1px solid var(--load-border); }
    .metric small { display: block; color: var(--secondary-text-color); font-size: 9px; text-transform: uppercase; letter-spacing: .45px; }
    .metric strong { display: block; margin-top: 4px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .explain { display: flex; gap: 8px; align-items: flex-start; padding: 11px 14px; border-top: 1px solid var(--load-border); color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.45; }
    .explain ha-icon { --mdc-icon-size: 17px; color: var(--load-blue); flex: 0 0 auto; }
    .explain.problem, .explain.problem ha-icon { color: var(--load-red); }
    .recovery { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 14px; border-top: 1px solid var(--load-border); background: color-mix(in srgb, var(--load-red) 5%, var(--card-background-color)); font-size: 11.5px; line-height: 1.4; }
    .editor { padding: 16px; border-top: 1px solid var(--load-border); background: color-mix(in srgb, var(--secondary-background-color) 46%, var(--card-background-color)); }
    .editor-section + .editor-section { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--load-border); }
    .editor-title { margin-bottom: 10px; font-size: 12px; font-weight: 760; }
    .form { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 11px; }
    .field { min-width: 0; }
    .field.wide { grid-column: span 2; }
    .field.all { grid-column: 1 / -1; }
    .field label { display: block; margin: 0 0 5px 2px; color: var(--secondary-text-color); font-size: 10.5px; font-weight: 650; }
    .field input, .field select { width: 100%; min-height: 39px; padding: 8px 10px; border: 1px solid var(--load-border); border-radius: 9px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 12px; }
    .help { margin-top: 4px; color: var(--secondary-text-color); font-size: 10.5px; line-height: 1.4; }
    .check { display: flex; gap: 8px; align-items: flex-start; min-height: 39px; padding: 9px 10px; border: 1px solid var(--load-border); border-radius: 9px; background: var(--card-background-color); font-size: 11.5px; line-height: 1.35; }
    .check input { margin: 1px 0 0; accent-color: var(--load-blue); }
    .week { display: grid; grid-template-columns: repeat(7,minmax(90px,1fr)); gap: 7px; overflow-x: auto; }
    .day { padding: 8px; border: 1px solid var(--load-border); border-radius: 8px; background: var(--card-background-color); }
    .day label { display: flex; gap: 5px; align-items: center; font-size: 10.5px; font-weight: 700; }
    .day input[type=time] { width: 100%; min-height: 31px; margin-top: 7px; border: 1px solid var(--load-border); border-radius: 6px; background: var(--secondary-background-color); color: var(--primary-text-color); }
    .editor-actions { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 17px; }
    .global { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .global-card { padding: 14px 15px; }
    .global-row { display: flex; align-items: center; gap: 12px; }
    .global-row + .global-row { margin-top: 13px; padding-top: 13px; border-top: 1px solid var(--load-border); }
    .global-copy { flex: 1; }
    .global-title { font-size: 12.5px; font-weight: 720; }
    .global select, .global input { min-height: 37px; padding: 7px 9px; border: 1px solid var(--load-border); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); }
    .run-row, .journal-row { display: grid; grid-template-columns: 140px 130px 100px 100px minmax(160px,1fr); gap: 10px; padding: 11px 13px; border-top: 1px solid var(--load-border); font-size: 11.5px; }
    .run-row:first-child, .journal-row:first-child { border-top: 0; }
    .run-row span, .journal-row span { color: var(--secondary-text-color); }
    .empty { padding: 28px 18px; text-align: center; color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.5; }
    .empty ha-icon { display: block; margin: 0 auto 8px; --mdc-icon-size: 29px; color: var(--load-blue); }
    .compact-title { display: flex; align-items: baseline; gap: 8px; margin-bottom: 9px; }
    .compact-title strong { font-size: 17px; }
    .compact-title span { color: var(--secondary-text-color); font-size: 12px; }
    .compact .metrics { grid-template-columns: repeat(4,1fr); }
    .compact .metric:last-child { display: none; }
    @media (max-width: 760px) {
      .top { align-items: flex-start; flex-direction: column; }
      .actions { width: 100%; }
      .actions .btn { flex: 1; }
      .stats, .global { grid-template-columns: 1fr 1fr; }
      .stat:nth-child(3) { border-left: 0; border-top: 1px solid var(--load-border); }
      .stat:nth-child(4) { border-top: 1px solid var(--load-border); }
      .load-head { flex-wrap: wrap; }
      .modes { width: 100%; }
      .modes button { flex: 1; }
      .recovery { align-items: stretch; flex-direction: column; }
      .metrics { grid-template-columns: 1fr 1fr; }
      .metric:nth-child(odd) { border-left: 0; }
      .metric { border-top: 1px solid var(--load-border); }
      .metrics .metric:first-child, .metrics .metric:nth-child(2) { border-top: 0; }
      .form { grid-template-columns: 1fr; }
      .field.wide, .field.all { grid-column: auto; }
      .run-row, .journal-row { grid-template-columns: 1fr 1fr; }
      .compact .metrics { grid-template-columns: 1fr 1fr; }
    }
  `;

  private _t(source: string, variables: Record<string, string | number> = {}): string {
    return panelText(this.hass, source, variables);
  }

  private _blankConfig(): SmartLoadsConfig {
    return { revision: 0, enabled: false, execution_mode: 'advice', grid_import_limit_w: 17000, grid_safety_margin_w: 250, capacity_limit_w: 0, loads: [] };
  }

  private _blankLoad(): SmartLoad {
    const id = globalThis.crypto?.randomUUID?.() || `load-${Date.now()}`;
    return {
      id, name: this._t('New smart load'), category: 'appliance', enabled: true, mode: 'smart',
      ready_by: '07:00', earliest_start: '', duration_min: 60, power_w: 1000,
      minimum_run_min: 2, running_above_w: 15, interruptible: false, grid_guard: true,
      energy_preference: 'balanced', ready_states: 'ready,programmed,waiting,idle',
      running_states: 'running,on,active', ready_on_state: 'on', running_on_state: 'on',
      door_open_state: 'on', remote_on_state: 'on', climate_mode: 'heat', climate_temperature: 20,
      schedule: {},
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => {
      if (!this._saving && !this._dirty && !this._modePending && this.hass) void this.refresh();
    }, 60_000);
  }

  disconnectedCallback(): void {
    if (this._timer !== undefined) window.clearInterval(this._timer);
    super.disconnectedCallback();
  }

  protected willUpdate(): void {
    if (this.hass && !this._loadStarted) {
      this._loadStarted = true;
      void this.refresh();
    }
  }

  protected updated(): void {
    this.renderRoot.querySelectorAll<HTMLElement>('.field').forEach(field => {
      const label = field.querySelector('label')?.textContent?.trim();
      const control = field.querySelector<HTMLElement>('input,select');
      if (label && control && !control.getAttribute('aria-label')) control.setAttribute('aria-label', label);
    });
  }

  public async refresh(): Promise<void> {
    const request = ++this._request;
    try {
      const payload = await this.hass.callWS<SmartLoadsPayload>({ type: 'smarthomeshop/smart_loads' });
      if (request !== this._request) return;
      if (!this._dirty && !this._saving) this._config = this._clone(payload.config || this._blankConfig());
      this._plans = payload.plans || {};
      this._learning = payload.learning || {};
      this._runs = payload.runs || [];
      this._journal = payload.journal || [];
      this._error = payload.available ? '' : this._t(payload.coordinator_error || 'Smart Loads could not refresh its current state');
    } catch (err: any) {
      if (request === this._request) this._error = `${this._t('Could not load Smart Loads.')} ${this._reason(err?.message)}`.trim();
    } finally {
      this._loaded = true;
    }
  }

  private _clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
  private _markDirty(): void { this._dirty = true; this._saved = false; this._editVersion += 1; }
  private _number(event: Event): number { return Number((event.currentTarget as HTMLInputElement).value); }

  private _addLoad(): void {
    const item = this._blankLoad();
    this._config = { ...this._config, enabled: true, loads: [...this._config.loads, item] };
    this._openLoad = item.id;
    this._view = 'setup';
    this._markDirty();
  }

  private _updateLoad(loadId: string, patch: Partial<SmartLoad>): void {
    this._config = { ...this._config, loads: this._config.loads.map(item => item.id === loadId ? { ...item, ...patch } : item) };
    this._markDirty();
  }

  private _setDay(load: SmartLoad, day: string, patch: Partial<DayRule>): void {
    const fallback = { enabled: true, ready_by: load.ready_by };
    this._updateLoad(load.id, { schedule: { ...load.schedule, [day]: { ...(load.schedule[day] || fallback), ...patch } } });
  }

  private _delete(load: SmartLoad): void {
    const plan = this._plans[load.id] || {};
    if (plan.execution?.owned || plan.state?.running) {
      this._error = this._t('Wait for {name} to finish before removing it.', { name: load.name });
      return;
    }
    if (!confirm(this._t('Remove {name} from Smart Loads? Home Assistant entities and the device are not deleted.', { name: load.name }))) return;
    this._config = { ...this._config, loads: this._config.loads.filter(item => item.id !== load.id) };
    this._openLoad = '';
    this._markDirty();
  }

  private _invalid(): boolean {
    const routes = new Set<string>();
    return this._config.loads.some(load => {
      const loadRoutes = [load.control_entity, load.start_entity, load.stop_entity, load.start_action?.entity_id, load.stop_action?.entity_id].filter(Boolean) as string[];
      const duplicate = loadRoutes.some(route => routes.has(route));
      loadRoutes.forEach(route => routes.add(route));
      const values = [load.power_w, load.duration_min, load.minimum_run_min, load.running_above_w];
      return !load.name.trim() || duplicate || values.some(value => !Number.isFinite(Number(value)))
        || Number(load.power_w) < 1 || Number(load.power_w) > 50000
        || Number(load.duration_min) < 5 || Number(load.duration_min) > 1440
        || Number(load.minimum_run_min) < 1 || Number(load.minimum_run_min) > 1440
        || Number(load.running_above_w) < 0 || Number(load.running_above_w) > 50000
        || !/^([01]\d|2[0-3]):[0-5]\d$/.test(load.ready_by);
    });
  }

  private async _save(): Promise<void> {
    if (this._saving || !this.hass.user?.is_admin || this._invalid()) {
      if (this._invalid()) this._error = this._t('Check the load name, times, power, duration and control entities.');
      return;
    }
    this._saving = true;
    this._error = '';
    ++this._request;
    const version = this._editVersion;
    try {
      const payload = await this.hass.callWS<SmartLoadsPayload>({ type: 'smarthomeshop/smart_loads/set', config: this._clone(this._config) });
      const changed = version !== this._editVersion;
      if (!changed) this._config = this._clone(payload.config);
      this._plans = payload.plans || {};
      this._learning = payload.learning || {};
      this._runs = payload.runs || [];
      this._journal = payload.journal || [];
      this._dirty = changed;
      this._saved = !changed;
      window.setTimeout(() => { this._saved = false; }, 2500);
    } catch (err: any) {
      this._error = `${this._t('Could not save Smart Loads.')} ${this._reason(err?.message)}`.trim();
    } finally {
      this._saving = false;
    }
  }

  private async _refreshPlan(): Promise<void> {
    if (this._refreshing || this._saving || this._modePending) return;
    this._refreshing = true;
    const request = ++this._request;
    try {
      const payload = await this.hass.callWS<SmartLoadsPayload>({ type: 'smarthomeshop/smart_loads/refresh' });
      if (request !== this._request) return;
      this._plans = payload.plans || {};
      this._runs = payload.runs || [];
      this._journal = payload.journal || [];
      this._error = '';
    } catch (err: any) {
      this._error = `${this._t('Could not refresh Smart Loads.')} ${this._reason(err?.message)}`.trim();
    } finally {
      this._refreshing = false;
    }
  }

  private async _setMode(load: SmartLoad, mode: LoadMode): Promise<void> {
    if (!this.hass.user?.is_admin || this._saving || this._modePending) return;
    if (this._dirty) {
      this._updateLoad(load.id, { mode });
      return;
    }
    const previous = load.mode;
    this._modePending += 1;
    ++this._request;
    this._config = { ...this._config, loads: this._config.loads.map(item => item.id === load.id ? { ...item, mode } : item) };
    try {
      const payload = await this.hass.callWS<SmartLoadsPayload>({ type: 'smarthomeshop/smart_loads/mode', load_id: load.id, mode });
      this._plans = payload.plans || {};
      this._runs = payload.runs || [];
      this._journal = payload.journal || [];
    } catch (err: any) {
      this._config = { ...this._config, loads: this._config.loads.map(item => item.id === load.id ? { ...item, mode: previous } : item) };
      this._error = `${this._t('Could not change the load mode.')} ${this._reason(err?.message)}`.trim();
    } finally {
      this._modePending = Math.max(0, this._modePending - 1);
    }
  }

  private async _releaseControl(load: SmartLoad): Promise<void> {
    if (!this.hass.user?.is_admin || this._saving || this._modePending) return;
    const warning = this._t('Only continue after you have physically confirmed that {name} is switched off. Smart Loads will release its saved stop responsibility and will not send a stop command. Release control?', { name: load.name });
    if (!confirm(warning)) return;
    this._modePending += 1;
    this._error = '';
    try {
      const payload = await this.hass.callWS<SmartLoadsPayload>({
        type: 'smarthomeshop/smart_loads/release',
        load_id: load.id,
        confirm_physically_off: true,
      });
      this._plans = payload.plans || {};
      this._runs = payload.runs || [];
      this._journal = payload.journal || [];
    } catch (err: any) {
      this._error = `${this._t('Could not release Smart Loads control.')} ${this._reason(err?.message)}`.trim();
    } finally {
      this._modePending = Math.max(0, this._modePending - 1);
    }
  }

  private async _clearHistory(): Promise<void> {
    if (!confirm(this._t('Clear Smart Loads runs and decision history? Configuration and learned values are kept.'))) return;
    try {
      await this.hass.callWS({ type: 'smarthomeshop/smart_loads/history/clear' });
      this._runs = [];
      this._journal = [];
    } catch (err: any) {
      this._error = `${this._t('Could not clear Smart Loads history.')} ${this._reason(err?.message)}`.trim();
    }
  }

  private _entityOptions(domains: string | string[], value?: string | null) {
    const accepted = Array.isArray(domains) ? domains : [domains];
    const ids = Object.keys(this.hass.states || {}).filter(id => accepted.includes(id.split('.', 1)[0])).sort((a, b) => {
      const an = String(this.hass.states[a]?.attributes?.friendly_name || a);
      const bn = String(this.hass.states[b]?.attributes?.friendly_name || b);
      return an.localeCompare(bn);
    });
    if (value && !ids.includes(value)) ids.unshift(value);
    return html`<option value="">${this._t('Not configured')}</option>${ids.map(id => html`<option value=${id} ?selected=${id === value}>${String(this.hass.states[id]?.attributes?.friendly_name || id)} · ${id}</option>`)}`;
  }

  private _icon(category: LoadCategory): string {
    return ({ appliance: 'mdi:dishwasher', switch: 'mdi:power-plug', climate: 'mdi:thermostat', water_heater: 'mdi:water-boiler', custom: 'mdi:tools' } as Record<string,string>)[category] || 'mdi:lightning-bolt';
  }

  private _date(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat(this.hass.language || 'en', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  private _eur(value?: number | null): string { return value == null ? '-' : new Intl.NumberFormat(this.hass.language || 'en', { style: 'currency', currency: (this.hass as any).config?.currency || 'EUR' }).format(value); }

  private _reason(value?: string | null): string {
    const source = String(value || '');
    if (source.startsWith('device status is ')) {
      return `${this._t('Device status')}: ${source.slice('device status is '.length)}`;
    }
    const service = source.match(/^Home Assistant service (.+) is unavailable$/);
    if (service) return this._t('Home Assistant service {service} is unavailable', { service: service[1] });
    const timeout = source.match(/^Home Assistant service (.+) did not respond within 30 seconds$/);
    if (timeout) return this._t('Home Assistant service {service} did not respond within 30 seconds', { service: timeout[1] });
    const legacy = source.match(/^(.+): one of its controls is still used by an enabled legacy deadline schedule$/);
    if (legacy) return this._t('{name}: one of its controls is still used by an enabled legacy deadline schedule', { name: legacy[1] });
    const shared = source.match(/^(.+) shares a control route with (.+)$/);
    if (shared) return this._t('{name} shares a control route with {other}', { name: shared[1], other: shared[2] });
    const namedValidation = source.match(/^(.+): (choose a control, start entity or custom start action|start control is unavailable|automatic control needs running or power feedback|interruptible automatic control needs a stop action)$/);
    if (namedValidation) return this._t(`{name}: ${namedValidation[2]}`, { name: namedValidation[1] });
    const startService = source.match(/^(.+): start service (.+) is unavailable$/);
    if (startService) return this._t('{name}: start service {service} is unavailable', { name: startService[1], service: startService[2] });
    const weekday = source.match(/^(mon|tue|wed|thu|fri|sat|sun) ready_by must be HH:MM$/);
    if (weekday) return this._t('{weekday} ready_by must be HH:MM', { weekday: this._t(weekday[1]) });
    const actionTarget = source.match(/^(start_action|stop_action)(?:\.data)? (contains two different entity targets|must use the explicit entity_id field for target safety|does not accept templates)$/);
    if (actionTarget) return this._t(`{field} ${actionTarget[2]}`, { field: this._t(actionTarget[1]) });
    const actionShape = source.match(/^(start_action|stop_action)(\.service|\.data)? (must be domain\.service|must be an object|must be an action object)$/);
    if (actionShape) return this._t(`{field}${actionShape[2] || ''} ${actionShape[3]}`, { field: this._t(actionShape[1]) });
    const numeric = source.match(/^([a-z_]+) must be a number$/);
    if (numeric) return this._t('{field} must be a number', { field: this._t(numeric[1]) });
    const controlDomain = source.match(/^control_entity must belong to (.+)$/);
    if (controlDomain) return this._t('control_entity must belong to {domains}', { domains: controlDomain[1] });
    const range = source.match(/^([a-z_]+) must be between ([^ ]+) and ([^ ]+)$/);
    if (range) return this._t('{field} must be between {minimum} and {maximum}', { field: this._t(range[1]), minimum: range[2], maximum: range[3] });
    return source.split(', ').map(part => this._t(part)).join(', ');
  }

  private _status(plan: LoadPlan): { label: string; tone: string } {
    const execution = plan.execution?.status;
    if (['blocked_by_grid','not_following','start_failed','stop_failed','unsafe_control','unavailable','configuration_changed','manual_override','planning_failed'].includes(String(execution))) return { label: this._t('Needs attention'), tone: 'bad' };
    if (execution === 'confirmation_wait') return { label: this._t('Confirming'), tone: '' };
    if (plan.state?.running) return { label: this._t('Running'), tone: 'good' };
    if (plan.execution?.owned) return { label: this._t('Monitoring'), tone: '' };
    if (plan.state?.ready) return { label: this._t('Ready'), tone: '' };
    return { label: this._t('Not ready'), tone: '' };
  }

  private _renderCard(load: SmartLoad) {
    const plan = this._plans[load.id] || {};
    const learned = this._learning[load.id] || {};
    const status = this._status(plan);
    const problem = status.tone === 'bad';
    return html`<article class="surface">
      <div class="load-head">
        <div class="load-icon"><ha-icon icon=${this._icon(load.category)}></ha-icon></div>
        <div class="load-main"><div class="load-name">${load.name}</div><div class="load-status"><span class="dot ${status.tone}"></span>${status.label}${learned.trusted ? html` · ${this._t('learned from {count} runs', { count: learned.sample_count || 0 })}` : nothing}</div></div>
        ${this.hass.user?.is_admin ? html`<div class="modes" role="group" aria-label=${this._t('Mode for {name}', { name: load.name })}>
          <button aria-pressed=${load.mode === 'smart'} class=${load.mode === 'smart' ? 'on' : ''} @click=${() => this._setMode(load, 'smart')}>${this._t('Smart')}</button>
          <button aria-pressed=${load.mode === 'run_now'} class=${load.mode === 'run_now' ? 'on' : ''} @click=${() => this._setMode(load, 'run_now')}>${this._t('Run now')}</button>
          <button aria-pressed=${load.mode === 'paused'} class=${load.mode === 'paused' ? 'on' : ''} @click=${() => this._setMode(load, 'paused')}>${this._t('Pause')}</button>
        </div>` : nothing}
        ${!this.compact && this.hass.user?.is_admin ? html`<button class="btn" aria-label=${this._t('Edit {name}', { name: load.name })} @click=${() => { this._openLoad = this._openLoad === load.id ? '' : load.id; }}><ha-icon icon="mdi:pencil-outline"></ha-icon></button>` : nothing}
      </div>
      <div class="metrics">
        <div class="metric"><small>${this._t('Next start')}</small><strong>${plan.active ? this._t('Now') : this._date(plan.next_start)}</strong></div>
        <div class="metric"><small>${this._t('Ready by')}</small><strong>${this._date(plan.deadline)}</strong></div>
        <div class="metric"><small>${this._t('Power')}</small><strong>${Math.round(plan.state?.power_w ?? plan.power_w ?? load.power_w)} W</strong></div>
        <div class="metric"><small>${this._t('Expected cost')}</small><strong>${this._eur(plan.cost)}</strong></div>
        <div class="metric"><small>${this._t('Solar')}</small><strong>${plan.solar_kwh != null ? `${plan.solar_kwh} kWh` : '-'}</strong></div>
      </div>
      <div class="explain ${problem ? 'problem' : ''}"><ha-icon icon=${problem ? 'mdi:alert-circle-outline' : 'mdi:information-outline'}></ha-icon><span>${this._reason(plan.execution?.reason || plan.reason || 'Waiting for a plan')}</span></div>
      ${problem && plan.execution?.owned && this.hass.user?.is_admin ? html`<div class="recovery"><div><strong>${this._t('Control recovery')}</strong><br><span class="muted">${this._t('Use only after checking the appliance itself is switched off. This clears saved ownership without sending a command.')}</span></div><button class="btn danger" ?disabled=${this._modePending > 0} @click=${() => this._releaseControl(load)}>${this._t('Confirm off and release')}</button></div>` : nothing}
      ${!this.compact && this._openLoad === load.id ? this._renderEditor(load) : nothing}
    </article>`;
  }

  private _renderEditor(load: SmartLoad) {
    const custom = load.category === 'custom';
    return html`<div class="editor">
      <div class="editor-section"><div class="editor-title">${this._t('Planning')}</div><div class="form">
        <div class="field wide"><label>${this._t('Name')}</label><input .value=${load.name} @input=${(e: Event) => this._updateLoad(load.id, { name: (e.currentTarget as HTMLInputElement).value })}></div>
        <div class="field"><label>${this._t('Type')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { category: (e.currentTarget as HTMLSelectElement).value as LoadCategory })}>
          ${(['appliance','switch','climate','water_heater','custom'] as LoadCategory[]).map(value => html`<option value=${value} ?selected=${value === load.category}>${this._t(({appliance:'Appliance',switch:'Switch or smart plug',climate:'Climate',water_heater:'Water heater',custom:'Custom action'} as any)[value])}</option>`)}</select></div>
        <div class="field"><label>${this._t('Expected power (W)')}</label><input type="number" min="1" max="50000" .value=${String(load.power_w)} @input=${(e: Event) => this._updateLoad(load.id, { power_w: this._number(e) })}></div>
        <div class="field"><label>${this._t('Expected duration (minutes)')}</label><input type="number" min="5" max="1440" .value=${String(load.duration_min)} @input=${(e: Event) => this._updateLoad(load.id, { duration_min: this._number(e) })}><div class="help">${this._t('After three completed runs Smart Loads can use the measured duration and peak power.')}</div></div>
        <div class="field"><label>${this._t('Ready by')}</label><input type="time" .value=${load.ready_by} @input=${(e: Event) => this._updateLoad(load.id, { ready_by: (e.currentTarget as HTMLInputElement).value })}></div>
        <div class="field"><label>${this._t('Earliest start (optional)')}</label><input type="time" .value=${load.earliest_start || ''} @input=${(e: Event) => this._updateLoad(load.id, { earliest_start: (e.currentTarget as HTMLInputElement).value })}></div>
        <div class="field"><label>${this._t('Energy preference')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { energy_preference: (e.currentTarget as HTMLSelectElement).value as EnergyPreference })}><option value="balanced" ?selected=${load.energy_preference === 'balanced'}>${this._t('Balanced')}</option><option value="solar" ?selected=${load.energy_preference === 'solar'}>${this._t('Prefer solar')}</option><option value="price" ?selected=${load.energy_preference === 'price'}>${this._t('Prefer lowest price')}</option></select></div>
        <label class="check"><input type="checkbox" .checked=${load.interruptible} @change=${(e: Event) => this._updateLoad(load.id, { interruptible: (e.currentTarget as HTMLInputElement).checked })}><span><strong>${this._t('May pause between slots')}</strong><br><span class="muted">${this._t('Leave off for washing machines and other cycles that must finish in one go.')}</span></span></label>
        <div class="check"><ha-icon icon="mdi:shield-check-outline"></ha-icon><span><strong>${this._t('Protect main fuse')}</strong><br><span class="muted">${this._t('Grid protection is always active. Automatic starts require fresh P1 grid and phase-headroom data.')}</span></span></div>
      </div></div>

      <div class="editor-section"><div class="editor-title">${this._t('Device control and feedback')}</div><div class="form">
        ${custom ? html`
          <div class="field"><label>${this._t('Start service')}</label><input placeholder="script.turn_on" .value=${load.start_action?.service || ''} @input=${(e: Event) => this._updateLoad(load.id, { start_action: { ...(load.start_action || { data: {} }), service: (e.currentTarget as HTMLInputElement).value } })}></div>
          <div class="field wide"><label>${this._t('Start action entity')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { start_action: { ...(load.start_action || { service: '' }), entity_id: (e.currentTarget as HTMLSelectElement).value || null } })}>${this._entityOptions(['script','scene','button','switch','input_boolean'], load.start_action?.entity_id)}</select></div>
          <div class="field"><label>${this._t('Stop service')}</label><input placeholder="script.turn_on" .value=${load.stop_action?.service || ''} @input=${(e: Event) => this._updateLoad(load.id, { stop_action: { ...(load.stop_action || { data: {} }), service: (e.currentTarget as HTMLInputElement).value } })}></div>
          <div class="field wide"><label>${this._t('Stop action entity')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { stop_action: { ...(load.stop_action || { service: '' }), entity_id: (e.currentTarget as HTMLSelectElement).value || null } })}>${this._entityOptions(['script','scene','button','switch','input_boolean'], load.stop_action?.entity_id)}</select></div>
        ` : html`
          <div class="field"><label>${this._t('Control entity')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { control_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(load.category === 'climate' ? 'climate' : load.category === 'water_heater' ? 'water_heater' : ['switch','input_boolean'], load.control_entity)}</select><div class="help">${this._t('Use this for a switch, relay, climate device or water heater.')}</div></div>
          <div class="field"><label>${this._t('Separate start button')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { start_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['button','switch','input_boolean','script'], load.start_entity)}</select></div>
          <div class="field"><label>${this._t('Separate stop control')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { stop_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['button','switch','input_boolean','script'], load.stop_entity)}</select></div>
        `}
        <div class="field"><label>${this._t('Status entity')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { status_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['sensor','select'], load.status_entity)}</select></div>
        <div class="field"><label>${this._t('Ready entity')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { ready_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['binary_sensor','switch','input_boolean'], load.ready_entity)}</select></div>
        <div class="field"><label>${this._t('Running entity')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { running_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['binary_sensor','switch','input_boolean'], load.running_entity)}</select></div>
        <div class="field"><label>${this._t('Power sensor')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { power_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions('sensor', load.power_entity)}</select></div>
        <div class="field"><label>${this._t('Energy sensor')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { energy_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions('sensor', load.energy_entity)}</select></div>
        <div class="field"><label>${this._t('Door sensor')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { door_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions('binary_sensor', load.door_entity)}</select></div>
        <div class="field"><label>${this._t('Remote-start enabled')}</label><select @change=${(e: Event) => this._updateLoad(load.id, { remote_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['binary_sensor','switch'], load.remote_entity)}</select></div>
        <div class="field wide"><label>${this._t('Ready states')}</label><input .value=${load.ready_states} @input=${(e: Event) => this._updateLoad(load.id, { ready_states: (e.currentTarget as HTMLInputElement).value })}><div class="help">${this._t('Comma-separated raw states from the status entity, for example ready, programmed.')}</div></div>
        <div class="field wide"><label>${this._t('Running states')}</label><input .value=${load.running_states} @input=${(e: Event) => this._updateLoad(load.id, { running_states: (e.currentTarget as HTMLInputElement).value })}><div class="help">${this._t('Comma-separated raw states, for example running, active, heating.')}</div></div>
      </div></div>

      <div class="editor-section"><div class="editor-title">${this._t('Week schedule')}</div><div class="week">${WEEKDAYS.map(day => {
        const rule = load.schedule?.[day] || { enabled: true, ready_by: load.ready_by };
        const dayKey = `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
        return html`<div class="day"><label><input type="checkbox" .checked=${rule.enabled} @change=${(e: Event) => this._setDay(load, day, { enabled: (e.currentTarget as HTMLInputElement).checked })}>${this._t(dayKey)}</label><input aria-label=${`${this._t('Ready by')} ${this._t(dayKey)}`} type="time" .value=${rule.ready_by} ?disabled=${!rule.enabled} @input=${(e: Event) => this._setDay(load, day, { ready_by: (e.currentTarget as HTMLInputElement).value })}></div>`;
      })}</div></div>
      <div class="editor-actions"><button class="btn danger" @click=${() => this._delete(load)}><ha-icon icon="mdi:delete-outline"></ha-icon>${this._t('Remove')}</button><button class="btn" @click=${() => { this._openLoad = ''; }}>${this._t('Close editor')}</button></div>
    </div>`;
  }

  private _renderSetup() {
    const admin = this.hass.user?.is_admin;
    return html`
      <div class="global">
        <section class="surface global-card"><div class="global-row"><div class="global-copy"><div class="global-title">${this._t('Enable Smart Loads')}</div><div class="muted">${this._t('Plan flexible devices against prices, solar, EV charging, battery operation and grid capacity.')}</div></div><ha-switch aria-label=${this._t('Enable Smart Loads')} .checked=${this._config.enabled} ?disabled=${!admin} @change=${(e: Event) => { this._config = { ...this._config, enabled: (e.currentTarget as any).checked }; this._markDirty(); }}></ha-switch></div><div class="global-row"><div class="global-copy"><div class="global-title">${this._t('Execution mode')}</div><div class="muted">${this._t('Start with advice, verify shadow plans, then enable automatic control.')}</div></div><select aria-label=${this._t('Execution mode')} ?disabled=${!admin} @change=${(e: Event) => { this._config = { ...this._config, execution_mode: (e.currentTarget as HTMLSelectElement).value as ExecutionMode }; this._markDirty(); }}><option value="advice" ?selected=${this._config.execution_mode === 'advice'}>${this._t('Advice only')}</option><option value="shadow" ?selected=${this._config.execution_mode === 'shadow'}>${this._t('Shadow mode')}</option><option value="automatic" ?selected=${this._config.execution_mode === 'automatic'}>${this._t('Automatic')}</option></select></div></section>
        <section class="surface global-card"><div class="global-row"><div class="global-copy"><div class="global-title">${this._t('Grid import limit')}</div><div class="muted">${this._t('A new load starts only when fresh P1 data leaves this limit and the tightest phase safe.')}</div></div><input aria-label=${this._t('Grid import limit')} type="number" min="0" max="100000" .value=${String(this._config.grid_import_limit_w)} @input=${(e: Event) => { this._config = { ...this._config, grid_import_limit_w: this._number(e) }; this._markDirty(); }}></div><div class="global-row"><div class="global-copy"><div class="global-title">${this._t('Capacity target (optional)')}</div><div class="muted">${this._t('Zero uses the target learned by the battery planner. Enter watts to enforce a fixed whole-home target.')}</div></div><input aria-label=${this._t('Capacity target (optional)')} type="number" min="0" max="100000" .value=${String(this._config.capacity_limit_w)} @input=${(e: Event) => { this._config = { ...this._config, capacity_limit_w: this._number(e) }; this._markDirty(); }}></div></section>
      </div>
      <div class="notice safe"><ha-icon icon="mdi:shield-check-outline"></ha-icon><span><strong>${this._t('Safe ownership')}</strong><br>${this._t('Smart Loads only stops controls it started itself. Start and stop commands wait for device feedback; non-interruptible cycles are not cut off when a new price or capacity limit appears.')}</span></div>
      <div class="loads">${this._config.loads.map(load => this._renderCard(load))}</div>
      ${!this._config.loads.length ? html`<div class="surface empty"><ha-icon icon="mdi:power-plug-outline"></ha-icon>${this._t('No Smart Loads yet. Add a washing machine, dishwasher, pool pump, climate device, water heater or custom Home Assistant action.')}</div>` : nothing}
    `;
  }

  private _renderRuns() {
    return html`
      <div class="top"><div><h2>${this._t('Completed runs')}</h2><div class="subtitle">${this._t('Measured duration, energy, cost, saving and execution result stay local in Home Assistant.')}</div></div>${this.hass.user?.is_admin && (this._runs.length || this._journal.length) ? html`<button class="btn danger" @click=${this._clearHistory}><ha-icon icon="mdi:delete-sweep-outline"></ha-icon>${this._t('Clear history')}</button>` : nothing}</div>
      <section class="surface">${this._runs.length ? this._runs.map(run => html`<div class="run-row"><strong>${run.name || run.load_id}</strong><span>${this._date(run.started_at)}</span><span>${run.duration_min ?? '-'} min</span><span>${run.energy_kwh ?? '-'} kWh · ${this._t(run.measurement || 'measured')}</span><span>${this._eur(run.cost)} · ${this._t('saved')} ${this._eur(run.savings)} · ${this._t(run.result || 'completed')}</span></div>`) : html`<div class="empty">${this._t('No completed runs yet. Smart Loads learns after three successful runs per device.')}</div>`}</section>
      ${this._journal.length ? html`<div class="top" style="margin-top:18px"><div><h2>${this._t('Decision history')}</h2><div class="subtitle">${this._t('Every meaningful start, stop, block and failure is explained here.')}</div></div></div><section class="surface">${this._journal.slice(0,50).map(row => html`<div class="journal-row"><strong>${this._config.loads.find(item => item.id === row.load_id)?.name || row.load_id || '-'}</strong><span>${this._date(row.timestamp)}</span><span>${this._t(row.action || 'decision')}</span><span>${this._t(row.status || 'unknown')}</span><span>${this._reason(row.reason)}</span></div>`)}</section>` : nothing}
    `;
  }

  protected render() {
    if (!this._loaded) return html`<div class="surface empty">${this._t('Loading Smart Loads...')}</div>`;
    const active = Object.values(this._plans).filter(plan => plan.state?.running || plan.execution?.status === 'running').length;
    const ready = Object.values(this._plans).filter(plan => plan.state?.ready).length;
    const savings = this._runs.reduce((sum, run) => sum + (Number(run.savings) || 0), 0);
    if (this.compact) return html`<div class="compact"><div class="compact-title"><strong>${this._t('Smart Loads')}</strong><span>${this._t('{active} running · {total} configured', { active, total: this._config.loads.length })}</span></div>${this._error ? html`<div class="notice error" role="alert"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${this._error}</div>` : nothing}${this._config.loads.length ? html`<div class="loads">${this._config.loads.map(load => this._renderCard(load))}</div>` : html`<div class="surface empty">${this._t('No flexible household loads configured yet.')}</div>`}</div>`;
    return html`
      <div class="top"><div class="title"><div class="title-icon"><ha-icon icon="mdi:calendar-lightning-bolt"></ha-icon></div><div><h2>${this._t('Smart Loads')}</h2><div class="subtitle">${this._t('Run household devices at the best moment without overloading the grid.')}</div></div></div><div class="actions">${this._saved ? html`<span class="muted">${this._t('Saved')}</span>` : nothing}<button class="btn" ?disabled=${this._refreshing || this._saving || this._dirty} @click=${this._refreshPlan}><ha-icon icon="mdi:refresh"></ha-icon>${this._refreshing ? this._t('Refreshing...') : this._t('Recalculate')}</button>${this.hass.user?.is_admin ? html`<button class="btn" @click=${this._addLoad}><ha-icon icon="mdi:plus"></ha-icon>${this._t('Add load')}</button><button class="btn primary" ?disabled=${!this._dirty || this._saving} @click=${this._save}><ha-icon icon="mdi:content-save-outline"></ha-icon>${this._saving ? this._t('Saving...') : this._t('Save')}</button>` : nothing}</div></div>
      ${this._error ? html`<div class="notice error" role="alert"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${this._error}</div>` : nothing}
      <div class="tabs" role="tablist" aria-label=${this._t('Smart Loads sections')}>${(['plan','runs','setup'] as const).map(view => html`<button role="tab" aria-selected=${this._view === view ? 'true' : 'false'} class=${this._view === view ? 'active' : ''} @click=${() => { this._view = view; }}>${this._t(view === 'plan' ? 'Planning' : view === 'runs' ? 'Runs' : 'Setup')}</button>`)}</div>
      ${this._view === 'plan' ? html`<div class="surface stats"><div class="stat"><small>${this._t('Configured')}</small><strong>${this._config.loads.length}</strong></div><div class="stat"><small>${this._t('Ready')}</small><strong>${ready}</strong></div><div class="stat"><small>${this._t('Running')}</small><strong>${active}</strong></div><div class="stat"><small>${this._t('Measured savings')}</small><strong>${this._eur(savings)}</strong></div></div><div class="loads">${this._config.loads.map(load => this._renderCard(load))}</div>${!this._config.loads.length ? html`<div class="surface empty"><ha-icon icon="mdi:calendar-plus"></ha-icon>${this._t('Add your first flexible load in Setup. Advice mode is selected first, so nothing is switched automatically.')}</div>` : nothing}` : this._view === 'runs' ? this._renderRuns() : this._renderSetup()}
    `;
  }
}

if (!customElements.get('shs-energy-loads')) customElements.define('shs-energy-loads', EnergyLoads);

declare global { interface HTMLElementTagNameMap { 'shs-energy-loads': EnergyLoads; } }
