import test from 'node:test';
import assert from 'node:assert/strict';

import {
  enrichedSourceForProfile,
  runtimeSnapshotIsAuthoritative,
  StatefulWholeHomeFusion,
  applyAuthoritativeRuntimeTracking,
  sourcePlacementFingerprint,
} from '../../www/floor-planner/fusion.js';

const sources = [
  { id: 'a', deviceId: 'device-a', x: 0, y: 0, rotation: 0, heightMm: 2600, mountingMode: 'ceiling', capabilities: { radar_model: '', coordinate_frame: '', coordinate_projection: '', installation_mode: '', installation_height_mm: 0, installation_angle_tenths: 0 } },
  { id: 'b', deviceId: 'device-b', x: 1000, y: 0, rotation: 0, heightMm: 2600, mountingMode: 'ceiling', capabilities: { radar_model: '', coordinate_frame: '', coordinate_projection: '', installation_mode: '', installation_height_mm: 0, installation_angle_tenths: 0 } },
];
const profiles = sources.map(source => ({
  device_id: source.deviceId, entity_prefix: source.deviceId, aliases: [],
  profile: {
    radar_model: '', coordinate_frame: '', coordinate_projection: '', current_hardware_mode: '',
    installation_height_m: null, installation_angle_deg: null,
  },
}));
const alignedSources = sources.map((source, index) => enrichedSourceForProfile(source, profiles[index]));
const tracking = {
  experimental_fusion: true, duplicate_distance_mm: 650, handoff_hold_ms: 1800,
  source_alignments: Object.fromEntries(alignedSources.map(source => [source.id, {
    placement_fingerprint: sourcePlacementFingerprint(source), sample_count: 4,
    rmse_mm: 80, duplicate_distance_mm: 650,
  }])),
};
const room = { id: 'room', name: 'Room', sensors: sources, aggregation: { tracking } };
const frame = (offset, spread = 80) => sources.map((source, index) => ({
  id: `room:${source.deviceId}:1`, roomId: 'room', roomName: 'Room', floor: 0,
  x: 1000 + offset + index * spread, y: 1000 + offset,
  approximate: false, sourceDeviceId: source.deviceId,
}));

test('one close frame never merges two radar reports', () => {
  const fusion = new StatefulWholeHomeFusion();
  const result = fusion.apply(frame(0), [room], profiles, 0);
  assert.equal(result.people.length, 2);
  assert.equal(result.fusedRoomIds.size, 0);
  assert.equal(result.ambiguousRoomIds.has('room'), true);
});

test('four correlated movement reports merge after the safety gate', () => {
  const fusion = new StatefulWholeHomeFusion();
  let result;
  for (let index = 0; index < 4; index += 1) {
    result = fusion.apply(frame(index * 140), [room], profiles, index * 300);
  }
  assert.equal(result.people.length, 1);
  assert.equal(result.fusedRoomIds.has('room'), true);
  assert.equal(result.people[0].sourceDeviceId, 'fused');
});

test('a changed sensor placement invalidates fusion immediately', () => {
  const fusion = new StatefulWholeHomeFusion();
  const moved = { ...room, sensors: [{ ...sources[0], x: 500 }, sources[1]] };
  const result = fusion.apply(frame(500), [moved], profiles, 1500);
  assert.equal(result.people.length, 2);
  assert.equal(result.fusedRoomIds.size, 0);
});

test('two people reported by the same radar are never merged', () => {
  const fusion = new StatefulWholeHomeFusion();
  const people = [
    { ...frame(0)[0], id: 'first' },
    { ...frame(0)[0], id: 'second', x: frame(0)[0].x + 50 },
  ];
  const result = fusion.apply(people, [room], profiles, 0);
  assert.equal(result.people.length, 2);
});

