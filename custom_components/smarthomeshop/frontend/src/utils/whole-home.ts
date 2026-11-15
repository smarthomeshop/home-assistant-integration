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
  heightMm?: number;
  mountingMode?: string;
  source_version?: number;
  capabilities?: Record<string, unknown>;
}
export interface HomeZone {
  type?: string;
  points?: HomePoint[];
  parts?: HomePoint[][];
  sensorId?: string;
  sensor_id?: string;
}
export interface HomeRoom {
  id: string;
  name: string;
  walls?: HomeWall[];
  sensors?: HomeSensor[];
  sensor?: HomeSensor | null;
  zones?: HomeZone[];
  house?: Partial<HomePlacement>;
  aggregation?: {
    presence?: {
      freshness_seconds?: number;
      vacancy_delay_seconds?: number;
      source_ids?: string[];
    };
    tracking?: {
      experimental_fusion?: boolean;
      duplicate_distance_mm?: number;
      observation_freshness_ms?: number;
      source_alignments?: Record<string, {
        placement_fingerprint?: string;
        sample_count?: number;
        rmse_mm?: number;
        duplicate_distance_mm?: number;
      }>;
    };
  };
}
export interface HomeRadarTarget {
  index: number;
  x_entity_id: string;
  y_entity_id: string;
  z_entity_id?: string | null;
  presence_entity_id?: string | null;
}
export interface HomeRadarProfile {
  device_id: string;
  entity_prefix: string;
  aliases: string[];
  profile: {
    coordinate_projection: 'forward_xy' | 'floor_xy';
    coordinate_scale_to_mm: number;
    radar_model?: string;
    coordinate_frame?: string | null;
    current_hardware_mode?: string | null;
    required_installation_mode?: 'top' | 'side' | null;
    reported_installation_mode_entity_id?: string | null;
    installation_height_m?: number | null;
    installation_angle_deg?: number | null;
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
    peopleCountKnown: boolean;
    trackingEvidenceComplete: boolean;
    approximate: boolean; occupied: boolean; available: boolean; visible: boolean;
  }>;
  linkedSensors: number;
  liveSensors: number;
  unavailableSensors: number;
}

/** Any rendered marker in an uncertain room makes the aggregate number unsafe. */
export const hasUnknownVisiblePeopleCount = (
  rooms: HomePresence['rooms'],
  people: HomePerson[],
): boolean => {
  const roomsWithMarkers = new Set(people.map(person => person.roomId));
  return rooms.some(room => room.visible
    && !room.peopleCountKnown
    && (room.available === false || room.occupied || roomsWithMarkers.has(room.roomId)));
};
export interface HomeRoomRuntime {
  presence?: { occupied?: boolean | null; status?: string; degraded?: boolean };
}
export interface HomeStateObject {
  state: string;
  last_reported?: string;
  last_updated?: string;
  received_at_ms?: number;
}
export type HomeStateValue = string | HomeStateObject | undefined;

/** Coordinate reports can never be used as the clock that validates themselves. */
export const homeCoordinateEntityIds = (profiles: HomeRadarProfile[]): Set<string> => new Set(
  profiles.flatMap(profile => profile.targets.flatMap(target => [
    target.x_entity_id,
    target.y_entity_id,
    target.z_entity_id,
  ].filter((entityId): entityId is string => Boolean(entityId)))),
);

/** All radar evidence is excluded from the reference clock used to validate it. */
export const homeEvidenceEntityIds = (profiles: HomeRadarProfile[]): Set<string> => new Set(
  profiles.flatMap(profile => [
    profile.profile.tracking_presence_entity_id,
    profile.profile.tracking_target_count_entity_id,
    profile.profile.reported_installation_mode_entity_id,
    ...(profile.profile.supplementary_presence_sensors || []),
    ...profile.targets.flatMap(target => [
      target.x_entity_id,
      target.y_entity_id,
      target.z_entity_id,
      target.presence_entity_id,
    ]),
  ].filter((entityId): entityId is string => Boolean(entityId))),
);

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

