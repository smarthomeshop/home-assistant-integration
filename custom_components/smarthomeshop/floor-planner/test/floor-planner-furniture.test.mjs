import assert from 'node:assert/strict';
import test from 'node:test';

import { adviseRoom, defaultAdvice } from '../src/js/floor-planner-advice.mjs';
import { furnitureAt, furnitureCatalog } from '../src/js/floor-planner-furniture.mjs';
import { furnitureMesh } from '../src/js/floor-planner-furniture-mesh.mjs';
import { defaultSpaceCamera, paintSpace } from '../src/js/floor-planner-space.mjs';
import { blankPlan, validPlan } from '../src/js/floor-planner-model.mjs';
import { furnitureOcclusion, prepareFurnitureOcclusion } from '../src/js/floor-planner-obstruction.mjs';
import { personSignals } from '../src/js/floor-planner-person.mjs';
import { calibrateUnderlay } from '../src/js/floor-planner-underlay.mjs';

const person = { x: 4, y: 2, pose: 'sitting' };
const room = { id: 'work', name: 'Work', x: 0, y: 0, width: 6, depth: 4, height: 2.7 };
const object = (kind, x, y, overrides = {}) => ({ id: kind, ...furnitureAt(kind, kind, { x, y }), ...overrides });

test('curved furniture retains its features through rotation and every catalog model fits the shared 3D renderer', () => {
    const kinds = Object.keys(furnitureCatalog);
    const plan = { rooms:[{ id:'room', name:'Room', x:0, y:0, width:14, depth:11, height:2.7 }],
        doors:[], walls:[], sensors:[], furniture:kinds.map((kind, index) => object(kind, 1.5 + index % 5 * 2.65,
            1.5 + Math.floor(index / 5) * 2.15, { angle:(index % 3) * 30 })) };
    for (const yaw of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
        const { markup } = paintSpace(plan, { ...defaultSpaceCamera, yaw });
        for (const kind of kinds) assert.match(markup, new RegExp(`data-model="${kind}"`));
        for (const surface of ['ceramic-rim', 'basin', 'basin-floor', 'cloth-hem', 'cloth-shadow', 'rail']) {
            assert.match(markup, new RegExp(`data-surface="${surface}"`));
        }
        assert.doesNotMatch(markup, /NaN|Infinity/);
    }
    for (const kind of ['bath', 'curtain']) {
        const item = object(kind, 2, 3);
        assert.ok(furnitureMesh(item).faces.every(face => face.vertices.every(([x, y, z]) =>
            Math.abs(x) <= item.width / 2 + .0001 && Math.abs(y) <= item.depth / 2 + .0001
            && z >= item.base - .0001 && z <= item.base + item.height + .0001)));
    }
});

test('the same material can be bypassed at a higher mounting height and rotation changes the ray intersection', () => {
    const screen = object('screen', 2.6, 2.6, { width: 1.8, height: 1.75, material: 'metal', angle: 90 });
    const ray = (sensor, item) => furnitureOcclusion(sensor, person, .85, prepareFurnitureOcclusion([item]));
    assert.equal(ray({ x: 1, y: 2, z: 1.4 }, screen).status, 'blocked');
    assert.equal(ray({ x: 1, y: 2, z: 1.4 }, { ...screen, angle: 0 }), null);
    assert.equal(ray({ x: 1, y: 2, z: 3.5 }, screen), null);
    assert.equal(ray({ x: 1, y: 2, z: 1.4 }, { ...screen, material: 'glass' }).status, 'shadow');
    assert.equal(ray({ x: 1, y: 2, z: 1.4 }, { ...screen, material: 'ignore' }), null);
});

test('an open table and solid object with the same outside dimensions give different direct paths', () => {
    const source = { x: 1, y: 2, z: .85 };
    const table = object('dining', 2.6, 2, { material: 'metal', height: 1.25 });
    const occlusion = item => furnitureOcclusion(source, person, .85, prepareFurnitureOcclusion([item]));
    assert.equal(occlusion(table), null);
    assert.equal(occlusion({ ...table, kind: 'custom' }).status, 'blocked');
});

test('furniture is saved in a valid plan and reported only for sensors whose footprint reaches the target', () => {
    const plan = blankPlan('A furnished room');
    plan.rooms = [room];
    plan.sensors = [{ id: 'wall', model: 'ultimatesensor-v2', radar: 'ld2450', x: 0, y: 2, angle: 90, mountHeight: 1.4 }];
    plan.furniture = [object('wardrobe', 2.6, 2, { material: 'metal' })];
    assert.equal(validPlan(plan), true);
    assert.equal(personSignals(plan, person)[0].obstacle.id, 'wardrobe');
    assert.equal(personSignals(plan, person)[0].seen, false);
    assert.equal(personSignals({ ...plan, furniture: [] }, person)[0].seen, true);
    assert.equal(validPlan({ ...plan, furniture: [{ ...plan.furniture[0], material: 'unknown' }] }), false);
});

test('room advice compares both families and only offers ceiling-mounted height sensing', () => {
    const plan = blankPlan('Advice');
    plan.rooms = [room];
    const comparison = adviseRoom(plan, room, defaultAdvice);
    assert.deepEqual(comparison.choices.map(choice => choice.family).sort(), ['ceiling', 'freestanding', 'recessed', 'wall']);
    assert.equal(comparison.choices.at(-1).family, 'recessed');
    assert.ok(comparison.choices.every(choice => choice.sensors.length <= 3));
    const height = adviseRoom(plan, room, { ...defaultAdvice, goal: 'height' });
    assert.deepEqual(height.choices.map(choice => choice.sensors[0].radar), ['ld6002b']);
    assert.equal(adviseRoom(plan, room, { ...defaultAdvice, goal: 'height', mount: 'wall' }).reason, 'height');
    assert.equal(adviseRoom(plan, room, { ...defaultAdvice, goal: 'climate' }).choices[0].family, 'wall');
    assert.equal(adviseRoom(plan, room, { ...defaultAdvice, goal: 'climate', mount: 'ceiling' }).choices[0].needsScd41, true);
});

