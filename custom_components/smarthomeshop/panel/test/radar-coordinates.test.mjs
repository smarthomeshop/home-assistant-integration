import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeRadarCoordinate,
  reprojectRadarCoverage,
  serializeRadarPolygon,
} from '../src/utils/radar-coordinates.ts';

test('converts LD2460 metres to millimetres and rejects missing target slots', () => {
  assert.equal(normalizeRadarCoordinate('1.234', 1000), 1234);
  for (const value of ['NaN', 'nan', 'unknown', 'unavailable', '', null, undefined]) {
    assert.equal(normalizeRadarCoordinate(value, 1000), null);
  }
});

test('serializes integer millimetre polygons with at most twenty vertices', () => {
  assert.equal(
    serializeRadarPolygon([{ x: 1.2, y: 2.8 }, { x: -30.4, y: 40.5 }, { x: 50, y: 60 }]),
    '1:3;-30:41;50:60',
  );
  const oversized = Array.from({ length: 21 }, (_, index) => ({ x: index, y: index }));
  assert.throws(() => serializeRadarPolygon(oversized), /at most 20 vertices/);
});

test('rotates and moves measured coverage with the corrected sensor placement', () => {
  // At rotation 0, forward points towards negative room Y. These are the
  // near-left and near-right points of one sensor-local coverage edge.
  const original = [{ x: -1000, y: -2000 }, { x: 1000, y: -2000 }];
  const rotated = reprojectRadarCoverage(
    original,
    { x: 0, y: 0, rotation: 0 },
    { x: 500, y: 1000, rotation: 90 },
    'forward_xy',
  );
  assert.deepEqual(rotated.map(point => ({
    x: Math.round(point.x) || 0,
    y: Math.round(point.y) || 0,
  })), [
    { x: 2500, y: 0 },
    { x: 2500, y: 2000 },
  ]);
});
