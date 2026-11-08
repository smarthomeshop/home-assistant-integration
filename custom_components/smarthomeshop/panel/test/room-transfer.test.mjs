import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ROOM_EXPORT_FORMAT,
  createRoomExportDocument,
  makeImportedRoom,
  parseRoomExportText,
  roomExportFilename,
  summarizeRoom,
} from '../src/utils/room-transfer.ts';

const ROOM = {
  id: 'room_original',
  name: 'Woonkamer Noord',
  walls: [
    { x1: 0, y1: 0, x2: 4000, y2: 0 },
    { x1: 4000, y1: 0, x2: 4000, y2: 5000 },
  ],
  furniture: [{ id: 'sofa_1', typeId: 'sofa', x: 100, y: 200, width: 2000, height: 900, rotationDeg: 90 }],
  devices: [],
  doors: [{ id: 'door_1', wallIndex: 0, position: 0.4, width: 900, openDirection: 'inward', openSide: 'left' }],
  windows: [{ id: 'window_1', wallIndex: 1, position: 0.5, width: 1200, height: 1100, windowType: 'fixed' }],
  mirrors: [{ id: 'mirror_1', wallIndex: 1, position: 0.7, width: 800, height: 1200, protectionEnabled: true, reflectionDepthMm: 1500 }],
  sensors: [{ id: 'sensor_1', deviceId: 'arbitrary-device-id' }],
  zones: [{ id: 1, name: 'Bank', type: 'detection', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] }],
  calibration: { enabled: true, corners: [], gridSizeMm: 100, snapToGrid: true },
  tracking: { smoothingEnabled: true, smoothingAlpha: 0.35, maxJumpMm: 1200, trackHoldMs: 1200, crossZoneTracking: true },
};

test('creates and parses a complete portable room backup', () => {
  const backup = createRoomExportDocument(ROOM, '2026-11-08T10:00:00.000Z');
  assert.equal(backup.format, ROOM_EXPORT_FORMAT);
  assert.equal(backup.schemaVersion, 1);
  assert.deepEqual(parseRoomExportText(JSON.stringify(backup)), ROOM);
});

test('accepts a raw room object from older exports', () => {
  assert.deepEqual(parseRoomExportText(JSON.stringify(ROOM)), ROOM);
});

test('imports as a new room and strips backend timestamps', () => {
  const imported = makeImportedRoom({ ...ROOM, created_at: 'old', updated_at: 'old', house: { x: 500, y: 600, floor: 2, rotationDeg: 90 } }, 'room_new', 'Woonkamer kopie');
  assert.equal(imported.id, 'room_new');
  assert.equal(imported.name, 'Woonkamer kopie');
  assert.equal('created_at' in imported, false);
  assert.equal('updated_at' in imported, false);
  assert.equal('house' in imported, false);
  assert.equal(imported.sensors[0].deviceId, 'arbitrary-device-id');
});

test('rejects invalid, future and excessively large room documents', () => {
  assert.throws(() => parseRoomExportText('{'), error => error.code === 'invalid_json');
  assert.throws(() => parseRoomExportText(JSON.stringify({ format: 'other', schemaVersion: 1, room: ROOM })), error => error.code === 'invalid_format');
  assert.throws(() => parseRoomExportText(JSON.stringify({ format: ROOM_EXPORT_FORMAT, schemaVersion: 2, room: ROOM })), error => error.code === 'unsupported_version');
  assert.throws(() => parseRoomExportText(JSON.stringify({ ...ROOM, walls: [{ x1: 0, y1: 0, x2: 'bad', y2: 1 }] })), error => error.code === 'invalid_room');
  assert.throws(() => parseRoomExportText(JSON.stringify({ ...ROOM, furniture: Array.from({ length: 501 }, () => ({})) })), error => error.code === 'invalid_room');
  for (const field of ['furniture', 'devices', 'doors', 'windows', 'mirrors', 'sensors', 'zones']) {
    assert.throws(
      () => parseRoomExportText(JSON.stringify({ ...ROOM, [field]: [null] })),
      error => error.code === 'invalid_room',
      `${field} must reject malformed nested entries`,
    );
  }
  assert.throws(() => parseRoomExportText(JSON.stringify({ ...ROOM, sensors: [{ x: 'bad', y: 0 }] })), error => error.code === 'invalid_room');
  assert.throws(() => parseRoomExportText(JSON.stringify({ ...ROOM, doors: [{ ...ROOM.doors[0], wallIndex: -1 }] })), error => error.code === 'invalid_room');
  assert.throws(() => parseRoomExportText(JSON.stringify({ ...ROOM, windows: [{ ...ROOM.windows[0], wallIndex: 99 }] })), error => error.code === 'invalid_room');
  assert.throws(() => parseRoomExportText(JSON.stringify({ ...ROOM, mirrors: [{ ...ROOM.mirrors[0], position: Number.NaN }] })), error => error.code === 'invalid_room');
});

test('creates a safe filename and a useful content summary', () => {
  assert.equal(roomExportFilename('Slaapkamer Noël / Oost'), 'slaapkamer-noel-oost-smarthomeshop-room.json');
  assert.deepEqual(summarizeRoom(ROOM), {
    walls: 2,
    furniture: 1,
    doors: 1,
    windows: 1,
    mirrors: 1,
    sensors: 1,
    zones: 1,
  });
});
