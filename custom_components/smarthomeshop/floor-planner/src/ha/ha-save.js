// Planner project to Home Assistant rooms.
//
// The reverse of projectFromRooms in ha-rooms.js: every room of the project
// that differs from the last saved project becomes a room record again, in
// millimetres relative to the room, placed in the house by its haFrame.
// Records the planner does not know about (other fields, items it never
// showed) are kept as they are.
import { FloorPlanValidationError, zoneOwnerIsAvailable } from './safety.js';
import { haRoomContents } from './ha-rooms.js';
import { validProject } from '../js/floor-planner-building.mjs';
import { edgePosition, polygonEdges, roomCorners } from '../js/floor-planner-geometry.mjs';
import { devices as plannerModels } from '../js/floor-planner-model.mjs';
import { sensorMountHeight } from '../js/floor-planner-radar.mjs';
import { inverseTransformHomePoint } from '../../../panel/src/utils/whole-home.ts';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const degrees = value => (value % 360 + 360) % 360;
const millimetres = metres => Math.round(metres * 1e6) / 1e3;
const metres = millimetres => Math.round(millimetres * 1e3) / 1e6;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Openings up to 25 mm off a wall still belong to it.
const wallTolerance = 25;

const projectFloors = project => project.floors ?? [{ id: 'ground', level: 0, plan: project }];

// A room that came from Home Assistant keeps its id; a room drawn in the
// planner becomes a new Home Assistant room with the planner's id.
const sourceId = sensor => sensor.haSource ?? sensor.id;

const projectRooms = project => projectFloors(project).flatMap(({ level, plan }) =>
    plan.rooms.map(room => ({ id: room.haRoom ?? room.id, level, room, items: haRoomContents(plan, room) })));

// Every linked Home Assistant device with the rooms of its sensors.
function deviceRooms(entries) {
    const rooms = new Map();
    for (const { id, items } of entries) {
        for (const sensor of items.sensors) {
            if (sensor.haDevice) rooms.set(sensor.haDevice, [...rooms.get(sensor.haDevice) ?? [], id]);
        }
    }
    return rooms;
}

function housePlacement(room, level) {
    const frame = room.haFrame ?? { x: room.x, y: room.y, angle: 0, visible: true };
    return { x: millimetres(frame.x), y: millimetres(frame.y), rotationDeg: frame.angle, floor: level, visible: frame.visible };
}

// A door, window or mirror as a position along one of the room's walls.
// Without a height it is a door, which also gets the side it opens to.
function wallOpening(item, record, walls, toRoom, height, roomName) {
    const radians = item.angle * Math.PI / 180;
    const middle = toRoom({ x: item.x + Math.cos(radians) * item.width / 2, y: item.y + Math.sin(radians) * item.width / 2 });
    const wall = walls.map(({ x1, y1, x2, y2 }, index) => ({ index, ...edgePosition([x1, y1], [x2, y2], middle) }))
        .sort((a, b) => distance(a, middle) - distance(b, middle))[0];
    if (!wall || distance(wall, middle) > wallTolerance) throw new FloorPlanValidationError('opening_off_wall', { room: roomName });
    const { x1, y1, x2, y2 } = walls[wall.index];
    const start = toRoom(item);
    const inward = (middle.x - start.x) * (x2 - x1) + (middle.y - start.y) * (y2 - y1) < 0;
    return {
        ...record,
        id: record?.id ?? item.id,
        wallIndex: wall.index,
        position: wall.along / wall.length,
        width: millimetres(item.width),
        height: height ?? record?.height ?? 2100,
        ...(Object.hasOwn(item, 'protectionEnabled') ? {
            protectionEnabled: item.protectionEnabled === true,
            reflectionDepthMm: Math.round(Math.max(.25, Math.min(6, Number(item.reflectionDepthM) || 2)) * 1000),
        } : {}),
        ...(height === undefined ? { openDirection: inward ? 'inward' : 'outward' } : {}),
    };
}

