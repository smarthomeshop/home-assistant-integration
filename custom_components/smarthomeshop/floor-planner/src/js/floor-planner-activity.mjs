import { ceilingHeightAt } from './floor-planner-ceiling.mjs';
import { paintRoomSurface } from './floor-planner-drawing.mjs';
import { furnitureParts, furnitureProjection } from './floor-planner-furniture.mjs';
import { roomCorners } from './floor-planner-geometry.mjs';
import { contains } from './floor-planner-model.mjs';
import { movePerson, personSignals } from './floor-planner-person.mjs';
import { projectSpace } from './floor-planner-space.mjs';

const seats = new Set(['chair', 'sofa', 'corner', 'armchair']);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const offset = (person, heading, length) => ({
    x: person.x + Math.sin(heading * Math.PI / 180) * length,
    y: person.y - Math.cos(heading * Math.PI / 180) * length,
});

export const fallMotionDuration = 960;
const smokeFireStart = 850;
const smokeSpreadStart = 1650;
const smokeDetectionDelay = 3800;
export const activityDuration = { seat: 2800, bed: 3500, fall: 5100, smoke: 8600 };

export function walkTestPhase(kind, elapsed, reducedMotion) {
    if (kind === 'smoke') {
        const checked = elapsed >= smokeDetectionDelay;
        const smokePhase = checked ? 'reported' : elapsed >= smokeSpreadStart ? 'smoke'
            : elapsed >= smokeFireStart ? 'fire' : 'start';
        return { smokePhase, checked };
    }
    const fallProgress = reducedMotion ? 1 : Math.min(1, Math.max(0, elapsed / fallMotionDuration));
    return { fallProgress, checked: fallProgress === 1 };
}

export function createWalkActivities(plan, walls, sensors, obstacles, network) {
    const furniture = (plan.furniture ?? []).flatMap(item => {
        const room = plan.rooms.find(room => contains(room, item));
        return room ? [{ item, room }] : [];
    });
    const heightRadar = sensors.filter(({ fields }) => fields.some(field => field.radar === 'ld6002b'));

    function furnitureActivity(kind, person, nodes, occupied) {
        let best = null;
        let bestScore = Infinity;
        for (const { item, room } of furniture) {
            if (occupied.has(item.id) || (kind === 'seat' ? !seats.has(item.kind) : item.kind !== 'bed')) continue;
            const surface = furnitureParts(item).find(part => part.surface === 'seat');
            const [x, y] = furnitureProjection(item)([surface.x + surface.w / 2, surface.y + surface.d / 2]);
            const point = { x, y };
            const heading = kind === 'seat' ? (item.angle + 180) % 360 : item.angle;
            const reach = Math.hypot(item.width, item.depth) / 2 + .60;
            for (const approach of nodes) {
                if (approach.room !== room) continue;
                const gap = distance(approach, point);
                if (gap > reach || movePerson([room], walls, approach, x - approach.x, y - approach.y) === approach) continue;
                const score = gap * 3 + distance(person, approach);
                if (score >= bestScore) continue;
                bestScore = score;
                best = { kind, room, item, approach, point, heading,
                    elevation: kind === 'bed' ? surface.high : surface.high - .48 };
            }
        }
        return best;
    }

    function fallActivity(person, nodes, testRoom) {
        const rooms = testRoom ? new Set([testRoom]) : new Set(heightRadar.map(({ room }) => room));
        const nearby = nodes.filter(node => rooms.has(node.room)).sort((a, b) => distance(a, person) - distance(b, person));
        let nearest = null;
        for (const approach of nearby) {
            const heading = [person.heading, 0, 90, 180, 270].find(angle => {
                const head = offset(approach, angle, -.71), feet = offset(approach, angle, 1.03);
                return contains(approach.room, head) && contains(approach.room, feet) && network.clear(head, feet);
            });
            if (heading === undefined) continue;
            const onGround = { ...person, ...approach, pose: 'lying', heading, elevation: 0 };
            const detector = personSignals(plan, onGround, heightRadar, obstacles).find(reading =>
                reading.signals.some(signal => signal.radar === 'ld6002b' && signal.seen));
            const activity = { kind: 'fall', room: approach.room, approach, heading, detector };
            if (detector) return activity;
            if (testRoom) nearest ??= activity;
        }
        return nearest;
    }

    function smokeActivity(person, nodes, room) {
        const nearby = nodes.filter(node => node.room === room).sort((a, b) => distance(a, person) - distance(b, person));
        for (const approach of nearby) {
            for (const heading of [person.heading - 35, 0, 90, 180, 270]) {
                const source = offset(approach, heading, .85);
                if (!contains(room, source) || !network.clear(approach, source)) continue;
                const detector = sensors.find(sensor => sensor.room === room && sensor.item.model === 'ceilsense-pro');
                return { kind: 'smoke', room, approach, source, heading, detector };
            }
        }
        return null;
    }

    return (kind, person, occupied, testRoom = null) => network.routeToActivity(person, nodes => {
        if (kind === 'fall') return fallActivity(person, nodes, testRoom);
        if (kind === 'smoke' && testRoom) return smokeActivity(person, nodes, testRoom);
        if (kind === 'seat' || kind === 'bed') return furnitureActivity(kind, person, nodes, occupied);
        return null;
    });
}

