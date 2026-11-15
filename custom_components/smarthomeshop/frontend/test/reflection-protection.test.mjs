import test from 'node:test';
import assert from 'node:assert/strict';

import { createMirrorReflectionPolygon } from '../src/utils/reflection-protection.ts';

const room = [
  { x: 0, y: 0 }, { x: 4000, y: 0 },
  { x: 4000, y: 4000 }, { x: 0, y: 4000 },
];
const mirror = {
  id: 'mirror', wallIndex: 0, position: .5, width: 1000,
  protectionEnabled: true, reflectionDepthMm: 250,
};

test('card reflection guard starts beyond the full perpendicular safety margin', () => {
  const polygon = createMirrorReflectionPolygon(room, mirror, { x: 350, y: 2600 });
  assert.ok(polygon);
  assert.ok(Math.abs(polygon[0].y + 350) < .001);
  assert.ok(Math.abs(polygon[1].y + 350) < .001);
});

test('card reflection guard fails closed beside a concave return wall', () => {
  const adversarialReturn = [
    { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 4000 },
    { x: -1000, y: 4000 }, { x: -1000, y: -1400 }, { x: 1400, y: -1400 },
    { x: 1400, y: -1300 }, { x: 0, y: -1300 },
  ];
  assert.equal(createMirrorReflectionPolygon(
    adversarialReturn,
    { ...mirror, width: 500, reflectionDepthMm: 4000 },
    { x: 2000, y: 2000 },
  ), null);
});
