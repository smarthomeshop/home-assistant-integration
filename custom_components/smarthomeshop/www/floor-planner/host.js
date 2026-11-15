// Generated from floor-planner/src by floor-planner/build.mjs. Edit the source, then rebuild.

// src/ha/host.js
import { StatefulWholeHomeFusion, applyAuthoritativeRuntimeTracking, runtimeSnapshotIsAuthoritative } from "./fusion.js?v=e2198d0ff601";
import { FloorPlanValidationError as FloorPlanValidationError2, floorPlanValidationMessage } from "./safety.js?v=08fb810078d1";

// src/js/floor-planner-geometry.mjs
var epsilon = 1e-7;
var maxRoomCorners = 64;
var rectangle = (room) => [
  [room.x, room.y],
  [room.x + room.width, room.y],
  [room.x + room.width, room.y + room.depth],
  [room.x, room.y + room.depth]
];
var roomCorners = (room) => room.outline?.map(([x, y]) => [x + room.x, y + room.y]) ?? rectangle(room);
var polygonEdges = (points) => points.map((point2, index) => [point2, points[(index + 1) % points.length]]);
var cross = (ax, ay, bx, by) => ax * by - ay * bx;
var signedArea = (points) => polygonEdges(points).reduce((area, [[ax, ay], [bx, by]]) => area + ax * by - ay * bx, 0) / 2;
var samePoint = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < epsilon;
var onSegment = ([x, y], [ax, ay], [bx, by]) => Math.abs(cross(bx - ax, by - ay, x - ax, y - ay)) < epsilon && x >= Math.min(ax, bx) - epsilon && x <= Math.max(ax, bx) + epsilon && y >= Math.min(ay, by) - epsilon && y <= Math.max(ay, by) + epsilon;
function polygonContains(vertices, x, y, includeEdge = true) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[j], b = vertices[i];
    if (onSegment([x, y], a, b)) return includeEdge;
    if (a[1] > y !== b[1] > y && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function roomContains(room, point2, includeEdge = true) {
  const x = point2.x - room.x, y = point2.y - room.y;
  if (!room.outline) return includeEdge ? point2.x >= room.x && point2.y >= room.y && point2.x <= room.x + room.width && point2.y <= room.y + room.depth : x > epsilon && y > epsilon && x < room.width - epsilon && y < room.depth - epsilon;
  if (x < -epsilon || y < -epsilon || x > room.width + epsilon || y > room.depth + epsilon) return false;
  return polygonContains(room.outline, x, y, includeEdge);
}
function crossing(a, b, c, d) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]], [ex, ey] = [d[0] - c[0], d[1] - c[1]];
  const determinant = cross(dx, dy, ex, ey);
  if (Math.abs(determinant) < epsilon) return null;
  const [x, y] = [c[0] - a[0], c[1] - a[1]];
  const t = cross(x, y, ex, ey) / determinant, u = cross(x, y, dx, dy) / determinant;
  return t >= -epsilon && t <= 1 + epsilon && u >= -epsilon && u <= 1 + epsilon ? Math.max(0, Math.min(1, t)) : null;
}
function outlineBounds(points, { maxCorners = maxRoomCorners, minSpan = 0.5, maxSpan = 60, minArea = 0.1 } = {}) {
  if (points.length < 3 || points.length > maxCorners || points.some((point2) => !Array.isArray(point2) || point2.length !== 2 || !point2.every(Number.isFinite))) return null;
  const xs = points.map(([x2]) => x2), ys = points.map(([, y2]) => y2);
  const x = Math.min(...xs), y = Math.min(...ys);
  const width = Math.max(...xs) - x, depth = Math.max(...ys) - y;
  const area = signedArea(points);
  if (width < minSpan || depth < minSpan || width > maxSpan || depth > maxSpan || Math.abs(area) < minArea) return null;
  const edges = polygonEdges(points);
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    if (samePoint(a, b)) return null;
    const c = edges[(i + 1) % edges.length][1];
    if (onSegment(c, a, b) || onSegment(a, b, c)) return null;
    for (let j = i + 2; j < edges.length; j++) {
      if (i === 0 && j === edges.length - 1) continue;
      const [c2, d] = edges[j];
      if (crossing(a, b, c2, d) !== null || onSegment(a, c2, d) || onSegment(b, c2, d) || onSegment(c2, a, b) || onSegment(d, a, b)) return null;
    }
  }
  const outline = (area > 0 ? points : [points[0], ...points.slice(1).reverse()]).map(([px, py]) => [px - x, py - y]);
  return { x, y, width, depth, outline };
}
function validRoomOutline(room) {
  if (!Array.isArray(room.outline)) return false;
  const bounds = outlineBounds(room.outline);
  return Boolean(bounds && Math.abs(bounds.x) < epsilon && Math.abs(bounds.y) < epsilon && Math.abs(bounds.width - room.width) < epsilon && Math.abs(bounds.depth - room.depth) < epsilon && signedArea(room.outline) > 0);
}
function roomLineSpans(room, from, to, includeEdge = true) {
  const a = [from.x, from.y], b = [to.x, to.y];
  const cuts = [0, 1];
  for (const [c, d] of polygonEdges(roomCorners(room))) {
    const t = crossing(a, b, c, d);
    if (t !== null) cuts.push(t);
  }
  cuts.sort((a2, b2) => a2 - b2);
  const spans = [];
  for (let i = 1; i < cuts.length; i++) {
    const start = cuts[i - 1], end = cuts[i];
    if (end - start < epsilon) continue;
    const middle = (start + end) / 2;
    if (roomContains(room, { x: a[0] + (b[0] - a[0]) * middle, y: a[1] + (b[1] - a[1]) * middle }, includeEdge)) {
      if (spans.length && start - spans.at(-1)[1] < epsilon) spans.at(-1)[1] = end;
      else spans.push([start, end]);
    }
  }
  return spans;
}
var roomContainsLine = (room, from, to) => {
  const spans = roomLineSpans(room, from, to);
  return spans[0]?.[0] < epsilon && spans[0][1] > 1 - epsilon;
};
function edgePosition([ax, ay], [bx, by], point2) {
  const dx = bx - ax, dy = by - ay;
  const length = Math.hypot(dx, dy);
  const along = Math.max(0, Math.min(length, ((point2.x - ax) * dx + (point2.y - ay) * dy) / length));
  const angle2 = Math.atan2(dy, dx) * 180 / Math.PI;
  return {
    x: ax + dx * along / length,
    y: ay + dy * along / length,
    along,
    length,
    facing: (angle2 + 540) % 360,
    angle: (angle2 + 360) % 360,
    a: [ax, ay],
    b: [bx, by]
  };
}

// src/js/floor-planner-furniture.mjs
var entries = {
  living: {
    sofa: [2.25, 0.9, 0.85, "textile", "sofa"],
    corner: [2.8, 1.65, 0.85, "textile", "corner"],
    armchair: [0.85, 0.85, 0.85, "textile", "sofa"],
    coffee: [1.15, 0.6, 0.43, "wood", "table"],
    rug: [2.5, 1.7, 0.02, "ignore", "solid"],
    tv: [1.2, 0.12, 0.68, "mixed", "solid", 0.8],
    plant: [0.55, 0.55, 1.25, "mixed", "solid"]
  },
  work: {
    dining: [1.8, 0.85, 0.76, "wood", "table"],
    chair: [0.48, 0.52, 0.86, "wood", "chair"],
    desk: [1.45, 0.7, 0.76, "wood", "table"],
    island: [1.8, 0.9, 0.92, "wood", "solid"],
    fridge: [0.62, 0.67, 1.85, "metal", "solid"],
    washer: [0.6, 0.65, 0.85, "metal", "solid"]
  },
  sleep: {
    bed: [1.65, 2.1, 0.62, "textile", "bed"],
    nightstand: [0.43, 0.42, 0.52, "wood", "solid"],
    cabinet: [1.25, 0.42, 1.05, "wood", "solid"],
    wardrobe: [1.8, 0.62, 2.25, "wood", "solid"],
    shelves: [1.1, 0.35, 1.85, "wood", "shelves"],
    bath: [1.7, 0.76, 0.56, "stone", "bath"]
  },
  // Things a radar notices: a turning fan or a pet can look like a person,
  // and warm air from a heater moves the air the radar sees.
  motion: {
    fan: [0.42, 0.32, 1.15, "plastic", "solid"],
    pet: [0.8, 0.38, 0.42, "textile", "solid"],
    radiator: [1, 0.1, 0.6, "metal", "solid", 0.12],
    heater: [0.42, 0.26, 0.62, "metal", "solid"]
  },
  divide: {
    screen: [1.5, 0.08, 1.8, "wood", "solid"],
    glass: [1.25, 0.024, 2, "glass", "solid"],
    curtain: [1.8, 0.06, 2.25, "textile", "solid", 0.04],
    custom: [1, 0.5, 1, "mixed", "solid"]
  }
};
var furnitureCatalog = Object.fromEntries(Object.entries(entries).flatMap(([category, models]) => Object.entries(models).map(([kind, [width, depth, height, material, shape, base = 0]]) => [kind, { category, width, depth, height, material, shape, base }])));
var furnitureCategories = Object.keys(entries);
var furnitureMaterials = ["wood", "textile", "metal", "glass", "stone", "plastic", "mixed", "ignore"];
var maxFurniture = 160;
var shapeParts = {
  solid: [[0, 0, 1, 1, 0, 1, "body"]],
  sofa: [
    [0, 0, 1, 1, 0, 0.42, "body"],
    [0.09, 0.19, 0.82, 0.74, 0.42, 0.15, "seat"],
    [0, 0, 1, 0.18, 0.42, 0.58, "body"],
    [0, 0.18, 0.09, 0.82, 0.42, 0.32, "body"],
    [0.91, 0.18, 0.09, 0.82, 0.42, 0.32, "body"]
  ],
  corner: [
    [0, 0, 1, 0.56, 0, 0.42, "body"],
    [0, 0.56, 0.32, 0.44, 0, 0.42, "body"],
    [0.05, 0.12, 0.9, 0.4, 0.42, 0.15, "seat"],
    [0.05, 0.52, 0.24, 0.43, 0.42, 0.15, "seat"],
    [0, 0, 1, 0.12, 0.42, 0.58, "body"]
  ],
  table: [
    [0, 0, 1, 1, 0.89, 0.11, "top"],
    ...[0.08, 0.85].flatMap((x) => [0.08, 0.85].map((y) => [x, y, 0.07, 0.07, 0, 0.89, "frame"]))
  ],
  chair: [
    [0.04, 0.05, 0.92, 0.9, 0.47, 0.09, "seat"],
    [0.06, 0, 0.88, 0.11, 0.56, 0.44, "body"],
    ...[0.1, 0.82].flatMap((x) => [0.1, 0.82].map((y) => [x, y, 0.08, 0.08, 0, 0.47, "frame"]))
  ],
  bed: [
    [0, 0, 1, 1, 0, 0.57, "body"],
    [0.02, 0.02, 0.96, 0.96, 0.57, 0.2, "seat"],
    [0.04, 0.29, 0.92, 0.68, 0.77, 0.07, "duvet"],
    [0.08, 0.06, 0.36, 0.18, 0.77, 0.09, "pillow"],
    [0.56, 0.06, 0.36, 0.18, 0.77, 0.09, "pillow"],
    [0, 0, 1, 0.06, 0.57, 0.43, "body"]
  ],
  shelves: [
    [0, 0, 0.07, 1, 0, 1, "frame"],
    [0.93, 0, 0.07, 1, 0, 1, "frame"],
    ...[0, 0.28, 0.56, 0.79, 0.96].map((z) => [0.07, 0, 0.86, 1, z, 0.04, "top"])
  ],
  bath: [
    [0, 0, 1, 1, 0, 0.22, "body"],
    [0, 0, 0.08, 1, 0.22, 0.78, "body"],
    [0.92, 0, 0.08, 1, 0.22, 0.78, "body"],
    [0.08, 0, 0.84, 0.09, 0.22, 0.78, "body"],
    [0.08, 0.91, 0.84, 0.09, 0.22, 0.78, "body"]
  ]
};

// src/js/ceilsense-room-model.mjs
var mountingRanges = { ld2412: [2, 3], ld2460: [2, 3], ld6002b: [2, 3] };
var plannerRadars = [...Object.keys(mountingRanges), "combined"];
var slots = [0.5, 0.25, 0.75, 1 / 6, 5 / 6];

// src/js/floor-planner-ceiling.mjs
var ceilingHeightLimits = [1, 12];
var ceilingDirections = ["x+", "x-", "y+", "y-"];
var isHeight = (height) => Number.isFinite(height) && height >= ceilingHeightLimits[0] && height <= ceilingHeightLimits[1];
function validCeiling(room) {
  if (!isHeight(room.height)) return false;
  if (room.ceiling == null) return true;
  const { type, high, direction } = room.ceiling;
  return (type === "slope" || type === "gable") && isHeight(high) && high > room.height && ceilingDirections.includes(direction) && (type !== "gable" || direction.endsWith("+"));
}
var activeCeiling = (room) => validCeiling(room) ? room.ceiling : null;
function ceilingPosition(room, point2) {
  const alongX = activeCeiling(room)?.direction.startsWith("x");
  const position = alongX ? (point2.x - room.x) / room.width : (point2.y - room.y) / room.depth;
  return Math.max(0, Math.min(1, position));
}
function ceilingHeightAt(room, point2) {
  const ceiling = activeCeiling(room);
  if (!ceiling) return room.height;
  const position = ceilingPosition(room, point2);
  const { type, direction, high } = ceiling;
  const proportion = type === "gable" ? 1 - Math.abs(2 * position - 1) : direction.endsWith("+") ? position : 1 - position;
  return Number((room.height + (high - room.height) * proportion).toFixed(6));
}

// src/js/floor-planner-underlay.mjs
var bound = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
var maxImageData = 32e4;
function validUnderlay(image) {
  return image && typeof image.data === "string" && image.data.length <= maxImageData && /^data:image\/jpeg;base64,[a-z\d+/]+={0,2}$/i.test(image.data) && bound(image.ratio, 0.04, 25) && bound(image.width, 0.5, 220) && bound(image.x, -250, 250) && bound(image.y, -250, 250) && bound(image.opacity, 10, 85);
}

