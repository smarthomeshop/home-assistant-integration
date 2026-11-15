import type { Room, RoomAggregationSettings } from '../types';

export const zoneAppliesToSensor = (
  zone: { sensorId?: string; sensor_id?: string },
  sourceId: string,
): boolean => !(zone.sensorId || zone.sensor_id)
  || (zone.sensorId || zone.sensor_id) === sourceId;

export interface StoredZMapping {
  mode: 'raw' | 'floor_up' | 'sensor_down';
  verified: boolean;
  verification_fingerprint?: string;
}

/** Merge drawer-owned metadata without normalising or rebuilding geometry. */
export const mergeHardwareRoomMetadata = (
  room: Room,
  aggregation: RoomAggregationSettings,
  calibration: unknown,
  zMappings: ReadonlyMap<string, StoredZMapping>,
): Room => ({
  ...room,
  sensors: (room.sensors || []).map(sensor => {
    const mapping = zMappings.get(sensor.id);
    return mapping ? {
      ...sensor,
      z_mapping: { ...((sensor as typeof sensor & { z_mapping?: object }).z_mapping || {}), ...mapping },
    } : sensor;
  }),
  aggregation: {
    ...(room.aggregation || {}),
    ...aggregation,
    presence: {
      ...(room.aggregation?.presence || {}),
      ...aggregation.presence,
    },
    climate: {
      ...(room.aggregation?.climate || {}),
      ...aggregation.climate,
      temperature: {
        ...(room.aggregation?.climate?.temperature || {}),
        ...aggregation.climate.temperature,
      },
      humidity: {
        ...(room.aggregation?.climate?.humidity || {}),
        ...aggregation.climate.humidity,
      },
      co2: {
        ...(room.aggregation?.climate?.co2 || {}),
        ...aggregation.climate.co2,
      },
    },
    tracking: {
      ...(room.aggregation?.tracking || {}),
      ...aggregation.tracking,
      source_alignments: Object.fromEntries(
        Object.entries(aggregation.tracking.source_alignments).map(([sourceId, alignment]) => [
          sourceId,
          {
            ...(room.aggregation?.tracking?.source_alignments?.[sourceId] || {}),
            ...alignment,
          },
        ]),
      ),
    },
  },
  calibration: {
    ...((room.calibration || {}) as object),
    ...((calibration || {}) as object),
  } as Room['calibration'],
});

export interface AlignmentRevocationResult {
  room: Room;
  replaced_updated_at?: string | null;
}

/** Remove calibration data that must never survive a placement disagreement. */
export const roomWithFusionRevoked = (room: Room): Room => {
  if (!room.aggregation) return room;
  return {
    ...room,
    aggregation: {
      ...room.aggregation,
      tracking: {
        ...room.aggregation.tracking,
        experimental_fusion: false,
        source_alignments: {},
      },
    },
  };
};

/** Reconcile a narrow server-side revocation without copying stale room contents. */
export const reconcileRoomAfterAlignmentRevocation = (
  current: Room,
  result: AlignmentRevocationResult,
  requestedRevision: string | undefined,
): { room: Room; revisionAdopted: boolean } => {
  const replacedRevision = result.replaced_updated_at ?? undefined;
  const revisionAdopted = current.updated_at === requestedRevision
    && requestedRevision === replacedRevision;
  const safe = roomWithFusionRevoked(current);
  const revokedAt = result.room.aggregation?.tracking.alignment_revoked_at;
  return {
    room: {
      ...safe,
      updated_at: revisionAdopted ? result.room.updated_at : current.updated_at,
      ...(safe.aggregation ? {
        aggregation: {
          ...safe.aggregation,
          tracking: {
            ...safe.aggregation.tracking,
            ...(revokedAt ? { alignment_revoked_at: revokedAt } : {}),
          },
        },
      } : {}),
    },
    revisionAdopted,
  };
};

export const authoritativeAlignmentRevocation = (
  localMarker: string | undefined,
  serverMarker: string | undefined,
): string | null => serverMarker && serverMarker !== localMarker ? serverMarker : null;

export const fusionCanRun = (alignmentReady: boolean, revocationPending: boolean): boolean =>
  alignmentReady && !revocationPending;

/**
 * Bind a confirmed asynchronous radar update to its originating room/source.
 * This deliberately never uses a UI array index, which may now belong to a
 * different room after the user navigated while ESPHome was confirming.
 */
export const applyInstallationChangeToOriginRoom = (
  rooms: Room[],
  originRoomId: string,
  sourceId: string | null,
  heightMm: number | null,
): Room[] => rooms.map(room => {
  if (room.id !== originRoomId) return room;
  const updated = heightMm !== null && sourceId
    ? {
      ...room,
      sensors: room.sensors?.map(sensor => sensor.id === sourceId
        ? { ...sensor, heightMm }
        : sensor),
    }
    : room;
  return roomWithFusionRevoked(updated);
});
