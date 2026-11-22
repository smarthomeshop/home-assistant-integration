import assert from 'node:assert/strict';
import test from 'node:test';
import { hasRobotVacuum, loadVacuumMap, vacuumMaps } from '../../src/ha/ha-vacuum.js';

const picture = (id, name, state = '2026-11-22T10:00:00+00:00') => ({ state, attributes: { friendly_name: name,
    entity_picture: `/api/${id.split('.')[0]}_proxy/${id}?token=abc` } });

const hass = {
    entities: {
        'vacuum.robo': { entity_id: 'vacuum.robo', device_id: 'robot' },
        'image.robo_downstairs': { entity_id: 'image.robo_downstairs', device_id: 'robot' },
        'image.robo_upstairs': { entity_id: 'image.robo_upstairs', device_id: 'robot' },
        'camera.robo_map_data': { entity_id: 'camera.robo_map_data', device_id: 'robot' },
        'camera.doorbell': { entity_id: 'camera.doorbell', device_id: 'door' },
        'camera.xiaomi_cloud_map_extractor': { entity_id: 'camera.xiaomi_cloud_map_extractor', device_id: null },
    },
    states: {
        'vacuum.robo': { state: 'docked', attributes: {} },
        'image.robo_downstairs': picture('image.robo_downstairs', 'Robo Downstairs'),
        'image.robo_upstairs': picture('image.robo_upstairs', 'Robo Upstairs'),
        'camera.robo_map_data': picture('camera.robo_map_data', 'Robo Map data', 'unavailable'),
        'camera.doorbell': picture('camera.doorbell', 'Doorbell', 'idle'),
        'camera.xiaomi_cloud_map_extractor': picture('camera.xiaomi_cloud_map_extractor', 'Map extractor', 'idle'),
        'image.roadmap': picture('image.roadmap', 'Roadmap'),
        'image.no_picture_map': { state: 'unknown', attributes: { friendly_name: 'Nothing yet' } },
        'sensor.robo_map': { state: '1', attributes: {} },
    },
};

test('the maps of robot vacuums are the pictures of their devices, and pictures named a map', () => {
    assert.deepEqual(vacuumMaps(hass), [
        { id: 'camera.xiaomi_cloud_map_extractor', name: 'Map extractor' },
        { id: 'image.robo_downstairs', name: 'Robo Downstairs' },
        { id: 'image.robo_upstairs', name: 'Robo Upstairs' },
    ]);
});

test('a home without a robot vacuum has no maps, whatever its pictures are called', () => {
    const { 'vacuum.robo': _robot, ...states } = hass.states;
    const { 'vacuum.robo': _entry, ...entities } = hass.entities;
    assert.deepEqual(vacuumMaps({ states, entities }), []);
    assert.deepEqual([hasRobotVacuum(hass), hasRobotVacuum({ states, entities }), hasRobotVacuum(null)], [true, false, false]);
    assert.deepEqual(vacuumMaps({}), []);
    assert.deepEqual(vacuumMaps(null), []);
});

test('a map is fetched from Home Assistant by the address of its picture', async () => {
    const asked = [];
    const get = async (address, options) => {
        asked.push([address, options]);
        return { ok: true, blob: async () => 'the picture' };
    };
    assert.equal(await loadVacuumMap({ ...hass, hassUrl: path => 'https://ha.example' + path }, 'image.robo_downstairs', get), 'the picture');
    assert.deepEqual(asked, [['https://ha.example/api/image_proxy/image.robo_downstairs?token=abc', { credentials: 'same-origin' }]]);

    await assert.rejects(loadVacuumMap(hass, 'image.robo_downstairs', async () => ({ ok: false })));
    await assert.rejects(loadVacuumMap(hass, 'image.no_picture_map', get));
    // Only Home Assistant's own picture addresses are fetched.
    const elsewhere = { states: { 'image.x_map': { state: 'ok', attributes: { entity_picture: 'https://elsewhere.example/map.png' } } } };
    await assert.rejects(loadVacuumMap(elsewhere, 'image.x_map', get));
    assert.equal(asked.length, 1);
});
