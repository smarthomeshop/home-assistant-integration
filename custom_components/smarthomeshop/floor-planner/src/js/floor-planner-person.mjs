import { doorsOnPlan, pointInOutline, polygonEdges, roomCorners, roomInteriorPoint, wallSegments } from './floor-planner-geometry.mjs';
import { contains, roomForDevice } from './floor-planner-model.mjs';
import { fieldCoversPoint, radarFields, radarHasLineOfSight, radarProfileFor, sensorMountHeight } from './floor-planner-radar.mjs';
import { furnitureOcclusion, prepareFurnitureOcclusion } from './floor-planner-obstruction.mjs';
import { projectSpace } from './floor-planner-space.mjs';
import { paintAvatar } from './floor-planner-avatar.mjs';

export const poses = {
    standing: { target: 1.35 },
    sitting: { target: .85 },
    lying: { target: .25 },
};

export function personTargetHeight(person) {
    const progress = person.fallProgress;
    const fall = progress === undefined ? 0 : progress <= .37 ? .12 * (progress / .37) ** 1.4
        : .12 + .88 * ((progress - .37) / .63) ** 1.6;
    const height = progress === undefined ? poses[person.pose].target
        : poses.standing.target + (poses.lying.target - poses.standing.target) * fall;
    return height * (person.avatar === 'child' ? .72 : 1) + (person.elevation ?? 0);
}

export function personAt(room, pose = 'standing') {
    return { ...roomInteriorPoint(room), pose, heading: 0 };
}

export function solidWalls(plan) {
    const doors = doorsOnPlan(plan);
    return [
        ...plan.rooms.flatMap(room => polygonEdges(roomCorners(room))),
        ...plan.walls.map(wall => [[wall.x, wall.y], [wall.endX, wall.endY]]),
    ].flatMap(([a, b]) => wallSegments(a, b, doors));
}

const cross = (a, b) => a[0] * b[1] - a[1] * b[0];

export function movePerson(rooms, walls, person, dx, dy) {
    const next = { ...person, x: person.x + dx, y: person.y + dy, heading: Math.round(Math.atan2(dx, -dy) * 180 / Math.PI) };
    if (!rooms.some(room => contains(room, next))) return person;
    const movement = [dx, dy];
    const blocked = walls.some(([a, b]) => {
        const wall = [b[0] - a[0], b[1] - a[1]];
        const offset = [a[0] - person.x, a[1] - person.y];
        const determinant = cross(movement, wall);
        if (Math.abs(determinant) < 1e-8) return false;
        const alongStep = cross(offset, wall) / determinant;
        const alongWall = cross(offset, movement) / determinant;
        return alongStep > 1e-8 && alongStep <= 1 + 1e-8 && alongWall >= 0 && alongWall <= 1;
    });
    return blocked ? person : next;
}

export function preparePersonSensors(plan) {
    return plan.sensors.map((item, index) => {
        const room = roomForDevice(plan.rooms, item);
        const exclusions = (plan.zones ?? []).filter(zone => zone.type === 'exclusion' && zone.roomId === room?.id
            && (!zone.sensorId || zone.sensorId === item.id));
        return { item, index, room, fields: radarFields(room, item), exclusions };
    });
}

export function personSignals(plan, person, sensors = preparePersonSensors(plan), furniture = prepareFurnitureOcclusion(plan.furniture ?? [])) {
    const room = plan.rooms.find(room => contains(room, person));
    const height = personTargetHeight(person);
    const profile = radarProfileFor(person);
    return sensors.map(({ item, index, room: sensorRoom, fields, exclusions = [] }) => {
        const visible = room && room.id === sensorRoom?.id && radarHasLineOfSight(room, item, person);
        const possible = visible ? fields.filter(field => fieldCoversPoint(field, item, person, profile)) : [];
        const mount = sensorMountHeight(item, sensorRoom);
    const obstacle = possible.length ? furnitureOcclusion({ ...item, z: mount }, person, height, furniture) : null;
        const exclusion = possible.some(field => field.mode !== 'presence') && exclusions.find(zone =>
            zone.parts.some(part => pointInOutline(part, person)));
        const signals = fields.map(field => {
            const inRange = possible.includes(field);
            const excluded = inRange && field.mode !== 'presence' && exclusion;
            const seen = inRange && !obstacle && !excluded;
            return { ...field, seen, obstacle: inRange ? obstacle : null, exclusion: excluded || null,
                height: seen && field.mode === 'xyz' ? height : null };
        });
        return { item, index, room: sensorRoom, signals, obstacle, mount, seen: signals.some(signal => signal.seen) };
    });
}

export const emptyRoute = () => ({ points: [], distance: 0, covered: 0, uncertain: 0 });

