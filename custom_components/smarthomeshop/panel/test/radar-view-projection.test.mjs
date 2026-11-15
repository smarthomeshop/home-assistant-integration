import test from 'node:test';
import assert from 'node:assert/strict';

import {
  projectRoomPoint2D,
  projectStandaloneRadar3D,
  radarTargetIsFresh,
} from '../src/utils/radar-view-projection.ts';

test('standalone 3D preserves radar-local left and right ordering', () => {
  const left = projectStandaloneRadar3D({ x: -1000, y: 2000 }, 6000, 2600);
  const right = projectStandaloneRadar3D({ x: 1000, y: 2000 }, 6000, 2600);
  assert.ok(left[0] < right[0]);
});

test('room 2D follows the positive-Y-down Room Designer orientation', () => {
  const bounds = { minX: 0, minY: 0, maxX: 4000, maxY: 4000 };
  const nearTop = projectRoomPoint2D({ x: 2000, y: 500 }, bounds);
  const nearBottom = projectRoomPoint2D({ x: 2000, y: 3500 }, bounds);
  assert.ok(nearTop[1] < nearBottom[1]);
});

test('standalone 3D ignores absent height instead of inventing one', () => {
  assert.deepEqual(
    projectStandaloneRadar3D({ x: 500, y: 1000, z: null }, 6000, 2600),
    projectStandaloneRadar3D({ x: 500, y: 1000, z: 0 }, 6000, 2600),
  );
});

test('live targets expire locally even while the next request remains pending', () => {
  const receivedAt = 100_000;
  assert.equal(radarTargetIsFresh(2_000, receivedAt, receivedAt + 12_000), true);
  assert.equal(radarTargetIsFresh(2_000, receivedAt, receivedAt + 13_001), false);
});

test('live target expiry uses server age plus local elapsed time, not wall-clock agreement', () => {
  const receivedAt = 50_000;
  assert.equal(radarTargetIsFresh(6_000, receivedAt, receivedAt + 8_000), true);
  assert.equal(radarTargetIsFresh(6_000, receivedAt, receivedAt + 9_001), false);
  assert.equal(radarTargetIsFresh(undefined, receivedAt, receivedAt + 14_000), true);
  assert.equal(radarTargetIsFresh(undefined, receivedAt, receivedAt + 15_001), false);
});
