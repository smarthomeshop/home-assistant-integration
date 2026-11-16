import assert from 'node:assert/strict';
import test from 'node:test';
import { roomCorners } from '../src/js/floor-planner-geometry.mjs';
import { validPlan } from '../src/js/floor-planner-model.mjs';
import { draftFromRecognition, recognitionLimits } from '../src/js/floor-planner-recognise.mjs';

// A 2:1 image placed at (1, 2) on the plan, 10 m wide until it gets a scale.
const underlay = { data: 'data:image/jpeg;base64,AAAA', ratio: 2, x: 1, y: 2, width: 10, opacity: 45 };
const rectangle = (left, top, right, bottom) => [[left, top], [right, top], [right, bottom], [left, bottom]];
const asPlan = draft => ({ version: 3, name: 'Draft', rooms: draft.rooms, walls: [], doors: draft.doors, sensors: [],
    furniture: [], windows: draft.windows, mirrors: [], zones: [], underlay: draft.underlay });

test('recognised rooms land on the image, at the real scale, with shared walls lined up', () => {
    const draft = draftFromRecognition({
        width_m: 20,
        rooms: [
            { name: 'cocina', points: rectangle(.1, .2, .4, .8) },
            // The model put this wall 0.8% of the image further right and a little lower.
            { name: 'sala', points: rectangle(.408, .204, .7, .8) },
        ],
        doors: [], windows: [],
    }, underlay);

    assert.equal(draft.scaled, true);
    assert.equal(draft.underlay.width, 20);
    assert.deepEqual([draft.underlay.x, draft.underlay.y], [1, 2]);
    const [kitchen, living] = draft.rooms;
    assert.equal(kitchen.name, 'cocina');
    assert.equal(kitchen.outline, undefined, 'a plain rectangle stays a plain room');
    // The shared wall sits between the two recognised lines, on both rooms.
    assert.equal(kitchen.x + kitchen.width, living.x);
    assert.ok(Math.abs(living.x - (1 + .404 * 20)) < .002);
    assert.equal(kitchen.y, living.y);
    // y is measured in image heights: the image is 20 m wide and 10 m high.
    assert.ok(Math.abs(kitchen.y - (2 + .202 * 10)) < .002);
    assert.ok(Math.abs(kitchen.depth - (.8 - .202) * 10) < .002);
    assert.equal(validPlan(asPlan(draft)), true);
});

test('without readable dimensions the image keeps its size and the rooms still fit it', () => {
    const draft = draftFromRecognition({ width_m: null, rooms: [{ name: '', points: rectangle(.2, .2, .6, .7) }] }, underlay,
        { roomName: 'Kamer' });
    assert.equal(draft.scaled, false);
    assert.equal(draft.underlay.width, 10);
    assert.equal(draft.rooms[0].name, 'Kamer 1');
    assert.deepEqual([draft.rooms[0].x, draft.rooms[0].width], [3, 4]);
    // An image that somebody already measured keeps its scale.
    const kept = draftFromRecognition({ width_m: 20, rooms: [{ name: 'a', points: rectangle(.2, .2, .6, .7) }] }, { ...underlay, width: 14 }, { keepScale: true });
    assert.deepEqual([kept.scaled, kept.underlay.width], [false, 14]);
    assert.ok(Math.abs(kept.rooms[0].width - 5.6) < .002);
    // A width that would make the image invalid is ignored, not applied.
    assert.equal(draftFromRecognition({ width_m: 5000, rooms: [{ name: 'a', points: rectangle(.2, .2, .6, .7) }] }, underlay).scaled, false);
});

test('an L-shaped room keeps its outline and a slanted wall stays slanted', () => {
    const draft = draftFromRecognition({ width_m: 20, rooms: [
        { name: 'L', points: [[.1, .1], [.5, .1], [.5, .4], [.3, .4], [.3, .8], [.1, .8]] },
        { name: 'escalera', points: [[.6, .1], [.8, .1], [.95, .8], [.6, .8]] },
    ] }, underlay);
    const [corner, stairs] = draft.rooms;
    assert.equal(corner.outline.length, 6);
    assert.equal(stairs.outline.length, 4, 'the slanted side is not straightened into a rectangle');
    // Top right at 80% of the image width, bottom right at 95%.
    const right = roomCorners(stairs).map(([x]) => x).sort((a, b) => a - b).slice(-2);
    assert.deepEqual(right, [17, 20]);
    assert.equal(validPlan(asPlan(draft)), true);
});

