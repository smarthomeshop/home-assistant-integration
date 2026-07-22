import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, DeviceEntity } from '../types';

// Control-action scenarios for p1/waterp1 with a connected dynamic contract
// (solar-surplus scenarios also work with only solar). These turn Home
// Assistant into an active steerer: run loads in the cheapest hours, on solar
// surplus, or pause them at price peaks - as normal, editable HA automations.
//
// Safety is baked into every generated automation:
//  - the OFF/stop path is NEVER gated by the contract or by price availability,
//    so a load can always be turned off (only the ON/start path is gated);
//  - a Home Assistant "start" trigger re-asserts the correct state on restart,
//    so a window-end missed while HA was down can't leave a load stuck on;
//  - switch loads get a max-runtime watchdog that force-offs them;
//  - number targets stop at their own minimum value (not a hardcoded 0);
//  - solar surplus uses hysteresis + dwell so devices don't flap.

type Domain = 'switch' | 'input_boolean' | 'climate' | 'number' | 'water_heater';
type Requires = 'contract' | 'solar' | 'contract_solar';

interface EParam {
  key: string;
  label: string;
  default: number;
  domains?: Domain[];
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
  net?: string | null;
  min: number;
  deviceName: string;
  sources?: Record<string, any>;
}

// True PV surplus (W) available to divert to a new load: -net - battery_signed.
// Without the grid meter the battery masks surplus while it charges; adding the
// signed battery power (HA convention + discharge / - charge) uncovers it.
// battery_scale converts a kW sensor to W; the value is set by the caller.
function surplusExpr(net: string, sources?: Record<string, any>): string {
  const netExpr = `(states('${net}')|float(0)) * -1`;
  const bp = sources?.battery_power;
  if (!bp) return netExpr;
  const bsign = sources?.battery_invert ? -1 : 1;
  const scale = sources?.battery_scale || 1;
  return `${netExpr} - ${bsign * scale} * (states('${bp}')|float(0))`;
}

// Surplus on/off triggers. With a battery mapped, a template on the true-surplus
// expression, guarded so a missing sensor can never fabricate surplus and so we
// never start a load while actually importing (charge-prioritising inverters):
//   ON  = both sensors valid AND surplus >= need AND not importing
//   OFF = a sensor is missing OR surplus gone OR we are importing (self-correct)
// Without a battery it stays the plain grid-export numeric triggers.
function surplusTriggers(net: string, sources: Record<string, any> | undefined, needW: number, onDelay: number, offDelay: number) {
  const bp = sources?.battery_power;
  if (bp) {
    const expr = surplusExpr(net, sources);
    const netV = `states('${net}')|float(0)`;
    const avail = `has_value('${net}') and has_value('${bp}')`;
    return [
      { platform: 'template', value_template: `{{ ${avail} and (${expr}) >= ${needW} and (${netV}) <= 50 }}`, for: { minutes: onDelay }, id: 'on' },
      { platform: 'template', value_template: `{{ not has_value('${net}') or (${expr}) < -50 or (${netV}) > 100 }}`, for: { minutes: offDelay }, id: 'off' },
    ];
  }
  return [
    { platform: 'numeric_state', entity_id: net, below: -needW, for: { minutes: onDelay }, id: 'on' },
    { platform: 'numeric_state', entity_id: net, above: 50, for: { minutes: offDelay }, id: 'off' },
  ];
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
  aliasStem: string;
  params: EParam[];
  note?: string;
  build: (a: BuildArgs) => Record<string, unknown>;
}

const DESCRIPTION = 'Created with the SmartHomeShop.io panel · smart energy';
const BOOT = { platform: 'homeassistant', event: 'start', id: 'boot' };

const dom = (entityId: string): string => entityId.split('.')[0];
const isSwitch = (target: string) => dom(target) === 'switch' || dom(target) === 'input_boolean';
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
const setNumberTemplate = (target: string, value: string) => ({
  service: 'number.set_value', target: { entity_id: target }, data: { value },
});
const templateCond = (value_template: string) => ({ condition: 'template', value_template });
const contractCond = (px: Record<string, string | null>) => ({
  condition: 'state', entity_id: px.contract_active, state: 'on',
});

// On/off actions for a target that is either a switch or a control number.
// onValue = the number value to drive when starting; number targets stop at
// their own minimum (min) rather than a hardcoded 0 (which many reject).
function acts(target: string, onValue: number, min: number) {
  if (isSwitch(target)) return { startAct: turn(target, true), stopAct: turn(target, false), switchTarget: true };
  return { startAct: setVal(target, onValue), stopAct: setVal(target, min), switchTarget: false };
}

