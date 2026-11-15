import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { PANEL_TRANSLATIONS, panelText } from '../src/utils/panel-translations.ts';
import { translateEVReason } from '../src/utils/ev-display.ts';

const LANGUAGES = ['nl', 'de', 'fr', 'es'];
const read = name => readFileSync(new URL(`../src/pages/${name}`, import.meta.url), 'utf8');
const evPage = read('energy-ev.ts');
const loadsPage = read('energy-loads.ts');

const literalKeys = source => [...source.matchAll(/_t\(\s*'((?:[^'\\]|\\.)*)'/g)]
  .map(match => match[1].replace(/\\'/g, "'"));

test('every literal passed to the Smart EV and Smart Loads translation helper is translated', () => {
  for (const [name, source] of [['energy-ev.ts', evPage], ['energy-loads.ts', loadsPage]]) {
    for (const key of literalKeys(source)) {
      for (const language of LANGUAGES) {
        assert.ok(PANEL_TRANSLATIONS[language][key], `${name}: "${key}" has no ${language} translation`);
      }
    }
  }
});

test('the Smart Loads validation message is translated in every language', () => {
  const key = 'Check the load name, times, power, duration and control entities.';
  assert.match(loadsPage, /this\._t\('Check the load name, times, power, duration and control entities\.'\)/);
  for (const language of LANGUAGES) assert.notEqual(panelText({ language }, key), key);
});

test('the EV fuse guard is a read-only status because the backend always enforces it', () => {
  assert.doesNotMatch(evPage, /grid_guard:\s*\(e\.currentTarget/);
  assert.doesNotMatch(evPage, /\.checked=\$\{vehicle\.grid_guard\}/);
  assert.match(evPage, /<div class="check locked"><ha-icon icon="mdi:shield-check-outline"><\/ha-icon><span><strong>Live P1 and fuse guard<\/strong>/);
  const key = 'Always active. Charging is reduced or blocked before the main connection is overloaded.';
  assert.ok(evPage.includes(key));
  for (const language of LANGUAGES) assert.notEqual(panelText({ language }, key), key);
});

test('admins can clear the Smart EV journal after confirming', () => {
  assert.match(evPage, /type: 'smarthomeshop\/smart_ev\/journal\/clear'/);
  assert.match(evPage, /if \(!this\.hass\.user\?\.is_admin \|\| this\._clearingJournal\) return;/);
  assert.match(evPage, /if \(!confirm\(this\._t\('Clear the Smart EV decision journal\?/);
  assert.match(evPage, /this\.hass\.user\?\.is_admin \? html`<button class="btn danger" \?disabled=\$\{this\._clearingJournal\} @click=\$\{this\._clearJournal\}>/);
  for (const key of [
    'Clear journal',
    'Clear the Smart EV decision journal? Vehicles, plans and charger safety state are kept.',
    'Could not clear the Smart EV journal.',
  ]) {
    for (const language of LANGUAGES) assert.notEqual(panelText({ language }, key), key);
  }
});

test('the new EV deadline-schedule conflict is explained in every language', () => {
  const source = 'Family EV: one of its controls is still used by an enabled legacy deadline schedule';
  for (const language of LANGUAGES) {
    const translated = translateEVReason(source, part => panelText({ language }, part));
    assert.notEqual(translated, source);
    assert.ok(translated.startsWith('Family EV: '));
  }
});

test('new copy uses plain punctuation only', () => {
  const rows = LANGUAGES.flatMap(language => [
    'Always active. Charging is reduced or blocked before the main connection is overloaded.',
    'Clear journal',
    'Clear the Smart EV decision journal? Vehicles, plans and charger safety state are kept.',
    'Could not clear the Smart EV journal.',
    'one of its controls is still used by an enabled legacy deadline schedule',
    'Check the load name, times, power, duration and control entities.',
    'saved',
  ].map(key => PANEL_TRANSLATIONS[language][key]));
  for (const value of rows) assert.doesNotMatch(value, /[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/);
});
