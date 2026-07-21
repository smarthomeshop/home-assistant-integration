import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, SmartHomeShopDevice, DeviceEntity } from '../types';
import './settings-page';
import './automations-page';

interface DeviceWithEntities extends SmartHomeShopDevice {
  entities?: DeviceEntity[];
}

// Product categories with icon and accent color per product
const PRODUCT_CONFIG: Record<string, { icon: string; category: string; color: string }> = {
  ultimatesensor: { icon: 'mdi:radar', category: 'sensor', color: '#4361ee' },
  ultimatesensor_mini: { icon: 'mdi:radar', category: 'sensor', color: '#4361ee' },
  waterp1meterkit: { icon: 'mdi:water-pump', category: 'water', color: '#0096c7' },
  watermeterkit: { icon: 'mdi:water-circle', category: 'water', color: '#0096c7' },
  waterflowkit: { icon: 'mdi:waves', category: 'water', color: '#0096c7' },
  p1meterkit: { icon: 'mdi:flash', category: 'energy', color: '#f72585' },
  ceilsense: { icon: 'mdi:ceiling-light', category: 'sensor', color: '#7209b7' },
};

@customElement('shs-dashboard-page')
export class DashboardPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public selectedDeviceId?: string;
  @state() private _devices: DeviceWithEntities[] = [];
  @state() private _loading = true;
  @state() private _detailDevice: DeviceWithEntities | null = null;
  @state() private _insights: any | null = null;
  @state() private _showMeterForm = false;
  @state() private _meterInput = '';
  @state() private _detailTab: 'overview' | 'automations' | 'settings' = 'overview';
  @state() private _linking = false;
  @state() private _linkError = '';
  private _insightsTimer?: number;

  static styles = css`
    :host {
      display: block;
      max-width: 1100px;
      margin: 0 auto;
      --shs-primary: #4361ee;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin: 0 0 12px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0;
    }

    .section-count {
      font-size: 13px;
      font-weight: 400;
      color: var(--secondary-text-color);
      margin-left: 8px;
    }

    .shop-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--shs-primary);
      text-decoration: none;
    }

    .shop-link:hover {
      text-decoration: underline;
    }

    .shop-link ha-icon {
      --mdc-icon-size: 14px;
    }

    /* Device Grid */
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    /* Device Card */
    .device-card {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
      cursor: pointer;
    }

    .device-card:hover,
    .device-card.selected {
      border-color: var(--shs-primary);
    }

    .device-card.selected {
      box-shadow: inset 0 0 0 1px var(--shs-primary);
    }

    .device-header {
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .device-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .device-icon ha-icon {
      --mdc-icon-size: 22px;
    }

    .device-info {
      flex: 1;
      min-width: 0;
    }

    .device-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0 0 3px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .device-type {
      font-size: 12.5px;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .device-type-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .device-type-badge.water {
      background: rgba(0, 150, 199, 0.12);
      color: #0096c7;
    }

    .device-type-badge.sensor {
      background: rgba(67, 97, 238, 0.12);
      color: #4361ee;
    }

    .device-type-badge.energy {
      background: rgba(247, 37, 133, 0.12);
      color: #f72585;
    }

    .online-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
    }

    .offline-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
    }

    .last-seen {
      font-size: 11.5px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .device-card.offline .device-icon,
    .device-card.offline .sensor-grid {
      filter: grayscale(1);
      opacity: 0.55;
    }

    /* Sensor Data Grid */
    .sensor-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: var(--divider-color);
      border-top: 1px solid var(--divider-color);
    }

    .sensor-grid.combined {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .sensor-item {
      background: var(--card-background-color);
      padding: 12px 8px;
      text-align: center;
    }

    .sensor-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      display: block;
    }

    .sensor-label {
      font-size: 10px;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }

    .sensor-icon {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }

    .sensor-item.water-metric .sensor-icon { color: #0096c7; }
    .sensor-item.energy-metric .sensor-icon { color: #d8890b; }


    /* Tools */
    .tools-list {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
    }

    .tool-row {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 16px;
      border: none;
      background: none;
      text-align: left;
      font-family: inherit;
      cursor: pointer;
    }

    .tool-row + .tool-row {
      border-top: 1px solid var(--divider-color);
    }

    .tool-row:hover {
      background: var(--secondary-background-color);
    }

    .tool-icon {
      display: flex;
      color: var(--shs-primary);
      --mdc-icon-size: 22px;
      flex-shrink: 0;
    }

    .tool-text {
      flex: 1;
      min-width: 0;
    }

    .tool-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
      margin: 0 0 2px 0;
    }

    .tool-desc {
      font-size: 12.5px;
      color: var(--secondary-text-color);
      margin: 0;
    }

    .tool-chevron {
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      border: 1px dashed var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      margin-bottom: 32px;
    }

    .empty-state ha-icon {
      --mdc-icon-size: 40px;
      color: var(--secondary-text-color);
      margin-bottom: 12px;
    }

    .empty-state h3 {
      font-size: 16px;
      color: var(--primary-text-color);
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: var(--secondary-text-color);
      margin: 0 auto;
      font-size: 13.5px;
      max-width: 460px;
      line-height: 1.5;
    }

    /* Device detail */
    .detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid var(--divider-color); border-radius: 10px; background: none; color: var(--primary-text-color); font-size: 13px; font-family: inherit; cursor: pointer; }
    .back-btn:hover { border-color: var(--shs-primary); }
    .detail-title { flex: 1; min-width: 0; }
    .detail-name { font-size: 17px; font-weight: 600; color: var(--primary-text-color); }
    .detail-sub { font-size: 12.5px; color: var(--secondary-text-color); }
    .chips-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .chip-card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 12px 14px; }
    .chip-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--secondary-text-color); }
    .chip-value { margin-top: 4px; font-size: 20px; font-weight: 600; color: var(--primary-text-color); }
    .chip-value .unit { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); }
    .chip-value.good { color: #22c55e; }
    .chip-value.warn { color: #f59e0b; }
    .chip-value.bad { color: #ef4444; }
    .insight-card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 16px; margin-bottom: 16px; }
    .insight-title { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 12px; }
    .insight-badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
    .meter-set-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: 1px solid var(--divider-color); border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 500; color: var(--shs-primary, #4361ee); cursor: pointer; }
    .meter-set-btn:hover { border-color: var(--shs-primary, #4361ee); }
    .meter-reading-value { font-size: 28px; font-weight: 700; color: var(--primary-text-color); font-variant-numeric: tabular-nums; }
    .meter-reading-value .unit { font-size: 14px; font-weight: 400; color: var(--secondary-text-color); }
    .meter-form { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color); }
    .meter-form-help { font-size: 12.5px; line-height: 1.5; color: var(--secondary-text-color); margin-bottom: 10px; }
    .meter-form-row { display: flex; align-items: center; gap: 8px; }
    .meter-form-row input { flex: 1; min-width: 0; background: var(--secondary-background-color); border: 1px solid var(--divider-color); border-radius: 8px; padding: 10px 12px; font-size: 15px; color: var(--primary-text-color); outline: none; }
    .meter-form-row input:focus { border-color: var(--shs-primary, #4361ee); }
    .meter-form-unit { font-size: 13px; color: var(--secondary-text-color); }
    .meter-form-save { background: var(--shs-primary, #4361ee); color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .meter-form-save:disabled { opacity: 0.4; cursor: not-allowed; }
    .insight-badge.ok { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
    .insight-badge.alert { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    .score-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .score-label { width: 130px; font-size: 12.5px; color: var(--secondary-text-color); }
    .score-track { flex: 1; height: 6px; border-radius: 3px; background: var(--divider-color); overflow: hidden; }
    .score-fill { height: 100%; border-radius: 3px; background: #22c55e; transition: width 0.4s ease; }
    .score-fill.warn { background: #f59e0b; }
    .score-fill.bad { background: #ef4444; }
    .score-value { width: 34px; text-align: right; font-size: 12px; font-weight: 600; color: var(--primary-text-color); }
    .spark-empty { font-size: 12.5px; color: var(--secondary-text-color); padding: 20px 0; text-align: center; }
    .chart-wrap { position: relative; }
    .chart-svg { width: 100%; height: 110px; display: block; }
    .chart-ylabel { position: absolute; right: 4px; font-size: 10px; color: var(--secondary-text-color); background: color-mix(in srgb, var(--card-background-color) 80%, transparent); padding: 0 4px; border-radius: 4px; pointer-events: none; }
    .chart-axis { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--secondary-text-color); margin-top: 6px; }
    .section-heading { display: flex; align-items: center; gap: 8px; margin: 24px 0 12px; font-size: 12.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--secondary-text-color); }
    .section-heading:first-of-type { margin-top: 0; }
    .section-heading ha-icon { --mdc-icon-size: 16px; }
    .section-heading::after { content: ''; flex: 1; height: 1px; background: var(--divider-color); }
    .leak-footnote { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--divider-color); font-size: 11.5px; color: var(--secondary-text-color); line-height: 1.45; }
    .session-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-top: 1px solid var(--divider-color); font-size: 13px; }
    .session-row:first-of-type { border-top: none; }
    .session-row ha-icon { --mdc-icon-size: 18px; color: var(--shs-primary); }
    .session-name { flex: 1; color: var(--primary-text-color); text-transform: capitalize; }
    .session-meta { color: var(--secondary-text-color); font-size: 12.5px; }
    .detail-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
    @media (min-width: 900px) { .detail-grid { grid-template-columns: 1fr 1fr; } }
    .not-configured { border: 1px dashed var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); padding: 16px; font-size: 13.5px; color: var(--secondary-text-color); margin-bottom: 16px; }
    .not-configured-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .not-configured .designer-btn:disabled { opacity: 0.6; cursor: default; }
    .link-error { color: var(--error-color, #ef4444); font-size: 12.5px; margin-top: 10px; }
    .status-badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; background: var(--secondary-background-color); color: var(--secondary-text-color); text-transform: capitalize; }
    .status-badge.ok { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
    .status-badge.warn { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
    .status-badge.alert { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    .metric-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-top: 1px solid var(--divider-color); font-size: 13px; }
    .metric-row:first-of-type { border-top: none; }
    .metric-label { flex: 1; color: var(--primary-text-color); }
    .metric-value { font-weight: 600; color: var(--primary-text-color); }
    .reco-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; background: rgba(245, 158, 11, 0.08); color: #b45309; font-size: 13px; margin-bottom: 6px; }
    .reco-row ha-icon { --mdc-icon-size: 16px; color: #f59e0b; }
    .room-score-big { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
    .room-score-num { font-size: 38px; font-weight: 700; line-height: 1; }
    .designer-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid var(--shs-primary); border-radius: 10px; background: transparent; color: var(--shs-primary); font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .designer-btn:hover { background: rgba(67, 97, 238, 0.08); }
    .detail-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--divider-color); margin-bottom: 16px; }
    .detail-tab { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border: none; border-bottom: 2px solid transparent; background: none; color: var(--secondary-text-color); font-size: 13.5px; font-weight: 500; font-family: inherit; cursor: pointer; margin-bottom: -1px; }
    .detail-tab ha-icon { --mdc-icon-size: 16px; }
    .detail-tab:hover { color: var(--primary-text-color); }
    .detail-tab.active { color: var(--shs-primary); border-bottom-color: var(--shs-primary); }
    .offline-detail-card { display: flex; align-items: center; gap: 14px; }
    .offline-detail-card ha-icon { --mdc-icon-size: 28px; color: var(--secondary-text-color); opacity: 0.6; flex-shrink: 0; margin-top: 2px; }
    .offline-detail-title { font-size: 14.5px; font-weight: 600; color: var(--primary-text-color); margin-bottom: 4px; }
    .offline-detail-sub { font-size: 13px; color: var(--secondary-text-color); line-height: 1.5; }

    /* Loading */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      gap: 20px;
    }

    .loading-text {
      color: var(--secondary-text-color);
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .devices-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .sensor-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .sensor-grid.combined {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._loadDevices();
  }

  private async _loadDevices(): Promise<void> {
    this._loading = true;
    try {
      const result = await this.hass.callWS<{ devices: SmartHomeShopDevice[] }>({ type: 'smarthomeshop/devices' });

      // Load entities for each device
      const devicesWithEntities: DeviceWithEntities[] = await Promise.all(
        result.devices.map(async (device) => {
          try {
            const entityResult = await this.hass.callWS<{ entities: DeviceEntity[] }>({
              type: 'smarthomeshop/device/entities',
              device_id: device.id,
            });
            return { ...device, entities: entityResult.entities };
          } catch {
            return { ...device, entities: [] };
          }
        })
      );

      this._devices = devicesWithEntities;
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
    this._loading = false;
  }

  private _selectDevice(device: SmartHomeShopDevice): void {
    this.dispatchEvent(new CustomEvent('device-select', { detail: { deviceId: device.id } }));
  }

  private _navigateTo(page: string): void {
    this.dispatchEvent(new CustomEvent('navigate', { detail: { page } }));
  }

  private _openDetail(device: DeviceWithEntities): void {
    this._detailDevice = device;
    this._insights = null;
    this._detailTab = 'overview';
    this._linking = false;
    this._linkError = '';
    this._fetchInsights();
    this._insightsTimer = window.setInterval(() => this._fetchInsights(), 5000);
  }

  private _closeDetail(): void {
    this._detailDevice = null;
    this._insights = null;
    this._showMeterForm = false;
    this._meterInput = '';
    if (this._insightsTimer) {
      clearInterval(this._insightsTimer);
      this._insightsTimer = undefined;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._insightsTimer) clearInterval(this._insightsTimer);
  }

  private async _fetchInsights(): Promise<void> {
    if (!this._detailDevice) return;
    try {
      this._insights = await this.hass.callWS<any>({
        type: 'smarthomeshop/device/insights',
        device_id: this._detailDevice.id,
      });
    } catch (err) {
      console.error('Failed to load insights:', err);
    }
  }

  private async _linkDevice(): Promise<void> {
    const device = this._detailDevice;
    if (!device || this._linking) return;
    const deviceId = device.id;
    this._linking = true;
    this._linkError = '';
    try {
      await this.hass.callWS({
        type: 'smarthomeshop/device/link',
        device_id: deviceId,
      });
      if (this._detailDevice?.id === deviceId) await this._fetchInsights();
    } catch (err: any) {
      // The call can settle after the user navigated to another device;
      // never paint that device's banner with this one's outcome.
      if (this._detailDevice?.id === deviceId) {
        this._linkError = err?.message || 'Could not link this device. Check the Home Assistant logs.';
      }
    } finally {
      if (this._detailDevice?.id === deviceId) this._linking = false;
    }
  }

  private _toggleMeterForm = (): void => {
    this._showMeterForm = !this._showMeterForm;
    if (this._showMeterForm) {
      const total = this._insights?.water?.meter_total;
      this._meterInput = total > 0 ? total.toFixed(3) : '';
    }
  };

  private _meterInputValid(): boolean {
    const value = parseFloat(this._meterInput.replace(',', '.'));
    return !isNaN(value) && value >= 0;
  }

  private async _saveMeterReading(entityId?: string): Promise<void> {
    if (!entityId || !this._meterInputValid()) return;
    const value = parseFloat(this._meterInput.replace(',', '.'));
    await this.hass.callService('number', 'set_value', {
      entity_id: entityId,
      value,
    });
    this._showMeterForm = false;
    this._meterInput = '';
    this._fetchInsights();
  }

  private _fmtTime(iso?: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  private _relativeTime(iso?: string | null): string {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  private _statusClass(status?: string): string {
    if (!status) return '';
    const good = ['excellent', 'good', 'ideal'];
    const warn = ['moderate', 'fair', 'elevated', 'cool', 'warm', 'fairly dry', 'fairly humid'];
    if (good.includes(status)) return 'ok';
    if (warn.includes(status)) return 'warn';
    if (status === 'unknown') return '';
    return 'alert';
  }

  private _scoreClass(score: number): string {
    if (score >= 60) return 'bad';
    if (score >= 30) return 'warn';
    return '';
  }

  private _niceCeil(v: number): number {
    if (v <= 0) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return nice * pow;
  }

  private _fmtChartValue(v: number, unit: string, decimals: number): string {
    if (unit === 'W' && v >= 1000) return `${(v / 1000).toFixed(1)} kW`;
    return `${v.toFixed(decimals)} ${unit}`;
  }

  private _renderLineChart(
    history: Array<[number, number]>,
    current: number,
    color: string,
    unit: string,
    decimals = 1,
  ) {
    const now = Date.now() / 1000;
    const points = [...(history || []), [now, current] as [number, number]]
      .filter(pt => now - pt[0] <= 1200);
    if (points.length < 2) {
      return html`<div class="spark-empty">Collecting data...</div>`;
    }
    const W = 600, H = 110, PADT = 6, PADB = 6;
    const innerH = H - PADT - PADB;
    const maxV = this._niceCeil(Math.max(...points.map(pt => pt[1])));
    const x = (ts: number) => ((ts - (now - 1200)) / 1200) * W;
    const y = (v: number) => PADT + innerH - (v / maxV) * innerH;

    // Smooth curve through midpoints
    let d = `M ${x(points[0][0]).toFixed(1)} ${y(points[0][1]).toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const x0 = x(points[i - 1][0]), y0 = y(points[i - 1][1]);
      const x1 = x(points[i][0]), y1 = y(points[i][1]);
      const mx = ((x0 + x1) / 2).toFixed(1);
      d += ` C ${mx} ${y0.toFixed(1)}, ${mx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    const last = points[points.length - 1];
    const areaD = `${d} L ${x(last[0]).toFixed(1)} ${(PADT + innerH).toFixed(1)} L 0 ${(PADT + innerH).toFixed(1)} Z`;
    const gid = `chart-grad-${color.replace('#', '')}`;
    const gridY = [y(maxV), y(maxV / 2)];

    return html`
      <div class="chart-wrap">
        <svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <line x1="0" y1="${gridY[0]}" x2="${W}" y2="${gridY[0]}" stroke="rgba(148, 163, 184, 0.12)" stroke-width="1"/>
          <line x1="0" y1="${gridY[1]}" x2="${W}" y2="${gridY[1]}" stroke="rgba(148, 163, 184, 0.12)" stroke-width="1"/>
          <path d="${areaD}" fill="url(#${gid})"/>
          <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <circle cx="${x(last[0])}" cy="${y(last[1])}" r="7" fill="${color}" opacity="0.18"/>
          <circle cx="${x(last[0])}" cy="${y(last[1])}" r="3.5" fill="${color}"/>
        </svg>
        <span class="chart-ylabel" style="top: 0;">${this._fmtChartValue(maxV, unit, decimals)}</span>
        <span class="chart-ylabel" style="top: calc(50% - 8px);">${this._fmtChartValue(maxV / 2, unit, decimals)}</span>
        <div class="chart-axis">
          <span>20 min ago</span>
          <span>10 min ago</span>
          <span>now</span>
        </div>
      </div>
    `;
  }

  private _renderDetail() {
    const device = this._detailDevice!;
    const config = this._getProductConfig(device.product_type);
    const ins = this._insights;
    const water = ins?.water;
    const energy = ins?.energy;
    const leak = water?.leak_score;
    const baseline = water?.baseline;
    // Insights carry live connectivity (5s polling); fall back to the
    // devices-list snapshot until the first insights response arrives.
    const offline = ins ? ins.online === false : device.online === false;
    const lastSeen = (ins ? ins.last_seen : device.last_seen) || null;

    return html`
      <div class="detail-header">
        <button class="back-btn" @click=${this._closeDetail}>
          <ha-icon icon="mdi:arrow-left" style="--mdc-icon-size: 16px;"></ha-icon>
          Back
        </button>
        <div class="detail-title">
          <div class="detail-name">
            ${device.name}
            ${offline ? html`<span class="offline-badge" style="vertical-align: 2px; margin-left: 6px;">Offline</span>` : nothing}
          </div>
          <div class="detail-sub">
            ${device.product_name}${offline && lastSeen
              ? html` · Last seen ${this._relativeTime(lastSeen)}`
              : nothing}
          </div>
        </div>
        <a class="shop-link" href="/config/devices/device/${device.id}">
          Open in Home Assistant
          <ha-icon icon="mdi:open-in-new"></ha-icon>
        </a>
      </div>

      ${ins && ins.configured === false ? (ins.entry_exists ? html`
        <div class="not-configured">
          ${ins.entry_disabled ? html`
            This device is linked, but its SmartHomeShop entry is disabled.
            Enable it via <a href="/config/integrations/integration/smarthomeshop">Settings, Devices &amp; Services</a> to bring back ${this._integrationFeatures(device.product_type)}.
          ` : html`
            This device is linked, but the SmartHomeShop entry is not loaded yet.
            It is usually still starting; if this does not resolve, check the Home Assistant logs.
          `}
        </div>
      ` : html`
        <div class="not-configured">
          <div class="not-configured-row">
            <div style="flex: 1; min-width: 0;">
              This device is not linked to the SmartHomeShop integration yet.
              ${this.hass.user?.is_admin ? html`
                Link it to unlock ${this._integrationFeatures(device.product_type)}.
                Sensors are detected automatically and you can tune everything afterwards in the Settings tab.
              ` : html`
                Ask a Home Assistant administrator to link it and unlock ${this._integrationFeatures(device.product_type)}.
              `}
            </div>
            ${this.hass.user?.is_admin ? html`
              <button class="designer-btn" style="flex-shrink: 0;" ?disabled=${this._linking} @click=${this._linkDevice}>
                <ha-icon icon="mdi:link-variant" style="--mdc-icon-size: 16px;"></ha-icon>
                ${this._linking ? 'Linking...' : 'Link now'}
              </button>
            ` : nothing}
          </div>
          ${this._linkError ? html`<div class="link-error">${this._linkError}</div>` : nothing}
        </div>
      `) : nothing}

      <div class="detail-tabs">
        <button class="detail-tab ${this._detailTab === 'overview' ? 'active' : ''}" @click=${() => { this._detailTab = 'overview'; }}>
          <ha-icon icon="mdi:view-dashboard-outline"></ha-icon>
          Overview
        </button>
        <button class="detail-tab ${this._detailTab === 'automations' ? 'active' : ''}" @click=${() => { this._detailTab = 'automations'; }}>
          <ha-icon icon="mdi:robot-outline"></ha-icon>
          Automations
        </button>
        <button class="detail-tab ${this._detailTab === 'settings' ? 'active' : ''}" @click=${() => { this._detailTab = 'settings'; }}>
          <ha-icon icon="mdi:tune"></ha-icon>
          Settings
        </button>
      </div>

      ${this._detailTab === 'automations' ? html`
        <shs-automations-page
          .hass=${this.hass}
          .deviceId=${device.id}
          .deviceName=${device.name}
          .productType=${device.product_type || ''}
          @open-device-settings=${() => { this._detailTab = 'settings'; }}
        ></shs-automations-page>
      ` : this._detailTab === 'settings' ? html`
        <shs-settings-page .hass=${this.hass} .selectedDeviceId=${device.id} embedded></shs-settings-page>
      ` : offline ? html`
        <div class="insight-card offline-detail-card">
          <ha-icon icon="mdi:lan-disconnect"></ha-icon>
          <div style="flex: 1; min-width: 0;">
            <div class="offline-detail-title">Device is offline</div>
            <div class="offline-detail-sub">
              Live insights resume automatically when it reconnects.
              ${lastSeen ? html`Last seen ${this._relativeTime(lastSeen)}. ` : nothing}
              Check the power supply and Wi-Fi connection.
            </div>
          </div>
          <a class="designer-btn" style="text-decoration: none; flex-shrink: 0;" href="/config/devices/device/${device.id}">
            <ha-icon icon="mdi:open-in-new" style="--mdc-icon-size: 16px;"></ha-icon>
            Open device
          </a>
        </div>
        ${config.category === 'sensor' ? html`
          <div class="insight-card" style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--primary-text-color);">Room Designer</div>
              <div style="font-size: 12.5px; color: var(--secondary-text-color); margin-top: 2px;">Draw the room, place sensors and configure zones and entry lines for this device.</div>
            </div>
            <button class="designer-btn" @click=${() => this.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'zones' } }))}>
              <ha-icon icon="mdi:floor-plan" style="--mdc-icon-size: 16px;"></ha-icon>
              Open
            </button>
          </div>
        ` : nothing}
      ` : html`

      ${water ? html`
        <div class="section-heading"><ha-icon icon="mdi:water" style="color: #0096c7;"></ha-icon>Water</div>
        <div class="chips-row">
          <div class="chip-card">
            <div class="chip-label">Flow now</div>
            <div class="chip-value ${water.flow_rate > 0.2 ? 'good' : ''}">${(water.flow_rate ?? 0).toFixed(1)} <span class="unit">L/min</span></div>
          </div>
          <div class="chip-card">
            <div class="chip-label">Today</div>
            <div class="chip-value">${Math.round(water.today_usage ?? 0)} <span class="unit">L</span></div>
          </div>
          ${water.water_cost_today != null ? html`
            <div class="chip-card">
              <div class="chip-label">Cost today</div>
              <div class="chip-value">€ ${water.water_cost_today.toFixed(2)}</div>
            </div>
          ` : nothing}
          ${water.usage_vs_average != null ? html`
            <div class="chip-card">
              <div class="chip-label">vs 7-day average</div>
              <div class="chip-value ${water.usage_vs_average > 25 ? 'warn' : water.usage_vs_average < 0 ? 'good' : ''}">${water.usage_vs_average > 0 ? '+' : ''}${water.usage_vs_average} <span class="unit">%</span></div>
            </div>
          ` : nothing}
        </div>

        <div class="insight-card">
          <div class="insight-title">
            Live flow <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color);">last 20 min</span>
          </div>
          ${this._renderLineChart(water.flow_history, water.flow_rate ?? 0, '#0096c7', 'L/min', 1)}
        </div>

        <div class="detail-grid">
          <div class="insight-card">
            <div class="insight-title">
              Leak detection
              ${leak?.is_leak_likely
                ? html`<span class="insight-badge alert">Possible leak</span>`
                : html`<span class="insight-badge ok">No leak</span>`}
            </div>
            ${leak ? html`
              ${[
                ['Continuous flow', leak.continuous_flow_score],
                ['Night usage', leak.night_usage_score],
                ['Micro leak', leak.micro_leak_score],
                ['Pattern anomaly', leak.pattern_anomaly_score],
              ].map(([label, score]) => html`
                <div class="score-row">
                  <span class="score-label">${label}</span>
                  <div class="score-track"><div class="score-fill ${this._scoreClass(Number(score))}" style="width: ${Math.min(100, Number(score))}%"></div></div>
                  <span class="score-value">${Math.round(Number(score))}</span>
                </div>
              `)}
              <div class="score-row" style="margin-top: 10px;">
                <span class="score-label" style="font-weight: 600; color: var(--primary-text-color);">Total score</span>
                <div class="score-track"><div class="score-fill ${this._scoreClass(leak.total_score)}" style="width: ${Math.min(100, leak.total_score)}%"></div></div>
                <span class="score-value">${Math.round(leak.total_score)}/100</span>
              </div>
              <div class="leak-footnote">
                Each signal scores 0-100: how strongly the current water usage matches that
                leak pattern. Occasional spikes are normal - the alarm only triggers when
                the total score stays above <b>60</b>.
              </div>
            ` : html`<div class="spark-empty">No leak data yet</div>`}
          </div>

          <div class="insight-card">
            <div class="insight-title">
              Baseline learning
              ${baseline?.is_ready
                ? html`<span class="insight-badge ok">Ready</span>`
                : html`<span class="insight-badge" style="background: rgba(67, 97, 238, 0.12); color: #4361ee;">Learning</span>`}
            </div>
            ${baseline ? html`
              <div class="score-row">
                <span class="score-label">Days learned</span>
                <div class="score-track"><div class="score-fill" style="width: ${Math.min(100, (baseline.learning_days / Math.max(1, baseline.min_days_required)) * 100)}%"></div></div>
                <span class="score-value">${baseline.learning_days}/${baseline.min_days_required}</span>
              </div>
              <div class="session-row"><ha-icon icon="mdi:water"></ha-icon><span class="session-name">Average daily usage</span><span class="session-meta">${Math.round(baseline.avg_daily_usage_liters ?? 0)} L</span></div>
            ` : html`<div class="spark-empty">No baseline data yet</div>`}
          </div>
        </div>

        <div class="insight-card">
          <div class="insight-title">
            Meter reading
            ${water.meter_initial_entity ? html`
              <button class="meter-set-btn" @click=${this._toggleMeterForm}>
                <ha-icon icon="mdi:pencil" style="--mdc-icon-size: 14px;"></ha-icon>
                ${this._showMeterForm ? 'Cancel' : 'Set reading'}
              </button>
            ` : nothing}
          </div>
          <div class="meter-reading-value">
            ${(water.meter_total ?? 0).toFixed(3)} <span class="unit">m³</span>
          </div>
          ${!water.meter_initial_entity ? html`
            <div class="meter-form-help" style="margin-top: 8px;">
              Setting the meter reading is done on the device itself and requires
              the latest firmware. Update the firmware of your kit (via
              <b>Settings → Devices &amp; Services → ESPHome</b> or the update entity),
              then the <b>Set reading</b> button appears here.
            </div>
          ` : nothing}
          ${this._showMeterForm ? html`
            <div class="meter-form">
              <div class="meter-form-help">
                Enter the reading shown on your physical water meter (in m³, e.g. 123.456).
                It is stored on the device itself and the meter keeps counting from there -
                you only need to do this once, or when the values drift apart.
              </div>
              <div class="meter-form-row">
                <input
                  type="number"
                  inputmode="decimal"
                  step="0.001"
                  min="0"
                  placeholder="123.456"
                  .value=${this._meterInput}
                  @input=${(e: Event) => { this._meterInput = (e.target as HTMLInputElement).value; }}
                />
                <span class="meter-form-unit">m³</span>
                <button class="meter-form-save" ?disabled=${!this._meterInputValid()} @click=${() => this._saveMeterReading(water.meter_initial_entity)}>
                  Save
                </button>
              </div>
            </div>
          ` : nothing}
        </div>

        ${(water.recent_sessions || []).length > 0 ? html`
          <div class="insight-card">
            <div class="insight-title">Recent water sessions</div>
            ${water.recent_sessions.map((session: any) => html`
              <div class="session-row">
                <ha-icon icon="mdi:water"></ha-icon>
                <span class="session-name">${this._fmtTime(session.ended)}</span>
                <span class="session-meta">${session.liters} L · ${session.duration_min} min</span>
              </div>
            `)}
          </div>
        ` : nothing}
      ` : nothing}

      ${energy ? html`
        <div class="section-heading"><ha-icon icon="mdi:flash" style="color: #f59e0b;"></ha-icon>Energy</div>
        <div class="chips-row">
          ${energy.power_w != null ? html`
            <div class="chip-card">
              <div class="chip-label">Power now</div>
              <div class="chip-value">${Math.round(energy.power_w)} <span class="unit">W</span></div>
            </div>
          ` : nothing}
          ${energy.cost_today != null ? html`
            <div class="chip-card">
              <div class="chip-label">Energy cost today</div>
              <div class="chip-value">€ ${energy.cost_today.toFixed(2)}</div>
            </div>
          ` : nothing}
          ${energy.cost_month != null ? html`
            <div class="chip-card">
              <div class="chip-label">This month</div>
              <div class="chip-value">€ ${energy.cost_month.toFixed(2)}</div>
            </div>
          ` : nothing}
          ${energy.month_peak_kw != null ? html`
            <div class="chip-card">
              <div class="chip-label">Month peak</div>
              <div class="chip-value">${energy.month_peak_kw.toFixed(2)} <span class="unit">kW</span></div>
            </div>
          ` : nothing}
        </div>

        <div class="insight-card">
          <div class="insight-title">
            Live power <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color);">last 20 min</span>
          </div>
          ${this._renderLineChart(energy.power_history, energy.power_w ?? 0, '#f59e0b', 'W', 0)}
        </div>

        <div class="detail-grid">
          <div class="insight-card">
            <div class="insight-title">Standby power</div>
            ${energy.standby_w != null ? html`
              <div class="session-row"><ha-icon icon="mdi:power-sleep"></ha-icon><span class="session-name">Always-on usage</span><span class="session-meta">${energy.standby_w} W</span></div>
              ${energy.standby_cost_year != null ? html`
                <div class="session-row"><ha-icon icon="mdi:currency-eur"></ha-icon><span class="session-name">Estimated cost per year</span><span class="session-meta">€ ${Math.round(energy.standby_cost_year)}</span></div>
              ` : nothing}
            ` : html`<div class="spark-empty">Measured tonight between 02:00 and 05:00</div>`}
          </div>

          <div class="insight-card">
            <div class="insight-title">Phase load</div>
            ${energy.phase_currents && Object.keys(energy.phase_currents).length > 0 ? html`
              ${Object.entries(energy.phase_currents).map(([phase, amps]) => html`
                <div class="score-row">
                  <span class="score-label">${phase}</span>
                  <div class="score-track"><div class="score-fill ${Number(amps) > 20 ? 'warn' : ''}" style="width: ${Math.min(100, (Number(amps) / 25) * 100)}%"></div></div>
                  <span class="score-value">${Number(amps).toFixed(1)}A</span>
                </div>
              `)}
              ${energy.phase_max_load_pct != null ? html`
                <div class="session-row" style="margin-top: 8px;"><ha-icon icon="mdi:speedometer"></ha-icon><span class="session-name">Highest load vs main fuse</span><span class="session-meta">${energy.phase_max_load_pct}%</span></div>
              ` : nothing}
            ` : html`<div class="spark-empty">No phase data available</div>`}
          </div>
        </div>
      ` : nothing}

      ${ins?.flows ? Object.entries(ins.flows).map(([line, vals]: [string, any], i: number) => {
        const lineLeak = vals.leak_score;
        return html`
          <div class="section-heading"><ha-icon icon="mdi:water" style="color: #0096c7;"></ha-icon>Water line ${i + 1}</div>
          <div class="chips-row">
            <div class="chip-card">
              <div class="chip-label">Flow now</div>
              <div class="chip-value ${Number(vals.flow_rate) > 0.2 ? 'good' : ''}">${vals.flow_rate != null ? Number(vals.flow_rate).toFixed(1) : '-'} <span class="unit">L/min</span></div>
            </div>
            ${vals.today_usage != null ? html`
              <div class="chip-card">
                <div class="chip-label">Today</div>
                <div class="chip-value">${Math.round(vals.today_usage)} <span class="unit">L</span></div>
              </div>
            ` : nothing}
            <div class="chip-card">
              <div class="chip-label">Total</div>
              <div class="chip-value">${vals.total != null ? Number(vals.total).toFixed(2) : '-'} <span class="unit">m³</span></div>
            </div>
          </div>

          <div class="insight-card">
            <div class="insight-title">
              Live flow <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color);">last 20 min</span>
            </div>
            ${this._renderLineChart(vals.flow_history, vals.flow_rate ?? 0, '#0096c7', 'L/min', 1)}
          </div>

          <div class="detail-grid">
            <div class="insight-card">
              <div class="insight-title">
                Leak detection
                ${lineLeak?.is_leak_likely
                  ? html`<span class="insight-badge alert">Possible leak</span>`
                  : html`<span class="insight-badge ok">No leak</span>`}
              </div>
              ${lineLeak ? html`
                <div class="score-row">
                  <span class="score-label" style="font-weight: 600; color: var(--primary-text-color);">Total score</span>
                  <div class="score-track"><div class="score-fill ${this._scoreClass(lineLeak.total_score)}" style="width: ${Math.min(100, lineLeak.total_score)}%"></div></div>
                  <span class="score-value">${Math.round(lineLeak.total_score)}/100</span>
                </div>
                <div class="leak-footnote">
                  How strongly this line's usage matches a leak pattern right now -
                  the alarm only triggers above <b>60</b>.
                </div>
              ` : html`<div class="spark-empty">No leak data yet</div>`}
            </div>

            <div class="insight-card">
              <div class="insight-title">
                Baseline learning
                ${vals.baseline?.is_ready
                  ? html`<span class="insight-badge ok">Ready</span>`
                  : html`<span class="insight-badge" style="background: rgba(67, 97, 238, 0.12); color: #4361ee;">Learning</span>`}
              </div>
              ${vals.baseline ? html`
                <div class="score-row">
                  <span class="score-label">Days learned</span>
                  <div class="score-track"><div class="score-fill" style="width: ${Math.min(100, (vals.baseline.learning_days / Math.max(1, vals.baseline.min_days_required)) * 100)}%"></div></div>
                  <span class="score-value">${vals.baseline.learning_days}/${vals.baseline.min_days_required}</span>
                </div>
                ${vals.last_session ? html`
                  <div class="session-row"><ha-icon icon="mdi:water"></ha-icon><span class="session-name">Last session ${this._fmtTime(vals.last_session.ended)}</span><span class="session-meta">${vals.last_session.liters} L · ${vals.last_session.duration_min} min</span></div>
                ` : nothing}
              ` : html`<div class="spark-empty">No baseline data yet</div>`}
            </div>
          </div>
        `;
      }) : nothing}

      ${ins?.room ? html`
        <div class="detail-grid">
          <div class="insight-card">
            <div class="insight-title">
              Room quality
              <span class="status-badge" style="background: ${ins.room.color}22; color: ${ins.room.color};">${ins.room.label}</span>
            </div>
            <div class="room-score-big">
              <span class="room-score-num" style="color: ${ins.room.color};">${Number(ins.room.score).toFixed(1)}</span>
              <span class="session-meta">/ 10 · ${ins.room.score_percentage}%</span>
            </div>
            ${(ins.room.recommendations || []).length > 0
              ? ins.room.recommendations.map((reco: string) => html`
                  <div class="reco-row"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>${reco}</div>
                `)
              : html`
                  <div class="reco-row" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">
                    <ha-icon icon="mdi:check-circle" style="color: #22c55e;"></ha-icon>All values optimal
                  </div>
                `}
          </div>

          <div class="insight-card">
            <div class="insight-title">Climate breakdown</div>
            ${(ins.room.metrics || []).filter((metric: any) => metric.value != null).map((metric: any) => html`
              <div class="metric-row">
                <span class="metric-label">${metric.label}</span>
                <span class="metric-value">${Number(metric.value).toFixed(metric.key === 'temperature' ? 1 : 0)} ${metric.unit}</span>
                <span class="status-badge ${this._statusClass(metric.status)}">${metric.status}</span>
              </div>
            `)}
            ${ins.room.illuminance != null ? html`
              <div class="metric-row">
                <span class="metric-label">Illuminance</span>
                <span class="metric-value">${Math.round(ins.room.illuminance)} lx</span>
                <span class="status-badge"></span>
              </div>
            ` : nothing}
          </div>
        </div>
      ` : nothing}

      ${ins?.radar ? html`
        <div class="chips-row">
          ${ins.radar.presence !== undefined ? html`
            <div class="chip-card">
              <div class="chip-label">Presence</div>
              <div class="chip-value ${ins.radar.presence ? 'good' : ''}">${ins.radar.presence ? 'Detected' : 'Clear'}</div>
            </div>
          ` : nothing}
          ${ins.radar.target_count != null ? html`
            <div class="chip-card">
              <div class="chip-label">Targets</div>
              <div class="chip-value">${Math.round(ins.radar.target_count)}</div>
            </div>
          ` : nothing}
          ${ins.radar.people_count != null ? html`
            <div class="chip-card">
              <div class="chip-label">People count</div>
              <div class="chip-value">${Math.round(ins.radar.people_count)}</div>
            </div>
          ` : nothing}
          ${ins.radar.last_crossing && ins.radar.last_crossing !== 'none' ? html`
            <div class="chip-card">
              <div class="chip-label">Last crossing</div>
              <div class="chip-value ${ins.radar.last_crossing === 'in' ? 'good' : ''}">${ins.radar.last_crossing === 'in' ? 'In' : 'Out'}</div>
            </div>
          ` : nothing}
        </div>

        ${(ins.radar.zones || []).length > 0 ? html`
          <div class="insight-card">
            <div class="insight-title">LD2450 zones</div>
            ${ins.radar.zones.map((zone: any) => {
              const counts = [
                zone.target_count != null ? `${Math.round(zone.target_count)} total` : '',
                zone.still_target_count != null ? `${Math.round(zone.still_target_count)} still` : '',
                zone.moving_target_count != null ? `${Math.round(zone.moving_target_count)} moving` : '',
              ].filter(Boolean).join(' / ');
              return html`
                <div class="metric-row">
                  <span class="metric-label">Zone ${zone.zone}</span>
                  <span class="metric-value">${counts}</span>
                  <span class="status-badge ${zone.occupied ? 'ok' : ''}">${zone.occupied ? 'Occupied' : 'Empty'}</span>
                </div>
              `;
            })}
          </div>
        ` : nothing}

        <div class="insight-card" style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: var(--primary-text-color);">Room Designer</div>
            <div style="font-size: 12.5px; color: var(--secondary-text-color); margin-top: 2px;">Draw the room, place sensors and configure zones and entry lines for this device.</div>
          </div>
          <button class="designer-btn" @click=${() => this.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'zones' } }))}>
            <ha-icon icon="mdi:floor-plan" style="--mdc-icon-size: 16px;"></ha-icon>
            Open
          </button>
        </div>
      ` : nothing}

      ${!water && !energy && !ins?.room && !ins?.radar && !(ins?.flows && Object.keys(ins.flows).length > 0) && ins && ins.configured !== false ? html`
        <div class="insight-card">
          <div class="insight-title">Live values</div>
          ${this._renderDeviceSensors(device)}
        </div>
      ` : nothing}
      `}
    `;
  }

  private _getProductConfig(productType?: string) {
    return PRODUCT_CONFIG[productType || ''] || {
      icon: 'mdi:devices',
      category: 'other',
      color: '#4361ee'
    };
  }

  private _integrationFeatures(productType?: string): string {
    switch (productType) {
      case 'waterp1meterkit':
        return 'water monitoring, leak detection, energy costs and insights';
      case 'watermeterkit':
      case 'waterflowkit':
        return 'water monitoring, leak detection and usage insights';
      case 'p1meterkit':
        return 'energy monitoring, dynamic tariffs, costs and smart schedules';
      case 'ultimatesensor':
      case 'ultimatesensor_mini':
      case 'ceilsense':
        return 'device insights and automations';
      default:
        return 'product insights and automations';
    }
  }

  // Entities that share a word with a measurement but do not measure the
  // room: configuration numbers (offsets, calibration) and the board's own
  // diagnostics, where "CPU temperature" would be read as room temperature.
  private static readonly NON_MEASUREMENT_WORDS = [
    'offset', 'calibrat', 'cpu', 'esp32', 'chip_temp', 'internal_temp', 'board_temp',
  ];

  private _getSensorEntity(entities: DeviceEntity[] | undefined, patterns: string[]): DeviceEntity | undefined {
    if (!entities) return undefined;
    const candidates = entities
      .filter(e =>
        (e.entity_id.startsWith('sensor.') || e.entity_id.startsWith('binary_sensor.')) &&
        !DashboardPage.NON_MEASUREMENT_WORDS.some(word => e.entity_id.toLowerCase().includes(word))
      )
      // Sorted so the choice never depends on entity-registry order, with
      // numeric sensors ahead of binary ones: a value tile must not fall
      // back to an on/off entity while a measurement exists.
      .sort((a, b) => {
        const rank = (id: string) => (id.startsWith('sensor.') ? 0 : 1);
        return rank(a.entity_id) - rank(b.entity_id) || a.entity_id.localeCompare(b.entity_id);
      });
    // Patterns are tried in order, so callers put the specific sensor chip
    // (scd41_temperature) before the generic name (temperature).
    for (const pattern of patterns) {
      const pat = pattern.toLowerCase();
      const exact = candidates.find(e => e.entity_id.toLowerCase().endsWith(`_${pat}`));
      if (exact) return exact;
    }
    for (const pattern of patterns) {
      const pat = pattern.toLowerCase();
      const partial = candidates.find(e => e.entity_id.toLowerCase().includes(pat));
      if (partial) return partial;
    }
    return undefined;
  }

  private _getSensorValue(entities: DeviceEntity[] | undefined, pattern: string | string[]): string | null {
    const entity = this._getSensorEntity(entities, Array.isArray(pattern) ? pattern : [pattern]);
    if (!entity || !entity.state || entity.state === 'unavailable' || entity.state === 'unknown') return null;
    return entity.state;
  }

  private _getSensorNumber(entities: DeviceEntity[] | undefined, patterns: string[]): number | null {
    const entity = this._getSensorEntity(entities, patterns);
    if (!entity || !entity.state || entity.state === 'unavailable' || entity.state === 'unknown') return null;
    const value = Number(entity.state);
    return Number.isFinite(value) ? value : null;
  }

  private _getPowerWatts(entities: DeviceEntity[] | undefined, patterns: string[]): number | null {
    const entity = this._getSensorEntity(entities, patterns);
    if (!entity || !entity.state || entity.state === 'unavailable' || entity.state === 'unknown') return null;
    const value = Number(entity.state);
    if (!Number.isFinite(value)) return null;
    const unit = String(entity.attributes?.unit_of_measurement || '').toLowerCase();
    if (unit === 'mw') return value * 1000000;
    if (unit === 'kw') return value * 1000;
    return value;
  }

  private _formatPowerMetric(watts: number | null): string {
    if (watts === null) return '-';
    const value = Math.abs(watts);
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)} kW`;
    return `${Math.round(value)} W`;
  }

  private _formatEnergyMetric(kwh: number | null): string {
    if (kwh === null) return '-';
    const decimals = Math.abs(kwh) >= 100 ? 0 : Math.abs(kwh) >= 10 ? 1 : 2;
    return `${kwh.toFixed(decimals)} kWh`;
  }

  private _sumAvailable(values: Array<number | null>): number | null {
    const available = values.filter((value): value is number => value !== null);
    return available.length ? available.reduce((total, value) => total + value, 0) : null;
  }

  private _formatValue(value: string | null, unit: string, decimals = 1): string {
    if (value === null) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${num.toFixed(decimals)}${unit}`;
  }

  private _renderDeviceSensors(device: DeviceWithEntities) {
    const config = this._getProductConfig(device.product_type);
    const entities = device.entities || [];

    if (device.product_type === 'waterp1meterkit') {
      const flow = this._getSensorValue(entities, [
        'current_water_usage_cc', 'water_current_usage', 'current_flow_rate', 'flow_rate',
      ]);
      const waterToday = this._getSensorValue(entities, [
        'usage_today_cc', 'water_daily_cc', 'today_usage', 'water_daily',
      ]);
      const netGrid = this._getPowerWatts(entities, ['net_grid_power_cc', 'net_grid_power']);
      const importedPower = this._getPowerWatts(entities, ['power_consumed']);
      const exportedPower = this._getPowerWatts(entities, ['power_produced']);
      const gridPower = netGrid ?? (importedPower === null && exportedPower === null
        ? null
        : (importedPower || 0) - (exportedPower || 0));
      const energyToday = this._sumAvailable([
        this._getSensorNumber(entities, ['energy_daily_t1_cc']),
        this._getSensorNumber(entities, ['energy_daily_t2_cc']),
      ]);
      const energyTotal = this._sumAvailable([
        this._getSensorNumber(entities, ['energy_consumed_tariff_1']),
        this._getSensorNumber(entities, ['energy_consumed_tariff_2']),
      ]);
      const shownEnergy = energyToday ?? energyTotal;

      return html`
        <div class="sensor-grid combined">
          <div class="sensor-item water-metric">
            <ha-icon class="sensor-icon" icon="mdi:water"></ha-icon>
            <span class="sensor-value">${this._formatValue(flow, ' L/m')}</span>
            <div class="sensor-label">Flow</div>
          </div>
          <div class="sensor-item water-metric">
            <ha-icon class="sensor-icon" icon="mdi:calendar-today"></ha-icon>
            <span class="sensor-value">${this._formatValue(waterToday, ' L', 0)}</span>
            <div class="sensor-label">Water today</div>
          </div>
          <div class="sensor-item energy-metric">
            <ha-icon class="sensor-icon" icon=${gridPower !== null && gridPower < 0 ? 'mdi:transmission-tower-export' : 'mdi:transmission-tower-import'}></ha-icon>
            <span class="sensor-value">${this._formatPowerMetric(gridPower)}</span>
            <div class="sensor-label">${gridPower !== null && gridPower < 0 ? 'Export now' : 'Import now'}</div>
          </div>
          <div class="sensor-item energy-metric">
            <ha-icon class="sensor-icon" icon="mdi:lightning-bolt"></ha-icon>
            <span class="sensor-value">${this._formatEnergyMetric(shownEnergy)}</span>
            <div class="sensor-label">${energyToday !== null ? 'Energy today' : 'Energy total'}</div>
          </div>
        </div>
      `;
    }

    if (config.category === 'water') {
      // Our own live-flow sensor first, then the firmware one; the generic
      // "flow" fallback also matches leak and duration entities.
      const flow = this._getSensorValue(entities, ['current_water_usage_cc', 'water_current_usage', 'flow_rate', 'flow']);
      const total = this._getSensorValue(entities, ['water_meter_total', 'water_total_consumption', 'total_consumption', 'total']);
      const daily = this._getSensorValue(entities, ['water_daily_cc', 'usage_today_cc', 'daily']);

      return html`
        <div class="sensor-grid">
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:water"></ha-icon>
            <span class="sensor-value">${this._formatValue(flow, ' L/m')}</span>
            <div class="sensor-label">Flow</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:counter"></ha-icon>
            <span class="sensor-value">${this._formatValue(total, ' L', 0)}</span>
            <div class="sensor-label">Total</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:calendar-today"></ha-icon>
            <span class="sensor-value">${this._formatValue(daily, ' L', 0)}</span>
            <div class="sensor-label">Today</div>
          </div>
        </div>
      `;
    }

    if (config.category === 'sensor') {
      // Climate sensor first: our devices also expose board diagnostics and
      // other chips whose entity ids end in the same word.
      const temp = this._getSensorValue(entities, [
        'scd41_temperature', 'scd4x_temperature', 'sht4x_temperature', 'bme280_temperature', 'temperature',
      ]);
      const humidity = this._getSensorValue(entities, [
        'scd41_humidity', 'scd4x_humidity', 'sht4x_humidity', 'bme280_humidity', 'humidity',
      ]);
      const co2 = this._getSensorValue(entities, ['scd41_co2', 'scd4x_co2', 'co2']);
      const illuminance = this._getSensorValue(entities, ['bh1750_illuminance', 'illuminance', 'lux']);
      const presence = this._getSensorValue(entities, 'presence') || this._getSensorValue(entities, 'occupancy');

      const sensors: { icon: string; value: string; label: string }[] = [];
      if (temp) sensors.push({ icon: 'mdi:thermometer', value: this._formatValue(temp, '°C'), label: 'Temp' });
      if (humidity) sensors.push({ icon: 'mdi:water-percent', value: this._formatValue(humidity, '%', 0), label: 'Humidity' });
      if (co2) sensors.push({ icon: 'mdi:molecule-co2', value: this._formatValue(co2, ' ppm', 0), label: 'CO₂' });
      if (illuminance) sensors.push({ icon: 'mdi:brightness-6', value: this._formatValue(illuminance, ' lx', 0), label: 'Light' });
      if (presence) sensors.push({ icon: 'mdi:motion-sensor', value: presence === 'on' ? 'Yes' : 'No', label: 'Motion' });

      const displaySensors = sensors.slice(0, 3);
      if (displaySensors.length === 0) {
        return html`
          <div class="sensor-grid">
            <div class="sensor-item" style="grid-column: span 3;">
              <span class="sensor-value">${device.entity_count}</span>
              <div class="sensor-label">Entities</div>
            </div>
          </div>
        `;
      }

      return html`
        <div class="sensor-grid">
          ${displaySensors.map(s => html`
            <div class="sensor-item">
              <ha-icon class="sensor-icon" icon="${s.icon}"></ha-icon>
              <span class="sensor-value">${s.value}</span>
              <div class="sensor-label">${s.label}</div>
            </div>
          `)}
        </div>
      `;
    }

    if (config.category === 'energy') {
      // Named entities first: a meter exposes several ids containing "power"
      // (fuse headroom, standby, per phase) and "energy" (a Luxembourg-only
      // DSMR field), which must not win from the actual consumption.
      const power = this._getSensorValue(entities, ['power_consumed', 'net_grid_power_cc', 'power']);
      const energy = this._getSensorValue(entities, ['energy_consumed_tariff_1', 'energy_consumed', 'energy'])
        || this._getSensorValue(entities, ['water_total_consumption', 'total_consumption', 'total']);
      const voltage = this._getSensorValue(entities, ['voltage_phase_1', 'voltage']);

      return html`
        <div class="sensor-grid">
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:flash"></ha-icon>
            <span class="sensor-value">${this._formatValue(power, ' W', 0)}</span>
            <div class="sensor-label">Power</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:lightning-bolt"></ha-icon>
            <span class="sensor-value">${this._formatValue(energy, ' kWh')}</span>
            <div class="sensor-label">Energy</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:sine-wave"></ha-icon>
            <span class="sensor-value">${this._formatValue(voltage, ' V', 0)}</span>
            <div class="sensor-label">Voltage</div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="sensor-grid">
        <div class="sensor-item" style="grid-column: span 3;">
          <span class="sensor-value">${device.entity_count}</span>
          <div class="sensor-label">Entities</div>
        </div>
      </div>
    `;
  }

  protected render() {
    if (this._loading) {
      return html`
        <div class="loading">
          <ha-circular-progress active></ha-circular-progress>
          <span class="loading-text">Loading devices...</span>
        </div>
      `;
    }

    if (this._detailDevice) {
      return this._renderDetail();
    }

    return html`
      ${this._devices.length === 0 ? html`
        <div class="empty-state">
          <ha-icon icon="mdi:package-variant"></ha-icon>
          <h3>No SmartHomeShop devices found</h3>
          <p>Connect your SmartHomeShop.io devices via ESPHome, then add this integration via Settings → Devices & Services</p>
        </div>
      ` : html`
        <!-- Devices Section -->
        <div class="section-header">
          <h2 class="section-title">
            Devices
            <span class="section-count">${this._devices.length}</span>
          </h2>
          <a href="https://smarthomeshop.io" target="_blank" rel="noopener" class="shop-link">
            smarthomeshop.io
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
        </div>

        <div class="devices-grid">
          ${this._devices.map(device => {
            const config = this._getProductConfig(device.product_type);
            return html`
              <div
                class="device-card ${this.selectedDeviceId === device.id ? 'selected' : ''} ${device.online === false ? 'offline' : ''}"
                @click=${() => { this._selectDevice(device); this._openDetail(device); }}
              >
                <div class="device-header">
                  <div class="device-icon" style="background: ${config.color}1f; color: ${config.color}">
                    <ha-icon icon="${config.icon}"></ha-icon>
                  </div>
                  <div class="device-info">
                    <h3 class="device-name">${device.name}</h3>
                    <div class="device-type">
                      <span class="device-type-badge ${config.category}">${config.category}</span>
                      ${device.product_type === 'waterp1meterkit' ? html`
                        <span class="device-type-badge energy">energy</span>
                      ` : nothing}
                      ${device.product_name || 'Unknown'}
                    </div>
                  </div>
                  ${device.online === false ? html`
                    <div style="text-align: right;">
                      <span class="offline-badge">Offline</span>
                      ${device.last_seen ? html`
                        <div class="last-seen" title=${new Date(device.last_seen).toLocaleString()}>
                          ${this._relativeTime(device.last_seen)}
                        </div>
                      ` : nothing}
                    </div>
                  ` : html`<span class="online-dot" title="Online"></span>`}
                </div>
                ${this._renderDeviceSensors(device)}
              </div>
            `;
          })}
        </div>
      `}

      <!-- Tools -->
      <div class="section-header">
        <h2 class="section-title">Tools</h2>
      </div>
      <div class="tools-list">
        <button class="tool-row" @click=${() => this._navigateTo('zones')}>
          <span class="tool-icon"><ha-icon icon="mdi:floor-plan"></ha-icon></span>
          <span class="tool-text">
            <span class="tool-title">Room Designer</span>
            <p class="tool-desc">Draw your room, place sensors and configure zones and entry lines</p>
          </span>
          <ha-icon class="tool-chevron" icon="mdi:chevron-right"></ha-icon>
        </button>
      </div>
    `;
  }

}
