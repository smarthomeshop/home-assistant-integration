import test from 'node:test';
import assert from 'node:assert/strict';

import {
  autoArrangeRooms,
  collectWholeHomePresence,
  inverseTransformHomePoint,
  houseLayoutFingerprint,
  overlappingRoomIds,
  roomsWithHousePlacement,
  restoreHouseSnapshot,
  snapHousePlacement,
  transformHomePoint,
} from '../src/utils/whole-home.ts';
import { projectHome3DPoint, WholeHome3DRenderer } from '../src/utils/home3d.ts';

const room = (id, name, offset = {}) => ({
  id,
  name,
  walls: [
    { x1: -2000, y1: -1500, x2: 2000, y2: -1500 },
    { x1: 2000, y1: -1500, x2: 2000, y2: 1500 },
    { x1: 2000, y1: 1500, x2: -2000, y2: 1500 },
    { x1: -2000, y1: 1500, x2: -2000, y2: -1500 },
  ],
  furniture: [], devices: [], zones: [],
  sensors: [{ id: `sensor-${id}`, deviceId: `device-${id}`, x: 0, y: -1200, rotation: 90 }],
  ...offset,
});

const profile = (deviceId, overrides = {}) => ({
  ...overrides,
  device_id: deviceId,
  name: deviceId,
  entity_prefix: `not_the_entity_prefix_${deviceId}`,
  aliases: [`alias-${deviceId}`],
  profile: {
    mounting_mode: 'wall',
    coordinate_projection: 'forward_xy',
    coordinate_scale_to_mm: 1,
    maximum_targets: 3,
    radar_model: 'ld2450',
    metadata_source: 'firmware',
    positioning_available: true,
    supplementary_presence_sensors: [],
    tracking_presence_entity_id: `binary_sensor.arbitrary_${deviceId}_presence`,
    tracking_target_count_entity_id: `sensor.arbitrary_${deviceId}_count`,
    ...(overrides.profile || {}),
  },
  targets: overrides.targets || [{
    index: 1,
    x_entity_id: `sensor.completely_custom_${deviceId}_x`,
    y_entity_id: `sensor.completely_custom_${deviceId}_y`,
  }],
  capabilities: {},
});

const inside = (point, polygon) => {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]; const b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y)
      && point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || Number.EPSILON) + a.x) result = !result;
  }
  return result;
};

test('automatically arranges every room without overlap and keeps floors separate', () => {
  const arranged = autoArrangeRooms([
    room('living', 'Living room'),
    room('kitchen', 'Kitchen'),
    room('bed', 'Bedroom', { house: { x: 0, y: 0, floor: 1, rotationDeg: 0 } }),
  ]);
  assert.equal(arranged.length, 3);
  assert.equal(arranged[2].house.floor, 1);
  assert.notDeepEqual(arranged[0].house, arranged[1].house);
});

test('layout fingerprints distinguish a user movement from an unchanged suggestion', () => {
  const rooms = roomsWithHousePlacement([room('living', 'Living room')]);
  const fingerprint = houseLayoutFingerprint(rooms);
  assert.equal(houseLayoutFingerprint(rooms), fingerprint);
  const moved = rooms.map(item => ({ ...item, house: { ...item.house, x: item.house.x + 250 } }));
  assert.notEqual(houseLayoutFingerprint(moved), fingerprint);
});

test('undo snapshots restore placement without restoring stale room revisions', () => {
  const beforeSave = roomsWithHousePlacement([room('living', 'Living room', {
    updated_at: 'revision-before-save',
    house: { x: 0, y: 0, floor: 0, rotationDeg: 0 },
  })]);
  const current = roomsWithHousePlacement([room('living', 'Living room', {
    updated_at: 'revision-after-save',
    house: { x: 2500, y: 0, floor: 0, rotationDeg: 0 },
  })]);
  const restored = restoreHouseSnapshot(current, beforeSave);
  assert.equal(restored[0].house.x, 0);
  assert.equal(restored[0].updated_at, 'revision-after-save');
});

