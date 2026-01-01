import { LitElement } from 'lit';
import type { HomeAssistant } from '../types';
export declare class SettingsPage extends LitElement {
    hass: HomeAssistant;
    selectedDeviceId?: string;
    private _devices;
    private _selectedDevice?;
    private _entities;
    private _loading;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    private _loadDevices;
    private _selectDevice;
    protected render(): import("lit-html").TemplateResult<1>;
}
