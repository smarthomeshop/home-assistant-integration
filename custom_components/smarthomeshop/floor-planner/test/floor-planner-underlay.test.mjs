import assert from 'node:assert/strict';
import test from 'node:test';

import { validProject } from '../src/js/floor-planner-building.mjs';
import { paintPlan } from '../src/js/floor-planner-drawing.mjs';
import { blankPlan, validPlan } from '../src/js/floor-planner-model.mjs';
import { chosenTool, repeatingTools, toolRepeats } from '../src/js/floor-planner-tools.mjs';
import {
    calibrateUnderlay, defaultRoomTransparency, imagePart, loadUnderlay, maxUnderlayFile, movedPart, roomTransparency, smallestPart,
    underlayKind, underlayMessage, usablePart, validUnderlay, wholeImage,
} from '../src/js/floor-planner-underlay.mjs';

// An underlay as plans stored it before rooms could be made see-through.
const earlier = { data: 'data:image/jpeg;base64,YQ==', ratio: 2, x: 0, y: 0, width: 10, opacity: 45 };
const file = (name, type, size = 2000) => ({ name, type, size });

test('an underlay saved before room transparency existed stays valid and uses the default', () => {
    assert.ok(validUnderlay(earlier));
    assert.equal(roomTransparency(earlier), defaultRoomTransparency);
    const plan = { ...blankPlan('Earlier plan'), underlay: earlier };
    assert.equal(validPlan(plan), true);
    assert.equal(validProject(plan), true);
});

test('room transparency is stored with the underlay as a percentage from 0 to 100', () => {
    for (const value of [0, 5, 60, 100]) {
        const underlay = { ...earlier, roomTransparency: value };
        assert.ok(validUnderlay(underlay), String(value));
        assert.equal(roomTransparency(underlay), value);
        assert.equal(validProject({ ...blankPlan('Traced plan'), underlay }), true);
    }
    for (const value of [-5, 101, NaN, Infinity, '60', null]) {
        assert.ok(!validUnderlay({ ...earlier, roomTransparency: value }), String(value));
        assert.equal(validPlan({ ...blankPlan('Traced plan'), underlay: { ...earlier, roomTransparency: value } }), false);
    }
    // A value survives saving as JSON and setting the scale.
    const saved = JSON.parse(JSON.stringify({ ...blankPlan('Traced plan'), underlay: { ...earlier, roomTransparency: 80 } }));
    assert.equal(validPlan(saved), true);
    assert.equal(calibrateUnderlay(saved.underlay, { x: 2, y: 1 }, 5, 10).roomTransparency, 80);
});

test('images and PDFs are accepted as underlay and other files are not', () => {
    assert.equal(underlayKind(file('plan.png', 'image/png')), 'image');
    assert.equal(underlayKind(file('plan.jpg', 'image/jpeg')), 'image');
    assert.equal(underlayKind(file('plan.webp', 'image/webp')), 'image');
    assert.equal(underlayKind(file('plan.pdf', 'application/pdf')), 'pdf');
    // Some systems do not know the type of a PDF, or write its name in capitals.
    assert.equal(underlayKind(file('GROUND FLOOR.PDF', '')), 'pdf');
    assert.equal(underlayKind(file('plan.pdf', 'application/octet-stream')), 'pdf');
    for (const other of [file('plan.gif', 'image/gif'), file('plan.svg', 'image/svg+xml'), file('plan.dwg', ''), file('notes.txt', 'text/plain'),
        file('plan.pdf.exe', 'application/octet-stream'), file('plan.pdf', 'text/html'), file('plan', ''), null]) {
        assert.equal(underlayKind(other), null, other?.name);
    }
    assert.equal(underlayKind(file('plan.pdf', 'application/pdf', maxUnderlayFile)), 'pdf');
    assert.equal(underlayKind(file('plan.pdf', 'application/pdf', maxUnderlayFile + 1)), null);
    assert.equal(underlayKind(file('plan.png', 'image/png', maxUnderlayFile + 1)), null);
});

test('a file the planner cannot open is refused before anything is read', async () => {
    const unread = { ...file('notes.txt', 'text/plain'), arrayBuffer: () => assert.fail('The file was read') };
    await assert.rejects(loadUnderlay(unread), error => error.code === 'format' && underlayMessage(error) === 'underlay_error');
    await assert.rejects(loadUnderlay({ ...unread, name: 'plan.pdf', type: 'application/pdf', size: maxUnderlayFile + 1 }),
        error => error.code === 'format');
});

