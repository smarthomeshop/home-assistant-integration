// Shared by the panel and the dashboard cards: frontend/src/utils/reflection-protection.ts
// is a copy of this file and a test keeps the two the same.
export interface ReflectionPoint {
  x: number;
  y: number;
}

export interface ReflectionSensorPlacement extends ReflectionPoint {
  id?: string;
}

export interface MirrorPlacement {
  id: string;
  wallIndex: number;
  position: number;
  width: number;
  height?: number;
  protectionEnabled?: boolean;
  reflectionDepthMm?: number;
}

export interface ReflectionPolygon {
  mirrorId: string;
  points: ReflectionPoint[];
}

export interface ReflectionAllocation {
  polygons: ReflectionPoint[][];
  manualCount: number;
  mirrorCount: number;
  overflow: number;
}

const DEFAULT_REFLECTION_DEPTH_MM = 2000;
export const OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM = 350;
const REFLECTION_START_OFFSET_MM = OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const polygonSignedArea = (points: ReflectionPoint[]): number => points.reduce(
  (area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.y - next.x * point.y;
  },
  0,
) / 2;

const orientation = (
  a: ReflectionPoint,
  b: ReflectionPoint,
  c: ReflectionPoint,
): number => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const strictlyBetween = (value: number, first: number, second: number): boolean =>
  value > Math.min(first, second) + 0.001 && value < Math.max(first, second) - 0.001;

const properSegmentIntersection = (
  a: ReflectionPoint,
  b: ReflectionPoint,
  c: ReflectionPoint,
  d: ReflectionPoint,
): boolean => {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  if (first * second < -0.001 && third * fourth < -0.001) return true;
  if (Math.abs(first) <= 0.001
    && strictlyBetween(c.x, a.x, b.x)
    && strictlyBetween(c.y, a.y, b.y)) return true;
  if (Math.abs(second) <= 0.001
    && strictlyBetween(d.x, a.x, b.x)
    && strictlyBetween(d.y, a.y, b.y)) return true;
  return false;
};

const pointToSegmentDistance = (
  point: ReflectionPoint,
  start: ReflectionPoint,
  end: ReflectionPoint,
): number => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const fraction = lengthSquared > 0
    ? Math.max(0, Math.min(1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
    : 0;
  return Math.hypot(
    point.x - (start.x + fraction * dx),
    point.y - (start.y + fraction * dy),
  );
};

const segmentDistance = (
  a: ReflectionPoint,
  b: ReflectionPoint,
  c: ReflectionPoint,
  d: ReflectionPoint,
): number => {
  if (properSegmentIntersection(a, b, c, d)) return 0;
  return Math.min(
    pointToSegmentDistance(a, c, d),
    pointToSegmentDistance(b, c, d),
    pointToSegmentDistance(c, a, b),
    pointToSegmentDistance(d, a, b),
  );
};

/** Fail closed when an automatic reflection wedge could hide real room space. */
const reflectionPolygonEntersRoom = (
  reflection: ReflectionPoint[],
  room: ReflectionPoint[],
): boolean => {
  if (reflection.some(point => pointInPolygon(point, room))) return true;
  if (room.some(point => pointInPolygon(point, reflection))) return true;
  for (let reflectionIndex = 0; reflectionIndex < reflection.length; reflectionIndex += 1) {
    const reflectionStart = reflection[reflectionIndex];
    const reflectionEnd = reflection[(reflectionIndex + 1) % reflection.length];
    const midpoint = {
      x: (reflectionStart.x + reflectionEnd.x) / 2,
      y: (reflectionStart.y + reflectionEnd.y) / 2,
    };
    if (pointInPolygon(midpoint, room)) return true;
    // Check the continuous edges, not just sampled points. The minimum of two
    // line segments can occur between samples on a long oblique edge.
    for (let roomIndex = 0; roomIndex < room.length; roomIndex += 1) {
      const distance = segmentDistance(
        reflectionStart, reflectionEnd,
        room[roomIndex], room[(roomIndex + 1) % room.length],
      );
      if (distance < OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM - 0.001) return true;
    }
  }
  return false;
};

/** Return the physical mirror segment on its wall, clipped to that wall. */
export const mirrorSegment = (
  roomPoints: ReflectionPoint[],
  mirror: MirrorPlacement,
): [ReflectionPoint, ReflectionPoint] | null => {
  if (roomPoints.length < 3 || mirror.wallIndex < 0 || mirror.wallIndex >= roomPoints.length) return null;
  const start = roomPoints[mirror.wallIndex];
  const end = roomPoints[(mirror.wallIndex + 1) % roomPoints.length];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1) return null;

  const halfFraction = clamp((Number(mirror.width) || 0) / length / 2, 0.005, 0.5);
  const position = clamp(Number(mirror.position) || 0.5, halfFraction, 1 - halfFraction);
  const firstT = position - halfFraction;
  const secondT = position + halfFraction;
  return [
    { x: start.x + dx * firstT, y: start.y + dy * firstT },
    { x: start.x + dx * secondT, y: start.y + dy * secondT },
  ];
};

/**
 * Build a conservative wedge behind the mirror as seen by one radar.
 *
 * Radar reflections are normally reported behind the reflective plane. The
 * wedge starts just beyond that plane so a real person standing in front of
 * the mirror remains visible. It deliberately uses the radar-to-mirror rays,
 * because two radars looking at the same mirror need different exclusions.
 */
