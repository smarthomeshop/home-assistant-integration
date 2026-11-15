import { contains, roomForDevice, samplePlan, sampleRoomIds, sampleUpperPlan, validPlan } from './floor-planner-model.mjs';
import { withFurniture } from './floor-planner-furniture.mjs';
import { edgePosition, outlineBounds, polygonEdges, roomCorners, roomWallEdges } from './floor-planner-geometry.mjs';
import { validStaircase } from './floor-planner-stairs.mjs';

export const buildingFormat = 'smarthomeshop-building';
export const maxFloors = 12;
export const validProject = value => validPlan(value) || validBuilding(value);

export function validBuilding(value) {
    if (value?.format !== buildingFormat || value.version !== 1 || typeof value.name !== 'string'
        || !value.name.trim() || value.name.length > 48 || !Array.isArray(value.floors)
        || !value.floors.length || value.floors.length > maxFloors) return false;
    const ids = new Set(), levels = new Set();
    for (const floor of value.floors) {
        if (!floor || typeof floor.id !== 'string' || !/^[a-z\d-]{1,48}$/i.test(floor.id) || ids.has(floor.id)
            || !Number.isInteger(floor.level) || floor.level < -5 || floor.level > 20 || levels.has(floor.level)
            || !(floor.name === null || (typeof floor.name === 'string' && floor.name.trim() && floor.name.length <= 32))
            || !validPlan(floor.plan)) return false;
        ids.add(floor.id);
        levels.add(floor.level);
    }
    return ids.has(value.activeFloor) && (value.staircase === undefined || validStaircase(value.staircase, value.floors));
}

export function sampleBuilding(names, furniture) {
    const ground = withFurniture(samplePlan(names), furniture);
    const upper = withFurniture(sampleUpperPlan(names), furniture);
    upper.furniture = upper.furniture.map((item, index) => ({ ...item, id: 'furniture-example-upper-' + index }));
    return {
        format: buildingFormat, version: 1, name: names.sample, activeFloor: 'ground',
        floors: [{ id: 'ground', level: 0, name: null, plan: ground }, { id: 'upper', level: 1, name: null, plan: upper }],
        staircase: { lower: 'ground', upper: 'upper', width: .94, bottom: { x: 5.8, y: 7.25 }, top: { x: 5.8, y: 4.78 } },
    };
}

export const floorLabel = (floor, copy) => floor.name || (floor.level === 0 ? copy.floor_ground
    : copy[floor.level > 0 ? 'floor_upper' : 'floor_lower'].replace(':level', Math.abs(floor.level)));

export function localizeSampleRooms(project, names, languages) {
    const building = project.format === buildingFormat;
    const plans = building ? project.floors.map(floor => floor.plan) : [project];
    const legacyRooms = plans.flatMap(plan => plan.rooms.filter(room =>
        sampleRoomIds.has(room.id) && room.useSampleName === undefined));
    let legacyNames;
    if (legacyRooms.length) {
        const hasTitle = (labels, title) => labels.sample === title || labels.legacy_sample === title;
        legacyNames = languages.find(labels => hasTitle(labels, project.name))
            ?? languages.find(labels => plans.some(plan => hasTitle(labels, plan.name)));
        if (!legacyNames && plans.some(plan => plan.furniture?.some(item => item.id.startsWith('furniture-example-')))) {
            // Use the original demo furniture and room names to recognise an older, renamed demo.
            const matches = languages.map(labels => ({
                labels, count: legacyRooms.filter(room => room.name === labels[room.id]).length,
            })).sort((a, b) => b.count - a.count);
            if (matches[0]?.count > (matches[1]?.count ?? 0)) legacyNames = matches[0].labels;
        }
    }
    const localize = plan => ({
        ...plan,
        rooms: plan.rooms.map(room => {
            if (!sampleRoomIds.has(room.id)) return room;
            const useSampleName = room.useSampleName ?? (legacyNames && room.name === legacyNames[room.id]);
            if (useSampleName === undefined) return room;
            return { ...room, useSampleName, name: useSampleName ? names[room.id] : room.name };
        }),
    });
    return building
        ? { ...project, floors: project.floors.map(floor => ({ ...floor, plan: localize(floor.plan) })) }
        : localize(project);
}

export function roomContents(plan, room) {
    const edgeRoom = door => {
        const angle = door.angle * Math.PI / 180;
        const middle = { x: door.x + Math.cos(angle) * door.width / 2, y: door.y + Math.sin(angle) * door.width / 2 };
        return plan.rooms.find(candidate => contains(candidate, middle)
            || polygonEdges(roomCorners(candidate)).some(([a, b]) => {
                const onWall = edgePosition(a, b, middle);
                return Math.hypot(onWall.x - middle.x, onWall.y - middle.y) < .02;
            }))?.id;
    };
    return {
        rooms: [room],
        walls: plan.walls.filter(item => plan.rooms.find(candidate => contains(candidate, item)
            && contains(candidate, { x: item.endX, y: item.endY }))?.id === room.id),
        doors: plan.doors.filter(item => (item.roomId ?? edgeRoom(item)) === room.id),
        sensors: plan.sensors.filter(item => roomForDevice(plan.rooms, item)?.id === room.id),
        furniture: (plan.furniture ?? []).filter(item => plan.rooms.find(candidate => contains(candidate, item))?.id === room.id),
        ...Object.fromEntries(['windows', 'mirrors', 'zones'].map(key => [key, (plan[key] ?? []).filter(item => item.roomId === room.id)])),
    };
}

