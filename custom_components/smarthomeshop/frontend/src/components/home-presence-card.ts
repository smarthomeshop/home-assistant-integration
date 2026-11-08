import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';
import { CardLocalizationController, cardText } from '../utils/runtime-translations';
import {
  collectHomePresence,
  placeHomeRooms,
  resetCanvasTransform,
  roomInteriorPoint,
  roomPoints,
  transformHomePoint,
  type HomePerson,
  type HomePresence,
  type HomeRadarProfile,
  type HomeRoom,
  type PlacedHomeRoom,
} from '../utils/whole-home';

export interface HomePresenceCardConfig {
  type?: string;
  title?: string;
  floor?: 'all' | number;
  height?: number;
  floor_spacing?: number;
  show_room_names?: boolean;
  show_empty_rooms?: boolean;
  show_summary?: boolean;
  show_room_status?: boolean;
}

interface RoomsResponse { rooms: HomeRoom[] }
interface ProfilesResponse { devices: HomeRadarProfile[] }

const defaults: Required<Omit<HomePresenceCardConfig, 'type' | 'title'>> = {
  floor: 'all',
  height: 380,
  floor_spacing: .75,
  show_room_names: true,
  show_empty_rooms: true,
  show_summary: true,
  show_room_status: true,
};

interface ScreenPoint { x: number; y: number }

const homeFloorLabel = (hass: HomeAssistant | undefined, floor: number): string => {
  if (floor === 0) return cardText(hass, 'Ground floor');
  if (floor === -1) return cardText(hass, 'Basement');
  const source = floor < 0 ? 'Basement {count}' : 'Floor {count}';
  return cardText(hass, source).replace('{count}', String(Math.abs(floor)));
};

export class SmartHomeShopHomePresenceCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  protected readonly _localization = new CardLocalizationController(this, () => this.hass);
  @state() private _config: HomePresenceCardConfig = { ...defaults };
  @state() private _rooms: PlacedHomeRoom[] = [];
  @state() private _profiles: HomeRadarProfile[] = [];
  @state() private _presence: HomePresence = {
    people: [], rooms: [], linkedSensors: 0, liveSensors: 0, unavailableSensors: 0,
  };
  @state() private _loading = true;
  @state() private _error = '';
  @state() private _rotation = 0;
  @state() private _focusedRoomId: string | null = null;
  private _loaded = false;
  private _loadPending = false;
  private _resizeObserver?: ResizeObserver;
  private _observedCanvas?: HTMLCanvasElement;
  private _drawFrame?: number;
  private _reloadTimer?: number;

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; --shs-live: #10b981; --shs-approx: #f59e0b; }
    * { box-sizing: border-box; }
    ha-card { overflow: hidden; }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 68px;
      padding: 13px 16px;
      border-bottom: 1px solid var(--divider-color);
    }
    .header-icon {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 12px;
      color: var(--shs-primary);
      background: color-mix(in srgb, var(--shs-primary) 12%, transparent);
    }
    .header-icon ha-icon { --mdc-icon-size: 22px; }
    .header-copy { min-width: 0; flex: 1; }
    .title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary-text-color); font-size: 16px; font-weight: 720; }
    .subtitle { margin-top: 3px; color: var(--secondary-text-color); font-size: 12px; }
    .metrics { display: flex; align-items: center; gap: 14px; }
    .metric { min-width: 44px; text-align: right; }
    .metric strong { display: block; color: var(--primary-text-color); font-size: 17px; line-height: 1; }
    .metric span { color: var(--secondary-text-color); font-size: 9px; letter-spacing: .04em; text-transform: uppercase; }
    .live-dot { display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 999px; background: var(--shs-live); }
    .live-dot.degraded { background: var(--shs-approx); }
    .live-dot.offline { background: var(--error-color, #b91c1c); }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
      padding: 7px 10px;
      border-bottom: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
    }
    select, button { min-height: 34px; font: inherit; border: 1px solid var(--divider-color); border-radius: 8px; color: var(--primary-text-color); background: var(--card-background-color); }
    select { min-width: 135px; padding: 0 28px 0 9px; }
    button { width: 34px; display: grid; place-items: center; padding: 0; cursor: pointer; }
    button:hover { color: var(--shs-primary); border-color: color-mix(in srgb, var(--shs-primary) 45%, var(--divider-color)); }
    button:focus-visible, select:focus-visible { outline: 2px solid var(--shs-primary); outline-offset: 2px; }
    button ha-icon { --mdc-icon-size: 18px; }
    .toolbar-spacer { flex: 1; }
    .legend { display: flex; align-items: center; gap: 10px; color: var(--secondary-text-color); font-size: 10px; }
    .legend span { display: inline-flex; align-items: center; gap: 5px; }
    .legend i { width: 8px; height: 8px; border-radius: 999px; background: var(--shs-live); }
    .legend i.approx { background: transparent; border: 2px dashed var(--shs-approx); }
    .canvas-wrap { position: relative; min-height: 260px; background: var(--secondary-background-color); }
    canvas { display: block; width: 100%; height: 100%; }
    .setup-callout { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-bottom: 1px solid var(--divider-color); color: var(--secondary-text-color); background: color-mix(in srgb, var(--shs-approx) 8%, var(--card-background-color)); font-size: 11px; line-height: 1.4; }
    .setup-callout ha-icon { --mdc-icon-size: 18px; color: var(--shs-approx); flex: 0 0 auto; }
    .room-strip { display: flex; gap: 7px; overflow-x: auto; padding: 10px 12px 12px; border-top: 1px solid var(--divider-color); scrollbar-width: thin; }
    .room-pill { width: auto; min-height: 30px; display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; padding: 5px 9px; border-radius: 999px; color: var(--secondary-text-color); background: var(--secondary-background-color); font-size: 11px; }
    .room-pill.active { color: var(--primary-text-color); }
    .room-pill.offline { opacity: .68; border-style: dashed; }
    .room-pill.degraded { border-color: var(--shs-approx); border-style: dashed; }
    .room-pill.selected { color: var(--shs-primary); border-color: color-mix(in srgb, var(--shs-primary) 48%, var(--divider-color)); }
    .room-pill i { width: 7px; height: 7px; border-radius: 999px; background: var(--divider-color); }
    .room-pill.active i { background: var(--shs-live); box-shadow: 0 0 0 3px color-mix(in srgb, var(--shs-live) 14%, transparent); }
    .room-pill.offline i { background: var(--error-color, #b91c1c); }
    .room-pill.degraded i { background: var(--shs-approx); }
    .empty { min-height: 260px; display: grid; place-items: center; padding: 28px; text-align: center; }
    .empty ha-icon { --mdc-icon-size: 38px; color: var(--shs-primary); }
    .empty h3 { margin: 10px 0 5px; color: var(--primary-text-color); font-size: 16px; }
    .empty p { max-width: 390px; margin: 0; color: var(--secondary-text-color); font-size: 12px; line-height: 1.45; }
    .error { color: var(--error-color); }
    @media (max-width: 500px) {
      .header { align-items: flex-start; flex-wrap: wrap; }
      .metrics { width: 100%; padding-left: 52px; justify-content: flex-start; }
      .metric { text-align: left; }
      .legend { display: none; }
      .toolbar select { min-width: 0; flex: 1; }
    }
  `;

  public setConfig(config: HomePresenceCardConfig): void {
    if (!config || typeof config !== 'object') throw new Error('Live Home card configuration is required.');
    const rawFloor = config.floor === undefined ? defaults.floor : config.floor;
    const floor = rawFloor === 'all' || rawFloor === undefined
      ? 'all'
      : Number.isFinite(Number(rawFloor)) ? Number(rawFloor) : 'all';
    this._config = {
      ...defaults,
      ...config,
      floor,
      height: Math.max(280, Math.min(720, Number(config.height) || defaults.height)),
      floor_spacing: Math.max(.55, Math.min(1.4, Number(config.floor_spacing) || defaults.floor_spacing)),
    };
  }

  public static getStubConfig(): HomePresenceCardConfig {
    return { type: 'custom:smarthomeshop-home-presence-card', ...defaults };
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement('smarthomeshop-home-presence-card-editor');
  }

  public getCardSize(): number { return Math.max(4, Math.ceil((Number(this._config.height) || 430) / 50) + 2); }

  connectedCallback(): void {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver(() => this._queueDraw());
    this._reloadTimer = window.setInterval(() => void this._load(true), 60000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._observedCanvas = undefined;
    if (this._reloadTimer) window.clearInterval(this._reloadTimer);
    if (this._drawFrame) cancelAnimationFrame(this._drawFrame);
  }

  protected updated(changed: PropertyValues): void {
    if (this.hass && !this._loaded) void this._load();
    if (changed.has('hass') && this.hass && this._rooms.length) {
      this._presence = collectHomePresence(this._rooms, this._profiles, entityId => this.hass?.states[entityId]?.state);
    }
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('canvas') || undefined;
    if (canvas && canvas !== this._observedCanvas) {
      if (this._observedCanvas) this._resizeObserver?.unobserve(this._observedCanvas);
      this._observedCanvas = canvas;
      this._resizeObserver?.observe(canvas);
    }
    this._queueDraw();
  }

  private async _load(force = false): Promise<void> {
    if (!this.hass || this._loadPending || (this._loaded && !force)) return;
    this._loadPending = true;
    this._loaded = true;
    if (!this._rooms.length) this._loading = true;
    try {
      const [rooms, profiles] = await Promise.all([
        this.hass.callWS<RoomsResponse>({ type: 'smarthomeshop/rooms' }),
        this.hass.callWS<ProfilesResponse>({ type: 'smarthomeshop/radar/profiles' }),
      ]);
      this._rooms = placeHomeRooms(Array.isArray(rooms.rooms) ? rooms.rooms : []);
      this._profiles = Array.isArray(profiles.devices) ? profiles.devices : [];
      this._presence = collectHomePresence(this._rooms, this._profiles, entityId => this.hass?.states[entityId]?.state);
      this._error = '';
    } catch (error) {
      console.error('Could not load Live Home card:', error);
      this._error = 'Could not load Live Home. Open the SmartHomeShop panel and check Room Designer.';
    } finally {
      this._loadPending = false;
      this._loading = false;
    }
  }

  private _queueDraw(): void {
    if (this._drawFrame) cancelAnimationFrame(this._drawFrame);
    this._drawFrame = requestAnimationFrame(() => this._draw());
  }

  private _shownRooms(): PlacedHomeRoom[] {
    const floor = this._config.floor ?? 'all';
    return this._rooms.filter(room => room.house.visible !== false
      && (floor === 'all' || room.house.floor === Number(floor))
      && (this._config.show_empty_rooms !== false || (() => {
        const state = this._presence.rooms.find(item => item.roomId === room.id);
        return state?.occupied || Boolean(state && state.sensorCount > 0 && !state.available);
      })()));
  }

  private _rotate(point: { x: number; y: number }): { x: number; y: number } {
    switch ((this._rotation % 4 + 4) % 4) {
      case 1: return { x: -point.y, y: point.x };
      case 2: return { x: -point.x, y: -point.y };
      case 3: return { x: point.y, y: -point.x };
      default: return point;
    }
  }

  private _draw(): void {
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas || this._loading || (this._error && !this._rooms.length)) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(rect.width * ratio);
    const pixelHeight = Math.round(rect.height * ratio);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    resetCanvasTransform(context, ratio);
    const style = getComputedStyle(this);
    const colors = {
      background: style.getPropertyValue('--secondary-background-color').trim() || '#f4f6fa',
      floor: style.getPropertyValue('--card-background-color').trim() || '#ffffff',
      outline: style.getPropertyValue('--divider-color').trim() || '#d7dce4',
      text: style.getPropertyValue('--primary-text-color').trim() || '#1f2937',
      muted: style.getPropertyValue('--secondary-text-color').trim() || '#64748b',
      live: '#10b981',
      liveText: style.getPropertyValue('--primary-text-color').trim() || '#047857',
      approx: '#f59e0b',
      primary: '#4361ee',
      warn: style.colorScheme.includes('dark') ? '#fbbf24' : '#92400e',
      error: style.getPropertyValue('--error-color').trim() || '#b91c1c',
    };
    context.fillStyle = colors.background;
    context.fillRect(0, 0, rect.width, rect.height);
    const rooms = this._shownRooms();
    const polygons = rooms.map(room => ({
      room,
      points: roomPoints(room).map(point => transformHomePoint(point, room.house)),
    })).filter(item => item.points.length >= 3);
    if (!polygons.length) return;
    const rawProject = (point: { x: number; y: number }, floor: number): ScreenPoint => {
      const rotated = this._rotate(point);
      return {
        x: (rotated.x - rotated.y) * .72,
        y: (rotated.x + rotated.y) * .34 - floor * 2900 * (this._config.floor_spacing || defaults.floor_spacing),
      };
    };
    const raw = polygons.flatMap(item => item.points.map(point => rawProject(point, item.room.house.floor)));
    const xs = raw.map(point => point.x);
    const ys = raw.map(point => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys) - 900;
    const maxY = Math.max(...ys) + 500;
    const padding = 30;
    const scale = Math.min((rect.width - padding * 2) / Math.max(1000, maxX - minX), (rect.height - padding * 2) / Math.max(1000, maxY - minY));
    const project = (point: { x: number; y: number }, floor: number): ScreenPoint => {
      const projected = rawProject(point, floor);
      return { x: padding + (projected.x - minX) * scale, y: padding + (projected.y - minY) * scale };
    };
    const visualDepth = (item: (typeof polygons)[number]): number => item.points
      .reduce((sum, point) => sum + this._rotate(point).x + this._rotate(point).y, 0) / item.points.length;
    const ordered = [...polygons].sort((a, b) => a.room.house.floor - b.room.house.floor
      || visualDepth(a) - visualDepth(b));
    for (const item of ordered) {
      const points = item.points.map(point => project(point, item.room.house.floor));
      const roomState = this._presence.rooms.find(room => room.roomId === item.room.id);
      const occupied = roomState?.occupied || false;
      const unavailable = Boolean(roomState && roomState.sensorCount > 0 && !roomState.available);
      const degraded = Boolean(roomState?.available && roomState.unavailableSensorCount > 0);
      const focused = this._focusedRoomId === item.room.id;
      context.beginPath();
      points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.closePath();
      context.fillStyle = unavailable ? 'rgba(148,163,184,.12)' : degraded ? 'rgba(245,158,11,.08)' : occupied ? 'rgba(16,185,129,.13)' : colors.floor;
      context.fill();
      context.lineWidth = occupied ? 2.3 : focused ? 2 : 1.25;
      context.strokeStyle = unavailable ? colors.error : degraded ? colors.warn : occupied ? colors.live : focused ? colors.primary : colors.outline;
      if (unavailable || degraded) context.setLineDash(unavailable ? [6, 5] : [3, 4]);
      context.stroke();
      context.setLineDash([]);
      const wallHeight = 15;
      for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        context.beginPath();
        context.moveTo(current.x, current.y);
        context.lineTo(next.x, next.y);
        context.lineTo(next.x, next.y - wallHeight);
        context.lineTo(current.x, current.y - wallHeight);
        context.closePath();
        context.fillStyle = occupied ? 'rgba(16,185,129,.08)' : 'rgba(148,163,184,.10)';
        context.fill();
        context.strokeStyle = unavailable ? colors.error : degraded ? colors.warn : occupied ? 'rgba(16,185,129,.55)' : colors.outline;
        context.lineWidth = 1;
        if (unavailable || degraded) context.setLineDash(unavailable ? [5, 4] : [3, 4]);
        context.stroke();
        context.setLineDash([]);
      }
    }
    const shownIds = new Set(rooms.map(room => room.id));
    this._presence.people.filter(person => shownIds.has(person.roomId)).forEach(person => this._drawPerson(context, project(person, person.floor), person, colors));
    if (this._config.show_room_names !== false) {
      for (const item of ordered) {
        const roomState = this._presence.rooms.find(room => room.roomId === item.room.id);
        const unavailable = Boolean(roomState && roomState.sensorCount > 0 && !roomState.available);
        const degraded = Boolean(roomState?.available && roomState.unavailableSensorCount > 0);
        const center = project(transformHomePoint(roomInteriorPoint(item.room), item.room.house), item.room.house.floor);
        context.fillStyle = colors.text;
        context.font = '600 12px system-ui, sans-serif';
        context.textAlign = 'center';
        context.fillText(item.room.name, center.x, center.y + 4);
        if (unavailable || degraded || roomState?.occupied) {
          context.fillStyle = unavailable ? colors.error : degraded ? colors.warn : colors.liveText;
          context.font = '700 10px system-ui, sans-serif';
          context.fillText(unavailable
            ? cardText(this.hass, 'Offline')
            : degraded ? this._partialOfflineLabel(roomState!)
            : roomState?.people
            ? `${roomState.people} ${cardText(this.hass, 'present')}`
            : cardText(this.hass, 'Presence detected'), center.x, center.y + 19);
        }
      }
    }
  }

  private _drawPerson(context: CanvasRenderingContext2D, point: ScreenPoint, person: HomePerson, colors: { live: string; approx: string; floor: string; text: string }): void {
    if (person.approximate) {
      context.beginPath();
      context.arc(point.x, point.y - 8, 10, 0, Math.PI * 2);
      context.fillStyle = colors.floor;
      context.fill();
      context.setLineDash([3, 3]);
      context.lineWidth = 2.5;
      context.strokeStyle = colors.approx;
      context.stroke();
      context.setLineDash([]);
      return;
    }
    context.beginPath();
    context.arc(point.x, point.y - 23, 5, 0, Math.PI * 2);
    context.fillStyle = colors.live;
    context.fill();
    context.beginPath();
    context.moveTo(point.x, point.y - 17);
    context.lineTo(point.x, point.y - 5);
    context.moveTo(point.x - 7, point.y - 13);
    context.lineTo(point.x + 7, point.y - 13);
    context.moveTo(point.x, point.y - 5);
    context.lineTo(point.x - 6, point.y + 4);
    context.moveTo(point.x, point.y - 5);
    context.lineTo(point.x + 6, point.y + 4);
    context.lineCap = 'round';
    context.lineWidth = 3;
    context.strokeStyle = colors.live;
    context.stroke();
  }

  private _setFloor(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this._config = { ...this._config, floor: value === 'all' ? 'all' : Number(value) };
  }

  private _roomStatusLabel(room: HomePresence['rooms'][number]): string {
    if (room.sensorCount === 0) return cardText(this.hass, 'No linked sensor');
    if (!room.available) return cardText(this.hass, 'Sensor unavailable');
    const occupancy = room.people > 0
      ? cardText(this.hass, room.people === 1 ? '{count} person present' : '{count} people present')
        .replace('{count}', String(room.people))
      : room.occupied ? cardText(this.hass, 'Room-level presence') : cardText(this.hass, 'Clear');
    if (room.unavailableSensorCount > 0) return `${occupancy}. ${this._partialOfflineLabel(room)}`;
    if (room.people > 0) {
      return cardText(this.hass, room.people === 1 ? '{count} person present' : '{count} people present')
        .replace('{count}', String(room.people));
    }
    if (room.occupied) return cardText(this.hass, 'Room-level presence');
    return cardText(this.hass, 'Clear');
  }

  private _partialOfflineLabel(room: HomePresence['rooms'][number]): string {
    return cardText(this.hass, '{offline} of {total} sensors offline')
      .replace('{offline}', String(room.unavailableSensorCount))
      .replace('{total}', String(room.sensorCount));
  }

  private _floorLabel(floor: number): string {
    return homeFloorLabel(this.hass, floor);
  }

  protected render() {
    const currentFloor = this._config.floor ?? 'all';
    const scopedRooms = this._presence.rooms.filter(room => room.visible
      && (currentFloor === 'all' || room.floor === Number(currentFloor)));
    const scopedRoomIds = new Set(scopedRooms.map(room => room.roomId));
    const people = this._presence.people.filter(person => !person.approximate && scopedRoomIds.has(person.roomId)).length;
    const activeRooms = scopedRooms.filter(room => room.occupied).length;
    const linkedSensors = scopedRooms.reduce((sum, room) => sum + room.linkedSensorCount, 0);
    const liveSensors = scopedRooms.reduce((sum, room) => sum + room.liveSensorCount, 0);
    const unavailableSensors = scopedRooms.reduce((sum, room) => sum + room.unavailableSensorCount, 0);
    const noLiveData = liveSensors === 0;
    const roomLevelOnly = people === 0 && activeRooms > 0;
    const peopleValue = noLiveData ? '—' : roomLevelOnly ? cardText(this.hass, 'Presence') : String(people);
    const peopleLabel = noLiveData ? 'Data unavailable' : roomLevelOnly ? 'Room level only' : 'tracked now';
    const liveClass = noLiveData ? 'offline' : unavailableSensors > 0 ? 'degraded' : '';
    const floors = [...new Set(this._rooms.map(room => room.house.floor))].sort((a, b) => a - b);
    return html`
      <ha-card>
        <div class="header">
          <div class="header-icon"><ha-icon icon="mdi:home-account"></ha-icon></div>
          <div class="header-copy">
            <div class="title" data-i18n-ignore=${this._config.title ? '' : nothing}>${this._config.title || cardText(this.hass, 'Live Home')}</div>
            <div class="subtitle">Whole-home presence from SmartHomeShop radar sensors</div>
          </div>
          ${this._config.show_summary !== false ? html`
            <div class="metrics">
              <div class="metric"><strong><i class="live-dot ${liveClass}"></i>${peopleValue}</strong><span>${cardText(this.hass, peopleLabel)}</span></div>
              <div class="metric"><strong>${activeRooms}</strong><span>${cardText(this.hass, activeRooms === 1 ? 'active room' : 'active rooms')}</span></div>
            </div>
          ` : nothing}
        </div>
        ${this._loading ? html`<div class="empty"><div><ha-icon icon="mdi:home-clock-outline"></ha-icon><h3>Building your live home...</h3></div></div>` : this._error && !this._rooms.length ? html`
          <div class="empty error"><div><ha-icon icon="mdi:alert-circle-outline"></ha-icon><h3>Live Home unavailable</h3><p>${this._error}</p><button style="width:auto;margin:14px auto 0;padding:0 12px" @click=${() => this._load(true)}>${cardText(this.hass, 'Try again')}</button></div></div>
        ` : !this._rooms.length ? html`
          <div class="empty"><div><ha-icon icon="mdi:floor-plan"></ha-icon><h3>Create your first room</h3><p>Draw or import rooms in SmartHomeShop Room Designer. This card combines them automatically.</p></div></div>
        ` : html`
          ${this._error && this._rooms.length ? html`<div class="setup-callout" role="status"><ha-icon icon="mdi:cloud-alert-outline"></ha-icon><span>${cardText(this.hass, 'Live Home is showing the last known layout. Refreshing failed; it will try again automatically.')}</span></div>` : nothing}
          ${linkedSensors === 0 ? html`<div class="setup-callout" role="status"><ha-icon icon="mdi:radar"></ha-icon><span>Rooms are ready, but no compatible radar sensor is linked yet. Open SmartHomeShop Room Designer to link a sensor.</span></div>`
            : liveSensors === 0 ? html`<div class="setup-callout" role="status"><ha-icon icon="mdi:radar-off"></ha-icon><span>${cardText(this.hass, 'Radar sensors are linked, but no live data is available. Check that the devices are online.')}</span></div>` : nothing}
          ${liveSensors > 0 && unavailableSensors > 0 ? html`<div class="setup-callout" role="status"><ha-icon icon="mdi:radar-off"></ha-icon><span>${cardText(this.hass, unavailableSensors === 1 ? '{count} radar sensor is offline or unavailable. Clear rooms remain separate from unavailable rooms.' : '{count} radar sensors are offline or unavailable. Clear rooms remain separate from unavailable rooms.').replace('{count}', String(unavailableSensors))}</span></div>` : nothing}
          <div class="toolbar">
            <select aria-label="Shown floor" @change=${this._setFloor}>
              <option value="all" ?selected=${currentFloor === 'all'}>All floors</option>
              ${floors.map(floor => html`<option value=${floor} ?selected=${currentFloor === floor}>${this._floorLabel(floor)}</option>`)}
            </select>
            <span class="toolbar-spacer"></span>
            <div class="legend"><span><i></i>Exact position</span><span><i class="approx"></i>Room presence</span></div>
            <button title="Rotate view" aria-label="Rotate view" @click=${() => { this._rotation = (this._rotation + 1) % 4; }}><ha-icon icon="mdi:rotate-3d-variant"></ha-icon></button>
          </div>
          <div class="canvas-wrap" style=${`height:${this._config.height || defaults.height}px`}><canvas role="img" aria-label="Live 3D home presence view"></canvas></div>
          ${this._config.show_room_status !== false ? html`<div class="room-strip" role="group" aria-label="Room status">
            ${this._presence.rooms.filter(room => room.visible && (currentFloor === 'all' || room.floor === Number(currentFloor))).map(room => html`
              <button
                class="room-pill ${room.occupied ? 'active' : ''} ${room.sensorCount > 0 && !room.available ? 'offline' : ''} ${room.available && room.unavailableSensorCount > 0 ? 'degraded' : ''} ${this._focusedRoomId === room.roomId ? 'selected' : ''}"
                aria-pressed=${this._focusedRoomId === room.roomId ? 'true' : 'false'}
                aria-label=${`${room.roomName}: ${this._roomStatusLabel(room)}`}
                @click=${() => { this._focusedRoomId = this._focusedRoomId === room.roomId ? null : room.roomId; }}
              ><i></i><span data-i18n-ignore>${room.roomName}</span>${room.people ? ` · ${room.people}` : room.occupied ? ` · ${cardText(this.hass, 'Presence')}` : room.sensorCount > 0 && !room.available ? ` · ${cardText(this.hass, 'Offline')}` : room.unavailableSensorCount > 0 ? ` · ${cardText(this.hass, 'Degraded')}` : ''}</button>
            `)}
          </div>` : nothing}
        `}
      </ha-card>
    `;
  }
}

export class SmartHomeShopHomePresenceCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: HomePresenceCardConfig = { ...defaults };
  @state() private _floors: number[] = [];
  protected readonly _localization = new CardLocalizationController(this, () => this.hass);
  private _floorsLoaded = false;
  private _floorsLoading = false;

  static styles = css`
    :host { display: block; padding: 8px 0; }
    .form { display: grid; gap: 16px; }
    .field { display: grid; gap: 6px; }
    label { color: var(--primary-text-color); font-size: 13px; font-weight: 600; }
    input[type="text"], input[type="number"], select { width: 100%; min-height: 42px; padding: 0 11px; border: 1px solid var(--divider-color); border-radius: 8px; color: var(--primary-text-color); background: var(--card-background-color); font: inherit; }
    .toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 42px; }
    .hint { color: var(--secondary-text-color); font-size: 11px; line-height: 1.4; }
  `;

  public setConfig(config: HomePresenceCardConfig): void {
    this._config = { ...defaults, ...config };
    if (!this._floorsLoaded) void this._loadFloors();
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('hass') && !this._floorsLoaded) void this._loadFloors();
  }

  private async _loadFloors(): Promise<void> {
    if (!this.hass || this._floorsLoading || this._floorsLoaded) return;
    this._floorsLoading = true;
    try {
      const response = await this.hass.callWS<RoomsResponse>({ type: 'smarthomeshop/rooms' });
      this._floors = [...new Set(placeHomeRooms(response.rooms || []).map(room => room.house.floor))].sort((a, b) => a - b);
    } catch { this._floors = []; }
    finally { this._floorsLoading = false; this._floorsLoaded = true; }
  }

  private _change(patch: Partial<HomePresenceCardConfig>): void {
    this._config = { ...this._config, ...patch };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  protected render() {
    const floor = this._config.floor ?? 'all';
    return html`<div class="form">
      <div class="field"><label for="home-title">Card title</label><input id="home-title" type="text" .value=${this._config.title || ''} placeholder="Live Home" @input=${(event: Event) => this._change({ title: (event.target as HTMLInputElement).value })}></div>
      <div class="field"><label for="home-floor">Shown floor</label><select id="home-floor" @change=${(event: Event) => this._change({ floor: (event.target as HTMLSelectElement).value === 'all' ? 'all' : Number((event.target as HTMLSelectElement).value) })}>
        <option value="all" ?selected=${floor === 'all'}>All floors</option>
        ${this._floors.map(value => html`<option value=${value} ?selected=${floor === value}>${homeFloorLabel(this.hass, value)}</option>`)}
      </select><span class="hint">Choose one floor or show the complete home.</span></div>
      <div class="field"><label for="home-height">View height (px)</label><input id="home-height" type="number" min="280" max="720" step="10" .value=${String(this._config.height || defaults.height)} @change=${(event: Event) => this._change({ height: Number((event.target as HTMLInputElement).value) })}></div>
      <div class="field"><label for="home-floor-spacing">Floor separation</label><input id="home-floor-spacing" type="range" min="0.55" max="1.4" step="0.05" .value=${String(this._config.floor_spacing || defaults.floor_spacing)} @input=${(event: Event) => this._change({ floor_spacing: Number((event.target as HTMLInputElement).value) })}><span class="hint"><span data-i18n-ignore>${Math.round((this._config.floor_spacing || defaults.floor_spacing) * 100)}%</span> · ${cardText(this.hass, 'Use less separation for a larger whole-home view.')}</span></div>
      ${this._toggle('Show room names', 'show_room_names')}
      ${this._toggle('Show empty rooms', 'show_empty_rooms')}
      ${this._toggle('Show live summary', 'show_summary')}
      ${this._toggle('Show room status', 'show_room_status')}
      <span class="hint">Rooms and radar sensors are managed in SmartHomeShop Room Designer. Exact positions are shown when the radar supplies coordinates; otherwise the card shows honest room-level presence.</span>
    </div>`;
  }

  private _toggle(label: string, key: 'show_room_names' | 'show_empty_rooms' | 'show_summary' | 'show_room_status') {
    return html`<label class="toggle"><span>${label}</span><input type="checkbox" .checked=${this._config[key] !== false} @change=${(event: Event) => this._change({ [key]: (event.target as HTMLInputElement).checked })}></label>`;
  }
}
