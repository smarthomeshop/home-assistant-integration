import { LitElement, html, css, svg, nothing, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { HomeAssistant, Room } from '../types';

interface Point { x: number; y: number; }
interface Point3D { x: number; y: number; z: number; }
interface Camera3D { azimuth: number; elevation: number; distance: number; targetX: number; targetY: number; targetZ: number; }
interface FurnitureType { id: string; name: string; icon: string; defaultWidth: number; defaultHeight: number; }
interface LocalFurnitureItem { id: string; type: string; name: string; x: number; y: number; width: number; height: number; rotation: number; }
interface DoorItem { id: string; wallIndex: number; position: number; width: number; openDirection: 'inward' | 'outward'; openSide: 'left' | 'right'; }
interface WindowItem { id: string; wallIndex: number; position: number; width: number; height: number; windowType: 'fixed' | 'open' | 'tilt'; }

const CANVAS_SIZE = 800;
const HALF = CANVAS_SIZE / 2;
const WALL_HEIGHT_3D = 2500; // 2.5 meter wall height in mm
type ToolMode = 'select' | 'walls' | 'furniture' | 'door' | 'window';
type ViewMode = '2d' | '3d';

// Simplified furniture types with default sizes (in mm)
const FURNITURE_TYPES: FurnitureType[] = [
  { id: 'bed', name: 'Bed', icon: 'mdi:bed-double', defaultWidth: 1600, defaultHeight: 2000 },
  { id: 'sofa', name: 'Bank', icon: 'mdi:sofa', defaultWidth: 2000, defaultHeight: 900 },
  { id: 'chair', name: 'Stoel', icon: 'mdi:chair-rolling', defaultWidth: 500, defaultHeight: 500 },
  { id: 'table', name: 'Tafel', icon: 'mdi:table-furniture', defaultWidth: 1200, defaultHeight: 800 },
  { id: 'cabinet', name: 'Kast', icon: 'mdi:wardrobe', defaultWidth: 1000, defaultHeight: 600 },
];

@customElement('shs-room-builder-page')
export class RoomBuilderPage extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Array }) rooms: Room[] = [];
  @state() private _selectedRoomId: string | null = null;
  @state() private _roomPoints: Point[] = [];
  @state() private _toolMode: ToolMode = 'walls';
  @state() private _pendingStart: Point | null = null;
  @state() private _previewPoint: Point | null = null;
  @state() private _zoom = 1;
  @state() private _panOffset: Point = { x: 0, y: 0 };
  @state() private _snapGrid = 100;
  @state() private _cursorPos: Point | null = null;
  @state() private _saving = false;
  @state() private _showNewRoomDialog = false;
  @state() private _newRoomName = '';
  @state() private _newRoomWidth = 0; // in cm, 0 = manual draw
  @state() private _newRoomLength = 0; // in cm, 0 = manual draw
  @state() private _isDragging = false;

  // Furniture state
  @state() private _furniture: LocalFurnitureItem[] = [];
  @state() private _selectedFurnitureType: FurnitureType | null = null;
  @state() private _showFurnitureDialog = false;
  @state() private _furnitureWidth = 1000;
  @state() private _furnitureHeight = 1000;
  @state() private _selectedFurnitureIndex: number | null = null;
  @state() private _draggingFurnitureIndex: number | null = null;
  @state() private _draggingPointIndex: number | null = null;
  @state() private _draggingDoorIndex: number | null = null;
  @state() private _draggingWindowIndex: number | null = null;
  @state() private _wallHoverPreview: { wallIndex: number; position: number; point: Point } | null = null;
  @state() private _doorWindowPreview: { wallIndex: number; position: number; point: Point; type: 'door' | 'window' } | null = null;
  @state() private _editingDoorIndex: number | null = null;
  @state() private _editingWindowIndex: number | null = null;

  // Doors and windows
  @state() private _doors: DoorItem[] = [];
  @state() private _windows: WindowItem[] = [];
  @state() private _showDoorDialog = false;
  @state() private _showWindowDialog = false;
  @state() private _selectedWallIndex: number | null = null;
  @state() private _doorWidth = 900; // mm
  @state() private _doorOpenDirection: 'inward' | 'outward' = 'inward';
  @state() private _doorOpenSide: 'left' | 'right' = 'left';
  @state() private _windowWidth = 1200; // mm
  @state() private _windowHeight = 1000; // mm
  @state() private _windowType: 'fixed' | 'open' | 'tilt' = 'open';

  @query('svg') private _svg!: SVGSVGElement;
  @query('#canvas3d') private _canvas3d!: HTMLCanvasElement;

  // 3D View state
  @state() private _viewMode: ViewMode = '2d';
  private _camera3d: Camera3D = { azimuth: 45, elevation: 35, distance: 8000, targetX: 0, targetY: 0, targetZ: 1000 };
  private _isDragging3D = false;
  private _lastMouseX = 0;
  private _lastMouseY = 0;
  private _animationFrame: number | null = null;

  static styles = css`
    :host { display: grid; grid-template-columns: 280px 1fr 280px; height: 100%; background: #0f172a; color: #e2e8f0; overflow: hidden; }
    .sidebar-left, .sidebar-right { background: #1e293b; border-right: 1px solid #334155; padding: 20px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
    .sidebar-right { border-right: none; border-left: 1px solid #334155; }
    .section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 12px; }
    .room-list { display: flex; flex-direction: column; gap: 8px; }
    .room-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #0f172a; border: 1px solid transparent; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .room-item:hover { border-color: #475569; }
    .room-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .room-icon { width: 40px; height: 40px; background: #4361ee; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .room-icon ha-icon { --mdc-icon-size: 20px; color: white; }
    .room-name { font-size: 14px; font-weight: 500; }
    .add-room-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: 2px dashed #475569; border-radius: 12px; background: transparent; color: #94a3b8; font-size: 14px; cursor: pointer; transition: all 0.2s; }
    .add-room-btn:hover { border-color: #4361ee; color: #4361ee; }
    .tool-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .tool-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; border: 1px solid #334155; border-radius: 12px; background: #0f172a; color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .tool-btn:hover { border-color: #4361ee; }
    .tool-btn.active { background: #4361ee; border-color: #4361ee; color: white; }
    .tool-btn ha-icon { --mdc-icon-size: 24px; }
    .instructions { background: rgba(67, 97, 238, 0.1); border: 1px solid rgba(67, 97, 238, 0.3); border-radius: 12px; padding: 12px; }
    .instructions-title { font-size: 13px; font-weight: 600; color: #4361ee; margin-bottom: 6px; }
    .instructions-text { font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .canvas-area { position: relative; background: #0a0f1a; overflow: hidden; }
    .canvas-header { position: absolute; top: 0; left: 0; right: 0; padding: 16px 20px; background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, transparent 100%); z-index: 10; }
    .room-label { font-size: 14px; color: #94a3b8; }
    .room-label span { color: #e2e8f0; font-weight: 600; }
    svg { width: 100%; height: 100%; cursor: crosshair; }
    .grid-line { stroke: #1e293b; stroke-width: 1; vector-effect: non-scaling-stroke; }
    .grid-line.axis { stroke: #4361ee; stroke-width: 1; opacity: 0.3; }
    .room-fill { fill: rgba(67, 97, 238, 0.08); }
    .room-outline { fill: none; stroke: #4361ee; stroke-width: 3; vector-effect: non-scaling-stroke; }
    .point-handle { fill: #4361ee; stroke: white; stroke-width: 2; cursor: grab; }
    .preview-line { stroke: #22c55e; stroke-width: 2; stroke-dasharray: 8 4; vector-effect: non-scaling-stroke; }
    .preview-point { fill: #22c55e; stroke: white; stroke-width: 2; }
    .snap-indicator { fill: rgba(34, 197, 94, 0.3); stroke: #22c55e; stroke-width: 1; }
    .empty-state { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; }
    .empty-state ha-icon { --mdc-icon-size: 64px; color: #334155; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; margin: 0 0 8px; color: #e2e8f0; }
    .empty-state p { font-size: 14px; color: #64748b; max-width: 300px; }
    .canvas-controls { position: absolute; bottom: 20px; left: 20px; display: flex; gap: 12px; z-index: 10; }
    .control-group { display: flex; gap: 4px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 12px; padding: 8px; }
    .control-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; border-radius: 8px; background: transparent; color: #94a3b8; cursor: pointer; }
    .control-btn:hover { background: #0f172a; color: #e2e8f0; }
    .control-btn.active { background: #4361ee; color: white; }
    .snap-label { font-size: 11px; color: #94a3b8; padding: 0 8px; display: flex; align-items: center; }
    .cursor-info { position: absolute; bottom: 20px; right: 20px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 12px; padding: 12px 16px; font-size: 12px; color: #94a3b8; z-index: 10; }
    .cursor-info span { color: #e2e8f0; font-weight: 600; font-family: monospace; }
    .save-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; background: #4361ee; border: none; border-radius: 12px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: auto; }
    .save-btn:hover:not(:disabled) { background: #3651d4; }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 28px; min-width: 360px; }
    .dialog h3 { margin: 0 0 20px; font-size: 18px; }
    .dialog input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; }
    .dialog label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .dialog-buttons { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
    .dialog-btn { padding: 10px 20px; border-radius: 10px; font-size: 14px; cursor: pointer; }
    .dialog-btn.cancel { background: transparent; border: 1px solid #475569; color: #94a3b8; }
    .dialog-btn.primary { background: #4361ee; border: none; color: white; }
    .dialog-btn.danger { background: #ef4444; border: none; color: white; }
    .furniture-grid { display: flex; flex-direction: column; gap: 8px; }
    .furniture-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .furniture-item:hover { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .furniture-item.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .furniture-item ha-icon { --mdc-icon-size: 24px; color: #94a3b8; }
    .furniture-item span { font-size: 13px; color: #e2e8f0; }
    .furniture-item small { font-size: 11px; color: #64748b; margin-left: auto; }
    .placed-furniture { margin-top: 16px; }
    .placed-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; margin-bottom: 6px; font-size: 12px; }
    .placed-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .placed-item ha-icon { --mdc-icon-size: 18px; color: #64748b; }
    .placed-item .name { flex: 1; color: #e2e8f0; }
    .placed-item .size { color: #64748b; }
    .placed-item .delete-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; }
    .setting-item { margin-bottom: 16px; }
    .setting-item label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .setting-item input[type="range"] { width: 100%; }
    .info-text { color: #64748b; font-size: 13px; line-height: 1.5; }
    .info-value { color: #e2e8f0; font-weight: 600; }
    .input-row { display: flex; gap: 12px; }
    .input-row > div { flex: 1; }
    @media (max-width: 1200px) { :host { grid-template-columns: 240px 1fr; } .sidebar-right { display: none; } }
    .view-toggle { display: flex; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
    .view-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: transparent; border: none; color: #94a3b8; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .view-toggle-btn:hover { background: rgba(67, 97, 238, 0.1); color: #4361ee; }
    .view-toggle-btn.active { background: linear-gradient(135deg, #4361ee, #3651d4); color: white; }
    .view-toggle-btn ha-icon { --mdc-icon-size: 18px; }
    .canvas3d { width: 100%; height: 100%; display: block; cursor: grab; }
    .canvas3d:active { cursor: grabbing; }
    .camera-controls { position: absolute; top: 60px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
    .camera-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 10px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
    .camera-btn:hover { background: rgba(67, 97, 238, 0.2); border-color: #4361ee; color: #4361ee; }
    .camera-btn ha-icon { --mdc-icon-size: 20px; }
    .view-info { position: absolute; top: 60px; left: 20px; background: rgba(30, 41, 59, 0.95); border: 1px solid #334155; border-radius: 10px; padding: 12px 16px; z-index: 10; }
    .view-info-title { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .view-info-value { font-size: 14px; color: #e2e8f0; font-weight: 600; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._loadRooms();
  }

  private async _loadRooms() {
    try {
      const result = await this.hass.callWS<{ rooms: Room[] }>({ type: 'smarthomeshop/rooms' });
      this.rooms = result.rooms || [];
      if (this.rooms.length > 0 && !this._selectedRoomId) this._selectRoom(this.rooms[0].id);
    } catch (err) { console.error('Failed to load rooms:', err); }
  }

  private _selectRoom(roomId: string) {
    this._selectedRoomId = roomId;
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      this._roomPoints = room.walls?.length > 0 ? room.walls.map(w => ({ x: w.x1, y: w.y1 })) : [];
      // Convert FurnitureInstance to LocalFurnitureItem
      this._furniture = ((room as any).furniture || []).map((f: any) => ({
        id: f.id,
        type: f.typeId || f.type || 'unknown',
        name: f.name || FURNITURE_TYPES.find(t => t.id === (f.typeId || f.type))?.name || 'Meubel',
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height || f.depth || f.width,
        rotation: f.rotationDeg ?? f.rotation ?? 0,
      }));
      this._doors = (room as any).doors || [];
      this._windows = (room as any).windows || [];
      this._autoZoom();
    }
    this._toolMode = 'walls';
    this._pendingStart = null;
    this._previewPoint = null;
    this._selectedFurnitureType = null;
    this._selectedFurnitureIndex = null;
  }

  private _autoZoom() {
    if (this._roomPoints.length < 2) { this._zoom = 1; this._panOffset = { x: 0, y: 0 }; return; }
    const xs = this._roomPoints.map(p => p.x), ys = this._roomPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = maxX - minX, h = maxY - minY;
    // Calculate zoom to fit room with 15% padding
    this._zoom = Math.min(0.85 * 10000 / Math.max(w, h, 2000), 3);
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
    const scale = CANVAS_SIZE / 10000;
    return { x: HALF + (p.x - this._panOffset.x) * scale * this._zoom, y: HALF + (p.y - this._panOffset.y) * scale * this._zoom };
  }

  private _fromCanvas(x: number, y: number): Point {
    const scale = 10000 / CANVAS_SIZE;
    return { x: (x - HALF) * scale / this._zoom + this._panOffset.x, y: (y - HALF) * scale / this._zoom + this._panOffset.y };
  }

  private _snapToGrid(p: Point): Point {
    if (this._snapGrid <= 0) return p;
    return { x: Math.round(p.x / this._snapGrid) * this._snapGrid, y: Math.round(p.y / this._snapGrid) * this._snapGrid };
  }

  private _snapToExisting(p: Point, threshold = 250): Point {
    let best = p, bestDist = threshold;
    for (const pt of this._roomPoints) {
      const d = Math.hypot(pt.x - p.x, pt.y - p.y);
      if (d < bestDist) { best = pt; bestDist = d; }
    }
    return best;
  }

  private _findNearestWall(p: Point): { wallIndex: number; position: number; distance: number } | null {
    if (this._roomPoints.length < 3) return null;
    let nearestWall = -1;
    let nearestDist = Infinity;
    let nearestPos = 0;

    for (let i = 0; i < this._roomPoints.length; i++) {
      const p1 = this._roomPoints[i];
      const p2 = this._roomPoints[(i + 1) % this._roomPoints.length];

      // Vector from p1 to p2
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const wallLength = Math.hypot(dx, dy);
      if (wallLength === 0) continue;

      // Project point onto wall line
      const t = Math.max(0.05, Math.min(0.95, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (wallLength * wallLength)));
      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const dist = Math.hypot(p.x - projX, p.y - projY);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestWall = i;
        nearestPos = t; // Position along wall (0-1)
      }
    }

    // Return the nearest wall regardless of distance (user clicked, they want to place something)
    return nearestWall >= 0 ? { wallIndex: nearestWall, position: nearestPos, distance: nearestDist } : null;
  }

  private _getSvgPoint(e: MouseEvent): Point | null {
    if (!this._svg) return null;

    // Use SVG's native coordinate transformation for accurate positioning
    const pt = this._svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    // Get the inverse of the SVG's transformation matrix
    const ctm = this._svg.getScreenCTM();
    if (!ctm) return null;

    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  private _handleCanvasClick(e: MouseEvent) {
    if (e.button !== 0) return;

    // Furniture placement mode
    if (this._toolMode === 'furniture' && this._selectedFurnitureType) {
      const svgPt = this._getSvgPoint(e);
      if (svgPt) {
        const worldPt = this._fromCanvas(svgPt.x, svgPt.y);
        const snappedPt = this._snapToGrid(worldPt);
        this._furnitureWidth = this._selectedFurnitureType.defaultWidth;
        this._furnitureHeight = this._selectedFurnitureType.defaultHeight;
        this._pendingStart = snappedPt;
        this._showFurnitureDialog = true;
      }
      return;
    }

    // Door/window placement is handled via preview click, not canvas click
    if (this._toolMode === 'door' || this._toolMode === 'window') {
      return;
    }

    // Wall drawing mode
    if (this._toolMode !== 'walls') return;
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);
    const snappedPt = this._snapToExisting(this._snapToGrid(worldPt));

    // If room is already closed (3+ points), don't add points on regular canvas click
    // Points are only added via the wall hover preview click
    if (this._roomPoints.length >= 3) {
      return;
    }

    if (!this._pendingStart) { this._pendingStart = snappedPt; return; }

    const first = this._roomPoints[0];
    if (first && this._roomPoints.length >= 2 && Math.hypot(snappedPt.x - first.x, snappedPt.y - first.y) < 250) {
      this._pendingStart = null; this._previewPoint = null; return;
    }

    if (this._roomPoints.length === 0) {
      this._roomPoints = [this._pendingStart, snappedPt];
    } else {
      this._roomPoints = [...this._roomPoints, snappedPt];
    }
    this._pendingStart = snappedPt;
  }

  private _addPointOnWall(wallIndex: number, position: number, startDragging = false) {
    if (wallIndex >= this._roomPoints.length) return;
    const p1 = this._roomPoints[wallIndex];
    const p2 = this._roomPoints[(wallIndex + 1) % this._roomPoints.length];

    // Calculate new point position
    const newPoint: Point = {
      x: p1.x + (p2.x - p1.x) * position,
      y: p1.y + (p2.y - p1.y) * position,
    };

    // Snap to grid
    const snappedPoint = this._snapToGrid(newPoint);

    // Insert new point after wallIndex
    const newPoints = [...this._roomPoints];
    newPoints.splice(wallIndex + 1, 0, snappedPoint);
    this._roomPoints = newPoints;

    // Optionally start dragging the new point
    if (startDragging) {
      this._draggingPointIndex = wallIndex + 1;
    }

    // Clear the hover preview
    this._wallHoverPreview = null;
  }

  private _handleCanvasMove(e: MouseEvent) {
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);
    this._cursorPos = worldPt;

    // Dragging furniture
    if (this._draggingFurnitureIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      this._furniture = this._furniture.map((f, i) =>
        i === this._draggingFurnitureIndex ? { ...f, x: snappedPt.x, y: snappedPt.y } : f
      );
      return;
    }

    // Dragging wall point
    if (this._draggingPointIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      this._roomPoints = this._roomPoints.map((p, i) =>
        i === this._draggingPointIndex ? snappedPt : p
      );
      return;
    }

    // Dragging door along its wall
    if (this._draggingDoorIndex !== null) {
      const door = this._doors[this._draggingDoorIndex];
      if (door && door.wallIndex < this._roomPoints.length) {
        const p1 = this._roomPoints[door.wallIndex];
        const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const wallLength = Math.hypot(dx, dy);
        if (wallLength > 0) {
          const t = Math.max(0.05, Math.min(0.95, ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / (wallLength * wallLength)));
          this._doors = this._doors.map((d, i) => i === this._draggingDoorIndex ? { ...d, position: t } : d);
        }
      }
      return;
    }

    // Dragging window along its wall
    if (this._draggingWindowIndex !== null) {
      const win = this._windows[this._draggingWindowIndex];
      if (win && win.wallIndex < this._roomPoints.length) {
        const p1 = this._roomPoints[win.wallIndex];
        const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const wallLength = Math.hypot(dx, dy);
        if (wallLength > 0) {
          const t = Math.max(0.05, Math.min(0.95, ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / (wallLength * wallLength)));
          this._windows = this._windows.map((w, i) => i === this._draggingWindowIndex ? { ...w, position: t } : w);
        }
      }
      return;
    }

    // Panning the canvas
    if (this._isDragging) {
      const dx = (e.movementX / this._svg.clientWidth) * (10000 / this._zoom);
      const dy = (e.movementY / this._svg.clientHeight) * (10000 / this._zoom);
      this._panOffset = { x: this._panOffset.x - dx, y: this._panOffset.y - dy };
      return;
    }

    if (this._toolMode === 'walls' && this._pendingStart) {
      this._previewPoint = this._snapToExisting(this._snapToGrid(worldPt));
    }

    // Show wall hover preview at 50% (midpoint) when room is closed and in walls/select mode
    if ((this._toolMode === 'walls' || this._toolMode === 'select') && this._roomPoints.length >= 3) {
      const wallInfo = this._findNearestWall(worldPt);
      if (wallInfo && wallInfo.distance < 400) { // Only show if close to wall
        const p1 = this._roomPoints[wallInfo.wallIndex];
        const p2 = this._roomPoints[(wallInfo.wallIndex + 1) % this._roomPoints.length];
        // Always show at 50% (midpoint) of the wall
        const midPosition = 0.5;
        const previewPoint = {
          x: p1.x + (p2.x - p1.x) * midPosition,
          y: p1.y + (p2.y - p1.y) * midPosition,
        };
        this._wallHoverPreview = { wallIndex: wallInfo.wallIndex, position: midPosition, point: previewPoint };
      } else {
        this._wallHoverPreview = null;
      }
    } else {
      this._wallHoverPreview = null;
    }

    // Show door/window preview when in door/window mode (but not when hovering over existing door/window)
    if ((this._toolMode === 'door' || this._toolMode === 'window') && this._roomPoints.length >= 3) {
      // Check if hovering over an existing door or window
      const hoveringExisting = this._isHoveringDoorOrWindow(worldPt);

      if (!hoveringExisting) {
        const wallInfo = this._findNearestWall(worldPt);
        if (wallInfo) {
          const p1 = this._roomPoints[wallInfo.wallIndex];
          const p2 = this._roomPoints[(wallInfo.wallIndex + 1) % this._roomPoints.length];
          const previewPoint = {
            x: p1.x + (p2.x - p1.x) * wallInfo.position,
            y: p1.y + (p2.y - p1.y) * wallInfo.position,
          };
          this._doorWindowPreview = {
            wallIndex: wallInfo.wallIndex,
            position: wallInfo.position,
            point: previewPoint,
            type: this._toolMode as 'door' | 'window'
          };
        } else {
          this._doorWindowPreview = null;
        }
      } else {
        this._doorWindowPreview = null;
      }
    } else {
      this._doorWindowPreview = null;
    }
  }

  private _isHoveringDoorOrWindow(worldPt: Point): boolean {
    const threshold = 300; // mm - distance to consider "hovering over"

    // Check doors
    for (const door of this._doors) {
      if (door.wallIndex >= this._roomPoints.length) continue;
      const p1 = this._roomPoints[door.wallIndex];
      const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];
      const doorX = p1.x + (p2.x - p1.x) * door.position;
      const doorY = p1.y + (p2.y - p1.y) * door.position;
      const dist = Math.hypot(worldPt.x - doorX, worldPt.y - doorY);
      if (dist < threshold) return true;
    }

    // Check windows
    for (const win of this._windows) {
      if (win.wallIndex >= this._roomPoints.length) continue;
      const p1 = this._roomPoints[win.wallIndex];
      const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];
      const winX = p1.x + (p2.x - p1.x) * win.position;
      const winY = p1.y + (p2.y - p1.y) * win.position;
      const dist = Math.hypot(worldPt.x - winX, worldPt.y - winY);
      if (dist < threshold) return true;
    }

    return false;
  }

  private _handleCanvasDown(e: MouseEvent) { if (e.button === 1 || e.button === 2) { e.preventDefault(); this._isDragging = true; } }
  private _handleCanvasUp() { this._isDragging = false; this._draggingFurnitureIndex = null; this._draggingPointIndex = null; this._draggingDoorIndex = null; this._draggingWindowIndex = null; }

  private _startFurnitureDrag(e: MouseEvent, index: number) {
    e.stopPropagation();
    e.preventDefault();
    this._selectedFurnitureIndex = index;
    // Only allow dragging in furniture mode or select mode
    if (this._toolMode === 'furniture' || this._toolMode === 'select') {
      this._draggingFurnitureIndex = index;
    }
  }
  private _handleWheel(e: WheelEvent) { e.preventDefault(); this._zoom = Math.min(5, Math.max(0.2, this._zoom + (e.deltaY > 0 ? -0.1 : 0.1))); }
  private _setToolMode(mode: ToolMode) { this._toolMode = mode; this._pendingStart = null; this._previewPoint = null; this._selectedFurnitureType = null; this._selectedFurnitureIndex = null; }
  private _undoLastPoint() { if (this._roomPoints.length > 0) { this._roomPoints = this._roomPoints.slice(0, -1); this._pendingStart = this._roomPoints.length > 0 ? this._roomPoints[this._roomPoints.length - 1] : null; } }
  private _clearRoom() { this._roomPoints = []; this._pendingStart = null; this._previewPoint = null; }
  private _showAddRoomDialog() { this._newRoomName = ''; this._newRoomWidth = 0; this._newRoomLength = 0; this._showNewRoomDialog = true; }
  private _hideAddRoomDialog() { this._showNewRoomDialog = false; }

  private _selectFurnitureType(type: FurnitureType) {
    this._selectedFurnitureType = type;
    this._selectedFurnitureIndex = null;
  }

  private _placeFurniture() {
    if (!this._selectedFurnitureType || !this._pendingStart) return;

    const newFurniture: LocalFurnitureItem = {
      id: `furniture_${Date.now()}`,
      type: this._selectedFurnitureType.id,
      name: this._selectedFurnitureType.name,
      x: this._pendingStart.x,
      y: this._pendingStart.y,
      width: this._furnitureWidth,
      height: this._furnitureHeight,
      rotation: 0,
    };

    this._furniture = [...this._furniture, newFurniture];
    this._showFurnitureDialog = false;
    this._pendingStart = null;
  }

  private _deleteFurniture(index: number) {
    this._furniture = this._furniture.filter((_, i) => i !== index);
    this._selectedFurnitureIndex = null;
  }

  private _addDoor() {
    if (this._selectedWallIndex === null || !this._pendingStart) return;
    const newDoor: DoorItem = {
      id: 'door_' + Date.now(),
      wallIndex: this._selectedWallIndex,
      position: this._pendingStart.x, // Position along wall (0-1)
      width: this._doorWidth,
      openDirection: this._doorOpenDirection,
      openSide: this._doorOpenSide,
    };
    this._doors = [...this._doors, newDoor];
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
    this._editingDoorIndex = null;
    this._showDoorDialog = false;
  }

  private _addWindow() {
    if (this._selectedWallIndex === null || !this._pendingStart) return;
    const newWindow: WindowItem = {
      id: 'window_' + Date.now(),
      wallIndex: this._selectedWallIndex,
      position: this._pendingStart.x,
      width: this._windowWidth,
      height: this._windowHeight,
      windowType: this._windowType,
    };
    this._windows = [...this._windows, newWindow];
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
    this._editingWindowIndex = null;
    this._showWindowDialog = false;
  }

  private async _createNewRoom() {
    if (!this._newRoomName.trim()) return;

    // Create walls if dimensions are provided
    let walls: Array<{x1: number; y1: number; x2: number; y2: number}> = [];
    if (this._newRoomWidth > 0 && this._newRoomLength > 0) {
      // Convert cm to mm and create rectangle centered at origin
      const w = this._newRoomWidth * 10;
      const l = this._newRoomLength * 10;
      const halfW = w / 2;
      const halfL = l / 2;
      // Create 4 walls for rectangle
      walls = [
        { x1: -halfW, y1: -halfL, x2: halfW, y2: -halfL },  // Top
        { x1: halfW, y1: -halfL, x2: halfW, y2: halfL },    // Right
        { x1: halfW, y1: halfL, x2: -halfW, y2: halfL },    // Bottom
        { x1: -halfW, y1: halfL, x2: -halfW, y2: -halfL },  // Left
      ];
    }

    const newRoom: Room = { id: 'room_' + Date.now(), name: this._newRoomName.trim(), walls, furniture: [], devices: [], zones: [] };
    try {
      await this.hass.callWS({ type: 'smarthomeshop/room/save', room: newRoom });
      this.rooms = [...this.rooms, newRoom];
      this._selectRoom(newRoom.id);
      this._hideAddRoomDialog();
    } catch (err) { console.error('Failed to create room:', err); }
  }

  private async _saveRoom() {
    if (!this._selectedRoomId) return;
    this._saving = true;
    const room = this.rooms.find(r => r.id === this._selectedRoomId);
    if (!room) return;
    const walls = this._roomPoints.map((p, i) => {
      const next = this._roomPoints[(i + 1) % this._roomPoints.length];
      return { x1: p.x, y1: p.y, x2: next.x, y2: next.y };
    });
    // Convert LocalFurnitureItem to FurnitureInstance format for storage
    const furniture = this._furniture.map(f => ({
      id: f.id,
      typeId: f.type,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      rotationDeg: f.rotation,
    }));
    try {
      const updatedRoom = { ...room, walls, furniture, doors: this._doors, windows: this._windows };
      await this.hass.callWS({ type: 'smarthomeshop/room/save', room: updatedRoom });
      this.rooms = this.rooms.map(r => r.id === this._selectedRoomId ? updatedRoom as any : r);
    } catch (err) { console.error('Failed to save room:', err); }
    finally { this._saving = false; }
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

  private _getInstructions(): { title: string; text: string } {
    switch (this._toolMode) {
      case 'walls':
        return { title: 'Muren Tekenen', text: this._roomPoints.length >= 3
          ? 'Hover muur → groen punt. Klik = toevoegen. Sleep = verplaatsen. Rechtsklik = verwijderen.'
          : this._pendingStart
            ? 'Klik om hoeken toe te voegen. Klik bij eerste punt om te sluiten.'
            : 'Klik om de eerste hoek te zetten.' };
      case 'select':
        return { title: 'Selecteer & Verplaats', text: 'Sleep meubels, sensor of muurpunten om te verplaatsen.' };
      case 'furniture':
        return { title: 'Meubels Plaatsen', text: this._selectedFurnitureType ? `Klik op de kaart om ${this._selectedFurnitureType.name} te plaatsen.` : 'Selecteer een meubel rechts, of sleep bestaande meubels.' };
      case 'door':
        return { title: 'Deur Toevoegen', text: 'Beweeg over muur → paarse preview. Klik om te plaatsen. Sleep bestaande deuren om te verplaatsen.' };
      case 'window':
        return { title: 'Raam Toevoegen', text: 'Beweeg over muur → blauwe preview. Klik om te plaatsen. Sleep bestaande ramen om te verplaatsen.' };
      default:
        return { title: 'Selecteer Gereedschap', text: 'Kies een tool links.' };
    }
  }

  private _renderGrid() {
    const lines = [];
    for (let mm = -10000; mm <= 10000; mm += 500) {
      const cp1 = this._toCanvas({ x: mm, y: -10000 }), cp2 = this._toCanvas({ x: mm, y: 10000 });
      const cp3 = this._toCanvas({ x: -10000, y: mm }), cp4 = this._toCanvas({ x: 10000, y: mm });
      const isAxis = mm === 0;
      lines.push(svg`<line class="grid-line ${isAxis ? 'axis' : ''}" x1="${cp1.x}" y1="${cp1.y}" x2="${cp2.x}" y2="${cp2.y}"/>`);
      lines.push(svg`<line class="grid-line ${isAxis ? 'axis' : ''}" x1="${cp3.x}" y1="${cp3.y}" x2="${cp4.x}" y2="${cp4.y}"/>`);
    }
    return lines;
  }

  private _renderRoom() {
    if (this._roomPoints.length < 2) return nothing;
    const pathData = this._roomPoints.map((p, i) => { const cp = this._toCanvas(p); return (i === 0 ? 'M' : 'L') + ' ' + cp.x + ' ' + cp.y; }).join(' ') + (this._roomPoints.length >= 3 ? ' Z' : '');

    // Calculate wall lengths and render labels
    const wallLabels = this._roomPoints.map((p, i) => {
      const next = this._roomPoints[(i + 1) % this._roomPoints.length];
      // Don't render last segment if not closed (less than 3 points)
      if (this._roomPoints.length < 3 && i === this._roomPoints.length - 1) return nothing;

      // Calculate length in meters
      const lengthMm = Math.hypot(next.x - p.x, next.y - p.y);
      const lengthM = (lengthMm / 1000).toFixed(2);

      // Calculate midpoint in canvas coordinates
      const cp1 = this._toCanvas(p);
      const cp2 = this._toCanvas(next);
      const midX = (cp1.x + cp2.x) / 2;
      const midY = (cp1.y + cp2.y) / 2;

      // Calculate angle for text rotation
      const angle = Math.atan2(cp2.y - cp1.y, cp2.x - cp1.x) * 180 / Math.PI;
      // Flip text if upside down
      const adjustedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;

      // Offset perpendicular to wall for better visibility
      const perpAngle = (angle + 90) * Math.PI / 180;
      const offsetX = Math.cos(perpAngle) * 15;
      const offsetY = Math.sin(perpAngle) * 15;

      return svg`
        <text
          x="${midX + offsetX}"
          y="${midY + offsetY}"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(${adjustedAngle}, ${midX + offsetX}, ${midY + offsetY})"
          fill="#4361ee"
          font-size="12"
          font-weight="600"
          style="text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);"
        >${lengthM}m</text>
      `;
    });

    return svg`<path class="room-fill" d="${pathData}"/><path class="room-outline" d="${pathData}"/>${wallLabels}`;
  }

  private _renderPoints() {
    const canDrag = this._toolMode === 'walls' || this._toolMode === 'select';
    const canDelete = this._roomPoints.length > 3; // Need at least 3 points for a room

    return this._roomPoints.map((p, index) => {
      const cp = this._toCanvas(p);
      const isDragging = index === this._draggingPointIndex;
      return svg`
        <circle
          class="point-handle"
          cx="${cp.x}" cy="${cp.y}" r="8"
          fill="${isDragging ? '#22c55e' : '#4361ee'}"
          stroke="${isDragging ? '#16a34a' : 'white'}"
          stroke-width="2"
          style="cursor: ${isDragging ? 'grabbing' : canDrag ? 'grab' : 'default'}"
          @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._draggingPointIndex = index; } }}"
          @contextmenu="${(e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (canDelete && canDrag) {
              this._deletePoint(index);
            }
          }}"
        />
      `;
    });
  }

  private _deletePoint(index: number) {
    if (this._roomPoints.length <= 3) return; // Keep at least 3 points
    this._roomPoints = this._roomPoints.filter((_, i) => i !== index);
    this._draggingPointIndex = null;
  }

  private _renderWallHoverPreview() {
    if (!this._wallHoverPreview) return nothing;
    const cp = this._toCanvas(this._wallHoverPreview.point);

    return svg`
      <g style="cursor: pointer;"
         @mousedown="${(e: MouseEvent) => {
           e.stopPropagation();
           e.preventDefault();
           this._addPointOnWall(this._wallHoverPreview!.wallIndex, this._wallHoverPreview!.position, true);
         }}">
        <circle cx="${cp.x}" cy="${cp.y}" r="12" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2" stroke-dasharray="4 2"/>
        <circle cx="${cp.x}" cy="${cp.y}" r="4" fill="#22c55e"/>
      </g>
    `;
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
    const color = isDoor ? '#8b5cf6' : '#0ea5e9';
    const bgColor = isDoor ? 'rgba(139, 92, 246, 0.3)' : 'rgba(14, 165, 233, 0.3)';

    const x1 = cp.x - Math.cos(wallAngle) * previewWidth/2;
    const y1 = cp.y - Math.sin(wallAngle) * previewWidth/2;
    const x2 = cp.x + Math.cos(wallAngle) * previewWidth/2;
    const y2 = cp.y + Math.sin(wallAngle) * previewWidth/2;

    return svg`
      <g style="cursor: pointer;"
         @mousedown="${(e: MouseEvent) => {
           e.stopPropagation();
           e.preventDefault();
           this._selectedWallIndex = preview.wallIndex;
           this._pendingStart = { x: preview.position, y: 0 };
           if (isDoor) {
             this._showDoorDialog = true;
           } else {
             this._showWindowDialog = true;
           }
         }}">
        <!-- Preview line -->
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
              stroke="${color}" stroke-width="6" stroke-dasharray="8 4" opacity="0.8"/>
        <!-- Center handle -->
        <circle cx="${cp.x}" cy="${cp.y}" r="10" fill="${bgColor}" stroke="${color}" stroke-width="2"/>
        <text x="${cp.x}" y="${cp.y + 4}" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">
          ${isDoor ? '🚪' : '🪟'}
        </text>
      </g>
    `;
  }

  private _renderPreview() {
    if (!this._pendingStart || !this._previewPoint || this._toolMode !== 'walls') return nothing;
    const startCp = this._toCanvas(this._pendingStart), endCp = this._toCanvas(this._previewPoint);
    const first = this._roomPoints[0];
    const isCloseToFirst = first && this._roomPoints.length >= 2 && Math.hypot(this._previewPoint.x - first.x, this._previewPoint.y - first.y) < 250;
    const firstCp = first ? this._toCanvas(first) : null;
    return svg`
      ${isCloseToFirst && firstCp ? svg`<circle class="snap-indicator" cx="${firstCp.x}" cy="${firstCp.y}" r="20"/>` : nothing}
      <line class="preview-line" x1="${startCp.x}" y1="${startCp.y}" x2="${endCp.x}" y2="${endCp.y}"/>
      <circle class="preview-point" cx="${endCp.x}" cy="${endCp.y}" r="6"/>
    `;
  }

  private _renderFurniture() {
    const canDrag = this._toolMode === 'furniture' || this._toolMode === 'select';

    return this._furniture.map((f, index) => {
      const cp = this._toCanvas({ x: f.x, y: f.y });
      const scale = CANVAS_SIZE / 10000 * this._zoom;
      const w = f.width * scale;
      const h = f.height * scale;
      const isSelected = index === this._selectedFurnitureIndex;
      const isDragging = index === this._draggingFurnitureIndex;

      return svg`
        <g @mousedown="${(e: MouseEvent) => this._startFurnitureDrag(e, index)}"
           style="cursor: ${isDragging ? 'grabbing' : canDrag ? 'grab' : 'default'};">
          <rect
            x="${cp.x - w/2}" y="${cp.y - h/2}"
            width="${w}" height="${h}"
            fill="${isDragging ? 'rgba(34, 197, 94, 0.3)' : isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.2)'}"
            stroke="${isDragging ? '#22c55e' : isSelected ? '#3b82f6' : '#64748b'}"
            stroke-width="${isDragging ? 3 : 2}"
            rx="4"
          />
          <text x="${cp.x}" y="${cp.y + 4}" text-anchor="middle" fill="${isDragging ? '#22c55e' : isSelected ? '#3b82f6' : '#94a3b8'}" font-size="11" font-weight="500">
            ${f.name}
          </text>
        </g>
      `;
    });
  }

  private _renderDoorsAndWindows() {
    const elements: any[] = [];
    const canDrag = this._toolMode === 'door' || this._toolMode === 'window' || this._toolMode === 'select';

    // Render doors
    this._doors.forEach((door, index) => {
      if (door.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[door.wallIndex];
      const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];

      // Calculate position on wall
      const doorX = p1.x + (p2.x - p1.x) * door.position;
      const doorY = p1.y + (p2.y - p1.y) * door.position;
      const cp = this._toCanvas({ x: doorX, y: doorY });

      // Wall angle
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const perpAngle = wallAngle + (door.openDirection === 'inward' ? Math.PI / 2 : -Math.PI / 2);
      const scale = CANVAS_SIZE / 10000 * this._zoom;
      const doorWidthPx = door.width * scale;
      const isDragging = index === this._draggingDoorIndex;
      const doorColor = isDragging ? '#22c55e' : '#8b5cf6';

      elements.push(svg`
        <g style="cursor: ${isDragging ? 'grabbing' : canDrag ? 'grab' : 'default'};"
           @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._draggingDoorIndex = index; } }}">
          <!-- Hit area for easier clicking -->
          <circle cx="${cp.x}" cy="${cp.y}" r="15" fill="transparent"/>
          <!-- Door opening (gap in wall) -->
          <line
            x1="${cp.x - Math.cos(wallAngle) * doorWidthPx/2}"
            y1="${cp.y - Math.sin(wallAngle) * doorWidthPx/2}"
            x2="${cp.x + Math.cos(wallAngle) * doorWidthPx/2}"
            y2="${cp.y + Math.sin(wallAngle) * doorWidthPx/2}"
            stroke="#0f172a" stroke-width="6"
          />
          <!-- Door panel -->
          <line
            x1="${cp.x}" y1="${cp.y}"
            x2="${cp.x + Math.cos(perpAngle) * doorWidthPx * 0.9}"
            y2="${cp.y + Math.sin(perpAngle) * doorWidthPx * 0.9}"
            stroke="${doorColor}" stroke-width="3"
          />
          <!-- Swing indicator arc -->
          <path
            d="M ${cp.x + Math.cos(perpAngle) * doorWidthPx * 0.9} ${cp.y + Math.sin(perpAngle) * doorWidthPx * 0.9} A ${doorWidthPx * 0.9} ${doorWidthPx * 0.9} 0 0 ${door.openSide === 'left' ? 1 : 0} ${cp.x + Math.cos(wallAngle + (door.openSide === 'left' ? -1 : 1) * Math.PI/2) * doorWidthPx * 0.9} ${cp.y + Math.sin(wallAngle + (door.openSide === 'left' ? -1 : 1) * Math.PI/2) * doorWidthPx * 0.9}"
            fill="none" stroke="${doorColor}" stroke-width="1" stroke-dasharray="4 2" opacity="0.5"
          />
          <!-- Center handle -->
          <circle cx="${cp.x}" cy="${cp.y}" r="6" fill="${doorColor}" stroke="white" stroke-width="2"/>
        </g>
      `);
    });

    // Render windows
    this._windows.forEach((win, index) => {
      if (win.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[win.wallIndex];
      const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];

      const winX = p1.x + (p2.x - p1.x) * win.position;
      const winY = p1.y + (p2.y - p1.y) * win.position;
      const cp = this._toCanvas({ x: winX, y: winY });

      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const scale = CANVAS_SIZE / 10000 * this._zoom;
      const winWidthPx = win.width * scale;
      const isDragging = index === this._draggingWindowIndex;
      const winColor = isDragging ? '#22c55e' : '#0ea5e9';
      const glassColor = isDragging ? '#4ade80' : '#38bdf8';

      const x1 = cp.x - Math.cos(wallAngle) * winWidthPx/2;
      const y1 = cp.y - Math.sin(wallAngle) * winWidthPx/2;
      const x2 = cp.x + Math.cos(wallAngle) * winWidthPx/2;
      const y2 = cp.y + Math.sin(wallAngle) * winWidthPx/2;

      elements.push(svg`
        <g style="cursor: ${isDragging ? 'grabbing' : canDrag ? 'grab' : 'default'};"
           @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._draggingWindowIndex = index; } }}">
          <!-- Hit area for easier clicking -->
          <circle cx="${cp.x}" cy="${cp.y}" r="15" fill="transparent"/>
          <!-- Window frame -->
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${winColor}" stroke-width="6"/>
          <!-- Glass -->
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${glassColor}" stroke-width="3"/>
          ${win.windowType !== 'fixed' ? svg`
            <!-- Open indicator -->
            <line x1="${(x1+x2)/2}" y1="${(y1+y2)/2}"
                  x2="${(x1+x2)/2 + Math.cos(wallAngle + Math.PI/2) * 15}"
                  y2="${(y1+y2)/2 + Math.sin(wallAngle + Math.PI/2) * 15}"
                  stroke="${glassColor}" stroke-width="2"/>
          ` : ''}
          <!-- Center handle -->
          <circle cx="${cp.x}" cy="${cp.y}" r="6" fill="${winColor}" stroke="white" stroke-width="2"/>
        </g>
      `);
    });

    return elements;
  }

  // ===== 3D RENDERING METHODS =====

  private _project3D(p: Point3D): Point {
    const cam = this._camera3d;
    const azRad = (cam.azimuth * Math.PI) / 180;
    const elRad = (cam.elevation * Math.PI) / 180;

    // Translate point relative to camera target
    const dx = p.x - cam.targetX;
    const dy = p.y - cam.targetY;
    const dz = p.z - cam.targetZ;

    // Rotate around vertical axis (azimuth)
    const x1 = dx * Math.cos(azRad) - dy * Math.sin(azRad);
    const y1 = dx * Math.sin(azRad) + dy * Math.cos(azRad);
    const z1 = dz;

    // Rotate around horizontal axis (elevation)
    const y2 = y1 * Math.cos(elRad) - z1 * Math.sin(elRad);
    const z2 = y1 * Math.sin(elRad) + z1 * Math.cos(elRad);

    // Perspective projection
    const fov = 60;
    const scale = (1 / Math.tan((fov * Math.PI) / 360)) * 400;
    const depth = cam.distance + y2;
    const factor = depth > 50 ? scale / depth : scale / 50;

    // Mirror X-axis to match 2D view orientation
    return {
      x: 400 - x1 * factor,
      y: 300 - z2 * factor,
    };
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

    // Draw grid on floor
    this._draw3DGrid(ctx);

    // Draw room walls
    if (this._roomPoints.length >= 3) {
      this._draw3DRoom(ctx);
    }

    // Draw furniture
    this._draw3DFurniture(ctx);
  }

  private _draw3DGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
    ctx.lineWidth = 1;

    const gridSize = 1000; // 1 meter grid
    const gridRange = 5000; // 5 meters in each direction

    for (let i = -gridRange; i <= gridRange; i += gridSize) {
      // Lines along X
      const p1 = this._project3D({ x: i, y: -gridRange, z: 0 });
      const p2 = this._project3D({ x: i, y: gridRange, z: 0 });
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Lines along Y
      const p3 = this._project3D({ x: -gridRange, y: i, z: 0 });
      const p4 = this._project3D({ x: gridRange, y: i, z: 0 });
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }

    // Draw axes
    const origin = this._project3D({ x: 0, y: 0, z: 0 });

    // X axis (red)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    const xEnd = this._project3D({ x: 2000, y: 0, z: 0 });
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(xEnd.x, xEnd.y);
    ctx.stroke();

    // Y axis (green)
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    const yEnd = this._project3D({ x: 0, y: 2000, z: 0 });
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(yEnd.x, yEnd.y);
    ctx.stroke();

    // Z axis (blue)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    const zEnd = this._project3D({ x: 0, y: 0, z: 2000 });
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(zEnd.x, zEnd.y);
    ctx.stroke();
  }

  private _draw3DRoom(ctx: CanvasRenderingContext2D): void {
    const pts = this._roomPoints;
    if (pts.length < 3) return;

    // Draw floor
    ctx.fillStyle = 'rgba(67, 97, 238, 0.1)';
    ctx.strokeStyle = 'rgba(67, 97, 238, 0.5)';
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

    // Sort walls by distance for proper depth rendering
    const wallsWithDepth = pts.map((p, i) => {
      const next = pts[(i + 1) % pts.length];
      const midX = (p.x + next.x) / 2;
      const midY = (p.y + next.y) / 2;
      const cam = this._camera3d;
      const dist = Math.hypot(midX - cam.targetX, midY - cam.targetY);
      return { index: i, dist };
    }).sort((a, b) => b.dist - a.dist);

    // Draw walls back to front
    for (const { index } of wallsWithDepth) {
      this._draw3DWall(ctx, index);
    }
  }

  private _draw3DWall(ctx: CanvasRenderingContext2D, wallIndex: number): void {
    const pts = this._roomPoints;
    const p1 = pts[wallIndex];
    const p2 = pts[(wallIndex + 1) % pts.length];

    // Wall corners (bottom and top)
    const bl = this._project3D({ x: p1.x, y: p1.y, z: 0 });
    const br = this._project3D({ x: p2.x, y: p2.y, z: 0 });
    const tr = this._project3D({ x: p2.x, y: p2.y, z: WALL_HEIGHT_3D });
    const tl = this._project3D({ x: p1.x, y: p1.y, z: WALL_HEIGHT_3D });

    // Calculate wall normal for shading
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const normalAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const lightDir = (this._camera3d.azimuth * Math.PI) / 180;
    const shade = 0.3 + 0.4 * Math.abs(Math.cos(normalAngle - lightDir));

    // Wall gradient
    const wallGrad = ctx.createLinearGradient(
      (bl.x + br.x) / 2, Math.max(bl.y, br.y),
      (tl.x + tr.x) / 2, Math.min(tl.y, tr.y)
    );
    wallGrad.addColorStop(0, `rgba(67, 97, 238, ${shade * 0.4})`);
    wallGrad.addColorStop(1, `rgba(67, 97, 238, ${shade * 0.2})`);

    // Draw wall
    ctx.fillStyle = wallGrad;
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw doors on this wall
    for (const door of this._doors) {
      if (door.wallIndex === wallIndex) {
        this._draw3DDoor(ctx, door, p1, p2);
      }
    }

    // Draw windows on this wall
    for (const win of this._windows) {
      if (win.wallIndex === wallIndex) {
        this._draw3DWindow(ctx, win, p1, p2);
      }
    }

    // Draw wall length label
    const wallLength = Math.hypot(p2.x - p1.x, p2.y - p1.y) / 1000;
    const midTop = this._project3D({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      z: WALL_HEIGHT_3D + 200
    });

    ctx.fillStyle = '#4361ee';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${wallLength.toFixed(2)}m`, midTop.x, midTop.y);
  }

  private _draw3DDoor(ctx: CanvasRenderingContext2D, door: DoorItem, p1: Point, p2: Point): void {
    const doorHeight = 2100; // Standard door height in mm
    const halfWidth = door.width / 2;

    // Calculate door position on wall
    const doorX = p1.x + (p2.x - p1.x) * door.position;
    const doorY = p1.y + (p2.y - p1.y) * door.position;

    // Wall direction
    const wallDx = p2.x - p1.x;
    const wallDy = p2.y - p1.y;
    const wallLen = Math.hypot(wallDx, wallDy);
    const wx = wallDx / wallLen;
    const wy = wallDy / wallLen;

    // Door corners
    const dl = this._project3D({ x: doorX - wx * halfWidth, y: doorY - wy * halfWidth, z: 0 });
    const dr = this._project3D({ x: doorX + wx * halfWidth, y: doorY + wy * halfWidth, z: 0 });
    const dtr = this._project3D({ x: doorX + wx * halfWidth, y: doorY + wy * halfWidth, z: doorHeight });
    const dtl = this._project3D({ x: doorX - wx * halfWidth, y: doorY - wy * halfWidth, z: doorHeight });

    // Draw door opening (darker)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.moveTo(dl.x, dl.y);
    ctx.lineTo(dr.x, dr.y);
    ctx.lineTo(dtr.x, dtr.y);
    ctx.lineTo(dtl.x, dtl.y);
    ctx.closePath();
    ctx.fill();

    // Door frame
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Door handle
    const handleZ = doorHeight * 0.45;
    const handle = this._project3D({ x: doorX + wx * halfWidth * 0.7, y: doorY + wy * halfWidth * 0.7, z: handleZ });
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private _draw3DWindow(ctx: CanvasRenderingContext2D, win: WindowItem, p1: Point, p2: Point): void {
    const windowBottom = 900; // Window sill height
    const halfWidth = win.width / 2;

    // Calculate window position on wall
    const winX = p1.x + (p2.x - p1.x) * win.position;
    const winY = p1.y + (p2.y - p1.y) * win.position;

    // Wall direction
    const wallDx = p2.x - p1.x;
    const wallDy = p2.y - p1.y;
    const wallLen = Math.hypot(wallDx, wallDy);
    const wx = wallDx / wallLen;
    const wy = wallDy / wallLen;

    // Window corners
    const wbl = this._project3D({ x: winX - wx * halfWidth, y: winY - wy * halfWidth, z: windowBottom });
    const wbr = this._project3D({ x: winX + wx * halfWidth, y: winY + wy * halfWidth, z: windowBottom });
    const wtr = this._project3D({ x: winX + wx * halfWidth, y: winY + wy * halfWidth, z: windowBottom + win.height });
    const wtl = this._project3D({ x: winX - wx * halfWidth, y: winY - wy * halfWidth, z: windowBottom + win.height });

    // Draw window glass
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(wbl.x, wbl.y);
    ctx.lineTo(wbr.x, wbr.y);
    ctx.lineTo(wtr.x, wtr.y);
    ctx.lineTo(wtl.x, wtl.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Window cross bars
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 1;
    const midH = this._project3D({ x: winX, y: winY, z: windowBottom + win.height / 2 });
    const midL = this._project3D({ x: winX - wx * halfWidth, y: winY - wy * halfWidth, z: windowBottom + win.height / 2 });
    const midR = this._project3D({ x: winX + wx * halfWidth, y: winY + wy * halfWidth, z: windowBottom + win.height / 2 });
    const midB = this._project3D({ x: winX, y: winY, z: windowBottom });
    const midT = this._project3D({ x: winX, y: winY, z: windowBottom + win.height });

    ctx.beginPath();
    ctx.moveTo(midL.x, midL.y);
    ctx.lineTo(midR.x, midR.y);
    ctx.moveTo(midB.x, midB.y);
    ctx.lineTo(midT.x, midT.y);
    ctx.stroke();
  }

  private _draw3DFurniture(ctx: CanvasRenderingContext2D): void {
    for (const f of this._furniture) {
      const hw = f.width / 2;
      const hh = f.height / 2;
      const furnitureHeight = 400; // Default 40cm height

      // Bottom corners
      const corners3D: Point3D[] = [
        { x: f.x - hw, y: f.y - hh, z: 0 },
        { x: f.x + hw, y: f.y - hh, z: 0 },
        { x: f.x + hw, y: f.y + hh, z: 0 },
        { x: f.x - hw, y: f.y + hh, z: 0 },
      ];

      // Top corners
      const topCorners3D: Point3D[] = corners3D.map(c => ({ ...c, z: furnitureHeight }));

      // Project all corners
      const bottom = corners3D.map(c => this._project3D(c));
      const top = topCorners3D.map(c => this._project3D(c));

      // Draw top face
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
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
        ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
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
    // Center camera on room
    if (this._roomPoints.length >= 3) {
      const xs = this._roomPoints.map(p => p.x);
      const ys = this._roomPoints.map(p => p.y);
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));

      this._camera3d = {
        azimuth: 45,
        elevation: 35,
        distance: Math.max(4000, size * 1.5),
        targetX: centerX,
        targetY: centerY,
        targetZ: WALL_HEIGHT_3D / 2,
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

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (this._viewMode === '3d' && this._canvas3d) {
      this._render3DScene();
    }
  }

  private _renderRightSidebar() {
    if (this._toolMode === 'furniture') {
      return html`
        <div class="section-title">MEUBELS</div>
        <p class="info-text" style="margin-bottom: 12px;">Selecteer een meubel en klik op de kaart om te plaatsen.</p>
        <div class="furniture-grid">
          ${FURNITURE_TYPES.map(type => html`
            <div class="furniture-item ${this._selectedFurnitureType?.id === type.id ? 'selected' : ''}" @click="${() => this._selectFurnitureType(type)}">
              <ha-icon icon="${type.icon}"></ha-icon>
              <span>${type.name}</span>
              <small>${type.defaultWidth/10}×${type.defaultHeight/10}cm</small>
            </div>
          `)}
        </div>

        ${this._furniture.length > 0 ? html`
          <div class="placed-furniture">
            <div class="section-title">GEPLAATSTE MEUBELS</div>
            ${this._furniture.map((f, i) => html`
              <div class="placed-item ${this._selectedFurnitureIndex === i ? 'selected' : ''}" @click="${() => this._selectedFurnitureIndex = i}">
                <ha-icon icon="${FURNITURE_TYPES.find(t => t.id === f.type)?.icon || 'mdi:square'}"></ha-icon>
                <span class="name">${f.name}</span>
                <span class="size">${f.width/10}×${f.height/10}</span>
                <button class="delete-btn" @click="${(e: Event) => { e.stopPropagation(); this._deleteFurniture(i); }}">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        ` : ''}
      `;
    }

    if (this._toolMode === 'door') {
      return html`
        <div class="section-title">DEUREN</div>
        <p class="info-text" style="margin-bottom: 12px;">Klik op een muur om een deur toe te voegen.</p>

        ${this._doors.length > 0 ? html`
          <div class="placed-furniture">
            <div class="section-title">GEPLAATSTE DEUREN</div>
            ${this._doors.map((d, i) => html`
              <div class="placed-item">
                <ha-icon icon="mdi:door"></ha-icon>
                <span class="name">Deur ${i + 1}</span>
                <span class="size">${d.width / 10}cm</span>
                <button class="delete-btn" @click="${() => this._editDoor(i)}" title="Bewerken">
                  <ha-icon icon="mdi:pencil"></ha-icon>
                </button>
                <button class="delete-btn" @click="${() => this._deleteDoor(i)}" title="Verwijderen">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        ` : html`<p class="info-text" style="color: #64748b;">Nog geen deuren toegevoegd.</p>`}
      `;
    }

    if (this._toolMode === 'window') {
      return html`
        <div class="section-title">RAMEN</div>
        <p class="info-text" style="margin-bottom: 12px;">Klik op een muur om een raam toe te voegen.</p>

        ${this._windows.length > 0 ? html`
          <div class="placed-furniture">
            <div class="section-title">GEPLAATSTE RAMEN</div>
            ${this._windows.map((w, i) => html`
              <div class="placed-item">
                <ha-icon icon="mdi:window-closed-variant"></ha-icon>
                <span class="name">${w.windowType === 'fixed' ? 'Vast' : w.windowType === 'tilt' ? 'Kantel' : 'Draai'}</span>
                <span class="size">${w.width / 10}×${w.height / 10}cm</span>
                <button class="delete-btn" @click="${() => this._editWindow(i)}" title="Bewerken">
                  <ha-icon icon="mdi:pencil"></ha-icon>
                </button>
                <button class="delete-btn" @click="${() => this._deleteWindow(i)}" title="Verwijderen">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        ` : html`<p class="info-text" style="color: #64748b;">Nog geen ramen toegevoegd.</p>`}
      `;
    }

    const area = this._calculateArea();
    return html`
      <div class="section-title">KAMER INFO</div>
      <div class="info-text">
        ${this._roomPoints.length >= 3 ? html`
          <p>Oppervlakte: <span class="info-value">${area.toFixed(1)} m²</span></p>
          <p>Hoekpunten: <span class="info-value">${this._roomPoints.length}</span></p>
          <p>Meubels: <span class="info-value">${this._furniture.length}</span></p>
        ` : html`<p>Teken muren om metingen te zien.</p>`}
      </div>
    `;
  }

  render() {
    const selectedRoom = this.rooms.find(r => r.id === this._selectedRoomId);
    const instr = this._getInstructions();

    return html`
      <div class="sidebar-left">
        <div>
          <div class="section-title">KAMERS</div>
          <div class="room-list">
            ${this.rooms.map(room => html`
              <div class="room-item ${room.id === this._selectedRoomId ? 'selected' : ''}" @click="${() => this._selectRoom(room.id)}">
                <div class="room-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></div>
                <span class="room-name">${room.name}</span>
              </div>
            `)}
            <button class="add-room-btn" @click="${this._showAddRoomDialog}"><ha-icon icon="mdi:plus"></ha-icon>Kamer Toevoegen</button>
          </div>
        </div>
        <div>
          <div class="section-title">GEREEDSCHAPPEN</div>
          <div class="tool-grid">
            <button class="tool-btn ${this._toolMode === 'select' ? 'active' : ''}" @click="${() => this._setToolMode('select')}"><ha-icon icon="mdi:cursor-default"></ha-icon>Selecteer</button>
            <button class="tool-btn ${this._toolMode === 'walls' ? 'active' : ''}" @click="${() => this._setToolMode('walls')}"><ha-icon icon="mdi:wall"></ha-icon>Muren</button>
            <button class="tool-btn ${this._toolMode === 'door' ? 'active' : ''}" @click="${() => this._setToolMode('door')}"><ha-icon icon="mdi:door"></ha-icon>Deur</button>
            <button class="tool-btn ${this._toolMode === 'window' ? 'active' : ''}" @click="${() => this._setToolMode('window')}"><ha-icon icon="mdi:window-closed-variant"></ha-icon>Raam</button>
            <button class="tool-btn ${this._toolMode === 'furniture' ? 'active' : ''}" @click="${() => this._setToolMode('furniture')}"><ha-icon icon="mdi:sofa"></ha-icon>Meubels</button>
          </div>
        </div>
        <div class="instructions">
          <div class="instructions-title">${instr.title}</div>
          <div class="instructions-text">${instr.text}</div>
        </div>
      </div>

      <div class="canvas-area">
        <div class="canvas-header" style="display: flex; justify-content: space-between; align-items: center;">
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
        </div>
        ${!selectedRoom ? html`
          <div class="empty-state"><ha-icon icon="mdi:floor-plan"></ha-icon><h3>Kamer Builder</h3><p>Selecteer een kamer om te beginnen</p></div>
        ` : this._viewMode === '2d' ? html`
          <svg viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" @click="${this._handleCanvasClick}" @mousemove="${this._handleCanvasMove}" @mousedown="${this._handleCanvasDown}" @mouseup="${this._handleCanvasUp}" @mouseleave="${this._handleCanvasUp}" @wheel="${this._handleWheel}" @contextmenu="${(e: Event) => e.preventDefault()}">
            ${this._renderGrid()}${this._renderRoom()}${this._renderDoorsAndWindows()}${this._renderFurniture()}${this._renderPreview()}${this._renderPoints()}${this._renderWallHoverPreview()}${this._renderDoorWindowPreview()}
          </svg>
          <div class="canvas-controls">
            <div class="control-group">
              <button class="control-btn" @click="${() => this._zoom = Math.min(5, this._zoom + 0.2)}"><ha-icon icon="mdi:plus"></ha-icon></button>
              <button class="control-btn" @click="${() => this._zoom = Math.max(0.2, this._zoom - 0.2)}"><ha-icon icon="mdi:minus"></ha-icon></button>
              <button class="control-btn" @click="${this._autoZoom}"><ha-icon icon="mdi:fit-to-screen"></ha-icon></button>
            </div>
            <div class="control-group"><span class="snap-label">Snap:</span>
              <button class="control-btn ${this._snapGrid === 0 ? 'active' : ''}" @click="${() => this._snapGrid = 0}" style="width:auto;padding:0 10px;font-size:11px">Uit</button>
              <button class="control-btn ${this._snapGrid === 50 ? 'active' : ''}" @click="${() => this._snapGrid = 50}" style="width:auto;padding:0 10px;font-size:11px">5cm</button>
              <button class="control-btn ${this._snapGrid === 100 ? 'active' : ''}" @click="${() => this._snapGrid = 100}" style="width:auto;padding:0 10px;font-size:11px">10cm</button>
              <button class="control-btn ${this._snapGrid === 200 ? 'active' : ''}" @click="${() => this._snapGrid = 200}" style="width:auto;padding:0 10px;font-size:11px">20cm</button>
            </div>
            ${this._toolMode === 'walls' ? html`<div class="control-group"><button class="control-btn" @click="${this._undoLastPoint}"><ha-icon icon="mdi:undo"></ha-icon></button><button class="control-btn" @click="${this._clearRoom}"><ha-icon icon="mdi:delete"></ha-icon></button></div>` : ''}
          </div>
          ${this._cursorPos ? html`<div class="cursor-info">X: <span>${(this._cursorPos.x / 1000).toFixed(2)}m</span> Y: <span>${(this._cursorPos.y / 1000).toFixed(2)}m</span>${this._roomPoints.length > 0 ? html` | Pts: <span>${this._roomPoints.length}</span>` : ''}</div>` : ''}
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
          <div class="view-info">
            <div class="view-info-title">3D Weergave</div>
            <div class="view-info-value">${this._roomPoints.length >= 3 ? 'Sleep om te roteren' : 'Teken eerst muren in 2D'}</div>
          </div>
          <div class="camera-controls">
            <button class="camera-btn" @click="${this._reset3DCamera}" title="Reset camera">
              <ha-icon icon="mdi:camera-flip"></ha-icon>
            </button>
            <button class="camera-btn" @click="${() => { this._camera3d = { ...this._camera3d, elevation: 90 }; this._render3DScene(); }}" title="Bovenaanzicht">
              <ha-icon icon="mdi:arrow-down-circle"></ha-icon>
            </button>
            <button class="camera-btn" @click="${() => { this._camera3d = { ...this._camera3d, elevation: 15 }; this._render3DScene(); }}" title="Ooghoogte">
              <ha-icon icon="mdi:eye"></ha-icon>
            </button>
          </div>
        `}
      </div>

      <div class="sidebar-right">
        ${this._renderRightSidebar()}
        <button class="save-btn" @click="${this._saveRoom}" ?disabled="${!this._selectedRoomId || this._saving}"><ha-icon icon="mdi:content-save"></ha-icon>${this._saving ? 'Opslaan...' : 'Kamer Opslaan'}</button>
      </div>

      ${this._showNewRoomDialog ? html`
        <div class="dialog-overlay" @click="${this._hideAddRoomDialog}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>Nieuwe Kamer</h3>
            <div style="display: grid; gap: 16px;">
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Kamer naam *</label>
                <input type="text" placeholder="Bijv. Woonkamer" .value="${this._newRoomName}" @input="${(e: Event) => this._newRoomName = (e.target as HTMLInputElement).value}" @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this._createNewRoom()}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;" autofocus/>
              </div>
              <div style="border-top: 1px solid #334155; padding-top: 16px;">
                <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Optioneel: afmetingen voor rechthoekige kamer (laat leeg om zelf te tekenen)</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <div>
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Breedte (cm)</label>
                    <input type="number" placeholder="bijv. 400" .value="${this._newRoomWidth || ''}" @input="${(e: Event) => this._newRoomWidth = parseInt((e.target as HTMLInputElement).value) || 0}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Lengte (cm)</label>
                    <input type="number" placeholder="bijv. 500" .value="${this._newRoomLength || ''}" @input="${(e: Event) => this._newRoomLength = parseInt((e.target as HTMLInputElement).value) || 0}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
                  </div>
                </div>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideAddRoomDialog}">Annuleren</button>
              <button class="dialog-btn primary" @click="${this._createNewRoom}">${this._newRoomWidth > 0 && this._newRoomLength > 0 ? 'Aanmaken met afmetingen' : 'Aanmaken (zelf tekenen)'}</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showFurnitureDialog && this._selectedFurnitureType ? html`
        <div class="dialog-overlay" @click="${() => this._showFurnitureDialog = false}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>${this._selectedFurnitureType.name} Plaatsen</h3>
            <p class="info-text" style="margin-bottom: 16px;">Geef de afmetingen op (bovenaanzicht)</p>
            <div class="input-row">
              <div>
                <label>Breedte (cm)</label>
                <input type="number" min="10" max="500" .value="${this._furnitureWidth / 10}" @input="${(e: Event) => this._furnitureWidth = parseInt((e.target as HTMLInputElement).value) * 10 || 100}"/>
              </div>
              <div>
                <label>Diepte (cm)</label>
                <input type="number" min="10" max="500" .value="${this._furnitureHeight / 10}" @input="${(e: Event) => this._furnitureHeight = parseInt((e.target as HTMLInputElement).value) * 10 || 100}"/>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${() => this._showFurnitureDialog = false}">Annuleren</button>
              <button class="dialog-btn primary" @click="${this._placeFurniture}">Plaatsen</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showDoorDialog ? html`
        <div class="dialog-overlay" @click="${this._hideDoorDialog}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>${this._editingDoorIndex !== null ? 'Deur Bewerken' : 'Deur Toevoegen'}</h3>
            <p class="info-text" style="margin-bottom: 16px;">Configureer de deur eigenschappen</p>
            <div style="display: grid; gap: 16px;">
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Breedte (cm)</label>
                <input type="number" .value="${this._doorWidth / 10}" @input="${(e: Event) => this._doorWidth = parseInt((e.target as HTMLInputElement).value) * 10}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
              </div>
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Open richting</label>
                <select .value="${this._doorOpenDirection}" @change="${(e: Event) => this._doorOpenDirection = (e.target as HTMLSelectElement).value as 'inward' | 'outward'}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;">
                  <option value="inward">Naar binnen</option>
                  <option value="outward">Naar buiten</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Scharnier zijde</label>
                <select .value="${this._doorOpenSide}" @change="${(e: Event) => this._doorOpenSide = (e.target as HTMLSelectElement).value as 'left' | 'right'}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;">
                  <option value="left">Links</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideDoorDialog}">Annuleren</button>
              <button class="dialog-btn primary" @click="${this._editingDoorIndex !== null ? this._saveDoorEdit : this._addDoor}">${this._editingDoorIndex !== null ? 'Opslaan' : 'Toevoegen'}</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showWindowDialog ? html`
        <div class="dialog-overlay" @click="${this._hideWindowDialog}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>${this._editingWindowIndex !== null ? 'Raam Bewerken' : 'Raam Toevoegen'}</h3>
            <p class="info-text" style="margin-bottom: 16px;">Configureer de raam eigenschappen</p>
            <div style="display: grid; gap: 16px;">
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Breedte (cm)</label>
                <input type="number" .value="${this._windowWidth / 10}" @input="${(e: Event) => this._windowWidth = parseInt((e.target as HTMLInputElement).value) * 10}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
              </div>
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Hoogte (cm)</label>
                <input type="number" .value="${this._windowHeight / 10}" @input="${(e: Event) => this._windowHeight = parseInt((e.target as HTMLInputElement).value) * 10}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;"/>
              </div>
              <div>
                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #94a3b8;">Raam type</label>
                <select .value="${this._windowType}" @change="${(e: Event) => this._windowType = (e.target as HTMLSelectElement).value as 'fixed' | 'open' | 'tilt'}" style="width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;">
                  <option value="fixed">Vast raam</option>
                  <option value="open">Draai raam</option>
                  <option value="tilt">Kantel raam</option>
                </select>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideWindowDialog}">Annuleren</button>
              <button class="dialog-btn primary" @click="${this._editingWindowIndex !== null ? this._saveWindowEdit : this._addWindow}">${this._editingWindowIndex !== null ? 'Opslaan' : 'Toevoegen'}</button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'shs-room-builder-page': RoomBuilderPage; } }
