import assert from 'node:assert/strict';
import test from 'node:test';
import {
    areaLights, presenceLightsConfig, presenceLightsId, presenceLightsOptions, presenceLightsState, removePresenceLights,
    roomPresenceEntity, savePresenceLights,
} from '../../src/ha/ha-automation.js';

// A Home Assistant with a saved room "Kitchen" in the area kitchen, which has two lights.
function home(saved = null) {
    const calls = [];
    return {
        calls,
        devices: {
            d1: { id: 'd1', area_id: null, identifiers: [['smarthomeshop', 'room:room-1']] },
            d2: { id: 'd2', area_id: 'kitchen', identifiers: [['hue', 'strip']] },
            d3: { id: 'd3', area_id: 'hall', identifiers: [['hue', 'hall']] },
        },
        entities: {
            'sensor.kitchen_temperature': { entity_id: 'sensor.kitchen_temperature', device_id: 'd1' },
            'binary_sensor.kitchen_presence': { entity_id: 'binary_sensor.kitchen_presence', device_id: 'd1', translation_key: 'room_occupancy' },
            'light.strip': { entity_id: 'light.strip', device_id: 'd2', area_id: null },
            'light.ceiling': { entity_id: 'light.ceiling', device_id: null, area_id: 'kitchen' },
            'light.hidden': { entity_id: 'light.hidden', device_id: 'd2', area_id: null, hidden: true },
            'light.hall': { entity_id: 'light.hall', device_id: 'd3', area_id: null },
            'light.moved': { entity_id: 'light.moved', device_id: 'd2', area_id: 'hall' },
            'switch.kettle': { entity_id: 'switch.kettle', device_id: 'd2', area_id: null },
        },
        areas: { kitchen: { area_id: 'kitchen', name: 'Kitchen area' } },
        states: { 'sun.sun': { state: 'above_horizon' }, 'light.strip': { attributes: { friendly_name: 'Worktop strip' } },
            'light.ceiling': { attributes: { friendly_name: 'Ceiling' } } },
        async callApi(method, path, body) {
            calls.push([method, path, body]);
            if (method === 'GET') {
                if (!saved) throw { status_code: 404 };
                return saved;
            }
            return { result: 'ok' };
        },
    };
}
const room = { id: 'drawn', haRoom: 'room-1', haAreaId: 'kitchen', name: 'Kitchen' };
const texts = { automationName: '{room}: lights follow presence', automationDescription: 'Lights of {area} for {room}.' };

test('a saved room has the presence entity the integration made for it', () => {
    assert.equal(roomPresenceEntity(home(), 'room-1'), 'binary_sensor.kitchen_presence');
    assert.equal(roomPresenceEntity(home(), 'room-2'), null);
    assert.equal(roomPresenceEntity(home(), undefined), null);
    assert.equal(roomPresenceEntity({}, 'room-1'), null);
});

test('the lights of an area are its own and those of its devices, not hidden ones or ones moved elsewhere', () => {
    assert.deepEqual(areaLights(home(), 'kitchen'), [{ id: 'light.ceiling', name: 'Ceiling' }, { id: 'light.strip', name: 'Worktop strip' }]);
    assert.deepEqual(areaLights(home(), 'garden'), []);
    assert.deepEqual(areaLights(home(), null), []);
});

test('the automation switches the area on when somebody arrives and off after the room stayed empty', () => {
    const config = presenceLightsConfig({ presence: 'binary_sensor.kitchen_presence', areaId: 'kitchen', minutes: 5, onlyDark: false, alias: 'Name', description: 'Why' });

    assert.deepEqual(config.triggers, [
        { trigger: 'state', entity_id: 'binary_sensor.kitchen_presence', to: 'on', id: 'present' },
        { trigger: 'state', entity_id: 'binary_sensor.kitchen_presence', to: 'off', for: { minutes: 5 }, id: 'empty' },
    ]);
    const [{ choose }] = config.actions;
    assert.deepEqual(choose.map(option => [option.conditions.map(condition => condition.id ?? condition.entity_id), option.sequence[0].action, option.sequence[0].target]), [
        [['present'], 'light.turn_on', { area_id: 'kitchen' }],
        [['empty'], 'light.turn_off', { area_id: 'kitchen' }],
    ]);
    assert.deepEqual([config.alias, config.description, config.mode], ['Name', 'Why', 'single']);
    assert.deepEqual(presenceLightsOptions(config), { minutes: 5, onlyDark: false });
});