test('whole-home transforms are reversible at all supported quarter turns', () => {
  for (const rotationDeg of [0, 90, 180, 270]) {
    const placement = { x: 4200, y: -1700, floor: 2, rotationDeg };
    const original = { x: 350, y: -825 };
    const global = transformHomePoint(original, placement);
    const restored = inverseTransformHomePoint(global, placement);
    assert.ok(Math.abs(restored.x - original.x) < 0.0001);
    assert.ok(Math.abs(restored.y - original.y) < 0.0001);
  }
});

test('3D projection keeps heads above and closer than feet across camera elevations', () => {
  for (const elevation of [8, 34, 78]) {
    const camera = { azimuth: 42, elevation, distance: 18000, targetX: 0, targetY: 0, targetZ: 1000 };
    for (const point of [{ x: 0, y: 0 }, { x: 2400, y: -1300 }]) {
      const feet = projectHome3DPoint({ ...point, z: 20 }, camera, 900, 620);
      const head = projectHome3DPoint({ ...point, z: 1650 }, camera, 900, 620);
      assert.ok(head.y < feet.y, `head should be above feet at ${elevation}°`);
      assert.ok(head.depth < feet.depth, `head should be closer at ${elevation}°`);
    }
  }
});

test('camera fitting uses the same separated absolute floor heights as rendering', () => {
  const renderer = new WholeHome3DRenderer();
  const rooms = [10, 11].map(floor => ({
    id: `floor-${floor}`, name: `Floor ${floor}`,
    points: room('shape', 'Shape').walls.map(wall => ({ x: wall.x1, y: wall.y1 })),
    house: { x: 0, y: 0, floor, rotationDeg: 0, visible: true },
    people: 0, occupied: false, approximate: false, available: true, linked: true,
  }));
  renderer.resetCamera(rooms, 1.7);
  const expectedMin = 10 * 3000 * 1.7;
  const expectedMax = 11 * 3000 * 1.7 + 2450;
  assert.equal(renderer.camera.targetZ, (expectedMin + expectedMax) / 2);
  assert.ok(renderer.camera.distance >= (expectedMax - expectedMin) * 1.7);
});

test('a newly discovered room is placed beside saved rooms without moving them', () => {
  const saved = room('living', 'Living', { house: { x: 7500, y: -1000, floor: 0, rotationDeg: 90 } });
  const placed = roomsWithHousePlacement([saved, room('new', 'New room')]);
  assert.deepEqual(placed[0].house, { x: 7500, y: -1000, floor: 0, rotationDeg: 90, visible: true });
  assert.equal(overlappingRoomIds(placed).size, 0);
});

test('collects live people through registry-discovered arbitrary entity IDs', () => {
  const rooms = roomsWithHousePlacement([room('living', 'Living room')]);
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', '500'],
    ['sensor.completely_custom_device-living_y', '1200'],
  ]);
  const result = collectWholeHomePresence(
    rooms,
    [profile('device-living')],
    entityId => states.get(entityId),
  );
  assert.equal(result.linkedSensors, 1);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].roomName, 'Living room');
  assert.equal(result.people[0].approximate, false);
  assert.equal(result.rooms[0].linkedSensorCount, 1);
});

test('applies LD2460 metre scaling and clears missing target slots', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const ld2460 = profile('device-office', {
    profile: { coordinate_scale_to_mm: 1000, maximum_targets: 5, radar_model: 'ld2460' },
    targets: [
      { index: 1, x_entity_id: 'sensor.office_person_x', y_entity_id: 'sensor.office_person_y' },
      { index: 2, x_entity_id: 'sensor.office_missing_x', y_entity_id: 'sensor.office_missing_y' },
    ],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['sensor.arbitrary_device-office_count', '2'],
    ['sensor.office_person_x', '0.5'],
    ['sensor.office_person_y', '1.2'],
    ['sensor.office_missing_x', 'nan'],
    ['sensor.office_missing_y', 'unavailable'],
  ]);
  const result = collectWholeHomePresence(rooms, [ld2460], entityId => states.get(entityId));
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, false);
});

