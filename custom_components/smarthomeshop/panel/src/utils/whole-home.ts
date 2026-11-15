import type {
  HousePlacement,
  Point,
  RadarDeviceProfilePayload,
  Room,
  RoomZone,
} from '../types';
import {
  normalizeRadarCoordinate,
  projectRadarTargetToRoom,
// Node's native TypeScript test runner needs the explicit extension. Rollup
// resolves the same source file when producing the Home Assistant bundle.
// @ts-ignore TS5097: the extension is intentional for direct source tests.
} from './radar-coordinates.ts';
import {
  safelyOutsideRoom,
// @ts-ignore TS5097: explicit extension is required by the direct source tests.
} from './reflection-protection.ts';

export interface RoomBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface WholeHomeRoom extends Room {
  house: HousePlacement;
}

export interface WholeHomePerson {
  id: string;
  roomId: string;
  roomName: string;
  x: number;
  y: number;
  floor: number;
  /** A room-centre marker is used when firmware only reports occupancy. */
  approximate: boolean;
  sourceDeviceId: string;
}

export interface WholeHomeRoomState {
  roomId: string;
  roomName: string;
  floor: number;
  people: number;
  /** False when multiple un-fused radars may be showing the same person. */
  peopleCountKnown: boolean;
  /** All linked sources reported complete, unambiguous position evidence. */
  trackingEvidenceComplete: boolean;
  approximate: boolean;
  sensorCount: number;
  linkedSensorCount: number;
  liveSensorCount: number;
  unavailableSensorCount: number;
  positioningSensorCount: number;
  occupied: boolean;
  available: boolean;
  visible: boolean;
}

export interface WholeHomePresence {
  people: WholeHomePerson[];
  rooms: WholeHomeRoomState[];
  linkedSensors: number;
  liveSensors: number;
  unavailableSensors: number;
}

/** Any visible marker in an uncertain room makes the aggregate number unsafe. */
export const hasUnknownVisiblePeopleCount = (
  rooms: WholeHomeRoomState[],
  people: WholeHomePerson[],
): boolean => {
  const roomsWithMarkers = new Set(people.map(person => person.roomId));
  return rooms.some(room => room.visible
    && !room.peopleCountKnown
    && (room.available === false || room.occupied || roomsWithMarkers.has(room.roomId)));
};

export interface WholeHomeRoomRuntime {
  presence?: {
    occupied?: boolean | null;
    status?: string;
    degraded?: boolean;
  };
}

export interface HouseSnapResult {
  placement: HousePlacement;
  guideX: number | null;
  guideY: number | null;
}

interface RoomSensorPlacement {
  id?: string;
  deviceId?: string | null;
  x?: number;
  y?: number;
  rotation?: number;
  heightMm?: number;
  mountingMode?: string;
  source_version?: number;
  capabilities?: Record<string, unknown>;
}

export interface WholeHomeStateValue {
  state: string;
  last_updated?: string;
  last_reported?: string;
  received_at_ms?: number;
}

type StateValue = string | WholeHomeStateValue | undefined;

const DEFAULT_ROOM_SIZE = 4000;
const ROOM_GAP = 700;
const INVALID_STATES = new Set(['', 'unknown', 'unavailable', 'none', 'null', 'nan']);

const finite = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const roomPolygon = (room: Room): Point[] => (Array.isArray(room.walls) ? room.walls : [])
  .filter(wall => typeof wall === 'object' && wall !== null)
  .map(wall => ({ x: finite(wall.x1), y: finite(wall.y1) }))
  .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

export const safeSuppressionRoomPolygon = (room: Pick<Room, 'walls'>): Point[] => {
  const walls = Array.isArray(room.walls) ? room.walls : [];
  if (walls.length < 3) return [];
  const segments = walls.map(wall => ({
    start: { x: Number(wall?.x1), y: Number(wall?.y1) },
    end: { x: Number(wall?.x2), y: Number(wall?.y2) },
  }));
  if (segments.some(segment => ![segment.start.x, segment.start.y, segment.end.x, segment.end.y].every(Number.isFinite)
    || Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y) <= 0.001)) return [];
  if (segments.some((segment, index) => {
    const next = segments[(index + 1) % segments.length];
    return Math.hypot(segment.end.x - next.start.x, segment.end.y - next.start.y) > 0.001;
  })) return [];
  const points = segments.map(segment => segment.start);
  if (points.some((point, index) => points.slice(index + 1).some(other =>
    Math.hypot(point.x - other.x, point.y - other.y) <= 0.001))) return [];
  const areaTwice = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  if (Math.abs(areaTwice) <= 0.001) return [];
  const cross = (a: Point, b: Point, c: Point): number =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const onSegment = (a: Point, b: Point, point: Point): boolean =>
    Math.abs(cross(a, b, point)) <= 0.000001
    && point.x >= Math.min(a.x, b.x) - 0.000001
    && point.x <= Math.max(a.x, b.x) + 0.000001
    && point.y >= Math.min(a.y, b.y) - 0.000001
    && point.y <= Math.max(a.y, b.y) + 0.000001;
  const intersectsOrTouches = (a: typeof segments[number], b: typeof segments[number]): boolean => {
    const a1 = cross(a.start, a.end, b.start);
    const a2 = cross(a.start, a.end, b.end);
    const b1 = cross(b.start, b.end, a.start);
    const b2 = cross(b.start, b.end, a.end);
    return (a1 * a2 < 0 && b1 * b2 < 0)
      || onSegment(a.start, a.end, b.start)
      || onSegment(a.start, a.end, b.end)
      || onSegment(b.start, b.end, a.start)
      || onSegment(b.start, b.end, a.end);
  };
  for (let first = 0; first < segments.length; first += 1) {
    for (let second = first + 1; second < segments.length; second += 1) {
      if (second === first + 1 || (first === 0 && second === segments.length - 1)) continue;
      const a = segments[first];
      const b = segments[second];
      if (intersectsOrTouches(a, b)) return [];
    }
  }
  if (segments.some((segment, index) => {
    const next = segments[(index + 1) % segments.length];
    return onSegment(segment.start, segment.end, next.end)
      && Math.hypot(next.end.x - segment.end.x, next.end.y - segment.end.y) > 0.001;
  })) return [];
  return points;
};

