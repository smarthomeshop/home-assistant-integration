import { LitElement, css, html, nothing, PropertyValues, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  HomeAssistant,
  HousePlacement,
  Point,
  RadarDeviceProfilePayload,
  Room,
} from '../types';
import { panelText } from '../utils/panel-translations';
import { WholeHome3DRenderer, type Home3DRoom } from '../utils/home3d';
import {
  autoArrangeRooms,
  collectWholeHomePresence,
  houseLayoutFingerprint,
  normaliseHousePlacement,
  overlappingRoomIds,
  roomInteriorPoint,
  roomPolygon,
  roomsWithHousePlacement,
  restoreHouseSnapshot,
  snapHousePlacement,
  transformHomePoint,
  type WholeHomePresence,
  type WholeHomeRoom,
} from '../utils/whole-home';

interface RoomsResponse { rooms: Room[] }
interface ProfilesResponse { devices: RadarDeviceProfilePayload[] }

@customElement('shs-home-presence-page')
export class HomePresencePage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _rooms: WholeHomeRoom[] = [];
  @state() private _profiles: RadarDeviceProfilePayload[] = [];
  @state() private _loading = true;
  @state() private _error = '';
  @state() private _view: '3d' | 'arrange' = '3d';
  @state() private _selectedFloor: number | null = null;
  @state() private _selectedRoomId: string | null = null;
  @state() private _dirty = false;
  @state() private _hasUnsavedSuggestion = false;
  @state() private _saving = false;
  @state() private _showRoomNames = true;
  @state() private _showEmptyRooms = true;
  @state() private _floorSeparation = 1;
  @state() private _guideX: number | null = null;
  @state() private _guideY: number | null = null;
  @state() private _savedNotice = false;
  @state() private _reloadRequired = false;
  @state() private _nudgeStep: 50 | 250 = 250;
  @state() private _presence: WholeHomePresence = {
    people: [], rooms: [], linkedSensors: 0, liveSensors: 0, unavailableSensors: 0,
  };
  @state() private _moveAnnouncement = '';

  private readonly _renderer = new WholeHome3DRenderer();
  private _redrawTimer?: number;
  private _resizeObserver?: ResizeObserver;
  private _observedCanvas?: HTMLCanvasElement;
  private _drawFrame?: number;
  private _savedNoticeTimer?: number;
  private _draggingCamera = false;
  private _lastPointer = { x: 0, y: 0 };
  private _dragRoom: {
    roomId: string;
    pointerId: number;
    startPoint: Point;
    house: HousePlacement;
    viewBox: { minX: number; minY: number; width: number; height: number };
    historyRecorded: boolean;
  } | null = null;
  private _configuredPlacementIds = new Set<string>();
  private _savedLayoutFingerprint = '';
  private _undoStack: WholeHomeRoom[][] = [];
  private _redoStack: WholeHomeRoom[][] = [];

  public get isDirty(): boolean { return !!this.hass?.user?.is_admin && this._dirty; }

  static styles = css`
    :host {
      display: block;
      max-width: 1500px;
      margin: 0 auto;
      --shs-primary: #4361ee;
      --shs-live: #10b981;
      --shs-warn: #f59e0b;
      --shs-live-text: color-mix(in srgb, var(--shs-live) 65%, var(--primary-text-color));
    }
    * { box-sizing: border-box; }
    button, select, input { font: inherit; }
    button:focus-visible, select:focus-visible, input:focus-visible {
      outline: 2px solid var(--shs-primary);
      outline-offset: 2px;
    }
    .page-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 18px;
    }
    .eyebrow {
      margin: 0 0 5px;
      color: var(--shs-primary);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    h1 { margin: 0; color: var(--primary-text-color); font-size: clamp(24px, 3vw, 32px); line-height: 1.08; }
    .subtitle { margin: 7px 0 0; color: var(--secondary-text-color); font-size: 14px; }
    .head-metrics { display: flex; align-items: center; gap: 18px; }
    .head-metric { min-width: 74px; }
    .head-metric strong { display: block; color: var(--primary-text-color); font-size: 22px; line-height: 1; }
    .head-metric span { color: var(--secondary-text-color); font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    .live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 999px; background: var(--shs-live); margin-right: 6px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--shs-live) 16%, transparent); }
    .live-dot.degraded { background: var(--shs-warn); box-shadow: 0 0 0 4px color-mix(in srgb, var(--shs-warn) 16%, transparent); }
    .live-dot.offline { background: var(--error-color, #b91c1c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--error-color, #b91c1c) 14%, transparent); }

    .shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 290px;
      min-height: 680px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      border-radius: var(--ha-card-border-radius, 14px);
      overflow: hidden;
    }
    .stage { min-width: 0; display: flex; flex-direction: column; background: var(--secondary-background-color); }
    .stage-toolbar {
      min-height: 58px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: var(--card-background-color);
      border-bottom: 1px solid var(--divider-color);
    }
    .history-actions { display: inline-flex; gap: 4px; }
    .icon-button:disabled { opacity: .38; cursor: not-allowed; }
    .segmented { display: inline-flex; gap: 3px; padding: 3px; background: var(--secondary-background-color); border-radius: 10px; }
    .segmented button, .icon-button, .quiet-button, .primary-button {
      min-height: 36px;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
    }
    .segmented button { padding: 0 12px; color: var(--secondary-text-color); background: transparent; }
    .segmented button.active { color: var(--shs-primary); background: var(--card-background-color); font-weight: 700; box-shadow: 0 1px 2px rgba(15, 23, 42, .1); }
    .segmented ha-icon { --mdc-icon-size: 17px; vertical-align: -4px; margin-right: 5px; }
    .toolbar-spacer { flex: 1; }
    .floor-select { min-height: 36px; max-width: 180px; border: 1px solid var(--divider-color); border-radius: 8px; padding: 0 30px 0 10px; color: var(--primary-text-color); background: var(--card-background-color); }
    .icon-button { width: 36px; display: grid; place-items: center; border: 1px solid var(--divider-color); color: var(--secondary-text-color); background: var(--card-background-color); }
    .icon-button:hover { color: var(--primary-text-color); }
    .icon-button ha-icon { --mdc-icon-size: 18px; }
    .scene-wrap { position: relative; flex: 1; min-height: 560px; overflow: hidden; }
    canvas { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
    canvas.dragging { cursor: grabbing; }
    .scene-help {
      position: absolute;
      left: 14px;
      bottom: 14px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 10px;
      border-radius: 8px;
      color: rgba(255, 255, 255, .82);
      background: rgba(15, 23, 42, .68);
      font-size: 12px;
      pointer-events: none;
    }
    .scene-help ha-icon { --mdc-icon-size: 16px; }
    .legend {
      position: absolute;
      top: 14px;
      left: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      pointer-events: none;
    }
    .legend-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border-radius: 8px; color: #dbeafe; background: rgba(15, 23, 42, .72); font-size: 11px; }
    .legend-mark { width: 8px; height: 8px; border-radius: 999px; background: var(--shs-live); }
    .legend-mark.approx { background: var(--shs-warn); }

    .arrange-wrap { flex: 1; min-height: 560px; position: relative; overflow: hidden; background: var(--secondary-background-color); }
    .arrange-wrap svg { display: block; width: 100%; height: 100%; touch-action: none; user-select: none; }
    .room-shape { cursor: grab; touch-action: none; transition: filter 150ms ease, opacity 150ms ease; }
    .room-shape:hover { filter: brightness(1.04); }
    .room-shape.selected { filter: drop-shadow(0 0 8px color-mix(in srgb, var(--shs-primary) 45%, transparent)); }
    .room-shape:focus-visible polygon { stroke: var(--shs-primary); stroke-width: 65; }
    .room-shape.dragging { cursor: grabbing; }
    .room-shape.hidden { opacity: .42; }
    .room-row.hidden { opacity: .62; }
    .room-shape.overlap polygon { stroke: var(--error-color, #ef4444); stroke-dasharray: 130 85; }
    .snap-guide { pointer-events: none; stroke: var(--shs-primary); stroke-width: 18; stroke-dasharray: 90 65; opacity: .8; }
    .arrange-tip { position: absolute; left: 14px; bottom: 14px; padding: 8px 10px; border: 1px solid var(--divider-color); border-radius: 8px; color: var(--secondary-text-color); background: var(--card-background-color); font-size: 12px; }

    aside { border-left: 1px solid var(--divider-color); background: var(--card-background-color); padding: 18px; overflow: auto; }
    .side-section + .side-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--divider-color); }
    .side-title { margin: 0 0 10px; color: var(--primary-text-color); font-size: 13px; font-weight: 750; }
    .setup-progress { display: flex; align-items: center; gap: 12px; }
    .progress-ring { --value: 0; width: 48px; height: 48px; border-radius: 999px; display: grid; place-items: center; background: conic-gradient(var(--shs-primary) calc(var(--value) * 1%), var(--divider-color) 0); position: relative; }
    .progress-ring::after { content: ''; position: absolute; inset: 5px; border-radius: inherit; background: var(--card-background-color); }
    .progress-ring strong { position: relative; z-index: 1; color: var(--primary-text-color); font-size: 11px; }
    .setup-copy strong { display: block; color: var(--primary-text-color); font-size: 13px; }
    .setup-copy span { display: block; margin-top: 3px; color: var(--secondary-text-color); font-size: 12px; line-height: 1.35; }
    .setup-steps { display: grid; gap: 8px; margin-top: 14px; }
    .setup-step { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 9px; min-height: 38px; }
    .setup-step-icon { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 999px; color: var(--secondary-text-color); background: var(--secondary-background-color); }
    .setup-step-icon.done { color: var(--shs-live-text); background: color-mix(in srgb, var(--shs-live) 14%, transparent); }
    .setup-step-icon ha-icon { --mdc-icon-size: 15px; }
    .setup-step strong { display: block; color: var(--primary-text-color); font-size: 12px; }
    .setup-step small { display: block; margin-top: 2px; color: var(--secondary-text-color); font-size: 10px; line-height: 1.35; }
    .step-action { min-height: 30px; padding: 0 9px; border: 1px solid var(--divider-color); border-radius: 7px; color: var(--shs-primary); background: transparent; font-size: 11px; cursor: pointer; }
    .setup-complete { margin-top: 12px; padding: 9px 10px; border-radius: 8px; color: var(--shs-live-text); background: color-mix(in srgb, var(--shs-live) 11%, transparent); font-size: 11px; line-height: 1.4; }
    .room-list { display: grid; gap: 6px; }
    .room-row { width: 100%; display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 9px; padding: 9px 7px; border: 0; border-radius: 8px; text-align: left; color: var(--primary-text-color); background: transparent; cursor: pointer; }
    .room-row:hover, .room-row.active { background: var(--secondary-background-color); }
    .room-presence { width: 8px; height: 8px; border-radius: 999px; background: var(--divider-color); }
    .room-presence.live { background: var(--shs-live); box-shadow: 0 0 0 3px color-mix(in srgb, var(--shs-live) 15%, transparent); }
    .room-presence.offline { background: var(--error-color, #b91c1c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--error-color, #b91c1c) 12%, transparent); }
    .room-presence.degraded { background: var(--shs-warn); box-shadow: 0 0 0 3px color-mix(in srgb, var(--shs-warn) 14%, transparent); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    .room-row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 650; }
    .room-row-meta { color: var(--secondary-text-color); font-size: 11px; }
    .room-count { color: var(--shs-live-text); font-size: 12px; font-weight: 750; }
    .control-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
    .control-grid label { display: grid; gap: 5px; color: var(--secondary-text-color); font-size: 11px; }
    .control-grid select { min-height: 38px; border: 1px solid var(--divider-color); border-radius: 8px; padding: 0 8px; color: var(--primary-text-color); background: var(--secondary-background-color); }
    .control-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .quiet-button, .primary-button { padding: 0 12px; border: 1px solid var(--divider-color); color: var(--primary-text-color); background: var(--secondary-background-color); }
    .primary-button { border-color: var(--shs-primary); color: white; background: var(--shs-primary); font-weight: 700; }
    .primary-button:disabled, .quiet-button:disabled { opacity: .5; cursor: not-allowed; }
    .toggle-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 11px; color: var(--primary-text-color); font-size: 12px; }
    .save-strip { display: grid; gap: 8px; margin-top: 14px; }
    .error { margin-top: 12px; padding: 9px 10px; border-left: 3px solid var(--error-color, #b91c1c); border-radius: 8px; color: var(--primary-text-color); background: color-mix(in srgb, var(--error-color, #ef4444) 10%, transparent); font-size: 12px; }
    .warning { margin-top: 12px; padding: 9px 10px; border-left: 3px solid var(--error-color, #b91c1c); border-radius: 8px; color: var(--primary-text-color); background: color-mix(in srgb, var(--error-color, #ef4444) 9%, transparent); font-size: 11px; line-height: 1.4; }
    .success { margin-top: 12px; padding: 9px 10px; border-radius: 8px; color: var(--shs-live-text); background: color-mix(in srgb, var(--shs-live) 11%, transparent); font-size: 11px; }
    .nudge-controls { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; margin-top: 12px; }
    .nudge-controls > span { color: var(--secondary-text-color); font-size: 11px; }
    .nudge-controls select { min-height: 34px; border: 1px solid var(--divider-color); border-radius: 8px; color: var(--primary-text-color); background: var(--secondary-background-color); }
    .nudge-grid { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .nudge-grid button { min-height: 38px; border: 1px solid var(--divider-color); border-radius: 8px; color: var(--primary-text-color); background: var(--secondary-background-color); cursor: pointer; }
    .range-line { display: grid; gap: 6px; margin-top: 12px; color: var(--secondary-text-color); font-size: 11px; }
    .range-head { display: flex; justify-content: space-between; gap: 12px; }
    .range-line input { width: 100%; accent-color: var(--shs-primary); }
    .room-detail { display: grid; gap: 8px; }
    .room-detail-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--secondary-text-color); font-size: 11px; }
    .room-detail-line strong { color: var(--primary-text-color); font-size: 12px; }
    .empty { min-height: 440px; display: grid; place-items: center; padding: 28px; text-align: center; }
    .empty-inner { max-width: 430px; }
    .empty ha-icon { --mdc-icon-size: 44px; color: var(--shs-primary); }
    .empty h2 { margin: 13px 0 7px; color: var(--primary-text-color); font-size: 20px; }
    .empty p { margin: 0 0 18px; color: var(--secondary-text-color); font-size: 14px; line-height: 1.5; }

    @media (max-width: 980px) {
      .shell { grid-template-columns: 1fr; min-height: 0; }
      aside { border-left: 0; border-top: 1px solid var(--divider-color); }
      .scene-wrap, .arrange-wrap { min-height: 520px; }
      .room-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .page-head { align-items: flex-start; flex-direction: column; }
      .head-metrics { width: 100%; justify-content: space-between; }
      .stage-toolbar { flex-wrap: wrap; }
      .toolbar-spacer { display: none; }
      .floor-select { flex: 1; max-width: none; }
      .scene-wrap, .arrange-wrap { min-height: 430px; }
      .room-list { grid-template-columns: 1fr; }
      aside { padding: 16px; }
      .history-actions { order: 4; }
      canvas { touch-action: pan-y; }
      .arrange-wrap svg { touch-action: pan-y; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver(() => this._queue3D());
    void this._load();
    this._redrawTimer = window.setInterval(() => {
      const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this._view === '3d' && this._presence.people.length > 0 && !reducedMotion) this._draw3D();
    }, 250);
    window.addEventListener('keydown', this._onHistoryKeydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._redrawTimer) window.clearInterval(this._redrawTimer);
    if (this._savedNoticeTimer) window.clearTimeout(this._savedNoticeTimer);
    if (this._drawFrame) window.cancelAnimationFrame(this._drawFrame);
    this._resizeObserver?.disconnect();
    this._observedCanvas = undefined;
    window.removeEventListener('keydown', this._onHistoryKeydown);
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('hass') || changed.has('_rooms') || changed.has('_profiles') || changed.has('_selectedFloor')) {
      this._refreshPresence();
    }
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('canvas') || undefined;
    if (canvas && canvas !== this._observedCanvas) {
      if (this._observedCanvas) this._resizeObserver?.unobserve(this._observedCanvas);
      this._observedCanvas = canvas;
      this._resizeObserver?.observe(canvas);
    }
    if (this._view === '3d') this._queue3D();
  }

  private _queue3D(): void {
    if (this._view !== '3d') return;
    if (this._drawFrame) window.cancelAnimationFrame(this._drawFrame);
    this._drawFrame = window.requestAnimationFrame(() => {
      this._drawFrame = undefined;
      this._draw3D();
    });
  }

  private async _load(): Promise<void> {
    this._loading = true;
    this._error = '';
    try {
      const [roomResponse, profileResponse] = await Promise.all([
        this.hass.callWS<RoomsResponse>({ type: 'smarthomeshop/rooms' }),
        this.hass.callWS<ProfilesResponse>({ type: 'smarthomeshop/radar/profiles' }),
      ]);
      const sourceRooms = Array.isArray(roomResponse.rooms) ? roomResponse.rooms : [];
      this._configuredPlacementIds = new Set(sourceRooms.filter(room => Boolean(room.house)).map(room => room.id));
      this._rooms = roomsWithHousePlacement(sourceRooms);
      if (this._selectedFloor !== null && !this._rooms.some(room => room.house.floor === this._selectedFloor)) {
        this._selectedFloor = null;
      }
      this._savedLayoutFingerprint = this._layoutFingerprint(this._rooms);
      this._profiles = Array.isArray(profileResponse.devices) ? profileResponse.devices : [];
      this._undoStack = [];
      this._redoStack = [];
      this._selectedRoomId = this._rooms[0]?.id || null;
      this._renderer.resetCamera(this._home3dRooms(), this._floorSeparation);
      this._refreshPresence();
      this._refreshDirty();
    } catch (error) {
      console.error('Could not load whole-home presence:', error);
      this._error = panelText(this.hass, 'Could not load the live home. Check the integration and try again.');
    } finally {
      this._loading = false;
    }
  }

  private _refreshPresence(): void {
    if (!this.hass) return;
    this._presence = collectWholeHomePresence(
      this._rooms,
      this._profiles,
      entityId => this.hass.states[entityId]?.state,
    );
  }

  private _home3dRooms(): Home3DRoom[] {
    return this._rooms.map(room => {
      const state = this._presence.rooms.find(item => item.roomId === room.id);
      return {
        id: room.id,
        name: room.name,
        points: roomPolygon(room),
        house: room.house,
        people: state?.people || 0,
        occupied: state?.occupied || false,
        approximate: state?.approximate || false,
        available: state?.available || false,
        linked: (state?.sensorCount || 0) > 0,
        degraded: Boolean(state?.available && state.unavailableSensorCount > 0),
      };
    });
  }

  private _draw3D(): void {
    if (this._view !== '3d') return;
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    this._renderer.render(canvas, {
      rooms: this._home3dRooms(),
      people: this._presence.people,
      selectedFloor: this._selectedFloor,
      darkMode: !!this.hass?.themes?.darkMode,
      showRoomNames: this._showRoomNames,
      showEmptyRooms: this._showEmptyRooms,
      selectedRoomId: this._selectedRoomId,
      floorSeparation: this._floorSeparation,
      presenceLabel: panelText(this.hass, 'Presence'),
      offlineLabel: panelText(this.hass, 'Offline'),
      degradedLabel: panelText(this.hass, 'Partial sensor outage'),
    });
  }

  private _cloneRooms(rooms = this._rooms): WholeHomeRoom[] {
    return rooms.map(room => ({ ...room, house: { ...room.house } }));
  }

  private _layoutFingerprint(rooms = this._rooms): string {
    return houseLayoutFingerprint(rooms);
  }

  private _refreshDirty(): void {
    this._dirty = this._layoutFingerprint() !== this._savedLayoutFingerprint;
    this._hasUnsavedSuggestion = this._rooms.some(room => !this._configuredPlacementIds.has(room.id));
  }

  private _recordHistory(): void {
    if (this._saving) return;
    this._undoStack = [...this._undoStack.slice(-39), this._cloneRooms()];
    this._redoStack = [];
    this.requestUpdate();
  }

  private _restoreRooms(rooms: WholeHomeRoom[]): void {
    this._rooms = restoreHouseSnapshot(this._rooms, rooms);
    this._refreshDirty();
    this._guideX = null;
    this._guideY = null;
    this._refreshPresence();
    this._renderer.resetCamera(this._home3dRooms(), this._floorSeparation);
  }

  private _undo(): void {
    if (this._saving || !this.hass.user?.is_admin) return;
    const previous = this._undoStack[this._undoStack.length - 1];
    if (!previous) return;
    this._redoStack = [...this._redoStack.slice(-39), this._cloneRooms()];
    this._undoStack = this._undoStack.slice(0, -1);
    this._restoreRooms(previous);
  }

  private _redo(): void {
    if (this._saving || !this.hass.user?.is_admin) return;
    const next = this._redoStack[this._redoStack.length - 1];
    if (!next) return;
    this._undoStack = [...this._undoStack.slice(-39), this._cloneRooms()];
    this._redoStack = this._redoStack.slice(0, -1);
    this._restoreRooms(next);
  }

  private readonly _onHistoryKeydown = (event: KeyboardEvent): void => {
    if (this._view !== 'arrange' || this._saving || !(event.ctrlKey || event.metaKey)) return;
    const target = event.composedPath()[0] as HTMLElement | null;
    if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this._undo();
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      this._redo();
    }
  };

  private _openRoomDesigner(): void {
    this.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'zones' }, bubbles: true, composed: true }));
  }

  private _floors(): number[] {
    return [...new Set(this._rooms.map(room => room.house.floor))].sort((a, b) => a - b);
  }

  private _floorText(floor: number): string {
    if (floor === 0) return panelText(this.hass, 'Ground floor');
    if (floor === -1) return panelText(this.hass, 'Basement');
    return panelText(this.hass, floor < 0 ? 'Basement {count}' : 'Floor {count}', { count: Math.abs(floor) });
  }

  private _selectFloor(value: string): void {
    this._selectedFloor = value === 'all' ? null : Number(value);
    if (this._selectedFloor !== null) {
      const room = this._rooms.find(item => item.house.floor === this._selectedFloor);
      if (room) this._selectedRoomId = room.id;
    }
  }

  private _setView(view: '3d' | 'arrange'): void {
    this._view = view;
    if (view === '3d') this._queue3D();
  }

  private _resetCamera(): void {
    this._renderer.resetCamera(this._home3dRooms().filter(room => room.house.visible !== false && (this._selectedFloor === null || room.house.floor === this._selectedFloor)), this._floorSeparation);
    this._draw3D();
  }

  private _onCameraDown(event: PointerEvent): void {
    this._draggingCamera = true;
    this._lastPointer = { x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId);
  }

  private _onCameraMove(event: PointerEvent): void {
    if (!this._draggingCamera) return;
    const dx = event.clientX - this._lastPointer.x;
    const dy = event.clientY - this._lastPointer.y;
    this._lastPointer = { x: event.clientX, y: event.clientY };
    this._renderer.orbit(dx, dy);
    this._draw3D();
  }

  private _onCameraUp(): void { this._draggingCamera = false; this.requestUpdate(); }

  private _onCameraWheel(event: WheelEvent): void {
    event.preventDefault();
    this._renderer.zoomBy(event.deltaY > 0 ? 1.1 : 0.9);
    this._draw3D();
  }

  private _zoomCamera(factor: number): void {
    this._renderer.zoomBy(factor);
    this._draw3D();
  }

  private _onCameraKeydown(event: KeyboardEvent): void {
    if (['+', '='].includes(event.key)) this._zoomCamera(.9);
    else if (event.key === '-') this._zoomCamera(1.1);
    else if (event.key === 'Home') this._resetCamera();
    else if (event.key === 'ArrowLeft') this._renderer.orbit(18, 0);
    else if (event.key === 'ArrowRight') this._renderer.orbit(-18, 0);
    else if (event.key === 'ArrowUp') this._renderer.orbit(0, -14);
    else if (event.key === 'ArrowDown') this._renderer.orbit(0, 14);
    else return;
    event.preventDefault();
    this._draw3D();
  }

  private _autoArrange(): void {
    if (this._saving || !this.hass.user?.is_admin) return;
    this._recordHistory();
    this._rooms = autoArrangeRooms(this._rooms);
    this._refreshDirty();
    this._selectedRoomId = this._rooms[0]?.id || null;
    this._renderer.resetCamera(this._home3dRooms(), this._floorSeparation);
  }

  private _updateSelectedPlacement(patch: Partial<HousePlacement>): void {
    if (!this._selectedRoomId || this._saving || !this.hass.user?.is_admin) return;
    this._recordHistory();
    this._rooms = this._rooms.map(room => room.id === this._selectedRoomId
      ? { ...room, house: normaliseHousePlacement({ ...room.house, ...patch }) }
      : room);
    if (patch.floor !== undefined && this._selectedFloor !== null) this._selectedFloor = normaliseHousePlacement(patch).floor;
    this._refreshDirty();
    this._refreshPresence();
    if (!this._dragRoom && (patch.x !== undefined || patch.y !== undefined)) {
      const moved = this._rooms.find(room => room.id === this._selectedRoomId);
      if (moved) this._moveAnnouncement = panelText(this.hass, '{name} moved to X {x} mm, Y {y} mm', {
        name: moved.name, x: Math.round(moved.house.x), y: Math.round(moved.house.y),
      });
    }
  }

  private _nudgeSelected(dx: number, dy: number): void {
    const selected = this._rooms.find(room => room.id === this._selectedRoomId);
    if (!selected) return;
    this._updateSelectedPlacement({ x: selected.house.x + dx, y: selected.house.y + dy });
  }

  private async _saveLayout(): Promise<void> {
    if (!this.hass.user?.is_admin || this._saving || (!this._dirty && !this._hasUnsavedSuggestion)) return;
    const overlaps = overlappingRoomIds(this._rooms, null);
    if (overlaps.size > 0) {
      this._error = panelText(this.hass, '{count} rooms overlap. Move the red outlined rooms apart before saving.', { count: overlaps.size });
      return;
    }
    this._saving = true;
    this._error = '';
    this._reloadRequired = false;
    const snapshot = this._cloneRooms();
    const snapshotFingerprint = this._layoutFingerprint(snapshot);
    try {
      const result = await this.hass.callWS<RoomsResponse>({
        type: 'smarthomeshop/room/house/save_many',
        placements: snapshot.map(room => ({
          room_id: room.id,
          house: { ...room.house },
          expected_updated_at: room.updated_at || null,
        })),
      });
      const savedById = new Map((result.rooms || []).map(room => [room.id, room]));
      this._rooms = this._rooms.map(room => {
        const saved = savedById.get(room.id);
        return saved ? { ...room, updated_at: saved.updated_at, house: { ...room.house } } : room;
      });
      this._savedLayoutFingerprint = snapshotFingerprint;
      this._configuredPlacementIds = new Set(snapshot.map(room => room.id));
      this._refreshDirty();
      this._savedNotice = true;
      if (this._savedNoticeTimer) window.clearTimeout(this._savedNoticeTimer);
      this._savedNoticeTimer = window.setTimeout(() => { this._savedNotice = false; }, 3500);
    } catch (error) {
      console.error('Could not save whole-home layout:', error);
      const detail = String((error as { code?: string; message?: string })?.code
        || (error as { message?: string })?.message || error).toLowerCase();
      const staleRoom = detail.includes('not_found') || detail.includes('not found') || detail.includes('conflict') || detail.includes('changed');
      this._error = panelText(this.hass, staleRoom
        ? 'A room changed or was removed elsewhere. Reload Live Home before saving again.'
        : 'Could not save the home layout. Nothing was marked as saved; check your connection and try again.');
      this._reloadRequired = staleRoom;
    } finally {
      this._saving = false;
      this._refreshDirty();
    }
  }

  private _arrangeViewBox(): { minX: number; minY: number; width: number; height: number } {
    if (this._dragRoom) return this._dragRoom.viewBox;
    const shown = this._rooms.filter(room => this._selectedFloor === null || room.house.floor === this._selectedFloor);
    const points = shown.flatMap(room => roomPolygon(room).map(point => transformHomePoint(point, room.house)));
    if (!points.length) return { minX: -5000, minY: -4000, width: 10000, height: 8000 };
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    const padding = 1200;
    return {
      minX: Math.min(...xs) - padding,
      minY: Math.min(...ys) - padding,
      width: Math.max(3000, Math.max(...xs) - Math.min(...xs) + padding * 2),
      height: Math.max(3000, Math.max(...ys) - Math.min(...ys) + padding * 2),
    };
  }

  private _roomDragStart(event: PointerEvent, room: WholeHomeRoom): void {
    if (this._saving || !this.hass.user?.is_admin) return;
    event.preventDefault();
    event.stopPropagation();
    const svgElement = (event.currentTarget as SVGElement).ownerSVGElement;
    const matrix = svgElement?.getScreenCTM()?.inverse();
    if (!svgElement || !matrix) return;
    const startPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    this._selectedRoomId = room.id;
    this._dragRoom = {
      roomId: room.id,
      pointerId: event.pointerId,
      startPoint: { x: startPoint.x, y: startPoint.y },
      house: { ...room.house },
      viewBox: this._arrangeViewBox(),
      historyRecorded: false,
    };
    this.requestUpdate();
    (event.currentTarget as SVGElement).setPointerCapture(event.pointerId);
  }

  private _roomDragMove(event: PointerEvent): void {
    if (!this._dragRoom || this._saving || event.pointerId !== this._dragRoom.pointerId) return;
    const svg = this.renderRoot.querySelector<SVGSVGElement>('.arrange-wrap svg');
    if (!svg) return;
    const matrix = svg.getScreenCTM()?.inverse();
    if (!matrix) return;
    const currentPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    const dx = currentPoint.x - this._dragRoom.startPoint.x;
    const dy = currentPoint.y - this._dragRoom.startPoint.y;
    if (!this._dragRoom.historyRecorded && Math.hypot(dx, dy) > 2) {
      this._recordHistory();
      this._dragRoom.historyRecorded = true;
    }
    const snap = event.shiftKey ? 50 : 250;
    const x = Math.round((this._dragRoom.house.x + dx) / snap) * snap;
    const y = Math.round((this._dragRoom.house.y + dy) / snap) * snap;
    const movedRoom = this._rooms.find(room => room.id === this._dragRoom?.roomId);
    if (!movedRoom) return;
    const snapped = snapHousePlacement(movedRoom, { ...movedRoom.house, x, y }, this._rooms, event.shiftKey ? 70 : 140);
    this._guideX = snapped.guideX;
    this._guideY = snapped.guideY;
    this._rooms = this._rooms.map(room => room.id === this._dragRoom?.roomId
      ? { ...room, house: snapped.placement }
      : room);
    this._refreshDirty();
  }

  private _roomDragEnd(event: PointerEvent): void {
    if (this._dragRoom?.pointerId === event.pointerId) {
      this._dragRoom = null;
      this._guideX = null;
      this._guideY = null;
      this.requestUpdate();
    }
  }

  private _renderArrange(): unknown {
    const viewBox = this._arrangeViewBox();
    const shownRooms = this._rooms.filter(room =>
      this._selectedFloor === null || room.house.floor === this._selectedFloor);
    const overlaps = overlappingRoomIds(this._rooms, this._selectedFloor);
    return html`
      <div class="arrange-wrap">
        <p id="arrange-instructions" class="sr-only">${panelText(this.hass, 'Select a room and use the arrow keys or move buttons to position it. Hold Shift with an arrow key for fine movement.')}</p>
        <p class="sr-only" aria-live="polite">${this._moveAnnouncement}</p>
        <svg
          viewBox="${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}"
          aria-label=${panelText(this.hass, 'Drag rooms to build the whole-home layout')}
          @pointermove=${this._roomDragMove}
          @pointerup=${this._roomDragEnd}
          @pointercancel=${this._roomDragEnd}
        >
          <defs>
            <pattern id="home-grid" width="500" height="500" patternUnits="userSpaceOnUse">
              <path d="M 500 0 L 0 0 0 500" fill="none" stroke="var(--divider-color)" stroke-width="10" opacity=".42"></path>
            </pattern>
          </defs>
          <rect x=${viewBox.minX} y=${viewBox.minY} width=${viewBox.width} height=${viewBox.height} fill="url(#home-grid)"></rect>
          ${this._guideX !== null ? svg`<line class="snap-guide" x1=${this._guideX} y1=${viewBox.minY} x2=${this._guideX} y2=${viewBox.minY + viewBox.height}></line>` : nothing}
          ${this._guideY !== null ? svg`<line class="snap-guide" x1=${viewBox.minX} y1=${this._guideY} x2=${viewBox.minX + viewBox.width} y2=${this._guideY}></line>` : nothing}
          ${shownRooms.map(room => {
            const points = roomPolygon(room).map(point => transformHomePoint(point, room.house));
            const pointText = points.map(point => `${point.x},${point.y}`).join(' ');
            const center = transformHomePoint(roomInteriorPoint(room), room.house);
            const roomState = this._presence.rooms.find(item => item.roomId === room.id);
            const active = roomState?.occupied || false;
            return svg`
              <g
                class="room-shape ${this._selectedRoomId === room.id ? 'selected' : ''} ${this._dragRoom?.roomId === room.id ? 'dragging' : ''} ${overlaps.has(room.id) ? 'overlap' : ''} ${room.house.visible === false ? 'hidden' : ''}"
                role="button"
                tabindex="0"
                aria-roledescription=${panelText(this.hass, 'movable room')}
                aria-describedby="arrange-instructions"
                aria-disabled=${this.hass.user?.is_admin ? 'false' : 'true'}
                aria-label=${panelText(this.hass, 'Move {name}', { name: room.name })}
                @pointerdown=${(event: PointerEvent) => this._roomDragStart(event, room)}
                @focus=${() => { this._selectedRoomId = room.id; }}
                @keydown=${(event: KeyboardEvent) => {
                  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                  event.preventDefault();
                  this._selectedRoomId = room.id;
                  const step = event.shiftKey ? 50 : 250;
                  this._updateSelectedPlacement({
                    x: room.house.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
                    y: room.house.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0),
                  });
                }}
              >
                <polygon
                  points=${pointText}
                  fill=${active ? 'color-mix(in srgb, var(--shs-live) 20%, var(--card-background-color))' : 'var(--card-background-color)'}
                  stroke=${this._selectedRoomId === room.id ? 'var(--shs-primary)' : active ? 'var(--shs-live)' : 'var(--secondary-text-color)'}
                  stroke-width=${this._selectedRoomId === room.id ? 65 : 28}
                ></polygon>
                <text data-i18n-ignore x=${center.x} y=${center.y - 40} text-anchor="middle" fill="var(--primary-text-color)" font-size="310" font-weight="700">${room.name}</text>
                <text x=${center.x} y=${center.y + 300} text-anchor="middle" fill=${active ? 'var(--primary-text-color)' : 'var(--secondary-text-color)'} font-size="220">${room.house.visible === false
                  ? panelText(this.hass, 'Hidden from Live Home')
                  : active
                    ? (roomState?.people || 0) > 0 ? panelText(this.hass, roomState?.people === 1 ? '{count} person' : '{count} people', { count: roomState?.people || 0 }) : panelText(this.hass, 'Presence detected')
                    : this._floorText(room.house.floor)}</text>
              </g>
            `;
          })}
        </svg>
        <div class="arrange-tip">${panelText(this.hass, 'Drag to move · 250 mm snap · hold Shift for 50 mm')}</div>
      </div>
    `;
  }

  private _renderSidebar(): unknown {
    const selected = this._rooms.find(room => room.id === this._selectedRoomId) || null;
    const selectedState = selected ? this._presence.rooms.find(room => room.roomId === selected.id) : null;
    const savedPlacements = this._rooms.filter(room => this._configuredPlacementIds.has(room.id)).length;
    const sensorRooms = this._presence.rooms.filter(room => room.sensorCount > 0).length;
    const setupSteps = [
      { done: this._rooms.length > 0, title: 'Rooms created', detail: this._rooms.length === 1 ? '{count} room available' : '{count} rooms available', action: 'Room Designer', run: () => this._openRoomDesigner() },
      { done: this._rooms.length > 0 && savedPlacements === this._rooms.length, title: 'Home layout positioned', detail: '{placed} of {total} rooms positioned', action: 'Arrange', run: () => this._setView('arrange') },
      { done: sensorRooms > 0, title: 'Sensors assigned to rooms', detail: sensorRooms === 1 ? '{count} room has sensors' : '{count} rooms have sensors', action: 'Link sensors', run: () => this._openRoomDesigner() },
      { done: this._presence.liveSensors > 0, title: 'Live radar data ready', detail: this._presence.liveSensors === 1 ? '{count} radar sensor reporting live data' : '{count} radar sensors reporting live data', action: 'Check sensors', run: () => this._openRoomDesigner() },
    ];
    const completeSteps = setupSteps.filter(step => step.done).length;
    const setupPercent = Math.round(completeSteps / setupSteps.length * 100);
    const overlaps = overlappingRoomIds(this._rooms, null);
    return html`
      <aside>
        <section class="side-section">
          <h2 class="side-title">${panelText(this.hass, 'Home setup')}</h2>
          <div class="setup-progress">
            <div class="progress-ring" style=${`--value:${Math.min(100, setupPercent)}`}><strong>${Math.min(100, setupPercent)}%</strong></div>
            <div class="setup-copy">
              <strong>${panelText(this.hass, '{done} of {total} setup steps complete', { done: completeSteps, total: setupSteps.length })}</strong>
              <span>${panelText(this.hass, completeSteps === setupSteps.length ? 'Live Home is ready to use.' : 'Finish the next step to make Live Home reliable.')}</span>
            </div>
          </div>
          <div class="setup-steps">
            ${setupSteps.map(step => html`
              <div class="setup-step">
                <span class="setup-step-icon ${step.done ? 'done' : ''}"><ha-icon icon=${step.done ? 'mdi:check' : 'mdi:circle-outline'}></ha-icon></span>
                <span>
                  <strong>${panelText(this.hass, step.title)}</strong>
                  <small>${panelText(this.hass, step.detail, step.detail.includes('{placed}')
                    ? { placed: savedPlacements, total: this._rooms.length }
                    : { count: step.title === 'Rooms created' ? this._rooms.length : step.title === 'Sensors assigned to rooms' ? sensorRooms : this._presence.liveSensors })}</small>
                </span>
                ${step.done ? nothing : html`<button class="step-action" @click=${step.run}>${panelText(this.hass, step.action)}</button>`}
              </div>
            `)}
          </div>
          ${completeSteps === setupSteps.length ? html`<div class="setup-complete"><strong>${panelText(this.hass, 'Setup complete')}</strong><br>${panelText(this.hass, 'Rooms, layout and live radar data are connected.')}</div>` : nothing}
          ${this._presence.liveSensors > 0 && this._presence.unavailableSensors > 0 ? html`<div class="warning" role="status">${panelText(this.hass, this._presence.unavailableSensors === 1 ? '{count} radar sensor is offline or unavailable. Clear rooms remain separate from unavailable rooms.' : '{count} radar sensors are offline or unavailable. Clear rooms remain separate from unavailable rooms.', { count: this._presence.unavailableSensors })}</div>` : nothing}
        </section>

        <section class="side-section">
          <h2 class="side-title">${panelText(this.hass, 'Rooms now')}</h2>
          <div class="room-list">
            ${this._presence.rooms.filter(room => this._view === 'arrange' || room.visible).map(room => html`
              <button class="room-row ${this._selectedRoomId === room.roomId ? 'active' : ''} ${room.visible ? '' : 'hidden'}" aria-label=${`${room.roomName}: ${panelText(this.hass, room.sensorCount === 0 ? 'No linked sensor' : !room.available ? 'Sensor unavailable' : room.people === 1 ? '{count} person' : room.people > 1 ? '{count} people' : room.occupied ? 'Presence detected' : 'Clear', { count: room.people })}${room.available && room.unavailableSensorCount > 0 ? `. ${panelText(this.hass, '{offline} of {total} sensors offline', { offline: room.unavailableSensorCount, total: room.sensorCount })}` : ''}`} @click=${() => {
                this._selectedRoomId = room.roomId;
                this._selectedFloor = room.floor;
              }}>
                <span class="room-presence ${room.sensorCount > 0 && !room.available ? 'offline' : room.available && room.unavailableSensorCount > 0 ? 'degraded' : room.occupied ? 'live' : ''}"></span>
                <span>
                  <span class="room-row-name" data-i18n-ignore>${room.roomName}</span>
                  <span class="room-row-meta">${this._floorText(room.floor)} · ${room.visible
                    ? room.sensorCount > 0 && !room.available
                      ? panelText(this.hass, 'Sensor unavailable')
                      : room.unavailableSensorCount > 0
                        ? panelText(this.hass, '{live} of {total} sensors online', { live: room.liveSensorCount, total: room.sensorCount })
                        : `${room.sensorCount} ${panelText(this.hass, room.sensorCount === 1 ? 'sensor' : 'sensors')}`
                    : panelText(this.hass, 'Hidden from Live Home')}</span>
                </span>
                <span class="room-count" aria-hidden="true">${room.people || (room.occupied ? '●' : '—')}</span>
              </button>
            `)}
          </div>
        </section>

        ${this._view === '3d' && selected && selectedState ? html`
          <section class="side-section">
            <h2 class="side-title" data-i18n-ignore>${selected.name}</h2>
            <div class="room-detail">
              <div class="room-detail-line"><span>${panelText(this.hass, 'Presence')}</span><strong>${selectedState.sensorCount === 0
                ? panelText(this.hass, 'No linked sensor')
                : !selectedState.available ? panelText(this.hass, 'Sensor unavailable')
                : selectedState.people
                  ? panelText(this.hass, selectedState.people === 1 ? '{count} person' : '{count} people', { count: selectedState.people })
                  : selectedState.occupied ? panelText(this.hass, 'Presence detected') : panelText(this.hass, 'Clear')}</strong></div>
              <div class="room-detail-line"><span>${panelText(this.hass, 'Detection')}</span><strong>${panelText(this.hass, selectedState.sensorCount === 0
                ? 'No linked sensor'
                : !selectedState.available
                  ? 'Sensor unavailable'
                  : selectedState.positioningSensorCount > 0 ? 'Exact radar positions' : 'Room-level presence')}</strong></div>
              <div class="room-detail-line"><span>${panelText(this.hass, 'Sensors')}</span><strong>${selectedState.unavailableSensorCount > 0
                ? panelText(this.hass, '{live} of {total} sensors online', { live: selectedState.liveSensorCount, total: selectedState.sensorCount })
                : selectedState.sensorCount}</strong></div>
              <button class="quiet-button" @click=${this._openRoomDesigner}>${panelText(this.hass, 'Edit room and sensors')}</button>
            </div>
          </section>
        ` : nothing}

        ${this._view === 'arrange' && selected ? html`
          <section class="side-section">
            <h2 class="side-title" data-i18n-ignore>${selected.name}</h2>
            <div class="control-grid">
              <label>${panelText(this.hass, 'Floor')}
                <select ?disabled=${this._saving || !this.hass.user?.is_admin} @change=${(event: Event) => this._updateSelectedPlacement({ floor: Number((event.target as HTMLSelectElement).value) })}>
                  ${Array.from({ length: 26 }, (_, index) => index - 5).map(floor => html`<option value=${floor} ?selected=${selected.house.floor === floor}>${this._floorText(floor)}</option>`)}
                </select>
              </label>
              <label>${panelText(this.hass, 'Rotation')}
                <select ?disabled=${this._saving || !this.hass.user?.is_admin} @change=${(event: Event) => this._updateSelectedPlacement({ rotationDeg: Number((event.target as HTMLSelectElement).value) as 0 | 90 | 180 | 270 })}>
                  ${[0, 90, 180, 270].map(rotation => html`<option value=${rotation} ?selected=${selected.house.rotationDeg === rotation}>${rotation}°</option>`)}
                </select>
              </label>
            </div>
            <div class="control-actions">
              <button class="quiet-button" ?disabled=${this._saving || !this.hass.user?.is_admin} @click=${() => this._updateSelectedPlacement({ rotationDeg: ((selected.house.rotationDeg + 270) % 360) as 0 | 90 | 180 | 270 })}>↶ ${panelText(this.hass, 'Rotate left')}</button>
              <button class="quiet-button" ?disabled=${this._saving || !this.hass.user?.is_admin} @click=${() => this._updateSelectedPlacement({ rotationDeg: ((selected.house.rotationDeg + 90) % 360) as 0 | 90 | 180 | 270 })}>${panelText(this.hass, 'Rotate right')} ↷</button>
            </div>
            <div class="nudge-controls">
              <span>${panelText(this.hass, 'Move room without dragging')}</span>
              <select aria-label=${panelText(this.hass, 'Nudge step')} .value=${String(this._nudgeStep)} @change=${(event: Event) => this._nudgeStep = Number((event.target as HTMLSelectElement).value) as 50 | 250}>
                <option value="250">${panelText(this.hass, 'Standard 250 mm')}</option>
                <option value="50">${panelText(this.hass, 'Fine 50 mm')}</option>
              </select>
              <div class="nudge-grid">
                <button ?disabled=${this._saving || !this.hass.user?.is_admin} aria-label=${panelText(this.hass, 'Move left')} @click=${() => this._nudgeSelected(-this._nudgeStep, 0)}>←</button>
                <button ?disabled=${this._saving || !this.hass.user?.is_admin} aria-label=${panelText(this.hass, 'Move up')} @click=${() => this._nudgeSelected(0, -this._nudgeStep)}>↑</button>
                <button ?disabled=${this._saving || !this.hass.user?.is_admin} aria-label=${panelText(this.hass, 'Move down')} @click=${() => this._nudgeSelected(0, this._nudgeStep)}>↓</button>
                <button ?disabled=${this._saving || !this.hass.user?.is_admin} aria-label=${panelText(this.hass, 'Move right')} @click=${() => this._nudgeSelected(this._nudgeStep, 0)}>→</button>
              </div>
            </div>
            <label class="toggle-line">
              <span>${panelText(this.hass, 'Show in live home')}</span>
              <input type="checkbox" ?disabled=${this._saving || !this.hass.user?.is_admin} .checked=${selected.house.visible !== false} @change=${(event: Event) => this._updateSelectedPlacement({ visible: (event.target as HTMLInputElement).checked })} />
            </label>
          </section>
        ` : nothing}

        <section class="side-section">
          <h2 class="side-title">${panelText(this.hass, 'View')}</h2>
          <label class="toggle-line"><span>${panelText(this.hass, 'Room names')}</span><input type="checkbox" .checked=${this._showRoomNames} @change=${(event: Event) => this._showRoomNames = (event.target as HTMLInputElement).checked} /></label>
          <label class="toggle-line"><span>${panelText(this.hass, 'Empty rooms')}</span><input type="checkbox" .checked=${this._showEmptyRooms} @change=${(event: Event) => this._showEmptyRooms = (event.target as HTMLInputElement).checked} /></label>
          ${this._view === '3d' && this._floors().length > 1 ? html`
            <label class="range-line">
              <span class="range-head"><span>${panelText(this.hass, 'Floor separation')}</span><strong>${Math.round(this._floorSeparation * 100)}%</strong></span>
              <input type="range" min="0.7" max="1.7" step="0.1" .value=${String(this._floorSeparation)} @input=${(event: Event) => {
                this._floorSeparation = Number((event.target as HTMLInputElement).value);
                this._resetCamera();
              }} />
            </label>
          ` : nothing}
          ${this._view === 'arrange' ? html`
            <div class="save-strip">
              <button class="quiet-button" ?disabled=${this._saving || !this.hass.user?.is_admin} @click=${this._autoArrange}>${panelText(this.hass, 'Auto-arrange rooms')}</button>
              <button class="primary-button" ?disabled=${(!this._dirty && !this._hasUnsavedSuggestion) || this._saving || !this.hass.user?.is_admin || overlaps.size > 0} @click=${this._saveLayout}>
                ${panelText(this.hass, this._saving
                  ? 'Saving...'
                  : this._dirty || this._hasUnsavedSuggestion
                    ? this._hasUnsavedSuggestion && !this._dirty ? 'Save suggested layout' : 'Save home layout'
                    : 'Layout saved')}
              </button>
            </div>
          ` : nothing}
          ${this._view === 'arrange' && !this.hass.user?.is_admin ? html`<div class="warning" role="status">${panelText(this.hass, 'Only an administrator can change the Live Home layout.')}</div>` : nothing}
          ${overlaps.size > 0 && this._view === 'arrange' ? html`<div class="warning" role="alert">${panelText(this.hass, '{count} rooms overlap. Move the red outlined rooms apart before saving.', { count: overlaps.size })}</div>` : nothing}
          ${this._savedNotice ? html`<div class="success" role="status">${panelText(this.hass, 'Home layout saved successfully.')}</div>` : nothing}
          ${this._error ? html`<div class="error" role="alert">${this._error}<br><button class="quiet-button" @click=${this._reloadRequired ? this._load : this._saveLayout}>${panelText(this.hass, this._reloadRequired ? 'Reload Live Home' : 'Try saving again')}</button></div>` : nothing}
        </section>
      </aside>
    `;
  }

  protected render() {
    if (this._loading) return html`<div class="empty"><div class="empty-inner"><ha-icon icon="mdi:home-clock-outline"></ha-icon><h2>${panelText(this.hass, 'Building your live home...')}</h2></div></div>`;
    if (this._error && !this._rooms.length) return html`
      <div class="empty"><div class="empty-inner">
        <ha-icon icon="mdi:home-alert-outline"></ha-icon>
        <h2>${panelText(this.hass, 'Live Home could not be loaded')}</h2>
        <p>${this._error}</p>
        <button class="primary-button" @click=${this._load}>${panelText(this.hass, 'Try again')}</button>
      </div></div>
    `;
    if (!this._rooms.length) return html`
      <div class="empty"><div class="empty-inner">
        <ha-icon icon="mdi:home-plus-outline"></ha-icon>
        <h2>${panelText(this.hass, 'Create your first room')}</h2>
        <p>${panelText(this.hass, 'Draw or import rooms in Room Designer first. Live Home will then combine them automatically.')}</p>
        <button class="primary-button" @click=${() => this.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'zones' }, bubbles: true, composed: true }))}>${panelText(this.hass, 'Open Room Designer')}</button>
      </div></div>
    `;
    const exactPeople = this._presence.people.filter(person => !person.approximate).length;
    const activeRooms = this._presence.rooms.filter(room => room.visible && room.occupied).length;
    const noLiveData = this._presence.liveSensors === 0;
    const roomLevelOnly = exactPeople === 0 && activeRooms > 0;
    const peopleValue = noLiveData ? '—' : roomLevelOnly ? panelText(this.hass, 'Presence') : String(exactPeople);
    const peopleLabel = noLiveData ? 'Data unavailable' : roomLevelOnly ? 'Room level only' : 'tracked now';
    const liveClass = noLiveData ? 'offline' : this._presence.unavailableSensors > 0 ? 'degraded' : '';
    return html`
      <header class="page-head">
        <div>
          <p class="eyebrow">${panelText(this.hass, 'Whole-home presence')}</p>
          <h1>${panelText(this.hass, 'Live Home')}</h1>
          <p class="subtitle">${panelText(this.hass, 'See where presence is detected across every room and floor.')}</p>
        </div>
        <div class="head-metrics">
          <div class="head-metric"><strong><span class="live-dot ${liveClass}"></span>${peopleValue}</strong><span>${panelText(this.hass, peopleLabel)}</span></div>
          <div class="head-metric"><strong>${activeRooms}</strong><span>${panelText(this.hass, activeRooms === 1 ? 'active room' : 'active rooms')}</span></div>
          <div class="head-metric"><strong>${this._floors().length}</strong><span>${panelText(this.hass, this._floors().length === 1 ? 'floor' : 'floors')}</span></div>
        </div>
      </header>

      <div class="shell">
        <section class="stage">
          <div class="stage-toolbar">
            <div class="segmented" role="group" aria-label=${panelText(this.hass, 'Home view mode')}>
              <button class=${this._view === '3d' ? 'active' : ''} aria-pressed=${this._view === '3d' ? 'true' : 'false'} @click=${() => this._setView('3d')}><ha-icon icon="mdi:cube-outline"></ha-icon>${panelText(this.hass, 'Live 3D')}</button>
              <button class=${this._view === 'arrange' ? 'active' : ''} aria-pressed=${this._view === 'arrange' ? 'true' : 'false'} @click=${() => this._setView('arrange')}><ha-icon icon="mdi:floor-plan"></ha-icon>${panelText(this.hass, 'Arrange rooms')}</button>
            </div>
            ${this._view === 'arrange' ? html`
              <div class="history-actions" role="group" aria-label=${panelText(this.hass, 'Layout history')}>
                <button class="icon-button" title=${panelText(this.hass, 'Undo layout change')} aria-label=${panelText(this.hass, 'Undo layout change')} ?disabled=${!this._undoStack.length || !this.hass.user?.is_admin} @click=${this._undo}><ha-icon icon="mdi:undo"></ha-icon></button>
                <button class="icon-button" title=${panelText(this.hass, 'Redo layout change')} aria-label=${panelText(this.hass, 'Redo layout change')} ?disabled=${!this._redoStack.length || !this.hass.user?.is_admin} @click=${this._redo}><ha-icon icon="mdi:redo"></ha-icon></button>
              </div>
            ` : nothing}
            <span class="toolbar-spacer"></span>
            <select class="floor-select" aria-label=${panelText(this.hass, 'Shown floor')} @change=${(event: Event) => this._selectFloor((event.target as HTMLSelectElement).value)}>
              <option value="all" ?selected=${this._selectedFloor === null}>${panelText(this.hass, 'All floors')}</option>
              ${this._floors().map(floor => html`<option value=${floor} ?selected=${this._selectedFloor === floor}>${this._floorText(floor)}</option>`)}
            </select>
            ${this._view === '3d' ? html`
              <button class="icon-button" title=${panelText(this.hass, 'Zoom out')} aria-label=${panelText(this.hass, 'Zoom out')} @click=${() => this._zoomCamera(1.1)}><ha-icon icon="mdi:magnify-minus-outline"></ha-icon></button>
              <button class="icon-button" title=${panelText(this.hass, 'Zoom in')} aria-label=${panelText(this.hass, 'Zoom in')} @click=${() => this._zoomCamera(.9)}><ha-icon icon="mdi:magnify-plus-outline"></ha-icon></button>
              <button class="icon-button" title=${panelText(this.hass, 'Reset camera')} aria-label=${panelText(this.hass, 'Reset camera')} @click=${this._resetCamera}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
            ` : nothing}
          </div>
          ${this._view === '3d' ? html`
            <div class="scene-wrap">
              <canvas
                class=${this._draggingCamera ? 'dragging' : ''}
                role="application"
                tabindex="0"
                aria-label=${panelText(this.hass, 'Interactive 3D view of live presence. Use arrow keys to rotate, plus and minus to zoom, and Home to reset.')}
                @pointerdown=${this._onCameraDown}
                @pointermove=${this._onCameraMove}
                @pointerup=${this._onCameraUp}
                @pointercancel=${this._onCameraUp}
                @wheel=${this._onCameraWheel}
                @keydown=${this._onCameraKeydown}
              ></canvas>
              <div class="legend"><span class="legend-chip"><i class="legend-mark"></i>${panelText(this.hass, 'Exact radar position')}</span><span class="legend-chip"><i class="legend-mark approx"></i>${panelText(this.hass, 'Room presence only')}</span></div>
              <div class="scene-help"><ha-icon icon="mdi:gesture-swipe"></ha-icon>${panelText(this.hass, 'Drag to orbit · scroll to zoom')}</div>
            </div>
          ` : this._renderArrange()}
        </section>
        ${this._renderSidebar()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-home-presence-page': HomePresencePage;
  }
}
