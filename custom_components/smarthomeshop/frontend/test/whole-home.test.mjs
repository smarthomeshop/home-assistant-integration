import test from 'node:test';
import assert from 'node:assert/strict';
import { collectHomePresence, placeHomeRooms, resetCanvasTransform, transformHomePoint } from '../src/utils/whole-home.ts';

const room = (id, deviceId, house) => ({
  id,
  name: id,
  walls: [
    { x1: -2000, y1: -1500, x2: 2000, y2: -1500 },
    { x1: 2000, y1: -1500, x2: 2000, y2: 1500 },
    { x1: 2000, y1: 1500, x2: -2000, y2: 1500 },
    { x1: -2000, y1: 1500, x2: -2000, y2: -1500 },
  ],
  sensors: [{ deviceId, x: 0, y: -1200, rotation: 90 }],
  zones: [],
  house,
});

const profile = (deviceId, scale = 1) => ({
  device_id: `registry-${deviceId}`,
  entity_prefix: `another-prefix-${deviceId}`,
  aliases: [deviceId],
  profile: {
    coordinate_projection: 'forward_xy',
    coordinate_scale_to_mm: scale,
    tracking_presence_entity_id: `binary_sensor.arbitrary_${deviceId}_presence`,
    tracking_target_count_entity_id: `sensor.arbitrary_${deviceId}_count`,
    supplementary_presence_sensors: [],
  },
  targets: [{ index: 1, x_entity_id: `sensor.custom_${deviceId}_x`, y_entity_id: `sensor.custom_${deviceId}_y` }],
});

test('auto places rooms but preserves configured floors and rotations', () => {
  const rooms = placeHomeRooms([
    room('living', 'living'),
    room('bedroom', 'bedroom', { x: 9000, y: 1000, floor: 1, rotationDeg: 90 }),
  ]);
  assert.equal(rooms[0].house.floor, 0);
  assert.equal(rooms[1].house.floor, 1);
  assert.equal(rooms[1].house.rotationDeg, 90);
  assert.notDeepEqual(rooms[0].house, rooms[1].house);
});

test('places newly discovered rooms beside persisted rooms without overlap', () => {
  const rooms = placeHomeRooms([
    room('saved', 'saved', { x: 8000, y: -1000, floor: 0, rotationDeg: 90 }),
    room('new', 'new'),
  ]);
  assert.deepEqual(rooms[0].house, { x: 8000, y: -1000, floor: 0, rotationDeg: 90, visible: true });
  assert.ok(Math.abs(rooms[1].house.x - rooms[0].house.x) > 3000);
});

test('wraps an entirely generated layout instead of creating one endless row', () => {
  const rooms = placeHomeRooms(Array.from({ length: 6 }, (_, index) => room(`room-${index}`, `device-${index}`)));
  assert.ok(new Set(rooms.map(item => item.house.y)).size > 1);
});

test('transforms room coordinates into the whole-home coordinate frame', () => {
  assert.deepEqual(transformHomePoint({ x: 1000, y: 500 }, { x: 5000, y: 2000, floor: 0, rotationDeg: 90 }), { x: 4500, y: 3000 });
});

test('uses registry profile aliases and arbitrary entity IDs', () => {
  const rooms = placeHomeRooms([room('living', 'living')]);
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.custom_living_x', '400'],
    ['sensor.custom_living_y', '1200'],
  ]);
  const result = collectHomePresence(rooms, [profile('living')], id => states.get(id));
  assert.equal(result.linkedSensors, 1);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, false);
});

test('scales LD2460 metre coordinates and never retains unavailable slots', () => {
  const rooms = placeHomeRooms([room('office', 'office')]);
  const states = new Map([
    ['binary_sensor.arbitrary_office_presence', 'on'],
    ['sensor.arbitrary_office_count', '1'],
    ['sensor.custom_office_x', '0.5'],
    ['sensor.custom_office_y', '1.2'],
  ]);
  const result = collectHomePresence(rooms, [profile('office', 1000)], id => states.get(id));
  assert.equal(result.people.length, 1);
  states.set('sensor.custom_office_x', 'NaN');
  states.set('sensor.custom_office_y', 'unavailable');
  const cleared = collectHomePresence(rooms, [profile('office', 1000)], id => states.get(id));
  assert.equal(cleared.people.length, 1);
  assert.equal(cleared.people[0].approximate, true);
  assert.equal(cleared.rooms[0].positioningSensorCount, 0);
});

test('does not invent people when presence is off', () => {
  const rooms = placeHomeRooms([room('hall', 'hall')]);
  const result = collectHomePresence(rooms, [profile('hall')], id => id.includes('presence') ? 'off' : 'unknown');
  assert.equal(result.people.length, 0);
});

test('reports unavailable radar separately from clear rooms', () => {
  const rooms = placeHomeRooms([room('hall', 'hall')]);
  const result = collectHomePresence(rooms, [profile('hall')], () => 'unavailable');
  assert.equal(result.linkedSensors, 1);
  assert.equal(result.liveSensors, 0);
  assert.equal(result.unavailableSensors, 1);
  assert.equal(result.rooms[0].available, false);
  assert.equal(result.rooms[0].positioningSensorCount, 0);
});

