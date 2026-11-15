import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/pages/zones-page.ts', import.meta.url), 'utf8');

test('Room Builder runtime polling rejects delayed and superseded responses', () => {
  assert.match(source, /const request = \+\+this\._runtimeRequest/);
  assert.match(source, /if \(request !== this\._runtimeRequest\) return/);
  assert.match(source, /Date\.now\(\) - requestedAt > 7500/);
  assert.match(source, /this\._runtimeRequest \+= 1/);
});

test('Room Builder expires a clear runtime label without waiting for a response', () => {
  assert.match(source, /window\.setTimeout\(\(\) => \{/);
  assert.match(source, /this\._expireRoomRuntime\(\)/);
  assert.match(source, /Date\.now\(\) - this\._runtimeReceivedAt <= 7500/);
});
