import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { fireMoreInfo } from '../utils/helpers';
import { productLogo } from '../utils/product-logos';
import { baseStyles } from '../utils/styles';
import type { HomeAssistant } from '../types/home-assistant';
import {
  connectionStateForDevice,
  findProductDevices,
  formatMetric,
  productDeviceName,
  relativeStateTime,
  resolveProductDevice,
  resolveProductEntity,
  stateBoolean,
  stateNumber,
  stateUnit,
  type ProductDeviceMatcher,
} from './product-card-utils';

interface CeilSenseCardConfig {
  device_id?: string;
  title?: string;
  show_header?: boolean;
  show_status?: boolean;
  show_presence?: boolean;
  show_zones?: boolean;
  show_distances?: boolean;
  show_environment?: boolean;
  show_room_quality?: boolean;
}

interface CeilSenseEntities {
  presence?: string;
  movingTarget?: string;
  stillTarget?: string;
  targetCount?: string;
  movingTargetCount?: string;
  stillTargetCount?: string;
  movingDistance?: string;
  stillDistance?: string;
  detectionDistance?: string;
  moveEnergy?: string;
  stillEnergy?: string;
  target1X?: string;
  target1Y?: string;
  target2X?: string;
  target2Y?: string;
  target3X?: string;
  target3Y?: string;
  zoneCounts: Array<string | undefined>;
  zoneOccupancy: Array<string | undefined>;
  temperature?: string;
  humidity?: string;
  co2?: string;
  illuminance?: string;
  pressure?: string;
  roomQualityScore?: string;
  roomQualityLabel?: string;
}

const CEILSENSE_MATCHER: ProductDeviceMatcher = {
  aliases: ['ceilsense', 'ceil sense'],
};

const CEILSENSE_DEFAULTS: Required<Omit<CeilSenseCardConfig, 'device_id' | 'title'>> = {
  show_header: true,
  show_status: true,
  show_presence: true,
  show_zones: true,
  show_distances: true,
  show_environment: true,
  show_room_quality: true,
};

