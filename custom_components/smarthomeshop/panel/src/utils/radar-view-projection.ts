export interface RadarViewPoint { x: number; y: number; z?: number | null }
export interface RadarViewBounds { minX: number; minY: number; maxX: number; maxY: number }

export const radarTargetIsFresh = (
  serverAgeMs: number | null | undefined,
  receivedAtMs: number,
  nowMs = Date.now(),
  maximumAgeMs = 15_000,
): boolean => {
  const initialAge = typeof serverAgeMs === 'number' && Number.isFinite(serverAgeMs)
    ? Math.max(0, serverAgeMs)
    : 0;
  const elapsedSinceReceipt = Math.max(0, nowMs - receivedAtMs);
  return initialAge + elapsedSinceReceipt <= maximumAgeMs;
};

/** Isometric radar projection that preserves the local X left/right ordering. */
export const projectStandaloneRadar3D = (
  point: RadarViewPoint,
  rangeMm: number,
  heightScaleMm: number,
): [number, number] => {
  const range = Math.max(1, rangeMm);
  const nx = point.x / range;
  const ny = point.y / range;
  const nz = typeof point.z === 'number' && Number.isFinite(point.z)
    ? point.z / Math.max(range, heightScaleMm)
    : 0;
  return [50 + (nx - ny) * 29, 69 + (nx + ny) * 15 - nz * 30];
};

/** Fit room coordinates with the same positive-Y-down orientation as the Floorplan Designer 2D view. */
export const projectRoomPoint2D = (
  point: { x: number; y: number },
  bounds: RadarViewBounds,
): [number, number] => {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min(84 / width, 84 / height);
  const drawnWidth = width * scale;
  const drawnHeight = height * scale;
  return [
    (100 - drawnWidth) / 2 + (point.x - bounds.minX) * scale,
    (100 - drawnHeight) / 2 + (point.y - bounds.minY) * scale,
  ];
};
