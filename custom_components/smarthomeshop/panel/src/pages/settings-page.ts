import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type {
  HomeAssistant,
  SmartHomeShopDevice,
  DeviceEntity,
  Sps30QuietHoursCapability,
} from '../types';
import { settingsText } from '../utils/settings-translations';
import {
  QUIET_HOUR_VALUES,
  SPS30_IDLE_INTERVAL_CHOICES,
  QuietHoursUpdateError,
  formatQuietHour,
  isQuietScheduleAllDay,
  parseQuietHour,
  parseSps30IdleInterval,
  performConfirmedEntityUpdate,
  quietHoursEntityStatus,
  shouldRenderQuietHours,
  sps30IdleIntervalAvailability,
  sps30IdleIntervalPresentation,
} from '../utils/sps30-quiet-hours';

interface SettingGroup {
  key: string;
  titleKey: string;
  icon: string;
  match: RegExp;
}

interface ConfirmationPolicy {
  titleKey: string;
  bodyKey: string;
  actionKey: string;
  danger?: boolean;
}

interface PendingEntityAction {
  entity: DeviceEntity;
  domain: string;
  service: string;
  data?: Record<string, unknown>;
  policy: ConfirmationPolicy;
}

type BackgroundCorrectionPhase = 'leaving' | 'calibrating' | 'complete' | 'untracked';

interface BackgroundCorrectionProgress {
  buttonEntityId: string;
  statusEntityId?: string;
  secondsRemaining: number;
  sawActiveStatus: boolean;
  phase: BackgroundCorrectionPhase;
}

type CalibrationKind = 'temperature' | 'humidity';

interface CalibrationChannel {
  kind: CalibrationKind;
  icon: string;
  offset: DeviceEntity;
  sensor?: DeviceEntity;
  unit: string;
  decimals: number;
}

interface CalibrationReferenceReading {
  entityId: string;
  name: string;
  value: number | null;
  display: string;
  tone: 'ready' | 'warning';
  message: string;
}

const MEDIA_PLAYER_VOLUME_SET = 4;
const MEDIA_PLAYER_PLAY_MEDIA = 512;
const MEDIA_PLAYER_ANNOUNCE = 1048576;
const SPEAKER_TEST_SOUND = 'https://raw.githubusercontent.com/smarthomeshop/ultimatesensor/main/ultimatesensor-v2/audio/boot1.mp3';

// Ordered: first matching group wins
const GROUPS: SettingGroup[] = [
  {
    key: 'radar',
    titleKey: 'group.radar',
    icon: 'mdi:radar',
    match: /radar|presence|target|zone|polygon|entry|people|distance|mount|angle|occupancy|timeout|bluetooth|multi/i,
  },
  {
    key: 'voice',
    titleKey: 'group.voice',
    icon: 'mdi:microphone',
    match: /wake|assist|spraak|wekwoord|voice|speaker|volume|mute|sound|audio/i,
  },
  {
    key: 'air',
    titleKey: 'group.air',
    icon: 'mdi:air-filter',
    match: /sps30|co2|voc|nox|pm|temperature|humidity|offset|calibrat|pressure|ambient/i,
  },
  {
    key: 'other',
    titleKey: 'group.other',
    icon: 'mdi:tune',
    match: /.*/,
  },
];

const COLLAPSE_THRESHOLD = 12;