const safeSuppressionRoomPoints = (room: HomeRoom): HomePoint[] => {
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
  const cross = (a: HomePoint, b: HomePoint, c: HomePoint): number =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const onSegment = (a: HomePoint, b: HomePoint, point: HomePoint): boolean =>
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

const stateText = (raw: HomeStateValue): string => typeof raw === 'object' && raw !== null
  ? String(raw.state || '')
  : String(raw ?? '');
const radarCoordinate = (raw: HomeStateValue, scale: number): number | null => {
  const state = stateText(raw).trim().toLowerCase();
  if (INVALID_STATES.has(state)) return null;
  const value = Number.parseFloat(state) * scale;
  return Number.isFinite(value) ? value : null;
};

const radarPoint = (
  target: HomePoint,
  sensor: HomeSensor,
  projection: 'forward_xy' | 'floor_xy',
): HomePoint => {
  const angle = (finite(sensor.rotation) - 90) * Math.PI / 180;
  switch (projection) {
    case 'floor_xy':
    case 'forward_xy':
      return {
        x: finite(sensor.x) + target.y * Math.cos(angle) - target.x * Math.sin(angle),
        y: finite(sensor.y) + target.y * Math.sin(angle) + target.x * Math.cos(angle),
      };
  }
};

const isOn = (value: HomeStateValue): boolean => stateText(value).toLowerCase() === 'on';
const validState = (value: HomeStateValue): boolean => !INVALID_STATES.has(stateText(value).trim().toLowerCase());
const freshState = (value: HomeStateValue, maximumAgeSeconds: number, nowMs: number): HomeStateValue => {
  if (!validState(value)) return undefined;
  if (typeof value !== 'object' || value === null) return value;
  const timestamp = Number(value.received_at_ms);
  if (!Number.isFinite(timestamp) || timestamp > nowMs
    || nowMs - timestamp > maximumAgeSeconds * 1000) return undefined;
  return value;
};

const nonFutureState = (value: HomeStateValue, nowMs: number): HomeStateValue => {
  if (!validState(value)) return undefined;
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

export class HomeStateReportTracker {
  private readonly receipts = new Map<string, { signature: string; receivedAtMs: number }>();

  state(
    entityId: string,
    value: HomeStateObject | undefined,
    nowMs: number,
    serverNowMs: number,
  ): HomeStateObject | undefined {
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
    const receivedAtMs = nowMs - Math.max(0, serverReferenceMs - reportedAtMs);
    const signature = `${timestamp}|${value.state}`;
    const existing = this.receipts.get(entityId);
    if (!existing || existing.signature !== signature) {
      this.receipts.set(entityId, { signature, receivedAtMs });
      return { ...value, received_at_ms: receivedAtMs };
    }
    return { ...value, received_at_ms: existing.receivedAtMs };
  }
}

export const latestHomeStateReport = (values: HomeStateObject[], fallback: number): number => {
  const timestamps = values
    .map(value => Date.parse(value.last_reported || value.last_updated || ''))
    .filter(Number.isFinite);
  return timestamps.length ? Math.max(...timestamps) : fallback;
};

/** Derive HA time without allowing the coordinates being judged to set it. */
export const latestIndependentHomeStateReport = (
  states: Record<string, HomeStateObject>,
  excludedEntityIds: ReadonlySet<string>,
  fallback: number,
): number => latestHomeStateReport(
  Object.entries(states)
    .filter(([entityId]) => !excludedEntityIds.has(entityId))
    .map(([, state]) => state),
  fallback,
);
const isHomeSensor = (value: unknown): value is HomeSensor => typeof value === 'object' && value !== null;
const sensorsForRoom = (room: HomeRoom): HomeSensor[] => {
  const sensors = Array.isArray(room.sensors) ? room.sensors.filter(isHomeSensor) : [];
  if (sensors.length) return sensors;
  return isHomeSensor(room.sensor) ? [room.sensor] : [];
};
const profileForSensor = (profiles: HomeRadarProfile[], id: string): HomeRadarProfile | undefined =>
  profiles.find(profile => profile.device_id === id || profile.entity_prefix === id || (profile.aliases || []).includes(id));

const conflictingDeviceRoomIds = (
  rooms: PlacedHomeRoom[],
  profiles: HomeRadarProfile[],
): Set<string> => {
  const owners = new Map<string, Set<string>>();
  for (const room of rooms) {
    for (const sensor of sensorsForRoom(room)) {
      if (!sensor.deviceId) continue;
      const physicalId = profileForSensor(profiles, sensor.deviceId)?.device_id || sensor.deviceId;
      const roomIds = owners.get(physicalId) || new Set<string>();
      roomIds.add(room.id);
      owners.set(physicalId, roomIds);
    }
  }
  return new Set([...owners.values()].filter(roomIds => roomIds.size > 1).flatMap(roomIds => [...roomIds]));
};

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

const OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM = 350;

const distanceToPolygonBoundary = (point: HomePoint, polygon: HomePoint[]): number => {
  if (polygon.length < 2) return Number.POSITIVE_INFINITY;
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const fraction = lengthSquared > 0
      ? Math.max(0, Math.min(1,
        ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
      : 0;
    minimum = Math.min(minimum, Math.hypot(
      point.x - (start.x + fraction * dx),
      point.y - (start.y + fraction * dy),
    ));
  }
  return minimum;
};

const safelyOutsideRoom = (point: HomePoint, polygon: HomePoint[]): boolean =>
  polygon.length >= 3
  && !insidePolygon(point, polygon)
  && distanceToPolygonBoundary(point, polygon) >= OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM;

const excluded = (room: HomeRoom, point: HomePoint, sourceId?: string): boolean => (room.zones || [])
  .filter(zone => zone.type === 'exclusion'
    && (!(zone.sensorId || zone.sensor_id) || (zone.sensorId || zone.sensor_id) === sourceId))
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

const deduplicatePeople = (
  people: HomePerson[],
  _rooms: PlacedHomeRoom[],
  _positioningSources: Map<string, HomeSensor[]>,
): HomePerson[] => [...people];

export const collectHomePresence = (
  rooms: PlacedHomeRoom[],
  profiles: HomeRadarProfile[],
  state: (entityId: string) => HomeStateValue,
  nowMs = Date.now(),
  runtimeByRoom: Record<string, HomeRoomRuntime> = {},
  runtimeAvailable = true,
): HomePresence => {
  const people: HomePerson[] = [];
  let linkedSensors = 0;
  let liveSensors = 0;
  let unavailableSensors = 0;
  const sensorStatus = new Map<string, {
    linked: number; live: number; unavailable: number; positioning: number;
    positive: number; negative: number; unknown: number;
  }>();
  const positioningSources = new Map<string, HomeSensor[]>();
  const incompletePositioningRooms = new Set<string>();
  const incompletePresenceRooms = new Set<string>();
  const unsafeClearEvidenceRooms = new Set<string>();
  const ambiguousSupplementaryRooms = new Set<string>();
  const geometrySuppressedRooms = new Set<string>();
  const conflictingRoomIds = conflictingDeviceRoomIds(rooms, profiles);
  const addPositioningSource = (roomId: string, sensor: HomeSensor, profile?: HomeRadarProfile): void => {
    if (!sensor.id) return;
    const installationHeightM = profile?.profile.installation_height_m;
    const installationAngleDeg = profile?.profile.installation_angle_deg;
    const hasInstallationHeight = installationHeightM !== null
      && installationHeightM !== undefined
      && Number.isFinite(Number(installationHeightM));
    const hasInstallationAngle = installationAngleDeg !== null
      && installationAngleDeg !== undefined
      && Number.isFinite(Number(installationAngleDeg));
    const enriched: HomeSensor = profile ? {
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
    const coordinateFreshness = Math.max(1, Math.min(15,
      finite(room.aggregation?.tracking?.observation_freshness_ms, 5000) / 1000));
    const selectedPresenceSources = new Set(room.aggregation?.presence?.source_ids || []);
    for (const [sensorIndex, sensor] of sensorsForRoom(room).entries()) {
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
      if (sensor.id && profile.profile.positioning_available !== false && profile.targets.length) {
        addPositioningSource(room.id, sensor, profile);
      }
      roomStatus.linked += 1;
      sensorStatus.set(room.id, roomStatus);
      const readAvailableState = (entityId: string | null | undefined): HomeStateValue => {
        if (!entityId) return undefined;
        const value = state(entityId);
        return validState(value) ? value : undefined;
      };
      const presenceId = profile.profile.tracking_presence_entity_id;
      const presenceState = nonFutureState(readAvailableState(presenceId), nowMs);
      const supplementaryStates = (profile.profile.supplementary_presence_sensors || [])
        .map(id => nonFutureState(readAvailableState(id), nowMs));
      const configuredPresenceStates = [
        ...(presenceId ? [presenceState] : []),
        ...supplementaryStates,
      ];
      const presenceInputsComplete = configuredPresenceStates.every(validState);
      const targetEvidence = (profile.targets || []).map(target => {
        const rawX = nonFutureState(readAvailableState(target.x_entity_id), nowMs);
        const rawY = nonFutureState(readAvailableState(target.y_entity_id), nowMs);
        const reportedX = radarCoordinate(rawX, profile.profile.coordinate_scale_to_mm || 1);
        const reportedY = radarCoordinate(rawY, profile.profile.coordinate_scale_to_mm || 1);
        const pairFresh = freshState(rawX, coordinateFreshness, nowMs) !== undefined
          && freshState(rawY, coordinateFreshness, nowMs) !== undefined;
        const targetPresenceAvailable = nonFutureState(
          readAvailableState(target.presence_entity_id), nowMs,
        );
        return {
          target,
          targetPresence: freshState(targetPresenceAvailable, coordinateFreshness, nowMs),
          targetPresenceAvailable,
          coordinatesAvailable: validState(rawX) && validState(rawY),
          x: pairFresh ? reportedX : null,
          y: pairFresh ? reportedY : null,
          reportedX,
          reportedY,
          staleCoordinates: !pairFresh && reportedX !== null && reportedY !== null,
        };
      });
      const reportedModeEntityId = profile.profile.reported_installation_mode_entity_id;
      const liveModeText = stateText(nonFutureState(
        readAvailableState(reportedModeEntityId), nowMs,
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
      const targetEvidenceComplete = targetEvidence.every((evidence) => {
        const targetPresenceAvailable = evidence.target.presence_entity_id
          ? validState(evidence.targetPresence)
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
      const sensorPeople: HomePerson[] = [];
      let suppressedCoordinateCount = 0;
      let unpositionedPositive = false;
      for (const { target, targetPresence, x, y, reportedX, reportedY, staleCoordinates } of targetEvidence) {
        const targetExplicitlyOn = Boolean(target.presence_entity_id && isOn(targetPresence));
        if (x === null || y === null || (!target.presence_entity_id && x === 0 && y === 0)) {
          if (!target.presence_entity_id
            && staleCoordinates
            && reportedX === 0
            && reportedY === 0) continue;
          const staleNonzero = staleCoordinates && (reportedX !== 0 || reportedY !== 0);
          if (targetExplicitlyOn
            || (!target.presence_entity_id && staleNonzero
              && (isOn(presenceState) || !presenceId))) {
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
        const local = radarPoint({ x, y }, sensor, profile.profile.coordinate_projection);
        const polygon = safeSuppressionRoomPoints(room);
        if (safelyOutsideRoom(local, polygon) || excluded(room, local, sensor.id)) {
          suppressedCoordinateCount += 1;
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
      const countState = nonFutureState(
        readAvailableState(profile.profile.tracking_target_count_entity_id), nowMs,
      );
      const parsedCount = Number(stateText(countState));
      const reportedCount = validState(countState)
        && freshState(countState, coordinateFreshness, nowMs) !== undefined
        && Number.isInteger(parsedCount)
        && parsedCount >= 0
        ? parsedCount
        : null;
      if (profile.profile.tracking_target_count_entity_id && reportedCount === null) {
        incompletePositioningRooms.add(room.id);
      }
      if (reportedCount !== null
        && reportedCount !== sensorPeople.length + suppressedCoordinateCount) {
        incompletePositioningRooms.add(room.id);
      }
      if (reportedCount !== null
        && reportedCount > sensorPeople.length + suppressedCoordinateCount) {
        unpositionedPositive = true;
      }
      const explicitPositiveCount = targetEvidence.filter(evidence =>
        Boolean(evidence.target.presence_entity_id) && isOn(evidence.targetPresence)).length;
      const explicitTargetContractComplete = targetEvidence.length > 0 && targetEvidence.every(evidence =>
        Boolean(evidence.target.presence_entity_id) && validState(evidence.targetPresence));
      const countExplainsSuppression = reportedCount !== null
        && reportedCount > 0
        && suppressedCoordinateCount === reportedCount
        && sensorPeople.length === 0
        && !unpositionedPositive;
      const explicitContractExplainsSuppression = explicitTargetContractComplete
        && explicitPositiveCount > 0
        && suppressedCoordinateCount === explicitPositiveCount
        && sensorPeople.length === 0
        && !unpositionedPositive;
      const suppressionExplainsPresence = profile.profile.tracking_target_count_entity_id
        ? countExplainsSuppression
        : explicitContractExplainsSuppression;
      const supplementary = supplementaryStates.some(isOn);
      if (!presenceInputsComplete) incompletePresenceRooms.add(room.id);
      if (supplementary && sensorPeople.length > 0) {
        ambiguousSupplementaryRooms.add(room.id);
      }
      if (unpositionedPositive
        || (!sensorPeople.length && (supplementary || (!suppressionExplainsPresence && isOn(presenceState))))) {
        const global = transformHomePoint(roomInteriorPoint(room), room.house);
        sensorPeople.push({
          id: `${room.id}:${profile.device_id}:${unpositionedPositive ? 'unpositioned' : `room-${sensorIndex}`}`,
          roomId: room.id,
          roomName: room.name,
          x: global.x,
          y: global.y,
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
            || validState(evidence.targetPresenceAvailable)));
        const countContractAvailable = !profile.profile.tracking_target_count_entity_id
          || (validState(countState)
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
        if (sensorPeople.length || presenceInputs.some(isOn)) {
          roomStatus.positive += 1;
        } else if (!sourceClearEvidenceComplete) {
          roomStatus.unknown += 1;
        } else if (suppressionExplainsPresence && presenceInputs.length === 0) {
          roomStatus.negative += 1;
        } else if (presenceInputs.length > 0
          && presenceInputs.every(value => validState(value) && !isOn(value))) {
          roomStatus.negative += 1;
        } else {
          roomStatus.unknown += 1;
        }
      }
      if (room.house.visible !== false) people.push(...sensorPeople);
    }
  }
  const deduplicated = deduplicatePeople(people, rooms, positioningSources)
    .filter(person => !conflictingRoomIds.has(person.roomId));
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
  return {
    people: deduplicated,
    linkedSensors,
    liveSensors,
    unavailableSensors,
    rooms: rooms.map(room => {
      const current = deduplicated.filter(person => person.roomId === room.id);
      const status = sensorStatus.get(room.id) || {
        linked: 0, live: 0, unavailable: 0, positioning: 0,
        positive: 0, negative: 0, unknown: 0,
      };
      const selectedCount = status.positive + status.negative + status.unknown;
      const localOccupied = status.positive > 0;
      const presenceKnown = localOccupied
        || (selectedCount > 0 && status.negative === selectedCount);
      const configuredSensorCount = sensorsForRoom(room).filter(sensor => sensor.deviceId).length;
      const trackingEvidenceComplete = configuredSensorCount > 0
        && status.linked === configuredSensorCount
        && status.unavailable === 0
        && status.positioning === configuredSensorCount
        && !incompletePositioningRooms.has(room.id)
        && !incompletePresenceRooms.has(room.id)
        && !ambiguousSupplementaryRooms.has(room.id)
        && !current.some(person => person.approximate);
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
        people: current.filter(person => !person.approximate).length,
        sensorCount: configuredSensorCount,
        linkedSensorCount: status.linked,
        liveSensorCount: status.live,
        unavailableSensorCount: status.unavailable,
        positioningSensorCount: status.positioning,
        peopleCountKnown,
        trackingEvidenceComplete,
        approximate: current.some(person => person.approximate),
        occupied: conflictingRoomIds.has(room.id) ? false : cachedRuntimeKnown
          ? (runtimePresence?.occupied === true && !runtimePositiveFullyExplained) || localOccupied
          : localOccupied,
        available: conflictingRoomIds.has(room.id) ? false : runtimePresence
          ? runtimeKnown && (localOccupied || localClearEvidenceSafe)
          : runtimeAvailable
            && presenceKnown
            && (localOccupied || !incompletePositioningRooms.has(room.id))
            && !incompletePresenceRooms.has(room.id)
            && (localOccupied
              || (configuredSensorCount > 0
                && status.unavailable === 0
                && status.live === configuredSensorCount)),
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
