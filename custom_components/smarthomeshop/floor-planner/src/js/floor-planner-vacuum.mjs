// The map a robot vacuum drew of a home, as rooms for the planner.
//
// Such a map has no walls drawn as a plan has them: its rooms are areas of
// one flat colour each. traceColourMap finds those areas on any image of such
// a map, when the image has its scale.
//
// A Valetudo robot goes further and puts the map itself in the picture it
// hands to Home Assistant, in a text chunk of the PNG: every room with its
// name, on a grid of known size. embeddedMap reads that chunk and mapRooms
// turns it into rooms and a drawing of the map, to scale, with nothing to
// click or trace.
//
// Both answer in the shape of a recognition (see floor-planner-recognise.mjs):
// image coordinates from 0 to 1, x across and y down.
import { recognitionLimits } from './floor-planner-recognise.mjs';
import { areas, distances, fewerCorners, roomEdge, spread, traceLimits } from './floor-planner-trace.mjs';

// Sizes in metres, as in floor-planner-trace.mjs.
const sizes = {
    // Lines over a room (the path the robot drove) up to twice this wide are closed.
    line: .03,
    narrowestRoom: .6,
    smallestRoom: 1.2,
    outline: .08,
    roughOutline: .3,
    notch: .2,
};

// Colours are compared in steps of 8. Two this many steps apart or less are
// the same colour: a saved image never keeps a colour exactly.
const sameColour = 2;
const mostColours = 32;

/**
 * The rooms on an image of a map whose rooms are areas of one colour each.
 *
 * image is { data, width, height } with RGBA pixels and metresAcross the real
 * width of the image. Returns what traceFloorPlan returns, without doors or
 * windows, or null when the image cannot be used. What reaches the edge of
 * the image is the background, and so is everything in its colour.
 */
export function traceColourMap(image, metresAcross) {
    const { data, width, height } = image ?? {};
    if (!data || !Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16
        || width * height > traceLimits.pixels || data.length < width * height * 4) return null;
    if (!Number.isFinite(metresAcross) || metresAcross <= 0) return null;
    const px = metres => metres * width / metresAcross;
    const count = width * height;

    // Every pixel's colour in steps of 8, and how often each occurs.
    const keys = new Uint16Array(count);
    const tally = new Uint32Array(1 << 15);
    for (let i = 0, p = 0; i < count; i++, p += 4) {
        const clear = data[p + 3] < 128;
        keys[i] = clear ? 0x7fff : (data[p] >> 3) << 10 | (data[p + 1] >> 3) << 5 | data[p + 2] >> 3;
        tally[keys[i]]++;
    }
    // The colours that fill an area, most common first. A colour close to one
    // of them counts as that one.
    const least = Math.max(16, px(1) * px(.2));
    const common = [];
    tally.forEach((seen, key) => {
        if (seen >= least / 4) common.push(key);
    });
    common.sort((one, two) => tally[two] - tally[one]);
    const parts = key => [key >> 10, key >> 5 & 31, key & 31];
    const apart = (one, two) => Math.max(...parts(one).map((part, k) => Math.abs(part - parts(two)[k])));
    const colours = [];
    const colourOf = new Int16Array(1 << 15).fill(-1);
    for (const key of common) {
        let index = colours.findIndex(colour => apart(colour, key) <= sameColour);
        if (index < 0 && tally[key] >= least && colours.length < mostColours) index = colours.push(key) - 1;
        colourOf[key] = index;
    }
    if (!colours.length) return null;

    // The background is the colour most of the edge of the image has.
    const onEdge = new Uint32Array(colours.length);
    const edge = i => {
        if (colourOf[keys[i]] >= 0) onEdge[colourOf[keys[i]]]++;
    };
    for (let x = 0; x < width; x++) {
        edge(x);
        edge((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
        edge(y * width);
        edge(y * width + width - 1);
    }
    const background = onEdge.indexOf(Math.max(...onEdge));

    const labels = new Uint16Array(count);
    const found = [];
    const close = Math.max(1, Math.round(px(sizes.line)));
    const tolerance = Math.max(1.5, px(sizes.outline));
    colours.forEach((_, colour) => {
        if (colour === background) return;
        const mask = new Uint8Array(count);
        let size = 0;
        for (let i = 0; i < count; i++) {
            if (colourOf[keys[i]] === colour) size += mask[i] = 1;
        }
        // Too little of this colour for a room.
        if (size < .8 * px(1) * px(sizes.smallestRoom)) return;
        // Thin lines drawn over the colour are part of it.
        const whole = spread(spread(mask, width, height, close, false), width, height, close, true);
        const blocked = new Uint8Array(count);
        for (let i = 0; i < count; i++) blocked[i] = whole[i] ? 0 : 1;
        const spaces = areas(blocked, width, height, distances(blocked, width, height));
        for (const area of spaces.found) {
            if (!area || area.edge || area.size < px(1) * px(sizes.smallestRoom) || area.depth < px(sizes.narrowestRoom / 2)) continue;
            let points = fewerCorners(roomEdge(spaces.labels, width, height, area, Math.round(px(sizes.notch))), tolerance);
            for (let wider = tolerance * 1.4; points.length > traceLimits.corners && wider <= px(sizes.roughOutline); wider *= 1.4) {
                points = fewerCorners(points, wider);
            }
            if (points.length < 3 || points.length > traceLimits.corners) continue;
            found.push({ area, points, spaces });
        }
    });
    found.sort((one, two) => two.area.size - one.area.size);
    const rooms = found.slice(0, traceLimits.rooms);
    rooms.forEach(({ area, spaces }, index) => {
        const [left, top, right, bottom] = area.box;
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) if (spaces.labels[y * width + x] === area.id) labels[y * width + x] = index + 1;
        }
    });
    const share = ([x, y]) => [Math.min(1, Math.max(0, x / width)), Math.min(1, Math.max(0, y / height))];
    return { rooms: rooms.map(({ points }) => ({ points: points.map(share) })), doors: [], windows: [], labels, size: { width, height } };
}

