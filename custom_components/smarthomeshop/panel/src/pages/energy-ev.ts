import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';
import { panelText } from '../utils/panel-translations';
import { responseIsCurrent } from '../utils/response-lanes';
import { translateEVReason } from '../utils/ev-display';

type EVMode = 'smart' | 'charge_now' | 'pause' | 'off';
type ExecutionMode = 'advice' | 'shadow' | 'automatic';
type ControlKind = 'switch' | 'number' | 'select';

interface EVDayRule {
  enabled: boolean;
  ready_by: string;
  target_soc: number;
}

interface EVVehicle {
  id: string;
  name: string;
  enabled: boolean;
  mode: EVMode;
  capacity_kwh: number;
  target_soc: number;
  minimum_soc: number;
  charge_power_kw: number;
  charge_efficiency: number;
  soc_entity?: string | null;
  target_soc_entity?: string | null;
  plugged_entity?: string | null;
  home_entity?: string | null;
  charging_entity?: string | null;
  power_entity?: string | null;
  control_entity?: string | null;
  stop_entity?: string | null;
  control_kind: ControlKind;
  charge_option: string;
  pause_option: string;
  max_current_a: number;
  min_current_a: number;
  off_current_a: number;
  phases: number;
  voltage: number;
  charger_id: string;
  ready_by: string;
  earliest_start: string;
  schedule: Record<string, EVDayRule>;
  calendar_entity?: string | null;
  calendar_keyword: string;
  energy_preference: 'balanced' | 'solar_first' | 'price_first';
  allow_home_battery_support: boolean;
  finish_in_one_go: boolean;
  one_go_extra_eur: number;
  plan_stability_eur: number;
  planning_hours: number;
  grid_guard: boolean;
  grid_import_limit_w: number;
  grid_safety_margin_w: number;
}

interface EVConfig {
  enabled: boolean;
  execution_mode: ExecutionMode;
  vehicles: EVVehicle[];
}

interface EVPayload {
  config: EVConfig;
  plans: Record<string, any>;
  journal: any[];
  available: boolean;
  updating: boolean;
}

const WEEKDAYS: Array<[string, string]> = [
  ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'],
  ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun'],
];

const EV_NUMBER_RANGES: Partial<Record<keyof EVVehicle, [number, number]>> = {
  capacity_kwh: [1, 250], target_soc: [1, 100], minimum_soc: [0, 100],
  charge_power_kw: [.1, 50], charge_efficiency: [.5, 1],
  max_current_a: [1, 80], min_current_a: [1, 80], off_current_a: [0, 80],
  phases: [1, 3], voltage: [100, 500], planning_hours: [6, 72],
  one_go_extra_eur: [0, 20], plan_stability_eur: [0, 20],
  grid_import_limit_w: [0, 100000], grid_safety_margin_w: [0, 10000],
};

