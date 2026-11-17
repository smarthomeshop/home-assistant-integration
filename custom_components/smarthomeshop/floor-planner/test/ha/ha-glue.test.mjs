// Tests for the Home Assistant side of the planner (src/ha). They live in their
// own folder because they only make sense next to the integration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    homeAssistantRegistry, plannerDevices, projectFromRooms, withHomeAssistantRegistryLinks,
} from '../../src/ha/ha-rooms.js';
import { saveChanges } from '../../src/ha/ha-save.js';
import { collectLivePresence, radarEntityIds, radarProfiles } from '../../src/ha/ha-live.js';
import { FloorPlanValidationError, floorPlanValidationCopy, floorPlanValidationMessage } from '../../src/ha/safety.js';

const square = (width, depth) => [[0, 0], [width, 0], [width, depth], [0, depth]]
    .map(([x, y], index, corners) => ({ x1: x, y1: y, x2: corners[(index + 1) % 4][0], y2: corners[(index + 1) % 4][1] }));
const living = {
    id: 'living', name: 'Living', walls: square(5000, 4000), house: { x: 0, y: 0, floor: 0, rotationDeg: 0 }, ceilingHeightMm: 2600,
    doors: [{ id: 'door', wallIndex: 0, position: .5, width: 900, openDirection: 'inward' }], windows: [], mirrors: [], furniture: [], zones: [],
    sensors: [{ id: 'source', deviceId: 'radar', x: 100, y: 2000, rotation: 0, heightMm: 1800, mountingMode: 'wall' }],
};

test('Home Assistant area and floor registry ids reach planner devices without generated-id assumptions', () => {
    const registry = homeAssistantRegistry([
        { area_id: 'area-arbitrary-42', name: 'Office', floor_id: 'floor-arbitrary-9' },
    ], [
        { floor_id: 'floor-arbitrary-9', name: 'Upper floor', level: 1 },
    ]);
    const devices = plannerDevices([], [{
        id: 'device-arbitrary-7', name: 'CeilSense', model: 'CeilSense V2', product_type: 'ceilsense',
        area_id: 'area-arbitrary-42',
    }], registry.areas);
    assert.deepEqual(registry, {
        areas: [{ id: 'area-arbitrary-42', name: 'Office', floorId: 'floor-arbitrary-9' }],
        floors: [{ id: 'floor-arbitrary-9', name: 'Upper floor', level: 1 }],
    });
    assert.equal(devices[0].areaId, 'area-arbitrary-42');
    assert.equal(devices[0].floorId, 'floor-arbitrary-9');
});

test('room registry links survive project conversion, old saved plans and a save round trip', () => {
    const linkedRoom = { ...living, haAreaId: 'area-bedroom-uuid', haFloorId: 'floor-upstairs-uuid' };
    const project = projectFromRooms([linkedRoom], []);
    const plannerRoom = project.floors[0].plan.rooms[0];
    assert.equal(plannerRoom.haAreaId, 'area-bedroom-uuid');
    assert.equal(plannerRoom.haFloorId, 'floor-upstairs-uuid');

    const oldProject = structuredClone(project);
    delete oldProject.floors[0].plan.rooms[0].haAreaId;
    delete oldProject.floors[0].plan.rooms[0].haFloorId;
    const migrated = withHomeAssistantRegistryLinks(oldProject, [linkedRoom]);
    assert.equal(migrated.floors[0].plan.rooms[0].haAreaId, 'area-bedroom-uuid');

    const edited = structuredClone(project);
    edited.floors[0].plan.rooms[0].haAreaId = 'area-new-uuid';
    edited.floors[0].plan.rooms[0].haFloorId = 'floor-new-uuid';
    assert.deepEqual(saveChanges(edited, project, [linkedRoom]).changes.map(change => ({
        id: change.id, haAreaId: change.haAreaId, haFloorId: change.haFloorId,
    })), [{ id: 'living', haAreaId: 'area-new-uuid', haFloorId: 'floor-new-uuid' }]);
});

