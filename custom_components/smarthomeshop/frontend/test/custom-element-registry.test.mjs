import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  createCustomElementRegistryGuard,
} from '../src/utils/custom-element-registry.ts';

class FakeRegistry {
  constructor() {
    this.definitions = new Map();
    this.waiters = new Map();
    this.failures = new Map();
  }

  define(name, constructor) {
    const failures = this.failures.get(name) || 0;
    if (failures > 0) {
      this.failures.set(name, failures - 1);
      throw new Error(`transient failure for ${name}`);
    }
    if (this.definitions.has(name)) throw new Error(`${name} is already defined`);
    this.definitions.set(name, constructor);
    for (const resolve of this.waiters.get(name) || []) resolve(constructor);
    this.waiters.delete(name);
  }

  get(name) {
    return this.definitions.get(name);
  }

  whenDefined(name) {
    const existing = this.get(name);
    if (existing) return Promise.resolve(existing);
    return new Promise(resolve => {
      this.waiters.set(name, [...(this.waiters.get(name) || []), resolve]);
    });
  }

  failNextDefinition(name) {
    this.failures.set(name, (this.failures.get(name) || 0) + 1);
  }
}

const CardA = class CardA {};
const CardB = class CardB {};

const createGuard = (initial, getCurrentRegistry, onHealed = () => undefined) => (
  createCustomElementRegistryGuard({
    registryAtLoad: initial,
    getCurrentRegistry,
    pollRounds: 0,
    onHealed,
  })
);

test('registers each element immediately in the active registry', () => {
  const initial = new FakeRegistry();
  const guard = createGuard(initial, () => initial);

  guard.defineElement('smarthomeshop-test-card', CardA);

  assert.equal(initial.get('smarthomeshop-test-card'), CardA);
  guard.dispose();
});

test('restores every registered element after Home Assistant replaces the registry', () => {
  const initial = new FakeRegistry();
  const replacement = new FakeRegistry();
  let current = initial;
  const healed = [];
  const guard = createGuard(initial, () => current, names => healed.push(...names));

  guard.defineElement('smarthomeshop-test-card-a', CardA);
  guard.defineElement('smarthomeshop-test-card-b', CardB);
  current = replacement;
  guard.checkNow('test registry swap');

  assert.equal(replacement.get('smarthomeshop-test-card-a'), CardA);
  assert.equal(replacement.get('smarthomeshop-test-card-b'), CardB);
  assert.deepEqual(healed.sort(), [
    'smarthomeshop-test-card-a',
    'smarthomeshop-test-card-b',
  ]);
  guard.dispose();
});

test('does not overwrite an element already present in the replacement registry', () => {
  const initial = new FakeRegistry();
  const replacement = new FakeRegistry();
  const ExistingCard = class ExistingCard {};
  replacement.define('smarthomeshop-test-card', ExistingCard);
  let current = initial;
  const guard = createGuard(initial, () => current);

  guard.defineElement('smarthomeshop-test-card', CardA);
  current = replacement;
  guard.checkNow('test registry swap');

  assert.equal(replacement.get('smarthomeshop-test-card'), ExistingCard);
  guard.dispose();
});

test('keeps a failed definition pending and succeeds on the next check', () => {
  const initial = new FakeRegistry();
  const replacement = new FakeRegistry();
  replacement.failNextDefinition('smarthomeshop-test-card');
  let current = initial;
  const guard = createGuard(initial, () => current);

  guard.defineElement('smarthomeshop-test-card', CardA);
  current = replacement;
  guard.checkNow('first attempt');
  assert.equal(replacement.get('smarthomeshop-test-card'), undefined);

  guard.checkNow('retry');
  assert.equal(replacement.get('smarthomeshop-test-card'), CardA);
  guard.dispose();
});

test('the Home Assistant boot signal repairs the registry without a page refresh', async () => {
  const initial = new FakeRegistry();
  const replacement = new FakeRegistry();
  let current = initial;
  const guard = createGuard(initial, () => current);

  guard.defineElement('smarthomeshop-test-card', CardA);
  current = replacement;
  initial.define('home-assistant', class HomeAssistant {});
  await Promise.resolve();

  assert.equal(replacement.get('smarthomeshop-test-card'), CardA);
  guard.dispose();
});

test('all card and editor elements use the guarded central registration', () => {
  const indexSource = fs.readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
  const expected = [
    'smarthomeshop-water-card',
    'smarthomeshop-waterp1-card',
    'smarthomeshop-waterflowkit-card',
    'smarthomeshop-ultimatesensor-card',
    'smarthomeshop-p1meterkit-card',
    'smarthomeshop-ceilsense-card',
    'smarthomeshop-energy-live-card',
    'smarthomeshop-energy-price-card',
    'smarthomeshop-energy-power-card',
    'smarthomeshop-energy-cost-card',
    'smarthomeshop-energy-savings-card',
    'smarthomeshop-energy-automations-card',
    'smarthomeshop-water-card-editor',
    'smarthomeshop-waterp1-card-editor',
    'smarthomeshop-waterflowkit-card-editor',
    'smarthomeshop-ultimatesensor-card-editor',
    'smarthomeshop-p1meterkit-card-editor',
    'smarthomeshop-ceilsense-card-editor',
    'smarthomeshop-energy-card-editor',
    'smarthomeshop-sensor-settings',
    'smarthomeshop-zone-editor',
  ];

  for (const tagName of expected) {
    assert.match(indexSource, new RegExp(`\\['${tagName}',`));
  }
  assert.equal((indexSource.match(/defineCustomElement\(tagName, elementClass\)/g) || []).length, 1);

  const componentsDirectory = new URL('../src/components/', import.meta.url);
  for (const fileName of fs.readdirSync(componentsDirectory).filter(name => name.endsWith('.ts'))) {
    const source = fs.readFileSync(new URL(fileName, componentsDirectory), 'utf8');
    assert.doesNotMatch(source, /@customElement|customElements\.define\(/, fileName);
  }
});
