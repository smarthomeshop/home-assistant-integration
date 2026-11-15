import assert from 'node:assert/strict';
import test from 'node:test';

import { createWalkActivities, fallMotionDuration, paintActivityEffect, walkTestPhase } from '../src/js/floor-planner-activity.mjs';
import { furnitureAt } from '../src/js/floor-planner-furniture.mjs';
import { blankPlan } from '../src/js/floor-planner-model.mjs';
import { prepareFurnitureOcclusion } from '../src/js/floor-planner-obstruction.mjs';
import { paintPerson, personAt, personTargetHeight, preparePersonSensors, solidWalls } from '../src/js/floor-planner-person.mjs';
import { defaultSpaceCamera } from '../src/js/floor-planner-space.mjs';
import { createWalkNetwork } from '../src/js/floor-planner-walk-route.mjs';

function twoRooms() {
    const plan = blankPlan('Two rooms');
    plan.rooms = [
        { id: 'left', x: 0, y: 0, width: 6, depth: 5 },
        { id: 'right', x: 6, y: 0, width: 4, depth: 5 },
    ];
    plan.doors = [{ x: 6, y: 2, width: .5, angle: 90 }];
    return plan;
}

const networkFor = plan => createWalkNetwork(plan, solidWalls(plan));

test('automatic routes clear rotated furniture, cross rugs and use a narrow door', () => {
    const plan = twoRooms();
    const cabinet = { ...furnitureAt('custom', 'Rotated cabinet', { x: 3, y: 2.25 }, 35), width: 2.4, depth: 1.5 };
    plan.furniture = [
        cabinet,
        { ...furnitureAt('rug', 'Rug in doorway', { x: 6, y: 2.25 }), width: 2, depth: 2 },
    ];
    const start = { ...personAt(plan.rooms[0]), x: 1 };
    const route = networkFor(plan).routeFrom(start, () => .55);
    assert.equal(route.at(-1)?.room.id, 'right');
    assert.ok(route.length > 1);
    let previous = start;
    let crossedDoor = false;
    const angle = cabinet.angle * Math.PI / 180;
    for (const point of route) {
        if (previous.x < 6 && point.x >= 6) {
            const y = previous.y + (point.y - previous.y) * (6 - previous.x) / (point.x - previous.x);
            assert.ok(y >= 2.16 && y <= 2.34);
            crossedDoor = true;
        }
        for (let fraction = 0; fraction <= 1; fraction += .01) {
            const x = previous.x + (point.x - previous.x) * fraction - cabinet.x;
            const y = previous.y + (point.y - previous.y) * fraction - cabinet.y;
            const localX = x * Math.cos(angle) + y * Math.sin(angle);
            const localY = y * Math.cos(angle) - x * Math.sin(angle);
            assert.ok(Math.abs(localX) >= cabinet.width / 2 + .16 || Math.abs(localY) >= cabinet.depth / 2 + .16);
        }
        previous = point;
    }
    assert.equal(crossedDoor, true);
});

test('a wardrobe in the doorway or a gap in the floor keeps the route inside the starting room', () => {
    const plan = twoRooms();
    const start = personAt(plan.rooms[0]);
    plan.furniture = [{ ...furnitureAt('wardrobe', 'Wardrobe', { x: 6, y: 2.25 }, 90), material: 'ignore' }];
    const blocked = networkFor(plan).routeFrom(start, () => .9);
    assert.ok(blocked.length);
    assert.ok(blocked.every(point => point.x < 6));
    plan.furniture = [];
    plan.rooms[1].x += .02;
    const gap = networkFor(plan).routeFrom(start, () => .9);
    assert.ok(gap.length);
    assert.ok(gap.every(point => point.x < 6));
});

test('a person starting inside furniture moves to free floor or stays put if the room is full', () => {
    const plan = twoRooms();
    const start = personAt(plan.rooms[0]);
    plan.furniture = [furnitureAt('coffee', 'Table', start)];
    const network = networkFor(plan);
    const clear = network.startAt(start);
    assert.equal(clear?.room.id, 'left');
    assert.ok(Math.abs(clear.x - start.x) >= .74 || Math.abs(clear.y - start.y) >= .46);
    assert.ok(network.routeFrom(clear, () => .4).length);
    plan.furniture = [{ ...furnitureAt('custom', 'Oversized furniture', start), width: 6, depth: 5 }];
    assert.equal(networkFor(plan).startAt(start), null);
});

