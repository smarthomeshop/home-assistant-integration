import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HomeStateReportTracker,
  hasUnknownVisiblePeopleCount,
  collectHomePresence,
  homeCoordinateEntityIds,
  homeEvidenceEntityIds,
  latestIndependentHomeStateReport,
  placeHomeRooms,
  resetCanvasTransform,
  transformHomePoint,
} from '../src/utils/whole-home.ts';

const room = (id, deviceId, house) => ({
  id,
  name: id,
  walls: [
    { x1: -2000, y1: -1500, x2: 2000, y2: -1500 },
    { x1: 2000, y1: -1500, x2: 2000, y2: 1500 },
    { x1: 2000, y1: 1500, x2: -2000, y2: 1500 },
    { x1: -2000, y1: 1500, x2: -2000, y2: -1500 },
  ],
  sensors: [{ id: `sensor-${deviceId}`, deviceId, x: 0, y: -1200, rotation: 90 }],
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
    radar_model: '',
    coordinate_frame: null,
    current_hardware_mode: null,
    installation_height_m: null,
    installation_angle_deg: null,
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
  const now = Date.now();
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_living_count', { state: '1', received_at_ms: now }],
    ['sensor.custom_living_x', { state: '400', received_at_ms: now }],
    ['sensor.custom_living_y', { state: '1200', received_at_ms: now }],
  ]);
  const result = collectHomePresence(rooms, [profile('living')], id => states.get(id), now);
  assert.equal(result.linkedSensors, 1);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, false);
});

test('uses live slot evidence instead of assuming active slots are contiguous', () => {
  const rooms = placeHomeRooms([room('living', 'living')]);
  const radar = profile('living');
  radar.targets = [
    { index: 1, x_entity_id: 'sensor.slot1_x', y_entity_id: 'sensor.slot1_y' },
    { index: 2, x_entity_id: 'sensor.slot2_x', y_entity_id: 'sensor.slot2_y' },
  ];
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.slot1_x', 'unavailable'], ['sensor.slot1_y', 'unavailable'],
    ['sensor.slot2_x', '300'], ['sensor.slot2_y', '1200'],
  ]);
  const result = collectHomePresence(rooms, [radar], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.match(result.people[0].id, /:2$/);
});

test('an expired stationary axis degrades the target to position unknown', () => {
  const rooms = placeHomeRooms([room('living', 'living')]);
  const radar = profile('living');
  radar.targets = [
    { index: 1, x_entity_id: 'sensor.slot1_x', y_entity_id: 'sensor.slot1_y' },
    { index: 2, x_entity_id: 'sensor.slot2_x', y_entity_id: 'sensor.slot2_y' },
  ];
  const now = 100_000;
  const stale = now - 20_000;
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', { state: 'on', received_at_ms: stale }],
    ['sensor.arbitrary_living_count', { state: '2', received_at_ms: stale }],
    ['sensor.slot1_x', { state: '300', received_at_ms: stale }],
    ['sensor.slot1_y', { state: '1200', received_at_ms: now }],
    ['sensor.slot2_x', { state: '700', received_at_ms: stale }],
    ['sensor.slot2_y', { state: '1200', received_at_ms: stale }],
  ]);
  const result = collectHomePresence(rooms, [radar], id => states.get(id), now);
  assert.equal(result.people.filter(person => !person.approximate).length, 0);
  assert.equal(result.people.filter(person => person.approximate).length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('a positive target slot overrides a conflicting global off state', () => {
  const radar = profile('living');
  radar.targets = [{
    index: 1,
    x_entity_id: 'sensor.slot_x',
    y_entity_id: 'sensor.slot_y',
    presence_entity_id: 'binary_sensor.slot_presence',
  }];
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'off'],
    ['sensor.arbitrary_living_count', '0'],
    ['binary_sensor.slot_presence', 'on'],
    ['sensor.slot_x', '300'],
    ['sensor.slot_y', '1200'],
  ]);
  const result = collectHomePresence(placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, false);
  assert.equal(result.rooms[0].occupied, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('fresh per-target coordinates stay visible when the slot flag lags or is unavailable', () => {
  const radar = profile('living');
  radar.targets = [{
    index: 1,
    x_entity_id: 'sensor.slot_x',
    y_entity_id: 'sensor.slot_y',
    presence_entity_id: 'binary_sensor.slot_presence',
  }];
  for (const slotState of ['off', 'unavailable']) {
    const states = new Map([
      ['binary_sensor.arbitrary_living_presence', 'off'],
      ['sensor.arbitrary_living_count', '0'],
      ['binary_sensor.slot_presence', slotState],
      ['sensor.slot_x', '300'],
      ['sensor.slot_y', '1200'],
    ]);
    const result = collectHomePresence(
      placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id),
    );
    assert.equal(result.people.filter(person => !person.approximate).length, 1);
    assert.equal(result.rooms[0].occupied, true);
    assert.equal(result.rooms[0].peopleCountKnown, false);
  }
});