// Steer a target while a binary "flag" entity is on. The ON branch is gated by
// the contract; the OFF branch (default) and the watchdog never are. A boot
// trigger re-asserts the right state after a restart.
function steerOnFlag(o: {
  alias: string; flag: string | null; target: string;
  startAct: unknown; stopAct: unknown; contract: unknown; watchdogHours?: number;
}) {
  const trigger: Record<string, unknown>[] = [
    { platform: 'state', entity_id: o.flag, to: 'on', id: 'edge' },
    { platform: 'state', entity_id: o.flag, to: ['off', 'unavailable'], id: 'edge' },
    BOOT,
  ];
  if (o.watchdogHours) trigger.push({ platform: 'state', entity_id: o.target, to: 'on', for: { hours: o.watchdogHours }, id: 'watchdog' });
  return {
    alias: o.alias, description: DESCRIPTION, mode: 'restart',
    trigger, condition: [],
    action: [{ choose: [
      { conditions: [{ condition: 'trigger', id: 'watchdog' }], sequence: [o.stopAct] },
      { conditions: [{ condition: 'state', entity_id: o.flag, state: 'on' }, o.contract], sequence: [o.startAct] },
    ], default: [o.stopAct] }],
  };
}

// Prefer a writable inverter output-limit number over hard on/off control. The
// controller nudges the limit down while exporting and back up while importing.
// This keeps local self-consumption available and avoids frequent relay cycles.
function buildNumberCurtailment(o: {
  alias: string;
  target: string;
  net: string;
  p: Record<string, number>;
  activeTemplate?: string;
  extraTriggers?: Record<string, unknown>[];
}) {
  const active = o.activeTemplate || 'true';
  const p = o.p;
  return {
    alias: o.alias, description: DESCRIPTION, mode: 'single', max_exceeded: 'silent',
    trigger: [
      { platform: 'time_pattern', seconds: '/30', id: 'regulate' },
      ...(o.extraTriggers || []),
      BOOT,
    ],
    condition: [],
    variables: {
      shs_grid_power: `{{ states('${o.net}') | float(0) }}`,
      shs_current_limit: `{{ states('${o.target}') | float(${p.normal_limit}) }}`,
    },
    action: [{ choose: [
      {
        conditions: [templateCond(`{{ has_value('${o.target}') and (not (${active}) or not has_value('${o.net}')) and (shs_current_limit | float) != ${p.normal_limit} }}`)],
        sequence: [setNumberTemplate(o.target, `{{ ${p.normal_limit} }}`)],
      },
      {
        conditions: [templateCond(`{{ has_value('${o.net}') and has_value('${o.target}') and (${active}) and shs_grid_power < -${p.export_threshold} and (shs_current_limit | float) > ${p.minimum_limit} }}`)],
        sequence: [setNumberTemplate(o.target, `{{ [${p.minimum_limit}, shs_current_limit - ${p.step_size}] | max }}`)],
      },
      {
        conditions: [templateCond(`{{ has_value('${o.net}') and has_value('${o.target}') and (${active}) and shs_grid_power > ${p.import_threshold} and shs_current_limit < ${p.normal_limit} }}`)],
        sequence: [setNumberTemplate(o.target, `{{ [${p.normal_limit}, shs_current_limit + ${p.step_size}] | min }}`)],
      },
    ] }],
  };
}

