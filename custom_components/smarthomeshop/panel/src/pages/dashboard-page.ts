import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, SmartHomeShopDevice, DeviceEntity } from '../types';

interface DeviceWithEntities extends SmartHomeShopDevice {
  entities?: DeviceEntity[];
}

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

// Product categories with styling - Updated to match SmartHomeShop.io website
const PRODUCT_CONFIG: Record<string, { icon: string; gradient: string; category: string; color: string }> = {
  ultimatesensor: { icon: 'mdi:radar', gradient: 'linear-gradient(135deg, #4361ee, #3f37c9)', category: 'sensor', color: '#4361ee' },
  ultimatesensor_mini: { icon: 'mdi:radar', gradient: 'linear-gradient(135deg, #4361ee, #7209b7)', category: 'sensor', color: '#4361ee' },
  waterp1meterkit: { icon: 'mdi:water-pump', gradient: 'linear-gradient(135deg, #4cc9f0, #4361ee)', category: 'water', color: '#4cc9f0' },
  watermeterkit: { icon: 'mdi:water-circle', gradient: 'linear-gradient(135deg, #4cc9f0, #00b4d8)', category: 'water', color: '#4cc9f0' },
  waterflowkit: { icon: 'mdi:waves', gradient: 'linear-gradient(135deg, #00b4d8, #0096c7)', category: 'water', color: '#00b4d8' },
  p1meterkit: { icon: 'mdi:flash', gradient: 'linear-gradient(135deg, #f72585, #b5179e)', category: 'energy', color: '#f72585' },
  ceilsense: { icon: 'mdi:ceiling-light', gradient: 'linear-gradient(135deg, #7209b7, #560bad)', category: 'sensor', color: '#7209b7' },
};

