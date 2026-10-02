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
  assert.equal(panelText({ language: 'de' }, 'Room Designer'), 'Raumplaner');
  assert.equal(panelText({ language: 'fr' }, 'Hidden devices'), 'Appareils masqués');
  assert.equal(panelText({ language: 'es' }, 'Enable Smart Energy'), 'Activar Smart Energy');
});

test('keeps interpolation values intact and falls back safely to English', () => {
  assert.equal(
    panelText({ language: 'es' }, 'Delete "{name}" and its automation?', { name: 'Lavavajillas' }),
    '¿Eliminar «Lavavajillas» y su automatización?',
  );
  assert.equal(panelText({ language: 'it' }, 'Hidden devices'), 'Hidden devices');
  assert.equal(panelText({ language: 'nl' }, 'Uncatalogued technical value'), 'Uncatalogued technical value');
});