// The changes to send to smarthomeshop/floor_plan/save.
//
//   project   what the editor has now
//   saved     the project as last loaded or saved
//   haRooms   the stored Home Assistant rooms
//
// Returns { changes, removed }: the room records to write and the ids of the
// rooms that were deleted in the planner. Rooms that never were part of the
// project are never removed. The items of every changed room are updated in
// place with the Home Assistant record they now belong to (haRoom, haIndex,
// haRecord, haSource), because the project is saved with them.
export function saveChanges(project, saved, haRooms) {
    if (!validProject(project)) throw new FloorPlanValidationError('invalid_project');
    const before = new Map(projectRooms(saved).map(entry => [entry.id, entry]));
    const entries = projectRooms(project);
    const ids = new Set(entries.map(entry => entry.id));
    const stored = new Map(haRooms.map(room => [room.id, room]));
    if (ids.size !== entries.length) throw new FloorPlanValidationError('duplicate_room');
    const sensors = entries.flatMap(entry => entry.items.sensors);
    if (projectFloors(project).flatMap(floor => floor.plan.sensors).length !== sensors.length) {
        throw new FloorPlanValidationError('sensor_outside_room');
    }
    // One device on two sensors is only accepted where it was already saved
    // like that (older versions allowed it), so it never blocks other edits.
    const earlier = deviceRooms([...before.values()]);
    for (const [device, rooms] of deviceRooms(entries)) {
        const known = earlier.get(device) ?? [];
        if (rooms.length > 1 && (new Set(rooms).size !== rooms.length || rooms.some(room => !known.includes(room)))) {
            throw new FloorPlanValidationError('duplicate_device');
        }
    }
    return {
        changes: entries.flatMap(entry => roomChange(entry, before.get(entry.id), stored)),
        removed: haRooms.filter(room => before.has(room.id) && !ids.has(room.id)).map(room => room.id),
    };
}

