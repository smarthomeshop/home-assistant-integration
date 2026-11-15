import { LitElement, html, css, nothing, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant, PanelConfig, PageType, Room } from './types';
import type { ZonesPage } from './pages/zones-page';
import { installPanelLocalization, panelText } from './utils/panel-translations';
import './pages/dashboard-page';
import './pages/zones-page';
import './pages/settings-page';
import './pages/energy-hub';

const panelModule = new URL(import.meta.url);
const floorPlannerModule = new URL('./floor-planner/host.js', panelModule);
floorPlannerModule.search = panelModule.search;
void import(floorPlannerModule.href);

// @ts-ignore - VERSION is replaced by rollup at build time
const VERSION = '__VERSION__';

type RadarContext = { roomId?: string; sensorId?: string; readOnly: boolean };
type FloorEditor = HTMLElement & {
  isDirty?: boolean;
  focusRadarButton(): void;
  applyRadarCalibration(detail: { room: Room; previousRevision?: string }): void;
};

// Official SmartHomeShop Logo SVG (house with face)
const SHS_LOGO_SVG = `
<svg viewBox="0 0 772.9 607.6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <g>
    <g>
      <path d="M636.8,285.9c-0.5-10.6-11-15.9-18.8-21.6c-40.6-30.1-81.2-60.1-121.8-90.2c-34.5-25.6-69-51.1-103.5-76.7 c-3.2-2.4-9.4-2.4-12.6,0c-71.6,53.1-143.3,106.1-214.9,159.2c-5.8,4.3-11.6,8.6-17.4,12.9c-3.2,2.4-8.1,5.2-10.1,8.6 c-4.8,8.3-1.7,24.7-1.7,33.6c0,52.9,0,105.8,0,158.7c0,41.6,0,83.1,0,124.7c0,6.7,5.7,12.5,12.5,12.5c30.9,0,61.9,0,92.8,0 c16.1,0,16.1-25,0-25c-26.8,0-53.6,0-80.4,0c0-86.7,0-173.3,0-260c0-10.7,0-21.4,0-32c67.3-49.9,134.6-99.7,202-149.6 c7.8-5.8,15.6-11.6,23.5-17.4c67.3,49.8,134.6,99.7,201.8,149.5c7.9,5.8,15.7,11.6,23.6,17.5c0,88.8,0,177.5,0,266.3 c0,8.6,0,17.2,0,25.8c-26.8,0-53.6,0-80.4,0c-16.1,0-16.1,25,0,25c30.9,0,61.9,0,92.8,0c6.7,0,12.5-5.7,12.5-12.5 c0-89.3,0-178.7,0-268C636.8,313.4,637.4,299.6,636.8,285.9z"/>
      <g>
        <g>
          <path d="M261.7,428.8c0,27.7,13.7,53.7,36,69.9c17.3,12.5,37.1,16,58,16c18.5,0,37,0,55.4,0c19.1,0,37.3-0.9,54.7-10.2 c27.6-14.6,45.4-44.5,45.4-75.7c0-16.1-25-16.1-25,0c0,29.1-21.2,54.6-49.8,60c-16,3-33.9,1-50,1c-16.1,0-34,2-50-1 c-28.6-5.4-49.8-30.9-49.8-60C286.6,412.8,261.7,412.7,261.7,428.8L261.7,428.8z"/>
        </g>
      </g>
      <g>
        <g>
          <circle cx="310.9" cy="351.6" r="21.4"/>
        </g>
        <g>
          <circle cx="462" cy="351.6" r="21.4"/>
        </g>
      </g>
      <path d="M767.5,279.4c-42.2-31.3-84.5-62.6-126.7-93.8C573.5,135.7,506.3,85.9,439,36c-15.4-11.4-30.8-22.8-46.2-34.3 c-3.2-2.4-9.4-2.4-12.6,0c-42.2,31.3-84.5,62.6-126.7,93.8c-67.3,49.8-134.6,99.7-201.9,149.5C36.2,256.5,20.8,268,5.4,279.4 c-12.8,9.5-0.3,31.1,12.6,21.5c42.2-31.3,84.5-62.6,126.7-93.8c67.3-49.8,134.6-99.7,201.9-149.5c13.3-9.9,26.6-19.7,40-29.6 c40.1,29.7,80.3,59.4,120.4,89.2c67.3,49.8,134.6,99.7,201.9,149.5c15.4,11.4,30.8,22.8,46.2,34.3 C767.8,310.5,780.3,288.8,767.5,279.4z"/>
    </g>
  </g>
</svg>
`;