test('doors and windows are placed on the nearest wall of a room', () => {
    const draft = draftFromRecognition({
        width_m: 20,
        rooms: [{ name: 'Room', points: rectangle(.1, .2, .5, .8) }],
        // A door drawn slightly off the right wall, and one far from any wall.
        doors: [{ from: [.505, .4], to: [.505, .49] }, { from: [.9, .1], to: [.9, .2] }],
        windows: [{ from: [.2, .195], to: [.35, .195] }],
    }, underlay);
    assert.equal(draft.doors.length, 1);
    const [door] = draft.doors, [room] = draft.rooms, [window] = draft.windows;
    assert.equal(door.roomId, room.id);
    assert.equal(door.x, room.x + room.width, 'the door sits on the right wall');
    assert.equal(door.angle, 90);
    assert.ok(Math.abs(door.width - .9) < .002, 'two image heights of 4.5% on a 10 m high image');
    assert.equal(window.y, room.y);
    assert.equal(window.angle, 0);
    assert.ok(Math.abs(window.width - 3) < .002);
    assert.equal(window.height, 1);
    assert.equal(validPlan(asPlan(draft)), true);
});

test('unusable recognitions give nothing instead of a broken plan', () => {
    assert.equal(draftFromRecognition(null, underlay), null);
    assert.equal(draftFromRecognition({ rooms: [] }, underlay), null);
    assert.equal(draftFromRecognition({ rooms: [{ name: 'a', points: rectangle(.1, .1, .5, .5) }] }, { ...underlay, data: 'nope' }), null);
    // Coordinates outside the image, too few corners and too many corners are ignored.
    assert.equal(draftFromRecognition({ rooms: [
        { name: 'outside', points: rectangle(-.2, .1, .5, .5) },
        { name: 'line', points: [[.1, .1], [.5, .5]] },
        { name: 'busy', points: Array.from({ length: recognitionLimits.corners + 1 }, (_, i) => [.1 + i / 100, .1 + (i % 2) / 10]) },
    ] }, underlay), null);
    // A tiny room is skipped and reported; an outline that crosses itself becomes its bounding box.
    const draft = draftFromRecognition({ width_m: 20, rooms: [
        { name: 'dot', points: rectangle(.1, .1, .105, .11) },
        { name: 'bow', points: [[.3, .3], [.6, .7], [.6, .3], [.3, .7]] },
    ] }, underlay);
    assert.equal(draft.skipped, 1);
    assert.equal(draft.rooms.length, 1);
    assert.equal(draft.rooms[0].outline, undefined);
    assert.ok(Math.abs(draft.rooms[0].width - 6) < .002);
    assert.equal(validPlan(asPlan(draft)), true);
    // More rooms than the limit are cut off, never passed through.
    const many = { width_m: 100, rooms: Array.from({ length: 60 }, (_, i) => ({ name: `r${i}`, points: rectangle(.01 + (i % 10) * .09, .05 + Math.floor(i / 10) * .15, .08 + (i % 10) * .09, .15 + Math.floor(i / 10) * .15) })) };
    assert.ok(draftFromRecognition(many, underlay).rooms.length <= recognitionLimits.rooms);
});

const copy = {
    recognise_done: ':count rooms added.', recognise_needs_scale: ':count rooms wait for the scale.',
    recognise_quota: ':used of :limit used.', recognise_error_quota: 'All :limit used, more from :date.',
    recognise_error_daily: 'daily', recognise_error_busy: 'busy', recognise_error_none: 'none',
    recognise_error_account: 'account', recognise_error_popup: 'popup', recognise_error_failed: 'failed',
};

