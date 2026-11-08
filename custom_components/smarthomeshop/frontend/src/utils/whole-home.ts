export interface HomePoint { x: number; y: number }
export interface HomePlacement {
  x: number;
  y: number;
  floor: number;
  rotationDeg: 0 | 90 | 180 | 270;
  visible?: boolean;
}
export interface HomeWall { x1: number; y1: number; x2: number; y2: number }
export interface HomeSensor {
  id?: string;
  deviceId?: string | null;
  x?: number;
  y?: number;
  rotation?: number;
}
export interface HomeZone { type?: string; points?: HomePoint[]; parts?: HomePoint[][] }
export interface HomeRoom {
  id: string;
  name: string;
  walls?: HomeWall[];
  sensors?: HomeSensor[];
  sensor?: HomeSensor | null;
  zones?: HomeZone[];
  house?: Partial<HomePlacement>;
}
export interface HomeRadarTarget {
  index: number;
  x_entity_id: string;
  y_entity_id: string;
  presence_entity_id?: string | null;
}
export interface HomeRadarProfile {
  device_id: string;
  entity_prefix: string;
  aliases: string[];
  profile: {
    coordinate_projection: 'forward_xy' | 'floor_xy';
    coordinate_scale_to_mm: number;
    tracking_presence_entity_id?: string | null;
    tracking_target_count_entity_id?: string | null;
    supplementary_presence_sensors?: string[];
    positioning_available?: boolean;
  };
  targets: HomeRadarTarget[];
}
export interface PlacedHomeRoom extends HomeRoom { house: HomePlacement }
export interface HomePerson {
  id: string;
  roomId: string;
  roomName: string;
  x: number;
  y: number;
  floor: number;
  approximate: boolean;
  sourceDeviceId: string;
}
export interface HomePresence {
  people: HomePerson[];
  rooms: Array<{
    roomId: string; roomName: string; floor: number; people: number; sensorCount: number;
    linkedSensorCount: number; liveSensorCount: number; unavailableSensorCount: number;
    positioningSensorCount: number;
    approximate: boolean; occupied: boolean; available: boolean; visible: boolean;
  }>;
  linkedSensors: number;
  liveSensors: number;
  unavailableSensors: number;
}

const INVALID_STATES = new Set(['', 'unknown', 'unavailable', 'none', 'null', 'nan']);
const ROOM_GAP = 700;
const finite = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Reset, rather than multiply, the retained canvas transform on every draw. */
export const resetCanvasTransform = (
  context: { setTransform: (a: number, b: number, c: number, d: number, e: number, f: number) => void },
  ratio: number,
): void => context.setTransform(ratio, 0, 0, ratio, 0, 0);

export const normalisePlacement = (value?: Partial<HomePlacement>): HomePlacement => ({
  x: finite(value?.x),
  y: finite(value?.y),
  floor: Math.max(-5, Math.min(20, Math.round(finite(value?.floor)))),
  rotationDeg: ([0, 90, 180, 270] as const).reduce((best, candidate) =>
    Math.abs(candidate - finite(value?.rotationDeg)) < Math.abs(best - finite(value?.rotationDeg)) ? candidate : best, 0),
  visible: value?.visible !== false,
});

export const roomPoints = (room: HomeRoom): HomePoint[] => (Array.isArray(room.walls) ? room.walls : [])
  .filter(wall => typeof wall === 'object' && wall !== null)
  .map(wall => ({ x: finite(wall.x1), y: finite(wall.y1) }));

const bounds = (room: HomeRoom): { minX: number; minY: number; width: number; height: number } => {
  const points = roomPoints(room);
  if (!points.length) return { minX: -2000, minY: -2000, width: 4000, height: 4000 };
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(500, Math.max(...xs) - minX), height: Math.max(500, Math.max(...ys) - minY) };
};

