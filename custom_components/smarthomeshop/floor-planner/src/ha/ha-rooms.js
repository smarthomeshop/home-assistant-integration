// Home Assistant rooms as floor planner projects.
//
// The integration stores rooms the way the Room Designer edits them: walls,
// openings and furniture in millimetres, relative to the room, each room placed
// in the house by Live Home. The floor planner works in metres on one shared
// floor. This module turns the stored rooms into a project for the editor and
// for the Lovelace card, and keeps enough of the original records on every item
// (haRoom, haIndex, haRecord, haSource) to write changes back.
import { outlineBounds } from '../js/floor-planner-geometry.mjs';
import { furnitureCatalog } from '../js/floor-planner-furniture.mjs';
import { blankPlan, contains, devices as plannerModels, radarsFor, roomForDevice, zoneTypes } from '../js/floor-planner-model.mjs';
import { buildingFormat, roomContents, validProject } from '../js/floor-planner-building.mjs';
import { zoneOwnerIsAvailable } from './safety.js';
import {
    autoArrangeRooms, boundsForPoints, normaliseHousePlacement, roomBounds, roomPolygon, transformHomePoint,
} from '../../../panel/src/utils/whole-home.ts';
import { getFurnitureById } from '../../../panel/src/utils/furniture-catalog.ts';

export const defaultProjectName = 'My home';

const finite = value => typeof value === 'number' && Number.isFinite(value);
const finitePoint = value => value && finite(value.x) && finite(value.y);
const metres = millimetres => Number((millimetres / 1000).toFixed(7));
const degrees = value => (value % 360 + 360) % 360;
const safeName = (value, fallback) => String(value || fallback).trim().slice(0, 48) || fallback;
// Live Home keeps a room's position in millimetres; the editor frame is metres.
const frameMetres = value => Math.round(value * 1000) / 1e6;

// Room Designer furniture types that have a different name in the planner.
const furnitureAliases = {
    table: 'dining', 'coffee-table': 'coffee', 'tv-stand': 'cabinet', bookshelf: 'shelves',
    'office-chair': 'chair', 'dining-chair': 'chair',
};

function plannerFurnitureKind(type) {
    if (Object.hasOwn(furnitureCatalog, type)) return type;
    if (typeof type !== 'string') return 'custom';
    if (type.startsWith('bed-')) return 'bed';
    if (type.startsWith('sofa-')) return 'sofa';
    if (type.startsWith('dining-table-')) return 'dining';
    return furnitureAliases[type] ?? 'custom';
}

const roomGap = 700;
// Rooms Live Home has not placed yet are lined up next to the placed ones, in
// rows of at most 80 m, so they stay inside the planner's 100 m drawing limit.
const maxRowWidth = 80000;

// Every room with a place in the house, the floor planner's way.
export function roomsInHouse(rooms) {
    const placed = new Map();
    rooms.filter(room => room.house).forEach(room => placed.set(room.id, { ...room, house: normaliseHousePlacement(room.house) }));
    const floors = new Set(rooms.map(room => normaliseHousePlacement(room.house).floor));
    for (const floor of floors) {
        const missing = rooms.filter(room => !room.house && normaliseHousePlacement(room.house).floor === floor);
        if (!missing.length) continue;
        const existing = [...placed.values()].filter(room => room.house.floor === floor);
        if (!existing.length) {
            autoArrangeRooms(missing).forEach(room => placed.set(room.id, room));
            continue;
        }
        const bounds = existing.map(room => boundsForPoints(roomPolygon(room).map(point => transformHomePoint(point, room.house))));
        const startX = Math.max(...bounds.map(box => box.maxX)) + roomGap;
        let x = startX;
        let y = Math.min(...bounds.map(box => box.minY));
        let rowHeight = 0;
        for (const room of missing) {
            const box = roomBounds(room);
            if (x > startX && x + box.width > maxRowWidth) {
                x = startX;
                y += rowHeight + roomGap;
                rowHeight = 0;
            }
            const house = normaliseHousePlacement({ x: x - box.minX, y: y - box.minY, floor, rotationDeg: 0, visible: true });
            placed.set(room.id, { ...room, house });
            x += box.width + roomGap;
            rowHeight = Math.max(rowHeight, box.height);
        }
    }
    return rooms.map(room => placed.get(room.id) || { ...room, house: normaliseHousePlacement(room.house) });
}

