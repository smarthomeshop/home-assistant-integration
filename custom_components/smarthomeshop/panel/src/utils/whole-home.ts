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
}

const DEFAULT_ROOM_SIZE = 4000;
const ROOM_GAP = 700;
const DUPLICATE_DISTANCE_MM = 650;
const INVALID_STATES = new Set(['', 'unknown', 'unavailable', 'none', 'null', 'nan']);

const finite = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const roomPolygon = (room: Room): Point[] => (Array.isArray(room.walls) ? room.walls : [])
  .filter(wall => typeof wall === 'object' && wall !== null)
  .map(wall => ({ x: finite(wall.x1), y: finite(wall.y1) }))
  .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

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

const isOn = (value: string | undefined): boolean => String(value || '').toLowerCase() === 'on';

const validLiveState = (value: string | undefined): boolean =>
  !INVALID_STATES.has(String(value || '').trim().toLowerCase());

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

const excludedByRoomZone = (room: Room, point: Point): boolean => (Array.isArray(room.zones) ? room.zones : [])
  .filter((zone): zone is RoomZone => typeof zone === 'object' && zone !== null && zone.type === 'exclusion')
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

const deduplicatePeople = (people: WholeHomePerson[]): WholeHomePerson[] => {
  const result: WholeHomePerson[] = [];
  for (const roomId of new Set(people.map(person => person.roomId))) {
    const roomPeople = people.filter(person => person.roomId === roomId);
    const exact = roomPeople.filter(person => !person.approximate);
    if (!exact.length) {
      const approximate = roomPeople.find(person => person.approximate);
      if (approximate) result.push(approximate);
      continue;
    }
    const bySource = new Map<string, WholeHomePerson[]>();
    exact.forEach(person => bySource.set(person.sourceDeviceId, [...(bySource.get(person.sourceDeviceId) || []), person]));
    const sourceGroups = [...bySource.values()]
      .map(group => [...group].sort((a, b) => a.id.localeCompare(b.id)))
      .sort((a, b) => b.length - a.length || a[0].sourceDeviceId.localeCompare(b[0].sourceDeviceId));
    const roomResult: WholeHomePerson[] = [];
    for (const group of sourceGroups) {
      if (!roomResult.length) { roomResult.push(...group); continue; }
      let bestMatched = new Set<number>();
      let bestCount = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      const search = (groupIndex: number, usedExisting: Set<number>, matchedGroup: Set<number>, distance: number): void => {
        if (groupIndex === group.length) {
          if (matchedGroup.size > bestCount || (matchedGroup.size === bestCount && distance < bestDistance)) {
            bestCount = matchedGroup.size;
            bestDistance = distance;
            bestMatched = new Set(matchedGroup);
          }
          return;
        }
        search(groupIndex + 1, usedExisting, matchedGroup, distance);
        roomResult.forEach((existing, existingIndex) => {
          if (usedExisting.has(existingIndex)) return;
          const separation = Math.hypot(existing.x - group[groupIndex].x, existing.y - group[groupIndex].y);
          if (separation >= DUPLICATE_DISTANCE_MM) return;
          usedExisting.add(existingIndex);
          matchedGroup.add(groupIndex);
          search(groupIndex + 1, usedExisting, matchedGroup, distance + separation);
          matchedGroup.delete(groupIndex);
          usedExisting.delete(existingIndex);
        });
      };
      search(0, new Set(), new Set(), 0);
      group.forEach((person, index) => { if (!bestMatched.has(index)) roomResult.push(person); });
    }
    result.push(...roomResult);
  }
  return result;
};