test('fresh coordinate-only evidence overrides a conflicting aggregate off state', () => {
  const radar = profile('living');
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'off'],
    ['sensor.arbitrary_living_count', '0'],
    ['sensor.custom_living_x', '300'],
    ['sensor.custom_living_y', '1200'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.rooms[0].occupied, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('an unavailable per-target presence entity can never produce a clear room', () => {
  const radar = profile('living');
  radar.targets = [{
    index: 1,
    x_entity_id: 'sensor.slot_x',
    y_entity_id: 'sensor.slot_y',
    presence_entity_id: 'binary_sensor.slot_presence',
  }];
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'off'],
    ['sensor.arbitrary_living_count', '0'],
    ['binary_sensor.slot_presence', 'unavailable'],
    ['sensor.slot_x', 'unavailable'],
    ['sensor.slot_y', 'unavailable'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id),
  );
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.rooms[0].available, false);
});

test('stale nonzero coordinate-only firmware stays visible as approximate presence', () => {
  const radar = profile('living');
  radar.profile.tracking_presence_entity_id = null;
  radar.profile.tracking_target_count_entity_id = null;
  const now = 100_000;
  const states = new Map([
    ['sensor.custom_living_x', { state: '300', received_at_ms: now - 20_000 }],
    ['sensor.custom_living_y', { state: '1200', received_at_ms: now - 20_000 }],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id), now,
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].occupied, true);
});

test('an explicitly inactive stale slot cannot consume a reported person count', () => {
  const radar = profile('living');
  radar.targets = [{
    index: 1,
    x_entity_id: 'sensor.stale_x',
    y_entity_id: 'sensor.stale_y',
    presence_entity_id: 'binary_sensor.slot_presence',
  }];
  const now = 100_000;
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_living_count', { state: '1', received_at_ms: now }],
    ['binary_sensor.slot_presence', { state: 'off', received_at_ms: now }],
    ['sensor.stale_x', { state: '9000', received_at_ms: now - 20_000 }],
    ['sensor.stale_y', { state: '9000', received_at_ms: now - 20_000 }],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id), now,
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('home state report receipts reject timestamps ahead of Home Assistant time', () => {
  const tracker = new HomeStateReportTracker();
  const serverNow = Date.parse('2026-11-10T12:00:00Z');
  const state = tracker.state('sensor.future', {
    state: '1',
    last_reported: '2026-11-10T12:00:01Z',
  }, 50_000, serverNow);
  assert.equal(Number.isNaN(state.received_at_ms), true);
});

test('a future Lovelace target count cannot provide the clock that validates itself', () => {
  const radar = profile('living');
  const evidence = homeEvidenceEntityIds([radar]);
  const countId = radar.profile.tracking_target_count_entity_id;
  assert.equal(evidence.has(countId), true);
  const serverNow = Date.parse('2026-11-10T12:00:00Z');
  const states = {
    [countId]: { state: '1', last_reported: '2026-11-10T12:00:01Z' },
    'sensor.unrelated_clock': { state: '20', last_reported: '2026-11-10T12:00:00Z' },
  };
  const reference = latestIndependentHomeStateReport(states, evidence, serverNow);
  const count = new HomeStateReportTracker().state(
    countId, states[countId], serverNow, reference,
  );
  assert.equal(reference, serverNow);
  assert.equal(Number.isNaN(count.received_at_ms), true);
});

test('an unavailable Lovelace room always makes the aggregate count unknown', () => {
  assert.equal(hasUnknownVisiblePeopleCount([{
    roomId: 'offline', roomName: 'Offline', floor: 0, people: 0,
    sensorCount: 1, linkedSensorCount: 1, liveSensorCount: 0,
    unavailableSensorCount: 1, positioningSensorCount: 0,
    peopleCountKnown: false, trackingEvidenceComplete: false,
    approximate: false, occupied: false, available: false, visible: true,
  }], []), true);
});

test('a coordinate report may be newer than unchanged independent entities', () => {
  const tracker = new HomeStateReportTracker();
  const serverNow = Date.parse('2026-11-10T12:00:00Z');
  const browserNow = serverNow + 6_000;
  const state = tracker.state('sensor.current', {
    state: '1', last_reported: '2026-11-10T12:00:06Z',
  }, browserNow, serverNow);
  assert.equal(state.received_at_ms, browserNow);
});

test('a rejected future coordinate cannot reach the exact-position collector path', () => {
  const tracker = new HomeStateReportTracker();
  const coordinateIds = new Set(['sensor.custom_living_x', 'sensor.custom_living_y']);
  const rawStates = {
    'binary_sensor.arbitrary_living_presence': {
      state: 'on', last_updated: '2026-11-10T12:00:00Z',
    },
    'sensor.custom_living_x': {
      state: '300', last_updated: '2026-11-10T12:00:06Z',
    },
    'sensor.custom_living_y': {
      state: '1200', last_updated: '2026-11-10T12:00:06Z',
    },
  };
  const serverNow = latestIndependentHomeStateReport(rawStates, coordinateIds, 50_000);
  const futureX = tracker.state(
    'sensor.custom_living_x', rawStates['sensor.custom_living_x'], 50_000, serverNow,
  );
  const futureY = tracker.state(
    'sensor.custom_living_y', rawStates['sensor.custom_living_y'], 50_000, serverNow,
  );
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.custom_living_x', futureX],
    ['sensor.custom_living_y', futureY],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [profile('living')], id => states.get(id), 50_000,
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 0);
  assert.equal(result.people.filter(person => person.approximate).length, 1);
});

