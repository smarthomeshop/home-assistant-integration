import { LitElement, css, html, nothing, svg, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';
import { panelText } from '../utils/panel-translations';
import { projectRadarTargetToRoom } from '../utils/radar-coordinates';
import { mapReportedZToRoom } from '../utils/multi-sensor-tracking';
import { radarRoomFurnitureCorners } from '../utils/radar-room-geometry';
import { projectRoomPoint2D, projectStandaloneRadar3D, radarTargetIsFresh } from '../utils/radar-view-projection';

interface LiveRadarTarget {
  index: number;
  x_mm: number;
  y_mm: number;
  z_mm?: number | null;
  updated_at?: string | null;
  age_ms?: number | null;
}

interface LiveRadarView {
  supported?: boolean;
  radar_model?: string;
  mounting_mode?: string;
  coordinate_projection?: 'forward_xy' | 'floor_xy' | string;
  maximum_range_mm?: number | null;
  mounting_height_mm?: number | null;
  required_installation_mode?: string | null;
  current_hardware_mode?: string | null;
  installation_ready?: boolean;
  detection_sector?: {
    distance_mm?: number | null;
    start_angle_deg?: number | null;
    end_angle_deg?: number | null;
  };
  targets?: LiveRadarTarget[];
  room_context?: RadarRoomContext | null;
}

interface RadarRoomPoint { x: number; y: number }
interface RadarRoomWall { x1: number; y1: number; x2: number; y2: number }
interface RadarRoomZone {
  id?: string | number;
  name?: string;
  type?: string;
  color?: string;
  points?: RadarRoomPoint[];
  parts?: RadarRoomPoint[][];
}
interface RadarRoomFurniture {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  depth?: number;
  height?: number;
  rotationDeg?: number;
  rotation?: number;
}
interface RadarRoomSensor {
  id?: string;
  deviceId?: string | null;
  x?: number;
  y?: number;
  rotation?: number;
  heightMm?: number;
  mountingMode?: string;
  z_mapping?: {
    mode: 'raw' | 'floor_up' | 'sensor_down';
    verified: boolean;
  };
}
interface RadarRoomContext {
  id?: string;
  name?: string;
  ceiling_height_mm?: number;
  walls?: RadarRoomWall[];
  zones?: RadarRoomZone[];
  furniture?: RadarRoomFurniture[];
  sensors?: RadarRoomSensor[];
  linked_sensor_id?: string | null;
}

interface TrailPoint extends LiveRadarTarget { seenAt: number }

const TARGET_COLORS = ['#4361ee', '#16a06b', '#f59e0b', '#c026d3', '#ef4444'];
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export class DeviceRadarView extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public radar: LiveRadarView | null = null;
  @property({ type: Boolean }) public unavailable = false;
  @state() private _view: '2d' | '3d' = '2d';
  @state() private _scope: 'radar' | 'room' = 'radar';
  @state() private _showTrails = true;
  @state() private _trailSeconds = 30;
  @state() private _rangeOverride = 0;
  @state() private _trailRevision = 0;
  private _trails = new Map<number, TrailPoint[]>();
  private _freshnessTimer?: number;
  private _radarReceivedAt = Date.now();

  static styles = css`
    :host { display: block; margin-bottom: 16px; }
    .card { overflow: hidden; border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); background: var(--card-background-color); }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 15px 16px 12px; border-bottom: 1px solid var(--divider-color); }
    .title { color: var(--primary-text-color); font-size: 14px; font-weight: 650; }
    .sub { margin-top: 3px; color: var(--secondary-text-color); font-size: 12px; line-height: 1.4; }
    .model { flex: 0 0 auto; padding: 4px 9px; border-radius: 999px; background: color-mix(in srgb, var(--primary-color, #4361ee) 10%, var(--card-background-color)); color: var(--primary-color, #4361ee); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--divider-color); }
    .segmented { display: inline-flex; padding: 2px; border: 1px solid var(--divider-color); border-radius: 9px; background: var(--secondary-background-color); }
    button, select { min-height: 36px; border: 1px solid var(--divider-color); border-radius: 8px; background: transparent; color: var(--primary-text-color); font: inherit; font-size: 12px; }
    button { padding: 7px 11px; cursor: pointer; }
    select { padding: 6px 28px 6px 9px; }
    .segmented button { min-width: 48px; border: 0; min-height: 36px; padding: 7px 10px; }
    .segmented button.active { background: var(--card-background-color); color: var(--primary-color, #4361ee); box-shadow: 0 1px 3px rgba(0, 0, 0, .12); font-weight: 650; }
    .scope-segmented button { min-width: 0; max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    button:focus-visible, select:focus-visible { outline: 2px solid var(--primary-color, #4361ee); outline-offset: 2px; }
    .check { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; color: var(--primary-text-color); font-size: 12px; }
    .check input { accent-color: var(--primary-color, #4361ee); }
    .spacer { flex: 1 1 auto; }
    .scene { position: relative; min-height: 330px; background: color-mix(in srgb, var(--secondary-background-color) 42%, var(--card-background-color)); }
    svg { display: block; width: 100%; height: min(52vw, 430px); min-height: 330px; touch-action: pan-y; }
    .grid { stroke: color-mix(in srgb, var(--secondary-text-color) 20%, transparent); stroke-width: .35; vector-effect: non-scaling-stroke; }
    .axis { stroke: color-mix(in srgb, var(--secondary-text-color) 52%, transparent); stroke-width: .65; vector-effect: non-scaling-stroke; }
    .axis-label { fill: var(--secondary-text-color); font-size: 3.2px; font-weight: 650; }
    .sector { fill: color-mix(in srgb, var(--primary-color, #4361ee) 9%, transparent); stroke: color-mix(in srgb, var(--primary-color, #4361ee) 38%, transparent); stroke-width: .55; vector-effect: non-scaling-stroke; }
    .trail { fill: none; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; opacity: .52; vector-effect: non-scaling-stroke; }
    .target-stem { stroke-width: 1.4; stroke-linecap: round; vector-effect: non-scaling-stroke; }
    .sensor-line { stroke: color-mix(in srgb, var(--primary-text-color) 38%, transparent); stroke-width: .65; stroke-dasharray: 2 1.4; vector-effect: non-scaling-stroke; }
    .sensor-marker { fill: var(--primary-text-color); }
    .room-floor { fill: color-mix(in srgb, var(--secondary-background-color) 56%, var(--card-background-color)); stroke: color-mix(in srgb, var(--secondary-text-color) 34%, transparent); stroke-width: .6; vector-effect: non-scaling-stroke; }
    .room-wall { fill: none; stroke: var(--primary-text-color); stroke-width: 1.8; stroke-linecap: round; vector-effect: non-scaling-stroke; }
    .room-wall-back { fill: none; stroke: color-mix(in srgb, var(--primary-text-color) 34%, transparent); stroke-width: .8; vector-effect: non-scaling-stroke; }
    .room-zone { stroke-width: .65; vector-effect: non-scaling-stroke; opacity: .72; }
    .room-furniture { fill: color-mix(in srgb, var(--secondary-text-color) 13%, var(--card-background-color)); stroke: color-mix(in srgb, var(--secondary-text-color) 35%, transparent); stroke-width: .5; vector-effect: non-scaling-stroke; }
    .room-sensor { fill: var(--card-background-color); stroke: var(--primary-color, #4361ee); stroke-width: 1.4; vector-effect: non-scaling-stroke; }
    .room-sensor.current { fill: var(--primary-color, #4361ee); }
    .room-name { fill: var(--secondary-text-color); font-size: 3.2px; font-weight: 650; }
    .target-dot { stroke: var(--card-background-color); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
    .target-label { fill: var(--primary-text-color); font-size: 3.3px; font-weight: 750; paint-order: stroke; stroke: var(--card-background-color); stroke-width: 1.5px; stroke-linejoin: round; }
    .empty { position: absolute; inset: 0; display: grid; place-content: center; gap: 7px; padding: 24px; text-align: center; color: var(--secondary-text-color); pointer-events: none; }
    .empty ha-icon { margin: auto; --mdc-icon-size: 28px; opacity: .65; }
    .warning { display: flex; align-items: flex-start; gap: 9px; margin: 12px 16px 0; padding: 10px 12px; border: 1px solid color-mix(in srgb, #f59e0b 28%, var(--divider-color)); border-radius: 9px; background: color-mix(in srgb, #f59e0b 8%, var(--card-background-color)); color: var(--primary-text-color); font-size: 12px; line-height: 1.45; }
    .warning ha-icon { flex: 0 0 auto; color: #d97706; --mdc-icon-size: 18px; }
    .foot { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 9px 16px; border-top: 1px solid var(--divider-color); color: var(--secondary-text-color); font-size: 11.5px; }
    .sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    @media (max-width: 620px) {
      .head { gap: 10px; }
      .toolbar { align-items: stretch; }
      .spacer { display: none; }
      .scene, svg { min-height: 270px; }
      svg { height: 72vw; max-height: 360px; }
    }
  `;

  protected updated(changed: PropertyValues<this>): void {
    if (changed.has('unavailable') && this.unavailable) this._clearTrails();
    if (changed.has('radar')) {
      this._radarReceivedAt = Date.now();
      this._captureTargets();
      if (!this.radar?.room_context && this._scope === 'room') this._scope = 'radar';
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this._freshnessTimer) window.clearInterval(this._freshnessTimer);
    this._freshnessTimer = window.setInterval(() => this._captureTargets(), 1000);
  }

  disconnectedCallback(): void {
    if (this._freshnessTimer) window.clearInterval(this._freshnessTimer);
    this._freshnessTimer = undefined;
    super.disconnectedCallback();
  }

  private _captureTargets(): void {
    if (this.unavailable) return;
    const now = Date.now();
    const cutoff = now - this._trailSeconds * 1000;
    const activeIndexes = new Set<number>();
    for (const target of this._targets()) {
      if (!finite(target.x_mm) || !finite(target.y_mm)) continue;
      activeIndexes.add(target.index);
      const trail = (this._trails.get(target.index) || []).filter(point => point.seenAt >= cutoff);
      const last = trail[trail.length - 1];
      if (!last || last.x_mm !== target.x_mm || last.y_mm !== target.y_mm || last.z_mm !== target.z_mm) {
        trail.push({ ...target, seenAt: now });
      }
      this._trails.set(target.index, trail.slice(-120));
    }
    for (const [index, trail] of this._trails) {
      if (!activeIndexes.has(index)) {
        this._trails.delete(index);
        continue;
      }
      const fresh = trail.filter(point => point.seenAt >= cutoff);
      if (fresh.length) this._trails.set(index, fresh);
      else this._trails.delete(index);
    }
    this._trailRevision += 1;
  }

  private _clearTrails(): void {
    this._trails = new Map();
    this._trailRevision += 1;
  }

  private _targets(): LiveRadarTarget[] {
    if (this.unavailable) return [];
    const now = Date.now();
    return (this.radar?.targets || []).filter(target => radarTargetIsFresh(
      target.age_ms,
      this._radarReceivedAt,
      now,
    ));
  }

  private _rangeMm(): number {
    if (this._rangeOverride) return this._rangeOverride;
    const targetExtent = Math.max(0, ...this._targets().flatMap(target => [Math.abs(target.x_mm), Math.abs(target.y_mm)]));
    const configured = finite(this.radar?.maximum_range_mm) ? this.radar!.maximum_range_mm! : 6000;
    return Math.min(12000, Math.max(3000, configured, Math.ceil(targetExtent / 1000) * 1000));
  }

  private _isFloorProjection(): boolean {
    return this.radar?.coordinate_projection === 'floor_xy';
  }

  private _point2D(point: Pick<LiveRadarTarget, 'x_mm' | 'y_mm'>): [number, number] {
    const range = this._rangeMm();
    const x = 50 + (point.x_mm / range) * 42;
    const y = this._isFloorProjection()
      ? 50 - (point.y_mm / range) * 42
      : 92 - (point.y_mm / range) * 80;
    return [x, y];
  }

  private _point3D(point: Pick<LiveRadarTarget, 'x_mm' | 'y_mm' | 'z_mm'>): [number, number] {
    return projectStandaloneRadar3D(
      { x: point.x_mm, y: point.y_mm, z: point.z_mm },
      this._rangeMm(),
      this.radar?.mounting_height_mm || 2500,
    );
  }

  private _standalonePoint3D(point: LiveRadarTarget): [number, number] {
    // Firmware Z is not presented as height above the floor until the user
    // explicitly verifies that axis in the linked room.
    return this._point3D({ ...point, z_mm: this._roomZ(point) });
  }

  private _trailPoints(index: number, projector: (point: TrailPoint) => [number, number]): string {
    if (!this._showTrails) return '';
    return (this._trails.get(index) || []).map(point => projector(point).join(',')).join(' ');
  }

  private _sectorPoints(projector: (point: LiveRadarTarget) => [number, number]): string | null {
    const sector = this.radar?.detection_sector;
    if (!finite(sector?.distance_mm) || !finite(sector?.start_angle_deg) || !finite(sector?.end_angle_deg)) return null;
    const points: LiveRadarTarget[] = [{ index: 0, x_mm: 0, y_mm: 0 }];
    const steps = Math.max(3, Math.ceil((sector.end_angle_deg - sector.start_angle_deg) / 8));
    for (let index = 0; index <= steps; index += 1) {
      const angle = (sector.start_angle_deg + ((sector.end_angle_deg - sector.start_angle_deg) * index) / steps) * Math.PI / 180;
      points.push({ index: 0, x_mm: Math.sin(angle) * sector.distance_mm, y_mm: Math.cos(angle) * sector.distance_mm });
    }
    return points.map(point => projector(point).join(',')).join(' ');
  }

  private _render2D() {
    const range = this._rangeMm();
    const floor = this._isFloorProjection();
    const values = floor ? [-1, -.5, 0, .5, 1] : [-1, -.5, 0, .5, 1];
    const yValues = floor ? values : [0, .25, .5, .75, 1];
    const sector = this._sectorPoints(point => this._point2D(point));
    return html`
      <svg viewBox="0 0 100 100" role="img" aria-label=${panelText(this.hass, 'Live 2D radar positions')}>
        ${values.map(value => {
          const [x1, y1] = this._point2D({ x_mm: value * range, y_mm: floor ? -range : 0 });
          const [x2, y2] = this._point2D({ x_mm: value * range, y_mm: range });
          return svg`<line class=${value === 0 ? 'axis' : 'grid'} x1=${x1} y1=${y1} x2=${x2} y2=${y2}></line>`;
        })}
        ${yValues.map(value => {
          const yMm = value * range;
          const [x1, y1] = this._point2D({ x_mm: -range, y_mm: yMm });
          const [x2, y2] = this._point2D({ x_mm: range, y_mm: yMm });
          return svg`<line class=${value === 0 ? 'axis' : 'grid'} x1=${x1} y1=${y1} x2=${x2} y2=${y2}></line>`;
        })}
        ${sector ? svg`<polygon class="sector" points=${sector}></polygon>` : nothing}
        ${(() => {
          const [x, y] = this._point2D({ x_mm: 0, y_mm: 0 });
          return svg`<rect class="sensor-marker" x=${x - 1.8} y=${y - 1.8} width="3.6" height="3.6" rx=".8"></rect>`;
        })()}
        <text class="axis-label" x="91" y=${floor ? 52 : 94}>X</text>
        <text class="axis-label" x="52" y="8">Y</text>
        ${this._targets().map(target => {
          const [x, y] = this._point2D(target);
          const color = TARGET_COLORS[(target.index - 1) % TARGET_COLORS.length];
          const trail = this._trailPoints(target.index, point => this._point2D(point));
          return svg`
            ${trail ? svg`<polyline class="trail" stroke=${color} points=${trail}></polyline>` : nothing}
            <circle class="target-dot" fill=${color} cx=${x} cy=${y} r="2.6"></circle>
            <text class="target-label" x=${x + 3.4} y=${y - 2}>${target.index}</text>
          `;
        })}
      </svg>
    `;
  }

  private _render3D() {
    const range = this._rangeMm();
    const floor = this._isFloorProjection();
    const xValues = [-1, -.5, 0, .5, 1];
    const yValues = floor ? [-1, -.5, 0, .5, 1] : [0, .25, .5, .75, 1];
    const minY = floor ? -range : 0;
    const sector = this._sectorPoints(point => this._point3D(point));
    return html`
      <svg viewBox="0 0 100 100" role="img" aria-label=${panelText(this.hass, 'Live 3D radar positions')}>
        ${xValues.map(value => {
          const [x1, y1] = this._point3D({ x_mm: value * range, y_mm: minY });
          const [x2, y2] = this._point3D({ x_mm: value * range, y_mm: range });
          return svg`<line class=${value === 0 ? 'axis' : 'grid'} x1=${x1} y1=${y1} x2=${x2} y2=${y2}></line>`;
        })}
        ${yValues.map(value => {
          const yMm = value * range;
          const [x1, y1] = this._point3D({ x_mm: -range, y_mm: yMm });
          const [x2, y2] = this._point3D({ x_mm: range, y_mm: yMm });
          return svg`<line class=${value === 0 ? 'axis' : 'grid'} x1=${x1} y1=${y1} x2=${x2} y2=${y2}></line>`;
        })}
        ${sector ? svg`<polygon class="sector" points=${sector}></polygon>` : nothing}
        ${(() => {
          const floorPoint = this._point3D({ x_mm: 0, y_mm: 0, z_mm: 0 });
          const sensorPoint = this._point3D({ x_mm: 0, y_mm: 0, z_mm: this.radar?.mounting_height_mm || 0 });
          return svg`
            <line class="sensor-line" x1=${floorPoint[0]} y1=${floorPoint[1]} x2=${sensorPoint[0]} y2=${sensorPoint[1]}></line>
            <rect class="sensor-marker" x=${sensorPoint[0] - 2} y=${sensorPoint[1] - 1.3} width="4" height="2.6" rx=".8"></rect>
            <text class="target-label" x=${sensorPoint[0] + 3} y=${sensorPoint[1] - 1}>${(this.radar?.radar_model || 'radar').toUpperCase()}</text>
          `;
        })()}
        ${this._targets().map(target => {
          const floorPoint = this._point3D({ ...target, z_mm: 0 });
          const verifiedZ = this._roomZ(target);
          const marker = this._point3D({ ...target, z_mm: verifiedZ });
          const color = TARGET_COLORS[(target.index - 1) % TARGET_COLORS.length];
          const trail = this._trailPoints(target.index, point => this._standalonePoint3D(point));
          return svg`
            ${trail ? svg`<polyline class="trail" stroke=${color} points=${trail}></polyline>` : nothing}
            ${verifiedZ !== null && verifiedZ > 0 ? svg`<line class="target-stem" stroke=${color} x1=${floorPoint[0]} y1=${floorPoint[1]} x2=${marker[0]} y2=${marker[1]}></line>` : nothing}
            <circle class="target-dot" fill=${color} cx=${marker[0]} cy=${marker[1]} r="2.7"></circle>
            <circle fill=${color} opacity=".22" cx=${floorPoint[0]} cy=${floorPoint[1]} r="2.3"></circle>
            <text class="target-label" x=${marker[0] + 3.4} y=${marker[1] - 2}>${target.index}</text>
          `;
        })}
      </svg>
    `;
  }

  private _roomSensor(): RadarRoomSensor | undefined {
    const room = this.radar?.room_context;
    return room?.sensors?.find(sensor => sensor.id === room.linked_sensor_id);
  }

  private _roomOutline(): RadarRoomPoint[] {
    const walls = this.radar?.room_context?.walls || [];
    if (!walls.length) return [];
    return walls.map(wall => ({ x: wall.x1, y: wall.y1 }));
  }

  private _roomBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const room = this.radar?.room_context;
    const points: RadarRoomPoint[] = this._roomOutline();
    for (const wall of room?.walls || []) points.push({ x: wall.x2, y: wall.y2 });
    for (const sensor of room?.sensors || []) {
      if (finite(sensor.x) && finite(sensor.y)) points.push({ x: sensor.x, y: sensor.y });
    }
    if (!points.length) return { minX: -3000, minY: -3000, maxX: 3000, maxY: 3000 };
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = Math.max(350, Math.max(maxX - minX, maxY - minY) * .08);
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
  }

  private _roomPoint2D(point: RadarRoomPoint): [number, number] {
    return projectRoomPoint2D(point, this._roomBounds());
  }

  private _roomPoint3D(point: RadarRoomPoint, zMm = 0): [number, number] {
    const bounds = this._roomBounds();
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const span = Math.max(width, height);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const nx = (point.x - centerX) / span;
    const ny = (point.y - centerY) / span;
    const nz = zMm / Math.max(span, this.radar?.room_context?.ceiling_height_mm || 2600);
    return [50 + (nx - ny) * 57, 65 + (nx + ny) * 29 - nz * 27];
  }

  private _roomTarget(target: LiveRadarTarget): RadarRoomPoint | null {
    const sensor = this._roomSensor();
    if (!sensor || !finite(sensor.x) || !finite(sensor.y)) return null;
    return projectRadarTargetToRoom(
      { x: target.x_mm, y: target.y_mm },
      { x: sensor.x, y: sensor.y, rotation: finite(sensor.rotation) ? sensor.rotation : 0 },
      this._isFloorProjection() ? 'floor_xy' : 'forward_xy',
    );
  }

  private _zoneParts(zone: RadarRoomZone): RadarRoomPoint[][] {
    if (zone.parts?.length) return zone.parts.filter(part => part.length >= 3);
    return zone.points && zone.points.length >= 3 ? [zone.points] : [];
  }

  private _roomTrailPoints(index: number, is3D: boolean): string {
    if (!this._showTrails) return '';
    return (this._trails.get(index) || []).map(point => {
      const roomPoint = this._roomTarget(point);
      if (!roomPoint) return '';
      const roomZ = this._roomZ(point);
      return (is3D
        ? this._roomPoint3D(roomPoint, roomZ ?? 0)
        : this._roomPoint2D(roomPoint)).join(',');
    }).filter(Boolean).join(' ');
  }

  private _roomZ(target: LiveRadarTarget): number | null {
    const sensor = this._roomSensor();
    if (!sensor || !finite(sensor.heightMm)) return null;
    return mapReportedZToRoom(
      finite(target.z_mm) ? target.z_mm : null,
      sensor.heightMm,
      sensor.z_mapping,
    );
  }

  private _accessibleTargetDescription(target: LiveRadarTarget, roomScope: boolean): string {
    const position = roomScope ? this._roomTarget(target) : { x: target.x_mm, y: target.y_mm };
    if (!position) return panelText(this.hass, 'Target {index}: position unavailable.', { index: target.index });
    const height = this._roomZ(target);
    const heightText = height === null
      ? panelText(this.hass, 'height unknown')
      : panelText(this.hass, 'height {height} m', { height: (height / 1000).toFixed(2) });
    return panelText(this.hass, 'Target {index}: X {x} m, Y {y} m, {height}.', {
      index: target.index,
      x: (position.x / 1000).toFixed(2),
      y: (position.y / 1000).toFixed(2),
      height: heightText,
    });
  }

  private _furnitureCorners(item: RadarRoomFurniture): RadarRoomPoint[] {
    return radarRoomFurnitureCorners(item);
  }

  private _renderRoom2D() {
    const room = this.radar?.room_context;
    if (!room) return nothing;
    const outline = this._roomOutline();
    const outlinePoints = outline.map(point => this._roomPoint2D(point).join(',')).join(' ');
    return html`
      <svg viewBox="0 0 100 100" role="img" aria-label=${panelText(this.hass, 'Live 2D room positions')}>
        ${outlinePoints ? svg`<polygon class="room-floor" points=${outlinePoints}></polygon>` : nothing}
        ${(room.zones || []).flatMap(zone => this._zoneParts(zone).map(part => {
          const color = zone.color || (zone.type === 'exclusion' ? '#ef4444' : '#4361ee');
          return svg`<polygon class="room-zone" fill=${`${color}20`} stroke=${color} points=${part.map(point => this._roomPoint2D(point).join(',')).join(' ')}></polygon>`;
        }))}
        ${(room.furniture || []).map(item => {
          const corners = this._furnitureCorners(item);
          return corners.length ? svg`<polygon class="room-furniture" points=${corners.map(point => this._roomPoint2D(point).join(',')).join(' ')}></polygon>` : nothing;
        })}
        ${(room.walls || []).map(wall => {
          const [x1, y1] = this._roomPoint2D({ x: wall.x1, y: wall.y1 });
          const [x2, y2] = this._roomPoint2D({ x: wall.x2, y: wall.y2 });
          return svg`<line class="room-wall" x1=${x1} y1=${y1} x2=${x2} y2=${y2}></line>`;
        })}
        ${(room.sensors || []).map(sensor => {
          if (!finite(sensor.x) || !finite(sensor.y)) return nothing;
          const [x, y] = this._roomPoint2D({ x: sensor.x, y: sensor.y });
          const current = sensor.id === room.linked_sensor_id;
          return svg`<circle class="room-sensor ${current ? 'current' : ''}" cx=${x} cy=${y} r=${current ? 2.4 : 1.8}></circle>`;
        })}
        ${this._targets().map(target => {
          const roomPoint = this._roomTarget(target);
          if (!roomPoint) return nothing;
          const [x, y] = this._roomPoint2D(roomPoint);
          const color = TARGET_COLORS[(target.index - 1) % TARGET_COLORS.length];
          const trail = this._roomTrailPoints(target.index, false);
          return svg`${trail ? svg`<polyline class="trail" stroke=${color} points=${trail}></polyline>` : nothing}<circle class="target-dot" fill=${color} cx=${x} cy=${y} r="2.6"></circle><text class="target-label" x=${x + 3.2} y=${y - 2}>${target.index}</text>`;
        })}
        <text class="room-name" x="5" y="7">${room.name || panelText(this.hass, 'Room')}</text>
      </svg>`;
  }

  private _renderRoom3D() {
    const room = this.radar?.room_context;
    if (!room) return nothing;
    const outline = this._roomOutline();
    const floorPoints = outline.map(point => this._roomPoint3D(point).join(',')).join(' ');
    const wallHeight = Math.min(1200, finite(room.ceiling_height_mm) ? room.ceiling_height_mm * .45 : 1200);
    return html`
      <svg viewBox="0 0 100 100" role="img" aria-label=${panelText(this.hass, 'Live 3D room positions')}>
        ${floorPoints ? svg`<polygon class="room-floor" points=${floorPoints}></polygon>` : nothing}
        ${(room.zones || []).flatMap(zone => this._zoneParts(zone).map(part => {
          const color = zone.color || (zone.type === 'exclusion' ? '#ef4444' : '#4361ee');
          return svg`<polygon class="room-zone" fill=${`${color}20`} stroke=${color} points=${part.map(point => this._roomPoint3D(point).join(',')).join(' ')}></polygon>`;
        }))}
        ${(room.walls || []).map(wall => {
          const a = { x: wall.x1, y: wall.y1 };
          const b = { x: wall.x2, y: wall.y2 };
          const floorA = this._roomPoint3D(a);
          const floorB = this._roomPoint3D(b);
          const topA = this._roomPoint3D(a, wallHeight);
          const topB = this._roomPoint3D(b, wallHeight);
          return svg`<polygon class="room-wall-back" points="${floorA.join(',')} ${floorB.join(',')} ${topB.join(',')} ${topA.join(',')}"></polygon><line class="room-wall" x1=${floorA[0]} y1=${floorA[1]} x2=${floorB[0]} y2=${floorB[1]}></line>`;
        })}
        ${(room.furniture || []).map(item => {
          const corners = this._furnitureCorners(item);
          if (!corners.length) return nothing;
          const topHeight = Math.min(900, Math.max(350, wallHeight * .55));
          const floor = corners.map(point => this._roomPoint3D(point));
          const top = corners.map(point => this._roomPoint3D(point, topHeight));
          return svg`
            <polygon class="room-furniture" points=${top.map(point => point.join(',')).join(' ')}></polygon>
            ${floor.map((point, index) => svg`<line class="room-wall-back" x1=${point[0]} y1=${point[1]} x2=${top[index][0]} y2=${top[index][1]}></line>`)}
          `;
        })}
        ${(room.sensors || []).map(sensor => {
          if (!finite(sensor.x) || !finite(sensor.y)) return nothing;
          const height = finite(sensor.heightMm) ? sensor.heightMm : 1500;
          const floor = this._roomPoint3D({ x: sensor.x, y: sensor.y });
          const top = this._roomPoint3D({ x: sensor.x, y: sensor.y }, height);
          const current = sensor.id === room.linked_sensor_id;
          return svg`<line class="sensor-line" x1=${floor[0]} y1=${floor[1]} x2=${top[0]} y2=${top[1]}></line><circle class="room-sensor ${current ? 'current' : ''}" cx=${top[0]} cy=${top[1]} r=${current ? 2.3 : 1.7}></circle>`;
        })}
        ${this._targets().map(target => {
          const roomPoint = this._roomTarget(target);
          if (!roomPoint) return nothing;
          const z = this._roomZ(target);
          const marker = this._roomPoint3D(roomPoint, z ?? 0);
          const floor = this._roomPoint3D(roomPoint, 0);
          const color = TARGET_COLORS[(target.index - 1) % TARGET_COLORS.length];
          const trail = this._roomTrailPoints(target.index, true);
          return svg`${trail ? svg`<polyline class="trail" stroke=${color} points=${trail}></polyline>` : nothing}${z !== null && z > 0 ? svg`<line class="target-stem" stroke=${color} x1=${floor[0]} y1=${floor[1]} x2=${marker[0]} y2=${marker[1]}></line>` : nothing}<circle class="target-dot" fill=${color} cx=${marker[0]} cy=${marker[1]} r="2.7"></circle><text class="target-label" x=${marker[0] + 3.2} y=${marker[1] - 2}>${target.index}</text>`;
        })}
        <text class="room-name" x="5" y="7">${room.name || panelText(this.hass, 'Room')}</text>
      </svg>`;
  }

  render() {
    if (!this.radar?.supported) return nothing;
    const targets = this._targets();
    const model = (this.radar.radar_model || 'radar').toUpperCase();
    const meters = this._rangeMm() / 1000;
    const room = this.radar.room_context;
    const roomScope = this._scope === 'room' && !!room;
    return html`
      <section class="card" aria-label=${panelText(this.hass, 'Live radar view')}>
        <div class="head">
          <div>
            <div class="title">${panelText(this.hass, 'Position and movement trail')}</div>
            <div class="sub">${panelText(this.hass, 'Live target positions from this device. Coordinates use the same verified radar profile as the Floorplan Designer.')}</div>
          </div>
          <span class="model">${model}</span>
        </div>
        ${this.radar.installation_ready === false ? html`
          <div class="warning" role="status">
            <ha-icon icon="mdi:alert-outline"></ha-icon>
            <span>${panelText(this.hass, 'Installation data is incomplete or the radar is in the wrong mounting mode. Positions are diagnostic until height, angle and mounting mode are confirmed.')}</span>
          </div>
        ` : nothing}
        ${this.unavailable ? html`
          <div class="warning" role="status">
            <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
            <span>${panelText(this.hass, 'Live radar data is temporarily unavailable. Old positions have been hidden until the device responds again.')}</span>
          </div>
        ` : nothing}
        <div class="toolbar">
          ${room ? html`
            <div class="segmented scope-segmented" role="group" aria-label=${panelText(this.hass, 'Radar or room view')}>
              <button class=${!roomScope ? 'active' : ''} aria-pressed=${!roomScope} @click=${() => { this._scope = 'radar'; }}>${panelText(this.hass, 'Radar')}</button>
              <button class=${roomScope ? 'active' : ''} aria-pressed=${roomScope} @click=${() => { this._scope = 'room'; }} title=${room.name || ''}>${room.name || panelText(this.hass, 'Room')}</button>
            </div>
          ` : nothing}
          <div class="segmented" role="group" aria-label=${panelText(this.hass, 'View mode')}>
            <button class=${this._view === '2d' ? 'active' : ''} aria-pressed=${this._view === '2d'} @click=${() => { this._view = '2d'; }}>2D</button>
            <button class=${this._view === '3d' ? 'active' : ''} aria-pressed=${this._view === '3d'} @click=${() => { this._view = '3d'; }}>3D</button>
          </div>
          <label class="check"><input type="checkbox" .checked=${this._showTrails} @change=${(event: Event) => { this._showTrails = (event.target as HTMLInputElement).checked; }}> ${panelText(this.hass, 'Movement trail')}</label>
          <select aria-label=${panelText(this.hass, 'Keep movement trail')} .value=${String(this._trailSeconds)} @change=${(event: Event) => { this._trailSeconds = Number((event.target as HTMLSelectElement).value); this._captureTargets(); }} ?disabled=${!this._showTrails}>
            ${[30, 60, 120].map(seconds => html`<option value=${seconds}>${seconds} s</option>`)}
          </select>
          <button @click=${this._clearTrails} ?disabled=${!this._showTrails}>${panelText(this.hass, 'Clear trail')}</button>
          <span class="spacer"></span>
          ${!roomScope ? html`<label class="check">${panelText(this.hass, 'Range')}
            <select aria-label=${panelText(this.hass, 'Radar range')} .value=${String(this._rangeOverride)} @change=${(event: Event) => { this._rangeOverride = Number((event.target as HTMLSelectElement).value); }}>
              <option value="0">${panelText(this.hass, 'Auto')} · ${meters} m</option>
              ${[3000, 4000, 6000, 8000].map(value => html`<option value=${value}>${value / 1000} m</option>`)}
            </select>
          </label>` : nothing}
        </div>
        <div class="scene">
          ${roomScope
            ? this._view === '2d' ? this._renderRoom2D() : this._renderRoom3D()
            : this._view === '2d' ? this._render2D() : this._render3D()}
          ${targets.length === 0 && !this.unavailable ? html`
            <div class="empty">
              <ha-icon icon="mdi:radar"></ha-icon>
              <span>${panelText(this.hass, 'No live target positions right now.')}</span>
            </div>
          ` : nothing}
          ${targets.length ? html`
            <ul class="sr-only" aria-label=${panelText(this.hass, 'Live target position details')}>
              ${targets.map(target => html`<li>${this._accessibleTargetDescription(target, roomScope)}</li>`)}
            </ul>
          ` : nothing}
        </div>
        <div class="foot">
          <span>${panelText(this.hass, '{count} live positions', { count: targets.length })}</span>
          <span>${this.radar.mounting_mode === 'ceiling' ? panelText(this.hass, 'Ceiling mounted') : panelText(this.hass, 'Wall mounted')}</span>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-device-radar-view': DeviceRadarView;
  }
}

if (!customElements.get('shs-device-radar-view')) {
  customElements.define('shs-device-radar-view', DeviceRadarView);
}