function roomChange({ id, room, level, items }, previous, stored) {
    if (previous && previous.level === level && same(previous.items, items)) return [];
    const record = stored.get(id);
    const house = housePlacement(room, level);
    const toRoom = ({ x, y }) => {
        const point = inverseTransformHomePoint({ x: millimetres(x), y: millimetres(y) }, house);
        return { x: Math.round(point.x * 1000) / 1000, y: Math.round(point.y * 1000) / 1000 };
    };
    const outline = polygonEdges(roomCorners(room)).map(([from, to]) => {
        const start = toRoom({ x: from[0], y: from[1] }), end = toRoom({ x: to[0], y: to[1] });
        return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
    });
    // Walls within 10 mm of the stored ones, in any order or direction, are
    // kept as stored, so openings and calibration on them stay valid.
    const storedWalls = record?.walls ?? [];
    const near = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by) < .01;
    const wallsKept = storedWalls.length === outline.length && storedWalls.every(wall => outline.some(edge =>
        (near(wall.x1, wall.y1, edge.x1, edge.y1) && near(wall.x2, wall.y2, edge.x2, edge.y2))
        || (near(wall.x1, wall.y1, edge.x2, edge.y2) && near(wall.x2, wall.y2, edge.x1, edge.y1))));
    const walls = wallsKept ? storedWalls : outline;
    const change = { id, name: record && previous?.room.name === room.name ? record.name : room.name, house };
    if (!wallsKept) change.walls = walls;
    if (previous?.room.height !== room.height) change.ceilingHeightMm = millimetres(room.height);

    for (const key of ['doors', 'windows', 'mirrors', 'furniture', 'zones']) {
        if (wallsKept && same(previous?.items[key], items[key])) continue;
        const records = record?.[key] ?? [];
        const recordIndex = item => item.haRecord ? records.findIndex(candidate => candidate.id === item.haRecord) : item.haIndex;
        const shown = new Set((previous?.items[key] ?? []).map(recordIndex));
        // Records the planner never showed stay first, untouched.
        const kept = records.filter((_, index) => !shown.has(index));
        if (!wallsKept && ['doors', 'windows', 'mirrors'].includes(key) && kept.length) {
            throw new FloorPlanValidationError('wall_opening');
        }
        change[key] = [...kept, ...items[key].map((item, index) => {
            const original = item.haRoom === id ? records[recordIndex(item)] : null;
            const unchanged = wallsKept && original && same(previous?.items[key].find(candidate => candidate.id === item.id), item);
            item.haRoom = id;
            item.haIndex = kept.length + index;
            item.haRecord = original?.id ?? item.id;
            if (unchanged) return original.id ? original : { ...original, id: item.haRecord };
            if (key === 'furniture') {
                const { x, y } = toRoom(item);
                return {
                    ...original, id: original?.id ?? item.id, name: item.name, typeId: original?.typeId ?? item.kind,
                    x, y, width: millimetres(item.width), height: millimetres(item.depth),
                    rotationDeg: degrees(item.angle - house.rotationDeg),
                };
            }
            if (key === 'zones') {
                const parts = item.parts.map(part => part.map(([x, y]) => toRoom({ x, y })));
                const owner = items.sensors.find(sensor => sensor.id === item.sensorId);
                // The old sensor_id spelling is dropped; sensorId replaces it.
                const { sensor_id: _legacyOwner, ...zone } = original ?? {};
                if (!zoneOwnerIsAvailable(item.sensorId, new Set(items.sensors.map(sensor => sensor.id)))) {
                    throw new FloorPlanValidationError('zone_owner_outside_room', { room: room.name });
                }
                return {
                    ...zone, id: original?.id ?? item.id, name: item.name, type: item.type, points: parts[0], parts,
                    sensorId: owner ? sourceId(owner) : null,
                    ...(item.type === 'entry' ? { inDirection: item.direction ?? 'right' } : {}),
                };
            }
            return wallOpening(item, original, walls, toRoom, key === 'doors' ? undefined : millimetres(item.height), room.name);
        })];
    }

    if (!same(previous?.items.sensors, items.sensors) || previous?.room.height !== room.height) {
        const shown = new Set((previous?.items.sensors ?? []).map(sourceId));
        const kept = (record?.sensors ?? []).filter(source => !shown.has(source.id));
        change.sensors = [...kept, ...items.sensors.map(sensor => {
            const source = stored.get(sensor.haRoom)?.sensors?.find(candidate => candidate.id === sensor.haSource);
            // A saved calibration was measured with one device; another device
            // on the same source would make it silently wrong.
            if (source && record?.calibration?.enabled && record.calibration.sensorId === source.id
                && (source.deviceId ?? source.device_id ?? null) !== (sensor.haDevice ?? null)) {
                throw new FloorPlanValidationError('calibration_device', { room: record.name });
            }
            const { x, y } = toRoom(sensor);
            const rotation = degrees(sensor.angle - house.rotationDeg);
            const mount = plannerModels[sensor.model].mount;
            // A ceiling radar keeps its measured height while the ceiling stays the same.
            const height = sensor.mountHeight
                ?? (mount === 'ceiling' && previous?.room.height === room.height ? source?.height_m : null)
                ?? sensorMountHeight(sensor, room);
            const { device_id: _legacyDevice, ...rest } = source ?? {};
            return {
                ...rest, id: sourceId(sensor), deviceId: sensor.haDevice ?? null, x, y, rotation, mountingMode: mount,
                x_m: metres(x), y_m: metres(y), orientation_deg: rotation, heightMm: millimetres(height), height_m: height,
            };
        })];
        if (record?.calibration?.enabled && record.calibration.sensorId
            && !change.sensors.some(source => source.id === record.calibration.sensorId)) {
            throw new FloorPlanValidationError('calibration_sensor', { room: record.name });
        }
    }

    room.haRoom = id;
    room.haFrame ??= { x: room.x, y: room.y, angle: 0, visible: true };
    for (const sensor of items.sensors) {
        sensor.haRoom = id;
        sensor.haSource = sourceId(sensor);
    }
    return [change];
}
