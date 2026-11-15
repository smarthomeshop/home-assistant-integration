import test from 'node:test';
import assert from 'node:assert/strict';

import {
  allocateReflectionExclusions,
  createMirrorReflectionPolygon,
  createMirrorReflectionPolygons,
  safelyOutsideRoom,
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

test('oblique mirror wedges start beyond the full perpendicular safety margin', () => {
  const polygon = createMirrorReflectionPolygon(
    room,
    { ...mirror, reflectionDepthMm: 250 },
    { x: 350, y: 2600 },
  );
  assert.ok(polygon);
  assert.ok(Math.abs(polygon.points[0].y + 350) < 0.001);
  assert.ok(Math.abs(polygon.points[1].y + 350) < 0.001);
  assert.ok(Math.abs(polygon.points[2].y + 600) < 0.001);
  assert.ok(Math.abs(polygon.points[3].y + 600) < 0.001);
  assert.equal(pointInPolygon({ x: 2000, y: -340 }, polygon.points), false);
});

test('concave rooms never create a reflection wedge through real room space', () => {
  const concaveRoom = [
    { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 2000 },
    { x: 2000, y: 2000 }, { x: 2000, y: 4000 }, { x: 0, y: 4000 },
  ];
  const innerWallMirror = {
    ...mirror,
    wallIndex: 3,
    position: 0.5,
    width: 1000,
  };
  const polygon = createMirrorReflectionPolygon(
    concaveRoom,
    innerWallMirror,
    { x: 3500, y: 500 },
  );
  assert.equal(polygon, null,
    'a radar on the wrong side of a concave wall must not create an inward wedge');
});

test('concave return walls keep the full target-safety margin around reflection wedges', () => {
  const narrowReturn = [
    { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 4000 },
    { x: 2100, y: 4000 }, { x: 2100, y: -600 }, { x: 0, y: -600 },
  ];
  const polygon = createMirrorReflectionPolygon(
    narrowReturn,
    { ...mirror, wallIndex: 0, position: 0.42, width: 500, reflectionDepthMm: 500 },
    { x: 1000, y: 1600 },
  );
  assert.equal(polygon, null,
    'an automatic exclusion must fail closed when a nearby return wall is inside 350 mm');
});

test('long oblique reflection edges cannot slip between sampled safety points', () => {
  const adversarialReturn = [
    { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 4000 },
    { x: -1000, y: 4000 }, { x: -1000, y: -1400 }, { x: 1400, y: -1400 },
    { x: 1400, y: -1300 }, { x: 0, y: -1300 },
  ];
  assert.equal(createMirrorReflectionPolygon(
    adversarialReturn,
    { ...mirror, wallIndex: 0, width: 500, reflectionDepthMm: 4000 },
    { x: 2000, y: 2000 },
  ), null);
});

test('clockwise room geometry derives the same safe outward direction', () => {
  const clockwise = [...room].reverse();
  const reversedMirror = { ...mirror, wallIndex: 2 };
  const polygon = createMirrorReflectionPolygon(
    clockwise,
    reversedMirror,
    { x: 2000, y: 2000 },
  );
  assert.ok(polygon);
  assert.ok(polygon.points.every(point => point.y < 0));
});

test('room boundaries keep a safety margin for placement and angle error', () => {
  assert.equal(safelyOutsideRoom({ x: 4100, y: 2000 }, room), false);
  assert.equal(safelyOutsideRoom({ x: 4500, y: 2000 }, room), true);
});
