import { modelGoal } from './ceilsense-room-model.mjs';
import { ceilingHeightAt } from './floor-planner-ceiling.mjs';
import { contains, hasInteriorWall, installationFor, roomForDevice, sameSensorPlacement } from './floor-planner-model.mjs';
import { edgePosition, polygonEdges, roomCorners, roomInteriorPoint } from './floor-planner-geometry.mjs';
import { fieldCoversPoint, radarFields, radarHasLineOfSight, sensorMountHeight } from './floor-planner-radar.mjs';
import { furnitureOcclusion, prepareFurnitureOcclusion } from './floor-planner-obstruction.mjs';

const fixed = value => Number(value.toFixed(2));
const slots = [.2, .5, .8];
const minimumGain = .05;
const tall = new Set(['wardrobe', 'cabinet', 'shelves', 'island', 'fridge', 'washer', 'screen', 'glass', 'custom']);
const flatSurfaces = new Set(['desk', 'dining', 'coffee', 'cabinet', 'nightstand', 'island', 'custom']);
export const defaultAdvice = { goal: 'presence', mount: 'either', air: false, level: false, wallHeight: 1.4 };
const mountHeightLimit = ceiling => Math.min(6, Math.floor((ceiling - .15) * 100 + 1e-8) / 100);
export const adviceMountHeightLimit = room => mountHeightLimit(room.ceiling?.high ?? room.height);

function usableSurfaces(plan, room) {
    return (plan.furniture ?? []).filter(item => flatSurfaces.has(item.kind) && item.width >= .18 && item.depth >= .15 && contains(room, item)
        && item.base + item.height + .05 <= ceilingHeightAt(room, item) - .15);
}

function candidatesFor(plan, room, settings, family, surfaces) {
    const ceiling = family === 'ceiling';
    const freestanding = family === 'freestanding';
    const { x, y, width, depth } = room;
    const radar = settings.goal === 'climate' ? (ceiling ? 'none' : 'ld2450')
        : settings.goal === 'height' ? 'ld6002b'
            : settings.goal === 'zones' && ceiling ? 'ld2460' : ceiling ? 'ld2412' : 'ld2450';
    if (!ceiling && settings.goal === 'height') return [];
    if (ceiling && room.ceiling && !settings.level) return [];
    const installation = ceiling ? 'ceiling-recessed' : freestanding ? 'freestanding'
        : family === 'recessed' ? 'wall-recessed' : 'wall-bracket';
    let positions = ceiling
        ? [.5, .25, .75].flatMap(u => [.5, .25, .75].map(v => [x + u * width, y + v * depth]))
        : slots.flatMap(t => [[x + t * width, y, 180], [x + t * width, y + depth, 0],
            [x, y + t * depth, 90], [x + width, y + t * depth, 270]]);
    if (room.outline) {
        if (ceiling) {
            const anchor = roomInteriorPoint(room);
            positions.unshift([anchor.x, anchor.y]);
        } else {
            positions = polygonEdges(roomCorners(room)).flatMap(([a, b]) => slots.map(t => {
                const position = { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t };
                const { x, y, facing } = edgePosition(a, b, position);
                return [x, y, facing];
            }));
        }
    }
    if (freestanding) {
        positions = surfaces.length ? surfaces.map(item => [item.x, item.y, item.angle, item.base + item.height + .05])
            : positions.map(([x, y, angle]) => {
                const radians = angle * Math.PI / 180;
                return [x + .25 * Math.sin(radians), y - .25 * Math.cos(radians), angle, settings.wallHeight];
            });
    }
    const model = ceiling ? 'ceilsense-v2' : family === 'recessed' ? 'wallsense' : 'ultimatesensor-v2';
    const existing = plan.sensors.filter(item => item.model === model
        && installationFor(item) === installation
        && (settings.goal === 'climate' || item.radar === radar)
        && (ceiling || freestanding || Math.abs(sensorMountHeight(item, room) - settings.wallHeight) < .01)
        && (!ceiling || !room.ceiling || item.levelMountRoom === room.id))
        .map(({ id, ...item }) => ({ ...item, installation }));
    const planned = positions.flatMap(([px, py, angle, surfaceHeight]) => (freestanding && surfaces.length ? [0, 90, 180, 270]
        : ceiling && settings.goal !== 'climate' ? [0, 90] : [angle ?? 0]).map(angle => {
        const candidate = { x: px, y: py, angle, model, radar, installation };
        if (ceiling && room.ceiling) candidate.levelMountRoom = room.id;
        if (!ceiling) candidate.mountHeight = surfaceHeight === undefined ? settings.wallHeight : fixed(surfaceHeight);
        return candidate;
    }));
    return [...existing, ...planned].filter(item => {
        if (Math.abs(item.x) > 100 || Math.abs(item.y) > 100 || roomForDevice(plan.rooms, item)?.id !== room.id) return false;
        if (ceiling) return true;
        const height = sensorMountHeight(item, room);
        return height >= .15 && height <= mountHeightLimit(ceilingHeightAt(room, item));
    });
}

function cellsFor(room, furniture) {
    const cells = [];
    for (let row = 0; row < 10; row++) for (let column = 0; column < 12; column++) {
        const point = { x: room.x + (column + .5) / 12 * room.width,
            y: room.y + (row + .5) / 10 * room.depth, pose: 'sitting' };
        if (room.outline && !contains(room, point)) continue;
        const unusable = furniture.some(object => tall.has(object.kind) && object.parts.some(part => {
            const [x, y] = object.local(point);
            return part.low < .55 && part.high > .82 && x > part.x && x < part.x + part.w && y > part.y && y < part.y + part.d;
        }));
        if (!unusable) cells.push(point);
    }
    return cells;
}

