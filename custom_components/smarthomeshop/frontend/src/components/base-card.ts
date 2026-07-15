/**
 * Base card class for SmartHomeShop cards
 * Contains shared functionality for all water-based cards
 */

import { LitElement, PropertyValues, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';
import {
  getEntityValue,
  getEntityState,
  fireMoreInfo,
  processHistoryData,
} from '../utils/helpers';

export interface CardConfig {
  device_id?: string;
  show_header?: boolean;
  show_status?: boolean;
  show_water_current?: boolean;
  show_water_totals?: boolean;
  show_today?: boolean;
  show_week?: boolean;
  show_month?: boolean;
  show_year?: boolean;
  show_graph?: boolean;
  show_meter_reading?: boolean;
  show_leak_detection?: boolean;
  flow_entity?: string;
  total_entity?: string;
  today_entity?: string;
  week_entity?: string;
  month_entity?: string;
  year_entity?: string;
  leak_entity?: string;
  meter_initial_entity?: string;
  _entitiesResolved?: boolean;
  _productName?: string;
}

export abstract class SmartHomeShopBaseCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() protected _config: CardConfig = {};
  @state() protected _historyData: number[] | null = null;
  @state() protected _historyLoading = false;
  @state() protected _showMeterForm = false;
  @state() protected _meterInput = '';

  private _lastHistoryFetch = 0;
  private _lastDeviceId?: string;

  public setConfig(config: CardConfig): void {
    // Reset entity resolution if device_id changed
    const deviceChanged = this._config.device_id !== config.device_id;

    this._config = {
      show_header: true,
      show_status: true,
      show_water_current: true,
      show_water_totals: true,
      show_today: true,
      show_week: true,
      show_month: true,
      show_year: true,
      show_graph: true,
      show_meter_reading: true,
      show_leak_detection: true,
      _entitiesResolved: deviceChanged ? false : config._entitiesResolved,
      ...config,
    };

    if (deviceChanged) {
      this._lastDeviceId = config.device_id;
    }
  }

  public getCardSize(): number {
    return 5;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('hass') && this.hass) {
      // Re-resolve entities if device changed or not resolved yet
      if (!this._config._entitiesResolved || this._lastDeviceId !== this._config.device_id) {
        this._autoDetectEntities();
        this._lastDeviceId = this._config.device_id;
      }

      // Firmware updates can add the persistent meter entity after the card
      // was configured. Upgrade a stale raw source as soon as it appears.
      this._preferPersistentWaterTotal();

      // Fetch history every 5 minutes
      if (this._config.show_graph && this._config.flow_entity) {
        const now = Date.now();
        if (now - this._lastHistoryFetch > 300000 || !this._historyData) {
          this._fetchHistory();
        }
      }
    }
  }

  /**
   * Find an entity matching keywords, optionally filtered by device_id
   */
  protected _findEntity(
    keywords: string[],
    domain = 'sensor',
    searchInEntityId = false
  ): string {
    if (!this.hass) return '';

    const deviceId = this._config.device_id;
    const productPatterns = ['waterp1meterkit', 'watermeterkit', 'waterflowkit', 'smarthomeshop'];

    const entityId = Object.keys(this.hass.states).find((id) => {
      if (!id.startsWith(domain + '.')) return false;
      const state = this.hass!.states[id];
      if (!state?.attributes) return false;

      const friendlyName = (state.attributes.friendly_name || '').toLowerCase();
      const entityIdLower = id.toLowerCase();
      const registryDeviceId = this.hass!.entities?.[id]?.device_id;
      const matchesRegistryDevice = !!deviceId && registryDeviceId === deviceId;
      const matchesLegacyDeviceId = !!deviceId && (
        friendlyName.includes(deviceId.toLowerCase()) ||
        entityIdLower.includes(deviceId.toLowerCase())
      );

      // Check if this is a SmartHomeShop entity
      const isSmartHomeShop = productPatterns.some((p) =>
        friendlyName.includes(p) || entityIdLower.includes(p)
      );
      if (!isSmartHomeShop && !matchesRegistryDevice) return false;

      // If device_id is set, filter by it
      if (deviceId && !matchesRegistryDevice && !matchesLegacyDeviceId) return false;

      // Match keywords
      if (searchInEntityId) {
        return keywords.some((kw) => entityIdLower.includes(kw.toLowerCase()));
      } else {
        return keywords.some((kw) => friendlyName.includes(kw.toLowerCase()));
      }
    });

    return entityId || '';
  }

  protected _autoDetectEntities(): void {
    if (!this.hass) return;

    // Detect product name
    const deviceId = this._config.device_id;
    if (deviceId) {
      const entities = Object.keys(this.hass.states).filter((entityId) => {
        const registryDeviceId = this.hass!.entities?.[entityId]?.device_id;
        return registryDeviceId === deviceId || entityId.includes(deviceId);
      });
      if (entities.some((e) => e.includes('waterp1meterkit'))) {
        this._config._productName = 'WaterP1MeterKit';
      } else if (entities.some((e) => e.includes('watermeterkit'))) {
        this._config._productName = 'WaterMeterKit';
      } else if (entities.some((e) => e.includes('waterflowkit'))) {
        this._config._productName = 'WaterFlowKit';
      } else {
        this._config._productName = 'SmartHomeShop';
      }
    } else {
      // Fallback to generic detection
      const entities = Object.keys(this.hass.states);
      if (entities.some((e) => e.includes('waterp1meterkit'))) {
        this._config._productName = 'WaterP1MeterKit';
      } else if (entities.some((e) => e.includes('watermeterkit'))) {
        this._config._productName = 'WaterMeterKit';
      } else if (entities.some((e) => e.includes('waterflowkit'))) {
        this._config._productName = 'WaterFlowKit';
      } else {
        this._config._productName = 'SmartHomeShop';
      }
    }

    // Auto-detect water entities
    if (!this._config.flow_entity) {
      this._config.flow_entity =
        this._findEntity(['current_usage'], 'sensor', true) ||
        this._findEntity(['current water usage']);
    }
    const persistentWaterTotal =
      this._findEntity(['water_meter_total'], 'sensor', true) ||
      this._findEntity(['water meter total']);
    if (
      persistentWaterTotal &&
      (!this._config.total_entity || this._isRawWaterTotal(this._config.total_entity))
    ) {
      this._config.total_entity = persistentWaterTotal;
    } else if (!this._config.total_entity) {
      this._config.total_entity = this._findEntity(['total_consumption'], 'sensor', true);
    }
    if (!this._config.today_entity) {
      this._config.today_entity = this._findEntity(['usage today']);
    }
    if (!this._config.week_entity) {
      this._config.week_entity = this._findEntity(['usage this week']);
    }
    if (!this._config.month_entity) {
      this._config.month_entity = this._findEntity(['usage this month']);
    }
    if (!this._config.year_entity) {
      this._config.year_entity = this._findEntity(['usage this year']);
    }
    if (!this._config.leak_entity) {
      this._config.leak_entity = this._findEntity(['leak alarm'], 'binary_sensor');
    }
    if (!this._config.meter_initial_entity) {
      // Firmware calibration input ("Water Meter Initial Value"), stored on-device
      this._config.meter_initial_entity = this._findEntity(
        ['water_meter_initial'],
        'number',
        true
      );
    }

    this._config._entitiesResolved = true;
  }

  private _isRawWaterTotal(entityId?: string): boolean {
    if (!entityId) return false;
    if (entityId.toLowerCase().includes('water_total_consumption')) return true;

    const friendlyName = this.hass?.states[entityId]?.attributes.friendly_name;
    return typeof friendlyName === 'string' &&
      friendlyName.toLowerCase().includes('water total consumption');
  }

  private _preferPersistentWaterTotal(): void {
    const currentEntity = this._config.total_entity;
    if (currentEntity && !this._isRawWaterTotal(currentEntity)) return;

    const persistentEntity =
      this._findEntity(['water_meter_total'], 'sensor', true) ||
      this._findEntity(['water meter total']);
    if (!persistentEntity || persistentEntity === currentEntity) return;

    this._config = {
      ...this._config,
      total_entity: persistentEntity,
    };
  }

  protected async _fetchHistory(): Promise<void> {
    if (!this.hass || !this._config.flow_entity || this._historyLoading) return;

    this._historyLoading = true;
    const entityId = this._config.flow_entity;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    try {
      const result = await this.hass.callWS<Record<string, Array<{ lu?: number; s?: string }>>>({
        type: 'history/history_during_period',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        entity_ids: [entityId],
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });

      if (result?.[entityId]) {
        this._historyData = processHistoryData(result[entityId]);
        this._lastHistoryFetch = Date.now();
      }
    } catch (error) {
      console.error('SmartHomeShop: Error fetching history:', error);
    } finally {
      this._historyLoading = false;
    }
  }

  // Helper methods for subclasses
  protected _getFlowRate(): number {
    return getEntityValue(this.hass, this._config.flow_entity);
  }

  protected _getTodayUsage(): number {
    return getEntityValue(this.hass, this._config.today_entity);
  }

  protected _getWeekUsage(): number {
    return getEntityValue(this.hass, this._config.week_entity);
  }

  protected _getMonthUsage(): number {
    return getEntityValue(this.hass, this._config.month_entity);
  }

  protected _getYearUsage(): number {
    return getEntityValue(this.hass, this._config.year_entity);
  }

  protected _getMeterTotal(): number {
    return getEntityValue(this.hass, this._config.total_entity);
  }

  protected _hasLeak(): boolean {
    const state = getEntityState(this.hass, this._config.leak_entity);
    return state?.state === 'on';
  }

  protected _getMaxHistoryValue(): number {
    return this._historyData?.length ? Math.max(...this._historyData) : 0;
  }

  /** Compact total meter reading with optional on-device calibration. */
  protected _renderMeterSection() {
    const totalEntity = this._config.total_entity;
    if (!totalEntity || this._config.show_meter_reading === false) return nothing;

    const isResettingWaterP1Total =
      this._config._productName === 'WaterP1MeterKit' &&
      this._isRawWaterTotal(totalEntity);
    if (isResettingWaterP1Total) {
      return html`
        <div class="meter-counter-section meter-counter-upgrade">
          <span class="meter-counter-icon"><ha-icon icon="mdi:update"></ha-icon></span>
          <span class="meter-counter-copy">
            <span class="meter-counter-title">Persistent meter reading unavailable</span>
            <span class="meter-counter-subtitle">
              Update the WaterP1MeterKit firmware to enable Water Meter Total.
            </span>
          </span>
        </div>
      `;
    }

    const total = this._getMeterTotal();
    const canSet = !!this._config.meter_initial_entity;

    const inputValue = parseFloat(this._meterInput.replace(',', '.'));
    const inputValid = !isNaN(inputValue) && inputValue >= 0;

    return html`
      <div class="meter-counter-section">
        <div class="meter-counter-main">
          <button type="button" class="meter-counter-reading" @click=${() => fireMoreInfo(this, totalEntity)}>
            <span class="meter-counter-icon"><ha-icon icon="mdi:counter"></ha-icon></span>
            <span class="meter-counter-copy">
              <span class="meter-counter-title">Meter reading</span>
              <span class="meter-counter-subtitle">
                ${canSet ? 'Synchronized with your device' : 'Total registered water'}
              </span>
            </span>
            <span class="meter-counter-value">${total.toFixed(3)}<span>m³</span></span>
          </button>
          ${canSet ? html`
            <button
              type="button"
              class="meter-counter-calibrate"
              aria-label=${this._showMeterForm ? 'Cancel setting meter reading' : 'Set meter reading'}
              aria-expanded=${String(this._showMeterForm)}
              @click=${this._toggleMeterForm}
            >
              <ha-icon icon=${this._showMeterForm ? 'mdi:close' : 'mdi:pencil'}></ha-icon>
              <span>${this._showMeterForm ? 'Cancel' : 'Set'}</span>
            </button>
          ` : nothing}
        </div>
        ${canSet && this._showMeterForm ? html`
          <div class="meter-form">
            <div class="meter-form-help">
              Enter the reading shown on your physical water meter in m³, for
              example 123.456. The value is stored on the device itself.
            </div>
            <div class="meter-form-row">
              <input
                type="number"
                inputmode="decimal"
                step="0.001"
                min="0"
                placeholder="123.456"
                .value=${this._meterInput}
                @input=${(e: Event) => { this._meterInput = (e.target as HTMLInputElement).value; }}
                @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' && inputValid) this._saveMeterReading(); }}
              />
              <span class="meter-form-unit">m³</span>
              <button class="meter-form-save" ?disabled=${!inputValid} @click=${this._saveMeterReading}>
                Save
              </button>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _toggleMeterForm = (): void => {
    this._showMeterForm = !this._showMeterForm;
    if (this._showMeterForm) {
      const total = this._getMeterTotal();
      this._meterInput = total > 0 ? total.toFixed(3) : '';
    }
  };

  private _saveMeterReading = async (): Promise<void> => {
    const entityId = this._config.meter_initial_entity;
    if (!this.hass || !entityId) return;
    const value = parseFloat(this._meterInput.replace(',', '.'));
    if (isNaN(value) || value < 0) return;
    await this.hass.callService('number', 'set_value', {
      entity_id: entityId,
      value,
    });
    this._showMeterForm = false;
    this._meterInput = '';
  };
}
