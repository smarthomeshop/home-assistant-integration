// Home Assistant area and floor links used by the embedded Floorplan Designer.
//
// Home Assistant calls a room an "area". The planner keeps its own geometry,
// while these optional IDs connect that geometry to the user's HA registry.

export function devicesForRoomArea(devices, room, areaOnly = true) {
    if (!areaOnly || !room?.haAreaId) return devices;
    return devices.filter(device => device.areaId === room.haAreaId);
}

export function roomWithHomeAssistantArea(room, areaId, areas) {
    const next = { ...room };
    const area = areas.find(candidate => candidate.id === areaId);
    if (!area) {
        delete next.haAreaId;
        return next;
    }
    next.haAreaId = area.id;
    if (area.floorId) next.haFloorId = area.floorId;
    return next;
}

export function roomWithHomeAssistantFloor(room, floorId, areas) {
    const next = { ...room };
    if (floorId) next.haFloorId = floorId;
    else delete next.haFloorId;
    const area = areas.find(candidate => candidate.id === next.haAreaId);
    if (area?.floorId && area.floorId !== floorId) delete next.haAreaId;
    return next;
}
