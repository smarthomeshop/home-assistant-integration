/**
 * SmartHomeShop WaterP1 Card
 * For WaterP1MeterKit devices (Water + Energy)
 */

import { html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SmartHomeShopBaseCard, CardConfig } from './base-card';
import { baseStyles } from '../utils/styles';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { formatNumber, fireMoreInfo, generateSparkline, getEntityValue, getEntityState, relativeTime } from '../utils/helpers';
import { productLogo } from '../utils/product-logos';
import { debugLog } from '../utils/debug';

interface StatisticsResult {
  [entityId: string]: {
    change?: number;
    mean?: number;
    min?: number;
    max?: number;
    sum?: number;
    state?: number;
  }[];
}

interface WaterP1Config extends CardConfig {
  show_water?: boolean;
  show_energy?: boolean;
  show_energy_current?: boolean;
  show_energy_today?: boolean;
  show_energy_returned?: boolean;
  show_gas_today?: boolean;
  has_water_leak_sensor?: boolean;
  power_entity?: string;
  power_returned_entity?: string;
  power_phase_l1_entity?: string;
  power_phase_l2_entity?: string;
  power_phase_l3_entity?: string;
  energy_today_entity?: string;
  energy_returned_entity?: string;
  gas_entity?: string;
  gas_today_entity?: string;
  water_leak_sensor_entity?: string;
  leak_score_entity?: string;
  continuous_flow_entity?: string;
  night_usage_entity?: string;
  micro_leak_entity?: string;
}

@customElement('smarthomeshop-waterp1-card')
export class SmartHomeShopWaterP1Card extends SmartHomeShopBaseCard {
  @state() private _energyTodayFromStats: number | null = null;
  @state() private _lastStatsUpdate: number = 0;

