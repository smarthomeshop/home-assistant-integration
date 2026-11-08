import test from 'node:test';
import assert from 'node:assert/strict';

import { settingsText } from '../src/utils/settings-translations.ts';

const LANGUAGES = ['en', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'pl'];

test('advanced-control disclosure copy exists in every supported language', () => {
  for (const language of LANGUAGES) {
    for (const key of [
      'advanced.title',
      'advanced.description',
      'advanced.show',
      'advanced.hide',
      'advanced.count',
    ]) {
      const value = settingsText({ language }, key, { count: 12 });
      assert.notEqual(value, key);
      assert.doesNotMatch(value, /\{count\}/);
    }
  }
});

test('generic maintenance copy never names the wrong product family', () => {
  for (const language of LANGUAGES) {
    for (const key of [
      'desc.device_reset',
      'desc.device_restart',
      'confirm.device_reset.title',
      'confirm.device_reset.action',
    ]) {
      assert.doesNotMatch(settingsText({ language }, key), /UltimateSensor/i);
    }
  }
});