// Last-resort controller for inverters that only expose an enable switch. Once
// switched off, the grid meter can no longer tell how much PV is available. A
// short periodic probe is therefore essential: turn on, measure, and turn off
// again only when export persists. Missing telemetry fails safe to ON.
function buildSwitchExportGuard(o: {
  alias: string;
  target: string;
  net: string;
  p: Record<string, number>;
  activeTemplate?: string;
  restoreTemplate?: string;
  extraTriggers?: Record<string, unknown>[];
}) {
  const active = o.activeTemplate || 'true';
  const restore = o.restoreTemplate || 'false';
  const exporting = `(${active}) and has_value('${o.net}') and (states('${o.net}') | float(0)) < -${o.p.export_threshold}`;
  const importing = `(${active}) and has_value('${o.net}') and (states('${o.net}') | float(0)) > ${o.p.import_threshold}`;
  const retryDue = `is_state('${o.target}', 'off') and (as_timestamp(now()) - as_timestamp(states['${o.target}'].last_changed)) >= ${o.p.retry_minutes * 60}`;
  const evaluate = {
    choose: [
      {
        conditions: [templateCond(`{{ ${restore} and not is_state('${o.target}', 'on') }}`)],
        sequence: [turn(o.target, true)],
      },
      {
        conditions: [templateCond(`{{ not has_value('${o.net}') and not is_state('${o.target}', 'on') }}`)],
        sequence: [turn(o.target, true)],
      },
      {
        conditions: [templateCond(`{{ not is_state('${o.target}', 'on') and ${importing} }}`)],
        sequence: [turn(o.target, true)],
      },
      {
        conditions: [templateCond(`{{ is_state('${o.target}', 'on') and ${exporting} }}`)],
        sequence: [
          { delay: { minutes: o.p.export_delay } },
          { choose: [{ conditions: [templateCond(`{{ ${exporting} }}`)], sequence: [turn(o.target, false)] }] },
        ],
      },
      {
        conditions: [templateCond(`{{ (${active}) and ${retryDue} }}`)],
        sequence: [
          turn(o.target, true),
          { delay: { seconds: o.p.probe_seconds } },
          { choose: [{ conditions: [templateCond(`{{ ${exporting} }}`)], sequence: [turn(o.target, false)] }] },
        ],
      },
    ],
  };
  return {
    alias: o.alias, description: DESCRIPTION, mode: 'single', max_exceeded: 'silent',
    trigger: [
      { platform: 'numeric_state', entity_id: o.net, below: -o.p.export_threshold, for: { minutes: o.p.export_delay }, id: 'export' },
      { platform: 'numeric_state', entity_id: o.net, above: o.p.import_threshold, id: 'import' },
      { platform: 'state', entity_id: o.target, to: 'on', id: 'target_on' },
      { platform: 'time_pattern', minutes: '/1', id: 'evaluate' },
      { platform: 'template', value_template: `{{ not has_value('${o.net}') }}`, for: { minutes: o.p.sensor_timeout }, id: 'sensor_failure' },
      ...(o.extraTriggers || []),
      BOOT,
    ],
    condition: [],
    action: [{ choose: [
      {
        conditions: [{ condition: 'trigger', id: 'export' }, templateCond(`{{ ${active} }}`)],
        sequence: [turn(o.target, false)],
      },
      {
        conditions: [{ condition: 'trigger', id: 'sensor_failure' }],
        sequence: [{ choose: [{ conditions: [templateCond(`{{ not is_state('${o.target}', 'on') }}`)], sequence: [turn(o.target, true)] }] }],
      },
      {
        conditions: [{ condition: 'trigger', id: 'import' }, templateCond(`{{ (${active}) and not is_state('${o.target}', 'on') }}`)],
        sequence: [turn(o.target, true)],
      },
      {
        conditions: [{ condition: 'trigger', id: ['target_on', 'evaluate', 'boot', 'source_changed'] }],
        sequence: [evaluate],
      },
    ] }],
  };
}

