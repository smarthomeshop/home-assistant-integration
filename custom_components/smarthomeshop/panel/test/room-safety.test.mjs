import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyInstallationChangeToOriginRoom,
  authoritativeAlignmentRevocation,
  fusionCanRun,
  mergeHardwareRoomMetadata,
  reconcileRoomAfterAlignmentRevocation,
  roomWithFusionRevoked,
  zoneAppliesToSensor,
} from '../src/utils/room-safety.ts';

const room = (updatedAt, name = 'Current browser room') => ({
  id: 'living', name, updated_at: updatedAt,
  walls: [{ x1: 0, y1: 0, x2: 4000, y2: 0 }],
  furniture: [], devices: [], zones: [],
  aggregation: {
    version: 1,
    presence: { freshness_seconds: 30, vacancy_delay_seconds: 10, source_ids: [] },
    climate: {
      temperature: { strategy: 'average', primary_source_id: null },
      humidity: { strategy: 'average', primary_source_id: null },
      co2: { strategy: 'average', primary_source_id: null },
    },
    tracking: {
      experimental_fusion: true, duplicate_distance_mm: 650,
      observation_freshness_ms: 5000, handoff_hold_ms: 1800, z_tolerance_mm: 700,
      source_alignments: { sensor_b: { sample_count: 8 } },
    },
  },
});

test('adopts the server revision only for the exact revision that was revoked', () => {
  const current = room('rev-1');
  const revokedRoom = room('rev-2', 'Stale server copy');
  revokedRoom.aggregation.tracking.alignment_revoked_at = '2026-11-10T12:00:00Z';
  const result = reconcileRoomAfterAlignmentRevocation(current, {
    room: { ...revokedRoom, walls: [] },
    replaced_updated_at: 'rev-1',
  }, 'rev-1');
  assert.equal(result.revisionAdopted, true);
  assert.equal(result.room.updated_at, 'rev-2');
  assert.equal(result.room.name, 'Current browser room');
  assert.deepEqual(result.room.walls, current.walls);
  assert.equal(result.room.aggregation.tracking.experimental_fusion, false);
  assert.deepEqual(result.room.aggregation.tracking.source_alignments, {});
  assert.equal(result.room.aggregation.tracking.alignment_revoked_at, '2026-11-10T12:00:00Z');
});

test('never grafts a fresh server revision onto browser contents changed meanwhile', () => {
  const current = room('rev-browser-newer');
  const result = reconcileRoomAfterAlignmentRevocation(current, {
    room: room('rev-server-new'), replaced_updated_at: 'rev-1',
  }, 'rev-1');
  assert.equal(result.revisionAdopted, false);
  assert.equal(result.room.updated_at, 'rev-browser-newer');
  assert.equal(result.room.name, 'Current browser room');
  assert.equal(result.room.aggregation.tracking.experimental_fusion, false);
  assert.deepEqual(result.room.aggregation.tracking.source_alignments, {});
});

test('leaves legacy rooms intact when no aggregation block exists', () => {
  const legacy = { ...room('rev-1'), aggregation: undefined };
  assert.equal(roomWithFusionRevoked(legacy), legacy);
});

test('a newer authoritative revocation disables every open Designer', () => {
  assert.equal(authoritativeAlignmentRevocation(undefined, 'revoked-1'), 'revoked-1');
  assert.equal(authoritativeAlignmentRevocation('revoked-1', 'revoked-1'), null);
  assert.equal(authoritativeAlignmentRevocation('revoked-1', 'revoked-2'), 'revoked-2');
});

test('pending safety revocation overrides otherwise ready fusion', () => {
  assert.equal(fusionCanRun(true, true), false);
  assert.equal(fusionCanRun(true, false), true);
  assert.equal(fusionCanRun(false, false), false);
});

test('an asynchronous installation response only mutates its originating room', () => {
  const origin = {
    ...room('rev-origin'), id: 'origin',
    sensors: [{ id: 'source-a', deviceId: 'radar-a', heightMm: 2400 }],
  };
  const selectedLater = {
    ...room('rev-other'), id: 'other',
    sensors: [{ id: 'source-a', deviceId: 'radar-b', heightMm: 2200 }],
  };
  const updated = applyInstallationChangeToOriginRoom(
    [origin, selectedLater], 'origin', 'source-a', 2700,
  );
  assert.equal(updated[0].sensors[0].heightMm, 2700);
  assert.equal(updated[0].aggregation.tracking.experimental_fusion, false);
  assert.deepEqual(updated[0].aggregation.tracking.source_alignments, {});
  assert.equal(updated[1], selectedLater,
    'the room selected while the service call was pending must remain untouched');
});

