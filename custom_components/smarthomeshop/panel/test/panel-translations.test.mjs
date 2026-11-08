import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PANEL_TRANSLATIONS,
  SUPPORTED_PANEL_LANGUAGES,
  panelLanguage,
  panelText,
} from '../src/utils/panel-translations.ts';

const REQUIRED = ['en', 'nl', 'de', 'fr', 'es'];

test('follows the Home Assistant language including region variants', () => {
  assert.deepEqual([...SUPPORTED_PANEL_LANGUAGES], REQUIRED);
  assert.equal(panelLanguage({ language: 'nl-NL' }), 'nl');
  assert.equal(panelLanguage({ language: 'de_DE' }), 'de');
  assert.equal(panelLanguage({ locale: { language: 'fr-FR' } }), 'fr');
  assert.equal(panelLanguage({ language: 'it-IT' }), 'en');
});

test('contains complete catalogs for every required non-English language', () => {
  const sourceKeys = Object.keys(PANEL_TRANSLATIONS.nl).sort();
  assert.ok(sourceKeys.length >= 970);
  for (const language of REQUIRED.slice(1)) {
    assert.deepEqual(Object.keys(PANEL_TRANSLATIONS[language]).sort(), sourceKeys);
    assert.equal(Object.values(PANEL_TRANSLATIONS[language]).some(value => value.includes('ZXQ')), false);
  }
});

test('translates primary navigation and the device visibility flow', () => {
  assert.equal(panelText({ language: 'nl' }, 'Devices'), 'Apparaten');
  assert.equal(panelText({ language: 'de' }, 'Room Designer'), 'Room Designer');
  assert.equal(panelText({ language: 'fr' }, 'Hidden devices'), 'Appareils masqués');
  assert.equal(panelText({ language: 'es' }, 'Enable Smart Energy'), 'Activar Smart Energy');
});

test('translates the searchable device overview in every supported language', () => {
  const keys = [
    'Device filters',
    'Search devices',
    'Refresh devices',
    'Filter devices by status',
    'Showing {shown} of {total} devices',
    'No devices match these filters',
    'Clear search and filters',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) {
      assert.notEqual(panelText({ language }, key, { shown: 2, total: 5 }), key);
    }
  }
});

test('translates mirror reflection protection in every supported language', () => {
  for (const language of REQUIRED.slice(1)) {
    assert.notEqual(panelText({ language }, 'Reflection protection'), 'Reflection protection');
    assert.notEqual(panelText({ language }, 'Protection depth (cm)'), 'Protection depth (cm)');
    assert.match(
      panelText({ language }, '{used}/2 radar exclusion slots used.', { used: 2 }),
      /2\/2/,
    );
  }
});

test('translates the polished Room Designer workspace in every supported language', () => {
  const keys = [
    'Rooms',
    'Layout',
    'Room summary',
    'Area',
    'Corners',
    'Fit room to screen',
    'Drag to rotate • Scroll to zoom',
    'Import room',
    'Export selected room',
    'Import as new room',
    'Room backup contents',
    'Import room backup or LiDAR scan',
    'Apple RoomPlan (LiDAR scan)',
    'Room from scan',
    'RoomPlan measurements are converted from metres to millimetres. Check the walls, doors, windows and furniture after import because LiDAR scans can contain small gaps.',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key), key);
  }
});

test('translates the whole-home presence experience in every supported language', () => {
  const keys = [
    'Live Home',
    'Whole-home presence',
    'Arrange rooms',
    'Exact radar position',
    'Room presence only',
    'Home setup',
    'Auto-arrange rooms',
    'Save home layout',
    'tracked now',
    'Data unavailable',
    'Partial sensor outage',
    '{offline} of {total} sensors offline',
    'Select a room and use the arrow keys or move buttons to position it. Hold Shift with an arrow key for fine movement.',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key), key);
  }
});

test('translates Smart Energy safety, simulation and learning in every supported language', () => {
  const keys = [
    'Live grid and fuse guard',
    'Capacity tariff & peak shaving',
    'Safe self-learning',
    'Execution mode',
    'Advice only',
    'Simulation / shadow mode',
    'Automatic execution',
    'Decision journal',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key), key);
  }
});

test('keeps interpolation values intact and falls back safely to English', () => {
  assert.equal(
    panelText({ language: 'es' }, 'Delete "{name}" and its automation?', { name: 'Lavavajillas' }),
    '¿Eliminar «Lavavajillas» y su automatización?',
  );
  assert.equal(panelText({ language: 'it' }, 'Hidden devices'), 'Hidden devices');
  assert.equal(panelText({ language: 'nl' }, 'Uncatalogued technical value'), 'Uncatalogued technical value');
});