const SCENARIOS: EnergyScenario[] = [
  {
    key: 'run_cheapest_block',
    title: 'Run in the cheapest hours',
    desc: 'Switch a deferrable load (boiler, pump, ventilation) on during the cheapest contiguous block of the day and off when it ends.',
    icon: 'mdi:clock-star-four-points-outline', color: '#22c55e',
    requires: 'contract', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Device to run',
    aliasStem: 'Run in cheapest',
    params: [{ key: 'hours', label: 'Block length', default: 3, min: 1, max: 6, step: 1, unit: 'h' }],
    build: ({ target, p, px, min, deviceName }) => {
      const N = p.hours;
      const a = acts(target, 0, min);
      return steerOnFlag({
        alias: `${deviceName} - Run in cheapest ${N}h`, flag: px[`cheapest_${N}h_window_now`] ?? null,
        target, startAct: a.startAct, stopAct: a.stopAct, contract: contractCond(px), watchdogHours: N + 1,
      });
    },
  },
  {
    key: 'run_while_cheap_now',
    title: 'Run while electricity is cheap',
    desc: 'Run an opportunistic load whenever the price is at or below the daily average, and stop it when it rises above.',
    icon: 'mdi:cash-clock', color: '#16a34a',
    requires: 'contract', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Device to run',
    aliasStem: 'Run while cheap',
    params: [{ key: 'max_runtime', label: 'Safety max runtime', default: 6, min: 1, max: 24, step: 1, unit: 'h', help: 'Forces the load off after this long, even if something goes wrong.' }],
    note: '"Cheap" here means below the daily average price, not the single cheapest window. Use "Run in the cheapest hours" for that.',
    build: ({ target, p, px, min, deviceName }) => {
      const a = acts(target, 0, min);
      return steerOnFlag({
        alias: `${deviceName} - Run while cheap`, flag: px.cheap_now ?? null,
        target, startAct: a.startAct, stopAct: a.stopAct, contract: contractCond(px), watchdogHours: p.max_runtime,
      });
    },
  },
  {
    key: 'pause_on_price_peak',
    title: 'Pause during price peaks',
    desc: 'Switch a load off when the price level hits its daily peak and back on when it drops. Trims the most expensive hours.',
    icon: 'mdi:transmission-tower-off', color: '#e11d48',
    requires: 'contract', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Device to pause',
    aliasStem: 'Pause on price peak',
    params: [],
    note: 'This automation fully controls the chosen device: it forces it off at price peaks and back on afterwards.',
    build: ({ target, px, deviceName }) => ({
      alias: `${deviceName} - Pause on price peak`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        { platform: 'state', entity_id: px.price_level, to: 'peak', id: 'pause' },
        { platform: 'state', entity_id: px.price_level, to: ['very_low', 'low', 'medium', 'high'], id: 'resume' },
      ],
      condition: [],
      action: [{ choose: [
        { conditions: [{ condition: 'trigger', id: 'pause' }, contractCond(px)], sequence: [turn(target, false)] },
        { conditions: [{ condition: 'trigger', id: 'resume' }], sequence: [turn(target, true)] },
      ] }],
    }),
  },
  {
    key: 'precharge_climate_before_peak',
    title: 'Pre-heat cheap, ease off at peak',
    desc: 'Raise a thermostat setpoint during the cheapest block to store comfort, then lower it during the price peak. Uses the home as thermal storage.',
    icon: 'mdi:home-thermometer', color: '#f59e0b',
    requires: 'contract', targetDomains: ['climate'], targetLabel: 'Thermostat',
    aliasStem: 'Pre-heat cheap',
    params: [
      { key: 'hours', label: 'Cheap block', default: 2, min: 1, max: 6, step: 1, unit: 'h' },
      { key: 'comfort', label: 'Comfort temp', default: 21, min: 5, max: 30, step: 0.5, unit: '°C' },
      { key: 'eco', label: 'Eco temp (peak)', default: 18, min: 5, max: 30, step: 0.5, unit: '°C' },
    ],
    build: ({ target, p, px, deviceName }) => ({
      alias: `${deviceName} - Pre-heat cheap, ease at peak`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        { platform: 'state', entity_id: px[`cheapest_${p.hours}h_window_now`] ?? null, to: 'on', id: 'cheap' },
        { platform: 'state', entity_id: px.price_level, to: 'peak', id: 'peak' },
      ],
      condition: [],
      action: [{ choose: [
        { conditions: [{ condition: 'trigger', id: 'cheap' }, contractCond(px)], sequence: [setVal(target, p.comfort)] },
        { conditions: [{ condition: 'trigger', id: 'peak' }], sequence: [setVal(target, p.eco)] },
      ] }],
    }),
  },
  {
    key: 'solar_surplus_switch',
    title: 'Use solar surplus for a device',
    desc: 'Switch a load on when the house exports more than it needs, and off when you would start importing - with hysteresis + dwell so it does not flap.',
    icon: 'mdi:solar-power-variant', color: '#eab308',
    requires: 'solar', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Device to run on surplus',
    aliasStem: 'Solar surplus',
    params: [
      { key: 'device_power', label: 'Device power', default: 1400, min: 100, max: 11000, step: 50, unit: 'W', help: 'On when export exceeds this. Its own draw creates the off-hysteresis.' },
      { key: 'on_delay', label: 'On after', default: 5, min: 1, max: 30, step: 1, unit: 'min' },
      { key: 'off_delay', label: 'Off after', default: 3, min: 1, max: 30, step: 1, unit: 'min' },
      { key: 'max_runtime', label: 'Safety max runtime', default: 6, min: 1, max: 24, step: 1, unit: 'h' },
    ],
    build: ({ target, p, net, deviceName, sources }) => ({
      alias: `${deviceName} - Solar surplus`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        ...surplusTriggers(net ?? '', sources, p.device_power, p.on_delay, p.off_delay),
        { platform: 'state', entity_id: target, to: 'on', for: { hours: p.max_runtime }, id: 'watchdog' },
        BOOT,
      ],
      condition: [],
      action: [{ choose: [
        { conditions: [{ condition: 'trigger', id: 'on' }], sequence: [turn(target, true)] },
        // off / watchdog / restart -> switch off; surplus re-engages on the next rise.
        { conditions: [{ condition: 'trigger', id: ['off', 'watchdog', 'boot'] }], sequence: [turn(target, false)] },
      ] }],
    }),
  },
  {
    key: 'solar_surplus_heat_boost',
    title: 'Heat on solar surplus',
    desc: 'On real solar surplus, raise a water-heater/heat-pump setpoint (or a charge-current number) to self-consume instead of exporting; revert when surplus fades.',
    icon: 'mdi:water-boiler', color: '#f97316',
    requires: 'solar', targetDomains: ['climate', 'water_heater', 'number'], targetLabel: 'Device to boost',
    aliasStem: 'Heat on solar surplus',
    params: [
      { key: 'device_power', label: 'Surplus needed', default: 1500, min: 100, max: 11000, step: 50, unit: 'W' },
      { key: 'boost', label: 'Boost value', default: 55, min: 0, max: 80, step: 1, unit: '°C / value' },
      { key: 'normal', label: 'Normal value', default: 45, min: 0, max: 80, step: 1, unit: '°C / value' },
      { key: 'on_delay', label: 'On after', default: 5, min: 1, max: 30, step: 1, unit: 'min' },
      { key: 'off_delay', label: 'Off after', default: 5, min: 1, max: 30, step: 1, unit: 'min' },
    ],
    build: ({ target, p, net, deviceName, sources }) => {
      const [on, off] = surplusTriggers(net ?? '', sources, p.device_power, p.on_delay, p.off_delay);
      return {
        alias: `${deviceName} - Heat on solar surplus`, description: DESCRIPTION, mode: 'restart',
        trigger: [{ ...on, id: 'boost' }, { ...off, id: 'normal' }, BOOT],
        condition: [],
        action: [{ choose: [
          { conditions: [{ condition: 'trigger', id: 'boost' }], sequence: [setVal(target, p.boost)] },
          // normal / restart -> revert to the normal setpoint.
          { conditions: [{ condition: 'trigger', id: ['normal', 'boot'] }], sequence: [setVal(target, p.normal)] },
        ] }],
      };
    },
  },
  {
    key: 'keep_solar_export_near_zero',
    title: 'Keep solar export near zero',
    desc: 'Reduce inverter output while exporting and restore it when the home needs power. A writable limit is adjusted gradually; an enable switch uses safe periodic test starts.',
    icon: 'mdi:solar-power-variant-outline', color: '#0d9488',
    requires: 'solar', targetDomains: ['number', 'switch', 'input_boolean'], targetLabel: 'Writable inverter limit or safe enable control',
    aliasStem: 'Keep solar export near zero',
    params: [
      { key: 'export_threshold', label: 'Allowed export', default: 100, min: 0, max: 5000, step: 25, unit: 'W', help: 'Control starts only when export exceeds this margin.' },
      { key: 'import_threshold', label: 'Restore above import', default: 150, min: 25, max: 5000, step: 25, unit: 'W', help: 'Raise the limit, or immediately restart a paused inverter, when grid import exceeds this value.' },
      { key: 'normal_limit', label: 'Normal output limit', default: 100, min: 1, max: 100000, step: 1, unit: 'target value', domains: ['number'], help: 'Usually 100 for a percentage entity, or the inverter maximum for a watt-based entity.' },
      { key: 'minimum_limit', label: 'Minimum output limit', default: 5, min: 0, max: 100000, step: 1, unit: 'target value', domains: ['number'], help: 'Use the lowest value accepted by the inverter. A small non-zero limit is safer for many models.' },
      { key: 'step_size', label: 'Adjustment per 30 seconds', default: 5, min: 0.1, max: 10000, step: 0.1, unit: 'target value', domains: ['number'], help: 'Smaller steps react more smoothly and reduce oscillation.' },
      { key: 'export_delay', label: 'Switch off after', default: 2, min: 1, max: 30, step: 1, unit: 'min', domains: ['switch', 'input_boolean'], help: 'Export must persist this long before an inverter enable switch is turned off.' },
      { key: 'retry_minutes', label: 'Test start every', default: 15, min: 2, max: 120, step: 1, unit: 'min', domains: ['switch', 'input_boolean'], help: 'The inverter is briefly restarted because an off inverter cannot show whether solar production is useful again.' },
      { key: 'probe_seconds', label: 'Test duration', default: 45, min: 15, max: 300, step: 5, unit: 'sec', domains: ['switch', 'input_boolean'], help: 'Time allowed for the inverter and grid meter to settle during a test start.' },
      { key: 'sensor_timeout', label: 'Grid sensor fail-safe', default: 2, min: 1, max: 30, step: 1, unit: 'min', domains: ['switch', 'input_boolean'], help: 'If grid telemetry is missing this long, the inverter is restored instead of being left off.' },
    ],
    note: 'Preferred: select a writable inverter active-power/output-limit number. Only use the switch fallback with the inverter manufacturer\'s safe enable control or a dedicated helper that calls that control. Never switch the inverter\'s AC supply with a smart plug, relay or contactor. The fallback can briefly export during every test start.',
    build: ({ target, p, net, min, deviceName }) => {
      const safeParams = { ...p, minimum_limit: Math.max(p.minimum_limit, min) };
      if (dom(target) === 'number') {
        return buildNumberCurtailment({
          alias: `${deviceName} - Keep solar export near zero`, target, net: net ?? '', p: safeParams,
        });
      }
      return buildSwitchExportGuard({
        alias: `${deviceName} - Keep solar export near zero`, target, net: net ?? '', p: safeParams,
      });
    },
  },
  {
    key: 'avoid_negative_price_solar_export',
    title: 'Avoid negative-price solar export',
    desc: 'Curtail or pause solar only while the live feed-in price is below your limit and the home is exporting. Full production is restored automatically when the price recovers.',
    icon: 'mdi:solar-power-variant-outline', color: '#dc2626',
    requires: 'contract_solar', targetDomains: ['number', 'switch', 'input_boolean'], targetLabel: 'Writable inverter limit or safe enable control',
    aliasStem: 'Avoid negative-price solar export',
    params: [
      { key: 'feed_in_threshold', label: 'Curtail below feed-in price', default: 0, min: -5, max: 5, step: 0.001, unit: 'EUR/kWh', help: 'Production is unrestricted again as soon as the feed-in price reaches this value.' },
      { key: 'export_threshold', label: 'Allowed export', default: 100, min: 0, max: 5000, step: 25, unit: 'W', help: 'No curtailment while the home uses the solar power itself.' },
      { key: 'import_threshold', label: 'Restore above import', default: 150, min: 25, max: 5000, step: 25, unit: 'W', help: 'Raise the limit, or immediately restart a paused inverter, when grid import exceeds this value.' },
      { key: 'normal_limit', label: 'Normal output limit', default: 100, min: 1, max: 100000, step: 1, unit: 'target value', domains: ['number'] },
      { key: 'minimum_limit', label: 'Minimum output limit', default: 5, min: 0, max: 100000, step: 1, unit: 'target value', domains: ['number'] },
      { key: 'step_size', label: 'Adjustment per 30 seconds', default: 5, min: 0.1, max: 10000, step: 0.1, unit: 'target value', domains: ['number'] },
      { key: 'export_delay', label: 'Switch off after', default: 2, min: 1, max: 30, step: 1, unit: 'min', domains: ['switch', 'input_boolean'] },
      { key: 'retry_minutes', label: 'Test start every', default: 15, min: 2, max: 120, step: 1, unit: 'min', domains: ['switch', 'input_boolean'] },
      { key: 'probe_seconds', label: 'Test duration', default: 45, min: 15, max: 300, step: 5, unit: 'sec', domains: ['switch', 'input_boolean'] },
      { key: 'sensor_timeout', label: 'Grid sensor fail-safe', default: 2, min: 1, max: 30, step: 1, unit: 'min', domains: ['switch', 'input_boolean'] },
    ],
    note: 'The controller only limits exported energy: solar used by the home remains available. A switch-only inverter is periodically test-started while prices remain negative, and is immediately restored on sufficient grid import, price recovery, contract disconnect or missing grid telemetry. Only use a manufacturer-provided safe enable control; never interrupt the inverter AC supply with a smart plug, relay or contactor.',
    build: ({ target, p, px, net, min, deviceName }) => {
      const feed = px.feed_in_price ?? '';
      const contract = px.contract_active ?? '';
      const active = `is_state('${contract}', 'on') and has_value('${feed}') and (states('${feed}') | float(0)) < ${p.feed_in_threshold}`;
      const restore = `not is_state('${contract}', 'on') or not has_value('${feed}') or (states('${feed}') | float(0)) >= ${p.feed_in_threshold}`;
      const extraTriggers = [
        { platform: 'state', entity_id: px.feed_in_price, id: 'source_changed' },
        { platform: 'state', entity_id: px.contract_active, id: 'source_changed' },
      ];
      const safeParams = { ...p, minimum_limit: Math.max(p.minimum_limit, min) };
      if (dom(target) === 'number') {
        return buildNumberCurtailment({
          alias: `${deviceName} - Avoid negative-price solar export`, target, net: net ?? '', p: safeParams,
          activeTemplate: active, extraTriggers,
        });
      }
      return buildSwitchExportGuard({
        alias: `${deviceName} - Avoid negative-price solar export`, target, net: net ?? '', p: safeParams,
        activeTemplate: active, restoreTemplate: restore, extraTriggers,
      });
    },
  },
  {
    key: 'dump_load_on_negative_feed_in',
    title: 'Self-consume on negative feed-in',
    desc: 'When the feed-in price goes negative (you would pay to export), switch on a diversion load to self-consume instead. Off again when feed-in is positive.',
    icon: 'mdi:transmission-tower-import', color: '#8b5cf6',
    requires: 'contract', targetDomains: ['switch', 'input_boolean'], targetLabel: 'Diversion load',
    aliasStem: 'Self-consume on negative feed-in',
    params: [],
    build: ({ target, px, deviceName }) => ({
      alias: `${deviceName} - Self-consume on negative feed-in`, description: DESCRIPTION, mode: 'restart',
      trigger: [
        { platform: 'numeric_state', entity_id: px.feed_in_price, below: 0, id: 'on' },
        { platform: 'numeric_state', entity_id: px.feed_in_price, above: 0, id: 'off' },
        BOOT,
      ],
      condition: [],
      action: [{ choose: [
        { conditions: [{ condition: 'numeric_state', entity_id: px.feed_in_price, below: 0 }, contractCond(px)], sequence: [turn(target, true)] },
      ], default: [turn(target, false)] }],
    }),
  },
  {
    key: 'ev_charge_cheapest_block',
    title: 'Charge the car in the cheapest hours',
    desc: 'Start EV charging at the beginning of the cheapest block and stop at the end.',
    icon: 'mdi:car-electric', color: '#0ea5e9',
    requires: 'contract', targetDomains: ['switch', 'number'], targetLabel: 'Charger switch or charge-current',
    aliasStem: 'Charge EV cheapest',
    params: [
      { key: 'hours', label: 'Charge window', default: 4, min: 1, max: 6, step: 1, unit: 'h' },
      { key: 'current', label: 'Charge current (for a number target)', default: 16, min: 6, max: 32, step: 1, unit: 'A' },
    ],
    note: 'This charges during the cheapest block without a ready-by guarantee. For "car ready by 07:00", use a deadline schedule below.',
    build: ({ target, p, px, min, deviceName }) => {
      const N = p.hours;
      const a = acts(target, p.current, min);
      return steerOnFlag({
        alias: `${deviceName} - Charge EV cheapest ${N}h`, flag: px[`cheapest_${N}h_window_now`] ?? null,
        target, startAct: a.startAct, stopAct: a.stopAct, contract: contractCond(px),
        watchdogHours: a.switchTarget ? N + 1 : undefined,
      });
    },
  },
  // Home-battery charging deliberately does not live here: the Energy tab's
  // battery control (Settings) generates one automation that owns the battery,
  // including SoC limits and solar-aware charging.
];

