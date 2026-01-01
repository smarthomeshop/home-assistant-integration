/**
 * SmartHomeShop Water Card
 * For WaterMeterKit and WaterFlowKit devices
 */

import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SmartHomeShopBaseCard, CardConfig } from './base-card';
import { baseStyles } from '../utils/styles';
import { formatNumber, fireMoreInfo, generateSparkline } from '../utils/helpers';

interface WaterCardConfig extends CardConfig {
  // Add any water-specific config options here
}

@customElement('smarthomeshop-water-card')
export class SmartHomeShopWaterCard extends SmartHomeShopBaseCard {
  static styles = [baseStyles];

  @state() protected override _config: WaterCardConfig = {};

  static getConfigElement() {
    return document.createElement('smarthomeshop-water-card-editor');
  }

  static getStubConfig() {
    return { show_graph: true, graph_type: 'sparkline' };
  }

  public override setConfig(config: WaterCardConfig): void {
    const deviceChanged = this._config.device_id !== config.device_id;

    this._config = {
      show_graph: true,
      _entitiesResolved: deviceChanged ? false : config._entitiesResolved,
      ...config,
    };
  }

  private _handleClick(entityId: string | undefined): void {
    if (entityId) {
      fireMoreInfo(this, entityId);
    }
  }

  protected render() {
    if (!this.hass) return nothing;

    const flowRate = this._getFlowRate();
    const todayUsage = this._getTodayUsage();
    const weekUsage = this._getWeekUsage();
    const monthUsage = this._getMonthUsage();
    const yearUsage = this._getYearUsage();
    const meterTotal = this._getMeterTotal();
    const hasLeak = this._hasLeak();
    const productName = this._config._productName || 'SmartHomeShop';

    return html`
      <ha-card>
        <div class="card-content">
          ${this._renderHeader(productName, flowRate, hasLeak)}
          ${this._renderFlowDisplay(flowRate)}
          ${this._renderStats(todayUsage, weekUsage, monthUsage, yearUsage)}
          ${this._config.show_graph ? this._renderGraph() : nothing}
          ${this._renderLeakBar(hasLeak, meterTotal)}
        </div>
      </ha-card>
    `;
  }

  private _renderHeader(productName: string, flowRate: number, hasLeak: boolean) {
    let statusIcon: string;
    let statusText: string;
    let statusClass: string;

    if (hasLeak) {
      statusIcon = 'mdi:alert';
      statusText = 'Lek gedetecteerd';
      statusClass = 'status-alert';
    } else if (flowRate > 0) {
      statusIcon = 'mdi:water';
      statusText = 'Water stroomt';
      statusClass = 'status-active';
    } else {
      statusIcon = 'mdi:check-circle';
      statusText = 'Geen verbruik';
      statusClass = 'status-ok';
    }

    return html`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${flowRate > 0 ? 'flowing' : ''}">
            <ha-icon icon="mdi:water"></ha-icon>
          </div>
          <div>
            <h2 class="header-title">${productName}</h2>
            <div class="header-subtitle">Water Monitoring</div>
          </div>
        </div>
        <div class="status-badge ${statusClass}">
          <ha-icon icon="${statusIcon}"></ha-icon>
          <span>${statusText}</span>
        </div>
      </div>
    `;
  }

  private _renderFlowDisplay(flowRate: number) {
    return html`
      <div
        class="value-display ${flowRate > 0 ? 'active' : ''}"
        @click=${() => this._handleClick(this._config.flow_entity)}
      >
        <span class="value-big">${formatNumber(flowRate, 1)}</span>
        <span class="value-unit">L/min</span>
        <div class="value-label">Huidig waterverbruik</div>
      </div>
    `;
  }

  private _renderStats(today: number, week: number, month: number, year: number) {
    return html`
      <div class="stats-grid">
        <div class="stat-item" @click=${() => this._handleClick(this._config.today_entity)}>
          <div class="stat-value">${formatNumber(today, 0)}<span class="stat-unit">L</span></div>
          <div class="stat-label">Vandaag</div>
        </div>
        <div class="stat-item" @click=${() => this._handleClick(this._config.week_entity)}>
          <div class="stat-value">${formatNumber(week, 0)}<span class="stat-unit">L</span></div>
          <div class="stat-label">Week</div>
        </div>
        <div class="stat-item" @click=${() => this._handleClick(this._config.month_entity)}>
          <div class="stat-value">
            ${formatNumber(month / 1000, 1)}<span class="stat-unit">m³</span>
          </div>
          <div class="stat-label">Maand</div>
        </div>
        <div class="stat-item" @click=${() => this._handleClick(this._config.year_entity)}>
          <div class="stat-value">${formatNumber(year, 1)}<span class="stat-unit">m³</span></div>
          <div class="stat-label">Jaar</div>
        </div>
      </div>
    `;
  }

  private _renderGraph() {
    const sparklinePath = generateSparkline(this._historyData);
    const maxValue = this._getMaxHistoryValue();

    return html`
      <div class="graph-section" @click=${() => this._handleClick(this._config.flow_entity)}>
        <div class="graph-header">
          <span class="graph-title">Verbruik laatste 24 uur</span>
          <span class="graph-max">
            ${this._historyData ? `max: ${formatNumber(maxValue, 1)} L/min` : ''}
          </span>
        </div>
        <svg class="sparkline" viewBox="0 0 300 55" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="var(--info-color)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="var(--info-color)" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <path
            class="sparkline-fill"
            d="${sparklinePath} L 300 55 L 0 55 Z"
            style="fill: url(#waterGradient);"
          />
          <path class="sparkline-line" d="${sparklinePath}" style="stroke: var(--info-color);" />
        </svg>
        <div class="graph-labels">
          <span>-24u</span><span>-18u</span><span>-12u</span><span>-6u</span><span>Nu</span>
        </div>
      </div>
    `;
  }

  private _renderLeakBar(hasLeak: boolean, meterTotal: number) {
    return html`
      <div
        class="info-bar ${hasLeak ? 'alert' : ''}"
        @click=${() => this._handleClick(this._config.leak_entity)}
      >
        <div class="info-left">
          <div class="info-icon ${hasLeak ? 'alert' : 'ok'}">
            <ha-icon icon="${hasLeak ? 'mdi:alert' : 'mdi:check-circle'}"></ha-icon>
          </div>
          <div>
            <div class="info-text">Lekdetectie</div>
            <div class="info-subtext">${hasLeak ? 'Mogelijke lekkage' : 'Geen afwijkingen'}</div>
          </div>
        </div>
        <div
          class="info-right"
          @click=${(e: Event) => {
            e.stopPropagation();
            this._handleClick(this._config.total_entity);
          }}
        >
          <div class="info-value">${formatNumber(meterTotal, 3)} m³</div>
          <div class="info-label">Meterstand</div>
        </div>
      </div>
    `;
  }
}
