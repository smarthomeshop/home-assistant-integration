/**
 * Visual Zone Editor for UltimateSensor
 * Drag and resize zones directly on the radar visualization
 * Now with 3D visualization mode inspired by best practices!
 */

import { LitElement, html, css, nothing, PropertyValues, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';

interface Zone {
  id: number;
  beginX: number;
  endX: number;
  beginY: number;
  endY: number;
  color: string;
}

interface Target {
  id: number;
  x: number;
  y: number;
  active: boolean;
}

interface Camera3D {
  azimuth: number;
  elevation: number;
  distance: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

type DragMode = 'none' | 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'resize-n' | 'resize-s' | 'resize-w' | 'resize-e';
type ViewMode = '2d' | '3d';

@customElement('smarthomeshop-zone-editor')
export class SmartHomeShopZoneEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property() public entityPrefix: string = '';
  @property() public deviceName: string = '';
  @property({ type: Boolean }) public isOpen: boolean = false;
  @property({ type: Number }) public maxDistance: number = 6000;

  @state() private _zones: Zone[] = [];
  @state() private _targets: Target[] = [];
  @state() private _selectedZone: number | null = null;
  @state() private _dragMode: DragMode = 'none';
  @state() private _dragStart: { x: number; y: number; zone: Zone } | null = null;
  @state() private _saving: boolean = false;
  @state() private _hasChanges: boolean = false;
  @state() private _viewMode: ViewMode = '2d';
  @state() private _detectionRange: number = 6000;

  private _canvasWidth = 600;
  private _canvasHeight = 450;
  private _canvas3D: HTMLCanvasElement | null = null;
  private _ctx: CanvasRenderingContext2D | null = null;
  private _animationFrame: number | null = null;
  private _liveInterval: number | null = null;

  // 3D Camera state
  private _camera: Camera3D = {
    azimuth: 0,
    elevation: Math.PI * 0.22,
    distance: 1200,
    targetX: 0,
    targetY: 0,
    targetZ: 300,
  };

  private _orbitDragging = false;
  private _orbitLastX = 0;
  private _orbitLastY = 0;

  // Constants
  private readonly WALL_HEIGHT = 200;
  private readonly FOV_DEG = 120;
  private readonly CAMERA_FOV = 55;

  static styles = css`
    :host { display: block; }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.92);
      backdrop-filter: blur(12px);
      z-index: 1001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal {
      background: linear-gradient(165deg, #0f1419 0%, #1a1f2e 50%, #0d1117 100%);
      border-radius: 24px;
      width: 95%;
      max-width: 1000px;
      max-height: 92vh;
      overflow: hidden;
      box-shadow: 
        0 50px 100px rgba(0, 0, 0, 0.7),
        0 0 0 1px rgba(255, 255, 255, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(30px) scale(0.97);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 28px;
      background: linear-gradient(135deg, 
        rgba(59, 130, 246, 0.15) 0%, 
        rgba(139, 92, 246, 0.1) 50%,
        rgba(236, 72, 153, 0.08) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #f0f4f8;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .modal-title ha-icon {
      color: #60a5fa;
    }

    .close-btn {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8;
      width: 40px; height: 40px;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: rgba(255,255,255,0.12);
      color: #f0f4f8;
      transform: scale(1.05);
    }

    .editor-container {
      display: flex;
      gap: 20px;
      padding: 24px;
    }

    .canvas-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .view-toggle {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      width: fit-content;
      align-self: flex-end;
    }

    .view-toggle-btn {
      padding: 8px 20px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .view-toggle-btn.active {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    .view-toggle-btn:not(.active):hover {
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
    }

    .canvas-container {
      position: relative;
      background: linear-gradient(180deg, #0a0e14 0%, #0f1419 100%);
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow: 
        inset 0 2px 20px rgba(0, 0, 0, 0.4),
        0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .editor-svg {
      width: 100%;
      height: 450px;
      cursor: crosshair;
      display: block;
    }

    .canvas-3d {
      width: 100%;
      height: 450px;
      cursor: grab;
      display: block;
    }

    .canvas-3d:active {
      cursor: grabbing;
    }

    .canvas-3d.hidden {
      display: none;
    }

    .editor-svg.hidden {
      display: none;
    }

    .zone-rect {
      cursor: move;
      transition: opacity 0.15s;
    }

    .zone-rect:hover {
      opacity: 0.9;
    }

    .zone-rect.selected {
      stroke-width: 3;
    }

    .resize-handle {
      fill: white;
      stroke-width: 2;
      cursor: pointer;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .resize-handle.nw, .resize-handle.se { cursor: nwse-resize; }
    .resize-handle.ne, .resize-handle.sw { cursor: nesw-resize; }
    .resize-handle.n, .resize-handle.s { cursor: ns-resize; }
    .resize-handle.e, .resize-handle.w { cursor: ew-resize; }

    .sidebar {
      width: 240px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 8px;
    }

    .zone-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .zone-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .zone-item:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateX(2px);
    }

    .zone-item.selected {
      border-color: rgba(59, 130, 246, 0.6);
      background: rgba(59, 130, 246, 0.1);
    }

    .zone-color {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .zone-name {
      flex: 1;
      font-weight: 600;
      font-size: 0.9rem;
      color: #e2e8f0;
    }

    .zone-status {
      font-size: 0.7rem;
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      font-weight: 600;
    }

    .zone-status.inactive {
      background: rgba(100, 116, 139, 0.15);
      color: #64748b;
    }

    .info-card {
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .info-card h4 {
      margin: 0 0 12px 0;
      color: #e2e8f0;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .info-card ul {
      margin: 0;
      padding-left: 18px;
      color: #94a3b8;
      font-size: 0.8rem;
      line-height: 1.7;
    }

    .info-card li {
      margin-bottom: 4px;
    }

    .range-control {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .range-input {
      flex: 1;
      padding: 10px 14px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 0.9rem;
      width: 80px;
    }

    .range-input:focus {
      outline: none;
      border-color: rgba(59, 130, 246, 0.5);
    }

    .range-unit {
      color: #64748b;
      font-size: 0.85rem;
    }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 28px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      background: rgba(0, 0, 0, 0.2);
    }

    .changes-badge {
      font-size: 0.85rem;
      color: #f59e0b;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .btn-group {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 25px rgba(59, 130, 246, 0.45);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Grid styling */
    .grid-line {
      stroke: rgba(59, 130, 246, 0.12);
      stroke-width: 0.5;
    }

    .grid-label {
      fill: rgba(148, 163, 184, 0.6);
      font-size: 11px;
      font-weight: 500;
    }

    /* Sensor marker */
    .sensor-marker {
      fill: #3b82f6;
      filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.6));
    }

    .sensor-pulse {
      fill: none;
      stroke: #3b82f6;
      stroke-width: 2;
      animation: pulse 2s ease-out infinite;
    }

    @keyframes pulse {
      0% { 
        r: 8; 
        opacity: 0.8;
        stroke-width: 2;
      }
      100% { 
        r: 30; 
        opacity: 0;
        stroke-width: 0.5;
      }
    }

    /* Coverage arc */
    .coverage-arc {
      fill: url(#coverageGradient);
      stroke: rgba(59, 130, 246, 0.3);
      stroke-width: 1;
    }

    /* Target markers */
    .target-marker {
      filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.7));
    }

    .target-pulse {
      fill: none;
      stroke: #22c55e;
      animation: targetPulse 1.5s ease-out infinite;
    }

    @keyframes targetPulse {
      0% { r: 6; opacity: 0.7; }
      100% { r: 18; opacity: 0; }
    }

    /* 3D help overlay */
    .help-overlay {
      position: absolute;
      bottom: 16px;
      left: 16px;
      display: flex;
      gap: 16px;
      padding: 10px 16px;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      border-radius: 10px;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .help-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .help-key {
      padding: 3px 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      font-weight: 600;
      color: #e2e8f0;
    }
  `;

  private _zoneColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  connectedCallback(): void {
    super.connectedCallback();
    if (this.isOpen) {
      this._loadZones();
      this._startLiveUpdates();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopLiveUpdates();
    this._stopAnimation();
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has('isOpen')) {
      if (this.isOpen) {
        this._loadZones();
        this._startLiveUpdates();
        if (this._viewMode === '3d') {
          this._setup3DCanvas();
        }
      } else {
        this._stopLiveUpdates();
        this._stopAnimation();
      }
    }
    if (changedProps.has('_viewMode') && this.isOpen) {
      if (this._viewMode === '3d') {
        this._setup3DCanvas();
      } else {
        this._stopAnimation();
      }
    }
  }

  private _setup3DCanvas(): void {
    requestAnimationFrame(() => {
      this._canvas3D = this.shadowRoot?.querySelector('.canvas-3d') as HTMLCanvasElement;
      if (this._canvas3D) {
        this._ctx = this._canvas3D.getContext('2d', { alpha: true });
        this._setupCanvasEvents();
        this._startAnimation();
      }
    });
  }

  private _setupCanvasEvents(): void {
    if (!this._canvas3D) return;

    this._canvas3D.addEventListener('mousedown', this._handleOrbitStart);
    this._canvas3D.addEventListener('wheel', this._handleWheel, { passive: false });
    window.addEventListener('mousemove', this._handleOrbitMove);
    window.addEventListener('mouseup', this._handleOrbitEnd);
  }

  private _handleOrbitStart = (e: MouseEvent): void => {
    this._orbitDragging = true;
    this._orbitLastX = e.clientX;
    this._orbitLastY = e.clientY;
  };

  private _handleOrbitMove = (e: MouseEvent): void => {
    if (!this._orbitDragging) return;

    const dx = e.clientX - this._orbitLastX;
    const dy = e.clientY - this._orbitLastY;

    if (e.shiftKey) {
      // Pan mode
      const speed = this._camera.distance * 0.002;
      const cosA = Math.cos(this._camera.azimuth);
      const sinA = Math.sin(this._camera.azimuth);
      this._camera.targetX -= (dx * cosA) * speed;
      this._camera.targetZ -= (dx * sinA) * speed;
      this._camera.targetY += dy * speed * 0.5;
    } else {
      // Orbit mode
      this._camera.azimuth += dx * 0.008;
      this._camera.elevation = Math.max(0.05, Math.min(Math.PI * 0.45, this._camera.elevation - dy * 0.008));
    }

    this._orbitLastX = e.clientX;
    this._orbitLastY = e.clientY;
  };

  private _handleOrbitEnd = (): void => {
    this._orbitDragging = false;
  };

  private _handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    this._camera.distance = Math.max(400, Math.min(3000, this._camera.distance * delta));
  };

  private _startAnimation(): void {
    const animate = () => {
      this._render3D();
      this._animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  private _stopAnimation(): void {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  }

  private _startLiveUpdates(): void {
    this._updateTargets();
    this._liveInterval = window.setInterval(() => this._updateTargets(), 100);
  }

  private _stopLiveUpdates(): void {
    if (this._liveInterval) {
      clearInterval(this._liveInterval);
      this._liveInterval = null;
    }
  }

  private _updateTargets(): void {
    if (!this.hass || !this.entityPrefix) return;

    const targets: Target[] = [];
    for (let i = 1; i <= 3; i++) {
      const xEntity = `sensor.${this.entityPrefix}_target_${i}_x`;
      const yEntity = `sensor.${this.entityPrefix}_target_${i}_y`;
      const activeEntity = `binary_sensor.${this.entityPrefix}_target_${i}`;

      const x = parseFloat(this.hass.states[xEntity]?.state || '0');
      const y = parseFloat(this.hass.states[yEntity]?.state || '0');
      const active = this.hass.states[activeEntity]?.state === 'on';

      targets.push({ id: i, x, y, active: active && (x !== 0 || y !== 0) });
    }
    this._targets = targets;
  }

  private _loadZones(): void {
    if (!this.hass || !this.entityPrefix) return;

    const zones: Zone[] = [];
    for (let i = 1; i <= 4; i++) {
      zones.push({
        id: i,
        beginX: this._getNum(`zone_${i}_begin_x`),
        endX: this._getNum(`zone_${i}_end_x`),
        beginY: this._getNum(`zone_${i}_begin_y`),
        endY: this._getNum(`zone_${i}_end_y`),
        color: this._zoneColors[i - 1],
      });
    }
    this._zones = zones;
    this._hasChanges = false;

    // Load detection range
    const rangeEntity = `number.${this.entityPrefix}_max_distance`;
    const range = parseFloat(this.hass.states[rangeEntity]?.state || '6000');
    this._detectionRange = range;
  }

  private _getNum(suffix: string): number {
    const entityId = `number.${this.entityPrefix}_${suffix}`;
    const state = this.hass?.states[entityId]?.state;
    return state && state !== 'unavailable' ? parseFloat(state) : 0;
  }

  // ==================== 3D RENDERING ====================

  private _render3D(): void {
    if (!this._ctx || !this._canvas3D) return;

    const canvas = this._canvas3D;
    const ctx = this._ctx;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set canvas size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, w, h);

    // Calculate camera position
    const cam = this._camera;
    const camX = cam.targetX + cam.distance * Math.cos(cam.elevation) * Math.sin(cam.azimuth);
    const camY = cam.targetY + cam.distance * Math.sin(cam.elevation);
    const camZ = cam.targetZ + cam.distance * Math.cos(cam.elevation) * Math.cos(cam.azimuth);

    const cosA = Math.cos(cam.azimuth);
    const sinA = Math.sin(cam.azimuth);
    const cosE = Math.cos(cam.elevation);
    const sinE = Math.sin(cam.elevation);

    const fov = this.CAMERA_FOV * Math.PI / 180;
    const scale = (h * 0.5) / Math.tan(fov / 2);
    const cx = w / 2;
    const cy = h / 2;

    // Project world to screen
    const project = (wx: number, wy: number, wz: number) => {
      const dx = wx - camX;
      const dy = wy - camY;
      const dz = wz - camZ;

      const x1 = cosA * dx - sinA * dz;
      const z1 = sinA * dx + cosA * dz;
      const y1 = cosE * dy - sinE * z1;
      const z2 = sinE * dy + cosE * z1;

      const z = -z2;
      if (z <= 0.1) return null;

      return {
        x: cx + (x1 * scale) / z,
        y: cy - (y1 * scale) / z,
        z: z
      };
    };

    // Draw grid
    this._drawGrid3D(ctx, project);

    // Draw FOV cone
    this._drawFov3D(ctx, project);

    // Draw zones
    this._drawZones3D(ctx, project);

    // Draw targets
    this._drawTargets3D(ctx, project);

    // Draw sensor marker
    this._drawSensor3D(ctx, project);
  }

  private _drawGrid3D(
    ctx: CanvasRenderingContext2D, 
    project: (x: number, y: number, z: number) => { x: number; y: number; z: number } | null
  ): void {
    const gridColor = 'rgba(59, 130, 246, 0.15)';
    const maxDist = this._detectionRange;
    const step = 1000;

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;

    // X lines (left to right)
    for (let x = -4000; x <= 4000; x += step) {
      const p1 = project(x, 0, 0);
      const p2 = project(x, 0, maxDist);
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Z lines (front to back)
    for (let z = 0; z <= maxDist; z += step) {
      const p1 = project(-4000, 0, z);
      const p2 = project(4000, 0, z);
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Distance labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '11px system-ui, sans-serif';
    for (let z = step; z <= maxDist; z += step) {
      const p = project(4200, 0, z);
      if (p) {
        ctx.fillText(`${z / 1000}m`, p.x, p.y + 4);
      }
    }
  }

  private _drawFov3D(
    ctx: CanvasRenderingContext2D,
    project: (x: number, y: number, z: number) => { x: number; y: number; z: number } | null
  ): void {
    const range = this._detectionRange;
    const halfFov = (this.FOV_DEG / 2) * Math.PI / 180;

    // Create arc points
    const pts: { x: number; z: number }[] = [{ x: 0, z: 0 }];
    for (let a = -halfFov; a <= halfFov; a += 0.05) {
      pts.push({
        x: range * Math.sin(a),
        z: range * Math.cos(a)
      });
    }
    pts.push({ x: 0, z: 0 });

    // Draw filled arc on ground
    ctx.beginPath();
    let first = true;
    for (const pt of pts) {
      const p = project(pt.x, 0, pt.z);
      if (!p) continue;
      if (first) {
        ctx.moveTo(p.x, p.y);
        first = false;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createRadialGradient(
      ctx.canvas.width / 2 / (window.devicePixelRatio || 1), 
      ctx.canvas.height / (window.devicePixelRatio || 1), 
      0,
      ctx.canvas.width / 2 / (window.devicePixelRatio || 1), 
      ctx.canvas.height / (window.devicePixelRatio || 1), 
      300
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private _drawZones3D(
    ctx: CanvasRenderingContext2D,
    project: (x: number, y: number, z: number) => { x: number; y: number; z: number } | null
  ): void {
    const wallH = this.WALL_HEIGHT;

    for (const zone of this._zones) {
      const isActive = zone.beginX !== 0 || zone.endX !== 0 || zone.beginY !== 0 || zone.endY !== 0;
      if (!isActive) continue;

      const x1 = Math.min(zone.beginX, zone.endX);
      const x2 = Math.max(zone.beginX, zone.endX);
      const z1 = Math.min(zone.beginY, zone.endY);
      const z2 = Math.max(zone.beginY, zone.endY);

      const isSelected = this._selectedZone === zone.id;

      // Draw floor
      const floorPts = [
        project(x1, 0, z1),
        project(x2, 0, z1),
        project(x2, 0, z2),
        project(x1, 0, z2),
      ].filter(p => p !== null);

      if (floorPts.length === 4) {
        ctx.beginPath();
        ctx.moveTo(floorPts[0]!.x, floorPts[0]!.y);
        for (let i = 1; i < floorPts.length; i++) {
          ctx.lineTo(floorPts[i]!.x, floorPts[i]!.y);
        }
        ctx.closePath();
        ctx.fillStyle = zone.color + '30';
        ctx.fill();
        ctx.strokeStyle = zone.color + '80';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();
      }

      // Draw walls (collect and sort by depth)
      const walls = [
        { pts: [[x1, z1], [x2, z1]], label: 'front' },
        { pts: [[x2, z1], [x2, z2]], label: 'right' },
        { pts: [[x2, z2], [x1, z2]], label: 'back' },
        { pts: [[x1, z2], [x1, z1]], label: 'left' },
      ];

      for (const wall of walls) {
        const [[wx1, wz1], [wx2, wz2]] = wall.pts;
        const b1 = project(wx1, 0, wz1);
        const b2 = project(wx2, 0, wz2);
        const t1 = project(wx1, wallH, wz1);
        const t2 = project(wx2, wallH, wz2);

        if (b1 && b2 && t1 && t2) {
          ctx.beginPath();
          ctx.moveTo(b1.x, b1.y);
          ctx.lineTo(b2.x, b2.y);
          ctx.lineTo(t2.x, t2.y);
          ctx.lineTo(t1.x, t1.y);
          ctx.closePath();
          ctx.fillStyle = zone.color + '20';
          ctx.fill();
          ctx.strokeStyle = zone.color + (isSelected ? 'cc' : '60');
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.stroke();
        }
      }

      // Zone label
      const centerP = project((x1 + x2) / 2, wallH + 30, (z1 + z2) / 2);
      if (centerP) {
        ctx.fillStyle = zone.color;
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Zone ${zone.id}`, centerP.x, centerP.y);
      }
    }
  }

  private _drawTargets3D(
    ctx: CanvasRenderingContext2D,
    project: (x: number, y: number, z: number) => { x: number; y: number; z: number } | null
  ): void {
    for (const target of this._targets) {
      if (!target.active) continue;

      const height = 170; // Human height
      const p = project(target.x, height / 2, target.y);
      if (!p) continue;

      // Draw human figure (simplified capsule)
      const headP = project(target.x, height, target.y);
      const footP = project(target.x, 0, target.y);

      if (headP && footP) {
        // Body line
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(footP.x, footP.y);
        ctx.lineTo(headP.x, headP.y);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(headP.x, headP.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(headP.x, headP.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Target label
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`T${target.id}`, headP.x, headP.y - 20);
      }

      // Ground marker
      const groundP = project(target.x, 0, target.y);
      if (groundP) {
        ctx.beginPath();
        ctx.arc(groundP.x, groundP.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.fill();
      }
    }
  }

  private _drawSensor3D(
    ctx: CanvasRenderingContext2D,
    project: (x: number, y: number, z: number) => { x: number; y: number; z: number } | null
  ): void {
    const p = project(0, 10, 0);
    if (!p) return;

    // Sensor body
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner dot
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SENSOR', p.x, p.y + 25);
  }

  // ==================== 2D RENDERING ====================

  // Convert mm coordinates to SVG coordinates
  private _toSvg(x: number, y: number): { x: number; y: number } {
    const maxDist = this._detectionRange;
    const centerX = this._canvasWidth / 2;
    const sensorY = this._canvasHeight - 40;
    const scale = (this._canvasHeight - 80) / maxDist;

    return {
      x: centerX + x * scale,
      y: sensorY - y * scale,
    };
  }

  // Convert SVG coordinates to mm
  private _fromSvg(svgX: number, svgY: number): { x: number; y: number } {
    const maxDist = this._detectionRange;
    const centerX = this._canvasWidth / 2;
    const sensorY = this._canvasHeight - 40;
    const scale = (this._canvasHeight - 80) / maxDist;

    return {
      x: (svgX - centerX) / scale,
      y: (sensorY - svgY) / scale,
    };
  }

  private _getSvgPoint(e: MouseEvent): { x: number; y: number } {
    const svg = this.shadowRoot?.querySelector('.editor-svg') as SVGSVGElement;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = this._canvasWidth / rect.width;
    const scaleY = this._canvasHeight / rect.height;

    return { x: x * scaleX, y: y * scaleY };
  }

  private _handleMouseDown(e: MouseEvent, zoneId: number, mode: DragMode): void {
    e.stopPropagation();
    e.preventDefault();

    const zone = this._zones.find(z => z.id === zoneId);
    if (!zone) return;

    this._selectedZone = zoneId;
    this._dragMode = mode;
    this._dragStart = { ...this._getSvgPoint(e), zone: { ...zone } };

    window.addEventListener('mousemove', this._handleMouseMove);
    window.addEventListener('mouseup', this._handleMouseUp);
  }

  private _handleMouseMove = (e: MouseEvent): void => {
    if (!this._dragStart || this._dragMode === 'none') return;

    const current = this._getSvgPoint(e);
    const startMm = this._fromSvg(this._dragStart.x, this._dragStart.y);
    const currentMm = this._fromSvg(current.x, current.y);

    const deltaX = currentMm.x - startMm.x;
    const deltaY = currentMm.y - startMm.y;

    const zone = this._zones.find(z => z.id === this._selectedZone);
    if (!zone) return;

    const orig = this._dragStart.zone;
    const snap = 100;

    if (this._dragMode === 'move') {
      zone.beginX = Math.round((orig.beginX + deltaX) / snap) * snap;
      zone.endX = Math.round((orig.endX + deltaX) / snap) * snap;
      zone.beginY = Math.round((orig.beginY + deltaY) / snap) * snap;
      zone.endY = Math.round((orig.endY + deltaY) / snap) * snap;
    } else {
      if (this._dragMode.includes('w')) {
        zone.beginX = Math.round((orig.beginX + deltaX) / snap) * snap;
      }
      if (this._dragMode.includes('e')) {
        zone.endX = Math.round((orig.endX + deltaX) / snap) * snap;
      }
      if (this._dragMode.includes('n')) {
        zone.endY = Math.round((orig.endY + deltaY) / snap) * snap;
      }
      if (this._dragMode.includes('s')) {
        zone.beginY = Math.round((orig.beginY + deltaY) / snap) * snap;
      }
    }

    zone.beginX = Math.max(-4000, Math.min(4000, zone.beginX));
    zone.endX = Math.max(-4000, Math.min(4000, zone.endX));
    zone.beginY = Math.max(0, Math.min(6000, zone.beginY));
    zone.endY = Math.max(0, Math.min(6000, zone.endY));

    this._hasChanges = true;
    this.requestUpdate();
  };

  private _handleMouseUp = (): void => {
    this._dragMode = 'none';
    this._dragStart = null;
    window.removeEventListener('mousemove', this._handleMouseMove);
    window.removeEventListener('mouseup', this._handleMouseUp);
  };

  private async _saveAllZones(): Promise<void> {
    if (!this.hass || !this.entityPrefix) return;
    this._saving = true;

    try {
      const promises: Promise<void>[] = [];

      for (const zone of this._zones) {
        const clampedZone = {
          ...zone,
          beginX: Math.max(-4000, Math.min(4000, zone.beginX)),
          endX: Math.max(-4000, Math.min(4000, zone.endX)),
          beginY: Math.max(0, Math.min(6000, zone.beginY)),
          endY: Math.max(0, Math.min(6000, zone.endY)),
        };
        promises.push(
          this.hass.callService('number', 'set_value', {
            entity_id: `number.${this.entityPrefix}_zone_${zone.id}_begin_x`,
            value: clampedZone.beginX,
          }),
          this.hass.callService('number', 'set_value', {
            entity_id: `number.${this.entityPrefix}_zone_${zone.id}_end_x`,
            value: clampedZone.endX,
          }),
          this.hass.callService('number', 'set_value', {
            entity_id: `number.${this.entityPrefix}_zone_${zone.id}_begin_y`,
            value: clampedZone.beginY,
          }),
          this.hass.callService('number', 'set_value', {
            entity_id: `number.${this.entityPrefix}_zone_${zone.id}_end_y`,
            value: clampedZone.endY,
          })
        );
      }

      await Promise.all(promises);
      this._hasChanges = false;
    } catch (e) {
      console.error('Failed to save zones:', e);
    } finally {
      this._saving = false;
    }
  }

  private _close(): void {
    this._stopLiveUpdates();
    this._stopAnimation();
    this.dispatchEvent(new CustomEvent('close'));
  }


  private _renderGrid() {
    const lines = [];
    const labels = [];
    const maxDist = this._detectionRange;

    // Distance arcs at 1m intervals
    for (let d = 1000; d <= maxDist; d += 1000) {
      const top = this._toSvg(0, d);
      const radius = (this._canvasHeight - 80) * (d / maxDist);

      lines.push(svg`
        <circle
          cx="${this._canvasWidth / 2}"
          cy="${this._canvasHeight - 40}"
          r="${radius}"
          class="grid-line"
          fill="none"
        />
      `);

      labels.push(svg`
        <text x="${this._canvasWidth - 15}" y="${top.y + 4}" class="grid-label" text-anchor="end">
          ${d / 1000}m
        </text>
      `);
    }

    // Center line
    lines.push(svg`
      <line
        x1="${this._canvasWidth / 2}"
        y1="${this._canvasHeight - 40}"
        x2="${this._canvasWidth / 2}"
        y2="20"
        class="grid-line"
      />
    `);

    return [...lines, ...labels];
  }

  private _renderCoverageArc() {
    const centerX = this._canvasWidth / 2;
    const sensorY = this._canvasHeight - 40;
    const maxDist = this._detectionRange;
    const radius = (this._canvasHeight - 80) * (maxDist / maxDist);
    const angle = (this.FOV_DEG / 2) * Math.PI / 180;

    const startX = centerX + radius * Math.sin(-angle);
    const startY = sensorY - radius * Math.cos(-angle);
    const endX = centerX + radius * Math.sin(angle);
    const endY = sensorY - radius * Math.cos(angle);

    return svg`
      <defs>
        <radialGradient id="coverageGradient" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stop-color="rgba(59, 130, 246, 0.35)" />
          <stop offset="100%" stop-color="rgba(59, 130, 246, 0.02)" />
        </radialGradient>
      </defs>
      <path
        class="coverage-arc"
        d="M ${centerX} ${sensorY} L ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY} Z"
      />
    `;
  }

  private _renderTargets() {
    return this._targets.filter(t => t.active).map(target => {
      const pos = this._toSvg(target.x, target.y);
      return svg`
        <g class="target-marker">
          <circle class="target-pulse" cx="${pos.x}" cy="${pos.y}" r="6" />
          <circle cx="${pos.x}" cy="${pos.y}" r="8" fill="#22c55e" />
          <circle cx="${pos.x}" cy="${pos.y}" r="4" fill="#4ade80" />
          <text x="${pos.x}" y="${pos.y - 15}" fill="#22c55e" font-size="11" font-weight="bold" text-anchor="middle">
            T${target.id}
          </text>
        </g>
      `;
    });
  }

  private _renderZone(zone: Zone) {
    const isActive = zone.beginX !== 0 || zone.endX !== 0 || zone.beginY !== 0 || zone.endY !== 0;
    if (!isActive) return nothing;

    const topLeft = this._toSvg(Math.min(zone.beginX, zone.endX), Math.max(zone.beginY, zone.endY));
    const bottomRight = this._toSvg(Math.max(zone.beginX, zone.endX), Math.min(zone.beginY, zone.endY));

    const x = topLeft.x;
    const y = topLeft.y;
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;

    const isSelected = this._selectedZone === zone.id;
    const handleSize = 8;

    const handles = isSelected ? [
      { name: 'nw', x: x, y: y },
      { name: 'ne', x: x + width, y: y },
      { name: 'sw', x: x, y: y + height },
      { name: 'se', x: x + width, y: y + height },
      { name: 'n', x: x + width / 2, y: y },
      { name: 's', x: x + width / 2, y: y + height },
      { name: 'w', x: x, y: y + height / 2 },
      { name: 'e', x: x + width, y: y + height / 2 },
    ] : [];

    return svg`
      <g>
        <rect
          x="${x}" y="${y}"
          width="${width}" height="${height}"
          fill="${zone.color}35"
          stroke="${zone.color}"
          stroke-width="${isSelected ? 3 : 2}"
          rx="6"
          class="zone-rect ${isSelected ? 'selected' : ''}"
          @mousedown=${(e: MouseEvent) => this._handleMouseDown(e, zone.id, 'move')}
        />
        <text
          x="${x + width / 2}" y="${y + 22}"
          fill="white"
          font-size="13"
          font-weight="700"
          text-anchor="middle"
          pointer-events="none"
          style="text-shadow: 0 2px 6px rgba(0,0,0,0.9)"
        >
          Zone ${zone.id}
        </text>
        ${handles.map(h => svg`
          <circle
            cx="${h.x}" cy="${h.y}"
            r="${handleSize}"
            class="resize-handle ${h.name}"
            stroke="${zone.color}"
            @mousedown=${(e: MouseEvent) => this._handleMouseDown(e, zone.id, `resize-${h.name}` as DragMode)}
          />
        `)}
      </g>
    `;
  }

  protected render() {
    if (!this.isOpen) return nothing;

    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this._close()}>
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <ha-icon icon="mdi:vector-square-edit"></ha-icon>
              Zone Editor - ${this.deviceName || 'UltimateSensor'}
            </div>
            <button class="close-btn" @click=${this._close}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>

          <div class="editor-container">
            <div class="canvas-section">
              <div class="view-toggle">
                <button 
                  class="view-toggle-btn ${this._viewMode === '2d' ? 'active' : ''}"
                  @click=${() => this._viewMode = '2d'}
                >
                  2D
                </button>
                <button 
                  class="view-toggle-btn ${this._viewMode === '3d' ? 'active' : ''}"
                  @click=${() => this._viewMode = '3d'}
                >
                  3D
                </button>
              </div>

              <div class="canvas-container">
                <!-- 2D SVG View -->
                <svg
                  class="editor-svg ${this._viewMode === '3d' ? 'hidden' : ''}"
                  viewBox="0 0 ${this._canvasWidth} ${this._canvasHeight}"
                  @click=${() => this._selectedZone = null}
                >
                  ${this._renderGrid()}
                  ${this._renderCoverageArc()}
                  ${this._zones.map(z => this._renderZone(z))}
                  ${this._renderTargets()}

                  <!-- Sensor marker -->
                  <circle class="sensor-pulse" cx="${this._canvasWidth / 2}" cy="${this._canvasHeight - 40}" r="8" />
                  <circle cx="${this._canvasWidth / 2}" cy="${this._canvasHeight - 40}" r="10" class="sensor-marker" />
                  <circle cx="${this._canvasWidth / 2}" cy="${this._canvasHeight - 40}" r="4" fill="#60a5fa" />
                  <text x="${this._canvasWidth / 2}" y="${this._canvasHeight - 15}" fill="rgba(148,163,184,0.7)" font-size="10" text-anchor="middle" font-weight="600">SENSOR</text>
                </svg>

                <!-- 3D Canvas View -->
                <canvas class="canvas-3d ${this._viewMode === '2d' ? 'hidden' : ''}"></canvas>

                ${this._viewMode === '3d' ? html`
                  <div class="help-overlay">
                    <div class="help-item">
                      <span class="help-key">Drag</span>
                      <span>Rotate</span>
                    </div>
                    <div class="help-item">
                      <span class="help-key">Shift+Drag</span>
                      <span>Pan</span>
                    </div>
                    <div class="help-item">
                      <span class="help-key">Scroll</span>
                      <span>Zoom</span>
                    </div>
                  </div>
                ` : nothing}
              </div>
            </div>

            <div class="sidebar">
              <div>
                <div class="section-title">Zones</div>
                <div class="zone-list">
                  ${this._zones.map(zone => {
                    const isActive = zone.beginX !== 0 || zone.endX !== 0 || zone.beginY !== 0 || zone.endY !== 0;
                    return html`
                      <div
                        class="zone-item ${this._selectedZone === zone.id ? 'selected' : ''}"
                        @click=${() => this._selectedZone = zone.id}
                      >
                        <div class="zone-color" style="background: ${zone.color}"></div>
                        <span class="zone-name">Zone ${zone.id}</span>
                        <span class="zone-status ${isActive ? '' : 'inactive'}">${isActive ? 'Actief' : 'Leeg'}</span>
                      </div>
                    `;
                  })}
                </div>
              </div>

              <div class="info-card">
                <h4>Live Targets</h4>
                ${this._targets.filter(t => t.active).length > 0 
                  ? this._targets.filter(t => t.active).map(t => html`
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></div>
                        <span style="color: #e2e8f0; font-size: 0.85rem;">Target ${t.id}: ${Math.round(t.x)}mm, ${Math.round(t.y)}mm</span>
                      </div>
                    `)
                  : html`<span style="color: #64748b; font-size: 0.85rem;">Geen actieve targets</span>`
                }
              </div>

              <div class="info-card">
                <h4>${this._viewMode === '3d' ? '3D Controls' : 'Instructies'}</h4>
                <ul>
                  ${this._viewMode === '3d' ? html`
                    <li>Sleep om te roteren</li>
                    <li>Shift + sleep om te pannen</li>
                    <li>Scroll om te zoomen</li>
                    <li>Zones bewerken in 2D modus</li>
                  ` : html`
                    <li>Klik op een zone om te selecteren</li>
                    <li>Sleep de zone om te verplaatsen</li>
                    <li>Gebruik de handles om te resizen</li>
                    <li>Coördinaten snappen naar 100mm</li>
                  `}
                </ul>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="changes-badge">
              ${this._hasChanges ? html`
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                Onopgeslagen wijzigingen
              ` : nothing}
            </div>
            <div class="btn-group">
              <button class="btn btn-secondary" @click=${this._loadZones}>Reset</button>
              <button class="btn btn-primary" @click=${this._saveAllZones} ?disabled=${!this._hasChanges || this._saving}>
                ${this._saving ? 'Opslaan...' : 'Opslaan naar sensor'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