// src/js/floor-planner-model.mjs
var devices = {
  "ceilsense-mini": { name: "CeilSense Mini", image: "/images/ceilsense/final/mini-iso.webp", mount: "ceiling", defaultRadar: "ld2412", coming: true },
  "ceilsense-v2": { name: "CeilSense V2", image: "/images/ceilsense/final/v2-iso.webp", mount: "ceiling", defaultRadar: "ld2412" },
  "ceilsense-pro": { name: "CeilSense Pro", image: "/images/ceilsense/final/pro-iso.webp", mount: "ceiling", defaultRadar: "ld2412", coming: true },
  ceilsense: { name: "CeilSense V1", mount: "ceiling" },
  ultimatesensor: { name: "UltimateSensor", mount: "wall" },
  "ultimatesensor-mini": { name: "UltimateSensor Mini", mount: "wall" },
  "ultimatesensor-v2": { name: "UltimateSensor V2", image: "/assets/ultimatesensor-v2-white-hero.webp", mount: "wall", defaultRadar: "ld2450" },
  "ultimatesensor-mini-v2": { name: "UltimateSensor Mini V2", image: "/assets/ultimatesensor-mini-v2-white-hero.webp", mount: "wall", defaultRadar: "ld2450" },
  wallsense: { name: "WallSense", image: "/images/wallsense/hero-2026-09-22-512.webp", mount: "wall", defaultRadar: "ld2450", coming: true }
};
function installationsFor(model) {
  if (model === "wallsense") return ["wall-recessed"];
  if (devices[model]?.mount === "ceiling") return ["ceilsense-mini", "ceilsense-pro"].includes(model) ? ["ceiling-recessed", "ceiling-surface"] : ["ceiling-recessed"];
  return ["ultimatesensor-v2", "ultimatesensor-mini-v2"].includes(model) ? ["freestanding", "wall-bracket"] : ["freestanding"];
}
function radarsFor(model) {
  const device = devices[model];
  if (!device.defaultRadar) return ["none"];
  if (model === "wallsense") return ["ld2450"];
  if (device.mount === "wall") return ["ld2450", "ld2460"];
  return model === "ceilsense-v2" ? ["none", ...plannerRadars] : plannerRadars.filter((radar) => radar !== "combined");
}
function validSensorRadar(item) {
  if (!item.haDevice) return radarsFor(item.model).includes(item.radar);
  return item.radar === "none" || (devices[item.model].mount === "wall" ? ["ld2450", "ld2460"].includes(item.radar) : plannerRadars.includes(item.radar));
}
var contains = roomContains;
function wallVector(angle2) {
  const radians = angle2 * Math.PI / 180;
  return { x: Math.sin(radians), y: -Math.cos(radians) };
}
function roomForDevice(rooms, item) {
  const facing = wallVector(item.angle);
  const point2 = devices[item.model].mount === "wall" ? { x: item.x + facing.x * 0.08, y: item.y + facing.y * 0.08 } : item;
  return rooms.find((room) => contains(room, point2));
}
var numberBetween = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
var validRoomDimensions = (room) => numberBetween(room.width, 0.5, 60) && numberBetween(room.depth, 0.5, 60) && validCeiling(room);
var point = (value) => value && numberBetween(value.x, -100, 100) && numberBetween(value.y, -100, 100);
var angle = (value) => Number.isFinite(value) && value >= 0 && value < 360;
var validName = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 48;
var validMirrorProtection = (item) => (item.protectionEnabled === void 0 || typeof item.protectionEnabled === "boolean") && (item.reflectionDepthM === void 0 || numberBetween(item.reflectionDepthM, 0.25, 6));
var list = (value, check, maximum = 80) => Array.isArray(value) && value.length <= maximum && value.every((item) => item && typeof item.id === "string" && /^[a-z\d-]{1,48}$/i.test(item.id) && check(item));
var floorFinishes = ["boards", "tiles", "carpet", "concrete", "plain"];
var wallColors = ["white", "sand", "sage", "blue", "clay", "grey"];
var validFinish = (room) => (room.floorFinish === void 0 || floorFinishes.includes(room.floorFinish)) && (room.wallColor === void 0 || wallColors.includes(room.wallColor));
function validPlan(plan) {
  if (!plan || ![1, 2, 3].includes(plan.version) || !validName(plan.name)) return false;
  if (plan.underlay !== void 0 && !validUnderlay(plan.underlay)) return false;
  if (!list(plan.rooms, (item) => point(item) && validName(item.name) && validRoomDimensions(item) && validFinish(item) && (item.useSampleName === void 0 || typeof item.useSampleName === "boolean") && (item.outline === void 0 || plan.version >= 2 && validRoomOutline(item)) && (item.obstacles === void 0 || typeof item.obstacles === "boolean") && (item.priority == null || numberBetween(item.priority.x, 0.05, 0.95) && numberBetween(item.priority.y, 0.05, 0.95)))) return false;
  if (!list(plan.walls, (item) => point(item) && point({ x: item.endX, y: item.endY }) && (item.x !== item.endX || item.y !== item.endY))) return false;
  if (!list(plan.doors, (item) => point(item) && angle(item.angle) && numberBetween(item.width, 0.5, 2))) return false;
  if (!list(plan.sensors, (item) => point(item) && angle(item.angle) && Object.hasOwn(devices, item.model) && validSensorRadar(item) && (item.installation === void 0 || installationsFor(item.model).includes(item.installation)) && (item.climate === void 0 || item.model === "ceilsense-v2" && typeof item.climate === "boolean") && (item.mountHeight === void 0 || devices[item.model].mount === "wall" && numberBetween(item.mountHeight, 0.15, 6)) && (item.levelMountRoom == null || plan.rooms.some((room) => room.id === item.levelMountRoom && room.ceiling)))) return false;
  if (plan.furniture !== void 0 && !list(plan.furniture, (item) => point(item) && angle(item.angle) && validName(item.name) && Object.hasOwn(furnitureCatalog, item.kind) && furnitureMaterials.includes(item.material) && numberBetween(item.width, 0.02, 12) && numberBetween(item.depth, 0.02, 12) && numberBetween(item.height, 0.01, 6) && numberBetween(item.base, 0, 6), maxFurniture)) return false;
  const roomIds = new Set(plan.rooms.map((room) => room.id));
  for (const key of ["windows", "mirrors"]) {
    if (plan[key] !== void 0 && (plan.version !== 3 || !list(plan[key], (item) => point(item) && angle(item.angle) && roomIds.has(item.roomId) && numberBetween(item.width, 0.1, 8) && numberBetween(item.height, 0.1, 6) && numberBetween(item.base, 0, 6) && (key !== "mirrors" || validMirrorProtection(item))))) return false;
  }
  const sensorIds = new Set(plan.sensors.map((sensor) => sensor.id));
  if (plan.zones !== void 0 && (plan.version !== 3 || !list(plan.zones, (zone) => {
    if (!roomIds.has(zone.roomId) || !validName(zone.name) || !zoneTypes.includes(zone.type) || zone.direction !== void 0 && !["left", "right"].includes(zone.direction) || zone.sensorId != null && !sensorIds.has(zone.sensorId) || !Array.isArray(zone.parts) || !zone.parts.length || zone.parts.length > 12) return false;
    const room = plan.rooms.find((room2) => room2.id === zone.roomId);
    return zone.parts.every((part) => Array.isArray(part) && part.length >= 2 && part.length <= 64 && part.every((p) => Array.isArray(p) && p.length === 2 && point({ x: p[0], y: p[1] }) && contains(room, { x: p[0], y: p[1] })) && (zone.type === "entry" ? part.length === 2 && Math.hypot(part[1][0] - part[0][0], part[1][1] - part[0][1]) >= 0.1 : Boolean(outlineBounds(part, { minSpan: 0.1, minArea: 0.025 }))) && part.every(([x, y], i) => {
      if (zone.type === "entry" && i === 1) return true;
      const [endX, endY] = part[(i + 1) % part.length];
      return !room.outline || roomContainsLine(room, { x, y }, { x: endX, y: endY });
    }));
  }))) return false;
  const items = ["rooms", "walls", "doors", "sensors", "furniture", "windows", "mirrors", "zones"].flatMap((key) => plan[key] ?? []);
  return new Set(items.map((item) => item.id)).size === items.length;
}
var zoneTypes = ["detection", "exclusion", "entry", "interference"];
function blankPlan(name) {
  return { version: 1, name, rooms: [], walls: [], doors: [], sensors: [] };
}
var sampleRoomLayout = [
  ["living", 0, 0, 6.5, 4.5],
  ["kitchen", 6.5, 0, 4, 4.5],
  ["office", 0, 4.5, 4, 3.5],
  ["hall", 4, 4.5, 3, 3.5],
  ["bedroom", 7, 4.5, 3.5, 3.5]
];
var upperRoomLayout = [
  ["main-bedroom", 0, 0, 5, 4.5],
  ["child-bedroom", 5, 0, 5.5, 4.5],
  ["bathroom", 0, 4.5, 4, 3.5],
  ["landing", 4, 4.5, 3, 3.5],
  ["study", 7, 4.5, 3.5, 3.5]
];
var sampleRoomIds = new Set([...sampleRoomLayout, ...upperRoomLayout].map(([id]) => id));

// src/js/floor-planner-stairs.mjs
function validStaircase(staircase, floors) {
  if (!staircase || !Number.isFinite(staircase.width) || staircase.width < 0.6 || staircase.width > 2.4) return false;
  const lower = floors.find((floor) => floor.id === staircase.lower);
  const upper = floors.find((floor) => floor.id === staircase.upper);
  if (!lower || upper?.level !== lower.level + 1) return false;
  const { bottom, top } = staircase;
  if (![bottom, top].every((point2) => point2 && [point2.x, point2.y].every((value) => Number.isFinite(value) && Math.abs(value) <= 100))) return false;
  const run = Math.hypot(top.x - bottom.x, top.y - bottom.y);
  return run >= 1 && run <= 8;
}
var steps = 13;
var stairSteps = steps + 2;

// src/js/floor-planner-building.mjs
var buildingFormat = "smarthomeshop-building";
var maxFloors = 12;
var validProject = (value) => validPlan(value) || validBuilding(value);
function validBuilding(value) {
  if (value?.format !== buildingFormat || value.version !== 1 || typeof value.name !== "string" || !value.name.trim() || value.name.length > 48 || !Array.isArray(value.floors) || !value.floors.length || value.floors.length > maxFloors) return false;
  const ids = /* @__PURE__ */ new Set(), levels = /* @__PURE__ */ new Set();
  for (const floor of value.floors) {
    if (!floor || typeof floor.id !== "string" || !/^[a-z\d-]{1,48}$/i.test(floor.id) || ids.has(floor.id) || !Number.isInteger(floor.level) || floor.level < -5 || floor.level > 20 || levels.has(floor.level) || !(floor.name === null || typeof floor.name === "string" && floor.name.trim() && floor.name.length <= 32) || !validPlan(floor.plan)) return false;
    ids.add(floor.id);
    levels.add(floor.level);
  }
  return ids.has(value.activeFloor) && (value.staircase === void 0 || validStaircase(value.staircase, value.floors));
}
function roomContents(plan, room) {
  const edgeRoom = (door) => {
    const angle2 = door.angle * Math.PI / 180;
    const middle = { x: door.x + Math.cos(angle2) * door.width / 2, y: door.y + Math.sin(angle2) * door.width / 2 };
    return plan.rooms.find((candidate) => contains(candidate, middle) || polygonEdges(roomCorners(candidate)).some(([a, b]) => {
      const onWall = edgePosition(a, b, middle);
      return Math.hypot(onWall.x - middle.x, onWall.y - middle.y) < 0.02;
    }))?.id;
  };
  return {
    rooms: [room],
    walls: plan.walls.filter((item) => plan.rooms.find((candidate) => contains(candidate, item) && contains(candidate, { x: item.endX, y: item.endY }))?.id === room.id),
    doors: plan.doors.filter((item) => (item.roomId ?? edgeRoom(item)) === room.id),
    sensors: plan.sensors.filter((item) => roomForDevice(plan.rooms, item)?.id === room.id),
    furniture: (plan.furniture ?? []).filter((item) => plan.rooms.find((candidate) => contains(candidate, item))?.id === room.id),
    ...Object.fromEntries(["windows", "mirrors", "zones"].map((key) => [key, (plan[key] ?? []).filter((item) => item.roomId === room.id)]))
  };
}

// src/ha/ha-rooms.js
import { zoneOwnerIsAvailable } from "./safety.js?v=08fb810078d1";

// ../panel/src/utils/radar-coordinates.ts
var normalizeRadarCoordinate = (rawState, coordinateScaleToMm) => {
  if (rawState === null || rawState === void 0) return null;
  const state = String(rawState).trim().toLowerCase();
  if (!state || ["unknown", "unavailable", "none", "null", "nan"].includes(state)) return null;
  const raw = Number.parseFloat(state);
  if (!Number.isFinite(raw) || !Number.isFinite(coordinateScaleToMm) || coordinateScaleToMm <= 0) return null;
  const value = raw * coordinateScaleToMm;
  return Number.isFinite(value) ? value : null;
};
var projectRadarTargetToRoom = (target, placement, projection) => {
  const rotation = (placement.rotation - 90) * Math.PI / 180;
  switch (projection) {
    case "floor_xy":
    case "forward_xy":
      return {
        x: placement.x + target.y * Math.cos(rotation) - target.x * Math.sin(rotation),
        y: placement.y + target.y * Math.sin(rotation) + target.x * Math.cos(rotation)
      };
  }
};

// ../panel/src/utils/reflection-protection.ts
var OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM = 350;
var pointInPolygon = (point2, polygon) => {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = a.y > point2.y !== b.y > point2.y && point2.x < (b.x - a.x) * (point2.y - a.y) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
};
var distanceToPolygonBoundary = (point2, polygon) => {
  if (polygon.length < 2) return Number.POSITIVE_INFINITY;
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const fraction = lengthSquared > 0 ? Math.max(0, Math.min(
      1,
      ((point2.x - start.x) * dx + (point2.y - start.y) * dy) / lengthSquared
    )) : 0;
    minimum = Math.min(minimum, Math.hypot(
      point2.x - (start.x + fraction * dx),
      point2.y - (start.y + fraction * dy)
    ));
  }
  return minimum;
};
var safelyOutsideRoom = (point2, polygon, marginMm = OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM) => polygon.length >= 3 && !pointInPolygon(point2, polygon) && distanceToPolygonBoundary(point2, polygon) >= marginMm;