test('competing cross-radar assignments remain separate and ambiguous forever', () => {
  const fusion = new StatefulWholeHomeFusion();
  let result;
  for (let index = 0; index < 6; index += 1) {
    const offset = index * 140;
    result = fusion.apply([
      { ...frame(offset)[0], id: 'a-one', x: 1000 + offset },
      { ...frame(offset)[0], id: 'a-two', x: 1120 + offset },
      { ...frame(offset)[1], id: 'b-one', x: 1060 + offset },
    ], [room], profiles, index * 300);
  }
  assert.equal(result.people.length, 3);
  assert.equal(result.fusedRoomIds.size, 0);
  assert.equal(result.ambiguousRoomIds.has('room'), true);
});

test('a retained handoff track is approximate and never part of an exact count', () => {
  const fusion = new StatefulWholeHomeFusion();
  const twoPeople = offset => [
    { ...frame(offset)[0], id: 'a-one', x: 1000 + offset },
    { ...frame(offset)[1], id: 'b-one', x: 1080 + offset },
    { ...frame(offset)[0], id: 'a-two', x: 3000 + offset },
    { ...frame(offset)[1], id: 'b-two', x: 3080 + offset },
  ];
  for (let index = 0; index < 4; index += 1) {
    fusion.apply(twoPeople(index * 140), [room], profiles, index * 300);
  }
  const result = fusion.apply([
    { ...frame(560)[0], id: 'a-one', x: 1560 },
    { ...frame(560)[1], id: 'b-one', x: 1640 },
  ], [room], profiles, 1250);
  assert.equal(result.people.length, 2);
  assert.equal(result.people.filter(person => !person.approximate).length, 1);
  assert.equal(result.people.filter(person => person.approximate).length, 1);
});

test('an authoritative runtime revocation disables stale browser fusion immediately', () => {
  const [updated] = applyAuthoritativeRuntimeTracking([room], {
    room: {
      tracking: {
        ...tracking,
        experimental_fusion: true,
        alignment_revoked_at: '2026-11-12T10:00:00Z',
      },
    },
  }, true);
  assert.equal(updated.aggregation.tracking.experimental_fusion, false);
  assert.deepEqual(updated.aggregation.tracking.source_alignments, {});
  assert.equal(room.aggregation.tracking.experimental_fusion, true,
    'the cached project must not be mutated');
});

test('runtime tracking can never enable fusion disabled by the saved room', () => {
  const localDisabled = {
    ...room,
    aggregation: { tracking: { ...tracking, experimental_fusion: false } },
  };
  const [updated] = applyAuthoritativeRuntimeTracking([localDisabled], {
    room: { tracking: { ...tracking, experimental_fusion: true } },
  }, true);
  assert.equal(updated.aggregation.tracking.experimental_fusion, false);
  assert.deepEqual(updated.aggregation.tracking.source_alignments, {});
});

test('fusion fails closed until tracking permission is authoritative', () => {
  const [missingSnapshot] = applyAuthoritativeRuntimeTracking([room], {}, false);
  const [failedSnapshot] = applyAuthoritativeRuntimeTracking([room], {
    room: { tracking },
  }, false);
  for (const updated of [missingSnapshot, failedSnapshot]) {
    assert.equal(updated.aggregation.tracking.experimental_fusion, false);
    assert.deepEqual(updated.aggregation.tracking.source_alignments, {});
  }
});

test('runtime authority expires and rejects future receipt timestamps', () => {
  const snapshot = { tracking_authoritative: true };
  assert.equal(runtimeSnapshotIsAuthoritative(snapshot, 1000, 3000), true);
  assert.equal(runtimeSnapshotIsAuthoritative(snapshot, 1000, 3501), false);
  assert.equal(runtimeSnapshotIsAuthoritative(snapshot, 4000, 3000), false);
  assert.equal(runtimeSnapshotIsAuthoritative({ tracking_authoritative: false }, 1000, 2000), false);
});