@customElement('shs-dashboard-page')
export class DashboardPage extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public selectedDeviceId?: string;
  @state() private _devices: DeviceWithEntities[] = [];
  @state() private _loading = true;

  static styles = css`
    :host {
      display: block;
      --shs-blue: #4361ee;
      --shs-purple: #7209b7;
      --shs-cyan: #4cc9f0;
      --shs-pink: #f72585;
    }

    /* Hero Section - Matching SmartHomeShop.io style */
    .hero {
      background: linear-gradient(135deg, #4361ee 0%, #3f37c9 50%, #4cc9f0 100%);
      border-radius: 24px;
      padding: 40px;
      margin-bottom: 32px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 60%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 50%;
      height: 150%;
      background: radial-gradient(circle, rgba(76, 201, 240, 0.2) 0%, transparent 60%);
      pointer-events: none;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 40px;
      align-items: center;
    }

    .hero-text h1 {
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }

    .hero-text p {
      font-size: 16px;
      opacity: 0.9;
      margin: 0;
      max-width: 500px;
      line-height: 1.6;
    }

    .hero-stats {
      display: flex;
      gap: 16px;
    }

    .hero-stat {
      text-align: center;
      background: rgba(255,255,255,0.15);
      padding: 20px 28px;
      border-radius: 16px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      min-width: 100px;
    }

    .hero-stat-value {
      font-size: 40px;
      font-weight: 700;
      display: block;
      line-height: 1;
    }

    .hero-stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      opacity: 0.85;
      margin-top: 8px;
      display: block;
    }

    .hero-logo {
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      width: 120px;
      height: 120px;
      opacity: 0.15;
      color: white;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
    }

    .section-title ha-icon {
      color: var(--shs-blue);
    }

    .section-badge {
      background: linear-gradient(135deg, #4361ee, #3f37c9);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }

    /* Device Grid */
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    /* Device Card */
    .device-card {
      background: var(--card-background-color);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border: 2px solid transparent;
    }

    .device-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 40px rgba(67, 97, 238, 0.2);
    }

    .device-card.selected {
      border-color: var(--shs-blue);
      box-shadow: 0 8px 30px rgba(67, 97, 238, 0.25);
    }

    .device-header {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .device-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .device-icon ha-icon {
      --mdc-icon-size: 30px;
    }

    .device-info {
      flex: 1;
      min-width: 0;
    }

    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0 0 6px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .device-type {
      font-size: 13px;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .device-type-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .device-type-badge.water {
      background: linear-gradient(135deg, rgba(76, 201, 240, 0.2), rgba(0, 180, 216, 0.2));
      color: #0096c7;
    }

    .device-type-badge.sensor {
      background: linear-gradient(135deg, rgba(67, 97, 238, 0.15), rgba(114, 9, 183, 0.15));
      color: #4361ee;
    }

    .device-type-badge.energy {
      background: linear-gradient(135deg, rgba(247, 37, 133, 0.15), rgba(181, 23, 158, 0.15));
      color: #f72585;
    }

    /* Sensor Data Grid */
    .sensor-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: var(--divider-color);
      border-top: 1px solid var(--divider-color);
    }

    .sensor-item {
      background: var(--card-background-color);
      padding: 18px 16px;
      text-align: center;
      transition: background 0.2s ease;
    }

    .sensor-item:hover {
      background: var(--secondary-background-color);
    }

    .sensor-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-text-color);
      display: block;
    }

    .sensor-label {
      font-size: 10px;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 6px;
    }

    .sensor-icon {
      --mdc-icon-size: 20px;
      color: var(--shs-blue);
      margin-bottom: 6px;
    }

    /* Quick Actions */
    .actions-section {
      margin-top: 40px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }

    .action-card {
      background: var(--card-background-color);
      border-radius: 20px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
      position: relative;
      overflow: hidden;
    }

    .action-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #4361ee, #4cc9f0);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(67, 97, 238, 0.15);
    }

    .action-card:hover::before {
      opacity: 1;
    }

    .action-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, #4361ee, #3f37c9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 16px;
      box-shadow: 0 6px 20px rgba(67, 97, 238, 0.35);
    }

    .action-icon ha-icon {
      --mdc-icon-size: 28px;
    }

    .action-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 0 0 6px 0;
    }

    .action-desc {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin: 0;
      line-height: 1.5;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 40px;
      background: var(--card-background-color);
      border-radius: 24px;
      border: 2px dashed var(--divider-color);
    }

    .empty-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(67, 97, 238, 0.1), rgba(76, 201, 240, 0.1));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .empty-icon ha-icon {
      --mdc-icon-size: 48px;
      color: var(--shs-blue);
    }

    .empty-state h3 {
      font-size: 22px;
      color: var(--primary-text-color);
      margin: 0 0 12px 0;
    }

    .empty-state p {
      color: var(--secondary-text-color);
      margin: 0;
      font-size: 15px;
    }

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
      font-size: 15px;
    }

    /* Website Link */
    .website-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: white;
      text-decoration: none;
      font-size: 13px;
      opacity: 0.9;
      margin-top: 16px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      transition: all 0.2s ease;
    }

    .website-link:hover {
      opacity: 1;
      background: rgba(255,255,255,0.25);
    }

    /* Responsive */
    @media (max-width: 900px) {
      .hero {
        padding: 32px;
      }
      .hero-content {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .hero-stats {
        justify-content: center;
      }
      .hero-text p {
        max-width: 100%;
      }
      .devices-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .hero-stats {
        flex-wrap: wrap;
      }
      .sensor-grid {
        grid-template-columns: repeat(2, 1fr);
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

  private _getProductConfig(productType?: string) {
    return PRODUCT_CONFIG[productType || ''] || {
      icon: 'mdi:devices',
      gradient: 'linear-gradient(135deg, #4361ee, #3f37c9)',
      category: 'other',
      color: '#4361ee'
    };
  }

  private _getSensorValue(entities: DeviceEntity[] | undefined, pattern: string): string | null {
    if (!entities) return null;
    const entity = entities.find(e => e.entity_id.toLowerCase().includes(pattern.toLowerCase()));
    if (!entity || !entity.state || entity.state === 'unavailable' || entity.state === 'unknown') return null;
    return entity.state;
  }

  private _formatValue(value: string | null, unit: string, decimals = 1): string {
    if (value === null) return '—';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${num.toFixed(decimals)}${unit}`;
  }

  private _renderDeviceSensors(device: DeviceWithEntities) {
    const config = this._getProductConfig(device.product_type);
    const entities = device.entities || [];

    if (config.category === 'water') {
      const flow = this._getSensorValue(entities, 'flow_rate') || this._getSensorValue(entities, 'flow');
      const total = this._getSensorValue(entities, 'total_consumption') || this._getSensorValue(entities, 'total');
      const daily = this._getSensorValue(entities, 'daily');

      return html`
        <div class="sensor-grid">
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:water" style="color: ${config.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(flow, ' L/m')}</span>
            <div class="sensor-label">Flow</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:counter" style="color: ${config.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(total, ' L', 0)}</span>
            <div class="sensor-label">Total</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:calendar-today" style="color: ${config.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(daily, ' L', 0)}</span>
            <div class="sensor-label">Today</div>
          </div>
        </div>
      `;
    }

    if (config.category === 'sensor') {
      const temp = this._getSensorValue(entities, 'temperature');
      const humidity = this._getSensorValue(entities, 'humidity');
      const co2 = this._getSensorValue(entities, 'co2');
      const illuminance = this._getSensorValue(entities, 'illuminance') || this._getSensorValue(entities, 'lux');
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
              <ha-icon class="sensor-icon" icon="${s.icon}" style="color: ${config.color}"></ha-icon>
              <span class="sensor-value">${s.value}</span>
              <div class="sensor-label">${s.label}</div>
            </div>
          `)}
        </div>
      `;
    }

    if (config.category === 'energy') {
      const power = this._getSensorValue(entities, 'power');
      const energy = this._getSensorValue(entities, 'energy') || this._getSensorValue(entities, 'total');
      const voltage = this._getSensorValue(entities, 'voltage');

      return html`
        <div class="sensor-grid">
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:flash" style="color: ${config.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(power, ' W', 0)}</span>
            <div class="sensor-label">Power</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:lightning-bolt" style="color: ${config.color}"></ha-icon>
            <span class="sensor-value">${this._formatValue(energy, ' kWh')}</span>
            <div class="sensor-label">Energy</div>
          </div>
          <div class="sensor-item">
            <ha-icon class="sensor-icon" icon="mdi:sine-wave" style="color: ${config.color}"></ha-icon>
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

  private _countByCategory(category: string): number {
    return this._devices.filter(d => this._getProductConfig(d.product_type).category === category).length;
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

    const waterCount = this._countByCategory('water');
    const sensorCount = this._countByCategory('sensor');
    const energyCount = this._countByCategory('energy');

    return html`
      <!-- Hero Section -->
      <div class="hero">
        <div class="hero-logo" .innerHTML=${SHS_LOGO_SVG}></div>
        <div class="hero-content">
          <div class="hero-text">
            <h1>SmartHomeShop Integration</h1>
            <p>Configure and monitor your SmartHomeShop.io devices directly in Home Assistant. Manage presence detection zones, room layouts, and device settings.</p>
            <a href="https://smarthomeshop.io" target="_blank" class="website-link">
              <ha-icon icon="mdi:open-in-new"></ha-icon>
              Shop more devices
            </a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value">${this._devices.length}</span>
              <span class="hero-stat-label">Devices</span>
            </div>
            ${waterCount > 0 ? html`
              <div class="hero-stat">
                <span class="hero-stat-value">${waterCount}</span>
                <span class="hero-stat-label">Water</span>
              </div>
            ` : nothing}
            ${sensorCount > 0 ? html`
              <div class="hero-stat">
                <span class="hero-stat-value">${sensorCount}</span>
                <span class="hero-stat-label">Sensors</span>
              </div>
            ` : nothing}
            ${energyCount > 0 ? html`
              <div class="hero-stat">
                <span class="hero-stat-value">${energyCount}</span>
                <span class="hero-stat-label">Energy</span>
              </div>
            ` : nothing}
          </div>
        </div>
      </div>

      ${this._devices.length === 0 ? html`
        <div class="empty-state">
          <div class="empty-icon">
            <ha-icon icon="mdi:package-variant"></ha-icon>
          </div>
          <h3>No SmartHomeShop devices found</h3>
          <p>Connect your SmartHomeShop.io devices via ESPHome, then add this integration via Settings → Devices & Services</p>
        </div>
      ` : html`
        <!-- Devices Section -->
        <div class="section-header">
          <h2 class="section-title">
            <ha-icon icon="mdi:devices"></ha-icon>
            Your Devices
          </h2>
          <span class="section-badge">${this._devices.length} device${this._devices.length !== 1 ? 's' : ''}</span>
        </div>

        <div class="devices-grid">
          ${this._devices.map(device => {
            const config = this._getProductConfig(device.product_type);
            return html`
              <div
                class="device-card ${this.selectedDeviceId === device.id ? 'selected' : ''}"
                @click=${() => this._selectDevice(device)}
              >
                <div class="device-header">
                  <div class="device-icon" style="background: ${config.gradient}">
                    <ha-icon icon="${config.icon}"></ha-icon>
                  </div>
                  <div class="device-info">
                    <h3 class="device-name">${device.name}</h3>
                    <div class="device-type">
                      <span class="device-type-badge ${config.category}">${config.category}</span>
                      ${device.product_name || 'Unknown'}
                    </div>
                  </div>
                </div>
                ${this._renderDeviceSensors(device)}
              </div>
            `;
          })}
        </div>
      `}

      <!-- Quick Actions -->
      <div class="actions-section">
        <div class="section-header">
          <h2 class="section-title">
            <ha-icon icon="mdi:lightning-bolt"></ha-icon>
            Quick Actions
          </h2>
        </div>

        <div class="actions-grid">
          <div class="action-card" @click=${() => this._navigateTo('room-builder')}>
            <div class="action-icon">
              <ha-icon icon="mdi:floor-plan"></ha-icon>
            </div>
            <h3 class="action-title">Room Builder</h3>
            <p class="action-desc">Draw your room layout for accurate mmWave positioning</p>
          </div>

          <div class="action-card" @click=${() => this._navigateTo('zones')}>
            <div class="action-icon" style="background: linear-gradient(135deg, #7209b7, #560bad)">
              <ha-icon icon="mdi:vector-polygon"></ha-icon>
            </div>
            <h3 class="action-title">Detection Zones</h3>
            <p class="action-desc">Define areas for presence and exclusion zones</p>
          </div>

          <div class="action-card" @click=${() => this._navigateTo('settings')}>
            <div class="action-icon" style="background: linear-gradient(135deg, #4cc9f0, #00b4d8)">
              <ha-icon icon="mdi:tune"></ha-icon>
            </div>
            <h3 class="action-title">Sensor Settings</h3>
            <p class="action-desc">Adjust sensitivity and radar parameters</p>
          </div>
        </div>
      </div>
    `;
  }
}
