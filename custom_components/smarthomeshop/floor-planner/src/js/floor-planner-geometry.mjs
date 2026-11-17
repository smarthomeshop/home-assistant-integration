const epsilon = 1e-7;
export const maxRoomCorners = 64;
export const defaultWindowSill = 1.15;
const rectangle = room => [
    [room.x, room.y], [room.x + room.width, room.y],
    [room.x + room.width, room.y + room.depth], [room.x, room.y + room.depth],
];
export const roomCorners = room => room.outline?.map(([x, y]) => [x + room.x, y + room.y]) ?? rectangle(room);
export const polygonEdges = points => points.map((point, index) => [point, points[(index + 1) % points.length]]);
const cross = (ax, ay, bx, by) => ax * by - ay * bx;
export function convexHull(points) {
    if (points.length < 3) return points;
    const sorted = [...points].sort(([ax, ay], [bx, by]) => ax - bx || ay - by);
    const half = ordered => {
        const edge = [];
        for (const point of ordered) {
            while (edge.length > 1) {
                const [ax, ay] = edge.at(-2), [bx, by] = edge.at(-1);
                if (cross(bx - ax, by - ay, point[0] - ax, point[1] - ay) > 0) break;
                edge.pop();
            }
            edge.push(point);
        }
        return edge.slice(0, -1);
    };
    return [...half(sorted), ...half(sorted.reverse())];
}

const signedArea = points => polygonEdges(points).reduce((area, [[ax, ay], [bx, by]]) => area + ax * by - ay * bx, 0) / 2;
export const roomArea = room => room.outline ? Math.abs(signedArea(room.outline)) : room.width * room.depth;
const samePoint = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < epsilon;
const onSegment = ([x, y], [ax, ay], [bx, by]) =>
    Math.abs(cross(bx - ax, by - ay, x - ax, y - ay)) < epsilon
    && x >= Math.min(ax, bx) - epsilon && x <= Math.max(ax, bx) + epsilon
    && y >= Math.min(ay, by) - epsilon && y <= Math.max(ay, by) + epsilon;

export function roomWallEdges(room) {
    const corners = roomCorners(room);
    return polygonEdges(corners.filter((point, index) => !onSegment(point,
        corners[(index + corners.length - 1) % corners.length], corners[(index + 1) % corners.length])));
}

function polygonContains(vertices, x, y, includeEdge = true) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const a = vertices[j], b = vertices[i];
        if (onSegment([x, y], a, b)) return includeEdge;
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
}

export const pointInOutline = (vertices, point) => polygonContains(vertices, point.x, point.y);

export function roomContains(room, point, includeEdge = true) {
    const x = point.x - room.x, y = point.y - room.y;
    if (!room.outline) return includeEdge
        ? point.x >= room.x && point.y >= room.y && point.x <= room.x + room.width && point.y <= room.y + room.depth
        : x > epsilon && y > epsilon && x < room.width - epsilon && y < room.depth - epsilon;
    if (x < -epsilon || y < -epsilon || x > room.width + epsilon || y > room.depth + epsilon) return false;
    return polygonContains(room.outline, x, y, includeEdge);
}

// Parameter along AB at its intersection with CD, or null for parallel/disjoint edges.
function crossing(a, b, c, d) {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], [ex, ey] = [d[0] - c[0], d[1] - c[1]];
    const determinant = cross(dx, dy, ex, ey);
    if (Math.abs(determinant) < epsilon) return null;
    const [x, y] = [c[0] - a[0], c[1] - a[1]];
    const t = cross(x, y, ex, ey) / determinant, u = cross(x, y, dx, dy) / determinant;
    return t >= -epsilon && t <= 1 + epsilon && u >= -epsilon && u <= 1 + epsilon ? Math.max(0, Math.min(1, t)) : null;
}

export function outlineBounds(points, { maxCorners = maxRoomCorners, minSpan = .5, maxSpan = 60, minArea = .1 } = {}) {
    if (points.length < 3 || points.length > maxCorners || points.some(point => !Array.isArray(point)
        || point.length !== 2 || !point.every(Number.isFinite))) return null;
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
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
            const [c, d] = edges[j];
            if (crossing(a, b, c, d) !== null || onSegment(a, c, d) || onSegment(b, c, d)
                || onSegment(c, a, b) || onSegment(d, a, b)) return null;
        }
    }
    const outline = (area > 0 ? points : [points[0], ...points.slice(1).reverse()]).map(([px, py]) => [px - x, py - y]);
    return { x, y, width, depth, outline };
}

