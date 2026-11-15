export interface RadarRoomPointLike { x: number; y: number }

export interface RadarRoomFurnitureLike {
  x?: number;
  y?: number;
  width?: number;
  depth?: number;
  height?: number;
  rotationDeg?: number;
  rotation?: number;
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** Durable Floorplan Designer storage historically names floor-plan depth `height`. */
export const radarRoomFurnitureDepth = (item: RadarRoomFurnitureLike): number | null => {
  if (finite(item.depth) && item.depth > 0) return item.depth;
  return finite(item.height) && item.height > 0 ? item.height : null;
};

/** Return the rotated floor footprint of one saved furniture item in millimetres. */
export const radarRoomFurnitureCorners = (item: RadarRoomFurnitureLike): RadarRoomPointLike[] => {
  const depth = radarRoomFurnitureDepth(item);
  if (!finite(item.x) || !finite(item.y) || !finite(item.width) || item.width <= 0 || depth === null) return [];
  const rotation = ((finite(item.rotationDeg) ? item.rotationDeg : finite(item.rotation) ? item.rotation : 0) * Math.PI) / 180;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  return [
    [-item.width / 2, -depth / 2],
    [item.width / 2, -depth / 2],
    [item.width / 2, depth / 2],
    [-item.width / 2, depth / 2],
  ].map(([x, y]) => ({
    x: item.x! + x * cosine - y * sine,
    y: item.y! + x * sine + y * cosine,
  }));
};