test('only when dark: on at arrival after sunset, on at sunset while somebody is there, and always off when empty', () => {
    const config = presenceLightsConfig({ presence: 'binary_sensor.p', areaId: 'a', minutes: 2, onlyDark: true });
    const [{ choose }] = config.actions;

    assert.deepEqual(config.triggers.at(-1), { trigger: 'state', entity_id: 'sun.sun', to: 'below_horizon', id: 'dusk' });
    assert.deepEqual(choose[0].conditions, [{ condition: 'trigger', id: 'present' }, { condition: 'state', entity_id: 'sun.sun', state: 'below_horizon' }]);
    assert.deepEqual(choose[1].conditions, [{ condition: 'trigger', id: 'dusk' }, { condition: 'state', entity_id: 'binary_sensor.p', state: 'on' }]);
    assert.deepEqual(choose[2].conditions, [{ condition: 'trigger', id: 'empty' }]);
    assert.equal(choose[2].sequence[0].action, 'light.turn_off');
    assert.deepEqual(presenceLightsOptions(config), { minutes: 2, onlyDark: true });
});

test('minutes stay whole and within reach, also from an automation somebody changed by hand', () => {
    const minutes = value => presenceLightsConfig({ presence: 'binary_sensor.p', areaId: 'a', minutes: value }).triggers[1].for.minutes;
    assert.deepEqual([minutes(0), minutes(2.6), minutes(999), minutes('x')], [3, 3, 120, 3]);
    assert.deepEqual(presenceLightsOptions({ trigger: [{ id: 'empty', for: '00:05:00' }] }), { minutes: 3, onlyDark: false });
    assert.deepEqual(presenceLightsOptions(null), { minutes: 3, onlyDark: false });
});

test('a room says what it has for the automation, and what it was set to', async () => {
    const fresh = await presenceLightsState(home(), room);
    assert.deepEqual(fresh, { id: 'smarthomeshop_presence_lights_room_1', presence: 'binary_sensor.kitchen_presence', areaId: 'kitchen',
        areaName: 'Kitchen area', lights: [{ id: 'light.ceiling', name: 'Ceiling' }, { id: 'light.strip', name: 'Worktop strip' }], sun: true, saved: null });

    const existing = presenceLightsConfig({ presence: 'binary_sensor.kitchen_presence', areaId: 'kitchen', minutes: 10, onlyDark: true });
    assert.deepEqual((await presenceLightsState(home(existing), room)).saved, { minutes: 10, onlyDark: true });

    // A room that was drawn but not saved yet has no presence entity, and nothing is asked.
    const hass = home();
    const drawn = await presenceLightsState(hass, { id: 'drawn', name: 'New', haAreaId: null });
    assert.deepEqual([drawn.presence, drawn.areaId, drawn.lights, drawn.saved], [null, null, [], null]);
    assert.deepEqual(hass.calls, []);

    // A failure that is not "no automation yet" is passed on.
    const broken = { ...home(), callApi: async () => { throw { status_code: 500 }; } };
    await assert.rejects(presenceLightsState(broken, room));
});

test('saving writes the automation under the id of the room, and removing deletes it', async () => {
    const hass = home();
    const id = await savePresenceLights(hass, room, { minutes: 4, onlyDark: true }, texts);

    assert.equal(id, presenceLightsId('room-1'));
    const [method, path, body] = hass.calls.at(-1);
    assert.deepEqual([method, path], ['POST', 'config/automation/config/smarthomeshop_presence_lights_room_1']);
    assert.deepEqual([body.alias, body.description], ['Kitchen: lights follow presence', 'Lights of Kitchen area for Kitchen.']);
    assert.deepEqual(presenceLightsOptions(body), { minutes: 4, onlyDark: true });

    await removePresenceLights(hass, room);
    assert.deepEqual(hass.calls.at(-1).slice(0, 2), ['DELETE', 'config/automation/config/smarthomeshop_presence_lights_room_1']);

    // Without a sun entity there is no dusk to wait for.
    const sunless = home();
    delete sunless.states['sun.sun'];
    await savePresenceLights(sunless, room, { minutes: 4, onlyDark: true }, texts);
    assert.equal(presenceLightsOptions(sunless.calls.at(-1)[2]).onlyDark, false);

    await assert.rejects(savePresenceLights(home(), { ...room, haAreaId: null }, { minutes: 4 }, texts));
    await assert.rejects(savePresenceLights(home(), { ...room, haRoom: 'gone' }, { minutes: 4 }, texts));
});
