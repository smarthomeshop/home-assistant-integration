import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CrossSourceAssociationGate,
  MultiSensorTrackEngine,
  alignmentCaptureFingerprint,
  assessRoomTrackingStatus,
  assessAlignmentSamples,
  assessPairwiseAlignmentNetwork,
  exclusionsExplainAggregatePresence,
  fuseObservations,
  fusionReadiness,
  isFreshObservation,
  mapReportedZToRoom,
  reconcileReportedTargetCount,
  roomFusionOptions,
  sourcePlacementFingerprint,
  shouldRevokeAlignment,
} from '../src/utils/multi-sensor-tracking.ts';

const source = (id, overrides = {}) => ({ id, deviceId: `device-${id}`, x: 100, y: 200, rotation: 90, heightMm: 2600, ...overrides });
const observation = (sourceId, localTrackId, x, y, roomZMm = null, observedAtMs = 1000) => ({
  sourceId, localTrackId, x, y, roomZMm, rawZMm: roomZMm, observedAtMs,
});

test('raw Z never becomes room height without explicit verified mapping', () => {
  assert.equal(mapReportedZToRoom(750, 2600, { mode: 'raw', verified: true }), null);
  assert.equal(mapReportedZToRoom(750, 2600, { mode: 'floor_up', verified: false }), null);
  assert.equal(mapReportedZToRoom(750, 2600, { mode: 'floor_up', verified: true }), 750);
  assert.equal(mapReportedZToRoom(750, 2600, { mode: 'sensor_down', verified: true }), 1850);
  assert.equal(mapReportedZToRoom(-10, 2600, { mode: 'floor_up', verified: true }), null);
  assert.equal(mapReportedZToRoom(5000, 2600, { mode: 'sensor_down', verified: true }), null);
});

test('freshness rejects stale and future coordinate reports', () => {
  assert.equal(isFreshObservation(9_000, 10_000, 2_000), true);
  assert.equal(isFreshObservation(7_000, 10_000, 2_000), false);
  assert.equal(isFreshObservation(16_000, 10_000, 2_000), false);
  assert.equal(isFreshObservation(null, 10_000, 2_000), false);
});

test('fusion readiness is invalidated when a sensor placement changes', () => {
  const sources = [source('a'), source('b')];
  const alignments = Object.fromEntries(sources.map(item => [item.id, {
    placement_fingerprint: sourcePlacementFingerprint(item), verified_at: '2026-11-09T12:00:00Z', sample_count: 3, rmse_mm: 120, duplicate_distance_mm: 650,
  }]));
  assert.equal(fusionReadiness(sources, alignments, 650).ready, true);
  assert.deepEqual(fusionReadiness([{ ...sources[0], rotation: 100 }, sources[1]], alignments, 650).staleSourceIds, ['a']);
});

test('in-progress alignment captures are bound to installation geometry', () => {
  const sources = [
    source('a', { capabilities: { installation_angle_tenths: 120 } }),
    source('b', { capabilities: { installation_angle_tenths: 120 } }),
  ];
  const original = alignmentCaptureFingerprint(sources);
  assert.equal(alignmentCaptureFingerprint([...sources].reverse()), original);
  assert.notEqual(
    alignmentCaptureFingerprint([
      sources[0],
      source('b', { capabilities: { installation_angle_tenths: 180 } }),
    ]),
    original,
  );
});

test('fusion evidence expires after a radar installation or coordinate-frame change', () => {
  const sources = [source('a', { capabilities: {
    radar_model: 'ld2460',
    coordinate_frame: 'x_lateral_y_forward',
    coordinate_projection: 'forward_xy',
    installation_mode: 'side',
    installation_height_mm: 2600,
    installation_angle_tenths: 150,
  } }), source('b')];
  const alignments = Object.fromEntries(sources.map(item => [item.id, {
    placement_fingerprint: sourcePlacementFingerprint(item),
    verified_at: '2026-11-09T12:00:00Z',
    sample_count: 3,
    rmse_mm: 120,
    duplicate_distance_mm: 650,
  }]));
  assert.equal(fusionReadiness(sources, alignments, 650).ready, true);
  const changed = [{
    ...sources[0],
    capabilities: { ...sources[0].capabilities, installation_angle_tenths: 200 },
  }, sources[1]];
  assert.deepEqual(fusionReadiness(changed, alignments, 650).staleSourceIds, ['a']);
});

