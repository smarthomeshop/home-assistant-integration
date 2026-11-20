import { ceilingHeightAt } from './floor-planner-ceiling.mjs';
import { roomForDevice } from './floor-planner-model.mjs';
import { beamSector, ceilingProfiles, radarFields, radarOrigin, sensorMountHeight, wallSector } from './floor-planner-radar.mjs';
import { projectSpace } from './floor-planner-space.mjs';
import { convexHull, polygonEdges, roomCorners, roomRayEnd, roomVisibility } from './floor-planner-geometry.mjs';
import { prepareSight, sightPolygon, sightReach } from './floor-planner-sight.mjs';

// Where the edge of a ceiling radar's range lies on the floor. With a sight it
// stops at what the radar cannot see past; without one, at the walls of its room.
function rimPoints(room, item, [rx, ry], sight = null) {
    const angle = item.angle * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const edges = room.outline ? polygonEdges(roomCorners(room)) : null;
    const steps = sight ? 144 : 64;
    const height = sight ? sensorMountHeight(item, room) : 0;
    return Array.from({ length: steps }, (_, index) => {
        const t = index / steps * Math.PI * 2;
        const x = rx * Math.cos(t), y = ry * Math.sin(t);
        const dx = x * cos - y * sin, dy = x * sin + y * cos;
        if (sight) {
            const distance = Math.hypot(dx, dy);
            const seen = Math.min(1, sightReach(sight, item, Math.atan2(dy, dx), { height }) / distance);
            return [item.x + dx * seen, item.y + dy * seen];
        }
        if (edges) return roomRayEnd(room, item, { x: item.x + dx, y: item.y + dy }, edges);
        const wallX = dx >= 0 ? room.x + room.width : room.x;
        const wallY = dy >= 0 ? room.y + room.depth : room.y;
        const scale = Math.min(1, Math.abs(dx) < 1e-8 ? Infinity : (wallX - item.x) / dx,
            Math.abs(dy) < 1e-8 ? Infinity : (wallY - item.y) / dy);
        return [item.x + dx * scale, item.y + dy * scale];
    });
}

const path = points => 'M' + points.map(point => point.map(value => Number(value.toFixed(3))).join(' ')).join('L') + 'Z';

const turning = points => points.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length];
    return sum + x * nextY - nextX * y;
}, 0);
// The outline of a cone whose foot is not round, as it is where the range
// reaches through a door: the foot and every slice up to the top, all turning
// the same way so they fill as one shape.
function coneOutline(foot, apex) {
    const sameWay = points => turning(points) < 0 ? [...points].reverse() : points;
    return [foot, ...foot.map((point, index) => [apex, point, foot[(index + 1) % foot.length]])]
        .filter(points => Math.abs(turning(points)) > 1e-6).map(points => path(sameWay(points))).join('');
}

// A polygon cut off along a line: what is left on the side where `keep` is not negative.
function cutPolygon(points, keep) {
    return points.flatMap((point, index) => {
        const next = points[(index + 1) % points.length];
        const a = keep(point), b = keep(next);
        const crossing = (a < 0) !== (b < 0)
            ? [[point[0] + (next[0] - point[0]) * a / (a - b), point[1] + (next[1] - point[1]) * a / (a - b)]] : [];
        return a >= 0 ? [point, ...crossing] : crossing;
    });
}

function paintWallFan({ room, item, fields, sight = null }, camera, height, plane, floorId = '') {
    const clip = `fp-wall-${plane}-${floorId ? floorId + '_' : ''}${item.id}`;
    const points = sight ? sightPolygon(sight, radarOrigin(item), { height: sensorMountHeight(item, room) })
            .map(point => point.map(value => Number(value.toFixed(3))))
        : room.outline ? roomVisibility(room, radarOrigin(item)) : roomCorners(room);
    const matrix = [
        ...projectSpace([1, 0], 0, camera, false),
        ...projectSpace([0, 1], 0, camera, false),
        ...projectSpace([0, 0], height, camera, false),
    ];
    const tilt = (item.tilt ?? 0) * Math.PI / 180;
    if (plane === 'height' && tilt) {
        // The fan leaves the radar along where it points. Its own plane is laid
        // into the scene: sideways stays level, ahead goes down with the tilt.
        const turn = item.angle * Math.PI / 180;
        const [ax, ay, bx, by] = matrix;
        const [, rise] = projectSpace([0, 0], 1, camera, false);
        const flat = (x, y) => [ax * x + bx * y, ay * x + by * y];
        const side = flat(Math.cos(turn), Math.sin(turn));
        const ahead = flat(-Math.sin(turn) * Math.cos(tilt), Math.cos(turn) * Math.cos(tilt));
        const start = flat(item.x, item.y);
        const laid = [...side, ahead[0], ahead[1] + rise * Math.sin(tilt), start[0], start[1] + rise * height];
        // The walls cut the fan off where they stand, whatever its slope.
        // The floor does too, and the ceiling when the radar looks up.
        const reach = Math.max(0, tilt > 0 ? height : room.height - height) / Math.sin(Math.abs(tilt));
        const local = cutPolygon(points.map(([x, y]) => {
            const dx = x - item.x, dy = y - item.y;
            return [dx * Math.cos(turn) + dy * Math.sin(turn), (-dx * Math.sin(turn) + dy * Math.cos(turn)) / Math.cos(tilt)];
        }), ([, ahead]) => ahead + reach).map(point => point.map(value => Number(value.toFixed(3))));
        return `<g class="fp-wall-fan" data-plane="${plane}" data-sensor="${item.id}" data-tilted transform="matrix(${laid.map(value => Number(value.toFixed(4))).join(' ')})">
            <defs><clipPath id="${clip}"><polygon points="${local.map(point => point.join(',')).join(' ')}"/></clipPath></defs>
            <g clip-path="url(#${clip})">
                ${fields.map(field => `<path class="fp-wall-sector" data-radar="${field.radar}" data-secondary="${Boolean(field.secondary)}" d="${beamSector(field)}"/>`).join('')}
            </g>
        </g>`;
    }
    // At the height of the radar the fan is as wide and as far as it sees; on the floor it is what it covers there.
    const shape = plane === 'height' ? beamSector : wallSector;
    return `<g class="fp-wall-fan" data-plane="${plane}" data-sensor="${item.id}" transform="matrix(${matrix.join(' ')})">
        <defs><clipPath id="${clip}"><polygon points="${points.map(point => point.join(',')).join(' ')}"/></clipPath></defs>
        <g clip-path="url(#${clip})"><g transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
            ${fields.map(field => `<path class="fp-wall-sector" data-radar="${field.radar}" data-secondary="${Boolean(field.secondary)}" d="${shape(field)}"/>`).join('')}
        </g></g>
    </g>`;
}

