import test from 'node:test';
import assert from 'node:assert/strict';
import { pickerCopy } from '../../src/ha/host-copy.js';

const registryLinkKeys = [
    'homeAssistantLink', 'homeAssistantLinkNote', 'homeAssistantFloor', 'homeAssistantArea', 'notLinked',
    'missingArea', 'areaAlreadyLinked', 'showingArea', 'showAll', 'showAreaOnly', 'noAreaDevices', 'wrongArea',
];

test('Home Assistant room linking and area filtering are translated in every supported language', () => {
    assert.deepEqual(Object.keys(pickerCopy).sort(), ['de', 'en', 'es', 'fr', 'nl']);
    for (const [language, copy] of Object.entries(pickerCopy)) {
        for (const key of registryLinkKeys) assert.ok(copy[key]?.trim(), `${language}.${key}`);
        assert.match(copy.showingArea, /\{area\}/);
        assert.match(copy.wrongArea, /\{area\}/);
        assert.match(copy.missingArea, /\{id\}/);
    }
});
