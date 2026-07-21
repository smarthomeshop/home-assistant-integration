/**
 * SmartHomeShop Radar Card
 * For UltimateSensor and UltimateSensor Mini
 * Features: Presence detection, Temperature, Humidity, CO2 with air quality indicator
 */

import { LitElement, html, css, nothing, PropertyValues, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Room3DRenderer, collectWorldTargets, Scene3D } from '../utils/room3d';
import { relativeTime } from '../utils/helpers';
import { productLogo } from '../utils/product-logos';
import './sensor-settings';
import { debugLog } from '../utils/debug';

interface RadarCardConfig {
  device_id?: string;
  entity_prefix?: string;
  max_distance?: number;
  show_header?: boolean;
  show_status?: boolean;
  show_radar?: boolean;
  show_target_details?: boolean;
  show_environment?: boolean;
  show_zones?: boolean;
  show_grid?: boolean;
  title?: string;
  show_air_quality?: boolean;
  show_pm_gauge?: boolean;
  show_pm_values?: boolean;
  show_nox?: boolean;
  show_room_score?: boolean;
  show_temperature?: boolean;
  show_humidity?: boolean;
  show_co2?: boolean;
  show_co2_bar?: boolean;
  show_illuminance?: boolean;
  show_voc?: boolean;
  view_mode?: 'radar' | 'room';
  room_view_mode?: '2d' | '3d';
}

interface Target {
  x: number;
  y: number;
  active: boolean;
  distance: number;
}

interface Zone {
  beginX: number;
  beginY: number;
  endX: number;
  endY: number;
}

interface EnvironmentData {
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  illuminance: number | null;
  voc: number | null;
  nox: number | null;
  // SPS30 Particulate Matter
  pm1_0: number | null;
  pm2_5: number | null;
  pm4_0: number | null;
  pm10: number | null;
  typical_particle_size: number | null;
}

interface EntityIds {
  temperature?: string;
  humidity?: string;
  co2?: string;
  illuminance?: string;
  voc?: string;
  nox?: string;
  pm1_0?: string;
  pm2_5?: string;
  pm4_0?: string;
  pm10?: string;
  typical_particle_size?: string;
  targets: string[];
}

