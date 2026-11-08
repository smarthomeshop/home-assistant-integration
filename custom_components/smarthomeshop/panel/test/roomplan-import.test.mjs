import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isAppleRoomPlan,
  parseAppleRoomPlan,
  parseAppleRoomPlanText,
} from '../src/utils/roomplan-import.ts';

const surface = (length, height, x, y, z, angle, extra = {}) => ({
  dimensions: [length, height, extra.depth ?? 0],
  transform: [
    Math.cos(angle), 0, Math.sin(angle), 0,
    0, 1, 0, 0,
    -Math.sin(angle), 0, Math.cos(angle), 0,
    x, y, z, 1,
  ],
  ...extra,
});

const wall = (ax, az, bx, bz) => surface(
  Math.hypot(bx - ax, bz - az),
  2.5,
  (ax + bx) / 2,
  1.25,
  (az + bz) / 2,
  Math.atan2(bz - az, bx - ax),
);

const capturedRoom = (name = 'Office') => ({
  name,
  walls: [
    wall(4, 0, 4, 3),
    wall(0, 3, 0, 0),
    wall(0, 0, 4, 0),
    wall(4, 3, 0, 3),
  ],
  doors: [surface(0.9, 2, 2, 1, 0, 0)],
  windows: [surface(1.2, 1.1, 4, 1.4, 1.5, Math.PI / 2)],
  objects: [
    surface(2, 0.8, 2, 0.4, 2.3, Math.PI, { depth: 0.9, category: { sofa: {} } }),
    surface(0.4, 0.8, 1, 0.4, 1, 0, { depth: 0.4, category: { unknownThing: {} } }),
  ],
});

test('detects Apple RoomPlan JSON and converts metres to a centred millimetre room', () => {
  const result = parseAppleRoomPlan(capturedRoom());
  assert.equal(result.rooms.length, 1);
  const room = result.rooms[0];
  assert.equal(room.name, 'Office');
  assert.equal(room.walls.length, 4);
  const xs = room.walls.map(item => item.x1);
  const ys = room.walls.map(item => item.y1);
  assert.deepEqual([Math.min(...xs), Math.max(...xs)], [-2000, 2000]);
  assert.deepEqual([Math.min(...ys), Math.max(...ys)], [-1500, 1500]);
  assert.equal(room.doors.length, 1);
  assert.equal(room.doors[0].width, 900);
  assert.equal(room.windows.length, 1);
  assert.equal(room.windows[0].width, 1200);
  assert.equal(room.furniture[0].typeId, 'sofa');
  assert.equal(room.furniture[0].width, 2000);
  assert.ok(result.warnings.includes('skipped_furniture'));
});

test('imports each room from an Apple CapturedStructure separately', () => {
  const result = parseAppleRoomPlan({ rooms: [capturedRoom('Kitchen'), capturedRoom('Bedroom')] });
  assert.deepEqual(result.rooms.map(room => room.name), ['Kitchen', 'Bedroom']);
  assert.notEqual(result.rooms[0].id, result.rooms[1].id);
});

test('uses an iOS floor outline when it is available', () => {
  const scan = capturedRoom('Floor outline');
  scan.floors = [{
    transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    polygonCorners: [[0, 0, 0], [5, 0, 0], [5, 0, 2], [0, 0, 2]],
  }];
  const room = parseAppleRoomPlan(scan).rooms[0];
  const xs = room.walls.map(item => item.x1);
  const ys = room.walls.map(item => item.y1);
  assert.deepEqual([Math.min(...xs), Math.max(...xs)], [-2500, 2500]);
  assert.deepEqual([Math.min(...ys), Math.max(...ys)], [-1000, 1000]);
});

test('accepts nested 4×4 transform columns', () => {
  const scan = capturedRoom();
  scan.walls = scan.walls.map(item => ({ ...item, transform: [
    item.transform.slice(0, 4), item.transform.slice(4, 8), item.transform.slice(8, 12), item.transform.slice(12, 16),
  ] }));
  assert.equal(parseAppleRoomPlan(scan).rooms[0].walls.length, 4);
});

test('rejects arbitrary JSON and incomplete scans', () => {
  assert.equal(isAppleRoomPlan({ walls: [] }), false);
  assert.throws(() => parseAppleRoomPlan({ hello: 'world' }), error => error.code === 'not_roomplan');
  assert.throws(() => parseAppleRoomPlanText('{'), error => error.code === 'invalid_json');
  assert.throws(
    () => parseAppleRoomPlan({ walls: [wall(0, 0, 1, 0), wall(8, 8, 9, 8), wall(20, 20, 21, 20)] }),
    error => error.code === 'no_room_boundary',
  );
});
