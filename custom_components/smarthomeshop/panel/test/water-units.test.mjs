import test from 'node:test';
import assert from 'node:assert/strict';

import { volumeToLiters } from '../src/utils/water-units.ts';

test('water today is shown in litres whatever display unit the sensor uses', () => {
  assert.equal(volumeToLiters(312, 'L'), 312);
  assert.equal(volumeToLiters(0.312, 'm³'), 312);
  assert.ok(Math.abs(volumeToLiters(2, 'gal') - 7.570823568) < 1e-9);
});

test('a state without a known unit is taken as litres', () => {
  assert.equal(volumeToLiters(312, undefined), 312);
  assert.equal(volumeToLiters(312, 'bucket'), 312);
});