// Every stored room as planner geometry, in metres on its floor. Items keep
// their position in the original arrays in their id, so a save can find the
// record they came from.
export function roomViews(rooms, profiles = []) {
    const profileByDevice = new Map(profiles.map(({ device_id: id, profile }) => [id, profile]));
    const placed = roomsInHouse(rooms);
    const floors = [...new Set(placed.map(room => room.house.floor))].sort((a, b) => a - b);
    const views = placed.map((room, index) => {
        const id = 'ha-room-' + index;
        const toPlan = point => {
            const home = transformHomePoint(point, room.house);
            return { x: metres(home.x), y: metres(home.y) };
        };
        const outline = outlineBounds(roomPolygon(room).map(point => {
            const { x, y } = toPlan(point);
            return [x, y];
        }), { maxCorners: 100, minSpan: .01, maxSpan: Infinity, minArea: 1e-4 });
        const height = finite(room.ceilingHeightMm) ? metres(room.ceilingHeightMm) : 2.45;
        const floor = outline ? { id, name: room.name, ...outline, height } : null;

        const opening = item => {
            const wall = room.walls?.[item.wallIndex];
            if (!wall || !finite(item.position) || !finite(item.width)) return null;
            const start = { x: wall.x1, y: wall.y1 }, end = { x: wall.x2, y: wall.y2 };
            if (!finitePoint(start) || !finitePoint(end)) return null;
            const from = toPlan(start), to = toPlan(end);
            const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy);
            if (!length || item.width <= 0) return null;
            const width = Math.min(length, metres(item.width));
            const along = Math.max(0, Math.min(length - width, item.position * length - width / 2));
            return { roomId: id, x: from.x + dx / length * along, y: from.y + dy / length * along, width,
                angle: degrees(Math.atan2(dy, dx) * 180 / Math.PI), height: item.height > 0 ? metres(item.height) : null };
        };
        const doors = (room.doors ?? []).flatMap((door, index) => {
            const placedDoor = opening(door);
            return placedDoor ? [{ ...placedDoor, id: id + '-door-' + index }] : [];
        });
        const openings = (items, kind, base, height, extras = () => ({})) => (items ?? []).flatMap((item, index) => {
            const placedItem = opening(item);
            return placedItem ? [{ ...placedItem, id: id + '-' + kind + '-' + index, base, height: placedItem.height ?? height, ...extras(item) }] : [];
        });
        const windows = openings(room.windows, 'window', 1.15, 1.1);
        // Home Assistant stores the mirror reflection filter in millimetres.
        const mirrors = openings(room.mirrors, 'mirror', .3, 1.8, mirror => ({
            protectionEnabled: mirror.protectionEnabled === true,
            reflectionDepthM: finite(mirror.reflectionDepthMm) ? Math.max(.25, Math.min(6, mirror.reflectionDepthMm / 1000)) : 2,
        }));
        const furniture = (room.furniture ?? []).flatMap((item, index) => {
            if (!finitePoint(item)) return [];
            const type = item.typeId ?? item.type;
            const kind = plannerFurnitureKind(type);
            const model = furnitureCatalog[kind];
            const designer = getFurnitureById(type);
            return [{
                id: id + '-furniture-' + index, ...toPlan(item), kind, material: model.material,
                width: item.width > 0 ? metres(item.width) : model.width,
                // The Room Designer calls the depth of a piece its height on the floor plan.
                depth: item.height > 0 ? metres(item.height) : item.depth > 0 ? metres(item.depth) : model.depth,
                height: designer ? metres(designer.defaultHeight) : model.height,
                base: model.base,
                angle: degrees((item.rotationDeg ?? item.rotation ?? 0) + room.house.rotationDeg),
            }];
        });
        const sources = room.sensors?.length ? room.sensors : room.sensor ? [room.sensor] : [];
        const sensors = sources.flatMap((source, index) => {
            const position = { x: finite(source.x_m) ? source.x_m * 1000 : source.x, y: finite(source.y_m) ? source.y_m * 1000 : source.y };
            if (!finitePoint(position)) return [];
            const deviceId = source.deviceId ?? source.device_id ?? null;
            const profile = profileByDevice.get(deviceId);
            const mount = source.mountingMode ?? profile?.mounting_mode;
            const product = profile?.detected_product;
            const model = Object.hasOwn(plannerModels, product) && plannerModels[product].mount === mount ? product
                : mount === 'ceiling' ? 'ceilsense' : 'ultimatesensor';
            return [{
                id: id + '-sensor-' + index, ...toPlan(position), model,
                angle: degrees((source.orientation_deg ?? source.rotation ?? 0) + room.house.rotationDeg),
                radar: 'none',
                savedHeight: finite(source.height_m) ? source.height_m : finite(source.heightMm) ? metres(source.heightMm) : null,
                sourceId: source.id, deviceId, source,
            }];
        });
        const zones = (room.zones ?? []).map(zone => {
            const parts = [zone.points, ...(Array.isArray(zone.parts) ? zone.parts : [])].filter(part =>
                Array.isArray(part) && part.length >= (zone.type === 'entry' ? 2 : 3) && part.every(finitePoint));
            const unique = [...new Map(parts.map(part => [JSON.stringify(part.map(({ x, y }) => [x, y])), part])).values()];
            return { zone, parts: unique.map(part => part.map(toPlan)) };
        });
        const calibration = room.calibration;
        const calibrationOutline = calibration?.enabled && Array.isArray(calibration.corners)
            && calibration.corners.length === 4 && calibration.corners.every(finitePoint)
            ? calibration.corners.map(toPlan) : [];
        return { id, room, floor, doors, windows, mirrors, furniture, sensors, sources, zones, calibration, calibrationOutline };
    });
    return { rooms: placed, floors, views };
}

