/**
 * SmartHomeShop WaterFlowKit Card
 * Beautiful animated pipe visualization with flowing water
 * Two independent pipes for separate water lines
 */

import { html, css, nothing, svg, LitElement, PropertyValues } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { baseStyles } from '../utils/styles';
import { formatNumber, fireMoreInfo, getEntityValue } from '../utils/helpers';
import { getTranslations, type Translations } from '../utils/translations';
import type { HomeAssistant } from '../types/home-assistant';

interface WaterFlowKitConfig {
  device_id?: string;
  flow1_flow_entity?: string;
  flow1_total_entity?: string;
  flow1_temp_entity?: string;
  flow1_show_temp?: boolean;
  flow2_flow_entity?: string;
  flow2_total_entity?: string;
  flow2_temp_entity?: string;
  flow2_show_temp?: boolean;
  flow1_name?: string;
  flow2_name?: string;
  show_flow1?: boolean;
  show_flow2?: boolean;
}

@customElement('smarthomeshop-waterflowkit-card')
export class SmartHomeShopWaterFlowKitCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: WaterFlowKitConfig = {};

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .card-content {
        padding: 16px;
      }

      /* Status badge styling for water flow */
      .status-badge.flowing {
        background: rgba(14, 165, 233, 0.15);
        color: #0ea5e9;
      }
      .status-badge.inactive {
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }

      /* Pipe visualization container */
      .pipe-container {
        position: relative;
        background: linear-gradient(180deg,
          rgba(15, 23, 42, 0.6) 0%,
          rgba(30, 41, 59, 0.4) 100%);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .pipes-svg {
        width: 100%;
        height: auto;
      }

      .pipe {
        fill: none;
        stroke: #475569;
        stroke-width: 16;
        stroke-linecap: round;
      }

      .pipe-inner {
        fill: none;
        stroke: #1e293b;
        stroke-width: 10;
        stroke-linecap: round;
      }

      .water-flow {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .water-flow.active {
        opacity: 1;
        stroke-dasharray: 16 8;
        animation: flowAnimation 0.6s linear infinite;
        filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.5));
      }

      .water-flow.flow1 { stroke: url(#waterGradient1); }
      .water-flow.flow2 {
        stroke: url(#waterGradient2);
        filter: drop-shadow(0 0 4px rgba(74, 222, 128, 0.5));
      }
      .water-flow.fast {
        animation-duration: 0.25s;
        stroke-dasharray: 20 6;
      }
      .water-flow.slow {
        animation-duration: 1s;
        stroke-dasharray: 10 12;
      }

      @keyframes flowAnimation {
        0% { stroke-dashoffset: 48; }
        100% { stroke-dashoffset: 0; }
      }

      .water-bubble {
        filter: blur(0.5px);
      }

      .pipe-label {
        font-family: 'Roboto', sans-serif;
        font-size: 10px;
        font-weight: 600;
        fill: var(--secondary-text-color);
      }

      .pipe-value {
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        fill: #0ea5e9;
      }

      .pipe-value.flow2 { fill: #22c55e; }
      .pipe-unit { font-size: 10px; fill: var(--secondary-text-color); opacity: 0.7; }
      .temp-badge { font-size: 11px; font-weight: 600; }
      .temp-badge.cold { fill: #38bdf8; }
      .temp-badge.warm { fill: #fbbf24; }
      .temp-badge.hot { fill: #ef4444; }

      /* Flow cards */
      .flow-card {
        background: var(--secondary-background-color);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .flow-card:last-child { margin-bottom: 0; }
      .flow-card:hover {
        background: var(--primary-background-color);
        border-color: rgba(14, 165, 233, 0.3);
      }

      .flow-card.active {
        border-color: #0ea5e9;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 132, 199, 0.05) 100%);
      }

      .flow-card.flow2.active {
        border-color: #22c55e;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%);
      }

      .flow-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .flow-card-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .flow-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .flow-icon.flow1 { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
      .flow-icon.flow2 { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      .flow-icon ha-icon { --mdc-icon-size: 22px; color: white; }

      .flow-name { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
      .flow-status { font-size: 11px; color: var(--secondary-text-color); opacity: 0.7; }
      .flow-status.active { color: #22c55e; opacity: 1; }

      .flow-current { text-align: right; }
      .flow-value { font-size: 24px; font-weight: 700; color: var(--primary-text-color); line-height: 1; }
      .flow-unit { font-size: 12px; color: var(--secondary-text-color); margin-left: 2px; }

      .flow-card-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .flow-stat { text-align: center; }
      .flow-stat-label { font-size: 10px; color: var(--secondary-text-color); opacity: 0.7; margin-bottom: 4px; }
      .flow-stat-value { font-size: 16px; font-weight: 600; color: var(--primary-text-color); }
      .flow-stat-unit { font-size: 10px; color: var(--secondary-text-color); }

      .temp-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }

      .temp-display ha-icon { --mdc-icon-size: 16px; }
      .temp-display.cold ha-icon { color: #38bdf8; }
      .temp-display.warm ha-icon { color: #fbbf24; }
      .temp-display.hot ha-icon { color: #ef4444; }
    `
  ];

  public setConfig(config: WaterFlowKitConfig): void {
    this._config = {
      show_flow1: true,
      show_flow2: true,
      show_temperature: true,
      ...config,
    };
  }

  public getCardSize(): number {
    return 5;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('hass') && this.hass && !this._config.flow1_flow_entity) {
      this._autoDetectEntities();
    }
  }

  private _autoDetectEntities(): void {
    if (!this.hass) return;

    const entities = Object.keys(this.hass.states);
    const updates: Partial<WaterFlowKitConfig> = {};

    // Find WaterFlowKit entities by searching for "waterflowkit" and "flow1/flow2"
    for (const entityId of entities) {
      const lower = entityId.toLowerCase();
      if (!lower.includes('waterflowkit')) continue;

      // Flow1 entities
      if (lower.includes('flow1')) {
        if (lower.includes('current') && lower.includes('usage')) {
          updates.flow1_flow_entity = entityId;
        } else if (lower.includes('total') && lower.includes('consumption')) {
          updates.flow1_total_entity = entityId;
        } else if (lower.includes('temperature')) {
          updates.flow1_temp_entity = entityId;
        }
      }

      // Flow2 entities
      if (lower.includes('flow2')) {
        if (lower.includes('current') && lower.includes('usage')) {
          updates.flow2_flow_entity = entityId;
        } else if (lower.includes('total') && lower.includes('consumption')) {
          updates.flow2_total_entity = entityId;
        } else if (lower.includes('temperature')) {
          updates.flow2_temp_entity = entityId;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      this._config = { ...this._config, ...updates };
      console.log('WaterFlowKit: Auto-detected entities:', updates);
    }
  }

  private _getFlowData(sensorNum: 1 | 2): {
    flow: number;
    total: number;
    temp: number | null;
    hasTemp: boolean;
    isFlowing: boolean;
  } {
    const flowEntity = sensorNum === 1 ? this._config.flow1_flow_entity : this._config.flow2_flow_entity;
    const totalEntity = sensorNum === 1 ? this._config.flow1_total_entity : this._config.flow2_total_entity;
    const tempEntity = sensorNum === 1 ? this._config.flow1_temp_entity : this._config.flow2_temp_entity;

    const flow = getEntityValue(this.hass, flowEntity) ?? 0;
    const total = getEntityValue(this.hass, totalEntity) ?? 0;
    const tempValue = getEntityValue(this.hass, tempEntity);

    // Temperature is valid if > -10°C
    const hasTemp = tempValue !== null && tempValue > -10;
    const temp = hasTemp ? tempValue : null;
    const isFlowing = flow > 0.01;

    return { flow, total, temp, hasTemp, isFlowing };
  }

  private _getTempClass(temp: number | null): string {
    if (temp === null) return '';
    if (temp < 20) return 'cold';
    if (temp < 40) return 'warm';
    return 'hot';
  }

  private _getFlowSpeed(flow: number): string {
    if (flow > 5) return 'fast';
    if (flow < 1) return 'slow';
    return '';
  }

  protected render() {
    if (!this.hass) return nothing;

    const t = getTranslations(this.hass);
    const showFlow1 = this._config.show_flow1 !== false;
    const showFlow2 = this._config.show_flow2 !== false;
    const showFlow1Temp = this._config.flow1_show_temp !== false;
    const showFlow2Temp = this._config.flow2_show_temp !== false;

    const flow1 = this._getFlowData(1);
    const flow2 = this._getFlowData(2);
    const flow1Name = this._config.flow1_name || t.waterflowkit.pipe1;
    const flow2Name = this._config.flow2_name || t.waterflowkit.pipe2;

    const activeFlows = (showFlow1 && flow1.isFlowing ? 1 : 0) + (showFlow2 && flow2.isFlowing ? 1 : 0);
    const totalFlow = (showFlow1 ? flow1.flow : 0) + (showFlow2 ? flow2.flow : 0);

    return html`
      <ha-card>
        <div class="card-content">
          <div class="header">
            <div class="header-left">
              <div class="header-icon ${activeFlows > 0 ? 'flowing' : ''}">
                <ha-icon icon="mdi:pipe"></ha-icon>
              </div>
              <div>
                <h2 class="header-title">${t.waterflowkit.title}</h2>
                <div class="header-subtitle">${t.waterflowkit.subtitle}</div>
              </div>
            </div>
            <div class="status-badge ${activeFlows > 0 ? 'flowing' : 'inactive'}">
              <ha-icon icon="${activeFlows > 0 ? 'mdi:water' : 'mdi:water-off'}"></ha-icon>
              <span>${activeFlows > 0
                ? `${formatNumber(totalFlow, 2)} L/min`
                : t.waterflowkit.noFlow}</span>
            </div>
          </div>

          <div class="pipe-container">
            ${this._renderPipesSVG(flow1, flow2, showFlow1, showFlow2, showFlow1Temp, showFlow2Temp)}
          </div>

          ${showFlow1 ? this._renderFlowCard(1, flow1, flow1Name, showFlow1Temp) : nothing}
          ${showFlow2 ? this._renderFlowCard(2, flow2, flow2Name, showFlow2Temp) : nothing}
        </div>
      </ha-card>
    `;
  }

  private _renderPipesSVG(
    flow1: ReturnType<typeof this._getFlowData>,
    flow2: ReturnType<typeof this._getFlowData>,
    showFlow1: boolean,
    showFlow2: boolean,
    showFlow1Temp: boolean,
    showFlow2Temp: boolean
  ) {
    const flow1Active = showFlow1 && flow1.isFlowing;
    const flow2Active = showFlow2 && flow2.isFlowing;
    const showBoth = showFlow1 && showFlow2;
    const height = showBoth ? 140 : 70;
    const flow1Y = showBoth ? 35 : 35;
    const flow2Y = showBoth ? 105 : 35;

    return svg`
      <svg class="pipes-svg" viewBox="0 0 360 ${height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <!-- Water flow gradients -->
          <linearGradient id="waterGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:0.9" />
            <stop offset="50%" style="stop-color:#38bdf8;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.9" />
          </linearGradient>
          <linearGradient id="waterGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.9" />
            <stop offset="50%" style="stop-color:#4ade80;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0.9" />
          </linearGradient>
          <!-- Brass/copper gradient for sensor body -->
          <linearGradient id="brassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#d4a853" />
            <stop offset="50%" style="stop-color:#b8860b" />
            <stop offset="100%" style="stop-color:#8b6914" />
          </linearGradient>
          <!-- Pipe metallic gradient -->
          <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#64748b" />
            <stop offset="50%" style="stop-color:#475569" />
            <stop offset="100%" style="stop-color:#334155" />
          </linearGradient>
        </defs>

        <!-- Flow 1 -->
        ${showFlow1 ? svg`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${flow1Y} L 360 ${flow1Y}" />
          <path class="pipe-inner" d="M 0 ${flow1Y} L 360 ${flow1Y}" />

          <!-- Animated water flow -->
          <path class="water-flow flow1 ${flow1Active ? 'active' : ''} ${this._getFlowSpeed(flow1.flow)}" d="M 0 ${flow1Y} L 360 ${flow1Y}" />

          <!-- Water bubbles animation when flowing -->
          ${flow1Active ? svg`
            <circle class="water-bubble" cx="80" cy="${flow1Y}" r="3" fill="#38bdf8" opacity="0.6">
              <animate attributeName="cx" from="80" to="360" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.8;0.4;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle class="water-bubble" cx="120" cy="${flow1Y - 2}" r="2" fill="#7dd3fc" opacity="0.5">
              <animate attributeName="cx" from="120" to="400" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle class="water-bubble" cx="160" cy="${flow1Y + 2}" r="2.5" fill="#38bdf8" opacity="0.5">
              <animate attributeName="cx" from="160" to="440" dur="2s" repeatCount="indefinite" />
            </circle>
          ` : ''}

          <!-- YF-Sensor SVG -->
          ${this._renderYFSensor(55, flow1Y, flow1Active, 1)}

          <!-- Labels -->
          <text class="pipe-label" x="110" y="${flow1Y - 15}">${(this._config.flow1_name || t.waterflowkit.pipe1).toUpperCase()}</text>
          <text class="pipe-value" x="220" y="${flow1Y + 5}">${formatNumber(flow1.flow, 2)}</text>
          <text class="pipe-unit" x="265" y="${flow1Y + 5}">L/min</text>
          ${showFlow1Temp && flow1.hasTemp ? svg`
            <text class="temp-badge ${this._getTempClass(flow1.temp)}" x="320" y="${flow1Y + 5}">${formatNumber(flow1.temp!, 1)}°C</text>
          ` : ''}
        ` : ''}

        <!-- Flow 2 -->
        ${showFlow2 ? svg`
          <!-- Pipe -->
          <path class="pipe" d="M 0 ${flow2Y} L 360 ${flow2Y}" />
          <path class="pipe-inner" d="M 0 ${flow2Y} L 360 ${flow2Y}" />

          <!-- Animated water flow -->
          <path class="water-flow flow2 ${flow2Active ? 'active' : ''} ${this._getFlowSpeed(flow2.flow)}" d="M 0 ${flow2Y} L 360 ${flow2Y}" />

          <!-- Water bubbles animation when flowing -->
          ${flow2Active ? svg`
            <circle class="water-bubble" cx="90" cy="${flow2Y}" r="3" fill="#4ade80" opacity="0.6">
              <animate attributeName="cx" from="90" to="370" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.8;0.4;0.6" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle class="water-bubble" cx="140" cy="${flow2Y + 2}" r="2" fill="#86efac" opacity="0.5">
              <animate attributeName="cx" from="140" to="420" dur="1.9s" repeatCount="indefinite" />
            </circle>
            <circle class="water-bubble" cx="180" cy="${flow2Y - 2}" r="2.5" fill="#4ade80" opacity="0.5">
              <animate attributeName="cx" from="180" to="460" dur="2.1s" repeatCount="indefinite" />
            </circle>
          ` : ''}

          <!-- YF-Sensor SVG -->
          ${this._renderYFSensor(55, flow2Y, flow2Active, 2)}

          <!-- Labels -->
          <text class="pipe-label" x="110" y="${flow2Y - 15}">${(this._config.flow2_name || t.waterflowkit.pipe2).toUpperCase()}</text>
          <text class="pipe-value flow2" x="220" y="${flow2Y + 5}">${formatNumber(flow2.flow, 2)}</text>
          <text class="pipe-unit" x="265" y="${flow2Y + 5}">L/min</text>
          ${showFlow2Temp && flow2.hasTemp ? svg`
            <text class="temp-badge ${this._getTempClass(flow2.temp)}" x="320" y="${flow2Y + 5}">${formatNumber(flow2.temp!, 1)}°C</text>
          ` : ''}
        ` : ''}
      </svg>
    `;
  }

  // Render YF-Sensor icon (brass flow sensor with red module)
  private _renderYFSensor(x: number, y: number, isActive: boolean, flowNum: 1 | 2) {
    const activeColor = flowNum === 1 ? '#0ea5e9' : '#22c55e';

    return svg`
      <g transform="translate(${x - 20}, ${y - 12})">
        <!-- Left brass connector -->
        <rect x="0" y="6" width="8" height="12" rx="1" fill="url(#brassGradient)" />
        <rect x="1" y="7" width="6" height="10" rx="1" fill="#d4a853" opacity="0.3" />

        <!-- Main brass body -->
        <rect x="8" y="4" width="24" height="16" rx="2" fill="url(#brassGradient)" />
        <rect x="9" y="5" width="22" height="3" fill="#e8c36a" opacity="0.4" />

        <!-- Right brass connector -->
        <rect x="32" y="6" width="8" height="12" rx="1" fill="url(#brassGradient)" />
        <rect x="33" y="7" width="6" height="10" rx="1" fill="#d4a853" opacity="0.3" />

        <!-- Red sensor module on top -->
        <rect x="12" y="-4" width="16" height="10" rx="2" fill="${isActive ? activeColor : '#dc2626'}" />
        <rect x="13" y="-3" width="14" height="2" fill="${isActive ? '#fff' : '#ef4444'}" opacity="0.4" />

        <!-- Cable -->
        <path d="M 20 -4 Q 20 -10 25 -12 L 30 -12" stroke="#1e293b" stroke-width="2" fill="none" />
        <circle cx="30" cy="-12" r="2" fill="#374151" />

        <!-- Flow direction arrow inside -->
        <path d="M 14 12 L 22 12 L 20 9 M 22 12 L 20 15" stroke="#8b6914" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Active glow -->
        ${isActive ? svg`
          <rect x="12" y="-4" width="16" height="10" rx="2" fill="${activeColor}" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1s" repeatCount="indefinite" />
          </rect>
        ` : ''}
      </g>
    `;
  }

  private _renderFlowCard(num: 1 | 2, data: ReturnType<typeof this._getFlowData>, name: string, showTemp: boolean) {
    const t = getTranslations(this.hass);
    const flowEntity = num === 1 ? this._config.flow1_flow_entity : this._config.flow2_flow_entity;
    const tempClass = this._getTempClass(data.temp);

    return html`
      <div class="flow-card flow${num} ${data.isFlowing ? 'active' : ''}" @click=${() => flowEntity && fireMoreInfo(this, flowEntity)}>
        <div class="flow-card-header">
          <div class="flow-card-left">
            <div class="flow-icon flow${num}">
              <ha-icon icon="mdi:${data.isFlowing ? 'water' : 'water-off'}"></ha-icon>
            </div>
            <div>
              <div class="flow-name">${name}</div>
              <div class="flow-status ${data.isFlowing ? 'active' : ''}">${data.isFlowing ? `● ${t.waterflowkit.flowing}` : `○ ${t.common.inactive}`}</div>
            </div>
          </div>
          <div class="flow-current">
            <span class="flow-value">${formatNumber(data.flow, 2)}</span>
            <span class="flow-unit">L/min</span>
          </div>
        </div>
        <div class="flow-card-stats">
          <div class="flow-stat">
            <div class="flow-stat-label">${t.waterflowkit.totalConsumption}</div>
            <div class="flow-stat-value">${formatNumber(data.total * 1000, 0)}</div>
            <div class="flow-stat-unit">liter</div>
          </div>
          ${showTemp && data.hasTemp ? html`
            <div class="flow-stat">
              <div class="flow-stat-label">${t.common.temperature}</div>
              <div class="temp-display ${tempClass}">
                <ha-icon icon="mdi:thermometer"></ha-icon>
                <span class="flow-stat-value">${formatNumber(data.temp!, 1)}°C</span>
              </div>
            </div>
          ` : html`
            <div class="flow-stat">
              <div class="flow-stat-label">Status</div>
              <div class="flow-stat-value">${data.isFlowing ? t.common.active : t.common.off}</div>
            </div>
          `}
          <div class="flow-stat">
            <div class="flow-stat-label">${t.waterflowkit.flowRate}</div>
            <div class="flow-stat-value">${formatNumber(data.flow * 60, 1)}</div>
            <div class="flow-stat-unit">L/h</div>
          </div>
        </div>
      </div>
    `;
  }

  public static getConfigElement() {
    return document.createElement('smarthomeshop-waterflowkit-card-editor');
  }

  public static getStubConfig() {
    return {
      show_flow1: true,
      show_flow2: true,
      flow1_show_temp: true,
      flow2_show_temp: true,
      flow1_name: 'Hot water',
      flow2_name: 'Cold water',
    };
  }
}

// Card Editor
@customElement('smarthomeshop-waterflowkit-card-editor')
export class SmartHomeShopWaterFlowKitCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: WaterFlowKitConfig = {};
  @state() private _devices: Array<{ id: string; name: string }> = [];

  static styles = css`
    .form-row {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
      color: var(--primary-text-color);
    }
    select, input[type='text'], input[type='number'] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 14px;
      box-sizing: border-box;
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .checkbox-row input { width: 18px; height: 18px; }
    .checkbox-row label { margin-bottom: 0; font-weight: normal; }
    .info {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 8px;
    }
    .divider {
      height: 1px;
      background: var(--divider-color);
      margin: 16px 0;
    }
    .section-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-text-color);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title ha-icon {
      color: var(--primary-color);
      --mdc-icon-size: 20px;
    }
    .pipe-section {
      background: var(--secondary-background-color);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .pipe-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .pipe-title {
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pipe-title ha-icon {
      --mdc-icon-size: 20px;
    }
    .pipe-title.flow1 ha-icon { color: #0ea5e9; }
    .pipe-title.flow2 ha-icon { color: #22c55e; }
    .info-banner {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(6, 182, 212, 0.15));
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .info-banner ha-icon {
      color: #0ea5e9;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .info-banner-content { flex: 1; }
    .info-banner-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--primary-text-color);
    }
    .info-banner-text {
      font-size: 13px;
      color: var(--secondary-text-color);
      line-height: 1.4;
    }
  `;

  public setConfig(config: WaterFlowKitConfig): void {
    this._config = config;
  }

  protected updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('hass') && this.hass) {
      this._findDevices();
    }
  }

  private _findDevices(): void {
    if (!this.hass?.devices || !this.hass?.entities) return;

    const devices: Array<{ id: string; name: string }> = [];

    for (const [deviceId, device] of Object.entries(this.hass.devices)) {
      const deviceEntities = Object.entries(this.hass.entities)
        .filter(([_, entity]) => (entity as any).device_id === deviceId)
        .map(([entityId]) => entityId);

      // Check for WaterFlowKit sensors
      const hasFlow1 = deviceEntities.some((e) => e.includes('flow1'));
      const hasFlow2 = deviceEntities.some((e) => e.includes('flow2'));

      if (hasFlow1 || hasFlow2) {
        devices.push({
          id: deviceId,
          name: (device as any).name || (device as any).name_by_user || 'WaterFlowKit',
        });
      }
    }

    this._devices = devices;
  }

  private _valueChanged(key: string, value: unknown): void {
    const newConfig = { ...this._config, [key]: value };
    this._config = newConfig;

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _getFilteredEntities(filter: (entityId: string) => boolean): string[] {
    if (!this.hass?.states) return [];
    return Object.keys(this.hass.states)
      .filter(entityId => entityId.startsWith('sensor.') && filter(entityId))
      .sort();
  }

  private _getFlowEntities(): string[] {
    return this._getFilteredEntities(e =>
      e.includes('water') || e.includes('flow') || e.includes('usage')
    );
  }

  private _getTotalEntities(): string[] {
    return this._getFilteredEntities(e =>
      e.includes('consumption') || e.includes('total') || e.includes('water')
    );
  }

  private _getTempEntities(): string[] {
    return this._getFilteredEntities(e =>
      e.includes('temp') || e.includes('temperature')
    );
  }

  protected render() {
    const t = getTranslations(this.hass);
    const flowEntities = this._getFlowEntities();
    const totalEntities = this._getTotalEntities();
    const tempEntities = this._getTempEntities();

    return html`
      <div class="info-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="info-banner-content">
          <div class="info-banner-title">WaterFlowKit</div>
          <div class="info-banner-text">
            ${t.waterflowkit.subtitle}. Configure each pipe individually below.
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Pipe 1 Section -->
      <div class="pipe-section">
        <div class="pipe-header">
          <div class="pipe-title flow1">
            <ha-icon icon="mdi:pipe"></ha-icon>
            ${t.waterflowkit.pipe1}
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_flow1"
              .checked=${this._config.show_flow1 !== false}
              @change=${(e: Event) => this._valueChanged('show_flow1', (e.target as HTMLInputElement).checked)} />
            <label for="show_flow1">${t.common.show}</label>
          </div>
        </div>
        <div class="form-row">
          <label>${t.common.name}</label>
          <input type="text"
            .value=${this._config.flow1_name || ''}
            placeholder="Hot water"
            @input=${(e: Event) => this._valueChanged('flow1_name', (e.target as HTMLInputElement).value || undefined)} />
        </div>
        <div class="form-row">
          <label>Flow sensor</label>
          <select @change=${(e: Event) => this._valueChanged('flow1_flow_entity', (e.target as HTMLSelectElement).value || undefined)}>
            <option value="">-- Select entity --</option>
            ${flowEntities.map(entity => html`
              <option value=${entity} ?selected=${entity === this._config.flow1_flow_entity}>${entity}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${(e: Event) => this._valueChanged('flow1_total_entity', (e.target as HTMLSelectElement).value || undefined)}>
            <option value="">-- Select entity --</option>
            ${totalEntities.map(entity => html`
              <option value=${entity} ?selected=${entity === this._config.flow1_total_entity}>${entity}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <div class="checkbox-row">
            <input type="checkbox" id="flow1_show_temp"
              .checked=${this._config.flow1_show_temp !== false}
              @change=${(e: Event) => this._valueChanged('flow1_show_temp', (e.target as HTMLInputElement).checked)} />
            <label for="flow1_show_temp">${t.waterflowkit.showTemperature}</label>
          </div>
        </div>
        ${this._config.flow1_show_temp !== false ? html`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${(e: Event) => this._valueChanged('flow1_temp_entity', (e.target as HTMLSelectElement).value || undefined)}>
              <option value="">-- Select entity --</option>
              ${tempEntities.map(entity => html`
                <option value=${entity} ?selected=${entity === this._config.flow1_temp_entity}>${entity}</option>
              `)}
            </select>
          </div>
        ` : ''}
      </div>

      <!-- Pipe 2 Section -->
      <div class="pipe-section">
        <div class="pipe-header">
          <div class="pipe-title flow2">
            <ha-icon icon="mdi:pipe"></ha-icon>
            ${t.waterflowkit.pipe2}
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_flow2"
              .checked=${this._config.show_flow2 !== false}
              @change=${(e: Event) => this._valueChanged('show_flow2', (e.target as HTMLInputElement).checked)} />
            <label for="show_flow2">${t.common.show}</label>
          </div>
        </div>
        <div class="form-row">
          <label>${t.common.name}</label>
          <input type="text"
            .value=${this._config.flow2_name || ''}
            placeholder="Cold water"
            @input=${(e: Event) => this._valueChanged('flow2_name', (e.target as HTMLInputElement).value || undefined)} />
        </div>
        <div class="form-row">
          <label>Flow sensor</label>
          <select @change=${(e: Event) => this._valueChanged('flow2_flow_entity', (e.target as HTMLSelectElement).value || undefined)}>
            <option value="">-- Select entity --</option>
            ${flowEntities.map(entity => html`
              <option value=${entity} ?selected=${entity === this._config.flow2_flow_entity}>${entity}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${(e: Event) => this._valueChanged('flow2_total_entity', (e.target as HTMLSelectElement).value || undefined)}>
            <option value="">-- Select entity --</option>
            ${totalEntities.map(entity => html`
              <option value=${entity} ?selected=${entity === this._config.flow2_total_entity}>${entity}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <div class="checkbox-row">
            <input type="checkbox" id="flow2_show_temp"
              .checked=${this._config.flow2_show_temp !== false}
              @change=${(e: Event) => this._valueChanged('flow2_show_temp', (e.target as HTMLInputElement).checked)} />
            <label for="flow2_show_temp">${t.waterflowkit.showTemperature}</label>
          </div>
        </div>
        ${this._config.flow2_show_temp !== false ? html`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${(e: Event) => this._valueChanged('flow2_temp_entity', (e.target as HTMLSelectElement).value || undefined)}>
              <option value="">-- Select entity --</option>
              ${tempEntities.map(entity => html`
                <option value=${entity} ?selected=${entity === this._config.flow2_temp_entity}>${entity}</option>
              `)}
            </select>
          </div>
        ` : ''}
      </div>
    `;
  }
}
