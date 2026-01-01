/**
 * SmartHomeShop WaterP1 Card
 * For WaterP1MeterKit devices (Water + Energy)
 */

import { html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SmartHomeShopBaseCard, CardConfig } from './base-card';
import { baseStyles } from '../utils/styles';
import { formatNumber, fireMoreInfo, generateSparkline, getEntityValue, getEntityState } from '../utils/helpers';

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
      .energy-section .value-display.active::before {
        background: var(--warning-color);
      }

      /* Dual power display (consumption + return) */
      .dual-power {
        display: grid;
        grid-template-columns: 1fr 1fr;
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
        background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 152, 0, 0.04) 100%);
        border: 1px solid rgba(255, 193, 7, 0.15);
      }
      .dual-power .value-display.solar::before {
        background: var(--warning-color);
      }
      .dual-power .value-display.solar .value-big,
      .dual-power .value-display.solar .value-unit {
        color: #ffc107;
      }

      /* Solar stat item styling */
      .stat-item.solar {
        background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 152, 0, 0.04) 100%);
        border: 1px solid rgba(255, 193, 7, 0.15);
      }
      .stat-item.solar .stat-value {
        color: #ffc107;
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
        background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: pulse-alert 1s ease-in-out infinite;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 0, 0, 0.4);
      }

      @keyframes pulse-alert {
        0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 4px 20px rgba(255, 0, 0, 0.4); }
        50% { opacity: 0.85; transform: scale(1.01); box-shadow: 0 4px 30px rgba(255, 0, 0, 0.7); }
      }

      .hardware-leak-alert .alert-icon {
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: shake 0.5s ease-in-out infinite;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
      }

      .hardware-leak-alert .alert-icon ha-icon { --mdc-icon-size: 28px; color: white; }
      .hardware-leak-alert .alert-content { flex: 1; }
      .hardware-leak-alert .alert-title { font-size: 16px; font-weight: 700; color: white; margin-bottom: 4px; text-transform: uppercase; }
      .hardware-leak-alert .alert-message { font-size: 13px; color: rgba(255, 255, 255, 0.9); }
      .hardware-leak-alert .alert-badge { background: white; color: #cc0000; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }

      .leak-panel {
        background: var(--card-background-color, #1a1a1a);
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

      /* Meter Reading Counter - Classic meter look */
      .meter-counter-section {
        background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
        border-radius: 12px;
        padding: 16px;
        margin-top: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .meter-counter-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .meter-counter-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .meter-counter-title ha-icon {
        --mdc-icon-size: 18px;
        color: var(--info-color);
      }
      .meter-counter-calibrate {
        font-size: 11px;
        color: var(--info-color);
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .meter-counter-calibrate:hover { opacity: 1; }

      .meter-counter-display {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 3px;
        padding: 12px 0;
      }
      .meter-digit {
        width: 32px;
        height: 48px;
        background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Courier New', monospace;
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        box-shadow: 
          inset 0 1px 0 rgba(255,255,255,0.1),
          inset 0 -1px 0 rgba(0,0,0,0.3),
          0 2px 4px rgba(0,0,0,0.3);
        position: relative;
        overflow: hidden;
      }
      .meter-digit::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(0, 0, 0, 0.4);
      }
      .meter-digit::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50%;
        background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
      }
      .meter-digit.decimal {
        color: #ff6b6b;
        background: linear-gradient(180deg, #3a2020 0%, #2a1515 50%, #3a2020 100%);
        border-color: rgba(255, 107, 107, 0.3);
      }
      .meter-separator {
        font-size: 32px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
        margin: 0 2px;
      }
      .meter-unit {
        font-size: 14px;
        color: var(--secondary-text-color);
        margin-left: 8px;
        align-self: flex-end;
        padding-bottom: 8px;
      }

      .meter-counter-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 11px;
        color: var(--secondary-text-color);
      }
      .meter-counter-footer .last-calibration { opacity: 0.7; }
      .meter-counter-footer .usage-since { color: var(--info-color); }
    `,
  ];

  @state() protected override _config: WaterP1Config = {};
  @state() private _leakPanelExpanded = false;

  static getConfigElement() { return document.createElement('smarthomeshop-waterp1-card-editor'); }
  static getStubConfig() { return { show_graph: true, show_water: true, show_energy: true, has_water_leak_sensor: false }; }

  public override setConfig(config: WaterP1Config): void {
    const deviceChanged = this._config.device_id !== config.device_id;
    this._config = {
      show_graph: true,
      show_water: true,
      show_energy: true,
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
      console.debug('WaterP1 Card: Energy today from Utility Meters (CC):', t1Value, '+', t2Value, '=', this._energyTodayFromStats, 'kWh');
      return;
    }

    // Fallback: Use Statistics API (same as Energy Dashboard)
    const tariff1Entity = this._findEntity(['energy_consumed_tariff_1'], 'sensor', true);
    const tariff2Entity = this._findEntity(['energy_consumed_tariff_2'], 'sensor', true);

    if (!tariff1Entity && !tariff2Entity) {
      console.debug('WaterP1 Card: No tariff entities found for statistics');
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
      console.debug('WaterP1 Card: Energy today from Statistics API:', totalChange, 'kWh');
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

  protected render() {
    if (!this.hass) return nothing;

    const flowRate = this._getFlowRate();
    const todayUsage = this._getTodayUsage();
    const weekUsage = this._getWeekUsage();
    const monthUsage = this._getMonthUsage();
    const yearUsage = this._getYearUsage();
    const waterTotal = this._getMeterTotal();
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

    return html`
      <ha-card>
        <div class="card-content">
          ${isHardwareSensorWet ? this._renderHardwareLeakAlert() : nothing}
          ${this._renderHeader(flowRate, power, hasLeak, isHardwareSensorWet)}
          ${this._config.show_water ? html`
            <div class="water-section">
              ${this._renderWaterSection(flowRate, todayUsage, weekUsage, monthUsage, yearUsage, waterTotal)}
              ${this._renderLeakDetectionPanel(hasLeak, leakScore, isContinuousFlow, isNightUsage, isMicroLeak, hasLeakSensorEnabled, isHardwareSensorWet)}
            </div>
          ` : nothing}
          ${this._config.show_water && this._config.show_energy ? html`<div class="section-divider"></div>` : nothing}
          ${this._config.show_energy ? html`<div class="energy-section">${this._renderEnergySection(power, energyToday, gasToday)}</div>` : nothing}
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
          <div class="header-icon ${flowRate > 0 || power > 100 ? 'flowing' : ''}"><ha-icon icon="mdi:water-flash"></ha-icon></div>
          <div><h2 class="header-title">WaterP1MeterKit</h2><div class="header-subtitle">Water + Energy</div></div>
        </div>
        <div class="status-badge ${statusClass}"><ha-icon icon="${statusIcon}"></ha-icon><span>${statusText}</span></div>
      </div>
    `;
  }

  private _renderWaterSection(flowRate: number, todayUsage: number, weekUsage: number, monthUsage: number, yearUsage: number, _waterTotal: number) {
    const sparklinePath = generateSparkline(this._historyData);
    const maxValue = this._getMaxHistoryValue();

    return html`
      <div class="section-header water"><ha-icon icon="mdi:water"></ha-icon> Water</div>
      <div class="value-display ${flowRate > 0 ? 'active' : ''}" @click=${() => this._handleClick(this._config.flow_entity)}>
        <span class="value-big">${formatNumber(flowRate, 1)}</span><span class="value-unit">L/min</span>
        <div class="value-label">Current water usage</div>
      </div>
      <div class="stats-grid">
        <div class="stat-item" @click=${() => this._handleClick(this._config.today_entity)}><div class="stat-value">${formatNumber(todayUsage, 0)}<span class="stat-unit">L</span></div><div class="stat-label">Today</div></div>
        <div class="stat-item" @click=${() => this._handleClick(this._config.week_entity)}><div class="stat-value">${formatNumber(weekUsage, 0)}<span class="stat-unit">L</span></div><div class="stat-label">Week</div></div>
        <div class="stat-item" @click=${() => this._handleClick(this._config.month_entity)}><div class="stat-value">${formatNumber(monthUsage / 1000, 1)}<span class="stat-unit">m³</span></div><div class="stat-label">Month</div></div>
        <div class="stat-item" @click=${() => this._handleClick(this._config.year_entity)}><div class="stat-value">${formatNumber(yearUsage, 1)}<span class="stat-unit">m³</span></div><div class="stat-label">Year</div></div>
      </div>
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
      ${this._renderMeterCounter()}
    `;
  }

  private _renderMeterCounter() {
    // Get meter reading entity (from SmartHomeShop custom component)
    const meterReading = this._getMeterReading();
    if (meterReading === null) return nothing;

    // Split into integer and decimal parts
    const intPart = Math.floor(meterReading);
    const decPart = Math.round((meterReading - intPart) * 1000);
    
    // Pad integer to 6 digits and decimal to 3 digits
    const intDigits = intPart.toString().padStart(6, '0').split('');
    const decDigits = decPart.toString().padStart(3, '0').split('');

    // Get calibration info
    const attrs = this._getMeterReadingAttributes();
    const lastCalibration = attrs?.last_calibration 
      ? new Date(attrs.last_calibration).toLocaleDateString('nl-NL')
      : null;
    const usageSince = attrs?.usage_since_calibration ?? 0;

    return html`
      <div class="meter-counter-section" @click=${() => this._handleClick(this._getMeterReadingEntityId())}>
        <div class="meter-counter-header">
          <div class="meter-counter-title">
            <ha-icon icon="mdi:counter"></ha-icon>
            Meterstand
          </div>
          <div class="meter-counter-calibrate" @click=${(e: Event) => { e.stopPropagation(); this._handleClick(this._getMeterInputEntityId()); }}>
            ⚙️ Ijken
          </div>
        </div>
        <div class="meter-counter-display">
          ${intDigits.map(d => html`<div class="meter-digit">${d}</div>`)}
          <span class="meter-separator">,</span>
          ${decDigits.map(d => html`<div class="meter-digit decimal">${d}</div>`)}
          <span class="meter-unit">m³</span>
        </div>
        ${lastCalibration || usageSince > 0 ? html`
          <div class="meter-counter-footer">
            <span class="last-calibration">${lastCalibration ? `Geijkt: ${lastCalibration}` : ''}</span>
            <span class="usage-since">${usageSince > 0 ? `+${formatNumber(usageSince * 1000, 0)} L sinds ijking` : ''}</span>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _getMeterReading(): number | null {
    // Look for meter reading sensor from SmartHomeShop custom component
    const entityId = this._getMeterReadingEntityId();
    if (!entityId) return null;
    
    const state = this.hass?.states[entityId];
    if (!state || state.state === 'unknown' || state.state === 'unavailable') return null;
    
    try {
      return parseFloat(state.state);
    } catch {
      return null;
    }
  }

  private _getMeterReadingEntityId(): string | null {
    if (!this.hass) return null;
    
    // Search for meter reading sensor
    for (const entityId of Object.keys(this.hass.states)) {
      if (entityId.includes('meter_reading') && !entityId.includes('input') && entityId.startsWith('sensor.')) {
        const state = this.hass.states[entityId];
        if (state?.attributes?.last_calibration !== undefined || state?.attributes?.usage_since_calibration !== undefined) {
          return entityId;
        }
      }
    }
    return null;
  }

  private _getMeterInputEntityId(): string | null {
    if (!this.hass) return null;
    
    // Search for meter reading input number
    for (const entityId of Object.keys(this.hass.states)) {
      if (entityId.includes('meter_reading') && entityId.startsWith('number.')) {
        return entityId;
      }
    }
    return null;
  }

  private _getMeterReadingAttributes(): Record<string, unknown> | null {
    const entityId = this._getMeterReadingEntityId();
    if (!entityId) return null;
    
    return this.hass?.states[entityId]?.attributes || null;
  }

  private _renderLeakDetectionPanel(hasLeak: boolean, leakScore: number, isContinuousFlow: boolean, isNightUsage: boolean, isMicroLeak: boolean, hasLeakSensorEnabled: boolean, isHardwareSensorWet: boolean) {
    const activeCount = [isContinuousFlow, isNightUsage, isMicroLeak, isHardwareSensorWet].filter(Boolean).length;
    const waterTotal = this._getMeterTotal();

    let statusClass = 'ok', statusIcon = 'mdi:shield-check', statusText = 'No anomalies';
    if (isHardwareSensorWet) { statusClass = 'alert'; statusIcon = 'mdi:water-alert'; statusText = 'Water leak detected!'; }
    else if (hasLeak || leakScore >= 50) { statusClass = 'alert'; statusIcon = 'mdi:alert-circle'; statusText = `${activeCount} issue${activeCount !== 1 ? 's' : ''} detected`; }
    else if (leakScore > 0 || activeCount > 0) { statusClass = 'warning'; statusIcon = 'mdi:alert'; statusText = 'Monitoring activity'; }

    return html`
      <div class="leak-panel">
        <div class="leak-panel-header" @click=${() => this._leakPanelExpanded = !this._leakPanelExpanded}>
          <div class="header-icon ${statusClass}"><ha-icon icon="${statusIcon}"></ha-icon></div>
          <div class="header-content"><div class="header-title">Leak Detection</div><div class="header-subtitle">${statusText}</div></div>
          <div class="header-right"><div class="meter-value">${formatNumber(waterTotal, 3)} m³</div><div class="meter-label">Meter</div></div>
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
    // Check for solar/return power
    const powerReturned = this._getPowerReturned();
    const energyReturnedToday = this._getEnergyReturnedToday();
    const hasSolar = powerReturned > 0 || energyReturnedToday > 0;

    return html`
      <div class="section-header energy"><ha-icon icon="mdi:flash"></ha-icon> Energy</div>

      ${hasSolar ? html`
        <!-- Solar mode: show consumption and return -->
        <div class="dual-power">
          <div class="value-display ${power > 100 ? 'active' : ''}" @click=${() => this._handleClick(this._config.power_entity)}>
            <span class="value-big">${formatNumber(power, 0)}</span><span class="value-unit">W</span>
            <div class="value-label">Verbruik</div>
          </div>
          <div class="value-display solar ${powerReturned > 0 ? 'active' : ''}" @click=${() => this._handleClick(this._config.power_returned_entity)}>
            <span class="value-big">${formatNumber(powerReturned, 0)}</span><span class="value-unit">W</span>
            <div class="value-label">Teruglevering</div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-item" @click=${() => this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${formatNumber(energyToday, 2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Verbruik vandaag</div></div>
          <div class="stat-item solar" @click=${() => this._handleClick(this._config.energy_returned_entity)}><div class="stat-value">${formatNumber(energyReturnedToday, 2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Teruglevering vandaag</div></div>
          <div class="stat-item" @click=${() => this._handleClick(this._config.gas_entity)}><div class="stat-value">${formatNumber(gasToday, 2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas vandaag</div></div>
        </div>
      ` : html`
        <!-- No solar: simple view -->
        <div class="value-display ${power > 100 ? 'active' : ''}" @click=${() => this._handleClick(this._config.power_entity)}>
          <span class="value-big">${formatNumber(power, 0)}</span><span class="value-unit">W</span>
          <div class="value-label">Huidig verbruik</div>
        </div>
        <div class="dual-stats">
          <div class="stat-item" @click=${() => this._handleClick(this._config.energy_today_entity)}><div class="stat-value">${formatNumber(energyToday, 2)}<span class="stat-unit">kWh</span></div><div class="stat-label">Stroom vandaag</div></div>
          <div class="stat-item" @click=${() => this._handleClick(this._config.gas_entity)}><div class="stat-value">${formatNumber(gasToday, 2)}<span class="stat-unit">m³</span></div><div class="stat-label">Gas vandaag</div></div>
        </div>
      `}
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