const normalisedProduct = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const radarProducts = new Set(['ceilsense', 'wallsense', 'ultimatesensor', 'ultimatesensormini']);
// Longest model names first, so "ultimatesensor-mini-v2" wins over "ultimatesensor".
const modelsByLength = Object.keys(plannerModels).sort((a, b) => b.length - a.length);

// The SmartHomeShop radars Home Assistant knows about, as the planner sees them.
export function homeAssistantRegistry(areas = [], floors = []) {
    const safe = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
    const normalizedFloors = (Array.isArray(floors) ? floors : []).flatMap(floor => {
        const id = safe(floor?.floor_id ?? floor?.id);
        const name = safe(floor?.name);
        return id && name ? [{ id, name, level: Number.isInteger(floor?.level) ? floor.level : null }] : [];
    });
    const floorIds = new Set(normalizedFloors.map(floor => floor.id));
    const normalizedAreas = (Array.isArray(areas) ? areas : []).flatMap(area => {
        const id = safe(area?.area_id ?? area?.id);
        const name = safe(area?.name);
        const rawFloor = safe(area?.floor_id ?? area?.floorId);
        return id && name ? [{
            id,
            name,
            // Keep the area-to-floor relation when the floor registry is not
            // available yet. If it is available, reject dangling floor ids.
            floorId: rawFloor && (!floorIds.size || floorIds.has(rawFloor)) ? rawFloor : null,
        }] : [];
    });
    return {
        areas: normalizedAreas.sort((a, b) => a.name.localeCompare(b.name)),
        floors: normalizedFloors.sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name)),
    };
}

export function plannerDevices(profiles, haDevices, areas = []) {
    const deviceById = new Map(haDevices.map(device => [device.id, device]));
    const areaById = new Map(areas.map(area => [area.id, area]));
    const profileById = new Map(profiles.map(entry => [entry.device_id, entry]));
    const ids = new Set([...profileById.keys(),
        ...haDevices.filter(device => radarProducts.has(normalisedProduct(device.product_type))).map(device => device.id)]);
    return [...ids].flatMap(id => {
        const device = deviceById.get(id);
        const entry = profileById.get(id);
        const profile = entry?.profile;
        if (device?.hidden) return [];
        const product = normalisedProduct(device?.product_type ?? profile?.detected_product);
        const modelName = normalisedProduct(device?.model ?? entry?.model);
        const mount = profile?.mounting_mode ?? (product === 'ceilsense' ? 'ceiling' : 'wall');
        const model = modelsByLength.find(name => modelName.startsWith(normalisedProduct(name)) && plannerModels[name].mount === mount)
            ?? modelsByLength.find(name => normalisedProduct(name) === product && plannerModels[name].mount === mount)
            ?? (mount === 'ceiling' ? 'ceilsense' : 'ultimatesensor');
        const radarModel = profile?.radar_model?.toLowerCase();
        const radar = (mount === 'ceiling' ? ['ld2412', 'ld2460', 'ld6002b', 'combined'] : ['ld2450', 'ld2460']).includes(radarModel)
            ? radarModel : 'none';
        const height = profile?.installation_height_m ?? profile?.mounting_height_mm / 1000;
        const areaId = device?.area_id || null;
        return [{
            id, name: device?.name || entry?.name || id, model, mount, radar,
            product: device?.model || device?.product_name || entry?.model || '',
            radarModel: radarModel === 'unknown' ? null : radarModel,
            areaId,
            floorId: areaById.get(areaId)?.floorId ?? null,
            mountHeight: mount === 'wall' && height >= .15 && height <= 6 ? height : undefined,
            online: device?.online,
            aliases: [entry?.entity_prefix, ...(entry?.aliases ?? [])].filter(Boolean),
        }];
    }).sort((a, b) => a.name.localeCompare(b.name));
}