export const boundsForPoints = (points: Point[]): RoomBounds => {
  if (!points.length) {
    return {
      minX: -DEFAULT_ROOM_SIZE / 2,
      minY: -DEFAULT_ROOM_SIZE / 2,
      maxX: DEFAULT_ROOM_SIZE / 2,
      maxY: DEFAULT_ROOM_SIZE / 2,
      width: DEFAULT_ROOM_SIZE,
      height: DEFAULT_ROOM_SIZE,
    };
  }
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(100, maxX - minX),
    height: Math.max(100, maxY - minY),
  };
};

export const roomBounds = (room: Room): RoomBounds => boundsForPoints(roomPolygon(room));

export const normaliseQuarterTurn = (value: unknown): 0 | 90 | 180 | 270 => {
  const turns = ((Math.round(finite(value) / 90) % 4) + 4) % 4;
  return (turns * 90) as 0 | 90 | 180 | 270;
};

export const normaliseHousePlacement = (
  placement: Partial<HousePlacement> | null | undefined,
): HousePlacement => ({
  x: finite(placement?.x),
  y: finite(placement?.y),
  floor: Math.max(-5, Math.min(20, Math.round(finite(placement?.floor)))),
  rotationDeg: normaliseQuarterTurn(placement?.rotationDeg),
  visible: placement?.visible !== false,
});

export const transformHomePoint = (point: Point, placement: HousePlacement): Point => {
  const radians = placement.rotationDeg * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: placement.x + point.x * cos - point.y * sin,
    y: placement.y + point.x * sin + point.y * cos,
  };
};

const placedRoomPolygon = (room: Room, placement = normaliseHousePlacement(room.house)): Point[] =>
  roomPolygon(room).map(point => transformHomePoint(point, placement));

const boundsForPlacedRoom = (room: Room, placement = normaliseHousePlacement(room.house)): RoomBounds =>
  boundsForPoints(placedRoomPolygon(room, placement));

const properSegmentIntersection = (a: Point, b: Point, c: Point, d: Point): boolean => {
  const cross = (first: Point, second: Point, third: Point): number =>
    (second.x - first.x) * (third.y - first.y) - (second.y - first.y) * (third.x - first.x);
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0))
    && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
};

const strictlyInsidePolygon = (point: Point, polygon: Point[]): boolean => {
  const epsilon = 0.001;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const cross = (point.x - start.x) * (end.y - start.y) - (point.y - start.y) * (end.x - start.x);
    const dot = (point.x - start.x) * (point.x - end.x) + (point.y - start.y) * (point.y - end.y);
    if (Math.abs(cross) <= epsilon && dot <= epsilon) return false;
  }
  return pointInPolygon(point, polygon);
};

const polygonsOverlap = (first: Point[], second: Point[]): boolean => {
  if (first.length < 3 || second.length < 3) return false;
  const firstBounds = boundsForPoints(first);
  const secondBounds = boundsForPoints(second);
  // Rooms that merely share a wall are valid neighbours, not an overlap.
  if (Math.min(firstBounds.maxX, secondBounds.maxX) - Math.max(firstBounds.minX, secondBounds.minX) <= 1
    || Math.min(firstBounds.maxY, secondBounds.maxY) - Math.max(firstBounds.minY, secondBounds.minY) <= 1) return false;
  for (let firstIndex = 0; firstIndex < first.length; firstIndex += 1) {
    const firstNext = (firstIndex + 1) % first.length;
    for (let secondIndex = 0; secondIndex < second.length; secondIndex += 1) {
      const secondNext = (secondIndex + 1) % second.length;
      if (properSegmentIntersection(first[firstIndex], first[firstNext], second[secondIndex], second[secondNext])) return true;
    }
  }
  if (first.some(point => strictlyInsidePolygon(point, second))
    || second.some(point => strictlyInsidePolygon(point, first))) return true;
  // Identical polygons and collinear containment have no proper edge crossing
  // and can start on each other's boundary. Sample the cells formed by both
  // sets of vertices; rooms that only share a wall have no shared cell area.
  const xs = [...new Set([...first, ...second].map(point => point.x))].sort((a, b) => a - b);
  const ys = [...new Set([...first, ...second].map(point => point.y))].sort((a, b) => a - b);
  for (let xIndex = 0; xIndex < xs.length - 1; xIndex += 1) {
    if (xs[xIndex + 1] - xs[xIndex] <= 1) continue;
    for (let yIndex = 0; yIndex < ys.length - 1; yIndex += 1) {
      if (ys[yIndex + 1] - ys[yIndex] <= 1) continue;
      const sample = { x: (xs[xIndex] + xs[xIndex + 1]) / 2, y: (ys[yIndex] + ys[yIndex + 1]) / 2 };
      if (strictlyInsidePolygon(sample, first) && strictlyInsidePolygon(sample, second)) return true;
    }
  }
  return false;
};

/** Return room IDs whose floor-plan polygons overlap on the same floor. */
export const overlappingRoomIds = (rooms: WholeHomeRoom[], floor: number | null = null): Set<string> => {
  const visible = rooms.filter(room => room.house.visible !== false && (floor === null || room.house.floor === floor));
  const result = new Set<string>();
  for (let first = 0; first < visible.length; first += 1) {
    for (let second = first + 1; second < visible.length; second += 1) {
      if (visible[first].house.floor !== visible[second].house.floor) continue;
      if (!polygonsOverlap(placedRoomPolygon(visible[first]), placedRoomPolygon(visible[second]))) continue;
      result.add(visible[first].id);
      result.add(visible[second].id);
    }
  }
  return result;
};

