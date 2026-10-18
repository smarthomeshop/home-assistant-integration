import test from 'node:test';
import assert from 'node:assert/strict';

import { volumeToLiters } from '../src/utils/water-units.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('usage comes back in litres whatever display unit the sensor uses', () => {
  assert.equal(volumeToLiters(312, 'L'), 312);
  assert.equal(volumeToLiters(0.312, 'm³'), 312);
  assert.equal(volumeToLiters(312000, 'mL'), 312);
  close(volumeToLiters(2, 'gal'), 7.570823568);
  close(volumeToLiters(1, 'ft³'), 28.316846592);
  close(volumeToLiters(1, 'CCF'), 2831.6846592);
});

test('a state without a known unit counts in the sensor native unit', () => {
  assert.equal(volumeToLiters(123.456, undefined, 'm³'), 123456);
  assert.equal(volumeToLiters(312, null), 312);
  assert.equal(volumeToLiters(312, 'bucket'), 312);
});
