import test from 'node:test';
import assert from 'node:assert/strict';
import { buildingFormat, localizeSampleRooms, moveRoomToFloor, rotatedRoom, sampleBuilding, snapRoomOffset, validProject } from '../src/js/floor-planner-building.mjs';
import { paintFloorCoverage } from '../src/js/floor-planner-beam.mjs';
import { paintPlan } from '../src/js/floor-planner-drawing.mjs';
import { furnitureCatalog } from '../src/js/floor-planner-furniture.mjs';
import { importRoomGeometry } from '../src/js/floor-planner-import.mjs';
import { paintMaquette } from '../src/js/floor-planner-maquette.mjs';
import { blankPlan, samplePlan, validPlan } from '../src/js/floor-planner-model.mjs';
import { personAt, personSignals, solidWalls } from '../src/js/floor-planner-person.mjs';
import { demoStairForeground, demoWalkSequence } from '../src/js/floor-planner-preview.mjs';
import { defaultSpaceCamera, paintBuilding, projectSpace } from '../src/js/floor-planner-space.mjs';
import { floorStackHeight, paintStairOpening, stairPoint, stairSafeStart, stairTrip, stairWalls } from '../src/js/floor-planner-stairs.mjs';
import { createWalkNetwork } from '../src/js/floor-planner-walk-route.mjs';

const room = { id: 'room', name: 'Room', x: 0, y: 0, width: 4, depth: 3, height: 2.7 };
const sensor = { id: 'sensor', model: 'ceilsense-v2', radar: 'combined', x: 2, y: 1.5, angle: 0 };
const ground = {
    ...blankPlan('House'), version: 3, rooms: [room], sensors: [sensor],
    windows: [{ id: 'window', roomId: room.id, x: 1, y: 0, angle: 0, width: 1, base: .9, height: 1.1 }],
    zones: [{ id: 'zone', roomId: room.id, sensorId: sensor.id, type: 'exclusion', name: 'Test',
        parts: [[[1, 1], [3, 1], [3, 2], [1, 2]]] }],
};
const floor = (id, level, plan) => ({ id, level, name: null, label: id, plan });
test('the demowalker masks the stairs only when passing the camera-facing side', () => {
    const { staircase } = sampleBuilding({}, {});
    const atDefaultAngle = demoStairForeground(staircase);
    const fromOppositeAngle = demoStairForeground(staircase, { ...defaultSpaceCamera, yaw: Math.PI });
    assert.equal(atDefaultAngle({ x: 6.5, y: 5.61 }), true);
    assert.equal(atDefaultAngle({ x: 5.8, y: 7.25 }), true);
    assert.equal(atDefaultAngle({ x: 5.1, y: 5.61 }), false);
    assert.equal(atDefaultAngle({ x: 5.8, y: 5.7 }), false);
    assert.equal(atDefaultAngle({ x: 8.25, y: 1.7 }), false);
    assert.equal(fromOppositeAngle({ x: 5.1, y: 5.61 }), true);
    assert.equal(fromOppositeAngle({ x: 6.5, y: 5.61 }), false);
});

const house = (first = ground, second = blankPlan('House')) => ({
    format: buildingFormat, version: 1, name: 'House', activeFloor: 'ground',
    floors: [floor('ground', 0, first), floor('upper', 1, second)],
});

