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

test('robot vacuum maps and the room automation are translated in every supported language', () => {
    const keys = Object.keys(pickerCopy.en).filter(key => key.startsWith('vacuum') || key.startsWith('automation'));
    assert.equal(keys.length, 26);
    for (const [language, copy] of Object.entries(pickerCopy)) {
        for (const key of keys) assert.ok(copy[key]?.trim(), `${language}.${key}`);
        assert.match(copy.vacuumRooms, /\{count\}/);
        assert.match(copy.automationIntro, /\{area\}.*\{room\}/);
        assert.match(copy.automationLights, /\{area\}.*\{lights\}/);
        assert.match(copy.automationNoLights, /\{area\}/);
        assert.match(copy.automationName, /\{room\}/);
        assert.match(copy.automationDescription, /\{area\}.*\{room\}/);
        // Plain characters only, as everywhere in the planner.
        for (const key of keys) assert.doesNotMatch(copy[key], /[\u2013\u2014\u2018\u2019\u201c\u201d\u2026]/, `${language}.${key}`);
    }
});
