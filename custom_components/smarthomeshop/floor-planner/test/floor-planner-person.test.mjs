import assert from 'node:assert/strict';
import test from 'node:test';

import { paintBeam, paintWallCoverage } from '../src/js/floor-planner-beam.mjs';
import { blankPlan } from '../src/js/floor-planner-model.mjs';
import { emptyRoute, movePerson, paintPerson, paintWalkLines, personAt, personSignals, recordWalk, solidWalls } from '../src/js/floor-planner-person.mjs';
import { radarFields, wallSector } from '../src/js/floor-planner-radar.mjs';
import { defaultSpaceCamera, paintSpace, projectSpace, unprojectFloor } from '../src/js/floor-planner-space.mjs';

const room = (id, x) => ({ id, name: id, x, y: 0, width: 4, depth: 4, height: 2.7 });

test('a person can cross a doorway but stays inside the plan and cannot walk through a wall', () => {
    const plan = blankPlan('Two rooms');
    plan.rooms = [room('left', 0), room('right', 4)];
    plan.doors = [{ id: 'door', x: 4, y: 1.5, width: 1, angle: 90 }];
    plan.walls = [{ id: 'divider', x: 2, y: 0, endX: 2, endY: 1.5 }];
    const walls = solidWalls(plan);
    const person = { ...personAt(plan.rooms[0]), x: 3.9 };
    assert.equal(movePerson(plan.rooms, walls, person, .3, 0).x, 4.2);
    const besideDoor = { ...person, y: 1.2 };
    assert.equal(movePerson(plan.rooms, walls, besideDoor, .3, 0), besideDoor);
    const besideDivider = { ...person, x: 1.9, y: 1.2 };
    assert.equal(movePerson(plan.rooms, walls, besideDivider, .3, 0), besideDivider);
    const besideExit = { ...person, x: 7.9 };
    assert.equal(movePerson(plan.rooms, walls, besideExit, .3, 0), besideExit);
});

test('combined radar results preserve independent coverage and give example Z only when LD6002B is in range', () => {
    const plan = blankPlan('Combined radar');
    plan.rooms = [room('left', 0), room('right', 4)];
    plan.sensors = [{ id: 'sensor', x: 1, y: 2, angle: 0, model: 'ceilsense-v2', radar: 'combined' }];
    const atSensor = { ...personAt(plan.rooms[0], 'lying'), x: 1 };
    const signalsAtSensor = personSignals(plan, atSensor)[0].signals;
    assert.deepEqual(signalsAtSensor.map(({ radar, seen, height }) => [radar, seen, height]),
        [['ld6002b', true, .25], ['ld2412', true, null]]);
    const partial = personSignals(plan, { ...atSensor, x: 3.65 })[0];
    assert.deepEqual(partial.signals.map(({ seen, height }) => [seen, height]), [[false, null], [true, null]]);
    assert.equal(personSignals(plan, { ...atSensor, x: 4.1 })[0].seen, false);
    plan.rooms[0].ceiling = { type: 'slope', high: 3.4, direction: 'x+' };
    assert.deepEqual(personSignals(plan, atSensor)[0].signals, []);
});

test('the trail preserves the coverage boundary when extending a straight route', () => {
    const route = emptyRoute();
    const start = { ...personAt(room('left', 0)), x: 1 };
    const middle = { ...start, x: 2, heading: 90 };
    const end = { ...middle, x: 3 };
    recordWalk(route, start, middle, true, false);
    recordWalk(route, middle, end, false, false);
    assert.equal(route.distance, 2);
    assert.equal(route.covered, .5);
    assert.deepEqual(route.points.map(({ x, covered }) => [x, covered]), [[1, true], [1.5, true], [3, false]]);
    assert.match(paintWalkLines(end, route, [], null), /data-covered="false" d="M1.5 2L3 2"/);
    assert.match(paintWalkLines(end, route, [], { yaw: Math.PI / 2, tilt: .5 }), /data-covered="true"/);
    const uninterrupted = emptyRoute();
    recordWalk(uninterrupted, start, middle, true, true);
    recordWalk(uninterrupted, middle, end, true, true);
    assert.deepEqual(uninterrupted.points.map(point => point.x), [1, 3]);
});

test('an arbitrary orbit projects and unprojects a point on the floor', () => {
    const point = [-6.3, 9.45];
    for (const camera of [{ yaw: .37, tilt: .25 }, { yaw: -1.7, tilt: 1 }]) {
        const [x, y] = unprojectFloor(projectSpace(point, 0, camera), camera);
        assert.ok(Math.hypot(x - point[0], y - point[1]) < .003);
    }
});

