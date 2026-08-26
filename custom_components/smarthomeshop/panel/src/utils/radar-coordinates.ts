export type RadarCoordinateProjection = 'forward_xy' | 'floor_xy';

export interface LocalRadarTarget {
  x: number;
  y: number;
}

export interface RadarPlacement {
  x: number;
  y: number;
  rotation: number;
}

export const MAX_RADAR_POLYGON_VERTICES = 20;

/** Serialize one firmware polygon and reject shapes the radar cannot store. */
export const serializeRadarPolygon = (
  points: LocalRadarTarget[],
): string => {
  if (points.length > MAX_RADAR_POLYGON_VERTICES) {
    throw new RangeError(`A radar polygon supports at most ${MAX_RADAR_POLYGON_VERTICES} vertices.`);
  }
  return points.map(point => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new TypeError('Radar polygon coordinates must be finite numbers.');
    }
    return `${Math.round(point.x)}:${Math.round(point.y)}`;
  }).join(';');
};

/** Convert one native radar coordinate to millimetres. */
export const normalizeRadarCoordinate = (
  rawState: unknown,
  coordinateScaleToMm: number,
): number | null => {
  if (rawState === null || rawState === undefined) return null;
  const state = String(rawState).trim().toLowerCase();
  if (!state || ['unknown', 'unavailable', 'none', 'null', 'nan'].includes(state)) return null;
  const raw = Number.parseFloat(state);
  if (!Number.isFinite(raw) || !Number.isFinite(coordinateScaleToMm) || coordinateScaleToMm <= 0) return null;
  const value = raw * coordinateScaleToMm;
  return Number.isFinite(value) ? value : null;
};

/**
 * Project a normalized sensor-local point onto the room floor.
 *
 * Both supported projections use X as the radar's lateral axis. In wall mode
 * Y is distance forward from the boundary; in ceiling mode X/Y already form
 * the floor plane. Keeping this switch explicit prevents scaling and mounting
 * assumptions from leaking into entity parsing.
 */
export const projectRadarTargetToRoom = (
  target: LocalRadarTarget,
  placement: RadarPlacement,
  projection: RadarCoordinateProjection,
): LocalRadarTarget => {
  const rotation = (placement.rotation - 90) * Math.PI / 180;
  switch (projection) {
    case 'floor_xy':
    case 'forward_xy':
      return {
        x: placement.x + target.y * Math.cos(rotation) - target.x * Math.sin(rotation),
        y: placement.y + target.y * Math.sin(rotation) + target.x * Math.cos(rotation),
      };
  }
};

/** Convert one room point back into the radar's local X/Y coordinate frame. */
export const projectRoomPointToRadar = (
  point: LocalRadarTarget,
  placement: RadarPlacement,
): LocalRadarTarget => {
  const rotation = (placement.rotation - 90) * Math.PI / 180;
  const dx = point.x - placement.x;
  const dy = point.y - placement.y;
  return {
    x: -dx * Math.sin(rotation) + dy * Math.cos(rotation),
    y: dx * Math.cos(rotation) + dy * Math.sin(rotation),
  };
};

/**
 * Keep a measured sensor-local coverage shape attached to the sensor when its
 * position or software orientation is corrected in Room Designer.
 */
export const reprojectRadarCoverage = (
  roomPoints: LocalRadarTarget[],
  previousPlacement: RadarPlacement,
  nextPlacement: RadarPlacement,
  projection: RadarCoordinateProjection,
): LocalRadarTarget[] => roomPoints.map(point => projectRadarTargetToRoom(
  projectRoomPointToRadar(point, previousPlacement),
  nextPlacement,
  projection,
));
