/**
 * Base card class for SmartHomeShop cards
 * Contains shared functionality for all water-based cards
 */

import { LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';
import {
  getEntityValue,
  getEntityState,
  processHistoryData,
} from '../utils/helpers';

export interface CardConfig {
  device_id?: string;
  show_graph?: boolean;
  flow_entity?: string;
  total_entity?: string;
  today_entity?: string;
  week_entity?: string;
  month_entity?: string;
  year_entity?: string;
  leak_entity?: string;
  _entitiesResolved?: boolean;
  _productName?: string;
}

export abstract class SmartHomeShopBaseCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() protected _config: CardConfig = {};
  @state() protected _historyData: number[] | null = null;
  @state() protected _historyLoading = false;

  private _lastHistoryFetch = 0;
  private _lastDeviceId?: string;

  public setConfig(config: CardConfig): void {
    // Reset entity resolution if device_id changed
    const deviceChanged = this._config.device_id !== config.device_id;

    this._config = {
      show_graph: true,
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

      // Check if this is a SmartHomeShop entity
      const isSmartHomeShop = productPatterns.some((p) =>
        friendlyName.includes(p) || entityIdLower.includes(p)
      );
      if (!isSmartHomeShop) return false;

      // If device_id is set, filter by it
      if (deviceId) {
        const hasDeviceId = friendlyName.includes(deviceId.toLowerCase()) ||
                           entityIdLower.includes(deviceId.toLowerCase());
        if (!hasDeviceId) return false;
      }

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
      const entities = Object.keys(this.hass.states);
      if (entities.some((e) => e.includes('waterp1meterkit') && e.includes(deviceId))) {
        this._config._productName = 'WaterP1MeterKit';
      } else if (entities.some((e) => e.includes('watermeterkit') && e.includes(deviceId))) {
        this._config._productName = 'WaterMeterKit';
      } else if (entities.some((e) => e.includes('waterflowkit') && e.includes(deviceId))) {
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
        this._findEntity(['huidig waterverbruik']);
    }
    if (!this._config.total_entity) {
      this._config.total_entity = this._findEntity(
        ['water_meter_total', 'total_consumption'],
        'sensor',
        true
      );
    }
    if (!this._config.today_entity) {
      this._config.today_entity = this._findEntity(['verbruik vandaag']);
    }
    if (!this._config.week_entity) {
      this._config.week_entity = this._findEntity(['verbruik deze week']);
    }
    if (!this._config.month_entity) {
      this._config.month_entity = this._findEntity(['verbruik deze maand']);
    }
    if (!this._config.year_entity) {
      this._config.year_entity = this._findEntity(['verbruik dit jaar']);
    }
    if (!this._config.leak_entity) {
      this._config.leak_entity = this._findEntity(['lek alarm'], 'binary_sensor');
    }

    this._config._entitiesResolved = true;
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
}
