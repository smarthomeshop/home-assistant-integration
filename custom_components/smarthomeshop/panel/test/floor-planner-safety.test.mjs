import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FloorPlanValidationError,
  floorPlanValidationCopy,
  floorPlanValidationMessage,
  hasUnknownVisiblePeopleCount,
  removeOrphanedSensorZones,
  removeZonesOwnedBySensor,
  zoneOwnerIsAvailable,
} from '../../www/floor-planner/safety.js';

const zones = [
  { id: 'shared' },
  { id: 'owned-a', sensorId: 'source-a' },
  { id: 'owned-b', sensorId: 'source-b' },
  { id: 'owned-legacy', sensor_id: 'source-a' },
];

test('deleting a radar removes its owned zones instead of broadening them', () => {
  assert.deepEqual(
    removeZonesOwnedBySensor(zones, 'source-a').map(zone => zone.id),
    ['shared', 'owned-b'],
  );
});

test('import removes orphaned source zones instead of converting them to shared zones', () => {
  assert.deepEqual(
    removeOrphanedSensorZones(zones, new Set(['source-b'])).map(zone => zone.id),
    ['shared', 'owned-b'],
  );
});

test('every reachable validation error is translated in all five languages', () => {
  const required = Object.keys(floorPlanValidationCopy.en);
  for (const language of ['en', 'nl', 'de', 'fr', 'es']) {
    assert.deepEqual(Object.keys(floorPlanValidationCopy[language]), required);
    const message = floorPlanValidationMessage(
      new FloorPlanValidationError('calibration_sensor', { room: 'Office' }),
      `${language}-XX`,
    );
    assert.match(message, /Office/);
    assert.doesNotMatch(message, /\{room\}/);
  }
});

test('unsupported languages fall back to English validation copy', () => {
  const message = floorPlanValidationMessage(
    new FloorPlanValidationError('sensor_outside_room'),
    'it-IT',
  );
  assert.equal(message, floorPlanValidationCopy.en.sensor_outside_room);
});

test('an explicit legacy or current zone owner must resolve in the room', () => {
  const available = new Set(['source-a']);
  assert.equal(zoneOwnerIsAvailable(undefined, available), true);
  assert.equal(zoneOwnerIsAvailable('source-a', available), true);
  assert.equal(zoneOwnerIsAvailable('missing-source', available), false);
});

test('a visible marker makes an unknown room count remain unknown', () => {
  const rooms = [
    { roomId: 'office', visible: true, occupied: false, peopleCountKnown: false },
    { roomId: 'hidden', visible: false, occupied: true, peopleCountKnown: false },
  ];
  assert.equal(hasUnknownVisiblePeopleCount(rooms, [{ roomId: 'office' }]), true);
  assert.equal(hasUnknownVisiblePeopleCount(rooms, [{ roomId: 'hidden' }]), false);
  assert.equal(hasUnknownVisiblePeopleCount([
    { roomId: 'offline', visible: true, available: false, occupied: false, peopleCountKnown: false },
  ], []), true);
  assert.equal(hasUnknownVisiblePeopleCount([
    { roomId: 'clear', visible: true, available: true, occupied: false, peopleCountKnown: false },
  ], []), false);
  assert.equal(hasUnknownVisiblePeopleCount([
    { roomId: 'office', visible: true, occupied: true, peopleCountKnown: true },
  ], [{ roomId: 'office' }]), false);
});
