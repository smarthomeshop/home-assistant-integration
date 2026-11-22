// "Lights follow presence" for a room on the floor plan: an automation in
// Home Assistant that switches the lights of the room's area on when the
// room's presence entity says somebody is there, and off when the room has
// been empty for a while. It is a plain automation, saved the way Home
// Assistant's own editor saves one, so it can be changed there afterwards.

export const automationMinutes = { least: 1, most: 120, usual: 3 };

/** The id of the automation of a room. A room keeps one, so saving again updates it. */
export const presenceLightsId = roomId =>
    'smarthomeshop_presence_lights_' + String(roomId).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** The presence entity the integration made for a saved room, or null. */
export function roomPresenceEntity(hass, roomId) {
    if (!roomId) return null;
    const device = Object.values(hass?.devices ?? {}).find(candidate => (candidate?.identifiers ?? [])
        .some(identifier => identifier?.[0] === 'smarthomeshop' && identifier[1] === `room:${roomId}`));
    if (!device) return null;
    const sensors = Object.values(hass.entities ?? {})
        .filter(entity => entity?.device_id === device.id && entity.entity_id?.startsWith('binary_sensor.'));
    return (sensors.find(entity => entity.translation_key === 'room_occupancy') ?? sensors[0])?.entity_id ?? null;
}

/** The lights of an area, as [{ id, name }]: its own and those of its devices. */
export function areaLights(hass, areaId) {
    if (!areaId) return [];
    return Object.values(hass?.entities ?? {})
        .filter(entity => entity?.entity_id?.startsWith('light.') && !entity.hidden
            && (entity.area_id ?? hass.devices?.[entity.device_id]?.area_id) === areaId)
        .map(entity => ({ id: entity.entity_id, name: String(hass.states?.[entity.entity_id]?.attributes?.friendly_name ?? entity.entity_id) }))
        .sort((one, two) => one.name.localeCompare(two.name));
}

const wholeMinutes = value => Math.min(automationMinutes.most, Math.max(automationMinutes.least, Math.round(Number(value)) || automationMinutes.usual));

/**
 * The automation: lights on when somebody arrives, off after the room has
 * been empty for the given minutes. With onlyDark the lights only go on while
 * the sun is down, also when it sets while somebody is there.
 */
export function presenceLightsConfig({ presence, areaId, minutes, onlyDark, alias, description }) {
    const target = { area_id: areaId };
    const dark = { condition: 'state', entity_id: 'sun.sun', state: 'below_horizon' };
    return {
        alias,
        description,
        mode: 'single',
        triggers: [
            { trigger: 'state', entity_id: presence, to: 'on', id: 'present' },
            { trigger: 'state', entity_id: presence, to: 'off', for: { minutes: wholeMinutes(minutes) }, id: 'empty' },
            ...(onlyDark ? [{ trigger: 'state', entity_id: 'sun.sun', to: 'below_horizon', id: 'dusk' }] : []),
        ],
        conditions: [],
        actions: [{ choose: [
            { conditions: [{ condition: 'trigger', id: 'present' }, ...(onlyDark ? [dark] : [])],
                sequence: [{ action: 'light.turn_on', target }] },
            ...(onlyDark ? [{ conditions: [{ condition: 'trigger', id: 'dusk' }, { condition: 'state', entity_id: presence, state: 'on' }],
                sequence: [{ action: 'light.turn_on', target }] }] : []),
            { conditions: [{ condition: 'trigger', id: 'empty' }], sequence: [{ action: 'light.turn_off', target }] },
        ] }],
    };
}

/** What a saved automation was set to: { minutes, onlyDark }. */
export function presenceLightsOptions(config) {
    const triggers = [config?.triggers ?? config?.trigger ?? []].flat();
    const empty = triggers.find(trigger => trigger?.id === 'empty');
    return { minutes: wholeMinutes(empty?.for?.minutes), onlyDark: triggers.some(trigger => trigger?.id === 'dusk') };
}

const address = id => `config/automation/config/${id}`;

/**
 * What a room has for the automation.
 *
 * room is { haRoom, haAreaId, name }. Resolves to { id, presence, areaId,
 * areaName, lights, sun, saved }: presence is null until the room was saved
 * to Home Assistant, saved holds the options of the automation when the room
 * has one.
 */
export async function presenceLightsState(hass, room) {
    const id = presenceLightsId(room.haRoom ?? room.id);
    const presence = roomPresenceEntity(hass, room.haRoom);
    let saved = null;
    if (presence) {
        try {
            saved = presenceLightsOptions(await hass.callApi('GET', address(id)));
        } catch (error) {
            // No automation yet is the usual answer; anything else is a real problem.
            if (error?.status_code !== 404) throw error;
        }
    }
    const areaId = room.haAreaId ?? null;
    return { id, presence, areaId, areaName: areaId ? String(hass.areas?.[areaId]?.name ?? areaId) : '',
        lights: areaLights(hass, areaId), sun: Boolean(hass.states?.['sun.sun']), saved };
}

/** Saves the automation of a room, new or changed. texts holds its name and description. */
export async function savePresenceLights(hass, room, { minutes, onlyDark }, texts) {
    const state = await presenceLightsState(hass, room);
    if (!state.presence || !state.areaId) throw new Error('Room not ready');
    const fill = text => String(text ?? '').replaceAll('{room}', room.name).replaceAll('{area}', state.areaName);
    await hass.callApi('POST', address(state.id), presenceLightsConfig({ presence: state.presence, areaId: state.areaId,
        minutes, onlyDark: Boolean(onlyDark) && state.sun, alias: fill(texts.automationName), description: fill(texts.automationDescription) }));
    return state.id;
}

export const removePresenceLights = (hass, room) => hass.callApi('DELETE', address(presenceLightsId(room.haRoom ?? room.id)));