@customElement('shs-energy-automations')
export class EnergyAutomations extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public deviceId = '';
  @property() public deviceName = '';
  @property({ attribute: false }) public deviceEntities: DeviceEntity[] = [];
  @property({ attribute: false }) public scenarioKeys?: string[];
  @property({ type: Boolean }) public showHeader = true;

  @state() private _priceEntities: Record<string, string | null> = {};
  @state() private _contractActive = false;
  @state() private _sources: Record<string, any> = {};
  @state() private _loaded = false;
  @state() private _created: Record<string, string> = {};
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
    .card.unavailable { background: var(--secondary-background-color); }
    .card.unavailable .card-head { opacity: .72; }
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
    if (!this.hass) return;
    try {
      const px = await this.hass.callWS<{ entities: Record<string, string | null> }>({ type: 'smarthomeshop/prices/entities' });
      this._priceEntities = px.entities || {};
      const cfg = await this.hass.callWS<{ contract_active?: boolean }>({ type: 'smarthomeshop/device/config', device_id: this.deviceId });
      this._contractActive = !!cfg.contract_active;
      const s = await this.hass.callWS<{ sources: Record<string, any> }>({ type: 'smarthomeshop/energy_sources' });
      this._sources = s.sources || {};
    } catch (err) { console.error('energy-automations: load failed', err); }
    this._loaded = true;
  }

  private _netEntity(): string | undefined {
    // Signed net grid power only (+import/-export). A raw export/production
    // sensor is not a valid substitute for the surplus triggers.
    return this.deviceEntities.find(e => e.entity_id.includes('net_grid_power'))?.entity_id;
  }

  // Fetch the latest solar/battery mapping and resolve the battery power unit
  // to a kW->W scale, so a freshly-edited mapping is always used.
  private async _freshSources(): Promise<Record<string, any>> {
    let sources = this._sources;
    try {
      const s = await this.hass.callWS<{ sources: Record<string, any> }>({ type: 'smarthomeshop/energy_sources' });
      sources = s.sources || {};
      this._sources = sources;
    } catch { /* keep last */ }
    if (sources.battery_power) {
      const unit = String(this.hass.states[sources.battery_power]?.attributes?.unit_of_measurement || '');
      sources = { ...sources, battery_scale: /kw/i.test(unit) ? 1000 : 1 };
    }
    return sources;
  }

  private _missingRequirement(s: EnergyScenario): string {
    const hasPrices = this._contractActive;
    const hasGridMeter = !!this._netEntity();
    if (s.requires === 'contract' && !hasPrices) return 'Needs dynamic prices';
    if (s.requires === 'solar' && !hasGridMeter) return 'Needs grid meter';
    if (s.requires === 'contract_solar') {
      if (!hasPrices && !hasGridMeter) return 'Needs prices + grid meter';
      if (!hasPrices) return 'Needs dynamic prices';
      if (!hasGridMeter) return 'Needs grid meter';
    }
    return '';
  }

  private _targetOptions(domains: Domain[]): Array<{ value: string; label: string }> {
    const out = [{ value: '', label: 'Select a device...' }];
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      if (!domains.includes(dom(entityId) as Domain)) continue;
      out.push({ value: entityId, label: (st.attributes?.friendly_name as string) || entityId });
    }
    return [out[0], ...out.slice(1).sort((a, b) => a.label.localeCompare(b.label))];
  }

  private _createdId(s: EnergyScenario): string | undefined {
    if (this._created[s.key]) return this._created[s.key];
    // These automations trigger on the price device, not this device, so
    // search/related can't see them - scan all automations by alias stem.
    const prefix = `${this.deviceName || 'the device'} - `;
    for (const [entityId, st] of Object.entries(this.hass.states || {})) {
      if (!entityId.startsWith('automation.')) continue;
      const name = st.attributes?.friendly_name as string | undefined;
      if (name && name.startsWith(prefix) && name.includes(s.aliasStem)) {
        return (st.attributes?.id as string | undefined) || 'existing';
      }
    }
    return undefined;
  }

  private _openModal(s: EnergyScenario): void {
    if (this._missingRequirement(s)) return;
    this._error = '';
    this._modal = s;
    this._target = '';
    const p: Record<string, number> = {};
    for (const param of s.params) p[param.key] = param.default;
    this._params = p;
  }

  private _closeModal(): void { this._modal = null; }

  private _sanitized(s: EnergyScenario): { params: Record<string, number>; min: number } {
    const params: Record<string, number> = {};
    for (const param of s.params) {
      let v = this._params[param.key];
      if (typeof v !== 'number' || Number.isNaN(v)) v = param.default;
      if (param.min != null && v < param.min) v = param.min;
      if (param.max != null && v > param.max) v = param.max;
      if (param.key === 'hours') v = Math.max(1, Math.min(6, Math.round(v)));
      params[param.key] = v;
    }
    let min = 0;
    const st = this.hass.states[this._target];
    if (st && dom(this._target) === 'number') {
      const entityMin = Number(st.attributes?.min);
      const entityMax = Number(st.attributes?.max);
      const entityStep = Number(st.attributes?.step);
      if (Number.isFinite(entityMin)) min = entityMin;

      const max = Number.isFinite(entityMax) ? entityMax : Number.POSITIVE_INFINITY;
      if ('normal_limit' in params) params.normal_limit = Math.max(min, Math.min(max, params.normal_limit));
      if ('minimum_limit' in params) {
        params.minimum_limit = Math.max(min, Math.min(params.normal_limit ?? max, params.minimum_limit));
      }
      if ('step_size' in params) {
        const smallestStep = Number.isFinite(entityStep) && entityStep > 0 ? entityStep : 0.1;
        const availableRange = Number.isFinite(max) ? Math.max(smallestStep, max - min) : Number.POSITIVE_INFINITY;
        params.step_size = Math.max(smallestStep, Math.min(availableRange, params.step_size));
      }
    }
    return { params, min };
  }

  private async _create(): Promise<void> {
    const s = this._modal;
    if (!s || !this._target || this._busy) return;
    if (!this.hass.user?.is_admin) { this._error = 'Administrator required.'; return; }
    this._busy = true;
    this._error = '';
    try {
      const { params, min } = this._sanitized(s);
      const config = s.build({
        target: this._target, p: params, px: this._priceEntities,
        net: this._netEntity(), min, deviceName: this.deviceName || 'the device',
        sources: await this._freshSources(),
      });
      if (JSON.stringify(config).includes('"entity_id":null')) {
        this._error = 'The energy price sensors are not ready yet. Try again in a moment.';
        this._busy = false;
        return;
      }
      const id = `shs_${this.deviceId.slice(0, 6)}_${s.key}_${Date.now()}`;
      await this.hass.callApi('POST', `config/automation/config/${id}`, config);
      this._created = { ...this._created, [s.key]: id };
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
    const missingRequirement = this._missingRequirement(s);
    return html`
      <div class=${`card${missingRequirement ? ' unavailable' : ''}`}>
        <div class="card-head">
          <div class="card-icon" style="background: ${s.color}1f; color: ${s.color};"><ha-icon icon=${s.icon}></ha-icon></div>
          <div>
            <div class="card-title">${s.title}</div>
            <div class="card-desc">${s.desc}</div>
            ${missingRequirement ? html`<span class="tag solar">${missingRequirement}</span>` : nothing}
          </div>
        </div>
        <div class="card-foot">
          ${createdId ? html`
            <span class="created"><ha-icon icon="mdi:check-circle" style="--mdc-icon-size:15px;"></ha-icon> Created${createdId !== 'existing' ? html` · <a href="/config/automation/edit/${createdId}">Edit</a>` : nothing}</span>
          ` : html`
            <button class="create-btn" ?disabled=${!isAdmin || !!missingRequirement}
              title=${missingRequirement || nothing}
              @click=${() => this._openModal(s)}><ha-icon icon="mdi:plus"></ha-icon> Set up</button>
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

            ${s.params.filter(param => !param.domains || !this._target || param.domains.includes(dom(this._target) as Domain)).map(param => html`
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
              <ha-icon icon="mdi:plus"></ha-icon> ${this._busy ? 'Creating...' : 'Create automation'}
            </button>
          </div>
        </div>
      </div>`;
  }

  protected render() {
    if (!this._loaded) return nothing;

    const scenarios = this.scenarioKeys?.length
      ? SCENARIOS.filter(scenario => this.scenarioKeys!.includes(scenario.key))
      : SCENARIOS;

    return html`
      ${this.showHeader ? html`
        <div class="head">
          <div class="head-title">Smart energy</div>
          <div class="head-sub">
            Steer devices around prices and solar production. Loads can run in cheap or surplus hours,
            while inverter output can be reduced safely to avoid unwanted export. Each setup creates a
            normal, editable Home Assistant automation with restart recovery and fail-safe behaviour.
          </div>
        </div>
      ` : nothing}
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