/**
 * Magnetically align a moved room to the nearest edge or centre of another
 * room on the same floor. Grid snapping is handled by the caller first.
 */
export const snapHousePlacement = (
  room: WholeHomeRoom,
  placement: HousePlacement,
  rooms: WholeHomeRoom[],
  threshold = 140,
): HouseSnapResult => {
  const candidate = boundsForPlacedRoom(room, placement);
  const axes = (box: RoomBounds): number[] => [box.minX, (box.minX + box.maxX) / 2, box.maxX];
  let bestX: { delta: number; guide: number } | null = null;
  let bestY: { delta: number; guide: number } | null = null;
  for (const other of rooms) {
    if (other.id === room.id || other.house.visible === false || other.house.floor !== placement.floor) continue;
    const otherBounds = boundsForPlacedRoom(other);
    for (const source of axes(candidate)) {
      for (const target of axes(otherBounds)) {
        const delta = target - source;
        if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) bestX = { delta, guide: target };
      }
    }
    const candidateY = [candidate.minY, (candidate.minY + candidate.maxY) / 2, candidate.maxY];
    const otherY = [otherBounds.minY, (otherBounds.minY + otherBounds.maxY) / 2, otherBounds.maxY];
    for (const source of candidateY) {
      for (const target of otherY) {
        const delta = target - source;
        if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) bestY = { delta, guide: target };
      }
    }
  }
  return {
    placement: normaliseHousePlacement({
      ...placement,
      x: placement.x + (bestX?.delta || 0),
      y: placement.y + (bestY?.delta || 0),
    }),
    guideX: bestX?.guide ?? null,
    guideY: bestY?.guide ?? null,
  };
};

export const inverseTransformHomePoint = (point: Point, placement: HousePlacement): Point => {
  const radians = -placement.rotationDeg * Math.PI / 180;
  const dx = point.x - placement.x;
  const dy = point.y - placement.y;
  return {
    x: dx * Math.cos(radians) - dy * Math.sin(radians),
    y: dx * Math.sin(radians) + dy * Math.cos(radians),
  };
};

export const autoArrangeRooms = (rooms: Room[]): WholeHomeRoom[] => {
  const byFloor = new Map<number, Room[]>();
  rooms.forEach(room => {
    const floor = normaliseHousePlacement(room.house).floor;
    const group = byFloor.get(floor) || [];
    group.push(room);
    byFloor.set(floor, group);
  });

  const arranged = new Map<string, WholeHomeRoom>();
  for (const [floor, floorRooms] of byFloor) {
    const totalArea = floorRooms.reduce((sum, room) => {
      const bounds = roomBounds(room);
      return sum + bounds.width * bounds.height;
    }, 0);
    const targetRowWidth = Math.max(6000, Math.sqrt(totalArea) * 1.65);
    let cursorX = 0;
    let cursorY = 0;
    let rowHeight = 0;

    floorRooms.forEach(room => {
      const bounds = roomBounds(room);
      if (cursorX > 0 && cursorX + bounds.width > targetRowWidth) {
        cursorX = 0;
        cursorY += rowHeight + ROOM_GAP;
        rowHeight = 0;
      }
      const placement: HousePlacement = {
        x: cursorX - bounds.minX,
        y: cursorY - bounds.minY,
        floor,
        rotationDeg: 0,
        visible: room.house?.visible !== false,
      };
      arranged.set(room.id, { ...room, house: placement });
      cursorX += bounds.width + ROOM_GAP;
      rowHeight = Math.max(rowHeight, bounds.height);
    });
  }
  return rooms.map(room => arranged.get(room.id) || { ...room, house: normaliseHousePlacement(room.house) });
};

export const roomsWithHousePlacement = (rooms: Room[]): WholeHomeRoom[] => {
  const placed = new Map<string, WholeHomeRoom>();
  rooms.filter(room => room.house).forEach(room => placed.set(room.id, {
    ...room,
    house: normaliseHousePlacement(room.house),
  }));
  const floors = new Set(rooms.map(room => normaliseHousePlacement(room.house).floor));
  for (const floor of floors) {
    const missing = rooms.filter(room => !room.house && normaliseHousePlacement(room.house).floor === floor);
    if (!missing.length) continue;
    const existing = [...placed.values()].filter(room => room.house.floor === floor);
    if (!existing.length) {
      autoArrangeRooms(missing).forEach(room => placed.set(room.id, room));
      continue;
    }
    const existingBounds = existing.map(room => boundsForPlacedRoom(room));
    let cursorX = Math.max(...existingBounds.map(box => box.maxX)) + ROOM_GAP;
    const cursorY = Math.min(...existingBounds.map(box => box.minY));
    for (const room of missing) {
      const box = roomBounds(room);
      const house = normaliseHousePlacement({
        x: cursorX - box.minX,
        y: cursorY - box.minY,
        floor,
        rotationDeg: 0,
        visible: true,
      });
      placed.set(room.id, { ...room, house });
      cursorX += box.width + ROOM_GAP;
    }
  }
  return rooms.map(room => placed.get(room.id) || { ...room, house: normaliseHousePlacement(room.house) });
};

export const houseLayoutFingerprint = (rooms: WholeHomeRoom[]): string => JSON.stringify(rooms.map(room => [
  room.id,
  room.house.x,
  room.house.y,
  room.house.floor,
  room.house.rotationDeg,
  room.house.visible !== false,
]));

/** Restore only Live Home-owned placement data, retaining fresh room revisions and Designer fields. */
export const restoreHouseSnapshot = (
  currentRooms: WholeHomeRoom[],
  snapshotRooms: WholeHomeRoom[],
): WholeHomeRoom[] => {
  const snapshotById = new Map(snapshotRooms.map(room => [room.id, room.house]));
  return currentRooms.map(room => {
    const house = snapshotById.get(room.id);
    return house ? { ...room, house: { ...house } } : room;
  });
};

