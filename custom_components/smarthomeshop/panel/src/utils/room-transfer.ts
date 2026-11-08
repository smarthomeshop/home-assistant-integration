import type { Room } from '../types';

export const ROOM_EXPORT_FORMAT = 'smarthomeshop-room';
export const ROOM_EXPORT_SCHEMA_VERSION = 1;
export const MAX_ROOM_IMPORT_BYTES = 2 * 1024 * 1024;

export interface RoomExportDocument {
  format: typeof ROOM_EXPORT_FORMAT;
  schemaVersion: typeof ROOM_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  room: Room;
}

export interface RoomTransferSummary {
  walls: number;
  furniture: number;
  doors: number;
  windows: number;
  mirrors: number;
  sensors: number;
  zones: number;
}

export class RoomTransferError extends Error {
  readonly code: 'invalid_json' | 'invalid_format' | 'unsupported_version' | 'invalid_room';

  constructor(code: 'invalid_json' | 'invalid_format' | 'unsupported_version' | 'invalid_room') {
    super(code);
    this.code = code;
    this.name = 'RoomTransferError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isWall = (value: unknown): boolean => isRecord(value)
  && isFiniteNumber(value.x1)
  && isFiniteNumber(value.y1)
  && isFiniteNumber(value.x2)
  && isFiniteNumber(value.y2);

const optionalFinite = (value: unknown): boolean => value === undefined || isFiniteNumber(value);
const optionalString = (value: unknown): boolean => value === undefined || value === null || typeof value === 'string';
const isPoint = (value: unknown): boolean => isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
const isSensor = (value: unknown): boolean => isRecord(value)
  && optionalFinite(value.x)
  && optionalFinite(value.y)
  && optionalFinite(value.rotation)
  && optionalFinite(value.range)
  && optionalFinite(value.fov)
  && optionalFinite(value.heightMm)
  && optionalString(value.id)
  && optionalString(value.deviceId);
const isFurniture = (value: unknown): boolean => isRecord(value)
  && optionalString(value.id)
  && isFiniteNumber(value.x)
  && isFiniteNumber(value.y)
  && isFiniteNumber(value.width)
  && (isFiniteNumber(value.height) || isFiniteNumber(value.depth))
  && optionalFinite(value.rotation)
  && optionalFinite(value.rotationDeg);
const isDevice = (value: unknown): boolean => isRecord(value)
  && isFiniteNumber(value.x)
  && isFiniteNumber(value.y)
  && optionalFinite(value.rotation)
  && optionalFinite(value.rotationDeg)
  && optionalString(value.deviceId);
const isWallAttachment = (value: unknown, wallCount: number): value is Record<string, unknown> => isRecord(value)
  && Number.isInteger(value.wallIndex)
  && (value.wallIndex as number) >= 0
  && (value.wallIndex as number) < wallCount
  && isFiniteNumber(value.position)
  && value.position >= 0
  && value.position <= 1
  && isFiniteNumber(value.width)
  && value.width > 0;
const isDoor = (value: unknown, wallCount: number): boolean => isWallAttachment(value, wallCount)
  && optionalString(value.id)
  && (value.openDirection === undefined || value.openDirection === 'inward' || value.openDirection === 'outward')
  && (value.openSide === undefined || value.openSide === 'left' || value.openSide === 'right');
const isWindow = (value: unknown, wallCount: number): boolean => isWallAttachment(value, wallCount)
  && optionalString(value.id)
  && isFiniteNumber(value.height)
  && value.height > 0
  && (value.windowType === undefined || value.windowType === 'fixed' || value.windowType === 'open' || value.windowType === 'tilt');
const isMirror = (value: unknown, wallCount: number): boolean => isWallAttachment(value, wallCount)
  && optionalString(value.id)
  && isFiniteNumber(value.height)
  && value.height > 0
  && (value.reflectionDepthMm === undefined || (isFiniteNumber(value.reflectionDepthMm) && value.reflectionDepthMm >= 0))
  && (value.protectionEnabled === undefined || typeof value.protectionEnabled === 'boolean');
const isZone = (value: unknown): boolean => isRecord(value)
  && optionalString(value.name)
  && typeof value.type === 'string'
  && Array.isArray(value.points)
  && value.points.length <= 20
  && value.points.every(isPoint)
  && (value.parts === undefined || (Array.isArray(value.parts)
    && value.parts.length <= 20
    && value.parts.every(part => Array.isArray(part) && part.length <= 20 && part.every(isPoint))));

const boundedArray = (value: unknown, maximum: number): unknown[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maximum) throw new RoomTransferError('invalid_room');
  return value;
};

const validateRoom = (value: unknown): Room => {
  if (!isRecord(value)) throw new RoomTransferError('invalid_room');
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name || name.length > 120) throw new RoomTransferError('invalid_room');

