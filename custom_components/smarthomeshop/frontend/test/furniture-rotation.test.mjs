import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveFurnitureRotation,
  rotatedFurnitureCorners,
} from '../src/utils/furniture-geometry.ts';

const roundedCorners = corners => corners.map(({ x, y }) => [
  Math.round(x * 1000) / 1000,
  Math.round(y * 1000) / 1000,
]);

test('uses rotationDeg for the UltimateSensor 2D and 3D room views', () => {
  assert.equal(resolveFurnitureRotation({ rotationDeg: 90, rotation: 0 }), 90);
  assert.equal(resolveFurnitureRotation({ rotationDeg: 0, rotation: 90 }), 0);
  assert.equal(resolveFurnitureRotation({ rotation: 180 }), 180);
});

test('keeps card furniture geometry aligned across 2D and 3D views', () => {
  assert.deepEqual(
    roundedCorners(rotatedFurnitureCorners(100, 200, 80, 40, 90)),
    [[120, 160], [120, 240], [80, 240], [80, 160]],
  );
});
