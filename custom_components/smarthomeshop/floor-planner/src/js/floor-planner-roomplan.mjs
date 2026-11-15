// RoomPlan parser from the SmartHomeShop Home Assistant integration.
// SPDX-License-Identifier: AGPL-3.0-only
class RoomPlanImportError extends Error {
  code;
  constructor(code) {
    super(code);
    this.code = code;
    this.name = "RoomPlanImportError";
  }
}
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const surfaces = (value) => Array.isArray(value) ? value.filter(isRecord).slice(0, 500) : [];
const matrix = (value) => {
  if (!Array.isArray(value))
    return null;
  const flattened = (Array.isArray(value[0]) ? value.flat() : value).map(Number);
  return flattened.length === 16 && flattened.every(Number.isFinite) ? flattened : null;
};
const dimensions = (surface) => Array.isArray(surface.dimensions) ? surface.dimensions.map(Number) : [];
const centre = (surface) => {
  const transform = matrix(surface.transform);
  return transform ? { x: transform[12] * 1e3, y: transform[14] * 1e3 } : null;
};
const category = (surface) => {
  if (typeof surface.category === "string")
    return surface.category;
  return isRecord(surface.category) ? Object.keys(surface.category)[0] || "" : "";
};
const roomLabel = (group, fallback) => {
  for (const key of ["name", "label"]) {
    const value = group[key];
    if (typeof value === "string" && value.trim())
      return value.trim().slice(0, 120);
  }
  const sections = Array.isArray(group.sections) ? group.sections.filter(isRecord) : [];
  const label = sections.find((section) => typeof section.label === "string")?.label;
  const labels = {
    livingRoom: "Living room",
    bedroom: "Bedroom",
    bathroom: "Bathroom",
    kitchen: "Kitchen",
    diningRoom: "Dining room"
  };
  return typeof label === "string" && label !== "unidentified" ? labels[label] || label : fallback;
};
const wallSegments = (group) => surfaces(group.walls).map((wall) => {
  const transform = matrix(wall.transform);
  const [length = 0] = dimensions(wall);
  if (!transform || !Number.isFinite(length) || length < 0.05 || length > 100)
    return null;
  const axisLength = Math.hypot(transform[0], transform[2]);
  if (axisLength < 1e-8)
    return null;
  const half = length * 500;
  const dx = transform[0] / axisLength;
  const dy = transform[2] / axisLength;
  const x = transform[12] * 1e3;
  const y = transform[14] * 1e3;
  return {
    a: { x: x - dx * half, y: y - dy * half },
    b: { x: x + dx * half, y: y + dy * half }
  };
}).filter((segment) => segment !== null);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const orderedSegments = (input, reverseFirst) => {
  const remaining = input.slice(1);
  const first = reverseFirst ? { a: input[0].b, b: input[0].a } : input[0];
  const ordered = [first];
  let gap = 0;
  let maximumGap = 0;
  while (remaining.length) {
    const current = ordered[ordered.length - 1].b;
    let bestIndex = 0;
    let bestReverse = false;
    let bestDistance = Infinity;
    remaining.forEach((segment, index) => {
      const forward = distance(current, segment.a);
      const reverse = distance(current, segment.b);
      if (forward < bestDistance) {
        bestIndex = index;
        bestReverse = false;
        bestDistance = forward;
      }
      if (reverse < bestDistance) {
        bestIndex = index;
        bestReverse = true;
        bestDistance = reverse;
      }
    });
    const next = remaining.splice(bestIndex, 1)[0];
    ordered.push(bestReverse ? { a: next.b, b: next.a } : next);
    gap += bestDistance;
    maximumGap = Math.max(maximumGap, bestDistance);
  }
  const closingGap = distance(ordered[ordered.length - 1].b, ordered[0].a);
  return { segments: ordered, gap: gap + closingGap, maximumGap: Math.max(maximumGap, closingGap) };
};
const polygonArea = (points) => Math.abs(points.reduce((sum, point, index) => {
  const next = points[(index + 1) % points.length];
  return sum + point.x * next.y - next.x * point.y;
}, 0)) / 2;
const cleanPolygon = (points) => {
  let output = points.filter((point, index) => index === 0 || distance(point, points[index - 1]) >= 40);
  if (output.length > 2 && distance(output[0], output[output.length - 1]) < 40)
    output = output.slice(0, -1);
  let changed = true;
  while (changed && output.length > 3) {
    changed = false;
    output = output.filter((point, index, list) => {
      const previous = list[(index - 1 + list.length) % list.length];
      const next = list[(index + 1) % list.length];
      const lineLength = distance(previous, next);
      if (lineLength < 1)
        return false;
      const deviation = Math.abs((next.x - previous.x) * (previous.y - point.y) - (previous.x - point.x) * (next.y - previous.y)) / lineLength;
      if (deviation <= 20) {
        changed = true;
        return false;
      }
      return true;
    });
  }
  return output;
};
const polygonFromFloor = (group) => {
  for (const floor of surfaces(group.floors)) {
    const transform = matrix(floor.transform);
    const corners = Array.isArray(floor.polygonCorners) ? floor.polygonCorners : [];
    if (!transform || corners.length < 3 || corners.length > 100)
      continue;
    const points = corners.map((corner) => {
      if (!Array.isArray(corner) || corner.length < 3)
        return null;
      const [x, y, z] = corner.map(Number);
      if (![x, y, z].every(Number.isFinite))
        return null;
      return {
        x: (transform[0] * x + transform[4] * y + transform[8] * z + transform[12]) * 1e3,
        y: (transform[2] * x + transform[6] * y + transform[10] * z + transform[14]) * 1e3
      };
    }).filter((point) => point !== null);
    const cleaned = cleanPolygon(points);
    if (cleaned.length >= 3 && polygonArea(cleaned) >= 5e5)
      return cleaned;
  }
  return null;
};
const polygonFromWalls = (group) => {
  const segments = wallSegments(group);
  if (segments.length < 3)
    return null;
  const forward = orderedSegments(segments, false);
  const reverse = orderedSegments(segments, true);
  const traced = forward.gap <= reverse.gap ? forward : reverse;
  if (traced.maximumGap > 2e3)
    return null;
  const points = cleanPolygon(traced.segments.map((segment, index, list) => {
    const previous = list[(index - 1 + list.length) % list.length];
    return { x: (previous.b.x + segment.a.x) / 2, y: (previous.b.y + segment.a.y) / 2 };
  }));
  if (points.length < 3 || polygonArea(points) < 5e5)
    return null;
  return { points, approximate: traced.maximumGap > 250 };
};
const centreRoom = (points) => {
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const offset = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  return { points: points.map((point) => ({ x: point.x - offset.x, y: point.y - offset.y })), offset };
};
const wallsFromPoints = (points) => points.map((point, index) => {
  const next = points[(index + 1) % points.length];
  return { x1: Math.round(point.x), y1: Math.round(point.y), x2: Math.round(next.x), y2: Math.round(next.y) };
});
const nearestWall = (point, points) => {
  let best = null;
  points.forEach((start, wallIndex) => {
    const end = points[(wallIndex + 1) % points.length];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared < 1)
      return;
    const position = Math.min(0.98, Math.max(0.02, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    const projected = { x: start.x + dx * position, y: start.y + dy * position };
    const candidate = { wallIndex, position, distance: distance(point, projected) };
    if (!best || candidate.distance < best.distance)
      best = candidate;
  });
  return best;
};
const furnitureMap = {
  bed: "bed",
  sofa: "sofa",
  chair: "chair",
  table: "table",
  storage: "cabinet",
  refrigerator: "cabinet",
  oven: "cabinet",
  stove: "cabinet",
  dishwasher: "cabinet",
  washerDryer: "cabinet"
};
const titleCase = (value) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase());
const buildRoom = (group, index, defaultName, warnings) => {
  const floorPolygon = polygonFromFloor(group);
  const traced = floorPolygon ? null : polygonFromWalls(group);
  const rawPoints = floorPolygon || traced?.points;
  if (!rawPoints)
    return null;
  if (traced?.approximate)
    warnings.add("approximate_boundary");
  const centered = centreRoom(rawPoints);
  const points = centered.points;
  const shift = (point) => ({ x: point.x - centered.offset.x, y: point.y - centered.offset.y });
  const openingList = (key) => surfaces(group[key]).flatMap((surface, itemIndex) => {
    const rawCentre = centre(surface);
    const [width = key === "doors" ? 0.9 : 1.2, height = key === "doors" ? 2 : 1] = dimensions(surface);
    if (!rawCentre || !Number.isFinite(width) || width <= 0)
      return [];
    const placement = nearestWall(shift(rawCentre), points);
    if (!placement || placement.distance > 1250) {
      warnings.add("skipped_opening");
      return [];
    }
    return [{
      id: `${key === "doors" ? "door" : "window"}_roomplan_${index + 1}_${itemIndex + 1}`,
      wallIndex: placement.wallIndex,
      position: placement.position,
      width: Math.round(width * 1e3),
      ...key === "doors" ? { openDirection: "inward", openSide: "left" } : { height: Math.round((Number.isFinite(height) ? height : 1) * 1e3), windowType: "fixed" }
    }];
  });
  const furniture = surfaces(group.objects).flatMap((object, itemIndex) => {
    const rawCentre = centre(object);
    const transform = matrix(object.transform);
    const [width = 0.5, _height = 0.5, depth = 0.5] = dimensions(object);
    const objectCategory = category(object);
    const typeId = furnitureMap[objectCategory];
    if (!rawCentre || !transform || !typeId || ![width, depth].every(Number.isFinite)) {
      if (objectCategory && !typeId)
        warnings.add("skipped_furniture");
      return [];
    }
    const position = shift(rawCentre);
    return [{
      id: `furniture_roomplan_${index + 1}_${itemIndex + 1}`,
      typeId,
      name: titleCase(objectCategory),
      x: Math.round(position.x),
      y: Math.round(position.y),
      width: Math.max(100, Math.round(width * 1e3)),
      height: Math.max(100, Math.round(depth * 1e3)),
      rotationDeg: Math.round(Math.atan2(transform[2], transform[0]) * 180 / Math.PI)
    }];
  });
  return {
    id: `roomplan_${index + 1}`,
    house: { x: centered.offset.x, y: centered.offset.y, floor: 0, rotationDeg: 0 },
    name: roomLabel(group, `${defaultName}${index ? ` ${index + 1}` : ""}`),
    walls: wallsFromPoints(points),
    furniture,
    devices: [],
    doors: openingList("doors"),
    windows: openingList("windows"),
    mirrors: [],
    sensors: [],
    zones: []
  };
};
const roomGroups = (data) => {
  const nested = Array.isArray(data.rooms) ? data.rooms.filter((room) => isRecord(room) && surfaces(room.walls).length >= 3) : [];
  if (nested.length)
    return nested.slice(0, 100);
  return surfaces(data.walls).length >= 3 ? [data] : [];
};
const isAppleRoomPlan = (data) => isRecord(data) && roomGroups(data).length > 0;
const parseAppleRoomPlan = (data, defaultName = "LiDAR room") => {
  if (!isRecord(data) || !isAppleRoomPlan(data))
    throw new RoomPlanImportError("not_roomplan");
  const warnings = /* @__PURE__ */ new Set();
  const rooms = roomGroups(data).map((group, index) => buildRoom(group, index, defaultName, warnings)).filter((room) => room !== null);
  if (!rooms.length)
    throw new RoomPlanImportError("no_room_boundary");
  return { source: "apple_roomplan", rooms, warnings: [...warnings] };
};
const parseAppleRoomPlanText = (text, defaultName = "LiDAR room") => {
  try {
    return parseAppleRoomPlan(JSON.parse(text), defaultName);
  } catch (error) {
    if (error instanceof RoomPlanImportError)
      throw error;
    throw new RoomPlanImportError("invalid_json");
  }
};
export {
  RoomPlanImportError,
  isAppleRoomPlan,
  parseAppleRoomPlan,
  parseAppleRoomPlanText
};