  static styles = [
    baseStyles,
    css`
      /* Offline state */
      .offline-state {
        text-align: center;
        padding: 32px 20px 40px;
        color: var(--secondary-text-color);
      }
      .offline-state ha-icon {
        --mdc-icon-size: 44px;
        opacity: 0.4;
        margin-bottom: 12px;
      }
      .offline-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin-bottom: 4px;
      }
      .offline-sub {
        font-size: 13px;
        margin-bottom: 12px;
      }
      .offline-hint {
        font-size: 12px;
        opacity: 0.7;
      }

      .energy-section .value-display.active::before {
        background: var(--warning-color);
      }

      /* Dual power display (consumption + return) */
      .dual-power {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .dual-power .value-display {
        padding: 16px 12px;
      }
      .dual-power .value-display .value-big {
        font-size: 28px;
      }
      .dual-power .value-display.solar {
        background: color-mix(in srgb, var(--warning-color) 8%, var(--shs-surface));
        border-color: color-mix(in srgb, var(--warning-color) 28%, var(--divider-color));
      }
      .dual-power .value-display.solar::before {
        background: var(--warning-color);
      }
      .dual-power .value-display.solar .value-big,
      .dual-power .value-display.solar .value-unit {
        color: var(--warning-color);
      }

      /* Solar stat item styling */
      .stat-item.solar {
        background: color-mix(in srgb, var(--warning-color) 8%, var(--shs-surface));
        border-color: color-mix(in srgb, var(--warning-color) 28%, var(--divider-color));
      }
      .stat-item.solar .stat-value {
        color: var(--warning-color);
      }

      /* Dual stats (simple view without solar) */
      .dual-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .dual-stats .stat-item {
        background: var(--secondary-background-color);
        border-radius: 12px;
        padding: 14px;
        text-align: center;
        cursor: pointer;
        transition: background 0.2s;
      }
      .dual-stats .stat-item:hover {
        background: var(--primary-background-color);
      }
      .dual-stats .stat-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--primary-text-color);
      }
      .dual-stats .stat-unit {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-left: 2px;
      }
      .dual-stats .stat-label {
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-top: 4px;
        text-transform: uppercase;
      }

      .hardware-leak-alert {
        background: color-mix(in srgb, var(--error-color) 14%, var(--card-background-color));
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        border: 1px solid color-mix(in srgb, var(--error-color) 45%, var(--divider-color));
      }

      .hardware-leak-alert .alert-icon {
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        background: color-mix(in srgb, var(--error-color) 18%, transparent);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .hardware-leak-alert .alert-icon ha-icon { --mdc-icon-size: 24px; color: var(--error-color); }
      .hardware-leak-alert .alert-content { flex: 1; }
      .hardware-leak-alert .alert-title { font-size: 14px; font-weight: 700; color: var(--error-color); margin-bottom: 3px; }
      .hardware-leak-alert .alert-message { font-size: 12px; color: var(--primary-text-color); }
      .hardware-leak-alert .alert-badge { background: var(--error-color); color: var(--text-primary-color); padding: 5px 9px; border-radius: 12px; font-size: 11px; font-weight: 700; }

      .leak-panel {
        background: var(--card-background-color);
        border-radius: 12px;
        margin-top: 12px;
        overflow: hidden;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
      }

      .leak-panel-header {
        display: flex;
        align-items: center;
        padding: 12px 14px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .leak-panel-header:hover { background: var(--secondary-background-color); }

      .leak-panel-header .header-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }

      .leak-panel-header .header-icon.ok { background: rgba(76, 175, 80, 0.15); color: var(--success-color); }
      .leak-panel-header .header-icon.warning { background: rgba(255, 152, 0, 0.15); color: var(--warning-color); }
      .leak-panel-header .header-icon.alert { background: rgba(244, 67, 54, 0.15); color: var(--error-color); }
      .leak-panel-header .header-icon ha-icon { --mdc-icon-size: 20px; }
      .leak-panel-header .header-content { flex: 1; }
      .leak-panel-header .header-title { font-size: 13px; font-weight: 500; color: var(--primary-text-color); }
      .leak-panel-header .header-subtitle { font-size: 11px; color: var(--secondary-text-color); margin-top: 2px; }
      .leak-panel-header .header-right { text-align: right; }
      .leak-panel-header .meter-value { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
      .leak-panel-header .meter-label { font-size: 10px; color: var(--secondary-text-color); text-transform: uppercase; }
      .leak-panel-header .expand-icon {
        --mdc-icon-size: 20px;
        color: var(--secondary-text-color);
      }

      .leak-details { padding: 0 14px 14px; border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08)); }

      .leak-detail-row {
        display: flex;
        align-items: center;
        padding: 8px 0;
        cursor: pointer;
      }

      .leak-detail-row:not(:last-child) { border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.05)); }

      .leak-detail-row .detail-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        background: rgba(100, 100, 100, 0.1);
      }

      .leak-detail-row .detail-icon ha-icon { --mdc-icon-size: 14px; color: var(--secondary-text-color); }
      .leak-detail-row .detail-icon.active { background: rgba(244, 67, 54, 0.15); }
      .leak-detail-row .detail-icon.active ha-icon { color: var(--error-color); }
      .leak-detail-row .detail-info { flex: 1; }
      .leak-detail-row .detail-name { font-size: 12px; color: var(--primary-text-color); }
      .leak-detail-row .detail-desc { font-size: 10px; color: var(--secondary-text-color); }
      .leak-detail-row .detail-status { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 8px; }
      .leak-detail-row .detail-status.ok { background: rgba(76, 175, 80, 0.1); color: var(--success-color); }
      .leak-detail-row .detail-status.active { background: rgba(244, 67, 54, 0.15); color: var(--error-color); }
      .leak-detail-row.hardware .detail-icon { background: rgba(33, 150, 243, 0.15); }
      .leak-detail-row.hardware .detail-icon ha-icon { color: var(--info-color); }
      .leak-detail-row.hardware.wet .detail-icon { background: rgba(244, 67, 54, 0.15); }
      .leak-detail-row.hardware.wet .detail-icon ha-icon { color: var(--error-color); animation: pulse 1s infinite; }

      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

      @container (max-width: 430px) {
        .dual-power {
          gap: 8px;
        }

        .dual-power .value-display {
          padding: 14px 10px;
        }

        .dual-power .value-display .value-big {
          font-size: 24px;
        }

        .hardware-leak-alert {
          align-items: flex-start;
        }
      }

    `,
  ];

  @state() protected override _config: WaterP1Config = {};
  @state() private _leakPanelExpanded = false;

  static getConfigElement() { return document.createElement('smarthomeshop-waterp1-card-editor'); }
  static getStubConfig() {
    return {
      show_header: true,
      show_status: true,
      show_water: true,
      show_water_current: true,
      show_water_totals: true,
      show_graph: true,
      show_meter_reading: true,
      show_leak_detection: true,
      show_energy: true,
      show_energy_current: true,
      show_energy_today: true,
      show_energy_returned: true,
      show_gas_today: true,
      has_water_leak_sensor: false,
    };
  }

  public override setConfig(config: WaterP1Config): void {
    const deviceChanged = this._config.device_id !== config.device_id;
    this._config = {
      show_header: true,
      show_status: true,
      show_graph: true,
      show_water: true,
      show_water_current: true,
      show_water_totals: true,
      show_today: true,
      show_week: true,
      show_month: true,
      show_year: true,
      show_meter_reading: true,
      show_leak_detection: true,
      show_energy: true,
      show_energy_current: true,
      show_energy_today: true,
      show_energy_returned: true,
      show_gas_today: true,
      has_water_leak_sensor: false,
      _entitiesResolved: deviceChanged ? false : config._entitiesResolved,
      ...config,
    };
  }