  const walls = boundedArray(value.walls, 100);
  if (!walls.every(isWall)) throw new RoomTransferError('invalid_room');
  const furniture = boundedArray(value.furniture, 500);
  const devices = boundedArray(value.devices, 100);
  const doors = boundedArray(value.doors, 100);
  const windows = boundedArray(value.windows, 100);
  const mirrors = boundedArray(value.mirrors, 100);
  const sensors = boundedArray(value.sensors, 100);
  const zones = boundedArray(value.zones, 100);
  if (!furniture.every(isFurniture)
    || !devices.every(isDevice)
    || !doors.every(item => isDoor(item, walls.length))
    || !windows.every(item => isWindow(item, walls.length))
    || !mirrors.every(item => isMirror(item, walls.length))
    || !sensors.every(isSensor)
    || !zones.every(isZone)
    || (value.sensor !== undefined && value.sensor !== null && !isSensor(value.sensor))) {
    throw new RoomTransferError('invalid_room');
  }

  return {
    ...value,
    id: typeof value.id === 'string' ? value.id : '',
    name,
    walls,
    furniture,
    devices,
    zones,
  } as unknown as Room;
};

const cloneRoom = (room: Room): Room => JSON.parse(JSON.stringify(room)) as Room;

export const createRoomExportDocument = (
  room: Room,
  exportedAt = new Date().toISOString(),
): RoomExportDocument => ({
  format: ROOM_EXPORT_FORMAT,
  schemaVersion: ROOM_EXPORT_SCHEMA_VERSION,
  exportedAt,
  room: cloneRoom(validateRoom(room)),
});

/** Parse a current backup or a raw room object exported by an older build. */
export const parseRoomExportText = (text: string): Room => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new RoomTransferError('invalid_json');
  }

  if (!isRecord(parsed)) throw new RoomTransferError('invalid_format');
  if ('format' in parsed || 'schemaVersion' in parsed || 'room' in parsed) {
    if (parsed.format !== ROOM_EXPORT_FORMAT || !Number.isInteger(parsed.schemaVersion)) {
      throw new RoomTransferError('invalid_format');
    }
    if ((parsed.schemaVersion as number) > ROOM_EXPORT_SCHEMA_VERSION) {
      throw new RoomTransferError('unsupported_version');
    }
    return cloneRoom(validateRoom(parsed.room));
  }

  return cloneRoom(validateRoom(parsed));
};

export const makeImportedRoom = (room: Room, id: string, name: string): Room => {
  const validated = validateRoom(room) as Room & Record<string, unknown>;
  const { created_at: _createdAt, updated_at: _updatedAt, house: _house, ...portableRoom } = validated;
  return cloneRoom(validateRoom({
    ...portableRoom,
    id,
    name: name.trim(),
  }));
};

export const roomExportFilename = (name: string): string => {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'room';
  return `${slug}-smarthomeshop-room.json`;
};

export const summarizeRoom = (room: Room): RoomTransferSummary => ({
  walls: Array.isArray(room.walls) ? room.walls.length : 0,
  furniture: Array.isArray(room.furniture) ? room.furniture.length : 0,
  doors: Array.isArray(room.doors) ? room.doors.length : 0,
  windows: Array.isArray(room.windows) ? room.windows.length : 0,
  mirrors: Array.isArray(room.mirrors) ? room.mirrors.length : 0,
  sensors: Array.isArray(room.sensors) ? room.sensors.length : 0,
  zones: Array.isArray(room.zones) ? room.zones.length : 0,
});
