import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EntityReportReceiptTracker,
  autoArrangeRooms,
  collectWholeHomePresence,
  inverseTransformHomePoint,
  houseLayoutFingerprint,
  hasUnknownVisiblePeopleCount,
  latestIndependentReportTimestamp,
  radarEvidenceEntityIds,
  overlappingRoomIds,
  roomsWithHousePlacement,
  restoreHouseSnapshot,
  snapHousePlacement,
  transformHomePoint,
} from '../src/utils/whole-home.ts';
import {
  home3DRoomVisualState,
  projectHome3DPoint,
  WholeHome3DRenderer,
} from '../src/utils/home3d.ts';
import { sourcePlacementFingerprint } from '../src/utils/multi-sensor-tracking.ts';

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
    coordinate_frame: null,
    current_hardware_mode: null,
    installation_height_m: null,
    installation_angle_deg: null,
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

const alignedTracking = sensors => ({
  experimental_fusion: true,
  duplicate_distance_mm: 650,
  source_alignments: Object.fromEntries(sensors.map(sensor => [sensor.id, {
    placement_fingerprint: sourcePlacementFingerprint({
      ...sensor,
      capabilities: {
        radar_model: 'ld2450',
        coordinate_frame: '',
        coordinate_projection: 'forward_xy',
        installation_mode: '',
        installation_height_mm: 0,
        installation_angle_tenths: 0,
      },
    }),
    verified_at: '2026-11-09T12:00:00Z',
    sample_count: 3,
    rmse_mm: 100,
  }])),
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

test('3D view never labels confirmed presence as offline when evidence is incomplete', () => {
  const base = {
    id: 'living', name: 'Living room', points: [],
    house: { x: 0, y: 0, floor: 0, rotationDeg: 0 },
    people: 0, occupied: false, approximate: false, available: false, linked: true,
  };
  assert.equal(home3DRoomVisualState(base), 'offline');
  assert.equal(home3DRoomVisualState({ ...base, occupied: true }), 'incomplete_presence');
  assert.equal(home3DRoomVisualState({ ...base, occupied: true, available: true }), 'occupied');
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

test('uses live slot evidence instead of assuming active slots are contiguous', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const radar = profile('device-office', { targets: [
    { index: 1, x_entity_id: 'sensor.slot1_x', y_entity_id: 'sensor.slot1_y' },
    { index: 2, x_entity_id: 'sensor.slot2_x', y_entity_id: 'sensor.slot2_y' },
  ] });
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['sensor.arbitrary_device-office_count', '1'],
    ['sensor.slot1_x', 'unavailable'], ['sensor.slot1_y', 'unavailable'],
    ['sensor.slot2_x', '300'], ['sensor.slot2_y', '1200'],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.match(result.people[0].id, /:2$/);
});

test('an expired stationary axis degrades the target to position unknown', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const radar = profile('device-office', { targets: [
    { index: 1, x_entity_id: 'sensor.slot1_x', y_entity_id: 'sensor.slot1_y' },
    { index: 2, x_entity_id: 'sensor.slot2_x', y_entity_id: 'sensor.slot2_y' },
  ] });
  const now = 100_000;
  const stale = now - 20_000;
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', { state: 'on', received_at_ms: stale }],
    ['sensor.arbitrary_device-office_count', { state: '2', received_at_ms: stale }],
    ['sensor.slot1_x', { state: '300', received_at_ms: stale }],
    ['sensor.slot1_y', { state: '1200', received_at_ms: now }],
    ['sensor.slot2_x', { state: '700', received_at_ms: stale }],
    ['sensor.slot2_y', { state: '1200', received_at_ms: stale }],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id), now);
  assert.equal(result.people.filter(person => !person.approximate).length, 0);
  assert.equal(result.people.filter(person => person.approximate).length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('a positive target slot overrides a conflicting global off state', () => {
  const rooms = roomsWithHousePlacement([room('living', 'Living')]);
  const radar = profile('device-living', {
    targets: [{
      index: 1,
      x_entity_id: 'sensor.slot_x',
      y_entity_id: 'sensor.slot_y',
      presence_entity_id: 'binary_sensor.slot_presence',
    }],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'off'],
    ['sensor.arbitrary_device-living_count', '0'],
    ['binary_sensor.slot_presence', 'on'],
    ['sensor.slot_x', '300'],
    ['sensor.slot_y', '1200'],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, false);
  assert.equal(result.rooms[0].occupied, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('fresh per-target coordinates stay visible when the slot flag lags or is unavailable', () => {
  const rooms = roomsWithHousePlacement([room('living', 'Living')]);
  const radar = profile('device-living', { targets: [{
    index: 1,
    x_entity_id: 'sensor.slot_x',
    y_entity_id: 'sensor.slot_y',
    presence_entity_id: 'binary_sensor.slot_presence',
  }] });
  for (const slotState of ['off', 'unavailable']) {
    const states = new Map([
      ['binary_sensor.arbitrary_device-living_presence', 'off'],
      ['sensor.arbitrary_device-living_count', '0'],
      ['binary_sensor.slot_presence', slotState],
      ['sensor.slot_x', '300'],
      ['sensor.slot_y', '1200'],
    ]);
    const result = collectWholeHomePresence(rooms, [radar], id => states.get(id));
    assert.equal(result.people.filter(person => !person.approximate).length, 1);
    assert.equal(result.rooms[0].occupied, true);
    assert.equal(result.rooms[0].peopleCountKnown, false);
  }
});

test('fresh coordinate-only evidence overrides a conflicting aggregate off state', () => {
  const radar = profile('device-living');
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'off'],
    ['sensor.arbitrary_device-living_count', '0'],
    ['sensor.completely_custom_device-living_x', '300'],
    ['sensor.completely_custom_device-living_y', '1200'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living room')]), [radar], id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.rooms[0].occupied, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('an unavailable per-target presence entity can never produce a clear room', () => {
  const radar = profile('device-living', { targets: [{
    index: 1,
    x_entity_id: 'sensor.slot_x',
    y_entity_id: 'sensor.slot_y',
    presence_entity_id: 'binary_sensor.slot_presence',
  }] });
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'off'],
    ['sensor.arbitrary_device-living_count', '0'],
    ['binary_sensor.slot_presence', 'unavailable'],
    ['sensor.slot_x', 'unavailable'],
    ['sensor.slot_y', 'unavailable'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living room')]), [radar], id => states.get(id),
  );
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.rooms[0].available, false);
});

test('stale nonzero coordinate-only firmware stays visible as approximate presence', () => {
  const radar = profile('device-living', { profile: {
    tracking_presence_entity_id: null,
    tracking_target_count_entity_id: null,
  } });
  const now = 100_000;
  const states = new Map([
    ['sensor.completely_custom_device-living_x', { state: '300', received_at_ms: now - 20_000 }],
    ['sensor.completely_custom_device-living_y', { state: '1200', received_at_ms: now - 20_000 }],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living room')]), [radar], id => states.get(id), now,
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].occupied, true);
});

test('an explicitly inactive stale slot cannot consume a reported person count', () => {
  const rooms = roomsWithHousePlacement([room('living', 'Living')]);
  const radar = profile('device-living', {
    targets: [{
      index: 1,
      x_entity_id: 'sensor.stale_x',
      y_entity_id: 'sensor.stale_y',
      presence_entity_id: 'binary_sensor.slot_presence',
    }],
  });
  const now = 100_000;
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_device-living_count', { state: '1', received_at_ms: now }],
    ['binary_sensor.slot_presence', { state: 'off', received_at_ms: now }],
    ['sensor.stale_x', { state: '9000', received_at_ms: now - 20_000 }],
    ['sensor.stale_y', { state: '9000', received_at_ms: now - 20_000 }],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id), now);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('entity report receipts reject timestamps ahead of Home Assistant time', () => {
  const tracker = new EntityReportReceiptTracker();
  const serverNow = Date.parse('2026-11-10T12:00:00Z');
  const state = tracker.state('sensor.future', {
    state: '1',
    last_reported: '2026-11-10T12:00:01Z',
  }, 50_000, serverNow);
  assert.equal(Number.isNaN(state.received_at_ms), true);
});

test('a future target count cannot provide the clock that validates itself', () => {
  const radar = profile('device-living');
  const evidence = radarEvidenceEntityIds([radar]);
  const countId = radar.profile.tracking_target_count_entity_id;
  assert.equal(evidence.has(countId), true);
  const serverNow = Date.parse('2026-11-10T12:00:00Z');
  const states = {
    [countId]: { state: '1', last_reported: '2026-11-10T12:00:01Z' },
    'sensor.unrelated_clock': { state: '20', last_reported: '2026-11-10T12:00:00Z' },
  };
  const reference = latestIndependentReportTimestamp(states, evidence, serverNow);
  const count = new EntityReportReceiptTracker().state(
    countId, states[countId], serverNow, reference,
  );
  assert.equal(reference, serverNow);
  assert.equal(Number.isNaN(count.received_at_ms), true);
});

test('an unavailable visible room always makes the aggregate count unknown', () => {
  assert.equal(hasUnknownVisiblePeopleCount([{
    roomId: 'offline', roomName: 'Offline', floor: 0, people: 0,
    sensorCount: 1, linkedSensorCount: 1, liveSensorCount: 0,
    unavailableSensorCount: 1, positioningSensorCount: 0,
    peopleCountKnown: false, trackingEvidenceComplete: false,
    approximate: false, occupied: false, available: false, visible: true,
  }], []), true);
});

test('a coordinate report may be newer than unchanged independent entities', () => {
  const tracker = new EntityReportReceiptTracker();
  const serverNow = Date.parse('2026-11-10T12:00:00Z');
  const browserNow = serverNow + 6_000;
  const state = tracker.state('sensor.current', {
    state: '1', last_reported: '2026-11-10T12:00:06Z',
  }, browserNow, serverNow);
  assert.equal(state.received_at_ms, browserNow);
});

test('a rejected future coordinate cannot reach the exact-position collector path', () => {
  const tracker = new EntityReportReceiptTracker();
  const coordinateIds = new Set([
    'sensor.completely_custom_device-living_x',
    'sensor.completely_custom_device-living_y',
  ]);
  const rawStates = {
    'binary_sensor.arbitrary_device-living_presence': {
      state: 'on', last_updated: '2026-11-10T12:00:00Z',
    },
    'sensor.completely_custom_device-living_x': {
      state: '300', last_updated: '2026-11-10T12:00:06Z',
    },
    'sensor.completely_custom_device-living_y': {
      state: '1200', last_updated: '2026-11-10T12:00:06Z',
    },
  };
  const serverNow = latestIndependentReportTimestamp(rawStates, coordinateIds, 50_000);
  const radar = profile('device-living');
  const futureX = tracker.state(
    'sensor.completely_custom_device-living_x',
    rawStates['sensor.completely_custom_device-living_x'], 50_000, serverNow,
  );
  const futureY = tracker.state(
    'sensor.completely_custom_device-living_y',
    rawStates['sensor.completely_custom_device-living_y'], 50_000, serverNow,
  );
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', futureX],
    ['sensor.completely_custom_device-living_y', futureY],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living')]), [radar], id => states.get(id), 50_000,
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 0);
  assert.equal(result.people.filter(person => person.approximate).length, 1);
});

test('unknown and positive supplementary presence both prevent an exact count', () => {
  const radar = profile('device-living');
  radar.profile.supplementary_presence_sensors = ['binary_sensor.supplementary'];
  const base = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', '300'],
    ['sensor.completely_custom_device-living_y', '1200'],
  ]);
  for (const supplementary of ['unavailable', 'on']) {
    const states = new Map(base);
    states.set('binary_sensor.supplementary', supplementary);
    const result = collectWholeHomePresence(
      roomsWithHousePlacement([room('living', 'Living')]), [radar], id => states.get(id),
    );
    assert.equal(result.people.filter(person => !person.approximate).length, 1);
    assert.equal(result.rooms[0].peopleCountKnown, false);
    if (supplementary === 'unavailable') assert.equal(result.rooms[0].available, false);
  }
});

test('stale nonzero slot coordinates remain visible as an approximate person', () => {
  const rooms = roomsWithHousePlacement([room('living', 'Living')]);
  const radar = profile('device-living', {
    targets: [
      { index: 1, x_entity_id: 'sensor.current_x', y_entity_id: 'sensor.current_y' },
      { index: 2, x_entity_id: 'sensor.stale_x', y_entity_id: 'sensor.stale_y' },
    ],
  });
  const now = 100_000;
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.current_x', { state: '300', received_at_ms: now }],
    ['sensor.current_y', { state: '1200', received_at_ms: now }],
    ['sensor.stale_x', { state: '700', received_at_ms: now - 20_000 }],
    ['sensor.stale_y', { state: '1200', received_at_ms: now - 20_000 }],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id), now);
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.people.filter(person => person.approximate).length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('stale zero slots stay inactive but keep the exact count unknown', () => {
  const rooms = roomsWithHousePlacement([room('living', 'Living')]);
  const radar = profile('device-living', {
    targets: [
      { index: 1, x_entity_id: 'sensor.current_x', y_entity_id: 'sensor.current_y' },
      { index: 2, x_entity_id: 'sensor.empty_x', y_entity_id: 'sensor.empty_y' },
    ],
  });
  const now = 100_000;
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.current_x', { state: '300', received_at_ms: now }],
    ['sensor.current_y', { state: '1200', received_at_ms: now }],
    ['sensor.empty_x', { state: '0', received_at_ms: now - 20_000 }],
    ['sensor.empty_y', { state: '0', received_at_ms: now - 20_000 }],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id), now);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, false);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('an unavailable target slot prevents an exact count', () => {
  const rooms = roomsWithHousePlacement([room('living', 'Living')]);
  const radar = profile('device-living', {
    targets: [
      { index: 1, x_entity_id: 'sensor.current_x', y_entity_id: 'sensor.current_y' },
      { index: 2, x_entity_id: 'sensor.missing_x', y_entity_id: 'sensor.missing_y' },
    ],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', 'unavailable'],
    ['sensor.current_x', '300'],
    ['sensor.current_y', '1200'],
    ['sensor.missing_x', 'unavailable'],
    ['sensor.missing_y', 'unavailable'],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('an unavailable configured target count prevents an exact count', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['sensor.arbitrary_device-office_count', 'unavailable'],
    ['sensor.completely_custom_device-office_x', '300'],
    ['sensor.completely_custom_device-office_y', '1200'],
  ]);
  const result = collectWholeHomePresence(rooms, [profile('device-office')], id => states.get(id));
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('a missing configured radar prevents an exact people count', () => {
  const configured = room('office', 'Office', { sensors: [
    { id: 'live', deviceId: 'device-live', x: 0, y: -1200, rotation: 90 },
    { id: 'missing', deviceId: 'device-missing', x: 0, y: 0, rotation: 0 },
  ] });
  const states = new Map([
    ['binary_sensor.arbitrary_device-live_presence', 'on'],
    ['sensor.completely_custom_device-live_x', '0'],
    ['sensor.completely_custom_device-live_y', '1000'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([configured]),
    [profile('device-live')],
    id => states.get(id),
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.rooms[0].unavailableSensorCount, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('steady available presence remains live without a value-change heartbeat', () => {
  const rooms = roomsWithHousePlacement([room('hall', 'Hall')]);
  const radar = profile('device-hall', {
    profile: { positioning_available: false, maximum_targets: 0 },
    targets: [],
  });
  const old = Date.parse('2026-11-10T10:00:00Z');
  const result = collectWholeHomePresence(
    rooms,
    [radar],
    id => id.includes('presence') ? { state: 'on', received_at_ms: old } : undefined,
    old + 10 * 60_000,
  );
  assert.equal(result.liveSensors, 1);
  assert.equal(result.rooms[0].available, true);
  assert.equal(result.rooms[0].occupied, true);
});

test('mixed positioning and presence-only sensors never claim an exact people count', () => {
  const mixed = room('office', 'Office', { sensors: [
    { id: 'a', deviceId: 'device-a', x: 0, y: -1200, rotation: 90 },
    { id: 'b', deviceId: 'device-b', x: 0, y: 0, rotation: 0 },
  ] });
  const exact = profile('device-a');
  const approximate = profile('device-b', {
    profile: { positioning_available: false, maximum_targets: 0 },
    targets: [],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-a_presence', 'on'],
    ['sensor.completely_custom_device-a_x', '0'], ['sensor.completely_custom_device-a_y', '1000'],
    ['binary_sensor.arbitrary_device-b_presence', 'on'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([mixed]),
    [exact, approximate],
    id => states.get(id),
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
  assert.equal(result.rooms[0].occupied, true);
});

test('a current local target conservatively overrides a cached runtime clear', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['sensor.completely_custom_device-office_x', '0'],
    ['sensor.completely_custom_device-office_y', '1000'],
  ]);
  const result = collectWholeHomePresence(
    rooms,
    [profile('device-office')],
    id => states.get(id),
    Date.now(),
    { office: { presence: { occupied: false, status: 'clear' } } },
  );
  assert.equal(result.rooms[0].occupied, true);
});

test('applies LD2460 scaling and never reuses a missing slot coordinate', () => {
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
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.people.filter(person => person.approximate).length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
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
  const result = collectWholeHomePresence(
    rooms,
    [profile('device-mirror')],
    entityId => states.get(entityId),
    Date.now(),
    { mirror: { presence: { occupied: true } } },
    false,
  );
  assert.equal(result.people.length, 0);
  assert.equal(result.rooms[0].occupied, false);

  states.set('sensor.arbitrary_device-mirror_count', 'unavailable');
  const unknownCount = collectWholeHomePresence(
    rooms,
    [profile('device-mirror')],
    entityId => states.get(entityId),
    Date.now(),
    { mirror: { presence: { occupied: false } } },
    true,
  );
  assert.equal(unknownCount.people.length, 1);
  assert.equal(unknownCount.people[0].approximate, true);
  assert.equal(unknownCount.rooms[0].occupied, true);

  const now = Date.now();
  states.set('sensor.arbitrary_device-mirror_count', '1');
  states.set('sensor.completely_custom_device-mirror_x', { state: '2500', received_at_ms: now - 6000 });
  states.set('sensor.completely_custom_device-mirror_y', { state: '500', received_at_ms: now - 6000 });
  const staleCoordinates = collectWholeHomePresence(
    rooms, [profile('device-mirror')], entityId => states.get(entityId), now,
  );
  assert.equal(staleCoordinates.people.length, 1);
  assert.equal(staleCoordinates.people[0].approximate, true);
  assert.equal(staleCoordinates.rooms[0].occupied, true);
});

test('a source-owned exclusion never hides another radar', () => {
  const mixedRoom = room('mirror', 'Mirror room', {
    sensors: [
      { id: 'reflected', deviceId: 'device-reflected', x: 0, y: -1200, rotation: 90 },
      { id: 'visible', deviceId: 'device-visible', x: 0, y: -1200, rotation: 90 },
    ],
    zones: [{
      id: 'owned', name: 'Reflection', type: 'exclusion', sensorId: 'reflected',
      points: [{ x: 300, y: 1000 }, { x: 900, y: 1000 }, { x: 900, y: 1600 }, { x: 300, y: 1600 }],
    }],
  });
  const states = new Map();
  for (const source of ['reflected', 'visible']) {
    states.set(`binary_sensor.arbitrary_device-${source}_presence`, 'on');
    states.set(`sensor.arbitrary_device-${source}_count`, '1');
    states.set(`sensor.completely_custom_device-${source}_x`, '2500');
    states.set(`sensor.completely_custom_device-${source}_y`, '500');
  }
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([mixedRoom]),
    [profile('device-reflected'), profile('device-visible')],
    id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.people.find(person => !person.approximate).sourceDeviceId, 'device-visible');
});

test('fractional and stale target counts can never explain away presence', () => {
  const reflectedRoom = room('mirror', 'Mirror room', { zones: [{
    id: 'exclude', name: 'Reflection', type: 'exclusion',
    points: [{ x: 300, y: 1000 }, { x: 900, y: 1000 }, { x: 900, y: 1600 }, { x: 300, y: 1600 }],
  }] });
  const now = 100_000;
  for (const count of [
    { state: '1.5', received_at_ms: now },
    { state: '1', received_at_ms: now - 20_000 },
  ]) {
    const states = new Map([
      ['binary_sensor.arbitrary_device-mirror_presence', 'on'],
      ['sensor.arbitrary_device-mirror_count', count],
      ['sensor.completely_custom_device-mirror_x', { state: '2500', received_at_ms: now }],
      ['sensor.completely_custom_device-mirror_y', { state: '500', received_at_ms: now }],
    ]);
    const result = collectWholeHomePresence(
      roomsWithHousePlacement([reflectedRoom]), [profile('device-mirror')], id => states.get(id), now,
    );
    assert.equal(result.people.length, 1);
    assert.equal(result.people[0].approximate, true);
    assert.equal(result.rooms[0].occupied, true);
  }
});

test('excess excluded slots never hide a mismatching aggregate count', () => {
  const reflectedRoom = room('mirror', 'Mirror room', {
    zones: [{
      id: 'exclude', name: 'Reflection', type: 'exclusion', color: '#ef4444',
      points: [{ x: 300, y: 1000 }, { x: 1000, y: 1000 }, { x: 1000, y: 1700 }, { x: 300, y: 1700 }],
    }],
  });
  const radar = profile('device-mirror', { targets: [
    { index: 1, x_entity_id: 'sensor.mirror_x1', y_entity_id: 'sensor.mirror_y1' },
    { index: 2, x_entity_id: 'sensor.mirror_x2', y_entity_id: 'sensor.mirror_y2' },
  ] });
  const states = new Map([
    ['binary_sensor.arbitrary_device-mirror_presence', 'on'],
    ['sensor.arbitrary_device-mirror_count', '1'],
    ['sensor.mirror_x1', '2500'], ['sensor.mirror_y1', '500'],
    ['sensor.mirror_x2', '2600'], ['sensor.mirror_y2', '500'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([reflectedRoom]), [radar], id => states.get(id),
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].occupied, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('one excluded radar cannot hide occupancy while another room sensor is unknown', () => {
  const mixedRoom = room('mirror', 'Mirror room', {
    sensors: [
      { id: 'reflected', deviceId: 'device-reflected', x: 0, y: -1200, rotation: 90 },
      { id: 'uncertain', deviceId: 'device-uncertain', x: 0, y: -1200, rotation: 90 },
    ],
    zones: [{
      id: 'exclude', name: 'Reflection', type: 'exclusion', color: '#ef4444',
      points: [{ x: 300, y: 1000 }, { x: 900, y: 1000 }, { x: 900, y: 1600 }, { x: 300, y: 1600 }],
    }],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-reflected_presence', 'on'],
    ['sensor.arbitrary_device-reflected_count', '1'],
    ['sensor.completely_custom_device-reflected_x', '2500'],
    ['sensor.completely_custom_device-reflected_y', '500'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([mixedRoom]),
    [profile('device-reflected'), profile('device-uncertain')],
    entityId => states.get(entityId),
    Date.now(),
    { mirror: { presence: { occupied: true } } },
    true,
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.people[0].id, 'mirror:runtime-hold');
  assert.equal(result.rooms[0].unavailableSensorCount, 1);
  assert.equal(result.rooms[0].occupied, true);
});

test('an excluded radar cannot clear cached occupancy when another count is unavailable', () => {
  const mixedRoom = room('mirror', 'Mirror room', {
    sensors: [
      { id: 'reflected', deviceId: 'device-reflected', x: 0, y: -1200, rotation: 90 },
      { id: 'uncertain', deviceId: 'device-uncertain', x: 0, y: -1200, rotation: 90 },
    ],
    zones: [{
      id: 'exclude', name: 'Reflection', type: 'exclusion', color: '#ef4444',
      points: [{ x: 300, y: 1000 }, { x: 900, y: 1000 }, { x: 900, y: 1600 }, { x: 300, y: 1600 }],
    }],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-reflected_presence', 'on'],
    ['sensor.arbitrary_device-reflected_count', '1'],
    ['sensor.completely_custom_device-reflected_x', '2500'],
    ['sensor.completely_custom_device-reflected_y', '500'],
    ['binary_sensor.arbitrary_device-uncertain_presence', 'off'],
    ['sensor.arbitrary_device-uncertain_count', 'unavailable'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([mixedRoom]),
    [profile('device-reflected'), profile('device-uncertain')],
    entityId => states.get(entityId),
    Date.now(),
    { mirror: { presence: { occupied: true, status: 'occupied' } } },
    true,
  );
  assert.equal(result.rooms[0].occupied, true);
});

test('browser geometry never skips the shared vacancy hold', () => {
  const reflectedRoom = room('mirror', 'Mirror room', {
    zones: [{
      id: 'exclude', name: 'Reflection', type: 'exclusion', color: '#ef4444',
      points: [{ x: 300, y: 1000 }, { x: 900, y: 1000 }, { x: 900, y: 1600 }, { x: 300, y: 1600 }],
    }],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-mirror_presence', 'on'],
    ['sensor.arbitrary_device-mirror_count', '1'],
    ['sensor.completely_custom_device-mirror_x', '2500'],
    ['sensor.completely_custom_device-mirror_y', '500'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([reflectedRoom]),
    [profile('device-mirror')],
    entityId => states.get(entityId),
    Date.now(),
    { mirror: { presence: { occupied: true, status: 'clearing' } } },
    true,
  );
  assert.equal(result.rooms[0].occupied, true);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].id, 'mirror:runtime-hold');
  assert.equal(result.people[0].approximate, true);
});

test('selected presence sources control room occupancy without generated entity IDs', () => {
  const configured = room('office', 'Office');
  configured.sensors = [
    { id: 'selected-source', deviceId: 'selected', x: 0, y: -1200, rotation: 90 },
    { id: 'ignored-source', deviceId: 'ignored', x: 0, y: -1200, rotation: 90 },
  ];
  configured.aggregation = { presence: { source_ids: ['selected-source'] } };
  const states = new Map([
    ['binary_sensor.arbitrary_selected_presence', 'off'],
    ['sensor.arbitrary_selected_count', '0'],
    ['binary_sensor.arbitrary_ignored_presence', 'on'],
    ['sensor.arbitrary_ignored_count', '0'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([configured]),
    [profile('selected'), profile('ignored')],
    entityId => states.get(entityId),
  );
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(hasUnknownVisiblePeopleCount(result.rooms, result.people), true);
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
  // A fresh clear source plus an unavailable source is deliberately unknown:
  // missing data must never be interpreted as a safely empty room.
  assert.equal(result.rooms[0].available, false);
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

test('never claims an exact count when visible targets exceed the count entity', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const radar = profile('device-office', {
    targets: [
      { index: 1, x_entity_id: 'sensor.office_x1', y_entity_id: 'sensor.office_y1' },
      { index: 2, x_entity_id: 'sensor.office_x2', y_entity_id: 'sensor.office_y2' },
    ],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['sensor.arbitrary_device-office_count', '1'],
    ['sensor.office_x1', '-400'], ['sensor.office_y1', '1200'],
    ['sensor.office_x2', '400'], ['sensor.office_y2', '1200'],
  ]);
  const result = collectWholeHomePresence(rooms, [radar], id => states.get(id));
  assert.equal(result.people.length, 2);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('whole-home keeps one-frame overlap separate until Room Designer confirms identity', () => {
  const sensors = [
    { id: 'a', deviceId: 'device-a', x: 0, y: -1200, rotation: 90 },
    { id: 'b', deviceId: 'device-b', x: 0, y: -1200, rotation: 90 },
  ];
  const multiSensorRoom = room('office', 'Office', {
    sensors,
    aggregation: { tracking: alignedTracking(sensors) },
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
    assert.equal(result.people.length, 3);
    assert.equal(result.rooms[0].peopleCountKnown, false);
  }
});

test('whole-home never hides equal-sized close source tracks in a stateless view', () => {
  const makeRoom = sensors => room('office', 'Office', {
    sensors,
    aggregation: { tracking: alignedTracking(sensors) },
  });
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
      assert.equal(result.people.length, 4);
      assert.equal(result.rooms[0].peopleCountKnown, false);
    }
  }
});

test('keeps source tracks separate and does not claim a count before fusion is enabled', () => {
  const multiSensorRoom = room('office', 'Office', {
    sensors: [
      { id: 'a', deviceId: 'device-a', x: 0, y: -1200, rotation: 90 },
      { id: 'b', deviceId: 'device-b', x: 0, y: -1200, rotation: 90 },
    ],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-a_presence', 'on'], ['sensor.arbitrary_device-a_count', '1'],
    ['binary_sensor.arbitrary_device-b_presence', 'on'], ['sensor.arbitrary_device-b_count', '1'],
    ['sensor.completely_custom_device-a_x', '0'], ['sensor.completely_custom_device-a_y', '1000'],
    ['sensor.completely_custom_device-b_x', '50'], ['sensor.completely_custom_device-b_y', '1000'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([multiSensorRoom]),
    [profile('device-a'), profile('device-b')],
    entityId => states.get(entityId),
  );
  assert.equal(result.people.length, 2);
  assert.equal(result.rooms[0].peopleCountKnown, false);
  assert.equal(result.rooms[0].occupied, true);
});

test('an enabled toggle without current alignment still keeps tracks separate', () => {
  const sensors = [
    { id: 'a', deviceId: 'device-a', x: 0, y: -1200, rotation: 90 },
    { id: 'b', deviceId: 'device-b', x: 0, y: -1200, rotation: 90 },
  ];
  const uncalibrated = room('office', 'Office', {
    sensors,
    aggregation: { tracking: { experimental_fusion: true, duplicate_distance_mm: 650, source_alignments: {} } },
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-a_presence', 'on'], ['sensor.arbitrary_device-a_count', '1'],
    ['binary_sensor.arbitrary_device-b_presence', 'on'], ['sensor.arbitrary_device-b_count', '1'],
    ['sensor.completely_custom_device-a_x', '0'], ['sensor.completely_custom_device-a_y', '1000'],
    ['sensor.completely_custom_device-b_x', '20'], ['sensor.completely_custom_device-b_y', '1000'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([uncalibrated]),
    [profile('device-a'), profile('device-b')],
    entityId => states.get(entityId),
  );
  assert.equal(result.people.length, 2);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('clear fallback stays unavailable when its configured target count is unavailable', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const now = Date.parse('2026-11-09T12:10:00Z');
  const result = collectWholeHomePresence(
    rooms,
    [profile('device-office')],
    entityId => ({
      state: entityId.includes('presence') ? 'off' : 'unavailable',
      last_updated: '2026-11-09T12:00:00Z',
      last_reported: '2026-11-09T12:00:00Z',
    }),
    now,
  );
  assert.equal(result.rooms[0].available, false);
  assert.equal(result.rooms[0].occupied, false);
});

test('whole-home status follows the shared room coordinator instead of raw card timing', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'off'],
    ['sensor.arbitrary_device-office_count', '0'],
  ]);
  const occupied = collectWholeHomePresence(
    rooms,
    [profile('device-office')],
    entityId => states.get(entityId),
    Date.now(),
    { office: { presence: { occupied: true, status: 'occupied' } } },
  );
  assert.equal(occupied.rooms[0].occupied, true);
  const unknown = collectWholeHomePresence(
    rooms,
    [profile('device-office')],
    entityId => states.get(entityId),
    Date.now(),
    { office: { presence: { occupied: null, status: 'unknown' } } },
  );
  assert.equal(unknown.rooms[0].available, false);
  const failed = collectWholeHomePresence(
    rooms,
    [profile('device-office')],
    entityId => states.get(entityId),
    Date.now(),
    { office: { presence: { occupied: false, status: 'clear' } } },
    false,
  );
  assert.equal(failed.rooms[0].available, false);
  assert.equal(failed.rooms[0].occupied, false);
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

test('keeps a target just outside a drawn wall visible', () => {
  const rooms = roomsWithHousePlacement([room('office', 'Office')]);
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', 'on'],
    ['sensor.arbitrary_device-office_count', '1'],
    ['sensor.completely_custom_device-office_x', '1200'],
    ['sensor.completely_custom_device-office_y', '2100'],
  ]);
  const result = collectWholeHomePresence(rooms, [profile('device-office')], entityId => states.get(entityId));
  assert.equal(result.people.length, 1);
  assert.equal(result.rooms[0].occupied, true);
});

test('whole-home never suppresses a target against an unordered room wall chain', () => {
  const malformed = room('living', 'Living');
  malformed.walls = [
    { x1: 0, y1: 0, x2: 5000, y2: 0 },
    { x1: 5000, y1: 4000, x2: 0, y2: 4000 },
    { x1: 5000, y1: 0, x2: 5000, y2: 4000 },
    { x1: 0, y1: 4000, x2: 0, y2: 0 },
  ];
  malformed.sensors[0] = { ...malformed.sensors[0], x: 0, y: 0, rotation: 90 };
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', '500'],
    ['sensor.completely_custom_device-living_y', '2500'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([malformed]), [profile('device-living')], id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
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

test('whole-home fails closed when one physical radar is linked to two rooms', () => {
  const living = room('living', 'Living');
  const office = room('office', 'Office', {
    sensors: [{ id: 'office-radar', deviceId: 'device-living', x: 0, y: -1200, rotation: 90 }],
    house: { x: 5000, y: 0, floor: 0, rotationDeg: 0 },
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', '300'],
    ['sensor.completely_custom_device-living_y', '1200'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([living, office]),
    [profile('device-living')],
    id => states.get(id),
    Date.now(),
    {
      living: { presence: { occupied: true, status: 'occupied' } },
      office: { presence: { occupied: true, status: 'occupied' } },
    },
  );
  assert.equal(result.people.length, 0);
  for (const state of result.rooms) {
    assert.equal(state.available, false);
    assert.equal(state.occupied, false);
    assert.equal(state.peopleCountKnown, false);
  }
});

test('whole-home never claims an exact count while room runtime is unavailable', () => {
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', '300'],
    ['sensor.completely_custom_device-living_y', '1200'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living')]),
    [profile('device-living')],
    id => states.get(id),
    Date.now(),
    {},
    false,
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('whole-home rejects a future inactive slot as exact-count evidence', () => {
  const now = 100_000;
  const radar = profile('device-living', {
    targets: [{
      index: 1,
      x_entity_id: 'sensor.slot_x',
      y_entity_id: 'sensor.slot_y',
      presence_entity_id: 'binary_sensor.slot_presence',
    }],
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_device-living_count', { state: '1', received_at_ms: now }],
    ['binary_sensor.slot_presence', { state: 'off', received_at_ms: now + 1 }],
    ['sensor.slot_x', { state: '300', received_at_ms: now }],
    ['sensor.slot_y', { state: '1200', received_at_ms: now }],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living')]), [radar], id => states.get(id), now,
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('whole-home does not trust LD2460 geometry reported in the wrong mode', () => {
  const radar = profile('device-living', {
    profile: {
      coordinate_scale_to_mm: 1000,
      radar_model: 'ld2460',
      required_installation_mode: 'side',
      current_hardware_mode: 'top',
    },
  });
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', '0.3'],
    ['sensor.completely_custom_device-living_y', '1.2'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living')]), [radar], id => states.get(id),
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('whole-home requires a known room runtime state before claiming an exact count', () => {
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'off'],
    ['sensor.arbitrary_device-living_count', '0'],
    ['sensor.completely_custom_device-living_x', '0'],
    ['sensor.completely_custom_device-living_y', '0'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living')]),
    [profile('device-living')],
    id => states.get(id),
    Date.now(),
    { living: { presence: { occupied: null, status: 'unknown' } } },
    true,
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('whole-home rejects a future primary presence report as clear evidence', () => {
  const now = 100_000;
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', { state: 'off', received_at_ms: now + 1 }],
    ['sensor.arbitrary_device-living_count', { state: '0', received_at_ms: now }],
    ['sensor.completely_custom_device-living_x', { state: '0', received_at_ms: now }],
    ['sensor.completely_custom_device-living_y', { state: '0', received_at_ms: now }],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living')]),
    [profile('device-living')],
    id => states.get(id),
    now,
    { living: { presence: { occupied: false, status: 'clear' } } },
    true,
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
  assert.equal(result.rooms[0].available, false);
});

test('whole-home follows the live LD2460 mode entity instead of a cached profile', () => {
  const radar = profile('device-living', {
    profile: {
      coordinate_scale_to_mm: 1000,
      radar_model: 'ld2460',
      required_installation_mode: 'side',
      current_hardware_mode: 'side',
      reported_installation_mode_entity_id: 'sensor.live_installation_mode',
    },
  });
  const states = new Map([
    ['sensor.live_installation_mode', 'top'],
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', '0.3'],
    ['sensor.completely_custom_device-living_y', '1.2'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('living', 'Living')]),
    [radar],
    id => states.get(id),
    Date.now(),
    { living: { presence: { occupied: true, status: 'occupied' } } },
    true,
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('whole-home accepts authoritative clear with unchanged but available radar states', () => {
  const now = 100_000;
  const old = 10_000;
  const states = new Map([
    ['binary_sensor.arbitrary_device-office_presence', { state: 'off', received_at_ms: old }],
    ['sensor.arbitrary_device-office_count', { state: '0', received_at_ms: old }],
    ['sensor.completely_custom_device-office_x', { state: '0', received_at_ms: old }],
    ['sensor.completely_custom_device-office_y', { state: '0', received_at_ms: old }],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([room('office', 'Office')]), [profile('device-office')],
    id => states.get(id), now,
    { office: { presence: { occupied: false, status: 'clear' } } }, true,
  );
  assert.equal(result.rooms[0].available, true);
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('whole-home never suppresses against a room outline traced twice', () => {
  const malformed = room('living', 'Living');
  malformed.walls = [...malformed.walls, ...malformed.walls.map(wall => ({ ...wall }))];
  malformed.sensors[0] = { ...malformed.sensors[0], x: 0, y: 0, rotation: 90 };
  const states = new Map([
    ['binary_sensor.arbitrary_device-living_presence', 'on'],
    ['sensor.arbitrary_device-living_count', '1'],
    ['sensor.completely_custom_device-living_x', '500'],
    ['sensor.completely_custom_device-living_y', '5000'],
  ]);
  const result = collectWholeHomePresence(
    roomsWithHousePlacement([malformed]), [profile('device-living')], id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
});
