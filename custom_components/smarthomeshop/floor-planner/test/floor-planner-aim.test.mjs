// Where a wall sensor looks: how high it hangs, how far it is tilted down and
// how far it is turned on its bracket.
import assert from 'node:assert/strict';
import test from 'node:test';

import { paintBeam } from '../src/js/floor-planner-beam.mjs';
import { blankPlan, canAimSensor, sameSensorPlacement, sensorPan, sensorTilt, validPlan } from '../src/js/floor-planner-model.mjs';
import { personSignals } from '../src/js/floor-planner-person.mjs';
import { fieldCoversPoint, radarFields, wallSector } from '../src/js/floor-planner-radar.mjs';
import { defaultSpaceCamera, projectSpace } from '../src/js/floor-planner-space.mjs';

const room = { id: 'room', name: 'Room', x: 0, y: 0, width: 6, depth: 6, height: 2.7 };
// On the wall at the bottom of the plan, looking into the room.
const sensor = { id: 'sensor', x: 3, y: 6, angle: 0, model: 'ultimatesensor-v2', radar: 'ld2450' };
const tracker = item => radarFields(room, item).find(field => field.mode === 'xy');
// Whether the tracker reaches a standing person this far in front of the sensor.
const reaches = (item, distance) => fieldCoversPoint(tracker(item), item, { x: 3, y: 6 - distance }, 'standing', 1.35);

test('a radar hung high looks over the floor at its foot until it is tilted down', () => {
    // At chest height the whole fan is covered, as before.
    assert.equal(reaches(sensor, .5), true);
    assert.equal(reaches(sensor, 4.5), true);
    const high = { ...sensor, mountHeight: 2.4 };
    assert.equal(reaches(high, 1), false);
    assert.equal(reaches(high, 2), true);
    const tilted = { ...high, tilt: 30 };
    assert.equal(reaches(tilted, .3), false);
    assert.equal(reaches(tilted, .6), true);
    assert.equal(reaches(tilted, 4.5), true);
    // The range is measured from the radar, so from high up it ends sooner on the floor.
    assert.equal(reaches(tilted, 4.75), false);
    assert.equal(reaches({ ...sensor, mountHeight: 1.35 }, 4.75), true);
    // Pointed at the floor it no longer sees across the room.
    assert.equal(reaches({ ...high, tilt: 75 }, 4), false);
    // Without a height to look for, the field stays the flat fan the advice works with.
    assert.equal(fieldCoversPoint(tracker(high), high, { x: 3, y: 5 }), true);
});

test('the floor a radar covers on the plan follows its height and tilt', () => {
    const level = wallSector(tracker(sensor));
    const high = wallSector(tracker({ ...sensor, mountHeight: 2.4 }));
    const tilted = wallSector(tracker({ ...sensor, mountHeight: 2.4, tilt: 30 }));
    assert.equal(new Set([level, high, tilted]).size, 3);
    const nearest = shape => Math.min(...shape.slice(1, -1).split('L').map(point => Math.hypot(...point.split(' ').map(Number))));
    assert.equal(nearest(level), 0);
    assert.ok(nearest(high) > 1.3 && nearest(high) < 1.6);
    assert.ok(nearest(tilted) > .3 && nearest(tilted) < .6);
    // Looking up from far above the room it covers no floor at all.
    assert.equal(wallSector(tracker({ ...sensor, mountHeight: 6, tilt: -30 })), '');
    // The same aim gives the same shape again.
    assert.equal(wallSector(tracker({ ...sensor, mountHeight: 2.4, tilt: 30 })), tilted);
});

test('a walk test follows the tilt of the sensor', () => {
    const plan = blankPlan('Aim');
    plan.rooms = [room];
    const tracked = (item, distance) => {
        plan.sensors = [item];
        const [result] = personSignals(plan, { x: 3, y: 6 - distance, pose: 'standing', moving: false });
        return result.signals.find(signal => signal.radar === 'ld2450').seen;
    };
    const high = { ...sensor, mountHeight: 2.4 };
    assert.equal(tracked(high, 1), false);
    assert.equal(tracked({ ...high, tilt: 30 }, 1), true);
    assert.equal(tracked(high, 3), true);
});

