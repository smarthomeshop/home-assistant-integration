import assert from 'node:assert/strict';
import test from 'node:test';
import { validPlan } from '../src/js/floor-planner-model.mjs';
import { draftFromRecognition, planWithDraft } from '../src/js/floor-planner-recognise.mjs';
import { followTracedWalls, traceFloorPlan } from '../src/js/floor-planner-trace.mjs';

// Drawings of 10 by 7.5 m at 40 pixels a metre, on white paper.
const perMetre = 40, across = 10, down = 7.5;
const black = [0, 0, 0], grey = [160, 160, 160], blue = [190, 215, 240];

function paper() {
    const width = across * perMetre, height = down * perMetre;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const paint = (x, y, [r, g, b]) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        data.set([r, g, b, 255], (y * width + x) * 4);
    };
    const px = metres => Math.round(metres * perMetre);
    return {
        image: { data, width, height },
        // A filled box between two corners, in metres.
        box(left, top, right, bottom, colour = black) {
            for (let y = px(top); y < px(bottom); y++) for (let x = px(left); x < px(right); x++) paint(x, y, colour);
        },
        // A line one pixel wide.
        line(x1, y1, x2, y2, colour = black) {
            const steps = Math.max(Math.abs(px(x2) - px(x1)), Math.abs(px(y2) - px(y1)), 1);
            for (let i = 0; i <= steps; i++) paint(Math.round(px(x1) + (px(x2) - px(x1)) * i / steps), Math.round(px(y1) + (px(y2) - px(y1)) * i / steps), colour);
        },
        // The outline of a box, one pixel wide.
        outline(left, top, right, bottom) {
            this.line(left, top, right, top);
            this.line(right, top, right, bottom);
            this.line(right, bottom, left, bottom);
            this.line(left, bottom, left, top);
        },
        // A quarter circle one pixel wide, from one angle to the next in degrees.
        arc(x, y, radius, from, to) {
            for (let angle = from; angle <= to; angle += .5) {
                paint(Math.round(px(x) + px(radius) * Math.cos(angle * Math.PI / 180)), Math.round(px(y) + px(radius) * Math.sin(angle * Math.PI / 180)), black);
            }
        },
        // A filled polygon, corners in metres.
        polygon(points, colour = black) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const [mx, my] = [(x + .5) / perMetre, (y + .5) / perMetre];
                    let inside = false;
                    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                        const [xi, yi] = points[i], [xj, yj] = points[j];
                        if ((yi > my) !== (yj > my) && mx < (xj - xi) * (my - yi) / (yj - yi) + xi) inside = !inside;
                    }
                    if (inside) paint(x, y, colour);
                }
            }
        },
    };
}

// Two rooms side by side: the outer walls from (1, 1) to (9, 6) m, 20 cm
// thick, and a wall between them at x = 5 m with a door from y = 3 to 3.9 m.
const walls = [[1, 1, 9, 1.2], [1, 5.8, 9, 6], [1, 1, 1.2, 6], [8.8, 1, 9, 6], [5, 1.2, 5.2, 3], [5, 3.9, 5.2, 5.8]];
const leftRoom = [1.2, 1.2, 5, 5.8], rightRoom = [5.2, 1.2, 8.8, 5.8];