test('fusion approval is bound to the duplicate-distance safety threshold', () => {
  const sources = [source('a'), source('b')];
  const alignments = Object.fromEntries(sources.map(item => [item.id, {
    placement_fingerprint: sourcePlacementFingerprint(item),
    verified_at: '2026-11-09T12:00:00Z',
    sample_count: 3,
    rmse_mm: 120,
    duplicate_distance_mm: 650,
  }]));
  assert.equal(fusionReadiness(sources, alignments, 650).ready, true);
  assert.deepEqual(fusionReadiness(sources, alignments, 500).staleSourceIds, ['a', 'b']);
});

test('alignment needs three spread-out, mutually consistent samples', () => {
  const good = [
    { a: { x: 0, y: 0 }, b: { x: 80, y: 30 } },
    { a: { x: 1500, y: 0 }, b: { x: 1560, y: -20 } },
    { a: { x: 0, y: 1600 }, b: { x: -40, y: 1550 } },
  ];
  assert.equal(assessAlignmentSamples(good, ['a', 'b']).ready, true);
  assert.equal(assessAlignmentSamples(good.slice(0, 2), ['a', 'b']).reason, 'need_samples');
  assert.equal(assessAlignmentSamples(good.map(() => good[0]), ['a', 'b']).reason, 'need_spread');
  assert.equal(assessAlignmentSamples([good[0], good[0], good[1]], ['a', 'b']).reason, 'need_spread');
  const collinear = [good[0], good[1], {
    a: { x: 3000, y: 0 }, b: { x: 3060, y: -20 },
  }];
  assert.equal(assessAlignmentSamples(collinear, ['a', 'b']).reason, 'need_spread');
  const bad = good.map(sample => ({ ...sample, b: { x: sample.b.x + 1500, y: sample.b.y } }));
  assert.equal(assessAlignmentSamples(bad, ['a', 'b']).reason, 'too_far_apart');
  assert.equal(assessAlignmentSamples([...good, good[0]], ['a', 'b']).ready, true,
    'an accidental nearby fourth capture must not invalidate a useful triangle');
});

test('pairwise alignment connects adjacent sensor overlaps without requiring one shared spot', () => {
  const samples = [
    { a: { x: 0, y: 0 }, b: { x: 40, y: 20 } },
    { a: { x: 1500, y: 0 }, b: { x: 1540, y: 10 } },
    { a: { x: 0, y: 1500 }, b: { x: 30, y: 1530 } },
    { b: { x: 3000, y: 0 }, c: { x: 3030, y: 20 } },
    { b: { x: 4500, y: 0 }, c: { x: 4540, y: -10 } },
    { b: { x: 3000, y: 1500 }, c: { x: 3020, y: 1540 } },
  ];
  const network = assessPairwiseAlignmentNetwork(samples, ['a', 'b', 'c']);
  assert.equal(network.ready, true);
  assert.deepEqual(network.missingSourceIds, []);
  assert.equal(assessPairwiseAlignmentNetwork(samples.slice(0, 3), ['a', 'b', 'c']).ready, false);
});

test('an explicit pair disagreement blocks an otherwise connected alignment network', () => {
  const positions = [{ x: 0, y: 0 }, { x: 1600, y: 0 }, { x: 0, y: 1600 }];
  const samples = positions.map(point => ({
    a: { x: point.x - 400, y: point.y },
    b: { x: point.x, y: point.y },
    c: { x: point.x + 400, y: point.y },
  }));
  const network = assessPairwiseAlignmentNetwork(samples, ['a', 'b', 'c']);
  assert.equal(network.pairAssessments['a::b'].ready, true);
  assert.equal(network.pairAssessments['b::c'].ready, true);
  assert.equal(network.pairAssessments['a::c'].reason, 'too_far_apart');
  assert.equal(network.ready, false);
});