export const routeCoverage = readings => readings.some(reading => reading.seen) ? 'clear'
    : readings.some(reading => reading.obstacle?.status === 'shadow') ? 'shadow' : 'none';

export function recordWalk(route, from, to, before, after) {
    const status = value => value === true ? 'clear' : value === false ? 'none' : value;
    before = status(before);
    after = status(after);
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    route.distance += distance;
    route.covered += distance * (Number(before === 'clear') + Number(after === 'clear')) / 2;
    route.uncertain += distance * (Number(before === 'shadow') + Number(after === 'shadow')) / 2;
    if (!route.points.length) route.points.push({ x: from.x, y: from.y, status: before, covered: before === 'clear' });
    if (before !== after) {
        route.points.push({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, status: before, covered: before === 'clear' });
    }
    const end = { x: to.x, y: to.y, status: after, covered: after === 'clear' };
    const last = route.points.at(-1);
    if (route.points.length > 1 && last.status === after && last.heading === to.heading) {
        route.points[route.points.length - 1] = { ...end, heading: to.heading };
    } else {
        route.points.push({ ...end, heading: to.heading });
    }
    if (route.points.length > 600) route.points.shift();
}

export function paintWalkLines(person, route, readings, camera) {
    const project = (point, height = 0) => (camera === null
        ? [point.x, point.y] : projectSpace([point.x, point.y], height, camera)).map(value => Number(value.toFixed(3))).join(' ');
    const paths = { none: [], shadow: [], clear: [] };
    let previous = null;
    let lastCoverage = null;
    for (const point of route.points) {
        const end = project(point);
        if (previous !== null) {
            const path = paths[point.status];
            path.push(point.status === lastCoverage ? `L${end}` : `M${previous}L${end}`);
            lastCoverage = point.status;
        }
        previous = end;
    }
    const trail = Object.entries(paths).map(([status, path]) => path.length
        ? `<path class="fp-walk-trail" data-status="${status}" data-covered="${status === 'clear'}" d="${path.join('')}"/>` : '').join('');
    const links = readings.filter(reading => reading.seen || reading.obstacle).map(({ item, mount, obstacle }) => {
        const from = project(item, mount);
        const to = obstacle ? project(obstacle.point, obstacle.point.z) : project(person, personTargetHeight(person));
        const [x, y] = to.split(' ');
        return `<path class="fp-walk-link" data-status="${obstacle?.status ?? 'clear'}" d="M${from}L${to}"/>`
            + (obstacle ? `<circle class="fp-obstruction-hit" data-status="${obstacle.status}" cx="${x}" cy="${y}" r=".07"/>` : '');
    }).join('');
    return trail + links;
}

export function paintPerson(person, camera = null, animate = true, detailed = true, occlusion = null) {
    const { x, y, pose, heading } = person;
    if (camera === null) {
        const wave = animate ? Math.sin((person.smokeTime ?? 0) * Math.PI * 4.6) * .075 : 0;
        const reacting = person.smokePhase === 'smoke' || person.smokePhase === 'reported';
        const reaction = `<circle cy="-.11" r=".085"/><path d="M0 .03v.12M-.22 ${-.24 + wave}L-.14 .01 0 .07 .14 .01 .22 ${-.24 - wave}"/>`;
        const figure = reacting ? reaction : {
            standing: '<circle cy="-.13" r=".10"/><path d="M-.17 .16v-.05q.17-.18.34 0v.05"/>',
            sitting: '<circle cy="-.12" r=".09"/><path d="M-.17 .02v.16h.34V.02M-.1 .09h.2"/>',
            lying: '<circle cy="-.20" r=".075"/><path d="M0-.06v.30m-.12-.16L0-.06l.12.14m-.07.16L0 .12l-.07.12"/>',
        }[pose];
        const falling = animate && person.fallProgress !== undefined && person.fallProgress < 1;
        const progress = falling ? person.fallProgress : 0;
        const body = person.fallProgress === undefined ? `rotate(${heading})`
            : `rotate(${heading + (falling ? 75 * progress : 180)}) translate(0 ${progress * .13}) scale(1 ${1 + progress * .65})`;
        return `<g class="fp-person-flat" data-avatar="${person.avatar ?? 'man'}" data-pose="${pose}" data-activity="${person.activity ?? ''}" ${person.active ? 'data-active' : ''} transform="translate(${x} ${y})${person.avatar === 'child' ? ' scale(.82)' : ''}">
            <circle class="fp-person-base" r=".34"/><g class="fp-person-body" transform="${body}">${figure}</g></g>`;
    }
    return paintAvatar(person, camera, animate, detailed, occlusion);
}