export function paintWallCoverage(choices, camera, floorId = '') {
    const sensors = new Map();
    for (const { item, room, field, sight } of choices) {
        if (field.radii) continue;
        if (!sensors.has(item.id)) sensors.set(item.id, { item, room, sight, fields: [] });
        sensors.get(item.id).fields.push(field);
    }
    return [...sensors.values()].map(sensor => paintWallFan(sensor, camera, 0, 'floor', floorId)).join('');
}

export function paintBeam({ room, item, field, sight = null }, camera, profile, fillId = 'fp-beam-fill') {
    if (!field.radii) return paintWallFan({ room, item, fields: [field], sight }, camera, sensorMountHeight(item, room), 'height');
    const floor = projectSpace([item.x, item.y], 0, camera);
    const apex = projectSpace([item.x, item.y], ceilingHeightAt(room, item), camera);
    const profiles = field.profiles ? ceilingProfiles : ['seated'];
    const rings = profiles.map(name => ({
        name,
        points: rimPoints(room, item, field.profiles?.[name] ?? field.radii, sight).map(point => projectSpace(point, 0, camera)),
    }));
    const active = rings.find(ring => ring.name === profile) ?? rings[0];
    const bands = [.38, .7].map(ratio => path(active.points.map(([x, y]) =>
        [apex[0] + (x - apex[0]) * ratio, apex[1] + (y - apex[1]) * ratio])));
    return `<defs><linearGradient id="${fillId}" gradientUnits="userSpaceOnUse"
        x1="${apex[0]}" y1="${apex[1]}" x2="${floor[0]}" y2="${floor[1]}">
        <stop class="fp-beam-near"/><stop class="fp-beam-far" offset="1"/>
        </linearGradient></defs>
        <path class="fp-beam-shell" ${field.estimatedHeight ? 'data-height-estimate' : ''} fill="url(#${fillId})" d="${sight ? coneOutline(active.points, apex) : path(convexHull([...active.points, apex]))}"/>
        ${bands.map(d => `<path class="fp-beam-band" d="${d}"/>`).join('')}
        ${rings.slice().reverse().map(ring => `<path class="fp-beam-rim${ring === active ? ' active' : ''}"
            ${field.profiles ? `data-profile="${ring.name}"` : ''} d="${path(ring.points)}"/>`).join('')}`;
}

export function paintFloorCoverage(floor, camera, radarOptions) {
    const { id, plan } = floor;
    const sight = prepareSight(plan);
    const choices = plan.sensors.flatMap(item => {
        const room = roomForDevice(plan.rooms, item);
        return radarFields(room, item, radarOptions).map(field => ({ item, room, field, sight }));
    });
    const beams = choices.filter(({ field }) => field.radii).map(choice => {
        const { item, field } = choice;
        const fillId = `fp-stack-beam-${id}_${item.id}_${field.radar}`;
        return `<g class="fp-stack-beam" data-sensor="${item.id}" data-radar="${field.radar}" data-secondary="${Boolean(field.secondary)}">
            ${paintBeam(choice, camera, 'seated', fillId)}</g>`;
    }).join('');
    const wall = paintWallCoverage(choices, camera, id);
    return {
        floorOverlay: wall ? `<g pointer-events="none">${wall}</g>` : '',
        beamOverlay: beams ? `<g pointer-events="none">${beams}</g>` : '',
    };
}