export const collectWholeHomePresence = (
  rooms: WholeHomeRoom[],
  profiles: RadarDeviceProfilePayload[],
  getState: (entityId: string) => string | undefined,
): WholeHomePresence => {
  const people: WholeHomePerson[] = [];
  let linkedSensors = 0;
  let liveSensors = 0;
  let unavailableSensors = 0;

  const sensorStatus = new Map<string, { linked: number; live: number; unavailable: number; positioning: number }>();

  for (const room of rooms) {
    const sensors = roomSensors(room);
    for (const [sensorOffset, sensor] of sensors.entries()) {
      if (!sensor.deviceId) continue;
      const roomStatus = sensorStatus.get(room.id) || { linked: 0, live: 0, unavailable: 0, positioning: 0 };
      const profile = profileForSensor(profiles, sensor.deviceId);
      if (!profile) {
        unavailableSensors += 1;
        roomStatus.unavailable += 1;
        sensorStatus.set(room.id, roomStatus);
        continue;
      }
      linkedSensors += 1;
      roomStatus.linked += 1;
      sensorStatus.set(room.id, roomStatus);
      const presenceEntity = profile.profile.tracking_presence_entity_id;
      const presenceState = presenceEntity ? getState(presenceEntity) : undefined;
      const supplementaryStates = (profile.profile.supplementary_presence_sensors || [])
        .map(entityId => getState(entityId));
      const targetHasLiveCoordinates = profile.targets.some(target =>
        normalizeRadarCoordinate(getState(target.x_entity_id), profile.profile.coordinate_scale_to_mm || 1) !== null
        && normalizeRadarCoordinate(getState(target.y_entity_id), profile.profile.coordinate_scale_to_mm || 1) !== null);
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
      const primaryExplicitlyOff = Boolean(presenceEntity && validLiveState(presenceState) && !isOn(presenceState));

      const countEntity = profile.profile.tracking_target_count_entity_id;
      const count = countEntity && validLiveState(getState(countEntity))
        ? Math.max(0, Math.trunc(finite(getState(countEntity))))
        : null;
      const roomPeople: WholeHomePerson[] = [];
      let suppressedCoordinateTarget = false;
      for (const target of profile.targets) {
        if (primaryExplicitlyOff) continue;
        if (count !== null && target.index > count) continue;
        const rawX = getState(target.x_entity_id);
        const rawY = getState(target.y_entity_id);
        const x = normalizeRadarCoordinate(rawX, profile.profile.coordinate_scale_to_mm || 1);
        const y = normalizeRadarCoordinate(rawY, profile.profile.coordinate_scale_to_mm || 1);
        if (x === null || y === null) continue;
        const targetPresence = target.presence_entity_id ? getState(target.presence_entity_id) : undefined;
        if (target.presence_entity_id && (!validLiveState(targetPresence) || !isOn(targetPresence))) continue;
        if (!target.presence_entity_id && x === 0 && y === 0) continue;
        const local = projectRadarTargetToRoom(
          { x, y },
          { x: finite(sensor.x), y: finite(sensor.y), rotation: finite(sensor.rotation) },
          profile.profile.coordinate_projection,
        );
        const polygon = roomPolygon(room);
        if ((polygon.length >= 3 && !pointInPolygon(local, polygon)) || excludedByRoomZone(room, local)) {
          suppressedCoordinateTarget = true;
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

      if (!roomPeople.length) {
        const supplementaryPresence = supplementaryStates.some(isOn);
        if (supplementaryPresence || (!suppressedCoordinateTarget && isOn(presenceState))) {
          const center = transformHomePoint(roomInteriorPoint(room), room.house);
          roomPeople.push({
            id: `${room.id}:${profile.device_id}:room-${sensorOffset}`,
            roomId: room.id,
            roomName: room.name,
            x: center.x,
            y: center.y,
            floor: room.house.floor,
            approximate: true,
            sourceDeviceId: profile.device_id,
          });
        }
      }
      if (room.house.visible !== false) people.push(...roomPeople);
    }
  }

  const deduplicated = deduplicatePeople(people);
  const roomStates = rooms.map(room => {
      const roomPeople = deduplicated.filter(person => person.roomId === room.id);
      const exactPeople = roomPeople.filter(person => !person.approximate).length;
      const status = sensorStatus.get(room.id) || { linked: 0, live: 0, unavailable: 0, positioning: 0 };
      return {
        roomId: room.id,
        roomName: room.name,
        floor: room.house.floor,
        people: exactPeople,
        approximate: roomPeople.some(person => person.approximate),
        occupied: roomPeople.length > 0,
        available: status.live > 0,
        visible: room.house.visible !== false,
        sensorCount: roomSensors(room).filter(sensor => sensor.deviceId).length,
        linkedSensorCount: status.linked,
        liveSensorCount: status.live,
        unavailableSensorCount: status.unavailable,
        positioningSensorCount: status.positioning,
      };
    });

  return { people: deduplicated, rooms: roomStates, linkedSensors, liveSensors, unavailableSensors };
};