export const createMirrorReflectionPolygon = (
  roomPoints: ReflectionPoint[],
  mirror: MirrorPlacement,
  sensor: ReflectionSensorPlacement,
): ReflectionPolygon | null => {
  if (mirror.protectionEnabled !== true) return null;
  const segment = mirrorSegment(roomPoints, mirror);
  if (!segment || !Number.isFinite(sensor.x) || !Number.isFinite(sensor.y)) return null;

  const protectionDepth = clamp(
    Number(mirror.reflectionDepthMm) || DEFAULT_REFLECTION_DEPTH_MM,
    250,
    6000,
  );
  const wallStart = roomPoints[mirror.wallIndex];
  const wallEnd = roomPoints[(mirror.wallIndex + 1) % roomPoints.length];
  const wallDx = wallEnd.x - wallStart.x;
  const wallDy = wallEnd.y - wallStart.y;
  const wallLength = Math.hypot(wallDx, wallDy);
  if (!Number.isFinite(wallLength) || wallLength < 1) return null;
  const signedArea = polygonSignedArea(roomPoints);
  if (!Number.isFinite(signedArea) || Math.abs(signedArea) < 1) return null;
  // For counter-clockwise rooms the interior is left of every boundary edge,
  // so outward is the right-hand normal. Reverse it for clockwise polygons.
  const outwardNormal = signedArea > 0
    ? { x: wallDy / wallLength, y: -wallDx / wallLength }
    : { x: -wallDy / wallLength, y: wallDx / wallLength };
  const extendToPerpendicularDepth = (
    point: ReflectionPoint,
    perpendicularDepth: number,
  ): ReflectionPoint | null => {
    const dx = point.x - sensor.x;
    const dy = point.y - sensor.y;
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || distance < 100) return null;
    const rayX = dx / distance;
    const rayY = dy / distance;
    const outwardComponent = rayX * outwardNormal.x + rayY * outwardNormal.y;
    if (!Number.isFinite(outwardComponent) || outwardComponent <= 0.01) return null;
    const extra = perpendicularDepth / outwardComponent;
    return {
      x: point.x + rayX * extra,
      y: point.y + rayY * extra,
    };
  };

  // Start only after the full perpendicular wall uncertainty margin. The
  // configurable protection depth extends beyond that safe boundary.
  const nearA = extendToPerpendicularDepth(segment[0], REFLECTION_START_OFFSET_MM);
  const nearB = extendToPerpendicularDepth(segment[1], REFLECTION_START_OFFSET_MM);
  const farDepth = REFLECTION_START_OFFSET_MM + protectionDepth;
  const farA = extendToPerpendicularDepth(segment[0], farDepth);
  const farB = extendToPerpendicularDepth(segment[1], farDepth);
  if (!nearA || !nearB || !farA || !farB) return null;
  const points = [nearA, nearB, farB, farA];
  if (reflectionPolygonEntersRoom(points, roomPoints)) return null;
  return { mirrorId: mirror.id, points };
};

export const createMirrorReflectionPolygons = (
  roomPoints: ReflectionPoint[],
  mirrors: MirrorPlacement[],
  sensor: ReflectionSensorPlacement,
): ReflectionPolygon[] => mirrors
  .map(mirror => createMirrorReflectionPolygon(roomPoints, mirror, sensor))
  .filter((polygon): polygon is ReflectionPolygon => polygon !== null);

export const pointInPolygon = (point: ReflectionPoint, polygon: ReflectionPoint[]): boolean => {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
};

/** The targets of one radar that are not reflections in a protected mirror. */
export const filterReflectedTargets = <T extends ReflectionPoint>(
  targets: T[],
  roomPoints: ReflectionPoint[],
  mirrors: MirrorPlacement[],
  sensor: ReflectionSensorPlacement,
): T[] => {
  const polygons = createMirrorReflectionPolygons(roomPoints, mirrors, sensor);
  return targets.filter(target => !polygons.some(polygon => pointInPolygon(target, polygon.points)));
};

export const distanceToPolygonBoundary = (
  point: ReflectionPoint,
  polygon: ReflectionPoint[],
): number => {
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

/**
 * Treat room boundaries as measurement geometry, not an exact exclusion.
 * Small placement, wall-drawing and radar-angle errors must not hide a person.
 */
export const safelyOutsideRoom = (
  point: ReflectionPoint,
  polygon: ReflectionPoint[],
  marginMm = OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM,
): boolean => polygon.length >= 3
  && !pointInPolygon(point, polygon)
  && distanceToPolygonBoundary(point, polygon) >= marginMm;

/** Allocate firmware exclusion slots without silently dropping a polygon. */
export const allocateReflectionExclusions = (
  manualPolygons: ReflectionPoint[][],
  reflectionPolygons: ReflectionPolygon[],
  maximumSlots = 2,
): ReflectionAllocation => {
  const all = [...manualPolygons, ...reflectionPolygons.map(item => item.points)];
  return {
    polygons: all.slice(0, maximumSlots),
    manualCount: manualPolygons.length,
    mirrorCount: reflectionPolygons.length,
    overflow: Math.max(0, all.length - maximumSlots),
  };
};