test('three radars merge only when every cross-source relationship is unambiguous', () => {
  const thirdSource = {
    id: 'c', deviceId: 'device-c', x: 2000, y: 0, rotation: 0,
    heightMm: 2600, mountingMode: 'ceiling', capabilities: {},
  };
  const thirdProfile = {
    device_id: thirdSource.deviceId, entity_prefix: thirdSource.deviceId, aliases: [],
    profile: {
      radar_model: '', coordinate_frame: '', coordinate_projection: '',
      current_hardware_mode: '', installation_height_m: null, installation_angle_deg: null,
    },
  };
  const allSources = [...sources, thirdSource];
  const allProfiles = [...profiles, thirdProfile];
  const aligned = allSources.map((source, index) => enrichedSourceForProfile(source, allProfiles[index]));
  const allTracking = {
    ...tracking,
    source_alignments: Object.fromEntries(aligned.map(source => [source.id, {
      placement_fingerprint: sourcePlacementFingerprint(source), sample_count: 4,
      rmse_mm: 80, duplicate_distance_mm: 650,
    }])),
  };
  const threeRadarRoom = {
    ...room, sensors: allSources, aggregation: { tracking: allTracking },
  };
  const fusion = new StatefulWholeHomeFusion();
  let result;
  for (let index = 0; index < 5; index += 1) {
    const offset = index * 140;
    result = fusion.apply(allSources.map((source, sourceIndex) => ({
      id: `room:${source.deviceId}:1`, roomId: 'room', roomName: 'Room', floor: 0,
      x: 1000 + offset + sourceIndex * 40, y: 1000 + offset,
      approximate: false, sourceDeviceId: source.deviceId,
    })), [threeRadarRoom], allProfiles, index * 300);
  }
  assert.equal(result.people.length, 1);
  assert.equal(result.fusedRoomIds.has('room'), true);

  const competing = new StatefulWholeHomeFusion();
  for (let index = 0; index < 6; index += 1) {
    const offset = index * 140;
    result = competing.apply([
      { id: 'a-1', roomId: 'room', roomName: 'Room', floor: 0, x: 2000 + offset, y: 1000, approximate: false, sourceDeviceId: 'device-a' },
      { id: 'b-1', roomId: 'room', roomName: 'Room', floor: 0, x: 2600 + offset, y: 1000, approximate: false, sourceDeviceId: 'device-b' },
      { id: 'c-1', roomId: 'room', roomName: 'Room', floor: 0, x: 1700 + offset, y: 1000, approximate: false, sourceDeviceId: 'device-c' },
      { id: 'c-2', roomId: 'room', roomName: 'Room', floor: 0, x: 2900 + offset, y: 1000, approximate: false, sourceDeviceId: 'device-c' },
    ], [threeRadarRoom], allProfiles, index * 300);
  }
  assert.equal(result.people.length, 4);
  assert.equal(result.fusedRoomIds.size, 0);
  assert.equal(result.ambiguousRoomIds.has('room'), true);
});

test('a near miss remains ambiguous instead of becoming an exact count', () => {
  const fusion = new StatefulWholeHomeFusion();
  const observations = [
    { ...frame(0)[0], x: 1000 },
    { ...frame(0)[1], x: 1700 },
  ];
  const result = fusion.apply(observations, [room], profiles, 0);
  assert.equal(result.people.length, 2);
  assert.equal(result.fusedRoomIds.size, 0);
  assert.equal(result.ambiguousRoomIds.has('room'), true);
});

test('fusion evidence is discarded after a reporting gap', () => {
  const fusion = new StatefulWholeHomeFusion();
  for (let index = 0; index < 4; index += 1) {
    fusion.apply(frame(index * 140), [room], profiles, index * 300);
  }
  const merged = fusion.apply(frame(560), [room], profiles, 1250);
  assert.equal(merged.people.length, 1);

  const afterGap = fusion.apply(frame(1000), [room], profiles, 7000);
  assert.equal(afterGap.people.length, 2);
  assert.equal(afterGap.fusedRoomIds.size, 0);
  assert.equal(afterGap.ambiguousRoomIds.has('room'), true);
});

test('interleaved independent radar reports can confirm one correlated walker', () => {
  const fusion = new StatefulWholeHomeFusion();
  let result = fusion.apply(frame(0).map(person => ({ ...person, observedAtMs: 0 })), [room], profiles, 0);
  for (let cycle = 1; cycle <= 4; cycle += 1) {
    const offset = cycle * 140;
    result = fusion.apply([
      { ...frame(offset)[0], observedAtMs: cycle * 300 },
      { ...frame((cycle - 1) * 140)[1], observedAtMs: (cycle - 1) * 300 + 20 },
    ], [room], profiles, cycle * 300);
    result = fusion.apply([
      { ...frame(offset)[0], observedAtMs: cycle * 300 },
      { ...frame(offset)[1], observedAtMs: cycle * 300 + 20 },
    ], [room], profiles, cycle * 300 + 20);
  }
  assert.equal(result.people.length, 1);
  assert.equal(result.fusedRoomIds.has('room'), true);
});