@customElement('smarthomeshop-ultimatesensor-card')
export class SmartHomeShopUltimateSensorCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: RadarCardConfig = {};
  @state() private _targets: Target[] = [];
  @state() private _zones: Zone[] = [];
  @state() private _environment: EnvironmentData = {
    temperature: null,
    humidity: null,
    co2: null,
    illuminance: null,
    voc: null,
    nox: null,
    pm1_0: null,
    pm2_5: null,
    pm4_0: null,
    pm10: null,
    typical_particle_size: null,
  };
  @state() private _entityPrefix: string = '';
  @state() private _deviceName: string = '';
  @state() private _entityIds: EntityIds = { targets: [] };
  @state() private _showSettings: boolean = false;
  @state() private _rooms: any[] = [];
  @state() private _selectedRoomId: string | null = null;
  @state() private _roomViewMode: '2d' | '3d' = '2d';

  // Shared 3D renderer (identical to the Room Designer panel)
  private _room3d = new Room3DRenderer();
  private _isDragging3D = false;
  private _lastMouseX = 0;
  private _lastMouseY = 0;

  private _updateInterval?: number;

  private _fireMoreInfo(entityId?: string): void {
    if (!entityId) return;
    const event = new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  static styles = css`
    :host {
      display: block;
      container-type: inline-size;
      --shs-surface: color-mix(
        in srgb,
        var(--secondary-background-color) 78%,
        var(--card-background-color)
      );
      --shs-surface-hover: color-mix(
        in srgb,
        var(--primary-color) 6%,
        var(--shs-surface)
      );
      --shs-outline: color-mix(in srgb, var(--divider-color) 88%, transparent);
    }
    ha-card {
      padding: 14px;
      overflow: hidden;
    }

    /* Header */
    /* Shared card header (aligned with the water cards) */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .header-icon {
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--primary-color) 15%, transparent);
      color: var(--primary-color);
      transition: transform 180ms ease-out, background-color 180ms ease-out;
    }
    .header-icon ha-icon {
      --mdc-icon-size: 24px;
    }
    .header-icon svg {
      width: 26px;
      height: 26px;
      display: block;
    }
    .header-icon.active {
      animation: pulse 1.5s ease-in-out infinite;
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .header-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0;
      line-height: 1.2;
    }
    .header-subtitle {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      margin-top: 2px;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 0 0 auto;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      transition: background-color 180ms ease-out, color 180ms ease-out;
    }
    .status-badge ha-icon {
      --mdc-icon-size: 16px;
    }
    .status-ok {
      background: color-mix(in srgb, var(--success-color) 15%, transparent);
      color: var(--success-color);
    }
    .status-active {
      background: color-mix(in srgb, var(--info-color) 15%, transparent);
      color: var(--info-color);
    }
    .status-alert {
      background: color-mix(in srgb, var(--error-color) 15%, transparent);
      color: var(--error-color);
      animation: blink 1s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .view-toggle {
      display: flex;
      background: var(--secondary-background-color, rgba(255,255,255,0.1));
      border-radius: 8px;
      padding: 4px;
      gap: 4px;
    }
    .view-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      color: var(--secondary-text-color);
      transition: background-color 180ms ease-out, color 180ms ease-out;
    }
    .view-btn.active {
      background: var(--primary-color, #3b82f6);
      color: white;
    }
    .view-btn:hover:not(.active) {
      background: color-mix(in srgb, var(--primary-color) 7%, transparent);
    }
    .room-selector {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin: 12px 16px;
    }
    .room-btn {
      padding: 6px 12px;
      background: var(--secondary-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      color: var(--secondary-text-color);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .room-btn.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    /* Room Quality Score Section */
    .room-score-section {
      background: var(--shs-surface);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid var(--shs-outline);
    }
    .room-score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .room-score-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .room-score-title ha-icon {
      color: var(--success-color);
      --mdc-icon-size: 18px;
    }
    .room-score-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .room-score-main {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .room-score-gauge {
      position: relative;
      width: 140px;
      height: 80px;
    }
    .score-arc {
      width: 100%;
      height: 100%;
    }
    .room-score-value {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.5rem;
      font-weight: 700;
    }
    .room-score-recommendations {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
    }
    .recommendation-item {
      display: flex;
      align-items: center;
      gap: 8px;
      background: color-mix(in srgb, var(--warning-color) 11%, transparent);
      border: 1px solid color-mix(in srgb, var(--warning-color) 28%, var(--divider-color));
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      color: var(--primary-text-color);
    }
    .recommendation-item ha-icon {
      --mdc-icon-size: 16px;
      color: var(--warning-color);
      flex-shrink: 0;
    }
    .recommendation-item.positive {
      background: color-mix(in srgb, var(--success-color) 11%, transparent);
      border-color: color-mix(in srgb, var(--success-color) 28%, var(--divider-color));
    }
    .recommendation-item.positive ha-icon {
      color: var(--success-color);
    }

    /* Environment Section */
    .environment-section {
      margin-bottom: 16px;
    }
    .environment-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .env-card {
      background: var(--shs-surface);
      border: 1px solid var(--shs-outline);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      transition: background-color 180ms ease-out, border-color 180ms ease-out;
      cursor: pointer;
    }
    .env-card:hover {
      background: var(--shs-surface-hover);
      border-color: color-mix(in srgb, var(--primary-color) 25%, var(--divider-color));
    }
    .env-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .env-card-header ha-icon {
      --mdc-icon-size: 20px;
    }
    .env-card-label {
      font-size: 0.75rem;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .env-card-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-text-color);
    }
    .env-card-value span {
      font-size: 0.9rem;
      font-weight: 400;
      color: var(--secondary-text-color);
    }
    .env-card.temperature ha-icon { color: #ff5722; }
    .env-card.humidity ha-icon { color: #2196f3; }
    .env-card.co2 ha-icon { color: #4caf50; }
    .env-card.illuminance ha-icon { color: #ffc107; }
    .env-card.voc ha-icon { color: #9c27b0; }

    /* CO2 Quality Bar */
    .co2-quality {
      margin-top: 12px;
      padding: 14px;
      background: var(--shs-surface);
      border: 1px solid var(--shs-outline);
      border-radius: 12px;
      cursor: pointer;
      transition: background-color 180ms ease-out, border-color 180ms ease-out;
    }
    .co2-quality:hover {
      background: var(--shs-surface-hover);
      border-color: color-mix(in srgb, var(--primary-color) 25%, var(--divider-color));
    }
    .co2-quality-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .co2-quality-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .co2-quality-label ha-icon {
      --mdc-icon-size: 20px;
      color: #26a69a;
    }
    .co2-quality-status {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
    }
    .co2-quality-status.excellent { background: color-mix(in srgb, #4caf50 14%, transparent); color: #4caf50; }
    .co2-quality-status.good { background: color-mix(in srgb, #43a047 14%, transparent); color: #43a047; }
    .co2-quality-status.moderate { background: color-mix(in srgb, #f57c00 14%, transparent); color: #f57c00; }
    .co2-quality-status.poor { background: color-mix(in srgb, #d32f2f 14%, transparent); color: #d32f2f; }
    .co2-quality-status.unhealthy { background: color-mix(in srgb, #c2185b 14%, transparent); color: #c2185b; }

    .co2-bar-container {
      position: relative;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      background: linear-gradient(90deg,
        #4caf50 0%,
        #8bc34a 25%,
        #ffeb3b 40%,
        #ff9800 60%,
        #f44336 80%,
        #9c27b0 100%
      );
    }
    .co2-bar-indicator {
      position: absolute;
      top: -4px;
      width: 4px;
      height: 20px;
      background: var(--primary-text-color);
      border-radius: 2px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: left 0.5s ease;
    }
    .co2-bar-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 0.65rem;
      color: var(--secondary-text-color);
    }

    /* Air Quality Section - SPS30 */
    .air-quality-section {
      margin-top: 16px;
      padding: 16px;
      background: var(--shs-surface);
      border-radius: 12px;
      border: 1px solid var(--shs-outline);
    }
    .air-quality-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .air-quality-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .air-quality-title ha-icon {
      color: #26a69a;
      --mdc-icon-size: 20px;
    }
    .air-quality-status {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .air-quality-status.excellent { background: color-mix(in srgb, #4caf50 14%, transparent); color: #4caf50; }
    .air-quality-status.good { background: color-mix(in srgb, #43a047 14%, transparent); color: #43a047; }
    .air-quality-status.moderate { background: color-mix(in srgb, #f9a825 14%, transparent); color: #f9a825; }
    .air-quality-status.unhealthy-sensitive { background: color-mix(in srgb, #ef6c00 14%, transparent); color: #ef6c00; }
    .air-quality-status.unhealthy { background: color-mix(in srgb, #e53935 14%, transparent); color: #e53935; }
    .air-quality-status.very-unhealthy { background: color-mix(in srgb, #8e24aa 14%, transparent); color: #8e24aa; }
    .air-quality-status.hazardous { background: color-mix(in srgb, #880e4f 14%, transparent); color: #ad476e; }

    /* PM Gauge */
    .pm-gauge-container {
      margin-bottom: 20px;
      cursor: pointer;
    }
    .pm-gauge-container:hover {
      opacity: 0.9;
    }
    .pm-gauge-label {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .pm-gauge-label-text {
      font-size: 0.85rem;
      color: var(--secondary-text-color);
    }
    .pm-gauge-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .pm-gauge-value span {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--secondary-text-color);
      margin-left: 4px;
    }
    .pm-gauge-bar {
      height: 12px;
      background: linear-gradient(to right,
        #4caf50 0%,
        #4caf50 8.3%,
        #8bc34a 8.3%,
        #8bc34a 16.6%,
        #ffeb3b 16.6%,
        #ffeb3b 25%,
        #ff9800 25%,
        #ff9800 33.3%,
        #f44336 33.3%,
        #f44336 50%,
        #9c27b0 50%,
        #9c27b0 66.6%,
        #880e4f 66.6%,
        #880e4f 100%);
      border-radius: 6px;
      position: relative;
      overflow: visible;
    }
    .pm-gauge-indicator {
      position: absolute;
      top: -4px;
      width: 4px;
      height: 20px;
      background: var(--primary-text-color);
      border-radius: 2px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      transition: left 0.5s ease;
    }
    .pm-gauge-scale {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 0.6rem;
      color: var(--secondary-text-color);
    }

    /* PM Grid for all values */
    .pm-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .pm-item {
      background: color-mix(in srgb, var(--card-background-color) 88%, var(--secondary-background-color));
      padding: 12px 8px;
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      transition: background-color 180ms ease-out, border-color 180ms ease-out;
      border: 1px solid var(--shs-outline);
    }
    .pm-item:hover {
      background: var(--shs-surface-hover);
      border-color: color-mix(in srgb, var(--primary-color) 25%, var(--divider-color));
    }
    .pm-item-label {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
      font-weight: 500;
    }
    .pm-item-value {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .pm-item-unit {
      font-size: 0.6rem;
      color: var(--secondary-text-color);
      display: block;
      margin-top: 2px;
    }
    .pm-item.pm1 .pm-item-value { color: #26a69a; }
    .pm-item.pm2_5 .pm-item-value { color: #42a5f5; }
    .pm-item.pm4 .pm-item-value { color: #7e57c2; }
    .pm-item.pm10 .pm-item-value { color: #ef5350; }

    /* VOC/NOx section */
    .voc-nox-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 12px;
    }
    .env-card.nox ha-icon { color: #ff7043; }

    /* Radar Section */
    .radar-section {
      margin-top: 16px;
    }

    .room-view-container {
      padding: 16px;
    }
    .room-view-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    .room-view-toggle {
      display: flex;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
    }
    .room-view-toggle button {
      padding: 4px 10px;
      border: none;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      color: var(--secondary-text-color);
      transition: all 0.2s;
    }
    .room-view-toggle button.active {
      background: var(--primary-color, #3b82f6);
      color: white;
    }
    .canvas-3d {
      width: 100%;
      height: 300px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      cursor: grab;
    }
    .canvas-3d:active {
      cursor: grabbing;
    }
    .no-room-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .no-room-message ha-icon {
      --mdc-icon-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .radar-container {
      position: relative;
      width: 100%;
      height: 200px;
      background: linear-gradient(180deg, #0d1b2a 0%, #1b263b 50%, #0d1b2a 100%);
      border-radius: 12px;
      overflow: hidden;
    }
    .radar-canvas {
      width: 100%;
      height: 100%;
    }

    /* Target Info */
    .target-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 12px;
    }
    .target-info-item {
      background: var(--secondary-background-color);
      padding: 10px;
      border-radius: 8px;
      text-align: center;
      transition: opacity 0.3s, transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .target-info-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .target-info-item.inactive {
      opacity: 0.4;
    }
    .target-info-item.inactive:hover {
      transform: none;
      box-shadow: none;
    }
    .target-info-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin: 0 auto 6px;
    }
    .target-info-dot.target-1 { background: #e91e63; box-shadow: 0 0 8px rgba(233, 30, 99, 0.5); }
    .target-info-dot.target-2 { background: #9c27b0; box-shadow: 0 0 8px rgba(156, 39, 176, 0.5); }
    .target-info-dot.target-3 { background: #3f51b5; box-shadow: 0 0 8px rgba(63, 81, 181, 0.5); }
    .target-info-label {
      font-size: 0.7rem;
      color: var(--secondary-text-color);
      margin-bottom: 2px;
    }
    .target-info-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    /* No Device State */
    .no-device {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text-color);
    }
    .no-device ha-icon {
      --mdc-icon-size: 48px;
      opacity: 0.5;
      margin-bottom: 12px;
    }

    /* Offline state */
    .offline-badge {
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(239, 68, 68, 0.14);
      color: #ef4444;
    }

    .offline-state {
      text-align: center;
      padding: 40px 20px 44px;
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

    /* Section Divider */
    .section-divider {
      height: 1px;
      background: var(--divider-color);
      margin: 16px 0;
    }

    @container (max-width: 430px) {
      ha-card {
        padding: 14px 12px;
      }

      .header {
        align-items: flex-start;
      }

      .header-icon {
        width: 40px;
        height: 40px;
        flex-basis: 40px;
      }

      .status-badge {
        padding: 6px 8px;
      }

      .pm-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .air-quality-section,
      .room-view-container {
        padding: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .header-icon.active,
      .status-alert {
        animation: none;
      }
    }
  `;

  static getConfigElement() {
    return document.createElement('smarthomeshop-ultimatesensor-card-editor');
  }

  static getStubConfig() {
    return {
      max_distance: 6000,
      show_header: true,
      show_status: true,
      show_radar: true,
      show_target_details: true,
      show_environment: true,
      show_pm_gauge: true,
      show_pm_values: true,
      show_nox: true,
      show_zones: true,
      show_grid: true,
    };
  }

  public setConfig(config: RadarCardConfig): void {
    this._config = {
      max_distance: 6000,
      show_header: true,
      show_status: true,
      show_radar: true,
      show_target_details: true,
      show_environment: true,
      show_pm_gauge: true,
      show_pm_values: true,
      show_nox: true,
      show_zones: true,
      show_grid: true,
      ...config,
    };
    this._roomViewMode = this._config.room_view_mode || '2d';
    if (this._roomViewMode === '3d') {
      setTimeout(() => this._init3DView(), 100);
    }
  }

  public getCardSize(): number {
    return 6;
  }

  private _roomsLoaded = false;

  connectedCallback(): void {
    super.connectedCallback();
    this._startUpdates();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopUpdates();
  }

  private _startUpdates(): void {
    this._updateData();
    this._updateInterval = window.setInterval(() => this._updateData(), 1000);
  }

  private async _loadRooms(): Promise<void> {
    if (!this.hass) {
      debugLog("SmartHomeShop: _loadRooms called but hass not available");
      return;
    }
    if (this._roomsLoaded) {
      debugLog("SmartHomeShop: Rooms already loaded, skipping");
      return;
    }
    try {
      debugLog("SmartHomeShop: Loading rooms via WebSocket...");
      const result = await this.hass.callWS<{ rooms?: any[] }>({ type: "smarthomeshop/rooms" });
      debugLog("SmartHomeShop: WebSocket result:", result);
      this._rooms = Array.isArray(result?.rooms) ? result.rooms : [];
      if (this._rooms.length > 0 && !this._selectedRoomId) {
        this._selectedRoomId = this._rooms[0]?.id || null;
        debugLog("SmartHomeShop: Auto-selected room:", this._selectedRoomId);
      }
      this._roomsLoaded = true;
      debugLog("SmartHomeShop: Loaded", this._rooms.length, "rooms:", this._rooms.map(r => r.name).join(", "));
      if (this._roomViewMode === '3d') {
        setTimeout(() => this._init3DView(), 50);
      }
    } catch (e) {
      console.error("SmartHomeShop: Could not load rooms:", e);
      this._rooms = [];
    }
  }

  private _stopUpdates(): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    // Load rooms when hass becomes available
    if (this.hass && !this._roomsLoaded) {
      this._loadRooms();
    }

    if (changedProps.has('hass') || changedProps.has('_config')) {
      this._detectEntityPrefix();
    }
    if (changedProps.has('_targets') || changedProps.has('_zones')) {
      this._drawRadar();
      // Update 3D view if in 3D mode
      if (this._config.view_mode === 'room' && this._roomViewMode === '3d') {
        this._render3DView();
      }
    }
    // Render 3D view when switching to 3D mode
    if (changedProps.has('_roomViewMode') && this._roomViewMode === '3d') {
      setTimeout(() => this._render3DView(), 50);
    }
  }

  protected firstUpdated(): void {
    this._drawRadar();
    // Also try to load rooms on first update
    if (this.hass && !this._roomsLoaded) {
      this._loadRooms();
    }
  }

  private _detectEntityPrefix(): void {
    if (!this.hass) return;

    if (this._config.device_id) {
      const entities = this._getEntitiesForDevice(this._config.device_id);
      const targetEntity = entities.find((e) => e.includes('target_1_x'));
      if (targetEntity) {
        const match = targetEntity.match(/^sensor\.(.+)_target_1_x$/);
        if (match) {
          this._entityPrefix = match[1];
          const device = this.hass.devices?.[this._config.device_id];
          this._deviceName = (device as any)?.name || 'UltimateSensor';
          return;
        }
      }
    }

    if (this._config.entity_prefix) {
      this._entityPrefix = this._config.entity_prefix;
      this._deviceName = this._config.title || 'UltimateSensor';
      return;
    }

    // Auto-detect
    for (const entityId of Object.keys(this.hass.states)) {
      if (entityId.includes('target_1_x') && entityId.startsWith('sensor.')) {
        const match = entityId.match(/^sensor\.(.+)_target_1_x$/);
        if (match) {
          this._entityPrefix = match[1];
          this._deviceName = 'UltimateSensor';
          return;
        }
      }
    }
  }

  private _getEntitiesForDevice(deviceId: string): string[] {
    if (!this.hass?.entities) return [];
    return Object.entries(this.hass.entities)
      .filter(([_, entity]) => (entity as any).device_id === deviceId)
      .map(([entityId]) => entityId);
  }

  private _getOfflineInfo(): { offline: boolean; lastSeen: string | null } {
    if (!this.hass) return { offline: false, lastSeen: null };

    // Preferred: use the device registry so we only look at the real ESPHome
    // entities. Our own (CC) helper entities stay available when the device is
    // offline, so they must never count towards connectivity.
    const deviceId = this._config.device_id;
    const entities = (this.hass as any).entities;
    if (deviceId && entities) {
      let found = false;
      let lastSeen: string | null = null;
      let statusOffSince: string | null = null;
      for (const [entityId, entry] of Object.entries(entities)) {
        if ((entry as any).device_id !== deviceId) continue;
        if ((entry as any).platform !== 'esphome') continue;
        // Only sensors reflect the device link: update entities and the
        // voice-assistant selects live HA-side and stay available offline.
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

    // Fallback for entity_prefix-only configs: scan by prefix but skip our own
    // integration entities (they end in _cc).
    if (!this._entityPrefix) return { offline: false, lastSeen: null };
    const prefixes = [
      `sensor.${this._entityPrefix}_`,
      `binary_sensor.${this._entityPrefix}_`,
    ];
    let found = false;
    let lastSeen: string | null = null;
    let statusOffSince: string | null = null;
    for (const [entityId, state] of Object.entries(this.hass.states)) {
      if (entityId.endsWith('_cc')) continue;
      if (!prefixes.some((p) => entityId.startsWith(p))) continue;
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

  private _getSensorState(suffix: string): number | null {
    if (!this.hass || !this._entityPrefix) return null;
    const entityId = `sensor.${this._entityPrefix}_${suffix}`;
    const state = this.hass.states[entityId]?.state;
    if (!state || state === 'unavailable' || state === 'unknown') return null;
    return parseFloat(state);
  }

  private _findSensorEntityId(suffixes: string[]): string | undefined {
    if (!this.hass || !this._entityPrefix) return undefined;
    for (const suffix of suffixes) {
      const entityId = `sensor.${this._entityPrefix}_${suffix}`;
      const state = this.hass.states[entityId]?.state;
      if (state && state !== 'unavailable' && state !== 'unknown') {
        return entityId;
      }
    }
    return undefined;
  }

  private _getNumberState(suffix: string): number {
    if (!this.hass || !this._entityPrefix) return 0;
    const entityId = `number.${this._entityPrefix}_${suffix}`;
    const state = this.hass.states[entityId]?.state;
    return state && state !== 'unavailable' ? parseFloat(state) : 0;
  }

  private _updateData(): void {
    if (!this.hass || !this._entityPrefix) return;

    // Update targets
    const targets: Target[] = [];
    const targetEntityIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const xEntity = `sensor.${this._entityPrefix}_target_${i}_x`;
      const yEntity = `sensor.${this._entityPrefix}_target_${i}_y`;
      if (!this.hass.states[xEntity] || !this.hass.states[yEntity]) continue;

      const x = this._getSensorState(`target_${i}_x`) ?? 0;
      const y = this._getSensorState(`target_${i}_y`) ?? 0;
      const activeEntity = [
        `binary_sensor.${this._entityPrefix}_target_${i}_active`,
        `binary_sensor.${this._entityPrefix}_target_${i}`,
      ].find((entityId) => this.hass?.states[entityId]);
      const active = activeEntity
        ? this.hass.states[activeEntity].state === 'on'
        : x !== 0 || y !== 0;
      const distanceEntity = `sensor.${this._entityPrefix}_target_${i}_distance`;
      const distance = this._getSensorState(`target_${i}_distance`) ?? Math.hypot(x, y);

      targets.push({ x, y, active, distance });
      targetEntityIds.push(this.hass.states[distanceEntity] ? distanceEntity : xEntity);
    }
    this._targets = targets;

    // Update zones
    const zones: Zone[] = [];
    for (let i = 1; i <= 4; i++) {
      const beginX = this._getNumberState(`zone_${i}_begin_x`);
      const beginY = this._getNumberState(`zone_${i}_begin_y`);
      const endX = this._getNumberState(`zone_${i}_end_x`);
      const endY = this._getNumberState(`zone_${i}_end_y`);
      if (beginX !== 0 || beginY !== 0 || endX !== 0 || endY !== 0) {
        zones.push({ beginX, beginY, endX, endY });
      }
    }
    this._zones = zones;

    // Update environment data - try multiple sensor name formats
    this._environment = {
      temperature: this._getSensorState('scd41_temperature') ??
                   this._getSensorState('temperature') ??
                   this._getSensorState('bme280_temperature'),
      humidity: this._getSensorState('scd41_humidity') ??
                this._getSensorState('humidity') ??
                this._getSensorState('bme280_humidity'),
      co2: this._getSensorState('scd41_co2') ??
           this._getSensorState('co2'),
      illuminance: this._getSensorState('bh1750_illuminance') ??
                   this._getSensorState('illuminance'),
      voc: this._getSensorState('voc_index') ??
           this._getSensorState('sgp41_voc_index') ??
           this._getSensorState('sgp30_voc') ??
           this._getSensorState('voc'),
      nox: this._getSensorState('nox_index') ??
           this._getSensorState('sgp41_nox_index'),
      // SPS30 Particulate Matter sensors
      pm1_0: this._getSensorState('pm_1mm_weight_concentration') ??
             this._getSensorState('pm_1_0'),
      pm2_5: this._getSensorState('pm_2_5mm_weight_concentration') ??
             this._getSensorState('pm_2_5'),
      pm4_0: this._getSensorState('pm_4mm_weight_concentration') ??
             this._getSensorState('pm_4_0'),
      pm10: this._getSensorState('pm_10mm_weight_concentration') ??
            this._getSensorState('pm_10'),
      typical_particle_size: this._getSensorState('typical_particle_size'),
    };

    // Store entity IDs for click handlers
    this._entityIds = {
      temperature: this._findSensorEntityId(['scd41_temperature', 'temperature', 'bme280_temperature']),
      humidity: this._findSensorEntityId(['scd41_humidity', 'humidity', 'bme280_humidity']),
      co2: this._findSensorEntityId(['scd41_co2', 'co2']),
      illuminance: this._findSensorEntityId(['bh1750_illuminance', 'illuminance']),
      voc: this._findSensorEntityId(['voc_index', 'sgp41_voc_index', 'sgp30_voc', 'voc']),
      nox: this._findSensorEntityId(['nox_index', 'sgp41_nox_index']),
      pm1_0: this._findSensorEntityId(['pm_1mm_weight_concentration', 'pm_1_0']),
      pm2_5: this._findSensorEntityId(['pm_2_5mm_weight_concentration', 'pm_2_5']),
      pm4_0: this._findSensorEntityId(['pm_4mm_weight_concentration', 'pm_4_0']),
      pm10: this._findSensorEntityId(['pm_10mm_weight_concentration', 'pm_10']),
      typical_particle_size: this._findSensorEntityId(['typical_particle_size']),
      targets: targetEntityIds,
    };

    this._drawRadar();
  }

  private _drawRadar(): void {
    const canvas = this.shadowRoot?.querySelector('.radar-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on container
    const rect = canvas.getBoundingClientRect();

    // Skip if canvas hasn't been sized yet
    if (rect.width < 10 || rect.height < 50) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const sensorY = height - 25;
    const maxDist = this._config.max_distance || 6000;
    const scale = Math.max(0.001, (height - 50) / maxDist); // Ensure positive scale

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    if (this._config.show_grid !== false) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Distance circles
      for (let d = 1000; d <= maxDist; d += 1000) {
        const r = d * scale;
        ctx.beginPath();
        ctx.arc(centerX, sensorY, r, Math.PI, 2 * Math.PI);
        ctx.stroke();
      }

      // Center line
      ctx.beginPath();
      ctx.moveTo(centerX, sensorY);
      ctx.lineTo(centerX, 10);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Draw coverage arc (120 degree FOV)
    const fovAngle = (120 * Math.PI) / 180;
    const radius = maxDist * scale;

    ctx.beginPath();
    ctx.moveTo(centerX, sensorY);
    ctx.arc(centerX, sensorY, radius, Math.PI + (Math.PI - fovAngle) / 2, Math.PI + (Math.PI + fovAngle) / 2);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(centerX, sensorY, 0, centerX, sensorY, radius);
    gradient.addColorStop(0, 'rgba(100, 180, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(100, 180, 255, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw zones
    if (this._config.show_zones !== false) {
      const zoneColors = [
        'rgba(76, 175, 80, 0.3)',
        'rgba(33, 150, 243, 0.3)',
        'rgba(255, 152, 0, 0.3)',
        'rgba(156, 39, 176, 0.3)',
      ];

      this._zones.forEach((zone, i) => {
        const x1 = centerX + zone.beginX * scale;
        const y1 = sensorY - zone.beginY * scale;
        const x2 = centerX + zone.endX * scale;
        const y2 = sensorY - zone.endY * scale;

        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);

        // Only draw if zone has valid positive dimensions
        if (w > 5 && h > 5) {
          ctx.fillStyle = zoneColors[i % zoneColors.length];
          ctx.strokeStyle = zoneColors[i % zoneColors.length].replace('0.3', '0.8');
          ctx.lineWidth = 2;
          ctx.beginPath();
          // Use Math.min for corner radius to prevent it being larger than dimensions
          const cornerRadius = Math.min(4, w / 2, h / 2);
          ctx.roundRect(minX, minY, w, h, Math.max(0, cornerRadius));
          ctx.fill();
          ctx.stroke();
        }
      });
    }

    // Draw targets
    const targetColors = ['#e91e63', '#9c27b0', '#3f51b5'];
    this._targets.forEach((target, i) => {
      if (!target.active || (target.x === 0 && target.y === 0)) return;

      const x = centerX + target.x * scale;
      const y = sensorY - target.y * scale;
      const color = targetColors[i % targetColors.length];

      // Pulse effect
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      const pulseGradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
      pulseGradient.addColorStop(0, color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
      pulseGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = pulseGradient;
      ctx.fill();

      // Main marker
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    });

    // Draw sensor icon
    ctx.fillStyle = '#2196f3';
    ctx.beginPath();
    ctx.arc(centerX, sensorY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SENSOR', centerX, sensorY + 18);

    // Distance labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let d = 1; d <= maxDist / 1000; d++) {
      const y = sensorY - d * 1000 * scale;
      ctx.fillText(`${d}m`, width - 8, y + 4);
    }
  }


  private _renderRoomView() {
    // Toggle between 2D and 3D view - always show this
    const toggle = html`
      <div class="room-view-header">
        <div class="room-view-toggle">
          <button class="${this._roomViewMode === '2d' ? 'active' : ''}" @click=${() => this._setRoomViewMode('2d')}>2D</button>
          <button class="${this._roomViewMode === '3d' ? 'active' : ''}" @click=${() => this._setRoomViewMode('3d')}>3D</button>
        </div>
      </div>
    `;

    const room = this._rooms.find(r => r.id === this._selectedRoomId);

    // Walls are stored as line segments: { x1, y1, x2, y2 }
    // We need to extract corner points from these segments
    const wallSegments = room?.walls || [];

    // Extract corner points from wall segments (use x1, y1 of each segment)
    const cornerPoints: Array<{x: number, y: number}> = wallSegments
      .filter((w: any) => typeof w?.x1 === 'number' && typeof w?.y1 === 'number')
      .map((w: any) => ({ x: w.x1 / 1000, y: w.y1 / 1000 })); // Convert mm to meters

    // Debug logging
    debugLog("SmartHomeShop: _renderRoomView", {
      selectedRoomId: this._selectedRoomId,
      wallSegments: wallSegments.length,
      cornerPoints: cornerPoints.length,
      room: room?.name,
    });

    // Validate room has at least 3 corner points
    const hasValidWalls = cornerPoints.length >= 3;

    if (!room || !hasValidWalls) {
      // Only log warning if rooms are loaded but validation still fails
      if (this._roomsLoaded && this._rooms.length > 0) {
        console.warn("SmartHomeShop: Room validation failed", {
          roomName: room?.name,
          wallSegmentsCount: wallSegments.length,
          cornerPointsCount: cornerPoints.length
        });
      }
      return html`
        ${toggle}
        <div class="no-room-message">
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          <div>${this._roomsLoaded ? 'No room configured' : 'Loading rooms...'}</div>
          ${this._roomsLoaded ? html`
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Create a room in the SmartHomeShop panel first
            </div>
          ` : nothing}
        </div>
      `;
    }

    const xs = cornerPoints.map((p) => p.x).filter((x: number) => !isNaN(x));
    const ys = cornerPoints.map((p) => p.y).filter((y: number) => !isNaN(y));

    // Extra safety check
    if (xs.length === 0 || ys.length === 0) {
      return html`
        <div class="no-room-message">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <div>Invalid room data</div>
        </div>
      `;
    }

    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const roomWidth = (maxX - minX) || 1;
    const roomHeight = (maxY - minY) || 1;

    const padding = 0.5;
    const viewMinX = minX - padding;
    const viewMinY = minY - padding;
    const viewWidth = roomWidth + padding * 2;
    const viewHeight = roomHeight + padding * 2;

    debugLog('SmartHomeShop: ViewBox', { viewMinX, viewMinY, viewWidth, viewHeight, minX, maxX, minY, maxY });

    // Create SVG path from corner points
    const wallPath = cornerPoints
      .map((p, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';

    // Sensor position (convert from mm to meters if stored in mm)
    const sensorX = room.sensor?.x ? room.sensor.x / 1000 : (minX + maxX) / 2;
    const sensorY = room.sensor?.y ? room.sensor.y / 1000 : minY + 0.5;
    const sensorRotation = room.sensor?.rotation ?? 270; // Default: pointing up (270°)
    const sensorRange = (room.sensor?.range ?? 6000) / 1000; // Convert mm to meters
    const sensorFov = room.sensor?.fov ?? 120; // Default FOV in degrees
    const sensorPos = {
      x: isNaN(sensorX) ? (minX + maxX) / 2 : sensorX,
      y: isNaN(sensorY) ? minY + 0.5 : sensorY
    };
    // Show targets that are either active OR have non-zero X/Y values
    const activeTargets = this._targets.filter(t => t.active || (t.x !== 0 || t.y !== 0));
    debugLog('SmartHomeShop: Room targets:', JSON.stringify(this._targets), 'Active/visible:', activeTargets.length);

    // Calculate FOV triangle points based on rotation
    // UI convention: 0=up (forward), 90=right, 180=down, 270=left
    // The -90 converts from UI convention to SVG math
    const rotRad = (sensorRotation - 90) * Math.PI / 180;
    const halfFov = (sensorFov / 2) * Math.PI / 180;
    const fovRange = Math.min(sensorRange, 3); // Cap visual range for display
    const leftAngle = rotRad - halfFov;
    const rightAngle = rotRad + halfFov;

    // 3D View
    if (this._roomViewMode === '3d') {
      return html`
        ${toggle}
        <canvas class="canvas-3d"
          @mousedown=${this._on3DMouseDown}
          @mousemove=${this._on3DMouseMove}
          @mouseup=${this._on3DMouseUp}
          @mouseleave=${this._on3DMouseUp}
          @wheel=${this._on3DWheel}
        ></canvas>
      `;
    }

    // 2D View - Same style as zones-page
    // Create arc points for FOV (smoother than triangle)
    const arcPoints: string[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = leftAngle + (rightAngle - leftAngle) * (i / 32);
      arcPoints.push(`${sensorPos.x + Math.cos(angle) * fovRange},${sensorPos.y + Math.sin(angle) * fovRange}`);
    }
    const fovArcPath = `M ${sensorPos.x} ${sensorPos.y} L ${arcPoints.join(' L ')} Z`;

    return html`
      ${toggle}
      <svg viewBox="${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}"
           style="width: 100%; height: 300px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 12px;">
        <defs>
          <pattern id="room-grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(71, 85, 105, 0.3)" stroke-width="0.01"/>
          </pattern>
          <marker id="arrow-in" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e"/>
          </marker>
          <marker id="arrow-out" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444"/>
          </marker>
        </defs>
        <rect x="${viewMinX}" y="${viewMinY}" width="${viewWidth}" height="${viewHeight}" fill="url(#room-grid)"/>
        <!-- Room walls - same style as zones-page -->
        <path d="${wallPath}" fill="rgba(249, 115, 22, 0.08)" stroke="#475569" stroke-width="0.04"/>
        <!-- Sensor FOV - same style as zones-page (arc instead of triangle) -->
        <path d="${fovArcPath}" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="0.015"/>
        <!-- Zones from room configuration -->
        ${(() => {
          const zones = room.zones || [];
          debugLog('SmartHomeShop: Rendering zones count:', zones.length, 'entry lines:', zones.filter((z: any) => z.type === 'entry').length);
          return zones.map((zone: any) => {
            if (!zone.points || zone.points.length < 2) return nothing;

            // Entry lines (2 points) - render as line with arrows pointing opposite directions
            if (zone.type === 'entry' && zone.points.length === 2) {
              const x1 = zone.points[0].x / 1000;
              const y1 = zone.points[0].y / 1000;
              const x2 = zone.points[1].x / 1000;
              const y2 = zone.points[1].y / 1000;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len < 0.01) return nothing;
              const nx = -dy / len;
              const ny = dx / len;
              const inDir = zone.inDirection || 'left';
              const inSign = inDir === 'left' ? 1 : -1;
              const arrowLen = 0.12;
              const arrowGap = 0.02;
              // IN arrow: starts outside, points through line into room
              const inStartX = midX + nx * inSign * (arrowLen + arrowGap);
              const inStartY = midY + ny * inSign * (arrowLen + arrowGap);
              const inEndX = midX - nx * inSign * arrowGap;
              const inEndY = midY - ny * inSign * arrowGap;
              // OUT arrow: starts inside, points through line out of room (opposite direction)
              const outStartX = midX - nx * inSign * (arrowLen + arrowGap);
              const outStartY = midY - ny * inSign * (arrowLen + arrowGap);
              const outEndX = midX + nx * inSign * arrowGap;
              const outEndY = midY + ny * inSign * arrowGap;
              return svg`
                <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#10b981" stroke-width="0.04" stroke-linecap="round"/>
                <line x1="${inStartX}" y1="${inStartY}" x2="${inEndX}" y2="${inEndY}" stroke="#22c55e" stroke-width="0.025" marker-end="url(#arrow-in)"/>
                <line x1="${outStartX}" y1="${outStartY}" x2="${outEndX}" y2="${outEndY}" stroke="#ef4444" stroke-width="0.025" marker-end="url(#arrow-out)"/>
                <text x="${inStartX + nx * inSign * 0.05}" y="${inStartY + ny * inSign * 0.05 + 0.025}" fill="#22c55e" font-size="0.07" text-anchor="middle" font-weight="bold">IN</text>
                <text x="${outStartX - nx * inSign * 0.05}" y="${outStartY - ny * inSign * 0.05 + 0.025}" fill="#ef4444" font-size="0.07" text-anchor="middle" font-weight="bold">UIT</text>
              `;
            }

            // Polygon zones (3+ points) - same style as zones-page (outline only, no fill)
            if (zone.points.length < 3) return nothing;
            const pathD = zone.points.map((p: any, i: number) => {
              const x = p.x / 1000;
              const y = p.y / 1000;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z';
            const isDetection = zone.type === 'detection';
            const strokeColor = isDetection ? '#22c55e' : '#ef4444';
            return svg`
              <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="0.025"/>
            `;
          });
        })()}
        <!-- Doors - same style as zones-page (purple) -->
        ${(() => {
          const doors = room.doors || [];
          const pts = cornerPoints;
          if (pts.length < 3) return nothing;
          return doors.map((door: any) => {
            if (door.wallIndex >= pts.length) return nothing;
            const p1 = pts[door.wallIndex];
            const p2 = pts[(door.wallIndex + 1) % pts.length];
            const doorX = p1.x + (p2.x - p1.x) * door.position;
            const doorY = p1.y + (p2.y - p1.y) * door.position;
            const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const doorWidth = (door.width || 800) / 1000 / 2;
            return svg`
              <line
                x1="${doorX - Math.cos(wallAngle) * doorWidth}"
                y1="${doorY - Math.sin(wallAngle) * doorWidth}"
                x2="${doorX + Math.cos(wallAngle) * doorWidth}"
                y2="${doorY + Math.sin(wallAngle) * doorWidth}"
                stroke="#a855f7" stroke-width="0.06" stroke-linecap="round"
              />
            `;
          });
        })()}
        <!-- Windows - same style as zones-page (light blue) -->
        ${(() => {
          const windows = room.windows || [];
          const pts = cornerPoints;
          if (pts.length < 3) return nothing;
          return windows.map((win: any) => {
            if (win.wallIndex >= pts.length) return nothing;
            const p1 = pts[win.wallIndex];
            const p2 = pts[(win.wallIndex + 1) % pts.length];
            const winX = p1.x + (p2.x - p1.x) * win.position;
            const winY = p1.y + (p2.y - p1.y) * win.position;
            const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const winWidth = (win.width || 1000) / 1000 / 2;
            return svg`
              <line
                x1="${winX - Math.cos(wallAngle) * winWidth}"
                y1="${winY - Math.sin(wallAngle) * winWidth}"
                x2="${winX + Math.cos(wallAngle) * winWidth}"
                y2="${winY + Math.sin(wallAngle) * winWidth}"
                stroke="#0ea5e9" stroke-width="0.06" stroke-linecap="round"
              />
            `;
          });
        })()}
        <!-- Furniture - same style as zones-page (gray) -->
        ${(() => {
          const furniture = room.furniture || [];
          const filtered = furniture.filter((f: any) => typeof f?.x === 'number' && typeof f?.y === 'number' && f?.width && f?.height);
          return filtered.map((f: any) => {
              const fx = f.x / 1000, fy = f.y / 1000;
              const fw = f.width / 1000, fh = f.height / 1000;
              const rot = f.rotation || 0;
              return svg`
                <g transform="translate(${fx}, ${fy}) rotate(${rot})">
                  <rect x="${-fw/2}" y="${-fh/2}" width="${fw}" height="${fh}"
                        fill="#334155" stroke="#475569" stroke-width="0.02" rx="0.03"/>
                </g>
              `;
            });
        })()}
        <!-- Sensor icon - same style as zones-page -->
        <circle cx="${sensorPos.x}" cy="${sensorPos.y}" r="0.15" fill="#3b82f6" stroke="#1d4ed8" stroke-width="0.02"/>
        <!-- Sensor direction indicator -->
        <line x1="${sensorPos.x}" y1="${sensorPos.y}"
              x2="${sensorPos.x + Math.cos(rotRad) * 0.2}" y2="${sensorPos.y + Math.sin(rotRad) * 0.2}"
              stroke="white" stroke-width="0.04" stroke-linecap="round"/>
        <!-- Targets - same style as zones-page (white circle with colored border) -->
        ${(() => {
          const targetColors = ['#ef4444', '#f97316', '#eab308'];
          return activeTargets.map((target, i) => {
            const txM = target.x / 1000;
            const tyM = target.y / 1000;
            const targetX = sensorPos.x + tyM * Math.cos(rotRad) - txM * Math.sin(rotRad);
            const targetY = sensorPos.y + tyM * Math.sin(rotRad) + txM * Math.cos(rotRad);
            if (isNaN(targetX) || isNaN(targetY)) return nothing;
            const color = targetColors[i] || '#ef4444';
            return svg`
              <g class="live-target">
                <!-- Outer ring with animation -->
                <circle cx="${targetX}" cy="${targetY}" r="0.15" fill="none" stroke="${color}" stroke-width="0.01" opacity="0.6">
                  <animate attributeName="r" values="0.15;0.25;0.15" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <!-- Main circle - white fill with colored border -->
                <circle cx="${targetX}" cy="${targetY}" r="0.1" fill="white" stroke="${color}" stroke-width="0.025"/>
                <!-- Number label - colored text -->
                <text x="${targetX}" y="${targetY + 0.035}" text-anchor="middle" fill="${color}" font-size="0.08" font-weight="bold">${i + 1}</text>
              </g>
            `;
          });
        })()}
      </svg>
    `;
  }

  private _getCo2Status(co2: number): { label: string; class: string } {
    if (co2 < 600) return { label: 'Excellent', class: 'excellent' };
    if (co2 < 800) return { label: 'Good', class: 'good' };
    if (co2 < 1000) return { label: 'Moderate', class: 'moderate' };
    if (co2 < 1500) return { label: 'Poor', class: 'poor' };
    return { label: 'Unhealthy', class: 'unhealthy' };
  }

  // 3D View methods
  private _setRoomViewMode(mode: '2d' | '3d'): void {
    this._roomViewMode = mode;
    if (mode === '3d') {
      // Initialize 3D view after render
      setTimeout(() => this._init3DView(), 50);
    }
  }

  private _init3DView(): void {
    const room = this._rooms.find(r => r.id === this._selectedRoomId);
    if (!room) return;
    const roomPoints = (room.walls || []).map((w: any) => ({ x: w.x1, y: w.y1 }));
    this._room3d.resetCamera(roomPoints);
    this._render3DView();
  }

  private _render3DView(): void {
    const canvas = this.shadowRoot?.querySelector('.canvas-3d') as HTMLCanvasElement;
    if (!canvas) return;
    const room = this._rooms.find(r => r.id === this._selectedRoomId);
    if (!room) return;
    this._room3d.render(canvas, this._buildScene3D(room));
  }

  private _buildScene3D(room: any): Scene3D {
    const roomPoints = (room.walls || []).map((w: any) => ({ x: w.x1, y: w.y1 }));
    const furniture = (room.furniture || []).map((f: any) => ({
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height || f.depth || f.width,
      rotation: f.rotationDeg ?? f.rotation ?? 0,
      name: f.name || f.typeId || 'Furniture',
    }));
    const sensors = ((room.sensors && room.sensors.length > 0) ? room.sensors : (room.sensor ? [room.sensor] : []))
      .filter((sn: any) => sn && typeof sn.x === 'number')
      .map((sn: any) => ({
        x: sn.x,
        y: sn.y,
        rotation: sn.rotation ?? 0,
        range: sn.range ?? 6000,
        fov: sn.fov ?? 120,
        heightMm: sn.heightMm ?? 2000,
        deviceId: sn.deviceId ?? null,
      }));
    return {
      roomPoints,
      furniture,
      doors: room.doors || [],
      windows: room.windows || [],
      zones: room.zones || [],
      sensors,
      targets: collectWorldTargets(sensors, (id) => this.hass?.states[id]?.state),
    };
  }

  private _on3DMouseDown = (e: MouseEvent): void => {
    this._isDragging3D = true;
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;
  };

  private _on3DMouseMove = (e: MouseEvent): void => {
    if (!this._isDragging3D) return;

    const dx = e.clientX - this._lastMouseX;
    const dy = e.clientY - this._lastMouseY;
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;

    this._room3d.orbit(-dx, dy * 0.6);
    this._render3DView();
  };

  private _on3DMouseUp = (): void => {
    this._isDragging3D = false;
  };

  private _on3DWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this._room3d.zoomBy(e.deltaY > 0 ? 1.1 : 0.9);
    this._render3DView();
  };

  private _getCo2BarPosition(co2: number): number {
    // Map CO2 from 400-2000 to 0-100%
    const min = 400;
    const max = 2000;
    const clamped = Math.max(min, Math.min(max, co2));
    return ((clamped - min) / (max - min)) * 100;
  }

  // PM2.5 Air Quality based on US EPA AQI standards
  private _getPm25Status(pm25: number): { label: string; labelEn: string; class: string; color: string } {
    if (pm25 <= 12) return { label: 'Excellent', labelEn: 'Excellent', class: 'excellent', color: '#4caf50' };
    if (pm25 <= 35.4) return { label: 'Good', labelEn: 'Good', class: 'good', color: '#8bc34a' };
    if (pm25 <= 55.4) return { label: 'Moderate', labelEn: 'Moderate', class: 'moderate', color: '#ffeb3b' };
    if (pm25 <= 150.4) return { label: 'Unhealthy for Sensitive', labelEn: 'Unhealthy for Sensitive', class: 'unhealthy-sensitive', color: '#ff9800' };
    if (pm25 <= 250.4) return { label: 'Unhealthy', labelEn: 'Unhealthy', class: 'unhealthy', color: '#f44336' };
    if (pm25 <= 350.4) return { label: 'Very Unhealthy', labelEn: 'Very Unhealthy', class: 'very-unhealthy', color: '#9c27b0' };
    return { label: 'Hazardous', labelEn: 'Hazardous', class: 'hazardous', color: '#880e4f' };
  }

  private _getPm25BarPosition(pm25: number): number {
    // Map PM2.5 from 0-500 to 0-100%
    // Using non-linear scale for better visualization
    if (pm25 <= 12) return (pm25 / 12) * 8.3;
    if (pm25 <= 35.4) return 8.3 + ((pm25 - 12) / 23.4) * 8.3;
    if (pm25 <= 55.4) return 16.6 + ((pm25 - 35.4) / 20) * 8.4;
    if (pm25 <= 150.4) return 25 + ((pm25 - 55.4) / 95) * 8.3;
    if (pm25 <= 250.4) return 33.3 + ((pm25 - 150.4) / 100) * 16.7;
    if (pm25 <= 350.4) return 50 + ((pm25 - 250.4) / 100) * 16.6;
    return Math.min(100, 66.6 + ((pm25 - 350.4) / 150) * 33.4);
  }

  private _hasAirQualityData(): boolean {
    const { pm1_0, pm2_5, pm4_0, pm10 } = this._environment;
    return pm1_0 !== null || pm2_5 !== null || pm4_0 !== null || pm10 !== null;
  }

  // Find Room Quality entity from SmartHomeShop custom component
  private _findRoomQualityEntity(): { entityId: string; state: any } | null {
    if (!this.hass) return null;

    // Search for Room Quality entity by looking for entities with our specific attributes
    for (const [entityId, state] of Object.entries(this.hass.states)) {
      if (entityId.startsWith('sensor.') &&
          entityId.includes('room_quality') &&
          !entityId.includes('label') &&
          !entityId.includes('percentage') &&
          state.attributes?.recommendations !== undefined &&
          state.attributes?.color !== undefined) {
        debugLog('SmartHomeShop: Found Room Quality entity:', entityId, 'score:', state.state);
        return { entityId, state };
      }
    }
    debugLog('SmartHomeShop: No Room Quality entity found, using local calculation');
    return null;
  }

  // Room Quality Score - uses SmartHomeShop entity if available, otherwise calculates locally
  private _calculateRoomScore(): { score: number; color: string; label: string; recommendations: Array<{icon: string; text: string}> } {
    // First, try to use the Room Quality entity from SmartHomeShop custom component
    const roomQualityEntity = this._findRoomQualityEntity();
    if (roomQualityEntity) {
      const { state } = roomQualityEntity;
      const score = parseFloat(state.state) || 0;
      const attrs = state.attributes || {};

      // Map recommendations from entity attributes (they come as strings)
      const recs = (attrs.recommendations || []) as string[];
      const recommendations = recs.map((text: string) => {
        // Determine icon based on recommendation text
        let icon = 'mdi:information';
        if (text.includes('CO₂') || text.includes('Ventilat')) icon = 'mdi:molecule-co2';
        else if (text.includes('Particulate') || text.includes('dust')) icon = 'mdi:weather-dust';
        else if (text.includes('VOC')) icon = 'mdi:air-purifier';
        else if (text.includes('cool') || text.includes('cold') || text.includes('Warm up')) icon = 'mdi:thermometer-low';
        else if (text.includes('warm') || text.includes('hot') || text.includes('Cool down')) icon = 'mdi:thermometer-high';
        else if (text.includes('dry')) icon = 'mdi:water-percent';
        else if (text.includes('humid')) icon = 'mdi:water-percent-alert';
        return { icon, text };
      }).slice(0, 3);

      return {
        score,
        color: attrs.color || '#ffc107',
        label: attrs.label || 'Unknown',
        recommendations,
      };
    }

    // Fallback: calculate locally if no Room Quality entity found
    return this._calculateRoomScoreLocal();
  }

  // Local Room Quality calculation (fallback when no SmartHomeShop entity available)
  private _calculateRoomScoreLocal(): { score: number; color: string; label: string; recommendations: Array<{icon: string; text: string}> } {
    const { temperature, humidity, co2, voc, pm2_5 } = this._environment;
    const recommendations: Array<{icon: string; text: string; priority: number}> = [];
    let totalScore = 0;
    let weightSum = 0;

    // CO2 score (ideal: <600ppm) - weight: 30%
    if (co2 !== null) {
      let co2Score = 10;
      if (co2 > 2000) { co2Score = 1; recommendations.push({icon: 'mdi:molecule-co2', text: 'Ventilate now!', priority: 10}); }
      else if (co2 > 1500) { co2Score = 3; recommendations.push({icon: 'mdi:molecule-co2', text: 'CO₂ unhealthy, ventilate', priority: 8}); }
      else if (co2 > 1000) { co2Score = 5; recommendations.push({icon: 'mdi:air-filter', text: 'Ventilation recommended', priority: 6}); }
      else if (co2 > 800) { co2Score = 7; }
      else if (co2 > 600) co2Score = 9;
      totalScore += co2Score * 0.30;
      weightSum += 0.30;
    }

    // PM2.5 score (ideal: <12 µg/m³) - weight: 25%
    if (pm2_5 !== null) {
      let pmScore = 10;
      if (pm2_5 > 150) { pmScore = 1; recommendations.push({icon: 'mdi:weather-dust', text: 'Particulate matter dangerous!', priority: 9}); }
      else if (pm2_5 > 55) { pmScore = 3; recommendations.push({icon: 'mdi:weather-dust', text: 'Particulate matter high', priority: 7}); }
      else if (pm2_5 > 35) { pmScore = 5; recommendations.push({icon: 'mdi:weather-dust', text: 'Particulate matter elevated', priority: 5}); }
      else if (pm2_5 > 12) pmScore = 7;
      totalScore += pmScore * 0.25;
      weightSum += 0.25;
    }

    // VOC score (ideal: <100) - weight: 15%
    if (voc !== null) {
      let vocScore = 10;
      if (voc > 400) { vocScore = 2; recommendations.push({icon: 'mdi:air-purifier', text: 'High VOC, ventilate', priority: 7}); }
      else if (voc > 250) { vocScore = 5; recommendations.push({icon: 'mdi:air-purifier', text: 'Elevated VOC', priority: 5}); }
      else if (voc > 150) { vocScore = 7; }
      else if (voc > 100) vocScore = 9;
      totalScore += vocScore * 0.15;
      weightSum += 0.15;
    }

    // Temperature score (ideal: 19-22°C) - weight: 15%
    if (temperature !== null) {
      let tempScore = 10;
      if (temperature < 16) { tempScore = 4; recommendations.push({icon: 'mdi:thermometer-low', text: 'Warm up the room', priority: 4}); }
      else if (temperature < 18) { tempScore = 7; recommendations.push({icon: 'mdi:thermometer-low', text: 'It is a bit cool', priority: 2}); }
      else if (temperature > 28) { tempScore = 3; recommendations.push({icon: 'mdi:thermometer-high', text: 'Cool down the room', priority: 4}); }
      else if (temperature > 25) { tempScore = 6; recommendations.push({icon: 'mdi:thermometer-high', text: 'It is a bit warm', priority: 2}); }
      else if (temperature > 22) tempScore = 8;
      totalScore += tempScore * 0.15;
      weightSum += 0.15;
    }

    // Humidity score (ideal: 40-60%) - weight: 15%
    if (humidity !== null) {
      let humScore = 10;
      if (humidity < 25) { humScore = 4; recommendations.push({icon: 'mdi:water-percent-alert', text: 'Air too dry', priority: 4}); }
      else if (humidity < 35) { humScore = 7; recommendations.push({icon: 'mdi:water-percent', text: 'Air is dry', priority: 2}); }
      else if (humidity > 75) { humScore = 4; recommendations.push({icon: 'mdi:water-percent-alert', text: 'Air too humid', priority: 4}); }
      else if (humidity > 65) { humScore = 7; recommendations.push({icon: 'mdi:water-percent', text: 'Air is humid', priority: 2}); }
      totalScore += humScore * 0.15;
      weightSum += 0.15;
    }

    const finalScore = weightSum > 0 ? (totalScore / weightSum) : 0;

    // Determine color and label (same thresholds as backend)
    let color = '#22C55E'; // Green - Excellent
    let label = 'Excellent';
    if (finalScore < 4) { color = '#EF4444'; label = 'Poor'; }
    else if (finalScore < 5.5) { color = '#F97316'; label = 'Moderate'; }
    else if (finalScore < 7) { color = '#F59E0B'; label = 'Fair'; }
    else if (finalScore < 8.5) { color = '#84CC16'; label = 'Good'; }

    const sortedRecs = recommendations.sort((a, b) => b.priority - a.priority);
    const topRecommendations = sortedRecs.slice(0, 3).map(r => ({icon: r.icon, text: r.text}));

    return { score: finalScore, color, label, recommendations: topRecommendations };
  }

  private _hasEnvironmentData(): boolean {
    const { temperature, humidity, co2, voc, pm2_5 } = this._environment;
    return temperature !== null || humidity !== null || co2 !== null || voc !== null || pm2_5 !== null;
  }

  private _hasAnyEnvironmentEnabled(): boolean {
    const { temperature, humidity, co2, illuminance, voc } = this._environment;
    return (temperature !== null && this._config.show_temperature !== false) ||
           (humidity !== null && this._config.show_humidity !== false) ||
           (co2 !== null && this._config.show_co2 !== false) ||
           (illuminance !== null && this._config.show_illuminance !== false) ||
           (voc !== null && this._config.show_voc !== false);
  }

  protected render() {
    if (!this.hass) return nothing;

    if (!this._entityPrefix) {
      return html`
        <ha-card>
          <div class="no-device">
            <ha-icon icon="mdi:radar"></ha-icon>
            <div>Select an UltimateSensor device</div>
            <div style="font-size: 0.8rem; margin-top: 8px;">
              Open the card editor to choose a device
            </div>
          </div>
      </ha-card>
      `;
    }

    const activeTargets = this._targets.filter((t) => t.active).length;
    const title = this._config.title || this._deviceName || 'UltimateSensor';
    const logo = productLogo(
      /mini/i.test(this._entityPrefix) ? 'ultimatesensor_mini' : 'ultimatesensor'
    );

    const offlineInfo = this._getOfflineInfo();
    if (offlineInfo.offline) {
      return html`
        <ha-card>
          ${this._config.show_header !== false ? html`
            <div class="header">
              <div class="header-left">
                <div class="header-icon">
                  ${logo ? unsafeHTML(logo) : html`<ha-icon icon="mdi:radar"></ha-icon>`}
                </div>
                <div>
                  <h2 class="header-title">${title}</h2>
                  <div class="header-subtitle">Presence &amp; climate</div>
                </div>
              </div>
              ${this._config.show_status !== false ? html`
                <div class="status-badge status-alert">
                  <ha-icon icon="mdi:lan-disconnect"></ha-icon>
                  <span>Offline</span>
                </div>
              ` : nothing}
            </div>
          ` : nothing}
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
        </ha-card>
      `;
    }
    const { temperature, humidity, co2, illuminance, voc, nox, pm1_0, pm2_5, pm4_0, pm10 } = this._environment;
    const co2Status = co2 !== null ? this._getCo2Status(co2) : null;
    const showRoomScore = this._hasEnvironmentData() && this._config.show_room_score !== false;
    const showEnvironment = this._config.show_environment !== false && this._hasAnyEnvironmentEnabled();
    const showAirQuality = this._hasAirQualityData() && this._config.show_air_quality !== false;
    const hasOverviewContent = showRoomScore || showEnvironment || showAirQuality;

    return html`
      <ha-card>
        ${this._config.show_header !== false ? html`
          <div class="header">
            <div class="header-left">
              <div class="header-icon ${activeTargets > 0 ? 'active' : ''}">
                ${logo ? unsafeHTML(logo) : html`<ha-icon icon="mdi:radar"></ha-icon>`}
              </div>
              <div>
                <h2 class="header-title">${title}</h2>
                <div class="header-subtitle">Presence &amp; climate</div>
              </div>
            </div>
            ${this._config.show_status !== false ? html`
              <div class="status-badge ${activeTargets > 0 ? 'status-active' : 'status-ok'}">
                <ha-icon icon="${activeTargets > 0 ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off'}"></ha-icon>
                <span>${activeTargets} ${activeTargets === 1 ? 'person' : 'people'}</span>
              </div>
            ` : nothing}
          </div>
        ` : nothing}

        ${showRoomScore ? (() => {
          const roomScore = this._calculateRoomScore();
          return html`
            <div class="room-score-section">
              <div class="room-score-header">
                <div class="room-score-title">
                  <ha-icon icon="mdi:home-heart"></ha-icon>
                  Room Quality
                </div>
                <div class="room-score-badge" style="background: ${roomScore.color}">
                  ${roomScore.label}
                </div>
              </div>
              <div class="room-score-main">
                <div class="room-score-gauge">
                  <svg viewBox="0 0 120 65" class="score-arc">
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#f44336"/>
                        <stop offset="40%" style="stop-color:#ff9800"/>
                        <stop offset="60%" style="stop-color:#ffc107"/>
                        <stop offset="80%" style="stop-color:#8bc34a"/>
                        <stop offset="100%" style="stop-color:#4caf50"/>
                      </linearGradient>
                    </defs>
                    <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="var(--divider-color)" stroke-width="8" stroke-linecap="round"/>
                    <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="url(#scoreGradient)" stroke-width="8" stroke-linecap="round"
                          stroke-dasharray="${(roomScore.score / 10) * Math.PI * 50} ${Math.PI * 50}" />
                    <circle
                      cx="${60 + 50 * Math.cos(Math.PI * (1 - roomScore.score / 10))}"
                      cy="${55 - 50 * Math.sin(Math.PI * (1 - roomScore.score / 10))}"
                      r="6" fill="${roomScore.color}" stroke="var(--card-background-color)" stroke-width="2"/>
                  </svg>
                  <div class="room-score-value" style="color: ${roomScore.color}">${roomScore.score.toFixed(1)}</div>
                </div>
              </div>
              ${roomScore.recommendations.length > 0 ? html`
                <div class="room-score-recommendations">
                  ${roomScore.recommendations.map(rec => html`
                    <div class="recommendation-item"><ha-icon icon="${rec.icon}"></ha-icon>${rec.text}</div>
                  `)}
                </div>
              ` : html`
                <div class="room-score-recommendations">
                  <div class="recommendation-item positive"><ha-icon icon="mdi:check-circle"></ha-icon>All values optimal</div>
                </div>
              `}
            </div>
          `;
        })() : nothing}

        ${showEnvironment ? html`
          <div class="environment-section">
            <div class="environment-grid">
              ${temperature !== null && this._config.show_temperature !== false ? html`
                <div class="env-card temperature" @click=${() => this._fireMoreInfo(this._entityIds.temperature)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:thermometer"></ha-icon>
                    <span class="env-card-label">Temperature</span>
                  </div>
                  <div class="env-card-value">${temperature.toFixed(1)}<span>°C</span></div>
                </div>
              ` : nothing}

              ${humidity !== null && this._config.show_humidity !== false ? html`
                <div class="env-card humidity" @click=${() => this._fireMoreInfo(this._entityIds.humidity)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:water-percent"></ha-icon>
                    <span class="env-card-label">Humidity</span>
                  </div>
                  <div class="env-card-value">${humidity.toFixed(0)}<span>%</span></div>
                </div>
              ` : nothing}

              ${co2 !== null && this._config.show_co2 !== false ? html`
                <div class="env-card co2" @click=${() => this._fireMoreInfo(this._entityIds.co2)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    <span class="env-card-label">CO₂</span>
                  </div>
                  <div class="env-card-value">${co2.toFixed(0)}<span>ppm</span></div>
                </div>
              ` : nothing}

              ${illuminance !== null && this._config.show_illuminance !== false ? html`
                <div class="env-card illuminance" @click=${() => this._fireMoreInfo(this._entityIds.illuminance)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:brightness-6"></ha-icon>
                    <span class="env-card-label">Illuminance</span>
                  </div>
                  <div class="env-card-value">${illuminance.toFixed(0)}<span>lx</span></div>
                </div>
              ` : nothing}

              ${voc !== null && this._config.show_voc !== false ? html`
                <div class="env-card voc" @click=${() => this._fireMoreInfo(this._entityIds.voc)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:air-filter"></ha-icon>
                    <span class="env-card-label">VOC Index</span>
                  </div>
                  <div class="env-card-value">${voc.toFixed(0)}<span></span></div>
                </div>
              ` : nothing}
            </div>

            ${co2 !== null && co2Status && this._config.show_co2_bar !== false ? html`
              <div class="co2-quality" @click=${() => this._fireMoreInfo(this._entityIds.co2)}>
                <div class="co2-quality-header">
                  <div class="co2-quality-label">
                    <ha-icon icon="mdi:molecule-co2"></ha-icon>
                    CO₂ Quality
                  </div>
                  <div class="co2-quality-status ${co2Status.class}">${co2Status.label}</div>
                </div>
                <div class="co2-bar-container">
                  <div class="co2-bar-indicator" style="left: calc(${this._getCo2BarPosition(co2)}% - 2px)"></div>
                </div>
                <div class="co2-bar-labels">
                  <span>400</span>
                  <span>800</span>
                  <span>1200</span>
                  <span>1600</span>
                  <span>2000</span>
                </div>
              </div>
            ` : nothing}
          </div>
        ` : nothing}


        ${showAirQuality ? html`
          <div class="air-quality-section">
            <div class="air-quality-header">
              <div class="air-quality-title">
                <ha-icon icon="mdi:weather-dust"></ha-icon>
                Particulate matter (PM)
              </div>
              ${pm2_5 !== null ? html`
                <div class="air-quality-status ${this._getPm25Status(pm2_5).class}">
                  ${this._getPm25Status(pm2_5).label}
                </div>
              ` : nothing}
            </div>

            ${pm2_5 !== null && this._config.show_pm_gauge !== false ? html`
              <div class="pm-gauge-container" @click=${() => this._fireMoreInfo(this._entityIds.pm2_5)}>
                <div class="pm-gauge-label">
                  <span class="pm-gauge-label-text">PM2.5 (Fine Particles)</span>
                  <span class="pm-gauge-value" style="color: ${this._getPm25Status(pm2_5).color}">
                    ${pm2_5.toFixed(1)}<span>µg/m³</span>
                  </span>
                </div>
                <div class="pm-gauge-bar">
                  <div class="pm-gauge-indicator" style="left: calc(${this._getPm25BarPosition(pm2_5)}% - 2px)"></div>
                </div>
                <div class="pm-gauge-scale">
                  <span>0</span>
                  <span>35</span>
                  <span>55</span>
                  <span>150</span>
                  <span>250</span>
                  <span>350</span>
                  <span>500+</span>
                </div>
              </div>
            ` : nothing}

            ${this._config.show_pm_values !== false ? html`<div class="pm-grid">
              ${pm1_0 !== null ? html`
                <div class="pm-item pm1" @click=${() => this._fireMoreInfo(this._entityIds.pm1_0)}>
                  <div class="pm-item-label">PM1.0</div>
                  <div class="pm-item-value">${pm1_0.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              ` : nothing}
              ${pm2_5 !== null ? html`
                <div class="pm-item pm2_5" @click=${() => this._fireMoreInfo(this._entityIds.pm2_5)}>
                  <div class="pm-item-label">PM2.5</div>
                  <div class="pm-item-value">${pm2_5.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              ` : nothing}
              ${pm4_0 !== null ? html`
                <div class="pm-item pm4" @click=${() => this._fireMoreInfo(this._entityIds.pm4_0)}>
                  <div class="pm-item-label">PM4.0</div>
                  <div class="pm-item-value">${pm4_0.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              ` : nothing}
              ${pm10 !== null ? html`
                <div class="pm-item pm10" @click=${() => this._fireMoreInfo(this._entityIds.pm10)}>
                  <div class="pm-item-label">PM10</div>
                  <div class="pm-item-value">${pm10.toFixed(1)}</div>
                  <span class="pm-item-unit">µg/m³</span>
                </div>
              ` : nothing}
            </div>` : nothing}

            ${nox !== null && this._config.show_nox !== false ? html`
              <div class="voc-nox-grid" style="margin-top: 12px;">
                <div class="env-card nox" @click=${() => this._fireMoreInfo(this._entityIds.nox)}>
                  <div class="env-card-header">
                    <ha-icon icon="mdi:molecule"></ha-icon>
                    <span class="env-card-label">NOx Index</span>
                  </div>
                  <div class="env-card-value">${nox.toFixed(0)}</div>
                </div>
              </div>
            ` : nothing}
          </div>
        ` : nothing}

        ${this._config.show_radar !== false ? html`
          ${hasOverviewContent ? html`<div class="section-divider"></div>` : nothing}

          <div class="radar-section">
            ${this._config.view_mode === 'room' ? html`
              <div class="room-view-container">
                ${this._renderRoomView()}
              </div>
            ` : html`
              <div class="radar-container">
                <canvas class="radar-canvas"></canvas>
              </div>
            `}

            ${this._config.show_target_details !== false ? html`
              <div class="target-info">
                ${this._targets.map((target, i) => html`
                  <div class="target-info-item ${target.active ? '' : 'inactive'}"
                       @click=${() => this._fireMoreInfo(this._entityIds.targets[i])}>
                    <div class="target-info-dot target-${i + 1}"></div>
                    <div class="target-info-label">Person ${i + 1}</div>
                    <div class="target-info-value">
                      ${target.active ? `${(target.distance / 1000).toFixed(1)}m` : '-'}
                    </div>
                  </div>
                `)}
              </div>
            ` : nothing}
          </div>
        ` : nothing}
      <smarthomeshop-sensor-settings
          .hass=${this.hass}
          .entityPrefix=${this._entityPrefix}
          .deviceName=${this._deviceName}
          .isOpen=${this._showSettings}
          @close=${() => this._showSettings = false}
        ></smarthomeshop-sensor-settings>
      </ha-card>
    `;
  }
}

// Card Editor
@customElement('smarthomeshop-ultimatesensor-card-editor')
export class SmartHomeShopUltimateSensorCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: RadarCardConfig = {};
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
    .checkbox-row label { margin-bottom: 0; }
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
      color: var(--primary-color, #9c27b0);
      flex-shrink: 0;
      margin-top: 2px;
    }
    .info-banner-content {
      flex: 1;
    }
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
    .info-banner a {
      color: var(--primary-color, #9c27b0);
      text-decoration: none;
      font-weight: 500;
    }
    .info-banner a:hover {
      text-decoration: underline;
    }
  `;

  public setConfig(config: RadarCardConfig): void {
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

      // Check for radar OR environment sensors
      const hasRadar = deviceEntities.some((e) => e.includes('target_1_x'));
      const hasEnv = deviceEntities.some((e) =>
        e.includes('scd41') || e.includes('bh1750') || e.includes('co2')
      );

      if (hasRadar || hasEnv) {
        devices.push({
          id: deviceId,
          name: (device as any).name || (device as any).name_by_user || 'UltimateSensor',
        });
      }
    }

    this._devices = devices;
  }

  private _valueChanged(key: string, value: unknown): void {
    const newConfig = { ...this._config, [key]: value };
    if (key === 'device_id') delete newConfig.entity_prefix;

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render() {
    return html`
      <div class="info-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="info-banner-content">
          <div class="info-banner-title">Set up room & zones</div>
          <div class="info-banner-text">
            Draw your room, place the sensor and configure zones in the
            <a href="/smarthomeshop" target="_top">SmartHomeShop Panel</a>.
          </div>
        </div>
      </div>

      <div class="form-row">
        <label>UltimateSensor Device</label>
        <select @change=${(e: Event) => this._valueChanged('device_id', (e.target as HTMLSelectElement).value || undefined)}>
          <option value="">-- Select device --</option>
          ${this._devices.map((d) => html`
            <option value=${d.id} ?selected=${d.id === this._config.device_id}>${d.name}</option>
          `)}
        </select>
        <div class="info">Select an UltimateSensor device with radar and/or environmental sensors.</div>
      </div>

      <div class="form-row">
        <label>Title (optional)</label>
        <input type="text" .value=${this._config.title || ''} placeholder="UltimateSensor"
          @input=${(e: Event) => this._valueChanged('title', (e.target as HTMLInputElement).value || undefined)} />
      </div>

      <div class="divider"></div>

      <div class="form-row">
        <label>Card</label>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_header" .checked=${this._config.show_header !== false}
              @change=${(e: Event) => this._valueChanged('show_header', (e.target as HTMLInputElement).checked)} />
            <label for="show_header">Header</label>
          </div>
          ${this._config.show_header !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_status" .checked=${this._config.show_status !== false}
                  @change=${(e: Event) => this._valueChanged('show_status', (e.target as HTMLInputElement).checked)} />
                <label for="show_status">Presence status</label>
              </div>
            </div>
          ` : nothing}
        </div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_room_score" .checked=${this._config.show_room_score !== false}
              @change=${(e: Event) => this._valueChanged('show_room_score', (e.target as HTMLInputElement).checked)} />
            <label for="show_room_score">Room quality score</label>
          </div>
        </div>
      </div>

      <div class="form-row">
        <label>Environmental sensors</label>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_environment" .checked=${this._config.show_environment !== false}
              @change=${(e: Event) => this._valueChanged('show_environment', (e.target as HTMLInputElement).checked)} />
            <label for="show_environment">Climate values</label>
          </div>
          ${this._config.show_environment !== false ? html`
            <div class="nested-options">
              ${([
                ['show_temperature', 'Temperature'],
                ['show_humidity', 'Humidity'],
                ['show_co2', 'CO2'],
                ['show_illuminance', 'Illuminance'],
                ['show_voc', 'VOC index'],
              ] as const).map(([key, label]) => html`
                <div class="checkbox-row">
                  <input type="checkbox" id=${key} .checked=${this._config[key] !== false}
                    @change=${(e: Event) => this._valueChanged(key, (e.target as HTMLInputElement).checked)} />
                  <label for=${key}>${label}</label>
                </div>
              `)}
              <div class="checkbox-row">
                <input type="checkbox" id="show_co2_bar" .checked=${this._config.show_co2_bar !== false}
                  @change=${(e: Event) => this._valueChanged('show_co2_bar', (e.target as HTMLInputElement).checked)} />
                <label for="show_co2_bar">CO2 quality meter</label>
              </div>
            </div>
          ` : nothing}
        </div>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_air_quality" .checked=${this._config.show_air_quality !== false}
              @change=${(e: Event) => this._valueChanged('show_air_quality', (e.target as HTMLInputElement).checked)} />
            <label for="show_air_quality">Particulate matter (PM)</label>
          </div>
          ${this._config.show_air_quality !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_pm_gauge" .checked=${this._config.show_pm_gauge !== false}
                  @change=${(e: Event) => this._valueChanged('show_pm_gauge', (e.target as HTMLInputElement).checked)} />
                <label for="show_pm_gauge">PM2.5 quality meter</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_pm_values" .checked=${this._config.show_pm_values !== false}
                  @change=${(e: Event) => this._valueChanged('show_pm_values', (e.target as HTMLInputElement).checked)} />
                <label for="show_pm_values">PM value cards</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="show_nox" .checked=${this._config.show_nox !== false}
                  @change=${(e: Event) => this._valueChanged('show_nox', (e.target as HTMLInputElement).checked)} />
                <label for="show_nox">NOx index</label>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>

      <div class="form-row">
        <label>Presence</label>
        <div class="option-group">
          <div class="checkbox-row">
            <input type="checkbox" id="show_radar" .checked=${this._config.show_radar !== false}
              @change=${(e: Event) => this._valueChanged('show_radar', (e.target as HTMLInputElement).checked)} />
            <label for="show_radar">Radar or room view</label>
          </div>
          ${this._config.show_radar !== false ? html`
            <div class="nested-options">
              <div class="checkbox-row">
                <input type="checkbox" id="show_target_details" .checked=${this._config.show_target_details !== false}
                  @change=${(e: Event) => this._valueChanged('show_target_details', (e.target as HTMLInputElement).checked)} />
                <label for="show_target_details">Person distance details</label>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>

      ${this._config.show_radar !== false ? html`
        <div class="divider"></div>

        <div class="form-row">
          <label>View mode</label>
          <select @change=${(e: Event) => this._valueChanged('view_mode', (e.target as HTMLSelectElement).value)}>
            <option value="radar" ?selected=${this._config.view_mode !== 'room'}>Radar view</option>
            <option value="room" ?selected=${this._config.view_mode === 'room'}>Room view</option>
          </select>
          <div class="info">Radar shows the sensor view. Room shows your drawn room with live tracking.</div>
        </div>

        ${this._config.view_mode === 'room' ? html`
          <div class="form-row">
            <label>Default room view</label>
            <select @change=${(e: Event) => this._valueChanged('room_view_mode', (e.target as HTMLSelectElement).value)}>
              <option value="2d" ?selected=${this._config.room_view_mode !== '3d'}>2D floor plan</option>
              <option value="3d" ?selected=${this._config.room_view_mode === '3d'}>3D view</option>
            </select>
            <div class="info">The view the card starts in. You can still switch views on the card.</div>
          </div>
        ` : nothing}

        ${this._config.view_mode !== 'room' ? html`
          <div class="divider"></div>

          <div class="form-row">
            <label>Radar options</label>
            <div class="checkbox-row">
              <input type="checkbox" id="show_zones" .checked=${this._config.show_zones !== false}
                @change=${(e: Event) => this._valueChanged('show_zones', (e.target as HTMLInputElement).checked)} />
              <label for="show_zones">Show zones</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="show_grid" .checked=${this._config.show_grid !== false}
                @change=${(e: Event) => this._valueChanged('show_grid', (e.target as HTMLInputElement).checked)} />
              <label for="show_grid">Show grid lines</label>
            </div>
          </div>

          <div class="form-row">
            <label>Maximum distance (mm)</label>
            <input type="number" .value=${this._config.max_distance || 6000} min="1000" max="8000" step="500"
              @input=${(e: Event) => this._valueChanged('max_distance', parseInt((e.target as HTMLInputElement).value))} />
          </div>
        ` : nothing}
      ` : nothing}
    `;
  }
}