// ../panel/src/utils/whole-home.ts
var DEFAULT_ROOM_SIZE = 4e3;
var ROOM_GAP = 700;
var finite = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
var roomPolygon = (room) => (Array.isArray(room.walls) ? room.walls : []).filter((wall) => typeof wall === "object" && wall !== null).map((wall) => ({ x: finite(wall.x1), y: finite(wall.y1) })).filter((point2) => Number.isFinite(point2.x) && Number.isFinite(point2.y));
var safeSuppressionRoomPolygon = (room) => {
  const walls = Array.isArray(room.walls) ? room.walls : [];
  if (walls.length < 3) return [];
  const segments = walls.map((wall) => ({
    start: { x: Number(wall?.x1), y: Number(wall?.y1) },
    end: { x: Number(wall?.x2), y: Number(wall?.y2) }
  }));
  if (segments.some((segment) => ![segment.start.x, segment.start.y, segment.end.x, segment.end.y].every(Number.isFinite) || Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y) <= 1e-3)) return [];
  if (segments.some((segment, index) => {
    const next = segments[(index + 1) % segments.length];
    return Math.hypot(segment.end.x - next.start.x, segment.end.y - next.start.y) > 1e-3;
  })) return [];
  const points = segments.map((segment) => segment.start);
  if (points.some((point2, index) => points.slice(index + 1).some((other) => Math.hypot(point2.x - other.x, point2.y - other.y) <= 1e-3))) return [];
  const areaTwice = points.reduce((sum, point2, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point2.x * next.y - next.x * point2.y;
  }, 0);
  if (Math.abs(areaTwice) <= 1e-3) return [];
  const cross2 = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const onSegment2 = (a, b, point2) => Math.abs(cross2(a, b, point2)) <= 1e-6 && point2.x >= Math.min(a.x, b.x) - 1e-6 && point2.x <= Math.max(a.x, b.x) + 1e-6 && point2.y >= Math.min(a.y, b.y) - 1e-6 && point2.y <= Math.max(a.y, b.y) + 1e-6;
  const intersectsOrTouches = (a, b) => {
    const a1 = cross2(a.start, a.end, b.start);
    const a2 = cross2(a.start, a.end, b.end);
    const b1 = cross2(b.start, b.end, a.start);
    const b2 = cross2(b.start, b.end, a.end);
    return a1 * a2 < 0 && b1 * b2 < 0 || onSegment2(a.start, a.end, b.start) || onSegment2(a.start, a.end, b.end) || onSegment2(b.start, b.end, a.start) || onSegment2(b.start, b.end, a.end);
  };
  for (let first = 0; first < segments.length; first += 1) {
    for (let second = first + 1; second < segments.length; second += 1) {
      if (second === first + 1 || first === 0 && second === segments.length - 1) continue;
      const a = segments[first];
      const b = segments[second];
      if (intersectsOrTouches(a, b)) return [];
    }
  }
  if (segments.some((segment, index) => {
    const next = segments[(index + 1) % segments.length];
    return onSegment2(segment.start, segment.end, next.end) && Math.hypot(next.end.x - segment.end.x, next.end.y - segment.end.y) > 1e-3;
  })) return [];
  return points;
};
var boundsForPoints = (points) => {
  if (!points.length) {
    return {
      minX: -DEFAULT_ROOM_SIZE / 2,
      minY: -DEFAULT_ROOM_SIZE / 2,
      maxX: DEFAULT_ROOM_SIZE / 2,
      maxY: DEFAULT_ROOM_SIZE / 2,
      width: DEFAULT_ROOM_SIZE,
      height: DEFAULT_ROOM_SIZE
    };
  }
  const xs = points.map((point2) => point2.x);
  const ys = points.map((point2) => point2.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(100, maxX - minX),
    height: Math.max(100, maxY - minY)
  };
};
var roomBounds = (room) => boundsForPoints(roomPolygon(room));
var normaliseQuarterTurn = (value) => {
  const turns = (Math.round(finite(value) / 90) % 4 + 4) % 4;
  return turns * 90;
};
var normaliseHousePlacement = (placement) => ({
  x: finite(placement?.x),
  y: finite(placement?.y),
  floor: Math.max(-5, Math.min(20, Math.round(finite(placement?.floor)))),
  rotationDeg: normaliseQuarterTurn(placement?.rotationDeg),
  visible: placement?.visible !== false
});
var transformHomePoint = (point2, placement) => {
  const radians = placement.rotationDeg * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: placement.x + point2.x * cos - point2.y * sin,
    y: placement.y + point2.x * sin + point2.y * cos
  };
};
var inverseTransformHomePoint = (point2, placement) => {
  const radians = -placement.rotationDeg * Math.PI / 180;
  const dx = point2.x - placement.x;
  const dy = point2.y - placement.y;
  return {
    x: dx * Math.cos(radians) - dy * Math.sin(radians),
    y: dx * Math.sin(radians) + dy * Math.cos(radians)
  };
};
var autoArrangeRooms = (rooms) => {
  const byFloor = /* @__PURE__ */ new Map();
  rooms.forEach((room) => {
    const floor = normaliseHousePlacement(room.house).floor;
    const group = byFloor.get(floor) || [];
    group.push(room);
    byFloor.set(floor, group);
  });
  const arranged = /* @__PURE__ */ new Map();
  for (const [floor, floorRooms] of byFloor) {
    const totalArea = floorRooms.reduce((sum, room) => {
      const bounds = roomBounds(room);
      return sum + bounds.width * bounds.height;
    }, 0);
    const targetRowWidth = Math.max(6e3, Math.sqrt(totalArea) * 1.65);
    let cursorX = 0;
    let cursorY = 0;
    let rowHeight = 0;
    floorRooms.forEach((room) => {
      const bounds = roomBounds(room);
      if (cursorX > 0 && cursorX + bounds.width > targetRowWidth) {
        cursorX = 0;
        cursorY += rowHeight + ROOM_GAP;
        rowHeight = 0;
      }
      const placement = {
        x: cursorX - bounds.minX,
        y: cursorY - bounds.minY,
        floor,
        rotationDeg: 0,
        visible: room.house?.visible !== false
      };
      arranged.set(room.id, { ...room, house: placement });
      cursorX += bounds.width + ROOM_GAP;
      rowHeight = Math.max(rowHeight, bounds.height);
    });
  }
  return rooms.map((room) => arranged.get(room.id) || { ...room, house: normaliseHousePlacement(room.house) });
};
var EntityReportReceiptTracker = class {
  constructor() {
    this.receipts = /* @__PURE__ */ new Map();
  }
  state(entityId, value, nowMs = Date.now(), serverNowMs = nowMs) {
    if (!value) return void 0;
    const timestamp = value.last_reported || value.last_updated || "";
    const reportedAtMs = Date.parse(timestamp);
    const serverReferenceMs = Number.isFinite(serverNowMs) ? serverNowMs : nowMs;
    const validityLimitMs = Math.max(nowMs, serverReferenceMs);
    if (!Number.isFinite(reportedAtMs) || reportedAtMs > validityLimitMs || reportedAtMs > serverReferenceMs + 1e4) {
      return { ...value, received_at_ms: Number.NaN };
    }
    const normalizedReceivedAt = nowMs - Math.max(0, serverReferenceMs - reportedAtMs);
    const signature = `${timestamp}|${value.state}`;
    const existing = this.receipts.get(entityId);
    if (!existing || existing.signature !== signature) {
      this.receipts.set(entityId, { signature, receivedAtMs: normalizedReceivedAt });
      return { ...value, received_at_ms: normalizedReceivedAt };
    }
    return { ...value, received_at_ms: existing.receivedAtMs };
  }
  clear() {
    this.receipts.clear();
  }
};
var latestReportTimestamp = (values, fallback = Date.now()) => {
  const timestamps = values.map((value) => Date.parse(value.last_reported || value.last_updated || "")).filter(Number.isFinite);
  return timestamps.length ? Math.max(...timestamps) : fallback;
};
var latestIndependentReportTimestamp = (states, excludedEntityIds, fallback = Date.now()) => latestReportTimestamp(
  Object.entries(states).filter(([entityId]) => !excludedEntityIds.has(entityId)).map(([, state]) => state),
  fallback
);
var pointInPolygon2 = (point2, polygon) => {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const a = polygon[current];
    const b = polygon[previous];
    const intersects = a.y > point2.y !== b.y > point2.y && point2.x < (b.x - a.x) * (point2.y - a.y) / (b.y - a.y || Number.EPSILON) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
};
var polygonInteriorPoint = (polygon) => {
  const bounds = boundsForPoints(polygon);
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  if (polygon.length < 3 || pointInPolygon2(center, polygon)) return center;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const yLevels = [...new Set(polygon.map((point2) => point2.y))].sort((a, b) => a - b);
  for (let level = 0; level < yLevels.length - 1; level += 1) {
    if (yLevels[level + 1] - yLevels[level] < 1e-3) continue;
    const y = (yLevels[level] + yLevels[level + 1]) / 2;
    const intersections = [];
    for (let index = 0; index < polygon.length; index += 1) {
      const a = polygon[index];
      const b = polygon[(index + 1) % polygon.length];
      if (a.y > y === b.y > y) continue;
      intersections.push(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y));
    }
    intersections.sort((a, b) => a - b);
    for (let index = 0; index + 1 < intersections.length; index += 2) {
      const candidate = { x: (intersections[index] + intersections[index + 1]) / 2, y };
      const distance2 = Math.hypot(candidate.x - center.x, candidate.y - center.y);
      if (distance2 < bestDistance) {
        best = candidate;
        bestDistance = distance2;
      }
    }
  }
  return best || polygon[0] || center;
};
var roomInteriorPoint = (room) => polygonInteriorPoint(roomPolygon(room));

// ../panel/src/utils/furniture-catalog.ts
var FURNITURE_CATALOG = [
  { id: "bed-single", label: "Single Bed", category: "bedroom", icon: "mdi:bed", defaultWidth: 900, defaultDepth: 2e3, defaultHeight: 500 },
  { id: "bed-double", label: "Double Bed", category: "bedroom", icon: "mdi:bed-double", defaultWidth: 1400, defaultDepth: 2e3, defaultHeight: 500 },
  { id: "bed-king", label: "King Bed", category: "bedroom", icon: "mdi:bed-king", defaultWidth: 1800, defaultDepth: 2e3, defaultHeight: 500 },
  { id: "nightstand", label: "Nightstand", category: "bedroom", icon: "mdi:table-furniture", defaultWidth: 450, defaultDepth: 450, defaultHeight: 500 },
  { id: "wardrobe", label: "Wardrobe", category: "bedroom", icon: "mdi:wardrobe", defaultWidth: 1200, defaultDepth: 600, defaultHeight: 2e3 },
  { id: "sofa-2seat", label: "2-Seat Sofa", category: "living-room", icon: "mdi:sofa", defaultWidth: 1600, defaultDepth: 900, defaultHeight: 800 },
  { id: "sofa-3seat", label: "3-Seat Sofa", category: "living-room", icon: "mdi:sofa", defaultWidth: 2200, defaultDepth: 900, defaultHeight: 800 },
  { id: "armchair", label: "Armchair", category: "living-room", icon: "mdi:seat", defaultWidth: 900, defaultDepth: 900, defaultHeight: 800 },
  { id: "coffee-table", label: "Coffee Table", category: "living-room", icon: "mdi:table", defaultWidth: 1200, defaultDepth: 600, defaultHeight: 400 },
  { id: "tv-stand", label: "TV Stand", category: "living-room", icon: "mdi:television", defaultWidth: 1600, defaultDepth: 450, defaultHeight: 500 },
  { id: "bookshelf", label: "Bookshelf", category: "living-room", icon: "mdi:bookshelf", defaultWidth: 800, defaultDepth: 300, defaultHeight: 1800 },
  { id: "desk", label: "Desk", category: "office", icon: "mdi:desk", defaultWidth: 1400, defaultDepth: 700, defaultHeight: 750 },
  { id: "office-chair", label: "Office Chair", category: "office", icon: "mdi:seat", defaultWidth: 600, defaultDepth: 600, defaultHeight: 1100 },
  { id: "dining-table-4", label: "Dining Table (4)", category: "dining", icon: "mdi:table-chair", defaultWidth: 1200, defaultDepth: 800, defaultHeight: 750 },
  { id: "dining-table-6", label: "Dining Table (6)", category: "dining", icon: "mdi:table-chair", defaultWidth: 1800, defaultDepth: 900, defaultHeight: 750 },
  { id: "dining-chair", label: "Dining Chair", category: "dining", icon: "mdi:chair-rolling", defaultWidth: 450, defaultDepth: 500, defaultHeight: 900 }
];
function getFurnitureById(id) {
  return FURNITURE_CATALOG.find((f) => f.id === id);
}