test('confirmed fusion splits after cumulative slow one-sided drift', () => {
  const fusion = new StatefulWholeHomeFusion();
  for (let index = 0; index < 5; index += 1) {
    fusion.apply(frame(index * 140).map(person => ({ ...person, observedAtMs: index * 300 })),
      [room], profiles, index * 300);
  }
  let result;
  for (let index = 1; index <= 20; index += 1) {
    result = fusion.apply([
      { ...frame(560)[0], x: 1560 + index * 9, observedAtMs: 1500 + index * 100 },
      { ...frame(560)[1], x: 1640, observedAtMs: 1500 + index * 100 + 10 },
    ], [room], profiles, 1500 + index * 100 + 10);
  }
  assert.equal(result.people.length, 2);
  assert.equal(result.fusedRoomIds.size, 0);
  assert.equal(result.ambiguousRoomIds.has('room'), true);
});

test('fused track identifiers remain unique across rooms', () => {
  const secondSources = sources.map(source => ({
    ...source,
    id: `${source.id}-second`,
    deviceId: `${source.deviceId}-second`,
  }));
  const secondProfiles = secondSources.map(source => ({
    device_id: source.deviceId, entity_prefix: source.deviceId, aliases: [],
    profile: {
      radar_model: '', coordinate_frame: '', coordinate_projection: '', current_hardware_mode: '',
      installation_height_m: null, installation_angle_deg: null,
    },
  }));
  const secondAligned = secondSources.map((source, index) =>
    enrichedSourceForProfile(source, secondProfiles[index]));
  const secondRoom = {
    id: 'room-second', name: 'Second room', sensors: secondSources,
    aggregation: { tracking: {
      ...tracking,
      source_alignments: Object.fromEntries(secondAligned.map(source => [source.id, {
        placement_fingerprint: sourcePlacementFingerprint(source), sample_count: 4,
        rmse_mm: 80, duplicate_distance_mm: 650,
      }])),
    } },
  };
  const fusion = new StatefulWholeHomeFusion();
  let result;
  for (let index = 0; index < 5; index += 1) {
    const offset = index * 140;
    result = fusion.apply([
      ...frame(offset),
      ...secondSources.map((source, sourceIndex) => ({
        id: `room-second:${source.deviceId}:1`, roomId: 'room-second', roomName: 'Second room', floor: 0,
        x: 5000 + offset + sourceIndex * 80, y: 1000 + offset,
        approximate: false, sourceDeviceId: source.deviceId,
      })),
    ], [room, secondRoom], [...profiles, ...secondProfiles], index * 300);
  }
  assert.equal(result.people.length, 2);
  assert.equal(new Set(result.people.map(person => person.id)).size, 2);
  assert.deepEqual(new Set(result.people.map(person => person.roomId)), new Set(['room', 'room-second']));
});

test('fingerprints use the saved sensor height when live installation height is absent', () => {
  const source = {
    id: 'source', deviceId: 'device', x: 1, y: 2, rotation: 3,
    heightMm: 2600, mountingMode: 'ceiling', capabilities: {},
  };
  const profile = {
    device_id: 'device', entity_prefix: 'device', aliases: [],
    profile: {
      radar_model: 'ld2450', coordinate_frame: 'x_lateral_y_forward',
      coordinate_projection: 'forward_xy', current_hardware_mode: 'top',
      installation_height_m: null, installation_angle_deg: null,
    },
  };
  const enriched = enrichedSourceForProfile(source, profile);
  assert.equal(enriched.capabilities.installation_height_mm, 2600);
  assert.match(sourcePlacementFingerprint(enriched), /\|2600\|0$/);
});