test('one conflicting capture blocks a chained alignment before three samples exist', () => {
  const samples = [
    { a: { x: 0, y: 0 }, b: { x: 40, y: 20 } },
    { a: { x: 1500, y: 0 }, b: { x: 1540, y: 10 } },
    { a: { x: 0, y: 1500 }, b: { x: 30, y: 1530 } },
    { b: { x: 3000, y: 0 }, c: { x: 3030, y: 20 } },
    { b: { x: 4500, y: 0 }, c: { x: 4540, y: -10 } },
    { b: { x: 3000, y: 1500 }, c: { x: 3020, y: 1540 } },
    { a: { x: 0, y: 0 }, c: { x: 1600, y: 0 } },
  ];
  const network = assessPairwiseAlignmentNetwork(samples, ['a', 'b', 'c']);
  assert.equal(network.pairAssessments['a::b'].ready, true);
  assert.equal(network.pairAssessments['b::c'].ready, true);
  assert.equal(network.pairAssessments['a::c'].reason, 'too_far_apart');
  assert.equal(network.ready, false);
  assert.equal(shouldRevokeAlignment(network), true);
});

test('Room Designer only claims a count when every configured source is live', () => {
  const clear = {
    discovered: true,
    live: true,
    presenceInputsComplete: true,
    targetCountComplete: true,
    positioning: true,
    activeTargetCount: 0,
    primaryPresence: false,
    supplementaryPresence: false,
    unpositionedTargetPresence: false,
    reportedTargetCount: 0,
  };
  assert.equal(assessRoomTrackingStatus([clear], false, false, 0).countKnown, true);
  assert.equal(assessRoomTrackingStatus([{ ...clear, live: false }], false, false, 0).countKnown, false);
  assert.equal(assessRoomTrackingStatus([
    { ...clear, activeTargetCount: 1, primaryPresence: true, reportedTargetCount: 1 },
    { ...clear, live: false },
  ], true, false, 1).countKnown, false);
  assert.equal(assessRoomTrackingStatus([
    { ...clear, activeTargetCount: 1, primaryPresence: true, reportedTargetCount: 1 },
    { ...clear, activeTargetCount: 1, primaryPresence: true, reportedTargetCount: 1 },
  ], true, false, 1).countKnown, false,
  'position-only fusion must not undercount two people moving closely together');
  assert.equal(assessRoomTrackingStatus([
    { ...clear, presenceInputsComplete: false },
  ], false, false, 0).countKnown, false);
  assert.equal(assessRoomTrackingStatus([
    { ...clear, targetCountComplete: false },
  ], false, false, 0).countKnown, false);
  assert.equal(assessRoomTrackingStatus([
    { ...clear, activeTargetCount: 2, reportedTargetCount: 1 },
  ], false, false, 2).countKnown, false,
  'a count lower than the visible targets must also remain uncertain');
});

test('Room Designer exposes primary-only presence without inventing a count', () => {
  const status = assessRoomTrackingStatus([{
    discovered: true,
    live: true,
    presenceInputsComplete: true,
    targetCountComplete: true,
    positioning: false,
    activeTargetCount: 0,
    primaryPresence: true,
    supplementaryPresence: false,
    unpositionedTargetPresence: false,
    reportedTargetCount: null,
  }], false, false, 0);
  assert.equal(status.occupied, true);
  assert.equal(status.hasUnpositionedPresence, true);
  assert.equal(status.countKnown, false);
});

test('Room Designer treats unexplained target count as unpositioned presence', () => {
  const status = assessRoomTrackingStatus([{
    discovered: true,
    live: true,
    presenceInputsComplete: true,
    targetCountComplete: true,
    positioning: true,
    activeTargetCount: 1,
    primaryPresence: true,
    supplementaryPresence: false,
    unpositionedTargetPresence: false,
    reportedTargetCount: 2,
  }], false, false, 1);
  assert.equal(status.occupied, true);
  assert.equal(status.hasUnpositionedPresence, true);
  assert.equal(status.countKnown, false);
});

