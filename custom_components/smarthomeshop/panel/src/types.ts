/**
 * Type definitions for SmartHomeShop Panel
 */

export interface HomeAssistant {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>
  ): Promise<void>;
  callApi<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    parameters?: Record<string, unknown>
  ): Promise<T>;
  states: Record<string, HassState>;
  devices: Record<string, HassDevice>;
  entities: Record<string, HassEntity>;
  services: Record<string, Record<string, unknown>>;
  user: {
    id: string;
    name: string;
    is_admin: boolean;
  };
  themes: {
    darkMode: boolean;
  };
  config?: {
    time_zone?: string;
  };
  language: string;
}

export interface HassState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HassDevice {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
}

export interface HassEntity {
  entity_id: string;
  name?: string;
  platform: string;
  device_id?: string;
}

export interface PanelConfig {
  version: string;
}

export interface Point {
  x: number;
  y: number;
}

export type ZoneType = 'detection' | 'exclusion' | 'entry' | 'interference';
export type ZoneProfilePreset = 'default' | 'bed' | 'seating' | 'transit' | 'custom';

export interface ZoneProfile {
  preset: ZoneProfilePreset;
  enterDelayMs: number;
  leaveDelayMs: number;
  minDwellMs: number;
  minTargets: number;
}

export interface RoomZone {
  id: string | number;
  name: string;
  points: Point[];
  /** Additional disconnected polygon parts. `points` remains the first part for backwards compatibility. */
  parts?: Point[][];
  color?: string;
  type: ZoneType;
  inDirection?: 'left' | 'right';
  sensorId?: string;
  profile?: ZoneProfile;
}

export interface RoomCalibration {
  enabled: boolean;
  corners: Point[];
  gridSizeMm: 100 | 300;
  snapToGrid: boolean;
}

export interface RadarTrackingSettings {
  smoothingEnabled: boolean;
  smoothingAlpha: number;
  maxJumpMm: number;
  trackHoldMs: number;
  crossZoneTracking: boolean;
}

export interface RoomShell {
  points: Point[];
}

export interface DevicePlacement {
  x: number;
  y: number;
  rotationDeg: number;
  deviceId?: string;
}

export interface FurnitureInstance {
  id: string;
  typeId: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotationDeg: number;
}

export interface Zone {
  id: string | number;
  name: string;
  points: Point[];
  parts?: Point[][];
  color?: string;
  type: ZoneType;
  inDirection?: 'left' | 'right';
  sensorId?: string;
  profile?: ZoneProfile;
}

export interface RoomConfig {
  id: string;
  name: string;
  roomShell?: RoomShell;
  devicePlacement?: DevicePlacement;
  furniture: FurnitureInstance[];
  zones: Zone[];
  calibration?: RoomCalibration;
  tracking?: RadarTrackingSettings;
  widthMm: number;
  heightMm: number;
  floorMaterial?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SmartHomeShopDevice {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  product_type?: string;
  product_name?: string;
  entity_count: number;
  online?: boolean;
  last_seen?: string | null;
  integration_linked?: boolean;
  esphome_configured?: boolean;
  hidden?: boolean;
}

export interface DeviceEntity {
  entity_id: string;
  name: string;
  platform: string;
  domain: string;
  device_id?: string | null;
  unique_id?: string | null;
  original_name?: string | null;
  disabled_by?: string | null;
  entity_category?: string | null;
  state?: string;
  attributes: Record<string, unknown>;
}

export interface Sps30QuietHoursCapability {
  status: 'complete' | 'partial' | 'unsupported';
  entities: Partial<Record<'enabled' | 'start_hour' | 'end_hour' | 'active' | 'pm_sensor' | 'idle_interval', string>>;
  missing: Array<'enabled' | 'start_hour' | 'end_hour' | 'active'>;
}

export interface RadarTargetEntityMap {
  index: number;
  x_entity_id: string;
  y_entity_id: string;
  z_entity_id?: string | null;
  presence_entity_id?: string | null;
}

export interface RadarProfilePayload {
  mounting_mode: 'wall' | 'ceiling';
  coordinate_projection: 'forward_xy' | 'floor_xy';
  required_installation_mode?: 'top' | 'side' | null;
  mounting_height_mm?: number | null;
  maximum_range_mm?: number | null;
  field_of_view_deg?: number | null;
  radar_model: string;
  coordinate_frame?: string | null;
  coordinate_scale_to_mm: number;
  maximum_targets: number;
  hardware_mode_capability?: 'fixed' | 'top_or_side' | null;
  metadata_source: 'firmware' | 'legacy_fallback';
  detected_product?: string | null;
  supplementary_presence_sensors: string[];
  current_hardware_mode?: 'top' | 'side' | null;
  reported_installation_mode_entity_id?: string | null;
  installation_mode_entity_id?: string | null;
  installation_mode_options: string[];
  installation_height_entity_id?: string | null;
  installation_height_m?: number | null;
  installation_angle_entity_id?: string | null;
  installation_angle_deg?: number | null;
  detection_distance_entity_id?: string | null;
  detection_distance_m?: number | null;
  detection_start_angle_entity_id?: string | null;
  detection_start_angle_deg?: number | null;
  detection_end_angle_entity_id?: string | null;
  detection_end_angle_deg?: number | null;
  tracking_presence_entity_id?: string | null;
  tracking_target_count_entity_id?: string | null;
  missing_metadata_entities: string[];
  invalid_metadata_entities: string[];
  positioning_available: boolean;
}

export interface RadarCapabilitiesPayload {
  coordinate_mode: 'target' | 'tracking-target' | 'unknown';
  polygon_zones: boolean;
  entry_lines: boolean;
  zone_profiles: boolean;
  interference_zones: boolean;
  smoothing: boolean;
  cross_zone_tracking: boolean;
}

export interface RadarDeviceProfilePayload {
  device_id: string;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  entity_prefix: string;
  aliases: string[];
  profile: RadarProfilePayload;
  targets: RadarTargetEntityMap[];
  capabilities: RadarCapabilitiesPayload;
}

export interface FurnitureType {
  id: string;
  label: string;
  category: string;
  icon: string;
  defaultWidth: number;
  defaultDepth: number;
  defaultHeight: number;
}

export type PageType = 'dashboard' | 'room-builder' | 'zones' | 'settings' | 'energy';

// Aliases for backwards compatibility
export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RoomMirror {
  id: string;
  wallIndex: number;
  position: number;
  width: number;
  height: number;
  protectionEnabled: boolean;
  reflectionDepthMm: number;
}

export interface Room {
  id: string;
  name: string;
  walls: Wall[];
  furniture: FurnitureInstance[];
  devices: DevicePlacement[];
  zones: Zone[];
  mirrors?: RoomMirror[];
  doors?: Array<Record<string, unknown>>;
  windows?: Array<Record<string, unknown>>;
  sensors?: Array<Record<string, unknown>>;
  calibration?: RoomCalibration;
  tracking?: RadarTrackingSettings;
}

export interface FurnitureItem {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
}

export interface DeviceItem {
  id: string;
  deviceId?: string;
  x: number;
  y: number;
  rotation: number;
  fovDeg?: number;
  rangeMm?: number;
}

export type PanelView = PageType;
