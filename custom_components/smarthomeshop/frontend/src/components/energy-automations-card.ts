import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  EnergyCardBase,
  energyCardStyles,
  fireMoreInfo,
  formatTime,
  type BaseEnergyCardConfig,
} from './energy-card-common';
import { energyText } from '../utils/energy-translations';
import './energy-card-editor';

let automationEditorRequest: Promise<boolean> | undefined;
const BUNDLE_VERSION = '__VERSION__';
const ensureAutomationEditor = (): Promise<boolean> => {
  if (customElements.get('shs-energy-automations')) return Promise.resolve(true);
  if (!automationEditorRequest) {
    automationEditorRequest = new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = `/smarthomeshop_files/smarthomeshop-panel.js?v=${BUNDLE_VERSION}`;
      script.onload = () => {
        void customElements.whenDefined('shs-energy-automations').then(() => resolve(true));
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
      window.setTimeout(() => resolve(!!customElements.get('shs-energy-automations')), 8000);
    });
  }
  return automationEditorRequest;
};

export interface EnergyAutomationsCardConfig extends BaseEnergyCardConfig {
  view?: 'compact' | 'expanded';
  show_schedules?: boolean;
  show_controls?: boolean;
  show_last_triggered?: boolean;
}

interface ManagedSettings {
  version: number;
  scenario: string;
  targets: string[];
  params: Record<string, number>;
}

interface ManagedAutomation {
  id: string;
  entityId: string;
  alias: string;
  deviceName: string;
  scenario: string;
  targets: string[];
  params: Record<string, number>;
}

interface SmartSchedule {
  id: string;
  name: string;
  target_entity: string;
  hours: number;
  ready_by: string;
  earliest?: string | null;
  interruptible?: boolean;
  enabled?: boolean;
  entity_id?: string;
  active?: boolean;
  next_start?: string | null;
  forced?: boolean;
  reason?: string;
}

interface ScenarioPresentation {
  title: string;
  icon: string;
  color: string;
  aliasStem: string;
}

const SCENARIOS: Record<string, ScenarioPresentation> = {
  run_cheapest_block: {
    title: 'Run in the cheapest hours',
    icon: 'mdi:clock-star-four-points-outline',
    color: '#159957',
    aliasStem: 'Run in cheapest',
  },
  run_while_cheap_now: {
    title: 'Run while electricity is cheap',
    icon: 'mdi:cash-clock',
    color: '#159957',
    aliasStem: 'Run while cheap',
  },
  pause_on_price_peak: {
    title: 'Pause during price peaks',
    icon: 'mdi:transmission-tower-off',
    color: '#d34a4a',
    aliasStem: 'Pause on price peak',
  },
  precharge_climate_before_peak: {
    title: 'Pre-heat cheap, ease off at peak',
    icon: 'mdi:home-thermometer',
    color: '#d8890b',
    aliasStem: 'Pre-heat cheap',
  },
  solar_surplus_switch: {
    title: 'Use solar surplus',
    icon: 'mdi:solar-power-variant',
    color: '#d8890b',
    aliasStem: 'Solar surplus',
  },
  solar_surplus_heat_boost: {
    title: 'Heat on solar surplus',
    icon: 'mdi:water-boiler',
    color: '#d8890b',
    aliasStem: 'Heat on solar surplus',
  },
  keep_solar_export_near_zero: {
    title: 'Keep solar export near zero',
    icon: 'mdi:transmission-tower-export',
    color: '#4361ee',
    aliasStem: 'Keep solar export near zero',
  },
  avoid_negative_price_solar_export: {
    title: 'Avoid negative-price solar export',
    icon: 'mdi:solar-power-variant-outline',
    color: '#d34a4a',
    aliasStem: 'Avoid negative-price solar export',
  },
  dump_load_on_negative_feed_in: {
    title: 'Self-consume on negative feed-in',
    icon: 'mdi:transmission-tower-import',
    color: '#4361ee',
    aliasStem: 'Self-consume on negative feed-in',
  },
  ev_charge_cheapest_block: {
    title: 'Charge the car in the cheapest hours',
    icon: 'mdi:car-electric',
    color: '#4361ee',
    aliasStem: 'Charge EV cheapest',
  },
};