export class SmartHomeShopPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean, reflect: true }) public narrow = false;
  @property({ attribute: false }) public panel?: { config: PanelConfig };
  @state() private _currentPage: PageType = 'dashboard';
  @state() private _selectedDeviceId?: string;
  @state() private _radarContext: RadarContext | null = null;
  @state() private _confirmRadarClose = false;
  private _localization?: { refresh: () => void; disconnect: () => void };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--primary-background-color);
      /* SmartHomeShop brand color, used as accent only */
      --shs-primary: #4361ee;
    }
    :host([data-floor-plan]) { height: 100dvh; }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 0 16px;
      min-height: 56px;
      background: var(--card-background-color);
      border-bottom: 1px solid var(--divider-color);
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--shs-primary);
    }

    .logo-icon svg {
      width: 100%;
      height: 100%;
    }

    .logo-brand {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .nav-tabs {
      display: flex;
      align-self: stretch;
      gap: 4px;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 14px;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--secondary-text-color);
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
    }

    .nav-tab:hover {
      color: var(--primary-text-color);
    }

    .nav-tab.active {
      color: var(--shs-primary);
      border-bottom-color: var(--shs-primary);
    }

    .nav-tab ha-icon {
      --mdc-icon-size: 18px;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .version {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .panel-content {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }
    .panel-content.floor-plan { display: flex; min-height: 0; padding: 0; }
    .radar-drawer {
      box-sizing: border-box;
      position: fixed;
      inset: 12px 12px 12px auto;
      width: min(480px, calc(100vw - 24px));
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      overflow: auto;
      overscroll-behavior: contain;
      border: 1px solid var(--divider-color, #d6dce5);
      border-radius: 16px;
      background: var(--card-background-color, #fbfcfe);
      color: var(--primary-text-color, #172338);
      box-shadow: 0 14px 42px #10172530;
    }
    .radar-drawer::backdrop { background: #11182740; }
    .radar-drawer-head {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 16px 20px;
      background: var(--card-background-color, #fbfcfe);
      border-bottom: 1px solid var(--divider-color, #d6dce5);
    }
    .radar-drawer-head h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 20px;
      line-height: 1.25;
      letter-spacing: -.02em;
    }
    .radar-drawer-head h2 ha-icon { color: var(--primary-color, #4361ee); --mdc-icon-size: 21px; }
    .radar-drawer button {
      min-height: 44px;
      padding: 0 12px;
      border: 1px solid var(--divider-color, #d6dce5);
      border-radius: 8px;
      background: var(--secondary-background-color, #f3f6fa);
      color: inherit;
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
    }
    .radar-drawer .radar-close { display: grid; place-items: center; min-width: 44px; padding: 0; }
    .radar-drawer button:hover { border-color: var(--primary-color, #4361ee); }
    .radar-drawer button:focus-visible { outline: 2px solid var(--primary-color, #4361ee); outline-offset: 2px; }
    .radar-close ha-icon { --mdc-icon-size: 21px; }
    .radar-confirm {
      margin: 16px 20px 0;
      padding: 12px;
      border: 1px solid var(--divider-color, #d6dce5);
      border-inline-start: 3px solid var(--warning-color, #be7c27);
      border-radius: 8px;
      background: var(--secondary-background-color, #f3f6fa);
    }
    .radar-confirm p { margin: 0 0 10px; font-size: 14px; line-height: 1.5; }
    .radar-confirm div { display: flex; flex-wrap: wrap; gap: 8px; }
    .radar-confirm .radar-discard { color: var(--error-color, #ab312d); }
    @media (max-width: 600px) {
      .radar-drawer { inset: auto 0 0; width: 100%; max-height: 91dvh; border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom); }
      .radar-drawer-head { padding: 10px 15px; }
      .radar-confirm { margin-inline: 15px; }
    }

    /* Responsive */
    @media (max-width: 900px) {
      .panel-header {
        flex-wrap: wrap;
        padding: 8px 16px 0;
        gap: 8px;
      }
      .nav-tabs {
        order: 3;
        width: 100%;
        overflow-x: auto;
      }
      .nav-tab {
        padding: 10px 12px;
        font-size: 13px;
        white-space: nowrap;
      }
      .panel-content {
        padding: 16px;
      }
    }
    @media (max-width: 460px) {
      :host([data-floor-plan]) .nav-tabs .nav-tab { padding-inline: 7px; }
      :host([data-floor-plan]) .nav-tabs .nav-tab ha-icon { display: none; }
    }
  `;

  // A reload, a closed tab or a typed URL never passes through _navigateTo,
  // so the browser has to do the asking there.
  private _handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (!this._hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('beforeunload', this._handleBeforeUnload);
    if (this.hasUpdated) void this.updateComplete.then(() => this._startLocalization());
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('beforeunload', this._handleBeforeUnload);
    this._localization?.disconnect();
    this._localization = undefined;
  }

  private _startLocalization(): void {
    if (this._localization) return;
    this._localization = installPanelLocalization(this.renderRoot as ShadowRoot, () => this.hass);
  }

  private _hasUnsavedChanges(): boolean {
    return Boolean(this._floorEditor()?.isDirty || this._radarEditor()?.isDirty);
  }

  private _floorEditor(): FloorEditor | null {
    return this.renderRoot?.querySelector<FloorEditor>('shs-floor-planner-page') ?? null;
  }

  private _radarEditor(): ZonesPage | null {
    return this.renderRoot?.querySelector<ZonesPage>('shs-zones-page[hardwareonly]') ?? null;
  }

  private async _openRadarTools(event: CustomEvent<RadarContext>): Promise<void> {
    if (!this.hass?.user?.is_admin || this._radarContext) return;
    this._radarContext = event.detail;
    await this.updateComplete;
    this.renderRoot.querySelector<HTMLDialogElement>('.radar-drawer')?.showModal();
  }

  private _closeRadarTools(discard = false): void {
    const settings = this._radarEditor();
    if (settings?.hardwareBusy) return;
    if (settings?.isDirty && !discard) {
      this._confirmRadarClose = true;
      void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLButtonElement>('.radar-continue')?.focus());
      return;
    }
    this.renderRoot.querySelector<HTMLDialogElement>('.radar-drawer')?.close();
  }

  private _radarClosed(): void {
    this._radarContext = null;
    this._confirmRadarClose = false;
    void this.updateComplete.then(() => this._floorEditor()?.focusRadarButton?.());
  }

  private _renderRadarTools() {
    if (!this._radarContext) return nothing;
    return html`<dialog class="radar-drawer" aria-labelledby="radar-settings-title"
      @cancel=${(event: Event) => { event.preventDefault(); this._closeRadarTools(); }}
      @close=${this._radarClosed}>
      <header class="radar-drawer-head">
        <h2 id="radar-settings-title"><ha-icon icon="mdi:radar" aria-hidden="true"></ha-icon>${panelText(this.hass, 'Radar settings')}</h2>
        <button class="radar-close" type="button" autofocus aria-label=${panelText(this.hass, 'Close radar settings')}
          @click=${() => this._closeRadarTools()}><ha-icon icon="mdi:close" aria-hidden="true"></ha-icon></button>
      </header>
      ${this._confirmRadarClose ? html`<section class="radar-confirm" aria-label=${panelText(this.hass, 'Unsaved calibration')}>
        <p>${panelText(this.hass, 'Your measurement is unsaved. Discard it?')}</p>
        <div><button type="button" class="radar-continue" @click=${() => { this._confirmRadarClose = false; }}>
          ${panelText(this.hass, 'Keep editing')}</button>
        <button type="button" class="radar-discard" @click=${() => this._closeRadarTools(true)}>
          ${panelText(this.hass, 'Discard changes')}</button></div>
      </section>` : nothing}
      <shs-zones-page hardwareonly .hass=${this.hass} .hardwareContext=${this._radarContext}
        @radar-calibration-saved=${(event: CustomEvent<{ room: Room; previousRevision?: string }>) => {
          this._confirmRadarClose = false;
          this._floorEditor()?.applyRadarCalibration(event.detail);
        }}></shs-zones-page>
    </dialog>`;
  }

  private _isFloorPlan(page = this._currentPage): boolean {
    return ['home', 'zones', 'room-builder'].includes(page);
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    console.log(`SmartHomeShop Panel v${VERSION} initialized`);
    this._startLocalization();
    if (new URLSearchParams(window.location.search).get('energy-settings') === 'automations') {
      this._currentPage = 'energy';
      void this.updateComplete.then(() => {
        const hub = this.renderRoot.querySelector('shs-energy-hub') as (HTMLElement & {
          openSettings?: (focus?: 'solar-control') => void;
        }) | null;
        hub?.openSettings?.('solar-control');
      });
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    this.toggleAttribute('data-floor-plan', this._isFloorPlan());
    if (changedProperties.has('hass')) this._localization?.refresh();
  }

  private _navigateTo(page: PageType): void {
    if (page === 'home') page = 'zones';
    if (this._isFloorPlan() && !this._isFloorPlan(page) && this._hasUnsavedChanges()
      && !window.confirm(panelText(this.hass, 'Discard the unsaved changes to your floor plan?'))) {
      return;
    }
    this._currentPage = page;
  }

  private _handleDeviceSelect(e: CustomEvent): void {
    this._selectedDeviceId = e.detail.deviceId;
  }

  private async _handleOpenEnergySettings(event: CustomEvent<{ focus?: 'solar-control' }>): Promise<void> {
    event.stopPropagation();
    this._navigateTo('energy');
    await this.updateComplete;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const hub = this.renderRoot.querySelector('shs-energy-hub') as (HTMLElement & {
      openSettings?: (focus?: 'solar-control') => void;
    }) | null;
    hub?.openSettings?.(event.detail?.focus || 'solar-control');
  }

  protected render() {
    return html`
      <div class="panel-header">
        <div class="header-left">
          <div class="logo">
            <div class="logo-icon" .innerHTML=${SHS_LOGO_SVG}></div>
            <span class="logo-brand">SmartHomeShop.io</span>
          </div>
        </div>
        <nav class="nav-tabs">
          <button class="nav-tab ${this._currentPage === 'dashboard' ? 'active' : ''}" @click=${() => this._navigateTo('dashboard')}>
            <ha-icon icon="mdi:view-dashboard"></ha-icon>Dashboard
          </button>
          <button class="nav-tab ${this._currentPage === 'zones' || this._currentPage === 'room-builder' ? 'active' : ''}" @click=${() => this._navigateTo('zones')}>
            <ha-icon icon="mdi:floor-plan"></ha-icon>${panelText(this.hass, 'Floorplan Designer')}
          </button>
          <button class="nav-tab ${this._currentPage === 'energy' ? 'active' : ''}" @click=${() => this._navigateTo('energy')}>
            <ha-icon icon="mdi:lightning-bolt"></ha-icon>Energy
          </button>
        </nav>
        <div class="header-right">
          <span class="version">v${VERSION}</span>
        </div>
      </div>
      <div class="panel-content ${this._isFloorPlan() ? 'floor-plan' : ''}">${this._renderPage()}</div>
      ${this._renderRadarTools()}
    `;
  }

  private _renderPage() {
    switch (this._currentPage) {
      case 'dashboard':
        return html`<shs-dashboard-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
          @device-select=${this._handleDeviceSelect}
          @open-energy-settings=${this._handleOpenEnergySettings}
          @navigate=${(e: CustomEvent) => this._navigateTo(e.detail.page)}
        ></shs-dashboard-page>`;
      case 'room-builder':
      case 'zones':
      case 'home':
        return html`<shs-floor-planner-page
          .hass=${this.hass}
          .mode=${!this.hass?.user?.is_admin ? 'live' : 'edit'}
          @open-radar-tools=${this._openRadarTools}
        ></shs-floor-planner-page>`;
      case 'energy':
        return html`<shs-energy-hub .hass=${this.hass}></shs-energy-hub>`;
      case 'settings':
        // Device settings moved to the device page (Settings tab)
        return html`<shs-dashboard-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
          @device-select=${this._handleDeviceSelect}
          @open-energy-settings=${this._handleOpenEnergySettings}
          @navigate=${(e: CustomEvent) => this._navigateTo(e.detail.page)}
        ></shs-dashboard-page>`;
      default:
        return html`<p>Page not found</p>`;
    }
  }
}

if (!customElements.get('smarthomeshop-panel')) {
  customElements.define('smarthomeshop-panel', SmartHomeShopPanel);
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-panel': SmartHomeShopPanel;
  }
}