test('a plan keeps the tilt and the turn of a wall sensor and refuses them elsewhere', () => {
    const plan = blankPlan('Aim');
    plan.rooms = [room];
    const withSensor = item => ({ ...plan, sensors: [item] });
    assert.equal(validPlan(withSensor(sensor)), true);
    assert.equal(validPlan(withSensor({ ...sensor, tilt: 30 })), true);
    assert.equal(validPlan(withSensor({ ...sensor, tilt: sensorTilt.max + 1 })), false);
    assert.equal(validPlan(withSensor({ ...sensor, tilt: sensorTilt.min - 1 })), false);
    assert.equal(validPlan(withSensor({ ...sensor, tilt: '30' })), false);
    const bracket = { ...sensor, installation: 'wall-bracket', angle: 45, pan: 45 };
    assert.equal(validPlan(withSensor(bracket)), true);
    assert.equal(validPlan(withSensor({ ...bracket, pan: -sensorPan })), true);
    assert.equal(validPlan(withSensor({ ...bracket, pan: sensorPan + 1 })), false);
    const ceiling = { id: 'ceiling', x: 3, y: 3, angle: 0, model: 'ceilsense-v2', radar: 'ld2412' };
    assert.equal(validPlan(withSensor(ceiling)), true);
    assert.equal(validPlan(withSensor({ ...ceiling, tilt: 10 })), false);
    assert.equal(validPlan(withSensor({ ...ceiling, pan: 10 })), false);

    assert.equal(canAimSensor(sensor), true);
    assert.equal(canAimSensor(ceiling), false);
    // WallSense sits flat in the wall.
    assert.equal(canAimSensor({ ...sensor, model: 'wallsense' }), false);
    assert.equal(sameSensorPlacement(sensor, { ...sensor }), true);
    assert.equal(sameSensorPlacement(sensor, { ...sensor, tilt: 30 }), false);
});

test('in 3D the fan of a tilted sensor leans down and stops at the floor', () => {
    const fan = item => paintBeam({ room, item, field: tracker(item) }, defaultSpaceCamera, 'seated');
    const level = fan({ ...sensor, mountHeight: 2.4 });
    assert.doesNotMatch(level, /data-tilted/);
    const tilted = fan({ ...sensor, mountHeight: 2.4, tilt: 30 });
    assert.match(tilted, /data-plane="height" data-sensor="sensor" data-tilted/);
    assert.notEqual(tilted.match(/matrix\(([^)]+)\)/)[1], level.match(/matrix\(([^)]+)\)/)[1]);
    // A point of the fan lands where that point of the room is drawn: 2 m along
    // the tilted beam and .7 m to its side, from a sensor turned on its bracket.
    for (const item of [{ ...sensor, mountHeight: 2.4, tilt: 30 }, { ...sensor, x: 0, y: 2, angle: 135, mountHeight: 2, tilt: -20 }]) {
        const [a, b, c, d, e, f] = fan(item).match(/matrix\(([^)]+)\)/)[1].split(' ').map(Number);
        const [side, along] = [.7, 2];
        const turn = item.angle * Math.PI / 180, tilt = item.tilt * Math.PI / 180;
        const flat = along * Math.cos(tilt);
        const expected = projectSpace([item.x + side * Math.cos(turn) + flat * Math.sin(turn), item.y + side * Math.sin(turn) - flat * Math.cos(turn)],
            item.mountHeight - along * Math.sin(tilt), defaultSpaceCamera, false);
        const drawn = [a * side + c * -along + e, b * side + d * -along + f];
        assert.ok(Math.hypot(drawn[0] - expected[0], drawn[1] - expected[1]) < .002, `${drawn} is not ${expected}`);
    }
    // Ahead is up in the fan's own frame. Tilted 60 degrees from 2.4 m the fan
    // meets the floor 2.77 m along it, well before the far wall.
    const ahead = markup => Math.max(...markup.match(/<polygon points="([^"]+)"/)[1].split(' ').map(point => -Number(point.split(',')[1])));
    assert.ok(Math.abs(ahead(fan({ ...sensor, mountHeight: 2.4, tilt: 60 })) - 2.4 / Math.sin(Math.PI / 3)) < .01);
    // Looking up, the ceiling stops it.
    assert.ok(Math.abs(ahead(fan({ ...sensor, mountHeight: 2.4, tilt: -30 })) - .3 / .5) < .01);
    // Tilted a little, it still reaches the far wall first.
    assert.ok(Math.abs(ahead(fan({ ...sensor, mountHeight: 2.4, tilt: 10 })) - 6 / Math.cos(Math.PI / 18)) < .01);
});
