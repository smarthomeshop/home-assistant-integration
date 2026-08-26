import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normaliseRoomViewHeight,
  resolveRoomForDevice,
  roomSensorForDevice,
} from '../src/utils/room-selection.ts';

const rooms = [
  { id: 'living', sensors: [{ id: 'one', deviceId: 'device-living' }] },
  { id: 'bedroom', sensors: [{ id: 'two', deviceId: 'device-bedroom' }] },
];

test('selects the room linked to each configured Home Assistant device', () => {
  assert.equal(resolveRoomForDevice(rooms, ['device-living'])?.id, 'living');
  assert.equal(resolveRoomForDevice(rooms, ['device-bedroom'])?.id, 'bedroom');
  assert.equal(resolveRoomForDevice(rooms, ['missing']), null);
});

test('supports an explicit room override without changing automatic matching', () => {
  assert.equal(resolveRoomForDevice(rooms, ['device-living'], 'bedroom')?.id, 'bedroom');
  assert.equal(roomSensorForDevice(rooms[1], ['device-bedroom'])?.id, 'two');
});

test('does not silently use the first of several unlinked rooms', () => {
  const legacy = [{ id: 'one', sensor: { x: 0 } }, { id: 'two', sensor: { x: 100 } }];
  assert.equal(resolveRoomForDevice(legacy, ['device']), null);
  assert.equal(resolveRoomForDevice([legacy[0]], ['device'])?.id, 'one');
});

test('keeps room visual height within a useful sections-dashboard range', () => {
  assert.equal(normaliseRoomViewHeight(100), 240);
  assert.equal(normaliseRoomViewHeight(450), 450);
  assert.equal(normaliseRoomViewHeight(999), 720);
  assert.equal(normaliseRoomViewHeight('invalid'), 360);
});
