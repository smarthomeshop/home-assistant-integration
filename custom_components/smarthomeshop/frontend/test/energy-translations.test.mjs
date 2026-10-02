import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

import { getLanguageFromHass } from '../src/utils/translations.ts';

const source = fs.readFileSync(new URL('../src/utils/energy-translations.ts', import.meta.url), 'utf8');
const syntax = ts.createSourceFile('energy-translations.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const dictionaries = {};
const visit = node => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)
    && ['nl', 'de', 'fr', 'es'].includes(node.name.text)
    && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
    dictionaries[node.name.text] = Object.fromEntries(node.initializer.properties
      .filter(ts.isPropertyAssignment)
      .map(property => [property.name.text, property.initializer.text]));
  }
  ts.forEachChild(node, visit);
};
visit(syntax);

test('normalises Home Assistant region language codes', () => {
  assert.equal(getLanguageFromHass({ language: 'nl-NL' }), 'nl');
  assert.equal(getLanguageFromHass({ language: 'de_DE' }), 'de');
  assert.equal(getLanguageFromHass({ locale: { language: 'fr-FR' } }), 'fr');
});

test('translates Energy cards in all required languages', () => {
  assert.equal(dictionaries.nl['Live energy'], 'Live energie');
  for (const language of ['de', 'fr', 'es']) {
    assert.ok(Object.keys(dictionaries[language]).length >= 190);
    assert.notEqual(dictionaries[language]['Live energy'], 'Live energy');
  }
});

test('preserves Energy-card variables', () => {
  assert.match(dictionaries.de['{count} sources connected'], /\{count\}/);
  assert.match(dictionaries.fr['Previously measured total: {value}'], /\{value\}/);
  assert.match(dictionaries.es['{price} at {time}'], /\{price\}.*\{time\}|\{time\}.*\{price\}/);
});