export class EnergyEV extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean }) public compact = false;

  @state() private _loaded = false;
  @state() private _saving = false;
  @state() private _refreshing = false;
  @state() private _error = '';
  @state() private _saved = false;
  @state() private _dirty = false;
  @state() private _config: EVConfig = { enabled: false, execution_mode: 'advice', vehicles: [] };
  @state() private _plans: Record<string, any> = {};
  @state() private _journal: any[] = [];
  @state() private _openVehicle = '';
  @state() private _clearingJournal = false;
  private _loadStarted = false;
  private _refreshTimer?: number;
  private _editVersion = 0;
  private _liveRequestSequence = 0;
  private _configRequestSequence = 0;
  private _configGeneration = 0;
  private _modePending = 0;

  static styles = css`
    :host {
      display: block;
      color: var(--primary-text-color);
      --ev-blue: #4361ee;
      --ev-green: #159957;
      --ev-amber: #d8890b;
      --ev-red: #d34a4a;
      --ev-border: color-mix(in srgb, var(--divider-color) 78%, transparent);
      --ev-soft: color-mix(in srgb, var(--ev-blue) 10%, var(--card-background-color));
    }
    * { box-sizing: border-box; }
    button, input, select { font: inherit; }
    button { -webkit-tap-highlight-color: transparent; }
    .loading, .empty, .notice, .error {
      padding: 18px; border: 1px solid var(--ev-border); border-radius: 12px;
      background: var(--card-background-color); color: var(--secondary-text-color);
      font-size: 13px; line-height: 1.5;
    }
    .error { color: var(--ev-red); border-color: color-mix(in srgb, var(--ev-red) 35%, var(--ev-border)); }
    .topbar { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .top-icon { width: 42px; height: 42px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 11px; color: var(--ev-blue); background: var(--ev-soft); }
    .top-icon ha-icon { --mdc-icon-size: 23px; }
    .top-copy { flex: 1; min-width: 0; }
    .title { font-size: 16px; font-weight: 730; }
    .sub { margin-top: 4px; color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.5; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .btn {
      min-height: 36px; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      padding: 8px 13px; border: 1px solid var(--ev-border); border-radius: 9px;
      background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer;
      font-size: 12.5px; font-weight: 650;
    }
    .btn:hover { border-color: var(--ev-blue); color: var(--ev-blue); }
    .btn.primary { border-color: var(--ev-blue); background: var(--ev-blue); color: white; }
    .btn.danger { color: var(--ev-red); }
    .btn:disabled { opacity: .55; cursor: wait; }
    .btn:focus-visible, input:focus-visible, select:focus-visible, .mode button:focus-visible {
      outline: 2px solid var(--ev-blue); outline-offset: 2px;
    }
    .btn ha-icon { --mdc-icon-size: 16px; }
    .global {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .7fr); gap: 12px;
      margin-bottom: 16px;
    }
    .card { border: 1px solid var(--ev-border); border-radius: 13px; background: var(--card-background-color); overflow: hidden; }
    .global-card { padding: 16px; }
    .global-row { display: flex; gap: 12px; align-items: center; }
    .execution-row { align-items: stretch; flex-direction: column; gap: 8px; }
    .global-row + .global-row { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--ev-border); }
    .global-copy { flex: 1; min-width: 0; }
    .label { font-size: 12.5px; font-weight: 700; }
    .help { margin-top: 3px; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.45; }
    .execution { width: 100%; min-height: 38px; padding: 8px 10px; border: 1px solid var(--ev-border); border-radius: 9px; color: var(--primary-text-color); background: var(--secondary-background-color); }
    .safety { display: flex; gap: 10px; padding: 14px 16px; background: color-mix(in srgb, var(--ev-amber) 8%, var(--card-background-color)); }
    .safety ha-icon { flex: 0 0 auto; color: var(--ev-amber); --mdc-icon-size: 20px; }
    .safety strong { display: block; font-size: 12.5px; }
    .safety span { display: block; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.45; margin-top: 3px; }
    .vehicle-list { display: grid; gap: 12px; }
    .vehicle-head { padding: 15px 16px; display: flex; align-items: center; gap: 12px; }
    .car-icon { width: 38px; height: 38px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 10px; color: var(--ev-blue); background: var(--ev-soft); }
    .car-icon ha-icon { --mdc-icon-size: 21px; }
    .vehicle-main { flex: 1; min-width: 0; }
    .vehicle-name { font-size: 14px; font-weight: 720; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vehicle-status { margin-top: 3px; color: var(--secondary-text-color); font-size: 11.5px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; background: var(--ev-amber); }
    .status-dot.good { background: var(--ev-green); }
    .status-dot.bad { background: var(--ev-red); }
    .mode { display: flex; padding: 3px; gap: 2px; border: 1px solid var(--ev-border); border-radius: 9px; background: var(--secondary-background-color); }
    .mode button { min-height: 30px; padding: 6px 9px; border: 0; border-radius: 6px; background: transparent; color: var(--secondary-text-color); cursor: pointer; font-size: 11.5px; font-weight: 650; }
    .mode button.on { background: var(--card-background-color); color: var(--ev-blue); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .metrics { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border-top: 1px solid var(--ev-border); }
    .metric { padding: 13px 12px; min-width: 0; }
    .metric + .metric { border-left: 1px solid var(--ev-border); }
    .metric small { display: block; color: var(--secondary-text-color); font-size: 9.5px; text-transform: uppercase; letter-spacing: .5px; }
    .metric strong { display: block; margin-top: 5px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .plan-note { padding: 12px 16px; border-top: 1px solid var(--ev-border); display: flex; gap: 9px; align-items: flex-start; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.45; }
    .plan-note ha-icon { --mdc-icon-size: 17px; color: var(--ev-blue); flex: 0 0 auto; }
    .plan-note.problem { color: var(--ev-red); }
    .plan-note.problem ha-icon { color: var(--ev-red); }
    .editor { border-top: 1px solid var(--ev-border); padding: 16px; background: color-mix(in srgb, var(--secondary-background-color) 46%, var(--card-background-color)); }
    .editor-section + .editor-section { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--ev-border); }
    .editor-title { font-size: 12px; font-weight: 750; margin-bottom: 10px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 11px; }
    .field { min-width: 0; }
    .field.wide { grid-column: span 2; }
    .field label { display: block; font-size: 10.5px; font-weight: 650; color: var(--secondary-text-color); margin: 0 0 5px 2px; }
    .field input, .field select { width: 100%; min-height: 38px; padding: 8px 10px; border: 1px solid var(--ev-border); border-radius: 9px; color: var(--primary-text-color); background: var(--card-background-color); font-size: 12.5px; }
    .field input:disabled, .field select:disabled { opacity: .58; }
    .check { display: flex; align-items: flex-start; gap: 9px; min-height: 38px; padding: 9px 10px; border: 1px solid var(--ev-border); border-radius: 9px; background: var(--card-background-color); font-size: 11.5px; line-height: 1.35; cursor: pointer; }
    .check input { margin: 1px 0 0; accent-color: var(--ev-blue); }
    .check.locked { cursor: default; }
    .check.locked ha-icon { flex: 0 0 auto; color: var(--ev-green); --mdc-icon-size: 18px; }
    .week { display: grid; grid-template-columns: repeat(7, minmax(92px, 1fr)); gap: 7px; overflow-x: auto; padding-bottom: 3px; }
    .day { min-width: 92px; padding: 9px; border: 1px solid var(--ev-border); border-radius: 9px; background: var(--card-background-color); }
    .day-head { display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 700; }
    .day input[type=time], .day input[type=number] { width: 100%; margin-top: 7px; min-height: 31px; padding: 5px 6px; border: 1px solid var(--ev-border); border-radius: 7px; color: var(--primary-text-color); background: var(--secondary-background-color); font-size: 11px; }
    .editor-actions { display: flex; justify-content: space-between; gap: 8px; margin-top: 18px; flex-wrap: wrap; }
    .journal { margin-top: 16px; }
    .journal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; }
    .journal-row { display: grid; grid-template-columns: 120px 110px minmax(0,1fr); gap: 10px; padding: 10px 12px; border-top: 1px solid var(--ev-border); font-size: 11.5px; }
    .journal-row:first-child { border-top: 0; }
    .journal-row span { color: var(--secondary-text-color); }
    .saved { color: var(--ev-green); font-size: 11.5px; font-weight: 650; }
    .compact-title { display: flex; align-items: baseline; gap: 8px; margin-bottom: 9px; }
    .compact-title strong { font-size: 17px; }
    .compact-title span { color: var(--secondary-text-color); font-size: 12px; }
    .compact .vehicle-head { padding: 13px 14px; }
    .compact .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .compact .metric:nth-child(5) { display: none; }
    @media (max-width: 760px) {
      .topbar { flex-wrap: wrap; }
      .actions { width: 100%; justify-content: stretch; }
      .actions .btn { flex: 1; }
      .global { grid-template-columns: 1fr; }
      .vehicle-head { flex-wrap: wrap; }
      .mode { width: 100%; overflow-x: auto; }
      .mode button { flex: 1; min-width: max-content; }
      .metrics { grid-template-columns: repeat(2, 1fr); }
      .metric:nth-child(odd) { border-left: 0; }
      .metric { border-top: 1px solid var(--ev-border); }
      .metrics .metric:first-child, .metrics .metric:nth-child(2) { border-top: 0; }
      .form-grid { grid-template-columns: 1fr; }
      .field.wide { grid-column: auto; }
      .journal-row { grid-template-columns: 1fr; gap: 3px; }
      .compact .metrics { grid-template-columns: repeat(2, 1fr); }
    }
  `;

  protected willUpdate(): void {
    if (this.hass && !this._loadStarted) {
      this._loadStarted = true;
      void this.refresh();
    }
  }

  protected updated(): void {
    // Every visible form label becomes the accessible name of its first
    // control, including labels translated after Lit has rendered the DOM.
    this.renderRoot.querySelectorAll<HTMLElement>('.field').forEach(field => {
      const label = field.querySelector('label')?.textContent?.trim();
      const control = field.querySelector<HTMLElement>('input, select');
      if (label && control && !control.getAttribute('aria-label')) control.setAttribute('aria-label', label);
    });
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._refreshTimer = window.setInterval(() => {
      if (!this._saving && !this._refreshing && !this._modePending && !this._clearingJournal && this.hass) void this.refresh();
    }, 60_000);
  }

  public disconnectedCallback(): void {
    if (this._refreshTimer !== undefined) window.clearInterval(this._refreshTimer);
    this._refreshTimer = undefined;
    super.disconnectedCallback();
  }

  public async refresh(): Promise<void> {
    const request = ++this._liveRequestSequence;
    const configGeneration = this._configGeneration;
    try {
      const payload = await this.hass.callWS<EVPayload>({ type: 'smarthomeshop/smart_ev' });
      if (!responseIsCurrent(request, this._liveRequestSequence, configGeneration, this._configGeneration)) return;
      this._applyPayload(payload, this._dirty || this._saving || this._modePending > 0);
      this._error = '';
    } catch (err: any) {
      if (!responseIsCurrent(request, this._liveRequestSequence, configGeneration, this._configGeneration)) return;
      this._error = `${this._t('Could not load Smart EV.')} ${err?.message || ''}`.trim();
    } finally {
      this._loaded = true;
    }
  }

  private _applyPayload(payload: EVPayload, preserveDraft = false): void {
    if (!preserveDraft) this._config = this._clone(payload.config || { enabled: false, execution_mode: 'advice', vehicles: [] });
    this._plans = payload.plans || {};
    this._journal = payload.journal || [];
  }

  private _markDirty(): void {
    this._dirty = true;
    this._saved = false;
    this._editVersion += 1;
  }

  private _clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private _t(source: string, variables: Record<string, string | number> = {}): string {
    return panelText(this.hass, source, variables);
  }

  private _reason(source: string): string {
    return translateEVReason(source, part => this._t(part));
  }

  private _blankVehicle(): EVVehicle {
    const id = globalThis.crypto?.randomUUID?.() || `ev-${Date.now()}`;
    return {
      id, name: this._t('Electric vehicle'), enabled: true, mode: 'smart', capacity_kwh: 60,
      target_soc: 80, minimum_soc: 20, charge_power_kw: 11, charge_efficiency: .9,
      control_kind: 'switch', charge_option: 'Charge', pause_option: 'Off',
      max_current_a: 16, min_current_a: 6, off_current_a: 0, phases: 3, voltage: 230,
      charger_id: id, ready_by: '07:00', earliest_start: '', schedule: {},
      calendar_keyword: 'charge', energy_preference: 'balanced',
      allow_home_battery_support: false, finish_in_one_go: false,
      one_go_extra_eur: .35, plan_stability_eur: .15, planning_hours: 36,
      grid_guard: true, grid_import_limit_w: 17000, grid_safety_margin_w: 250,
    };
  }

  private _addVehicle(): void {
    const vehicle = this._blankVehicle();
    this._config = { ...this._config, enabled: true, vehicles: [...this._config.vehicles, vehicle] };
    this._openVehicle = vehicle.id;
    this._markDirty();
  }

  private _updateVehicle(vehicleId: string, patch: Partial<EVVehicle>): void {
    this._config = {
      ...this._config,
      vehicles: this._config.vehicles.map(vehicle => vehicle.id === vehicleId ? { ...vehicle, ...patch } : vehicle),
    };
    this._markDirty();
  }

  private _number(event: Event): number {
    const value = (event.currentTarget as HTMLInputElement).value.trim();
    return value === '' ? Number.NaN : Number(value);
  }

  private _hasInvalidNumbers(): boolean {
    const routes = new Map<string, string>();
    return this._config.vehicles.some(vehicle => {
      const invalidVehicleValue = Object.entries(EV_NUMBER_RANGES).some(([key, range]) => {
        const value = Number(vehicle[key as keyof EVVehicle]);
        return !Number.isFinite(value) || value < range[0] || value > range[1];
      });
      const invalidSchedule = Object.values(vehicle.schedule || {}).some(rule =>
        !Number.isFinite(rule.target_soc) || rule.target_soc < 1 || rule.target_soc > 100);
      const invalidSelectOptions = vehicle.control_kind === 'select'
        && (!vehicle.charge_option.trim()
          || !vehicle.pause_option.trim()
          || vehicle.charge_option.trim() === vehicle.pause_option.trim());
      const controlEntity = (vehicle.control_entity || '').trim();
      const routeSignature = JSON.stringify([
        vehicle.control_kind,
        (vehicle.stop_entity || '').trim(),
        vehicle.control_kind === 'number' ? Number(vehicle.off_current_a) : null,
        vehicle.control_kind === 'select' ? vehicle.charge_option.trim() : null,
        vehicle.control_kind === 'select' ? vehicle.pause_option.trim() : null,
      ]);
      const previousRoute = controlEntity ? routes.get(controlEntity) : undefined;
      if (controlEntity && previousRoute === undefined) routes.set(controlEntity, routeSignature);
      const invalidSharedRoute = previousRoute !== undefined && previousRoute !== routeSignature;
      const numberState = controlEntity ? this.hass.states[controlEntity] : undefined;
      const liveMinimum = Number(numberState?.attributes?.min);
      const stopEntity = (vehicle.stop_entity || '').trim();
      const stopState = stopEntity ? this.hass.states[stopEntity]?.state : undefined;
      const stopAvailable = !!stopState
        && !['unknown', 'unavailable', 'none'].includes(String(stopState).toLowerCase());
      const numberNeedsStop = vehicle.control_kind === 'number'
        && (Math.abs(Number(vehicle.off_current_a)) > .01
          || (Number.isFinite(liveMinimum) && liveMinimum > Number(vehicle.off_current_a) + .01));
      const invalidAutomaticStop = this._config.execution_mode === 'automatic'
        && numberNeedsStop && !stopAvailable;
      return invalidVehicleValue || invalidSchedule
        || invalidSelectOptions
        || invalidSharedRoute
        || invalidAutomaticStop
        || vehicle.minimum_soc > vehicle.target_soc
        || vehicle.min_current_a > vehicle.max_current_a
        || (vehicle.control_kind === 'number'
          && vehicle.off_current_a >= vehicle.min_current_a);
    });
  }

  private async _save(): Promise<void> {
    if (this._saving || this._modePending || !this.hass.user?.is_admin) return;
    if (this._hasInvalidNumbers()) {
      this._error = this._t('Check vehicle values and charger control settings.');
      await this.updateComplete;
      this.renderRoot.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    this._saving = true;
    this._error = '';
    const version = this._editVersion;
    const submitted = this._clone(this._config);
    const request = ++this._configRequestSequence;
    this._configGeneration += 1;
    try {
      const payload = await this.hass.callWS<EVPayload>({
        type: 'smarthomeshop/smart_ev/set', config: submitted,
      });
      if (request !== this._configRequestSequence) return;
      const changedWhileSaving = this._editVersion !== version;
      this._applyPayload(payload, changedWhileSaving);
      this._dirty = changedWhileSaving;
      this._saved = !changedWhileSaving;
      window.setTimeout(() => { this._saved = false; }, 2500);
    } catch (err: any) {
      this._error = `${this._t('Could not save Smart EV.')} ${err?.message ? this._reason(err.message) : this._t('Check the selected entities and values.')}`;
    } finally {
      this._saving = false;
    }
  }

  private async _refreshPlan(): Promise<void> {
    if (this._refreshing || this._saving || this._modePending) return;
    this._refreshing = true;
    this._error = '';
    const request = ++this._liveRequestSequence;
    const configGeneration = this._configGeneration;
    try {
      const payload = await this.hass.callWS<EVPayload>({ type: 'smarthomeshop/smart_ev/refresh' });
      if (!responseIsCurrent(request, this._liveRequestSequence, configGeneration, this._configGeneration)) return;
      this._applyPayload(payload, true);
    } catch (err: any) {
      if (!responseIsCurrent(request, this._liveRequestSequence, configGeneration, this._configGeneration)) return;
      this._error = `${this._t('Could not refresh the EV plan.')} ${err?.message || ''}`.trim();
    } finally {
      this._refreshing = false;
    }
  }

  private async _setMode(vehicleId: string, mode: EVMode): Promise<void> {
    if (!this.hass.user?.is_admin || this._saving || this._modePending) return;
    const previousMode = this._config.vehicles.find(vehicle => vehicle.id === vehicleId)?.mode;
    const wasDirty = this._dirty;
    const previousVersion = this._editVersion;
    const request = ++this._configRequestSequence;
    this._configGeneration += 1;
    this._modePending += 1;
    this._config = {
      ...this._config,
      vehicles: this._config.vehicles.map(vehicle => vehicle.id === vehicleId ? { ...vehicle, mode } : vehicle),
    };
    this._saved = false;
    try {
      const payload = await this.hass.callWS<EVPayload>({
        type: 'smarthomeshop/smart_ev/mode', vehicle_id: vehicleId, mode,
      });
      if (request !== this._configRequestSequence) return;
      this._applyPayload(payload, true);
      if (this._editVersion === previousVersion) {
        this._dirty = wasDirty;
        this._saved = !wasDirty;
      }
    } catch (err: any) {
      if (request === this._configRequestSequence) {
        this._config = {
          ...this._config,
          vehicles: this._config.vehicles.map(vehicle => vehicle.id === vehicleId ? { ...vehicle, mode: previousMode || 'smart' } : vehicle),
        };
        // Revert only the failed mode field. Any editor changes made while
        // the request was in flight remain intact and unsaved.
        this._dirty = this._editVersion === previousVersion ? wasDirty : true;
      }
      this._error = `${this._t('Could not change the charging mode.')} ${err?.message || ''}`.trim();
    } finally {
      this._modePending = Math.max(0, this._modePending - 1);
    }
  }

  private async _clearJournal(): Promise<void> {
    if (!this.hass.user?.is_admin || this._clearingJournal) return;
    if (!confirm(this._t('Clear the Smart EV decision journal? Vehicles, plans and charger safety state are kept.'))) return;
    this._clearingJournal = true;
    this._error = '';
    // A poll that started before the clear must not bring old rows back.
    ++this._liveRequestSequence;
    try {
      const payload = await this.hass.callWS<EVPayload>({ type: 'smarthomeshop/smart_ev/journal/clear' });
      this._journal = payload.journal || [];
    } catch (err: any) {
      this._error = `${this._t('Could not clear the Smart EV journal.')} ${err?.message || ''}`.trim();
    } finally {
      this._clearingJournal = false;
    }
  }

  private _deleteVehicle(vehicle: EVVehicle): void {
    if (!confirm(this._t('Remove {name} from Smart EV? The Home Assistant entities and charger are not deleted.', { name: vehicle.name }))) return;
    this._config = { ...this._config, vehicles: this._config.vehicles.filter(item => item.id !== vehicle.id) };
    this._openVehicle = '';
    this._markDirty();
  }

  private _setDay(vehicle: EVVehicle, day: string, patch: Partial<EVDayRule>): void {
    const fallback: EVDayRule = { enabled: false, ready_by: vehicle.ready_by, target_soc: vehicle.target_soc };
    this._updateVehicle(vehicle.id, {
      schedule: { ...vehicle.schedule, [day]: { ...(vehicle.schedule?.[day] || fallback), ...patch } },
    });
  }

  private _entityOptions(domain: string | string[], value?: string | null) {
    const domains = Array.isArray(domain) ? domain : [domain];
    const ids = Object.keys(this.hass.states || {})
      .filter(entityId => domains.includes(entityId.split('.', 1)[0]))
      .sort((a, b) => {
        const an = String(this.hass.states[a]?.attributes?.friendly_name || a);
        const bn = String(this.hass.states[b]?.attributes?.friendly_name || b);
        return an.localeCompare(bn);
      });
    if (value && !ids.includes(value)) ids.unshift(value);
    return html`
      <option value="">Not configured</option>
      ${ids.map(entityId => html`<option value=${entityId} ?selected=${entityId === value}>
        ${String(this.hass.states[entityId]?.attributes?.friendly_name || entityId)} · ${entityId}
      </option>`)}
    `;
  }

  private _selectControlOptions(entityId?: string | null, value?: string) {
    const state = entityId ? this.hass.states?.[entityId] : undefined;
    const raw = state?.attributes?.options;
    const options = Array.isArray(raw) ? raw.map(String) : [];
    if (value && !options.includes(value)) options.unshift(value);
    return options.map(option => html`<option value=${option} ?selected=${option === value} data-i18n-ignore>${option}</option>`);
  }

  private _executionStatusLabel(status?: string): string {
    return status === 'confirmation_wait'
      ? this._t('Waiting after unconfirmed command')
      : this._t(status || 'no command');
  }

  private _time(value?: string): string {
    if (!value) return this._t('Not scheduled');
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? this._t('Not scheduled') : date.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private _money(value: unknown): string {
    return Number.isFinite(Number(value)) ? `€ ${Number(value).toFixed(2)}` : '-';
  }

  private _planWindow(plan: any): string {
    const segments = plan?.segments || [];
    if (!segments.length) return this._time(plan?.deadline);
    const first = new Date(segments[0].start);
    const last = new Date(segments[segments.length - 1].end);
    if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return this._t('Plan pending');
    return `${first.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-${last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  private _problem(plan: any): boolean {
    return ['unavailable', 'insufficient_horizon'].includes(plan?.status)
      || ['unavailable', 'not_following', 'not_charging', 'confirmation_wait', 'unsafe_control', 'safety_lockout', 'manual_override', 'blocked_by_grid', 'not_owned', 'external_control'].includes(plan?.execution?.status);
  }

  private _renderVehicle(vehicle: EVVehicle, compact: boolean) {
    const plan = this._plans[vehicle.id] || {};
    const execution = plan.execution || {};
    const executionLabel = this._executionStatusLabel(execution.status);
    const problem = this._problem(plan);
    const charging = plan.action === 'charge';
    const open = !compact && this._openVehicle === vehicle.id;
    return html`
      <article class="card">
        <div class="vehicle-head">
          <div class="car-icon"><ha-icon icon="mdi:car-electric"></ha-icon></div>
          <div class="vehicle-main">
            <div class="vehicle-name" data-i18n-ignore>${vehicle.name}</div>
            <div class="vehicle-status"><i class="status-dot ${problem ? 'bad' : charging ? 'good' : ''}"></i>${this._t(plan.status || 'Waiting for first plan')} · ${executionLabel}</div>
          </div>
          <div class="mode" role="group" aria-label=${this._t('Charging mode')}>
            ${([
              ['smart', 'Smart'], ['charge_now', 'Charge now'], ['pause', 'Pause'], ['off', 'Off'],
            ] as Array<[EVMode, string]>).map(([mode, label]) => html`
              <button class=${vehicle.mode === mode ? 'on' : ''} aria-pressed=${vehicle.mode === mode}
                ?disabled=${!this.hass.user?.is_admin || this._saving || this._modePending > 0}
                @click=${() => this._setMode(vehicle.id, mode)}>${label}</button>
            `)}
          </div>
          ${!compact ? html`<button class="btn" @click=${() => { this._openVehicle = open ? '' : vehicle.id; }} aria-expanded=${open}>
            <ha-icon icon=${open ? 'mdi:chevron-up' : 'mdi:tune-variant'}></ha-icon>${open ? 'Close' : 'Configure'}
          </button>` : nothing}
        </div>
        <div class="metrics">
          <div class="metric"><small>Battery</small><strong>${plan.soc ?? '-'}%</strong></div>
          <div class="metric"><small>Target</small><strong>${plan.target_soc ?? vehicle.target_soc}%</strong></div>
          <div class="metric"><small>Ready by</small><strong>${this._time(plan.deadline)}</strong></div>
          <div class="metric"><small>Charge plan</small><strong>${this._planWindow(plan)}</strong></div>
          <div class="metric"><small>Cost · saving</small><strong>${this._money(plan.cost)} · ${this._money(plan.savings)}</strong></div>
        </div>
        <div class="plan-note ${problem ? 'problem' : ''}">
          <ha-icon icon=${problem ? 'mdi:alert-circle-outline' : charging ? 'mdi:ev-station' : 'mdi:lightbulb-on-outline'}></ha-icon>
          <div>${this._reason(execution.reason || plan.reason || 'The planner is waiting for live vehicle and price data.')}${plan.solar_kwh ? ` · ${this._t('{energy} kWh expected from solar.', { energy: plan.solar_kwh })}` : ''}${plan.guard?.status ? ` · ${this._t('Grid guard: {status}.', { status: this._t(plan.guard.status) })}` : ''}</div>
        </div>
        ${open ? this._renderEditor(vehicle) : nothing}
      </article>
    `;
  }

  private _renderEditor(vehicle: EVVehicle) {
    const controlDomains = [vehicle.control_kind];
    return html`
      <div class="editor">
        <section class="editor-section">
          <div class="editor-title">Vehicle and battery</div>
          <div class="form-grid">
            <div class="field wide"><label>Vehicle name</label><input .value=${vehicle.name} @input=${(e: Event) => this._updateVehicle(vehicle.id, { name: (e.currentTarget as HTMLInputElement).value })}></div>
            <div class="field"><label>Battery capacity (kWh)</label><input type="number" min="1" max="250" step="1" .value=${String(vehicle.capacity_kwh)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { capacity_kwh: this._number(e) })}></div>
            <div class="field"><label>State of charge entity</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { soc_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions('sensor', vehicle.soc_entity)}</select></div>
            <div class="field"><label>Optional target entity</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { target_soc_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['sensor', 'number'], vehicle.target_soc_entity)}</select></div>
            <div class="field"><label>Default target (%)</label><input type="number" min="1" max="100" .value=${String(vehicle.target_soc)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { target_soc: this._number(e) })}></div>
            <div class="field"><label>Emergency minimum (%)</label><input type="number" min="0" max="100" .value=${String(vehicle.minimum_soc)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { minimum_soc: this._number(e) })}></div>
            <div class="field"><label>Connected / plugged entity</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { plugged_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['binary_sensor', 'sensor'], vehicle.plugged_entity)}</select></div>
            <div class="field"><label>At-home entity</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { home_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['binary_sensor', 'device_tracker', 'person'], vehicle.home_entity)}</select></div>
            <div class="field"><label>Charging-state entity</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { charging_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(['binary_sensor', 'sensor'], vehicle.charging_entity)}</select></div>
            <div class="field"><label>Charging-power entity</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { power_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions('sensor', vehicle.power_entity)}</select></div>
          </div>
        </section>

        <section class="editor-section">
          <div class="editor-title">Charger control and verification</div>
          <div class="form-grid">
            <div class="field"><label>Control type</label><select .value=${vehicle.control_kind} @change=${(e: Event) => {
              const control_kind = (e.currentTarget as HTMLSelectElement).value as ControlKind;
              this._updateVehicle(vehicle.id, { control_kind, control_entity: null });
            }}><option value="switch">On / off switch</option><option value="number">Charging current number</option><option value="select">Mode select</option></select></div>
            <div class="field wide"><label>Charger control entity</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { control_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions(controlDomains, vehicle.control_entity)}</select></div>
            ${vehicle.control_kind === 'number' ? html`
              <div class="field wide"><label>Separate charger stop switch</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { stop_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions('switch', vehicle.stop_entity)}</select></div>
            ` : nothing}
            ${vehicle.control_kind === 'select' ? html`
              <div class="field"><label>Charge option</label><select .value=${vehicle.charge_option} @change=${(e: Event) => this._updateVehicle(vehicle.id, { charge_option: (e.currentTarget as HTMLSelectElement).value })}>${this._selectControlOptions(vehicle.control_entity, vehicle.charge_option)}</select></div>
              <div class="field"><label>Pause / off option</label><select .value=${vehicle.pause_option} @change=${(e: Event) => this._updateVehicle(vehicle.id, { pause_option: (e.currentTarget as HTMLSelectElement).value })}>${this._selectControlOptions(vehicle.control_entity, vehicle.pause_option)}</select></div>
            ` : nothing}
            <div class="field"><label>Expected charge power (kW)</label><input type="number" min=".1" max="50" step=".1" .value=${String(vehicle.charge_power_kw)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { charge_power_kw: this._number(e) })}></div>
            <div class="field"><label>Maximum current (A)</label><input type="number" min="1" max="80" step="1" .value=${String(vehicle.max_current_a)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { max_current_a: this._number(e) })}></div>
            <div class="field"><label>Minimum current (A)</label><input type="number" min="1" max="80" step="1" .value=${String(vehicle.min_current_a)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { min_current_a: this._number(e) })}></div>
            <div class="field"><label>Off current (A)</label><input type="number" min="0" max="80" step="1" .value=${String(vehicle.off_current_a)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { off_current_a: this._number(e) })}></div>
            <div class="field"><label>${this._t('Phases used while charging')}</label><select .value=${String(vehicle.phases)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { phases: this._number(e) })}><option value="1">${this._t('1 phase')}</option><option value="3">${this._t('3 phases')}</option></select></div>
            <div class="field"><label>Shared charger group</label><input .value=${vehicle.charger_id} @input=${(e: Event) => this._updateVehicle(vehicle.id, { charger_id: (e.currentTarget as HTMLInputElement).value })}></div>
          </div>
          <div class="help" style="margin-top:8px;">${this._t('Commands use normal Home Assistant services. Smart EV waits for entity-state confirmation. A new start that cannot be confirmed is stopped and waits five minutes; a failed adjustment to an owned session is stopped safely before one fresh start attempt after another live safety check. A current controller that cannot accept 0 A requires a separate stop switch before Automatic mode can start it.')} ${this._t('Automatic grid guarding also requires a live charging-power entity so the EV is not counted twice.')} ${this._t('Select the number of phases the connected vehicle actually uses while charging, not only the wallbox capability; a wrong value can make automatic grid guarding unsafe.')}</div>
        </section>

        <section class="editor-section">
          <div class="editor-title">Ready-by schedule</div>
          <div class="form-grid" style="margin-bottom:10px;">
            <div class="field"><label>Daily fallback deadline</label><input type="time" .value=${vehicle.ready_by} @change=${(e: Event) => this._updateVehicle(vehicle.id, { ready_by: (e.currentTarget as HTMLInputElement).value })}></div>
            <div class="field"><label>Do not start before (optional)</label><input type="time" .value=${vehicle.earliest_start || ''} @change=${(e: Event) => this._updateVehicle(vehicle.id, { earliest_start: (e.currentTarget as HTMLInputElement).value })}></div>
            <div class="field"><label>Planning horizon (hours)</label><input type="number" min="6" max="72" .value=${String(vehicle.planning_hours)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { planning_hours: this._number(e) })}></div>
          </div>
          <div class="week">
            ${WEEKDAYS.map(([day, label]) => {
              const rule = vehicle.schedule?.[day] || { enabled: false, ready_by: vehicle.ready_by, target_soc: vehicle.target_soc };
              return html`<div class="day">
                <label class="day-head"><input type="checkbox" .checked=${rule.enabled} @change=${(e: Event) => this._setDay(vehicle, day, { enabled: (e.currentTarget as HTMLInputElement).checked })}>${label}</label>
                <input type="time" .value=${rule.ready_by} ?disabled=${!rule.enabled} aria-label=${this._t('{day} ready time', { day: this._t(label) })} @change=${(e: Event) => this._setDay(vehicle, day, { ready_by: (e.currentTarget as HTMLInputElement).value })}>
                <input type="number" min="1" max="100" .value=${String(rule.target_soc)} ?disabled=${!rule.enabled} aria-label=${this._t('{day} target percentage', { day: this._t(label) })} @change=${(e: Event) => this._setDay(vehicle, day, { target_soc: this._number(e) })}>
              </div>`;
            })}
          </div>
          <div class="form-grid" style="margin-top:11px;">
            <div class="field"><label>Optional calendar entity</label><select @change=${(e: Event) => this._updateVehicle(vehicle.id, { calendar_entity: (e.currentTarget as HTMLSelectElement).value || null })}>${this._entityOptions('calendar', vehicle.calendar_entity)}</select></div>
            <div class="field wide"><label>Calendar keyword</label><input .value=${vehicle.calendar_keyword} @input=${(e: Event) => this._updateVehicle(vehicle.id, { calendar_keyword: (e.currentTarget as HTMLInputElement).value })}></div>
          </div>
          <div class="help" style="margin-top:8px;">A matching calendar event becomes the next deadline. Add a percentage such as 90% to its title to override that day's target.</div>
        </section>

        <section class="editor-section">
          <div class="editor-title">Solar, price and grid safety</div>
          <div class="form-grid">
            <div class="field"><label>Planning preference</label><select .value=${vehicle.energy_preference} @change=${(e: Event) => this._updateVehicle(vehicle.id, { energy_preference: (e.currentTarget as HTMLSelectElement).value as EVVehicle['energy_preference'] })}><option value="balanced">Balanced</option><option value="solar_first">Solar first</option><option value="price_first">Lowest price first</option></select></div>
            <div class="field"><label>Grid import limit (W)</label><input type="number" min="0" max="100000" step="100" .value=${String(vehicle.grid_import_limit_w)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { grid_import_limit_w: this._number(e) })}></div>
            <div class="field"><label>Safety margin (W)</label><input type="number" min="0" max="10000" step="50" .value=${String(vehicle.grid_safety_margin_w)} @change=${(e: Event) => this._updateVehicle(vehicle.id, { grid_safety_margin_w: this._number(e) })}></div>
            <div class="check locked"><ha-icon icon="mdi:shield-check-outline"></ha-icon><span><strong>Live P1 and fuse guard</strong><br>Always active. Charging is reduced or blocked before the main connection is overloaded.</span></div>
            <label class="check"><input type="checkbox" .checked=${vehicle.finish_in_one_go} @change=${(e: Event) => this._updateVehicle(vehicle.id, { finish_in_one_go: (e.currentTarget as HTMLInputElement).checked })}><span><strong>Prefer one continuous session</strong><br>Use one block when it costs only slightly more.</span></label>
            <label class="check"><input type="checkbox" .checked=${vehicle.allow_home_battery_support} @change=${(e: Event) => this._updateVehicle(vehicle.id, { allow_home_battery_support: (e.currentTarget as HTMLInputElement).checked })}><span><strong>Allow home-battery support</strong><br>Permit planned home-battery discharge while the car charges.</span></label>
          </div>
        </section>

        <div class="editor-actions">
          <button class="btn danger" @click=${() => this._deleteVehicle(vehicle)}><ha-icon icon="mdi:trash-can-outline"></ha-icon>Remove vehicle</button>
          <button class="btn primary" ?disabled=${this._saving || this._modePending > 0 || !this.hass.user?.is_admin} @click=${this._save}><ha-icon icon="mdi:content-save-outline"></ha-icon>${this._saving ? 'Saving...' : 'Save Smart EV'}</button>
        </div>
      </div>
    `;
  }

  private _renderCompact() {
    if (!this._config.enabled || !this._config.vehicles.length) return nothing;
    return html`<section class="compact">
      ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      <div class="compact-title"><strong>Smart EV</strong><span>${this._t(this._config.vehicles.length === 1 ? '{count} vehicle planned with your home energy' : '{count} vehicles planned with your home energy', { count: this._config.vehicles.length })}</span></div>
      <div class="vehicle-list">${this._config.vehicles.map(vehicle => this._renderVehicle(vehicle, true))}</div>
    </section>`;
  }

  protected render() {
    if (!this._loaded) return html`<div class="loading">Loading Smart EV...</div>`;
    if (this.compact) return this._renderCompact();
    return html`
      <div class="topbar">
        <div class="top-icon"><ha-icon icon="mdi:car-electric"></ha-icon></div>
        <div class="top-copy"><div class="title">Smart EV</div><div class="sub">Plan every car around its ready-by time, live prices, solar production, home-battery plan and P1 capacity. Everything remains local in Home Assistant.</div></div>
        <div class="actions">
          ${this._saved ? html`<span class="saved">Saved and recalculated</span>` : nothing}
          <button class="btn" ?disabled=${this._refreshing || this._saving || this._modePending > 0} @click=${this._refreshPlan}><ha-icon icon="mdi:refresh"></ha-icon>${this._refreshing ? 'Checking...' : 'Recalculate'}</button>
          <button class="btn" ?disabled=${!this.hass.user?.is_admin} @click=${this._addVehicle}><ha-icon icon="mdi:plus"></ha-icon>Add vehicle</button>
          <button class="btn primary" ?disabled=${this._saving || this._modePending > 0 || !this.hass.user?.is_admin} @click=${this._save}><ha-icon icon="mdi:content-save-outline"></ha-icon>${this._saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
      ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      <div class="global">
        <div class="card global-card">
          <div class="global-row"><div class="global-copy"><div class="label">Enable Smart EV</div><div class="help">Show plans and create EV plan, charging and problem entities in Home Assistant.</div></div><ha-switch aria-label=${this._t('Enable Smart EV')} .checked=${this._config.enabled} ?disabled=${!this.hass.user?.is_admin} @change=${(e: Event) => { this._config = { ...this._config, enabled: (e.currentTarget as HTMLElement & { checked: boolean }).checked }; this._markDirty(); }}></ha-switch></div>
          <div class="global-row execution-row"><div class="global-copy"><div class="label">Execution mode</div><div class="help">Start with advice, validate with shadow mode, then enable guarded automatic control.</div></div><select class="execution" aria-label=${this._t('Execution mode')} .value=${this._config.execution_mode} ?disabled=${!this.hass.user?.is_admin} @change=${(e: Event) => { this._config = { ...this._config, execution_mode: (e.currentTarget as HTMLSelectElement).value as ExecutionMode }; this._markDirty(); }}><option value="advice">Advice only</option><option value="shadow">Simulation / shadow mode</option><option value="automatic">Automatic execution</option></select></div>
        </div>
        <div class="card safety"><ha-icon icon="mdi:shield-check-outline"></ha-icon><div><strong>${this._t('Safe by default')}</strong><span>${this._t('Automatic control waits for fresh P1 data, respects main-fuse headroom and verifies charger feedback. An unconfirmed new start is stopped instead of retried immediately. Missing or stale safety signals block charging instead of guessing.')}</span></div></div>
      </div>
      ${!this._config.vehicles.length ? html`<div class="empty"><strong>No electric vehicles configured yet.</strong><br>Add a vehicle, choose its existing Home Assistant entities and start in Advice only mode.</div>` : html`<div class="vehicle-list">${this._config.vehicles.map(vehicle => this._renderVehicle(vehicle, false))}</div>`}
      ${this._journal.length ? html`<section class="journal"><div class="journal-head"><div><div class="title">Decision journal</div><div class="help">Only meaningful changes are stored locally.</div></div>${this.hass.user?.is_admin ? html`<button class="btn danger" ?disabled=${this._clearingJournal} @click=${this._clearJournal}><ha-icon icon="mdi:delete-sweep-outline"></ha-icon>${this._t('Clear journal')}</button>` : nothing}</div><div class="card">${this._journal.slice(0, 20).map(row => html`<div class="journal-row"><strong data-i18n-ignore>${row.vehicle_name || row.vehicle_id}</strong><span>${this._t(row.action || 'hold')} · ${this._executionStatusLabel(row.status)}</span><span>${this._reason(row.reason || '')}</span></div>`)}</div></section>` : nothing}
    `;
  }
}

if (!customElements.get('shs-energy-ev')) {
  customElements.define('shs-energy-ev', EnergyEV);
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-energy-ev': EnergyEV;
  }
}
