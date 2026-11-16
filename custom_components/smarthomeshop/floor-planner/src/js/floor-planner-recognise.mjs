// Turns a floor plan recognition (the rooms, doors and windows found on an
// uploaded image) into planner items that lie on that image.
//
// A recognition uses image coordinates from 0 to 1: x from the left edge to
// the right, y from the top to the bottom. width_m is the real width that the
// whole image spans, when the plan had dimensions to read it from.
//
//   { width_m, rooms: [{ name, points: [[x, y], ...] }],
//     doors: [{ from: [x, y], to: [x, y] }], windows: [...] }
//
// The result is a draft: the outlines are approximate and meant to be
// corrected on top of the image, not trusted as measured.
import { defaultWindowSill, edgePosition, outlineBounds, polygonEdges, roomCorners } from './floor-planner-geometry.mjs';
import { newId, validPlan } from './floor-planner-model.mjs';
import { validUnderlay } from './floor-planner-underlay.mjs';

export const recognitionLimits = { rooms: 40, corners: 24, openings: 80 };

// Corners this close together share one wall line. The unit is the image
// width, so it also works before the plan has a real scale.
const lineSnap = .012;
// A door or window further than this from every wall is dropped.
const wallReach = .03;

const unit = value => Number.isFinite(value) && value >= 0 && value <= 1;
const imagePoint = value => Array.isArray(value) && value.length === 2 && unit(value[0]) && unit(value[1]);
const millimetres = value => Math.round(value * 1000) / 1000;
const degrees = value => (Math.round(value * 100) / 100 % 360 + 360) % 360;

