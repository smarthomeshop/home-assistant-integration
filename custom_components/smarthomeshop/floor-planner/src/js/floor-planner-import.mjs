import { buildingFormat, maxFloors, validBuilding } from './floor-planner-building.mjs';
import { furnitureAt, furnitureCatalog } from './floor-planner-furniture.mjs';
import { defaultWindowSill, outlineBounds } from './floor-planner-geometry.mjs';
import { blankPlan, newId, validPlan, zoneTypes } from './floor-planner-model.mjs';
import { parseAppleRoomPlan } from './floor-planner-roomplan.mjs';

const degrees = value => ((value % 360) + 360) % 360;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const point = value => value && finite(value.x) && finite(value.y);
const array = value => Array.isArray(value) ? value : [];
const meters = value => Number((value / 1000).toFixed(6));
const safeName = (value, fallback) => typeof value === 'string' && value.trim() ? value.trim().slice(0, 48) : fallback;
const furnitureTypes = { table: 'dining', 'dining-table-4': 'dining', 'dining-table-6': 'dining',
    'coffee-table': 'coffee', 'dining-chair': 'chair', 'office-chair': 'chair', bookshelf: 'shelves', 'tv-stand': 'cabinet' };
const firstKind = type => Object.hasOwn(furnitureCatalog, type) ? type : (Object.hasOwn(furnitureTypes, type) ? furnitureTypes[type] : null)
    ?? (typeof type === 'string' && type.startsWith('bed-') ? 'bed'
        : typeof type === 'string' && type.startsWith('sofa-') ? 'sofa' : 'custom');

function homeRooms(data) {
    if (data?.format === 'smarthomeshop-room' && data.schemaVersion === 1) return [data.room];
    if (data?.key === 'smarthomeshop.rooms' && data.data?.rooms && typeof data.data.rooms === 'object') return Object.values(data.data.rooms);
    if (Array.isArray(data?.walls) && data.walls.length >= 3 && data.walls.every(wall => finite(wall?.x1) && finite(wall?.y1))) return [data];
    return null;
}

export function importRoomGeometry(data, copy) {
    const backup = homeRooms(data);
    const scan = backup ? null : parseAppleRoomPlan(data, copy.room);
    const source = backup ?? scan.rooms;
    if (!source.length || source.length > 80 * maxFloors) throw new Error('Invalid room count');
    const name = copy[backup ? 'import_room_name' : 'import_lidar_name'];
    const floors = new Map();
    let review = Boolean(backup || scan?.warnings.length);

    for (const raw of source) {
        const walls = array(raw?.walls);
        if (walls.length < 3 || walls.some(wall => !finite(wall?.x1) || !finite(wall?.y1))) throw new Error('Invalid room contour');
        const placement = raw.house;
        const placed = placement && finite(placement.x) && finite(placement.y);
        const level = Number.isInteger(placement?.floor) ? placement.floor : 0;
        const rotation = finite(placement?.rotationDeg) ? placement.rotationDeg : 0;
        if (!floors.has(level)) floors.set(level, { id: newId(), level, name: null,
            plan: { ...blankPlan(name), version: 3, furniture: [], windows: [], mirrors: [], zones: [] } });
        const plan = floors.get(level).plan;
        const radians = rotation * Math.PI / 180;
        const xs = walls.map(wall => wall.x1), ys = walls.map(wall => wall.y1);
        const offsetX = placed ? placement.x : (plan.rooms.length ? Math.max(...plan.rooms.map(room => room.x + room.width)) * 1000 + 750 : 0) - Math.min(...xs);
        const offsetY = placed ? placement.y : -Math.min(...ys);
        const convert = ({ x, y }) => [meters(offsetX + x * Math.cos(radians) - y * Math.sin(radians)),
            meters(offsetY + x * Math.sin(radians) + y * Math.cos(radians))];
        const corners = walls.map(wall => convert({ x: wall.x1, y: wall.y1 }));
        const geometry = outlineBounds(corners);
        if (!geometry) throw new Error('Invalid room shape');
        const room = { ...geometry, id: newId(), name: safeName(raw.name, copy.room), height: 2.7 };
        plan.rooms.push(room);

        for (const type of ['doors', 'windows', 'mirrors']) for (const item of array(raw[type])) {
            const a = corners[item?.wallIndex], b = corners[(item?.wallIndex + 1) % corners.length];
            if (!a || !b || !finite(item.position) || !finite(item.width)) { review = true; continue; }
            const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
            const width = Math.min(type === 'doors' ? 2 : 8, meters(item.width), length);
            if (width < (type === 'doors' ? .5 : .1)) { review = true; continue; }
            const start = Math.max(0, Math.min(length - width, item.position * length - width / 2));
            const reverse = type === 'doors' && item.openDirection === 'inward';
            const t = (start + (reverse ? width : 0)) / length;
            const position = { id: newId(), roomId: room.id, width, angle: degrees(Math.atan2(dy, dx) * 180 / Math.PI + (reverse ? 180 : 0)),
                x: a[0] + dx * t, y: a[1] + dy * t };
            if (type === 'doors') plan.doors.push(position);
            else plan[type].push({ ...position, base: type === 'windows' ? defaultWindowSill : .5,
                height: finite(item.height) ? Math.max(.1, Math.min(6, meters(item.height))) : 1 });
        }
        for (const item of array(raw.furniture)) {
            if (!point(item)) { review = true; continue; }
            const kind = firstKind(item.typeId ?? item.type);
            const [x, y] = convert(item);
            const angle = degrees(rotation + (finite(item.rotationDeg) ? item.rotationDeg : finite(item.rotation) ? item.rotation : 0));
            const object = furnitureAt(kind, safeName(item.name, copy.furniture_items[kind]), { x, y }, angle);
            const size = value => finite(value) && value >= 20 && value <= 12000 ? meters(value) : null;
            plan.furniture.push({ ...object, id: newId(), width: size(item.width) ?? object.width,
                depth: size(item.height) ?? size(item.depth) ?? object.depth });
        }
        for (const zone of array(raw.zones)) {
            if (!zoneTypes.includes(zone?.type)) { review = true; continue; }
            if (zone.sensorId || zone.sensor_id) {
                // Geometry imports deliberately do not carry Home Assistant sensor links.
                // Dropping a source-owned zone is safer than silently turning it into a
                // shared zone that suppresses every radar in the imported room.
                review = true;
                continue;
            }
            const unique = [...new Set([zone.points, ...array(zone.parts)].filter(part => Array.isArray(part) && part.every(point))
                .map(part => JSON.stringify(part.map(convert))))].map(value => JSON.parse(value));
            const imported = { id: newId(), roomId: room.id, type: zone.type, parts: unique, name: safeName(zone.name, copy['zone_' + zone.type]),
                ...(zone.type === 'entry' ? { direction: zone.inDirection === 'left' ? 'left' : 'right' } : {}) };
            if (validPlan({ ...plan, zones: [imported] })) plan.zones.push(imported);
            else review = true;
        }
    }
    const results = [...floors.values()].sort((a, b) => a.level - b.level);
    const project = { format: buildingFormat, version: 1, name, floors: results,
        activeFloor: (results.find(floor => floor.level === 0) ?? results[0]).id };
    if (!validBuilding(project)) throw new Error('Invalid imported plan');
    return { project: results.length === 1 && results[0].level === 0 ? results[0].plan : project, backup: Boolean(backup), review };
}
