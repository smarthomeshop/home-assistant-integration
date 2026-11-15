import test from 'node:test';
import assert from 'node:assert/strict';
import { buildingFormat } from '../src/js/floor-planner-building.mjs';
import { blankPlan } from '../src/js/floor-planner-model.mjs';
import { sensorsByRoom } from '../src/js/floor-planner-order.js';

const room = { id: 'room', name: 'Room', x: 0, y: 0, width: 4, depth: 3, height: 2.7 };
const sensor = { id: 'sensor', model: 'ceilsense-v2', radar: 'combined', x: 2, y: 1.5, angle: 0 };
const floor = (id, level) => ({ id, level, name: id, label: id, plan: { ...blankPlan(id), rooms: [room], sensors: [sensor] } });

test('the sensor overview lists each floor on its own, even when rooms overlap', () => {
    const project = { format: buildingFormat, version: 1, name: 'House', activeFloor: 'ground',
        floors: [floor('ground', 0), floor('upper', 1)] };
    const groups = sensorsByRoom(project);
    assert.deepEqual(groups.map(group => group.name), ['ground · Room', 'upper · Room']);
    // Each floor keeps its own sensor; merged floors would report two on one row.
    assert.deepEqual(groups.map(group => group.rows.map(row => row.quantity)), [[1], [1]]);
});

test('identical sensors in one room share a row, sensors outside rooms are grouped apart', () => {
    const plan = { ...blankPlan('Flat'), rooms: [room],
        sensors: [sensor, { ...sensor, id: 'second', x: 1 }, { ...sensor, id: 'outside', x: 9, y: 9 }] };
    const groups = sensorsByRoom(plan);
    assert.deepEqual(groups.map(group => [group.name, group.rows.map(row => row.quantity)]), [['Room', [2]], [undefined, [1]]]);
});
