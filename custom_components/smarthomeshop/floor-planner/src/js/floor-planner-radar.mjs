import { plannerRadars, radarFootprint, roomLimits } from './ceilsense-room-model.mjs';
import { ceilingHeightAt } from './floor-planner-ceiling.mjs';
import { ceilingCoverageStatus, devices, hasMotionSensor, wallVector } from './floor-planner-model.mjs';
import { roomContainsLine } from './floor-planner-geometry.mjs';
import { wallMotion, wallPresence, wallTrackers } from './wall-radar-profiles.mjs';

export const ceilingProfiles = ['seated', 'standing', 'moving'];
export const radarProfileFor = person => person?.moving ? 'moving' : person?.pose === 'standing' ? 'standing' : 'seated';

const degree = Math.PI / 180;
// The height a wall radar is planned for when it has none of its own, in metres.
export const wallMountHeight = 1.4;
// The height a radar aims for on a standing person, in metres.
const standingHeight = 1.35;

/** The fan a wall radar sends out, seen in its own plane: as wide as it sees and as far as it reaches. */
export function beamSector({ half, range }) {
    const radians = half * degree;
    const x = range * Math.sin(radians);
    const y = -range * Math.cos(radians);
    return `M0 0 ${-x} ${y} A${range} ${range} 0 0 1 ${x} ${y}Z`;
}

/**
 * The floor a wall radar covers for a standing person, as a path around the
 * radar. Level at chest height that is its whole fan. Hung high and tilted
 * down, the radar looks over the floor at its foot and reaches less far.
 */
export function wallSector(field) {
    if (field.pitch === undefined) return beamSector(field);
    const key = [field.half, field.pitch, field.range, field.mount, field.tilt].join(' ');
    if (!footprints.has(key)) {
        // Every height and tilt somebody tries gives a shape; keep the recent ones.
        if (footprints.size > 200) footprints.clear();
        footprints.set(key, footprint(field));
    }
    return footprints.get(key);
}

const footprints = new Map();

// In one direction from the radar, the stretch of floor where it sees a
// standing person: where it starts and where it stops, in metres. The angle
// is counted from straight ahead, in radians.
function stretch(field, angle) {
    const spot = { x: 0, y: 0, angle: 0 };
    const step = .05;
    const covered = distance => fieldCoversPoint(field, spot,
        { x: distance * Math.sin(angle), y: -distance * Math.cos(angle) }, 'seated', standingHeight);
    let first = null, last = null;
    for (let distance = step; distance <= field.range + 1e-9; distance += step) {
        if (!covered(distance)) continue;
        first ??= distance;
        last = distance;
    }
    if (first === null) return null;
    // Where it starts and stops lies between two steps; halve towards it for a smooth edge.
    const edge = (inside, outside) => {
        for (let round = 0; round < 8; round++) {
            const middle = (inside + outside) / 2;
            if (covered(middle)) inside = middle;
            else outside = middle;
        }
        return inside;
    };
    // A gap of a hand's width at its foot is not worth drawing.
    return [first <= step * 2 ? 0 : edge(first, first - step), edge(last, Math.min(field.range, last + step))];
}

/** How far straight ahead a wall radar sees a standing person: { from, to } in metres, or null when it does not. */
export function wallReach(field) {
    if (field.pitch === undefined) return { from: 0, to: field.range };
    const reach = stretch(field, 0);
    return reach && { from: reach[0], to: reach[1] };
}

function footprint(field) {
    const turns = 40;
    const near = [], far = [];
    for (let turn = 0; turn <= turns; turn++) {
        const angle = (-field.half + turn * 2 * field.half / turns) * degree;
        const reach = stretch(field, angle);
        if (!reach) continue;
        const at = distance => [distance * Math.sin(angle), -distance * Math.cos(angle)];
        near.push(at(reach[0]));
        far.push(at(reach[1]));
    }
    if (!far.length) return '';
    const points = [...far, ...near.reverse()].map(point => point.map(value => Number(value.toFixed(3))).join(' '))
        .filter((point, index, all) => point !== all[index - 1]);
    return `M${points.join('L')}Z`;
}

