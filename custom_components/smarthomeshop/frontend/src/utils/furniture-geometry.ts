export interface FurnitureRotationSource {
  rotationDeg?: unknown;
  rotation?: unknown;
}

export interface FurnitureCorner {
  x: number;
  y: number;
}

export const resolveFurnitureRotation = (furniture: FurnitureRotationSource): number => {
  const rotation = Number(furniture.rotationDeg ?? furniture.rotation ?? 0);
  return Number.isFinite(rotation) ? rotation : 0;
};

export const rotatedFurnitureCorners = (
  centerX: number,
  centerY: number,
  width: number,
  depth: number,
  rotationDeg: number,
): FurnitureCorner[] => {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const radians = (rotationDeg * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const offsets: Array<[number, number]> = [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ];

  return offsets.map(([offsetX, offsetY]) => ({
    x: centerX + offsetX * cosine - offsetY * sine,
    y: centerY + offsetX * sine + offsetY * cosine,
  }));
};
