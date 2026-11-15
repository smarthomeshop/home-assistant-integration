import { mountingRange, plannerRadars, supportedMounting, validRoom } from './ceilsense-room-model.mjs';
import { ceilingHeightAt, validCeiling } from './floor-planner-ceiling.mjs';
import { furnitureCatalog, furnitureMaterials, maxFurniture } from './floor-planner-furniture.mjs';
import { outlineBounds, roomContains, roomContainsLine, roomLineSpans, validRoomOutline } from './floor-planner-geometry.mjs';
import { validUnderlay } from './floor-planner-underlay.mjs';

export const devices = {
    'ceilsense-mini': { name: 'CeilSense Mini', image: '/images/ceilsense/final/mini-iso.webp', mount: 'ceiling', defaultRadar: 'ld2412', coming: true },
    'ceilsense-v2': { name: 'CeilSense V2', image: '/images/ceilsense/final/v2-iso.webp', mount: 'ceiling', defaultRadar: 'ld2412' },
    'ceilsense-pro': { name: 'CeilSense Pro', image: '/images/ceilsense/final/pro-iso.webp', mount: 'ceiling', defaultRadar: 'ld2412', coming: true },
    ceilsense: { name: 'CeilSense V1', mount: 'ceiling' },
    ultimatesensor: { name: 'UltimateSensor', mount: 'wall' },
    'ultimatesensor-mini': { name: 'UltimateSensor Mini', mount: 'wall' },
    'ultimatesensor-v2': { name: 'UltimateSensor V2', image: '/assets/ultimatesensor-v2-white-hero.webp', mount: 'wall', defaultRadar: 'ld2450' },
    'ultimatesensor-mini-v2': { name: 'UltimateSensor Mini V2', image: '/assets/ultimatesensor-mini-v2-white-hero.webp', mount: 'wall', defaultRadar: 'ld2450' },
    wallsense: { name: 'WallSense', image: '/images/wallsense/hero-2026-09-22-512.webp', mount: 'wall', defaultRadar: 'ld2450', coming: true },
};

export function installationsFor(model) {
    if (model === 'wallsense') return ['wall-recessed'];
    if (devices[model]?.mount === 'ceiling') return ['ceilsense-mini', 'ceilsense-pro'].includes(model)
        ? ['ceiling-recessed', 'ceiling-surface'] : ['ceiling-recessed'];
    return ['ultimatesensor-v2', 'ultimatesensor-mini-v2'].includes(model) ? ['freestanding', 'wall-bracket'] : ['freestanding'];
}

export const installationFor = item => item.installation ?? installationsFor(item.model)[0];

export function sameSensorPlacement(a, b) {
    return a.model === b.model && a.radar === b.radar && a.angle === b.angle
        && installationFor(a) === installationFor(b) && (a.levelMountRoom ?? null) === (b.levelMountRoom ?? null)
        && Math.abs((a.mountHeight ?? 1.4) - (b.mountHeight ?? 1.4)) < .02
        && Math.hypot(a.x - b.x, a.y - b.y) < .08;
}

export const radarNames = {
    none: '-', ld2412: 'LD2412', ld2450: 'LD2412 + LD2450', ld2460: 'LD2460',
    ld6002b: 'LD6002B', combined: 'LD2412 + LD6002B',
};

export function radarsFor(model) {
    const device = devices[model];
    if (!device.defaultRadar) return ['none'];
    if (model === 'wallsense') return ['ld2450'];
    if (device.mount === 'wall') return ['ld2450', 'ld2460'];
    return model === 'ceilsense-v2' ? ['none', ...plannerRadars] : plannerRadars.filter(radar => radar !== 'combined');
}

function validSensorRadar(item) {
    if (!item.haDevice) return radarsFor(item.model).includes(item.radar);
    return item.radar === 'none' || (devices[item.model].mount === 'wall'
        ? ['ld2450', 'ld2460'].includes(item.radar) : plannerRadars.includes(item.radar));
}

// crypto.randomUUID only exists in secure contexts. Home Assistant is often
// opened over plain http on the local network, where it is missing, so fall
// back to building a version 4 UUID from random bytes.
export const newId = () => {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
    const bytes = new Uint8Array(16);
    if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
    else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return [...bytes].map((value, index) =>
        `${[4, 6, 8, 10].includes(index) ? '-' : ''}${value.toString(16).padStart(2, '0')}`).join('');
};
export const snap = value => Math.round(value * 4) / 4;
export const contains = roomContains;

