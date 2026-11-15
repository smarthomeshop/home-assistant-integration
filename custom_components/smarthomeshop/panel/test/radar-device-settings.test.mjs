import test from 'node:test';
import assert from 'node:assert/strict';

import {
  radarEntityState,
  resolveRadarDeviceSettings,
} from '../src/utils/radar-device-settings.ts';
import { settingsText } from '../src/utils/settings-translations.ts';

const entity = (domain, entityId, originalName, uniqueId = entityId.split('.')[1]) => ({
  entity_id: `${domain}.${entityId}`,
  name: `Renamed ${entityId}`,
  original_name: originalName,
  unique_id: uniqueId,
  platform: 'esphome',
  domain,
  state: '0',
  attributes: {},
});

const profile = model => ({
  device_id: 'arbitrary-device-id',
  name: 'Any future product name',
  entity_prefix: 'does_not_matter',
  aliases: ['arbitrary-device-id'],
  profile: {
    mounting_mode: model === 'ld6002b' ? 'ceiling' : 'wall',
    coordinate_projection: model === 'ld6002b' ? 'floor_xy' : 'forward_xy',
    radar_model: model,
    coordinate_scale_to_mm: 1000,
    maximum_targets: 3,
    metadata_source: 'firmware',
    supplementary_presence_sensors: [],
    installation_mode_options: [],
    missing_metadata_entities: [],
    invalid_metadata_entities: [],
    positioning_available: true,
  },
  targets: [],
  capabilities: {
    coordinate_mode: 'tracking-target',
    polygon_zones: false,
    entry_lines: false,
    zone_profiles: false,
    interference_zones: false,
    smoothing: false,
    cross_zone_tracking: false,
  },
});

test('discovers complete LD6002B fall controls with arbitrary entity ID prefixes', () => {
  const entities = [
    entity('switch', 'unrelated_prefix_a', 'Experimental Fall Detection', 'node_ld6002b_fall_enabled'),
    entity('number', 'unrelated_prefix_b', 'Fall Detection Mounting Height', 'node_ld6002b_fall_height'),
    entity('number', 'unrelated_prefix_c', 'Fall Detection Low Height Threshold', 'node_ld6002b_fall_low_height'),
    entity('number', 'unrelated_prefix_d', 'Possible Fall Hold Time', 'node_ld6002b_fall_hold'),
    entity('number', 'unrelated_prefix_e', 'Prolonged Low Hold Time', 'node_ld6002b_fall_low_hold'),
  ];
  const result = resolveRadarDeviceSettings(entities, profile('ld6002b'));
  assert.equal(result.fall.status, 'complete');
  assert.equal(result.fall.entities.enabled, 'switch.unrelated_prefix_a');
  assert.deepEqual(result.fall.missing, []);
});

test('shows a firmware-update state for a partial LD6002B entity set', () => {
  const result = resolveRadarDeviceSettings([
    entity('switch', 'some_device_fall', 'Experimental Fall Detection'),
  ], profile('ld6002b'));
  assert.equal(result.fall.status, 'partial');
  assert.ok(result.fall.missing.includes('mounting_height'));
});

test('LD2450, LD2460, LD2412 and Basic devices never simulate fall controls', () => {
  for (const model of ['ld2450', 'ld2460', 'ld2412']) {
    assert.equal(resolveRadarDeviceSettings([], profile(model)).fall.status, 'unsupported');
  }
  assert.equal(resolveRadarDeviceSettings([], null).fall.status, 'unsupported');
});

test('entity state classification keeps unavailable and unknown controls honest', () => {
  const control = entity('number', 'random', 'Fall Detection Mounting Height');
  assert.equal(radarEntityState(control, { [control.entity_id]: { state: 'unavailable' } }), 'unavailable');
  assert.equal(radarEntityState(control, { [control.entity_id]: { state: 'unknown' } }), 'unknown');
  assert.equal(radarEntityState(control, { [control.entity_id]: { state: '2.6' } }), 'ready');
  assert.equal(radarEntityState(undefined, {}), 'missing');
});

test('radar setup and fall-detection copy is translated in the five app languages', () => {
  const keys = [
    'radar.device.title',
    'radar.device.installation_description',
    'radar.device.open_floorplan',
    'radar.fall.title',
    'radar.fall.warning',
    'radar.device.error.timeout',
  ];
  for (const language of ['en', 'nl', 'de', 'fr', 'es']) {
    for (const key of keys) assert.notEqual(settingsText({ language }, key), key);
  }
});
