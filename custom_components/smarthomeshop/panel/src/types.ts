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
}

export interface DeviceEntity {
  entity_id: string;
  name: string;
  platform: string;
  domain: string;
  state?: string;
  attributes: Record<string, unknown>;
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

export interface Room {
  id: string;
  name: string;
  walls: Wall[];
  furniture: FurnitureInstance[];
  devices: DevicePlacement[];
  zones: Zone[];
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
