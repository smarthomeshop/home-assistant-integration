import test from 'node:test';
import assert from 'node:assert/strict';

import {
  radarRoomFurnitureCorners,
  radarRoomFurnitureDepth,
} from '../src/utils/radar-room-geometry.ts';

test('uses durable Room Designer height as floor depth', () => {
  assert.equal(radarRoomFurnitureDepth({ height: 900 }), 900);
  assert.equal(radarRoomFurnitureDepth({ depth: 700, height: 900 }), 700);
});

test('preserves the rotated footprint of saved furniture', () => {
  const corners = radarRoomFurnitureCorners({ x: 1000, y: 2000, width: 1000, height: 500, rotationDeg: 90 });
  assert.equal(corners.length, 4);
  const xs = corners.map(point => Math.round(point.x)).sort((a, b) => a - b);
  const ys = corners.map(point => Math.round(point.y)).sort((a, b) => a - b);
  assert.deepEqual(xs, [750, 750, 1250, 1250]);
  assert.deepEqual(ys, [1500, 1500, 2500, 2500]);
});

test('rejects incomplete or non-positive furniture geometry', () => {
  assert.deepEqual(radarRoomFurnitureCorners({ x: 0, y: 0, width: 0, height: 500 }), []);
  assert.deepEqual(radarRoomFurnitureCorners({ x: 0, y: 0, width: 500 }), []);
});