// src/ha/ha-rooms.js
var defaultProjectName = "My home";
var finite2 = (value) => typeof value === "number" && Number.isFinite(value);
var finitePoint = (value) => value && finite2(value.x) && finite2(value.y);
var metres = (millimetres2) => Number((millimetres2 / 1e3).toFixed(7));
var degrees = (value) => (value % 360 + 360) % 360;
var safeName = (value, fallback) => String(value || fallback).trim().slice(0, 48) || fallback;
var frameMetres = (value) => Math.round(value * 1e3) / 1e6;
var furnitureAliases = {
  table: "dining",
  "coffee-table": "coffee",
  "tv-stand": "cabinet",
  bookshelf: "shelves",
  "office-chair": "chair",
  "dining-chair": "chair"
};
function plannerFurnitureKind(type) {
  if (Object.hasOwn(furnitureCatalog, type)) return type;
  if (typeof type !== "string") return "custom";
  if (type.startsWith("bed-")) return "bed";
  if (type.startsWith("sofa-")) return "sofa";
  if (type.startsWith("dining-table-")) return "dining";
  return furnitureAliases[type] ?? "custom";
}
var roomGap = 700;
var maxRowWidth = 8e4;
function roomsInHouse(rooms) {
  const placed = /* @__PURE__ */ new Map();
  rooms.filter((room) => room.house).forEach((room) => placed.set(room.id, { ...room, house: normaliseHousePlacement(room.house) }));
  const floors = new Set(rooms.map((room) => normaliseHousePlacement(room.house).floor));
  for (const floor of floors) {
    const missing = rooms.filter((room) => !room.house && normaliseHousePlacement(room.house).floor === floor);
    if (!missing.length) continue;
    const existing = [...placed.values()].filter((room) => room.house.floor === floor);
    if (!existing.length) {
      autoArrangeRooms(missing).forEach((room) => placed.set(room.id, room));
      continue;
    }
    const bounds = existing.map((room) => boundsForPoints(roomPolygon(room).map((point2) => transformHomePoint(point2, room.house))));
    const startX = Math.max(...bounds.map((box) => box.maxX)) + roomGap;
    let x = startX;
    let y = Math.min(...bounds.map((box) => box.minY));
    let rowHeight = 0;
    for (const room of missing) {
      const box = roomBounds(room);
      if (x > startX && x + box.width > maxRowWidth) {
        x = startX;
        y += rowHeight + roomGap;
        rowHeight = 0;
      }
      const house = normaliseHousePlacement({ x: x - box.minX, y: y - box.minY, floor, rotationDeg: 0, visible: true });
      placed.set(room.id, { ...room, house });
      x += box.width + roomGap;
      rowHeight = Math.max(rowHeight, box.height);
    }
  }
  return rooms.map((room) => placed.get(room.id) || { ...room, house: normaliseHousePlacement(room.house) });
}
function roomViews(rooms, profiles = []) {
  const profileByDevice = new Map(profiles.map(({ device_id: id, profile }) => [id, profile]));
  const placed = roomsInHouse(rooms);
  const floors = [...new Set(placed.map((room) => room.house.floor))].sort((a, b) => a - b);
  const views = placed.map((room, index) => {
    const id = "ha-room-" + index;
    const toPlan = (point2) => {
      const home = transformHomePoint(point2, room.house);
      return { x: metres(home.x), y: metres(home.y) };
    };
    const outline = outlineBounds(roomPolygon(room).map((point2) => {
      const { x, y } = toPlan(point2);
      return [x, y];
    }), { maxCorners: 100, minSpan: 0.01, maxSpan: Infinity, minArea: 1e-4 });
    const height = finite2(room.ceilingHeightMm) ? metres(room.ceilingHeightMm) : 2.45;
    const floor = outline ? { id, name: room.name, ...outline, height } : null;
    const opening = (item) => {
      const wall = room.walls?.[item.wallIndex];
      if (!wall || !finite2(item.position) || !finite2(item.width)) return null;
      const start = { x: wall.x1, y: wall.y1 }, end = { x: wall.x2, y: wall.y2 };
      if (!finitePoint(start) || !finitePoint(end)) return null;
      const from = toPlan(start), to = toPlan(end);
      const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy);
      if (!length || item.width <= 0) return null;
      const width = Math.min(length, metres(item.width));
      const along = Math.max(0, Math.min(length - width, item.position * length - width / 2));
      return {
        roomId: id,
        x: from.x + dx / length * along,
        y: from.y + dy / length * along,
        width,
        angle: degrees(Math.atan2(dy, dx) * 180 / Math.PI),
        height: item.height > 0 ? metres(item.height) : null
      };
    };
    const doors = (room.doors ?? []).flatMap((door, index2) => {
      const placedDoor = opening(door);
      return placedDoor ? [{ ...placedDoor, id: id + "-door-" + index2 }] : [];
    });
    const openings = (items, kind, base, height2, extras = () => ({})) => (items ?? []).flatMap((item, index2) => {
      const placedItem = opening(item);
      return placedItem ? [{ ...placedItem, id: id + "-" + kind + "-" + index2, base, height: placedItem.height ?? height2, ...extras(item) }] : [];
    });
    const windows = openings(room.windows, "window", 1.15, 1.1);
    const mirrors = openings(room.mirrors, "mirror", 0.3, 1.8, (mirror) => ({
      protectionEnabled: mirror.protectionEnabled === true,
      reflectionDepthM: finite2(mirror.reflectionDepthMm) ? Math.max(0.25, Math.min(6, mirror.reflectionDepthMm / 1e3)) : 2
    }));
    const furniture = (room.furniture ?? []).flatMap((item, index2) => {
      if (!finitePoint(item)) return [];
      const type = item.typeId ?? item.type;
      const kind = plannerFurnitureKind(type);
      const model = furnitureCatalog[kind];
      const designer = getFurnitureById(type);
      return [{
        id: id + "-furniture-" + index2,
        ...toPlan(item),
        kind,
        material: model.material,
        width: item.width > 0 ? metres(item.width) : model.width,
        // The Room Designer calls the depth of a piece its height on the floor plan.
        depth: item.height > 0 ? metres(item.height) : item.depth > 0 ? metres(item.depth) : model.depth,
        height: designer ? metres(designer.defaultHeight) : model.height,
        base: model.base,
        angle: degrees((item.rotationDeg ?? item.rotation ?? 0) + room.house.rotationDeg)
      }];
    });
    const sources = room.sensors?.length ? room.sensors : room.sensor ? [room.sensor] : [];
    const sensors = sources.flatMap((source, index2) => {
      const position = { x: finite2(source.x_m) ? source.x_m * 1e3 : source.x, y: finite2(source.y_m) ? source.y_m * 1e3 : source.y };
      if (!finitePoint(position)) return [];
      const deviceId = source.deviceId ?? source.device_id ?? null;
      const profile = profileByDevice.get(deviceId);
      const mount = source.mountingMode ?? profile?.mounting_mode;
      const product = profile?.detected_product;
      const model = Object.hasOwn(devices, product) && devices[product].mount === mount ? product : mount === "ceiling" ? "ceilsense" : "ultimatesensor";
      return [{
        id: id + "-sensor-" + index2,
        ...toPlan(position),
        model,
        angle: degrees((source.orientation_deg ?? source.rotation ?? 0) + room.house.rotationDeg),
        radar: "none",
        savedHeight: finite2(source.height_m) ? source.height_m : finite2(source.heightMm) ? metres(source.heightMm) : null,
        sourceId: source.id,
        deviceId,
        source
      }];
    });
    const zones = (room.zones ?? []).map((zone) => {
      const parts = [zone.points, ...Array.isArray(zone.parts) ? zone.parts : []].filter((part) => Array.isArray(part) && part.length >= (zone.type === "entry" ? 2 : 3) && part.every(finitePoint));
      const unique = [...new Map(parts.map((part) => [JSON.stringify(part.map(({ x, y }) => [x, y])), part])).values()];
      return { zone, parts: unique.map((part) => part.map(toPlan)) };
    });
    const calibration = room.calibration;
    const calibrationOutline = calibration?.enabled && Array.isArray(calibration.corners) && calibration.corners.length === 4 && calibration.corners.every(finitePoint) ? calibration.corners.map(toPlan) : [];
    return { id, room, floor, doors, windows, mirrors, furniture, sensors, sources, zones, calibration, calibrationOutline };
  });
  return { rooms: placed, floors, views };
}
var normalisedProduct = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
var radarProducts = /* @__PURE__ */ new Set(["ceilsense", "wallsense", "ultimatesensor", "ultimatesensormini"]);
var modelsByLength = Object.keys(devices).sort((a, b) => b.length - a.length);
function plannerDevices(profiles, haDevices) {
  const deviceById = new Map(haDevices.map((device) => [device.id, device]));
  const profileById = new Map(profiles.map((entry) => [entry.device_id, entry]));
  const ids = /* @__PURE__ */ new Set([
    ...profileById.keys(),
    ...haDevices.filter((device) => radarProducts.has(normalisedProduct(device.product_type))).map((device) => device.id)
  ]);
  return [...ids].flatMap((id) => {
    const device = deviceById.get(id);
    const entry = profileById.get(id);
    const profile = entry?.profile;
    if (device?.hidden) return [];
    const product = normalisedProduct(device?.product_type ?? profile?.detected_product);
    const modelName = normalisedProduct(device?.model ?? entry?.model);
    const mount = profile?.mounting_mode ?? (product === "ceilsense" ? "ceiling" : "wall");
    const model = modelsByLength.find((name) => modelName.startsWith(normalisedProduct(name)) && devices[name].mount === mount) ?? modelsByLength.find((name) => normalisedProduct(name) === product && devices[name].mount === mount) ?? (mount === "ceiling" ? "ceilsense" : "ultimatesensor");
    const radarModel = profile?.radar_model?.toLowerCase();
    const radar = (mount === "ceiling" ? ["ld2412", "ld2460", "ld6002b", "combined"] : ["ld2450", "ld2460"]).includes(radarModel) ? radarModel : "none";
    const height = profile?.installation_height_m ?? profile?.mounting_height_mm / 1e3;
    return [{
      id,
      name: device?.name || entry?.name || id,
      model,
      mount,
      radar,
      product: device?.model || device?.product_name || entry?.model || "",
      radarModel: radarModel === "unknown" ? null : radarModel,
      mountHeight: mount === "wall" && height >= 0.15 && height <= 6 ? height : void 0,
      online: device?.online,
      aliases: [entry?.entity_prefix, ...entry?.aliases ?? []].filter(Boolean)
    }];
  }).sort((a, b) => a.name.localeCompare(b.name));
}
var findPlannerDevice = (devices2, id) => id ? devices2.find((device) => device.id === id) ?? devices2.find((device) => device.aliases.includes(id)) : void 0;
var emptyFloorPlan = () => ({ ...blankPlan(defaultProjectName), version: 3, furniture: [], zones: [], windows: [], mirrors: [] });
function projectFromRooms(rooms, profiles, devices2 = []) {
  const layout = roomViews(rooms, profiles);
  const skippedRooms = [];
  const floors = (layout.floors.length ? layout.floors : [0]).map((level) => ({
    id: `floor-${level < 0 ? "b" + -level : level}`,
    level,
    name: null,
    plan: emptyFloorPlan()
  }));
  for (const view of layout.views) {
    if (!view.floor) {
      skippedRooms.push(view.room?.name || view.room?.id || "Room");
      continue;
    }
    const { room, id } = view;
    const { floor: level, x, y, rotationDeg, visible } = room.house;
    const plan = floors.find((floor) => floor.level === level).plan;
    const lengths = Object.fromEntries(["rooms", "doors", "windows", "mirrors", "furniture", "sensors", "zones"].map((key) => [key, plan[key].length]));
    try {
      plan.rooms.push({
        ...view.floor,
        name: safeName(room.name, "Room"),
        haRoom: room.id,
        haFrame: { x: frameMetres(x), y: frameMetres(y), angle: rotationDeg, visible }
      });
      for (const key of ["doors", "windows", "mirrors"]) for (const item of view[key]) {
        const index = Number(item.id.split("-").at(-1));
        const record = room[key]?.[index];
        if (!record) continue;
        const { height, angle: angle2, width } = item;
        if (key === "doors" && (width < 0.5 || width > 2) || key !== "doors" && (width < 0.1 || width > 8 || height < 0.1 || height > 6)) continue;
        const inward = key === "doors" && record.openDirection === "inward";
        const radians = angle2 * Math.PI / 180;
        plan[key].push({
          ...item,
          haIndex: index,
          haRecord: record.id,
          haRoom: room.id,
          angle: degrees(angle2 + (inward ? 180 : 0)),
          x: item.x + (inward ? Math.cos(radians) * width : 0),
          y: item.y + (inward ? Math.sin(radians) * width : 0)
        });
      }
      for (const item of view.furniture) {
        const index = Number(item.id.split("-").at(-1));
        plan.furniture.push({
          ...item,
          name: safeName(room.furniture[index]?.name, "Furniture"),
          haIndex: index,
          haRecord: room.furniture[index]?.id,
          haRoom: room.id
        });
      }
      for (const sensor of view.sensors) {
        const device = findPlannerDevice(devices2, sensor.deviceId);
        const sameMount = device?.mount === devices[sensor.model].mount;
        const model = sameMount ? device.model : sensor.model;
        const radar = sameMount ? device.radar : "none";
        const { savedHeight, sourceId: sourceId2, deviceId, source, ...item } = sensor;
        plan.sensors.push({
          ...item,
          model,
          radar: deviceId || radarsFor(model).includes(radar) ? radar : radarsFor(model)[0],
          haSource: sourceId2,
          haRoom: room.id,
          haDevice: deviceId,
          ...devices[sensor.model].mount === "wall" && savedHeight >= 0.15 && savedHeight <= 6 ? { mountHeight: savedHeight } : {}
        });
      }
      const roomSources2 = new Set(plan.sensors.filter((sensor) => sensor.haRoom === room.id).map((sensor) => sensor.haSource));
      for (const [index, { zone, parts }] of view.zones.entries()) {
        if (!zoneTypes.includes(zone.type)) continue;
        const owner = zone.sensorId || zone.sensor_id || null;
        if (!zoneOwnerIsAvailable(owner, roomSources2)) continue;
        const sensor = plan.sensors.find((item2) => item2.haRoom === room.id && item2.haSource === owner);
        const item = {
          id: `${id}-zone-${index}`,
          roomId: id,
          haRoom: room.id,
          haIndex: index,
          haRecord: zone.id,
          name: safeName(zone.name, "Zone"),
          type: zone.type,
          sensorId: owner ? sensor.id : null,
          parts: parts.map((part) => part.map(({ x: px, y: py }) => [px, py])),
          ...zone.type === "entry" ? { direction: zone.inDirection === "left" ? "left" : "right" } : {}
        };
        if (validProject({ ...plan, zones: [item] })) plan.zones.push(item);
      }
      if (!validProject(plan)) throw new Error("unsafe room");
    } catch {
      for (const [key, length] of Object.entries(lengths)) plan[key].length = length;
      skippedRooms.push(room.name || room.id || "Room");
    }
  }
  const project = {
    format: buildingFormat,
    version: 1,
    name: defaultProjectName,
    floors,
    activeFloor: (floors.find((floor) => floor.level === 0) ?? floors[0]).id
  };
  if (!validProject(project)) throw new Error("A room exceeds the safe editor limits. Nothing was changed.");
  if (skippedRooms.length) Object.defineProperty(project, "skippedRooms", { value: skippedRooms, enumerable: false });
  return project;
}
function haRoomContents(plan, room) {
  const contents = roomContents(plan, room);
  const owner = (item, fallback) => {
    const home = plan.rooms.find((candidate) => item.haRoom && candidate.haRoom === item.haRoom);
    return home && contains(home, item) ? home : fallback();
  };
  contents.sensors = plan.sensors.filter((sensor) => owner(sensor, () => roomForDevice(plan.rooms, sensor))?.id === room.id);
  contents.furniture = (plan.furniture ?? []).filter((item) => owner(item, () => plan.rooms.find((candidate) => contains(candidate, item)))?.id === room.id);
  return contents;
}
function withoutHiddenRooms(project) {
  const floors = project.floors?.map((floor) => {
    const hidden = new Set(floor.plan.rooms.filter((room) => room.haFrame?.visible === false).flatMap((room) => Object.values(haRoomContents(floor.plan, room)).flat().map((item) => item.id)));
    if (!hidden.size) return floor;
    return { ...floor, plan: Object.fromEntries(Object.entries(floor.plan).map(([key, value]) => [key, Array.isArray(value) ? value.filter((item) => !hidden.has(item.id)) : value])) };
  });
  if (!floors) return project;
  const visible = { ...project, floors };
  if (visible.staircase && !validProject(visible)) delete visible.staircase;
  return visible;
}

// src/ha/ha-save.js
import { FloorPlanValidationError, zoneOwnerIsAvailable as zoneOwnerIsAvailable2 } from "./safety.js?v=08fb810078d1";