test('a failed upload names the message that explains it', () => {
    assert.equal(underlayMessage({ code: 'password' }), 'underlay_pdf_password');
    assert.equal(underlayMessage({ code: 'pdf' }), 'underlay_pdf_error');
    assert.equal(underlayMessage({ code: 'format' }), 'underlay_error');
    assert.equal(underlayMessage({ code: 'size' }), 'underlay_error');
    // An image the browser cannot decode fails with an error of its own.
    assert.equal(underlayMessage(new Error('The source image cannot be decoded.')), 'underlay_error');
    assert.equal(underlayMessage(undefined), 'underlay_error');
});

test('room outlines get a casing only when the editor asks for it', () => {
    const plan = { ...blankPlan('Traced plan'), version: 2, rooms: [
        { id: 'hall', name: 'Hall', x: 0, y: 0, width: 4, depth: 3, height: 2.6 },
        { id: 'study', name: 'Study', x: 4, y: 0, width: 3, depth: 3, height: 2.6, outline: [[0, 0], [3, 0], [3, 3], [1, 3], [0, 2]] },
    ] };
    const number = new Intl.NumberFormat('en');
    const count = (markup, name) => markup.split(`class="${name}"`).length - 1;
    const plain = paintPlan(plan, false, null, number);
    assert.equal(count(plain, 'fp-room-casing'), 0);
    assert.equal(count(plain, 'fp-room-floor'), 2);
    const cased = paintPlan(plan, false, null, number, null, { casing: true });
    assert.equal(count(cased, 'fp-room-casing'), 2);
    assert.equal(count(cased, 'fp-room-floor'), 2);
    // The casing lies under the floor, so the outline and clicks stay on top.
    assert.ok(cased.indexOf('fp-room-casing') < cased.indexOf('fp-room-floor'));
});

test('walls, doors, windows, mirrors and zones stay active after placing, other tools do not', () => {
    assert.deepEqual(repeatingTools, ['wall', 'door', 'window', 'mirror', 'zone']);
    for (const tool of repeatingTools) assert.equal(toolRepeats(tool), true, tool);
    for (const tool of ['edit', 'pan', 'room', 'outline_room', 'edit_outline', 'place', 'furnish', 'move_furniture', 'move_item', 'scale_underlay']) {
        assert.equal(toolRepeats(tool), false, tool);
    }
    // Moving an existing door or adding a part to an existing zone is one change.
    assert.equal(toolRepeats('door', 'door-1'), false);
    assert.equal(toolRepeats('zone', 'zone-1'), false);
});

test('choosing the active tool again goes back to selecting', () => {
    assert.equal(chosenTool('wall', 'wall'), 'edit');
    assert.equal(chosenTool('pan', 'pan'), 'edit');
    assert.equal(chosenTool('wall', 'door'), 'door');
    assert.equal(chosenTool('edit', 'wall'), 'wall');
    assert.equal(chosenTool('edit', 'edit'), 'edit');
    // The room button is also shown as active while a free shape is drawn.
    assert.equal(chosenTool('outline_room', 'room'), 'room');
});

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);

test('a part of an image is the box between two corners, kept inside the image', () => {
    assert.deepEqual(imagePart({ x: .1, y: .2 }, { x: .6, y: .9 }), { x: .1, y: .2, width: .5, height: .7 });
    // Dragging up and to the left gives the same box, and dragging past an edge stops at it.
    assert.deepEqual(imagePart({ x: .6, y: .9 }, { x: .1, y: .2 }), imagePart({ x: .1, y: .2 }, { x: .6, y: .9 }));
    assert.deepEqual(imagePart({ x: .5, y: .5 }, { x: 1.4, y: -3 }), { x: .5, y: 0, width: .5, height: .5 });
    // A click, or a box too small to be meant, is no part.
    assert.equal(imagePart({ x: .4, y: .4 }, { x: .4, y: .4 }), null);
    assert.equal(imagePart({ x: .4, y: .4 }, { x: .42, y: .9 }), null);
    assert.equal(imagePart({ x: .4, y: .4 }, { x: .9, y: .43 }), null);
    // While a box is being dragged it may still be small, but never empty.
    assert.ok(imagePart({ x: .4, y: .4 }, { x: .42, y: .43 }, 0));
    assert.equal(imagePart({ x: .4, y: .4 }, { x: .4, y: .9 }, 0), null);
    // The smallest part counts, whatever rounding its sums have.
    assert.ok(imagePart({ x: .3, y: .3 }, { x: .3 + smallestPart, y: .3 + smallestPart }));
});