// Older plans link a sensor by entity prefix or alias instead of device id.
export const findPlannerDevice = (devices, id) => id
    ? devices.find(device => device.id === id) ?? devices.find(device => device.aliases.includes(id))
    : undefined;

const emptyFloorPlan = () => ({ ...blankPlan(defaultProjectName), version: 3, furniture: [], zones: [], windows: [], mirrors: [] });

// The stored rooms as one planner project, a floor per Live Home level.
// A room that cannot be shown safely is left out and named in skippedRooms;
// it stays untouched in Home Assistant, because a save only rewrites rooms
// that are part of the project.
export function projectFromRooms(rooms, profiles, devices = []) {
    const layout = roomViews(rooms, profiles);
    const skippedRooms = [];
    const floors = (layout.floors.length ? layout.floors : [0]).map(level => ({
        id: `floor-${level < 0 ? 'b' + -level : level}`, level, name: null, plan: emptyFloorPlan(),
    }));
    for (const view of layout.views) {
        if (!view.floor) {
            skippedRooms.push(view.room?.name || view.room?.id || 'Room');
            continue;
        }
        const { room, id } = view;
        const { floor: level, x, y, rotationDeg, visible } = room.house;
        const plan = floors.find(floor => floor.level === level).plan;
        const lengths = Object.fromEntries(['rooms', 'doors', 'windows', 'mirrors', 'furniture', 'sensors', 'zones']
            .map(key => [key, plan[key].length]));
        try {
            plan.rooms.push({ ...view.floor, name: safeName(room.name, 'Room'), haRoom: room.id,
                ...(room.haAreaId ? { haAreaId: room.haAreaId } : {}),
                ...(room.haFloorId ? { haFloorId: room.haFloorId } : {}),
                haFrame: { x: frameMetres(x), y: frameMetres(y), angle: rotationDeg, visible } });
            for (const key of ['doors', 'windows', 'mirrors']) for (const item of view[key]) {
                const index = Number(item.id.split('-').at(-1));
                const record = room[key]?.[index];
                if (!record) continue;
                const { height, angle, width } = item;
                if ((key === 'doors' && (width < .5 || width > 2))
                    || (key !== 'doors' && (width < .1 || width > 8 || height < .1 || height > 6))) continue;
                // The planner draws a door from its hinge side; an inward door
                // in Home Assistant starts at the other end of the opening.
                const inward = key === 'doors' && record.openDirection === 'inward';
                const radians = angle * Math.PI / 180;
                plan[key].push({ ...item, haIndex: index, haRecord: record.id, haRoom: room.id,
                    angle: degrees(angle + (inward ? 180 : 0)),
                    x: item.x + (inward ? Math.cos(radians) * width : 0),
                    y: item.y + (inward ? Math.sin(radians) * width : 0) });
            }
            for (const item of view.furniture) {
                const index = Number(item.id.split('-').at(-1));
                plan.furniture.push({ ...item, name: safeName(room.furniture[index]?.name, 'Furniture'),
                    haIndex: index, haRecord: room.furniture[index]?.id, haRoom: room.id });
            }
            for (const sensor of view.sensors) {
                const device = findPlannerDevice(devices, sensor.deviceId);
                const sameMount = device?.mount === plannerModels[sensor.model].mount;
                const model = sameMount ? device.model : sensor.model;
                const radar = sameMount ? device.radar : 'none';
                const { savedHeight, sourceId, deviceId, source, ...item } = sensor;
                plan.sensors.push({ ...item, model,
                    radar: deviceId || radarsFor(model).includes(radar) ? radar : radarsFor(model)[0],
                    haSource: sourceId, haRoom: room.id, haDevice: deviceId,
                    ...(plannerModels[sensor.model].mount === 'wall' && savedHeight >= .15 && savedHeight <= 6
                        ? { mountHeight: savedHeight } : {}) });
            }
            const roomSources = new Set(plan.sensors.filter(sensor => sensor.haRoom === room.id).map(sensor => sensor.haSource));
            for (const [index, { zone, parts }] of view.zones.entries()) {
                if (!zoneTypes.includes(zone.type)) continue;
                const owner = zone.sensorId || zone.sensor_id || null;
                // A zone that belongs to a radar this project does not have is left
                // out rather than widened to every radar in the room.
                if (!zoneOwnerIsAvailable(owner, roomSources)) continue;
                const sensor = plan.sensors.find(item => item.haRoom === room.id && item.haSource === owner);
                const item = {
                    id: `${id}-zone-${index}`, roomId: id, haRoom: room.id, haIndex: index, haRecord: zone.id,
                    name: safeName(zone.name, 'Zone'), type: zone.type, sensorId: owner ? sensor.id : null,
                    parts: parts.map(part => part.map(({ x: px, y: py }) => [px, py])),
                    ...(zone.type === 'entry' ? { direction: zone.inDirection === 'left' ? 'left' : 'right' } : {}),
                };
                if (validProject({ ...plan, zones: [item] })) plan.zones.push(item);
            }
            if (!validProject(plan)) throw new Error('unsafe room');
        } catch {
            for (const [key, length] of Object.entries(lengths)) plan[key].length = length;
            skippedRooms.push(room.name || room.id || 'Room');
        }
    }
    const project = { format: buildingFormat, version: 1, name: defaultProjectName, floors,
        activeFloor: (floors.find(floor => floor.level === 0) ?? floors[0]).id };
    if (!validProject(project)) throw new Error('A room exceeds the safe editor limits. Nothing was changed.');
    if (skippedRooms.length) Object.defineProperty(project, 'skippedRooms', { value: skippedRooms, enumerable: false });
    return project;
}

