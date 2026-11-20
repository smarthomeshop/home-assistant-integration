import assert from 'node:assert/strict';
import test from 'node:test';
import { personSignals } from '../src/js/floor-planner-person.mjs';
import { plannerRadars, radarFootprint, roomPlans, supportedMounting } from '../src/js/ceilsense-room-model.mjs';
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

test('a CeilSense Pro on a 4 m ceiling gets a smaller estimate, never a bigger one', () => {
    const sensor = { id: 'pro', model: 'ceilsense-pro', radar: 'ld2412', x: 3, y: 4, angle: 0 };
    const options = { allowHeightEstimate: true };
    const measured = radarFields({ ...room, height: 3 }, sensor, options)[0];
    const high = radarFields({ ...room, height: 4 }, sensor, options)[0];
    assert.equal(measured.estimatedHeight, false);
    assert.equal(high.estimatedHeight, true);
    for (const posture of ['moving', 'standing', 'seated']) {
        const [mx, my] = measured.profiles[posture];
        const [hx, hy] = high.profiles[posture];
        assert.ok(hx < mx && hy < my, `${posture} must shrink above the measured range`);
    }
});

test('the sensor advisor still advises a ceiling sensor on a 4 m ceiling, marked as an estimate', async () => {
    const { adviseRoom, defaultAdvice } = await import('../src/js/floor-planner-advice.mjs');
    const high = { ...room, height: 4 };
    const plan = { ...blankPlan('Test'), rooms: [high], sensors: [] };
    const advice = adviseRoom(plan, high, { ...defaultAdvice, mount: 'ceiling' });
    const ceiling = advice.choices.find(choice => choice.family === 'ceiling');
    assert.ok(ceiling, 'a ceiling choice is offered');
    assert.equal(ceiling.estimated, true);
    const measured = adviseRoom({ ...plan, rooms: [{ ...room, height: 2.8 }] }, { ...room, height: 2.8 }, { ...defaultAdvice, mount: 'ceiling' });
    assert.equal(measured.choices.find(choice => choice.family === 'ceiling').estimated, false);
});

test('an LD2412 on a 3.5 m ceiling sees people in the walk test, as a marked estimate', () => {
    const high = { ...room, width: 8, depth: 8, height: 3.5 };
    const sensor = { id: 'mini', model: 'ceilsense-mini', radar: 'ld2412', x: 6, y: 5, angle: 0 };
    const plan = { ...blankPlan('High ceiling'), rooms: [high], sensors: [sensor] };
    const reading = person => personSignals(plan, { pose: 'standing', moving: false, ...person })[0];
    const below = reading({ x: 6, y: 5 });
    assert.equal(below.seen, true);
    assert.deepEqual(below.signals.map(signal => [signal.radar, signal.seen, signal.estimatedHeight]), [['ld2412', true, true]]);
    // Standing 3.5 m to the side is within its reach; sitting still there is not, but 2 m to the side is.
    assert.equal(reading({ x: 9.5, y: 5 }).seen, true);
    assert.equal(reading({ x: 9.5, y: 5, pose: 'sitting' }).seen, false);
    assert.equal(reading({ x: 8, y: 5, pose: 'sitting' }).seen, true);
    // Within the measured range nothing is marked as an estimate.
    plan.rooms = [{ ...high, height: 2.8 }];
    assert.equal(reading({ x: 6, y: 5 }).signals[0].estimatedHeight, false);
    // Above 4 m there is no model to estimate with.
    plan.rooms = [{ ...high, height: 4.5 }];
    assert.deepEqual(reading({ x: 6, y: 5 }).signals, []);
    assert.equal(reading({ x: 6, y: 5 }).seen, false);
});

test('above its measured height the LD2412 keeps its straight-line reach, so its footprint only shrinks', () => {
    const at = height => radarFootprint('ld2412', height);
    const bodies = { moving: 1.35, standing: 1.35, seated: .85 };
    for (const [posture, body] of Object.entries(bodies)) {
        const top = at(3)[posture];
        // It follows on from the measured footprint without a jump.
        at(3.001)[posture].forEach((radius, axis) => assert.ok(Math.abs(radius - top[axis]) < .01, posture));
        let previous = top;
        for (const height of [3.25, 3.5, 3.75, 4]) {
            const next = at(height)[posture];
            assert.ok(next.every((radius, axis) => radius > 1 && radius < previous[axis]), `${posture} at ${height} m`);
            // The distance from the radar to the body at the edge stays what it was at 3 m.
            next.forEach((radius, axis) => assert.ok(Math.abs(Math.hypot(radius, height - body) - Math.hypot(top[axis], 3 - body)) < 1e-9));
            previous = next;
        }
    }
    // Someone who sits still is lost soonest.
    assert.ok(at(4).seated[0] / at(3).seated[0] < at(4).moving[0] / at(3).moving[0]);
    // Within the measured range the footprint is what it was.
    assert.deepEqual(at(2.8), { moving: [4.8, 6.4], standing: [4.4, 5.6], seated: [3, 4.2] });
    assert.deepEqual(at(3).seated.map(radius => Number(radius.toFixed(3))), [2.8, 3.92]);
});