test('older demo rooms use the visitor language across floors while custom names stay as saved', () => {
    const nl = { sample: 'Voorbeeldwoning', living: 'Woonkamer', kitchen: 'Keuken', office: 'Werkkamer', hall: 'Hal', bedroom: 'Slaapkamer' };
    const en = { sample: 'Example home', living: 'Living room', kitchen: 'Kitchen', office: 'Office', hall: 'Hall', bedroom: 'Bedroom' };
    const demo = samplePlan(nl);
    demo.rooms = demo.rooms.map(({ useSampleName, ...room }) =>
        room.id === 'office' ? { ...room, name: 'Office' } : room);
    const building = house(demo);
    const project = moveRoomToFloor(building, demo.rooms.find(room => room.id === 'bedroom'), 'upper');
    const localized = localizeSampleRooms(project, en, [nl, en]);
    assert.ok(validProject(localized));
    assert.equal(localized.activeFloor, 'upper');
    assert.deepEqual(localized.floors[0].plan.rooms.map(room => [room.name, room.useSampleName]),
        [['Living room', true], ['Kitchen', true], ['Office', false], ['Hall', true]]);
    assert.equal(localized.floors[1].plan.rooms[0].name, 'Bedroom');
    assert.equal(localized.floors[1].plan.rooms[0].ceiling.high, 3.8);
    assert.deepEqual(localized.floors[0].plan.sensors, project.floors[0].plan.sensors);
    assert.equal(localizeSampleRooms(localized, nl, [nl, en]).floors[0].plan.rooms[2].name, 'Office');

    const ownPlan = { ...blankPlan('My apartment'), rooms: [{ ...room, id: 'living', name: 'Woonkamer' }] };
    assert.deepEqual(localizeSampleRooms(ownPlan, en, [nl, en]), ownPlan);
});

test('the furnished demo has a reachable stairway connecting both floors', () => {
    const names = { sample: 'Demo home', living: 'Living room', kitchen: 'Kitchen', office: 'Office', hall: 'Hall', bedroom: 'Guest bedroom',
        'main-bedroom': 'Main bedroom', 'child-bedroom': 'Child’s bedroom', bathroom: 'Bathroom', landing: 'Landing', study: 'Study' };
    const furniture = Object.fromEntries(Object.keys(furnitureCatalog).map(kind => [kind, kind]));
    const demo = sampleBuilding(names, furniture);
    assert.ok(validProject(demo));
    assert.equal(stairTrip(demo).to.id, 'upper');
    assert.equal(stairTrip({ ...demo, activeFloor: 'upper' }).to.id, 'ground');
    assert.equal(validProject({ ...demo, staircase: { ...demo.staircase, upper: 'missing' } }), false);
    for (const { id, level, plan } of demo.floors) {
        const network = createWalkNetwork(plan, [...solidWalls(plan), ...stairWalls(demo.staircase)]);
        const landing = stairPoint(demo.staircase, level, .21);
        assert.ok(network.startAt(landing));
        for (const room of plan.rooms) {
            const start = network.startAt(stairSafeStart(stairTrip({ ...demo, activeFloor: id }), personAt(room)));
            assert.ok(start && network.routeTo(start, landing)?.length, room.id);
        }
    }
    const scene = paintBuilding(demo.floors.map(floor => ({ ...floor, label: floor.id })), defaultSpaceCamera, 1, demo.staircase);
    assert.equal((scene.markup.match(/class="fp-stair-tread"/g) ?? []).length, 13);
    const mask = scene.markup.match(/<mask id="fp-stair-occlusion-upper"[^>]*>([\s\S]*?)<\/mask>/)[1];
    assert.match(mask, /<g fill="black"><polygon/);
    const project = (point, height) => projectSpace(point, height, defaultSpaceCamera);
    const opening = paintStairOpening(demo.staircase, project, floorStackHeight(1, 0, 1));
    const openingPoints = opening.match(/points="([^"]+)"/)[1];
    assert.ok(mask.includes(`<g fill="white"><polygon class="" points="${openingPoints}"`));
    assert.match(scene.markup, /mask="url\(#fp-stair-occlusion-upper\)"><polygon class="fp-stair-/);
    assert.match(scene.markup, /<g data-stair-rail="" mask="url\(#fp-stair-occlusion-upper\)">[\s\S]*?<\/g><line/);
    const frontDoor = demo.floors[0].plan.doors.at(-1);
    assert.ok(Math.hypot(frontDoor.x + frontDoor.width / 2 - demo.staircase.bottom.x,
        frontDoor.y - demo.staircase.bottom.y) > 1.3);
    const study = demo.floors[1].plan.furniture.filter(item => item.x > 7 && item.y > 4.5);
    const desk = study.find(item => item.kind === 'desk');
    const chair = study.find(item => item.kind === 'chair');
    assert.equal(chair.angle, 180);
    assert.ok(chair.y - chair.depth / 2 > desk.y + desk.depth / 2);

    const route = demoWalkSequence(demo.floors, demo.staircase);
    assert.deepEqual(route.filter(leg => leg.stair).map(leg => leg.up), [true, false]);
    assert.deepEqual(route[0].from, route.at(-1).to);
    const triggered = new Set(route.filter(leg => !leg.stair).flatMap(leg =>
        personSignals(leg.floor.plan, { ...leg.to, pose: 'standing', moving: true })
            .filter(reading => reading.seen).map(reading => reading.item.id)));
    for (const sensorId of ['ceil-kitchen', 'ceil-living', 'wall-hall', 'upper-study']) {
        assert.ok(triggered.has(sensorId), sensorId);
    }
});

