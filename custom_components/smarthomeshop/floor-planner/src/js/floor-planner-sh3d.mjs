// Opens a Sweet Home 3D project (.sh3d). Such a file is a ZIP archive that
// holds the home and its models and textures. Since Sweet Home 3D 5.3 the
// home is also written as Home.xml: lengths in centimetres, angles in
// radians, x to the right and y down the plan. Only Home.xml is read, so a
// large project with many textures opens quickly.
//
// Every level becomes a floor (levels at one height are one floor), every
// room a room, and doors, windows and furniture go along. A level with walls
// but no rooms gets its rooms from the spaces between those walls.
import { buildingFormat, maxFloors, validBuilding } from './floor-planner-building.mjs';
import { furnitureAt, furnitureCatalog, maxFurniture } from './floor-planner-furniture.mjs';
import { defaultWindowSill, maxRoomCorners, roomContains } from './floor-planner-geometry.mjs';
import { blankPlan, newId, validPlan } from './floor-planner-model.mjs';
import { openingsOnWalls, roomShape } from './floor-planner-recognise.mjs';
import { fewerCorners, traceFloorPlan } from './floor-planner-trace.mjs';

const failure = code => Object.assign(new Error(code), { code });

// Home.xml of a large home is a few megabytes; anything far beyond is no home.
const largestHome = 60_000_000;

/**
 * The bytes of the file with the given name inside a ZIP archive, which is a
 * Blob (or File). Null when the archive does not hold it. Only the parts of
 * the archive that are needed are read.
 */
export async function zipEntry(archive, name) {
    const size = archive.size;
    const tailStart = Math.max(0, size - 65_557);
    const tail = new DataView(await archive.slice(tailStart, size).arrayBuffer());
    let end = -1;
    for (let i = tail.byteLength - 22; i >= 0 && end < 0; i--) if (tail.getUint32(i, true) === 0x06054b50) end = i;
    if (end < 0) throw failure('zip');
    const count = tail.getUint16(end + 10, true);
    const length = tail.getUint32(end + 12, true), offset = tail.getUint32(end + 16, true);
    if (offset + length > size) throw failure('zip');
    const directory = new DataView(await archive.slice(offset, offset + length).arrayBuffer());
    const decoder = new TextDecoder();
    for (let at = 0, k = 0; k < count && at + 46 <= directory.byteLength; k++) {
        if (directory.getUint32(at, true) !== 0x02014b50) throw failure('zip');
        const method = directory.getUint16(at + 10, true);
        const packed = directory.getUint32(at + 20, true), unpacked = directory.getUint32(at + 24, true);
        const nameLength = directory.getUint16(at + 28, true);
        const skip = nameLength + directory.getUint16(at + 30, true) + directory.getUint16(at + 32, true);
        const local = directory.getUint32(at + 42, true);
        const entry = decoder.decode(new Uint8Array(directory.buffer, directory.byteOffset + at + 46, nameLength));
        at += 46 + skip;
        if (entry !== name) continue;
        if (unpacked > largestHome) throw failure('zip');
        const header = new DataView(await archive.slice(local, local + 30).arrayBuffer());
        if (header.byteLength < 30 || header.getUint32(0, true) !== 0x04034b50) throw failure('zip');
        const start = local + 30 + header.getUint16(26, true) + header.getUint16(28, true);
        const bytes = archive.slice(start, start + packed);
        if (method === 0) return new Uint8Array(await bytes.arrayBuffer());
        if (method !== 8) throw failure('zip');
        return new Uint8Array(await new Response(bytes.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    }
    return null;
}

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unescape = value => value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code) => code[0] !== '#' ? entities[code] ?? match
    : String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))));

/**
 * The elements of an XML document as { name, attributes, children }, under a
 * root named #document. Text, comments and declarations are left out: a
 * Sweet Home 3D home keeps everything in attributes.
 */
