import test from 'node:test';
import assert from 'node:assert/strict';
import { daylightAt, daylights } from '../src/js/floor-planner-daylight.mjs';
import { furnitureAt, furnitureCatalog } from '../src/js/floor-planner-furniture.mjs';
import { coverageCells, coverageSummary, paintCoverageHeat } from '../src/js/floor-planner-heatmap.mjs';
import { blankPlan, validPlan } from '../src/js/floor-planner-model.mjs';
import { paintPerson } from '../src/js/floor-planner-person.mjs';
import { defaultSpaceCamera, paintSpace } from '../src/js/floor-planner-space.mjs';
import { removeOrphanedSensorZones, removeZonesOwnedBySensor } from '../src/js/floor-planner-zones.mjs';

const room = { id: 'room', name: 'Living', x: 0, y: 0, width: 5, depth: 4, height: 2.6 };
const sensor = { id: 'sensor', model: 'ceilsense-v2', radar: 'ld2412', x: 2.5, y: 2, angle: 0 };
const plan = (extra = {}) => ({ ...blankPlan('Home'), version: 3, rooms: [room], sensors: [sensor], windows: [], mirrors: [], zones: [],
    furniture: ['sofa', 'fan', 'pet', 'radiator', 'heater'].map((kind, index) => ({ ...furnitureAt(kind, kind, { x: 1 + index * .8, y: 3 }), id: 'item-' + index })),
    ...extra });
const count = (markup, pattern) => (markup.match(pattern) ?? []).length;

test('a draft keeps every piece of furniture but drops textures, shadows and most detail', () => {
    const full = paintSpace(plan(), defaultSpaceCamera, null).markup;
    const draft = paintSpace(plan(), defaultSpaceCamera, null, { draft: true }).markup;
    for (const kind of ['sofa', 'fan', 'pet', 'radiator', 'heater']) assert.match(draft, new RegExp(`data-model="${kind}"`));
    assert.doesNotMatch(draft, /class="(fp-model-texture|fp-model-shadow|fp-interior-shadow)"/);
    assert.ok(count(draft, /<polygon/g) * 2 < count(full, /<polygon/g));
});

test('walls can stand up, follow the camera or stay down', () => {
    const tallest = wallMode => {
        // The same wall faces, projected: a taller wall reaches higher up the screen.
        const { markup } = paintSpace(plan({ furniture: [] }), defaultSpaceCamera, null, { wallMode });
        return Math.min(...[...markup.matchAll(/class="fp-space-wall[^"]*"[^>]*?>\s*<polygon points="([^"]+)"/g)]
            .flatMap(([, points]) => points.split(' ').map(point => Number(point.split(',')[1]))));
    };
    assert.ok(tallest('up') < tallest('cutaway'));
    assert.ok(tallest('cutaway') < tallest('down'));
});

test('daylight follows the clock and colours the model', () => {
    assert.deepEqual(daylights, ['studio', 'morning', 'midday', 'evening', 'night']);
    const at = hour => daylightAt(new Date(2026, 5, 1, hour, 0));
    assert.deepEqual([3, 8, 13, 19, 23].map(at), ['night', 'morning', 'midday', 'evening', 'night']);
    const night = paintSpace(plan(), defaultSpaceCamera, null, { daylight: 'night' }).markup;
    const studio = paintSpace(plan(), defaultSpaceCamera, null).markup;
    assert.match(night, /data-daylight="night"/);
    assert.notEqual(night.match(/--fp-shadow:\d+%/g).join(), studio.match(/--fp-shadow:\d+%/g).join());
});

test('rooms can carry a floor finish and a wall colour', () => {
    const finished = plan({ rooms: [{ ...room, floorFinish: 'carpet', wallColor: 'sage' }] });
    assert.ok(validPlan(finished));
    assert.ok(!validPlan(plan({ rooms: [{ ...room, floorFinish: 'lava' }] })));
    assert.ok(!validPlan(plan({ rooms: [{ ...room, wallColor: 'neon' }] })));
    const { markup } = paintSpace(finished, defaultSpaceCamera, null);
    assert.match(markup, /class="fp-space-floor[^"]*" data-item="room" data-floor="carpet"/);
    assert.match(markup, /data-wall="sage"/);
    // Only wood and tiles get a texture layer; a plain finish must not turn black.
    assert.doesNotMatch(markup, /fp-model-texture" data-floor="carpet"/);
});

test('movement and heat sources are part of the catalogue', () => {
    for (const kind of ['fan', 'pet', 'radiator', 'heater']) assert.equal(furnitureCatalog[kind].category, 'motion');
    assert.ok(validPlan(plan()));
});

test('the coverage map finds dead zones and counts overlapping radars', () => {
    const covered = coverageCells(plan({ furniture: [] }));
    assert.ok(covered.length > 200);
    assert.ok(covered.some(cell => cell.seen >= 1));
    const empty = coverageCells(plan({ sensors: [], furniture: [] }));
    assert.ok(empty.every(cell => cell.seen === 0));
    assert.deepEqual(coverageSummary(empty), { none: 100, one: 0, many: 0 });
    const markup = paintCoverageHeat(empty);
    assert.equal(count(markup, /<path/g), 1);
    assert.match(markup, /data-seen="none"/);
});

test('a person can carry a status diamond in 3D', () => {
    const person = { x: 1, y: 1, pose: 'standing', heading: 0 };
    assert.match(paintPerson({ ...person, plumbob: 'none' }, defaultSpaceCamera), /class="fp-plumbob" data-status="none"/);
    assert.doesNotMatch(paintPerson(person, defaultSpaceCamera), /fp-plumbob/);
    assert.doesNotMatch(paintPerson({ ...person, plumbob: 'clear' }), /fp-plumbob/);
});

test('mirror reflection settings are optional and range checked', () => {
    const mirror = { id: 'mirror', roomId: 'room', x: 0, y: 1, angle: 90, width: .6, height: 1.2, base: .4 };
    assert.ok(validPlan(plan({ mirrors: [mirror] })));
    assert.ok(validPlan(plan({ mirrors: [{ ...mirror, protectionEnabled: true, reflectionDepthM: 1.5 }] })));
    assert.ok(!validPlan(plan({ mirrors: [{ ...mirror, protectionEnabled: 'yes' }] })));
    assert.ok(!validPlan(plan({ mirrors: [{ ...mirror, reflectionDepthM: 9 }] })));
});

test('zones that belong to a removed radar go with it, also in the older spelling', () => {
    const zones = [{ id: 'shared' }, { id: 'own', sensorId: 'a' }, { id: 'legacy', sensor_id: 'a' }, { id: 'other', sensorId: 'b' }];
    assert.deepEqual(removeZonesOwnedBySensor(zones, 'a').map(zone => zone.id), ['shared', 'other']);
    assert.deepEqual(removeOrphanedSensorZones(zones, new Set(['b'])).map(zone => zone.id), ['shared', 'other']);
});