const signature = [137, 80, 78, 71, 13, 10, 26, 10];
// The most a map may be once unpacked, so a crafted file cannot fill the memory.
const largestMap = 48_000_000;

async function unpacked(bytes) {
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > largestMap) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }
    const whole = new Uint8Array(size);
    let at = 0;
    for (const chunk of chunks) {
        whole.set(chunk, at);
        at += chunk.length;
    }
    return whole;
}

/**
 * The map inside a picture from a Valetudo robot: a PNG with a compressed
 * text chunk named ValetudoMap. bytes is the file as a Uint8Array. Resolves
 * to the map, or to null when the file holds none.
 */
export async function embeddedMap(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length < 20 || signature.some((byte, i) => bytes[i] !== byte)) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const name = 'ValetudoMap';
    for (let at = 8; at + 12 <= bytes.length;) {
        const length = view.getUint32(at);
        const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
        const start = at + 8;
        if (start + length > bytes.length) return null;
        // The name, a zero, the way it is packed (0), and the packed text.
        if (type === 'zTXt' && length > name.length + 2 && bytes[start + name.length] === 0 && bytes[start + name.length + 1] === 0
            && String.fromCharCode(...bytes.subarray(start, start + name.length)) === name) {
            try {
                const text = await unpacked(bytes.subarray(start + name.length + 2, start + length));
                const map = text && JSON.parse(new TextDecoder().decode(text));
                return map?.__class === 'ValetudoMap' && Array.isArray(map.layers) ? map : null;
            } catch {
                return null;
            }
        }
        if (type === 'IEND') return null;
        at = start + length + 4;
    }
    return null;
}

const tints = [[250, 215, 190], [200, 226, 244], [242, 204, 200], [205, 234, 214], [250, 234, 178], [226, 210, 240], [196, 232, 226], [250, 222, 160]];
// The largest map, in points of its grid, and how many of an image's pixels a point becomes.
const largestGrid = 2400;
const longestImage = 1600;

/**
 * The rooms of a robot's map, and a drawing of it.
 *
 * map is what embeddedMap resolves to. Returns
 * { recognition: { width_m, rooms: [{ name, points }] }, image: { data, width, height } }
 * with the image as RGBA pixels and the rooms on it, or null when the map
 * holds no floor. A room without a name is named roomName and a number.
 */