test('the Lovelace clock excludes Z so future coordinates cannot validate themselves', () => {
  const radar = profile('living');
  radar.targets[0].z_entity_id = 'sensor.custom_living_z';
  const coordinateIds = homeCoordinateEntityIds([radar]);
  assert.deepEqual([...coordinateIds].sort(), [
    'sensor.custom_living_x',
    'sensor.custom_living_y',
    'sensor.custom_living_z',
  ]);
  const rawStates = {
    'binary_sensor.arbitrary_living_presence': {
      state: 'on', last_updated: '2026-11-10T12:00:00Z',
    },
    'sensor.custom_living_x': {
      state: '300', last_updated: '2026-11-10T12:00:06Z',
    },
    'sensor.custom_living_y': {
      state: '1200', last_updated: '2026-11-10T12:00:06Z',
    },
    'sensor.custom_living_z': {
      state: '800', last_updated: '2026-11-10T12:00:07Z',
    },
  };
  assert.equal(
    latestIndependentHomeStateReport(rawStates, coordinateIds, 50_000),
    Date.parse('2026-11-10T12:00:00Z'),
  );
});

test('unknown and positive supplementary presence both prevent an exact count', () => {
  const radar = profile('living');
  radar.profile.supplementary_presence_sensors = ['binary_sensor.supplementary'];
  const base = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.custom_living_x', '300'],
    ['sensor.custom_living_y', '1200'],
  ]);
  for (const supplementary of ['unavailable', 'on']) {
    const states = new Map(base);
    states.set('binary_sensor.supplementary', supplementary);
    const result = collectHomePresence(
      placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id),
    );
    assert.equal(result.people.filter(person => !person.approximate).length, 1);
    assert.equal(result.rooms[0].peopleCountKnown, false);
    if (supplementary === 'unavailable') assert.equal(result.rooms[0].available, false);
  }
});

test('stale nonzero slot coordinates remain visible as an approximate person', () => {
  const radar = profile('living');
  radar.targets = [
    { index: 1, x_entity_id: 'sensor.current_x', y_entity_id: 'sensor.current_y' },
    { index: 2, x_entity_id: 'sensor.stale_x', y_entity_id: 'sensor.stale_y' },
  ];
  const now = 100_000;
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.current_x', { state: '300', received_at_ms: now }],
    ['sensor.current_y', { state: '1200', received_at_ms: now }],
    ['sensor.stale_x', { state: '700', received_at_ms: now - 20_000 }],
    ['sensor.stale_y', { state: '1200', received_at_ms: now - 20_000 }],
  ]);
  const result = collectHomePresence(placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id), now);
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.people.filter(person => person.approximate).length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('stale zero slots stay inactive but keep the exact count unknown', () => {
  const radar = profile('living');
  radar.targets = [
    { index: 1, x_entity_id: 'sensor.current_x', y_entity_id: 'sensor.current_y' },
    { index: 2, x_entity_id: 'sensor.empty_x', y_entity_id: 'sensor.empty_y' },
  ];
  const now = 100_000;
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.current_x', { state: '300', received_at_ms: now }],
    ['sensor.current_y', { state: '1200', received_at_ms: now }],
    ['sensor.empty_x', { state: '0', received_at_ms: now - 20_000 }],
    ['sensor.empty_y', { state: '0', received_at_ms: now - 20_000 }],
  ]);
  const result = collectHomePresence(placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id), now);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, false);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('an unavailable target slot prevents an exact count', () => {
  const radar = profile('living');
  radar.targets = [
    { index: 1, x_entity_id: 'sensor.current_x', y_entity_id: 'sensor.current_y' },
    { index: 2, x_entity_id: 'sensor.missing_x', y_entity_id: 'sensor.missing_y' },
  ];
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', 'unavailable'],
    ['sensor.current_x', '300'],
    ['sensor.current_y', '1200'],
    ['sensor.missing_x', 'unavailable'],
    ['sensor.missing_y', 'unavailable'],
  ]);
  const result = collectHomePresence(placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('an unavailable configured target count prevents an exact count', () => {
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', 'unavailable'],
    ['sensor.custom_living_x', '300'],
    ['sensor.custom_living_y', '1200'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [profile('living')], id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace fallback never reports a clear room with an unavailable target count', () => {
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'off'],
    ['sensor.arbitrary_living_count', 'unavailable'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [profile('living')], id => states.get(id),
  );
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.rooms[0].available, false);
});