export function wallVector(angle) {
    const radians = angle * Math.PI / 180;
    return { x: Math.sin(radians), y: -Math.cos(radians) };
}

export function roomForDevice(rooms, item) {
    const facing = wallVector(item.angle);
    const point = devices[item.model].mount === 'wall'
        ? { x: item.x + facing.x * .08, y: item.y + facing.y * .08 } : item;
    return rooms.find(room => contains(room, point));
}

export const ceilingReferenceRange = mountingRange;

export function ceilingCoverageStatus(room, item) {
    if (!room) return 'missing';
    if (room.ceiling && item.levelMountRoom !== room.id) return 'tilted';
    return supportedMounting(item.radar, ceilingHeightAt(room, item)) ? 'reference' : 'height';
}

export function readDemo(search) {
    const query = new URLSearchParams(search);
    const room = { width: Number(query.get('width')), depth: Number(query.get('depth')), height: Number(query.get('height')) };
    const radar = query.get('radar');
    if (!validRoomDimensions(room) || !plannerRadars.includes(radar)) return null;
    return query.get('obstacles') === '1' ? { ...room, radar, obstacles: true } : { ...room, radar };
}

const numberBetween = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const validRoomDimensions = room => numberBetween(room.width, .5, 60) && numberBetween(room.depth, .5, 60) && validCeiling(room);
const point = value => value && numberBetween(value.x, -100, 100) && numberBetween(value.y, -100, 100);
const angle = value => Number.isFinite(value) && value >= 0 && value < 360;
const validName = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 48;
// Home Assistant can hide the reflection a radar sees in a mirror. Both fields
// are optional so plans saved before this existed stay valid.
const validMirrorProtection = item => (item.protectionEnabled === undefined || typeof item.protectionEnabled === 'boolean')
    && (item.reflectionDepthM === undefined || numberBetween(item.reflectionDepthM, .25, 6));
const list = (value, check, maximum = 80) => Array.isArray(value) && value.length <= maximum && value.every(item =>
    item && typeof item.id === 'string' && /^[a-z\d-]{1,48}$/i.test(item.id) && check(item));

// Finishes a room can have in the 3D model. Rooms without one keep the
// planner's own choice.
export const floorFinishes = ['boards', 'tiles', 'carpet', 'concrete', 'plain'];
export const wallColors = ['white', 'sand', 'sage', 'blue', 'clay', 'grey'];
const validFinish = room => (room.floorFinish === undefined || floorFinishes.includes(room.floorFinish))
    && (room.wallColor === undefined || wallColors.includes(room.wallColor));

