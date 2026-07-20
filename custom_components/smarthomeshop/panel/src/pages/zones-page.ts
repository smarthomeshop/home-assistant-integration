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
  sensorId?: string;               // Entry lines: which sensor counts this line
}
interface LocalFurnitureItem { id: string; type: string; name: string; x: number; y: number; width: number; height: number; rotation: number; }
interface DoorItem { id: string; wallIndex: number; position: number; width: number; openDirection: 'inward' | 'outward'; openSide: 'left' | 'right'; }
interface WindowItem { id: string; wallIndex: number; position: number; width: number; height: number; windowType: 'fixed' | 'open' | 'tilt'; }
interface SensorInstance { id: string; deviceId: string | null; x: number; y: number; rotation: number; range: number; fov: number; heightMm: number; }

const CANVAS_SIZE = 800;
const HALF = CANVAS_SIZE / 2;
type ToolMode = 'select' | 'sensor' | 'zone' | 'walls' | 'door' | 'window' | 'furniture';
type DesignMode = 'layout' | 'sensors';
interface FurnitureType { id: string; name: string; icon: string; defaultWidth: number; defaultHeight: number; }

const FURNITURE_TYPES: FurnitureType[] = [
  { id: 'bed', name: 'Bed', icon: 'mdi:bed-double', defaultWidth: 1600, defaultHeight: 2000 },
  { id: 'sofa', name: 'Sofa', icon: 'mdi:sofa', defaultWidth: 2000, defaultHeight: 900 },
  { id: 'chair', name: 'Chair', icon: 'mdi:chair-rolling', defaultWidth: 500, defaultHeight: 500 },
  { id: 'table', name: 'Table', icon: 'mdi:table-furniture', defaultWidth: 1200, defaultHeight: 800 },
  { id: 'cabinet', name: 'Cabinet', icon: 'mdi:wardrobe', defaultWidth: 1000, defaultHeight: 600 },
];

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
  detection: { singular: 'Detection', plural: 'Detection', icon: '📍' },
  exclusion: { singular: 'Exclusion', plural: 'Exclusion', icon: '🚷' },
  entry: { singular: 'Entry Line', plural: 'Entry Lines', icon: '🚪' },
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

  // Sensor state (multiple sensors per room)
  @state() private _sensors: SensorInstance[] = [];
  @state() private _selectedSensorIndex: number | null = null;
  @state() private _draggingSensorIndex: number | null = null;

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

  // Live tracking, keyed by sensor instance id
  @state() private _liveTargets: Record<string, Array<{x: number, y: number, active: boolean}>> = {};

  // Zone sync state
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
  @state() private _dirty = false;

  /** Whether there are unsaved Room Designer changes (read by the top nav). */
  public get isDirty(): boolean {
    return this._dirty;
  }

  // Design mode: room layout editing vs sensors & zones
  @state() private _designMode: DesignMode = 'layout';

  // Wall editing state
  @state() private _pendingStart: Point | null = null;
  @state() private _previewPoint: Point | null = null;
  @state() private _wallHoverPreview: { wallIndex: number; position: number; point: Point } | null = null;
  @state() private _draggingPointIndex: number | null = null;

  // Furniture editing state
  @state() private _selectedFurnitureType: FurnitureType | null = null;
  @state() private _showFurnitureDialog = false;
  @state() private _furnitureWidth = 1000;
  @state() private _furnitureHeight = 1000;
  @state() private _selectedFurnitureIndex: number | null = null;
  @state() private _draggingFurnitureIndex: number | null = null;

  // Door/window editing state
  @state() private _draggingDoorIndex: number | null = null;
  @state() private _draggingWindowIndex: number | null = null;
  @state() private _doorWindowPreview: { wallIndex: number; position: number; point: Point; type: 'door' | 'window' } | null = null;
  @state() private _showDoorDialog = false;
  @state() private _showWindowDialog = false;
  @state() private _editingDoorIndex: number | null = null;
  @state() private _editingWindowIndex: number | null = null;
  @state() private _selectedWallIndex: number | null = null;
  @state() private _doorWidth = 900;
  @state() private _doorOpenDirection: 'inward' | 'outward' = 'inward';
  @state() private _doorOpenSide: 'left' | 'right' = 'left';
  @state() private _windowWidth = 1200;
  @state() private _windowHeight = 1000;
  @state() private _windowType: 'fixed' | 'open' | 'tilt' = 'open';

  // Room management
  @state() private _showNewRoomDialog = false;
  @state() private _newRoomName = '';
  @state() private _newRoomWidth = 0;
  @state() private _newRoomLength = 0;

  // Trail history per sensor per target, in sensor-local coordinates
  private _targetTrails: Record<string, Array<Array<{ x: number; y: number }>>> = {};

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
    .canvas-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; background: #0f172a; border-bottom: 1px solid #334155; }
    .header-group { display: flex; align-items: center; gap: 8px; }
    .room-label { font-size: 13px; color: #94a3b8; }
    .room-label span { color: #e2e8f0; font-weight: 600; }
    .save-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #334155; border: none; border-radius: 8px; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: default; }
    .save-btn.dirty { background: #22c55e; color: white; cursor: pointer; }
    .save-btn.dirty:hover { background: #16a34a; }
    .push-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: 1px solid #3b82f6; border-radius: 8px; color: #3b82f6; font-size: 13px; font-weight: 600; cursor: pointer; }
    .push-btn:disabled { border-color: #475569; color: #64748b; cursor: not-allowed; }
    .push-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.12); }
    svg { flex: 1; background: #0a1628; cursor: crosshair; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; }
    .empty-state ha-icon { --mdc-icon-size: 64px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin: 0 0 8px 0; color: #94a3b8; }
    .grid-line { stroke: #16213a; stroke-width: 0.5; }
    .grid-line.major { stroke: #1e293b; stroke-width: 1; }
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
    .sensor-list { display: flex; flex-direction: column; gap: 6px; }
    .sensor-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; }
    .sensor-item:hover { border-color: #475569; }
    .sensor-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .sensor-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .sensor-dot.small { width: 18px; height: 18px; font-size: 10px; }
    .sensor-item-info { flex: 1; min-width: 0; }
    .sensor-item-name { font-size: 13px; color: #e2e8f0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sensor-item-sub { font-size: 11px; color: #64748b; }
    .add-sensor-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 2px dashed #475569; border-radius: 8px; background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .add-sensor-btn:hover { border-color: #4361ee; color: #4361ee; }
    .add-sensor-btn ha-icon { --mdc-icon-size: 16px; }
    .live-sensor-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; }
    .live-sensor-name { flex: 1; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .live-sensor-count { color: #e2e8f0; font-weight: 600; }
    .mode-toggle { display: flex; background: #0f172a; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
    .mode-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: none; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .mode-btn:hover { color: #e2e8f0; }
    .mode-btn.active { background: #4361ee; color: white; }
    .mode-btn ha-icon { --mdc-icon-size: 16px; }
    .add-room-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 2px dashed #475569; border-radius: 8px; background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .add-room-btn:hover { border-color: #4361ee; color: #4361ee; }
    .add-room-btn ha-icon { --mdc-icon-size: 16px; }
    .furniture-grid { display: flex; flex-direction: column; gap: 6px; }
    .furniture-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; cursor: pointer; }
    .furniture-item:hover { border-color: #4361ee; }
    .furniture-item.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .furniture-item ha-icon { --mdc-icon-size: 20px; color: #94a3b8; }
    .furniture-item span { flex: 1; font-size: 13px; color: #e2e8f0; }
    .furniture-item small { font-size: 11px; color: #64748b; }
    .placed-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; margin-bottom: 6px; font-size: 12px; }
    .placed-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .placed-item ha-icon { --mdc-icon-size: 18px; color: #64748b; }
    .placed-item .name { flex: 1; color: #e2e8f0; }
    .placed-item .size { color: #64748b; }
    .icon-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; }
    .icon-btn:hover { color: #e2e8f0; }
    .icon-btn ha-icon { --mdc-icon-size: 16px; }
    .selected-panel { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; }
    .selected-panel input { width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; box-sizing: border-box; }
    .selected-panel label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
    .panel-btn-row { display: flex; gap: 8px; margin-top: 10px; }
    .panel-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 8px; border: 1px solid #334155; background: transparent; color: #e2e8f0; font-size: 12px; cursor: pointer; }
    .panel-btn:hover { border-color: #4361ee; }
    .panel-btn.danger { color: #ef4444; }
    .panel-btn.danger:hover { border-color: #ef4444; }
    .panel-btn ha-icon { --mdc-icon-size: 16px; }
    .input-row { display: flex; gap: 12px; }
    .input-row > div { flex: 1; }
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; min-width: 340px; max-width: 420px; }
    .dialog h3 { margin: 0 0 16px; font-size: 16px; color: #e2e8f0; }
    .dialog label { display: block; font-size: 12px; color: #94a3b8; margin: 10px 0 4px; }
    .dialog input, .dialog select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; font-size: 13px; box-sizing: border-box; }
    .dialog input:focus, .dialog select:focus { outline: none; border-color: #4361ee; }
    .dialog-buttons { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .dialog-btn { padding: 10px 18px; border-radius: 8px; font-size: 13px; cursor: pointer; border: none; }
    .dialog-btn.cancel { background: transparent; border: 1px solid #475569; color: #94a3b8; }
    .dialog-btn.primary { background: #4361ee; color: white; }
    .remove-sensor-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px; margin-top: 4px; background: transparent; border: 1px solid #334155; border-radius: 6px; color: #ef4444; font-size: 12px; cursor: pointer; }
    .remove-sensor-btn:hover { border-color: #ef4444; }
    .remove-sensor-btn ha-icon { --mdc-icon-size: 16px; }
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
    .view-toggle-btn.active { background: #4361ee; color: white; }
    .view-toggle-btn ha-icon { --mdc-icon-size: 16px; }
    .canvas3d { flex: 1; display: block; cursor: grab; background: #0a1628; }
    .canvas3d:active { cursor: grabbing; }
    .view3d-info { position: absolute; bottom: 16px; left: 16px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; z-index: 10; font-size: 12px; color: #94a3b8; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._loadRooms();
    this._startTargetUpdates();
    window.addEventListener('keydown', this._handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopTargetUpdates();
    window.removeEventListener('keydown', this._handleKeyDown);
  }

  private _markDirty() {
    this._dirty = true;
  }

  private get _selectedSensor(): SensorInstance | null {
    return this._selectedSensorIndex !== null ? this._sensors[this._selectedSensorIndex] ?? null : null;
  }

  private _sensorLabel(s: SensorInstance, index: number): string {
    if (s.deviceId) {
      return s.deviceId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return `Sensor ${index + 1}`;
  }

  private _sensorColor(index: number): string {
    const colors = ['#3b82f6', '#a855f7', '#f59e0b', '#14b8a6'];
    return colors[index % colors.length];
  }

  private _updateSensor(index: number, patch: Partial<SensorInstance>) {
    this._sensors = this._sensors.map((sensor, i) => i === index ? { ...sensor, ...patch } : sensor);
    this._markDirty();
  }

  private _addSensor() {
    // Place a new sensor at the room centroid
    let cx = 0, cy = 0;
    if (this._roomPoints.length >= 3) {
      cx = this._roomPoints.reduce((sum, pt) => sum + pt.x, 0) / this._roomPoints.length;
      cy = this._roomPoints.reduce((sum, pt) => sum + pt.y, 0) / this._roomPoints.length;
    }
    const sensor: SensorInstance = {
      id: `sensor_${Date.now()}`,
      deviceId: null,
      x: Math.round(cx / 100) * 100,
      y: Math.round(cy / 100) * 100,
      rotation: 0,
      range: 6000,
      fov: 120,
      heightMm: 1500,
    };
    this._sensors = [...this._sensors, sensor];
    this._selectedSensorIndex = this._sensors.length - 1;
    this._toolMode = 'sensor';
    this._markDirty();
  }

  private _removeSensor(index: number) {
    const removed = this._sensors[index];
    this._sensors = this._sensors.filter((_, i) => i !== index);
    if (removed) {
      delete this._targetTrails[removed.id];
      const remaining = { ...this._liveTargets };
      delete remaining[removed.id];
      this._liveTargets = remaining;
      // Detach entry lines counted by this sensor
      this._zones = this._zones.map(z => z.sensorId === removed.id ? { ...z, sensorId: undefined } : z);
    }
    this._selectedSensorIndex = this._sensors.length > 0 ? 0 : null;
    this._markDirty();
  }

  private _setDesignMode(mode: DesignMode) {
    if (this._designMode === mode) return;
    this._designMode = mode;
    this._toolMode = 'select';
    this._resetTransientState();
  }

  private _setToolMode(mode: ToolMode) {
    this._toolMode = mode;
    this._resetTransientState();
  }

  private _resetTransientState() {
    this._pendingStart = null;
    this._previewPoint = null;
    this._wallHoverPreview = null;
    this._doorWindowPreview = null;
    this._selectedFurnitureType = null;
    this._selectedFurnitureIndex = null;
    this._drawingZone = [];
    this._zoneMidpointPreview = null;
  }

  private _undoLastWallPoint() {
    if (this._roomPoints.length > 0) {
      this._roomPoints = this._roomPoints.slice(0, -1);
      this._pendingStart = this._roomPoints.length > 0 ? this._roomPoints[this._roomPoints.length - 1] : null;
      this._markDirty();
    }
  }

  private _clearWalls() {
    if (!confirm('Clear all walls of this room?')) return;
    this._roomPoints = [];
    this._pendingStart = null;
    this._previewPoint = null;
    this._markDirty();
  }

  private _addPointOnWall(wallIndex: number, position: number, startDragging = false) {
    if (wallIndex >= this._roomPoints.length) return;
    const p1 = this._roomPoints[wallIndex];
    const p2 = this._roomPoints[(wallIndex + 1) % this._roomPoints.length];
    const newPoint = this._snapToGrid({
      x: p1.x + (p2.x - p1.x) * position,
      y: p1.y + (p2.y - p1.y) * position,
    });
    const newPoints = [...this._roomPoints];
    newPoints.splice(wallIndex + 1, 0, newPoint);
    this._roomPoints = newPoints;
    this._markDirty();
    if (startDragging) this._draggingPointIndex = wallIndex + 1;
    this._wallHoverPreview = null;
  }

  private _deleteWallPoint(index: number) {
    if (this._roomPoints.length <= 3) return;
    this._roomPoints = this._roomPoints.filter((_, i) => i !== index);
    this._draggingPointIndex = null;
    this._markDirty();
  }

  private _findNearestWall(pt: Point): { wallIndex: number; position: number; distance: number } | null {
    if (this._roomPoints.length < 3) return null;
    let nearestWall = -1, nearestDist = Infinity, nearestPos = 0;
    for (let i = 0; i < this._roomPoints.length; i++) {
      const p1 = this._roomPoints[i];
      const p2 = this._roomPoints[(i + 1) % this._roomPoints.length];
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const wallLength = Math.hypot(dx, dy);
      if (wallLength === 0) continue;
      const t = Math.max(0.05, Math.min(0.95, ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / (wallLength * wallLength)));
      const projX = p1.x + t * dx, projY = p1.y + t * dy;
      const dist = Math.hypot(pt.x - projX, pt.y - projY);
      if (dist < nearestDist) { nearestDist = dist; nearestWall = i; nearestPos = t; }
    }
    return nearestWall >= 0 ? { wallIndex: nearestWall, position: nearestPos, distance: nearestDist } : null;
  }

  private _calculateArea(): number {
    if (this._roomPoints.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < this._roomPoints.length; i++) {
      const j = (i + 1) % this._roomPoints.length;
      area += this._roomPoints[i].x * this._roomPoints[j].y;
      area -= this._roomPoints[j].x * this._roomPoints[i].y;
    }
    return Math.abs(area / 2) / 1000000;
  }

  // Furniture helpers
  private _placeFurniture() {
    if (!this._selectedFurnitureType || !this._pendingStart) return;
    this._furniture = [...this._furniture, {
      id: `furniture_${Date.now()}`,
      type: this._selectedFurnitureType.id,
      name: this._selectedFurnitureType.name,
      x: this._pendingStart.x,
      y: this._pendingStart.y,
      width: this._furnitureWidth,
      height: this._furnitureHeight,
      rotation: 0,
    }];
    this._markDirty();
    this._showFurnitureDialog = false;
    this._pendingStart = null;
  }

  private _deleteFurniture(index: number) {
    this._furniture = this._furniture.filter((_, i) => i !== index);
    this._selectedFurnitureIndex = null;
    this._markDirty();
  }

  private _rotateFurniture(index: number) {
    this._furniture = this._furniture.map((f, i) =>
      i === index ? { ...f, rotation: ((f.rotation || 0) + 90) % 360 } : f
    );
    this._markDirty();
  }

  private _updateSelectedFurniture(patch: Partial<LocalFurnitureItem>) {
    if (this._selectedFurnitureIndex === null) return;
    this._furniture = this._furniture.map((f, i) =>
      i === this._selectedFurnitureIndex ? { ...f, ...patch } : f
    );
    this._markDirty();
  }

  // Door/window helpers
  private _addDoor() {
    if (this._selectedWallIndex === null || !this._pendingStart) return;
    this._doors = [...this._doors, {
      id: 'door_' + Date.now(),
      wallIndex: this._selectedWallIndex,
      position: this._pendingStart.x,
      width: this._doorWidth,
      openDirection: this._doorOpenDirection,
      openSide: this._doorOpenSide,
    }];
    this._markDirty();
    this._hideDoorDialog();
  }

  private _hideDoorDialog() {
    this._showDoorDialog = false;
    this._selectedWallIndex = null;
    this._pendingStart = null;
    this._editingDoorIndex = null;
  }

  private _deleteDoor(index: number) {
    this._doors = this._doors.filter((_, i) => i !== index);
    this._markDirty();
  }

  private _editDoor(index: number) {
    const door = this._doors[index];
    if (!door) return;
    this._editingDoorIndex = index;
    this._doorWidth = door.width;
    this._doorOpenDirection = door.openDirection;
    this._doorOpenSide = door.openSide;
    this._showDoorDialog = true;
  }

  private _saveDoorEdit() {
    if (this._editingDoorIndex === null) return;
    this._doors = this._doors.map((d, i) =>
      i === this._editingDoorIndex
        ? { ...d, width: this._doorWidth, openDirection: this._doorOpenDirection, openSide: this._doorOpenSide }
        : d
    );
    this._markDirty();
    this._editingDoorIndex = null;
    this._showDoorDialog = false;
  }

  private _addWindow() {
    if (this._selectedWallIndex === null || !this._pendingStart) return;
    this._windows = [...this._windows, {
      id: 'window_' + Date.now(),
      wallIndex: this._selectedWallIndex,
      position: this._pendingStart.x,
      width: this._windowWidth,
      height: this._windowHeight,
      windowType: this._windowType,
    }];
    this._markDirty();
    this._hideWindowDialog();
  }

  private _hideWindowDialog() {
    this._showWindowDialog = false;
    this._selectedWallIndex = null;
    this._pendingStart = null;
    this._editingWindowIndex = null;
  }

  private _deleteWindow(index: number) {
    this._windows = this._windows.filter((_, i) => i !== index);
    this._markDirty();
  }

  private _editWindow(index: number) {
    const win = this._windows[index];
    if (!win) return;
    this._editingWindowIndex = index;
    this._windowWidth = win.width;
    this._windowHeight = win.height;
    this._windowType = win.windowType;
    this._showWindowDialog = true;
  }

  private _saveWindowEdit() {
    if (this._editingWindowIndex === null) return;
    this._windows = this._windows.map((w, i) =>
      i === this._editingWindowIndex
        ? { ...w, width: this._windowWidth, height: this._windowHeight, windowType: this._windowType }
        : w
    );
    this._markDirty();
    this._editingWindowIndex = null;
    this._showWindowDialog = false;
  }

  // Room management
  private async _createNewRoom() {
    if (!this._newRoomName.trim()) return;
    let walls: Array<{x1: number; y1: number; x2: number; y2: number}> = [];
    if (this._newRoomWidth > 0 && this._newRoomLength > 0) {
      const w = this._newRoomWidth * 10, l = this._newRoomLength * 10;
      const halfW = w / 2, halfL = l / 2;
      walls = [
        { x1: -halfW, y1: -halfL, x2: halfW, y2: -halfL },
        { x1: halfW, y1: -halfL, x2: halfW, y2: halfL },
        { x1: halfW, y1: halfL, x2: -halfW, y2: halfL },
        { x1: -halfW, y1: halfL, x2: -halfW, y2: -halfL },
      ];
    }
    const newRoom: Room = { id: 'room_' + Date.now(), name: this._newRoomName.trim(), walls, furniture: [], devices: [], zones: [] } as any;
    try {
      await this.hass.callWS({ type: 'smarthomeshop/room/save', room: newRoom });
      this.rooms = [...this.rooms, newRoom];
      this._selectRoom(newRoom.id);
      this._showNewRoomDialog = false;
    } catch (err) { console.error('Failed to create room:', err); }
  }

  private _handleKeyDown = (e: KeyboardEvent) => {
    const target = e.composedPath()[0] as HTMLElement | undefined;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
    if (e.key === 'Escape') {
      if (this._showZoneTypePicker) { this._cancelZoneTypePicker(); return; }
      if (this._showDoorDialog) { this._hideDoorDialog(); return; }
      if (this._showWindowDialog) { this._hideWindowDialog(); return; }
      if (this._showFurnitureDialog) { this._showFurnitureDialog = false; return; }
      if (this._showNewRoomDialog) { this._showNewRoomDialog = false; return; }
      if (this._drawingZone.length > 0) { this._drawingZone = []; return; }
      if (this._pendingStart) { this._pendingStart = null; this._previewPoint = null; return; }
      this._selectedZoneIndex = null;
      this._editingZoneIndex = null;
      this._selectedFurnitureIndex = null;
      this._selectedFurnitureType = null;
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && this._selectedFurnitureIndex !== null) {
      e.preventDefault();
      this._deleteFurniture(this._selectedFurnitureIndex);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && this._selectedZoneIndex !== null) {
      e.preventDefault();
      this._deleteZone(this._selectedZoneIndex);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && this._drawingZone.length > 0) {
      e.preventDefault();
      this._drawingZone = this._drawingZone.slice(0, -1);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && this._toolMode === 'walls') {
      e.preventDefault();
      this._undoLastWallPoint();
    } else if (e.key.toLowerCase() === 'r' && this._selectedFurnitureIndex !== null) {
      this._rotateFurniture(this._selectedFurnitureIndex);
    }
  };

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
    if (!this.hass) return;

    let changed = false;
    const next: Record<string, Array<{x: number, y: number, active: boolean}>> = {};

    for (const sensor of this._sensors) {
      if (!sensor.deviceId) continue;
      const targets: Array<{x: number, y: number, active: boolean}> = [];
      let trails = this._targetTrails[sensor.id];
      if (!trails) { trails = [[], [], []]; this._targetTrails[sensor.id] = trails; }

      for (let i = 1; i <= 3; i++) {
        const xEntity = this.hass.states[`sensor.${sensor.deviceId}_target_${i}_x`];
        const yEntity = this.hass.states[`sensor.${sensor.deviceId}_target_${i}_y`];
        if (!xEntity || !yEntity) continue;
        const x = parseFloat(xEntity.state) || 0;
        const y = parseFloat(yEntity.state) || 0;
        const active = x !== 0 || y !== 0;
        targets.push({ x, y, active });

        // Record trail history (sensor-local coords, capped length)
        const trail = trails[i - 1];
        if (active) {
          const last = trail[trail.length - 1];
          if (!last || Math.hypot(x - last.x, y - last.y) > 30) {
            trail.push({ x, y });
            if (trail.length > 60) trail.shift();
          }
        } else if (trail.length > 0) {
          trails[i - 1] = [];
        }
      }
      next[sensor.id] = targets;
      if (JSON.stringify(targets) !== JSON.stringify(this._liveTargets[sensor.id] || [])) changed = true;
    }

    if (changed || Object.keys(next).length !== Object.keys(this._liveTargets).length) {
      this._liveTargets = next;
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
    if (this._dirty && this._selectedRoomId && roomId !== this._selectedRoomId) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    this._dirty = false;
    this._targetTrails = {};
    this._liveTargets = {};
    this._selectedRoomId = roomId;
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      // Load walls
      this._roomPoints = room.walls?.length > 0 ? room.walls.map(w => ({ x: w.x1, y: w.y1 })) : [];

      // Load furniture
      this._furniture = ((room as any).furniture || []).map((f: any) => ({
        id: f.id,
        type: f.typeId || f.type || 'unknown',
        name: f.name || 'Furniture',
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height || f.depth || f.width,
        rotation: f.rotationDeg ?? f.rotation ?? 0,
      }));

      // Load doors and windows
      this._doors = (room as any).doors || [];
      this._windows = (room as any).windows || [];

      // Load sensors (with migration from the old single-sensor format)
      const roomSensors = (room as any).sensors;
      const legacySensor = (room as any).sensor;
      if (roomSensors && roomSensors.length > 0) {
        this._sensors = roomSensors.map((sn: any, i: number) => ({
          id: sn.id || `sensor_${i + 1}`,
          deviceId: sn.deviceId ?? null,
          x: sn.x, y: sn.y,
          rotation: sn.rotation ?? 0,
          range: sn.range ?? 6000,
          fov: sn.fov ?? 120,
          heightMm: sn.heightMm ?? 2000,
        }));
      } else if (legacySensor) {
        this._sensors = [{
          id: 'sensor_1',
          deviceId: legacySensor.deviceId ?? null,
          x: legacySensor.x, y: legacySensor.y,
          rotation: legacySensor.rotation ?? 0,
          range: legacySensor.range ?? 6000,
          fov: legacySensor.fov ?? 120,
          heightMm: legacySensor.heightMm ?? 2000,
        }];
      } else {
        this._sensors = [];
      }
      this._selectedSensorIndex = this._sensors.length > 0 ? 0 : null;

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
    const room = this.rooms.find(r => r.id === this._selectedRoomId);
    if (!room) return;
    this._saving = true;

    // Keep the legacy single-sensor field in sync for older readers (cards)
    const firstSensor = this._sensors[0];
    const sensor = firstSensor ? {
      x: firstSensor.x,
      y: firstSensor.y,
      rotation: firstSensor.rotation,
      range: firstSensor.range,
      fov: firstSensor.fov,
      deviceId: firstSensor.deviceId,
    } : null;

    try {
      const walls = this._roomPoints.map((pt, i) => {
        const next = this._roomPoints[(i + 1) % this._roomPoints.length];
        return { x1: pt.x, y1: pt.y, x2: next.x, y2: next.y };
      });
      const furniture = this._furniture.map(f => ({
        id: f.id,
        typeId: f.type,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        rotationDeg: f.rotation,
      }));
      const updatedRoom = {
        ...room,
        walls,
        furniture,
        doors: this._doors,
        windows: this._windows,
        sensor,
        sensors: this._sensors,
        zones: this._zones,
      };
      await this.hass.callWS({ type: 'smarthomeshop/room/save', room: updatedRoom });
      this.rooms = this.rooms.map(r => r.id === this._selectedRoomId ? updatedRoom as any : r);
      this._dirty = false;
    } catch (err) { console.error('Failed to save room:', err); }
    finally { this._saving = false; }
  }

  @state() private _pushingToESPHome = false;

  private _entityExists(entityId: string): boolean {
    return !!this.hass?.states?.[entityId];
  }

  private async _setTextEntityIfPresent(entityId: string, value: string): Promise<boolean> {
    if (!this._entityExists(entityId)) return false;
    if (value.length > 255) {
      throw new Error(`${entityId} value is ${value.length} characters; LD2450 text entities allow 255 characters`);
    }
    await this.hass.callService('text', 'set_value', { entity_id: entityId, value });
    return true;
  }

  private async _turnOnSwitchIfPresent(entityId: string): Promise<boolean> {
    if (!this._entityExists(entityId)) return false;
    await this.hass.callService('switch', 'turn_on', { entity_id: entityId });
    return true;
  }

  private async _pushToESPHome() {
    const linkedSensors = this._sensors.filter(sn => sn.deviceId);
    if (linkedSensors.length === 0) {
      alert('Add a sensor and link it to a device first!');
      return;
    }
    this._pushingToESPHome = true;

    const detectionZones = this._zones.filter(z => z.type === 'detection');
    const exclusionZones = this._zones.filter(z => z.type === 'exclusion');
    const entryLines = this._zones.filter(z => z.type === 'entry');
    const defaultLineOwner = linkedSensors[0].id;
    const errors: string[] = [];
    let nativePushCount = 0;
    let legacyPushCount = 0;

    try {
      for (const sensor of linkedSensors) {
        const deviceName = sensor.deviceId!;
        // The firmware evaluates targets in sensor-local coordinates, so convert
        // room coordinates to this sensor's frame (inverse of the live-target
        // transform used for rendering).
        const rotRad = (sensor.rotation - 90) * Math.PI / 180;
        const toSensor = (pt: Point): Point => {
          const dx = pt.x - sensor.x;
          const dy = pt.y - sensor.y;
          return {
            x: -dx * Math.sin(rotRad) + dy * Math.cos(rotRad),
            y: dx * Math.cos(rotRad) + dy * Math.sin(rotRad),
          };
        };
        const toPolygonStr = (points: Point[]): string =>
          points.map(pt => { const sp = toSensor(pt); return `${Math.round(sp.x)}:${Math.round(sp.y)}`; }).join(';');

        const hasNativeZoneTextApi = [
          'polygon_zone_1',
          'polygon_exclusion_1',
          'entry_line_1',
        ].some(suffix => this._entityExists(`text.${deviceName}_${suffix}`));

        if (hasNativeZoneTextApi) {
          await this._turnOnSwitchIfPresent(`switch.${deviceName}_polygon_zones_enabled`);

          for (let i = 0; i < 4; i++) {
            const zone = detectionZones[i];
            const entityId = `text.${deviceName}_polygon_zone_${i + 1}`;
            const pushed = await this._setTextEntityIfPresent(entityId, zone ? toPolygonStr(zone.points) : '');
            if (!pushed) errors.push(`${deviceName}: missing ${entityId}`);
          }

          for (let i = 0; i < 2; i++) {
            const zone = exclusionZones[i];
            const entityId = `text.${deviceName}_polygon_exclusion_${i + 1}`;
            const pushed = await this._setTextEntityIfPresent(entityId, zone ? toPolygonStr(zone.points) : '');
            if (!pushed) errors.push(`${deviceName}: missing ${entityId}`);
          }

          const ownedLines = entryLines.filter(l => (l.sensorId || defaultLineOwner) === sensor.id);
          for (let i = 0; i < 2; i++) {
            const line = ownedLines[i];
            let lineStr = '';
            if (line && line.points.length === 2) {
              const dir = line.inDirection || 'left';
              const p1 = toSensor(line.points[0]);
              const p2 = toSensor(line.points[1]);
              lineStr = `${Math.round(p1.x)}:${Math.round(p1.y)};${Math.round(p2.x)}:${Math.round(p2.y)};${dir}`;
            }
            const entityId = `text.${deviceName}_entry_line_${i + 1}`;
            const pushed = await this._setTextEntityIfPresent(entityId, lineStr);
            if (!pushed) errors.push(`${deviceName}: missing ${entityId}`);
          }

          nativePushCount += 1;
          continue;
        }

        errors.push(`${deviceName}: native LD2450 text entities not found; used legacy services`);

        // Detection zones: every sensor watches the same room zones
        for (let i = 0; i < 4; i++) {
          const zone = detectionZones[i];
          try {
            await this.hass.callService('esphome', `${deviceName}_set_polygon_zone`, {
              zone_id: i + 1,
              polygon: zone ? toPolygonStr(zone.points) : '',
            });
          } catch (e) {
            errors.push(`${deviceName}: set_polygon_zone not available`);
            break;
          }
        }

        // Exclusion zones
        for (let i = 0; i < 2; i++) {
          const zone = exclusionZones[i];
          try {
            await this.hass.callService('esphome', `${deviceName}_set_polygon_exclusion`, {
              zone_id: i + 1,
              polygon: zone ? toPolygonStr(zone.points) : '',
            });
          } catch (e) {
            errors.push(`${deviceName}: set_polygon_exclusion not available`);
            break;
          }
        }

        // Entry lines: each line is counted by exactly ONE sensor so people
        // walking through a doorway are not counted twice.
        const ownedLines = entryLines.filter(l => (l.sensorId || defaultLineOwner) === sensor.id);
        for (let i = 0; i < 2; i++) {
          const line = ownedLines[i];
          let lineStr = '';
          if (line && line.points.length === 2) {
            const dir = line.inDirection || 'left';
            const p1 = toSensor(line.points[0]);
            const p2 = toSensor(line.points[1]);
            lineStr = `${Math.round(p1.x)}:${Math.round(p1.y)};${Math.round(p2.x)}:${Math.round(p2.y)};${dir}`;
          }
          try {
            await this.hass.callService('esphome', `${deviceName}_set_entry_line`, {
              line_id: i + 1,
              line_data: lineStr,
            });
          } catch (e) {
            errors.push(`${deviceName}: set_entry_line not available`);
            break;
          }
        }
        legacyPushCount += 1;
      }

      if (errors.length > 0) {
        alert(`Push finished with warnings:\n${[...new Set(errors)].join('\n')}`);
      } else {
        const targetLabel = nativePushCount > 0 ? 'native LD2450 entity set' : 'sensor';
        const count = nativePushCount || legacyPushCount || linkedSensors.length;
        alert(`Zones successfully pushed to ${count} ${targetLabel}${count !== 1 ? 's' : ''}!`);
      }
    } catch (err) {
      console.error('Failed to push zones:', err);
      alert(`Failed to push zones: ${err}`);
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

    // Sensor placement: in sensor mode a click moves the selected sensor
    // (only allowed inside the room)
    if (this._toolMode === 'sensor' && this._selectedSensorIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      if (this._isPointInRoom(snappedPt)) {
        this._updateSensor(this._selectedSensorIndex, { x: snappedPt.x, y: snappedPt.y });
      }
      return;
    }

    // Furniture placement
    if (this._toolMode === 'furniture' && this._selectedFurnitureType) {
      this._furnitureWidth = this._selectedFurnitureType.defaultWidth;
      this._furnitureHeight = this._selectedFurnitureType.defaultHeight;
      this._pendingStart = this._snapToGrid(worldPt);
      this._showFurnitureDialog = true;
      return;
    }

    // Door/window placement is handled via the wall preview mousedown
    if (this._toolMode === 'door' || this._toolMode === 'window') {
      return;
    }

    // Wall drawing
    if (this._toolMode === 'walls') {
      const snappedPt = this._snapToGrid(worldPt);
      // Closed rooms only grow via the wall hover preview
      if (this._roomPoints.length >= 3) return;
      if (!this._pendingStart) { this._pendingStart = snappedPt; return; }
      const first = this._roomPoints[0];
      if (first && this._roomPoints.length >= 2 && Math.hypot(snappedPt.x - first.x, snappedPt.y - first.y) < 250) {
        this._pendingStart = null;
        this._previewPoint = null;
        return;
      }
      if (this._roomPoints.length === 0) {
        this._roomPoints = [this._pendingStart, snappedPt];
      } else {
        this._roomPoints = [...this._roomPoints, snappedPt];
      }
      this._pendingStart = snappedPt;
      this._markDirty();
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
            this._markDirty();
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
    e.stopPropagation();
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);

    // Delete wall corner (layout mode)
    if (this._designMode === 'layout' && (this._toolMode === 'walls' || this._toolMode === 'select')) {
      const idx = this._roomPoints.findIndex(pt => Math.hypot(pt.x - worldPt.x, pt.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._deleteWallPoint(idx);
        return;
      }
    }

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
        this._markDirty();
      }
    }
  }

  private _handleCanvasMove(e: MouseEvent) {
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);
    this._cursorPos = worldPt;

    // Dragging a sensor - only allow inside room
    if (this._draggingSensorIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      if (this._isPointInRoom(snappedPt)) {
        this._updateSensor(this._draggingSensorIndex, { x: snappedPt.x, y: snappedPt.y });
      }
      return;
    }

    // Dragging furniture
    if (this._draggingFurnitureIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      this._furniture = this._furniture.map((f, i) =>
        i === this._draggingFurnitureIndex ? { ...f, x: snappedPt.x, y: snappedPt.y } : f
      );
      this._markDirty();
      return;
    }

    // Dragging a wall corner
    if (this._draggingPointIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      this._roomPoints = this._roomPoints.map((pt, i) => i === this._draggingPointIndex ? snappedPt : pt);
      this._markDirty();
      return;
    }

    // Dragging a door along its wall
    if (this._draggingDoorIndex !== null) {
      const door = this._doors[this._draggingDoorIndex];
      if (door && door.wallIndex < this._roomPoints.length) {
        const p1 = this._roomPoints[door.wallIndex];
        const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const wallLength = Math.hypot(dx, dy);
        if (wallLength > 0) {
          const t = Math.max(0.05, Math.min(0.95, ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / (wallLength * wallLength)));
          this._doors = this._doors.map((d, i) => i === this._draggingDoorIndex ? { ...d, position: t } : d);
          this._markDirty();
        }
      }
      return;
    }

    // Dragging a window along its wall
    if (this._draggingWindowIndex !== null) {
      const win = this._windows[this._draggingWindowIndex];
      if (win && win.wallIndex < this._roomPoints.length) {
        const p1 = this._roomPoints[win.wallIndex];
        const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const wallLength = Math.hypot(dx, dy);
        if (wallLength > 0) {
          const t = Math.max(0.05, Math.min(0.95, ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / (wallLength * wallLength)));
          this._windows = this._windows.map((w, i) => i === this._draggingWindowIndex ? { ...w, position: t } : w);
          this._markDirty();
        }
      }
      return;
    }

    // Wall drawing preview
    if (this._toolMode === 'walls' && this._pendingStart) {
      this._previewPoint = this._snapToGrid(worldPt);
    }

    // Wall hover preview: add-point handle on the nearest wall midpoint
    if (this._designMode === 'layout' && (this._toolMode === 'walls' || this._toolMode === 'select') && this._roomPoints.length >= 3) {
      const wallInfo = this._findNearestWall(worldPt);
      if (wallInfo && wallInfo.distance < 400) {
        const p1 = this._roomPoints[wallInfo.wallIndex];
        const p2 = this._roomPoints[(wallInfo.wallIndex + 1) % this._roomPoints.length];
        this._wallHoverPreview = {
          wallIndex: wallInfo.wallIndex,
          position: 0.5,
          point: { x: p1.x + (p2.x - p1.x) * 0.5, y: p1.y + (p2.y - p1.y) * 0.5 },
        };
      } else {
        this._wallHoverPreview = null;
      }
    } else {
      this._wallHoverPreview = null;
    }

    // Door/window placement preview on the nearest wall
    if ((this._toolMode === 'door' || this._toolMode === 'window') && this._roomPoints.length >= 3) {
      const wallInfo = this._findNearestWall(worldPt);
      if (wallInfo) {
        const p1 = this._roomPoints[wallInfo.wallIndex];
        const p2 = this._roomPoints[(wallInfo.wallIndex + 1) % this._roomPoints.length];
        this._doorWindowPreview = {
          wallIndex: wallInfo.wallIndex,
          position: wallInfo.position,
          point: { x: p1.x + (p2.x - p1.x) * wallInfo.position, y: p1.y + (p2.y - p1.y) * wallInfo.position },
          type: this._toolMode as 'door' | 'window',
        };
      } else {
        this._doorWindowPreview = null;
      }
    } else {
      this._doorWindowPreview = null;
    }

    // Dragging zone point in selected zone
    if (this._draggingZonePointIndex !== null && this._selectedZoneIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      const zone = this._zones[this._selectedZoneIndex];
      const newPoints = [...zone.points];
      newPoints[this._draggingZonePointIndex] = snappedPt;
      this._zones = this._zones.map((z, i) => i === this._selectedZoneIndex ? { ...z, points: newPoints } : z);
      this._markDirty();
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
      this._markDirty();
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

    // Wall corner drag start (layout mode)
    if (this._designMode === 'layout' && (this._toolMode === 'walls' || this._toolMode === 'select')) {
      const idx = this._roomPoints.findIndex(pt => Math.hypot(pt.x - worldPt.x, pt.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._draggingPointIndex = idx;
        return;
      }
    }

    // Check for sensor drag start (any sensor within grab distance)
    for (let i = 0; i < this._sensors.length; i++) {
      const sn = this._sensors[i];
      if (Math.hypot(worldPt.x - sn.x, worldPt.y - sn.y) < 200) {
        this._selectedSensorIndex = i;
        this._draggingSensorIndex = i;
        return;
      }
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
    this._draggingSensorIndex = null;
    this._draggingFurnitureIndex = null;
    this._draggingPointIndex = null;
    this._draggingDoorIndex = null;
    this._draggingWindowIndex = null;
    this._draggingZonePointIndex = null;
    this._draggingDrawingPointIndex = null;
    this._draggingWholeZoneIndex = null;
    this._dragStartPos = null;
  }

  private _handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(5, this._zoom * delta));
    const svgPt = this._getSvgPoint(e);
    if (svgPt) {
      // Keep the world point under the cursor fixed while zooming
      const world = this._fromCanvas(svgPt.x, svgPt.y);
      const scale = CANVAS_SIZE / 10000;
      this._panOffset = {
        x: svgPt.x - HALF - world.x * scale * newZoom,
        y: svgPt.y - HALF - world.y * scale * newZoom,
      };
    }
    this._zoom = newZoom;
  }

  private _deleteZone(index: number) {
    this._zones = this._zones.filter((_, i) => i !== index);
    this._markDirty();
    if (this._selectedZoneIndex === index) this._selectedZoneIndex = null;
    if (this._editingZoneIndex === index) this._editingZoneIndex = null;
  }

  private _updateZoneName(index: number, name: string) {
    this._zones = this._zones.map((z, i) => i === index ? { ...z, name } : z);
    this._markDirty();
  }

  private _updateZoneType(index: number, type: ZoneType) {
    this._zones = this._zones.map((z, i) => i === index ? { ...z, type } : z);
    this._markDirty();
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
        name: `Entry Line ${countOfType}`,
        inDirection: 'left',  // Default: links van de lijn is "in"
      }];
      this._showZoneTypePicker = false;
      this._pendingZonePoints = [];
      this._markDirty();
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
    this._markDirty();
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
    this._markDirty();
  }

  private _renderZoneEditForm(zone: ZoneData, i: number) {
    if (this._editingZoneIndex !== i) return '';

    // Entry lijnen hebben een richting toggle ipv type selectie
    if (zone.type === 'entry') {
      return html`
        <div class="zone-edit-form">
          <label>Entry line name</label>
          <input type="text" .value="${zone.name}"
                 @input="${(e: Event) => this._updateZoneName(i, (e.target as HTMLInputElement).value)}"/>

          <label>IN/OUT direction</label>
          <div class="direction-toggle">
            <button class="${zone.inDirection === 'left' ? 'active in' : ''}"
                    @click="${() => this._toggleEntryDirection(i)}"
                    title="IN direction on the left of the line">
              ⬅️ IN left
            </button>
            <button class="${zone.inDirection === 'right' ? 'active in' : ''}"
                    @click="${() => this._toggleEntryDirection(i)}"
                    title="IN direction on the right of the line">
              IN right ➡️
            </button>
          </div>
          <p class="help-text">The green "IN" arrow shows the direction into the room, the red "OUT" arrow the direction out.</p>

          ${this._sensors.length > 1 ? html`
            <label>Counting sensor</label>
            <select @change="${(e: Event) => { const v = (e.target as HTMLSelectElement).value; this._zones = this._zones.map((z, zi) => zi === i ? { ...z, sensorId: v || undefined } : z); this._markDirty(); }}">
              ${this._sensors.map((sn, si) => html`<option value="${sn.id}" ?selected="${(zone.sensorId || this._sensors[0]?.id) === sn.id}">${this._sensorLabel(sn, si)}</option>`)}
            </select>
            <p class="help-text">Only this sensor counts crossings on this line, so people are not counted twice.</p>
          ` : nothing}

          <div class="edit-actions">
            <button class="cancel-btn" @click="${() => this._editingZoneIndex = null}">Close</button>
          </div>
        </div>
      `;
    }

    // Polygon zones (detection/exclusion)
    return html`
      <div class="zone-edit-form">
        <label>Zone name</label>
        <input type="text" .value="${zone.name}"
               @input="${(e: Event) => this._updateZoneName(i, (e.target as HTMLInputElement).value)}"/>
        <label>Zone type</label>
        <div class="type-switch">
          <button class="${zone.type === 'detection' ? 'active' : ''}"
                  @click="${() => this._updateZoneType(i, 'detection')}">
            📍 Detection
          </button>
          <button class="exclusion ${zone.type === 'exclusion' ? 'active' : ''}"
                  @click="${() => this._updateZoneType(i, 'exclusion')}">
            🚷 Exclusion
          </button>
        </div>
        <div class="edit-actions">
          <button class="cancel-btn" @click="${() => this._editingZoneIndex = null}">Close</button>
        </div>
      </div>
    `;
  }

  private _getInstructions() {
    switch (this._toolMode) {
      case 'select':
        return { title: 'Select', text: 'Drag a sensor or select a zone to edit it.' };
      case 'sensor':
        return { title: 'Sensors', text: this._sensors.length > 0 ? 'Drag a sensor to move it, click one to select it. Manage sensors on the right.' : 'Add a sensor on the right, then drag it into position.' };
      case 'zone':
        if (this._drawingZone.length === 1) {
          return { title: 'Place point 2', text: 'Click for the second point. After 2 points you can create an entry line or continue for a polygon zone.' };
        }
        if (this._drawingZone.length > 1) {
          return { title: 'Draw Zone', text: 'Click to add points. Click the green point to close. Drag points to move them. Right-click a point to delete it.' };
        }
        if (this._selectedZoneIndex !== null) {
          const zone = this._zones[this._selectedZoneIndex];
          if (zone?.type === 'entry') {
            return { title: 'Edit Entry Line', text: 'Drag the endpoints to move the line. Use the edit menu to change the IN/OUT direction.' };
          }
          return { title: 'Edit Zone', text: 'Drag points to move them. Click a green midpoint to add a point. Right-click a point to delete it.' };
        }
        return { title: 'Draw Zone', text: 'Click to place the first point. 2 points = entry line, 3+ points = detection/exclusion zone.' };
      case 'walls':
        return { title: 'Draw Walls', text: this._roomPoints.length >= 3
          ? 'Hover a wall for the green add-point handle. Drag corners to move, right-click to delete.'
          : this._pendingStart
            ? 'Click to add corners. Click the first point to close the room. Esc cancels, Ctrl+Z undoes.'
            : 'Click to place the first corner of the room.' };
      case 'door':
        return { title: 'Add Door', text: 'Hover a wall for the purple preview and click to place. Drag existing doors along their wall.' };
      case 'window':
        return { title: 'Add Window', text: 'Hover a wall for the blue preview and click to place. Drag existing windows along their wall.' };
      case 'furniture':
        return { title: 'Place Furniture', text: this._selectedFurnitureType ? `Click the canvas to place the ${this._selectedFurnitureType.name.toLowerCase()}.` : 'Pick a furniture type on the right, or drag existing furniture. R rotates, Delete removes.' };
      default:
        return { title: 'Room Designer', text: 'Pick a tool to get started.' };
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
    for (const sn of this._sensors) {
      const sensorZ = sn.heightMm ?? 2000;
      const pos = this._project3D({ x: sn.x, y: sn.y, z: sensorZ });
      const fovRad = (sn.fov / 2) * Math.PI / 180;
      const rotRad = (sn.rotation - 90) * Math.PI / 180;
      const leftAngle = rotRad - fovRad;
      const rightAngle = rotRad + fovRad;
      const leftX = sn.x + Math.cos(leftAngle) * sn.range;
      const leftY = sn.y + Math.sin(leftAngle) * sn.range;
      const rightX = sn.x + Math.cos(rightAngle) * sn.range;
      const rightY = sn.y + Math.sin(rightAngle) * sn.range;
      const origin = this._project3D({ x: sn.x, y: sn.y, z: 0 });
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

      // Drop line from the sensor to its floor position (shows the height)
      ctx.strokeStyle = 'rgba(67, 97, 238, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(origin.x, origin.y);
      ctx.stroke();
      ctx.setLineDash([]);

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
  }

private _draw3DTargets(ctx: CanvasRenderingContext2D): void {
    // Flatten active targets from all sensors into world positions
    const worldTargets: Array<{ x: number; y: number }> = [];
    for (const sn of this._sensors) {
      const rotRad = (sn.rotation - 90) * Math.PI / 180;
      for (const t of (this._liveTargets[sn.id] || [])) {
        if (!t.active) continue;
        worldTargets.push({
          x: sn.x + t.y * Math.cos(rotRad) - t.x * Math.sin(rotRad),
          y: sn.y + t.y * Math.sin(rotRad) + t.x * Math.cos(rotRad),
        });
      }
    }

    for (let i = 0; i < worldTargets.length; i++) {
      const worldX = worldTargets[i].x;
      const worldY = worldTargets[i].y;

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
    const lines: unknown[] = [];
    // World-based grid: 50cm minor, 1m major lines, moves with pan/zoom
    for (let mm = -10000; mm <= 10000; mm += 500) {
      const major = mm % 1000 === 0;
      const v1 = this._toCanvas({ x: mm, y: -10000 });
      const v2 = this._toCanvas({ x: mm, y: 10000 });
      const h1 = this._toCanvas({ x: -10000, y: mm });
      const h2 = this._toCanvas({ x: 10000, y: mm });
      lines.push(svg`<line class="grid-line ${major ? 'major' : ''}" x1="${v1.x}" y1="${v1.y}" x2="${v2.x}" y2="${v2.y}"/>`);
      lines.push(svg`<line class="grid-line ${major ? 'major' : ''}" x1="${h1.x}" y1="${h1.y}" x2="${h2.x}" y2="${h2.y}"/>`);
    }
    return lines;
  }

  private _renderRoom() {
    if (this._roomPoints.length < 2) return nothing;
    const elements: unknown[] = [];
    const pathData = this._roomPoints.map((pt, i) => {
      const cp = this._toCanvas(pt);
      return (i === 0 ? 'M' : 'L') + ` ${cp.x} ${cp.y}`;
    }).join(' ') + (this._roomPoints.length >= 3 ? ' Z' : '');

    if (this._roomPoints.length >= 3) {
      elements.push(svg`<path d="${pathData}" fill="rgba(67, 97, 238, 0.06)" style="pointer-events: none;"/>`);
    }

    // Walls + length labels
    for (let i = 0; i < this._roomPoints.length; i++) {
      const p1 = this._roomPoints[i];
      const p2 = this._roomPoints[(i + 1) % this._roomPoints.length];
      if (this._roomPoints.length < 3 && i === this._roomPoints.length - 1) break;
      const cp1 = this._toCanvas(p1);
      const cp2 = this._toCanvas(p2);
      elements.push(svg`<line class="wall-line" x1="${cp1.x}" y1="${cp1.y}" x2="${cp2.x}" y2="${cp2.y}"/>`);

      if (this._designMode === 'layout') {
        const lengthM = (Math.hypot(p2.x - p1.x, p2.y - p1.y) / 1000).toFixed(2);
        const midX = (cp1.x + cp2.x) / 2, midY = (cp1.y + cp2.y) / 2;
        const angle = Math.atan2(cp2.y - cp1.y, cp2.x - cp1.x) * 180 / Math.PI;
        const adjustedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
        const perpAngle = (angle + 90) * Math.PI / 180;
        const ox = Math.cos(perpAngle) * 14, oy = Math.sin(perpAngle) * 14;
        elements.push(svg`
          <text x="${midX + ox}" y="${midY + oy}" text-anchor="middle" dominant-baseline="middle"
            transform="rotate(${adjustedAngle}, ${midX + ox}, ${midY + oy})"
            fill="#7c93f5" font-size="11" font-weight="600"
            stroke="#0a1628" stroke-width="3" paint-order="stroke"
            style="pointer-events: none;">${lengthM}m</text>
        `);
      }
    }

    // Area label at centroid (layout mode)
    if (this._designMode === 'layout' && this._roomPoints.length >= 3) {
      let cx = 0, cy = 0, a = 0;
      for (let i = 0; i < this._roomPoints.length; i++) {
        const q1 = this._roomPoints[i];
        const q2 = this._roomPoints[(i + 1) % this._roomPoints.length];
        const cross = q1.x * q2.y - q2.x * q1.y;
        a += cross; cx += (q1.x + q2.x) * cross; cy += (q1.y + q2.y) * cross;
      }
      if (Math.abs(a) > 1e-6) {
        a /= 2; cx /= 6 * a; cy /= 6 * a;
        const c = this._toCanvas({ x: cx, y: cy });
        elements.push(svg`<text x="${c.x}" y="${c.y}" text-anchor="middle" dominant-baseline="middle" fill="#64748b" font-size="15" font-weight="600" style="pointer-events: none;">${this._calculateArea().toFixed(1)} m²</text>`);
      }
    }

    // Corner handles (layout mode)
    if (this._designMode === 'layout' && (this._toolMode === 'walls' || this._toolMode === 'select')) {
      this._roomPoints.forEach((pt, index) => {
        const cp = this._toCanvas(pt);
        const isDraggingThis = index === this._draggingPointIndex;
        elements.push(svg`
          <circle cx="${cp.x}" cy="${cp.y}" r="7"
            fill="${isDraggingThis ? '#22c55e' : '#4361ee'}" stroke="white" stroke-width="2"
            style="cursor: ${isDraggingThis ? 'grabbing' : 'grab'};"
            @mousedown="${(e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); this._draggingPointIndex = index; }}"
          />
        `);
      });

      // Add-point handle on hovered wall
      if (this._wallHoverPreview) {
        const cp = this._toCanvas(this._wallHoverPreview.point);
        elements.push(svg`
          <g style="cursor: pointer;"
             @mousedown="${(e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); this._addPointOnWall(this._wallHoverPreview!.wallIndex, this._wallHoverPreview!.position, true); }}">
            <circle cx="${cp.x}" cy="${cp.y}" r="11" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2" stroke-dasharray="4 2"/>
            <circle cx="${cp.x}" cy="${cp.y}" r="4" fill="#22c55e"/>
          </g>
        `);
      }
    }

    return elements;
  }

  private _renderWallDrawPreview() {
    if (this._toolMode !== 'walls' || !this._pendingStart || !this._previewPoint) return nothing;
    const startCp = this._toCanvas(this._pendingStart);
    const endCp = this._toCanvas(this._previewPoint);
    const first = this._roomPoints[0];
    const isCloseToFirst = first && this._roomPoints.length >= 2 && Math.hypot(this._previewPoint.x - first.x, this._previewPoint.y - first.y) < 250;
    const firstCp = first ? this._toCanvas(first) : null;
    return svg`
      ${isCloseToFirst && firstCp ? svg`<circle cx="${firstCp.x}" cy="${firstCp.y}" r="18" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="1"/>` : nothing}
      <line x1="${startCp.x}" y1="${startCp.y}" x2="${endCp.x}" y2="${endCp.y}" stroke="#22c55e" stroke-width="2" stroke-dasharray="8 4"/>
      <circle cx="${endCp.x}" cy="${endCp.y}" r="5" fill="#22c55e" stroke="white" stroke-width="2"/>
    `;
  }

  private _renderFurnitureGhost() {
    if (this._toolMode !== 'furniture' || !this._selectedFurnitureType || !this._cursorPos) return nothing;
    const snapped = this._snapToGrid(this._cursorPos);
    const cp = this._toCanvas(snapped);
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const w = this._selectedFurnitureType.defaultWidth * scale;
    const h = this._selectedFurnitureType.defaultHeight * scale;
    return svg`<rect x="${cp.x - w / 2}" y="${cp.y - h / 2}" width="${w}" height="${h}" rx="4"
      fill="rgba(34, 197, 94, 0.12)" stroke="#22c55e" stroke-width="2" stroke-dasharray="6 3" pointer-events="none"/>`;
  }

  private _renderDoorWindowPreview() {
    if (!this._doorWindowPreview) return nothing;
    const preview = this._doorWindowPreview;
    const p1 = this._roomPoints[preview.wallIndex];
    const p2 = this._roomPoints[(preview.wallIndex + 1) % this._roomPoints.length];
    const cp = this._toCanvas(preview.point);
    const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const previewWidth = (preview.type === 'door' ? this._doorWidth : this._windowWidth) * scale;
    const isDoor = preview.type === 'door';
    const color = isDoor ? '#a855f7' : '#0ea5e9';
    const x1 = cp.x - Math.cos(wallAngle) * previewWidth / 2;
    const y1 = cp.y - Math.sin(wallAngle) * previewWidth / 2;
    const x2 = cp.x + Math.cos(wallAngle) * previewWidth / 2;
    const y2 = cp.y + Math.sin(wallAngle) * previewWidth / 2;

    return svg`
      <g style="cursor: pointer;"
         @mousedown="${(e: MouseEvent) => {
           e.stopPropagation();
           e.preventDefault();
           this._selectedWallIndex = preview.wallIndex;
           this._pendingStart = { x: preview.position, y: 0 };
           if (isDoor) { this._showDoorDialog = true; } else { this._showWindowDialog = true; }
         }}">
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="6" stroke-dasharray="8 4" opacity="0.8"/>
        <circle cx="${cp.x}" cy="${cp.y}" r="10" fill="rgba(168, 85, 247, 0.25)" stroke="${color}" stroke-width="2"/>
      </g>
    `;
  }

  private _renderFurniture() {
    const canDrag = this._designMode === 'layout' && (this._toolMode === 'furniture' || this._toolMode === 'select');
    return this._furniture.map((f, index) => {
      const cp = this._toCanvas({ x: f.x, y: f.y });
      const scale = CANVAS_SIZE / 10000 * this._zoom;
      const w = f.width * scale;
      const h = f.height * scale;
      const isSelected = index === this._selectedFurnitureIndex;
      const isDraggingThis = index === this._draggingFurnitureIndex;

      return svg`
        <g @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._selectedFurnitureIndex = index; this._draggingFurnitureIndex = index; } }}"
           style="cursor: ${isDraggingThis ? 'grabbing' : canDrag ? 'grab' : 'default'};">
          <rect
            x="${cp.x - w / 2}" y="${cp.y - h / 2}"
            width="${w}" height="${h}"
            fill="${isDraggingThis ? 'rgba(34, 197, 94, 0.3)' : isSelected ? 'rgba(59, 130, 246, 0.3)' : '#334155'}"
            stroke="${isDraggingThis ? '#22c55e' : isSelected ? '#3b82f6' : '#475569'}"
            stroke-width="${isDraggingThis || isSelected ? 2 : 1}"
            transform="rotate(${f.rotation || 0} ${cp.x} ${cp.y})"
            rx="3"
          />
          ${this._designMode === 'layout' ? svg`
            <text x="${cp.x}" y="${cp.y + 4}" text-anchor="middle"
              fill="${isDraggingThis ? '#22c55e' : isSelected ? '#3b82f6' : '#94a3b8'}"
              font-size="11" font-weight="500" style="pointer-events: none;">${f.name}</text>
          ` : nothing}
        </g>
      `;
    });
  }

  private _renderDoorsAndWindows() {
    const elements: unknown[] = [];
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const canDrag = this._designMode === 'layout' && (this._toolMode === 'door' || this._toolMode === 'window' || this._toolMode === 'select');

    this._doors.forEach((door, index) => {
      if (door.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[door.wallIndex];
      const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];
      const doorX = p1.x + (p2.x - p1.x) * door.position;
      const doorY = p1.y + (p2.y - p1.y) * door.position;
      const cp = this._toCanvas({ x: doorX, y: doorY });
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const perpAngle = wallAngle + (door.openDirection === 'inward' ? Math.PI / 2 : -Math.PI / 2);
      const doorWidthPx = door.width * scale;
      const isDraggingThis = index === this._draggingDoorIndex;
      const doorColor = isDraggingThis ? '#22c55e' : '#a855f7';

      elements.push(svg`
        <g style="cursor: ${isDraggingThis ? 'grabbing' : canDrag ? 'grab' : 'default'};"
           @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._draggingDoorIndex = index; } }}">
          <circle cx="${cp.x}" cy="${cp.y}" r="15" fill="transparent"/>
          <line
            x1="${cp.x - Math.cos(wallAngle) * doorWidthPx / 2}"
            y1="${cp.y - Math.sin(wallAngle) * doorWidthPx / 2}"
            x2="${cp.x + Math.cos(wallAngle) * doorWidthPx / 2}"
            y2="${cp.y + Math.sin(wallAngle) * doorWidthPx / 2}"
            stroke="#0a1628" stroke-width="6"
          />
          <line
            x1="${cp.x}" y1="${cp.y}"
            x2="${cp.x + Math.cos(perpAngle) * doorWidthPx * 0.9}"
            y2="${cp.y + Math.sin(perpAngle) * doorWidthPx * 0.9}"
            stroke="${doorColor}" stroke-width="3"
          />
          <path
            d="M ${cp.x + Math.cos(perpAngle) * doorWidthPx * 0.9} ${cp.y + Math.sin(perpAngle) * doorWidthPx * 0.9} A ${doorWidthPx * 0.9} ${doorWidthPx * 0.9} 0 0 ${door.openSide === 'left' ? 1 : 0} ${cp.x + Math.cos(wallAngle + (door.openSide === 'left' ? -1 : 1) * Math.PI / 2) * doorWidthPx * 0.9} ${cp.y + Math.sin(wallAngle + (door.openSide === 'left' ? -1 : 1) * Math.PI / 2) * doorWidthPx * 0.9}"
            fill="none" stroke="${doorColor}" stroke-width="1" stroke-dasharray="4 2" opacity="0.5"
          />
          ${this._designMode === 'layout' ? svg`<circle cx="${cp.x}" cy="${cp.y}" r="6" fill="${doorColor}" stroke="white" stroke-width="2"/>` : nothing}
        </g>
      `);
    });

    this._windows.forEach((win, index) => {
      if (win.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[win.wallIndex];
      const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];
      const winX = p1.x + (p2.x - p1.x) * win.position;
      const winY = p1.y + (p2.y - p1.y) * win.position;
      const cp = this._toCanvas({ x: winX, y: winY });
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const winWidthPx = win.width * scale;
      const isDraggingThis = index === this._draggingWindowIndex;
      const winColor = isDraggingThis ? '#22c55e' : '#0ea5e9';
      const x1 = cp.x - Math.cos(wallAngle) * winWidthPx / 2;
      const y1 = cp.y - Math.sin(wallAngle) * winWidthPx / 2;
      const x2 = cp.x + Math.cos(wallAngle) * winWidthPx / 2;
      const y2 = cp.y + Math.sin(wallAngle) * winWidthPx / 2;

      elements.push(svg`
        <g style="cursor: ${isDraggingThis ? 'grabbing' : canDrag ? 'grab' : 'default'};"
           @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._draggingWindowIndex = index; } }}">
          <circle cx="${cp.x}" cy="${cp.y}" r="15" fill="transparent"/>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${winColor}" stroke-width="6"/>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isDraggingThis ? '#4ade80' : '#38bdf8'}" stroke-width="3"/>
          ${this._designMode === 'layout' ? svg`<circle cx="${cp.x}" cy="${cp.y}" r="6" fill="${winColor}" stroke="white" stroke-width="2"/>` : nothing}
        </g>
      `);
    });

    return elements;
  }

  private _renderZones() {
    const elements: unknown[] = [];

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
          >OUT</text>
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
    if (this._sensors.length === 0) return nothing;
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const wedges: unknown[] = [];

    this._sensors.forEach((sn, index) => {
      const isSelected = index === this._selectedSensorIndex;
      const cp = this._toCanvas({ x: sn.x, y: sn.y });
      const rangePx = sn.range * scale;
      const rotRad = (sn.rotation - 90) * Math.PI / 180;
      const halfFov = sn.fov * Math.PI / 360;
      const a1 = rotRad - halfFov, a2 = rotRad + halfFov;
      const arcPts: Point[] = [];
      for (let i = 0; i <= 32; i++) {
        const angle = a1 + (a2 - a1) * (i / 32);
        arcPts.push({ x: cp.x + Math.cos(angle) * rangePx, y: cp.y + Math.sin(angle) * rangePx });
      }
      const fovPath = `M ${cp.x} ${cp.y} L ${arcPts.map(pt => `${pt.x} ${pt.y}`).join(' L ')} Z`;
      const alpha = isSelected ? 1 : 0.45;

      wedges.push(svg`<path d="${fovPath}" fill="rgba(34, 197, 94, ${0.12 * alpha})" stroke="#22c55e" stroke-opacity="${alpha}" stroke-width="1.5" style="pointer-events: none;"/>`);

      // Distance rings + angle guides for the selected sensor only (keeps the view calm)
      if (isSelected) {
        for (let r = 1000; r <= sn.range; r += 1000) {
          const rPx = r * scale;
          const ringPts: Point[] = [];
          for (let i = 0; i <= 24; i++) {
            const angle = a1 + (a2 - a1) * (i / 24);
            ringPts.push({ x: cp.x + Math.cos(angle) * rPx, y: cp.y + Math.sin(angle) * rPx });
          }
          const ringPath = `M ${ringPts.map(pt => `${pt.x} ${pt.y}`).join(' L ')}`;
          wedges.push(svg`<path d="${ringPath}" fill="none" stroke="rgba(34, 197, 94, 0.25)" stroke-width="1" style="pointer-events: none;"/>`);
          const lx = cp.x + Math.cos(rotRad) * rPx;
          const ly = cp.y + Math.sin(rotRad) * rPx;
          wedges.push(svg`<text x="${lx}" y="${ly - 4}" fill="rgba(34, 197, 94, 0.6)" font-size="9" text-anchor="middle" style="pointer-events: none;">${r / 1000}m</text>`);
        }
        for (let deg = -180; deg <= 180; deg += 30) {
          if (Math.abs(deg) > sn.fov / 2) continue;
          const ang = rotRad + (deg * Math.PI) / 180;
          wedges.push(svg`<line x1="${cp.x}" y1="${cp.y}" x2="${cp.x + Math.cos(ang) * rangePx}" y2="${cp.y + Math.sin(ang) * rangePx}" stroke="rgba(34, 197, 94, 0.15)" stroke-width="1" style="pointer-events: none;"/>`);
        }
      }
    });

    return svg`${wedges}`;
  }

  private _renderSensorIcon() {
    if (this._sensors.length === 0) return nothing;
    const canDragSensor = this._toolMode === 'sensor' || this._toolMode === 'select';

    return svg`${this._sensors.map((sn, index) => {
      const cp = this._toCanvas({ x: sn.x, y: sn.y });
      const rotRad = (sn.rotation - 90) * Math.PI / 180;
      const dirX = cp.x + Math.cos(rotRad) * 25, dirY = cp.y + Math.sin(rotRad) * 25;
      const isDraggingThis = this._draggingSensorIndex === index;
      const isSelected = this._selectedSensorIndex === index;
      const color = isDraggingThis ? '#22c55e' : this._sensorColor(index);

      return svg`
        ${isSelected ? svg`<circle cx="${cp.x}" cy="${cp.y}" r="25" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 3" style="pointer-events: none;"/>` : nothing}
        <circle
          cx="${cp.x}" cy="${cp.y}" r="18"
          fill="${color}" stroke="white" stroke-width="2"
          style="cursor: ${isDraggingThis ? 'grabbing' : canDragSensor ? 'grab' : 'default'}"
          @mousedown="${(e: MouseEvent) => { if (canDragSensor) { e.stopPropagation(); e.preventDefault(); this._selectedSensorIndex = index; this._draggingSensorIndex = index; } }}"
        />
        <line x1="${cp.x}" y1="${cp.y}" x2="${dirX}" y2="${dirY}" stroke="white" stroke-width="3" stroke-linecap="round" style="pointer-events: none;"/>
        <text x="${cp.x}" y="${cp.y + 4}" text-anchor="middle" fill="white" font-size="11" font-weight="700" style="pointer-events: none;">${index + 1}</text>
      `;
    })}`;
  }

  // Note: Targets are rendered via _updateTargetCirclesInDOM() using direct DOM manipulation
  // This bypasses Lit template rendering issues with dynamic SVG content

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Update target circles in DOM whenever _liveTargets changes
    if (changedProperties.has('_liveTargets') || changedProperties.has('_sensors')) {
      this._updateTargetCirclesInDOM();
    }

    // Update 3D scene when in 3D mode
    if (this._viewMode === '3d' && this._canvas3d) {
      this._render3DScene();
    }
  }

  private _updateTargetCirclesInDOM() {
    const svgEl = this.shadowRoot?.querySelector('svg');
    if (!svgEl) return;

    svgEl.querySelectorAll('.live-target').forEach(el => el.remove());

    const TARGET_COLORS = [
      ['#ef4444', '#4361ee', '#eab308'],
      ['#f97316', '#8b5cf6', '#06b6d4'],
      ['#ec4899', '#22c55e', '#94a3b8'],
    ];

    this._sensors.forEach((sensor, sensorIdx) => {
      const rotRad = (sensor.rotation - 90) * Math.PI / 180;
      const toWorld = (t: { x: number; y: number }) => ({
        x: sensor.x + t.y * Math.cos(rotRad) - t.x * Math.sin(rotRad),
        y: sensor.y + t.y * Math.sin(rotRad) + t.x * Math.cos(rotRad),
      });
      const palette = TARGET_COLORS[sensorIdx % TARGET_COLORS.length];
      const targets = this._liveTargets[sensor.id] || [];
      const trails = this._targetTrails[sensor.id] || [];

      targets.forEach((target, i) => {
        if (!target.active) return;
        const world = toWorld(target);
        const tc = this._toCanvas(world);
        const color = palette[i] || '#ef4444';

        // Movement trail (fading line behind the target)
        const trail = trails[i] || [];
        if (trail.length > 1) {
          const pts = trail.map(tp => {
            const c = this._toCanvas(toWorld(tp));
            return `${c.x},${c.y}`;
          }).join(' ');
          const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          poly.setAttribute('class', 'live-target');
          poly.setAttribute('points', pts);
          poly.setAttribute('fill', 'none');
          poly.setAttribute('stroke', color);
          poly.setAttribute('stroke-width', '2');
          poly.setAttribute('stroke-opacity', '0.35');
          poly.setAttribute('stroke-linecap', 'round');
          poly.setAttribute('stroke-linejoin', 'round');
          svgEl.appendChild(poly);
        }

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'live-target');
        circle.setAttribute('cx', tc.x.toString());
        circle.setAttribute('cy', tc.y.toString());
        circle.setAttribute('r', '18');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '4');
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', '14;22;14');
        animate.setAttribute('dur', '1s');
        animate.setAttribute('repeatCount', 'indefinite');
        circle.appendChild(animate);
        svgEl.appendChild(circle);

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
    });
  }

  private _renderSelectedFurniturePanel() {
    const idx = this._selectedFurnitureIndex;
    if (idx === null || !this._furniture[idx]) return nothing;
    const sel = this._furniture[idx];
    return html`
      <div class="selected-panel">
        <div class="section-title">SELECTED: ${sel.name.toUpperCase()}</div>
        <div class="input-row">
          <div>
            <label>Width (cm)</label>
            <input type="number" min="10" max="500" .value="${String(sel.width / 10)}"
              @input="${(e: Event) => this._updateSelectedFurniture({ width: (parseInt((e.target as HTMLInputElement).value) || 10) * 10 })}"/>
          </div>
          <div>
            <label>Depth (cm)</label>
            <input type="number" min="10" max="500" .value="${String(sel.height / 10)}"
              @input="${(e: Event) => this._updateSelectedFurniture({ height: (parseInt((e.target as HTMLInputElement).value) || 10) * 10 })}"/>
          </div>
        </div>
        <div class="panel-btn-row">
          <button class="panel-btn" @click="${() => this._rotateFurniture(idx)}" title="Shortcut: R">
            <ha-icon icon="mdi:rotate-right"></ha-icon>Rotate ${sel.rotation || 0}°
          </button>
          <button class="panel-btn danger" @click="${() => this._deleteFurniture(idx)}" title="Shortcut: Delete">
            <ha-icon icon="mdi:delete"></ha-icon>Delete
          </button>
        </div>
      </div>
    `;
  }

  private _renderLayoutSidebar() {
    if (this._toolMode === 'furniture') {
      return html`
        ${this._renderSelectedFurniturePanel()}
        <div>
          <div class="section-title">FURNITURE</div>
          <p class="info-text" style="margin-bottom: 10px;">Pick a type, then click the canvas to place it.</p>
          <div class="furniture-grid">
            ${FURNITURE_TYPES.map(type => html`
              <div class="furniture-item ${this._selectedFurnitureType?.id === type.id ? 'selected' : ''}"
                   @click="${() => { this._selectedFurnitureType = type; this._selectedFurnitureIndex = null; }}">
                <ha-icon icon="${type.icon}"></ha-icon>
                <span>${type.name}</span>
                <small>${type.defaultWidth / 10}×${type.defaultHeight / 10}cm</small>
              </div>
            `)}
          </div>
        </div>
        ${this._furniture.length > 0 ? html`
          <div>
            <div class="section-title">PLACED FURNITURE</div>
            ${this._furniture.map((f, i) => html`
              <div class="placed-item ${this._selectedFurnitureIndex === i ? 'selected' : ''}" @click="${() => this._selectedFurnitureIndex = i}">
                <ha-icon icon="${FURNITURE_TYPES.find(t => t.id === f.type)?.icon || 'mdi:square'}"></ha-icon>
                <span class="name">${f.name}</span>
                <span class="size">${f.width / 10}×${f.height / 10}</span>
                <button class="icon-btn" title="Rotate 90°" @click="${(e: Event) => { e.stopPropagation(); this._rotateFurniture(i); }}">
                  <ha-icon icon="mdi:rotate-right"></ha-icon>
                </button>
                <button class="delete-btn" title="Delete" @click="${(e: Event) => { e.stopPropagation(); this._deleteFurniture(i); }}">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        ` : nothing}
      `;
    }

    if (this._toolMode === 'door') {
      return html`
        <div>
          <div class="section-title">DOORS</div>
          <p class="info-text" style="margin-bottom: 10px;">Hover a wall and click the preview to add a door.</p>
          ${this._doors.length === 0 ? html`
            <p class="info-text" style="color: #64748b;">No doors added yet.</p>
          ` : this._doors.map((d, i) => html`
            <div class="placed-item">
              <ha-icon icon="mdi:door"></ha-icon>
              <span class="name">Door ${i + 1}</span>
              <span class="size">${d.width / 10}cm</span>
              <button class="icon-btn" title="Edit" @click="${() => this._editDoor(i)}">
                <ha-icon icon="mdi:pencil"></ha-icon>
              </button>
              <button class="delete-btn" title="Delete" @click="${() => this._deleteDoor(i)}">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          `)}
        </div>
      `;
    }

    if (this._toolMode === 'window') {
      return html`
        <div>
          <div class="section-title">WINDOWS</div>
          <p class="info-text" style="margin-bottom: 10px;">Hover a wall and click the preview to add a window.</p>
          ${this._windows.length === 0 ? html`
            <p class="info-text" style="color: #64748b;">No windows added yet.</p>
          ` : this._windows.map((w, i) => html`
            <div class="placed-item">
              <ha-icon icon="mdi:window-closed-variant"></ha-icon>
              <span class="name">${w.windowType === 'fixed' ? 'Fixed' : w.windowType === 'tilt' ? 'Tilt' : 'Casement'}</span>
              <span class="size">${w.width / 10}×${w.height / 10}cm</span>
              <button class="icon-btn" title="Edit" @click="${() => this._editWindow(i)}">
                <ha-icon icon="mdi:pencil"></ha-icon>
              </button>
              <button class="delete-btn" title="Delete" @click="${() => this._deleteWindow(i)}">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          `)}
        </div>
      `;
    }

    // select / walls: room info + selected furniture
    const area = this._calculateArea();
    return html`
      ${this._renderSelectedFurniturePanel()}
      <div>
        <div class="section-title">ROOM INFO</div>
        <div class="info-text">
          ${this._roomPoints.length >= 3 ? html`
            <p>Area: <span class="info-value">${area.toFixed(1)} m²</span></p>
            <p>Corners: <span class="info-value">${this._roomPoints.length}</span></p>
            <p>Furniture: <span class="info-value">${this._furniture.length}</span></p>
            <p>Doors: <span class="info-value">${this._doors.length}</span> · Windows: <span class="info-value">${this._windows.length}</span></p>
            <p>Sensors: <span class="info-value">${this._sensors.length}</span> · Zones: <span class="info-value">${this._zones.length}</span></p>
          ` : html`<p>Draw walls to see measurements. Use the Walls tool to start.</p>`}
        </div>
      </div>
    `;
  }

  render() {
    const selectedRoom = this.rooms.find(r => r.id === this._selectedRoomId);
    const instr = this._getInstructions();
    const radarDevices = this._getRadarDevices();
    const activeTargets = Object.values(this._liveTargets).reduce((sum, targets) => sum + targets.filter(t => t.active).length, 0);

    return html`
      <div class="sidebar">
        <div>
          <div class="section-title">SELECT ROOM</div>
          <div class="room-list">
            ${this.rooms.length === 0 ? html`
              <p class="info-text">No rooms yet. Create your first room with "Add Room" below.</p>
            ` : this.rooms.map(room => html`
              <div class="room-item ${room.id === this._selectedRoomId ? 'selected' : ''}" @click="${() => this._selectRoom(room.id)}">
                <div class="room-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></div>
                <span class="room-name">${room.name}</span>
              </div>
            `)}
            <button class="add-room-btn" @click="${() => { this._newRoomName = ''; this._newRoomWidth = 0; this._newRoomLength = 0; this._showNewRoomDialog = true; }}">
              <ha-icon icon="mdi:plus"></ha-icon>Add Room
            </button>
          </div>
        </div>

        <div>
          <div class="section-title">TOOLS</div>
          ${this._designMode === 'layout' ? html`
            <div class="tool-grid">
              <button class="tool-btn ${this._toolMode === 'select' ? 'active' : ''}" @click="${() => this._setToolMode('select')}">
                <ha-icon icon="mdi:cursor-default"></ha-icon><span>Select</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'walls' ? 'active' : ''}" @click="${() => this._setToolMode('walls')}">
                <ha-icon icon="mdi:wall"></ha-icon><span>Walls</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'door' ? 'active' : ''}" @click="${() => this._setToolMode('door')}">
                <ha-icon icon="mdi:door"></ha-icon><span>Door</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'window' ? 'active' : ''}" @click="${() => this._setToolMode('window')}">
                <ha-icon icon="mdi:window-closed-variant"></ha-icon><span>Window</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'furniture' ? 'active' : ''}" @click="${() => this._setToolMode('furniture')}" style="grid-column: span 2;">
                <ha-icon icon="mdi:sofa"></ha-icon><span>Furniture</span>
              </button>
            </div>
          ` : html`
            <div class="tool-grid">
              <button class="tool-btn ${this._toolMode === 'select' ? 'active' : ''}" @click="${() => this._setToolMode('select')}">
                <ha-icon icon="mdi:cursor-default"></ha-icon><span>Select</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'sensor' ? 'active' : ''}" @click="${() => this._setToolMode('sensor')}">
                <ha-icon icon="mdi:radar"></ha-icon><span>Sensors</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'zone' ? 'active' : ''}" @click="${() => this._startDrawingAnyZone()}" style="grid-column: span 2;">
                <ha-icon icon="mdi:vector-polygon"></ha-icon><span>Draw Zone</span>
              </button>
            </div>
          `}
        </div>

        <div class="instructions">
          <div class="instructions-title">${instr.title}</div>
          <div class="instructions-text">${instr.text}</div>
        </div>
      </div>

      <div class="canvas-area" style="position: relative;">
          <div class="canvas-header">
          <div class="header-group">
            ${selectedRoom ? html`
              <div class="mode-toggle">
                <button class="mode-btn ${this._designMode === 'layout' ? 'active' : ''}" @click="${() => this._setDesignMode('layout')}">
                  <ha-icon icon="mdi:floor-plan"></ha-icon>Layout
                </button>
                <button class="mode-btn ${this._designMode === 'sensors' ? 'active' : ''}" @click="${() => this._setDesignMode('sensors')}">
                  <ha-icon icon="mdi:radar"></ha-icon>Sensors & Zones
                </button>
              </div>
            ` : html`<span class="room-label">No room selected</span>`}
          </div>
          <div class="header-group">
            ${selectedRoom ? html`
              <div class="view-toggle">
                <button class="view-toggle-btn ${this._viewMode === '2d' ? 'active' : ''}" @click="${() => this._viewMode = '2d'}" title="2D floor plan">
                  <ha-icon icon="mdi:floor-plan"></ha-icon>2D
                </button>
                <button class="view-toggle-btn ${this._viewMode === '3d' ? 'active' : ''}" @click="${this._toggleViewMode}" title="3D view">
                  <ha-icon icon="mdi:cube-outline"></ha-icon>3D
                </button>
              </div>
              ${this._designMode === 'sensors' ? html`
                <button class="push-btn" @click="${this._pushToESPHome}" ?disabled="${this._pushingToESPHome || !this._sensors.some(sn => sn.deviceId)}"
                        title="Push zones and entry lines to the linked sensors">
                  <ha-icon icon="mdi:upload"></ha-icon>
                  ${this._pushingToESPHome ? 'Pushing...' : 'Push'}
                </button>
              ` : nothing}
              <button class="save-btn ${this._dirty ? 'dirty' : ''}" @click="${this._saveRoom}" ?disabled="${this._saving || !this._dirty}">
                <ha-icon icon="mdi:content-save"></ha-icon>
                ${this._saving ? 'Saving...' : this._dirty ? 'Save' : 'Saved'}
              </button>
            ` : nothing}
          </div>
        </div>
        ${!selectedRoom ? html`
          <div class="empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <h3>Room Designer</h3>
            <p>Select or create a room to draw the layout, place sensors and configure zones</p>
          </div>
        ` : this._viewMode === '2d' ? html`
          <svg viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}"
               @click="${this._handleCanvasClick}"
               @contextmenu="${this._handleContextMenu}"
               @mousemove="${this._handleCanvasMove}"
               @mousedown="${this._handleCanvasDown}"
               @mouseup="${this._handleCanvasUp}"
               @mouseleave="${this._handleCanvasUp}"
               @wheel="${this._handleWheel}">
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
            ${this._renderFurnitureGhost()}
            ${this._renderSensorFOV()}
            ${this._renderZones()}
            ${this._renderWallDrawPreview()}
            ${this._renderDoorWindowPreview()}
            ${this._renderSensorIcon()}
          </svg>
          <div class="canvas-controls">
            <div class="control-group">
              <button class="control-btn" @click="${() => this._zoom = Math.min(5, this._zoom * 1.25)}"><ha-icon icon="mdi:plus"></ha-icon></button>
              <button class="control-btn" @click="${() => this._zoom = Math.max(0.2, this._zoom / 1.25)}"><ha-icon icon="mdi:minus"></ha-icon></button>
              <button class="control-btn" @click="${this._autoZoom}"><ha-icon icon="mdi:fit-to-screen"></ha-icon></button>
            </div>
            ${this._toolMode === 'walls' ? html`
              <div class="control-group">
                <button class="control-btn" @click="${this._undoLastWallPoint}" title="Undo last corner"><ha-icon icon="mdi:undo"></ha-icon></button>
                <button class="control-btn" @click="${this._clearWalls}" title="Clear walls"><ha-icon icon="mdi:delete"></ha-icon></button>
              </div>
            ` : nothing}
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
            🎮 Drag to rotate • Scroll to zoom
          </div>
        `}
      </div>

      <div class="sidebar sidebar-right">
        ${this._designMode === 'layout' ? this._renderLayoutSidebar() : html`
        ${this._toolMode === 'sensor' ? html`
          <div>
            <div class="section-title">SENSORS (${this._sensors.length})</div>
            <div class="sensor-list">
              ${this._sensors.map((sn, i) => html`
                <div class="sensor-item ${this._selectedSensorIndex === i ? 'selected' : ''}" @click="${() => this._selectedSensorIndex = i}">
                  <span class="sensor-dot" style="background: ${this._sensorColor(i)};">${i + 1}</span>
                  <div class="sensor-item-info">
                    <div class="sensor-item-name">${this._sensorLabel(sn, i)}</div>
                    <div class="sensor-item-sub">${sn.deviceId ? 'Linked' : 'No device linked'}</div>
                  </div>
                  <button class="delete-btn" title="Remove sensor" @click="${(e: Event) => { e.stopPropagation(); this._removeSensor(i); }}">
                    <ha-icon icon="mdi:delete"></ha-icon>
                  </button>
                </div>
              `)}
              <button class="add-sensor-btn" @click="${this._addSensor}">
                <ha-icon icon="mdi:plus"></ha-icon>Add sensor
              </button>
            </div>
          </div>

          ${this._selectedSensor ? html`
            <div>
              <div class="section-title">SENSOR ${this._selectedSensorIndex! + 1} SETTINGS</div>
              <div class="setting-item">
                <label>Device</label>
                <select @change="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { deviceId: (e.target as HTMLSelectElement).value || null })}">
                  <option value="">-- Select device --</option>
                  ${radarDevices.map(d => html`<option value="${d.id}" ?selected="${this._selectedSensor?.deviceId === d.id}">${d.name}</option>`)}
                </select>
              </div>
              <div class="setting-item">
                <label>Rotation: ${this._selectedSensor.rotation}°</label>
                <input type="range" min="0" max="359" .value="${String(this._selectedSensor.rotation)}"
                       @input="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { rotation: parseInt((e.target as HTMLInputElement).value) })}"/>
              </div>
              <div class="setting-item">
                <label>Range: ${(this._selectedSensor.range / 1000).toFixed(1)}m</label>
                <input type="range" min="1" max="10" step="0.5" .value="${String(this._selectedSensor.range / 1000)}"
                       @input="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { range: parseFloat((e.target as HTMLInputElement).value) * 1000 })}"/>
              </div>
              <div class="setting-item">
                <label>FOV: ${this._selectedSensor.fov}°</label>
                <input type="range" min="30" max="180" .value="${String(this._selectedSensor.fov)}"
                       @input="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { fov: parseInt((e.target as HTMLInputElement).value) })}"/>
              </div>
              <div class="setting-item">
                <label>Mounting height: ${((this._selectedSensor.heightMm ?? 2000) / 1000).toFixed(1)}m</label>
                <input type="range" min="0.2" max="3" step="0.1" .value="${String((this._selectedSensor.heightMm ?? 2000) / 1000)}"
                       @input="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { heightMm: Math.round(parseFloat((e.target as HTMLInputElement).value) * 1000) })}"/>
              </div>
            </div>
          ` : nothing}
        ` : this._toolMode === 'zone' && this._drawingZone.length > 0 ? html`
            <div>
              <div class="section-title">CURRENT DRAWING</div>
              <p class="info-text">${this._drawingZone.length} points drawn</p>
              <button class="tool-btn" style="width: 100%;" @click="${() => this._drawingZone = []}">
                <ha-icon icon="mdi:cancel"></ha-icon>
                <span>Cancel</span>
              </button>
        </div>
        ` : ''}

        <!-- Detection Zones Section -->
        <div>
          <div class="section-title" style="color: #22c55e;">📍 DETECTION ZONES (${this._getZoneCountByType('detection')}/${ZONE_LIMITS.detection})</div>
          ${this._zones.filter(z => z.type === 'detection').length === 0 ? html`
            <p class="info-text">No detection zones yet. Draw a zone and choose "Detection".</p>
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

        <!-- Exclusion Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #f87171;">🚷 EXCLUSION ZONES (${this._getZoneCountByType('exclusion')}/${ZONE_LIMITS.exclusion})</div>
          ${this._zones.filter(z => z.type === 'exclusion').length === 0 ? html`
            <p class="info-text">No exclusion zones yet. Draw a zone and choose "Exclusion".</p>
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
          <div class="section-title" style="color: #10b981;">🚪 ENTRY LINES (${this._getZoneCountByType('entry')}/${ZONE_LIMITS.entry})</div>
          ${this._zones.filter(z => z.type === 'entry').length === 0 ? html`
            <p class="info-text">No entry lines yet. Draw 2 points and choose "Entry Line" for in/out detection at doorways.</p>
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

        ${this._sensors.some(sn => sn.deviceId) ? html`
          <div class="live-status" style="border-left: 3px solid ${activeTargets > 0 ? '#22c55e' : '#64748b'};">
            <div class="header">
              <span class="dot ${activeTargets > 0 ? 'active' : 'inactive'}"></span>
              <span style="font-weight: 600; color: #e2e8f0;">Live Tracking</span>
            </div>
            <div class="count" style="color: ${activeTargets > 0 ? '#22c55e' : '#64748b'};">
              ${activeTargets} ${activeTargets === 1 ? 'person' : 'people'}
            </div>
            ${this._sensors.map((sn, si) => {
              if (!sn.deviceId) return nothing;
              const sensorTargets = this._liveTargets[sn.id] || [];
              const activeCount = sensorTargets.filter(t => t.active).length;
              return html`
                <div class="live-sensor-row">
                  <span class="sensor-dot small" style="background: ${this._sensorColor(si)};">${si + 1}</span>
                  <span class="live-sensor-name">${this._sensorLabel(sn, si)}</span>
                  <span class="live-sensor-count">${activeCount} active</span>
                </div>
              `;
            })}
          </div>
        ` : ''}
        `}
      </div>

      <!-- Zone Type Picker Dialog -->
      ${this._showZoneTypePicker ? html`
        <div class="zone-type-picker" @click="${(e: Event) => { if (e.target === e.currentTarget) this._cancelZoneTypePicker(); }}">
          <div class="zone-type-picker-content">
            ${this._pendingZonePoints.length === 2 ? html`
              <!-- 2 punten: Entry Lijn of doorgaan tekenen -->
              <h3>🚪 Create an entry line?</h3>
              <p>You drew 2 points. Do you want to create an entry line for in/out detection?</p>
              <div class="zone-type-options">
                <div class="zone-type-option entry ${!this._canAddZone('entry') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('entry') && this._selectZoneType('entry')}">
                  <span class="icon">🚪</span>
                  <div class="info">
                    <div class="name">Entry Line</div>
                    <div class="desc">Detects whether someone walks IN or OUT</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('entry')}/${ZONE_LIMITS.entry}</span>
                </div>
                <div class="zone-type-option continue" @click="${this._continueDrawingPolygon}">
                  <span class="icon">✏️</span>
                  <div class="info">
                    <div class="name">Continue drawing</div>
                    <div class="desc">Add more points for a polygon zone</div>
                  </div>
                  <span class="badge" style="background: rgba(100, 116, 139, 0.2); color: #94a3b8;">→</span>
                </div>
              </div>
            ` : html`
              <!-- 3+ punten: Polygon zone types -->
              <h3>Choose zone type</h3>
              <p>Your polygon zone is drawn! Choose what type this zone should be.</p>
              <div class="zone-type-options">
                <div class="zone-type-option detection ${!this._canAddZone('detection') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('detection') && this._selectZoneType('detection')}">
                  <span class="icon">📍</span>
                  <div class="info">
                    <div class="name">Detection Zone</div>
                    <div class="desc">Detects motion/presence</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('detection')}/${ZONE_LIMITS.detection}</span>
                </div>
                <div class="zone-type-option exclusion ${!this._canAddZone('exclusion') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('exclusion') && this._selectZoneType('exclusion')}">
                  <span class="icon">🚷</span>
                  <div class="info">
                    <div class="name">Exclusion Zone</div>
                    <div class="desc">Ignores motion in this area</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('exclusion')}/${ZONE_LIMITS.exclusion}</span>
                </div>
              </div>
            `}
            <button class="zone-type-picker-cancel" @click="${this._cancelZoneTypePicker}">Cancel</button>
          </div>
        </div>
      ` : ''}

      ${this._showNewRoomDialog ? html`
        <div class="dialog-overlay" @click="${() => this._showNewRoomDialog = false}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>New Room</h3>
            <label>Room name *</label>
            <input type="text" placeholder="e.g. Living room" .value="${this._newRoomName}"
              @input="${(e: Event) => this._newRoomName = (e.target as HTMLInputElement).value}"
              @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this._createNewRoom()}" autofocus/>
            <p class="help-text" style="margin-top: 8px;">Optional: dimensions for a rectangular room (leave empty to draw manually)</p>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" placeholder="e.g. 400" .value="${this._newRoomWidth || ''}"
                  @input="${(e: Event) => this._newRoomWidth = parseInt((e.target as HTMLInputElement).value) || 0}"/>
              </div>
              <div>
                <label>Length (cm)</label>
                <input type="number" placeholder="e.g. 500" .value="${this._newRoomLength || ''}"
                  @input="${(e: Event) => this._newRoomLength = parseInt((e.target as HTMLInputElement).value) || 0}"/>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${() => this._showNewRoomDialog = false}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._createNewRoom}">${this._newRoomWidth > 0 && this._newRoomLength > 0 ? 'Create with dimensions' : 'Create (draw manually)'}</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showFurnitureDialog && this._selectedFurnitureType ? html`
        <div class="dialog-overlay" @click="${() => this._showFurnitureDialog = false}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>Place ${this._selectedFurnitureType.name}</h3>
            <p class="help-text">Enter the dimensions (top view)</p>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" min="10" max="500" .value="${String(this._furnitureWidth / 10)}"
                  @input="${(e: Event) => this._furnitureWidth = (parseInt((e.target as HTMLInputElement).value) || 100) * 10}"/>
              </div>
              <div>
                <label>Depth (cm)</label>
                <input type="number" min="10" max="500" .value="${String(this._furnitureHeight / 10)}"
                  @input="${(e: Event) => this._furnitureHeight = (parseInt((e.target as HTMLInputElement).value) || 100) * 10}"/>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${() => this._showFurnitureDialog = false}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._placeFurniture}">Place</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showDoorDialog ? html`
        <div class="dialog-overlay" @click="${this._hideDoorDialog}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>${this._editingDoorIndex !== null ? 'Edit Door' : 'Add Door'}</h3>
            <label>Width (cm)</label>
            <input type="number" .value="${String(this._doorWidth / 10)}"
              @input="${(e: Event) => this._doorWidth = (parseInt((e.target as HTMLInputElement).value) || 90) * 10}"/>
            <label>Opening direction</label>
            <select .value="${this._doorOpenDirection}" @change="${(e: Event) => this._doorOpenDirection = (e.target as HTMLSelectElement).value as 'inward' | 'outward'}">
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
            </select>
            <label>Hinge side</label>
            <select .value="${this._doorOpenSide}" @change="${(e: Event) => this._doorOpenSide = (e.target as HTMLSelectElement).value as 'left' | 'right'}">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideDoorDialog}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._editingDoorIndex !== null ? this._saveDoorEdit : this._addDoor}">${this._editingDoorIndex !== null ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showWindowDialog ? html`
        <div class="dialog-overlay" @click="${this._hideWindowDialog}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>${this._editingWindowIndex !== null ? 'Edit Window' : 'Add Window'}</h3>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" .value="${String(this._windowWidth / 10)}"
                  @input="${(e: Event) => this._windowWidth = (parseInt((e.target as HTMLInputElement).value) || 120) * 10}"/>
              </div>
              <div>
                <label>Height (cm)</label>
                <input type="number" .value="${String(this._windowHeight / 10)}"
                  @input="${(e: Event) => this._windowHeight = (parseInt((e.target as HTMLInputElement).value) || 100) * 10}"/>
              </div>
            </div>
            <label>Window type</label>
            <select .value="${this._windowType}" @change="${(e: Event) => this._windowType = (e.target as HTMLSelectElement).value as 'fixed' | 'open' | 'tilt'}">
              <option value="fixed">Fixed window</option>
              <option value="open">Casement window</option>
              <option value="tilt">Tilt window</option>
            </select>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideWindowDialog}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._editingWindowIndex !== null ? this._saveWindowEdit : this._addWindow}">${this._editingWindowIndex !== null ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}
