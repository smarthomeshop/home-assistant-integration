import { furnitureParts } from './floor-planner-furniture.mjs';
import { doorsOnPlan, roomArea, roomInteriorPoint, roomLineSpans } from './floor-planner-geometry.mjs';
import { contains } from './floor-planner-model.mjs';
import { movePerson } from './floor-planner-person.mjs';

const clearance = .17;
const epsilon = 1e-7;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function intersection(from, to, left, top, right, bottom) {
    let start = 0, end = 1;
    for (const [origin, delta, min, max] of [
        [from.x, to.x - from.x, left, right], [from.y, to.y - from.y, top, bottom],
    ]) {
        if (Math.abs(delta) < epsilon) {
            if (origin < min || origin > max) return null;
            continue;
        }
        const a = (min - origin) / delta, b = (max - origin) / delta;
        start = Math.max(start, Math.min(a, b));
        end = Math.min(end, Math.max(a, b));
        if (start > end) return null;
    }
    return [start, end];
}

function distanceToLine(point, from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const fraction = Math.min(1, Math.max(0, ((point.x - from.x) * dx + (point.y - from.y) * dy) / (dx * dx + dy * dy || 1)));
    return distance(point, { x: from.x + dx * fraction, y: from.y + dy * fraction });
}

function floorConnects(rooms, from, to) {
    if (rooms.some(room => !room.outline && contains(room, from) && contains(room, to))) return true;
    const intervals = rooms.flatMap(room => {
        const { x, y, width, depth } = room;
        const box = intersection(from, to, x, y, x + width, y + depth);
        return !box ? [] : room.outline ? roomLineSpans(room, from, to) : [box];
    }).sort((a, b) => a[0] - b[0]);
    let end = 0;
    for (const [start, stop] of intervals) {
        if (start > end + epsilon) return false;
        end = Math.max(stop, end);
        if (end >= 1 - epsilon) return true;
    }
    return false;
}

function walkingObstacle(item) {
    const angle = item.angle * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const local = ({ x, y }) => ({ x: (x - item.x) * cos + (y - item.y) * sin, y: (y - item.y) * cos - (x - item.x) * sin });
    const parts = furnitureParts(item).filter(part => part.high > .065 && part.low < 1.78);
    const radius = Math.hypot(item.width / 2 + clearance, item.depth / 2 + clearance);
    return { item, local, parts, radius };
}

