import test from 'node:test';
import assert from 'node:assert/strict';

import { settingsText } from '../src/utils/settings-translations.ts';
import {
  QuietHoursUpdateError,
  SPS30_IDLE_INTERVAL_CHOICES,
  SPS30_IDLE_INTERVAL_DEFAULT,
  formatQuietHour,
  isQuietScheduleAllDay,
  parseQuietHour,
  parseSps30IdleInterval,
  performConfirmedEntityUpdate,
  quietHoursEntityStatus,
  shouldRenderQuietHours,
  sps30IdleIntervalAvailability,
  sps30IdleIntervalPresentation,
} from '../src/utils/sps30-quiet-hours.ts';

test('formats and parses integer firmware hours', () => {
  assert.equal(formatQuietHour(0), '00:00');
  assert.equal(formatQuietHour(7), '07:00');
  assert.equal(formatQuietHour(22), '22:00');
  assert.equal(formatQuietHour(23), '23:00');
  assert.equal(parseQuietHour('22'), 22);
  assert.equal(parseQuietHour('22:00'), null);
});

test('equal start and end means a 24-hour quiet schedule', () => {
  assert.equal(isQuietScheduleAllDay(7, 7), true);
  assert.equal(isQuietScheduleAllDay(7, 8), false);
  assert.match(settingsText({ language: 'en' }, 'quiet.equal_note'), /24 hours/);
  assert.match(settingsText({ language: 'nl' }, 'quiet.equal_note'), /24 uur/);
});

test('accepts the supported SPS30 measurement-cycle pauses as numeric values', () => {
  assert.deepEqual([...SPS30_IDLE_INTERVAL_CHOICES], [0, 5, 10, 15, 30]);
  assert.equal(SPS30_IDLE_INTERVAL_DEFAULT, 5);
  for (const minutes of [0, 5, 10, 15, 30]) {
    assert.equal(parseSps30IdleInterval(String(minutes)), minutes);
  }
  assert.equal(parseSps30IdleInterval(-1), null);
  assert.equal(parseSps30IdleInterval(31), null);
  assert.equal(parseSps30IdleInterval(''), null);
  assert.equal(parseSps30IdleInterval('5 minutes'), null);
});

test('classifies unavailable, unknown and missing entity states', () => {
  assert.equal(quietHoursEntityStatus(undefined), 'missing');
  assert.equal(quietHoursEntityStatus({ state: 'unavailable' }), 'unavailable');
  assert.equal(quietHoursEntityStatus({ state: 'unknown' }), 'unknown');
  assert.equal(quietHoursEntityStatus({ state: 'on' }), 'ready');
});

test('Basic devices do not render, while partial firmware gets an update notice', () => {
  assert.equal(shouldRenderQuietHours('unsupported'), false);
  assert.equal(shouldRenderQuietHours(undefined), false);
  assert.equal(shouldRenderQuietHours('partial'), true);
  assert.equal(shouldRenderQuietHours('complete'), true);
});

test('shows only the idle-interval firmware notice when the optional entity is missing', () => {
  assert.equal(sps30IdleIntervalAvailability('complete', true), 'control');
  assert.equal(sps30IdleIntervalAvailability('complete', false), 'firmware_update');
  assert.equal(sps30IdleIntervalAvailability('partial', false), 'hidden');
  assert.equal(sps30IdleIntervalAvailability('unsupported', false), 'hidden');
});

test('active Quiet Hours temporarily override but never overwrite the configured pause', () => {
  assert.deepEqual(sps30IdleIntervalPresentation('15', true), {
    configuredMinutes: 15,
    temporarilyOverridden: true,
  });
  assert.deepEqual(sps30IdleIntervalPresentation('15', false), {
    configuredMinutes: 15,
    temporarilyOverridden: false,
  });
});

test('waits for a real Home Assistant state update', async () => {
  let snapshot = { state: 'off', last_updated: 'before' };
  const result = await performConfirmedEntityUpdate(
    async () => {
      setTimeout(() => {
        snapshot = { state: 'on', last_updated: 'after' };
      }, 2);
    },
    () => snapshot,
    state => state === 'on',
    100,
    1,
  );
  assert.equal(result.state, 'on');
});

test('writes an idle interval as a number and waits for the entity update', async () => {
  let serviceValue;
  let snapshot = { state: '5', last_updated: 'before' };
  const requested = parseSps30IdleInterval('30');
  const result = await performConfirmedEntityUpdate(
    async () => {
      serviceValue = requested;
      setTimeout(() => {
        snapshot = { state: String(requested), last_updated: 'after' };
      }, 2);
    },
    () => snapshot,
    state => parseSps30IdleInterval(state) === requested,
    100,
    1,
  );
  assert.equal(typeof serviceValue, 'number');
  assert.equal(serviceValue, 30);
  assert.equal(result.state, '30');
});

test('reports failed service calls', async () => {
  await assert.rejects(
    performConfirmedEntityUpdate(
      async () => { throw new Error('device offline'); },
      () => ({ state: 'off', last_updated: 'before' }),
      state => state === 'on',
      20,
      1,
    ),
    error => error instanceof QuietHoursUpdateError && error.kind === 'service',
  );
});

test('reports a timeout when Home Assistant receives no state update', async () => {
  await assert.rejects(
    performConfirmedEntityUpdate(
      async () => {},
      () => ({ state: 'off', last_updated: 'unchanged' }),
      state => state === 'on',
      5,
      1,
    ),
    error => error instanceof QuietHoursUpdateError && error.kind === 'timeout',
  );
});

test('contains the required Dutch and English translation keys', () => {
  for (const language of ['en', 'nl']) {
    for (const key of [
      'quiet.title',
      'quiet.description',
      'quiet.firmware_required_description',
      'quiet.enabled',
      'quiet.active',
      'quiet.inactive',
      'quiet.status_unknown',
      'quiet.unavailable',
      'quiet.error.service',
      'quiet.error.timeout',
      'quiet.idle.label',
      'quiet.idle.description',
      'quiet.idle.recommendation',
      'quiet.idle.continuous',
      'quiet.idle.minutes',
      'quiet.idle.firmware_required_description',
      'quiet.idle.override',
      'quiet.idle.unavailable',
      'quiet.idle.unknown',
      'quiet.error.invalid_interval',
    ]) {
      assert.notEqual(settingsText({ language }, key), key);
    }
  }
});