// src/js/wall-radar-profiles.mjs
var derate = 0.8;
var wallPresence = { half: 75, range: 9 * derate };
var wallTrackers = {
  ld2450: { half: 60, range: 6 * derate, still: 6 * derate, max: 3, maxStill: 3 },
  ld2460: { half: 60, range: 6 * derate, still: 5 * derate, max: 5, maxStill: 3 }
};

// src/js/floor-planner-radar.mjs
function sensorMountHeight(item, room) {
  return devices[item.model].mount === "wall" ? item.mountHeight ?? 1.4 : room ? ceilingHeightAt(room, item) : 0;
}

// src/ha/ha-save.js
var same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var degrees2 = (value) => (value % 360 + 360) % 360;
var millimetres = (metres3) => Math.round(metres3 * 1e6) / 1e3;
var metres2 = (millimetres2) => Math.round(millimetres2 * 1e3) / 1e6;
var distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
var wallTolerance = 25;
var projectFloors = (project) => project.floors ?? [{ id: "ground", level: 0, plan: project }];
var sourceId = (sensor) => sensor.haSource ?? sensor.id;
var projectRooms = (project) => projectFloors(project).flatMap(({ level, plan }) => plan.rooms.map((room) => ({ id: room.haRoom ?? room.id, level, room, items: haRoomContents(plan, room) })));
function deviceRooms(entries2) {
  const rooms = /* @__PURE__ */ new Map();
  for (const { id, items } of entries2) {
    for (const sensor of items.sensors) {
      if (sensor.haDevice) rooms.set(sensor.haDevice, [...rooms.get(sensor.haDevice) ?? [], id]);
    }
  }
  return rooms;
}
function housePlacement(room, level) {
  const frame = room.haFrame ?? { x: room.x, y: room.y, angle: 0, visible: true };
  return { x: millimetres(frame.x), y: millimetres(frame.y), rotationDeg: frame.angle, floor: level, visible: frame.visible };
}
function wallOpening(item, record, walls, toRoom, height, roomName) {
  const radians = item.angle * Math.PI / 180;
  const middle = toRoom({ x: item.x + Math.cos(radians) * item.width / 2, y: item.y + Math.sin(radians) * item.width / 2 });
  const wall = walls.map(({ x1: x12, y1: y12, x2: x22, y2: y22 }, index) => ({ index, ...edgePosition([x12, y12], [x22, y22], middle) })).sort((a, b) => distance(a, middle) - distance(b, middle))[0];
  if (!wall || distance(wall, middle) > wallTolerance) throw new FloorPlanValidationError("opening_off_wall", { room: roomName });
  const { x1, y1, x2, y2 } = walls[wall.index];
  const start = toRoom(item);
  const inward = (middle.x - start.x) * (x2 - x1) + (middle.y - start.y) * (y2 - y1) < 0;
  return {
    ...record,
    id: record?.id ?? item.id,
    wallIndex: wall.index,
    position: wall.along / wall.length,
    width: millimetres(item.width),
    height: height ?? record?.height ?? 2100,
    ...Object.hasOwn(item, "protectionEnabled") ? {
      protectionEnabled: item.protectionEnabled === true,
      reflectionDepthMm: Math.round(Math.max(0.25, Math.min(6, Number(item.reflectionDepthM) || 2)) * 1e3)
    } : {},
    ...height === void 0 ? { openDirection: inward ? "inward" : "outward" } : {}
  };
}
function saveChanges(project, saved, haRooms) {
  if (!validProject(project)) throw new FloorPlanValidationError("invalid_project");
  const before = new Map(projectRooms(saved).map((entry) => [entry.id, entry]));
  const entries2 = projectRooms(project);
  const ids = new Set(entries2.map((entry) => entry.id));
  const stored = new Map(haRooms.map((room) => [room.id, room]));
  if (ids.size !== entries2.length) throw new FloorPlanValidationError("duplicate_room");
  const sensors = entries2.flatMap((entry) => entry.items.sensors);
  if (projectFloors(project).flatMap((floor) => floor.plan.sensors).length !== sensors.length) {
    throw new FloorPlanValidationError("sensor_outside_room");
  }
  const earlier = deviceRooms([...before.values()]);
  for (const [device, rooms] of deviceRooms(entries2)) {
    const known = earlier.get(device) ?? [];
    if (rooms.length > 1 && (new Set(rooms).size !== rooms.length || rooms.some((room) => !known.includes(room)))) {
      throw new FloorPlanValidationError("duplicate_device");
    }
  }
  return {
    changes: entries2.flatMap((entry) => roomChange(entry, before.get(entry.id), stored)),
    removed: haRooms.filter((room) => before.has(room.id) && !ids.has(room.id)).map((room) => room.id)
  };
}
function roomChange({ id, room, level, items }, previous, stored) {
  if (previous && previous.level === level && same(previous.items, items)) return [];
  const record = stored.get(id);
  const house = housePlacement(room, level);
  const toRoom = ({ x, y }) => {
    const point2 = inverseTransformHomePoint({ x: millimetres(x), y: millimetres(y) }, house);
    return { x: Math.round(point2.x * 1e3) / 1e3, y: Math.round(point2.y * 1e3) / 1e3 };
  };
  const outline = polygonEdges(roomCorners(room)).map(([from, to]) => {
    const start = toRoom({ x: from[0], y: from[1] }), end = toRoom({ x: to[0], y: to[1] });
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  });
  const storedWalls = record?.walls ?? [];
  const near = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by) < 0.01;
  const wallsKept = storedWalls.length === outline.length && storedWalls.every((wall) => outline.some((edge) => near(wall.x1, wall.y1, edge.x1, edge.y1) && near(wall.x2, wall.y2, edge.x2, edge.y2) || near(wall.x1, wall.y1, edge.x2, edge.y2) && near(wall.x2, wall.y2, edge.x1, edge.y1)));
  const walls = wallsKept ? storedWalls : outline;
  const change = { id, name: record && previous?.room.name === room.name ? record.name : room.name, house };
  if (!wallsKept) change.walls = walls;
  if (previous?.room.height !== room.height) change.ceilingHeightMm = millimetres(room.height);
  for (const key of ["doors", "windows", "mirrors", "furniture", "zones"]) {
    if (wallsKept && same(previous?.items[key], items[key])) continue;
    const records = record?.[key] ?? [];
    const recordIndex = (item) => item.haRecord ? records.findIndex((candidate) => candidate.id === item.haRecord) : item.haIndex;
    const shown = new Set((previous?.items[key] ?? []).map(recordIndex));
    const kept = records.filter((_, index) => !shown.has(index));
    if (!wallsKept && ["doors", "windows", "mirrors"].includes(key) && kept.length) {
      throw new FloorPlanValidationError("wall_opening");
    }
    change[key] = [...kept, ...items[key].map((item, index) => {
      const original = item.haRoom === id ? records[recordIndex(item)] : null;
      const unchanged = wallsKept && original && same(previous?.items[key].find((candidate) => candidate.id === item.id), item);
      item.haRoom = id;
      item.haIndex = kept.length + index;
      item.haRecord = original?.id ?? item.id;
      if (unchanged) return original.id ? original : { ...original, id: item.haRecord };
      if (key === "furniture") {
        const { x, y } = toRoom(item);
        return {
          ...original,
          id: original?.id ?? item.id,
          name: item.name,
          typeId: original?.typeId ?? item.kind,
          x,
          y,
          width: millimetres(item.width),
          height: millimetres(item.depth),
          rotationDeg: degrees2(item.angle - house.rotationDeg)
        };
      }
      if (key === "zones") {
        const parts = item.parts.map((part) => part.map(([x, y]) => toRoom({ x, y })));
        const owner = items.sensors.find((sensor) => sensor.id === item.sensorId);
        const { sensor_id: _legacyOwner, ...zone } = original ?? {};
        if (!zoneOwnerIsAvailable2(item.sensorId, new Set(items.sensors.map((sensor) => sensor.id)))) {
          throw new FloorPlanValidationError("zone_owner_outside_room", { room: room.name });
        }
        return {
          ...zone,
          id: original?.id ?? item.id,
          name: item.name,
          type: item.type,
          points: parts[0],
          parts,
          sensorId: owner ? sourceId(owner) : null,
          ...item.type === "entry" ? { inDirection: item.direction ?? "right" } : {}
        };
      }
      return wallOpening(item, original, walls, toRoom, key === "doors" ? void 0 : millimetres(item.height), room.name);
    })];
  }
  if (!same(previous?.items.sensors, items.sensors) || previous?.room.height !== room.height) {
    const shown = new Set((previous?.items.sensors ?? []).map(sourceId));
    const kept = (record?.sensors ?? []).filter((source) => !shown.has(source.id));
    change.sensors = [...kept, ...items.sensors.map((sensor) => {
      const source = stored.get(sensor.haRoom)?.sensors?.find((candidate) => candidate.id === sensor.haSource);
      if (source && record?.calibration?.enabled && record.calibration.sensorId === source.id && (source.deviceId ?? source.device_id ?? null) !== (sensor.haDevice ?? null)) {
        throw new FloorPlanValidationError("calibration_device", { room: record.name });
      }
      const { x, y } = toRoom(sensor);
      const rotation = degrees2(sensor.angle - house.rotationDeg);
      const mount = devices[sensor.model].mount;
      const height = sensor.mountHeight ?? (mount === "ceiling" && previous?.room.height === room.height ? source?.height_m : null) ?? sensorMountHeight(sensor, room);
      const { device_id: _legacyDevice, ...rest } = source ?? {};
      return {
        ...rest,
        id: sourceId(sensor),
        deviceId: sensor.haDevice ?? null,
        x,
        y,
        rotation,
        mountingMode: mount,
        x_m: metres2(x),
        y_m: metres2(y),
        orientation_deg: rotation,
        heightMm: millimetres(height),
        height_m: height
      };
    })];
    if (record?.calibration?.enabled && record.calibration.sensorId && !change.sensors.some((source) => source.id === record.calibration.sensorId)) {
      throw new FloorPlanValidationError("calibration_sensor", { room: record.name });
    }
  }
  room.haRoom = id;
  room.haFrame ??= { x: room.x, y: room.y, angle: 0, visible: true };
  for (const sensor of items.sensors) {
    sensor.haRoom = id;
    sensor.haSource = sourceId(sensor);
  }
  return [change];
}

