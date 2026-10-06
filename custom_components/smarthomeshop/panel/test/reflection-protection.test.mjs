import test from 'node:test';
import assert from 'node:assert/strict';

import {
  allocateReflectionExclusions,
  createMirrorReflectionPolygon,
  createMirrorReflectionPolygons,
  pointInPolygon,
} from '../src/utils/reflection-protection.ts';

const room = [
  { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 4000 }, { x: 0, y: 4000 },
];
const mirror = {
  id: 'mirror_1', wallIndex: 0, position: 0.5, width: 1000,
  protectionEnabled: true, reflectionDepthMm: 2000,
};

test('creates a reflection wedge behind a wall mirror for each radar', () => {
  const first = createMirrorReflectionPolygon(room, mirror, { id: 'a', x: 2000, y: 2000 });
  const second = createMirrorReflectionPolygon(room, mirror, { id: 'b', x: 1000, y: 2000 });
  assert.ok(first);
  assert.ok(second);
  assert.equal(first.points.length, 4);
  assert.notDeepEqual(first.points, second.points);
  assert.ok(pointInPolygon({ x: 2000, y: -1000 }, first.points));
  assert.equal(pointInPolygon({ x: 2000, y: 500 }, first.points), false);
});

test('disabled mirrors stay visual-only', () => {
  assert.equal(createMirrorReflectionPolygon(room, { ...mirror, protectionEnabled: false }, { x: 2000, y: 2000 }), null);
  assert.deepEqual(createMirrorReflectionPolygons(room, [{ ...mirror, protectionEnabled: false }], { x: 2000, y: 2000 }), []);
});

test('reports exclusion slot overflow instead of silently accepting it', () => {
  const reflections = createMirrorReflectionPolygons(
    room,
    [mirror, { ...mirror, id: 'mirror_2', wallIndex: 2 }],
    { x: 2000, y: 2000 },
  );
  const allocation = allocateReflectionExclusions([[{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]], reflections, 2);
  assert.equal(allocation.manualCount, 1);
  assert.equal(allocation.mirrorCount, 2);
  assert.equal(allocation.overflow, 1);
  assert.equal(allocation.polygons.length, 2);
});

test('supports protection at room coordinates with arbitrary sensor positions', () => {
  const polygons = createMirrorReflectionPolygons(room, [mirror], { x: 347, y: 2864 });
  assert.equal(polygons.length, 1);
  for (const point of polygons[0].points) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
  }
});
