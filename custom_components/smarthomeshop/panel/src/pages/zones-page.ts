import { LitElement, html, css, svg, nothing, PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import type {
  HomeAssistant,
  RadarDeviceProfilePayload,
  RadarTargetEntityMap,
  Room,
  RoomAggregationSettings,
  RoomClimateStrategy,
} from '../types';
import '../components/sensor-coverage-calibration';
import type { CalibrationPoint } from '../components/sensor-coverage-calibration';
import { panelText } from '../utils/panel-translations';
import {
  normalizeRadarCoordinate,
  projectRoomPointToRadar,
  projectRadarTargetToRoom,
  reprojectRadarCoverage,
  serializeRadarPolygon,
  type RadarCoordinateProjection,
} from '../utils/radar-coordinates';
import {
  resolveFurnitureRotation,
  rotatedFurnitureCorners,
} from '../utils/furniture-geometry';
import {
  LD2460_ANGLE_RANGE,
  LD2460_DETECTION_ANGLE_RANGE,
  LD2460_DETECTION_DISTANCE_RANGE,
  LD2460_HEIGHT_RANGE,
  RadarInstallationUpdateError,
  expectedRadarHardwareMode,
  parseRadarInstallationNumber,
  performConfirmedRadarUpdate,
  radarInstallationAvailability,
  radarInstallationEntityStatus,
  validateRadarDetectionSector,
} from '../utils/radar-installation';
import { settingsText } from '../utils/settings-translations';
import {
  findDeviceEntity,
  resolveESPHomeDeviceService,
} from '../utils/device-entity-resolution';
import {
  allocateReflectionExclusions,
  createMirrorReflectionPolygons,
  pointInPolygon,
  safelyOutsideRoom,
} from '../utils/reflection-protection';
import {
  MAX_ROOM_IMPORT_BYTES,
  RoomTransferError,
  createRoomExportDocument,
  makeImportedRoom,
  parseRoomExportText,
  roomExportFilename,
  summarizeRoom,
} from '../utils/room-transfer';
import {
  RoomPlanImportError,
  parseAppleRoomPlanText,
  type RoomPlanWarning,
} from '../utils/roomplan-import';
import {
  CrossSourceAssociationGate,
  MultiSensorTrackEngine,
  alignmentCaptureFingerprint,
  assessRoomTrackingStatus,
  assessPairwiseAlignmentNetwork,
  exclusionsExplainAggregatePresence,
  fuseObservations,
  fusionReadiness,
  isFreshObservation,
  mapReportedZToRoom,
  reconcileReportedTargetCount,
  roomFusionOptions,
  shouldRevokeAlignment,
  sourcePlacementFingerprint,
  type RoomTrack,
  type TrackObservation,
  type ZMapping,
} from '../utils/multi-sensor-tracking';
import {
  EntityReportReceiptTracker,
  latestIndependentReportTimestamp,
  radarEvidenceEntityIds,
  safeSuppressionRoomPolygon,
} from '../utils/whole-home';
import {
  applyInstallationChangeToOriginRoom,
  authoritativeAlignmentRevocation,
  fusionCanRun,
  mergeHardwareRoomMetadata,
  reconcileRoomAfterAlignmentRevocation,
  roomWithFusionRevoked,
  zoneAppliesToSensor,
  type AlignmentRevocationResult,
} from '../utils/room-safety';

const PENDING_ALIGNMENT_REVOCATIONS_KEY = 'smarthomeshop.pending-alignment-revocations.v1';
const PENDING_ALIGNMENT_REVOCATION_ROOM_PREFIX = `${PENDING_ALIGNMENT_REVOCATIONS_KEY}.room.`;

interface Point { x: number; y: number; }
interface Point3D { x: number; y: number; z: number; }
interface Camera3D { azimuth: number; elevation: number; distance: number; targetX: number; targetY: number; targetZ: number; }
type ViewMode = '2d' | '3d';
type ZoneType = 'detection' | 'exclusion' | 'entry' | 'interference';
type ZoneProfilePreset = 'default' | 'bed' | 'seating' | 'transit' | 'custom';
// Voor detection/exclusion/interference: points is het eerste polygon (3+ punten)
// Voor entry: points heeft exact 2 punten (een lijn) + inDirection geeft aan welke kant "in" is
interface ZoneProfile {
  preset: ZoneProfilePreset;
  enterDelayMs: number;
  leaveDelayMs: number;
  minDwellMs: number;
  minTargets: number;
}
interface ZoneData {
  id: number;
  points: Point[];
  parts?: Point[][];
  type: ZoneType;
  name: string;
  inDirection?: 'left' | 'right';  // Alleen voor entry lijnen: welke kant is "de kamer in"
  sensorId?: string;               // Entry lines: which sensor counts this line
  profile?: ZoneProfile;
}
interface RoomCalibration { enabled: boolean; corners: Point[]; gridSizeMm: 100 | 300; snapToGrid: boolean; sensorId?: string; }
interface TrackingSettings { smoothingEnabled: boolean; smoothingAlpha: number; maxJumpMm: number; trackHoldMs: number; crossZoneTracking: boolean; }
interface LocalFurnitureItem { id: string; type: string; name: string; x: number; y: number; width: number; height: number; rotation: number; }
interface DoorItem { id: string; wallIndex: number; position: number; width: number; openDirection: 'inward' | 'outward'; openSide: 'left' | 'right'; }
interface WindowItem { id: string; wallIndex: number; position: number; width: number; height: number; windowType: 'fixed' | 'open' | 'tilt'; }
interface MirrorItem { id: string; wallIndex: number; position: number; width: number; height: number; protectionEnabled: boolean; reflectionDepthMm: number; }
type SensorMountingMode = 'wall' | 'ceiling';
type RadarProductFamily = 'ceilsense' | 'ultimate-sensor' | 'unknown';
interface SensorInstance {
  id: string;
  deviceId: string | null;
  x: number;
  y: number;
  rotation: number;
  range: number;
  fov: number;
  heightMm: number;
  mountingMode: SensorMountingMode;
  sourceVersion?: number;
  configuredAt?: string;
  radarModules?: string[];
  capabilities?: Record<string, unknown>;
  zMapping?: ZMapping;
}
interface LiveTarget {
  index: number;
  x: number;
  y: number;
  active: boolean;
  rawZMm: number | null;
  roomZMm: number | null;
  observedAtMs: number;
  excluded: boolean;
}
interface RoomRuntimeSource {
  source_id: string;
  device_id: string | null;
  name: string;
  status: 'positive' | 'negative' | 'unknown';
  age_seconds: number | null;
  radar_modules: string[];
  positioning: boolean;
  climate: Record<string, { fresh: boolean; value: number | null }>;
}
interface RoomRuntimeSnapshot {
  presence: { occupied: boolean | null; status: string; degraded: boolean; unknown_sources: string[] };
  climate: Record<string, { value: number | null; available: boolean; degraded: boolean }>;
  sources: RoomRuntimeSource[];
  tracking: RoomAggregationSettings['tracking'];
}
const createDefaultAggregation = (): RoomAggregationSettings => ({
  version: 2,
  presence: { freshness_seconds: 120, vacancy_delay_seconds: 30, source_ids: [] },
  climate: {
    temperature: { strategy: 'average', primary_source_id: null },
    humidity: { strategy: 'average', primary_source_id: null },
    co2: { strategy: 'average', primary_source_id: null },
  },
  tracking: {
    experimental_fusion: false,
    duplicate_distance_mm: 650,
    observation_freshness_ms: 5000,
    handoff_hold_ms: 1800,
    z_tolerance_mm: 700,
    source_alignments: {},
  },
});
interface RadarCapabilities {
  targetCount: number;
  availableTargetCount: number;
  coordinateMode: 'target' | 'tracking-target' | 'unknown';
  polygonZones: boolean;
  entryLines: boolean;
  zoneProfiles: boolean;
  interferenceZones: boolean;
  smoothing: boolean;
  crossZoneTracking: boolean;
}
interface RadarDevice {
  id: string;
  aliases: string[];
  entityPrefix: string;
  name: string;
  capabilities: RadarCapabilities;
  productFamily: RadarProductFamily;
  recommendedMountingMode: SensorMountingMode;
  profile: {
    mountingMode: SensorMountingMode;
    coordinateProjection: RadarCoordinateProjection;
    requiredInstallationMode: 'top' | 'side' | null;
    mountingHeightMm: number | null;
    maximumRangeMm: number | null;
    fieldOfViewDeg: number | null;
    radarModel: string;
    coordinateFrame: string | null;
    coordinateScaleToMm: number;
    maximumTargets: number;
    hardwareModeCapability: 'fixed' | 'top_or_side' | null;
    metadataSource: 'firmware' | 'legacy_fallback';
    detectedProduct: string | null;
    supplementaryPresenceSensors: string[];
    currentHardwareMode: 'top' | 'side' | null;
    reportedInstallationModeEntityId: string | null;
    installationModeEntityId: string | null;
    installationModeOptions: string[];
    installationHeightEntityId: string | null;
    installationHeightM: number | null;
    installationAngleEntityId: string | null;
    installationAngleDeg: number | null;
    detectionDistanceEntityId: string | null;
    detectionDistanceM: number | null;
    detectionStartAngleEntityId: string | null;
    detectionStartAngleDeg: number | null;
    detectionEndAngleEntityId: string | null;
    detectionEndAngleDeg: number | null;
    trackingPresenceEntityId: string | null;
    trackingTargetCountEntityId: string | null;
    missingMetadataEntities: string[];
    invalidMetadataEntities: string[];
    positioningAvailable: boolean;
  };
  targets: RadarTargetEntityMap[];
}

const CANVAS_SIZE = 800;
const HALF = CANVAS_SIZE / 2;
type ToolMode = 'select' | 'sensor' | 'zone' | 'walls' | 'door' | 'window' | 'mirror' | 'furniture';
type DesignMode = 'layout' | 'sensors';
interface FurnitureType { id: string; name: string; icon: string; defaultWidth: number; defaultHeight: number; }

const FURNITURE_TYPES: FurnitureType[] = [
  { id: 'bed', name: 'Bed', icon: 'mdi:bed-double', defaultWidth: 1600, defaultHeight: 2000 },
  { id: 'sofa', name: 'Sofa', icon: 'mdi:sofa', defaultWidth: 2000, defaultHeight: 900 },
  { id: 'chair', name: 'Chair', icon: 'mdi:chair-rolling', defaultWidth: 500, defaultHeight: 500 },
  { id: 'table', name: 'Table', icon: 'mdi:table-furniture', defaultWidth: 1200, defaultHeight: 800 },
  { id: 'cabinet', name: 'Cabinet', icon: 'mdi:wardrobe', defaultWidth: 1000, defaultHeight: 600 },
];

// Zone type limits
const ZONE_LIMITS = {
  detection: 4,
  exclusion: 2,
  entry: 2,
  interference: 2,
};

const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string }> = {
  detection: { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' },     // Groen
  exclusion: { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#ef4444' },     // Rood
  entry: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10b981' },       // Emerald/Turquoise
  interference: { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b' }, // Amber
};

const ZONE_LABELS: Record<ZoneType, { singular: string; plural: string; icon: string }> = {
  detection: { singular: 'Detection', plural: 'Detection', icon: '📍' },
  exclusion: { singular: 'Exclusion', plural: 'Exclusion', icon: '🚷' },
  entry: { singular: 'Entry Line', plural: 'Entry Lines', icon: '🚪' },
  interference: { singular: 'Interference', plural: 'Interference', icon: '⚡' },
};

const PROFILE_DEFAULTS: Record<Exclude<ZoneProfilePreset, 'custom'>, ZoneProfile> = {
  default: { preset: 'default', enterDelayMs: 0, leaveDelayMs: 1500, minDwellMs: 0, minTargets: 1 },
  bed: { preset: 'bed', enterDelayMs: 500, leaveDelayMs: 15000, minDwellMs: 1000, minTargets: 1 },
  seating: { preset: 'seating', enterDelayMs: 300, leaveDelayMs: 8000, minDwellMs: 750, minTargets: 1 },
  transit: { preset: 'transit', enterDelayMs: 0, leaveDelayMs: 750, minDwellMs: 0, minTargets: 1 },
};

const DEFAULT_CALIBRATION: RoomCalibration = { enabled: false, corners: [], gridSizeMm: 100, snapToGrid: true };
const DEFAULT_TRACKING: TrackingSettings = {
  smoothingEnabled: true,
  smoothingAlpha: 0.35,
  maxJumpMm: 1200,
  trackHoldMs: 1200,
  crossZoneTracking: true,
};

const getZoneParts = (zone: ZoneData): Point[][] => {
  const parts = zone.parts?.filter((part) => Array.isArray(part) && part.length >= 3) || [];
  if (parts.length) return parts;
  return zone.points.length ? [zone.points] : [];
};

const normalizeZone = (raw: Partial<ZoneData>, index: number): ZoneData => {
  const rawParts = Array.isArray(raw.parts) ? raw.parts.filter((part) => Array.isArray(part) && part.length >= 3) : [];
  const points = Array.isArray(raw.points) ? raw.points : [];
  const parts = rawParts.length ? rawParts : (points.length >= 3 ? [points] : []);
  const type: ZoneType = ['detection', 'exclusion', 'entry', 'interference'].includes(raw.type || '')
    ? raw.type as ZoneType
    : 'detection';
  const preset = raw.profile?.preset || 'default';
  const baseProfile = preset === 'custom' ? PROFILE_DEFAULTS.default : PROFILE_DEFAULTS[preset as Exclude<ZoneProfilePreset, 'custom'>] || PROFILE_DEFAULTS.default;
  return {
    id: Number.isFinite(Number(raw.id)) ? Number(raw.id) : Date.now() + index,
    name: raw.name || `${ZONE_LABELS[type].singular} ${index + 1}`,
    type,
    points: type === 'entry' ? points.slice(0, 2) : (parts[0] || points),
    parts: type === 'entry' ? undefined : parts,
    inDirection: raw.inDirection,
    sensorId: raw.sensorId || (raw as Partial<ZoneData> & { sensor_id?: string }).sensor_id,
    profile: type === 'detection' ? { ...baseProfile, ...raw.profile, preset } : undefined,
  };
};

// Note: We now use a stylized man icon instead of a detailed mesh
// The icon is drawn procedurally with simple shapes (head sphere, body/arms/legs as rounded boxes)


export class ZonesPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Array }) rooms: Room[] = [];
  @property({ type: Boolean }) hardwareOnly = false;
  @property({ attribute: false }) hardwareContext?: { roomId?: string; sensorId?: string; readOnly: boolean };
  @state() private _hardwareLoading = true;
  @state() private _hardwareFeedback: { message: string; status: 'success' | 'warning'; conflict?: boolean } | null = null;

  // Room state
  @state() private _roomsError: string | null = null;
  @state() private _invalidRoomCount = 0;
  @state() private _selectedRoomId: string | null = null;
  @state() private _roomPoints: Point[] = [];
  @state() private _furniture: LocalFurnitureItem[] = [];
  @state() private _doors: DoorItem[] = [];
  @state() private _windows: WindowItem[] = [];
  @state() private _mirrors: MirrorItem[] = [];

  // Sensor state (multiple sensors per room)
  @state() private _sensors: SensorInstance[] = [];
  @state() private _aggregation: RoomAggregationSettings = createDefaultAggregation();
  @state() private _roomRuntime: Record<string, RoomRuntimeSnapshot> = {};
  @state() private _roomRuntimeAvailable = false;
  private _runtimeUpdateInterval: number | null = null;
  private _runtimeExpiryTimer: number | null = null;
  private _runtimeRequest = 0;
  private _runtimePending = false;
  private _runtimeReceivedAt = 0;
  @state() private _selectedSensorIndex: number | null = null;
  @state() private _draggingSensorIndex: number | null = null;
  @state() private _radarDevices: RadarDevice[] = [];
  @state() private _radarProfilesLoading = true;
  @state() private _radarProfilesError: string | null = null;
  @state() private _changingHardwareMode = false;
  @state() private _installationDrafts: Record<string, string> = {};
  @state() private _installationUpdateEntityId: string | null = null;
  @state() private _installationFeedback: Record<string, { tone: 'success' | 'error'; text: string }> = {};
  @state() private _sectorDrafts: Record<string, string> = {};
  @state() private _sectorUpdateEntityId: string | null = null;
  @state() private _sectorFeedback: { tone: 'success' | 'error'; text: string } | null = null;
  private _sectorDebounceTimer: number | null = null;
  private _queuedSectorChange: { radar: RadarDevice; entityId: string; value: number } | null = null;

  // Zone state
  @state() private _zones: ZoneData[] = [];
  @state() private _selectedZoneIndex: number | null = null;
  @state() private _selectedZonePartIndex = 0;
  @state() private _appendToZoneIndex: number | null = null;
  @state() private _calibration: RoomCalibration = { ...DEFAULT_CALIBRATION, corners: [] };
  @state() private _showCoverageCalibration = false;
  @state() private _coverageCalibrationStartsFresh = false;
  @state() private _tracking: TrackingSettings = { ...DEFAULT_TRACKING };
  @state() private _drawingZone: Point[] = [];
  @state() private _newZoneType: ZoneType = 'detection';
  @state() private _showZoneTypePicker = false;
  @state() private _pendingZonePoints: Point[] = [];
  @state() private _draggingZonePointIndex: number | null = null;
  @state() private _draggingDrawingPointIndex: number | null = null;
  @state() private _draggingWholeZoneIndex: number | null = null;
  @state() private _dragStartPos: Point | null = null;
  @state() private _zoneMidpointPreview: { zoneIndex: number; segmentIndex: number; point: Point } | null = null;
  @state() private _editingZoneIndex: number | null = null;

  // Live tracking, keyed by sensor instance id
  @state() private _liveTargets: Record<string, LiveTarget[]> = {};
  @state() private _roomTracks: RoomTrack[] = [];
  @state() private _alignmentSamples: Array<Record<string, Point>> = [];
  private _alignmentSampleFingerprint: string | null = null;
  @state() private _alignmentFeedback = '';
  @state() private _alignmentRevocationError = '';
  @state() private _fusionAssociationAmbiguous = false;
  private _latestRoomObservations: TrackObservation[] = [];
  private readonly _roomTrackEngine = new MultiSensorTrackEngine();
  private readonly _associationGate = new CrossSourceAssociationGate();
  private readonly _targetReportReceipts = new EntityReportReceiptTracker();

  // Zone sync state
  @state() private _entryExitEnabled = false;
  @state() private _assumedPresent = false;
  @state() private _pushingToSensor = false;

  // Canvas state
  @state() private _toolMode: ToolMode = 'select';
  @state() private _zoom = 1;
  @state() private _panOffset: Point = { x: 0, y: 0 };
  @state() private _cursorPos: Point | null = null;
  @state() private _saving = false;
  @state() private _isDragging = false;
  @state() private _dirty = false;
  private _editRevision = 0;
  private readonly _pendingAlignmentRevocationRoomIds = this._loadPendingAlignmentRevocations();
  private readonly _alignmentRevocationInFlight = new Set<string>();
  private readonly _alignmentRevocationBlockedRoomIds = new Set<string>();

  /** Whether there are unsaved Floorplan Designer changes (read by the top nav). */
  public get isDirty(): boolean {
    return this._dirty;
  }

  public get hardwareBusy(): boolean { return this._saving || this._pushingToESPHome; }

  // Design mode: room layout editing vs sensors & zones
  @state() private _designMode: DesignMode = 'layout';

  // Wall editing state
  @state() private _pendingStart: Point | null = null;
  @state() private _previewPoint: Point | null = null;
  @state() private _wallHoverPreview: { wallIndex: number; position: number; point: Point } | null = null;
  @state() private _draggingPointIndex: number | null = null;

  // Furniture editing state
  @state() private _selectedFurnitureType: FurnitureType | null = null;
  @state() private _showFurnitureDialog = false;
  @state() private _furnitureWidth = 1000;
  @state() private _furnitureHeight = 1000;
  @state() private _selectedFurnitureIndex: number | null = null;
  @state() private _draggingFurnitureIndex: number | null = null;

  // Door/window/mirror editing state
  @state() private _draggingDoorIndex: number | null = null;
  @state() private _draggingWindowIndex: number | null = null;
  @state() private _draggingMirrorIndex: number | null = null;
  @state() private _doorWindowPreview: { wallIndex: number; position: number; point: Point; type: 'door' | 'window' | 'mirror' } | null = null;
  @state() private _showDoorDialog = false;
  @state() private _showWindowDialog = false;
  @state() private _showMirrorDialog = false;
  @state() private _editingDoorIndex: number | null = null;
  @state() private _editingWindowIndex: number | null = null;
  @state() private _editingMirrorIndex: number | null = null;
  @state() private _selectedWallIndex: number | null = null;
  @state() private _doorWidth = 900;
  @state() private _doorOpenDirection: 'inward' | 'outward' = 'inward';
  @state() private _doorOpenSide: 'left' | 'right' = 'left';
  @state() private _windowWidth = 1200;
  @state() private _windowHeight = 1000;
  @state() private _windowType: 'fixed' | 'open' | 'tilt' = 'open';
  @state() private _mirrorWidth = 1000;
  @state() private _mirrorHeight = 1800;
  @state() private _mirrorProtectionEnabled = false;
  @state() private _mirrorReflectionDepthMm = 2000;

  // Room management
  @state() private _showNewRoomDialog = false;
  @state() private _newRoomName = '';
  @state() private _newRoomWidth = 0;
  @state() private _newRoomLength = 0;
  @state() private _showRenameRoomDialog = false;
  @state() private _renameRoomId: string | null = null;
  @state() private _renameRoomName = '';
  @state() private _showDeleteRoomDialog = false;
  @state() private _deleteRoomId: string | null = null;
  @state() private _roomActionBusy = false;
  @state() private _roomActionError = '';
  @state() private _pendingImportedRoom: Room | null = null;
  @state() private _pendingImportedRoomOptions: Room[] = [];
  @state() private _selectedImportedRoomIndex = 0;
  @state() private _importRoomSource: 'backup' | 'apple_roomplan' = 'backup';
  @state() private _importRoomWarnings: RoomPlanWarning[] = [];
  @state() private _importRoomName = '';
  @state() private _showImportRoomDialog = false;
  @state() private _roomTransferBusy = false;
  @state() private _roomTransferNotice: { tone: 'success' | 'error'; text: string } | null = null;

  // Trail history per sensor per target, in sensor-local coordinates
  private _targetTrails: Record<string, Array<Array<{ x: number; y: number }>>> = {};

  private _targetUpdateInterval: number | null = null;
  @query('svg') private _svg!: SVGSVGElement;
  @query('#canvas3d') private _canvas3d!: HTMLCanvasElement;
  @query('#room-import-file') private _roomImportFile!: HTMLInputElement;

  // 3D View state
  @state() private _viewMode: ViewMode = '2d';
  private _camera3d: Camera3D = { azimuth: 45, elevation: 35, distance: 8000, targetX: 0, targetY: 0, targetZ: 1000 };
  private _isDragging3D = false;
  private _active3DPointerId: number | null = null;
  private _lastMouseX = 0;
  private _lastMouseY = 0;

  private readonly WALL_HEIGHT_3D = 2500;

  static styles = css`
    :host {
      /* Floorplan Designer theme tokens: follow the active HA theme. The old
         hardcoded slate palette only suited dark mode. */
      --rd-deep: var(--secondary-background-color, #0f172a);
      --rd-panel: var(--card-background-color, #1e293b);
      --rd-line: var(--divider-color, #334155);
      --rd-line-strong: var(--divider-color, #475569);
      --rd-dim: var(--secondary-text-color, #64748b);
      --rd-dim2: var(--secondary-text-color, #94a3b8);
      --rd-text: var(--primary-text-color, #e2e8f0);
      --rd-accent: var(--primary-color, #4361ee);
      --rd-canvas: color-mix(in srgb, var(--rd-deep) 92%, var(--rd-panel));
      --rd-shadow: 0 12px 32px color-mix(in srgb, #000 12%, transparent);
    }
    :host { display: grid; grid-template-columns: 280px minmax(420px, 1fr) 280px; gap: 16px; padding: 20px; height: calc(100vh - 100px); box-sizing: border-box; background: var(--primary-background-color, var(--rd-deep)); }
    .sidebar { background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; box-shadow: var(--rd-shadow); }
    .section-title { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; color: var(--rd-text); letter-spacing: -0.01em; margin-bottom: 10px; }
    .section-title ha-icon { --mdc-icon-size: 17px; color: var(--rd-accent); }
    .room-list { display: flex; flex-direction: column; gap: 6px; }
    .room-item { display: flex; align-items: center; min-height: 48px; background: color-mix(in srgb, var(--rd-deep) 72%, transparent); border: 1px solid var(--rd-line); border-radius: 10px; overflow: hidden; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
    .room-item:hover { border-color: var(--rd-line-strong); }
    .room-item.selected { border-color: var(--rd-accent); background: color-mix(in srgb, var(--rd-accent) 9%, var(--rd-panel)); box-shadow: inset 3px 0 var(--rd-accent); }
    .room-select { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; padding: 10px 8px 10px 12px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    .room-select:focus-visible { outline: 2px solid #4361ee; outline-offset: -2px; }
    .room-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--rd-accent) 10%, var(--rd-deep)); border-radius: 8px; }
    .room-icon ha-icon { --mdc-icon-size: 18px; color: var(--rd-dim2); }
    .room-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--rd-text); font-weight: 500; }
    .room-actions { display: flex; align-items: center; gap: 2px; padding-right: 6px; }
    .room-action { width: 32px; height: 32px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--rd-dim2); cursor: pointer; }
    .room-action:hover, .room-action:focus-visible { color: #4361ee; background: color-mix(in srgb, #4361ee 12%, transparent); outline: none; }
    .room-action.delete:hover, .room-action.delete:focus-visible { color: #ef4444; background: color-mix(in srgb, #ef4444 12%, transparent); }
    .room-action ha-icon { --mdc-icon-size: 17px; }
    .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .tool-btn { min-height: 66px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 10px 8px; background: color-mix(in srgb, var(--rd-deep) 72%, transparent); border: 1px solid var(--rd-line); border-radius: 10px; color: var(--rd-dim2); cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.15s; }
    .tool-btn:hover { border-color: var(--rd-line-strong); background: color-mix(in srgb, var(--rd-accent) 5%, var(--rd-panel)); color: var(--rd-text); transform: translateY(-1px); }
    .tool-btn.active { border-color: var(--rd-accent); background: color-mix(in srgb, var(--rd-accent) 12%, var(--rd-panel)); color: var(--rd-accent); }
    .tool-btn:focus-visible, .mode-btn:focus-visible, .view-toggle-btn:focus-visible, .control-btn:focus-visible, .save-btn:focus-visible, .push-btn:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 2px; }
    .tool-btn ha-icon { --mdc-icon-size: 22px; color: currentColor; }
    .tool-btn span { font-size: 11px; font-weight: 650; color: currentColor; }
    .canvas-area { min-width: 0; background: var(--rd-canvas); border: 1px solid var(--rd-line); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--rd-shadow); }
    .canvas-header { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; background: var(--rd-panel); border-bottom: 1px solid var(--rd-line); }
    .header-group { display: flex; align-items: center; gap: 8px; }
    .canvas-context { min-width: 0; flex-wrap: wrap; }
    .workspace-heading { min-width: 132px; padding-right: 12px; border-right: 1px solid var(--rd-line); }
    .workspace-heading strong { display: block; max-width: 230px; overflow: hidden; color: var(--rd-text); font-size: 14px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
    .workspace-heading span { display: block; margin-top: 2px; color: var(--rd-dim); font-size: 10.5px; }
    .room-label { font-size: 13px; color: var(--rd-dim2); }
    .room-label span { color: var(--rd-text); font-weight: 600; }
    .save-btn { min-height: 38px; display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: color-mix(in srgb, #22c55e 10%, var(--rd-panel)); border: 1px solid color-mix(in srgb, #22c55e 30%, var(--rd-line)); border-radius: 9px; color: #16844a; font-size: 12px; font-weight: 700; cursor: default; }
    .save-btn.dirty { background: #22c55e; color: white; cursor: pointer; }
    .save-btn.dirty:hover { background: #16a34a; }
    .push-btn { min-height: 38px; display: flex; align-items: center; gap: 6px; padding: 8px 13px; background: transparent; border: 1px solid var(--rd-accent); border-radius: 9px; color: var(--rd-accent); font-size: 12px; font-weight: 700; cursor: pointer; }
    .push-btn:disabled { border-color: var(--rd-line-strong); color: var(--rd-dim); cursor: not-allowed; }
    .push-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.12); }
    svg { flex: 1; min-height: 0; background: var(--rd-canvas); cursor: crosshair; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--rd-dim); }
    .empty-state ha-icon { --mdc-icon-size: 64px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin: 0 0 8px 0; color: var(--rd-dim2); }
    .grid-line { stroke: var(--rd-line); stroke-width: 0.5; opacity: 0.6; }
    .grid-line.major { stroke: var(--rd-panel); stroke-width: 1; }
    .wall-line { stroke: var(--rd-line-strong); stroke-width: 3; stroke-linecap: round; }
    .canvas-controls { position: absolute; bottom: 16px; left: 16px; display: flex; gap: 8px; z-index: 5; }
    .control-group { display: flex; align-items: center; background: var(--rd-panel); border-radius: 10px; overflow: hidden; border: 1px solid var(--rd-line); box-shadow: 0 6px 18px color-mix(in srgb, #000 14%, transparent); }
    .control-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: var(--rd-dim2); cursor: pointer; }
    .control-btn:hover { background: var(--rd-line); color: var(--rd-text); }
    .zoom-value { min-width: 44px; padding: 0 8px; color: var(--rd-dim2); font-size: 11px; font-variant-numeric: tabular-nums; text-align: center; border-inline: 1px solid var(--rd-line); }
    .instructions { border: 1px solid color-mix(in srgb, var(--rd-accent) 22%, var(--rd-line)); border-radius: 10px; padding: 13px; background: color-mix(in srgb, var(--rd-accent) 6%, var(--rd-panel)); }
    .instructions-title { font-size: 13px; font-weight: 700; color: var(--rd-accent); margin-bottom: 6px; }
    .instructions-text { font-size: 12px; color: var(--rd-dim2); line-height: 1.5; }
    .setting-item { margin-bottom: 12px; }
    .setting-item label { display: block; font-size: 12px; color: var(--rd-dim2); margin-bottom: 4px; }
    .setting-item input[type="range"] { width: 100%; }
    .settings-panel { padding: 12px; margin-bottom: 14px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 10px; }
    .settings-panel-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: var(--rd-text); font-size: 13px; font-weight: 600; }
    .settings-panel-header ha-icon { --mdc-icon-size: 18px; color: #4361ee; }
    :host([hardwareonly]) { display: block; min-height: 0; height: auto; padding: 0; background: transparent; }
    .radar-settings { padding: 18px 20px 24px; }
    .radar-settings h3 { margin: 0; font-size: 15px; line-height: 1.35; color: var(--rd-text); }
    .radar-settings p { margin: 0; font-size: 13px; line-height: 1.55; color: var(--rd-dim2); }
    .radar-fields { display: grid; gap: 12px; }
    .radar-field { position: relative; display: grid; min-width: 0; gap: 6px; color: var(--rd-text); font-size: 13px; font-weight: 650; }
    .radar-field::after {
      content: ""; position: absolute; inset-inline-end: 16px; bottom: 19px; width: 7px; height: 7px;
      border: solid currentColor; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); pointer-events: none;
    }
    .radar-field select {
      appearance: none; box-sizing: border-box; width: 100%; min-width: 0; min-height: 44px; padding: 0 32px 0 12px;
      border: 1px solid var(--rd-line); border-radius: 8px; background: var(--rd-deep); color: var(--rd-text);
      font: inherit; font-size: 15px; font-weight: 400;
    }
    .radar-settings :is(select, button):focus-visible { outline: 2px solid var(--primary-color, #4361ee); outline-offset: 2px; }
    .radar-section { display: grid; gap: 9px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--rd-line); }
    .radar-section-title, .radar-actions { display: flex; align-items: center; gap: 8px; }
    .radar-actions { flex-wrap: wrap; }
    .radar-section-title ha-icon, .radar-notice ha-icon { --mdc-icon-size: 18px; color: var(--rd-dim2); }
    .radar-section .radar-count { margin-inline-start: auto; font-size: 12px; color: var(--rd-dim2); }
    .radar-settings .radar-action {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 0 12px;
      border: 1px solid var(--rd-line); border-radius: 8px; background: var(--rd-deep); color: var(--rd-text);
      cursor: pointer; font: inherit; font-size: 13px; font-weight: 650;
    }
    .radar-action ha-icon { --mdc-icon-size: 17px; }
    .radar-settings .radar-action:hover:not(:disabled) { border-color: var(--primary-color, #4361ee); }
    .radar-settings .radar-action:disabled { opacity: .58; cursor: default; }
    .radar-settings .radar-primary:not(:disabled) { border-color: #4261e4; background: #4261e4; color: #fafbff; }
    .radar-notice {
      display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: 9px;
      margin-top: 14px; padding: 12px; border: 1px solid var(--rd-line); border-radius: 8px; background: var(--rd-deep);
    }
    .radar-notice p { overflow-wrap: anywhere; white-space: pre-wrap; }
    .radar-notice[data-status="warning"] ha-icon { color: var(--warning-color, #b97025); }
    .radar-notice[data-status="success"] ha-icon { color: var(--success-color, #23834b); }
    .radar-notice button { margin-top: 8px; }
    @media (max-width: 600px) { .radar-settings { padding: 15px; } }
    .settings-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; margin-top: 10px; }
    .settings-row label { color: var(--rd-dim2); font-size: 12px; }
    .settings-row input[type="number"], .corner-row input { width: 82px; padding: 7px 8px; box-sizing: border-box; border: 1px solid var(--rd-line); border-radius: 6px; background: var(--rd-panel); color: var(--rd-text); }
    .settings-row select { width: 120px; }
    .settings-row input[type="checkbox"] { width: 18px; height: 18px; accent-color: #4361ee; }
    .corner-grid { display: grid; gap: 6px; margin-top: 10px; }
    .corner-row { display: grid; grid-template-columns: 28px 1fr 1fr; gap: 6px; align-items: center; color: var(--rd-dim2); font-size: 11px; }
    .corner-row input { width: 100%; }
    .secondary-action { display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 10px; padding: 8px; border: 1px solid var(--rd-line-strong); border-radius: 7px; background: transparent; color: var(--rd-text); cursor: pointer; font-size: 12px; }
    .secondary-action:hover { border-color: #4361ee; color: #4361ee; }
    .secondary-action:disabled { opacity: 0.45; cursor: not-allowed; }
    .secondary-action ha-icon { --mdc-icon-size: 16px; }
    .coverage-summary { display: flex; align-items: flex-start; gap: 9px; margin-top: 10px; padding: 10px; border: 1px solid var(--rd-line); border-radius: 8px; background: var(--rd-panel); }
    .coverage-summary ha-icon { --mdc-icon-size: 18px; flex: 0 0 auto; margin-top: 1px; color: var(--rd-dim); }
    .coverage-summary.calibrated ha-icon { color: #22c55e; }
    .coverage-summary strong, .coverage-summary span { display: block; }
    .coverage-summary strong { color: var(--rd-text); font-size: 12px; }
    .coverage-summary span { margin-top: 2px; color: var(--rd-dim); font-size: 11px; line-height: 1.4; }
    .calibration-details { margin-top: 10px; color: var(--rd-dim2); font-size: 11px; }
    .calibration-details summary { cursor: pointer; }
    select { width: 100%; padding: 8px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 6px; color: var(--rd-text); font-size: 13px; }
    .info-text { color: var(--rd-dim); font-size: 12px; line-height: 1.5; }
    .room-summary { overflow: hidden; border: 1px solid var(--rd-line); border-radius: 11px; background: color-mix(in srgb, var(--rd-deep) 68%, transparent); }
    .room-summary-hero { display: flex; align-items: center; gap: 11px; padding: 13px; border-bottom: 1px solid var(--rd-line); }
    .room-summary-hero .icon { width: 38px; height: 38px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 9px; color: var(--rd-accent); background: color-mix(in srgb, var(--rd-accent) 11%, var(--rd-panel)); }
    .room-summary-hero .icon ha-icon { --mdc-icon-size: 21px; }
    .room-summary-hero strong, .room-summary-hero span { display: block; }
    .room-summary-hero strong { color: var(--rd-text); font-size: 19px; font-weight: 750; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .room-summary-hero span { margin-top: 3px; color: var(--rd-dim); font-size: 10.5px; }
    .room-summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .room-summary-item { display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: center; gap: 7px; min-width: 0; padding: 10px 11px; border-bottom: 1px solid var(--rd-line); }
    .room-summary-item:nth-child(odd) { border-right: 1px solid var(--rd-line); }
    .room-summary-item:last-child:nth-child(odd) { grid-column: 1 / -1; border-right: 0; border-bottom: 0; }
    .room-summary-item ha-icon { --mdc-icon-size: 17px; color: var(--rd-dim2); }
    .room-summary-item strong, .room-summary-item span { display: block; min-width: 0; }
    .room-summary-item strong { color: var(--rd-text); font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .room-summary-item span { overflow: hidden; margin-top: 1px; color: var(--rd-dim); font-size: 9.5px; text-overflow: ellipsis; white-space: nowrap; }
    .room-summary-empty { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 9px; align-items: start; padding: 13px; color: var(--rd-dim2); font-size: 11px; line-height: 1.5; }
    .room-summary-empty ha-icon { --mdc-icon-size: 20px; color: var(--rd-accent); }
    .firmware-status { margin-top: 10px; padding: 11px; border: 1px solid var(--rd-line); border-radius: 9px; background: var(--rd-deep); }
    .profile-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; padding-bottom: 9px; border-bottom: 1px solid var(--rd-line); }
    .radar-model { color: var(--rd-text); font-size: 13px; font-weight: 750; letter-spacing: 0.025em; }
    .profile-source { padding: 3px 7px; border-radius: 999px; color: var(--rd-dim2); background: var(--rd-line); font-size: 9px; font-weight: 700; letter-spacing: 0.035em; text-transform: uppercase; }
    .profile-source.firmware { color: #16844a; background: color-mix(in srgb, #22a35a 14%, var(--rd-panel)); }
    .firmware-status-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; }
    .firmware-status-row + .firmware-status-row { margin-top: 6px; }
    .firmware-status-value { color: var(--rd-text); font-weight: 600; text-align: right; }
    .firmware-status-note { margin: 8px 0 0; color: var(--rd-dim); font-size: 11px; line-height: 1.4; }
    .firmware-status-note.warning { color: #f59e0b; }
    .firmware-status-note.good { color: #22a35a; }
    .profile-lock { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 8px 10px; border: 1px solid var(--rd-line); border-radius: 7px; color: var(--rd-text); background: var(--rd-deep); font-size: 12px; }
    .profile-lock ha-icon { --mdc-icon-size: 17px; color: #4361ee; }
    .radar-installation { margin: 12px 0; padding-block: 12px; border-block: 1px solid var(--rd-line); }
    .radar-installation-header { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 8px; align-items: start; }
    .radar-installation-header ha-icon { --mdc-icon-size: 18px; color: #4361ee; }
    .radar-installation-header strong, .radar-installation-header span { display: block; overflow-wrap: anywhere; }
    .radar-installation-header strong { color: var(--rd-text); font-size: 12px; }
    .radar-installation-header span { margin-top: 3px; color: var(--rd-dim); font-size: 10.5px; line-height: 1.45; }
    .radar-installation-controls { display: grid; gap: 10px; margin-top: 11px; }
    .radar-installation-control { min-width: 0; }
    .radar-installation-control label { display: flex; justify-content: space-between; gap: 8px; color: var(--rd-dim2); font-size: 11px; }
    .radar-installation-control label span { color: var(--rd-text); font-weight: 700; }
    .radar-installation-input { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px; margin-top: 5px; }
    .radar-installation-input input { min-width: 0; width: 100%; box-sizing: border-box; padding: 8px 9px; border: 1px solid var(--rd-line); border-radius: 7px; background: var(--rd-panel); color: var(--rd-text); font: inherit; font-size: 12px; }
    .radar-installation-input input:focus-visible { outline: 2px solid #4361ee; outline-offset: 1px; }
    .radar-installation-input button { min-width: 58px; padding: 7px 9px; border: 1px solid #4361ee; border-radius: 7px; background: transparent; color: #4361ee; font: inherit; font-size: 10.5px; font-weight: 700; cursor: pointer; }
    .radar-installation-input button:hover:not(:disabled) { background: color-mix(in srgb, #4361ee 10%, transparent); }
    .radar-installation-input button:focus-visible { outline: 2px solid #4361ee; outline-offset: 2px; }
    .radar-installation-input button:disabled, .radar-installation-input input:disabled { opacity: 0.5; cursor: not-allowed; }
    .radar-installation-feedback { display: flex; align-items: flex-start; gap: 5px; margin-top: 5px; color: var(--rd-dim); font-size: 10px; line-height: 1.35; overflow-wrap: anywhere; }
    .radar-installation-feedback.success { color: #16844a; }
    .radar-installation-feedback.error { color: #dc2626; }
    .radar-installation-feedback ha-icon { --mdc-icon-size: 13px; flex: 0 0 auto; }
    .radar-installation-note { margin: 9px 0 0; padding: 8px 9px; border-radius: 7px; background: color-mix(in srgb, #4361ee 7%, var(--rd-panel)); color: var(--rd-dim2); font-size: 10px; line-height: 1.45; overflow-wrap: anywhere; }
    .radar-installation-note.warning { background: color-mix(in srgb, #d97706 9%, var(--rd-panel)); color: #d97706; }
    .radar-sector { margin: 12px 0; padding: 12px; border: 1px solid color-mix(in srgb, #f59e0b 34%, var(--rd-line)); border-radius: 9px; background: color-mix(in srgb, #f59e0b 4%, var(--rd-panel)); }
    .radar-sector .radar-installation-header ha-icon { color: #d97706; }
    .radar-sector-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 11px; }
    .radar-sector-control { min-width: 0; }
    .radar-sector-control label { display: block; min-height: 28px; color: var(--rd-dim2); font-size: 10px; line-height: 1.3; }
    .radar-sector-control input { width: 100%; min-width: 0; box-sizing: border-box; margin-top: 5px; padding: 8px; border: 1px solid var(--rd-line); border-radius: 7px; background: var(--rd-panel); color: var(--rd-text); font: inherit; }
    .radar-sector-control input:focus-visible { outline: 2px solid #f59e0b; outline-offset: 1px; }
    .radar-sector-control input:disabled { opacity: .55; cursor: wait; }
    @media (max-width: 760px) { .radar-sector-grid { grid-template-columns: 1fr; } .radar-sector-control label { min-height: 0; } }
    .supplementary-sources { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--rd-line); }
    .supplementary-sources strong, .supplementary-sources span, .supplementary-sources small { display: block; }
    .supplementary-sources strong { color: var(--rd-text); font-size: 11px; }
    .supplementary-sources span { margin-top: 3px; color: var(--rd-dim2); font-size: 10.5px; }
    .supplementary-sources small { margin-top: 4px; color: var(--rd-dim); font-size: 10px; line-height: 1.4; }
    .mode-warning { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 8px; margin-top: 10px; padding: 10px; border: 1px solid color-mix(in srgb, #d97706 35%, transparent); border-radius: 8px; background: color-mix(in srgb, #d97706 9%, var(--rd-panel)); }
    .mode-warning ha-icon { --mdc-icon-size: 18px; color: #d97706; }
    .mode-warning strong, .mode-warning span { display: block; }
    .mode-warning strong { color: var(--rd-text); font-size: 11px; }
    .mode-warning span { margin-top: 3px; color: var(--rd-dim2); font-size: 10.5px; line-height: 1.4; }
    .mode-warning button { margin-top: 8px; padding: 6px 9px; border: 1px solid #d97706; border-radius: 6px; background: transparent; color: #d97706; font: inherit; font-size: 10.5px; font-weight: 700; cursor: pointer; }
    .mode-warning button:disabled { opacity: 0.5; cursor: progress; }
    .radar-diagnostics { margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--rd-line); color: var(--rd-dim); font-size: 10.5px; }
    .radar-diagnostics summary { color: var(--rd-dim2); cursor: pointer; font-weight: 650; }
    .radar-diagnostics dl { display: grid; gap: 4px; margin: 8px 0 0; }
    .radar-diagnostics dl div { display: grid; grid-template-columns: minmax(72px, 0.8fr) minmax(0, 1.2fr); gap: 8px; }
    .radar-diagnostics dt { color: var(--rd-dim); }
    .radar-diagnostics dd { margin: 0; color: var(--rd-text); overflow-wrap: anywhere; }
    .radar-diagnostics p { margin: 7px 0 0; color: #d97706; line-height: 1.4; }
    .sensor-list { display: flex; flex-direction: column; gap: 6px; }
    .sensor-item { display: flex; align-items: center; gap: 4px; padding: 4px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; }
    .sensor-item:hover { border-color: var(--rd-line-strong); }
    .sensor-item.selected { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .sensor-select { display: flex; flex: 1; min-width: 0; align-items: center; gap: 10px; padding: 6px 8px; border: 0; border-radius: 6px; background: transparent; color: inherit; text-align: left; cursor: pointer; }
    .sensor-select:focus-visible, .canvas3d:focus-visible { outline: 2px solid #4361ee; outline-offset: 2px; }
    .sensor-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .sensor-dot.small { width: 18px; height: 18px; font-size: 10px; }
    .sensor-item-info { flex: 1; min-width: 0; }
    .sensor-item-name { font-size: 13px; color: var(--rd-text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sensor-item-sub { font-size: 11px; color: var(--rd-dim); }
    .add-sensor-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 2px dashed var(--rd-line-strong); border-radius: 8px; background: transparent; color: var(--rd-dim2); font-size: 13px; cursor: pointer; }
    .add-sensor-btn:hover { border-color: #4361ee; color: #4361ee; }
    .add-sensor-btn ha-icon { --mdc-icon-size: 16px; }
    .room-aggregation { margin-top: 14px; padding: 12px; border: 1px solid var(--rd-line); border-radius: 10px; background: color-mix(in srgb, var(--rd-deep) 72%, transparent); }
    .room-aggregation-header { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 9px; align-items: start; }
    .room-aggregation-header > ha-icon { --mdc-icon-size: 21px; color: var(--rd-accent); margin-top: 2px; }
    .room-aggregation-header strong, .room-aggregation-header span { display: block; overflow-wrap: anywhere; }
    .room-aggregation-header strong { color: var(--rd-text); font-size: 12px; }
    .room-aggregation-header span { margin-top: 3px; color: var(--rd-dim); font-size: 10.5px; line-height: 1.4; }
    .aggregation-status { display: flex; align-items: center; gap: 7px; margin-top: 11px; padding: 8px 9px; border-radius: 7px; background: color-mix(in srgb, #64748b 10%, var(--rd-panel)); color: var(--rd-dim2); font-size: 11px; font-weight: 650; }
    .aggregation-status.occupied { background: color-mix(in srgb, #22c55e 11%, var(--rd-panel)); color: #16844a; }
    .aggregation-status.clear { background: color-mix(in srgb, #4361ee 9%, var(--rd-panel)); color: #4361ee; }
    .aggregation-status.unknown, .aggregation-status.clearing { background: color-mix(in srgb, #d97706 10%, var(--rd-panel)); color: #b45309; }
    .aggregation-status ha-icon { --mdc-icon-size: 16px; flex: 0 0 auto; }
    .aggregation-block { margin-top: 12px; padding-top: 11px; border-top: 1px solid var(--rd-line); }
    .aggregation-block h4 { margin: 0; color: var(--rd-text); font-size: 11.5px; }
    .aggregation-help { margin: 4px 0 0; color: var(--rd-dim); font-size: 10px; line-height: 1.45; overflow-wrap: anywhere; }
    .source-health-list { display: grid; gap: 6px; margin-top: 8px; }
    .source-health { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 7px; align-items: center; padding: 7px 8px; border: 1px solid var(--rd-line); border-radius: 7px; background: var(--rd-panel); }
    .source-health input { width: 16px; height: 16px; accent-color: var(--rd-accent); }
    .source-health-main { min-width: 0; }
    .source-health-main strong, .source-health-main small { display: block; overflow-wrap: anywhere; }
    .source-health-main strong { color: var(--rd-text); font-size: 10.5px; }
    .source-health-main small { margin-top: 2px; color: var(--rd-dim); font-size: 9.5px; }
    .source-state { padding: 3px 5px; border-radius: 4px; background: var(--rd-deep); color: var(--rd-dim); font-size: 9px; font-weight: 750; text-transform: uppercase; }
    .source-state.positive { color: #16844a; }
    .source-state.unknown { color: #b45309; }
    .aggregation-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin-top: 8px; }
    .aggregation-field { min-width: 0; }
    .aggregation-field label { display: block; color: var(--rd-dim2); font-size: 9.5px; line-height: 1.3; }
    .aggregation-field input, .aggregation-field select { width: 100%; min-width: 0; box-sizing: border-box; margin-top: 4px; padding: 7px; border: 1px solid var(--rd-line); border-radius: 7px; background: var(--rd-panel); color: var(--rd-text); font: inherit; font-size: 10.5px; }
    .aggregation-field input:focus-visible, .aggregation-field select:focus-visible { outline: 2px solid var(--rd-accent); outline-offset: 1px; }
    .climate-row { display: grid; grid-template-columns: minmax(70px, .7fr) minmax(0, 1fr); gap: 7px; align-items: center; margin-top: 7px; }
    .climate-row > label { color: var(--rd-dim2); font-size: 10.5px; }
    .climate-controls { display: grid; gap: 5px; min-width: 0; }
    .climate-controls select { width: 100%; min-width: 0; padding: 7px; border: 1px solid var(--rd-line); border-radius: 7px; background: var(--rd-panel); color: var(--rd-text); font: inherit; font-size: 10.5px; }
    .fusion-toggle { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 9px; align-items: center; margin-top: 8px; }
    .fusion-toggle label { color: var(--rd-text); font-size: 10.5px; font-weight: 650; }
    .fusion-toggle input { width: 18px; height: 18px; accent-color: var(--rd-accent); }
    .fusion-calibration, .z-mapping-panel { margin-top: 9px; padding: 9px; border: 1px solid var(--rd-line); border-radius: 8px; background: var(--rd-panel); }
    .fusion-calibration strong, .z-mapping-panel > strong { color: var(--rd-text); font-size: 10.5px; }
    .fusion-calibration-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .fusion-calibration-actions .secondary-action { display: inline-flex; align-items: center; gap: 5px; }
    .z-mapping-row { display: grid; grid-template-columns: minmax(90px, .6fr) minmax(0, 1.4fr); gap: 7px; align-items: center; margin-top: 8px; }
    .z-mapping-row > label { color: var(--rd-dim2); font-size: 10px; overflow-wrap: anywhere; }
    .z-mapping-row select { width: 100%; min-width: 0; padding: 7px; border: 1px solid var(--rd-line); border-radius: 7px; background: var(--rd-deep); color: var(--rd-text); font: inherit; font-size: 10px; }
    .z-confirmation { grid-column: 2; display: flex; gap: 6px; align-items: flex-start; color: var(--rd-dim); line-height: 1.35; }
    .z-confirmation input { flex: 0 0 auto; margin-top: 1px; accent-color: var(--rd-accent); }
    @media (max-width: 460px) { .aggregation-grid, .climate-row, .z-mapping-row { grid-template-columns: 1fr; } .z-confirmation { grid-column: 1; } }
    .live-sensor-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; }
    .live-sensor-name { flex: 1; color: var(--rd-dim2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .live-sensor-count { color: var(--rd-text); font-weight: 600; }
    .mode-toggle { display: flex; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; overflow: hidden; }
    .mode-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: none; color: var(--rd-dim2); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .mode-btn:hover { color: var(--rd-text); }
    .mode-btn.active { background: #4361ee; color: white; }
    .mode-btn ha-icon { --mdc-icon-size: 16px; }
    .add-room-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 2px dashed var(--rd-line-strong); border-radius: 8px; background: transparent; color: var(--rd-dim2); font-size: 13px; cursor: pointer; }
    .add-room-btn:hover { border-color: #4361ee; color: #4361ee; }
    .add-room-btn ha-icon { --mdc-icon-size: 16px; }
    .room-transfer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 2px; }
    .room-transfer-btn { min-height: 40px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border: 1px solid var(--rd-line); border-radius: 8px; background: color-mix(in srgb, var(--rd-deep) 72%, transparent); color: var(--rd-dim2); font: inherit; font-size: 12px; font-weight: 650; cursor: pointer; }
    .room-transfer-btn:hover:not(:disabled), .room-transfer-btn:focus-visible { border-color: var(--rd-accent); color: var(--rd-accent); outline: none; }
    .room-transfer-btn:disabled { opacity: 0.48; cursor: not-allowed; }
    .room-transfer-btn ha-icon { --mdc-icon-size: 17px; }
    .visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
    .room-transfer-notice { display: flex; align-items: flex-start; gap: 6px; margin: 8px 0 0; padding: 8px 9px; border-radius: 7px; background: color-mix(in srgb, #22c55e 9%, var(--rd-panel)); color: #16844a; font-size: 11px; line-height: 1.4; }
    .room-transfer-notice.error { background: color-mix(in srgb, #ef4444 8%, var(--rd-panel)); color: #dc2626; }
    .room-transfer-notice ha-icon { --mdc-icon-size: 16px; flex: 0 0 auto; }
    .furniture-grid { display: flex; flex-direction: column; gap: 6px; }
    .furniture-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; cursor: pointer; }
    .furniture-item:hover { border-color: #4361ee; }
    .furniture-item.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .furniture-item ha-icon { --mdc-icon-size: 20px; color: var(--rd-dim2); }
    .furniture-item span { flex: 1; font-size: 13px; color: var(--rd-text); }
    .furniture-item small { font-size: 11px; color: var(--rd-dim); }
    .placed-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; margin-bottom: 6px; font-size: 12px; }
    .placed-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .placed-item ha-icon { --mdc-icon-size: 18px; color: var(--rd-dim); }
    .placed-item .name { flex: 1; color: var(--rd-text); }
    .placed-item .size { color: var(--rd-dim); }
    .icon-btn { background: none; border: none; color: var(--rd-dim2); cursor: pointer; padding: 4px; }
    .icon-btn:hover { color: var(--rd-text); }
    .icon-btn ha-icon { --mdc-icon-size: 16px; }
    .selected-panel { background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 10px; padding: 12px; }
    .selected-panel input { width: 100%; padding: 8px; background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 6px; color: var(--rd-text); box-sizing: border-box; }
    .selected-panel label { display: block; font-size: 11px; color: var(--rd-dim2); margin-bottom: 4px; }
    .panel-btn-row { display: flex; gap: 8px; margin-top: 10px; }
    .panel-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 8px; border: 1px solid var(--rd-line); background: transparent; color: var(--rd-text); font-size: 12px; cursor: pointer; }
    .panel-btn:hover { border-color: #4361ee; }
    .panel-btn.danger { color: #ef4444; }
    .panel-btn.danger:hover { border-color: #ef4444; }
    .panel-btn ha-icon { --mdc-icon-size: 16px; }
    .input-row { display: flex; gap: 12px; }
    .input-row > div { flex: 1; }
    .dialog-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 16px; padding: 24px; min-width: 340px; max-width: 420px; }
    .dialog h3 { margin: 0 0 16px; font-size: 16px; color: var(--rd-text); }
    .dialog label { display: block; font-size: 12px; color: var(--rd-dim2); margin: 10px 0 4px; }
    .dialog input, .dialog select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--rd-line-strong); background: var(--rd-deep); color: var(--rd-text); font-size: 13px; box-sizing: border-box; }
    .dialog input:focus, .dialog select:focus { outline: none; border-color: #4361ee; }
    .dialog-buttons { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .dialog-btn { padding: 10px 18px; border-radius: 8px; font-size: 13px; cursor: pointer; border: none; }
    .dialog-btn.cancel { background: transparent; border: 1px solid var(--rd-line-strong); color: var(--rd-dim2); }
    .dialog-btn.primary { background: #4361ee; color: white; }
    .dialog-btn.danger { background: #dc2626; color: white; }
    .dialog-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .dialog-warning { display: flex; align-items: flex-start; gap: 9px; margin: 12px 0; padding: 11px 12px; border: 1px solid color-mix(in srgb, #ef4444 35%, var(--rd-line)); border-radius: 9px; background: color-mix(in srgb, #ef4444 8%, var(--rd-panel)); color: var(--rd-dim2); font-size: 12px; line-height: 1.45; }
    .dialog-warning ha-icon { --mdc-icon-size: 19px; flex: 0 0 auto; color: #ef4444; }
    .dialog-error { margin-top: 10px; color: #ef4444; font-size: 12px; }
    .import-description { margin: -7px 0 14px; color: var(--rd-dim2); font-size: 12px; line-height: 1.5; }
    .import-source { display: flex; align-items: center; gap: 9px; margin: 0 0 13px; padding: 9px 10px; border: 1px solid color-mix(in srgb, var(--rd-accent) 24%, var(--rd-line)); border-radius: 9px; background: color-mix(in srgb, var(--rd-accent) 6%, var(--rd-panel)); }
    .import-source ha-icon { --mdc-icon-size: 19px; color: var(--rd-accent); }
    .import-source strong, .import-source span { display: block; }
    .import-source strong { color: var(--rd-text); font-size: 12px; }
    .import-source span { margin-top: 2px; color: var(--rd-dim); font-size: 10px; }
    .import-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin: 14px 0; }
    .import-summary-item { padding: 9px 6px; border: 1px solid var(--rd-line); border-radius: 8px; background: color-mix(in srgb, var(--rd-deep) 72%, transparent); text-align: center; }
    .import-summary-item strong { display: block; color: var(--rd-text); font-size: 15px; font-variant-numeric: tabular-nums; }
    .import-summary-item span { display: block; margin-top: 2px; color: var(--rd-dim); font-size: 9px; text-transform: uppercase; }
    .import-note { display: flex; align-items: flex-start; gap: 8px; margin: 10px 0 0; padding: 10px; border-radius: 8px; background: color-mix(in srgb, var(--rd-accent) 7%, var(--rd-panel)); color: var(--rd-dim2); font-size: 11px; line-height: 1.45; }
    .import-note ha-icon { --mdc-icon-size: 17px; flex: 0 0 auto; color: var(--rd-accent); }
    .import-warning { display: flex; align-items: flex-start; gap: 8px; margin: 8px 0 0; padding: 9px 10px; border: 1px solid color-mix(in srgb, #f59e0b 28%, var(--rd-line)); border-radius: 8px; background: color-mix(in srgb, #f59e0b 7%, var(--rd-panel)); color: var(--rd-dim2); font-size: 11px; line-height: 1.45; }
    .import-warning ha-icon { --mdc-icon-size: 17px; flex: 0 0 auto; color: #d97706; }
    .remove-sensor-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px; margin-top: 4px; background: transparent; border: 1px solid var(--rd-line); border-radius: 6px; color: #ef4444; font-size: 12px; cursor: pointer; }
    .remove-sensor-btn:hover { border-color: #ef4444; }
    .remove-sensor-btn ha-icon { --mdc-icon-size: 16px; }
    .live-status { margin: 12px 0; padding: 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; }
    .live-status.occupied { border-color: color-mix(in srgb, #22c55e 55%, var(--rd-line)); }
    .live-status .header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .live-status .dot { width: 10px; height: 10px; border-radius: 50%; }
    .live-status .dot.active { background: #22c55e; animation: pulse 1s infinite; }
    .live-status .dot.inactive { background: var(--rd-dim); }
    .live-status .count { font-size: 24px; font-weight: bold; }
    .live-status .occupancy-note { display: flex; align-items: flex-start; gap: 6px; margin: 5px 0 10px; color: #22c55e; font-size: 10.5px; line-height: 1.35; }
    .live-status .occupancy-note ha-icon { flex: 0 0 auto; width: 14px; height: 14px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .zone-list { display: flex; flex-direction: column; gap: 6px; }
    .zone-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; cursor: pointer; }
    .zone-item:hover { border-color: var(--rd-line-strong); }
    .zone-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .zone-color { width: 14px; height: 14px; border-radius: 4px; }
    .zone-info { flex: 1; }
    .zone-name { font-size: 13px; color: var(--rd-text); font-weight: 500; }
    .zone-type { font-size: 11px; color: var(--rd-dim); }
    .zone-actions { display: flex; gap: 4px; }
    .edit-btn { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 4px; }
    .edit-btn:hover { color: #60a5fa; }
    .delete-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; }
    .delete-btn:hover { color: #f87171; }
    .zone-edit-form { background: var(--rd-deep); border: 1px solid #3b82f6; border-radius: 8px; padding: 12px; margin-top: 8px; }
    .zone-edit-form label { display: block; font-size: 11px; color: var(--rd-dim2); margin-bottom: 4px; text-transform: uppercase; }
    .zone-edit-form input { width: 100%; padding: 8px; background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 6px; color: var(--rd-text); font-size: 13px; margin-bottom: 10px; box-sizing: border-box; }
    .zone-edit-form input:focus { outline: none; border-color: #3b82f6; }
    .type-switch { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
    .type-switch button { flex: 1; min-width: 70px; padding: 6px 4px; border: 2px solid var(--rd-line); border-radius: 6px; background: var(--rd-panel); color: var(--rd-dim2); font-size: 11px; cursor: pointer; transition: all 0.15s; }
    .type-switch button.active { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .type-switch button.exclusion.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .type-switch button.entry.active { border-color: #10b981; background: rgba(16, 185, 129, 0.1); color: #10b981; }
    /* Direction toggle voor entry lijnen */
    .direction-toggle { display: flex; gap: 6px; margin-bottom: 12px; }
    .direction-toggle button { flex: 1; padding: 10px 8px; border: 2px solid var(--rd-line); border-radius: 8px; background: var(--rd-panel); color: var(--rd-dim2); font-size: 12px; cursor: pointer; transition: all 0.15s; }
    .direction-toggle button:hover { border-color: var(--rd-line-strong); }
    .direction-toggle button.active.in { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .help-text { font-size: 11px; color: var(--rd-dim); margin: 0 0 12px 0; line-height: 1.4; }
    /* Zone Type Picker Dialog */
    .zone-type-picker { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .zone-type-picker-content { background: var(--rd-panel); border-radius: 16px; padding: 24px; max-width: 320px; width: 90%; border: 1px solid var(--rd-line); }
    .zone-type-picker h3 { margin: 0 0 8px 0; font-size: 16px; color: var(--rd-text); }
    .zone-type-picker p { margin: 0 0 20px 0; font-size: 13px; color: var(--rd-dim2); }
    .zone-type-options { display: flex; flex-direction: column; gap: 10px; }
    .zone-type-option { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--rd-deep); border: 2px solid var(--rd-line); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
    .zone-type-option:hover:not(.disabled) { border-color: var(--rd-line-strong); background: var(--rd-panel); }
    .zone-type-option.disabled { opacity: 0.4; cursor: not-allowed; }
    .zone-type-option .icon { font-size: 24px; }
    .zone-type-option .info { flex: 1; }
    .zone-type-option .name { font-size: 14px; font-weight: 600; color: var(--rd-text); }
    .zone-type-option .desc { font-size: 11px; color: var(--rd-dim); }
    .zone-type-option .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .zone-type-option.detection .badge { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .zone-type-option.exclusion .badge { background: rgba(248, 113, 113, 0.2); color: #f87171; }
    .zone-type-option.entry .badge { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
    .zone-type-option.interference .badge { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .zone-type-option.disabled .badge { background: rgba(100, 116, 139, 0.18); color: var(--rd-dim); }
    .zone-type-picker-cancel { width: 100%; margin-top: 16px; padding: 12px; background: var(--rd-line); border: none; border-radius: 8px; color: var(--rd-dim2); font-size: 13px; cursor: pointer; }
    .zone-type-picker-cancel:hover { background: var(--rd-line-strong); color: var(--rd-text); }
    .edit-actions { display: flex; gap: 6px; }
    .edit-actions button { flex: 1; padding: 8px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; }
    .edit-actions .save-btn { background: #22c55e; color: white; }
    .edit-actions .cancel-btn { background: var(--rd-line); color: var(--rd-dim2); }
    .zone-type-select { display: flex; gap: 8px; margin-bottom: 12px; }
    .zone-type-btn { flex: 1; padding: 10px; border: 2px solid var(--rd-line); border-radius: 8px; background: var(--rd-deep); cursor: pointer; text-align: center; }
    .zone-type-btn.active { border-color: #4361ee; background: rgba(67, 97, 238, 0.1); }
    .zone-type-btn span { display: block; font-size: 12px; color: var(--rd-dim2); margin-top: 4px; }
    .zone-type-btn.active span { color: #4361ee; }
    @media (max-width: 1200px) { :host { grid-template-columns: 240px minmax(0, 1fr); height: auto; min-height: calc(100vh - 100px); } .sidebar-right { grid-column: 1 / -1; max-height: none; overflow-y: visible; } .canvas-area { min-height: 620px; } }
    @media (max-width: 760px) {
      :host { grid-template-columns: minmax(0, 1fr); padding: 10px; gap: 10px; }
      .sidebar { border-radius: 12px; box-shadow: none; }
      .canvas-area { min-height: min(72vh, 640px); order: 2; box-shadow: none; }
      .sidebar-right { grid-column: auto; order: 3; }
      .canvas-header { align-items: stretch; flex-direction: column; }
      .header-group { max-width: 100%; flex-wrap: wrap; }
      .header-group:last-child { justify-content: space-between; }
      .canvas-context { align-items: stretch; flex-direction: column; }
      .workspace-heading { padding: 0 0 9px; border: 0; border-bottom: 1px solid var(--rd-line); }
      .workspace-heading strong { max-width: 100%; }
      .mode-toggle { width: 100%; }
      .mode-btn { flex: 1; justify-content: center; }
      .mode-btn, .view-toggle-btn { padding: 9px 10px; }
      .tool-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .tool-btn { min-height: 62px; }
      .canvas-controls { bottom: 10px; left: 10px; }
      .zoom-value { display: none; }
      .dialog { width: calc(100vw - 32px); min-width: 0; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box; }
      .import-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (prefers-reduced-motion: reduce) {
      .room-item, .tool-btn, .mode-btn, .view-toggle-btn { transition: none; }
      .tool-btn:hover { transform: none; }
    }
    .view-toggle { display: flex; background: var(--rd-deep); border: 1px solid var(--rd-line); border-radius: 8px; overflow: hidden; }
    .view-toggle-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: transparent; border: none; color: var(--rd-dim2); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .view-toggle-btn:hover { background: rgba(67, 97, 238, 0.1); color: #4361ee; }
    .view-toggle-btn.active { background: #4361ee; color: white; }
    .view-toggle-btn ha-icon { --mdc-icon-size: 16px; }
    .canvas3d { flex: 1; display: block; cursor: grab; background: var(--rd-canvas); touch-action: none; }
    .canvas3d:active { cursor: grabbing; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    .view3d-info { position: absolute; bottom: 16px; left: 16px; display: flex; align-items: center; gap: 8px; background: var(--rd-panel); border: 1px solid var(--rd-line); border-radius: 9px; padding: 10px 12px; z-index: 10; font-size: 12px; color: var(--rd-dim2); box-shadow: 0 6px 18px color-mix(in srgb, #000 14%, transparent); }
    .view3d-info ha-icon { --mdc-icon-size: 18px; color: var(--rd-accent); }
    .view3d-controls { position: absolute; right: 16px; bottom: 16px; display: flex; gap: 6px; z-index: 11; padding: 6px; border: 1px solid var(--rd-line); border-radius: 10px; background: var(--rd-panel); box-shadow: 0 6px 18px color-mix(in srgb, #000 14%, transparent); }
    @media (max-width: 760px) {
      .canvas3d { touch-action: pan-y pinch-zoom; }
      .view3d-info { right: 12px; bottom: 72px; left: 12px; }
      .view3d-controls { right: 12px; bottom: 12px; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    void this._loadRooms().then(() => {
      for (const roomId of this._pendingAlignmentRevocationRoomIds) {
        this._clearRoomFusionSafetyState(roomId);
        void this._persistAlignmentRevocation(roomId);
      }
    });
    this._loadRadarProfiles();
    this._startTargetUpdates();
    this._startRuntimeUpdates();
    window.addEventListener('keydown', this._handleKeyDown);
    window.addEventListener('storage', this._handleAlignmentRevocationStorage);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopTargetUpdates();
    this._stopRuntimeUpdates();
    this._runtimeRequest += 1;
    this._runtimePending = false;
    this._runtimeReceivedAt = 0;
    if (this._runtimeExpiryTimer !== null) window.clearTimeout(this._runtimeExpiryTimer);
    this._runtimeExpiryTimer = null;
    if (this._sectorDebounceTimer !== null) window.clearTimeout(this._sectorDebounceTimer);
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('storage', this._handleAlignmentRevocationStorage);
  }

  private _markDirty() {
    this._editRevision += 1;
    this._dirty = true;
  }

  private _loadPendingAlignmentRevocations(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    const pending = new Set<string>();
    try {
      const stored = JSON.parse(window.localStorage.getItem(PENDING_ALIGNMENT_REVOCATIONS_KEY) || '[]');
      if (Array.isArray(stored)) {
        stored.filter(value => typeof value === 'string').forEach(roomId => pending.add(roomId));
      }
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key?.startsWith(PENDING_ALIGNMENT_REVOCATION_ROOM_PREFIX)) continue;
        try {
          pending.add(decodeURIComponent(key.slice(PENDING_ALIGNMENT_REVOCATION_ROOM_PREFIX.length)));
        } catch {
          // Ignore malformed keys owned by older or manually edited storage.
        }
      }
      for (const roomId of pending) {
        window.localStorage.setItem(
          `${PENDING_ALIGNMENT_REVOCATION_ROOM_PREFIX}${encodeURIComponent(roomId)}`,
          '1',
        );
      }
      window.localStorage.removeItem(PENDING_ALIGNMENT_REVOCATIONS_KEY);
    } catch {
      // Keep any entries that were read before storage became unavailable.
    }
    return pending;
  }

  private _setPendingAlignmentRevocation(roomId: string, pending: boolean): void {
    if (pending) this._pendingAlignmentRevocationRoomIds.add(roomId);
    else this._pendingAlignmentRevocationRoomIds.delete(roomId);
    if (typeof window === 'undefined') return;
    try {
      const key = `${PENDING_ALIGNMENT_REVOCATION_ROOM_PREFIX}${encodeURIComponent(roomId)}`;
      if (pending) window.localStorage.setItem(key, '1');
      else window.localStorage.removeItem(key);
    } catch {
      // The in-memory safety latch remains active when browser storage is unavailable.
    }
  }

  private _handleAlignmentRevocationStorage = (event: StorageEvent): void => {
    if (!event.key?.startsWith(PENDING_ALIGNMENT_REVOCATION_ROOM_PREFIX)) return;
    let roomId: string;
    try {
      roomId = decodeURIComponent(event.key.slice(PENDING_ALIGNMENT_REVOCATION_ROOM_PREFIX.length));
    } catch {
      return;
    }
    if (!roomId) return;
    if (event.newValue === null) {
      this._pendingAlignmentRevocationRoomIds.delete(roomId);
      this._alignmentRevocationBlockedRoomIds.delete(roomId);
    } else {
      this._pendingAlignmentRevocationRoomIds.add(roomId);
      this._clearRoomFusionSafetyState(roomId);
    }
    this.requestUpdate();
  };

  private _alignmentRevocationPending(roomId = this._selectedRoomId): boolean {
    return Boolean(roomId && this._pendingAlignmentRevocationRoomIds.has(roomId));
  }

  private _clearRoomFusionSafetyState(roomId: string): void {
    const defaults = createDefaultAggregation();
    this.rooms = this.rooms.map(room => room.id !== roomId
      ? room
      : roomWithFusionRevoked(room.aggregation ? room : { ...room, aggregation: defaults }));
    if (this._selectedRoomId === roomId) {
      this._aggregation = {
        ...this._aggregation,
        tracking: {
          ...this._aggregation.tracking,
          experimental_fusion: false,
          source_alignments: {},
        },
      };
      this._roomTrackEngine.reset();
      this._associationGate.reset();
      this._fusionAssociationAmbiguous = false;
    }
  }

  private _commitNumberInput(
    event: Event,
    fallback: number,
    minimum: number,
    maximum: number,
    allowEmpty = false,
  ): number {
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();
    if (allowEmpty && raw === '') return 0;
    const parsed = Number(raw);
    const value = Number.isFinite(parsed)
      ? Math.min(maximum, Math.max(minimum, parsed))
      : fallback;
    input.value = String(value);
    return value;
  }

  private get _selectedSensor(): SensorInstance | null {
    return this._selectedSensorIndex !== null ? this._sensors[this._selectedSensorIndex] ?? null : null;
  }

  private _sensorLabel(s: SensorInstance, index: number): string {
    if (s.deviceId) {
      return this._findRadarDevice(s.deviceId)?.name
        || s.deviceId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return `Sensor ${index + 1}`;
  }

  private _entityLabel(entityId: string): string {
    const state = this.hass?.states?.[entityId];
    return String(state?.attributes?.friendly_name || entityId.split('.', 2)[1] || entityId)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  private _sensorColor(index: number): string {
    const colors = ['#3b82f6', '#a855f7', '#f59e0b', '#14b8a6'];
    return colors[index % colors.length];
  }

  private _updateSensor(index: number, patch: Partial<SensorInstance>) {
    const previous = this._sensors[index];
    if (!previous) return;
    let next = { ...previous, ...patch };
    const hardwareChanged = previous.deviceId !== next.deviceId
      || previous.mountingMode !== next.mountingMode;
    if (hardwareChanged) {
      next = { ...next, zMapping: { mode: 'raw', verified: false } };
    }
    const placementChanged = previous.x !== next.x
      || previous.y !== next.y
      || previous.rotation !== next.rotation;
    if (
      placementChanged
      && this._calibration.sensorId === previous.id
      && this._calibration.corners.length === 4
    ) {
      this._calibration = {
        ...this._calibration,
        corners: reprojectRadarCoverage(
          this._calibration.corners,
          previous,
          next,
          this._coordinateProjection(previous),
        ),
      };
    }
    this._sensors = this._sensors.map((sensor, i) => i === index ? next : sensor);
    if (placementChanged || previous.heightMm !== next.heightMm || hardwareChanged) {
      this._aggregation = {
        ...this._aggregation,
        tracking: { ...this._aggregation.tracking, experimental_fusion: false },
      };
      this._alignmentSamples = [];
      this._alignmentSampleFingerprint = null;
      this._alignmentFeedback = panelText(this.hass, 'Sensor placement changed. Repeat the neighbouring overlap alignment before enabling fusion.');
    }
    this._markDirty();
  }

  private _radarIdentity(deviceId: string | null): string {
    if (!deviceId || !this.hass) return '';
    const parts = [deviceId];
    Object.entries(this.hass.states).forEach(([entityId, state]: [string, any]) => {
      if (entityId.includes(`.${deviceId}_`)) {
        parts.push(String(state?.attributes?.friendly_name || ''));
      }
    });
    return parts.join(' ').toLowerCase();
  }

  private _radarProductFamily(deviceId: string | null): RadarProductFamily {
    const identity = this._radarIdentity(deviceId);
    if (/ceil[\s_-]*sense|ceilsense/.test(identity)) return 'ceilsense';
    if (/ultimate[\s_-]*sensor|ultimatesensor/.test(identity)) return 'ultimate-sensor';
    return 'unknown';
  }

  private _recommendedMountingMode(deviceId: string | null): SensorMountingMode {
    return this._findRadarDevice(deviceId)?.profile.mountingMode
      || (this._radarProductFamily(deviceId) === 'ceilsense' ? 'ceiling' : 'wall');
  }

  private _findRadarDevice(deviceId: string | null): RadarDevice | undefined {
    if (!deviceId) return undefined;
    return this._radarDevices.find(device =>
      device.id === deviceId
      || device.entityPrefix === deviceId
      || device.aliases.includes(deviceId));
  }

  private _coordinateProjection(sensor: SensorInstance): RadarCoordinateProjection {
    const profile = this._findRadarDevice(sensor.deviceId)?.profile;
    // A saved room may intentionally predate or differ from the newly
    // reported firmware mounting. Keep its geometry stable until the user
    // accepts the explicit "Use firmware mounting" action in the UI.
    if (profile?.mountingMode === sensor.mountingMode) {
      return profile.coordinateProjection;
    }
    return sensor.mountingMode === 'ceiling' ? 'floor_xy' : 'forward_xy';
  }

  private _coverageRadius(sensor: SensorInstance): number {
    if (sensor.mountingMode !== 'ceiling') return sensor.range;
    const halfFov = Math.min(85, Math.max(15, sensor.fov / 2)) * Math.PI / 180;
    const projectedRadius = sensor.heightMm * Math.tan(halfFov);
    return Math.min(sensor.range, Math.max(500, projectedRadius));
  }

  private _effectiveSensorHeightMm(sensor: SensorInstance): number {
    const radar = this._findRadarDevice(sensor.deviceId);
    const entityId = radar?.profile.installationHeightEntityId ?? null;
    const live = entityId
      ? parseRadarInstallationNumber(
        this.hass.states[entityId]?.state,
        LD2460_HEIGHT_RANGE.minimum,
        LD2460_HEIGHT_RANGE.maximum,
      )
      : null;
    return live !== null ? Math.round(live * 1000) : sensor.heightMm;
  }

  private _radarLinkedRoomName(deviceId: string): string | null {
    const physicalId = this._findRadarDevice(deviceId)?.id || deviceId;
    for (const room of this.rooms) {
      if (room.id === this._selectedRoomId) continue;
      const linked = (room.sensors || []).some((source) => {
        if (!source.deviceId) return false;
        return (this._findRadarDevice(source.deviceId)?.id || source.deviceId) === physicalId;
      });
      if (linked) return room.name;
    }
    return null;
  }

  private _radarDetectionSector(radar: RadarDevice | undefined): {
    distanceM: number;
    startAngleDeg: number;
    endAngleDeg: number;
  } | null {
    if (!radar || radar.profile.radarModel !== 'ld2460') return null;
    const distanceM = this._sectorValue(
      radar.profile.detectionDistanceEntityId,
      radar.profile.detectionDistanceM,
    );
    const startAngleDeg = this._sectorValue(
      radar.profile.detectionStartAngleEntityId,
      radar.profile.detectionStartAngleDeg,
    );
    const endAngleDeg = this._sectorValue(
      radar.profile.detectionEndAngleEntityId,
      radar.profile.detectionEndAngleDeg,
    );
    if (distanceM === null || startAngleDeg === null || endAngleDeg === null) return null;
    const sector = { distanceM, startAngleDeg, endAngleDeg };
    return validateRadarDetectionSector(sector) === 'ready' ? sector : null;
  }

  private _selectRadarDevice(index: number, deviceId: string | null) {
    const sensor = this._sensors[index];
    if (!sensor) return;
    if (deviceId && this._sensors.some((item, itemIndex) => itemIndex !== index && item.deviceId === deviceId)) {
      this._alignmentFeedback = panelText(this.hass, 'This radar is already placed in this room. Choose another device.');
      return;
    }
    const linkedRoom = deviceId ? this._radarLinkedRoomName(deviceId) : null;
    if (linkedRoom) {
      this._alignmentFeedback = panelText(
        this.hass,
        'This radar is already linked to {room}. Unlink it there before using it in this room.',
        { room: linkedRoom },
      );
      return;
    }
    const radar = this._findRadarDevice(deviceId);
    const isFirstLink = sensor.deviceId === null && radar !== undefined;
    if (!isFirstLink) {
      this._updateSensor(index, { deviceId });
      return;
    }
    // Firmware defaults are suggestions for a newly linked radar only. A
    // saved room or a user-adjusted radar is never rewritten during reload.
    this._updateSensor(index, {
      deviceId: radar.id,
      mountingMode: radar.profile.mountingMode,
      heightMm: radar.profile.installationHeightM !== null
        ? Math.round(radar.profile.installationHeightM * 1000)
        : radar.profile.mountingHeightMm ?? sensor.heightMm,
      range: radar.profile.maximumRangeMm ?? sensor.range,
      fov: radar.profile.fieldOfViewDeg ?? sensor.fov,
    });
  }

  private _setSensorMountingMode(index: number, mountingMode: SensorMountingMode) {
    const sensor = this._sensors[index];
    if (!sensor) return;
    this._updateSensor(index, {
      mountingMode,
      heightMm: mountingMode === 'ceiling'
        ? Math.max(sensor.heightMm || 0, 2400)
        : Math.min(sensor.heightMm || 1500, 2200),
    });
  }

  private _requiredHardwareMode(radar: RadarDevice | undefined): 'top' | 'side' | null {
    if (!radar) return null;
    const sensor = this._sensors.find(source =>
      this._findRadarDevice(source.deviceId)?.id === radar.id);
    return expectedRadarHardwareMode(sensor?.mountingMode, radar.profile.requiredInstallationMode);
  }

  private _hardwareModeMismatch(radar: RadarDevice | undefined): boolean {
    if (!radar || radar.profile.hardwareModeCapability !== 'top_or_side') return false;
    const required = this._requiredHardwareMode(radar);
    const current = this._currentHardwareMode(radar);
    return Boolean(required && current && required !== current);
  }

  private _currentHardwareMode(radar: RadarDevice): 'top' | 'side' | null {
    const reportedEntityId = radar.profile.reportedInstallationModeEntityId;
    const state = reportedEntityId
      ? String(this.hass.states[reportedEntityId]?.state || '').trim().toLowerCase()
      : '';
    if (reportedEntityId) return state === 'top' || state === 'side' ? state : null;
    return radar.profile.currentHardwareMode;
  }

  private _ld2460InstallationReady(radar: RadarDevice | undefined): boolean {
    if (!radar || !['ld2460', 'ld6002b'].includes(radar.profile.radarModel)) return true;
    const currentMode = this._currentHardwareMode(radar);
    const requiredMode = this._requiredHardwareMode(radar);
    if (requiredMode && (!currentMode || currentMode !== requiredMode)) return false;
    if (radar.profile.radarModel === 'ld6002b') return true;
    if (currentMode === 'top') return true;
    const height = radar.profile.installationHeightEntityId;
    const angle = radar.profile.installationAngleEntityId;
    return Boolean(
      radar.profile.reportedInstallationModeEntityId
      && height && angle
      && radarInstallationEntityStatus(this.hass.states[height]) === 'ready'
      && radarInstallationEntityStatus(this.hass.states[angle]) === 'ready',
    );
  }

  private async _applyRequiredHardwareMode(radar: RadarDevice): Promise<void> {
    const entityId = radar.profile.installationModeEntityId;
    const required = this._requiredHardwareMode(radar);
    if (!entityId || !required || this._changingHardwareMode) return;
    const originRoomId = this._selectedRoomId;
    const originSourceId = this._sensors.find(sensor =>
      this._findRadarDevice(sensor.deviceId)?.id === radar.id)?.id || null;
    const accepted = confirm(panelText(
      this.hass,
      '{name} is currently set to {current}. Change the radar hardware to {required} mode for this {mounting} mounting?',
      {
        name: radar.name,
        current: this._currentHardwareMode(radar) || panelText(this.hass, 'an unknown mode'),
        required: panelText(this.hass, required),
        mounting: panelText(this.hass, radar.profile.mountingMode),
      },
    ));
    if (!accepted) return;

    const option = radar.profile.installationModeOptions.find(
      candidate => candidate.toLowerCase() === required,
    ) || required;
    this._changingHardwareMode = true;
    try {
      await performConfirmedRadarUpdate(
        () => this.hass.callService('select', 'select_option', {
          entity_id: entityId,
          option,
        }),
        () => this.hass.states[radar.profile.reportedInstallationModeEntityId || entityId],
        state => state.trim().toLowerCase() === required,
      );
      this._radarDevices = this._radarDevices.map(device => device.id === radar.id
        ? { ...device, profile: { ...device.profile, currentHardwareMode: required } }
        : device);
      this._invalidateOriginRoomAfterInstallationChange(originRoomId, originSourceId);
      await this._loadRadarProfiles();
    } catch {
      alert(panelText(this.hass, 'Could not set {name} to {mode} mode.', {
        name: radar.name,
        mode: panelText(this.hass, required),
      }));
    } finally {
      this._changingHardwareMode = false;
    }
  }

  private _text(key: string, variables: Record<string, string | number> = {}): string {
    return settingsText(this.hass, key, variables);
  }

  private _installationDraft(entityId: string, fallback: number | null): string {
    return Object.prototype.hasOwnProperty.call(this._installationDrafts, entityId)
      ? this._installationDrafts[entityId]
      : fallback === null ? '' : String(fallback);
  }

  private _setInstallationDraft(entityId: string, value: string): void {
    this._installationDrafts = { ...this._installationDrafts, [entityId]: value };
    const feedback = { ...this._installationFeedback };
    delete feedback[entityId];
    this._installationFeedback = feedback;
  }

  private _setInstallationFeedback(entityId: string, tone: 'success' | 'error', text: string): void {
    this._installationFeedback = {
      ...this._installationFeedback,
      [entityId]: { tone, text },
    };
  }

  private _liveInstallationValue(
    entityId: string | null,
    minimum: number,
    maximum: number,
    fallback: number | null,
  ): number | null {
    if (!entityId) return fallback;
    return parseRadarInstallationNumber(
      this.hass.states[entityId]?.state,
      minimum,
      maximum,
    ) ?? fallback;
  }

  private async _applyRadarInstallationValue(
    radar: RadarDevice,
    sensorIndex: number,
    kind: 'height' | 'angle',
  ): Promise<void> {
    const isHeight = kind === 'height';
    const entityId = isHeight
      ? radar.profile.installationHeightEntityId
      : radar.profile.installationAngleEntityId;
    if (!entityId || this._installationUpdateEntityId) return;
    const originRoomId = this._selectedRoomId;
    const originSourceId = this._sensors[sensorIndex]?.id || null;

    const range = isHeight ? LD2460_HEIGHT_RANGE : LD2460_ANGLE_RANGE;
    const fallback = isHeight
      ? radar.profile.installationHeightM
      : radar.profile.installationAngleDeg;
    const requested = parseRadarInstallationNumber(
      this._installationDraft(entityId, fallback),
      range.minimum,
      range.maximum,
    );
    if (requested === null) {
      this._setInstallationFeedback(
        entityId,
        'error',
        this._text(isHeight
          ? 'radar.installation.error.height_range'
          : 'radar.installation.error.angle_range'),
      );
      return;
    }

    const state = this.hass.states[entityId];
    if (radarInstallationEntityStatus(state) !== 'ready') {
      this._setInstallationFeedback(
        entityId,
        'error',
        this._text('radar.installation.error.unavailable'),
      );
      return;
    }

    const current = parseRadarInstallationNumber(state.state, range.minimum, range.maximum);
    if (current !== null && Math.abs(current - requested) < range.step / 2) {
      if (isHeight) this._updateSensor(sensorIndex, { heightMm: Math.round(requested * 1000) });
      this._setInstallationFeedback(entityId, 'success', this._text('radar.installation.saved'));
      return;
    }

    this._installationUpdateEntityId = entityId;
    const feedback = { ...this._installationFeedback };
    delete feedback[entityId];
    this._installationFeedback = feedback;
    try {
      await performConfirmedRadarUpdate(
        () => this.hass.callService('number', 'set_value', {
          entity_id: entityId,
          value: requested,
        }),
        () => this.hass.states[entityId],
        nextState => {
          const confirmed = parseRadarInstallationNumber(nextState, range.minimum, range.maximum);
          return confirmed !== null && Math.abs(confirmed - requested) < range.step / 2;
        },
      );
      this._radarDevices = this._radarDevices.map(device => device.id === radar.id
        ? {
          ...device,
          profile: {
            ...device.profile,
            ...(isHeight
              ? { installationHeightM: requested }
              : { installationAngleDeg: requested }),
          },
        }
        : device);
      const drafts = { ...this._installationDrafts };
      delete drafts[entityId];
      this._installationDrafts = drafts;
      this._invalidateOriginRoomAfterInstallationChange(
        originRoomId,
        originSourceId,
        isHeight ? Math.round(requested * 1000) : null,
      );
      this._setInstallationFeedback(entityId, 'success', this._text('radar.installation.saved'));
      await this._loadRadarProfiles();
    } catch (error: any) {
      const message = error instanceof RadarInstallationUpdateError && error.kind === 'timeout'
        ? this._text('radar.installation.error.timeout')
        : this._text('radar.installation.error.service');
      this._setInstallationFeedback(entityId, 'error', message);
    } finally {
      this._installationUpdateEntityId = null;
    }
  }

  private _sectorValue(entityId: string | null, fallback: number | null): number | null {
    if (!entityId) return fallback;
    const draft = this._sectorDrafts[entityId];
    if (draft !== undefined) {
      const value = Number(draft);
      return Number.isFinite(value) ? value : null;
    }
    const entity = this.hass.states[entityId];
    if (!entity) return fallback;
    if (radarInstallationEntityStatus(entity) !== 'ready') return null;
    const value = Number(entity.state);
    return Number.isFinite(value) ? value : fallback;
  }

  private _setSectorDraft(radar: RadarDevice, entityId: string, value: string): void {
    this._sectorDrafts = { ...this._sectorDrafts, [entityId]: value };
    this._sectorFeedback = null;
    if (this._sectorDebounceTimer !== null) window.clearTimeout(this._sectorDebounceTimer);
    this._sectorDebounceTimer = window.setTimeout(() => {
      this._sectorDebounceTimer = null;
      const numericValue = Number(this._sectorDrafts[entityId]);
      if (Number.isFinite(numericValue)) void this._applySectorValue(radar, entityId, numericValue);
    }, 650);
  }

  private async _applySectorValue(
    radar: RadarDevice,
    entityId: string,
    value: number,
  ): Promise<void> {
    if (this._sectorUpdateEntityId) {
      this._queuedSectorChange = { radar, entityId, value };
      return;
    }
    const distance = entityId === radar.profile.detectionDistanceEntityId
      ? value
      : this._sectorValue(radar.profile.detectionDistanceEntityId, radar.profile.detectionDistanceM);
    const start = entityId === radar.profile.detectionStartAngleEntityId
      ? value
      : this._sectorValue(radar.profile.detectionStartAngleEntityId, radar.profile.detectionStartAngleDeg);
    const end = entityId === radar.profile.detectionEndAngleEntityId
      ? value
      : this._sectorValue(radar.profile.detectionEndAngleEntityId, radar.profile.detectionEndAngleDeg);
    if (distance === null || start === null || end === null) {
      this._sectorFeedback = { tone: 'error', text: this._text('radar.sector.error.unavailable') };
      return;
    }
    const validation = validateRadarDetectionSector({
      distanceM: distance,
      startAngleDeg: start,
      endAngleDeg: end,
    });
    if (validation !== 'ready') {
      this._sectorFeedback = {
        tone: 'error',
        text: this._text(validation === 'angle_order'
          ? 'radar.sector.error.angle_order'
          : 'radar.sector.error.range'),
      };
      return;
    }
    const entity = this.hass.states[entityId];
    if (radarInstallationEntityStatus(entity) !== 'ready') {
      this._sectorFeedback = { tone: 'error', text: this._text('radar.sector.error.unavailable') };
      return;
    }
    if (Math.abs(Number(entity.state) - value) < 0.05) {
      const drafts = { ...this._sectorDrafts };
      delete drafts[entityId];
      this._sectorDrafts = drafts;
      return;
    }

    this._sectorUpdateEntityId = entityId;
    try {
      await performConfirmedRadarUpdate(
        () => this.hass.callService('number', 'set_value', { entity_id: entityId, value }),
        () => this.hass.states[entityId],
        state => Math.abs(Number(state) - value) < 0.05,
        12_000,
      );
      const drafts = { ...this._sectorDrafts };
      delete drafts[entityId];
      this._sectorDrafts = drafts;
      this._sectorFeedback = { tone: 'success', text: this._text('radar.sector.saved') };
      await this._loadRadarProfiles();
    } catch (error) {
      this._sectorFeedback = {
        tone: 'error',
        text: this._text(error instanceof RadarInstallationUpdateError && error.kind === 'timeout'
          ? 'radar.sector.error.timeout'
          : 'radar.sector.error.service'),
      };
    } finally {
      this._sectorUpdateEntityId = null;
      const queued = this._queuedSectorChange;
      this._queuedSectorChange = null;
      if (queued) void this._applySectorValue(queued.radar, queued.entityId, queued.value);
    }
  }

  private _addSensor() {
    // Place a new sensor at the room centroid
    let cx = 0, cy = 0;
    if (this._roomPoints.length >= 3) {
      cx = this._roomPoints.reduce((sum, pt) => sum + pt.x, 0) / this._roomPoints.length;
      cy = this._roomPoints.reduce((sum, pt) => sum + pt.y, 0) / this._roomPoints.length;
    }
    const sensor: SensorInstance = {
      id: `sensor_${Date.now()}`,
      deviceId: null,
      x: Math.round(cx / 100) * 100,
      y: Math.round(cy / 100) * 100,
      rotation: 0,
      range: 6000,
      fov: 120,
      heightMm: 1500,
      mountingMode: 'wall',
    };
    this._sensors = [...this._sensors, sensor];
    this._selectedSensorIndex = this._sensors.length - 1;
    this._toolMode = 'sensor';
    this._markDirty();
  }

  private _removeSensor(index: number) {
    const removed = this._sensors[index];
    this._sensors = this._sensors.filter((_, i) => i !== index);
    if (removed) {
      delete this._targetTrails[removed.id];
      const remaining = { ...this._liveTargets };
      delete remaining[removed.id];
      this._liveTargets = remaining;
      // Removing a source must remove its owned zones. Turning them into
      // shared zones would silently broaden exclusions to every radar.
      this._zones = this._zones.filter(z => z.sensorId !== removed.id);
      this._aggregation = {
        ...this._aggregation,
        presence: {
          ...this._aggregation.presence,
          source_ids: this._aggregation.presence.source_ids.filter(id => id !== removed.id),
        },
        climate: Object.fromEntries(
          Object.entries(this._aggregation.climate).map(([metric, setting]) => [
            metric,
            setting.primary_source_id === removed.id
              ? { ...setting, primary_source_id: null }
              : setting,
          ]),
        ) as RoomAggregationSettings['climate'],
        tracking: {
          ...this._aggregation.tracking,
          experimental_fusion: false,
          source_alignments: Object.fromEntries(
            Object.entries(this._aggregation.tracking.source_alignments)
              .filter(([sourceId]) => sourceId !== removed.id),
          ),
        },
      };
    }
    this._selectedSensorIndex = this._sensors.length > 0 ? 0 : null;
    this._markDirty();
  }

  private _setDesignMode(mode: DesignMode) {
    if (this._designMode === mode) return;
    this._designMode = mode;
    this._toolMode = 'select';
    this._resetTransientState();
  }

  private _setToolMode(mode: ToolMode) {
    this._toolMode = mode;
    this._resetTransientState();
    if (mode === 'mirror') this._autoZoom(true);
  }

  private _resetTransientState() {
    this._pendingStart = null;
    this._previewPoint = null;
    this._wallHoverPreview = null;
    this._doorWindowPreview = null;
    this._selectedFurnitureType = null;
    this._selectedFurnitureIndex = null;
    this._drawingZone = [];
    this._zoneMidpointPreview = null;
  }

  private _undoLastWallPoint() {
    if (this._roomPoints.length > 0) {
      this._roomPoints = this._roomPoints.slice(0, -1);
      this._pendingStart = this._roomPoints.length > 0 ? this._roomPoints[this._roomPoints.length - 1] : null;
      this._markDirty();
    }
  }

  private _clearWalls() {
    if (!confirm(panelText(this.hass, 'Clear all walls of this room?'))) return;
    this._roomPoints = [];
    this._pendingStart = null;
    this._previewPoint = null;
    this._markDirty();
  }

  private _addPointOnWall(wallIndex: number, position: number, startDragging = false) {
    if (wallIndex >= this._roomPoints.length) return;
    const p1 = this._roomPoints[wallIndex];
    const p2 = this._roomPoints[(wallIndex + 1) % this._roomPoints.length];
    const newPoint = this._snapToGrid({
      x: p1.x + (p2.x - p1.x) * position,
      y: p1.y + (p2.y - p1.y) * position,
    });
    const newPoints = [...this._roomPoints];
    newPoints.splice(wallIndex + 1, 0, newPoint);
    this._roomPoints = newPoints;
    this._markDirty();
    if (startDragging) this._draggingPointIndex = wallIndex + 1;
    this._wallHoverPreview = null;
  }

  private _deleteWallPoint(index: number) {
    if (this._roomPoints.length <= 3) return;
    this._roomPoints = this._roomPoints.filter((_, i) => i !== index);
    this._draggingPointIndex = null;
    this._markDirty();
  }

  private _findNearestWall(pt: Point): { wallIndex: number; position: number; distance: number } | null {
    if (this._roomPoints.length < 3) return null;
    let nearestWall = -1, nearestDist = Infinity, nearestPos = 0;
    for (let i = 0; i < this._roomPoints.length; i++) {
      const p1 = this._roomPoints[i];
      const p2 = this._roomPoints[(i + 1) % this._roomPoints.length];
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const wallLength = Math.hypot(dx, dy);
      if (wallLength === 0) continue;
      const t = Math.max(0.05, Math.min(0.95, ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / (wallLength * wallLength)));
      const projX = p1.x + t * dx, projY = p1.y + t * dy;
      const dist = Math.hypot(pt.x - projX, pt.y - projY);
      if (dist < nearestDist) { nearestDist = dist; nearestWall = i; nearestPos = t; }
    }
    return nearestWall >= 0 ? { wallIndex: nearestWall, position: nearestPos, distance: nearestDist } : null;
  }

  private _calculateArea(): number {
    if (this._roomPoints.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < this._roomPoints.length; i++) {
      const j = (i + 1) % this._roomPoints.length;
      area += this._roomPoints[i].x * this._roomPoints[j].y;
      area -= this._roomPoints[j].x * this._roomPoints[i].y;
    }
    return Math.abs(area / 2) / 1000000;
  }

  // Furniture helpers
  private _placeFurniture() {
    if (!this._selectedFurnitureType || !this._pendingStart) return;
    this._furniture = [...this._furniture, {
      id: `furniture_${Date.now()}`,
      type: this._selectedFurnitureType.id,
      name: this._selectedFurnitureType.name,
      x: this._pendingStart.x,
      y: this._pendingStart.y,
      width: this._furnitureWidth,
      height: this._furnitureHeight,
      rotation: 0,
    }];
    this._markDirty();
    this._showFurnitureDialog = false;
    this._pendingStart = null;
  }

  private _deleteFurniture(index: number) {
    this._furniture = this._furniture.filter((_, i) => i !== index);
    this._selectedFurnitureIndex = null;
    this._markDirty();
  }

  private _rotateFurniture(index: number) {
    this._furniture = this._furniture.map((f, i) =>
      i === index ? { ...f, rotation: ((f.rotation || 0) + 90) % 360 } : f
    );
    this._markDirty();
  }

  private _updateSelectedFurniture(patch: Partial<LocalFurnitureItem>) {
    if (this._selectedFurnitureIndex === null) return;
    this._furniture = this._furniture.map((f, i) =>
      i === this._selectedFurnitureIndex ? { ...f, ...patch } : f
    );
    this._markDirty();
  }

  // Door/window helpers
  private _addDoor() {
    if (this._selectedWallIndex === null || !this._pendingStart) return;
    this._doors = [...this._doors, {
      id: 'door_' + Date.now(),
      wallIndex: this._selectedWallIndex,
      position: this._pendingStart.x,
      width: this._doorWidth,
      openDirection: this._doorOpenDirection,
      openSide: this._doorOpenSide,
    }];
    this._markDirty();
    this._hideDoorDialog();
  }

  private _hideDoorDialog() {
    this._showDoorDialog = false;
    this._selectedWallIndex = null;
    this._pendingStart = null;
    this._editingDoorIndex = null;
  }

  private _deleteDoor(index: number) {
    this._doors = this._doors.filter((_, i) => i !== index);
    this._markDirty();
  }

  private _editDoor(index: number) {
    const door = this._doors[index];
    if (!door) return;
    this._editingDoorIndex = index;
    this._doorWidth = door.width;
    this._doorOpenDirection = door.openDirection;
    this._doorOpenSide = door.openSide;
    this._showDoorDialog = true;
  }

  private _saveDoorEdit() {
    if (this._editingDoorIndex === null) return;
    this._doors = this._doors.map((d, i) =>
      i === this._editingDoorIndex
        ? { ...d, width: this._doorWidth, openDirection: this._doorOpenDirection, openSide: this._doorOpenSide }
        : d
    );
    this._markDirty();
    this._editingDoorIndex = null;
    this._showDoorDialog = false;
  }

  private _addWindow() {
    if (this._selectedWallIndex === null || !this._pendingStart) return;
    this._windows = [...this._windows, {
      id: 'window_' + Date.now(),
      wallIndex: this._selectedWallIndex,
      position: this._pendingStart.x,
      width: this._windowWidth,
      height: this._windowHeight,
      windowType: this._windowType,
    }];
    this._markDirty();
    this._hideWindowDialog();
  }

  private _hideWindowDialog() {
    this._showWindowDialog = false;
    this._selectedWallIndex = null;
    this._pendingStart = null;
    this._editingWindowIndex = null;
  }

  private _deleteWindow(index: number) {
    this._windows = this._windows.filter((_, i) => i !== index);
    this._markDirty();
  }

  private _editWindow(index: number) {
    const win = this._windows[index];
    if (!win) return;
    this._editingWindowIndex = index;
    this._windowWidth = win.width;
    this._windowHeight = win.height;
    this._windowType = win.windowType;
    this._showWindowDialog = true;
  }

  private _saveWindowEdit() {
    if (this._editingWindowIndex === null) return;
    this._windows = this._windows.map((w, i) =>
      i === this._editingWindowIndex
        ? { ...w, width: this._windowWidth, height: this._windowHeight, windowType: this._windowType }
        : w
    );
    this._markDirty();
    this._editingWindowIndex = null;
    this._showWindowDialog = false;
  }

  private _addMirror() {
    if (this._selectedWallIndex === null || !this._pendingStart) return;
    this._mirrors = [...this._mirrors, {
      id: `mirror_${Date.now()}`,
      wallIndex: this._selectedWallIndex,
      position: this._pendingStart.x,
      width: this._mirrorWidth,
      height: this._mirrorHeight,
      protectionEnabled: this._mirrorProtectionEnabled,
      reflectionDepthMm: this._mirrorReflectionDepthMm,
    }];
    this._markDirty();
    this._hideMirrorDialog();
    this._autoZoom(true);
  }

  private _hideMirrorDialog() {
    this._showMirrorDialog = false;
    this._selectedWallIndex = null;
    this._pendingStart = null;
    this._editingMirrorIndex = null;
  }

  private _deleteMirror(index: number) {
    this._mirrors = this._mirrors.filter((_, itemIndex) => itemIndex !== index);
    this._markDirty();
  }

  private _editMirror(index: number) {
    const mirror = this._mirrors[index];
    if (!mirror) return;
    this._editingMirrorIndex = index;
    this._mirrorWidth = mirror.width;
    this._mirrorHeight = mirror.height;
    this._mirrorProtectionEnabled = mirror.protectionEnabled;
    this._mirrorReflectionDepthMm = mirror.reflectionDepthMm;
    this._showMirrorDialog = true;
  }

  private _saveMirrorEdit() {
    if (this._editingMirrorIndex === null) return;
    this._mirrors = this._mirrors.map((mirror, index) => index === this._editingMirrorIndex ? {
      ...mirror,
      width: this._mirrorWidth,
      height: this._mirrorHeight,
      protectionEnabled: this._mirrorProtectionEnabled,
      reflectionDepthMm: this._mirrorReflectionDepthMm,
    } : mirror);
    this._markDirty();
    this._hideMirrorDialog();
    this._autoZoom(true);
  }

  // Room management
  private async _createNewRoom() {
    if (!this._newRoomName.trim()) return;
    let walls: Array<{x1: number; y1: number; x2: number; y2: number}> = [];
    if (this._newRoomWidth > 0 && this._newRoomLength > 0) {
      const w = this._newRoomWidth * 10, l = this._newRoomLength * 10;
      const halfW = w / 2, halfL = l / 2;
      walls = [
        { x1: -halfW, y1: -halfL, x2: halfW, y2: -halfL },
        { x1: halfW, y1: -halfL, x2: halfW, y2: halfL },
        { x1: halfW, y1: halfL, x2: -halfW, y2: halfL },
        { x1: -halfW, y1: halfL, x2: -halfW, y2: -halfL },
      ];
    }
    const newRoom: Room = {
      id: 'room_' + Date.now(),
      name: this._newRoomName.trim(),
      walls,
      furniture: [],
      devices: [],
      zones: [],
      sensors: [],
      aggregation: createDefaultAggregation(),
      schema_version: 2,
    };
    try {
      const result = await this.hass.callWS<{ room: Room }>({
        type: 'smarthomeshop/room/save',
        create: true,
        room: newRoom,
      });
      this.rooms = [...this.rooms, result.room];
      this._selectRoom(result.room.id);
      this._showNewRoomDialog = false;
    } catch (err) {
      console.error('Failed to create room:', err);
      window.alert(panelText(this.hass, 'Could not create the room. Administrator rights are required and the name must be filled in.'));
    }
  }

  private _currentRoomSnapshot(room: Room): Room {
    const firstSensor = this._sensors[0];
    const sensor = firstSensor ? {
      x: firstSensor.x,
      y: firstSensor.y,
      rotation: firstSensor.rotation,
      range: firstSensor.range,
      fov: firstSensor.fov,
      deviceId: firstSensor.deviceId,
      heightMm: firstSensor.heightMm,
      mountingMode: firstSensor.mountingMode,
    } : null;
    const walls = this._roomPoints.map((point, index) => {
      const next = this._roomPoints[(index + 1) % this._roomPoints.length];
      return { x1: point.x, y1: point.y, x2: next.x, y2: next.y };
    });
    const furniture = this._furniture.map(item => ({
      id: item.id,
      typeId: item.type,
      name: item.name,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      rotationDeg: item.rotation,
    }));

    const sensors = this._sensors.map((source) => {
      const { zMapping, ...serializableSource } = source;
      const radar = this._findRadarDevice(source.deviceId);
      const trackingSource = radar ? this._trackingSource(source) : source;
      const stored = room.sensors?.find(item => item.id === source.id);
      const configurationChanged = !stored
        || stored.deviceId !== source.deviceId
        || Number(stored.x) !== source.x
        || Number(stored.y) !== source.y
        || Number(stored.rotation ?? 0) !== source.rotation
        || Number(stored.heightMm ?? 2000) !== source.heightMm
        || stored.mountingMode !== source.mountingMode;
      const sourceVersion = Math.max(1, Number(stored?.source_version ?? source.sourceVersion ?? 1));
      const discoveredModules = radar
        ? Array.from(new Set([
            radar.profile.radarModel,
            ...radar.profile.supplementaryPresenceSensors.flatMap(entityId =>
              ['ld2412', 'ld2450', 'ld2460', 'ld6002b'].filter(module => entityId.toLowerCase().includes(module))),
          ].filter(module => module && module !== 'unknown')))
        : null;
      return {
        ...serializableSource,
        z_mapping: zMapping ? {
          mode: zMapping.mode,
          verified: zMapping.verified,
          ...(zMapping.verificationFingerprint
            ? { verification_fingerprint: zMapping.verificationFingerprint }
            : {}),
        } : { mode: 'raw', verified: false },
        source_version: configurationChanged && stored ? sourceVersion + 1 : sourceVersion,
        configured_at: configurationChanged || !stored?.configured_at
          ? new Date().toISOString()
          : stored.configured_at,
        x_m: Number((source.x / 1000).toFixed(4)),
        y_m: Number((source.y / 1000).toFixed(4)),
        height_m: Number((source.heightMm / 1000).toFixed(4)),
        orientation_deg: ((source.rotation % 360) + 360) % 360,
        radar_modules: discoveredModules ?? source.radarModules,
        capabilities: radar ? {
          ...(trackingSource.capabilities || {}),
          positioning: radar.profile.positioningAvailable,
          maximum_targets: radar.profile.maximumTargets,
          coordinate_projection: radar.profile.coordinateProjection,
          coordinate_frame: radar.profile.coordinateFrame,
          supplementary_presence: radar.profile.supplementaryPresenceSensors.length > 0,
        } : source.capabilities,
      };
    });

    return {
      ...room,
      walls,
      furniture,
      doors: this._doors,
      windows: this._windows,
      mirrors: this._mirrors,
      sensor,
      sensors,
      aggregation: this._aggregation,
      schema_version: 2,
      zones: this._zones,
      calibration: this._calibration,
      tracking: this._tracking,
    } as unknown as Room;
  }

  /**
   * The hardware drawer is deliberately a metadata-only editor.  Floorplan
   * geometry belongs to the floor planner and must survive a radar-settings
   * save byte-for-byte (including custom IDs and future schema fields).
   */
  private _hardwareRoomSnapshot(room: Room): Room {
    const zMappings = new Map(this._sensors.map((source) => {
      const mapping = source.zMapping;
      return [source.id, mapping ? {
          mode: mapping.mode,
          verified: mapping.verified,
          ...(mapping.verificationFingerprint
            ? { verification_fingerprint: mapping.verificationFingerprint }
            : {}),
        } : { mode: 'raw' as const, verified: false }] as const;
    }));
    return mergeHardwareRoomMetadata(
      room,
      this._aggregation,
      this._calibration,
      zMappings,
    );
  }

  private _openRoomImport(): void {
    this._roomTransferNotice = null;
    this._roomImportFile?.click();
  }

  private _prepareImportedRooms(
    rooms: Room[],
    source: 'backup' | 'apple_roomplan',
    warnings: RoomPlanWarning[] = [],
  ): void {
    this._pendingImportedRoomOptions = rooms;
    this._selectedImportedRoomIndex = 0;
    this._importRoomSource = source;
    this._importRoomWarnings = warnings;
    this._selectImportedRoomOption(0);
    this._roomActionError = '';
    this._showImportRoomDialog = true;
  }

  private _selectImportedRoomOption(index: number): void {
    const room = this._pendingImportedRoomOptions[index];
    if (!room) return;
    this._selectedImportedRoomIndex = index;
    this._pendingImportedRoom = room;
    const duplicateName = this.rooms.some(existing =>
      existing.name.trim().toLocaleLowerCase() === room.name.trim().toLocaleLowerCase());
    this._importRoomName = duplicateName
      ? panelText(this.hass, '{name} (imported)', { name: room.name })
      : room.name;
  }

  private async _handleRoomImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this._roomTransferNotice = null;

    if (file.size > MAX_ROOM_IMPORT_BYTES) {
      this._roomTransferNotice = {
        tone: 'error',
        text: panelText(this.hass, 'That file is too large. Choose a room backup smaller than 2 MB.'),
      };
      return;
    }

    const contents = await file.text();
    try {
      this._prepareImportedRooms([parseRoomExportText(contents)], 'backup');
      return;
    } catch (backupError) {
      if (backupError instanceof RoomTransferError && backupError.code === 'unsupported_version') {
        this._roomTransferNotice = {
          tone: 'error',
          text: panelText(this.hass, 'This backup was created by a newer SmartHomeShop version. Update the integration before importing it.'),
        };
        return;
      }
      try {
        const lidar = parseAppleRoomPlanText(contents, panelText(this.hass, 'LiDAR room'));
        this._prepareImportedRooms(lidar.rooms, 'apple_roomplan', lidar.warnings);
        return;
      } catch (lidarError) {
        const incompleteScan = lidarError instanceof RoomPlanImportError && lidarError.code === 'no_room_boundary';
        this._roomTransferNotice = {
          tone: 'error',
          text: panelText(
            this.hass,
            incompleteScan
              ? 'The LiDAR scan does not contain a complete room boundary. Scan every wall and export it as Apple RoomPlan JSON.'
              : 'That file is neither a SmartHomeShop room backup nor an Apple RoomPlan LiDAR scan.',
          ),
        };
      }
    }
  }

  private _exportSelectedRoom(): void {
    const room = this.rooms.find(item => item.id === this._selectedRoomId);
    if (!room) return;
    this._roomTransferNotice = null;
    try {
      const currentRoom = this._currentRoomSnapshot(room);
      const contents = JSON.stringify(createRoomExportDocument(currentRoom), null, 2);
      const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = roomExportFilename(currentRoom.name);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      this._roomTransferNotice = {
        tone: 'success',
        text: panelText(this.hass, 'Exported {name}.', { name: currentRoom.name }),
      };
    } catch (error) {
      console.error('Failed to export room:', error);
      this._roomTransferNotice = {
        tone: 'error',
        text: panelText(this.hass, 'Could not export the room.'),
      };
    }
  }

  private _closeImportRoomDialog(): void {
    if (this._roomTransferBusy) return;
    this._showImportRoomDialog = false;
    this._pendingImportedRoom = null;
    this._pendingImportedRoomOptions = [];
    this._importRoomWarnings = [];
    this._roomActionError = '';
  }

  private async _importRoom(): Promise<void> {
    const name = this._importRoomName.trim();
    if (!this._pendingImportedRoom || !name || this._roomTransferBusy) return;
    if (this._dirty && !confirm(panelText(this.hass, 'Discard the unsaved changes in the current room and import this room?'))) return;

    this._roomTransferBusy = true;
    this._roomActionError = '';
    try {
      const suffix = Math.random().toString(36).slice(2, 8);
      const importedRoom = makeImportedRoom(this._pendingImportedRoom, `room_${Date.now()}_${suffix}`, name);
      const result = await this.hass.callWS<{ room: Room }>({
        type: 'smarthomeshop/room/save',
        create: true,
        room: importedRoom,
      });
      const savedRoom = result.room || importedRoom;
      this._dirty = false;
      this.rooms = [...this.rooms, savedRoom];
      this._showImportRoomDialog = false;
      this._pendingImportedRoom = null;
      this._pendingImportedRoomOptions = [];
      this._importRoomWarnings = [];
      this._selectRoom(savedRoom.id);
      this._roomTransferNotice = {
        tone: 'success',
        text: panelText(this.hass, '{name} was imported as a new room.', { name }),
      };
    } catch {
      this._roomActionError = panelText(this.hass, 'Could not import the room. Check that you are an administrator and try again.');
    } finally {
      this._roomTransferBusy = false;
    }
  }

  private _openRenameRoom(roomId: string): void {
    const room = this.rooms.find(item => item.id === roomId);
    if (!room) return;
    this._roomActionError = '';
    this._renameRoomId = roomId;
    this._renameRoomName = room.name;
    this._showRenameRoomDialog = true;
  }

  private _roomMutationError(error: unknown, fallback: string): string {
    const detail = error as { code?: string; message?: string } | undefined;
    if (detail?.code === 'conflict') {
      return panelText(this.hass, 'This room changed or was removed in another browser. Reload the Floorplan Designer before saving again.');
    }
    if (detail?.code === 'unauthorized') {
      return panelText(this.hass, 'Only an administrator can change rooms.');
    }
    if (detail?.code === 'invalid_format') {
      return panelText(this.hass, 'The room contains an invalid setting. Review the room and try again.');
    }
    if (detail?.code === 'duplicate_device' || detail?.code === 'invalid_device') {
      return panelText(this.hass, 'One physical radar can only be linked to one room. Unlink it from the other room and try again.');
    }
    return panelText(this.hass, fallback);
  }

  private _replaceRoomFromServer(candidate: Room): void {
    this.rooms = this.rooms.map((current) => {
      if (current.id !== candidate.id) return current;
      const currentRevision = Date.parse(current.updated_at || '');
      const candidateRevision = Date.parse(candidate.updated_at || '');
      if (Number.isFinite(currentRevision)
        && Number.isFinite(candidateRevision)
        && candidateRevision < currentRevision) return current;
      return candidate;
    });
  }

  private async _reloadRoomAfterConflict(roomId: string): Promise<void> {
    this._dirty = false;
    this._selectedRoomId = null;
    await this._loadRooms();
    if (this.rooms.some(room => room.id === roomId)) this._selectRoom(roomId);
  }

  private async _renameRoom(): Promise<void> {
    const name = this._renameRoomName.trim();
    const room = this.rooms.find(item => item.id === this._renameRoomId);
    if (!room || !name || this._roomActionBusy) return;

    this._roomActionBusy = true;
    this._roomActionError = '';
    try {
      const updatedRoom = { ...room, name };
      const result = await this.hass.callWS<{ room: Room }>({ type: 'smarthomeshop/room/save', room: updatedRoom });
      this._replaceRoomFromServer(result.room);
      this._showRenameRoomDialog = false;
      this._renameRoomId = null;
    } catch (error: unknown) {
      this._roomActionError = this._roomMutationError(error, 'Could not rename the room. Check the connection and try again.');
    } finally {
      this._roomActionBusy = false;
    }
  }

  private _openDeleteRoom(roomId: string): void {
    if (!this.rooms.some(item => item.id === roomId)) return;
    this._roomActionError = '';
    this._deleteRoomId = roomId;
    this._showDeleteRoomDialog = true;
  }

  private _clearSelectedRoom(): void {
    this._selectedRoomId = null;
    this._roomPoints = [];
    this._furniture = [];
    this._doors = [];
    this._windows = [];
    this._mirrors = [];
    this._sensors = [];
    this._zones = [];
    this._selectedSensorIndex = null;
    this._selectedZoneIndex = null;
    this._targetTrails = {};
    this._liveTargets = {};
    this._dirty = false;
  }

  private async _deleteRoom(): Promise<void> {
    const roomId = this._deleteRoomId;
    if (!roomId || this._roomActionBusy) return;

    this._roomActionBusy = true;
    this._roomActionError = '';
    try {
      await this.hass.callWS({ type: 'smarthomeshop/room/delete', room_id: roomId });
      this._setPendingAlignmentRevocation(roomId, false);
      this._alignmentRevocationBlockedRoomIds.delete(roomId);
      const deletedSelectedRoom = this._selectedRoomId === roomId;
      this.rooms = this.rooms.filter(item => item.id !== roomId);
      if (deletedSelectedRoom) {
        this._clearSelectedRoom();
        if (this.rooms.length > 0) this._selectRoom(this.rooms[0].id);
      }
      this._showDeleteRoomDialog = false;
      this._deleteRoomId = null;
    } catch (error: unknown) {
      this._roomActionError = this._roomMutationError(error, 'Could not delete the room. Check the connection and try again.');
    } finally {
      this._roomActionBusy = false;
    }
  }

  private _handleKeyDown = (e: KeyboardEvent) => {
    if (this.hardwareOnly) return;
    const target = e.composedPath()[0] as HTMLElement | undefined;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
    if (e.key === 'Escape') {
      if (this._showZoneTypePicker) { this._cancelZoneTypePicker(); return; }
      if (this._showDoorDialog) { this._hideDoorDialog(); return; }
      if (this._showWindowDialog) { this._hideWindowDialog(); return; }
      if (this._showMirrorDialog) { this._hideMirrorDialog(); return; }
      if (this._showFurnitureDialog) { this._showFurnitureDialog = false; return; }
      if (this._showNewRoomDialog) { this._showNewRoomDialog = false; return; }
      if (this._showRenameRoomDialog) { this._showRenameRoomDialog = false; return; }
      if (this._showDeleteRoomDialog) { this._showDeleteRoomDialog = false; return; }
      if (this._drawingZone.length > 0) { this._drawingZone = []; return; }
      if (this._pendingStart) { this._pendingStart = null; this._previewPoint = null; return; }
      this._selectedZoneIndex = null;
      this._editingZoneIndex = null;
      this._selectedFurnitureIndex = null;
      this._selectedFurnitureType = null;
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && this._selectedFurnitureIndex !== null) {
      e.preventDefault();
      this._deleteFurniture(this._selectedFurnitureIndex);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && this._selectedZoneIndex !== null) {
      e.preventDefault();
      this._deleteZone(this._selectedZoneIndex);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && this._drawingZone.length > 0) {
      e.preventDefault();
      this._drawingZone = this._drawingZone.slice(0, -1);
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && this._toolMode === 'walls') {
      e.preventDefault();
      this._undoLastWallPoint();
    } else if (e.key.toLowerCase() === 'r' && this._selectedFurnitureIndex !== null) {
      this._rotateFurniture(this._selectedFurnitureIndex);
    }
  };

  private _startTargetUpdates() {
    this._stopTargetUpdates();
    this._targetUpdateInterval = window.setInterval(() => this._updateTargets(), 200);
  }

  private _stopTargetUpdates() {
    if (this._targetUpdateInterval) {
      clearInterval(this._targetUpdateInterval);
      this._targetUpdateInterval = null;
    }
  }

  private _serverNowMs(nowMs: number): number {
    return latestIndependentReportTimestamp(
      this.hass.states,
      radarEvidenceEntityIds(this._radarDevices),
      nowMs,
    );
  }

  private _startRuntimeUpdates(): void {
    this._stopRuntimeUpdates();
    this._runtimeUpdateInterval = window.setInterval(() => {
      void this._refreshRoomRuntime();
    }, 5000);
  }

  private _stopRuntimeUpdates(): void {
    if (this._runtimeUpdateInterval !== null) {
      window.clearInterval(this._runtimeUpdateInterval);
      this._runtimeUpdateInterval = null;
    }
  }

  private _updateTargets() {
    if (!this.hass) return;

    let changed = false;
    const next: Record<string, LiveTarget[]> = {};
    const roomObservations: TrackObservation[] = [];
    const nowMs = Date.now();
    const serverNowMs = this._serverNowMs(nowMs);

    for (const sensor of this._sensors) {
      if (!sensor.deviceId) continue;
      const radar = this._findRadarDevice(sensor.deviceId);
      const targetMaps = radar?.targets || [];
      const targets: LiveTarget[] = [];
      let trails = this._targetTrails[sensor.id];
      const maximumTargets = Math.max(1, radar?.profile.maximumTargets || targetMaps.length || 5);
      if (!trails || trails.length !== maximumTargets) {
        trails = Array.from({ length: maximumTargets }, () => []);
        this._targetTrails[sensor.id] = trails;
      }
      if (radar && !this._ld2460InstallationReady(radar)) {
        trails.forEach((_trail, index) => { trails[index] = []; });
        next[sensor.id] = [];
        if ((this._liveTargets[sensor.id] || []).length) changed = true;
        continue;
      }

      for (const targetMap of targetMaps) {
        const trailIndex = targetMap.index - 1;
        const xEntity = this.hass.states[targetMap.x_entity_id];
        const yEntity = this.hass.states[targetMap.y_entity_id];
        if (!xEntity || !yEntity) {
          if (trails[trailIndex]?.length) trails[trailIndex] = [];
          continue;
        }
        const scale = radar?.profile.coordinateScaleToMm ?? 1;
        const x = this._targetCoordinateMm(xEntity, scale);
        const y = this._targetCoordinateMm(yEntity, scale);
        const xTimestamp = this._reportTimestamp(targetMap.x_entity_id, xEntity, nowMs, serverNowMs);
        const yTimestamp = this._reportTimestamp(targetMap.y_entity_id, yEntity, nowMs, serverNowMs);
        if (x === null || y === null
          || xTimestamp === null
          || yTimestamp === null) {
          if (trails[trailIndex]?.length) trails[trailIndex] = [];
          continue;
        }
        const presenceState = targetMap.presence_entity_id
          ? this.hass.states[targetMap.presence_entity_id]?.state
          : null;
        // Current non-zero coordinates are direct radar evidence. A lagging
        // per-target flag may make the count uncertain, but never hide them.
        const active = x !== 0 || y !== 0;
        const roomTarget = projectRadarTargetToRoom({ x, y }, sensor, this._coordinateProjection(sensor));
        const excluded = active && this._targetFallsInExclusion(roomTarget, sensor);
        const zEntity = targetMap.z_entity_id ? this.hass.states[targetMap.z_entity_id] : undefined;
        const zTimestamp = this._reportTimestamp(targetMap.z_entity_id || '', zEntity, nowMs, serverNowMs);
        const zIsFresh = isFreshObservation(
          zTimestamp,
          nowMs,
          this._aggregation.tracking.observation_freshness_ms,
        );
        const rawZMm = zEntity && zIsFresh
          ? this._targetCoordinateMm(zEntity, scale)
          : null;
        const roomZMm = mapReportedZToRoom(
          rawZMm,
          this._effectiveSensorHeightMm(sensor),
          this._effectiveZMapping(sensor),
        );
        const xIsFresh = isFreshObservation(
          xTimestamp,
          nowMs,
          this._aggregation.tracking.observation_freshness_ms,
        );
        const yIsFresh = isFreshObservation(
          yTimestamp,
          nowMs,
          this._aggregation.tracking.observation_freshness_ms,
        );
        // Home Assistant's last_reported keeps a stationary axis current when
        // firmware repeats it. Without independent proof for both axes, the
        // target degrades to position-unknown instead of retaining stale X/Y.
        if (!xIsFresh || !yIsFresh) {
          if (trails[trailIndex]?.length) trails[trailIndex] = [];
          continue;
        }
        const observedAtMs = Math.max(xTimestamp, yTimestamp);
        const targetActive = active && !excluded;
        targets.push({ index: targetMap.index, x, y, active: targetActive, rawZMm, roomZMm, observedAtMs, excluded });
        if (targetActive) {
          roomObservations.push({
            sourceId: sensor.id,
            localTrackId: String(targetMap.index),
            x: roomTarget.x,
            y: roomTarget.y,
            rawZMm,
            roomZMm,
            observedAtMs,
          });
        }

        // Record trail history (sensor-local coords, capped length)
        const trail = trails[trailIndex] || (trails[trailIndex] = []);
        if (active && !excluded) {
          const last = trail[trail.length - 1];
          if (!last || Math.hypot(x - last.x, y - last.y) > 30) {
            trail.push({ x, y });
            if (trail.length > 60) trail.shift();
          }
        } else if (trail.length > 0) {
          trails[trailIndex] = [];
        }
      }
      next[sensor.id] = targets;
      if (JSON.stringify(targets) !== JSON.stringify(this._liveTargets[sensor.id] || [])) changed = true;
    }

    if (changed || Object.keys(next).length !== Object.keys(this._liveTargets).length) {
      this._liveTargets = next;
      this._updateTargetCirclesInDOM();
    }
    this._latestRoomObservations = roomObservations;
    const positioningSources = this._positioningSources();
    const readiness = fusionReadiness(
      positioningSources,
      this._aggregation.tracking.source_alignments,
      this._aggregation.tracking.duplicate_distance_mm,
    );
    const revocationPending = Boolean(
      this._selectedRoomId
      && this._pendingAlignmentRevocationRoomIds.has(this._selectedRoomId),
    );
    if (this._aggregation.tracking.experimental_fusion && fusionCanRun(readiness.ready, revocationPending)) {
      const fusionOptions = roomFusionOptions(
        this._aggregation.tracking.duplicate_distance_mm,
        this._aggregation.tracking.z_tolerance_mm,
        this._aggregation.tracking.observation_freshness_ms,
      );
      const association = this._associationGate.update(roomObservations, fusionOptions);
      this._fusionAssociationAmbiguous = association.ambiguous;
      const fused = fuseObservations(roomObservations, fusionOptions, association.confirmedPairs);
      this._setRoomTracks(this._roomTrackEngine.update(fused, nowMs, {
        matchDistanceMm: Math.max(900, this._aggregation.tracking.duplicate_distance_mm * 1.5),
        holdMs: this._aggregation.tracking.handoff_hold_ms,
      }));
    } else {
      this._roomTrackEngine.reset();
      this._associationGate.reset();
      this._fusionAssociationAmbiguous = false;
      this._setRoomTracks(roomObservations.map(observation => ({
        id: `${observation.sourceId}:${observation.localTrackId}`,
        x: observation.x,
        y: observation.y,
        rawZMm: observation.rawZMm,
        roomZMm: observation.roomZMm,
        observedAtMs: observation.observedAtMs,
        memberIds: [`${observation.sourceId}:${observation.localTrackId}`],
        sourceIds: [observation.sourceId],
        held: false,
      })));
    }
  }

  private _setRoomTracks(tracks: RoomTrack[]): void {
    if (JSON.stringify(tracks) !== JSON.stringify(this._roomTracks)) this._roomTracks = tracks;
  }

  private _reportTimestamp(
    entityId: string,
    state: HomeAssistant['states'][string] | undefined,
    nowMs: number,
    serverNowMs: number,
  ): number | null {
    if (!state || ['unknown', 'unavailable', 'nan'].includes(String(state.state).toLowerCase())) return null;
    const tracked = this._targetReportReceipts.state(entityId, state, nowMs, serverNowMs);
    const receivedAtMs = tracked?.received_at_ms;
    return Number.isFinite(receivedAtMs) ? Number(receivedAtMs) : null;
  }

  private _positioningSources(): SensorInstance[] {
    return this._sensors.filter(sensor => {
      const radar = this._findRadarDevice(sensor.deviceId);
      return Boolean(sensor.deviceId && radar?.profile.positioningAvailable && radar.targets.length);
    }).map(sensor => this._trackingSource(sensor));
  }

  private _trackingSource(sensor: SensorInstance): SensorInstance {
    const radar = this._findRadarDevice(sensor.deviceId);
    if (!radar) return sensor;
    const angle = radar.profile.installationAngleEntityId
      ? parseRadarInstallationNumber(
        this.hass.states[radar.profile.installationAngleEntityId]?.state,
        LD2460_ANGLE_RANGE.minimum,
        LD2460_ANGLE_RANGE.maximum,
      )
      : radar.profile.installationAngleDeg;
    return {
      ...sensor,
      heightMm: this._effectiveSensorHeightMm(sensor),
      capabilities: {
        ...(sensor.capabilities || {}),
        radar_model: radar.profile.radarModel,
        coordinate_frame: radar.profile.coordinateFrame || '',
        coordinate_projection: radar.profile.coordinateProjection,
        installation_mode: this._currentHardwareMode(radar) || '',
        installation_height_mm: this._effectiveSensorHeightMm(sensor),
        installation_angle_tenths: angle === null ? 0 : Math.round(angle * 10),
      },
    };
  }

  private _effectiveZMapping(sensor: SensorInstance): ZMapping {
    const mapping = sensor.zMapping || { mode: 'raw' as const, verified: false };
    if (!mapping.verified || mapping.mode === 'raw') return { ...mapping, verified: false };
    return {
      ...mapping,
      verified: mapping.verificationFingerprint
        === sourcePlacementFingerprint(this._trackingSource(sensor)),
    };
  }

  private _fusionStatus() {
    return fusionReadiness(
      this._positioningSources(),
      this._aggregation.tracking.source_alignments,
      this._aggregation.tracking.duplicate_distance_mm,
    );
  }

  private _invalidateAlignmentAfterInstallationChange(): void {
    this._aggregation = {
      ...this._aggregation,
      tracking: {
        ...this._aggregation.tracking,
        experimental_fusion: false,
        source_alignments: {},
      },
    };
    this._alignmentSamples = [];
    this._alignmentSampleFingerprint = null;
    this._alignmentFeedback = panelText(
      this.hass,
      'Radar installation changed. Repeat the neighbouring overlap alignment.',
    );
    this._roomTrackEngine.reset();
    this._associationGate.reset();
    this._fusionAssociationAmbiguous = false;
    this._markDirty();
  }

  /**
   * Apply an asynchronous hardware change to the room that started it.
   *
   * A user may select another room while ESPHome confirms a number/select
   * write. Never use the old numeric sensor index against that new room. The
   * originating room is instead made safe immediately and its persisted
   * fusion calibration is revoked in the background.
   */
  private _invalidateOriginRoomAfterInstallationChange(
    roomId: string | null,
    sourceId: string | null,
    heightMm: number | null = null,
  ): void {
    if (!roomId) return;
    if (this._selectedRoomId === roomId) {
      if (heightMm !== null && sourceId) {
        const currentIndex = this._sensors.findIndex(sensor => sensor.id === sourceId);
        if (currentIndex >= 0) {
          this._sensors = this._sensors.map((sensor, index) => index === currentIndex
            ? { ...sensor, heightMm }
            : sensor);
        }
      }
      this._invalidateAlignmentAfterInstallationChange();
      return;
    }

    this.rooms = applyInstallationChangeToOriginRoom(
      this.rooms,
      roomId,
      sourceId,
      heightMm,
    );
    this._setPendingAlignmentRevocation(roomId, true);
    this._clearRoomFusionSafetyState(roomId);
    void this._persistAlignmentRevocation(roomId);
  }

  private _captureAlignmentPoint(): void {
    if (this._alignmentRevocationPending()) {
      this._alignmentFeedback = panelText(
        this.hass,
        'Safety revocation is pending. Fusion and alignment controls stay disabled.',
      );
      return;
    }
    const sources = this._positioningSources();
    const captureFingerprint = alignmentCaptureFingerprint(sources);
    if (this._alignmentSampleFingerprint !== captureFingerprint) {
      if (this._alignmentSamples.length) {
        this._alignmentFeedback = panelText(
          this.hass,
          'Radar installation changed. Repeat the neighbouring overlap alignment.',
        );
      }
      this._alignmentSamples = [];
      this._alignmentSampleFingerprint = captureFingerprint;
    }
    if (!this._alignmentSamples.length) {
      this._aggregation = {
        ...this._aggregation,
        tracking: {
          ...this._aggregation.tracking,
          experimental_fusion: false,
          source_alignments: {},
        },
      };
      this._roomTrackEngine.reset();
      this._associationGate.reset();
    }
    const snapshot: Record<string, Point> = {};
    for (const source of sources) {
      const observations = this._latestRoomObservations.filter(item => item.sourceId === source.id);
      if (observations.length === 1) snapshot[source.id] = { x: observations[0].x, y: observations[0].y };
    }
    if (Object.keys(snapshot).length < 2) {
      this._alignmentFeedback = panelText(
        this.hass,
        'Keep exactly one person visible to at least two neighbouring positioning sensors, then capture again.',
      );
      return;
    }
    const samples = [...this._alignmentSamples, snapshot].slice(-18);
    this._alignmentSamples = samples;
    const assessment = assessPairwiseAlignmentNetwork(
      samples,
      sources.map(source => source.id),
      1000,
      Math.min(450, this._aggregation.tracking.duplicate_distance_mm * 0.6),
    );
    if (!assessment.ready) {
      const pairAssessments = Object.values(assessment.pairAssessments);
      const worstDisagreement = Math.max(0, ...pairAssessments.map(item => item.maximumDisagreementMm));
      const captured = Math.max(0, ...pairAssessments.map(item => item.sampleCount));
      if (shouldRevokeAlignment(assessment)) {
        this._aggregation = {
          ...this._aggregation,
          tracking: {
            ...this._aggregation.tracking,
            experimental_fusion: false,
            source_alignments: {},
          },
        };
        this._roomTrackEngine.reset();
        this._associationGate.reset();
        this._fusionAssociationAmbiguous = false;
        this._markDirty();
        // Persist this fail-closed safety mutation independently from the
        // editable room snapshot. A stale revision, concurrent save or
        // discarded draft must never restore calibration disproved here.
        if (this._selectedRoomId) {
          this._setPendingAlignmentRevocation(this._selectedRoomId, true);
          this._clearRoomFusionSafetyState(this._selectedRoomId);
          void this._persistAlignmentRevocation(this._selectedRoomId);
        }
      }
      this._alignmentFeedback = pairAssessments.some(item => item.reason === 'too_far_apart')
        ? panelText(this.hass, 'The sensors disagree by {distance} mm. Correct their position or rotation and restart the test.', { distance: Math.round(worstDisagreement) })
        : captured < 3
          ? panelText(this.hass, 'Captured {count}/3 positions for this sensor pair. Walk to a clearly different part of their overlap.', { count: captured })
          : panelText(this.hass, 'This sensor pair is verified. Move into the overlap with the next sensor until every sensor is connected.');
      return;
    }
    const verifiedAt = new Date().toISOString();
    const sourceAlignments = { ...this._aggregation.tracking.source_alignments };
    sources.forEach(source => {
      sourceAlignments[source.id] = {
        placement_fingerprint: sourcePlacementFingerprint(source),
        verified_at: verifiedAt,
        sample_count: Math.max(3, assessment.sampleCount),
        rmse_mm: Math.round(assessment.rmseMm),
        duplicate_distance_mm: this._aggregation.tracking.duplicate_distance_mm,
      };
    });
    this._aggregation = {
      ...this._aggregation,
      tracking: { ...this._aggregation.tracking, source_alignments: sourceAlignments },
    };
    this._alignmentFeedback = panelText(
      this.hass,
      'Alignment verified at {count} positions ({distance} mm average difference). Overlap fusion is ready.',
      { count: assessment.sampleCount, distance: Math.round(assessment.rmseMm) },
    );
    this._markDirty();
  }

  private _resetAlignment(): void {
    this._alignmentSamples = [];
    this._alignmentSampleFingerprint = null;
    this._alignmentFeedback = panelText(this.hass, 'Alignment test cleared. Capture three positions in each neighbouring overlap.');
    this._aggregation = {
      ...this._aggregation,
      tracking: { ...this._aggregation.tracking, experimental_fusion: false, source_alignments: {} },
    };
    this._roomTrackEngine.reset();
    this._associationGate.reset();
    this._targetReportReceipts.clear();
    this._fusionAssociationAmbiguous = false;
    this._markDirty();
  }

  private _setSensorZMapping(sourceId: string, mode: ZMapping['mode'], verified: boolean): void {
    this._sensors = this._sensors.map(source => {
      if (source.id !== sourceId) return source;
      const accepted = mode !== 'raw' && verified;
      return {
        ...source,
        zMapping: {
          mode,
          verified: accepted,
          verificationFingerprint: accepted
            ? sourcePlacementFingerprint(this._trackingSource(source))
            : undefined,
        },
      };
    });
    this._markDirty();
  }

  private _targetEntityIds(deviceId: string, target: number, axis: 'x' | 'y'): string[] {
    return [
      `sensor.${deviceId}_target_${target}_${axis}`,
      `sensor.${deviceId}_target${target}_${axis}`,
      `sensor.${deviceId}_tracking_target_${target}_${axis}`,
      `sensor.${deviceId}_tracking_target${target}_${axis}`,
    ];
  }

  private _findTargetEntity(deviceId: string, target: number, axis: 'x' | 'y') {
    const discovered = this._findRadarDevice(deviceId)?.targets.find(item => item.index === target);
    const discoveredEntityId = axis === 'x' ? discovered?.x_entity_id : discovered?.y_entity_id;
    if (discoveredEntityId && this.hass.states[discoveredEntityId]) {
      return this.hass.states[discoveredEntityId];
    }
    return undefined;
  }

  private _targetCoordinateMm(entity: any, coordinateScaleToMm: number): number | null {
    return normalizeRadarCoordinate(entity?.state, coordinateScaleToMm);
  }

  private _hasSupplementaryPresence(radar: RadarDevice | undefined): boolean {
    return Boolean(radar?.profile.supplementaryPresenceSensors.some(
      entityId => this.hass.states[entityId]?.state === 'on',
    ));
  }

  private _getRadarCapabilities(deviceId: string | null): RadarCapabilities {
    const discovered = this._findRadarDevice(deviceId);
    if (discovered) return discovered.capabilities;
    return {
      targetCount: 0,
      availableTargetCount: 0,
      coordinateMode: 'unknown',
      polygonZones: false,
      entryLines: false,
      zoneProfiles: false,
      interferenceZones: false,
      smoothing: false,
      crossZoneTracking: false,
    };
  }

  private _getRadarDevices(): RadarDevice[] {
    return this._radarDevices;
  }

  private _mapRadarProfile(device: RadarDeviceProfilePayload): RadarDevice {
    const detectedProduct = device.profile.detected_product || '';
    const productFamily: RadarProductFamily = detectedProduct === 'ceilsense'
      ? 'ceilsense'
      : detectedProduct.startsWith('ultimatesensor')
        ? 'ultimate-sensor'
        : 'unknown';
    return {
      id: device.device_id,
      aliases: Array.from(new Set([device.device_id, device.entity_prefix, ...(device.aliases || [])])),
      entityPrefix: device.entity_prefix,
      name: device.name,
      productFamily,
      recommendedMountingMode: device.profile.mounting_mode,
      capabilities: {
        targetCount: device.profile.maximum_targets,
        availableTargetCount: device.targets.length,
        coordinateMode: device.capabilities.coordinate_mode,
        polygonZones: device.capabilities.polygon_zones,
        entryLines: device.capabilities.entry_lines,
        zoneProfiles: device.capabilities.zone_profiles,
        interferenceZones: device.capabilities.interference_zones,
        smoothing: device.capabilities.smoothing,
        crossZoneTracking: device.capabilities.cross_zone_tracking,
      },
      profile: {
        mountingMode: device.profile.mounting_mode,
        coordinateProjection: device.profile.coordinate_projection,
        requiredInstallationMode: device.profile.required_installation_mode ?? null,
        mountingHeightMm: device.profile.mounting_height_mm ?? null,
        maximumRangeMm: device.profile.maximum_range_mm ?? null,
        fieldOfViewDeg: device.profile.field_of_view_deg ?? null,
        radarModel: device.profile.radar_model,
        coordinateFrame: device.profile.coordinate_frame ?? null,
        coordinateScaleToMm: device.profile.coordinate_scale_to_mm,
        maximumTargets: device.profile.maximum_targets,
        hardwareModeCapability: device.profile.hardware_mode_capability ?? null,
        metadataSource: device.profile.metadata_source,
        detectedProduct: device.profile.detected_product ?? null,
        supplementaryPresenceSensors: device.profile.supplementary_presence_sensors || [],
        currentHardwareMode: device.profile.current_hardware_mode ?? null,
        reportedInstallationModeEntityId: device.profile.reported_installation_mode_entity_id ?? null,
        installationModeEntityId: device.profile.installation_mode_entity_id ?? null,
        installationModeOptions: device.profile.installation_mode_options || [],
        installationHeightEntityId: device.profile.installation_height_entity_id ?? null,
        installationHeightM: device.profile.installation_height_m ?? null,
        installationAngleEntityId: device.profile.installation_angle_entity_id ?? null,
        installationAngleDeg: device.profile.installation_angle_deg ?? null,
        detectionDistanceEntityId: device.profile.detection_distance_entity_id ?? null,
        detectionDistanceM: device.profile.detection_distance_m ?? null,
        detectionStartAngleEntityId: device.profile.detection_start_angle_entity_id ?? null,
        detectionStartAngleDeg: device.profile.detection_start_angle_deg ?? null,
        detectionEndAngleEntityId: device.profile.detection_end_angle_entity_id ?? null,
        detectionEndAngleDeg: device.profile.detection_end_angle_deg ?? null,
        trackingPresenceEntityId: device.profile.tracking_presence_entity_id ?? null,
        trackingTargetCountEntityId: device.profile.tracking_target_count_entity_id ?? null,
        missingMetadataEntities: device.profile.missing_metadata_entities || [],
        invalidMetadataEntities: device.profile.invalid_metadata_entities || [],
        positioningAvailable: device.profile.positioning_available,
      },
      targets: device.targets || [],
    };
  }

  private async _loadRadarProfiles(): Promise<void> {
    this._radarProfilesLoading = true;
    try {
      const result = await this.hass.callWS<{ devices: RadarDeviceProfilePayload[] }>({
        type: 'smarthomeshop/radar/profiles',
      });
      this._radarDevices = (result.devices || []).map(device => this._mapRadarProfile(device));
      this._radarProfilesError = null;
    } catch {
      this._radarProfilesError = panelText(this.hass, 'Radar metadata is temporarily unavailable.');
      // Keep the last registry-backed snapshot. Generated entity IDs or a
      // model guessed from target count can bind the wrong ESPHome device.
    } finally {
      this._radarProfilesLoading = false;
    }
  }

  private async _loadRooms() {
    try {
      const result = await this.hass.callWS<{
        rooms: Room[];
        recovery?: { count?: number };
      }>({ type: 'smarthomeshop/rooms' });
      this.rooms = result.rooms || [];
      this._invalidRoomCount = Math.max(0, Number(result.recovery?.count) || 0);
      this._roomsError = null;
      if (this.rooms.length > 0 && !this._selectedRoomId) {
        const preferred = this.rooms.find(room => room.id === this.hardwareContext?.roomId);
        this._selectRoom((preferred ?? this.rooms[0]).id);
        if (preferred && this.hardwareContext?.sensorId) {
          const index = this._sensors.findIndex(sensor => sensor.id === this.hardwareContext?.sensorId);
          if (index >= 0) this._selectedSensorIndex = index;
        }
      }
      await this._refreshRoomRuntime();
    } catch (err: any) {
      console.error('Failed to load rooms:', err);
      // The saved rooms are untouched on disk, so a failed load must not look
      // like an empty designer: that invites building a duplicate room.
      this._roomsError = 'Could not load your rooms.';
    } finally {
      this._hardwareLoading = false;
    }
  }

  private async _refreshRoomRuntime(): Promise<void> {
    if (!this.hass || document.hidden || this._runtimePending) return;
    const request = ++this._runtimeRequest;
    const requestedAt = Date.now();
    this._runtimePending = true;
    try {
      const runtime = await this.hass.callWS<{ rooms: Record<string, RoomRuntimeSnapshot>; available: boolean }>({
        type: 'smarthomeshop/rooms/runtime',
      });
      if (request !== this._runtimeRequest) return;
      if (Date.now() - requestedAt > 7500) {
        this._expireRoomRuntime();
        return;
      }
      this._roomRuntime = runtime.rooms || {};
      this._roomRuntimeAvailable = runtime.available === true;
      this._runtimeReceivedAt = this._roomRuntimeAvailable ? Date.now() : 0;
      this._scheduleRoomRuntimeExpiry();
      this._applyAuthoritativeAlignmentRevocation();
    } catch {
      if (request !== this._runtimeRequest) return;
      this._expireRoomRuntime();
    } finally {
      if (request === this._runtimeRequest) this._runtimePending = false;
    }
    for (const roomId of this._pendingAlignmentRevocationRoomIds) {
      if (this._alignmentRevocationBlockedRoomIds.has(roomId)) continue;
      void this._persistAlignmentRevocation(roomId);
    }
  }

  private _scheduleRoomRuntimeExpiry(): void {
    if (this._runtimeExpiryTimer !== null) window.clearTimeout(this._runtimeExpiryTimer);
    this._runtimeExpiryTimer = null;
    if (!this._roomRuntimeAvailable || !this._runtimeReceivedAt) return;
    const acceptedAt = this._runtimeReceivedAt;
    this._runtimeExpiryTimer = window.setTimeout(() => {
      if (this._runtimeReceivedAt !== acceptedAt) return;
      this._expireRoomRuntime();
    }, 7500);
  }

  private _expireRoomRuntime(): void {
    if (this._runtimeExpiryTimer !== null) window.clearTimeout(this._runtimeExpiryTimer);
    this._runtimeExpiryTimer = null;
    this._roomRuntimeAvailable = false;
    this._runtimeReceivedAt = 0;
    this.requestUpdate();
  }

  private _applyAuthoritativeAlignmentRevocation(): void {
    for (const room of [...this.rooms]) {
      const localMarker = room.id === this._selectedRoomId
        ? this._aggregation.tracking.alignment_revoked_at
        : room.aggregation?.tracking?.alignment_revoked_at;
      const revokedAt = authoritativeAlignmentRevocation(
        localMarker,
        this._roomRuntime[room.id]?.tracking?.alignment_revoked_at,
      );
      if (!revokedAt) continue;
      this._setPendingAlignmentRevocation(room.id, false);
      this._alignmentRevocationBlockedRoomIds.delete(room.id);
      this._clearRoomFusionSafetyState(room.id);
      this.rooms = this.rooms.map(candidate => {
        if (candidate.id !== room.id) return candidate;
        const safe = roomWithFusionRevoked(candidate.aggregation
          ? candidate
          : { ...candidate, aggregation: createDefaultAggregation() });
        return {
          ...safe,
          aggregation: {
            ...safe.aggregation!,
            tracking: { ...safe.aggregation!.tracking, alignment_revoked_at: revokedAt },
          },
        };
      });
      if (room.id === this._selectedRoomId) {
        this._aggregation = {
          ...this._aggregation,
          tracking: {
            ...this._aggregation.tracking,
            experimental_fusion: false,
            source_alignments: {},
            alignment_revoked_at: revokedAt,
          },
        };
        this._alignmentRevocationError = panelText(
          this.hass,
          'Fusion was disabled because this calibration was revoked elsewhere. Reload before saving other room changes.',
        );
      }
    }
  }

  private async _persistAlignmentRevocation(roomId: string): Promise<void> {
    if (this._alignmentRevocationInFlight.has(roomId)) return;
    this._alignmentRevocationInFlight.add(roomId);
    const requestedRevision = this.rooms.find(room => room.id === roomId)?.updated_at;
    const retryMessage = panelText(
      this.hass,
      'The safety calibration could not be revoked yet. Fusion stays off here and retrying continues automatically.',
    );
    try {
      const result = await this.hass.callWS<AlignmentRevocationResult>({
        type: 'smarthomeshop/room/alignment/revoke',
        room_id: roomId,
      });
      this._setPendingAlignmentRevocation(roomId, false);
      this._alignmentRevocationBlockedRoomIds.delete(roomId);
      const current = this.rooms.find(room => room.id === roomId);
      if (current) {
        const reconciled = reconcileRoomAfterAlignmentRevocation(current, result, requestedRevision);
        this.rooms = this.rooms.map(room => room.id === roomId ? reconciled.room : room);
        if (!reconciled.revisionAdopted) {
          this._alignmentRevocationError = panelText(
            this.hass,
            'Safety calibration was revoked, but this room changed elsewhere. Reload the Floorplan Designer before saving other changes.',
          );
        } else {
          this._alignmentRevocationError = '';
        }
      } else this._alignmentRevocationError = '';
      this._clearRoomFusionSafetyState(roomId);
      const revokedAt = result.room.aggregation?.tracking.alignment_revoked_at;
      if (revokedAt && this._selectedRoomId === roomId) {
        this._aggregation = {
          ...this._aggregation,
          tracking: { ...this._aggregation.tracking, alignment_revoked_at: revokedAt },
        };
      }
      this.dispatchEvent(new CustomEvent('radar-calibration-saved', {
        bubbles: true,
        composed: true,
        detail: { room: result.room, previousRevision: requestedRevision },
      }));
    } catch (error: unknown) {
      console.error('Failed to revoke room alignment:', error);
      const code = (error as { code?: string } | undefined)?.code;
      if (code === 'not_found') {
        this._setPendingAlignmentRevocation(roomId, false);
        this._alignmentRevocationError = panelText(
          this.hass,
          'This room was removed elsewhere. Reload the Floorplan Designer to refresh the room list.',
        );
      } else if (code === 'unauthorized') {
        this._alignmentRevocationBlockedRoomIds.add(roomId);
        this._alignmentRevocationError = panelText(
          this.hass,
          'An administrator must open the Floorplan Designer to finish this safety revocation. Fusion stays disabled on this browser.',
        );
      } else {
        this._alignmentRevocationError = retryMessage;
      }
    } finally {
      this._alignmentRevocationInFlight.delete(roomId);
    }
  }

  private _selectRoom(roomId: string) {
    if (this._dirty && this._selectedRoomId && roomId !== this._selectedRoomId) {
      if (!confirm(panelText(this.hass, 'You have unsaved changes. Discard them?'))) return;
    }
    this._dirty = false;
    this._targetTrails = {};
    this._liveTargets = {};
    this._roomTracks = [];
    this._latestRoomObservations = [];
    this._alignmentSamples = [];
    this._alignmentSampleFingerprint = null;
    this._alignmentFeedback = '';
    this._roomTrackEngine.reset();
    this._associationGate.reset();
    this._fusionAssociationAmbiguous = false;
    this._selectedRoomId = roomId;
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      // Load walls
      this._roomPoints = room.walls?.length > 0 ? room.walls.map(w => ({ x: w.x1, y: w.y1 })) : [];

      // Load furniture
      this._furniture = ((room as any).furniture || []).map((f: any) => ({
        id: f.id,
        type: f.typeId || f.type || 'unknown',
        name: f.name || 'Furniture',
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height || f.depth || f.width,
        rotation: resolveFurnitureRotation(f),
      }));

      // Load doors and windows
      this._doors = (room as any).doors || [];
      this._windows = (room as any).windows || [];
      this._mirrors = Array.isArray((room as any).mirrors)
        ? (room as any).mirrors
          .filter((mirror: any) => Number.isInteger(mirror?.wallIndex))
          .map((mirror: any, index: number): MirrorItem => ({
            id: String(mirror.id || `mirror_${index + 1}`),
            wallIndex: Number(mirror.wallIndex),
            // Kept as it was saved: the wedge sent to a radar has to lie where the designer drew it.
            position: Math.min(1, Math.max(0, Number.isFinite(Number(mirror.position)) ? Number(mirror.position) : 0.5)),
            width: Math.min(5000, Math.max(100, Number(mirror.width) || 1000)),
            height: Math.min(3000, Math.max(100, Number(mirror.height) || 1800)),
            protectionEnabled: mirror.protectionEnabled === true,
            reflectionDepthMm: Math.min(6000, Math.max(250, Number(mirror.reflectionDepthMm) || 2000)),
          }))
        : [];

      // Load sensors (with migration from the old single-sensor format)
      const roomSensors = (room as any).sensors;
      const legacySensor = (room as any).sensor;
      if (roomSensors && roomSensors.length > 0) {
        this._sensors = roomSensors.map((sn: any, i: number) => ({
          id: sn.id || `sensor_${i + 1}`,
          deviceId: sn.deviceId ?? null,
          x: sn.x, y: sn.y,
          rotation: sn.rotation ?? 0,
          range: sn.range ?? 6000,
          fov: sn.fov ?? 120,
          heightMm: sn.heightMm ?? 2000,
          mountingMode: sn.mountingMode ?? this._recommendedMountingMode(sn.deviceId ?? null),
          sourceVersion: sn.source_version ?? 1,
          configuredAt: sn.configured_at,
          radarModules: Array.isArray(sn.radar_modules) ? sn.radar_modules : undefined,
          capabilities: sn.capabilities && typeof sn.capabilities === 'object' ? sn.capabilities : undefined,
          zMapping: ['floor_up', 'sensor_down'].includes(sn.z_mapping?.mode)
            ? {
              mode: sn.z_mapping.mode,
              verified: sn.z_mapping.verified === true,
              verificationFingerprint: typeof sn.z_mapping.verification_fingerprint === 'string'
                ? sn.z_mapping.verification_fingerprint
                : undefined,
            }
            : { mode: 'raw', verified: false },
        }));
      } else if (legacySensor) {
        this._sensors = [{
          id: 'sensor_1',
          deviceId: legacySensor.deviceId ?? null,
          x: legacySensor.x, y: legacySensor.y,
          rotation: legacySensor.rotation ?? 0,
          range: legacySensor.range ?? 6000,
          fov: legacySensor.fov ?? 120,
          heightMm: legacySensor.heightMm ?? 2000,
          mountingMode: legacySensor.mountingMode ?? this._recommendedMountingMode(legacySensor.deviceId ?? null),
        }];
      } else {
        this._sensors = [];
      }
      this._selectedSensorIndex = this._sensors.length > 0 ? 0 : null;

      const savedAggregation = room.aggregation;
      const defaults = createDefaultAggregation();
      this._aggregation = {
        version: 2,
        presence: {
          freshness_seconds: Math.min(600, Math.max(15, Number(savedAggregation?.presence?.freshness_seconds) || defaults.presence.freshness_seconds)),
          vacancy_delay_seconds: Math.min(600, Math.max(0,
            Number.isFinite(Number(savedAggregation?.presence?.vacancy_delay_seconds))
              ? Number(savedAggregation?.presence?.vacancy_delay_seconds)
              : defaults.presence.vacancy_delay_seconds)),
          source_ids: Array.isArray(savedAggregation?.presence?.source_ids)
            ? savedAggregation.presence.source_ids.filter(id => this._sensors.some(sensor => sensor.id === id))
            : [],
        },
        climate: {
          temperature: this._normaliseClimateSetting(savedAggregation?.climate?.temperature),
          humidity: this._normaliseClimateSetting(savedAggregation?.climate?.humidity),
          co2: this._normaliseClimateSetting(savedAggregation?.climate?.co2),
        },
        tracking: {
          experimental_fusion: savedAggregation?.tracking?.experimental_fusion === true,
          ...(savedAggregation?.tracking?.alignment_revoked_at
            ? { alignment_revoked_at: savedAggregation.tracking.alignment_revoked_at }
            : {}),
          duplicate_distance_mm: Math.min(1500, Math.max(150, Number(savedAggregation?.tracking?.duplicate_distance_mm) || 650)),
          observation_freshness_ms: Math.min(15000, Math.max(1000, Number(savedAggregation?.tracking?.observation_freshness_ms) || 5000)),
          handoff_hold_ms: Math.min(5000, Math.max(0,
            Number.isFinite(Number(savedAggregation?.tracking?.handoff_hold_ms))
              ? Number(savedAggregation?.tracking?.handoff_hold_ms)
              : 1800)),
          z_tolerance_mm: Math.min(2000, Math.max(100, Number(savedAggregation?.tracking?.z_tolerance_mm) || 700)),
          source_alignments: savedAggregation?.tracking?.source_alignments
            && typeof savedAggregation.tracking.source_alignments === 'object'
            ? Object.fromEntries(Object.entries(savedAggregation.tracking.source_alignments).filter(([sourceId, value]) =>
                this._sensors.some(sensor => sensor.id === sourceId) && value && typeof value === 'object'))
            : {},
        },
      };
      if (this._pendingAlignmentRevocationRoomIds.has(roomId)) {
        this._aggregation = {
          ...this._aggregation,
          tracking: {
            ...this._aggregation.tracking,
            experimental_fusion: false,
            source_alignments: {},
          },
        };
      }

      // New fields are optional so rooms saved by older releases remain usable.
      this._zones = Array.isArray((room as any).zones)
        ? (room as any).zones.map((zone: unknown, index: number) => normalizeZone((zone || {}) as Partial<ZoneData>, index))
        : [];
      const savedCalibration = (room as any).calibration || {};
      this._calibration = {
        enabled: Boolean(savedCalibration.enabled),
        corners: Array.isArray(savedCalibration.corners)
          ? savedCalibration.corners.filter((point: Point) => Number.isFinite(point?.x) && Number.isFinite(point?.y)).slice(0, 4)
          : [],
        gridSizeMm: savedCalibration.gridSizeMm === 300 ? 300 : 100,
        snapToGrid: savedCalibration.snapToGrid !== false,
        sensorId: typeof savedCalibration.sensorId === 'string' ? savedCalibration.sensorId : undefined,
      };
      const savedTracking = (room as any).tracking || {};
      this._tracking = {
        smoothingEnabled: savedTracking.smoothingEnabled !== false,
        smoothingAlpha: Math.min(1, Math.max(0.05, Number(savedTracking.smoothingAlpha) || DEFAULT_TRACKING.smoothingAlpha)),
        maxJumpMm: Math.max(100, Number(savedTracking.maxJumpMm) || DEFAULT_TRACKING.maxJumpMm),
        trackHoldMs: Math.max(0, Number(savedTracking.trackHoldMs) || DEFAULT_TRACKING.trackHoldMs),
        crossZoneTracking: savedTracking.crossZoneTracking !== false,
      };

      this._autoZoom();
    }
    this._toolMode = 'select';
    this._selectedZoneIndex = null;
    this._selectedZonePartIndex = 0;
    this._drawingZone = [];
    this._applyAuthoritativeAlignmentRevocation();
  }

  private _normaliseClimateSetting(
    setting: { strategy?: RoomClimateStrategy; primary_source_id?: string | null } | undefined,
  ): { strategy: RoomClimateStrategy; primary_source_id: string | null } {
    const strategy: RoomClimateStrategy = ['average', 'primary', 'separate'].includes(setting?.strategy || '')
      ? setting!.strategy as RoomClimateStrategy
      : 'average';
    const primary = typeof setting?.primary_source_id === 'string'
      && this._sensors.some(sensor => sensor.id === setting.primary_source_id)
      ? setting.primary_source_id
      : null;
    return { strategy, primary_source_id: primary };
  }

  private _setPresenceNumber(key: 'freshness_seconds' | 'vacancy_delay_seconds', value: number): void {
    const minimum = key === 'freshness_seconds' ? 15 : 0;
    this._aggregation = {
      ...this._aggregation,
      presence: {
        ...this._aggregation.presence,
        [key]: Math.min(600, Math.max(minimum, Math.round(value))),
      },
    };
    this._markDirty();
  }

  private _togglePresenceSource(sourceId: string, enabled: boolean): void {
    const linked = this._sensors.filter(sensor => sensor.deviceId).map(sensor => sensor.id);
    const currentlySelected = linked.filter(id => this._presenceSourceEnabled(id));
    if (!enabled && currentlySelected.length <= 1 && currentlySelected.includes(sourceId)) return;
    const explicit = new Set(this._aggregation.presence.source_ids);
    if (!explicit.size && !enabled) this._sensors.forEach(sensor => {
      if (sensor.deviceId) explicit.add(sensor.id);
    });
    if (enabled) explicit.add(sourceId); else explicit.delete(sourceId);
    const selected = linked.filter(id => explicit.has(id));
    this._aggregation = {
      ...this._aggregation,
      presence: {
        ...this._aggregation.presence,
        source_ids: selected.length === linked.length ? [] : selected,
      },
    };
    this._markDirty();
  }

  private _presenceSourceEnabled(sourceId: string): boolean {
    return !this._aggregation.presence.source_ids.length
      || this._aggregation.presence.source_ids.includes(sourceId);
  }

  private _setClimateStrategy(metric: 'temperature' | 'humidity' | 'co2', strategy: RoomClimateStrategy): void {
    const current = this._aggregation.climate[metric];
    const firstLinked = this._sensors.find(sensor => sensor.deviceId)?.id || null;
    this._aggregation = {
      ...this._aggregation,
      climate: {
        ...this._aggregation.climate,
        [metric]: {
          strategy,
          primary_source_id: strategy === 'primary' ? current.primary_source_id || firstLinked : current.primary_source_id,
        },
      },
    };
    this._markDirty();
  }

  private _setClimatePrimary(metric: 'temperature' | 'humidity' | 'co2', sourceId: string): void {
    this._aggregation = {
      ...this._aggregation,
      climate: {
        ...this._aggregation.climate,
        [metric]: { ...this._aggregation.climate[metric], primary_source_id: sourceId || null },
      },
    };
    this._markDirty();
  }

  private _renderRoomAggregation() {
    const runtime = this._roomRuntimeAvailable
      && Date.now() - this._runtimeReceivedAt <= 7500
      && this._selectedRoomId
      ? this._roomRuntime[this._selectedRoomId]
      : undefined;
    const linkedSources = this._sensors.filter(source => source.deviceId);
    const positioningSources = this._positioningSources();
    const fusionStatus = this._fusionStatus();
    const revocationPending = this._alignmentRevocationPending();
    const fusionAvailable = fusionCanRun(fusionStatus.ready, revocationPending);
    const presenceStatus = runtime?.presence?.status || 'unknown';
    const presenceIcon = presenceStatus === 'occupied'
      ? 'mdi:account-check'
      : presenceStatus === 'clear'
        ? 'mdi:home-outline'
        : presenceStatus === 'clearing'
          ? 'mdi:timer-sand'
          : 'mdi:help-circle-outline';
    const statusLabel = presenceStatus === 'occupied'
      ? panelText(this.hass, 'Occupied')
      : presenceStatus === 'clear'
        ? panelText(this.hass, 'Clear')
        : presenceStatus === 'clearing'
          ? panelText(this.hass, 'Waiting before clearing')
          : panelText(this.hass, 'Unknown, waiting for fresh sensor data');
    const metrics: Array<{ id: 'temperature' | 'humidity' | 'co2'; label: string }> = [
      { id: 'temperature', label: panelText(this.hass, 'Temperature') },
      { id: 'humidity', label: panelText(this.hass, 'Humidity') },
      { id: 'co2', label: 'CO₂' },
    ];

    return html`
      <section class="room-aggregation" aria-labelledby="room-results-title">
        <div class="room-aggregation-header">
          <ha-icon icon="mdi:vector-combine"></ha-icon>
          <div>
            <strong id="room-results-title">${panelText(this.hass, 'Room-wide results')}</strong>
            <span>${panelText(this.hass, 'Combine multiple CeilSense and UltimateSensor devices into reliable values for this room.')}</span>
          </div>
        </div>

        <div class="aggregation-status ${presenceStatus}" role="status">
          <ha-icon icon="${presenceIcon}"></ha-icon>
          <span>${panelText(this.hass, 'Combined presence')}: ${statusLabel}${runtime?.presence?.degraded ? ` · ${panelText(this.hass, 'Degraded')}` : ''}</span>
        </div>

        <div class="aggregation-block">
          <h4>${panelText(this.hass, 'Presence sources')}</h4>
          <p class="aggregation-help">${panelText(this.hass, 'Any available positive sensor marks the room occupied. The room only clears when every selected sensor is available and clear.')}</p>
          <div class="source-health-list">
            ${linkedSources.length ? linkedSources.map((source, index) => {
              const detail = runtime?.sources?.find(item => item.source_id === source.id);
              const state = detail?.status || 'unknown';
              const modules = detail?.radar_modules?.length
                ? detail.radar_modules.map(module => module.toUpperCase()).join(' + ')
                : panelText(this.hass, 'Capabilities not reported');
              const age = detail?.age_seconds === null || detail?.age_seconds === undefined
                ? panelText(this.hass, 'No fresh update')
                : panelText(this.hass, '{seconds}s ago', { seconds: Math.round(detail.age_seconds) });
              return html`
                <label class="source-health">
                  <input type="checkbox"
                    .checked="${this._presenceSourceEnabled(source.id)}"
                    ?disabled="${this._presenceSourceEnabled(source.id) && linkedSources.filter(item => this._presenceSourceEnabled(item.id)).length <= 1}"
                    @change="${(event: Event) => this._togglePresenceSource(source.id, (event.target as HTMLInputElement).checked)}"
                    aria-label="${panelText(this.hass, 'Use {name} for combined presence', { name: this._sensorLabel(source, index) })}"
                  />
                  <span class="source-health-main">
                    <strong>${this._sensorLabel(source, index)}</strong>
                    <small>${modules} · ${age}</small>
                  </span>
                  <span class="source-state ${state}">${panelText(this.hass, state === 'positive' ? 'Occupied' : state === 'negative' ? 'Clear' : 'Unknown')}</span>
                </label>
              `;
            }) : html`<p class="aggregation-help">${panelText(this.hass, 'Link at least one supported sensor to create room-wide results.')}</p>`}
          </div>
          <div class="aggregation-grid">
            <div class="aggregation-field">
              <label for="room-clear-delay">${panelText(this.hass, 'Clear delay (seconds)')}</label>
              <input id="room-clear-delay" type="number" min="0" max="600" step="5"
                .value="${String(this._aggregation.presence.vacancy_delay_seconds)}"
                @change="${(event: Event) => this._setPresenceNumber('vacancy_delay_seconds', this._commitNumberInput(event, 30, 0, 600))}" />
            </div>
          </div>
        </div>

        <div class="aggregation-block">
          <h4>${panelText(this.hass, 'Room climate')}</h4>
          <p class="aggregation-help">${panelText(this.hass, 'Average available readings, choose one primary sensor, or keep the individual sensor entities separate.')}</p>
          ${metrics.map(metric => {
            const setting = this._aggregation.climate[metric.id];
            return html`
              <div class="climate-row">
                <label for="climate-${metric.id}">${metric.label}</label>
                <div class="climate-controls">
                  <select id="climate-${metric.id}" .value="${setting.strategy}"
                    @change="${(event: Event) => this._setClimateStrategy(metric.id, (event.target as HTMLSelectElement).value as RoomClimateStrategy)}">
                    <option value="average">${panelText(this.hass, 'Average available readings')}</option>
                    <option value="primary">${panelText(this.hass, 'Primary sensor')}</option>
                    <option value="separate">${panelText(this.hass, 'Keep separate')}</option>
                  </select>
                  ${setting.strategy === 'primary' ? html`
                    <select aria-label="${panelText(this.hass, 'Primary sensor for {metric}', { metric: metric.label })}"
                      .value="${setting.primary_source_id || ''}"
                      @change="${(event: Event) => this._setClimatePrimary(metric.id, (event.target as HTMLSelectElement).value)}">
                      <option value="">${panelText(this.hass, 'Select a sensor')}</option>
                      ${linkedSources.map((source, index) => html`
                        <option value="${source.id}">${this._sensorLabel(source, index)}</option>
                      `)}
                    </select>
                  ` : nothing}
                </div>
              </div>
            `;
          })}
        </div>

        <div class="aggregation-block">
          <h4>${panelText(this.hass, 'Large-room tracking')}</h4>
          <p class="aggregation-help">${panelText(this.hass, 'Create one continuous room track when a person walks from one radar range into another. Local track IDs always remain tied to their source sensor.')}</p>
          <div class="aggregation-status ${fusionAvailable ? 'clear' : 'unknown'}" role="status">
            <ha-icon icon="${fusionAvailable ? 'mdi:check-decagram-outline' : 'mdi:map-marker-alert-outline'}"></ha-icon>
            <span>${revocationPending
              ? panelText(this.hass, 'Safety revocation is pending. Fusion and alignment controls stay disabled.')
              : fusionStatus.ready
              ? panelText(this.hass, 'Alignment verified. Room-wide handover is ready.')
              : positioningSources.length < 2
                ? panelText(this.hass, 'Link at least two positioning radars to enable room-wide handover.')
                : fusionStatus.staleSourceIds.length
                  ? panelText(this.hass, 'A sensor placement changed. Repeat the alignment test before fusion can resume.')
                  : panelText(this.hass, 'Walk test required before overlapping tracks can be merged.')}</span>
          </div>
          ${positioningSources.length >= 2 ? html`
            <div class="fusion-calibration">
              <div>
                <strong>${panelText(this.hass, 'Neighbouring overlap alignment')}</strong>
                <p class="aggregation-help">${panelText(this.hass, 'Keep one person visible to two neighbouring radars and capture three well-separated positions. Then repeat in the next overlap until all radars are connected. The test never rewrites radar coordinates.')}</p>
              </div>
              <div class="fusion-calibration-actions">
                <button class="secondary-action" ?disabled=${revocationPending} @click=${this._captureAlignmentPoint}>
                  <ha-icon icon="mdi:crosshairs-gps"></ha-icon>
                  ${panelText(this.hass, 'Capture overlap position')}
                </button>
                <button class="secondary-action" ?disabled=${revocationPending} @click=${this._resetAlignment}>
                  <ha-icon icon="mdi:restart"></ha-icon>${panelText(this.hass, 'Restart test')}
                </button>
              </div>
              ${this._alignmentFeedback ? html`<p class="aggregation-help" role="status">${this._alignmentFeedback}</p>` : nothing}
              ${this._alignmentRevocationError ? html`<p class="dialog-error" role="alert">${this._alignmentRevocationError}</p>` : nothing}
            </div>
          ` : nothing}
          <div class="fusion-toggle">
            <label for="experimental-fusion">${panelText(this.hass, 'Experimental overlapping-track fusion')}</label>
            <input id="experimental-fusion" type="checkbox"
              .checked="${this._aggregation.tracking.experimental_fusion && fusionAvailable}"
              ?disabled="${!fusionAvailable}"
              @change="${(event: Event) => {
                if ((event.target as HTMLInputElement).checked && !fusionAvailable) return;
                this._aggregation = {
                  ...this._aggregation,
                  tracking: { ...this._aggregation.tracking, experimental_fusion: (event.target as HTMLInputElement).checked },
                };
                this._markDirty();
              }}" />
          </div>
          <p class="aggregation-help">${panelText(this.hass, 'Without verified alignment, every source track stays visible and the combined people count remains unknown. Held tracks are kept only briefly in this browser for smooth handover and are not uploaded.')}</p>
          ${this._aggregation.tracking.experimental_fusion && fusionAvailable ? html`
            <div class="aggregation-grid" style="margin-top: 8px;">
              <div class="aggregation-field">
              <label for="fusion-distance">${panelText(this.hass, 'Duplicate track distance (mm)')}</label>
              <input id="fusion-distance" type="number" min="150" max="1500" step="50"
                .value="${String(this._aggregation.tracking.duplicate_distance_mm)}"
                @change="${(event: Event) => {
                  const duplicateDistance = this._commitNumberInput(event, 650, 150, 1500);
                  this._aggregation = {
                    ...this._aggregation,
                    tracking: {
                      ...this._aggregation.tracking,
                      duplicate_distance_mm: duplicateDistance,
                      experimental_fusion: false,
                      source_alignments: {},
                    },
                  };
                  this._alignmentSamples = [];
                  this._alignmentSampleFingerprint = null;
                  this._alignmentFeedback = panelText(
                    this.hass,
                    'Duplicate distance changed. Repeat the neighbouring overlap alignment before fusion can resume.',
                  );
                  this._roomTrackEngine.reset();
                  this._associationGate.reset();
                  this._fusionAssociationAmbiguous = false;
                  this._markDirty();
                }}" />
              </div>
              <div class="aggregation-field">
                <label for="fusion-z-distance">${panelText(this.hass, 'Verified Z difference (mm)')}</label>
                <input id="fusion-z-distance" type="number" min="100" max="2000" step="50"
                  .value="${String(this._aggregation.tracking.z_tolerance_mm)}"
                  @change="${(event: Event) => {
                    this._aggregation = { ...this._aggregation, tracking: {
                      ...this._aggregation.tracking,
                      z_tolerance_mm: this._commitNumberInput(event, 700, 100, 2000),
                    } };
                    this._markDirty();
                  }}" />
              </div>
            </div>
          ` : nothing}

          ${positioningSources.some(source => this._findRadarDevice(source.deviceId)?.targets.some(target => target.z_entity_id)) ? html`
            <div class="z-mapping-panel">
              <strong>${panelText(this.hass, '3D target point')}</strong>
              <p class="aggregation-help">${panelText(this.hass, 'A radar Z axis is not automatically body height. Keep Raw Z selected unless you have physically verified the axis. The 3D view labels the result as a target point, never as measured person height.')}</p>
              ${positioningSources.map((source, index) => {
                const hasZ = this._findRadarDevice(source.deviceId)?.targets.some(target => target.z_entity_id);
                if (!hasZ) return nothing;
                const storedMapping = source.zMapping || { mode: 'raw' as const, verified: false };
                const mapping = this._effectiveZMapping(source);
                return html`
                  <div class="z-mapping-row">
                    <label for="z-mode-${source.id}">${this._sensorLabel(source, index)}</label>
                    <select id="z-mode-${source.id}" .value=${storedMapping.mode}
                      @change=${(event: Event) => this._setSensorZMapping(
                        source.id,
                        (event.target as HTMLSelectElement).value as ZMapping['mode'],
                        false,
                      )}>
                      <option value="raw">${panelText(this.hass, 'Raw Z only (no height claim)')}</option>
                      <option value="floor_up">${panelText(this.hass, 'Verified: Z increases from the floor')}</option>
                      <option value="sensor_down">${panelText(this.hass, 'Verified: Z is distance down from the sensor')}</option>
                    </select>
                    ${storedMapping.mode !== 'raw' ? html`
                      <label class="z-confirmation">
                        <input type="checkbox" .checked=${mapping.verified}
                          @change=${(event: Event) => this._setSensorZMapping(source.id, storedMapping.mode, (event.target as HTMLInputElement).checked)} />
                        ${panelText(this.hass, 'I verified this direction with a real movement test')}
                      </label>
                    ` : nothing}
                  </div>
                `;
              })}
            </div>
          ` : nothing}
        </div>
      </section>
    `;
  }

  private async _saveRoom() {
    if (!this._selectedRoomId || this._saving || this.hardwareContext?.readOnly) return;
    const roomId = this._selectedRoomId;
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;
    const saveRevision = this._editRevision;
    this._saving = true;
    if (this.hardwareOnly) this._hardwareFeedback = null;

    try {
      // The drawer owns only hardware/aggregation metadata. Never rebuild the
      // room geometry here: doing so used to round coordinates, normalise zone
      // IDs and silently invalidate the saved floorplan project.
      const updatedRoom = this.hardwareOnly
        ? this._hardwareRoomSnapshot(room)
        : this._currentRoomSnapshot(room);
      const result = await this.hass.callWS<{ room: Room }>({ type: 'smarthomeshop/room/save', room: updatedRoom });
      this._replaceRoomFromServer(result.room);
      if (this._selectedRoomId === roomId) {
        const savedSources = new Map((result.room.sensors || []).map(source => [source.id, source]));
        this._sensors = this._sensors.map(source => {
          const saved = savedSources.get(source.id);
          return saved ? {
            ...source,
            sourceVersion: saved.source_version ?? source.sourceVersion,
            configuredAt: saved.configured_at ?? source.configuredAt,
            radarModules: saved.radar_modules ?? source.radarModules,
            capabilities: saved.capabilities ?? source.capabilities,
          } : source;
        });
      }
      await this._refreshRoomRuntime();
      if (this._selectedRoomId === roomId && this._editRevision === saveRevision) this._dirty = false;
      if (this.hardwareOnly) {
        this._hardwareFeedback = { status: 'success', message: this._radarText('Calibration saved.', 'Kalibratie opgeslagen.') };
        this.dispatchEvent(new CustomEvent('radar-calibration-saved', {
          bubbles: true, composed: true, detail: { room: result.room, previousRevision: room.updated_at },
        }));
      }
    } catch (err: unknown) {
      console.error('Failed to save room:', err);
      const code = (err as { code?: string } | undefined)?.code;
      if (this.hardwareOnly) {
        const conflict = code === 'conflict';
        this._hardwareFeedback = { status: 'warning', conflict, message: conflict
          ? this._radarText('This room changed elsewhere. Reload it before measuring again.', 'Deze kamer is elders gewijzigd. Herlaad de kamer voordat je opnieuw meet.')
          : this._roomMutationError(err, 'Could not save the room. Check the connection and try again.') };
        return;
      }
      if (code === 'conflict') {
        const reload = window.confirm(panelText(
          this.hass,
          'This room changed or was removed in another browser. Reload the Floorplan Designer now? Unsaved changes in this room will be discarded.',
        ));
        if (reload) await this._reloadRoomAfterConflict(roomId);
      } else {
        window.alert(this._roomMutationError(err, 'Could not save the room. Check the connection and try again.'));
      }
    }
    finally {
      this._saving = false;
    }
  }

  @state() private _pushingToESPHome = false;

  private _entityExists(entityId: string): boolean {
    return !!this.hass?.states?.[entityId];
  }

  private _deviceEntity(
    deviceId: string,
    domain: string,
    suffixes: string[],
    originalNames: string[] = [],
  ): string | null {
    return findDeviceEntity(this.hass?.entities, deviceId, domain, suffixes, originalNames);
  }

  private async _setTextEntityIfPresent(entityId: string, value: string): Promise<boolean> {
    if (!this._entityExists(entityId)) return false;
    if (value.length > 255) {
      throw new Error(`${entityId} value is ${value.length} characters; LD2450 text entities allow 255 characters`);
    }
    await this.hass.callService('text', 'set_value', { entity_id: entityId, value });
    return true;
  }

  private async _turnOnSwitchIfPresent(entityId: string): Promise<boolean> {
    if (!this._entityExists(entityId)) return false;
    await this.hass.callService('switch', 'turn_on', { entity_id: entityId });
    return true;
  }

  private async _setSwitchIfPresent(entityId: string, enabled: boolean): Promise<boolean> {
    if (!this._entityExists(entityId)) return false;
    await this.hass.callService('switch', enabled ? 'turn_on' : 'turn_off', { entity_id: entityId });
    return true;
  }

  private async _setNumberIfPresent(entityId: string, value: number): Promise<boolean> {
    if (!this._entityExists(entityId)) return false;
    await this.hass.callService('number', 'set_value', { entity_id: entityId, value });
    return true;
  }

  private async _pushToESPHome() {
    if (this._pushingToESPHome || this.hardwareContext?.readOnly || (this.hardwareOnly && this._dirty)) return;
    const notify = (message: string, status: 'success' | 'warning' = 'warning') => {
      if (this.hardwareOnly) this._hardwareFeedback = { message, status };
      else alert(message);
    };
    if (this.hardwareOnly) this._hardwareFeedback = null;
    const linkedSensors = this._sensors.filter(sn => sn.deviceId);
    if (linkedSensors.length === 0) {
      notify(panelText(this.hass, 'Add a sensor and link it to a device first!'));
      return;
    }
    const mismatched = linkedSensors
      .map(sensor => this._findRadarDevice(sensor.deviceId))
      .filter((radar): radar is RadarDevice => this._hardwareModeMismatch(radar));
    if (mismatched.length) {
      notify(panelText(this.hass, 'Set the required radar hardware mode for {names} before sending zones.', {
        names: mismatched.map(radar => radar.name).join(', '),
      }));
      return;
    }
    const unreadyPositioningRadar = linkedSensors
      .map(sensor => this._findRadarDevice(sensor.deviceId))
      .filter((radar): radar is RadarDevice => Boolean(
        radar
        && ['ld2460', 'ld6002b'].includes(radar.profile.radarModel)
        && !this._ld2460InstallationReady(radar),
      ));
    if (unreadyPositioningRadar.length) {
      notify(panelText(this.hass, 'Wait until {names} reports the required mounting settings before sending zones.', {
        names: unreadyPositioningRadar.map(radar => radar.name).join(', '),
      }));
      return;
    }
    const manualExclusionPartsFor = (sensor: SensorInstance) => this._zones
      .filter(zone => zone.type === 'exclusion' && zoneAppliesToSensor(zone, sensor.id))
      .flatMap(zone => getZoneParts(zone));
    const reflectionOverflow = linkedSensors.find(sensor =>
      manualExclusionPartsFor(sensor).length
        + createMirrorReflectionPolygons(this._roomPoints, this._mirrors, sensor).length > ZONE_LIMITS.exclusion
    );
    if (reflectionOverflow) {
      const reflectionCount = createMirrorReflectionPolygons(this._roomPoints, this._mirrors, reflectionOverflow).length;
      notify(panelText(
        this.hass,
        'Reflection protection needs {total} exclusion slots for {sensor}, but the radar supports 2. Disable protection for a mirror or remove a manual exclusion zone.',
        {
          total: manualExclusionPartsFor(reflectionOverflow).length + reflectionCount,
          sensor: this._sensorLabel(reflectionOverflow, linkedSensors.indexOf(reflectionOverflow)),
        },
      ));
      return;
    }
    const oversizedPolygon = this._zones
      .filter(zone => zone.type !== 'entry')
      .flatMap(zone => getZoneParts(zone).map(points => ({ zone, points })))
      .find(item => item.points.length > 20);
    if (oversizedPolygon) {
      notify(panelText(
        this.hass,
        '{name} has {count} vertices. LD2450 and LD2460 polygons support at most 20.',
        { name: oversizedPolygon.zone.name, count: oversizedPolygon.points.length },
      ));
      return;
    }
    this._pushingToESPHome = true;

    const detectionZones = this._zones.filter(z => z.type === 'detection');
    const exclusionZones = this._zones.filter(z => z.type === 'exclusion');
    const interferenceZones = this._zones.filter(z => z.type === 'interference');
    const entryLines = this._zones.filter(z => z.type === 'entry');
    const defaultLineOwner = linkedSensors[0].id;
    const errors: string[] = [];
    let nativePushCount = 0;
    let legacyPushCount = 0;

    try {
      for (const sensor of linkedSensors) {
        const radar = this._findRadarDevice(sensor.deviceId);
        const deviceName = radar?.entityPrefix || sensor.deviceId!;
        const registryDeviceId = radar?.id || sensor.deviceId!;
        const maximumTargets = Math.max(1, radar?.profile.maximumTargets || 3);
        // The firmware evaluates targets in sensor-local coordinates, so convert
        // room coordinates to this sensor's frame (inverse of the live-target
        // transform used for rendering).
        const rotRad = (sensor.rotation - 90) * Math.PI / 180;
        const toSensor = (pt: Point): Point => {
          const dx = pt.x - sensor.x;
          const dy = pt.y - sensor.y;
          return {
            x: -dx * Math.sin(rotRad) + dy * Math.cos(rotRad),
            y: dx * Math.cos(rotRad) + dy * Math.sin(rotRad),
          };
        };
        const toPolygonStr = (points: Point[]): string =>
          serializeRadarPolygon(points.map(toSensor));
        const toZoneSlots = (zones: ZoneData[], maxSlots: number, label: string): Array<{ zone: ZoneData, polygon: string }> => {
          const slots = zones.flatMap(zone =>
            getZoneParts(zone).map(points => ({ zone, polygon: toPolygonStr(points) }))
          );
          if (slots.length > maxSlots) {
            errors.push(panelText(
              this.hass,
              '{device}: {label} uses {count} polygon parts, but this firmware supports {maximum}; only the first {maximum} were pushed',
              {
                device: deviceName,
                label: panelText(this.hass, label),
                count: slots.length,
                maximum: maxSlots,
              },
            ));
          }
          return slots.slice(0, maxSlots);
        };
        const ownedDetectionZones = detectionZones.filter(zone => zoneAppliesToSensor(zone, sensor.id));
        const ownedExclusionZones = exclusionZones.filter(zone => zoneAppliesToSensor(zone, sensor.id));
        const ownedInterferenceZones = interferenceZones.filter(zone => zoneAppliesToSensor(zone, sensor.id));
        const detectionSlots = toZoneSlots(ownedDetectionZones, 4, 'detection zones');
        const manualExclusions = ownedExclusionZones.flatMap(zone =>
          getZoneParts(zone).map(points => ({ zone, points }))
        );
        const reflectionPolygons = createMirrorReflectionPolygons(this._roomPoints, this._mirrors, sensor);
        const exclusionAllocation = allocateReflectionExclusions(
          manualExclusions.map(item => item.points),
          reflectionPolygons,
          ZONE_LIMITS.exclusion,
        );
        const exclusionSlots = exclusionAllocation.polygons.map((points, index) => ({
          zone: manualExclusions[index]?.zone,
          polygon: toPolygonStr(points),
        }));
        const toProfileStr = (zone: ZoneData | undefined): string => {
          const profile = zone?.profile || PROFILE_DEFAULTS.default;
          return `${profile.enterDelayMs},${profile.leaveDelayMs},${profile.minDwellMs},${Math.min(profile.minTargets, maximumTargets)}`;
        };

        const deviceEntity = (domain: string, suffix: string, originalName?: string): string | null =>
          this._deviceEntity(
            registryDeviceId,
            domain,
            [suffix],
            originalName ? [originalName] : [],
          );
        const hasNativeZoneTextApi = [
          deviceEntity('text', 'polygon_zone_1', 'Polygon Zone 1'),
          deviceEntity('text', 'polygon_exclusion_1', 'Polygon Exclusion 1'),
          deviceEntity('text', 'entry_line_1', 'Entry Line 1'),
        ].some(entityId => Boolean(entityId && this._entityExists(entityId)));

        if (hasNativeZoneTextApi) {
          const polygonEnabled = deviceEntity('switch', 'polygon_zones_enabled', 'Polygon Zones Enabled');
          if (polygonEnabled) await this._turnOnSwitchIfPresent(polygonEnabled);

          for (let i = 0; i < 4; i++) {
            const slot = detectionSlots[i];
            const entityId = deviceEntity('text', `polygon_zone_${i + 1}`, `Polygon Zone ${i + 1}`);
            const pushed = entityId ? await this._setTextEntityIfPresent(entityId, slot?.polygon || '') : false;
            if (!pushed) errors.push(panelText(this.hass, '{name}: firmware entity {entity} is missing.', {
              name: radar?.name || deviceName, entity: `polygon zone ${i + 1}`,
            }));
            const profileEntity = deviceEntity('text', `zone_profile_${i + 1}`, `Zone Profile ${i + 1}`);
            if (profileEntity) await this._setTextEntityIfPresent(profileEntity, toProfileStr(slot?.zone));
          }

          for (let i = 0; i < 2; i++) {
            const slot = exclusionSlots[i];
            const entityId = deviceEntity('text', `polygon_exclusion_${i + 1}`, `Polygon Exclusion ${i + 1}`);
            const pushed = entityId ? await this._setTextEntityIfPresent(entityId, slot?.polygon || '') : false;
            if (!pushed) errors.push(panelText(this.hass, '{name}: firmware entity {entity} is missing.', {
              name: radar?.name || deviceName, entity: `polygon exclusion ${i + 1}`,
            }));
          }

          for (let i = 0; i < 2; i++) {
            const zone = ownedInterferenceZones[i];
            const entityId = deviceEntity('text', `interference_zone_${i + 1}`, `Interference Zone ${i + 1}`);
            const polygon = zone ? toPolygonStr(getZoneParts(zone)[0] || []) : '';
            const pushed = entityId ? await this._setTextEntityIfPresent(entityId, polygon) : false;
            if (zone && !pushed) errors.push(panelText(this.hass, '{name}: update the firmware to use interference zones.', { name: deviceName }));
          }

          const smoothingEnabled = deviceEntity('switch', 'target_smoothing_enabled', 'Target Smoothing Enabled');
          const crossZoneTracking = deviceEntity('switch', 'cross_zone_tracking', 'Cross Zone Tracking');
          const smoothing = deviceEntity('number', 'target_smoothing', 'Target Smoothing');
          const maxJump = deviceEntity('number', 'tracking_max_jump', 'Tracking Max Jump');
          const holdTime = deviceEntity('number', 'tracking_hold_time', 'Tracking Hold Time');
          if (smoothingEnabled) await this._setSwitchIfPresent(smoothingEnabled, this._tracking.smoothingEnabled);
          if (crossZoneTracking) await this._setSwitchIfPresent(crossZoneTracking, this._tracking.crossZoneTracking);
          if (smoothing) await this._setNumberIfPresent(smoothing, this._tracking.smoothingAlpha);
          if (maxJump) await this._setNumberIfPresent(maxJump, this._tracking.maxJumpMm);
          if (holdTime) await this._setNumberIfPresent(holdTime, this._tracking.trackHoldMs / 1000);

          const ownedLines = entryLines.filter(l => (l.sensorId || defaultLineOwner) === sensor.id);
          for (let i = 0; i < 2; i++) {
            const line = ownedLines[i];
            let lineStr = '';
            if (line && line.points.length === 2) {
              const dir = line.inDirection || 'left';
              const p1 = toSensor(line.points[0]);
              const p2 = toSensor(line.points[1]);
              lineStr = `${Math.round(p1.x)}:${Math.round(p1.y)};${Math.round(p2.x)}:${Math.round(p2.y)};${dir}`;
            }
            const entityId = deviceEntity('text', `entry_line_${i + 1}`, `Entry Line ${i + 1}`);
            const pushed = entityId ? await this._setTextEntityIfPresent(entityId, lineStr) : false;
            if (!pushed) errors.push(panelText(this.hass, '{name}: firmware entity {entity} is missing.', {
              name: radar?.name || deviceName, entity: `entry line ${i + 1}`,
            }));
          }

          nativePushCount += 1;
          continue;
        }

        const fallbackPrefixes = Array.from(new Set([
          deviceName,
          ...(radar?.aliases || []),
        ].filter(Boolean)));
        const polygonZoneService = resolveESPHomeDeviceService(
          this.hass.services,
          this.hass.entities,
          registryDeviceId,
          'set_polygon_zone',
          fallbackPrefixes,
        );
        const polygonExclusionService = resolveESPHomeDeviceService(
          this.hass.services,
          this.hass.entities,
          registryDeviceId,
          'set_polygon_exclusion',
          fallbackPrefixes,
        );
        const entryLineService = resolveESPHomeDeviceService(
          this.hass.services,
          this.hass.entities,
          registryDeviceId,
          'set_entry_line',
          fallbackPrefixes,
        );
        errors.push(panelText(this.hass, '{name}: native polygon entities are unavailable; compatible ESPHome services were used.', {
          name: radar?.name || deviceName,
        }));

        // Detection zones: every sensor watches the same room zones
        for (let i = 0; polygonZoneService && i < 4; i++) {
          const slot = detectionSlots[i];
          try {
            await this.hass.callService('esphome', polygonZoneService, {
              zone_id: i + 1,
              polygon: slot?.polygon || '',
            });
          } catch (e) {
            errors.push(panelText(this.hass, '{name}: service {service} is unavailable.', { name: deviceName, service: 'set_polygon_zone' }));
            break;
          }
        }
        if (!polygonZoneService) errors.push(panelText(this.hass, '{name}: service {service} is unavailable.', { name: radar?.name || deviceName, service: 'set_polygon_zone' }));

        // Exclusion zones
        for (let i = 0; polygonExclusionService && i < 2; i++) {
          const slot = exclusionSlots[i];
          try {
            await this.hass.callService('esphome', polygonExclusionService, {
              zone_id: i + 1,
              polygon: slot?.polygon || '',
            });
          } catch (e) {
            errors.push(panelText(this.hass, '{name}: service {service} is unavailable.', { name: deviceName, service: 'set_polygon_exclusion' }));
            break;
          }
        }
        if (!polygonExclusionService) errors.push(panelText(this.hass, '{name}: service {service} is unavailable.', { name: radar?.name || deviceName, service: 'set_polygon_exclusion' }));

        // Entry lines: each line is counted by exactly ONE sensor so people
        // walking through a doorway are not counted twice.
        const ownedLines = entryLines.filter(l => (l.sensorId || defaultLineOwner) === sensor.id);
        for (let i = 0; entryLineService && i < 2; i++) {
          const line = ownedLines[i];
          let lineStr = '';
          if (line && line.points.length === 2) {
            const dir = line.inDirection || 'left';
            const p1 = toSensor(line.points[0]);
            const p2 = toSensor(line.points[1]);
            lineStr = `${Math.round(p1.x)}:${Math.round(p1.y)};${Math.round(p2.x)}:${Math.round(p2.y)};${dir}`;
          }
          try {
            await this.hass.callService('esphome', entryLineService, {
              line_id: i + 1,
              line_data: lineStr,
            });
          } catch (e) {
            errors.push(panelText(this.hass, '{name}: service {service} is unavailable.', { name: deviceName, service: 'set_entry_line' }));
            break;
          }
        }
        if (!entryLineService) errors.push(panelText(this.hass, '{name}: service {service} is unavailable.', { name: radar?.name || deviceName, service: 'set_entry_line' }));
        legacyPushCount += 1;
      }

      if (errors.length > 0) {
        notify(`${this._radarText('Push finished with warnings', 'Verzonden met meldingen')}:\n${[...new Set(errors)].join('\n')}`);
      } else {
        const count = nativePushCount || legacyPushCount || linkedSensors.length;
        notify(this.hardwareOnly ? this._radarText('Zones sent to the room\'s radars.', 'Zones naar de radars in deze kamer gestuurd.')
          : panelText(this.hass, 'Zones were sent successfully to {count} radar(s).', { count }), 'success');
      }
    } catch (err) {
      console.error('Failed to push zones:', err);
      notify(panelText(this.hass, 'Failed to send zones. Check the connection and try again.'));
    } finally {
      this._pushingToESPHome = false;
    }
  }

  private _autoZoom(includeReflections = this._toolMode === 'mirror') {
    if (this._roomPoints.length < 3) { this._zoom = 1; this._panOffset = { x: 0, y: 0 }; return; }
    const reflectionPoints = includeReflections
      ? this._sensors.filter(sensor => sensor.deviceId)
        .flatMap(sensor => createMirrorReflectionPolygons(this._roomPoints, this._mirrors, sensor))
        .flatMap(item => item.points)
      : [];
    const visiblePoints = [...this._roomPoints, ...reflectionPoints];
    const xs = visiblePoints.map(p => p.x), ys = visiblePoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = maxX - minX, h = maxY - minY;
    // Calculate zoom to fit room with 15% padding
    this._zoom = Math.min(0.85 * 10000 / Math.max(w, h), 3);
    // Calculate center of room
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    // Pan offset to center the room in the canvas
    this._panOffset = {
      x: -centerX * (CANVAS_SIZE / 10000) * this._zoom,
      y: -centerY * (CANVAS_SIZE / 10000) * this._zoom
    };
  }

  private _toCanvas(p: Point): Point {
    return { x: HALF + (p.x * CANVAS_SIZE / 10000) * this._zoom + this._panOffset.x, y: HALF + (p.y * CANVAS_SIZE / 10000) * this._zoom + this._panOffset.y };
  }

  private _fromCanvas(cx: number, cy: number): Point {
    return { x: ((cx - HALF - this._panOffset.x) / this._zoom) * 10000 / CANVAS_SIZE, y: ((cy - HALF - this._panOffset.y) / this._zoom) * 10000 / CANVAS_SIZE };
  }

  private _getSvgPoint(e: MouseEvent): Point | null {
    if (!this._svg) return null;
    const pt = this._svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = this._svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  private _calibrationPolygon(): Point[] {
    return this._calibration.enabled && this._calibration.corners.length === 4
      ? this._calibration.corners
      : [];
  }

  private _isPointInPolygon(point: Point, polygon: Point[]): boolean {
    if (polygon.length < 3) return true;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const current = polygon[i];
      const previous = polygon[j];
      const intersects = ((current.y > point.y) !== (previous.y > point.y))
        && point.x < ((previous.x - current.x) * (point.y - current.y))
          / (previous.y - current.y) + current.x;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  private _nearestPointOnSegment(point: Point, start: Point, end: Point): Point {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return { ...start };
    const position = Math.max(0, Math.min(1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    return { x: start.x + position * dx, y: start.y + position * dy };
  }

  private _constrainToCalibration(point: Point): Point {
    const polygon = this._calibrationPolygon();
    if (polygon.length < 3 || this._isPointInPolygon(point, polygon)) return point;

    let nearest = point;
    let nearestDistance = Infinity;
    polygon.forEach((start, index) => {
      const end = polygon[(index + 1) % polygon.length];
      const candidate = this._nearestPointOnSegment(point, start, end);
      const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  private _snapToGrid(p: Point, constrainToCalibration = false): Point {
    const snapped = this._calibration.snapToGrid
      ? {
          x: Math.round(p.x / this._calibration.gridSizeMm) * this._calibration.gridSizeMm,
          y: Math.round(p.y / this._calibration.gridSizeMm) * this._calibration.gridSizeMm,
        }
      : p;
    return constrainToCalibration ? this._constrainToCalibration(snapped) : snapped;
  }

  private _activeZonePart(zone: ZoneData): Point[] {
    const parts = getZoneParts(zone);
    const index = Math.max(0, Math.min(this._selectedZonePartIndex, parts.length - 1));
    return parts[index] || zone.points;
  }

  private _updateZonePart(zoneIndex: number, partIndex: number, points: Point[]) {
    this._zones = this._zones.map((zone, index) => {
      if (index !== zoneIndex) return zone;
      const parts = getZoneParts(zone).map(part => [...part]);
      parts[partIndex] = points;
      return { ...zone, points: parts[0], parts };
    });
    this._markDirty();
  }

  private _selectZone(zoneIndex: number, partIndex = 0) {
    this._selectedZoneIndex = zoneIndex;
    this._selectedZonePartIndex = partIndex;
    this._toolMode = 'zone';
  }

  private _startAddingZonePart(zoneIndex: number) {
    const zone = this._zones[zoneIndex];
    if (!zone || zone.type === 'entry') return;
    this._appendToZoneIndex = zoneIndex;
    this._selectedZoneIndex = zoneIndex;
    this._selectedZonePartIndex = getZoneParts(zone).length;
    this._drawingZone = [];
    this._pendingZonePoints = [];
    this._toolMode = 'zone';
  }

  private _removeZonePart(zoneIndex: number, partIndex: number) {
    const zone = this._zones[zoneIndex];
    if (!zone) return;
    const parts = getZoneParts(zone);
    if (parts.length <= 1) return;
    const nextParts = parts.filter((_, index) => index !== partIndex);
    this._zones = this._zones.map((item, index) => index === zoneIndex
      ? { ...item, points: nextParts[0], parts: nextParts }
      : item);
    this._selectedZonePartIndex = Math.max(0, Math.min(partIndex, nextParts.length - 1));
    this._markDirty();
  }

  // Point-in-polygon algorithm (ray casting) - check if point is inside room
  private _isPointInRoom(p: Point): boolean {
    if (this._roomPoints.length < 3) return true; // No room defined, allow anywhere

    let inside = false;
    const n = this._roomPoints.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this._roomPoints[i].x, yi = this._roomPoints[i].y;
      const xj = this._roomPoints[j].x, yj = this._roomPoints[j].y;

      if (((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  private _handleCanvasClick(e: MouseEvent) {
    if (e.button !== 0) return;
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);

    // Sensor placement: in sensor mode a click moves the selected sensor
    // (only allowed inside the room)
    if (this._toolMode === 'sensor' && this._selectedSensorIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt, true);
      if (this._isPointInRoom(snappedPt)) {
        this._updateSensor(this._selectedSensorIndex, { x: snappedPt.x, y: snappedPt.y });
      }
      return;
    }

    // Furniture placement
    if (this._toolMode === 'furniture' && this._selectedFurnitureType) {
      this._furnitureWidth = this._selectedFurnitureType.defaultWidth;
      this._furnitureHeight = this._selectedFurnitureType.defaultHeight;
      this._pendingStart = this._snapToGrid(worldPt);
      this._showFurnitureDialog = true;
      return;
    }

    // Door/window/mirror placement is handled via the wall preview mousedown
    if (this._toolMode === 'door' || this._toolMode === 'window' || this._toolMode === 'mirror') {
      return;
    }

    // Wall drawing
    if (this._toolMode === 'walls') {
      const snappedPt = this._snapToGrid(worldPt);
      // Closed rooms only grow via the wall hover preview
      if (this._roomPoints.length >= 3) return;
      if (!this._pendingStart) { this._pendingStart = snappedPt; return; }
      const first = this._roomPoints[0];
      if (first && this._roomPoints.length >= 2 && Math.hypot(snappedPt.x - first.x, snappedPt.y - first.y) < 250) {
        this._pendingStart = null;
        this._previewPoint = null;
        return;
      }
      if (this._roomPoints.length === 0) {
        this._roomPoints = [this._pendingStart, snappedPt];
      } else {
        this._roomPoints = [...this._roomPoints, snappedPt];
      }
      this._pendingStart = snappedPt;
      this._markDirty();
      return;
    }

    // Zone drawing/editing
    if (this._toolMode === 'zone') {
      const snappedPt = this._snapToGrid(worldPt, true);

      // Check if clicking on midpoint preview to add new point (only for polygon zones, not entry lines)
      if (this._zoneMidpointPreview) {
        if (this._zoneMidpointPreview.zoneIndex === -1) {
          // Add point to drawing zone
          const newPoints = [...this._drawingZone];
          newPoints.splice(this._zoneMidpointPreview.segmentIndex + 1, 0, this._zoneMidpointPreview.point);
          this._drawingZone = newPoints;
        } else if (this._selectedZoneIndex !== null) {
          // Add point to existing zone (only if it's a polygon, not entry line)
          const zone = this._zones[this._selectedZoneIndex];
          if (zone.type !== 'entry') {
            const newPoints = [...this._activeZonePart(zone)];
            newPoints.splice(this._zoneMidpointPreview.segmentIndex + 1, 0, this._zoneMidpointPreview.point);
            this._updateZonePart(this._selectedZoneIndex, this._selectedZonePartIndex, newPoints);
          }
        }
        this._zoneMidpointPreview = null;
        return;
      }

      // If no zone is being drawn, start new zone
      if (this._drawingZone.length === 0) {
        this._drawingZone = [snappedPt];
        return;
      }

      // Check if this is the second point - could be an entry line!
      if (this._drawingZone.length === 1) {
        this._drawingZone = [...this._drawingZone, snappedPt];
        // A disconnected part already belongs to an existing polygon zone. It
        // therefore never needs the zone-type picker and can continue drawing.
        if (this._appendToZoneIndex !== null) return;
        // After 2 points, show type picker - user can choose entry line OR continue drawing polygon
        this._pendingZonePoints = [...this._drawingZone];
        this._showZoneTypePicker = true;
        this._drawingZone = [];
        return;
      }

      // Check if closing the polygon zone (3+ points)
      if (this._drawingZone.length >= 3) {
        const first = this._drawingZone[0];
        if (Math.hypot(snappedPt.x - first.x, snappedPt.y - first.y) < 250) {
          if (this._appendToZoneIndex !== null) {
            const zoneIndex = this._appendToZoneIndex;
            const zone = this._zones[zoneIndex];
            const parts = [...getZoneParts(zone), [...this._drawingZone]];
            this._zones = this._zones.map((item, index) => index === zoneIndex
              ? { ...item, points: parts[0], parts }
              : item);
            this._selectedZoneIndex = zoneIndex;
            this._selectedZonePartIndex = parts.length - 1;
            this._appendToZoneIndex = null;
            this._drawingZone = [];
            this._markDirty();
            return;
          }
          // Zone is closed - show type picker for polygon
          this._pendingZonePoints = [...this._drawingZone];
          this._drawingZone = [];
          this._showZoneTypePicker = true;
          return;
        }
      }

      this._drawingZone = [...this._drawingZone, snappedPt];
    }
  }

  private _handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);

    // Delete wall corner (layout mode)
    if (this._designMode === 'layout' && (this._toolMode === 'walls' || this._toolMode === 'select')) {
      const idx = this._roomPoints.findIndex(pt => Math.hypot(pt.x - worldPt.x, pt.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._deleteWallPoint(idx);
        return;
      }
    }

    // Delete drawing zone point
    if (this._drawingZone.length > 0) {
      const idx = this._drawingZone.findIndex(p => Math.hypot(p.x - worldPt.x, p.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._drawingZone = this._drawingZone.filter((_, i) => i !== idx);
        return;
      }
    }

    // Delete selected zone point
    if (this._selectedZoneIndex !== null) {
      const zone = this._zones[this._selectedZoneIndex];
      const activePart = this._activeZonePart(zone);
      const idx = activePart.findIndex(p => Math.hypot(p.x - worldPt.x, p.y - worldPt.y) < 200);
      if (idx !== -1 && activePart.length > 3) {
        this._updateZonePart(this._selectedZoneIndex, this._selectedZonePartIndex, activePart.filter((_, i) => i !== idx));
      }
    }
  }

  private _handleCanvasMove(e: MouseEvent) {
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);
    this._cursorPos = worldPt;

    // Dragging a sensor - only allow inside room
    if (this._draggingSensorIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt, true);
      if (this._isPointInRoom(snappedPt)) {
        this._updateSensor(this._draggingSensorIndex, { x: snappedPt.x, y: snappedPt.y });
      }
      return;
    }

    // Dragging furniture
    if (this._draggingFurnitureIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      this._furniture = this._furniture.map((f, i) =>
        i === this._draggingFurnitureIndex ? { ...f, x: snappedPt.x, y: snappedPt.y } : f
      );
      this._markDirty();
      return;
    }

    // Dragging a wall corner
    if (this._draggingPointIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt);
      this._roomPoints = this._roomPoints.map((pt, i) => i === this._draggingPointIndex ? snappedPt : pt);
      this._markDirty();
      return;
    }

    // Dragging a door along its wall
    if (this._draggingDoorIndex !== null) {
      const door = this._doors[this._draggingDoorIndex];
      if (door && Number.isInteger(door.wallIndex) && door.wallIndex >= 0 && door.wallIndex < this._roomPoints.length) {
        const p1 = this._roomPoints[door.wallIndex];
        const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const wallLength = Math.hypot(dx, dy);
        if (wallLength > 0) {
          const t = Math.max(0.05, Math.min(0.95, ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / (wallLength * wallLength)));
          this._doors = this._doors.map((d, i) => i === this._draggingDoorIndex ? { ...d, position: t } : d);
          this._markDirty();
        }
      }
      return;
    }

    // Dragging a window along its wall
    if (this._draggingWindowIndex !== null) {
      const win = this._windows[this._draggingWindowIndex];
      if (win && Number.isInteger(win.wallIndex) && win.wallIndex >= 0 && win.wallIndex < this._roomPoints.length) {
        const p1 = this._roomPoints[win.wallIndex];
        const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const wallLength = Math.hypot(dx, dy);
        if (wallLength > 0) {
          const t = Math.max(0.05, Math.min(0.95, ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / (wallLength * wallLength)));
          this._windows = this._windows.map((w, i) => i === this._draggingWindowIndex ? { ...w, position: t } : w);
          this._markDirty();
        }
      }
      return;
    }

    // Dragging a mirror along its wall
    if (this._draggingMirrorIndex !== null) {
      const mirror = this._mirrors[this._draggingMirrorIndex];
      if (mirror && Number.isInteger(mirror.wallIndex) && mirror.wallIndex >= 0 && mirror.wallIndex < this._roomPoints.length) {
        const p1 = this._roomPoints[mirror.wallIndex];
        const p2 = this._roomPoints[(mirror.wallIndex + 1) % this._roomPoints.length];
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const wallLength = Math.hypot(dx, dy);
        if (wallLength > 0) {
          const position = Math.max(0.05, Math.min(0.95,
            ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / (wallLength * wallLength)));
          this._mirrors = this._mirrors.map((item, index) =>
            index === this._draggingMirrorIndex ? { ...item, position } : item);
          this._markDirty();
        }
      }
      return;
    }

    // Wall drawing preview
    if (this._toolMode === 'walls' && this._pendingStart) {
      this._previewPoint = this._snapToGrid(worldPt);
    }

    // Wall hover preview: add-point handle on the nearest wall midpoint
    if (this._designMode === 'layout' && (this._toolMode === 'walls' || this._toolMode === 'select') && this._roomPoints.length >= 3) {
      const wallInfo = this._findNearestWall(worldPt);
      if (wallInfo && wallInfo.distance < 400) {
        const p1 = this._roomPoints[wallInfo.wallIndex];
        const p2 = this._roomPoints[(wallInfo.wallIndex + 1) % this._roomPoints.length];
        this._wallHoverPreview = {
          wallIndex: wallInfo.wallIndex,
          position: 0.5,
          point: { x: p1.x + (p2.x - p1.x) * 0.5, y: p1.y + (p2.y - p1.y) * 0.5 },
        };
      } else {
        this._wallHoverPreview = null;
      }
    } else {
      this._wallHoverPreview = null;
    }

    // Door/window/mirror placement preview on the nearest wall
    if ((this._toolMode === 'door' || this._toolMode === 'window' || this._toolMode === 'mirror') && this._roomPoints.length >= 3) {
      const wallInfo = this._findNearestWall(worldPt);
      if (wallInfo) {
        const p1 = this._roomPoints[wallInfo.wallIndex];
        const p2 = this._roomPoints[(wallInfo.wallIndex + 1) % this._roomPoints.length];
        this._doorWindowPreview = {
          wallIndex: wallInfo.wallIndex,
          position: wallInfo.position,
          point: { x: p1.x + (p2.x - p1.x) * wallInfo.position, y: p1.y + (p2.y - p1.y) * wallInfo.position },
          type: this._toolMode as 'door' | 'window' | 'mirror',
        };
      } else {
        this._doorWindowPreview = null;
      }
    } else {
      this._doorWindowPreview = null;
    }

    // Dragging zone point in selected zone
    if (this._draggingZonePointIndex !== null && this._selectedZoneIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt, true);
      const zone = this._zones[this._selectedZoneIndex];
      const newPoints = [...this._activeZonePart(zone)];
      newPoints[this._draggingZonePointIndex] = snappedPt;
      this._updateZonePart(this._selectedZoneIndex, this._selectedZonePartIndex, newPoints);
      return;
    }

    // Dragging whole zone
    if (this._draggingWholeZoneIndex !== null && this._dragStartPos) {
      const dx = worldPt.x - this._dragStartPos.x;
      const dy = worldPt.y - this._dragStartPos.y;
      const zone = this._zones[this._draggingWholeZoneIndex];
      const parts = getZoneParts(zone).map(part => part.map(p => ({ x: p.x + dx, y: p.y + dy })));
      const calibration = this._calibrationPolygon();
      if (calibration.length > 0 && parts.some(part => part.some(point => !this._isPointInPolygon(point, calibration)))) {
        return;
      }
      this._zones = this._zones.map((z, i) => i === this._draggingWholeZoneIndex ? { ...z, points: parts[0], parts } : z);
      this._dragStartPos = worldPt;
      this._markDirty();
      return;
    }

    // Dragging drawing zone point
    if (this._draggingDrawingPointIndex !== null) {
      const snappedPt = this._snapToGrid(worldPt, true);
      const newPoints = [...this._drawingZone];
      newPoints[this._draggingDrawingPointIndex] = snappedPt;
      this._drawingZone = newPoints;
      return;
    }

    // Check for midpoint hover on drawing zone (for adding points while drawing)
    this._zoneMidpointPreview = null;
    if (this._toolMode === 'zone' && this._drawingZone.length >= 2) {
      // Check existing segments of drawing zone
      for (let i = 0; i < this._drawingZone.length - 1; i++) {
        const p1 = this._drawingZone[i];
        const p2 = this._drawingZone[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        if (Math.hypot(worldPt.x - midX, worldPt.y - midY) < 200) {
          this._zoneMidpointPreview = {
            zoneIndex: -1, // -1 indicates drawing zone
            segmentIndex: i,
            point: { x: midX, y: midY }
          };
          break;
        }
      }
    }

    // Check for midpoint hover on selected zone (only when not drawing)
    if (this._toolMode === 'zone' && this._selectedZoneIndex !== null && this._drawingZone.length === 0 && !this._zoneMidpointPreview) {
      const zone = this._zones[this._selectedZoneIndex];
      const activePart = this._activeZonePart(zone);
      for (let i = 0; i < activePart.length; i++) {
        const p1 = activePart[i];
        const p2 = activePart[(i + 1) % activePart.length];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        if (Math.hypot(worldPt.x - midX, worldPt.y - midY) < 200) {
          this._zoneMidpointPreview = {
            zoneIndex: this._selectedZoneIndex,
            segmentIndex: i,
            point: { x: midX, y: midY }
          };
          break;
        }
      }
    }

    // Panning
    if (this._isDragging) {
      this._panOffset = {
        x: this._panOffset.x + e.movementX,
        y: this._panOffset.y + e.movementY,
      };
    }
  }

  private _handleCanvasDown(e: MouseEvent) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      this._isDragging = true;
      return;
    }

    if (e.button !== 0) return;
    const svgPt = this._getSvgPoint(e);
    if (!svgPt) return;
    const worldPt = this._fromCanvas(svgPt.x, svgPt.y);

    // Wall corner drag start (layout mode)
    if (this._designMode === 'layout' && (this._toolMode === 'walls' || this._toolMode === 'select')) {
      const idx = this._roomPoints.findIndex(pt => Math.hypot(pt.x - worldPt.x, pt.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._draggingPointIndex = idx;
        return;
      }
    }

    // Check for sensor drag start (any sensor within grab distance)
    for (let i = 0; i < this._sensors.length; i++) {
      const sn = this._sensors[i];
      if (Math.hypot(worldPt.x - sn.x, worldPt.y - sn.y) < 200) {
        this._selectedSensorIndex = i;
        this._draggingSensorIndex = i;
        return;
      }
    }

    // Check for drawing zone point drag start
    if (this._drawingZone.length > 0) {
      const idx = this._drawingZone.findIndex(p => Math.hypot(p.x - worldPt.x, p.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._draggingDrawingPointIndex = idx;
        return;
      }
    }

    // Check for selected zone point drag start
    if (this._selectedZoneIndex !== null && this._toolMode === 'zone') {
      const zone = this._zones[this._selectedZoneIndex];
      const activePart = this._activeZonePart(zone);
      const idx = activePart.findIndex(p => Math.hypot(p.x - worldPt.x, p.y - worldPt.y) < 200);
      if (idx !== -1) {
        this._draggingZonePointIndex = idx;
        return;
      }

      // For entry lines (2 points), check if clicking near the line itself to drag whole line
      if (zone.type === 'entry' && zone.points.length === 2) {
        const p1 = zone.points[0];
        const p2 = zone.points[1];
        // Check distance from point to line segment
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq > 0) {
          const t = Math.max(0, Math.min(1, ((worldPt.x - p1.x) * dx + (worldPt.y - p1.y) * dy) / lenSq));
          const closestX = p1.x + t * dx;
          const closestY = p1.y + t * dy;
          const dist = Math.hypot(worldPt.x - closestX, worldPt.y - closestY);
          if (dist < 200) {
            this._draggingWholeZoneIndex = this._selectedZoneIndex;
            this._dragStartPos = worldPt;
            return;
          }
        }
      }

      // Check if clicking inside the selected polygon zone to drag whole zone
      const clickedPart = getZoneParts(zone).findIndex(part => this._isPointInZone(worldPt, part));
      if (clickedPart !== -1) {
        this._selectedZonePartIndex = clickedPart;
        this._draggingWholeZoneIndex = this._selectedZoneIndex;
        this._dragStartPos = worldPt;
        return;
      }
    }
  }

  private _isPointInZone(point: Point, zonePoints: Point[]): boolean {
    if (zonePoints.length < 3) return false;
    let inside = false;
    for (let i = 0, j = zonePoints.length - 1; i < zonePoints.length; j = i++) {
      const xi = zonePoints[i].x, yi = zonePoints[i].y;
      const xj = zonePoints[j].x, yj = zonePoints[j].y;
      if (((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private _targetFallsInExclusion(roomTarget: Point, sensor: SensorInstance): boolean {
    const roomPolygon = safeSuppressionRoomPolygon({
      walls: this._roomPoints.map((point, index) => {
        const next = this._roomPoints[(index + 1) % this._roomPoints.length] || point;
        return { x1: point.x, y1: point.y, x2: next.x, y2: next.y };
      }),
    });
    if (safelyOutsideRoom(roomTarget, roomPolygon)) return true;
    const manualExclusions = this._zones
      .filter(zone => zone.type === 'exclusion' && zoneAppliesToSensor(zone, sensor.id))
      .flatMap(zone => getZoneParts(zone));
    if (manualExclusions.some(points => pointInPolygon(roomTarget, points))) return true;
    return createMirrorReflectionPolygons(roomPolygon, this._mirrors, sensor)
      .some(item => pointInPolygon(roomTarget, item.points));
  }

  private _handleCanvasUp() {
    this._isDragging = false;
    this._draggingSensorIndex = null;
    this._draggingFurnitureIndex = null;
    this._draggingPointIndex = null;
    this._draggingDoorIndex = null;
    this._draggingWindowIndex = null;
    this._draggingMirrorIndex = null;
    this._draggingZonePointIndex = null;
    this._draggingDrawingPointIndex = null;
    this._draggingWholeZoneIndex = null;
    this._dragStartPos = null;
  }

  private _handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(5, this._zoom * delta));
    const svgPt = this._getSvgPoint(e);
    if (svgPt) {
      // Keep the world point under the cursor fixed while zooming
      const world = this._fromCanvas(svgPt.x, svgPt.y);
      const scale = CANVAS_SIZE / 10000;
      this._panOffset = {
        x: svgPt.x - HALF - world.x * scale * newZoom,
        y: svgPt.y - HALF - world.y * scale * newZoom,
      };
    }
    this._zoom = newZoom;
  }

  private _deleteZone(index: number) {
    this._zones = this._zones.filter((_, i) => i !== index);
    this._markDirty();
    if (this._selectedZoneIndex === index) {
      this._selectedZoneIndex = null;
      this._selectedZonePartIndex = 0;
    } else if (this._selectedZoneIndex !== null && this._selectedZoneIndex > index) {
      this._selectedZoneIndex -= 1;
    }
    if (this._editingZoneIndex === index) this._editingZoneIndex = null;
    else if (this._editingZoneIndex !== null && this._editingZoneIndex > index) this._editingZoneIndex -= 1;
    if (this._appendToZoneIndex === index) this._appendToZoneIndex = null;
    else if (this._appendToZoneIndex !== null && this._appendToZoneIndex > index) this._appendToZoneIndex -= 1;
  }

  private _updateZoneName(index: number, name: string) {
    this._zones = this._zones.map((z, i) => i === index ? { ...z, name } : z);
    this._markDirty();
  }

  private _updateZoneType(index: number, type: ZoneType) {
    this._zones = this._zones.map((z, i) => i === index ? {
      ...z,
      type,
      profile: type === 'detection' ? (z.profile || { ...PROFILE_DEFAULTS.default }) : z.profile,
    } : z);
    this._markDirty();
  }

  private _getZoneCountByType(type: ZoneType): number {
    return this._zones.filter(z => z.type === type).length;
  }

  private _canAddZone(type: ZoneType): boolean {
    return this._getZoneCountByType(type) < ZONE_LIMITS[type];
  }

  private _startDrawingZone(type: ZoneType) {
    if (!this._canAddZone(type)) return;
    this._newZoneType = type;
    this._drawingZone = [];
    this._pendingZonePoints = [];
    this._appendToZoneIndex = null;
    this._toolMode = 'zone';
    this._selectedZoneIndex = null;
    this._selectedZonePartIndex = 0;
  }

  private _startDrawingAnyZone() {
    // Check if any type is available
    const hasAvailable = (['detection', 'exclusion', 'entry', 'interference'] as ZoneType[]).some(t => this._canAddZone(t));
    if (!hasAvailable) return;
    this._drawingZone = [];
    this._pendingZonePoints = [];
    this._appendToZoneIndex = null;
    this._toolMode = 'zone';
    this._selectedZoneIndex = null;
    this._selectedZonePartIndex = 0;
  }

  private _selectZoneType(type: ZoneType) {
    if (!this._canAddZone(type)) {
      return;
    }

    // Entry line requires exactly 2 points
    if (type === 'entry') {
      if (this._pendingZonePoints.length !== 2) return;

      const countOfType = this._zones.filter(z => z.type === type).length + 1;
      this._zones = [...this._zones, {
        id: Date.now(),
        points: [...this._pendingZonePoints],
        type: type,
        name: `Entry Line ${countOfType}`,
        inDirection: 'left',  // Default: links van de lijn is "in"
      }];
      this._showZoneTypePicker = false;
      this._pendingZonePoints = [];
      this._markDirty();
      // Select the new entry line for editing direction
      this._selectedZoneIndex = this._zones.length - 1;
      this._editingZoneIndex = this._zones.length - 1;
      return;
    }

    // Polygon zones require 3+ points
    if (this._pendingZonePoints.length < 3) {
      return;
    }

    const countOfType = this._zones.filter(z => z.type === type).length + 1;
    const label = ZONE_LABELS[type];
    const points = [...this._pendingZonePoints];
    this._zones = [...this._zones, {
      id: Date.now(),
      points,
      parts: [points],
      type: type,
      name: `${label.singular} Zone ${countOfType}`,
      profile: type === 'detection' ? { ...PROFILE_DEFAULTS.default } : undefined,
    }];
    this._showZoneTypePicker = false;
    this._pendingZonePoints = [];
    this._markDirty();
  }

  private _continueDrawingPolygon() {
    // User wants to continue drawing (not create entry line)
    this._drawingZone = [...this._pendingZonePoints];
    this._pendingZonePoints = [];
    this._showZoneTypePicker = false;
  }

  private _cancelZoneTypePicker() {
    this._showZoneTypePicker = false;
    this._pendingZonePoints = [];
  }

  private _toggleEntryDirection(index: number) {
    const zone = this._zones[index];
    if (zone.type !== 'entry') return;
    const newDir = zone.inDirection === 'left' ? 'right' : 'left';
    this._zones = this._zones.map((z, i) => i === index ? { ...z, inDirection: newDir } : z);
    this._markDirty();
  }

  private _applyZoneProfile(index: number, preset: ZoneProfilePreset) {
    const defaults = PROFILE_DEFAULTS[preset === 'custom' ? 'default' : preset];
    this._zones = this._zones.map((zone, zoneIndex) => zoneIndex === index ? {
      ...zone,
      profile: preset === 'custom'
        ? { ...(zone.profile || PROFILE_DEFAULTS.default), preset }
        : { ...defaults },
    } : zone);
    this._markDirty();
  }

  private _updateZoneProfile(index: number, patch: Partial<Omit<ZoneProfile, 'preset'>>) {
    this._zones = this._zones.map((zone, zoneIndex) => zoneIndex === index ? {
      ...zone,
      profile: {
        ...(zone.profile || PROFILE_DEFAULTS.default),
        ...patch,
        preset: 'custom',
      },
    } : zone);
    this._markDirty();
  }

  private _updateCalibration(patch: Partial<RoomCalibration>) {
    this._calibration = { ...this._calibration, ...patch };
    this._markDirty();
  }

  private _sensorLocalToWorld(sensor: SensorInstance, point: Point): Point {
    return projectRadarTargetToRoom(point, sensor, this._coordinateProjection(sensor));
  }

  private _worldToSensorLocal(sensor: SensorInstance, point: Point): Point {
    return projectRoomPointToRadar(point, sensor);
  }

  private _openCoverageCalibration() {
    if (!this._selectedSensor?.deviceId || this.hardwareContext?.readOnly) return;
    const radar = this._findRadarDevice(this._selectedSensor.deviceId);
    if (!radar?.profile.positioningAvailable || !this._ld2460InstallationReady(radar)) return;
    this._coverageCalibrationStartsFresh = this._calibration.sensorId === this._selectedSensor.id
      && this._calibration.corners.length === 4;
    this._showCoverageCalibration = true;
  }

  private _saveCoverageCalibration(event: CustomEvent<{ corners: CalibrationPoint[] }>) {
    const sensor = this._selectedSensor;
    if (!sensor) return;
    const corners = event.detail.corners.map(point => this._sensorLocalToWorld(sensor, point));
    this._updateCalibration({
      enabled: true,
      corners,
      sensorId: sensor.id,
    });
    this._closeCoverageWizard();
  }

  private _closeCoverageWizard(): void {
    this._coverageCalibrationStartsFresh = false;
    this._showCoverageCalibration = false;
    if (this.hardwareOnly) void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLButtonElement>('.radar-primary')?.focus());
  }

  private _updateTracking(patch: Partial<TrackingSettings>) {
    this._tracking = { ...this._tracking, ...patch };
    this._markDirty();
  }

  private _renderZoneEditForm(zone: ZoneData, i: number) {
    if (this._editingZoneIndex !== i) return '';

    // Entry lijnen hebben een richting toggle ipv type selectie
    if (zone.type === 'entry') {
      return html`
        <div class="zone-edit-form">
          <label>Entry line name</label>
          <input type="text" .value="${zone.name}"
                 @input="${(e: Event) => this._updateZoneName(i, (e.target as HTMLInputElement).value)}"/>

          <label>IN/OUT direction</label>
          <div class="direction-toggle">
            <button class="${zone.inDirection === 'left' ? 'active in' : ''}"
                    @click="${() => this._toggleEntryDirection(i)}"
                    title="IN direction on the left of the line">
              ⬅️ IN left
            </button>
            <button class="${zone.inDirection === 'right' ? 'active in' : ''}"
                    @click="${() => this._toggleEntryDirection(i)}"
                    title="IN direction on the right of the line">
              IN right ➡️
            </button>
          </div>
          <p class="help-text">The green "IN" arrow shows the direction into the room, the red "OUT" arrow the direction out.</p>

          ${this._sensors.length > 1 ? html`
            <label>Counting sensor</label>
            <select @change="${(e: Event) => { const v = (e.target as HTMLSelectElement).value; this._zones = this._zones.map((z, zi) => zi === i ? { ...z, sensorId: v || undefined } : z); this._markDirty(); }}">
              ${this._sensors.map((sn, si) => html`<option value="${sn.id}" ?selected="${(zone.sensorId || this._sensors[0]?.id) === sn.id}">${this._sensorLabel(sn, si)}</option>`)}
            </select>
            <p class="help-text">Only this sensor counts crossings on this line, so people are not counted twice.</p>
          ` : nothing}

          <div class="edit-actions">
            <button class="cancel-btn" @click="${() => this._editingZoneIndex = null}">Close</button>
          </div>
        </div>
      `;
    }

    // Polygon zones (detection/exclusion/interference)
    const parts = getZoneParts(zone);
    const profile = zone.profile || PROFILE_DEFAULTS.default;
    const linkedTargetLimits = this._sensors
      .map(sensor => this._findRadarDevice(sensor.deviceId)?.profile.maximumTargets)
      .filter((value): value is number => Number.isFinite(value) && value! > 0);
    const maximumZoneTargets = linkedTargetLimits.length ? Math.min(...linkedTargetLimits) : 5;
    return html`
      <div class="zone-edit-form">
        <label>Zone name</label>
        <input type="text" .value="${zone.name}"
               @input="${(e: Event) => this._updateZoneName(i, (e.target as HTMLInputElement).value)}"/>
        <label>Zone type</label>
        <div class="type-switch">
          <button class="${zone.type === 'detection' ? 'active' : ''}"
                  @click="${() => this._updateZoneType(i, 'detection')}">
            📍 Detection
          </button>
          <button class="exclusion ${zone.type === 'exclusion' ? 'active' : ''}"
                  @click="${() => this._updateZoneType(i, 'exclusion')}">
            🚷 Exclusion
          </button>
          <button class="interference ${zone.type === 'interference' ? 'active' : ''}"
                  @click="${() => this._updateZoneType(i, 'interference')}">
            ⚡ Interference
          </button>
        </div>

        <label>Zone parts</label>
        <div class="direction-toggle">
          ${parts.map((_, partIndex) => html`
            <button class="${this._selectedZonePartIndex === partIndex ? 'active' : ''}"
                    @click="${() => this._selectZone(i, partIndex)}">
              Part ${partIndex + 1}
            </button>
          `)}
        </div>
        <div class="edit-actions" style="justify-content: flex-start;">
          <button class="cancel-btn" @click="${() => this._startAddingZonePart(i)}">
            <ha-icon icon="mdi:vector-polygon-plus"></ha-icon> Add separate part
          </button>
          ${parts.length > 1 ? html`
            <button class="delete-btn" @click="${() => this._removeZonePart(i, this._selectedZonePartIndex)}">
              <ha-icon icon="mdi:delete-outline"></ha-icon> Remove part
            </button>
          ` : nothing}
        </div>
        <p class="help-text">Separate parts belong to the same zone and share its presence state.</p>

        ${zone.type === 'detection' ? html`
          <label>Detection profile</label>
          <select .value="${profile.preset}" @change="${(e: Event) => this._applyZoneProfile(i, (e.target as HTMLSelectElement).value as ZoneProfilePreset)}">
            <option value="default">Default</option>
            <option value="bed">Bed / sleeping</option>
            <option value="seating">Seating area</option>
            <option value="transit">Transit / hallway</option>
            <option value="custom">Custom</option>
          </select>
          <div class="input-row">
            <div>
              <label>Enter delay (ms)</label>
              <input type="number" min="0" step="100" .value="${String(profile.enterDelayMs)}"
                     @change="${(e: Event) => this._updateZoneProfile(i, {
                       enterDelayMs: Math.round(this._commitNumberInput(e, profile.enterDelayMs, 0, 600000)),
                     })}"/>
            </div>
            <div>
              <label>Leave delay (ms)</label>
              <input type="number" min="0" step="250" .value="${String(profile.leaveDelayMs)}"
                     @change="${(e: Event) => this._updateZoneProfile(i, {
                       leaveDelayMs: Math.round(this._commitNumberInput(e, profile.leaveDelayMs, 0, 600000)),
                     })}"/>
            </div>
          </div>
          <div class="input-row">
            <div>
              <label>Minimum dwell (ms)</label>
              <input type="number" min="0" step="100" .value="${String(profile.minDwellMs)}"
                     @change="${(e: Event) => this._updateZoneProfile(i, {
                       minDwellMs: Math.round(this._commitNumberInput(e, profile.minDwellMs, 0, 600000)),
                     })}"/>
            </div>
            <div>
              <label>Minimum targets</label>
              <input type="number" min="1" max="${maximumZoneTargets}" .value="${String(Math.min(profile.minTargets, maximumZoneTargets))}"
                     @change="${(e: Event) => this._updateZoneProfile(i, {
                       minTargets: Math.round(this._commitNumberInput(e, profile.minTargets, 1, maximumZoneTargets)),
                     })}"/>
            </div>
          </div>
        ` : nothing}
        <div class="edit-actions">
          <button class="cancel-btn" @click="${() => this._editingZoneIndex = null}">Close</button>
        </div>
      </div>
    `;
  }

  private _getInstructions() {
    switch (this._toolMode) {
      case 'select':
        return { title: 'Select', text: 'Drag a sensor or select a zone to edit it.' };
      case 'sensor':
        return { title: 'Sensors', text: this._sensors.length > 0 ? 'Drag a sensor to move it, click one to select it. Manage sensors on the right.' : 'Add a sensor on the right, then drag it into position.' };
      case 'zone':
        if (this._drawingZone.length === 1) {
          return { title: 'Place point 2', text: 'Click for the second point. After 2 points you can create an entry line or continue for a polygon zone.' };
        }
        if (this._drawingZone.length > 1) {
          return { title: 'Draw Zone', text: 'Click to add points. Click the green point to close. Drag points to move them. Right-click a point to delete it.' };
        }
        if (this._selectedZoneIndex !== null) {
          const zone = this._zones[this._selectedZoneIndex];
          if (zone?.type === 'entry') {
            return { title: 'Edit Entry Line', text: 'Drag the endpoints to move the line. Use the edit menu to change the IN/OUT direction.' };
          }
          return { title: 'Edit Zone', text: 'Drag points to move them. Click a green midpoint to add a point. Right-click a point to delete it.' };
        }
        return { title: 'Draw Zone', text: 'Click to place the first point. 2 points = entry line, 3+ points = detection/exclusion zone.' };
      case 'walls':
        return { title: 'Draw Walls', text: this._roomPoints.length >= 3
          ? 'Hover a wall for the green add-point handle. Drag corners to move, right-click to delete.'
          : this._pendingStart
            ? 'Click to add corners. Click the first point to close the room. Esc cancels, Ctrl+Z undoes.'
            : 'Click to place the first corner of the room.' };
      case 'door':
        return { title: 'Add Door', text: 'Hover a wall for the purple preview and click to place. Drag existing doors along their wall.' };
      case 'window':
        return { title: 'Add Window', text: 'Hover a wall for the blue preview and click to place. Drag existing windows along their wall.' };
      case 'mirror':
        return { title: 'Add Mirror', text: 'Place the mirror on a wall, then choose whether its predicted reflection area should be excluded from tracking.' };
      case 'furniture':
        return { title: 'Place Furniture', text: this._selectedFurnitureType ? `Click the canvas to place the ${this._selectedFurnitureType.name.toLowerCase()}.` : 'Pick a furniture type on the right, or drag existing furniture. R rotates, Delete removes.' };
      default:
        return { title: 'Floorplan Designer', text: 'Pick a tool to get started.' };
    }
  }

  // ===== 3D RENDERING METHODS =====

  private _project3D(p: Point3D): Point {
    const cam = this._camera3d;
    const azRad = (cam.azimuth * Math.PI) / 180;
    const elRad = (cam.elevation * Math.PI) / 180;

    const dx = p.x - cam.targetX;
    const dy = p.y - cam.targetY;
    const dz = p.z - cam.targetZ;

    const x1 = dx * Math.cos(azRad) - dy * Math.sin(azRad);
    const y1 = dx * Math.sin(azRad) + dy * Math.cos(azRad);
    const z1 = dz;

    const y2 = y1 * Math.cos(elRad) - z1 * Math.sin(elRad);
    const z2 = y1 * Math.sin(elRad) + z1 * Math.cos(elRad);

    const fov = 60;
    const scale = (1 / Math.tan((fov * Math.PI) / 360)) * 400;
    const depth = cam.distance + y2;
    const factor = depth > 50 ? scale / depth : scale / 50;

    // Mirror X-axis to match 2D view orientation
    return { x: 400 - x1 * factor, y: 300 - z2 * factor };
  }

  // Canvas 2D cannot resolve CSS var() colors, so the 3D scene reads the
  // resolved --rd-* theme tokens once per frame and paints with those.
  private _pal3d = {
    deep: '#0f172a',
    panel: '#1e293b',
    dim: '#64748b',
    dimRgb: [100, 116, 139] as [number, number, number],
  };

  private _refresh3DPalette(): void {
    const style = getComputedStyle(this);
    const read = (token: string, fallback: string): string => {
      const value = style.getPropertyValue(token).trim();
      return value || fallback;
    };
    const toRgb = (
      color: string,
      fallback: [number, number, number],
    ): [number, number, number] => {
      const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hex) {
        let digits = hex[1];
        if (digits.length === 3) digits = digits.split('').map((c) => c + c).join('');
        return [
          parseInt(digits.slice(0, 2), 16),
          parseInt(digits.slice(2, 4), 16),
          parseInt(digits.slice(4, 6), 16),
        ];
      }
      const rgb = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
      if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
      return fallback;
    };
    const dim = read('--rd-dim', '#64748b');
    this._pal3d = {
      deep: read('--rd-deep', '#0f172a'),
      panel: read('--rd-panel', '#1e293b'),
      dim,
      dimRgb: toRgb(dim, [100, 116, 139]),
    };
  }

  private _dim3d(alpha: number): string {
    const [r, g, b] = this._pal3d.dimRgb;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private _render3DScene(): void {
    if (!this._canvas3d) return;
    const ctx = this._canvas3d.getContext('2d');
    if (!ctx) return;

    this._refresh3DPalette();
    const w = this._canvas3d.width;
    const h = this._canvas3d.height;

    // Clear with gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, this._pal3d.panel);
    bgGrad.addColorStop(1, this._pal3d.deep);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    this._draw3DGrid(ctx);
    if (this._roomPoints.length >= 3) {
      this._draw3DRoom(ctx);
      this._draw3DFurniture(ctx);
      this._draw3DDoors(ctx);
      this._draw3DWindows(ctx);
      this._draw3DMirrors(ctx);
      this._draw3DZones(ctx);
    }
    this._draw3DSensor(ctx);
    this._draw3DTargets(ctx);
  }

  private _draw3DGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this._dim3d(0.3);
    ctx.lineWidth = 1;
    const gridSize = 1000;
    const gridRange = 5000;

    for (let i = -gridRange; i <= gridRange; i += gridSize) {
      const p1 = this._project3D({ x: i, y: -gridRange, z: 0 });
      const p2 = this._project3D({ x: i, y: gridRange, z: 0 });
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

      const p3 = this._project3D({ x: -gridRange, y: i, z: 0 });
      const p4 = this._project3D({ x: gridRange, y: i, z: 0 });
      ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }
  }

  private _draw3DRoom(ctx: CanvasRenderingContext2D): void {
    const pts = this._roomPoints;
    if (pts.length < 3) return;

    // Draw floor
    ctx.fillStyle = 'rgba(67, 97, 238, 0.08)';
    ctx.strokeStyle = 'rgba(67, 97, 238, 0.4)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    const first = this._project3D({ x: pts[0].x, y: pts[0].y, z: 0 });
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const p = this._project3D({ x: pts[i].x, y: pts[i].y, z: 0 });
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sort and draw walls
    const wallsWithDepth = pts.map((p, i) => {
      const next = pts[(i + 1) % pts.length];
      const midX = (p.x + next.x) / 2;
      const midY = (p.y + next.y) / 2;
      const dist = Math.hypot(midX - this._camera3d.targetX, midY - this._camera3d.targetY);
      return { index: i, dist };
    }).sort((a, b) => b.dist - a.dist);

    for (const { index } of wallsWithDepth) {
      this._draw3DWall(ctx, index);
    }
  }

  private _draw3DWall(ctx: CanvasRenderingContext2D, wallIndex: number): void {
    const pts = this._roomPoints;
    const p1 = pts[wallIndex];
    const p2 = pts[(wallIndex + 1) % pts.length];

    const bl = this._project3D({ x: p1.x, y: p1.y, z: 0 });
    const br = this._project3D({ x: p2.x, y: p2.y, z: 0 });
    const tr = this._project3D({ x: p2.x, y: p2.y, z: this.WALL_HEIGHT_3D });
    const tl = this._project3D({ x: p1.x, y: p1.y, z: this.WALL_HEIGHT_3D });

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const normalAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const lightDir = (this._camera3d.azimuth * Math.PI) / 180;
    const shade = 0.3 + 0.4 * Math.abs(Math.cos(normalAngle - lightDir));

    const wallGrad = ctx.createLinearGradient(
      (bl.x + br.x) / 2, Math.max(bl.y, br.y),
      (tl.x + tr.x) / 2, Math.min(tl.y, tr.y)
    );
    wallGrad.addColorStop(0, this._dim3d(shade * 0.5));
    wallGrad.addColorStop(1, this._dim3d(shade * 0.2));

    ctx.fillStyle = wallGrad;
    ctx.strokeStyle = this._dim3d(0.8);
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y); ctx.lineTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y); ctx.lineTo(tl.x, tl.y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  private _draw3DFurniture(ctx: CanvasRenderingContext2D): void {
    for (const f of this._furniture) {
      const furnitureHeight = 400; // 40cm default height

      // Match the 2D editor: rotate every corner around the furniture centre.
      const corners3D = rotatedFurnitureCorners(
        f.x,
        f.y,
        f.width,
        f.height,
        resolveFurnitureRotation(f),
      ).map(corner => ({ ...corner, z: 0 }));

      // Top corners
      const topCorners3D = corners3D.map(c => ({ ...c, z: furnitureHeight }));

      // Project all corners
      const bottom = corners3D.map(c => this._project3D(c));
      const top = topCorners3D.map(c => this._project3D(c));

      // Draw top face
      ctx.fillStyle = this._dim3d(0.5);
      ctx.strokeStyle = this._pal3d.dim;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw sides
      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = this._dim3d(0.25);
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Label
      const center = this._project3D({ x: f.x, y: f.y, z: furnitureHeight + 100 });
      ctx.fillStyle = this._pal3d.dim;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.name, center.x, center.y);
    }
  }

  private _draw3DDoors(ctx: CanvasRenderingContext2D): void {
    if (this._roomPoints.length < 3) return;
    const doorHeight = 2000; // 2m high doors
    const depth = 80; // Door thickness

    for (const door of this._doors) {
      if (!Number.isInteger(door.wallIndex) || door.wallIndex < 0 || door.wallIndex >= this._roomPoints.length) continue;

      // Get wall endpoints
      const p1 = this._roomPoints[door.wallIndex];
      const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];

      // Calculate door center position on wall
      const doorX = p1.x + (p2.x - p1.x) * door.position;
      const doorY = p1.y + (p2.y - p1.y) * door.position;

      // Calculate wall angle for door orientation
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const hw = door.width / 2;

      // Door corners along the wall
      const cos = Math.cos(wallAngle);
      const sin = Math.sin(wallAngle);
      const perpCos = Math.cos(wallAngle + Math.PI / 2);
      const perpSin = Math.sin(wallAngle + Math.PI / 2);

      // Create door rectangle corners
      const worldCorners = [
        { x: doorX - hw * cos - depth/2 * perpCos, y: doorY - hw * sin - depth/2 * perpSin },
        { x: doorX + hw * cos - depth/2 * perpCos, y: doorY + hw * sin - depth/2 * perpSin },
        { x: doorX + hw * cos + depth/2 * perpCos, y: doorY + hw * sin + depth/2 * perpSin },
        { x: doorX - hw * cos + depth/2 * perpCos, y: doorY - hw * sin + depth/2 * perpSin },
      ];

      // Bottom and top corners
      const bottom = worldCorners.map(c => this._project3D({ ...c, z: 0 }));
      const top = worldCorners.map(c => this._project3D({ ...c, z: doorHeight }));

      // Draw door as 3D box (wood color)
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 1;

      // Top face
      ctx.fillStyle = 'rgba(139, 90, 43, 0.6)';
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side faces
      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(139, 90, 43, 0.5)' : 'rgba(139, 90, 43, 0.35)';
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Door label
      const labelPos = this._project3D({ x: doorX, y: doorY, z: doorHeight + 100 });
      ctx.fillStyle = '#d4a574';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚪', labelPos.x, labelPos.y);
    }
  }

  private _draw3DWindows(ctx: CanvasRenderingContext2D): void {
    if (this._roomPoints.length < 3) return;
    const windowBottom = 900;  // 90cm from ground
    const windowHeight = 1100; // 1.1m high window
    const depth = 50; // Window frame thickness

    for (const win of this._windows) {
      if (!Number.isInteger(win.wallIndex) || win.wallIndex < 0 || win.wallIndex >= this._roomPoints.length) continue;

      // Get wall endpoints
      const p1 = this._roomPoints[win.wallIndex];
      const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];

      // Calculate window center position on wall
      const winX = p1.x + (p2.x - p1.x) * win.position;
      const winY = p1.y + (p2.y - p1.y) * win.position;

      // Calculate wall angle for window orientation
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const hw = win.width / 2;

      // Window corners along the wall
      const cos = Math.cos(wallAngle);
      const sin = Math.sin(wallAngle);
      const perpCos = Math.cos(wallAngle + Math.PI / 2);
      const perpSin = Math.sin(wallAngle + Math.PI / 2);

      // Create window rectangle corners
      const worldCorners = [
        { x: winX - hw * cos - depth/2 * perpCos, y: winY - hw * sin - depth/2 * perpSin },
        { x: winX + hw * cos - depth/2 * perpCos, y: winY + hw * sin - depth/2 * perpSin },
        { x: winX + hw * cos + depth/2 * perpCos, y: winY + hw * sin + depth/2 * perpSin },
        { x: winX - hw * cos + depth/2 * perpCos, y: winY - hw * sin + depth/2 * perpSin },
      ];

      // Bottom and top corners (window sits on wall, not on ground)
      const bottom = worldCorners.map(c => this._project3D({ ...c, z: windowBottom }));
      const top = worldCorners.map(c => this._project3D({ ...c, z: windowBottom + windowHeight }));

      // Draw window as 3D box (glass color - light blue)
      ctx.strokeStyle = '#4a90a4';
      ctx.lineWidth = 1;

      // Top face
      ctx.fillStyle = 'rgba(135, 206, 235, 0.4)';
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(top[i].x, top[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side faces (glass effect)
      for (let i = 0; i < 4; i++) {
        const ni = (i + 1) % 4;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(135, 206, 235, 0.35)' : 'rgba(135, 206, 235, 0.25)';
        ctx.beginPath();
        ctx.moveTo(bottom[i].x, bottom[i].y);
        ctx.lineTo(bottom[ni].x, bottom[ni].y);
        ctx.lineTo(top[ni].x, top[ni].y);
        ctx.lineTo(top[i].x, top[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  private _draw3DMirrors(ctx: CanvasRenderingContext2D): void {
    for (const mirror of this._mirrors) {
      if (mirror.wallIndex < 0 || mirror.wallIndex >= this._roomPoints.length) continue;
      const wallStart = this._roomPoints[mirror.wallIndex];
      const wallEnd = this._roomPoints[(mirror.wallIndex + 1) % this._roomPoints.length];
      const center = {
        x: wallStart.x + (wallEnd.x - wallStart.x) * mirror.position,
        y: wallStart.y + (wallEnd.y - wallStart.y) * mirror.position,
      };
      const angle = Math.atan2(wallEnd.y - wallStart.y, wallEnd.x - wallStart.x);
      const dx = Math.cos(angle) * mirror.width / 2;
      const dy = Math.sin(angle) * mirror.width / 2;
      const bottomHeight = 300;
      const corners = [
        this._project3D({ x: center.x - dx, y: center.y - dy, z: bottomHeight }),
        this._project3D({ x: center.x + dx, y: center.y + dy, z: bottomHeight }),
        this._project3D({ x: center.x + dx, y: center.y + dy, z: bottomHeight + mirror.height }),
        this._project3D({ x: center.x - dx, y: center.y - dy, z: bottomHeight + mirror.height }),
      ];
      const gradient = ctx.createLinearGradient(corners[0].x, corners[0].y, corners[2].x, corners[2].y);
      gradient.addColorStop(0, 'rgba(226, 232, 240, 0.82)');
      gradient.addColorStop(0.45, 'rgba(125, 211, 252, 0.32)');
      gradient.addColorStop(1, 'rgba(248, 250, 252, 0.72)');
      ctx.fillStyle = gradient;
      ctx.strokeStyle = mirror.protectionEnabled ? '#22c55e' : '#64748b';
      ctx.lineWidth = mirror.protectionEnabled ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      corners.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

private _draw3DZones(ctx: CanvasRenderingContext2D): void {
    const zoneHeight = this.WALL_HEIGHT_3D; // Zones tot plafond

    for (const zone of this._zones) {
      const colors = ZONE_COLORS[zone.type];
      const pts = zone.points;

      if (zone.type === 'entry' && pts.length === 2) {
        // Draw entry line as vertical plane
        const p1 = pts[0], p2 = pts[1];
        const bl1 = this._project3D({ x: p1.x, y: p1.y, z: 0 });
        const bl2 = this._project3D({ x: p2.x, y: p2.y, z: 0 });
        const tl1 = this._project3D({ x: p1.x, y: p1.y, z: zoneHeight });
        const tl2 = this._project3D({ x: p2.x, y: p2.y, z: zoneHeight });

        ctx.fillStyle = colors.fill.replace('0.25', '0.4');
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(bl1.x, bl1.y); ctx.lineTo(bl2.x, bl2.y);
        ctx.lineTo(tl2.x, tl2.y); ctx.lineTo(tl1.x, tl1.y);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Draw direction arrows
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const mid3D = this._project3D({ x: midX, y: midY, z: zoneHeight / 2 });
        ctx.fillStyle = colors.stroke;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.inDirection === 'left' ? '← IN' : 'IN →', mid3D.x, mid3D.y);
      } else if (pts.length >= 3) {
        // Draw zone as 3D volume (floor to ceiling)

        // Draw floor
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;

        ctx.beginPath();
        const firstFloor = this._project3D({ x: pts[0].x, y: pts[0].y, z: 10 });
        ctx.moveTo(firstFloor.x, firstFloor.y);
        for (let i = 1; i < pts.length; i++) {
          const p = this._project3D({ x: pts[i].x, y: pts[i].y, z: 10 });
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Draw ceiling
        ctx.fillStyle = colors.fill.replace('0.2', '0.15');
        ctx.beginPath();
        const firstCeiling = this._project3D({ x: pts[0].x, y: pts[0].y, z: zoneHeight });
        ctx.moveTo(firstCeiling.x, firstCeiling.y);
        for (let i = 1; i < pts.length; i++) {
          const p = this._project3D({ x: pts[i].x, y: pts[i].y, z: zoneHeight });
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Draw vertical walls of the zone volume
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];

          const bl = this._project3D({ x: p1.x, y: p1.y, z: 10 });
          const br = this._project3D({ x: p2.x, y: p2.y, z: 10 });
          const tr = this._project3D({ x: p2.x, y: p2.y, z: zoneHeight });
          const tl = this._project3D({ x: p1.x, y: p1.y, z: zoneHeight });

          // Semi-transparent wall
          ctx.fillStyle = colors.fill.replace('0.2', '0.12');
          ctx.strokeStyle = colors.stroke;
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(bl.x, bl.y);
          ctx.lineTo(br.x, br.y);
          ctx.lineTo(tr.x, tr.y);
          ctx.lineTo(tl.x, tl.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Draw zone label in center at mid-height
        const centerX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const centerY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const labelPos = this._project3D({ x: centerX, y: centerY, z: zoneHeight / 2 });
        ctx.fillStyle = colors.stroke;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, labelPos.x, labelPos.y);
      }
    }
  }

  private _draw3DSensor(ctx: CanvasRenderingContext2D): void {
    for (const sn of this._sensors) {
      const sensorZ = this._effectiveSensorHeightMm(sn) ?? 2000;
      const pos = this._project3D({ x: sn.x, y: sn.y, z: sensorZ });
      const origin = this._project3D({ x: sn.x, y: sn.y, z: 0 });

      if (sn.mountingMode === 'ceiling') {
        const radius = this._coverageRadius(sn);
        const floorPoints = Array.from({ length: 33 }, (_, index) => {
          const angle = (index / 32) * Math.PI * 2;
          return this._project3D({
            x: sn.x + Math.cos(angle) * radius,
            y: sn.y + Math.sin(angle) * radius,
            z: 0,
          });
        });

        ctx.fillStyle = 'rgba(67, 97, 238, 0.13)';
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        floorPoints.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(67, 97, 238, 0.35)';
        ctx.lineWidth = 1;
        for (let index = 0; index < 32; index += 8) {
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(floorPoints[index].x, floorPoints[index].y);
          ctx.stroke();
        }
      } else {
        const fovRad = (sn.fov / 2) * Math.PI / 180;
        const rotRad = (sn.rotation - 90) * Math.PI / 180;
        const leftAngle = rotRad - fovRad;
        const rightAngle = rotRad + fovRad;
        const leftX = sn.x + Math.cos(leftAngle) * sn.range;
        const leftY = sn.y + Math.sin(leftAngle) * sn.range;
        const rightX = sn.x + Math.cos(rightAngle) * sn.range;
        const rightY = sn.y + Math.sin(rightAngle) * sn.range;
        const left = this._project3D({ x: leftX, y: leftY, z: 0 });
        const right = this._project3D({ x: rightX, y: rightY, z: 0 });

        ctx.fillStyle = 'rgba(67, 97, 238, 0.15)';
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }

      // Drop line from the sensor to its floor position (shows the height)
      ctx.strokeStyle = 'rgba(67, 97, 238, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(origin.x, origin.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#4361ee';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📡', pos.x, pos.y);
    }
  }

private _draw3DTargets(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this._roomTracks.length; i++) {
      const track = this._roomTracks[i];
      const worldX = track.x;
      const worldY = track.y;

      ctx.save();
      ctx.globalAlpha = track.held ? 0.42 : 1;

      // Draw shadow on ground
      const shadowPos = this._project3D({ x: worldX + 80, y: worldY + 80, z: 5 });
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(shadowPos.x, shadowPos.y, 25, 10, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // This neutral marker means presence at X/Y. Its visual height is not a
      // measured body height and deliberately does not depend on raw radar Z.
      // Legs (3D cylinders)
      this._draw3DCapsule(ctx, worldX - 60, worldY, 0, 60, 700, '#8b9299', '#6b7280');
      this._draw3DCapsule(ctx, worldX + 60, worldY, 0, 60, 700, '#8b9299', '#6b7280');

      // Arms (3D cylinders)
      this._draw3DCapsule(ctx, worldX - 160, worldY, 900, 50, 380, '#8b9299', '#6b7280');
      this._draw3DCapsule(ctx, worldX + 160, worldY, 900, 50, 380, '#8b9299', '#6b7280');

      // Body (3D capsule - larger)
      this._draw3DCapsule(ctx, worldX, worldY, 700, 120, 600, '#b8bfc7', '#9ca3af');

      // Head (3D sphere)
      this._draw3DSphere(ctx, worldX, worldY, 1500, 110);

      // Draw stable room-track label above the neutral marker.
      const labelPos = this._project3D({ x: worldX, y: worldY, z: 1700 });

      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.beginPath();
      ctx.arc(labelPos.x, labelPos.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(track.id.replace('room-track-', '').slice(-4), labelPos.x, labelPos.y);

      if (track.roomZMm !== null) {
        const measured = this._project3D({ x: worldX, y: worldY, z: track.roomZMm });
        const floor = this._project3D({ x: worldX, y: worldY, z: 0 });
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = 'rgba(14, 165, 233, .8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(floor.x, floor.y);
        ctx.lineTo(measured.x, measured.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(measured.x, measured.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '600 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(panelText(this.hass, '{height} m target point', { height: (track.roomZMm / 1000).toFixed(2) }), measured.x + 9, measured.y - 4);
      } else if (track.rawZMm !== null) {
        ctx.fillStyle = 'rgba(100, 116, 139, .95)';
        ctx.font = '600 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(panelText(this.hass, 'raw Z {height} m', { height: (track.rawZMm / 1000).toFixed(2) }), labelPos.x, labelPos.y - 22);
      }

      ctx.restore();
    }
  }

  private _draw3DCapsule(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    bottomZ: number,
    radius: number,
    height: number,
    fillColor: string,
    strokeColor: string
  ): void {
    const depth = radius * 0.8; // Depth in Y direction

    // Project 8 points around the capsule for 3D effect
    const segments = 8;
    const topZ = bottomZ + height;

    // Collect all faces for depth sorting
    const faces: Array<{points: Array<{x: number; y: number}>; depth: number; isTop: boolean; isSide: boolean}> = [];

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const x1 = centerX + Math.cos(angle1) * radius;
      const y1 = centerY + Math.sin(angle1) * depth;
      const x2 = centerX + Math.cos(angle2) * radius;
      const y2 = centerY + Math.sin(angle2) * depth;

      // Side face
      const bl = this._project3D({ x: x1, y: y1, z: bottomZ });
      const br = this._project3D({ x: x2, y: y2, z: bottomZ });
      const tr = this._project3D({ x: x2, y: y2, z: topZ });
      const tl = this._project3D({ x: x1, y: y1, z: topZ });

      const avgDepth = (y1 + y2) / 2;
      faces.push({
        points: [bl, br, tr, tl],
        depth: avgDepth,
        isTop: false,
        isSide: true
      });
    }

    // Top cap
    const topPoints: Array<{x: number; y: number}> = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * depth;
      topPoints.push(this._project3D({ x, y, z: topZ }));
    }
    faces.push({ points: topPoints, depth: -1000, isTop: true, isSide: false });

    // Sort by depth (back to front)
    faces.sort((a, b) => b.depth - a.depth);

    // Draw faces
    for (const face of faces) {
      ctx.beginPath();
      ctx.moveTo(face.points[0].x, face.points[0].y);
      for (let j = 1; j < face.points.length; j++) {
        ctx.lineTo(face.points[j].x, face.points[j].y);
      }
      ctx.closePath();

      if (face.isTop) {
        // Top cap - lighter
        ctx.fillStyle = fillColor;
      } else {
        // Side faces - shade based on angle
        const shade = face.depth > 0 ? 0.85 : 1.0;
        ctx.fillStyle = this._shadeColor(fillColor, shade);
      }

      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  private _draw3DSphere(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number
  ): void {
    const center = this._project3D({ x: centerX, y: centerY, z: centerZ });
    const top = this._project3D({ x: centerX, y: centerY, z: centerZ + radius });
    const screenRadius = Math.abs(center.y - top.y);

    // Create 3D sphere effect with gradient
    const gradient = ctx.createRadialGradient(
      center.x - screenRadius * 0.35, center.y - screenRadius * 0.35, 0,
      center.x, center.y, screenRadius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#e5e7eb');
    gradient.addColorStop(0.7, '#d1d5db');
    gradient.addColorStop(1, '#9ca3af');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, screenRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private _shadeColor(color: string, factor: number): string {
    // Simple color shading
    const hex = color.replace('#', '');
    const r = Math.round(parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.round(parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.round(parseInt(hex.substr(4, 2), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private _handle3DPointerDown(e: PointerEvent): void {
    if (e.button === 0 || e.pointerType === 'touch') {
      this._isDragging3D = true;
      this._active3DPointerId = e.pointerId;
      this._canvas3d?.setPointerCapture?.(e.pointerId);
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
      e.preventDefault();
    }
  }

  private _handle3DPointerMove(e: PointerEvent): void {
    if (!this._isDragging3D || this._active3DPointerId !== e.pointerId) return;

    const dx = e.clientX - this._lastMouseX;
    const dy = e.clientY - this._lastMouseY;

    this._camera3d = {
      ...this._camera3d,
      azimuth: (this._camera3d.azimuth - dx * 0.5) % 360,
      elevation: Math.max(5, Math.min(85, this._camera3d.elevation + dy * 0.3)),
    };

    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;
    this._render3DScene();
    e.preventDefault();
  }

  private _handle3DPointerUp(e?: PointerEvent): void {
    if (e && this._active3DPointerId !== null && e.pointerId !== this._active3DPointerId) return;
    if (e && this._canvas3d?.hasPointerCapture?.(e.pointerId)) this._canvas3d.releasePointerCapture(e.pointerId);
    this._isDragging3D = false;
    this._active3DPointerId = null;
  }

  private _handle3DWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    this._camera3d = {
      ...this._camera3d,
      distance: Math.max(2000, Math.min(20000, this._camera3d.distance * zoomFactor)),
    };
    this._render3DScene();
  }

  private _zoom3D(factor: number): void {
    this._camera3d = {
      ...this._camera3d,
      distance: Math.max(2000, Math.min(20000, this._camera3d.distance * factor)),
    };
    this._render3DScene();
  }

  private _rotate3D(deltaAzimuth: number, deltaElevation = 0): void {
    this._camera3d = {
      ...this._camera3d,
      azimuth: (this._camera3d.azimuth + deltaAzimuth + 360) % 360,
      elevation: Math.max(5, Math.min(85, this._camera3d.elevation + deltaElevation)),
    };
    this._render3DScene();
  }

  private _handle3DKeydown(e: KeyboardEvent): void {
    const rotate = 7.5;
    const zoom = 0.9;
    let camera = this._camera3d;
    if (e.key === 'ArrowLeft') camera = { ...camera, azimuth: (camera.azimuth + rotate) % 360 };
    else if (e.key === 'ArrowRight') camera = { ...camera, azimuth: (camera.azimuth - rotate) % 360 };
    else if (e.key === 'ArrowUp') camera = { ...camera, elevation: Math.min(85, camera.elevation + rotate) };
    else if (e.key === 'ArrowDown') camera = { ...camera, elevation: Math.max(5, camera.elevation - rotate) };
    else if (e.key === '+' || e.key === '=') camera = { ...camera, distance: Math.max(2000, camera.distance * zoom) };
    else if (e.key === '-' || e.key === '_') camera = { ...camera, distance: Math.min(20000, camera.distance / zoom) };
    else if (e.key === 'Home') {
      this._reset3DCamera();
      e.preventDefault();
      return;
    } else return;
    e.preventDefault();
    this._camera3d = camera;
    this._render3DScene();
  }

  private _reset3DCamera(): void {
    if (this._roomPoints.length >= 3) {
      const xs = this._roomPoints.map(p => p.x);
      const ys = this._roomPoints.map(p => p.y);
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));

      this._camera3d = {
        azimuth: 45, elevation: 35,
        distance: Math.max(4000, size * 1.5),
        targetX: centerX, targetY: centerY,
        targetZ: this.WALL_HEIGHT_3D / 2,
      };
    } else {
      this._camera3d = { azimuth: 45, elevation: 35, distance: 8000, targetX: 0, targetY: 0, targetZ: 1000 };
    }
    this._render3DScene();
  }

  private _toggleViewMode(): void {
    this._viewMode = this._viewMode === '2d' ? '3d' : '2d';
    if (this._viewMode === '3d') {
      this._reset3DCamera();
      requestAnimationFrame(() => {
        if (this._canvas3d) {
          this._canvas3d.width = this._canvas3d.offsetWidth;
          this._canvas3d.height = this._canvas3d.offsetHeight;
          this._render3DScene();
        }
      });
    }
  }

  private _renderGrid() {
    const lines: unknown[] = [];
    const step = this._calibration.gridSizeMm;
    const majorStep = step === 300 ? 900 : 1000;
    for (let mm = -10000; mm <= 10000; mm += step) {
      const major = mm % majorStep === 0;
      const v1 = this._toCanvas({ x: mm, y: -10000 });
      const v2 = this._toCanvas({ x: mm, y: 10000 });
      const h1 = this._toCanvas({ x: -10000, y: mm });
      const h2 = this._toCanvas({ x: 10000, y: mm });
      lines.push(svg`<line class="grid-line ${major ? 'major' : ''}" x1="${v1.x}" y1="${v1.y}" x2="${v2.x}" y2="${v2.y}"/>`);
      lines.push(svg`<line class="grid-line ${major ? 'major' : ''}" x1="${h1.x}" y1="${h1.y}" x2="${h2.x}" y2="${h2.y}"/>`);
    }
    const calibration = this._calibrationPolygon();
    if (calibration.length < 3) return lines;

    const clipPath = calibration
      .map((point, index) => {
        const canvasPoint = this._toCanvas(point);
        return `${index === 0 ? 'M' : 'L'} ${canvasPoint.x} ${canvasPoint.y}`;
      })
      .join(' ') + ' Z';

    return svg`
      <defs>
        <clipPath id="room-calibration-clip">
          <path d="${clipPath}"></path>
        </clipPath>
      </defs>
      <g clip-path="url(#room-calibration-clip)">${lines}</g>
    `;
  }

  private _renderRoom() {
    if (this._roomPoints.length < 2) return nothing;
    const elements: unknown[] = [];
    const pathData = this._roomPoints.map((pt, i) => {
      const cp = this._toCanvas(pt);
      return (i === 0 ? 'M' : 'L') + ` ${cp.x} ${cp.y}`;
    }).join(' ') + (this._roomPoints.length >= 3 ? ' Z' : '');

    if (this._roomPoints.length >= 3) {
      elements.push(svg`<path d="${pathData}" fill="rgba(67, 97, 238, 0.06)" style="pointer-events: none;"/>`);
    }

    // Walls + length labels
    for (let i = 0; i < this._roomPoints.length; i++) {
      const p1 = this._roomPoints[i];
      const p2 = this._roomPoints[(i + 1) % this._roomPoints.length];
      if (this._roomPoints.length < 3 && i === this._roomPoints.length - 1) break;
      const cp1 = this._toCanvas(p1);
      const cp2 = this._toCanvas(p2);
      elements.push(svg`<line class="wall-line" x1="${cp1.x}" y1="${cp1.y}" x2="${cp2.x}" y2="${cp2.y}"/>`);

      if (this._designMode === 'layout') {
        const lengthM = (Math.hypot(p2.x - p1.x, p2.y - p1.y) / 1000).toFixed(2);
        const midX = (cp1.x + cp2.x) / 2, midY = (cp1.y + cp2.y) / 2;
        const angle = Math.atan2(cp2.y - cp1.y, cp2.x - cp1.x) * 180 / Math.PI;
        const adjustedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
        const perpAngle = (angle + 90) * Math.PI / 180;
        const ox = Math.cos(perpAngle) * 14, oy = Math.sin(perpAngle) * 14;
        elements.push(svg`
          <text x="${midX + ox}" y="${midY + oy}" text-anchor="middle" dominant-baseline="middle"
            transform="rotate(${adjustedAngle}, ${midX + ox}, ${midY + oy})"
            fill="#7c93f5" font-size="11" font-weight="600"
            stroke="var(--rd-deep)" stroke-width="3" paint-order="stroke"
            style="pointer-events: none;">${lengthM}m</text>
        `);
      }
    }

    // Area label at centroid (layout mode)
    if (this._designMode === 'layout' && this._roomPoints.length >= 3) {
      let cx = 0, cy = 0, a = 0;
      for (let i = 0; i < this._roomPoints.length; i++) {
        const q1 = this._roomPoints[i];
        const q2 = this._roomPoints[(i + 1) % this._roomPoints.length];
        const cross = q1.x * q2.y - q2.x * q1.y;
        a += cross; cx += (q1.x + q2.x) * cross; cy += (q1.y + q2.y) * cross;
      }
      if (Math.abs(a) > 1e-6) {
        a /= 2; cx /= 6 * a; cy /= 6 * a;
        const c = this._toCanvas({ x: cx, y: cy });
        elements.push(svg`<text x="${c.x}" y="${c.y}" text-anchor="middle" dominant-baseline="middle" fill="var(--rd-dim)" font-size="15" font-weight="600" style="pointer-events: none;">${this._calculateArea().toFixed(1)} m²</text>`);
      }
    }

    // Corner handles (layout mode)
    if (this._designMode === 'layout' && (this._toolMode === 'walls' || this._toolMode === 'select')) {
      this._roomPoints.forEach((pt, index) => {
        const cp = this._toCanvas(pt);
        const isDraggingThis = index === this._draggingPointIndex;
        elements.push(svg`
          <circle cx="${cp.x}" cy="${cp.y}" r="7"
            fill="${isDraggingThis ? '#22c55e' : '#4361ee'}" stroke="white" stroke-width="2"
            style="cursor: ${isDraggingThis ? 'grabbing' : 'grab'};"
            @mousedown="${(e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); this._draggingPointIndex = index; }}"
          />
        `);
      });

      // Add-point handle on hovered wall
      if (this._wallHoverPreview) {
        const cp = this._toCanvas(this._wallHoverPreview.point);
        elements.push(svg`
          <g style="cursor: pointer;"
             @mousedown="${(e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); this._addPointOnWall(this._wallHoverPreview!.wallIndex, this._wallHoverPreview!.position, true); }}">
            <circle cx="${cp.x}" cy="${cp.y}" r="11" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2" stroke-dasharray="4 2"/>
            <circle cx="${cp.x}" cy="${cp.y}" r="4" fill="#22c55e"/>
          </g>
        `);
      }
    }

    return elements;
  }

  private _renderWallDrawPreview() {
    if (this._toolMode !== 'walls' || !this._pendingStart || !this._previewPoint) return nothing;
    const startCp = this._toCanvas(this._pendingStart);
    const endCp = this._toCanvas(this._previewPoint);
    const first = this._roomPoints[0];
    const isCloseToFirst = first && this._roomPoints.length >= 2 && Math.hypot(this._previewPoint.x - first.x, this._previewPoint.y - first.y) < 250;
    const firstCp = first ? this._toCanvas(first) : null;
    return svg`
      ${isCloseToFirst && firstCp ? svg`<circle cx="${firstCp.x}" cy="${firstCp.y}" r="18" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="1"/>` : nothing}
      <line x1="${startCp.x}" y1="${startCp.y}" x2="${endCp.x}" y2="${endCp.y}" stroke="#22c55e" stroke-width="2" stroke-dasharray="8 4"/>
      <circle cx="${endCp.x}" cy="${endCp.y}" r="5" fill="#22c55e" stroke="white" stroke-width="2"/>
    `;
  }

  private _renderFurnitureGhost() {
    if (this._toolMode !== 'furniture' || !this._selectedFurnitureType || !this._cursorPos) return nothing;
    const snapped = this._snapToGrid(this._cursorPos);
    const cp = this._toCanvas(snapped);
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const w = this._selectedFurnitureType.defaultWidth * scale;
    const h = this._selectedFurnitureType.defaultHeight * scale;
    return svg`<rect x="${cp.x - w / 2}" y="${cp.y - h / 2}" width="${w}" height="${h}" rx="4"
      fill="rgba(34, 197, 94, 0.12)" stroke="#22c55e" stroke-width="2" stroke-dasharray="6 3" pointer-events="none"/>`;
  }

  private _renderDoorWindowPreview() {
    if (!this._doorWindowPreview) return nothing;
    const preview = this._doorWindowPreview;
    const p1 = this._roomPoints[preview.wallIndex];
    const p2 = this._roomPoints[(preview.wallIndex + 1) % this._roomPoints.length];
    const cp = this._toCanvas(preview.point);
    const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const previewWidth = (preview.type === 'door'
      ? this._doorWidth
      : preview.type === 'mirror' ? this._mirrorWidth : this._windowWidth) * scale;
    const isDoor = preview.type === 'door';
    const isMirror = preview.type === 'mirror';
    const color = isDoor ? '#a855f7' : isMirror ? '#64748b' : '#0ea5e9';
    const x1 = cp.x - Math.cos(wallAngle) * previewWidth / 2;
    const y1 = cp.y - Math.sin(wallAngle) * previewWidth / 2;
    const x2 = cp.x + Math.cos(wallAngle) * previewWidth / 2;
    const y2 = cp.y + Math.sin(wallAngle) * previewWidth / 2;

    return svg`
      <g style="cursor: pointer;"
         @mousedown="${(e: MouseEvent) => {
           e.stopPropagation();
           e.preventDefault();
           this._selectedWallIndex = preview.wallIndex;
           this._pendingStart = { x: preview.position, y: 0 };
           if (isDoor) this._showDoorDialog = true;
           else if (isMirror) this._showMirrorDialog = true;
           else this._showWindowDialog = true;
         }}">
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="6" stroke-dasharray="8 4" opacity="0.8"/>
        <circle cx="${cp.x}" cy="${cp.y}" r="10" fill="rgba(168, 85, 247, 0.25)" stroke="${color}" stroke-width="2"/>
      </g>
    `;
  }

  private _renderFurniture() {
    const canDrag = this._designMode === 'layout' && (this._toolMode === 'furniture' || this._toolMode === 'select');
    return this._furniture.map((f, index) => {
      const cp = this._toCanvas({ x: f.x, y: f.y });
      const scale = CANVAS_SIZE / 10000 * this._zoom;
      const w = f.width * scale;
      const h = f.height * scale;
      const isSelected = index === this._selectedFurnitureIndex;
      const isDraggingThis = index === this._draggingFurnitureIndex;

      return svg`
        <g @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._selectedFurnitureIndex = index; this._draggingFurnitureIndex = index; } }}"
           style="cursor: ${isDraggingThis ? 'grabbing' : canDrag ? 'grab' : 'default'};">
          <rect
            x="${cp.x - w / 2}" y="${cp.y - h / 2}"
            width="${w}" height="${h}"
            fill="${isDraggingThis ? 'rgba(34, 197, 94, 0.3)' : isSelected ? 'rgba(59, 130, 246, 0.3)' : 'var(--rd-line)'}"
            stroke="${isDraggingThis ? '#22c55e' : isSelected ? '#3b82f6' : 'var(--rd-line-strong)'}"
            stroke-width="${isDraggingThis || isSelected ? 2 : 1}"
            transform="rotate(${f.rotation || 0} ${cp.x} ${cp.y})"
            rx="3"
          />
          ${this._designMode === 'layout' ? svg`
            <text x="${cp.x}" y="${cp.y + 4}" text-anchor="middle"
              fill="${isDraggingThis ? '#22c55e' : isSelected ? '#3b82f6' : 'var(--rd-dim2)'}"
              font-size="11" font-weight="500" style="pointer-events: none;">${f.name}</text>
          ` : nothing}
        </g>
      `;
    });
  }

  private _renderDoorsAndWindows() {
    const elements: unknown[] = [];
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const canDrag = this._designMode === 'layout' && (this._toolMode === 'door' || this._toolMode === 'window' || this._toolMode === 'mirror' || this._toolMode === 'select');

    this._doors.forEach((door, index) => {
      if (!Number.isInteger(door.wallIndex) || door.wallIndex < 0 || door.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[door.wallIndex];
      const p2 = this._roomPoints[(door.wallIndex + 1) % this._roomPoints.length];
      const doorX = p1.x + (p2.x - p1.x) * door.position;
      const doorY = p1.y + (p2.y - p1.y) * door.position;
      const cp = this._toCanvas({ x: doorX, y: doorY });
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const perpAngle = wallAngle + (door.openDirection === 'inward' ? Math.PI / 2 : -Math.PI / 2);
      const doorWidthPx = door.width * scale;
      const isDraggingThis = index === this._draggingDoorIndex;
      const doorColor = isDraggingThis ? '#22c55e' : '#a855f7';

      elements.push(svg`
        <g style="cursor: ${isDraggingThis ? 'grabbing' : canDrag ? 'grab' : 'default'};"
           @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._draggingDoorIndex = index; } }}">
          <circle cx="${cp.x}" cy="${cp.y}" r="15" fill="transparent"/>
          <line
            x1="${cp.x - Math.cos(wallAngle) * doorWidthPx / 2}"
            y1="${cp.y - Math.sin(wallAngle) * doorWidthPx / 2}"
            x2="${cp.x + Math.cos(wallAngle) * doorWidthPx / 2}"
            y2="${cp.y + Math.sin(wallAngle) * doorWidthPx / 2}"
            stroke="var(--rd-deep)" stroke-width="6"
          />
          <line
            x1="${cp.x}" y1="${cp.y}"
            x2="${cp.x + Math.cos(perpAngle) * doorWidthPx * 0.9}"
            y2="${cp.y + Math.sin(perpAngle) * doorWidthPx * 0.9}"
            stroke="${doorColor}" stroke-width="3"
          />
          <path
            d="M ${cp.x + Math.cos(perpAngle) * doorWidthPx * 0.9} ${cp.y + Math.sin(perpAngle) * doorWidthPx * 0.9} A ${doorWidthPx * 0.9} ${doorWidthPx * 0.9} 0 0 ${door.openSide === 'left' ? 1 : 0} ${cp.x + Math.cos(wallAngle + (door.openSide === 'left' ? -1 : 1) * Math.PI / 2) * doorWidthPx * 0.9} ${cp.y + Math.sin(wallAngle + (door.openSide === 'left' ? -1 : 1) * Math.PI / 2) * doorWidthPx * 0.9}"
            fill="none" stroke="${doorColor}" stroke-width="1" stroke-dasharray="4 2" opacity="0.5"
          />
          ${this._designMode === 'layout' ? svg`<circle cx="${cp.x}" cy="${cp.y}" r="6" fill="${doorColor}" stroke="white" stroke-width="2"/>` : nothing}
        </g>
      `);
    });

    this._windows.forEach((win, index) => {
      if (!Number.isInteger(win.wallIndex) || win.wallIndex < 0 || win.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[win.wallIndex];
      const p2 = this._roomPoints[(win.wallIndex + 1) % this._roomPoints.length];
      const winX = p1.x + (p2.x - p1.x) * win.position;
      const winY = p1.y + (p2.y - p1.y) * win.position;
      const cp = this._toCanvas({ x: winX, y: winY });
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const winWidthPx = win.width * scale;
      const isDraggingThis = index === this._draggingWindowIndex;
      const winColor = isDraggingThis ? '#22c55e' : '#0ea5e9';
      const x1 = cp.x - Math.cos(wallAngle) * winWidthPx / 2;
      const y1 = cp.y - Math.sin(wallAngle) * winWidthPx / 2;
      const x2 = cp.x + Math.cos(wallAngle) * winWidthPx / 2;
      const y2 = cp.y + Math.sin(wallAngle) * winWidthPx / 2;

      elements.push(svg`
        <g style="cursor: ${isDraggingThis ? 'grabbing' : canDrag ? 'grab' : 'default'};"
           @mousedown="${(e: MouseEvent) => { if (canDrag) { e.stopPropagation(); e.preventDefault(); this._draggingWindowIndex = index; } }}">
          <circle cx="${cp.x}" cy="${cp.y}" r="15" fill="transparent"/>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${winColor}" stroke-width="6"/>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isDraggingThis ? '#4ade80' : '#38bdf8'}" stroke-width="3"/>
          ${this._designMode === 'layout' ? svg`<circle cx="${cp.x}" cy="${cp.y}" r="6" fill="${winColor}" stroke="white" stroke-width="2"/>` : nothing}
        </g>
      `);
    });

    this._mirrors.forEach((mirror, index) => {
      if (!Number.isInteger(mirror.wallIndex) || mirror.wallIndex < 0 || mirror.wallIndex >= this._roomPoints.length) return;
      const p1 = this._roomPoints[mirror.wallIndex];
      const p2 = this._roomPoints[(mirror.wallIndex + 1) % this._roomPoints.length];
      const mirrorX = p1.x + (p2.x - p1.x) * mirror.position;
      const mirrorY = p1.y + (p2.y - p1.y) * mirror.position;
      const cp = this._toCanvas({ x: mirrorX, y: mirrorY });
      const wallAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const width = mirror.width * scale;
      const x1 = cp.x - Math.cos(wallAngle) * width / 2;
      const y1 = cp.y - Math.sin(wallAngle) * width / 2;
      const x2 = cp.x + Math.cos(wallAngle) * width / 2;
      const y2 = cp.y + Math.sin(wallAngle) * width / 2;
      const isDragging = index === this._draggingMirrorIndex;
      const color = isDragging ? '#22c55e' : '#94a3b8';
      elements.push(svg`
        <g style="cursor: ${isDragging ? 'grabbing' : canDrag ? 'grab' : 'default'};"
           @mousedown="${(event: MouseEvent) => {
             if (!canDrag) return;
             event.stopPropagation();
             event.preventDefault();
             this._draggingMirrorIndex = index;
           }}">
          <circle cx="${cp.x}" cy="${cp.y}" r="15" fill="transparent"/>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="8"/>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="5"/>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e2e8f0" stroke-width="1.5" opacity="0.9"/>
          ${mirror.protectionEnabled ? svg`
            <circle cx="${cp.x}" cy="${cp.y}" r="6" fill="#22c55e" stroke="white" stroke-width="2"/>
          ` : nothing}
        </g>
      `);
    });

    return elements;
  }

  private _renderZones() {
    const elements: unknown[] = [];

    if (this._calibration.enabled && this._calibration.corners.length === 4) {
      const calibrationPoints = this._calibration.corners.map(point => this._toCanvas(point));
      const calibrationPath = `M ${calibrationPoints.map(point => `${point.x} ${point.y}`).join(' L ')} Z`;
      elements.push(svg`
        <g style="pointer-events: none;">
          <path
            d="${calibrationPath}"
            fill="rgba(14, 165, 233, 0.04)"
            stroke="#0ea5e9"
            stroke-width="2"
            stroke-dasharray="5 5"
          />
          ${calibrationPoints.map((point, index) => svg`
            <circle cx="${point.x}" cy="${point.y}" r="7" fill="#0ea5e9" stroke="white" stroke-width="2" />
            <text x="${point.x}" y="${point.y - 12}" fill="#0284c7" font-size="10" font-weight="700" text-anchor="middle">
              C${index + 1}
            </text>
          `)}
        </g>
      `);
    }

    // Render existing zones
    this._zones.forEach((zone, index) => {
      const colors = ZONE_COLORS[zone.type];
      const isSelected = this._selectedZoneIndex === index;

      // Entry lines (2 punten) - render als lijn met pijlen
      if (zone.type === 'entry' && zone.points.length === 2) {
        const cp1 = this._toCanvas(zone.points[0]);
        const cp2 = this._toCanvas(zone.points[1]);
        const midX = (cp1.x + cp2.x) / 2;
        const midY = (cp1.y + cp2.y) / 2;

        // Lijn richting en lengte
        const dx = cp2.x - cp1.x;
        const dy = cp2.y - cp1.y;
        const lineLen = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Normaal vector (loodrecht op de lijn)
        const nx = -dy / lineLen;
        const ny = dx / lineLen;

        // Bepaal welke kant "in" is (links of rechts van de lijn)
        const inDir = zone.inDirection || 'left';
        const inSign = inDir === 'left' ? 1 : -1;

        // Entry lijn renderen
        elements.push(svg`
          <line
            x1="${cp1.x}" y1="${cp1.y}"
            x2="${cp2.x}" y2="${cp2.y}"
            stroke="${colors.stroke}"
            stroke-width="${isSelected ? 4 : 3}"
            stroke-linecap="round"
            style="cursor: pointer;"
            @click="${(e: MouseEvent) => { e.stopPropagation(); this._selectZone(index); this._toolMode = 'zone'; }}"
          />
        `);

        // Pijlen wijzen TEGENOVERGESTELD: IN en UIT geven de looprichting aan
        const arrowLen = 30;
        const arrowGap = 5;  // Ruimte tussen pijlpunt en lijn

        // IN pijl: wijst in de "in" richting (door de lijn heen de kamer in)
        // Start aan de buitenkant, wijst naar de lijn en erdoorheen
        const inStartX = midX + nx * inSign * (arrowLen + arrowGap);
        const inStartY = midY + ny * inSign * (arrowLen + arrowGap);
        const inEndX = midX - nx * inSign * arrowGap;  // Net voorbij de lijn
        const inEndY = midY - ny * inSign * arrowGap;
        elements.push(svg`
          <line
            x1="${inStartX}" y1="${inStartY}"
            x2="${inEndX}" y2="${inEndY}"
            stroke="#22c55e" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-in)"
            style="pointer-events: none;"
          />
          <text
            x="${inStartX + nx * inSign * 15}" y="${inStartY + ny * inSign * 15 + 4}"
            fill="#22c55e" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >IN</text>
        `);

        // UIT pijl: wijst in de "uit" richting (door de lijn heen de kamer uit)
        // Start aan de binnenkant, wijst naar de lijn en erdoorheen (tegenovergesteld aan IN)
        const outStartX = midX - nx * inSign * (arrowLen + arrowGap);
        const outStartY = midY - ny * inSign * (arrowLen + arrowGap);
        const outEndX = midX + nx * inSign * arrowGap;  // Net voorbij de lijn
        const outEndY = midY + ny * inSign * arrowGap;
        elements.push(svg`
          <line
            x1="${outStartX}" y1="${outStartY}"
            x2="${outEndX}" y2="${outEndY}"
            stroke="#ef4444" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrowhead-out)"
            style="pointer-events: none;"
          />
          <text
            x="${outStartX - nx * inSign * 15}" y="${outStartY - ny * inSign * 15 + 4}"
            fill="#ef4444" font-size="13" font-weight="700" text-anchor="middle"
            style="pointer-events: none;"
          >OUT</text>
        `);

        // Length label
        const lengthMm = Math.hypot(zone.points[1].x - zone.points[0].x, zone.points[1].y - zone.points[0].y);
        const lengthM = (lengthMm / 1000).toFixed(2);
        const textAngle = angle * 180 / Math.PI;
        const adjustedAngle = (textAngle > 90 || textAngle < -90) ? textAngle + 180 : textAngle;
        elements.push(svg`
          <text
            x="${midX}" y="${midY - 12}"
            fill="${colors.stroke}"
            font-size="11" font-weight="600" text-anchor="middle"
            transform="rotate(${adjustedAngle} ${midX} ${midY - 12})"
            style="pointer-events: none;"
          >${lengthM}m</text>
        `);

        // Eindpunten voor dragging
        if (isSelected) {
          elements.push(svg`
            <circle cx="${cp1.x}" cy="${cp1.y}" r="8" fill="${colors.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
            <circle cx="${cp2.x}" cy="${cp2.y}" r="8" fill="${colors.stroke}" stroke="white" stroke-width="2" style="cursor: grab;" />
          `);
        }

        return;
      }

      const parts = getZoneParts(zone);
      parts.forEach((part, partIndex) => {
        if (part.length < 3) return;

        const isActivePart = isSelected && this._selectedZonePartIndex === partIndex;
        const pathPoints = part.map(point => this._toCanvas(point));
        const pathD = `M ${pathPoints.map(point => `${point.x} ${point.y}`).join(' L ')} Z`;
        const dashArray = zone.type === 'exclusion'
          ? '8 4'
          : zone.type === 'interference'
            ? '3 4'
            : 'none';

        elements.push(svg`
          <path
            d="${pathD}"
            fill="${colors.fill}"
            stroke="${colors.stroke}"
            stroke-width="${isActivePart ? 3 : 2}"
            stroke-dasharray="${dashArray}"
            style="cursor: ${isActivePart && this._toolMode === 'zone' ? 'move' : 'pointer'};"
            @click="${(event: MouseEvent) => {
              event.stopPropagation();
              this._selectZone(index, partIndex);
            }}"
          />
        `);

        if (!isActivePart) return;

        for (let pointIndex = 0; pointIndex < part.length; pointIndex++) {
          const point1 = part[pointIndex];
          const point2 = part[(pointIndex + 1) % part.length];
          const lengthMm = Math.hypot(point2.x - point1.x, point2.y - point1.y);
          const canvasPoint1 = this._toCanvas(point1);
          const canvasPoint2 = this._toCanvas(point2);
          const midpointX = (canvasPoint1.x + canvasPoint2.x) / 2;
          const midpointY = (canvasPoint1.y + canvasPoint2.y) / 2;
          const angle = Math.atan2(canvasPoint2.y - canvasPoint1.y, canvasPoint2.x - canvasPoint1.x) * 180 / Math.PI;
          const adjustedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
          elements.push(svg`
            <text
              x="${midpointX}" y="${midpointY - 8}"
              fill="${colors.stroke}"
              font-size="11"
              font-weight="600"
              text-anchor="middle"
              transform="rotate(${adjustedAngle} ${midpointX} ${midpointY - 8})"
              style="pointer-events: none;"
            >${(lengthMm / 1000).toFixed(2)}m</text>
          `);
        }

        part.forEach(point => {
          const canvasPoint = this._toCanvas(point);
          elements.push(svg`
            <circle
              cx="${canvasPoint.x}" cy="${canvasPoint.y}" r="8"
              fill="${colors.stroke}" stroke="white" stroke-width="2"
              style="cursor: ${this._toolMode === 'zone' ? 'grab' : 'default'};"
            />
          `);
        });

        if (this._toolMode === 'zone' && this._zoneMidpointPreview?.zoneIndex === index) {
          const midpoint = this._toCanvas(this._zoneMidpointPreview.point);
          elements.push(svg`
            <circle
              cx="${midpoint.x}" cy="${midpoint.y}" r="8"
              fill="#22c55e" stroke="white" stroke-width="2"
              style="cursor: pointer;"
            />
          `);
        }
      });
    });

    // Render drawing zone
    if (this._drawingZone.length > 0) {
      const colors = ZONE_COLORS[this._newZoneType];
      const pathPoints = this._drawingZone.map(p => this._toCanvas(p));

      // Draw lines with lengths
      for (let i = 0; i < pathPoints.length - 1; i++) {
        elements.push(svg`
          <line
            x1="${pathPoints[i].x}" y1="${pathPoints[i].y}"
            x2="${pathPoints[i+1].x}" y2="${pathPoints[i+1].y}"
            stroke="${colors.stroke}" stroke-width="2"
          />
        `);

        // Length label
        const p1 = this._drawingZone[i];
        const p2 = this._drawingZone[i + 1];
        const lengthMm = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const lengthM = (lengthMm / 1000).toFixed(2);
        const midX = (pathPoints[i].x + pathPoints[i+1].x) / 2;
        const midY = (pathPoints[i].y + pathPoints[i+1].y) / 2;
        const angle = Math.atan2(pathPoints[i+1].y - pathPoints[i].y, pathPoints[i+1].x - pathPoints[i].x) * 180 / Math.PI;
        const adjustedAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;
        elements.push(svg`
          <text
            x="${midX}" y="${midY - 8}"
            fill="${colors.stroke}"
            font-size="11"
            font-weight="600"
            text-anchor="middle"
            transform="rotate(${adjustedAngle} ${midX} ${midY - 8})"
            style="pointer-events: none;"
          >${lengthM}m</text>
        `);
      }

      // Preview line to cursor
      if (this._cursorPos) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        const cursorCanvas = this._toCanvas(this._cursorPos);
        elements.push(svg`
          <line
            x1="${lastPoint.x}" y1="${lastPoint.y}"
            x2="${cursorCanvas.x}" y2="${cursorCanvas.y}"
            stroke="${colors.stroke}" stroke-width="2" stroke-dasharray="4 4"
          />
        `);
      }

      // Draw points (draggable)
      pathPoints.forEach((p, i) => {
        const isFirstAndCanClose = i === 0 && this._drawingZone.length >= 3;
        elements.push(svg`
          <circle
            cx="${p.x}" cy="${p.y}" r="8"
            fill="${isFirstAndCanClose ? '#22c55e' : colors.stroke}"
            stroke="white" stroke-width="2"
            style="cursor: grab;"
          />
        `);
      });

      // Render midpoint preview for drawing zone
      if (this._zoneMidpointPreview && this._zoneMidpointPreview.zoneIndex === -1) {
        const midCanvas = this._toCanvas(this._zoneMidpointPreview.point);
        elements.push(svg`
          <circle
            cx="${midCanvas.x}" cy="${midCanvas.y}" r="8"
            fill="#22c55e" stroke="white" stroke-width="2"
            style="cursor: pointer;"
          />
        `);
      }
    }

    return elements;
  }

  private _renderMirrorReflectionZones() {
    if (!this._mirrors.some(mirror => mirror.protectionEnabled)) return nothing;
    const sensors = this._sensors.filter(sensor => sensor.deviceId);
    return sensors.flatMap((sensor, sensorIndex) =>
      createMirrorReflectionPolygons(this._roomPoints, this._mirrors, sensor).map(reflection => {
        const points = reflection.points.map(point => this._toCanvas(point));
        if (points.length < 3) return nothing;
        const path = `M ${points.map(point => `${point.x} ${point.y}`).join(' L ')} Z`;
        return svg`
          <g pointer-events="none" aria-hidden="true">
            <path d="${path}" fill="rgba(14, 165, 233, 0.10)" stroke="#0ea5e9"
              stroke-width="1.5" stroke-dasharray="7 5"/>
            <text x="${points[0].x}" y="${points[0].y - 8}" fill="#0284c7" font-size="10" font-weight="700">
              ${panelText(this.hass, 'Reflection guard')} ${sensors.length > 1 ? sensorIndex + 1 : ''}
            </text>
          </g>
        `;
      })
    );
  }

  private _renderSensorFOV() {
    if (this._sensors.length === 0) return nothing;
    const scale = CANVAS_SIZE / 10000 * this._zoom;
    const wedges: unknown[] = [];

    this._sensors.forEach((sn, index) => {
      const isSelected = index === this._selectedSensorIndex;
      const cp = this._toCanvas({ x: sn.x, y: sn.y });
      const coverageRange = this._coverageRadius(sn);
      const rangePx = coverageRange * scale;
      const rotRad = (sn.rotation - 90) * Math.PI / 180;
      const alpha = isSelected ? 1 : 0.45;

      if (sn.mountingMode === 'ceiling') {
        wedges.push(svg`
          <circle cx="${cp.x}" cy="${cp.y}" r="${rangePx}"
            fill="rgba(34, 197, 94, ${0.1 * alpha})" stroke="#22c55e"
            stroke-opacity="${alpha}" stroke-width="1.5" style="pointer-events: none;"/>
        `);
        if (isSelected) {
          for (let r = 1000; r <= coverageRange; r += 1000) {
            const rPx = r * scale;
            wedges.push(svg`<circle cx="${cp.x}" cy="${cp.y}" r="${rPx}" fill="none" stroke="rgba(34, 197, 94, 0.25)" stroke-width="1" style="pointer-events: none;"/>`);
            wedges.push(svg`<text x="${cp.x}" y="${cp.y - rPx - 4}" fill="rgba(34, 197, 94, 0.65)" font-size="9" text-anchor="middle" style="pointer-events: none;">${r / 1000}m</text>`);
          }
        }
        return;
      }

      const halfFov = sn.fov * Math.PI / 360;
      const a1 = rotRad - halfFov, a2 = rotRad + halfFov;
      const arcPts: Point[] = [];
      for (let i = 0; i <= 32; i++) {
        const angle = a1 + (a2 - a1) * (i / 32);
        arcPts.push({ x: cp.x + Math.cos(angle) * rangePx, y: cp.y + Math.sin(angle) * rangePx });
      }
      const fovPath = `M ${cp.x} ${cp.y} L ${arcPts.map(pt => `${pt.x} ${pt.y}`).join(' L ')} Z`;
      wedges.push(svg`<path d="${fovPath}" fill="rgba(34, 197, 94, ${0.12 * alpha})" stroke="#22c55e" stroke-opacity="${alpha}" stroke-width="1.5" style="pointer-events: none;"/>`);

      // LD2460's physical detection sector is configured in the radar and is
      // intentionally separate from Room Builder polygons.
      const radar = this._findRadarDevice(sn.deviceId);
      const hardwareSector = isSelected ? this._radarDetectionSector(radar) : null;
      if (hardwareSector) {
        const sectorRadius = hardwareSector.distanceM * 1000 * scale;
        const start = rotRad + hardwareSector.startAngleDeg * Math.PI / 180;
        const end = rotRad + hardwareSector.endAngleDeg * Math.PI / 180;
        const points: Point[] = [];
        for (let step = 0; step <= 32; step++) {
          const angle = start + (end - start) * (step / 32);
          points.push({
            x: cp.x + Math.cos(angle) * sectorRadius,
            y: cp.y + Math.sin(angle) * sectorRadius,
          });
        }
        const path = `M ${cp.x} ${cp.y} L ${points.map(point => `${point.x} ${point.y}`).join(' L ')} Z`;
        wedges.push(svg`
          <path d="${path}" fill="rgba(245, 158, 11, 0.10)" stroke="#f59e0b"
            stroke-width="2" stroke-dasharray="7 4" style="pointer-events: none;"/>
          <text x="${cp.x + Math.cos(rotRad) * sectorRadius * 0.72}"
            y="${cp.y + Math.sin(rotRad) * sectorRadius * 0.72 - 5}"
            fill="#b45309" font-size="9" font-weight="700" text-anchor="middle"
            style="pointer-events: none;">HARDWARE SECTOR</text>
        `);
      }

      // Distance rings + angle guides for the selected sensor only (keeps the view calm)
      if (isSelected) {
        for (let r = 1000; r <= sn.range; r += 1000) {
          const rPx = r * scale;
          const ringPts: Point[] = [];
          for (let i = 0; i <= 24; i++) {
            const angle = a1 + (a2 - a1) * (i / 24);
            ringPts.push({ x: cp.x + Math.cos(angle) * rPx, y: cp.y + Math.sin(angle) * rPx });
          }
          const ringPath = `M ${ringPts.map(pt => `${pt.x} ${pt.y}`).join(' L ')}`;
          wedges.push(svg`<path d="${ringPath}" fill="none" stroke="rgba(34, 197, 94, 0.25)" stroke-width="1" style="pointer-events: none;"/>`);
          const lx = cp.x + Math.cos(rotRad) * rPx;
          const ly = cp.y + Math.sin(rotRad) * rPx;
          wedges.push(svg`<text x="${lx}" y="${ly - 4}" fill="rgba(34, 197, 94, 0.6)" font-size="9" text-anchor="middle" style="pointer-events: none;">${r / 1000}m</text>`);
        }
        for (let deg = -180; deg <= 180; deg += 30) {
          if (Math.abs(deg) > sn.fov / 2) continue;
          const ang = rotRad + (deg * Math.PI) / 180;
          wedges.push(svg`<line x1="${cp.x}" y1="${cp.y}" x2="${cp.x + Math.cos(ang) * rangePx}" y2="${cp.y + Math.sin(ang) * rangePx}" stroke="rgba(34, 197, 94, 0.15)" stroke-width="1" style="pointer-events: none;"/>`);
        }
      }
    });

    return svg`${wedges}`;
  }

  private _renderSensorIcon() {
    if (this._sensors.length === 0) return nothing;
    const canDragSensor = this._toolMode === 'sensor' || this._toolMode === 'select';

    return svg`${this._sensors.map((sn, index) => {
      const cp = this._toCanvas({ x: sn.x, y: sn.y });
      const rotRad = (sn.rotation - 90) * Math.PI / 180;
      const directionLength = sn.mountingMode === 'ceiling' ? 13 : 25;
      const dirX = cp.x + Math.cos(rotRad) * directionLength, dirY = cp.y + Math.sin(rotRad) * directionLength;
      const isDraggingThis = this._draggingSensorIndex === index;
      const isSelected = this._selectedSensorIndex === index;
      const color = isDraggingThis ? '#22c55e' : this._sensorColor(index);

      return svg`
        ${isSelected ? svg`<circle cx="${cp.x}" cy="${cp.y}" r="25" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 3" style="pointer-events: none;"/>` : nothing}
        ${sn.mountingMode === 'ceiling' ? svg`<circle cx="${cp.x}" cy="${cp.y}" r="22" fill="none" stroke="white" stroke-opacity="0.65" stroke-width="1" style="pointer-events: none;"/>` : nothing}
        <circle
          cx="${cp.x}" cy="${cp.y}" r="18"
          fill="${color}" stroke="white" stroke-width="2"
          style="cursor: ${isDraggingThis ? 'grabbing' : canDragSensor ? 'grab' : 'default'}"
          @mousedown="${(e: MouseEvent) => { if (canDragSensor) { e.stopPropagation(); e.preventDefault(); this._selectedSensorIndex = index; this._draggingSensorIndex = index; } }}"
        />
        <line x1="${cp.x}" y1="${cp.y}" x2="${dirX}" y2="${dirY}" stroke="white" stroke-width="3" stroke-linecap="round" style="pointer-events: none;"/>
        <text x="${cp.x}" y="${cp.y + 4}" text-anchor="middle" fill="white" font-size="11" font-weight="700" style="pointer-events: none;">${index + 1}</text>
      `;
    })}`;
  }

  // Note: Targets are rendered via _updateTargetCirclesInDOM() using direct DOM manipulation
  // This bypasses Lit template rendering issues with dynamic SVG content

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Update target circles in DOM whenever _liveTargets changes
    if (changedProperties.has('_liveTargets') || changedProperties.has('_roomTracks') || changedProperties.has('_sensors')) {
      this._updateTargetCirclesInDOM();
    }

    // Update 3D scene when in 3D mode
    if (this._viewMode === '3d' && this._canvas3d) {
      this._render3DScene();
    }
  }

  private _updateTargetCirclesInDOM() {
    const svgEl = this.shadowRoot?.querySelector('svg');
    if (!svgEl) return;

    svgEl.querySelectorAll('.live-target').forEach(el => el.remove());

    const TARGET_COLORS = [
      ['#ef4444', '#4361ee', '#eab308', '#22c55e', '#a855f7'],
      ['#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899'],
      ['#ec4899', '#22c55e', '#94a3b8', '#f59e0b', '#3b82f6'],
    ];

    const showRoomTracks = this._positioningSources().length > 1
      && this._aggregation.tracking.experimental_fusion
      && fusionCanRun(this._fusionStatus().ready, this._alignmentRevocationPending());
    if (showRoomTracks) {
      this._roomTracks.forEach((track, index) => {
        const point = this._toCanvas(track);
        const color = TARGET_COLORS[0][index % TARGET_COLORS[0].length];
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'live-target');
        circle.setAttribute('cx', point.x.toString());
        circle.setAttribute('cy', point.y.toString());
        circle.setAttribute('r', track.held ? '13' : '18');
        circle.setAttribute('fill', color);
        circle.setAttribute('fill-opacity', track.held ? '0.42' : '1');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '4');
        svgEl.appendChild(circle);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'live-target');
        text.setAttribute('x', point.x.toString());
        text.setAttribute('y', (point.y + 6).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.textContent = String(index + 1);
        svgEl.appendChild(text);
      });
      return;
    }

    this._sensors.forEach((sensor, sensorIdx) => {
      const toWorld = (t: { x: number; y: number }) =>
        projectRadarTargetToRoom(t, sensor, this._coordinateProjection(sensor));
      const palette = TARGET_COLORS[sensorIdx % TARGET_COLORS.length];
      const targets = this._liveTargets[sensor.id] || [];
      const trails = this._targetTrails[sensor.id] || [];

      targets.forEach((target) => {
        if (!target.active) return;
        const i = target.index - 1;
        const world = toWorld(target);
        const tc = this._toCanvas(world);
        const color = palette[i] || '#ef4444';

        // Movement trail (fading line behind the target)
        const trail = trails[i] || [];
        if (trail.length > 1) {
          const pts = trail.map(tp => {
            const c = this._toCanvas(toWorld(tp));
            return `${c.x},${c.y}`;
          }).join(' ');
          const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          poly.setAttribute('class', 'live-target');
          poly.setAttribute('points', pts);
          poly.setAttribute('fill', 'none');
          poly.setAttribute('stroke', color);
          poly.setAttribute('stroke-width', '2');
          poly.setAttribute('stroke-opacity', '0.35');
          poly.setAttribute('stroke-linecap', 'round');
          poly.setAttribute('stroke-linejoin', 'round');
          svgEl.appendChild(poly);
        }

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'live-target');
        circle.setAttribute('cx', tc.x.toString());
        circle.setAttribute('cy', tc.y.toString());
        circle.setAttribute('r', '18');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '4');
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', '14;22;14');
        animate.setAttribute('dur', '1s');
        animate.setAttribute('repeatCount', 'indefinite');
        circle.appendChild(animate);
        svgEl.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'live-target');
        text.setAttribute('x', tc.x.toString());
        text.setAttribute('y', (tc.y + 6).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.textContent = (i + 1).toString();
        svgEl.appendChild(text);
      });
    });
  }

  private _renderSelectedFurniturePanel() {
    const idx = this._selectedFurnitureIndex;
    if (idx === null || !this._furniture[idx]) return nothing;
    const sel = this._furniture[idx];
    return html`
      <div class="selected-panel">
        <div class="section-title">SELECTED: ${sel.name.toUpperCase()}</div>
        <div class="input-row">
          <div>
            <label>Width (cm)</label>
            <input type="number" min="10" max="500" .value="${String(sel.width / 10)}"
              @change="${(e: Event) => this._updateSelectedFurniture({
                width: Math.round(this._commitNumberInput(e, sel.width / 10, 10, 500) * 10),
              })}"/>
          </div>
          <div>
            <label>Depth (cm)</label>
            <input type="number" min="10" max="500" .value="${String(sel.height / 10)}"
              @change="${(e: Event) => this._updateSelectedFurniture({
                height: Math.round(this._commitNumberInput(e, sel.height / 10, 10, 500) * 10),
              })}"/>
          </div>
        </div>
        <div class="panel-btn-row">
          <button class="panel-btn" @click="${() => this._rotateFurniture(idx)}" title="Shortcut: R">
            <ha-icon icon="mdi:rotate-right"></ha-icon>Rotate ${sel.rotation || 0}°
          </button>
          <button class="panel-btn danger" @click="${() => this._deleteFurniture(idx)}" title="Shortcut: Delete">
            <ha-icon icon="mdi:delete"></ha-icon>Delete
          </button>
        </div>
      </div>
    `;
  }

  private _renderLayoutSidebar() {
    if (this._toolMode === 'furniture') {
      return html`
        ${this._renderSelectedFurniturePanel()}
        <div>
          <div class="section-title">FURNITURE</div>
          <p class="info-text" style="margin-bottom: 10px;">Pick a type, then click the canvas to place it.</p>
          <div class="furniture-grid">
            ${FURNITURE_TYPES.map(type => html`
              <div class="furniture-item ${this._selectedFurnitureType?.id === type.id ? 'selected' : ''}"
                   @click="${() => { this._selectedFurnitureType = type; this._selectedFurnitureIndex = null; }}">
                <ha-icon icon="${type.icon}"></ha-icon>
                <span>${type.name}</span>
                <small>${type.defaultWidth / 10}×${type.defaultHeight / 10}cm</small>
              </div>
            `)}
          </div>
        </div>
        ${this._furniture.length > 0 ? html`
          <div>
            <div class="section-title">PLACED FURNITURE</div>
            ${this._furniture.map((f, i) => html`
              <div class="placed-item ${this._selectedFurnitureIndex === i ? 'selected' : ''}" @click="${() => this._selectedFurnitureIndex = i}">
                <ha-icon icon="${FURNITURE_TYPES.find(t => t.id === f.type)?.icon || 'mdi:square'}"></ha-icon>
                <span class="name">${f.name}</span>
                <span class="size">${f.width / 10}×${f.height / 10}</span>
                <button class="icon-btn" title="Rotate 90°" @click="${(e: Event) => { e.stopPropagation(); this._rotateFurniture(i); }}">
                  <ha-icon icon="mdi:rotate-right"></ha-icon>
                </button>
                <button class="delete-btn" title="Delete" @click="${(e: Event) => { e.stopPropagation(); this._deleteFurniture(i); }}">
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            `)}
          </div>
        ` : nothing}
      `;
    }

    if (this._toolMode === 'door') {
      return html`
        <div>
          <div class="section-title">DOORS</div>
          <p class="info-text" style="margin-bottom: 10px;">Hover a wall and click the preview to add a door.</p>
          ${this._doors.length === 0 ? html`
            <p class="info-text" style="color: var(--rd-dim);">No doors added yet.</p>
          ` : this._doors.map((d, i) => html`
            <div class="placed-item">
              <ha-icon icon="mdi:door"></ha-icon>
              <span class="name">Door ${i + 1}</span>
              <span class="size">${d.width / 10}cm</span>
              <button class="icon-btn" title="Edit" @click="${() => this._editDoor(i)}">
                <ha-icon icon="mdi:pencil"></ha-icon>
              </button>
              <button class="delete-btn" title="Delete" @click="${() => this._deleteDoor(i)}">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          `)}
        </div>
      `;
    }

    if (this._toolMode === 'window') {
      return html`
        <div>
          <div class="section-title">WINDOWS</div>
          <p class="info-text" style="margin-bottom: 10px;">Hover a wall and click the preview to add a window.</p>
          ${this._windows.length === 0 ? html`
            <p class="info-text" style="color: var(--rd-dim);">No windows added yet.</p>
          ` : this._windows.map((w, i) => html`
            <div class="placed-item">
              <ha-icon icon="mdi:window-closed-variant"></ha-icon>
              <span class="name">${w.windowType === 'fixed' ? 'Fixed' : w.windowType === 'tilt' ? 'Tilt' : 'Casement'}</span>
              <span class="size">${w.width / 10}×${w.height / 10}cm</span>
              <button class="icon-btn" title="Edit" @click="${() => this._editWindow(i)}">
                <ha-icon icon="mdi:pencil"></ha-icon>
              </button>
              <button class="delete-btn" title="Delete" @click="${() => this._deleteWindow(i)}">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          `)}
        </div>
      `;
    }

    if (this._toolMode === 'mirror') {
      const manualSlots = this._zones.filter(zone => zone.type === 'exclusion')
        .reduce((count, zone) => count + getZoneParts(zone).length, 0);
      const protectedMirrors = this._mirrors.filter(mirror => mirror.protectionEnabled).length;
      const totalSlots = manualSlots + protectedMirrors;
      return html`
        <div>
          <div class="section-title">${panelText(this.hass, 'MIRRORS')}</div>
          <p class="info-text" style="margin-bottom: 10px;">
            ${panelText(this.hass, 'Place a mirror on its real wall. Optional reflection protection filters predicted ghost targets behind it.')}
          </p>
          <div class="dialog-warning" style="border-color: ${totalSlots > 2 ? '#ef4444' : 'var(--rd-line)'};">
            <ha-icon icon="mdi:shield-check-outline"></ha-icon>
            <div>
              ${panelText(this.hass, '{used}/2 radar exclusion slots used.', { used: totalSlots })}
              ${totalSlots > 2 ? html`<br>${panelText(this.hass, 'Disable protection for a mirror or remove a manual exclusion before pushing.')}` : nothing}
            </div>
          </div>
          ${this._sensors.some(sensor => sensor.deviceId) ? nothing : html`
            <p class="info-text" style="color: #f59e0b;">${panelText(this.hass, 'Link a radar placement to preview and use reflection protection. The mirror can still be saved visually.')}</p>
          `}
          ${this._mirrors.length === 0 ? html`
            <p class="info-text" style="color: var(--rd-dim);">${panelText(this.hass, 'No mirrors added yet.')}</p>
          ` : this._mirrors.map((mirror, index) => html`
            <div class="placed-item">
              <ha-icon icon="mdi:mirror-rectangle"></ha-icon>
              <span class="name">${panelText(this.hass, 'Mirror')} ${index + 1}</span>
              <span class="size">${mirror.width / 10}×${mirror.height / 10}cm</span>
              <ha-icon
                icon="${mirror.protectionEnabled ? 'mdi:shield-check' : 'mdi:shield-off-outline'}"
                title="${mirror.protectionEnabled ? panelText(this.hass, 'Reflection protection enabled') : panelText(this.hass, 'Visual only')}"
                style="color: ${mirror.protectionEnabled ? '#22c55e' : 'var(--rd-dim)'};"
              ></ha-icon>
              <button class="icon-btn" title="${panelText(this.hass, 'Edit')}" aria-label="${panelText(this.hass, 'Edit mirror {number}', { number: index + 1 })}" @click="${() => this._editMirror(index)}">
                <ha-icon icon="mdi:pencil"></ha-icon>
              </button>
              <button class="delete-btn" title="${panelText(this.hass, 'Delete')}" aria-label="${panelText(this.hass, 'Delete mirror {number}', { number: index + 1 })}" @click="${() => this._deleteMirror(index)}">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          `)}
        </div>
      `;
    }

    // select / walls: room info + selected furniture
    const area = this._calculateArea();
    return html`
      ${this._renderSelectedFurniturePanel()}
      <div>
        <div class="section-title">
          <ha-icon icon="mdi:chart-box-outline"></ha-icon>
          ${panelText(this.hass, 'Room summary')}
        </div>
        <div class="room-summary">
          ${this._roomPoints.length >= 3 ? html`
            <div class="room-summary-hero">
              <span class="icon"><ha-icon icon="mdi:vector-square"></ha-icon></span>
              <div>
                <strong>${area.toFixed(1)} m²</strong>
                <span>${panelText(this.hass, 'Area')}</span>
              </div>
            </div>
            <div class="room-summary-grid">
              <div class="room-summary-item">
                <ha-icon icon="mdi:vector-polyline"></ha-icon>
                <div><strong>${this._roomPoints.length}</strong><span>${panelText(this.hass, 'Corners')}</span></div>
              </div>
              <div class="room-summary-item">
                <ha-icon icon="mdi:sofa-outline"></ha-icon>
                <div><strong>${this._furniture.length}</strong><span>${panelText(this.hass, 'Furniture')}</span></div>
              </div>
              <div class="room-summary-item">
                <ha-icon icon="mdi:door"></ha-icon>
                <div><strong>${this._doors.length}</strong><span>${panelText(this.hass, 'Doors')}</span></div>
              </div>
              <div class="room-summary-item">
                <ha-icon icon="mdi:window-closed-variant"></ha-icon>
                <div><strong>${this._windows.length}</strong><span>${panelText(this.hass, 'Windows')}</span></div>
              </div>
              <div class="room-summary-item">
                <ha-icon icon="mdi:radar"></ha-icon>
                <div><strong>${this._sensors.length}</strong><span>${panelText(this.hass, 'Sensors')}</span></div>
              </div>
              <div class="room-summary-item">
                <ha-icon icon="mdi:mirror-rectangle"></ha-icon>
                <div><strong>${this._mirrors.length}</strong><span>${panelText(this.hass, 'Mirrors')}</span></div>
              </div>
              <div class="room-summary-item">
                <ha-icon icon="mdi:vector-polygon"></ha-icon>
                <div><strong>${this._zones.length}</strong><span>${panelText(this.hass, 'Zones')}</span></div>
              </div>
            </div>
          ` : html`
            <div class="room-summary-empty">
              <ha-icon icon="mdi:wall"></ha-icon>
              <span>${panelText(this.hass, 'Draw walls to see measurements. Use the Walls tool to start.')}</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  private _radarText(en: string, nl: string): string {
    return this.hass?.language?.startsWith('nl') ? nl : panelText(this.hass, en);
  }

  private _renderHardwareSettings(selectedRadar: RadarDevice | undefined, canCalibrate: boolean, canPush: boolean) {
    const t = (en: string, nl: string) => this._radarText(en, nl);
    if (this._showCoverageCalibration) return html`<div class="radar-settings">${this._coverageWizard()}</div>`;
    if (this._hardwareLoading || this._radarProfilesLoading) return html`
      <div class="radar-settings"><p role="status">${t('Loading rooms and radars...', 'Kamers en radars laden...')}</p></div>`;
    if (this._roomsError || this._radarProfilesError) return html`
      <div class="radar-settings">
        <p role="alert">${t('Rooms or radars could not be loaded.', 'Kamers of radars konden niet worden geladen.')}</p>
        <div class="radar-section"><button type="button" class="radar-action" @click=${() => {
          this._hardwareLoading = true;
          void this._loadRooms();
          void this._loadRadarProfiles();
        }}>${t('Try again', 'Opnieuw proberen')}</button></div>
      </div>`;
    if (!this.rooms.length) return html`<div class="radar-settings">
      <p>${t('Create and save a room in Floor plan first.', 'Maak en bewaar eerst een kamer in Plattegrond.')}</p>
    </div>`;

    const readOnly = this.hardwareContext?.readOnly;
    const locked = this.hardwareBusy || this._dirty;
    const feedback = this._hardwareFeedback;
    const count = this._calibration.corners.length;
    const zoneCount = this._zones.length;
    const mirrorFilters = this._mirrors.filter(mirror => mirror.protectionEnabled).length;
    return html`<section class="radar-settings">
      <div class="radar-fields">
        <label class="radar-field">${t('Room', 'Kamer')}
          <select id="radar-tool-room" ?disabled=${locked} @change=${(event: Event) => {
            this._hardwareFeedback = null;
            this._selectRoom((event.target as HTMLSelectElement).value);
          }}>
            ${this.rooms.map(room => html`<option value=${room.id} ?selected=${this._selectedRoomId === room.id}>${room.name}</option>`)}
          </select>
        </label>
        <label class="radar-field">Radar
          <select id="radar-tool-sensor" ?disabled=${locked || !this._sensors.length} @change=${(event: Event) => {
            this._hardwareFeedback = null;
            const value = (event.target as HTMLSelectElement).value;
            this._selectedSensorIndex = value === '' ? null : Number(value);
          }}>
            <option value="" ?selected=${this._selectedSensorIndex === null}>${this._sensors.length
              ? t('Select a radar', 'Kies een radar') : t('No radar placed', 'Geen radar geplaatst')}</option>
            ${this._sensors.map((sensor, index) => html`<option value=${index} ?selected=${this._selectedSensorIndex === index}>
              ${this._findRadarDevice(sensor.deviceId) ? this._sensorLabel(sensor, index)
                : `${t('Unavailable radar', 'Radar niet beschikbaar')}${this._sensors.length > 1 ? ` ${index + 1}` : ''}`}
            </option>`)}
          </select>
        </label>
      </div>
      ${readOnly ? html`<div class="radar-notice" role="status"><ha-icon icon="mdi:information-outline" aria-hidden="true"></ha-icon>
        <p>${t('Save the floor plan to measure or send zones.', 'Sla de plattegrond op om te meten of zones te versturen.')}</p></div>` : nothing}
      ${!selectedRadar ? html`<div class="radar-notice"><ha-icon icon="mdi:radar" aria-hidden="true"></ha-icon>
        <p>${t('Link an available Home Assistant radar in Floor plan to use these controls.', 'Koppel in Plattegrond een beschikbare Home Assistant-radar om hier te meten en zones te sturen.')}</p></div>` : nothing}
      <section class="radar-section">
        <div class="radar-section-title"><ha-icon icon="mdi:vector-square" aria-hidden="true"></ha-icon>
          <h3>${t('Coverage and calibration', 'Bereik en kalibratie')}</h3>
          <span class="radar-count">${count} ${t('points', 'meetpunten')}</span>
        </div>
        <p>${this._dirty ? t('Save your new measurements or discard them to switch rooms.', 'Sla je meting op of verwerp die om van kamer te wisselen.')
          : selectedRadar && !canCalibrate
            ? t('This radar must provide usable position data to measure coverage.', 'Deze radar moet bruikbare positiegegevens leveren om het bereik te meten.')
            : t('Measure where the selected radar can reliably detect you.', 'Meet waar de gekozen radar je betrouwbaar kan detecteren.')}</p>
        <div class="radar-actions">
          ${this._dirty ? html`
            <button type="button" class="radar-action radar-primary" @click=${this._saveRoom} ?disabled=${this.hardwareBusy || readOnly || feedback?.conflict}>
              ${this._saving ? t('Saving...', 'Opslaan...') : t('Save changes', 'Wijzigingen opslaan')}
            </button>
            <button type="button" class="radar-action" ?disabled=${this.hardwareBusy} @click=${() => {
              if (!this._selectedRoomId) return;
              this._hardwareFeedback = null;
              this._selectRoom(this._selectedRoomId);
            }}>${t('Discard changes', 'Wijzigingen verwerpen')}</button>`
          : html`<button type="button" class="radar-action radar-primary" @click=${this._openCoverageCalibration}
            ?disabled=${!canCalibrate || this.hardwareBusy || readOnly}>
            <ha-icon icon="mdi:crosshairs" aria-hidden="true"></ha-icon>${t('Measure coverage', 'Bereik meten')}
          </button>`}
        </div>
      </section>
      <section class="radar-section">
        <div class="radar-section-title"><ha-icon icon="mdi:vector-polygon" aria-hidden="true"></ha-icon>
          <h3>${t('Send zones', 'Zones versturen')}</h3>
          <span class="radar-count">${zoneCount} ${zoneCount === 1 ? t('zone', 'zone') : t('zones', 'zones')}</span>
        </div>
        <p>${selectedRadar && !canPush
          ? t('Check the mounting mode and installation data of the linked radars first.', 'Controleer eerst de montagemodus en installatiegegevens van de gekoppelde radars.')
          : canPush && !zoneCount && mirrorFilters
          ? t('This room has no zones, but it has a mirror filter. Sending writes that to its radars.', 'Deze kamer heeft geen zones, maar wel een spiegelfilter. Verzenden zet dat op de radars in deze kamer.')
          : canPush && !zoneCount
          ? t('This room has no zones. Sending clears the zones on its radars.', 'Deze kamer heeft geen zones. Verzenden wist de zones op de radars in deze kamer.')
          : t('Send this room\'s saved zones to its linked radars.', 'Stuur de opgeslagen zones naar de gekoppelde radars in deze kamer.')}</p>
        <div class="radar-actions"><button type="button" class="radar-action" @click=${this._pushToESPHome}
          ?disabled=${!canPush || locked || readOnly}>
          <ha-icon icon="mdi:send-outline" aria-hidden="true"></ha-icon>
          ${this._pushingToESPHome ? t('Sending...', 'Versturen...') : t('Send to radars', 'Naar radars sturen')}
        </button></div>
      </section>
      ${feedback ? html`<div class="radar-notice" data-status=${feedback.status} role=${feedback.status === 'warning' ? 'alert' : 'status'}>
        <ha-icon icon=${feedback.status === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'} aria-hidden="true"></ha-icon>
        <div><p>${feedback.message}</p>${feedback.conflict ? html`<button type="button" class="radar-action" @click=${async () => {
          if (!this._selectedRoomId) return;
          await this._reloadRoomAfterConflict(this._selectedRoomId);
          this._hardwareFeedback = null;
        }}>${t('Reload room', 'Kamer herladen')}</button>` : nothing}</div>
      </div>` : nothing}
    </section>`;
  }

  render() {
    const selectedRoom = this.rooms.find(r => r.id === this._selectedRoomId);
    const importSummary = this._pendingImportedRoom ? summarizeRoom(this._pendingImportedRoom) : null;
    const instr = this._getInstructions();
    const radarDevices = this._getRadarDevices();
    const selectedRadar = this._findRadarDevice(this._selectedSensor?.deviceId ?? null)
      || radarDevices.find(device => device.aliases.includes(this._selectedSensor?.deviceId || ''));
    const selectedRadarCapabilities = this._getRadarCapabilities(this._selectedSensor?.deviceId ?? null);
    const hardwareModeMismatch = this._hardwareModeMismatch(selectedRadar);
    const currentHardwareMode = selectedRadar ? this._currentHardwareMode(selectedRadar) : null;
    const installationAvailability = selectedRadar
      ? radarInstallationAvailability(
        selectedRadar.profile.radarModel,
        this._requiredHardwareMode(selectedRadar),
        selectedRadar.profile.installationHeightEntityId,
        selectedRadar.profile.installationAngleEntityId,
      )
      : 'not_applicable';
    const installationHeightEntityId = selectedRadar?.profile.installationHeightEntityId ?? null;
    const installationAngleEntityId = selectedRadar?.profile.installationAngleEntityId ?? null;
    const installationHeightM = selectedRadar
      ? this._liveInstallationValue(
        installationHeightEntityId,
        LD2460_HEIGHT_RANGE.minimum,
        LD2460_HEIGHT_RANGE.maximum,
        selectedRadar.profile.installationHeightM,
      )
      : null;
    const installationAngleDeg = selectedRadar
      ? this._liveInstallationValue(
        installationAngleEntityId,
        LD2460_ANGLE_RANGE.minimum,
        LD2460_ANGLE_RANGE.maximum,
        selectedRadar.profile.installationAngleDeg,
      )
      : null;
    const installationHeightStatus = radarInstallationEntityStatus(
      installationHeightEntityId ? this.hass.states[installationHeightEntityId] : undefined,
    );
    const installationAngleStatus = radarInstallationEntityStatus(
      installationAngleEntityId ? this.hass.states[installationAngleEntityId] : undefined,
    );
    const sectorEntityIds = selectedRadar ? [
      selectedRadar.profile.detectionDistanceEntityId,
      selectedRadar.profile.detectionStartAngleEntityId,
      selectedRadar.profile.detectionEndAngleEntityId,
    ] : [];
    const completeSectorControls = sectorEntityIds.length === 3 && sectorEntityIds.every(Boolean);
    const partialSectorControls = sectorEntityIds.some(Boolean) && !completeSectorControls;
    const canCalibrate = Boolean(
      this._selectedSensor?.deviceId
      && selectedRadar?.profile.positioningAvailable
      && this._ld2460InstallationReady(selectedRadar),
    );
    const hasLinkedHardwareModeMismatch = this._sensors.some(sensor =>
      this._hardwareModeMismatch(this._findRadarDevice(sensor.deviceId)));
    const hasUnreadyLinkedPositioningRadar = this._sensors.some(sensor => {
      const radar = this._findRadarDevice(sensor.deviceId);
      return Boolean(radar
        && ['ld2460', 'ld6002b'].includes(radar.profile.radarModel)
        && !this._ld2460InstallationReady(radar));
    });
    if (this.hardwareOnly) {
      const canPush = this._sensors.some(sensor => Boolean(this._findRadarDevice(sensor.deviceId)))
        && !hasLinkedHardwareModeMismatch && !hasUnreadyLinkedPositioningRadar;
      return html`
        ${this._renderHardwareSettings(selectedRadar, canCalibrate, canPush)}
        ${selectedRoom && !this._hardwareLoading && !this._roomsError
          ? this._renderRoomAggregation()
          : nothing}
      `;
    }
    const activeTargets = Object.values(this._liveTargets).reduce((sum, targets) => sum + targets.filter(t => t.active).length, 0);
    const roomFusionReady = this._aggregation.tracking.experimental_fusion
      && fusionCanRun(this._fusionStatus().ready, this._alignmentRevocationPending());
    const roomTrackCount = this._roomTracks.filter(track => !track.held).length;
    const sensorsWithSupplementaryPresence = new Set(
      this._sensors
        .filter(sensor => this._hasSupplementaryPresence(this._findRadarDevice(sensor.deviceId)))
        .map(sensor => sensor.id),
    );
    const invalidTrackingStates = new Set(['', 'unknown', 'unavailable', 'nan', 'none', 'null']);
    const stateIsAvailable = (entityId: string | null | undefined): boolean => {
      if (!entityId) return false;
      const state = this.hass.states[entityId];
      return Boolean(state && !invalidTrackingStates.has(String(state.state).trim().toLowerCase()));
    };
    const nowMs = Date.now();
    const serverNowMs = this._serverNowMs(nowMs);
    const trackingSourceEvidence = this._sensors
      .filter(sensor => Boolean(sensor.deviceId))
      .map(sensor => {
        const radar = this._findRadarDevice(sensor.deviceId);
        const sensorTargets = this._liveTargets[sensor.id] || [];
        const liveTargets = sensorTargets.filter(target => target.active);
        const liveTargetIndexes = new Set(liveTargets.map(target => target.index));
        const excludedTargetIndexes = new Set(
          sensorTargets.filter(target => target.excluded).map(target => target.index),
        );
        const primaryState = radar?.profile.trackingPresenceEntityId
          ? this.hass.states[radar.profile.trackingPresenceEntityId]
          : undefined;
        const primaryPresence = primaryState?.state === 'on';
        const primaryContractLive = !radar?.profile.trackingPresenceEntityId
          || stateIsAvailable(radar.profile.trackingPresenceEntityId);
        const supplementaryPresence = Boolean(radar?.profile.supplementaryPresenceSensors.some(
          entityId => this.hass.states[entityId]?.state === 'on',
        ));
        const supplementaryContractLive = Boolean(radar
          && radar.profile.supplementaryPresenceSensors.every(stateIsAvailable));
        const targetCountState = radar?.profile.trackingTargetCountEntityId
          ? this.hass.states[radar.profile.trackingTargetCountEntityId]
          : undefined;
        const targetCountTimestamp = radar?.profile.trackingTargetCountEntityId
          ? this._reportTimestamp(
            radar.profile.trackingTargetCountEntityId,
            targetCountState,
            nowMs,
            serverNowMs,
          )
          : null;
        const targetCountFreshnessMs = Math.max(
          1000,
          this._aggregation.tracking.observation_freshness_ms,
        );
        const targetCountAvailable = Boolean(targetCountState
          && !invalidTrackingStates.has(String(targetCountState.state).trim().toLowerCase())
          && targetCountTimestamp !== null
          && targetCountTimestamp <= nowMs
          && nowMs - targetCountTimestamp <= targetCountFreshnessMs);
        const parsedTargetCount = targetCountAvailable ? Number(targetCountState!.state) : Number.NaN;
        const rawReportedTargetCount = Number.isInteger(parsedTargetCount) && parsedTargetCount >= 0
          ? parsedTargetCount
          : null;
        const reconciledTargetCount = reconcileReportedTargetCount(
          rawReportedTargetCount,
          liveTargetIndexes.size,
          excludedTargetIndexes.size,
        );
        const reportedTargetCount = reconciledTargetCount.effectiveTargetCount;
        const explicitUnpositionedTargetPresence = Boolean(radar?.targets.some(target =>
          target.presence_entity_id
          && this.hass.states[target.presence_entity_id]?.state === 'on'
          && !excludedTargetIndexes.has(target.index)
          && !liveTargetIndexes.has(target.index)));
        const explicitPositiveTargetCount = radar?.targets.filter(target =>
          target.presence_entity_id
          && this.hass.states[target.presence_entity_id]?.state === 'on').length || 0;
        const explicitTargetContractComplete = Boolean(radar?.targets.length
          && radar.targets.every(target => target.presence_entity_id
            && stateIsAvailable(target.presence_entity_id)));
        const aggregatePresenceExplained = exclusionsExplainAggregatePresence({
          hasTargetCountContract: Boolean(radar?.profile.trackingTargetCountEntityId),
          reportedTargetCount: rawReportedTargetCount,
          explicitTargetContractComplete,
          explicitPositiveTargetCount,
          excludedTargetCount: excludedTargetIndexes.size,
          visibleTargetCount: liveTargetIndexes.size,
          hasUnpositionedTarget: explicitUnpositionedTargetPresence,
        });
        const effectivePrimaryPresence = primaryPresence && !aggregatePresenceExplained;
        const staleNonzeroUnpositioned = Boolean(
          (effectivePrimaryPresence || !radar?.profile.trackingPresenceEntityId)
          && radar?.targets.some(target => {
          if (target.presence_entity_id
            || liveTargetIndexes.has(target.index)
            || excludedTargetIndexes.has(target.index)) return false;
          const x = this._targetCoordinateMm(
            this.hass.states[target.x_entity_id],
            radar.profile.coordinateScaleToMm,
          );
          const y = this._targetCoordinateMm(
            this.hass.states[target.y_entity_id],
            radar.profile.coordinateScaleToMm,
          );
          return x !== null && y !== null && (x !== 0 || y !== 0);
          }),
        );
        const unpositionedTargetPresence = explicitUnpositionedTargetPresence
          || staleNonzeroUnpositioned;
        const targetPresenceLive = Boolean(radar?.targets.some(target =>
          stateIsAvailable(target.presence_entity_id)));
        const coordinateLive = Boolean(radar?.targets.some(target => {
          const xState = this.hass.states[target.x_entity_id];
          const yState = this.hass.states[target.y_entity_id];
          const xTimestamp = this._reportTimestamp(target.x_entity_id, xState, nowMs, serverNowMs);
          const yTimestamp = this._reportTimestamp(target.y_entity_id, yState, nowMs, serverNowMs);
          if (xTimestamp === null || yTimestamp === null) return false;
          return isFreshObservation(xTimestamp, nowMs, this._aggregation.tracking.observation_freshness_ms)
            && isFreshObservation(yTimestamp, nowMs, this._aggregation.tracking.observation_freshness_ms);
        }));
        const slotEvidenceComplete = Boolean(radar && radar.targets.every(target => {
          if (target.presence_entity_id) {
            const targetState = this.hass.states[target.presence_entity_id];
            if (!stateIsAvailable(target.presence_entity_id)) return false;
            const xState = this.hass.states[target.x_entity_id];
            const yState = this.hass.states[target.y_entity_id];
            const x = this._targetCoordinateMm(xState, radar.profile.coordinateScaleToMm);
            const y = this._targetCoordinateMm(yState, radar.profile.coordinateScaleToMm);
            const xTimestamp = this._reportTimestamp(target.x_entity_id, xState, nowMs, serverNowMs);
            const yTimestamp = this._reportTimestamp(target.y_entity_id, yState, nowMs, serverNowMs);
            const freshCoordinates = isFreshObservation(
              xTimestamp,
              nowMs,
              this._aggregation.tracking.observation_freshness_ms,
            ) && isFreshObservation(
              yTimestamp,
              nowMs,
              this._aggregation.tracking.observation_freshness_ms,
            );
            if (freshCoordinates && x !== null && y !== null && (x !== 0 || y !== 0)) {
              return targetState.state === 'on';
            }
            return targetState.state !== 'on'
              || liveTargetIndexes.has(target.index)
              || excludedTargetIndexes.has(target.index)
              || unpositionedTargetPresence;
          }
          const xState = this.hass.states[target.x_entity_id];
          const yState = this.hass.states[target.y_entity_id];
          const x = this._targetCoordinateMm(xState, radar.profile.coordinateScaleToMm);
          const y = this._targetCoordinateMm(yState, radar.profile.coordinateScaleToMm);
          if (x === null || y === null) return false;
          const xTimestamp = this._reportTimestamp(target.x_entity_id, xState, nowMs, serverNowMs);
          const yTimestamp = this._reportTimestamp(target.y_entity_id, yState, nowMs, serverNowMs);
          const freshCoordinates = isFreshObservation(
            xTimestamp,
            nowMs,
            this._aggregation.tracking.observation_freshness_ms,
          ) && isFreshObservation(
            yTimestamp,
            nowMs,
            this._aggregation.tracking.observation_freshness_ms,
          );
          if (!freshCoordinates) return false;
          if (x === 0 && y === 0) return true;
          return liveTargetIndexes.has(target.index) || primaryPresence;
        }));
        const positioning = Boolean(radar?.profile.positioningAvailable && radar.targets.length);
        const presenceInputsComplete = primaryContractLive && supplementaryContractLive;
        const targetCountComplete = !radar?.profile.trackingTargetCountEntityId
          || (targetCountAvailable && reconciledTargetCount.accountingComplete);
        return {
          discovered: Boolean(radar),
          live: Boolean(radar && (
            stateIsAvailable(radar.profile.trackingPresenceEntityId)
            || radar.profile.supplementaryPresenceSensors.some(stateIsAvailable)
            || targetPresenceLive
            || targetCountAvailable
            || coordinateLive
          ) && presenceInputsComplete && (!positioning || slotEvidenceComplete)),
          presenceInputsComplete,
          targetCountComplete,
          positioning,
          activeTargetCount: liveTargets.length,
          primaryPresence: effectivePrimaryPresence,
          supplementaryPresence,
          unpositionedTargetPresence,
          reportedTargetCount,
        };
      });
    const roomTrackingStatus = assessRoomTrackingStatus(
      trackingSourceEvidence,
      roomFusionReady,
      this._fusionAssociationAmbiguous,
      roomTrackCount,
    );
    const jointCountKnown = roomTrackingStatus.countKnown;
    const hasUnpositionedPresence = roomTrackingStatus.hasUnpositionedPresence;
    const roomOccupied = roomTrackingStatus.occupied;
    const calibrationSensor = this._sensors.find(sensor => sensor.id === this._calibration.sensorId);

    return html`
      <div class="sidebar">
        <div>
          <div class="section-title"><ha-icon icon="mdi:floor-plan"></ha-icon>${panelText(this.hass, 'Rooms')}</div>
          <div class="room-list">
            ${this._invalidRoomCount > 0 ? html`
              <p class="info-text" role="status">
                ${panelText(this.hass, 'Some saved room data could not be loaded safely. The original data was kept for recovery.')}
                (${this._invalidRoomCount})
              </p>
            ` : nothing}
            ${this._roomsError ? html`
              <p class="info-text">${this._roomsError} ${panelText(this.hass, 'Your saved rooms are still there.')}</p>
              <button class="add-room-btn" @click="${() => this._loadRooms()}">
                <ha-icon icon="mdi:refresh"></ha-icon>${panelText(this.hass, 'Try again')}
              </button>
            ` : html`
              ${this.rooms.length === 0 ? html`
                <p class="info-text">${panelText(this.hass, 'No rooms yet. Create your first room with "Add Room" below.')}</p>
              ` : this.rooms.map(room => html`
                <div class="room-item ${room.id === this._selectedRoomId ? 'selected' : ''}">
                  <button class="room-select" @click=${() => this._selectRoom(room.id)}
                    aria-label=${panelText(this.hass, 'Open {name}', { name: room.name })} aria-current=${room.id === this._selectedRoomId ? 'true' : 'false'}>
                    <span class="room-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></span>
                    <span class="room-name" data-i18n-ignore>${room.name}</span>
                  </button>
                  <div class="room-actions" aria-label="${panelText(this.hass, 'Room actions')}">
                    <button class="room-action" @click=${() => this._openRenameRoom(room.id)}
                      title="${panelText(this.hass, 'Rename room')}" aria-label=${panelText(this.hass, 'Rename {name}', { name: room.name })}>
                      <ha-icon icon="mdi:pencil-outline"></ha-icon>
                    </button>
                    <button class="room-action delete" @click=${() => this._openDeleteRoom(room.id)}
                      title="${panelText(this.hass, 'Delete room')}" aria-label=${panelText(this.hass, 'Delete {name}', { name: room.name })}>
                      <ha-icon icon="mdi:trash-can-outline"></ha-icon>
                    </button>
                  </div>
                </div>
              `)}
              <button class="add-room-btn" @click="${() => { this._newRoomName = ''; this._newRoomWidth = 0; this._newRoomLength = 0; this._showNewRoomDialog = true; }}">
                <ha-icon icon="mdi:plus"></ha-icon>${panelText(this.hass, 'Add Room')}
              </button>
              <div class="room-transfer-actions">
                <button class="room-transfer-btn" @click=${this._openRoomImport}
                  title=${panelText(this.hass, 'Import room backup or LiDAR scan')} aria-label=${panelText(this.hass, 'Import room backup or LiDAR scan')}>
                  <ha-icon icon="mdi:upload-outline"></ha-icon>${panelText(this.hass, 'Import')}
                </button>
                <button class="room-transfer-btn" @click=${this._exportSelectedRoom} ?disabled=${!selectedRoom}
                  title=${panelText(this.hass, 'Export selected room')} aria-label=${panelText(this.hass, 'Export selected room')}>
                  <ha-icon icon="mdi:download-outline"></ha-icon>${panelText(this.hass, 'Export')}
                </button>
              </div>
              <input id="room-import-file" class="visually-hidden" type="file" accept=".json,application/json"
                aria-label=${panelText(this.hass, 'Choose a SmartHomeShop room backup or Apple RoomPlan scan (.json).')}
                @change=${this._handleRoomImportFile} />
              ${this._roomTransferNotice ? html`
                <div class="room-transfer-notice ${this._roomTransferNotice.tone}" role=${this._roomTransferNotice.tone === 'error' ? 'alert' : 'status'}>
                  <ha-icon icon=${this._roomTransferNotice.tone === 'error' ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'}></ha-icon>
                  <span>${this._roomTransferNotice.text}</span>
                </div>
              ` : nothing}
            `}
          </div>
        </div>

        <div>
          <div class="section-title"><ha-icon icon="mdi:tools"></ha-icon>${panelText(this.hass, 'Tools')}</div>
          ${this._designMode === 'layout' ? html`
            <div class="tool-grid">
              <button class="tool-btn ${this._toolMode === 'select' ? 'active' : ''}" aria-pressed="${this._toolMode === 'select'}" @click="${() => this._setToolMode('select')}">
                <ha-icon icon="mdi:cursor-default"></ha-icon><span>${panelText(this.hass, 'Select')}</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'walls' ? 'active' : ''}" aria-pressed="${this._toolMode === 'walls'}" @click="${() => this._setToolMode('walls')}">
                <ha-icon icon="mdi:wall"></ha-icon><span>${panelText(this.hass, 'Walls')}</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'door' ? 'active' : ''}" aria-pressed="${this._toolMode === 'door'}" @click="${() => this._setToolMode('door')}">
                <ha-icon icon="mdi:door"></ha-icon><span>${panelText(this.hass, 'Door')}</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'window' ? 'active' : ''}" aria-pressed="${this._toolMode === 'window'}" @click="${() => this._setToolMode('window')}">
                <ha-icon icon="mdi:window-closed-variant"></ha-icon><span>${panelText(this.hass, 'Window')}</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'mirror' ? 'active' : ''}" aria-pressed="${this._toolMode === 'mirror'}" @click="${() => this._setToolMode('mirror')}">
                <ha-icon icon="mdi:mirror-rectangle"></ha-icon><span>${panelText(this.hass, 'Mirror')}</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'furniture' ? 'active' : ''}" aria-pressed="${this._toolMode === 'furniture'}" @click="${() => this._setToolMode('furniture')}">
                <ha-icon icon="mdi:sofa"></ha-icon><span>${panelText(this.hass, 'Furniture')}</span>
              </button>
            </div>
          ` : html`
            <div class="tool-grid">
              <button class="tool-btn ${this._toolMode === 'select' ? 'active' : ''}" aria-pressed="${this._toolMode === 'select'}" @click="${() => this._setToolMode('select')}">
                <ha-icon icon="mdi:cursor-default"></ha-icon><span>${panelText(this.hass, 'Select')}</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'sensor' ? 'active' : ''}" aria-pressed="${this._toolMode === 'sensor'}" @click="${() => this._setToolMode('sensor')}">
                <ha-icon icon="mdi:radar"></ha-icon><span>${panelText(this.hass, 'Sensors')}</span>
              </button>
              <button class="tool-btn ${this._toolMode === 'zone' ? 'active' : ''}" aria-pressed="${this._toolMode === 'zone'}" @click="${() => this._startDrawingAnyZone()}" style="grid-column: span 2;">
                <ha-icon icon="mdi:vector-polygon"></ha-icon><span>${panelText(this.hass, 'Draw Zone')}</span>
              </button>
            </div>
          `}
        </div>

        <div class="instructions">
          <div class="instructions-title">${panelText(this.hass, instr.title)}</div>
          <div class="instructions-text">${panelText(this.hass, instr.text)}</div>
        </div>
      </div>

      <div class="canvas-area" style="position: relative;">
          <div class="canvas-header">
          <div class="header-group canvas-context">
            ${selectedRoom ? html`
              <div class="workspace-heading">
                <strong data-i18n-ignore>${selectedRoom.name}</strong>
                <span>${this._roomPoints.length >= 3
                  ? `${this._calculateArea().toFixed(1)} m² · ${this._roomPoints.length} ${panelText(this.hass, 'Corners')}`
                  : panelText(this.hass, 'Room layout')}</span>
              </div>
              <div class="mode-toggle">
                <button class="mode-btn ${this._designMode === 'layout' ? 'active' : ''}" aria-pressed="${this._designMode === 'layout'}" @click="${() => this._setDesignMode('layout')}">
                  <ha-icon icon="mdi:floor-plan"></ha-icon>${panelText(this.hass, 'Layout')}
                </button>
                <button class="mode-btn ${this._designMode === 'sensors' ? 'active' : ''}" aria-pressed="${this._designMode === 'sensors'}" @click="${() => this._setDesignMode('sensors')}">
                  <ha-icon icon="mdi:radar"></ha-icon>${panelText(this.hass, 'Sensors & Zones')}
                </button>
              </div>
            ` : html`<span class="room-label">${panelText(this.hass, 'No room selected')}</span>`}
          </div>
          <div class="header-group">
            ${selectedRoom ? html`
              <div class="view-toggle">
                <button class="view-toggle-btn ${this._viewMode === '2d' ? 'active' : ''}" aria-pressed="${this._viewMode === '2d'}" @click="${() => this._viewMode = '2d'}" title="${panelText(this.hass, '2D floor plan')}">
                  <ha-icon icon="mdi:floor-plan"></ha-icon>2D
                </button>
                <button class="view-toggle-btn ${this._viewMode === '3d' ? 'active' : ''}" aria-pressed="${this._viewMode === '3d'}" @click="${this._toggleViewMode}" title="${panelText(this.hass, '3D view')}">
                  <ha-icon icon="mdi:cube-outline"></ha-icon>3D
                </button>
              </div>
              ${this._designMode === 'sensors' ? html`
                <button class="push-btn" @click="${this._pushToESPHome}" ?disabled="${this._pushingToESPHome || !this._sensors.some(sn => sn.deviceId) || hasLinkedHardwareModeMismatch || hasUnreadyLinkedPositioningRadar}"
                        title="${panelText(this.hass, hasLinkedHardwareModeMismatch || hasUnreadyLinkedPositioningRadar ? 'Wait for the LD2460 installation settings before pushing zones' : 'Push zones and entry lines to the linked sensors')}">
                  <ha-icon icon="mdi:upload"></ha-icon>
                  ${panelText(this.hass, this._pushingToESPHome ? 'Pushing...' : 'Push')}
                </button>
              ` : nothing}
              <button class="save-btn ${this._dirty ? 'dirty' : ''}" title="${panelText(this.hass, this._dirty ? 'Save' : 'Saved')}" @click="${this._saveRoom}" ?disabled="${this._saving || !this._dirty}">
                <ha-icon icon="mdi:content-save"></ha-icon>
                ${panelText(this.hass, this._saving ? 'Saving...' : this._dirty ? 'Save' : 'Saved')}
              </button>
            ` : nothing}
          </div>
        </div>
        ${!selectedRoom ? html`
          <div class="empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <h3>${panelText(this.hass, 'Floorplan Designer')}</h3>
            <p>${panelText(this.hass, 'Select or create a room to draw the layout, place sensors and configure zones')}</p>
          </div>
        ` : this._viewMode === '2d' ? html`
          <svg viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}"
               @click="${this._handleCanvasClick}"
               @contextmenu="${this._handleContextMenu}"
               @mousemove="${this._handleCanvasMove}"
               @mousedown="${this._handleCanvasDown}"
               @mouseup="${this._handleCanvasUp}"
               @mouseleave="${this._handleCanvasUp}"
               @wheel="${this._handleWheel}">
            <!-- Arrow markers voor entry lijnen -->
            <defs>
              <marker id="arrowhead-in" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
              </marker>
              <marker id="arrowhead-out" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
            </defs>
            ${this._renderGrid()}
            ${this._renderRoom()}
            ${this._renderDoorsAndWindows()}
            ${this._renderFurniture()}
            ${this._renderFurnitureGhost()}
            ${this._renderSensorFOV()}
            ${this._renderZones()}
            ${this._renderMirrorReflectionZones()}
            ${this._renderWallDrawPreview()}
            ${this._renderDoorWindowPreview()}
            ${this._renderSensorIcon()}
          </svg>
          <div class="canvas-controls">
            <div class="control-group">
              <button class="control-btn" title="${panelText(this.hass, 'Zoom in')}" aria-label="${panelText(this.hass, 'Zoom in')}" @click="${() => this._zoom = Math.min(5, this._zoom * 1.25)}"><ha-icon icon="mdi:plus"></ha-icon></button>
              <span class="zoom-value">${Math.round(this._zoom * 100)}%</span>
              <button class="control-btn" title="${panelText(this.hass, 'Zoom out')}" aria-label="${panelText(this.hass, 'Zoom out')}" @click="${() => this._zoom = Math.max(0.2, this._zoom / 1.25)}"><ha-icon icon="mdi:minus"></ha-icon></button>
              <button class="control-btn" title="${panelText(this.hass, 'Fit room to screen')}" aria-label="${panelText(this.hass, 'Fit room to screen')}" @click="${() => this._autoZoom()}"><ha-icon icon="mdi:fit-to-screen"></ha-icon></button>
            </div>
            ${this._toolMode === 'walls' ? html`
              <div class="control-group">
                <button class="control-btn" @click="${this._undoLastWallPoint}" title="${panelText(this.hass, 'Undo last corner')}" aria-label="${panelText(this.hass, 'Undo last corner')}"><ha-icon icon="mdi:undo"></ha-icon></button>
                <button class="control-btn" @click="${this._clearWalls}" title="${panelText(this.hass, 'Clear walls')}" aria-label="${panelText(this.hass, 'Clear walls')}"><ha-icon icon="mdi:delete"></ha-icon></button>
              </div>
            ` : nothing}
          </div>
        ` : html`
          <canvas
            id="canvas3d"
            class="canvas3d"
            tabindex="0"
            role="application"
            aria-label="${panelText(this.hass, '3D room view. Use arrow keys to rotate and plus or minus to zoom.')}"
            aria-describedby="room-3d-live-summary"
            @pointerdown="${this._handle3DPointerDown}"
            @pointermove="${this._handle3DPointerMove}"
            @pointerup="${this._handle3DPointerUp}"
            @pointercancel="${this._handle3DPointerUp}"
            @wheel="${this._handle3DWheel}"
            @keydown="${this._handle3DKeydown}"
          ></canvas>
          <p id="room-3d-live-summary" class="sr-only" aria-live="polite">
            ${!jointCountKnown
              ? panelText(this.hass, '{count} source tracks visible; room count is still being verified.', { count: this._roomTracks.filter(track => !track.held).length })
              : panelText(this.hass, this._roomTracks.filter(track => !track.held).length === 1 ? '1 room track visible.' : '{count} room tracks visible.', { count: this._roomTracks.filter(track => !track.held).length })}
          </p>
          <div class="view3d-info">
            <ha-icon icon="mdi:rotate-3d-variant"></ha-icon>
            <span>${panelText(this.hass, 'Drag or swipe to rotate • Scroll or use plus and minus to zoom')}</span>
          </div>
          <div class="view3d-controls" role="group" aria-label="${panelText(this.hass, '3D view controls')}">
            <button class="control-btn" title="${panelText(this.hass, 'Rotate left')}" aria-label="${panelText(this.hass, 'Rotate left')}" @click=${() => this._rotate3D(12)}><ha-icon icon="mdi:rotate-left"></ha-icon></button>
            <button class="control-btn" title="${panelText(this.hass, 'Rotate right')}" aria-label="${panelText(this.hass, 'Rotate right')}" @click=${() => this._rotate3D(-12)}><ha-icon icon="mdi:rotate-right"></ha-icon></button>
            <button class="control-btn" title="${panelText(this.hass, 'Tilt up')}" aria-label="${panelText(this.hass, 'Tilt up')}" @click=${() => this._rotate3D(0, 7.5)}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
            <button class="control-btn" title="${panelText(this.hass, 'Tilt down')}" aria-label="${panelText(this.hass, 'Tilt down')}" @click=${() => this._rotate3D(0, -7.5)}><ha-icon icon="mdi:arrow-down"></ha-icon></button>
            <button class="control-btn" title="${panelText(this.hass, 'Zoom in')}" aria-label="${panelText(this.hass, 'Zoom in')}" @click=${() => this._zoom3D(0.9)}><ha-icon icon="mdi:plus"></ha-icon></button>
            <button class="control-btn" title="${panelText(this.hass, 'Zoom out')}" aria-label="${panelText(this.hass, 'Zoom out')}" @click=${() => this._zoom3D(1.1)}><ha-icon icon="mdi:minus"></ha-icon></button>
            <button class="control-btn" title="${panelText(this.hass, 'Reset 3D view')}" aria-label="${panelText(this.hass, 'Reset 3D view')}" @click=${this._reset3DCamera}><ha-icon icon="mdi:home-outline"></ha-icon></button>
          </div>
        `}
      </div>

      <div class="sidebar sidebar-right">
        ${this._designMode === 'layout' ? this._renderLayoutSidebar() : html`
        ${this._toolMode === 'sensor' ? html`
          <div>
            <div class="section-title">${panelText(this.hass, 'Sensors').toUpperCase()} (${this._sensors.length})</div>
            <div class="sensor-list">
              ${this._sensors.map((sn, i) => {
                const label = this._sensorLabel(sn, i);
                return html`
                <div class="sensor-item ${this._selectedSensorIndex === i ? 'selected' : ''}">
                  <button type="button" class="sensor-select"
                    aria-label="${panelText(this.hass, 'Select {name}', { name: label })}"
                    @click="${() => this._selectedSensorIndex = i}">
                    <span class="sensor-dot" style="background: ${this._sensorColor(i)};">${i + 1}</span>
                    <span class="sensor-item-info">
                      <span class="sensor-item-name">${label}</span>
                      <span class="sensor-item-sub">
                        ${sn.deviceId
                          ? panelText(this.hass, sn.mountingMode === 'ceiling' ? 'Ceiling mounted · Linked' : 'Wall mounted · Linked')
                          : panelText(this.hass, 'No device linked')}
                      </span>
                    </span>
                  </button>
                  <button class="delete-btn" title="${panelText(this.hass, 'Remove sensor')}" aria-label="${panelText(this.hass, 'Remove sensor')}" @click="${() => this._removeSensor(i)}">
                    <ha-icon icon="mdi:delete"></ha-icon>
                  </button>
                </div>
              `;})}
              <button class="add-sensor-btn" @click="${this._addSensor}">
                <ha-icon icon="mdi:plus"></ha-icon>${panelText(this.hass, 'Add sensor')}
              </button>
            </div>
          </div>

          ${this._renderRoomAggregation()}

          ${this._selectedSensor ? html`
            <div>
              <div class="section-title">${panelText(this.hass, 'Sensor {number} settings', { number: this._selectedSensorIndex! + 1 }).toUpperCase()}</div>
              <div class="setting-item">
                <label for="selected-room-radar">${panelText(this.hass, 'Room sensor')}</label>
                <select id="selected-room-radar"
                  .value="${selectedRadar?.id || ''}"
                  ?disabled="${this._radarProfilesLoading}"
                  @change="${(e: Event) => this._selectRadarDevice(this._selectedSensorIndex!, (e.target as HTMLSelectElement).value || null)}"
                >
                  <option value="">${panelText(this.hass, this._radarProfilesLoading ? 'Detecting radar hardware...' : '-- Select radar --')}</option>
                  ${radarDevices.map(d => html`
                    <option value="${d.id}" ?disabled=${this._sensors.some((item, itemIndex) => itemIndex !== this._selectedSensorIndex && item.deviceId === d.id) || Boolean(this._radarLinkedRoomName(d.id))}>
                      ${d.name} · ${d.profile.radarModel.toUpperCase()} · ${panelText(this.hass, d.profile.mountingMode === 'ceiling' ? 'Ceiling' : 'Wall')}${d.profile.positioningAvailable ? '' : ` ${panelText(this.hass, '· Presence only')}`}
                    </option>
                  `)}
                </select>
                ${this._radarProfilesError ? html`
                  <p class="firmware-status-note warning">
                    ${this._radarProfilesError} ${panelText(this.hass, 'Legacy detection is active until Home Assistant reloads the integration.')}
                  </p>
                ` : nothing}
                ${this._selectedSensor.deviceId ? html`
                  <div class="firmware-status">
                    ${selectedRadar ? html`
                      <div class="profile-heading">
                        <span class="radar-model">${selectedRadar.profile.radarModel.toUpperCase()}</span>
                        <span class="profile-source ${selectedRadar.profile.metadataSource}">
                          ${panelText(this.hass, selectedRadar.profile.metadataSource === 'firmware' ? 'Firmware profile' : 'Legacy profile')}
                        </span>
                      </div>
                    ` : html`
                      <p class="firmware-status-note warning">
                        ${panelText(this.hass, 'This saved radar is not currently available in Home Assistant. The room stays unchanged; reconnect it or choose another positioning radar.')}
                      </p>
                    `}
                    <div class="firmware-status-row">
                      <span>${panelText(this.hass, 'Live tracking')}</span>
                      <span class="firmware-status-value">
                        ${!selectedRadar
                          ? panelText(this.hass, 'Radar unavailable')
                          : selectedRadarCapabilities.availableTargetCount > 0
                          ? panelText(
                            this.hass,
                            selectedRadarCapabilities.availableTargetCount === 1
                              ? '{count} coordinate pair · max {maximum}'
                              : '{count} coordinate pairs · max {maximum}',
                            { count: selectedRadarCapabilities.availableTargetCount, maximum: selectedRadarCapabilities.targetCount },
                          )
                          : panelText(this.hass, 'Not detected')}
                      </span>
                    </div>
                    ${selectedRadar ? html`
                      <div class="firmware-status-row">
                        <span>${panelText(this.hass, 'Projection')}</span>
                        <span class="firmware-status-value">
                          ${panelText(this.hass, selectedRadar.profile.coordinateProjection === 'floor_xy' ? 'Floor X/Y' : 'Forward X/Y')} · ×${selectedRadar.profile.coordinateScaleToMm}
                        </span>
                      </div>
                    ` : nothing}
                    <div class="firmware-status-row">
                      <span>${panelText(this.hass, 'Zone sync')}</span>
                      <span class="firmware-status-value">
                        ${!selectedRadar
                          ? panelText(this.hass, 'Not available')
                          : selectedRadarCapabilities.zoneProfiles || selectedRadarCapabilities.interferenceZones || selectedRadarCapabilities.smoothing
                          ? panelText(this.hass, 'Advanced')
                          : selectedRadarCapabilities.polygonZones
                            ? panelText(this.hass, 'Polygon zones')
                            : panelText(this.hass, 'Visualization only')}
                      </span>
                    </div>
                    ${selectedRadar?.profile.supplementaryPresenceSensors.length ? html`
                      <div class="supplementary-sources">
                        <strong>${panelText(this.hass, 'Additional occupancy sensors')}</strong>
                        <span>${selectedRadar.profile.supplementaryPresenceSensors.map(entityId => this._entityLabel(entityId)).join(' · ')}</span>
                        <small>${panelText(this.hass, 'These improve presence detection but never create or replace X/Y targets.')}</small>
                      </div>
                    ` : nothing}
                    ${hardwareModeMismatch && selectedRadar ? html`
                      <div class="mode-warning" role="alert">
                        <ha-icon icon="mdi:alert-outline"></ha-icon>
                        <div>
                          <strong>${panelText(this.hass, 'Radar hardware mode does not match')}</strong>
                          <span>
                            ${panelText(this.hass, '{current} is active; {required} is required for {mounting} mounting.', {
                              current: panelText(this.hass, currentHardwareMode || 'unknown'),
                              required: panelText(this.hass, this._requiredHardwareMode(selectedRadar) || 'unknown'),
                              mounting: panelText(this.hass, selectedRadar.profile.mountingMode),
                            })}
                          </span>
                          <button @click="${() => this._applyRequiredHardwareMode(selectedRadar)}" ?disabled="${this._changingHardwareMode}">
                            ${this._changingHardwareMode
                              ? panelText(this.hass, 'Applying...')
                              : panelText(this.hass, 'Switch to {mode}', {
                                mode: panelText(this.hass, this._requiredHardwareMode(selectedRadar) || 'unknown'),
                              })}
                          </button>
                        </div>
                      </div>
                    ` : selectedRadar?.profile.hardwareModeCapability === 'top_or_side' && !currentHardwareMode ? html`
                      <div class="mode-warning" role="status">
                        <ha-icon icon="mdi:clock-outline"></ha-icon>
                        <div>
                          <strong>${this._text('radar.readiness.waiting_mode')}</strong>
                          <span>${this._text('radar.readiness.waiting_mode_help')}</span>
                          ${selectedRadar.profile.installationModeEntityId ? html`
                            <button @click="${() => this._applyRequiredHardwareMode(selectedRadar)}" ?disabled="${this._changingHardwareMode}">
                              ${this._changingHardwareMode ? this._text('radar.installation.saving') : this._text('radar.readiness.set_side')}
                            </button>
                          ` : nothing}
                        </div>
                      </div>
                    ` : selectedRadar?.profile.hardwareModeCapability === 'top_or_side' ? html`
                      <p class="firmware-status-note good">
                        ${panelText(this.hass, '{mode} hardware mode matches this mounting.', {
                          mode: panelText(this.hass, currentHardwareMode || 'not reported'),
                        })}
                      </p>
                    ` : selectedRadar?.profile.hardwareModeCapability === 'fixed' ? html`
                      <p class="firmware-status-note">${panelText(this.hass, 'This radar uses fixed coordinates and needs no top/side hardware setting.')}</p>
                    ` : nothing}
                    ${!selectedRadar ? nothing : !selectedRadarCapabilities.polygonZones ? html`
                      <p class="firmware-status-note warning">
                        ${panelText(this.hass, 'Live room tracking is available, but this firmware does not expose polygon zones to Home Assistant.')}
                      </p>
                    ` : !selectedRadarCapabilities.zoneProfiles || !selectedRadarCapabilities.interferenceZones || !selectedRadarCapabilities.smoothing ? html`
                      <p class="firmware-status-note">
                        ${panelText(this.hass, 'Base detection, exclusion and entry zones are supported. Profiles, interference zones and smoothing require updated firmware.')}
                      </p>
                    ` : html`
                      <p class="firmware-status-note">${panelText(this.hass, 'All zone and tracking controls are available.')}</p>
                    `}
                    ${selectedRadar?.profile.coordinateProjection === 'floor_xy' ? html`
                      <p class="firmware-status-note">
                        ${panelText(this.hass, 'Coordinates already represent positions on the floor. Orientation aligns the radar axes with this room without applying wall-facing assumptions.')}
                      </p>
                    ` : nothing}
                    ${selectedRadar?.profile.metadataSource === 'legacy_fallback' ? html`
                      <p class="firmware-status-note warning">
                        ${panelText(this.hass, 'This profile was derived from older firmware. Update the device firmware to publish mounting, radar model and coordinate metadata explicitly.')}
                      </p>
                    ` : nothing}
                    ${selectedRadar ? html`
                      <details class="radar-diagnostics">
                        <summary>${panelText(this.hass, 'Detection details')}</summary>
                        <dl>
                          <div><dt>${panelText(this.hass, 'Product')}</dt><dd>${selectedRadar.profile.detectedProduct || selectedRadar.productFamily}</dd></div>
                          <div><dt>${panelText(this.hass, 'Source')}</dt><dd>${selectedRadar.profile.metadataSource}</dd></div>
                          <div><dt>${panelText(this.hass, 'Radar')}</dt><dd>${selectedRadar.profile.radarModel}</dd></div>
                          <div><dt>${panelText(this.hass, 'Mounting')}</dt><dd>${panelText(this.hass, selectedRadar.profile.mountingMode)} · ${selectedRadar.profile.coordinateProjection}</dd></div>
                          <div><dt>${panelText(this.hass, 'Coordinate frame')}</dt><dd>${selectedRadar.profile.coordinateFrame || panelText(this.hass, 'not reported')}</dd></div>
                          <div><dt>${panelText(this.hass, 'Coordinate scale')}</dt><dd>${panelText(this.hass, '{scale} to mm', { scale: selectedRadar.profile.coordinateScaleToMm })}</dd></div>
                          <div><dt>${panelText(this.hass, 'Hardware mode')}</dt><dd>${panelText(this.hass, '{current} / required {required}', {
                            current: panelText(this.hass, currentHardwareMode || 'not reported'),
                            required: panelText(this.hass, this._requiredHardwareMode(selectedRadar) || 'none'),
                          })}</dd></div>
                          ${selectedRadar.profile.radarModel === 'ld2460' ? html`
                            <div><dt>${panelText(this.hass, 'Radar height')}</dt><dd>${installationHeightM === null ? panelText(this.hass, 'not reported') : `${installationHeightM.toFixed(2)} m`}</dd></div>
                            <div><dt>${panelText(this.hass, 'Radar angle')}</dt><dd>${installationAngleDeg === null ? panelText(this.hass, 'not reported') : `${installationAngleDeg.toFixed(1)}°`}</dd></div>
                          ` : nothing}
                        </dl>
                        ${selectedRadar.profile.missingMetadataEntities.length ? html`
                          <p>${panelText(this.hass, 'Missing')}: ${selectedRadar.profile.missingMetadataEntities.join(', ')}</p>
                        ` : nothing}
                        ${selectedRadar.profile.invalidMetadataEntities.length ? html`
                          <p>${panelText(this.hass, 'Invalid')}: ${selectedRadar.profile.invalidMetadataEntities.join(', ')}</p>
                        ` : nothing}
                      </details>
                    ` : nothing}
                  </div>
                ` : nothing}
              </div>
              <div class="setting-item">
                <label>${panelText(this.hass, 'Mounting type')}</label>
                ${selectedRadar?.profile.metadataSource === 'firmware' ? html`
                  <div class="profile-lock">
                    <ha-icon icon="${selectedRadar.profile.mountingMode === 'ceiling' ? 'mdi:ceiling-light' : 'mdi:wall'}"></ha-icon>
                    <span>${panelText(this.hass, selectedRadar.profile.mountingMode === 'ceiling' ? 'Ceiling mounted' : 'Wall mounted')} · ${panelText(this.hass, 'reported by firmware')}</span>
                  </div>
                  ${this._selectedSensor.mountingMode !== selectedRadar.profile.mountingMode ? html`
                    <p class="firmware-status-note warning">This saved room still uses ${this._selectedSensor.mountingMode} projection.</p>
                    <button class="secondary-action" @click="${() => this._setSensorMountingMode(this._selectedSensorIndex!, selectedRadar.profile.mountingMode)}">
                      Use firmware mounting
                    </button>
                  ` : nothing}
                ` : html`
                  <select .value="${this._selectedSensor.mountingMode}"
                          @change="${(e: Event) => this._setSensorMountingMode(this._selectedSensorIndex!, (e.target as HTMLSelectElement).value as SensorMountingMode)}">
                    <option value="wall">Wall mounted</option>
                    <option value="ceiling">Ceiling mounted</option>
                  </select>
                  <p class="firmware-status-note">Manual choice for legacy firmware. Saved room values are preserved.</p>
                `}
              </div>
              ${installationAvailability === 'complete' && selectedRadar && installationHeightEntityId && installationAngleEntityId ? html`
                <section class="radar-installation" aria-labelledby="ld2460-installation-title">
                  <div class="radar-installation-header">
                    <ha-icon icon="mdi:angle-acute"></ha-icon>
                    <div>
                      <strong id="ld2460-installation-title">${this._text('radar.installation.title')}</strong>
                      <span>${this._text('radar.installation.description')}</span>
                    </div>
                  </div>
                  <div class="radar-installation-controls">
                    <div class="radar-installation-control">
                      <label for="ld2460-height">
                        ${this._text('radar.installation.height')}
                        <span>${installationHeightM === null ? '-' : `${installationHeightM.toFixed(2)} m`}</span>
                      </label>
                      <div class="radar-installation-input">
                        <input id="ld2460-height" type="number" inputmode="decimal"
                          min="${LD2460_HEIGHT_RANGE.minimum}" max="${LD2460_HEIGHT_RANGE.maximum}" step="${LD2460_HEIGHT_RANGE.step}"
                          aria-describedby="ld2460-installation-help"
                          .value="${this._installationDraft(installationHeightEntityId, installationHeightM)}"
                          ?disabled="${hardwareModeMismatch || installationHeightStatus !== 'ready' || this._installationUpdateEntityId !== null}"
                          @input="${(event: Event) => this._setInstallationDraft(installationHeightEntityId, (event.target as HTMLInputElement).value)}"
                          @keydown="${(event: KeyboardEvent) => {
                            if (event.key === 'Enter') void this._applyRadarInstallationValue(selectedRadar, this._selectedSensorIndex!, 'height');
                          }}" />
                        <button
                          ?disabled="${hardwareModeMismatch || installationHeightStatus !== 'ready' || this._installationUpdateEntityId !== null}"
                          @click="${() => this._applyRadarInstallationValue(selectedRadar, this._selectedSensorIndex!, 'height')}">
                          ${this._installationUpdateEntityId === installationHeightEntityId
                            ? this._text('radar.installation.saving')
                            : this._text('radar.installation.apply')}
                        </button>
                      </div>
                      ${this._installationFeedback[installationHeightEntityId] ? html`
                        <div class="radar-installation-feedback ${this._installationFeedback[installationHeightEntityId].tone}" role="status">
                          <ha-icon icon="${this._installationFeedback[installationHeightEntityId].tone === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}"></ha-icon>
                          <span>${this._installationFeedback[installationHeightEntityId].text}</span>
                        </div>
                      ` : installationHeightStatus !== 'ready' ? html`
                        <div class="radar-installation-feedback error" role="status">
                          <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
                          <span>${this._text('radar.installation.error.unavailable')}</span>
                        </div>
                      ` : nothing}
                    </div>
                    <div class="radar-installation-control">
                      <label for="ld2460-angle">
                        ${this._text('radar.installation.angle')}
                        <span>${installationAngleDeg === null ? '-' : `${installationAngleDeg.toFixed(1)}°`}</span>
                      </label>
                      <div class="radar-installation-input">
                        <input id="ld2460-angle" type="number" inputmode="decimal"
                          min="${LD2460_ANGLE_RANGE.minimum}" max="${LD2460_ANGLE_RANGE.maximum}" step="${LD2460_ANGLE_RANGE.step}"
                          aria-describedby="ld2460-installation-help"
                          .value="${this._installationDraft(installationAngleEntityId, installationAngleDeg)}"
                          ?disabled="${hardwareModeMismatch || installationAngleStatus !== 'ready' || this._installationUpdateEntityId !== null}"
                          @input="${(event: Event) => this._setInstallationDraft(installationAngleEntityId, (event.target as HTMLInputElement).value)}"
                          @keydown="${(event: KeyboardEvent) => {
                            if (event.key === 'Enter') void this._applyRadarInstallationValue(selectedRadar, this._selectedSensorIndex!, 'angle');
                          }}" />
                        <button
                          ?disabled="${hardwareModeMismatch || installationAngleStatus !== 'ready' || this._installationUpdateEntityId !== null}"
                          @click="${() => this._applyRadarInstallationValue(selectedRadar, this._selectedSensorIndex!, 'angle')}">
                          ${this._installationUpdateEntityId === installationAngleEntityId
                            ? this._text('radar.installation.saving')
                            : this._text('radar.installation.apply')}
                        </button>
                      </div>
                      ${this._installationFeedback[installationAngleEntityId] ? html`
                        <div class="radar-installation-feedback ${this._installationFeedback[installationAngleEntityId].tone}" role="status">
                          <ha-icon icon="${this._installationFeedback[installationAngleEntityId].tone === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}"></ha-icon>
                          <span>${this._installationFeedback[installationAngleEntityId].text}</span>
                        </div>
                      ` : installationAngleStatus !== 'ready' ? html`
                        <div class="radar-installation-feedback error" role="status">
                          <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
                          <span>${this._text('radar.installation.error.unavailable')}</span>
                        </div>
                      ` : nothing}
                    </div>
                  </div>
                  <p id="ld2460-installation-help" class="radar-installation-note">
                    ${this._text('radar.installation.recommendation')}
                  </p>
                  ${hardwareModeMismatch ? html`
                    <p class="radar-installation-note warning">${this._text('radar.installation.mode_first')}</p>
                  ` : nothing}
                  ${installationHeightM !== null && Math.abs((this._selectedSensor.heightMm / 1000) - installationHeightM) >= 0.005 ? html`
                    <button class="secondary-action" @click="${() => this._updateSensor(this._selectedSensorIndex!, { heightMm: Math.round(installationHeightM * 1000) })}">
                      <ha-icon icon="mdi:sync"></ha-icon>${this._text('radar.installation.use_radar_height')}
                    </button>
                  ` : nothing}
                </section>
              ` : installationAvailability === 'partial' || installationAvailability === 'firmware_update' ? html`
                <section class="radar-installation" aria-labelledby="ld2460-installation-title">
                  <div class="radar-installation-header">
                    <ha-icon icon="mdi:update"></ha-icon>
                    <div>
                      <strong id="ld2460-installation-title">${this._text('radar.installation.title')}</strong>
                      <span>${this._text('radar.installation.firmware_update')}</span>
                    </div>
                  </div>
                </section>
              ` : nothing}
              ${selectedRadar?.profile.radarModel === 'ld2460' && completeSectorControls ? html`
                <section class="radar-sector" aria-labelledby="ld2460-sector-title">
                  <div class="radar-installation-header">
                    <ha-icon icon="mdi:radar"></ha-icon>
                    <div>
                      <strong id="ld2460-sector-title">${this._text('radar.sector.title')}</strong>
                      <span>${this._text('radar.sector.description')}</span>
                    </div>
                  </div>
                  <div class="radar-sector-grid">
                    ${([
                      {
                        id: selectedRadar.profile.detectionDistanceEntityId!,
                        label: this._text('radar.sector.distance'),
                        fallback: selectedRadar.profile.detectionDistanceM,
                        min: LD2460_DETECTION_DISTANCE_RANGE.minimum,
                        max: LD2460_DETECTION_DISTANCE_RANGE.maximum,
                        step: LD2460_DETECTION_DISTANCE_RANGE.step,
                      },
                      {
                        id: selectedRadar.profile.detectionStartAngleEntityId!,
                        label: this._text('radar.sector.start_angle'),
                        fallback: selectedRadar.profile.detectionStartAngleDeg,
                        min: LD2460_DETECTION_ANGLE_RANGE.minimum,
                        max: LD2460_DETECTION_ANGLE_RANGE.maximum,
                        step: LD2460_DETECTION_ANGLE_RANGE.step,
                      },
                      {
                        id: selectedRadar.profile.detectionEndAngleEntityId!,
                        label: this._text('radar.sector.end_angle'),
                        fallback: selectedRadar.profile.detectionEndAngleDeg,
                        min: LD2460_DETECTION_ANGLE_RANGE.minimum,
                        max: LD2460_DETECTION_ANGLE_RANGE.maximum,
                        step: LD2460_DETECTION_ANGLE_RANGE.step,
                      },
                    ]).map(control => html`
                      <div class="radar-sector-control">
                        <label for="sector-${control.id.replace(/[^a-z0-9_-]/gi, '-')}">${control.label}</label>
                        <input id="sector-${control.id.replace(/[^a-z0-9_-]/gi, '-')}" type="number" inputmode="decimal"
                          min="${control.min}" max="${control.max}" step="${control.step}"
                          .value="${this._sectorDrafts[control.id] ?? String(this._sectorValue(control.id, control.fallback) ?? '')}"
                          ?disabled="${this._sectorUpdateEntityId !== null || radarInstallationEntityStatus(this.hass.states[control.id]) !== 'ready'}"
                          @input="${(event: Event) => this._setSectorDraft(selectedRadar, control.id, (event.target as HTMLInputElement).value)}" />
                      </div>
                    `)}
                  </div>
                  <p class="radar-installation-note">${this._text('radar.sector.directions')}</p>
                  <p class="radar-installation-note warning">${this._text('radar.sector.pause_notice')}</p>
                  <p class="radar-installation-note">${this._text('radar.sector.reflections')}</p>
                  ${this._sectorFeedback ? html`
                    <div class="radar-installation-feedback ${this._sectorFeedback.tone}" role="status" aria-live="polite">
                      <ha-icon icon="${this._sectorFeedback.tone === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'}"></ha-icon>
                      <span>${this._sectorFeedback.text}</span>
                    </div>
                  ` : nothing}
                </section>
              ` : selectedRadar?.profile.radarModel === 'ld2460' && (partialSectorControls || !sectorEntityIds.some(Boolean)) ? html`
                <section class="radar-sector">
                  <div class="radar-installation-header">
                    <ha-icon icon="mdi:update"></ha-icon>
                    <div>
                      <strong>${this._text('radar.sector.title')}</strong>
                      <span>${this._text('radar.sector.firmware_update')}</span>
                    </div>
                  </div>
                </section>
              ` : nothing}
              <div class="setting-item">
                <label>${this._selectedSensor.mountingMode === 'ceiling' ? 'Tracking orientation' : 'Rotation'}: ${this._selectedSensor.rotation}°</label>
                <input type="range" min="0" max="359" .value="${String(this._selectedSensor.rotation)}"
                       @input="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { rotation: parseInt((e.target as HTMLInputElement).value) })}"/>
              </div>
              <div class="setting-item">
                <label>${this._selectedSensor.mountingMode === 'ceiling' ? 'Maximum floor radius' : 'Range'}: ${(this._selectedSensor.range / 1000).toFixed(1)}m</label>
                <input type="range" min="1" max="10" step="0.5" .value="${String(this._selectedSensor.range / 1000)}"
                       @input="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { range: parseFloat((e.target as HTMLInputElement).value) * 1000 })}"/>
              </div>
              <div class="setting-item">
                <label>${this._selectedSensor.mountingMode === 'ceiling' ? 'Coverage angle' : 'FOV'}: ${this._selectedSensor.fov}°</label>
                <input type="range" min="30" max="180" .value="${String(this._selectedSensor.fov)}"
                       @input="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { fov: parseInt((e.target as HTMLInputElement).value) })}"/>
              </div>
              ${installationAvailability !== 'complete' ? html`
                <div class="setting-item">
                  <label>${this._selectedSensor.mountingMode === 'ceiling' ? 'Ceiling height' : 'Mounting height'}: ${((this._selectedSensor.heightMm ?? 2000) / 1000).toFixed(1)}m</label>
                  <input type="range" min="${this._selectedSensor.mountingMode === 'ceiling' ? '2' : '0.2'}" max="${this._selectedSensor.mountingMode === 'ceiling' ? '5' : '3'}" step="0.1" .value="${String((this._selectedSensor.heightMm ?? 2000) / 1000)}"
                         @input="${(e: Event) => this._updateSensor(this._selectedSensorIndex!, { heightMm: Math.round(parseFloat((e.target as HTMLInputElement).value) * 1000) })}"/>
                  ${this._selectedSensor.mountingMode === 'ceiling' ? html`
                    <p class="firmware-status-note">Effective floor radius: ${(this._coverageRadius(this._selectedSensor) / 1000).toFixed(1)}m.</p>
                  ` : nothing}
                </div>
              ` : nothing}
              ${radarDevices.some(device => !device.profile.positioningAvailable) ? html`
                <p class="firmware-status-note">
                  Presence-only radars such as LD2412 are shown for clarity but cannot be selected because they do not expose X/Y positions.
                </p>
              ` : nothing}
            </div>
          ` : nothing}
        ` : this._toolMode === 'zone' && this._drawingZone.length > 0 ? html`
            <div>
              <div class="section-title">CURRENT DRAWING</div>
              <p class="info-text">${this._drawingZone.length} points drawn</p>
              <button class="tool-btn" style="width: 100%;" @click="${() => this._drawingZone = []}">
                <ha-icon icon="mdi:cancel"></ha-icon>
                <span>Cancel</span>
              </button>
        </div>
        ` : ''}

        <div class="settings-panel">
          <div class="settings-panel-header">
            <ha-icon icon="mdi:radar"></ha-icon>
            <span>Sensor coverage calibration</span>
          </div>
          <p class="info-text">
            Measure the furthest positions the selected positioning radar can reliably see.
            This sets the sensor's usable detection area, not the room size.
          </p>
          <div class="coverage-summary ${this._calibration.corners.length === 4 ? 'calibrated' : ''}">
            <ha-icon icon="${this._calibration.corners.length === 4 ? 'mdi:check-circle-outline' : 'mdi:map-marker-path'}"></ha-icon>
            <div>
              <strong>${this._calibration.corners.length === 4 ? 'Detection area measured' : 'No detection area measured'}</strong>
              <span>
                ${this._calibration.corners.length === 4
                  ? `Four points${calibrationSensor ? ` measured with ${this._sensorLabel(calibrationSensor, this._sensors.indexOf(calibrationSensor))}` : ''}.`
                  : 'Select a sensor, then walk to four reliable outer positions.'}
              </span>
            </div>
          </div>
          ${this._calibration.corners.length === 4 ? html`
            <div class="settings-row">
              <label>Use measured area</label>
              <input type="checkbox" .checked="${this._calibration.enabled}"
                     @change="${(e: Event) => this._updateCalibration({ enabled: (e.target as HTMLInputElement).checked })}"/>
            </div>
          ` : nothing}
          <button class="secondary-action" @click="${this._openCoverageCalibration}" ?disabled="${!canCalibrate}">
            <ha-icon icon="mdi:map-marker-radius"></ha-icon>
            ${this._calibration.corners.length === 4 ? 'Measure again' : 'Start live measurement'}
          </button>
          ${!canCalibrate ? html`
            <p class="firmware-status-note warning">
              ${selectedRadar?.profile.radarModel === 'ld2460'
                ? this._text('radar.readiness.calibration_blocked')
                : 'Select an LD2450, LD2460 or LD6002B positioning radar before starting.'}
            </p>
          ` : html`
            <p class="firmware-status-note">
              Uses normalized live X/Y positions from ${this._sensorLabel(this._selectedSensor!, this._selectedSensorIndex!)} (${selectedRadar?.profile.radarModel.toUpperCase()}).
            </p>
          `}
          <div class="settings-row">
            <label>Grid size</label>
            <select .value="${String(this._calibration.gridSizeMm)}"
                    @change="${(e: Event) => this._updateCalibration({ gridSizeMm: parseInt((e.target as HTMLSelectElement).value, 10) as 100 | 300 })}">
              <option value="100">10 cm</option>
              <option value="300">30 cm</option>
            </select>
          </div>
          <div class="settings-row">
            <label>Snap points to grid</label>
            <input type="checkbox" .checked="${this._calibration.snapToGrid}"
                   @change="${(e: Event) => this._updateCalibration({ snapToGrid: (e.target as HTMLInputElement).checked })}"/>
          </div>
          ${this._calibration.enabled && this._calibration.corners.length === 4 ? html`
            <details class="calibration-details">
              <summary>Measured coordinates</summary>
              <div class="corner-grid">
                ${this._calibration.corners.map((corner, index) => html`
                  <div class="corner-row">
                    <strong>P${index + 1}</strong>
                    <span>X ${Math.round(corner.x)} mm</span>
                    <span>Y ${Math.round(corner.y)} mm</span>
                  </div>
                `)}
              </div>
            </details>
          ` : nothing}
        </div>

        <div class="settings-panel">
          <div class="settings-panel-header">
            <ha-icon icon="mdi:radar"></ha-icon>
            <span>${panelText(this.hass, 'Target tracking')}</span>
          </div>
          <div class="settings-row">
            <label for="tracking-smoothing-enabled">${panelText(this.hass, 'Smooth target movement')}</label>
            <input id="tracking-smoothing-enabled" type="checkbox" .checked="${this._tracking.smoothingEnabled}"
                   @change="${(e: Event) => this._updateTracking({ smoothingEnabled: (e.target as HTMLInputElement).checked })}"/>
          </div>
          <div class="setting-item">
            <label for="tracking-smoothing-alpha">${panelText(this.hass, 'Smoothing: {percent}%', { percent: Math.round(this._tracking.smoothingAlpha * 100) })}</label>
            <input id="tracking-smoothing-alpha" type="range" min="0.05" max="1" step="0.05" .value="${String(this._tracking.smoothingAlpha)}"
                   @input="${(e: Event) => this._updateTracking({ smoothingAlpha: parseFloat((e.target as HTMLInputElement).value) })}"/>
          </div>
          <div class="settings-row">
            <label for="tracking-maximum-jump">${panelText(this.hass, 'Maximum jump')}</label>
            <input id="tracking-maximum-jump" type="number" min="100" max="5000" step="100" .value="${String(this._tracking.maxJumpMm)}"
                   @change="${(e: Event) => this._updateTracking({
                     maxJumpMm: Math.round(this._commitNumberInput(e, this._tracking.maxJumpMm, 100, 5000)),
                   })}"/>
          </div>
          <div class="settings-row">
            <label for="tracking-hold-ms">${panelText(this.hass, 'Track hold (ms)')}</label>
            <input id="tracking-hold-ms" type="number" min="0" max="10000" step="100" .value="${String(this._tracking.trackHoldMs)}"
                   @change="${(e: Event) => this._updateTracking({
                     trackHoldMs: Math.round(this._commitNumberInput(e, this._tracking.trackHoldMs, 0, 10000)),
                   })}"/>
          </div>
          <div class="settings-row">
            <label for="tracking-cross-zone">${panelText(this.hass, 'Keep identity across zones')}</label>
            <input id="tracking-cross-zone" type="checkbox" .checked="${this._tracking.crossZoneTracking}"
                   @change="${(e: Event) => this._updateTracking({ crossZoneTracking: (e.target as HTMLInputElement).checked })}"/>
          </div>
        </div>

        <!-- Detection Zones Section -->
        <div>
          <div class="section-title" style="color: #22c55e;">📍 ${panelText(this.hass, 'Detection zones ({count}/{maximum})', { count: this._getZoneCountByType('detection'), maximum: ZONE_LIMITS.detection })}</div>
          ${this._zones.filter(z => z.type === 'detection').length === 0 ? html`
            <p class="info-text">${panelText(this.hass, 'No detection zones yet. Draw a zone and choose "Detection".')}</p>
          ` : html`
            <div class="zone-list">
              ${this._zones.map((zone, i) => zone.type !== 'detection' ? '' : html`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex === i ? 'selected' : ''}"
                       @click="${() => { this._selectZone(i); this._editingZoneIndex = null; this._toolMode = 'zone'; }}">
                    <div class="zone-color" style="background: ${ZONE_COLORS[zone.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${zone.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" aria-label=${panelText(this.hass, 'Edit {name}', { name: zone.name })} @click="${(e: Event) => { e.stopPropagation(); this._editingZoneIndex = this._editingZoneIndex === i ? null : i; this._selectZone(i); }}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" aria-label=${panelText(this.hass, 'Delete {name}', { name: zone.name })} @click="${(e: Event) => { e.stopPropagation(); this._deleteZone(i); }}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(zone, i)}
                </div>
              `)}
            </div>
          `}
        </div>

        <!-- Exclusion Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #f87171;">🚷 ${panelText(this.hass, 'Exclusion zones ({count}/{maximum})', { count: this._getZoneCountByType('exclusion'), maximum: ZONE_LIMITS.exclusion })}</div>
          ${this._zones.filter(z => z.type === 'exclusion').length === 0 ? html`
            <p class="info-text">${panelText(this.hass, 'No exclusion zones yet. Draw a zone and choose "Exclusion".')}</p>
          ` : html`
            <div class="zone-list">
              ${this._zones.map((zone, i) => zone.type !== 'exclusion' ? '' : html`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex === i ? 'selected' : ''}"
                       @click="${() => { this._selectZone(i); this._editingZoneIndex = null; this._toolMode = 'zone'; }}">
                    <div class="zone-color" style="background: ${ZONE_COLORS[zone.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${zone.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" aria-label=${panelText(this.hass, 'Edit {name}', { name: zone.name })} @click="${(e: Event) => { e.stopPropagation(); this._editingZoneIndex = this._editingZoneIndex === i ? null : i; this._selectZone(i); }}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" aria-label=${panelText(this.hass, 'Delete {name}', { name: zone.name })} @click="${(e: Event) => { e.stopPropagation(); this._deleteZone(i); }}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(zone, i)}
                </div>
              `)}
            </div>
          `}
        </div>

        <!-- Interference Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #f59e0b;">⚡ ${panelText(this.hass, 'Interference zones ({count}/{maximum})', { count: this._getZoneCountByType('interference'), maximum: ZONE_LIMITS.interference })}</div>
          ${this._zones.filter(z => z.type === 'interference').length === 0 ? html`
            <p class="info-text">${panelText(this.hass, 'No interference zones yet. Use these for fans, curtains and other moving objects that may create false targets.')}</p>
          ` : html`
            <div class="zone-list">
              ${this._zones.map((zone, i) => zone.type !== 'interference' ? '' : html`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex === i ? 'selected' : ''}"
                       @click="${() => { this._selectZone(i); this._editingZoneIndex = null; this._toolMode = 'zone'; }}">
                    <div class="zone-color" style="background: ${ZONE_COLORS[zone.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${zone.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" aria-label=${panelText(this.hass, 'Edit {name}', { name: zone.name })} @click="${(e: Event) => { e.stopPropagation(); this._editingZoneIndex = this._editingZoneIndex === i ? null : i; this._selectZone(i); }}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" aria-label=${panelText(this.hass, 'Delete {name}', { name: zone.name })} @click="${(e: Event) => { e.stopPropagation(); this._deleteZone(i); }}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(zone, i)}
                </div>
              `)}
            </div>
          `}
        </div>

        <!-- Entry Zones Section -->
        <div style="margin-top: 16px;">
          <div class="section-title" style="color: #10b981;">🚪 ${panelText(this.hass, 'Entry lines ({count}/{maximum})', { count: this._getZoneCountByType('entry'), maximum: ZONE_LIMITS.entry })}</div>
          ${this._zones.filter(z => z.type === 'entry').length === 0 ? html`
            <p class="info-text">${panelText(this.hass, 'No entry lines yet. Draw 2 points and choose "Entry Line" for in/out detection at doorways.')}</p>
          ` : html`
            <div class="zone-list">
              ${this._zones.map((zone, i) => zone.type !== 'entry' ? '' : html`
                <div>
                  <div class="zone-item ${this._selectedZoneIndex === i ? 'selected' : ''}"
                       @click="${() => { this._selectZone(i); this._editingZoneIndex = null; this._toolMode = 'zone'; }}">
                    <div class="zone-color" style="background: ${ZONE_COLORS[zone.type].stroke};"></div>
                    <div class="zone-info">
                      <div class="zone-name">${zone.name}</div>
                    </div>
                    <div class="zone-actions">
                      <button class="edit-btn" aria-label=${panelText(this.hass, 'Edit {name}', { name: zone.name })} @click="${(e: Event) => { e.stopPropagation(); this._editingZoneIndex = this._editingZoneIndex === i ? null : i; this._selectZone(i); }}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                      </button>
                      <button class="delete-btn" aria-label=${panelText(this.hass, 'Delete {name}', { name: zone.name })} @click="${(e: Event) => { e.stopPropagation(); this._deleteZone(i); }}">
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </button>
                    </div>
                  </div>
                  ${this._renderZoneEditForm(zone, i)}
                </div>
              `)}
            </div>
          `}
        </div>

        ${this._sensors.some(sn => sn.deviceId) ? html`
          <div class="live-status ${roomOccupied ? 'occupied' : ''}">
            <div class="header">
              <span class="dot ${roomOccupied ? 'active' : 'inactive'}"></span>
              <span style="font-weight: 600; color: var(--rd-text);">Live Tracking</span>
            </div>
            <div class="count" style="color: ${roomOccupied ? '#22c55e' : 'var(--rd-dim)'};">
              ${jointCountKnown
                ? panelText(this.hass, roomTrackCount === 1 ? '1 room track' : '{count} room tracks', { count: roomTrackCount })
                : panelText(this.hass, 'Count unknown · {count} source tracks', { count: activeTargets })}
            </div>
            ${!jointCountKnown ? html`
              <div class="occupancy-note">
                <ha-icon icon="mdi:vector-link"></ha-icon>
                <span>${panelText(this.hass, roomFusionReady && this._sensors.filter(sensor => sensor.deviceId).length > 1
                  ? 'Multiple radar views are fused for position, while the exact person count remains conservative.'
                  : 'Complete the neighbouring overlap alignment to merge tracks without hiding possible people.')}</span>
              </div>
            ` : nothing}
            ${hasUnpositionedPresence ? html`
              <div class="occupancy-note">
                <ha-icon icon="mdi:account-eye-outline"></ha-icon>
                <span>${panelText(this.hass, 'Additional presence is active without an X/Y position. No target is invented.')}</span>
              </div>
            ` : nothing}
            ${this._sensors.map((sn, si) => {
              if (!sn.deviceId) return nothing;
              const sensorTargets = this._liveTargets[sn.id] || [];
              const activeCount = sensorTargets.filter(t => t.active).length;
              const supplementaryActive = sensorsWithSupplementaryPresence.has(sn.id);
              return html`
                <div class="live-sensor-row">
                  <span class="sensor-dot small" style="background: ${this._sensorColor(si)};">${si + 1}</span>
                  <span class="live-sensor-name">${this._sensorLabel(sn, si)}</span>
                  <span class="live-sensor-count">${supplementaryActive
                    ? panelText(this.hass, '{count} positioned · presence', { count: activeCount })
                    : panelText(this.hass, '{count} positioned', { count: activeCount })}</span>
                </div>
              `;
            })}
          </div>
        ` : ''}
        `}
      </div>

      <!-- Zone Type Picker Dialog -->
      ${this._showZoneTypePicker ? html`
        <div class="zone-type-picker" @click="${(e: Event) => { if (e.target === e.currentTarget) this._cancelZoneTypePicker(); }}">
          <div class="zone-type-picker-content">
            ${this._pendingZonePoints.length === 2 ? html`
              <!-- 2 punten: Entry Lijn of doorgaan tekenen -->
              <h3>🚪 Create an entry line?</h3>
              <p>You drew 2 points. Do you want to create an entry line for in/out detection?</p>
              <div class="zone-type-options">
                <div class="zone-type-option entry ${!this._canAddZone('entry') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('entry') && this._selectZoneType('entry')}">
                  <span class="icon">🚪</span>
                  <div class="info">
                    <div class="name">Entry Line</div>
                    <div class="desc">Detects whether someone walks IN or OUT</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('entry')}/${ZONE_LIMITS.entry}</span>
                </div>
                <div class="zone-type-option continue" @click="${this._continueDrawingPolygon}">
                  <span class="icon">✏️</span>
                  <div class="info">
                    <div class="name">Continue drawing</div>
                    <div class="desc">Add more points for a polygon zone</div>
                  </div>
                  <span class="badge" style="background: rgba(100, 116, 139, 0.18); color: var(--rd-dim2);">→</span>
                </div>
              </div>
            ` : html`
              <!-- 3+ punten: Polygon zone types -->
              <h3>Choose zone type</h3>
              <p>Your polygon zone is drawn! Choose what type this zone should be.</p>
              <div class="zone-type-options">
                <div class="zone-type-option detection ${!this._canAddZone('detection') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('detection') && this._selectZoneType('detection')}">
                  <span class="icon">📍</span>
                  <div class="info">
                    <div class="name">Detection Zone</div>
                    <div class="desc">Detects motion/presence</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('detection')}/${ZONE_LIMITS.detection}</span>
                </div>
                <div class="zone-type-option exclusion ${!this._canAddZone('exclusion') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('exclusion') && this._selectZoneType('exclusion')}">
                  <span class="icon">🚷</span>
                  <div class="info">
                    <div class="name">Exclusion Zone</div>
                    <div class="desc">Ignores motion in this area</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('exclusion')}/${ZONE_LIMITS.exclusion}</span>
                </div>
                <div class="zone-type-option interference ${!this._canAddZone('interference') ? 'disabled' : ''}"
                     @click="${() => this._canAddZone('interference') && this._selectZoneType('interference')}">
                  <span class="icon">⚡</span>
                  <div class="info">
                    <div class="name">Interference Zone</div>
                    <div class="desc">Filters fans, curtains and other moving objects</div>
                  </div>
                  <span class="badge">${this._getZoneCountByType('interference')}/${ZONE_LIMITS.interference}</span>
                </div>
              </div>
            `}
            <button class="zone-type-picker-cancel" @click="${this._cancelZoneTypePicker}">Cancel</button>
          </div>
        </div>
      ` : ''}

      ${this._showNewRoomDialog ? html`
        <div class="dialog-overlay" @click="${() => this._showNewRoomDialog = false}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>New Room</h3>
            <label>Room name *</label>
            <input type="text" placeholder="e.g. Living room" .value="${this._newRoomName}"
              @input="${(e: Event) => this._newRoomName = (e.target as HTMLInputElement).value}"
              @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this._createNewRoom()}" autofocus/>
            <p class="help-text" style="margin-top: 8px;">Optional: dimensions for a rectangular room (leave empty to draw manually)</p>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" placeholder="e.g. 400" .value="${this._newRoomWidth || ''}"
                  @change="${(e: Event) => this._newRoomWidth = this._commitNumberInput(e, 0, 1, 10000, true)}"/>
              </div>
              <div>
                <label>Length (cm)</label>
                <input type="number" placeholder="e.g. 500" .value="${this._newRoomLength || ''}"
                  @change="${(e: Event) => this._newRoomLength = this._commitNumberInput(e, 0, 1, 10000, true)}"/>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${() => this._showNewRoomDialog = false}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._createNewRoom}">${this._newRoomWidth > 0 && this._newRoomLength > 0 ? 'Create with dimensions' : 'Create (draw manually)'}</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showImportRoomDialog && this._pendingImportedRoom && importSummary ? html`
        <div class="dialog-overlay" @click=${this._closeImportRoomDialog}>
          <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="import-room-title"
            @click=${(event: Event) => event.stopPropagation()}>
            <h3 id="import-room-title">${panelText(this.hass, this._importRoomSource === 'apple_roomplan' ? 'Import LiDAR scan' : 'Import room')}</h3>
            <p class="import-description">
              ${panelText(
                this.hass,
                this._importRoomSource === 'apple_roomplan'
                  ? 'Apple RoomPlan scan detected. Review the converted room before adding it; the original scan and existing rooms are not changed.'
                  : 'Review the backup before adding it. This creates a new room; existing rooms are not changed.',
              )}
            </p>
            <div class="import-source">
              <ha-icon icon=${this._importRoomSource === 'apple_roomplan' ? 'mdi:vector-polygon' : 'mdi:archive-arrow-up-outline'}></ha-icon>
              <div>
                <strong>${panelText(this.hass, this._importRoomSource === 'apple_roomplan' ? 'Apple RoomPlan (LiDAR scan)' : 'SmartHomeShop room backup')}</strong>
                <span>${panelText(
                  this.hass,
                  this._importRoomSource === 'apple_roomplan'
                    ? this._pendingImportedRoomOptions.length === 1
                      ? 'One room detected with measurements in metres.'
                      : '{count} rooms detected with measurements in metres.'
                    : 'Complete room layout and settings.',
                  { count: this._pendingImportedRoomOptions.length },
                )}</span>
              </div>
            </div>
            ${this._pendingImportedRoomOptions.length > 1 ? html`
              <label for="import-room-choice">${panelText(this.hass, 'Room from scan')}</label>
              <select id="import-room-choice" .value=${String(this._selectedImportedRoomIndex)}
                ?disabled=${this._roomTransferBusy}
                @change=${(event: Event) => this._selectImportedRoomOption(Number((event.target as HTMLSelectElement).value))}>
                ${this._pendingImportedRoomOptions.map((room, index) => html`
                  <option value=${String(index)}>${room.name}</option>
                `)}
              </select>
            ` : nothing}
            <label for="import-room-name">${panelText(this.hass, 'Room name')}</label>
            <input id="import-room-name" type="text" maxlength="120" .value=${this._importRoomName}
              @input=${(event: Event) => this._importRoomName = (event.target as HTMLInputElement).value}
              @keydown=${(event: KeyboardEvent) => event.key === 'Enter' && this._importRoom()}
              ?disabled=${this._roomTransferBusy} autofocus />
            <div class="import-summary" aria-label=${panelText(this.hass, 'Imported room contents')}>
              ${([
                ['Walls', importSummary.walls],
                ['Furniture', importSummary.furniture],
                ['Doors', importSummary.doors],
                ['Windows', importSummary.windows],
                ['Mirrors', importSummary.mirrors],
                ['Sensors', importSummary.sensors],
                ['Zones', importSummary.zones],
              ] as Array<[string, number]>).map(([label, count]) => html`
                <div class="import-summary-item"><strong>${count}</strong><span>${panelText(this.hass, label)}</span></div>
              `)}
            </div>
            ${this._importRoomSource === 'apple_roomplan' ? html`
              <div class="import-note">
                <ha-icon icon="mdi:ruler-square"></ha-icon>
                <span>${panelText(this.hass, 'RoomPlan measurements are converted from metres to millimetres. Check the walls, doors, windows and furniture after import because LiDAR scans can contain small gaps.')}</span>
              </div>
            ` : html`
              <div class="import-note">
                <ha-icon icon="mdi:information-outline"></ha-icon>
                <span>${panelText(this.hass, 'Imported sensors are left unlinked so one physical radar can never control two rooms. Link each sensor to the correct Home Assistant device after import.')}</span>
              </div>
            `}
            ${this._importRoomWarnings.map(warning => html`
              <div class="import-warning" role="status">
                <ha-icon icon="mdi:alert-outline"></ha-icon>
                <span>${panelText(
                  this.hass,
                  warning === 'approximate_boundary'
                    ? 'One or more scan edges did not meet exactly. The closest wall endpoints were joined; review the room shape.'
                    : warning === 'skipped_opening'
                      ? 'A scanned door or window was too far from a wall and was skipped.'
                      : 'Some scanned objects do not match the furniture library and were skipped.',
                )}</span>
              </div>
            `)}
            ${this._dirty ? html`
              <div class="import-note">
                <ha-icon icon="mdi:content-save-alert-outline"></ha-icon>
                <span>${panelText(this.hass, 'Your current room has unsaved changes. You will be asked before those changes are discarded.')}</span>
              </div>
            ` : nothing}
            ${this._roomActionError ? html`<div class="dialog-error" role="alert">${this._roomActionError}</div>` : nothing}
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" ?disabled=${this._roomTransferBusy}
                @click=${this._closeImportRoomDialog}>${panelText(this.hass, 'Cancel')}</button>
              <button class="dialog-btn primary" ?disabled=${this._roomTransferBusy || !this._importRoomName.trim()}
                @click=${this._importRoom}>
                ${panelText(this.hass, this._roomTransferBusy ? 'Importing...' : 'Import as new room')}
              </button>
            </div>
          </div>
        </div>
      ` : nothing}

      ${this._showRenameRoomDialog ? html`
        <div class="dialog-overlay" @click=${() => !this._roomActionBusy && (this._showRenameRoomDialog = false)}>
          <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="rename-room-title"
            @click=${(event: Event) => event.stopPropagation()}>
            <h3 id="rename-room-title">Rename room</h3>
            <label>Room name</label>
            <input type="text" maxlength="120" .value=${this._renameRoomName}
              @input=${(event: Event) => this._renameRoomName = (event.target as HTMLInputElement).value}
              @keydown=${(event: KeyboardEvent) => event.key === 'Enter' && this._renameRoom()}
              autofocus />
            <p class="help-text">Only the name changes. Your layout, sensors and zones stay in place.</p>
            ${this._roomActionError ? html`<div class="dialog-error" role="alert">${this._roomActionError}</div>` : nothing}
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" ?disabled=${this._roomActionBusy}
                @click=${() => this._showRenameRoomDialog = false}>Cancel</button>
              <button class="dialog-btn primary" ?disabled=${this._roomActionBusy || !this._renameRoomName.trim()}
                @click=${this._renameRoom}>${this._roomActionBusy ? 'Saving...' : 'Save name'}</button>
            </div>
          </div>
        </div>
      ` : nothing}

      ${this._showDeleteRoomDialog ? (() => {
        const room = this.rooms.find(item => item.id === this._deleteRoomId);
        return html`
          <div class="dialog-overlay" @click=${() => !this._roomActionBusy && (this._showDeleteRoomDialog = false)}>
            <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-room-title"
              @click=${(event: Event) => event.stopPropagation()}>
              <h3 id="delete-room-title">Delete ${room?.name || 'room'}?</h3>
              <div class="dialog-warning">
                <ha-icon icon="mdi:alert-outline"></ha-icon>
                <div>The room layout, furniture, sensor positions and zones will be permanently removed. Your Home Assistant devices and entities are not deleted.</div>
              </div>
              ${this._roomActionError ? html`<div class="dialog-error" role="alert">${this._roomActionError}</div>` : nothing}
              <div class="dialog-buttons">
                <button class="dialog-btn cancel" ?disabled=${this._roomActionBusy}
                  @click=${() => this._showDeleteRoomDialog = false}>Cancel</button>
                <button class="dialog-btn danger" ?disabled=${this._roomActionBusy}
                  @click=${this._deleteRoom}>${this._roomActionBusy ? 'Deleting...' : 'Delete room'}</button>
              </div>
            </div>
          </div>
        `;
      })() : nothing}

      ${this._showFurnitureDialog && this._selectedFurnitureType ? html`
        <div class="dialog-overlay" @click="${() => this._showFurnitureDialog = false}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>${panelText(this.hass, 'Place {name}', { name: panelText(this.hass, this._selectedFurnitureType.name) })}</h3>
            <p class="help-text">Enter the dimensions (top view)</p>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" min="10" max="500" .value="${String(this._furnitureWidth / 10)}"
                  @change="${(e: Event) => this._furnitureWidth = Math.round(
                    this._commitNumberInput(e, this._furnitureWidth / 10, 10, 500) * 10,
                  )}"/>
              </div>
              <div>
                <label>Depth (cm)</label>
                <input type="number" min="10" max="500" .value="${String(this._furnitureHeight / 10)}"
                  @change="${(e: Event) => this._furnitureHeight = Math.round(
                    this._commitNumberInput(e, this._furnitureHeight / 10, 10, 500) * 10,
                  )}"/>
              </div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${() => this._showFurnitureDialog = false}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._placeFurniture}">Place</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showDoorDialog ? html`
        <div class="dialog-overlay" @click="${this._hideDoorDialog}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>${this._editingDoorIndex !== null ? 'Edit Door' : 'Add Door'}</h3>
            <label>Width (cm)</label>
            <input type="number" .value="${String(this._doorWidth / 10)}"
              @change="${(e: Event) => this._doorWidth = Math.round(
                this._commitNumberInput(e, this._doorWidth / 10, 10, 500) * 10,
              )}"/>
            <label>Opening direction</label>
            <select .value="${this._doorOpenDirection}" @change="${(e: Event) => this._doorOpenDirection = (e.target as HTMLSelectElement).value as 'inward' | 'outward'}">
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
            </select>
            <label>Hinge side</label>
            <select .value="${this._doorOpenSide}" @change="${(e: Event) => this._doorOpenSide = (e.target as HTMLSelectElement).value as 'left' | 'right'}">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideDoorDialog}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._editingDoorIndex !== null ? this._saveDoorEdit : this._addDoor}">${this._editingDoorIndex !== null ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showWindowDialog ? html`
        <div class="dialog-overlay" @click="${this._hideWindowDialog}">
          <div class="dialog" @click="${(e: Event) => e.stopPropagation()}">
            <h3>${this._editingWindowIndex !== null ? 'Edit Window' : 'Add Window'}</h3>
            <div class="input-row">
              <div>
                <label>Width (cm)</label>
                <input type="number" .value="${String(this._windowWidth / 10)}"
                  @change="${(e: Event) => this._windowWidth = Math.round(
                    this._commitNumberInput(e, this._windowWidth / 10, 10, 500) * 10,
                  )}"/>
              </div>
              <div>
                <label>Height (cm)</label>
                <input type="number" .value="${String(this._windowHeight / 10)}"
                  @change="${(e: Event) => this._windowHeight = Math.round(
                    this._commitNumberInput(e, this._windowHeight / 10, 10, 500) * 10,
                  )}"/>
              </div>
            </div>
            <label>Window type</label>
            <select .value="${this._windowType}" @change="${(e: Event) => this._windowType = (e.target as HTMLSelectElement).value as 'fixed' | 'open' | 'tilt'}">
              <option value="fixed">Fixed window</option>
              <option value="open">Casement window</option>
              <option value="tilt">Tilt window</option>
            </select>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideWindowDialog}">Cancel</button>
              <button class="dialog-btn primary" @click="${this._editingWindowIndex !== null ? this._saveWindowEdit : this._addWindow}">${this._editingWindowIndex !== null ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._showMirrorDialog ? html`
        <div class="dialog-overlay" @click="${this._hideMirrorDialog}">
          <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="mirror-dialog-title"
               @click="${(event: Event) => event.stopPropagation()}">
            <h3 id="mirror-dialog-title">${panelText(this.hass, this._editingMirrorIndex !== null ? 'Edit Mirror' : 'Add Mirror')}</h3>
            <p class="help-text">${panelText(this.hass, 'Place the mirror on the wall where it is physically installed.')}</p>
            <div class="input-row">
              <div>
                <label for="mirror-width">${panelText(this.hass, 'Width (cm)')}</label>
                <input id="mirror-width" type="number" min="10" max="500" .value="${String(this._mirrorWidth / 10)}"
                  @change="${(event: Event) => this._mirrorWidth = Math.round(
                    this._commitNumberInput(event, this._mirrorWidth / 10, 10, 500) * 10,
                  )}"/>
              </div>
              <div>
                <label for="mirror-height">${panelText(this.hass, 'Height (cm)')}</label>
                <input id="mirror-height" type="number" min="10" max="300" .value="${String(this._mirrorHeight / 10)}"
                  @change="${(event: Event) => this._mirrorHeight = Math.round(
                    this._commitNumberInput(event, this._mirrorHeight / 10, 10, 300) * 10,
                  )}"/>
              </div>
            </div>
            <div class="settings-row" style="margin-top: 14px;">
              <input id="mirror-protection" type="checkbox" .checked="${this._mirrorProtectionEnabled}"
                @change="${(event: Event) => this._mirrorProtectionEnabled = (event.target as HTMLInputElement).checked}"/>
              <label for="mirror-protection" style="margin: 0;">
                <strong>${panelText(this.hass, 'Reflection protection')}</strong><br>
                <span class="help-text">${panelText(this.hass, 'Filter ghost targets predicted behind this mirror and send the area to each linked radar as an exclusion polygon.')}</span>
              </label>
            </div>
            <label for="mirror-depth">${panelText(this.hass, 'Protection depth (cm)')}</label>
            <input id="mirror-depth" type="number" min="25" max="600" step="25"
              ?disabled="${!this._mirrorProtectionEnabled}"
              .value="${String(this._mirrorReflectionDepthMm / 10)}"
              @change="${(event: Event) => this._mirrorReflectionDepthMm = Math.round(
                this._commitNumberInput(event, this._mirrorReflectionDepthMm / 10, 25, 600) * 10,
              )}"/>
            <p class="help-text">${panelText(this.hass, 'The dashed preview follows the radar rays beyond the mirror. Increase the depth only when ghost targets appear farther behind it.')}</p>
            <div class="dialog-warning" style="border-color: var(--rd-line);">
              <ha-icon icon="mdi:information-outline" style="color: #0ea5e9;"></ha-icon>
              <div>${panelText(this.hass, 'Each protected mirror uses one of the radar\'s two exclusion slots. Raw diagnostic target entities remain unchanged; the Floorplan Designer, the UltimateSensor room view and firmware people counting ignore the protected area.')}</div>
            </div>
            <div class="dialog-buttons">
              <button class="dialog-btn cancel" @click="${this._hideMirrorDialog}">${panelText(this.hass, 'Cancel')}</button>
              <button class="dialog-btn primary" @click="${this._editingMirrorIndex !== null ? this._saveMirrorEdit : this._addMirror}">
                ${panelText(this.hass, this._editingMirrorIndex !== null ? 'Save' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      ${this._coverageWizard()}
    `;
  }

  private _coverageWizard() {
    return this._showCoverageCalibration && this._selectedSensor ? html`
        <shs-sensor-coverage-calibration
          .hass="${this.hass}"
          .embedded=${this.hardwareOnly}
          .targets="${this._liveTargets[this._selectedSensor.id] || []}"
          .initialCorners="${!this._coverageCalibrationStartsFresh && this._calibration.sensorId === this._selectedSensor.id
            ? this._calibration.corners.map(point => this._worldToSensorLocal(this._selectedSensor!, point))
            : []}"
          .range="${this._selectedSensor.range}"
          .fov="${this._selectedSensor.fov}"
          .mountingMode="${this._selectedSensor.mountingMode}"
          .radarModel="${this._findRadarDevice(this._selectedSensor.deviceId)?.profile.radarModel || 'positioning radar'}"
          .sensorName="${this._sensorLabel(this._selectedSensor, this._selectedSensorIndex!)}"
          .requiresOrientationCheck="${this._findRadarDevice(this._selectedSensor.deviceId)?.profile.radarModel === 'ld2460'}"
          .isRemeasurement="${this._coverageCalibrationStartsFresh}"
          @calibration-cancel="${this._closeCoverageWizard}"
          @calibration-save="${this._saveCoverageCalibration}"
        ></shs-sensor-coverage-calibration>
      ` : nothing;
  }
}

if (!customElements.get('shs-zones-page')) {
  customElements.define('shs-zones-page', ZonesPage);
}
