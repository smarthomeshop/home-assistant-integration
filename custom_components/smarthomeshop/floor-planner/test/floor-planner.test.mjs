import assert from 'node:assert/strict';
import test from 'node:test';
import { furnitureCatalog, furnitureFootprint, furnitureProjection, withFurniture } from '../src/js/floor-planner-furniture.mjs';
import { contains, demoPlan, guidePlanForRoom, installationsFor, radarsFor, readDemo, roomForDevice, samplePlan, validPlan } from '../src/js/floor-planner-model.mjs';
import { personAt, solidWalls } from '../src/js/floor-planner-person.mjs';
import { createWalkNetwork } from '../src/js/floor-planner-walk-route.mjs';

const names = {
    demo: 'Kamer uit de demo', room: 'Kamer', sample: 'Voorbeeldwoning',
    living: 'Woonkamer', kitchen: 'Keuken', office: 'Werkkamer', hall: 'Hal', bedroom: 'Slaapkamer',
};

test('demo dimensions and both radar profiles transfer to an editable plan', () => {
    assert.equal(readDemo('?width=0&depth=5&height=2.7&radar=ld2412'), null);
    assert.equal(readDemo('?width=8&depth=5&height=2.7&radar=ld2450'), null);
    const room = readDemo('?width=8&depth=5&height=2.7&radar=combined');
    const plan = demoPlan({ ...room, positions: [{ x: .25, y: .5 }, { x: .75, y: .5, rotated: true }] }, names);
    assert.equal(validPlan(plan), true);
    assert.deepEqual(plan.sensors.map(({ x, y, angle, radar }) => [x, y, angle, radar]),
        [[2, 2.5, 0, 'combined'], [6, 2.5, 90, 'combined']]);
    const fromGuide = readDemo('?width=16&depth=5&height=1.9&radar=ld2412&obstacles=1');
    const largerPlan = demoPlan(fromGuide, names);
    assert.equal(validPlan(largerPlan), true);
    assert.equal(largerPlan.rooms[0].obstacles, true);
    assert.equal(largerPlan.rooms[0].height, 1.9);
    assert.equal(readDemo('?width=61&depth=5&height=1.9&radar=ld2412'), null);
});

test('a wall sensor uses the room it faces, including on a shared wall', () => {
    const { rooms } = samplePlan(names);
    const sensor = { model: 'ultimatesensor-v2', x: 6.5, y: 2, angle: 90 };
    assert.equal(roomForDevice(rooms, sensor).id, 'kitchen');
    assert.equal(roomForDevice(rooms, { ...sensor, angle: 270 }).id, 'living');
});

test('the furnished example faces tables and desks and connects all five rooms on foot', () => {
    const labels = Object.fromEntries(Object.keys(furnitureCatalog).map(kind => [kind, kind]));
    const plan = withFurniture(samplePlan(names), labels);
    assert.equal(validPlan(plan), true);
    const roomItems = id => plan.furniture.filter(item => contains(plan.rooms.find(room => room.id === id), item));
    const item = (room, kind) => roomItems(room).find(item => item.kind === kind);
    const faces = (seat, target) => {
        const [x, y] = furnitureProjection(seat)([0, 1]);
        const dx = target.x - seat.x;
        const dy = target.y - seat.y;
        return ((x - seat.x) * dx + (y - seat.y) * dy) / Math.hypot(dx, dy) > .9;
    };
    const coffee = item('living', 'coffee');
    assert.ok(faces(item('living', 'sofa'), coffee));
    assert.ok(faces(item('living', 'armchair'), coffee));
    const dining = item('kitchen', 'dining');
    const chairs = roomItems('kitchen').filter(item => item.kind === 'chair');
    assert.equal(chairs.length, 2);
    assert.ok(chairs.every(chair => faces(chair, dining)));
    assert.ok(chairs.some(chair => chair.y < dining.y) && chairs.some(chair => chair.y > dining.y));
    assert.ok(faces(item('office', 'chair'), item('office', 'desk')));
    for (const furniture of plan.furniture) {
        const room = plan.rooms.find(room => contains(room, furniture));
        assert.ok(furnitureFootprint(furniture).every(([x, y]) => contains(room, { x, y })), furniture.id);
    }
    const network = createWalkNetwork(plan, solidWalls(plan));
    const start = network.startAt(personAt(plan.rooms[0]));
    for (const room of plan.rooms) {
        const route = network.routeToActivity(start, nodes => {
            const approach = nodes.find(node => node.room === room);
            return approach ? { approach } : null;
        });
        assert.equal(route?.points.at(-1)?.room.id, room.id);
    }
});

test('a malformed or incompatible imported plan cannot replace the current project', () => {
    const sample = samplePlan(names);
    assert.equal(validPlan(sample), true);
    assert.equal(radarsFor('ceilsense-v2').includes('ld2450'), false);
    assert.equal(validPlan({ ...sample, sensors: [{ ...sample.sensors[0], radar: 'ld2450' }] }), false);
    assert.equal(validPlan({ ...sample, sensors: [{ ...sample.sensors[0], model: '__proto__' }] }), false);
    assert.equal(validPlan({ ...sample, sensors: [sample.sensors[0], sample.sensors[0]] }), false);
});

test('WallSense and installation choices remain compatible with existing saved plans', () => {
    const plan = samplePlan(names);
    assert.equal(validPlan(plan), true);
    assert.deepEqual(radarsFor('wallsense'), ['ld2450']);
    assert.deepEqual(installationsFor('wallsense'), ['wall-recessed']);
    const sensor = plan.sensors.find(item => item.model === 'wallsense');
    assert.equal(validPlan({ ...plan, sensors: [{ ...sensor, installation: 'ceiling-recessed' }] }), false);
    assert.equal(validPlan({ ...plan, sensors: [{ ...sensor, installation: undefined }] }), true);
});

test('choice help receives the selected room, positions, radar and wall uncertainty', () => {
    const plan = samplePlan(names);
    const room = plan.rooms[0];
    plan.rooms[0].obstacles = false;
    plan.walls.push({ id: 'divider', x: -1, y: 2, endX: 8, endY: 2 });
    plan.sensors.push({ ...plan.sensors[0], id: 'other-v2', x: 4.5, y: 2, angle: 90 });
    const advice = guidePlanForRoom(plan, room);
    assert.equal(advice.count, 2);
    assert.equal(advice.obstacles, true);
    assert.deepEqual(advice.positions.map(({ rotated }) => rotated), [false, true]);

    plan.walls[0].y = plan.walls[0].endY = 0;
    assert.equal(guidePlanForRoom(plan, room).obstacles, false);
    plan.sensors.at(-1).radar = 'ld2460';
    assert.deepEqual(guidePlanForRoom(plan, room), { reason: 'radars' });
    assert.deepEqual(guidePlanForRoom(plan, { ...room, width: 20 }), { reason: 'dimensions' });
});
