import assert from 'node:assert/strict';
import test from 'node:test';
import { plannerRadars, roomPlans, supportedMounting } from '../src/js/ceilsense-room-model.mjs';
import { paintFloorCoverage } from '../src/js/floor-planner-beam.mjs';
import { ceilingHeightAt, ceilingPitch, ceilingProfile, validCeiling } from '../src/js/floor-planner-ceiling.mjs';
import { blankPlan, ceilingCoverageStatus, guidePlanForRoom, validPlan } from '../src/js/floor-planner-model.mjs';
import { radarFields } from '../src/js/floor-planner-radar.mjs';
import { defaultSpaceCamera } from '../src/js/floor-planner-space.mjs';

const room = { id: 'room', name: 'Kamer', x: 2, y: 1, width: 4, depth: 6, height: 2.4 };
const roof = (type, direction, high = 3.6) => ({ ...room, ceiling: { type, high, direction } });

test('every CeilSense radar supports coverage calculations from 2 m', () => {
    const sensor = { id: 'sensor', model: 'ceilsense-v2', x: 3, y: 4, angle: 0 };
    const lowRoom = { ...room, height: 2 };
    for (const radar of plannerRadars) {
        assert.equal(ceilingCoverageStatus(lowRoom, { ...sensor, radar }), 'reference');
        assert.ok(radarFields(lowRoom, { ...sensor, radar }).length > 0);
        assert.ok(roomPlans(lowRoom, radar)[0].coverage > 0);
        assert.equal(supportedMounting(radar, 1.99), false);
        assert.equal(supportedMounting(radar, 3.01), false);
    }
});

test('Home Assistant can draw a marked estimate for LD2412 above the reference range', () => {
    const bedroom = { ...room, height: 3.45 };
    const sensor = { id: 'sensor', model: 'ceilsense', radar: 'ld2412', x: 3, y: 4, angle: 0 };
    const options = { allowHeightEstimate: true };
    const floor = { id: 'ground', plan: { rooms: [bedroom], sensors: [sensor] } };
    assert.deepEqual(radarFields(bedroom, sensor), []);
    const [field] = radarFields(bedroom, sensor, options);
    assert.equal(field.estimatedHeight, true);
    assert.deepEqual(Object.keys(field.profiles), ['moving', 'standing', 'seated']);
    assert.match(paintFloorCoverage(floor, defaultSpaceCamera, options).beamOverlay, /fp-beam-shell" data-height-estimate/);
    assert.equal(radarFields({ ...bedroom, height: 2.7 }, sensor, options)[0].estimatedHeight, false);
    assert.deepEqual(radarFields({ ...bedroom, height: 5 }, sensor, options), []);
    assert.deepEqual(radarFields(roof('slope', 'x+'), sensor, options), []);
    assert.deepEqual(radarFields(bedroom, { ...sensor, radar: 'none' }, options), []);
});

test('old plans stay flat and tolerate earlier decimal orientations', () => {
    const plan = blankPlan('Oud plan');
    plan.rooms.push(room);
    plan.sensors.push({ id: 'sensor', model: 'ceilsense-v2', radar: 'ld2412', x: 3, y: 4, angle: 90.25 });
    assert.equal(validPlan(plan), true);
    assert.deepEqual(ceilingProfile(room), [[0, 2.4], [1, 2.4]]);
    assert.equal(ceilingHeightAt(room, { x: 4, y: 4 }), 2.4);
});

test('single slopes use a local directed axis and gables rise to a central ridge', () => {
    const xHeights = type => [2, 4, 6].map(x => ceilingHeightAt(type, { x, y: 6 }));
    assert.deepEqual(xHeights(roof('slope', 'x+')), [2.4, 3, 3.6]);
    assert.deepEqual(xHeights(roof('slope', 'x-')), [3.6, 3, 2.4]);
    assert.deepEqual(xHeights(roof('gable', 'x+')), [2.4, 3.6, 2.4]);
    assert.equal(ceilingHeightAt(roof('slope', 'y-'), { x: 6, y: 4 }), 3);
    assert.equal(ceilingHeightAt(roof('gable', 'x+'), { x: 3, y: 4 }), 3);
    assert.equal(ceilingHeightAt({ ...roof('slope', 'x+', 2.7 + .6), height: 2.7 }, { x: 4, y: 4 }), 3);
    assert.ok(ceilingPitch(roof('gable', 'x+')) > ceilingPitch(roof('slope', 'x+')));
    assert.equal(validCeiling(roof('slope', 'x+', 2)), false);
    assert.equal(validCeiling(roof('gable', 'y-', 3)), false);
});

test('CeilSense slope contours are opt-in for that room and use local reference height', () => {
    const sloped = roof('slope', 'x+');
    const sensor = { id: 'sensor', model: 'ceilsense-v2', radar: 'ld2412', x: 3, y: 4, angle: 0 };
    assert.equal(ceilingCoverageStatus(sloped, sensor), 'tilted');
    sensor.levelMountRoom = 'other-room';
    assert.equal(ceilingCoverageStatus(sloped, sensor), 'tilted');
    sensor.levelMountRoom = room.id;
    assert.equal(ceilingCoverageStatus(sloped, sensor), 'reference');
    assert.equal(ceilingCoverageStatus(sloped, { ...sensor, x: 5 }), 'height');
    assert.deepEqual(guidePlanForRoom({ rooms: [sloped], walls: [], sensors: [sensor] }, sloped), { reason: 'ceiling' });
});
