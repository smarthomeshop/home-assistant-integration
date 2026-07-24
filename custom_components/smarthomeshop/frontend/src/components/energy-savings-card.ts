import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import {
  EnergyCardBase,
  energyCardStyles,
  formatEuro,
  type BaseEnergyCardConfig,
} from './energy-card-common';
import { energyText } from '../utils/energy-translations';
import './energy-card-editor';

export interface EnergySavingsCardConfig extends BaseEnergyCardConfig {
  show_breakdown?: boolean;
  show_explanation?: boolean;
}

const DEFAULTS: Required<Omit<EnergySavingsCardConfig, 'type' | 'title'>> = {
  show_header: true,
  show_breakdown: true,
  show_explanation: true,
};

@customElement('smarthomeshop-energy-savings-card')
export class SmartHomeShopEnergySavingsCard extends EnergyCardBase<EnergySavingsCardConfig> {
  protected config: EnergySavingsCardConfig = { ...DEFAULTS };

  static styles = [
    energyCardStyles,
    css`
      .hero {
        display: grid;
        grid-template-columns: minmax(160px, .82fr) minmax(240px, 1.18fr);
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--shs-line);
        border-radius: 14px;
        background: var(--shs-line);
      }
      .today {
        min-height: 154px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: linear-gradient(145deg, var(--shs-green-soft), var(--card-background-color));
      }
      .eyebrow {
        color: var(--secondary-text-color);
        font-size: 10px;
        font-weight: 720;
        letter-spacing: .65px;
        text-transform: uppercase;
      }
      .today-value {
        margin-top: 8px;
        font-size: clamp(31px, 8cqi, 44px);
        font-weight: 760;
        letter-spacing: -.025em;
        line-height: 1;
      }
      .positive { color: var(--shs-green); }
      .negative { color: var(--shs-red); }
      .today-caption {
        margin-top: 10px;
        color: var(--secondary-text-color);
        font-size: 11px;
        line-height: 1.4;
      }
      .periods {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        background: var(--card-background-color);
      }
      .period {
        min-width: 0;
        padding: 20px 18px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .period + .period { border-left: 1px solid var(--shs-line); }
      .period-value {
        margin-top: 7px;
        font-size: 23px;
        font-weight: 740;
        letter-spacing: -.015em;
      }
      .period-caption {
        margin-top: 5px;
        color: var(--secondary-text-color);
        font-size: 10.5px;
        line-height: 1.35;
      }
      .breakdown {
        margin-top: 13px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
      }
      .contributor {
        padding: 11px 12px;
        display: grid;
        grid-template-columns: 31px minmax(0, 1fr) auto;
        align-items: center;
        gap: 9px;
        border-radius: 11px;
        background: var(--shs-surface);
      }
      .contributor-icon {
        width: 31px;
        height: 31px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        color: var(--shs-blue);
        background: var(--shs-blue-soft);
      }
      .contributor-icon.schedule { color: var(--shs-amber); background: var(--shs-amber-soft); }
      .contributor-icon ha-icon { --mdc-icon-size: 17px; }
      .contributor-name { font-size: 11.5px; font-weight: 680; }
      .contributor-note { margin-top: 2px; color: var(--secondary-text-color); font-size: 9.5px; }
      .contributor-value { font-size: 13px; font-weight: 720; }
      .explanation {
        margin: 13px 1px 0;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        color: var(--secondary-text-color);
        font-size: 10.5px;
        line-height: 1.45;
      }
      .explanation ha-icon {
        --mdc-icon-size: 15px;
        flex: 0 0 auto;
        margin-top: 1px;
        color: var(--shs-blue);
      }
      @container (max-width: 430px) {
        .hero { grid-template-columns: 1fr; }
        .today { min-height: 124px; }
        .periods { border-top: 1px solid var(--shs-line); }
        .period { padding: 15px; }
        .period-value { font-size: 20px; }
        .breakdown { grid-template-columns: 1fr; }
      }
    `,
  ];

  public setConfig(config: EnergySavingsCardConfig): void {
    this.config = { ...DEFAULTS, ...config };
  }

  public static getStubConfig(): EnergySavingsCardConfig {
    return { type: 'custom:smarthomeshop-energy-savings-card', ...DEFAULTS };
  }

  public static getConfigElement(): HTMLElement {
    const editor = document.createElement('smarthomeshop-energy-card-editor') as HTMLElement & {
      cardType?: string;
    };
    editor.cardType = 'savings';
    return editor;
  }