export const floorLabel = (floor: number): string => {
  if (floor === 0) return 'Ground floor';
  if (floor < 0) return floor === -1 ? 'Basement' : `Basement ${Math.abs(floor)}`;
  return floor === 1 ? 'First floor' : `Floor ${floor}`;
};

const roomSensors = (room: Room): RoomSensorPlacement[] => {
  const sensors = Array.isArray(room.sensors) ? room.sensors as RoomSensorPlacement[] : [];
  if (sensors.length) return sensors.filter(sensor => typeof sensor === 'object' && sensor !== null);
  const legacy = (room as Room & { sensor?: RoomSensorPlacement | null }).sensor;
  return legacy ? [legacy] : [];
};

const profileForSensor = (
  profiles: RadarDeviceProfilePayload[],
  deviceId: string,
): RadarDeviceProfilePayload | undefined => profiles.find(profile =>
  profile.device_id === deviceId
  || profile.entity_prefix === deviceId
  || profile.aliases.includes(deviceId));

const conflictingDeviceRoomIds = (
  rooms: WholeHomeRoom[],
  profiles: RadarDeviceProfilePayload[],
): Set<string> => {
  const owners = new Map<string, Set<string>>();
  for (const room of rooms) {
    for (const sensor of roomSensors(room)) {
      if (!sensor.deviceId) continue;
      const physicalId = profileForSensor(profiles, sensor.deviceId)?.device_id || sensor.deviceId;
      const roomIds = owners.get(physicalId) || new Set<string>();
      roomIds.add(room.id);
      owners.set(physicalId, roomIds);
    }
  }
  return new Set([...owners.values()].filter(roomIds => roomIds.size > 1).flatMap(roomIds => [...roomIds]));
};

const stateText = (value: StateValue): string => typeof value === 'object' && value !== null
  ? String(value.state || '')
  : String(value || '');

const isFresh = (value: StateValue, freshnessSeconds: number, nowMs: number): boolean => {
  if (typeof value !== 'object' || value === null) return true;
  if (Object.prototype.hasOwnProperty.call(value, 'received_at_ms')) {
    const receivedAt = Number(value.received_at_ms);
    return Number.isFinite(receivedAt)
      && receivedAt <= nowMs
      && nowMs - receivedAt <= freshnessSeconds * 1000;
  }
  // last_updated measures value changes, not reports. Never make a steady
  // valid state stale just because the number or binary value did not change.
  if (!value.last_reported) return true;
  const reportedMs = Date.parse(value.last_reported);
  if (!Number.isFinite(reportedMs) || reportedMs > nowMs + 300_000) return false;
  return nowMs - reportedMs <= freshnessSeconds * 1000;
};

const nonFutureState = (value: StateValue, nowMs: number): StateValue => {
  if (!validLiveState(value)) return undefined;
  if (typeof value !== 'object' || value === null) return value;
  if (Object.prototype.hasOwnProperty.call(value, 'received_at_ms')) {
    const receivedAt = Number(value.received_at_ms);
    return Number.isFinite(receivedAt) && receivedAt <= nowMs ? value : undefined;
  }
  const timestamp = value.last_reported || value.last_updated;
  if (!timestamp) return value;
  const reportedAt = Date.parse(timestamp);
  return Number.isFinite(reportedAt) && reportedAt <= nowMs ? value : undefined;
};

export class EntityReportReceiptTracker {
  private readonly receipts = new Map<string, { signature: string; receivedAtMs: number }>();

  state(
    entityId: string,
    value: WholeHomeStateValue | undefined,
    nowMs = Date.now(),
    serverNowMs = nowMs,
  ): WholeHomeStateValue | undefined {
    if (!value) return undefined;
    const timestamp = value.last_reported || value.last_updated || '';
    const reportedAtMs = Date.parse(timestamp);
    const serverReferenceMs = Number.isFinite(serverNowMs) ? serverNowMs : nowMs;
    const validityLimitMs = Math.max(nowMs, serverReferenceMs);
    if (!Number.isFinite(reportedAtMs)
      || reportedAtMs > validityLimitMs
      || reportedAtMs > serverReferenceMs + 10_000) {
      return { ...value, received_at_ms: Number.NaN };
    }
    const normalizedReceivedAt = nowMs - Math.max(0, serverReferenceMs - reportedAtMs);
    const signature = `${timestamp}|${value.state}`;
    const existing = this.receipts.get(entityId);
    if (!existing || existing.signature !== signature) {
      this.receipts.set(entityId, { signature, receivedAtMs: normalizedReceivedAt });
      return { ...value, received_at_ms: normalizedReceivedAt };
    }
    return { ...value, received_at_ms: existing.receivedAtMs };
  }

  clear(): void { this.receipts.clear(); }
}

export const latestReportTimestamp = (
  values: WholeHomeStateValue[],
  fallback = Date.now(),
): number => {
  const timestamps = values
    .map(value => Date.parse(value.last_reported || value.last_updated || ''))
    .filter(Number.isFinite);
  return timestamps.length ? Math.max(...timestamps) : fallback;
};

/** Derive HA time without allowing the coordinates being judged to set it. */
export const latestIndependentReportTimestamp = (
  states: Record<string, WholeHomeStateValue>,
  excludedEntityIds: ReadonlySet<string>,
  fallback = Date.now(),
): number => latestReportTimestamp(
  Object.entries(states)
    .filter(([entityId]) => !excludedEntityIds.has(entityId))
    .map(([, state]) => state),
  fallback,
);