export function validPlan(plan) {
    // Version 2 adds a clockwise outline in metres relative to the room's x and y.
    if (!plan || ![1, 2, 3].includes(plan.version) || !validName(plan.name)) return false;
    if (plan.underlay !== undefined && !validUnderlay(plan.underlay)) return false;
    if (!list(plan.rooms, item => point(item) && validName(item.name) &&
        validRoomDimensions(item) && validFinish(item)
        && (item.useSampleName === undefined || typeof item.useSampleName === 'boolean')
        && (item.outline === undefined || (plan.version >= 2 && validRoomOutline(item)))
        && (item.obstacles === undefined || typeof item.obstacles === 'boolean')
        && (item.priority == null || (numberBetween(item.priority.x, .05, .95) && numberBetween(item.priority.y, .05, .95))))) return false;
    if (!list(plan.walls, item => point(item) && point({ x: item.endX, y: item.endY }) &&
        (item.x !== item.endX || item.y !== item.endY))) return false;
    if (!list(plan.doors, item => point(item) && angle(item.angle) && numberBetween(item.width, .5, 2))) return false;
    if (!list(plan.sensors, item => point(item) && angle(item.angle) &&
        Object.hasOwn(devices, item.model) && validSensorRadar(item)
        && (item.installation === undefined || installationsFor(item.model).includes(item.installation))
        && (item.climate === undefined || (item.model === 'ceilsense-v2' && typeof item.climate === 'boolean'))
        && (item.mountHeight === undefined || (devices[item.model].mount === 'wall' && numberBetween(item.mountHeight, .15, 6)))
        && (item.levelMountRoom == null || plan.rooms.some(room => room.id === item.levelMountRoom && room.ceiling)))) return false;
    if (plan.furniture !== undefined && !list(plan.furniture, item => point(item) && angle(item.angle)
        && validName(item.name) && Object.hasOwn(furnitureCatalog, item.kind) && furnitureMaterials.includes(item.material)
        && numberBetween(item.width, .02, 12) && numberBetween(item.depth, .02, 12)
        && numberBetween(item.height, .01, 6) && numberBetween(item.base, 0, 6), maxFurniture)) return false;
    const roomIds = new Set(plan.rooms.map(room => room.id));
    for (const key of ['windows', 'mirrors']) {
        if (plan[key] !== undefined && (plan.version !== 3 || !list(plan[key], item => point(item) && angle(item.angle)
            && roomIds.has(item.roomId) && numberBetween(item.width, .1, 8) && numberBetween(item.height, .1, 6)
            && numberBetween(item.base, 0, 6) && (key !== 'mirrors' || validMirrorProtection(item))))) return false;
    }
    const sensorIds = new Set(plan.sensors.map(sensor => sensor.id));
    if (plan.zones !== undefined && (plan.version !== 3 || !list(plan.zones, zone => {
        if (!roomIds.has(zone.roomId) || !validName(zone.name) || !zoneTypes.includes(zone.type)
            || (zone.direction !== undefined && !['left', 'right'].includes(zone.direction))
            || (zone.sensorId != null && !sensorIds.has(zone.sensorId)) || !Array.isArray(zone.parts)
            || !zone.parts.length || zone.parts.length > 12) return false;
        const room = plan.rooms.find(room => room.id === zone.roomId);
        return zone.parts.every(part => Array.isArray(part) && part.length >= 2 && part.length <= 64
            && part.every(p => Array.isArray(p) && p.length === 2 && point({ x: p[0], y: p[1] }) && contains(room, { x: p[0], y: p[1] }))
            && (zone.type === 'entry' ? part.length === 2 && Math.hypot(part[1][0] - part[0][0], part[1][1] - part[0][1]) >= .1
                : Boolean(outlineBounds(part, { minSpan: .1, minArea: .025 })))
            && part.every(([x, y], i) => {
                if (zone.type === 'entry' && i === 1) return true;
                const [endX, endY] = part[(i + 1) % part.length];
                return !room.outline || roomContainsLine(room, { x, y }, { x: endX, y: endY });
            }));
    }))) return false;
    const items = ['rooms', 'walls', 'doors', 'sensors', 'furniture', 'windows', 'mirrors', 'zones'].flatMap(key => plan[key] ?? []);
    return new Set(items.map(item => item.id)).size === items.length;
}

export const zoneTypes = ['detection', 'exclusion', 'entry', 'interference'];

export function blankPlan(name) {
    return { version: 1, name, rooms: [], walls: [], doors: [], sensors: [] };
}

export function demoPlan(room, names) {
    const plan = blankPlan(names.demo);
    plan.rooms.push({ id: 'demo-room', name: names.room, x: 0, y: 0, width: room.width, depth: room.depth, height: room.height, obstacles: room.obstacles ?? false, priority: room.priority ?? null });
    const positions = room.positions ?? [{ x: .5, y: .5, rotated: false }];
    plan.sensors = positions.map(({ x, y, rotated }, index) => ({
        id: 'demo-ceil-' + (index + 1), model: 'ceilsense-v2', radar: room.radar,
        x: x * room.width, y: y * room.depth, angle: rotated ? 90 : 0,
    }));
    return plan;
}

const sampleRoomLayout = [
    ['living', 0, 0, 6.5, 4.5],
    ['kitchen', 6.5, 0, 4, 4.5],
    ['office', 0, 4.5, 4, 3.5],
    ['hall', 4, 4.5, 3, 3.5],
    ['bedroom', 7, 4.5, 3.5, 3.5],
];
const upperRoomLayout = [
    ['main-bedroom', 0, 0, 5, 4.5],
    ['child-bedroom', 5, 0, 5.5, 4.5],
    ['bathroom', 0, 4.5, 4, 3.5],
    ['landing', 4, 4.5, 3, 3.5],
    ['study', 7, 4.5, 3.5, 3.5],
];
export const sampleRoomIds = new Set([...sampleRoomLayout, ...upperRoomLayout].map(([id]) => id));
const sampleRooms = (layout, names) => layout.map(([id, x, y, width, depth]) => ({
    id, name: names[id], useSampleName: true, x, y, width, depth, height: 2.7,
}));
const sampleDoors = (layout, prefix) => layout.map(([x, y, angle], index) => ({ id: prefix + index, x, y, angle, width: .9 }));

