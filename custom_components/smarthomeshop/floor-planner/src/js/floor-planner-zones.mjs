// Zones can belong to one sensor. A zone like that only makes sense next to its
// own sensor, so when the sensor goes the zone goes with it. Turning it into a
// shared zone instead would quietly apply it to every radar in the room, which
// for an exclusion zone means hiding real people.
//
// Plans saved by Home Assistant may still use the older sensor_id spelling.
const owner = zone => zone?.sensorId || zone?.sensor_id;

export const removeZonesOwnedBySensor = (zones, sensorId) =>
    (Array.isArray(zones) ? zones : []).filter(zone => owner(zone) !== sensorId);

export const removeOrphanedSensorZones = (zones, sensorIds) => {
    const available = sensorIds instanceof Set ? sensorIds : new Set(sensorIds || []);
    return (Array.isArray(zones) ? zones : []).filter(zone => !owner(zone) || available.has(owner(zone)));
};