export function translatedItem(item, dx, dy) {
    if (item.parts) return { ...item, parts: item.parts.map(part => part.map(([x, y]) => [x + dx, y + dy])) };
    return { ...item, x: item.x + dx, y: item.y + dy,
        ...(item.haFrame ? { haFrame: { ...item.haFrame, x: item.haFrame.x + dx, y: item.haFrame.y + dy } } : {}),
        ...(item.endX === undefined ? {} : { endX: item.endX + dx, endY: item.endY + dy }) };
}

export function rotatedRoom(plan, room) {
    const cx = room.x + room.width / 2, cy = room.y + room.depth / 2;
    const rotate = ([x, y]) => [cx + cy - y, cy + x - cx].map(value => Number(value.toFixed(6)));
    const geometry = outlineBounds(roomCorners(room).map(rotate));
    if (!geometry) return null;
    const updated = { ...room, ...geometry };
    if (room.haFrame) {
        const [x, y] = rotate([room.haFrame.x, room.haFrame.y]);
        updated.haFrame = { ...room.haFrame, x, y, angle: (room.haFrame.angle + 90) % 360 };
    }
    if (!room.outline) delete updated.outline;
    if (room.priority) updated.priority = { x: 1 - room.priority.y, y: room.priority.x };
    if (room.ceiling) {
        const directions = ['x+', 'y+', 'x-', 'y-'];
        const next = directions[(directions.indexOf(room.ceiling.direction) + 1) % directions.length];
        updated.ceiling = { ...room.ceiling, direction: room.ceiling.type === 'gable' ? next[0] + '+' : next };
    }
    const result = { ...plan };
    for (const [key, items] of Object.entries(roomContents(plan, room))) {
        if (!items.length) continue;
        const ids = new Set(items.map(item => item.id));
        result[key] = plan[key].map(item => {
            if (!ids.has(item.id)) return item;
            if (key === 'rooms') return updated;
            if (item.parts) return { ...item, parts: item.parts.map(part => part.map(rotate)) };
            const [x, y] = rotate([item.x, item.y]);
            const next = { ...item, x, y };
            if (item.endX !== undefined) [next.endX, next.endY] = rotate([item.endX, item.endY]);
            if (item.angle !== undefined) next.angle = (item.angle + 90) % 360;
            return next;
        });
    }
    return validPlan(result) ? result : null;
}

export function moveRoomToFloor(project, room, destination) {
    const source = project.floors.find(floor => floor.id === project.activeFloor);
    const target = project.floors.find(floor => floor.id === destination);
    if (!source || !target || source === target) return null;
    const from = { ...source.plan }, to = { ...target.plan, version: Math.max(source.plan.version, target.plan.version) };
    for (const [key, items] of Object.entries(roomContents(source.plan, room))) {
        if (!items.length) continue;
        const ids = new Set(items.map(item => item.id));
        from[key] = from[key].filter(item => !ids.has(item.id));
        to[key] = [...(to[key] ?? []), ...items];
    }
    const result = { ...project, activeFloor: destination, floors: project.floors.map(floor =>
        floor === source ? { ...floor, plan: from } : floor === target ? { ...floor, plan: to } : floor) };
    return validBuilding(result) ? result : null;
}

export function wallOpeningPosition(edge, width, reversed = false) {
    const start = Math.max(0, Math.min(edge.length - width, edge.along - width / 2));
    const fraction = (start + (reversed ? width : 0)) / edge.length;
    return {
        width, angle: reversed ? edge.facing : edge.angle,
        x: edge.a[0] + (edge.b[0] - edge.a[0]) * fraction,
        y: edge.a[1] + (edge.b[1] - edge.a[1]) * fraction,
    };
}

export function roomOpening(room, item, width = item.width, { preserveDirection = false, minWidth = .1 } = {}) {
    const angle = item.angle * Math.PI / 180;
    const middle = { x: item.x + Math.cos(angle) * item.width / 2, y: item.y + Math.sin(angle) * item.width / 2 };
    const edge = roomWallEdges(room).map(([a, b]) => edgePosition(a, b, middle))
        .sort((a, b) => Math.hypot(a.x - middle.x, a.y - middle.y) - Math.hypot(b.x - middle.x, b.y - middle.y))[0];
    if (!edge || edge.length < minWidth) return item;
    const reversed = preserveDirection && Math.cos((item.angle - edge.angle) * Math.PI / 180) < 0;
    return { ...item, ...wallOpeningPosition(edge, Math.min(width, edge.length), reversed) };
}

// Prefer parallel edges with overlapping runs. Snap only the room being dragged.
export function snapRoomOffset(room, rooms, dx, dy, tolerance = .14) {
    const edges = item => {
        const points = roomCorners(item);
        return points.flatMap((point, i) => {
            const end = points[(i + 1) % points.length];
            return [0, 1].flatMap(axis => Math.abs(point[axis] - end[axis]) < 1e-6
                ? [{ axis, position: point[axis], start: Math.min(point[1 - axis], end[1 - axis]),
                    end: Math.max(point[1 - axis], end[1 - axis]) }]
                : []);
        });
    };
    const movingEdges = edges(room);
    const adjustment = [null, null];
    for (const fixed of rooms.filter(other => other.id !== room.id).flatMap(edges)) {
        const offset = fixed.axis === 0 ? dx : dy;
        const along = fixed.axis === 0 ? dy : dx;
        for (const moving of movingEdges) {
            if (moving.axis !== fixed.axis || moving.end + along < fixed.start - tolerance
                || moving.start + along > fixed.end + tolerance) continue;
            const gap = fixed.position - moving.position - offset;
            if (Math.abs(gap) <= tolerance && (adjustment[fixed.axis] === null || Math.abs(gap) < Math.abs(adjustment[fixed.axis]))) {
                adjustment[fixed.axis] = gap;
            }
        }
    }
    return { x: dx + (adjustment[0] ?? 0), y: dy + (adjustment[1] ?? 0) };
}
