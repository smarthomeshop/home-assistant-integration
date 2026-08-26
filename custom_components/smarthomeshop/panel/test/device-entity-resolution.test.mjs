import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findDeviceEntity,
  resolveESPHomeDeviceService,
} from '../src/utils/device-entity-resolution.ts';

const entities = {
  'sensor.unrelated_temperature': { device_id: 'other', platform: 'esphome' },
  'text.any_user_prefix_polygon_zone_1': {
    device_id: 'device-a',
    platform: 'esphome',
    original_name: 'Polygon Zone 1',
  },
  'switch.ultimatesensor_mini_a2799c_polygon_zones_enabled': {
    device_id: 'device-a',
    platform: 'esphome',
  },
  'button.ultimatesensor_mini_a2799c_restart': {
    device_id: 'device-a',
    platform: 'esphome',
  },
  'button.ultimatesensor_mini_b12345_restart': {
    device_id: 'device-b',
    platform: 'esphome',
  },
};

test('finds native Room Builder entities with arbitrary HA prefixes', () => {
  assert.equal(
    findDeviceEntity(entities, 'device-a', 'text', ['polygon_zone_1'], ['Polygon Zone 1']),
    'text.any_user_prefix_polygon_zone_1',
  );
  assert.equal(
    findDeviceEntity(entities, 'device-b', 'text', ['polygon_zone_1'], ['Polygon Zone 1']),
    null,
  );
});

test('resolves the ESPHome service prefix from entities belonging to the device', () => {
  const services = {
    esphome: {
      ultimatesensor_mini_set_polygon_zone: {},
      ultimatesensor_mini_a2799c_set_polygon_zone: {},
      ultimatesensor_mini_b12345_set_polygon_zone: {},
    },
  };
  assert.equal(
    resolveESPHomeDeviceService(services, entities, 'device-a', 'set_polygon_zone', ['ultimatesensor_mini']),
    'ultimatesensor_mini_a2799c_set_polygon_zone',
  );
  assert.equal(
    resolveESPHomeDeviceService(services, entities, 'device-b', 'set_polygon_zone', ['ultimatesensor_mini']),
    'ultimatesensor_mini_b12345_set_polygon_zone',
  );
});

test('does not guess another device service when no ownership match exists', () => {
  assert.equal(
    resolveESPHomeDeviceService(
      { esphome: { ultimatesensor_mini_a2799c_set_entry_line: {} } },
      entities,
      'missing-device',
      'set_entry_line',
    ),
    null,
  );
});