export function samplePlan(names) {
    const plan = blankPlan(names.sample);
    plan.rooms = sampleRooms(sampleRoomLayout, names);
    plan.rooms.find(room => room.id === 'bedroom').ceiling = { type: 'gable', high: 3.8, direction: 'x+' };
    plan.doors = sampleDoors([
        [6.5, 1.8, 90], [5.35, 4.5, 0], [4, 5.9, 270], [7, 5.85, 90], [4.25, 8, 0],
    ], 'door-');
    plan.sensors = [
        ['ceil-living', 'ceilsense-v2', 'combined', 3, 2.5, 0],
        ['ceil-kitchen', 'ceilsense-mini', 'ld2460', 8.75, 2.5, 90],
        ['us-office', 'ultimatesensor-v2', 'ld2450', 2.5, 7.5, 0],
        ['wall-hall', 'wallsense', 'ld2450', 4, 6, 90],
        ['ceil-pro-living', 'ceilsense-pro', 'ld2412', 4.7, 1.15, 0],
    ].map(([id, model, radar, x, y, angle]) => ({ id, model, radar, x, y, angle }));
    plan.sensors.find(sensor => sensor.id === 'us-office').installation = 'freestanding';
    plan.sensors.find(sensor => sensor.id === 'wall-hall').installation = 'wall-recessed';
    return plan;
}

export function sampleUpperPlan(names) {
    const plan = blankPlan(names.sample);
    plan.rooms = sampleRooms(upperRoomLayout, names);
    plan.doors = sampleDoors([[4.05, 4.5, 0], [5.8, 4.5, 0], [4, 6.25, 270], [7, 5.55, 90]], 'upper-door-');
    plan.sensors = [
        { id: 'upper-bedroom', model: 'ceilsense-v2', radar: 'combined', x: 2.55, y: 2.65, angle: 0 },
        { id: 'upper-landing', model: 'ceilsense-mini', radar: 'ld2412', x: 5.25, y: 5.5, angle: 0 },
        { id: 'upper-study', model: 'ultimatesensor-mini-v2', radar: 'ld2460', x: 9.7, y: 7.7, angle: 0, installation: 'freestanding' },
    ];
    return plan;
}

// A drawn partition inside a room can invalidate geometric coverage. Outer edges leave the estimate unchanged.
export function hasInteriorWall(room, walls) {
    if (room.outline) return walls.some(wall => roomLineSpans(room, wall, { x: wall.endX, y: wall.endY }, false).length > 0);
    const margin = .001;
    return walls.some(wall => {
        const x0 = room.x + margin;
        const y0 = room.y + margin;
        const x1 = room.x + room.width - margin;
        const y1 = room.y + room.depth - margin;
        const dx = wall.endX - wall.x;
        const dy = wall.endY - wall.y;
        let start = 0;
        let end = 1;
        for (const [p, q] of [[-dx, wall.x - x0], [dx, x1 - wall.x], [-dy, wall.y - y0], [dy, y1 - wall.y]]) {
            if (p === 0 && q < 0) return false;
            if (p < 0) start = Math.max(start, q / p);
            if (p > 0) end = Math.min(end, q / p);
        }
        return start < end;
    });
}

export function guidePlanForRoom(plan, room, limit = 3) {
    if (room?.outline) return { reason: 'shape' };
    if (room?.ceiling) return { reason: 'ceiling' };
    if (!room || !validRoom(room)) return { reason: 'dimensions' };
    const sensors = plan.sensors.filter(item => item.model === 'ceilsense-v2' && roomForDevice(plan.rooms, item)?.id === room.id);
    if (!sensors.length || sensors.length > limit) return { reason: 'quantity' };
    const radar = sensors[0].radar;
    if (!plannerRadars.includes(radar) || sensors.some(item => item.radar !== radar)) return { reason: 'radars' };
    if (sensors.some(item => item.angle % 90 !== 0)) return { reason: 'angles' };
    return {
        width: room.width, depth: room.depth, height: room.height, radar,
        obstacles: Boolean(room.obstacles) || hasInteriorWall(room, plan.walls)
            || (plan.furniture ?? []).some(item => item.material !== 'ignore' && item.base + item.height >= 1 && contains(room, item)),
        count: sensors.length, priority: room.priority ?? null,
        positions: sensors.map(item => ({
            x: (item.x - room.x) / room.width, y: (item.y - room.y) / room.depth, rotated: item.angle % 180 === 90,
        })),
    };
}
