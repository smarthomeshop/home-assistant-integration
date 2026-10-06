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
const REFLECTION_START_OFFSET_MM = 50;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

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

  const depth = clamp(
    Number(mirror.reflectionDepthMm) || DEFAULT_REFLECTION_DEPTH_MM,
    250,
    6000,
  );
  const extend = (point: ReflectionPoint, extra: number): ReflectionPoint | null => {
    const dx = point.x - sensor.x;
    const dy = point.y - sensor.y;
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || distance < 100) return null;
    return {
      x: point.x + (dx / distance) * extra,
      y: point.y + (dy / distance) * extra,
    };
  };

  const nearA = extend(segment[0], REFLECTION_START_OFFSET_MM);
  const nearB = extend(segment[1], REFLECTION_START_OFFSET_MM);
  const farA = extend(segment[0], depth);
  const farB = extend(segment[1], depth);
  if (!nearA || !nearB || !farA || !farB) return null;
  return { mirrorId: mirror.id, points: [nearA, nearB, farB, farA] };
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
