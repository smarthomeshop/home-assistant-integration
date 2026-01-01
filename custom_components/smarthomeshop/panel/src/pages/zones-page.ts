import { LitElement, html, css, svg, nothing, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { HomeAssistant, Room } from '../types';

interface Point { x: number; y: number; }
interface Point3D { x: number; y: number; z: number; }
interface Camera3D { azimuth: number; elevation: number; distance: number; targetX: number; targetY: number; targetZ: number; }
type ViewMode = '2d' | '3d';
type ZoneType = 'detection' | 'exclusion' | 'entry';
// Voor detection/exclusion: points is een polygon (3+ punten)
// Voor entry: points heeft exact 2 punten (een lijn) + inDirection geeft aan welke kant "in" is
interface ZoneData {
  id: number;
  points: Point[];
  type: ZoneType;
  name: string;
  inDirection?: 'left' | 'right';  // Alleen voor entry lijnen: welke kant is "de kamer in"
}
interface LocalFurnitureItem { id: string; type: string; name: string; x: number; y: number; width: number; height: number; rotation: number; }
interface DoorItem { id: string; wallIndex: number; position: number; width: number; openDirection: 'inward' | 'outward'; openSide: 'left' | 'right'; }
interface WindowItem { id: string; wallIndex: number; position: number; width: number; height: number; windowType: 'fixed' | 'open' | 'tilt'; }

const CANVAS_SIZE = 800;
const HALF = CANVAS_SIZE / 2;
type ToolMode = 'select' | 'sensor' | 'zone';

// Zone type limits
const ZONE_LIMITS = {
  detection: 4,
  exclusion: 2,
  entry: 2,
};

const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string }> = {
  detection: { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' },     // Groen
  exclusion: { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444' },     // Rood
  entry: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10b981' },       // Emerald/Turquoise
};

const ZONE_LABELS: Record<ZoneType, { singular: string; plural: string; icon: string }> = {
  detection: { singular: 'Detectie', plural: 'Detectie', icon: '📍' },
  exclusion: { singular: 'Exclusie', plural: 'Exclusie', icon: '🚷' },
  entry: { singular: 'Entry Lijn', plural: 'Entry Lijnen', icon: '🚪' },
};

// Note: We now use a stylized man icon instead of a detailed mesh
// The icon is drawn procedurally with simple shapes (head sphere, body/arms/legs as rounded boxes)


@customElement('shs-zones-page')
export class ZonesPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Array }) rooms: Room[] = [];

  // Room state
  @state() private _selectedRoomId: string | null = null;
  @state() private _roomPoints: Point[] = [];
  @state() private _furniture: LocalFurnitureItem[] = [];
  @state() private _doors: DoorItem[] = [];
  @state() private _windows: WindowItem[] = [];

  // Sensor state
  @state() private _sensorPos: Point | null = null;
  @state() private _sensorRotation = 0;
  @state() private _sensorRange = 6000;
  @state() private _sensorFov = 120;
  @state() private _selectedDeviceId: string | null = null;
  @state() private _draggingSensor = false;

  // Zone state
  @state() private _zones: ZoneData[] = [];
  @state() private _selectedZoneIndex: number | null = null;
  @state() private _drawingZone: Point[] = [];
  @state() private _newZoneType: ZoneType = 'detection';
  @state() private _showZoneTypePicker = false;
  @state() private _pendingZonePoints: Point[] = [];
  @state() private _draggingZonePointIndex: number | null = null;
  @state() private _draggingDrawingPointIndex: number | null = null;
  @state() private _draggingWholeZoneIndex: number | null = null;
  @state() private _dragStartPos: Point | null = null;
  @state() private _zoneMidpointPreview: { zoneIndex: number; segmentIndex: number; point: Point } | null = null;
  @state() private _editingZoneIndex: number | null = null;

  // Live tracking
  @state() private _liveTargets: Array<{x: number, y: number, active: boolean}> = [];

  // ESPHome sync state
  @state() private _entryExitEnabled = false;
  @state() private _assumedPresent = false;
  @state() private _pushingToSensor = false;

  // Canvas state
  @state() private _toolMode: ToolMode = 'select';
  @state() private _zoom = 1;
  @state() private _panOffset: Point = { x: 0, y: 0 };
  @state() private _cursorPos: Point | null = null;
  @state() private _saving = false;
  @state() private _isDragging = false;

  private _targetUpdateInterval: number | null = null;
  @query('svg') private _svg!: SVGSVGElement;
  @query('#canvas3d') private _canvas3d!: HTMLCanvasElement;

  // 3D View state
  @state() private _viewMode: ViewMode = '2d';
  private _camera3d: Camera3D = { azimuth: 45, elevation: 35, distance: 8000, targetX: 0, targetY: 0, targetZ: 1000 };
  private _isDragging3D = false;
  private _lastMouseX = 0;
  private _lastMouseY = 0;

  private readonly WALL_HEIGHT_3D = 2500;

  static styles = css`
    :host { display: grid; grid-template-columns: 280px 1fr 280px; gap: 16px; padding: 20px; height: calc(100vh - 100px); box-sizing: border-box; background: #0f172a; }
    .sidebar { background: #1e293b; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
    .section-title { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .room-list { display: flex; flex-direction: column; gap: 6px; }
    .room-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .room-item:hover { border-color: #475569; }
    .room-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .room-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #334155; border-radius: 6px; }
    .room-icon ha-icon { --mdc-icon-size: 18px; color: #94a3b8; }
    .room-name { flex: 1; font-size: 13px; color: #e2e8f0; font-weight: 500; }
    .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .tool-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .tool-btn:hover { border-color: #475569; background: #1e293b; }
    .tool-btn.active { border-color: #4361ee; background: rgba(67, 97, 238, 0.15); }
    .tool-btn ha-icon { --mdc-icon-size: 24px; color: #94a3b8; }
    .tool-btn.active ha-icon { color: #4361ee; }
    .tool-btn span { font-size: 11px; color: #94a3b8; }
    .tool-btn.active span { color: #4361ee; }
    .canvas-area { background: #1e293b; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .canvas-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #0f172a; border-bottom: 1px solid #334155; }
    .room-label { font-size: 13px; color: #94a3b8; }
    .room-label span { color: #e2e8f0; font-weight: 600; }
    .save-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #22c55e; border: none; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; }
    .save-btn:disabled { background: #475569; cursor: not-allowed; }
    .push-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; border: none; border-radius: 6px; color: white; font-size: 13px; font-weight: 500; cursor: pointer; margin-left: 8px; }
    .push-btn:disabled { background: #475569; cursor: not-allowed; }
    .push-btn:hover:not(:disabled) { background: #2563eb; }
    svg { flex: 1; background: #0a1628; cursor: crosshair; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; }
    .empty-state ha-icon { --mdc-icon-size: 64px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin: 0 0 8px 0; color: #94a3b8; }
    .grid-line { stroke: #1e293b; stroke-width: 0.5; }
    .wall-line { stroke: #475569; stroke-width: 3; stroke-linecap: round; }
    .canvas-controls { position: absolute; bottom: 16px; left: 16px; display: flex; gap: 8px; }
    .control-group { display: flex; background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }
    .control-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: #94a3b8; cursor: pointer; }
    .control-btn:hover { background: #334155; color: #e2e8f0; }
    .instructions { background: #0f172a; border-radius: 10px; padding: 14px; }
    .instructions-title { font-size: 13px; font-weight: 600; color: #4361ee; margin-bottom: 6px; }
    .instructions-text { font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .setting-item { margin-bottom: 12px; }
    .setting-item label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
    .setting-item input[type="range"] { width: 100%; }
    select { width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; font-size: 13px; }
    .info-text { color: #64748b; font-size: 12px; line-height: 1.5; }
    .live-status { margin: 12px 0; padding: 12px; background: #0f172a; border-radius: 8px; }
    .live-status .header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .live-status .dot { width: 10px; height: 10px; border-radius: 50%; }
    .live-status .dot.active { background: #22c55e; animation: pulse 1s infinite; }
    .live-status .dot.inactive { background: #64748b; }
    .live-status .count { font-size: 24px; font-weight: bold; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .zone-list { display: flex; flex-direction: column; gap: 6px; }
    .zone-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; }
    .zone-item:hover { border-color: #475569; }
    .zone-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .zone-color { width: 14px; height: 14px; border-radius: 4px; }
    .zone-info { flex: 1; }
    .zone-name { font-size: 13px; color: #e2e8f0; font-weight: 500; }
    .zone-type { font-size: 11px; color: #64748b; }
    .zone-actions { display: flex; gap: 4px; }
    .edit-btn { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 4px; }
    .edit-btn:hover { color: #60a5fa; }
    .delete-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; }
    .delete-btn:hover { color: #f87171; }
    .zone-edit-form { background: #0f172a; border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin-top: 8px; }
    .zone-edit-form label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; }
    .zone-edit-form input { width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; font-size: 13px; margin-bottom: 10px; box-sizing: border-box; }
    .zone-edit-form input:focus { outline: none; border-color: #3b82f6; }
    .type-switch { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
    .type-switch button { flex: 1; min-width: 70px; padding: 6px 4px; border: 2px solid #334155; border-radius: 6px; background: #1e293b; color: #94a3b8; font-size: 11px; cursor: pointer; transition: all 0.15s; }
    .type-switch button.active { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .type-switch button.exclusion.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .type-switch button.entry.active { border-color: #10b981; background: rgba(16, 185, 129, 0.1); color: #10b981; }
    /* Direction toggle voor entry lijnen */
    .direction-toggle { display: flex; gap: 6px; margin-bottom: 12px; }
    .direction-toggle button { flex: 1; padding: 10px 8px; border: 2px solid #334155; border-radius: 8px; background: #1e293b; color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.15s; }
    .direction-toggle button:hover { border-color: #475569; }
    .direction-toggle button.active.in { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .help-text { font-size: 11px; color: #64748b; margin: 0 0 12px 0; line-height: 1.4; }
    /* Zone Type Picker Dialog */
    .zone-type-picker { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .zone-type-picker-content { background: #1e293b; border-radius: 16px; padding: 24px; max-width: 320px; width: 90%; border: 1px solid #334155; }
    .zone-type-picker h3 { margin: 0 0 8px 0; font-size: 16px; color: #e2e8f0; }
    .zone-type-picker p { margin: 0 0 20px 0; font-size: 13px; color: #94a3b8; }
    .zone-type-options { display: flex; flex-direction: column; gap: 10px; }
    .zone-type-option { display: flex; align-items: center; gap: 12px; padding: 14px; background: #0f172a; border: 2px solid #334155; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
    .zone-type-option:hover:not(.disabled) { border-color: #475569; background: #1e293b; }
    .zone-type-option.disabled { opacity: 0.4; cursor: not-allowed; }
    .zone-type-option .icon { font-size: 24px; }
    .zone-type-option .info { flex: 1; }
    .zone-type-option .name { font-size: 14px; font-weight: 600; color: #e2e8f0; }
    .zone-type-option .desc { font-size: 11px; color: #64748b; }
    .zone-type-option .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .zone-type-option.detection .badge { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .zone-type-option.exclusion .badge { background: rgba(248, 113, 113, 0.2); color: #f87171; }
    .zone-type-option.entry .badge { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
    .zone-type-option.disabled .badge { background: rgba(100, 116, 139, 0.2); color: #64748b; }
    .zone-type-picker-cancel { width: 100%; margin-top: 16px; padding: 12px; background: #334155; border: none; border-radius: 8px; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .zone-type-picker-cancel:hover { background: #475569; color: #e2e8f0; }
    .edit-actions { display: flex; gap: 6px; }
    .edit-actions button { flex: 1; padding: 8px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; }
    .edit-actions .save-btn { background: #22c55e; color: white; }
    .edit-actions .cancel-btn { background: #334155; color: #94a3b8; }
    .zone-type-select { display: flex; gap: 8px; margin-bottom: 12px; }
    .zone-type-btn { flex: 1; padding: 10px; border: 2px solid #334155; border-radius: 8px; background: #0f172a; cursor: pointer; text-align: center; }
    .zone-type-btn.active { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .zone-type-btn span { display: block; font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .zone-type-btn.active span { color: #4361ee; }
    @media (max-width: 1200px) { :host { grid-template-columns: 240px 1fr; } .sidebar-right { display: none; } }
    .view-toggle { display: flex; background: #0f172a; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
    .view-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: none; color: #94a3b8; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .view-toggle-btn:hover { background: rgba(67, 97, 238, 0.1); color: #4361ee; }
    .view-toggle-btn.active { background: linear-gradient(135deg, #4361ee, #3651d4); color: white; }
    .view-toggle-btn ha-icon { --mdc-icon-size: 16px; }
    .canvas3d { flex: 1; display: block; cursor: grab; background: #0a1628; }
    .canvas3d:active { cursor: grabbing; }
    .camera-controls-3d { position: absolute; top: 60px; right: 16px; display: flex; flex-direction: column; gap: 6px; z-index: 10; }
    .camera-btn-3d { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 8px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
    .camera-btn-3d:hover { background: rgba(67, 97, 238, 0.2); border-color: #4361ee; color: #4361ee; }
    .camera-btn-3d ha-icon { --mdc-icon-size: 18px; }
    .view3d-info { position: absolute; bottom: 16px; left: 16px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; z-index: 10; font-size: 12px; color: #94a3b8; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._loadRooms();
    this._startTargetUpdates();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopTargetUpdates();
  }

  private _startTargetUpdates() {
    this._stopTargetUpdates();
    this._targetUpdateInterval = window.setInterval(() => this._updateTargets(), 200);
  }

  private _stopTargetUpdates() {
    if (this._targetUpdateInterval) {
      clearInterval(this._targetUpdateInterval);
      this._targetUpdateInterval = null;
    }
  }

  private _updateTargets() {
    if (!this.hass || !this._selectedDeviceId) {
      // Only log occasionally to avoid spam
      return;
    }

    const targets: Array<{x: number, y: number, active: boolean}> = [];
    for (let i = 1; i <= 3; i++) {
      const xEntityId = `sensor.${this._selectedDeviceId}_target_${i}_x`;
      const yEntityId = `sensor.${this._selectedDeviceId}_target_${i}_y`;
      const xEntity = this.hass.states[xEntityId];
      const yEntity = this.hass.states[yEntityId];

      if (xEntity && yEntity) {
        const x = parseFloat(xEntity.state) || 0;
        const y = parseFloat(yEntity.state) || 0;
        const active = x !== 0 || y !== 0;
        targets.push({ x, y, active });
      } else {
        // Entity not found - log once
        if (i === 1 && targets.length === 0) {
          console.warn('Zones: Entity not found:', xEntityId, 'exists:', !!xEntity);
          // Try to find what entities DO exist for this prefix
          const matchingEntities = Object.keys(this.hass.states).filter(e =>
            e.includes(this._selectedDeviceId!) || e.includes('target')
          ).slice(0, 5);
          console.warn('Zones: Sample matching entities:', matchingEntities);
        }
      }
    }

    // Only update if changed - use spread to create new array reference
    const newTargets = [...targets];
    const oldJson = JSON.stringify(this._liveTargets);
    const newJson = JSON.stringify(newTargets);

    if (oldJson !== newJson) {
      this._liveTargets = newTargets;
      // Trigger DOM update for targets
      this._updateTargetCirclesInDOM();
    }
  }

  private _getRadarDevices(): Array<{id: string, name: string}> {
    if (!this.hass) return [];
    const devices: Array<{id: string, name: string}> = [];
    const seen = new Set<string>();

    Object.keys(this.hass.states).forEach(entityId => {
      const match = entityId.match(/^sensor\.(.+)_target_1_x$/);
      if (match) {
        const deviceId = match[1];
        if (!seen.has(deviceId)) {
          seen.add(deviceId);
          const name = deviceId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          devices.push({ id: deviceId, name });
        }
      }
    });
    return devices;
  }

  private async _loadRooms() {
    try {
      const result = await this.hass.callWS<{ rooms: Room[] }>({ type: 'smarthomeshop/rooms' });
      this.rooms = result.rooms || [];
      if (this.rooms.length > 0 && !this._selectedRoomId) {
        this._selectRoom(this.rooms[0].id);
      }
    } catch (err) { console.error('Failed to load rooms:', err); }
  }

  private _selectRoom(roomId: string) {
    this._selectedRoomId = roomId;
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      // Load walls
      this._roomPoints = room.walls?.length > 0 ? room.walls.map(w => ({ x: w.x1, y: w.y1 })) : [];

      // Load furniture
      this._furniture = ((room as any).furniture || []).map((f: any) => ({
        id: f.id,
        type: f.typeId || f.type || 'unknown',
        name: f.name || 'Meubel',
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height || f.depth || f.width,
        rotation: f.rotationDeg ?? f.rotation ?? 0,
      }));

      // Load doors and windows
      this._doors = (room as any).doors || [];
      this._windows = (room as any).windows || [];

      // Load sensor
      const sensor = (room as any).sensor;
      console.log('Zones: Loading sensor from room:', sensor);
      if (sensor) {
        this._sensorPos = { x: sensor.x, y: sensor.y };
        this._sensorRotation = sensor.rotation ?? 0;
        this._sensorRange = sensor.range ?? 6000;
        this._sensorFov = sensor.fov ?? 120;
        this._selectedDeviceId = sensor.deviceId ?? null;
        console.log('Zones: Sensor loaded - pos:', this._sensorPos, 'deviceId:', this._selectedDeviceId);
      } else {
        this._sensorPos = null;
        this._sensorRotation = 0;
        this._sensorRange = 6000;
        this._sensorFov = 120;
        this._selectedDeviceId = null;
      }

      // Load zones
      this._zones = (room as any).zones || [];

      this._autoZoom();
    }
    this._toolMode = 'select';
    this._selectedZoneIndex = null;
    this._drawingZone = [];
  }

  private async _saveRoom() {
    if (!this._selectedRoomId) return;
    this._saving = true;
    const room = this.rooms.find(r => r.id === this._selectedRoomId);
    if (!room) return;

    const sensor = this._sensorPos ? {
      x: this._sensorPos.x,
      y: this._sensorPos.y,
      rotation: this._sensorRotation,
      range: this._sensorRange,
      fov: this._sensorFov,
      deviceId: this._selectedDeviceId,
    } : null;

    try {
      const updatedRoom = {
        ...room,
        sensor,
        zones: this._zones,
      };
      await this.hass.callWS({ type: 'smarthomeshop/room/save', room: updatedRoom });
      this.rooms = this.rooms.map(r => r.id === this._selectedRoomId ? updatedRoom as any : r);
    } catch (err) { console.error('Failed to save room:', err); }
    finally { this._saving = false; }
  }

  @state() private _pushingToESPHome = false;

  private async _pushToESPHome() {
    if (!this._selectedDeviceId) {
      console.warn('No device selected for push');
      alert('Selecteer eerst een sensor!');
      return;
    }
    this._pushingToESPHome = true;

    try {
      // The _selectedDeviceId might be a device name (like "ultimatesensor_mini_fc9c8c")
      // or a device ID hash. We'll use it directly as the ESPHome device name for services.
      const deviceName = this._selectedDeviceId;

      console.log('Using device name for ESPHome services:', deviceName);

      // Verify this device has entities by checking if any entity_id contains this name
      const entityReg = await this.hass.callWS<any[]>({ type: 'config/entity_registry/list' });
      const matchingEntities = entityReg.filter((e: any) =>
        e.entity_id && e.entity_id.includes(deviceName)
      );

      console.log('Matching entities found:', matchingEntities.length);

      if (matchingEntities.length === 0) {
        console.warn('No matching entities found, but will try to push anyway');
      }

      // Push detection zones (polygon format: "x1:y1;x2:y2;x3:y3...")
      const detectionZones = this._zones.filter(z => z.type === 'detection');
      for (let i = 0; i < 4; i++) {
        const zone = detectionZones[i];
        const polygonStr = zone ? zone.points.map(p => `${Math.round(p.x)}:${Math.round(p.y)}`).join(';') : '';
        try {
          await this.hass.callService('esphome', `${deviceName}_set_polygon_zone`, {
            zone_id: i + 1,
            polygon: polygonStr,
          });
          console.log(`Pushed detection zone ${i + 1}:`, polygonStr);
        } catch (e) {
          console.warn(`Service ${deviceName}_set_polygon_zone not found, skipping`);
        }
      }

      // Push exclusion zones
      const exclusionZones = this._zones.filter(z => z.type === 'exclusion');
      for (let i = 0; i < 2; i++) {
        const zone = exclusionZones[i];
        const polygonStr = zone ? zone.points.map(p => `${Math.round(p.x)}:${Math.round(p.y)}`).join(';') : '';
        try {
          await this.hass.callService('esphome', `${deviceName}_set_polygon_exclusion`, {
            zone_id: i + 1,
            polygon: polygonStr,
          });
          console.log(`Pushed exclusion zone ${i + 1}:`, polygonStr);
        } catch (e) {
          console.warn(`Service ${deviceName}_set_polygon_exclusion not found, skipping`);
        }
      }

      // Push entry lines (format: "x1:y1;x2:y2;left" or "x1:y1;x2:y2;right")
      const entryLines = this._zones.filter(z => z.type === 'entry');
      for (let i = 0; i < 2; i++) {
        const line = entryLines[i];
        let lineStr = '';
        if (line && line.points.length === 2) {
          const dir = line.inDirection || 'left';
          lineStr = `${Math.round(line.points[0].x)}:${Math.round(line.points[0].y)};${Math.round(line.points[1].x)}:${Math.round(line.points[1].y)};${dir}`;
        }
        try {
          await this.hass.callService('esphome', `${deviceName}_set_entry_line`, {
            line_id: i + 1,
            line_data: lineStr,
          });
          console.log(`Pushed entry line ${i + 1}:`, lineStr);
        } catch (e) {
          console.warn(`Service ${deviceName}_set_entry_line not found, skipping`);
        }
      }

      alert('Zones succesvol naar sensor gepusht!');
      console.log('Successfully pushed all zones to ESPHome device');
    } catch (err) {
      console.error('Failed to push to ESPHome:', err);
      alert(`Fout bij pushen naar sensor: ${err}`);
    } finally {
      this._pushingToESPHome = false;
    }
  }

  private _autoZoom() {
    if (this._roomPoints.length < 3) { this._zoom = 1; this._panOffset = { x: 0, y: 0 }; return; }
    const xs = this._roomPoints.map(p => p.x), ys = this._roomPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = maxX - minX, h = maxY - minY;
    // Calculate zoom to fit room with 15% padding
    this._zoom = Math.min(0.85 * 10000 / Math.max(w, h), 3);
    // Calculate center of room
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    // Pan offset to center the room in the canvas
    this._panOffset = {
      x: -centerX * (CANVAS_SIZE / 10000) * this._zoom,
      y: -centerY * (CANVAS_SIZE / 10000) * this._zoom
    };
  }

  private _toCanvas(p: Point): Point {
    return { x: HALF + (p.x * CANVAS_SIZE / 10000) * this._zoom + this._panOffset.x, y: HALF + (p.y * CANVAS_SIZE / 10000) * this._zoom + this._panOffset.y };
  }

  private _fromCanvas(cx: number, cy: number): Point {
    return { x: ((cx - HALF - this._panOffset.x) / this._zoom) * 10000 / CANVAS_SIZE, y: ((cy - HALF - this._panOffset.y) / this._zoom) * 10000 / CANVAS_SIZE };
  }

  private _getSvgPoint(e: MouseEvent): Point | null {
    if (!this._svg) return null;
    const pt = this._svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = this._svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  private _snapToGrid(p: Point): Point {
    const grid = 100; // 10cm snap
    return { x: Math.round(p.x / grid) * grid, y: Math.round(p.y / grid) * grid };
  }

  // Point-in-polygon algorithm (ray casting) - check if point is inside room
  private _isPointInRoom(p: Point): boolean {
    if (this._roomPoints.length < 3) return true; // No room defined, allow anywhere

    let inside = false;
    const n = this._roomPoints.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this._roomPoints[i].x, yi = this._roomPoints[i].y;
      const xj = this._roomPoints[j].x, yj = this._roomPoints[j].y;

      if (((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  private _handleCanvasClick(e: MouseEvent) {
    if (e.button !== 0) return;
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);

    // Sensor placement - only allow inside room
    if (this._toolMode === 'sensor' && !this._sensorPos) {
      const snappedPt = this._snapToGrid(worldPt);
      if (this._isPointInRoom(snappedPt)) {
        this._sensorPos = snappedPt;
      }
      return;
    }

    // Zone drawing/editing
    if (this._toolMode === 'zone') {
      const snappedPt = this._snapToGrid(worldPt);

      // Check if clicking on midpoint preview to add new point (only for polygon zones, not entry lines)
      if (this._zoneMidpointPreview) {
        if (this._zoneMidpointPreview.zoneIndex === -1) {
          // Add point to drawing zone
          const newPoints = [...this._drawingZone];
          newPoints.splice(this._zoneMidpointPreview.segmentIndex + 1, 0, this._zoneMidpointPreview.point);
          this._drawingZone = newPoints;
        } else if (this._selectedZoneIndex !== null) {
          // Add point to existing zone (only if it's a polygon, not entry line)
          const zone = this._zones[this._selectedZoneIndex];
          if (zone.type !== 'entry') {
            const newPoints = [...zone.points];
            newPoints.splice(this._zoneMidpointPreview.segmentIndex + 1, 0, this._zoneMidpointPreview.point);
            this._zones = this._zones.map((z, i) => i === this._selectedZoneIndex ? { ...z, points: newPoints } : z);
          }
        }
        this._zoneMidpointPreview = null;
        return;
      }

      // If no zone is being drawn, start new zone
      if (this._drawingZone.length === 0) {
        this._drawingZone = [snappedPt];
        return;
      }

      // Check if this is the second point - could be an entry line!
      if (this._drawingZone.length === 1) {
        this._drawingZone = [...this._drawingZone, snappedPt];
        // After 2 points, show type picker - user can choose entry line OR continue drawing polygon
        this._pendingZonePoints = [...this._drawingZone];
        this._showZoneTypePicker = true;
        this._drawingZone = [];
        return;
      }

      // Check if closing the polygon zone (3+ points)
      if (this._drawingZone.length >= 3) {
        const first = this._drawingZone[0];
        if (Math.hypot(snappedPt.x - first.x, snappedPt.y - first.y) < 250) {
          // Zone is closed - show type picker for polygon
          this._pendingZonePoints = [...this._drawingZone];
          this._drawingZone = [];
          this._showZoneTypePicker = true;
          return;
        }
      }

      this._drawingZone = [...this._drawingZone, snappedPt];
    }
  }

  private _handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);

    // Delete drawing zone point
    if (this._drawingZone.length > 0) {
      const idx = this._drawingZone.findIndex(p => Math.hypot(p.x - worldPt.x, p.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._drawingZone = this._drawingZone.filter((_, i) => i !== idx);
        return;
      }
    }

    // Delete selected zone point
    if (this._selectedZoneIndex !== null) {
      const zone = this._zones[this._selectedZoneIndex];
      const idx = zone.points.findIndex(p => Math.hypot(p.x - worldPt.x, p.y - worldPt.y) < 200);
      if (idx !== -1 && zone.points.length > 3) {
        const newPoints = zone.points.filter((_, i) => i !== idx);
        this._zones = this._zones.map((z, i) => i === this._selectedZoneIndex ? { ...z, points: newPoints } : z);
      }
    }
  }

  private _handleCanvasMove(e: MouseEvent) {
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);
    this._cursorPos = worldPt;

    // Dragging sensor - only allow inside room
    if (this._draggingSensor && this._sensorPos) {
      const snappedPt = this._snapToGrid(worldPt);
      if (this._isPointInRoom(snappedPt)) {
        this._sensorPos = snappedPt;
      }
      return;
    }

    // Dragging zone point in selected zone
    if (this._draggingZonePointIndex !== null && this._selectedZoneIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      const zone = this._zones[this._selectedZoneIndex];
      const newPoints = [...zone.points];
      newPoints[this._draggingZonePointIndex] = snappedPt;
      this._zones = this._zones.map((z, i) => i === this._selectedZoneIndex ? { ...z, points: newPoints } : z);
      return;
    }

    // Dragging whole zone
    if (this._draggingWholeZoneIndex !== null && this._dragStartPos) {
      const dx = worldPt.x - this._dragStartPos.x;
      const dy = worldPt.y - this._dragStartPos.y;
      const zone = this._zones[this._draggingWholeZoneIndex];
      const newPoints = zone.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
      this._zones = this._zones.map((z, i) => i === this._draggingWholeZoneIndex ? { ...z, points: newPoints } : z);
      this._dragStartPos = worldPt;
      return;
    }

    // Dragging drawing zone point
    if (this._draggingDrawingPointIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      const newPoints = [...this._drawingZone];
      newPoints[this._draggingDrawingPointIndex] = snappedPt;
      this._drawingZone = newPoints;
      return;
    }

    // Check for midpoint hover on drawing zone (for adding points while drawing)
    this._zoneMidpointPreview = null;
    if (this._toolMode === 'zone' && this._drawingZone.length >= 2) {
      // Check existing segments of drawing zone
      for (let i = 0; i < this._drawingZone.length - 1; i++) {
        const p1 = this._drawingZone[i];
        const p2 = this._drawingZone[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        if (Math.hypot(worldPt.x - midX, worldPt.y - midY) < 200) {
          this._zoneMidpointPreview = {
            zoneIndex: -1, // -1 indicates drawing zone
            segmentIndex: i,
            point: { x: midX, y: midY }
          };
          break;
        }
      }
    }

    // Check for midpoint hover on selected zone (only when not drawing)
    if (this._toolMode === 'zone' && this._selectedZoneIndex !== null && this._drawingZone.length === 0 && !this._zoneMidpointPreview) {
      const zone = this._zones[this._selectedZoneIndex];
      for (let i = 0; i < zone.points.length; i++) {
        const p1 = zone.points[i];
        const p2 = zone.points[(i + 1) % zone.points.length];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        if (Math.hypot(worldPt.x - midX, worldPt.y - midY) < 200) {
          this._zoneMidpointPreview = {
            zoneIndex: this._selectedZoneIndex,
            segmentIndex: i,
            point: { x: midX, y: midY }
          };
          break;
        }
      }
    }

    // Panning
    if (this._isDragging) {
      this._panOffset = {
        x: this._panOffset.x + e.movementX,
        y: this._panOffset.y + e.movementY,
      };
    }
  }

  private _handleCanvasDown(e: MouseEvent) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      this._isDragging = true;
      return;
    }

    if (e.button !== 0) return;
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);

    // Check for sensor drag start
    if (this._sensorPos && Math.hypot(worldPt.x - this._sensorPos.x, worldPt.y - this._sensorPos.y) < 200) {
      this._draggingSensor = true;
      return;
    }

    // Check for drawing zone point drag start
    if (this._drawingZone.length > 0) {
      const idx = this._drawingZone.findIndex(p => Math.hypot(p.x - worldPt.x, p.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._draggingDrawingPointIndex = idx;
        return;
      }
    }

    // Check for selected zone point drag start
    if (this._selectedZoneIndex !== null && this._toolMode === 'zone') {
      const zone = this._zones[this._selectedZoneIndex];
      const idx = zone.points.findIndex(p => Math.hypot(p.x - worldPt.x, p.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._draggingZonePointIndex = idx;
        return;
      }

      // For entry lines (2 points), check if clicking near the line itself to drag whole line
      if (zone.type === 'entry' && zone.points.length === 2) {
        const p1 = zone.points[0];
        const p2 = zone.points[1];
        // Check distance from point to line segment
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq > 0) {
          const t = Math.max(0, Math.min(1, ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / lenSq));
          const closestX = p1.x + t * dx;
          const closestY = p1.y + t * dy;
          const dist = Math.hypot(worldPt.x - closestX, worldPt.y - closestY);
          if (dist < 200) {
            this._draggingWholeZoneIndex = this._selectedZoneIndex;
            this._dragStartPos = worldPt;
            return;
          }
        }
      }

      // Check if clicking inside the selected polygon zone to drag whole zone
      if (zone.points.length >= 3 && this._isPointInZone(worldPt, zone.points)) {
        this._draggingWholeZoneIndex = this._selectedZoneIndex;
        this._dragStartPos = worldPt;
        return;
      }
    }
  }

  private _isPointInZone(point: Point, zonePoints: Point[]): boolean {
    if (zonePoints.length < 3) return false;
    let inside = false;
    for (let i = 0, j = zonePoints.length - 1; i < zonePoints.length; j = i++) {
      const xi = zonePoints[i].x, yi = zonePoints[i].y;
      const xj = zonePoints[j].x, yj = zonePoints[j].y;
      if (((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private _handleCanvasUp() {
    this._isDragging = false;
    this._draggingSensor = false;
    this._draggingZonePointIndex = null;
    this._draggingDrawingPointIndex = null;
    this._draggingWholeZoneIndex = null;
    this._dragStartPos = null;
  }

  private _handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this._zoom = Math.max(0.2, Math.min(5, this._zoom * delta));
  }

  private _deleteZone(index: number) {
    this._zones = this._zones.filter((_, i) => i !== index);
    if (this._selectedZoneIndex === index) this._selectedZoneIndex = null;
    if (this._editingZoneIndex === index) this._editingZoneIndex = null;
  }

  private _updateZoneName(index: number, name: string) {
    this._zones = this._zones.map((z, i) => i === index ? { ...z, name } : z);
  }

  private _updateZoneType(index: number, type: ZoneType) {
    this._zones = this._zones.map((z, i) => i === index ? { ...z, type } : z);
  }

  private _getZoneCountByType(type: ZoneType): number {
    return this._zones.filter(z => z.type === type).length;
  }

  private _canAddZone(type: ZoneType): boolean {
    return this._getZoneCountByType(type) < ZONE_LIMITS[type];
  }

  private _startDrawingZone(type: ZoneType) {
    if (!this._canAddZone(type)) return;
    this._newZoneType = type;
    this._drawingZone = [];
    this._toolMode = 'zone';
    this._selectedZoneIndex = null;
  }

  private _startDrawingAnyZone() {
    // Check if any type is available
    const hasAvailable = (['detection', 'exclusion', 'entry'] as ZoneType[]).some(t => this._canAddZone(t));
    if (!hasAvailable) return;
    this._drawingZone = [];
    this._toolMode = 'zone';
    this._selectedZoneIndex = null;
  }

  private _selectZoneType(type: ZoneType) {
    if (!this._canAddZone(type)) {
      return;
    }

    // Entry line requires exactly 2 points
    if (type === 'entry') {
      if (this._pendingZonePoints.length !== 2) return;

      const countOfType = this._zones.filter(z => z.type === type).length + 1;
      this._zones = [...this._zones, {
        id: Date.now(),
        points: [...this._pendingZonePoints],
        type: type,
        name: `Entry Lijn ${countOfType}`,
        inDirection: 'left',  // Default: links van de lijn is "in"
      }];
      this._showZoneTypePicker = false;
      this._pendingZonePoints = [];
      // Select the new entry line for editing direction
      this._selectedZoneIndex = this._zones.length - 1;
      this._editingZoneIndex = this._zones.length - 1;
      return;
    }

    // Polygon zones require 3+ points
    if (this._pendingZonePoints.length < 3) {
      return;
    }

    const countOfType = this._zones.filter(z => z.type === type).length + 1;
    const label = ZONE_LABELS[type];
    this._zones = [...this._zones, {
      id: Date.now(),
      points: [...this._pendingZonePoints],
      type: type,
      name: `${label.singular} Zone ${countOfType}`,
    }];
    this._showZoneTypePicker = false;
    this._pendingZonePoints = [];
  }

  private _continueDrawingPolygon() {
    // User wants to continue drawing (not create entry line)
    this._drawingZone = [...this._pendingZonePoints];
    this._pendingZonePoints = [];
    this._showZoneTypePicker = false;
  }

  private _cancelZoneTypePicker() {
    this._showZoneTypePicker = false;
    this._pendingZonePoints = [];
  }

  private _toggleEntryDirection(index: number) {
    const zone = this._zones[index];
    if (zone.type !== 'entry') return;
    const newDir = zone.inDirection === 'left' ? 'right' : 'left';
    this._zones = this._zones.map((z, i) => i === index ? { ...z, inDirection: newDir } : z);
  }

  private _renderZoneEditForm(zone: ZoneData, i: number) {
    if (this._editingZoneIndex !== i) return '';

    // Entry lijnen hebben een richting toggle ipv type selectie
    if (zone.type === 'entry') {
      return html`
        <div class="zone-edit-form">
          <label>Entry lijn naam</label>
          <input type="text" .value="${zone.name}"
                 @input="${(e: Event) => this._updateZoneName(i, (e.target as HTMLInputElement).value)}"/>

          <label>IN/UIT richting</label>
          <div class="direction-toggle">
            <button class="${zone.inDirection === 'left' ? 'active in' : ''}"
                    @click="${() => this._toggleEntryDirection(i)}"
                    title="IN richting links van de lijn">
              ⬅️ IN links
            </button>
            <button class="${zone.inDirection === 'right' ? 'active in' : ''}"
                    @click="${() => this._toggleEntryDirection(i)}"
                    title="IN richting rechts van de lijn">
              IN rechts ➡️
            </button>
          </div>
          <p class="help-text">De groene "IN" pijl geeft aan welke kant de kamer ingaan is. De rode "UIT" pijl de uitgaande richting.</p>

          <div class="edit-actions">
            <button class="cancel-btn" @click="${() => this._editingZoneIndex = null}">Sluiten</button>
          </div>
        </div>
      `;
    }

    // Polygon zones (detection/exclusion)
    return html`
      <div class="zone-edit-form">
        <label>Zone naam</label>
        <input type="text" .value="${zone.name}"
               @input="${(e: Event) => this._updateZoneName(i, (e.target as HTMLInputElement).value)}"/>
        <label>Zone type</label>
        <div class="type-switch">
          <button class="${zone.type === 'detection' ? 'active' : ''}"
                  @click="${() => this._updateZoneType(i, 'detection')}">
            📍 Detectie
          </button>
          <button class="exclusion ${zone.type === 'exclusion' ? 'active' : ''}"
                  @click="${() => this._updateZoneType(i, 'exclusion')}">
            🚷 Exclusie
          </button>
        </div>
        <div class="edit-actions">
          <button class="cancel-btn" @click="${() => this._editingZoneIndex = null}">Sluiten</button>
        </div>
      </div>
    `;
  }

  private _getInstructions() {
    switch (this._toolMode) {
      case 'select':
        return { title: 'Selecteer', text: 'Sleep de sensor of selecteer een zone om te bewerken.' };
      case 'sensor':
        return { title: 'Sensor Plaatsen', text: this._sensorPos ? 'Sleep het blauwe bolletje om de sensor te verplaatsen.' : 'Klik op de kaart om de sensor te plaatsen.' };
      case 'zone':
        if (this._drawingZone.length === 1) {
          return { title: 'Punt 2 plaatsen', text: 'Klik voor het tweede punt. Na 2 punten kun je een Entry Lijn maken of doorgaan voor een polygon zone.' };
        }
        if (this._drawingZone.length > 1) {
          return { title: 'Zone Tekenen', text: 'Klik om punten toe te voegen. Klik bij groene punt om te sluiten. Sleep punten om te verplaatsen. Rechtermuisknop op punt om te verwijderen.' };
        }
        if (this._selectedZoneIndex !== null) {
          const zone = this._zones[this._selectedZoneIndex];
          if (zone?.type === 'entry') {
            return { title: 'Entry Lijn Bewerken', text: 'Sleep de eindpunten om de lijn te verplaatsen. Gebruik het edit menu om de IN/UIT richting te wijzigen.' };
          }
          return { title: 'Zone Bewerken', text: 'Sleep punten om te verplaatsen. Klik op groene midpoint om punt toe te voegen. Rechtermuisknop op punt om te verwijderen.' };
        }
        return { title: 'Zone Tekenen', text: 'Klik om het eerste punt te plaatsen. 2 punten = Entry Lijn, 3+ punten = Detectie/Exclusie Zone.' };
      default:
        return { title: 'Zones Configureren', text: 'Selecteer een gereedschap om te beginnen.' };
    }
  }

  // ===== 3D RENDERING METHODS =====

  private _project3D(p: Point3D): Point {
    const cam = this._camera3d;
    const azRad = (cam.azimuth * Math.PI) / 180;
    const elRad = (cam.elevation * Math.PI) / 180;

    const dx = p.x - cam.targetX;
    const dy = p.y - cam.targetY;
    const dz = p.z - cam.targetZ;

    const x1 = dx * Math.cos(azRad) - dy * Math.sin(azRad);
    const y1 = dx * Math.sin(azRad) + dy * Math.cos(azRad);
    const z1 = dz;

    const y2 = y1 * Math.cos(elRad) - z1 * Math.sin(elRad);
    const z2 = y1 * Math.sin(elRad) + z1 * Math.cos(elRad);

    const fov = 60;
    const scale = (1 / Math.tan((fov * Math.PI) / 360)) * 400;
    const depth = cam.distance + y2;
    const factor = depth > 50 ? scale / depth : scale / 50;

    // Mirror X-axis to match 2D view orientation
    return { x: 400 - x1 * factor, y: 300 - z2 * factor };
  }

  private _render3DScene(): void {
    if (!this._canvas3d) return;
    const ctx = this._canvas3d.getContext('2d');
    if (!ctx) return;

    const w = this._canvas3d.width;
    const h = this._canvas3d.height;

    // Clear with gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    this._draw3DGrid(ctx);
    if (this._roomPoints.length >= 3) {
      this._draw3DRoom(ctx);
      this._draw3DFurniture(ctx);
      this._draw3DDoors(ctx);
      this._draw3DWindows(ctx);
      this._draw3DZones(ctx);
    }
    this._draw3DSensor(ctx);
    this._draw3DTargets(ctx);
  }

  private _draw3DGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
    ctx.lineWidth = 1;
    const gridSize = 1000;
    const gridRange = 5000;

    for (let i = -gridRange; i <= gridRange; i += gridSize) {
      const p1 = this._project3D({ x: i, y: -gridRange, z: 0 });
      const p2 = this._project3D({ x: i, y: gridRange, z: 0 });
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

      const p3 = this._project3D({ x: -gridRange, y: i, z: 0 });
      const p4 = this._project3D({ x: gridRange, y: i, z: 0 });
      ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }
  }

  private _draw3DRoom(ctx: CanvasRenderingContext2D): void {
    const pts = this._roomPoints;
    if (pts.length < 3) return;

    // Draw floor
    ctx.fillStyle = 'rgba(67, 97, 238, 0.08)';
    ctx.strokeStyle = 'rgba(67, 97, 238, 0.4)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    const first = this._project3D({ x: pts[0].x, y: pts[0].y, z: 0 });
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const p = this._project3D({ x: pts[i].x, y: pts[i].y, z: 0 });
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sort and draw walls
    const wallsWithDepth = pts.map((p, i) => {
      const next = pts[(i + 1) % pts.length];
      const midX = (p.x + next.x) / 2;
      const midY = (p.y + next.y) / 2;
      const dist = Math.hypot(midX - this._camera3d.targetX, midY - this._camera3d.targetY);
      return { index: i, dist };
    }).sort((a, b) => b.dist - a.dist);

    for (const { index } of wallsWithDepth) {
      this._draw3DWall(ctx, index);
    }
  }

  private _draw3DWall(ctx: CanvasRenderingContext2D, wallIndex: number): void {
    const pts = this._roomPoints;
    const p1 = pts[wallIndex];
    const p2 = pts[(wallIndex + 1) % pts.length];

    const bl = this._project3D({ x: p1.x, y: p1.y, z: 0 });
    const br = this._project3D({ x: p2.x, y: p2.y, z: 0 });
    const tr = this._project3D({ x: p2.x, y: p2.y, z: this.WALL_HEIGHT_3D });
    const tl = this._project3D({ x: p1.x, y: p1.y, z: this.WALL_HEIGHT_3D });

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const normalAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const lightDir = (this._camera3d.azimuth * Math.PI) / 180;
    const shade = 0.3 + 0.4 * Math.abs(Math.cos(normalAngle - lightDir));

    const wallGrad = ctx.createLinearGradient(
      (bl.x + br.x) / 2, Math.max(bl.y, br.y),
      (tl.x + tr.x) / 2, Math.min(tl.y, tr.y)
    );
    wallGrad.addColorStop(0, `rgba(71, 85, 105, ${shade * 0.5})`);
    wallGrad.addColorStop(1, `rgba(71, 85, 105, ${shade * 0.2})`);

    ctx.fillStyle = wallGrad;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y); ctx.lineTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y); ctx.lineTo(tl.x, tl.y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  private _draw3DFurniture(ctx: CanvasRenderingContext2D): void {
    for (const f of this._furniture) {
      const hw = f.width / 2;
      const hh = f.height / 2;
      const furnitureHeight = 400; // 40cm default height

      // Bottom corners
      const corners3D = [
        { x: f.x - hw, y: f.y - hh, z: 0 },
        { x: f.x + hw, y: f.y - hh, z: 0 },
        { x: f.x + hw, y: f.y + hh, z: 0 },
        { x: f.x - hw, y: f.y + hh, z: 0 },
      ];

      // Top corners
      const topCorners3D = corners3D.map(c => ({ ...c, z: furnitureHeight }));

      // Project all corners
      const bottom = corners3D.map(c => this._project3D(c));
      const top = topCorners3D.map(c => this._project3D(c));

      // Draw top face
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw sides
      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Label
      const center = this._project3D({ x: f.x, y: f.y, z: furnitureHeight + 100 });
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.name, center.x, center.y);
    }
  }

  private _draw3DDoors(ctx: CanvasRenderingContext2D): void {
    if (this._roomPoints.length < 3) return;
    const doorHeight = 2000; // 2m high doors
    const depth = 80; // Door thickness

    for (const door of this._doors) {
      if (door.wallIndex >= this._roomPoints.length) continue;

      // Get wall endpoints
      const p1 = this._roomPoints[door.wallIndex];
      const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];

      // Calculate door center position on wall
      const doorX = p1.x + (p2.x - p1.x) * door.position;
      const doorY = p1.y + (p2.y - p1.y) * door.position;

      // Calculate wall angle for door orientation
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const hw = door.width / 2;

      // Door corners along the wall
      const cos = Math.cos(wallAngle);
      const sin = Math.sin(wallAngle);
      const perpCos = Math.cos(wallAngle + Math.PI / 2);
      const perpSin = Math.sin(wallAngle + Math.PI / 2);

      // Create door rectangle corners
      const worldCorners = [
        { x: doorX - hw * cos - depth/2 * perpCos, y: doorY - hw * sin - depth/2 * perpSin },
        { x: doorX + hw * cos - depth/2 * perpCos, y: doorY + hw * sin - depth/2 * perpSin },
        { x: doorX + hw * cos + depth/2 * perpCos, y: doorY + hw * sin + depth/2 * perpSin },
        { x: doorX - hw * cos + depth/2 * perpCos, y: doorY - hw * sin + depth/2 * perpSin },
      ];

      // Bottom and top corners
      const bottom = worldCorners.map(c => this._project3D({ ...c, z: 0 }));
      const top = worldCorners.map(c => this._project3D({ ...c, z: doorHeight }));

      // Draw door as 3D box (wood color)
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 1;

      // Top face
      ctx.fillStyle = 'rgba(139, 90, 43, 0.6)';
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side faces
      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(139, 90, 43, 0.5)' : 'rgba(139, 90, 43, 0.35)';
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Door label
      const labelPos = this._project3D({ x: doorX, y: doorY, z: doorHeight + 100 });
      ctx.fillStyle = '#d4a574';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚪', labelPos.x, labelPos.y);
    }
  }

  private _draw3DWindows(ctx: CanvasRenderingContext2D): void {
    if (this._roomPoints.length < 3) return;
    const windowBottom = 900;  // 90cm from ground
    const windowHeight = 1100; // 1.1m high window
    const depth = 50; // Window frame thickness

    for (const win of this._windows) {
      if (win.wallIndex >= this._roomPoints.length) continue;

      // Get wall endpoints
      const p1 = this._roomPoints[win.wallIndex];
      const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];

      // Calculate window center position on wall
      const winX = p1.x + (p2.x - p1.x) * win.position;
      const winY = p1.y + (p2.y - p1.y) * win.position;

      // Calculate wall angle for window orientation
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const hw = win.width / 2;

      // Window corners along the wall
      const cos = Math.cos(wallAngle);
      const sin = Math.sin(wallAngle);
      const perpCos = Math.cos(wallAngle + Math.PI / 2);
      const perpSin = Math.sin(wallAngle + Math.PI / 2);

      // Create window rectangle corners
      const worldCorners = [
        { x: winX - hw * cos - depth/2 * perpCos, y: winY - hw * sin - depth/2 * perpSin },
        { x: winX + hw * cos - depth/2 * perpCos, y: winY + hw * sin - depth/2 * perpSin },
        { x: winX + hw * cos + depth/2 * perpCos, y: winY + hw * sin + depth/2 * perpSin },
        { x: winX - hw * cos + depth/2 * perpCos, y: winY - hw * sin + depth/2 * perpSin },
      ];

      // Bottom and top corners (window sits on wall, not on ground)
      const bottom = worldCorners.map(c => this._project3D({ ...c, z: windowBottom }));
      const top = worldCorners.map(c => this._project3D({ ...c, z: windowBottom + windowHeight }));

      // Draw window as 3D box (glass color - light blue)
      ctx.strokeStyle = '#4a90a4';
      ctx.lineWidth = 1;

      // Top face
      ctx.fillStyle = 'rgba(135, 206, 235, 0.4)';
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side faces (glass effect)
      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(135, 206, 235, 0.35)' : 'rgba(135, 206, 235, 0.25)';
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

private _draw3DZones(ctx: CanvasRenderingContext2D): void {
    const zoneHeight = this.WALL_HEIGHT_3D; // Zones tot plafond

    for (const zone of this._zones) {
      const colors = ZONE_COLORS[zone.type];
      const pts = zone.points;

      if (zone.type === 'entry' && pts.length === 2) {
        // Draw entry line as vertical plane
        const p1 = pts[0], p2 = pts[1];
        const bl1 = this._project3D({ x: p1.x, y: p1.y, z: 0 });
        const bl2 = this._project3D({ x: p2.x, y: p2.y, z: 0 });
        const tl1 = this._project3D({ x: p1.x, y: p1.y, z: zoneHeight });
        const tl2 = this._project3D({ x: p2.x, y: p2.y, z: zoneHeight });

        ctx.fillStyle = colors.fill.replace('0.25', '0.4');
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(bl1.x, bl1.y); ctx.lineTo(bl2.x, bl2.y);
        ctx.lineTo(tl2.x, tl2.y); ctx.lineTo(tl1.x, tl1.y);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Draw direction arrows
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const mid3D = this._project3D({ x: midX, y: midY, z: zoneHeight / 2 });
        ctx.fillStyle = colors.stroke;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.inDirection === 'left' ? '← IN' : 'IN →', mid3D.x, mid3D.y);
      } else if (pts.length >= 3) {
        // Draw zone as 3D volume (floor to ceiling)

        // Draw floor
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;

        ctx.beginPath();
        const firstFloor = this._project3D({ x: pts[0].x, y: pts[0].y, z: 10 });
        ctx.moveTo(firstFloor.x, firstFloor.y);
        for (let i = 1; i < pts.length; i++) {
          const p = this._project3D({ x: pts[i].x, y: pts[i].y, z: 10 });
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Draw ceiling
        ctx.fillStyle = colors.fill.replace('0.2', '0.15');
        ctx.beginPath();
        const firstCeiling = this._project3D({ x: pts[0].x, y: pts[0].y, z: zoneHeight });
        ctx.moveTo(firstCeiling.x, firstCeiling.y);
        for (let i = 1; i < pts.length; i++) {
          const p = this._project3D({ x: pts[i].x, y: pts[i].y, z: zoneHeight });
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Draw vertical walls of the zone volume
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];

          const bl = this._project3D({ x: p1.x, y: p1.y, z: 10 });
          const br = this._project3D({ x: p2.x, y: p2.y, z: 10 });
          const tr = this._project3D({ x: p2.x, y: p2.y, z: zoneHeight });
          const tl = this._project3D({ x: p1.x, y: p1.y, z: zoneHeight });

          // Semi-transparent wall
          ctx.fillStyle = colors.fill.replace('0.2', '0.12');
          ctx.strokeStyle = colors.stroke;
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(bl.x, bl.y);
          ctx.lineTo(br.x, br.y);
          ctx.lineTo(tr.x, tr.y);
          ctx.lineTo(tl.x, tl.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Draw zone label in center at mid-height
        const centerX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const centerY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const labelPos = this._project3D({ x: centerX, y: centerY, z: zoneHeight / 2 });
        ctx.fillStyle = colors.stroke;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, labelPos.x, labelPos.y);
      }
    }
  }

  private _draw3DSensor(ctx: CanvasRenderingContext2D): void {
    if (!this._sensorPos) return;

    const sensorZ = 2000; // Sensor at 2m height
    const pos = this._project3D({ x: this._sensorPos.x, y: this._sensorPos.y, z: sensorZ });

    // Draw FOV cone on floor
    const fovRad = (this._sensorFov / 2) * Math.PI / 180;
    const rotRad = (this._sensorRotation - 90) * Math.PI / 180;

    const range = this._sensorRange;
    const leftAngle = rotRad - fovRad;
    const rightAngle = rotRad + fovRad;

    const leftX = this._sensorPos.x + Math.cos(leftAngle) * range;
    const leftY = this._sensorPos.y + Math.sin(leftAngle) * range;
    const rightX = this._sensorPos.x + Math.cos(rightAngle) * range;
    const rightY = this._sensorPos.y + Math.sin(rightAngle) * range;

    const origin = this._project3D({ x: this._sensorPos.x, y: this._sensorPos.y, z: 0 });
    const left = this._project3D({ x: leftX, y: leftY, z: 0 });
    const right = this._project3D({ x: rightX, y: rightY, z: 0 });

    ctx.fillStyle = 'rgba(67, 97, 238, 0.15)';
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Draw sensor icon
    ctx.fillStyle = '#4361ee';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📡', pos.x, pos.y);
  }

private _draw3DTargets(ctx: CanvasRenderingContext2D): void {
    const targets = this._liveTargets.filter(t => t.active);
    if (!this._sensorPos) return;

    // Use same rotation transform as 2D mode
    const rotRad = (this._sensorRotation - 90) * Math.PI / 180;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      // Apply rotation transformation (same as 2D mode)
      const worldX = this._sensorPos.x + t.y * Math.cos(rotRad) - t.x * Math.sin(rotRad);
      const worldY = this._sensorPos.y + t.y * Math.sin(rotRad) + t.x * Math.cos(rotRad);

      ctx.save();

      // Draw shadow on ground
      const shadowPos = this._project3D({ x: worldX + 80, y: worldY + 80, z: 5 });
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(shadowPos.x, shadowPos.y, 25, 10, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Draw 3D capsule-style figure
      // Legs (3D cylinders)
      this._draw3DCapsule(ctx, worldX - 60, worldY, 0, 60, 700, '#8b9299', '#6b7280');
      this._draw3DCapsule(ctx, worldX + 60, worldY, 0, 60, 700, '#8b9299', '#6b7280');

      // Arms (3D cylinders)
      this._draw3DCapsule(ctx, worldX - 160, worldY, 900, 50, 380, '#8b9299', '#6b7280');
      this._draw3DCapsule(ctx, worldX + 160, worldY, 900, 50, 380, '#8b9299', '#6b7280');

      // Body (3D capsule - larger)
      this._draw3DCapsule(ctx, worldX, worldY, 700, 120, 600, '#b8bfc7', '#9ca3af');

      // Head (3D sphere)
      this._draw3DSphere(ctx, worldX, worldY, 1500, 110);

      // Draw target number above head
      const labelPos = this._project3D({ x: worldX, y: worldY, z: 1700 });

      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.beginPath();
      ctx.arc(labelPos.x, labelPos.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, labelPos.x, labelPos.y);

      ctx.restore();
    }
  }

  private _draw3DCapsule(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    bottomZ: number,
    radius: number,
    height: number,
    fillColor: string,
    strokeColor: string
  ): void {
    const depth = radius * 0.8; // Depth in Y direction

    // Project 8 points around the capsule for 3D effect
    const segments = 8;
    const topZ = bottomZ + height;

    // Collect all faces for depth sorting
    const faces: Array<{points: Array<{x: number; y: number}>; depth: number; isTop: boolean; isSide: boolean}> = [];

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const x1 = centerX + Math.cos(angle1) * radius;
      const y1 = centerY + Math.sin(angle1) * depth;
      const x2 = centerX + Math.cos(angle2) * radius;
      const y2 = centerY + Math.sin(angle2) * depth;

      // Side face
      const bl = this._project3D({ x: x1, y: y1, z: bottomZ });
      const br = this._project3D({ x: x2, y: y2, z: bottomZ });
      const tr = this._project3D({ x: x2, y: y2, z: topZ });
      const tl = this._project3D({ x: x1, y: y1, z: topZ });

      const avgDepth = (y1 + y2) / 2;
      faces.push({
        points: [bl, br, tr, tl],
        depth: avgDepth,
        isTop: false,
        isSide: true
      });
    }

    // Top cap
    const topPoints: Array<{x: number; y: number}> = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * depth;
      topPoints.push(this._project3D({ x, y, z: topZ }));
    }
    faces.push({ points: topPoints, depth: -1000, isTop: true, isSide: false });

    // Sort by depth (back to front)
    faces.sort((a, b) => b.depth - a.depth);

    // Draw faces
    for (const face of faces) {
      ctx.beginPath();
      ctx.moveTo(face.points[0].x, face.points[0].y);
      for (let j = 1; j < face.points.length; j++) {
        ctx.lineTo(face.points[j].x, face.points[j].y);
      }
      ctx.closePath();

      if (face.isTop) {
        // Top cap - lighter
        ctx.fillStyle = fillColor;
      } else {
        // Side faces - shade based on angle
        const shade = face.depth > 0 ? 0.85 : 1.0;
        ctx.fillStyle = this._shadeColor(fillColor, shade);
      }

      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  private _draw3DSphere(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number
  ): void {
    const center = this._project3D({ x: centerX, y: centerY, z: centerZ });
    const top = this._project3D({ x: centerX, y: centerY, z: centerZ + radius });
    const screenRadius = Math.abs(center.y - top.y);

    // Create 3D sphere effect with gradient
    const gradient = ctx.createRadialGradient(
      center.x - screenRadius * 0.35, center.y - screenRadius * 0.35, 0,
      center.x, center.y, screenRadius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#e5e7eb');
    gradient.addColorStop(0.7, '#d1d5db');
    gradient.addColorStop(1, '#9ca3af');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, screenRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private _shadeColor(color: string, factor: number): string {
    // Simple color shading
    const hex = color.replace('#', '');
    const r = Math.round(parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.round(parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.round(parseInt(hex.substr(4, 2), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private _handle3DMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this._isDragging3D = true;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
    }
  }

  private _handle3DMouseMove(e: MouseEvent): void {
    if (!this._isDragging3D) return;

    const dx = e.clientX - this._lastMouseX;
    const dy = e.clientY - this._lastMouseY;

    this._camera3d = {
      ...this._camera3d,
      azimuth: (this._camera3d.azimuth - dx * 0.5) % 360,
      elevation: Math.max(5, Math.min(85, this._camera3d.elevation + dy * 0.3)),
    };

    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;
    this._render3DScene();
  }

  private _handle3DMouseUp(): void {
    this._isDragging3D = false;
  }

  private _handle3DWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    this._camera3d = {
      ...this._camera3d,
      distance: Math.max(2000, Math.min(20000, this._camera3d.distance * zoomFactor)),
    };
    this._render3DScene();
  }

  private _reset3DCamera(): void {
    if (this._roomPoints.length >= 3) {
      const xs = this._roomPoints.map(p => p.x);
      const ys = this._roomPoints.map(p => p.y);
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));

      this._camera3d = {
        azimuth: 45, elevation: 35,
        distance: Math.max(4000, size * 1.5),
        targetX: centerX, targetY: centerY,
        targetZ: this.WALL_HEIGHT_3D / 2,
      };
    } else {
      this._camera3d = { azimuth: 45, elevation: 35, distance: 8000, targetX: 0, targetY: 0, targetZ: 1000 };
    }
    this._render3DScene();
  }

  private _toggleViewMode(): void {
    this._viewMode = this._viewMode === '2d' ? '3d' : '2d';
    if (this._viewMode === '3d') {
      this._reset3DCamera();
      requestAnimationFrame(() => {
        if (this._canvas3d) {
          this._canvas3d.width = this._canvas3d.offsetWidth;
          this._canvas3d.height = this._canvas3d.offsetHeight;
          this._render3DScene();
        }
      });
    }
  }

  private _renderGrid() {
    const lines = [];
    const step = CANVAS_SIZE / 20;
    for (let i = 0; i <= 20; i++) {
      const pos = i * step;
      lines.push(svg`<line class="grid-line" x1="${pos}" y1="0" x2="${pos}" y2="${CANVAS_SIZE}"/>`);
      lines.push(svg`<line class="grid-line" x1="0" y1="${pos}" x2="${CANVAS_SIZE}" y2="${pos}"/>`);
    }
    return lines;
  }

  private _renderRoom() {
    if (this._roomPoints.length < 2) return nothing;

    const elements = [];

    // Draw walls
    for (let i = 0; i < this._roomPoints.length; i++) {
      const p1 = this._roomPoints[i];
      const p2 = this._roomPoints[(i + 1) % this._roomPoints.length];
      const cp1 = this._toCanvas(p1);
      const cp2 = this._toCanvas(p2);
      elements.push(svg`<line class="wall-line" x1="${cp1.x}" y1="${cp1.y}" x2="${cp2.x}" y2="${cp2.y}"/>`);
    }

    return elements;
  }

  private _renderFurniture() {
    return this._furniture.map(f => {
      const cp = this._toCanvas({ x: f.x, y: f.y });
      const scale = CANVAS_SIZE / 10000 * this._zoom;
      const w = f.width * scale;
      const h = f.height * scale;

      return svg`
        <rect
          x="${cp.x - w/2}" y="${cp.y - h/2}"
          width="${w}" height="${h}"
          fill="#334155" stroke="#475569" stroke-width="1"
          transform="rotate(${f.rotation} ${cp.x} ${cp.y})"
          rx="3"
        />
      `;
    });
  }

  private _renderDoorsAndWindows() {
    const elements = [];
    const scale = CANVAS_SIZE / 10000 * this._zoom;

    // Doors
    this._doors.forEach(door => {
      if (door.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[door.wallIndex];
      const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];

      const doorX = p1.x + (p2.x - p1.x) * door.position;
      const doorY = p1.y + (p2.y - p1.y) * door.position;
      const cp = this._toCanvas({ x: doorX, y: doorY });

      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const doorWidthPx = door.width * scale;

      elements.push(svg`
        <line
          x1="${cp.x - Math.cos(wallAngle) * doorWidthPx/2}"
          y1="${cp.y - Math.sin(wallAngle) * doorWidthPx/2}"
          x2="${cp.x + Math.cos(wallAngle) * doorWidthPx/2}"
          y2="${cp.y + Math.sin(wallAngle) * doorWidthPx/2}"
          stroke="#a855f7" stroke-width="4"
        />
      `);
    });

    // Windows
    this._windows.forEach(win => {
      if (win.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[win.wallIndex];
      const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];

      const winX = p1.x + (p2.x - p1.x) * win.position;
      const winY = p1.y + (p2.y - p1.y) * win.position;
      const cp = this._toCanvas({ x: winX, y: winY });

      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const winWidthPx = win.width * scale;

      elements.push(svg`
        <line
          x1="${cp.x - Math.cos(wallAngle) * winWidthPx/2}"
          y1="${cp.y - Math.sin(wallAngle) * winWidthPx/2}"
          x2="${cp.x + Math.cos(wallAngle) * winWidthPx/2}"
          y2="${cp.y + Math.sin(wallAngle) * winWidthPx/2}"
          stroke="#0ea5e9" stroke-width="4"
        />
      `);
    });

    return elements;
  }

  private _renderZones() {
    const elements = [];

    // Render existing zones
    this._zones.forEach((zone, index) => {
      const colors = ZONE_COLORS[zone.type];
      const isSelected = this._selectedZoneIndex === index;

      // Entry lines (2 punten) - render als lijn met pijlen
      if (zone.type === 'entry' && zone.points.length === 2) {
        const cp1 = this._toCanvas(zone.points[0]);
        const cp2 = this._toCanvas(zone.points[1]);
        const midX = (cp1.x + cp2.x) / 2;
        const midY = (cp1.y + cp2.y) / 2;

        // Lijn richting en lengte
        const dx = cp2.x - cp1.x;
        const dy = cp2.y - cp1.y;
        const lineLen = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Normaal vector (loodrecht op de lijn)
        const nx = -dy / lineLen;
        const ny = dx / lineLen;

        // Bepaal welke kant "in" is (links of rechts van de lijn)
        const inDir = zone.inDirection || 'left';
        const inSign = inDir === 'left' ? 1 : -1;

        // Entry lijn renderen
        elements.push(svg`
          <line
            x1="${cp1.x}" y1="${cp1.y}"
            x2="${cp2.x}" y2="${cp2.y}"
            stroke="${colors.stroke}"
            stroke-width="${isSelected ? 4 : 3}"
            stroke-linecap="round"
            style="cursor: pointer;"
            @click="${(e: MouseEvent) => { e.stopPropagation(); this._selectedZoneIndex = index; this._toolMode = 'zone'; }}"
          />
        `);

        // Pijlen wijzen TEGENOVERGESTELD: IN en UIT geven de looprichting aan
        const arrowLen = 30;
        const arrowGap = 5;  // Ruimte tussen pijlpunt en lijn

        // IN pijl: wijst in de "in" richting (door de lijn heen de kamer in)
        // Start aan de buitenkant, wijst naar de lijn en erdoorheen
        const inStartX = midX + nx * inSign * (arrowLen + arrowGap);
        const inStartY = midY + ny * inSign * (arrowLen + arrowGap);
        const inEndX = midX - nx * inSign * arrowGap;  // Net voorbij de lijn
        const inEndY = midY - ny * inSign * arrowGap;
        elements.push(svg`
          <line
            x1="${inStartX}" y1="${inStartY}"
            x2="${inEndX}" y2="${inEndY}"
            stroke="#22c55e" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-in)"
            style="pointer-events: none;"
          />
          <text
            x="${inStartX + nx * inSign * 15}" y="${inStartY + ny * inSign * 15 + 4}"
            fill="#22c55e" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >IN</text>
        `);

        // UIT pijl: wijst in de "uit" richting (door de lijn heen de kamer uit)
        // Start aan de binnenkant, wijst naar de lijn en erdoorheen (tegenovergesteld aan IN)
        const outStartX = midX - nx * inSign * (arrowLen + arrowGap);
        const outStartY = midY - ny * inSign * (arrowLen + arrowGap);
        const outEndX = midX + nx * inSign * arrowGap;  // Net voorbij de lijn
        const outEndY = midY + ny * inSign * arrowGap;
        elements.push(svg`
          <line
            x1="${outStartX}" y1="${outStartY}"
            x2="${outEndX}" y2="${outEndY}"
            stroke="#ef4444" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-out)"
            style="pointer-events: none;"
          />
          <text
            x="${outStartX - nx * inSign * 15}" y="${outStartY - ny * inSign * 15 + 4}"
            fill="#ef4444" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >UIT</text>
        `);

        // Length label
        const lengthMm = Math.hypot(zone.points[1].x - zone.points[0].x, zone.points[1].y - zone.points[0].y);
        const lengthM = (lengthMm / 1000).toFixed(2);
        const textAngle = angle * 180 / Math.PI;
        const adjustedAngle = (textAngle > 90 || textAngle < -90) ? textAngle + 180 : textAngle;
        elements.push(svg`
          <text
            x="${midX}" y="${midY - 12}"
            fill="${colors.stroke}"
            font-size="11" font-weight="600" text-anchor="middle"
            transform="rotate(${adjustedAngle} ${midX} ${midY - 12})"
            style="pointer-events: none;"
          >${lengthM}m</text>
        `);

        // Eindpunten voor dragging
        if (isSelected) {
          elements.push(svg`
            <circle cx="${cp1.x}" cy="${cp1.y}" r="8" fill="${colors.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
            <circle cx="${cp2.x}" cy="${cp2.y}" r="8" fill="${colors.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
          `);
        }

        return;
      }

      // Polygon zones (detection/exclusion) - bestaande logica
      if (zone.points.length < 3) return;

      const pathPoints = zone.points.map(p => this._toCanvas(p));
      const pathD = `M ${pathPoints.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;

      // Exclusion gets dashed, detection gets solid
      const dashArray = zone.type === 'exclusion' ? '8 4' : 'none';
      elements.push(svg`
        <path
          d="${pathD}"
          fill="${colors.fill}"
          stroke="${colors.stroke}"
          stroke-width="${isSelected ? 3 : 2}"
          stroke-dasharray="${dashArray}"
          style="cursor: ${isSelected && this._toolMode === 'zone' ? 'move' : 'pointer'};"
          @click="${(e: MouseEvent) => { e.stopPropagation(); this._selectedZoneIndex = index; this._toolMode = 'zone'; }}"
        />
      `);

      // Zone segment lengths (when selected)
      if (isSelected) {
        for (let i = 0; i < zone.points.length; i++) {
          const p1 = zone.points[i];
          const p2 = zone.points[(i + 1) % zone.points.length];
          const lengthMm = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const lengthM = (lengthMm / 1000).toFixed(2);
          const cp1 = this._toCanvas(p1);
          const cp2 = this._toCanvas(p2);
          const midX = (cp1.x + cp2.x) / 2;
          const midY = (cp1.y + cp2.y) / 2;
          const angle = Math.atan2(cp2.y - cp1.y, cp2.x - cp1.x) * 180 / Math.PI;
          const adjustedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
          elements.push(svg`
            <text
              x="${midX}" y="${midY - 8}"
              fill="${colors.stroke}"
              font-size="11"
              font-weight="600"
              text-anchor="middle"
              transform="rotate(${adjustedAngle} ${midX} ${midY - 8})"
              style="pointer-events: none;"
            >${lengthM}m</text>
          `);
        }
      }

      // Zone points (draggable when selected)
      if (isSelected) {
        zone.points.forEach((p, pointIdx) => {
          const cp = this._toCanvas(p);
          elements.push(svg`
            <circle
              cx="${cp.x}" cy="${cp.y}" r="8"
              fill="${colors.stroke}" stroke="white" stroke-width="2"
              style="cursor: ${this._toolMode === 'zone' ? 'grab' : 'default'};"
            />
          `);
        });

        // Render midpoint preview on 50% of each segment (not for entry lines)
        if (this._toolMode === 'zone' && this._zoneMidpointPreview && this._zoneMidpointPreview.zoneIndex === index) {
          const midCanvas = this._toCanvas(this._zoneMidpointPreview.point);
          elements.push(svg`
            <circle
              cx="${midCanvas.x}" cy="${midCanvas.y}" r="8"
              fill="#22c55e" stroke="white" stroke-width="2"
              style="cursor: pointer;"
            />
          `);
        }
      }
    });

    // Render drawing zone
    if (this._drawingZone.length > 0) {
      const colors = ZONE_COLORS[this._newZoneType];
      const pathPoints = this._drawingZone.map(p => this._toCanvas(p));

      // Draw lines with lengths
      for (let i = 0; i < pathPoints.length - 1; i++) {
        elements.push(svg`
          <line
            x1="${pathPoints[i].x}" y1="${pathPoints[i].y}"
            x2="${pathPoints[i+1].x}" y2="${pathPoints[i+1].y}"
            stroke="${colors.stroke}" stroke-width="2"
          />
        `);

        // Length label
        const p1 = this._drawingZone[i];
        const p2 = this._drawingZone[i + 1];
        const lengthMm = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const lengthM = (lengthMm / 1000).toFixed(2);
        const midX = (pathPoints[i].x + pathPoints[i+1].x) / 2;
        const midY = (pathPoints[i].y + pathPoints[i+1].y) / 2;
        const angle = Math.atan2(pathPoints[i+1].y - pathPoints[i].y, pathPoints[i+1].x - pathPoints[i].x) * 180 / Math.PI;
        const adjustedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
        elements.push(svg`
          <text
            x="${midX}" y="${midY - 8}"
            fill="${colors.stroke}"
            font-size="11"
            font-weight="600"
            text-anchor="middle"
            transform="rotate(${adjustedAngle} ${midX} ${midY - 8})"
            style="pointer-events: none;"
          >${lengthM}m</text>
        `);
      }

      // Preview line to cursor
      if (this._cursorPos) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        const cursorCanvas = this._toCanvas(this._cursorPos);
        elements.push(svg`
          <line
            x1="${lastPoint.x}" y1="${lastPoint.y}"
            x2="${cursorCanvas.x}" y2="${cursorCanvas.y}"
            stroke="${colors.stroke}" stroke-width="2" stroke-dasharray="4 4"
          />
        `);
      }

      // Draw points (draggable)
      pathPoints.forEach((p, i) => {
        const isFirstAndCanClose = i === 0 && this._drawingZone.length >= 3;
        elements.push(svg`
          <circle
            cx="${p.x}" cy="${p.y}" r="8"
            fill="${isFirstAndCanClose ? '#22c55e' : colors.stroke}"
            stroke="white" stroke-width="2"
            style="cursor: grab;"
          />
        `);
      });

      // Render midpoint preview for drawing zone
      if (this._zoneMidpointPreview && this._zoneMidpointPreview.zoneIndex === -1) {
        const midCanvas = this._toCanvas(this._zoneMidpointPreview.point);
        elements.push(svg`
          <circle
            cx="${midCanvas.x}" cy="${midCanvas.y}" r="8"
            fill="#22c55e" stroke="white" stroke-width="2"
            style="cursor: pointer;"
          />
        `);
      }
    }

    return elements;
  }

  private _renderSensorFOV() {
    if (!this._sensorPos) return nothing;
    const cp = this._toCanvas(this._sensorPos);
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const rangePx = this._sensorRange * scale;
    const rotRad = (this._sensorRotation - 90) * Math.PI / 180;
    const halfFov = this._sensorFov * Math.PI / 360;
    const a1 = rotRad - halfFov, a2 = rotRad + halfFov;
    const arcPts: Point[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = a1 + (a2 - a1) * (i / 32);
      arcPts.push({ x: cp.x + Math.cos(angle) * rangePx, y: cp.y + Math.sin(angle) * rangePx });
    }
    const fovPath = `M ${cp.x} ${cp.y} L ${arcPts.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
    return svg`<path d="${fovPath}" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="1.5" style="pointer-events: none;"/>`;
  }

  private _renderSensorIcon() {
    if (!this._sensorPos) return nothing;
    const cp = this._toCanvas(this._sensorPos);
    const rotRad = (this._sensorRotation - 90) * Math.PI / 180;
    const dirX = cp.x + Math.cos(rotRad) * 25, dirY = cp.y + Math.sin(rotRad) * 25;

    const canDragSensor = this._toolMode === 'sensor' || this._toolMode === 'select';
    const sensorColor = this._draggingSensor ? '#22c55e' : '#3b82f6';
    const sensorStroke = this._draggingSensor ? '#16a34a' : '#1d4ed8';

    return svg`
      <circle
        cx="${cp.x}" cy="${cp.y}" r="18"
        fill="${sensorColor}" stroke="${sensorStroke}" stroke-width="2"
        style="cursor: ${this._draggingSensor ? 'grabbing' : canDragSensor ? 'grab' : 'default'}"
        @mousedown="${(e: MouseEvent) => { if (canDragSensor) { e.stopPropagation(); e.preventDefault(); this._draggingSensor = true; } }}"
      />
      <line x1="${cp.x}" y1="${cp.y}" x2="${dirX}" y2="${dirY}" stroke="white" stroke-width="3" stroke-linecap="round"/>
    `;
  }

  // Note: Targets are rendered via _updateTargetCirclesInDOM() using direct DOM manipulation
  // This bypasses Lit template rendering issues with dynamic SVG content

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Update target circles in DOM whenever _liveTargets changes
    if (changedProperties.has('_liveTargets') || changedProperties.has('_sensorPos')) {
      this._updateTargetCirclesInDOM();
    }

    // Update 3D scene when in 3D mode
    if (this._viewMode === '3d' && this._canvas3d) {
      this._render3DScene();
    }
  }

  private _updateTargetCirclesInDOM() {
    // Get the SVG element
    const svgEl = this.shadowRoot?.querySelector('svg');
    if (!svgEl) return;

    // Remove existing target circles
    svgEl.querySelectorAll('.live-target').forEach(el => el.remove());

    if (!this._sensorPos) return;

    const activeTargets = this._liveTargets.filter(t => t.active);
    if (activeTargets.length === 0) return;

    const rotRad = (this._sensorRotation - 90) * Math.PI / 180;
    const colors = ['#ef4444', '#4361ee', '#eab308'];

    activeTargets.forEach((target, i) => {
      const wx = this._sensorPos!.x + target.y * Math.cos(rotRad) - target.x * Math.sin(rotRad);
      const wy = this._sensorPos!.y + target.y * Math.sin(rotRad) + target.x * Math.cos(rotRad);
      const tc = this._toCanvas({ x: wx, y: wy });
      const color = colors[i] || '#ef4444';

      // Create circle element
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'live-target');
      circle.setAttribute('cx', tc.x.toString());
      circle.setAttribute('cy', tc.y.toString());
      circle.setAttribute('r', '18');
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '4');

      // Add animation
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'r');
      animate.setAttribute('values', '14;22;14');
      animate.setAttribute('dur', '1s');
      animate.setAttribute('repeatCount', 'indefinite');
      circle.appendChild(animate);

      svgEl.appendChild(circle);

      // Create text element
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'live-target');
      text.setAttribute('x', tc.x.toString());
      text.setAttribute('y', (tc.y + 6).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.textContent = (i + 1).toString();
      svgEl.appendChild(text);
    });
  }

  render() {
    const selectedRoom = this.rooms.find(r => r.id === this._selectedRoomId);
    const instr = this._getInstructions();
    const radarDevices = this._getRadarDevices();
    const activeTargets = this._liveTargets.filter(t => t.active).length;

    return html`
      <div class="sidebar">
        <div>
          <div class="section-title">KAMER SELECTEREN</div>
          <div class="room-list">
            ${this.rooms.length === 0 ? html`
              <p class="info-text">Geen kamers gevonden. Maak eerst een kamer aan in de Room Builder.</p>
            ` : this.rooms.map(room => html`
              <div class="room-item ${room.id === this._selectedRoomId ? 'selected' : ''}" @click="${() => this._selectRoom(room.id)}">
                <div class="room-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></div>
                <span class="room-name">${room.name}</span>
              </div>
            `)}
          </div>
        </div>

        <div>
          <div class="section-title">GEREEDSCHAPPEN</div>
          <div class="tool-grid">
            <button class="tool-btn ${this._toolMode === 'select' ? 'active' : ''}" @click="${() => this._toolMode = 'select'}">
              <ha-icon icon="mdi:cursor-default"></ha-icon><span>Selecteer</span>
            </button>
            <button class="tool-btn ${this._toolMode === 'sensor' ? 'active' : ''}" @click="${() => this._toolMode = 'sensor'}">
              <ha-icon icon="mdi:radar"></ha-icon><span>Sensor</span>
            </button>
            <button class="tool-btn ${this._toolMode === 'zone' ? 'active' : ''}" @click="${() => this._startDrawingAnyZone()}" style="grid-column: span 2;">
              <ha-icon icon="mdi:vector-polygon"></ha-icon><span>Zone Tekenen</span>
            </button>
          </div>
        </div>

        <div class="instructions">
          <div class="instructions-title">${instr.title}</div>
          <div class="instructions-text">${instr.text}</div>
        </div>
      </div>

      <div class="canvas-area" style="position: relative;">
          <div class="canvas-header">
          <span class="room-label">Kamer: <span>${selectedRoom?.name || 'Geen geselecteerd'}</span></span>
          ${selectedRoom ? html`
            <div class="view-toggle">
              <button class="view-toggle-btn ${this._viewMode === '2d' ? 'active' : ''}" @click="${() => this._viewMode = '2d'}">
                <ha-icon icon="mdi:floor-plan"></ha-icon>2D
              </button>
              <button class="view-toggle-btn ${this._viewMode === '3d' ? 'active' : ''}" @click="${this._toggleViewMode}">
                <ha-icon icon="mdi:cube-outline"></ha-icon>3D
              </button>
            </div>
          ` : nothing}
          <button class="save-btn" @click="${this._saveRoom}" ?disabled="${this._saving || !selectedRoom}">
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this._saving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button class="push-btn" @click="${this._pushToESPHome}" ?disabled="${this._pushingToESPHome || !this._selectedDeviceId || !selectedRoom}">
            <ha-icon icon="mdi:upload"></ha-icon>
            ${this._pushingToESPHome ? 'Pushen...' : 'Push naar Sensor'}
          </button>
        </div>
        ${!selectedRoom ? html`
          <div class="empty-state">
            <ha-icon icon="mdi:vector-polygon"></ha-icon>
            <h3>Zone Configuratie</h3>
            <p>Selecteer een kamer om sensor en zones te configureren</p>
          </div>
        ` : this._viewMode === '2d' ? html`
          <svg viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}"
               @click="${this._handleCanvasClick}"
               @contextmenu="${this._handleContextMenu}"
               @mousemove="${this._handleCanvasMove}"
               @mousedown="${this._handleCanvasDown}"
               @mouseup="${this._handleCanvasUp}"
               @mouseleave="${this._handleCanvasUp}"
               @wheel="${this._handleWheel}"
               @contextmenu="${(e: Event) => e.preventDefault()}">
            <!-- Arrow markers voor entry lijnen -->
            <defs>
              <marker id="arrowhead-in" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
              </marker>
              <marker id="arrowhead-out" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
            </defs>
            ${this._renderGrid()}
            ${this._renderRoom()}
            ${this._renderDoorsAndWindows()}
            ${this._renderFurniture()}
            ${this._renderSensorFOV()}
            ${this._renderZones()}
            ${this._renderSensorIcon()}
          </svg>
          <div class="canvas-controls">
            <div class="control-group">
              <button class="control-btn" @click="${() => this._zoom = Math.min(5, this._zoom + 0.2)}"><ha-icon icon="mdi:plus"></ha-icon></button>
              <button class="control-btn" @click="${() => this._zoom = Math.max(0.2, this._zoom - 0.2)}"><ha-icon icon="mdi:minus"></ha-icon></button>
              <button class="control-btn" @click="${this._autoZoom}"><ha-icon icon="mdi:fit-to-screen"></ha-icon></button>
            </div>
          </div>
        ` : html`
          <canvas
            id="canvas3d"
            class="canvas3d"
            @mousedown="${this._handle3DMouseDown}"
            @mousemove="${this._handle3DMouseMove}"
            @mouseup="${this._handle3DMouseUp}"
            @mouseleave="${this._handle3DMouseUp}"
            @wheel="${this._handle3DWheel}"
          ></canvas>
          <div class="view3d-info">
            🎮 Sleep om te roteren • Scroll om te zoomen
          </div>
          <div class="camera-controls-3d">
            <button class="camera-btn-3d" @click="${this._reset3DCamera}" title="Reset camera">
              <ha-icon icon="mdi:camera-flip"></ha-icon>
            </button>
            <button class="camera-btn-3d" @click="${() => { this._camera3d = { ...this._camera3d, elevation: 85 }; this._render3DScene(); }}" title="Bovenaanzicht">
              <ha-icon icon="mdi:arrow-down-circle"></ha-icon>
            </button>
            <button class="camera-btn-3d" @click="${() => { this._camera3d = { ...this._camera3d, elevation: 15 }; this._render3DScene(); }}" title="Ooghoogte">
              <ha-icon icon="mdi:eye"></ha-icon>
            </button>
          </div>
        `}
      </div>

      <div class="sidebar sidebar-right">
        ${this._toolMode === 'sensor' ? html`
          <div>
            <div class="section-title">SENSOR SELECTEREN</div>
            <div class="setting-item">
              <select @change="${(e: Event) => this._selectedDeviceId = (e.target as HTMLSelectElement).value || null}">
                <option value="">-- Selecteer sensor --</option>
                ${radarDevices.map(d => html`<option value="${d.id}" ?selected="${this._selectedDeviceId === d.id}">${d.name}</option>`)}
              </select>
            </div>

            ${this._selectedDeviceId ? html`
              <div class="live-status" style="border-left: 3px solid ${activeTargets > 0 ? '#22c55e' : '#64748b'};">
                <div class="header">
                  <span class="dot ${activeTargets > 0 ? 'active' : 'inactive'}"></span>
                  <span style="font-weight: 600; color: #e2e8f0;">Live Tracking</span>
                </div>
                <div class="count" style="color: ${activeTargets > 0 ? '#22c55e' : '#64748b'};">
                  ${activeTargets} persoon${activeTargets !== 1 ? 'en' : ''}
                </div>
              </div>
            ` : ''}
          </div>

          <div>
            <div class="section-title">SENSOR INSTELLINGEN</div>
            <div class="setting-item">
              <label>Rotatie: ${this._sensorRotation}°</label>
              <input type="range" min="0" max="359" .value="${this._sensorRotation}"
                     @input="${(e: Event) => this._sensorRotation = parseInt((e.target as HTMLInputElement).value)}"/>
            </div>
            <div class="setting-item">
              <label>Bereik: ${(this._sensorRange / 1000).toFixed(1)}m</label>
              <input type="range" min="1" max="10" step="0.5" .value="${this._sensorRange / 1000}"
                     @input="${(e: Event) => this._sensorRange = parseFloat((e.target as HTMLInputElement).value) * 1000}"/>
            </div>
            <div class="setting-item">
              <label>FOV: ${this._sensorFov}°</label>
              <input type="range" min="30" max="180" .value="${this._sensorFov}"
                     @input="${(e: Event) => this._sensorFov = parseInt((e.target as HTMLInputElement).value)}"/>
            </div>
          </div>
        ` : this._toolMode === 'zone' && this._drawingZone.length > 0 ? html`
            <div>
              <div class="section-title">HUIDIGE TEKENING</div>
              <p class="info-text">${this._drawingZone.length} punten getekend</p>
              <button class="tool-btn" style="width: 100%;" @click="${() => this._drawingZone = []}">
                <ha-icon icon="mdi:cancel"></ha-icon>
                <span>Annuleren</span>
              </button>
        </div>
        ` : ''}

        <!-- Detectie Zones Section -->
        <div>
          <div class="section-title" style="color: #22c55e;">📍 DETECTIE ZONES (${this._getZoneCountByType('detection')}/${ZONE_LIMITS.detection})</div>
          ${this._zones.filter(z => z.type === 'detection').length === 0 ? html`
            <p class="info-text">Nog geen detectie zones. Teken een zone en kies "Detectie".</p>
          ` : html`
            <div class="zone-list">
              ${this._zones.map((zone, i) => zone.type !== 'detection' ? '' : html`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex === i ? 'selected' : ''}"
                       @click="${() => { this._selectedZoneIndex = i; this._editingZoneIndex = null; this._toolMode = 'zone'; }}">
                    <div class="zone-color" style="background: ${ZONE_COLORS[zone.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${zone.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${(e: Event) => { e.stopPropagation(); this._editingZoneIndex = this._editingZoneIndex === i ? null : i; this._selectedZoneIndex = i; }}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" @click="${(e: Event) => { e.stopPropagation(); this._deleteZone(i); }}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(zone, i)}
                </div>
              `)}
            </div>
          `}
        </div>

        <!-- Exclusie Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #f87171;">🚷 EXCLUSIE ZONES (${this._getZoneCountByType('exclusion')}/${ZONE_LIMITS.exclusion})</div>
          ${this._zones.filter(z => z.type === 'exclusion').length === 0 ? html`
            <p class="info-text">Nog geen exclusie zones. Teken een zone en kies "Exclusie".</p>
          ` : html`
            <div class="zone-list">
              ${this._zones.map((zone, i) => zone.type !== 'exclusion' ? '' : html`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex === i ? 'selected' : ''}"
                       @click="${() => { this._selectedZoneIndex = i; this._editingZoneIndex = null; this._toolMode = 'zone'; }}">
                    <div class="zone-color" style="background: ${ZONE_COLORS[zone.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${zone.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${(e: Event) => { e.stopPropagation(); this._editingZoneIndex = this._editingZoneIndex === i ? null : i; this._selectedZoneIndex = i; }}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" @click="${(e: Event) => { e.stopPropagation(); this._deleteZone(i); }}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(zone, i)}
                </div>
              `)}
            </div>
          `}
        </div>

        <!-- Entry Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #10b981;">🚪 ENTRY LIJNEN (${this._getZoneCountByType('entry')}/${ZONE_LIMITS.entry})</div>
          ${this._zones.filter(z => z.type === 'entry').length === 0 ? html`
            <p class="info-text">Nog geen entry lijnen. Teken 2 punten en kies "Entry Lijn" voor in/uit detectie bij deuren.</p>
          ` : html`
            <div class="zone-list">
              ${this._zones.map((zone, i) => zone.type !== 'entry' ? '' : html`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex === i ? 'selected' : ''}"
                       @click="${() => { this._selectedZoneIndex = i; this._editingZoneIndex = null; this._toolMode = 'zone'; }}">
                    <div class="zone-color" style="background: ${ZONE_COLORS[zone.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${zone.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" @click="${(e: Event) => { e.stopPropagation(); this._editingZoneIndex = this._editingZoneIndex === i ? null : i; this._selectedZoneIndex = i; }}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" @click="${(e: Event) => { e.stopPropagation(); this._deleteZone(i); }}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(zone, i)}
                </div>
              `)}
            </div>
          `}
        </div>

        ${this._selectedDeviceId ? html`
          <div class="live-status" style="border-left: 3px solid ${activeTargets > 0 ? '#22c55e' : '#64748b'};">
            <div class="header">
              <span class="dot ${activeTargets > 0 ? 'active' : 'inactive'}"></span>
              <span style="font-weight: 600; color: #e2e8f0;">Live Tracking</span>
            </div>
            <div class="count" style="color: ${activeTargets > 0 ? '#22c55e' : '#64748b'};">
              ${activeTargets} persoon${activeTargets !== 1 ? 'en' : ''}
            </div>
            <!-- Individual target cards -->
            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
              ${[0, 1, 2].map(i => {
                const target = this._liveTargets[i];
                const isActive = target && target.active;
                const distance = target ? Math.sqrt(target.x * target.x + target.y * target.y) / 1000 : 0;
                const colors = ['#ef4444', '#4361ee', '#eab308'];
                const color = colors[i];
                return html`
                  <div style="flex: 1; min-width: 70px; text-align: center; padding: 8px; background: ${isActive ? 'rgba(34, 197, 94, 0.1)' : '#0f172a'}; border-radius: 8px; border: 1px solid ${isActive ? color : '#334155'};">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${isActive ? color : '#64748b'}; margin: 0 auto 4px;"></div>
                    <div style="font-size: 11px; color: ${isActive ? '#e2e8f0' : '#64748b'};">Persoon ${i + 1}</div>
                    <div style="font-size: 13px; font-weight: 600; color: ${isActive ? color : '#64748b'};">
                      ${isActive ? distance.toFixed(1) + 'm' : '-'}
                    </div>
                  </div>
                `;
              })}
          </div>
          </div>
        ` : ''}
      </div>

      <!-- Zone Type Picker Dialog -->
      ${this._showZoneTypePicker ? html`
        <div class="zone-type-picker" @click="${(e: Event) => { if (e.target === e.currentTarget) this._cancelZoneTypePicker(); }}">
          <div class="zone-type-picker-content">
            ${this._pendingZonePoints.length === 2 ? html`
              <!-- 2 punten: Entry Lijn of doorgaan tekenen -->
              <h3>🚪 Entry Lijn aanmaken?</h3>
              <p>Je hebt 2 punten getekend. Wil je een Entry Lijn maken voor in/uit detectie?</p>
              <div class="zone-type-options">
                <div class="zone-type-option entry ${!this._canAddZone('entry') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('entry') && this._selectZoneType('entry')}">
                  <span class="icon">🚪</span>
                  <div class="info">
                    <div class="name">Entry Lijn</div>
                    <div class="desc">Detecteert of iemand IN of UIT loopt</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('entry')}/${ZONE_LIMITS.entry}</span>
                </div>
                <div class="zone-type-option continue" @click="${this._continueDrawingPolygon}">
                  <span class="icon">✏️</span>
                  <div class="info">
                    <div class="name">Doorgaan met tekenen</div>
                    <div class="desc">Voeg meer punten toe voor een polygon zone</div>
                  </div>
                  <span class="badge" style="background: rgba(100, 116, 139, 0.2); color: #94a3b8;">→</span>
                </div>
              </div>
            ` : html`
              <!-- 3+ punten: Polygon zone types -->
              <h3>Kies zone type</h3>
              <p>Je polygon zone is getekend! Selecteer welk type deze zone moet zijn.</p>
              <div class="zone-type-options">
                <div class="zone-type-option detection ${!this._canAddZone('detection') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('detection') && this._selectZoneType('detection')}">
                  <span class="icon">📍</span>
                  <div class="info">
                    <div class="name">Detectie Zone</div>
                    <div class="desc">Detecteert beweging/aanwezigheid</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('detection')}/${ZONE_LIMITS.detection}</span>
                </div>
                <div class="zone-type-option exclusion ${!this._canAddZone('exclusion') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('exclusion') && this._selectZoneType('exclusion')}">
                  <span class="icon">🚷</span>
                  <div class="info">
                    <div class="name">Exclusie Zone</div>
                    <div class="desc">Negeert beweging in dit gebied</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('exclusion')}/${ZONE_LIMITS.exclusion}</span>
                </div>
              </div>
            `}
            <button class="zone-type-picker-cancel" @click="${this._cancelZoneTypePicker}">Annuleren</button>
          </div>
        </div>
      ` : ''}
    `;
  }
}