// src/ha/ha-live.js
import { hasUnknownVisiblePeopleCount } from "./safety.js?v=08fb810078d1";
var invalidStates = /* @__PURE__ */ new Set(["", "unknown", "unavailable", "none", "null", "nan"]);
var finite3 = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var radarProfiles = (devices2) => (Array.isArray(devices2) ? devices2 : []).filter((device) => isObject(device) && isObject(device.profile)).map((device) => ({
  ...device,
  aliases: Array.isArray(device.aliases) ? device.aliases.filter((alias) => typeof alias === "string") : [],
  targets: Array.isArray(device.targets) ? device.targets.filter(isObject) : []
}));
var radarEntityIds = (profiles) => new Set(profiles.flatMap((device) => [
  device.profile.tracking_presence_entity_id,
  device.profile.tracking_target_count_entity_id,
  device.profile.reported_installation_mode_entity_id,
  ...device.profile.supplementary_presence_sensors ?? [],
  ...device.targets.flatMap((target) => [target.x_entity_id, target.y_entity_id, target.z_entity_id, target.presence_entity_id])
].filter(Boolean)));
var roomSources = (room) => {
  const sources = Array.isArray(room.sensors) ? room.sensors : [];
  if (sources.length) return sources.filter((source) => typeof source === "object" && source !== null);
  return room.sensor ? [room.sensor] : [];
};
var profileForSource = (profiles, deviceId) => profiles.find((profile) => profile.device_id === deviceId || profile.entity_prefix === deviceId || profile.aliases.includes(deviceId));
var stateText = (value) => String(typeof value === "object" && value !== null ? value.state || "" : value || "");
var isOn = (value) => stateText(value).toLowerCase() === "on";
var validState = (value) => !invalidStates.has(stateText(value).trim().toLowerCase());
function isFresh(value, freshnessSeconds, now) {
  if (typeof value !== "object" || value === null) return true;
  if (Object.hasOwn(value, "received_at_ms")) {
    const receivedAt = Number(value.received_at_ms);
    return Number.isFinite(receivedAt) && receivedAt <= now && now - receivedAt <= freshnessSeconds * 1e3;
  }
  if (!value.last_reported) return true;
  const reportedAt = Date.parse(value.last_reported);
  return !Number.isFinite(reportedAt) || reportedAt > now ? false : now - reportedAt <= freshnessSeconds * 1e3;
}
function notFromFuture(value, now) {
  if (!validState(value)) return false;
  if (typeof value !== "object" || value === null) return true;
  if (Object.hasOwn(value, "received_at_ms")) {
    const receivedAt = Number(value.received_at_ms);
    return Number.isFinite(receivedAt) && receivedAt <= now;
  }
  const timestamp = value.last_reported || value.last_updated;
  if (!timestamp) return true;
  const reportedAt = Date.parse(timestamp);
  return Number.isFinite(reportedAt) && reportedAt <= now;
}
function insidePolygon(point2, polygon) {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const a = polygon[current], b = polygon[previous];
    if (a.y > point2.y !== b.y > point2.y && point2.x < (b.x - a.x) * (point2.y - a.y) / (b.y - a.y || Number.EPSILON) + a.x) inside = !inside;
  }
  return inside;
}
var excludedByZone = (room, point2, sourceId2) => (Array.isArray(room.zones) ? room.zones : []).filter((zone) => typeof zone === "object" && zone !== null && zone.type === "exclusion" && (!(zone.sensorId || zone.sensor_id) || (zone.sensorId || zone.sensor_id) === sourceId2)).some((zone) => [Array.isArray(zone.points) ? zone.points : [], ...Array.isArray(zone.parts) ? zone.parts : []].some((part) => Array.isArray(part) && part.length >= 3 && insidePolygon(point2, part)));
var emptyStatus = () => ({ linked: 0, live: 0, unavailable: 0, positioning: 0, positive: 0, negative: 0, unknown: 0 });
function conflictingRoomIds(rooms, profiles) {
  const roomsByDevice = /* @__PURE__ */ new Map();
  for (const room of rooms) {
    for (const source of roomSources(room)) {
      if (!source.deviceId) continue;
      const deviceId = profileForSource(profiles, source.deviceId)?.device_id || source.deviceId;
      const roomIds = roomsByDevice.get(deviceId) || /* @__PURE__ */ new Set();
      roomIds.add(room.id);
      roomsByDevice.set(deviceId, roomIds);
    }
  }
  const conflicting = /* @__PURE__ */ new Set();
  for (const roomIds of roomsByDevice.values()) {
    if (roomIds.size > 1) roomIds.forEach((roomId) => conflicting.add(roomId));
  }
  return conflicting;
}
function collectLivePresence(rooms, profiles, getState, now = Date.now(), runtimeByRoom = {}, runtimeAvailable = true) {
  const people = [];
  let linkedSensors = 0, liveSensors = 0, unavailableSensors = 0;
  const statusByRoom = /* @__PURE__ */ new Map();
  const incompletePositioning = /* @__PURE__ */ new Set();
  const incompletePresence = /* @__PURE__ */ new Set();
  const ambiguousSupplementary = /* @__PURE__ */ new Set();
  const suppressionExplained = /* @__PURE__ */ new Set();
  const unsafeClearEvidence = /* @__PURE__ */ new Set();
  const conflicting = conflictingRoomIds(rooms, profiles);
  for (const room of rooms) {
    const sources = roomSources(room);
    const freshnessSeconds = Math.max(1, Math.min(15, finite3(room.aggregation?.tracking?.observation_freshness_ms, 5e3) / 1e3));
    const selectedSources = new Set(room.aggregation?.presence?.source_ids || []);
    for (const [offset, source] of sources.entries()) {
      if (!source.deviceId) continue;
      const status = statusByRoom.get(room.id) || emptyStatus();
      const selected = !selectedSources.size || Boolean(source.id && selectedSources.has(source.id));
      const device = profileForSource(profiles, source.deviceId);
      if (!device) {
        unavailableSensors += 1;
        status.unavailable += 1;
        if (selected) status.unknown += 1;
        statusByRoom.set(room.id, status);
        continue;
      }
      linkedSensors += 1;
      status.linked += 1;
      statusByRoom.set(room.id, status);
      const { profile, targets } = device;
      const read = (entityId) => {
        if (!entityId) return void 0;
        const value = getState(entityId);
        return notFromFuture(value, now) ? value : void 0;
      };
      const presenceEntity = profile.tracking_presence_entity_id;
      const presence = read(presenceEntity);
      const supplementary = (profile.supplementary_presence_sensors || []).map((entityId) => read(entityId));
      const presenceComplete = [...presenceEntity ? [presence] : [], ...supplementary].every(validState);
      const scale = profile.coordinate_scale_to_mm || 1;
      const evidence = targets.map((target) => {
        const rawX = read(target.x_entity_id);
        const rawY = read(target.y_entity_id);
        const targetPresence = read(target.presence_entity_id);
        const reportedX = normalizeRadarCoordinate(stateText(rawX), scale);
        const reportedY = normalizeRadarCoordinate(stateText(rawY), scale);
        const fresh = isFresh(rawX, freshnessSeconds, now) && isFresh(rawY, freshnessSeconds, now);
        return {
          target,
          targetPresence: isFresh(targetPresence, freshnessSeconds, now) ? targetPresence : void 0,
          targetPresenceAvailable: targetPresence,
          coordinatesAvailable: validState(rawX) && validState(rawY),
          x: fresh ? reportedX : null,
          y: fresh ? reportedY : null,
          reportedX,
          reportedY,
          observedAtMs: fresh ? Math.max(Number(rawX?.received_at_ms) || 0, Number(rawY?.received_at_ms) || 0) || now : null,
          staleCoordinates: !fresh && reportedX !== null && reportedY !== null
        };
      });
      const modeEntity = profile.reported_installation_mode_entity_id;
      const reportedMode = stateText(read(modeEntity)).trim().toLowerCase();
      const hardwareMode = modeEntity ? reportedMode === "side" || reportedMode === "top" ? reportedMode : null : profile.current_hardware_mode;
      const placementTrusted = ["x", "y", "x_m", "y_m", "rotation", "orientation_deg"].every((field) => !(field in source) || source[field] == null || Number.isFinite(Number(source[field])));
      const geometryTrusted = placementTrusted && !(["ld2460", "ld6002b"].includes(profile.radar_model) && ["side", "top"].includes(profile.required_installation_mode) && hardwareMode !== profile.required_installation_mode);
      const hasCoordinates = evidence.some((item) => item.x !== null && item.y !== null);
      if (!geometryTrusted) incompletePositioning.add(room.id);
      if ((presenceEntity ? validState(presence) : false) || supplementary.some(validState) || hasCoordinates) {
        liveSensors += 1;
        status.live += 1;
        if (hasCoordinates && profile.positioning_available !== false) status.positioning += 1;
      } else {
        unavailableSensors += 1;
        status.unavailable += 1;
      }
      const targetsComplete = evidence.every((item) => {
        if (!item.target.presence_entity_id) return item.x !== null && item.y !== null;
        if (!validState(item.targetPresence)) return false;
        return item.x !== null && item.y !== null ? (item.x !== 0 || item.y !== 0) === isOn(item.targetPresence) : !isOn(item.targetPresence);
      });
      if (profile.positioning_available !== false && targets.length && !targetsComplete) incompletePositioning.add(room.id);
      const found = [];
      let suppressed = 0;
      let unpositioned = false;
      for (const { target, targetPresence, x, y, reportedX, reportedY, observedAtMs, staleCoordinates } of evidence) {
        const targetOn = Boolean(target.presence_entity_id && isOn(targetPresence));
        if (x === null || y === null) {
          if (!target.presence_entity_id && staleCoordinates && reportedX === 0 && reportedY === 0) continue;
          const staleSomewhere = staleCoordinates && (reportedX !== 0 || reportedY !== 0);
          if (targetOn || !target.presence_entity_id && staleSomewhere && (isOn(presence) || !presenceEntity)) unpositioned = true;
          continue;
        }
        if (x === 0 && y === 0) {
          if (targetOn) unpositioned = true;
          continue;
        }
        if (!geometryTrusted) {
          unpositioned = true;
          continue;
        }
        const local = projectRadarTargetToRoom(
          { x, y },
          { x: finite3(source.x), y: finite3(source.y), rotation: finite3(source.rotation) },
          profile.coordinate_projection
        );
        if (safelyOutsideRoom(local, safeSuppressionRoomPolygon(room)) || excludedByZone(room, local, source.id)) {
          suppressed += 1;
          continue;
        }
        const point2 = transformHomePoint(local, room.house);
        found.push({
          id: `${room.id}:${device.device_id}:${target.index}`,
          roomId: room.id,
          roomName: room.name,
          x: point2.x,
          y: point2.y,
          floor: room.house.floor,
          approximate: false,
          sourceDeviceId: device.device_id,
          observedAtMs
        });
      }
      const countEntity = profile.tracking_target_count_entity_id;
      const countState = read(countEntity);
      const parsedCount = Number(stateText(countState));
      const count = validState(countState) && isFresh(countState, freshnessSeconds, now) && Number.isInteger(parsedCount) && parsedCount >= 0 ? parsedCount : null;
      if (countEntity && count === null) incompletePositioning.add(room.id);
      if (count !== null && count !== found.length + suppressed) incompletePositioning.add(room.id);
      if (count !== null && count > found.length + suppressed) unpositioned = true;
      const explicitOn = evidence.filter((item) => Boolean(item.target.presence_entity_id) && isOn(item.targetPresence)).length;
      const explicitComplete = evidence.length > 0 && evidence.every((item) => Boolean(item.target.presence_entity_id) && validState(item.targetPresence));
      const countExplains = count !== null && count > 0 && suppressed === count && found.length === 0 && !unpositioned;
      const explicitExplains = explicitComplete && explicitOn > 0 && suppressed === explicitOn && found.length === 0 && !unpositioned;
      const explained = countEntity ? countExplains : explicitExplains;
      const supplementaryOn = supplementary.some(isOn);
      if (!presenceComplete) incompletePresence.add(room.id);
      if (supplementaryOn && found.length > 0) ambiguousSupplementary.add(room.id);
      if (unpositioned || !found.length && (supplementaryOn || !explained && isOn(presence))) {
        const centre = transformHomePoint(roomInteriorPoint(room), room.house);
        found.push({
          id: `${room.id}:${device.device_id}:${unpositioned ? "unpositioned" : `room-${offset}`}`,
          roomId: room.id,
          roomName: room.name,
          x: centre.x,
          y: centre.y,
          floor: room.house.floor,
          approximate: true,
          sourceDeviceId: device.device_id
        });
      }
      if (selected) {
        const targetContract = evidence.every((item) => item.coordinatesAvailable && (!item.target.presence_entity_id || validState(item.targetPresenceAvailable)));
        const countContract = !countEntity || validState(countState) && Number.isInteger(parsedCount) && parsedCount >= 0;
        if (!presenceComplete || !targetContract || !countContract || !geometryTrusted) unsafeClearEvidence.add(room.id);
        if (explained) suppressionExplained.add(room.id);
        const inputs = explained ? supplementary : [presence, ...supplementary];
        const clearProven = presenceComplete && (!countEntity || count !== null) && targetsComplete;
        if (found.length || inputs.some(isOn)) status.positive += 1;
        else if (clearProven && (explained && inputs.length === 0 || inputs.length > 0 && inputs.every((value) => validState(value) && !isOn(value)))) status.negative += 1;
        else status.unknown += 1;
      }
      if (room.house.visible !== false) people.push(...found);
    }
  }
  const runtimeExplained = (room, status, presence) => {
    const selected = status ? status.positive + status.negative + status.unknown : 0;
    return suppressionExplained.has(room.id) && !runtimeAvailable && selected > 0 && status?.positive === 0 && status?.unknown === 0 && status?.negative === selected && presence?.status !== "clearing";
  };
  const shown = people.filter((person) => !conflicting.has(person.roomId));
  for (const room of rooms) {
    const presence = runtimeByRoom[room.id]?.presence;
    if (room.house.visible === false || conflicting.has(room.id) || presence?.occupied !== true || runtimeExplained(room, statusByRoom.get(room.id), presence) || shown.some((person) => person.roomId === room.id)) continue;
    const centre = transformHomePoint(roomInteriorPoint(room), room.house);
    shown.push({
      id: `${room.id}:runtime-hold`,
      roomId: room.id,
      roomName: room.name,
      x: centre.x,
      y: centre.y,
      floor: room.house.floor,
      approximate: true,
      sourceDeviceId: "runtime"
    });
  }
  const states = rooms.map((room) => {
    const roomPeople = shown.filter((person) => person.roomId === room.id);
    const status = statusByRoom.get(room.id) || emptyStatus();
    const selected = status.positive + status.negative + status.unknown;
    const occupied = status.positive > 0;
    const presenceKnown = occupied || selected > 0 && status.negative === selected;
    const sensorCount = roomSources(room).filter((source) => source.deviceId).length;
    const approximate = roomPeople.some((person) => person.approximate);
    const evidenceComplete = sensorCount > 0 && status.linked === sensorCount && status.unavailable === 0 && status.positioning === sensorCount && !incompletePositioning.has(room.id) && !incompletePresence.has(room.id) && !ambiguousSupplementary.has(room.id) && !approximate;
    const presence = runtimeByRoom[room.id]?.presence;
    const runtimeKnown = runtimeAvailable && typeof presence?.occupied === "boolean";
    const cachedRuntimeKnown = typeof presence?.occupied === "boolean";
    const localClearSafe = !unsafeClearEvidence.has(room.id) && sensorCount > 0 && status.linked === sensorCount && !ambiguousSupplementary.has(room.id);
    return {
      roomId: room.id,
      roomName: room.name,
      floor: room.house.floor,
      people: roomPeople.filter((person) => !person.approximate).length,
      // One radar with complete evidence is the only exact count.
      peopleCountKnown: runtimeKnown && !conflicting.has(room.id) && sensorCount === 1 && evidenceComplete,
      trackingEvidenceComplete: evidenceComplete,
      approximate,
      occupied: conflicting.has(room.id) ? false : cachedRuntimeKnown && presence?.occupied === true && !runtimeExplained(room, status, presence) || occupied,
      available: conflicting.has(room.id) ? false : presence ? runtimeKnown && (occupied || localClearSafe) : runtimeAvailable && presenceKnown && (occupied || !incompletePositioning.has(room.id)) && !incompletePresence.has(room.id),
      visible: room.house.visible !== false,
      sensorCount,
      linkedSensorCount: status.linked,
      liveSensorCount: status.live,
      unavailableSensorCount: status.unavailable,
      positioningSensorCount: status.positioning
    };
  });
  return { people: shown, rooms: states, linkedSensors, liveSensors, unavailableSensors };
}
function withFusedRooms(rooms, people, fusedRoomIds) {
  for (const room of rooms) {
    if (!fusedRoomIds.has(room.roomId)) continue;
    room.people = people.filter((person) => person.roomId === room.roomId && !person.approximate).length;
    room.approximate = people.some((person) => person.roomId === room.roomId && person.approximate);
    room.peopleCountKnown = false;
  }
  return rooms;
}
function liveTracks(previous, people, houses, now) {
  const tracks = /* @__PURE__ */ new Map();
  for (const person of people) {
    const last = previous.get(person.id);
    const x = person.x / 1e3, y = person.y / 1e3;
    const dx = x - (last?.x ?? x), dy = y - (last?.y ?? y);
    const distance2 = Math.hypot(dx, dy);
    const moved = last?.floor === person.floor && distance2 >= 0.05;
    tracks.set(person.id, {
      x,
      y,
      floor: person.floor,
      roomId: person.roomId,
      house: houses.get(person.roomId),
      // An approximate marker only says "somewhere in this room". It never gets a seated or fallen pose.
      pose: "standing",
      approximate: person.approximate,
      heading: moved ? Math.atan2(dx, -dy) * 180 / Math.PI : last?.heading ?? 0,
      stride: (last?.stride ?? 0) + (moved ? distance2 : 0),
      movedAt: moved ? now : last?.movedAt ?? 0
    });
  }
  return tracks;
}
var livePeople = (tracks, now) => [...tracks.values()].map(({ movedAt, ...person }) => ({ ...person, moving: now - movedAt < 800 }));
function detectionSummary(copy, people, rooms) {
  const exact = people.filter((person) => !person.approximate);
  const approximate = rooms.filter((room) => room.occupied && room.approximate).map((room) => room.roomName);
  const unknown = rooms.filter((room) => !room.available).map((room) => room.roomName);
  const countKnown = !hasUnknownVisiblePeopleCount(rooms, people);
  let summary = exact.length ? `${copy.livePositions} · ${countKnown ? exact.length : copy.countUnknown}` : approximate.length ? `${copy.occupiedWithoutPosition} · ${approximate.join(", ")}` : unknown.length ? `${copy.sensorStatusUnknown} · ${unknown.join(", ")}` : copy.noExactPositions;
  if (unknown.length && exact.length) summary += ` · ${copy.sensorStatusUnknown}: ${unknown.join(", ")}`;
  return summary;
}

