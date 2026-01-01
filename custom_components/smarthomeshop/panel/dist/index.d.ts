import { LitElement, PropertyValues } from 'lit';
import type { HomeAssistant, PanelConfig } from './types';
import './pages/dashboard-page';
import './pages/room-builder-page';
import './pages/zones-page';
import './pages/settings-page';
export declare class SmartHomeShopPanel extends LitElement {
    hass: HomeAssistant;
    narrow: boolean;
    panel?: {
        config: PanelConfig;
    };
    private _currentPage;
    private _selectedDeviceId?;
    private _selectedRoomId?;
    static styles: import("lit").CSSResult;
    protected firstUpdated(_changedProperties: PropertyValues): void;
    private _navigateTo;
    private _handleDeviceSelect;
    private _handleRoomSelect;
    protected render(): import("lit-html").TemplateResult<1>;
    private _renderPage;
}
declare global {
    interface HTMLElementTagNameMap {
        'smarthomeshop-panel': SmartHomeShopPanel;
    }
}
