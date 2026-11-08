import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/utils/device-overview.ts');
const source = fs.readFileSync(sourcePath, 'utf8')
  .replace("import type { SmartHomeShopDevice } from '../types';", '');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports });

const {
  chooseInitialDeviceFilter,
  filterAndSortDevices,
  summarizeDevices,
} = module.exports;

const devices = [
  { id: 'offline', name: 'Old Hall', product_type: 'ceilsense', online: false, integration_linked: true },
  { id: 'unlinked', name: 'Kitchen Water', product_name: 'WaterMeterKit', online: true, integration_linked: false },
  { id: 'online', name: 'Living Room', product_type: 'ultimatesensor', online: true, integration_linked: true },
];

test('summarises online, offline and unlinked devices independently', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(summarizeDevices(devices))),
    { total: 3, online: 2, offline: 1, unlinked: 1 },
  );
});

test('filters on status and searches all identifying product fields', () => {
  assert.deepEqual(filterAndSortDevices(devices, '', 'online').map(device => device.id), ['online', 'unlinked']);
  assert.deepEqual(filterAndSortDevices(devices, '', 'offline').map(device => device.id), ['offline']);
  assert.deepEqual(filterAndSortDevices(devices, '', 'unlinked').map(device => device.id), ['unlinked']);
  assert.deepEqual(filterAndSortDevices(devices, 'watermeter', 'all').map(device => device.id), ['unlinked']);
  assert.deepEqual(filterAndSortDevices(devices, 'CEILSENSE', 'all').map(device => device.id), ['offline']);
});

test('sorts useful online and linked devices before offline devices', () => {
  assert.deepEqual(
    filterAndSortDevices(devices, '', 'all').map(device => device.id),
    ['online', 'unlinked', 'offline'],
  );
});

test('opens on Online only when offline history would dominate the page', () => {
  assert.equal(chooseInitialDeviceFilter(devices), 'all');
  const crowded = [
    { id: 'live', name: 'Live', online: true },
    ...Array.from({ length: 6 }, (_, index) => ({ id: `old-${index}`, name: `Old ${index}`, online: false })),
  ];
  assert.equal(chooseInitialDeviceFilter(crowded), 'online');
  assert.equal(chooseInitialDeviceFilter(crowded.map(device => ({ ...device, online: false }))), 'all');
});
