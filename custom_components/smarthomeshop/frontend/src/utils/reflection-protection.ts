export interface ReflectionPoint { x: number; y: number }
export interface MirrorPlacement {
  id: string;
  wallIndex: number;
  position: number;
  width: number;
  protectionEnabled?: boolean;
  reflectionDepthMm?: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const SAFETY_MARGIN_MM = 350;

const signedArea = (points: ReflectionPoint[]): number => points.reduce((area, point, index) => {
  const next = points[(index + 1) % points.length];
  return area + point.x * next.y - next.x * point.y;
}, 0) / 2;

const orientation = (a: ReflectionPoint, b: ReflectionPoint, c: ReflectionPoint): number =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

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

const segmentsIntersect = (
  a: ReflectionPoint,
  b: ReflectionPoint,
  c: ReflectionPoint,
  d: ReflectionPoint,
): boolean => {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  return first * second < -0.001 && third * fourth < -0.001;
};

const segmentDistance = (
  a: ReflectionPoint,
  b: ReflectionPoint,
  c: ReflectionPoint,
  d: ReflectionPoint,
): number => segmentsIntersect(a, b, c, d) ? 0 : Math.min(
  pointToSegmentDistance(a, c, d),
  pointToSegmentDistance(b, c, d),
  pointToSegmentDistance(c, a, b),
  pointToSegmentDistance(d, a, b),
);

const reflectionEntersRoom = (reflection: ReflectionPoint[], room: ReflectionPoint[]): boolean => {
  if (reflection.some(point => pointInPolygon(point, room))) return true;
  if (room.some(point => pointInPolygon(point, reflection))) return true;
  for (let index = 0; index < reflection.length; index += 1) {
    const start = reflection[index];
    const end = reflection[(index + 1) % reflection.length];
    const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    if (pointInPolygon(midpoint, room)) return true;
    for (let roomIndex = 0; roomIndex < room.length; roomIndex += 1) {
      if (segmentDistance(start, end, room[roomIndex], room[(roomIndex + 1) % room.length])
        < SAFETY_MARGIN_MM - 0.001) return true;
    }
  }
  return false;
};

export const createMirrorReflectionPolygon = (
  roomPoints: ReflectionPoint[],
  mirror: MirrorPlacement,
  sensor: ReflectionPoint,
): ReflectionPoint[] | null => {
  if (mirror.protectionEnabled !== true || roomPoints.length < 3) return null;
  if (mirror.wallIndex < 0 || mirror.wallIndex >= roomPoints.length) return null;
  const wallStart = roomPoints[mirror.wallIndex];
  const wallEnd = roomPoints[(mirror.wallIndex + 1) % roomPoints.length];
  const dx = wallEnd.x - wallStart.x;
  const dy = wallEnd.y - wallStart.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1) return null;
  const halfFraction = clamp((Number(mirror.width) || 0) / length / 2, 0.005, 0.5);
  const position = clamp(Number(mirror.position) || 0.5, halfFraction, 1 - halfFraction);
  const at = (t: number): ReflectionPoint => ({ x: wallStart.x + dx * t, y: wallStart.y + dy * t });
  const a = at(position - halfFraction);
  const b = at(position + halfFraction);
  const area = signedArea(roomPoints);
  if (!Number.isFinite(area) || Math.abs(area) < 1) return null;
  const outward = area > 0
    ? { x: dy / length, y: -dx / length }
    : { x: -dy / length, y: dx / length };
  const extend = (point: ReflectionPoint, perpendicularDepth: number): ReflectionPoint | null => {
    const vx = point.x - sensor.x;
    const vy = point.y - sensor.y;
    const distance = Math.hypot(vx, vy);
    if (!Number.isFinite(distance) || distance < 100) return null;
    const rayX = vx / distance;
    const rayY = vy / distance;
    const outwardComponent = rayX * outward.x + rayY * outward.y;
    if (!Number.isFinite(outwardComponent) || outwardComponent <= 0.01) return null;
    const extra = perpendicularDepth / outwardComponent;
    return { x: point.x + rayX * extra, y: point.y + rayY * extra };
  };
  const depth = clamp(Number(mirror.reflectionDepthMm) || 2000, 250, 6000);
  const nearA = extend(a, SAFETY_MARGIN_MM);
  const nearB = extend(b, SAFETY_MARGIN_MM);
  const farA = extend(a, SAFETY_MARGIN_MM + depth);
  const farB = extend(b, SAFETY_MARGIN_MM + depth);
  if (!nearA || !nearB || !farA || !farB) return null;
  const polygon = [nearA, nearB, farB, farA];
  return reflectionEntersRoom(polygon, roomPoints) ? null : polygon;
};

export const pointInPolygon = (point: ReflectionPoint, polygon: ReflectionPoint[]): boolean => {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

export const filterReflectedTargets = <T extends ReflectionPoint>(
  targets: T[],
  roomPoints: ReflectionPoint[],
  mirrors: MirrorPlacement[],
  sensor: ReflectionPoint,
): T[] => {
  const polygons = mirrors
    .map(mirror => createMirrorReflectionPolygon(roomPoints, mirror, sensor))
    .filter((polygon): polygon is ReflectionPoint[] => polygon !== null);
  return targets.filter(target => !polygons.some(polygon => pointInPolygon(target, polygon)));
};