export function parseXml(source) {
    const root = { name: '#document', attributes: {}, children: [] };
    const stack = [root];
    const cleaned = source.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/g, '');
    for (const [, closing, name, rest, selfClosing] of cleaned.matchAll(/<(\/?)([A-Za-z_][\w.:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
        if (closing) {
            if (stack.length > 1 && stack.at(-1).name === name) stack.pop();
            continue;
        }
        const attributes = {};
        for (const [, key, , double, single] of rest.matchAll(/([\w.:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attributes[key] = unescape(double ?? single);
        const element = { name, attributes, children: [] };
        stack.at(-1).children.push(element);
        if (!selfClosing) stack.push(element);
    }
    return root;
}

const number = value => {
    const parsed = typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
};
// Centimetres to metres, and metres to the millimetre.
const metres = value => Math.round(value * 10) / 1000;
const millimetres = value => Math.round(value * 1000) / 1000;
const degrees = radians => Math.round(((radians * 180 / Math.PI) % 360 + 360) % 360 * 100) / 100 % 360;
const clamp = (value, least, most) => Math.min(most, Math.max(least, value));
const named = (value, length) => typeof value === 'string' && value.trim() ? value.trim().slice(0, length) : null;

// What a piece of furniture is, by its name or catalogue id in the languages
// Sweet Home 3D speaks most. The first match wins.
const furnitureKinds = [
    [null, /light|lamp|lampe|lámpara|lampada|stair|trap\b|trappe|treppe|escalier|escalera|scala/],
    ['corner', /corner ?(sofa|couch)|hoekbank|ecksofa|canapé d.angle|sofá (esquinero|rinconera)/],
    ['armchair', /arm ?chair|fauteuil|sessel|sillón|butaca|poltrona/],
    ['sofa', /sofa|couch|\bbank\b|canapé|sofá|divano/],
    ['nightstand', /night ?(stand|table)|bedside|nachtkast|nachttisch|chevet|mesita|comodino/],
    ['coffee', /coffee|low ?table|salontafel|couchtisch|table basse|mesa (de centro|baja)|tavolino/],
    ['desk', /desk|bureau|schreibtisch|escritorio|scrivania/],
    ['dining', /table|tafel|tisch|mesa|tavolo/],
    ['chair', /chair|stool|stoel|kruk|stuhl|hocker|chaise|tabouret|silla|taburete|sedia|sgabello/],
    ['bath', /bath ?tub|\bbath\b|ligbad|badewanne|baignoire|bañera|vasca/],
    ['glass', /shower|douche|dusche|ducha|doccia/],
    ['cabinet', /wash ?basin|\bsink\b|lavabo|wastafel|waschbecken|évier|fregadero|lavello|toilet|\bwc\b|cabinet|cupboard|dresser|sideboard|\bkast\b|schrank|commode|meuble|mueble|kitchen|keuken|küche|cuisine|cocina|cucina|counter|aanrecht/],
    ['bed', /\bbed\b|bed\d|\bbett\b|\blit\b|\bcama\b|letto/],
    ['wardrobe', /wardrobe|closet|kledingkast|kleiderschrank|armoire|armario|armadio/],
    ['shelves', /shel(f|ves)|book ?case|boekenkast|regal|étagère|bibliothèque|estanter|librer|scaffale/],
    ['fridge', /fridge|refrigerator|koelkast|kühlschrank|réfrigérateur|frigo|nevera|frigorifero/],
    ['washer', /washing|washer|dryer|wasmachine|droger|waschmaschine|trockner|lave-linge|sèche-linge|lavadora|secadora|lavatrice/],
    ['island', /island|kookeiland|kochinsel|îlot|isla|isola/],
    ['tv', /\btv\b|television|televisie|fernseher|télé|televisor|televisore/],
    ['plant', /plant|pflanze|plante|planta|pianta/],
    ['rug', /\brug\b|carpet|tapijt|vloerkleed|teppich|tapis|alfombra|tappeto/],
    ['curtain', /curtain|gordijn|vorhang|rideau|cortina|tenda/],
    ['radiator', /radiator|heizkörper|radiateur|radiador|termosifone/],
    ['heater', /heater|stove|fireplace|kachel|haard|kamin|ofen|cheminée|poêle|chimenea|estufa|camino|stufa/],
    ['fan', /\bfan\b|ventilator|ventilateur|ventilador|ventilatore/],
    ['screen', /screen|monitor|scherm|bildschirm|écran|pantalla|schermo/],
];

function furnitureKind(piece) {
    const words = `${piece.attributes.name ?? ''} ${(piece.attributes.catalogId ?? '').replace(/([a-z])([A-Z])/g, '$1 $2')}`.toLowerCase();
    const found = furnitureKinds.find(([, pattern]) => pattern.test(words));
    return found ? found[0] : 'custom';
}

// A door when it stands on the floor; a window when it has a sill, or is
// called one and sits off the floor.
const isWindow = (piece, base) => base >= .3
    || (base > .05 && /window|raam|fenster|fenêtre|ventana|finestra|janela/i.test(`${piece.attributes.name ?? ''} ${piece.attributes.catalogId ?? ''}`));

// The pieces of a home, with those inside groups, each with its level.
function pieces(elements, level = null) {
    return elements.flatMap(element => {
        const own = element.attributes.level ?? level;
        if (element.name === 'furnitureGroup') return pieces(element.children, own);
        if (['pieceOfFurniture', 'doorOrWindow', 'light'].includes(element.name)) return [{ element, level: own }];
        return [];
    });
}

// The centre line of a wall in metres, a few points along it when it is an arc.
function wallLine({ a, b, arc }) {
    if (!arc || Math.abs(arc) < 1e-3) return [a, b];
    const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const radius = chord / (2 * Math.sin(Math.abs(arc) / 2));
    const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const normal = [-(b[1] - a[1]) / chord, (b[0] - a[0]) / chord];
    const reach = radius * Math.cos(arc / 2) * Math.sign(arc);
    const centre = [middle[0] + normal[0] * reach, middle[1] + normal[1] * reach];
    const from = Math.atan2(a[1] - centre[1], a[0] - centre[0]);
    const steps = Math.max(2, Math.ceil(Math.abs(arc) / (Math.PI / 12)));
    return Array.from({ length: steps + 1 }, (_, i) => {
        const angle = from - arc * i / steps;
        return [centre[0] + radius * Math.cos(angle), centre[1] + radius * Math.sin(angle)];
    });
}

// Rooms for a level that has walls but no rooms: the walls are drawn as a
// picture and the spaces between them traced, as on an uploaded plan.
function roomsBetweenWalls(walls) {
    const lines = walls.map(wall => ({ ...wall, line: wallLine(wall) }));
    const xs = lines.flatMap(wall => wall.line.map(([x]) => x)), ys = lines.flatMap(wall => wall.line.map(([, y]) => y));
    const left = Math.min(...xs) - 1, top = Math.min(...ys) - 1;
    const across = Math.max(...xs) + 1 - left, down = Math.max(...ys) + 1 - top;
    if (!(across > 2 && down > 2 && across < 200 && down < 200)) return [];
    const perMetre = clamp(Math.sqrt(3_000_000 / (across * down)), 10, 50);
    const width = Math.ceil(across * perMetre), height = Math.ceil(down * perMetre);
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const fill = corners => {
        const points = corners.map(([x, y]) => [(x - left) * perMetre, (y - top) * perMetre]);
        const rows = points.map(([, y]) => y);
        for (let y = Math.max(0, Math.floor(Math.min(...rows))); y <= Math.min(height - 1, Math.ceil(Math.max(...rows))); y++) {
            const centre = y + .5, crossings = [];
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const [xi, yi] = points[i], [xj, yj] = points[j];
                if ((yi > centre) !== (yj > centre)) crossings.push(xi + (centre - yi) * (xj - xi) / (yj - yi));
            }
            crossings.sort((p, q) => p - q);
            for (let k = 0; k + 1 < crossings.length; k += 2) {
                for (let x = Math.max(0, Math.round(crossings[k])); x < Math.min(width, Math.round(crossings[k + 1])); x++) data.fill(0, (y * width + x) * 4, (y * width + x) * 4 + 3);
            }
        }
    };
    for (const wall of lines) {
        const half = Math.max(wall.thickness, 2 / perMetre) / 2;
        for (let i = 0; i + 1 < wall.line.length; i++) {
            const [a, b] = [wall.line[i], wall.line[i + 1]];
            const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
            if (length < 1e-6) continue;
            // A little longer at both ends, so walls that meet close their corner.
            const [ux, uy] = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
            const [nx, ny] = [-uy * half, ux * half];
            const [ex, ey] = [ux * half, uy * half];
            fill([[a[0] - ex + nx, a[1] - ey + ny], [b[0] + ex + nx, b[1] + ey + ny], [b[0] + ex - nx, b[1] + ey - ny], [a[0] - ex - nx, a[1] - ey - ny]]);
        }
    }
    const traced = traceFloorPlan({ data, width, height }, width / perMetre);
    return traced ? traced.rooms.map(room => room.points.map(([u, v]) => [left + u * width / perMetre, top + v * height / perMetre])) : [];
}

// A room's shape with its sizes to the millimetre.
const tidyShape = shape => shape && Object.fromEntries(Object.entries(shape).map(([key, value]) =>
    [key, key === 'outline' ? value.map(([x, y]) => [millimetres(x), millimetres(y)]) : millimetres(value)]));

// A room outline within the planner's number of corners.
function withinCorners(points) {
    let fewer = points;
    for (let tolerance = .03; fewer.length > maxRoomCorners && tolerance < 1; tolerance *= 1.5) fewer = fewerCorners(fewer, tolerance);
    return fewer.length <= maxRoomCorners ? fewer : null;
}

/**
 * The plan of a Sweet Home 3D home, from the text of its Home.xml. Returns
 * { project, review }: the project is one plan or, with more than one floor,
 * a building; review says some items were left out. Throws when the home
 * holds nothing to plan with.
 */
export function homeFromXml(source, copy, fileName = '') {
    const home = parseXml(source).children.find(element => element.name === 'home');
    if (!home) throw failure('sh3d');
    let review = false;
    const all = home.children;
    const by = name => all.filter(element => element.name === name);
    const wallHeight = (number(home.attributes.wallHeight) ?? 250) / 100;

    // Levels at one elevation are one floor.
    const levels = by('level').map(level => ({ id: level.attributes.id, name: level.attributes.name,
        elevation: number(level.attributes.elevation) ?? 0, height: number(level.attributes.height),
        index: number(level.attributes.elevationIndex) ?? 0 })).sort((a, b) => a.elevation - b.elevation || a.index - b.index);
    const groups = [];
    for (const level of levels) {
        const group = groups.find(other => Math.abs(other.elevation - level.elevation) < 1);
        if (group) group.levels.push(level);
        else groups.push({ elevation: level.elevation, levels: [level] });
    }
    if (!groups.length) groups.push({ elevation: 0, levels: [{ id: null, name: null, height: null }] });
    const floorOf = new Map(groups.flatMap((group, index) => group.levels.map(level => [level.id, index])));
    const floorIndex = levelId => floorOf.get(levelId ?? null) ?? floorOf.get(levels[0]?.id) ?? 0;

    // Everything in metres, moved so the home starts at the top left of the plan.
    const point = element => [number(element.attributes.x), number(element.attributes.y)];
    const rooms = by('room').map(room => ({ element: room, points: room.children.filter(child => child.name === 'point').map(point) }))
        .filter(room => room.points.length >= 3 && room.points.every(([x, y]) => x !== null && y !== null));
    const walls = by('wall').map(wall => {
        const [xStart, yStart, xEnd, yEnd] = ['xStart', 'yStart', 'xEnd', 'yEnd'].map(key => number(wall.attributes[key]));
        return { level: wall.attributes.level, a: [xStart, yStart], b: [xEnd, yEnd],
            thickness: (number(wall.attributes.thickness) ?? 10) / 100, arc: number(wall.attributes.arcExtent) };
    }).filter(wall => [...wall.a, ...wall.b].every(value => value !== null) && (wall.a[0] !== wall.b[0] || wall.a[1] !== wall.b[1]));
    const xs = [...rooms.flatMap(room => room.points.map(([x]) => x)), ...walls.flatMap(wall => [wall.a[0], wall.b[0]])];
    const ys = [...rooms.flatMap(room => room.points.map(([, y]) => y)), ...walls.flatMap(wall => [wall.a[1], wall.b[1]])];
    if (!xs.length) throw failure('sh3d_empty');
    const left = Math.min(...xs), top = Math.min(...ys);
    const place = ([x, y]) => [metres(x - left), metres(y - top)];
    for (const wall of walls) Object.assign(wall, { a: place(wall.a), b: place(wall.b) });

    const floors = groups.map((group, index) => {
        const height = clamp((group.levels.find(level => level.height)?.height ?? wallHeight * 100) / 100, 1, 12);
        return { index, height, plan: { ...blankPlan(copy.import_room_name), version: 3,
            furniture: [], windows: [], mirrors: [], zones: [] } };
    });
    const valid = (plan, change) => validPlan({ ...plan, ...change });

    for (const room of rooms) {
        const floor = floors[floorIndex(room.element.attributes.level)];
        const outline = withinCorners(room.points.map(place));
        const shape = outline && tidyShape(roomShape(outline));
        const name = named(room.element.attributes.name, 48) ?? `${copy.room} ${floor.plan.rooms.length + 1}`;
        const item = shape && { ...shape, id: newId(), name, height: floor.height };
        if (item && floor.plan.rooms.length < 80 && valid(floor.plan, { rooms: [...floor.plan.rooms, item] })) floor.plan.rooms.push(item);
        else review = true;
    }
    for (const floor of floors) {
        const own = walls.filter(wall => floorIndex(wall.level) === floor.index);
        if (floor.plan.rooms.length || !own.length) continue;
        for (const outline of roomsBetweenWalls(own)) {
            const shape = tidyShape(roomShape(outline.map(([x, y]) => [millimetres(x), millimetres(y)])));
            const item = shape && { ...shape, id: newId(), name: `${copy.room} ${floor.plan.rooms.length + 1}`, height: floor.height };
            if (item && valid(floor.plan, { rooms: [...floor.plan.rooms, item] })) floor.plan.rooms.push(item);
        }
    }
    // A wall that stands inside a room, not between rooms, stays a wall.
    for (const wall of walls) {
        const floor = floors[floorIndex(wall.level)];
        const samples = [.1, .3, .5, .7, .9].map(t => ({ x: wall.a[0] + (wall.b[0] - wall.a[0]) * t, y: wall.a[1] + (wall.b[1] - wall.a[1]) * t }));
        const inside = floor.plan.rooms.find(room => samples.filter(sample => roomContains(room, sample, false)).length >= 4);
        const item = { id: newId(), x: wall.a[0], y: wall.a[1], endX: wall.b[0], endY: wall.b[1] };
        if (inside && !wall.arc && floor.plan.walls.length < 80 && valid(floor.plan, { walls: [...floor.plan.walls, item] })) floor.plan.walls.push(item);
    }

    for (const { element, level } of pieces(all)) {
        const attributes = element.attributes;
        if (element.name === 'light' || attributes.visible === 'false') continue;
        const floor = floors[floorIndex(level)];
        const [x, y] = [number(attributes.x), number(attributes.y)];
        const [width, depth, height] = ['width', 'depth', 'height'].map(key => (number(attributes[key]) ?? 0) / 100);
        if (x === null || y === null || width <= 0) {
            review = true;
            continue;
        }
        const angle = number(attributes.angle) ?? 0;
        const base = (number(attributes.elevation) ?? 0) / 100;
        const centre = place([x, y]);
        if (element.name === 'doorOrWindow' || attributes.doorOrWindow === 'true') {
            const along = [Math.cos(angle) * width / 2, Math.sin(angle) * width / 2];
            const span = { from: [centre[0] - along[0], centre[1] - along[1]], to: [centre[0] + along[0], centre[1] + along[1]] };
            if (isWindow(element, base)) {
                const [window] = openingsOnWalls(floor.plan.rooms, [span], { minimum: .1, maximum: 8, reach: .45,
                    extra: { base: clamp(base || defaultWindowSill, 0, 6), height: clamp(height || 1, .1, 6) } });
                if (window && floor.plan.windows.length < 80 && valid(floor.plan, { windows: [...floor.plan.windows, window] })) floor.plan.windows.push(window);
                else review = true;
            } else {
                const [door] = openingsOnWalls(floor.plan.rooms, [span], { minimum: .5, maximum: 2, reach: .45 });
                if (door && floor.plan.doors.length < 80 && valid(floor.plan, { doors: [...floor.plan.doors, door] })) floor.plan.doors.push(door);
                else review = true;
            }
            continue;
        }
        const kind = furnitureKind(element);
        if (!kind) continue;
        const spot = { x: centre[0], y: centre[1] };
        if (!floor.plan.rooms.some(room => roomContains(room, spot))) continue;
        const object = furnitureAt(kind, named(attributes.name, 48) ?? copy.furniture_items?.[kind] ?? kind, spot, degrees(angle));
        const item = { ...object, id: newId(), width: clamp(width, .02, 12), depth: clamp(depth || object.depth, .02, 12),
            height: clamp(height || object.height, .01, 6), base: clamp(base, 0, 6) };
        if (floor.plan.furniture.length < maxFurniture && valid(floor.plan, { furniture: [...floor.plan.furniture, item] })) floor.plan.furniture.push(item);
        else review = true;
    }

    // The floors with rooms, numbered on from the ground floor: the lowest
    // that is not below the ground. A level without rooms, such as the
    // terrain, leaves no gap.
    const kept = floors.filter(floor => floor.plan.rooms.length);
    if (!kept.length) throw failure('sh3d_empty');
    const ground = Math.max(0, kept.findIndex(floor => groups[floor.index].elevation >= -10));
    const lowest = Math.max(0, ground - 5);
    const chosen = kept.slice(lowest, lowest + maxFloors);
    if (chosen.length < kept.length) review = true;
    // Sweet Home 3D names a home after the path it was saved to: keep the file name.
    const fileTitle = value => typeof value === 'string' ? value.split(/[\\/]/).pop().replace(/\.sh3d$/i, '') : null;
    const name = named(fileTitle(fileName), 48) ?? named(fileTitle(home.attributes.name), 48) ?? copy.import_room_name;
    const results = chosen.map((floor, index) => ({ id: newId(), level: lowest + index - ground,
        name: named(groups[floor.index].levels.find(level => named(level.name, 32))?.name, 32), plan: { ...floor.plan, name } }));
    const project = { format: buildingFormat, version: 1, name, floors: results,
        activeFloor: (results.find(floor => floor.level === 0) ?? results[0]).id };
    if (!validBuilding(project)) throw failure('sh3d');
    return { project: results.length === 1 && results[0].level === 0 ? results[0].plan : project, review };
}

/** Whether a file is a Sweet Home 3D project, by its name or as a ZIP archive. */
export async function isSweetHome(file) {
    if (/\.sh3d$/i.test(file?.name ?? '')) return true;
    const start = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    return start[0] === 0x50 && start[1] === 0x4b && start[2] === 3 && start[3] === 4;
}

/**
 * The plan of a Sweet Home 3D file (a File or Blob). Fails with the code
 * sh3d_old for a project saved before Sweet Home 3D 5.3, which only holds
 * the home in a form that cannot be read here.
 */
export async function importSweetHome(file, copy) {
    const xml = await zipEntry(file, 'Home.xml');
    if (!xml) {
        if (await zipEntry(file, 'Home')) throw failure('sh3d_old');
        throw failure('sh3d');
    }
    return homeFromXml(new TextDecoder().decode(xml), copy, file.name ?? '');
}