test('a draft is added to the plan without touching what was already drawn', async () => {
    const { planWithDraft } = await import('../src/js/floor-planner-recognise.mjs');
    const existing = { id: 'mine', name: 'Hall', x: 30, y: 30, width: 2, depth: 2, height: 2.7 };
    const plan = { version: 1, name: 'Home', rooms: [existing], walls: [], doors: [], sensors: [], underlay };
    const draft = draftFromRecognition({ width_m: 20, rooms: [{ name: 'Room', points: rectangle(.1, .2, .5, .8) }],
        doors: [{ from: [.5, .4], to: [.5, .49] }], windows: [{ from: [.2, .2], to: [.35, .2] }] }, underlay);
    const next = planWithDraft(plan, draft);
    assert.equal(next.version, 3, 'windows need version 3');
    assert.deepEqual(next.rooms[0], existing);
    assert.equal(next.rooms.length, 2);
    assert.equal(next.doors.length, 1);
    assert.equal(next.windows.length, 1);
    assert.equal(next.underlay.width, 20);
    assert.equal(validPlan(next), true);
    assert.equal(plan.rooms.length, 1, 'the plan passed in is not changed');

    // A full floor takes no more rooms; openings of rooms that did not fit are left out too.
    const full = { ...plan, rooms: Array.from({ length: 80 }, (_, i) => ({ ...existing, id: `r${i}`, x: 30 + (i % 10) * 3, y: 30 + Math.floor(i / 10) * 3 })) };
    assert.equal(validPlan(full), true);
    assert.equal(planWithDraft(full, draft), null);
    const nearlyFull = { ...full, rooms: full.rooms.slice(0, 79) };
    const two = draftFromRecognition({ width_m: 20, rooms: [{ name: 'A', points: rectangle(.1, .2, .3, .8) }, { name: 'B', points: rectangle(.5, .2, .8, .8) }],
        doors: [{ from: [.8, .4], to: [.8, .49] }], windows: [] }, underlay);
    const squeezed = planWithDraft(nearlyFull, two);
    assert.equal(squeezed.rooms.length, 80);
    assert.equal(squeezed.doors.length, 0, 'the door belonged to the room that did not fit');
});

test('the result and every failure have their own line, and a cancelled sign-in has none', async () => {
    const { recognitionNote, recognitionProblem, recognitionWaiting, roomsWaitingForScale } = await import('../src/js/floor-planner-recognise.mjs');
    assert.equal(recognitionNote(copy, { rooms: 6, quota: { used: 1, limit: 3 } }), '6 rooms added. 1 of 3 used.');
    assert.equal(recognitionNote(copy, { rooms: 2, quota: null }), '2 rooms added.');
    // Without a scale the rooms wait: on a 10 m wide image of a large sheet the small ones would be lost.
    const sheet = { width_m: null, rooms: [{ name: 'Garage', points: rectangle(.1, .1, .3, .4) }, { name: 'WC', points: rectangle(.3, .1, .33, .14) }, { name: 'bad', points: [[2, 2]] }] };
    assert.equal(roomsWaitingForScale(sheet), 2);
    assert.equal(draftFromRecognition(sheet, underlay).rooms.length, 1, 'the small room does not survive an unscaled image');
    assert.equal(draftFromRecognition(sheet, { ...underlay, width: 40 }, { keepScale: true }).rooms.length, 2, 'and does once the image has a scale');
    assert.equal(recognitionWaiting(copy, 2), '2 rooms wait for the scale.');
    assert.equal(roomsWaitingForScale(null), 0);
    assert.equal(recognitionProblem(copy, { code: 'cancelled' }, 'en'), '');
    assert.equal(recognitionProblem(copy, { code: 'quota_exceeded', quota: { limit: 3, resets_at: '2026-12-01T00:00:00+01:00' } }, 'en-GB'),
        'All 3 used, more from 1 December.');
    assert.equal(recognitionProblem(copy, { code: 'quota_exceeded' }, 'en'), 'All used, more from .');
    for (const [code, line] of [['daily_limit_exceeded', 'daily'], ['rate_limited', 'busy'], ['no_rooms_found', 'none'],
        ['account_required', 'account'], ['account_invalid', 'account'], ['popup_blocked', 'popup'],
        ['unreachable', 'failed'], ['recognition_failed', 'failed'], [undefined, 'failed']]) {
        assert.equal(recognitionProblem(copy, { code }, 'en'), line, String(code));
    }
});

test('the progress of a recognition is an estimate that never claims to be done', async () => {
    const { recognitionProgress } = await import('../src/js/floor-planner-recognise.mjs');
    assert.equal(recognitionProgress(0), 0);
    // About half way after eight seconds, most of the way after the usual twenty.
    assert.ok(recognitionProgress(8000) >= 45 && recognitionProgress(8000) <= 60);
    assert.ok(recognitionProgress(20000) >= 80 && recognitionProgress(20000) <= 90);
    // It only goes up, in whole percentages, and stops short of the end however long it takes.
    let previous = 0;
    for (let elapsed = 0; elapsed <= 180000; elapsed += 250) {
        const now = recognitionProgress(elapsed);
        assert.ok(Number.isInteger(now) && now >= previous && now < 100, `${elapsed} ms`);
        previous = now;
    }
    assert.equal(recognitionProgress(180000), 97);
    for (const odd of [-500, NaN, undefined, null, 'soon']) assert.equal(recognitionProgress(odd), 0, String(odd));
});