/** Evidence being judged can never advance the reference clock that validates it. */
type RadarEvidenceProfile = {
  profile: {
    tracking_presence_entity_id?: string | null;
    tracking_target_count_entity_id?: string | null;
    reported_installation_mode_entity_id?: string | null;
    supplementary_presence_sensors?: string[];
    trackingPresenceEntityId?: string | null;
    trackingTargetCountEntityId?: string | null;
    supplementaryPresenceSensors?: string[];
  };
  targets: RadarDeviceProfilePayload['targets'];
};

export const radarEvidenceEntityIds = (
  profiles: RadarEvidenceProfile[],
): Set<string> => new Set(profiles.flatMap(device => {
  const profile = device.profile;
  const presence = profile.tracking_presence_entity_id ?? profile.trackingPresenceEntityId;
  const count = profile.tracking_target_count_entity_id ?? profile.trackingTargetCountEntityId;
  const reportedMode = profile.reported_installation_mode_entity_id;
  const supplementary = profile.supplementary_presence_sensors ?? profile.supplementaryPresenceSensors;
  return [
    presence,
    count,
    reportedMode,
    ...(supplementary || []),
    ...device.targets.flatMap(target => [
      target.x_entity_id,
      target.y_entity_id,
      target.z_entity_id,
      target.presence_entity_id,
    ]),
  ].filter((entityId): entityId is string => Boolean(entityId));
}));

const isOn = (value: StateValue): boolean => stateText(value).toLowerCase() === 'on';

const validLiveState = (value: StateValue): boolean =>
  !INVALID_STATES.has(stateText(value).trim().toLowerCase());

const pointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const a = polygon[current];
    const b = polygon[previous];
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || Number.EPSILON) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
};

const excludedByRoomZone = (room: Room, point: Point, sourceId?: string): boolean => (Array.isArray(room.zones) ? room.zones : [])
  .filter((zone): zone is RoomZone => {
    if (typeof zone !== 'object' || zone === null || zone.type !== 'exclusion') return false;
    const owner = zone.sensorId || (zone as RoomZone & { sensor_id?: string }).sensor_id;
    return !owner || owner === sourceId;
  })
  .some(zone => [Array.isArray(zone.points) ? zone.points : [], ...(Array.isArray(zone.parts) ? zone.parts : [])]
    .some(part => Array.isArray(part) && part.length >= 3 && pointInPolygon(point, part)));