test('a missing configured radar prevents an exact people count', () => {
  const configured = room('office', null);
  configured.sensors = [
    { id: 'live', deviceId: 'live', x: 0, y: -1200, rotation: 90 },
    { id: 'missing', deviceId: 'missing', x: 0, y: 0, rotation: 0 },
  ];
  const states = new Map([
    ['binary_sensor.arbitrary_live_presence', 'on'],
    ['sensor.custom_live_x', '0'], ['sensor.custom_live_y', '1000'],
  ]);
  const result = collectHomePresence(placeHomeRooms([configured]), [profile('live')], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.equal(result.rooms[0].unavailableSensorCount, 1);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace never reports clear availability while a configured radar is missing', () => {
  const configured = room('office', null);
  configured.sensors = [
    { id: 'live', deviceId: 'live', x: 0, y: -1200, rotation: 90 },
    { id: 'missing', deviceId: 'missing', x: 0, y: 0, rotation: 0 },
  ];
  const states = new Map([
    ['binary_sensor.arbitrary_live_presence', 'off'],
    ['sensor.arbitrary_live_count', '0'],
  ]);
  const result = collectHomePresence(placeHomeRooms([configured]), [profile('live')], id => states.get(id));
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.rooms[0].available, false);
});

test('steady available presence remains live without a value-change heartbeat', () => {
  const plainRoom = room('hall', 'hall');
  const radar = profile('hall');
  radar.profile.positioning_available = false;
  radar.targets = [];
  const old = Date.parse('2026-11-10T10:00:00Z');
  const result = collectHomePresence(
    placeHomeRooms([plainRoom]),
    [radar],
    id => id.includes('presence') ? { state: 'on', received_at_ms: old } : undefined,
    old + 10 * 60_000,
  );
  assert.equal(result.liveSensors, 1);
  assert.equal(result.rooms[0].available, true);
  assert.equal(result.rooms[0].occupied, true);
});

test('mixed positioning and presence-only sensors never claim an exact people count', () => {
  const mixed = room('office', null);
  mixed.sensors = [
    { id: 'positioning', deviceId: 'positioning', x: 0, y: -1200, rotation: 90 },
    { id: 'presence-only', deviceId: 'presence-only', x: 0, y: 0, rotation: 0 },
  ];
  const exact = profile('positioning');
  const approximate = profile('presence-only');
  approximate.profile.positioning_available = false;
  approximate.targets = [];
  const states = new Map([
    ['binary_sensor.arbitrary_positioning_presence', 'on'],
    ['sensor.custom_positioning_x', '0'], ['sensor.custom_positioning_y', '1000'],
    ['binary_sensor.arbitrary_presence-only_presence', 'on'],
  ]);
  const result = collectHomePresence(placeHomeRooms([mixed]), [exact, approximate], id => states.get(id));
  assert.equal(result.rooms[0].peopleCountKnown, false);
  assert.equal(result.rooms[0].occupied, true);
});

test('a current local target conservatively overrides a cached runtime clear', () => {
  const rooms = placeHomeRooms([room('office', 'office')]);
  const states = new Map([
    ['binary_sensor.arbitrary_office_presence', 'on'],
    ['sensor.custom_office_x', '0'], ['sensor.custom_office_y', '1000'],
  ]);
  const result = collectHomePresence(
    rooms,
    [profile('office')],
    id => states.get(id),
    Date.now(),
    { office: { presence: { occupied: false, status: 'clear' } } },
  );
  assert.equal(result.rooms[0].occupied, true);
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
  const result = collectHomePresence(
    rooms,
    [profile('mirror')],
    id => states.get(id),
    Date.now(),
    { mirror: { presence: { occupied: true } } },
    false,
  );
  assert.equal(result.people.length, 0);
  assert.equal(result.rooms[0].occupied, false);

  states.set('sensor.arbitrary_mirror_count', 'unavailable');
  const unknownCount = collectHomePresence(
    rooms,
    [profile('mirror')],
    id => states.get(id),
    Date.now(),
    { mirror: { presence: { occupied: false } } },
    true,
  );
  assert.equal(unknownCount.people.length, 1);
  assert.equal(unknownCount.people[0].approximate, true);
  assert.equal(unknownCount.rooms[0].occupied, true);

  const now = Date.now();
  states.set('sensor.arbitrary_mirror_count', '1');
  states.set('sensor.custom_mirror_x', { state: '2500', received_at_ms: now - 6000 });
  states.set('sensor.custom_mirror_y', { state: '500', received_at_ms: now - 6000 });
  const staleCoordinates = collectHomePresence(
    rooms, [profile('mirror')], id => states.get(id), now,
  );
  assert.equal(staleCoordinates.people.length, 1);
  assert.equal(staleCoordinates.people[0].approximate, true);
  assert.equal(staleCoordinates.rooms[0].occupied, true);
});

