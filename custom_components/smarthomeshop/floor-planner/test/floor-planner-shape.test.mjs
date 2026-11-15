import assert from 'node:assert/strict';
import test from 'node:test';

import { adviseRoom, defaultAdvice } from '../src/js/floor-planner-advice.mjs';
import { paintPlan } from '../src/js/floor-planner-drawing.mjs';
import { outlineBounds, roomArea, roomContainsLine, roomCorners, roomLineSpans } from '../src/js/floor-planner-geometry.mjs';
import { blankPlan, contains, guidePlanForRoom, hasInteriorWall, validPlan } from '../src/js/floor-planner-model.mjs';
import { personAt, personSignals, solidWalls } from '../src/js/floor-planner-person.mjs';
import { defaultSpaceCamera, paintSpace } from '../src/js/floor-planner-space.mjs';
import { createWalkNetwork } from '../src/js/floor-planner-walk-route.mjs';

const outline = [[0, 0], [5, 0], [6, 1], [6, 2], [2, 2], [2, 6], [0, 6]];
const makeRoom = points => ({ ...outlineBounds(points), id: 'shape', name: 'Angled L', height: 2.7 });
const wall = (x, y, endX, endY) => ({ x, y, endX, endY });

test('the versioned model preserves older rectangles and validates polygon winding and edges', () => {
    const plan = blankPlan('Geometry');
    plan.rooms = [{ id: 'legacy', name: 'Legacy', x: -2, y: -3, width: 6.25, depth: 3.5, height: 2.7 }];
    assert.ok(validPlan(plan));
    assert.equal(plan.version, 1);
    assert.equal(roomArea(plan.rooms[0]), 21.875);
    assert.deepEqual(roomCorners(plan.rooms[0]), [[-2, -3], [4.25, -3], [4.25, .5], [-2, .5]]);
    plan.rooms.push(makeRoom([...outline].reverse()));
    assert.equal(validPlan(plan), false);
    plan.version = 2;
    assert.ok(validPlan(JSON.parse(JSON.stringify(plan))));
    assert.equal(roomArea(plan.rooms[1]), 19.5);
    assert.equal(outlineBounds([[0, 0], [5, 4], [0, 4], [5, 0], [7, 2]]), null);
    assert.equal(outlineBounds([[0, 0], [4, 0], [3, 0], [4, 4], [0, 4]]), null);
    assert.ok(outlineBounds([[0, 0], [2, 0], [4, 0], [4, 3], [0, 3]]));
});

test('the notch is outside the floor, radar sight line and interior-wall test', () => {
    const room = makeRoom(outline);
    assert.equal(contains(room, { x: 4, y: 4 }), false);
    const upperWing = { x: 3.2, y: 1.5 }, lowerWing = { x: 1.6, y: 3.1 };
    assert.ok(contains(room, upperWing) && contains(room, lowerWing));
    assert.equal(roomContainsLine(room, upperWing, lowerWing), false);
    assert.equal(roomLineSpans(room, upperWing, lowerWing).length, 2);
    assert.ok(contains(room, personAt(room)));
    assert.equal(hasInteriorWall(room, [wall(2, 2, 2, 5)]), false);
    assert.equal(hasInteriorWall(room, [wall(2.2, 3.2, 5.2, 3.2)]), false);
    assert.equal(hasInteriorWall(room, [wall(.8, 3.2, 5.2, 3.2)]), true);
    const plan = { ...blankPlan('Radar'), version: 2, rooms: [room],
        sensors: [{ id: 'v2', model: 'ceilsense-v2', radar: 'ld2412', angle: 0, ...upperWing }] };
    assert.equal(personSignals(plan, { ...lowerWing, pose: 'standing' })[0].seen, false);
    assert.equal(personSignals(plan, { x: 3.5, y: 1.4, pose: 'standing' })[0].seen, true);
    const advice = adviseRoom(plan, room, { ...defaultAdvice, mount: 'either' });
    assert.ok(advice.choices.length);
    assert.ok(advice.choices.every(choice => choice.sensors.every(item => contains(room, item))));
    assert.deepEqual(guidePlanForRoom(plan, room), { reason: 'shape' });
});

test('2D and 3D share the outline and automatic routes stay inside every segment', () => {
    const room = { ...makeRoom(outline), ceiling: { type: 'gable', high: 3.6, direction: 'x+' } };
    const plan = { ...blankPlan('Shape'), version: 2, rooms: [room] };
    const flat = paintPlan(plan, true, room.id, new Intl.NumberFormat('en'));
    assert.match(flat, /<polygon class="fp-room-floor" points="0,0 5,0 6,1 6,2 2,2 2,6 0,6"/);
    const spatial = paintSpace(plan, defaultSpaceCamera, room.id);
    assert.match(spatial.markup, /class="fp-space-floor selected"/);
    assert.match(spatial.markup, /fp-space-ceiling selected/);
    assert.doesNotMatch(spatial.markup, /NaN|Infinity/);
    const network = createWalkNetwork(plan, solidWalls(plan));
    const start = { x: 1.3, y: 5 };
    const route = network.routeFrom(start, () => .9);
    assert.ok(route.length >= 2);
    assert.ok(route.every((point, i) => roomContainsLine(room, i ? route[i - 1] : start, point)));
});