function paintRoomSmoke(room, source, camera, age) {
    const id = camera ? 'fp-smoke-volume-3d' : 'fp-smoke-volume-2d';
    const project = (point, height = 0) => camera ? projectSpace([point.x, point.y], height, camera) : [point.x, point.y];
    const polygon = points => `<polygon points="${points.map(point => point.join(',')).join(' ')}"/>`;
    const corners = roomCorners(room).map(([x, y]) => ({ x, y }));
    const floor = corners.map(point => project(point));
    const roof = corners.map(point => project(point, ceilingHeightAt(room, point)));
    const clip = camera ? polygon(floor) + polygon(roof) + floor.map((point, index) => {
        const next = (index + 1) % floor.length;
        return polygon([point, floor[next], roof[next], roof[index]]);
    }).join('') : paintRoomSurface(room);
    const [sourceX, sourceY] = project(source, .25);
    const size = Math.min(2.7, Math.max(.7, Math.min(room.width, room.depth) * .39));
    const clouds = Array.from({ length: 16 }, (_, index) => {
        const u = .12 + .76 * (((index * 13) % 17) / 16);
        const v = .12 + .76 * (((index * 7 + 4) % 17) / 16);
        const point = { x: room.x + room.width * u, y: room.y + room.depth * v };
        if (!contains(room, point)) return '';
        const height = ceilingHeightAt(room, point) * (.24 + (index % 4) * .18);
        const [x, y] = project(point, height);
        const radius = size * (.78 + index % 5 * .11);
        const wait = (.14 + Math.min(1.8, distance(point, source) * .21) + index % 3 * .14).toFixed(2);
        const dx = ((sourceX - x) * .56).toFixed(2), dy = ((sourceY - y) * .56).toFixed(2);
        return `<g transform="translate(${x} ${y})"><g class="fp-smoke-spread" style="--fp-smoke-x:${dx}px;--fp-smoke-y:${dy}px;--fp-smoke-wait:${wait}s">
            <ellipse class="fp-smoke-wisp" rx="${radius}" ry="${radius * (camera ? .47 : .74)}" fill="url(#${id}-cloud)"/>
        </g></g>`;
    }).join('');
    return `<defs><clipPath id="${id}">${clip}</clipPath>
        <radialGradient id="${id}-cloud">
            <stop stop-color="#bac4cd" stop-opacity=".53"/><stop offset=".52" stop-color="#99a5b2" stop-opacity=".40"/>
            <stop offset="1" stop-color="#778590" stop-opacity="0"/>
        </radialGradient></defs>
        <g class="fp-room-smoke" clip-path="url(#${id})" style="--fp-smoke-age:-${age.toFixed(3)}s">
            <g class="fp-smoke-haze">${camera ? polygon(floor) : paintRoomSurface(room)}</g>${clouds}
        </g>`;
}

function paintFire(source, camera) {
    const [x, y] = camera ? projectSpace([source.x, source.y], 0, camera) : [source.x, source.y];
    return `<g class="fp-demo-fire" transform="translate(${x} ${y})">
        <ellipse class="fp-fire-glow" rx=".50" ry="${camera ? '.18' : '.42'}"/>
        <g class="fp-fire-flames" transform="translate(0 ${camera ? 0 : .12})">
            <path class="fp-fire-flicker" fill="#ff8545"
                d="M0 0C-.32-.05-.34-.31-.18-.48C-.19-.30-.05-.35-.06-.50C-.08-.62.02-.70.06-.80C.05-.62.24-.54.20-.39C.28-.44.30-.51.29-.55C.44-.19.25-.02 0 0Z"/>
            <path class="fp-fire-core" fill="#ffd283"
                d="M0-.02C-.20-.05-.18-.22-.08-.31C-.08-.20.01-.24.01-.37C.02-.44.06-.48.10-.51C.08-.37.25-.26.19-.13C.16-.06.09-.02 0-.02Z"/>
        </g>
    </g>`;
}

export function paintActivityEffect({ kind, room, detected, before, source, started, checked, smokePhase }, camera, now) {
    if (kind === 'fall' && !checked) return '';
    const roomAlarm = !detected ? '' : camera
        ? `<polygon class="fp-room-alarm" points="${roomCorners(room).map(point => projectSpace(point, 0, camera).join(',')).join(' ')}"/>`
        : paintRoomSurface(room, 'class="fp-room-alarm"');
    if (kind === 'smoke') {
        if (smokePhase === 'start') return '';
        const smoke = smokePhase === 'fire' ? '' : paintRoomSmoke(room, source, camera,
            Math.max(0, (now - started - smokeSpreadStart) / 1000));
        return roomAlarm + paintFire(source, camera) + smoke;
    }
    const [x, y] = camera ? projectSpace([before.x, before.y], 0, camera) : [before.x, before.y];
    return roomAlarm + `<g transform="translate(${x} ${y})"><ellipse class="fp-fall-impact" rx=".59" ry="${camera ? '.24' : '.59'}"/></g>`;
}