test('uses an honest room-centre marker for presence-only radar firmware', () => {
  const rooms = roomsWithHousePlacement([room('hall', 'Hall')]);
  const presenceOnly = profile('device-hall', {
    profile: { positioning_available: false, maximum_targets: 0 },
    targets: [],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-hall_presence', 'on'],
  ]);
  const result = collectWholeHomePresence(rooms, [presenceOnly], entityId => states.get(entityId));
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].approximate, true);
  assert.equal(result.rooms[0].linkedSensorCount, 1);
});

test('places an approximate marker inside a narrow concave room', () => {
  const concave = room('hall', 'Hall', { walls: [
    { x1: 0, y1: 0 }, { x1: 4000, y1: 0 }, { x1: 4000, y1: 500 },
    { x1: 500, y1: 500 }, { x1: 500, y1: 4000 }, { x1: 0, y1: 4000 },
  ] });
  const rooms = roomsWithHousePlacement([concave]);
  const radar = profile('device-hall', { profile: { positioning_available: false, maximum_targets: 0 }, targets: [] });
  const states = new Map([['binary_sensor.arbitrary_device-hall_presence', 'on']]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id));
  const local = inverseTransformHomePoint(result.people[0], rooms[0].house);
  assert.equal(inside(local, concave.walls.map(wall => ({ x: wall.x1, y: wall.y1 }))), true);
});

test('exclusion polygons suppress reflected targets', () => {
  const reflectedRoom = room('mirror', 'Mirror room', {
    zones: [{
      id: 'exclude', name: 'Reflection', type: 'exclusion', color: '#ef4444',
      points: [{ x: 300, y: 1000 }, { x: 900, y: 1000 }, { x: 900, y: 1600 }, { x: 300, y: 1600 }],
    }],
  });
  const rooms = roomsWithHousePlacement([reflectedRoom]);
  const states = new Map([
    ['binary_sensor.arbitrary_device-mirror_presence', 'on'],
    ['sensor.arbitrary_device-mirror_count', '1'],
    ['sensor.completely_custom_device-mirror_x', '2500'],
    ['sensor.completely_custom_device-mirror_y', '500'],
  ]);
  const result = collectWholeHomePresence(rooms, [profile('device-mirror')], entityId => states.get(entityId));
  assert.equal(result.people.length, 0);
  assert.equal(result.rooms[0].occupied, false);
});

test('supplementary presence remains active when primary radar presence is off', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const radar = profile('device-office', {
    profile: { supplementary_presence_sensors: ['binary_sensor.office_pir'] },
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'off'],
    ['binary_sensor.office_pir', 'on'],
    ['sensor.arbitrary_device-office_count', '0'],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], entityId => states.get(entityId));
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].occupied, true);
});

test('supplementary presence remains visible when an exact reflected target is suppressed', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const radar = profile('device-office', {
    profile: { supplementary_presence_sensors: ['binary_sensor.office_pir'] },
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['binary_sensor.office_pir', 'on'],
    ['sensor.arbitrary_device-office_count', '1'],
    ['sensor.completely_custom_device-office_x', '0'],
    ['sensor.completely_custom_device-office_y', '9000'],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], entityId => states.get(entityId));
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
});

test('separates linked, live and unavailable radar state', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const result = collectWholeHomePresence(rooms, [profile('device-office')], () => 'unavailable');
  assert.equal(result.linkedSensors, 1);
  assert.equal(result.liveSensors, 0);
  assert.equal(result.unavailableSensors, 1);
  assert.equal(result.rooms[0].available, false);
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.rooms[0].positioningSensorCount, 0);
});

test('does not claim exact positioning when presence is live but coordinates are unavailable', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const radar = profile('device-office');
  const result = collectWholeHomePresence(rooms, [radar], entityId => {
    if (entityId.includes('presence')) return 'on';
    if (entityId.includes('count')) return '1';
    return 'unavailable';
  });
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].positioningSensorCount, 0);
});