export const placeHomeRooms = (rooms: HomeRoom[]): PlacedHomeRoom[] => {
  const result = new Map<string, PlacedHomeRoom>();
  rooms.filter(room => room.house).forEach(room => result.set(room.id, { ...room, house: normalisePlacement(room.house) }));
  const floors = new Set(rooms.map(room => normalisePlacement(room.house).floor));
  for (const floor of floors) {
    const missing = rooms.filter(room => !room.house && normalisePlacement(room.house).floor === floor);
    if (!missing.length) continue;
    const existing = [...result.values()].filter(room => room.house.floor === floor);
    let cursorX = 0;
    let cursorY = 0;
    let rowHeight = 0;
    const targetRowWidth = existing.length ? Number.POSITIVE_INFINITY : Math.max(6000, Math.sqrt(missing.reduce((sum, room) => {
      const box = bounds(room);
      return sum + box.width * box.height;
    }, 0)) * 1.65);
    if (existing.length) {
      const existingPoints = existing.map(room => {
        const angle = room.house.rotationDeg * Math.PI / 180;
        return roomPoints(room).map(point => ({
          x: room.house.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
          y: room.house.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
        }));
      }).flat();
      cursorX = Math.max(...existingPoints.map(point => point.x)) + ROOM_GAP;
      cursorY = Math.min(...existingPoints.map(point => point.y));
    }
    for (const room of missing) {
      const box = bounds(room);
      if (!existing.length && cursorX > 0 && cursorX + box.width > targetRowWidth) {
        cursorX = 0;
        cursorY += rowHeight + ROOM_GAP;
        rowHeight = 0;
      }
      const house = normalisePlacement({ x: cursorX - box.minX, y: cursorY - box.minY, floor, rotationDeg: 0, visible: true });
      result.set(room.id, { ...room, house });
      cursorX += box.width + ROOM_GAP;
      rowHeight = Math.max(rowHeight, box.height);
    }
  }
  return rooms.map(room => result.get(room.id) || { ...room, house: normalisePlacement(room.house) });
};

export const transformHomePoint = (point: HomePoint, placement: HomePlacement): HomePoint => {
  const angle = placement.rotationDeg * Math.PI / 180;
  return {
    x: placement.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: placement.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
  };
};

const radarCoordinate = (raw: unknown, scale: number): number | null => {
  const state = String(raw ?? '').trim().toLowerCase();
  if (INVALID_STATES.has(state)) return null;
  const value = Number.parseFloat(state) * scale;
  return Number.isFinite(value) ? value : null;
};

const radarPoint = (target: HomePoint, sensor: HomeSensor): HomePoint => {
  const angle = (finite(sensor.rotation) - 90) * Math.PI / 180;
  return {
    x: finite(sensor.x) + target.y * Math.cos(angle) - target.x * Math.sin(angle),
    y: finite(sensor.y) + target.y * Math.sin(angle) + target.x * Math.cos(angle),
  };
};

const isOn = (value: string | undefined): boolean => String(value || '').toLowerCase() === 'on';
const validState = (value: string | undefined): boolean => !INVALID_STATES.has(String(value || '').trim().toLowerCase());
const isHomeSensor = (value: unknown): value is HomeSensor => typeof value === 'object' && value !== null;
const sensorsForRoom = (room: HomeRoom): HomeSensor[] => {
  const sensors = Array.isArray(room.sensors) ? room.sensors.filter(isHomeSensor) : [];
  if (sensors.length) return sensors;
  return isHomeSensor(room.sensor) ? [room.sensor] : [];
};
const profileForSensor = (profiles: HomeRadarProfile[], id: string): HomeRadarProfile | undefined =>
  profiles.find(profile => profile.device_id === id || profile.entity_prefix === id || (profile.aliases || []).includes(id));

const insidePolygon = (point: HomePoint, polygon: HomePoint[]): boolean => {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const before = polygon[previous];
    if (((current.y > point.y) !== (before.y > point.y))
      && point.x < (before.x - current.x) * (point.y - current.y) / ((before.y - current.y) || Number.EPSILON) + current.x) inside = !inside;
  }
  return inside;
};

const excluded = (room: HomeRoom, point: HomePoint): boolean => (room.zones || [])
  .filter(zone => zone.type === 'exclusion')
  .some(zone => [zone.points || [], ...(zone.parts || [])].some(polygon => polygon.length >= 3 && insidePolygon(point, polygon)));

