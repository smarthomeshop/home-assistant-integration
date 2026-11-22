import assert from 'node:assert/strict';
import test from 'node:test';
import { deflateSync } from 'node:zlib';
import { draftFromRecognition, planWithDraft } from '../src/js/floor-planner-recognise.mjs';
import { validPlan } from '../src/js/floor-planner-model.mjs';
import { embeddedMap, mapRooms, traceColourMap } from '../src/js/floor-planner-vacuum.mjs';

// A map as a robot vacuum's app or Home Assistant draws it: 12 by 8 m at 50
// pixels a metre, dark outside, every room in its own colour.
const perMetre = 50, across = 12, down = 8;
const outside = [19, 87, 148], wall = [100, 196, 254], path = [147, 194, 238];
const roomColours = [[240, 178, 122], [133, 193, 233], [217, 136, 128]];
// Three rooms: [left, top, right, bottom] in metres.
const rooms = [[1, 1, 6, 7], [6, 1, 11, 4], [6, 4, 11, 7]];

function robotMap(background = outside) {
    const width = across * perMetre, height = down * perMetre;
    const data = new Uint8ClampedArray(width * height * 4);
    let seed = 7;
    // A saved image never keeps a colour exactly: each pixel is a little off.
    const noise = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 5) - 2;
    const paint = (x, y, colour) => {
        if (x >= 0 && y >= 0 && x < width && y < height) data.set([colour[0] + noise(), colour[1] + noise(), colour[2] + noise(), 255], (y * width + x) * 4);
    };
    const px = metres => Math.round(metres * perMetre);
    const box = (left, top, right, bottom, colour) => {
        for (let y = px(top); y < px(bottom); y++) for (let x = px(left); x < px(right); x++) paint(x, y, colour);
    };
    box(0, 0, across, down, background);
    rooms.forEach((room, index) => box(...room, roomColours[index]));
    // Walls four pixels thick around every room, with a doorway between them.
    for (const [left, top, right, bottom] of rooms) {
        box(left, top, right, top + .08, wall);
        box(left, bottom - .08, right, bottom, wall);
        box(left, top, left + .08, bottom, wall);
        box(right - .08, top, right, bottom, wall);
    }
    box(5.92, 2, 6.08, 2.9, roomColours[0]);
    // The path the robot drove, to and fro over the first room, and the robot itself.
    for (let y = 1.4; y < 6.8; y += .35) for (let x = px(1.3); x < px(5.7); x++) paint(x, px(y), path);
    for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) if (x * x + y * y <= 64) paint(px(3) + x, px(3) + y, [255, 255, 255]);
    return { data, width, height };
}

const bounds = room => {
    const xs = room.points.map(([x]) => x * across), ys = room.points.map(([, y]) => y * down);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
const near = (actual, expected, within = .15) => actual.every((value, i) => Math.abs(value - expected[i]) <= within);

test('the rooms on a robot vacuum map are its areas of one colour, whatever was drawn over them', () => {
    const traced = traceColourMap(robotMap(), across);

    assert.equal(traced.rooms.length, 3);
    const found = traced.rooms.map(bounds);
    for (const room of rooms) assert.ok(found.some(one => near(one, room)), `room ${room} in ${JSON.stringify(found)}`);
    assert.deepEqual([traced.doors, traced.windows], [[], []]);
    // Every pixel of a room knows its room.
    const at = (x, y) => traced.labels[Math.round(y * perMetre) * traced.size.width + Math.round(x * perMetre)];
    assert.ok(at(3.5, 4.8) > 0 && at(8.5, 2.5) > 0 && at(8.5, 5.5) > 0);
    assert.equal(new Set([at(3.5, 4.8), at(8.5, 2.5), at(8.5, 5.5)]).size, 3);
    assert.equal(at(.4, .4), 0, 'outside is no room');
});

test('a map on a white page works the same, and an image without a scale or areas gives nothing', () => {
    assert.equal(traceColourMap(robotMap([255, 255, 255]), across).rooms.length, 3);
    assert.equal(traceColourMap(robotMap(), 0), null);
    assert.equal(traceColourMap(null, across), null);
    const plain = { data: new Uint8ClampedArray(200 * 200 * 4).fill(255), width: 200, height: 200 };
    assert.deepEqual(traceColourMap(plain, 4).rooms, []);
});

test('rooms from a robot map go on the plan as a valid draft', () => {
    const traced = traceColourMap(robotMap(), across);
    const underlay = { data: 'data:image/jpeg;base64,AAAA', ratio: across / down, x: 0, y: 0, width: across, opacity: 45 };
    const draft = draftFromRecognition(traced, underlay, { keepScale: true });
    const plan = planWithDraft({ version: 3, name: 'Robot', rooms: [], walls: [], doors: [], sensors: [] }, draft);

    assert.equal(plan.rooms.length, 3);
    assert.equal(validPlan(plan), true);
});

// A PNG file: its signature, a header, an optional text chunk and the end.
function png(chunks) {
    const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])];
    for (const [type, body] of [['IHDR', Buffer.alloc(13)], ...chunks, ['IEND', Buffer.alloc(0)]]) {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(body.length);
        parts.push(length, Buffer.from(type), body, Buffer.alloc(4));
    }
    return new Uint8Array(Buffer.concat(parts));
}
const mapChunk = map => ['zTXt', Buffer.concat([Buffer.from('ValetudoMap\0\0'), deflateSync(JSON.stringify(map))])];