test('excess excluded slots never hide a mismatching aggregate count', () => {
  const reflected = room('mirror', 'mirror');
  reflected.zones = [{ type: 'exclusion', points: [
    { x: -200, y: 800 }, { x: 800, y: 800 }, { x: 800, y: 1700 }, { x: -200, y: 1700 },
  ] }];
  const radar = profile('mirror');
  radar.targets = [
    { index: 1, x_entity_id: 'sensor.mirror_x1', y_entity_id: 'sensor.mirror_y1' },
    { index: 2, x_entity_id: 'sensor.mirror_x2', y_entity_id: 'sensor.mirror_y2' },
  ];
  const states = new Map([
    ['binary_sensor.arbitrary_mirror_presence', 'on'],
    ['sensor.arbitrary_mirror_count', '1'],
    ['sensor.mirror_x1', '2500'], ['sensor.mirror_y1', '500'],
    ['sensor.mirror_x2', '2600'], ['sensor.mirror_y2', '500'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([reflected]), [radar], id => states.get(id),
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].occupied, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('a source-owned exclusion never hides another radar', () => {
  const mixedRoom = room('mirror', 'reflected');
  mixedRoom.sensors = [
    { id: 'reflected', deviceId: 'reflected', x: 0, y: -1200, rotation: 90 },
    { id: 'visible', deviceId: 'visible', x: 0, y: -1200, rotation: 90 },
  ];
  mixedRoom.zones = [{ type: 'exclusion', sensorId: 'reflected', points: [
    { x: -200, y: 800 }, { x: 600, y: 800 }, { x: 600, y: 1600 }, { x: -200, y: 1600 },
  ] }];
  const states = new Map();
  for (const source of ['reflected', 'visible']) {
    states.set(`binary_sensor.arbitrary_${source}_presence`, 'on');
    states.set(`sensor.arbitrary_${source}_count`, '1');
    states.set(`sensor.custom_${source}_x`, '2500');
    states.set(`sensor.custom_${source}_y`, '500');
  }
  const result = collectHomePresence(
    placeHomeRooms([mixedRoom]), [profile('reflected'), profile('visible')], id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.people.find(person => !person.approximate).sourceDeviceId, 'registry-visible');
});

test('fractional and stale target counts can never explain away presence', () => {
  const reflected = room('mirror', 'mirror');
  reflected.zones = [{ type: 'exclusion', points: [
    { x: -200, y: 800 }, { x: 600, y: 800 }, { x: 600, y: 1600 }, { x: -200, y: 1600 },
  ] }];
  const now = 100_000;
  for (const count of [
    { state: '1.5', received_at_ms: now },
    { state: '1', received_at_ms: now - 20_000 },
  ]) {
    const states = new Map([
      ['binary_sensor.arbitrary_mirror_presence', 'on'],
      ['sensor.arbitrary_mirror_count', count],
      ['sensor.custom_mirror_x', { state: '2500', received_at_ms: now }],
      ['sensor.custom_mirror_y', { state: '500', received_at_ms: now }],
    ]);
    const result = collectHomePresence(placeHomeRooms([reflected]), [profile('mirror')], id => states.get(id), now);
    assert.equal(result.people.length, 1);
    assert.equal(result.people[0].approximate, true);
    assert.equal(result.rooms[0].occupied, true);
  }
});

test('one excluded radar cannot hide occupancy while another room sensor is unknown', () => {
  const mixedRoom = room('mirror', 'reflected');
  mixedRoom.sensors = [
    { id: 'reflected', deviceId: 'reflected', x: 0, y: -1200, rotation: 90 },
    { id: 'uncertain', deviceId: 'uncertain', x: 0, y: -1200, rotation: 90 },
  ];
  mixedRoom.zones = [{ type: 'exclusion', points: [
    { x: -200, y: 800 }, { x: 600, y: 800 }, { x: 600, y: 1600 }, { x: -200, y: 1600 },
  ] }];
  const states = new Map([
    ['binary_sensor.arbitrary_reflected_presence', 'on'],
    ['sensor.arbitrary_reflected_count', '1'],
    ['sensor.custom_reflected_x', '2500'],
    ['sensor.custom_reflected_y', '500'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([mixedRoom]),
    [profile('reflected'), profile('uncertain')],
    id => states.get(id),
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
  const mixedRoom = room('mirror', 'reflected');
  mixedRoom.sensors = [
    { id: 'reflected', deviceId: 'reflected', x: 0, y: -1200, rotation: 90 },
    { id: 'uncertain', deviceId: 'uncertain', x: 0, y: -1200, rotation: 90 },
  ];
  mixedRoom.zones = [{ type: 'exclusion', points: [
    { x: -200, y: 800 }, { x: 600, y: 800 }, { x: 600, y: 1600 }, { x: -200, y: 1600 },
  ] }];
  const states = new Map([
    ['binary_sensor.arbitrary_reflected_presence', 'on'],
    ['sensor.arbitrary_reflected_count', '1'],
    ['sensor.custom_reflected_x', '2500'],
    ['sensor.custom_reflected_y', '500'],
    ['binary_sensor.arbitrary_uncertain_presence', 'off'],
    ['sensor.arbitrary_uncertain_count', 'unavailable'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([mixedRoom]),
    [profile('reflected'), profile('uncertain')],
    id => states.get(id),
    Date.now(),
    { mirror: { presence: { occupied: true, status: 'occupied' } } },
    true,
  );
  assert.equal(result.rooms[0].occupied, true);
});

test('Lovelace geometry never skips the shared vacancy hold', () => {
  const reflected = room('mirror', 'mirror');
  reflected.zones = [{ type: 'exclusion', points: [
    { x: -200, y: 800 }, { x: 600, y: 800 }, { x: 600, y: 1600 }, { x: -200, y: 1600 },
  ] }];
  const states = new Map([
    ['binary_sensor.arbitrary_mirror_presence', 'on'],
    ['sensor.arbitrary_mirror_count', '1'],
    ['sensor.custom_mirror_x', '2500'],
    ['sensor.custom_mirror_y', '500'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([reflected]),
    [profile('mirror')],
    id => states.get(id),
    Date.now(),
    { mirror: { presence: { occupied: true, status: 'clearing' } } },
    true,
  );
  assert.equal(result.rooms[0].occupied, true);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].id, 'mirror:runtime-hold');
  assert.equal(result.people[0].approximate, true);
});

test('Lovelace keeps a target just outside a drawn wall visible', () => {
  const rooms = placeHomeRooms([room('office', 'office')]);
  const states = new Map([
    ['binary_sensor.arbitrary_office_presence', 'on'],
    ['sensor.arbitrary_office_count', '1'],
    ['sensor.custom_office_x', '1200'],
    ['sensor.custom_office_y', '2100'],
  ]);
  const result = collectHomePresence(rooms, [profile('office')], id => states.get(id));
  assert.equal(result.people.length, 1);
  assert.equal(result.rooms[0].occupied, true);
});

test('Lovelace never suppresses a target against an unordered room wall chain', () => {
  const malformed = room('living', 'living');
  const walls = [
    { x1: 0, y1: 0, x2: 5000, y2: 0 },
    { x1: 5000, y1: 4000, x2: 0, y2: 4000 },
    { x1: 5000, y1: 0, x2: 5000, y2: 4000 },
    { x1: 0, y1: 4000, x2: 0, y2: 0 },
  ];
  malformed.walls = walls;
  malformed.sensors[0] = { ...malformed.sensors[0], x: 0, y: 0, rotation: 90 };
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.custom_living_x', '500'],
    ['sensor.custom_living_y', '2500'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([malformed]), [profile('living')], id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
});

test('uses the Room Designer presence source selection in Lovelace', () => {
  const configured = room('office', 'selected');
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
  const result = collectHomePresence(
    placeHomeRooms([configured]),
    [profile('selected'), profile('ignored')],
    id => states.get(id),
  );
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(hasUnknownVisiblePeopleCount(result.rooms, result.people), true);
});

test('Lovelace never claims an exact count when visible targets exceed the count entity', () => {
  const radar = profile('office');
  radar.targets = [
    { index: 1, x_entity_id: 'sensor.office_x1', y_entity_id: 'sensor.office_y1' },
    { index: 2, x_entity_id: 'sensor.office_x2', y_entity_id: 'sensor.office_y2' },
  ];
  const states = new Map([
    ['binary_sensor.arbitrary_office_presence', 'on'],
    ['sensor.arbitrary_office_count', '1'],
    ['sensor.office_x1', '-400'], ['sensor.office_y1', '1200'],
    ['sensor.office_x2', '400'], ['sensor.office_y2', '1200'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('office', 'office')]),
    [radar],
    id => states.get(id),
  );
  assert.equal(result.people.length, 2);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace never hides equal-sized close source tracks in a stateless view', () => {
  const sensorA = { id: 'a', deviceId: 'a', x: 0, y: -1200, rotation: 90 };
  const sensorB = { id: 'b', deviceId: 'b', x: 0, y: -1200, rotation: 90 };
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
      testRoom.aggregation = { tracking: {
        experimental_fusion: true,
        duplicate_distance_mm: 650,
        source_alignments: {
          a: { placement_fingerprint: 'a|0|-1200|90|0||||forward_xy||0|0', sample_count: 3, rmse_mm: 100 },
          b: { placement_fingerprint: 'b|0|-1200|90|0||||forward_xy||0|0', sample_count: 3, rmse_mm: 100 },
        },
      } };
      const result = collectHomePresence(placeHomeRooms([testRoom]), profiles, id => states.get(id));
      assert.equal(result.people.length, 4);
      assert.equal(result.rooms[0].peopleCountKnown, false);
    }
  }
});

test('Lovelace never merges or claims a count before current room alignment', () => {
  const testRoom = room('office', null);
  testRoom.sensors = [
    { id: 'a', deviceId: 'a', x: 0, y: -1200, rotation: 90 },
    { id: 'b', deviceId: 'b', x: 0, y: -1200, rotation: 90 },
  ];
  testRoom.aggregation = { tracking: { experimental_fusion: true, duplicate_distance_mm: 650, source_alignments: {} } };
  const states = new Map([
    ['binary_sensor.arbitrary_a_presence', 'on'], ['sensor.arbitrary_a_count', '1'],
    ['binary_sensor.arbitrary_b_presence', 'on'], ['sensor.arbitrary_b_count', '1'],
    ['sensor.custom_a_x', '0'], ['sensor.custom_a_y', '1000'],
    ['sensor.custom_b_x', '20'], ['sensor.custom_b_y', '1000'],
  ]);
  const result = collectHomePresence(placeHomeRooms([testRoom]), [profile('a'), profile('b')], id => states.get(id));
  assert.equal(result.people.length, 2);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace alignment alone never claims a temporal association it cannot verify', () => {
  const testRoom = room('office', null);
  testRoom.sensors = [
    { id: 'a', deviceId: 'a', x: 0, y: -1200, rotation: 90 },
    { id: 'b', deviceId: 'b', x: 0, y: -1200, rotation: 90 },
  ];
  testRoom.aggregation = { tracking: {
    experimental_fusion: true,
    duplicate_distance_mm: 650,
    source_alignments: {
      a: { placement_fingerprint: 'a|0|-1200|90|0||||forward_xy||0|0', sample_count: 3, rmse_mm: 100 },
      b: { placement_fingerprint: 'b|0|-1200|90|0||||forward_xy||0|0', sample_count: 3, rmse_mm: 100 },
    },
  } };
  const states = new Map([
    ['binary_sensor.arbitrary_a_presence', 'on'], ['sensor.arbitrary_a_count', '1'],
    ['binary_sensor.arbitrary_b_presence', 'on'], ['sensor.arbitrary_b_count', '1'],
    ['sensor.custom_a_x', '0'], ['sensor.custom_a_y', '1000'],
    ['sensor.custom_b_x', '20'], ['sensor.custom_b_y', '1000'],
  ]);
  const result = collectHomePresence(placeHomeRooms([testRoom]), [profile('a'), profile('b')], id => states.get(id));
  assert.equal(result.people.length, 2);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace status follows the shared room coordinator instead of raw card timing', () => {
  const testRoom = room('office', null);
  const states = new Map([
    ['binary_sensor.arbitrary_office_presence', 'off'],
    ['sensor.arbitrary_office_count', '0'],
  ]);
  const placed = placeHomeRooms([testRoom]);
  const occupied = collectHomePresence(
    placed,
    [profile('office')],
    id => states.get(id),
    Date.now(),
    { office: { presence: { occupied: true, status: 'occupied' } } },
  );
  assert.equal(occupied.rooms[0].occupied, true);
  const unknown = collectHomePresence(
    placed,
    [profile('office')],
    id => states.get(id),
    Date.now(),
    { office: { presence: { occupied: null, status: 'unknown' } } },
  );
  assert.equal(unknown.rooms[0].available, false);
  const failed = collectHomePresence(
    placed,
    [profile('office')],
    id => states.get(id),
    Date.now(),
    { office: { presence: { occupied: false, status: 'clear' } } },
    false,
  );
  assert.equal(failed.rooms[0].available, false);
  assert.equal(failed.rooms[0].occupied, false);
});

test('Lovelace fails closed when one physical radar is linked to two rooms', () => {
  const rooms = placeHomeRooms([
    room('living', 'shared'),
    room('office', 'shared', { x: 5000, y: 0, floor: 0, rotationDeg: 0 }),
  ]);
  const states = new Map([
    ['binary_sensor.arbitrary_shared_presence', 'on'],
    ['sensor.arbitrary_shared_count', '1'],
    ['sensor.custom_shared_x', '300'],
    ['sensor.custom_shared_y', '1200'],
  ]);
  const result = collectHomePresence(
    rooms,
    [profile('shared')],
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

test('Lovelace never claims an exact count while room runtime is unavailable', () => {
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.custom_living_x', '300'],
    ['sensor.custom_living_y', '1200'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]),
    [profile('living')],
    id => states.get(id),
    Date.now(),
    {},
    false,
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace rejects a future inactive slot as exact-count evidence', () => {
  const now = 100_000;
  const radar = profile('living');
  radar.targets[0].presence_entity_id = 'binary_sensor.slot_presence';
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', { state: 'on', received_at_ms: now }],
    ['sensor.arbitrary_living_count', { state: '1', received_at_ms: now }],
    ['binary_sensor.slot_presence', { state: 'off', received_at_ms: now + 1 }],
    ['sensor.custom_living_x', { state: '300', received_at_ms: now }],
    ['sensor.custom_living_y', { state: '1200', received_at_ms: now }],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id), now,
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace does not trust LD2460 geometry reported in the wrong mode', () => {
  const radar = profile('living', 1000);
  radar.profile.radar_model = 'ld2460';
  radar.profile.required_installation_mode = 'side';
  radar.profile.current_hardware_mode = 'top';
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.custom_living_x', '0.3'],
    ['sensor.custom_living_y', '1.2'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]), [radar], id => states.get(id),
  );
  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].approximate, true);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace requires a known room runtime state before claiming an exact count', () => {
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'off'],
    ['sensor.arbitrary_living_count', '0'],
    ['sensor.custom_living_x', '0'],
    ['sensor.custom_living_y', '0'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]),
    [profile('living')],
    id => states.get(id),
    Date.now(),
    { living: { presence: { occupied: null, status: 'unknown' } } },
    true,
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace rejects a future primary presence report as clear evidence', () => {
  const now = 100_000;
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', { state: 'off', received_at_ms: now + 1 }],
    ['sensor.arbitrary_living_count', { state: '0', received_at_ms: now }],
    ['sensor.custom_living_x', { state: '0', received_at_ms: now }],
    ['sensor.custom_living_y', { state: '0', received_at_ms: now }],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]),
    [profile('living')],
    id => states.get(id),
    now,
    { living: { presence: { occupied: false, status: 'clear' } } },
    true,
  );
  assert.equal(result.rooms[0].peopleCountKnown, false);
  assert.equal(result.rooms[0].available, false);
});