export function validRoomOutline(room) {
    if (!Array.isArray(room.outline)) return false;
    const bounds = outlineBounds(room.outline);
    return Boolean(bounds && Math.abs(bounds.x) < epsilon && Math.abs(bounds.y) < epsilon
        && Math.abs(bounds.width - room.width) < epsilon && Math.abs(bounds.depth - room.depth) < epsilon
        && signedArea(room.outline) > 0);
}

export function roomLineSpans(room, from, to, includeEdge = true) {
    const a = [from.x, from.y], b = [to.x, to.y];
    const cuts = [0, 1];
    for (const [c, d] of polygonEdges(roomCorners(room))) {
        const t = crossing(a, b, c, d);
        if (t !== null) cuts.push(t);
    }
    cuts.sort((a, b) => a - b);
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

export const roomContainsLine = (room, from, to) => {
    const spans = roomLineSpans(room, from, to);
    return spans[0]?.[0] < epsilon && spans[0][1] > 1 - epsilon;
};

export function roomRayEnd(room, origin, target, edges = polygonEdges(roomCorners(room))) {
    const a = [origin.x, origin.y], b = [target.x, target.y];
    let limit = 1;
    if (!roomContains(room, { x: origin.x + (target.x - origin.x) * 1e-5, y: origin.y + (target.y - origin.y) * 1e-5 })) limit = 0;
    else for (const [c, d] of edges) {
        const t = crossing(a, b, c, d);
        if (t !== null && t > epsilon) limit = Math.min(limit, t);
    }
    return [a[0] + (b[0] - a[0]) * limit, a[1] + (b[1] - a[1]) * limit];
}

export function roomVisibility(room, origin) {
    const corners = roomCorners(room);
    const edges = polygonEdges(corners);
    const distance = Math.hypot(room.width, room.depth) + 1;
    const angles = corners.flatMap(([x, y]) => {
        const angle = Math.atan2(y - origin.y, x - origin.x);
        return [angle - .00001, angle, angle + .00001];
    }).map(angle => (angle + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
    return angles.map(angle => roomRayEnd(room, origin, {
        x: origin.x + Math.cos(angle) * distance, y: origin.y + Math.sin(angle) * distance,
    }, edges));
}

export function roomInteriorPoint(room, preferred = { x: room.x + room.width / 2, y: room.y + room.depth / 2 }) {
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

export function edgePosition([ax, ay], [bx, by], point) {
    const dx = bx - ax, dy = by - ay;
    const length = Math.hypot(dx, dy);
    const along = Math.max(0, Math.min(length, ((point.x - ax) * dx + (point.y - ay) * dy) / length));
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return { x: ax + dx * along / length, y: ay + dy * along / length, along, length,
        facing: (angle + 540) % 360, angle: (angle + 360) % 360, a: [ax, ay], b: [bx, by] };
}
export const doorsOnPlan = plan => plan.doors.map(door => {
    const angle = door.angle * Math.PI / 180;
    return [[door.x, door.y], [door.x + door.width * Math.cos(angle), door.y + door.width * Math.sin(angle)]];
});

// The parts of the wall from a to b that are left between the doors. A door
// counts when it lies within reach of the wall's line: a few centimetres for a
// door drawn on this wall, more to also open the other face of a thick wall.
export function wallSegments(a, b, doors, reach = .04) {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const length = Math.hypot(dx, dy);
    const position = ([x, y]) => ((x - a[0]) * dx + (y - a[1]) * dy) / length ** 2;
    const onLine = ([x, y]) => Math.abs((x - a[0]) * dy - (y - a[1]) * dx) / length < reach;
    const openings = doors.filter(door => door.every(onLine)).map(door => door.map(position).sort((a, b) => a - b))
        .filter(([from, to]) => to > 0 && from < 1)
        .sort(([a], [b]) => a - b);
    const at = fraction => [a[0] + dx * fraction, a[1] + dy * fraction];
    const segments = [];
    let end = 0;
    for (const [from, to] of openings) {
        if (from > end) segments.push([at(end), at(from)]);
        end = Math.max(end, to);
    }
    if (end < 1) segments.push([at(end), b]);
    return segments;
}
