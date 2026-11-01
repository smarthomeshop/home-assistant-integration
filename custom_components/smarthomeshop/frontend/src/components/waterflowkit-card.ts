/**
 * SmartHomeShop WaterFlowKit Card
 * Beautiful animated pipe visualization with flowing water
 * Up to four independent pipes for separate water lines
 */

import { html, css, nothing, svg, LitElement, PropertyValues } from 'lit';
import { state, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { baseStyles } from '../utils/styles';
import { productLogo } from '../utils/product-logos';
import { formatNumber, fireMoreInfo, getEntityValue } from '../utils/helpers';
import { getTranslations } from '../utils/translations';
import type { HomeAssistant } from '../types/home-assistant';
import { debugLog } from '../utils/debug';
import { CardLocalizationController } from '../utils/runtime-translations';

interface WaterFlowKitConfig {
  device_id?: string;
  show_header?: boolean;
  show_status?: boolean;
  show_pipe_visualization?: boolean;
  show_flow_cards?: boolean;
  show_total_consumption?: boolean;
  show_hourly_rate?: boolean;
  flow1_flow_entity?: string;
  flow1_total_entity?: string;
  flow1_temp_entity?: string;
  flow1_show_temp?: boolean;
  flow2_flow_entity?: string;
  flow2_total_entity?: string;
  flow2_temp_entity?: string;
  flow2_show_temp?: boolean;
  flow3_flow_entity?: string;
  flow3_total_entity?: string;
  flow3_temp_entity?: string;
  flow3_show_temp?: boolean;
  flow4_flow_entity?: string;
  flow4_total_entity?: string;
  flow4_temp_entity?: string;
  flow4_show_temp?: boolean;
  flow1_name?: string;
  flow2_name?: string;
  flow3_name?: string;
  flow4_name?: string;
  show_flow1?: boolean;
  show_flow2?: boolean;
  show_flow3?: boolean;
  show_flow4?: boolean;
}

type FlowNum = 1 | 2 | 3 | 4;

interface FlowData {
  flow: number;
  total: number;
  temp: number | null;
  hasTemp: boolean;
  isFlowing: boolean;
}

const FLOW_NUMS: FlowNum[] = [1, 2, 3, 4];
const PIPE_ROW_HEIGHT = 70;

const FLOW_COLORS: Record<FlowNum, { main: string; light: string; pale: string }> = {
  1: { main: '#0ea5e9', light: '#38bdf8', pale: '#7dd3fc' },
  2: { main: '#22c55e', light: '#4ade80', pale: '#86efac' },
  3: { main: '#f59e0b', light: '#fbbf24', pale: '#fcd34d' },
  4: { main: '#a855f7', light: '#c084fc', pale: '#d8b4fe' },
};

const BUBBLE_STARTS: Record<FlowNum, [number, number, number]> = {
  1: [80, 120, 160],
  2: [90, 140, 180],
  3: [70, 130, 170],
  4: [100, 150, 190],
};

const BUBBLE_SECONDS: Record<FlowNum, [number, number, number]> = {
  1: [1.5, 1.8, 2],
  2: [1.6, 1.9, 2.1],
  3: [1.7, 2, 2.2],
  4: [1.4, 1.7, 1.9],
};

export class SmartHomeShopWaterFlowKitCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  protected readonly _localization = new CardLocalizationController(this, () => this.hass);
  @state() private _config: WaterFlowKitConfig = {};
  private _detected = false;

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
        background: color-mix(in srgb, var(--info-color) 15%, transparent);
        color: var(--info-color);
      }
      .status-badge.inactive {
        background: var(--secondary-background-color);
        color: var(--secondary-text-color);
      }

      /* Pipe visualization container */
      .pipe-container {
        position: relative;
        background: var(--shs-surface);
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 12px;
        overflow: hidden;
        border: 1px solid var(--shs-outline);
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
      .water-flow.flow3 {
        stroke: url(#waterGradient3);
        filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
      }
      .water-flow.flow4 {
        stroke: url(#waterGradient4);
        filter: drop-shadow(0 0 4px rgba(192, 132, 252, 0.5));
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
      .pipe-value.flow3 { fill: #f59e0b; }
      .pipe-value.flow4 { fill: #a855f7; }
      .pipe-unit { font-size: 10px; fill: var(--secondary-text-color); opacity: 0.7; }
      .temp-badge { font-size: 11px; font-weight: 600; }
      .temp-badge.cold { fill: #38bdf8; }
      .temp-badge.warm { fill: #fbbf24; }
      .temp-badge.hot { fill: #ef4444; }

      /* Flow cards */
      .flow-card {
        background: var(--shs-surface);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: background-color 180ms ease-out, border-color 180ms ease-out;
        border: 1px solid var(--shs-outline);
      }

      .flow-card:last-child { margin-bottom: 0; }
      .flow-card:hover {
        background: var(--shs-surface-hover);
        border-color: color-mix(in srgb, var(--info-color) 30%, var(--divider-color));
      }

      .flow-card.active {
        border-color: color-mix(in srgb, var(--info-color) 55%, var(--divider-color));
        background: color-mix(in srgb, var(--info-color) 9%, var(--card-background-color));
      }

      .flow-card.flow2.active {
        border-color: color-mix(in srgb, var(--success-color) 55%, var(--divider-color));
        background: color-mix(in srgb, var(--success-color) 9%, var(--card-background-color));
      }

      .flow-card.flow3.active {
        border-color: color-mix(in srgb, #f59e0b 55%, var(--divider-color));
        background: color-mix(in srgb, #f59e0b 9%, var(--card-background-color));
      }

      .flow-card.flow4.active {
        border-color: color-mix(in srgb, #a855f7 55%, var(--divider-color));
        background: color-mix(in srgb, #a855f7 9%, var(--card-background-color));
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

      .flow-icon.flow1 { background: color-mix(in srgb, var(--info-color) 14%, transparent); color: var(--info-color); }
      .flow-icon.flow2 { background: color-mix(in srgb, var(--success-color) 14%, transparent); color: var(--success-color); }
      .flow-icon.flow3 { background: color-mix(in srgb, #f59e0b 14%, transparent); color: #f59e0b; }
      .flow-icon.flow4 { background: color-mix(in srgb, #a855f7 14%, transparent); color: #a855f7; }
      .flow-icon ha-icon { --mdc-icon-size: 22px; color: currentColor; }

      .flow-name { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
      .flow-status { font-size: 11px; color: var(--secondary-text-color); opacity: 0.7; }
      .flow-status.active { color: #22c55e; opacity: 1; }

      .flow-current { text-align: right; }
      .flow-value { font-size: 24px; font-weight: 700; color: var(--primary-text-color); line-height: 1; }
      .flow-unit { font-size: 12px; color: var(--secondary-text-color); margin-left: 2px; }

      .flow-card-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
        gap: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--shs-outline);
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

      @container (max-width: 430px) {
        .pipe-container {
          padding: 10px;
        }

        .flow-card {
          padding: 12px;
        }

        .flow-value {
          font-size: 21px;
        }

        .flow-card-stats {
          gap: 8px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .water-flow.active,
        .header-icon.flowing {
          animation: none;
        }
      }
    `
  ];

  public setConfig(config: WaterFlowKitConfig): void {
    this._config = {
      show_header: true,
      show_status: true,
      show_pipe_visualization: true,
      show_flow_cards: true,
      show_total_consumption: true,
      show_hourly_rate: true,
      show_flow1: true,
      show_flow2: true,
      ...config,
    };
  }

  public getCardSize(): number {
    return 5;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('hass') && this.hass && !this._detected) {
      this._autoDetectEntities();
    }
  }

  private _autoDetectEntities(): void {
    if (!this.hass) return;

    const entities = Object.keys(this.hass.states);
    const updates: Partial<WaterFlowKitConfig> = {};
    // A chosen Flow1 sensor pins the kit, so a second kit cannot fill the other pipes.
    const kitPrefix = this._config.flow1_flow_entity?.split('flow1')[0];

    // Find WaterFlowKit entities by searching for "waterflowkit" and "flow1" to "flow4"
    for (const entityId of entities) {
      const lower = entityId.toLowerCase();
      if (!lower.includes('waterflowkit')) continue;
      if (kitPrefix && !entityId.startsWith(kitPrefix)) continue;

      for (const num of FLOW_NUMS) {
        if (!lower.includes(`flow${num}`)) continue;
        if (lower.includes('current') && lower.includes('usage')) {
          this._fillEntity(updates, `flow${num}_flow_entity` as const, entityId);
        } else if (lower.includes('total') && lower.includes('consumption')) {
          this._fillEntity(updates, `flow${num}_total_entity` as const, entityId);
        } else if (lower.includes('temperature')) {
          this._fillEntity(updates, `flow${num}_temp_entity` as const, entityId);
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      this._config = { ...this._config, ...updates };
      debugLog('WaterFlowKit: Auto-detected entities:', updates);
    }
    this._detected = Boolean(this._config.flow1_flow_entity);
  }

  private _fillEntity(
    updates: Partial<WaterFlowKitConfig>,
    key: `flow${FlowNum}_${'flow' | 'total' | 'temp'}_entity`,
    entityId: string
  ): void {
    if (!this._config[key]) {
      updates[key] = entityId;
    }
  }

  private _getFlowData(sensorNum: FlowNum): FlowData {
    const flowEntity = this._config[`flow${sensorNum}_flow_entity` as const];
    const totalEntity = this._config[`flow${sensorNum}_total_entity` as const];
    const tempEntity = this._config[`flow${sensorNum}_temp_entity` as const];

    const flow = getEntityValue(this.hass, flowEntity) ?? 0;
    const total = getEntityValue(this.hass, totalEntity) ?? 0;
    const tempValue = getEntityValue(this.hass, tempEntity);

    // Temperature is valid if > -10°C
    const hasTemp = tempValue !== null && tempValue > -10;
    const temp = hasTemp ? tempValue : null;
    const isFlowing = flow > 0.01;

    return { flow, total, temp, hasTemp, isFlowing };
  }

  // Flow 3 and 4 exist on every V2 board, also without a sensor connected. They
  // stay out of sight until they measure water, unless the card setting says otherwise.
  private _isFlowVisible(num: FlowNum): boolean {
    const setting = this._config[`show_flow${num}` as const];
    if (num <= 2 || setting !== undefined) return setting !== false;
    const data = this._getFlowData(num);
    return data.total > 0 || data.isFlowing;
  }

  private _getFlowName(num: FlowNum): string {
    return (
      this._config[`flow${num}_name` as const] ||
      getTranslations(this.hass).waterflowkit[`pipe${num}` as const]
    );
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
    const flows = FLOW_NUMS.filter(num => this._isFlowVisible(num)).map(num => ({
      num,
      data: this._getFlowData(num),
      name: this._getFlowName(num),
      showTemp: this._config[`flow${num}_show_temp` as const] !== false,
    }));

    const activeFlows = flows.filter(flow => flow.data.isFlowing).length;
    const totalFlow = flows.reduce((sum, flow) => sum + flow.data.flow, 0);

    return html`
      <ha-card>
        <div class="card-content">
          ${this._config.show_header !== false ? html`
            <div class="header">
              <div class="header-left">
                <div class="header-icon ${activeFlows > 0 ? 'flowing' : ''}">
                  ${productLogo('waterflowkit')
                    ? unsafeHTML(productLogo('waterflowkit')!)
                    : html`<ha-icon icon="mdi:pipe"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${t.waterflowkit.title}</h2>
                  <div class="header-subtitle">${t.waterflowkit.subtitle}</div>
                </div>
              </div>
              ${this._config.show_status !== false ? html`
                <div class="status-badge ${activeFlows > 0 ? 'flowing' : 'inactive'}">
                  <ha-icon icon="${activeFlows > 0 ? 'mdi:water' : 'mdi:water-off'}"></ha-icon>
                  <span>${activeFlows > 0
                    ? `${formatNumber(totalFlow, 2)} L/min`
                    : t.waterflowkit.noFlow}</span>
                </div>
              ` : nothing}
            </div>
          ` : nothing}

          ${this._config.show_pipe_visualization !== false ? html`
            <div class="pipe-container">
              ${this._renderPipesSVG(flows)}
            </div>
          ` : nothing}

          ${this._config.show_flow_cards !== false
            ? flows.map(flow => this._renderFlowCard(flow.num, flow.data, flow.name, flow.showTemp))
            : nothing}
        </div>
      </ha-card>
    `;
  }

  private _renderPipesSVG(
    flows: {
      num: FlowNum;
      data: FlowData;
      name: string;
      showTemp: boolean;
    }[]
  ) {
    const height = Math.max(flows.length, 1) * PIPE_ROW_HEIGHT;

    return svg`
      <svg class="pipes-svg" viewBox="0 0 360 ${height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <!-- Water flow gradients -->
          ${FLOW_NUMS.map(num => svg`
            <linearGradient id="waterGradient${num}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:${FLOW_COLORS[num].main};stop-opacity:0.9" />
              <stop offset="50%" style="stop-color:${FLOW_COLORS[num].light};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${FLOW_COLORS[num].main};stop-opacity:0.9" />
            </linearGradient>
          `)}
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

        ${flows.map((flow, index) => this._renderPipe(
          flow.num,
          flow.data,
          flow.name,
          flow.showTemp,
          PIPE_ROW_HEIGHT / 2 + index * PIPE_ROW_HEIGHT
        ))}
      </svg>
    `;
  }

  private _renderPipe(
    num: FlowNum,
    data: FlowData,
    name: string,
    showTemp: boolean,
    y: number
  ) {
    return svg`
      <!-- Pipe -->
      <path class="pipe" d="M 0 ${y} L 360 ${y}" />
      <path class="pipe-inner" d="M 0 ${y} L 360 ${y}" />

      <!-- Animated water flow -->
      <path class="water-flow flow${num} ${data.isFlowing ? 'active' : ''} ${this._getFlowSpeed(data.flow)}" d="M 0 ${y} L 360 ${y}" />

      <!-- Water bubbles animation when flowing -->
      ${data.isFlowing ? this._renderBubbles(num, y) : ''}

      <!-- YF-Sensor SVG -->
      ${this._renderYFSensor(55, y, data.isFlowing, num)}

      <!-- Labels -->
      <text class="pipe-label" x="110" y="${y - 15}">${name.toUpperCase()}</text>
      <text class="pipe-value flow${num}" x="220" y="${y + 5}">${formatNumber(data.flow, 2)}</text>
      <text class="pipe-unit" x="265" y="${y + 5}">L/min</text>
      ${showTemp && data.hasTemp ? svg`
        <text class="temp-badge ${this._getTempClass(data.temp)}" x="320" y="${y + 5}">${formatNumber(data.temp!, 1)}°C</text>
      ` : ''}
    `;
  }

  private _renderBubbles(num: FlowNum, y: number) {
    const { light, pale } = FLOW_COLORS[num];
    const [start1, start2, start3] = BUBBLE_STARTS[num];
    const [seconds1, seconds2, seconds3] = BUBBLE_SECONDS[num];
    const drift = num % 2 === 0 ? 2 : -2;

    return svg`
      <circle class="water-bubble" cx="${start1}" cy="${y}" r="3" fill="${light}" opacity="0.6">
        <animate attributeName="cx" from="${start1}" to="${start1 + 280}" dur="${seconds1}s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.8;0.4;0.6" dur="${seconds1}s" repeatCount="indefinite" />
      </circle>
      <circle class="water-bubble" cx="${start2}" cy="${y + drift}" r="2" fill="${pale}" opacity="0.5">
        <animate attributeName="cx" from="${start2}" to="${start2 + 280}" dur="${seconds2}s" repeatCount="indefinite" />
      </circle>
      <circle class="water-bubble" cx="${start3}" cy="${y - drift}" r="2.5" fill="${light}" opacity="0.5">
        <animate attributeName="cx" from="${start3}" to="${start3 + 280}" dur="${seconds3}s" repeatCount="indefinite" />
      </circle>
    `;
  }

  // Render YF-Sensor icon (brass flow sensor with red module)
  private _renderYFSensor(x: number, y: number, isActive: boolean, flowNum: FlowNum) {
    const activeColor = FLOW_COLORS[flowNum].main;

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

  private _renderFlowCard(num: FlowNum, data: FlowData, name: string, showTemp: boolean) {
    const t = getTranslations(this.hass);
    const flowEntity = this._config[`flow${num}_flow_entity` as const];
    const tempClass = this._getTempClass(data.temp);
    const showTotal = this._config.show_total_consumption !== false;
    const showTemperature = showTemp && data.hasTemp;
    const showHourlyRate = this._config.show_hourly_rate !== false;
    const hasStats = showTotal || showTemperature || showHourlyRate;

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
        ${hasStats ? html`
          <div class="flow-card-stats">
            ${showTotal ? html`
              <div class="flow-stat">
                <div class="flow-stat-label">${t.waterflowkit.totalConsumption}</div>
                <div class="flow-stat-value">${formatNumber(data.total * 1000, 0)}</div>
                <div class="flow-stat-unit">liter</div>
              </div>
            ` : nothing}
            ${showTemperature ? html`
              <div class="flow-stat">
                <div class="flow-stat-label">${t.common.temperature}</div>
                <div class="temp-display ${tempClass}">
                  <ha-icon icon="mdi:thermometer"></ha-icon>
                  <span class="flow-stat-value">${formatNumber(data.temp!, 1)}°C</span>
                </div>
              </div>
            ` : nothing}
            ${showHourlyRate ? html`
              <div class="flow-stat">
                <div class="flow-stat-label">${t.waterflowkit.flowRate}</div>
                <div class="flow-stat-value">${formatNumber(data.flow * 60, 1)}</div>
                <div class="flow-stat-unit">L/h</div>
              </div>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `;
  }

  public static getConfigElement() {
    return document.createElement('smarthomeshop-waterflowkit-card-editor');
  }

  public static getStubConfig() {
    return {
      show_header: true,
      show_status: true,
      show_pipe_visualization: true,
      show_flow_cards: true,
      show_total_consumption: true,
      show_hourly_rate: true,
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
export class SmartHomeShopWaterFlowKitCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  protected readonly _localization = new CardLocalizationController(this, () => this.hass);
  @state() private _config: WaterFlowKitConfig = {};

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
    .option-group {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: color-mix(
        in srgb,
        var(--secondary-background-color) 72%,
        var(--card-background-color)
      );
      margin-bottom: 10px;
    }
    .nested-options {
      margin: 8px 0 0 25px;
      padding: 8px 0 0 12px;
      border-left: 2px solid var(--divider-color);
    }
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
    .pipe-title.flow3 ha-icon { color: #f59e0b; }
    .pipe-title.flow4 ha-icon { color: #a855f7; }
    .info-banner {
      background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color));
      border: 1px solid color-mix(in srgb, var(--primary-color) 28%, var(--divider-color));
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

      <div class="form-row">
        <div class="section-title">
          <ha-icon icon="mdi:view-dashboard-outline"></ha-icon>
          Visible content
        </div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_header"
              .checked=${this._config.show_header !== false}
              @change=${(e: Event) => this._valueChanged('show_header', (e.target as HTMLInputElement).checked)} />
            <label for="show_header">Header</label>
          </div>
          ${this._config.show_header !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_status"
                  .checked=${this._config.show_status !== false}
                  @change=${(e: Event) => this._valueChanged('show_status', (e.target as HTMLInputElement).checked)} />
                <label for="show_status">Combined flow status</label>
              </div>
            </div>
          ` : nothing}
        </div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_pipe_visualization"
              .checked=${this._config.show_pipe_visualization !== false}
              @change=${(e: Event) => this._valueChanged('show_pipe_visualization', (e.target as HTMLInputElement).checked)} />
            <label for="show_pipe_visualization">Pipe visualization</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="show_flow_cards"
              .checked=${this._config.show_flow_cards !== false}
              @change=${(e: Event) => this._valueChanged('show_flow_cards', (e.target as HTMLInputElement).checked)} />
            <label for="show_flow_cards">Pipe detail cards</label>
          </div>
          ${this._config.show_flow_cards !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_total_consumption"
                  .checked=${this._config.show_total_consumption !== false}
                  @change=${(e: Event) => this._valueChanged('show_total_consumption', (e.target as HTMLInputElement).checked)} />
                <label for="show_total_consumption">Total consumption</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_hourly_rate"
                  .checked=${this._config.show_hourly_rate !== false}
                  @change=${(e: Event) => this._valueChanged('show_hourly_rate', (e.target as HTMLInputElement).checked)} />
                <label for="show_hourly_rate">Calculated hourly rate</label>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>

      <div class="divider"></div>

      ${FLOW_NUMS.filter(num => this._hasLine(num)).map(num => this._renderPipeSection(num, flowEntities, totalEntities, tempEntities))}
    `;
  }

  // Flow 3 and 4 only exist on the V2 board.
  private _hasLine(num: FlowNum): boolean {
    return num <= 2 || Object.keys(this.hass?.states ?? {}).some(entityId => entityId.includes(`flow${num}`));
  }

  private _renderPipeSection(
    num: FlowNum,
    flowEntities: string[],
    totalEntities: string[],
    tempEntities: string[]
  ) {
    const t = getTranslations(this.hass);
    const showKey = `show_flow${num}` as const;
    const nameKey = `flow${num}_name` as const;
    const flowKey = `flow${num}_flow_entity` as const;
    const totalKey = `flow${num}_total_entity` as const;
    const tempKey = `flow${num}_temp_entity` as const;
    const showTempKey = `flow${num}_show_temp` as const;
    const placeholders: Partial<Record<FlowNum, string>> = { 1: 'Hot water', 2: 'Cold water' };

    return html`
      <div class="pipe-section">
        <div class="pipe-header">
          <div class="pipe-title flow${num}">
            <ha-icon icon="mdi:pipe"></ha-icon>
            ${t.waterflowkit[`pipe${num}` as const]}
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id=${showKey}
              .checked=${this._config[showKey] !== false}
              @change=${(e: Event) => this._valueChanged(showKey, (e.target as HTMLInputElement).checked)} />
            <label for=${showKey}>${t.common.show}</label>
          </div>
        </div>
        <div class="form-row">
          <label>${t.common.name}</label>
          <input type="text"
            .value=${this._config[nameKey] || ''}
            placeholder=${placeholders[num] ?? ''}
            @input=${(e: Event) => this._valueChanged(nameKey, (e.target as HTMLInputElement).value || undefined)} />
        </div>
        <div class="form-row">
          <label>Flow sensor</label>
          <select @change=${(e: Event) => this._valueChanged(flowKey, (e.target as HTMLSelectElement).value || undefined)}>
            <option value="">-- Select entity --</option>
            ${flowEntities.map(entity => html`
              <option value=${entity} ?selected=${entity === this._config[flowKey]}>${entity}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <label>Total consumption sensor</label>
          <select @change=${(e: Event) => this._valueChanged(totalKey, (e.target as HTMLSelectElement).value || undefined)}>
            <option value="">-- Select entity --</option>
            ${totalEntities.map(entity => html`
              <option value=${entity} ?selected=${entity === this._config[totalKey]}>${entity}</option>
            `)}
          </select>
        </div>
        <div class="form-row">
          <div class="checkbox-row">
            <input type="checkbox" id=${showTempKey}
              .checked=${this._config[showTempKey] !== false}
              @change=${(e: Event) => this._valueChanged(showTempKey, (e.target as HTMLInputElement).checked)} />
            <label for=${showTempKey}>${t.waterflowkit.showTemperature}</label>
          </div>
        </div>
        ${this._config[showTempKey] !== false ? html`
          <div class="form-row">
            <label>Temperature sensor</label>
            <select @change=${(e: Event) => this._valueChanged(tempKey, (e.target as HTMLSelectElement).value || undefined)}>
              <option value="">-- Select entity --</option>
              ${tempEntities.map(entity => html`
                <option value=${entity} ?selected=${entity === this._config[tempKey]}>${entity}</option>
              `)}
            </select>
          </div>
        ` : ''}
      </div>
    `;
  }
}