export const roomInteriorPoint = (room: HomeRoom): HomePoint => {
  const box = bounds(room);
  const center = { x: box.minX + box.width / 2, y: box.minY + box.height / 2 };
  const polygon = roomPoints(room);
  if (polygon.length < 3 || insidePolygon(center, polygon)) return center;
  let best: HomePoint | null = null;
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

const deduplicatePeople = (people: HomePerson[]): HomePerson[] => {
  const result: HomePerson[] = [];
  for (const roomId of new Set(people.map(person => person.roomId))) {
    const roomPeople = people.filter(person => person.roomId === roomId);
    const exact = roomPeople.filter(person => !person.approximate);
    if (!exact.length) {
      const approximate = roomPeople.find(person => person.approximate);
      if (approximate) result.push(approximate);
      continue;
    }
    const bySource = new Map<string, HomePerson[]>();
    exact.forEach(person => bySource.set(person.sourceDeviceId, [...(bySource.get(person.sourceDeviceId) || []), person]));
    const groups = [...bySource.values()]
      .map(group => [...group].sort((a, b) => a.id.localeCompare(b.id)))
      .sort((a, b) => b.length - a.length || a[0].sourceDeviceId.localeCompare(b[0].sourceDeviceId));
    const roomResult: HomePerson[] = [];
    for (const group of groups) {
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
          if (separation >= 650) return;
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

export const collectHomePresence = (
  rooms: PlacedHomeRoom[],
  profiles: HomeRadarProfile[],
  state: (entityId: string) => string | undefined,
): HomePresence => {
  const people: HomePerson[] = [];
  let linkedSensors = 0;
  let liveSensors = 0;
  let unavailableSensors = 0;
  const sensorStatus = new Map<string, { linked: number; live: number; unavailable: number; positioning: number }>();
  for (const room of rooms) {
    for (const [sensorIndex, sensor] of sensorsForRoom(room).entries()) {
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
      const presenceId = profile.profile.tracking_presence_entity_id;
      const presenceState = presenceId ? state(presenceId) : undefined;
      const supplementaryStates = (profile.profile.supplementary_presence_sensors || []).map(id => state(id));
      const targetHasLiveCoordinates = (profile.targets || []).some(target =>
        radarCoordinate(state(target.x_entity_id), profile.profile.coordinate_scale_to_mm || 1) !== null
        && radarCoordinate(state(target.y_entity_id), profile.profile.coordinate_scale_to_mm || 1) !== null);
      const hasLiveState = (presenceId ? validState(presenceState) : false)
        || supplementaryStates.some(validState)
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
      const primaryExplicitlyOff = Boolean(presenceId && validState(presenceState) && !isOn(presenceState));
      const countId = profile.profile.tracking_target_count_entity_id;
      const countState = countId ? state(countId) : undefined;
      const count = countId && validState(countState) ? Math.max(0, Math.trunc(finite(countState))) : null;
      const sensorPeople: HomePerson[] = [];
      let suppressedCoordinateTarget = false;
      for (const target of profile.targets || []) {
        if (primaryExplicitlyOff) continue;
        if (count !== null && target.index > count) continue;
        const x = radarCoordinate(state(target.x_entity_id), profile.profile.coordinate_scale_to_mm || 1);
        const y = radarCoordinate(state(target.y_entity_id), profile.profile.coordinate_scale_to_mm || 1);
        if (x === null || y === null || (!target.presence_entity_id && x === 0 && y === 0)) continue;
        if (target.presence_entity_id && !isOn(state(target.presence_entity_id))) continue;
        const local = radarPoint({ x, y }, sensor);
        const polygon = roomPoints(room);
        if ((polygon.length >= 3 && !insidePolygon(local, polygon)) || excluded(room, local)) {
          suppressedCoordinateTarget = true;
          continue;
        }
        const global = transformHomePoint(local, room.house);
        sensorPeople.push({
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
      const supplementary = supplementaryStates.some(isOn);
      if (!sensorPeople.length && (supplementary || (!suppressedCoordinateTarget && isOn(presenceState)))) {
        const global = transformHomePoint(roomInteriorPoint(room), room.house);
        sensorPeople.push({
          id: `${room.id}:${profile.device_id}:room-${sensorIndex}`,
          roomId: room.id,
          roomName: room.name,
          x: global.x,
          y: global.y,
          floor: room.house.floor,
          approximate: true,
          sourceDeviceId: profile.device_id,
        });
      }
      if (room.house.visible !== false) people.push(...sensorPeople);
    }
  }
  const deduplicated = deduplicatePeople(people);
  return {
    people: deduplicated,
    linkedSensors,
    liveSensors,
    unavailableSensors,
    rooms: rooms.map(room => {
      const current = deduplicated.filter(person => person.roomId === room.id);
      const status = sensorStatus.get(room.id) || { linked: 0, live: 0, unavailable: 0, positioning: 0 };
      return {
        roomId: room.id,
        roomName: room.name,
        floor: room.house.floor,
        people: current.filter(person => !person.approximate).length,
        sensorCount: sensorsForRoom(room).filter(sensor => sensor.deviceId).length,
        linkedSensorCount: status.linked,
        liveSensorCount: status.live,
        unavailableSensorCount: status.unavailable,
        positioningSensorCount: status.positioning,
        approximate: current.some(person => person.approximate),
        occupied: current.length > 0,
        available: status.live > 0,
        visible: room.house.visible !== false,
      };
    }),
  };
};

export const floorName = (floor: number): string => {
  if (floor === 0) return 'Ground floor';
  if (floor === -1) return 'Basement';
  if (floor === 1) return 'First floor';
  return floor < 0 ? `Basement ${Math.abs(floor)}` : `Floor ${floor}`;
};