test('an exclusion clears aggregate presence only with complete accounting evidence', () => {
  const base = {
    hasTargetCountContract: true,
    reportedTargetCount: 1,
    explicitTargetContractComplete: false,
    explicitPositiveTargetCount: 0,
    excludedTargetCount: 1,
    visibleTargetCount: 0,
    hasUnpositionedTarget: false,
  };
  assert.equal(exclusionsExplainAggregatePresence(base), true);
  assert.equal(exclusionsExplainAggregatePresence({ ...base, reportedTargetCount: null }), false);
  assert.equal(exclusionsExplainAggregatePresence({ ...base, visibleTargetCount: 1 }), false);
  assert.equal(exclusionsExplainAggregatePresence({ ...base, hasUnpositionedTarget: true }), false);
  assert.equal(exclusionsExplainAggregatePresence({ ...base, reportedTargetCount: 2 }), false);
  assert.equal(exclusionsExplainAggregatePresence({ ...base, excludedTargetCount: 2 }), false,
    'more excluded coordinates than the reported count is contradictory, not clear');
  assert.equal(exclusionsExplainAggregatePresence({
    ...base,
    hasTargetCountContract: false,
    reportedTargetCount: null,
    explicitTargetContractComplete: true,
    explicitPositiveTargetCount: 1,
  }), true);
  assert.equal(exclusionsExplainAggregatePresence({
    ...base,
    hasTargetCountContract: false,
    reportedTargetCount: null,
    explicitTargetContractComplete: false,
    explicitPositiveTargetCount: 1,
  }), false);
  assert.equal(exclusionsExplainAggregatePresence({
    ...base,
    hasTargetCountContract: false,
    reportedTargetCount: null,
    explicitTargetContractComplete: true,
    explicitPositiveTargetCount: 1,
    excludedTargetCount: 2,
  }), false);
});

test('target-count reconciliation never hides a mismatch behind exclusions', () => {
  assert.deepEqual(reconcileReportedTargetCount(2, 1, 1), {
    effectiveTargetCount: 1,
    accountingComplete: true,
  });
  assert.deepEqual(reconcileReportedTargetCount(1, 0, 2), {
    effectiveTargetCount: 1,
    accountingComplete: false,
  });
  assert.deepEqual(reconcileReportedTargetCount(2, 1, 0), {
    effectiveTargetCount: 2,
    accountingComplete: false,
  });
  assert.deepEqual(reconcileReportedTargetCount(null, 0, 0), {
    effectiveTargetCount: null,
    accountingComplete: false,
  });
});

test('fusion never merges two tracks from the same source and uses verified Z tolerance', () => {
  const fused = fuseObservations([
    observation('a', '1', 0, 0, 500),
    observation('a', '2', 300, 0, 1600),
    observation('b', '1', 40, 0, 520),
    observation('b', '2', 320, 0, 500),
  ], { duplicateDistanceMm: 650, zToleranceMm: 300 });
  assert.equal(fused.length, 3);
  assert.ok(fused.some(item => item.memberIds.includes('a:1') && item.memberIds.includes('b:1')));
  assert.ok(fused.some(item => item.memberIds.length === 1 && item.memberIds[0] === 'a:2'));
});

test('fused Z averages only sources that actually provide mapped Z', () => {
  const fused = fuseObservations([
    observation('a', '1', 0, 0, null),
    observation('b', '1', 10, 0, 500),
    observation('c', '1', 20, 0, 1000),
  ], { duplicateDistanceMm: 650, zToleranceMm: 700 });
  assert.equal(fused.length, 1);
  assert.equal(fused[0].roomZMm, 750);
});