test('resets the retained HiDPI canvas transform on every draw', () => {
  const calls = [];
  const context = { setTransform: (...args) => calls.push(args) };
  resetCanvasTransform(context, 2);
  resetCanvasTransform(context, 2);
  assert.deepEqual(calls, [[2, 0, 0, 2, 0, 0], [2, 0, 0, 2, 0, 0]]);
});

test('supplementary occupancy survives a primary off state', () => {
  const rooms = placeHomeRooms([room('hall', 'hall')]);
  const radar = profile('hall');
  radar.profile.supplementary_presence_sensors = ['binary_sensor.hall_pir'];
  const result = collectHomePresence(rooms, [radar], id => id === 'binary_sensor.hall_pir' ? 'on' : id.includes('presence') ? 'off' : 'unknown');
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].occupied, true);
});

test('places approximate presence inside a narrow concave room', () => {
  const concave = room('hall', 'hall');
  concave.walls = [
    { x1: 0, y1: 0 }, { x1: 4000, y1: 0 }, { x1: 4000, y1: 500 },
    { x1: 500, y1: 500 }, { x1: 500, y1: 4000 }, { x1: 0, y1: 4000 },
  ];
  const radar = profile('hall');
  radar.profile.positioning_available = false;
  radar.targets = [];
  const rooms = placeHomeRooms([concave]);
  const result = collectHomePresence(rooms, [radar], id => id.includes('presence') ? 'on' : 'unknown');
  const person = result.people[0];
  assert.ok(person.x < 500 || person.y < 500);
});

test('supplementary occupancy survives a suppressed exact target', () => {
  const rooms = placeHomeRooms([room('hall', 'hall')]);
  const radar = profile('hall');
  radar.profile.supplementary_presence_sensors = ['binary_sensor.hall_pir'];
  const states = new Map([
    ['binary_sensor.arbitrary_hall_presence', 'on'], ['binary_sensor.hall_pir', 'on'],
    ['sensor.arbitrary_hall_count', '1'], ['sensor.custom_hall_x', '0'], ['sensor.custom_hall_y', '9000'],
  ]);
  const result = collectHomePresence(rooms, [radar], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
});

test('does not revive an excluded coordinate as approximate presence', () => {
  const reflected = room('mirror', 'mirror');
  reflected.zones = [{ type: 'exclusion', points: [
    { x: -200, y: 800 }, { x: 600, y: 800 }, { x: 600, y: 1600 }, { x: -200, y: 1600 },
  ] }];
  const rooms = placeHomeRooms([reflected]);
  const states = new Map([
    ['binary_sensor.arbitrary_mirror_presence', 'on'],
    ['sensor.arbitrary_mirror_count', '1'],
    ['sensor.custom_mirror_x', '2500'],
    ['sensor.custom_mirror_y', '500'],
  ]);
  const result = collectHomePresence(rooms, [profile('mirror')], id => states.get(id));
  assert.equal(result.people.length, 0);
  assert.equal(result.rooms[0].occupied, false);
});

test('maximizes equal-sized radar matches independent of sensor and target order', () => {
  const sensorA = { deviceId: 'a', x: 0, y: -1200, rotation: 90 };
  const sensorB = { deviceId: 'b', x: 0, y: -1200, rotation: 90 };
  const a = profile('a');
  a.targets = [
    { index: 1, x_entity_id: 'sensor.a_x1', y_entity_id: 'sensor.a_y1' },
    { index: 2, x_entity_id: 'sensor.a_x2', y_entity_id: 'sensor.a_y2' },
  ];
  const b = profile('b');
  b.targets = [
    { index: 1, x_entity_id: 'sensor.b_x1', y_entity_id: 'sensor.b_y1' },
    { index: 2, x_entity_id: 'sensor.b_x2', y_entity_id: 'sensor.b_y2' },
  ];
  const states = new Map([
    ['binary_sensor.arbitrary_a_presence', 'on'], ['sensor.arbitrary_a_count', '2'],
    ['binary_sensor.arbitrary_b_presence', 'on'], ['sensor.arbitrary_b_count', '2'],
    ['sensor.a_x1', '0'], ['sensor.a_y1', '1000'], ['sensor.a_x2', '600'], ['sensor.a_y2', '1000'],
    ['sensor.b_x1', '500'], ['sensor.b_y1', '1000'], ['sensor.b_x2', '1100'], ['sensor.b_y2', '1000'],
  ]);
  for (const sensors of [[sensorA, sensorB], [sensorB, sensorA]]) {
    for (const profiles of [[a, b], [{ ...b, targets: [...b.targets].reverse() }, { ...a, targets: [...a.targets].reverse() }]]) {
      const testRoom = room('office', null);
      testRoom.sensors = sensors;
      const result = collectHomePresence(placeHomeRooms([testRoom]), profiles, id => states.get(id));
      assert.equal(result.people.length, 2);
    }
  }
});