test('reports a partially offline multi-radar room without claiming offline positioning', () => {
  const mixed = room('office', 'Office', { sensors: [
    { id: 'live', deviceId: 'device-live', x: 0, y: -1200, rotation: 90 },
    { id: 'offline', deviceId: 'device-offline', x: 0, y: -1200, rotation: 90 },
  ] });
  const liveProfile = profile('device-live', { profile: { positioning_available: false }, targets: [] });
  const offlineProfile = profile('device-offline');
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([mixed]),
    [liveProfile, offlineProfile],
    entityId => entityId.includes('device-live') ? 'off' : 'unavailable',
  );
  assert.equal(result.rooms[0].available, true);
  assert.equal(result.rooms[0].liveSensorCount, 1);
  assert.equal(result.rooms[0].unavailableSensorCount, 1);
  assert.equal(result.rooms[0].positioningSensorCount, 0);
});

test('keeps two nearby targets reported by the same radar', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const radar = profile('device-office', {
    targets: [
      { index: 1, x_entity_id: 'sensor.office_x1', y_entity_id: 'sensor.office_y1' },
      { index: 2, x_entity_id: 'sensor.office_x2', y_entity_id: 'sensor.office_y2' },
    ],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['sensor.arbitrary_device-office_count', '2'],
    ['sensor.office_x1', '0'], ['sensor.office_y1', '1000'],
    ['sensor.office_x2', '400'], ['sensor.office_y2', '1000'],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], entityId => states.get(entityId));
  assert.equal(result.people.length, 2);
  assert.equal(result.rooms[0].people, 2);
});

test('deduplicates overlapping radars one-to-one independent of profile order', () => {
  const multiSensorRoom = room('office', 'Office', {
    sensors: [
      { id: 'a', deviceId: 'device-a', x: 0, y: -1200, rotation: 90 },
      { id: 'b', deviceId: 'device-b', x: 0, y: -1200, rotation: 90 },
    ],
  });
  const rooms = roomsWithHousePlacement([multiSensorRoom]);
  const a = profile('device-a', { targets: [{ index: 1, x_entity_id: 'sensor.a_x1', y_entity_id: 'sensor.a_y1' }] });
  const b = profile('device-b', { targets: [
    { index: 1, x_entity_id: 'sensor.b_x1', y_entity_id: 'sensor.b_y1' },
    { index: 2, x_entity_id: 'sensor.b_x2', y_entity_id: 'sensor.b_y2' },
  ] });
  const states = new Map([
    ['binary_sensor.arbitrary_device-a_presence', 'on'], ['sensor.arbitrary_device-a_count', '1'],
    ['binary_sensor.arbitrary_device-b_presence', 'on'], ['sensor.arbitrary_device-b_count', '2'],
    ['sensor.a_x1', '0'], ['sensor.a_y1', '1000'],
    ['sensor.b_x1', '50'], ['sensor.b_y1', '1000'],
    ['sensor.b_x2', '1000'], ['sensor.b_y2', '1000'],
  ]);
  for (const profiles of [[a, b], [b, a]]) {
    const result = collectWholeHomePresence(rooms, profiles, entityId => states.get(entityId));
    assert.equal(result.people.length, 2);
  }
});