// A robot's own map on a grid of 5 cm: two rooms side by side, each 4 by 3 m,
// with walls around them. Rows are [x, y, count].
function robotGrid() {
    const rows = (left, top, right, bottom) => {
        const runs = [];
        for (let y = top; y < bottom; y++) runs.push(left, y, right - left);
        return runs;
    };
    const layer = (type, runs, metaData = {}) => ({ __class: 'MapLayer', type, metaData, pixels: [], compressedPixels: runs });
    return { __class: 'ValetudoMap', metaData: { version: 2 }, size: { x: 5120, y: 5120 }, pixelSize: 5, entities: [],
        layers: [
            layer('floor', rows(495, 498, 500, 502)),
            layer('segment', rows(400, 500, 480, 560), { segmentId: '16', name: 'Keuken', active: false }),
            layer('segment', rows(482, 500, 562, 560), { segmentId: '17', active: false }),
            layer('wall', [...rows(398, 498, 564, 500), ...rows(398, 560, 564, 562), ...rows(398, 500, 400, 560), ...rows(562, 500, 564, 560), ...rows(480, 500, 482, 540)]),
        ] };
}

test('the map inside a picture from a Valetudo robot is read from its text chunk', async () => {
    const map = robotGrid();
    assert.deepEqual(await embeddedMap(png([mapChunk(map)])), map);
    assert.equal(await embeddedMap(png([])), null, 'a picture without a map');
    assert.equal(await embeddedMap(png([['zTXt', Buffer.concat([Buffer.from('Other\0\0'), deflateSync('{}')])]])), null);
    assert.equal(await embeddedMap(png([['zTXt', Buffer.from('ValetudoMap\0\0not packed')]])), null, 'a broken chunk');
    assert.equal(await embeddedMap(png([mapChunk({ __class: 'Something' })])), null);
    assert.equal(await embeddedMap(new Uint8Array([1, 2, 3])), null);
    assert.equal(await embeddedMap('text'), null);
});

test('a robot map gives its rooms with their names, to scale, and a drawing of the map', () => {
    const { recognition, image } = mapRooms(robotGrid(), { roomName: 'Kamer' });

    // The map spans 166 points of 5 cm, with 30 cm around it.
    assert.ok(Math.abs(recognition.width_m - (166 + 12) * .05) < 1e-9);
    assert.deepEqual(recognition.rooms.map(room => room.name), ['Keuken', 'Kamer 2']);
    const metres = room => {
        const xs = room.points.map(([x]) => x * recognition.width_m), ys = room.points.map(([, y]) => y * recognition.width_m * image.height / image.width);
        return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
    };
    for (const room of recognition.rooms) assert.ok(near(metres(room), [4, 3], .11), `a room of 4 by 3 m: ${metres(room)}`);
    assert.equal(image.data.length, image.width * image.height * 4);
    assert.ok(image.width <= 1600 && image.width > 800, 'drawn large enough to read');

    // It lands on the plan at its real size, without a scale to set.
    const underlay = { data: 'data:image/jpeg;base64,AAAA', ratio: image.width / image.height, x: 0, y: 0, width: 10, opacity: 45 };
    const draft = draftFromRecognition(recognition, underlay, { roomName: 'Kamer' });
    assert.equal(draft.scaled, true);
    const plan = planWithDraft({ version: 3, name: 'Robot', rooms: [], walls: [], doors: [], sensors: [] }, draft);
    assert.equal(validPlan(plan), true);
    assert.deepEqual(plan.rooms.map(room => room.name), ['Keuken', 'Kamer 2']);
    // The two rooms meet on the line of the thin wall between them.
    for (const room of plan.rooms) assert.ok(near([room.width, room.depth], [4, 3], .06), `${room.name}: ${room.width} by ${room.depth}`);
    assert.ok(Math.abs(plan.rooms[0].x + plan.rooms[0].width - plan.rooms[1].x) < 1e-6);
});

test('a robot map without rooms is one room, and what is no map gives nothing', () => {
    const map = robotGrid();
    const floor = { ...map, layers: [{ __class: 'MapLayer', type: 'floor', metaData: {}, pixels: [], compressedPixels: map.layers[1].compressedPixels }] };
    assert.deepEqual(mapRooms(floor).recognition.rooms.map(room => room.name), ['Room 1']);

    assert.equal(mapRooms({ ...map, layers: [] }), null);
    assert.equal(mapRooms({ ...map, pixelSize: 0 }), null);
    assert.equal(mapRooms({ ...map, layers: [{ type: 'floor', compressedPixels: [1, 2] }] }), null);
    assert.equal(mapRooms({ ...map, layers: [{ type: 'floor', compressedPixels: [0, 0, 90000, 0, 5000, 4] }] }), null, 'a map too large to be a home');
    assert.equal(mapRooms(null), null);
});