// src/ha/host-copy.js
var labelOrder = [
  "saveFloorPlan",
  "saved",
  "unsaved",
  "saving",
  "loading",
  "noExactPositions",
  "livePositions",
  "noDevice",
  "currentDevice",
  "linkedDevice",
  "radarSettings",
  "save",
  "savedCalibration",
  "points",
  "floorPlan",
  "openFailed",
  "saveFailed",
  "occupiedWithoutPosition",
  "countUnknown",
  "sensorStatusUnknown",
  "changedElsewhere",
  "checkBeforeSaving",
  "skippedRooms"
];
var pageCopy = {
  nl: {
    saveFloorPlan: "Plattegrond opslaan",
    saved: "Opgeslagen in Home Assistant",
    unsaved: "Wijzigingen die nog niet zijn opgeslagen",
    saving: "Bezig met opslaan...",
    loading: "Plattegrond laden...",
    noExactPositions: "Geen exacte live posities",
    livePositions: "Live posities",
    noDevice: "Geen apparaat gekoppeld",
    currentDevice: "Huidig gekoppeld apparaat",
    linkedDevice: "Gekoppeld HA-apparaat",
    radarSettings: "Radarinstellingen",
    save: "Opslaan",
    savedCalibration: "Opgeslagen kalibratie",
    points: "punten",
    floorPlan: "Plattegrond",
    openFailed: "De plattegrond kon niet worden geopend.",
    saveFailed: "De plattegrond kon niet worden opgeslagen.",
    occupiedWithoutPosition: "Bezet zonder exacte positie",
    countUnknown: "Exact aantal personen onbekend",
    sensorStatusUnknown: "Sensorstatus onbekend",
    changedElsewhere: "De plattegrond is elders gewijzigd. Herlaad voordat je opnieuw opslaat.",
    checkBeforeSaving: "Controleer de kamers, sensoren en zones voordat je opslaat.",
    skippedRooms: "{count} ongeldige ruimte(s) zijn veilig overgeslagen. De originele gegevens zijn niet gewijzigd."
  },
  en: {
    saveFloorPlan: "Save floor plan",
    saved: "Saved in Home Assistant",
    unsaved: "Unsaved changes",
    saving: "Saving...",
    loading: "Loading floor plan...",
    noExactPositions: "No exact live positions",
    livePositions: "Live positions",
    noDevice: "No device linked",
    currentDevice: "Currently linked device",
    linkedDevice: "Linked HA device",
    radarSettings: "Radar settings",
    save: "Save",
    savedCalibration: "Saved calibration",
    points: "points",
    floorPlan: "Floor plan",
    openFailed: "The floor plan could not be opened.",
    saveFailed: "The floor plan could not be saved.",
    occupiedWithoutPosition: "Occupied without an exact position",
    countUnknown: "Exact people count unknown",
    sensorStatusUnknown: "Sensor status unknown",
    changedElsewhere: "The floor plan changed elsewhere. Reload before saving again.",
    checkBeforeSaving: "Check the rooms, sensors and zones before saving.",
    skippedRooms: "{count} invalid room(s) were safely skipped. Their original data was not changed."
  },
  de: {
    saveFloorPlan: "Grundriss speichern",
    saved: "In Home Assistant gespeichert",
    unsaved: "Nicht gespeicherte Änderungen",
    saving: "Wird gespeichert...",
    loading: "Grundriss wird geladen...",
    noExactPositions: "Keine exakten Live-Positionen",
    livePositions: "Live-Positionen",
    noDevice: "Kein Gerät verknüpft",
    currentDevice: "Aktuell verknüpftes Gerät",
    linkedDevice: "Verknüpftes HA-Gerät",
    radarSettings: "Radareinstellungen",
    save: "Speichern",
    savedCalibration: "Gespeicherte Kalibrierung",
    points: "Punkte",
    floorPlan: "Grundriss",
    openFailed: "Der Grundriss konnte nicht geöffnet werden.",
    saveFailed: "Der Grundriss konnte nicht gespeichert werden.",
    occupiedWithoutPosition: "Belegt ohne genaue Position",
    countUnknown: "Genaue Personenzahl unbekannt",
    sensorStatusUnknown: "Sensorstatus unbekannt",
    changedElsewhere: "Der Grundriss wurde an anderer Stelle geändert. Lade ihn vor dem erneuten Speichern neu.",
    checkBeforeSaving: "Prüfe Räume, Sensoren und Zonen vor dem Speichern.",
    skippedRooms: "{count} ungültige Räume wurden sicher übersprungen. Die Originaldaten wurden nicht geändert."
  },
  fr: {
    saveFloorPlan: "Enregistrer le plan",
    saved: "Enregistré dans Home Assistant",
    unsaved: "Modifications non enregistrées",
    saving: "Enregistrement...",
    loading: "Chargement du plan...",
    noExactPositions: "Aucune position exacte en direct",
    livePositions: "Positions en direct",
    noDevice: "Aucun appareil associé",
    currentDevice: "Appareil actuellement associé",
    linkedDevice: "Appareil HA associé",
    radarSettings: "Réglages du radar",
    save: "Enregistrer",
    savedCalibration: "Étalonnage enregistré",
    points: "points",
    floorPlan: "Plan",
    openFailed: "Impossible d'ouvrir le plan.",
    saveFailed: "Impossible d'enregistrer le plan.",
    occupiedWithoutPosition: "Occupé sans position exacte",
    countUnknown: "Nombre exact de personnes inconnu",
    sensorStatusUnknown: "État du capteur inconnu",
    changedElsewhere: "Le plan a été modifié ailleurs. Rechargez-le avant de l'enregistrer à nouveau.",
    checkBeforeSaving: "Vérifiez les pièces, les capteurs et les zones avant l'enregistrement.",
    skippedRooms: "{count} pièce(s) invalide(s) ont été ignorées en toute sécurité. Les données d'origine n'ont pas été modifiées."
  },
  es: {
    saveFloorPlan: "Guardar plano",
    saved: "Guardado en Home Assistant",
    unsaved: "Cambios sin guardar",
    saving: "Guardando...",
    loading: "Cargando plano...",
    noExactPositions: "Sin posiciones exactas en directo",
    livePositions: "Posiciones en directo",
    noDevice: "Ningún dispositivo vinculado",
    currentDevice: "Dispositivo vinculado actualmente",
    linkedDevice: "Dispositivo de HA vinculado",
    radarSettings: "Ajustes del radar",
    save: "Guardar",
    savedCalibration: "Calibración guardada",
    points: "puntos",
    floorPlan: "Plano",
    openFailed: "No se pudo abrir el plano.",
    saveFailed: "No se pudo guardar el plano.",
    occupiedWithoutPosition: "Ocupado sin posición exacta",
    countUnknown: "Número exacto de personas desconocido",
    sensorStatusUnknown: "Estado del sensor desconocido",
    changedElsewhere: "El plano se modificó en otro lugar. Vuelve a cargarlo antes de guardarlo de nuevo.",
    checkBeforeSaving: "Comprueba las habitaciones, los sensores y las zonas antes de guardar.",
    skippedRooms: "Se omitieron de forma segura {count} habitaciones no válidas. Sus datos originales no se modificaron."
  }
};
var pageText = (language) => pageCopy[language] ?? pageCopy.en;
var editorLabels = (text) => labelOrder.map((name) => text[name]);
var pickerCopy = {
  nl: {
    title: "Sensor uit Home Assistant toevoegen",
    prompt: "Kies je apparaat en plaats het op de kaart.",
    search: "Zoek op apparaatnaam",
    free: "Beschikbaar om te plaatsen",
    placed: "Al op de plattegrond",
    allPlaced: "Al je sensoren staan op de plattegrond.",
    empty: "Geen geschikte sensoren gevonden. Voeg een sensor toe in Home Assistant via ESPHome.",
    noResults: "Geen apparaten gevonden voor deze zoekopdracht.",
    offline: "Offline",
    unknown: "Radar onbekend",
    missing: "Gekoppeld apparaat niet gevonden",
    unlinked: "Geen apparaat gekoppeld",
    choose: "Kies een apparaat",
    invalid: "Kies een beschikbare sensor uit Home Assistant.",
    error: "Apparaten konden niet worden geladen. Open het menu opnieuw om het nog eens te proberen.",
    inside: "Kies een plek binnen een kamer.",
    importNote: "De plattegrond is geladen. Plaats je eigen sensoren via Sensor.",
    savedPositions: "Opgeslagen sensorposities"
  },
  en: {
    title: "Add a Home Assistant sensor",
    prompt: "Choose your device and place it on the map.",
    search: "Search by device name",
    free: "Available to place",
    placed: "Already on the floor plan",
    allPlaced: "All your sensors are on the floor plan.",
    empty: "No compatible sensors found. Add a sensor to Home Assistant through ESPHome.",
    noResults: "No devices match your search.",
    offline: "Offline",
    unknown: "Radar unknown",
    missing: "Linked device not found",
    unlinked: "No device linked",
    choose: "Choose a device",
    invalid: "Choose an available Home Assistant sensor.",
    error: "Devices could not be loaded. Reopen this menu to try again.",
    inside: "Choose a position inside a room.",
    importNote: "The floor plan is loaded. Place your own devices via Sensor.",
    savedPositions: "Saved sensor positions"
  },
  de: {
    title: "Home-Assistant-Sensor hinzufügen",
    prompt: "Wähle dein Gerät und platziere es auf der Karte.",
    search: "Nach Gerätenamen suchen",
    free: "Zum Platzieren verfügbar",
    placed: "Bereits im Grundriss",
    allPlaced: "Alle Sensoren befinden sich im Grundriss.",
    empty: "Keine kompatiblen Sensoren gefunden. Füge über ESPHome einen Sensor zu Home Assistant hinzu.",
    noResults: "Keine Geräte für diese Suche gefunden.",
    offline: "Offline",
    unknown: "Radar unbekannt",
    missing: "Verknüpftes Gerät nicht gefunden",
    unlinked: "Kein Gerät verknüpft",
    choose: "Gerät auswählen",
    invalid: "Wähle einen verfügbaren Home-Assistant-Sensor.",
    error: "Geräte konnten nicht geladen werden. Öffne dieses Menü erneut, um es noch einmal zu versuchen.",
    inside: "Wähle eine Position innerhalb eines Raums.",
    importNote: "Der Grundriss wurde geladen. Platziere deine eigenen Geräte über Sensor.",
    savedPositions: "Gespeicherte Sensorpositionen"
  },
  fr: {
    title: "Ajouter un capteur Home Assistant",
    prompt: "Choisissez votre appareil et placez-le sur la carte.",
    search: "Rechercher par nom d'appareil",
    free: "Disponible à placer",
    placed: "Déjà sur le plan",
    allPlaced: "Tous vos capteurs figurent sur le plan.",
    empty: "Aucun capteur compatible trouvé. Ajoutez un capteur à Home Assistant via ESPHome.",
    noResults: "Aucun appareil ne correspond à votre recherche.",
    offline: "Hors ligne",
    unknown: "Radar inconnu",
    missing: "Appareil associé introuvable",
    unlinked: "Aucun appareil associé",
    choose: "Choisir un appareil",
    invalid: "Choisissez un capteur Home Assistant disponible.",
    error: "Impossible de charger les appareils. Rouvrez ce menu pour réessayer.",
    inside: "Choisissez une position à l'intérieur d'une pièce.",
    importNote: "Le plan est chargé. Placez vos propres appareils via Capteur.",
    savedPositions: "Positions enregistrées des capteurs"
  },
  es: {
    title: "Añadir un sensor de Home Assistant",
    prompt: "Elige tu dispositivo y colócalo en el mapa.",
    search: "Buscar por nombre del dispositivo",
    free: "Disponible para colocar",
    placed: "Ya está en el plano",
    allPlaced: "Todos tus sensores están en el plano.",
    empty: "No se encontraron sensores compatibles. Añade un sensor a Home Assistant mediante ESPHome.",
    noResults: "Ningún dispositivo coincide con tu búsqueda.",
    offline: "Sin conexión",
    unknown: "Radar desconocido",
    missing: "No se encontró el dispositivo vinculado",
    unlinked: "Ningún dispositivo vinculado",
    choose: "Elegir un dispositivo",
    invalid: "Elige un sensor de Home Assistant disponible.",
    error: "No se pudieron cargar los dispositivos. Vuelve a abrir este menú para intentarlo de nuevo.",
    inside: "Elige una posición dentro de una habitación.",
    importNote: "El plano está cargado. Coloca tus propios dispositivos mediante Sensor.",
    savedPositions: "Posiciones guardadas de los sensores"
  }
};
var coverageEstimateCopy = {
  nl: "Geschat bereik buiten de referentiehoogte",
  en: "Estimated coverage outside the reference height",
  de: "Geschätzte Abdeckung außerhalb der Referenzhöhe",
  es: "Cobertura estimada fuera de la altura de referencia",
  fr: "Couverture estimée hors hauteur de référence"
};