function scoreCandidate(item, room, goal, cells, furniture) {
    const mode = { presence: 'presence', zones: 'xy', height: 'xyz' }[goal];
    const available = radarFields(room, item);
    const fields = mode === 'presence' && !available.some(field => field.mode === 'presence')
        ? available : available.filter(field => field.mode === mode);
    if (!fields.length) return null;
    const origin = { ...item, z: sensorMountHeight(item, room) };
    const coverage = cells.map(point => fields.some(field => fieldCoversPoint(field, item, point))
        && radarHasLineOfSight(room, item, point)
        && !furnitureOcclusion(origin, point, .85, furniture));
    return { item, coverage };
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
            if (extra > gain) { best = candidate; gain = extra; }
        }
        if (!best || (gain < Math.ceil(cells.length * minimumGain) && clear + gain < target)) break;
        best.coverage.forEach((cell, index) => { combined[index] ||= cell; });
        clear += gain;
        sensors.push(best.item);
        scored = scored.filter(candidate => Math.hypot(candidate.item.x - best.item.x, candidate.item.y - best.item.y) > .15);
    }
    return sensors.length ? { sensors, percent: Math.floor(clear * 100 / cells.length),
        baselinePercent: Math.floor(baseline * 100 / cells.length), reachesGoal: clear >= target } : null;
}

export function prepareAdviceFurniture(plan) {
    return prepareFurnitureOcclusion(plan.furniture ?? []);
}

export function adviseRoom(plan, room, settings = defaultAdvice, obstacles = prepareAdviceFurniture(plan)) {
    if (settings.mount !== 'ceiling' && settings.goal !== 'height'
        && !(settings.wallHeight >= .15 && settings.wallHeight <= adviceMountHeightLimit(room))) {
        return { reason: 'height_invalid', choices: [] };
    }
    if (settings.goal !== 'climate' && hasInteriorWall(room, plan.walls)) return { reason: 'partition', choices: [] };
    const furniture = obstacles.filter(({ bounds: [x1, y1, x2, y2] }) => x2 >= room.x && x1 <= room.x + room.width
        && y2 >= room.y && y1 <= room.y + room.depth);
    const cells = settings.goal === 'climate' ? [] : cellsFor(room, furniture);
    const existing = settings.strategy === 'replace' ? [] : plan.sensors.filter(item => roomForDevice(plan.rooms, item)?.id === room.id);
    const hasCO2 = existing.some(item => item.climate || ['wallsense', 'ultimatesensor-v2'].includes(item.model));
    if (settings.goal === 'climate' && hasCO2) return { reason: 'climate_already', choices: [] };
    const existingScores = cells.length ? existing.map(item => scoreCandidate(item, room, settings.goal, cells, furniture)).filter(Boolean) : [];
    const existingCoverage = cells.map((_, index) => existingScores.some(({ coverage }) => coverage[index]));
    if (cells.length && existingCoverage.filter(Boolean).length >= Math.ceil(cells.length * modelGoal / 100)) {
        if (settings.air && !hasCO2) return adviseRoom(plan, room, { ...settings, goal: 'climate' }, obstacles);
        return { reason: 'covered', choices: [] };
    }
    const families = settings.mount === 'either' ? ['ceiling', 'wall', 'freestanding', 'recessed'] : [settings.mount];
    const surfaces = usableSurfaces(plan, room);
    const choices = families.flatMap(family => {
        const needsScd41 = (settings.air || settings.goal === 'climate') && family === 'ceiling';
        const candidates = candidatesFor(plan, room, settings, family, surfaces).filter(item => {
            if (!contains(room, item)) return false;
            return existing.every(sensor => {
                if (needsScd41 && sameSensorPlacement(sensor, item)) return true;
                const heightDifference = sensorMountHeight(sensor, room) - sensorMountHeight(item, room);
                return Math.hypot(sensor.x - item.x, sensor.y - item.y, heightDifference) > .15;
            });
        });
        const result = settings.goal === 'climate' && candidates.length
            ? { sensors: [candidates.find(item => plan.sensors.some(sensor => sameSensorPlacement(sensor, item)))
                ?? candidates[family === 'wall' ? Math.min(4, candidates.length - 1) : 0]], percent: null, reachesGoal: true }
            : layout(candidates.map(item => scoreCandidate(item, room, settings.goal, cells, furniture)).filter(Boolean), cells, existingCoverage);
        if (!result) return [];
        const upgrade = needsScd41 && existing.some(sensor => result.sensors.some(item => sameSensorPlacement(sensor, item)));
        return [{ ...result, family, upgrade, needsScd41, needsSurface: family === 'freestanding' && !surfaces.length,
            unmodelled: settings.goal === 'climate' ? 0 : existing.length - existingScores.length,
            sensors: result.sensors.map(item => needsScd41 ? { ...item, climate: true } : item) }];
    }).sort((a, b) => Number(b.upgrade) - Number(a.upgrade)
        || Number(a.family === 'recessed') - Number(b.family === 'recessed')
        || Number(a.needsSurface) - Number(b.needsSurface)
        || Number(b.reachesGoal) - Number(a.reachesGoal)
        || (a.reachesGoal ? a.sensors.length - b.sensors.length : 0)
        || (settings.air || settings.goal === 'climate' ? Number(a.needsScd41) - Number(b.needsScd41) : 0)
        || (b.percent ?? 0) - (a.percent ?? 0));
    return choices.length ? { choices } : { reason: settings.goal === 'height' ? 'height' : 'no_fit', choices };
}
