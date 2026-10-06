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
  const extend = (point: ReflectionPoint, extra: number): ReflectionPoint | null => {
    const vx = point.x - sensor.x;
    const vy = point.y - sensor.y;
    const distance = Math.hypot(vx, vy);
    return distance < 100 ? null : { x: point.x + vx / distance * extra, y: point.y + vy / distance * extra };
  };
  const depth = clamp(Number(mirror.reflectionDepthMm) || 2000, 250, 6000);
  const nearA = extend(a, 50), nearB = extend(b, 50), farA = extend(a, depth), farB = extend(b, depth);
  return nearA && nearB && farA && farB ? [nearA, nearB, farB, farA] : null;
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