// src/ha/host.js
var same2 = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var withoutActiveFloor = ({ activeFloor, ...project }) => project;
var editorLanguages = ["nl", "en", "de", "fr", "es"];
var runtimeTimeout = 2500;
var template = `<style>
    :host { display:flex; flex:1; flex-direction:column; min-width:0; min-height:0; }
    .fp-ha-actions { padding:10px 14px; color:var(--secondary-text-color,#526178); }
    .fp-ha-actions p { margin:0; font-size:13px; }
    .fp-ha-actions p[data-error] { color:var(--error-color,#aa2b25); }
    .fp-ha-actions button, .fp-ha-actions .detections { display:none; }
    iframe { display:block; border:0; width:100%; flex:1; min-height:0; background:var(--primary-background-color,#f4f6f8); }
    [hidden] { display:none; }
</style><div class="fp-ha-actions"><div class="fp-ha-status"><p class="detections" role="status"></p><p class="save-status" role="status"></p></div>
    <button class="secondary" type="button"><svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.5"/><path d="m10 10 5-5"/></svg><span></span></button>
    <button class="save" type="button"><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 3h10l3 3v11H3V3zm2 0v5h7V3m-7 14v-5h8v5"/></svg><span></span></button>
</div>`;
var FloorPlannerPage = class extends HTMLElement {
  #hass;
  #mode = "edit";
  // The smarthomeshop/floor_plan answer: project, rooms, revisions, version.
  #floorPlan;
  // The project as last loaded or saved, and the editor's current one.
  #saved;
  #current;
  // What the editor gave connect(): applySaved, setMode, setPeople, ...
  #editor;
  #actions;
  #saveButton;
  #radarButton;
  #saveStatus;
  #detections;
  #frame;
  // The language the editor in the frame was opened in.
  #frameLanguage;
  #loading = false;
  #saving = false;
  #runtime;
  #profiles = [];
  #devices = [];
  #devicesRequest;
  #devicesFailed = false;
  #receipts = new EntityReportReceiptTracker();
  #refreshTimer;
  #liveFrame;
  #sentPeople;
  #tracks = /* @__PURE__ */ new Map();
  #fusion = new StatefulWholeHomeFusion();
  #runtimeRequest = 0;
  #runtimePending = false;
  #runtimeReceivedAt = 0;
  #text = pageText("nl");
  get isDirty() {
    return Boolean(this.#current && !same2(withoutActiveFloor(this.#current), withoutActiveFloor(this.#saved)));
  }
  focusRadarButton() {
    this.#radarButton?.focus({ preventScroll: true });
  }
  // The radar tools saved a calibration for one room. Take it over only when
  // it was made on the revision this page has, so nothing newer is lost.
  // Without revisions there is no telling, so the page keeps what it has.
  applyRadarCalibration({ room, previousRevision } = {}) {
    const revisions = this.#floorPlan?.revisions;
    if (!room || !revisions || typeof revisions !== "object" || !Object.hasOwn(revisions, room.id) || (revisions[room.id] ?? null) !== (previousRevision ?? null)) return;
    this.#floorPlan.rooms = this.#floorPlan.rooms.map((candidate) => candidate.id === room.id ? room : candidate);
    revisions[room.id] = room.updated_at ?? null;
    this.#editor?.devicesChanged?.();
    this.#refreshRuntime();
  }
  set hass(hass) {
    this.#hass = hass;
    if (!this.isConnected) return;
    this.#followLanguage();
    const editorRoot = this.#frame?.contentDocument?.documentElement;
    const theme = this.#theme();
    if (editorRoot && editorRoot.dataset.haTheme !== theme) editorRoot.dataset.haTheme = theme;
    if (!this.#floorPlan) this.#load();
    if (this.#editor && !this.#liveFrame) {
      this.#liveFrame = requestAnimationFrame(() => {
        this.#liveFrame = null;
        this.#renderLive();
      });
    }
  }
  set mode(mode) {
    if (this.#mode === mode) return;
    this.#mode = mode;
    if (this.#editor) {
      this.#editor.applySaved(this.#shownProject());
      this.#editor.setMode(mode);
    }
    this.#sentPeople = void 0;
    this.#renderStatus();
    if (this.#editor) this.#refreshRuntime();
  }
  connectedCallback() {
    for (const name of ["hass", "mode"]) {
      if (!Object.hasOwn(this, name)) continue;
      const value = this[name];
      delete this[name];
      if (name === "hass") this.#hass = value;
      else this.#mode = value;
    }
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = template;
      this.#actions = this.shadowRoot.querySelector(".fp-ha-actions");
      this.#saveButton = this.shadowRoot.querySelector(".save");
      this.#radarButton = this.shadowRoot.querySelector(".secondary");
      this.#saveStatus = this.shadowRoot.querySelector(".save-status");
      this.#detections = this.shadowRoot.querySelector(".detections");
      this.#saveButton.addEventListener("click", () => void this.#save());
      this.#radarButton.setAttribute("aria-haspopup", "dialog");
      this.#radarButton.addEventListener("click", () => this.dispatchEvent(new CustomEvent("open-radar-tools", {
        bubbles: true,
        composed: true,
        detail: { ...this.#editor?.radarContext?.(), readOnly: this.isDirty }
      })));
    }
    this.#applyText();
    this.#renderStatus();
    if (this.#frame) this.#followLanguage();
    if (this.#editor) {
      this.#editor.applySaved(this.#shownProject());
      this.#editor.setMode(this.#mode);
      this.#refreshRuntime();
    }
    if (this.#hass) this.#load();
    clearInterval(this.#refreshTimer);
    this.#refreshTimer = setInterval(() => {
      if (this.#editor && !document.hidden) this.#refreshRuntime();
    }, 1e3);
  }
  disconnectedCallback() {
    clearInterval(this.#refreshTimer);
    this.#refreshTimer = void 0;
    this.#runtimeRequest += 1;
    this.#runtimePending = false;
    this.#runtimeReceivedAt = 0;
    if (this.#liveFrame != null) cancelAnimationFrame(this.#liveFrame);
    this.#liveFrame = null;
  }
  #language() {
    return this.#hass?.language?.split("-")[0];
  }
  // Live mode shows the saved project without the rooms Live Home hides,
  // edit mode the editor's own project, or the saved one before it has any.
  #shownProject() {
    return this.#mode === "live" ? withoutHiddenRooms(this.#saved) : this.#current ?? this.#saved;
  }
  #applyText() {
    this.#text = pageText(this.#language());
    for (const [button, name, text] of [
      [this.#saveButton, this.#text.saveFloorPlan, this.#text.save],
      [this.#radarButton, this.#text.radarSettings]
    ]) {
      button.setAttribute("aria-label", name);
      button.title = name;
      button.querySelector("span").textContent = text ?? name;
    }
    if (this.#frame) this.#frame.title = this.#text.floorPlan;
  }
  // The editor's pages and labels come in one language each. When Home
  // Assistant switches language the editor opens again in the new one, with
  // the project as it is, unsaved changes included. Never during a save: the
  // next state update tries again.
  #followLanguage() {
    if (!this.#frame || this.#saving || this.#language() === this.#frameLanguage) return;
    this.#applyText();
    this.#openEditor();
    this.#renderStatus();
  }
  #openEditor() {
    const language = this.#language();
    const frame = document.createElement("iframe");
    frame.title = this.#text.floorPlan;
    frame.floorPlannerHost = this.#editorAdapter(language, frame);
    const page = new URL(`./${editorLanguages.includes(language) ? language : "en"}.html`, import.meta.url);
    page.search = new URL(import.meta.url).search;
    frame.src = page.href;
    if (this.#frame) {
      this.shadowRoot.insertBefore(this.#actions, this.#frame);
      this.#frame.replaceWith(frame);
    } else this.shadowRoot.append(frame);
    this.#frame = frame;
    this.#frameLanguage = language;
    this.#editor = void 0;
    this.#sentPeople = void 0;
  }
  #theme() {
    return this.#hass?.themes?.darkMode ?? matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  // Once per page: the floor plan and the radars, then the editor.
  async #load() {
    if (this.#floorPlan || this.#loading) return;
    this.#loading = true;
    try {
      const [floorPlan] = await Promise.all([this.#hass.callWS({ type: "smarthomeshop/floor_plan" }), this.#loadDevices()]);
      if (!this.isConnected) return;
      this.#saved = validProject(floorPlan.project) ? floorPlan.project : projectFromRooms(floorPlan.rooms, this.#profiles, this.#devices);
      this.#floorPlan = floorPlan;
      if (this.#saved.skippedRooms?.length) this.#showError(this.#skippedRooms(this.#saved.skippedRooms.length));
      if (Number(floorPlan.recovery?.count) > 0) this.#showError(this.#skippedRooms(floorPlan.recovery.count));
      this.#applyText();
      this.#openEditor();
    } catch {
      this.#showError(this.#text.openFailed);
    } finally {
      this.#loading = false;
    }
  }
  #skippedRooms(count) {
    return this.#text.skippedRooms.replace("{count}", String(count));
  }
  // What the editor in the iframe sees of Home Assistant. An editor that was
  // replaced (see #followLanguage) is no longer listened to.
  #editorAdapter(language, frame) {
    const page = this;
    return {
      get project() {
        return structuredClone(page.#shownProject());
      },
      theme: () => this.#theme(),
      mountActions: (parent) => parent.append(this.#actions),
      labels: editorLabels(this.#text),
      picker: pickerCopy[language] ?? pickerCopy.en,
      coverageEstimate: coverageEstimateCopy[language] ?? coverageEstimateCopy.en,
      devices: () => this.#devices,
      device: (id) => findPlannerDevice(this.#devices, id),
      deviceError: () => this.#devicesFailed,
      refreshDevices: () => this.#loadDevices(),
      asset: (path) => `/smarthomeshop_panel/floor-planner${path}`,
      calibrationLabel: (roomId) => {
        const calibration = this.#floorPlan.rooms.find((room) => room.id === roomId)?.calibration;
        return calibration?.enabled ? `${this.#text.savedCalibration} · ${calibration.corners?.length ?? 0} ${this.#text.points}` : "";
      },
      update: (project) => {
        if (frame !== this.#frame || this.#mode === "live") return;
        const copy = structuredClone(project);
        if (!this.#editor && !this.isDirty) this.#saved = copy;
        this.#current = copy;
        this.#renderStatus();
      },
      connect: (editor) => {
        if (frame !== this.#frame) return;
        this.#editor = editor;
        if (this.#mode === "live") editor.applySaved(withoutHiddenRooms(this.#saved));
        editor.setMode(this.#mode);
        this.#renderStatus();
        this.#refreshRuntime();
      }
    };
  }
  // Radar profiles and Home Assistant devices, one request at a time.
  #loadDevices() {
    this.#devicesRequest ??= Promise.allSettled([
      this.#hass.callWS({ type: "smarthomeshop/radar/profiles" }),
      this.#hass.callWS({ type: "smarthomeshop/devices" })
    ]).then(([profiles, devices2]) => {
      if (profiles.status === "fulfilled") this.#profiles = radarProfiles(profiles.value?.devices);
      this.#devicesFailed = profiles.status === "rejected" && devices2.status === "rejected";
      if (this.#devicesFailed) return;
      const hidden = (devices2.value?.hidden_devices ?? []).map((device) => ({ ...device, hidden: true }));
      const found = plannerDevices(this.#profiles, [...devices2.value?.devices ?? [], ...hidden]);
      const changed = !same2(this.#devices, found);
      this.#devices = found;
      if (changed) this.#editor?.devicesChanged?.();
      this.#renderLive();
    }).finally(() => {
      this.#devicesRequest = null;
    });
    return this.#devicesRequest;
  }
  #renderStatus() {
    if (!this.#saveStatus) return;
    this.#saveButton.hidden = this.#mode === "live" || !this.#hass?.user?.is_admin;
    this.#saveButton.disabled = !this.isDirty || this.#saving;
    this.#radarButton.hidden = this.#saveButton.hidden;
    this.#radarButton.disabled = !this.#editor || this.#saving;
    if (this.#saveStatus.hasAttribute("data-error")) return;
    const status = this.#saving ? this.#text.saving : !this.#editor ? this.#text.loading : this.isDirty ? this.#text.unsaved : this.#mode === "live" ? "" : this.#text.saved;
    this.#saveStatus.hidden = !status;
    if (this.#saveStatus.textContent !== status) this.#saveStatus.textContent = status;
  }
  #showError(message) {
    this.#saveStatus.hidden = false;
    this.#saveStatus.setAttribute("data-error", "");
    this.#saveStatus.textContent = message;
  }
  async #save() {
    if (this.#saving || !this.isDirty || this.#mode !== "edit") return;
    const project = structuredClone(this.#current);
    this.#saveStatus.removeAttribute("data-error");
    this.#saving = true;
    this.#frame.inert = true;
    this.#renderStatus();
    try {
      const { changes, removed } = saveChanges(project, this.#saved, this.#floorPlan.rooms);
      const saved = await this.#hass.callWS({
        type: "smarthomeshop/floor_plan/save",
        project,
        changes,
        removed,
        revisions: this.#floorPlan.revisions,
        version: this.#floorPlan.version
      });
      this.#floorPlan = saved;
      this.#current = this.#saved = saved.project;
      this.#editor.applySaved(saved.project);
    } catch (error) {
      this.#showError(error?.code === "conflict" ? this.#text.changedElsewhere : error?.code === "invalid_format" ? this.#text.checkBeforeSaving : error instanceof FloorPlanValidationError2 ? floorPlanValidationMessage(error, this.#hass?.language) : this.#text.saveFailed);
    } finally {
      this.#saving = false;
      this.#frame.inert = false;
      this.#renderStatus();
    }
  }
  // The integration's room runtime decides occupancy where it can. Only one
  // request runs at a time; an answer that arrives late or after the page
  // went away is dropped, and so is the fusion state built on the old one.
  async #refreshRuntime() {
    if (!this.#floorPlan) return;
    if (this.#runtimePending) {
      this.#renderLive();
      return;
    }
    const request = ++this.#runtimeRequest;
    const requestedAt = Date.now();
    this.#runtimePending = true;
    try {
      const snapshot = await this.#hass.callWS({ type: "smarthomeshop/rooms/runtime" });
      if (request !== this.#runtimeRequest) return;
      if (Date.now() - requestedAt > runtimeTimeout) {
        this.#runtimeReceivedAt = 0;
        this.#fusion.reset();
        return;
      }
      this.#runtime = snapshot;
      this.#runtimeReceivedAt = Date.now();
    } catch {
      if (request !== this.#runtimeRequest) return;
      this.#runtimeReceivedAt = 0;
      this.#fusion.reset();
    } finally {
      if (request === this.#runtimeRequest) this.#runtimePending = false;
    }
    this.#renderLive();
  }
  // The people on the plan and the detection line under it.
  #renderLive() {
    if (!this.#floorPlan || !this.#editor) return;
    const states = this.#hass.states ?? {};
    const now = Date.now();
    const serverNow = latestIndependentReportTimestamp(states, radarEntityIds(this.#profiles), now);
    const runtimeRooms = this.#runtime?.rooms ?? {};
    const authoritative = runtimeSnapshotIsAuthoritative(this.#runtime, this.#runtimeReceivedAt, now);
    const rooms = roomsInHouse(applyAuthoritativeRuntimeTracking(this.#floorPlan.rooms, runtimeRooms, authoritative));
    const houses = new Map(rooms.map((room) => [room.id, room.house]));
    const presence = collectLivePresence(
      rooms,
      this.#profiles,
      (entityId) => this.#receipts.state(entityId, states[entityId], now, serverNow),
      now,
      runtimeRooms,
      authoritative && this.#runtime?.available === true
    );
    const fusion = this.#fusion.apply(presence.people, rooms, this.#profiles, now);
    const roomStates = withFusedRooms(presence.rooms, fusion.people, fusion.fusedRoomIds);
    this.#tracks = liveTracks(this.#tracks, fusion.people, houses, now);
    const people = livePeople(this.#tracks, now);
    if (!same2(this.#sentPeople, people)) {
      this.#editor.setPeople(people);
      this.#sentPeople = people;
    }
    const summary = detectionSummary(this.#text, people, roomStates);
    if (this.#detections.textContent !== summary) this.#detections.textContent = summary;
  }
};
if (!customElements.get("shs-floor-planner-page")) customElements.define("shs-floor-planner-page", FloorPlannerPage);