  public getCardSize(): number {
    return this.config.show_breakdown === false ? 3 : 4;
  }

  private _tone(value: number): string {
    return value > 0 ? 'positive' : value < 0 ? 'negative' : '';
  }

  protected render() {
    const t = (source: string, variables?: Record<string, string | number>) =>
      energyText(this.hass, source, variables);
    const header = this.renderHeader(
      t('Smart savings'),
      t('Measured value created by smart energy'),
      'mdi:piggy-bank-outline',
    );

    if (this.loading && !this.context) {
      return html`<ha-card><div class="loading" role="status" aria-live="polite"><div class="skeleton"></div><div>${t('Loading smart savings…')}</div></div></ha-card>`;
    }
    if (this.loadError && !this.context) {
      return html`<ha-card><div class="empty" role="alert"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><strong>${t('Smart savings unavailable')}</strong><span>${this.loadError}</span></div></ha-card>`;
    }
    if (this.context?.account?.status === 'no_contract') {
      const historical = Number(this.context.savings?.total_eur || 0);
      return html`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:piggy-bank-outline"></ha-icon>
            <strong>${t('Smart Savings is paused')}</strong>
            <span>${t('An active SmartHomeShop energy contract is needed to calculate savings.')}</span>
            ${historical !== 0
              ? html`<span>${t('Previously measured total: {value}', { value: formatEuro(historical) })}</span>`
              : nothing}
          </div>
        </ha-card>
      `;
    }

    const savings = this.context?.savings || {};
    const today = Number(savings.today_eur || 0);
    const month = Number(savings.month_eur || 0);
    const total = Number(savings.total_eur || 0);
    const battery = Number(savings.today_battery_eur || 0);
    const schedules = Number(savings.today_schedule_eur || 0);

    return html`
      <ha-card>
        <div class="card-shell">
          ${header ? html`
            <div class="card-head">
              <div class="head-main">
                <div class="head-icon"><ha-icon icon=${header.icon}></ha-icon></div>
                <div>
                  <h2 class="head-title">${header.title}</h2>
                  <div class="head-subtitle">${header.subtitle}</div>
                </div>
              </div>
            </div>
          ` : nothing}

          <div class="hero">
            <div class="today">
              <div class="eyebrow">${t('Today')}</div>
              <div class="today-value ${this._tone(today)}">${formatEuro(today)}</div>
              <div class="today-caption">
                ${today > 0
                  ? t('Saved compared with today’s average electricity price.')
                  : today < 0
                    ? t('Smart actions cost more than today’s average so far.')
                    : t('Smart actions have not created measured value yet today.')}
              </div>
            </div>
            <div class="periods">
              <div class="period">
                <div class="eyebrow">${t('This month')}</div>
                <div class="period-value ${this._tone(month)}">${formatEuro(month)}</div>
                <div class="period-caption">${t('Cumulative value this calendar month')}</div>
              </div>
              <div class="period">
                <div class="eyebrow">${t('All time')}</div>
                <div class="period-value ${this._tone(total)}">${formatEuro(total)}</div>
                <div class="period-caption">${t('Since Smart Savings started measuring')}</div>
              </div>
            </div>
          </div>

          ${this.config.show_breakdown !== false ? html`
            <div class="breakdown">
              <div class="contributor">
                <div class="contributor-icon"><ha-icon icon="mdi:home-battery-outline"></ha-icon></div>
                <div><div class="contributor-name">${t('Battery today')}</div><div class="contributor-note">${t('Charging and discharging')}</div></div>
                <div class="contributor-value ${this._tone(battery)}">${formatEuro(battery)}</div>
              </div>
              <div class="contributor">
                <div class="contributor-icon schedule"><ha-icon icon="mdi:calendar-clock-outline"></ha-icon></div>
                <div><div class="contributor-name">${t('Schedules today')}</div><div class="contributor-note">${t('Loads shifted in time')}</div></div>
                <div class="contributor-value ${this._tone(schedules)}">${formatEuro(schedules)}</div>
              </div>
            </div>
          ` : nothing}

          ${this.config.show_explanation !== false ? html`
            <div class="explanation">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              <span>${t('Measured every 15 minutes from battery flows and running schedules, valued against the day-average electricity price.')}</span>
            </div>
          ` : nothing}
        </div>
      </ha-card>
    `;
  }
}