test('a room can rotate and change floors with its sensor, windows and zone ownership intact', () => {
    const rotated = rotatedRoom(ground, room);
    assert.equal(rotated.rooms[0].width, 3);
    assert.equal(rotated.windows[0].angle, 90);
    assert.equal(rotated.sensors[0].angle, 90);
    assert.equal(rotated.zones[0].sensorId, sensor.id);
    const project = moveRoomToFloor(house(rotated), rotated.rooms[0], 'upper');
    assert.ok(validProject(project));
    assert.equal(project.activeFloor, 'upper');
    assert.equal(project.floors[0].plan.rooms.length, 0);
    assert.equal(project.floors[0].plan.sensors.length, 0);
    assert.deepEqual(project.floors[1].plan.zones, rotated.zones);
    assert.deepEqual(project.floors[1].plan.windows, rotated.windows);
    assert.equal(ground.rooms[0].width, 4);
});

test('consecutive rooms can move to the same floor after switching the selected room (issue 10)', () => {
    const secondRoom = { ...room, id: 'second-room', name: 'Second room', x: 5 };
    const secondSensor = { ...sensor, id: 'second-sensor', x: 7 };
    const source = { ...ground, rooms: [room, secondRoom], sensors: [sensor, secondSensor], windows: [], zones: [] };
    const firstMove = moveRoomToFloor(house(source), room, 'upper');
    assert.equal(firstMove.activeFloor, 'upper');
    const selectedOnGround = { ...firstMove, activeFloor: 'ground' };
    const remaining = selectedOnGround.floors[0].plan.rooms.find(entry => entry.id === 'second-room');
    const secondMove = moveRoomToFloor(selectedOnGround, remaining, 'upper');
    assert.ok(validProject(secondMove));
    assert.equal(secondMove.activeFloor, 'upper');
    assert.deepEqual(secondMove.floors[0].plan.rooms, []);
    assert.deepEqual(secondMove.floors[1].plan.rooms.map(entry => entry.id).sort(), ['room', 'second-room']);
    assert.deepEqual(secondMove.floors[1].plan.sensors.map(entry => entry.id).sort(), ['second-sensor', 'sensor']);
});

test('the demo kitchen window clears the counter and 3D keeps a lower exterior wall on the viewing side', () => {
    const demo = sampleBuilding({ sample:'Demo home', kitchen:'Kitchen' }, {});
    const floor = demo.floors[0].plan;
    const kitchen = floor.rooms.find(room => room.id === 'kitchen');
    const counter = floor.furniture.find(item => item.kind === 'island');
    const plan = { ...blankPlan('Kitchen'), rooms:[kitchen], furniture:[counter] };
    const heights = [];
    const { markup } = paintMaquette(plan, ([x, y], z = 0) => {
        heights.push(z);
        return [x - y / 2, z];
    }, ([x, y]) => .42 * (x + y), [1, 1, 1]);
    const panes = [...markup.matchAll(/points="([^"]+)" class="fp-model-window(?: fp-depth-fragment)?"/g)];
    const paneHeights = panes.flatMap(([, points]) => points.split(' ').map(point => Number(point.split(',')[1])));
    assert.ok(Math.min(...paneHeights) > counter.base + counter.height);
    assert.ok(Math.max(...paneHeights) > 2.1 && Math.max(...paneHeights) < 2.2);
    assert.ok(heights.includes(.43));
    assert.ok(heights.some(height => height > 2.2));
});