test('Lovelace follows the live LD2460 mode entity instead of a cached profile', () => {
  const radar = profile('living', 1000);
  radar.profile.radar_model = 'ld2460';
  radar.profile.required_installation_mode = 'side';
  radar.profile.current_hardware_mode = 'side';
  radar.profile.reported_installation_mode_entity_id = 'sensor.live_installation_mode';
  const states = new Map([
    ['sensor.live_installation_mode', 'top'],
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.custom_living_x', '0.3'],
    ['sensor.custom_living_y', '1.2'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('living', 'living')]),
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

test('Lovelace accepts authoritative clear with unchanged but available radar states', () => {
  const now = 100_000;
  const old = 10_000;
  const states = new Map([
    ['binary_sensor.arbitrary_office_presence', { state: 'off', received_at_ms: old }],
    ['sensor.arbitrary_office_count', { state: '0', received_at_ms: old }],
    ['sensor.custom_office_x', { state: '0', received_at_ms: old }],
    ['sensor.custom_office_y', { state: '0', received_at_ms: old }],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([room('office', 'office')]), [profile('office')],
    id => states.get(id), now,
    { office: { presence: { occupied: false, status: 'clear' } } }, true,
  );
  assert.equal(result.rooms[0].available, true);
  assert.equal(result.rooms[0].occupied, false);
  assert.equal(result.rooms[0].peopleCountKnown, false);
});

test('Lovelace never suppresses against a room outline traced twice', () => {
  const malformed = room('living', 'living');
  malformed.walls = [...malformed.walls, ...malformed.walls.map(wall => ({ ...wall }))];
  malformed.sensors[0] = { ...malformed.sensors[0], x: 0, y: 0, rotation: 90 };
  const states = new Map([
    ['binary_sensor.arbitrary_living_presence', 'on'],
    ['sensor.arbitrary_living_count', '1'],
    ['sensor.custom_living_x', '500'],
    ['sensor.custom_living_y', '5000'],
  ]);
  const result = collectHomePresence(
    placeHomeRooms([malformed]), [profile('living')], id => states.get(id),
  );
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
});