test('a part can be moved up to the edges of the image', () => {
    const part = { x: .5, y: .5, width: .4, height: .3 };
    const moved = movedPart(part, -.2, .1);
    near(moved.x, .3);
    near(moved.y, .6);
    assert.deepEqual([moved.width, moved.height], [.4, .3]);
    const stopped = movedPart(part, .5, .5);
    near(stopped.x, .6);
    near(stopped.y, .7);
    assert.deepEqual(movedPart(part, -9, -9), { x: 0, y: 0, width: .4, height: .3 });
});

test('a part is only usable when it lies in the image and is not a thin strip', () => {
    assert.ok(usablePart(wholeImage, 2));
    assert.ok(usablePart({ x: .5, y: 0, width: .5, height: 1 }, 2));
    assert.ok(usablePart({ x: .3, y: .3, width: .35 - .3, height: .05 }, 1));
    assert.ok(!usablePart(null, 2));
    assert.ok(!usablePart({ x: .5, y: 0, width: .7, height: 1 }, 2));
    assert.ok(!usablePart({ x: -.1, y: 0, width: .5, height: 1 }, 2));
    assert.ok(!usablePart({ x: 0, y: 0, width: .02, height: 1 }, 2));
    assert.ok(!usablePart({ x: 0, y: 0, width: NaN, height: 1 }, 2));
    // The full width and a twentieth of the height of a wide sheet is a strip.
    assert.ok(!usablePart({ x: 0, y: 0, width: 1, height: .05 }, 2));
    assert.ok(usablePart({ x: 0, y: 0, width: 1, height: .05 }, 1));
});

test('only the chosen part of an uploaded image is kept, as sharp as the upload allows', async t => {
    const drawn = [];
    const canvas = { width: 0, height: 0, toDataURL: () => 'data:image/jpeg;base64,YQ==',
        getContext: () => ({ fillRect() {}, drawImage: (source, ...box) => drawn.push({ box, width: canvas.width, height: canvas.height }) }) };
    const browser = { document: globalThis.document, Image: globalThis.Image, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
    globalThis.document = { createElement: () => canvas };
    globalThis.Image = class { naturalWidth = 4000; naturalHeight = 2000; async decode() {} };
    URL.createObjectURL = () => 'blob:plan';
    URL.revokeObjectURL = () => {};
    t.after(() => {
        Object.assign(globalThis, { document: browser.document, Image: browser.Image });
        Object.assign(URL, { createObjectURL: browser.create, revokeObjectURL: browser.revoke });
    });
    const photo = file('sheet.png', 'image/png');
    const noPage = () => assert.fail('An image has no pages');

    // Without a question the whole image is used, as before.
    const whole = await loadUnderlay(photo);
    assert.equal(whole.ratio, 2);
    assert.deepEqual(drawn.pop(), { box: [0, 0, 4000, 2000, 0, 0, 1600, 800], width: 1600, height: 800 });

    // The right half holds one floor: it is cut from the full image, not from a reduced one.
    const asked = [];
    const half = await loadUnderlay(photo, noPage, (picture, ratio) => {
        asked.push([picture.naturalWidth, ratio]);
        return { x: .5, y: 0, width: .5, height: 1 };
    });
    assert.deepEqual(asked, [[4000, 2]]);
    assert.equal(half.ratio, 1);
    assert.ok(validUnderlay(half));
    assert.deepEqual(drawn.pop(), { box: [2000, 0, 2000, 2000, 0, 0, 1600, 1600], width: 1600, height: 1600 });

    // A small part is not enlarged beyond the pixels it has.
    await loadUnderlay(photo, noPage, () => ({ x: .1, y: .1, width: .25, height: .25 }));
    assert.deepEqual(drawn.pop(), { box: [400, 200, 1000, 500, 0, 0, 1000, 500], width: 1000, height: 500 });

    // Cancelling changes nothing, and a part that cannot be used gives the whole image.
    assert.equal(await loadUnderlay(photo, noPage, () => null), null);
    assert.equal(drawn.length, 0);
    assert.equal((await loadUnderlay(photo, noPage, () => ({ x: .2, y: .2, width: .01, height: .5 }))).ratio, 2);
    assert.equal((await loadUnderlay(photo, noPage, () => wholeImage)).ratio, 2);
});