/**
 * The field of the PIR of a device that has one, or null. A PIR sees a warm
 * body that moves, not someone who sits still, so it is kept apart from the
 * radar fields that decide where a person is covered.
 */
export function motionField(item) {
    if (!hasMotionSensor(item.model)) return null;
    return { ...wallMotion, mount: item.mountHeight ?? wallMountHeight, tilt: item.tilt ?? 0, radar: 'pir', mode: 'motion', secondary: true };
}

export function radarOrigin(item) {
    if (devices[item.model].mount === 'ceiling') return item;
    const facing = wallVector(item.angle);
    return { x: item.x + facing.x * .08, y: item.y + facing.y * .08 };
}

export const radarHasLineOfSight = (room, item, point) => !room.outline || roomContainsLine(room, radarOrigin(item), point);

export function sensorMountHeight(item, room) {
    return devices[item.model].mount === 'wall' ? item.mountHeight ?? wallMountHeight : room ? ceilingHeightAt(room, item) : 0;
}

export function radarFields(room, item, { allowHeightEstimate = false } = {}) {
    if (!room || item.radar === 'none') return [];
    if (devices[item.model].mount === 'wall') {
        // Where the radar hangs and how far it is tilted down decide what it sees of the floor.
        const aim = { mount: item.mountHeight ?? wallMountHeight, tilt: item.tilt ?? 0 };
        return [
            { ...wallPresence, ...aim, radar: 'ld2412', mode: 'presence', secondary: true },
            { ...wallTrackers[item.radar], ...aim, radar: item.radar, mode: 'xy' },
        ];
    }

    if (!plannerRadars.includes(item.radar)) return [];
    const status = ceilingCoverageStatus(room, item);
    const height = ceilingHeightAt(room, item);
    const [minHeight, maxHeight] = roomLimits.height;
    const estimatedHeight = status === 'height' && allowHeightEstimate && height >= minHeight && height <= maxHeight;
    if (status !== 'reference' && !estimatedHeight) return [];
    const radars = item.radar === 'combined' ? ['ld6002b', 'ld2412'] : [item.radar];
    return radars.map((radar, index) => {
        const footprint = radarFootprint(radar, height);
        return {
            radii: footprint.seated,
            profiles: radar === 'ld2412' ? footprint : null,
            radar,
            mode: { ld2412: 'presence', ld2460: 'xy', ld6002b: 'xyz' }[radar],
            secondary: index > 0,
            estimatedHeight,
        };
    });
}

// Whether a field reaches a point of the floor. For a wall radar `target` is
// how high the person is that it looks for there; without it the field is
// taken as a flat fan, as wide and as far as the radar sees.
export function fieldCoversPoint(field, item, point, profile = 'seated', target = null) {
    const angle = item.angle * Math.PI / 180;
    const dx = point.x - item.x;
    const dy = point.y - item.y;
    const x = dx * Math.cos(angle) + dy * Math.sin(angle);
    const y = -dx * Math.sin(angle) + dy * Math.cos(angle);
    if (field.radii) {
        const [rx, ry] = field.profiles?.[profile] ?? field.radii;
        return (x / rx) ** 2 + (y / ry) ** 2 <= 1;
    }
    const distance = Math.hypot(x, y);
    if (target === null || field.pitch === undefined) {
        return distance <= field.range && (distance === 0 || Math.abs(Math.atan2(x, -y)) <= field.half * degree);
    }
    // In the radar's own frame: ahead along where it points, above at right angles to that.
    const drop = (field.mount ?? wallMountHeight) - target;
    const tilt = (field.tilt ?? 0) * degree;
    const ahead = -y * Math.cos(tilt) + drop * Math.sin(tilt);
    const above = -y * Math.sin(tilt) - drop * Math.cos(tilt);
    return ahead > 0 && Math.hypot(distance, drop) <= field.range
        && Math.abs(Math.atan2(x, ahead)) <= field.half * degree && Math.abs(Math.atan2(above, ahead)) <= field.pitch * degree;
}
