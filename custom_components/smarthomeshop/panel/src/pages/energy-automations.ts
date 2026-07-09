import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, DeviceEntity } from '../types';

// Control-action scenarios for p1/waterp1 with a connected dynamic contract.
// These turn Home Assistant into an active steerer: run loads in the cheapest
// hours, on solar surplus, or pause them at price peaks — as normal, editable
// HA automations with safety (a max-runtime watchdog, hysteresis + dwell, and
// a contract-connected condition) baked into every generated automation.

type Domain = 'switch' | 'input_boolean' | 'climate' | 'number' | 'select' | 'water_heater';
type Requires = 'contract' | 'solar' | 'contract+solar';

interface EParam {
  key: string;
  label: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  help?: string;
}

interface BuildArgs {
  target: string;
  p: Record<string, number>;
  px: Record<string, string | null>;
  net?: string;
  deviceName: string;
}

interface EnergyScenario {
  key: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  requires: Requires;
  targetDomains: Domain[];
  targetLabel: string;
  params: EParam[];
  note?: string;
  build: (a: BuildArgs) => Record<string, unknown>;
}

const DESCRIPTION = 'Created with the SmartHomeShop.io panel · smart energy';

const dom = (entityId: string): string => entityId.split('.')[0];
const turn = (target: string, on: boolean) => ({
  service: `${dom(target)}.${on ? 'turn_on' : 'turn_off'}`,
  target: { entity_id: target },
});
const setVal = (target: string, value: number) => {
  const d = dom(target);
  if (d === 'number') return { service: 'number.set_value', target: { entity_id: target }, data: { value } };
  if (d === 'water_heater') return { service: 'water_heater.set_temperature', target: { entity_id: target }, data: { temperature: value } };
  return { service: 'climate.set_temperature', target: { entity_id: target }, data: { temperature: value } };
};
const contractCond = (px: Record<string, string | null>) => ({
  condition: 'state', entity_id: px.contract_active, state: 'on',
});
const isSwitch = (target: string) => dom(target) === 'switch' || dom(target) === 'input_boolean';