test('activities use reachable furniture and the appropriate detectors in their own room', () => {
    const plan = twoRooms();
    plan.rooms.forEach(room => { room.height = 2.7; });
    plan.furniture = [
        { id: 'chair', ...furnitureAt('chair', 'Chair', { x: 1, y: 1 }) },
        { id: 'bed', ...furnitureAt('bed', 'Bed', { x: 8, y: 3 }) },
    ];
    plan.sensors = [
        { id: 'radar', model: 'ceilsense-v2', radar: 'combined', x: 2, y: 2, angle: 0 },
    ];
    const start = { ...personAt(plan.rooms[0]), heading: 0 };
    const activities = () => createWalkActivities(plan, solidWalls(plan), preparePersonSensors(plan),
        prepareFurnitureOcclusion(plan.furniture), networkFor(plan));
    const choose = activities();
    assert.equal(choose('seat', start, new Set()).item.id, 'chair');
    assert.equal(choose('seat', start, new Set(['chair'])), null);
    const bed = choose('bed', start, new Set());
    assert.equal(bed.points.at(-1).room.id, 'right');
    assert.ok(bed.elevation > .4);
    const fall = choose('fall', start, new Set());
    assert.equal(fall.detector.item.id, 'radar');
    assert.equal(fall.room.id, 'left');

    plan.doors = [];
    assert.equal(activities()('bed', start, new Set()), null);
    plan.sensors[0].radar = 'ld2412';
    assert.equal(activities()('fall', start, new Set()), null);

    plan.furniture = [];
    const testRoom = plan.rooms[0];
    const fallTest = activities()('fall', start, new Set(), testRoom);
    assert.equal(fallTest.room, testRoom);
    assert.equal(fallTest.detector, undefined);

    const smokeTest = activities()('smoke', start, new Set(), testRoom);
    assert.equal(smokeTest.room, testRoom);
    assert.equal(smokeTest.detector, undefined);
    assert.ok(smokeTest.source);
    plan.sensors.push({ id: 'pro', model: 'ceilsense-pro', radar: 'ld2412', x: 2, y: 2, angle: 0 });
    assert.equal(activities()('smoke', start, new Set(), testRoom).detector.item.id, 'pro');
});

test('the valtest has visible intermediate 3D poses and a lower radar target before the impact alarm', () => {
    const person = { ...personAt({ id: 'test', x: 0, y: 0, width: 4, depth: 4 }), activity: 'fall' };
    const start = walkTestPhase('fall', 0, false);
    const midair = walkTestPhase('fall', fallMotionDuration * .78, false);
    const landed = walkTestPhase('fall', fallMotionDuration, false);
    const frames = [
        { ...person, fallProgress: start.fallProgress },
        { ...person, fallProgress: midair.fallProgress },
        { ...person, fallProgress: landed.fallProgress, pose: 'lying' },
    ];
    const markup = frames.map(figure => paintPerson(figure, defaultSpaceCamera, true, false));
    assert.equal(new Set(markup).size, 3);
    markup.forEach(frame => assert.doesNotMatch(frame, /NaN|Infinity/));
    const heights = frames.map(personTargetHeight);
    assert.ok(heights[0] > heights[1] && heights[1] > heights[2]);
    assert.equal(midair.checked, false);
    assert.equal(landed.checked, true);
    assert.deepEqual(walkTestPhase('fall', 0, true), landed);
    assert.equal(paintActivityEffect({ kind: 'fall', checked: false }, defaultSpaceCamera, 400), '');
});

test('the smoke test shows ignition, smoke and the alarm in order, and animates the character', () => {
    const room = { x: 0, y: 0, width: 4, depth: 4, height: 2.7 };
    const activity = { kind: 'smoke', room, source: { x: 1, y: 2 }, started: 0 };
    const effect = (at, detected = false, camera = defaultSpaceCamera) => {
        const phase = walkTestPhase('smoke', at, false);
        return paintActivityEffect({ ...activity, ...phase, detected }, camera, at);
    };
    assert.equal(effect(500), '');
    assert.match(effect(1000), /fp-demo-fire/);
    assert.doesNotMatch(effect(1000), /fp-room-smoke|fp-room-alarm/);
    const plume = effect(2300);
    assert.match(plume, /clip-path="url\(#fp-smoke-volume-3d\)"/);
    assert.doesNotMatch(plume, /fp-room-alarm/);
    assert.equal(walkTestPhase('smoke', 3799, false).checked, false);
    assert.equal(walkTestPhase('smoke', 3800, false).checked, true);
    assert.doesNotMatch(effect(4000), /fp-room-alarm/);
    assert.match(effect(4000, true), /fp-room-alarm/);
    assert.match(effect(4000, true), /--fp-smoke-age:-2.350s/);
    assert.match(effect(4000, true, null), /fp-smoke-volume-2d/);

    const person = { ...personAt(room), activity: 'smoke' };
    const frames = [500, 2500, 2700, 4000].map(at =>
        ({ ...person, ...walkTestPhase('smoke', at, false), smokeTime: at / 1000 }));
    for (const camera of [defaultSpaceCamera, null]) {
        const markup = frames.map(frame => paintPerson(frame, camera, true, false));
        assert.equal(new Set(markup).size, frames.length);
        markup.forEach(frame => assert.doesNotMatch(frame, /NaN|Infinity/));
        const still = frames.slice(1).map(frame => paintPerson(frame, camera, false, false));
        assert.equal(new Set(still).size, 1);
    }
});
