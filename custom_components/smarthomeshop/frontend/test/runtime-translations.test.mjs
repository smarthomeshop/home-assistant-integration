import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/utils/runtime-translations.ts', import.meta.url), 'utf8');
const syntax = ts.createSourceFile('runtime-translations.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const CARD_TRANSLATIONS = {};
const LIVE_HOME_CARD_TRANSLATIONS = {};
const visit = node => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)
    && ['CARD_TRANSLATIONS', 'LIVE_HOME_CARD_TRANSLATIONS'].includes(node.name.text) && node.initializer) {
    const destination = node.name.text === 'CARD_TRANSLATIONS' ? CARD_TRANSLATIONS : LIVE_HOME_CARD_TRANSLATIONS;
    const initializer = ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer;
    if (ts.isObjectLiteralExpression(initializer)) {
      for (const languageProperty of initializer.properties.filter(ts.isPropertyAssignment)) {
        const language = languageProperty.name.text;
        if (!ts.isObjectLiteralExpression(languageProperty.initializer)) continue;
        destination[language] = Object.fromEntries(languageProperty.initializer.properties
          .filter(ts.isPropertyAssignment)
          .map(property => [property.name.text, property.initializer.text]));
      }
    }
  }
  ts.forEachChild(node, visit);
};
visit(syntax);

const REQUIRED = ['nl', 'de', 'fr', 'es'];

test('contains a complete Lovelace-card catalog in every required language', () => {
  const sourceKeys = Object.keys(CARD_TRANSLATIONS.nl).sort();
  assert.ok(sourceKeys.length >= 550);
  for (const language of REQUIRED) {
    assert.deepEqual(Object.keys(CARD_TRANSLATIONS[language]).sort(), sourceKeys);
    assert.equal(Object.values(CARD_TRANSLATIONS[language]).some(value => value.includes('ZXQ')), false);
  }
});

test('contains polished translations for primary card controls', () => {
  assert.equal(CARD_TRANSLATIONS.nl['Device offline'], 'Apparaat offline');
  assert.equal(CARD_TRANSLATIONS.de['Current water usage'], 'Aktueller Wasserverbrauch');
  assert.equal(CARD_TRANSLATIONS.fr['Room Quality'], 'Qualité de la pièce');
  assert.equal(CARD_TRANSLATIONS.es['Card title'], 'Título de la tarjeta');
});

test('contains the Live Home Lovelace-card translations in every required language', () => {
  const keys = Object.keys(LIVE_HOME_CARD_TRANSLATIONS.nl).sort();
  assert.ok(keys.length >= 20);
  for (const language of REQUIRED) {
    assert.deepEqual(Object.keys(LIVE_HOME_CARD_TRANSLATIONS[language]).sort(), keys);
    assert.notEqual(LIVE_HOME_CARD_TRANSLATIONS[language]['Live Home'], 'Live Home');
    assert.ok(LIVE_HOME_CARD_TRANSLATIONS[language]['Data unavailable']);
    assert.ok(LIVE_HOME_CARD_TRANSLATIONS[language]['{offline} of {total} sensors offline']);
    assert.ok(LIVE_HOME_CARD_TRANSLATIONS[language]['Rooms and radar sensors are managed in SmartHomeShop Room Designer. Exact positions are shown when the radar supplies coordinates; otherwise the card shows honest room-level presence.']);
  }
});

test('uses the shared Home Assistant language resolver and English fallback', () => {
  assert.match(source, /getLanguageFromHass\(hass\)/);
  assert.match(source, /CARD_TRANSLATIONS\[language\]\?\.\[source\] \|\| source/);
});
