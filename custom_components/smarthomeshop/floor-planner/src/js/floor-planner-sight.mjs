// What a radar can see across a floor. Walls stop it: the edges of every room
// and the walls drawn inside a room. An open door lets it through, up to the
// top of the door frame. A closed door is a wall, until somebody stands at it:
// a person opens the door they walk through.
//
// This is the cautious reading of a radar. In a real home some signal passes
// a thin wall or a closed door, but not in a way a plan can promise.
import { doorsOnPlan, polygonEdges, roomCorners, wallSegments } from './floor-planner-geometry.mjs';

// The top of a door frame, in metres. The wall above it keeps a ceiling radar
// from looking far into the next room.
export const doorHeight = 2.1;
// A closed door is open for a person who stands this close to it, in metres.
export const doorReach = .75;
// The height a radar aims for on a standing person, as in the walk test.
export const standingTarget = 1.35;
// The two faces of one wall may be drawn as two lines this far apart. A door
// in one of them is a door in both.
const wallThickness = .3;
// How far a line of sight is followed when nothing stops it, in metres.
const farAway = 80;
const fullTurn = Math.PI * 2;

const distanceToSpan = (point, [[ax, ay], [bx, by]]) => {
    const dx = bx - ax, dy = by - ay;
    const along = Math.min(1, Math.max(0, ((point.x - ax) * dx + (point.y - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(point.x - ax - dx * along, point.y - ay - dy * along);
};

/** The ids of the closed doors that are open right now because one of the people stands at them. */
export function doorsHeldOpen(plan, people) {
    const held = new Set();
    doorsOnPlan(plan).forEach((span, index) => {
        const door = plan.doors[index];
        if (door.closed && people.some(person => distanceToSpan(person, span) <= doorReach)) held.add(door.id);
    });
    return held;
}

/** The door whose opening lies within `reach` metres of a point, to open or close it with a click. */
export function doorAt(plan, point, reach = .22) {
    const index = doorsOnPlan(plan).findIndex(span => distanceToSpan(point, span) <= reach);
    return index < 0 ? null : plan.doors[index];
}

/** The plan as it looks while those doors are held open. */
export const planWithOpenDoors = (plan, held) => held?.size
    ? { ...plan, doors: plan.doors.map(door => held.has(door.id) ? { ...door, closed: false } : door) } : plan;

/**
 * Everything on a floor that decides what a radar sees: the stretches of wall
 * that stop it and the open doors it can look through. Doors in `held` count
 * as open although the plan has them closed.
 */
export function prepareSight(plan, held = null) {
    const doors = doorsOnPlan({ doors: (plan.doors ?? []).filter(door => !door.closed || held?.has(door.id)) });
    const edges = [
        ...plan.rooms.flatMap(room => polygonEdges(roomCorners(room))),
        ...(plan.walls ?? []).map(wall => [[wall.x, wall.y], [wall.endX, wall.endY]]),
    ];
    const walls = edges.flatMap(([a, b]) => wallSegments(a, b, doors, wallThickness))
        .filter(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-6);
    return { walls, doors };
}

// How far along the line from `from` to `to` (0 to 1) it meets the stretch
// between a and b, or null when it passes it by. A line along a wall does not
// meet it.
function meets(from, to, [a, b]) {
    const rx = to.x - from.x, ry = to.y - from.y;
    const sx = b[0] - a[0], sy = b[1] - a[1];
    const turn = rx * sy - ry * sx;
    if (Math.abs(turn) < 1e-12) return null;
    const qx = a[0] - from.x, qy = a[1] - from.y;
    const along = (qx * ry - qy * rx) / turn;
    return along >= -1e-9 && along <= 1 + 1e-9 ? (qx * sy - qy * sx) / turn : null;
}

const between = share => share > 1e-9 && share < 1 - 1e-9;

/**
 * Whether something stands between a radar and a point. Both are given as
 * { x, y, z }, with z the height above the floor. A wall always does; an open
 * door only when the line passes above its frame.
 */
export function sightBlocked(sight, from, to) {
    for (const wall of sight.walls) {
        const share = meets(from, to, wall);
        if (share !== null && between(share)) return true;
    }
    if (Math.max(from.z, to.z) <= doorHeight) return false;
    for (const door of sight.doors) {
        const share = meets(from, to, door);
        if (share !== null && between(share) && from.z + (to.z - from.z) * share > doorHeight) return true;
    }
    return false;
}

// How far a radar at `height` sees in one direction, looking for a person
// whose target is `target` metres high.
function reach(sight, origin, angle, height, target, range) {
    const to = { x: origin.x + Math.cos(angle) * range, y: origin.y + Math.sin(angle) * range };
    let limit = range;
    for (const wall of sight.walls) {
        const share = meets(origin, to, wall);
        if (share !== null && share > 1e-9) limit = Math.min(limit, share * range);
    }
    if (height <= doorHeight) return limit;
    // Past a door the frame cuts the view short: the further the door, the
    // further the radar looks under it.
    const widening = (height - target) / (height - doorHeight);
    let frame = Infinity;
    for (const door of sight.doors) {
        const share = meets(origin, to, door);
        if (share !== null && share > 1e-9 && share * range < limit) frame = Math.min(frame, share * range * widening);
    }
    return Math.min(limit, frame);
}

/** How far a radar sees along the floor in the direction of `angle` (radians). */
export const sightReach = (sight, origin, angle, { height = 0, target = standingTarget, range = farAway } = {}) =>
    reach(sight, origin, angle, height, target, range);

/**
 * The part of the floor a radar at `origin` can see, as a polygon around it.
 * `height` is how high the radar hangs; a radar above the door frames sees
 * less far into the next room.
 */
export function sightPolygon(sight, origin, { height = 0, target = standingTarget, range = farAway } = {}) {
    const angles = new Set();
    const add = angle => angles.add(((angle % fullTurn) + fullTurn) % fullTurn);
    for (let step = 0; step < 120; step++) add(step * fullTurn / 120);
    // Just before and after every corner, where the view jumps.
    for (const stretch of [...sight.walls, ...sight.doors]) for (const [x, y] of stretch) {
        const angle = Math.atan2(y - origin.y, x - origin.x);
        add(angle - 1e-4);
        add(angle);
        add(angle + 1e-4);
    }
    return [...angles].sort((a, b) => a - b).map(angle => {
        const distance = reach(sight, origin, angle, height, target, range);
        return [origin.x + Math.cos(angle) * distance, origin.y + Math.sin(angle) * distance];
    });
}