test('a closed door is kept with the room and comes back closed', () => {
    const saved = projectFromRooms([living], []);
    assert.equal(saved.floors[0].plan.doors[0].closed, undefined);
    // Closing the door is a change of the room, and the door record says so.
    const closed = structuredClone(saved);
    closed.floors[0].plan.doors[0].closed = true;
    const [change] = saveChanges(closed, saved, [living]).changes;
    assert.equal(change.doors[0].closed, true);
    assert.equal(change.doors[0].openDirection, 'inward');
    // Loaded again, the door is closed in the planner.
    const stored = { ...living, doors: change.doors };
    const reloaded = projectFromRooms([stored], []);
    assert.equal(reloaded.floors[0].plan.doors[0].closed, true);
    // Opening it removes the mark again instead of storing an open door as a value.
    const opened = structuredClone(reloaded);
    delete opened.floors[0].plan.doors[0].closed;
    const [reopened] = saveChanges(opened, reloaded, [stored]).changes;
    assert.equal(Object.hasOwn(reopened.doors[0], 'closed'), false);
    assert.equal(saveChanges(reloaded, reloaded, [stored]).changes.length, 0);
});

test('a door that left its wall is named in the save error, in every language', () => {
    const saved = projectFromRooms([living], []);
    const project = structuredClone(saved);
    project.floors[0].plan.doors[0].y += 1;
    let caught;
    assert.throws(() => saveChanges(project, saved, [living]), error => (caught = error) instanceof FloorPlanValidationError);
    assert.equal(caught.validationCode, 'opening_off_wall');
    assert.equal(floorPlanValidationMessage(caught, 'nl'), 'Zet elke deur, elk raam en elke spiegel in Living tegen een muur voordat je opslaat.');
    for (const copy of Object.values(floorPlanValidationCopy)) assert.match(copy.opening_off_wall, /\{room\}/);
});

test('radar profiles without aliases or targets still give live presence', () => {
    const profiles = radarProfiles([
        { device_id: 'radar', profile: { tracking_presence_entity_id: 'binary_sensor.radar_presence' } },
        { device_id: 'empty' },
        { device_id: 'odd', profile: {}, aliases: 'radar', targets: [null, { x_entity_id: 'sensor.x' }] },
        null,
    ]);
    assert.deepEqual(profiles.map(profile => profile.device_id), ['radar', 'odd']);
    assert.deepEqual(profiles[1].aliases, []);
    assert.deepEqual(profiles[1].targets, [{ x_entity_id: 'sensor.x' }]);
    assert.deepEqual([...radarEntityIds(profiles)], ['binary_sensor.radar_presence', 'sensor.x']);
    const presence = collectLivePresence([living], profiles, () => ({ state: 'on' }), Date.now(), {}, false);
    assert.equal(presence.linkedSensors, 1);
    assert.equal(presence.rooms[0].occupied, true);
    assert.deepEqual(radarProfiles(undefined), []);
});

test('a radar that two rooms already share does not block saving, a new share does', () => {
    const kitchen = { ...structuredClone(living), id: 'kitchen', name: 'Kitchen', house: { x: 6000, y: 0, floor: 0, rotationDeg: 0 },
        doors: [], sensors: [{ ...living.sensors[0], id: 'kitchen-source' }] };
    const office = { ...structuredClone(living), id: 'office', name: 'Office', house: { x: 12000, y: 0, floor: 0, rotationDeg: 0 },
        doors: [], sensors: [] };
    const rooms = [living, kitchen, office];
    const saved = projectFromRooms(rooms, []);

    const renamed = structuredClone(saved);
    renamed.floors[0].plan.rooms.find(room => room.haRoom === 'office').name = 'Study';
    assert.deepEqual(saveChanges(renamed, saved, rooms).changes.map(change => change.id), ['office']);

    const spread = structuredClone(saved);
    const plan = spread.floors[0].plan;
    const officeRoom = plan.rooms.find(room => room.haRoom === 'office');
    const copy = { ...structuredClone(plan.sensors[0]), id: 'office-copy', haSource: undefined, haRoom: undefined,
        x: officeRoom.x + .5, y: officeRoom.y + .5 };
    plan.sensors.push(copy);
    assert.throws(() => saveChanges(spread, saved, rooms), error => error.validationCode === 'duplicate_device');
});

test('every planner shell explains a high ceiling and labels the estimate', async () => {
    const { readFileSync } = await import('node:fs');
    for (const language of ['en', 'nl', 'de', 'fr', 'es']) {
        const html = readFileSync(new URL(`../../src/ha/shells/${language}.html`, import.meta.url), 'utf8');
        const copy = JSON.parse(html.match(/id="fp-copy">([\s\S]*?)<\/script>/)[1]);
        assert.match(copy.height_estimate, /:low/, language);
        assert.match(copy.height_estimate, /:high/, language);
        assert.ok(copy.coverage_estimate, language);
        assert.doesNotMatch(copy.height_estimate, /[–—‘’“”…]/, language);
    }
});