test('cross-source association stays separate until repeated correlated movement confirms it', () => {
  const gate = new CrossSourceAssociationGate();
  const options = { duplicateDistanceMm: 650, zToleranceMm: 500 };
  let assessment;
  for (let frame = 0; frame < 4; frame += 1) {
    const timestamp = 1000 + frame * 300;
    assessment = gate.update([
      observation('a', '1', frame * 150, 0, null, timestamp),
      observation('b', '7', frame * 150 + 50, 20, null, timestamp),
    ], options);
  }
  assert.equal(assessment.ambiguous, false);
  assert.equal(assessment.confirmedPairs.size, 1);
  assert.equal(fuseObservations([
    observation('a', '1', 450, 0, null, 1900),
    observation('b', '7', 500, 20, null, 1900),
  ], options, assessment.confirmedPairs).length, 1);
});

test('a single close frame is never enough to hide a possible second person', () => {
  const gate = new CrossSourceAssociationGate();
  const options = { duplicateDistanceMm: 650, zToleranceMm: 500 };
  const observations = [observation('a', '1', 0, 0), observation('b', '1', 80, 0)];
  const assessment = gate.update(observations, options);
  assert.equal(assessment.ambiguous, true);
  assert.equal(fuseObservations(observations, options, assessment.confirmedPairs).length, 2);
});

test('asynchronous reports of one plausible walker never claim an exact double count', () => {
  const gate = new CrossSourceAssociationGate();
  const options = roomFusionOptions(650, 500, 5000);
  const observations = [
    observation('a', '1', 0, 0, null, 1000),
    observation('b', '1', 720, 0, null, 1600),
  ];
  const assessment = gate.update(observations, options);
  assert.equal(assessment.ambiguous, true);
  assert.equal(assessment.confirmedPairs.size, 0);
  assert.equal(fuseObservations(observations, options, assessment.confirmedPairs).length, 2);
  const clear = {
    discovered: true,
    live: true,
    presenceInputsComplete: true,
    targetCountComplete: true,
    positioning: true,
    activeTargetCount: 1,
    primaryPresence: true,
    supplementaryPresence: false,
    unpositionedTargetPresence: false,
    reportedTargetCount: 1,
  };
  assert.equal(assessRoomTrackingStatus([clear, clear], true, assessment.ambiguous, 2).countKnown, false);
});

test('production fusion timing is bounded independently from coordinate freshness', () => {
  assert.equal(roomFusionOptions(650, 500, 5000).reportSkewGraceMs, 1500);
  assert.equal(roomFusionOptions(650, 500, 1000).reportSkewGraceMs, 500);
  assert.equal(roomFusionOptions(650, 500, 15000).reportSkewGraceMs, 1500);
});

test('a three-source group only fuses when every co-observed pair is confirmed', () => {
  const observations = [
    observation('a', '1', 0, 0),
    observation('b', '1', 40, 0),
    observation('c', '1', 80, 0),
  ];
  const confirmed = new Set(['a:1::b:1', 'b:1::c:1']);
  const fused = fuseObservations(observations, { duplicateDistanceMm: 650, zToleranceMm: 500 }, confirmed);
  assert.equal(fused.length, 2);
  assert.ok(fused.some(item => item.memberIds.length === 2));
  assert.ok(fused.some(item => item.memberIds.length === 1));
});

test('confirmed fusion survives offset device report timing', () => {
  const gate = new CrossSourceAssociationGate();
  const options = { duplicateDistanceMm: 650, zToleranceMm: 500 };
  let assessment;
  let aTimestamp = 1000;
  let bTimestamp = 1000;
  for (let step = 0; step < 8; step += 1) {
    if (step % 2 === 0) aTimestamp += 300;
    else bTimestamp += 300;
    const progressA = Math.floor(step / 2) * 150;
    const progressB = Math.floor((step + 1) / 2) * 150;
    assessment = gate.update([
      observation('a', '1', progressA, 0, null, aTimestamp),
      observation('b', '1', progressB + 50, 20, null, bTimestamp),
    ], options);
  }
  assessment = gate.update([
    observation('a', '1', 750, 0, null, aTimestamp + 300),
    observation('b', '1', 800, 20, null, bTimestamp + 300),
  ], options);
  assert.equal(assessment.confirmedPairs.size, 1);
  assessment = gate.update([
    observation('a', '1', 900, 0, null, aTimestamp + 600),
    observation('b', '1', 800, 20, null, bTimestamp + 300),
  ], options);
  assert.equal(assessment.confirmedPairs.size, 1);
});

