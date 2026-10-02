import { css, html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import {
  EnergyCardBase,
  calculateDailyElectricityCost,
  energyCardStyles,
  formatEuro,
  formatPrice,
  loadPowerHistory,
  type BaseEnergyCardConfig,
  type HistoryPoint,
} from './energy-card-common';
import { energyText } from '../utils/energy-translations';
import './energy-card-editor';

export interface EnergyCostCardConfig extends BaseEnergyCardConfig {
  show_details?: boolean;
  show_prices?: boolean;
  show_explanation?: boolean;
  include_fixed_daily_cost?: boolean;
}

const DEFAULTS: Required<Omit<EnergyCostCardConfig, 'type' | 'title'>> = {
  show_header: true,
  show_details: true,
  show_prices: true,
  show_explanation: true,
  include_fixed_daily_cost: false,
};

export class SmartHomeShopEnergyCostCard extends EnergyCardBase<EnergyCostCardConfig> {
  protected config: EnergyCostCardConfig = { ...DEFAULTS };
  @state() private history: Record<string, HistoryPoint[]> = {};
  @state() private historyLoading = true;

  static styles = [
    energyCardStyles,
    css`
      .statement {
        min-height: 92px;
        padding: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        border: 1px solid var(--shs-line);
        border-radius: 13px 13px 0 0;
        background: var(--shs-surface);
      }
      .statement.cost { background: var(--shs-red-soft); }
      .statement.earned { background: var(--shs-green-soft); }
      .statement-label {
        color: var(--secondary-text-color);
        font-size: 10.5px;
        font-weight: 720;
        letter-spacing: .6px;
        text-transform: uppercase;
      }
      .statement-copy {
        margin-top: 5px;
        color: var(--secondary-text-color);
        font-size: 11px;
        line-height: 1.35;
      }
      .statement-value {
        flex: 0 0 auto;
        font-size: clamp(27px, 8cqi, 38px);
        font-weight: 770;
        line-height: 1;
        letter-spacing: -.025em;
        white-space: nowrap;
      }
      .statement.cost .statement-value { color: var(--shs-red); }
      .statement.earned .statement-value { color: var(--shs-green); }
      .flows {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        border: 1px solid var(--shs-line);
        border-top: 0;
        border-radius: 0 0 13px 13px;
        overflow: hidden;
      }
      .flows.with-fixed { border-radius: 0; }
      .flow {
        min-width: 0;
        padding: 15px 16px;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
      }
      .flow + .flow { border-left: 1px solid var(--shs-line); }
      .flow-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 9px;
      }
      .flow-icon.import { color: var(--shs-red); background: var(--shs-red-soft); }
      .flow-icon.export { color: var(--shs-green); background: var(--shs-green-soft); }
      .flow-icon ha-icon { --mdc-icon-size: 19px; }
      .flow-name { font-size: 12px; font-weight: 700; }
      .flow-energy {
        margin-top: 2px;
        color: var(--secondary-text-color);
        font-size: 10px;
        line-height: 1.35;
      }
      .flow-value {
        text-align: right;
        font-size: 16px;
        font-weight: 750;
        white-space: nowrap;
      }
      .flow-value.export { color: var(--shs-green); }
      .fixed-charge {
        min-height: 56px;
        padding: 10px 16px;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--shs-line);
        border-top: 0;
        border-radius: 0 0 13px 13px;
        background: color-mix(in srgb, var(--shs-blue) 4%, var(--shs-surface));
      }
      .fixed-charge .flow-icon {
        color: var(--shs-blue);
        background: color-mix(in srgb, var(--shs-blue) 11%, var(--shs-surface));
      }
      .note {
        margin: 11px 1px 0;
        display: flex;
        align-items: flex-start;
        gap: 7px;
        color: var(--secondary-text-color);
        font-size: 10px;
        line-height: 1.45;
      }
      .note ha-icon {
        --mdc-icon-size: 14px;
        flex: 0 0 auto;
        margin-top: 1px;
        color: var(--shs-blue);
      }
      .coverage {
        display: inline-flex;
        align-items: center;
        margin-left: 5px;
        padding: 2px 6px;
        border-radius: 999px;
        color: color-mix(in srgb, var(--shs-amber) 55%, var(--primary-text-color));
        background: var(--shs-amber-soft);
        font-size: 9px;
        font-weight: 720;
        vertical-align: 1px;
      }
      @container (max-width: 460px) {
        .statement {
          min-height: 86px;
          padding: 15px;
          align-items: flex-end;
        }
        .statement-value { font-size: 28px; }
        .flows { grid-template-columns: 1fr; }
        .flow + .flow {
          border-left: 0;
          border-top: 1px solid var(--shs-line);
        }
        .flow { padding: 14px; }
        .fixed-charge { padding: 12px 14px; }
      }
      @container (max-width: 300px) {
        .statement { display: block; }
        .statement-value { margin-top: 10px; }
        .flow { grid-template-columns: 31px minmax(0, 1fr); }
        .flow-value { grid-column: 2; text-align: left; margin-top: 2px; }
        .fixed-charge { grid-template-columns: 31px minmax(0, 1fr); }
        .fixed-charge .flow-value { grid-column: 2; }
      }
    `,
  ];

  public setConfig(config: EnergyCostCardConfig): void {
    if (!config) throw new Error('Energy costs card configuration is required.');
    this.config = { ...DEFAULTS, ...config };
  }

  public static getStubConfig(): EnergyCostCardConfig {
    return { type: 'custom:smarthomeshop-energy-cost-card', ...DEFAULTS };
  }

  public static getConfigElement(): HTMLElement {
    const editor = document.createElement('smarthomeshop-energy-card-editor') as HTMLElement & {
      cardType?: string;
    };
    editor.cardType = 'costs';
    return editor;
  }

  public getCardSize(): number {
    return this.config.show_details === false ? 2 : 3;
  }

  protected async afterContextLoaded(): Promise<void> {
    if (!this.hass || !this.context) return;
    this.historyLoading = true;
    try {
      this.history = await loadPowerHistory(this.hass, this.context);
    } finally {
      this.historyLoading = false;
    }
  }

  private _energy(value: number): string {
    return `${value.toFixed(value < 1 ? 3 : 2)} kWh`;
  }

  protected render() {
    const t = (source: string, variables?: Record<string, string | number>) =>
      energyText(this.hass, source, variables);
    const header = this.renderHeader(
      t('Electricity costs'),
      t('Imported, returned and net value today'),
      'mdi:cash-clock',
    );

    if ((this.loading || this.historyLoading) && !Object.keys(this.history).length) {
      return html`
        <ha-card>
          <div class="loading" role="status" aria-live="polite">
            <div class="skeleton"></div>
            <div>${t("Calculating today's electricity costs...")}</div>
          </div>
        </ha-card>
      `;
    }
    if (this.loadError && !this.context) {
      return html`
        <ha-card>
          <div class="empty" role="alert">
            <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
            <strong>${t('Electricity costs unavailable')}</strong>
            <span>${this.loadError}</span>
          </div>
        </ha-card>
      `;
    }
    if (this.context?.account?.status === 'no_contract') {
      return html`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:file-document-alert-outline"></ha-icon>
            <strong>${t('No active energy contract')}</strong>
            <span>${t("Connect an active SmartHomeShop contract to value today's imported and returned electricity.")}</span>
          </div>
        </ha-card>
      `;
    }
    if (!this.context?.netEntity
      && !this.context?.gridImportEntity
      && !this.context?.gridExportEntity) {
      return html`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:transmission-tower-off"></ha-icon>
            <strong>${t('No P1 meter selected')}</strong>
            <span>${t('Select a P1 meter in SmartHomeShop Energy settings first.')}</span>
          </div>
        </ha-card>
      `;
    }

    const cost = calculateDailyElectricityCost(this.hass!, this.context, this.history);
    if (!cost) {
      return html`
        <ha-card>
          <div class="empty" role="status">
            <ha-icon icon="mdi:chart-clock"></ha-icon>
            <strong>${t('Not enough history yet')}</strong>
            <span>${t("The card will calculate today's costs as soon as Recorder has grid power history.")}</span>
          </div>
        </ha-card>
      `;
    }

    const configuredFixedDailyCost = Number(this.context?.account?.fixed_costs?.daily);
    const includeFixedDailyCost = this.config.include_fixed_daily_cost === true
      && Number.isFinite(configuredFixedDailyCost);
    const fixedDailyCost = includeFixedDailyCost ? configuredFixedDailyCost : 0;
    const netCost = cost.netCost + fixedDailyCost;
    const earned = netCost < -.004;
    const spending = netCost > .004;
    const contractName = this.context?.account?.contract?.name || t('active contract');
    const coverage = Math.round(cost.coverage * 100);
    const partial = cost.coverage < .995;
    const importPrice = this.config.show_prices !== false && cost.averageImportPrice !== null
      ? ` · ${t('avg.')} ${formatPrice(cost.averageImportPrice)}/kWh`
      : '';
    const exportPrice = this.config.show_prices !== false && cost.averageExportPrice !== null
      ? ` · ${t('avg.')} ${formatPrice(cost.averageExportPrice)}/kWh`
      : '';

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

          <div class="statement ${earned ? 'earned' : spending ? 'cost' : ''}">
            <div>
              <div class="statement-label">${earned ? t('Net earned today') : t('Net electricity cost')}</div>
              <div class="statement-copy">
                ${earned
                  ? t('Return value is higher than import cost.')
                  : cost.exportValue > 0
                    ? t('{value} return value deducted', { value: formatEuro(cost.exportValue) })
                    : t('No measured return value deducted yet.')}
                ${partial ? html`<span class="coverage">${coverage}% ${t('priced')}</span>` : nothing}
              </div>
            </div>
            <div class="statement-value">${formatEuro(Math.abs(netCost))}</div>
          </div>

          ${this.config.show_details !== false ? html`
            <div class="flows ${includeFixedDailyCost ? 'with-fixed' : ''}">
              <div class="flow">
                <div class="flow-icon import"><ha-icon icon="mdi:transmission-tower-import"></ha-icon></div>
                <div>
                  <div class="flow-name">${t('Electricity imported')}</div>
                  <div class="flow-energy">${this._energy(cost.importedKwh)}${importPrice}</div>
                </div>
                <div class="flow-value">${formatEuro(cost.importCost)}</div>
              </div>
              <div class="flow">
                <div class="flow-icon export"><ha-icon icon="mdi:transmission-tower-export"></ha-icon></div>
                <div>
                  <div class="flow-name">${t('Electricity returned')}</div>
                  <div class="flow-energy">${this._energy(cost.exportedKwh)}${exportPrice}</div>
                </div>
                <div class="flow-value ${cost.exportValue >= 0 ? 'export' : ''}">${formatEuro(cost.exportValue)}</div>
              </div>
            </div>
            ${includeFixedDailyCost ? html`
              <div class="fixed-charge">
                <div class="flow-icon"><ha-icon icon="mdi:receipt-text-outline"></ha-icon></div>
                <div>
                  <div class="flow-name">${t('Fixed daily contract cost')}</div>
                  <div class="flow-energy">${t('Full daily charge from your active contract')}</div>
                </div>
                <div class="flow-value">${formatEuro(fixedDailyCost)}</div>
              </div>
            ` : nothing}
          ` : nothing}

          ${this.config.show_explanation !== false ? html`
            <div class="note">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              <span>
                ${t('Estimated from recorded 5-minute grid power and prices from {contract}.', { contract: contractName })}
                ${cost.predictedPrices ? ` ${t('Predicted prices are used until confirmed prices arrive.')}` : ''}
                ${partial ? ` ${t('{coverage}% of measured energy has matching price data.', { coverage })}` : ''}
                ${includeFixedDailyCost
                  ? t('The fixed daily contract cost is included; gas is excluded.')
                  : t('Fixed daily charges and gas are excluded.')}
              </span>
            </div>
          ` : nothing}
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'smarthomeshop-energy-cost-card': SmartHomeShopEnergyCostCard;
  }
}
