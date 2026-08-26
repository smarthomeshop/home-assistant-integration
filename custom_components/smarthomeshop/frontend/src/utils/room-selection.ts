export interface RoomSensorPlacement {
  deviceId?: string | null;
  [key: string]: unknown;
}

export interface RoomWithSensors {
  id?: string;
  sensor?: RoomSensorPlacement | null;
  sensors?: RoomSensorPlacement[];
  [key: string]: unknown;
}

export const roomSensorPlacements = (room: RoomWithSensors | null | undefined): RoomSensorPlacement[] => {
  if (!room) return [];
  if (Array.isArray(room.sensors) && room.sensors.length) return room.sensors.filter(Boolean);
  return room.sensor ? [room.sensor] : [];
};

export const roomSensorForDevice = (
  room: RoomWithSensors | null | undefined,
  deviceAliases: Array<string | null | undefined>,
): RoomSensorPlacement | null => {
  const aliases = new Set(deviceAliases.filter((value): value is string => Boolean(value)));
  const sensors = roomSensorPlacements(room);
  const exact = sensors.find(sensor => Boolean(sensor.deviceId && aliases.has(sensor.deviceId)));
  if (exact) return exact;
  // Older single-sensor rooms did not store a device association. They are
  // safe only when there is exactly one unambiguous placement.
  if (sensors.length === 1 && !sensors[0].deviceId) return sensors[0];
  return null;
};

export const resolveRoomForDevice = <T extends RoomWithSensors>(
  rooms: T[],
  deviceAliases: Array<string | null | undefined>,
  explicitRoomId?: string | null,
): T | null => {
  if (explicitRoomId) {
    const explicit = rooms.find(room => room.id === explicitRoomId);
    if (explicit) return explicit;
  }
  const aliases = new Set(deviceAliases.filter((value): value is string => Boolean(value)));
  const linked = rooms.find(room => roomSensorPlacements(room)
    .some(sensor => Boolean(sensor.deviceId && aliases.has(sensor.deviceId))));
  if (linked) return linked;

  const legacyRooms = rooms.filter(room => {
    const sensors = roomSensorPlacements(room);
    return sensors.length === 1 && !sensors[0].deviceId;
  });
  return rooms.length === 1 && legacyRooms.length === 1 ? legacyRooms[0] : null;
};

export const normaliseRoomViewHeight = (value: unknown): number => {
  const parsed = Number(value ?? 360);
  return Number.isFinite(parsed) ? Math.min(720, Math.max(240, Math.round(parsed))) : 360;
};
