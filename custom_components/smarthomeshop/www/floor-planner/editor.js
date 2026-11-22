// Generated from floor-planner/src by floor-planner/build.mjs. Edit the source, then rebuild.
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/js/floor-planner-geometry.mjs
function convexHull(points) {
  if (points.length < 3) return points;
  const sorted = [...points].sort(([ax, ay], [bx, by]) => ax - bx || ay - by);
  const half = (ordered) => {
    const edge = [];
    for (const point3 of ordered) {
      while (edge.length > 1) {
        const [ax, ay] = edge.at(-2), [bx, by] = edge.at(-1);
        if (cross(bx - ax, by - ay, point3[0] - ax, point3[1] - ay) > 0) break;
        edge.pop();
      }
      edge.push(point3);
    }
    return edge.slice(0, -1);
  };
  return [...half(sorted), ...half(sorted.reverse())];
}
function roomWallEdges(room) {
  const corners = roomCorners(room);
  return polygonEdges(corners.filter((point3, index) => !onSegment(
    point3,
    corners[(index + corners.length - 1) % corners.length],
    corners[(index + 1) % corners.length]
  )));
}
function polygonContains(vertices, x, y, includeEdge = true) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[j], b = vertices[i];
    if (onSegment([x, y], a, b)) return includeEdge;
    if (a[1] > y !== b[1] > y && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function roomContains(room, point3, includeEdge = true) {
  const x = point3.x - room.x, y = point3.y - room.y;
  if (!room.outline) return includeEdge ? point3.x >= room.x && point3.y >= room.y && point3.x <= room.x + room.width && point3.y <= room.y + room.depth : x > epsilon && y > epsilon && x < room.width - epsilon && y < room.depth - epsilon;
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
  if (points.length < 3 || points.length > maxCorners || points.some((point3) => !Array.isArray(point3) || point3.length !== 2 || !point3.every(Number.isFinite))) return null;
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
    const start3 = cuts[i - 1], end2 = cuts[i];
    if (end2 - start3 < epsilon) continue;
    const middle = (start3 + end2) / 2;
    if (roomContains(room, { x: a[0] + (b[0] - a[0]) * middle, y: a[1] + (b[1] - a[1]) * middle }, includeEdge)) {
      if (spans.length && start3 - spans.at(-1)[1] < epsilon) spans.at(-1)[1] = end2;
      else spans.push([start3, end2]);
    }
  }
  return spans;
}
function roomRayEnd(room, origin, target, edges = polygonEdges(roomCorners(room))) {
  const a = [origin.x, origin.y], b = [target.x, target.y];
  let limit = 1;
  if (!roomContains(room, { x: origin.x + (target.x - origin.x) * 1e-5, y: origin.y + (target.y - origin.y) * 1e-5 })) limit = 0;
  else for (const [c, d] of edges) {
    const t = crossing(a, b, c, d);
    if (t !== null && t > epsilon) limit = Math.min(limit, t);
  }
  return [a[0] + (b[0] - a[0]) * limit, a[1] + (b[1] - a[1]) * limit];
}
function roomVisibility(room, origin) {
  const corners = roomCorners(room);
  const edges = polygonEdges(corners);
  const distance4 = Math.hypot(room.width, room.depth) + 1;
  const angles2 = corners.flatMap(([x, y]) => {
    const angle2 = Math.atan2(y - origin.y, x - origin.x);
    return [angle2 - 1e-5, angle2, angle2 + 1e-5];
  }).map((angle2) => (angle2 + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
  return angles2.map((angle2) => roomRayEnd(room, origin, {
    x: origin.x + Math.cos(angle2) * distance4,
    y: origin.y + Math.sin(angle2) * distance4
  }, edges));
}
function roomInteriorPoint(room, preferred = { x: room.x + room.width / 2, y: room.y + room.depth / 2 }) {
  if (!room.outline || roomContains(room, preferred, false)) return preferred;
  const levels = [...new Set(room.outline.map(([, y]) => y))].sort((a, b) => a - b);
  let best = preferred, score = 0;
  for (let i = 1; i < levels.length; i++) {
    const y = room.y + (levels[i - 1] + levels[i]) / 2;
    for (const [left, right] of roomLineSpans(room, { x: room.x, y }, { x: room.x + room.width, y })) {
      const weight = (right - left) * (levels[i] - levels[i - 1]);
      if (weight <= score) continue;
      best = { x: room.x + (left + right) * room.width / 2, y };
      score = weight;
    }
  }
  return best;
}
function edgePosition([ax, ay], [bx, by], point3) {
  const dx = bx - ax, dy = by - ay;
  const length = Math.hypot(dx, dy);
  const along = Math.max(0, Math.min(length, ((point3.x - ax) * dx + (point3.y - ay) * dy) / length));
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
function wallSegments(a, b, doors, reach2 = 0.04) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length = Math.hypot(dx, dy);
  const position = ([x, y]) => ((x - a[0]) * dx + (y - a[1]) * dy) / length ** 2;
  const onLine = ([x, y]) => Math.abs((x - a[0]) * dy - (y - a[1]) * dx) / length < reach2;
  const openings = doors.filter((door) => door.every(onLine)).map((door) => door.map(position).sort((a2, b2) => a2 - b2)).filter(([from, to]) => to > 0 && from < 1).sort(([a2], [b2]) => a2 - b2);
  const at = (fraction) => [a[0] + dx * fraction, a[1] + dy * fraction];
  const segments = [];
  let end2 = 0;
  for (const [from, to] of openings) {
    if (from > end2) segments.push([at(end2), at(from)]);
    end2 = Math.max(end2, to);
  }
  if (end2 < 1) segments.push([at(end2), b]);
  return segments;
}
var epsilon, maxRoomCorners, defaultWindowSill, rectangle, roomCorners, polygonEdges, cross, signedArea, roomArea, samePoint, onSegment, pointInOutline, roomContainsLine, doorsOnPlan;
var init_floor_planner_geometry = __esm({
  "src/js/floor-planner-geometry.mjs"() {
    epsilon = 1e-7;
    maxRoomCorners = 64;
    defaultWindowSill = 1.15;
    rectangle = (room) => [
      [room.x, room.y],
      [room.x + room.width, room.y],
      [room.x + room.width, room.y + room.depth],
      [room.x, room.y + room.depth]
    ];
    roomCorners = (room) => room.outline?.map(([x, y]) => [x + room.x, y + room.y]) ?? rectangle(room);
    polygonEdges = (points) => points.map((point3, index) => [point3, points[(index + 1) % points.length]]);
    cross = (ax, ay, bx, by) => ax * by - ay * bx;
    signedArea = (points) => polygonEdges(points).reduce((area, [[ax, ay], [bx, by]]) => area + ax * by - ay * bx, 0) / 2;
    roomArea = (room) => room.outline ? Math.abs(signedArea(room.outline)) : room.width * room.depth;
    samePoint = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < epsilon;
    onSegment = ([x, y], [ax, ay], [bx, by]) => Math.abs(cross(bx - ax, by - ay, x - ax, y - ay)) < epsilon && x >= Math.min(ax, bx) - epsilon && x <= Math.max(ax, bx) + epsilon && y >= Math.min(ay, by) - epsilon && y <= Math.max(ay, by) + epsilon;
    pointInOutline = (vertices, point3) => polygonContains(vertices, point3.x, point3.y);
    roomContainsLine = (room, from, to) => {
      const spans = roomLineSpans(room, from, to);
      return spans[0]?.[0] < epsilon && spans[0][1] > 1 - epsilon;
    };
    doorsOnPlan = (plan2) => plan2.doors.map((door) => {
      const angle2 = door.angle * Math.PI / 180;
      return [[door.x, door.y], [door.x + door.width * Math.cos(angle2), door.y + door.width * Math.sin(angle2)]];
    });
  }
});

// src/js/ceilsense-room-model.mjs
function reachAbove(radius, top2, height, body) {
  const reach2 = Math.hypot(radius, top2 - body);
  return Math.sqrt(Math.max(0, reach2 ** 2 - (height - body) ** 2));
}
function radarFootprint(radar, height) {
  if (radar === "combined") return radarFootprint("ld6002b", height);
  if (radar === "ld2412") {
    const [, top2] = mountingRanges.ld2412;
    const footprint2 = (posture, radii2) => scale(Math.min(height, top2), 2.8, radii2).map((radius) => height > top2 ? reachAbove(radius, top2, height, bodyHeight[posture]) : radius);
    return {
      moving: footprint2("moving", [4.8, 6.4]),
      standing: footprint2("standing", [4.4, 5.6]),
      seated: footprint2("seated", [3, 4.2])
    };
  }
  const radii = radar === "ld2460" ? scale(height, 2.8, [4, 2.8]) : height < 2.7 ? scale(height, 2.7, [2.5, 1.5]) : height <= 3 ? [1.5 + (3 - height) / 0.3, 1.5] : scale(height, 3, [1.5, 1.5]);
  return { moving: radii, standing: radii, seated: radii };
}
function validRoom(room) {
  return Object.entries(roomLimits).every(([key, [min, max]]) => Number.isFinite(room[key]) && room[key] >= min && room[key] <= max);
}
function supportedMounting(radar, height) {
  const range = mountingRange(radar);
  return Boolean(range && height >= range[0] && height <= range[1]);
}
function mountingRange(radar) {
  if (radar !== "combined") return mountingRanges[radar];
  const [presenceMin, presenceMax] = mountingRanges.ld2412;
  const [positionMin, positionMax] = mountingRanges.ld6002b;
  return [Math.max(presenceMin, positionMin), Math.min(presenceMax, positionMax)];
}
var roomLimits, mountingRanges, plannerRadars, modelGoal, slots, scale, bodyHeight;
var init_ceilsense_room_model = __esm({
  "src/js/ceilsense-room-model.mjs"() {
    roomLimits = { width: [2, 15], depth: [2, 12], height: [2, 4] };
    mountingRanges = { ld2412: [2, 3], ld2460: [2, 3], ld6002b: [2, 3] };
    plannerRadars = [...Object.keys(mountingRanges), "combined"];
    modelGoal = 90;
    slots = [0.5, 0.25, 0.75, 1 / 6, 5 / 6];
    scale = (height, reference, radii) => {
      const factor = Math.min(height / reference, reference / height);
      return radii.map((radius) => radius * factor);
    };
    bodyHeight = { moving: 1.35, standing: 1.35, seated: 0.85 };
  }
});

// src/js/floor-planner-ceiling.mjs
function validCeiling(room) {
  if (!isHeight(room.height)) return false;
  if (room.ceiling == null) return true;
  const { type, high, direction: direction2 } = room.ceiling;
  return (type === "slope" || type === "gable") && isHeight(high) && high > room.height && ceilingDirections.includes(direction2) && (type !== "gable" || direction2.endsWith("+"));
}
function ceilingProfile(room) {
  const ceiling2 = activeCeiling(room);
  if (!ceiling2) return [[0, room.height], [1, room.height]];
  if (ceiling2.type === "gable") return [[0, room.height], [0.5, ceiling2.high], [1, room.height]];
  return ceiling2.direction.endsWith("+") ? [[0, room.height], [1, ceiling2.high]] : [[0, ceiling2.high], [1, room.height]];
}
function ceilingPosition(room, point3) {
  const alongX = activeCeiling(room)?.direction.startsWith("x");
  const position = alongX ? (point3.x - room.x) / room.width : (point3.y - room.y) / room.depth;
  return Math.max(0, Math.min(1, position));
}
function ceilingHeightAt(room, point3) {
  const ceiling2 = activeCeiling(room);
  if (!ceiling2) return room.height;
  const position = ceilingPosition(room, point3);
  const { type, direction: direction2, high } = ceiling2;
  const proportion = type === "gable" ? 1 - Math.abs(2 * position - 1) : direction2.endsWith("+") ? position : 1 - position;
  return Number((room.height + (high - room.height) * proportion).toFixed(6));
}
function ceilingPitch(room) {
  const ceiling2 = activeCeiling(room);
  if (!ceiling2) return 0;
  const span = ceiling2.direction.startsWith("x") ? room.width : room.depth;
  const run = ceiling2.type === "gable" ? span / 2 : span;
  return Math.atan2(ceiling2.high - room.height, run) * 180 / Math.PI;
}
var ceilingHeightLimits, ceilingTypes, ceilingDirections, isHeight, activeCeiling;
var init_floor_planner_ceiling = __esm({
  "src/js/floor-planner-ceiling.mjs"() {
    ceilingHeightLimits = [1, 12];
    ceilingTypes = ["flat", "slope", "gable"];
    ceilingDirections = ["x+", "x-", "y+", "y-"];
    isHeight = (height) => Number.isFinite(height) && height >= ceilingHeightLimits[0] && height <= ceilingHeightLimits[1];
    activeCeiling = (room) => validCeiling(room) ? room.ceiling : null;
  }
});

// src/js/floor-planner-furniture.mjs
function furnitureAt(kind, name, { x, y }, angle2 = 0) {
  const { width, depth, height, base, material } = furnitureCatalog[kind];
  return { kind, name, x, y, angle: angle2, width, depth, height, base, material };
}
function furnitureParts(item) {
  return shapeParts[furnitureCatalog[item.kind].shape].map(([x, y, w, d, base, height, surface]) => ({
    x: (x - 0.5) * item.width,
    y: (y - 0.5) * item.depth,
    w: w * item.width,
    d: d * item.depth,
    low: item.base + base * item.height,
    high: item.base + (base + height) * item.height,
    surface
  }));
}
function furnitureProjection(item) {
  const radians = item.angle * Math.PI / 180;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  return ([x, y]) => [item.x + x * cos - y * sin, item.y + x * sin + y * cos];
}
function furnitureFootprint(item) {
  const x = item.width / 2, y = item.depth / 2;
  return [[-x, -y], [x, -y], [x, y], [-x, y]].map(furnitureProjection(item));
}
function withFurniture(plan2, labels) {
  if (plan2.furniture !== void 0) return plan2;
  const ids = new Set([...plan2.rooms, ...plan2.walls, ...plan2.doors, ...plan2.sensors].map((item) => item.id));
  let serial = 0;
  const furniture = plan2.rooms.flatMap((room) => {
    const items = Object.hasOwn(sample, room.id) ? sample[room.id] : [];
    return items.filter(([, x, y]) => x < room.width && y < room.depth && room.x + x <= 100 && room.y + y <= 100).map(([kind, x, y, angle2 = 0, width, depth, height]) => {
      let id;
      do {
        id = "furniture-example-" + ++serial;
      } while (ids.has(id));
      const item = furnitureAt(kind, labels[kind], { x: room.x + x, y: room.y + y }, angle2);
      return { id, ...item, width: width ?? item.width, depth: depth ?? item.depth, height: height ?? item.height };
    });
  });
  return { ...plan2, furniture };
}
function exampleFloor(room) {
  if (["living", "bedroom", "office", "main-bedroom", "child-bedroom", "study"].includes(room.id)) return "boards";
  if (["kitchen", "hall", "landing", "bathroom"].includes(room.id)) return "tiles";
  return "";
}
var entries, furnitureCatalog, furnitureCategories, furnitureMaterials, maxFurniture, shapeParts, sample, windows, exampleWindows;
var init_floor_planner_furniture = __esm({
  "src/js/floor-planner-furniture.mjs"() {
    entries = {
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
    furnitureCatalog = Object.fromEntries(Object.entries(entries).flatMap(([category2, models]) => Object.entries(models).map(([kind, [width, depth, height, material, shape, base = 0]]) => [kind, { category: category2, width, depth, height, material, shape, base }])));
    furnitureCategories = Object.keys(entries);
    furnitureMaterials = ["wood", "textile", "metal", "glass", "stone", "plastic", "mixed", "ignore"];
    maxFurniture = 160;
    shapeParts = {
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
    sample = {
      living: [
        ["sofa", 0.57, 2.12, 270, 2.64, 0.88],
        ["coffee", 2.05, 2.1, 90, 1.24, 0.68],
        ["rug", 2.26, 2.13, 0, 3.35, 2.7],
        ["cabinet", 4.85, 0.31, 0, 2.12, 0.44, 0.52],
        ["armchair", 3.85, 2.76, 110]
      ],
      kitchen: [
        ["island", 2, 0.43, 0, 3.8, 0.62],
        ["island", 3.59, 1.43, 90, 1.38, 0.62],
        ["dining", 2.03, 3.03],
        ["chair", 2.03, 2.3, 0],
        ["chair", 2.03, 3.76, 180]
      ],
      office: [
        ["desk", 1.25, 0.49, 0, 1.8, 0.7],
        ["chair", 1.25, 1.15, 180],
        ["cabinet", 2.5, 3.15, 0, 0.95, 0.6, 1.35]
      ],
      hall: [["nightstand", 0.29, 2.25, 90, 1.04, 0.4, 0.36]],
      bedroom: [["bed", 1.75, 1.16, 0, 1.6, 2.14], ["nightstand", 0.63, 0.38], ["nightstand", 2.87, 0.38]],
      "main-bedroom": [["bed", 2.2, 1.3, 0, 1.85, 2.12], ["nightstand", 0.97, 0.53], ["nightstand", 3.42, 0.53], ["wardrobe", 4.63, 1.8, 90]],
      "child-bedroom": [["bed", 3.97, 1.24, 0, 1.05, 2], ["desk", 1.3, 0.42], ["chair", 1.3, 1.13, 180], ["shelves", 0.32, 2.22, 90]],
      bathroom: [["bath", 1.25, 0.52], ["cabinet", 0.32, 2.22, 90, 1.08, 0.43, 0.86], ["washer", 2.92, 0.48]],
      study: [["desk", 1.74, 0.49], ["chair", 1.74, 1.38, 180], ["shelves", 3.15, 1.64, 90], ["armchair", 2.08, 2.76, 172]]
    };
    windows = {
      living: [[0.13, 0, 0.42, 0], [0.54, 0, 0.82, 0]],
      kitchen: [[0.17, 0, 0.64, 0]],
      office: [[0, 0.39, 0, 0.74]],
      bedroom: [[0.3, 1, 0.76, 1]],
      "main-bedroom": [[0.13, 0, 0.36, 0], [0.61, 0, 0.83, 0]],
      "child-bedroom": [[0.21, 0, 0.65, 0]],
      bathroom: [[0, 0.2, 0, 0.43]],
      study: [[0.32, 1, 0.75, 1]]
    };
    exampleWindows = (room) => Object.hasOwn(windows, room.id) ? windows[room.id] : [];
  }
});

// src/js/floor-planner-underlay.mjs
function imagePart(from, to, least = smallestPart) {
  const x = share(Math.min(from.x, to.x)), y = share(Math.min(from.y, to.y));
  const width = share(Math.max(from.x, to.x)) - x, height = share(Math.max(from.y, to.y)) - y;
  return width > 0 && height > 0 && width >= least - rounding && height >= least - rounding ? { x, y, width, height } : null;
}
function usablePart(part, ratio) {
  return Boolean(part) && [part.x, part.y, part.width, part.height].every(Number.isFinite) && part.x >= 0 && part.y >= 0 && part.x + part.width <= 1 + rounding && part.y + part.height <= 1 + rounding && part.width >= smallestPart - rounding && part.height >= smallestPart - rounding && bound(ratio * part.width / part.height, 0.04, 25);
}
function validUnderlay(image) {
  return image && typeof image.data === "string" && image.data.length <= maxImageData && /^data:image\/jpeg;base64,[a-z\d+/]+={0,2}$/i.test(image.data) && bound(image.ratio, 0.04, 25) && bound(image.width, 0.5, 220) && bound(image.x, -250, 250) && bound(image.y, -250, 250) && bound(image.opacity, 10, 85) && (image.roomTransparency === void 0 || bound(image.roomTransparency, 0, 100));
}
function underlayKind(file) {
  if (!file || file.size > maxUnderlayFile) return null;
  if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) return "image";
  const unknown = !file.type || file.type === "application/octet-stream";
  return file.type === "application/pdf" || unknown && /\.pdf$/i.test(file.name ?? "") ? "pdf" : null;
}
function underlayFrom(source, width, height, part = wholeImage) {
  const left = part.x * width, top2 = part.y * height;
  const across = part.width * width, down = part.height * height;
  const ratio = across / down;
  const canvas2 = document.createElement("canvas");
  const context = canvas2.getContext("2d");
  let scale3 = Math.min(1, maxUnderlaySide / Math.max(across, down));
  let data;
  do {
    canvas2.width = Math.max(1, Math.round(across * scale3));
    canvas2.height = Math.max(1, Math.round(down * scale3));
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas2.width, canvas2.height);
    context.drawImage(source, left, top2, across, down, 0, 0, canvas2.width, canvas2.height);
    data = canvas2.toDataURL("image/jpeg", 0.82);
    scale3 *= 0.76;
  } while (data.length > maxImageData && canvas2.width > 100 && canvas2.height > 100);
  const result = { data, ratio, x: 0, y: 0, width: startingWidth, opacity: 45, roomTransparency: defaultRoomTransparency };
  if (!validUnderlay(result)) throw problem("size");
  return result;
}
async function loadUnderlay(file, choosePage = () => 1, choosePart = () => wholeImage) {
  const kind = underlayKind(file);
  if (!kind) throw problem("format");
  const chosen = async (picture, ratio) => {
    const part = await choosePart(picture, ratio);
    return part && (usablePart(part, ratio) ? part : wholeImage);
  };
  if (kind === "pdf") {
    const { openPdf } = await import("./pdf.js?v=9cb3ffdffd71");
    const pdf = await openPdf(await file.arrayBuffer());
    try {
      const page = pdf.pages > 1 ? await choosePage(pdf) : 1;
      if (!page) return null;
      const whole = await pdf.render(page, maxUnderlaySide);
      const part = await chosen(whole, whole.width / whole.height);
      if (!part) return null;
      const canvas2 = part === wholeImage ? whole : await pdf.render(page, maxUnderlaySide, part);
      return underlayFrom(canvas2, canvas2.width, canvas2.height);
    } finally {
      pdf.close();
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const part = await chosen(image, image.naturalWidth / image.naturalHeight);
    return part ? underlayFrom(image, image.naturalWidth, image.naturalHeight, part) : null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function underlayPixels(image) {
  const picture = new Image();
  picture.src = image.data;
  await picture.decode();
  const canvas2 = document.createElement("canvas");
  canvas2.width = picture.naturalWidth;
  canvas2.height = picture.naturalHeight;
  const context = canvas2.getContext("2d", { willReadFrequently: true });
  context.drawImage(picture, 0, 0);
  return context.getImageData(0, 0, canvas2.width, canvas2.height);
}
function calibrateUnderlay(image, start3, length, actual) {
  const scale3 = actual / length;
  const next = {
    ...image,
    width: image.width * scale3,
    x: start3.x + (image.x - start3.x) * scale3,
    y: start3.y + (image.y - start3.y) * scale3
  };
  return validUnderlay(next) ? next : null;
}
var bound, maxImageData, startingWidth, maxUnderlayFile, maxUnderlaySide, defaultRoomTransparency, roomTransparency, wholeImage, smallestPart, rounding, share, movedPart, problem, underlayMessage;
var init_floor_planner_underlay = __esm({
  "src/js/floor-planner-underlay.mjs"() {
    bound = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
    maxImageData = 32e4;
    startingWidth = 10;
    maxUnderlayFile = 12e6;
    maxUnderlaySide = 1600;
    defaultRoomTransparency = 60;
    roomTransparency = (image) => image?.roomTransparency ?? defaultRoomTransparency;
    wholeImage = Object.freeze({ x: 0, y: 0, width: 1, height: 1 });
    smallestPart = 0.05;
    rounding = 1e-9;
    share = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
    movedPart = (part, dx, dy) => ({
      ...part,
      x: Math.min(1 - part.width, Math.max(0, part.x + dx)),
      y: Math.min(1 - part.height, Math.max(0, part.y + dy))
    });
    problem = (code) => Object.assign(new Error(`Underlay ${code}`), { code });
    underlayMessage = (error) => ({ password: "underlay_pdf_password", pdf: "underlay_pdf_error" })[error?.code] ?? "underlay_error";
  }
});

// src/js/floor-planner-model.mjs
function installationsFor(model) {
  if (model === "wallsense") return ["wall-recessed"];
  if (devices[model]?.mount === "ceiling") return ["ceilsense-mini", "ceilsense-pro"].includes(model) ? ["ceiling-recessed", "ceiling-surface"] : ["ceiling-recessed"];
  return ["ultimatesensor-v2", "ultimatesensor-mini-v2"].includes(model) ? ["freestanding", "wall-bracket"] : ["freestanding"];
}
function sameSensorPlacement(a, b) {
  return a.model === b.model && a.radar === b.radar && a.angle === b.angle && installationFor(a) === installationFor(b) && (a.levelMountRoom ?? null) === (b.levelMountRoom ?? null) && Math.abs((a.mountHeight ?? 1.4) - (b.mountHeight ?? 1.4)) < 0.02 && (a.tilt ?? 0) === (b.tilt ?? 0) && Math.hypot(a.x - b.x, a.y - b.y) < 0.08;
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
function wallVector(angle2) {
  const radians = angle2 * Math.PI / 180;
  return { x: Math.sin(radians), y: -Math.cos(radians) };
}
function roomForDevice(rooms, item) {
  const facing = wallVector(item.angle);
  const point3 = devices[item.model].mount === "wall" ? { x: item.x + facing.x * 0.08, y: item.y + facing.y * 0.08 } : item;
  return rooms.find((room) => contains(room, point3));
}
function ceilingCoverageStatus(room, item) {
  if (!room) return "missing";
  if (room.ceiling && item.levelMountRoom !== room.id) return "tilted";
  return supportedMounting(item.radar, ceilingHeightAt(room, item)) ? "reference" : "height";
}
function readDemo(search) {
  const query = new URLSearchParams(search);
  const room = { width: Number(query.get("width")), depth: Number(query.get("depth")), height: Number(query.get("height")) };
  const radar = query.get("radar");
  if (!validRoomDimensions(room) || !plannerRadars.includes(radar)) return null;
  return query.get("obstacles") === "1" ? { ...room, radar, obstacles: true } : { ...room, radar };
}
function validPlan(plan2) {
  if (!plan2 || ![1, 2, 3].includes(plan2.version) || !validName(plan2.name)) return false;
  if (plan2.underlay !== void 0 && !validUnderlay(plan2.underlay)) return false;
  if (!list(plan2.rooms, (item) => point(item) && validName(item.name) && validRoomDimensions(item) && validFinish(item) && (item.useSampleName === void 0 || typeof item.useSampleName === "boolean") && (item.outline === void 0 || plan2.version >= 2 && validRoomOutline(item)) && (item.obstacles === void 0 || typeof item.obstacles === "boolean") && (item.priority == null || numberBetween(item.priority.x, 0.05, 0.95) && numberBetween(item.priority.y, 0.05, 0.95)))) return false;
  if (!list(plan2.walls, (item) => point(item) && point({ x: item.endX, y: item.endY }) && (item.x !== item.endX || item.y !== item.endY))) return false;
  if (!list(plan2.doors, (item) => point(item) && angle(item.angle) && numberBetween(item.width, 0.5, 2) && (item.closed === void 0 || typeof item.closed === "boolean"))) return false;
  if (!list(plan2.sensors, (item) => point(item) && angle(item.angle) && Object.hasOwn(devices, item.model) && validSensorRadar(item) && (item.installation === void 0 || installationsFor(item.model).includes(item.installation)) && (item.climate === void 0 || item.model === "ceilsense-v2" && typeof item.climate === "boolean") && (item.mountHeight === void 0 || devices[item.model].mount === "wall" && numberBetween(item.mountHeight, 0.15, 6)) && (item.tilt === void 0 || devices[item.model].mount === "wall" && numberBetween(item.tilt, sensorTilt.min, sensorTilt.max)) && (item.pan === void 0 || devices[item.model].mount === "wall" && numberBetween(item.pan, -sensorPan, sensorPan)) && (item.levelMountRoom == null || plan2.rooms.some((room) => room.id === item.levelMountRoom && room.ceiling)))) return false;
  if (plan2.furniture !== void 0 && !list(plan2.furniture, (item) => point(item) && angle(item.angle) && validName(item.name) && Object.hasOwn(furnitureCatalog, item.kind) && furnitureMaterials.includes(item.material) && numberBetween(item.width, 0.02, 12) && numberBetween(item.depth, 0.02, 12) && numberBetween(item.height, 0.01, 6) && numberBetween(item.base, 0, 6), maxFurniture)) return false;
  const roomIds = new Set(plan2.rooms.map((room) => room.id));
  for (const key of ["windows", "mirrors"]) {
    if (plan2[key] !== void 0 && (plan2.version !== 3 || !list(plan2[key], (item) => point(item) && angle(item.angle) && roomIds.has(item.roomId) && numberBetween(item.width, 0.1, 8) && numberBetween(item.height, 0.1, 6) && numberBetween(item.base, 0, 6) && (key !== "mirrors" || validMirrorProtection(item))))) return false;
  }
  const sensorIds = new Set(plan2.sensors.map((sensor) => sensor.id));
  if (plan2.zones !== void 0 && (plan2.version !== 3 || !list(plan2.zones, (zone) => {
    if (!roomIds.has(zone.roomId) || !validName(zone.name) || !zoneTypes.includes(zone.type) || zone.direction !== void 0 && !["left", "right"].includes(zone.direction) || zone.sensorId != null && !sensorIds.has(zone.sensorId) || !Array.isArray(zone.parts) || !zone.parts.length || zone.parts.length > 12) return false;
    const room = plan2.rooms.find((room2) => room2.id === zone.roomId);
    return zone.parts.every((part) => Array.isArray(part) && part.length >= 2 && part.length <= 64 && part.every((p) => Array.isArray(p) && p.length === 2 && point({ x: p[0], y: p[1] }) && contains(room, { x: p[0], y: p[1] })) && (zone.type === "entry" ? part.length === 2 && Math.hypot(part[1][0] - part[0][0], part[1][1] - part[0][1]) >= 0.1 : Boolean(outlineBounds(part, { minSpan: 0.1, minArea: 0.025 }))) && part.every(([x, y], i) => {
      if (zone.type === "entry" && i === 1) return true;
      const [endX, endY] = part[(i + 1) % part.length];
      return !room.outline || roomContainsLine(room, { x, y }, { x: endX, y: endY });
    }));
  }))) return false;
  const items = ["rooms", "walls", "doors", "sensors", "furniture", "windows", "mirrors", "zones"].flatMap((key) => plan2[key] ?? []);
  return new Set(items.map((item) => item.id)).size === items.length;
}
function blankPlan(name) {
  return { version: 1, name, rooms: [], walls: [], doors: [], sensors: [] };
}
function demoPlan(room, names) {
  const plan2 = blankPlan(names.demo);
  plan2.rooms.push({ id: "demo-room", name: names.room, x: 0, y: 0, width: room.width, depth: room.depth, height: room.height, obstacles: room.obstacles ?? false, priority: room.priority ?? null });
  const positions = room.positions ?? [{ x: 0.5, y: 0.5, rotated: false }];
  plan2.sensors = positions.map(({ x, y, rotated }, index) => ({
    id: "demo-ceil-" + (index + 1),
    model: "ceilsense-v2",
    radar: room.radar,
    x: x * room.width,
    y: y * room.depth,
    angle: rotated ? 90 : 0
  }));
  return plan2;
}
function samplePlan(names) {
  const plan2 = blankPlan(names.sample);
  plan2.rooms = sampleRooms(sampleRoomLayout, names);
  plan2.rooms.find((room) => room.id === "bedroom").ceiling = { type: "gable", high: 3.8, direction: "x+" };
  plan2.doors = sampleDoors([
    [6.5, 1.8, 90],
    [5.35, 4.5, 0],
    [4, 5.9, 270],
    [7, 5.85, 90],
    [4.25, 8, 0]
  ], "door-");
  plan2.sensors = [
    ["ceil-living", "ceilsense-v2", "combined", 3, 2.5, 0],
    ["ceil-kitchen", "ceilsense-mini", "ld2460", 8.75, 2.5, 90],
    ["us-office", "ultimatesensor-v2", "ld2450", 2.5, 7.5, 0],
    ["wall-hall", "wallsense", "ld2450", 4, 6, 90],
    ["ceil-pro-living", "ceilsense-pro", "ld2412", 4.7, 1.15, 0]
  ].map(([id, model, radar, x, y, angle2]) => ({ id, model, radar, x, y, angle: angle2 }));
  plan2.sensors.find((sensor) => sensor.id === "us-office").installation = "freestanding";
  plan2.sensors.find((sensor) => sensor.id === "wall-hall").installation = "wall-recessed";
  return plan2;
}
function sampleUpperPlan(names) {
  const plan2 = blankPlan(names.sample);
  plan2.rooms = sampleRooms(upperRoomLayout, names);
  plan2.doors = sampleDoors([[4.05, 4.5, 0], [5.8, 4.5, 0], [4, 6.25, 270], [7, 5.55, 90]], "upper-door-");
  plan2.sensors = [
    { id: "upper-bedroom", model: "ceilsense-v2", radar: "combined", x: 2.55, y: 2.65, angle: 0 },
    { id: "upper-landing", model: "ceilsense-mini", radar: "ld2412", x: 5.25, y: 5.5, angle: 0 },
    { id: "upper-study", model: "ultimatesensor-mini-v2", radar: "ld2460", x: 9.7, y: 7.7, angle: 0, installation: "freestanding" }
  ];
  return plan2;
}
function hasInteriorWall(room, walls) {
  if (room.outline) return walls.some((wall2) => roomLineSpans(room, wall2, { x: wall2.endX, y: wall2.endY }, false).length > 0);
  const margin2 = 1e-3;
  return walls.some((wall2) => {
    const x0 = room.x + margin2;
    const y0 = room.y + margin2;
    const x1 = room.x + room.width - margin2;
    const y1 = room.y + room.depth - margin2;
    const dx = wall2.endX - wall2.x;
    const dy = wall2.endY - wall2.y;
    let start3 = 0;
    let end2 = 1;
    for (const [p, q] of [[-dx, wall2.x - x0], [dx, x1 - wall2.x], [-dy, wall2.y - y0], [dy, y1 - wall2.y]]) {
      if (p === 0 && q < 0) return false;
      if (p < 0) start3 = Math.max(start3, q / p);
      if (p > 0) end2 = Math.min(end2, q / p);
    }
    return start3 < end2;
  });
}
function guidePlanForRoom(plan2, room, limit = 3) {
  if (room?.outline) return { reason: "shape" };
  if (room?.ceiling) return { reason: "ceiling" };
  if (!room || !validRoom(room)) return { reason: "dimensions" };
  const sensors = plan2.sensors.filter((item) => item.model === "ceilsense-v2" && roomForDevice(plan2.rooms, item)?.id === room.id);
  if (!sensors.length || sensors.length > limit) return { reason: "quantity" };
  const radar = sensors[0].radar;
  if (!plannerRadars.includes(radar) || sensors.some((item) => item.radar !== radar)) return { reason: "radars" };
  if (sensors.some((item) => item.angle % 90 !== 0)) return { reason: "angles" };
  return {
    width: room.width,
    depth: room.depth,
    height: room.height,
    radar,
    obstacles: Boolean(room.obstacles) || hasInteriorWall(room, plan2.walls) || (plan2.furniture ?? []).some((item) => item.material !== "ignore" && item.base + item.height >= 1 && contains(room, item)),
    count: sensors.length,
    priority: room.priority ?? null,
    positions: sensors.map((item) => ({
      x: (item.x - room.x) / room.width,
      y: (item.y - room.y) / room.depth,
      rotated: item.angle % 180 === 90
    }))
  };
}
var devices, sensorTilt, sensorPan, hasMotionSensor, canAimSensor, installationFor, radarNames, newId, snap, contains, ceilingReferenceRange, numberBetween, validRoomDimensions, point, angle, validName, validMirrorProtection, list, floorFinishes, wallColors, validFinish, zoneTypes, sampleRoomLayout, upperRoomLayout, sampleRoomIds, sampleRooms, sampleDoors;
var init_floor_planner_model = __esm({
  "src/js/floor-planner-model.mjs"() {
    init_ceilsense_room_model();
    init_floor_planner_ceiling();
    init_floor_planner_furniture();
    init_floor_planner_geometry();
    init_floor_planner_underlay();
    devices = {
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
    sensorTilt = { min: -30, max: 75 };
    sensorPan = 85;
    hasMotionSensor = (model) => model === "ultimatesensor-v2";
    canAimSensor = (item) => devices[item.model]?.mount === "wall" && item.model !== "wallsense";
    installationFor = (item) => item.installation ?? installationsFor(item.model)[0];
    radarNames = {
      none: "-",
      ld2412: "LD2412",
      ld2450: "LD2412 + LD2450",
      ld2460: "LD2460",
      ld6002b: "LD6002B",
      combined: "LD2412 + LD6002B"
    };
    newId = () => {
      const cryptoApi = globalThis.crypto;
      if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
      const bytes = new Uint8Array(16);
      if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
      else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
      bytes[6] = bytes[6] & 15 | 64;
      bytes[8] = bytes[8] & 63 | 128;
      return [...bytes].map((value, index) => `${[4, 6, 8, 10].includes(index) ? "-" : ""}${value.toString(16).padStart(2, "0")}`).join("");
    };
    snap = (value) => Math.round(value * 4) / 4;
    contains = roomContains;
    ceilingReferenceRange = mountingRange;
    numberBetween = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
    validRoomDimensions = (room) => numberBetween(room.width, 0.5, 60) && numberBetween(room.depth, 0.5, 60) && validCeiling(room);
    point = (value) => value && numberBetween(value.x, -100, 100) && numberBetween(value.y, -100, 100);
    angle = (value) => Number.isFinite(value) && value >= 0 && value < 360;
    validName = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 48;
    validMirrorProtection = (item) => (item.protectionEnabled === void 0 || typeof item.protectionEnabled === "boolean") && (item.reflectionDepthM === void 0 || numberBetween(item.reflectionDepthM, 0.25, 6));
    list = (value, check, maximum = 80) => Array.isArray(value) && value.length <= maximum && value.every((item) => item && typeof item.id === "string" && /^[a-z\d-]{1,48}$/i.test(item.id) && check(item));
    floorFinishes = ["boards", "tiles", "carpet", "concrete", "plain"];
    wallColors = ["white", "sand", "sage", "blue", "clay", "grey"];
    validFinish = (room) => (room.floorFinish === void 0 || floorFinishes.includes(room.floorFinish)) && (room.wallColor === void 0 || wallColors.includes(room.wallColor));
    zoneTypes = ["detection", "exclusion", "entry", "interference"];
    sampleRoomLayout = [
      ["living", 0, 0, 6.5, 4.5],
      ["kitchen", 6.5, 0, 4, 4.5],
      ["office", 0, 4.5, 4, 3.5],
      ["hall", 4, 4.5, 3, 3.5],
      ["bedroom", 7, 4.5, 3.5, 3.5]
    ];
    upperRoomLayout = [
      ["main-bedroom", 0, 0, 5, 4.5],
      ["child-bedroom", 5, 0, 5.5, 4.5],
      ["bathroom", 0, 4.5, 4, 3.5],
      ["landing", 4, 4.5, 3, 3.5],
      ["study", 7, 4.5, 3.5, 3.5]
    ];
    sampleRoomIds = new Set([...sampleRoomLayout, ...upperRoomLayout].map(([id]) => id));
    sampleRooms = (layout2, names) => layout2.map(([id, x, y, width, depth]) => ({
      id,
      name: names[id],
      useSampleName: true,
      x,
      y,
      width,
      depth,
      height: 2.7
    }));
    sampleDoors = (layout2, prefix) => layout2.map(([x, y, angle2], index) => ({ id: prefix + index, x, y, angle: angle2, width: 0.9 }));
  }
});

// src/css/floor-planner.css
var init_floor_planner = __esm({
  "src/css/floor-planner.css"() {
  }
});

// src/js/ceilsense-planner.js
function formatPlannerLink({ width, depth, height, radar, obstacles, count, priority, positions }) {
  const pair = ({ x, y }) => [x, y].map((value) => Number(value.toFixed(4)));
  const points = positions.flatMap((position) => [...pair(position), Number(Boolean(position.rotated))]);
  return "cs-room=" + [
    "v3",
    width,
    depth,
    height,
    radar,
    Number(Boolean(obstacles)),
    count,
    ...pair(priority || { x: 0, y: 0 }),
    ...points
  ].join(",");
}
function parsePlannerLink(hash) {
  if (!hash.startsWith("#cs-room=") || hash.length > 180) return null;
  const [version, width, depth, height, radar, obstacles, choice2, ...layout2] = hash.slice(9).split(",");
  if (version !== "v3" && version !== "v2") return null;
  const legacy = version === "v2";
  const [oldRotation, px, py, ...points] = legacy ? layout2 : [null, ...layout2];
  const stride = legacy ? 2 : 3;
  const room = { width: Number(width), depth: Number(depth), height: Number(height) };
  const count = Number(choice2);
  const validPoint = (value) => Number(value) >= 0.05 && Number(value) <= 0.95;
  const priority = px === "0" && py === "0" ? null : { x: Number(px), y: Number(py) };
  if (!validRoom(room) || !plannerRadars.includes(radar) || !["0", "1"].includes(obstacles) || legacy && !["0", "1"].includes(oldRotation) || ![0, 1, 2, 3].includes(count) || ![1, 2, 3].includes(points.length / stride) || count && points.length !== count * stride || priority && ![px, py].every(validPoint)) return null;
  const positions = [];
  for (let i = 0; i < points.length; i += stride) {
    const [x, y, rotated] = points.slice(i, i + stride);
    if (![x, y].every((value) => value?.trim() && Number(value) >= 0 && Number(value) <= 1) || !legacy && !["0", "1"].includes(rotated)) return null;
    positions.push({ x: Number(x), y: Number(y), rotated: (legacy ? oldRotation : rotated) === "1" });
  }
  return { ...room, radar, obstacles: obstacles === "1", count, priority, positions };
}
var init_ceilsense_planner = __esm({
  "src/js/ceilsense-planner.js"() {
    init_ceilsense_room_model();
  }
});

// src/js/wall-radar-profiles.mjs
var derate, wallPresence, wallMotion, wallTrackers;
var init_wall_radar_profiles = __esm({
  "src/js/wall-radar-profiles.mjs"() {
    derate = 0.8;
    wallPresence = { half: 75, pitch: 75, range: 9 * derate };
    wallMotion = { half: 51, pitch: 46, range: 12 * derate };
    wallTrackers = {
      ld2450: { half: 60, pitch: 35, range: 6 * derate, still: 6 * derate, max: 3, maxStill: 3 },
      ld2460: { half: 60, pitch: 45, range: 6 * derate, still: 5 * derate, max: 5, maxStill: 3 }
    };
  }
});

// src/js/floor-planner-radar.mjs
function beamSector({ half, range }) {
  const radians = half * degree;
  const x = range * Math.sin(radians);
  const y = -range * Math.cos(radians);
  return `M0 0 ${-x} ${y} A${range} ${range} 0 0 1 ${x} ${y}Z`;
}
function wallSector(field2) {
  if (field2.pitch === void 0) return beamSector(field2);
  const key = [field2.half, field2.pitch, field2.range, field2.mount, field2.tilt].join(" ");
  if (!footprints.has(key)) {
    if (footprints.size > 200) footprints.clear();
    footprints.set(key, footprint(field2));
  }
  return footprints.get(key);
}
function stretch(field2, angle2) {
  const spot = { x: 0, y: 0, angle: 0 };
  const step2 = 0.05;
  const covered = (distance4) => fieldCoversPoint(
    field2,
    spot,
    { x: distance4 * Math.sin(angle2), y: -distance4 * Math.cos(angle2) },
    "seated",
    standingHeight
  );
  let first = null, last = null;
  for (let distance4 = step2; distance4 <= field2.range + 1e-9; distance4 += step2) {
    if (!covered(distance4)) continue;
    first ??= distance4;
    last = distance4;
  }
  if (first === null) return null;
  const edge = (inside, outside) => {
    for (let round = 0; round < 8; round++) {
      const middle = (inside + outside) / 2;
      if (covered(middle)) inside = middle;
      else outside = middle;
    }
    return inside;
  };
  return [first <= step2 * 2 ? 0 : edge(first, first - step2), edge(last, Math.min(field2.range, last + step2))];
}
function wallReach2(field2) {
  if (field2.pitch === void 0) return { from: 0, to: field2.range };
  const reach2 = stretch(field2, 0);
  return reach2 && { from: reach2[0], to: reach2[1] };
}
function footprint(field2) {
  const turns = 40;
  const near = [], far = [];
  for (let turn = 0; turn <= turns; turn++) {
    const angle2 = (-field2.half + turn * 2 * field2.half / turns) * degree;
    const reach2 = stretch(field2, angle2);
    if (!reach2) continue;
    const at = (distance4) => [distance4 * Math.sin(angle2), -distance4 * Math.cos(angle2)];
    near.push(at(reach2[0]));
    far.push(at(reach2[1]));
  }
  if (!far.length) return "";
  const points = [...far, ...near.reverse()].map((point3) => point3.map((value) => Number(value.toFixed(3))).join(" ")).filter((point3, index, all) => point3 !== all[index - 1]);
  return `M${points.join("L")}Z`;
}
function motionField(item) {
  if (!hasMotionSensor(item.model)) return null;
  return { ...wallMotion, mount: item.mountHeight ?? wallMountHeight, tilt: item.tilt ?? 0, radar: "pir", mode: "motion", secondary: true };
}
function radarOrigin(item) {
  if (devices[item.model].mount === "ceiling") return item;
  const facing = wallVector(item.angle);
  return { x: item.x + facing.x * 0.08, y: item.y + facing.y * 0.08 };
}
function sensorMountHeight(item, room) {
  return devices[item.model].mount === "wall" ? item.mountHeight ?? wallMountHeight : room ? ceilingHeightAt(room, item) : 0;
}
function radarFields(room, item, { allowHeightEstimate = false } = {}) {
  if (!room || item.radar === "none") return [];
  if (devices[item.model].mount === "wall") {
    const aim = { mount: item.mountHeight ?? wallMountHeight, tilt: item.tilt ?? 0 };
    return [
      { ...wallPresence, ...aim, radar: "ld2412", mode: "presence", secondary: true },
      { ...wallTrackers[item.radar], ...aim, radar: item.radar, mode: "xy" }
    ];
  }
  if (!plannerRadars.includes(item.radar)) return [];
  const status = ceilingCoverageStatus(room, item);
  const height = ceilingHeightAt(room, item);
  const [minHeight, maxHeight] = roomLimits.height;
  const estimatedHeight = status === "height" && allowHeightEstimate && height >= minHeight && height <= maxHeight;
  if (status !== "reference" && !estimatedHeight) return [];
  const radars = item.radar === "combined" ? ["ld6002b", "ld2412"] : [item.radar];
  return radars.map((radar, index) => {
    const footprint2 = radarFootprint(radar, height);
    return {
      radii: footprint2.seated,
      profiles: radar === "ld2412" ? footprint2 : null,
      radar,
      mode: { ld2412: "presence", ld2460: "xy", ld6002b: "xyz" }[radar],
      secondary: index > 0,
      estimatedHeight
    };
  });
}
function fieldCoversPoint(field2, item, point3, profile2 = "seated", target = null) {
  const angle2 = item.angle * Math.PI / 180;
  const dx = point3.x - item.x;
  const dy = point3.y - item.y;
  const x = dx * Math.cos(angle2) + dy * Math.sin(angle2);
  const y = -dx * Math.sin(angle2) + dy * Math.cos(angle2);
  if (field2.radii) {
    const [rx, ry] = field2.profiles?.[profile2] ?? field2.radii;
    return (x / rx) ** 2 + (y / ry) ** 2 <= 1;
  }
  const distance4 = Math.hypot(x, y);
  if (target === null || field2.pitch === void 0) {
    return distance4 <= field2.range && (distance4 === 0 || Math.abs(Math.atan2(x, -y)) <= field2.half * degree);
  }
  const drop = (field2.mount ?? wallMountHeight) - target;
  const tilt = (field2.tilt ?? 0) * degree;
  const ahead = -y * Math.cos(tilt) + drop * Math.sin(tilt);
  const above = -y * Math.sin(tilt) - drop * Math.cos(tilt);
  return ahead > 0 && Math.hypot(distance4, drop) <= field2.range && Math.abs(Math.atan2(x, ahead)) <= field2.half * degree && Math.abs(Math.atan2(above, ahead)) <= field2.pitch * degree;
}
var ceilingProfiles, radarProfileFor, degree, wallMountHeight, standingHeight, footprints, radarHasLineOfSight;
var init_floor_planner_radar = __esm({
  "src/js/floor-planner-radar.mjs"() {
    init_ceilsense_room_model();
    init_floor_planner_ceiling();
    init_floor_planner_model();
    init_floor_planner_geometry();
    init_wall_radar_profiles();
    ceilingProfiles = ["seated", "standing", "moving"];
    radarProfileFor = (person) => person?.moving ? "moving" : person?.pose === "standing" ? "standing" : "seated";
    degree = Math.PI / 180;
    wallMountHeight = 1.4;
    standingHeight = 1.35;
    footprints = /* @__PURE__ */ new Map();
    radarHasLineOfSight = (room, item, point3) => !room.outline || roomContainsLine(room, radarOrigin(item), point3);
  }
});

// src/js/floor-planner-sight.mjs
function doorsHeldOpen(plan2, people) {
  const held = /* @__PURE__ */ new Set();
  doorsOnPlan(plan2).forEach((span, index) => {
    const door = plan2.doors[index];
    if (door.closed && people.some((person) => distanceToSpan(person, span) <= doorReach)) held.add(door.id);
  });
  return held;
}
function doorAt(plan2, point3, reach2 = 0.22) {
  const index = doorsOnPlan(plan2).findIndex((span) => distanceToSpan(point3, span) <= reach2);
  return index < 0 ? null : plan2.doors[index];
}
function prepareSight(plan2, held = null) {
  const doors = doorsOnPlan({ doors: (plan2.doors ?? []).filter((door) => !door.closed || held?.has(door.id)) });
  const edges = [
    ...plan2.rooms.flatMap((room) => polygonEdges(roomCorners(room))),
    ...(plan2.walls ?? []).map((wall2) => [[wall2.x, wall2.y], [wall2.endX, wall2.endY]])
  ];
  const walls = edges.flatMap(([a, b]) => wallSegments(a, b, doors, wallThickness)).filter(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-6);
  return { walls, doors };
}
function meets(from, to, [a, b]) {
  const rx = to.x - from.x, ry = to.y - from.y;
  const sx = b[0] - a[0], sy = b[1] - a[1];
  const turn = rx * sy - ry * sx;
  if (Math.abs(turn) < 1e-12) return null;
  const qx = a[0] - from.x, qy = a[1] - from.y;
  const along = (qx * ry - qy * rx) / turn;
  return along >= -1e-9 && along <= 1 + 1e-9 ? (qx * sy - qy * sx) / turn : null;
}
function sightBlocked(sight, from, to) {
  for (const wall2 of sight.walls) {
    const share2 = meets(from, to, wall2);
    if (share2 !== null && between(share2)) return true;
  }
  if (Math.max(from.z, to.z) <= doorHeight) return false;
  for (const door of sight.doors) {
    const share2 = meets(from, to, door);
    if (share2 !== null && between(share2) && from.z + (to.z - from.z) * share2 > doorHeight) return true;
  }
  return false;
}
function reach(sight, origin, angle2, height, target, range) {
  const to = { x: origin.x + Math.cos(angle2) * range, y: origin.y + Math.sin(angle2) * range };
  let limit = range;
  for (const wall2 of sight.walls) {
    const share2 = meets(origin, to, wall2);
    if (share2 !== null && share2 > 1e-9) limit = Math.min(limit, share2 * range);
  }
  if (height <= doorHeight) return limit;
  const widening = (height - target) / (height - doorHeight);
  let frame = Infinity;
  for (const door of sight.doors) {
    const share2 = meets(origin, to, door);
    if (share2 !== null && share2 > 1e-9 && share2 * range < limit) frame = Math.min(frame, share2 * range * widening);
  }
  return Math.min(limit, frame);
}
function sightPolygon(sight, origin, { height = 0, target = standingTarget, range = farAway } = {}) {
  const angles2 = /* @__PURE__ */ new Set();
  const add2 = (angle2) => angles2.add((angle2 % fullTurn + fullTurn) % fullTurn);
  for (let step2 = 0; step2 < 120; step2++) add2(step2 * fullTurn / 120);
  for (const stretch2 of [...sight.walls, ...sight.doors]) for (const [x, y] of stretch2) {
    const angle2 = Math.atan2(y - origin.y, x - origin.x);
    add2(angle2 - 1e-4);
    add2(angle2);
    add2(angle2 + 1e-4);
  }
  return [...angles2].sort((a, b) => a - b).map((angle2) => {
    const distance4 = reach(sight, origin, angle2, height, target, range);
    return [origin.x + Math.cos(angle2) * distance4, origin.y + Math.sin(angle2) * distance4];
  });
}
var doorHeight, doorReach, standingTarget, wallThickness, farAway, fullTurn, distanceToSpan, planWithOpenDoors, between, sightReach;
var init_floor_planner_sight = __esm({
  "src/js/floor-planner-sight.mjs"() {
    init_floor_planner_geometry();
    doorHeight = 2.1;
    doorReach = 0.75;
    standingTarget = 1.35;
    wallThickness = 0.3;
    farAway = 80;
    fullTurn = Math.PI * 2;
    distanceToSpan = (point3, [[ax, ay], [bx, by]]) => {
      const dx = bx - ax, dy = by - ay;
      const along = Math.min(1, Math.max(0, ((point3.x - ax) * dx + (point3.y - ay) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(point3.x - ax - dx * along, point3.y - ay - dy * along);
    };
    planWithOpenDoors = (plan2, held) => held?.size ? { ...plan2, doors: plan2.doors.map((door) => held.has(door.id) ? { ...door, closed: false } : door) } : plan2;
    between = (share2) => share2 > 1e-9 && share2 < 1 - 1e-9;
    sightReach = (sight, origin, angle2, { height = 0, target = standingTarget, range = farAway } = {}) => reach(sight, origin, angle2, height, target, range);
  }
});

// src/js/floor-planner-drawing.mjs
function paintRoomSurface(room, attributes = "", local = false) {
  if (!room.outline) return `<rect ${attributes} x="${local ? 0 : room.x}" y="${local ? 0 : room.y}" width="${room.width}" height="${room.depth}"/>`;
  const points = local ? room.outline : roomCorners(room);
  return `<polygon ${attributes} points="${points.map((point3) => point3.join(",")).join(" ")}"/>`;
}
function paintZone(item, project, active) {
  return `<g class="fp-plan-zone ${item.type}${active ? " selected" : ""}" data-item="${item.id}">
        ${item.parts.map((part) => {
    const entry = item.type === "entry";
    const shape = `<${entry ? "polyline" : "polygon"} points="${part.map(project).map((point3) => point3.join(",")).join(" ")}"/>`;
    if (!entry) return shape;
    const [[ax, ay], [bx, by]] = part;
    const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy);
    const x = (ax + bx) / 2, y = (ay + by) / 2;
    const side = item.direction === "left" ? -1 : 1;
    const normalX = -dy / length * side, normalY = dx / length * side;
    const arrow = [[x - normalX * 0.07, y - normalY * 0.07], [x + normalX * 0.23, y + normalY * 0.23]].map(project);
    const left = project([x + normalX * 0.13 + dx / length * 0.09, y + normalY * 0.13 + dy / length * 0.09]);
    const right = project([x + normalX * 0.13 - dx / length * 0.09, y + normalY * 0.13 - dy / length * 0.09]);
    return shape + `<path class="fp-entry-arrow" d="M${arrow[0].join(" ")}L${arrow[1].join(" ")}M${left.join(" ")}L${arrow[1].join(" ")}L${right.join(" ")}"/>`;
  }).join("")}
    </g>`;
}
function paintWindows(room) {
  if (room.outline) return "";
  return exampleWindows(room).map(([x, y, endX, endY]) => `<path class="fp-window" d="M${x * room.width} ${y * room.depth}L${endX * room.width} ${endY * room.depth}"/>`).join("");
}
function paintFurniture(item, selected2 = false, interactive = true) {
  const shape = furnitureParts(item).map((part) => `<rect class="fp-furniture-part" x="${part.x}" y="${part.y}" width="${part.w}" height="${part.d}"/>`).join("");
  return `<g class="fp-plan-furniture${selected2 ? " selected" : ""}" ${interactive ? `data-item="${item.id}" data-furniture-id="${item.id}"` : ""} data-material="${item.material}"
        transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
        <rect class="fp-furniture-hit" x="${-item.width / 2}" y="${-item.depth / 2}" width="${item.width}" height="${item.depth}"/>${shape}</g>`;
}
function coverage(item, room, isSelected, focus, radarOptions, sight, motion = false) {
  const fields = radarFields(room, item, radarOptions);
  if (!fields.length) return "";
  const lens = motion && room ? motionField(item) : null;
  const ceiling2 = devices[item.model].mount === "ceiling";
  const shape = fields.map((field2) => {
    const style = field2.secondary ? ' class="fp-secondary-range"' : "";
    if (!field2.radii) return `<path${style} d="${wallSector(field2)}"/>`;
    if (field2.profiles && focus?.item.id === item.id && focus.field.radar === field2.radar) {
      return [...ceilingProfiles].reverse().map((name) => {
        const [rx2, ry2] = field2.profiles[name];
        return `<ellipse class="fp-profile-rim${name === focus.profile ? " active" : ""}" data-profile="${name}" rx="${rx2}" ry="${ry2}"/>`;
      }).join("");
    }
    const [rx, ry] = field2.radii;
    return `<ellipse${style} rx="${rx}" ry="${ry}"/>`;
  }).join("");
  const clipId = "fp-sight-" + item.id;
  const seen = sightPolygon(sight, radarOrigin(item), { height: sensorMountHeight(item, room) });
  const clip = `<defs><clipPath id="${clipId}">
        <polygon points="${seen.map((point3) => point3.map((value) => Number(value.toFixed(3))).join(",")).join(" ")}"/>
    </clipPath></defs>`;
  return `${clip}<g class="fp-range ${ceiling2 ? "ceiling" : "wall"} ${isSelected ? "selected" : ""}"
        ${fields.some((field2) => field2.estimatedHeight) ? "data-height-estimate" : ""} clip-path="url(#${clipId})">
        <g transform="translate(${item.x} ${item.y}) rotate(${item.angle})">${shape}${lens ? `<path class="fp-motion-range" d="${wallSector(lens)}"/>` : ""}</g></g>`;
}
function paintPlacementPreview(plan2, item, radarOptions) {
  const room = roomForDevice(plan2.rooms, item);
  const mount = devices[item.model].mount;
  const marker = mount === "ceiling" ? '<circle r=".18"/>' : '<rect x="-.19" y="-.14" width=".38" height=".28" rx=".05"/>';
  return `<g class="fp-placement-preview">
        ${coverage({ ...item, id: "__placement_preview" }, room, true, null, radarOptions, prepareSight(plan2))}
        <g class="fp-placement-marker ${mount}" transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
            <circle r=".34" class="fp-placement-ring"/>${marker}<path d="M-.07 0H.07M0-.07V.07"/>
        </g>
    </g>`;
}
function ceilingMarks(room, number4, active) {
  if (!room.ceiling) return "";
  const { direction: direction2, type, high } = room.ceiling;
  const alongX = direction2.startsWith("x");
  const slopeSize = alongX ? room.width : room.depth;
  const crossSize = alongX ? room.depth : room.width;
  const center = crossSize / 2;
  const low = direction2.endsWith("+") ? 0.2 * slopeSize : 0.8 * slopeSize;
  const top2 = type === "gable" ? slopeSize / 2 : slopeSize - low;
  const path2 = alongX ? `M${low} ${center}H${top2}` : `M${center} ${low}V${top2}`;
  const labels = alongX ? [[low, center + 0.24], [top2, center - 0.1]] : [[center + 0.12, low], [center + 0.12, top2]];
  const ridge = type !== "gable" ? "" : alongX ? `M${top2} 0V${crossSize}` : `M0 ${top2}H${crossSize}`;
  const sideMarks = alongX ? [[0.13, center - 0.14], [room.width - 0.13, center - 0.14]] : [[center - 0.16, 0.24], [center - 0.16, room.depth - 0.13]];
  return `<g class="fp-ceiling-marks${active ? " active" : ""}">
        ${active ? sideMarks.map(([x, y], index) => `<text x="${x}" y="${y}" text-anchor="middle">${index ? "B" : "A"}</text>`).join("") : ""}
        ${ridge ? `<path d="${ridge}"/>` : ""}
        <path class="fp-slope-arrow" d="${path2}" marker-end="url(#fp-slope-tip)"/>
        ${labels.map(([x, y], index) => `<text x="${x}" y="${y}" text-anchor="middle">${number4.format(index === 0 ? room.height : high)} m</text>`).join("")}
    </g>`;
}
function ceilingMask(rooms, sensors, heightTagSensor) {
  const x = Math.min(...rooms.map((room) => room.x)) - 1;
  const y = Math.min(...rooms.map((room) => room.y)) - 1;
  const width = Math.max(...rooms.map((room) => room.x + room.width)) - x + 1;
  const height = Math.max(...rooms.map((room) => room.y + room.depth)) - y + 1;
  const sensorsCutout = sensors.map((item) => `<g transform="translate(${item.x} ${item.y})" fill="black">
        <circle r=".39"/>
        <rect class="fp-number-cutout" x=".29" y="-.19" width=".39" height=".34"/>
        ${item === heightTagSensor ? `<rect class="fp-height-cutout" x="${heightTag.x - 0.06}" y="${heightTag.y - 0.06}"
                width="${heightTag.width + 0.12}" height="${heightTag.height + 0.12}"/>` : ""}
    </g>`).join("");
  const labelsCutout = rooms.filter((room) => room.outline).map((room) => {
    const label = roomLabelPosition(room);
    const width2 = Math.min(room.width, Math.min(24, room.name.length) * 0.15 + 0.45);
    return `<rect x="${label.x - width2 / 2}" y="${label.y - 0.27}" width="${width2}" height=".66" fill="black"/>`;
  }).join("");
  return `<mask id="fp-slope-clearance" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"
        x="${x}" y="${y}" width="${width}" height="${height}">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white"/>${sensorsCutout}${labelsCutout}
    </mask>`;
}
function paintPlan(plan2, showCoverage2, selected2, number4, focus = null, { measures = false, interactiveSensors = false, radarOptions, casing = false, motion = false } = {}) {
  const selectedClass = (item) => selected2 === item.id ? " selected" : "";
  const activeSensor = plan2.sensors.find((item) => item.id === selected2);
  const activeRoom = plan2.rooms.find((room) => room.id === selected2) ?? (activeSensor && roomForDevice(plan2.rooms, activeSensor));
  const rooms = plan2.rooms.map((room) => `<g data-item="${room.id}" class="fp-room${selectedClass(room)}" transform="translate(${room.x} ${room.y})">
        ${casing ? paintRoomSurface(room, 'class="fp-room-casing"', true) : ""}
        ${paintRoomSurface(room, 'class="fp-room-floor"', true)}
        ${plan2.windows?.some((window2) => window2.roomId === room.id) ? "" : paintWindows(room)}
    </g>`).join("");
  const roomLabels = plan2.rooms.map((room) => {
    const measures2 = room.outline ? `${number4.format(roomArea(room))} m²` : `${number4.format(room.width)} × ${number4.format(room.depth)} m`;
    const label = room.outline ? roomLabelPosition(room) : null;
    const name = room.name.length > 24 && label ? room.name.slice(0, 23) + "..." : room.name;
    return `<g pointer-events="none" transform="translate(${room.x} ${room.y})">
            ${label ? `<g class="fp-room-label" text-anchor="middle" transform="translate(${label.x - room.x} ${label.y - room.y})">
                <text>${escapeText(name)}</text><text class="fp-room-size" y=".28">${measures2}</text>
            </g>` : `<svg class="fp-room-label" x=".23" y=".17" width="${room.width - 0.31}" height="1.5" overflow="hidden">
                <text y=".34">${escapeText(room.name)}</text>
                <text class="fp-room-size" y=".64">${measures2}</text>
            </svg>`}
        </g>`;
  }).join("");
  const ceilingRooms = plan2.rooms.filter((room) => room.ceiling);
  const heightTagSensor = activeRoom?.ceiling && activeSensor && devices[activeSensor.model].mount === "ceiling" ? activeSensor : null;
  const slopeMask = ceilingRooms.length && (plan2.sensors.length || ceilingRooms.some((room) => room.outline)) ? ceilingMask(ceilingRooms, plan2.sensors, heightTagSensor) : "";
  const marks = ceilingRooms.map((room) => `<g${room.outline ? ` clip-path="url(#clip-${room.id})"` : ""}>
        <g transform="translate(${room.x} ${room.y})">${ceilingMarks(room, number4, room.id === activeRoom?.id)}</g>
    </g>`).join("");
  const ceilingLayer = marks ? `<g${slopeMask ? ' mask="url(#fp-slope-clearance)"' : ""}>${marks}</g>` : "";
  const clips = plan2.rooms.map((room) => `<clipPath id="clip-${room.id}">${paintRoomSurface(room)}</clipPath>`).join("");
  const sight = showCoverage2 ? prepareSight(plan2) : null;
  const ranges = showCoverage2 ? plan2.sensors.map((item) => coverage(item, roomForDevice(plan2.rooms, item), selected2 === item.id, focus, radarOptions, sight, motion)).join("") : "";
  const outline = activeRoom && activeRoom.id === selected2 ? paintRoomSurface(activeRoom, 'class="fp-room-outline"') : "";
  const walls = plan2.walls.map((wall2) => `<g class="fp-wall${selectedClass(wall2)}" data-item="${wall2.id}">
        <line class="fp-wall-hit" x1="${wall2.x}" y1="${wall2.y}" x2="${wall2.endX}" y2="${wall2.endY}"/>
        <line x1="${wall2.x}" y1="${wall2.y}" x2="${wall2.endX}" y2="${wall2.endY}"/></g>`).join("");
  const doors = plan2.doors.map((door) => `<g data-item="${door.id}" class="fp-door${door.closed ? " closed" : ""}${selectedClass(door)}" transform="translate(${door.x} ${door.y}) rotate(${door.angle})">
        <path class="fp-door-gap" d="M0 0h${door.width}"/>
        ${door.closed ? `<path class="fp-door-shut" d="M0 0h${door.width}"/>` : `<path class="fp-door-swing" d="M0 -${door.width}a${door.width} ${door.width} 0 0 1 ${door.width} ${door.width}"/>
                <path class="fp-door-leaf" d="M0 0v-${door.width}"/>`}
        ${rectangle2(-0.12, -door.width - 0.12, door.width + 0.24, door.width + 0.24)}
    </g>`).join("");
  const sensors = plan2.sensors.map((item, index) => {
    const mount = devices[item.model].mount;
    const icon = mount === "ceiling" ? '<circle r=".2"/><circle class="fp-sensor-eye" r=".072"/>' : '<rect x="-.2" y="-.16" width=".4" height=".32" rx=".06"/><path d="M-.07 .025 0-.06.07 .025" fill="none"/>';
    const mountHeight = item === heightTagSensor ? `<g class="fp-sensor-height" transform="translate(${heightTag.x} ${heightTag.y})">
                <rect x="0" y="0" width="${heightTag.width}" height="${heightTag.height}" rx=".05"/>
                <text x=".4" y=".18" text-anchor="middle">${number4.format(ceilingHeightAt(activeRoom, item))} m</text>
            </g>` : "";
    return `<g data-item="${item.id}" class="fp-sensor ${mount}${selectedClass(item)}" transform="translate(${item.x} ${item.y})" ${interactiveSensors ? sensorMarkerAttributes(item, index) : ""}>
            <circle r=".34" class="fp-sensor-halo"/><g transform="rotate(${item.angle})">${icon}</g>
            ${interactiveSensors ? '<circle class="fp-sensor-focus" r=".39"/>' : ""}
            <text x=".36" y=".08">${String(index + 1).padStart(2, "0")}</text>${mountHeight}
        </g>`;
  }).join("");
  const furniture = (plan2.furniture ?? []).map((item) => paintFurniture(item, selected2 === item.id)).join("");
  const openings = ["windows", "mirrors"].flatMap((type) => (plan2[type] ?? []).map((item) => `<g class="fp-opening ${type}${selectedClass(item)}" data-item="${item.id}" transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
            <line class="fp-opening-hit" x2="${item.width}"/><line x2="${item.width}"/>
            <path d="M0 -.075v.15 M${item.width} -.075v.15"/></g>`)).join("");
  const dimensions2 = measures ? plan2.rooms.map((room) => polygonEdges(roomCorners(room)).map(([[ax, ay], [bx, by]]) => {
    const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy);
    const x = (ax + bx) / 2 - dy / length * 0.2, y = (ay + by) / 2 + dx / length * 0.2;
    const angle2 = Math.atan2(dy, dx) * 180 / Math.PI;
    const rotation = angle2 > 90 || angle2 < -90 ? angle2 + 180 : angle2;
    return length < 0.35 ? "" : `<text class="fp-wall-measure" x="${x}" y="${y}" transform="rotate(${rotation} ${x} ${y})">${number4.format(length)} m</text>`;
  }).join("")).join("") : "";
  const zones = (plan2.zones ?? []).map((item) => paintZone(item, (point3) => point3, selected2 === item.id)).join("");
  return `<defs>${clips}${slopeMask}<marker id="fp-slope-tip" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2 0 4Z" fill="#b4baff"/></marker></defs>${rooms}${furniture}${ranges}${zones}${ceilingLayer}${walls}${outline}${doors}${openings}${dimensions2}${roomLabels}${sensors}`;
}
var escapeText, rectangle2, heightTag, roomLabelPosition, sensorMarkerAttributes;
var init_floor_planner_drawing = __esm({
  "src/js/floor-planner-drawing.mjs"() {
    init_floor_planner_furniture();
    init_floor_planner_radar();
    init_floor_planner_model();
    init_floor_planner_geometry();
    init_floor_planner_sight();
    init_floor_planner_ceiling();
    escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
    rectangle2 = (x, y, width, depth, radius = 0) => `<rect x="${x}" y="${y}" width="${width}" height="${depth}" rx="${radius}"/>`;
    heightTag = { x: 0.27, y: -0.48, width: 0.8, height: 0.27 };
    roomLabelPosition = (room) => roomInteriorPoint(room, { x: room.x + room.width * 0.32, y: room.y + room.depth * 0.22 });
    sensorMarkerAttributes = (item, index) => `data-sensor-marker="" tabindex="0" role="button" aria-haspopup="dialog" aria-label="${String(index + 1).padStart(2, "0")} · ${devices[item.model].name}"`;
  }
});

// src/js/floor-planner-daylight.mjs
var presets, daylights, daylightFor;
var init_floor_planner_daylight = __esm({
  "src/js/floor-planner-daylight.mjs"() {
    presets = {
      studio: { sun: [-0.42, -0.43, 0.8], cast: [1, 0.83], dim: 0 },
      morning: { sun: [0.82, 0.2, 0.5], cast: [-1.55, -0.35], dim: 0.05 },
      midday: { sun: [0.12, 0.46, 0.88], cast: [-0.22, -0.6], dim: 0 },
      evening: { sun: [-0.8, 0.28, 0.46], cast: [1.6, -0.45], dim: 0.12 },
      night: { sun: [-0.3, -0.35, 0.89], cast: [0.45, 0.4], dim: 0.6 }
    };
    daylights = Object.keys(presets);
    daylightFor = (name) => presets[name] ?? presets.studio;
  }
});

// src/js/floor-planner-device-mesh.mjs
function axes(angle2, tilt) {
  const { x, y } = wallVector(angle2);
  const cos = Math.cos(tilt * degree2), sin = Math.sin(tilt * degree2);
  return { side: [-y, x, 0], ahead: [x * cos, y * cos, -sin], up: [x * sin, y * sin, cos] };
}
function housingFaces(width, height, depth) {
  const w = width / 2, d = depth / 2, h = height / 2, radius = Math.min(width, depth) * rounding2;
  const ring2 = [[1, -1, -90], [1, 1, 0], [-1, 1, 90], [-1, -1, 180]].flatMap(([s, f, from]) => [0, 1, 2, 3].map((step2) => {
    const turn = (from + step2 * 30) * degree2;
    return [s * (w - radius) + Math.cos(turn) * radius, f * (d - radius) + Math.sin(turn) * radius];
  }));
  const sides = ring2.map(([s, f], index) => {
    const [nextS, nextF] = ring2[(index + 1) % ring2.length];
    return { normal: [nextF - f, s - nextS, 0], corners: [[s, f, -h], [nextS, nextF, -h], [nextS, nextF, h], [s, f, h]] };
  });
  return [
    ...sides,
    { normal: [0, 0, 1], corners: ring2.map(([s, f]) => [s, f, h]), lid: true },
    { normal: [0, 0, -1], corners: ring2.map(([s, f]) => [s, f, -h]).reverse(), lid: true }
  ];
}
function frontShapes({ width: w, height: h, depth, front }, fine) {
  const flat = w / 2 - Math.min(w, depth) * rounding2;
  if (front === "plate") {
    const plate = 0.055 * deviceScale / 2;
    return [
      [band(-plate, plate, -plate, plate), [250, 250, 251]],
      [disc(0, -plate * 0.12, plate * 0.46), [236, 239, 242]],
      [band(-plate * 0.2, plate * 0.2, plate * 0.62, plate * 0.74), [92, 62, 66]]
    ];
  }
  const low = -h / 2;
  const grille = [low + h * 0.03, low + h * 0.25];
  const holes = fine ? [0.25, 0.5, 0.75].flatMap((row) => [-0.72, -0.48, -0.24, 0, 0.24, 0.48, 0.72].map((column) => {
    const s = column * flat, u = grille[0] + (grille[1] - grille[0]) * row, size = w * 0.028;
    return [band(s - size, s + size, u - size, u + size), [150, 160, 170]];
  })) : [];
  const eye = front === "dome" ? [
    [disc(-w * 0.03, h * 0.31, w * 0.235), [213, 219, 225]],
    [disc(-w * 0.03, h * 0.31, w * 0.2), [252, 252, 253]],
    [disc(w * 0.29, h * 0.31, w * 0.05, 8), [140, 148, 157]]
  ] : [[disc(w * 0.26, h * 0.2, w * 0.07, 10), [176, 184, 192]], [disc(w * 0.26, h * 0.2, w * 0.04, 8), [96, 104, 113]]];
  return [
    [band(-flat, flat, ...grille), [226, 230, 234]],
    ...holes,
    [band(-flat, flat, low + h * 0.265, low + h * 0.32), [214, 221, 227], "light"],
    ...eye
  ];
}
function devicePose(item, height, furniture = []) {
  const housing = deviceHousing(item.model);
  if (!housing) return null;
  const size = { width: housing.width * deviceScale, height: housing.height * deviceScale, depth: housing.depth * deviceScale };
  const mounting = installationFor(item);
  const frame = axes(item.angle, housing.front === "plate" ? 0 : item.tilt ?? 0);
  if (mounting === "wall-recessed") {
    const centre2 = [item.x + frame.ahead[0] * size.depth / 2, item.y + frame.ahead[1] * size.depth / 2, height];
    return { housing, size, frame, centre: centre2, mounting };
  }
  if (mounting === "wall-bracket") {
    const out = wallVector(item.angle - (item.pan ?? 0));
    const wall2 = [item.x, item.y, height];
    const joint = [item.x + out.x * 0.028 * deviceScale, item.y + out.y * 0.028 * deviceScale, height];
    const reach2 = size.depth / 2 + 4e-3 * deviceScale;
    return { housing, size, frame, centre: joint.map((value, index) => value + frame.ahead[index] * reach2), mounting, bracket: { wall: wall2, joint, out } };
  }
  const foot = height - housing.height / 2;
  const below = furniture.filter((piece) => pointInOutline(furnitureFootprint(piece), item)).map((piece) => piece.base + piece.height).filter((top2) => top2 <= foot + 0.03);
  const rest = Math.max(0, ...below);
  return {
    housing,
    size,
    frame,
    centre: [item.x, item.y, foot + size.height / 2],
    mounting,
    stand: foot - rest > 0.03 ? { low: rest, high: foot } : null
  };
}
function paintDevice(item, height, { project, towardCamera: towardCamera2, sun = [-0.42, -0.43, 0.8], dim = 0, furniture = [], fine = true } = {}) {
  const pose = devicePose(item, height, furniture);
  if (!pose) return "";
  const { housing, size, frame, centre: centre2, bracket, stand } = pose;
  const drawn = (corner) => project([corner[0], corner[1]], corner[2]).map(number);
  const point3 = (corner) => drawn(corner).join(",");
  const polygon2 = (corners, fill3, more = "") => `<polygon points="${corners.map(point3).join(" ")}" fill="${fill3}" ${more}/>`;
  const shade = (colour, normal) => {
    const light = Math.max(0.76, Math.min(1, 0.87 + 0.13 * dot(normal, sun))) * (1 - 0.45 * dim);
    return `rgb(${colour.map((value) => Math.round(value * light)).join(" ")})`;
  };
  const line = 'stroke-linejoin="round" vector-effect="non-scaling-stroke"';
  const local = placed(centre2, frame);
  const turned = ([s, f, u]) => [0, 1, 2].map((index) => s * frame.side[index] + f * frame.ahead[index] + u * frame.up[index]);
  const faces = housingFaces(size.width, size.height, size.depth).map((face) => ({ ...face, normal: turned(face.normal), corners: face.corners.map(local) }));
  const outline = `<polygon points="${convexHull(faces.flatMap((face) => face.corners.map(drawn))).map((corner) => corner.join(",")).join(" ")}"
        fill="none" stroke="#5f6d7a" stroke-width="1.6" ${line}/>`;
  const body = faces.filter((face) => dot(face.normal, towardCamera2) > 0).map((face) => {
    const length = Math.hypot(...face.normal);
    const fill3 = shade(plastic, face.normal.map((value) => value / length));
    return polygon2(face.corners, fill3, `stroke="${face.lid ? "#aab4bd" : fill3}" stroke-width=".6" ${line}`);
  }).join("");
  const facesCamera = dot(frame.ahead, towardCamera2) > 0;
  const front = facesCamera ? frontShapes({ ...size, front: housing.front }, fine).map(([shape, colour, part]) => {
    const corners = shape.map(([s, u]) => local([s, size.depth / 2 + 2e-3, u]));
    return polygon2(corners, shade(colour, frame.ahead), 'stroke="none"') + (part === "light" ? polygon2(corners, "currentColor", 'class="fp-device-light" fill-opacity=".62" stroke="none"') : "");
  }).join("") : "";
  let holder = "";
  if (bracket) {
    const { wall: wall2, joint, out } = bracket;
    const across = [-out.y, out.x, 0];
    const unit3 = deviceScale / 1e3;
    const plate = [[-18, -25], [18, -25], [18, 25], [-18, 25]].map(([side, up]) => [wall2[0] + across[0] * side * unit3 + out.x * 6e-3, wall2[1] + across[1] * side * unit3 + out.y * 6e-3, wall2[2] + up * unit3]);
    const back = local([0, -size.depth / 2, 0]);
    holder = `<g class="fp-device-bracket">${polygon2(plate, shade([224, 228, 232], [out.x, out.y, 0]), `stroke="#75838f" stroke-width=".7" ${line}`)}
            <path d="M${point3(wall2)}L${point3(joint)}L${point3(back)}" fill="none" stroke="#9aa5af" stroke-width="${number(11 * unit3)}" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M${point3(joint)}h0" fill="none" stroke="#6f7c88" stroke-width="${number(19 * unit3)}" stroke-linecap="round"/></g>`;
  } else if (stand) {
    const upright = axes(item.angle, 0);
    const corner = (s, f, z) => [item.x + s * upright.side[0] + f * upright.ahead[0], item.y + s * upright.side[1] + f * upright.ahead[1], z];
    const w = size.width / 2 + 0.04, d = size.depth / 2 + 0.04;
    const foot = [[-w, -d], [w, -d], [w, d], [-w, d]];
    const sides = foot.map(([s, f], index) => {
      const [nextS, nextF] = foot[(index + 1) % foot.length];
      const normal = [0, 1].map((axis) => (nextF - f) * upright.side[axis] + (s - nextS) * upright.ahead[axis]);
      return { normal: [...normal, 0], corners: [corner(s, f, stand.low), corner(nextS, nextF, stand.low), corner(nextS, nextF, stand.high), corner(s, f, stand.high)] };
    }).filter((face) => dot(face.normal, towardCamera2) > 0);
    holder = `<g class="fp-device-stand">${[...sides, { normal: [0, 0, 1], corners: foot.map(([s, f]) => corner(s, f, stand.high)) }].map((face) => polygon2(face.corners, shade([226, 231, 236], face.normal), `fill-opacity=".62" stroke="#8a97a3" stroke-opacity=".8" stroke-width=".8" ${line}`)).join("")}</g>`;
  }
  const parts = bracket && !facesCamera ? outline + body + front + holder : holder + outline + body + front;
  return `<g class="fp-device fp-space-puck wall" data-device="${item.model}" data-mounting="${pose.mounting}">${parts}</g>`;
}
var deviceScale, tall, short, housings, deviceHousing, degree2, plastic, dot, number, placed, rounding2, disc, band;
var init_floor_planner_device_mesh = __esm({
  "src/js/floor-planner-device-mesh.mjs"() {
    init_floor_planner_furniture();
    init_floor_planner_geometry();
    init_floor_planner_model();
    deviceScale = 4;
    tall = { width: 0.056, height: 0.107, depth: 0.041, front: "dome" };
    short = { width: 0.056, height: 0.087, depth: 0.038, front: "eye" };
    housings = {
      ultimatesensor: tall,
      "ultimatesensor-v2": tall,
      "ultimatesensor-mini": short,
      "ultimatesensor-mini-v2": short,
      // The cover frame of a wall box, with the square sensor plate in it.
      wallsense: { width: 0.081, height: 0.081, depth: 0.011, front: "plate" }
    };
    deviceHousing = (model) => housings[model] ?? null;
    degree2 = Math.PI / 180;
    plastic = [246, 247, 249];
    dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    number = (value) => Number(value.toFixed(3));
    placed = (centre2, { side, ahead, up }) => ([s, f, u]) => centre2.map((value, index) => value + s * side[index] + f * ahead[index] + u * up[index]);
    rounding2 = 0.24;
    disc = (s, u, radius, points = 14) => Array.from({ length: points }, (_, index) => {
      const turn = index * 2 * Math.PI / points;
      return [s + Math.cos(turn) * radius, u + Math.sin(turn) * radius];
    });
    band = (left, right, low, high) => [[left, low], [right, low], [right, high], [left, high]];
  }
});

// src/js/floor-planner-depth.mjs
function planeFor([a, b, c]) {
  const [x, y, z] = b.map((value, axis) => value - a[axis]);
  const [u, v, w] = c.map((value, axis) => value - a[axis]);
  const normal = [y * w - z * v, z * u - x * w, x * v - y * u];
  const length = Math.hypot(...normal);
  if (length <= epsilon2) return null;
  const unit3 = normal.map((value) => value / length);
  return { normal: unit3, offset: dot2(unit3, a) };
}
function sideOf(face, plane) {
  const { normal: [x, y, z], offset: offset2 } = plane;
  let side = 0;
  for (const point3 of face.vertices) {
    const distance4 = x * point3[0] + y * point3[1] + z * point3[2] - offset2;
    if (distance4 > epsilon2) side |= 1;
    if (distance4 < -epsilon2) side |= 2;
    if (side === 3) break;
  }
  return side;
}
function choosePlane(faces) {
  let best = faces[0].plane, score = Infinity;
  const stride = Math.max(1, Math.ceil(faces.length / 8));
  for (let index = 0; index < faces.length; index += stride) {
    const plane = faces[index].plane;
    let front = 0, back = 0, split = 0;
    for (const face of faces) {
      const side = sideOf(face, plane);
      if (side === 1) front++;
      if (side === 2) back++;
      if (side === 3 && ++split * 9 >= score) break;
    }
    const cost = split * 9 + Math.abs(front - back);
    if (cost < score) {
      best = plane;
      score = cost;
    }
    if (!score) break;
  }
  return best;
}
function splitFace(face, plane) {
  const front = [], back = [];
  face.vertices.forEach((point3, index) => {
    const next = face.vertices[(index + 1) % face.vertices.length];
    const a = planeDistance(plane, point3), b = planeDistance(plane, next);
    if (a >= -epsilon2) front.push(point3);
    if (a <= epsilon2) back.push(point3);
    if (a > epsilon2 && b < -epsilon2 || a < -epsilon2 && b > epsilon2) {
      const fraction = a / (a - b);
      const intersection2 = point3.map((value, axis) => value + (next[axis] - value) * fraction);
      front.push(intersection2);
      back.push(intersection2);
    }
  });
  const boundary = face.boundary ?? face.vertices;
  return [{ ...face, vertices: front, boundary }, { ...face, vertices: back, boundary }];
}
function splitVerticesAtHeight(vertices, height) {
  const face = { vertices };
  const plane = { normal: [0, 0, 1], offset: height };
  const side = sideOf(face, plane);
  if (side === 0 || side === 1) return [[], vertices];
  if (side === 2) return [vertices, []];
  const [above, below] = splitFace(face, plane);
  return [below.vertices, above.vertices];
}
function depthOrder(faces, towardCamera2) {
  const visible = faces.flatMap((face) => {
    const plane = planeFor(face.vertices);
    return plane && dot2(plane.normal, towardCamera2) > epsilon2 ? [{ ...face, plane }] : [];
  });
  const ordered = [];
  const depth = (face) => face.vertices.reduce((sum, point3) => sum + dot2(point3, towardCamera2), 0) / face.vertices.length;
  function visit(group, level = 0) {
    if (!group.length) return;
    if (group.length === 1) {
      ordered.push(group[0]);
      return;
    }
    if (level > 120) {
      ordered.push(...[...group].sort((a, b) => depth(a) - depth(b)));
      return;
    }
    const plane = choosePlane(group);
    const front = [], back = [], aligned = [];
    for (const face of group) {
      switch (sideOf(face, plane)) {
        case 0:
          aligned.push(face);
          break;
        case 1:
          front.push(face);
          break;
        case 2:
          back.push(face);
          break;
        default: {
          const [near, far] = splitFace(face, plane);
          front.push(near);
          back.push(far);
        }
      }
    }
    const frontFirst = dot2(plane.normal, towardCamera2) < 0;
    visit(frontFirst ? front : back, level + 1);
    for (const face of aligned) ordered.push(face);
    visit(frontFirst ? back : front, level + 1);
  }
  visit(visible);
  return ordered;
}
function onFaceEdge(point3, a, b) {
  const edge = b.map((value, axis) => value - a[axis]);
  const offset2 = point3.map((value, axis) => value - a[axis]);
  const fraction = dot2(offset2, edge) / dot2(edge, edge);
  return fraction >= -epsilon2 && fraction <= 1 + epsilon2 && offset2.every((value, axis) => Math.abs(value - fraction * edge[axis]) < epsilon2);
}
var epsilon2, dot2, planeDistance;
var init_floor_planner_depth = __esm({
  "src/js/floor-planner-depth.mjs"() {
    epsilon2 = 1e-5;
    dot2 = ([x, y, z], [a, b, c]) => x * a + y * b + z * c;
    planeDistance = (plane, point3) => dot2(plane.normal, point3) - plane.offset;
  }
});

// src/js/floor-planner-furniture-mesh.mjs
function bridge(from, to, surface) {
  return from.map((point3, index) => {
    const next = (index + 1) % from.length;
    return { vertices: [point3, from[next], to[next], to[index]], surface, face: "face" };
  });
}
function roundBox(width, depth, radius, low, high, surface, x = 0, y = 0) {
  const bottom2 = ring(width, depth, radius, low, x, y, 2);
  const top2 = bottom2.map(([x2, y2]) => [x2, y2, high]);
  return [...bridge(bottom2, top2, surface), { vertices: top2, surface, face: "top" }];
}
function cushion({ w, d, low, high, surface, x, y }) {
  const r = Math.min(w, d) * 0.19;
  const center = [x + w / 2, y + d / 2];
  const bevel = Math.min(r * 0.4, (high - low) * 0.25);
  const bottom2 = ring(w, d, r, low, ...center, 3);
  const shoulder = bottom2.map(([x2, y2]) => [x2, y2, high - bevel]);
  const top2 = ring(w - 2 * bevel, d - 2 * bevel, r - bevel, high, ...center, 3);
  return [...bridge(bottom2, shoulder, surface), ...bridge(shoulder, top2, surface), { vertices: top2, surface, face: "top" }];
}
function bath({ width: w, depth: d, height: h, base: z }) {
  const r = Math.min(w, d) * 0.39;
  const low = ring(w * 0.86, d * 0.78, r * 0.81, z + 0.035 * h);
  const body = ring(w * 0.99, d * 0.98, r, z + 0.76 * h);
  const edge = ring(w, d, r, z + 0.83 * h);
  const rim = ring(w * 0.95, d * 0.9, r * 0.94, z + h * 0.845);
  const inner = ring(w * 0.83, d * 0.73, r * 0.83, z + 0.815 * h);
  const bottom2 = ring(w * 0.67, d * 0.56, r * 0.66, z + 0.3 * h);
  const drain = circle(-w * 0.21, 0, z + 0.304 * h, Math.min(w, d) * 0.037);
  const tap = circle(-w * 0.44, 0, z + h * 0.83, Math.min(w, d) * 0.024, 8);
  const tapTop = tap.map(([x, y]) => [x, y, z + h]);
  return [
    ...bridge(low, body, "ceramic"),
    ...bridge(body, edge, "ceramic"),
    ...bridge(edge, rim, "ceramic-rim"),
    ...bridge(rim, inner, "ceramic-rim"),
    ...bridge(inner, bottom2, "basin"),
    { vertices: bottom2, surface: "basin-floor", face: "top" },
    { vertices: drain, surface: "chrome", face: "top" },
    ...bridge(tap, tapTop, "chrome"),
    { vertices: tapTop, surface: "chrome", face: "top" },
    ...roundBox(w * 0.085, d * 0.034, Math.min(w, d) * 0.014, z + h * 0.955, z + h, "chrome", -w * 0.411, 0)
  ];
}
function curtain({ width: w, depth: d, height: h, base: z }) {
  const pleats = Math.max(4, Math.min(8, Math.round(w / 0.26)));
  const segments = pleats * 4;
  const cloth = (index, height, width, amplitude) => {
    const along = index / segments - 0.5;
    return [along * w * width, Math.sin(index / 4 * Math.PI * 2) * d * amplitude, z + h * height];
  };
  const faces = [];
  for (let i = 0; i < segments; i++) {
    for (const [bottom2, top2, bottomWidth, topWidth, bottomDepth, topDepth] of [
      [0.02, 0.055, 1, 1, 0.48, 0.47],
      [0.055, 0.78, 1, 0.985, 0.47, 0.36],
      [0.78, 0.96, 0.985, 0.95, 0.36, 0.32]
    ]) {
      const surface = bottom2 === 0.02 ? "cloth-hem" : ["cloth", "cloth-shadow", "cloth", "cloth-light"][i % 4];
      const vertices = [
        cloth(i, bottom2, bottomWidth, bottomDepth),
        cloth(i + 1, bottom2, bottomWidth, bottomDepth),
        cloth(i + 1, top2, topWidth, topDepth),
        cloth(i, top2, topWidth, topDepth)
      ];
      const [a, b, c, e] = vertices;
      for (const vertices2 of [[a, b, c], [a, c, e]]) faces.push(
        { vertices: vertices2, surface, face: "face" },
        { vertices: [...vertices2].reverse(), surface, face: "face" }
      );
    }
  }
  return faces.concat(roundBox(w, d * 0.64, d * 0.3, z + h * 0.969, z + h, "rail"));
}
function plant({ width: w, depth: d, height: h, base: z }) {
  const radius = Math.min(w, d) * 0.31;
  const foot = circle(0, 0, z, radius * 0.76), top2 = circle(0, 0, z + h * 0.3, radius);
  const foliage = Array.from({ length: 9 }, (_, index) => {
    const a = index * 2.39996;
    const point3 = (length, side, y) => [
      Math.cos(a) * w * length - Math.sin(a) * w * side,
      Math.sin(a) * d * length + Math.cos(a) * d * side,
      z + h * y
    ];
    const tip = point3(index > 5 ? 0.31 : 0.46, 0, index > 5 ? 0.91 + 0.022 * (index - 6) : 0.67 + 0.036 * index);
    const root2 = point3(0.04, 0, 0.27 + index * 0.033), mid = point3(0.3, 0, 0.69 + index * 0.027);
    const leaf = [root2, point3(0.23, 0.13, 0.57 + index * 0.03), tip, point3(0.25, -0.12, 0.6 + index * 0.028)];
    return leaf.flatMap((vertex, i) => {
      const vertices = [vertex, leaf[(i + 1) % 4], mid];
      const surface = i % 2 ? "leaf-light" : "leaf";
      return [{ vertices, surface, face: "face" }, { vertices: [...vertices].reverse(), surface, face: "face" }];
    });
  });
  return [...bridge(foot, top2, "planter"), { vertices: top2, surface: "soil", face: "top" }, ...foliage.flat()];
}
function washer({ width: w, depth: d, height: h, base: z }) {
  const outer = frontCircle(0, d * 0.485, z + h * 0.48, w * 0.35, h * 0.27);
  const bezel = frontCircle(0, d * 0.5, z + h * 0.48, w * 0.35 * 0.94, h * 0.27 * 0.94);
  const glass = frontCircle(0, d * 0.5, z + h * 0.48, w * 0.265, h * 0.203);
  const drum = frontCircle(0, d * 0.501, z + h * 0.48, w * 0.192, h * 0.15);
  const dial = frontCircle(w * 0.25, d * 0.497, z + h * 0.86, w * 0.067, h * 0.053);
  return [
    ...roundBox(w, d * 0.966, Math.min(w, d) * 0.05, z, z + h, "appliance"),
    ...bridge(outer, bezel, "chrome"),
    ...bridge(bezel, glass, "gasket"),
    { vertices: glass, surface: "porthole", face: "face" },
    { vertices: drum, surface: "drum", face: "face" },
    { vertices: dial, surface: "chrome", face: "face" }
  ];
}
function fan({ width: w, depth: d, height: h, base: z }) {
  const centre2 = z + h * 0.8;
  const rim = frontCircle(0, d * 0.08, centre2, w * 0.48, h * 0.19);
  const grill = frontCircle(0, d * 0.08, centre2, w * 0.48 * 0.9, h * 0.19 * 0.9);
  const hub = frontCircle(0, d * 0.115, centre2, w * 0.08, h * 0.032);
  return [
    ...roundBox(w * 0.64, d * 0.92, Math.min(w, d) * 0.3, z, z + h * 0.04, "appliance"),
    ...roundBox(0.036, 0.036, 0.012, z + h * 0.04, z + h * 0.7, "chrome"),
    ...roundBox(w * 0.22, d * 0.4, Math.min(w, d) * 0.08, centre2 - h * 0.06, centre2 + h * 0.06, "appliance", 0, -d * 0.14),
    ...bridge(rim, grill, "fan-rim"),
    { vertices: grill, surface: "fan-grill", face: "face" },
    { vertices: hub, surface: "chrome", face: "face" }
  ];
}
function pet({ width: w, depth: d, height: h, base: z }) {
  return [
    ...cushion({ w: w * 0.7, d: d * 0.82, low: z + h * 0.04, high: z + h * 0.62, surface: "fur", x: -w * 0.44, y: -d * 0.41 }),
    ...cushion({ w: w * 0.27, d: d * 0.6, low: z + h * 0.32, high: z + h, surface: "fur", x: w * 0.2, y: -d * 0.3 }),
    ...roundBox(w * 0.12, d * 0.32, Math.min(w, d) * 0.06, z + h * 0.38, z + h * 0.66, "fur-dark", w * 0.43, 0),
    ...roundBox(w * 0.17, d * 0.12, Math.min(w, d) * 0.04, z + h * 0.26, z + h * 0.38, "fur-dark", -w * 0.5, d * 0.1)
  ];
}
function furnitureMesh(item) {
  const { width: w, depth: d, height: h, base: z, kind } = item;
  if (kind === "bath") return { faces: bath(item), parts: [] };
  if (kind === "curtain") return { faces: curtain(item), parts: [] };
  if (kind === "plant") return { faces: plant(item), parts: [] };
  if (kind === "fan") return { faces: fan(item), parts: [] };
  if (kind === "pet") return { faces: pet(item), parts: [] };
  if (kind === "washer") return { faces: washer(item), parts: [block(-w * 0.34, d * 0.485, w * 0.35, d * 0.015, z + h * 0.82, z + h * 0.9, "display")] };
  const slice = (x, y, width, depth, low, high, surface) => block(w * x, d * y, w * width, d * depth, z + h * low, z + h * high, surface);
  const round = (width, depth, radius, low, high, surface) => roundBox(w * width, d * depth, Math.min(w, d) * radius, z + h * low, z + h * high, surface);
  const parts = furnitureParts(item);
  if (kind === "tv") return { faces: round(0.98, 0.68, 0.042, 0.12, 1, "bezel"), parts: [
    slice(-0.45, 0.34, 0.9, 0.024, 0.19, 0.94, "display"),
    slice(-0.055, -0.12, 0.11, 0.29, 0.025, 0.22, "rail"),
    slice(-0.21, -0.48, 0.42, 0.96, 0, 0.035, "rail")
  ] };
  if (kind === "glass") return { faces: [], parts: [
    slice(-0.46, -0.13, 0.92, 0.26, 0.04, 0.95, "pane"),
    slice(-0.5, -0.5, 0.04, 1, 0, 1, "rail"),
    slice(0.46, -0.5, 0.04, 1, 0, 1, "rail"),
    slice(-0.46, -0.5, 0.92, 1, 0.945, 1, "rail"),
    slice(-0.46, -0.5, 0.92, 1, 0, 0.05, "rail")
  ] };
  if (kind === "screen") return { faces: [], parts: [
    slice(-0.5, -0.44, 1, 0.88, 0, 0.055, "frame"),
    ...Array.from({ length: 3 }, (_, i) => slice(-0.497 + i * 0.339, -0.4 + i % 2 * 0.25, 0.315, 0.54, 0.05, 0.97, "screen-panel")),
    ...[-0.5, -0.17, 0.17, 0.475].map((x) => slice(x, -0.5, 0.025, 1, 0.04, 1, "frame"))
  ] };
  if (kind === "radiator" || kind === "heater") {
    const fins = kind === "radiator" ? 11 : 7;
    const width = 0.92 / fins;
    return { faces: [], parts: [
      ...kind === "heater" ? [slice(-0.42, -0.5, 0.06, 1, 0, 0.08, "chrome"), slice(0.36, -0.5, 0.06, 1, 0, 0.08, "chrome"), slice(0.3, -0.2, 0.16, 0.4, 0.9, 1, "appliance")] : [],
      slice(-0.47, -0.3, 0.94, 0.6, kind === "heater" ? 0.1 : 0.02, 0.98, "radiator"),
      ...Array.from({ length: fins }, (_, index) => slice(
        -0.46 + index * width + width * 0.15,
        -0.5,
        width * 0.7,
        1,
        kind === "heater" ? 0.08 : 0,
        kind === "heater" ? 0.92 : 1,
        "radiator-fin"
      ))
    ] };
  }
  if (kind === "fridge") return { faces: round(1, 0.94, 0.047, 0.015, 1, "appliance"), parts: [
    slice(-0.44, 0.47, 0.88, 0.03, 0.035, 0.295, "appliance-door"),
    slice(-0.44, 0.47, 0.88, 0.03, 0.309, 0.97, "appliance-door"),
    slice(-0.36, 0.493, 0.048, 0.03, 0.38, 0.69, "chrome"),
    slice(-0.36, 0.493, 0.048, 0.03, 0.15, 0.275, "chrome")
  ] };
  if (["island", "cabinet", "wardrobe", "nightstand"].includes(kind)) {
    const drawer = kind === "nightstand";
    const faceCount = drawer ? 2 : kind === "island" ? 3 : 2;
    const inserts = Array.from({ length: faceCount }, (_, index) => {
      const x = drawer ? -0.435 : -0.456 + index * 0.93 / faceCount;
      const low = drawer ? 0.13 + index * 0.38 : 0.1, high = drawer ? low + 0.34 : 0.86;
      const width = drawer ? 0.87 : 0.89 / faceCount;
      return [slice(x, 0.459, width, 0.027, low, high, "panel"), slice(x + width * 0.32, 0.485, width * 0.36, 0.023, high - 0.12, high - 0.092, "chrome")];
    }).flat();
    return { faces: round(1, 1, 0.033, 0.91, 1, kind === "island" ? "countertop" : "top"), parts: [
      slice(-0.45, -0.43, 0.9, 0.86, 0.06, 0.915, "body"),
      slice(-0.4, -0.36, 0.8, 0.72, 0, 0.07, "frame"),
      ...inserts
    ] };
  }
  if (kind === "shelves") return { faces: [], parts: parts.concat([
    slice(-0.37, -0.37, 0.06, 0.62, 0.32, 0.47, "book"),
    slice(-0.295, -0.38, 0.049, 0.6, 0.32, 0.49, "book-light"),
    slice(-0.22, -0.36, 0.067, 0.58, 0.32, 0.46, "book"),
    slice(0.06, -0.32, 0.26, 0.58, 0.59, 0.675, "panel"),
    slice(-0.33, -0.3, 0.25, 0.56, 0.83, 0.875, "book-light")
  ]) };
  if (["coffee", "dining", "desk"].includes(kind)) return { faces: round(1, 1, 0.085, 0.89, 1, "top"), parts: parts.filter((part) => part.surface !== "top") };
  if (["sofa", "corner", "armchair", "chair", "bed"].includes(kind)) {
    const soft = ["seat", "pillow", "duvet"];
    const upholstered = ["sofa", "corner", "armchair"].includes(kind);
    const padded = (part) => soft.includes(part.surface) || upholstered && part.surface === "body" && part.low > z;
    const pads = parts.filter(padded).flatMap((part) => {
      if (kind !== "sofa" || part.surface !== "seat") return cushion(part);
      const seats2 = w > 2 ? 3 : 2;
      const gap2 = Math.min(0.024, part.w * 0.025);
      const width = (part.w - (seats2 - 1) * gap2) / seats2;
      return Array.from({ length: seats2 }, (_, index) => cushion({ ...part, w: width, x: part.x + index * (width + gap2) })).flat();
    });
    return { faces: pads, parts: parts.filter((part) => !padded(part)) };
  }
  return { faces: [], parts };
}
function rugLayers({ width, depth, height, base }) {
  return [0.998, 0.94].map((factor, index) => ring(
    width * factor,
    depth * factor,
    Math.min(width, depth) * 0.065,
    base + height + index * 2e-3,
    0,
    0,
    2
  ));
}
var ring, circle, block, frontCircle;
var init_floor_planner_furniture_mesh = __esm({
  "src/js/floor-planner-furniture-mesh.mjs"() {
    init_floor_planner_furniture();
    ring = (width, depth, radius, z, x = 0, y = 0, steps2 = 5) => {
      const r = Math.min(radius, width / 2 - 1e-4, depth / 2 - 1e-4);
      return [[1, -1], [1, 1], [-1, 1], [-1, -1]].flatMap(([sx, sy], corner) => Array.from({ length: steps2 + 1 }, (_, index) => {
        const angle2 = (corner - 1 + index / steps2) * Math.PI / 2;
        return [x + sx * (width / 2 - r) + r * Math.cos(angle2), y + sy * (depth / 2 - r) + r * Math.sin(angle2), z];
      }));
    };
    circle = (x, y, z, radius, count = 10) => Array.from({ length: count }, (_, index) => {
      const angle2 = index * 2 * Math.PI / count;
      return [x + Math.cos(angle2) * radius, y + Math.sin(angle2) * radius, z];
    });
    block = (x, y, w, d, low, high, surface) => ({ x, y, w, d, low, high, surface });
    frontCircle = (x, y, z, rx, rz) => Array.from({ length: 14 }, (_, index) => {
      const angle2 = index * 2 * Math.PI / 14;
      return [x + Math.cos(angle2) * rx, y, z - Math.sin(angle2) * rz];
    });
  }
});

// src/js/floor-planner-maquette.mjs
function cutawayWallHeight(room, depth) {
  const facing = Math.max(0, Math.min(1, depth / 0.3));
  return Math.min(room.height * 0.88, 0.43 + 1.8 * facing * facing * (3 - 2 * facing));
}
function blockFaces(corners, base, top2, attributes, drawTop = true) {
  const faces = polygonEdges(corners).map(([a, b]) => ({
    vertices: [[...a, base], [...b, base], [...b, top2], [...a, top2]],
    className: "fp-model-face",
    attributes
  }));
  if (drawTop) faces.push({ vertices: corners.map((point3) => [...point3, top2]), className: "fp-model-top", attributes });
  return faces;
}
function paintFaces(faces, project, towardCamera2, { sun: [sunX, sunY, sunZ], dim } = daylightFor("studio")) {
  return depthOrder(faces, towardCamera2).map(({ vertices, boundary, plane, className, attributes = "" }) => {
    const points = vertices.map(([x, y, z]) => project([x, y], z));
    const [nx, ny, nz] = plane.normal;
    const light = sunX * nx + sunY * ny + sunZ * nz;
    const highlight = Math.round(Math.max(0, light) * 19 * (1 - dim));
    const shadow = Math.round(Math.max(0, 0.55 - light) * 19 + dim * 22);
    const polygon2 = spacePolygon("polygon", points, `class="${className}${boundary ? " fp-depth-fragment" : ""}"`);
    const originalEdges = boundary && polygonEdges(boundary);
    const edges = originalEdges ? polygonEdges(vertices).map(([a, b], index) => {
      if (!originalEdges.some(([start3, end2]) => onFaceEdge(a, start3, end2) && onFaceEdge(b, start3, end2))) return "";
      return `M${points[index].join(" ")}L${points[(index + 1) % points.length].join(" ")}`;
    }).join("") : "";
    return `<g ${attributes} style="--fp-light:${highlight}%;--fp-shadow:${shadow}%">${polygon2}${edges ? `<path class="${className} fp-depth-boundary" d="${edges}"/>` : ""}</g>`;
  }).join("");
}
function paintMaquette(plan2, project, depthOf, towardCamera2, selected2, floorOverlay = "", sceneId = "single", { draft = false, wallMode: wallMode2 = "cutaway", daylight: daylight2 = "studio" } = {}) {
  const light = daylightFor(daylight2);
  const doors = doorsOnPlan(plan2);
  const objects = [];
  const floors = [];
  const bases = [];
  const shadows = [];
  const floorShadows = [];
  const contactShadows = [];
  const floorClip = [];
  const furniture = plan2.furniture ?? [];
  const wallHeight = (room, normal, exterior) => {
    if (wallMode2 === "up") return room.height;
    if (wallMode2 === "down" || !exterior) return Math.min(room.height * 0.75, 0.25);
    return cutawayWallHeight(room, depthOf(normal));
  };
  const wallGeometry = (a, b, room, normal) => {
    const [x, y] = shift(midpoint(a, b), normal, -0.045);
    const exterior = room && !plan2.rooms.some((other) => other !== room && contains(other, { x, y }));
    const loose = wallMode2 === "up" ? Math.max(0.42, ...plan2.rooms.map((entry) => entry.height)) : wallMode2 === "down" ? 0.25 : 0.42;
    return {
      height: room ? wallHeight(room, normal, exterior) : loose,
      outside: exterior ? -0.12 : room ? 0 : -0.06,
      inside: exterior ? 0 : 0.055
    };
  };
  const addWall = (a, b, room, id) => {
    const normal = inward(a, b);
    for (const [start3, end2] of wallSegments(a, b, doors)) {
      const { height, outside, inside } = wallGeometry(start3, end2, room, normal);
      const wall2 = [
        shift(start3, normal, outside),
        shift(end2, normal, outside),
        shift(end2, normal, inside),
        shift(start3, normal, inside)
      ];
      objects.push(...blockFaces(wall2, 0, height, `class="fp-space-wall${id === selected2 ? " selected" : ""}" data-item="${id}"${wallColor(room)}`));
    }
  };
  const addOutsideCorner = (previous, corner, next, room) => {
    const before = inward(previous, corner), after = inward(corner, next);
    if (before[0] * after[1] - before[1] * after[0] <= 1e-4) return;
    const closeToCorner = (point3) => {
      const ratio = Math.min(0.4, 0.09 / Math.hypot(point3[0] - corner[0], point3[1] - corner[1]));
      return corner.map((value, axis) => value + (point3[axis] - value) * ratio);
    };
    const left = closeToCorner(previous), right = closeToCorner(next);
    const first = wallGeometry(left, corner, room, before), second = wallGeometry(corner, right, room, after);
    const thickness = first.outside;
    if (!thickness || second.outside !== thickness) return;
    const touches = (point3) => Math.hypot(point3[0] - corner[0], point3[1] - corner[1]) < 1e-3;
    if (!wallSegments(left, corner, doors).some(([, end2]) => touches(end2)) || !wallSegments(corner, right, doors).some(([start3]) => touches(start3))) return;
    const sum = before.map((value, axis) => value + after[axis]);
    const miter = thickness / (1 + before[0] * after[0] + before[1] * after[1]);
    const joint = [corner, shift(corner, before, thickness)];
    if (Math.hypot(...sum) * Math.abs(miter) < 0.28) joint.push(shift(corner, sum, miter));
    joint.push(shift(corner, after, thickness));
    objects.push(...blockFaces(
      joint,
      0,
      Math.min(first.height, second.height),
      `class="fp-space-wall${room.id === selected2 ? " selected" : ""}" data-item="${room.id}"${wallColor(room)}`
    ));
  };
  const addWindow = (start3, end2, room, normal, base, top2, className, attributes = "", frame = false) => {
    const [nx, ny] = inward(start3, end2);
    const [a, b] = nx * normal[0] + ny * normal[1] > 0 ? [start3, end2] : [end2, start3];
    const { height, outside, inside } = wallGeometry(a, b, room, normal);
    const visibleTop = Math.min(height - 0.035, top2);
    if (visibleTop <= base + 4e-3) {
      if (frame) {
        const corners = [
          shift(a, normal, outside + 0.012),
          shift(b, normal, outside + 0.012),
          shift(b, normal, inside - 0.012),
          shift(a, normal, inside - 0.012)
        ];
        objects.push({ vertices: corners.map((point3) => [...point3, height + 2e-3]), className: "fp-model-window-sill" });
      }
      return;
    }
    const pane = (from, to, offset2, name) => {
      const left = shift(from, normal, inside + offset2);
      const right = shift(to, normal, inside + offset2);
      const vertices = [[...left, base], [...left, visibleTop], [...right, visibleTop], [...right, base]];
      objects.push({ vertices, className: name, attributes });
    };
    pane(a, b, 2e-3, className);
    if (frame) {
      const center = midpoint(a, b);
      const direction2 = [normal[1], -normal[0]];
      pane(shift(center, direction2, -0.012), shift(center, direction2, 0.012), 4e-3, "fp-model-window-frame");
    }
  };
  for (const room of plan2.rooms) {
    const outline = roomCorners(room);
    const points = outline.map((point3) => project(point3));
    const active = room.id === selected2 ? " selected" : "";
    const floor = room.floorFinish ?? (exampleFloor(room) || "boards");
    floorClip.push(spacePolygon("polygon", points));
    shadows.push("M" + points.map((point3) => point3.join(" ")).join("L") + "Z");
    bases.push(...blockFaces(outline, -floorSlabDepth, 0, 'class="fp-model-base"', false));
    floors.push(spacePolygon("polygon", points, `class="fp-space-floor${active}" data-item="${room.id}" data-floor="${floor}"`));
    if (!draft && (floor === "boards" || floor === "tiles")) floors.push(spacePolygon("polygon", points, `class="fp-model-texture" data-floor="${floor}"`));
    polygonEdges(outline).forEach(([a, b], index) => {
      addWall(a, b, room, room.id);
      addOutsideCorner(outline[(index + outline.length - 1) % outline.length], a, b, room);
    });
    for (const [x, y, endX, endY] of room.outline || plan2.windows?.some((window2) => window2.roomId === room.id) ? [] : exampleWindows(room)) {
      const start3 = [room.x + x * room.width, room.y + y * room.depth];
      const end2 = [room.x + endX * room.width, room.y + endY * room.depth];
      const normal = x === endX ? [x === 0 ? 1 : -1, 0] : [0, y === 0 ? 1 : -1];
      const sill = room.id === "kitchen" ? 1.22 : defaultWindowSill;
      addWindow(start3, end2, room, normal, sill, sill + 0.94, "fp-model-window", "", true);
    }
  }
  for (const item of furniture) {
    const transform = furnitureProjection(item);
    const attributes = `data-item="${item.id}" data-furniture-id="${item.id}" data-material="${item.material}" data-model="${item.kind}"`;
    const active = item.id === selected2 ? " selected" : "";
    const style = `class="fp-model-furniture${active}" ${attributes}`;
    if (item.kind === "rug") {
      for (const [index, vertices] of rugLayers(item).slice(0, draft ? 1 : void 0).entries()) {
        floors.push(spacePolygon(
          "polygon",
          vertices.map(([x, y, z]) => project(transform([x, y]), z)),
          `class="fp-model-rug${active}" ${attributes} data-layer="${index}"`
        ));
      }
      continue;
    }
    if (draft) {
      objects.push(...blockFaces(furnitureFootprint(item), item.base, item.base + item.height, `${style} data-surface="body"`));
      continue;
    }
    const { parts, faces } = furnitureMesh(item);
    if (item.kind !== "glass" && item.kind !== "curtain") {
      const reach2 = Math.min(0.32, item.height * 0.19);
      const cast = furnitureFootprint(item).map(([x, y]) => project([x + reach2 * light.cast[0], y + reach2 * light.cast[1]]));
      floorShadows.push(spacePolygon("polygon", cast));
      if (item.base <= 0.05) {
        const touches = parts.filter((part) => part.low <= 0.05);
        const contact = touches.length ? touches.map((part) => rectangle3(part.x, part.y, part.w, part.d).map(transform)) : [furnitureFootprint(item)];
        contactShadows.push(...contact.map((outline) => spacePolygon("polygon", outline.map((point3) => project(point3)))));
      }
    }
    for (const part of parts) {
      const corners = rectangle3(part.x, part.y, part.w, part.d).map(transform);
      objects.push(...blockFaces(
        corners,
        part.low,
        part.high,
        `${style} data-surface="${part.surface}"`
      ));
    }
    objects.push(...faces.map(({ vertices, surface, face }) => ({
      vertices: vertices.map(([x, y, z]) => [...transform([x, y]), z]),
      className: `fp-model-${face}`,
      attributes: `${style} data-surface="${surface}"`
    })));
  }
  for (const wall2 of plan2.walls) addWall([wall2.x, wall2.y], [wall2.endX, wall2.endY], null, wall2.id);
  for (const type of ["windows", "mirrors"]) for (const item of plan2[type] ?? []) {
    const room = plan2.rooms.find((entry) => entry.id === item.roomId);
    if (!room) continue;
    const angle2 = item.angle * Math.PI / 180;
    const a = [item.x, item.y], b = [item.x + Math.cos(angle2) * item.width, item.y + Math.sin(angle2) * item.width];
    const normal = inward(a, b);
    const [x, y] = shift(midpoint(a, b), normal, 0.025);
    const facing = contains(room, { x, y }) ? normal : normal.map((value) => -value);
    addWindow(
      a,
      b,
      room,
      facing,
      item.base,
      item.base + item.height,
      `fp-space-opening ${type}${item.id === selected2 ? " selected" : ""}`,
      `data-item="${item.id}"`
    );
  }
  const zones = (plan2.zones ?? []).map((item) => paintZone(item, (point3) => project(point3, 0.025), item.id === selected2)).join("");
  const swings = [];
  doors.forEach(([a, b], index) => {
    const door = plan2.doors[index];
    const pick = `${door.id === selected2 ? " selected" : ""}" data-item="${door.id}"`;
    const { height } = wallGeometry(a, b, plan2.rooms.find((room) => room.id === door.roomId) ?? null, inward(a, b));
    const turn = door.angle * Math.PI / 180;
    const swung = (share2) => [
      a[0] + door.width * (Math.cos(turn) * Math.sin(share2) + Math.sin(turn) * Math.cos(share2)),
      a[1] + door.width * (Math.sin(turn) * Math.sin(share2) - Math.cos(turn) * Math.cos(share2))
    ];
    const end2 = door.closed ? b : swung(0);
    const side = inward(a, end2);
    const leaf = [shift(a, side, -0.025), shift(end2, side, -0.025), shift(end2, side, 0.025), shift(a, side, 0.025)];
    objects.push(...blockFaces(leaf, 0, Math.min(doorHeight, Math.max(height, doorStub)), `class="fp-space-wall fp-space-door-leaf${pick}`));
    if (!door.closed) {
      swings.push(spacePolygon(
        "polyline",
        Array.from({ length: 13 }, (_, step2) => project(swung(step2 / 12 * Math.PI / 2))),
        `class="fp-space-door fp-space-door-swing${pick}`
      ));
    }
  });
  const openings = [...swings, ...doors.map((door, index) => spacePolygon(
    "polyline",
    door.map((point3) => project(point3)),
    `class="fp-space-door${plan2.doors[index].id === selected2 ? " selected" : ""}" data-item="${plan2.doors[index].id}"`
  ))];
  const shadowId = `fp-floor-clip-${sceneId}`;
  const interiorShadows = floorClip.length && !draft ? `<defs><clipPath id="${shadowId}">${floorClip.join("")}</clipPath></defs>
        <g class="fp-interior-shadow" clip-path="url(#${shadowId})">
            <g class="fp-wall-contact">${floorClip.join("")}</g>
            <g class="fp-furniture-shadow">${floorShadows.join("")}</g>
            <g class="fp-furniture-contact">${contactShadows.join("")}</g>
        </g>` : "";
  return {
    hasFurniture: furniture.length > 0,
    markup: `${draft ? "" : `<path class="fp-model-shadow" d="${shadows.join("")}"/>`}${paintFaces(bases, project, towardCamera2, light)}${floors.join("")}${interiorShadows}${floorOverlay}${zones}
            ${openings.join("")}${paintFaces(objects, project, towardCamera2, light)}`
  };
}
var floorSlabDepth, spacePolygon, midpoint, shift, inward, wallColor, rectangle3, wallModes, doorStub;
var init_floor_planner_maquette = __esm({
  "src/js/floor-planner-maquette.mjs"() {
    init_floor_planner_sight();
    init_floor_planner_model();
    init_floor_planner_depth();
    init_floor_planner_drawing();
    init_floor_planner_geometry();
    init_floor_planner_furniture();
    init_floor_planner_furniture_mesh();
    init_floor_planner_daylight();
    floorSlabDepth = 0.17;
    spacePolygon = (tag, points, attributes = "") => `<${tag} points="${points.map((point3) => point3.join(",")).join(" ")}" ${attributes}/>`;
    midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    shift = (point3, normal, amount) => [point3[0] + normal[0] * amount, point3[1] + normal[1] * amount];
    inward = (a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
      return [-dy / length, dx / length];
    };
    wallColor = (room) => room?.wallColor ? ` data-wall="${room.wallColor}"` : "";
    rectangle3 = (x, y, w, d) => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];
    wallModes = ["cutaway", "up", "down"];
    doorStub = 0.9;
  }
});

// src/js/floor-planner-stairs.mjs
function validStaircase(staircase, floors) {
  if (!staircase || !Number.isFinite(staircase.width) || staircase.width < 0.6 || staircase.width > 2.4) return false;
  const lower = floors.find((floor) => floor.id === staircase.lower);
  const upper = floors.find((floor) => floor.id === staircase.upper);
  if (!lower || upper?.level !== lower.level + 1) return false;
  const { bottom: bottom2, top: top2 } = staircase;
  if (![bottom2, top2].every((point3) => point3 && [point3.x, point3.y].every((value) => Number.isFinite(value) && Math.abs(value) <= 100))) return false;
  const run = Math.hypot(top2.x - bottom2.x, top2.y - bottom2.y);
  return run >= 1 && run <= 8;
}
function stairTrip(project) {
  const stair = project.staircase;
  if (!stair) return null;
  const up = project.activeFloor === stair.lower;
  if (!up && project.activeFloor !== stair.upper) return null;
  const from = project.floors.find((floor) => floor.id === project.activeFloor);
  const to = project.floors.find((floor) => floor.id === (up ? stair.upper : stair.lower));
  if (!from.plan.rooms.some((room) => roomContains(room, up ? stair.bottom : stair.top)) || !to?.plan.rooms.some((room) => roomContains(room, up ? stair.top : stair.bottom))) return null;
  return { from, to, up, stair };
}
function stairPoint({ bottom: bottom2, top: top2 }, fraction, side = 0) {
  const dx = top2.x - bottom2.x, dy = top2.y - bottom2.y;
  const length = Math.hypot(dx, dy);
  return { x: bottom2.x + dx * fraction - dy / length * side, y: bottom2.y + dy * fraction + dx / length * side };
}
function stairHeading(stair, up) {
  const direction2 = up ? 1 : -1;
  return Math.atan2(direction2 * (stair.top.x - stair.bottom.x), direction2 * (stair.bottom.y - stair.top.y)) * 180 / Math.PI;
}
function stairGait(stair, progress, rise, up, lane = 0) {
  const step2 = clamp2(progress) * stairSteps;
  const index = Math.min(stairSteps - 1, Math.floor(step2));
  const time = step2 - index;
  const run = Math.hypot(stair.top.x - stair.bottom.x, stair.top.y - stair.bottom.y);
  const station = (order) => {
    const number4 = up ? order : steps + 3 - order;
    if (number4 < 2) return { fraction: 0, height: 0 };
    if (number4 > steps + 1) return { fraction: 1, height: rise };
    return { fraction: onTread(number4 - 1.5), height: rise * (number4 - 1) / steps };
  };
  const from = station(index), support = station(index + 1), to = station(index + 2);
  const rootFraction = (support.fraction + mix(from.fraction, to.fraction, time)) / 2;
  const elevation = (support.height + mix(from.height, to.height, smooth(time))) / 2;
  const clearance2 = Math.max(from.height, to.height) + 0.064;
  const swingHeight = time < 0.32 ? mix(from.height, clearance2, smooth(time / 0.32)) : mix(clearance2, to.height, smooth((time - 0.79) / 0.21));
  const swingFraction = mix(from.fraction, to.fraction, smooth((time - 0.2) / 0.62));
  const direction2 = up ? 1 : -1;
  const foot = ({ fraction, height }) => ({
    ahead: (fraction - rootFraction) * run * direction2 - 0.03,
    height: height - elevation
  });
  const swing = foot({ fraction: swingFraction, height: swingHeight });
  const planted = foot(support);
  return {
    ...stairPoint(stair, rootFraction, lane),
    elevation,
    feet: index % 2 ? [planted, swing] : [swing, planted],
    phase: step2 / 2
  };
}
function stairWalls(stair) {
  const corners = [[start, -1], [start, 1], [end, 1], [end, -1]].map(([fraction, side]) => {
    const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
    return [x, y];
  });
  return corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
}
function insideStairwell({ bottom: bottom2, top: top2, width }, point3) {
  const dx = top2.x - bottom2.x, dy = top2.y - bottom2.y;
  const x = point3.x - bottom2.x, y = point3.y - bottom2.y;
  const length = Math.hypot(dx, dy);
  const fraction = (x * dx + y * dy) / (length * length);
  return fraction > start && fraction < end && Math.abs(y * dx - x * dy) < width * length / 2;
}
function stairSafeStart(trip, person) {
  if (!trip || !insideStairwell(trip.stair, person)) return person;
  return { ...person, ...stairPoint(trip.stair, trip.up ? 0 : 1) };
}
function paintStairPlan(stair, label, up) {
  const edge = (fraction, side) => {
    const { x: x2, y: y2 } = stairPoint(stair, fraction, side * stair.width / 2);
    return [x2, y2];
  };
  const footprint2 = [edge(start, -1), edge(start, 1), edge(end, 1), edge(end, -1)];
  const treads = Array.from({ length: steps - 1 }, (_, index) => {
    const [x1, y1] = edge(onTread(index + 1), -1), [x2, y2] = edge(onTread(index + 1), 1);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join("");
  const [a, b] = (up ? [0.28, 0.72] : [0.72, 0.28]).map((fraction) => edge(fraction, 0));
  const wing = (side) => stairPoint(stair, up ? 0.59 : 0.41, side * 0.2);
  const [left, right] = [-1, 1].map(wing);
  const [x, y] = edge(up ? 0.98 : 0.025, 0);
  return `<g class="fp-stair-plan" data-staircase pointer-events="none">${polygon(footprint2, "fp-stairwell")}${treads}
        <path d="M${a.join(" ")}L${b.join(" ")} M${left.x} ${left.y}L${b.join(" ")}L${right.x} ${right.y}"/>
        <text x="${x}" y="${y}" text-anchor="middle">${label}</text></g>`;
}
function stairOpening(stair, project, height) {
  return [[0.2, -1], [0.2, 1], [end, 1], [end, -1]].map(([fraction, side]) => {
    const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
    return project([x, y], height);
  });
}
function paintStairOpening(stair, project, height = 0) {
  return polygon(stairOpening(stair, project, height), "fp-stair-opening");
}
function paintStairOcclusion(stair, rooms, project, height, slabDepth, bounds) {
  const slab = rooms.flatMap((room) => {
    const outline = roomCorners(room);
    const top2 = outline.map((point3) => project(point3, height));
    const bottom2 = outline.map((point3) => project(point3, height - slabDepth));
    return [top2, bottom2, ...polygonEdges(top2).map(([a, b], index) => [a, b, bottom2[(index + 1) % bottom2.length], bottom2[index]])];
  });
  const { x, y, width, height: viewHeight } = bounds;
  const id = stairOcclusionId(stair);
  const mask = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${viewHeight}">
        <rect x="${x}" y="${y}" width="${width}" height="${viewHeight}" fill="white"/>
        <g fill="black">${slab.map((points) => polygon(points, "")).join("")}</g>
        <g fill="white">${polygon(stairOpening(stair, project, height), "")}</g>
    </mask></defs>`;
  return { id, mask };
}
function paintStairFlight(stair, project, base, rise, towardCamera2, occlusion = null) {
  const vertex = (fraction, side, height) => {
    const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
    return [x, y, base + height];
  };
  const projectVertex = ([x, y, z]) => project([x, y], z);
  const edge = (...args) => projectVertex(vertex(...args));
  const faces = Array.from({ length: steps }, (_, index) => {
    const a = onTread(index), b = onTread(index + 1);
    const lower = rise * index / steps, upper = rise * (index + 1) / steps;
    return [
      { vertices: [vertex(a, 1, lower), vertex(a, -1, lower), vertex(a, -1, upper), vertex(a, 1, upper)], className: "fp-stair-riser" },
      { vertices: [vertex(a, 1, upper), vertex(a, -1, upper), vertex(b, -1, upper), vertex(b, 1, upper)], className: "fp-stair-tread" },
      ...[-1, 1].map((side) => {
        const vertices = [
          vertex(a, side, lower - 0.09),
          vertex(b, side, upper - 0.09),
          vertex(b, side, upper),
          vertex(a, side, upper)
        ];
        return { vertices: side === 1 ? vertices.reverse() : vertices, className: "fp-stair-side" };
      })
    ];
  }).flat();
  const treads = depthOrder(faces, towardCamera2).map(({ vertices, className }) => polygon(vertices.map(projectVertex), className)).join("");
  const line = ([x1, y1], [x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const railHeight = 0.77;
  const railSplit = start + (end - start) * (rise - railHeight) / rise;
  const posts = [start, 0.5, end].map((fraction) => {
    const height = rise * (fraction - start) / (end - start);
    return { fraction, height };
  });
  const masked = occlusion ? ` mask="url(#${occlusion.id})"` : "";
  const railUnder = occlusion ? edge(railSplit, 1, rise) : edge(end, 1, rise + railHeight);
  const lowerPosts = posts.map(({ fraction, height }) => line(edge(fraction, 1, height), edge(fraction, 1, occlusion ? Math.min(rise, height + railHeight) : height + railHeight))).join("");
  const upperRail = occlusion ? posts.filter(({ height }) => height + railHeight > rise).map(({ fraction, height }) => line(edge(fraction, 1, rise), edge(fraction, 1, height + railHeight))).join("") + line(railUnder, edge(end, 1, rise + railHeight)) : "";
  return `${occlusion?.mask ?? ""}<g class="fp-stair-flight" data-staircase pointer-events="none">
        <g${masked}>${treads}</g><g data-stair-walkers=""></g><g data-stair-rail=""${masked}>${lowerPosts}${line(edge(start, 1, railHeight), railUnder)}</g>${upperRail}
    </g>`;
}
var floorStackHeight, polygon, steps, start, end, onTread, clamp2, smooth, mix, stairSteps, stairGaitDuration, stairOcclusionId;
var init_floor_planner_stairs = __esm({
  "src/js/floor-planner-stairs.mjs"() {
    init_floor_planner_depth();
    init_floor_planner_geometry();
    floorStackHeight = (level, base, separation2) => (level - base) * 4.2 * separation2;
    polygon = (points, className) => `<polygon class="${className}" points="${points.map((point3) => point3.join(",")).join(" ")}"/>`;
    steps = 13;
    start = 0.09;
    end = 0.91;
    onTread = (index) => start + (end - start) * index / steps;
    clamp2 = (value) => Math.min(1, Math.max(0, value));
    smooth = (value) => {
      const t = clamp2(value);
      return t * t * (3 - 2 * t);
    };
    mix = (a, b, t) => a + (b - a) * t;
    stairSteps = steps + 2;
    stairGaitDuration = (up) => stairSteps * (up ? 375 : 345);
    stairOcclusionId = (stair) => `fp-stair-occlusion-${stair.upper}`;
  }
});

// src/js/floor-planner-space.mjs
function orbitSpaceCamera(camera3, dx, dy) {
  return {
    yaw: (camera3.yaw + dx * 0.012) % (Math.PI * 2),
    tilt: Math.max(0.22, Math.min(1.23, camera3.tilt - dy * 8e-3))
  };
}
function projectSpace([x, y], height, { yaw, tilt }, rounded = true) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const u = x * cos - y * sin, v = x * sin + y * cos;
  const floorDepth = 0.866 * Math.sin(tilt);
  const vertical = 0.88 * Math.cos(tilt) / Math.cos(baseTilt);
  const point3 = [(u - v) * 0.866, (u + v) * floorDepth - height * vertical];
  return rounded ? point3.map((value) => Number(value.toFixed(3))) : point3;
}
function unprojectFloor([x, y], { yaw, tilt }) {
  const depth = y / (0.866 * Math.sin(tilt));
  const u = (x / 0.866 + depth) / 2, v = (depth - x / 0.866) / 2;
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  return [u * cos + v * sin, -u * sin + v * cos];
}
function towardCamera({ yaw, tilt }) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const vertical = 0.88 * Math.cos(tilt) / Math.cos(baseTilt);
  return [(cos + sin) * vertical, (cos - sin) * vertical, 2 * 0.866 * Math.sin(tilt)];
}
function paintCeilingSensor(item, room, height, project, towardViewer) {
  const ceiling2 = room?.ceiling;
  const axis = ceiling2?.direction ?? "x+";
  const rise = ceiling2?.type === "gable" ? ceilingPosition(room, item) < 0.5 : axis.endsWith("+");
  const pitch = ceiling2 && item.levelMountRoom !== room.id ? ceilingPitch(room) * Math.PI / 180 : 0;
  const cosine = Math.cos(pitch), sine = Math.sin(pitch) * (rise ? 1 : -1);
  const alongX = axis.startsWith("x");
  const [slopeX, slopeY] = alongX ? [sine, 0] : [0, sine];
  const radius = 0.19, thickness = 0.06;
  const points = sensorRing.map(([u, v]) => [
    item.x + u * radius * (alongX ? cosine : 1),
    item.y + v * radius * (alongX ? 1 : cosine),
    height + radius * (u * slopeX + v * slopeY)
  ]);
  const back = points.map(([x, y, z]) => project([x, y], z));
  const front = points.map(([x, y, z]) => project([x + slopeX * thickness, y + slopeY * thickness], z - cosine * thickness));
  const [vx, vy, vz] = towardViewer;
  const visibleFace = -vx * slopeX - vy * slopeY + vz * cosine >= 0 ? back : front;
  return spacePolygon("polygon", convexHull([...back, ...front]), 'class="fp-space-puck side"') + spacePolygon("polygon", visibleFace, 'class="fp-space-puck face"');
}
function paintWallSupport(item, height, project, wallTop) {
  const top2 = 0.23, bottom2 = wallTop - height;
  if (bottom2 >= top2) return "";
  const { x, y } = wallVector(item.angle);
  return spacePolygon("polygon", [[-0.32, bottom2], [0.32, bottom2], [0.32, top2], [-0.32, top2]].map(([side, up]) => project([item.x - y * side, item.y + x * side], height + up)), 'class="fp-wall-mount-support" fill="#bdb9ac"');
}
function paintSpace(plan2, camera3, selected2, {
  sensorHeight = sensorMountHeight,
  decorations = true,
  interactiveSensors = false,
  staircase = null,
  upperStair = false,
  coverage: coverage2 = null,
  sceneId,
  showWallMount = false,
  draft = false,
  wallMode: wallMode2,
  daylight: daylight2 = "studio"
} = {}) {
  let left = Infinity, top2 = Infinity, right = -Infinity, bottom2 = -Infinity;
  const include = ([x, y]) => {
    left = Math.min(left, x);
    top2 = Math.min(top2, y);
    right = Math.max(right, x);
    bottom2 = Math.max(bottom2, y);
  };
  const project = (position, height2 = 0) => {
    const point3 = projectSpace(position, height2, camera3);
    include(point3);
    return point3;
  };
  const selectedRoom = plan2.rooms.find((room) => room.id === selected2);
  const floorOverlay = coverage2?.floorOverlay ?? (decorations ? '<g id="fp-wall-coverage-space" pointer-events="none"></g>' : "");
  const direction2 = towardCamera(camera3);
  const light = daylightFor(daylight2);
  const model = paintMaquette(
    plan2,
    project,
    (normal) => projectSpace(normal, 0, { ...camera3, tilt: baseTilt })[1],
    direction2,
    selected2,
    floorOverlay,
    sceneId,
    { draft, wallMode: wallMode2, daylight: daylight2 }
  );
  const ceilings = plan2.rooms.filter((room) => room.ceiling || room === selectedRoom).map((room) => {
    const outline = roomCorners(room);
    const ceilingPoint = (point3) => project(point3, ceilingHeightAt(room, coordinates(...point3)));
    const ridge = room.ceiling?.type === "gable";
    const alongX = room.ceiling?.direction.startsWith("x");
    const ridgeEnds = alongX ? [[room.x + room.width / 2, room.y], [room.x + room.width / 2, room.y + room.depth]] : [[room.x, room.y + room.depth / 2], [room.x + room.width, room.y + room.depth / 2]];
    const [first, last] = ridgeEnds;
    const axis = alongX ? 0 : 1;
    const path2 = ridge ? polygonEdges(outline).flatMap(([a, b]) => {
      const t = (first[axis] - a[axis]) / (b[axis] - a[axis]);
      return t > 0 && t < 1 ? [a, a.map((value, i) => value + (b[i] - value) * t)] : [a];
    }) : outline;
    const ridges = ridge ? roomLineSpans(room, coordinates(...first), coordinates(...last)).map((span) => span.map((t) => first.map((value, i) => value + (last[i] - value) * t))) : [];
    const dropLines = [outline[0], outline[Math.floor(outline.length / 2)], ...ridges.flat()];
    return `<g class="fp-space-ceiling${room === selectedRoom ? " selected" : ""}">
            ${spacePolygon("polygon", path2.map(ceilingPoint))}
            ${ridges.map((line) => spacePolygon("polyline", line.map(ceilingPoint))).join("")}
            ${dropLines.map((point3) => spacePolygon("polyline", [project(point3), ceilingPoint(point3)])).join("")}
        </g>`;
  });
  const labels = plan2.rooms.filter((room) => Math.min(room.width, room.depth) >= 2).map((room) => {
    const label = roomInteriorPoint(room, { x: room.x + room.width / 2, y: room.y + room.depth * 0.68 });
    const [x, y] = project([label.x, label.y]);
    return `<text class="fp-space-room-label" x="${x}" y="${y}">${escapeText(room.name.length > 19 ? room.name.slice(0, 18) + "..." : room.name)}</text>`;
  });
  const markers = plan2.sensors.map((item, index) => {
    const { mount } = devices[item.model];
    const room = roomForDevice(plan2.rooms, item);
    const position = [item.x, item.y];
    const [x, y] = project(position);
    const height2 = sensorHeight(item, room);
    const [, top3] = project(position, height2);
    const badgeX = height2 ? x + 0.48 : x;
    if (height2) include([badgeX, top3]);
    const device = mount === "wall" && height2 ? paintDevice(item, height2, { project, towardCamera: direction2, sun: light.sun, dim: light.dim, furniture: plan2.furniture ?? [], fine: !draft }) : "";
    const standsFree = device && installationFor(item) === "freestanding";
    const facing = showWallMount && item.model === "wallsense" && room ? wallVector(item.angle) : null;
    const support = facing ? paintWallSupport(
      item,
      height2,
      project,
      cutawayWallHeight(room, projectSpace([facing.x, facing.y], 0, { ...camera3, tilt: baseTilt })[1])
    ) : "";
    return `<g class="fp-space-marker ${mount}${item.id === selected2 ? " selected" : ""}" data-item="${item.id}" ${interactiveSensors ? sensorMarkerAttributes(item, index) : ""}>
            ${height2 ? `${standsFree || facing ? "" : `<line x1="${x}" x2="${x}" y1="${y}" y2="${top3}"/><ellipse class="fp-space-anchor" cx="${x}" cy="${y}" rx=".13" ry=".075"/>`}
                ${mount === "ceiling" ? paintCeilingSensor(item, room, height2, project, direction2) : support + device}` : ""}
            <circle cx="${badgeX}" cy="${top3}" r=".29"/><text x="${badgeX}" y="${top3}">${String(index + 1).padStart(2, "0")}</text>
            ${interactiveSensors ? `<circle class="fp-sensor-focus" cx="${badgeX}" cy="${top3}" r=".37"/>` : ""}
        </g>`;
  });
  const stairs = staircase ? upperStair ? paintStairOpening(staircase, project) : paintStairFlight(staircase, project, 0, 2.7, direction2) : "";
  if (!Number.isFinite(left)) return null;
  const width = Math.max(2, right - left);
  const height = Math.max(2, bottom2 - top2);
  const padding = Math.max(0.85, Math.max(width, height) * 0.075);
  const view2 = { x: left - padding, y: top2 - padding, width: width + 2 * padding, height: height + 2 * padding };
  return {
    viewBox: Object.values(view2).join(" "),
    hasFurniture: model.hasFurniture,
    markup: `${decorations ? spaceGrid(camera3, view2) : ""}<g class="fp-daylight" data-daylight="${daylight2}">${model.markup}
            ${stairs}
            ${ceilings.join("")}</g>${coverage2?.beamOverlay ?? (decorations ? '<g id="fp-cone-space" pointer-events="none"></g>' : "")}
            ${labels.join("")}${markers.join("")}`
  };
}
function spaceGrid(camera3, view2) {
  const gridMatrix = [...projectSpace([1, 0], 0, camera3), ...projectSpace([0, 1], 0, camera3), 0, 0].join(" ");
  return `<defs>
        <filter id="fp-model-shadow" x="-20%" y="-25%" width="145%" height="155%"><feGaussianBlur stdDeviation=".30"/></filter>
        <filter id="fp-contact-shadow" x="-20%" y="-25%" width="140%" height="150%"><feGaussianBlur stdDeviation=".058"/></filter>
        <filter id="fp-cast-shadow" x="-20%" y="-25%" width="140%" height="150%"><feGaussianBlur stdDeviation=".115"/></filter>
        <pattern id="fp-space-grid" width="1" height="1" patternUnits="userSpaceOnUse"
            patternTransform="matrix(${gridMatrix})">
            <path d="M0 1V0H1" fill="none" stroke="#465563" stroke-width=".75" vector-effect="non-scaling-stroke"/>
        </pattern>
        <pattern id="fp-floor-boards" width="2.64" height=".81" patternUnits="userSpaceOnUse" patternTransform="matrix(${gridMatrix})">
            <path d="M0 .27H2.64V.54H0zM0 .54H.87v.27H0zM1.68 0H2.64V.27H1.68z" fill="#fff8e9" opacity=".13"/>
            <path d="M0 0H2.64M0 .27H2.64M0 .54H2.64M.54 0v.27M1.68 0v.27M.22 .27v.27M1.42 .27v.27M2.4 .27v.27M.87 .54v.27M2 .54v.27" fill="none" stroke="#665440" stroke-opacity=".23" stroke-width=".013"/>
            <path d="M.14 .083q.25 -.023 .32 .004m.31 .076q.35 .03 .68 .001m.32 -.042q.37 -.023 .75 0M.49 .386q.27 -.025 .72 0m.44 .05q.21 .026 .50 0M.14 .649q.22 .016 .55 -.002m.36 .047q.36 -.031 .76 0m.29 -.073q.21 .016 .38 0" fill="none" stroke="#785d42" stroke-opacity=".2" stroke-width=".012"/>
        </pattern>
        <pattern id="fp-floor-tiles" width=".64" height=".64" patternUnits="userSpaceOnUse" patternTransform="matrix(${gridMatrix})">
            <rect x=".018" y=".018" width=".604" height=".604" fill="#fff8ec" opacity=".18"/>
            <path d="M0 0H.64M0 0V.64" fill="none" stroke="#82786d" stroke-opacity=".33" stroke-width=".018"/>
        </pattern>
        </defs><rect x="${view2.x}" y="${view2.y}" width="${view2.width}" height="${view2.height}" fill="url(#fp-space-grid)" opacity=".18"/>`;
}
function paintBuilding(floors, camera3, separation2 = 1, staircase = null, paintCoverage = null, {
  selected: selected2 = null,
  sensorHeight,
  paintForeground,
  draft = false,
  wallMode: wallMode2,
  daylight: daylight2 = "studio"
} = {}) {
  const levels = [...floors].sort((a, b) => a.level - b.level);
  const base = levels[0]?.level ?? 0;
  const scenes = levels.flatMap((floor) => {
    const upperStair = staircase?.upper === floor.id;
    const scene = paintSpace(floor.plan, camera3, selected2, {
      decorations: false,
      staircase: upperStair ? staircase : null,
      upperStair,
      coverage: paintCoverage?.(floor, camera3),
      sensorHeight,
      sceneId: floor.id,
      draft,
      wallMode: wallMode2,
      daylight: daylight2
    });
    if (!scene) return [];
    const [x2, y2, width2, height2] = scene.viewBox.split(" ").map(Number);
    const [, offset2] = projectSpace([0, 0], floorStackHeight(floor.level, base, separation2), camera3);
    return [{ floor, scene, x: x2, y: y2, width: width2, height: height2, offset: offset2 }];
  });
  if (!scenes.length) return null;
  const x = Math.min(...scenes.map((scene) => scene.x)) - 0.35;
  const y = Math.min(...scenes.map((scene) => scene.y + scene.offset));
  const width = Math.max(...scenes.map((scene) => scene.x + scene.width)) - x;
  const labels = scenes.map((scene) => ({ floor: scene.floor, x: scene.x + 0.13, y: scene.y + scene.offset + 1.68 })).sort((a, b) => a.y - b.y);
  for (let index = 1; index < labels.length; index++) {
    labels[index].y = Math.max(labels[index].y, labels[index - 1].y + 0.44);
  }
  const height = Math.max(labels.at(-1).y + 0.35, ...scenes.map((scene) => scene.y + scene.offset + scene.height)) - y;
  const lower = scenes.find(({ floor }) => floor.id === staircase?.lower);
  const upper = scenes.find(({ floor }) => floor.id === staircase?.upper);
  const bounds = { x, y, width, height };
  let stairs = "";
  if (lower && upper) {
    const project = (point3, height2) => projectSpace(point3, height2, camera3);
    const stairBase = floorStackHeight(lower.floor.level, base, separation2);
    const rise = floorStackHeight(upper.floor.level, lower.floor.level, separation2);
    const occlusion = paintStairOcclusion(staircase, upper.floor.plan.rooms, project, stairBase + rise, floorSlabDepth, bounds);
    stairs = paintStairFlight(staircase, project, stairBase, rise, towardCamera(camera3), occlusion);
  }
  return {
    viewBox: [x, y, width, height].join(" "),
    hasFurniture: scenes.some(({ scene }) => scene.hasFurniture),
    markup: spaceGrid(camera3, bounds) + scenes.map(({ floor, scene, offset: offset2 }) => `<g data-building-floor="${floor.id}" transform="translate(0 ${offset2})">${scene.markup}${paintForeground?.(floor) ?? ""}</g>`).join("") + stairs + labels.map(({ floor, x: x2, y: y2 }) => `<text class="fp-building-label" data-floor-label="${floor.id}" x="${x2}" y="${y2}">${escapeText(floor.label)}</text>`).join("")
  };
}
var coordinates, baseTilt, defaultSpaceCamera, sensorRing;
var init_floor_planner_space = __esm({
  "src/js/floor-planner-space.mjs"() {
    init_floor_planner_ceiling();
    init_floor_planner_drawing();
    init_floor_planner_daylight();
    init_floor_planner_device_mesh();
    init_floor_planner_model();
    init_floor_planner_geometry();
    init_floor_planner_maquette();
    init_floor_planner_radar();
    init_floor_planner_stairs();
    coordinates = (x, y) => ({ x, y });
    baseTilt = Math.asin(0.42 / 0.866);
    defaultSpaceCamera = { yaw: 0, tilt: baseTilt };
    sensorRing = Array.from({ length: 32 }, (_, index) => {
      const angle2 = index * Math.PI * 2 / 32;
      return [Math.cos(angle2), Math.sin(angle2)];
    });
  }
});

// src/js/floor-planner-building.mjs
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
function sampleBuilding(names, furniture) {
  const ground = withFurniture(samplePlan(names), furniture);
  const upper = withFurniture(sampleUpperPlan(names), furniture);
  upper.furniture = upper.furniture.map((item, index) => ({ ...item, id: "furniture-example-upper-" + index }));
  return {
    format: buildingFormat,
    version: 1,
    name: names.sample,
    activeFloor: "ground",
    floors: [{ id: "ground", level: 0, name: null, plan: ground }, { id: "upper", level: 1, name: null, plan: upper }],
    staircase: { lower: "ground", upper: "upper", width: 0.94, bottom: { x: 5.8, y: 7.25 }, top: { x: 5.8, y: 4.78 } }
  };
}
function localizeSampleRooms(project, names, languages) {
  const building2 = project.format === buildingFormat;
  const plans = building2 ? project.floors.map((floor) => floor.plan) : [project];
  const legacyRooms = plans.flatMap((plan2) => plan2.rooms.filter((room) => sampleRoomIds.has(room.id) && room.useSampleName === void 0));
  let legacyNames;
  if (legacyRooms.length) {
    const hasTitle = (labels, title) => labels.sample === title || labels.legacy_sample === title;
    legacyNames = languages.find((labels) => hasTitle(labels, project.name)) ?? languages.find((labels) => plans.some((plan2) => hasTitle(labels, plan2.name)));
    if (!legacyNames && plans.some((plan2) => plan2.furniture?.some((item) => item.id.startsWith("furniture-example-")))) {
      const matches = languages.map((labels) => ({
        labels,
        count: legacyRooms.filter((room) => room.name === labels[room.id]).length
      })).sort((a, b) => b.count - a.count);
      if (matches[0]?.count > (matches[1]?.count ?? 0)) legacyNames = matches[0].labels;
    }
  }
  const localize = (plan2) => ({
    ...plan2,
    rooms: plan2.rooms.map((room) => {
      if (!sampleRoomIds.has(room.id)) return room;
      const useSampleName = room.useSampleName ?? (legacyNames && room.name === legacyNames[room.id]);
      if (useSampleName === void 0) return room;
      return { ...room, useSampleName, name: useSampleName ? names[room.id] : room.name };
    })
  });
  return building2 ? { ...project, floors: project.floors.map((floor) => ({ ...floor, plan: localize(floor.plan) })) } : localize(project);
}
function roomContents(plan2, room) {
  const edgeRoom = (door) => {
    const angle2 = door.angle * Math.PI / 180;
    const middle = { x: door.x + Math.cos(angle2) * door.width / 2, y: door.y + Math.sin(angle2) * door.width / 2 };
    return plan2.rooms.find((candidate) => contains(candidate, middle) || polygonEdges(roomCorners(candidate)).some(([a, b]) => {
      const onWall = edgePosition(a, b, middle);
      return Math.hypot(onWall.x - middle.x, onWall.y - middle.y) < 0.02;
    }))?.id;
  };
  return {
    rooms: [room],
    walls: plan2.walls.filter((item) => plan2.rooms.find((candidate) => contains(candidate, item) && contains(candidate, { x: item.endX, y: item.endY }))?.id === room.id),
    doors: plan2.doors.filter((item) => (item.roomId ?? edgeRoom(item)) === room.id),
    sensors: plan2.sensors.filter((item) => roomForDevice(plan2.rooms, item)?.id === room.id),
    furniture: (plan2.furniture ?? []).filter((item) => plan2.rooms.find((candidate) => contains(candidate, item))?.id === room.id),
    ...Object.fromEntries(["windows", "mirrors", "zones"].map((key) => [key, (plan2[key] ?? []).filter((item) => item.roomId === room.id)]))
  };
}
function translatedItem(item, dx, dy) {
  if (item.parts) return { ...item, parts: item.parts.map((part) => part.map(([x, y]) => [x + dx, y + dy])) };
  return {
    ...item,
    x: item.x + dx,
    y: item.y + dy,
    ...item.haFrame ? { haFrame: { ...item.haFrame, x: item.haFrame.x + dx, y: item.haFrame.y + dy } } : {},
    ...item.endX === void 0 ? {} : { endX: item.endX + dx, endY: item.endY + dy }
  };
}
function rotatedRoom(plan2, room) {
  const cx = room.x + room.width / 2, cy = room.y + room.depth / 2;
  const rotate = ([x, y]) => [cx + cy - y, cy + x - cx].map((value) => Number(value.toFixed(6)));
  const geometry = outlineBounds(roomCorners(room).map(rotate));
  if (!geometry) return null;
  const updated = { ...room, ...geometry };
  if (room.haFrame) {
    const [x, y] = rotate([room.haFrame.x, room.haFrame.y]);
    updated.haFrame = { ...room.haFrame, x, y, angle: (room.haFrame.angle + 90) % 360 };
  }
  if (!room.outline) delete updated.outline;
  if (room.priority) updated.priority = { x: 1 - room.priority.y, y: room.priority.x };
  if (room.ceiling) {
    const directions2 = ["x+", "y+", "x-", "y-"];
    const next = directions2[(directions2.indexOf(room.ceiling.direction) + 1) % directions2.length];
    updated.ceiling = { ...room.ceiling, direction: room.ceiling.type === "gable" ? next[0] + "+" : next };
  }
  const result = { ...plan2 };
  for (const [key, items] of Object.entries(roomContents(plan2, room))) {
    if (!items.length) continue;
    const ids = new Set(items.map((item) => item.id));
    result[key] = plan2[key].map((item) => {
      if (!ids.has(item.id)) return item;
      if (key === "rooms") return updated;
      if (item.parts) return { ...item, parts: item.parts.map((part) => part.map(rotate)) };
      const [x, y] = rotate([item.x, item.y]);
      const next = { ...item, x, y };
      if (item.endX !== void 0) [next.endX, next.endY] = rotate([item.endX, item.endY]);
      if (item.angle !== void 0) next.angle = (item.angle + 90) % 360;
      return next;
    });
  }
  return validPlan(result) ? result : null;
}
function moveRoomToFloor(project, room, destination) {
  const source = project.floors.find((floor) => floor.id === project.activeFloor);
  const target = project.floors.find((floor) => floor.id === destination);
  if (!source || !target || source === target) return null;
  const from = { ...source.plan }, to = { ...target.plan, version: Math.max(source.plan.version, target.plan.version) };
  for (const [key, items] of Object.entries(roomContents(source.plan, room))) {
    if (!items.length) continue;
    const ids = new Set(items.map((item) => item.id));
    from[key] = from[key].filter((item) => !ids.has(item.id));
    to[key] = [...to[key] ?? [], ...items];
  }
  const result = { ...project, activeFloor: destination, floors: project.floors.map((floor) => floor === source ? { ...floor, plan: from } : floor === target ? { ...floor, plan: to } : floor) };
  return validBuilding(result) ? result : null;
}
function wallOpeningPosition(edge, width, reversed = false) {
  const start3 = Math.max(0, Math.min(edge.length - width, edge.along - width / 2));
  const fraction = (start3 + (reversed ? width : 0)) / edge.length;
  return {
    width,
    angle: reversed ? edge.facing : edge.angle,
    x: edge.a[0] + (edge.b[0] - edge.a[0]) * fraction,
    y: edge.a[1] + (edge.b[1] - edge.a[1]) * fraction
  };
}
function roomOpening(room, item, width = item.width, { preserveDirection = false, minWidth = 0.1 } = {}) {
  const angle2 = item.angle * Math.PI / 180;
  const middle = { x: item.x + Math.cos(angle2) * item.width / 2, y: item.y + Math.sin(angle2) * item.width / 2 };
  const edge = roomWallEdges(room).map(([a, b]) => edgePosition(a, b, middle)).sort((a, b) => Math.hypot(a.x - middle.x, a.y - middle.y) - Math.hypot(b.x - middle.x, b.y - middle.y))[0];
  if (!edge || edge.length < minWidth) return item;
  const reversed = preserveDirection && Math.cos((item.angle - edge.angle) * Math.PI / 180) < 0;
  return { ...item, ...wallOpeningPosition(edge, Math.min(width, edge.length), reversed) };
}
function snapRoomOffset(room, rooms, dx, dy, tolerance = 0.14) {
  const edges = (item) => {
    const points = roomCorners(item);
    return points.flatMap((point3, i) => {
      const end2 = points[(i + 1) % points.length];
      return [0, 1].flatMap((axis) => Math.abs(point3[axis] - end2[axis]) < 1e-6 ? [{
        axis,
        position: point3[axis],
        start: Math.min(point3[1 - axis], end2[1 - axis]),
        end: Math.max(point3[1 - axis], end2[1 - axis])
      }] : []);
    });
  };
  const movingEdges = edges(room);
  const adjustment = [null, null];
  for (const fixed3 of rooms.filter((other) => other.id !== room.id).flatMap(edges)) {
    const offset2 = fixed3.axis === 0 ? dx : dy;
    const along = fixed3.axis === 0 ? dy : dx;
    for (const moving of movingEdges) {
      if (moving.axis !== fixed3.axis || moving.end + along < fixed3.start - tolerance || moving.start + along > fixed3.end + tolerance) continue;
      const gap2 = fixed3.position - moving.position - offset2;
      if (Math.abs(gap2) <= tolerance && (adjustment[fixed3.axis] === null || Math.abs(gap2) < Math.abs(adjustment[fixed3.axis]))) {
        adjustment[fixed3.axis] = gap2;
      }
    }
  }
  return { x: dx + (adjustment[0] ?? 0), y: dy + (adjustment[1] ?? 0) };
}
var buildingFormat, maxFloors, validProject, floorLabel;
var init_floor_planner_building = __esm({
  "src/js/floor-planner-building.mjs"() {
    init_floor_planner_model();
    init_floor_planner_furniture();
    init_floor_planner_geometry();
    init_floor_planner_stairs();
    buildingFormat = "smarthomeshop-building";
    maxFloors = 12;
    validProject = (value) => validPlan(value) || validBuilding(value);
    floorLabel = (floor, copy2) => floor.name || (floor.level === 0 ? copy2.floor_ground : copy2[floor.level > 0 ? "floor_upper" : "floor_lower"].replace(":level", Math.abs(floor.level)));
  }
});

// src/js/floor-planner-beam.mjs
function rimPoints(room, item, [rx, ry], sight = null) {
  const angle2 = item.angle * Math.PI / 180;
  const cos = Math.cos(angle2), sin = Math.sin(angle2);
  const edges = room.outline ? polygonEdges(roomCorners(room)) : null;
  const steps2 = sight ? 144 : 64;
  const height = sight ? sensorMountHeight(item, room) : 0;
  return Array.from({ length: steps2 }, (_, index) => {
    const t = index / steps2 * Math.PI * 2;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    const dx = x * cos - y * sin, dy = x * sin + y * cos;
    if (sight) {
      const distance4 = Math.hypot(dx, dy);
      const seen = Math.min(1, sightReach(sight, item, Math.atan2(dy, dx), { height }) / distance4);
      return [item.x + dx * seen, item.y + dy * seen];
    }
    if (edges) return roomRayEnd(room, item, { x: item.x + dx, y: item.y + dy }, edges);
    const wallX = dx >= 0 ? room.x + room.width : room.x;
    const wallY = dy >= 0 ? room.y + room.depth : room.y;
    const scale3 = Math.min(
      1,
      Math.abs(dx) < 1e-8 ? Infinity : (wallX - item.x) / dx,
      Math.abs(dy) < 1e-8 ? Infinity : (wallY - item.y) / dy
    );
    return [item.x + dx * scale3, item.y + dy * scale3];
  });
}
function coneOutline(foot, apex) {
  const sameWay = (points) => turning(points) < 0 ? [...points].reverse() : points;
  return [foot, ...foot.map((point3, index) => [apex, point3, foot[(index + 1) % foot.length]])].filter((points) => Math.abs(turning(points)) > 1e-6).map((points) => path(sameWay(points))).join("");
}
function cutPolygon(points, keep) {
  return points.flatMap((point3, index) => {
    const next = points[(index + 1) % points.length];
    const a = keep(point3), b = keep(next);
    const crossing2 = a < 0 !== b < 0 ? [[point3[0] + (next[0] - point3[0]) * a / (a - b), point3[1] + (next[1] - point3[1]) * a / (a - b)]] : [];
    return a >= 0 ? [point3, ...crossing2] : crossing2;
  });
}
function paintWallFan({ room, item, fields, sight = null }, camera3, height, plane, floorId = "") {
  const clip = `fp-wall-${plane}-${floorId ? floorId + "_" : ""}${item.id}`;
  const points = sight ? sightPolygon(sight, radarOrigin(item), { height: sensorMountHeight(item, room) }).map((point3) => point3.map((value) => Number(value.toFixed(3)))) : room.outline ? roomVisibility(room, radarOrigin(item)) : roomCorners(room);
  const matrix2 = [
    ...projectSpace([1, 0], 0, camera3, false),
    ...projectSpace([0, 1], 0, camera3, false),
    ...projectSpace([0, 0], height, camera3, false)
  ];
  const tilt = (item.tilt ?? 0) * Math.PI / 180;
  if (plane === "height" && tilt) {
    const turn = item.angle * Math.PI / 180;
    const [ax, ay, bx, by] = matrix2;
    const [, rise] = projectSpace([0, 0], 1, camera3, false);
    const flat = (x, y) => [ax * x + bx * y, ay * x + by * y];
    const side = flat(Math.cos(turn), Math.sin(turn));
    const ahead = flat(-Math.sin(turn) * Math.cos(tilt), Math.cos(turn) * Math.cos(tilt));
    const start3 = flat(item.x, item.y);
    const laid = [...side, ahead[0], ahead[1] + rise * Math.sin(tilt), start3[0], start3[1] + rise * height];
    const reach2 = Math.max(0, tilt > 0 ? height : room.height - height) / Math.sin(Math.abs(tilt));
    const local = cutPolygon(points.map(([x, y]) => {
      const dx = x - item.x, dy = y - item.y;
      return [dx * Math.cos(turn) + dy * Math.sin(turn), (-dx * Math.sin(turn) + dy * Math.cos(turn)) / Math.cos(tilt)];
    }), ([, ahead2]) => ahead2 + reach2).map((point3) => point3.map((value) => Number(value.toFixed(3))));
    return `<g class="fp-wall-fan" data-plane="${plane}" data-sensor="${item.id}" data-tilted transform="matrix(${laid.map((value) => Number(value.toFixed(4))).join(" ")})">
            <defs><clipPath id="${clip}"><polygon points="${local.map((point3) => point3.join(",")).join(" ")}"/></clipPath></defs>
            <g clip-path="url(#${clip})">
                ${fields.map((field2) => `<path class="fp-wall-sector" data-radar="${field2.radar}" data-secondary="${Boolean(field2.secondary)}" d="${beamSector(field2)}"/>`).join("")}
            </g>
        </g>`;
  }
  const shape = plane === "height" ? beamSector : wallSector;
  return `<g class="fp-wall-fan" data-plane="${plane}" data-sensor="${item.id}" transform="matrix(${matrix2.join(" ")})">
        <defs><clipPath id="${clip}"><polygon points="${points.map((point3) => point3.join(",")).join(" ")}"/></clipPath></defs>
        <g clip-path="url(#${clip})"><g transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
            ${fields.map((field2) => `<path class="fp-wall-sector" data-radar="${field2.radar}" data-secondary="${Boolean(field2.secondary)}" d="${shape(field2)}"/>`).join("")}
        </g></g>
    </g>`;
}
function paintWallCoverage(choices, camera3, floorId = "") {
  const sensors = /* @__PURE__ */ new Map();
  for (const { item, room, field: field2, sight } of choices) {
    if (field2.radii) continue;
    if (!sensors.has(item.id)) sensors.set(item.id, { item, room, sight, fields: [] });
    sensors.get(item.id).fields.push(field2);
  }
  return [...sensors.values()].map((sensor) => paintWallFan(sensor, camera3, 0, "floor", floorId)).join("");
}
function paintBeam({ room, item, field: field2, sight = null }, camera3, profile2, fillId = "fp-beam-fill") {
  if (!field2.radii) return paintWallFan({ room, item, fields: [field2], sight }, camera3, sensorMountHeight(item, room), "height");
  const floor = projectSpace([item.x, item.y], 0, camera3);
  const apex = projectSpace([item.x, item.y], ceilingHeightAt(room, item), camera3);
  const profiles = field2.profiles ? ceilingProfiles : ["seated"];
  const rings = profiles.map((name) => ({
    name,
    points: rimPoints(room, item, field2.profiles?.[name] ?? field2.radii, sight).map((point3) => projectSpace(point3, 0, camera3))
  }));
  const active = rings.find((ring2) => ring2.name === profile2) ?? rings[0];
  const bands = [0.38, 0.7].map((ratio) => path(active.points.map(([x, y]) => [apex[0] + (x - apex[0]) * ratio, apex[1] + (y - apex[1]) * ratio])));
  return `<defs><linearGradient id="${fillId}" gradientUnits="userSpaceOnUse"
        x1="${apex[0]}" y1="${apex[1]}" x2="${floor[0]}" y2="${floor[1]}">
        <stop class="fp-beam-near"/><stop class="fp-beam-far" offset="1"/>
        </linearGradient></defs>
        <path class="fp-beam-shell" ${field2.estimatedHeight ? "data-height-estimate" : ""} fill="url(#${fillId})" d="${sight ? coneOutline(active.points, apex) : path(convexHull([...active.points, apex]))}"/>
        ${bands.map((d) => `<path class="fp-beam-band" d="${d}"/>`).join("")}
        ${rings.slice().reverse().map((ring2) => `<path class="fp-beam-rim${ring2 === active ? " active" : ""}"
            ${field2.profiles ? `data-profile="${ring2.name}"` : ""} d="${path(ring2.points)}"/>`).join("")}`;
}
function paintFloorCoverage(floor, camera3, radarOptions) {
  const { id, plan: plan2 } = floor;
  const sight = prepareSight(plan2);
  const choices = plan2.sensors.flatMap((item) => {
    const room = roomForDevice(plan2.rooms, item);
    return radarFields(room, item, radarOptions).map((field2) => ({ item, room, field: field2, sight }));
  });
  const beams = choices.filter(({ field: field2 }) => field2.radii).map((choice2) => {
    const { item, field: field2 } = choice2;
    const fillId = `fp-stack-beam-${id}_${item.id}_${field2.radar}`;
    return `<g class="fp-stack-beam" data-sensor="${item.id}" data-radar="${field2.radar}" data-secondary="${Boolean(field2.secondary)}">
            ${paintBeam(choice2, camera3, "seated", fillId)}</g>`;
  }).join("");
  const wall2 = paintWallCoverage(choices, camera3, id);
  return {
    floorOverlay: wall2 ? `<g pointer-events="none">${wall2}</g>` : "",
    beamOverlay: beams ? `<g pointer-events="none">${beams}</g>` : ""
  };
}
var path, turning;
var init_floor_planner_beam = __esm({
  "src/js/floor-planner-beam.mjs"() {
    init_floor_planner_ceiling();
    init_floor_planner_model();
    init_floor_planner_radar();
    init_floor_planner_space();
    init_floor_planner_geometry();
    init_floor_planner_sight();
    path = (points) => "M" + points.map((point3) => point3.map((value) => Number(value.toFixed(3))).join(" ")).join("L") + "Z";
    turning = (points) => points.reduce((sum, [x, y], index) => {
      const [nextX, nextY] = points[(index + 1) % points.length];
      return sum + x * nextY - nextX * y;
    }, 0);
  }
});

// src/js/floor-planner-aim.mjs
function wallAhead(room, item) {
  if (!room) return Infinity;
  const { x, y } = wallVector(item.angle);
  const [endX, endY] = roomRayEnd(room, item, { x: item.x + x * 80, y: item.y + y * 80 });
  const distance4 = Math.hypot(endX - item.x, endY - item.y);
  return distance4 > 0.01 ? distance4 : Infinity;
}
function directionTo(item, point3, step2 = turnStep) {
  return wrapDegrees(snapped(Math.atan2(point3.x - item.x, item.y - point3.y) / degree3, step2));
}
function turnTo(item, point3, limit, step2 = turnStep) {
  const straight = item.angle - (item.pan ?? 0);
  return clamped(snapped(signedDegrees(directionTo(item, point3, 0) - straight), step2), -limit, limit);
}
function tiltTo(mount, { ahead, height }, step2 = turnStep) {
  return clamped(snapped(Math.atan2(mount - height, Math.max(ahead, 0.05)) / degree3, step2), sensorTilt.min, sensorTilt.max);
}
function heightTo(height, ceiling2 = 6) {
  return fixed(clamped(snapped(height, heightStep), 0.15, Math.min(6, ceiling2 - 0.1)));
}
function glyph(model) {
  const housing = deviceHousing(model) ?? deviceHousing("ultimatesensor-v2");
  return { width: housing.width * deviceScale, height: housing.height * deviceScale, depth: housing.depth * deviceScale, lens: housing.front === "dome" };
}
function aimTopView({ room, item, fields }) {
  const corners = room ? roomCorners(room) : [[item.x - 3, item.y - 3], [item.x + 3, item.y - 3], [item.x + 3, item.y + 3], [item.x - 3, item.y + 3]];
  const xs = corners.map(([x]) => x), ys = corners.map(([, y]) => y);
  const left = Math.min(...xs), top2 = Math.min(...ys);
  const width = Math.max(...xs) - left, depth = Math.max(...ys) - top2;
  const edge = Math.max(width, depth) * 0.07 + 0.3;
  const span = Math.max(width, depth);
  const scale3 = clamped(span / 2.7, 1.5, 5);
  const { width: side, depth: deep, lens } = glyph(item.model);
  const reach2 = clamped(span * 0.3, 1, 3.5);
  const outline = corners.map((corner) => corner.map(fixed).join(",")).join(" ");
  return {
    viewBox: [left - edge, top2 - edge, width + 2 * edge, depth + 2 * edge].map(fixed).join(" "),
    markup: `<defs><clipPath id="fp-aim-top-room"><polygon points="${outline}"/></clipPath></defs>
            ${room ? `<polygon class="fp-aim-room" points="${outline}"/>` : ""}
            <g clip-path="url(#fp-aim-top-room)"><g transform="translate(${fixed(item.x)} ${fixed(item.y)}) rotate(${fixed(item.angle)})">
                ${fields.map((field2) => `<path ${drawnField(field2)} d="${wallSector(field2)}"/>`).join("")}
            </g></g>
            <g transform="translate(${fixed(item.x)} ${fixed(item.y)}) rotate(${fixed(item.angle)})">
                <path class="fp-aim-line" d="M0 0V${fixed(-reach2)}"/>
                <g transform="scale(${fixed(scale3)})">
                    <rect class="fp-aim-device" x="${fixed(-side / 2)}" y="${fixed(-deep / 2)}" width="${fixed(side)}" height="${fixed(deep)}" rx="${fixed(deep * 0.24)}"/>
                    ${lens ? `<path class="fp-aim-device-lens" d="M${fixed(-side * 0.23)} ${fixed(-deep / 2)}a${fixed(side * 0.2)} ${fixed(side * 0.17)} 0 0 1 ${fixed(side * 0.4)} 0z"/>` : `<path class="fp-aim-device-light" d="M${fixed(-side * 0.3)} ${fixed(-deep / 2)}H${fixed(side * 0.3)}"/>`}
                </g>
                <circle class="fp-aim-handle" cy="${fixed(-reach2)}" r="${fixed(span * 0.028)}"/>
            </g>`,
    handle: { x: item.x + wallVector(item.angle).x * reach2, y: item.y + wallVector(item.angle).y * reach2 }
  };
}
function aimSideView({ room, item, fields, onWall }) {
  const mount = item.mountHeight ?? wallMountHeight, tilt = item.tilt ?? 0;
  const ceiling2 = Math.max(room?.height ?? 2.6, mount + 0.25);
  const wall2 = wallAhead(room, item);
  const primary = fields.find((field2) => !field2.secondary) ?? fields[0] ?? null;
  const end2 = Math.min(wall2, Math.max(4.5, ...fields.map((field2) => field2.range)));
  const { height: tall3, depth: deep, lens } = glyph(item.model);
  const back = -(deep / 2 + 0.12);
  const open = primary ? wallReach2(primary) : null;
  const reach2 = open && open.from < wall2 ? { from: open.from, to: Math.min(open.to, wall2) } : null;
  const person = Math.max(0.6, Math.min(2.5, end2 - 0.45));
  const seen = Boolean(primary) && person <= wall2 && fieldCoversPoint(primary, { x: 0, y: 0, angle: 0 }, { x: 0, y: -person }, "standing", 1.35);
  const beam = (field2) => {
    const low = -tilt - field2.pitch, high = -tilt + field2.pitch;
    const arc = Array.from({ length: 13 }, (_, index) => (low + (high - low) * index / 12) * degree3).map((angle2) => `${fixed(Math.cos(angle2) * field2.range)} ${fixed(-mount - Math.sin(angle2) * field2.range)}`);
    return `<path ${drawnField(field2)} d="M0 ${fixed(-mount)}L${arc.join("L")}Z"/>`;
  };
  const aim = -tilt * degree3;
  const handle = { ahead: Math.cos(aim) * handleReach, height: mount + Math.sin(aim) * handleReach };
  const left = back - 0.5, right = end2 + 0.4, top2 = -(ceiling2 + 0.3), bottom2 = 0.32;
  return {
    viewBox: [left, top2, right - left, bottom2 - top2].map(fixed).join(" "),
    reach: reach2,
    seen,
    frame: ({ x, y }) => ({ ahead: x, height: -y }),
    markup: `<defs><clipPath id="fp-aim-side-room"><rect x="0" y="${fixed(-ceiling2)}" width="${fixed(end2)}" height="${fixed(ceiling2)}"/></clipPath></defs>
            <path class="fp-aim-ceiling" d="M${fixed(onWall ? back : left)} ${fixed(-ceiling2)}H${fixed(end2)}"/>
            ${onWall ? `<rect class="fp-aim-wall" x="${fixed(back - 0.16)}" y="${fixed(-ceiling2)}" width=".16" height="${fixed(ceiling2)}"/>
                <path class="fp-aim-arm" d="M${fixed(back)} ${fixed(-mount)}H0"/>` : mount - tall3 / 2 > 0.08 ? `<rect class="fp-aim-cabinet" x="-.42" y="${fixed(-(mount - tall3 / 2))}" width=".84" height="${fixed(mount - tall3 / 2)}" rx=".03"/>` : ""}
            ${Number.isFinite(wall2) && wall2 <= end2 + 1e-6 ? `<rect class="fp-aim-wall" x="${fixed(end2)}" y="${fixed(-ceiling2)}" width=".16" height="${fixed(ceiling2)}"/>` : ""}
            <g clip-path="url(#fp-aim-side-room)">${[...fields].sort((a, b) => Boolean(b.secondary) - Boolean(a.secondary)).map(beam).join("")}</g>
            <path class="fp-aim-floor" d="M${fixed(left)} 0H${fixed(right)}"/>
            ${reach2 ? `<path class="fp-aim-reach" d="M${fixed(reach2.from)} 0H${fixed(reach2.to)}"/>` : ""}
            <g class="fp-aim-person" ${seen ? "data-seen" : ""} transform="translate(${fixed(person)} 0)">
                <circle cy="${fixed(-personHeight + 0.13)}" r=".13"/>
                <path d="M-.2 ${fixed(-personHeight + 0.34)}q0 -.05 .05 -.05h.3q.05 0 .05 .05v.62q0 .04 -.06 .04v.7q0 .05 -.05 .05h-.18q-.05 0 -.05 -.05v-.7q-.06 0 -.06 -.04z"/>
            </g>
            <path class="fp-aim-line" d="M0 ${fixed(-mount)}L${fixed(handle.ahead)} ${fixed(-handle.height)}"/>
            <g transform="translate(0 ${fixed(-mount)}) rotate(${fixed(tilt)})">
                <rect class="fp-aim-device" x="${fixed(-deep / 2)}" y="${fixed(-tall3 / 2)}" width="${fixed(deep)}" height="${fixed(tall3)}" rx="${fixed(deep * 0.24)}"/>
                <path class="fp-aim-device-light" d="M${fixed(deep / 2)} ${fixed(tall3 * 0.2)}V${fixed(tall3 * 0.34)}"/>
                ${lens ? `<path class="fp-aim-device-lens" d="M${fixed(deep / 2)} ${fixed(-tall3 * 0.42)}a${fixed(tall3 * 0.075)} ${fixed(tall3 * 0.1)} 0 0 1 0 ${fixed(tall3 * 0.2)}z"/>` : ""}
            </g>
            <circle class="fp-aim-handle" cx="${fixed(handle.ahead)}" cy="${fixed(-handle.height)}" r=".13"/>`
  };
}
function turnText(copy2, value, onBracket) {
  if (!onBracket) return `${Math.round(wrapDegrees(value))}°`;
  return value ? fill(value < 0 ? copy2.aim_left : copy2.aim_right, { value: String(Math.abs(Math.round(value))) }) : copy2.aim_straight;
}
function tiltText(copy2, value) {
  return value ? fill(value < 0 ? copy2.aim_up : copy2.aim_down, { value: String(Math.abs(Math.round(value))) }) : copy2.aim_level;
}
function motionReach(room, item, field2) {
  const reach2 = field2 && wallReach2(field2);
  return reach2 ? Math.min(reach2.to, wallAhead(room, item)) : null;
}
function reachText(copy2, reach2, number4 = String) {
  return reach2 ? fill(copy2.aim_reach, { from: number4(reach2.from), to: number4(reach2.to) }) : copy2.aim_reach_none;
}
var degree3, fixed, turnStep, heightStep, handleReach, personHeight, snapped, clamped, wrapDegrees, signedDegrees, onDevice, drawnField, fill;
var init_floor_planner_aim = __esm({
  "src/js/floor-planner-aim.mjs"() {
    init_floor_planner_device_mesh();
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_radar();
    degree3 = Math.PI / 180;
    fixed = (value) => Number(value.toFixed(3));
    turnStep = 5;
    heightStep = 0.05;
    handleReach = 1.3;
    personHeight = 1.75;
    snapped = (value, step2) => step2 ? Math.round(value / step2) * step2 : value;
    clamped = (value, low, high) => Math.max(low, Math.min(high, value));
    wrapDegrees = (value) => (value % 360 + 360) % 360;
    signedDegrees = (value) => wrapDegrees(value + 180) - 180;
    onDevice = (mount, { ahead, height }) => Math.hypot(ahead, height - mount) < 0.34;
    drawnField = (field2) => `class="fp-aim-field" data-radar="${field2.radar}" data-secondary="${Boolean(field2.secondary)}"`;
    fill = (text2, values) => Object.entries(values).reduce((line, [key, value]) => line.replaceAll(`:${key}`, value), text2 ?? "");
  }
});

// src/js/floor-planner-obstruction.mjs
function prepareFurnitureOcclusion(items) {
  return items.filter((item) => item.material !== "ignore").map((item) => {
    const angle2 = item.angle * Math.PI / 180;
    const cos = Math.cos(angle2), sin = Math.sin(angle2);
    const corners = furnitureFootprint(item);
    const xs = corners.map((point3) => point3[0]), ys = corners.map((point3) => point3[1]);
    return {
      id: item.id,
      name: item.name,
      kind: item.kind,
      hard: dense.has(item.material),
      parts: furnitureParts(item),
      bounds: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      local: ({ x, y, z }) => {
        const dx = x - item.x, dy = y - item.y;
        return [dx * cos + dy * sin, dy * cos - dx * sin, z];
      }
    };
  });
}
function boxEntry(from, to, part) {
  let enter = epsilon3;
  let exit = 1 - epsilon3;
  const lower = [part.x, part.y, part.low];
  const upper = [part.x + part.w, part.y + part.d, part.high];
  for (let axis = 0; axis < 3; axis++) {
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < epsilon3) {
      if (from[axis] <= lower[axis] || from[axis] >= upper[axis]) return null;
      continue;
    }
    const a = (lower[axis] - from[axis]) / delta, b = (upper[axis] - from[axis]) / delta;
    enter = Math.max(enter, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
    if (exit - enter <= epsilon3) return null;
  }
  return enter;
}
function traceRay(from, to, furniture) {
  let first = null;
  let hard = null;
  const left = Math.min(from.x, to.x), right = Math.max(from.x, to.x);
  const top2 = Math.min(from.y, to.y), bottom2 = Math.max(from.y, to.y);
  for (const object of furniture) {
    const [x1, y1, x2, y2] = object.bounds;
    if (right < x1 || left > x2 || bottom2 < y1 || top2 > y2) continue;
    const a = object.local(from), b = object.local(to);
    for (const part of object.parts) {
      const t = boxEntry(a, b, part);
      if (t === null) continue;
      const hit = { object, t, point: {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        z: from.z + (to.z - from.z) * t
      } };
      if (!first || t < first.t) first = hit;
      if (object.hard && (!hard || t < hard.t)) hard = hit;
    }
  }
  return { first, hard };
}
function furnitureOcclusion(from, person, height, furniture) {
  if (!furniture.length) return null;
  const rays = samples[person.pose].map((offset2) => traceRay(from, { x: person.x, y: person.y, z: height + offset2 }, furniture));
  const blocked = rays.every((ray) => ray.hard);
  const hit = blocked ? rays[1].hard : rays[1].first ?? rays.find((ray) => ray.first)?.first;
  return hit ? { status: blocked ? "blocked" : "shadow", id: hit.object.id, name: hit.object.name, point: hit.point } : null;
}
var dense, epsilon3, samples;
var init_floor_planner_obstruction = __esm({
  "src/js/floor-planner-obstruction.mjs"() {
    init_floor_planner_furniture();
    dense = /* @__PURE__ */ new Set(["metal", "stone"]);
    epsilon3 = 1e-6;
    samples = { standing: [-0.23, 0, 0.24], sitting: [-0.22, 0, 0.24], lying: [-0.08, 0, 0.1] };
  }
});

// src/js/floor-planner-avatar.mjs
function crossSection(center, axis, width, depth, ring2) {
  const reference = Math.abs(axis[1]) < 0.93 ? [0, 1, 0] : [0, 0, 1];
  const side = unit(subtract(reference, scale2(axis, dot3(reference, axis))));
  const front = cross2(axis, side);
  return ring2.map(([u, v]) => add(center, add(scale2(side, u * width), scale2(front, v * depth))));
}
function shell(rings, sections, addFace, { start: start3 = true, end: end2 = true } = {}) {
  const normals = rings.map((ring2, row) => {
    const earlier = rings[Math.max(0, row - 1)], later = rings[Math.min(rings.length - 1, row + 1)];
    return ring2.map((_, index) => {
      const around = subtract(ring2[(index + 1) % ring2.length], ring2[(index + ring2.length - 1) % ring2.length]);
      return unit(cross2(around, subtract(later[index], earlier[index])));
    });
  });
  if (start3) addFace([...rings[0]].reverse(), sections[0][3]);
  for (let section = 1; section < rings.length; section++) {
    const a = rings[section - 1], b = rings[section];
    const normalA = normals[section - 1], normalB = normals[section];
    for (let index = 0; index < a.length; index++) {
      const next = (index + 1) % a.length;
      addFace(
        [a[index], a[next], b[next], b[index]],
        sections[section][3],
        [normalA[index], normalA[next], normalB[next], normalB[index]]
      );
    }
  }
  if (end2) addFace(rings.at(-1), sections.at(-1)[3]);
}
function profile(start3, end2, sections, addFace, ring2 = limbRing) {
  const axis = unit(subtract(end2, start3));
  shell(sections.map(([position, width, depth]) => crossSection(mix2(start3, end2, position), axis, width, depth, ring2)), sections, addFace);
}
function bentProfile([start3, joint, end2], sections, addFace) {
  const center = (t) => t <= 0.5 ? mix2(start3, joint, 2 * t) : mix2(joint, end2, 2 * t - 1);
  const rings = sections.map(([t, width, depth]) => {
    const axis = unit(subtract(center(Math.min(1, t + 0.075)), center(Math.max(0, t - 0.075))));
    return crossSection(center(t), axis, width, depth, limbRing);
  });
  shell(rings, sections, addFace);
}
function step(phase, side) {
  const position = (phase + (side < 0 ? 0.5 : 0)) % 1;
  if (position < 0.61) return { reach: 0.315 - position * 1.04, lift: 0 };
  const swing = (position - 0.61) / 0.39;
  return { reach: -0.32 + (0.5 - 0.5 * Math.cos(swing * Math.PI)) * 0.635, lift: 0.105 * Math.sin(swing * Math.PI) ** 1.2 };
}
function standing(phase) {
  const moving = phase !== null;
  const bob = moving ? 0.012 * Math.cos(phase * Math.PI * 4) : 0;
  const sway = moving ? 0.016 * Math.sin(phase * Math.PI * 2) : 0.011;
  return {
    hips: [0, sway, 0.92 + bob],
    shoulders: [0.032, -sway * 0.45, 1.44 + bob],
    chin: [0.052, 0, 1.49 + bob],
    crown: [0.045, 0, 1.73 + bob],
    face: [1, 0, 0],
    leg(side) {
      const { reach: reach2, lift } = moving ? step(phase, side) : { reach: side * 0.03, lift: 0 };
      return [
        [0, side * 0.1 + sway, 0.94 + bob],
        [reach2 * 0.47 + 0.039 + lift * 0.6, side * 0.105, 0.51 + lift * 0.62],
        [reach2, side * 0.112, 0.085 + lift]
      ];
    },
    arm(side) {
      const swing = moving ? Math.cos((phase + (side < 0 ? 0.5 : 0)) * Math.PI * 2) : 0;
      return [
        [0.029 - swing * 0.023, side * 0.145 - sway * 0.45, 1.43 + bob],
        [-swing * 0.094 - 0.021, side * 0.194, 1.174 + bob],
        [-swing * 0.164 + 0.042, side * 0.192, 1.004 + bob + Math.max(0, -swing) * 0.038]
      ];
    },
    toes: [1, 0, 0]
  };
}
function kneeFor(hip, ankle) {
  const thigh = 0.463, shin = 0.445;
  const difference = subtract(ankle, hip);
  const distance4 = Math.hypot(...difference);
  const axis = scale2(difference, 1 / distance4);
  const forward = unit([-axis[2], 0, axis[0]]);
  const along = (thigh ** 2 - shin ** 2 + distance4 ** 2) / (2 * distance4);
  const bend = Math.sqrt(Math.max(0, thigh ** 2 - along ** 2));
  return add(add(hip, scale2(axis, along)), scale2(forward, bend));
}
function stairStance(phase, feet, size) {
  const body = standing(phase);
  const ankles = feet.map(({ ahead, height }, index) => [ahead / size, (index ? 1 : -1) * 0.109, 0.078 + height / size]);
  const hipHeight = Math.min(
    0.913 + 0.012 * Math.cos(phase * Math.PI * 4),
    ...ankles.map(([ahead, , z]) => z + Math.sqrt(Math.max(0.07, 0.89 ** 2 - (ahead - 0.02) ** 2)))
  );
  const adjust = ([x, y, z], lean = 0.045) => [x + lean, y, z + hipHeight - 0.94];
  return {
    ...body,
    hips: [0.02, 0, hipHeight - 0.018],
    shoulders: adjust(body.shoulders),
    shoeScale: 0.93,
    chin: adjust(body.chin),
    crown: adjust(body.crown),
    leg(side) {
      const hip = [0.02, side * 0.1, hipHeight];
      const ankle = ankles[side > 0 ? 1 : 0];
      return [hip, kneeFor(hip, ankle), ankle];
    },
    arm(side) {
      return body.arm(side).map((point3) => adjust(point3, 0.027));
    }
  };
}
function sittingOnCushion(height, size) {
  const lift = height / size - mix2(sitting.hips, sitting.shoulders, -0.23)[2];
  const raised = ([x, y, z], amount = lift) => [x, y, z + amount];
  return {
    ...sitting,
    hips: raised(sitting.hips),
    shoulders: raised(sitting.shoulders),
    chin: raised(sitting.chin),
    crown: raised(sitting.crown),
    leg(side) {
      const [hip, knee, ankle] = sitting.leg(side);
      return [raised(hip), raised(knee, lift * 0.55), ankle];
    },
    arm: (side) => sitting.arm(side).map((point3) => raised(point3))
  };
}
function blendPose(from, to, progress) {
  const joint = (name) => (side) => from[name](side).map((point3, index) => mix2(point3, to[name](side)[index], progress));
  return {
    ...from,
    hips: mix2(from.hips, to.hips, progress),
    shoulders: mix2(from.shoulders, to.shoulders, progress),
    chin: mix2(from.chin, to.chin, progress),
    crown: mix2(from.crown, to.crown, progress),
    face: unit(mix2(from.face, to.face, progress)),
    toes: unit(mix2(from.toes, to.toes, progress)),
    leg: joint("leg"),
    arm: joint("arm")
  };
}
function smokeStance(phase, time, animate) {
  const neutral = standing(null);
  const reaching = phase === "start" || phase === "fire";
  if (reaching) {
    const reach2 = {
      ...neutral,
      hips: [-0.08, 0, 0.87],
      shoulders: [0.22, 0, 1.32],
      chin: [0.3, 0, 1.35],
      crown: [0.4, 0, 1.56],
      face: [0.83, 0, -0.55],
      arm: (side) => side > 0 ? [[0.21, 0.145, 1.31], [0.43, 0.19, 1.14], [0.65, 0.12, 1.06]] : [[0.21, -0.145, 1.31], [0.03, -0.23, 1.11], [0.03, -0.23, 0.93]]
    };
    const progress = phase === "start" ? Math.min(1, time / 0.65) : 1 - Math.min(1, (time - 0.85) / 0.68);
    return blendPose(neutral, reach2, animate ? progress * progress * (3 - 2 * progress) : 0.65);
  }
  const wave = animate ? time * Math.PI * 4.6 : 0;
  const sway = Math.sin(wave * 0.54) * 0.055;
  const alarm = {
    ...neutral,
    hips: [-0.035, sway * 0.35, 0.9],
    shoulders: [-0.06, sway, 1.42],
    chin: [-0.055, sway * 1.3, 1.48],
    crown: [-0.055, sway * 1.4, 1.72],
    arm(side) {
      const pulse = Math.sin(wave + side * 0.91);
      return [
        [-0.055, side * 0.145 + sway, 1.42],
        [0.027, sway + side * (0.293 + 0.035 * pulse), 1.61 + 0.05 * pulse],
        [0.073, sway + side * (0.29 + 0.11 * pulse), 1.856 + 0.072 * pulse]
      ];
    }
  };
  return blendPose(neutral, alarm, animate ? Math.min(1, (time - 1.65) / 0.26) : 1);
}
function fallStance(progress) {
  const buckle = 0.37;
  if (progress <= buckle) return blendPose(standing(null), offBalance, (progress / buckle) ** 1.4);
  return blendPose(offBalance, fallen, ((progress - buckle) / (1 - buckle)) ** 1.6);
}
function skullAt(height) {
  const index = Math.max(1, skull.findIndex(([level]) => level >= height));
  const lower = skull[index - 1], upper = skull[index];
  const t = (height - lower[0]) / (upper[0] - lower[0]);
  return [
    height,
    lower[1] + (upper[1] - lower[1]) * t,
    lower[2] + (upper[2] - lower[2]) * t,
    lower[3] + (upper[3] - lower[3]) * t
  ];
}
function buildHead(pose, model, addFace, detailed) {
  const up = unit(subtract(pose.crown, pose.chin));
  const forward = unit(subtract(pose.face, scale2(up, dot3(up, pose.face))));
  const side = cross2(up, forward);
  const headPoint = (height, lateral, depth) => add(
    mix2(pose.crown, pose.chin, (1 - height) * (model.headHeight ?? 1)),
    add(scale2(side, lateral * model.head), scale2(forward, depth * model.head))
  );
  const ring2 = detailed ? headRing : bodyRing;
  const hairline = ([u, v]) => {
    const front = Math.max(0, u);
    const sweep = model.hair === "short" ? v * 0.085 : v * 0.053;
    return (model.hair === "long" ? 0.44 : 0.48) + 0.31 * front ** 1.8 + sweep * front;
  };
  const aroundHead = ([u, v], height, fullness = 0, lift = 0) => {
    const [, width, face2, back] = skullAt(height);
    return headPoint(height + lift, v * (width + fullness), u * ((u > 0 ? face2 : back) + fullness));
  };
  const skinBands = [0, 0.16, 0.36, 0.57, 0.72, 0.86, 1];
  const skin = skinBands.map((level) => ring2.map((angle2) => aroundHead(angle2, hairline(angle2) * level)));
  shell(skin, skinBands.map(() => [0, 0, 0, "skin"]), addFace, { end: false });
  const hairBands = [0, 0.25, 0.48, 0.68, 0.84, 1];
  const hair = hairBands.map((level) => ring2.map((angle2) => {
    const line = hairline(angle2);
    const wave = model.hair === "wavy" ? 0.014 + 4e-3 * Math.cos(angle2[1] * 19) : 0.012;
    const volume = wave * Math.sin(level * Math.PI * 0.91);
    return aroundHead(angle2, line + (1 - line) * level, volume, 0.032 * level);
  }));
  shell(hair, hairBands.map(() => [0, 0, 0, "hair"]), addFace, { start: false });
  if (model.hair === "long") {
    for (const direction2 of [-1, 1]) {
      const roots = headPoint(0.66, direction2 * 0.062, -0.059);
      const tip2 = add(pose.shoulders, add(scale2(side, direction2 * 0.112), scale2(forward, -0.051)));
      profile(roots, tip2, [
        [0, 0.052, 0.038, "hairLight"],
        [0.52, 0.06, 0.042, "hair"],
        [0.83, 0.047, 0.033, "hair"],
        [1, 0.016, 0.018, "hair"]
      ], addFace);
    }
  }
  const face = (lateral, height, lift) => {
    const [, width, depth] = skullAt(height);
    return headPoint(height, lateral, depth * Math.sqrt(Math.max(0, 1 - (lateral / width) ** 2)) + lift);
  };
  const patch = (outline, tone) => {
    const vertices = outline.map(([lateral, height, lift = 3e-3]) => face(lateral, height, lift));
    const normal = cross2(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0]));
    addFace(dot3(normal, forward) < 0 ? vertices.reverse() : vertices, tone);
  };
  const tip = [0, 0.44, 0.032];
  patch([[0, 0.648, 4e-3], [-0.018, 0.458, 9e-3], tip], "skin");
  patch([[0, 0.648, 4e-3], tip, [0.018, 0.458, 9e-3]], "skin");
  patch([[-0.018, 0.458, 9e-3], [-0.012, 0.405, 0.01], [0, 0.406, 0.019], tip], "warmth");
  patch([tip, [0, 0.406, 0.019], [0.012, 0.405, 0.01], [0.018, 0.458, 9e-3]], "warmth");
  if (!detailed) return;
  patch([
    [-0.025, 0.282],
    [-0.01, 0.301, 6e-3],
    [0, 0.287, 7e-3],
    [0.01, 0.301, 6e-3],
    [0.025, 0.282],
    [0, 0.257, 7e-3]
  ], "lips");
  for (const direction2 of [-1, 1]) {
    const outer = (value, height, lift) => [direction2 * value, height, lift];
    patch([
      outer(0.02, 0.565, 5e-3),
      outer(0.034, 0.596, 7e-3),
      outer(0.051, 0.586, 6e-3),
      outer(0.059, 0.569, 4e-3),
      outer(0.038, 0.552, 7e-3)
    ], "eye");
    patch([
      outer(0.034, 0.556, 0.01),
      outer(0.031, 0.575, 0.011),
      outer(0.037, 0.593, 0.01),
      outer(0.043, 0.585, 0.01),
      outer(0.045, 0.562, 0.01)
    ], "iris");
    patch([
      outer(0.035, 0.562, 0.014),
      outer(0.034, 0.582, 0.014),
      outer(0.041, 0.581, 0.014),
      outer(0.041, 0.563, 0.014)
    ], "pupil");
    patch([
      outer(0.019, 0.624, 6e-3),
      outer(0.031, 0.652, 7e-3),
      outer(0.051, 0.651, 7e-3),
      outer(0.063, 0.627, 6e-3),
      outer(0.033, 0.63, 9e-3)
    ], "brow");
    const ear = headPoint(0.41, direction2 * 0.084, -7e-3);
    profile(ear, add(ear, scale2(up, 0.052)), [
      [0, 6e-3, 7e-3, "skinFold"],
      [0.36, 0.014, 0.012, "warmth"],
      [0.7, 0.013, 0.013, "skin"],
      [1, 6e-3, 7e-3, "skin"]
    ], addFace);
  }
}
function buildBody(pose, addFace, model, detailed) {
  const tube = (a, b, width, depth, endWidth, endDepth, color2) => profile(a, b, [[0, width, depth, color2], [1, endWidth, endDepth, color2]], addFace);
  const widths = (sections, factor) => sections.map(([t, width, depth, tone]) => [t, width * factor, depth * factor, tone]);
  profile(pose.hips, pose.shoulders, widths([
    [0, 0.131, 0.09, "hem"],
    [0.065, 0.153, 0.102, "hem"],
    [0.21, 0.15, 0.105, "jacket"],
    [0.43, 0.138, 0.097, "jacket"],
    [0.7, 0.163, 0.112, "jacket"],
    [0.87, 0.178, 0.104, "jacket"],
    [0.96, 0.134, 0.083, "jacket"],
    [1, 0.101, 0.07, "shoulder"]
  ], model.torso), addFace, bodyRing);
  profile(mix2(pose.hips, pose.shoulders, -0.23), mix2(pose.hips, pose.shoulders, 0.05), widths([
    [0, 0.089, 0.059, "pants"],
    [0.35, 0.137, 0.087, "pants"],
    [0.72, 0.148, 0.097, "pants"],
    [1, 0.141, 0.092, "pants"]
  ], model.torso), addFace, bodyRing);
  profile(mix2(pose.shoulders, pose.chin, -0.13), mix2(pose.shoulders, pose.chin, 0.96), [
    [0, 0.066, 0.06, "shirt"],
    [0.25, 0.058, 0.056, "shirt"],
    [0.44, 0.047, 0.045, "skin"],
    [1, 0.047, 0.044, "skin"]
  ], addFace);
  buildHead(pose, model, addFace, detailed);
  if (detailed && model.hair !== "long") {
    const chest = unit(subtract(pose.shoulders, pose.hips));
    const forward = unit(subtract(pose.face, scale2(chest, dot3(chest, pose.face))));
    const lateral = cross2(chest, forward);
    const seam = (height, width, depth) => add(
      mix2(pose.hips, pose.shoulders, height),
      add(scale2(forward, depth * model.torso), scale2(lateral, width))
    );
    const zip = [[0.09, 0.103], [0.23, 0.109], [0.42, 0.102], [0.69, 0.117], [0.86, 0.111], [0.99, 0.078]];
    for (let index = 1; index < zip.length; index++) {
      const [bottom2, lowerDepth] = zip[index - 1], [top2, upperDepth] = zip[index];
      addFace([
        seam(bottom2, -4e-3, lowerDepth),
        seam(bottom2, 4e-3, lowerDepth),
        seam(top2, 4e-3, upperDepth),
        seam(top2, -4e-3, upperDepth)
      ], "seam");
    }
  }
  for (const side of [-1, 1]) {
    const leg = pose.leg(side);
    const ankle = leg.at(-1);
    bentProfile(leg, widths([
      [0, 0.088, 0.094, "pants"],
      [0.17, 0.089, 0.093, "pants"],
      [0.4, 0.062, 0.063, "pants"],
      [0.52, 0.055, 0.06, "pants"],
      [0.72, 0.058, 0.059, "pants"],
      [0.9, 0.04, 0.047, "pants"],
      [1, 0.038, 0.043, "pants"]
    ], model.limbs), addFace);
    const foot = add(ankle, [0, 0, -0.032]);
    const shoeScale = (pose.shoeScale ?? 1) * (model.size < 0.9 ? 1.04 : model.torso);
    const heel = add(foot, scale2(pose.toes, -0.065 * shoeScale)), toe = add(foot, scale2(pose.toes, 0.132 * shoeScale));
    profile(add(heel, [0, 0, -0.031]), add(toe, [0, 0, -0.031]), widths([
      [0, 0.042, 0.01, "sole"],
      [0.16, 0.052, 0.014, "sole"],
      [0.83, 0.054, 0.012, "sole"],
      [1, 0.035, 9e-3, "sole"]
    ], shoeScale), addFace);
    profile(heel, toe, widths([
      [0, 0.041, 0.026, "shoe"],
      [0.22, 0.052, 0.043, "shoe"],
      [0.52, 0.055, 0.034, "shoe"],
      [0.83, 0.051, 0.026, "toe"],
      [1, 0.032, 0.014, "toe"]
    ], shoeScale), addFace);
    const arm = pose.arm(side).map(([x, y, z]) => [x, y * model.torso, z]);
    const [, elbow, wrist] = arm;
    bentProfile(arm, widths([
      [0, 0.033, 0.039, "jacket"],
      [0.13, 0.058, 0.061, "jacket"],
      [0.32, 0.051, 0.055, "jacket"],
      [0.51, 0.039, 0.046, "jacket"],
      [0.7, 0.043, 0.044, "jacket"],
      [0.91, 0.035, 0.034, "jacket"],
      [0.96, 0.034, 0.034, "hem"],
      [1, 0.032, 0.031, "hem"]
    ], model.limbs), addFace);
    const hand = unit(subtract(wrist, elbow));
    const palm = add(wrist, scale2(hand, 0.027));
    profile(wrist, add(wrist, scale2(hand, 0.082)), widths([
      [0, 0.024, 0.024, "skin"],
      [0.34, 0.033, 0.024, "skin"],
      [0.72, 0.027, 0.017, "warmth"],
      [1, 0.016, 0.01, "skin"]
    ], model.limbs), addFace);
    if (detailed) {
      const thumb = add(palm, [0, -side * 0.018, 0]);
      const end2 = add(add(thumb, scale2(hand, 0.023)), [0.017, -side * 9e-3, 0]);
      tube(thumb, end2, 0.013 * model.limbs, 0.011, 8e-3, 7e-3, "skin");
    }
  }
}
function gradientPrefix(person, camera3) {
  const key = [person.avatar, person.id, person.x, person.y, person.heading, person.elevation, person.pose, person.seatHeight, camera3.yaw, camera3.tilt].join("|");
  let hash = 0;
  for (const character of key) hash = Math.imul(hash, 31) + character.charCodeAt(0) | 0;
  return `fp-avatar-light-${(hash >>> 0).toString(36)}-`;
}
function paintAvatar(person, camera3, animate, detailed = true, occlusion = null) {
  const model = figures[person.avatar] ?? figures.man;
  const { palette, size } = model;
  const floorHeight = occlusion ? (occlusion.height - (person.elevation ?? 0)) / size : 0;
  const heading = person.heading * Math.PI / 180;
  const sin = Math.sin(heading), cos = Math.cos(heading);
  const project = ([ahead, side, z]) => projectSpace([
    person.x + size * (ahead * sin + side * cos),
    person.y + size * (-ahead * cos + side * sin)
  ], z * size + (person.elevation ?? 0), camera3);
  const yaw = camera3.yaw + Math.PI / 4;
  const viewX = Math.sin(yaw) * Math.cos(camera3.tilt);
  const viewY = Math.cos(yaw) * Math.cos(camera3.tilt);
  const view2 = [viewX * sin - viewY * cos, viewX * cos + viewY * sin, Math.sin(camera3.tilt)];
  const light = unit([-0.42 * sin + 0.43 * cos, -0.42 * cos - 0.43 * sin, 0.8]);
  const faces = [];
  const gradients = [];
  const prefix = detailed ? gradientPrefix(person, camera3) : "";
  const projected = /* @__PURE__ */ new WeakMap();
  const point3 = (vertex) => {
    if (!projected.has(vertex)) {
      const [x, y] = project(vertex);
      projected.set(vertex, { x, y, xy: `${x},${y}` });
    }
    return projected.get(vertex);
  };
  const intensity = (normal) => 0.79 + Math.max(0, dot3(normal, light)) * 0.25 + 0.05 * Math.max(0, dot3(normal, view2));
  const polygon2 = (vertices, fill3) => `<polygon points="${vertices.map((vertex) => point3(vertex).xy).join(" ")}" fill="${fill3}" stroke="${fill3}"/>`;
  const addFace = (vertices, tone, normals) => {
    const normal = unit(cross2(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0])));
    if (!(dot3(normal, view2) > 1e-3)) return;
    const points = vertices.map(point3);
    const levels = normals?.map(intensity) ?? [intensity(normal)];
    let fill3 = color(palette[tone], levels.reduce((sum, value) => sum + value, 0) / levels.length);
    if (detailed && levels.length > 1) {
      const lo = Math.min(...levels), hi = Math.max(...levels);
      const a = points[levels.indexOf(lo)], b = points[levels.indexOf(hi)];
      if (hi - lo >= 0.029 && Math.hypot(b.x - a.x, b.y - a.y) >= 0.016) {
        const id = prefix + gradients.length;
        gradients.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><stop stop-color="${color(palette[tone], lo)}"/><stop offset="1" stop-color="${color(palette[tone], hi)}"/></linearGradient>`);
        fill3 = `url(#${id})`;
      }
    }
    const [below, above] = occlusion ? splitVerticesAtHeight(vertices, floorHeight) : [[], vertices];
    faces.push({
      depth: vertices.reduce((sum, vertex) => sum + dot3(vertex, view2), 0) / vertices.length,
      below: below.length ? polygon2(below, fill3) : "",
      above: above.length ? polygon2(above, fill3) : ""
    });
  };
  const phase = person.moving && animate ? (person.stride ?? 0) / 1.04 : null;
  const climbing = Boolean(person.feet && animate);
  const onCushion = person.pose === "sitting" && Number.isFinite(person.seatHeight);
  const pose = climbing ? stairStance(person.phase, person.feet, size) : person.fallProgress !== void 0 ? fallStance(animate ? person.fallProgress : Number(person.pose === "lying")) : person.smokePhase ? smokeStance(person.smokePhase, person.smokeTime, animate) : person.sitProgress !== void 0 ? blendPose(standing(null), sitting, person.sitProgress) : person.pose === "standing" ? standing(phase) : onCushion ? sittingOnCushion(person.seatHeight, size) : person.pose === "sitting" ? sitting : lying;
  buildBody(pose, addFace, model, detailed);
  const onFloor = person.pose === "lying";
  const shadowCenter = onFloor ? person.activity === "fall" ? 0.17 : -0.17 : onCushion ? 0.36 : 0.035;
  const shadow = bodyRing.map(([x, y]) => project([
    shadowCenter + x * (onFloor ? 0.86 : 0.35),
    0.04 + y * (onFloor ? 0.29 : 0.23),
    0
  ]).join(",")).join(" ");
  const [floorX, floorY] = project([onCushion ? shadowCenter : 0, 0, 0]);
  const base = `<polygon class="fp-avatar-shadow" points="${shadow}"/>
        <ellipse class="fp-person-base" cx="${floorX}" cy="${floorY}" rx="${0.35 * size}" ry="${0.15 * size}"/>`;
  faces.sort((a, b) => a.depth - b.depth);
  const lowerMesh = faces.map((face) => face.below).join("");
  const upperMesh = faces.map((face) => face.above).join("");
  const belowFloor = occlusion && floorHeight > 0;
  const plumbob = person.plumbob ? paintPlumbob(project([pose.crown[0], 0, pose.crown[2] + 0.36 / size]), person.plumbob) : "";
  return `<g class="fp-person-space" data-avatar="${person.avatar ?? "man"}" data-pose="${person.pose}" data-activity="${person.activity ?? ""}" ${person.active ? "data-active" : ""} ${climbing ? "data-stair-gait" : ""} aria-hidden="true">
        ${gradients.length ? `<defs>${gradients.join("")}</defs>` : ""}
        ${!belowFloor ? base : ""}
        ${belowFloor || lowerMesh ? `<g mask="url(#${occlusion.id})">${belowFloor ? base : ""}<g class="fp-avatar-mesh">${lowerMesh}</g></g>` : ""}
        <g class="fp-avatar-mesh">${upperMesh}</g>${plumbob}
    </g>`;
}
function paintPlumbob([x, y], status) {
  const half = 0.085, tip = 0.15;
  const top2 = `${x},${y - tip}`, bottom2 = `${x},${y + tip}`;
  return `<g class="fp-plumbob" data-status="${status}"><g class="fp-plumbob-gem">
        <polygon class="fp-plumbob-lit" points="${top2} ${bottom2} ${x - half},${y}"/>
        <polygon class="fp-plumbob-shade" points="${top2} ${x + half},${y} ${bottom2}"/>
        <path class="fp-plumbob-edge" d="M${x - half} ${y}H${x + half}"/></g></g>`;
}
var tones, womanTones, childTones, figures, mix2, add, subtract, scale2, dot3, cross2, unit, angles, limbRing, bodyRing, headRing, sitting, lying, offBalance, mirror, fallen, skull, color;
var init_floor_planner_avatar = __esm({
  "src/js/floor-planner-avatar.mjs"() {
    init_floor_planner_space();
    init_floor_planner_depth();
    tones = {
      jacket: [183, 137, 94],
      shoulder: [187, 144, 101],
      hem: [136, 99, 70],
      shirt: [238, 229, 209],
      seam: [123, 89, 61],
      pants: [83, 102, 120],
      shoe: [55, 59, 63],
      toe: [75, 80, 82],
      sole: [208, 201, 182],
      skin: [226, 176, 144],
      warmth: [218, 158, 130],
      skinFold: [176, 121, 100],
      lips: [173, 104, 95],
      eye: [236, 225, 211],
      iris: [83, 101, 93],
      pupil: [46, 43, 42],
      brow: [83, 55, 44],
      hair: [65, 45, 38],
      hairLight: [80, 57, 46]
    };
    womanTones = {
      ...tones,
      jacket: [122, 154, 139],
      shoulder: [136, 165, 147],
      hem: [94, 127, 113],
      seam: [99, 135, 119],
      pants: [68, 76, 94],
      shoe: [172, 150, 131],
      toe: [188, 168, 150],
      skin: [205, 150, 115],
      warmth: [197, 137, 105],
      skinFold: [154, 96, 78],
      lips: [153, 86, 83],
      iris: [103, 78, 58],
      hair: [47, 35, 32],
      hairLight: [62, 43, 37]
    };
    childTones = {
      ...tones,
      jacket: [141, 128, 182],
      shoulder: [153, 139, 194],
      hem: [110, 97, 150],
      seam: [102, 90, 138],
      pants: [89, 101, 123],
      shoe: [103, 117, 153],
      toe: [125, 138, 170],
      skin: [238, 190, 154],
      warmth: [229, 171, 143],
      hair: [104, 73, 47],
      hairLight: [122, 87, 54]
    };
    figures = {
      man: { palette: tones, size: 1, torso: 1, limbs: 1, head: 1, hair: "short" },
      woman: { palette: womanTones, size: 0.94, torso: 0.9, limbs: 0.88, head: 0.96, hair: "long" },
      child: { palette: childTones, size: 0.72, torso: 0.89, limbs: 0.88, head: 1.13, headHeight: 1.14, hair: "wavy" }
    };
    mix2 = ([x, y, z], [a, b, c], t) => [x + (a - x) * t, y + (b - y) * t, z + (c - z) * t];
    add = ([x, y, z], [a, b, c]) => [x + a, y + b, z + c];
    subtract = ([x, y, z], [a, b, c]) => [x - a, y - b, z - c];
    scale2 = ([x, y, z], amount) => [x * amount, y * amount, z * amount];
    dot3 = ([x, y, z], [a, b, c]) => x * a + y * b + z * c;
    cross2 = ([x, y, z], [a, b, c]) => [y * c - z * b, z * a - x * c, x * b - y * a];
    unit = (vector) => scale2(vector, 1 / (Math.hypot(...vector) || 1));
    angles = (count) => Array.from({ length: count }, (_, index) => {
      const angle2 = index / count * Math.PI * 2;
      return [Math.cos(angle2), Math.sin(angle2)];
    });
    limbRing = angles(9);
    bodyRing = angles(12);
    headRing = angles(18);
    sitting = {
      hips: [-0.09, 0, 0.48],
      shoulders: [-8e-3, 0, 0.984],
      chin: [0.028, 0, 1.03],
      crown: [0.022, 0, 1.265],
      face: [1, 0, 0],
      leg: (side) => [[-0.08, side * 0.1, 0.48], [0.331, side * 0.129, 0.46], [0.307, side * 0.139, 0.085]],
      arm: (side) => [[-0.02, side * 0.147, 0.975], [0.095, side * 0.206, 0.714], [0.263, side * 0.16, 0.561]],
      toes: [1, 0, 0]
    };
    lying = {
      hips: [-0.235, 0, 0.128],
      shoulders: [0.291, 0, 0.143],
      chin: [0.358, 0, 0.123],
      crown: [0.592, 0, 0.145],
      face: [0, 0, 1],
      leg: (side) => [[-0.218, side * 0.096, 0.134], [-0.592, side * 0.13, side === 1 ? 0.17 : 0.092], [-0.938, side * 0.15, 0.078]],
      arm: (side) => [[0.288, side * 0.146, 0.143], [0.031, side * 0.245, 0.092], [-0.121, side * 0.208, 0.081]],
      toes: [-0.61, 0, 0.79]
    };
    offBalance = {
      hips: [-0.09, 0, 0.85],
      shoulders: [-0.31, 0, 1.34],
      chin: [-0.31, 0, 1.42],
      crown: [-0.43, 0, 1.63],
      face: [0.88, 0, 0.48],
      leg: (side) => [
        [-0.09, side * 0.1, 0.86],
        [0.2, side * 0.13, 0.5],
        [side > 0 ? 0.22 : -0.24, side * 0.14, 0.085]
      ],
      arm: (side) => [
        [-0.27, side * 0.145, 1.34],
        [-0.12, side * 0.29, 1.22],
        [0.08, side * 0.38, 1.28]
      ],
      toes: [1, 0, 0]
    };
    mirror = ([x, y, z]) => [-x, y, z];
    fallen = {
      hips: mirror(lying.hips),
      shoulders: mirror(lying.shoulders),
      chin: mirror(lying.chin),
      crown: mirror(lying.crown),
      face: lying.face,
      toes: mirror(lying.toes),
      leg: (side) => lying.leg(side).map(mirror),
      arm: (side) => lying.arm(side).map(mirror)
    };
    skull = [
      [0, 0.039, 0.049, 0.048],
      [0.1, 0.06, 0.066, 0.063],
      [0.24, 0.075, 0.076, 0.08],
      [0.39, 0.084, 0.082, 0.09],
      [0.53, 0.087, 0.079, 0.095],
      [0.65, 0.086, 0.084, 0.096],
      [0.77, 0.084, 0.079, 0.091],
      [0.87, 0.073, 0.065, 0.08],
      [0.95, 0.051, 0.045, 0.058],
      [1, 0.014, 0.014, 0.018]
    ];
    color = (tone, light) => "#" + tone.map((value) => Math.min(255, Math.round(value * light)).toString(16).padStart(2, "0")).join("");
  }
});

// src/js/floor-planner-person.mjs
function personTargetHeight(person) {
  const progress = person.fallProgress;
  const fall = progress === void 0 ? 0 : progress <= 0.37 ? 0.12 * (progress / 0.37) ** 1.4 : 0.12 + 0.88 * ((progress - 0.37) / 0.63) ** 1.6;
  const height = progress === void 0 ? poses[person.pose].target : poses.standing.target + (poses.lying.target - poses.standing.target) * fall;
  return height * (person.avatar === "child" ? 0.72 : 1) + (person.elevation ?? 0);
}
function personAt(room, pose = "standing") {
  return { ...roomInteriorPoint(room), pose, heading: 0 };
}
function solidWalls(plan2) {
  const doors = doorsOnPlan(plan2);
  return [
    ...plan2.rooms.flatMap((room) => polygonEdges(roomCorners(room))),
    ...plan2.walls.map((wall2) => [[wall2.x, wall2.y], [wall2.endX, wall2.endY]])
  ].flatMap(([a, b]) => wallSegments(a, b, doors));
}
function movePerson(rooms, walls, person, dx, dy) {
  const next = { ...person, x: person.x + dx, y: person.y + dy, heading: Math.round(Math.atan2(dx, -dy) * 180 / Math.PI) };
  if (!rooms.some((room) => contains(room, next))) return person;
  const movement = [dx, dy];
  const blocked = walls.some(([a, b]) => {
    const wall2 = [b[0] - a[0], b[1] - a[1]];
    const offset2 = [a[0] - person.x, a[1] - person.y];
    const determinant = cross3(movement, wall2);
    if (Math.abs(determinant) < 1e-8) return false;
    const alongStep = cross3(offset2, wall2) / determinant;
    const alongWall = cross3(offset2, movement) / determinant;
    return alongStep > 1e-8 && alongStep <= 1 + 1e-8 && alongWall >= 0 && alongWall <= 1;
  });
  return blocked ? person : next;
}
function preparePersonSensors(plan2) {
  return plan2.sensors.map((item, index) => {
    const room = roomForDevice(plan2.rooms, item);
    const exclusions = (plan2.zones ?? []).filter((zone) => zone.type === "exclusion" && zone.roomId === room?.id && (!zone.sensorId || zone.sensorId === item.id));
    return { item, index, room, fields: radarFields(room, item, { allowHeightEstimate: true }), motion: room ? motionField(item) : null, exclusions };
  });
}
function personSignals(plan2, person, sensors = preparePersonSensors(plan2), furniture = prepareFurnitureOcclusion(plan2.furniture ?? []), sight = prepareSight(plan2)) {
  const room = plan2.rooms.find((room2) => contains(room2, person));
  const height = personTargetHeight(person);
  const profile2 = radarProfileFor(person);
  return sensors.map(({ item, index, room: sensorRoom, fields, motion = null, exclusions = [] }) => {
    const mount = sensorMountHeight(item, sensorRoom);
    const reached = room && sensorRoom ? fields.filter((field2) => fieldCoversPoint(field2, item, person, profile2, height)) : [];
    const blocked = () => sightBlocked(sight, { ...radarOrigin(item), z: mount }, { x: person.x, y: person.y, z: height });
    const hidden = reached.length > 0 && blocked();
    const possible = hidden ? [] : reached;
    const obstacle = possible.length ? furnitureOcclusion({ ...item, z: mount }, person, height, furniture) : null;
    const lensed = Boolean(motion && room && sensorRoom) && fieldCoversPoint(motion, item, person, profile2, height);
    const inView = lensed && !(reached.length ? hidden : blocked()) && !(possible.length ? obstacle : furnitureOcclusion({ ...item, z: mount }, person, height, furniture));
    const pir = motion ? { ...motion, seen: inView && Boolean(person.moving), still: inView && !person.moving } : null;
    const exclusion = possible.some((field2) => field2.mode !== "presence") && exclusions.find((zone) => zone.parts.some((part) => pointInOutline(part, person)));
    const signals = fields.map((field2) => {
      const inRange = possible.includes(field2);
      const excluded = inRange && field2.mode !== "presence" && exclusion;
      const seen = inRange && !obstacle && !excluded;
      return {
        ...field2,
        seen,
        obstacle: inRange ? obstacle : null,
        exclusion: excluded || null,
        height: seen && field2.mode === "xyz" ? height : null
      };
    });
    return { item, index, room: sensorRoom, signals, motion: pir, obstacle, mount, walled: hidden, seen: signals.some((signal) => signal.seen) };
  });
}
function recordWalk(route, from, to, before, after) {
  const status = (value) => value === true ? "clear" : value === false ? "none" : value;
  before = status(before);
  after = status(after);
  const distance4 = Math.hypot(to.x - from.x, to.y - from.y);
  route.distance += distance4;
  route.covered += distance4 * (Number(before === "clear") + Number(after === "clear")) / 2;
  route.uncertain += distance4 * (Number(before === "shadow") + Number(after === "shadow")) / 2;
  if (!route.points.length) route.points.push({ x: from.x, y: from.y, status: before, covered: before === "clear" });
  if (before !== after) {
    route.points.push({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, status: before, covered: before === "clear" });
  }
  const end2 = { x: to.x, y: to.y, status: after, covered: after === "clear" };
  const last = route.points.at(-1);
  if (route.points.length > 1 && last.status === after && last.heading === to.heading) {
    route.points[route.points.length - 1] = { ...end2, heading: to.heading };
  } else {
    route.points.push({ ...end2, heading: to.heading });
  }
  if (route.points.length > 600) route.points.shift();
}
function paintWalkLines(person, route, readings, camera3) {
  const project = (point3, height = 0) => (camera3 === null ? [point3.x, point3.y] : projectSpace([point3.x, point3.y], height, camera3)).map((value) => Number(value.toFixed(3))).join(" ");
  const paths = { none: [], shadow: [], clear: [] };
  let previous = null;
  let lastCoverage = null;
  for (const point3 of route.points) {
    const end2 = project(point3);
    if (previous !== null) {
      const path2 = paths[point3.status];
      path2.push(point3.status === lastCoverage ? `L${end2}` : `M${previous}L${end2}`);
      lastCoverage = point3.status;
    }
    previous = end2;
  }
  const trail = Object.entries(paths).map(([status, path2]) => path2.length ? `<path class="fp-walk-trail" data-status="${status}" data-covered="${status === "clear"}" d="${path2.join("")}"/>` : "").join("");
  const links = readings.filter((reading) => reading.seen || reading.obstacle).map(({ item, mount, obstacle }) => {
    const from = project(item, mount);
    const to = obstacle ? project(obstacle.point, obstacle.point.z) : project(person, personTargetHeight(person));
    const [x, y] = to.split(" ");
    return `<path class="fp-walk-link" data-status="${obstacle?.status ?? "clear"}" d="M${from}L${to}"/>` + (obstacle ? `<circle class="fp-obstruction-hit" data-status="${obstacle.status}" cx="${x}" cy="${y}" r=".07"/>` : "");
  }).join("");
  return trail + links;
}
function paintPerson(person, camera3 = null, animate = true, detailed = true, occlusion = null) {
  const { x, y, pose, heading } = person;
  if (camera3 === null) {
    const wave = animate ? Math.sin((person.smokeTime ?? 0) * Math.PI * 4.6) * 0.075 : 0;
    const reacting = person.smokePhase === "smoke" || person.smokePhase === "reported";
    const reaction = `<circle cy="-.11" r=".085"/><path d="M0 .03v.12M-.22 ${-0.24 + wave}L-.14 .01 0 .07 .14 .01 .22 ${-0.24 - wave}"/>`;
    const figure = reacting ? reaction : {
      standing: '<circle cy="-.13" r=".10"/><path d="M-.17 .16v-.05q.17-.18.34 0v.05"/>',
      sitting: '<circle cy="-.12" r=".09"/><path d="M-.17 .02v.16h.34V.02M-.1 .09h.2"/>',
      lying: '<circle cy="-.20" r=".075"/><path d="M0-.06v.30m-.12-.16L0-.06l.12.14m-.07.16L0 .12l-.07.12"/>'
    }[pose];
    const falling = animate && person.fallProgress !== void 0 && person.fallProgress < 1;
    const progress = falling ? person.fallProgress : 0;
    const body = person.fallProgress === void 0 ? `rotate(${heading})` : `rotate(${heading + (falling ? 75 * progress : 180)}) translate(0 ${progress * 0.13}) scale(1 ${1 + progress * 0.65})`;
    return `<g class="fp-person-flat" data-avatar="${person.avatar ?? "man"}" data-pose="${pose}" data-activity="${person.activity ?? ""}" ${person.active ? "data-active" : ""} transform="translate(${x} ${y})${person.avatar === "child" ? " scale(.82)" : ""}">
            <circle class="fp-person-base" r=".34"/><g class="fp-person-body" transform="${body}">${figure}</g></g>`;
  }
  return paintAvatar(person, camera3, animate, detailed, occlusion);
}
var poses, cross3, emptyRoute, routeCoverage;
var init_floor_planner_person = __esm({
  "src/js/floor-planner-person.mjs"() {
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_radar();
    init_floor_planner_sight();
    init_floor_planner_obstruction();
    init_floor_planner_space();
    init_floor_planner_avatar();
    poses = {
      standing: { target: 1.35 },
      sitting: { target: 0.85 },
      lying: { target: 0.25 }
    };
    cross3 = (a, b) => a[0] * b[1] - a[1] * b[0];
    emptyRoute = () => ({ points: [], distance: 0, covered: 0, uncertain: 0 });
    routeCoverage = (readings) => readings.some((reading) => reading.seen) ? "clear" : readings.some((reading) => reading.obstacle?.status === "shadow") ? "shadow" : "none";
  }
});

// src/js/floor-planner-person-input.mjs
function createWalkControls(dock, activeWalker2, move, onIdle, render2) {
  const held = /* @__PURE__ */ new Map();
  const idleTimers = /* @__PURE__ */ new Map();
  let frame = 0;
  let previousTime = 0;
  function updateButtons() {
    const keys = new Set([...held.values()].filter((control) => control.walker === activeWalker2()).map((control) => control.key));
    dock.querySelectorAll("[data-person-move]").forEach((button) => {
      button.toggleAttribute("data-held", keys.has(button.dataset.personMove));
    });
  }
  function advance(walker, keys, distance4) {
    let x = 0, y = 0;
    for (const key of new Set(keys)) {
      const [dx, dy] = directions[key];
      x += dx;
      y += dy;
    }
    const length = Math.hypot(x, y);
    return length ? move(walker, x / length, y / length, distance4) : onIdle(walker);
  }
  function tick(now) {
    const elapsed = Math.min(0.05, Math.max(0, (now - previousTime) / 1e3));
    previousTime = now;
    const ready = /* @__PURE__ */ new Map();
    for (const { walker, key, started } of held.values()) {
      if (now - started < holdDelay) continue;
      if (!ready.has(walker)) ready.set(walker, []);
      ready.get(walker).push(key);
    }
    let changed = false;
    for (const [walker, keys] of ready) {
      if (advance(walker, keys, speed * elapsed)) changed = true;
    }
    if (changed) render2();
    frame = held.size ? requestAnimationFrame(tick) : 0;
  }
  function press(source, key, walker) {
    if (held.has(source)) return;
    clearTimeout(idleTimers.get(walker));
    idleTimers.delete(walker);
    held.set(source, { key, walker, started: performance.now() });
    updateButtons();
    const keys = [...held.values()].filter((control) => control.walker === walker).map((control) => control.key);
    if (advance(walker, keys, tapStep)) render2();
    if (!frame) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function queueIdle(walker) {
    if ([...held.values()].some((control) => control.walker === walker)) return;
    clearTimeout(idleTimers.get(walker));
    idleTimers.set(walker, setTimeout(() => {
      idleTimers.delete(walker);
      if (onIdle(walker)) render2();
    }, 160));
  }
  function release(source) {
    const control = held.get(source);
    if (!control) return;
    held.delete(source);
    updateButtons();
    queueIdle(control.walker);
    if (!held.size) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  function stop() {
    const walkers2 = new Set([...held.values()].map((control) => control.walker).concat([...idleTimers.keys()]));
    for (const timer of idleTimers.values()) clearTimeout(timer);
    idleTimers.clear();
    held.clear();
    updateButtons();
    cancelAnimationFrame(frame);
    frame = 0;
    let changed = false;
    for (const walker of walkers2) if (onIdle(walker)) changed = true;
    if (changed) render2();
  }
  dock.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-person-move]");
    if (!button || event.button !== 0) return;
    button.setPointerCapture(event.pointerId);
    press(event.pointerId, button.dataset.personMove, activeWalker2());
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    dock.addEventListener(name, (event) => release(event.pointerId));
  }
  dock.addEventListener("contextmenu", (event) => {
    if (event.target.closest("[data-person-move]")) event.preventDefault();
  });
  window.addEventListener("keyup", (event) => release(event.code || event.key));
  window.addEventListener("blur", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  return { press, stop, tap(key) {
    const walker = activeWalker2();
    if (advance(walker, [key], tapStep)) render2();
    queueIdle(walker);
  } };
}
var directions, tapStep, speed, holdDelay;
var init_floor_planner_person_input = __esm({
  "src/js/floor-planner-person-input.mjs"() {
    directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    tapStep = 0.24;
    speed = 1.8;
    holdDelay = 135;
  }
});

// src/js/floor-planner-live.mjs
function liveFloorFigures(people, rooms) {
  const byId = new Map(rooms.map((room) => [room.haRoom ?? room.id, room]));
  return people.flatMap((person) => {
    const room = byId.get(person.roomId);
    const frame = room?.haFrame;
    if (!room || frame?.visible === false) return [];
    const origin = person.house;
    const turn = (frame?.angle ?? origin.rotationDeg) - origin.rotationDeg;
    const radians = turn * Math.PI / 180;
    const dx = person.x - origin.x / 1e3, dy = person.y - origin.y / 1e3;
    return [{
      ...person,
      x: (frame?.x ?? origin.x / 1e3) + dx * Math.cos(radians) - dy * Math.sin(radians),
      y: (frame?.y ?? origin.y / 1e3) + dx * Math.sin(radians) + dy * Math.cos(radians),
      heading: person.heading + turn
    }];
  });
}
function screenOffset(node, svg) {
  let offset2 = 0;
  for (let current = node; current && current !== svg; current = current.parentNode) offset2 += shiftOf(current);
  return offset2;
}
function fadeLabelsNear(svg, figures2) {
  if (!svg) return;
  for (const label of svg.querySelectorAll(".fp-space-room-label")) {
    const x = Number(label.getAttribute("x")), y = Number(label.getAttribute("y")) + screenOffset(label.parentNode, svg);
    const near = figures2.some((figure) => Math.abs(figure.x - x) < 0.95 && y > figure.head - 0.35 && y < figure.foot + 0.3);
    if (near !== label.hasAttribute("data-near-person")) label.toggleAttribute("data-near-person", near);
  }
}
var shiftOf;
var init_floor_planner_live = __esm({
  "src/js/floor-planner-live.mjs"() {
    shiftOf = (node) => Number(node.getAttribute?.("transform")?.match(/^translate\(0 (-?[\d.e+-]+)\)$/)?.[1] ?? 0);
  }
});

// src/js/floor-planner-walk-route.mjs
function intersection(from, to, left, top2, right, bottom2) {
  let start3 = 0, end2 = 1;
  for (const [origin, delta, min, max] of [
    [from.x, to.x - from.x, left, right],
    [from.y, to.y - from.y, top2, bottom2]
  ]) {
    if (Math.abs(delta) < epsilon4) {
      if (origin < min || origin > max) return null;
      continue;
    }
    const a = (min - origin) / delta, b = (max - origin) / delta;
    start3 = Math.max(start3, Math.min(a, b));
    end2 = Math.min(end2, Math.max(a, b));
    if (start3 > end2) return null;
  }
  return [start3, end2];
}
function distanceToLine(point3, from, to) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const fraction = Math.min(1, Math.max(0, ((point3.x - from.x) * dx + (point3.y - from.y) * dy) / (dx * dx + dy * dy || 1)));
  return distance(point3, { x: from.x + dx * fraction, y: from.y + dy * fraction });
}
function floorConnects(rooms, from, to) {
  if (rooms.some((room) => !room.outline && contains(room, from) && contains(room, to))) return true;
  const intervals = rooms.flatMap((room) => {
    const { x, y, width, depth } = room;
    const box2 = intersection(from, to, x, y, x + width, y + depth);
    return !box2 ? [] : room.outline ? roomLineSpans(room, from, to) : [box2];
  }).sort((a, b) => a[0] - b[0]);
  let end2 = 0;
  for (const [start3, stop] of intervals) {
    if (start3 > end2 + epsilon4) return false;
    end2 = Math.max(stop, end2);
    if (end2 >= 1 - epsilon4) return true;
  }
  return false;
}
function walkingObstacle(item) {
  const angle2 = item.angle * Math.PI / 180;
  const cos = Math.cos(angle2), sin = Math.sin(angle2);
  const local = ({ x, y }) => ({ x: (x - item.x) * cos + (y - item.y) * sin, y: (y - item.y) * cos - (x - item.x) * sin });
  const parts = furnitureParts(item).filter((part) => part.high > 0.065 && part.low < 1.78);
  const radius = Math.hypot(item.width / 2 + clearance, item.depth / 2 + clearance);
  return { item, local, parts, radius };
}
function createWalkNetwork({ rooms, furniture = [], doors }, walls) {
  const obstacles = furniture.map(walkingObstacle).filter((obstacle) => obstacle.parts.length);
  const segments = walls.map(([[x, y], [endX, endY]]) => ({
    a: { x, y },
    b: { x: endX, y: endY },
    bounds: [
      Math.min(x, endX) - clearance,
      Math.min(y, endY) - clearance,
      Math.max(x, endX) + clearance,
      Math.max(y, endY) + clearance
    ]
  }));
  const area = rooms.reduce((sum, room) => sum + roomArea(room), 0);
  const step2 = Math.max(0.36, Math.sqrt(area / 2800));
  const reach2 = step2 * 1.85;
  const buckets = /* @__PURE__ */ new Map(), nodes = [], positions = /* @__PURE__ */ new Set();
  const bucketKey = (x, y) => x + ":" + y;
  function clear(from, to) {
    if (!floorConnects(rooms, from, to)) return false;
    if (movePerson(rooms, walls, from, to.x - from.x, to.y - from.y) === from) return false;
    for (const { a, b, bounds } of segments) {
      if (!intersection(from, to, ...bounds)) continue;
      if (distanceToLine(from, a, b) < clearance || distanceToLine(to, a, b) < clearance || distanceToLine(a, from, to) < clearance || distanceToLine(b, from, to) < clearance) return false;
    }
    for (const { item, local, parts, radius } of obstacles) {
      if (distanceToLine(item, from, to) > radius) continue;
      const a = local(from), b = local(to);
      if (parts.some((part) => intersection(
        a,
        b,
        part.x - clearance,
        part.y - clearance,
        part.x + part.w + clearance,
        part.y + part.d + clearance
      ))) return false;
    }
    return true;
  }
  function add2(point3) {
    const position = bucketKey(point3.x, point3.y);
    if (positions.has(position)) return;
    const room = rooms.find((room2) => contains(room2, point3));
    if (!room || !clear(point3, point3)) return;
    positions.add(position);
    const key = bucketKey(Math.floor(point3.x / reach2), Math.floor(point3.y / reach2));
    if (!buckets.has(key)) buckets.set(key, []);
    const node = { ...point3, room, edges: null };
    buckets.get(key).push(node);
    nodes.push(node);
  }
  for (const room of rooms) {
    if (room.outline) add2(roomInteriorPoint(room));
    const columns = Math.ceil(room.width / step2), rows = Math.ceil(room.depth / step2);
    for (let row = 0; row < rows; row++) {
      const y = room.y + (row + 0.5) * room.depth / rows;
      const spans = room.outline ? roomLineSpans(room, { x: room.x, y }, { x: room.x + room.width, y }) : [[0, 1]];
      for (const [left, right] of spans) {
        const first = Math.ceil(left * columns - 0.5), last = Math.floor(right * columns - 0.5);
        if (first > last) add2({ x: room.x + (left + right) * room.width / 2, y });
        for (let column = first; column <= last; column++) {
          add2({ x: room.x + (column + 0.5) * room.width / columns, y });
        }
      }
    }
  }
  for (const [[x, y], [endX, endY]] of doorsOnPlan({ doors })) {
    const width = Math.hypot(endX - x, endY - y);
    for (const offset2 of [0, 0.27, -0.27]) {
      add2({ x: (x + endX) / 2 + offset2 * (endY - y) / width, y: (y + endY) / 2 - offset2 * (endX - x) / width });
    }
  }
  function connections(point3) {
    const x = Math.floor(point3.x / reach2), y = Math.floor(point3.y / reach2);
    const adjacent = [];
    for (let row = y - 1; row <= y + 1; row++) {
      for (let col = x - 1; col <= x + 1; col++) {
        for (const node of buckets.get(bucketKey(col, row)) ?? []) {
          if (node !== point3 && distance(point3, node) <= reach2 && clear(point3, node)) adjacent.push(node);
        }
      }
    }
    return adjacent;
  }
  function startAt(point3) {
    if (clear(point3, point3)) return connections(point3).length ? point3 : null;
    const room = rooms.find((room2) => contains(room2, point3));
    let nearest = null, best = Infinity;
    for (const node of nodes) {
      if (node.room !== room || !floorConnects(rooms, point3, node)) continue;
      const gap2 = distance(point3, node);
      if (gap2 >= best || movePerson(rooms, walls, point3, node.x - point3.x, node.y - point3.y) === point3) continue;
      node.edges ??= connections(node);
      if (node.edges.some((edge) => distance(edge, node) > epsilon4)) {
        nearest = node;
        best = gap2;
      }
    }
    return nearest;
  }
  function walkTree(point3) {
    const queue = connections(point3);
    const parents = new Map(queue.map((node) => [node, null]));
    for (let i = 0; i < queue.length; i++) {
      const node = queue[i];
      node.edges ??= connections(node);
      for (const edge of node.edges) {
        if (parents.has(edge)) continue;
        parents.set(edge, node);
        queue.push(edge);
      }
    }
    return { queue, parents };
  }
  function waypointsTo(point3, goal, parents) {
    const path2 = [];
    for (let node = goal; node; node = parents.get(node)) path2.push(node);
    path2.reverse();
    const waypoints = [];
    let from = point3;
    for (let i = 0; i < path2.length; ) {
      let next = Math.min(i + 12, path2.length - 1);
      while (next > i && !clear(from, path2[next])) next--;
      from = path2[next];
      waypoints.push(from);
      i = next + 1;
    }
    return waypoints;
  }
  function routeFrom(point3, random = Math.random) {
    const { queue, parents } = walkTree(point3);
    const otherRooms = queue.filter((node) => !contains(node.room, point3));
    const far = queue.filter((node) => distance(node, point3) > 0.9);
    const goals = otherRooms.length ? otherRooms : far.length ? far : queue.filter((node) => distance(node, point3) > 0.1);
    return waypointsTo(point3, goals[Math.floor(random() * goals.length)], parents);
  }
  function routeToActivity(point3, choose) {
    const { queue, parents } = walkTree(point3);
    const activity = choose(queue);
    return activity && { ...activity, points: waypointsTo(point3, activity.approach, parents) };
  }
  function routeTo(point3, goal) {
    if (clear(point3, goal)) return [goal];
    const { queue, parents } = walkTree(point3);
    const approach = queue.find((node) => distance(node, goal) <= reach2 && clear(node, goal));
    return approach ? [...waypointsTo(point3, approach, parents), goal] : null;
  }
  return { startAt, routeFrom, routeTo, routeToActivity, clear };
}
var clearance, epsilon4, distance;
var init_floor_planner_walk_route = __esm({
  "src/js/floor-planner-walk-route.mjs"() {
    init_floor_planner_furniture();
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_person();
    clearance = 0.17;
    epsilon4 = 1e-7;
    distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  }
});

// src/js/floor-planner-activity.mjs
function walkTestPhase(kind, elapsed, reducedMotion2) {
  if (kind === "smoke") {
    const checked = elapsed >= smokeDetectionDelay;
    const smokePhase = checked ? "reported" : elapsed >= smokeSpreadStart ? "smoke" : elapsed >= smokeFireStart ? "fire" : "start";
    return { smokePhase, checked };
  }
  const fallProgress = reducedMotion2 ? 1 : Math.min(1, Math.max(0, elapsed / fallMotionDuration));
  return { fallProgress, checked: fallProgress === 1 };
}
function createWalkActivities(plan2, walls, sensors, obstacles, network) {
  const furniture = (plan2.furniture ?? []).flatMap((item) => {
    const room = plan2.rooms.find((room2) => contains(room2, item));
    return room ? [{ item, room }] : [];
  });
  const heightRadar = sensors.filter(({ fields }) => fields.some((field2) => field2.radar === "ld6002b"));
  const sight = prepareSight(plan2);
  function furnitureActivity(kind, person, nodes, occupied) {
    let best = null;
    let bestScore = Infinity;
    for (const { item, room } of furniture) {
      if (occupied.has(item.id) || (kind === "seat" ? !seats.has(item.kind) : item.kind !== "bed")) continue;
      const surface = furnitureParts(item).find((part) => part.surface === "seat");
      const [x, y] = furnitureProjection(item)([surface.x + surface.w / 2, surface.y + surface.d / 2]);
      const point3 = { x, y };
      const heading = kind === "seat" ? (item.angle + 180) % 360 : item.angle;
      const reach2 = Math.hypot(item.width, item.depth) / 2 + 0.6;
      for (const approach of nodes) {
        if (approach.room !== room) continue;
        const gap2 = distance2(approach, point3);
        if (gap2 > reach2 || movePerson([room], walls, approach, x - approach.x, y - approach.y) === approach) continue;
        const score = gap2 * 3 + distance2(person, approach);
        if (score >= bestScore) continue;
        bestScore = score;
        best = {
          kind,
          room,
          item,
          approach,
          point: point3,
          heading,
          elevation: kind === "bed" ? surface.high : surface.high - 0.48
        };
      }
    }
    return best;
  }
  function fallActivity(person, nodes, testRoom) {
    const rooms = testRoom ? /* @__PURE__ */ new Set([testRoom]) : new Set(heightRadar.map(({ room }) => room));
    const nearby = nodes.filter((node) => rooms.has(node.room)).sort((a, b) => distance2(a, person) - distance2(b, person));
    let nearest = null;
    for (const approach of nearby) {
      const heading = [person.heading, 0, 90, 180, 270].find((angle2) => {
        const head = offset(approach, angle2, -0.71), feet = offset(approach, angle2, 1.03);
        return contains(approach.room, head) && contains(approach.room, feet) && network.clear(head, feet);
      });
      if (heading === void 0) continue;
      const onGround = { ...person, ...approach, pose: "lying", heading, elevation: 0 };
      const detector = personSignals(plan2, onGround, heightRadar, obstacles, sight).find((reading) => reading.signals.some((signal) => signal.radar === "ld6002b" && signal.seen));
      const activity = { kind: "fall", room: approach.room, approach, heading, detector };
      if (detector) return activity;
      if (testRoom) nearest ??= activity;
    }
    return nearest;
  }
  function smokeActivity(person, nodes, room) {
    const nearby = nodes.filter((node) => node.room === room).sort((a, b) => distance2(a, person) - distance2(b, person));
    for (const approach of nearby) {
      for (const heading of [person.heading - 35, 0, 90, 180, 270]) {
        const source = offset(approach, heading, 0.85);
        if (!contains(room, source) || !network.clear(approach, source)) continue;
        const detector = sensors.find((sensor) => sensor.room === room && sensor.item.model === "ceilsense-pro");
        return { kind: "smoke", room, approach, source, heading, detector };
      }
    }
    return null;
  }
  return (kind, person, occupied, testRoom = null) => network.routeToActivity(person, (nodes) => {
    if (kind === "fall") return fallActivity(person, nodes, testRoom);
    if (kind === "smoke" && testRoom) return smokeActivity(person, nodes, testRoom);
    if (kind === "seat" || kind === "bed") return furnitureActivity(kind, person, nodes, occupied);
    return null;
  });
}
function paintRoomSmoke(room, source, camera3, age) {
  const id = camera3 ? "fp-smoke-volume-3d" : "fp-smoke-volume-2d";
  const project = (point3, height = 0) => camera3 ? projectSpace([point3.x, point3.y], height, camera3) : [point3.x, point3.y];
  const polygon2 = (points) => `<polygon points="${points.map((point3) => point3.join(",")).join(" ")}"/>`;
  const corners = roomCorners(room).map(([x, y]) => ({ x, y }));
  const floor = corners.map((point3) => project(point3));
  const roof = corners.map((point3) => project(point3, ceilingHeightAt(room, point3)));
  const clip = camera3 ? polygon2(floor) + polygon2(roof) + floor.map((point3, index) => {
    const next = (index + 1) % floor.length;
    return polygon2([point3, floor[next], roof[next], roof[index]]);
  }).join("") : paintRoomSurface(room);
  const [sourceX, sourceY] = project(source, 0.25);
  const size = Math.min(2.7, Math.max(0.7, Math.min(room.width, room.depth) * 0.39));
  const clouds = Array.from({ length: 16 }, (_, index) => {
    const u = 0.12 + 0.76 * (index * 13 % 17 / 16);
    const v = 0.12 + 0.76 * ((index * 7 + 4) % 17 / 16);
    const point3 = { x: room.x + room.width * u, y: room.y + room.depth * v };
    if (!contains(room, point3)) return "";
    const height = ceilingHeightAt(room, point3) * (0.24 + index % 4 * 0.18);
    const [x, y] = project(point3, height);
    const radius = size * (0.78 + index % 5 * 0.11);
    const wait = (0.14 + Math.min(1.8, distance2(point3, source) * 0.21) + index % 3 * 0.14).toFixed(2);
    const dx = ((sourceX - x) * 0.56).toFixed(2), dy = ((sourceY - y) * 0.56).toFixed(2);
    return `<g transform="translate(${x} ${y})"><g class="fp-smoke-spread" style="--fp-smoke-x:${dx}px;--fp-smoke-y:${dy}px;--fp-smoke-wait:${wait}s">
            <ellipse class="fp-smoke-wisp" rx="${radius}" ry="${radius * (camera3 ? 0.47 : 0.74)}" fill="url(#${id}-cloud)"/>
        </g></g>`;
  }).join("");
  return `<defs><clipPath id="${id}">${clip}</clipPath>
        <radialGradient id="${id}-cloud">
            <stop stop-color="#bac4cd" stop-opacity=".53"/><stop offset=".52" stop-color="#99a5b2" stop-opacity=".40"/>
            <stop offset="1" stop-color="#778590" stop-opacity="0"/>
        </radialGradient></defs>
        <g class="fp-room-smoke" clip-path="url(#${id})" style="--fp-smoke-age:-${age.toFixed(3)}s">
            <g class="fp-smoke-haze">${camera3 ? polygon2(floor) : paintRoomSurface(room)}</g>${clouds}
        </g>`;
}
function paintFire(source, camera3) {
  const [x, y] = camera3 ? projectSpace([source.x, source.y], 0, camera3) : [source.x, source.y];
  return `<g class="fp-demo-fire" transform="translate(${x} ${y})">
        <ellipse class="fp-fire-glow" rx=".50" ry="${camera3 ? ".18" : ".42"}"/>
        <g class="fp-fire-flames" transform="translate(0 ${camera3 ? 0 : 0.12})">
            <path class="fp-fire-flicker" fill="#ff8545"
                d="M0 0C-.32-.05-.34-.31-.18-.48C-.19-.30-.05-.35-.06-.50C-.08-.62.02-.70.06-.80C.05-.62.24-.54.20-.39C.28-.44.30-.51.29-.55C.44-.19.25-.02 0 0Z"/>
            <path class="fp-fire-core" fill="#ffd283"
                d="M0-.02C-.20-.05-.18-.22-.08-.31C-.08-.20.01-.24.01-.37C.02-.44.06-.48.10-.51C.08-.37.25-.26.19-.13C.16-.06.09-.02 0-.02Z"/>
        </g>
    </g>`;
}
function paintActivityEffect({ kind, room, detected, before, source, started, checked, smokePhase }, camera3, now) {
  if (kind === "fall" && !checked) return "";
  const roomAlarm = !detected ? "" : camera3 ? `<polygon class="fp-room-alarm" points="${roomCorners(room).map((point3) => projectSpace(point3, 0, camera3).join(",")).join(" ")}"/>` : paintRoomSurface(room, 'class="fp-room-alarm"');
  if (kind === "smoke") {
    if (smokePhase === "start") return "";
    const smoke = smokePhase === "fire" ? "" : paintRoomSmoke(
      room,
      source,
      camera3,
      Math.max(0, (now - started - smokeSpreadStart) / 1e3)
    );
    return roomAlarm + paintFire(source, camera3) + smoke;
  }
  const [x, y] = camera3 ? projectSpace([before.x, before.y], 0, camera3) : [before.x, before.y];
  return roomAlarm + `<g transform="translate(${x} ${y})"><ellipse class="fp-fall-impact" rx=".59" ry="${camera3 ? ".24" : ".59"}"/></g>`;
}
var seats, distance2, offset, fallMotionDuration, smokeFireStart, smokeSpreadStart, smokeDetectionDelay, activityDuration;
var init_floor_planner_activity = __esm({
  "src/js/floor-planner-activity.mjs"() {
    init_floor_planner_ceiling();
    init_floor_planner_drawing();
    init_floor_planner_furniture();
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_person();
    init_floor_planner_sight();
    init_floor_planner_space();
    seats = /* @__PURE__ */ new Set(["chair", "sofa", "corner", "armchair"]);
    distance2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    offset = (person, heading, length) => ({
      x: person.x + Math.sin(heading * Math.PI / 180) * length,
      y: person.y - Math.cos(heading * Math.PI / 180) * length
    });
    fallMotionDuration = 960;
    smokeFireStart = 850;
    smokeSpreadStart = 1650;
    smokeDetectionDelay = 3800;
    activityDuration = { seat: 2800, bed: 3500, fall: 5100, smoke: 8600 };
  }
});

// src/js/floor-planner-heatmap.mjs
function coverageCells(plan2, { step: step2 = heatStep, furniture = true } = {}) {
  const sensors = preparePersonSensors(plan2);
  const obstacles = furniture ? prepareFurnitureOcclusion(plan2.furniture ?? []) : [];
  const sight = prepareSight(plan2);
  const cells = [];
  for (const room of plan2.rooms) {
    const corners = roomCorners(room);
    const xs = corners.map(([x]) => x), ys = corners.map(([, y]) => y);
    const left = Math.floor(Math.min(...xs) / step2) * step2, top2 = Math.floor(Math.min(...ys) / step2) * step2;
    for (let y = top2; y < Math.max(...ys); y += step2) {
      for (let x = left; x < Math.max(...xs); x += step2) {
        const centre2 = { x: x + step2 / 2, y: y + step2 / 2 };
        if (!contains(room, centre2, false)) continue;
        const readings = personSignals(plan2, { ...centre2, pose: "standing", heading: 0 }, sensors, obstacles, sight);
        const seen = readings.filter((reading) => reading.seen).length;
        cells.push({ x, y, seen, shadow: !seen && readings.some((reading) => reading.obstacle) });
      }
    }
  }
  return cells;
}
function paintCoverageHeat(cells, { step: step2 = heatStep, project = null } = {}) {
  const groups = /* @__PURE__ */ new Map();
  for (const cell of cells) {
    const level = cell.seen >= 2 ? "many" : cell.seen === 1 ? "one" : cell.shadow ? "shadow" : "none";
    const square = [[cell.x, cell.y], [cell.x + step2, cell.y], [cell.x + step2, cell.y + step2], [cell.x, cell.y + step2]];
    const points = project ? square.map((point3) => project(point3)) : square;
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level).push(`M${points.map((point3) => point3.join(" ")).join("L")}Z`);
  }
  return `<g class="fp-heat" pointer-events="none">${[...groups].map(([level, paths]) => `<path class="fp-heat-cells" data-seen="${level}" d="${paths.join("")}"/>`).join("")}</g>`;
}
function coverageSummary(cells) {
  const total = cells.length || 1;
  const share2 = (test) => Math.round(cells.filter(test).length / total * 100);
  return { none: share2((cell) => !cell.seen), one: share2((cell) => cell.seen === 1), many: share2((cell) => cell.seen >= 2) };
}
var heatStep;
var init_floor_planner_heatmap = __esm({
  "src/js/floor-planner-heatmap.mjs"() {
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_obstruction();
    init_floor_planner_person();
    init_floor_planner_sight();
    heatStep = 0.25;
  }
});

// src/js/floor-planner-zones.mjs
var owner, removeZonesOwnedBySensor, removeOrphanedSensorZones;
var init_floor_planner_zones = __esm({
  "src/js/floor-planner-zones.mjs"() {
    owner = (zone) => zone?.sensorId || zone?.sensor_id;
    removeZonesOwnedBySensor = (zones, sensorId) => (Array.isArray(zones) ? zones : []).filter((zone) => owner(zone) !== sensorId);
    removeOrphanedSensorZones = (zones, sensorIds) => {
      const available = sensorIds instanceof Set ? sensorIds : new Set(sensorIds || []);
      return (Array.isArray(zones) ? zones : []).filter((zone) => !owner(zone) || available.has(owner(zone)));
    };
  }
});

// src/js/floor-planner-recognise.mjs
function snappedLines(values) {
  const lines = /* @__PURE__ */ new Map();
  let group = [];
  const close = () => {
    const mean = group.reduce((sum, value) => sum + value, 0) / group.length;
    for (const value of group) lines.set(value, mean);
  };
  for (const value of [...new Set(values)].sort((a, b) => a - b)) {
    if (group.length && value - group[0] > lineSnap) {
      close();
      group = [];
    }
    group.push(value);
  }
  if (group.length) close();
  return lines;
}
function tidy(points) {
  const distinct = points.filter((point3, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    return Math.hypot(point3[0] - previous[0], point3[1] - previous[1]) > 1e-6;
  });
  return distinct.filter((point3, index) => {
    const before = distinct[(index + distinct.length - 1) % distinct.length];
    const after = distinct[(index + 1) % distinct.length];
    const cross4 = (point3[0] - before[0]) * (after[1] - point3[1]) - (point3[1] - before[1]) * (after[0] - point3[0]);
    return Math.abs(cross4) > 1e-6;
  });
}
function roomShape(points) {
  const shape = outlineBounds(tidy(points));
  if (shape) return isRectangle(shape) ? { x: shape.x, y: shape.y, width: shape.width, depth: shape.depth } : shape;
  const xs = points.map(([x2]) => x2), ys = points.map(([, y2]) => y2);
  const x = Math.min(...xs), y = Math.min(...ys);
  const width = Math.max(...xs) - x, depth = Math.max(...ys) - y;
  return width >= 0.5 && depth >= 0.5 && width <= 60 && depth <= 60 ? { x, y, width, depth } : null;
}
function nearestWall(rooms, point3) {
  let best = null;
  for (const room of rooms) {
    for (const [a, b] of polygonEdges(roomCorners(room))) {
      const position = edgePosition(a, b, point3);
      const distance4 = Math.hypot(position.x - point3.x, position.y - point3.y);
      if (!best || distance4 < best.distance) best = { room, distance: distance4, ...position };
    }
  }
  return best;
}
function openingsOnWalls(rooms, items, { minimum, maximum, reach: reach2, extra = {} }) {
  return items.flatMap(({ from, to }) => {
    const wall2 = nearestWall(rooms, { x: (from[0] + to[0]) / 2, y: (from[1] + to[1]) / 2 });
    if (!wall2 || wall2.distance > reach2) return [];
    const width = millimetres(Math.min(maximum, wall2.length, Math.max(minimum, Math.hypot(to[0] - from[0], to[1] - from[1]))));
    if (width < minimum) return [];
    const start3 = Math.max(0, Math.min(wall2.length - width, wall2.along - width / 2));
    const [dx, dy] = [(wall2.b[0] - wall2.a[0]) / wall2.length, (wall2.b[1] - wall2.a[1]) / wall2.length];
    return [{
      id: newId(),
      roomId: wall2.room.id,
      width,
      angle: degrees(wall2.angle),
      x: millimetres(wall2.a[0] + dx * start3),
      y: millimetres(wall2.a[1] + dy * start3),
      ...extra
    }];
  });
}
function draftFromRecognition(recognition2, underlay, { roomName = "Room", height = 2.7, keepScale = false } = {}) {
  if (!validUnderlay(underlay) || !recognition2 || typeof recognition2 !== "object") return null;
  const found = (Array.isArray(recognition2.rooms) ? recognition2.rooms : []).slice(0, recognitionLimits.rooms).filter((room) => Array.isArray(room?.points) && room.points.length >= 3 && room.points.length <= recognitionLimits.corners && room.points.every(imagePoint));
  if (!found.length) return null;
  const realWidth = recognition2.width_m;
  const rescaled = !keepScale && Number.isFinite(realWidth) ? { ...underlay, width: realWidth } : null;
  const scaled = Boolean(rescaled && validUnderlay(rescaled));
  const image = scaled ? rescaled : underlay;
  const across = ([x]) => x, down = ([, y]) => y / image.ratio;
  const all = found.flatMap((room) => room.points);
  const columns = snappedLines(all.map(across)), rows = snappedLines(all.map(down));
  const onPlan = (u, v) => [millimetres(image.x + u * image.width), millimetres(image.y + v * image.width)];
  const rooms = [];
  let skipped = 0;
  for (const room of found) {
    const shape = roomShape(room.points.map((point3) => onPlan(columns.get(across(point3)), rows.get(down(point3)))));
    if (!shape) {
      skipped++;
      continue;
    }
    const name = typeof room.name === "string" && room.name.trim() ? room.name.trim().slice(0, 48) : `${roomName} ${rooms.length + 1}`;
    rooms.push({ ...shape, id: newId(), name, height });
  }
  if (!rooms.length) return null;
  const reach2 = wallReach3 * image.width;
  const openings = (list2, minimum, maximum, extra) => openingsOnWalls(
    rooms,
    (Array.isArray(list2) ? list2 : []).slice(0, recognitionLimits.openings).filter((item) => imagePoint(item?.from) && imagePoint(item?.to)).map((item) => ({ from: onPlan(across(item.from), down(item.from)), to: onPlan(across(item.to), down(item.to)) })),
    { minimum, maximum, reach: reach2, extra }
  );
  return {
    underlay: image,
    rooms,
    doors: openings(recognition2.doors, 0.5, 2, {}),
    windows: openings(recognition2.windows, 0.1, 8, { base: defaultWindowSill, height: 1 }),
    scaled,
    skipped
  };
}
function planWithDraft(plan2, draft) {
  const rooms = draft.rooms.slice(0, Math.max(0, most - plan2.rooms.length));
  if (!rooms.length) return null;
  const kept = new Set(rooms.map((room) => room.id));
  const fits = (items, present) => items.filter((item) => kept.has(item.roomId)).slice(0, Math.max(0, most - present));
  const doors = fits(draft.doors, plan2.doors.length), windows2 = fits(draft.windows, plan2.windows?.length ?? 0);
  const outlined = rooms.some((room) => room.outline) ? Math.max(2, plan2.version) : plan2.version;
  const base = { ...plan2, underlay: draft.underlay, rooms: [...plan2.rooms, ...rooms] };
  const full = {
    ...base,
    version: windows2.length ? 3 : outlined,
    doors: [...plan2.doors, ...doors],
    ...windows2.length ? { windows: [...plan2.windows ?? [], ...windows2] } : {}
  };
  if (validPlan(full)) return full;
  const bare = { ...base, version: outlined };
  return validPlan(bare) ? bare : null;
}
function recognitionNote(copy2, { rooms, quota }, number4 = String) {
  const lines = [fill2(copy2.recognise_done, { count: number4(rooms) })];
  if (Number.isFinite(quota?.used) && Number.isFinite(quota?.limit)) {
    lines.push(fill2(copy2.recognise_quota, { used: number4(quota.used), limit: number4(quota.limit) }));
  }
  return lines.filter(Boolean).join(" ");
}
function roomsWaitingForScale(recognition2) {
  const rooms = Array.isArray(recognition2?.rooms) ? recognition2.rooms : [];
  return rooms.slice(0, recognitionLimits.rooms).filter((room) => Array.isArray(room?.points) && room.points.length >= 3 && room.points.length <= recognitionLimits.corners && room.points.every(imagePoint)).length;
}
function recognitionProblem(copy2, error, locale) {
  const code = error?.code;
  if (code === "cancelled") return "";
  if (code === "quota_exceeded") {
    const date = new Date(error.quota?.resets_at ?? NaN);
    return fill2(copy2.recognise_error_quota, {
      limit: Number.isFinite(error.quota?.limit) ? String(error.quota.limit) : "",
      date: Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(locale, { day: "numeric", month: "long" })
    }).replace(/\s+/g, " ").trim();
  }
  return copy2[{
    daily_limit_exceeded: "recognise_error_daily",
    rate_limited: "recognise_error_busy",
    no_rooms_found: "recognise_error_none",
    account_required: "recognise_error_account",
    account_invalid: "recognise_error_account",
    popup_blocked: "recognise_error_popup"
  }[code] ?? "recognise_error_failed"] ?? "";
}
var recognitionLimits, lineSnap, wallReach3, unit2, imagePoint, millimetres, degrees, isRectangle, most, fill2, usualPace, recognitionProgress, recognitionWaiting;
var init_floor_planner_recognise = __esm({
  "src/js/floor-planner-recognise.mjs"() {
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_underlay();
    recognitionLimits = { rooms: 40, corners: 24, openings: 80 };
    lineSnap = 0.012;
    wallReach3 = 0.03;
    unit2 = (value) => Number.isFinite(value) && value >= 0 && value <= 1;
    imagePoint = (value) => Array.isArray(value) && value.length === 2 && unit2(value[0]) && unit2(value[1]);
    millimetres = (value) => Math.round(value * 1e3) / 1e3;
    degrees = (value) => (Math.round(value * 100) / 100 % 360 + 360) % 360;
    isRectangle = ({ width, depth, outline }) => outline.length === 4 && outline.every(([x, y]) => (Math.abs(x) < 1e-6 || Math.abs(x - width) < 1e-6) && (Math.abs(y) < 1e-6 || Math.abs(y - depth) < 1e-6));
    most = 80;
    fill2 = (text2, values) => Object.entries(values).reduce((line, [key, value]) => line.replaceAll(`:${key}`, value), text2 ?? "");
    usualPace = 11e3;
    recognitionProgress = (elapsed) => Math.min(97, Math.round(100 * (1 - Math.exp(-Math.max(0, Number(elapsed) || 0) / usualPace))));
    recognitionWaiting = (copy2, rooms, number4 = String) => fill2(copy2.recognise_needs_scale, { count: number4(rooms) });
  }
});

// src/js/floor-planner-trace.mjs
function spread(mask, width, height, r, every) {
  if (r <= 0) return mask.slice();
  const across = empty(width * height), out = empty(width * height);
  const sums = new Int32Array(Math.max(width, height) + 1);
  const pass = (source, target, count, length, at) => {
    for (let line = 0; line < count; line++) {
      for (let i = 0; i < length; i++) sums[i + 1] = sums[i] + source[at(line, i)];
      for (let i = 0; i < length; i++) {
        const from = Math.max(0, i - r), to = Math.min(length, i + r + 1);
        const set = sums[to] - sums[from];
        target[at(line, i)] = every ? set === to - from ? 1 : 0 : set > 0 ? 1 : 0;
      }
    }
  };
  pass(mask, across, height, width, (y, x) => y * width + x);
  pass(across, out, width, height, (x, y) => y * width + x);
  return out;
}
function distances(blocked, width, height) {
  const far = 1e9;
  const d = new Float32Array(width * height);
  for (let i = 0; i < d.length; i++) d[i] = blocked[i] ? 0 : far;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) {
        v = Math.min(v, d[i - width] + 3);
        if (x > 0) v = Math.min(v, d[i - width - 1] + 4);
        if (x < width - 1) v = Math.min(v, d[i - width + 1] + 4);
      }
      d[i] = v;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x < width - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < height - 1) {
        v = Math.min(v, d[i + width] + 3);
        if (x < width - 1) v = Math.min(v, d[i + width + 1] + 4);
        if (x > 0) v = Math.min(v, d[i + width - 1] + 4);
      }
      d[i] = v;
    }
  }
  for (let i = 0; i < d.length; i++) d[i] /= 3;
  return d;
}
function areas(blocked, width, height, distance4) {
  const labels = new Int32Array(width * height);
  const found = [null];
  const stack = new Int32Array(width * height);
  for (let start3 = 0; start3 < labels.length; start3++) {
    if (blocked[start3] || labels[start3]) continue;
    const id = found.length;
    const area = { id, size: 0, edge: false, depth: 0, first: start3, box: [width, height, 0, 0] };
    labels[start3] = id;
    let top2 = 0;
    stack[top2++] = start3;
    while (top2) {
      const i = stack[--top2];
      const x = i % width, y = (i - x) / width;
      area.size++;
      if (distance4[i] > area.depth) area.depth = distance4[i];
      if (x < area.box[0]) area.box[0] = x;
      if (y < area.box[1]) area.box[1] = y;
      if (x > area.box[2]) area.box[2] = x;
      if (y > area.box[3]) area.box[3] = y;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) area.edge = true;
      const visit = (next) => {
        if (!blocked[next] && !labels[next]) {
          labels[next] = id;
          stack[top2++] = next;
        }
      };
      if (x > 0) visit(i - 1);
      if (x < width - 1) visit(i + 1);
      if (y > 0) visit(i - width);
      if (y < height - 1) visit(i + width);
    }
    found.push(area);
  }
  return { labels, found };
}
function betweenLines(mask, width, height, longest, widest) {
  const out = mask.slice();
  for (const down of [false, true]) {
    const lines = down ? width : height, length = down ? height : width;
    const at = down ? (line, i) => i * width + line : (line, i) => line * width + i;
    const long2 = empty(width * height);
    for (let line = 0; line < lines; line++) {
      let from = -1;
      for (let i = 0; i <= length; i++) {
        const set = i < length && mask[at(line, i)];
        if (set && from < 0) from = i;
        if (!set && from >= 0) {
          if (i - from >= longest) for (let k = from; k < i; k++) long2[at(line, k)] = 1;
          from = -1;
        }
      }
    }
    const crossAt = down ? (line, i) => line * width + i : (line, i) => i * width + line;
    for (let line = 0; line < length; line++) {
      let last = -1;
      for (let i = 0; i < lines; i++) {
        if (!long2[crossAt(line, i)]) continue;
        if (last >= 0 && i - last > 1 && i - last <= widest) for (let k = last + 1; k < i; k++) out[crossAt(line, k)] = 1;
        last = i;
      }
    }
  }
  return out;
}
function dropShortBits(mask, width, height, shortest) {
  const labels = new Int32Array(width * height);
  const sizesOf = [0];
  const stack = new Int32Array(width * height);
  for (let start3 = 0; start3 < labels.length; start3++) {
    if (!mask[start3] || labels[start3]) continue;
    const id = sizesOf.length;
    let top2 = 0;
    let left = width, right = 0, up = height, down = 0;
    labels[start3] = id;
    stack[top2++] = start3;
    while (top2) {
      const i = stack[--top2];
      const x = i % width, y = (i - x) / width;
      left = Math.min(left, x);
      right = Math.max(right, x);
      up = Math.min(up, y);
      down = Math.max(down, y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (mask[next] && !labels[next]) {
            labels[next] = id;
            stack[top2++] = next;
          }
        }
      }
    }
    sizesOf.push(Math.max(right - left, down - up) + 1);
  }
  for (let i = 0; i < labels.length; i++) if (labels[i] && sizesOf[labels[i]] < shortest) mask[i] = 0;
}
function pieces(mask, width, height, down, { shortest, thinnest, thickest }) {
  const lines = down ? width : height, length = down ? height : width;
  const at = down ? (line, i) => i * width + line : (line, i) => line * width + i;
  const done = [];
  let active = [];
  for (let line = 0; line < lines; line++) {
    const runs = [];
    let from = -1;
    for (let i = 0; i <= length; i++) {
      const set = i < length && mask[at(line, i)];
      if (set && from < 0) from = i;
      if (!set && from >= 0) {
        if (i - from >= shortest) runs.push([from, i]);
        from = -1;
      }
    }
    const used = new Array(runs.length).fill(false);
    const next = [];
    for (const band2 of active) {
      const k = runs.findIndex(([s, e], index) => !used[index] && Math.min(e, band2.end) - Math.max(s, band2.start) > 0.8 * Math.max(band2.end - band2.start, e - s));
      if (k < 0) {
        done.push(band2);
        continue;
      }
      used[k] = true;
      next.push({ ...band2, start: Math.max(band2.start, runs[k][0]), end: Math.min(band2.end, runs[k][1]), last: line });
    }
    runs.forEach(([start3, end2], k) => {
      if (!used[k]) next.push({ start: start3, end: end2, first: line, last: line });
    });
    active = next;
  }
  done.push(...active);
  return done.map((band2) => ({
    axis: (band2.first + band2.last + 1) / 2,
    start: band2.start,
    end: band2.end,
    thickness: band2.last - band2.first + 1
  })).filter((piece) => piece.thickness >= thinnest && piece.thickness <= thickest && piece.end - piece.start >= shortest);
}
function closeOpenings(mask, width, height, down, wall2, reach2, thickest) {
  const at = down ? (along, across) => along * width + across : (along, across) => across * width + along;
  const length = down ? height : width, breadth = down ? width : height;
  const bridges = [];
  for (const piece of wall2.filter((piece2) => piece2.end - piece2.start >= 1.5 * piece2.thickness && piece2.thickness <= thickest)) {
    const half = Math.max(1, Math.floor(piece.thickness * 0.25));
    const centre2 = Math.floor(piece.axis);
    const from = Math.max(0, centre2 - half), to = Math.min(breadth - 1, centre2 + half);
    const filled = (along) => {
      let set = 0;
      for (let across = from; across <= to; across++) set += mask[at(along, across)];
      return set >= 0.5 * (to - from + 1);
    };
    for (const direction2 of [-1, 1]) {
      const end2 = direction2 > 0 ? piece.end : piece.start - 1;
      let step2 = 1;
      while (step2 <= reach2) {
        const along2 = end2 + direction2 * step2;
        if (along2 < 0 || along2 >= length) break;
        if (filled(along2)) break;
        step2++;
      }
      const along = end2 + direction2 * step2;
      if (step2 === 1 || step2 > reach2 || along < 0 || along >= length) continue;
      const [a, b] = direction2 > 0 ? [end2 + 1, along] : [along + 1, end2 + 1];
      const top2 = Math.round(piece.axis - piece.thickness / 2), bottom2 = Math.round(piece.axis + piece.thickness / 2);
      bridges.push(down ? { box: [top2, a, bottom2, b], down, gap: b - a, axis: piece.axis, thickness: piece.thickness } : { box: [a, top2, b, bottom2], down, gap: b - a, axis: piece.axis, thickness: piece.thickness });
    }
  }
  for (const { box: [left, top2, right, bottom2] } of bridges) {
    for (let y = Math.max(0, top2); y < Math.min(height, bottom2); y++) {
      for (let x = Math.max(0, left); x < Math.min(width, right); x++) mask[y * width + x] = 1;
    }
  }
  return bridges;
}
function wallAt(mask, width, breadth, down, { axis, thickness }) {
  const half = Math.max(1, Math.floor(thickness * 0.25));
  const centre2 = Math.floor(axis);
  const from = Math.max(0, centre2 - half), to = Math.min(breadth - 1, centre2 + half);
  return (along) => {
    let set = 0;
    for (let across = from; across <= to; across++) set += mask[down ? along * width + across : across * width + along];
    return set >= 0.5 * (to - from + 1);
  };
}
function glassGaps(sturdy, drawn, heavy, width, height, down, wall2, { narrowest, widest }) {
  const at = down ? (along, across) => along * width + across : (along, across) => across * width + along;
  const length = down ? height : width, breadth = down ? width : height;
  const gaps = [];
  for (const piece of wall2) {
    const filled = wallAt(sturdy, width, breadth, down, piece);
    const top2 = Math.max(0, Math.round(piece.axis - piece.thickness / 2));
    const bottom2 = Math.min(breadth, Math.round(piece.axis + piece.thickness / 2));
    const holds = (mask, along) => {
      for (let across = top2; across < bottom2; across++) if (mask[at(along, across)]) return true;
      return false;
    };
    for (const direction2 of [-1, 1]) {
      const end2 = direction2 > 0 ? piece.end : piece.start - 1;
      let step2 = 1;
      while (step2 <= widest) {
        const along2 = end2 + direction2 * step2;
        if (along2 < 0 || along2 >= length || filled(along2)) break;
        step2++;
      }
      const along = end2 + direction2 * step2;
      if (step2 > widest || along < 0 || along >= length) continue;
      const [a, b] = direction2 > 0 ? [end2 + 1, along] : [along + 1, end2 + 1];
      if (b - a < narrowest) continue;
      let glass = 0, thin = 0;
      for (let k = a; k < b; k++) {
        if (holds(drawn, k)) glass++;
        if (holds(heavy, k)) thin++;
      }
      if (glass < 0.85 * (b - a) || thin > 0.3 * (b - a)) continue;
      gaps.push({ down, a, b, gap: b - a, axis: piece.axis, thickness: piece.thickness });
    }
  }
  return gaps;
}
function doorSwings(drawn, width, height, { down, a, b, gap: gap2, axis, thickness }) {
  const marked = (along, across, slack) => {
    for (let dy = -slack; dy <= slack; dy++) {
      for (let dx = -slack; dx <= slack; dx++) {
        const x = Math.round(down ? across : along) + dx, y = Math.round(down ? along : across) + dy;
        if (x >= 0 && y >= 0 && x < width && y < height && drawn[y * width + x]) return true;
      }
    }
    return false;
  };
  for (const radius of [gap2, gap2 / 2]) {
    const slack = Math.max(1, Math.min(4, Math.round(radius * 0.06)));
    for (const [hinge, into] of [[a, 1], [b, -1]]) {
      for (const side of [-1, 1]) {
        for (const face of [0, side * thickness / 2, -side * thickness / 2]) {
          let arc = 0, leaf = 0;
          const steps2 = 15;
          for (let k = 1; k <= steps2; k++) {
            const angle2 = (8 + 74 * k / steps2) * Math.PI / 180;
            if (marked(hinge + into * radius * Math.cos(angle2), axis + face + side * radius * Math.sin(angle2), slack)) arc++;
            if (marked(hinge, axis + side * (thickness / 2 + (radius - thickness / 2) * (0.15 + 0.8 * k / steps2)), slack)) leaf++;
          }
          if (arc >= 0.7 * steps2 || leaf >= 0.85 * steps2) return true;
        }
      }
    }
  }
  return false;
}
function outsideOf(blocked, width, height, r) {
  const open = empty(width * height);
  for (let i = 0; i < open.length; i++) open[i] = blocked[i] ? 0 : 1;
  const cores = spread(open, width, height, r, true);
  const seen = empty(width * height);
  const stack = new Int32Array(width * height);
  let top2 = 0;
  const push = (i) => {
    if (cores[i] && !seen[i]) {
      seen[i] = 1;
      stack[top2++] = i;
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (top2) {
    const i = stack[--top2];
    const x = i % width, y = (i - x) / width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (y > 0) push(i - width);
    if (y < height - 1) push(i + width);
  }
  const outside = spread(seen, width, height, r, false);
  for (let i = 0; i < outside.length; i++) outside[i] &= open[i];
  return outside;
}
function outerEdge(labels, width, height, id, start3) {
  const inside = (x2, y2) => x2 >= 0 && y2 >= 0 && x2 < width && y2 < height && labels[y2 * width + x2] === id;
  const headings = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const aheadLeft = [[0, -1], [0, 0], [-1, 0], [-1, -1]];
  const aheadRight = [[0, 0], [-1, 0], [-1, -1], [0, -1]];
  const x0 = start3 % width, y0 = (start3 - x0) / width;
  let x = x0, y = y0, heading = 0;
  const corners = [];
  for (let guard = 0; guard < 4 * labels.length; guard++) {
    x += headings[heading][0];
    y += headings[heading][1];
    const right = inside(x + aheadRight[heading][0], y + aheadRight[heading][1]);
    const left = inside(x + aheadLeft[heading][0], y + aheadLeft[heading][1]);
    const turn = !right ? 1 : left ? 3 : 0;
    if (turn) {
      corners.push([x, y]);
      heading = (heading + turn) % 4;
    }
    if (x === x0 && y === y0 && heading === 0) break;
  }
  return corners;
}
function roomEdge(labels, width, height, area, notch) {
  const pad = notch + 2;
  const [left, top2, right, bottom2] = area.box;
  const across = right - left + 1 + 2 * pad, down = bottom2 - top2 + 1 + 2 * pad;
  const local = empty(across * down);
  for (let y = top2; y <= bottom2; y++) {
    for (let x = left; x <= right; x++) if (labels[y * width + x] === area.id) local[(y - top2 + pad) * across + x - left + pad] = 1;
  }
  const smooth2 = spread(spread(local, across, down, notch, false), across, down, notch, true);
  const start3 = smooth2.indexOf(1);
  return outerEdge(smooth2, across, down, 1, start3).map(([x, y]) => [x + left - pad, y + top2 - pad]);
}
function fewerCorners(points, tolerance) {
  if (points.length <= 4) return points;
  const away = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const length = Math.hypot(dx, dy);
    return length ? Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / length : Math.hypot(p[0] - a[0], p[1] - a[1]);
  };
  const reduce = (list2) => {
    let worst = 0, index = 0;
    for (let i = 1; i < list2.length - 1; i++) {
      const d = away(list2[i], list2[0], list2[list2.length - 1]);
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (worst <= tolerance) return [list2[0], list2[list2.length - 1]];
    return [...reduce(list2.slice(0, index + 1)).slice(0, -1), ...reduce(list2.slice(index))];
  };
  let far = 0;
  points.forEach((p, i) => {
    if (Math.hypot(p[0] - points[0][0], p[1] - points[0][1]) > Math.hypot(points[far][0] - points[0][0], points[far][1] - points[0][1])) far = i;
  });
  const ring2 = [...points, points[0]];
  return [...reduce(ring2.slice(0, far + 1)).slice(0, -1), ...reduce(ring2.slice(far)).slice(0, -1)];
}
function traceFloorPlan(image, metresAcross, stages = null) {
  const { data, width, height } = image ?? {};
  if (!data || !Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16 || width * height > traceLimits.pixels || data.length < width * height * 4) return null;
  if (!Number.isFinite(metresAcross) || metresAcross <= 0) return null;
  const perMetre = width / metresAcross;
  const px = (metres2) => metres2 * perMetre;
  const count = width * height;
  const dark = empty(count), grey = empty(count), tone = empty(count).fill(255);
  for (let i = 0, p = 0; i < count; i++, p += 4) {
    const r = data[p], g = data[p + 1], b = data[p + 2];
    if (data[p + 3] < 128) continue;
    const luma = (299 * r + 587 * g + 114 * b) / 1e3;
    tone[i] = luma;
    const most2 = Math.max(r, g, b), spreadOf = most2 - Math.min(r, g, b);
    if (spreadOf > 30 && spreadOf > 0.28 * most2) continue;
    if (luma < darkLimit) dark[i] = 1;
    else if (luma < lightLimit) grey[i] = 1;
  }
  const either = grey.slice();
  for (let i = 0; i < count; i++) either[i] |= dark[i];
  const fill3 = opened(either, width, height, Math.max(2, Math.round(px(sizes.thickestWall / 2))));
  const ink2 = dark.slice();
  for (let i = 0; i < count; i++) if (grey[i] && !fill3[i]) ink2[i] = 1;
  if (stages) stages.ink = ink2.slice();
  const lineGap = Math.max(1, Math.round(px(sizes.lineGap)));
  const seal = (mask) => spread(spread(mask, width, height, lineGap, false), width, height, lineGap, true);
  const sealed = seal(ink2);
  const solid = betweenLines(sealed, width, height, Math.round(px(sizes.longLine)), Math.round(px(sizes.wallFaces)));
  const cavities = areas(solid, width, height, distances(solid, width, height));
  const narrow = new Set(cavities.found.filter((area) => area && !area.edge && area.depth <= px(sizes.wallCavity)).map((area) => area.id));
  for (let i = 0; i < count; i++) if (narrow.has(cavities.labels[i])) solid[i] = 1;
  const thinnestWall = Math.max(1, Math.round(px(sizes.line) / 2));
  const walls = opened(solid, width, height, thinnestWall);
  dropShortBits(walls, width, height, px(sizes.shortestBit));
  if (stages) Object.assign(stages, { solid, walls: walls.slice() });
  const limits = {
    shortest: Math.max(3, Math.round(px(sizes.shortestWall))),
    thinnest: Math.max(2, Math.round(px(sizes.line))),
    thickest: Math.max(4, Math.round(px(sizes.thickestWall)))
  };
  const across = pieces(walls, width, height, false, limits), down = pieces(walls, width, height, true, limits);
  const reach2 = Math.round(px(sizes.widestOpening));
  const closed = walls.slice();
  const doorWall2 = Math.round(px(sizes.doorWall));
  const bridges = [
    ...closeOpenings(closed, width, height, false, across, reach2, doorWall2),
    ...closeOpenings(closed, width, height, true, down, reach2, doorWall2)
  ];
  const sturdy = opened(sealed, width, height, Math.max(1, Math.round(px(sizes.windowWall) / 2)));
  let solidWalls2 = 0, allWalls = 0;
  for (let i = 0; i < count; i++) {
    if (!walls[i]) continue;
    allWalls++;
    solidWalls2 += sturdy[i];
  }
  const panes = [];
  const drawn = empty(count), fine = empty(count);
  if (allWalls && solidWalls2 >= 0.5 * allWalls) {
    const away = Math.max(3, Math.round(px(sizes.windowWall)));
    for (let y = 0, i = 0; y < height; y++) {
      for (let x = 0; x < width; x++, i++) {
        const limit = tone[i] + faintStep;
        const lighter = (before, after) => (before ? tone[i - before] : 255) >= limit && (after ? tone[i + after] : 255) >= limit;
        if (lighter(x >= away ? away : 0, x + away < width ? away : 0) || lighter(y >= away ? away * width : 0, y + away < height ? away * width : 0)) drawn[i] = 1;
      }
    }
    const heavy = opened(dark, width, height, thinnestWall);
    const nearWalls = spread(walls, width, height, Math.max(2, Math.round(px(0.03))), false);
    for (let i = 0; i < count; i++) if (drawn[i] && !nearWalls[i]) fine[i] = 1;
    const solidLimits = { shortest: Math.max(3, Math.round(px(0.15))), thinnest: 2, thickest: limits.thickest };
    const glassSizes = { narrowest: Math.round(px(sizes.narrowestWindow)), widest: Math.round(px(sizes.widestWindow)) };
    for (const goesDown of [false, true]) {
      const ends = pieces(sturdy, width, height, goesDown, solidLimits).filter((piece) => piece.end - piece.start >= 0.6 * piece.thickness);
      for (const pane of glassGaps(sturdy, drawn, heavy, width, height, goesDown, ends, glassSizes)) {
        if (!panes.some((other) => other.down === pane.down && Math.abs(other.axis - pane.axis) < Math.max(other.thickness, pane.thickness) && Math.min(other.b, pane.b) - Math.max(other.a, pane.a) > 0.5 * Math.min(other.gap, pane.gap))) panes.push(pane);
      }
    }
  }
  if (stages) Object.assign(stages, { sturdy, drawn, panes });
  const roomsBetween = (shut) => {
    const blocked = shut.slice();
    const outside = outsideOf(blocked, width, height, Math.round(px(sizes.widestOpening / 2)) + 1);
    for (let i = 0; i < count; i++) if (outside[i]) blocked[i] = 1;
    const spaces = areas(blocked, width, height, distances(blocked, width, height));
    const candidates = spaces.found.filter((area) => area && !area.edge && area.size >= px(1) * px(sizes.smallestRoom) && area.depth >= px(sizes.narrowestRoom / 2));
    const tolerance = Math.max(1.5, px(sizes.outline));
    for (const area of candidates) {
      let points = fewerCorners(roomEdge(spaces.labels, width, height, area, Math.round(px(sizes.notch))), tolerance);
      for (let wider = tolerance * 1.4; points.length > traceLimits.corners && wider <= px(sizes.roughOutline); wider *= 1.4) {
        points = fewerCorners(points, wider);
      }
      area.points = points;
    }
    const rooms2 = candidates.filter((area) => area.points.length >= 3 && area.points.length <= traceLimits.corners && candidates.filter((other) => other !== area && containsPoint(area.points, other.points[0])).length < 2).sort((a, b) => b.size - a.size).slice(0, traceLimits.rooms);
    const numbers = new Map(rooms2.map((area, index) => [area.id, index + 1]));
    const labels2 = new Uint16Array(count);
    for (let i = 0; i < count; i++) labels2[i] = numbers.get(spaces.labels[i]) ?? 0;
    return { blocked, outside, spaces, rooms: rooms2, labels: labels2 };
  };
  let found = roomsBetween(closed);
  const besides = ({ down: goesDown, a, b, axis, thickness }) => [-1, 1].map((sign) => {
    const offset2 = thickness / 2 + Math.max(2, px(0.1));
    const seen = /* @__PURE__ */ new Map();
    let open = false;
    for (const part of [0.25, 0.5, 0.75]) {
      const along = Math.round(a + (b - a) * part), over = Math.round(axis + sign * offset2);
      const [x, y] = goesDown ? [over, along] : [along, over];
      if (x < 0 || y < 0 || x >= width || y >= height) {
        open = true;
        continue;
      }
      const i = y * width + x;
      if (found.labels[i]) seen.set(found.labels[i], (seen.get(found.labels[i]) ?? 0) + 1);
      else if (found.outside[i] || found.spaces.found[found.spaces.labels[i]]?.edge) open = true;
    }
    const room = [...seen].sort((one, two) => two[1] - one[1])[0]?.[0] ?? 0;
    return { room, open: !room && open };
  });
  const stillOpen = panes.filter((pane) => {
    const [one, two] = besides(pane);
    if (one.room && one.room === two.room) return false;
    if (!one.room && !two.room && !one.open && !two.open) return false;
    let shut = 0;
    const centre2 = Math.floor(pane.axis);
    for (let along = pane.a; along < pane.b; along++) shut += closed[pane.down ? along * width + centre2 : centre2 * width + along];
    return shut < 0.9 * pane.gap;
  });
  if (stillOpen.length) {
    for (const { down: goesDown, a, b, axis, thickness } of stillOpen) {
      const from = Math.max(0, Math.round(axis - thickness / 2)), to = Math.round(axis + thickness / 2);
      for (let along = Math.max(0, a - 2); along < Math.min(goesDown ? height : width, b + 2); along++) {
        for (let over = from; over < Math.min(goesDown ? width : height, to); over++) closed[goesDown ? along * width + over : over * width + along] = 1;
      }
    }
    found = roomsBetween(closed);
  }
  if (stages) Object.assign(stages, { closed: found.blocked, spaces: found.spaces });
  const { rooms, labels } = found;
  const share2 = ([x, y]) => [Math.min(1, Math.max(0, x / width)), Math.min(1, Math.max(0, y / height))];
  const span = ({ down: goesDown, a, b, axis }) => goesDown ? { from: share2([axis, a]), to: share2([axis, b]) } : { from: share2([a, axis]), to: share2([b, axis]) };
  const doors = [];
  const addDoor = (door) => {
    if (!doors.some((other) => Math.hypot(other.from[0] - door.from[0], (other.from[1] - door.from[1]) * height / width) < px(0.2) / width)) doors.push(door);
  };
  const windows2 = [], glazed = [];
  for (const pane of panes) {
    const [one, two] = besides(pane);
    pane.sides = [one, two];
    if (one.room === two.room) continue;
    const inner = Boolean(one.room && two.room);
    if (!inner && !one.open && !two.open) continue;
    if (doorSwings(fine, width, height, pane)) {
      if (inner) addDoor(span(pane));
      glazed.push(pane);
      pane.found = "door";
      continue;
    }
    if (inner) {
      const filled = wallAt(sturdy, width, pane.down ? width : height, pane.down, pane);
      const length = pane.down ? height : width, past = Math.round(px(sizes.wallPastWindow));
      let before = 0, after = 0;
      for (let k = 0; k < past; k++) {
        if (pane.a - 2 - k >= 0 && filled(pane.a - 2 - k)) before++;
        if (pane.b + k < length && filled(pane.b + k)) after++;
      }
      if (pane.gap > px(sizes.widestInnerWindow) || before < 0.9 * past || after < 0.9 * past) continue;
    }
    windows2.push(span(pane));
    glazed.push(pane);
    pane.found = "window";
  }
  for (const bridge2 of bridges) {
    if (bridge2.gap < px(sizes.narrowestDoor)) continue;
    const [left, top2, right, bottom2] = bridge2.box;
    const middle = bridge2.down ? (top2 + bottom2) / 2 : (left + right) / 2;
    if (glazed.some((pane) => pane.down === bridge2.down && Math.abs(pane.axis - bridge2.axis) < Math.max(pane.thickness, bridge2.thickness) && middle > pane.a && middle < pane.b)) continue;
    const offset2 = bridge2.thickness / 2 + Math.max(2, px(0.1));
    const side = (sign) => {
      const x = Math.round(bridge2.down ? bridge2.axis + sign * offset2 : middle);
      const y = Math.round(bridge2.down ? middle : bridge2.axis + sign * offset2);
      return x >= 0 && y >= 0 && x < width && y < height ? labels[y * width + x] : 0;
    };
    const [one, two] = [side(-1), side(1)];
    if (!one || !two || one === two) continue;
    addDoor(bridge2.down ? { from: [bridge2.axis / width, top2 / height], to: [bridge2.axis / width, bottom2 / height] } : { from: [left / width, bridge2.axis / height], to: [right / width, bridge2.axis / height] });
  }
  return {
    rooms: rooms.map((area) => ({ points: area.points.map(share2) })),
    doors,
    windows: windows2,
    labels,
    size: { width, height }
  };
}
function overlaps(points, traced, step2) {
  const { labels, size: { width, height } } = traced;
  const xs = points.map(([x]) => x * width), ys = points.map(([, y]) => y * height);
  const hits = /* @__PURE__ */ new Map();
  let area = 0;
  const top2 = Math.max(0, Math.floor(Math.min(...ys))), bottom2 = Math.min(height - 1, Math.ceil(Math.max(...ys)));
  for (let y = top2; y <= bottom2; y += step2) {
    const crossings = [];
    for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) {
      if (ys[i] > y !== ys[j] > y) crossings.push(xs[i] + (y - ys[i]) * (xs[j] - xs[i]) / (ys[j] - ys[i]));
    }
    crossings.sort((a, b) => a - b);
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      for (let x = Math.max(0, Math.ceil(crossings[k])); x <= Math.min(width - 1, crossings[k + 1]); x += step2) {
        area++;
        const label = labels[y * width + x];
        if (label) hits.set(label, (hits.get(label) ?? 0) + 1);
      }
    }
  }
  return { area, hits };
}
function followTracedWalls(recognition2, traced) {
  if (!traced?.rooms?.length || !Array.isArray(recognition2?.rooms)) return recognition2;
  const step2 = Math.max(1, Math.round(Math.max(traced.size.width, traced.size.height) / 500));
  const sizes3 = /* @__PURE__ */ new Map();
  for (let y = 0; y < traced.size.height; y += step2) {
    for (let x = 0; x < traced.size.width; x += step2) {
      const label = traced.labels[y * traced.size.width + x];
      if (label) sizes3.set(label, (sizes3.get(label) ?? 0) + 1);
    }
  }
  const taken = /* @__PURE__ */ new Set();
  const rooms = recognition2.rooms.map((room) => {
    if (!Array.isArray(room?.points) || room.points.length < 3 || !room.points.every((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))) return room;
    const { area, hits } = overlaps(room.points, traced, step2);
    let best = null;
    for (const [label, shared] of hits) {
      const union = area + sizes3.get(label) - shared;
      const match = union > 0 ? shared / union : 0;
      if (!best || match > best.match) best = { label, match };
    }
    if (!best || best.match < 0.7 || taken.has(best.label)) return room;
    taken.add(best.label);
    return { ...room, points: traced.rooms[best.label - 1].points };
  });
  return { ...recognition2, rooms };
}
var sizes, darkLimit, lightLimit, faintStep, traceLimits, empty, opened, containsPoint;
var init_floor_planner_trace = __esm({
  "src/js/floor-planner-trace.mjs"() {
    init_floor_planner_recognise();
    sizes = {
      // Breaks in a line shorter than twice this are closed: a scan or a
      // shrunk image loses bits of thin lines.
      lineGap: 0.015,
      // Loose bits shorter than this (text, symbols) are no walls.
      shortestBit: 0.8,
      // Two long lines this close together are the two faces of one wall.
      longLine: 0.5,
      wallFaces: 0.45,
      // Half the widest gap between the lines of a wall or column drawn as an
      // outline, when that gap is closed off all round. Wider closed gaps are
      // corners of a room, such as one cut off by a dimension line.
      wallCavity: 0.145,
      // Lines thinner than this are drawing, not wall.
      line: 0.055,
      // The thickest wall, and the widest door or passage that is closed.
      thickestWall: 0.7,
      widestOpening: 1.3,
      // The thickest wall that an opening is closed in.
      doorWall: 0.45,
      narrowestDoor: 0.55,
      // The shortest piece of wall whose end can close an opening.
      shortestWall: 0.25,
      // A room is at least this wide, and this large in square metres.
      narrowestRoom: 0.6,
      smallestRoom: 1.2,
      // How far an outline may stray from the traced edge, and the most it
      // may stray to keep a room within the planner's number of corners.
      outline: 0.05,
      roughOutline: 0.3,
      // Notches in a room narrower than twice this (columns, furniture against
      // a wall) are left out of its outline.
      notch: 0.2,
      // A window lies in a wall at least this thick, and is this wide. With a
      // room on both sides it is narrower, and the wall goes on past it.
      windowWall: 0.12,
      narrowestWindow: 0.35,
      widestWindow: 5,
      widestInnerWindow: 2.5,
      wallPastWindow: 0.5
    };
    darkLimit = 128;
    lightLimit = 190;
    faintStep = 18;
    traceLimits = { rooms: recognitionLimits.rooms, corners: recognitionLimits.corners, pixels: 42e5 };
    empty = (size) => new Uint8Array(size);
    opened = (mask, width, height, r) => spread(spread(mask, width, height, r, true), width, height, r, false);
    containsPoint = (points, [x, y]) => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
  }
});

// src/js/floor-planner-vacuum.mjs
function traceColourMap(image, metresAcross) {
  const { data, width, height } = image ?? {};
  if (!data || !Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16 || width * height > traceLimits.pixels || data.length < width * height * 4) return null;
  if (!Number.isFinite(metresAcross) || metresAcross <= 0) return null;
  const px = (metres2) => metres2 * width / metresAcross;
  const count = width * height;
  const keys = new Uint16Array(count);
  const tally = new Uint32Array(1 << 15);
  for (let i = 0, p = 0; i < count; i++, p += 4) {
    const clear = data[p + 3] < 128;
    keys[i] = clear ? 32767 : data[p] >> 3 << 10 | data[p + 1] >> 3 << 5 | data[p + 2] >> 3;
    tally[keys[i]]++;
  }
  const least = Math.max(16, px(1) * px(0.2));
  const common = [];
  tally.forEach((seen, key) => {
    if (seen >= least / 4) common.push(key);
  });
  common.sort((one, two) => tally[two] - tally[one]);
  const parts = (key) => [key >> 10, key >> 5 & 31, key & 31];
  const apart = (one, two) => Math.max(...parts(one).map((part, k) => Math.abs(part - parts(two)[k])));
  const colours = [];
  const colourOf = new Int16Array(1 << 15).fill(-1);
  for (const key of common) {
    let index = colours.findIndex((colour) => apart(colour, key) <= sameColour);
    if (index < 0 && tally[key] >= least && colours.length < mostColours) index = colours.push(key) - 1;
    colourOf[key] = index;
  }
  if (!colours.length) return null;
  const onEdge = new Uint32Array(colours.length);
  const edge = (i) => {
    if (colourOf[keys[i]] >= 0) onEdge[colourOf[keys[i]]]++;
  };
  for (let x = 0; x < width; x++) {
    edge(x);
    edge((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    edge(y * width);
    edge(y * width + width - 1);
  }
  const background = onEdge.indexOf(Math.max(...onEdge));
  const labels = new Uint16Array(count);
  const found = [];
  const close = Math.max(1, Math.round(px(sizes2.line)));
  const tolerance = Math.max(1.5, px(sizes2.outline));
  colours.forEach((_, colour) => {
    if (colour === background) return;
    const mask = new Uint8Array(count);
    let size = 0;
    for (let i = 0; i < count; i++) {
      if (colourOf[keys[i]] === colour) size += mask[i] = 1;
    }
    if (size < 0.8 * px(1) * px(sizes2.smallestRoom)) return;
    const whole = spread(spread(mask, width, height, close, false), width, height, close, true);
    const blocked = new Uint8Array(count);
    for (let i = 0; i < count; i++) blocked[i] = whole[i] ? 0 : 1;
    const spaces = areas(blocked, width, height, distances(blocked, width, height));
    for (const area of spaces.found) {
      if (!area || area.edge || area.size < px(1) * px(sizes2.smallestRoom) || area.depth < px(sizes2.narrowestRoom / 2)) continue;
      let points = fewerCorners(roomEdge(spaces.labels, width, height, area, Math.round(px(sizes2.notch))), tolerance);
      for (let wider = tolerance * 1.4; points.length > traceLimits.corners && wider <= px(sizes2.roughOutline); wider *= 1.4) {
        points = fewerCorners(points, wider);
      }
      if (points.length < 3 || points.length > traceLimits.corners) continue;
      found.push({ area, points, spaces });
    }
  });
  found.sort((one, two) => two.area.size - one.area.size);
  const rooms = found.slice(0, traceLimits.rooms);
  rooms.forEach(({ area, spaces }, index) => {
    const [left, top2, right, bottom2] = area.box;
    for (let y = top2; y <= bottom2; y++) {
      for (let x = left; x <= right; x++) if (spaces.labels[y * width + x] === area.id) labels[y * width + x] = index + 1;
    }
  });
  const share2 = ([x, y]) => [Math.min(1, Math.max(0, x / width)), Math.min(1, Math.max(0, y / height))];
  return { rooms: rooms.map(({ points }) => ({ points: points.map(share2) })), doors: [], windows: [], labels, size: { width, height } };
}
async function unpacked(bytes) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate")).getReader();
  const chunks = [];
  let size = 0;
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > largestMap) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const whole = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    whole.set(chunk, at);
    at += chunk.length;
  }
  return whole;
}
async function embeddedMap(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 20 || signature.some((byte, i) => bytes[i] !== byte)) return null;
  const view2 = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const name = "ValetudoMap";
  for (let at = 8; at + 12 <= bytes.length; ) {
    const length = view2.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const start3 = at + 8;
    if (start3 + length > bytes.length) return null;
    if (type === "zTXt" && length > name.length + 2 && bytes[start3 + name.length] === 0 && bytes[start3 + name.length + 1] === 0 && String.fromCharCode(...bytes.subarray(start3, start3 + name.length)) === name) {
      try {
        const text2 = await unpacked(bytes.subarray(start3 + name.length + 2, start3 + length));
        const map = text2 && JSON.parse(new TextDecoder().decode(text2));
        return map?.__class === "ValetudoMap" && Array.isArray(map.layers) ? map : null;
      } catch {
        return null;
      }
    }
    if (type === "IEND") return null;
    at = start3 + length + 4;
  }
  return null;
}
function mapRooms(map, { roomName = "Room" } = {}) {
  const grain = Number(map?.pixelSize);
  if (!Number.isFinite(grain) || grain < 1 || grain > 50 || !Array.isArray(map?.layers) || map.layers.length > 600) return null;
  const layers = [];
  let left = Infinity, top2 = Infinity, right = -Infinity, bottom2 = -Infinity;
  for (const layer of map.layers) {
    if (!["floor", "wall", "segment"].includes(layer?.type) || !Array.isArray(layer.compressedPixels)) continue;
    const runs = layer.compressedPixels;
    if (runs.length % 3 || runs.length > 3e6) return null;
    for (let i = 0; i < runs.length; i += 3) {
      const [x, y, length] = [runs[i], runs[i + 1], runs[i + 2]];
      if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(length) || x < 0 || y < 0 || length < 1 || x + length > 1e5 || y > 1e5) return null;
      left = Math.min(left, x);
      right = Math.max(right, x + length - 1);
      top2 = Math.min(top2, y);
      bottom2 = Math.max(bottom2, y);
    }
    if (runs.length) layers.push(layer);
  }
  if (!layers.length) return null;
  const around = Math.max(2, Math.round(30 / grain));
  const across = right - left + 1 + 2 * around, down = bottom2 - top2 + 1 + 2 * around;
  if (across > largestGrid || down > largestGrid) return null;
  const cells = new Uint16Array(across * down);
  const segments = layers.filter((layer) => layer.type === "segment").slice(0, recognitionLimits.rooms);
  const fill3 = (layer, value) => {
    const runs = layer.compressedPixels;
    for (let i = 0; i < runs.length; i += 3) {
      const row = (runs[i + 1] - top2 + around) * across + runs[i] - left + around;
      cells.fill(value, row, row + runs[i + 2]);
    }
  };
  layers.filter((layer) => layer.type === "floor").forEach((layer) => fill3(layer, 1));
  segments.forEach((layer, index) => fill3(layer, 3 + index));
  layers.filter((layer) => layer.type === "wall").forEach((layer) => fill3(layer, 2));
  const sources = segments.length ? segments.map((layer, index) => ({ value: 3 + index, name: layer.metaData?.name })) : [{ value: 1, name: null }];
  const notch = Math.max(1, Math.round(20 / grain)), tolerance = Math.max(1, 8 / grain);
  const rooms = [];
  for (const { value, name } of sources) {
    const blocked = new Uint8Array(cells.length);
    for (let i = 0; i < cells.length; i++) blocked[i] = cells[i] === value ? 0 : 1;
    const spaces = areas(blocked, across, down, distances(blocked, across, down));
    const area = spaces.found.filter(Boolean).sort((one, two) => two.size - one.size)[0];
    if (!area || area.size * grain * grain < 2500) continue;
    let points = fewerCorners(roomEdge(spaces.labels, across, down, area, notch), tolerance);
    for (let wider = tolerance * 1.4; points.length > recognitionLimits.corners && wider <= 40 / grain; wider *= 1.4) {
      points = fewerCorners(points, wider);
    }
    if (points.length < 3 || points.length > recognitionLimits.corners) continue;
    const label = typeof name === "string" && name.trim() ? name.trim().slice(0, 48) : `${roomName} ${rooms.length + 1}`;
    rooms.push({ name: label, points: points.map(([x, y]) => [x / across, y / down]) });
  }
  if (!rooms.length) return null;
  const each = Math.max(1, Math.min(8, Math.floor(longestImage / Math.max(across, down))));
  const width = across * each, height = down * each;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 0; y < down; y++) {
    for (let x = 0; x < across; x++) {
      const cell = cells[y * across + x];
      if (!cell) continue;
      const [r, g, b] = cell === 2 ? [42, 51, 64] : cell === 1 ? [233, 237, 242] : tints[(cell - 3) % tints.length];
      for (let dy = 0; dy < each; dy++) {
        let p = ((y * each + dy) * width + x * each) * 4;
        for (let dx = 0; dx < each; dx++, p += 4) {
          data[p] = r;
          data[p + 1] = g;
          data[p + 2] = b;
        }
      }
    }
  }
  return { recognition: { width_m: across * grain / 100, rooms }, image: { data, width, height } };
}
var sizes2, sameColour, mostColours, signature, largestMap, tints, largestGrid, longestImage;
var init_floor_planner_vacuum = __esm({
  "src/js/floor-planner-vacuum.mjs"() {
    init_floor_planner_recognise();
    init_floor_planner_trace();
    sizes2 = {
      // Lines over a room (the path the robot drove) up to twice this wide are closed.
      line: 0.03,
      narrowestRoom: 0.6,
      smallestRoom: 1.2,
      outline: 0.08,
      roughOutline: 0.3,
      notch: 0.2
    };
    sameColour = 2;
    mostColours = 32;
    signature = [137, 80, 78, 71, 13, 10, 26, 10];
    largestMap = 48e6;
    tints = [[250, 215, 190], [200, 226, 244], [242, 204, 200], [205, 234, 214], [250, 234, 178], [226, 210, 240], [196, 232, 226], [250, 222, 160]];
    largestGrid = 2400;
    longestImage = 1600;
  }
});

// src/js/floor-planner-tools.mjs
var repeatingTools, toolRepeats, chosenTool;
var init_floor_planner_tools = __esm({
  "src/js/floor-planner-tools.mjs"() {
    repeatingTools = ["wall", "door", "window", "mirror", "zone"];
    toolRepeats = (tool2, item = null) => repeatingTools.includes(tool2) && !item;
    chosenTool = (active, chosen) => chosen === active ? "edit" : chosen;
  }
});

// src/js/floor-planner-account.js
var recognise, sharing;
var init_floor_planner_account = __esm({
  "src/js/floor-planner-account.js"() {
    recognise = null;
    sharing = null;
  }
});

// src/js/floor-planner-sheet.mjs
function planBounds(plan2, around = 0.5) {
  const points = [
    ...plan2.rooms.flatMap(roomCorners),
    ...plan2.walls.flatMap((item) => [[item.x, item.y], [item.endX, item.endY]]),
    ...plan2.sensors.map((item) => [item.x, item.y]),
    ...(plan2.furniture ?? []).map((item) => [item.x, item.y])
  ];
  const xs = points.map(([x2]) => x2), ys = points.map(([, y2]) => y2);
  const x = Math.min(...xs) - around, y = Math.min(...ys) - around;
  return { x, y, width: Math.max(...xs) + around - x, height: Math.max(...ys) + around - y };
}
function scaleBar(pixelsPerMetre, boxWidth) {
  const lengths = [0.5, 1, 2, 5, 10, 20];
  return lengths.find((length) => length * pixelsPerMetre >= boxWidth * 0.12) ?? lengths.at(-1);
}
function sensorList(plan2, box2, columns, copy2) {
  if (!plan2.sensors.length) return "";
  const rows = Math.max(1, Math.floor((box2.height - 56) / rowHeight));
  const most2 = rows * columns;
  const shown = plan2.sensors.length > most2 ? most2 - 1 : plan2.sensors.length;
  const column = (box2.width - (columns - 1) * gap) / columns;
  const letters = Math.floor(column / 11.5);
  const entries2 = plan2.sensors.slice(0, shown).map((item, index) => {
    const device = devices[item.model];
    const room = roomForDevice(plan2.rooms, item);
    const x = box2.x + Math.floor(index / rows) * (column + gap), y = box2.y + 56 + index % rows * rowHeight;
    return `<g transform="translate(${x} ${y})" fill="${device?.mount === "ceiling" ? ceiling : wall}">
            <circle cx="15" cy="15" r="15" fill-opacity=".14"/>
            <text x="15" y="20" font-size="13" font-weight="800" text-anchor="middle">${String(index + 1).padStart(2, "0")}</text>
            <text x="42" y="13" font-size="17" font-weight="700" fill="${ink}">${escapeText(clipped(device?.name ?? item.model, letters))}</text>
            <text x="42" y="32" font-size="14" fill="${muted}">${escapeText(clipped(room?.name ?? copy2.sim_outside_rooms ?? "", letters + 6))}</text>
        </g>`;
  });
  const rest = plan2.sensors.length - shown;
  if (rest > 0) {
    const x = box2.x + Math.floor(shown / rows) * (column + gap), y = box2.y + 56 + shown % rows * rowHeight;
    entries2.push(`<text x="${x + 42}" y="${y + 20}" font-size="15" font-weight="600" fill="${muted}">+ ${rest}</text>`);
  }
  return `<text x="${box2.x}" y="${box2.y + 22}" font-size="15" font-weight="800" letter-spacing="1.2" fill="${muted}">${escapeText((copy2.sheet_sensors ?? "Sensors").toUpperCase())}</text>
        <line x1="${box2.x}" y1="${box2.y + 36}" x2="${box2.x + box2.width}" y2="${box2.y + 36}" stroke="${rule}" stroke-width="1.5"/>
        ${entries2.join("")}`;
}
function sheetPages(project, { copy: copy2 = {}, number: number4 = new Intl.NumberFormat("en", { maximumFractionDigits: 2 }), date = "", coverage: coverage2 = true, radarOptions } = {}) {
  const floors = sheetFloors(project);
  const whole = new Intl.NumberFormat(number4.resolvedOptions().locale, { maximumFractionDigits: 0 });
  return floors.map((floor) => {
    const plan2 = floor.plan;
    const bounds = planBounds(plan2);
    const upright = bounds.height > bounds.width * 1.2;
    const [width, height] = upright ? [short2, long] : [long, short2];
    const inner = { x: margin, y: top, width: width - 2 * margin, height: height - top - bottom };
    const listHeight = upright ? Math.min(360, 96 + Math.ceil(Math.max(1, plan2.sensors.length) / 2) * rowHeight) : inner.height;
    const box2 = upright ? { ...inner, height: inner.height - listHeight - gap } : { ...inner, width: inner.width - listWidth - gap };
    const list2 = upright ? { x: inner.x, y: box2.y + box2.height + gap, width: inner.width, height: listHeight } : { x: box2.x + box2.width + gap, y: inner.y, width: listWidth, height: inner.height - 70 };
    const pixelsPerMetre = Math.min(box2.width / bounds.width, box2.height / bounds.height);
    const bar = scaleBar(pixelsPerMetre, box2.width);
    const label = floorLabel(floor, copy2);
    const trip = project.staircase ? stairTrip({ ...project, activeFloor: floor.id }) : null;
    const area = plan2.rooms.reduce((sum, room) => sum + roomArea(room), 0);
    const facts = [
      [copy2.rooms ?? "Rooms", whole.format(plan2.rooms.length)],
      [copy2.sheet_area ?? "Floor area", `${whole.format(area)} m²`],
      [copy2.sheet_sensors ?? "Sensors", whole.format(plan2.sensors.length)]
    ];
    const legendY = upright ? height - bottom + 4 : list2.y + list2.height + 44;
    const legendX = upright ? width - margin - 330 : list2.x;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <style>${planStyles}</style>
    <rect width="${width}" height="${height}" fill="#fff"/>
    <text x="${margin}" y="${margin + 34}" font-size="38" font-weight="800" fill="${ink}">${escapeText(clipped(project.name ?? plan2.name ?? "", 44))}</text>
    <text x="${margin}" y="${margin + 70}" font-size="18" fill="${muted}">${escapeText([floors.length > 1 ? label : "", ...facts.map(([name, value]) => `${name} ${value}`)].filter(Boolean).join("  ·  "))}</text>
    <text x="${width - margin}" y="${margin + 34}" font-size="16" fill="${muted}" text-anchor="end">${escapeText(date)}</text>
    <line x1="${margin}" y1="${top - 28}" x2="${width - margin}" y2="${top - 28}" stroke="${rule}" stroke-width="1.5"/>
    <svg x="${box2.x}" y="${box2.y}" width="${box2.width}" height="${box2.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" preserveAspectRatio="xMidYMid meet">
        ${wellFormed(paintPlan(plan2, coverage2, null, number4, null, { radarOptions }) + (trip ? paintStairPlan(trip.stair, escapeText(copy2.staircase ?? ""), trip.up) : ""))}
    </svg>
    <g transform="translate(${margin} ${height - bottom + 30})" fill="${muted}">
        <path d="M0 0v10h${bar * pixelsPerMetre}V0" fill="none" stroke="${muted}" stroke-width="2"/>
        <text x="${bar * pixelsPerMetre + 10}" y="11" font-size="14">${number4.format(bar)} m</text>
    </g>
    ${sensorList(plan2, list2, upright ? 2 : 1, copy2)}
    ${plan2.sensors.length ? `<g transform="translate(${legendX} ${legendY})" font-size="14" fill="${muted}">
        <circle cx="7" cy="-5" r="7" fill="${ceiling}"/><text x="22">CeilSense</text>
        <circle cx="127" cy="-5" r="7" fill="${wall}"/><text x="142">WallSense / UltimateSensor</text>
    </g>` : ""}
    <text x="${width - margin}" y="${height - 34}" font-size="14" fill="${muted}" text-anchor="end">${escapeText(copy2.sheet_credit ?? "")}</text>
</svg>`;
    return { name: label, width, height, svg };
  });
}
function pdfDocument(images, { title = "", creator = "" } = {}) {
  const [a4Short, a4Long] = [595.28, 841.89];
  const objects = [];
  const add2 = (...parts) => objects.push(parts.map((part) => typeof part === "string" ? text(part) : part)) - 1;
  const catalog = add2(""), pages = add2("");
  const kids = images.map(({ jpeg, width, height }) => {
    const [pageWidth, pageHeight] = width >= height ? [a4Long, a4Short] : [a4Short, a4Long];
    const scale3 = Math.min(pageWidth / width, pageHeight / height);
    const [drawnWidth, drawnHeight] = [width * scale3, height * scale3];
    const image = add2(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>
stream
`, jpeg, "\nendstream");
    const drawing2 = `q ${drawnWidth.toFixed(2)} 0 0 ${drawnHeight.toFixed(2)} ${((pageWidth - drawnWidth) / 2).toFixed(2)} ${((pageHeight - drawnHeight) / 2).toFixed(2)} cm /Im0 Do Q`;
    const content = add2(`<< /Length ${drawing2.length} >>
stream
${drawing2}
endstream`);
    return add2(`<< /Type /Page /Parent ${pages + 1} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${image + 1} 0 R >> >> /Contents ${content + 1} 0 R >>`);
  });
  objects[catalog] = [text(`<< /Type /Catalog /Pages ${pages + 1} 0 R >>`)];
  objects[pages] = [text(`<< /Type /Pages /Kids [${kids.map((kid) => `${kid + 1} 0 R`).join(" ")}] /Count ${kids.length} >>`)];
  const info = add2(`<< /Title ${pdfText(title)} /Creator ${pdfText(creator)} >>`);
  const chunks = [text("%PDF-1.4\n%âãÏÓ\n")];
  let size = chunks[0].length;
  const offsets = objects.map((parts, index) => {
    const offset2 = size;
    for (const part of [text(`${index + 1} 0 obj
`), ...parts, text("\nendobj\n")]) {
      chunks.push(part);
      size += part.length;
    }
    return offset2;
  });
  chunks.push(text(`xref
0 ${objects.length + 1}
0000000000 65535 f 
${offsets.map((offset2) => String(offset2).padStart(10, "0") + " 00000 n \n").join("")}trailer
<< /Size ${objects.length + 1} /Root ${catalog + 1} 0 R /Info ${info + 1} 0 R >>
startxref
${size}
%%EOF
`));
  const file = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let at = 0;
  for (const chunk of chunks) {
    file.set(chunk, at);
    at += chunk.length;
  }
  return file;
}
var long, short2, margin, top, bottom, gap, listWidth, rowHeight, ink, muted, rule, ceiling, wall, planStyles, wellFormed, clipped, sheetFloors, sheetFileName, text, pdfText;
var init_floor_planner_sheet = __esm({
  "src/js/floor-planner-sheet.mjs"() {
    init_floor_planner_building();
    init_floor_planner_drawing();
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_stairs();
    long = 1754;
    short2 = 1240;
    margin = 64;
    top = 168;
    bottom = 92;
    gap = 40;
    listWidth = 400;
    rowHeight = 46;
    ink = "#151e30";
    muted = "#5b6778";
    rule = "#dfe4ec";
    ceiling = "#4e43bb";
    wall = "#08765c";
    planStyles = `
.fp-room-floor{fill:#f2f4f7;stroke:#27303d;stroke-width:.07;stroke-linejoin:round}
.fp-room-label{fill:${ink};font-size:.238px;font-weight:700}
.fp-room-size{fill:${muted};font-size:.17px;font-weight:400}
.fp-window{fill:none;stroke:#6fb1d6;stroke-width:.07}
.fp-opening{color:#2e97d1}
.fp-opening.mirrors{color:#9a55d0}
.fp-opening line,.fp-opening path{fill:none;stroke:currentColor;stroke-width:.07}
.fp-opening .fp-opening-hit,.fp-wall .fp-wall-hit{stroke:none}
.fp-wall line{stroke:#27303d;stroke-width:.07}
.fp-door-gap{stroke:#f2f4f7;stroke-width:.1}
.fp-door-leaf{fill:none;stroke:#a06a1c;stroke-width:.045;stroke-linecap:round}
.fp-door-swing{fill:none;stroke:#c39a5a;stroke-width:.018}
.fp-door-shut{fill:none;stroke:#a06a1c;stroke-width:.06}
.fp-door rect,.fp-furniture-hit{fill:none}
.fp-furniture-part{fill:#e1e6ec;stroke:#aab4c1;stroke-width:.015}
.fp-plan-furniture[data-material="wood"] .fp-furniture-part{fill:#eadfce;stroke:#c2ae92}
.fp-range.ceiling,.fp-sensor.ceiling{color:${ceiling}}
.fp-range.wall,.fp-sensor.wall{color:${wall}}
.fp-range ellipse,.fp-range path{fill:currentColor;fill-opacity:.1;stroke:currentColor;stroke-width:.022;stroke-dasharray:.09 .09}
.fp-range .fp-secondary-range{fill:none;stroke-dasharray:.03 .07}
.fp-range .fp-motion-range{fill:none;stroke:#d9892b;stroke-width:.03;stroke-dasharray:.01 .09;stroke-linecap:round}
.fp-plan-zone{color:#1f9d6b}
.fp-plan-zone.exclusion{color:#d9534f}
.fp-plan-zone.interference{color:#c98a1b}
.fp-plan-zone.entry{color:#128a7a}
.fp-plan-zone polygon,.fp-plan-zone polyline{fill:currentColor;fill-opacity:.12;stroke:currentColor;stroke-width:.025}
.fp-plan-zone.entry polyline{fill:none;stroke-width:.05;stroke-dasharray:.1 .05}
.fp-entry-arrow{fill:none;stroke:currentColor;stroke-width:.03}
.fp-sensor{fill:#fff;stroke:currentColor;stroke-width:.03}
.fp-sensor-halo{fill:currentColor;fill-opacity:.16;stroke:none}
.fp-sensor-eye{fill:currentColor;stroke:none}
.fp-sensor text{font-size:.2px;font-weight:800;fill:currentColor;stroke:#fff;stroke-width:.05;paint-order:stroke}
.fp-wall-measure{fill:#3a465a;stroke:#fff;stroke-width:.045;paint-order:stroke;font-size:.16px;font-weight:600;text-anchor:middle;dominant-baseline:middle}
.fp-ceiling-marks{color:#8793a6}
.fp-ceiling-marks path{fill:none;stroke:currentColor;stroke-width:.015;stroke-dasharray:.08 .08}
.fp-ceiling-marks .fp-slope-arrow{stroke-dasharray:none}
.fp-ceiling-marks text{fill:currentColor;stroke:#f2f4f7;stroke-width:.04;paint-order:stroke;font-size:.164px}
.fp-stairwell{fill:#ece4d3;stroke:#a8946a;stroke-width:.028}
.fp-stair-plan line{stroke:#b9a987;stroke-width:.018}
.fp-stair-plan path{fill:none;stroke:#8a6f3a;stroke-width:.05;stroke-linecap:round;stroke-linejoin:round}
.fp-stair-plan text{fill:#6b5327;stroke:#fff;stroke-width:.05;paint-order:stroke;font-size:.2px;font-weight:700}`;
    wellFormed = (markup) => markup.replace(/\s(data-[a-z-]+)(?=[\s/>])/g, ' $1=""');
    clipped = (text2, most2) => {
      const value = String(text2 ?? "");
      return value.length > most2 ? value.slice(0, most2 - 3).trimEnd() + "..." : value;
    };
    sheetFloors = (project) => (project?.floors ?? [{ id: "ground", level: 0, name: null, plan: project }]).filter((floor) => floor.plan?.rooms?.length).sort((a, b) => a.level - b.level);
    sheetFileName = (project, extension) => (String(project?.name ?? "").replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-|-$/g, "") || "sensor-plan") + "." + extension;
    text = (value) => new TextEncoder().encode(value);
    pdfText = (value) => "<FEFF" + [...String(value)].flatMap((character) => {
      const code = character.codePointAt(0);
      const units = code > 65535 ? [55296 + (code - 65536 >> 10), 56320 + (code - 65536 & 1023)] : [code];
      return units.map((unit3) => unit3.toString(16).padStart(4, "0"));
    }).join("").toUpperCase() + ">";
  }
});

// src/js/floor-planner-home-assistant.mjs
function devicesForRoomArea(devices2, room, areaOnly = true) {
  if (!areaOnly || !room?.haAreaId) return devices2;
  return devices2.filter((device) => device.areaId === room.haAreaId);
}
function roomWithHomeAssistantArea(room, areaId, areas2) {
  const next = { ...room };
  const area = areas2.find((candidate) => candidate.id === areaId);
  if (!area) {
    delete next.haAreaId;
    return next;
  }
  next.haAreaId = area.id;
  if (area.floorId) next.haFloorId = area.floorId;
  return next;
}
function roomWithHomeAssistantFloor(room, floorId, areas2) {
  const next = { ...room };
  if (floorId) next.haFloorId = floorId;
  else delete next.haFloorId;
  const area = areas2.find((candidate) => candidate.id === next.haAreaId);
  if (area?.floorId && area.floorId !== floorId) delete next.haAreaId;
  return next;
}
var init_floor_planner_home_assistant = __esm({
  "src/js/floor-planner-home-assistant.mjs"() {
  }
});

// src/js/floor-planner-advice.mjs
function usableSurfaces(plan2, room) {
  return (plan2.furniture ?? []).filter((item) => flatSurfaces.has(item.kind) && item.width >= 0.18 && item.depth >= 0.15 && contains(room, item) && item.base + item.height + 0.05 <= ceilingHeightAt(room, item) - 0.15);
}
function candidatesFor(plan2, room, settings, family, surfaces2) {
  const ceiling2 = family === "ceiling";
  const freestanding = family === "freestanding";
  const { x, y, width, depth } = room;
  const radar = settings.goal === "climate" ? ceiling2 ? "none" : "ld2450" : settings.goal === "height" ? "ld6002b" : settings.goal === "zones" && ceiling2 ? "ld2460" : ceiling2 ? "ld2412" : "ld2450";
  if (!ceiling2 && settings.goal === "height") return [];
  if (ceiling2 && room.ceiling && !settings.level) return [];
  const installation = ceiling2 ? "ceiling-recessed" : freestanding ? "freestanding" : family === "recessed" ? "wall-recessed" : "wall-bracket";
  let positions = ceiling2 ? [0.5, 0.25, 0.75].flatMap((u) => [0.5, 0.25, 0.75].map((v) => [x + u * width, y + v * depth])) : slots2.flatMap((t) => [
    [x + t * width, y, 180],
    [x + t * width, y + depth, 0],
    [x, y + t * depth, 90],
    [x + width, y + t * depth, 270]
  ]);
  if (room.outline) {
    if (ceiling2) {
      const anchor = roomInteriorPoint(room);
      positions.unshift([anchor.x, anchor.y]);
    } else {
      positions = polygonEdges(roomCorners(room)).flatMap(([a, b]) => slots2.map((t) => {
        const position = { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t };
        const { x: x2, y: y2, facing } = edgePosition(a, b, position);
        return [x2, y2, facing];
      }));
    }
  }
  if (freestanding) {
    positions = surfaces2.length ? surfaces2.map((item) => [item.x, item.y, item.angle, item.base + item.height + 0.05]) : positions.map(([x2, y2, angle2]) => {
      const radians = angle2 * Math.PI / 180;
      return [x2 + 0.25 * Math.sin(radians), y2 - 0.25 * Math.cos(radians), angle2, settings.wallHeight];
    });
  }
  const model = ceiling2 ? "ceilsense-v2" : family === "recessed" ? "wallsense" : "ultimatesensor-v2";
  const existing = plan2.sensors.filter((item) => item.model === model && installationFor(item) === installation && (settings.goal === "climate" || item.radar === radar) && (ceiling2 || freestanding || Math.abs(sensorMountHeight(item, room) - settings.wallHeight) < 0.01) && (!ceiling2 || !room.ceiling || item.levelMountRoom === room.id)).map(({ id, ...item }) => ({ ...item, installation }));
  const planned = positions.flatMap(([px, py, angle2, surfaceHeight]) => (freestanding && surfaces2.length ? [0, 90, 180, 270] : ceiling2 && settings.goal !== "climate" ? [0, 90] : [angle2 ?? 0]).map((angle3) => {
    const candidate = { x: px, y: py, angle: angle3, model, radar, installation };
    if (ceiling2 && room.ceiling) candidate.levelMountRoom = room.id;
    if (!ceiling2) candidate.mountHeight = surfaceHeight === void 0 ? settings.wallHeight : fixed2(surfaceHeight);
    return candidate;
  }));
  return [...existing, ...planned].filter((item) => {
    if (Math.abs(item.x) > 100 || Math.abs(item.y) > 100 || roomForDevice(plan2.rooms, item)?.id !== room.id) return false;
    if (ceiling2) return true;
    const height = sensorMountHeight(item, room);
    return height >= 0.15 && height <= mountHeightLimit(ceilingHeightAt(room, item));
  });
}
function cellsFor(room, furniture) {
  const cells = [];
  for (let row = 0; row < 10; row++) for (let column = 0; column < 12; column++) {
    const point3 = {
      x: room.x + (column + 0.5) / 12 * room.width,
      y: room.y + (row + 0.5) / 10 * room.depth,
      pose: "sitting"
    };
    if (room.outline && !contains(room, point3)) continue;
    const unusable = furniture.some((object) => tall2.has(object.kind) && object.parts.some((part) => {
      const [x, y] = object.local(point3);
      return part.low < 0.55 && part.high > 0.82 && x > part.x && x < part.x + part.w && y > part.y && y < part.y + part.d;
    }));
    if (!unusable) cells.push(point3);
  }
  return cells;
}
function scoreCandidate(item, room, goal, cells, furniture) {
  const mode = { presence: "presence", zones: "xy", height: "xyz" }[goal];
  const available = radarFields(room, item, { allowHeightEstimate: true });
  const fields = mode === "presence" && !available.some((field2) => field2.mode === "presence") ? available : available.filter((field2) => field2.mode === mode);
  if (!fields.length) return null;
  const origin = { ...item, z: sensorMountHeight(item, room) };
  const coverage2 = cells.map((point3) => fields.some((field2) => fieldCoversPoint(field2, item, point3)) && radarHasLineOfSight(room, item, point3) && !furnitureOcclusion(origin, point3, 0.85, furniture));
  return { item, coverage: coverage2, estimated: fields.some((field2) => field2.estimatedHeight) };
}
function layout(scored, cells, existingCoverage) {
  const combined = [...existingCoverage];
  const sensors = [];
  const target = Math.ceil(cells.length * modelGoal / 100);
  const baseline = combined.filter(Boolean).length;
  let clear = baseline;
  while (scored.length && sensors.length < 3 && clear < target) {
    let best = null;
    let gain = 0;
    for (const candidate of scored) {
      const extra = candidate.coverage.reduce((count, cell, index) => count + Number(cell && !combined[index]), 0);
      if (extra > gain) {
        best = candidate;
        gain = extra;
      }
    }
    if (!best || gain < Math.ceil(cells.length * minimumGain) && clear + gain < target) break;
    best.coverage.forEach((cell, index) => {
      combined[index] ||= cell;
    });
    clear += gain;
    sensors.push(best.item);
    scored = scored.filter((candidate) => Math.hypot(candidate.item.x - best.item.x, candidate.item.y - best.item.y) > 0.15);
  }
  return sensors.length ? {
    sensors,
    percent: Math.floor(clear * 100 / cells.length),
    baselinePercent: Math.floor(baseline * 100 / cells.length),
    reachesGoal: clear >= target
  } : null;
}
function prepareAdviceFurniture(plan2) {
  return prepareFurnitureOcclusion(plan2.furniture ?? []);
}
function adviseRoom(plan2, room, settings = defaultAdvice, obstacles = prepareAdviceFurniture(plan2)) {
  if (settings.mount !== "ceiling" && settings.goal !== "height" && !(settings.wallHeight >= 0.15 && settings.wallHeight <= adviceMountHeightLimit(room))) {
    return { reason: "height_invalid", choices: [] };
  }
  if (settings.goal !== "climate" && hasInteriorWall(room, plan2.walls)) return { reason: "partition", choices: [] };
  const furniture = obstacles.filter(({ bounds: [x1, y1, x2, y2] }) => x2 >= room.x && x1 <= room.x + room.width && y2 >= room.y && y1 <= room.y + room.depth);
  const cells = settings.goal === "climate" ? [] : cellsFor(room, furniture);
  const existing = settings.strategy === "replace" ? [] : plan2.sensors.filter((item) => roomForDevice(plan2.rooms, item)?.id === room.id);
  const hasCO2 = existing.some((item) => item.climate || ["wallsense", "ultimatesensor-v2"].includes(item.model));
  if (settings.goal === "climate" && hasCO2) return { reason: "climate_already", choices: [] };
  const existingScores = cells.length ? existing.map((item) => scoreCandidate(item, room, settings.goal, cells, furniture)).filter(Boolean) : [];
  const existingCoverage = cells.map((_, index) => existingScores.some(({ coverage: coverage2 }) => coverage2[index]));
  if (cells.length && existingCoverage.filter(Boolean).length >= Math.ceil(cells.length * modelGoal / 100)) {
    if (settings.air && !hasCO2) return adviseRoom(plan2, room, { ...settings, goal: "climate" }, obstacles);
    return { reason: "covered", choices: [] };
  }
  const families = settings.mount === "either" ? ["ceiling", "wall", "freestanding", "recessed"] : [settings.mount];
  const surfaces2 = usableSurfaces(plan2, room);
  const choices = families.flatMap((family) => {
    const needsScd41 = (settings.air || settings.goal === "climate") && family === "ceiling";
    const candidates = candidatesFor(plan2, room, settings, family, surfaces2).filter((item) => {
      if (!contains(room, item)) return false;
      return existing.every((sensor) => {
        if (needsScd41 && sameSensorPlacement(sensor, item)) return true;
        const heightDifference = sensorMountHeight(sensor, room) - sensorMountHeight(item, room);
        return Math.hypot(sensor.x - item.x, sensor.y - item.y, heightDifference) > 0.15;
      });
    });
    const result = settings.goal === "climate" && candidates.length ? { sensors: [candidates.find((item) => plan2.sensors.some((sensor) => sameSensorPlacement(sensor, item))) ?? candidates[family === "wall" ? Math.min(4, candidates.length - 1) : 0]], percent: null, reachesGoal: true } : layout(candidates.map((item) => scoreCandidate(item, room, settings.goal, cells, furniture)).filter(Boolean), cells, existingCoverage);
    const estimated = Boolean(result?.sensors?.some((item) => radarFields(room, item, { allowHeightEstimate: true }).some((field2) => field2.estimatedHeight)));
    if (!result) return [];
    const upgrade = needsScd41 && existing.some((sensor) => result.sensors.some((item) => sameSensorPlacement(sensor, item)));
    return [{
      ...result,
      family,
      upgrade,
      needsScd41,
      estimated,
      needsSurface: family === "freestanding" && !surfaces2.length,
      unmodelled: settings.goal === "climate" ? 0 : existing.length - existingScores.length,
      sensors: result.sensors.map((item) => needsScd41 ? { ...item, climate: true } : item)
    }];
  }).sort((a, b) => Number(b.upgrade) - Number(a.upgrade) || Number(a.family === "recessed") - Number(b.family === "recessed") || Number(a.needsSurface) - Number(b.needsSurface) || Number(b.reachesGoal) - Number(a.reachesGoal) || (a.reachesGoal ? a.sensors.length - b.sensors.length : 0) || (settings.air || settings.goal === "climate" ? Number(a.needsScd41) - Number(b.needsScd41) : 0) || (b.percent ?? 0) - (a.percent ?? 0));
  return choices.length ? { choices } : { reason: settings.goal === "height" ? "height" : "no_fit", choices };
}
var fixed2, slots2, minimumGain, tall2, flatSurfaces, defaultAdvice, mountHeightLimit, adviceMountHeightLimit;
var init_floor_planner_advice = __esm({
  "src/js/floor-planner-advice.mjs"() {
    init_ceilsense_room_model();
    init_floor_planner_ceiling();
    init_floor_planner_model();
    init_floor_planner_geometry();
    init_floor_planner_radar();
    init_floor_planner_obstruction();
    fixed2 = (value) => Number(value.toFixed(2));
    slots2 = [0.2, 0.5, 0.8];
    minimumGain = 0.05;
    tall2 = /* @__PURE__ */ new Set(["wardrobe", "cabinet", "shelves", "island", "fridge", "washer", "screen", "glass", "custom"]);
    flatSurfaces = /* @__PURE__ */ new Set(["desk", "dining", "coffee", "cabinet", "nightstand", "island", "custom"]);
    defaultAdvice = { goal: "presence", mount: "either", air: false, level: false, wallHeight: 1.4 };
    mountHeightLimit = (ceiling2) => Math.min(6, Math.floor((ceiling2 - 0.15) * 100 + 1e-8) / 100);
    adviceMountHeightLimit = (room) => mountHeightLimit(room.ceiling?.high ?? room.height);
  }
});

// src/js/floor-planner-advice-ui.js
var floor_planner_advice_ui_exports = {};
__export(floor_planner_advice_ui_exports, {
  openAdvisor: () => openAdvisor
});
function openAdvisor(plan2, current, copy2, locale, place) {
  const get = (suffix) => document.getElementById("fp-advisor-" + suffix);
  const dialog = document.getElementById("fp-advisor");
  const number4 = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const obstacles = prepareAdviceFurniture(plan2);
  const settings = new Map(plan2.rooms.map((room) => [
    room.id,
    { ...defaultAdvice, wallHeight: Math.min(defaultAdvice.wallHeight, adviceMountHeightLimit(room)) }
  ]));
  const existingSensors = new Map(plan2.rooms.map((room) => [room.id, []]));
  for (const sensor of plan2.sensors) existingSensors.get(roomForDevice(plan2.rooms, sensor)?.id)?.push(sensor);
  const emptyRooms = plan2.rooms.filter((room) => !existingSensors.get(room.id).length);
  const results = /* @__PURE__ */ new Map();
  const selectedChoice = /* @__PURE__ */ new Map();
  const choiceFor = (room) => results.get(room.id)?.choices[selectedChoice.get(room.id) ?? 0];
  const session = new AbortController();
  const options2 = { signal: session.signal };
  let active = current ?? plan2.rooms[0];
  let timer = 0;
  get("status").textContent = "";
  get("place-all").disabled = true;
  const validHeight = () => get("mount").value === "ceiling" || get("goal").value === "height" || get("wall").validity.valid;
  function title(choice2) {
    return choice2.upgrade ? copy2.advisor_upgrade_scd41 : `${choice2.sensors.length} × ${devices[choice2.sensors[0].model].name}`;
  }
  function renderOverview() {
    get("rooms").innerHTML = plan2.rooms.map((room) => {
      const result = results.get(room.id);
      const best = choiceFor(room);
      const adding = existingSensors.get(room.id).length && settings.get(room.id).strategy !== "replace";
      const label = best ? (adding && !best.upgrade ? "+ " : "") + title(best) + (best.percent === null ? "" : ` · ${best.percent}%`) : result ? copy2["advisor_" + result.reason + "_short"] ?? copy2.advisor_no_suggestion : copy2.advisor_wait;
      return `<button type="button" data-advice-room="${room.id}" aria-pressed="${room === active}">
                <strong>${escapeText(room.name)}</strong><small>${label}</small></button>`;
    }).join("") || `<p class="fp-note">${copy2.advisor_empty}</p>`;
    get("place-all").disabled = !validHeight() || !emptyRooms.every((room) => results.has(room.id)) || !emptyRooms.some((room) => results.get(room.id)?.choices.length);
    get("place-all").hidden = plan2.rooms.length < 2 || !emptyRooms.length;
    get("place-all").textContent = emptyRooms.length === plan2.rooms.length ? copy2.advisor_place_all : copy2.advisor_place_empty;
  }
  function preview(room, sensors) {
    const radius = Math.min(room.width, room.depth) * 0.048;
    const pieces3 = (plan2.furniture ?? []).filter((item) => contains(room, item)).map((item) => `<polygon class="fp-advice-object" points="${furnitureFootprint(item).map((point3) => point3.join(",")).join(" ")}"/>`).join("");
    return `<svg class="fp-advisor-preview" viewBox="${room.x - radius * 1.4} ${room.y - radius * 1.4} ${room.width + radius * 2.8} ${room.depth + radius * 2.8}" aria-hidden="true">
            ${paintRoomSurface(room, 'class="fp-advice-floor"')}${pieces3}
            ${sensors.map((item, index) => `<circle cx="${item.x}" cy="${item.y}" r="${radius}"/>
                <text x="${item.x}" y="${item.y}" font-size="${radius * 1.2}">${index + 1}</text>`).join("")}
        </svg>`;
  }
  function renderResults() {
    get("place").hidden = true;
    get("place").disabled = !validHeight();
    const result = active && results.get(active.id);
    if (!result?.choices.length) {
      get("results").innerHTML = `<p class="fp-note">${result ? copy2["advisor_" + result.reason] : active ? copy2.advisor_wait : copy2.advisor_empty}</p>`;
      return;
    }
    get("place").hidden = false;
    const choice2 = choiceFor(active);
    const action = choice2.upgrade ? copy2.advisor_upgrade_room : !existingSensors.get(active.id).length ? copy2.advisor_place_room : settings.get(active.id).strategy === "replace" ? copy2.advisor_replace_room : copy2.advisor_add_room;
    get("place").textContent = action.replace(":room", active.name);
    const select = result.choices.length > 1 ? `<label class="fp-advisor-alternatives">${copy2.advisor_choose}
            <select id="fp-advisor-choice">${result.choices.map((item, index) => `<option value="${index}" ${item === choice2 ? "selected" : ""}>${title(item)} · ${copy2.advisor_mounts[item.family]}</option>`).join("")}</select>
            </label>` : "";
    get("results").innerHTML = `${select}<article class="fp-advisor-result">
            <div><p class="fp-advisor-rank">${choice2 === result.choices[0] ? copy2.advisor_recommended : copy2.advisor_alternative}</p>
                <h4>${title(choice2)}${choice2.sensors[0].model === "wallsense" ? ` <small>${copy2.planning_only}</small>` : ""}</h4>
                <p>${choice2.upgrade ? copy2.advisor_upgrade_climate : choice2.percent === null ? copy2.advisor_climate : existingSensors.get(active.id).length && settings.get(active.id).strategy !== "replace" ? copy2.advisor_gain.replace(":before", number4.format(choice2.baselinePercent)).replace(":after", number4.format(choice2.percent)) : copy2.advisor_score.replace(":percent", number4.format(choice2.percent))}</p>
                <p class="fp-note">${[
      choice2.sensors[0].radar === "none" ? "" : radarNames[choice2.sensors[0].radar],
      choice2.needsScd41 ? copy2.advisor_scd41 : ""
    ].filter(Boolean).join(" · ")}</p>
                <p class="fp-note">${copy2.installations[choice2.sensors[0].installation] ?? ""}</p>
                ${choice2.unmodelled ? `<p class="fp-note">${copy2.advisor_unmodelled.replace(":count", number4.format(choice2.unmodelled))}</p>` : ""}
                ${choice2.needsSurface ? `<p class="fp-note">${copy2.advisor_needs_surface}</p>` : ""}
                ${choice2.estimated && copy2.height_estimate ? `<p class="fp-note">${copy2.height_estimate.replaceAll(":low", number4.format(2)).replaceAll(":high", number4.format(3))}</p>` : ""}
                ${choice2.reachesGoal ? "" : `<p class="fp-note fp-warning">${copy2.advisor_partial}</p>`}
                <details class="fp-advisor-positions"><summary>${copy2.advisor_positions}</summary>
                    <p class="fp-note">${copy2.advisor_origin}<br>${choice2.sensors.map((item, index) => `${index + 1} · X ${number4.format(item.x - active.x)} m / Y ${number4.format(item.y - active.y)} m`).join("<br>")}</p>
                </details>
            </div>${preview(active, choice2.sensors)}
        </article>`;
  }
  function renderSettings() {
    get("status").textContent = "";
    get("controls").hidden = !active;
    get("room-title").textContent = active?.name ?? "";
    if (!active) return;
    const set = settings.get(active.id);
    get("goal").value = set.goal;
    get("mount").value = set.mount;
    get("air").checked = set.air;
    get("level").checked = set.level;
    const existing = existingSensors.get(active.id);
    get("existing").hidden = !existing.length;
    get("existing-note").textContent = copy2.advisor_existing.replace(":sensors", existing.map((sensor) => devices[sensor.model].name).join(", "));
    get("strategy").value = set.strategy ?? "add";
    get("wall").max = adviceMountHeightLimit(active);
    get("wall").value = set.wallHeight;
    get("wall-field").hidden = set.mount === "ceiling" || set.goal === "height";
    get("air-field").hidden = set.goal === "climate";
    get("level-field").hidden = !active.ceiling || ["wall", "recessed", "freestanding"].includes(set.mount);
  }
  function calculate(room) {
    results.set(room.id, adviseRoom(plan2, room, settings.get(room.id), obstacles));
    renderOverview();
    if (room === active) renderResults();
  }
  function queue() {
    clearTimeout(timer);
    const next = plan2.rooms.find((room) => !results.has(room.id));
    if (next) timer = setTimeout(() => {
      calculate(next);
      queue();
    }, 0);
  }
  function checkHeight() {
    const valid = validHeight();
    get("place").disabled = !valid;
    if (!valid) get("place-all").disabled = true;
    get("status").textContent = valid ? "" : copy2.advisor_height_invalid.replace(":max", number4.format(Number(get("wall").max)));
    return valid;
  }
  get("wall").addEventListener("input", checkHeight, options2);
  get("controls").addEventListener("change", () => {
    if (!active || !checkHeight()) return;
    settings.set(active.id, {
      goal: get("goal").value,
      mount: get("mount").value,
      air: get("air").checked,
      level: get("level").checked,
      wallHeight: get("wall").validity.valid ? get("wall").valueAsNumber : settings.get(active.id).wallHeight,
      strategy: get("strategy").value
    });
    results.delete(active.id);
    selectedChoice.delete(active.id);
    renderSettings();
    calculate(active);
    queue();
  }, options2);
  get("results").addEventListener("change", (event) => {
    if (event.target.id !== "fp-advisor-choice" || !active) return;
    selectedChoice.set(active.id, Number(event.target.value));
    renderOverview();
    renderResults();
    get("choice").focus({ preventScroll: true });
  }, options2);
  get("rooms").addEventListener("click", (event) => {
    const selected2 = event.target.closest("[data-advice-room]");
    if (!selected2) return;
    active = plan2.rooms.find((room) => room.id === selected2.dataset.adviceRoom);
    if (!results.has(active.id)) calculate(active);
    renderSettings();
    renderOverview();
    renderResults();
    get("goal").focus({ preventScroll: true });
    if (matchMedia("(max-width: 760px)").matches) get("room-title").scrollIntoView({ block: "start" });
  }, options2);
  const apply = (rooms, replaceRooms = /* @__PURE__ */ new Set()) => {
    if (!checkHeight()) return;
    const picks = rooms.flatMap((room) => choiceFor(room)?.sensors ?? []);
    if (!picks.length) return;
    const result = place(picks, replaceRooms);
    if (result > 0) dialog.close();
    else get("status").textContent = result < 0 ? copy2.advisor_limit : copy2.advisor_exists;
  };
  get("place").addEventListener("click", () => apply(
    [active],
    new Set(settings.get(active.id).strategy === "replace" ? [active.id] : [])
  ), options2);
  get("place-all").addEventListener("click", () => apply(emptyRooms), options2);
  get("close").addEventListener("click", () => dialog.close(), options2);
  dialog.addEventListener("close", () => {
    clearTimeout(timer);
    session.abort();
  }, { once: true });
  renderSettings();
  renderOverview();
  renderResults();
  dialog.showModal();
  if (active) timer = setTimeout(() => {
    calculate(active);
    queue();
  }, 0);
}
var init_floor_planner_advice_ui = __esm({
  "src/js/floor-planner-advice-ui.js"() {
    init_floor_planner_advice();
    init_floor_planner_drawing();
    init_floor_planner_furniture();
    init_floor_planner_model();
  }
});

// src/js/floor-planner-sh3d.mjs
var floor_planner_sh3d_exports = {};
__export(floor_planner_sh3d_exports, {
  homeFromXml: () => homeFromXml,
  importSweetHome: () => importSweetHome,
  isSweetHome: () => isSweetHome,
  parseXml: () => parseXml,
  zipEntry: () => zipEntry
});
async function zipEntry(archive, name) {
  const size = archive.size;
  const tailStart = Math.max(0, size - 65557);
  const tail = new DataView(await archive.slice(tailStart, size).arrayBuffer());
  let end2 = -1;
  for (let i = tail.byteLength - 22; i >= 0 && end2 < 0; i--) if (tail.getUint32(i, true) === 101010256) end2 = i;
  if (end2 < 0) throw failure("zip");
  const count = tail.getUint16(end2 + 10, true);
  const length = tail.getUint32(end2 + 12, true), offset2 = tail.getUint32(end2 + 16, true);
  if (offset2 + length > size) throw failure("zip");
  const directory = new DataView(await archive.slice(offset2, offset2 + length).arrayBuffer());
  const decoder = new TextDecoder();
  for (let at = 0, k = 0; k < count && at + 46 <= directory.byteLength; k++) {
    if (directory.getUint32(at, true) !== 33639248) throw failure("zip");
    const method = directory.getUint16(at + 10, true);
    const packed = directory.getUint32(at + 20, true), unpacked2 = directory.getUint32(at + 24, true);
    const nameLength = directory.getUint16(at + 28, true);
    const skip = nameLength + directory.getUint16(at + 30, true) + directory.getUint16(at + 32, true);
    const local = directory.getUint32(at + 42, true);
    const entry = decoder.decode(new Uint8Array(directory.buffer, directory.byteOffset + at + 46, nameLength));
    at += 46 + skip;
    if (entry !== name) continue;
    if (unpacked2 > largestHome) throw failure("zip");
    const header = new DataView(await archive.slice(local, local + 30).arrayBuffer());
    if (header.byteLength < 30 || header.getUint32(0, true) !== 67324752) throw failure("zip");
    const start3 = local + 30 + header.getUint16(26, true) + header.getUint16(28, true);
    const bytes = archive.slice(start3, start3 + packed);
    if (method === 0) return new Uint8Array(await bytes.arrayBuffer());
    if (method !== 8) throw failure("zip");
    return new Uint8Array(await new Response(bytes.stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
  }
  return null;
}
function parseXml(source) {
  const root2 = { name: "#document", attributes: {}, children: [] };
  const stack = [root2];
  const cleaned = source.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/g, "");
  for (const [, closing, name, rest, selfClosing] of cleaned.matchAll(/<(\/?)([A-Za-z_][\w.:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
    if (closing) {
      if (stack.length > 1 && stack.at(-1).name === name) stack.pop();
      continue;
    }
    const attributes = {};
    for (const [, key, , double, single] of rest.matchAll(/([\w.:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attributes[key] = unescape(double ?? single);
    const element2 = { name, attributes, children: [] };
    stack.at(-1).children.push(element2);
    if (!selfClosing) stack.push(element2);
  }
  return root2;
}
function furnitureKind(piece) {
  const words = `${piece.attributes.name ?? ""} ${(piece.attributes.catalogId ?? "").replace(/([a-z])([A-Z])/g, "$1 $2")}`.toLowerCase();
  const found = furnitureKinds.find(([, pattern]) => pattern.test(words));
  return found ? found[0] : "custom";
}
function pieces2(elements, level = null) {
  return elements.flatMap((element2) => {
    const own = element2.attributes.level ?? level;
    if (element2.name === "furnitureGroup") return pieces2(element2.children, own);
    if (["pieceOfFurniture", "doorOrWindow", "light"].includes(element2.name)) return [{ element: element2, level: own }];
    return [];
  });
}
function wallLine({ a, b, arc }) {
  if (!arc || Math.abs(arc) < 1e-3) return [a, b];
  const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const radius = chord / (2 * Math.sin(Math.abs(arc) / 2));
  const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const normal = [-(b[1] - a[1]) / chord, (b[0] - a[0]) / chord];
  const reach2 = radius * Math.cos(arc / 2) * Math.sign(arc);
  const centre2 = [middle[0] + normal[0] * reach2, middle[1] + normal[1] * reach2];
  const from = Math.atan2(a[1] - centre2[1], a[0] - centre2[0]);
  const steps2 = Math.max(2, Math.ceil(Math.abs(arc) / (Math.PI / 12)));
  return Array.from({ length: steps2 + 1 }, (_, i) => {
    const angle2 = from - arc * i / steps2;
    return [centre2[0] + radius * Math.cos(angle2), centre2[1] + radius * Math.sin(angle2)];
  });
}
function roomsBetweenWalls(walls) {
  const lines = walls.map((wall2) => ({ ...wall2, line: wallLine(wall2) }));
  const xs = lines.flatMap((wall2) => wall2.line.map(([x]) => x)), ys = lines.flatMap((wall2) => wall2.line.map(([, y]) => y));
  const left = Math.min(...xs) - 1, top2 = Math.min(...ys) - 1;
  const across = Math.max(...xs) + 1 - left, down = Math.max(...ys) + 1 - top2;
  if (!(across > 2 && down > 2 && across < 200 && down < 200)) return [];
  const perMetre = clamp3(Math.sqrt(3e6 / (across * down)), 10, 50);
  const width = Math.ceil(across * perMetre), height = Math.ceil(down * perMetre);
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  const fill3 = (corners) => {
    const points = corners.map(([x, y]) => [(x - left) * perMetre, (y - top2) * perMetre]);
    const rows = points.map(([, y]) => y);
    for (let y = Math.max(0, Math.floor(Math.min(...rows))); y <= Math.min(height - 1, Math.ceil(Math.max(...rows))); y++) {
      const centre2 = y + 0.5, crossings = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if (yi > centre2 !== yj > centre2) crossings.push(xi + (centre2 - yi) * (xj - xi) / (yj - yi));
      }
      crossings.sort((p, q) => p - q);
      for (let k = 0; k + 1 < crossings.length; k += 2) {
        for (let x = Math.max(0, Math.round(crossings[k])); x < Math.min(width, Math.round(crossings[k + 1])); x++) data.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 3);
      }
    }
  };
  for (const wall2 of lines) {
    const half = Math.max(wall2.thickness, 2 / perMetre) / 2;
    for (let i = 0; i + 1 < wall2.line.length; i++) {
      const [a, b] = [wall2.line[i], wall2.line[i + 1]];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length < 1e-6) continue;
      const [ux, uy] = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
      const [nx, ny] = [-uy * half, ux * half];
      const [ex, ey] = [ux * half, uy * half];
      fill3([[a[0] - ex + nx, a[1] - ey + ny], [b[0] + ex + nx, b[1] + ey + ny], [b[0] + ex - nx, b[1] + ey - ny], [a[0] - ex - nx, a[1] - ey - ny]]);
    }
  }
  const traced = traceFloorPlan({ data, width, height }, width / perMetre);
  return traced ? traced.rooms.map((room) => room.points.map(([u, v]) => [left + u * width / perMetre, top2 + v * height / perMetre])) : [];
}
function withinCorners(points) {
  let fewer = points;
  for (let tolerance = 0.03; fewer.length > maxRoomCorners && tolerance < 1; tolerance *= 1.5) fewer = fewerCorners(fewer, tolerance);
  return fewer.length <= maxRoomCorners ? fewer : null;
}
function homeFromXml(source, copy2, fileName = "") {
  const home = parseXml(source).children.find((element2) => element2.name === "home");
  if (!home) throw failure("sh3d");
  let review = false;
  const all = home.children;
  const by = (name2) => all.filter((element2) => element2.name === name2);
  const wallHeight = (number2(home.attributes.wallHeight) ?? 250) / 100;
  const levels = by("level").map((level) => ({
    id: level.attributes.id,
    name: level.attributes.name,
    elevation: number2(level.attributes.elevation) ?? 0,
    height: number2(level.attributes.height),
    index: number2(level.attributes.elevationIndex) ?? 0
  })).sort((a, b) => a.elevation - b.elevation || a.index - b.index);
  const groups = [];
  for (const level of levels) {
    const group = groups.find((other) => Math.abs(other.elevation - level.elevation) < 1);
    if (group) group.levels.push(level);
    else groups.push({ elevation: level.elevation, levels: [level] });
  }
  if (!groups.length) groups.push({ elevation: 0, levels: [{ id: null, name: null, height: null }] });
  const floorOf = new Map(groups.flatMap((group, index) => group.levels.map((level) => [level.id, index])));
  const floorIndex = (levelId) => floorOf.get(levelId ?? null) ?? floorOf.get(levels[0]?.id) ?? 0;
  const point3 = (element2) => [number2(element2.attributes.x), number2(element2.attributes.y)];
  const rooms = by("room").map((room) => ({ element: room, points: room.children.filter((child) => child.name === "point").map(point3) })).filter((room) => room.points.length >= 3 && room.points.every(([x, y]) => x !== null && y !== null));
  const walls = by("wall").map((wall2) => {
    const [xStart, yStart, xEnd, yEnd] = ["xStart", "yStart", "xEnd", "yEnd"].map((key) => number2(wall2.attributes[key]));
    return {
      level: wall2.attributes.level,
      a: [xStart, yStart],
      b: [xEnd, yEnd],
      thickness: (number2(wall2.attributes.thickness) ?? 10) / 100,
      arc: number2(wall2.attributes.arcExtent)
    };
  }).filter((wall2) => [...wall2.a, ...wall2.b].every((value) => value !== null) && (wall2.a[0] !== wall2.b[0] || wall2.a[1] !== wall2.b[1]));
  const xs = [...rooms.flatMap((room) => room.points.map(([x]) => x)), ...walls.flatMap((wall2) => [wall2.a[0], wall2.b[0]])];
  const ys = [...rooms.flatMap((room) => room.points.map(([, y]) => y)), ...walls.flatMap((wall2) => [wall2.a[1], wall2.b[1]])];
  if (!xs.length) throw failure("sh3d_empty");
  const left = Math.min(...xs), top2 = Math.min(...ys);
  const place = ([x, y]) => [metres(x - left), metres(y - top2)];
  for (const wall2 of walls) Object.assign(wall2, { a: place(wall2.a), b: place(wall2.b) });
  const floors = groups.map((group, index) => {
    const height = clamp3((group.levels.find((level) => level.height)?.height ?? wallHeight * 100) / 100, 1, 12);
    return { index, height, plan: {
      ...blankPlan(copy2.import_room_name),
      version: 3,
      furniture: [],
      windows: [],
      mirrors: [],
      zones: []
    } };
  });
  const valid = (plan2, change) => validPlan({ ...plan2, ...change });
  for (const room of rooms) {
    const floor = floors[floorIndex(room.element.attributes.level)];
    const outline = withinCorners(room.points.map(place));
    const shape = outline && tidyShape(roomShape(outline));
    const name2 = named(room.element.attributes.name, 48) ?? `${copy2.room} ${floor.plan.rooms.length + 1}`;
    const item = shape && { ...shape, id: newId(), name: name2, height: floor.height };
    if (item && floor.plan.rooms.length < 80 && valid(floor.plan, { rooms: [...floor.plan.rooms, item] })) floor.plan.rooms.push(item);
    else review = true;
  }
  for (const floor of floors) {
    const own = walls.filter((wall2) => floorIndex(wall2.level) === floor.index);
    if (floor.plan.rooms.length || !own.length) continue;
    for (const outline of roomsBetweenWalls(own)) {
      const shape = tidyShape(roomShape(outline.map(([x, y]) => [millimetres2(x), millimetres2(y)])));
      const item = shape && { ...shape, id: newId(), name: `${copy2.room} ${floor.plan.rooms.length + 1}`, height: floor.height };
      if (item && valid(floor.plan, { rooms: [...floor.plan.rooms, item] })) floor.plan.rooms.push(item);
    }
  }
  for (const wall2 of walls) {
    const floor = floors[floorIndex(wall2.level)];
    const samples2 = [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => ({ x: wall2.a[0] + (wall2.b[0] - wall2.a[0]) * t, y: wall2.a[1] + (wall2.b[1] - wall2.a[1]) * t }));
    const inside = floor.plan.rooms.find((room) => samples2.filter((sample2) => roomContains(room, sample2, false)).length >= 4);
    const item = { id: newId(), x: wall2.a[0], y: wall2.a[1], endX: wall2.b[0], endY: wall2.b[1] };
    if (inside && !wall2.arc && floor.plan.walls.length < 80 && valid(floor.plan, { walls: [...floor.plan.walls, item] })) floor.plan.walls.push(item);
  }
  for (const { element: element2, level } of pieces2(all)) {
    const attributes = element2.attributes;
    if (element2.name === "light" || attributes.visible === "false") continue;
    const floor = floors[floorIndex(level)];
    const [x, y] = [number2(attributes.x), number2(attributes.y)];
    const [width, depth, height] = ["width", "depth", "height"].map((key) => (number2(attributes[key]) ?? 0) / 100);
    if (x === null || y === null || width <= 0) {
      review = true;
      continue;
    }
    const angle2 = number2(attributes.angle) ?? 0;
    const base = (number2(attributes.elevation) ?? 0) / 100;
    const centre2 = place([x, y]);
    if (element2.name === "doorOrWindow" || attributes.doorOrWindow === "true") {
      const along = [Math.cos(angle2) * width / 2, Math.sin(angle2) * width / 2];
      const span = { from: [centre2[0] - along[0], centre2[1] - along[1]], to: [centre2[0] + along[0], centre2[1] + along[1]] };
      if (isWindow(element2, base)) {
        const [window2] = openingsOnWalls(floor.plan.rooms, [span], {
          minimum: 0.1,
          maximum: 8,
          reach: 0.45,
          extra: { base: clamp3(base || defaultWindowSill, 0, 6), height: clamp3(height || 1, 0.1, 6) }
        });
        if (window2 && floor.plan.windows.length < 80 && valid(floor.plan, { windows: [...floor.plan.windows, window2] })) floor.plan.windows.push(window2);
        else review = true;
      } else {
        const [door] = openingsOnWalls(floor.plan.rooms, [span], { minimum: 0.5, maximum: 2, reach: 0.45 });
        if (door && floor.plan.doors.length < 80 && valid(floor.plan, { doors: [...floor.plan.doors, door] })) floor.plan.doors.push(door);
        else review = true;
      }
      continue;
    }
    const kind = furnitureKind(element2);
    if (!kind) continue;
    const spot = { x: centre2[0], y: centre2[1] };
    if (!floor.plan.rooms.some((room) => roomContains(room, spot))) continue;
    const object = furnitureAt(kind, named(attributes.name, 48) ?? copy2.furniture_items?.[kind] ?? kind, spot, degrees2(angle2));
    const item = {
      ...object,
      id: newId(),
      width: clamp3(width, 0.02, 12),
      depth: clamp3(depth || object.depth, 0.02, 12),
      height: clamp3(height || object.height, 0.01, 6),
      base: clamp3(base, 0, 6)
    };
    if (floor.plan.furniture.length < maxFurniture && valid(floor.plan, { furniture: [...floor.plan.furniture, item] })) floor.plan.furniture.push(item);
    else review = true;
  }
  const kept = floors.filter((floor) => floor.plan.rooms.length);
  if (!kept.length) throw failure("sh3d_empty");
  const ground = Math.max(0, kept.findIndex((floor) => groups[floor.index].elevation >= -10));
  const lowest = Math.max(0, ground - 5);
  const chosen = kept.slice(lowest, lowest + maxFloors);
  if (chosen.length < kept.length) review = true;
  const fileTitle = (value) => typeof value === "string" ? value.split(/[\\/]/).pop().replace(/\.sh3d$/i, "") : null;
  const name = named(fileTitle(fileName), 48) ?? named(fileTitle(home.attributes.name), 48) ?? copy2.import_room_name;
  const results = chosen.map((floor, index) => ({
    id: newId(),
    level: lowest + index - ground,
    name: named(groups[floor.index].levels.find((level) => named(level.name, 32))?.name, 32),
    plan: { ...floor.plan, name }
  }));
  const project = {
    format: buildingFormat,
    version: 1,
    name,
    floors: results,
    activeFloor: (results.find((floor) => floor.level === 0) ?? results[0]).id
  };
  if (!validBuilding(project)) throw failure("sh3d");
  return { project: results.length === 1 && results[0].level === 0 ? results[0].plan : project, review };
}
async function isSweetHome(file) {
  if (/\.sh3d$/i.test(file?.name ?? "")) return true;
  const start3 = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return start3[0] === 80 && start3[1] === 75 && start3[2] === 3 && start3[3] === 4;
}
async function importSweetHome(file, copy2) {
  const xml = await zipEntry(file, "Home.xml");
  if (!xml) {
    if (await zipEntry(file, "Home")) throw failure("sh3d_old");
    throw failure("sh3d");
  }
  return homeFromXml(new TextDecoder().decode(xml), copy2, file.name ?? "");
}
var failure, largestHome, entities, unescape, number2, metres, millimetres2, degrees2, clamp3, named, furnitureKinds, isWindow, tidyShape;
var init_floor_planner_sh3d = __esm({
  "src/js/floor-planner-sh3d.mjs"() {
    init_floor_planner_building();
    init_floor_planner_furniture();
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_recognise();
    init_floor_planner_trace();
    failure = (code) => Object.assign(new Error(code), { code });
    largestHome = 6e7;
    entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    unescape = (value) => value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code) => code[0] !== "#" ? entities[code] ?? match : String.fromCodePoint(code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1))));
    number2 = (value) => {
      const parsed = typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
      return Number.isFinite(parsed) ? parsed : null;
    };
    metres = (value) => Math.round(value * 10) / 1e3;
    millimetres2 = (value) => Math.round(value * 1e3) / 1e3;
    degrees2 = (radians) => Math.round((radians * 180 / Math.PI % 360 + 360) % 360 * 100) / 100 % 360;
    clamp3 = (value, least, most2) => Math.min(most2, Math.max(least, value));
    named = (value, length) => typeof value === "string" && value.trim() ? value.trim().slice(0, length) : null;
    furnitureKinds = [
      [null, /light|lamp|lampe|lámpara|lampada|stair|trap\b|trappe|treppe|escalier|escalera|scala/],
      ["corner", /corner ?(sofa|couch)|hoekbank|ecksofa|canapé d.angle|sofá (esquinero|rinconera)/],
      ["armchair", /arm ?chair|fauteuil|sessel|sillón|butaca|poltrona/],
      ["sofa", /sofa|couch|\bbank\b|canapé|sofá|divano/],
      ["nightstand", /night ?(stand|table)|bedside|nachtkast|nachttisch|chevet|mesita|comodino/],
      ["coffee", /coffee|low ?table|salontafel|couchtisch|table basse|mesa (de centro|baja)|tavolino/],
      ["desk", /desk|bureau|schreibtisch|escritorio|scrivania/],
      ["dining", /table|tafel|tisch|mesa|tavolo/],
      ["chair", /chair|stool|stoel|kruk|stuhl|hocker|chaise|tabouret|silla|taburete|sedia|sgabello/],
      ["bath", /bath ?tub|\bbath\b|ligbad|badewanne|baignoire|bañera|vasca/],
      ["glass", /shower|douche|dusche|ducha|doccia/],
      ["cabinet", /wash ?basin|\bsink\b|lavabo|wastafel|waschbecken|évier|fregadero|lavello|toilet|\bwc\b|cabinet|cupboard|dresser|sideboard|\bkast\b|schrank|commode|meuble|mueble|kitchen|keuken|küche|cuisine|cocina|cucina|counter|aanrecht/],
      ["bed", /\bbed\b|bed\d|\bbett\b|\blit\b|\bcama\b|letto/],
      ["wardrobe", /wardrobe|closet|kledingkast|kleiderschrank|armoire|armario|armadio/],
      ["shelves", /shel(f|ves)|book ?case|boekenkast|regal|étagère|bibliothèque|estanter|librer|scaffale/],
      ["fridge", /fridge|refrigerator|koelkast|kühlschrank|réfrigérateur|frigo|nevera|frigorifero/],
      ["washer", /washing|washer|dryer|wasmachine|droger|waschmaschine|trockner|lave-linge|sèche-linge|lavadora|secadora|lavatrice/],
      ["island", /island|kookeiland|kochinsel|îlot|isla|isola/],
      ["tv", /\btv\b|television|televisie|fernseher|télé|televisor|televisore/],
      ["plant", /plant|pflanze|plante|planta|pianta/],
      ["rug", /\brug\b|carpet|tapijt|vloerkleed|teppich|tapis|alfombra|tappeto/],
      ["curtain", /curtain|gordijn|vorhang|rideau|cortina|tenda/],
      ["radiator", /radiator|heizkörper|radiateur|radiador|termosifone/],
      ["heater", /heater|stove|fireplace|kachel|haard|kamin|ofen|cheminée|poêle|chimenea|estufa|camino|stufa/],
      ["fan", /\bfan\b|ventilator|ventilateur|ventilador|ventilatore/],
      ["screen", /screen|monitor|scherm|bildschirm|écran|pantalla|schermo/]
    ];
    isWindow = (piece, base) => base >= 0.3 || base > 0.05 && /window|raam|fenster|fenêtre|ventana|finestra|janela/i.test(`${piece.attributes.name ?? ""} ${piece.attributes.catalogId ?? ""}`);
    tidyShape = (shape) => shape && Object.fromEntries(Object.entries(shape).map(([key, value]) => [key, key === "outline" ? value.map(([x, y]) => [millimetres2(x), millimetres2(y)]) : millimetres2(value)]));
  }
});

// src/js/floor-planner-roomplan.mjs
var RoomPlanImportError, isRecord, surfaces, matrix, dimensions, centre, category, roomLabel, wallSegments2, distance3, orderedSegments, polygonArea, cleanPolygon, polygonFromFloor, polygonFromWalls, centreRoom, wallsFromPoints, nearestWall2, furnitureMap, titleCase, buildRoom, roomGroups, isAppleRoomPlan, parseAppleRoomPlan;
var init_floor_planner_roomplan = __esm({
  "src/js/floor-planner-roomplan.mjs"() {
    RoomPlanImportError = class extends Error {
      code;
      constructor(code) {
        super(code);
        this.code = code;
        this.name = "RoomPlanImportError";
      }
    };
    isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
    surfaces = (value) => Array.isArray(value) ? value.filter(isRecord).slice(0, 500) : [];
    matrix = (value) => {
      if (!Array.isArray(value))
        return null;
      const flattened = (Array.isArray(value[0]) ? value.flat() : value).map(Number);
      return flattened.length === 16 && flattened.every(Number.isFinite) ? flattened : null;
    };
    dimensions = (surface) => Array.isArray(surface.dimensions) ? surface.dimensions.map(Number) : [];
    centre = (surface) => {
      const transform = matrix(surface.transform);
      return transform ? { x: transform[12] * 1e3, y: transform[14] * 1e3 } : null;
    };
    category = (surface) => {
      if (typeof surface.category === "string")
        return surface.category;
      return isRecord(surface.category) ? Object.keys(surface.category)[0] || "" : "";
    };
    roomLabel = (group, fallback) => {
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
    wallSegments2 = (group) => surfaces(group.walls).map((wall2) => {
      const transform = matrix(wall2.transform);
      const [length = 0] = dimensions(wall2);
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
    distance3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    orderedSegments = (input, reverseFirst) => {
      const remaining = input.slice(1);
      const first = reverseFirst ? { a: input[0].b, b: input[0].a } : input[0];
      const ordered = [first];
      let gap2 = 0;
      let maximumGap = 0;
      while (remaining.length) {
        const current = ordered[ordered.length - 1].b;
        let bestIndex = 0;
        let bestReverse = false;
        let bestDistance = Infinity;
        remaining.forEach((segment, index) => {
          const forward = distance3(current, segment.a);
          const reverse = distance3(current, segment.b);
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
        gap2 += bestDistance;
        maximumGap = Math.max(maximumGap, bestDistance);
      }
      const closingGap = distance3(ordered[ordered.length - 1].b, ordered[0].a);
      return { segments: ordered, gap: gap2 + closingGap, maximumGap: Math.max(maximumGap, closingGap) };
    };
    polygonArea = (points) => Math.abs(points.reduce((sum, point3, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point3.x * next.y - next.x * point3.y;
    }, 0)) / 2;
    cleanPolygon = (points) => {
      let output = points.filter((point3, index) => index === 0 || distance3(point3, points[index - 1]) >= 40);
      if (output.length > 2 && distance3(output[0], output[output.length - 1]) < 40)
        output = output.slice(0, -1);
      let changed = true;
      while (changed && output.length > 3) {
        changed = false;
        output = output.filter((point3, index, list2) => {
          const previous = list2[(index - 1 + list2.length) % list2.length];
          const next = list2[(index + 1) % list2.length];
          const lineLength = distance3(previous, next);
          if (lineLength < 1)
            return false;
          const deviation = Math.abs((next.x - previous.x) * (previous.y - point3.y) - (previous.x - point3.x) * (next.y - previous.y)) / lineLength;
          if (deviation <= 20) {
            changed = true;
            return false;
          }
          return true;
        });
      }
      return output;
    };
    polygonFromFloor = (group) => {
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
        }).filter((point3) => point3 !== null);
        const cleaned = cleanPolygon(points);
        if (cleaned.length >= 3 && polygonArea(cleaned) >= 5e5)
          return cleaned;
      }
      return null;
    };
    polygonFromWalls = (group) => {
      const segments = wallSegments2(group);
      if (segments.length < 3)
        return null;
      const forward = orderedSegments(segments, false);
      const reverse = orderedSegments(segments, true);
      const traced = forward.gap <= reverse.gap ? forward : reverse;
      if (traced.maximumGap > 2e3)
        return null;
      const points = cleanPolygon(traced.segments.map((segment, index, list2) => {
        const previous = list2[(index - 1 + list2.length) % list2.length];
        return { x: (previous.b.x + segment.a.x) / 2, y: (previous.b.y + segment.a.y) / 2 };
      }));
      if (points.length < 3 || polygonArea(points) < 5e5)
        return null;
      return { points, approximate: traced.maximumGap > 250 };
    };
    centreRoom = (points) => {
      const minX = Math.min(...points.map((point3) => point3.x));
      const maxX = Math.max(...points.map((point3) => point3.x));
      const minY = Math.min(...points.map((point3) => point3.y));
      const maxY = Math.max(...points.map((point3) => point3.y));
      const offset2 = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
      return { points: points.map((point3) => ({ x: point3.x - offset2.x, y: point3.y - offset2.y })), offset: offset2 };
    };
    wallsFromPoints = (points) => points.map((point3, index) => {
      const next = points[(index + 1) % points.length];
      return { x1: Math.round(point3.x), y1: Math.round(point3.y), x2: Math.round(next.x), y2: Math.round(next.y) };
    });
    nearestWall2 = (point3, points) => {
      let best = null;
      points.forEach((start3, wallIndex) => {
        const end2 = points[(wallIndex + 1) % points.length];
        const dx = end2.x - start3.x;
        const dy = end2.y - start3.y;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared < 1)
          return;
        const position = Math.min(0.98, Math.max(0.02, ((point3.x - start3.x) * dx + (point3.y - start3.y) * dy) / lengthSquared));
        const projected = { x: start3.x + dx * position, y: start3.y + dy * position };
        const candidate = { wallIndex, position, distance: distance3(point3, projected) };
        if (!best || candidate.distance < best.distance)
          best = candidate;
      });
      return best;
    };
    furnitureMap = {
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
    titleCase = (value) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase());
    buildRoom = (group, index, defaultName, warnings) => {
      const floorPolygon = polygonFromFloor(group);
      const traced = floorPolygon ? null : polygonFromWalls(group);
      const rawPoints = floorPolygon || traced?.points;
      if (!rawPoints)
        return null;
      if (traced?.approximate)
        warnings.add("approximate_boundary");
      const centered = centreRoom(rawPoints);
      const points = centered.points;
      const shift2 = (point3) => ({ x: point3.x - centered.offset.x, y: point3.y - centered.offset.y });
      const openingList = (key) => surfaces(group[key]).flatMap((surface, itemIndex) => {
        const rawCentre = centre(surface);
        const [width = key === "doors" ? 0.9 : 1.2, height = key === "doors" ? 2 : 1] = dimensions(surface);
        if (!rawCentre || !Number.isFinite(width) || width <= 0)
          return [];
        const placement = nearestWall2(shift2(rawCentre), points);
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
        const position = shift2(rawCentre);
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
    roomGroups = (data) => {
      const nested = Array.isArray(data.rooms) ? data.rooms.filter((room) => isRecord(room) && surfaces(room.walls).length >= 3) : [];
      if (nested.length)
        return nested.slice(0, 100);
      return surfaces(data.walls).length >= 3 ? [data] : [];
    };
    isAppleRoomPlan = (data) => isRecord(data) && roomGroups(data).length > 0;
    parseAppleRoomPlan = (data, defaultName = "LiDAR room") => {
      if (!isRecord(data) || !isAppleRoomPlan(data))
        throw new RoomPlanImportError("not_roomplan");
      const warnings = /* @__PURE__ */ new Set();
      const rooms = roomGroups(data).map((group, index) => buildRoom(group, index, defaultName, warnings)).filter((room) => room !== null);
      if (!rooms.length)
        throw new RoomPlanImportError("no_room_boundary");
      return { source: "apple_roomplan", rooms, warnings: [...warnings] };
    };
  }
});

// src/js/floor-planner-import.mjs
var floor_planner_import_exports = {};
__export(floor_planner_import_exports, {
  importRoomGeometry: () => importRoomGeometry
});
function homeRooms(data) {
  if (data?.format === "smarthomeshop-room" && data.schemaVersion === 1) return [data.room];
  if (data?.key === "smarthomeshop.rooms" && data.data?.rooms && typeof data.data.rooms === "object") return Object.values(data.data.rooms);
  if (Array.isArray(data?.walls) && data.walls.length >= 3 && data.walls.every((wall2) => finite(wall2?.x1) && finite(wall2?.y1))) return [data];
  return null;
}
function importRoomGeometry(data, copy2) {
  const backup = homeRooms(data);
  const scan = backup ? null : parseAppleRoomPlan(data, copy2.room);
  const source = backup ?? scan.rooms;
  if (!source.length || source.length > 80 * maxFloors) throw new Error("Invalid room count");
  const name = copy2[backup ? "import_room_name" : "import_lidar_name"];
  const floors = /* @__PURE__ */ new Map();
  let review = Boolean(backup || scan?.warnings.length);
  for (const raw of source) {
    const walls = array(raw?.walls);
    if (walls.length < 3 || walls.some((wall2) => !finite(wall2?.x1) || !finite(wall2?.y1))) throw new Error("Invalid room contour");
    const placement = raw.house;
    const placed2 = placement && finite(placement.x) && finite(placement.y);
    const level = Number.isInteger(placement?.floor) ? placement.floor : 0;
    const rotation = finite(placement?.rotationDeg) ? placement.rotationDeg : 0;
    if (!floors.has(level)) floors.set(level, {
      id: newId(),
      level,
      name: null,
      plan: { ...blankPlan(name), version: 3, furniture: [], windows: [], mirrors: [], zones: [] }
    });
    const plan2 = floors.get(level).plan;
    const radians = rotation * Math.PI / 180;
    const xs = walls.map((wall2) => wall2.x1), ys = walls.map((wall2) => wall2.y1);
    const offsetX = placed2 ? placement.x : (plan2.rooms.length ? Math.max(...plan2.rooms.map((room2) => room2.x + room2.width)) * 1e3 + 750 : 0) - Math.min(...xs);
    const offsetY = placed2 ? placement.y : -Math.min(...ys);
    const convert = ({ x, y }) => [
      meters(offsetX + x * Math.cos(radians) - y * Math.sin(radians)),
      meters(offsetY + x * Math.sin(radians) + y * Math.cos(radians))
    ];
    const corners = walls.map((wall2) => convert({ x: wall2.x1, y: wall2.y1 }));
    const geometry = outlineBounds(corners);
    if (!geometry) throw new Error("Invalid room shape");
    const room = { ...geometry, id: newId(), name: safeName(raw.name, copy2.room), height: 2.7 };
    plan2.rooms.push(room);
    for (const type of ["doors", "windows", "mirrors"]) for (const item of array(raw[type])) {
      const a = corners[item?.wallIndex], b = corners[(item?.wallIndex + 1) % corners.length];
      if (!a || !b || !finite(item.position) || !finite(item.width)) {
        review = true;
        continue;
      }
      const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
      const width = Math.min(type === "doors" ? 2 : 8, meters(item.width), length);
      if (width < (type === "doors" ? 0.5 : 0.1)) {
        review = true;
        continue;
      }
      const start3 = Math.max(0, Math.min(length - width, item.position * length - width / 2));
      const reverse = type === "doors" && item.openDirection === "inward";
      const t = (start3 + (reverse ? width : 0)) / length;
      const position = {
        id: newId(),
        roomId: room.id,
        width,
        angle: degrees3(Math.atan2(dy, dx) * 180 / Math.PI + (reverse ? 180 : 0)),
        x: a[0] + dx * t,
        y: a[1] + dy * t
      };
      if (type === "doors") plan2.doors.push(position);
      else plan2[type].push({
        ...position,
        base: type === "windows" ? defaultWindowSill : 0.5,
        height: finite(item.height) ? Math.max(0.1, Math.min(6, meters(item.height))) : 1
      });
    }
    for (const item of array(raw.furniture)) {
      if (!point2(item)) {
        review = true;
        continue;
      }
      const kind = firstKind(item.typeId ?? item.type);
      const [x, y] = convert(item);
      const angle2 = degrees3(rotation + (finite(item.rotationDeg) ? item.rotationDeg : finite(item.rotation) ? item.rotation : 0));
      const object = furnitureAt(kind, safeName(item.name, copy2.furniture_items[kind]), { x, y }, angle2);
      const size = (value) => finite(value) && value >= 20 && value <= 12e3 ? meters(value) : null;
      plan2.furniture.push({
        ...object,
        id: newId(),
        width: size(item.width) ?? object.width,
        depth: size(item.height) ?? size(item.depth) ?? object.depth
      });
    }
    for (const zone of array(raw.zones)) {
      if (!zoneTypes.includes(zone?.type)) {
        review = true;
        continue;
      }
      if (zone.sensorId || zone.sensor_id) {
        review = true;
        continue;
      }
      const unique = [...new Set([zone.points, ...array(zone.parts)].filter((part) => Array.isArray(part) && part.every(point2)).map((part) => JSON.stringify(part.map(convert))))].map((value) => JSON.parse(value));
      const imported = {
        id: newId(),
        roomId: room.id,
        type: zone.type,
        parts: unique,
        name: safeName(zone.name, copy2["zone_" + zone.type]),
        ...zone.type === "entry" ? { direction: zone.inDirection === "left" ? "left" : "right" } : {}
      };
      if (validPlan({ ...plan2, zones: [imported] })) plan2.zones.push(imported);
      else review = true;
    }
  }
  const results = [...floors.values()].sort((a, b) => a.level - b.level);
  const project = {
    format: buildingFormat,
    version: 1,
    name,
    floors: results,
    activeFloor: (results.find((floor) => floor.level === 0) ?? results[0]).id
  };
  if (!validBuilding(project)) throw new Error("Invalid imported plan");
  return { project: results.length === 1 && results[0].level === 0 ? results[0].plan : project, backup: Boolean(backup), review };
}
var degrees3, finite, point2, array, meters, safeName, furnitureTypes, firstKind;
var init_floor_planner_import = __esm({
  "src/js/floor-planner-import.mjs"() {
    init_floor_planner_building();
    init_floor_planner_furniture();
    init_floor_planner_geometry();
    init_floor_planner_model();
    init_floor_planner_roomplan();
    degrees3 = (value) => (value % 360 + 360) % 360;
    finite = (value) => typeof value === "number" && Number.isFinite(value);
    point2 = (value) => value && finite(value.x) && finite(value.y);
    array = (value) => Array.isArray(value) ? value : [];
    meters = (value) => Number((value / 1e3).toFixed(6));
    safeName = (value, fallback) => typeof value === "string" && value.trim() ? value.trim().slice(0, 48) : fallback;
    furnitureTypes = {
      table: "dining",
      "dining-table-4": "dining",
      "dining-table-6": "dining",
      "coffee-table": "coffee",
      "dining-chair": "chair",
      "office-chair": "chair",
      bookshelf: "shelves",
      "tv-stand": "cabinet"
    };
    firstKind = (type) => Object.hasOwn(furnitureCatalog, type) ? type : (Object.hasOwn(furnitureTypes, type) ? furnitureTypes[type] : null) ?? (typeof type === "string" && type.startsWith("bed-") ? "bed" : typeof type === "string" && type.startsWith("sofa-") ? "sofa" : "custom");
  }
});

// src/js/floor-planner-preview.mjs
var floor_planner_preview_exports = {};
__export(floor_planner_preview_exports, {
  demoStairForeground: () => demoStairForeground,
  demoWalkSequence: () => demoWalkSequence,
  startDemoPreview: () => startDemoPreview
});
function demoStairForeground(stair, view2 = camera) {
  const [, viewX] = projectSpace([1, 0], 0, view2, false);
  const [, viewY] = projectSpace([0, 1], 0, view2, false);
  const walls = stairWalls(stair);
  const screenXs = walls.map(([point3]) => projectSpace(point3, 0, view2, false)[0]);
  const left = Math.min(...screenXs), right = Math.max(...screenXs);
  const faces = walls.flatMap(([[ax, ay], [bx, by]]) => {
    const nx = ay - by, ny = bx - ax;
    return nx * viewX + ny * viewY > 1e-7 ? [{ ax, ay, nx, ny }] : [];
  });
  return ({ x, y }) => {
    const [screenX] = projectSpace([x, y], 0, view2, false);
    return screenX >= left - 0.35 && screenX <= right + 0.35 && faces.some(({ ax, ay, nx, ny }) => (x - ax) * nx + (y - ay) * ny >= -1e-7);
  };
}
function demoWalkSequence([ground, upper], stair) {
  const path2 = (floor, stops) => {
    const { plan: plan2 } = floor;
    const network = createWalkNetwork(plan2, [...solidWalls(plan2), ...stairWalls(stair)]);
    const legs = [];
    for (let index = 1; index < stops.length; index++) {
      const route = network.routeTo(stops[index - 1], stops[index]);
      if (!route) return [];
      let from = stops[index - 1];
      for (const to of route) {
        const dx = to.x - from.x, dy = to.y - from.y;
        const distance4 = Math.hypot(dx, dy);
        if (distance4 > 1e-6) legs.push({
          floor,
          from,
          to,
          duration: distance4 / pace * 1e3,
          heading: Math.atan2(dx, -dy) * 180 / Math.PI,
          distance: distance4
        });
        from = to;
      }
    }
    return legs;
  };
  const towardsStair = path2(ground, [groundStart, { x: 4.9, y: 1.7 }, stair.bottom]);
  const upstairs = path2(upper, [stair.top, { x: 8.3, y: 6.3 }, { x: 8.6, y: 2.45 }, stair.top]);
  const downstairs = path2(ground, [stair.bottom, groundStart]);
  if (!towardsStair.length || !upstairs.length || !downstairs.length) return [];
  const cross4 = (up) => ({ stair, floor: up ? ground : upper, up, duration: stairGaitDuration(up) });
  return [...towardsStair, cross4(true), ...upstairs, cross4(false), ...downstairs];
}
function startDemoPreview(section, floors, stair, copy2, reducedMotion2) {
  const map = section.querySelector("#fp-start-preview");
  const control = section.querySelector("#fp-demo-playback");
  const status = section.querySelector("#fp-demo-detection");
  const scene = paintBuilding(floors, camera, separation, stair, paintFloorCoverage);
  if (!scene) return () => {
  };
  map.setAttribute("viewBox", scene.viewBox);
  const [x, y, width, height] = scene.viewBox.split(" ");
  const walkerMask = "fp-demo-walker-in-front";
  map.innerHTML = scene.markup + `<defs>
        <filter id="fp-demo-walker-silhouette"><feColorMatrix type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
        <mask id="${walkerMask}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${height}">
            <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white"/>
            <use href="#fp-demo-walker-mesh" filter="url(#fp-demo-walker-silhouette)"/>
        </mask>
    </defs>`;
  const figure = document.createElementNS(map.namespaceURI, "g");
  figure.setAttribute("data-demo-person", "");
  figure.setAttribute("pointer-events", "none");
  const stairs = map.querySelector(".fp-stair-flight");
  const stairLayer = stairs.querySelector("[data-stair-walkers]");
  const inFrontOfStair = demoStairForeground(stair);
  const markers = floors.map((floor) => {
    const layer = map.querySelector(`[data-building-floor="${floor.id}"]`);
    return {
      floor,
      plan: floor.plan,
      layer,
      sensors: preparePersonSensors(floor.plan),
      furniture: prepareFurnitureOcclusion(floor.plan.furniture ?? []),
      sight: prepareSight(floor.plan),
      elements: layer.querySelectorAll(".fp-space-marker, .fp-stack-beam, .fp-wall-fan")
    };
  });
  const rise = floorStackHeight(floors[1].level, floors[0].level, separation);
  const stairOcclusion = { id: stairOcclusionId(stair), height: rise };
  let current = 0, elapsed = 0, stride = 0, frame = 0, previous = 0;
  let sequence, paused = reducedMotion2.matches, visible = false;
  function draw(floor, pose, crossing2 = false) {
    const readings = crossing2 ? [] : personSignals(floor.plan, pose, floor.sensors, floor.furniture, floor.sight);
    const detected = readings.filter((reading) => reading.seen);
    for (const layer2 of markers) {
      for (const element2 of layer2.elements) {
        const id = element2.dataset.sensor ?? element2.dataset.item;
        const seen = layer2 === floor && detected.some(({ item, signals }) => item.id === id && (!element2.dataset.radar || signals.some((signal) => signal.seen && signal.radar === element2.dataset.radar)));
        element2.toggleAttribute("data-detected", seen);
      }
    }
    const room = floor.plan.rooms.find((room2) => contains(room2, pose));
    const count = copy2.sim_count.replace(":seen", detected.length).replace(":total", floor.plan.sensors.length);
    const next = copy2.demo_detection + (crossing2 ? " · " + copy2.staircase : " · " + [room?.name, count].filter(Boolean).join(" · "));
    if (status.textContent !== next) status.textContent = next;
    status.toggleAttribute("data-detected", detected.length > 0);
    const layer = crossing2 ? stairLayer : floor.layer;
    if (figure.parentNode !== layer) layer.append(figure);
    figure.innerHTML = paintPerson({
      pose: "standing",
      avatar: "man",
      ...pose,
      elevation: crossing2 ? pose.elevation : 0
    }, camera, !reducedMotion2.matches, false, crossing2 ? stairOcclusion : null);
    if (!crossing2 && floor.floor.id === stair.lower && inFrontOfStair(pose)) {
      figure.querySelector(".fp-avatar-mesh").id = "fp-demo-walker-mesh";
      stairs.setAttribute("mask", `url(#${walkerMask})`);
    } else stairs.removeAttribute("mask");
  }
  function tick(now) {
    if (now - previous >= frameTime) {
      elapsed += previous ? Math.min(100, now - previous) : 0;
      previous = now;
      let leg = sequence[current];
      while (elapsed >= leg.duration) {
        elapsed -= leg.duration;
        stride += leg.distance ?? 0;
        current = (current + 1) % sequence.length;
        leg = sequence[current];
      }
      const fraction = elapsed / leg.duration;
      const floor = markers.find((entry) => entry.floor === leg.floor);
      if (leg.stair) {
        const gait = stairGait(stair, fraction, rise, leg.up);
        draw(floor, { ...gait, heading: stairHeading(stair, leg.up) }, true);
      } else {
        draw(floor, {
          x: leg.from.x + (leg.to.x - leg.from.x) * fraction,
          y: leg.from.y + (leg.to.y - leg.from.y) * fraction,
          pose: "standing",
          heading: leg.heading,
          moving: true,
          stride: stride + leg.distance * fraction
        });
      }
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    const playing = !paused && visible && !document.hidden;
    control.setAttribute("aria-label", copy2[paused ? "demo_play" : "demo_pause"]);
    control.toggleAttribute("data-playing", !paused);
    if (!playing) {
      cancelAnimationFrame(frame);
      frame = previous = 0;
    } else if (!frame) {
      sequence ??= demoWalkSequence(floors, stair);
      if (sequence.length) frame = requestAnimationFrame(tick);
      else control.hidden = true;
    }
  }
  const toggle = () => {
    paused = !paused;
    sync();
  };
  const motionChanged = () => {
    paused = reducedMotion2.matches;
    sync();
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0.12 });
  draw(markers[0], { ...groundStart, pose: "standing", heading: 0 });
  control.hidden = false;
  control.addEventListener("click", toggle);
  reducedMotion2.addEventListener("change", motionChanged);
  document.addEventListener("visibilitychange", sync);
  observer.observe(map);
  sync();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    control.removeEventListener("click", toggle);
    reducedMotion2.removeEventListener("change", motionChanged);
    document.removeEventListener("visibilitychange", sync);
  };
}
var camera, separation, pace, frameTime, groundStart;
var init_floor_planner_preview = __esm({
  "src/js/floor-planner-preview.mjs"() {
    init_floor_planner_beam();
    init_floor_planner_model();
    init_floor_planner_obstruction();
    init_floor_planner_person();
    init_floor_planner_sight();
    init_floor_planner_space();
    init_floor_planner_stairs();
    init_floor_planner_walk_route();
    camera = defaultSpaceCamera;
    separation = 1.16;
    pace = 1.45;
    frameTime = 50;
    groundStart = { x: 8.25, y: 1.7 };
  }
});

// src/js/floor-planner-order.js
var floor_planner_order_exports = {};
__export(floor_planner_order_exports, {
  openPlannerOrder: () => openPlannerOrder,
  sensorsByRoom: () => sensorsByRoom
});
function openPlannerOrder(plan2, copy2, opener = el("fp-open-order")) {
  overview ??= createOverview(copy2);
  overview?.open(plan2, opener);
}
function sensorsByRoom(plan2) {
  if (Array.isArray(plan2.floors)) {
    return plan2.floors.flatMap((floor) => sensorsByRoom(floor.plan).map((room) => ({
      ...room,
      name: [floor.label, room.name].filter(Boolean).join(" · ")
    })));
  }
  const rooms = /* @__PURE__ */ new Map();
  for (const sensor of plan2.sensors ?? []) {
    const room = roomForDevice(plan2.rooms, sensor);
    const roomId = room?.id ?? "";
    if (!rooms.has(roomId)) rooms.set(roomId, { name: room?.name, rows: /* @__PURE__ */ new Map() });
    const { rows } = rooms.get(roomId);
    const key = JSON.stringify([sensor.model, sensor.radar, Boolean(sensor.climate)]);
    if (!rows.has(key)) rows.set(key, { model: sensor.model, radar: sensor.radar, quantity: 0 });
    rows.get(key).quantity++;
  }
  return [...rooms.values()].map((room) => ({ name: room.name, rows: [...room.rows.values()] }));
}
function createOverview(copy2) {
  const dialog = el("fp-order");
  const body = el("fp-order-body");
  if (!dialog || !body) return null;
  let opener = null;
  dialog.querySelector(".fp-order-footer")?.setAttribute("hidden", "");
  dialog.querySelector(".fp-order-heading p")?.setAttribute("hidden", "");
  const title = el("fp-order-title");
  if (title && copy2.order_scope) title.textContent = copy2.order_scope;
  el("fp-order-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => opener?.focus({ preventScroll: true }));
  const render2 = (plan2) => {
    const rooms = sensorsByRoom(plan2);
    if (!rooms.length) {
      body.innerHTML = `<p class="fp-order-notice">${escapeText(copy2.order_empty ?? "")}</p>`;
      return;
    }
    body.innerHTML = rooms.map((room) => `<section class="fp-order-room">
            <h3>${escapeText(room.name ?? copy2.order_no_room ?? "")}</h3>
            ${room.rows.map((row) => {
      const radar = row.radar && row.radar !== "none" ? radarNames[row.radar] : "";
      const name = [devices[row.model]?.name ?? row.model, radar].filter(Boolean).join(" · ");
      return `<div class="fp-order-line"><span>${escapeText(name)}</span><strong>${row.quantity}x</strong></div>`;
    }).join("")}
        </section>`).join("");
  };
  return {
    open(plan2, trigger) {
      opener = trigger;
      render2(plan2);
      dialog.showModal();
    }
  };
}
var el, overview;
var init_floor_planner_order = __esm({
  "src/js/floor-planner-order.js"() {
    init_floor_planner_model();
    init_floor_planner_drawing();
    el = (id) => document.getElementById(id);
    overview = null;
  }
});

// src/js/floor-planner.js
var floor_planner_exports = {};
function showDoorActions() {
  if (!doorActions) return;
  const { type, item } = selectedItem();
  const shown = type === "doors" && tool === "edit" && !simulation && !liveMode;
  doorActions.bar.hidden = !shown;
  if (shown) doorActions.toggle.textContent = item.closed ? copy.door_open : copy.door_close;
}
async function tracedUnderlay(underlay, metres2 = underlay.width) {
  try {
    const pixels = await underlayPixels(underlay);
    const traced = traceFloorPlan(pixels, metres2);
    return traced?.rooms.length ? traced : traceColourMap(pixels, metres2) ?? traced;
  } catch {
    return null;
  }
}
async function addRecognisedRooms(answer, keepScale) {
  const underlay = plan.underlay;
  const width = answer?.recognition?.width_m;
  const traced = await tracedUnderlay(underlay, !keepScale && Number.isFinite(width) && width > 0 ? width : underlay.width);
  if (plan.underlay?.data !== underlay.data) return showRecognition("idle");
  const recognition2 = traced ? followTracedWalls(answer?.recognition, traced) : answer?.recognition;
  const draft = draftFromRecognition(recognition2, plan.underlay, { roomName: copy.room, keepScale });
  const next = draft && planWithDraft(plan, draft);
  if (!next) throw Object.assign(new Error("No rooms"), { code: draft ? "recognition_failed" : "no_rooms_found" });
  remember();
  const added = next.rooms.length - plan.rooms.length;
  plan = next;
  setTool("edit");
  finish();
  fit();
  showRecognition("idle", recognitionNote(copy, { rooms: added, quota: answer.quota }, (value) => number3.format(value)));
}
function showTracing(message = "", busy = false) {
  if (!tracing) return;
  tracing.busy = busy;
  tracing.button.disabled = busy;
  tracing.button.toggleAttribute("aria-busy", busy);
  tracing.note.textContent = message;
  tracing.note.hidden = !message;
}
async function traceUnderlay() {
  const underlay = plan.underlay;
  showTracing(copy.trace_busy, true);
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
  const traced = await tracedUnderlay(underlay);
  if (plan.underlay?.data !== underlay.data) return showTracing();
  const draft = traced?.rooms.length ? draftFromRecognition(traced, plan.underlay, { roomName: copy.room, keepScale: true }) : null;
  if (!draft) return showTracing(copy.trace_none);
  const rooms = draft.rooms.filter((room) => !plan.rooms.some((existing) => roomContains(existing, roomInteriorPoint(room))));
  const kept = new Set(rooms.map((room) => room.id));
  const next = rooms.length && planWithDraft(plan, { ...draft, rooms, doors: draft.doors.filter((door) => kept.has(door.roomId)) });
  if (!next) return showTracing(rooms.length ? copy.trace_none : copy.trace_none_new);
  remember();
  const added = next.rooms.length - plan.rooms.length;
  plan = next;
  setTool("edit");
  finish();
  fit();
  showTracing(copy.trace_done.replace(":count", number3.format(added)));
}
function showRecognition(state, message = "") {
  if (!recognition) return;
  recognition.state = state;
  recognition.button.textContent = copy[state === "armed" ? "recognise_send" : "recognise_action"];
  recognition.button.disabled = state === "busy";
  recognition.button.toggleAttribute("aria-busy", state === "busy");
  recognition.note.textContent = state === "armed" ? `${copy.recognise_privacy} ${copy.recognise_account}` : state === "busy" ? copy.recognise_busy : message;
  recognition.note.hidden = !recognition.note.textContent;
  clearInterval(recognition.timer);
  recognition.meter.hidden = state !== "busy";
  recognition.scan.toggleAttribute("hidden", state !== "busy");
  if (state !== "busy") return;
  const started = performance.now();
  const tick = () => {
    const done = recognitionProgress(performance.now() - started);
    recognition.bar.value = done;
    recognition.share.textContent = recognition.percentage.format(done / 100);
  };
  tick();
  recognition.timer = setInterval(tick, 250);
}
function readProject(project) {
  const localized = localizeSampleRooms(project, copy.names, copy.sample_name_languages);
  building = localized.format === buildingFormat ? localized : null;
  const floor = building?.floors.find((floor2) => floor2.id === building.activeFloor);
  plan = withEditableFurniture(floor?.plan ?? localized);
}
function projectDocument(activePlan = plan) {
  return building ? { ...building, floors: building.floors.map((floor) => floor.id === building.activeFloor ? { ...floor, plan: activePlan } : floor) } : activePlan;
}
function projectFloors() {
  return projectDocument().floors ?? [{ id: "ground", level: 0, name: null, plan }];
}
function save(replaceUnreadable = false) {
  const recovery = element("fp-recovery");
  if (integration) {
    if (!liveMode) integration.update(projectDocument());
    return;
  }
  if (unreadableDraft !== null && !replaceUnreadable) {
    recovery.hidden = false;
    element("fp-save").textContent = copy.recovery_note;
    return;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(projectDocument()));
    unreadableDraft = null;
    recovery.hidden = true;
    element("fp-save").textContent = "";
  } catch {
    element("fp-save").textContent = copy.local_error;
  }
}
function remember(previous = JSON.stringify(plan)) {
  reviewedCoverage = false;
  recentUndo = null;
  history.push(building ? JSON.stringify(projectDocument(JSON.parse(previous))) : previous);
  if (history.length > 35) history.shift();
  future.length = 0;
}
function finish() {
  walkSight = null;
  save();
  render();
}
function selectedItem() {
  for (const type of ["sensors", "furniture", "doors", "windows", "mirrors", "zones", "walls", "rooms"]) {
    const item = plan[type]?.find((item2) => item2.id === selected);
    if (item) return { type, item };
  }
  return {};
}
function currentRoom() {
  const { type, item } = selectedItem();
  if (type === "rooms") return item;
  if (type === "sensors") return roomForDevice(plan.rooms, item);
  if (item?.roomId) return plan.rooms.find((room) => room.id === item.roomId);
  return type === "furniture" ? plan.rooms.find((room) => contains(room, item)) : null;
}
function placementRoom() {
  return currentRoom() ?? (plan.rooms.length === 1 || ["furnish", "move_furniture"].includes(tool) ? plan.rooms[0] : null);
}
function placementOrigin() {
  const room = placementRoom();
  if (!room) return limitPoint(camera2);
  return roomInteriorPoint(room, { x: room.x + room.width / 2, y: room.y + room.depth * (devices[choice]?.mount === "wall" ? 1 : 0.5) });
}
function setTool(next, model = null, device = null) {
  if (interaction?.vertex !== void 0) interaction = null;
  lastRoomClick = null;
  tool = next;
  placedWithTool = 0;
  placementDevice = device;
  if (next !== "place") placementAreaId = null;
  if (next !== "edit") closeSensorTip();
  choice = model;
  if (model && Object.hasOwn(devices, model)) placementInstallation = catalogMount === "wall" && installationsFor(model).includes("wall-bracket") ? "wall-bracket" : installationsFor(model)[0];
  placementPoint = null;
  if (placingOpening()) {
    const defaults = openingDefaults[tool];
    const item = plan[tool + "s"]?.find((item2) => item2.id === choice);
    openingWidth.min = defaults.min;
    openingWidth.max = defaults.max;
    openingWidth.value = item?.width ?? defaults.width;
    openingHeight.value = item?.height ?? defaults.height ?? "";
    root.removeAttribute("data-panel");
  }
  if (next === "zone") element("fp-zone-type").disabled = Boolean(model);
  start2 = null;
  roomDraft = [];
  draftCorner = 0;
  ghost.replaceChildren();
  ghost.removeAttribute("data-invalid");
  ghost.removeAttribute("data-preview");
  canvas.removeAttribute("data-room-corner-drag");
  roomHandleFeedback.textContent = "";
  updateTools();
}
function hint() {
  const message = toolHint();
  return toolRepeats(tool, choice) && !start2 && !roomDraft.length ? `${message} ${copy.tool_repeat}` : message;
}
function toolHint() {
  if (tool === "place") return `${copy.sensor_hint} · ${placementDevice?.name ?? devices[choice].name}`;
  if (tool === "furnish" || tool === "move_furniture") {
    const name = tool === "furnish" ? copy.furniture_items[choice] : selectedItem().item?.name;
    return `${copy.furniture_place_hint} · ${name ?? ""}`;
  }
  if (tool === "scale_underlay") return start2 ? copy.underlay_end : copy.underlay_start;
  if (tool === "outline_room") return copy[roomDraft.length ? "room_outline_more" : "room_outline_start"];
  if (tool === "zone") return copy[element("fp-zone-type").value === "entry" ? "zone_entry_hint" : roomDraft.length ? "zone_more" : "zone_start"];
  if (tool === "edit_outline") return copy[selectedItem().type === "zones" ? "zone_edit_hint" : "room_edit_hint"] + (roomDraft.length ? " " + copy.room_corner_status.replace(":index", number3.format(draftCorner + 1)).replace(":total", number3.format(roomDraft.length)) : "");
  if (tool === "room" || tool === "wall") return copy[`${tool}_${start2 ? "end" : "start"}`];
  if (tool === "edit") return plan.rooms.length ? matchMedia("(any-pointer: fine)").matches ? copy.quick_place_hint : copy.select_hint : copy[roomFormOpen ? "room_form_map_hint" : "empty_hint"];
  return copy[`${tool}_hint`];
}
function updateTools() {
  renderFlow();
  const status = element("fp-hint");
  const message = hint();
  if (status.textContent !== message) status.textContent = message;
  status.hidden = tool === "edit";
  element("fp-draw-keys").hidden = tool !== "room" && tool !== "wall";
  element("fp-tool-stop").hidden = tool !== "wall";
  showDoorActions();
  canvas.dataset.tool = tool;
  renderRoomHandles();
  root.querySelectorAll("[data-sensor-marker]").forEach((marker) => {
    marker.setAttribute("tabindex", tool === "edit" ? "0" : "-1");
  });
  const furnishing = tool === "furnish" || tool === "move_furniture";
  const placing = tool === "place";
  const moving = tool === "move_item";
  const opening = placingOpening();
  const repeating = toolRepeats(tool, choice);
  const leave = copy[repeating && placedWithTool ? "tool_done" : "cancel_place"];
  const placementBar = element("fp-placement-bar");
  placementBar.hidden = view !== "2d" || !placing && !furnishing && !moving && !opening;
  const wallPreview = opening && placementPoint ? renderOpeningPreview(placementPoint) : null;
  element("fp-place-title").textContent = placing ? copy.place_model.replace(":model", placementDevice?.name ?? devices[choice].name) : opening ? copy[tool] : moving ? copy.move_item : message;
  element("fp-place-help").textContent = opening ? openingHelp(wallPreview) + (repeating && !placementPoint ? ` ${copy.tool_repeat}` : "") : moving ? message : placing ? copy[placementPoint ? "place_confirm_hint" : !integration && !devices[choice].defaultRadar ? "place_marker_only" : matchMedia("(pointer: coarse)").matches ? "place_touch" : "place_hover"] + (!placementPoint && devices[choice].mount === "wall" && placementInstallation !== "freestanding" ? " " + copy.place_wall_snap : "") : "";
  element("fp-place-cancel").textContent = leave;
  const confirmPlacement = element("fp-place-confirm");
  confirmPlacement.hidden = !placing && !opening || !placementPoint;
  confirmPlacement.disabled = opening && Boolean(placementPoint) && !wallPreview?.position;
  element("fp-place-installation-field").hidden = !placing;
  element("fp-opening-dimensions").hidden = !opening;
  element("fp-opening-height-field").hidden = tool === "door";
  if (placing) {
    const options2 = installationsFor(choice).map((value) => `<option value="${value}">${copy.installations[value]}</option>`).join("");
    const input = element("fp-place-installation");
    if (input.innerHTML !== options2) input.innerHTML = options2;
    input.value = placementInstallation;
  }
  updateSelectionJump();
  root.toggleAttribute("data-placing-object", !placementBar.hidden);
  space.toggleAttribute("data-furnishing", furnishing);
  element("fp-space-placement").hidden = !furnishing || view !== "3d";
  if (furnishing) element("fp-space-placement-text").textContent = message;
  root.querySelectorAll("button[data-tool], button[data-model]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.tool === tool || button.dataset.model === choice || button.dataset.tool === "room" && tool === "outline_room"));
  });
  const drawingOutline = tool === "outline_room" || tool === "zone", editingOutline = tool === "edit_outline";
  const zoneTool = tool === "zone";
  const zoneEdit = editingOutline && selectedItem().type === "zones";
  element("fp-outline-tools").hidden = tool !== "room" && !drawingOutline && !editingOutline;
  element("fp-zone-options").hidden = !zoneTool;
  element("fp-room-corner-position").hidden = !editingOutline;
  element("fp-room-modes").hidden = tool !== "room" && tool !== "outline_room";
  element("fp-room-outline-actions").hidden = !drawingOutline && !editingOutline;
  root.querySelectorAll("[data-room-mode]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.roomMode === tool)));
  const saveOutline = root.querySelector('[data-action="save_outline"]');
  const entry = zoneTool && element("fp-zone-type").value === "entry" || zoneEdit && selectedItem().item.type === "entry";
  saveOutline.disabled = roomDraft.length < (entry ? 2 : 3);
  saveOutline.textContent = copy[zoneTool || zoneEdit ? "zone_save" : editingOutline ? "room_save_outline" : "room_close_outline"];
  const undoCorner = root.querySelector('[data-action="undo_corner"]');
  undoCorner.hidden = editingOutline;
  undoCorner.disabled = !roomDraft.length;
  const removeCorner = root.querySelector('[data-action="remove_corner"]');
  removeCorner.hidden = !editingOutline;
  removeCorner.disabled = roomDraft.length <= 3;
  root.querySelector('[data-action="cancel_outline"]').textContent = roomDraft.length ? copy.cancel_place : leave;
  board.setAttribute("aria-describedby", editingOutline ? "fp-keys fp-outline-keys" : placing || opening ? "fp-place-help fp-keys" : "fp-keys");
  element("fp-place-center").hidden = Boolean(placementPoint) || !(furnishing && plan.rooms.length) && (tool !== "place" || !placementRoom() || devices[choice].mount !== "ceiling");
  element("fp-space-place-center").hidden = !furnishing || !plan.rooms.length;
  drawingMenu.toggleAttribute("data-active", ["wall", "door", "window", "mirror", "zone"].includes(tool));
  libraryButton.toggleAttribute("data-placing", tool === "place");
  const coverageToggle = root.querySelector('[data-action="coverage"]');
  const hasSensors = allFloors ? projectFloors().some((floor) => visibleSensors(floor.plan).length) : Boolean(visibleSensors(plan).length);
  coverageToggle.setAttribute("aria-pressed", String(showCoverage));
  coverageToggle.hidden = !hasSensors;
  element("fp-legend").hidden = !hasSensors && !simulation;
  element("fp-undo-notice").hidden = !recentUndo || simulation || tool !== "edit";
  element("fp-undo-message").textContent = recentUndo ?? "";
  root.querySelector('[data-action="undo"]').disabled = history.length === 0 && !(drawingOutline && roomDraft.length) && !editingOutline;
  root.querySelector('[data-action="redo"]').disabled = future.length === 0;
  root.querySelector('[data-action="measures"]').setAttribute("aria-pressed", String(showMeasures));
}
function renderFlow() {
  element("fp-start").hidden = !showStart;
  element("fp-editor").hidden = showStart;
  const roomCount = plan.rooms.length, sensorCount = plan.sensors.length;
  const choosingSensor = sensorStep.getAttribute("aria-expanded") === "true";
  const busy = roomFormOpen || tool !== "edit" || choosingSensor;
  const canTestBuilding = allFloors && projectFloors().some((floor) => floor.plan.rooms.length);
  const next = integration && !appPlanner ? allFloors || busy || liveMode ? null : !roomCount ? roomStep : !plan.sensors.some((sensor) => sensor.haDevice) ? sensorStep : null : simulation || canTestBuilding ? testStep : allFloors || busy ? null : !roomCount ? roomStep : !sensorCount ? sensorStep : reviewedCoverage && !appPlanner ? orderStep : testStep;
  for (const step2 of [roomStep, sensorStep, testStep, orderStep]) step2.hidden = step2 !== next;
  extraSensor.hidden = allFloors || simulation || next !== testStep && next !== orderStep;
  element("fp-next").hidden = simulation || !next && (Boolean(integration) || !allFloors);
  const room = placementRoom();
  const sensorMessage = room ? copy.next_sensor_room.replace(":room", room.name) : copy.next_sensor;
  const message = integration && next === sensorStep ? integration.picker.prompt : simulation ? "" : allFloors ? copy[canTestBuilding ? "next_all_test" : "next_all_floors"] : !roomCount ? copy.next_room : !sensorCount ? sensorMessage : reviewedCoverage && !appPlanner ? copy.next_reviewed : copy.next_test;
  if (element("fp-next-message").textContent !== message) element("fp-next-message").textContent = message;
  roomForm.hidden = !roomFormOpen || simulation;
  roomStep.setAttribute("aria-expanded", String(!roomForm.hidden));
  root.querySelector('[data-action="open_advisor"]').disabled = !roomCount || allFloors;
  root.querySelector('[data-action="preview_walk"]').hidden = !roomCount || Boolean(sensorCount) || allFloors;
  root.querySelector('[data-action="repeat_test"]').hidden = !roomCount || !sensorCount || !reviewedCoverage || allFloors;
  element("fp-add-room").hidden = !roomCount || allFloors;
  testStep.textContent = copy[simulation ? "flow_test_exit" : "flow_test"];
}
function focusNext() {
  const next = element("fp-next").querySelector(".fp-primary:not([hidden])") ?? toolbox.querySelector("summary");
  if (compactLibrary.matches) next.scrollIntoView({ block: "nearest" });
  next.focus({ preventScroll: true });
}
function haDevice(id) {
  return integration?.device(id);
}
function visibleSensors(floorPlan) {
  return integration ? floorPlan.sensors.filter((sensor) => haDevice(sensor.haDevice)) : floorPlan.sensors;
}
function planForDrawing(floorPlan) {
  return floorPlan === plan ? planWithOpenDoors(visiblePlan(floorPlan), heldDoors) : visiblePlan(floorPlan);
}
function walkSightNow(placed2 = null) {
  const people = walkersOnFloor().filter(([name]) => name !== placed2?.name).map(([, walker]) => walker.person);
  if (placed2) people.push(placed2.person);
  const held = simulation ? doorsHeldOpen(plan, people) : /* @__PURE__ */ new Set();
  const key = [...held].sort().join(" ");
  if (walkSight?.plan !== plan || walkSight.key !== key) {
    const changed = [...heldDoors].sort().join(" ") !== key;
    heldDoors = held;
    walkSight = Object.assign(prepareSight(plan, held), { plan, key });
    if (changed && !heldDoorPaint) {
      heldDoorPaint = true;
      queueMicrotask(() => {
        heldDoorPaint = false;
        renderDrawing();
      });
    }
  }
  return walkSight;
}
function toggleDoor(door) {
  remember();
  if (door.closed) delete door.closed;
  else door.closed = true;
  finish();
  if (!simulation) return;
  for (const [, walker] of walkersOnFloor()) {
    walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
  }
  readingKey = null;
  renderPerson();
}
function haPlacements(except = null) {
  return new Map(projectFloors().flatMap((floor) => floor.plan.sensors.filter((item) => item.haDevice && item.id !== except).map((item) => [
    haDevice(item.haDevice)?.id ?? item.haDevice,
    roomForDevice(floor.plan.rooms, item)?.name || floorLabel(floor, copy)
  ])));
}
function sensorName(item) {
  return haDevice(item.haDevice)?.name ?? devices[item.model].name;
}
function renderHaCatalog() {
  const picked = integration.picker;
  const placements = haPlacements();
  const query = element("fp-search").value.trim().toLocaleLowerCase(root.dataset.locale);
  const registered = integration.devices();
  const room = roomById(catalogRoomId);
  const available = devicesForRoomArea(registered, room, catalogAreaOnly);
  const matching = available.filter((device) => [device.name, device.product, device.radarModel].some((term) => term?.toLocaleLowerCase(root.dataset.locale).includes(query)));
  const status = element("fp-search-empty");
  status.textContent = !registered.length ? integration.deviceError() ? picked.error : picked.empty : catalogAreaOnly && room?.haAreaId && !available.length ? picked.noAreaDevices : !matching.length ? picked.noResults : matching.every((device) => placements.has(device.id)) && !query ? picked.allPlaced : "";
  status.hidden = !status.textContent;
  element("fp-search").hidden = !registered.length;
  element("fp-library-context").hidden = !registered.length;
  const area = room?.haAreaId ? homeAssistantAreaName(room.haAreaId) : "";
  const areaFilter = room?.haAreaId ? `<div class="fp-ha-area-filter">
        <span>${escapeText(picked.showingArea.replace("{area}", area))}</span>
        <button type="button" data-action="toggle_area_filter">${escapeText(catalogAreaOnly ? picked.showAll : picked.showAreaOnly)}</button>
    </div>` : "";
  element("fp-catalog").innerHTML = areaFilter + [false, true].map((placed2) => {
    const group = matching.filter((device) => placements.has(device.id) === placed2);
    if (!group.length) return "";
    return `<div class="fp-device-group"><p>${placed2 ? picked.placed : picked.free}</p>${group.map((device) => {
      const details = [
        device.product !== device.name ? device.product : "",
        !catalogAreaOnly && device.areaId ? homeAssistantAreaName(device.areaId) : "",
        placed2 ? placements.get(device.id) : device.online === false ? picked.offline : ""
      ].filter(Boolean).join(" · ");
      return `<button type="button" data-ha-device="${escapeText(device.id)}" ${placed2 ? "disabled" : ""}>
                <span class="fp-device-icon ${device.mount}">${deviceIcon(device.mount)}</span>
                <span>${escapeText(device.name)}${details ? `<small>${escapeText(details)}</small>` : ""}</span>
                <span class="fp-add" aria-hidden="true">${placed2 ? "✓" : "+"}</span></button>`;
    }).join("")}</div>`;
  }).join("");
}
function renderCatalog() {
  if (integration) {
    renderHaCatalog();
    return;
  }
  element("fp-catalog").innerHTML = ["ceiling", "wall"].map((mount) => `
        <div class="fp-device-group">
            <p><span class="fp-dot ${mount}"></span>${copy[mount + "_mount"]}</p>
            ${Object.entries(devices).filter(([, device]) => device.mount === mount).map(([model, device]) => `
                <button type="button" data-model="${model}" aria-pressed="false">
                    <span class="fp-device-icon ${mount}">${device.image ? `<img src="${integration?.asset(device.image) ?? device.image}" alt="" width="34" height="27" loading="lazy">` : deviceIcon(mount)}</span><span>${device.name}${device.coming ? ` <small>${model === "wallsense" ? copy.planning_only : copy.planning}</small>` : ""}</span><span class="fp-add" aria-hidden="true">+</span>
                </button>`).join("")}
        </div>`).join("");
}
function renderFurnitureCatalog() {
  const query = element("fp-furniture-search").value.trim().toLocaleLowerCase(root.dataset.locale);
  const category2 = element("fp-furniture-category").value;
  element("fp-furniture-catalog").innerHTML = Object.entries(furnitureCatalog).filter(
    ([kind, model]) => (!category2 || model.category === category2) && copy.furniture_items[kind].toLocaleLowerCase(root.dataset.locale).includes(query)
  ).map(([kind, model]) => {
    const shape = furniturePartsForPreview(kind);
    return `<button type="button" data-furniture="${kind}">
            <svg viewBox="-1.6 -1.2 3.2 2.4" aria-hidden="true">${shape}</svg>
            <span><strong>${copy.furniture_items[kind]}</strong><small>${[model.width, model.depth, model.height].map((value) => number3.format(value)).join(" × ")} m</small></span>
        </button>`;
  }).join("") || `<p class="fp-note" role="status">${copy.furniture_no_match}</p>`;
}
function furniturePartsForPreview(kind) {
  const item = furnitureAt(kind, "", { x: 0, y: 0 });
  return paintFurniture(item, false, false);
}
function openFurnitureLibrary(button) {
  furnitureOpener = button;
  element("fp-furniture-search").value = "";
  element("fp-furniture-category").value = "";
  renderFurnitureCatalog();
  furnitureDialog.showModal();
  const initial = matchMedia("(max-width: 760px)").matches ? furnitureDialog.querySelector('[data-action="close_furniture"]') : element("fp-furniture-search");
  initial.focus();
}
function startFurniturePlacement(next, kind = null) {
  if (!plan.rooms.length) {
    setView("2d");
    setTool("room");
    element("fp-hint").textContent = copy.furniture_need_room;
    board.focus({ preventScroll: true });
    return;
  }
  setTool(next, kind);
  if (view === "2d") board.focus({ preventScroll: true });
  else element("fp-space-place-center").focus({ preventScroll: true });
  if (matchMedia("(max-width: 760px)").matches) {
    (view === "2d" ? canvas : space).scrollIntoView({ block: "center" });
  }
}
function radarLabel(item, radar = item.radar) {
  if (radar === "none") return copy.no_radar;
  if (radar === "ld2460" && devices[item.model].mount === "wall") return copy.wall_upgrade;
  return radarNames[radar];
}
function scd41Label(item) {
  const standard = ["ceilsense-pro", "ultimatesensor-v2", "ultimatesensor-mini-v2", "wallsense"].includes(item.model);
  return standard ? copy.sensor_scd41_standard : item.model === "ceilsense-v2" ? copy[item.climate ? "sensor_scd41_added" : "sensor_scd41_optional"] : item.model === "ceilsense-mini" ? copy.sensor_scd41_absent : copy.sensor_unknown;
}
function sensorOptions(item) {
  if (integration) {
    const device = haDevice(item.haDevice);
    const status = device?.online === false ? ` · ${integration.picker.offline}` : "";
    const binding = device ? device.name + status : item.haDevice ? integration.picker.missing : integration.picker.unlinked;
    return `<dl class="fp-sensor-options"><div><dt>Home Assistant</dt><dd>${escapeText(binding)}</dd></div>
            <div><dt>mmWave</dt><dd>${escapeText(device?.radarModel?.toUpperCase() ?? integration.picker.unknown)}</dd></div>
            <div><dt>${escapeText(copy.sensor_mount_label)}</dt><dd>${escapeText(copy.installations[installationFor(item)])}</dd></div></dl>`;
  }
  const rows = [
    ["mmWave", devices[item.model].defaultRadar ? radarLabel(item) : copy.sensor_unknown],
    ["SCD41 (CO₂)", scd41Label(item)],
    [copy.sensor_mount_label, copy.installations[installationFor(item)]]
  ];
  if (item.model === "ceilsense-pro") rows.push([copy.sensor_smoke_label, copy.sensor_smoke_optical]);
  if (["ceilsense-pro", "ultimatesensor-v2"].includes(item.model)) rows.push([copy.sensor_audio_label, copy.sensor_audio_voice]);
  if (hasMotionSensor(item.model) && copy.sensor_pir_range) rows.push(["PIR", copy.sensor_pir_range]);
  return `<dl class="fp-sensor-options">${rows.map(([label, value]) => `<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join("")}</dl>`;
}
function sensorEditValues(model, previous) {
  const radars = radarsFor(model);
  const mounts = installationsFor(model);
  return {
    model,
    radar: radars.includes(previous.radar) ? previous.radar : devices[model].defaultRadar ?? radars[0],
    installation: mounts.includes(previous.installation) ? previous.installation : mounts[0],
    climate: previous.climate ?? false,
    mountHeight: previous.mountHeight ?? 1.4,
    level: previous.level ?? false,
    // The direction of a sensor that stands free, and how far one on a bracket is turned from the wall.
    angle: previous.angle ?? 0,
    pan: previous.pan ?? 0,
    tilt: previous.tilt ?? 0
  };
}
function readSensorEdit(model = sensorEditForm.elements.model.value) {
  const { radar, installation, climate, mountHeight, level, aim, tilt } = sensorEditForm.elements;
  const values = {
    model,
    radar: integration ? editingSensor.radar : radar.value,
    installation: installation.value,
    climate: climate.checked,
    mountHeight: mountHeight.valueAsNumber,
    level: level.checked,
    ...editingSensor.aim
  };
  if (aim && !aim.disabled && Number.isFinite(aim.valueAsNumber)) values[editingSensor.aimed] = aim.valueAsNumber;
  if (tilt && !tilt.disabled && Number.isFinite(tilt.valueAsNumber)) values.tilt = tilt.valueAsNumber;
  return values;
}
function updateSensorEditNote(item, values, error = "") {
  const note = element("fp-sensor-edit-placement");
  const snaps = isWallMounted(values) && installationFor(item) !== values.installation;
  note.textContent = error || (snaps ? copy.sensor_edit_snaps : "");
  note.hidden = !note.textContent;
  note.classList.toggle("fp-warning", Boolean(error));
}
function renderSensorEdit(item, values) {
  const fields = sensorEditForm.elements;
  const device = devices[values.model];
  fields.model.value = values.model;
  fields.radar.innerHTML = options(radarsFor(values.model), values.radar, (radar) => device.defaultRadar ? radarLabel(values, radar) : copy.sensor_unknown);
  fields.installation.innerHTML = options(installationsFor(values.model), values.installation, (mount) => copy.installations[mount]);
  fields.mountHeight.value = values.mountHeight;
  fields.climate.checked = values.climate;
  fields.level.checked = values.level;
  const wall2 = device.mount === "wall";
  const room = roomForDevice(plan.rooms, item);
  element("fp-sensor-edit-height").hidden = fields.mountHeight.disabled = !wall2;
  if (sensorAim) {
    const aims = canAimSensor(values);
    const onBracket = isWallMounted(values);
    editingSensor.aim = { angle: values.angle, pan: values.pan, tilt: values.tilt };
    editingSensor.aimed = onBracket ? "pan" : "angle";
    sensorAim.box.hidden = !aims;
    sensorEdit.classList.toggle("fp-sensor-edit-aims", aims);
    const limits = onBracket ? { min: -sensorPan, max: sensorPan } : { min: 0, max: 359 };
    for (const control of [sensorAim.turn.input, sensorAim.turn.slider]) Object.assign(control, limits, { value: Math.round(onBracket ? values.pan : values.angle) });
    for (const control of [sensorAim.tilt.input, sensorAim.tilt.slider]) control.value = values.tilt;
    for (const { input, slider } of [sensorAim.turn, sensorAim.tilt]) input.disabled = slider.disabled = !aims;
  }
  element("fp-sensor-edit-scd41").hidden = fields.climate.disabled = Boolean(integration) || values.model !== "ceilsense-v2";
  element("fp-sensor-edit-level").hidden = fields.level.disabled = wall2 || !room?.ceiling;
  const image = element("fp-sensor-edit-image");
  image.hidden = !device.image;
  if (device.image) image.src = integration?.asset(device.image) ?? device.image;
  else image.removeAttribute("src");
  const features = element("fp-sensor-edit-features");
  features.textContent = integration ? haDevice(fields.haDevice.value)?.radarModel?.toUpperCase() ?? integration.picker.unknown : [
    device.coming && copy.planning_only,
    values.model !== "ceilsense-v2" && `SCD41 (CO₂) · ${scd41Label(values)}`,
    values.model === "ceilsense-pro" && copy.sensor_smoke_label
  ].filter(Boolean).join(" · ");
  features.hidden = !features.textContent;
  updateSensorEditNote(item, values);
  paintSensorAim();
}
function paintSensorAim() {
  const item = plan.sensors.find((item2) => item2.id === editingSensor?.id);
  if (!sensorAim) return;
  sensorAim.preview = null;
  if (sensorAim.box.hidden || !item) return;
  const values = readSensorEdit();
  if (!(values.mountHeight >= 0.15 && values.mountHeight <= 6)) values.mountHeight = item.mountHeight ?? 1.4;
  const room = roomForDevice(plan.rooms, item);
  const preview = replacementSensor(item, values, room) ?? { ...item, model: values.model, radar: values.radar, mountHeight: values.mountHeight, tilt: values.tilt };
  const home = roomForDevice(plan.rooms, preview) ?? room;
  const radars = home ? radarFields(home, preview) : [];
  const motion = home && copy.pir_note ? motionField(preview) : null;
  const fields = motion ? [...radars, motion] : radars;
  const onBracket = isWallMounted(preview);
  const side = aimSideView({ room: home, item: preview, fields, onWall: onBracket });
  for (const [{ drawing: drawing2 }, view2] of [[sensorAim.turn, aimTopView({ room: home, item: preview, fields })], [sensorAim.tilt, side]]) {
    drawing2.setAttribute("viewBox", view2.viewBox);
    drawing2.innerHTML = view2.markup;
  }
  sensorAim.turn.words.textContent = turnText(copy, onBracket ? preview.pan ?? 0 : preview.angle, onBracket);
  sensorAim.tilt.words.textContent = tiltText(copy, preview.tilt ?? 0);
  const metres2 = (value) => number3.format(Number(value.toFixed(1)));
  sensorAim.note.textContent = radars.length ? reachText(copy, side.reach, metres2) : "";
  sensorAim.note.hidden = !sensorAim.note.textContent;
  sensorAim.lens.textContent = motion ? [copy.aim_motion?.replace(":to", metres2(motionReach(home, preview, motion))), copy.pir_note].filter(Boolean).join(" ") : "";
  sensorAim.lens.hidden = !sensorAim.lens.textContent;
  sensorAim.preview = { item: preview, room: home, onBracket };
}
function openSensorEdit(id) {
  const index = plan.sensors.findIndex((item2) => item2.id === id);
  if (index < 0 || sensorEdit.open || tool !== "edit" || allFloors || liveMode) return;
  closeSensorTip();
  stopAutoWalk();
  walkControls.stop();
  if (simulation || view === "3d") chooseBeamForMarker(activeSensorMarker(id));
  const item = plan.sensors[index];
  const room = roomForDevice(plan.rooms, item);
  editingSensor = { id, model: item.model, radar: item.radar, drafts: /* @__PURE__ */ new Map() };
  const models = integration ? [item.model] : Object.keys(devices).filter((model) => devices[model].defaultRadar || model === item.model);
  sensorEditForm.elements.model.innerHTML = options(models, item.model, (model) => devices[model].name);
  element("fp-sensor-edit-context").textContent = [String(index + 1).padStart(2, "0"), room?.name].filter(Boolean).join(" · ");
  const values = sensorEditValues(item.model, {
    ...item,
    installation: installationFor(item),
    level: Boolean(room?.ceiling && item.levelMountRoom === room.id)
  });
  if (integration) {
    const select = sensorEditForm.elements.haDevice;
    const current = haDevice(item.haDevice);
    const placed2 = haPlacements(item.id);
    const choices = devicesForRoomArea(integration.devices(), room, Boolean(room?.haAreaId)).filter((device) => device.mount === devices[item.model].mount && device.id !== current?.id && !placed2.has(device.id));
    select.replaceChildren(
      new Option(item.haDevice ? current?.name ?? integration.picker.missing : integration.picker.choose, item.haDevice ?? ""),
      ...choices.map((device) => new Option(device.name, device.id))
    );
    select.required = true;
    select.value = item.haDevice ?? "";
  }
  renderSensorEdit(item, values);
  sensorEdit.showModal();
  if (integration) sensorEditForm.elements.haDevice.focus();
}
function replacementSensor(item, values, room) {
  let next = { ...item, model: values.model, radar: values.radar };
  if (item.installation !== void 0 || item.model !== values.model || installationFor(item) !== values.installation) {
    next.installation = values.installation;
  }
  if (values.model === "ceilsense-v2" && (values.climate || item.climate !== void 0)) next.climate = values.climate;
  else delete next.climate;
  if (devices[next.model].mount === "wall" && (item.mountHeight !== void 0 || values.mountHeight !== 1.4)) {
    next.mountHeight = values.mountHeight;
  } else delete next.mountHeight;
  if (devices[next.model].mount === "ceiling" && values.level && room?.ceiling) next.levelMountRoom = room.id;
  else if (item.levelMountRoom !== null) delete next.levelMountRoom;
  const turnedBefore = item.pan ?? 0;
  delete next.tilt;
  delete next.pan;
  if (sensorAim && canAimSensor(next)) {
    if (values.tilt) next.tilt = values.tilt;
    if (isWallMounted(next)) {
      if (values.pan) next.pan = values.pan;
    } else if (Number.isFinite(values.angle)) next.angle = (values.angle % 360 + 360) % 360;
  } else if (!sensorAim) {
    if (item.tilt !== void 0) next.tilt = item.tilt;
    if (item.pan !== void 0) next.pan = item.pan;
  }
  if (isWallMounted(next) && (installationFor(next) !== installationFor(item) || (next.pan ?? 0) !== turnedBefore)) {
    if (!room) return null;
    next = alignSensorToWall(next, room);
  }
  if (room && !isWallMounted(next) && roomForDevice(plan.rooms, next)?.id !== room.id) {
    const point3 = roomInteriorPoint(room);
    const distance4 = Math.hypot(point3.x - next.x, point3.y - next.y);
    const inward2 = Math.min(1, 0.16 / (distance4 || 1));
    next.x += (point3.x - next.x) * inward2;
    next.y += (point3.y - next.y) * inward2;
  }
  return next;
}
function activeSensorMarker(id) {
  return (view === "3d" ? space : drawing).querySelector(`[data-sensor-marker][data-item="${CSS.escape(id)}"]`);
}
function closeSensorTip() {
  clearTimeout(sensorTipTimer);
  if (!inspectedMarker) return false;
  activeSensorMarker(inspectedMarker.id)?.removeAttribute("aria-describedby");
  inspectedMarker = null;
  sensorTip.hidden = true;
  return true;
}
function refreshSensorTip() {
  if (!inspectedMarker) return;
  const { id } = inspectedMarker;
  const sensors = visibleSensors(plan);
  const index = sensors.findIndex((item2) => item2.id === id);
  const marker = activeSensorMarker(id);
  if (index < 0 || !marker || tool !== "edit" || allFloors) {
    closeSensorTip();
    return;
  }
  const item = sensors[index];
  const room = roomForDevice(plan.rooms, item);
  const heading = `<strong>${String(index + 1).padStart(2, "0")} · ${escapeText(sensorName(item))}</strong>`;
  const html = heading + (room ? `<p>${escapeText(room.name)}</p>` : "") + sensorOptions(item);
  if (sensorTip.innerHTML !== html) sensorTip.innerHTML = html;
  const anchor = marker.querySelector(view === "3d" ? "circle" : ".fp-sensor-halo").getBoundingClientRect();
  const bounds = stage.getBoundingClientRect();
  if (anchor.right < bounds.left || anchor.left > bounds.right || anchor.bottom < bounds.top || anchor.top > bounds.bottom) {
    closeSensorTip();
    return;
  }
  sensorTip.hidden = false;
  marker.setAttribute("aria-describedby", sensorTip.id);
  const { offsetWidth: width, offsetHeight: height } = sensorTip;
  const margin2 = 8;
  let x = anchor.right - bounds.left + margin2;
  let y = anchor.top - bounds.top - margin2;
  if (x + width > bounds.width - margin2) x = anchor.left - bounds.left - width - margin2;
  if (x < margin2) {
    x = (anchor.left + anchor.right) / 2 - bounds.left - width / 2;
    y = anchor.bottom - bounds.top + margin2;
    if (y + height > bounds.height - margin2) y = anchor.top - bounds.top - height - margin2;
  }
  sensorTip.style.left = `${Math.max(margin2, Math.min(x, bounds.width - width - margin2))}px`;
  sensorTip.style.top = `${Math.max(margin2, Math.min(y, bounds.height - height - margin2))}px`;
}
function showSensorTip(id, source) {
  if (!id || tool !== "edit" || allFloors || sensorEdit.open) return;
  if (inspectedMarker?.id !== id) closeSensorTip();
  clearTimeout(sensorTipTimer);
  if (inspectedMarker?.id !== id || source !== "hover") inspectedMarker = { id, source };
  refreshSensorTip();
}
function replaceMapMarkup(layer, markup) {
  const focused = document.activeElement;
  const restore = focused?.hasAttribute("data-sensor-marker") && layer.contains(focused) ? focused.dataset.item : null;
  layer.innerHTML = markup;
  if (tool !== "edit") layer.querySelectorAll("[data-sensor-marker]").forEach((marker) => marker.setAttribute("tabindex", "-1"));
  if (restore) activeSensorMarker(restore)?.focus({ preventScroll: true });
  refreshSensorTip();
}
function renderLists() {
  const displayed = visibleSensors(plan);
  const numbers = new Map(displayed.map((sensor, index) => [sensor.id, String(index + 1).padStart(2, "0")]));
  element("fp-count").textContent = displayed.length;
  element("fp-placements").closest(".fp-sensors").hidden = !plan.sensors.length;
  element("fp-furniture-items").closest(".fp-furniture-panel").hidden = !plan.furniture.length;
  const orderCount = projectFloors().reduce((total, floor) => total + floor.plan.sensors.length, 0);
  element("fp-order-count").textContent = orderCount;
  element("fp-open-order").toggleAttribute("data-empty", !orderCount);
  element("fp-object-count").textContent = plan.rooms.length;
  const placementList = element("fp-placements");
  const savedExpanded = placementList.querySelector("details")?.open;
  const placementRow = (item) => {
    const room = roomForDevice(plan.rooms, item);
    const device = haDevice(item.haDevice);
    const detail = !integration ? radarLabel(item) : device ? device.radarModel?.toUpperCase() ?? integration.picker.unknown : item.haDevice ? integration.picker.missing : integration.picker.unlinked;
    return `
        <button type="button" class="fp-placed" data-select="${item.id}" aria-pressed="${selected === item.id}">
            <span class="fp-index ${devices[item.model].mount}">${numbers.get(item.id) ?? "-"}</span>
            <span><strong>${escapeText(sensorName(item))}</strong><small>${escapeText(detail)}${room ? " · " + escapeText(room.name) : ""}</small></span>
        </button>`;
  };
  const saved = plan.sensors.filter((item) => !numbers.has(item.id));
  placementList.innerHTML = (displayed.map(placementRow).join("") || `<p class="fp-note">${copy.empty_placements}</p>`) + (saved.length ? `<details class="fp-saved-placements" ${savedExpanded ? "open" : ""}>
            <summary>${escapeText(integration.picker.savedPositions)} (${saved.length})</summary>${saved.map(placementRow).join("")}</details>` : "");
  element("fp-objects").innerHTML = plan.rooms.map((room) => `
        <button type="button" class="fp-room-row" data-select="${room.id}" aria-pressed="${selected === room.id}">
            <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="4" width="12" height="12" rx="1"/><path d="M9 4v5h7"/></svg>
            <span>${escapeText(room.name)}</span><small>${number3.format(roomArea(room))} m²</small>
        </button>`).join("") || `<p class="fp-note">${copy.empty_rooms}</p>`;
  const structure = [
    ...plan.walls.map((item, index) => [item, `${copy.wall} ${index + 1}`]),
    ...plan.doors.map((item, index) => [item, `${copy.door} ${index + 1}`]),
    ...(plan.windows ?? []).map((item, index) => [item, `${copy.window} ${index + 1}`]),
    ...(plan.mirrors ?? []).map((item, index) => [item, `${copy.mirror} ${index + 1}`]),
    ...(plan.zones ?? []).map((item) => [item, item.name])
  ];
  element("fp-structure").hidden = !structure.length;
  element("fp-structure-count").textContent = structure.length;
  element("fp-structure-items").innerHTML = structure.map(([item, name]) => `<button type="button" data-select="${item.id}" aria-pressed="${selected === item.id}">${escapeText(name)}</button>`).join("");
  renderFurnitureList();
}
function renderFurnitureList() {
  element("fp-furniture-count").textContent = plan.furniture.length;
  element("fp-furniture-items").innerHTML = plan.furniture.map((item) => {
    const room = plan.rooms.find((room2) => contains(room2, item));
    return `<button type="button" class="fp-furniture-row" data-select="${item.id}" aria-pressed="${selected === item.id}">
            <strong>${escapeText(item.name)}</strong><small>${room ? escapeText(room.name) + " · " : ""}${number3.format(item.width)} × ${number3.format(item.depth)} m</small>
        </button>`;
  }).join("") || `<p class="fp-note">${copy.furniture_empty}</p>`;
}
function reflectionDepth(mirror2) {
  const room = plan.rooms.find((room2) => room2.id === mirror2.roomId);
  if (!room) return 2;
  const turn = mirror2.angle * Math.PI / 180;
  const middle = { x: mirror2.x + Math.cos(turn) * mirror2.width / 2, y: mirror2.y + Math.sin(turn) * mirror2.width / 2 };
  const across = (side) => {
    const [x, y] = roomRayEnd(room, middle, { x: middle.x - Math.sin(turn) * side * 80, y: middle.y + Math.cos(turn) * side * 80 });
    return Math.hypot(x - middle.x, y - middle.y);
  };
  return Math.max(0.25, Math.min(6, Math.round(Math.max(across(1), across(-1)) * 20) / 20));
}
function paintMirrorWedges() {
  const protection = integration?.mirrorProtection?.(planForDrawing(plan));
  return protection ? protection.wedges.map(({ mirrorId, sensorId, points }) => `<polygon class="fp-mirror-wedge${mirrorId === selected ? " selected" : ""}" data-mirror="${mirrorId}" data-sensor="${sensorId}"
            points="${points.map((point3) => point3.join(",")).join(" ")}"/>`).join("") : "";
}
function mirrorSettings(item) {
  if (!integration) return `<p class="fp-note">${copy.mirror_note}</p>`;
  const [label, depth, note, unseen, crowded] = mirrorReflectionCopy[document.documentElement.lang?.split("-")[0]] ?? mirrorReflectionCopy.en;
  const depthField = field({ reflectionDepthM: item.reflectionDepthM ?? 2 }, "reflectionDepthM", depth, 0.25, 6, "any");
  const protection = item.protectionEnabled ? integration.mirrorProtection?.(plan) : null;
  const own = protection?.wedges.filter((wedge) => wedge.mirrorId === item.id) ?? [];
  const warning = !protection ? "" : !own.length ? unseen : own.some((wedge) => protection.crowded.includes(wedge.sensorId)) ? crowded : "";
  return `<label class="fp-climate-field"><input type="checkbox" data-field="protectionEnabled" ${item.protectionEnabled ? "checked" : ""}> ${label}</label>
        ${item.protectionEnabled ? depthField : ""}
        <p class="fp-note">${item.protectionEnabled ? note : copy.mirror_note}</p>
        ${warning ? `<p class="fp-note fp-warning">${escapeText(warning)}</p>` : ""}`;
}
function ceilingTypeField(ceiling2) {
  return `<label>${copy.ceiling_type}<select data-field="ceilingType">${options(
    ceilingTypes,
    ceiling2?.type ?? "flat",
    (type) => copy["ceiling_" + type]
  )}</select></label>`;
}
function focusCeilingType() {
  const field2 = element("fp-inspector").querySelector('[data-field="ceilingType"]');
  const details = field2.closest("details");
  if (details) details.open = true;
  field2.focus({ preventScroll: true });
}
function roomFinishFields(room) {
  const choice2 = (key, values, label, prefix) => `<label>${label}<select data-field="${key}">
        <option value="" ${room[key] ? "" : "selected"}>${copy.finish_automatic}</option>
        ${values.map((value) => `<option value="${value}" ${room[key] === value ? "selected" : ""}>${copy[prefix + value]}</option>`).join("")}</select></label>`;
  return `<div class="fp-fields">${choice2("floorFinish", floorFinishes, copy.room_floor_finish, "floor_finish_")}${choice2("wallColor", wallColors, copy.room_wall_color, "wall_color_")}</div>`;
}
function roomCeilingFields(room) {
  const ceiling2 = room.ceiling;
  const height = ceiling2 ? `<div class="fp-fields">
        ${heightField("height", ceiling2.type === "gable" ? copy.ceiling_eave : copy.ceiling_low, room.height)}
        ${heightField("ceilingHigh", ceiling2.type === "gable" ? copy.ceiling_ridge : copy.ceiling_high, ceiling2.high)}
    </div>` : heightField("height", copy.height, room.height);
  const axes2 = ceiling2?.type === "gable";
  const directions2 = axes2 ? ["x+", "y+"] : ceilingDirections;
  const direction2 = ceiling2 ? `<label>${axes2 ? copy.ceiling_axis : copy.ceiling_direction}
        <select data-field="ceilingDirection">${options(directions2, ceiling2.direction, (value) => axes2 ? copy["ceiling_axis_" + value[0]] : copy["ceiling_" + value[0] + (value.endsWith("+") ? "_plus" : "_minus")])}</select></label>` : "";
  return `<fieldset class="fp-ceiling-settings"><legend>${copy.ceiling_section}</legend>
        ${height}${direction2}<div id="fp-ceiling-profile"></div>
        ${ceiling2 ? `<p class="fp-note fp-ceiling-note">${copy.ceiling_room_note}</p>` : ""}
    </fieldset>`;
}
function crossSection2(room, item = null) {
  const profile2 = ceilingProfile(room);
  const maxHeight = room.ceiling?.high ?? room.height;
  const span = room.ceiling?.direction.startsWith("x") === false ? room.depth : room.width;
  const scale3 = Math.min(194 / span, 61 / maxHeight);
  const left = (220 - span * scale3) / 2;
  const floor = 79;
  const coordinates2 = (position, height) => [left + position * span * scale3, floor - height * scale3];
  const sides = room.ceiling.direction.startsWith("x") ? [copy.ceiling_left, copy.ceiling_right] : [copy.ceiling_top, copy.ceiling_bottom];
  const outline = profile2.map(([position, height]) => coordinates2(position, height).join(",")).join(" ");
  let marker = "";
  if (item) {
    const position = ceilingPosition(room, item);
    const [x, y] = coordinates2(position, ceilingHeightAt(room, item));
    const ascending = room.ceiling.type === "gable" ? position < 0.5 : room.ceiling.direction.endsWith("+");
    const vertical = item.levelMountRoom === room.id;
    const ridge = room.ceiling.type === "gable" && Math.abs(position - 0.5) < 1e-6;
    const pitch = vertical ? 0 : ceilingPitch(room) * Math.PI / 180 * (ascending ? 1 : -1);
    const direction2 = vertical || !ridge ? `<path class="fp-cross-direction" d="M${x} ${y}l${12 * Math.sin(pitch)} ${12 * Math.cos(pitch)}"/>` : "";
    marker = `<path class="fp-cross-height" d="M${x} ${floor}V${y}"/>
            <circle class="fp-cross-marker" cx="${x}" cy="${y}" r="3"/>${direction2}`;
  }
  return `<figure class="fp-cross-section">
        <svg viewBox="0 0 220 91" aria-hidden="true">
            <path class="fp-cross-wall" d="M${left} ${floor}V${coordinates2(...profile2[0])[1]} M${220 - left} ${floor}V${coordinates2(...profile2.at(-1))[1]}"/>
            <path class="fp-cross-floor" d="M${left - 7} ${floor}H${227 - left}"/>
            <polyline class="fp-cross-roof" points="${outline}"/>${marker}
        </svg>
        <div class="fp-cross-sides"><span>A · ${sides[0]}</span><span>B · ${sides[1]}</span></div>
        <figcaption><span>${copy.ceiling_profile}</span><strong>${copy.ceiling_pitch} ≈${number3.format(Math.round(ceilingPitch(room)))}°</strong></figcaption>
    </figure>`;
}
function sensorNote(item, room) {
  const device = devices[item.model];
  if (!device.defaultRadar && !integration) return copy.no_profile;
  if (item.radar === "none") return "";
  if (!room) return copy.room_note;
  if (device.mount !== "ceiling") return "";
  const status = ceilingCoverageStatus(room, item);
  if (status === "tilted") return copy.ceiling_tilted;
  if (status === "height") {
    const range = ceilingReferenceRange(item.radar);
    const estimated = radarFields(room, item, coverageRadarOptions).some((field2) => field2.estimatedHeight);
    const fill3 = (text2) => text2.replaceAll(":low", number3.format(range[0])).replaceAll(":high", number3.format(range[1]));
    if (estimated && range && copy.height_estimate) return Object.assign(new String(fill3(copy.height_estimate)), { advice: true });
    return [copy.height_note, range && fill3(copy.ceiling_range)].filter(Boolean).join(" ");
  }
  return room.ceiling ? copy.ceiling_local_range : "";
}
function updateSensorDetails(item) {
  element("fp-sensor-config").innerHTML = sensorOptions(item);
  const room = roomForDevice(plan.rooms, item);
  const note = element("fp-placement-note");
  if (note) {
    const text2 = sensorNote(item, room);
    note.textContent = text2;
    note.hidden = !note.textContent;
    note.classList.toggle("fp-warning", !text2?.advice);
  }
  const mount = element("fp-mount");
  if (!mount) return;
  mount.hidden = !room;
  if (!room) return;
  const edit = element("fp-edit-ceiling");
  edit.dataset.selectRoom = room.id;
  edit.title = room.name;
  element("fp-mount-height").textContent = `${number3.format(ceilingHeightAt(room, item))} m`;
  element("fp-mount-level").hidden = !room.ceiling;
  element("fp-mount-level").querySelector("input").checked = item.levelMountRoom === room.id;
  const ridge = room.ceiling?.type === "gable" && Math.abs(ceilingPosition(room, item) - 0.5) < 1e-6;
  element("fp-mount-profile").innerHTML = room.ceiling ? crossSection2(room, item) + (ridge && item.levelMountRoom !== room.id ? `<p class="fp-note">${copy.ceiling_ridge_note}</p>` : "") : "";
}
function roomAutomationLink() {
  if (!automationPanel) return "";
  const picked = integration.picker;
  return `<fieldset class="fp-ha-room-link">
        <legend>${escapeText(picked.automationTitle)}</legend>
        <p>${escapeText(picked.automationNote)}</p>
        <button type="button" data-action="room_automation">${escapeText(picked.automationAction)}</button>
    </fieldset>`;
}
function showRoomAutomation(room, state, message = "") {
  const picked = integration.picker;
  const panel = automationPanel;
  const fill3 = (text2) => text2.replaceAll("{room}", room.name).replaceAll("{area}", state?.areaName ?? "");
  const missing = !state ? "" : !state.presence ? picked.automationNeedsSave : !state.areaId ? picked.automationNeedsArea : !state.lights.length ? fill3(picked.automationNoLights) : "";
  const ready = Boolean(state) && !missing;
  panel.text.textContent = state ? missing || fill3(picked.automationIntro) : "";
  panel.lights.hidden = !ready;
  if (ready) {
    const names = state.lights.slice(0, 6).map((light) => light.name);
    if (state.lights.length > names.length) names.push("+" + number3.format(state.lights.length - names.length));
    panel.lights.textContent = fill3(picked.automationLights).replace("{lights}", names.join(", "));
  }
  panel.minutes.hidden = !ready;
  panel.dark.hidden = !ready || !state.sun;
  panel.save.hidden = !ready;
  panel.save.disabled = false;
  panel.remove.disabled = false;
  panel.save.textContent = state?.saved ? picked.automationUpdate : picked.automationCreate;
  panel.remove.hidden = !ready || !state.saved;
  panel.open.hidden = !ready || !state.saved;
  if (ready) panel.open.href = `/config/automation/edit/${encodeURIComponent(state.id)}`;
  panel.note.textContent = message;
  panel.note.hidden = !message;
  panel.close.textContent = ready && !message ? copy.cancel_place : copy.tool_done ?? copy.cancel_place;
}
async function openRoomAutomation() {
  const room = currentRoom();
  if (!automationPanel || !room) return;
  const picked = integration.picker;
  const panel = automationPanel;
  panel.room = room;
  showRoomAutomation(room, null);
  panel.dialog.showModal();
  try {
    const state = await integration.presenceLights.state(room);
    if (panel.room !== room || !panel.dialog.open) return;
    panel.minutes.querySelector("input").value = state.saved?.minutes ?? 3;
    panel.dark.querySelector("input").checked = state.saved ? state.saved.onlyDark : true;
    showRoomAutomation(room, state);
  } catch {
    showRoomAutomation(room, null, picked.automationError);
  }
}
function homeAssistantRoomLink(room) {
  if (!integration) return "";
  const picked = integration.picker;
  const floors = homeAssistantFloors();
  const areas2 = homeAssistantAreas();
  const used = linkedAreaIds(room);
  const selectedFloor = room.haFloorId ?? "";
  const selectedArea = room.haAreaId ?? "";
  const floorKnown = !selectedFloor || floors.some((floor) => floor.id === selectedFloor);
  const areaKnown = !selectedArea || areas2.some((area) => area.id === selectedArea);
  const floorOptions = [
    `<option value="">${escapeText(picked.notLinked)}</option>`,
    ...!floorKnown ? [`<option value="${escapeText(selectedFloor)}" selected>${escapeText(picked.missingArea.replace("{id}", selectedFloor))}</option>`] : [],
    ...floors.map((floor) => `<option value="${escapeText(floor.id)}" ${floor.id === selectedFloor ? "selected" : ""}>${escapeText(floor.name)}</option>`)
  ].join("");
  const areaOptions = areas2.filter((area) => !selectedFloor || !area.floorId || area.floorId === selectedFloor || area.id === selectedArea);
  const optionsHtml = [
    `<option value="">${escapeText(picked.notLinked)}</option>`,
    ...!areaKnown ? [`<option value="${escapeText(selectedArea)}" selected>${escapeText(picked.missingArea.replace("{id}", selectedArea))}</option>`] : [],
    ...areaOptions.map((area) => {
      const unavailable = used.has(area.id);
      const label = unavailable ? `${area.name} · ${picked.areaAlreadyLinked}` : area.name;
      return `<option value="${escapeText(area.id)}" ${area.id === selectedArea ? "selected" : ""} ${unavailable ? "disabled" : ""}>${escapeText(label)}</option>`;
    })
  ].join("");
  return `<fieldset class="fp-ha-room-link">
        <legend>${escapeText(picked.homeAssistantLink)}</legend>
        <p>${escapeText(picked.homeAssistantLinkNote)}</p>
        <label>${escapeText(picked.homeAssistantFloor)}<select id="fp-room-ha-floor">${floorOptions}</select></label>
        <label>${escapeText(picked.homeAssistantArea)}<select id="fp-room-ha-area">${optionsHtml}</select></label>
    </fieldset>`;
}
function renderInspector() {
  showDoorActions();
  const { type, item } = selectedItem();
  const inspector = element("fp-inspector");
  const title = element("fp-inspector-title");
  title.textContent = type === "rooms" ? item.name : type === "sensors" ? sensorName(item) : ["furniture", "zones"].includes(type) ? item.name : ["windows", "mirrors"].includes(type) ? copy[type === "windows" ? "window" : "mirror"] : copy.selection;
  if (!item) {
    inspector.innerHTML = `<p class="fp-note">${copy.select_hint}</p>`;
    return;
  }
  const isSensor = type === "sensors";
  const canRotate = isSensor && !isWallMounted(item) || type === "doors" || type === "furniture";
  const advancedOpen = inspector.dataset.item === item.id && inspector.querySelector("details.fp-inspector-more")?.open;
  inspector.dataset.item = item.id;
  let settings = "";
  let link = "";
  let roomFloor = "";
  if (type === "rooms") {
    const floors = projectFloors();
    const calibration = integration?.calibrationLabel(item.haRoom);
    roomFloor = floors.length > 1 ? `<label>${copy.floor_move_room}<select id="fp-room-floor">
            ${floors.map((floor) => `<option value="${floor.id}" ${floor.id === building.activeFloor ? "selected" : ""}>${escapeText(floorLabel(floor, copy))}</option>`).join("")}</select></label>` : "";
    settings = `<div id="fp-room-metrics"></div><label>${copy.name}<input data-field="name" maxlength="48" value="${escapeText(item.name)}" required></label>
            ${item.outline ? `<p class="fp-note">${copy.room_outline} · ${number3.format(roomArea(item))} m²</p>` : `<div class="fp-fields">${field(item, "width", copy.width, 0.5, 60, "any")}${field(item, "depth", copy.depth, 0.5, 60, "any")}</div>`}
            ${item.ceiling ? roomCeilingFields(item) : heightField("height", copy.height, item.height)}
            ${roomFinishFields(item)}
            ${calibration ? `<p class="fp-note">${escapeText(calibration)}</p>` : ""}
            ${homeAssistantRoomLink(item)}${roomAutomationLink()}`;
  } else if (type === "walls") {
    settings = `<div class="fp-fields">${field(item, "endX", copy.end_x, -100, 100, "any")}${field(item, "endY", copy.end_y, -100, 100, "any")}</div>`;
  } else if (type === "doors") {
    settings = field(item, "width", copy.width, 0.5, 2, "any");
  } else if (type === "windows" || type === "mirrors") {
    settings = `<div class="fp-fields">${field(item, "width", copy.width, 0.1, 8, "any")}${field(item, "height", copy.object_height, 0.1, 6, "any")}</div>
            ${field(item, "base", copy.furniture_base, 0, 6, "any")}
            ${type === "mirrors" ? mirrorSettings(item) : ""}`;
  } else if (type === "zones") {
    const room = currentRoom();
    const sensors = plan.sensors.filter((sensor) => roomForDevice(plan.rooms, sensor)?.id === room?.id);
    settings = `<p class="fp-note">${copy["zone_" + item.type]} · ${copy.zone_parts.replace(":count", item.parts.length)}</p>
            <label>${copy.name}<input data-field="name" maxlength="48" value="${escapeText(item.name)}" required></label>
            <label>${copy.zone_sensor}<select data-field="sensorId">
                <option value="">${copy.zone_all_sensors}</option>
                ${sensors.map((sensor) => `<option value="${sensor.id}" ${item.sensorId === sensor.id ? "selected" : ""}>
                    ${escapeText(devices[sensor.model].name)} · ${plan.sensors.indexOf(sensor) + 1}</option>`).join("")}
            </select></label>
            ${item.parts.length > 1 ? `<label>${copy.zone_part}<select id="fp-zone-part-index">${item.parts.map((_, i) => `<option value="${i}">${number3.format(i + 1)}</option>`).join("")}</select></label>` : ""}
            ${item.type === "entry" ? `<label>${copy.zone_direction}<select data-field="direction">
                ${options(["left", "right"], item.direction ?? "right", (value) => copy["zone_" + value])}</select></label>` : ""}
            <p class="fp-note">${copy.zone_note}</p>`;
  } else if (type === "furniture") {
    settings = `<label>${copy.name}<input data-field="name" maxlength="48" value="${escapeText(item.name)}" required></label>
            <div class="fp-fields">${field(item, "width", copy.width, 0.02, 12, "any")}${field(item, "depth", copy.depth, 0.02, 12, "any")}
            ${field(item, "height", copy.furniture_height, 0.01, 6, "any")}${field(item, "base", copy.furniture_base, 0, 6, "any")}</div>
            <label>${copy.furniture_material}<select data-field="material">${furnitureMaterials.map((material) => `<option value="${material}" ${material === item.material ? "selected" : ""}>${copy.furniture_materials[material]}</option>`).join("")}</select></label>
            <p class="fp-note">${furnitureCatalog[item.kind]?.category === "motion" ? copy.furniture_motion_note : copy.furniture_material_note}</p>`;
  } else {
    const radars = radarsFor(item.model);
    if (integration) settings = sensorOptions(item);
    if (!integration && radars.length > 1) {
      settings = `<label>${copy.radar}<select data-field="radar">${radars.map((radar) => `<option value="${radar}" ${radar === item.radar ? "selected" : ""}>${radarLabel(item, radar)}</option>`).join("")}</select></label>`;
    }
    if (devices[item.model].mount === "wall") {
      settings += field({ ...item, mountHeight: item.mountHeight ?? 1.4 }, "mountHeight", copy.wall_sensor_height, 0.15, 6, "any");
    }
    if (sensorAim && canAimSensor(item)) {
      if (isWallMounted(item)) settings += field({ ...item, pan: item.pan ?? 0 }, "pan", copy.wall_sensor_pan, -sensorPan, sensorPan, 1);
      settings += field({ ...item, tilt: item.tilt ?? 0 }, "tilt", copy.wall_sensor_tilt, sensorTilt.min, sensorTilt.max, 1);
    }
    if (!integration && item.model === "ceilsense-v2") {
      settings += `<label class="fp-climate-field"><input type="checkbox" data-field="climate" ${item.climate ? "checked" : ""}> ${copy.plan_scd41}</label>`;
    }
    if (!integration) link = item.model === "wallsense" ? `<a class="fp-product" href="${escapeText(root.dataset.wallsenseUrl)}">WallSense ↗</a>` : ["ceilsense-mini", "ceilsense-pro"].includes(item.model) ? `<p class="fp-note">${copy.planning}</p>` : `<a class="fp-product" href="${escapeText(root.dataset.productPrefix)}${item.model}">${copy.product} ↗</a>`;
  }
  const positionFields = ["zones", "windows", "mirrors"].includes(type) ? "" : `<div class="fp-fields">${field(item, "x", "X (m)", -100, 100, "any")}${field(item, "y", "Y (m)", -100, 100, "any")}</div>`;
  const roomMore = `<details class="fp-inspector-more" ${advancedOpen ? "open" : ""}><summary>${copy.room_settings_more}</summary>
        <div>${type === "rooms" ? ceilingTypeField(item.ceiling) : ""}${roomFloor}${positionFields}<div class="fp-inspector-actions">
            <button type="button" data-action="edit_outline">${copy.room_edit_outline}</button>
            <button type="button" data-action="rotate_room">${copy.rotate}</button>
            ${copy.room_delete_confirm ? "" : `<button type="button" data-action="delete">${copy.remove}</button>`}
        </div></div></details>
        ${copy.room_delete_confirm ? `<div class="fp-inspector-actions"><button type="button" class="fp-room-remove" data-action="delete">${copy.room_delete_confirm}</button></div>` : ""}`;
  inspector.innerHTML = `
        ${isSensor ? '<div id="fp-sensor-config"></div>' : ""}
        ${isSensor ? '<div class="fp-range-key" id="fp-range-key"></div>' : ""}
        ${settings}
        ${isSensor ? `<label>${copy.installation}<select data-field="installation">${installationsFor(item.model).map((value) => `<option value="${value}" ${installationFor(item) === value ? "selected" : ""}>${copy.installations[value]}</option>`).join("")}</select></label>
            ${item.model === "wallsense" ? `<p class="fp-note">${copy.wallsense_note}</p>` : ""}
            ${item.installation && ["ultimatesensor-v2", "ultimatesensor-mini-v2"].includes(item.model) ? `<p class="fp-note">${copy.mount_kit_note}</p>` : ""}` : ""}
        ${["rooms", "sensors", "walls"].includes(type) ? `<button type="button" class="fp-touch-move" data-action="move_item">${copy.move_item}</button>` : ""}
        ${type === "rooms" ? roomMore : positionFields}
        ${canRotate ? field(item, "angle", copy.angle, 0, 359, 1) : ""}
        ${isSensor && devices[item.model].mount === "ceiling" ? `<div class="fp-mount" id="fp-mount">
            <p>${copy.ceiling_mount_height} <strong id="fp-mount-height"></strong></p>
            <div id="fp-mount-level"><label><input type="checkbox" data-field="levelMount"> ${copy.ceiling_mount_level}</label>
                <small>${copy.ceiling_mount_hint}</small></div>
            <div id="fp-mount-profile"></div>
            <button type="button" class="fp-mount-edit" id="fp-edit-ceiling">${copy.ceiling_edit} <span aria-hidden="true">→</span></button>
        </div>` : ""}
        ${isSensor ? `<div class="fp-nudge" role="group" aria-label="${copy.nudge_title}">
            <span>${copy.nudge_title}</span>${[["left", "←"], ["up", "↑"], ["down", "↓"], ["right", "→"]].map(([direction2, icon]) => `<button type="button" data-nudge="${direction2}" aria-label="${copy["nudge_" + direction2]}">${icon}</button>`).join("")}</div>
            <p class="fp-note fp-warning" id="fp-placement-note" hidden></p>` : ""}
        ${type === "doors" && copy.door_note ? `<p class="fp-note">${copy.door_note}</p>` : ""}
        ${type === "rooms" ? "" : `<div class="fp-inspector-actions">
            ${type === "doors" && copy.door_close ? `<button type="button" data-action="toggle_door">${item.closed ? copy.door_open : copy.door_close}</button>` : ""}
            ${["doors", "windows", "mirrors"].includes(type) ? `<button type="button" data-action="move_opening">${copy.opening_move}</button>` : ""}
            ${type === "zones" && item.type !== "entry" && item.parts.length < 12 ? `<button type="button" data-action="zone_part">${copy.zone_add_part}</button>` : ""}
            ${type === "zones" ? `<button type="button" data-action="edit_zone_part">${copy.zone_edit_part}</button>` : ""}
            ${type === "zones" && item.parts.length > 1 ? `<button type="button" data-action="remove_zone_part">${copy.zone_remove_part}</button>` : ""}
            ${canRotate ? `<button type="button" data-action="rotate">${copy.rotate}</button>` : ""}
            ${type === "furniture" ? `<button type="button" data-action="move_furniture">${copy.furniture_move}</button>
                <button type="button" data-action="duplicate_furniture">${copy.furniture_duplicate}</button>` : ""}
            <button type="button" data-action="delete">${copy.remove}</button>
        </div>`}
        ${link}`;
  if (isSensor) {
    updateRangeKey(item);
    updateSensorDetails(item);
  }
  if (type === "rooms") {
    renderRoomMetrics(item);
    if (item.ceiling) element("fp-ceiling-profile").innerHTML = crossSection2(item);
  }
}
function renderRoomMetrics(room) {
  const metrics = element("fp-room-metrics");
  if (!metrics) return;
  const objects = roomContents(plan, room);
  const corners = roomCorners(room);
  const perimeter = polygonEdges(corners).reduce((sum, [[ax, ay], [bx, by]]) => sum + Math.hypot(bx - ax, by - ay), 0);
  const counts = [
    [copy.room_corners, room.outline ? corners.length : 0],
    [copy.placements, objects.sensors.length],
    [copy.furniture_short, objects.furniture.length],
    [copy.room_doors, objects.doors.length],
    [copy.room_windows, objects.windows.length],
    [copy.room_mirrors, objects.mirrors.length],
    [copy.room_zones, objects.zones.length]
  ].filter(([, value]) => value);
  metrics.innerHTML = `<div class="fp-room-metric-lead"><strong>${number3.format(roomArea(room))} m²</strong>
        <span>${copy.room_perimeter.replace(":length", number3.format(perimeter))}</span></div>
        ${counts.length ? `<div class="fp-room-metric-grid">${counts.map(([label, value]) => `<span><strong>${value}</strong> ${label}</span>`).join("")}</div>` : ""}`;
}
function filterCatalog() {
  if (integration) {
    renderHaCatalog();
    return;
  }
  const query = element("fp-search").value.trim().toLowerCase();
  let matches = 0;
  library.querySelectorAll(".fp-device-group").forEach((group) => {
    let count = 0;
    group.querySelectorAll("[data-model]").forEach((button) => {
      const model = button.dataset.model;
      const device = devices[model];
      const terms = [device.name, ...radarsFor(model).filter((radar) => radar !== "none").map((radar) => radarNames[radar])];
      const fits = catalogMount === "all" || catalogMount === "ceiling" && device.mount === "ceiling" || catalogMount === "recessed" && button.dataset.model === "wallsense" || catalogMount === "freestanding" && installationsFor(button.dataset.model).includes("freestanding") || catalogMount === "wall" && installationsFor(button.dataset.model).includes("wall-bracket");
      const found = fits && terms.some((term) => term.toLowerCase().includes(query));
      button.hidden = !found;
      count += Number(found);
    });
    group.hidden = count === 0;
    matches += count;
  });
  element("fp-search-empty").hidden = matches > 0;
  library.querySelectorAll("[data-catalog-mount]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.catalogMount === catalogMount));
  });
}
function setLibraryExpanded(expanded) {
  for (const button of root.querySelectorAll('[data-action="library"], [data-action="flow_sensor"], [data-action="next_extra_sensor"]')) {
    button.setAttribute("aria-expanded", String(expanded));
  }
  renderFlow();
}
function openLibrary(opener, position = null) {
  closeLibrary(false);
  libraryPanelWasOpen = root.hasAttribute("data-panel");
  root.setAttribute("data-panel", "");
  libraryOpener = opener;
  quickPlacement = position?.point ?? null;
  catalogRoomId = position?.room?.id ?? placementRoom()?.id ?? null;
  catalogAreaOnly = Boolean(roomById(catalogRoomId)?.haAreaId);
  drawingMenu.open = false;
  const context = element("fp-library-context");
  context.textContent = integration?.picker.prompt ?? (position ? copy.quick_place_room.replace(":room", position.room.name) : copy.catalog_prompt);
  const search = element("fp-search");
  search.value = "";
  catalogMount = "all";
  filterCatalog();
  library.style.removeProperty("left");
  library.style.removeProperty("top");
  const mode = position ? "quick" : compactLibrary.matches ? "sheet" : "dock";
  library.querySelector('[data-action="catalog_advice"]').hidden = Boolean(integration) || mode === "quick" || !plan.rooms.length || allFloors;
  library.dataset.mode = mode;
  library.hidden = false;
  if (mode === "dock") {
    root.setAttribute("data-panel", "");
    library.removeAttribute("popover");
    sidebar.setAttribute("data-library", "");
    setLibraryExpanded(true);
  } else {
    library.setAttribute("popover", "auto");
    library.showPopover();
    if (position) {
      const x = Math.min(position.x + 10, innerWidth - library.offsetWidth - 10);
      const below = position.y + 10;
      const y = below + library.offsetHeight < innerHeight - 12 ? below : position.y - library.offsetHeight - 8;
      library.style.left = `${scrollX + Math.max(10, x)}px`;
      library.style.top = `${scrollY + Math.max(10, y)}px`;
    }
  }
  (mode === "sheet" || search.hidden ? library.querySelector("button") : search).focus({ preventScroll: true });
  if (integration) void integration.refreshDevices().then(() => {
    if (libraryIsOpen()) filterCatalog();
  });
}
function closeLibrary(restore = true) {
  if (!libraryIsOpen()) return;
  if (sidebar.hasAttribute("data-library")) {
    library.hidden = true;
    sidebar.removeAttribute("data-library");
    setLibraryExpanded(false);
  } else library.hidePopover();
  if (restore) (libraryOpener ?? libraryButton).focus({ preventScroll: true });
  libraryOpener = null;
  quickPlacement = null;
  catalogRoomId = null;
  catalogAreaOnly = false;
}
function arrangeProjectControls() {
  const name = element("fp-project-name");
  projectMenu.open = false;
  floorMenu.open = false;
  if (compactLibrary.matches) element("fp-mobile-project-options").append(name);
  else element("fp-project").prepend(name);
}
function updateRangeKey(item) {
  const key = element("fp-range-key");
  if (!key) return;
  const wall2 = devices[item.model].mount === "wall";
  const two = item.radar === "combined" || wall2 && item.radar !== "none";
  key.hidden = !two;
  key.innerHTML = two ? `
        <span><i></i> ${copy.tracking_line} · ${item.radar === "combined" ? "LD6002B" : item.radar.toUpperCase()}</span>
        <span><i></i> ${copy.presence_line} · LD2412</span>
        ${hasMotionSensor(item.model) && copy.sim_motion ? `<span class="fp-range-key-motion"><i></i> ${copy.sim_motion} · PIR</span>` : ""}` : "";
}
function renderHandoff() {
  const room = selectedItem().type === "furniture" ? null : currentRoom();
  const panel = element("fp-handoff");
  panel.hidden = !room || !plan.sensors.some((item) => item.model === "ceilsense-v2" && roomForDevice(plan.rooms, item)?.id === room.id);
  if (panel.hidden) return;
  const target = guidePlanForRoom(plan, room);
  const title = `<h3>${copy.handoff_title}</h3><p class="fp-note">${escapeText(room.name)}</p>`;
  if (target.reason) {
    panel.innerHTML = title + `<p class="fp-note">${copy["handoff_" + target.reason]}</p>` + (target.reason === "ceiling" ? `<a href="${escapeText(root.dataset.productPrefix)}ceilsense-v2">${copy.v2_link} ↗</a>` : "");
    return;
  }
  const url = root.dataset.productPrefix + "ceilsense-v2#" + formatPlannerLink(target);
  panel.innerHTML = title + `
        <p class="fp-note">${target.count} × CeilSense V2 · ${radarNames[target.radar]}</p>
        <a href="${escapeText(url)}">${copy.handoff_action} <span aria-hidden="true">→</span></a>`;
}
function updateSelectionJump() {
  const jump = element("fp-selection-jump");
  const editing = !element("fp-properties").hidden && Boolean(selectedItem().item);
  jump.hidden = simulation || tool !== "edit" || allFloors || !plan.rooms.length;
  jump.setAttribute("aria-controls", editing ? "fp-properties" : "fp-outline");
  element("fp-selection-name").textContent = editing ? copy.edit_selection : copy.plan_outline;
}
function showPanel(name, open = true) {
  root.toggleAttribute("data-panel", open);
  for (const panel of ["outline", "properties"]) {
    const tab = element("fp-tab-" + panel);
    tab.setAttribute("aria-selected", String(name === panel));
    tab.tabIndex = name === panel ? 0 : -1;
    element("fp-" + panel).hidden = name !== panel;
  }
  updateSelectionJump();
}
function showInspectorStart(open = true) {
  closeLibrary(false);
  showPanel("properties", open);
  element("fp-properties").scrollTop = 0;
}
function inspectMapSelection(type, changed) {
  if (type === "rooms") {
    showInspectorStart(root.hasAttribute("data-panel") && !compactLibrary.matches);
  } else if (selected && type !== "sensors" && (changed || !element("fp-outline").hidden)) {
    showInspectorStart();
  }
}
function announcePosition(point3, item = null, prefix = copy.position_status) {
  const room = item ? roomForDevice(plan.rooms, item) : null;
  const height = room && devices[item.model].mount === "ceiling" ? ` · ${copy.ceiling_mount_height} ${number3.format(ceilingHeightAt(room, item))} m` : "";
  element("fp-event").textContent = `${prefix} · X ${number3.format(point3.x)} m · Y ${number3.format(point3.y)} m${height}`;
}
function render() {
  element("fp-name").value = building?.name ?? plan.name;
  renderFloors();
  renderLists();
  renderInspector();
  renderHandoff();
  renderUnderlay();
  updateTools();
  renderDrawing();
}
function renderFloors() {
  const floors = [...projectFloors()].sort((a, b) => a.level - b.level);
  const current = building?.activeFloor ?? floors[0].id;
  const currentName = floorLabel(floors.find((floor) => floor.id === current), copy);
  const options2 = floors.map((floor) => ({
    id: floor.id,
    label: floorLabel(floor, copy),
    level: (floor.level > 0 ? "+" : "") + number3.format(floor.level)
  })).reverse();
  if (floors.length > 1) options2.push({ id: "all", label: copy.floor_all, level: "3D" });
  const choices = element("fp-floor-choices");
  if (choices.childElementCount !== options2.length) {
    const template = element("fp-floor-choice-template").content.firstElementChild;
    choices.replaceChildren(...options2.map(() => template.cloneNode(true)));
  }
  options2.forEach(({ id, label, level }, index) => {
    const button = choices.children[index];
    button.dataset.floorChoice = id;
    button.setAttribute("aria-current", String(id === (allFloors ? "all" : current)));
    const levelLabel = button.querySelector(".fp-floor-level");
    levelLabel.textContent = level;
    levelLabel.setAttribute("aria-hidden", String(id !== "all"));
    button.querySelector(".fp-floor-choice-label").textContent = label;
  });
  element("fp-floor-current").textContent = allFloors ? copy.floor_all : currentName;
  element("fp-floor-rename").hidden = allFloors;
  element("fp-floor-gap").hidden = !allFloors;
  element("fp-floor-name").value = currentName;
  root.querySelector('[data-action="add_upper_floor"]').disabled = floors.length >= maxFloors || floors.at(-1).level >= 20;
  root.querySelector('[data-action="add_lower_floor"]').disabled = floors.length >= maxFloors || floors[0].level <= -5;
  const remove = root.querySelector('[data-action="remove_floor"]');
  remove.disabled = Boolean(plan.underlay || ["rooms", "walls", "doors", "sensors", "furniture", "windows", "mirrors", "zones"].some((key) => plan[key]?.length));
  remove.hidden = allFloors || floors.length < 2 || remove.disabled;
  root.toggleAttribute("data-all-floors", allFloors);
}
function closeFloorMenu() {
  floorMenu.open = false;
  floorTrigger.focus({ preventScroll: true });
}
function showFloor(id, keepOverview = false) {
  closeSensorTip();
  closeLibrary(false);
  reviewedCoverage = false;
  recentUndo = null;
  toolbox.open = false;
  viewMenu.open = false;
  roomFormOpen = false;
  if (floorMenu.open) closeFloorMenu();
  if (id === "all") {
    setView("3d");
    allFloors = true;
    spaceZoom = 1;
    spaceFollow = false;
    render();
    return;
  }
  if (simulation) setSimulation(false);
  allFloors = keepOverview;
  if (building) {
    const project = projectDocument();
    if (!project.floors.some((floor) => floor.id === id)) return;
    project.activeFloor = id;
    readProject(project);
  }
  selected = plan.sensors[0]?.id;
  beamChoice = "";
  underlayMeasure = null;
  spaceZoom = 1;
  setTool("edit");
  showPanel("outline");
  render();
  fit();
  save();
}
function addFloor(direction2) {
  const floors = projectFloors();
  if (floors.length >= maxFloors) return;
  const levels = floors.map((floor) => floor.level);
  const level = direction2 > 0 ? Math.max(...levels) + 1 : Math.min(...levels) - 1;
  if (level < -5 || level > 20) return;
  remember();
  const next = { id: newId(), level, name: null, plan: withEditableFurniture({ ...blankPlan(plan.name), furniture: [] }) };
  building = {
    ...building,
    format: buildingFormat,
    version: 1,
    name: building?.name ?? plan.name,
    floors: [...floors, next],
    activeFloor: next.id
  };
  plan = next.plan;
  showFloor(next.id);
}
function renderUnderlay() {
  const image = element("fp-underlay");
  const controls = element("fp-underlay-controls");
  const underlay = plan.underlay;
  image.toggleAttribute("hidden", !underlay);
  controls.hidden = view !== "2d" || !underlay;
  element("fp-underlay-measure").hidden = !underlay || !underlayMeasure;
  root.toggleAttribute("data-underlay", !controls.hidden);
  if (!underlay) {
    image.removeAttribute("href");
    return;
  }
  if (image.getAttribute("href") !== underlay.data) image.setAttribute("href", underlay.data);
  if (recognition && recognition.image !== underlay.data && recognition.state !== "busy") {
    recognition.image = underlay.data;
    recognition.pending = null;
    showRecognition("idle");
  }
  if (tracing && tracing.image !== underlay.data && !tracing.busy) {
    tracing.image = underlay.data;
    tracing.pending = false;
    showTracing();
  }
  const place = { x: underlay.x, y: underlay.y, width: underlay.width, height: underlay.width / underlay.ratio };
  for (const [key, value] of Object.entries({ ...place, opacity: underlay.opacity / 100 })) image.setAttribute(key, value);
  if (recognition) for (const [key, value] of Object.entries(place)) recognition.frame.setAttribute(key, value);
  element("fp-underlay-opacity").value = underlay.opacity;
  element("fp-underlay-rooms").value = roomTransparency(underlay);
  showRoomTransparency(roomTransparency(underlay));
}
function showRoomTransparency(percent) {
  canvas.style.setProperty("--fp-room-fill", (100 - percent) / 100);
}
function choosePdfPage(pdf) {
  const input = element("fp-pdf-page");
  const preview = element("fp-pdf-preview");
  const status = element("fp-pdf-status");
  const use = pdfPages.querySelector('button[type="submit"]');
  let latest = 0;
  const show = async () => {
    if (!input.validity.valid) return;
    const turn = ++latest;
    const canvas2 = await pdf.render(input.valueAsNumber, 440).catch(() => null);
    if (turn !== latest) return;
    preview.replaceChildren(...canvas2 ? [canvas2] : []);
    status.textContent = canvas2 ? "" : copy.underlay_pdf_error;
    use.disabled = !canvas2;
  };
  input.max = pdf.pages;
  input.value = 1;
  element("fp-pdf-page-label").textContent = copy.underlay_pdf_page.replace(":count", number3.format(pdf.pages));
  return new Promise((resolve) => {
    input.oninput = show;
    pdfPages.onclose = () => {
      latest += 1;
      input.oninput = pdfPages.onclose = null;
      preview.replaceChildren();
      resolve(pdfPages.returnValue === "use" ? input.valueAsNumber : null);
    };
    pdfPages.returnValue = "";
    pdfPages.showModal();
    show();
  });
}
function chooseImagePart(picture, ratio) {
  const stage2 = element("fp-crop-stage"), box2 = element("fp-crop-box");
  const whole = imageParts.querySelector('button[value="whole"]'), use = imageParts.querySelector('button[value="part"]');
  const step2 = 0.02;
  let part = null, drag = null;
  const show = () => {
    const usable = usablePart(part, ratio);
    box2.hidden = !part;
    if (part) {
      Object.assign(box2.style, {
        left: `${part.x * 100}%`,
        top: `${part.y * 100}%`,
        width: `${part.width * 100}%`,
        height: `${part.height * 100}%`
      });
    }
    use.disabled = !usable;
    use.classList.toggle("fp-primary", usable);
    whole.classList.toggle("fp-primary", !usable);
  };
  const at = (event) => {
    const bounds = stage2.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
  };
  const far = () => ({ x: part.x + part.width, y: part.y + part.height });
  stage2.style.setProperty("--fp-crop-ratio", ratio);
  stage2.prepend(picture);
  show();
  return new Promise((resolve) => {
    stage2.onpointerdown = (event) => {
      if (event.button) return;
      const point3 = at(event), corner = event.target.dataset.corner;
      if (corner && part) {
        drag = { from: { x: corner.includes("w") ? far().x : part.x, y: corner.includes("n") ? far().y : part.y } };
      } else if (event.target === box2 && part) {
        drag = { grip: point3, start: part };
      } else {
        drag = { from: point3 };
        part = null;
        show();
      }
      stage2.setPointerCapture(event.pointerId);
    };
    stage2.onpointermove = (event) => {
      if (!drag) return;
      const point3 = at(event);
      part = drag.from ? imagePart(drag.from, point3, 0) : movedPart(drag.start, point3.x - drag.grip.x, point3.y - drag.grip.y);
      show();
    };
    stage2.onpointerup = stage2.onpointercancel = () => {
      if (!drag) return;
      drag = null;
      if (part && !imagePart(part, far())) part = null;
      show();
    };
    stage2.onkeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        (use.disabled ? whole : use).click();
        return;
      }
      const [dx, dy] = { ArrowLeft: [-step2, 0], ArrowRight: [step2, 0], ArrowUp: [0, -step2], ArrowDown: [0, step2] }[event.key] ?? [];
      const removes = part && ["Delete", "Backspace"].includes(event.key);
      if (dx === void 0 && !removes) return;
      event.preventDefault();
      if (removes) part = null;
      else if (!part) part = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
      else if (event.shiftKey) part = imagePart(part, { x: far().x + dx, y: far().y + dy }) ?? part;
      else part = movedPart(part, dx, dy);
      show();
    };
    imageParts.onclose = () => {
      stage2.onpointerdown = stage2.onpointermove = stage2.onpointerup = stage2.onpointercancel = stage2.onkeydown = null;
      imageParts.onclose = null;
      picture.remove();
      const answer = imageParts.returnValue;
      resolve(answer === "part" && usablePart(part, ratio) ? part : answer === "whole" ? wholeImage : null);
    };
    imageParts.returnValue = "";
    imageParts.showModal();
  });
}
function renderDrawing() {
  renderRoomHandles();
  heatLegend.hidden = !showHeatmap;
  const sight = showCoverage ? prepareSight(planForDrawing(plan)) : null;
  beamChoices = showCoverage ? visibleSensors(plan).flatMap((item, index) => {
    const room = roomForDevice(plan.rooms, item);
    const marker = String(index + 1).padStart(2, "0");
    const motion = room && copy.sim_motion ? motionField(item) : null;
    return [...radarFields(room, item, coverageRadarOptions).reverse(), ...motion ? [motion] : []].map((field2) => {
      const radar = field2.radar.toUpperCase();
      return {
        item,
        room,
        field: field2,
        sight,
        key: `${item.id}:${field2.radar}`,
        label: `${marker} · ${devices[item.model].name} · ${radar}`,
        shortLabel: `${marker} · ${radar}`
      };
    });
  }) : [];
  if (showCoverage && beamChoice && !beamChoices.some((choice2) => choice2.key === beamChoice)) beamChoice = "";
  if (motionLegend) motionLegend.hidden = !beamChoices.some((choice2) => choice2.field.mode === "motion");
  beamPanelKey = null;
  if (view === "3d") {
    renderSpatialDrawing();
    return;
  }
  beamKey = null;
  renderPerson();
}
function renderSpatialDrawing() {
  beamKey = null;
  const crossing2 = stairWalk?.crossing != null;
  const stacked = allFloors || crossing2;
  const stair = currentStairTrip();
  const beams = allFloors && showCoverage ? (floor, camera3) => paintFloorCoverage(floor, camera3, coverageRadarOptions) : null;
  const heat = (floorPlan, camera3) => paintCoverageHeat(heatCells(floorPlan), { project: (point3) => projectSpace(point3, 0.012, camera3) });
  const floorCoverage = showHeatmap && allFloors ? (floor, camera3) => {
    const coverage2 = beams?.(floor, camera3) ?? {};
    return { ...coverage2, floorOverlay: heat(floor.plan, camera3) + (coverage2.floorOverlay ?? "") };
  } : beams;
  const singleCoverage = showHeatmap ? { floorOverlay: heat(plan, spaceCamera) + '<g id="fp-wall-coverage-space" pointer-events="none"></g>' } : null;
  const draft = space.hasAttribute("data-orbiting");
  const scene = stacked ? paintBuilding(
    projectFloors().map((floor) => ({ ...floor, plan: planForDrawing(floor.plan), label: floorLabel(floor, copy) })),
    spaceCamera,
    floorSeparation,
    building?.staircase,
    floorCoverage,
    { draft, wallMode, daylight }
  ) : paintSpace(planForDrawing(plan), spaceCamera, selected, { interactiveSensors: true, staircase: stair?.stair, upperStair: stair && !stair.up, draft, wallMode, daylight, coverage: singleCoverage });
  element("fp-space-empty").hidden = Boolean(scene);
  element("fp-space-guide").hidden = !scene;
  element("fp-space-furniture").hidden = !scene?.hasFurniture;
  space.setAttribute("aria-hidden", String(stacked));
  replaceMapMarkup(space, scene ? scene.markup + '<g id="fp-activity-space-layer" pointer-events="none"></g><g id="fp-person-space-layer" pointer-events="none"></g>' : "");
  if (stacked && coverageEstimateLegend) coverageEstimateLegend.hidden = !space.querySelector("[data-height-estimate]");
  if (allFloors && simulation && !crossing2 && scene) {
    const floor = space.querySelector(`[data-building-floor="${building.activeFloor}"]`);
    if (floor) {
      floor.setAttribute("data-sim-floor", "");
      const trail = document.createElementNS("http://www.w3.org/2000/svg", "g");
      trail.id = "fp-stacked-walk-lines";
      trail.setAttribute("pointer-events", "none");
      floor.append(trail, element("fp-activity-space-layer"));
      element("fp-person-space-layer").setAttribute("transform", floor.getAttribute("transform"));
    }
  }
  const wallLayer = element("fp-wall-coverage-space");
  if (wallLayer) wallLayer.innerHTML = paintWallCoverage(beamChoices, spaceCamera);
  spaceBounds = scene ? scene.viewBox.split(" ").map(Number) : null;
  if (scene) {
    updateSpatialViewport();
    updateSpaceControls();
    sizeSpaceLabels();
  }
  if (stacked) element("fp-radar-panel").hidden = true;
  if (crossing2) {
    highlightStairFloor(stairWalk.to.id);
    renderStairTravel();
  } else if (!allFloors || simulation || integration) renderPerson();
}
function stackedElevation(floor) {
  const levels = building.floors.map((entry) => entry.level);
  return floorStackHeight(floor.level, Math.min(...levels), floorSeparation);
}
function updateSpatialViewport() {
  if (!spaceBounds) return;
  const [left, top2, width, height] = spaceBounds;
  const person = currentWalker()?.person;
  const floor = allFloors && spaceFollow && person ? building.floors.find((entry) => entry.id === building.activeFloor) : null;
  const [x, y] = spaceFollow && person ? projectSpace([person.x, person.y], 0.45 + (floor ? stackedElevation(floor) : 0), spaceCamera) : [left + width / 2, top2 + height / 2];
  const w = width / spaceZoom, h = height / spaceZoom;
  const viewBox = [x - w / 2, y - h / 2, w, h].join(" ");
  if (space.getAttribute("viewBox") !== viewBox) space.setAttribute("viewBox", viewBox);
  refreshSensorTip();
}
function viewPreference(key, values) {
  try {
    const saved = localStorage.getItem(key);
    return values.includes(saved) ? saved : values[0];
  } catch {
    return values[0];
  }
}
function rememberViewPreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}
function heatCells(floorPlan) {
  const drawn = visiblePlan(floorPlan);
  const furniture = element("fp-include-furniture")?.checked !== false;
  const key = JSON.stringify([drawn.rooms, drawn.sensors, furniture ? drawn.furniture : null, drawn.zones, drawn.doors, drawn.walls]);
  heatCache ??= /* @__PURE__ */ new Map();
  if (!heatCache.has(key)) {
    if (heatCache.size > 8) heatCache.clear();
    heatCache.set(key, coverageCells(drawn, { furniture }));
  }
  const cells = heatCache.get(key);
  if (floorPlan === plan) {
    const share2 = coverageSummary(cells);
    heatLegend.innerHTML = ["none", "one", "many"].map((level) => `<span data-seen="${level}">${escapeText(copy["heatmap_" + level])} ${share2[level]}%</span>`).join("");
  }
  return cells;
}
function renderViewSwitches() {
  for (const [action, value] of [["wall_mode", wallMode], ["daylight", daylight]]) {
    viewSwitches[action].innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${viewSwitchIcons[action][value]}"/></svg>${escapeText(copy[action + "_" + value])}`;
  }
}
function updateSpaceControls() {
  const follow = root.querySelector('[data-action="follow_person"]');
  follow.hidden = !currentWalker() || stairWalk?.crossing != null;
  follow.setAttribute("aria-pressed", String(spaceFollow));
  root.querySelector('[data-action="space_zoom_out"]').disabled = spaceZoom <= 1;
  root.querySelector('[data-action="space_zoom_in"]').disabled = spaceZoom >= 3.2;
  showZoom();
}
function zoomSpace(factor) {
  spaceZoom = Math.max(1, Math.min(3.2, spaceZoom * factor));
  updateSpatialViewport();
  const previousDetail = detailedSpacePeople;
  sizeSpaceLabels();
  if (previousDetail !== detailedSpacePeople) renderPerson();
  updateSpaceControls();
}
function renderBeam() {
  const { person = null, readings = [] } = currentWalker() ?? {};
  const seen = (choice2) => readings.find((reading) => reading.item.id === choice2.item.id)?.signals.some((signal) => signal.radar === choice2.field.radar && signal.seen) ?? false;
  const room = person && plan.rooms.find((room2) => contains(room2, person));
  const focus = beamChoices.find((choice2) => choice2.key === beamChoice) ?? beamChoices.find(seen) ?? beamChoices.find((choice2) => room && choice2.room.id === room.id) ?? beamChoices.find((choice2) => choice2.item.id === selected) ?? beamChoices[0];
  const profile2 = radarProfileFor(person);
  const wall2 = focus && !focus.field.radii;
  if (coverageEstimateLegend) {
    coverageEstimateLegend.hidden = view === "3d" ? !focus?.field.estimatedHeight : !beamChoices.some((choice2) => choice2.field.estimatedHeight);
  }
  const layer = element("fp-cone-space");
  if (view === "3d" && layer) {
    layer.toggleAttribute("data-wall", Boolean(wall2));
    const nextDetected = focus && seen(focus) ? focus.key : null;
    const detected = String(nextDetected !== null);
    if (layer.dataset.detected !== detected) layer.dataset.detected = detected;
    if (nextDetected && nextDetected !== detectedBeam) {
      layer.classList.add("fp-beam-pulse");
      layer.addEventListener("animationend", () => layer.classList.remove("fp-beam-pulse"), { once: true });
    }
    detectedBeam = nextDetected;
  }
  const lying2 = person?.pose === "lying";
  const key = focus ? `${focus.key}:${focus.field.profiles ? profile2 + (lying2 ? ":lying" : "") : ""}` : "";
  if (beamKey === key) return;
  beamKey = key;
  if (view === "2d") {
    const stair = currentStairTrip();
    replaceMapMarkup(drawing, paintPlan(
      planForDrawing(plan),
      showCoverage,
      selected,
      number3,
      focus && { ...focus, profile: profile2 },
      {
        measures: showMeasures,
        interactiveSensors: true,
        radarOptions: coverageRadarOptions,
        casing: Boolean(plan.underlay),
        motion: Boolean(copy.sim_motion)
      }
    ) + (stair ? paintStairPlan(stair.stair, escapeText(copy.staircase), stair.up) : "") + (showHeatmap ? paintCoverageHeat(heatCells(plan)) : "") + paintMirrorWedges());
  } else if (layer) layer.innerHTML = focus ? paintBeam(focus, spaceCamera, profile2) : "";
  const panelKey = `${key}:${beamChoice}`;
  if (beamPanelKey === panelKey) return;
  beamPanelKey = panelKey;
  element("fp-radar-panel").hidden = !focus;
  if (!focus) return;
  const select = element("fp-radar-focus");
  const options2 = `<option value="">${copy.beam_auto} · ${focus.shortLabel}</option>` + beamChoices.map((choice2) => `<option value="${choice2.key}">${escapeText(choice2.label)}</option>`).join("");
  if (select.dataset.options !== options2) {
    select.innerHTML = options2;
    select.dataset.options = options2;
  }
  select.value = beamChoice;
  const radii = element("fp-radar-radii");
  radii.hidden = !focus.field.profiles && !wall2;
  element("fp-beam-note").textContent = [
    focus.field.profiles && `${copy.beam_radius}.`,
    wall2 ? copy[view === "3d" ? "beam_wall_note_3d" : "beam_wall_note"] : copy.beam_note,
    focus.field.estimatedHeight && copy.height_note,
    focus.field.profiles && lying2 && copy.beam_lying_note
  ].filter(Boolean).join(" ");
  if (focus.field.profiles) {
    radii.innerHTML = `<span class="fp-visually-hidden">${copy.beam_radius}</span>` + ceilingProfiles.map((name) => `<span class="fp-radar-radius${name === profile2 ? " active" : ""}" data-profile="${name}" aria-current="${name === profile2}">
                <span><i aria-hidden="true"></i>${copy["beam_" + name]}</span>
                <strong>${focus.field.profiles[name].map((value) => number3.format(value)).join(" × ")} m</strong>
            </span>`).join("");
  } else if (wall2) {
    radii.innerHTML = `<span class="fp-radar-radius active"><span>${copy.beam_wall_range}</span>
            <strong>${number3.format(focus.field.range)} m · ±${number3.format(focus.field.half)}°</strong></span>`;
  }
}
function renderActivities(camera3D) {
  const activities = autoWalk ? [...autoWalk.routes.values()].map((route) => route.playing).filter(Boolean) : [];
  const tests = activities.filter((activity) => activity.kind === "fall" || activity.kind === "smoke");
  const layer = element(camera3D ? "fp-activity-space-layer" : "fp-activity-flat-layer");
  const key = tests.map(({ kind, name, started, checked, detected, smokePhase }) => [kind, name, started, checked, detected, smokePhase].join(":")).join("/");
  if (layer && layer.dataset.effects !== key) {
    layer.dataset.effects = key;
    const now = performance.now();
    layer.innerHTML = tests.map((activity) => paintActivityEffect(activity, camera3D, now)).join("");
  }
  const current = activities.find((activity) => activity.detected) ?? activities.find((activity) => activity.name === activeWalker) ?? activities[0];
  const status = element("fp-sim-activity");
  const suffix = current?.detected ? "_detected" : current?.checked ? "_undetected" : current?.smokePhase === "start" ? "_start" : current?.smokePhase === "fire" ? "_fire" : "";
  const label = current ? copy["sim_activity_" + current.kind + suffix].replace(":person", copy["sim_" + current.name]).replace(":room", current.room.name) : "";
  if (status.textContent !== label) status.textContent = label;
  if (status.dataset.alarm !== String(Boolean(current?.detected))) status.dataset.alarm = String(Boolean(current?.detected));
  return new Set(tests.filter((activity) => activity.detected).map((activity) => activity.detector.item.id));
}
function renderPerson() {
  if (integration && !simulation) {
    if (!allFloors) renderBeam();
    integration.sceneChanged?.();
    const layer2 = element(view === "3d" ? "fp-person-space-layer" : "fp-person-flat");
    if (!layer2) return;
    const floors = projectFloors();
    const active = floors.find((floor2) => floor2.id === (building?.activeFloor ?? "ground"));
    const camera3 = view === "3d" ? spaceCamera : null;
    const figures2 = (allFloors ? floors : active ? [active] : []).flatMap((floor2) => liveFloorFigures(livePeople, floor2.plan.rooms).map((person2) => ({ ...person2, elevation: allFloors ? stackedElevation(floor2) : 0, plumbob: "clear" })));
    layer2.innerHTML = figures2.map((person2) => `<g data-live-person="" pointer-events="none">${paintPerson(person2, camera3, !reducedMotion.matches, detailedSpacePeople)}</g>`).join("");
    if (camera3) fadeLabelsNear(space, figures2.map((figure) => projectedFigure(figure, camera3, screenOffset(layer2, space))));
    return;
  }
  if (stairWalk?.crossing != null) {
    renderStairTravel();
    return;
  }
  updateStairPrompt();
  if (!allFloors) renderBeam();
  const layer = element(view === "3d" ? "fp-person-space-layer" : "fp-person-flat");
  const walker = currentWalker();
  const camera3D = view === "3d" ? spaceCamera : null;
  const alarms = renderActivities(camera3D);
  if (!simulation || !walker) {
    layer?.replaceChildren();
    if (camera3D) fadeLabelsNear(space, []);
    return;
  }
  const { person, route, readings } = walker;
  if (layer) {
    const floors = allFloors ? building.floors : [];
    const origin = allFloors ? stackedElevation(floors.find((floor2) => floor2.id === walkFloorId())) : 0;
    const figures2 = (allFloors ? Object.entries(walkers).filter(([, walker2]) => walker2) : walkersOnFloor()).map(([name, walker2]) => {
      const floor2 = floors.find((floor3) => floor3.id === walker2.floorId);
      return walkFigure(name, walker2, floor2 ? stackedElevation(floor2) - origin : 0);
    });
    const trail = element("fp-stacked-walk-lines");
    const lines = paintWalkLines(person, route, readings, camera3D);
    if (trail) trail.innerHTML = lines;
    layer.innerHTML = (trail ? "" : lines) + paintWalkers(figures2, camera3D);
    if (camera3D) fadeLabelsNear(space, figures2.map((figure) => projectedFigure(figure, camera3D, screenOffset(layer, space))));
  }
  if (view === "3d" && spaceFollow) updateSpatialViewport();
  const room = plan.rooms.find((room2) => contains(room2, person));
  const seen = new Set(readings.filter((reading) => reading.seen).map((reading) => reading.item.id));
  const obstacles = /* @__PURE__ */ new Map();
  for (const { obstacle } of readings) {
    if (obstacle && obstacles.get(obstacle.id) !== "blocked") obstacles.set(obstacle.id, obstacle.status);
  }
  const map = view === "3d" ? space : drawing;
  const activeScene = allFloors ? map.querySelector("[data-sim-floor]") : map;
  activeScene?.querySelectorAll("[data-furniture-id]").forEach((item) => {
    const effect = obstacles.get(item.dataset.furnitureId);
    if (effect) item.dataset.occlusion = effect;
    else item.removeAttribute("data-occlusion");
  });
  activeScene?.querySelectorAll(view === "3d" ? ".fp-space-marker" : ".fp-sensor").forEach((marker) => {
    marker.classList.toggle("fp-sim-seen", seen.has(marker.dataset.item));
    marker.classList.toggle("fp-sim-alarm", alarms.has(marker.dataset.item));
  });
  if (allFloors) {
    activeScene?.querySelectorAll('.fp-stack-beam, .fp-wall-fan[data-plane="floor"]').forEach((field2) => {
      const reading = readings.find((entry) => entry.item.id === field2.dataset.sensor);
      field2.toggleAttribute("data-detected", Boolean(reading?.signals.some((signal) => signal.seen && (!field2.dataset.radar || signal.radar === field2.dataset.radar))));
    });
  }
  const count = copy.sim_count.replace(":seen", number3.format(seen.size)).replace(":total", number3.format(readings.length));
  const affected = readings.filter((reading) => reading.obstacle).length;
  const extra = affected ? " · " + copy.sim_risk_count.replace(":count", number3.format(affected)) : "";
  const floorLabelText = allFloors ? floorLabel(building.floors.find((floor2) => floor2.id === building.activeFloor), copy) + " · " : "";
  const summary = (walkers.woman || walkers.child ? `${copy["sim_" + activeWalker]} · ` : "") + floorLabelText + (room ? `${room.name} · ${count}` : count) + extra;
  const status = element("fp-sim-summary");
  if (status.textContent !== summary) status.textContent = summary;
  const roomLabel2 = room?.name ?? copy.sim_outside_rooms;
  const floor = building?.floors.find((floor2) => floor2.id === walkFloorId());
  const levelLabel = floor ? floorLabel(floor, copy) : "";
  const metric = readings.length ? copy.sim_count_short.replace(":seen", number3.format(seen.size)).replace(":total", number3.format(readings.length)) : copy.sim_no_sensors_short;
  const readingLabel = copy.sim_view_readings + " · " + metric + (readings.length ? " " + copy.sim_detecting_sensors : "");
  if (element("fp-sim-room-label").textContent !== roomLabel2) element("fp-sim-room-label").textContent = roomLabel2;
  if (element("fp-sim-floor-label").textContent !== levelLabel) element("fp-sim-floor-label").textContent = levelLabel;
  element("fp-sim-floor-label").hidden = !levelLabel;
  if (element("fp-sim-count").textContent !== metric) element("fp-sim-count").textContent = metric;
  element("fp-sim-detect-label").hidden = !readings.length;
  if (simReading.getAttribute("aria-label") !== readingLabel) simReading.setAttribute("aria-label", readingLabel);
  const roomSelect = element("fp-sim-room");
  if (roomSelect.value !== room?.id) roomSelect.value = room?.id ?? "";
  const position = element("fp-sim-position");
  const tracked = room && readings.some((reading) => reading.signals.some((signal) => signal.seen && signal.mode !== "presence"));
  position.hidden = !tracked;
  if (tracked) {
    const coordinates2 = copy.sim_room_position.replace(":x", tenth.format(person.x - room.x)).replace(":y", tenth.format(person.y - room.y));
    if (position.textContent !== coordinates2) position.textContent = coordinates2;
  }
  const distance4 = element("fp-route-distance");
  const distanceLabel = route.distance ? copy.sim_route_distance.replace(":covered", tenth.format(route.covered)).replace(":total", tenth.format(route.distance)) : copy.sim_route_empty;
  const routeLabel = route.uncertain > 0.049 ? distanceLabel + " · " + copy.sim_risk_route.replace(":distance", tenth.format(route.uncertain)) : distanceLabel;
  if (distance4.textContent !== routeLabel) distance4.textContent = routeLabel;
  const fill3 = element("fp-route-fill");
  fill3.parentElement.hidden = !route.distance;
  fill3.style.width = route.distance ? `${Math.min(100, route.covered / route.distance * 100)}%` : "";
  root.querySelector('[data-action="clear_walk"]').disabled = !route.distance;
  root.querySelectorAll("[data-person-pose]").forEach((button) => {
    const pressed = String(button.dataset.personPose === person.pose);
    if (button.getAttribute("aria-pressed") !== pressed) button.setAttribute("aria-pressed", pressed);
  });
  const profile2 = radarProfileFor(person);
  const key = person.pose + ":" + profile2 + ":" + readings.map((reading) => reading.signals.map((signal) => signal.obstacle ? signal.obstacle.id + signal.obstacle.status : signal.exclusion?.id ?? Number(signal.seen)).join(",") + (reading.motion ? `,${Number(reading.motion.seen)}${Number(reading.motion.still)}` : "")).join("/");
  if (readingKey === key) return;
  readingKey = key;
  element("fp-sim-sensors").innerHTML = readings.map(({ item, index, room: home, signals, motion, seen: seen2, obstacle }) => `<li>
        <div class="fp-sim-device"><span class="fp-index ${devices[item.model].mount}">${String(index + 1).padStart(2, "0")}</span>
            <strong>${devices[item.model].name}</strong><span class="fp-sim-light" data-seen="${seen2}" aria-hidden="true"></span></div>
        ${signals.length ? signals.map((signal) => `<div class="fp-sim-signal">
            <span>${signal.radar.toUpperCase()} · ${signal.profiles ? copy["beam_" + (person.pose === "lying" ? "lying" : profile2)] : copy["sim_" + signal.mode]}</span>
            <span data-seen="${signal.seen}" data-status="${signal.obstacle?.status ?? ""}">${signal.obstacle ? copy["sim_" + signal.obstacle.status] : signal.exclusion ? copy.sim_excluded : signal.seen ? copy.sim_seen : copy.sim_missed}</span>
        </div>${signal.height === null ? "" : `<p class="fp-sim-height">Z · ${copy["sim_" + person.pose]} · ${copy.sim_height.replace(":height", number3.format(signal.height))}</p>`}`).join("") : `<p class="fp-note">${escapeText(String(sensorNote(item, home) || copy.sim_no_profile))}</p>`}
        ${signals.some((signal) => signal.estimatedHeight) ? `<p class="fp-note fp-sim-estimate">${escapeText(coverageEstimateLabel)}</p>` : ""}
        ${motion && copy.sim_motion ? `<div class="fp-sim-signal fp-sim-motion"><span>PIR · ${copy.sim_motion}</span>
            <span data-seen="${motion.seen}">${motion.seen ? copy.sim_seen : motion.still ? copy.sim_still : copy.sim_missed}</span></div>` : ""}
        ${obstacle ? `<p class="fp-obstacle-name" data-status="${obstacle.status}">${escapeText(obstacle.name)}</p>` : ""}
    </li>`).join("") || `<li class="fp-note">${copy.sim_empty}</li>`;
}
function walkFigure(name, walker, offset2 = 0) {
  const active = name === activeWalker;
  return {
    ...walker.person,
    active,
    elevation: (walker.person.elevation ?? 0) + offset2,
    plumbob: active && walker.readings?.length ? routeCoverage(walker.readings) : void 0
  };
}
function projectedFigure({ x, y, elevation = 0 }, camera3, offset2 = 0) {
  const [screenX, foot] = projectSpace([x, y], elevation, camera3);
  return { x: screenX, foot: foot + offset2, head: projectSpace([x, y], elevation + 1.8, camera3)[1] + offset2 };
}
function paintWalkers(figures2, camera3D, occlusion = null) {
  if (camera3D) {
    const depth = ({ x, y, elevation }) => projectSpace([x, y], elevation ?? 0, camera3D)[1];
    figures2.sort((a, b) => depth(a) - depth(b));
  }
  return figures2.map((figure) => paintPerson(
    figure,
    camera3D,
    !reducedMotion.matches,
    detailedSpacePeople,
    occlusion
  )).join("");
}
function prepareWalkFloor() {
  const trip = currentStairTrip();
  walkWalls = [...solidWalls(plan), ...trip ? stairWalls(trip.stair) : []];
  walkSensors = preparePersonSensors(planForDrawing(plan));
  walkFurniture = element("fp-include-furniture").checked ? prepareFurnitureOcclusion(plan.furniture) : [];
  const hasRooms = Boolean(plan.rooms.length);
  element("fp-sim-room").innerHTML = plan.rooms.map((room) => `<option value="${room.id}">${escapeText(room.name)}</option>`).join("");
  element("fp-sim-summary").textContent = hasRooms ? "" : copy.sim_need_room;
  element("fp-sim-room-label").textContent = hasRooms ? "" : copy.sim_need_room;
  element("fp-sim-floor-label").hidden = true;
  element("fp-sim-instructions").hidden = !hasRooms;
  element("fp-sim-sensors").hidden = !hasRooms;
  element("fp-sim-position").hidden = true;
  element("fp-route-summary").hidden = !hasRooms;
  element("fp-sim-room").disabled = !hasRooms;
  simReading.hidden = !hasRooms;
}
function loadWalkFloor(id) {
  readProject({ ...projectDocument(), activeFloor: id });
  closeSensorTip();
  selected = plan.sensors[0]?.id;
  beamChoice = "";
  detectedBeam = null;
  readingKey = null;
  prepareWalkFloor();
  for (const [, walker] of walkersOnFloor()) {
    walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
  }
}
function focusWalkMap() {
  const map = view === "2d" ? board : stage;
  if (document.activeElement !== map) map.focus({ preventScroll: true });
}
function setSimulation(active) {
  if (integration && !appPlanner && active) return;
  stopStairWalk();
  stopAutoWalk();
  walkControls.stop();
  simulation = active;
  if (active) reviewedCoverage = false;
  root.toggleAttribute("data-simulation", active);
  if (active && appPlanner) integration.sceneChanged?.();
  testStep.setAttribute("aria-pressed", String(active));
  if (active) roomFormOpen = false;
  element("fp-simulation").hidden = !active;
  simGuide.hidden = !active;
  simMenus.forEach((menu) => {
    menu.open = false;
  });
  if (active) element("fp-sim-exit").append(testStep);
  else orderStep.before(testStep);
  for (const name of Object.keys(walkers)) walkers[name] = null;
  activeWalker = "man";
  readingKey = null;
  if (active) {
    root.removeAttribute("data-panel");
    const room = currentRoom() ?? plan.rooms[0];
    closeLibrary(false);
    setTool("edit");
    cursor = null;
    updateCursor();
    prepareWalkFloor();
    if (room) walkers.man = startWalker(stairSafeStart(currentStairTrip(), personAt(room)), "man");
  } else {
    if (spaceFollow) {
      spaceFollow = false;
      spaceZoom = 1;
    }
    walkWalls = [];
    walkSensors = [];
    walkFurniture = [];
    element("fp-person-flat").replaceChildren();
  }
  updateWalkerControls();
  root.querySelectorAll("[data-walk-legend]").forEach((label) => {
    label.hidden = !currentWalker();
  });
  element("fp-sim-dock").hidden = !currentWalker();
  renderDrawing();
  if (active && currentWalker() && view === "2d") fit();
  updateTools();
  if (active) focusWalkMap();
}
function startWalker(position, avatar) {
  const person = { ...position, avatar, moving: false, stride: 0 };
  return { person, floorId: walkFloorId(), route: emptyRoute(), readings: personSignals(plan, person, walkSensors, walkFurniture, walkSightNow({ name: avatar, person })) };
}
function updateWalkerControls() {
  const multiple = Boolean(walkers.woman || walkers.child);
  element("fp-sim-people").hidden = !walkers.man;
  simTools.hidden = !walkers.man;
  element("fp-sim-dual-note").hidden = !multiple;
  simCast.querySelectorAll("[data-toggle-walker]").forEach((button) => {
    const name = button.dataset.toggleWalker;
    const present = Boolean(walkers[name]);
    button.toggleAttribute("data-present", present);
    button.querySelector("span").textContent = copy[(present ? "sim_remove_" : "sim_add_") + name];
  });
  root.querySelectorAll("[data-walker]").forEach((button) => {
    button.hidden = !walkers[button.dataset.walker];
    button.setAttribute("aria-pressed", String(button.dataset.walker === activeWalker));
  });
  updateStairControls();
}
function selectWalker(name) {
  const walker = walkers[name];
  if (!walker) return;
  walkControls.stop();
  if (name !== activeWalker) stopStairWalk();
  const changedFloor = walker.floorId !== walkFloorId();
  if (changedFloor) stopAutoWalk();
  activeWalker = name;
  readingKey = null;
  if (changedFloor) loadWalkFloor(walker.floorId);
  updateWalkerControls();
  if (changedFloor) {
    finish();
    if (view === "2d") fit();
  } else renderPerson();
}
function restartWalk(position) {
  const stair = currentStairTrip()?.stair;
  if (stair && insideStairwell(stair, position)) return;
  stopStairWalk();
  stopAutoWalk();
  walkControls.stop();
  const { person } = currentWalker();
  walkers[activeWalker] = startWalker({ ...person, x: position.x, y: position.y }, activeWalker);
  renderPerson();
}
function toggleWalker(name) {
  if (!currentWalker() || stairWalk?.crossing != null) return;
  simCast.open = false;
  stopStairWalk();
  stopAutoWalk();
  walkControls.stop();
  if (walkers[name]) {
    walkers[name] = null;
    const next = name === activeWalker ? walkersOnFloor()[0]?.[0] ?? "man" : activeWalker;
    selectWalker(next);
    simCast.querySelector("summary").focus({ preventScroll: true });
    return;
  }
  const { person } = currentWalker();
  const room = plan.rooms.find((room2) => contains(room2, person));
  const rooms = room ? [room] : plan.rooms;
  const stair = currentStairTrip()?.stair;
  const neighbours = walkersOnFloor().map(([, walker]) => walker.person);
  let position = person;
  search: for (const distance4 of [1, 0.68, 0.4, 0.22]) {
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0], [0.71, -0.71], [0.71, 0.71], [-0.71, 0.71], [-0.71, -0.71]]) {
      const candidate = movePerson(rooms, walkWalls, person, dx * distance4, dy * distance4);
      if (candidate === person || stair && insideStairwell(stair, candidate)) continue;
      if (position === person) position = candidate;
      if (neighbours.every((other) => Math.hypot(other.x - candidate.x, other.y - candidate.y) > 0.55)) {
        position = candidate;
        break search;
      }
    }
  }
  walkers[name] = startWalker({ ...position, heading: person.heading, pose: "standing" }, name);
  selectWalker(name);
  focusWalkMap();
}
function walk(name, x, y, distance4) {
  if (stairWalk) return false;
  stopAutoWalk();
  let dx = x, dy = y;
  if (view === "3d") {
    const [worldX, worldY] = unprojectFloor([x, y], spaceCamera);
    const length = Math.hypot(worldX, worldY);
    [dx, dy] = [worldX / length, worldY / length];
  }
  return advanceWalker(name, dx, dy, distance4, true);
}
function advanceWalker(name, dx, dy, distance4, slide = false) {
  const walker = walkers[name];
  if (walker?.floorId !== walkFloorId()) return false;
  const { person, route, readings } = walker;
  const step2 = (x, y) => movePerson(plan.rooms, walkWalls, person, x * distance4, y * distance4);
  let next = step2(dx, dy);
  if (next === person && slide && dx && dy) {
    next = step2(dx, 0);
    if (next === person) next = step2(0, dy);
  }
  if (next === person) {
    return settleWalk(name);
  }
  const before = person;
  const hadCoverage = routeCoverage(before.moving ? readings : personSignals(plan, { ...before, moving: true }, walkSensors, walkFurniture, walkSightNow()));
  const stride = ((before.stride ?? 0) + Math.hypot(next.x - before.x, next.y - before.y)) % 1.1;
  walker.person = { ...next, pose: "standing", moving: true, stride };
  walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
  recordWalk(route, before, walker.person, hadCoverage, routeCoverage(walker.readings));
  if (view === "2d" && (name === activeWalker || !currentWalker().person.moving)) {
    const { x, y, width, height } = canvas.viewBox.baseVal;
    if (next.x < x + 0.35 || next.x > x + width - 0.35 || next.y < y + 0.35 || next.y > y + height - 0.35) {
      camera2.x = next.x;
      camera2.y = next.y;
      updateView();
    }
  }
  return true;
}
function settleWalk(name) {
  const walker = walkers[name];
  if (walker?.floorId !== walkFloorId() || !walker.person.moving) return false;
  walker.person.moving = false;
  walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
  return true;
}
function updateAutoWalkStatus(message = "") {
  const button = root.querySelector('[data-action="auto_walk"]');
  const pressed = String(Boolean(autoWalk && !autoWalk.test || stairWalk?.repeat));
  if (button.getAttribute("aria-pressed") !== pressed) button.setAttribute("aria-pressed", pressed);
  button.querySelector("span").textContent = copy[pressed === "true" ? "sim_auto_stop" : "sim_auto"];
  for (const test of root.querySelectorAll("[data-activity-test]")) {
    const kind = test.dataset.activityTest;
    const active = autoWalk?.test === kind;
    test.setAttribute("aria-pressed", String(active));
    test.querySelector("span").textContent = copy[active ? "sim_test_stop_" + kind : "sim_test_" + kind];
  }
  const status = element("fp-sim-auto-status");
  if (status.textContent !== message) status.textContent = message;
  element("fp-sim-instructions").hidden = Boolean(autoWalk || stairWalk) || !currentWalker();
}
function stopAutoWalk() {
  if (!autoWalk) {
    if (element("fp-sim-auto-status").textContent) updateAutoWalkStatus();
    return;
  }
  cancelAnimationFrame(autoWalkFrame);
  closeSmokeTestAudio();
  autoWalkFrame = 0;
  for (const [name, route] of autoWalk.routes) finishWalkActivity(name, route);
  autoWalk = null;
  updateAutoWalkStatus();
  Object.keys(walkers).forEach(settleWalk);
  renderPerson();
}
function updateStairControls() {
  const travelling = Boolean(stairWalk);
  const stairs = root.querySelector('[data-action="take_stairs"]');
  stairs.hidden = !simulation || !currentWalker() || travelling || !currentStairTrip();
  stairs.querySelector("span").textContent = copy[walkersOnFloor().length > 1 ? "sim_stair_take_group" : "sim_stair_take"];
  root.querySelector('[data-action="stop_stairs"]').hidden = !travelling;
  simGuide.toggleAttribute("data-stair-travel", travelling);
  if (travelling) simMenus.forEach((menu) => {
    menu.open = false;
  });
  updateStairPrompt();
}
function highlightStairFloor(id) {
  root.toggleAttribute("data-stair-preview", Boolean(id && (allFloors || stairWalk?.crossing != null)));
  for (const floor of space.querySelectorAll("[data-building-floor]")) {
    floor.toggleAttribute("data-stair-target", floor.dataset.buildingFloor === id);
  }
}
function updateStairPrompt() {
  const walker = currentWalker();
  const trip = simulation && walker && !autoWalk && !stairWalk ? currentStairTrip() : null;
  let show = false;
  if (trip) {
    const landing = trip.up ? trip.stair.bottom : trip.stair.top;
    const distance4 = Math.hypot(walker.person.x - landing.x, walker.person.y - landing.y);
    if (distance4 > 0.95) walker.dismissStairPrompt = false;
    const samePrompt = !stairPrompt.hidden && stairPrompt.dataset.walker === activeWalker && stairPrompt.dataset.target === trip.to.id;
    show = !walker.dismissStairPrompt && distance4 <= (samePrompt ? 0.95 : 0.75);
  }
  stairPrompt.hidden = !show;
  if (show) {
    const direction2 = trip.up ? "up" : "down";
    const question = copy.sim_stair_destination.replace(":floor", floorLabel(trip.to, copy));
    if (element("fp-stair-question").textContent !== question) element("fp-stair-question").textContent = question;
    const confirmLabel = copy["sim_stair_go_" + direction2];
    if (element("fp-stair-confirm-label").textContent !== confirmLabel) element("fp-stair-confirm-label").textContent = confirmLabel;
    stairPrompt.dataset.direction = direction2;
    stairPrompt.dataset.walker = activeWalker;
    stairPrompt.dataset.target = trip.to.id;
  }
  if (allFloors || root.hasAttribute("data-stair-preview") || stairWalk?.crossing != null) {
    highlightStairFloor(stairWalk?.to.id ?? (show ? trip.to.id : null));
  }
}
function stopStairWalk() {
  if (!stairWalk) return;
  const { returnView } = stairWalk;
  cancelAnimationFrame(stairFrame);
  stairWalk = null;
  root.removeAttribute("data-stair-crossing");
  Object.keys(walkers).forEach(settleWalk);
  updateStairControls();
  updateAutoWalkStatus();
  if (!allFloors && view !== returnView) setView(returnView);
  else renderDrawing();
}
function startStairWalk(repeat = false, only = null) {
  const trip = currentStairTrip();
  if (!trip || !currentWalker() || stairWalk) return false;
  const { to, up, stair } = trip;
  const approach = createWalkNetwork(plan, walkWalls);
  const arrival = createWalkNetwork(to.plan, [...solidWalls(to.plan), ...stairWalls(stair)]);
  const routes = [];
  const group = walkersOnFloor().filter(([name]) => !only || only === name);
  for (const [index, [name, walker]] of group.entries()) {
    const lane = group.length === 1 ? 0 : (2 * index / (group.length - 1) - 1) * 0.21 * stair.width;
    const entry = stairPoint(stair, up ? 0 : 1, lane);
    const exit = stairPoint(stair, up ? 1 : 0, lane);
    const start3 = approach.startAt(walker.person);
    const points = start3 && approach.routeTo(start3, entry);
    if (!points || !arrival.clear(exit, exit) || !arrival.startAt(exit)) {
      if (!repeat) updateAutoWalkStatus(copy.sim_stair_blocked);
      return false;
    }
    routes.push({ name, lane, start: start3, points, exit });
  }
  stopAutoWalk();
  walkControls.stop();
  routes.forEach(({ name, start: start3 }) => {
    const { person } = walkers[name];
    if (start3 !== person) walkers[name] = startWalker({ ...person, x: start3.x, y: start3.y }, name);
  });
  stairWalk = {
    ...trip,
    routes,
    repeat,
    returnView: view,
    time: performance.now(),
    crossing: null,
    elapsed: 0,
    duration: reducedMotion.matches ? 260 : stairGaitDuration(up),
    turn: reducedMotion.matches ? 0 : 190,
    delay: reducedMotion.matches ? 0 : 690
  };
  updateStairControls();
  updateAutoWalkStatus(copy.sim_stair_travel.replace(":floor", floorLabel(to, copy)));
  stairFrame = requestAnimationFrame(tickStairWalk);
  return true;
}
function renderStairTravel() {
  const layer = element("fp-person-space-layer");
  if (!layer) return;
  const { from, to, up, stair, routes, elapsed, duration, delay, turn } = stairWalk;
  const low = stackedElevation(up ? from : to);
  const high = stackedElevation(up ? to : from);
  const heading = stairHeading(stair, up);
  const figures2 = routes.map(({ name, lane, entryHeading }, index) => {
    const time = elapsed - index * delay;
    const progress = Math.max(0, Math.min(1, (time - turn) / duration));
    const rotation = (heading - entryHeading + 540) % 360 - 180;
    const turning2 = turn ? Math.max(0, Math.min(1, time / turn)) : 1;
    const gait = stairGait(stair, progress, high - low, up, lane);
    return {
      ...gait,
      avatar: name,
      active: name === activeWalker,
      elevation: low + gait.elevation,
      pose: "standing",
      heading: entryHeading + rotation * turning2 * turning2 * (3 - 2 * turning2)
    };
  });
  const waiting = [];
  for (const [name, walker] of Object.entries(walkers)) {
    if (!walker || routes.some((route) => route.name === name)) continue;
    const floor = building.floors.find((floor2) => floor2.id === walker.floorId);
    if (floor) waiting.push(walkFigure(name, walker, stackedElevation(floor)));
  }
  const stairLayer = space.querySelector("[data-stair-walkers]");
  if (stairLayer) {
    stairLayer.innerHTML = paintWalkers(figures2, spaceCamera, { id: stairOcclusionId(stair), height: high });
    layer.innerHTML = paintWalkers(waiting, spaceCamera);
  } else layer.innerHTML = paintWalkers([...figures2, ...waiting], spaceCamera);
}
function tickStairWalk(now) {
  const travel = stairWalk;
  const { routes } = travel;
  if (travel.crossing !== null) {
    travel.elapsed = now - travel.crossing;
    if (travel.elapsed >= travel.turn + travel.duration + (routes.length - 1) * travel.delay) {
      stairWalk = null;
      root.removeAttribute("data-stair-crossing");
      loadWalkFloor(travel.to.id);
      const heading = stairHeading(travel.stair, travel.up);
      for (const { name, exit } of routes) {
        walkers[name] = startWalker({ ...exit, pose: "standing", heading }, name);
        walkers[name].dismissStairPrompt = true;
      }
      if (!allFloors && view !== travel.returnView) setView(travel.returnView);
      updateWalkerControls();
      updateAutoWalkStatus();
      finish();
      if (view === "2d") fit();
      if (document.activeElement === stage || document.activeElement === board || document.activeElement === document.body) focusWalkMap();
      if (travel.repeat) startAutoWalk();
      return;
    }
    renderStairTravel();
  } else {
    const step2 = Math.min(0.05, Math.max(0, (now - travel.time) / 1e3)) * 1.35;
    travel.time = now;
    for (const { name, points } of routes) {
      if (!points.length || !step2) continue;
      const { person } = walkers[name];
      const dx = points[0].x - person.x, dy = points[0].y - person.y;
      const distance4 = Math.hypot(dx, dy);
      if (distance4 > 1e-7) {
        advanceWalker(name, dx / distance4, dy / distance4, Math.min(step2, distance4));
        if (walkers[name].person === person) {
          stopStairWalk();
          updateAutoWalkStatus(copy.sim_stair_blocked);
          return;
        }
      }
      if (distance4 <= step2) points.shift();
    }
    if (routes.every((route) => !route.points.length)) {
      for (const route of routes) route.entryHeading = walkers[route.name].person.heading;
      travel.crossing = now;
      spaceFollow = false;
      spaceZoom = 1;
      root.setAttribute("data-stair-crossing", "");
      updateStairControls();
      if (view === "3d") renderSpatialDrawing();
      else setView("3d");
    } else renderPerson();
  }
  stairFrame = requestAnimationFrame(tickStairWalk);
}
function startAutoWalk() {
  if (!currentWalker()) return;
  walkControls.stop();
  const network = createWalkNetwork(plan, walkWalls);
  const chooseActivity = createWalkActivities(plan, walkWalls, walkSensors, walkFurniture, network);
  const routes = /* @__PURE__ */ new Map();
  let relocated = false;
  autoWalk = {
    network,
    chooseActivity,
    routes,
    time: performance.now(),
    stairsAt: currentStairTrip() ? performance.now() + 11e3 : null
  };
  for (const [name, walker] of walkersOnFloor()) {
    const { person } = walker;
    const point3 = network.startAt(person);
    if (!point3) continue;
    const queue = name === activeWalker ? ["seat", "fall", "bed"] : ["bed", "seat"];
    const route = { points: [], pause: 0, next: null, playing: null, queue };
    if (!planAutoRoute(route, point3)) continue;
    if (point3 !== person) {
      walkers[name] = startWalker({ ...person, x: point3.x, y: point3.y }, name);
      relocated = true;
    }
    routes.set(name, route);
  }
  if (!routes.size) {
    autoWalk = null;
    updateAutoWalkStatus(copy.sim_auto_blocked);
    return;
  }
  autoWalk.time = performance.now();
  const partial = routes.size < walkersOnFloor().length;
  updateAutoWalkStatus(partial ? copy.sim_auto_partial : relocated ? copy.sim_auto_repositioned : copy.sim_auto_active);
  renderPerson();
  autoWalkFrame = requestAnimationFrame(tickAutoWalk);
}
function playSmokeAlarm() {
  const audio = smokeTestAudio;
  if (audio?.state !== "running") return;
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  const start3 = audio.currentTime + 0.025;
  tone.frequency.value = 880;
  volume.gain.value = 0;
  tone.connect(volume).connect(audio.destination);
  for (let index = 0; index < 3; index++) {
    const at = start3 + index * 0.31;
    volume.gain.setValueAtTime(0, at);
    volume.gain.linearRampToValueAtTime(0.075, at + 0.025);
    volume.gain.setValueAtTime(0.075, at + 0.13);
    volume.gain.linearRampToValueAtTime(0, at + 0.19);
  }
  tone.start(start3);
  tone.stop(start3 + 0.83);
  tone.onended = () => {
    tone.disconnect();
    volume.disconnect();
  };
}
function closeSmokeTestAudio() {
  if (!smokeTestAudio) return;
  void smokeTestAudio.close().catch(() => {
  });
  smokeTestAudio = null;
}
function startWalkTest(kind) {
  const wasRunning = autoWalk?.test === kind;
  stopStairWalk();
  stopAutoWalk();
  if (wasRunning || !currentWalker()) return;
  walkControls.stop();
  const { person } = currentWalker();
  const room = plan.rooms.find((room2) => contains(room2, person));
  if (!room) return;
  const network = createWalkNetwork(plan, walkWalls);
  const chooseActivity = createWalkActivities(plan, walkWalls, walkSensors, walkFurniture, network);
  const point3 = network.startAt(person);
  const activity = point3 && chooseActivity(kind, point3, /* @__PURE__ */ new Set(), room);
  if (!activity) {
    updateAutoWalkStatus(copy["sim_test_no_place_" + kind]);
    return;
  }
  if (kind === "smoke" && activity.detector && window.AudioContext) {
    try {
      smokeTestAudio = new AudioContext();
      void smokeTestAudio.resume().catch(() => {
      });
    } catch {
      smokeTestAudio = null;
    }
  }
  if (point3 !== person) walkers[activeWalker] = startWalker({ ...person, x: point3.x, y: point3.y }, activeWalker);
  const route = { points: activity.points, pause: 0, next: activity, playing: null };
  autoWalk = { test: kind, routes: /* @__PURE__ */ new Map([[activeWalker, route]]), time: performance.now() };
  updateAutoWalkStatus(copy["sim_test_start_" + kind].replace(":room", room.name));
  renderPerson();
  autoWalkFrame = requestAnimationFrame(tickAutoWalk);
}
function planAutoRoute(route, person) {
  const { network, chooseActivity, routes } = autoWalk;
  const occupied = new Set([...routes.values()].map((other) => (other.playing ?? other.next)?.item?.id).filter(Boolean));
  const pending = route.queue.length;
  for (let index = 0; index < pending; index++) {
    const kind = route.queue.shift();
    const next = chooseActivity(kind, person, occupied);
    if (!next) {
      if (occupied.size && (kind === "seat" || kind === "bed")) route.queue.push(kind);
      continue;
    }
    route.next = next;
    route.points = next.points;
    return true;
  }
  route.points = network.routeFrom(person);
  return Boolean(route.points.length);
}
function beginWalkActivity(name, route, now) {
  const walker = walkers[name];
  const activity = route.next;
  route.next = null;
  if (!activity) {
    route.pause = now + 480;
    return settleWalk(name);
  }
  const before = { ...walker.person, pose: "standing", moving: false };
  const pose = activity.kind === "seat" ? "sitting" : activity.kind === "bed" ? "lying" : "standing";
  walker.person = {
    ...before,
    ...activity.point,
    heading: activity.heading,
    moving: false,
    pose,
    elevation: activity.elevation,
    activity: activity.kind
  };
  walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
  route.playing = { ...activity, before, name, started: now };
  updateWalkTest(walker, route.playing, now);
  if (autoWalk.test) updateAutoWalkStatus("");
  route.pause = now + activityDuration[activity.kind];
  return true;
}
function updateWalkTest(walker, activity, now) {
  if (!activity || !["smoke", "fall"].includes(activity.kind)) return false;
  const elapsed = now - activity.started;
  const phase = walkTestPhase(activity.kind, elapsed, reducedMotion.matches);
  if (activity.kind === "smoke") {
    const changed = activity.smokePhase !== phase.smokePhase;
    if (!changed && (reducedMotion.matches || now - activity.lastFrame < 40)) return false;
    activity.lastFrame = now;
    activity.smokePhase = phase.smokePhase;
    walker.person.smokePhase = phase.smokePhase;
    walker.person.smokeTime = elapsed / 1e3;
    if (phase.checked && !activity.checked) {
      activity.checked = true;
      activity.detected = Boolean(activity.detector);
      if (activity.detected) playSmokeAlarm();
    }
    return true;
  }
  if (activity.checked) return false;
  walker.person.fallProgress = phase.fallProgress;
  if (phase.checked) walker.person.pose = "lying";
  walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
  if (phase.checked) {
    activity.detector = walker.readings.find((reading) => reading.signals.some((signal) => signal.radar === "ld6002b" && signal.seen));
    activity.checked = true;
    activity.detected = Boolean(activity.detector);
  }
  return true;
}
function finishWalkActivity(name, route) {
  if (!route.playing) return false;
  walkers[name].person = route.playing.before;
  walkers[name].readings = personSignals(plan, walkers[name].person, walkSensors, walkFurniture, walkSightNow());
  route.playing = null;
  return true;
}
function tickAutoWalk(now) {
  const { routes, time, test } = autoWalk;
  if (autoWalk.stairsAt && now >= autoWalk.stairsAt && [...routes.values()].every((route) => !route.playing)) {
    autoWalk.stairsAt = null;
    if (startStairWalk(true)) return;
  }
  const step2 = Math.min(0.05, Math.max(0, (now - time) / 1e3)) * 1.2;
  autoWalk.time = now;
  let changed = false;
  let completed = false;
  for (const [name, route] of routes) {
    if (updateWalkTest(walkers[name], route.playing, now)) changed = true;
    if (!step2 || route.pause > now) continue;
    if (finishWalkActivity(name, route)) {
      changed = true;
      if (test) {
        routes.delete(name);
        completed = true;
        continue;
      }
    }
    const { person } = walkers[name];
    if (!route.points.length && (test || !planAutoRoute(route, person))) {
      routes.delete(name);
      continue;
    }
    const target = route.points[0];
    if (!target) {
      routes.delete(name);
      continue;
    }
    const x = target.x - person.x, y = target.y - person.y;
    const gap2 = Math.hypot(x, y);
    if (gap2 > 1e-7) {
      if (advanceWalker(name, x / gap2, y / gap2, Math.min(step2, gap2))) changed = true;
      if (person === walkers[name].person) {
        routes.delete(name);
        continue;
      }
    }
    if (gap2 <= step2) {
      route.points.shift();
      if (!route.points.length) {
        if (beginWalkActivity(name, route, now)) changed = true;
      }
    }
  }
  if (changed) renderPerson();
  if (!routes.size) {
    closeSmokeTestAudio();
    autoWalk = null;
    autoWalkFrame = 0;
    updateAutoWalkStatus(completed ? copy["sim_test_finished_" + test] : copy.sim_auto_blocked);
    updateStairPrompt();
    return;
  }
  if (!test && routes.size < walkersOnFloor().length) updateAutoWalkStatus(copy.sim_auto_partial);
  autoWalkFrame = requestAnimationFrame(tickAutoWalk);
}
function chooseBeamForMarker(marker) {
  const choice2 = beamChoices.find((choice3) => choice3.item.id === marker?.dataset.item);
  if (!choice2) return false;
  beamChoice = choice2.key;
  beamKey = null;
  renderPerson();
  return true;
}
function sizeSpaceLabels() {
  if (view !== "3d" || !space.clientWidth) return;
  const { width, height } = space.viewBox.baseVal;
  const pixelsPerUnit = Math.min(space.clientWidth / width, space.clientHeight / height);
  if (!(pixelsPerUnit > 0)) return;
  detailedSpacePeople = pixelsPerUnit >= 50;
  space.style.setProperty("--fp-space-label", `${Math.max(0.27, 9 / pixelsPerUnit)}px`);
  space.style.setProperty("--fp-space-pin", `${Math.max(0.29, 8 / pixelsPerUnit)}px`);
  space.style.setProperty("--fp-space-number", `${Math.max(0.19, 8 / pixelsPerUnit)}px`);
}
function setView(next) {
  if (view === next) return;
  closeSensorTip();
  closeLibrary(false);
  drawingMenu.open = false;
  walkControls.stop();
  stopOrbit();
  cancelAnimationFrame(orbitFrame);
  orbitFrame = 0;
  detectedBeam = null;
  element(view === "3d" ? "fp-person-space-layer" : "fp-person-flat")?.replaceChildren();
  const effects = element(view === "3d" ? "fp-activity-space-layer" : "fp-activity-flat-layer");
  effects?.replaceChildren();
  effects?.removeAttribute("data-effects");
  view = next;
  element("fp-view-mode").textContent = next.toUpperCase();
  root.dataset.view = next;
  const spatial = next === "3d";
  if (!spatial) allFloors = false;
  if (spatial && !["furnish", "move_furniture"].includes(tool)) setTool("edit");
  else updateTools();
  board.hidden = spatial;
  space.toggleAttribute("hidden", !spatial);
  element("fp-space-empty").hidden = true;
  element("fp-space-guide").hidden = true;
  element("fp-space-furniture").hidden = true;
  for (const name of ["2d", "3d"]) {
    root.querySelector(`[data-action="view_${name}"]`).setAttribute("aria-pressed", String(next === name));
    root.querySelectorAll(`[data-legend="${name}"]`).forEach((label) => {
      label.hidden = next !== name;
    });
  }
  renderDrawing();
  renderUnderlay();
  renderFloors();
  if (!spatial) updateView();
  showZoom();
}
function stopOrbit() {
  orbitDrag = null;
  if (!space.hasAttribute("data-orbiting")) return;
  space.removeAttribute("data-orbiting");
  cancelAnimationFrame(orbitFrame);
  orbitFrame = 0;
  if (view === "3d") renderSpatialDrawing();
}
function placeWalkerOnStack(event, floorId) {
  const floor = projectFloors().find((entry) => entry.id === floorId);
  if (!floor?.plan.rooms.length) return;
  let position = null;
  if (event.target.closest(".fp-space-floor")) {
    const point3 = eventPoint(event, space);
    const [, offset2] = projectSpace([0, 0], stackedElevation(floor), spaceCamera);
    const [x, y] = unprojectFloor([point3.x, point3.y - offset2], spaceCamera);
    if (!floor.plan.rooms.some((room) => contains(room, { x, y }))) return;
    const stair = building.staircase;
    if (stair && [stair.lower, stair.upper].includes(floorId) && insideStairwell(stair, { x, y })) return;
    position = { x, y };
  } else if (!event.target.closest("[data-floor-label]")) return;
  if (floorId !== building.activeFloor) {
    stopStairWalk();
    stopAutoWalk();
    walkControls.stop();
    const { person } = currentWalker();
    loadWalkFloor(floorId);
    const room = currentRoom() ?? plan.rooms[0];
    const next = position ?? stairSafeStart(currentStairTrip(), personAt(room, person.pose));
    walkers[activeWalker] = startWalker({ ...person, ...next }, activeWalker);
    updateWalkerControls();
    finish();
  } else if (position) restartWalk(position);
  focusWalkMap();
}
function pickAvatar(target) {
  const name = target.closest("[data-avatar]")?.dataset.avatar;
  if (!simulation || !name || !walkers[name]) return false;
  selectWalker(name);
  focusWalkMap();
  return true;
}
function updateCursor() {
  const marker = element("fp-cursor");
  marker.setAttribute("visibility", cursor ? "visible" : "hidden");
  if (cursor) marker.setAttribute("transform", `translate(${cursor.x} ${cursor.y})`);
}
function updateView() {
  const { clientWidth: width, clientHeight: height } = canvas;
  if (!width || !height) return;
  const viewWidth = camera2.height * width / height;
  const view2 = { x: camera2.x - viewWidth / 2, y: camera2.y - camera2.height / 2, width: viewWidth, height: camera2.height };
  canvas.setAttribute("viewBox", Object.values(view2).join(" "));
  const grid = element("fp-grid-plane");
  Object.entries(view2).forEach(([key, value]) => grid.setAttribute(key, value));
  const pixelsPerMetre = height / camera2.height;
  canvas.style.setProperty("--fp-label-size", `${Math.max(0.238, 11 / pixelsPerMetre)}px`);
  canvas.style.setProperty("--fp-room-size", `${Math.max(0.17, 9 / pixelsPerMetre)}px`);
  canvas.style.setProperty("--fp-corner-radius", `${4.2 / pixelsPerMetre}px`);
  canvas.style.setProperty("--fp-draft-size", `${13 / pixelsPerMetre}px`);
  const scale3 = element("fp-scale");
  const metres2 = pixelsPerMetre > 110 ? 0.5 : pixelsPerMetre > 34 ? 1 : pixelsPerMetre > 15 ? 2 : 5;
  scale3.style.setProperty("--metre", `${metres2 * pixelsPerMetre}px`);
  scale3.lastChild.textContent = `${number3.format(metres2)} m`;
  showZoom();
  refreshSensorTip();
}
function fittedCamera() {
  const items = [...plan.rooms, ...plan.walls, ...plan.doors, ...plan.sensors];
  if (plan.underlay) items.push({ ...plan.underlay, depth: plan.underlay.width / plan.underlay.ratio });
  if (!items.length) return { x: 5, y: 3.5, height: 10 };
  {
    const xs = items.flatMap((item) => [item.x, item.endX ?? item.x + (item.depth ? item.width : 0)]);
    const ys = items.flatMap((item) => [item.y, item.endY ?? item.y + (item.depth ?? 0)]);
    for (const [x, y] of plan.furniture.flatMap(furnitureFootprint)) {
      xs.push(x);
      ys.push(y);
    }
    for (const door of plan.doors) {
      const angle2 = door.angle * Math.PI / 180;
      xs.push(door.x + Math.cos(angle2) * door.width, door.x + Math.sin(angle2) * door.width);
      ys.push(door.y + Math.sin(angle2) * door.width, door.y - Math.cos(angle2) * door.width);
    }
    const [left, right, top2, bottom2] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const { clientWidth, clientHeight } = board.parentElement;
    const topGap = Math.min(simulation ? 235 : 122, clientHeight * 0.29);
    const bottomGap = Math.min(simulation ? 161 : 94, clientHeight * 0.2);
    const usableHeight = Math.max(1, clientHeight - topGap - bottomGap);
    const ratio = clientWidth / usableHeight || 1;
    const height = Math.max(4, bottom2 - top2 + 1.12, (right - left + 1.35) / ratio) * Math.max(1, clientHeight) / usableHeight;
    return {
      x: (left + right) / 2,
      y: (top2 + bottom2) / 2 + (bottomGap - topGap) * height / (2 * Math.max(1, clientHeight)),
      height
    };
  }
}
function fit() {
  camera2 = fittedCamera();
  updateView();
}
function showZoom() {
  if (!zoomBar) return;
  const flat = view !== "3d";
  zoomBar.level.textContent = zoomBar.share.format(flat ? fittedCamera().height / camera2.height : spaceZoom);
  zoomBar.zoomIn.disabled = flat ? camera2.height <= 2 : spaceZoom >= 3.2;
  zoomBar.zoomOut.disabled = flat ? camera2.height >= 280 : spaceZoom <= 1;
}
function zoom(factor, anchor = null) {
  const height = Math.max(2, Math.min(280, camera2.height * factor));
  if (anchor) {
    const scale3 = height / camera2.height;
    camera2.x = anchor.x + (camera2.x - anchor.x) * scale3;
    camera2.y = anchor.y + (camera2.y - anchor.y) * scale3;
  }
  camera2.height = height;
  updateView();
}
function pinchGeometry() {
  const [a, b] = touchPositions.values();
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2,
    distance: Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY))
  };
}
function eventPoint(event, surface = canvas) {
  const point3 = surface.createSVGPoint();
  point3.x = event.clientX;
  point3.y = event.clientY;
  return point3.matrixTransform(surface.getScreenCTM().inverse());
}
function box(first, second) {
  return {
    x: Math.min(first.x, second.x),
    y: Math.min(first.y, second.y),
    width: Math.abs(first.x - second.x),
    depth: Math.abs(first.y - second.y)
  };
}
function nearestEdge(point3, roomBoundary = false, maximumDistance = 0.4, preferredRoom = null) {
  const edges = (preferredRoom ? [preferredRoom] : plan.rooms).flatMap((room) => roomWallEdges(room).map(([a, b]) => ({ ...edgePosition(a, b, point3), roomId: room.id, inRoom: true })));
  for (const wall2 of roomBoundary ? [] : plan.walls) {
    const edge = edgePosition([wall2.x, wall2.y], [wall2.endX, wall2.endY], point3);
    edges.push({ ...edge, facing: edge.angle, roomId: plan.rooms.find((room) => contains(room, edge))?.id });
  }
  let nearest = null, distance4 = maximumDistance;
  for (const edge of edges) {
    const current = Math.hypot(edge.x - point3.x, edge.y - point3.y);
    if (!(current <= distance4) || nearest && current === distance4) continue;
    nearest = edge;
    distance4 = current;
  }
  return nearest;
}
function drawingPoint(point3, free) {
  if (free) return finePoint(point3);
  const grid = limitPoint(point3);
  const edge = nearestEdge(point3);
  const tolerance = Math.min(0.18, camera2.height * 10 / Math.max(1, canvas.clientHeight));
  if (!edge || Math.hypot(edge.x - point3.x, edge.y - point3.y) > tolerance) return grid;
  if (tool === "wall") return finePoint(edge);
  if (Math.abs(edge.a[0] - edge.b[0]) < 1e-3) grid.x = edge.x;
  if (Math.abs(edge.a[1] - edge.b[1]) < 1e-3) grid.y = edge.y;
  return finePoint(grid);
}
function makeItem(type, values) {
  const furnishing = type === "furniture";
  const items = plan[type] ?? [];
  if (items.length >= (furnishing ? maxFurniture : 80)) {
    const message = furnishing ? copy.furniture_limit : copy.limit;
    element(tool === "place" || placingOpening() ? "fp-place-help" : "fp-hint").textContent = message;
    if (furnishing && view === "3d") element("fp-space-placement-text").textContent = message;
    return;
  }
  const item = { id: newId(), ...values };
  const version = ["windows", "mirrors", "zones"].includes(type) ? 3 : type === "rooms" && item.outline ? Math.max(2, plan.version) : plan.version;
  const candidate = { ...plan, version, [type]: [...items, item] };
  if (!validPlan(candidate)) {
    element(tool === "place" || placingOpening() ? "fp-place-help" : "fp-hint").textContent = copy.invalid;
    return;
  }
  remember();
  plan = candidate;
  selected = item.id;
  if (toolRepeats(tool, choice) && type === `${tool}s`) {
    continueTool();
    return true;
  }
  setTool("edit");
  finish();
  if (type === "rooms") {
    showPanel("outline");
    if (plan.rooms.length === 1) {
      fit();
      focusNext();
    }
  } else showInspectorStart();
  if (type === "sensors") {
    announcePosition(item, item, `${copy.placed_status} · ${devices[item.model].name}`);
    if (!items.length) focusNext();
  }
  return true;
}
function continueTool() {
  placedWithTool += 1;
  start2 = null;
  placementPoint = null;
  roomDraft = [];
  ghost.replaceChildren();
  ghost.removeAttribute("data-invalid");
  ghost.removeAttribute("data-preview");
  finish();
  showInspectorStart(root.hasAttribute("data-panel"));
  board.focus({ preventScroll: true });
}
function cornerHitRadius() {
  return Math.min(0.22, canvas.viewBox.baseVal.width * 14 / Math.max(1, canvas.clientWidth));
}
function selectedRoomForHandles() {
  if (tool !== "edit" || view !== "2d" || simulation) return null;
  return plan.rooms.find((room) => room.id === selected);
}
function renderRoomHandles() {
  const room = selectedRoomForHandles();
  const points = room ? interaction?.roomCorner ? roomDraft : roomCorners(room) : [];
  const key = room ? room.id + ":" + points.length : "";
  if (roomHandles.dataset.room !== key) {
    roomHandles.dataset.room = key;
    roomHandleFeedback.textContent = "";
    roomHandles.innerHTML = points.map((_, index) => {
      const label = copy.room_corner_status.replace(":index", number3.format(index + 1)).replace(":total", number3.format(points.length));
      return `<g class="fp-room-handle" data-room-handle="${index}" role="button" tabindex="0"
                aria-label="${escapeText(label)}" aria-describedby="fp-room-handle-keys">
                <circle class="fp-room-handle-hit" r=".08"/><circle class="fp-room-handle-focus" r=".14"/>
                <circle class="fp-room-handle-dot" r=".08"/></g>`;
    }).join("");
    roomMidpoints.innerHTML = points.length < maxRoomCorners ? points.map((_, index) => {
      const label = escapeText(copy.room_midpoint_label.replace(":index", number3.format(index + 1)));
      return `<g class="fp-room-midpoint" data-room-midpoint="${index}" role="button" tabindex="0" aria-label="${label}">
                <title>${label}</title>
                <circle class="fp-room-handle-hit" r=".08"/>
                <circle class="fp-room-midpoint-ring" r=".08"/><circle class="fp-room-midpoint-dot" r=".06"/></g>`;
    }).join("") : "";
  }
  points.forEach(([x, y], index) => {
    const handle = roomHandles.children[index];
    handle.setAttribute("transform", `translate(${x} ${y})`);
    handle.toggleAttribute("data-dragging", Boolean(interaction?.roomCorner && interaction.vertex === index));
  });
  if (!roomMidpoints.childElementCount) return;
  polygonEdges(points).forEach(([[ax, ay], [bx, by]], index) => roomMidpoints.children[index].setAttribute("transform", `translate(${(ax + bx) / 2} ${(ay + by) / 2})`));
}
function highlightRoomMidpoint(point3) {
  const room = selectedRoomForHandles();
  if (!room || !roomMidpoints.childElementCount) return;
  let nearest = -1;
  let distance4 = canvas.viewBox.baseVal.height * 20 / canvas.clientHeight;
  if (point3) polygonEdges(roomCorners(room)).forEach(([a, b], index) => {
    const edge = edgePosition(a, b, point3);
    const gap2 = Math.hypot(edge.x - point3.x, edge.y - point3.y);
    if (gap2 >= distance4) return;
    nearest = index;
    distance4 = gap2;
  });
  for (const midpoint2 of roomMidpoints.children) {
    midpoint2.toggleAttribute("data-near", Number(midpoint2.dataset.roomMidpoint) === nearest);
  }
}
function insertWallMidpoint(points, edge) {
  const [ax, ay] = points[edge];
  const [bx, by] = points[(edge + 1) % points.length];
  points.splice(edge + 1, 0, [(ax + bx) / 2, (ay + by) / 2]);
  return edge + 1;
}
function renderRoomDraft(pointer = null) {
  const editing = tool === "edit_outline";
  if (editing) {
    const [x, y] = roomDraft[draftCorner];
    for (const input of element("fp-room-corner-position").querySelectorAll("input")) {
      input.value = Number((input.dataset.cornerAxis === "x" ? x : y).toFixed(4));
    }
  }
  const points = pointer ? [...roomDraft, [pointer.x, pointer.y]] : roomDraft;
  const shape = points.length > 2 ? "polygon" : "polyline";
  ghost.toggleAttribute("data-invalid", roomDraft.length >= 3 && !outlineBounds(
    roomDraft,
    tool === "zone" || editing && selectedItem().type === "zones" ? { minSpan: 0.1, minArea: 0.025 } : void 0
  ));
  ghost.innerHTML = points.length ? `<${shape} class="fp-outline-draft" points="${points.map((point3) => point3.join(",")).join(" ")}"/>
        ${roomDraft.map(([x, y], index) => `<circle class="fp-outline-corner" cx="${x}" cy="${y}" r=".08"
            data-room-vertex="${index}" data-current="${index === (editing ? draftCorner : 0)}"/>`).join("")}` : "";
}
function saveRoomDraft() {
  if (tool === "zone") {
    const existing = (plan.zones ?? []).find((zone) => zone.id === choice);
    const type2 = existing?.type ?? element("fp-zone-type").value;
    const first = roomDraft[0];
    const room = first && plan.rooms.find((room2) => existing ? room2.id === existing.roomId : contains(room2, { x: first[0], y: first[1] }));
    if (!room) {
      element("fp-hint").textContent = copy.zone_outside;
      return;
    }
    const item2 = existing ? { ...existing, parts: [...existing.parts, roomDraft] } : {
      id: newId(),
      type: type2,
      roomId: room.id,
      parts: [roomDraft],
      name: `${copy["zone_" + type2]} ${(plan.zones?.length ?? 0) + 1}`,
      ...type2 === "entry" ? { direction: "right" } : {}
    };
    const zones = existing ? plan.zones.map((zone) => zone === existing ? item2 : zone) : [...plan.zones ?? [], item2];
    const candidate = { ...plan, version: 3, zones };
    if (!validPlan(candidate)) {
      element("fp-hint").textContent = copy.zone_outside;
      return;
    }
    remember();
    plan = candidate;
    selected = item2.id;
    if (toolRepeats(tool, choice)) {
      continueTool();
      return;
    }
    setTool("edit");
    finish();
    showInspectorStart();
    return;
  }
  const selectedZone = selectedItem();
  if (tool === "edit_outline" && selectedZone.type === "zones") {
    const item2 = selectedZone.item;
    const parts = item2.parts.map((part, i) => i === Number(choice) ? roomDraft : part);
    const candidate = { ...plan, zones: plan.zones.map((zone) => zone === item2 ? { ...zone, parts } : zone) };
    if (!validPlan(candidate)) {
      element("fp-hint").textContent = copy.zone_outside;
      return;
    }
    remember();
    plan = candidate;
    setTool("edit");
    finish();
    board.focus({ preventScroll: true });
    return;
  }
  const geometry = outlineBounds(roomDraft);
  if (!geometry) {
    element("fp-hint").textContent = copy.room_outline_invalid;
    return;
  }
  if (tool === "outline_room") {
    makeItem("rooms", { ...geometry, height: 2.7, name: `${copy.room} ${plan.rooms.length + 1}` });
    return;
  }
  const { type, item } = selectedItem();
  if (type !== "rooms") return;
  const previous = roomCorners(item);
  if (previous.length === roomDraft.length && previous.every(([x, y], index) => x === roomDraft[index][0] && y === roomDraft[index][1])) {
    actions.cancel_outline();
    return;
  }
  if (!applyRoomOutline(item, geometry)) {
    element("fp-hint").textContent = copy.room_outline_invalid;
    return;
  }
  setTool("edit");
  finish();
  showInspectorStart();
  board.focus({ preventScroll: true });
}
function applyRoomOutline(room, geometry) {
  const updated = { ...room, ...geometry };
  const candidate = { ...plan, version: Math.max(2, plan.version), rooms: plan.rooms.map((item) => item === room ? updated : item) };
  for (const key of ["windows", "mirrors"]) if (plan[key]) {
    candidate[key] = plan[key].map((opening) => opening.roomId === room.id ? roomOpening(updated, opening) : opening);
  }
  candidate.doors = plan.doors.map((door) => door.roomId === room.id && doorWall(door, room) ? roomOpening(updated, door, door.width, { preserveDirection: true, minWidth: openingDefaults.door.min }) : door);
  if (!validPlan(candidate)) return false;
  remember();
  plan = candidate;
  if (room.x !== geometry.x || room.y !== geometry.y || room.width !== geometry.width || room.depth !== geometry.depth) clearRoomMounts(room.id);
  return true;
}
function alignSensorToWall(item, room = plan.rooms.find((room2) => contains(room2, item))) {
  if (!isWallMounted(item)) return item;
  const edge = nearestEdge(item, true, Infinity, room);
  const turned = canAimSensor(item) ? item.pan ?? 0 : 0;
  return edge ? { ...item, x: edge.x, y: edge.y, angle: ((edge.facing + turned) % 360 + 360) % 360 } : item;
}
function sensorPlacement(point3) {
  const room = devices[choice].mount === "wall" ? plan.rooms.find((room2) => contains(room2, point3)) : null;
  const middle = room && roomInteriorPoint(room);
  const angle2 = middle && Math.hypot(middle.x - point3.x, middle.y - point3.y) > 0.3 ? directionTo(point3, middle, 45) : 0;
  return alignSensorToWall({
    ...point3,
    angle: angle2,
    model: choice,
    radar: placementDevice?.radar ?? devices[choice].defaultRadar ?? "none",
    installation: placementInstallation,
    ...placementDevice ? {
      haDevice: placementDevice.id,
      mountHeight: placementDevice.mountHeight,
      ...placementDevice.tilt ? { tilt: placementDevice.tilt } : {}
    } : {}
  });
}
function doorWall(door, room = null) {
  const angle2 = door.angle * Math.PI / 180;
  const middle = { x: door.x + Math.cos(angle2) * door.width / 2, y: door.y + Math.sin(angle2) * door.width / 2 };
  const edge = nearestEdge(middle, Boolean(room), 0.04, room);
  return edge && Math.abs(Math.sin(angle2 - edge.angle * Math.PI / 180)) < 0.01 ? edge : null;
}
function openingPlacement(point3) {
  const tolerance = Math.max(0.4, Math.min(1, 22 * camera2.height / canvas.clientHeight));
  const edge = nearestEdge(point3, tool !== "door", tolerance);
  if (!edge) return null;
  const width = openingWidth.valueAsNumber;
  if (!openingWidth.validity.valid || tool !== "door" && !openingHeight.validity.valid) return { edge };
  if (width - edge.length > 1e-7) return { edge, tooWide: true };
  const geometry = wallOpeningPosition(edge, Math.min(width, edge.length), tool === "door" && edge.inRoom);
  return { edge, position: { ...geometry, ...edge.roomId ? { roomId: edge.roomId } : {} } };
}
function renderOpeningPreview(point3) {
  const preview = openingPlacement(point3);
  if (!preview) {
    ghost.replaceChildren();
    ghost.removeAttribute("data-preview");
    return null;
  }
  const { edge: { a, b }, position } = preview;
  const opening = position ? `<g transform="translate(${position.x} ${position.y}) rotate(${position.angle})">
        <path class="fp-opening-preview-span" d="M0 0h${position.width}"/>
        ${tool === "door" ? `<path class="fp-opening-preview-swing" d="M0 0v-${position.width}a${position.width} ${position.width} 0 0 1 ${position.width} ${position.width}"/>` : `<path class="fp-opening-preview-ends" d="M0 -.1v.2 M${position.width} -.1v.2"/>`}
    </g>` : "";
  const markup = `<g class="fp-opening-preview" data-opening="${tool}">
        <line class="fp-opening-preview-wall" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>
        ${opening}</g>`;
  if (ghost.dataset.preview !== markup) {
    ghost.dataset.preview = markup;
    ghost.innerHTML = markup;
  }
  return preview;
}
function openingHelp(preview) {
  if (!preview) return copy.opening_choose_wall;
  if (preview.tooWide) return copy.opening_too_wide.replace(":length", number3.format(preview.edge.length));
  return copy[preview.position ? "opening_ready" : "opening_invalid_dimensions"];
}
function placeOpening() {
  if (!placementPoint) return;
  const preview = openingPlacement(placementPoint);
  if (!preview?.position) return;
  const type = tool + "s";
  const existing = plan[type]?.find((item) => item.id === choice);
  const values = { ...preview.position };
  if (tool !== "door") {
    values.height = openingHeight.valueAsNumber;
    values.base = existing?.base ?? openingDefaults[tool].base;
  }
  if (!existing) {
    makeItem(type, values);
    return;
  }
  const updated = { ...existing, ...values };
  if (!values.roomId) delete updated.roomId;
  const candidate = { ...plan, [type]: plan[type].map((item) => item === existing ? updated : item) };
  if (!validPlan(candidate)) {
    element("fp-place-help").textContent = copy.invalid;
    return;
  }
  remember();
  plan = candidate;
  setTool("edit");
  finish();
  showInspectorStart();
}
function drawAt(point3) {
  if (tool === "outline_room" || tool === "zone") {
    const next = limitPoint(point3);
    const first = roomDraft[0], last = roomDraft.at(-1);
    const zoneEntry = tool === "zone" && element("fp-zone-type").value === "entry";
    if (zoneEntry && roomDraft.length >= 2) return;
    if (first && roomDraft.length >= 3 && (Math.hypot(first[0] - point3.x, first[1] - point3.y) <= cornerHitRadius() || first[0] === next.x && first[1] === next.y)) {
      saveRoomDraft();
      return;
    }
    if (last && last[0] === next.x && last[1] === next.y) return;
    if (roomDraft.length >= maxRoomCorners) {
      element("fp-hint").textContent = copy.room_outline_limit.replace(":count", maxRoomCorners);
      return;
    }
    roomDraft.push([next.x, next.y]);
    updateTools();
    renderRoomDraft();
    return;
  }
  if (tool === "scale_underlay") {
    const image = plan.underlay;
    if (!contains({ ...image, depth: image.width / image.ratio }, point3)) return;
    if (!start2) {
      start2 = point3;
      updateTools();
    } else {
      const length = Math.hypot(point3.x - start2.x, point3.y - start2.y);
      if (length < 0.1) return;
      underlayMeasure = { start: start2, length };
      setTool("edit");
      renderUnderlay();
      element("fp-underlay-distance").focus();
    }
    return;
  }
  if (tool === "furnish" || tool === "move_furniture") {
    const coordinate = (value) => Math.min(100, Math.max(-100, Number(value.toFixed(2))));
    const position = { x: coordinate(point3.x), y: coordinate(point3.y) };
    if (!plan.rooms.some((room) => contains(room, position))) return;
    if (tool === "furnish") {
      makeItem("furniture", furnitureAt(choice, copy.furniture_items[choice], position));
    } else {
      const { item } = selectedItem();
      remember();
      Object.assign(item, position);
      setTool("edit");
      finish();
      showInspectorStart();
    }
    return;
  }
  if (tool === "place") {
    if (integration && !haDevice(placementDevice?.id)) {
      element("fp-place-help").textContent = integration.picker.invalid;
      return;
    }
    const destination = integration && plan.rooms.find((room) => contains(room, point3));
    if (integration && !destination) {
      element("fp-place-help").textContent = integration.picker.inside;
      return;
    }
    if (integration && placementAreaId && destination.haAreaId && destination.haAreaId !== placementAreaId) {
      element("fp-place-help").textContent = integration.picker.wrongArea.replace("{area}", homeAssistantAreaName(destination.haAreaId));
      return;
    }
    makeItem("sensors", sensorPlacement(point3));
    return;
  }
  if (placingOpening()) {
    if (openingPlacement(point3)) {
      placementPoint = point3;
      updateTools();
    } else if (!placementPoint) {
      element("fp-place-help").textContent = copy.opening_wall_missing;
    }
    return;
  }
  if (!start2) {
    start2 = point3;
    updateTools();
    return;
  }
  if (tool === "room") {
    makeItem("rooms", { ...box(start2, point3), height: 2.7, name: `${copy.room} ${plan.rooms.length + 1}` });
  } else {
    makeItem("walls", { ...start2, endX: point3.x, endY: point3.y });
  }
}
function showGhost(point3, anchor = start2) {
  if (placingOpening()) {
    if (!placementPoint) renderOpeningPreview(point3);
    return;
  }
  if (tool === "place") {
    const key = `${point3.x},${point3.y}`;
    if (ghost.dataset.preview !== key) {
      ghost.dataset.preview = key;
      ghost.innerHTML = paintPlacementPreview(plan, sensorPlacement(point3), coverageRadarOptions);
    }
    return;
  }
  if (tool === "outline_room" || tool === "zone") {
    renderRoomDraft(point3);
    return;
  }
  if (tool === "furnish" || tool === "move_furniture") {
    const item = tool === "furnish" ? furnitureAt(choice, "", point3) : { ...selectedItem().item, ...point3 };
    ghost.innerHTML = paintFurniture(item, false, false);
    return;
  }
  if (!anchor) return;
  let mark, x, y, dimensions2;
  if (tool === "room") {
    const room = box(anchor, point3);
    mark = `<rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.depth}"/>`;
    x = room.x + room.width / 2;
    y = room.y + room.depth / 2;
    dimensions2 = `${number3.format(room.width)} × ${number3.format(room.depth)} m`;
  } else {
    mark = `<line x1="${anchor.x}" y1="${anchor.y}" x2="${point3.x}" y2="${point3.y}"/>`;
    if (tool !== "wall") {
      ghost.innerHTML = mark;
      return;
    }
    x = (anchor.x + point3.x) / 2;
    y = (anchor.y + point3.y) / 2;
    dimensions2 = `${number3.format(Math.hypot(point3.x - anchor.x, point3.y - anchor.y))} m`;
  }
  ghost.innerHTML = `${mark}<text class="fp-draft-dimension" x="${x}" y="${y}" dy="-.5em" text-anchor="middle">${dimensions2}</text>`;
}
function endInteraction(event) {
  if (interaction?.pointer !== event.pointerId) return;
  const {
    item,
    type,
    previous,
    original,
    place,
    origin,
    originX,
    originY,
    outline,
    group,
    anchor,
    tapSelection,
    dragged,
    roomCorner,
    midpoint: midpoint2,
    vertex,
    cornerStart
  } = interaction;
  interaction = null;
  if (roomCorner) {
    const [x, y] = roomDraft[vertex];
    const room = selectedRoomForHandles();
    const changed = event.type === "pointerup" && room && (midpoint2 || x !== cornerStart[0] || y !== cornerStart[1]);
    const geometry = changed && outlineBounds(roomDraft);
    roomDraft = [];
    canvas.removeAttribute("data-room-corner-drag");
    ghost.replaceChildren();
    ghost.removeAttribute("data-invalid");
    if (geometry && applyRoomOutline(room, geometry)) {
      recentUndo = copy[midpoint2 ? "room_midpoint_saved" : "room_corner_saved"];
      const frame = canvas.viewBox.baseVal;
      const margin2 = 24 * frame.height / canvas.clientHeight;
      const dx = x - Math.max(frame.x + margin2, Math.min(x, frame.x + frame.width - margin2));
      const dy = y - Math.max(frame.y + margin2, Math.min(y, frame.y + frame.height - margin2));
      if (dx || dy) {
        camera2.x += dx;
        camera2.y += dy;
        updateView();
      }
      finish();
    } else {
      renderRoomHandles();
      if (changed) roomHandleFeedback.textContent = copy.room_outline_invalid;
      else if (event.type === "pointerup" && event.pointerType === "mouse") {
        roomHandles.children[vertex]?.focus({ preventScroll: true });
      }
    }
    return;
  }
  if (tapSelection !== void 0) {
    if (event.type !== "pointerup" || Math.hypot(event.clientX - originX, event.clientY - originY) > 9) return;
    if (plan.sensors.some((sensor) => sensor.id === tapSelection)) {
      openSensorEdit(tapSelection);
      return;
    }
    const changed = selected !== tapSelection;
    selected = tapSelection;
    render();
    inspectMapSelection(selectedItem().type, changed);
    return;
  }
  if (outline && event.type === "pointercancel") {
    roomDraft = outline;
    draftCorner = Math.min(draftCorner, roomDraft.length - 1);
    updateTools();
    renderRoomDraft();
  }
  if (place && event.type === "pointerup") {
    if (anchor) {
      start2 = anchor;
      drawAt(drawingPoint(eventPoint(event), event.shiftKey));
      if (start2) {
        start2 = null;
        ghost.replaceChildren();
      }
    } else if (Math.hypot(event.clientX - originX, event.clientY - originY) <= 9) {
      if (tool === "place" && event.pointerType === "touch") {
        placementPoint = limitPoint(origin);
        showGhost(placementPoint);
        updateTools();
      } else if (tool === "room" || tool === "wall") drawAt(drawingPoint(origin, event.shiftKey));
      else drawAt(["furnish", "move_furniture", "scale_underlay", "outline_room", "zone", "door", "window", "mirror"].includes(tool) ? origin : limitPoint(origin));
    }
  } else if (place && anchor && !start2) {
    ghost.replaceChildren();
  }
  if (item && (item.x !== original.x || item.y !== original.y || item.angle !== original.angle)) {
    lastRoomClick = null;
    if (event.type === "pointercancel" || !validPlan(plan)) {
      plan = JSON.parse(previous);
      render();
      return;
    }
    if (!group && item.levelMountRoom) item.levelMountRoom = null;
    remember(previous);
    if (tool === "move_item") {
      placementOpener = null;
      setTool("edit");
    }
    recentUndo = copy.undo_moved;
    finish();
  } else if (type === "sensors" && tool === "edit" && !dragged && event.type === "pointerup" && Math.hypot(event.clientX - originX, event.clientY - originY) <= 6) {
    openSensorEdit(item.id);
  } else if (type === "rooms" && event.pointerType === "mouse") {
    const { clientX: x, clientY: y, timeStamp: time } = event;
    const clicked = event.type === "pointerup" && Math.hypot(x - originX, y - originY) < 6;
    const previousClick = lastRoomClick;
    lastRoomClick = clicked ? { room: item.id, x, y, time } : null;
    if (clicked && previousClick?.room === item.id && time - previousClick.time < 450 && Math.hypot(x - previousClick.x, y - previousClick.y) < 10) {
      lastRoomClick = null;
      openLibrary(board, { room: item, point: finePoint(origin), x, y });
    }
  }
}
function finishPointer(event) {
  const tracked = touchPositions.delete(event.pointerId);
  if (tracked && pinch) {
    if (!touchPositions.size) pinch = null;
    else if (touchPositions.size >= 2) pinch = pinchGeometry();
    return;
  }
  endInteraction(event);
}
function replacePlan(next) {
  if (simulation) setSimulation(false);
  if (!showStart) remember();
  else {
    stopDemoPreview?.();
    element("fp-start-preview").replaceChildren();
  }
  showStart = false;
  roomFormOpen = false;
  readProject(next);
  allFloors = false;
  underlayMeasure = null;
  selected = plan.sensors[0]?.id;
  setTool("edit");
  showPanel("outline");
  root.removeAttribute("data-panel");
  fit();
  finish();
}
function download(contents, filename, type = "application/json") {
  const url = URL.createObjectURL(contents instanceof Blob ? contents : new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function exportPlan() {
  const project = projectDocument();
  const filename = (project.name.replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-|-$/g, "") || "sensor-plan") + ".json";
  download(JSON.stringify(project, null, 2), filename);
}
function shownProject() {
  const project = projectDocument();
  return project.floors ? { ...project, floors: project.floors.map((floor) => ({ ...floor, plan: visiblePlan(floor.plan) })) } : visiblePlan(project);
}
async function sheetCanvas(page, scale3 = 1.5) {
  const image = new Image();
  image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(page.svg);
  await image.decode();
  const canvas2 = document.createElement("canvas");
  canvas2.width = Math.round(page.width * scale3);
  canvas2.height = Math.round(page.height * scale3);
  canvas2.getContext("2d").drawImage(image, 0, 0, canvas2.width, canvas2.height);
  return canvas2;
}
async function saveSheet(kind) {
  const status = element("fp-save");
  const project = shownProject();
  const pages = sheetPages(project, {
    copy,
    number: number3,
    radarOptions: coverageRadarOptions,
    date: (/* @__PURE__ */ new Date()).toLocaleDateString(root.dataset.locale, { dateStyle: "long" })
  });
  if (!pages.length) {
    status.textContent = copy.sheet_empty;
    return;
  }
  const button = fileButtons[kind === "pdf" ? "sheet_pdf" : "sheet_image"];
  button.disabled = true;
  try {
    if (kind === "pdf") {
      const images = [];
      for (const page of pages) {
        const canvas2 = await sheetCanvas(page);
        const file = await canvasFile(canvas2, "image/jpeg", 0.92);
        images.push({ jpeg: new Uint8Array(await file.arrayBuffer()), width: canvas2.width, height: canvas2.height });
      }
      download(
        new Blob([pdfDocument(images, { title: project.name, creator: copy.sheet_credit })], { type: "application/pdf" }),
        sheetFileName(project, "pdf")
      );
    } else {
      const open = sheetFloors(project).findIndex((floor) => floor.id === building?.activeFloor);
      const page = pages[Math.max(0, open)];
      download(
        await canvasFile(await sheetCanvas(page), "image/png"),
        sheetFileName(pages.length > 1 ? { name: `${project.name} ${page.name}` } : project, "png")
      );
    }
    status.textContent = copy.sheet_done;
  } catch {
    status.textContent = copy.sheet_error;
  } finally {
    button.disabled = false;
  }
}
async function pictureFile(source) {
  const canvas2 = document.createElement("canvas");
  if (source.data) {
    canvas2.width = source.width;
    canvas2.height = source.height;
    canvas2.getContext("2d").putImageData(new ImageData(source.data, source.width, source.height), 0, 0);
  } else {
    const url = URL.createObjectURL(source);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const scale3 = 1600 / Math.max(image.naturalWidth || 1600, image.naturalHeight || 1600);
      canvas2.width = Math.round((image.naturalWidth || 1600) * scale3);
      canvas2.height = Math.round((image.naturalHeight || 1200) * scale3);
      canvas2.getContext("2d").drawImage(image, 0, 0, canvas2.width, canvas2.height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return canvasFile(canvas2, "image/png");
}
async function useVacuumMap(id) {
  const picked = integration.picker;
  const status = element(showStart ? "fp-start-status" : "fp-save");
  const original = plan;
  status.toggleAttribute("data-busy", true);
  status.textContent = picked.vacuumLoading;
  try {
    let file = await integration.vacuumMap(id);
    const map = await embeddedMap(new Uint8Array(await file.arrayBuffer()));
    const drawn = map && mapRooms(map, { roomName: copy.room });
    if (map && !drawn) throw new Error("Empty map");
    if (drawn) file = await pictureFile(drawn.image);
    else if (file.type.startsWith("image/svg")) file = await pictureFile(file);
    const image = await loadUnderlay(file);
    if (!image || plan !== original) {
      status.textContent = "";
      return;
    }
    if (showStart) replacePlan({ ...blankPlan(copy.names.untitled), underlay: image });
    else {
      remember();
      plan.underlay = image;
    }
    underlayMeasure = null;
    setView("2d");
    setTool("edit");
    status.textContent = "";
    if (!drawn) {
      finish();
      fit();
      actions.trace_underlay();
      return;
    }
    const draft = draftFromRecognition(drawn.recognition, plan.underlay, { roomName: copy.room });
    const rooms = (draft?.rooms ?? []).filter((room) => !plan.rooms.some((existing) => roomContains(existing, roomInteriorPoint(room))));
    const next = rooms.length && planWithDraft(plan, { ...draft, rooms });
    if (next) plan = next;
    else if (draft) plan.underlay = draft.underlay;
    finish();
    fit();
    element("fp-save").textContent = picked.vacuumRooms.replace("{count}", number3.format(next ? rooms.length : 0));
  } catch {
    status.textContent = picked.vacuumError;
  } finally {
    status.removeAttribute("data-busy");
  }
}
function openVacuumMaps() {
  if (!vacuumChoice) return;
  projectMenu.open = false;
  const maps = integration.vacuumMaps();
  if (!maps.length) {
    element(showStart ? "fp-start-status" : "fp-save").textContent = integration.picker.vacuumNone;
    return;
  }
  if (maps.length === 1) {
    useVacuumMap(maps[0].id);
    return;
  }
  vacuumChoice.list.replaceChildren(...maps.map((map) => {
    const button = document.createElement("button");
    button.type = "submit";
    button.value = map.id;
    button.textContent = map.name;
    return button;
  }));
  vacuumChoice.dialog.onclose = () => {
    const id = vacuumChoice.dialog.returnValue;
    if (maps.some((map) => map.id === id)) useVacuumMap(id);
  };
  vacuumChoice.dialog.returnValue = "";
  vacuumChoice.dialog.showModal();
}
function projectToShare() {
  const bare = ({ underlay, ...floorPlan }) => floorPlan;
  const project = projectDocument();
  return project.floors ? { ...project, floors: project.floors.map((floor) => ({ ...floor, plan: bare(floor.plan) })) } : bare(project);
}
function showShare(message = "", url = "") {
  const { create, copyLink, field: field2, link, note } = sharePanel;
  note.textContent = message;
  note.hidden = !message;
  field2.hidden = !url;
  link.value = url;
  create.hidden = Boolean(url);
  copyLink.hidden = !url;
  sharePanel.close.textContent = url ? copy.tool_done ?? copy.cancel_place : copy.cancel_place;
}
function openShare() {
  if (!sharePanel) return;
  projectMenu.open = false;
  showShare();
  sharePanel.create.disabled = false;
  sharePanel.dialog.showModal();
}
async function openSharedPlan() {
  try {
    const project = await sharing.open();
    if (!validProject(project)) throw new Error("No plan");
    if (!showStart) return;
    replacePlan(project);
    element("fp-save").textContent = copy.share_opened ?? "";
  } catch {
    if (showStart) element("fp-start-status").textContent = copy.share_missing ?? "";
  }
}
function clearRoomMounts(roomId) {
  plan.sensors.forEach((sensor) => {
    if (sensor.levelMountRoom === roomId) sensor.levelMountRoom = null;
  });
}
function cancelPlacement() {
  const returnToInspector = tool === "move_item" && placementOpener?.closest("#fp-sidebar");
  setTool("edit");
  if (returnToInspector) root.setAttribute("data-panel", "");
  placementOpener?.focus();
  placementOpener = null;
}
function askRoomRemoval(room) {
  if (roomRemoval.open) return;
  element("fp-room-delete-text").textContent = copy.room_delete_text.replaceAll(":name", room.name);
  roomRemoval.returnValue = "";
  roomRemoval.onclose = () => {
    roomRemoval.onclose = null;
    if (roomRemoval.returnValue === "delete" && selectedItem().item?.id === room.id) removeSelected();
    if (view === "2d") board.focus({ preventScroll: true });
  };
  roomRemoval.showModal();
}
function removeSelected() {
  {
    const { type, item } = selectedItem();
    if (!item) return;
    remember();
    plan[type] = plan[type].filter((entry) => entry.id !== item.id);
    if (type === "rooms") {
      clearRoomMounts(item.id);
      for (const key of ["windows", "mirrors", "zones"]) if (plan[key]) plan[key] = plan[key].filter((entry) => entry.roomId !== item.id);
      plan.doors = plan.doors.map((door) => door.roomId === item.id ? { ...door, roomId: void 0 } : door);
    }
    if (type === "sensors" && plan.zones) plan.zones = removeZonesOwnedBySensor(plan.zones, item.id);
    selected = null;
    recentUndo = copy.undo_removed;
    finish();
  }
}
function readField(item, key) {
  if (key === "ceilingType") return item.ceiling?.type ?? "flat";
  if (key === "levelMount") return Boolean(item.levelMountRoom && item.levelMountRoom === currentRoom()?.id);
  if (key === "ceilingHigh") return item.ceiling?.high;
  if (key === "ceilingDirection") return item.ceiling?.direction;
  if (key === "mountHeight") return item.mountHeight ?? 1.4;
  if (key === "tilt" || key === "pan") return item[key] ?? 0;
  if (key === "sensorId") return item.sensorId ?? "";
  return item[key];
}
function updateField(input) {
  const { item, type } = selectedItem();
  if (!item || !input.validity.valid) {
    input.reportValidity();
    return;
  }
  const key = input.dataset.field;
  const raw = input.value.trim();
  const decimal = input.hasAttribute("data-decimal");
  const value = decimal ? /^\d+(?:[.,]\d+)?$/.test(raw) ? Number(raw.replace(",", ".")) : NaN : input.type === "number" ? input.valueAsNumber : input.type === "checkbox" ? input.checked : raw;
  const original = readField(item, key);
  if (value === original) return;
  const previous = JSON.stringify(plan);
  const savedItem = { ...item };
  const group = type === "rooms" && ["x", "y"].includes(key) ? Object.values(roomContents(plan, item)).flat() : null;
  const isCeilingField = key.startsWith("ceiling") || key === "height" && type === "rooms";
  if (key === "ceilingType") {
    if (value === "flat") item.ceiling = null;
    else {
      const max = ceilingHeightLimits[1];
      if (item.height === max) item.height = max - 0.6;
      const direction2 = item.ceiling?.direction ?? "x+";
      item.ceiling = {
        type: value,
        high: item.ceiling?.high ?? Math.min(max, item.height + 0.6),
        direction: value === "gable" ? direction2[0] + "+" : direction2
      };
    }
  } else if (key === "floorFinish" || key === "wallColor") {
    if (value) item[key] = value;
    else delete item[key];
  } else if (key === "levelMount") {
    item.levelMountRoom = value ? currentRoom()?.id : null;
  } else if (key === "ceilingHigh" || key === "ceilingDirection") {
    item.ceiling = { ...item.ceiling, [key === "ceilingHigh" ? "high" : "direction"]: value };
  } else if (group) {
    for (const entry of group) Object.assign(entry, translatedItem(entry, key === "x" ? value - original : 0, key === "y" ? value - original : 0));
  } else if (type === "sensors" && (key === "installation" || key === "pan" || ["x", "y"].includes(key) && isWallMounted(item))) {
    Object.assign(item, alignSensorToWall({ ...item, [key]: value }, roomForDevice(plan.rooms, item)));
  } else if (key === "width" && ["windows", "mirrors"].includes(type)) {
    Object.assign(item, roomOpening(currentRoom(), item, value));
    input.value = item.width;
  } else if (key === "width" && type === "doors") {
    const edge = doorWall(item);
    if (edge && edge.length >= openingDefaults.door.min) {
      const reversed = Math.cos((item.angle - edge.angle) * Math.PI / 180) < 0;
      Object.assign(item, wallOpeningPosition(edge, Math.min(value, edge.length), reversed));
    } else item.width = value;
    input.value = item.width;
  } else {
    item[key] = key === "sensorId" ? value || null : value;
  }
  if (type === "mirrors" && key === "protectionEnabled" && value && [void 0, 2].includes(item.reflectionDepthM)) item.reflectionDepthM = reflectionDepth(item);
  if (type === "sensors") {
    if (!item.tilt) delete item.tilt;
    if (!item.pan || !isWallMounted(item)) delete item.pan;
  }
  const validationPlan = key === "ceilingType" && value === "flat" ? { ...plan, sensors: plan.sensors.map((sensor) => sensor.levelMountRoom === item.id ? { ...sensor, levelMountRoom: null } : sensor) } : plan;
  if (!validPlan(validationPlan)) {
    if (group) plan = JSON.parse(previous);
    Object.assign(item, savedItem);
    if (!Object.hasOwn(savedItem, key)) delete item[key];
    input.value = decimal ? number3.format(original) : original;
    const message = isCeilingField ? copy.ceiling_invalid : copy.invalid;
    input.setCustomValidity(message);
    input.reportValidity();
    input.setCustomValidity("");
    element("fp-hint").textContent = message;
    return;
  }
  if (isCeilingField) clearRoomMounts(item.id);
  if (type === "rooms" && key === "name" && item.useSampleName) item.useSampleName = false;
  if (type === "sensors" && (key === "x" || key === "y") && item.levelMountRoom) item.levelMountRoom = null;
  if (decimal) input.value = number3.format(value);
  remember(previous);
  save();
  updateTools();
  renderDrawing();
  renderHandoff();
  const row = root.querySelector(`[data-select="${item.id}"]`);
  if (key === "name") {
    if (type === "rooms" && row) row.querySelector("span")?.replaceChildren(value);
    element("fp-inspector-title").textContent = value;
  }
  if (type === "furniture") renderFurnitureList();
  if (type === "rooms") renderRoomMetrics(item);
  if (type === "zones" && key === "name") renderLists();
  if (key === "radar") {
    row?.querySelector("small")?.replaceChildren(radarLabel(item));
    updateRangeKey(item);
  }
  if (type === "sensors" && (key === "installation" || ["x", "y"].includes(key) && isWallMounted(item)) || type === "mirrors" && key === "protectionEnabled") {
    const restore = document.activeElement === input;
    renderInspector();
    if (restore) element("fp-inspector").querySelector(`[data-field="${key}"]`)?.focus({ preventScroll: true });
  }
  if (type === "sensors") updateSensorDetails(item);
  if (key === "ceilingType") {
    const restore = document.activeElement === input;
    renderInspector();
    if (restore) focusCeilingType();
  } else if (type === "rooms" && item.ceiling && (isCeilingField || key === "width" || key === "depth")) {
    element("fp-ceiling-profile").innerHTML = crossSection2(item);
  }
}
async function openOrder(opener) {
  if (orderButton.disabled) return;
  stopAutoWalk();
  walkControls.stop();
  orderButton.disabled = true;
  orderStep.disabled = true;
  try {
    const { openPlannerOrder: openPlannerOrder2 } = await Promise.resolve().then(() => (init_floor_planner_order(), floor_planner_order_exports));
    const project = projectDocument();
    openPlannerOrder2(building ? { ...project, floors: project.floors.map((floor) => ({ ...floor, label: floorLabel(floor, copy) })) } : plan, copy, opener);
  } catch {
    element("fp-event").textContent = copy.order_error;
  } finally {
    orderButton.disabled = false;
    orderStep.disabled = false;
  }
}
var element, root, canvas, board, drawing, ghost, roomMidpoints, roomHandles, roomHandleFeedback, space, sensorTip, stage, stairPrompt, simGuide, simCast, simTools, simMenus, simReading, sensorEdit, pdfPages, imageParts, sensorEditForm, projectMenu, projectTrigger, floorMenu, floorTrigger, drawingMenu, toolbox, viewMenu, library, sidebar, compactLibrary, libraryIsOpen, libraryButton, roomForm, roomStep, sensorStep, testStep, orderStep, extraSensor, copy, integration, appPlanner, recogniseRooms, recognition, tracing, fileButtons, vacuumChoice, automationPanel, sharePanel, zoomBar, sensorAim, doorActions, roomRemoval, coverageRadarOptions, coverageEstimateLabel, coverageEstimateLegend, motionLegend, liveMode, livePeople, openingWidth, openingHeight, openingDefaults, number3, tenth, maxProjectFileSize, reducedMotion, sharedRoom, demo, exampleHome, sharedPlan, storageKey, withEditableFurniture, demoHome, building, plan, showStart, stopDemoPreview, roomFormOpen, placementInstallation, placementDevice, allFloors, floorSeparation, showMeasures, tool, placingOpening, choice, placedWithTool, start2, roomDraft, draftCorner, selected, showCoverage, showHeatmap, heatCache, beamChoices, beamChoice, beamKey, beamPanelKey, detectedBeam, inspectedMarker, sensorTipTimer, editingSensor, view, spaceCamera, spaceBounds, spaceZoom, wallMode, daylight, detailedSpacePeople, spaceFollow, orbitDrag, orbitFrame, ignoreSpaceClick, simulation, reviewedCoverage, walkers, activeWalker, currentWalker, walkFloorId, walkersOnFloor, walkWalls, walkSensors, walkFurniture, walkSight, heldDoors, heldDoorPaint, readingKey, autoWalk, autoWalkFrame, stairWalk, stairFrame, camera2, interaction, touchPositions, pinch, ignoreTouchClick, recentUndo, cursor, underlayMeasure, libraryOpener, libraryPanelWasOpen, quickPlacement, placementPoint, catalogMount, catalogRoomId, catalogAreaOnly, placementAreaId, lastRoomClick, placementOpener, furnitureOpener, history, future, unreadableDraft, sharedPending, currentStairTrip, deviceIcon, homeAssistantAreas, homeAssistantFloors, roomById, linkedAreaIds, homeAssistantAreaName, visiblePlan, furnitureDialog, sensorMarkerAt, field, mirrorReflectionCopy, heightField, options, viewSwitchIcons, viewSwitches, heatToggle, heatLegend, direction, wasd, walkControls, smokeTestAudio, limitPoint, finePoint, isWallMounted, canvasFile, actions, orderButton;
var init_floor_planner2 = __esm({
  "src/js/floor-planner.js"() {
    init_floor_planner();
    init_ceilsense_planner();
    init_floor_planner_ceiling();
    init_floor_planner_model();
    init_floor_planner_drawing();
    init_floor_planner_geometry();
    init_floor_planner_furniture();
    init_floor_planner_space();
    init_floor_planner_building();
    init_floor_planner_stairs();
    init_floor_planner_beam();
    init_floor_planner_radar();
    init_floor_planner_aim();
    init_floor_planner_person();
    init_floor_planner_person_input();
    init_floor_planner_live();
    init_floor_planner_walk_route();
    init_floor_planner_activity();
    init_floor_planner_obstruction();
    init_floor_planner_maquette();
    init_floor_planner_daylight();
    init_floor_planner_heatmap();
    init_floor_planner_sight();
    init_floor_planner_zones();
    init_floor_planner_underlay();
    init_floor_planner_trace();
    init_floor_planner_vacuum();
    init_floor_planner_tools();
    init_floor_planner_account();
    init_floor_planner_sheet();
    init_floor_planner_recognise();
    init_floor_planner_home_assistant();
    element = (id) => document.getElementById(id);
    root = element("floor-planner");
    canvas = element("fp-plan");
    board = element("fp-board");
    drawing = element("fp-drawing");
    ghost = element("fp-ghost");
    roomMidpoints = element("fp-room-midpoints");
    roomHandles = element("fp-room-handles");
    roomHandleFeedback = element("fp-room-handle-feedback");
    space = element("fp-space");
    sensorTip = element("fp-sensor-tip");
    stage = element("fp-walk-stage");
    stairPrompt = element("fp-stair-prompt");
    simGuide = element("fp-sim-guide");
    simCast = element("fp-sim-cast");
    simTools = element("fp-sim-tools");
    simMenus = [simCast, simTools];
    simReading = root.querySelector('[data-action="show_readings"]');
    sensorEdit = element("fp-sensor-edit");
    pdfPages = element("fp-pdf-pages");
    imageParts = element("fp-crop");
    sensorEditForm = element("fp-sensor-edit-form");
    projectMenu = element("fp-project-menu");
    projectTrigger = projectMenu.querySelector("summary");
    floorMenu = element("fp-floor-menu");
    floorTrigger = floorMenu.querySelector("summary");
    drawingMenu = element("fp-drawing-menu");
    toolbox = element("fp-toolbox");
    viewMenu = element("fp-view-menu");
    library = element("fp-library");
    sidebar = element("fp-sidebar");
    compactLibrary = matchMedia("(max-width: 760px)");
    libraryIsOpen = () => sidebar.hasAttribute("data-library") || library.matches(":popover-open");
    libraryButton = root.querySelector('[data-action="library"]');
    roomForm = element("fp-room-form");
    roomStep = root.querySelector('[data-action="flow_room"]');
    sensorStep = root.querySelector('[data-action="flow_sensor"]');
    testStep = root.querySelector('[data-action="test_person"]');
    orderStep = root.querySelector('[data-action="next_order"]');
    extraSensor = root.querySelector('[data-action="next_extra_sensor"]');
    copy = JSON.parse(element("fp-copy").textContent);
    integration = globalThis.floorPlannerHost;
    appPlanner = integration?.mode === "app";
    recogniseRooms = (integration ? integration.recognise : recognise) || null;
    recognition = recogniseRooms && copy.recognise_action ? (() => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fp-recognise";
      button.dataset.action = "recognise_underlay";
      button.textContent = copy.recognise_action;
      const note = document.createElement("p");
      note.className = "fp-note fp-recognise-note";
      note.setAttribute("role", "status");
      const controls = document.getElementById("fp-underlay-controls");
      controls.insertBefore(button, controls.querySelector('[data-action="scale_underlay"]'));
      const meter = document.createElement("span");
      meter.className = "fp-recognise-meter";
      meter.hidden = true;
      const bar = document.createElement("progress");
      bar.max = 100;
      bar.setAttribute("aria-label", copy.recognise_action);
      const share2 = document.createElement("span");
      share2.setAttribute("aria-hidden", "true");
      meter.append(bar, share2);
      controls.append(meter, note);
      const drawn = (name) => document.createElementNS("http://www.w3.org/2000/svg", name);
      const scan = drawn("g");
      scan.setAttribute("class", "fp-underlay-scan");
      scan.setAttribute("pointer-events", "none");
      scan.setAttribute("hidden", "");
      const light = drawn("linearGradient");
      light.id = "fp-underlay-scan-light";
      for (const [offset2, opacity] of [[0, 0], [0.5, 0.55], [1, 0]]) {
        const stop = drawn("stop");
        stop.setAttribute("offset", offset2);
        stop.setAttribute("stop-opacity", opacity);
        light.append(stop);
      }
      const frame = drawn("svg");
      const tint = drawn("rect"), beam = drawn("rect");
      tint.setAttribute("class", "fp-underlay-scan-tint");
      beam.setAttribute("class", "fp-underlay-scan-beam");
      beam.setAttribute("fill", "url(#fp-underlay-scan-light)");
      for (const [shape, width] of [[tint, "100%"], [beam, "16%"]]) {
        shape.setAttribute("width", width);
        shape.setAttribute("height", "100%");
      }
      frame.append(tint, beam);
      scan.append(light, frame);
      document.getElementById("fp-underlay").after(scan);
      const percentage = new Intl.NumberFormat(root.dataset.locale, { style: "percent" });
      return { button, note, meter, bar, share: share2, scan, frame, percentage, timer: 0, state: "idle", image: null, pending: null };
    })() : null;
    tracing = copy.trace_action ? (() => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = "trace_underlay";
      button.textContent = copy.trace_action;
      const note = document.createElement("p");
      note.className = "fp-note fp-recognise-note";
      note.setAttribute("role", "status");
      note.hidden = true;
      const controls = document.getElementById("fp-underlay-controls");
      controls.insertBefore(button, controls.querySelector('[data-action="scale_underlay"]'));
      controls.append(note);
      return { button, note, busy: false, pending: false, image: null };
    })() : null;
    fileButtons = (() => {
      const files = root.querySelector(".fp-project-files");
      if (!files) return {};
      const made = {};
      for (const [action, label, drawing2, after] of [
        [
          "vacuum_map",
          integration?.vacuumMaps && integration.picker.vacuumAction,
          '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.2"/><path d="M10 3v2.3m-5.4 1 1.7 1.4m9.1-1.4-1.7 1.4"/>',
          "import_underlay"
        ],
        ["sheet_image", copy.sheet_image, '<rect x="3" y="4" width="14" height="12" rx="1.5"/><path d="m3 13 4-4 3 3 2-2 5 5m-4-7h.1"/>', "export"],
        ["sheet_pdf", copy.sheet_pdf, '<path d="M5 2.5h6l4 4v11H5zM11 2.5v4h4M7.5 11h5m-5 3h5"/>', "sheet_image"],
        ["share", sharing && copy.share_action, '<path d="M8.6 11.4a3 3 0 0 0 4.2 0l2.7-2.7a3 3 0 0 0-4.2-4.2l-1 1m1.1 3.1a3 3 0 0 0-4.2 0l-2.7 2.7a3 3 0 0 0 4.2 4.2l1-1"/>', "sheet_pdf"]
      ]) {
        if (!label) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.action = action;
        button.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${drawing2}</svg>`;
        button.append(" " + label);
        (made[after] ?? files.querySelector(`[data-action="${after}"]`) ?? files.querySelector('[data-action="export"]') ?? files.lastElementChild).after(button);
        made[action] = button;
      }
      return made;
    })();
    if (fileButtons.vacuum_map) {
      const offer = () => {
        fileButtons.vacuum_map.hidden = !integration.robotVacuum();
      };
      offer();
      projectMenu.addEventListener("toggle", offer);
    }
    vacuumChoice = fileButtons.vacuum_map ? (() => {
      const picked = integration.picker;
      const dialog = document.createElement("dialog");
      dialog.className = "fp-furniture-dialog fp-sensor-edit fp-vacuum-maps";
      dialog.id = "fp-vacuum-maps";
      dialog.setAttribute("aria-labelledby", "fp-vacuum-title");
      dialog.setAttribute("aria-describedby", "fp-vacuum-text");
      dialog.innerHTML = `<div class="fp-furniture-heading"><div><h2 id="fp-vacuum-title"></h2><p id="fp-vacuum-text"></p></div></div>
        <form method="dialog"><div class="fp-sensor-edit-body fp-vacuum-list"></div>
        <div class="fp-sensor-edit-footer"><button type="submit" value=""></button></div></form>`;
      dialog.querySelector("h2").textContent = picked.vacuumTitle;
      dialog.querySelector("#fp-vacuum-text").textContent = picked.vacuumIntro;
      dialog.querySelector(".fp-sensor-edit-footer button").textContent = copy.cancel_place;
      document.getElementById("fp-pdf-pages").after(dialog);
      return { dialog, list: dialog.querySelector(".fp-vacuum-list") };
    })() : null;
    automationPanel = integration?.presenceLights ? (() => {
      const picked = integration.picker;
      const dialog = document.createElement("dialog");
      dialog.className = "fp-furniture-dialog fp-sensor-edit fp-room-automation";
      dialog.id = "fp-room-automation";
      dialog.setAttribute("aria-labelledby", "fp-automation-title");
      dialog.setAttribute("aria-describedby", "fp-automation-text");
      dialog.innerHTML = `<div class="fp-furniture-heading"><div><h2 id="fp-automation-title"></h2><p id="fp-automation-text"></p></div></div>
        <form method="dialog"><div class="fp-sensor-edit-body">
            <p class="fp-note" data-automation="lights" hidden></p>
            <label data-automation="minutes" hidden><span></span><input type="number" min="1" max="120" step="1" inputmode="numeric" required></label>
            <label class="fp-sensor-edit-check" data-automation="dark" hidden><input type="checkbox"> <span></span></label>
            <p class="fp-note" role="status" hidden></p>
            <a data-automation="open" target="_blank" rel="noopener" hidden></a>
        </div>
        <div class="fp-sensor-edit-footer">
            <button type="submit" value=""></button>
            <button type="button" data-automation="remove" hidden></button>
            <button type="button" class="fp-primary" data-automation="save" hidden></button>
        </div></form>`;
      const part = (name) => dialog.querySelector(`[data-automation="${name}"]`);
      dialog.querySelector("h2").textContent = picked.automationTitle;
      part("minutes").firstElementChild.textContent = picked.automationMinutes;
      part("dark").lastElementChild.textContent = picked.automationDark;
      part("remove").textContent = picked.automationRemove;
      part("open").textContent = picked.automationOpen;
      document.getElementById("fp-pdf-pages").after(dialog);
      return {
        dialog,
        text: dialog.querySelector("#fp-automation-text"),
        lights: part("lights"),
        minutes: part("minutes"),
        dark: part("dark"),
        note: dialog.querySelector('[role="status"]'),
        open: part("open"),
        remove: part("remove"),
        save: part("save"),
        close: dialog.querySelector(".fp-sensor-edit-footer button"),
        room: null
      };
    })() : null;
    sharePanel = fileButtons.share ? (() => {
      const dialog = document.createElement("dialog");
      dialog.className = "fp-furniture-dialog fp-sensor-edit fp-share";
      dialog.id = "fp-share";
      dialog.setAttribute("aria-labelledby", "fp-share-title");
      dialog.setAttribute("aria-describedby", "fp-share-text");
      dialog.innerHTML = `<div class="fp-furniture-heading"><div><h2 id="fp-share-title"></h2><p id="fp-share-text"></p></div></div>
        <div class="fp-sensor-edit-body">
            <label class="fp-share-link" hidden><span></span><input type="text" readonly></label>
            <p class="fp-note" role="status" hidden></p>
        </div>
        <form method="dialog"><div class="fp-sensor-edit-footer">
            <button type="submit" value=""></button>
            <button type="button" class="fp-primary" data-share="create"></button>
            <button type="button" class="fp-primary" data-share="copy" hidden></button>
        </div></form>`;
      dialog.querySelector("h2").textContent = copy.share_title;
      dialog.querySelector("#fp-share-text").textContent = copy.share_intro;
      const [close, create, copyLink] = dialog.querySelectorAll("button");
      close.textContent = copy.cancel_place;
      create.textContent = copy.share_create;
      copyLink.textContent = copy.share_copy;
      const field2 = dialog.querySelector(".fp-share-link");
      field2.firstElementChild.textContent = copy.share_label;
      document.getElementById("fp-pdf-pages").after(dialog);
      return { dialog, close, create, copyLink, field: field2, link: field2.querySelector("input"), note: dialog.querySelector('[role="status"]') };
    })() : null;
    zoomBar = copy.zoom_in && copy.zoom_out && copy.fit ? (() => {
      const bar = document.createElement("div");
      bar.className = "fp-zoom-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", copy.zoom_controls ?? copy.zoom_in);
      const button = (action, label, drawing2) => {
        const control = document.createElement("button");
        control.type = "button";
        control.dataset.action = action;
        control.title = label;
        control.setAttribute("aria-label", label);
        control.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${drawing2}"/></svg>`;
        return control;
      };
      const zoomIn = button("map_zoom_in", copy.zoom_in, "M4 10h12m-6-6v12");
      const level = document.createElement("output");
      level.className = "fp-zoom-level";
      const zoomOut = button("map_zoom_out", copy.zoom_out, "M4 10h12");
      const whole = button("map_fit", copy.fit, "M7 3H3v4m10-4h4v4m0 6v4h-4m-6 0H3v-4");
      bar.append(zoomIn, level, zoomOut, whole);
      document.getElementById("fp-walk-stage").append(bar);
      return { zoomIn, zoomOut, level, share: new Intl.NumberFormat(root.dataset.locale, { style: "percent", maximumFractionDigits: 0 }) };
    })() : null;
    sensorAim = ["aim_top", "aim_side", "aim_turn", "aim_tilt", "aim_reach"].every((key) => copy[key]) ? (() => {
      const box2 = document.createElement("div");
      box2.className = "fp-aim";
      box2.hidden = true;
      const views = document.createElement("div");
      views.className = "fp-aim-views";
      const part = (view2, caption, name, title) => {
        const figure = document.createElement("figure");
        figure.className = "fp-aim-view";
        figure.dataset.view = view2;
        const heading = document.createElement("figcaption");
        heading.textContent = caption;
        const drawing2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        drawing2.setAttribute("aria-hidden", "true");
        const row = document.createElement("div");
        row.className = "fp-aim-row";
        const label = document.createElement("label");
        const text2 = document.createElement("span");
        text2.textContent = title;
        const words = document.createElement("output");
        const slider = document.createElement("input");
        Object.assign(slider, { type: "range", step: 1, id: `fp-aim-${name}`, disabled: true });
        label.htmlFor = slider.id;
        label.append(text2, words);
        const input = document.createElement("input");
        Object.assign(input, { name, type: "number", step: 1, required: true, disabled: true });
        input.setAttribute("aria-label", title);
        row.append(label, slider, input);
        figure.append(heading, drawing2, row);
        views.append(figure);
        return { drawing: drawing2, slider, input, words };
      };
      const turn = part("top", copy.aim_top, "aim", copy.aim_turn), tilt = part("side", copy.aim_side, "tilt", copy.aim_tilt);
      for (const control of [tilt.input, tilt.slider]) Object.assign(control, { min: sensorTilt.min, max: sensorTilt.max });
      const hint2 = document.createElement("p");
      hint2.className = "fp-note";
      hint2.textContent = copy.aim_hint ?? "";
      hint2.hidden = !hint2.textContent;
      const note = document.createElement("p");
      note.className = "fp-note fp-aim-seen";
      note.setAttribute("role", "status");
      const lens = document.createElement("p");
      lens.className = "fp-note fp-aim-lens";
      lens.hidden = true;
      box2.append(views, hint2, note, lens);
      document.getElementById("fp-sensor-edit-height").after(box2);
      return { box: box2, turn, tilt, note, lens, preview: null };
    })() : null;
    doorActions = copy.door_close && copy.door_open ? (() => {
      const bar = document.createElement("div");
      bar.className = "fp-place-actions fp-door-actions";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", copy.door);
      bar.hidden = true;
      const name = document.createElement("span");
      name.textContent = copy.door;
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.dataset.action = "toggle_door";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.action = "delete";
      remove.textContent = copy.remove;
      bar.append(name, toggle, remove);
      document.getElementById("fp-walk-stage").append(bar);
      return { bar, toggle };
    })() : null;
    roomRemoval = copy.room_delete_title && copy.room_delete_confirm ? (() => {
      const dialog = document.createElement("dialog");
      dialog.className = "fp-furniture-dialog fp-sensor-edit";
      dialog.id = "fp-room-delete";
      dialog.setAttribute("aria-labelledby", "fp-room-delete-title");
      dialog.setAttribute("aria-describedby", "fp-room-delete-text");
      dialog.innerHTML = `<div class="fp-furniture-heading"><div><h2 id="fp-room-delete-title"></h2><p id="fp-room-delete-text"></p></div></div>
        <form method="dialog"><div class="fp-sensor-edit-footer">
            <button type="submit" value="" autofocus></button>
            <button type="submit" class="fp-primary fp-danger" value="delete"></button>
        </div></form>`;
      dialog.querySelector("h2").textContent = copy.room_delete_title;
      const [keep, remove] = dialog.querySelectorAll("button");
      keep.textContent = copy.cancel_place;
      remove.textContent = copy.room_delete_confirm;
      pdfPages.after(dialog);
      return dialog;
    })() : null;
    coverageRadarOptions = { allowHeightEstimate: true };
    coverageEstimateLabel = integration?.coverageEstimate ?? copy.coverage_estimate ?? copy.height_note;
    coverageEstimateLegend = document.createElement("span");
    if (coverageEstimateLegend) {
      const symbol = document.createElement("i");
      symbol.className = "fp-legend-range";
      symbol.setAttribute("aria-hidden", "true");
      coverageEstimateLegend.hidden = true;
      coverageEstimateLegend.append(symbol, coverageEstimateLabel);
      element("fp-legend").append(coverageEstimateLegend);
    }
    motionLegend = copy.legend_motion ? (() => {
      const entry = document.createElement("span");
      const symbol = document.createElement("i");
      symbol.className = "fp-legend-motion";
      symbol.setAttribute("aria-hidden", "true");
      entry.hidden = true;
      entry.append(symbol, copy.legend_motion);
      element("fp-legend").append(entry);
      return entry;
    })() : null;
    liveMode = false;
    livePeople = [];
    openingWidth = element("fp-opening-width");
    openingHeight = element("fp-opening-height");
    openingDefaults = {
      door: { width: 0.9, min: 0.5, max: 2 },
      window: { width: 1.2, min: 0.1, max: 8, height: 1.05, base: defaultWindowSill },
      mirror: { width: 0.7, min: 0.1, max: 8, height: 1.4, base: 0.5 }
    };
    number3 = new Intl.NumberFormat(root.dataset.locale, { maximumFractionDigits: 2 });
    tenth = new Intl.NumberFormat(root.dataset.locale, { maximumFractionDigits: 1 });
    maxProjectFileSize = maxFloors * (maxImageData + 1e6);
    reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    sharedRoom = parsePlannerLink(location.hash);
    demo = sharedRoom ?? readDemo(location.search);
    exampleHome = !integration && !demo && new URLSearchParams(location.search).get("example") === "home";
    sharedPlan = !integration && !demo && !exampleHome && typeof sharing?.key === "string" && sharing.key ? sharing.key : null;
    storageKey = "smarthomeshop.sensor-planner.v1" + (sharedRoom ? location.hash : demo ? `.${demo.width}-${demo.depth}-${demo.height}-${demo.radar}${demo.obstacles ? "-obstacles" : ""}` : exampleHome ? ".example-home" : sharedPlan ? ".shared." + sharedPlan : "");
    withEditableFurniture = (plan2) => withFurniture(plan2, copy.furniture_items);
    demoHome = () => sampleBuilding(copy.names, copy.furniture_items);
    building = exampleHome ? demoHome() : null;
    plan = building?.floors[0].plan ?? withEditableFurniture(demo ? demoPlan(demo, copy.names) : blankPlan(copy.names.untitled));
    showStart = !demo && !exampleHome;
    roomFormOpen = false;
    placementInstallation = null;
    placementDevice = null;
    allFloors = false;
    floorSeparation = 1;
    showMeasures = false;
    tool = "edit";
    placingOpening = () => Object.hasOwn(openingDefaults, tool);
    choice = null;
    placedWithTool = 0;
    start2 = null;
    roomDraft = [];
    draftCorner = 0;
    selected = plan.sensors[0]?.id;
    showCoverage = true;
    showHeatmap = false;
    heatCache = null;
    beamChoices = [];
    beamChoice = "";
    beamKey = null;
    beamPanelKey = null;
    detectedBeam = null;
    inspectedMarker = null;
    sensorTipTimer = 0;
    editingSensor = null;
    view = "2d";
    spaceCamera = defaultSpaceCamera;
    spaceBounds = null;
    spaceZoom = 1;
    wallMode = viewPreference("fp-wall-mode", wallModes);
    daylight = viewPreference("fp-daylight", daylights);
    detailedSpacePeople = true;
    spaceFollow = false;
    orbitDrag = null;
    orbitFrame = 0;
    ignoreSpaceClick = false;
    simulation = false;
    reviewedCoverage = false;
    walkers = { man: null, woman: null, child: null };
    activeWalker = "man";
    currentWalker = () => walkers[activeWalker];
    walkFloorId = () => building?.activeFloor ?? "ground";
    walkersOnFloor = () => Object.entries(walkers).filter(([, walker]) => walker?.floorId === walkFloorId());
    walkWalls = [];
    walkSensors = [];
    walkFurniture = [];
    walkSight = null;
    heldDoors = /* @__PURE__ */ new Set();
    heldDoorPaint = false;
    readingKey = null;
    autoWalk = null;
    autoWalkFrame = 0;
    stairWalk = null;
    stairFrame = 0;
    camera2 = { x: 5, y: 4, height: 11 };
    interaction = null;
    touchPositions = /* @__PURE__ */ new Map();
    pinch = null;
    ignoreTouchClick = false;
    recentUndo = null;
    cursor = null;
    underlayMeasure = null;
    libraryOpener = null;
    libraryPanelWasOpen = false;
    quickPlacement = null;
    placementPoint = null;
    catalogMount = "all";
    catalogRoomId = null;
    catalogAreaOnly = false;
    placementAreaId = null;
    lastRoomClick = null;
    placementOpener = null;
    furnitureOpener = null;
    history = [];
    future = [];
    unreadableDraft = null;
    sharedPending = Boolean(sharedPlan);
    try {
      const raw = integration ? integration.project ? JSON.stringify(integration.project) : null : localStorage.getItem(storageKey);
      if (raw !== null) {
        showStart = false;
        sharedPending = false;
        unreadableDraft = raw;
        const saved = JSON.parse(raw);
        if (validProject(saved)) {
          readProject(saved);
          selected = plan.sensors[0]?.id;
          unreadableDraft = null;
        }
      }
    } catch {
    }
    currentStairTrip = () => building?.staircase ? stairTrip(projectDocument()) : null;
    deviceIcon = (mount) => mount === "ceiling" ? '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6"/><circle cx="10" cy="10" r="2"/></svg>' : '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="5" width="12" height="10" rx="2"/><path d="m8 11 2-2 2 2"/></svg>';
    homeAssistantAreas = () => integration?.areas?.() ?? [];
    homeAssistantFloors = () => integration?.floors?.() ?? [];
    roomById = (id) => projectFloors().flatMap((floor) => floor.plan.rooms).find((room) => room.id === id) ?? null;
    linkedAreaIds = (exceptRoom) => new Set(projectFloors().flatMap((floor) => floor.plan.rooms).filter((room) => room.id !== exceptRoom?.id && room.haAreaId).map((room) => room.haAreaId));
    homeAssistantAreaName = (id) => homeAssistantAreas().find((area) => area.id === id)?.name ?? id;
    visiblePlan = (floorPlan) => integration ? { ...floorPlan, sensors: visibleSensors(floorPlan) } : floorPlan;
    furnitureDialog = element("fp-furniture-library");
    if (sensorAim) {
      const set = (part, value) => {
        part.input.value = part.slider.value = value;
        paintSensorAim();
      };
      for (const part of [sensorAim.turn, sensorAim.tilt]) {
        part.slider.addEventListener("input", () => set(part, part.slider.value));
        part.input.addEventListener("input", () => {
          if (part.input.validity.valid && part.input.value !== "") part.slider.value = part.input.value;
          paintSensorAim();
        });
      }
      sensorEditForm.elements.mountHeight.addEventListener("input", paintSensorAim);
      const follow = (drawing2, begin, move) => drawing2.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || !sensorAim.preview) return;
        event.preventDefault();
        const at = (pointer) => {
          const point3 = new DOMPoint(pointer.clientX, pointer.clientY).matrixTransform(drawing2.getScreenCTM().inverse());
          return { x: point3.x, y: point3.y };
        };
        const held = begin(at(event));
        const moved = (pointer) => move(at(pointer), held);
        const stop = () => {
          drawing2.removeEventListener("pointermove", moved);
          drawing2.removeEventListener("pointerup", stop);
          drawing2.removeEventListener("pointercancel", stop);
        };
        drawing2.setPointerCapture(event.pointerId);
        drawing2.addEventListener("pointermove", moved);
        drawing2.addEventListener("pointerup", stop);
        drawing2.addEventListener("pointercancel", stop);
        moved(event);
      });
      follow(sensorAim.turn.drawing, () => null, (point3) => {
        const { item, onBracket } = sensorAim.preview;
        if (Math.hypot(point3.x - item.x, point3.y - item.y) < 0.12) return;
        set(sensorAim.turn, onBracket ? turnTo(item, point3, sensorPan) : directionTo(item, point3));
      });
      const mounted = () => sensorAim.preview.item.mountHeight ?? 1.4;
      follow(sensorAim.tilt.drawing, (point3) => onDevice(mounted(), { ahead: point3.x, height: -point3.y }) ? "height" : "tilt", (point3, held) => {
        const spot = { ahead: point3.x, height: -point3.y };
        if (held === "height") {
          sensorEditForm.elements.mountHeight.value = heightTo(spot.height, sensorAim.preview.room?.height);
          paintSensorAim();
        } else set(sensorAim.tilt, tiltTo(mounted(), spot));
      });
    }
    sensorEditForm.addEventListener("change", (event) => {
      const item = plan.sensors.find((item2) => item2.id === editingSensor?.id);
      if (!item) return;
      if (event.target.name === "haDevice" && integration) {
        const device = haDevice(event.target.value);
        const previous = readSensorEdit();
        const unchanged = event.target.value === item.haDevice;
        editingSensor.radar = unchanged ? item.radar : device?.radar ?? "none";
        const model = unchanged ? item.model : device?.model ?? item.model;
        sensorEditForm.elements.model.replaceChildren(new Option(devices[model].name, model));
        renderSensorEdit(item, sensorEditValues(model, { ...previous, radar: editingSensor.radar }));
      } else if (event.target.name === "model") {
        const previous = readSensorEdit(editingSensor.model);
        editingSensor.drafts.set(previous.model, previous);
        const model = event.target.value;
        editingSensor.model = model;
        renderSensorEdit(item, editingSensor.drafts.get(model) ?? sensorEditValues(model, previous));
      } else if (event.target.name === "installation" && sensorAim) {
        const values = readSensorEdit();
        if (sensorAim.preview) values.angle = sensorAim.preview.item.angle;
        renderSensorEdit(item, values);
      } else updateSensorEditNote(item, readSensorEdit());
    });
    sensorEditForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const id = editingSensor?.id;
      const item = plan.sensors.find((item2) => item2.id === id);
      if (!item) return;
      const values = readSensorEdit();
      const room = roomForDevice(plan.rooms, item);
      const next = replacementSensor(item, values, room);
      if (!next) {
        updateSensorEditNote(item, values, copy.sensor_edit_room_required);
        return;
      }
      if (integration) {
        const deviceId = sensorEditForm.elements.haDevice.value;
        const device = haDevice(deviceId);
        if (!deviceId || deviceId !== item.haDevice && (!device || haPlacements(item.id).has(device.id))) {
          updateSensorEditNote(item, values, integration.picker.invalid);
          return;
        }
        next.haDevice = deviceId;
      }
      const candidate = { ...plan, sensors: plan.sensors.map((sensor) => sensor.id === id ? next : sensor) };
      if (!validPlan(candidate) || room && roomForDevice(candidate.rooms, next)?.id !== room.id) {
        updateSensorEditNote(item, values, copy.sensor_edit_invalid);
        return;
      }
      if (JSON.stringify(next) !== JSON.stringify(item)) {
        remember();
        plan = candidate;
        selected = id;
        beamChoice = "";
        if (simulation) {
          walkSensors = preparePersonSensors(planForDrawing(plan));
          for (const [, walker] of walkersOnFloor()) {
            walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
          }
          readingKey = null;
        }
        finish();
        if (simulation || view === "3d") chooseBeamForMarker(activeSensorMarker(id));
        element("fp-event").textContent = copy.sensor_edit_saved;
      }
      sensorEdit.close();
    });
    sensorEdit.addEventListener("close", () => {
      const id = editingSensor?.id;
      editingSensor = null;
      if (id) activeSensorMarker(id)?.focus({ preventScroll: true });
    });
    sensorMarkerAt = (target) => target?.closest?.("[data-sensor-marker]");
    stage.addEventListener("pointerover", (event) => {
      if (event.pointerType === "touch" || event.buttons) return;
      if (sensorTip.contains(event.target)) clearTimeout(sensorTipTimer);
      const marker = sensorMarkerAt(event.target);
      if (marker && marker !== sensorMarkerAt(event.relatedTarget)) showSensorTip(marker.dataset.item, "hover");
    });
    stage.addEventListener("pointerout", (event) => {
      if (inspectedMarker?.source !== "hover") return;
      const from = sensorMarkerAt(event.target);
      if (!from && !sensorTip.contains(event.target)) return;
      if (sensorMarkerAt(event.relatedTarget)?.dataset.item === inspectedMarker.id || sensorTip.contains(event.relatedTarget)) return;
      clearTimeout(sensorTipTimer);
      sensorTipTimer = setTimeout(closeSensorTip, 180);
    });
    stage.addEventListener("focusin", (event) => {
      const marker = sensorMarkerAt(event.target);
      if (marker) showSensorTip(marker.dataset.item, "focus");
    });
    stage.addEventListener("focusout", (event) => {
      if (inspectedMarker?.source === "focus" && !sensorMarkerAt(event.relatedTarget)) closeSensorTip();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!sensorTip.contains(event.target)) closeSensorTip();
    }, { capture: true });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && closeSensorTip()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { capture: true });
    field = (item, key, label, min, max, step2) => `
    <label>${label}<input type="number" data-field="${key}" min="${min}" max="${max}" step="${step2}" value="${Number(item[key].toFixed(2))}" required></label>`;
    mirrorReflectionCopy = {
      en: [
        "Suppress mirror reflections",
        "Reflection depth (m)",
        "Creates a conservative exclusion behind this mirror for each linked radar. Real room space is never excluded automatically.",
        "No radar with position tracking in this room looks at this mirror, so nothing is excluded yet.",
        "A radar holds two exclusion areas. With this mirror a radar here needs more, and sending to the radars is refused until a zone or a mirror filter is removed."
      ],
      nl: [
        "Spiegelreflecties onderdrukken",
        "Reflectiediepte (m)",
        "Maakt per gekoppelde radar een veilige uitsluiting achter deze spiegel. Echte ruimte wordt nooit automatisch uitgesloten.",
        "Geen radar met positiebepaling in deze kamer kijkt naar deze spiegel, dus er wordt nog niets uitgesloten.",
        "Een radar onthoudt twee uitsluitingsvlakken. Met deze spiegel heeft een radar hier er meer nodig, en verzenden naar de radars wordt geweigerd tot je een zone of een spiegelfilter weghaalt."
      ],
      de: [
        "Spiegelreflexionen unterdrücken",
        "Reflexionstiefe (m)",
        "Erstellt pro verknüpftem Radar einen sicheren Ausschluss hinter diesem Spiegel. Echter Raum wird nie automatisch ausgeschlossen.",
        "Kein Radar mit Positionserkennung in diesem Raum sieht diesen Spiegel, daher wird noch nichts ausgeschlossen.",
        "Ein Radar speichert zwei Ausschlussflächen. Mit diesem Spiegel braucht ein Radar hier mehr, und das Senden an die Radare wird abgelehnt, bis eine Zone oder ein Spiegelfilter entfernt wird."
      ],
      fr: [
        "Supprimer les reflets du miroir",
        "Profondeur de réflexion (m)",
        "Crée une exclusion prudente derrière ce miroir pour chaque radar associé. L'espace réel n'est jamais exclu automatiquement.",
        "Aucun radar de suivi dans cette pièce ne regarde ce miroir, donc rien n'est encore exclu.",
        "Un radar retient deux zones d'exclusion. Avec ce miroir, un radar en demande plus ici. L'envoi aux radars est refusé tant qu'une zone ou un filtre de miroir n'est pas retiré."
      ],
      es: [
        "Suprimir reflejos del espejo",
        "Profundidad de reflexión (m)",
        "Crea una exclusión prudente detrás del espejo para cada radar vinculado. El espacio real nunca se excluye automáticamente.",
        "Ningún radar de seguimiento de esta habitación mira a este espejo, así que todavía no se excluye nada.",
        "Un radar guarda dos áreas de exclusión. Con este espejo, un radar necesita más aquí, y el envío a los radares se rechaza hasta que quites una zona o un filtro de espejo."
      ]
    };
    heightField = (key, label, value) => `<label>${label}
    <input data-field="${key}" data-decimal type="text" inputmode="decimal" maxlength="8" value="${number3.format(value)}" required></label>`;
    options = (values, active, label) => values.map((value) => `<option value="${value}" ${value === active ? "selected" : ""}>${label(value)}</option>`).join("");
    if (automationPanel) {
      const panel = automationPanel;
      const picked = integration.picker;
      const change = async (work, done) => {
        const room = panel.room;
        const minutes = panel.minutes.querySelector("input");
        if (!room || work === "save" && !minutes.reportValidity()) return;
        panel.save.disabled = panel.remove.disabled = true;
        try {
          if (work === "save") await integration.presenceLights.save(room, { minutes: minutes.valueAsNumber, onlyDark: panel.dark.querySelector("input").checked });
          else await integration.presenceLights.remove(room);
          const state = await integration.presenceLights.state(room);
          if (panel.room === room && panel.dialog.open) showRoomAutomation(room, state, done);
        } catch {
          if (panel.room !== room) return;
          panel.save.disabled = panel.remove.disabled = false;
          panel.note.textContent = picked.automationError;
          panel.note.hidden = false;
        }
      };
      panel.save.addEventListener("click", () => change("save", picked.automationSaved));
      panel.remove.addEventListener("click", () => change("remove", picked.automationRemoved));
    }
    library.addEventListener("beforetoggle", (event) => {
      setLibraryExpanded(event.newState === "open");
      if (event.newState === "closed") {
        quickPlacement = null;
        catalogRoomId = null;
        catalogAreaOnly = false;
        root.toggleAttribute("data-panel", libraryPanelWasOpen);
      }
    });
    compactLibrary.addEventListener("change", () => {
      closeLibrary();
      arrangeProjectControls();
    });
    element("fp-search").addEventListener("input", filterCatalog);
    element("fp-place-installation").addEventListener("change", (event) => {
      placementInstallation = event.target.value;
      placementPoint = null;
      ghost.replaceChildren();
      updateTools();
    });
    for (const input of [openingWidth, openingHeight]) {
      input.addEventListener("input", () => {
        if (placingOpening()) updateTools();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || event.isComposing || event.repeat || !placingOpening() || !placementPoint) return;
        event.preventDefault();
        element("fp-place-confirm").click();
      });
    }
    viewSwitchIcons = {
      wall_mode: {
        cutaway: "M3 16h14M4 16V9l6-5 6 5M16 9v7",
        up: "M3 16h14M4 16V6l6-3 6 3v10M8 16v-4h4v4",
        down: "M3 16h14M4 16v-3h12v3"
      },
      daylight: {
        studio: "M10 4v2m0 8v2M4 10h2m8 0h2M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
        morning: "M3 15h14M6 15a4 4 0 0 1 8 0M10 6v2M5 9l1.4 1.4M15 9l-1.4 1.4",
        midday: "M10 3v2m0 10v2M3 10h2m10 0h2M5 5l1.4 1.4m7.2 7.2L15 15M5 15l1.4-1.4m7.2-7.2L15 5M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
        evening: "M3 15h14M6 15a4 4 0 0 1 8 0M8 6l2 2 2-2",
        night: "M13 4a6 6 0 1 0 3 9 5 5 0 0 1-3-9"
      }
    };
    viewSwitches = Object.fromEntries(Object.keys(viewSwitchIcons).map((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = action;
      root.querySelector('.fp-space-controls [data-action="reset_view"]')?.before(button);
      return [action, button];
    }));
    heatToggle = document.createElement("button");
    heatToggle.type = "button";
    heatToggle.className = "fp-heat-toggle";
    heatToggle.dataset.action = "heatmap";
    heatToggle.setAttribute("aria-pressed", "false");
    heatToggle.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h6v6H3zm8 0h6v6h-6zM3 11h6v6H3zm8 0h6v6h-6z"/></svg>${escapeText(copy.heatmap)}`;
    root.querySelector('.fp-view-actions [data-action="coverage"]')?.after(heatToggle);
    heatLegend = document.createElement("p");
    heatLegend.className = "fp-heat-legend";
    heatLegend.hidden = true;
    element("fp-walk-stage")?.append(heatLegend);
    renderViewSwitches();
    direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    wasd = { w: "ArrowUp", a: "ArrowLeft", s: "ArrowDown", d: "ArrowRight" };
    walkControls = createWalkControls(element("fp-sim-dock"), () => activeWalker, walk, settleWalk, renderPerson);
    smokeTestAudio = null;
    space.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || !space.firstElementChild) return;
      ignoreSpaceClick = false;
      orbitDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: spaceCamera, touch: event.pointerType === "touch" };
    });
    space.addEventListener("pointermove", (event) => {
      if (orbitDrag?.id !== event.pointerId) return;
      const dx = event.clientX - orbitDrag.x, dy = event.clientY - orbitDrag.y;
      if (!ignoreSpaceClick) {
        if (Math.hypot(dx, orbitDrag.touch ? 0 : dy) < 5) return;
        ignoreSpaceClick = true;
        closeSensorTip();
        walkControls.stop();
        space.setPointerCapture(event.pointerId);
        space.setAttribute("data-orbiting", "");
      }
      spaceCamera = orbitSpaceCamera(orbitDrag.camera, dx, orbitDrag.touch ? 0 : dy);
      if (!orbitFrame) orbitFrame = requestAnimationFrame(() => {
        orbitFrame = 0;
        if (view === "3d") renderSpatialDrawing();
      });
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture", "pointerleave"]) {
      space.addEventListener(name, (event) => {
        if (orbitDrag?.id !== event.pointerId) return;
        if (name !== "pointerleave" || !space.hasPointerCapture(event.pointerId)) stopOrbit();
      });
    }
    space.addEventListener("click", (event) => {
      if (ignoreSpaceClick) {
        ignoreSpaceClick = false;
        return;
      }
      if (stairWalk?.crossing != null) return;
      if (pickAvatar(event.target)) return;
      if (allFloors) {
        const floor = event.target.closest("[data-building-floor], [data-floor-label]");
        if (!floor) return;
        const id = floor.dataset.buildingFloor ?? floor.dataset.floorLabel;
        if (simulation) placeWalkerOnStack(event, id);
        else showFloor(id);
        return;
      }
      const marker = sensorMarkerAt(event.target);
      if (marker && tool === "edit") {
        openSensorEdit(marker.dataset.item);
        return;
      }
      if (simulation) {
        const leaf = plan.doors.find((item2) => item2.id === event.target.closest(".fp-space-door-leaf, .fp-space-door")?.dataset.item);
        if (leaf) toggleDoor(leaf);
        else if (currentWalker() && event.target.closest(".fp-space-floor")) {
          const point3 = eventPoint(event, space);
          const [x, y] = unprojectFloor([point3.x, point3.y], spaceCamera);
          const door = doorAt(plan, { x, y });
          if (door) toggleDoor(door);
          else if (plan.rooms.some((room) => contains(room, { x, y }))) restartWalk({ x, y });
        }
        focusWalkMap();
        return;
      }
      if (tool === "furnish" || tool === "move_furniture") {
        if (event.target.closest(".fp-space-floor")) {
          const point3 = eventPoint(event, space);
          const [x, y] = unprojectFloor([point3.x, point3.y], spaceCamera);
          drawAt({ x, y });
        }
        return;
      }
      const item = event.target.closest("[data-item]");
      if (!item) return;
      beamChoice = "";
      selected = item.dataset.item;
      render();
      showInspectorStart();
    });
    limitPoint = (point3) => ({
      x: Math.max(-100, Math.min(100, snap(point3.x))),
      y: Math.max(-100, Math.min(100, snap(point3.y)))
    });
    finePoint = (point3) => ({
      x: Math.max(-100, Math.min(100, Number(point3.x.toFixed(2)))),
      y: Math.max(-100, Math.min(100, Number(point3.y.toFixed(2))))
    });
    isWallMounted = (item) => ["wall-bracket", "wall-recessed"].includes(installationFor(item));
    canvas.addEventListener("pointerdown", (event) => {
      if (liveMode) return;
      if (event.isPrimary && !pinch) ignoreTouchClick = false;
      if (event.pointerType === "touch") {
        touchPositions.set(event.pointerId, event);
        if (touchPositions.size >= 2) {
          if (interaction) endInteraction({ pointerId: interaction.pointer, type: "pointercancel" });
          for (const id of touchPositions.keys()) canvas.setPointerCapture(id);
          pinch = pinchGeometry();
          ignoreTouchClick = true;
          return;
        }
      }
      if (!event.isPrimary || event.button !== 0) return;
      if (simulation) {
        board.focus({ preventScroll: true });
        return;
      }
      roomHandleFeedback.textContent = "";
      const doorHit = tool === "edit" ? doorAt(plan, eventPoint(event), 0.16) : null;
      const handle = doorHit ? null : event.target.closest("[data-room-handle], [data-room-midpoint]");
      if (handle) {
        const room = selectedRoomForHandles();
        if (!room) return;
        event.preventDefault();
        roomDraft = roomCorners(room);
        const midpoint2 = handle.hasAttribute("data-room-midpoint");
        const vertex = midpoint2 ? insertWallMidpoint(roomDraft, Number(handle.dataset.roomMidpoint)) : Number(handle.dataset.roomHandle);
        interaction = {
          pointer: event.pointerId,
          roomCorner: true,
          midpoint: midpoint2,
          vertex,
          cornerStart: roomDraft[vertex],
          origin: eventPoint(event),
          originX: event.clientX,
          originY: event.clientY
        };
        lastRoomClick = null;
        canvas.setAttribute("data-room-corner-drag", "");
        renderRoomHandles();
        canvas.setPointerCapture(event.pointerId);
        board.focus({ preventScroll: true });
        return;
      }
      const target = doorHit?.id ?? event.target.closest("[data-item]")?.dataset.item;
      if (event.pointerType === "touch" && tool === "edit") {
        interaction = { pointer: event.pointerId, tapSelection: target ?? null, originX: event.clientX, originY: event.clientY, camera: { ...camera2 } };
        canvas.setPointerCapture(event.pointerId);
        return;
      }
      cursor = null;
      updateCursor();
      const origin = eventPoint(event);
      if (tool === "edit_outline") {
        const original = [...roomDraft];
        const radius = cornerHitRadius();
        let closest = radius, vertex = -1;
        roomDraft.forEach(([x, y], index) => {
          const distance4 = Math.hypot(x - origin.x, y - origin.y);
          if (distance4 < closest) {
            closest = distance4;
            vertex = index;
          }
        });
        if (vertex < 0 && roomDraft.length < maxRoomCorners && selectedItem().item?.type !== "entry") {
          let split;
          polygonEdges(roomDraft).forEach(([a, b], index) => {
            const edge = edgePosition(a, b, origin);
            const distance4 = Math.hypot(edge.x - origin.x, edge.y - origin.y);
            if (distance4 < closest && edge.along > 0.08 && edge.along < edge.length - 0.08) {
              closest = distance4;
              vertex = index + 1;
              split = [edge.x, edge.y];
            }
          });
          if (split) roomDraft.splice(vertex, 0, split);
        }
        if (vertex < 0) return;
        draftCorner = vertex;
        interaction = { pointer: event.pointerId, vertex, outline: original, originX: event.clientX, originY: event.clientY };
        updateTools();
        renderRoomDraft();
        canvas.setPointerCapture(event.pointerId);
        board.focus({ preventScroll: true });
        return;
      }
      if (tool === "pan") {
        interaction = { pointer: event.pointerId, originX: event.clientX, originY: event.clientY, camera: { ...camera2 } };
      } else if (tool !== "edit" && tool !== "move_item") {
        interaction = { pointer: event.pointerId, place: true, origin, originX: event.clientX, originY: event.clientY };
      } else {
        const previousSelection = selected;
        if (tool === "move_item" && target !== selected) return;
        selected = target;
        const { item, type } = selectedItem();
        if (type !== "rooms") lastRoomClick = null;
        if (item && !["windows", "mirrors", "zones"].includes(type)) {
          const group = type === "rooms" ? Object.values(roomContents(plan, item)).flat().map((entry) => [entry, { ...entry }]) : null;
          interaction = {
            pointer: event.pointerId,
            origin,
            originX: event.clientX,
            originY: event.clientY,
            item,
            type,
            original: { ...item },
            group,
            previous: JSON.stringify(plan)
          };
        }
        render();
        inspectMapSelection(type, selected !== previousSelection);
      }
      if (interaction) canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("click", (event) => {
      if (ignoreTouchClick || sensorEdit.open) return;
      if (pickAvatar(event.target)) return;
      const marker = sensorMarkerAt(event.target);
      if (marker && (simulation || event.detail === 0)) {
        openSensorEdit(marker.dataset.item);
        return;
      }
      if (!currentWalker()) return;
      const point3 = eventPoint(event);
      const door = simulation && doorAt(plan, point3);
      if (door) toggleDoor(door);
      else if (plan.rooms.some((room) => contains(room, point3))) restartWalk(point3);
    });
    canvas.addEventListener("contextmenu", (event) => {
      if (simulation || ["edit", "pan"].includes(tool)) return;
      event.preventDefault();
      if (placingOpening() || ["place", "furnish", "move_furniture", "move_item"].includes(tool)) cancelPlacement();
      else setTool("edit");
    });
    canvas.addEventListener("pointermove", (event) => {
      if (touchPositions.has(event.pointerId)) {
        touchPositions.set(event.pointerId, event);
        if (pinch) {
          if (touchPositions.size >= 2) {
            const geometry = pinchGeometry();
            const anchor = eventPoint(pinch);
            const point4 = eventPoint(geometry);
            camera2.x += anchor.x - point4.x;
            camera2.y += anchor.y - point4.y;
            zoom(pinch.distance / geometry.distance, anchor);
            pinch = geometry;
          }
          return;
        }
      }
      if (tool === "place" && event.pointerType !== "touch" && !placementPoint) {
        showGhost(limitPoint(eventPoint(event)));
      }
      if (placingOpening() && event.pointerType !== "touch" && !placementPoint) renderOpeningPreview(eventPoint(event));
      const drawing2 = tool === "room" || tool === "wall";
      if (interaction?.pointer !== event.pointerId) {
        if (event.pointerType !== "touch" && !event.buttons && roomMidpoints.childElementCount) highlightRoomMidpoint(eventPoint(event));
        if (drawing2 && start2) showGhost(drawingPoint(eventPoint(event), event.shiftKey));
        else if (start2 || tool === "outline_room" || tool === "zone") showGhost(limitPoint(eventPoint(event)));
        else if (tool === "furnish" || tool === "move_furniture") showGhost(eventPoint(event));
        return;
      }
      if (interaction.tapSelection !== void 0) {
        const metres2 = camera2.height / canvas.clientHeight;
        camera2.x = interaction.camera.x + (interaction.originX - event.clientX) * metres2;
        camera2.y = interaction.camera.y + (interaction.originY - event.clientY) * metres2;
        updateView();
        return;
      }
      if (interaction.vertex !== void 0) {
        if (Math.hypot(event.clientX - interaction.originX, event.clientY - interaction.originY) < 3) return;
        let target = eventPoint(event);
        if (interaction.roomCorner) {
          const { origin: origin2, cornerStart: [x, y] } = interaction;
          target = { x: x + target.x - origin2.x, y: y + target.y - origin2.y };
        }
        const point4 = (event.altKey ? finePoint : limitPoint)(target);
        roomDraft[interaction.vertex] = [point4.x, point4.y];
        if (interaction.roomCorner) {
          ghost.toggleAttribute("data-invalid", !outlineBounds(roomDraft));
          ghost.innerHTML = `<polygon class="fp-outline-draft" points="${roomDraft.map((point5) => point5.join(",")).join(" ")}"/>`;
          renderRoomHandles();
          return;
        }
        renderRoomDraft();
        return;
      }
      if (interaction.place) {
        if (drawing2 && Math.hypot(event.clientX - interaction.originX, event.clientY - interaction.originY) > 9) {
          interaction.anchor ??= start2 ?? drawingPoint(interaction.origin, event.shiftKey);
        }
        if (drawing2 && (start2 || interaction.anchor)) showGhost(drawingPoint(eventPoint(event), event.shiftKey), interaction.anchor ?? start2);
        else if (start2) showGhost(limitPoint(eventPoint(event)));
        return;
      }
      if (interaction.camera) {
        const metres2 = camera2.height / canvas.clientHeight;
        camera2.x = interaction.camera.x + (interaction.originX - event.clientX) * metres2;
        camera2.y = interaction.camera.y + (interaction.originY - event.clientY) * metres2;
        updateView();
        return;
      }
      const { origin, item, type, original, group } = interaction;
      if (type === "sensors" && tool === "edit" && !interaction.dragged) {
        if (Math.hypot(event.clientX - interaction.originX, event.clientY - interaction.originY) <= 6) return;
        interaction.dragged = true;
      }
      const point3 = eventPoint(event);
      if (group) {
        const rawX = point3.x - origin.x, rawY = point3.y - origin.y;
        if (Math.hypot(rawX, rawY) < 0.025 && item.x === original.x && item.y === original.y) return;
        const offset2 = event.altKey ? { x: rawX, y: rawY } : snapRoomOffset(original, plan.rooms, rawX, rawY);
        const dx2 = Math.abs(offset2.x - rawX) > 1e-7 || event.altKey ? offset2.x : snap(rawX);
        const dy2 = Math.abs(offset2.y - rawY) > 1e-7 || event.altKey ? offset2.y : snap(rawY);
        const moves = group.map(([entry, previous]) => [entry, translatedItem(previous, dx2, dy2)]);
        const outside = moves.some(([, entry]) => (entry.parts ? entry.parts.flat(2) : [entry.x, entry.y, entry.endX ?? 0, entry.endY ?? 0]).some((value) => Math.abs(value) > 100));
        if (outside) return;
        for (const [entry, next2] of moves) Object.assign(entry, next2);
        renderDrawing();
        return;
      }
      const dx = snap(point3.x - origin.x);
      const dy = snap(point3.y - origin.y);
      const next = { ...original, x: original.x + dx, y: original.y + dy };
      if (type === "walls") {
        next.endX += dx;
        next.endY += dy;
      }
      if ([next.x, next.y, next.endX ?? 0, next.endY ?? 0].some((value) => Math.abs(value) > 100)) return;
      Object.assign(item, type === "sensors" ? alignSensorToWall(next) : next);
      if (item.levelMountRoom && (dx || dy)) item.levelMountRoom = null;
      renderDrawing();
    });
    canvas.addEventListener("pointerleave", (event) => {
      if (!canvas.hasPointerCapture(event.pointerId)) touchPositions.delete(event.pointerId);
      highlightRoomMidpoint(null);
      if (tool !== "place" && !placingOpening() || placementPoint) return;
      ghost.replaceChildren();
      ghost.removeAttribute("data-preview");
    });
    canvas.addEventListener("pointerup", finishPointer);
    canvas.addEventListener("pointercancel", finishPointer);
    canvas.addEventListener("touchmove", (event) => {
      if (pinch && event.touches.length >= 2 && event.cancelable) event.preventDefault();
    }, { passive: false });
    canvas.addEventListener("wheel", (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      zoom(Math.exp(Math.max(-100, Math.min(100, event.deltaY)) * 4e-3), eventPoint(event));
    }, { passive: false });
    canvasFile = (canvas2, type, quality) => new Promise((resolve, reject) => canvas2.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No image")), type, quality));
    if (sharePanel) {
      sharePanel.create.addEventListener("click", async () => {
        const { create, link } = sharePanel;
        create.disabled = true;
        showShare(copy.share_busy);
        try {
          const { url } = await sharing.save(projectToShare());
          showShare(copy.share_ready, url);
          link.focus();
          link.select();
        } catch {
          showShare(copy.share_error);
          create.disabled = false;
        }
      });
      sharePanel.copyLink.addEventListener("click", async () => {
        const { link } = sharePanel;
        try {
          await navigator.clipboard.writeText(link.value);
          showShare(copy.share_copied, link.value);
        } catch {
          link.focus();
          link.select();
        }
      });
    }
    actions = {
      close_panel() {
        root.removeAttribute("data-panel");
        (simulation ? simReading : board).focus({ preventScroll: true });
      },
      start_new() {
        replacePlan(blankPlan(copy.names.untitled));
        actions.flow_room();
      },
      start_example() {
        if (integration) return;
        replacePlan(demoHome());
        testStep.focus({ preventScroll: true });
      },
      new() {
        if (confirm(copy.confirm)) actions.start_new();
      },
      example() {
        if (!integration && confirm(copy.confirm)) replacePlan(demoHome());
      },
      flow_room() {
        root.removeAttribute("data-panel");
        if (simulation) setSimulation(false);
        closeLibrary(false);
        setView("2d");
        setTool("edit");
        roomFormOpen = !roomFormOpen;
        element("fp-room-form-error").hidden = true;
        updateTools();
        if (roomFormOpen) element(matchMedia("(pointer: coarse)").matches ? "fp-room-form-title" : "fp-room-form-width").focus();
      },
      edit_add_room() {
        actions.flow_room();
      },
      close_room_form() {
        roomFormOpen = false;
        updateTools();
        focusNext();
      },
      flow_draw() {
        roomFormOpen = false;
        setTool("room");
        board.scrollIntoView({ block: "center" });
        board.focus({ preventScroll: true });
      },
      import() {
        element("fp-start-status").textContent = "";
        element("fp-file").click();
      },
      import_underlay() {
        element("fp-start-status").textContent = "";
        element("fp-underlay-file").click();
      },
      scale_underlay() {
        underlayMeasure = null;
        renderUnderlay();
        setTool("scale_underlay");
        board.focus({ preventScroll: true });
      },
      confirm_underlay_scale() {
        const input = element("fp-underlay-distance");
        if (!underlayMeasure || !input.reportValidity()) return;
        const next = calibrateUnderlay(plan.underlay, underlayMeasure.start, underlayMeasure.length, input.valueAsNumber);
        if (!next) {
          input.setCustomValidity(copy.invalid);
          input.reportValidity();
          input.setCustomValidity("");
          return;
        }
        remember();
        plan.underlay = next;
        underlayMeasure = null;
        finish();
        fit();
        board.focus({ preventScroll: true });
        const waiting = recognition?.pending;
        if (waiting) {
          recognition.pending = null;
          addRecognisedRooms(waiting, true).catch((error) => showRecognition("idle", recognitionProblem(copy, error, root.dataset.locale)));
        } else if (tracing?.pending) {
          tracing.pending = false;
          traceUnderlay();
        }
      },
      // Finds the rooms between the walls on the image, once it has a scale.
      trace_underlay() {
        if (!tracing || !plan.underlay || tracing.busy) return;
        if (plan.underlay.width === startingWidth) {
          tracing.pending = true;
          showTracing(copy.trace_needs_scale);
          return actions.scale_underlay();
        }
        traceUnderlay();
      },
      // Two clicks: the first says where the image goes, the second sends it.
      // The request starts inside the click, so a sign-in window may open.
      recognise_underlay() {
        const underlay = plan.underlay;
        if (!recognition || !underlay || recognition.state === "busy") return;
        if (recognition.state !== "armed") return showRecognition("armed");
        showRecognition("busy");
        new Promise((resolve) => resolve(recogniseRooms(underlay.data))).then((answer) => {
          if (plan.underlay?.data !== underlay.data) return showRecognition("idle");
          const measured = plan.underlay.width !== startingWidth;
          const waiting = roomsWaitingForScale(answer?.recognition);
          if (!waiting) throw Object.assign(new Error("No rooms"), { code: "no_rooms_found" });
          if (!measured && !draftFromRecognition(answer.recognition, plan.underlay)?.scaled) {
            recognition.pending = answer;
            showRecognition("idle", recognitionWaiting(copy, waiting, (value) => number3.format(value)));
            return actions.scale_underlay();
          }
          return addRecognisedRooms(answer, measured);
        }).catch((error) => showRecognition("idle", recognitionProblem(copy, error, root.dataset.locale)));
      },
      remove_underlay() {
        remember();
        delete plan.underlay;
        underlayMeasure = null;
        setTool("edit");
        finish();
      },
      export: exportPlan,
      vacuum_map: openVacuumMaps,
      room_automation: openRoomAutomation,
      sheet_image() {
        saveSheet("image");
      },
      sheet_pdf() {
        saveSheet("pdf");
      },
      share: openShare,
      add_upper_floor() {
        addFloor(1);
      },
      add_lower_floor() {
        addFloor(-1);
      },
      remove_floor() {
        const button = root.querySelector('[data-action="remove_floor"]');
        if (button.disabled || !building) return;
        const floors = projectFloors().filter((floor) => floor.id !== building.activeFloor);
        remember();
        const staircase = building.staircase;
        if (staircase && [staircase.lower, staircase.upper].includes(building.activeFloor)) delete building.staircase;
        building = { ...building, floors, activeFloor: floors[0].id };
        plan = floors[0].plan;
        showFloor(floors[0].id);
      },
      async open_advisor() {
        if (integration) return;
        stopAutoWalk();
        walkControls.stop();
        const { openAdvisor: openAdvisor2 } = await Promise.resolve().then(() => (init_floor_planner_advice_ui(), floor_planner_advice_ui_exports));
        if (element("fp-advisor").open) return;
        openAdvisor2(plan, currentRoom(), copy, root.dataset.locale, (proposals, replaceRooms) => {
          const keep = plan.sensors.filter((sensor) => !replaceRooms.has(roomForDevice(plan.rooms, sensor)?.id) || proposals.some((item) => sameSensorPlacement(sensor, item)));
          const removed = new Set(plan.sensors.filter((sensor) => !keep.includes(sensor)).map((sensor) => sensor.id));
          const added = [];
          const upgrades = /* @__PURE__ */ new Set();
          for (const item of proposals) {
            const existing = [...keep, ...added].find((sensor) => sameSensorPlacement(sensor, item));
            if (existing) {
              if (item.climate && !existing.climate) upgrades.add(existing.id);
              continue;
            }
            added.push({ id: newId(), ...item });
          }
          const count = added.length + upgrades.size + removed.size;
          if (!count) return 0;
          const next = { ...plan, sensors: [...keep, ...added].map((sensor) => upgrades.has(sensor.id) ? { ...sensor, climate: true } : sensor) };
          if (removed.size && plan.zones) next.zones = plan.zones.map((zone) => removed.has(zone.sensorId) ? { ...zone, sensorId: null } : zone);
          if (!validPlan(next)) return -1;
          if (simulation) setSimulation(false);
          remember();
          plan = next;
          selected = added[0]?.id ?? upgrades.values().next().value;
          setTool("edit");
          finish();
          showPanel("outline");
          return count;
        });
      },
      catalog_advice() {
        closeLibrary();
        return actions.open_advisor();
      },
      recover_file() {
        if (unreadableDraft !== null) download(unreadableDraft, "sensor-plan-origineel.json");
      },
      replace_saved() {
        if (unreadableDraft !== null && confirm(copy.recovery_confirm)) save(true);
      },
      cancel_place: cancelPlacement,
      close_furniture() {
        furnitureDialog.close();
      },
      move_furniture() {
        placementOpener = root.querySelector('[data-action="move_furniture"]');
        startFurniturePlacement("move_furniture");
      },
      move_item() {
        placementOpener = root.querySelector('[data-action="move_item"]');
        root.removeAttribute("data-panel");
        setView("2d");
        setTool("move_item");
        element("fp-placement-bar").scrollIntoView({ block: "start" });
        board.focus({ preventScroll: true });
      },
      duplicate_furniture() {
        const { item } = selectedItem();
        const { id, ...values } = item;
        makeItem("furniture", { ...values, x: Math.min(100, item.x + 0.25), y: Math.min(100, item.y + 0.25) });
      },
      fit,
      zoom_in: () => zoom(0.8),
      zoom_out: () => zoom(1.25),
      // The zoom bar on the map: the same in 2D and in 3D.
      map_zoom_in: () => view === "3d" ? actions.space_zoom_in() : actions.zoom_in(),
      map_zoom_out: () => view === "3d" ? actions.space_zoom_out() : actions.zoom_out(),
      map_fit: () => view === "3d" ? actions.reset_view() : fit(),
      view_2d() {
        stopStairWalk();
        setView("2d");
      },
      view_3d() {
        stopStairWalk();
        setView("3d");
      },
      turn_view() {
        walkControls.stop();
        spaceCamera = { ...spaceCamera, yaw: (spaceCamera.yaw + Math.PI / 2) % (Math.PI * 2) };
        renderSpatialDrawing();
      },
      reset_view() {
        walkControls.stop();
        spaceCamera = defaultSpaceCamera;
        spaceZoom = 1;
        spaceFollow = false;
        renderSpatialDrawing();
      },
      space_zoom_in: () => zoomSpace(1.28),
      space_zoom_out: () => zoomSpace(1 / 1.28),
      wall_mode() {
        wallMode = wallModes[(wallModes.indexOf(wallMode) + 1) % wallModes.length];
        rememberViewPreference("fp-wall-mode", wallMode);
        renderViewSwitches();
        if (view === "3d") renderSpatialDrawing();
      },
      daylight() {
        daylight = daylights[(daylights.indexOf(daylight) + 1) % daylights.length];
        rememberViewPreference("fp-daylight", daylight);
        renderViewSwitches();
        if (view === "3d") renderSpatialDrawing();
      },
      follow_person() {
        spaceFollow = !spaceFollow;
        spaceZoom = spaceFollow ? Math.max(1.7, spaceZoom) : 1;
        zoomSpace(1);
      },
      test_person() {
        if (integration) return;
        if (simulation) reviewedCoverage = Boolean(plan.sensors.length);
        if (!simulation && allFloors && !plan.rooms.length) {
          const floor = projectFloors().find((entry) => entry.plan.rooms.length);
          if (!floor) return;
          showFloor(floor.id, true);
        }
        setSimulation(!simulation);
        if (!simulation) focusNext();
      },
      preview_walk() {
        actions.test_person();
      },
      repeat_test() {
        actions.test_person();
      },
      next_order() {
        openOrder(orderStep);
      },
      inspect_selection() {
        const editing = element("fp-selection-jump").getAttribute("aria-controls") === "fp-properties";
        if (editing) showInspectorStart();
        else showPanel("outline");
        const target = element(editing ? "fp-inspector-title" : "fp-outline");
        target.scrollIntoView({ block: "start" });
        target.focus({ preventScroll: true });
      },
      room_rectangle() {
        setTool("room");
        board.focus({ preventScroll: true });
      },
      room_outline() {
        setTool("outline_room");
        board.focus({ preventScroll: true });
      },
      edit_outline(corner = 0) {
        const { type, item } = selectedItem();
        if (type !== "rooms") return;
        setView("2d");
        setTool("edit_outline");
        roomDraft = roomCorners(item);
        draftCorner = corner;
        updateTools();
        renderRoomDraft();
        if (compactLibrary.matches) {
          root.removeAttribute("data-panel");
          board.scrollIntoView({ block: "center" });
        }
        board.focus({ preventScroll: true });
      },
      toggle_door() {
        const door = plan.doors.find((item) => item.id === selected);
        if (door) toggleDoor(door);
      },
      move_opening() {
        const { type, item } = selectedItem();
        if (!["doors", "windows", "mirrors"].includes(type)) return;
        setView("2d");
        setTool(type.slice(0, -1), item.id);
        board.focus({ preventScroll: true });
      },
      zone_part() {
        const { type, item } = selectedItem();
        if (type !== "zones") return;
        setView("2d");
        element("fp-zone-type").value = item.type;
        setTool("zone", item.id);
        board.focus({ preventScroll: true });
      },
      edit_zone_part() {
        const { type, item } = selectedItem();
        if (type !== "zones") return;
        const index = Number(element("fp-zone-part-index")?.value ?? 0);
        setView("2d");
        setTool("edit_outline", String(index));
        roomDraft = [...item.parts[index]];
        updateTools();
        renderRoomDraft();
        if (matchMedia("(max-width: 760px)").matches) board.scrollIntoView({ block: "center" });
        board.focus({ preventScroll: true });
      },
      remove_zone_part() {
        const { type, item } = selectedItem();
        if (type !== "zones" || item.parts.length < 2) return;
        const index = Number(element("fp-zone-part-index")?.value ?? 0);
        remember();
        item.parts = item.parts.filter((_, i) => i !== index);
        finish();
      },
      save_outline: saveRoomDraft,
      undo_corner() {
        roomDraft.pop();
        updateTools();
        renderRoomDraft();
        board.focus({ preventScroll: true });
      },
      remove_corner() {
        if (roomDraft.length <= 3) return;
        roomDraft.splice(draftCorner, 1);
        draftCorner = Math.min(draftCorner, roomDraft.length - 1);
        updateTools();
        renderRoomDraft();
        board.focus({ preventScroll: true });
      },
      cancel_outline() {
        setTool("edit");
        board.focus({ preventScroll: true });
      },
      stop_tool() {
        actions.cancel_outline();
      },
      auto_walk() {
        const wasAutomatic = autoWalk && !autoWalk.test || stairWalk?.repeat;
        stopStairWalk();
        stopAutoWalk();
        if (!wasAutomatic) startAutoWalk();
      },
      take_stairs() {
        startStairWalk();
      },
      stop_stairs() {
        stopStairWalk();
        focusWalkMap();
      },
      confirm_stair() {
        if (!stairPrompt.hidden && startStairWalk(false, activeWalker)) focusWalkMap();
      },
      dismiss_stair() {
        if (stairPrompt.hidden) return;
        currentWalker().dismissStairPrompt = true;
        updateStairPrompt();
        focusWalkMap();
      },
      test_smoke() {
        startWalkTest("smoke");
      },
      test_fall() {
        startWalkTest("fall");
      },
      close_sensor_edit() {
        sensorEdit.close();
      },
      close_pdf_pages() {
        pdfPages.close();
      },
      close_crop() {
        imageParts.close();
      },
      second_person() {
        toggleWalker("woman");
      },
      child_person() {
        toggleWalker("child");
      },
      show_readings() {
        root.setAttribute("data-panel", "");
        const title = element("fp-simulation-title");
        title.scrollIntoView({ block: "start" });
        title.focus({ preventScroll: true });
      },
      show_walk_map() {
        root.removeAttribute("data-panel");
        simReading.focus({ preventScroll: true });
      },
      clear_walk() {
        restartWalk(currentWalker().person);
        element("fp-route-title").focus({ preventScroll: true });
      },
      coverage() {
        showCoverage = !showCoverage;
        updateTools();
        renderDrawing();
      },
      heatmap() {
        showHeatmap = !showHeatmap;
        heatToggle.setAttribute("aria-pressed", String(showHeatmap));
        renderDrawing();
      },
      measures() {
        showMeasures = !showMeasures;
        updateTools();
        renderDrawing();
      },
      rotate_room() {
        const { type, item } = selectedItem();
        if (type !== "rooms") return;
        const next = rotatedRoom(plan, item);
        if (!next) {
          element("fp-save").textContent = copy.invalid;
          return;
        }
        remember();
        plan = next;
        finish();
        fit();
      },
      undo() {
        if (["outline_room", "zone"].includes(tool) && roomDraft.length) {
          actions.undo_corner();
          return;
        }
        if (tool === "edit_outline") {
          actions.cancel_outline();
          return;
        }
        if (!history.length) return;
        reviewedCoverage = false;
        recentUndo = null;
        if (simulation) setSimulation(false);
        future.push(JSON.stringify(projectDocument()));
        readProject(JSON.parse(history.pop()));
        allFloors = false;
        underlayMeasure = null;
        if (!selectedItem().item) selected = null;
        fit();
        finish();
      },
      redo() {
        if (!future.length) return;
        reviewedCoverage = false;
        recentUndo = null;
        if (simulation) setSimulation(false);
        history.push(JSON.stringify(projectDocument()));
        readProject(JSON.parse(future.pop()));
        allFloors = false;
        underlayMeasure = null;
        if (!selectedItem().item) selected = null;
        fit();
        finish();
      },
      undo_recent() {
        actions.undo();
        board.focus({ preventScroll: true });
      },
      rotate() {
        const { item, type } = selectedItem();
        if (!item || type === "sensors" && isWallMounted(item)) return;
        remember();
        item.angle = (item.angle + 90) % 360;
        finish();
      },
      delete() {
        const { type, item } = selectedItem();
        if (!item) return;
        if (type === "rooms" && roomRemoval) askRoomRemoval(item);
        else removeSelected();
      }
    };
    root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.floorChoice) {
        if (button.getAttribute("aria-current") === "true") closeFloorMenu();
        else showFloor(button.dataset.floorChoice);
        return;
      }
      const fromToolbox = toolbox.contains(button);
      const historyAction = fromToolbox && ["undo", "redo"].includes(button.dataset.action);
      if (fromToolbox && !historyAction) {
        toolbox.open = false;
        drawingMenu.open = false;
        toolbox.querySelector("summary").focus({ preventScroll: true });
      }
      if (viewMenu.contains(button) && !["zoom_in", "zoom_out", "space_zoom_in", "space_zoom_out", "wall_mode", "daylight"].includes(button.dataset.action)) {
        viewMenu.open = false;
        viewMenu.querySelector("summary").focus({ preventScroll: true });
      }
      if (button.dataset.catalogMount) {
        catalogMount = button.dataset.catalogMount;
        filterCatalog();
        return;
      }
      if (button.dataset.action === "toggle_area_filter") {
        catalogAreaOnly = !catalogAreaOnly;
        renderHaCatalog();
        return;
      }
      if (simulation && button.closest(".fp-drawing")) button.focus({ preventScroll: true });
      const { personMove, personPose, walker } = button.dataset;
      if (walker) {
        selectWalker(walker);
        if (event.detail > 0) focusWalkMap();
        return;
      }
      if (personMove) {
        if (event.detail === 0) walkControls.tap(personMove);
        return;
      }
      if (personPose && currentWalker()) {
        stopAutoWalk();
        walkControls.stop();
        const { person } = currentWalker();
        person.pose = personPose;
        currentWalker().readings = personSignals(plan, person, walkSensors, walkFurniture, walkSightNow());
        renderPerson();
        return;
      }
      if (button.matches('[role="tab"]')) {
        if (button.id === "fp-tab-properties") showInspectorStart();
        else showPanel("outline");
        return;
      }
      const { action, model, nudge, select, selectRoom, tool: next } = button.dataset;
      if (action === "furniture_library") {
        openFurnitureLibrary(fromToolbox ? toolbox.querySelector("summary") : button);
        return;
      }
      if (button.dataset.furniture) {
        placementOpener = furnitureOpener;
        furnitureDialog.close();
        startFurniturePlacement("furnish", button.dataset.furniture);
        return;
      }
      if (nudge) {
        const { item } = selectedItem();
        const [key, delta] = { left: ["x", -0.1], right: ["x", 0.1], up: ["y", -0.1], down: ["y", 0.1] }[nudge];
        const next2 = Number((item[key] + delta).toFixed(4));
        if (Math.abs(next2) <= 100) {
          const position = alignSensorToWall({ ...item, [key]: next2 }, roomForDevice(plan.rooms, item));
          if (position.x === item.x && position.y === item.y && position.angle === item.angle) return;
          remember();
          Object.assign(item, position);
          if (item.levelMountRoom) item.levelMountRoom = null;
          finish();
          announcePosition(item, item);
          element("fp-inspector").querySelector(`[data-nudge="${nudge}"]`).focus({ preventScroll: true });
        }
        return;
      }
      if (action === "place_center" || action === "place_preview") {
        if (action === "place_preview" && placingOpening()) {
          placeOpening();
          if (tool === "edit") board.focus({ preventScroll: true });
          return;
        }
        const point3 = action === "place_center" ? placementOrigin() : placementPoint;
        if (!point3) return;
        const firstSensor = tool === "place" && !plan.sensors.length;
        drawAt(point3);
        if (firstSensor && plan.sensors.length) return;
        if (view === "2d") board.focus({ preventScroll: true });
        else element("fp-tab-properties").focus({ preventScroll: true });
        return;
      }
      if (selectRoom) {
        selected = selectRoom;
        setTool("edit");
        render();
        showInspectorStart();
        focusCeilingType();
        return;
      }
      if (action === "library" || action === "flow_sensor" || action === "next_extra_sensor") {
        if (simulation) setSimulation(false);
        roomFormOpen = false;
        updateTools();
        if (libraryIsOpen()) closeLibrary();
        else openLibrary(fromToolbox ? toolbox.querySelector("summary") : button);
        return;
      }
      if (action === "close_library") {
        closeLibrary();
        return;
      }
      if (action) {
        const restore = document.activeElement === button;
        if (projectMenu.contains(button)) {
          projectMenu.open = false;
          if (restore) projectTrigger.focus({ preventScroll: true });
        }
        actions[action]();
        if (simTools.contains(button)) {
          simTools.open = false;
          focusWalkMap();
        }
        if (historyAction && button.disabled) {
          (toolbox.querySelector(".fp-history button:not(:disabled)") ?? toolbox.querySelector("summary")).focus({ preventScroll: true });
        }
        if (restore && action === "rotate") root.querySelector('[data-action="rotate"]')?.focus({ preventScroll: true });
        if (restore && action === "delete") {
          showPanel("outline");
          element("fp-tab-outline").focus({ preventScroll: true });
        }
      }
      if (next) {
        roomFormOpen = false;
        setTool(chosenTool(tool, next));
        if (fromToolbox || !event.detail && next !== "edit") board.focus({ preventScroll: true });
      }
      const registered = integration && haDevice(button.dataset.haDevice);
      if (integration ? registered && !haPlacements().has(registered.id) : model) {
        const strictArea = catalogAreaOnly ? roomById(catalogRoomId)?.haAreaId ?? null : null;
        placementOpener = libraryOpener ?? libraryButton;
        const point3 = quickPlacement;
        closeLibrary(false);
        root.removeAttribute("data-panel");
        setView("2d");
        setTool("place", registered?.model ?? model, registered || null);
        placementAreaId = strictArea;
        if (point3) {
          const firstSensor = !plan.sensors.length;
          drawAt(point3);
          if (firstSensor && plan.sensors.length) return;
        }
        if (matchMedia("(max-width: 760px)").matches) canvas.scrollIntoView({ block: "center" });
        board.focus({ preventScroll: true });
      }
      if (select) {
        selected = select;
        setTool("edit");
        render();
        showInspectorStart();
        element("fp-tab-properties").focus({ preventScroll: true });
        if (event.detail && matchMedia("(max-width: 760px)").matches) {
          element("fp-inspector").closest(".fp-panel").scrollIntoView({ block: "nearest" });
        }
      }
    });
    root.addEventListener("change", async ({ target }) => {
      if (integration && (target.id === "fp-room-ha-area" || target.id === "fp-room-ha-floor")) {
        const { type, item } = selectedItem();
        if (type !== "rooms") return;
        const next = target.id === "fp-room-ha-area" ? roomWithHomeAssistantArea(item, target.value, homeAssistantAreas()) : roomWithHomeAssistantFloor(item, target.value, homeAssistantAreas());
        if (JSON.stringify(next) === JSON.stringify(item)) return;
        remember();
        plan.rooms = plan.rooms.map((room) => room.id === item.id ? next : room);
        selected = next.id;
        finish();
        showInspectorStart();
        element(target.id)?.focus({ preventScroll: true });
        return;
      }
      if (target.id === "fp-room-floor" && building) {
        const { type, item } = selectedItem();
        if (type !== "rooms" || target.value === building.activeFloor) return;
        const project = moveRoomToFloor(projectDocument(), item, target.value);
        if (!project) {
          target.value = building.activeFloor;
          element("fp-save").textContent = copy.invalid;
          return;
        }
        remember();
        readProject(project);
        showFloor(project.activeFloor);
        selected = item.id;
        render();
        showInspectorStart();
        return;
      }
      if (target.id === "fp-zone-type" && tool === "zone") {
        roomDraft = [];
        updateTools();
        renderRoomDraft();
        return;
      }
      if (target.id === "fp-floor-name") {
        const name = target.value.trim();
        const floor = projectFloors().find((floor2) => floor2.id === (building?.activeFloor ?? "ground"));
        if (!name || name === floorLabel(floor, copy)) {
          renderFloors();
          return;
        }
        remember();
        const floors = projectFloors().map((entry) => entry.id === floor.id ? { ...entry, name } : entry);
        building = { ...building, format: buildingFormat, version: 1, name: building?.name ?? plan.name, floors, activeFloor: floor.id };
        finish();
        return;
      }
      if (target.dataset.cornerAxis && tool === "edit_outline") {
        if (target.validity.valid) {
          const point3 = [...roomDraft[draftCorner]];
          point3[target.dataset.cornerAxis === "x" ? 0 : 1] = target.valueAsNumber;
          roomDraft[draftCorner] = point3;
        } else {
          target.reportValidity();
        }
        renderRoomDraft();
        return;
      }
      if (target.id === "fp-underlay-file" && target.files[0]) {
        const file = target.files[0], original = plan;
        const status = element(showStart ? "fp-start-status" : "fp-save");
        target.value = "";
        const opening = underlayKind(file) === "pdf";
        status.toggleAttribute("data-busy", opening);
        if (opening) status.textContent = copy.underlay_pdf_opening;
        try {
          const image = await loadUnderlay(file, choosePdfPage, imageParts ? chooseImagePart : void 0);
          if (!image || plan !== original) {
            status.textContent = "";
            return;
          }
          if (showStart) {
            replacePlan({ ...blankPlan(copy.names.untitled), underlay: image });
          } else {
            remember();
            plan.underlay = image;
          }
          underlayMeasure = null;
          setView("2d");
          setTool("edit");
          finish();
          fit();
          status.textContent = "";
          element("fp-save").textContent = copy.underlay_ready;
        } catch (error) {
          status.textContent = copy[underlayMessage(error)];
        } finally {
          status.removeAttribute("data-busy");
        }
        return;
      }
      if (["fp-underlay-opacity", "fp-underlay-rooms"].includes(target.id) && plan.underlay) {
        remember();
        plan.underlay[target.id === "fp-underlay-rooms" ? "roomTransparency" : "opacity"] = target.valueAsNumber;
        save();
        renderUnderlay();
        return;
      }
      if (target.id === "fp-include-furniture") {
        if (currentWalker()) {
          walkControls.stop();
          walkFurniture = target.checked ? prepareFurnitureOcclusion(plan.furniture) : [];
          for (const [name, walker] of walkersOnFloor()) {
            walkers[name] = startWalker(walker.person, name);
          }
          renderPerson();
        }
        return;
      }
      if (target.id === "fp-furniture-category") {
        renderFurnitureCatalog();
        return;
      }
      if (target.id === "fp-radar-focus") {
        beamChoice = target.value;
        beamKey = null;
        renderPerson();
        return;
      }
      if (target.id === "fp-sim-room" && currentWalker()) {
        const room = plan.rooms.find((room2) => room2.id === target.value);
        if (room) {
          restartWalk(stairSafeStart(currentStairTrip(), personAt(room, currentWalker().person.pose)));
          if (view === "2d") fit();
        }
        return;
      }
      if (target.dataset.field) updateField(target);
      if (target.id === "fp-name") {
        const name = target.value.trim();
        const previous = building?.name ?? plan.name;
        if (name && name !== previous) {
          remember();
          if (building) building.name = name;
          else plan.name = name;
          save();
          updateTools();
        } else {
          target.value = previous;
        }
      }
      if (target.id === "fp-file" && target.files[0]) {
        const file = target.files[0];
        target.value = "";
        try {
          const sweetHome = await Promise.resolve().then(() => (init_floor_planner_sh3d(), floor_planner_sh3d_exports));
          let result;
          if (await sweetHome.isSweetHome(file)) result = { ...await sweetHome.importSweetHome(file, copy), sweetHome: true };
          else {
            if (file.size > maxProjectFileSize) throw new Error("File size");
            const data = JSON.parse(await file.text());
            result = validProject(data) ? { project: data } : (await Promise.resolve().then(() => (init_floor_planner_import(), floor_planner_import_exports))).importRoomGeometry(data, copy);
          }
          if (showStart || confirm(copy.confirm)) {
            if (integration) {
              const used = /* @__PURE__ */ new Set();
              for (const floor of result.project.floors ?? [{ plan: result.project }]) {
                const original = floor.plan.sensors;
                floor.plan.sensors = original.flatMap((sensor) => {
                  const device = haDevice(sensor.haDevice);
                  if (!device || used.has(device.id) || devices[sensor.model].mount !== device.mount) return [];
                  used.add(device.id);
                  return [{ ...sensor, haDevice: device.id, radar: device.radar }];
                });
                const retained = new Set(floor.plan.sensors.map((sensor) => sensor.id));
                if (floor.plan.zones) floor.plan.zones = removeOrphanedSensorZones(floor.plan.zones, retained);
              }
            }
            replacePlan(result.project);
            focusNext();
            const skipped = result.sweetHome && result.review ? copy.import_sh3d_review : "";
            if (integration && !appPlanner) element("fp-save").textContent = [integration.picker.importNote, skipped].filter(Boolean).join(" ");
            else if (result.sweetHome) element("fp-save").textContent = [copy.import_sh3d_done, skipped].filter(Boolean).join(" ");
            else if (result.review) element("fp-save").textContent = result.backup ? copy.import_ha_notes : copy.import_scan_notes;
          }
        } catch (error) {
          element(showStart ? "fp-start-status" : "fp-save").textContent = error?.code === "sh3d_old" && copy.import_sh3d_old ? copy.import_sh3d_old : copy.import_error;
        }
      }
    });
    root.addEventListener("keydown", (event) => {
      if (liveMode) return;
      if (event.target.closest("dialog")) return;
      if (["Delete", "Backspace"].includes(event.key) && !event.repeat && roomRemoval && tool === "edit" && !simulation && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest("input, textarea, select, [contenteditable]")) {
        const { type, item } = selectedItem();
        if (type === "rooms") {
          event.preventDefault();
          askRoomRemoval(item);
          return;
        }
      }
      if (event.key === "Enter" && !event.isComposing && ["fp-floor-name", "fp-name"].includes(event.target.id)) {
        event.preventDefault();
        const trigger = event.target.id === "fp-floor-name" ? floorTrigger : projectTrigger;
        trigger.focus({ preventScroll: true });
        return;
      }
      const marker = sensorMarkerAt(event.target);
      if (marker && tool === "edit" && ["Enter", " "].includes(event.key)) {
        event.preventDefault();
        openSensorEdit(marker.dataset.item);
        return;
      }
      if (event.target.matches('[role="tab"]') && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const properties = event.key === "End" || event.key !== "Home" && event.target.id === "fp-tab-outline";
        const tab = element(properties ? "fp-tab-properties" : "fp-tab-outline");
        tab.click();
        tab.focus();
        return;
      }
      if (event.key === "Escape") {
        const simMenu = simMenus.find((menu) => menu.open);
        if (simMenu) {
          event.preventDefault();
          simMenu.open = false;
          simMenu.querySelector("summary").focus({ preventScroll: true });
          return;
        } else if (floorMenu.open) {
          event.preventDefault();
          closeFloorMenu();
          return;
        } else if (projectMenu.open) {
          event.preventDefault();
          projectMenu.open = false;
          projectTrigger.focus({ preventScroll: true });
        } else if (libraryIsOpen()) {
          event.preventDefault();
          closeLibrary();
        } else if (drawingMenu.open) {
          event.preventDefault();
          drawingMenu.open = false;
          drawingMenu.querySelector("summary").focus({ preventScroll: true });
        } else if (viewMenu.open || toolbox.open) {
          event.preventDefault();
          const menu = viewMenu.open ? viewMenu : toolbox;
          menu.open = false;
          menu.querySelector("summary").focus({ preventScroll: true });
        } else if (roomFormOpen) {
          event.preventDefault();
          actions.close_room_form();
        } else if (simulation) {
          event.preventDefault();
          if (!stairPrompt.hidden) actions.dismiss_stair();
          else if (stairWalk) actions.stop_stairs();
          else actions.test_person();
          return;
        } else if (placingOpening() || ["place", "furnish", "move_furniture", "move_item"].includes(tool)) cancelPlacement();
        else setTool("edit");
      }
      if (event.target.closest("input, select, textarea, [contenteditable]")) return;
      if (simulation) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || !event.target.closest(".fp-drawing")) return;
        if (event.key === "Enter" && !stairPrompt.hidden && !event.target.closest('summary, a, button:not([data-action="confirm_stair"]):not([data-person-move])')) {
          event.preventDefault();
          if (!event.repeat) actions.confirm_stair();
          return;
        }
        const key2 = event.key.toLowerCase();
        const movement = Object.hasOwn(direction, event.key) ? event.key : Object.hasOwn(wasd, key2) ? wasd[key2] : null;
        if (movement && currentWalker() && !event.target.closest(".fp-sim-menu[open]")) {
          event.preventDefault();
          if (!event.repeat && !stairWalk) {
            focusWalkMap();
            walkControls.press(event.code || event.key, movement, activeWalker);
          }
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && ["y", "z"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        if (event.key.toLowerCase() === "y" || event.shiftKey) actions.redo();
        else actions.undo();
      }
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing || event.repeat || !event.target.closest(".fp-drawing") || libraryIsOpen() || drawingMenu.open) return;
      const key = event.key.toLowerCase();
      if (key === "q") {
        setView(view === "2d" ? "3d" : "2d");
        (view === "2d" ? board : viewMenu.querySelector("summary")).focus({ preventScroll: true });
      } else if (key === "d") openLibrary(board);
      else if (key === "f") {
        if (view === "2d") fit();
        else actions.reset_view();
      } else {
        const next = { v: "edit", h: "pan", r: "room", w: "wall" }[key];
        if (!next || view !== "2d") return;
        setTool(next);
        board.focus({ preventScroll: true });
      }
      event.preventDefault();
    });
    board.addEventListener("keydown", (event) => {
      if (simulation || liveMode) return;
      const midpoint2 = event.target.closest("[data-room-midpoint]");
      if (midpoint2 && ["Enter", " "].includes(event.key)) {
        event.preventDefault();
        const room = selectedRoomForHandles();
        if (!room) return;
        const points = roomCorners(room);
        const index = insertWallMidpoint(points, Number(midpoint2.dataset.roomMidpoint));
        const geometry = outlineBounds(points);
        if (geometry && applyRoomOutline(room, geometry)) {
          recentUndo = copy.room_midpoint_saved;
          finish();
          roomHandles.children[index]?.focus({ preventScroll: true });
        }
        return;
      }
      const handle = event.target.closest("[data-room-handle]");
      if (handle && ["Enter", " "].includes(event.key)) {
        event.preventDefault();
        actions.edit_outline(Number(handle.dataset.roomHandle));
        return;
      }
      const offset2 = direction[event.key];
      if (tool === "edit_outline") {
        if (event.key === "PageUp" || event.key === "PageDown") {
          event.preventDefault();
          draftCorner = (draftCorner + (event.key === "PageUp" ? -1 : 1) + roomDraft.length) % roomDraft.length;
          updateTools();
          renderRoomDraft();
        } else if (offset2) {
          event.preventDefault();
          const [x2, y2] = roomDraft[draftCorner];
          const step3 = event.altKey ? 0.05 : 0.25;
          const point3 = finePoint({ x: x2 + offset2[0] * step3, y: y2 + offset2[1] * step3 });
          roomDraft[draftCorner] = [point3.x, point3.y];
          renderRoomDraft();
          announcePosition(point3);
        } else if (event.key === "Enter") {
          event.preventDefault();
          saveRoomDraft();
        }
        return;
      }
      if (["outline_room", "zone"].includes(tool) && event.key === "Backspace") {
        event.preventDefault();
        actions.undo_corner();
        return;
      }
      if (tool === "move_item") return;
      if (event.key === "Enter" && !["edit", "pan"].includes(tool)) {
        event.preventDefault();
        if (placingOpening() && placementPoint) placeOpening();
        else if (["outline_room", "zone"].includes(tool) && event.shiftKey) saveRoomDraft();
        else drawAt(cursor ?? (["place", "furnish", "move_furniture"].includes(tool) ? placementOrigin() : limitPoint(camera2)));
      }
      if (!offset2) return;
      event.preventDefault();
      if (placingOpening() && placementPoint) {
        placementPoint = null;
        updateTools();
      }
      if (tool === "pan") {
        camera2.x += offset2[0] * 0.5;
        camera2.y += offset2[1] * 0.5;
        updateView();
        return;
      }
      cursor ??= tool === "place" ? placementOrigin() : limitPoint(camera2);
      const step2 = event.shiftKey ? 1 : 0.25;
      cursor = limitPoint({ x: cursor.x + offset2[0] * step2, y: cursor.y + offset2[1] * step2 });
      const { x, y, width, height } = canvas.viewBox.baseVal;
      if (cursor.x < x + 0.25 || cursor.x > x + width - 0.25) camera2.x = cursor.x;
      if (cursor.y < y + 0.25 || cursor.y > y + height - 0.25) camera2.y = cursor.y;
      updateView();
      updateCursor();
      showGhost(cursor);
      announcePosition(cursor);
    });
    board.addEventListener("blur", () => {
      cursor = null;
      updateCursor();
    });
    roomForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const [width, depth, height] = ["width", "depth", "height"].map((field2) => roomForm.elements[field2].valueAsNumber);
      const rooms = plan.rooms;
      const right = rooms.length ? Math.max(...rooms.map((room) => room.x + room.width)) + 0.5 : 0;
      const bottom2 = rooms.length ? Math.max(...rooms.map((room) => room.y + room.depth)) + 0.5 : 0;
      const atRight = right + width <= 100;
      const position = atRight ? { x: right, y: 0 } : { x: 0, y: bottom2 };
      const error = element("fp-room-form-error");
      if (!atRight && bottom2 + depth > 100) {
        error.hidden = false;
        return;
      }
      roomFormOpen = false;
      if (!makeItem("rooms", { ...position, width, depth, height, name: `${copy.room} ${rooms.length + 1}` })) {
        roomFormOpen = true;
        renderFlow();
        error.hidden = false;
        return;
      }
      fit();
      roomForm.reset();
      focusNext();
    });
    renderCatalog();
    element("fp-floor-separation").addEventListener("input", (event) => {
      floorSeparation = event.target.valueAsNumber;
      if (allFloors) renderSpatialDrawing();
    });
    element("fp-furniture-search").addEventListener("input", renderFurnitureCatalog);
    element("fp-underlay-opacity").addEventListener("input", (event) => {
      element("fp-underlay").setAttribute("opacity", event.target.valueAsNumber / 100);
    });
    element("fp-underlay-rooms").addEventListener("input", (event) => showRoomTransparency(event.target.valueAsNumber));
    arrangeProjectControls();
    if (exampleHome && building?.floors.length > 1) showFloor("all");
    else render();
    fit();
    if (showStart) {
      const { floors, staircase } = demoHome();
      void Promise.resolve().then(() => (init_floor_planner_preview(), floor_planner_preview_exports)).then(({ startDemoPreview: startDemoPreview2 }) => {
        if (showStart) stopDemoPreview = startDemoPreview2(
          element("fp-start"),
          floors.map((floor) => ({ ...floor, label: floorLabel(floor, copy) })),
          staircase,
          copy,
          reducedMotion
        );
      });
    } else save();
    if (sharedPending) openSharedPlan();
    if (integration) integration.connect({
      devicesChanged() {
        render();
      },
      roomPlacements() {
        const floors = allFloors ? projectFloors() : projectFloors().filter((floor) => floor.id === (building?.activeFloor ?? "ground"));
        return floors.flatMap((floor) => {
          const assignments = /* @__PURE__ */ new Map();
          for (const sensor of floor.plan.sensors) {
            const room = roomForDevice(floor.plan.rooms, sensor);
            const device = sensor.haDevice && haDevice(sensor.haDevice) ? sensor.haDevice : null;
            if (room && device) assignments.set(room.id, [...assignments.get(room.id) ?? [], device]);
          }
          return floor.plan.rooms.map((room) => ({
            id: room.id,
            floor: floor.id,
            name: room.name,
            devices: assignments.get(room.id) ?? []
          }));
        });
      },
      radarContext() {
        const { type, item } = selectedItem();
        const room = currentRoom() ?? plan.rooms[0];
        return { roomId: room?.haRoom ?? room?.id, sensorId: type === "sensors" ? item.haSource ?? item.id : void 0 };
      },
      setMode(mode) {
        const live = mode === "live";
        if (live === liveMode) return;
        if (simulation) setSimulation(false);
        sensorEdit.close();
        liveMode = live;
        root.toggleAttribute("data-ha-live", live);
        element("fp-name").readOnly = live;
        if (live) {
          setTool("edit");
          showFloor(projectFloors().length > 1 ? "all" : projectFloors()[0].id);
          if (view !== "3d") setView("3d");
        } else {
          showFloor(building?.activeFloor ?? "ground");
        }
        root.removeAttribute("data-panel");
        renderDrawing();
      },
      setPeople(people) {
        livePeople = people;
        renderPerson();
      },
      applySaved(project) {
        readProject(project);
        render();
      }
    });
    root.removeAttribute("data-panel");
    new ResizeObserver(updateView).observe(canvas);
    new ResizeObserver(sizeSpaceLabels).observe(space);
    for (const menu of [projectMenu, floorMenu, ...simMenus]) {
      menu.addEventListener("focusout", (event) => {
        if (event.relatedTarget?.tabIndex >= 0 && !menu.contains(event.relatedTarget)) menu.open = false;
      });
    }
    document.addEventListener("click", (event) => {
      for (const menu of simMenus) {
        if (menu.open && !menu.contains(event.target)) menu.open = false;
      }
      if (projectMenu.open && !projectMenu.contains(event.target)) projectMenu.open = false;
      if (floorMenu.open && !floorMenu.contains(event.target)) floorMenu.open = false;
      if (drawingMenu.open && !drawingMenu.contains(event.target)) drawingMenu.open = false;
      if (viewMenu.open && !viewMenu.contains(event.target)) viewMenu.open = false;
      if (toolbox.open && !toolbox.contains(event.target)) toolbox.open = false;
    });
    toolbox.addEventListener("toggle", () => {
      if (toolbox.open && compactLibrary.matches && toolbox.getBoundingClientRect().bottom > innerHeight * 0.52) {
        toolbox.querySelector("summary").scrollIntoView({ block: "center" });
      }
    });
    document.addEventListener("focusin", (event) => {
      if (simulation && !event.target.closest(".fp-drawing")) walkControls.stop();
    });
    orderButton = element("fp-open-order");
    orderButton.addEventListener("click", () => openOrder(orderButton));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoWalk();
    });
  }
});

// ../panel/src/utils/reflection-protection.ts
var DEFAULT_REFLECTION_DEPTH_MM = 2e3;
var OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM = 350;
var REFLECTION_START_OFFSET_MM = OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM;
var clamp = (value, min, max) => Math.min(max, Math.max(min, value));
var polygonSignedArea = (points) => points.reduce(
  (area, point3, index) => {
    const next = points[(index + 1) % points.length];
    return area + point3.x * next.y - next.x * point3.y;
  },
  0
) / 2;
var orientation = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
var strictlyBetween = (value, first, second) => value > Math.min(first, second) + 1e-3 && value < Math.max(first, second) - 1e-3;
var properSegmentIntersection = (a, b, c, d) => {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  if (first * second < -1e-3 && third * fourth < -1e-3) return true;
  if (Math.abs(first) <= 1e-3 && strictlyBetween(c.x, a.x, b.x) && strictlyBetween(c.y, a.y, b.y)) return true;
  if (Math.abs(second) <= 1e-3 && strictlyBetween(d.x, a.x, b.x) && strictlyBetween(d.y, a.y, b.y)) return true;
  return false;
};
var pointToSegmentDistance = (point3, start3, end2) => {
  const dx = end2.x - start3.x;
  const dy = end2.y - start3.y;
  const lengthSquared = dx * dx + dy * dy;
  const fraction = lengthSquared > 0 ? Math.max(0, Math.min(
    1,
    ((point3.x - start3.x) * dx + (point3.y - start3.y) * dy) / lengthSquared
  )) : 0;
  return Math.hypot(
    point3.x - (start3.x + fraction * dx),
    point3.y - (start3.y + fraction * dy)
  );
};
var segmentDistance = (a, b, c, d) => {
  if (properSegmentIntersection(a, b, c, d)) return 0;
  return Math.min(
    pointToSegmentDistance(a, c, d),
    pointToSegmentDistance(b, c, d),
    pointToSegmentDistance(c, a, b),
    pointToSegmentDistance(d, a, b)
  );
};
var reflectionPolygonEntersRoom = (reflection, room) => {
  if (reflection.some((point3) => pointInPolygon(point3, room))) return true;
  if (room.some((point3) => pointInPolygon(point3, reflection))) return true;
  for (let reflectionIndex = 0; reflectionIndex < reflection.length; reflectionIndex += 1) {
    const reflectionStart = reflection[reflectionIndex];
    const reflectionEnd = reflection[(reflectionIndex + 1) % reflection.length];
    const midpoint2 = {
      x: (reflectionStart.x + reflectionEnd.x) / 2,
      y: (reflectionStart.y + reflectionEnd.y) / 2
    };
    if (pointInPolygon(midpoint2, room)) return true;
    for (let roomIndex = 0; roomIndex < room.length; roomIndex += 1) {
      const distance4 = segmentDistance(
        reflectionStart,
        reflectionEnd,
        room[roomIndex],
        room[(roomIndex + 1) % room.length]
      );
      if (distance4 < OUTSIDE_ROOM_SUPPRESSION_MARGIN_MM - 1e-3) return true;
    }
  }
  return false;
};
var mirrorSegment = (roomPoints, mirror2) => {
  if (roomPoints.length < 3 || mirror2.wallIndex < 0 || mirror2.wallIndex >= roomPoints.length) return null;
  const start3 = roomPoints[mirror2.wallIndex];
  const end2 = roomPoints[(mirror2.wallIndex + 1) % roomPoints.length];
  const dx = end2.x - start3.x;
  const dy = end2.y - start3.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1) return null;
  const halfFraction = clamp((Number(mirror2.width) || 0) / length / 2, 5e-3, 0.5);
  const position = clamp(Number(mirror2.position) || 0.5, halfFraction, 1 - halfFraction);
  const firstT = position - halfFraction;
  const secondT = position + halfFraction;
  return [
    { x: start3.x + dx * firstT, y: start3.y + dy * firstT },
    { x: start3.x + dx * secondT, y: start3.y + dy * secondT }
  ];
};
var createMirrorReflectionPolygon = (roomPoints, mirror2, sensor) => {
  if (mirror2.protectionEnabled !== true) return null;
  const segment = mirrorSegment(roomPoints, mirror2);
  if (!segment || !Number.isFinite(sensor.x) || !Number.isFinite(sensor.y)) return null;
  const protectionDepth = clamp(
    Number(mirror2.reflectionDepthMm) || DEFAULT_REFLECTION_DEPTH_MM,
    250,
    6e3
  );
  const wallStart = roomPoints[mirror2.wallIndex];
  const wallEnd = roomPoints[(mirror2.wallIndex + 1) % roomPoints.length];
  const wallDx = wallEnd.x - wallStart.x;
  const wallDy = wallEnd.y - wallStart.y;
  const wallLength = Math.hypot(wallDx, wallDy);
  if (!Number.isFinite(wallLength) || wallLength < 1) return null;
  const signedArea2 = polygonSignedArea(roomPoints);
  if (!Number.isFinite(signedArea2) || Math.abs(signedArea2) < 1) return null;
  const outwardNormal = signedArea2 > 0 ? { x: wallDy / wallLength, y: -wallDx / wallLength } : { x: -wallDy / wallLength, y: wallDx / wallLength };
  const extendToPerpendicularDepth = (point3, perpendicularDepth) => {
    const dx = point3.x - sensor.x;
    const dy = point3.y - sensor.y;
    const distance4 = Math.hypot(dx, dy);
    if (!Number.isFinite(distance4) || distance4 < 100) return null;
    const rayX = dx / distance4;
    const rayY = dy / distance4;
    const outwardComponent = rayX * outwardNormal.x + rayY * outwardNormal.y;
    if (!Number.isFinite(outwardComponent) || outwardComponent <= 0.01) return null;
    const extra = perpendicularDepth / outwardComponent;
    return {
      x: point3.x + rayX * extra,
      y: point3.y + rayY * extra
    };
  };
  const nearA = extendToPerpendicularDepth(segment[0], REFLECTION_START_OFFSET_MM);
  const nearB = extendToPerpendicularDepth(segment[1], REFLECTION_START_OFFSET_MM);
  const farDepth = REFLECTION_START_OFFSET_MM + protectionDepth;
  const farA = extendToPerpendicularDepth(segment[0], farDepth);
  const farB = extendToPerpendicularDepth(segment[1], farDepth);
  if (!nearA || !nearB || !farA || !farB) return null;
  const points = [nearA, nearB, farB, farA];
  if (reflectionPolygonEntersRoom(points, roomPoints)) return null;
  return { mirrorId: mirror2.id, points };
};
var pointInPolygon = (point3, polygon2) => {
  if (polygon2.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon2.length - 1; i < polygon2.length; j = i++) {
    const a = polygon2[i];
    const b = polygon2[j];
    const crosses = a.y > point3.y !== b.y > point3.y && point3.x < (b.x - a.x) * (point3.y - a.y) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
};

// src/ha/ha-mirrors.js
init_floor_planner_geometry();
init_floor_planner_model();
var tracking = ["ld2450", "ld2460"];
var exclusionSlots = 2;
var wallReach = 0.1;
var middleOf = (mirror2) => {
  const turn = mirror2.angle * Math.PI / 180;
  return { x: mirror2.x + Math.cos(turn) * mirror2.width / 2, y: mirror2.y + Math.sin(turn) * mirror2.width / 2 };
};
function mirrorProtection(plan2) {
  const wedges = (plan2.mirrors ?? []).filter((mirror2) => mirror2.protectionEnabled === true).flatMap((mirror2) => {
    const room = plan2.rooms.find((room2) => room2.id === mirror2.roomId);
    if (!room) return [];
    const corners = roomCorners(room);
    const middle = middleOf(mirror2);
    const [wall2] = polygonEdges(corners).map(([a, b], index) => ({ index, ...edgePosition(a, b, middle) })).map((edge) => ({ ...edge, away: Math.hypot(edge.x - middle.x, edge.y - middle.y) })).sort((a, b) => a.away - b.away);
    if (!wall2 || wall2.away > wallReach) return [];
    const outline = corners.map(([x, y]) => ({ x: x * 1e3, y: y * 1e3 }));
    const placement = {
      id: mirror2.id,
      wallIndex: wall2.index,
      position: wall2.along / wall2.length,
      width: mirror2.width * 1e3,
      protectionEnabled: true,
      reflectionDepthMm: Math.round((mirror2.reflectionDepthM ?? 2) * 1e3)
    };
    return plan2.sensors.filter((sensor) => tracking.includes(sensor.radar) && roomForDevice(plan2.rooms, sensor)?.id === room.id).flatMap((sensor) => {
      const wedge = createMirrorReflectionPolygon(outline, placement, { id: sensor.id, x: sensor.x * 1e3, y: sensor.y * 1e3 });
      return wedge ? [{
        mirrorId: mirror2.id,
        sensorId: sensor.id,
        points: wedge.points.map(({ x, y }) => [Number((x / 1e3).toFixed(3)), Number((y / 1e3).toFixed(3))])
      }] : [];
    });
  });
  const crowded = plan2.sensors.filter((sensor) => {
    const room = roomForDevice(plan2.rooms, sensor);
    const drawn = (plan2.zones ?? []).filter((zone) => zone.type === "exclusion" && zone.roomId === room?.id && (!zone.sensorId || zone.sensorId === sensor.id)).length;
    const mirrored = wedges.filter((wedge) => wedge.sensorId === sensor.id).length;
    return mirrored > 0 && drawn + mirrored > exclusionSlots;
  }).map((sensor) => sensor.id);
  return { wedges, crowded };
}

// src/ha/editor-entry.js
var host = window.frameElement?.floorPlannerHost;
if (host) {
  host.mirrorProtection = mirrorProtection;
  window.floorPlannerHost = host;
  document.documentElement.dataset.haTheme = host.theme();
  document.querySelector("#main-content").setAttribute("aria-label", window.frameElement.title);
  document.querySelector("#floor-planner").setAttribute("data-ha-editor", "");
  document.querySelector("#fp-ha-device-label").textContent = host.labels[9];
  document.querySelector("#fp-library-title").textContent = host.picker.title;
  document.querySelector('label[for="fp-search"]').textContent = host.picker.search;
  document.querySelector("#fp-search").placeholder = host.picker.search;
  host.mountActions(document.querySelector("#fp-project"));
  await Promise.resolve().then(() => (init_floor_planner2(), floor_planner_exports));
}