  protected override _autoDetectEntities(): void {
    super._autoDetectEntities();
    if (!this.hass) return;

    this._config._productName = 'WaterP1MeterKit';

    // Main power entity - try multiple patterns
    if (!this._config.power_entity) {
      this._config.power_entity =
        this._findEntity(['power_consumed', 'currently_delivered', 'power_delivered', 'active_power', 'vermogen_actueel', 'stroom_afgenomen'], 'sensor', true) ||
        this._findEntity(['power consumed', 'vermogen', 'current power']);
    }

    // 3-phase power entities
    if (!this._config.power_phase_l1_entity) {
      this._config.power_phase_l1_entity = this._findEntity(['power_consumed_phase_l1', 'power_phase_l1', 'phase_1_power', 'l1_power'], 'sensor', true);
    }
    if (!this._config.power_phase_l2_entity) {
      this._config.power_phase_l2_entity = this._findEntity(['power_consumed_phase_l2', 'power_phase_l2', 'phase_2_power', 'l2_power'], 'sensor', true);
    }
    if (!this._config.power_phase_l3_entity) {
      this._config.power_phase_l3_entity = this._findEntity(['power_consumed_phase_l3', 'power_phase_l3', 'phase_3_power', 'l3_power'], 'sensor', true);
    }

    // Energy entities
    if (!this._config.energy_today_entity) {
      this._config.energy_today_entity =
        this._findEntity(['electricity_today', 'electricity_daily', 'energy_today'], 'sensor', true) || this._findEntity(['energy_consumed_tariff'], 'sensor', true) ||
        this._findEntity(['energy consumed']);
    }
    if (!this._config.gas_entity) {
      this._config.gas_entity =
        this._findEntity(['gas_consumed', 'gas_delivered'], 'sensor', true) ||
        this._findEntity(['gas consumed']);
    }

    // Leak detection entities
    if (!this._config.leak_score_entity) {
      this._config.leak_score_entity = this._findEntity(['leak_score', 'lek_score'], 'sensor', true);
    }
    if (!this._config.continuous_flow_entity) {
      this._config.continuous_flow_entity = this._findEntity(['continuous_flow', 'continue_flow'], 'binary_sensor', true);
    }
    if (!this._config.night_usage_entity) {
      this._config.night_usage_entity = this._findEntity(['night_usage', 'nacht_gebruik'], 'binary_sensor', true);
    }
    if (!this._config.micro_leak_entity) {
      this._config.micro_leak_entity = this._findEntity(['micro_leak', 'micro_lek'], 'binary_sensor', true);
    }

    // Hardware water leak sensor (V3)
    if (this._config.has_water_leak_sensor && !this._config.water_leak_sensor_entity) {
      this._config.water_leak_sensor_entity =
        this._findEntity(['water_leak_sensor', 'water_leak'], 'binary_sensor', true) ||
        this._findEntity(['water leak sensor', 'leksensor'], 'binary_sensor');
    }
  }

  private _handleClick(entityId: string | undefined): void {
    if (entityId) fireMoreInfo(this, entityId);
  }

  private _getTotalPower(): number {
    // Get main power and check unit (convert kW to W)
    const powerState = getEntityState(this.hass, this._config.power_entity);
    const unit = powerState?.attributes?.unit_of_measurement || 'W';
    let mainPower = getEntityValue(this.hass, this._config.power_entity);

    // Convert kW to W if needed
    if (unit.toLowerCase() === 'kw') {
      mainPower = mainPower * 1000;
    }

    if (mainPower > 0) return mainPower;

    // If no main power or 0, try summing 3-phase power (also with kW conversion)
    const getPhaseValue = (entity: string | undefined): number => {
      const state = getEntityState(this.hass, entity);
      const phaseUnit = state?.attributes?.unit_of_measurement || 'W';
      let val = getEntityValue(this.hass, entity);
      if (phaseUnit.toLowerCase() === 'kw') val = val * 1000;
      return val;
    };

    const l1 = getPhaseValue(this._config.power_phase_l1_entity);
    const l2 = getPhaseValue(this._config.power_phase_l2_entity);
    const l3 = getPhaseValue(this._config.power_phase_l3_entity);

    if (l1 > 0 || l2 > 0 || l3 > 0) {
      return l1 + l2 + l3;
    }

    return mainPower;
  }

  private _isHardwareLeakSensorWet(): boolean {
    if (!this._config.has_water_leak_sensor || !this._config.water_leak_sensor_entity || !this.hass) return false;
    const state = getEntityState(this.hass, this._config.water_leak_sensor_entity);
    return state?.state === 'on';
  }