export function mapRooms(map, { roomName = 'Room' } = {}) {
    const grain = Number(map?.pixelSize);
    if (!Number.isFinite(grain) || grain < 1 || grain > 50 || !Array.isArray(map?.layers) || map.layers.length > 600) return null;
    // Every layer as rows of [x, y, count] on the map's grid.
    const layers = [];
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const layer of map.layers) {
        if (!['floor', 'wall', 'segment'].includes(layer?.type) || !Array.isArray(layer.compressedPixels)) continue;
        const runs = layer.compressedPixels;
        if (runs.length % 3 || runs.length > 3_000_000) return null;
        for (let i = 0; i < runs.length; i += 3) {
            const [x, y, length] = [runs[i], runs[i + 1], runs[i + 2]];
            if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(length) || x < 0 || y < 0 || length < 1 || x + length > 100_000 || y > 100_000) return null;
            left = Math.min(left, x);
            right = Math.max(right, x + length - 1);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
        if (runs.length) layers.push(layer);
    }
    if (!layers.length) return null;
    // Some room around the map, about 30 cm.
    const around = Math.max(2, Math.round(30 / grain));
    const across = right - left + 1 + 2 * around, down = bottom - top + 1 + 2 * around;
    if (across > largestGrid || down > largestGrid) return null;

    // What every point of the grid is: 1 floor, 2 wall, and from 3 a room.
    const cells = new Uint16Array(across * down);
    const segments = layers.filter(layer => layer.type === 'segment').slice(0, recognitionLimits.rooms);
    const fill = (layer, value) => {
        const runs = layer.compressedPixels;
        for (let i = 0; i < runs.length; i += 3) {
            const row = (runs[i + 1] - top + around) * across + runs[i] - left + around;
            cells.fill(value, row, row + runs[i + 2]);
        }
    };
    layers.filter(layer => layer.type === 'floor').forEach(layer => fill(layer, 1));
    segments.forEach((layer, index) => fill(layer, 3 + index));
    layers.filter(layer => layer.type === 'wall').forEach(layer => fill(layer, 2));

    // A map without rooms is one room: its whole floor.
    const sources = segments.length ? segments.map((layer, index) => ({ value: 3 + index, name: layer.metaData?.name }))
        : [{ value: 1, name: null }];
    const notch = Math.max(1, Math.round(20 / grain)), tolerance = Math.max(1, 8 / grain);
    const rooms = [];
    for (const { value, name } of sources) {
        const blocked = new Uint8Array(cells.length);
        for (let i = 0; i < cells.length; i++) blocked[i] = cells[i] === value ? 0 : 1;
        const spaces = areas(blocked, across, down, distances(blocked, across, down));
        // A room in pieces is its largest piece.
        const area = spaces.found.filter(Boolean).sort((one, two) => two.size - one.size)[0];
        if (!area || area.size * grain * grain < 2500) continue;
        let points = fewerCorners(roomEdge(spaces.labels, across, down, area, notch), tolerance);
        for (let wider = tolerance * 1.4; points.length > recognitionLimits.corners && wider <= 40 / grain; wider *= 1.4) {
            points = fewerCorners(points, wider);
        }
        if (points.length < 3 || points.length > recognitionLimits.corners) continue;
        const label = typeof name === 'string' && name.trim() ? name.trim().slice(0, 48) : `${roomName} ${rooms.length + 1}`;
        rooms.push({ name: label, points: points.map(([x, y]) => [x / across, y / down]) });
    }
    if (!rooms.length) return null;

    // The drawing: every point of the grid as a square of pixels.
    const each = Math.max(1, Math.min(8, Math.floor(longestImage / Math.max(across, down))));
    const width = across * each, height = down * each;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let y = 0; y < down; y++) {
        for (let x = 0; x < across; x++) {
            const cell = cells[y * across + x];
            if (!cell) continue;
            const [r, g, b] = cell === 2 ? [42, 51, 64] : cell === 1 ? [233, 237, 242] : tints[(cell - 3) % tints.length];
            for (let dy = 0; dy < each; dy++) {
                let p = ((y * each + dy) * width + x * each) * 4;
                for (let dx = 0; dx < each; dx++, p += 4) {
                    data[p] = r;
                    data[p + 1] = g;
                    data[p + 2] = b;
                }
            }
        }
    }
    return { recognition: { width_m: across * grain / 100, rooms }, image: { data, width, height } };
}
