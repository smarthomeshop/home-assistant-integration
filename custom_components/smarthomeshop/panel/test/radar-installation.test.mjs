import test from 'node:test';
import assert from 'node:assert/strict';

import { settingsText } from '../src/utils/settings-translations.ts';
import {
  RadarInstallationUpdateError,
  evaluateRadarOrientationWalk,
  parseRadarInstallationNumber,
  performConfirmedRadarUpdate,
  radarInstallationAvailability,
  radarInstallationEntityStatus,
  validateRadarDetectionSector,
} from '../src/utils/radar-installation.ts';

test('validates the complete LD2460 height and angle ranges', () => {
  assert.equal(parseRadarInstallationNumber('0.10', 0.1, 10), 0.1);
  assert.equal(parseRadarInstallationNumber('2.60', 0.1, 10), 2.6);
  assert.equal(parseRadarInstallationNumber('10', 0.1, 10), 10);
  assert.equal(parseRadarInstallationNumber('0', 0, 90), 0);
  assert.equal(parseRadarInstallationNumber('90', 0, 90), 90);
  assert.equal(parseRadarInstallationNumber('0.09', 0.1, 10), null);
  assert.equal(parseRadarInstallationNumber('91', 0, 90), null);
  assert.equal(parseRadarInstallationNumber('', 0, 90), null);
});

test('validates the complete LD2460 hardware-sector contract', () => {
  assert.equal(validateRadarDetectionSector({ distanceM: 0.1, startAngleDeg: -60, endAngleDeg: 60 }), 'ready');
  assert.equal(validateRadarDetectionSector({ distanceM: 6, startAngleDeg: -10, endAngleDeg: 10 }), 'ready');
  assert.equal(validateRadarDetectionSector({ distanceM: 6.1, startAngleDeg: -10, endAngleDeg: 10 }), 'range');
  assert.equal(validateRadarDetectionSector({ distanceM: 4, startAngleDeg: 20, endAngleDeg: 20 }), 'angle_order');
  assert.equal(validateRadarDetectionSector({ distanceM: 4, startAngleDeg: 30, endAngleDeg: -30 }), 'angle_order');
});

test('requires real forward-Y and sideways-X movement before calibration', () => {
  assert.equal(evaluateRadarOrientationWalk('forward', [{ x: 100, y: 400 }, { x: 180, y: 1500 }]), true);
  assert.equal(evaluateRadarOrientationWalk('forward', [{ x: 100, y: 400 }, { x: 1100, y: 600 }]), false);
  assert.equal(evaluateRadarOrientationWalk('sideways', [{ x: -500, y: 1800 }, { x: 700, y: 1900 }]), true);
  assert.equal(evaluateRadarOrientationWalk('sideways', [{ x: 0, y: 500 }, { x: 100, y: 1700 }]), false);
});

test('only offers controls for a side-mounted LD2460 with both entities', () => {
  assert.equal(radarInstallationAvailability('ld2460', 'side', 'number.height', 'number.angle'), 'complete');
  assert.equal(radarInstallationAvailability('ld2460', 'side', 'number.height', null), 'partial');
  assert.equal(radarInstallationAvailability('ld2460', 'side', null, null), 'firmware_update');
  assert.equal(radarInstallationAvailability('ld2460', 'top', 'number.height', 'number.angle'), 'not_applicable');
  assert.equal(radarInstallationAvailability('ld2450', 'side', 'number.height', 'number.angle'), 'not_applicable');
});

test('classifies missing and temporarily unavailable Home Assistant entities', () => {
  assert.equal(radarInstallationEntityStatus(undefined), 'missing');
  assert.equal(radarInstallationEntityStatus({ state: 'unknown' }), 'unknown');
  assert.equal(radarInstallationEntityStatus({ state: 'unavailable' }), 'unavailable');
  assert.equal(radarInstallationEntityStatus({ state: '2.60' }), 'ready');
});

test('waits for the radar to report the value written through Home Assistant', async () => {
  let snapshot = { state: '2.50', last_updated: 'before' };
  const result = await performConfirmedRadarUpdate(
    async () => {
      setTimeout(() => {
        snapshot = { state: '2.60', last_updated: 'after' };
      }, 2);
    },
    () => snapshot,
    state => Number(state) === 2.6,
    100,
    1,
  );
  assert.equal(result.state, '2.60');
});

test('does not claim success after a failed service call', async () => {
  await assert.rejects(
    performConfirmedRadarUpdate(
      async () => { throw new Error('device offline'); },
      () => ({ state: '30', last_updated: 'before' }),
      state => Number(state) === 35,
      20,
      1,
    ),
    error => error instanceof RadarInstallationUpdateError && error.kind === 'service',
  );
});

test('reports a timeout when the radar never confirms the value', async () => {
  await assert.rejects(
    performConfirmedRadarUpdate(
      async () => {},
      () => ({ state: '30', last_updated: 'unchanged' }),
      state => Number(state) === 35,
      5,
      1,
    ),
    error => error instanceof RadarInstallationUpdateError && error.kind === 'timeout',
  );
});

test('contains all LD2460 installation copy in every supported language', () => {
  const keys = [
    'radar.installation.title',
    'radar.installation.description',
    'radar.installation.height',
    'radar.installation.angle',
    'radar.installation.recommendation',
    'radar.installation.firmware_update',
    'radar.installation.error.unavailable',
    'radar.installation.error.timeout',
    'radar.installation.error.service',
    'desc.ld2460_installation_mode',
    'desc.ld2460_installation_height',
    'desc.ld2460_installation_angle',
    'radar.sector.title',
    'radar.sector.pause_notice',
    'radar.sector.reflections',
    'radar.sector.error.angle_order',
    'radar.readiness.calibration_blocked',
    'radar.orientation.title',
    'radar.orientation.physical_warning',
    'radar.coverage.axes_title',
    'radar.coverage.axes_description',
    'radar.coverage.near_left',
    'radar.coverage.near_right',
    'radar.coverage.far_right',
    'radar.coverage.far_left',
    'radar.coverage.remeasure_notice',
  ];
  for (const language of ['en', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'pl']) {
    for (const key of keys) assert.notEqual(settingsText({ language }, key), key);
  }
});