  private _getLeakScore(): number { return getEntityValue(this.hass, this._config.leak_score_entity); }
  private _isContinuousFlow(): boolean { return getEntityState(this.hass, this._config.continuous_flow_entity)?.state === 'on'; }
  private _isNightUsage(): boolean { return getEntityState(this.hass, this._config.night_usage_entity)?.state === 'on'; }
  private _isMicroLeak(): boolean { return getEntityState(this.hass, this._config.micro_leak_entity)?.state === 'on'; }

  /**
   * Get energy consumption using Utility Meter entities (CC).
   * These are automatically created by our integration and are persistent.
   * T1 + T2 are summed for total daily consumption.
   * Falls back to Statistics API if utility meters are not available yet.
   */
  private async _fetchEnergyStatistics(): Promise<void> {
    if (!this.hass) return;

    // Only update every 60 seconds
    const now = Date.now();
    if (now - this._lastStatsUpdate < 60 * 1000 && this._energyTodayFromStats !== null) {
      return;
    }

    // First, try to find our Utility Meter entities (CC) - preferred because persistent!
    // Look for the (CC) entities we created: sensor.waterp1_xxx_energy_daily_t1
    const utilityMeterT1 = this._findUtilityMeterEntity('energy_daily_t1');
    const utilityMeterT2 = this._findUtilityMeterEntity('energy_daily_t2');

    if (utilityMeterT1 || utilityMeterT2) {
      const t1Value = getEntityValue(this.hass, utilityMeterT1);
      const t2Value = getEntityValue(this.hass, utilityMeterT2);
      this._energyTodayFromStats = t1Value + t2Value;
      this._lastStatsUpdate = now;
      debugLog('WaterP1 Card: Energy today from Utility Meters (CC):', t1Value, '+', t2Value, '=', this._energyTodayFromStats, 'kWh');
      return;
    }

    // Fallback: Use Statistics API (same as Energy Dashboard)
    const tariff1Entity = this._findEntity(['energy_consumed_tariff_1'], 'sensor', true);
    const tariff2Entity = this._findEntity(['energy_consumed_tariff_2'], 'sensor', true);

    if (!tariff1Entity && !tariff2Entity) {
      debugLog('WaterP1 Card: No tariff entities found for statistics');
      return;
    }

    const statisticIds = [tariff1Entity, tariff2Entity].filter(Boolean) as string[];

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startTime = today.toISOString();

      const result = await this.hass.callWS<StatisticsResult>({
        type: 'recorder/statistics_during_period',
        start_time: startTime,
        statistic_ids: statisticIds,
        period: 'day',
        types: ['change'],
      });

      let totalChange = 0;
      for (const entityId of statisticIds) {
        const stats = result[entityId];
        if (stats && stats.length > 0) {
          for (const stat of stats) {
            if (stat.change !== undefined) {
              totalChange += stat.change;
            }
          }
        }
      }

      this._energyTodayFromStats = totalChange;
      this._lastStatsUpdate = now;
      debugLog('WaterP1 Card: Energy today from Statistics API:', totalChange, 'kWh');
    } catch (err) {
      console.warn('WaterP1 Card: Failed to fetch energy statistics:', err);
    }
  }

  /**
   * Find a utility meter entity by suffix pattern.
   * Searches for entities like sensor.waterp1_xxx_{suffix}
   */
  private _findUtilityMeterEntity(suffix: string): string | undefined {
    if (!this.hass) return undefined;

    // Get device ID pattern from config
    const deviceId = this._config.device_id;
    if (!deviceId) return undefined;

    // Extract short ID (e.g., "776c6c" from "waterp1meterkit_776c6c")
    const match = deviceId.match(/([a-f0-9]{6})/i);
    const shortId = match ? match[1].toLowerCase() : '';

    if (!shortId) return undefined;

    // Look for entity with pattern: sensor.waterp1_{shortId}_{suffix}
    const expectedEntity = `sensor.waterp1_${shortId}_${suffix}`;

    if (this.hass.states[expectedEntity]) {
      return expectedEntity;
    }

    // Fallback: search all entities for the pattern
    for (const entityId of Object.keys(this.hass.states)) {
      if (entityId.includes(shortId) && entityId.endsWith(suffix)) {
        return entityId;
      }
    }

    return undefined;
  }

  private _getEnergyToday(): number {
    // Prefer utility meter / statistics value (accurate, survives restarts)
    if (this._energyTodayFromStats !== null && this._energyTodayFromStats > 0) {
      return this._energyTodayFromStats;
    }

    // Fallback to entity value
    const entityValue = getEntityValue(this.hass, this._config.energy_today_entity);

    // If entity shows suspiciously low value, trigger refresh
    if (entityValue < 0.5 && this._energyTodayFromStats === null) {
      this._fetchEnergyStatistics();
    }

    return this._energyTodayFromStats ?? entityValue;
  }

  /**
   * Get gas consumption for today from Utility Meter (CC).
   */
  private _getGasToday(): number {
    // Look for the (CC) gas utility meter: sensor.waterp1_xxx_gas_daily
    const gasUtilityMeter = this._findUtilityMeterEntity('gas_daily');

    if (gasUtilityMeter) {
      return getEntityValue(this.hass, gasUtilityMeter);
    }

    return 0;
  }

  protected override firstUpdated(changedProps: Map<string, unknown>): void {
    super.firstUpdated(changedProps);
    // Fetch energy statistics on first load
    this._fetchEnergyStatistics();
  }

  protected override updated(changedProps: Map<string, unknown>): void {
    super.updated(changedProps);
    // Refresh statistics periodically when hass updates
    if (changedProps.has('hass')) {
      this._fetchEnergyStatistics();
    }
  }

  private _getOfflineInfo(): { offline: boolean; lastSeen: string | null } {
    const deviceId = this._config.device_id;
    if (!this.hass || !deviceId) return { offline: false, lastSeen: null };
    const entities = (this.hass as any).entities || {};
    let found = false;
    let lastSeen: string | null = null;
    let statusOffSince: string | null = null;
    for (const [entityId, entry] of Object.entries(entities)) {
      if ((entry as any).device_id !== deviceId) continue;
      // Only the ESPHome device entities reflect connectivity; our (CC)
      // helper entities keep their restored value even when it is offline.
      if ((entry as any).platform !== 'esphome') continue;
      // Sensors only: update/select entities live HA-side and stay
      // available while the device itself is offline.
      if (!entityId.startsWith('sensor.') && !entityId.startsWith('binary_sensor.')) continue;
      const state = this.hass.states[entityId];
      if (!state) continue;
      // The ESPHome status sensor is authoritative: it stays available
      // and flips to 'off' when the device disconnects.
      if (state.attributes?.device_class === 'connectivity') {
        if (state.state === 'on') return { offline: false, lastSeen: null };
        if (state.state === 'off') {
          statusOffSince = ((state as any).last_changed as string | undefined) ?? null;
        }
        continue;
      }
      found = true;
      if (state.state !== 'unavailable') return { offline: false, lastSeen: null };
      const changed = (state as any).last_changed as string | undefined;
      if (changed && (!lastSeen || changed > lastSeen)) lastSeen = changed;
    }
    if (statusOffSince) return { offline: true, lastSeen: statusOffSince };
    return { offline: found, lastSeen };
  }

  protected render() {
    if (!this.hass) return nothing;

    const offlineInfo = this._getOfflineInfo();
    if (offlineInfo.offline) {
      return html`
        <ha-card>
          <div class="card-content">
            <div class="header">
              <div class="header-left">
                <div class="header-icon">${productLogo('waterp1meterkit') ? unsafeHTML(productLogo('waterp1meterkit')!) : html`<ha-icon icon="mdi:water-flash"></ha-icon>`}</div>
                <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
              </div>
              <div class="status-badge status-alert"><ha-icon icon="mdi:lan-disconnect"></ha-icon><span>Offline</span></div>
            </div>
            <div class="offline-state">
              <ha-icon icon="mdi:lan-disconnect"></ha-icon>
              <div class="offline-title">Device offline</div>
              <div class="offline-sub">
                ${offlineInfo.lastSeen
                  ? `Last seen ${relativeTime(offlineInfo.lastSeen)}`
                  : 'Waiting for the device to reconnect'}
              </div>
              <div class="offline-hint">Check the power supply and Wi-Fi connection.</div>
            </div>
          </div>
        </ha-card>
      `;
    }

    const flowRate = this._getFlowRate();
    const todayUsage = this._getTodayUsage();
    const weekUsage = this._getWeekUsage();
    const monthUsage = this._getMonthUsage();
    const yearUsage = this._getYearUsage();
    const hasLeak = this._hasLeak();
    const leakScore = this._getLeakScore();
    const isContinuousFlow = this._isContinuousFlow();
    const isNightUsage = this._isNightUsage();
    const isMicroLeak = this._isMicroLeak();
    const hasLeakSensorEnabled = this._config.has_water_leak_sensor === true;
    const isHardwareSensorWet = this._isHardwareLeakSensorWet();

    const power = this._getTotalPower();
    // Use statistics-based energy calculation (same as Energy Dashboard)
    const energyToday = this._getEnergyToday();
    const gasToday = this._getGasToday();
    const showWater = this._config.show_water !== false && this._hasVisibleWaterContent();
    const showEnergy = this._config.show_energy !== false && this._hasVisibleEnergyContent();

    return html`
      <ha-card>
        <div class="card-content">
          ${isHardwareSensorWet ? this._renderHardwareLeakAlert() : nothing}
          ${this._config.show_header !== false
            ? this._renderHeader(flowRate, power, hasLeak, isHardwareSensorWet)
            : nothing}
          ${showWater ? html`
            <div class="water-section">
              ${this._renderWaterSection(flowRate, todayUsage, weekUsage, monthUsage, yearUsage)}
              ${this._config.show_leak_detection !== false
                ? this._renderLeakDetectionPanel(hasLeak, leakScore, isContinuousFlow, isNightUsage, isMicroLeak, hasLeakSensorEnabled, isHardwareSensorWet)
                : nothing}
            </div>
          ` : nothing}
          ${showWater && showEnergy ? html`<div class="section-divider"></div>` : nothing}
          ${showEnergy
            ? html`<div class="energy-section">${this._renderEnergySection(power, energyToday, gasToday)}</div>`
            : nothing}
        </div>
      </ha-card>
    `;
  }

  private _renderHardwareLeakAlert() {
    return html`
      <div class="hardware-leak-alert" @click=${() => this._handleClick(this._config.water_leak_sensor_entity)}>
        <div class="alert-icon"><ha-icon icon="mdi:water-alert"></ha-icon></div>
        <div class="alert-content">
          <div class="alert-title">⚠️ Water Leak Detected!</div>
          <div class="alert-message">The leak sensor detected water. Check immediately!</div>
        </div>
        <div class="alert-badge">WET</div>
      </div>
    `;
  }

  private _renderHeader(flowRate: number, power: number, hasLeak: boolean, isHardwareSensorWet: boolean) {
    let statusIcon = 'mdi:check-circle';
    let statusText = 'All normal';
    let statusClass = 'status-ok';

    if (isHardwareSensorWet) { statusIcon = 'mdi:water-alert'; statusText = 'WATER LEAK!'; statusClass = 'status-alert'; }
    else if (hasLeak) { statusIcon = 'mdi:alert'; statusText = 'Leak detected'; statusClass = 'status-alert'; }
    else if (flowRate > 0 || power > 100) { statusIcon = flowRate > 0 ? 'mdi:water' : 'mdi:flash'; statusText = flowRate > 0 ? 'Water flowing' : 'Energy active'; statusClass = 'status-active'; }

    return html`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${flowRate > 0 || power > 100 ? 'flowing' : ''}">${productLogo('waterp1meterkit') ? unsafeHTML(productLogo('waterp1meterkit')!) : html`<ha-icon icon="mdi:water-flash"></ha-icon>`}</div>
          <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
        </div>
        ${this._config.show_status !== false ? html`
          <div class="status-badge ${statusClass}"><ha-icon icon="${statusIcon}"></ha-icon><span>${statusText}</span></div>
        ` : nothing}
      </div>
    `;
  }

  private _hasVisibleWaterContent(): boolean {
    const hasTotals = this._config.show_water_totals !== false && [
      this._config.show_today,
      this._config.show_week,
      this._config.show_month,
      this._config.show_year,
    ].some((value) => value !== false);

    return this._config.show_water_current !== false ||
      hasTotals ||
      this._config.show_graph !== false ||
      this._config.show_meter_reading !== false ||
      this._config.show_leak_detection !== false;
  }

  private _hasVisibleEnergyContent(): boolean {
    return this._config.show_energy_current !== false ||
      this._config.show_energy_today !== false ||
      this._config.show_energy_returned !== false ||
      this._config.show_gas_today !== false;
  }

  private _renderWaterSection(flowRate: number, todayUsage: number, weekUsage: number, monthUsage: number, yearUsage: number) {
    const sparklinePath = generateSparkline(this._historyData);
    const maxValue = this._getMaxHistoryValue();
    const showToday = this._config.show_today !== false;
    const showWeek = this._config.show_week !== false;
    const showMonth = this._config.show_month !== false;
    const showYear = this._config.show_year !== false;
    const showTotals = this._config.show_water_totals !== false &&
      (showToday || showWeek || showMonth || showYear);

    return html`
      <div class="section-header water"><ha-icon icon="mdi:water"></ha-icon> Water</div>
      ${this._config.show_water_current !== false ? html`
        <div class="value-display ${flowRate > 0 ? 'active' : ''}" @click=${() => this._handleClick(this._config.flow_entity)}>
          <span class="value-big">${formatNumber(flowRate, 1)}</span><span class="value-unit">L/min</span>
          <div class="value-label">Current water usage</div>
        </div>
      ` : nothing}
      ${showTotals ? html`
        <div class="stats-grid">
          ${showToday ? html`
            <div class="stat-item" @click=${() => this._handleClick(this._config.today_entity)}><div class="stat-value">${formatNumber(todayUsage, 0)}<span class="stat-unit">L</span></div><div class="stat-label">Today</div></div>
          ` : nothing}
          ${showWeek ? html`
            <div class="stat-item" @click=${() => this._handleClick(this._config.week_entity)}><div class="stat-value">${formatNumber(weekUsage, 0)}<span class="stat-unit">L</span></div><div class="stat-label">Week</div></div>
          ` : nothing}
          ${showMonth ? html`
            <div class="stat-item" @click=${() => this._handleClick(this._config.month_entity)}><div class="stat-value">${formatNumber(monthUsage / 1000, 1)}<span class="stat-unit">m³</span></div><div class="stat-label">Month</div></div>
          ` : nothing}
          ${showYear ? html`
            <div class="stat-item" @click=${() => this._handleClick(this._config.year_entity)}><div class="stat-value">${formatNumber(yearUsage, 1)}<span class="stat-unit">m³</span></div><div class="stat-label">Year</div></div>
          ` : nothing}
        </div>
      ` : nothing}
      ${this._config.show_graph ? html`
        <div class="graph-section" @click=${() => this._handleClick(this._config.flow_entity)}>
          <div class="graph-header"><span class="graph-title">Water last 24 hours</span><span class="graph-max">${this._historyData ? `max: ${formatNumber(maxValue, 1)} L/min` : ''}</span></div>
          <svg class="sparkline" viewBox="0 0 300 55" preserveAspectRatio="none">
            <defs><linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="var(--info-color)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--info-color)" stop-opacity="0.02"/></linearGradient></defs>
            <path class="sparkline-fill" d="${sparklinePath} L 300 55 L 0 55 Z" style="fill: url(#waterGradient);"/>
            <path class="sparkline-line" d="${sparklinePath}" style="stroke: var(--info-color);"/>
          </svg>
          <div class="graph-labels"><span>-24h</span><span>-18h</span><span>-12h</span><span>-6h</span><span>Now</span></div>
        </div>
      ` : nothing}
      ${this._renderMeterSection()}
    `;
  }

  private _renderLeakDetectionPanel(hasLeak: boolean, leakScore: number, isContinuousFlow: boolean, isNightUsage: boolean, isMicroLeak: boolean, hasLeakSensorEnabled: boolean, isHardwareSensorWet: boolean) {
    const activeCount = [isContinuousFlow, isNightUsage, isMicroLeak, isHardwareSensorWet].filter(Boolean).length;

    let statusClass = 'ok', statusIcon = 'mdi:shield-check', statusText = 'No anomalies';
    if (isHardwareSensorWet) { statusClass = 'alert'; statusIcon = 'mdi:water-alert'; statusText = 'Water leak detected!'; }
    else if (hasLeak || leakScore >= 50) { statusClass = 'alert'; statusIcon = 'mdi:alert-circle'; statusText = `${activeCount} issue${activeCount !== 1 ? 's' : ''} detected`; }
    else if (leakScore > 0 || activeCount > 0) { statusClass = 'warning'; statusIcon = 'mdi:alert'; statusText = 'Monitoring activity'; }

    return html`
      <div class="leak-panel">
        <div class="leak-panel-header" @click=${() => this._leakPanelExpanded = !this._leakPanelExpanded}>
          <div class="header-icon ${statusClass}"><ha-icon icon="${statusIcon}"></ha-icon></div>
          <div class="header-content"><div class="header-title">Leak Detection</div><div class="header-subtitle">${statusText}</div></div>
          <ha-icon
            class="expand-icon"
            icon=${this._leakPanelExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
          ></ha-icon>
        </div>
        ${this._leakPanelExpanded ? html`
          <div class="leak-details">
            <div class="leak-detail-row" @click=${() => this._handleClick(this._config.continuous_flow_entity)}>
              <div class="detail-icon ${isContinuousFlow ? 'active' : ''}"><ha-icon icon="mdi:water-sync"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Continuous flow</div><div class="detail-desc">Water running for extended period</div></div>
              <div class="detail-status ${isContinuousFlow ? 'active' : 'ok'}">${isContinuousFlow ? 'ACTIVE' : 'OK'}</div>
            </div>
            <div class="leak-detail-row" @click=${() => this._handleClick(this._config.night_usage_entity)}>
              <div class="detail-icon ${isNightUsage ? 'active' : ''}"><ha-icon icon="mdi:weather-night"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Night usage</div><div class="detail-desc">Water usage during night hours</div></div>
              <div class="detail-status ${isNightUsage ? 'active' : 'ok'}">${isNightUsage ? 'ACTIVE' : 'OK'}</div>
            </div>
            <div class="leak-detail-row" @click=${() => this._handleClick(this._config.micro_leak_entity)}>
              <div class="detail-icon ${isMicroLeak ? 'active' : ''}"><ha-icon icon="mdi:water-opacity"></ha-icon></div>
              <div class="detail-info"><div class="detail-name">Micro leak</div><div class="detail-desc">Small constant water flow</div></div>
              <div class="detail-status ${isMicroLeak ? 'active' : 'ok'}">${isMicroLeak ? 'ACTIVE' : 'OK'}</div>
            </div>
            ${hasLeakSensorEnabled ? html`
              <div class="leak-detail-row hardware ${isHardwareSensorWet ? 'wet' : ''}" @click=${() => this._handleClick(this._config.water_leak_sensor_entity)}>
                <div class="detail-icon"><ha-icon icon="mdi:water-pump"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Hardware leak sensor</div><div class="detail-desc">Physical water detection (V3)</div></div>
                <div class="detail-status ${isHardwareSensorWet ? 'active' : 'ok'}">${isHardwareSensorWet ? 'WET!' : 'DRY'}</div>
              </div>
            ` : nothing}
            ${leakScore > 0 ? html`
              <div class="leak-detail-row" @click=${() => this._handleClick(this._config.leak_score_entity)}>
                <div class="detail-icon ${leakScore >= 50 ? 'active' : ''}"><ha-icon icon="mdi:gauge"></ha-icon></div>
                <div class="detail-info"><div class="detail-name">Leak score</div><div class="detail-desc">Overall risk assessment</div></div>
                <div class="detail-status ${leakScore >= 50 ? 'active' : 'ok'}">${leakScore}%</div>
              </div>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderEnergySection(power: number, energyToday: number, gasToday: number) {
    const powerReturned = this._getPowerReturned();
    const energyReturnedToday = this._getEnergyReturnedToday();
    const hasSolar = powerReturned > 0 || energyReturnedToday > 0;
    const showCurrent = this._config.show_energy_current !== false;
    const showToday = this._config.show_energy_today !== false;
    const showReturned = this._config.show_energy_returned !== false && hasSolar;
    const showGas = this._config.show_gas_today !== false;
    const showLiveGrid = showCurrent || showReturned;
    const showStats = showToday || showReturned || showGas;

    return html`
      <div class="section-header energy"><ha-icon icon="mdi:flash"></ha-icon> Energy</div>
      ${showLiveGrid ? html`
        <div class="dual-power">
          ${showCurrent ? html`
            <div class="value-display ${power > 100 ? 'active' : ''}" @click=${() => this._handleClick(this._config.power_entity)}>
              <span class="value-big">${formatNumber(power, 0)}</span><span class="value-unit">W</span>
              <div class="value-label">${hasSolar ? 'Usage' : 'Current usage'}</div>
            </div>
          ` : nothing}
          ${showReturned ? html`
            <div class="value-display solar ${powerReturned > 0 ? 'active' : ''}" @click=${() => this._handleClick(this._config.power_returned_entity)}>
              <span class="value-big">${formatNumber(powerReturned, 0)}</span><span class="value-unit">W</span>
              <div class="value-label">Returned</div>
            </div>
          ` : nothing}
        </div>
      ` : nothing}
      ${showStats ? html`
        <div class="stats-grid">
          ${showToday ? html`
            <div class="stat-item" @click=${() => this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${formatNumber(energyToday, 2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Electricity today</div></div>
          ` : nothing}
          ${showReturned ? html`
            <div class="stat-item solar" @click=${() => this._handleClick(this._config.energy_returned_entity)}><div class="stat-value">${formatNumber(energyReturnedToday, 2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Returned today</div></div>
          ` : nothing}
          ${showGas ? html`
            <div class="stat-item" @click=${() => this._handleClick(this._config.gas_entity)}><div class="stat-value">${formatNumber(gasToday, 2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas today</div></div>
          ` : nothing}
        </div>
      ` : nothing}
    `;
  }

  /**
   * Get current power being returned to the grid (solar).
   */
  private _getPowerReturned(): number {
    if (!this._config.power_returned_entity) {
      // Try to auto-detect
      this._config.power_returned_entity = this._findEntity(['power_returned', 'power_delivered_to_grid', 'power_export'], 'sensor', true);
    }
    return getEntityValue(this.hass, this._config.power_returned_entity);
  }

  /**
   * Get energy returned today from Utility Meter (CC).
   */
  private _getEnergyReturnedToday(): number {
    // First check for utility meter (entity ID pattern: sensor.waterp1_{shortId}_energy_returned_daily_t1)
    const returnedT1 = this._findUtilityMeterEntity('energy_returned_daily_t1');
    const returnedT2 = this._findUtilityMeterEntity('energy_returned_daily_t2');

    if (returnedT1 || returnedT2) {
      return getEntityValue(this.hass, returnedT1) + getEntityValue(this.hass, returnedT2);
    }

    // Fallback: check for direct entity from P1 meter
    if (!this._config.energy_returned_entity) {
      this._config.energy_returned_entity = this._findEntity(
        ['energy_returned_tariff_1', 'energy_returned_tariff_2', 'energy_returned', 'energy_delivered', 'energy_export'],
        'sensor',
        true
      );
    }

    return 0; // No utility meter yet, will be created on next restart if entities exist
  }
}
