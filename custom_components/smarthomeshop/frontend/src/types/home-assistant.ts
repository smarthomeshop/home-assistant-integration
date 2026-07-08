/**
 * Home Assistant TypeScript types
 */

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    unit_of_measurement?: string;
    device_class?: string;
    icon?: string;
    [key: string]: unknown;
  };
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

export interface HassDevice {
  id: string;
  name: string;
  name_by_user?: string;
  model?: string;
  manufacturer?: string;
  area_id?: string;
  identifiers: Array<[string, string]>;
  connections: Array<[string, string]>;
}

export interface HassEntityRegistryEntry {
  entity_id: string;
  device_id?: string;
  platform: string;
  config_entry_id?: string;
  disabled_by?: string;
  hidden_by?: string;
}

export interface HomeAssistant {
  states: { [entity_id: string]: HassEntity };
  devices?: { [device_id: string]: HassDevice };
  entities?: { [entity_id: string]: HassEntityRegistryEntry };
  user?: {
    name: string;
    is_admin: boolean;
  };
  language: string;
  themes: {
    default_theme: string;
    themes: { [name: string]: { [key: string]: string } };
  };
  callWS: <T>(msg: { type: string; [key: string]: unknown }) => Promise<T>;
  callService: (
    domain: string,
    service: string,
    serviceData?: { [key: string]: unknown }
  ) => Promise<void>;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: unknown): void;
  getCardSize?(): number | Promise<number>;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  lovelace?: unknown;
  setConfig(config: unknown): void;
}