// A valid saved editor project can predate area/floor links. The canonical
// room records always win so registry changes made elsewhere cannot leave a
// stale link hidden in the editor document.
export function withHomeAssistantRegistryLinks(project, rooms) {
    const links = new Map(rooms.map(room => [room.id, room]));
    const update = plan => ({ ...plan, rooms: plan.rooms.map(room => {
        const record = links.get(room.haRoom ?? room.id);
        const { haAreaId: _oldArea, haFloorId: _oldFloor, ...plain } = room;
        return record ? {
            ...plain,
            ...(record.haAreaId ? { haAreaId: record.haAreaId } : {}),
            ...(record.haFloorId ? { haFloorId: record.haFloorId } : {}),
        } : plain;
    }) });
    return project.floors
        ? { ...project, floors: project.floors.map(floor => ({ ...floor, plan: update(floor.plan) })) }
        : update(project);
}

// What belongs to one room. Items carry the Home Assistant room they came
// from, which wins over geometry where rooms touch.
export function haRoomContents(plan, room) {
    const contents = roomContents(plan, room);
    const owner = (item, fallback) => {
        const home = plan.rooms.find(candidate => item.haRoom && candidate.haRoom === item.haRoom);
        return home && contains(home, item) ? home : fallback();
    };
    contents.sensors = plan.sensors.filter(sensor => owner(sensor, () => roomForDevice(plan.rooms, sensor))?.id === room.id);
    contents.furniture = (plan.furniture ?? []).filter(item =>
        owner(item, () => plan.rooms.find(candidate => contains(candidate, item)))?.id === room.id);
    return contents;
}

// Live Home can hide rooms. Their contents go too, and so does a staircase
// that no longer has both its floors.
export function withoutHiddenRooms(project) {
    const floors = project.floors?.map(floor => {
        const hidden = new Set(floor.plan.rooms.filter(room => room.haFrame?.visible === false)
            .flatMap(room => Object.values(haRoomContents(floor.plan, room)).flat().map(item => item.id)));
        if (!hidden.size) return floor;
        return { ...floor, plan: Object.fromEntries(Object.entries(floor.plan).map(([key, value]) =>
            [key, Array.isArray(value) ? value.filter(item => !hidden.has(item.id)) : value])) };
    });
    if (!floors) return project;
    const visible = { ...project, floors };
    if (visible.staircase && !validProject(visible)) delete visible.staircase;
    return visible;
}
