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
  states: Record<string, HassState>;
  devices: Record<string, HassDevice>;
  entities: Record<string, HassEntity>;
  user: {
    id: string;
    name: string;
    is_admin: boolean;
  };
  themes: {
    darkMode: boolean;
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
  id: string;
  name: string;
  points: Point[];
  color: string;
  type: 'detection' | 'exclusion';
}

export interface RoomConfig {
  id: string;
  name: string;
  roomShell?: RoomShell;
  devicePlacement?: DevicePlacement;
  furniture: FurnitureInstance[];
  zones: Zone[];
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

export type PageType = 'dashboard' | 'room-builder' | 'zones' | 'settings';

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