@customElement('smarthomeshop-ceilsense-card')
export class SmartHomeShopCeilSenseCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: CeilSenseCardConfig = { ...CEILSENSE_DEFAULTS };

  private _cachedDeviceId?: string;
  private _cachedRegistry?: HomeAssistant['entities'];
  private _cachedEntities: CeilSenseEntities = { zoneCounts: [], zoneOccupancy: [] };

  static styles = [
    baseStyles,
    css`
      .card-content { display: grid; gap: 14px; }
      .header { margin-bottom: 0; }
      .header-icon {
        background: color-mix(in srgb, var(--info-color) 14%, transparent);
        color: var(--info-color);
      }
      .status-badge.offline {
        background: color-mix(in srgb, var(--error-color) 14%, transparent);
        color: var(--error-color);
      }
      .status-badge.occupied {
        background: color-mix(in srgb, var(--success-color) 15%, transparent);
        color: var(--success-color);
      }
      .status-badge.clear {
        background: var(--shs-surface);
        color: var(--secondary-text-color);
      }

      .presence-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 132px;
        min-height: 142px;
        overflow: hidden;
        border: 1px solid var(--shs-outline);
        border-radius: 14px;
        background: var(--shs-surface);
      }
      .presence-copy {
        display: grid;
        align-content: center;
        gap: 7px;
        min-width: 0;
        padding: 18px;
      }
      .presence-kicker {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--secondary-text-color);
        font-size: 11px;
        font-weight: 650;
        text-transform: uppercase;
      }
      .presence-kicker ha-icon { --mdc-icon-size: 17px; }
      .presence-title {
        color: var(--primary-text-color);
        font-size: 25px;
        font-weight: 720;
        line-height: 1.05;
      }
      .presence-detail {
        color: var(--secondary-text-color);
        font-size: 12px;
        line-height: 1.35;
      }
      .presence-types { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 3px; }
      .presence-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 24px;
        padding: 0 8px;
        border-radius: 12px;
        background: var(--card-background-color);
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 600;
      }
      .presence-chip.active {
        background: color-mix(in srgb, var(--success-color) 13%, var(--card-background-color));
        color: var(--success-color);
      }
      .presence-chip ha-icon { --mdc-icon-size: 14px; }

      .radar {
        position: relative;
        overflow: hidden;
        border-left: 1px solid var(--shs-outline);
        background: color-mix(in srgb, var(--info-color) 7%, var(--card-background-color));
      }
      .radar-ring {
        position: absolute;
        left: 50%;
        bottom: -22px;
        border: 1px solid color-mix(in srgb, var(--info-color) 24%, transparent);
        border-radius: 50%;
        transform: translateX(-50%);
      }
      .radar-ring.one { width: 58px; height: 58px; }
      .radar-ring.two { width: 106px; height: 106px; }
      .radar-ring.three { width: 158px; height: 158px; }
      .radar-sensor {
        position: absolute;
        left: 50%;
        bottom: 8px;
        z-index: 2;
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--primary-color);
        color: var(--text-primary-color);
        transform: translateX(-50%);
      }
      .radar-sensor ha-icon { --mdc-icon-size: 18px; }
      .radar-target {
        position: absolute;
        z-index: 3;
        width: 11px;
        height: 11px;
        border: 2px solid color-mix(in srgb, var(--success-color) 48%, white);
        border-radius: 50%;
        background: var(--success-color);
        box-shadow: 0 0 0 5px color-mix(in srgb, var(--success-color) 12%, transparent);
        transform: translate(-50%, -50%);
      }

      .section { display: grid; gap: 9px; }
      .section-title {
        display: flex;
        align-items: center;
        gap: 7px;
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 650;
      }
      .section-title ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color); }
      .metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .metric {
        appearance: none;
        min-width: 0;
        padding: 11px;
        border: 1px solid var(--shs-outline);
        border-radius: 10px;
        background: var(--shs-surface);
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .metric:hover { background: var(--shs-surface-hover); }
      .metric-head { display: flex; align-items: center; gap: 7px; }
      .metric-icon {
        width: 28px;
        height: 28px;
        flex: 0 0 28px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: color-mix(in srgb, var(--info-color) 12%, transparent);
        color: var(--info-color);
      }
      .metric-icon ha-icon { --mdc-icon-size: 17px; }
      .metric-label {
        overflow: hidden;
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 600;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .metric-value {
        margin-top: 7px;
        color: var(--primary-text-color);
        font-size: 17px;
        font-weight: 680;
      }
      .metric-value span { margin-left: 3px; color: var(--secondary-text-color); font-size: 10px; font-weight: 500; }

      .zone-list { display: grid; gap: 7px; }
      .zone {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-height: 42px;
        padding: 0 11px;
        border: 1px solid var(--shs-outline);
        border-radius: 10px;
        background: var(--shs-surface);
      }
      .zone-index {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: color-mix(in srgb, var(--info-color) 12%, transparent);
        color: var(--info-color);
        font-size: 11px;
        font-weight: 700;
      }
      .zone-name { color: var(--primary-text-color); font-size: 12px; font-weight: 600; }
      .zone-state { color: var(--secondary-text-color); font-size: 11px; }
      .zone.active { border-color: color-mix(in srgb, var(--success-color) 42%, var(--divider-color)); }
      .zone.active .zone-index { background: color-mix(in srgb, var(--success-color) 14%, transparent); color: var(--success-color); }

      .quality {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        padding: 12px;
        border: 1px solid var(--shs-outline);
        border-radius: 11px;
        background: var(--shs-surface);
      }
      .quality-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: color-mix(in srgb, var(--success-color) 13%, transparent);
        color: var(--success-color);
      }
      .quality-icon ha-icon { --mdc-icon-size: 20px; }
      .quality-label { color: var(--primary-text-color); font-size: 13px; font-weight: 650; }
      .quality-subtitle { margin-top: 2px; color: var(--secondary-text-color); font-size: 10px; }
      .quality-score { color: var(--primary-text-color); font-size: 20px; font-weight: 720; }
      .quality-score span { color: var(--secondary-text-color); font-size: 10px; font-weight: 500; }

      .empty-state {
        display: grid;
        place-items: center;
        gap: 8px;
        min-height: 140px;
        padding: 20px;
        border: 1px dashed var(--shs-outline);
        border-radius: 12px;
        color: var(--secondary-text-color);
        text-align: center;
      }
      .empty-state ha-icon { --mdc-icon-size: 30px; color: var(--info-color); }
      .empty-state .product-logo {
        display: block;
        width: 40px;
        height: 40px;
        color: var(--info-color);
      }
      .empty-state .product-logo svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .empty-state strong { color: var(--primary-text-color); }
      .empty-state span { max-width: 300px; font-size: 12px; line-height: 1.45; }

      @container (max-width: 390px) {
        .card-content { padding: 13px; gap: 12px; }
        .presence-panel { grid-template-columns: minmax(0, 1fr) 108px; min-height: 132px; }
        .presence-copy { padding: 14px; }
        .presence-title { font-size: 22px; }
        .radar-ring.three { width: 136px; height: 136px; }
      }
    `,
  ];

  public setConfig(config: CeilSenseCardConfig): void {
    this._config = { ...CEILSENSE_DEFAULTS, ...config };
    this._cachedDeviceId = undefined;
  }

  public getCardSize(): number {
    return 6;
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement('smarthomeshop-ceilsense-card-editor');
  }

  public static getStubConfig(): CeilSenseCardConfig {
    return { ...CEILSENSE_DEFAULTS };
  }

  private _device() {
    return resolveProductDevice(this.hass, this._config.device_id, CEILSENSE_MATCHER);
  }

  private _resolveEntities(): CeilSenseEntities {
    const device = this._device();
    const deviceId = device?.id;
    if (this._cachedDeviceId === deviceId && this._cachedRegistry === this.hass?.entities) {
      return this._cachedEntities;
    }
    const find = (matcher: Parameters<typeof resolveProductEntity>[2]) =>
      resolveProductEntity(this.hass, deviceId, matcher, CEILSENSE_MATCHER);
    this._cachedEntities = {
      presence: find({ domains: ['binary_sensor'], suffixes: ['presence', 'occupancy'], includesAny: ['presence', 'occupancy'], excludes: ['zone'] }),
      movingTarget: find({ domains: ['binary_sensor'], suffixes: ['moving_target'] }),
      stillTarget: find({ domains: ['binary_sensor'], suffixes: ['still_target'] }),
      targetCount: find({ domains: ['sensor'], suffixes: ['target_count'], excludes: ['zone', 'moving', 'still'] }),
      movingTargetCount: find({ domains: ['sensor'], suffixes: ['moving_target_count'] }),
      stillTargetCount: find({ domains: ['sensor'], suffixes: ['still_target_count'] }),
      movingDistance: find({ domains: ['sensor'], suffixes: ['moving_distance'] }),
      stillDistance: find({ domains: ['sensor'], suffixes: ['still_distance'] }),
      detectionDistance: find({ domains: ['sensor'], suffixes: ['detection_distance'] }),
      moveEnergy: find({ domains: ['sensor'], suffixes: ['move_energy'] }),
      stillEnergy: find({ domains: ['sensor'], suffixes: ['still_energy'] }),
      target1X: find({ domains: ['sensor'], suffixes: ['target_1_x'] }),
      target1Y: find({ domains: ['sensor'], suffixes: ['target_1_y'] }),
      target2X: find({ domains: ['sensor'], suffixes: ['target_2_x'] }),
      target2Y: find({ domains: ['sensor'], suffixes: ['target_2_y'] }),
      target3X: find({ domains: ['sensor'], suffixes: ['target_3_x'] }),
      target3Y: find({ domains: ['sensor'], suffixes: ['target_3_y'] }),
      zoneCounts: [1, 2, 3, 4].map((index) => find({ domains: ['sensor'], suffixes: [`zone_${index}_target_count`] })),
      zoneOccupancy: [1, 2, 3, 4].map((index) => find({ domains: ['binary_sensor'], suffixes: [`zone_${index}_occupancy`, `zone_${index}_presence`] })),
      // The BMP3xx temperature is a die reading for pressure compensation,
      // not room climate: a Basic has no climate sensor and shows none.
      temperature: find({ domains: ['sensor'], suffixes: ['scd41_temperature', 'temperature'], deviceClasses: ['temperature'], excludes: ['cpu', 'bmp'] }),
      humidity: find({ domains: ['sensor'], suffixes: ['scd41_humidity', 'humidity'], deviceClasses: ['humidity'] }),
      co2: find({ domains: ['sensor'], suffixes: ['scd41_co2', 'co2'], deviceClasses: ['carbon_dioxide'] }),
      illuminance: find({ domains: ['sensor'], suffixes: ['bh1750_illuminance', 'illuminance'], deviceClasses: ['illuminance'] }),
      pressure: find({ domains: ['sensor'], suffixes: ['pressure'], deviceClasses: ['atmospheric_pressure'] }),
      roomQualityScore: find({ domains: ['sensor'], suffixes: ['room_quality_score_cc', 'room_quality_percentage_cc'] }),
      roomQualityLabel: find({ domains: ['sensor'], suffixes: ['room_quality_label_cc'] }),
    };
    this._cachedDeviceId = deviceId;
    this._cachedRegistry = this.hass?.entities;
    return this._cachedEntities;
  }

  private _metric(label: string, icon: string, entityId: string | undefined, digits = 0) {
    const value = stateNumber(this.hass, entityId);
    if (value === null) return nothing;
    return html`
      <button class="metric" type="button" @click=${() => entityId && fireMoreInfo(this, entityId)}>
        <div class="metric-head">
          <div class="metric-icon"><ha-icon icon=${icon}></ha-icon></div>
          <div class="metric-label">${label}</div>
        </div>
        <div class="metric-value">${formatMetric(value, digits)}<span>${stateUnit(this.hass, entityId)}</span></div>
      </button>
    `;
  }

  private _targetPositions(entities: CeilSenseEntities, occupied: boolean): Array<{ left: number; top: number }> {
    const pairs = [
      [entities.target1X, entities.target1Y],
      [entities.target2X, entities.target2Y],
      [entities.target3X, entities.target3Y],
    ];
    const positions = pairs.flatMap(([xEntity, yEntity]) => {
      const x = stateNumber(this.hass, xEntity);
      const y = stateNumber(this.hass, yEntity);
      if (x === null || y === null || (x === 0 && y === 0)) return [];
      return [{
        left: Math.max(10, Math.min(90, 50 + (x / 6000) * 45)),
        top: Math.max(12, Math.min(78, 84 - (y / 6000) * 70)),
      }];
    });
    if (positions.length === 0 && occupied) return [{ left: 50, top: 38 }];
    return positions;
  }

  protected render() {
    if (!this.hass) return nothing;
    const device = this._device();
    const entities = this._resolveEntities();
    const logo = productLogo('ceilsense');
    if (!device) {
      return html`
        <ha-card>
          <div class="card-content">
            <div class="empty-state">
              ${logo
                ? html`<span class="product-logo">${unsafeHTML(logo)}</span>`
                : html`<ha-icon icon="mdi:ceiling-light-outline"></ha-icon>`}
              <strong>No CeilSense found</strong>
              <span>Add a CeilSense to Home Assistant or select its device in the card editor.</span>
            </div>
          </div>
        </ha-card>
      `;
    }

    const connection = connectionStateForDevice(this.hass, device.id);
    const occupied = stateBoolean(this.hass, entities.presence) === true;
    const moving = stateBoolean(this.hass, entities.movingTarget) === true;
    const still = stateBoolean(this.hass, entities.stillTarget) === true;
    const targetCount = stateNumber(this.hass, entities.targetCount)
      ?? ((stateNumber(this.hass, entities.movingTargetCount) ?? 0) + (stateNumber(this.hass, entities.stillTargetCount) ?? 0));
    const changed = relativeStateTime(this.hass, entities.presence);
    const targets = this._targetPositions(entities, occupied);
    const zoneData = entities.zoneCounts.map((entityId, index) => {
      const count = stateNumber(this.hass, entityId);
      const active = stateBoolean(this.hass, entities.zoneOccupancy[index]) === true || (count ?? 0) > 0;
      return { entityId: entityId ?? entities.zoneOccupancy[index], count, active, index: index + 1 };
    }).filter((zone) => zone.entityId);
    const distanceEntities = [
      entities.movingDistance,
      entities.stillDistance,
      entities.detectionDistance,
      entities.moveEnergy,
      entities.stillEnergy,
    ];
    const hasDistances = distanceEntities.some((entityId) => stateNumber(this.hass, entityId) !== null);
    const environmentEntities = [entities.temperature, entities.humidity, entities.co2, entities.illuminance, entities.pressure];
    const hasEnvironment = environmentEntities.some((entityId) => stateNumber(this.hass, entityId) !== null);
    const qualityScore = stateNumber(this.hass, entities.roomQualityScore);
    const qualityLabel = entities.roomQualityLabel ? this.hass.states[entities.roomQualityLabel]?.state : undefined;

    return html`
      <ha-card>
        <div class="card-content">
          ${this._config.show_header !== false ? html`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${logo
                    ? unsafeHTML(logo)
                    : html`<ha-icon icon="mdi:ceiling-light-outline"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${this._config.title || productDeviceName(device)}</h2>
                  <div class="header-subtitle">Ceiling presence & climate</div>
                </div>
              </div>
              ${this._config.show_status !== false ? html`
                <div class="status-badge ${connection.offline ? 'offline' : occupied ? 'occupied' : 'clear'}">
                  <ha-icon icon="${connection.offline ? 'mdi:lan-disconnect' : occupied ? 'mdi:account-radar' : 'mdi:check-circle'}"></ha-icon>
                  <span>${connection.offline ? 'Offline' : occupied ? 'Occupied' : 'Clear'}</span>
                </div>
              ` : nothing}
            </div>
          ` : nothing}

          ${this._config.show_presence !== false ? html`
            <div class="presence-panel">
              <div class="presence-copy">
                <div class="presence-kicker"><ha-icon icon="mdi:motion-sensor"></ha-icon>Live presence</div>
                <div class="presence-title">${occupied ? `${formatMetric(targetCount, 0)} ${targetCount === 1 ? 'person' : 'people'}` : 'Room clear'}</div>
                <div class="presence-detail">${changed ? `Changed ${changed}` : 'Waiting for presence data'}</div>
                <div class="presence-types">
                  <span class="presence-chip ${moving ? 'active' : ''}"><ha-icon icon="mdi:run"></ha-icon>Moving</span>
                  <span class="presence-chip ${still ? 'active' : ''}"><ha-icon icon="mdi:human-handsdown"></ha-icon>Still</span>
                </div>
              </div>
              <div class="radar" @click=${() => entities.presence && fireMoreInfo(this, entities.presence)}>
                <div class="radar-ring one"></div>
                <div class="radar-ring two"></div>
                <div class="radar-ring three"></div>
                <div class="radar-sensor"><ha-icon icon="mdi:radar"></ha-icon></div>
                ${targets.map((target) => html`<span class="radar-target" style="left:${target.left}%;top:${target.top}%"></span>`)}
              </div>
            </div>
          ` : nothing}

          ${this._config.show_room_quality !== false && (qualityScore !== null || qualityLabel) ? html`
            <div class="quality" @click=${() => entities.roomQualityScore && fireMoreInfo(this, entities.roomQualityScore)}>
              <div class="quality-icon"><ha-icon icon="mdi:home-heart"></ha-icon></div>
              <div>
                <div class="quality-label">${qualityLabel && !['unknown', 'unavailable'].includes(qualityLabel) ? qualityLabel : 'Room quality'}</div>
                <div class="quality-subtitle">Combined climate assessment</div>
              </div>
              <div class="quality-score">${formatMetric(qualityScore, 0)}<span>/100</span></div>
            </div>
          ` : nothing}

          ${this._config.show_zones !== false && zoneData.length > 0 ? html`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:floor-plan"></ha-icon>Detection zones</div>
              <div class="zone-list">
                ${zoneData.map((zone) => html`
                  <div class="zone ${zone.active ? 'active' : ''}" @click=${() => zone.entityId && fireMoreInfo(this, zone.entityId)}>
                    <span class="zone-index">${zone.index}</span>
                    <span class="zone-name">Zone ${zone.index}</span>
                    <span class="zone-state">${zone.active ? `${formatMetric(zone.count ?? 1, 0)} active` : 'Clear'}</span>
                  </div>
                `)}
              </div>
            </section>
          ` : nothing}

          ${this._config.show_distances !== false && hasDistances ? html`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:signal-distance-variant"></ha-icon>Detection detail</div>
              <div class="metric-grid">
                ${this._metric('Moving distance', 'mdi:run', entities.movingDistance, 0)}
                ${this._metric('Still distance', 'mdi:human-handsdown', entities.stillDistance, 0)}
                ${this._metric('Detection distance', 'mdi:signal-distance-variant', entities.detectionDistance, 0)}
                ${this._metric('Movement energy', 'mdi:waveform', entities.moveEnergy, 0)}
                ${this._metric('Still energy', 'mdi:chart-bell-curve', entities.stillEnergy, 0)}
              </div>
            </section>
          ` : nothing}

          ${this._config.show_environment !== false && hasEnvironment ? html`
            <section class="section">
              <div class="section-title"><ha-icon icon="mdi:home-thermometer-outline"></ha-icon>Room climate</div>
              <div class="metric-grid">
                ${this._metric('Temperature', 'mdi:thermometer', entities.temperature, 1)}
                ${this._metric('Humidity', 'mdi:water-percent', entities.humidity, 0)}
                ${this._metric('CO₂', 'mdi:molecule-co2', entities.co2, 0)}
                ${this._metric('Illuminance', 'mdi:brightness-5', entities.illuminance, 0)}
                ${this._metric('Air pressure', 'mdi:gauge', entities.pressure, 0)}
              </div>
            </section>
          ` : nothing}
        </div>
      </ha-card>
    `;
  }
}

@customElement('smarthomeshop-ceilsense-card-editor')
export class SmartHomeShopCeilSenseCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: CeilSenseCardConfig = { ...CEILSENSE_DEFAULTS };

  static styles = css`
    :host { display: block; }
    .editor { display: grid; gap: 16px; padding: 4px 0; }
    .field { display: grid; gap: 6px; }
    label, .group-title { color: var(--primary-text-color); font-size: 13px; font-weight: 600; }
    select, input[type='text'] {
      width: 100%;
      box-sizing: border-box;
      min-height: 42px;
      padding: 9px 11px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }
    .options {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: var(--secondary-background-color);
    }
    .check { display: flex; align-items: center; gap: 9px; color: var(--primary-text-color); font-size: 13px; }
    .check input { width: 18px; height: 18px; margin: 0; accent-color: var(--primary-color); }
    .hint { color: var(--secondary-text-color); font-size: 11px; line-height: 1.4; }
  `;

  public setConfig(config: CeilSenseCardConfig): void {
    this._config = { ...CEILSENSE_DEFAULTS, ...config };
  }

  private _change(key: keyof CeilSenseCardConfig, value: string | boolean): void {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }

  protected render() {
    const devices = findProductDevices(this.hass, CEILSENSE_MATCHER);
    const options: Array<[keyof CeilSenseCardConfig, string]> = [
      ['show_header', 'Header'],
      ['show_status', 'Connection and occupancy status'],
      ['show_presence', 'Live presence visualization'],
      ['show_room_quality', 'Combined room quality'],
      ['show_zones', 'Detection zones'],
      ['show_distances', 'Distance and radar energy'],
      ['show_environment', 'Temperature, humidity, CO₂, light and pressure'],
    ];
    return html`
      <div class="editor">
        <div class="field">
          <label for="device">CeilSense device</label>
          <select id="device" .value=${this._config.device_id ?? ''} @change=${(event: Event) => this._change('device_id', (event.target as HTMLSelectElement).value)}>
            <option value="">Automatic</option>
            ${devices.map((device) => html`<option value=${device.id}>${productDeviceName(device)}</option>`)}
          </select>
          <div class="hint">Optional sensor blocks are hidden automatically when that CeilSense hardware variant does not provide them.</div>
        </div>
        <div class="field">
          <label for="title">Card title</label>
          <input id="title" type="text" .value=${this._config.title ?? ''} placeholder="Use device name" @input=${(event: Event) => this._change('title', (event.target as HTMLInputElement).value)}>
        </div>
        <div class="options">
          <div class="group-title">Visible sections</div>
          ${options.map(([key, label]) => html`
            <label class="check">
              <input type="checkbox" .checked=${this._config[key] !== false} @change=${(event: Event) => this._change(key, (event.target as HTMLInputElement).checked)}>
              <span>${label}</span>
            </label>
          `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-ceilsense-card': SmartHomeShopCeilSenseCard;
    'smarthomeshop-ceilsense-card-editor': SmartHomeShopCeilSenseCardEditor;
  }
}