const DEFAULTS: Required<Omit<EnergyAutomationsCardConfig, 'type' | 'title'>> = {
  show_header: true,
  view: 'expanded',
  show_schedules: true,
  show_controls: true,
  show_last_triggered: true,
};

const managedSettings = (config: Record<string, any>): ManagedSettings | undefined => {
  const raw = config.variables?.shs_managed_settings;
  if (typeof raw !== 'string') return undefined;
  try {
    const parsed = JSON.parse(raw) as ManagedSettings;
    if (!parsed?.scenario || !Array.isArray(parsed.targets)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

let managedAutomationCache: {
  signature: string;
  loadedAt: number;
  value: ManagedAutomation[];
} | undefined;

@customElement('smarthomeshop-energy-automations-card')
export class SmartHomeShopEnergyAutomationsCard extends EnergyCardBase<EnergyAutomationsCardConfig> {
  protected config: EnergyAutomationsCardConfig = { ...DEFAULTS };
  @state() private automations: ManagedAutomation[] = [];
  @state() private schedules: SmartSchedule[] = [];
  @state() private priceEntities: Record<string, string | null> = {};
  @state() private busy = new Set<string>();
  @state() private editing?: ManagedAutomation;
  @state() private dataError = '';

  static styles = [
    energyCardStyles,
    css`
      .card-shell { padding-bottom: 12px; }
      .card-head { margin-bottom: 12px; }
      .overview {
        display: flex;
        align-items: center;
        gap: 9px;
        color: var(--secondary-text-color);
        font-size: 10.5px;
      }
      .overview strong { color: var(--primary-text-color); font-size: 12px; }
      .head-tools { display: flex; align-items: center; gap: 8px; }
      .head-settings {
        width: 40px;
        height: 40px;
        display: inline-grid;
        place-items: center;
        border: 1px solid var(--shs-line);
        border-radius: 9px;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .head-settings:hover { color: var(--primary-text-color); background: var(--shs-surface); }
      .head-settings:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 1px; }
      .head-settings ha-icon { --mdc-icon-size: 18px; }
      .overview-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--shs-green);
        box-shadow: 0 0 0 4px var(--shs-green-soft);
      }
      .automation-list { margin: 0 -18px; border-top: 1px solid var(--shs-line); }
      .automation-row {
        position: relative;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 76px;
        padding: 12px 18px;
        border-bottom: 1px solid var(--shs-line);
        transition: background-color 160ms ease-out;
      }
      .automation-row:last-child { border-bottom: 0; }
      .automation-row:hover { background: var(--shs-surface); }
      .automation-row.disabled { opacity: .68; }
      .scenario-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        color: var(--scenario-color);
        background: color-mix(in srgb, var(--scenario-color) 12%, var(--card-background-color));
      }
      .scenario-icon ha-icon { --mdc-icon-size: 20px; }
      .row-copy { min-width: 0; }
      .row-title {
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 690;
        line-height: 1.3;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .row-state {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 3px;
        color: var(--secondary-text-color);
        font-size: 11px;
        line-height: 1.35;
      }
      .state-dot {
        width: 6px;
        height: 6px;
        flex: 0 0 6px;
        border-radius: 50%;
        background: var(--secondary-text-color);
      }
      .row-state.active { color: var(--shs-green); }
      .row-state.active .state-dot { background: var(--shs-green); }
      .row-state.attention { color: var(--shs-red); }
      .row-state.attention .state-dot { background: var(--shs-red); }
      .row-detail {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 10px;
        margin-top: 6px;
        color: var(--secondary-text-color);
        font-size: 10px;
      }
      .row-detail span { display: inline-flex; align-items: center; gap: 4px; }
      .row-detail ha-icon { --mdc-icon-size: 13px; }
      .row-actions { display: flex; align-items: center; gap: 4px; }
      .icon-btn, .text-btn {
        min-width: 40px;
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border: 1px solid transparent;
        border-radius: 9px;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .icon-btn:hover, .text-btn:hover {
        border-color: var(--shs-line);
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }
      .icon-btn:focus-visible, .text-btn:focus-visible {
        outline: 2px solid var(--shs-blue);
        outline-offset: 1px;
      }
      .icon-btn ha-icon { --mdc-icon-size: 18px; }
      .icon-btn.primary { color: var(--shs-blue); }
      .icon-btn.danger { color: var(--shs-red); }
      .icon-btn[disabled] { opacity: .4; cursor: default; }
      .group-label {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 15px 18px 8px;
        color: var(--secondary-text-color);
        font-size: 9.5px;
        font-weight: 720;
        letter-spacing: .55px;
        text-transform: uppercase;
      }
      .group-label ha-icon { --mdc-icon-size: 15px; }
      .schedule-row .scenario-icon { --scenario-color: var(--shs-amber); }
      .schedule-progress {
        width: min(150px, 100%);
        height: 3px;
        margin-top: 7px;
        overflow: hidden;
        border-radius: 99px;
        background: var(--shs-line);
      }
      .schedule-progress i {
        display: block;
        width: var(--progress);
        height: 100%;
        background: var(--shs-amber);
      }
      .empty { min-height: 170px; }
      .empty-action {
        margin-top: 3px;
        min-height: 44px;
        padding: 8px 14px;
        border: 1px solid var(--shs-line);
        border-radius: 9px;
        background: transparent;
        color: var(--shs-blue);
        cursor: pointer;
      }
      .error {
        margin: 10px 0 0;
        padding: 10px 12px;
        border-radius: 9px;
        background: var(--shs-red-soft);
        color: var(--shs-red);
        font-size: 11px;
        line-height: 1.4;
      }
      :host([data-view="compact"]) .automation-row { min-height: 62px; padding-block: 9px; }
      :host([data-view="compact"]) .scenario-icon { width: 34px; height: 34px; border-radius: 9px; }
      :host([data-view="compact"]) .row-detail { display: none; }
      @container (max-width: 520px) {
        .automation-list { margin-inline: -14px; }
        .automation-row {
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          padding: 11px 14px;
        }
        .scenario-icon { width: 34px; height: 34px; border-radius: 9px; }
        .row-actions {
          grid-column: 2;
          justify-content: flex-start;
          margin-top: -3px;
        }
        .row-actions .icon-btn {
          min-width: 44px;
          min-height: 44px;
          border-color: var(--shs-line);
        }
        .group-label { padding-inline: 14px; }
      }
      @media (pointer: coarse) {
        .head-settings, .icon-btn, .text-btn {
          min-width: 44px;
          min-height: 44px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .automation-row { transition: none; }
      }
    `,
  ];

  public setConfig(config: EnergyAutomationsCardConfig): void {
    if (!config) throw new Error('Smart Automations card configuration is required.');
    this.config = { ...DEFAULTS, ...config };
    this.toggleAttribute('data-view', false);
    this.setAttribute('data-view', this.config.view || 'expanded');
  }

  public getCardSize(): number {
    return Math.max(3, Math.min(8, this.automations.length + this.schedules.length + 1));
  }

  public getGridOptions(): { columns: number; min_columns: number; min_rows: number } {
    return { columns: 12, min_columns: 6, min_rows: 3 };
  }

  public static getStubConfig(): EnergyAutomationsCardConfig {
    return {
      type: 'custom:smarthomeshop-energy-automations-card',
      ...DEFAULTS,
    };
  }

  public static getConfigElement(): HTMLElement {
    const editor = document.createElement('smarthomeshop-energy-card-editor') as HTMLElement & {
      cardType?: string;
    };
    editor.cardType = 'automations';
    return editor;
  }

  private _t(source: string, variables?: Record<string, string | number>): string {
    return energyText(this.hass, source, variables);
  }

  protected async afterContextLoaded(): Promise<void> {
    if (!this.hass) return;
    const states = Object.entries(this.hass.states || {})
      .filter(([entityId, state]) => {
        if (!entityId.startsWith('automation.') || !state.attributes?.id) return false;
        const name = String(state.attributes?.friendly_name || '');
        return Object.values(SCENARIOS).some(scenario => name.includes(scenario.aliasStem));
      });

    const signature = states
      .map(([entityId, state]) => `${entityId}|${state.attributes?.id}|${state.attributes?.friendly_name || ''}`)
      .sort()
      .join('\n');
    const cachedAutomations = managedAutomationCache?.signature === signature
      && Date.now() - managedAutomationCache.loadedAt < 5 * 60 * 1000
      ? managedAutomationCache.value
      : undefined;
    const automationRequest = cachedAutomations
      ? Promise.resolve(cachedAutomations)
      : Promise.allSettled(states.map(async ([entityId, state]) => {
        const id = String(state.attributes.id);
        const stateAlias = String(state.attributes.friendly_name || id);
        try {
          const automationConfig = await this.hass!.callApi<Record<string, any>>(
            'GET',
            `config/automation/config/${id}`,
          );
          const managed = managedSettings(automationConfig);
          if (!managed || !SCENARIOS[managed.scenario]) return undefined;
          const alias = String(automationConfig.alias || stateAlias);
          return {
            id,
            entityId,
            alias,
            deviceName: alias.split(' - ')[0] || 'Smart energy',
            scenario: managed.scenario,
            targets: managed.targets,
            params: managed.params || {},
          } satisfies ManagedAutomation;
        } catch {
          // Non-admin users cannot read automation YAML. Keep the operational
          // overview useful by deriving the scenario from the managed alias;
          // editing and target details remain admin-only.
          const scenario = Object.entries(SCENARIOS)
            .find(([, presentation]) => stateAlias.includes(presentation.aliasStem))?.[0];
          if (!scenario) return undefined;
          const hours = Number(stateAlias.match(/(\d+)h\b/)?.[1]);
          return {
            id,
            entityId,
            alias: stateAlias,
            deviceName: stateAlias.split(' - ')[0] || 'Smart energy',
            scenario,
            targets: [],
            params: Number.isFinite(hours) ? { hours } : {},
          } satisfies ManagedAutomation;
        }
      })).then(results => results
        .filter((result): result is PromiseFulfilledResult<ManagedAutomation | undefined> =>
          result.status === 'fulfilled')
        .map(result => result.value)
        .filter((item): item is ManagedAutomation => !!item)
        .sort((a, b) => a.alias.localeCompare(b.alias)));

    const [automations, schedulesResult] = await Promise.all([
      automationRequest,
      this.hass.callWS<{ schedules: SmartSchedule[] }>({ type: 'smarthomeshop/schedules' })
        .catch(() => undefined),
    ]);

    this.automations = automations;
    if (!cachedAutomations) {
      managedAutomationCache = { signature, loadedAt: Date.now(), value: automations };
    }
    if (schedulesResult) this.schedules = schedulesResult.schedules || [];
    this.priceEntities = this.context?.priceEntities || {};
    this.dataError = schedulesResult
      ? ''
      : this._t('Schedules could not be refreshed. Showing the latest available data.');
  }

  private _state(entityId?: string) {
    return entityId ? this.hass?.states[entityId] : undefined;
  }

  private _targetNames(targets: string[]): string {
    if (!this.hass || !targets.length) return this._t('No entities');
    const names = targets.map(entityId =>
      String(this.hass!.states[entityId]?.attributes?.friendly_name || entityId));
    if (names.length <= 2) return names.join(' + ');
    return `${names.slice(0, 2).join(' + ')} +${names.length - 2}`;
  }

  private _automationRuntime(item: ManagedAutomation): {
    tone: 'active' | 'attention' | 'waiting';
    label: string;
  } {
    const automation = this._state(item.entityId);
    if (!automation || automation.state === 'off') {
      return { tone: 'attention', label: this._t('Disabled — no automatic actions') };
    }
    if (Number(automation.attributes?.current || 0) > 0) {
      return { tone: 'active', label: this._t('Running an action now') };
    }

    const px = (key: string) => this._state(this.priceEntities[key] || undefined);
    const grid = this.context?.netEntity ? Number(this._state(this.context.netEntity)?.state) : NaN;
    const hours = Math.round(item.params.hours || (item.scenario === 'ev_charge_cheapest_block' ? 4 : 3));
    const threshold = Number(item.params.device_power || item.params.export_threshold || 100);
    const feedIn = Number(px('feed_in_price')?.state);
    let active = false;
    let label = this._t('Ready — waiting for its trigger');

    if (item.scenario === 'run_cheapest_block' || item.scenario === 'ev_charge_cheapest_block') {
      active = px(`cheapest_${hours}h_window_now`)?.state === 'on';
      label = this._t(active ? 'Cheapest {hours}-hour window is active' : 'Waiting for the cheapest {hours}-hour window', { hours });
    } else if (item.scenario === 'run_while_cheap_now') {
      active = px('cheap_now')?.state === 'on';
      label = this._t(active ? 'Electricity is cheap now' : 'Waiting for a below-average price');
    } else if (item.scenario === 'pause_on_price_peak') {
      active = px('price_level')?.state === 'peak';
      label = this._t(active ? 'Price peak — selected loads should be paused' : 'No price peak right now');
    } else if (item.scenario === 'precharge_climate_before_peak') {
      const cheap = px(`cheapest_${hours}h_window_now`)?.state === 'on';
      const peak = px('price_level')?.state === 'peak';
      active = cheap || peak;
      label = this._t(cheap ? 'Pre-heating in the cheap window' : peak ? 'Peak mode is active' : 'Waiting for a cheap window or price peak');
    } else if (item.scenario === 'solar_surplus_switch' || item.scenario === 'solar_surplus_heat_boost') {
      active = Number.isFinite(grid) && grid <= -threshold;
      label = active
        ? this._t('{watts} W grid export meets the surplus threshold', { watts: Math.round(Math.abs(grid)) })
        : this._t('Waiting for at least {watts} W solar surplus', { watts: Math.round(threshold) });
    } else if (item.scenario === 'keep_solar_export_near_zero') {
      active = Number.isFinite(grid) && grid < -threshold;
      label = this._t(active ? 'Reducing exported solar power' : 'Monitoring grid flow');
    } else if (item.scenario === 'avoid_negative_price_solar_export') {
      const limit = Number(item.params.feed_in_threshold || 0);
      active = Number.isFinite(feedIn) && feedIn < limit && Number.isFinite(grid) && grid < 0;
      label = this._t(active ? 'Curtailing export during negative feed-in' : 'No unwanted paid export');
    } else if (item.scenario === 'dump_load_on_negative_feed_in') {
      active = Number.isFinite(feedIn) && feedIn < 0;
      label = this._t(active ? 'Negative feed-in — self-consumption active' : 'Feed-in price is not negative');
    }
    return { tone: active ? 'active' : 'waiting', label };
  }

  private _lastTriggered(item: ManagedAutomation): string {
    const value = this._state(item.entityId)?.attributes?.last_triggered;
    if (!value) return this._t('Never triggered');
    const time = new Date(String(value)).getTime();
    if (!Number.isFinite(time)) return this._t('Last run unknown');
    const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
    if (minutes < 1) return this._t('Triggered just now');
    if (minutes < 60) return this._t('Triggered {minutes} min ago', { minutes });
    if (minutes < 1440) return this._t('Triggered {hours} h ago', { hours: Math.round(minutes / 60) });
    return this._t('Last run {date}', { date: new Date(time).toLocaleDateString() });
  }

  private async _toggleAutomation(item: ManagedAutomation): Promise<void> {
    if (!this.hass || this.busy.has(item.entityId)) return;
    const enable = this._state(item.entityId)?.state === 'off';
    this.busy = new Set(this.busy).add(item.entityId);
    try {
      await this.hass.callService('automation', enable ? 'turn_on' : 'turn_off', {
        entity_id: item.entityId,
      });
      this.dataError = '';
    } catch (error: any) {
      this.dataError = `${this._t(enable ? 'Could not enable the automation.' : 'Could not pause the automation.')} ${error?.message || ''}`;
    } finally {
      const next = new Set(this.busy);
      next.delete(item.entityId);
      this.busy = next;
    }
  }

  private async _toggleSchedule(item: SmartSchedule): Promise<void> {
    if (!this.hass || this.busy.has(item.id)) return;
    this.busy = new Set(this.busy).add(item.id);
    try {
      const result = await this.hass.callWS<{ schedule: SmartSchedule }>({
        type: 'smarthomeshop/schedules/set',
        schedule_id: item.id,
        name: item.name,
        target_entity: item.target_entity,
        hours: item.hours,
        ready_by: item.ready_by,
        earliest: item.earliest ?? null,
        interruptible: item.interruptible ?? true,
        enabled: item.enabled === false,
      });
      this.schedules = this.schedules.map(schedule =>
        schedule.id === item.id ? result.schedule : schedule);
      this.dataError = '';
    } catch (error: any) {
      this.dataError = `${this._t('Could not update the schedule.')} ${error?.message || ''}`;
    } finally {
      const next = new Set(this.busy);
      next.delete(item.id);
      this.busy = next;
    }
  }

  private _renderAutomation(item: ManagedAutomation) {
    const scenario = SCENARIOS[item.scenario];
    const runtime = this._automationRuntime(item);
    const enabled = this._state(item.entityId)?.state !== 'off';
    const waiting = this.busy.has(item.entityId);
    return html`
      <article class=${`automation-row${enabled ? '' : ' disabled'}`}>
        <div class="scenario-icon" style=${`--scenario-color:${scenario.color}`}>
          <ha-icon icon=${scenario.icon}></ha-icon>
        </div>
        <div class="row-copy">
          <div class="row-title">${this._t(scenario.title)}</div>
          <div class=${`row-state ${runtime.tone}`}>
            <i class="state-dot"></i><span>${runtime.label}</span>
          </div>
          <div class="row-detail">
            <span><ha-icon icon="mdi:devices"></ha-icon>${this._targetNames(item.targets)}</span>
            ${this.config.show_last_triggered !== false
              ? html`<span><ha-icon icon="mdi:history"></ha-icon>${this._lastTriggered(item)}</span>`
              : nothing}
          </div>
        </div>
        <div class="row-actions">
          ${this.config.show_controls !== false && this.hass?.user?.is_admin ? html`
            <button type="button" class=${`icon-btn${enabled ? ' danger' : ' primary'}`}
              title=${this._t(enabled ? 'Pause automation' : 'Enable automation')}
              aria-label=${`${this._t(enabled ? 'Pause automation' : 'Enable automation')}: ${this._t(scenario.title)}`}
              aria-pressed=${!enabled} aria-busy=${waiting}
              ?disabled=${waiting} @click=${() => this._toggleAutomation(item)}>
              <ha-icon icon=${enabled ? 'mdi:pause' : 'mdi:play-circle-outline'}></ha-icon>
            </button>
          ` : nothing}
          ${this.hass?.user?.is_admin ? html`
            <button type="button" class="icon-btn" title=${this._t('Edit setup')} aria-label=${`${this._t('Edit setup')}: ${this._t(scenario.title)}`}
              @click=${() => { void this._editAutomation(item); }}>
              <ha-icon icon="mdi:pencil-outline"></ha-icon>
            </button>
          ` : html`
            <button type="button" class="icon-btn" title=${this._t('More information')} aria-label=${this._t('More information')}
              @click=${() => fireMoreInfo(this, item.entityId)}>
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </button>
          `}
        </div>
      </article>
    `;
  }

  private _renderSchedule(item: SmartSchedule) {
    const enabled = item.enabled !== false;
    const active = enabled && !!item.active;
    const state = item.entity_id ? this._state(item.entity_id) : undefined;
    const done = Number(state?.attributes?.hours_done || 0);
    const required = Math.max(1, Number(state?.attributes?.hours_needed || item.hours || 1));
    const progress = Math.max(0, Math.min(100, done / required * 100));
    const detail = !enabled
      ? this._t('Disabled — deadline planning is paused')
      : active
        ? this._t(item.forced ? 'Running now to meet the deadline' : 'Running in a selected low-price hour')
        : item.next_start
          ? this._t('Next start {time} · ready by {ready}', { time: formatTime(item.next_start), ready: item.ready_by })
          : item.reason || this._t('Waiting for prices · ready by {ready}', { ready: item.ready_by });
    return html`
      <article class=${`automation-row schedule-row${enabled ? '' : ' disabled'}`}>
        <div class="scenario-icon"><ha-icon icon="mdi:calendar-clock-outline"></ha-icon></div>
        <div class="row-copy">
          <div class="row-title">${item.name}</div>
          <div class=${`row-state ${active ? 'active' : enabled ? 'waiting' : 'attention'}`}>
            <i class="state-dot"></i><span>${detail}</span>
          </div>
          <div class="row-detail">
            <span><ha-icon icon="mdi:devices"></ha-icon>${this._targetNames([item.target_entity])}</span>
            <span><ha-icon icon="mdi:timer-outline"></ha-icon>${this._t('{hours} h needed', { hours: item.hours })}</span>
          </div>
          ${this.config.view !== 'compact' && done > 0 ? html`
            <div class="schedule-progress" title=${this._t('{done} of {required} hours completed', { done: done.toFixed(1), required })}>
              <i style=${`--progress:${progress}%`}></i>
            </div>
          ` : nothing}
        </div>
        <div class="row-actions">
          ${this.config.show_controls !== false && this.hass?.user?.is_admin ? html`
            <button type="button" class=${`icon-btn${enabled ? ' danger' : ' primary'}`}
              title=${this._t(enabled ? 'Pause schedule' : 'Enable schedule')}
              aria-label=${`${this._t(enabled ? 'Pause schedule' : 'Enable schedule')}: ${item.name}`}
              aria-pressed=${!enabled} aria-busy=${this.busy.has(item.id)}
              ?disabled=${this.busy.has(item.id)}
              @click=${() => this._toggleSchedule(item)}>
              <ha-icon icon=${enabled ? 'mdi:pause' : 'mdi:play-circle-outline'}></ha-icon>
            </button>
          ` : nothing}
          ${item.entity_id ? html`
            <button type="button" class="icon-btn" title=${this._t('More information')} aria-label=${this._t('More information')}
              @click=${() => fireMoreInfo(this, item.entity_id)}>
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </button>
          ` : nothing}
        </div>
      </article>
    `;
  }

  private _openEnergySettings(): void {
    window.history.pushState(null, '', '/smarthomeshop?energy-settings=automations');
    window.dispatchEvent(new CustomEvent('location-changed'));
  }

  private async _editAutomation(item: ManagedAutomation): Promise<void> {
    if (await ensureAutomationEditor()) {
      this.editing = item;
    } else {
      this.dataError = this._t('The Smart Energy editor could not be loaded. Open SmartHomeShop Energy Settings to edit this automation.');
    }
  }

  private _renderEditDialog() {
    const item = this.editing;
    if (!item || !this.hass || !this.context) return nothing;
    const p1Device = this.context.sources.p1_device || '';
    const deviceEntities = Object.values(this.hass.entities || {})
      .filter(entity => !p1Device || entity.device_id === p1Device);
    return html`
      <shs-energy-automations
        .hass=${this.hass}
        .deviceId=${p1Device || 'smart-energy'}
        .deviceName=${item.deviceName}
        .deviceEntities=${deviceEntities}
        .dialogOnly=${true}
        .showHeader=${false}
        .autoEditScenario=${item.scenario}
        .autoEditId=${item.id}
        .autoEditEntityId=${item.entityId}
        .autoEditEnabled=${this._state(item.entityId)?.state !== 'off'}
        @shs-dialog-closed=${() => {
          this.editing = undefined;
          managedAutomationCache = undefined;
          void this.load(true);
        }}
      ></shs-energy-automations>
    `;
  }

  protected render() {
    if (!this.hass) return nothing;
    if (this.loading && !this.context) {
      return html`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div class="skeleton"></div></div></ha-card>`;
    }

    const visibleSchedules = this.config.show_schedules === false ? [] : this.schedules;
    const total = this.automations.length + visibleSchedules.length;
    const enabled = this.automations.filter(item => this._state(item.entityId)?.state !== 'off').length
      + visibleSchedules.filter(item => item.enabled !== false).length;
    const header = this.renderHeader(
      this._t('Smart automations'),
      total ? this._t('{enabled} enabled · {total} configured', { enabled, total }) : this._t('Price, solar and deadline control'),
      'mdi:robot-outline',
    );

    return html`
      <ha-card>
        <div class="card-shell">
          ${header ? html`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${header.icon}></ha-icon></div>
                <div><h2 class="head-title">${header.title}</h2><div class="head-subtitle">${header.subtitle}</div></div>
              </div>
              <div class="head-tools">
                ${total ? html`
                  <div class="overview"><i class="overview-dot"></i>${this._t('{count} enabled', { count: enabled })}</div>
                ` : nothing}
                ${this.hass.user?.is_admin ? html`
                  <button type="button" class="head-settings" title=${this._t('Open Smart Energy settings')}
                    aria-label=${this._t('Open Smart Energy settings')} @click=${this._openEnergySettings}>
                    <ha-icon icon="mdi:cog-outline"></ha-icon>
                  </button>
                ` : nothing}
              </div>
            </div>
          ` : nothing}

          ${total ? html`
            <div class="automation-list">
              ${this.automations.length ? html`
                <div class="group-label"><ha-icon icon="mdi:robot-outline"></ha-icon>${this._t('Reactive automations')}</div>
                ${this.automations.map(item => this._renderAutomation(item))}
              ` : nothing}
              ${visibleSchedules.length ? html`
                <div class="group-label"><ha-icon icon="mdi:calendar-clock-outline"></ha-icon>${this._t('Deadline schedules')}</div>
                ${visibleSchedules.map(item => this._renderSchedule(item))}
              ` : nothing}
            </div>
          ` : html`
            <div class="empty" role="status">
              <ha-icon icon="mdi:robot-confused-outline"></ha-icon>
              <strong>${this._t('No Smart Automations yet')}</strong>
              <span>${this._t('Create price, solar or deadline controls in SmartHomeShop Energy Settings. They will appear here automatically.')}</span>
              ${this.hass.user?.is_admin ? html`
                <button type="button" class="empty-action" @click=${this._openEnergySettings}>${this._t('Open Energy Settings')}</button>
              ` : nothing}
            </div>
          `}
          ${this.dataError ? html`<div class="error" role="alert">${this.dataError}</div>` : nothing}
        </div>
      </ha-card>
      ${this._renderEditDialog()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-energy-automations-card': SmartHomeShopEnergyAutomationsCard;
  }
}