// Values within lineSnap of the first value of a group become that group's
// average, so both sides of a thin wall and slightly skewed lines line up.
function snappedLines(values) {
    const lines = new Map();
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

// Drops repeated corners and corners in the middle of a straight line.
function tidy(points) {
    const distinct = points.filter((point, index) => {
        const previous = points[(index + points.length - 1) % points.length];
        return Math.hypot(point[0] - previous[0], point[1] - previous[1]) > 1e-6;
    });
    return distinct.filter((point, index) => {
        const before = distinct[(index + distinct.length - 1) % distinct.length];
        const after = distinct[(index + 1) % distinct.length];
        const cross = (point[0] - before[0]) * (after[1] - point[1]) - (point[1] - before[1]) * (after[0] - point[0]);
        return Math.abs(cross) > 1e-6;
    });
}

const isRectangle = ({ width, depth, outline }) => outline.length === 4 && outline.every(([x, y]) =>
    (Math.abs(x) < 1e-6 || Math.abs(x - width) < 1e-6) && (Math.abs(y) < 1e-6 || Math.abs(y - depth) < 1e-6));

function roomShape(points) {
    const shape = outlineBounds(tidy(points));
    if (shape) return isRectangle(shape) ? { x: shape.x, y: shape.y, width: shape.width, depth: shape.depth } : shape;
    // An outline that crosses itself still gives a usable rough room.
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
    const x = Math.min(...xs), y = Math.min(...ys);
    const width = Math.max(...xs) - x, depth = Math.max(...ys) - y;
    return width >= .5 && depth >= .5 && width <= 60 && depth <= 60 ? { x, y, width, depth } : null;
}

// The nearest wall of any room to a point, with the point's place along it.
function nearestWall(rooms, point) {
    let best = null;
    for (const room of rooms) {
        for (const [a, b] of polygonEdges(roomCorners(room))) {
            const position = edgePosition(a, b, point);
            const distance = Math.hypot(position.x - point.x, position.y - point.y);
            if (!best || distance < best.distance) best = { room, distance, ...position };
        }
    }
    return best;
}

/**
 * Planner items for a recognition, placed on the given underlay.
 *
 * Returns { underlay, rooms, doors, windows, scaled, skipped }: the underlay
 * (rescaled when the recognition knew the real width), the new items, whether
 * a real scale was applied, and how many recognised rooms were unusable.
 * With keepScale the underlay keeps the size it has.
 * Returns null when the recognition holds no usable room.
 */
export function draftFromRecognition(recognition, underlay, { roomName = 'Room', height = 2.7, keepScale = false } = {}) {
    if (!validUnderlay(underlay) || !recognition || typeof recognition !== 'object') return null;
    const found = (Array.isArray(recognition.rooms) ? recognition.rooms : []).slice(0, recognitionLimits.rooms)
        .filter(room => Array.isArray(room?.points) && room.points.length >= 3
            && room.points.length <= recognitionLimits.corners && room.points.every(imagePoint));
    if (!found.length) return null;

    const realWidth = recognition.width_m;
    // keepScale: the image already has a scale somebody measured.
    const rescaled = !keepScale && Number.isFinite(realWidth) ? { ...underlay, width: realWidth } : null;
    const scaled = Boolean(rescaled && validUnderlay(rescaled));
    const image = scaled ? rescaled : underlay;

    // Work in image widths on both axes, so one tolerance fits both.
    const across = ([x]) => x, down = ([, y]) => y / image.ratio;
    const all = found.flatMap(room => room.points);
    const columns = snappedLines(all.map(across)), rows = snappedLines(all.map(down));
    const onPlan = (u, v) => [millimetres(image.x + u * image.width), millimetres(image.y + v * image.width)];

    const rooms = [];
    let skipped = 0;
    for (const room of found) {
        const shape = roomShape(room.points.map(point => onPlan(columns.get(across(point)), rows.get(down(point)))));
        if (!shape) {
            skipped++;
            continue;
        }
        const name = typeof room.name === 'string' && room.name.trim() ? room.name.trim().slice(0, 48) : `${roomName} ${rooms.length + 1}`;
        rooms.push({ ...shape, id: newId(), name, height });
    }
    if (!rooms.length) return null;

    const reach = wallReach * image.width;
    const openings = (list, minimum, maximum, extra) => (Array.isArray(list) ? list : []).slice(0, recognitionLimits.openings)
        .flatMap(item => {
            if (!imagePoint(item?.from) || !imagePoint(item?.to)) return [];
            const from = onPlan(across(item.from), down(item.from)), to = onPlan(across(item.to), down(item.to));
            const wall = nearestWall(rooms, { x: (from[0] + to[0]) / 2, y: (from[1] + to[1]) / 2 });
            if (!wall || wall.distance > reach) return [];
            const width = millimetres(Math.min(maximum, wall.length, Math.max(minimum, Math.hypot(to[0] - from[0], to[1] - from[1]))));
            if (width < minimum) return [];
            const start = Math.max(0, Math.min(wall.length - width, wall.along - width / 2));
            const [dx, dy] = [(wall.b[0] - wall.a[0]) / wall.length, (wall.b[1] - wall.a[1]) / wall.length];
            return [{ id: newId(), roomId: wall.room.id, width, angle: degrees(wall.angle),
                x: millimetres(wall.a[0] + dx * start), y: millimetres(wall.a[1] + dy * start), ...extra }];
        });

    return {
        underlay: image,
        rooms,
        doors: openings(recognition.doors, .5, 2, {}),
        windows: openings(recognition.windows, .1, 8, { base: defaultWindowSill, height: 1 }),
        scaled,
        skipped,
    };
}

// The planner keeps at most this many rooms, doors and windows on a floor.
const most = 80;

/**
 * The plan with a draft added to it. Rooms that were already drawn stay, and
 * what does not fit within the planner's limits is left out. Doors and
 * windows are a bonus: when they make the plan invalid, the rooms go in
 * without them. Returns null when not even the rooms give a valid plan.
 */
export function planWithDraft(plan, draft) {
    const rooms = draft.rooms.slice(0, Math.max(0, most - plan.rooms.length));
    if (!rooms.length) return null;
    const kept = new Set(rooms.map(room => room.id));
    const fits = (items, present) => items.filter(item => kept.has(item.roomId)).slice(0, Math.max(0, most - present));
    const doors = fits(draft.doors, plan.doors.length), windows = fits(draft.windows, plan.windows?.length ?? 0);
    const outlined = rooms.some(room => room.outline) ? Math.max(2, plan.version) : plan.version;
    const base = { ...plan, underlay: draft.underlay, rooms: [...plan.rooms, ...rooms] };
    const full = { ...base, version: windows.length ? 3 : outlined, doors: [...plan.doors, ...doors],
        ...(windows.length ? { windows: [...plan.windows ?? [], ...windows] } : {}) };
    if (validPlan(full)) return full;
    const bare = { ...base, version: outlined };
    return validPlan(bare) ? bare : null;
}

const fill = (text, values) => Object.entries(values).reduce((line, [key, value]) => line.replaceAll(`:${key}`, value), text ?? '');

/** What to tell the user after a recognition was added to the plan. */
export function recognitionNote(copy, { rooms, quota }, number = String) {
    const lines = [fill(copy.recognise_done, { count: number(rooms) })];
    if (Number.isFinite(quota?.used) && Number.isFinite(quota?.limit)) {
        lines.push(fill(copy.recognise_quota, { used: number(quota.used), limit: number(quota.limit) }));
    }
    return lines.filter(Boolean).join(' ');
}

// How long it takes before a recognition is about two thirds on its way.
const usualPace = 11000;

/**
 * How far a recognition is, as a whole percentage, after it has been running
 * for elapsed milliseconds. The service does not report progress, so this is
 * an estimate from how long a plan usually takes: it moves quickly at first,
 * slows down, and never reaches the end before the answer is there.
 */
export const recognitionProgress = elapsed =>
    Math.min(97, Math.round(100 * (1 - Math.exp(-Math.max(0, Number(elapsed) || 0) / usualPace))));

/**
 * How many usable rooms a recognition holds when it has no scale of its own.
 * On an image without a scale, rooms cannot be placed at a believable size
 * (small ones would fall under the planner's minimum), so the planner asks
 * for the scale first and adds the rooms after it.
 */
export function roomsWaitingForScale(recognition) {
    const rooms = Array.isArray(recognition?.rooms) ? recognition.rooms : [];
    return rooms.slice(0, recognitionLimits.rooms).filter(room => Array.isArray(room?.points) && room.points.length >= 3
        && room.points.length <= recognitionLimits.corners && room.points.every(imagePoint)).length;
}

/** What to tell the user while the rooms wait for the scale. */
export const recognitionWaiting = (copy, rooms, number = String) => fill(copy.recognise_needs_scale, { count: number(rooms) });

/** What to tell the user when a recognition failed. Empty when they cancelled it themselves. */
export function recognitionProblem(copy, error, locale) {
    const code = error?.code;
    if (code === 'cancelled') return '';
    if (code === 'quota_exceeded') {
        const date = new Date(error.quota?.resets_at ?? NaN);
        return fill(copy.recognise_error_quota, {
            limit: Number.isFinite(error.quota?.limit) ? String(error.quota.limit) : '',
            date: Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
        }).replace(/\s+/g, ' ').trim();
    }
    return copy[{
        daily_limit_exceeded: 'recognise_error_daily',
        rate_limited: 'recognise_error_busy',
        no_rooms_found: 'recognise_error_none',
        account_required: 'recognise_error_account',
        account_invalid: 'recognise_error_account',
        popup_blocked: 'recognise_error_popup',
    }[code] ?? 'recognise_error_failed'] ?? '';
}
