import test from 'node:test';
import assert from 'node:assert/strict';
import { findWaterEnergySource } from '../src/utils/device-entity-resolution.ts';

test('HA Energy uses raw counted water rather than the calibrated position', () => {
  assert.equal(findWaterEnergySource([
    { entity_id: 'sensor.hal_waterp1meterkit_water_meter_total' },
    { entity_id: 'sensor.hal_waterp1meterkit_water_total_consumption' },
  ]), 'sensor.hal_waterp1meterkit_water_total_consumption');
});

test('renamed pulse counters are resolved using their registry identity', () => {
  assert.equal(findWaterEnergySource([
    { entity_id: 'sensor.absolute', original_name: 'Water Meter Total' },
    { entity_id: 'sensor.my_liters', unique_id: 'aabbcc-water_total_consumption' },
  ]), 'sensor.my_liters');
});

test('legacy firmware with only an absolute position remains selectable', () => {
  assert.equal(findWaterEnergySource([{ entity_id: 'sensor.legacy_water_meter_total' }]), 'sensor.legacy_water_meter_total');
  assert.equal(findWaterEnergySource([]), undefined);
});

test('disabled pulse entities are not used as an Energy source', () => {
  assert.equal(findWaterEnergySource([
    { entity_id: 'sensor.raw_water_total_consumption', disabled_by: 'user' },
    { entity_id: 'sensor.absolute_water_meter_total' },
  ]), 'sensor.absolute_water_meter_total');
});