const SCENARIOS: EnergyScenario[] = [
  {
    key: 'run_cheapest_block',
    title: 'Run in the cheapest hours',
    desc: 'Switch a deferrable load (boiler, pump, ventilation) on during the cheapest contiguous block of the day and off when it ends.',
    icon: 'mdi:clock-star-four-points-outline', color: '#22c55e',
    requires: 'contract', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Device to run',
    params: [{ key: 'hours', label: 'Block length', default: 3, min: 1, max: 6, step: 1, unit: 'h' }],
    build: ({ target, p, px, deviceName }) => {
      const N = p.hours;
      const win = px[`cheapest_${N}h_window_now`];
      return {
        alias: `${deviceName} – Run in cheapest ${N}h`, description: DESCRIPTION, mode: 'restart',
        trigger: [
          { platform: 'state', entity_id: win, to: 'on', id: 'start' },
          { platform: 'state', entity_id: win, to: 'off', id: 'stop' },
          { platform: 'state', entity_id: target, to: 'on', for: { hours: N + 1 }, id: 'watchdog' },
        ],
        condition: [],
        action: [{ choose: [
          { conditions: [{ condition: 'trigger', id: 'start' }, contractCond(px)], sequence: [turn(target, true)] },
          { conditions: [{ condition: 'trigger', id: ['stop', 'watchdog'] }], sequence: [turn(target, false)] },
        ] }],
      };
    },
  },
  {
    key: 'run_while_cheap_now',
    title: 'Run while electricity is cheap',
    desc: 'Run an opportunistic load whenever the price is at/below today’s average, and stop it when it rises above.',
    icon: 'mdi:cash-clock', color: '#16a34a',
    requires: 'contract', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Device to run',
    params: [{ key: 'max_runtime', label: 'Safety max runtime', default: 6, min: 1, max: 24, step: 1, unit: 'h', help: 'Forces the load off after this long, even if something goes wrong.' }],
    note: '“Cheap” here means below today’s average price — not the single cheapest window. Use “Run in the cheapest hours” for that.',
    build: ({ target, p, px, deviceName }) => ({
      alias: `${deviceName} – Run while cheap`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        { platform: 'state', entity_id: px.cheap_now, to: 'on', id: 'start' },
        { platform: 'state', entity_id: px.cheap_now, to: 'off', id: 'stop' },
        { platform: 'state', entity_id: target, to: 'on', for: { hours: p.max_runtime }, id: 'watchdog' },
      ],
      condition: [],
      action: [{ choose: [
        { conditions: [{ condition: 'trigger', id: 'start' }, contractCond(px)], sequence: [turn(target, true)] },
        { conditions: [{ condition: 'trigger', id: ['stop', 'watchdog'] }], sequence: [turn(target, false)] },
      ] }],
    }),
  },
  {
    key: 'pause_on_price_peak',
    title: 'Pause during price peaks',
    desc: 'Switch a load off when the price level hits its daily peak and back on when it drops. Trims the most expensive hours.',
    icon: 'mdi:transmission-tower-off', color: '#e11d48',
    requires: 'contract', targetDomains: ['switch', 'input_boolean', 'water_heater'], targetLabel: 'Device to pause',
    params: [],
    build: ({ target, px, deviceName }) => ({
      alias: `${deviceName} – Pause on price peak`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        { platform: 'state', entity_id: px.price_level, to: 'peak', id: 'pause' },
        { platform: 'state', entity_id: px.price_level, from: 'peak', id: 'resume' },
      ],
      condition: [contractCond(px)],
      action: [{ choose: [
        { conditions: [{ condition: 'trigger', id: 'pause' }], sequence: [turn(target, false)] },
      ], default: [turn(target, true)] }],
    }),
  },
  {
    key: 'precharge_climate_before_peak',
    title: 'Pre-heat cheap, ease off at peak',
    desc: 'Raise a thermostat setpoint during the cheapest block to store comfort, then lower it during the price peak. Uses the home as thermal storage.',
    icon: 'mdi:home-thermometer', color: '#f59e0b',
    requires: 'contract', targetDomains: ['climate'], targetLabel: 'Thermostat',
    params: [
      { key: 'hours', label: 'Cheap block', default: 2, min: 1, max: 6, step: 1, unit: 'h' },
      { key: 'comfort', label: 'Comfort temp', default: 21, min: 5, max: 30, step: 0.5, unit: '°C' },
      { key: 'eco', label: 'Eco temp (peak)', default: 18, min: 5, max: 30, step: 0.5, unit: '°C' },
    ],
    build: ({ target, p, px, deviceName }) => {
      const win = px[`cheapest_${p.hours}h_window_now`];
      return {
        alias: `${deviceName} – Pre-heat cheap, ease at peak`, description: DESCRIPTION, mode: 'restart',
        trigger: [
          { platform: 'state', entity_id: win, to: 'on', id: 'cheap' },
          { platform: 'state', entity_id: px.price_level, to: 'peak', id: 'peak' },
        ],
        condition: [contractCond(px)],
        action: [{ choose: [
          { conditions: [{ condition: 'trigger', id: 'cheap' }], sequence: [setVal(target, p.comfort)] },
          { conditions: [{ condition: 'trigger', id: 'peak' }], sequence: [setVal(target, p.eco)] },
        ] }],
      };
    },
  },
  {
    key: 'solar_surplus_switch',
    title: 'Use solar surplus for a device',
    desc: 'Switch a load on when the house exports more than it needs, and off when you would start importing — with hysteresis + dwell so it does not flap.',
    icon: 'mdi:solar-power-variant', color: '#eab308',
    requires: 'solar', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Device to run on surplus',
    params: [
      { key: 'device_power', label: 'Device power', default: 1400, min: 100, max: 11000, step: 50, unit: 'W', help: 'On when export exceeds this. Its own draw creates the off-hysteresis.' },
      { key: 'on_delay', label: 'On after', default: 5, min: 1, max: 30, step: 1, unit: 'min' },
      { key: 'off_delay', label: 'Off after', default: 3, min: 1, max: 30, step: 1, unit: 'min' },
      { key: 'max_runtime', label: 'Safety max runtime', default: 6, min: 1, max: 24, step: 1, unit: 'h' },
    ],
    build: ({ target, p, net, deviceName }) => ({
      alias: `${deviceName} – Solar surplus`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        { platform: 'numeric_state', entity_id: net, below: -p.device_power, for: { minutes: p.on_delay }, id: 'on' },
        { platform: 'numeric_state', entity_id: net, above: 50, for: { minutes: p.off_delay }, id: 'off' },
        { platform: 'state', entity_id: target, to: 'on', for: { hours: p.max_runtime }, id: 'watchdog' },
      ],
      condition: [],
      action: [{ choose: [
        { conditions: [{ condition: 'trigger', id: 'on' }], sequence: [turn(target, true)] },
        { conditions: [{ condition: 'trigger', id: ['off', 'watchdog'] }], sequence: [turn(target, false)] },
      ] }],
    }),
  },
  {
    key: 'solar_surplus_heat_boost',
    title: 'Heat on solar surplus',
    desc: 'On real solar surplus, raise a water-heater/heat-pump setpoint (or a charge-current number) to self-consume instead of exporting; revert when surplus fades.',
    icon: 'mdi:water-boiler', color: '#f97316',
    requires: 'solar', targetDomains: ['climate', 'water_heater', 'number'], targetLabel: 'Device to boost',
    params: [
      { key: 'device_power', label: 'Surplus needed', default: 1500, min: 100, max: 11000, step: 50, unit: 'W' },
      { key: 'boost', label: 'Boost value', default: 55, min: 0, max: 80, step: 1, unit: '°C / value' },
      { key: 'normal', label: 'Normal value', default: 45, min: 0, max: 80, step: 1, unit: '°C / value' },
      { key: 'on_delay', label: 'On after', default: 5, min: 1, max: 30, step: 1, unit: 'min' },
      { key: 'off_delay', label: 'Off after', default: 5, min: 1, max: 30, step: 1, unit: 'min' },
    ],
    build: ({ target, p, net, deviceName }) => ({
      alias: `${deviceName} – Heat on solar surplus`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        { platform: 'numeric_state', entity_id: net, below: -p.device_power, for: { minutes: p.on_delay }, id: 'boost' },
        { platform: 'numeric_state', entity_id: net, above: 50, for: { minutes: p.off_delay }, id: 'normal' },
      ],
      condition: [],
      action: [{ choose: [
        { conditions: [{ condition: 'trigger', id: 'boost' }], sequence: [setVal(target, p.boost)] },
        { conditions: [{ condition: 'trigger', id: 'normal' }], sequence: [setVal(target, p.normal)] },
      ] }],
    }),
  },
  {
    key: 'dump_load_on_negative_feed_in',
    title: 'Self-consume on negative feed-in',
    desc: 'When the feed-in price goes negative (you would pay to export), switch on a diversion load to self-consume instead. Off again when feed-in is positive.',
    icon: 'mdi:transmission-tower-import', color: '#8b5cf6',
    requires: 'contract', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Diversion load',
    params: [],
    build: ({ target, px, deviceName }) => ({
      alias: `${deviceName} – Self-consume on negative feed-in`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        { platform: 'numeric_state', entity_id: px.feed_in_price, below: 0, id: 'on' },
        { platform: 'numeric_state', entity_id: px.feed_in_price, above: 0, id: 'off' },
      ],
      condition: [contractCond(px)],
      action: [{ choose: [
        { conditions: [{ condition: 'trigger', id: 'on' }], sequence: [turn(target, true)] },
      ], default: [turn(target, false)] }],
    }),
  },
  {
    key: 'ev_charge_cheapest_block',
    title: 'Charge the car in the cheapest hours',
    desc: 'Start EV charging at the beginning of the cheapest block and stop at the end.',
    icon: 'mdi:car-electric', color: '#0ea5e9',
    requires: 'contract', targetDomains: ['switch', 'number'], targetLabel: 'Charger switch or charge-current',
    params: [
      { key: 'hours', label: 'Charge window', default: 4, min: 1, max: 6, step: 1, unit: 'h' },
      { key: 'current', label: 'Charge current (for a number target)', default: 16, min: 6, max: 32, step: 1, unit: 'A' },
    ],
    note: 'This does NOT guarantee a “ready by” time yet — it simply charges during the cheapest block. A deadline scheduler is planned.',
    build: ({ target, p, px, deviceName }) => {
      const win = px[`cheapest_${p.hours}h_window_now`];
      const startAct = isSwitch(target) ? turn(target, true) : setVal(target, p.current);
      const stopAct = isSwitch(target) ? turn(target, false) : setVal(target, 0);
      const trigger: Record<string, unknown>[] = [
        { platform: 'state', entity_id: win, to: 'on', id: 'start' },
        { platform: 'state', entity_id: win, to: 'off', id: 'stop' },
      ];
      if (isSwitch(target)) trigger.push({ platform: 'state', entity_id: target, to: 'on', for: { hours: p.hours + 1 }, id: 'watchdog' });
      return {
        alias: `${deviceName} – Charge EV cheapest ${p.hours}h`, description: DESCRIPTION, mode: 'restart',
        trigger, condition: [],
        action: [{ choose: [
          { conditions: [{ condition: 'trigger', id: 'start' }, contractCond(px)], sequence: [startAct] },
          { conditions: [{ condition: 'trigger', id: isSwitch(target) ? ['stop', 'watchdog'] : ['stop'] }], sequence: [stopAct] },
        ] }],
      };
    },
  },
  {
    key: 'battery_charge_cheap_hold_peak',
    title: 'Battery: charge cheap, hold for the peak',
    desc: 'Coarse arbitrage without a forecast: charge the battery during the cheapest block and stop/hold at the price peak. A preview of the battery tier.',
    icon: 'mdi:battery-charging-high', color: '#10b981',
    requires: 'contract', targetDomains: ['switch', 'number'], targetLabel: 'Grid-charge switch or power (number)',
    params: [
      { key: 'hours', label: 'Charge block', default: 2, min: 1, max: 6, step: 1, unit: 'h' },
      { key: 'power', label: 'Charge power (for a number target)', default: 2000, min: 100, max: 10000, step: 100, unit: 'W' },
    ],
    note: 'Battery brands differ — pick your inverter’s grid-charge switch or charge-power number. Fine-tune the created automation for your model.',
    build: ({ target, p, px, deviceName }) => {
      const win = px[`cheapest_${p.hours}h_window_now`];
      const chargeAct = isSwitch(target) ? turn(target, true) : setVal(target, p.power);
      const stopAct = isSwitch(target) ? turn(target, false) : setVal(target, 0);
      return {
        alias: `${deviceName} – Battery charge cheap, hold peak`, description: DESCRIPTION, mode: 'restart',
        trigger: [
          { platform: 'state', entity_id: win, to: 'on', id: 'charge' },
          { platform: 'state', entity_id: px.price_level, to: 'peak', id: 'discharge' },
        ],
        condition: [contractCond(px)],
        action: [{ choose: [
          { conditions: [{ condition: 'trigger', id: 'charge' }], sequence: [chargeAct] },
          { conditions: [{ condition: 'trigger', id: 'discharge' }], sequence: [stopAct] },
        ] }],
      };
    },
  },
];