test('separate floor planes keep overlapping room coordinates apart', () => {
    const project = house(ground, { ...blankPlan('Upstairs'), rooms: [room], sensors: [sensor] });
    assert.ok(validProject(project));
    const scene = paintBuilding(project.floors, defaultSpaceCamera);
    assert.equal((scene.markup.match(/data-building-floor=/g) ?? []).length, 2);
    assert.equal((scene.markup.match(/id="fp-space-grid"/g) ?? []).length, 1);
    assert.notEqual(scene.viewBox, paintBuilding(project.floors, defaultSpaceCamera, 1.8).viewBox);
    assert.deepEqual(snapRoomOffset(room, [{ ...room, id: 'next', x: 4 }], .09, 0), { x: 0, y: 0 });
});

test('stacked floors render their own cones and wall sectors even with matching sensor IDs', () => {
    const plan = { ...ground, sensors: [...ground.sensors,
        { id: 'wall-sensor', model: 'wallsense', radar: 'ld2450', x: 2, y: 2.8, angle: 0 }] };
    const project = house(plan, plan);
    const markup = paintBuilding(project.floors, defaultSpaceCamera, 1, null, paintFloorCoverage).markup;
    const ids = [...markup.matchAll(/<(?:linearGradient|clipPath) id="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(ids.filter(id => id.startsWith('fp-floor-clip-')).sort(), ['fp-floor-clip-ground', 'fp-floor-clip-upper']);
    assert.equal(ids.filter(id => !id.startsWith('fp-floor-clip-')).length, 6);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.ok(markup.includes(`url(#${id})`));
    assert.equal((markup.match(/class="fp-beam-rim[^"]*"\s+data-profile=/g) ?? []).length, 6);
    assert.equal((markup.match(/class="fp-wall-sector"/g) ?? []).length, 4);
});

test('exclusion zones suppress tracking only and room measurements match the geometry', () => {
    assert.ok(validPlan(ground));
    const signals = personSignals(ground, { x: 2, y: 1.5, pose: 'standing' })[0].signals;
    assert.deepEqual(signals.map(signal => [signal.mode, signal.seen, signal.exclusion?.id]),
        [['xyz', false, 'zone'], ['presence', true, undefined]]);
    const svg = paintPlan(ground, true, room.id, new Intl.NumberFormat('en'), null, { measures: true });
    assert.equal((svg.match(/class="fp-wall-measure"/g) ?? []).length, 4);
    assert.match(svg, /fp-opening windows/);
    assert.match(svg, /fp-plan-zone exclusion/);
});

test('Home Assistant imports geometry and zones without persisting real device bindings or calibration', () => {
    const raw = {
        format: 'smarthomeshop-room', schemaVersion: 1,
        room: {
            name: 'Legacy', walls: [{ x1: 0, y1: 0 }, { x1: 4000, y1: 0 }, { x1: 4000, y1: 3000 }, { x1: 0, y1: 3000 }],
            house: { x: 4000, y: 0, rotationDeg: 90, floor: 1 },
            windows: [{ wallIndex: 0, position: .5, width: 1200, height: 1100 }],
            zones: [
                { name: 'Line', type: 'entry', points: [{ x: 1000, y: 1000 }, { x: 2000, y: 1000 }], inDirection: 'left' },
                { name: 'Owned', type: 'exclusion', points: [{ x: 500, y: 500 }, { x: 900, y: 500 }, { x: 900, y: 900 }], sensorId: 'physical-radar' },
            ],
            sensors: [{ deviceId: 'physical-radar' }], calibration: { enabled: true },
        },
    };
    const { project, review } = importRoomGeometry(raw, { room: 'Room', import_room_name: 'Imported', furniture_items: {} });
    assert.ok(validProject(project));
    const imported = project.floors[0].plan;
    assert.equal(project.floors[0].level, 1);
    assert.equal(imported.windows[0].angle, 90);
    assert.equal(imported.zones[0].direction, 'left');
    // A zone that belonged to one radar is dropped rather than turned into a
    // shared zone, and the import asks for a review.
    assert.deepEqual(imported.zones.map(zone => zone.name), ['Line']);
    assert.equal(review, true);
    assert.equal(imported.sensors.length, 0);
    assert.doesNotMatch(JSON.stringify(project), /physical-radar|calibration/);
});