test('maximizes equal-sized cross-radar matches independent of sensor and target order', () => {
  const makeRoom = sensors => room('office', 'Office', { sensors });
  const a = profile('device-a', { targets: [
    { index: 1, x_entity_id: 'sensor.a_x1', y_entity_id: 'sensor.a_y1' },
    { index: 2, x_entity_id: 'sensor.a_x2', y_entity_id: 'sensor.a_y2' },
  ] });
  const b = profile('device-b', { targets: [
    { index: 1, x_entity_id: 'sensor.b_x1', y_entity_id: 'sensor.b_y1' },
    { index: 2, x_entity_id: 'sensor.b_x2', y_entity_id: 'sensor.b_y2' },
  ] });
  const states = new Map([
    ['binary_sensor.arbitrary_device-a_presence', 'on'], ['sensor.arbitrary_device-a_count', '2'],
    ['binary_sensor.arbitrary_device-b_presence', 'on'], ['sensor.arbitrary_device-b_count', '2'],
    ['sensor.a_x1', '0'], ['sensor.a_y1', '1000'], ['sensor.a_x2', '600'], ['sensor.a_y2', '1000'],
    ['sensor.b_x1', '500'], ['sensor.b_y1', '1000'], ['sensor.b_x2', '1100'], ['sensor.b_y2', '1000'],
  ]);
  const sensorA = { id: 'a', deviceId: 'device-a', x: 0, y: -1200, rotation: 90 };
  const sensorB = { id: 'b', deviceId: 'device-b', x: 0, y: -1200, rotation: 90 };
  for (const sensors of [[sensorA, sensorB], [sensorB, sensorA]]) {
    for (const profiles of [[a, b], [{ ...b, targets: [...b.targets].reverse() }, { ...a, targets: [...a.targets].reverse() }]]) {
      const result = collectWholeHomePresence(roomsWithHousePlacement([makeRoom(sensors)]), profiles, id => states.get(id));
      assert.equal(result.people.length, 2);
    }
  }
});

test('does not replace an out-of-room coordinate with approximate presence', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['sensor.arbitrary_device-office_count', '1'],
    ['sensor.completely_custom_device-office_x', '0'],
    ['sensor.completely_custom_device-office_y', '9000'],
  ]);
  const result = collectWholeHomePresence(rooms, [profile('device-office')], entityId => states.get(entityId));
  assert.equal(result.people.length, 0);
});

test('detects real room overlap but allows rooms to share a wall', () => {
  const overlapping = roomsWithHousePlacement([
    room('living', 'Living', { house: { x: 0, y: 0, floor: 0, rotationDeg: 0 } }),
    room('kitchen', 'Kitchen', { house: { x: 2000, y: 0, floor: 0, rotationDeg: 0 } }),
    room('bed', 'Bedroom', { house: { x: 0, y: 0, floor: 1, rotationDeg: 0 } }),
  ]);
  assert.deepEqual([...overlappingRoomIds(overlapping)].sort(), ['kitchen', 'living']);

  const touching = roomsWithHousePlacement([
    room('living', 'Living', { house: { x: 0, y: 0, floor: 0, rotationDeg: 0 } }),
    room('kitchen', 'Kitchen', { house: { x: 4000, y: 0, floor: 0, rotationDeg: 0 } }),
  ]);
  assert.equal(overlappingRoomIds(touching).size, 0);

  for (const rotationDeg of [0, 90, 180, 270]) {
    const identical = roomsWithHousePlacement([
      room('first', 'First', { house: { x: 0, y: 0, floor: 0, rotationDeg: 0 } }),
      room('second', 'Second', { house: { x: 0, y: 0, floor: 0, rotationDeg } }),
    ]);
    assert.deepEqual([...overlappingRoomIds(identical)].sort(), ['first', 'second']);
  }
});

test('magnetically aligns room edges without moving another floor', () => {
  const rooms = roomsWithHousePlacement([
    room('living', 'Living', { house: { x: 0, y: 0, floor: 0, rotationDeg: 0 } }),
    room('kitchen', 'Kitchen', { house: { x: 4110, y: 80, floor: 0, rotationDeg: 0 } }),
    room('bed', 'Bedroom', { house: { x: 4000, y: 0, floor: 1, rotationDeg: 0 } }),
  ]);
  const snapped = snapHousePlacement(rooms[1], rooms[1].house, rooms, 140);
  assert.equal(snapped.placement.x, 4000);
  assert.equal(snapped.placement.y, 0);
  assert.equal(snapped.guideX, 2000);
  assert.equal(snapped.guideY, -1500);
});