export function createWalkNetwork({ rooms, furniture = [], doors }, walls) {
    const obstacles = furniture.map(walkingObstacle).filter(obstacle => obstacle.parts.length);
    const segments = walls.map(([[x, y], [endX, endY]]) => ({
        a: { x, y }, b: { x: endX, y: endY },
        bounds: [Math.min(x, endX) - clearance, Math.min(y, endY) - clearance,
            Math.max(x, endX) + clearance, Math.max(y, endY) + clearance],
    }));
    const area = rooms.reduce((sum, room) => sum + roomArea(room), 0);
    const step = Math.max(.36, Math.sqrt(area / 2800));
    const reach = step * 1.85;
    const buckets = new Map(), nodes = [], positions = new Set();
    const bucketKey = (x, y) => x + ':' + y;

    function clear(from, to) {
        if (!floorConnects(rooms, from, to)) return false;
        if (movePerson(rooms, walls, from, to.x - from.x, to.y - from.y) === from) return false;
        for (const { a, b, bounds } of segments) {
            if (!intersection(from, to, ...bounds)) continue;
            if (distanceToLine(from, a, b) < clearance || distanceToLine(to, a, b) < clearance
                || distanceToLine(a, from, to) < clearance || distanceToLine(b, from, to) < clearance) return false;
        }
        for (const { item, local, parts, radius } of obstacles) {
            if (distanceToLine(item, from, to) > radius) continue;
            const a = local(from), b = local(to);
            if (parts.some(part => intersection(a, b, part.x - clearance, part.y - clearance,
                part.x + part.w + clearance, part.y + part.d + clearance))) return false;
        }
        return true;
    }

    function add(point) {
        const position = bucketKey(point.x, point.y);
        if (positions.has(position)) return;
        const room = rooms.find(room => contains(room, point));
        if (!room || !clear(point, point)) return;
        positions.add(position);
        const key = bucketKey(Math.floor(point.x / reach), Math.floor(point.y / reach));
        if (!buckets.has(key)) buckets.set(key, []);
        const node = { ...point, room, edges: null };
        buckets.get(key).push(node);
        nodes.push(node);
    }

    for (const room of rooms) {
        if (room.outline) add(roomInteriorPoint(room));
        const columns = Math.ceil(room.width / step), rows = Math.ceil(room.depth / step);
        for (let row = 0; row < rows; row++) {
            const y = room.y + (row + .5) * room.depth / rows;
            const spans = room.outline ? roomLineSpans(room, { x: room.x, y }, { x: room.x + room.width, y }) : [[0, 1]];
            for (const [left, right] of spans) {
                const first = Math.ceil(left * columns - .5), last = Math.floor(right * columns - .5);
                if (first > last) add({ x: room.x + (left + right) * room.width / 2, y });
                for (let column = first; column <= last; column++) {
                    add({ x: room.x + (column + .5) * room.width / columns, y });
                }
            }
        }
    }
    for (const [[x, y], [endX, endY]] of doorsOnPlan({ doors })) {
        const width = Math.hypot(endX - x, endY - y);
        for (const offset of [0, .27, -.27]) {
            add({ x: (x + endX) / 2 + offset * (endY - y) / width, y: (y + endY) / 2 - offset * (endX - x) / width });
        }
    }

    function connections(point) {
        const x = Math.floor(point.x / reach), y = Math.floor(point.y / reach);
        const adjacent = [];
        for (let row = y - 1; row <= y + 1; row++) {
            for (let col = x - 1; col <= x + 1; col++) {
                for (const node of buckets.get(bucketKey(col, row)) ?? []) {
                    if (node !== point && distance(point, node) <= reach && clear(point, node)) adjacent.push(node);
                }
            }
        }
        return adjacent;
    }

    function startAt(point) {
        if (clear(point, point)) return connections(point).length ? point : null;
        const room = rooms.find(room => contains(room, point));
        let nearest = null, best = Infinity;
        for (const node of nodes) {
            if (node.room !== room || !floorConnects(rooms, point, node)) continue;
            const gap = distance(point, node);
            if (gap >= best || movePerson(rooms, walls, point, node.x - point.x, node.y - point.y) === point) continue;
            node.edges ??= connections(node);
            if (node.edges.some(edge => distance(edge, node) > epsilon)) {
                nearest = node;
                best = gap;
            }
        }
        return nearest;
    }

    function walkTree(point) {
        const queue = connections(point);
        const parents = new Map(queue.map(node => [node, null]));
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

    function waypointsTo(point, goal, parents) {
        const path = [];
        for (let node = goal; node; node = parents.get(node)) path.push(node);
        path.reverse();
        const waypoints = [];
        let from = point;
        for (let i = 0; i < path.length;) {
            let next = Math.min(i + 12, path.length - 1);
            while (next > i && !clear(from, path[next])) next--;
            from = path[next];
            waypoints.push(from);
            i = next + 1;
        }
        return waypoints;
    }

    function routeFrom(point, random = Math.random) {
        const { queue, parents } = walkTree(point);
        const otherRooms = queue.filter(node => !contains(node.room, point));
        const far = queue.filter(node => distance(node, point) > .9);
        const goals = otherRooms.length ? otherRooms : far.length ? far : queue.filter(node => distance(node, point) > .1);
        return waypointsTo(point, goals[Math.floor(random() * goals.length)], parents);
    }

    function routeToActivity(point, choose) {
        const { queue, parents } = walkTree(point);
        const activity = choose(queue);
        return activity && { ...activity, points: waypointsTo(point, activity.approach, parents) };
    }

    function routeTo(point, goal) {
        if (clear(point, goal)) return [goal];
        const { queue, parents } = walkTree(point);
        const approach = queue.find(node => distance(node, goal) <= reach && clear(node, goal));
        return approach ? [...waypointsTo(point, approach, parents), goal] : null;
    }

    return { startAt, routeFrom, routeTo, routeToActivity, clear };
}