test('hardware metadata saves preserve every floorplan field and custom zone ID', () => {
  const original = {
    ...room('rev-geometry'),
    doors: [{ id: 'door-custom', wallIndex: 0, position: .333333, width: 923 }],
    mirrors: [{ id: 'mirror-special', wallIndex: 0, position: .412345, width: 777, protectionEnabled: true }],
    zones: [{ id: 'customer-zone-A', name: 'Exact ID', type: 'exclusion', points: [{ x: 1.25, y: 2.75 }] }],
    sensors: [{
      id: 'source-a', deviceId: 'device-a', x: 123.456789, y: 987.654321,
      x_m: .123456789, custom_future_field: { keep: true },
      z_mapping: { mode: 'raw', verified: false, future_mapping_field: 'keep' },
    }],
    calibration: { enabled: false, future_calibration_field: 'keep' },
    floorplan_future_data: { staircase: 'keep-me', underlay: 'keep-me-too' },
  };
  original.aggregation.future_aggregation_field = 'keep';
  original.aggregation.presence.future_presence_field = 'keep';
  original.aggregation.climate.temperature.future_metric_field = 'keep';
  original.aggregation.tracking.future_tracking_field = 'keep';
  original.aggregation.tracking.source_alignments.sensor_b.future_alignment_field = 'remove-with-alignment';
  const aggregation = structuredClone(original.aggregation);
  aggregation.presence.vacancy_delay_seconds = 42;
  delete aggregation.tracking.source_alignments.sensor_b;
  aggregation.tracking.source_alignments['source-a'] = {
    sample_count: 4,
  };
  original.aggregation.tracking.source_alignments['source-a'] = {
    sample_count: 3,
    future_alignment_field: 'keep',
  };
  const calibration = { enabled: true, corners: [{ x: 1, y: 2 }] };
  const updated = mergeHardwareRoomMetadata(original, aggregation, calibration, new Map([[
    'source-a', { mode: 'floor_up', verified: true, verification_fingerprint: 'verified' },
  ]]));

  assert.equal(updated.zones[0].id, 'customer-zone-A');
  assert.equal(updated.sensors[0].x, 123.456789);
  assert.equal(updated.sensors[0].x_m, .123456789);
  assert.deepEqual(updated.floorplan_future_data, original.floorplan_future_data);
  assert.deepEqual(updated.doors, original.doors);
  assert.deepEqual(updated.mirrors, original.mirrors);
  assert.deepEqual(updated.sensors[0].custom_future_field, { keep: true });
  assert.equal(updated.aggregation.presence.vacancy_delay_seconds, 42);
  assert.equal(updated.aggregation.future_aggregation_field, 'keep');
  assert.equal(updated.aggregation.presence.future_presence_field, 'keep');
  assert.equal(updated.aggregation.climate.temperature.future_metric_field, 'keep');
  assert.equal(updated.aggregation.tracking.future_tracking_field, 'keep');
  assert.equal(updated.aggregation.tracking.source_alignments['source-a'].future_alignment_field, 'keep');
  assert.equal(updated.aggregation.tracking.source_alignments.sensor_b, undefined,
    'a deliberately revoked source alignment must not be restored');
  assert.equal(updated.sensors[0].z_mapping.mode, 'floor_up');
  assert.equal(updated.sensors[0].z_mapping.future_mapping_field, 'keep');
  assert.equal(updated.calibration.future_calibration_field, 'keep');
  assert.deepEqual(original.sensors[0].z_mapping, {
    mode: 'raw', verified: false, future_mapping_field: 'keep',
  },
    'the authoritative room object must not be mutated');
});

test('firmware zones are sent only to their owning sensor', () => {
  assert.equal(zoneAppliesToSensor({}, 'source-a'), true,
    'unowned legacy zones remain shared');
  assert.equal(zoneAppliesToSensor({ sensorId: 'source-a' }, 'source-a'), true);
  assert.equal(zoneAppliesToSensor({ sensorId: 'source-a' }, 'source-b'), false);
  assert.equal(zoneAppliesToSensor({ sensor_id: 'source-a' }, 'source-a'), true);
  assert.equal(zoneAppliesToSensor({ sensor_id: 'source-a' }, 'source-b'), false);
});
