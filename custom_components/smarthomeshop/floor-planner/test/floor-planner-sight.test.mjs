// What a radar sees across rooms: walls stop it, an open door lets it through.
import assert from 'node:assert/strict';
import test from 'node:test';

import { coverageCells } from '../src/js/floor-planner-heatmap.mjs';
import { blankPlan, validPlan } from '../src/js/floor-planner-model.mjs';
import { personSignals } from '../src/js/floor-planner-person.mjs';
import {
    doorHeight, doorReach, doorsHeldOpen, planWithOpenDoors, prepareSight, sightBlocked, sightPolygon, sightReach,
} from '../src/js/floor-planner-sight.mjs';

const room = (id, x, extra = {}) => ({ id, name: id, x, y: 0, width: 4, depth: 4, height: 2.6, ...extra });
// Two rooms side by side with a door of one metre in the wall between them.
function home({ closed, sensor = { x: 2, y: 2 }, radar = 'ld2412' } = {}) {
    const plan = blankPlan('Two rooms');
    plan.rooms = [room('left', 0), room('right', 4)];
    plan.doors = [{ id: 'door', x: 4, y: 1.5, width: 1, angle: 90, ...(closed === undefined ? {} : { closed }) }];
    plan.sensors = [{ id: 'sensor', ...sensor, angle: 0, model: 'ceilsense-v2', radar }];
    return plan;
}
const standing = (x, y) => ({ x, y, pose: 'standing', heading: 0 });
const seen = (plan, person, sight) => personSignals(plan, person, undefined, undefined, sight)[0];
const inside = (polygon, x, y) => {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [ax, ay] = polygon[i], [bx, by] = polygon[j];
        if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) hit = !hit;
    }
    return hit;
};

test('a radar sees a person in the next room through an open door, and not through the wall beside it', () => {
    const plan = home();
    assert.equal(validPlan(plan), true);
    // In its own room, as before.
    assert.equal(seen(plan, standing(3, 2)).seen, true);
    // Standing in the doorway and just past it.
    assert.equal(seen(plan, standing(4, 2)).seen, true);
    assert.equal(seen(plan, standing(4.6, 2)).seen, true);
    // The same distance away, but behind the wall next to the door.
    const behindWall = seen(plan, standing(4.6, .5));
    assert.equal(behindWall.seen, false);
    assert.equal(behindWall.walled, true);
    // Out of range is not the same as behind a wall.
    assert.equal(seen(plan, standing(7.9, 2)).walled, false);
});

test('a closed door is a wall, and stays valid in a saved plan', () => {
    const plan = home({ closed: true });
    assert.equal(validPlan(plan), true);
    assert.equal(validPlan(JSON.parse(JSON.stringify(plan))), true);
    assert.equal(seen(plan, standing(4.6, 2)).seen, false);
    assert.equal(seen(plan, standing(3, 2)).seen, true);
    // An open door says so, or says nothing: plans from before doors could close have no value.
    assert.equal(seen(home({ closed: false }), standing(4.6, 2)).seen, true);
    for (const value of ['yes', 1, null]) assert.equal(validPlan(home({ closed: value })), false, String(value));
});

test('a person opens the closed door they stand at, and it closes again behind them', () => {
    const plan = home({ closed: true });
    const visitor = standing(4.4, 2);
    const held = doorsHeldOpen(plan, [visitor]);
    assert.deepEqual([...held], ['door']);
    assert.equal(seen(plan, visitor, prepareSight(plan, held)).seen, true);
    assert.equal(planWithOpenDoors(plan, held).doors[0].closed, false);
    assert.equal(plan.doors[0].closed, true);
    // Somebody else in the room is seen through the door the visitor holds open.
    assert.equal(seen(plan, standing(5.5, 2), prepareSight(plan, held)).seen, true);
    // Further than an arm's length away the door is closed again.
    const gone = doorsHeldOpen(plan, [standing(4 + doorReach + .2, 2)]);
    assert.equal(gone.size, 0);
    assert.equal(planWithOpenDoors(plan, gone), plan);
    assert.equal(seen(plan, standing(5.5, 2), prepareSight(plan, gone)).seen, false);
    // An open door needs nobody to hold it.
    assert.equal(doorsHeldOpen(home(), [visitor]).size, 0);
});

