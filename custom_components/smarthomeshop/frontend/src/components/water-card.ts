/**
 * SmartHomeShop Water Card
 * For WaterMeterKit and WaterFlowKit devices
 */

import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { SmartHomeShopBaseCard, CardConfig } from './base-card';
import { baseStyles } from '../utils/styles';
import { formatNumber, fireMoreInfo, generateSparkline } from '../utils/helpers';
import { productLogo } from '../utils/product-logos';

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
    return {
      show_header: true,
      show_status: true,
      show_water_current: true,
      show_water_totals: true,
      show_graph: true,
      show_meter_reading: true,
      show_leak_detection: true,
    };
  }

  public override setConfig(config: WaterCardConfig): void {
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
    const hasLeak = this._hasLeak();
    const productName = this._config._productName || 'SmartHomeShop';

    return html`
      <ha-card>
        <div class="card-content">
          ${this._config.show_header !== false
            ? this._renderHeader(productName, flowRate, hasLeak)
            : nothing}
          ${this._config.show_water_current !== false
            ? this._renderFlowDisplay(flowRate)
            : nothing}
          ${this._config.show_water_totals !== false
            ? this._renderStats(todayUsage, weekUsage, monthUsage, yearUsage)
            : nothing}
          ${this._config.show_graph ? this._renderGraph() : nothing}
          ${this._renderMeterSection()}
          ${this._config.show_leak_detection !== false
            ? this._renderLeakBar(hasLeak)
            : nothing}
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
      statusText = 'Leak detected';
      statusClass = 'status-alert';
    } else if (flowRate > 0) {
      statusIcon = 'mdi:water';
      statusText = 'Water flowing';
      statusClass = 'status-active';
    } else {
      statusIcon = 'mdi:check-circle';
      statusText = 'No usage';
      statusClass = 'status-ok';
    }

    return html`
      <div class="header">
        <div class="header-left">
          <div class="header-icon ${flowRate > 0 ? 'flowing' : ''}">
            ${productLogo('watermeterkit')
              ? unsafeHTML(productLogo('watermeterkit')!)
              : html`<ha-icon icon="mdi:water"></ha-icon>`}
          </div>
          <div>
            <h2 class="header-title">${productName}</h2>
            <div class="header-subtitle">Water Monitoring</div>
          </div>
        </div>
        ${this._config.show_status !== false ? html`
          <div class="status-badge ${statusClass}">
            <ha-icon icon="${statusIcon}"></ha-icon>
            <span>${statusText}</span>
          </div>
        ` : nothing}
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
        <div class="value-label">Current water usage</div>
      </div>
    `;
  }

  private _renderStats(today: number, week: number, month: number, year: number) {
    const showToday = this._config.show_today !== false;
    const showWeek = this._config.show_week !== false;
    const showMonth = this._config.show_month !== false;
    const showYear = this._config.show_year !== false;
    if (!showToday && !showWeek && !showMonth && !showYear) return nothing;

    return html`
      <div class="stats-grid">
        ${showToday ? html`
          <div class="stat-item" @click=${() => this._handleClick(this._config.today_entity)}>
            <div class="stat-value">${formatNumber(today, 0)}<span class="stat-unit">L</span></div>
            <div class="stat-label">Today</div>
          </div>
        ` : nothing}
        ${showWeek ? html`
          <div class="stat-item" @click=${() => this._handleClick(this._config.week_entity)}>
            <div class="stat-value">${formatNumber(week, 0)}<span class="stat-unit">L</span></div>
            <div class="stat-label">Week</div>
          </div>
        ` : nothing}
        ${showMonth ? html`
          <div class="stat-item" @click=${() => this._handleClick(this._config.month_entity)}>
            <div class="stat-value">
              ${formatNumber(month / 1000, 1)}<span class="stat-unit">m³</span>
            </div>
            <div class="stat-label">Month</div>
          </div>
        ` : nothing}
        ${showYear ? html`
          <div class="stat-item" @click=${() => this._handleClick(this._config.year_entity)}>
            <div class="stat-value">${formatNumber(year, 1)}<span class="stat-unit">m³</span></div>
            <div class="stat-label">Year</div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderGraph() {
    const sparklinePath = generateSparkline(this._historyData);
    const maxValue = this._getMaxHistoryValue();

    return html`
      <div class="graph-section" @click=${() => this._handleClick(this._config.flow_entity)}>
        <div class="graph-header">
          <span class="graph-title">Usage last 24 hours</span>
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

  private _renderLeakBar(hasLeak: boolean) {
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
            <div class="info-text">Leak detection</div>
            <div class="info-subtext">${hasLeak ? 'Possible leak' : 'No anomalies'}</div>
          </div>
        </div>
        <div class="info-right" aria-hidden="true">
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </div>
      </div>
    `;
  }
}