test('wall radar sectors in 3D keep their direction and room clip at floor and mount height', () => {
    const hall = room('hall', 4);
    const item = { id: 'wall-sensor', x: 4, y: 2, angle: 90, model: 'wallsense', radar: 'ld2450', mountHeight: 1.55 };
    const choices = radarFields(hall, item).map(field => ({ room: hall, item, field }));
    const floor = paintWallCoverage(choices, defaultSpaceCamera);
    assert.match(floor, /data-plane="floor" data-sensor="wall-sensor"/);
    assert.match(floor, /<polygon points="4,0 8,0 8,4 4,4"/);
    assert.match(floor, /translate\(4 2\) rotate\(90\)/);
    assert.ok(choices.every(({ field }) => floor.includes(wallSector(field))));
    const raised = paintBeam(choices[1], defaultSpaceCamera, 'seated');
    assert.match(raised, /data-plane="height" data-sensor="wall-sensor"/);
    assert.match(raised, /id="fp-wall-height-wall-sensor"/);
    const matrix = raised.match(/transform="matrix\(([^)]+)\)/)[1].split(' ').map(Number);
    assert.deepEqual(matrix.slice(4), projectSpace([0, 0], item.mountHeight, defaultSpaceCamera, false));
});

test('the 3D maquette fits around rooms away from the plan origin', () => {
    const plan = blankPlan('Offset room');
    plan.rooms = [{ ...room('offset', 85), y: -80 }];
    const scene = paintSpace(plan, defaultSpaceCamera);
    const [, , width, height] = scene.viewBox.split(' ').map(Number);
    assert.ok(width < 12 && height < 12);
    assert.equal(scene.hasFurniture, false);
    assert.match(scene.markup, /fp-model-base/);
});

test('CeilSense follows the projected mounting plane as the 3D camera tilts', () => {
    const plan = blankPlan('Ceiling mounts');
    const bedroom = room('bedroom', 0);
    const sensor = { id: 'sensor', x: 1, y: 2, model: 'ceilsense-v2', radar: 'ld2412', angle: 0 };
    plan.sensors = [sensor];
    const face = (ceiling, camera) => {
        plan.rooms = [ceiling];
        const markup = paintSpace(plan, camera).markup;
        return markup.match(/<polygon points="([^"]+)" class="fp-space-puck face"/)[1].split(' ');
    };

    for (const camera of [{ yaw: .4, tilt: .24 }, { yaw: -1, tilt: 1.15 }]) {
        const ring = face(bedroom, camera);
        assert.equal(ring[0], projectSpace([1.19, 2], bedroom.height, camera).join(','));
        assert.equal(ring[8], projectSpace([1, 2.19], bedroom.height, camera).join(','));
    }

    const sloped = { ...bedroom, ceiling: { type: 'slope', direction: 'x+', high: 3.7 } };
    const camera = { yaw: .4, tilt: 1 };
    const height = 2.95;
    const run = .19 / Math.hypot(1, .25);
    assert.equal(face(sloped, camera)[0], projectSpace([1 + run, 2], height + .25 * run, camera).join(','));
    sensor.levelMountRoom = bedroom.id;
    assert.equal(face(sloped, camera)[0], projectSpace([1.19, 2], height, camera).join(','));
});

test('the 3D gait keeps a static pose when motion is reduced', () => {
    const target = { ...personAt(room('test', 0)), moving: true };
    const early = { ...target, stride: .1 };
    const late = { ...target, stride: .4 };
    assert.notEqual(paintPerson(early, defaultSpaceCamera), paintPerson(late, defaultSpaceCamera));
    assert.equal(paintPerson(early, defaultSpaceCamera, false), paintPerson(late, defaultSpaceCamera, false));
});

test('the three 3D poses render finite mesh coordinates from either side', () => {
    for (const camera of [defaultSpaceCamera, { yaw: Math.PI, tilt: .2 }]) {
        const meshes = ['standing', 'sitting', 'lying'].map(pose => {
            const markup = paintPerson(personAt(room('test', 0), pose), camera);
            const mesh = markup.match(/<g class="fp-avatar-mesh">(.*?)<\/g>/s)?.[1];
            assert.ok(mesh?.match(/<polygon /g)?.length > 60);
            assert.doesNotMatch(mesh, /NaN|Infinity/);
            return mesh;
        });
        assert.equal(new Set(meshes).size, 3);
    }
});

test('close-up avatars use independent smooth shading and distant figures use a lighter mesh', () => {
    const pose = { ...personAt(room('test', 0)), heading: 137 };
    const detailed = ['man', 'woman', 'child'].map((avatar, index) => paintPerson({ ...pose, avatar, x: pose.x + index }, defaultSpaceCamera));
    const markup = detailed.join('');
    const gradients = [...markup.matchAll(/<linearGradient id="([^"]+)"/g)].map(([, id]) => id);
    assert.ok(detailed.every(figure => figure.includes('<linearGradient')));
    assert.equal(new Set(gradients).size, gradients.length);
    assert.doesNotMatch(markup, /NaN|Infinity/);
    const compact = paintPerson(pose, defaultSpaceCamera, true, false);
    assert.doesNotMatch(compact, /<linearGradient/);
    assert.ok(compact.length < detailed[0].length);
});

test('LD2412 uses seated, standing and moving contours for the same target position', () => {
    const plan = blankPlan('Ceiling profiles');
    plan.rooms = [{ ...room('wide', 0), width: 12, depth: 12, height: 2.8 }];
    plan.sensors = [{ id: 'sensor', x: 6, y: 6, angle: 0, model: 'ceilsense-v2', radar: 'ld2412' }];
    const seen = (x, pose, moving = false) => personSignals(plan, { x, y: 6, pose, moving })[0].seen;
    assert.equal(seen(9.5, 'sitting'), false);
    assert.equal(seen(9.5, 'standing'), true);
    assert.equal(seen(10.6, 'standing'), false);
    assert.equal(seen(10.6, 'standing', true), true);
});