test('mounting advice distinguishes in-wall WallSense, freestanding and bracket-mounted UltimateSensor', () => {
    const plan = blankPlan('Mounting advice');
    plan.rooms = [room];
    for (const [mount, model, installation] of [
        ['recessed', 'wallsense', 'wall-recessed'], ['freestanding', 'ultimatesensor-v2', 'freestanding'],
        ['wall', 'ultimatesensor-v2', 'wall-bracket'],
    ]) {
        const result = adviseRoom(plan, room, { ...defaultAdvice, mount });
        assert.ok(result.choices.length);
        assert.ok(result.choices[0].sensors.every(item => item.model === model && item.installation === installation));
    }
});

test('freestanding advice uses a drawn surface and ignores an existing wall bracket', () => {
    const plan = blankPlan('Desk placement');
    plan.rooms = [room];
    plan.furniture = [{ id: 'desk-1', ...furnitureAt('desk', 'Desk', { x: room.x + 1, y: room.y + 1 }) }];
    plan.sensors = [{ id: 'old', model: 'ultimatesensor-v2', radar: 'ld2450', angle: 90,
        x: room.x, y: room.y + 2, installation: 'wall-bracket', mountHeight: 1.4 }];
    assert.equal(adviseRoom(plan, room, { ...defaultAdvice, mount: 'freestanding' }).reason, 'covered');
    const replacement = { ...defaultAdvice, mount: 'freestanding', strategy: 'replace' };
    const choice = adviseRoom(plan, room, replacement).choices[0];
    assert.equal(choice.needsSurface, false);
    assert.deepEqual(choice.sensors.map(({ x, y, mountHeight }) => [x, y, mountHeight]), [[room.x + 1, room.y + 1, .81]]);
    const withoutDesk = adviseRoom({ ...plan, furniture: [] }, room, replacement).choices[0];
    assert.equal(withoutDesk.needsSurface, true);
});

test('tracking-only ceiling sensors count as existing coverage for presence advice', () => {
    const plan = blankPlan('Existing tracker');
    plan.rooms = [room];
    plan.sensors = [{ id: 'tracker', model: 'ceilsense-mini', radar: 'ld2460', angle: 0,
        x: room.x + room.width / 2, y: room.y + room.depth / 2 }];
    assert.equal(adviseRoom(plan, room, defaultAdvice).reason, 'covered');
    assert.ok(adviseRoom(plan, room, { ...defaultAdvice, strategy: 'replace' }).choices.length);
});

test('CO₂ advice avoids an occupied ceiling location and can upgrade an existing V2', () => {
    const plan = blankPlan('CO₂ upgrade');
    plan.rooms = [room];
    const sensor = { id: 'existing', model: 'ceilsense-mini', radar: 'ld2460', angle: 0, x: 3, y: 2 };
    plan.sensors = [sensor];
    const settings = { ...defaultAdvice, mount: 'ceiling', air: true };
    const addition = adviseRoom(plan, room, settings).choices[0];
    assert.ok(Math.hypot(addition.sensors[0].x - sensor.x, addition.sensors[0].y - sensor.y) > .15);
    assert.equal(addition.upgrade, false);

    plan.sensors = [{ ...sensor, model: 'ceilsense-v2' }];
    const upgrade = adviseRoom(plan, room, { ...settings, mount: 'either' }).choices[0];
    assert.equal(upgrade.upgrade, true);
    assert.deepEqual(upgrade.sensors, [{ model: 'ceilsense-v2', radar: 'ld2460', angle: 0, x: 3, y: 2,
        installation: 'ceiling-recessed', climate: true }]);
});

test('advice rejects wall heights above the room and only uses positions with enough ceiling clearance', () => {
    const plan = blankPlan('Mount height');
    plan.rooms = [room];
    const settings = { ...defaultAdvice, mount: 'recessed', wallHeight: 3 };
    assert.equal(adviseRoom(plan, room, settings).reason, 'height_invalid');
    const atLimit = adviseRoom(plan, room, { ...settings, wallHeight: 2.55 });
    assert.ok(atLimit.choices[0].sensors.every(sensor => sensor.mountHeight === 2.55));

    const slope = { ...room, ceiling: { type: 'slope', high: 3.5, direction: 'x+' } };
    plan.rooms = [slope];
    const atSlope = adviseRoom(plan, slope, { ...settings, wallHeight: 3.3 });
    assert.ok(atSlope.choices[0].sensors.every(sensor => sensor.x === slope.width && sensor.mountHeight === 3.3));
});

test('calibrating the image scales around the first point and stays valid in imported JSON', () => {
    const plan = blankPlan('Reference');
    const image = { data: 'data:image/jpeg;base64,YQ==', ratio: 2, x: 0, y: 0, width: 10, opacity: 45 };
    plan.underlay = calibrateUnderlay(image, { x: 2, y: 1 }, 5, 10);
    assert.deepEqual([plan.underlay.x, plan.underlay.y, plan.underlay.width], [-2, -1, 20]);
    assert.equal(validPlan(plan), true);
    assert.equal(validPlan({ ...plan, underlay: { ...image, data: 'https://example.com/image.jpg' } }), false);
});