test('confirmed fusion splits after one source remains frozen beyond the report grace period', () => {
  const gate = new CrossSourceAssociationGate();
  const options = { duplicateDistanceMm: 650, zToleranceMm: 500, reportSkewGraceMs: 1500 };
  let assessment;
  for (let frame = 0; frame < 4; frame += 1) {
    const timestamp = 1000 + frame * 300;
    assessment = gate.update([
      observation('a', '1', frame * 150, 0, null, timestamp),
      observation('b', '1', frame * 150 + 50, 0, null, timestamp),
    ], options);
  }
  assert.equal(assessment.confirmedPairs.size, 1);
  assessment = gate.update([
    observation('a', '1', 100, 0, null, 4000),
    observation('b', '1', 500, 0, null, 1900),
  ], options);
  assert.equal(assessment.confirmedPairs.size, 0);
  assert.equal(assessment.ambiguous, true);
});

test('inconsistent dual reports reset the complete correlation window', () => {
  const gate = new CrossSourceAssociationGate();
  const options = { duplicateDistanceMm: 650, zToleranceMm: 500 };
  const frames = [
    [0, 50],
    [400, 50],
    [0, 450],
    [400, 450],
  ];
  let assessment;
  frames.forEach(([a, b], index) => {
    assessment = gate.update([
      observation('a', '1', a, 0, null, 1000 + index * 300),
      observation('b', '1', b, 0, null, 1000 + index * 300),
    ], options);
  });
  assert.equal(assessment.confirmedPairs.size, 0);
  assert.equal(assessment.ambiguous, true);
});

test('a non-clique confirmed group remains explicitly ambiguous', () => {
  const gate = new CrossSourceAssociationGate();
  const options = { duplicateDistanceMm: 650, zToleranceMm: 500 };
  let assessment;
  for (let frame = 0; frame < 4; frame += 1) {
    const x = frame * 150;
    const timestamp = 1000 + frame * 300;
    assessment = gate.update([
      observation('a', '1', x, 0, null, timestamp),
      observation('b', '1', x - 600, 0, null, timestamp),
      observation('c', '1', x + 600, 0, null, timestamp),
    ], options);
  }
  assert.equal(assessment.confirmedPairs.size, 2);
  assert.equal(assessment.ambiguous, true);
});

test('one moving source can never confirm a stale stationary source', () => {
  const gate = new CrossSourceAssociationGate();
  const options = { duplicateDistanceMm: 650, zToleranceMm: 500 };
  let assessment;
  for (let frame = 0; frame < 5; frame += 1) {
    assessment = gate.update([
      observation('a', '1', frame * 100, 0, null, 1000 + frame * 300),
      observation('b', '1', 400, 0, null, 1000),
    ], options);
  }
  assert.equal(assessment.confirmedPairs.size, 0);
  assert.equal(assessment.ambiguous, true);
});

test('competing close assignments stay ambiguous even after repeated reports', () => {
  const gate = new CrossSourceAssociationGate();
  const options = { duplicateDistanceMm: 650, zToleranceMm: 500 };
  let assessment;
  for (let frame = 0; frame < 5; frame += 1) {
    const timestamp = 1000 + frame * 300;
    assessment = gate.update([
      observation('a', '1', frame * 100, 0, null, timestamp),
      observation('a', '2', frame * 100 + 150, 0, null, timestamp),
      observation('b', '1', frame * 100 + 75, 20, null, timestamp),
    ], options);
  }
  assert.equal(assessment.ambiguous, true);
  assert.equal(assessment.confirmedPairs.size, 0);
});