// The outline of a traced room in metres: [left, top, right, bottom].
const bounds = room => {
    const xs = room.points.map(([x]) => x * across), ys = room.points.map(([, y]) => y * down);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
const near = (actual, expected, within = .08) => actual.every((value, i) => Math.abs(value - expected[i]) <= within);
const sorted = rooms => [...rooms].sort((a, b) => bounds(a)[0] - bounds(b)[0]);

test('rooms between solid walls are found up to the walls, with the door between them', () => {
    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    const traced = traceFloorPlan(drawing.image, across);

    assert.equal(traced.rooms.length, 2);
    const [left, right] = sorted(traced.rooms);
    assert.ok(near(bounds(left), leftRoom), `left room ${bounds(left)}`);
    assert.ok(near(bounds(right), rightRoom), `right room ${bounds(right)}`);
    assert.equal(left.points.length, 4, 'a plain room stays a rectangle');

    assert.equal(traced.doors.length, 1);
    const [door] = traced.doors;
    const [x1, y1, x2, y2] = [door.from[0] * across, door.from[1] * down, door.to[0] * across, door.to[1] * down];
    assert.ok(Math.abs(x1 - 5.1) < .1 && Math.abs(x2 - 5.1) < .1, 'the door sits in the wall between the rooms');
    assert.ok(Math.abs(Math.min(y1, y2) - 3) < .1 && Math.abs(Math.max(y1, y2) - 3.9) < .1, 'and spans the opening');
});

test('walls drawn as two thin lines are walls too', () => {
    const drawing = paper();
    for (const wall of walls) drawing.outline(...wall);
    const traced = traceFloorPlan(drawing.image, across);

    assert.equal(traced.rooms.length, 2);
    const [left, right] = sorted(traced.rooms);
    assert.ok(near(bounds(left), leftRoom, .1), `left room ${bounds(left)}`);
    assert.ok(near(bounds(right), rightRoom, .1), `right room ${bounds(right)}`);
});

test('dimension lines, text and coloured or grey floors do not split or hide a room', () => {
    const drawing = paper();
    // A grey floor in one room and a blue one in the other.
    drawing.box(...leftRoom, grey);
    drawing.box(...rightRoom, blue);
    for (const wall of walls) drawing.box(...wall);
    // A dimension line right across the left room, with its ticks.
    drawing.line(1.2, 4.6, 5, 4.6);
    drawing.line(1.3, 4.5, 1.3, 4.7);
    drawing.line(4.9, 4.5, 4.9, 4.7);
    // A label: a short dark block in the middle of the right room.
    drawing.box(6.4, 3.3, 7.1, 3.45);
    const traced = traceFloorPlan(drawing.image, across);

    assert.equal(traced.rooms.length, 2);
    const [left, right] = sorted(traced.rooms);
    assert.ok(near(bounds(left), leftRoom, .12), `left room ${bounds(left)}`);
    assert.ok(near(bounds(right), rightRoom, .12), `right room ${bounds(right)}`);
});

test('a front door does not let the outside into the room', () => {
    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    // A 90 cm opening in the bottom wall of the left room.
    drawing.box(2, 5.8, 2.9, 6, [255, 255, 255]);
    const traced = traceFloorPlan(drawing.image, across);

    assert.equal(traced.rooms.length, 2);
    assert.ok(near(bounds(sorted(traced.rooms)[0]), leftRoom, .12));
});

// The ends of a traced door or window in metres: [x1, y1, x2, y2].
const ends = item => [item.from[0] * across, item.from[1] * down, item.to[0] * across, item.to[1] * down];
const white = [255, 255, 255];

test('a window drawn as lines in a solid wall is found, and a front door with its swing is not one', () => {
    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    // A window of 1.2 m in the top wall of the left room: the two faces of
    // the wall and the glass between them.
    drawing.box(2, 1, 3.2, 1.2, white);
    drawing.outline(2, 1, 3.2, 1.175);
    drawing.line(2, 1.1, 3.2, 1.1);
    // A front door of 90 cm in the bottom wall, with its sill, leaf and swing.
    drawing.box(2, 5.8, 2.9, 6, white);
    drawing.line(2, 5.9, 2.9, 5.9);
    drawing.line(2, 5.8, 2, 4.9);
    drawing.arc(2, 5.8, .9, 270, 360);
    const traced = traceFloorPlan(drawing.image, across);

    assert.equal(traced.rooms.length, 2);
    assert.equal(traced.doors.length, 1, 'only the door between the rooms');
    assert.equal(traced.windows.length, 1);
    const [x1, y1, x2, y2] = ends(traced.windows[0]);
    assert.ok(Math.abs(y1 - 1.1) < .1 && Math.abs(y2 - 1.1) < .1, `in the top wall: ${y1}`);
    assert.ok(Math.abs(Math.min(x1, x2) - 2) < .1 && Math.abs(Math.max(x1, x2) - 3.2) < .1, `as wide as it is drawn: ${x1} to ${x2}`);
});

test('a wide window drawn as one thin line keeps its room, and a light band in a wall is a window too', () => {
    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    // 2.4 m of glass in the top wall of the right room, wider than a door.
    drawing.box(6, 1, 8.4, 1.2, white);
    drawing.line(6, 1.1, 8.4, 1.1);
    // A narrow grey band in the left wall.
    drawing.box(1, 2.5, 1.2, 3.7, white);
    drawing.box(1.05, 2.5, 1.15, 3.7, [175, 175, 175]);
    const traced = traceFloorPlan(drawing.image, across);

    assert.equal(traced.rooms.length, 2, 'the outside does not come in through the window');
    assert.ok(near(bounds(sorted(traced.rooms)[1]), rightRoom, .12));
    assert.equal(traced.windows.length, 2);
    const [wide, band] = [...traced.windows].sort((a, b) => b.from[0] - a.from[0]).map(ends);
    assert.ok(Math.abs(Math.abs(wide[2] - wide[0]) - 2.4) < .15, `the wide window: ${wide}`);
    assert.ok(Math.abs(band[0] - 1.1) < .1 && Math.abs(Math.abs(band[3] - band[1]) - 1.2) < .15, `the band in the left wall: ${band}`);
});

test('glass between two rooms is a window where the wall goes on, and a door where a door swings', () => {
    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    // The wall between the rooms gets a window of 80 cm above its door, and
    // the door gets glass in it and a swing.
    drawing.box(5, 1.5, 5.2, 2.3, white);
    drawing.outline(5, 1.5, 5.175, 2.3);
    drawing.line(5.1, 3, 5.1, 3.9);
    drawing.line(5.2, 3, 6.1, 3);
    drawing.arc(5.2, 3, .9, 0, 90);
    const traced = traceFloorPlan(drawing.image, across);

    assert.equal(traced.rooms.length, 2);
    assert.equal(traced.doors.length, 1);
    assert.equal(traced.windows.length, 1);
    const [, y1, , y2] = ends(traced.windows[0]);
    assert.ok(Math.abs(Math.min(y1, y2) - 1.5) < .1 && Math.abs(Math.max(y1, y2) - 2.3) < .1, `the window: ${y1} to ${y2}`);
});

test('a drawing whose walls are two lines gives no windows, and neither does a thin wall or an open passage', () => {
    const outlined = paper();
    for (const wall of walls) outlined.outline(...wall);
    outlined.line(2, 1.1, 3.2, 1.1);
    assert.deepEqual(traceFloorPlan(outlined.image, across).windows, []);

    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    // A stretch of the top wall that is a thin solid wall, and a plain gap.
    drawing.box(2, 1, 3.2, 1.2, white);
    drawing.box(2, 1.05, 3.2, 1.15);
    drawing.box(6.5, 1, 7.4, 1.2, white);
    assert.deepEqual(traceFloorPlan(drawing.image, across).windows, []);
});

test('a slanted wall gives the room a slanted side', () => {
    const drawing = paper();
    for (const wall of [[1, 1, 7, 1.2], [1, 5.8, 9, 6], [1, 1, 1.2, 6]]) drawing.box(...wall);
    // From the top right corner down to the bottom right one, 20 cm thick.
    drawing.polygon([[6.9, 1], [7.1, 1], [9, 6], [8.8, 6]]);
    const traced = traceFloorPlan(drawing.image, across);

    assert.equal(traced.rooms.length, 1);
    const points = traced.rooms[0].points.map(([x, y]) => [x * across, y * down]);
    const slanted = points.some((point, i) => {
        const next = points[(i + 1) % points.length];
        return Math.abs(next[0] - point[0]) > 1 && Math.abs(next[1] - point[1]) > 1;
    });
    assert.ok(slanted, `outline ${JSON.stringify(points)}`);
});

test('an open drawing without enclosed rooms, a missing scale or a broken image gives nothing to add', () => {
    const drawing = paper();
    drawing.box(1, 1, 9, 1.2);
    drawing.box(1, 1, 1.2, 6);
    assert.equal(traceFloorPlan(drawing.image, across).rooms.length, 0);
    assert.equal(traceFloorPlan(drawing.image, 0), null);
    assert.equal(traceFloorPlan(drawing.image, Number.NaN), null);
    assert.equal(traceFloorPlan({ data: new Uint8ClampedArray(16), width: 2, height: 2 }, across), null);
    assert.equal(traceFloorPlan(null, across), null);
});

test('traced rooms go on the plan as a valid draft, with their door', () => {
    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    const traced = traceFloorPlan(drawing.image, across);
    const underlay = { data: 'data:image/jpeg;base64,AAAA', ratio: across / down, x: 0, y: 0, width: across, opacity: 45 };
    const draft = draftFromRecognition(traced, underlay, { keepScale: true });
    const plan = planWithDraft({ version: 3, name: 'Traced', rooms: [], walls: [], doors: [], sensors: [] }, draft);

    assert.equal(plan.rooms.length, 2);
    assert.equal(plan.doors.length, 1);
    assert.equal(validPlan(plan), true);
});

test('a traced window goes on the plan in the wall of its room', () => {
    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    drawing.box(2, 1, 3.2, 1.2, white);
    drawing.outline(2, 1, 3.2, 1.175);
    drawing.line(2, 1.1, 3.2, 1.1);
    const traced = traceFloorPlan(drawing.image, across);
    const underlay = { data: 'data:image/jpeg;base64,AAAA', ratio: across / down, x: 0, y: 0, width: across, opacity: 45 };
    const draft = draftFromRecognition(traced, underlay, { keepScale: true });
    const plan = planWithDraft({ version: 3, name: 'Traced', rooms: [], walls: [], doors: [], sensors: [] }, draft);

    assert.equal(validPlan(plan), true);
    assert.equal(plan.windows.length, 1);
    const [window] = plan.windows;
    const room = plan.rooms.find(item => item.id === window.roomId);
    assert.ok(near([room.x, room.y, room.x + room.width, room.y + room.depth], leftRoom), 'in the left room');
    assert.ok(Math.abs(window.width - 1.2) < .1 && Math.abs(window.y - 1.2) < .1 && Math.abs(window.x - 2) < .1,
        `on its top wall: ${JSON.stringify(window)}`);
});

test('a recognised room takes the outline of the traced room it matches and keeps its name', () => {
    const drawing = paper();
    for (const wall of walls) drawing.box(...wall);
    const traced = traceFloorPlan(drawing.image, across);
    const share = ([left, top, right, bottom]) => [[left / across, top / down], [right / across, top / down],
        [right / across, bottom / down], [left / across, bottom / down]];
    const recognition = {
        rooms: [
            // About the left room, a little off on every side.
            { name: 'Kitchen', points: share([1.4, 1.05, 4.8, 5.6]) },
            // Half of the right room: no match, so it stays as it was.
            { name: 'Study', points: share([5.2, 1.2, 7, 3.5]) },
        ],
    };
    const followed = followTracedWalls(recognition, traced);

    assert.equal(followed.rooms[0].name, 'Kitchen');
    assert.ok(near(bounds(followed.rooms[0]), leftRoom), `kitchen ${bounds(followed.rooms[0])}`);
    assert.deepEqual(followed.rooms[1], recognition.rooms[1]);
    assert.equal(followTracedWalls(recognition, null), recognition);
});