@customElement('shs-energy-automations')
export class EnergyAutomations extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public deviceId = '';
  @property() public deviceName = '';
  @property({ attribute: false }) public deviceEntities: DeviceEntity[] = [];

  @state() private _priceEntities: Record<string, string | null> = {};
  @state() private _contractActive = false;
  @state() private _loaded = false;
  @state() private _related: string[] = [];
  @state() private _modal: EnergyScenario | null = null;
  @state() private _target = '';
  @state() private _params: Record<string, number> = {};
  @state() private _busy = false;
  @state() private _error = '';

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; }
    .head { margin: 8px 0 12px; }
    .head-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .head-sub { font-size: 12.5px; color: var(--secondary-text-color); line-height: 1.5; margin-top: 4px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .card { display: flex; flex-direction: column; gap: 10px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 14px; }
    .card-head { display: flex; align-items: flex-start; gap: 10px; }
    .card-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-icon ha-icon { --mdc-icon-size: 20px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
    .card-desc { font-size: 12px; color: var(--secondary-text-color); line-height: 1.4; margin-top: 2px; }
    .tag { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; padding: 2px 6px; border-radius: 5px; margin-top: 6px; }
    .tag.solar { background: rgba(234,179,8,.15); color: #b45309; }
    .card-foot { display: flex; align-items: center; gap: 8px; margin-top: auto; }
    .create-btn { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .create-btn:disabled { opacity: 0.5; cursor: default; }
    .create-btn ha-icon { --mdc-icon-size: 15px; }
    .created { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #22c55e; }
    .created a { color: var(--shs-primary); text-decoration: none; }
    .warn { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); color: var(--primary-text-color); border-radius: 10px; padding: 12px 14px; margin: 8px 0; font-size: 13px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
    .modal { width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.4); }
    .modal-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--divider-color); position: sticky; top: 0; background: var(--card-background-color); }
    .modal-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .modal-sub { font-size: 12.5px; color: var(--secondary-text-color); margin-top: 1px; }
    .modal-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 4px; display: flex; }
    .modal-x ha-icon { --mdc-icon-size: 20px; }
    .modal-body { padding: 18px 20px; }
    .modal-desc { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; margin: 0 0 16px; }
    .note { background: rgba(59,130,246,.08); border: 1px solid var(--divider-color); border-radius: 8px; padding: 10px 12px; font-size: 12px; color: var(--secondary-text-color); line-height: 1.45; margin-bottom: 16px; }
    label.f { display: block; font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .4px; margin: 0 0 6px; }
    .field { margin-bottom: 14px; }
    .field .help { font-size: 11px; color: var(--secondary-text-color); margin-top: 4px; line-height: 1.4; }
    select, input[type="number"] { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .row { display: flex; align-items: center; gap: 8px; }
    .row input { max-width: 130px; text-align: right; }
    .row .unit { font-size: 12px; color: var(--secondary-text-color); }
    select:focus, input:focus { outline: none; border-color: var(--shs-primary); }
    .modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--divider-color); position: sticky; bottom: 0; background: var(--card-background-color); }
    .btn-ghost { padding: 9px 16px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--primary-text-color); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; }
    .modal-foot .create-btn { margin-left: 0; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  private async _load(): Promise<void> {
    try {
      const px = await this.hass.callWS<{ entities: Record<string, string | null> }>({ type: 'smarthomeshop/prices/entities' });
      this._priceEntities = px.entities || {};
      const cfg = await this.hass.callWS<{ contract_active?: boolean }>({ type: 'smarthomeshop/device/config', device_id: this.deviceId });
      this._contractActive = !!cfg.contract_active;
    } catch (err) { console.error('energy-automations: load failed', err); }
    await this._loadRelated();
    this._loaded = true;
  }

  private async _loadRelated(): Promise<void> {
    try {
      const res = await this.hass.callWS<Record<string, string[]>>({ type: 'search/related', item_type: 'device', item_id: this.deviceId });
      this._related = res.automation || [];
    } catch { this._related = []; }
  }

  private _netEntity(): string | undefined {
    const net = this.deviceEntities.find(e => e.entity_id.includes('net_grid_power'));
    if (net) return net.entity_id;
    return this.deviceEntities.find(e => e.entity_id.endsWith('_power_produced'))?.entity_id;
  }

  private _available(s: EnergyScenario): boolean {
    const needsContract = s.requires.includes('contract');
    const needsSolar = s.requires.includes('solar');
    if (needsContract && !this._contractActive) return false;
    if (needsSolar && !this._netEntity()) return false;
    return true;
  }

  private _targetOptions(domains: Domain[]): Array<{ value: string; label: string }> {
    const out = [{ value: '', label: 'Select a device…' }];
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      if (!domains.includes(dom(entityId) as Domain)) continue;
      out.push({ value: entityId, label: (st.attributes?.friendly_name as string) || entityId });
    }
    return [out[0], ...out.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
  }

  private _createdId(s: EnergyScenario): string | undefined {
    const prefix = `${this.deviceName || 'the device'} – `;
    for (const entityId of this._related) {
      const st = this.hass.states[entityId];
      const name = st?.attributes?.friendly_name as string | undefined;
      if (name && name.startsWith(prefix) && this._aliasMatches(s, name)) {
        return (st.attributes?.id as string | undefined) || undefined;
      }
    }
    return undefined;
  }

  private _aliasMatches(s: EnergyScenario, friendly: string): boolean {
    // Match the stable stem of each scenario's alias (block length varies).
    const stems: Record<string, string> = {
      run_cheapest_block: 'Run in cheapest',
      run_while_cheap_now: 'Run while cheap',
      pause_on_price_peak: 'Pause on price peak',
      precharge_climate_before_peak: 'Pre-heat cheap',
      solar_surplus_switch: 'Solar surplus',
      solar_surplus_heat_boost: 'Heat on solar surplus',
      dump_load_on_negative_feed_in: 'Self-consume on negative feed-in',
      ev_charge_cheapest_block: 'Charge EV cheapest',
      battery_charge_cheap_hold_peak: 'Battery charge cheap',
    };
    return friendly.includes(stems[s.key] || s.title);
  }

  private _openModal(s: EnergyScenario): void {
    this._error = '';
    this._modal = s;
    this._target = '';
    const p: Record<string, number> = {};
    for (const param of s.params) p[param.key] = param.default;
    this._params = p;
  }

  private _closeModal(): void { this._modal = null; }

  private async _create(): Promise<void> {
    const s = this._modal;
    if (!s || !this._target || this._busy) return;
    if (!this.hass.user?.is_admin) { this._error = 'Administrator required.'; return; }
    this._busy = true;
    this._error = '';
    try {
      const config = s.build({
        target: this._target,
        p: this._params,
        px: this._priceEntities,
        net: this._netEntity(),
        deviceName: this.deviceName || 'the device',
      });
      const id = `shs_${this.deviceId.slice(0, 6)}_${s.key}_${Date.now()}`;
      await this.hass.callApi('POST', `config/automation/config/${id}`, config);
      window.setTimeout(() => this._loadRelated(), 1200);
      this._closeModal();
    } catch (err: any) {
      console.error('energy-automations: create failed', err);
      this._error = `Could not create it. ${err?.message || ''}`;
    }
    this._busy = false;
  }

  private _renderCard(s: EnergyScenario) {
    const createdId = this._createdId(s);
    const isAdmin = !!this.hass.user?.is_admin;
    return html`
      <div class="card">
        <div class="card-head">
          <div class="card-icon" style="background: ${s.color}1f; color: ${s.color};"><ha-icon icon=${s.icon}></ha-icon></div>
          <div>
            <div class="card-title">${s.title}</div>
            <div class="card-desc">${s.desc}</div>
            ${s.requires.includes('solar') ? html`<span class="tag solar">Needs solar</span>` : nothing}
          </div>
        </div>
        <div class="card-foot">
          ${createdId ? html`
            <span class="created"><ha-icon icon="mdi:check-circle" style="--mdc-icon-size:15px;"></ha-icon> Created · <a href="/config/automation/edit/${createdId}">Edit</a></span>
          ` : html`
            <button class="create-btn" ?disabled=${!isAdmin} @click=${() => this._openModal(s)}><ha-icon icon="mdi:plus"></ha-icon> Set up</button>
          `}
        </div>
      </div>`;
  }

  private _renderModal() {
    const s = this._modal;
    if (!s) return nothing;
    const opts = this._targetOptions(s.targetDomains);
    return html`
      <div class="modal-backdrop" @click=${this._closeModal}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-head">
            <div class="card-icon" style="background: ${s.color}1f; color: ${s.color};"><ha-icon icon=${s.icon}></ha-icon></div>
            <div>
              <div class="modal-title">${s.title}</div>
              <div class="modal-sub">${this.deviceName}</div>
            </div>
            <button class="modal-x" @click=${this._closeModal}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">${s.desc}</p>
            ${s.note ? html`<div class="note"><ha-icon icon="mdi:information-outline" style="--mdc-icon-size:14px;"></ha-icon> ${s.note}</div>` : nothing}

            <div class="field">
              <label class="f">${s.targetLabel}</label>
              <select @change=${(e: Event) => { this._target = (e.target as HTMLSelectElement).value; }}>
                ${opts.map(o => html`<option value=${o.value} ?selected=${o.value === this._target}>${o.label}</option>`)}
              </select>
            </div>

            ${s.params.map(param => html`
              <div class="field">
                <label class="f">${param.label}</label>
                <div class="row">
                  <input type="number" .value=${String(this._params[param.key] ?? param.default)}
                    min=${param.min ?? nothing} max=${param.max ?? nothing} step=${param.step ?? nothing}
                    @input=${(e: Event) => { this._params = { ...this._params, [param.key]: parseFloat((e.target as HTMLInputElement).value) }; }} />
                  ${param.unit ? html`<span class="unit">${param.unit}</span>` : nothing}
                </div>
                ${param.help ? html`<div class="help">${param.help}</div>` : nothing}
              </div>
            `)}

            ${this._error ? html`<div class="warn">${this._error}</div>` : nothing}
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click=${this._closeModal}>Cancel</button>
            <button class="create-btn" ?disabled=${!this._target || this._busy} @click=${this._create}>
              <ha-icon icon="mdi:plus"></ha-icon> ${this._busy ? 'Creating…' : 'Create automation'}
            </button>
          </div>
        </div>
      </div>`;
  }

  protected render() {
    if (!this._loaded) return nothing;
    if (!this._contractActive) return nothing; // group only makes sense with a dynamic contract

    const scenarios = SCENARIOS.filter(s => this._available(s));
    if (scenarios.length === 0) return nothing;

    return html`
      <div class="head">
        <div class="head-title">Smart energy · dynamic contract</div>
        <div class="head-sub">
          Let Home Assistant steer a device to save money: run it in the cheapest hours, on your solar
          surplus, or pause it at price peaks. Each becomes a normal HA automation with a safety max-runtime
          and a “contract connected” guard baked in — edit it later like any automation.
        </div>
      </div>
      <div class="cards">${scenarios.map(s => this._renderCard(s))}</div>
      ${this._renderModal()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-energy-automations': EnergyAutomations;
  }
}