export class SettingsPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public selectedDeviceId?: string;
  @property({ type: Boolean }) public embedded = false;
  @state() private _devices: SmartHomeShopDevice[] = [];
  @state() private _selectedDevice?: SmartHomeShopDevice;
  @state() private _entities: DeviceEntity[] = [];
  @state() private _loading = true;
  @state() private _filter = '';
  @state() private _expandedGroups: Set<string> = new Set();
  @state() private _configFields: any[] = [];
  @state() private _configValues: Record<string, any> = {};
  @state() private _productType = '';
  @state() private _savingConfig = false;
  @state() private _configSaved = false;
  @state() private _configError = '';
  @state() private _contractActive = false;
  @state() private _contractName: string | null = null;
  @state() private _enablingEntities: Set<string> = new Set();
  @state() private _runningEntity: string | null = null;
  @state() private _entityFeedback: Record<string, { tone: 'success' | 'error'; text: string }> = {};
  @state() private _pendingEntityAction?: PendingEntityAction;
  @state() private _backgroundCorrection?: BackgroundCorrectionProgress;
  @state() private _calibrationDrafts: Record<string, number> = {};
  @state() private _calibrationReferences: Record<string, string> = {};
  @state() private _calibrationReferenceEntities: Record<string, string> = {};
  @state() private _speakerVolumeDraft?: number;
  @state() private _ledBrightnessDraft?: number;
  @state() private _quietHours?: Sps30QuietHoursCapability;
  @state() private _quietHoursPending?: string;
  @state() private _quietHoursError = '';
  private _backgroundCorrectionTimer?: number;

  static styles = css`
    :host { display: block; max-width: 1100px; margin: 0 auto; --shs-primary: #4361ee; }
    .page-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .page-title { font-size: 16px; font-weight: 600; color: var(--primary-text-color); margin: 0; }
    .ha-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--shs-primary); text-decoration: none; }
    .ha-link:hover { text-decoration: underline; }
    .ha-link ha-icon { --mdc-icon-size: 14px; }
    .settings-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; align-items: start; }
    .panel { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 16px; }
    .panel-title { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; }
    .device-list { display: flex; flex-direction: column; gap: 8px; }
    .device-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--divider-color); border-radius: 10px; cursor: pointer; }
    .device-item:hover, .device-item.selected { border-color: var(--shs-primary); }
    .device-item.selected { box-shadow: inset 0 0 0 1px var(--shs-primary); }
    .device-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(67, 97, 238, 0.12); color: #4361ee; flex-shrink: 0; }
    .device-icon ha-icon { --mdc-icon-size: 20px; }
    .device-name { font-size: 14px; font-weight: 500; color: var(--primary-text-color); }
    .device-type { font-size: 12px; color: var(--secondary-text-color); }
    .search-box { width: 100%; box-sizing: border-box; padding: 10px 12px; margin-bottom: 16px; border: 1px solid var(--divider-color); border-radius: 10px; background: var(--card-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .search-box:focus { outline: none; border-color: var(--shs-primary); }
    .settings-group { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; margin-bottom: 16px; }
    .group-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--divider-color); }
    .group-header ha-icon { color: var(--shs-primary); --mdc-icon-size: 18px; }
    .group-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); flex: 1; }
    .group-count { font-size: 12px; color: var(--secondary-text-color); }
    .setting-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 12px 16px; }
    .setting-item + .setting-item { border-top: 1px solid var(--divider-color); }
    .setting-item.registry-disabled { background: color-mix(in srgb, var(--warning-color, #f59e0b) 7%, transparent); }
    .setting-item.unavailable .setting-info, .setting-item.unavailable .setting-control { opacity: 0.52; }
    .setting-info { min-width: 0; flex: 1; }
    .setting-name { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color); }
    .setting-description { margin-top: 3px; max-width: 680px; font-size: 12px; line-height: 1.45; color: var(--secondary-text-color); }
    .setting-entity { font-size: 11px; color: var(--secondary-text-color); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .setting-entity { margin-top: 3px; opacity: .72; }
    .setting-control { flex-shrink: 0; display: flex; align-items: center; gap: 6px; padding-top: 1px; }
    .setting-state { display: flex; align-items: flex-start; gap: 6px; margin-top: 7px; font-size: 11.5px; line-height: 1.4; color: var(--secondary-text-color); }
    .setting-state ha-icon { --mdc-icon-size: 15px; flex: 0 0 auto; margin-top: 1px; }
    .setting-state.disabled { color: var(--warning-color, #d97706); }
    .setting-state.error { color: var(--error-color, #dc2626); }
    .setting-state.success { color: var(--success-color, #169c50); }
    .setting-control select, .setting-control input[type="number"] {
      padding: 6px 10px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-family: inherit;
    }
    .setting-control input[type="number"] { width: 90px; text-align: right; }
    .setting-control select:focus, .setting-control input:focus { outline: none; border-color: var(--shs-primary); }
    .unit { font-size: 12px; color: var(--secondary-text-color); }
    .toggle { position: relative; width: 40px; height: 22px; border-radius: 11px; background: var(--divider-color); border: none; cursor: pointer; transition: background 0.15s ease; padding: 0; }
    .toggle.on { background: var(--shs-primary); }
    .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: transform 0.15s ease; }
    .toggle.on::after { transform: translateX(18px); }
    .toggle:disabled, .press-btn:disabled, .enable-btn:disabled { cursor: not-allowed; opacity: .48; }
    .press-btn, .enable-btn { min-height: 34px; padding: 6px 13px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--shs-primary); font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; }
    .press-btn:hover { border-color: var(--shs-primary); }
    .enable-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--card-background-color); }
    .enable-btn:hover:not(:disabled) { border-color: var(--shs-primary); background: color-mix(in srgb, var(--shs-primary) 7%, var(--card-background-color)); }
    .enable-btn ha-icon { --mdc-icon-size: 16px; }
    .show-all { display: block; width: 100%; padding: 10px; border: none; border-top: 1px solid var(--divider-color); background: none; color: var(--shs-primary); font-size: 13px; font-family: inherit; cursor: pointer; }
    .show-all:hover { background: var(--secondary-background-color); }
    .feature-stack { display: grid; gap: 18px; margin-bottom: 22px; }
    .feature-card { overflow: hidden; border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); background: var(--card-background-color); }
    .feature-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 17px 18px 15px; }
    .feature-heading { display: flex; align-items: flex-start; gap: 11px; min-width: 0; }
    .feature-heading > ha-icon { --mdc-icon-size: 21px; margin-top: 1px; color: var(--shs-primary); }
    .feature-heading.thermometer > ha-icon { color: var(--warning-color, #e87818); }
    .feature-heading.speaker > ha-icon { color: #1686c8; }
    .feature-heading.led > ha-icon { color: #e7a008; }
    .feature-title { margin: 0; font-size: 15px; font-weight: 650; line-height: 1.3; color: var(--primary-text-color); }
    .feature-description { margin: 4px 0 0; max-width: 720px; color: var(--secondary-text-color); font-size: 12.5px; line-height: 1.5; }
    .feature-status { display: flex; align-items: flex-start; gap: 9px; margin: 0 18px 16px; padding: 11px 12px; border: 1px solid color-mix(in srgb, var(--success-color, #169c50) 28%, var(--divider-color)); border-radius: 9px; background: color-mix(in srgb, var(--success-color, #169c50) 8%, transparent); color: var(--success-color, #138747); font-size: 12px; line-height: 1.45; }
    .feature-status.warning { border-color: color-mix(in srgb, var(--warning-color, #d97706) 32%, var(--divider-color)); background: color-mix(in srgb, var(--warning-color, #f59e0b) 8%, transparent); color: color-mix(in srgb, var(--warning-color, #b86100) 86%, var(--primary-text-color)); }
    .feature-status ha-icon { --mdc-icon-size: 17px; flex: 0 0 auto; margin-top: 1px; }
    .feature-status strong { display: block; margin-bottom: 1px; color: var(--primary-text-color); font-weight: 600; }
    .calibration-channel { padding: 17px 18px 18px; border-top: 1px solid var(--divider-color); }
    .calibration-channel-head { display: flex; align-items: center; gap: 8px; margin-bottom: 13px; color: var(--primary-text-color); font-size: 14px; font-weight: 600; }
    .calibration-channel-head ha-icon { --mdc-icon-size: 18px; }
    .calibration-channel.temperature .calibration-channel-head ha-icon { color: #ef642f; }
    .calibration-channel.humidity .calibration-channel-head ha-icon { color: #138fee; }
    .calibration-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .calibration-metric { min-width: 0; padding: 11px 12px; border-radius: 9px; background: var(--secondary-background-color); text-align: center; }
    .calibration-metric.preview { background: color-mix(in srgb, var(--shs-primary) 9%, var(--secondary-background-color)); }
    .metric-label { display: block; margin-bottom: 3px; color: var(--secondary-text-color); font-size: 10.5px; }
    .metric-value { display: block; overflow: hidden; color: var(--primary-text-color); font-size: 19px; font-weight: 650; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .calibration-adjust { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; }
    .calibration-adjust input, .reference-input, .compact-number { box-sizing: border-box; min-height: 36px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--card-background-color); color: var(--primary-text-color); font: inherit; font-size: 13px; }
    .calibration-adjust input { width: 96px; padding: 7px 9px; text-align: center; font-variant-numeric: tabular-nums; }
    .step-button { width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    .step-button:hover:not(:disabled) { border-color: var(--shs-primary); color: var(--shs-primary); }
    .step-button:disabled { cursor: not-allowed; opacity: .45; }
    .step-button ha-icon { --mdc-icon-size: 17px; }
    .reference-box { margin-top: 14px; overflow: hidden; border: 1px dashed var(--divider-color); border-radius: 10px; }
    .reference-guide { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 10px; padding: 13px; background: color-mix(in srgb, var(--shs-primary) 6%, var(--card-background-color)); }
    .reference-guide-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 8px; color: var(--shs-primary); background: color-mix(in srgb, var(--shs-primary) 12%, transparent); }
    .reference-guide-icon ha-icon { --mdc-icon-size: 18px; }
    .reference-title { display: block; margin-bottom: 3px; color: var(--primary-text-color); font-size: 12.5px; font-weight: 650; }
    .reference-guide-copy, .reference-copy { color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.5; }
    .reference-sensor { padding: 13px; border-top: 1px solid var(--divider-color); }
    .reference-sensor-grid { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 9px; align-items: end; }
    .reference-picker { display: block; width: 100%; --mdc-theme-primary: var(--shs-primary); }
    .reference-state { display: flex; align-items: flex-start; gap: 7px; margin-top: 9px; padding: 8px 9px; border-radius: 8px; color: var(--secondary-text-color); background: var(--secondary-background-color); font-size: 11.5px; line-height: 1.4; }
    .reference-state ha-icon { --mdc-icon-size: 16px; flex: 0 0 auto; margin-top: 1px; }
    .reference-state.ready { color: var(--success-color, #138747); background: color-mix(in srgb, var(--success-color, #169c50) 8%, transparent); }
    .reference-state.warning { color: color-mix(in srgb, var(--warning-color, #b86100) 88%, var(--primary-text-color)); background: color-mix(in srgb, var(--warning-color, #f59e0b) 8%, transparent); }
    .reference-state strong { color: inherit; font-weight: 650; }
    .reference-divider { display: flex; align-items: center; gap: 10px; padding: 0 13px; color: var(--secondary-text-color); font-size: 10.5px; }
    .reference-divider::before, .reference-divider::after { content: ''; height: 1px; flex: 1; background: var(--divider-color); }
    .reference-manual { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 9px; padding: 12px 13px 13px; }
    .reference-copy { grid-column: 1 / -1; }
    .reference-input { width: 100%; padding: 7px 10px; }
    .secondary-button, .primary-button { min-height: 36px; padding: 7px 13px; border-radius: 8px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
    .secondary-button { border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }
    .secondary-button:hover:not(:disabled) { border-color: var(--shs-primary); color: var(--shs-primary); }
    .primary-button { border: 1px solid var(--shs-primary); background: var(--shs-primary); color: white; }
    .secondary-button:disabled, .primary-button:disabled { cursor: not-allowed; opacity: .48; }
    .speaker-body { padding: 0 18px 18px; }
    .speaker-volume { padding: 14px; border: 1px solid var(--divider-color); border-radius: 10px; background: color-mix(in srgb, var(--secondary-background-color) 40%, var(--card-background-color)); }
    .speaker-volume-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 13px; }
    .speaker-volume-label { display: flex; align-items: flex-start; gap: 9px; color: var(--primary-text-color); font-size: 13.5px; font-weight: 600; }
    .speaker-volume-label ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color); }
    .speaker-volume-copy { margin: 3px 0 0 27px; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.45; }
    .speaker-output { min-width: 48px; padding: 5px 8px; border: 1px solid var(--divider-color); border-radius: 7px; text-align: center; color: var(--primary-text-color); background: var(--card-background-color); font-size: 13px; font-weight: 650; font-variant-numeric: tabular-nums; }
    .range-input { width: 100%; margin: 0; accent-color: var(--shs-primary); cursor: pointer; }
    .range-labels { display: flex; justify-content: space-between; margin-top: 4px; color: var(--secondary-text-color); font-size: 10.5px; }
    .speaker-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 12px; }
    .test-sound { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 14px; padding: 13px 14px; border: 1px dashed var(--divider-color); border-radius: 9px; }
    .test-title { margin: 0; color: var(--primary-text-color); font-size: 13px; font-weight: 600; }
    .test-description { margin: 3px 0 0; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.45; }
    .led-row { padding: 15px 18px; border-top: 1px solid var(--divider-color); }
    .led-row-main { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .led-row-label { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
    .led-row-label > ha-icon { --mdc-icon-size: 19px; margin-top: 1px; color: var(--shs-primary); }
    .led-row-label.motion > ha-icon { color: #3779ef; }
    .led-row-label.night > ha-icon { color: #6858f5; }
    .led-row-label.co2 > ha-icon { color: #149b69; }
    .led-row-title { color: var(--primary-text-color); font-size: 13.5px; font-weight: 600; }
    .led-row-description { margin-top: 3px; max-width: 680px; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.45; }
    .led-options { display: grid; grid-template-columns: repeat(3, minmax(100px, 1fr)); gap: 10px; margin: 13px 0 0 29px; }
    .led-option label { display: block; margin-bottom: 4px; color: var(--secondary-text-color); font-size: 10.5px; }
    .led-option .setting-control { justify-content: flex-start; }
    .feature-heading.quiet > ha-icon { color: #6d5de7; }
    .quiet-summary { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 16px; padding: 14px 18px; border-top: 1px solid var(--divider-color); }
    .quiet-summary-copy { min-width: 0; }
    .quiet-summary-title { color: var(--primary-text-color); font-size: 13.5px; font-weight: 600; }
    .quiet-summary-description { margin-top: 3px; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.45; overflow-wrap: anywhere; }
    .quiet-toggle { width: 44px; height: 24px; border-radius: 12px; }
    .quiet-toggle::after { width: 20px; height: 20px; }
    .quiet-toggle.on::after { transform: translateX(20px); }
    .quiet-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 16px 18px; border-top: 1px solid var(--divider-color); }
    .quiet-field { min-width: 0; }
    .quiet-field label { display: block; margin-bottom: 6px; color: var(--secondary-text-color); font-size: 11px; font-weight: 600; }
    .quiet-field select { box-sizing: border-box; width: 100%; min-height: 44px; padding: 8px 34px 8px 11px; border: 1px solid var(--divider-color); border-radius: 9px; background: var(--card-background-color); color: var(--primary-text-color); font: inherit; font-size: 13.5px; font-variant-numeric: tabular-nums; cursor: pointer; }
    .quiet-field select:focus-visible { outline: 2px solid var(--shs-primary); outline-offset: 2px; }
    .quiet-field select:disabled { cursor: not-allowed; opacity: .5; }
    .quiet-idle { padding: 16px 18px; border-top: 1px solid var(--divider-color); }
    .quiet-idle-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, 230px); align-items: end; gap: 18px; }
    .quiet-idle-copy { min-width: 0; }
    .quiet-idle-title { display: block; color: var(--primary-text-color); font-size: 13.5px; font-weight: 650; line-height: 1.35; }
    .quiet-idle-description { margin: 4px 0 0; max-width: 720px; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.5; overflow-wrap: anywhere; }
    .quiet-idle-select { min-width: 0; }
    .quiet-idle-select label { display: block; margin-bottom: 6px; color: var(--secondary-text-color); font-size: 11px; font-weight: 600; }
    .quiet-idle-select select { box-sizing: border-box; width: 100%; min-height: 44px; padding: 8px 34px 8px 11px; border: 1px solid var(--divider-color); border-radius: 9px; background: var(--card-background-color); color: var(--primary-text-color); font: inherit; font-size: 13.5px; cursor: pointer; }
    .quiet-idle-select select:focus-visible { outline: 2px solid var(--shs-primary); outline-offset: 2px; }
    .quiet-idle-select select:disabled { cursor: not-allowed; opacity: .5; }
    .quiet-idle-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; padding: 10px 11px; border-radius: 8px; color: var(--secondary-text-color); background: color-mix(in srgb, var(--shs-primary) 6%, transparent); font-size: 11.5px; line-height: 1.5; }
    .quiet-idle-note.override { color: color-mix(in srgb, #6d5de7 78%, var(--primary-text-color)); background: color-mix(in srgb, #6d5de7 8%, transparent); }
    .quiet-idle-note ha-icon { --mdc-icon-size: 17px; flex: 0 0 auto; margin-top: 1px; }
    .quiet-idle-upgrade { margin: 0; }
    .quiet-idle > .quiet-error { margin: 12px 0 0; }
    .quiet-state-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding: 12px 18px; border-top: 1px solid var(--divider-color); background: color-mix(in srgb, var(--secondary-background-color) 46%, var(--card-background-color)); }
    .quiet-state { display: inline-flex; align-items: center; gap: 6px; color: var(--secondary-text-color); font-size: 11.5px; }
    .quiet-state ha-icon { --mdc-icon-size: 17px; }
    .quiet-state ha-circular-progress { width: 17px; height: 17px; --mdc-theme-primary: var(--shs-primary); }
    .quiet-state.active { color: #6d5de7; font-weight: 600; }
    .quiet-state.ready { color: var(--success-color, #138747); }
    .quiet-state.attention { color: var(--warning-color, #b86100); }
    .quiet-note { display: flex; align-items: flex-start; gap: 8px; padding: 12px 18px 15px; color: var(--secondary-text-color); font-size: 11.5px; line-height: 1.5; }
    .quiet-note.equal { color: color-mix(in srgb, #6d5de7 76%, var(--primary-text-color)); background: color-mix(in srgb, #6d5de7 7%, transparent); }
    .quiet-note ha-icon { --mdc-icon-size: 17px; flex: 0 0 auto; margin-top: 1px; }
    .quiet-error { display: flex; align-items: flex-start; gap: 8px; margin: 0 18px 15px; padding: 10px 11px; border-radius: 8px; color: var(--error-color, #dc2626); background: color-mix(in srgb, var(--error-color, #dc2626) 8%, transparent); font-size: 11.5px; line-height: 1.45; }
    .quiet-error ha-icon { --mdc-icon-size: 17px; flex: 0 0 auto; }
    .quiet-upgrade { margin-top: 0; }
    .advanced-intro { display: flex; align-items: flex-start; gap: 10px; margin: 2px 0 12px; }
    .advanced-intro ha-icon { --mdc-icon-size: 19px; color: var(--secondary-text-color); }
    .advanced-title { margin: 0; color: var(--primary-text-color); font-size: 14px; font-weight: 650; }
    .advanced-description { margin: 3px 0 0; color: var(--secondary-text-color); font-size: 12px; line-height: 1.45; }
    .empty-state { text-align: center; padding: 48px 24px; border: 1px dashed var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); }
    .empty-state ha-icon { --mdc-icon-size: 40px; color: var(--secondary-text-color); margin-bottom: 12px; }
    .empty-state h3 { font-size: 16px; color: var(--primary-text-color); margin: 0 0 8px 0; }
    .empty-state p { font-size: 13.5px; color: var(--secondary-text-color); margin: 0; }
    .loading { display: flex; align-items: center; justify-content: center; padding: 48px; }
    .confirm-backdrop { position: fixed; inset: 0; z-index: 1005; display: grid; place-items: center; padding: 20px; background: rgba(15, 23, 42, .48); }
    .confirm-dialog { width: min(470px, 100%); overflow: hidden; border: 1px solid var(--divider-color); border-radius: 16px; background: var(--card-background-color); box-shadow: 0 18px 60px rgba(0, 0, 0, .24); }
    .confirm-copy { display: grid; grid-template-columns: 38px 1fr; gap: 13px; padding: 21px 22px 18px; }
    .confirm-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 10px; color: var(--warning-color, #d97706); background: color-mix(in srgb, var(--warning-color, #f59e0b) 12%, transparent); }
    .confirm-dialog.danger .confirm-icon { color: var(--error-color, #dc2626); background: color-mix(in srgb, var(--error-color, #dc2626) 10%, transparent); }
    .confirm-icon ha-icon { --mdc-icon-size: 21px; }
    .confirm-title { margin: 0 0 7px; color: var(--primary-text-color); font-size: 17px; font-weight: 650; line-height: 1.25; }
    .confirm-body { margin: 0; color: var(--secondary-text-color); font-size: 13px; line-height: 1.55; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 9px; padding: 13px 18px; border-top: 1px solid var(--divider-color); background: color-mix(in srgb, var(--secondary-background-color) 58%, var(--card-background-color)); }
    .confirm-actions button { min-height: 38px; padding: 7px 15px; border-radius: 9px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
    .confirm-cancel { border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }
    .confirm-accept { border: none; background: var(--warning-color, #d97706); color: white; }
    .confirm-dialog.danger .confirm-accept { background: var(--error-color, #dc2626); }
    .confirm-actions button:disabled { cursor: wait; opacity: .58; }
    .correction-dialog .confirm-copy { grid-template-columns: 54px 1fr; align-items: center; }
    .correction-dialog .confirm-icon { width: 54px; height: 54px; border-radius: 50%; color: var(--shs-primary); background: color-mix(in srgb, var(--shs-primary) 11%, transparent); }
    .correction-dialog.calibrating .confirm-icon { color: var(--warning-color, #d97706); background: color-mix(in srgb, var(--warning-color, #f59e0b) 12%, transparent); }
    .correction-dialog.complete .confirm-icon { color: var(--success-color, #169c50); background: color-mix(in srgb, var(--success-color, #169c50) 11%, transparent); }
    .correction-dialog.untracked .confirm-icon { color: var(--warning-color, #d97706); background: color-mix(in srgb, var(--warning-color, #f59e0b) 12%, transparent); }
    .correction-countdown { font-size: 24px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
    .correction-dialog ha-circular-progress { --mdc-theme-primary: var(--warning-color, #d97706); }
    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .setting-item { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
      .setting-control { justify-content: flex-start; }
      .setting-control input[type="number"], .setting-control select { min-height: 38px; }
      .confirm-copy { grid-template-columns: 32px 1fr; padding: 18px 17px 15px; }
      .confirm-icon { width: 32px; height: 32px; border-radius: 8px; }
      .correction-dialog .confirm-copy { grid-template-columns: 44px 1fr; }
      .correction-dialog .confirm-icon { width: 44px; height: 44px; }
      .correction-countdown { font-size: 20px; }
      .confirm-actions { display: grid; grid-template-columns: 1fr; }
      .confirm-actions button { width: 100%; }
      .confirm-accept { order: -1; }
      .feature-header { padding: 15px 14px 13px; }
      .feature-status { margin: 0 14px 14px; }
      .calibration-channel { padding: 15px 14px 16px; }
      .calibration-metrics { grid-template-columns: 1fr; }
      .calibration-metric { display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; }
      .metric-label { margin: 0; }
      .metric-value { font-size: 16px; }
      .reference-sensor-grid, .reference-manual { grid-template-columns: 1fr; }
      .reference-sensor-grid button, .reference-manual button { width: 100%; }
      .reference-copy { grid-column: auto; }
      .speaker-body { padding: 0 14px 15px; }
      .speaker-actions, .test-sound { align-items: stretch; flex-direction: column; }
      .speaker-actions button, .test-sound button { width: 100%; }
      .led-row { padding: 14px; }
      .led-options { grid-template-columns: 1fr; margin-left: 29px; }
      .quiet-summary { padding: 14px; }
      .quiet-controls { grid-template-columns: 1fr; padding: 14px; }
      .quiet-idle { padding: 14px; }
      .quiet-idle-layout { grid-template-columns: 1fr; gap: 12px; }
      .quiet-state-row { align-items: flex-start; flex-direction: column; padding: 12px 14px; }
      .quiet-note { padding: 12px 14px 14px; }
      .quiet-error { margin: 0 14px 14px; }
    }

    /* Product settings (config entry options) */
    .cfg-card { margin-bottom: 20px; }
    .cfg-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 16px; }
    .cfg-row + .cfg-row { border-top: 1px solid var(--divider-color); }
    .cfg-info { min-width: 0; }
    .cfg-label { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color); }
    .cfg-help { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 2px; line-height: 1.4; }
    .cfg-note { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; font-size: 12.5px; line-height: 1.5; color: var(--secondary-text-color); background: var(--shs-primary-10, rgba(3, 169, 244, 0.08)); border-bottom: 1px solid var(--divider-color); }
    .cfg-note ha-icon { --mdc-icon-size: 18px; color: var(--shs-primary); flex-shrink: 0; margin-top: 1px; }
    .cfg-note strong { color: var(--primary-text-color); }
    .cfg-control { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .cfg-control input, .cfg-control select {
      padding: 7px 10px; border: 1px solid var(--divider-color); border-radius: 8px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-family: inherit;
    }
    .cfg-control input[type="number"] { width: 90px; text-align: right; }
    .cfg-control input:focus, .cfg-control select:focus { outline: none; border-color: var(--shs-primary); }
    .cfg-control ha-entity-picker { display: block; width: min(320px, 46vw); --mdc-theme-primary: var(--shs-primary); }
    .cfg-unit { font-size: 12px; color: var(--secondary-text-color); min-width: 34px; }
    .cfg-foot { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--divider-color); }
    .cfg-saved { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: #22c55e; }
    .cfg-error { font-size: 12.5px; color: #ef4444; }
    .cfg-saved ha-icon { --mdc-icon-size: 15px; }
    .cfg-save { padding: 9px 18px; border: none; border-radius: 8px; background: var(--shs-primary); color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .cfg-save:disabled { opacity: 0.5; cursor: default; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    if (this.embedded && this.selectedDeviceId) {
      this._loadEmbedded();
    } else {
      this._loadDevices();
    }
  }

  disconnectedCallback(): void {
    this._stopBackgroundCorrectionTimer();
    super.disconnectedCallback();
  }

  private async _loadDevices(): Promise<void> {
    this._loading = true;
    try {
      const result = await this.hass.callWS<{ devices: SmartHomeShopDevice[] }>({ type: 'smarthomeshop/devices' });
      this._devices = result.devices.filter(d => d.product_type?.includes('sensor'));
      if (this._devices.length > 0) await this._selectDevice(this._devices[0]);
    } catch (err) { console.error('Failed to load devices:', err); }
    this._loading = false;
  }

  private async _loadEmbedded(): Promise<void> {
    this._loading = true;
    this._selectedDevice = { id: this.selectedDeviceId!, name: '', entity_count: 0 };
    await this._loadEntities(this.selectedDeviceId!);
    this._loading = false;
  }

  private async _selectDevice(device: SmartHomeShopDevice): Promise<void> {
    this._closeBackgroundCorrectionProgress();
    this._selectedDevice = device;
    this._expandedGroups = new Set();
    this.dispatchEvent(new CustomEvent('device-select', { detail: { deviceId: device.id } }));
    await this._loadEntities(device.id);
  }

  private async _loadEntities(deviceId: string): Promise<void> {
    try {
      const result = await this.hass.callWS<{
        entities: DeviceEntity[];
        quiet_hours?: Sps30QuietHoursCapability;
      }>({ type: 'smarthomeshop/device/entities', device_id: deviceId });
      // Keep the complete device entity set. Read-only sensor values, the media
      // player and the LED are used by the guided controls, while only actual
      // configuration entities are shown in the advanced list below.
      this._entities = result.entities;
      this._quietHours = result.quiet_hours;
      this._quietHoursPending = undefined;
      this._quietHoursError = '';
      this._calibrationDrafts = {};
      this._calibrationReferences = {};
      this._calibrationReferenceEntities = {};
      this._speakerVolumeDraft = undefined;
      this._ledBrightnessDraft = undefined;
    } catch (err) {
      console.error('Failed to load entities:', err);
      this._quietHours = undefined;
      this._quietHoursPending = undefined;
      this._quietHoursError = '';
    }
    await this._loadConfig(deviceId);
  }

  private async _loadConfig(deviceId: string): Promise<void> {
    try {
      const res = await this.hass.callWS<{ fields: any[]; product_type?: string; contract_active?: boolean; contract_name?: string | null }>({ type: 'smarthomeshop/device/config', device_id: deviceId });
      this._configFields = res.fields || [];
      this._productType = res.product_type || '';
      this._contractActive = !!res.contract_active;
      this._contractName = res.contract_name || null;
      const values: Record<string, any> = {};
      for (const f of this._configFields) values[f.key] = f.value;
      this._configValues = values;
    } catch (err) {
      console.error('Failed to load config:', err);
      this._configFields = [];
    }
  }

  private async _saveConfig(): Promise<void> {
    if (!this._selectedDevice || this._savingConfig) return;
    this._savingConfig = true;
    this._configSaved = false;
    try {
      await this.hass.callWS({
        type: 'smarthomeshop/device/config/set',
        device_id: this._selectedDevice.id,
        values: this._configValues,
      });
      this._configSaved = true;
      this._configError = '';
      window.setTimeout(() => { this._configSaved = false; }, 2500);
    } catch (err: any) {
      console.error('Failed to save config:', err);
      this._configError = `Could not save: ${err?.message || 'unknown error'}`;
    }
    this._savingConfig = false;
  }

  private _renderConfigField(f: any) {
    const val = this._configValues[f.key];
    const set = (v: any) => { this._configValues = { ...this._configValues, [f.key]: v }; };
    let control;
    if (f.type === 'number') {
      control = html`
        <input type="number" .value=${val ?? ''} min=${f.min ?? nothing} max=${f.max ?? nothing} step=${f.step ?? nothing}
          @input=${(e: Event) => set(parseFloat((e.target as HTMLInputElement).value))} />
        ${f.unit ? html`<span class="cfg-unit">${f.unit}</span>` : nothing}`;
    } else if (f.type === 'time') {
      control = html`<input type="time" .value=${val ?? ''} @input=${(e: Event) => set((e.target as HTMLInputElement).value)} />`;
    } else if (f.type === 'entity') {
      const domains = Array.isArray(f.domains) && f.domains.length ? f.domains : ['input_boolean'];
      control = html`
        <ha-entity-picker
          .hass=${this.hass}
          .value=${val || ''}
          .includeDomains=${domains}
          .allowCustomEntity=${false}
          @value-changed=${(event: CustomEvent<{ value?: string }>) =>
            set(event.detail?.value || '')}
        ></ha-entity-picker>`;
    } else {
      control = html`<input type="text" .value=${val ?? ''} @input=${(e: Event) => set((e.target as HTMLInputElement).value)} />`;
    }
    return html`
      <div class="cfg-row">
        <div class="cfg-info">
          <div class="cfg-label">${f.label}</div>
          ${f.help ? html`<div class="cfg-help">${f.help}</div>` : nothing}
        </div>
        <div class="cfg-control">${control}</div>
      </div>`;
  }

  private _renderConfigCard() {
    if (this._configFields.length === 0) return nothing;
    const isAdmin = !!this.hass.user?.is_admin;
    // When a contract supplies a price it is the single source of truth, so
    // hide those fields (flagged "managed" by the backend) and explain why.
    const visibleFields = this._configFields.filter(f => !f.managed);
    const hidePrices = this._contractActive && visibleFields.length !== this._configFields.length;
    return html`
      <div class="settings-group cfg-card">
        <div class="group-header">
          <ha-icon icon="mdi:cog-outline"></ha-icon>
          <span class="group-title">Product settings</span>
        </div>
        ${hidePrices ? html`
          <div class="cfg-note">
            <ha-icon icon="mdi:file-document-check-outline"></ha-icon>
            <span>Prices come from your connected energy contract${this._contractName ? html` <strong>${this._contractName}</strong>` : nothing}. Manage or disconnect the global connection from the Energy tab to set prices manually.</span>
          </div>` : nothing}
        ${visibleFields.map(f => this._renderConfigField(f))}
        <div class="cfg-foot">
          ${this._configSaved ? html`<span class="cfg-saved"><ha-icon icon="mdi:check-circle"></ha-icon> Saved</span>` : nothing}
          ${this._configError ? html`<span class="cfg-error">${this._configError}</span>` : nothing}
          <button class="cfg-save" ?disabled=${!isAdmin || this._savingConfig} @click=${this._saveConfig}>
            ${this._savingConfig ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>`;
  }

  private _entityText(entity: DeviceEntity): string {
    return `${entity.name} ${entity.entity_id}`.toLowerCase();
  }

  private _findEntity(domain: string, match: RegExp, exclude?: RegExp): DeviceEntity | undefined {
    const candidates = this._entities.filter(entity => {
      if (entity.domain !== domain) return false;
      const value = this._entityText(entity);
      return match.test(value) && (!exclude || !exclude.test(value));
    });
    candidates.sort((a, b) => {
      const aSCD = this._entityText(a).includes('scd41') ? 0 : 1;
      const bSCD = this._entityText(b).includes('scd41') ? 0 : 1;
      return aSCD - bSCD || a.name.localeCompare(b.name);
    });
    return candidates[0];
  }

  private _stateObject(entity?: DeviceEntity): any | undefined {
    if (!entity) return undefined;
    return this.hass.states[entity.entity_id];
  }

  private _numericState(entity?: DeviceEntity): number | null {
    const value = this._stateObject(entity)?.state ?? entity?.state;
    const numeric = Number(value);
    return value === undefined || value === null || value === '' || !Number.isFinite(numeric) ? null : numeric;
  }

  private _numberAttributes(entity: DeviceEntity): Record<string, any> {
    return (this._stateObject(entity)?.attributes || entity.attributes || {}) as Record<string, any>;
  }

  private _calibrationChannels(): CalibrationChannel[] {
    const channels: CalibrationChannel[] = [];
    const temperatureOffset = this._findEntity('number', /temperature[_ ]offset/);
    const humidityOffset = this._findEntity('number', /humidity[_ ]offset/);
    if (temperatureOffset) {
      channels.push({
        kind: 'temperature',
        icon: 'mdi:thermometer',
        offset: temperatureOffset,
        sensor: this._findEntity('sensor', /temperature/, /cpu|processor|internal/),
        unit: '°C',
        decimals: 1,
      });
    }
    if (humidityOffset) {
      channels.push({
        kind: 'humidity',
        icon: 'mdi:water-percent',
        offset: humidityOffset,
        sensor: this._findEntity('sensor', /humidity/),
        unit: '%',
        decimals: 0,
      });
    }
    return channels;
  }

  private _hasEnvironmentReadings(): boolean {
    return !!this._findEntity('sensor', /temperature/, /cpu|processor|internal/) ||
      !!this._findEntity('sensor', /humidity/);
  }

  private _isUltimateSensor(): boolean {
    const deviceText = `${this._selectedDevice?.name || ''} ${this._selectedDevice?.product_name || ''} ${this._selectedDevice?.product_type || ''}`.toLowerCase();
    return deviceText.includes('ultimate') || this._entities.some(entity => entity.entity_id.includes('ultimatesensor'));
  }

  private _calibrationNumbers(channel: CalibrationChannel) {
    const storedOffset = this._numericState(channel.offset) ?? 0;
    const draftOffset = this._calibrationDrafts[channel.offset.entity_id] ?? storedOffset;
    const calibrated = this._numericState(channel.sensor);
    const raw = calibrated === null ? null : calibrated - storedOffset;
    const preview = raw === null ? null : raw + draftOffset;
    return { storedOffset, draftOffset, raw, preview };
  }

  private _formatValue(value: number | null, decimals: number, unit: string, signed = false): string {
    if (value === null || !Number.isFinite(value)) return '–';
    const prefix = signed && value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(decimals)}${unit}`;
  }

  private _setCalibrationDraft(channel: CalibrationChannel, requested: number): void {
    const attrs = this._numberAttributes(channel.offset);
    const min = Number.isFinite(Number(attrs.min)) ? Number(attrs.min) : -50;
    const max = Number.isFinite(Number(attrs.max)) ? Number(attrs.max) : 50;
    const step = Number.isFinite(Number(attrs.step)) && Number(attrs.step) > 0 ? Number(attrs.step) : 0.1;
    const clamped = Math.min(max, Math.max(min, requested));
    const rounded = Math.round(clamped / step) * step;
    this._calibrationDrafts = { ...this._calibrationDrafts, [channel.offset.entity_id]: Number(rounded.toFixed(4)) };
  }

  private _adjustCalibration(channel: CalibrationChannel, direction: -1 | 1): void {
    const attrs = this._numberAttributes(channel.offset);
    const step = Number.isFinite(Number(attrs.step)) && Number(attrs.step) > 0 ? Number(attrs.step) : 0.1;
    const { draftOffset } = this._calibrationNumbers(channel);
    this._setCalibrationDraft(channel, draftOffset + direction * step);
  }

  private _selectedDeviceEntityIds(): string[] {
    const entityIds = new Set(this._entities.map(entity => entity.entity_id));
    const deviceId = this._selectedDevice?.id;
    if (deviceId) {
      for (const [entityId, registryEntry] of Object.entries(this.hass.entities || {})) {
        if (registryEntry.device_id === deviceId) entityIds.add(entityId);
      }
    }
    return [...entityIds];
  }

  private _calibrationReferenceReading(channel: CalibrationChannel): CalibrationReferenceReading | null {
    const entityId = this._calibrationReferenceEntities[channel.offset.entity_id] || '';
    if (!entityId) return null;

    const stateObj = this.hass.states[entityId];
    const name = String(stateObj?.attributes?.friendly_name || this.hass.entities?.[entityId]?.name || entityId);
    if (this._selectedDeviceEntityIds().includes(entityId)) {
      return {
        entityId,
        name,
        value: null,
        display: '–',
        tone: 'warning',
        message: this._text('calibration.reference_same_device'),
      };
    }
    if (!stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown') {
      return {
        entityId,
        name,
        value: null,
        display: '–',
        tone: 'warning',
        message: this._text('calibration.reference_unavailable', { name }),
      };
    }

    const deviceClass = String(stateObj.attributes.device_class || '').toLowerCase();
    if (deviceClass && deviceClass !== channel.kind) {
      return {
        entityId,
        name,
        value: null,
        display: '–',
        tone: 'warning',
        message: this._text('calibration.reference_wrong_type'),
      };
    }

    const numeric = Number(stateObj.state);
    const sourceUnit = String(stateObj.attributes.unit_of_measurement || '').replace(/\s/g, '').toLowerCase();
    if (!Number.isFinite(numeric)) {
      return {
        entityId,
        name,
        value: null,
        display: '–',
        tone: 'warning',
        message: this._text('calibration.reference_invalid', { name }),
      };
    }

    let value = numeric;
    let converted = false;
    if (channel.kind === 'temperature') {
      if (sourceUnit === '°f' || sourceUnit === 'f') {
        value = (numeric - 32) * 5 / 9;
        converted = true;
      } else if (sourceUnit !== '°c' && sourceUnit !== 'c') {
        return {
          entityId,
          name,
          value: null,
          display: '–',
          tone: 'warning',
          message: this._text('calibration.reference_wrong_unit'),
        };
      }
    } else if (sourceUnit !== '%') {
      return {
        entityId,
        name,
        value: null,
        display: '–',
        tone: 'warning',
        message: this._text('calibration.reference_wrong_unit'),
      };
    }

    const display = this._formatValue(value, channel.decimals, channel.unit);
    const sourceDisplay = `${numeric.toFixed(channel.decimals)}${String(stateObj.attributes.unit_of_measurement || '')}`;
    return {
      entityId,
      name,
      value,
      display,
      tone: 'ready',
      message: converted
        ? this._text('calibration.reference_converted', { name, value: display, source: sourceDisplay })
        : this._text('calibration.reference_ready', { name, value: display }),
    };
  }

  private _calculateCalibrationFromEntity(channel: CalibrationChannel): void {
    const reference = this._calibrationReferenceReading(channel);
    const { raw } = this._calibrationNumbers(channel);
    if (reference?.value === null || reference?.value === undefined || raw === null) return;
    this._setCalibrationDraft(channel, reference.value - raw);
  }

  private _calculateCalibration(channel: CalibrationChannel): void {
    const reference = Number(this._calibrationReferences[channel.offset.entity_id]);
    const { raw } = this._calibrationNumbers(channel);
    if (!Number.isFinite(reference) || raw === null) return;
    this._setCalibrationDraft(channel, reference - raw);
  }

  private async _applyCalibration(channel: CalibrationChannel): Promise<void> {
    const { draftOffset } = this._calibrationNumbers(channel);
    const succeeded = await this._executeEntityService(channel.offset, 'number', 'set_value', { value: draftOffset });
    if (succeeded) {
      this._setEntityFeedback(channel.offset.entity_id, 'success', this._text('calibration.saved'));
    }
  }

  private _renderCalibrationChannel(channel: CalibrationChannel) {
    const stateObj = this._stateObject(channel.offset);
    const unavailable = this._isEntityUnavailable(channel.offset, stateObj);
    const { storedOffset, draftOffset, raw, preview } = this._calibrationNumbers(channel);
    const feedback = this._entityFeedback[channel.offset.entity_id];
    const attrs = this._numberAttributes(channel.offset);
    const min = Number.isFinite(Number(attrs.min)) ? Number(attrs.min) : -50;
    const max = Number.isFinite(Number(attrs.max)) ? Number(attrs.max) : 50;
    const step = Number.isFinite(Number(attrs.step)) && Number(attrs.step) > 0 ? Number(attrs.step) : 0.1;
    const reference = this._calibrationReferences[channel.offset.entity_id] ?? '';
    const referenceValid = reference.trim() !== '' && Number.isFinite(Number(reference)) && raw !== null;
    const referenceEntity = this._calibrationReferenceEntities[channel.offset.entity_id] ?? '';
    const referenceReading = this._calibrationReferenceReading(channel);
    const referenceEntityValid = referenceReading?.value !== null && referenceReading?.value !== undefined && raw !== null;
    const dirty = Math.abs(draftOffset - storedOffset) > 0.0001;
    const running = this._runningEntity === channel.offset.entity_id;

    return html`
      <div class="calibration-channel ${channel.kind}">
        <div class="calibration-channel-head">
          <ha-icon icon=${channel.icon}></ha-icon>
          <span>${this._text(`calibration.${channel.kind}`)}</span>
        </div>
        ${channel.offset.disabled_by ? html`
          <div class="feature-status warning">
            <ha-icon icon="mdi:lock-outline"></ha-icon>
            <div>
              <strong>${this._text('status.disabled')}</strong>
              ${this._text('calibration.enable_offset')}
            </div>
            <span class="setting-control">${this._renderControl(channel.offset)}</span>
          </div>
        ` : html`
          <div class="calibration-metrics">
            <div class="calibration-metric">
              <span class="metric-label">${this._text('calibration.raw')}</span>
              <span class="metric-value">${this._formatValue(raw, channel.decimals, channel.unit)}</span>
            </div>
            <div class="calibration-metric">
              <span class="metric-label">${this._text('calibration.offset')}</span>
              <span class="metric-value">${this._formatValue(draftOffset, channel.kind === 'temperature' ? 1 : 0, channel.unit, true)}</span>
            </div>
            <div class="calibration-metric preview">
              <span class="metric-label">${this._text('calibration.preview')}</span>
              <span class="metric-value">${this._formatValue(preview, channel.decimals, channel.unit)}</span>
            </div>
          </div>
          <div class="calibration-adjust">
            <button class="step-button" aria-label=${this._text('calibration.decrease')}
              ?disabled=${unavailable || running || draftOffset <= min}
              @click=${() => this._adjustCalibration(channel, -1)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <input type="number" .value=${String(draftOffset)} min=${min} max=${max} step=${step}
              ?disabled=${unavailable || running}
              aria-label=${this._text('calibration.offset')}
              @input=${(event: Event) => {
                const value = Number((event.target as HTMLInputElement).value);
                if (Number.isFinite(value)) this._setCalibrationDraft(channel, value);
              }} />
            <button class="step-button" aria-label=${this._text('calibration.increase')}
              ?disabled=${unavailable || running || draftOffset >= max}
              @click=${() => this._adjustCalibration(channel, 1)}><ha-icon icon="mdi:plus"></ha-icon></button>
            <button class="primary-button" ?disabled=${unavailable || running || !dirty}
              @click=${() => this._applyCalibration(channel)}>${this._text(running ? 'action.applying' : 'action.apply')}</button>
          </div>
          <div class="reference-box">
            <div class="reference-guide">
              <span class="reference-guide-icon"><ha-icon icon="mdi:compare-horizontal"></ha-icon></span>
              <div>
                <strong class="reference-title">${this._text('calibration.reference_sensor_title')}</strong>
                <div class="reference-guide-copy">${this._text('calibration.reference_sensor_description')}</div>
              </div>
            </div>
            <div class="reference-sensor">
              <div class="reference-sensor-grid">
                <ha-entity-picker
                  class="reference-picker"
                  .hass=${this.hass}
                  .value=${referenceEntity}
                  .label=${this._text(`calibration.${channel.kind}_reference_label`)}
                  .includeDomains=${['sensor']}
                  .includeDeviceClasses=${[channel.kind]}
                  .excludeEntities=${this._selectedDeviceEntityIds()}
                  .allowCustomEntity=${false}
                  .disabled=${unavailable || raw === null || running}
                  @value-changed=${(event: CustomEvent<{ value?: string }>) => {
                    this._calibrationReferenceEntities = {
                      ...this._calibrationReferenceEntities,
                      [channel.offset.entity_id]: event.detail?.value || '',
                    };
                  }}
                ></ha-entity-picker>
                <button class="secondary-button" ?disabled=${!referenceEntityValid || running}
                  @click=${() => this._calculateCalibrationFromEntity(channel)}>${this._text('action.calculate_from_sensor')}</button>
              </div>
              ${referenceReading ? html`
                <div class="reference-state ${referenceReading.tone}">
                  <ha-icon icon=${referenceReading.tone === 'ready' ? 'mdi:check-circle-outline' : 'mdi:alert-outline'}></ha-icon>
                  <span>${referenceReading.message}</span>
                </div>
              ` : nothing}
            </div>
            <div class="reference-divider"><span>${this._text('calibration.manual_divider')}</span></div>
            <div class="reference-manual">
              <div class="reference-copy">${this._text('calibration.reference')}</div>
              <input class="reference-input" type="number" .value=${reference} step=${channel.kind === 'temperature' ? '0.1' : '1'}
                placeholder=${this._text(`calibration.${channel.kind}_placeholder`)}
                ?disabled=${unavailable || raw === null}
                @input=${(event: Event) => {
                  this._calibrationReferences = {
                    ...this._calibrationReferences,
                    [channel.offset.entity_id]: (event.target as HTMLInputElement).value,
                  };
                }} />
              <button class="secondary-button" ?disabled=${!referenceValid || running}
                @click=${() => this._calculateCalibration(channel)}>${this._text('action.calculate')}</button>
            </div>
          </div>
          ${feedback ? html`
            <div class="setting-state ${feedback.tone}">
              <ha-icon icon=${feedback.tone === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}></ha-icon>
              <span>${feedback.text}</span>
            </div>` : nothing}
        `}
      </div>`;
  }

  private _renderCalibrationCard() {
    const channels = this._calibrationChannels();
    if (channels.length === 0 && !(this._isUltimateSensor() && this._hasEnvironmentReadings())) return nothing;
    return html`
      <section class="feature-card">
        <div class="feature-header">
          <div class="feature-heading thermometer">
            <ha-icon icon="mdi:thermometer-lines"></ha-icon>
            <div>
              <h2 class="feature-title">${this._text('calibration.title')}</h2>
              <p class="feature-description">${this._text('calibration.description')}</p>
            </div>
          </div>
        </div>
        ${channels.length > 0 ? html`
          <div class="feature-status">
            <ha-icon icon="mdi:memory"></ha-icon>
            <div><strong>${this._text('calibration.per_device')}</strong>${this._text('calibration.per_device_description')}</div>
          </div>
          ${channels.map(channel => this._renderCalibrationChannel(channel))}
        ` : html`
          <div class="feature-status warning">
            <ha-icon icon="mdi:update"></ha-icon>
            <div><strong>${this._text('calibration.firmware_required')}</strong>${this._text('calibration.firmware_required_description')}</div>
          </div>
        `}
      </section>`;
  }

  private _speakerEntities(): { player?: DeviceEntity; volume?: DeviceEntity } {
    return {
      player: this._findEntity('media_player', /media[_ ]player|speaker/),
      volume: this._findEntity('number', /speaker[_ ]volume/),
    };
  }

  private _speakerVolume(): number {
    const { player, volume } = this._speakerEntities();
    const numberVolume = this._numericState(volume);
    if (numberVolume !== null) return Math.max(0, Math.min(100, numberVolume));
    const playerVolume = Number(this._stateObject(player)?.attributes?.volume_level);
    return Number.isFinite(playerVolume) ? Math.round(Math.max(0, Math.min(1, playerVolume)) * 100) : 40;
  }

  private async _saveSpeakerVolume(showFeedback = true): Promise<boolean> {
    const { player, volume } = this._speakerEntities();
    const requested = Math.round(this._speakerVolumeDraft ?? this._speakerVolume());
    let succeeded = false;
    if (volume) {
      succeeded = await this._executeEntityService(volume, 'number', 'set_value', { value: requested });
    } else if (player) {
      succeeded = await this._executeEntityService(player, 'media_player', 'volume_set', { volume_level: requested / 100 });
    }
    const feedbackEntity = volume || player;
    if (succeeded && showFeedback && feedbackEntity) {
      this._setEntityFeedback(feedbackEntity.entity_id, 'success', this._text('speaker.saved'));
    }
    return succeeded;
  }

  private async _playSpeakerTest(): Promise<void> {
    const { player } = this._speakerEntities();
    if (!player || (this._speakerVolumeDraft ?? this._speakerVolume()) <= 0) return;
    const saved = await this._saveSpeakerVolume(false);
    if (!saved) return;
    const features = Number(this._stateObject(player)?.attributes?.supported_features || 0);
    const data: Record<string, unknown> = {
      media_content_id: SPEAKER_TEST_SOUND,
      media_content_type: 'music',
    };
    if ((features & MEDIA_PLAYER_ANNOUNCE) !== 0) data.announce = true;
    const succeeded = await this._executeEntityService(player, 'media_player', 'play_media', data);
    if (succeeded) this._setEntityFeedback(player.entity_id, 'success', this._text('speaker.test_started'));
  }

  private _renderSpeakerCard() {
    const { player, volume } = this._speakerEntities();
    if (!player && !volume) return nothing;
    const playerState = this._stateObject(player);
    const volumeState = this._stateObject(volume);
    const features = Number(playerState?.attributes?.supported_features || 0);
    const canSetVolume = !!volume || !!player && ((features & MEDIA_PLAYER_VOLUME_SET) !== 0 || 'volume_level' in (playerState?.attributes || {}));
    const canPlay = !!player && (features & MEDIA_PLAYER_PLAY_MEDIA) !== 0;
    const current = this._speakerVolume();
    const draft = this._speakerVolumeDraft ?? current;
    const runningEntity = volume || player;
    const running = !!runningEntity && this._runningEntity === runningEntity.entity_id;
    const feedback = runningEntity ? this._entityFeedback[runningEntity.entity_id] : undefined;
    const unavailable = player ? this._isEntityUnavailable(player, playerState) : volume ? this._isEntityUnavailable(volume, volumeState) : true;

    return html`
      <section class="feature-card">
        <div class="feature-header">
          <div class="feature-heading speaker">
            <ha-icon icon="mdi:volume-high"></ha-icon>
            <div>
              <h2 class="feature-title">${this._text('speaker.title')}</h2>
              <p class="feature-description">${this._text('speaker.description')}</p>
            </div>
          </div>
        </div>
        <div class="speaker-body">
          <div class="speaker-volume">
            <div class="speaker-volume-head">
              <div>
                <div class="speaker-volume-label">
                  <ha-icon icon=${draft === 0 ? 'mdi:volume-off' : 'mdi:volume-medium'}></ha-icon>
                  <span>${this._text('speaker.volume')}</span>
                </div>
                <p class="speaker-volume-copy">${this._text(draft === 0 ? 'speaker.muted' : 'speaker.volume_description')}</p>
              </div>
              <output class="speaker-output">${draft}%</output>
            </div>
            <input class="range-input" type="range" min="0" max="100" step="5" .value=${String(draft)}
              ?disabled=${!canSetVolume || unavailable || running}
              aria-label=${this._text('speaker.volume')}
              @input=${(event: Event) => this._speakerVolumeDraft = Number((event.target as HTMLInputElement).value)} />
            <div class="range-labels" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
            <div class="speaker-actions">
              <button class="primary-button" ?disabled=${!canSetVolume || unavailable || running || draft === current}
                @click=${() => this._saveSpeakerVolume()}>${this._text(running ? 'action.applying' : 'speaker.save')}</button>
            </div>
          </div>
          ${canPlay ? html`
            <div class="test-sound">
              <div>
                <p class="test-title">${this._text('speaker.test_title')}</p>
                <p class="test-description">${this._text(draft === 0 ? 'speaker.test_muted' : 'speaker.test_description')}</p>
              </div>
              <button class="secondary-button" ?disabled=${unavailable || running || draft === 0}
                @click=${this._playSpeakerTest}><ha-icon icon="mdi:play-outline"></ha-icon> ${this._text('speaker.test')}</button>
            </div>
          ` : nothing}
          ${feedback ? html`
            <div class="setting-state ${feedback.tone}">
              <ha-icon icon=${feedback.tone === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}></ha-icon>
              <span>${feedback.text}</span>
            </div>` : nothing}
        </div>
      </section>`;
  }

  private _ledEntities(): Record<string, DeviceEntity | undefined> {
    return {
      master: this._findEntity('switch', /automatic[_ ]led[_ ]lighting/),
      motion: this._findEntity('switch', /motion[_ ]light/, /brightness/),
      motionBrightness: this._findEntity('number', /motion[_ ]light[_ ]brightness/),
      night: this._findEntity('switch', /night[_ ]light/, /brightness|start|end/),
      nightBrightness: this._findEntity('number', /night[_ ]light[_ ]brightness/),
      nightStart: this._findEntity('number', /night[_ ]light[_ ]start[_ ]hour/),
      nightEnd: this._findEntity('number', /night[_ ]light[_ ]end[_ ]hour/),
      co2: this._findEntity('switch', /co2[_ ]led[_ ]warning/),
      co2Warning: this._findEntity('number', /co2[_ ]warning[_ ]threshold/),
      co2Critical: this._findEntity('number', /co2[_ ]critical[_ ]threshold/),
      co2Cooldown: this._findEntity('number', /co2[_ ]alert[_ ]cooldown/),
      light: this._findEntity('light', /front[_ ]led|status[_ ]led/),
    };
  }

  private _renderLedOption(labelKey: string, entity?: DeviceEntity) {
    if (!entity) return nothing;
    return html`
      <div class="led-option">
        <label>${this._text(labelKey)}</label>
        <div class="setting-control">${this._renderControl(entity)}</div>
      </div>`;
  }

  private _renderLedBehaviour(
    style: string,
    icon: string,
    titleKey: string,
    descriptionKey: string,
    toggle?: DeviceEntity,
    options: Array<[string, DeviceEntity | undefined]> = [],
  ) {
    if (!toggle && options.every(([, entity]) => !entity)) return nothing;
    const isOn = toggle ? this._stateObject(toggle)?.state === 'on' : true;
    return html`
      <div class="led-row">
        <div class="led-row-main">
          <div class="led-row-label ${style}">
            <ha-icon icon=${icon}></ha-icon>
            <div>
              <div class="led-row-title">${this._text(titleKey)}</div>
              <div class="led-row-description">${this._text(descriptionKey)}</div>
            </div>
          </div>
          ${toggle ? html`<div class="setting-control">${this._renderControl(toggle)}</div>` : nothing}
        </div>
        ${isOn && options.some(([, entity]) => !!entity) ? html`
          <div class="led-options">${options.map(([label, entity]) => this._renderLedOption(label, entity))}</div>
        ` : nothing}
      </div>`;
  }

  private async _setManualLedBrightness(light: DeviceEntity): Promise<void> {
    const brightness = Math.round(this._ledBrightnessDraft ?? 100);
    await this._executeEntityService(light, 'light', 'turn_on', { brightness_pct: brightness });
  }

  private _renderLedCard() {
    const led = this._ledEntities();
    if (!led.master && !led.light) return nothing;
    const automatic = !!led.master;
    const masterState = this._stateObject(led.master)?.state;
    const lightState = this._stateObject(led.light);
    const lightOn = lightState?.state === 'on';
    const lightUnavailable = led.light ? this._isEntityUnavailable(led.light, lightState) : true;
    const lightRunning = !!led.light && this._runningEntity === led.light.entity_id;
    const brightness = this._ledBrightnessDraft ?? Math.round(Number(lightState?.attributes?.brightness ?? 255) / 255 * 100);
    return html`
      <section class="feature-card">
        <div class="feature-header">
          <div class="feature-heading led">
            <ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>
            <div>
              <h2 class="feature-title">${this._text('led.title')}</h2>
              <p class="feature-description">${this._text(automatic ? 'led.description' : 'led.manual_description')}</p>
            </div>
          </div>
          ${automatic && led.master ? html`<div class="setting-control">${this._renderControl(led.master)}</div>` : nothing}
        </div>
        ${automatic ? html`
          <div class="feature-status">
            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
            <div><strong>${this._text(masterState === 'on' ? 'led.active' : 'led.ready')}</strong>${this._text(masterState === 'on' ? 'led.active_description' : 'led.ready_description')}</div>
          </div>
          ${this._renderLedBehaviour('motion', 'mdi:motion-sensor', 'led.motion', 'led.motion_description', led.motion,
            [['led.brightness', led.motionBrightness]])}
          ${this._renderLedBehaviour('night', 'mdi:weather-night', 'led.night', 'led.night_description', led.night,
            [['led.brightness', led.nightBrightness], ['led.starts', led.nightStart], ['led.ends', led.nightEnd]])}
          ${this._renderLedBehaviour('co2', 'mdi:weather-windy', 'led.co2', 'led.co2_description', led.co2,
            [['led.warning', led.co2Warning], ['led.critical', led.co2Critical], ['led.repeat', led.co2Cooldown]])}
        ` : led.light ? html`
          <div class="feature-status warning">
            <ha-icon icon="mdi:information-outline"></ha-icon>
            <div><strong>${this._text('led.manual_only')}</strong>${this._text('led.manual_only_description')}</div>
          </div>
          <div class="led-row">
            <div class="led-row-main">
              <div class="led-row-label">
                <ha-icon icon="mdi:led-strip-variant"></ha-icon>
                <div>
                  <div class="led-row-title">${this._text('led.manual')}</div>
                  <div class="led-row-description">${this._text('led.manual_help')}</div>
                </div>
              </div>
              <button class="toggle ${lightOn ? 'on' : ''}" ?disabled=${lightUnavailable || lightRunning}
                aria-label=${this._text('led.manual')} aria-pressed=${lightOn ? 'true' : 'false'}
                @click=${() => this._executeEntityService(led.light!, 'light', lightOn ? 'turn_off' : 'turn_on')}></button>
            </div>
            ${lightOn ? html`
              <div class="led-options">
                <div class="led-option">
                  <label>${this._text('led.brightness')}</label>
                  <input class="range-input" type="range" min="1" max="100" step="1" .value=${String(brightness)}
                    ?disabled=${lightUnavailable || lightRunning} aria-label=${this._text('led.brightness')}
                    @input=${(event: Event) => this._ledBrightnessDraft = Number((event.target as HTMLInputElement).value)}
                    @change=${() => this._setManualLedBrightness(led.light!)} />
                  <span class="unit">${brightness}%</span>
                </div>
              </div>` : nothing}
          </div>
        ` : nothing}
      </section>`;
  }

  private _quietHoursEntity(
    key: 'enabled' | 'start_hour' | 'end_hour' | 'active' | 'pm_sensor' | 'idle_interval',
  ): DeviceEntity | undefined {
    const entityId = this._quietHours?.entities[key];
    return entityId ? this._entities.find(entity => entity.entity_id === entityId) : undefined;
  }

  private async _runQuietHoursUpdate(
    entity: DeviceEntity,
    domain: 'switch' | 'number',
    service: 'turn_on' | 'turn_off' | 'set_value',
    data: Record<string, unknown>,
    matchesExpectedState: (state: string) => boolean,
  ): Promise<void> {
    if (this._quietHoursPending) return;
    this._quietHoursPending = entity.entity_id;
    this._quietHoursError = '';
    try {
      await performConfirmedEntityUpdate(
        () => this.hass.callService(domain, service, { entity_id: entity.entity_id, ...data }),
        () => this.hass.states[entity.entity_id],
        matchesExpectedState,
      );
    } catch (error) {
      console.error(`Failed to update SPS30 Quiet Hours entity ${entity.entity_id}:`, error);
      this._quietHoursError = this._text(
        error instanceof QuietHoursUpdateError && error.kind === 'timeout'
          ? 'quiet.error.timeout'
          : 'quiet.error.service',
      );
    } finally {
      this._quietHoursPending = undefined;
    }
  }

  private _setQuietHoursEnabled(entity: DeviceEntity, enabled: boolean): void {
    void this._runQuietHoursUpdate(
      entity,
      'switch',
      enabled ? 'turn_on' : 'turn_off',
      {},
      state => state === (enabled ? 'on' : 'off'),
    );
  }

  private _setQuietHour(entity: DeviceEntity, value: string): void {
    const hour = parseQuietHour(value);
    if (hour === null) {
      this._quietHoursError = this._text('quiet.error.invalid_hour');
      return;
    }
    void this._runQuietHoursUpdate(
      entity,
      'number',
      'set_value',
      { value: hour },
      state => parseQuietHour(state) === hour,
    );
  }

  private _setSps30IdleInterval(entity: DeviceEntity, value: string): void {
    const minutes = parseSps30IdleInterval(value);
    if (minutes === null || !SPS30_IDLE_INTERVAL_CHOICES.includes(minutes)) {
      this._quietHoursError = this._text('quiet.error.invalid_interval');
      return;
    }
    void this._runQuietHoursUpdate(
      entity,
      'number',
      'set_value',
      { value: minutes },
      state => parseSps30IdleInterval(state) === minutes,
    );
  }

  private _renderQuietHoursCard() {
    const capability = this._quietHours;
    if (!capability || !shouldRenderQuietHours(capability.status)) return nothing;

    if (capability.status === 'partial') {
      return html`
        <section class="feature-card quiet-upgrade">
          <div class="feature-header">
            <div class="feature-heading quiet">
              <ha-icon icon="mdi:weather-night"></ha-icon>
              <div>
                <h2 class="feature-title">${this._text('quiet.title')}</h2>
                <p class="feature-description">${this._text('quiet.description')}</p>
              </div>
            </div>
          </div>
          <div class="feature-status warning">
            <ha-icon icon="mdi:update"></ha-icon>
            <div>
              <strong>${this._text('quiet.firmware_required')}</strong>
              ${this._text('quiet.firmware_required_description')}
            </div>
          </div>
        </section>`;
    }

    const enabledEntity = this._quietHoursEntity('enabled');
    const startEntity = this._quietHoursEntity('start_hour');
    const endEntity = this._quietHoursEntity('end_hour');
    const activeEntity = this._quietHoursEntity('active');
    const pmEntity = this._quietHoursEntity('pm_sensor');
    const idleEntity = this._quietHoursEntity('idle_interval');
    if (!enabledEntity || !startEntity || !endEntity || !activeEntity) return nothing;

    const enabledState = this._stateObject(enabledEntity);
    const startState = this._stateObject(startEntity);
    const endState = this._stateObject(endEntity);
    const activeState = this._stateObject(activeEntity);
    const pmState = this._stateObject(pmEntity);
    const requiredStatuses = [enabledState, startState, endState, activeState].map(quietHoursEntityStatus);
    const unavailable = requiredStatuses.some(status => status === 'missing' || status === 'unavailable');
    const enabled = enabledState?.state === 'on';
    const active = activeState?.state === 'on';
    const activeKnown = activeState?.state === 'on' || activeState?.state === 'off';
    const startHour = parseQuietHour(startState?.state);
    const endHour = parseQuietHour(endState?.state);
    const unknown = requiredStatuses.some(status => status === 'unknown')
      || startHour === null
      || endHour === null;
    const allDay = isQuietScheduleAllDay(startHour, endHour);
    const loading = !!this._quietHoursPending;
    const selectorsDisabled = !enabled || unavailable || unknown || loading;
    const idleAvailability = sps30IdleIntervalAvailability(capability.status, !!idleEntity);
    const idleState = this._stateObject(idleEntity);
    const idleStatus = quietHoursEntityStatus(idleState);
    const idlePresentation = sps30IdleIntervalPresentation(idleState?.state, active);
    const idleMinutes = idlePresentation.configuredMinutes;
    const idleUnavailable = idleStatus === 'missing' || idleStatus === 'unavailable';
    const idleUnknown = idleStatus === 'unknown' || idleMinutes === null;
    const idleDisabled = idleUnavailable || idleUnknown || loading;
    const idleIsFriendlyChoice = idleMinutes !== null
      && SPS30_IDLE_INTERVAL_CHOICES.includes(idleMinutes);

    let pmKey = 'quiet.pm_unknown';
    let pmTone = 'attention';
    let pmIcon = 'mdi:air-filter';
    if (pmState?.state === 'off') {
      pmKey = 'quiet.pm_off';
      pmIcon = 'mdi:air-filter-remove';
    } else if (pmState?.state === 'on' && active) {
      pmKey = 'quiet.pm_paused';
      pmIcon = 'mdi:fan-off';
      pmTone = 'active';
    } else if (pmState?.state === 'on') {
      pmKey = 'quiet.pm_running';
      pmIcon = 'mdi:fan';
      pmTone = 'ready';
    }

    return html`
      <section class="feature-card">
        <div class="feature-header">
          <div class="feature-heading quiet">
            <ha-icon icon="mdi:weather-night"></ha-icon>
            <div>
              <h2 class="feature-title">${this._text('quiet.title')}</h2>
              <p class="feature-description">${this._text('quiet.description')}</p>
            </div>
          </div>
        </div>
        <div class="quiet-summary">
          <div class="quiet-summary-copy">
            <div class="quiet-summary-title">${this._text('quiet.enabled')}</div>
            <div class="quiet-summary-description">${this._text('quiet.enabled_description')}</div>
          </div>
          <button
            class="toggle quiet-toggle ${enabled ? 'on' : ''}"
            type="button"
            role="switch"
            aria-label=${this._text('quiet.enabled')}
            aria-checked=${enabled ? 'true' : 'false'}
            ?disabled=${unavailable || unknown || loading}
            @click=${() => this._setQuietHoursEnabled(enabledEntity, !enabled)}
          ></button>
        </div>
        <div class="quiet-controls">
          <div class="quiet-field">
            <label for="quiet-start-hour">${this._text('quiet.start')}</label>
            <select id="quiet-start-hour" aria-label=${this._text('quiet.start')}
              ?disabled=${selectorsDisabled}
              @change=${(event: Event) => this._setQuietHour(startEntity, (event.target as HTMLSelectElement).value)}>
              ${startHour === null ? html`<option value="" selected>—</option>` : nothing}
              ${QUIET_HOUR_VALUES.map(hour => html`
                <option value=${String(hour)} ?selected=${hour === startHour}>${formatQuietHour(hour)}</option>
              `)}
            </select>
          </div>
          <div class="quiet-field">
            <label for="quiet-end-hour">${this._text('quiet.end')}</label>
            <select id="quiet-end-hour" aria-label=${this._text('quiet.end')}
              ?disabled=${selectorsDisabled}
              @change=${(event: Event) => this._setQuietHour(endEntity, (event.target as HTMLSelectElement).value)}>
              ${endHour === null ? html`<option value="" selected>—</option>` : nothing}
              ${QUIET_HOUR_VALUES.map(hour => html`
                <option value=${String(hour)} ?selected=${hour === endHour}>${formatQuietHour(hour)}</option>
              `)}
            </select>
          </div>
        </div>
        ${idleAvailability === 'firmware_update' ? html`
          <div class="quiet-idle">
            <div class="feature-status warning quiet-idle-upgrade">
              <ha-icon icon="mdi:update"></ha-icon>
              <div>
                <strong>${this._text('quiet.idle.firmware_required')}</strong>
                ${this._text('quiet.idle.firmware_required_description')}
              </div>
            </div>
          </div>
        ` : idleAvailability === 'control' && idleEntity ? html`
          <div class="quiet-idle">
            <div class="quiet-idle-layout">
              <div class="quiet-idle-copy">
                <span class="quiet-idle-title" id="sps30-idle-title">${this._text('quiet.idle.label')}</span>
                <p class="quiet-idle-description" id="sps30-idle-description">${this._text('quiet.idle.description')}</p>
              </div>
              <div class="quiet-idle-select">
                <label for="sps30-idle-interval">${this._text('quiet.idle.label')}</label>
                <select
                  id="sps30-idle-interval"
                  aria-labelledby="sps30-idle-title"
                  aria-describedby="sps30-idle-description sps30-idle-recommendation"
                  ?disabled=${idleDisabled}
                  @change=${(event: Event) => this._setSps30IdleInterval(
                    idleEntity,
                    (event.target as HTMLSelectElement).value,
                  )}
                >
                  ${idleMinutes === null ? html`<option value="" selected>—</option>` : nothing}
                  ${idleMinutes !== null && !idleIsFriendlyChoice ? html`
                    <option value=${String(idleMinutes)} selected>
                      ${this._text('quiet.idle.current', { minutes: idleMinutes })}
                    </option>
                  ` : nothing}
                  ${SPS30_IDLE_INTERVAL_CHOICES.map(minutes => html`
                    <option value=${String(minutes)} ?selected=${minutes === idleMinutes}>
                      ${minutes === 0
                        ? this._text('quiet.idle.continuous')
                        : this._text('quiet.idle.minutes', { minutes })}
                    </option>
                  `)}
                </select>
              </div>
            </div>
            <div class="quiet-idle-note" id="sps30-idle-recommendation">
              <ha-icon icon="mdi:lightbulb-outline"></ha-icon>
              <span>${this._text('quiet.idle.recommendation')}</span>
            </div>
            ${idlePresentation.temporarilyOverridden ? html`
              <div class="quiet-idle-note override" role="status">
                <ha-icon icon="mdi:weather-night"></ha-icon>
                <span>${this._text('quiet.idle.override')}</span>
              </div>
            ` : nothing}
            ${idleUnavailable || idleUnknown ? html`
              <div class="quiet-error" role="status">
                <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
                <span>${this._text(idleUnavailable ? 'quiet.idle.unavailable' : 'quiet.idle.unknown')}</span>
              </div>
            ` : nothing}
          </div>
        ` : nothing}
        <div class="quiet-state-row" aria-live="polite">
          <span class="quiet-state ${active ? 'active' : ''}">
            <ha-icon icon=${!activeKnown ? 'mdi:help-circle-outline' : active ? 'mdi:weather-night' : 'mdi:weather-sunny'}></ha-icon>
            ${this._text(!activeKnown ? 'quiet.status_unknown' : active ? 'quiet.active' : 'quiet.inactive')}
          </span>
          ${pmEntity ? html`
            <span class="quiet-state ${pmTone}">
              <ha-icon icon=${pmIcon}></ha-icon>
              ${this._text(pmKey)}
            </span>
          ` : nothing}
          ${loading ? html`
            <span class="quiet-state">
              <ha-circular-progress active></ha-circular-progress>
              ${this._text('quiet.saving')}
            </span>
          ` : nothing}
        </div>
        ${unavailable || unknown ? html`
          <div class="quiet-error" role="status">
            <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
            <span>${this._text(unavailable ? 'quiet.unavailable' : 'quiet.unknown')}</span>
          </div>
        ` : nothing}
        ${this._quietHoursError ? html`
          <div class="quiet-error" role="alert">
            <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
            <span>${this._quietHoursError}</span>
          </div>
        ` : nothing}
        <div class="quiet-note ${allDay ? 'equal' : ''}">
          <ha-icon icon=${allDay ? 'mdi:hours-24' : 'mdi:information-outline'}></ha-icon>
          <span>${this._text(allDay ? 'quiet.equal_active' : 'quiet.equal_note')}</span>
        </div>
      </section>`;
  }

  private _specialEntityIds(): Set<string> {
    const ids = new Set<string>();
    for (const channel of this._calibrationChannels()) ids.add(channel.offset.entity_id);
    const speaker = this._speakerEntities();
    if (speaker.volume) ids.add(speaker.volume.entity_id);
    for (const entity of Object.values(this._ledEntities())) {
      if (entity) ids.add(entity.entity_id);
    }
    for (const key of ['enabled', 'start_hour', 'end_hour', 'idle_interval'] as const) {
      const entity = this._quietHoursEntity(key);
      if (entity) ids.add(entity.entity_id);
    }
    return ids;
  }

  private _renderFeatureCards() {
    const cards = [
      this._renderCalibrationCard(),
      this._renderQuietHoursCard(),
      this._renderSpeakerCard(),
      this._renderLedCard(),
    ];
    return html`<div class="feature-stack">${cards}</div>`;
  }

  private _groupEntities(): Map<string, DeviceEntity[]> {
    const filter = this._filter.trim().toLowerCase();
    const grouped = new Map<string, DeviceEntity[]>();
    for (const group of GROUPS) grouped.set(group.key, []);

    const specialEntityIds = this._specialEntityIds();
    for (const entity of this._entities) {
      if (!['number', 'select', 'switch', 'button'].includes(entity.domain)) continue;
      if (specialEntityIds.has(entity.entity_id)) continue;
      const haystack = `${entity.name} ${entity.entity_id}`;
      if (filter && !haystack.toLowerCase().includes(filter)) continue;
      const group = GROUPS.find(g => g.match.test(haystack))!;
      grouped.get(group.key)!.push(entity);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return grouped;
  }

  private _text(key: string, variables: Record<string, string | number> = {}): string {
    return settingsText(this.hass, key, variables);
  }

  private _descriptionKey(entity: DeviceEntity): string {
    const value = `${entity.name} ${entity.entity_id}`.toLowerCase();
    if (value.includes('cloud_voice_start') || value.includes('cloud voice start')) return 'desc.cloud_voice_start';
    if (value.includes('cloud_voice') || value.includes('cloud voice')) return 'desc.cloud_voice';
    if (value.includes('boot_sound') || value.includes('boot sound')) return 'desc.boot_sound';
    if (value.includes('co2_manual_calibration') || value.includes('co2 manual calibration')) return 'desc.co2_calibration';
    if (value.includes('pm_sensor') || value.includes('pm sensor')) return 'desc.pm_sensor';
    if (value.includes('sps30_idle') || value.includes('sps30 idle')) return 'desc.sps_idle';
    if (value.includes('sps30_update') || value.includes('sps30 update')) return 'desc.sps_update';
    if (value.includes('temperature_offset') || value.includes('temperature offset')) return 'desc.temperature_offset';
    if (value.includes('humidity_offset') || value.includes('humidity offset')) return 'desc.humidity_offset';
    if (value.includes('occupancy_off_delay') || value.includes('occupancy off delay')) return 'desc.occupancy_delay';
    if (value.includes('tracking_presence_timeout') || value.includes('tracking presence timeout')) return 'desc.tracking_timeout';
    if (value.includes('installation_height') || value.includes('installation height')) return 'desc.ld2460_installation_height';
    if (value.includes('installation_angle') || value.includes('installation angle')) return 'desc.ld2460_installation_angle';
    if (value.includes('installation_mode') || value.includes('installation mode')) return 'desc.ld2460_installation_mode';
    if (value.includes('engineering_mode') || value.includes('engineering mode')) return 'desc.engineering';
    if (value.includes('bluetooth')) return 'desc.radar_bluetooth';
    if (value.includes('distance_resolution') || value.includes('distance resolution')) return 'desc.distance_resolution';
    if (value.includes('light_function') || value.includes('light function')) return 'desc.light_function';
    if (value.includes('light_threshold') || value.includes('light threshold')) return 'desc.light_threshold';
    if (value.includes('output_pin_level') || value.includes('output pin level')) return 'desc.output_pin';
    if (value.includes('minimum_distance_gate') || value.includes('minimum distance gate')) return 'desc.minimum_gate';
    if (value.includes('maximum_distance_gate') || value.includes('maximum distance gate')) return 'desc.maximum_gate';
    if (value.includes('presence_timeout') || value.includes('presence timeout')) return 'desc.presence_timeout';
    if (value.includes('dynamic_background_correction') || value.includes('dynamic background correction')) return 'desc.background';
    if (value.includes('query_parameters') || value.includes('query parameters')) return 'desc.query';
    if (value.includes('factory_reset') || value.includes('factory reset')) {
      return /ld24(12|50|60)/.test(value) ? 'desc.radar_reset' : 'desc.device_reset';
    }
    if (value.includes('restart_in_safe_mode') || value.includes('restart in safe mode')) return 'desc.safe_mode';
    if (value.includes('restart')) return /ld24(12|50|60)/.test(value) ? 'desc.radar_restart' : 'desc.device_restart';
    if (value.includes('multi_target') || value.includes('multi target')) return 'desc.multi_target';
    if (value.includes('reset_people_count') || value.includes('reset people count')) return 'desc.people_reset';
    if (value.includes('polygon_zones_enabled') || value.includes('polygon zones enabled')) return 'desc.polygon';
    if (/zone[_ ]\d+[_ ][xy][12]/.test(value)) return 'desc.zone_coordinate';
    if (value.includes('firmware_variant') || value.includes('firmware variant')) return 'desc.firmware_variant';
    if (value.includes('reset_cloud') || value.includes('reset cloud')) return 'desc.reset_cloud';
    if (entity.domain === 'switch') return 'desc.switch';
    if (entity.domain === 'number') return 'desc.number';
    if (entity.domain === 'select') return 'desc.select';
    return 'desc.button';
  }

  private _confirmationPolicy(entity: DeviceEntity, service: string): ConfirmationPolicy | null {
    const value = `${entity.name} ${entity.entity_id}`.toLowerCase();
    if ((value.includes('engineering_mode') || value.includes('engineering mode')) && service === 'turn_on') {
      return { titleKey: 'confirm.engineering.title', bodyKey: 'confirm.engineering.body', actionKey: 'confirm.engineering.action' };
    }
    if (value.includes('co2_manual_calibration') || value.includes('co2 manual calibration')) {
      return { titleKey: 'confirm.co2.title', bodyKey: 'confirm.co2.body', actionKey: 'confirm.co2.action' };
    }
    if (value.includes('dynamic_background_correction') || value.includes('dynamic background correction')) {
      return { titleKey: 'confirm.background.title', bodyKey: 'confirm.background.body', actionKey: 'confirm.background.action' };
    }
    if (value.includes('factory_reset') || value.includes('factory reset')) {
      if (/ld24(12|50|60)/.test(value)) {
        return { titleKey: 'confirm.radar_reset.title', bodyKey: 'confirm.radar_reset.body', actionKey: 'confirm.radar_reset.action', danger: true };
      }
      return { titleKey: 'confirm.device_reset.title', bodyKey: 'confirm.device_reset.body', actionKey: 'confirm.device_reset.action', danger: true };
    }
    if (value.includes('restart_in_safe_mode') || value.includes('restart in safe mode')) {
      return { titleKey: 'confirm.safe_mode.title', bodyKey: 'confirm.safe_mode.body', actionKey: 'confirm.safe_mode.action' };
    }
    if (value.includes('restart')) {
      return { titleKey: 'confirm.restart.title', bodyKey: 'confirm.restart.body', actionKey: 'confirm.restart.action' };
    }
    if (value.includes('reset_cloud') || value.includes('reset cloud')) {
      return { titleKey: 'confirm.reset_cloud.title', bodyKey: 'confirm.reset_cloud.body', actionKey: 'confirm.reset_cloud.action', danger: true };
    }
    if (value.includes('reset_people_count') || value.includes('reset people count')) {
      return { titleKey: 'confirm.people.title', bodyKey: 'confirm.people.body', actionKey: 'confirm.people.action' };
    }
    return null;
  }

  private _setEntityFeedback(entityId: string, tone: 'success' | 'error', text: string): void {
    this._entityFeedback = { ...this._entityFeedback, [entityId]: { tone, text } };
  }

  private async _enableEntity(entity: DeviceEntity): Promise<void> {
    if (!this._selectedDevice || !this.hass.user?.is_admin || this._enablingEntities.has(entity.entity_id)) return;
    const feedback = { ...this._entityFeedback };
    delete feedback[entity.entity_id];
    this._entityFeedback = feedback;
    this._enablingEntities = new Set([...this._enablingEntities, entity.entity_id]);
    try {
      await this.hass.callWS({
        type: 'smarthomeshop/device/entity/enable',
        device_id: this._selectedDevice.id,
        entity_id: entity.entity_id,
      });
      await this._loadEntities(this._selectedDevice.id);
      this._setEntityFeedback(entity.entity_id, 'success', this._text('status.enabled'));
    } catch (err) {
      console.error('Failed to enable entity:', err);
      this._setEntityFeedback(entity.entity_id, 'error', this._text('error.enable'));
    } finally {
      const enabling = new Set(this._enablingEntities);
      enabling.delete(entity.entity_id);
      this._enablingEntities = enabling;
    }
  }

  private async _executeEntityService(
    entity: DeviceEntity,
    domain: string,
    service: string,
    data: Record<string, unknown> = {},
  ): Promise<boolean> {
    if (this._runningEntity === entity.entity_id) return false;
    this._runningEntity = entity.entity_id;
    try {
      await this.hass.callService(domain, service, { entity_id: entity.entity_id, ...data });
      return true;
    } catch (err) {
      console.error(`Failed to run ${domain}.${service}:`, err);
      this._setEntityFeedback(entity.entity_id, 'error', this._text('error.run'));
      return false;
    } finally {
      this._runningEntity = null;
    }
  }

  private _requestEntityAction(
    entity: DeviceEntity,
    domain: string,
    service: string,
    data: Record<string, unknown> = {},
  ): void {
    const policy = this._confirmationPolicy(entity, service);
    if (policy) {
      this._pendingEntityAction = { entity, domain, service, data, policy };
      return;
    }
    void this._executeEntityService(entity, domain, service, data);
  }

  private async _confirmEntityAction(): Promise<void> {
    const pending = this._pendingEntityAction;
    if (!pending) return;
    const succeeded = await this._executeEntityService(
      pending.entity, pending.domain, pending.service, pending.data,
    );
    if (!succeeded) return;
    this._pendingEntityAction = undefined;
    if (pending.policy.titleKey === 'confirm.background.title') {
      this._startBackgroundCorrectionProgress(pending.entity);
    }
  }

  private _backgroundCorrectionStatusEntity(): DeviceEntity | undefined {
    return this._entities.find(entity => {
      if (entity.domain !== 'binary_sensor' || entity.disabled_by) return false;
      const value = `${entity.name} ${entity.entity_id}`.toLowerCase();
      return value.includes('dynamic_background_correction')
        || value.includes('dynamic background correction');
    });
  }

  private _backgroundCorrectionStatus(statusEntityId?: string): string | undefined {
    if (!statusEntityId) return undefined;
    return this.hass.states[statusEntityId]?.state
      ?? this._entities.find(entity => entity.entity_id === statusEntityId)?.state;
  }

  private _stopBackgroundCorrectionTimer(): void {
    if (this._backgroundCorrectionTimer !== undefined) {
      window.clearInterval(this._backgroundCorrectionTimer);
      this._backgroundCorrectionTimer = undefined;
    }
  }

  private _closeBackgroundCorrectionProgress(): void {
    this._stopBackgroundCorrectionTimer();
    this._backgroundCorrection = undefined;
  }

  private _startBackgroundCorrectionProgress(button: DeviceEntity): void {
    this._stopBackgroundCorrectionTimer();
    const statusEntity = this._backgroundCorrectionStatusEntity();
    const status = this._backgroundCorrectionStatus(statusEntity?.entity_id);
    this._backgroundCorrection = {
      buttonEntityId: button.entity_id,
      statusEntityId: statusEntity?.entity_id,
      secondsRemaining: 10,
      sawActiveStatus: status === 'on',
      phase: 'leaving',
    };
    this._backgroundCorrectionTimer = window.setInterval(() => this._tickBackgroundCorrection(), 1000);
  }

  private _tickBackgroundCorrection(): void {
    const progress = this._backgroundCorrection;
    if (!progress) {
      this._stopBackgroundCorrectionTimer();
      return;
    }

    const status = this._backgroundCorrectionStatus(progress.statusEntityId);
    const sawActiveStatus = progress.sawActiveStatus || status === 'on';
    const secondsRemaining = Math.max(0, progress.secondsRemaining - 1);
    let phase: BackgroundCorrectionPhase = secondsRemaining > 0 ? 'leaving' : 'calibrating';

    if (secondsRemaining === 0) {
      if (!progress.statusEntityId || status === undefined || status === 'unknown' || status === 'unavailable') {
        phase = 'untracked';
      } else if (sawActiveStatus && status === 'off') {
        phase = 'complete';
      }
    }

    this._backgroundCorrection = { ...progress, secondsRemaining, sawActiveStatus, phase };
    if (phase === 'complete' || phase === 'untracked') this._stopBackgroundCorrectionTimer();
    if (phase === 'complete') {
      this._setEntityFeedback(progress.buttonEntityId, 'success', this._text('background.complete.feedback'));
    }
  }

  private _renderConfirmation() {
    const pending = this._pendingEntityAction;
    if (!pending) return nothing;
    const running = this._runningEntity === pending.entity.entity_id;
    return html`
      <div class="confirm-backdrop" role="presentation"
        @click=${(event: MouseEvent) => {
          if (event.target === event.currentTarget && !running) this._pendingEntityAction = undefined;
        }}
        @keydown=${(event: KeyboardEvent) => {
          if (event.key === 'Escape' && !running) this._pendingEntityAction = undefined;
        }}>
        <section class="confirm-dialog ${pending.policy.danger ? 'danger' : ''}"
          role="alertdialog" aria-modal="true" aria-labelledby="entity-confirm-title" tabindex="-1">
          <div class="confirm-copy">
            <div class="confirm-icon">
              <ha-icon icon=${pending.policy.danger ? 'mdi:alert-octagon-outline' : 'mdi:shield-alert-outline'}></ha-icon>
            </div>
            <div>
              <h2 id="entity-confirm-title" class="confirm-title">${this._text(pending.policy.titleKey)}</h2>
              <p class="confirm-body">${this._text(pending.policy.bodyKey)}</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="confirm-cancel" ?disabled=${running}
              @click=${() => this._pendingEntityAction = undefined}>${this._text('action.cancel')}</button>
            <button class="confirm-accept" ?disabled=${running}
              @click=${this._confirmEntityAction}>${this._text(pending.policy.actionKey)}</button>
          </div>
        </section>
      </div>`;
  }

  private _renderBackgroundCorrectionProgress() {
    const progress = this._backgroundCorrection;
    if (!progress) return nothing;

    const leaving = progress.phase === 'leaving';
    const calibrating = progress.phase === 'calibrating';
    const complete = progress.phase === 'complete';
    const titleKey = leaving
      ? 'background.leave.title'
      : calibrating
        ? 'background.calibrating.title'
        : complete
          ? 'background.complete.title'
          : 'background.untracked.title';
    const bodyKey = leaving
      ? 'background.leave.body'
      : calibrating
        ? 'background.calibrating.body'
        : complete
          ? 'background.complete.body'
          : 'background.untracked.body';

    return html`
      <div class="confirm-backdrop" role="presentation">
        <section class="confirm-dialog correction-dialog ${progress.phase}"
          role="alertdialog" aria-modal="true" aria-labelledby="background-correction-title" tabindex="-1">
          <div class="confirm-copy">
            <div class="confirm-icon" aria-hidden="true">
              ${leaving
                ? html`<span class="correction-countdown">${progress.secondsRemaining}</span>`
                : calibrating
                  ? html`<ha-circular-progress active></ha-circular-progress>`
                  : html`<ha-icon icon=${complete ? 'mdi:check-bold' : 'mdi:progress-alert'}></ha-icon>`}
            </div>
            <div>
              <h2 id="background-correction-title" class="confirm-title">${this._text(titleKey)}</h2>
              <p class="confirm-body">${this._text(bodyKey, { seconds: progress.secondsRemaining })}</p>
            </div>
          </div>
          ${leaving ? nothing : html`
            <div class="confirm-actions">
              <button class="confirm-cancel" @click=${this._closeBackgroundCorrectionProgress}>
                ${this._text('action.close')}
              </button>
            </div>`}
        </section>
      </div>`;
  }

  private _isEntityUnavailable(entity: DeviceEntity, stateObj: { state: string } | undefined): boolean {
    if (entity.disabled_by) return false;
    // Home Assistant buttons are stateless actions. Some ESPHome buttons have
    // no state object until their first press, which must not make a valid
    // action look offline. An explicit unavailable state remains authoritative.
    if (entity.domain === 'button') return stateObj?.state === 'unavailable';
    return !stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown';
  }

  private _renderControl(entity: DeviceEntity) {
    const stateObj = this.hass.states[entity.entity_id];
    const state = stateObj?.state;
    const attrs = (stateObj?.attributes || {}) as Record<string, unknown>;
    const unavailable = this._isEntityUnavailable(entity, stateObj);
    const running = this._runningEntity === entity.entity_id;

    if (entity.disabled_by) {
      const enabling = this._enablingEntities.has(entity.entity_id);
      const isAdmin = !!this.hass.user?.is_admin;
      return html`
        <button class="enable-btn" ?disabled=${!isAdmin || enabling}
          title=${isAdmin ? this._text('action.enable') : this._text('admin.only')}
          @click=${() => this._enableEntity(entity)}>
          <ha-icon icon=${enabling ? 'mdi:loading' : 'mdi:lock-open-outline'}></ha-icon>
          ${this._text(enabling ? 'action.enabling' : 'action.enable')}
        </button>`;
    }

    if (entity.domain === 'switch') {
      const isOn = state === 'on';
      return html`
        <button class="toggle ${isOn ? 'on' : ''}" ?disabled=${unavailable || running}
          aria-label=${entity.name} aria-pressed=${isOn ? 'true' : 'false'}
          @click=${() => this._requestEntityAction(entity, 'switch', isOn ? 'turn_off' : 'turn_on')}></button>
      `;
    }

    if (entity.domain === 'select') {
      const options = (attrs.options as string[]) || [];
      return html`
        <select ?disabled=${unavailable}
          @change=${(e: Event) => void this._executeEntityService(entity, 'select', 'select_option', { option: (e.target as HTMLSelectElement).value })}>
          ${options.map(opt => html`<option value=${opt} ?selected=${opt === state}>${opt}</option>`)}
        </select>
      `;
    }

    if (entity.domain === 'number') {
      const unit = attrs.unit_of_measurement as string | undefined;
      return html`
        <input type="number" .value=${unavailable ? '' : String(state)}
          min=${(attrs.min as number) ?? nothing} max=${(attrs.max as number) ?? nothing} step=${(attrs.step as number) ?? nothing}
          ?disabled=${unavailable || running}
          @change=${(e: Event) => {
            const value = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(value)) void this._executeEntityService(entity, 'number', 'set_value', { value });
          }}/>
        ${unit ? html`<span class="unit">${unit}</span>` : nothing}
      `;
    }

    if (entity.domain === 'button') {
      return html`
        <button class="press-btn" ?disabled=${unavailable || running}
          @click=${() => this._requestEntityAction(entity, 'button', 'press')}>${this._text('action.run')}</button>
      `;
    }

    return html`<span class="unit">${state ?? '-'}</span>`;
  }

  private _renderGroup(group: SettingGroup, entities: DeviceEntity[]) {
    if (entities.length === 0) return nothing;
    const expanded = this._expandedGroups.has(group.key) || this._filter.trim().length > 0;
    const visible = expanded ? entities : entities.slice(0, COLLAPSE_THRESHOLD);
    const hidden = entities.length - visible.length;

    return html`
      <div class="settings-group">
        <div class="group-header">
          <ha-icon icon=${group.icon}></ha-icon>
          <span class="group-title">${this._text(group.titleKey)}</span>
          <span class="group-count">${entities.length}</span>
        </div>
        ${visible.map(entity => {
          const stateObj = this.hass.states[entity.entity_id];
          const registryDisabled = !!entity.disabled_by;
          const unavailable = this._isEntityUnavailable(entity, stateObj);
          const feedback = this._entityFeedback[entity.entity_id];
          return html`
            <div class="setting-item ${registryDisabled ? 'registry-disabled' : ''} ${unavailable ? 'unavailable' : ''}">
              <div class="setting-info">
                <div class="setting-name">${entity.name}</div>
                <div class="setting-description">${this._text(this._descriptionKey(entity))}</div>
                <div class="setting-entity">${entity.entity_id}</div>
                ${registryDisabled ? html`
                  <div class="setting-state disabled">
                    <ha-icon icon="mdi:lock-outline"></ha-icon>
                    <span><strong>${this._text('status.disabled')}</strong> · ${this._text(entity.disabled_by === 'integration' ? 'status.disabled.integration' : 'status.disabled.user')}</span>
                  </div>` : nothing}
                ${unavailable ? html`
                  <div class="setting-state error">
                    <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
                    <span>${this._text('status.unavailable')}</span>
                  </div>` : nothing}
                ${registryDisabled && !this.hass.user?.is_admin ? html`
                  <div class="setting-state">
                    <ha-icon icon="mdi:account-lock-outline"></ha-icon>
                    <span>${this._text('admin.only')}</span>
                  </div>` : nothing}
                ${feedback ? html`
                  <div class="setting-state ${feedback.tone}">
                    <ha-icon icon=${feedback.tone === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}></ha-icon>
                    <span>${feedback.text}</span>
                  </div>` : nothing}
              </div>
              <div class="setting-control">${this._renderControl(entity)}</div>
            </div>
          `;
        })}
        ${hidden > 0 ? html`
          <button class="show-all" @click=${() => { this._expandedGroups = new Set([...this._expandedGroups, group.key]); }}>
            ${settingsText(this.hass, 'show.more', { count: hidden })}
          </button>
        ` : nothing}
      </div>
    `;
  }

  private _renderAdvancedSettings(grouped: Map<string, DeviceEntity[]>) {
    const total = Array.from(grouped.values()).reduce((sum, entities) => sum + entities.length, 0);
    if (total === 0) return nothing;
    return html`
      <div class="advanced-intro">
        <ha-icon icon="mdi:tune-variant"></ha-icon>
        <div>
          <h2 class="advanced-title">${this._text('advanced.title')}</h2>
          <p class="advanced-description">${this._text('advanced.description')}</p>
        </div>
      </div>
      <input type="search" class="search-box" placeholder=${this._text('search.placeholder')}
        .value=${this._filter}
        @input=${(e: Event) => this._filter = (e.target as HTMLInputElement).value} />
      ${GROUPS.map(group => this._renderGroup(group, grouped.get(group.key) || []))}
    `;
  }

  protected render() {
    if (this._loading) {
      return html`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;
    }

    const grouped = this._selectedDevice ? this._groupEntities() : null;

    if (this.embedded) {
      return html`
        ${this._renderConfigCard()}
        ${this._selectedDevice && grouped ? html`
          ${this._renderFeatureCards()}
          ${this._renderAdvancedSettings(grouped)}
        ` : html`
          <div class="empty-state">
            <ha-icon icon="mdi:tune"></ha-icon>
            <h3>${this._text('empty.settings.title')}</h3>
            <p>${this._text('empty.settings.body')}</p>
          </div>
        `}
        ${this._renderConfirmation()}
        ${this._renderBackgroundCorrectionProgress()}
      `;
    }

    return html`
      <div class="page-header">
        <h1 class="page-title">${this._text('page.device_settings')}</h1>
        ${this._selectedDevice ? html`
          <a class="ha-link" href="/config/devices/device/${this._selectedDevice.id}">
            ${this._text('page.open_ha')}
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
        ` : nothing}
      </div>
      <div class="settings-layout">
        <div class="panel">
          <h3 class="panel-title">${this._text('page.devices')}</h3>
          <div class="device-list">
            ${this._devices.length === 0 ? html`
              <p class="device-type">${this._text('page.no_devices')}</p>
            ` : this._devices.map(device => html`
              <div class="device-item ${this._selectedDevice?.id === device.id ? 'selected' : ''}" @click=${() => this._selectDevice(device)}>
                <div class="device-icon"><ha-icon icon="mdi:radar"></ha-icon></div>
                <div>
                  <div class="device-name" data-i18n-ignore>${device.name}</div>
                  <div class="device-type" data-i18n-ignore>${device.product_name}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
        <div>
          ${this._selectedDevice && grouped ? html`
            ${this._renderFeatureCards()}
            ${this._renderAdvancedSettings(grouped)}
          ` : html`
            <div class="empty-state">
              <ha-icon icon="mdi:radar"></ha-icon>
              <h3>${this._text('empty.device.title')}</h3>
              <p>${this._text('empty.device.body')}</p>
            </div>
          `}
        </div>
        ${this._renderConfirmation()}
        ${this._renderBackgroundCorrectionProgress()}
      </div>
    `;
  }
}

// Home Assistant can load a custom panel bundle more than once after a panel
// refresh. Keep registration idempotent so a second load cannot break the page.
if (!customElements.get('shs-settings-page')) {
  customElements.define('shs-settings-page', SettingsPage);
}