test('track engine preserves identity through source handover and expires held tracks', () => {
  const engine = new MultiSensorTrackEngine();
  const first = engine.update(fuseObservations([observation('a', '1', 0, 0)], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1000, { matchDistanceMm: 900, holdMs: 1500 });
  const id = first[0].id;
  const handover = engine.update(fuseObservations([observation('b', '4', 250, 0)], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1200, { matchDistanceMm: 900, holdMs: 1500 });
  assert.equal(handover[0].id, id);
  assert.equal(engine.update([], 2000, { matchDistanceMm: 900, holdMs: 1500 })[0].held, true);
  assert.equal(engine.update([], 3000, { matchDistanceMm: 900, holdMs: 1500 }).length, 0);
});

test('velocity prediction keeps crossing tracks stable', () => {
  const engine = new MultiSensorTrackEngine();
  const options = { matchDistanceMm: 900, holdMs: 500 };
  const first = engine.update(fuseObservations([
    observation('a', '1', -500, 0), observation('a', '2', 500, 0),
  ], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1000, options);
  const leftId = first.find(item => item.x < 0).id;
  engine.update(fuseObservations([
    observation('a', '1', -100, 0, null, 1200), observation('a', '2', 100, 0, null, 1200),
  ], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1200, options);
  const crossed = engine.update(fuseObservations([
    observation('b', '8', 300, 0, null, 1400), observation('b', '9', -300, 0, null, 1400),
  ], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1400, options);
  assert.equal(crossed.find(item => item.id === leftId).x, 300);
});

test('track association maximizes cardinality instead of creating an avoidable third track', () => {
  const engine = new MultiSensorTrackEngine();
  const options = { matchDistanceMm: 900, holdMs: 1500 };
  engine.update(fuseObservations([
    observation('a', '1', 0, 0), observation('a', '2', 800, 0),
  ], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1000, options);
  const next = engine.update(fuseObservations([
    observation('b', '1', 100, 0, null, 1200), observation('b', '2', -800, 0, null, 1200),
  ], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1200, options);
  assert.equal(next.length, 2);
  assert.equal(next.filter(item => item.held).length, 0);
});

test('a recycled local slot cannot inherit a track across the room', () => {
  const engine = new MultiSensorTrackEngine();
  const options = { matchDistanceMm: 700, holdMs: 1500 };
  const first = engine.update(fuseObservations([
    observation('a', '1', 0, 0),
  ], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1000, options)[0];
  const reused = engine.update(fuseObservations([
    observation('a', '1', 4000, 0, null, 1050),
  ], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1050, options);
  assert.ok(reused.some(item => item.x === 4000 && item.id !== first.id));
});

test('zero hold keeps identity for the next fresh report but never keeps a missing marker', () => {
  const engine = new MultiSensorTrackEngine();
  const options = { matchDistanceMm: 900, holdMs: 0 };
  const first = engine.update(fuseObservations([observation('a', '1', 0, 0)], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1000, options)[0];
  const next = engine.update(fuseObservations([observation('a', '1', 100, 0, null, 1200)], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1200, options)[0];
  assert.equal(next.id, first.id);
  assert.equal(engine.update([], 1400, options).length, 0);
  const returned = engine.update(fuseObservations([observation('a', '1', 180, 0, null, 1600)], { duplicateDistanceMm: 650, zToleranceMm: 500 }), 1600, options)[0];
  assert.equal(returned.id, first.id);
});

test('dense matching remains bounded and preserves every possible association', () => {
  const engine = new MultiSensorTrackEngine();
  const options = { matchDistanceMm: 900, holdMs: 1000 };
  const first = Array.from({ length: 24 }, (_, index) => observation('a', String(index), index * 500, 0));
  const second = Array.from({ length: 24 }, (_, index) => observation('b', String(index), index * 500 + 20, 0, null, 1200));
  engine.update(fuseObservations(first, { duplicateDistanceMm: 100, zToleranceMm: 500 }), 1000, options);
  const started = performance.now();
  const tracks = engine.update(fuseObservations(second, { duplicateDistanceMm: 100, zToleranceMm: 500 }), 1200, options);
  assert.equal(tracks.length, 24);
  assert.ok(performance.now() - started < 1000);
});
