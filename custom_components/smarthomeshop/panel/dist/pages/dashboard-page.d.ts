import { LitElement } from 'lit';
import type { HomeAssistant } from '../types';
export declare class DashboardPage extends LitElement {
    hass: HomeAssistant;
    selectedDeviceId?: string;
    private _devices;
    private _loading;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    private _loadDevices;
    private _selectDevice;
    private _navigateTo;
    private _getProductConfig;
    private _getSensorValue;
    private _formatValue;
    private _renderDeviceSensors;
    private _countByCategory;
    protected render(): import("lit-html").TemplateResult<1>;
}
