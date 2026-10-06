import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../src/components/ultimatesensor-card.ts', import.meta.url),
  'utf8',
);

test('keeps the CO2 position marker visible across every colour band', () => {
  assert.match(
    source,
    /\.co2-bar-container\s*\{[^}]*overflow:\s*visible;/s,
  );
  assert.match(
    source,
    /\.co2-bar-indicator\s*\{[^}]*border:\s*1px solid var\(--card-background-color\);/s,
  );
  assert.match(
    source,
    /\.co2-bar-indicator\s*\{[^}]*height:\s*20px;/s,
  );
});
