import test from 'node:test';
import assert from 'node:assert/strict';

import { filterReflectedTargets } from '../src/utils/reflection-protection.ts';

test('filters only targets behind an enabled mirror', () => {
  const room = [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 4000 }, { x: 0, y: 4000 }];
  const mirrors = [{
    id: 'mirror', wallIndex: 0, position: 0.5, width: 1000,
    protectionEnabled: true, reflectionDepthMm: 2000,
  }];
  const targets = [{ id: 'real', x: 2000, y: 500 }, { id: 'ghost', x: 2000, y: -1000 }];
  assert.deepEqual(
    filterReflectedTargets(targets, room, mirrors, { x: 2000, y: 2000 }).map(target => target.id),
    ['real'],
  );
});
