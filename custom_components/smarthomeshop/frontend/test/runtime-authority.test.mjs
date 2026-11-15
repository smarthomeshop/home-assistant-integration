import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/components/home-presence-card.ts', import.meta.url), 'utf8');

test('initial Live Home loading cannot renew an old runtime snapshot', () => {
  assert.match(source, /const runtimeRequest = \+\+this\._runtimeRequest/);
  assert.match(source, /const runtimeRequestedAt = Date\.now\(\)/);
  assert.match(source, /Date\.now\(\) - runtimeRequestedAt <= 7500/);
  assert.match(source, /runtimeRequest === this\._runtimeRequest/);
});

test('periodic Live Home runtime responses remain generation and duration guarded', () => {
  assert.match(source, /const request = \+\+this\._runtimeRequest/);
  assert.match(source, /Date\.now\(\) - requestedAt > 7500/);
  assert.match(source, /this\._runtimeReceivedAt <= 7500/);
});
