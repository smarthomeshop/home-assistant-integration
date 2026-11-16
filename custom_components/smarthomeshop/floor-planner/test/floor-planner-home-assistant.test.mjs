import test from 'node:test';
import assert from 'node:assert/strict';
import {
    devicesForRoomArea, roomWithHomeAssistantArea, roomWithHomeAssistantFloor,
} from '../src/js/floor-planner-home-assistant.mjs';

const areas = [
    { id: 'area-living-arbitrary', name: 'Living', floorId: 'floor-ground-arbitrary' },
    { id: 'area-office-arbitrary', name: 'Office', floorId: 'floor-upper-arbitrary' },
    { id: 'area-outside-arbitrary', name: 'Garden', floorId: null },
];
const devices = [
    { id: 'device-a', areaId: 'area-living-arbitrary' },
    { id: 'device-b', areaId: 'area-office-arbitrary' },
    { id: 'device-c', areaId: null },
];

test('the room sensor picker follows arbitrary Home Assistant area ids and has an explicit all-devices override', () => {
    const room = { id: 'drawn-room', haAreaId: 'area-living-arbitrary' };
    assert.deepEqual(devicesForRoomArea(devices, room).map(device => device.id), ['device-a']);
    assert.deepEqual(devicesForRoomArea(devices, room, false), devices);
    assert.deepEqual(devicesForRoomArea(devices, { id: 'unlinked' }), devices);
});

test('selecting a Home Assistant area also stores its floor without relying on names', () => {
    assert.deepEqual(roomWithHomeAssistantArea({ id: 'room' }, 'area-office-arbitrary', areas), {
        id: 'room', haAreaId: 'area-office-arbitrary', haFloorId: 'floor-upper-arbitrary',
    });
    assert.deepEqual(roomWithHomeAssistantArea({ id: 'room', haFloorId: 'old' }, 'area-outside-arbitrary', areas), {
        id: 'room', haAreaId: 'area-outside-arbitrary', haFloorId: 'old',
    });
});

test('changing floors clears only an incompatible area link and clearing an area keeps the chosen floor', () => {
    const linked = { id: 'room', haAreaId: 'area-living-arbitrary', haFloorId: 'floor-ground-arbitrary' };
    assert.deepEqual(roomWithHomeAssistantFloor(linked, 'floor-upper-arbitrary', areas), {
        id: 'room', haFloorId: 'floor-upper-arbitrary',
    });
    assert.deepEqual(roomWithHomeAssistantFloor(linked, 'floor-ground-arbitrary', areas), linked);
    assert.deepEqual(roomWithHomeAssistantArea(linked, '', areas), {
        id: 'room', haFloorId: 'floor-ground-arbitrary',
    });
});
