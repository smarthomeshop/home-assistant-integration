import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { responseIsCurrent } from '../src/utils/response-lanes.ts';
import { translateEVReason } from '../src/utils/ev-display.ts';

const source = readFileSync(
  new URL('../src/pages/energy-ev.ts', import.meta.url),
  'utf8',
);

test('keeps live polling and configuration mutations in separate response lanes', () => {
  assert.match(source, /private _liveRequestSequence = 0/);
  assert.match(source, /private _configRequestSequence = 0/);
  assert.doesNotMatch(source, /private _requestSequence = 0/);
});

test('polling cannot overwrite a pending mode or save operation', () => {
  assert.match(
    source,
    /!this\._saving && !this\._refreshing && !this\._modePending/,
  );
  assert.match(
    source,
    /this\._dirty \|\| this\._saving \|\| this\._modePending > 0/,
  );
});

test('a delayed mode response preserves edits made while it was pending', () => {
  assert.match(source, /this\._editVersion === previousVersion/);
  assert.match(source, /request === this\._configRequestSequence/);
  assert.match(source, /this\._dirty = this\._editVersion === previousVersion \? wasDirty : true/);
});

test('save and mode changes are mutually exclusive', () => {
  assert.match(source, /!this\.hass\.user\?\.is_admin \|\| this\._saving \|\| this\._modePending/);
  assert.match(source, /this\._saving \|\| this\._modePending > 0/);
});

test('a delayed polling response cannot overwrite a newer saved generation', async () => {
  let currentRequest = 1;
  let configGeneration = 4;
  const request = currentRequest;
  const responseGeneration = configGeneration;
  const delayedResponse = new Promise(resolve => setTimeout(() => resolve('old'), 5));

  configGeneration += 1; // A save or mode change completed while polling waited.
  await delayedResponse;

  assert.equal(
    responseIsCurrent(request, currentRequest, responseGeneration, configGeneration),
    false,
  );
  assert.equal(responseIsCurrent(2, 2, 5, 5), true);
});

test('a stale rejected poll cannot replace the status after a newer save', async () => {
  let currentRequest = 1;
  let configGeneration = 4;
  const request = currentRequest;
  const responseGeneration = configGeneration;
  let visibleError = '';
  const delayedFailure = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('old connection failure')), 5);
  });

  configGeneration += 1;
  try {
    await delayedFailure;
  } catch (err) {
    if (responseIsCurrent(
      request,
      currentRequest,
      responseGeneration,
      configGeneration,
    )) visibleError = err.message;
  }

  assert.equal(visibleError, '');
  assert.match(
    source,
    /catch \(err: any\) \{\s*if \(!responseIsCurrent\(request, this\._liveRequestSequence, configGeneration, this\._configGeneration\)\) return;/,
  );
  assert.match(
    source,
    /if \(!responseIsCurrent\(request, this\._liveRequestSequence, configGeneration, this\._configGeneration\)\) return;\s*this\._error = `\$\{this\._t\('Could not refresh the EV plan\.'\)/,
  );
});

test('a complete safety reason containing a comma is translated before splitting', () => {
  const source = 'The charger confirmed lower setpoints, but measured power remained above the safe limit';
  const translated = translateEVReason(
    source,
    value => value === source ? 'Volledig vertaalde veiligheidsreden' : value,
  );

  assert.equal(translated, 'Volledig vertaalde veiligheidsreden');
});

test('a vehicle-prefixed validation error translates its reason', () => {
  const reason = 'choose a separate stop switch because the current control cannot accept the configured off current';
  const translated = translateEVReason(
    `Family car: ${reason}`,
    value => value === reason ? 'kies een aparte stopschakelaar' : value,
  );

  assert.equal(translated, 'Family car: kies een aparte stopschakelaar');
});

test('Smart EV validates shared stop routes and live automatic stop capability before save', () => {
  assert.match(source, /const routes = new Map<string, string>\(\)/);
  assert.match(source, /const invalidSharedRoute = previousRoute !== undefined && previousRoute !== routeSignature/);
  assert.match(source, /const invalidAutomaticStop = this\._config\.execution_mode === 'automatic'/);
  assert.match(source, /this\._reason\(err\.message\)/);
});

test('compact Smart EV shows mutation failures as an accessible alert', () => {
  assert.match(
    source,
    /private _renderCompact\(\)[\s\S]*this\._error \? html`<div class="error" role="alert">/,
  );
});
