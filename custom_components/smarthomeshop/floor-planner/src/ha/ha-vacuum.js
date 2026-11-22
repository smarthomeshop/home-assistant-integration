// The maps of robot vacuums that Home Assistant has: the pictures a robot's
// integration offers as an image or camera entity.

// Words for a map in entity ids, for map pictures that do not hang on the
// robot's own device.
const mapWords = /(^|_)(map|maps|karte|kaart|carte|mapa)(_|$)/;

/** Whether Home Assistant has a robot vacuum at all. Without one there is no map to offer. */
export const hasRobotVacuum = hass => Object.keys(hass?.states ?? {}).some(id => id.startsWith('vacuum.'));

/**
 * The map pictures in Home Assistant, as [{ id, name }] by name. A picture
 * counts when it belongs to a device that has a vacuum, or when a vacuum
 * exists and the picture's id says it is a map.
 */
export function vacuumMaps(hass) {
    const states = hass?.states ?? {};
    const registry = hass?.entities ?? {};
    const robots = new Set(Object.values(registry)
        .filter(entity => entity?.entity_id?.startsWith('vacuum.') && entity.device_id).map(entity => entity.device_id));
    if (!robots.size && !hasRobotVacuum(hass)) return [];
    return Object.keys(states).filter(id => {
        if (!/^(image|camera)\./.test(id)) return false;
        const state = states[id];
        if (state?.state === 'unavailable' || !mapPath(state)) return false;
        const device = registry[id]?.device_id;
        return (device && robots.has(device)) || mapWords.test(id.slice(id.indexOf('.') + 1));
    }).map(id => ({ id, name: String(states[id].attributes.friendly_name || id) }))
        .sort((one, two) => one.name.localeCompare(two.name));
}

// Where Home Assistant serves the picture of an entity, when it is one of its own proxies.
const mapPath = state => {
    const path = state?.attributes?.entity_picture;
    return typeof path === 'string' && /^\/api\/(image|camera)_proxy\//.test(path) ? path : null;
};

/** The picture of a map entity as a file. get is fetch, or a stand-in for it. */
export async function loadVacuumMap(hass, id, get = (...request) => fetch(...request)) {
    const path = mapPath(hass?.states?.[id]);
    if (!path) throw new Error('No map picture');
    const response = await get(typeof hass.hassUrl === 'function' ? hass.hassUrl(path) : path, { credentials: 'same-origin' });
    if (!response.ok) throw new Error('No map picture');
    return response.blob();
}