test('a wall drawn inside a room stops the radar as well', () => {
    const plan = home();
    plan.walls = [{ id: 'divider', x: 1, y: 0, endX: 1, endY: 3 }];
    assert.equal(seen(plan, standing(.5, 1)).seen, false);
    // Around the end of the wall the radar still sees.
    assert.equal(seen(plan, standing(.5, 3.7)).seen, true);
    plan.walls = [];
    assert.equal(seen(plan, standing(.5, 1)).seen, true);
});

test('the wall above a door keeps a ceiling radar from looking far into the next room', () => {
    // Right beside the door the radar looks down steeply and the frame is in the way.
    const close = home({ sensor: { x: 3.8, y: 2 } });
    assert.equal(seen(close, standing(4.1, 2)).seen, true);
    assert.equal(seen(close, standing(5.5, 2)).seen, false);
    // From further back it looks under the frame.
    const back = home({ sensor: { x: 2, y: 2 } });
    assert.equal(seen(back, standing(5.5, 2)).seen, true);
    // A radar on the wall hangs below the frame and is not held back by it.
    const sight = prepareSight(close);
    assert.equal(sightBlocked(sight, { x: 3.8, y: 2, z: 1.4 }, { x: 7, y: 2, z: 1.35 }), false);
    assert.equal(sightBlocked(sight, { x: 3.8, y: 2, z: 2.6 }, { x: 7, y: 2, z: 1.35 }), true);
    assert.ok(doorHeight > 1.9 && doorHeight < 2.3);
});

test('a door opens both faces of a thick wall drawn as two lines', () => {
    const plan = home();
    // The right room starts 15 cm further on: the wall between the rooms has two faces.
    plan.rooms[1] = room('right', 4.15);
    assert.equal(seen(plan, standing(4.8, 2)).seen, true);
    assert.equal(seen(plan, standing(4.8, .5)).seen, false);
    plan.doors[0].closed = true;
    assert.equal(seen(plan, standing(4.8, 2)).seen, false);
});

test('the floor a radar can see reaches through the door and nowhere else', () => {
    const plan = home();
    const origin = { x: 2, y: 2 };
    const seenFloor = sightPolygon(prepareSight(plan), origin, { height: 1.4 });
    assert.ok(inside(seenFloor, 1, 1));
    assert.ok(inside(seenFloor, 3.9, 3.9));
    assert.ok(inside(seenFloor, 6, 2));
    assert.ok(!inside(seenFloor, 6, .5));
    assert.ok(!inside(seenFloor, 6, 3.6));
    assert.ok(!inside(seenFloor, -1, 2));
    // Closed: the room and nothing more.
    const shut = sightPolygon(prepareSight({ ...plan, doors: [{ ...plan.doors[0], closed: true }] }), origin, { height: 1.4 });
    assert.ok(inside(shut, 3.9, 2));
    assert.ok(!inside(shut, 4.5, 2));
    // From the ceiling the view through the door ends where the frame cuts it off.
    const sight = prepareSight(plan);
    const low = sightReach(sight, origin, 0, { height: 1.4 });
    const high = sightReach(sight, origin, 0, { height: 2.6 });
    assert.equal(low, 6);
    assert.ok(high > 2 && high < low, String(high));
    assert.ok(Math.abs(high - 2 * (2.6 - 1.35) / (2.6 - doorHeight)) < 1e-9);
});

test('the coverage map shows what spills through an open door', () => {
    const open = coverageCells(home({ sensor: { x: 2.5, y: 2 } }));
    const shut = coverageCells(home({ sensor: { x: 2.5, y: 2 }, closed: true }));
    const covered = (cells, from) => cells.filter(cell => cell.x >= from && cell.seen).length;
    assert.ok(covered(open, 4) > 0);
    assert.equal(covered(shut, 4), 0);
    // The radar's own room is covered the same either way.
    assert.equal(open.filter(cell => cell.x < 4 && cell.seen).length, shut.filter(cell => cell.x < 4 && cell.seen).length);
});