export const polygonInteriorPoint = (polygon: Point[]): Point => {
  const bounds = boundsForPoints(polygon);
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  if (polygon.length < 3 || pointInPolygon(center, polygon)) return center;
  // Scan between every pair of polygon Y levels. Every non-degenerate simple
  // polygon has an interior interval on at least one such scanline, including
  // very narrow L-shaped corridors that a fixed grid can miss.
  let best: Point | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const yLevels = [...new Set(polygon.map(point => point.y))].sort((a, b) => a - b);
  for (let level = 0; level < yLevels.length - 1; level += 1) {
    if (yLevels[level + 1] - yLevels[level] < .001) continue;
    const y = (yLevels[level] + yLevels[level + 1]) / 2;
    const intersections: number[] = [];
    for (let index = 0; index < polygon.length; index += 1) {
      const a = polygon[index];
      const b = polygon[(index + 1) % polygon.length];
      if ((a.y > y) === (b.y > y)) continue;
      intersections.push(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y));
    }
    intersections.sort((a, b) => a - b);
    for (let index = 0; index + 1 < intersections.length; index += 2) {
      const candidate = { x: (intersections[index] + intersections[index + 1]) / 2, y };
      const distance = Math.hypot(candidate.x - center.x, candidate.y - center.y);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best || polygon[0] || center;
};

export const roomInteriorPoint = (room: Room): Point => polygonInteriorPoint(roomPolygon(room));

const deduplicatePeople = (
  people: WholeHomePerson[],
  _rooms: WholeHomeRoom[],
  _positioningSources: Map<string, RoomSensorPlacement[]>,
): WholeHomePerson[] => [...people];

export const collectWholeHomePresence = (
  rooms: WholeHomeRoom[],
  profiles: RadarDeviceProfilePayload[],
  getState: (entityId: string) => StateValue,
  nowMs = Date.now(),
  runtimeByRoom: Record<string, WholeHomeRoomRuntime> = {},
  runtimeAvailable = true,
): WholeHomePresence => {
  const people: WholeHomePerson[] = [];
  let linkedSensors = 0;
  let liveSensors = 0;
  let unavailableSensors = 0;

  const sensorStatus = new Map<string, {
    linked: number;
    live: number;
    unavailable: number;
    positioning: number;
    positive: number;
    negative: number;
    unknown: number;
  }>();
  const positioningSources = new Map<string, RoomSensorPlacement[]>();
  const incompletePositioningRooms = new Set<string>();
  const incompletePresenceRooms = new Set<string>();
  const unsafeClearEvidenceRooms = new Set<string>();
  const ambiguousSupplementaryRooms = new Set<string>();
  const geometrySuppressedRooms = new Set<string>();
  const conflictingRoomIds = conflictingDeviceRoomIds(rooms, profiles);
  const addPositioningSource = (
    roomId: string,
    sensor: RoomSensorPlacement,
    profile?: RadarDeviceProfilePayload,
  ): void => {
    if (!sensor.id) return;
    const installationHeightM = profile?.profile.installation_height_m;
    const installationAngleDeg = profile?.profile.installation_angle_deg;
    const hasInstallationHeight = installationHeightM !== null
      && installationHeightM !== undefined
      && Number.isFinite(Number(installationHeightM));
    const hasInstallationAngle = installationAngleDeg !== null
      && installationAngleDeg !== undefined
      && Number.isFinite(Number(installationAngleDeg));
    const enriched: RoomSensorPlacement = profile ? {
      ...sensor,
      heightMm: hasInstallationHeight
        ? Math.round(Number(installationHeightM) * 1000)
        : sensor.heightMm,
      capabilities: {
        ...(sensor.capabilities || {}),
        radar_model: profile.profile.radar_model || '',
        coordinate_frame: profile.profile.coordinate_frame || '',
        coordinate_projection: profile.profile.coordinate_projection,
        installation_mode: profile.profile.current_hardware_mode || '',
        installation_height_mm: hasInstallationHeight
          ? Math.round(Number(installationHeightM) * 1000)
          : finite(sensor.capabilities?.installation_height_mm),
        installation_angle_tenths: hasInstallationAngle
          ? Math.round(Number(installationAngleDeg) * 10)
          : finite(sensor.capabilities?.installation_angle_tenths),
      },
    } : sensor;
    const current = positioningSources.get(roomId) || [];
    positioningSources.set(roomId, [
      ...current.filter(source => source.id !== sensor.id),
      enriched,
    ]);
  };

  for (const room of rooms) {
    const sensors = roomSensors(room);
    const coordinateFreshnessSeconds = Math.max(1, Math.min(
      15,
      finite(room.aggregation?.tracking?.observation_freshness_ms, 5000) / 1000,
    ));
    const selectedPresenceSources = new Set(room.aggregation?.presence?.source_ids || []);
    for (const [sensorOffset, sensor] of sensors.entries()) {
      if (!sensor.deviceId) continue;
      const roomStatus = sensorStatus.get(room.id) || {
        linked: 0, live: 0, unavailable: 0, positioning: 0,
        positive: 0, negative: 0, unknown: 0,
      };
      const profile = profileForSensor(profiles, sensor.deviceId);
      if (!profile) {
        if (sensor.id && sensor.capabilities?.positioning === true) {
          addPositioningSource(room.id, sensor);
        }
        unavailableSensors += 1;
        roomStatus.unavailable += 1;
        if (!selectedPresenceSources.size || (sensor.id && selectedPresenceSources.has(sensor.id))) {
          roomStatus.unknown += 1;
        }
        sensorStatus.set(room.id, roomStatus);
        continue;
      }
      linkedSensors += 1;
      roomStatus.linked += 1;
      if (profile.profile.positioning_available !== false && profile.targets.length && sensor.id) {
        addPositioningSource(room.id, sensor, profile);
      }
      sensorStatus.set(room.id, roomStatus);
      const availableState = (entityId: string | null | undefined): StateValue => {
        if (!entityId) return undefined;
        const value = getState(entityId);
        return validLiveState(value) ? value : undefined;
      };
      const presenceEntity = profile.profile.tracking_presence_entity_id;
      const presenceState = nonFutureState(availableState(presenceEntity), nowMs);
      const supplementaryStates = (profile.profile.supplementary_presence_sensors || [])
        .map(entityId => nonFutureState(availableState(entityId), nowMs));
      const configuredPresenceStates = [
        ...(presenceEntity ? [presenceState] : []),
        ...supplementaryStates,
      ];
      const presenceInputsComplete = configuredPresenceStates.every(validLiveState);
      const targetEvidence = profile.targets.map(target => {
        const rawX = nonFutureState(availableState(target.x_entity_id), nowMs);
        const rawY = nonFutureState(availableState(target.y_entity_id), nowMs);
        const reportedX = normalizeRadarCoordinate(stateText(rawX), profile.profile.coordinate_scale_to_mm || 1);
        const reportedY = normalizeRadarCoordinate(stateText(rawY), profile.profile.coordinate_scale_to_mm || 1);
        const pairFresh = isFresh(rawX, coordinateFreshnessSeconds, nowMs)
          && isFresh(rawY, coordinateFreshnessSeconds, nowMs);
        const targetPresenceAvailable = nonFutureState(
          availableState(target.presence_entity_id), nowMs,
        );
        return {
          target,
          targetPresence: isFresh(targetPresenceAvailable, coordinateFreshnessSeconds, nowMs)
            ? targetPresenceAvailable
            : undefined,
          targetPresenceAvailable,
          coordinatesAvailable: validLiveState(rawX) && validLiveState(rawY),
          x: pairFresh ? reportedX : null,
          y: pairFresh ? reportedY : null,
          reportedX,
          reportedY,
          staleCoordinates: !pairFresh && reportedX !== null && reportedY !== null,
        };
      });
      const reportedModeEntityId = profile.profile.reported_installation_mode_entity_id;
      const liveModeText = stateText(nonFutureState(
        availableState(reportedModeEntityId), nowMs,
      )).trim().toLowerCase();
      const currentHardwareMode = reportedModeEntityId
        ? (liveModeText === 'side' || liveModeText === 'top' ? liveModeText : null)
        : profile.profile.current_hardware_mode;
      const rawPlacement = sensor as unknown as Record<string, unknown>;
      const placementTrusted = ['x', 'y', 'x_m', 'y_m', 'rotation', 'orientation_deg']
        .every(field => !(field in rawPlacement)
          || rawPlacement[field] === null
          || rawPlacement[field] === undefined
          || Number.isFinite(Number(rawPlacement[field])));
      const geometryTrusted = placementTrusted && !(
        ['ld2460', 'ld6002b'].includes(profile.profile.radar_model || '')
        && ['side', 'top'].includes(profile.profile.required_installation_mode || '')
        && currentHardwareMode !== profile.profile.required_installation_mode
      );
      if (!geometryTrusted) incompletePositioningRooms.add(room.id);
      const targetHasLiveCoordinates = targetEvidence.some(
        evidence => evidence.x !== null && evidence.y !== null,
      );
      const hasLiveState = (presenceEntity ? validLiveState(presenceState) : false)
        || supplementaryStates.some(validLiveState)
        || targetHasLiveCoordinates;
      if (hasLiveState) {
        liveSensors += 1;
        roomStatus.live += 1;
        if (targetHasLiveCoordinates && profile.profile.positioning_available !== false) {
          roomStatus.positioning += 1;
        }
      } else {
        unavailableSensors += 1;
        roomStatus.unavailable += 1;
      }
      const targetEvidenceComplete = targetEvidence.every((evidence) => {
        const targetPresenceAvailable = evidence.target.presence_entity_id
          ? validLiveState(evidence.targetPresence)
          : false;
        if (evidence.target.presence_entity_id) {
          if (!targetPresenceAvailable) return false;
          if (evidence.x !== null && evidence.y !== null) {
            const coordinatePositive = evidence.x !== 0 || evidence.y !== 0;
            return coordinatePositive === isOn(evidence.targetPresence);
          }
          return !isOn(evidence.targetPresence);
        }
        if (evidence.x !== null && evidence.y !== null) return true;
        return false;
      });
      if (profile.profile.positioning_available !== false
        && profile.targets.length
        && !targetEvidenceComplete) {
        incompletePositioningRooms.add(room.id);
      }

      const roomPeople: WholeHomePerson[] = [];
      let suppressedCoordinateCount = 0;
      let unpositionedPositive = false;
      for (const { target, targetPresence, x, y, reportedX, reportedY, staleCoordinates } of targetEvidence) {
        const targetExplicitlyOn = Boolean(target.presence_entity_id && isOn(targetPresence));
        // A positive slot is stronger evidence than a conflicting aggregate
        // switch. Keep the person visible and make the room conservative.
        // An explicit per-target clear cannot explain a positive aggregate
        // count and must never consume an exclusion/suppression slot.
        if (x === null || y === null) {
          if (!target.presence_entity_id
            && staleCoordinates
            && reportedX === 0
            && reportedY === 0) continue;
          const staleNonzero = staleCoordinates && (reportedX !== 0 || reportedY !== 0);
          if (targetExplicitlyOn
            || (!target.presence_entity_id && staleNonzero
              && (isOn(presenceState) || !presenceEntity))) {
            unpositionedPositive = true;
          }
          continue;
        }
        if (x === 0 && y === 0) {
          if (targetExplicitlyOn) unpositionedPositive = true;
          continue;
        }
        if (!geometryTrusted) {
          unpositionedPositive = true;
          continue;
        }
        const local = projectRadarTargetToRoom(
          { x, y },
          { x: finite(sensor.x), y: finite(sensor.y), rotation: finite(sensor.rotation) },
          profile.profile.coordinate_projection,
        );
        const polygon = safeSuppressionRoomPolygon(room);
        if (safelyOutsideRoom(local, polygon) || excludedByRoomZone(room, local, sensor.id)) {
          suppressedCoordinateCount += 1;
          continue;
        }
        const global = transformHomePoint(local, room.house);
        roomPeople.push({
          id: `${room.id}:${profile.device_id}:${target.index}`,
          roomId: room.id,
          roomName: room.name,
          x: global.x,
          y: global.y,
          floor: room.house.floor,
          approximate: false,
          sourceDeviceId: profile.device_id,
        });
      }

      const countState = nonFutureState(
        availableState(profile.profile.tracking_target_count_entity_id), nowMs,
      );
      const parsedCount = Number(stateText(countState));
      const reportedCount = validLiveState(countState)
        && isFresh(countState, coordinateFreshnessSeconds, nowMs)
        && Number.isInteger(parsedCount)
        && parsedCount >= 0
        ? parsedCount
        : null;
      if (profile.profile.tracking_target_count_entity_id && reportedCount === null) {
        incompletePositioningRooms.add(room.id);
      }
      if (reportedCount !== null
        && reportedCount !== roomPeople.length + suppressedCoordinateCount) {
        incompletePositioningRooms.add(room.id);
      }
      if (reportedCount !== null
        && reportedCount > roomPeople.length + suppressedCoordinateCount) {
        unpositionedPositive = true;
      }
      const explicitPositiveCount = targetEvidence.filter(evidence =>
        Boolean(evidence.target.presence_entity_id) && isOn(evidence.targetPresence)).length;
      const explicitTargetContractComplete = targetEvidence.length > 0 && targetEvidence.every(evidence =>
        Boolean(evidence.target.presence_entity_id) && validLiveState(evidence.targetPresence));
      const countExplainsSuppression = reportedCount !== null
        && reportedCount > 0
        && suppressedCoordinateCount === reportedCount
        && roomPeople.length === 0
        && !unpositionedPositive;
      const explicitContractExplainsSuppression = explicitTargetContractComplete
        && explicitPositiveCount > 0
        && suppressedCoordinateCount === explicitPositiveCount
        && roomPeople.length === 0
        && !unpositionedPositive;
      const suppressionExplainsPresence = profile.profile.tracking_target_count_entity_id
        ? countExplainsSuppression
        : explicitContractExplainsSuppression;
      const supplementaryPresence = supplementaryStates.some(isOn);
      if (!presenceInputsComplete) incompletePresenceRooms.add(room.id);
      if (supplementaryPresence && roomPeople.length > 0) {
        ambiguousSupplementaryRooms.add(room.id);
      }
      if (unpositionedPositive
        || (!roomPeople.length
          && (supplementaryPresence || (!suppressionExplainsPresence && isOn(presenceState))))) {
        const center = transformHomePoint(roomInteriorPoint(room), room.house);
        roomPeople.push({
          id: `${room.id}:${profile.device_id}:${unpositionedPositive ? 'unpositioned' : `room-${sensorOffset}`}`,
          roomId: room.id,
          roomName: room.name,
          x: center.x,
          y: center.y,
          floor: room.house.floor,
          approximate: true,
          sourceDeviceId: profile.device_id,
        });
      }
      const participatesInPresence = !selectedPresenceSources.size
        || Boolean(sensor.id && selectedPresenceSources.has(sensor.id));
      if (participatesInPresence) {
        const targetContractAvailable = targetEvidence.every(evidence =>
          evidence.coordinatesAvailable
          && (!evidence.target.presence_entity_id
            || validLiveState(evidence.targetPresenceAvailable)));
        const countContractAvailable = !profile.profile.tracking_target_count_entity_id
          || (validLiveState(countState)
            && Number.isInteger(parsedCount)
            && parsedCount >= 0);
        if (!presenceInputsComplete
          || !targetContractAvailable
          || !countContractAvailable
          || !geometryTrusted) {
          unsafeClearEvidenceRooms.add(room.id);
        }
        if (suppressionExplainsPresence) geometrySuppressedRooms.add(room.id);
        const presenceInputs = suppressionExplainsPresence
          ? supplementaryStates
          : [presenceState, ...supplementaryStates];
        const sourceClearEvidenceComplete = presenceInputsComplete
          && (!profile.profile.tracking_target_count_entity_id || reportedCount !== null)
          && targetEvidenceComplete;
        if (roomPeople.length || presenceInputs.some(isOn)) {
          roomStatus.positive += 1;
        } else if (!sourceClearEvidenceComplete) {
          roomStatus.unknown += 1;
        } else if (suppressionExplainsPresence && presenceInputs.length === 0) {
          roomStatus.negative += 1;
        } else if (presenceInputs.length > 0 && presenceInputs.every(value => validLiveState(value) && !isOn(value))) {
          roomStatus.negative += 1;
        } else {
          roomStatus.unknown += 1;
        }
      }
      if (room.house.visible !== false) people.push(...roomPeople);
    }
  }

  const deduplicated = deduplicatePeople(people, rooms, positioningSources)
    .filter(person => !conflictingRoomIds.has(person.roomId));
  // A vacancy delay intentionally keeps a room occupied after the last exact
  // coordinate disappears. Render that evidence honestly as an approximate
  // room marker instead of showing an occupied room with an empty plan.
  for (const room of rooms) {
    const status = sensorStatus.get(room.id);
    const selectedCount = status
      ? status.positive + status.negative + status.unknown
      : 0;
    const runtimePositiveFullyExplained = geometrySuppressedRooms.has(room.id)
      && !runtimeAvailable
      && selectedCount > 0
      && status?.positive === 0
      && status?.unknown === 0
      && status?.negative === selectedCount
      && runtimeByRoom[room.id]?.presence?.status !== 'clearing';
    if (room.house.visible === false
      || conflictingRoomIds.has(room.id)
      || runtimeByRoom[room.id]?.presence?.occupied !== true
      || runtimePositiveFullyExplained
      || deduplicated.some(person => person.roomId === room.id)) continue;
    const global = transformHomePoint(roomInteriorPoint(room), room.house);
    deduplicated.push({
      id: `${room.id}:runtime-hold`,
      roomId: room.id,
      roomName: room.name,
      x: global.x,
      y: global.y,
      floor: room.house.floor,
      approximate: true,
      sourceDeviceId: 'runtime',
    });
  }
  const roomStates = rooms.map(room => {
      const roomPeople = deduplicated.filter(person => person.roomId === room.id);
      const exactPeople = roomPeople.filter(person => !person.approximate).length;
      const status = sensorStatus.get(room.id) || {
        linked: 0, live: 0, unavailable: 0, positioning: 0,
        positive: 0, negative: 0, unknown: 0,
      };
      const selectedCount = status.positive + status.negative + status.unknown;
      const occupied = status.positive > 0;
      const presenceKnown = occupied || (selectedCount > 0 && status.negative === selectedCount);
      const configuredSensorCount = roomSensors(room).filter(sensor => sensor.deviceId).length;
      const trackingEvidenceComplete = configuredSensorCount > 0
        && status.linked === configuredSensorCount
        && status.unavailable === 0
        && status.positioning === configuredSensorCount
        && !incompletePositioningRooms.has(room.id)
        && !incompletePresenceRooms.has(room.id)
        && !ambiguousSupplementaryRooms.has(room.id)
        && !roomPeople.some(person => person.approximate);
      const runtimePresence = runtimeByRoom[room.id]?.presence;
      const runtimeKnown = runtimeAvailable && typeof runtimePresence?.occupied === 'boolean';
      const cachedRuntimeKnown = typeof runtimePresence?.occupied === 'boolean';
      const localClearEvidenceSafe = !unsafeClearEvidenceRooms.has(room.id)
        && configuredSensorCount > 0
        && status.linked === configuredSensorCount
        && !ambiguousSupplementaryRooms.has(room.id);
      const peopleCountKnown = runtimeKnown
        && !conflictingRoomIds.has(room.id)
        && configuredSensorCount === 1
        && trackingEvidenceComplete;
      const runtimePositiveFullyExplained = geometrySuppressedRooms.has(room.id)
        && !runtimeAvailable
        && selectedCount > 0
        && status.positive === 0
        && status.unknown === 0
        && status.negative === selectedCount
        && runtimePresence?.status !== 'clearing';
      return {
        roomId: room.id,
        roomName: room.name,
        floor: room.house.floor,
        people: exactPeople,
        peopleCountKnown,
        trackingEvidenceComplete,
        approximate: roomPeople.some(person => person.approximate),
        occupied: conflictingRoomIds.has(room.id) ? false : cachedRuntimeKnown
          ? (runtimePresence?.occupied === true && !runtimePositiveFullyExplained) || occupied
          : occupied,
        available: conflictingRoomIds.has(room.id) ? false : runtimePresence
          ? runtimeKnown && (occupied || localClearEvidenceSafe)
          : runtimeAvailable
            && presenceKnown
            && (occupied || !incompletePositioningRooms.has(room.id))
            && !incompletePresenceRooms.has(room.id),
        visible: room.house.visible !== false,
        sensorCount: configuredSensorCount,
        linkedSensorCount: status.linked,
        liveSensorCount: status.live,
        unavailableSensorCount: status.unavailable,
        positioningSensorCount: status.positioning,
      };
    });

  return { people: deduplicated, rooms: roomStates, linkedSensors, liveSensors, unavailableSensors };
};
