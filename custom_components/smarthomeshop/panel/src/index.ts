import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, PanelConfig, PageType } from './types';
import './pages/dashboard-page';
import './pages/room-builder-page';
import './pages/zones-page';
import './pages/settings-page';

const VERSION = '3.5.0';

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

@customElement('smarthomeshop-panel')
export class SmartHomeShopPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Boolean, reflect: true }) public narrow = false;
  @property({ attribute: false }) public panel?: { config: PanelConfig };
  @state() private _currentPage: PageType = 'dashboard';
  @state() private _selectedDeviceId?: string;
  @state() private _selectedRoomId?: string;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--primary-background-color);
      /* SmartHomeShop brand colors - Blue theme from website */
      --shs-primary: #4361ee;
      --shs-primary-light: #5a7bf7;
      --shs-primary-dark: #3651d4;
      --shs-accent: #3f37c9;
      --shs-gradient: linear-gradient(135deg, #4361ee 0%, #3f37c9 50%, #4cc9f0 100%);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
      border-bottom: none;
      box-shadow: 0 4px 20px rgba(67, 97, 238, 0.3);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .logo-icon svg {
      width: 100%;
      height: 100%;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .logo-brand {
      font-size: 18px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }

    .logo-tagline {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .nav-tabs {
      display: flex;
      gap: 4px;
      background: rgba(255, 255, 255, 0.1);
      padding: 4px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .nav-tab:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }

    .nav-tab.active {
      background: white;
      color: var(--shs-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .nav-tab ha-icon {
      --mdc-icon-size: 18px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .version-badge {
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .panel-content {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .panel-header {
        flex-wrap: wrap;
        gap: 16px;
        padding: 16px;
      }
      .nav-tabs {
        order: 3;
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
      }
      .nav-tab {
        padding: 8px 14px;
        font-size: 12px;
      }
    }
  `;

  protected firstUpdated(_changedProperties: PropertyValues): void {
    console.log(`SmartHomeShop Panel v${VERSION} initialized`);
  }

  private _navigateTo(page: PageType): void {
    this._currentPage = page;
  }

  private _handleDeviceSelect(e: CustomEvent): void {
    this._selectedDeviceId = e.detail.deviceId;
  }

  private _handleRoomSelect(e: CustomEvent): void {
    this._selectedRoomId = e.detail.roomId;
  }

  protected render() {
    return html`
      <div class="panel-header">
        <div class="header-left">
          <div class="logo">
            <div class="logo-icon" .innerHTML=${SHS_LOGO_SVG}></div>
            <div class="logo-text">
              <span class="logo-brand">SmartHomeShop.io</span>
              <span class="logo-tagline">Custom Integration</span>
            </div>
          </div>
        </div>
        <nav class="nav-tabs">
          <button class="nav-tab ${this._currentPage === 'dashboard' ? 'active' : ''}" @click=${() => this._navigateTo('dashboard')}>
            <ha-icon icon="mdi:view-dashboard"></ha-icon>Dashboard
          </button>
          <button class="nav-tab ${this._currentPage === 'room-builder' ? 'active' : ''}" @click=${() => this._navigateTo('room-builder')}>
            <ha-icon icon="mdi:floor-plan"></ha-icon>Room Builder
          </button>
          <button class="nav-tab ${this._currentPage === 'zones' ? 'active' : ''}" @click=${() => this._navigateTo('zones')}>
            <ha-icon icon="mdi:vector-polygon"></ha-icon>Zones
          </button>
          <button class="nav-tab ${this._currentPage === 'settings' ? 'active' : ''}" @click=${() => this._navigateTo('settings')}>
            <ha-icon icon="mdi:cog"></ha-icon>Settings
          </button>
        </nav>
        <div class="header-right">
          <span class="version-badge">v${VERSION}</span>
        </div>
      </div>
      <div class="panel-content">${this._renderPage()}</div>
    `;
  }

  private _renderPage() {
    switch (this._currentPage) {
      case 'dashboard':
        return html`<shs-dashboard-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
          @device-select=${this._handleDeviceSelect}
          @navigate=${(e: CustomEvent) => this._navigateTo(e.detail.page)}
        ></shs-dashboard-page>`;
      case 'room-builder':
        return html`<shs-room-builder-page
          .hass=${this.hass}
          .selectedRoomId=${this._selectedRoomId}
          .selectedDeviceId=${this._selectedDeviceId}
          @room-select=${this._handleRoomSelect}
        ></shs-room-builder-page>`;
      case 'zones':
        return html`<shs-zones-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
        ></shs-zones-page>`;
      case 'settings':
        return html`<shs-settings-page
          .hass=${this.hass}
          .selectedDeviceId=${this._selectedDeviceId}
          @device-select=${this._handleDeviceSelect}
        ></shs-settings-page>`;
      default:
        return html`<p>Page not found</p>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-panel': SmartHomeShopPanel;
  }
}
