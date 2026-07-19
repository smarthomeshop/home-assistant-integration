import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';
import '../components/account-prices';
import './energy-sources';
import './energy-battery';

interface Sources {
  solar_power?: string;
  solar_invert?: boolean;
  battery_power?: string;
  battery_invert?: boolean;
  battery_soc?: string;
  battery_capacity_kwh?: number;
  pv_forecast?: string;
}

interface PriceRow {
  start: string;
  market?: number;
  consumer: number;
  feed_in?: number;
}

interface PricePeriod {
  start: string;
  end?: string;
  price: number;
  saving?: number | null;
}

interface PriceInsights {
  current: number;
  feedIn: number | null;
  average: number;
  difference: number;
  differencePercentage: number | null;
  rank: number;
  rankedHours: number;
  lowest: PricePeriod;
  highest: PricePeriod;
  nextLower: PricePeriod | null;
  negativeHours: number;
  spread: number;
}

interface CheapestBlock {
  hours: number;
  start: string;
  end: string;
  average: number;
}

interface HistoryPoint {
  t: number;
  v: number;
}

interface PowerSeries {
  id: string;
  label: string;
  color: string;
}

@customElement('shs-energy-hub')
export class EnergyHub extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _loaded = false;
  @state() private _sources: Sources = {};
  @state() private _account: any = null;
  @state() private _schedules: any[] = [];
  @state() private _battery: any = {};
  @state() private _priceEntity?: string;
  @state() private _priceTab: 'today' | 'tomorrow' = 'today';
  @state() private _cheapestHours = 3;
  @state() private _history: Record<string, HistoryPoint[]> = {};
  @state() private _hoverBar = -1;
  @state() private _powerChartWidth = 760;
  @state() private _hoverPowerTime?: number;
  @state() private _settingsOpen = false;
  @state() private _settingsFocus: 'account' | 'sources' | 'battery' | '' = '';

  private static readonly APP_STATS_URL = 'https://app.smarthomeshop.io/energy-prices';
  private static readonly INITIAL_LOAD_TIMEOUT = 6000;
  private static readonly BACKGROUND_LOAD_TIMEOUT = 12000;
  private _loadStarted = false;
  private _loading?: Promise<void>;
  private _anchorObserver?: ResizeObserver;
  private _backdropArmed = false;
  private _accountLoading?: Promise<void>;
  private _historyLoading?: Promise<void>;
  private _timer?: number;
  private _accountPollTimer?: number;
  private _accountPollAttempts = 0;
  private _powerChartObserver?: ResizeObserver;
  private _powerChartElement?: Element;

  static styles = css`
    :host {
      display: block;
      max-width: 1180px;
      margin: 0 auto;
      box-sizing: border-box;
      color: var(--primary-text-color);
      --shs-blue: #4361ee;
      --shs-blue-soft: color-mix(in srgb, var(--shs-blue) 12%, var(--card-background-color));
      --shs-green: #159957;
      --shs-green-soft: color-mix(in srgb, var(--shs-green) 12%, var(--card-background-color));
      --shs-amber: #d8890b;
      --shs-amber-soft: color-mix(in srgb, var(--shs-amber) 13%, var(--card-background-color));
      --shs-red: #d34a4a;
      --shs-red-soft: color-mix(in srgb, var(--shs-red) 11%, var(--card-background-color));
      --shs-border: color-mix(in srgb, var(--divider-color) 78%, transparent);
      --shs-muted-surface: color-mix(in srgb, var(--secondary-background-color) 74%, var(--card-background-color));
    }

    * { box-sizing: border-box; }
    button, a { -webkit-tap-highlight-color: transparent; }

    .page-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
    }
    .eyebrow {
      color: var(--shs-blue);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    h1 { font-size: 26px; line-height: 1.1; margin: 0; font-weight: 760; letter-spacing: 0; }
    .subtitle { font-size: 13px; color: var(--secondary-text-color); margin-top: 7px; }
    .connection {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text-color);
      font-size: 12px;
      white-space: nowrap;
    }
    .connection-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--shs-green); }
    .head-actions { display: flex; align-items: center; gap: 14px; }
    .settings-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 16px; border: 1px solid var(--divider-color); border-radius: 10px;
      background: var(--card-background-color); color: var(--primary-text-color);
      font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
    }
    .settings-btn:hover { border-color: var(--shs-blue); color: var(--shs-blue); }
    .settings-btn ha-icon { --mdc-icon-size: 17px; }

    /* Energy settings dialog: one place for account, sources and battery.
       z-index stays below the sub-components' own modals (999) so their
       pickers layer on top of this dialog. */
    .dlg-backdrop { position: fixed; inset: 0; background: rgba(15, 18, 32, .55); z-index: 940; display: flex; align-items: flex-start; justify-content: center; padding: 4vh 16px; overscroll-behavior: contain; }
    .dlg { width: 100%; max-width: 700px; max-height: 92vh; overflow-y: auto; overscroll-behavior: contain; outline: none; background: var(--primary-background-color); border: 1px solid var(--divider-color); border-radius: 18px; box-shadow: 0 24px 70px rgba(0,0,0,.45); }
    .dlg-head { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: var(--primary-background-color); border-bottom: 1px solid var(--divider-color); }
    .dlg-title { font-size: 16px; font-weight: 700; color: var(--primary-text-color); }
    .dlg-sub { font-size: 12px; color: var(--secondary-text-color); margin-top: 1px; }
    .dlg-x { margin-left: auto; background: none; border: none; color: var(--secondary-text-color); cursor: pointer; padding: 6px; display: flex; border-radius: 8px; }
    .dlg-x:hover { background: var(--secondary-background-color); color: var(--primary-text-color); }
    .dlg-body { padding: 6px 20px 24px; }
    .dlg-sec { scroll-margin-top: 92px; border-radius: 14px; }
    .dlg-sec.focus { animation: sec-focus 1.6s ease-out 1; }
    @keyframes sec-focus {
      0% { box-shadow: 0 0 0 2px var(--shs-blue, #4361ee); }
      100% { box-shadow: 0 0 0 2px transparent; }
    }
    @media (prefers-reduced-motion: reduce) { .dlg-sec.focus { animation: none; } }
    .cta-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none; border-radius: 9px; background: var(--shs-blue, var(--shs-primary, #4361ee)); color: #fff; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; }
    .cta-btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .cta-btn ha-icon { --mdc-icon-size: 15px; }
    .smart-item .cta-btn { margin-left: auto; }

    .section { margin-top: 26px; }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 10px;
    }
    .section-title { display: flex; align-items: baseline; gap: 9px; }
    .section-title h2 { font-size: 17px; line-height: 1.2; margin: 0; font-weight: 720; }
    .section-title span { font-size: 12px; color: var(--secondary-text-color); }

    .surface {
      background: var(--card-background-color);
      border: 1px solid var(--shs-border);
      border-radius: 8px;
      overflow: hidden;
    }

    .live-surface { display: grid; grid-template-columns: minmax(260px, .85fr) minmax(0, 1.55fr); }
    .live-home {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 230px;
      padding: 28px;
      background: var(--shs-blue-soft);
      border-right: 1px solid var(--shs-border);
    }
    .metric-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .55px;
      text-transform: uppercase;
    }
    .metric-label ha-icon { color: var(--shs-blue); --mdc-icon-size: 19px; }
    .live-value { font-size: 46px; line-height: 1; font-weight: 760; margin-top: 20px; letter-spacing: 0; }
    .live-value span { font-size: 17px; font-weight: 600; color: var(--secondary-text-color); }
    .live-caption { color: var(--secondary-text-color); font-size: 13px; margin-top: 8px; }
    .live-caption.error { color: var(--shs-red); }

    .source-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .source-row {
      min-height: 115px;
      padding: 20px;
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--shs-border);
      border-right: 1px solid var(--shs-border);
    }
    .source-row:nth-child(2n) { border-right: 0; }
    .source-row:nth-last-child(-n + 2) { border-bottom: 0; }
    .source-row:last-child:nth-child(odd) { grid-column: 1 / -1; border-right: 0; }
    .source-icon {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: var(--shs-muted-surface);
      color: var(--secondary-text-color);
    }
    .source-icon ha-icon { --mdc-icon-size: 21px; }
    .source-icon.grid-in { background: var(--shs-red-soft); color: var(--shs-red); }
    .source-icon.grid-out, .source-icon.solar, .source-icon.battery-out { background: var(--shs-green-soft); color: var(--shs-green); }
    .source-icon.battery-in { background: var(--shs-blue-soft); color: var(--shs-blue); }
    .source-name { font-size: 13px; font-weight: 700; }
    .source-status { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 3px; }
    .source-status.good { color: var(--shs-green); }
    .source-status.bad { color: var(--shs-red); }
    .source-value { font-size: 20px; font-weight: 750; text-align: right; white-space: nowrap; }
    .source-value span { font-size: 12px; font-weight: 550; color: var(--secondary-text-color); }
    .battery-meta { grid-column: 2 / 4; display: flex; align-items: center; gap: 9px; margin-top: -3px; }
    .soc { flex: 1; height: 5px; border-radius: 3px; background: var(--secondary-background-color); overflow: hidden; }
    .soc > span { display: block; height: 100%; background: var(--shs-green); }
    .soc-txt { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; }

    .setup-note, .empty {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-top: 10px;
      padding: 13px 14px;
      border: 1px dashed var(--shs-border);
      border-radius: 8px;
      color: var(--secondary-text-color);
      font-size: 12.5px;
      line-height: 1.5;
    }
    .setup-note ha-icon, .empty ha-icon { --mdc-icon-size: 18px; color: var(--shs-blue); flex: 0 0 auto; }
    .setup-note b, .empty b { color: var(--primary-text-color); }
    .setup-note > div, .empty > div { flex: 1; }
    .setup-note .cta-btn, .empty .cta-btn { align-self: center; }

    .seg { display: inline-flex; padding: 3px; background: var(--secondary-background-color); border-radius: 7px; }
    .seg button {
      min-height: 30px;
      border: 0;
      border-radius: 5px;
      padding: 5px 12px;
      color: var(--secondary-text-color);
      background: transparent;
      font: inherit;
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
    }
    .seg button.on { color: var(--primary-text-color); background: var(--card-background-color); box-shadow: 0 1px 3px rgba(0, 0, 0, .12); }
    .seg button:focus-visible, .chart-link:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 2px; }

    .price-surface { display: grid; grid-template-columns: 310px minmax(0, 1fr); }
    .price-summary { padding: 24px; background: var(--shs-amber-soft); border-right: 1px solid var(--shs-border); }
    .price-kicker { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .price-kicker span:first-child { font-size: 12px; font-weight: 700; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: .55px; }
    .price-rank { padding: 4px 7px; border-radius: 5px; background: var(--card-background-color); font-size: 11px; font-weight: 700; }
    .price-value { margin-top: 16px; font-size: 38px; line-height: 1; font-weight: 760; }
    .price-value span { font-size: 13px; color: var(--secondary-text-color); font-weight: 550; }
    .price-state { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; margin-top: 9px; }
    .price-state.good { color: var(--shs-green); }
    .price-state.bad { color: var(--shs-red); }
    .price-state ha-icon { --mdc-icon-size: 16px; }
    .price-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 23px; border-top: 1px solid var(--shs-border); }
    .price-fact { padding: 12px 8px 0 0; min-width: 0; }
    .price-fact:nth-child(2n) { padding-left: 12px; border-left: 1px solid var(--shs-border); }
    .price-fact-label { font-size: 10.5px; color: var(--secondary-text-color); }
    .price-fact-value { font-size: 13px; font-weight: 720; line-height: 1.25; margin-top: 3px; overflow-wrap: anywhere; }
    .price-chart-wrap { padding: 20px 18px 14px; min-width: 0; }
    .chart-top { display: flex; align-items: center; gap: 14px; margin: 0 2px 7px; }
    .chart-title { font-size: 13px; font-weight: 700; }
    .chart-legend { margin-left: auto; display: flex; gap: 12px; color: var(--secondary-text-color); font-size: 10.5px; }
    .chart-legend span { display: inline-flex; align-items: center; gap: 5px; }
    .chart-legend i { width: 8px; height: 8px; border-radius: 2px; }
    .chart svg { width: 100%; height: 225px; display: block; overflow: visible; }
    .power-surface .chart svg { height: auto; }
    .chart text { fill: var(--secondary-text-color); font-size: 10px; }
    .chart .grid, .chart .axis { stroke: var(--shs-border); stroke-width: 1; }
    .chart .grid { opacity: .7; }
    .chart .time-grid { opacity: .38; }
    .chart .zero { stroke: var(--secondary-text-color); stroke-width: 1; opacity: .48; }
    .chart .nowline { stroke: var(--shs-blue); stroke-width: 1.4; stroke-dasharray: 4 3; }
    .chart .nowtext { fill: var(--shs-blue); font-weight: 750; }
    .chart .hit { fill: transparent; cursor: pointer; }
    .chart .tip-bg { fill: var(--card-background-color); stroke: var(--shs-border); }
    .chart .tip-h { fill: var(--primary-text-color); font-weight: 700; }
    .chart .tip-p { fill: var(--secondary-text-color); }
    .power-chart-svg { touch-action: pan-y; }
    .power-chart-svg .power-area { opacity: .075; pointer-events: none; }
    .power-chart-svg .power-line { vector-effect: non-scaling-stroke; pointer-events: none; }
    .power-chart-svg .power-endpoint,
    .power-chart-svg .power-hover-dot { vector-effect: non-scaling-stroke; pointer-events: none; }
    .power-chart-svg .power-crosshair {
      stroke: var(--secondary-text-color);
      stroke-width: 1;
      stroke-dasharray: 3 4;
      opacity: .55;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    .power-chart-svg .power-hit { fill: transparent; cursor: crosshair; outline: none; }
    .power-chart-svg .power-hit:focus { stroke: var(--shs-blue); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
    .power-chart-svg .power-tip-bg {
      fill: var(--card-background-color);
      stroke: var(--shs-border);
      stroke-width: 1;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, .14));
    }
    .power-chart-svg .power-tip-time { fill: var(--primary-text-color); font-size: 11px; font-weight: 750; }
    .power-chart-svg .power-tip-label { fill: var(--secondary-text-color); font-size: 10px; }
    .power-chart-svg .power-tip-value { fill: var(--primary-text-color); font-size: 10px; font-weight: 700; }
    .chart-foot { display: flex; align-items: center; justify-content: flex-end; min-height: 28px; margin: 2px 3px 0; }
    .chart-link { display: inline-flex; align-items: center; gap: 4px; color: var(--shs-blue); font-size: 12px; font-weight: 650; text-decoration: none; }
    .chart-link:hover { text-decoration: underline; }
    .chart-link ha-icon { --mdc-icon-size: 14px; }

    .cheapest-strip {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: minmax(230px, .8fr) minmax(360px, 1.2fr);
      align-items: center;
      gap: 20px;
      padding: 14px 18px;
      border-top: 1px solid var(--shs-border);
      background: var(--shs-muted-surface);
    }
    .cheapest-kicker {
      color: var(--secondary-text-color);
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: .45px;
      text-transform: uppercase;
    }
    .cheapest-result {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 5px 10px;
      margin-top: 4px;
    }
    .cheapest-result strong { font-size: 15px; line-height: 1.25; }
    .cheapest-result span { color: var(--secondary-text-color); font-size: 11.5px; }
    .cheapest-options {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 4px;
      padding: 3px;
      border: 1px solid var(--shs-border);
      border-radius: 7px;
      background: var(--secondary-background-color);
    }
    .cheapest-options button {
      min-width: 0;
      min-height: 34px;
      padding: 4px 6px;
      border: 0;
      border-radius: 5px;
      color: var(--secondary-text-color);
      background: transparent;
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .cheapest-options button:hover { color: var(--primary-text-color); }
    .cheapest-options button.active {
      color: var(--primary-text-color);
      background: var(--card-background-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, .12);
    }
    .cheapest-options button:focus-visible { outline: 2px solid var(--shs-blue); outline-offset: 1px; }

    .power-surface { padding: 20px; }
    .power-summary { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 8px; }
    .power-stat { min-width: 145px; padding: 2px 22px 8px 0; margin-right: 22px; border-right: 1px solid var(--shs-border); }
    .power-stat:last-child { border-right: 0; }
    .power-stat-label { color: var(--secondary-text-color); font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; }
    .power-stat-value { font-size: 17px; font-weight: 740; margin-top: 4px; }

    .smart-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .smart-item { display: flex; align-items: center; gap: 11px; padding: 16px; border-right: 1px solid var(--shs-border); }
    .smart-item:last-child { border-right: 0; }
    .smart-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 8px; background: var(--shs-muted-surface); color: var(--secondary-text-color); flex: 0 0 auto; }
    .smart-icon.good { color: var(--shs-green); background: var(--shs-green-soft); }
    .smart-icon ha-icon { --mdc-icon-size: 19px; }
    .smart-name { font-size: 12.5px; font-weight: 700; }
    .smart-detail { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 2px; }

    .loading { min-height: 330px; display: grid; place-items: center; color: var(--secondary-text-color); font-size: 13px; }
    .loading-ring { width: 28px; height: 28px; margin: 0 auto 12px; border: 3px solid var(--divider-color); border-top-color: var(--shs-blue); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .loading-ring { animation: none; } }

    @media (max-width: 850px) {
      .price-surface { grid-template-columns: 1fr; }
      .price-summary { border-right: 0; border-bottom: 1px solid var(--shs-border); }
      .cheapest-strip { grid-template-columns: 1fr; gap: 10px; }
      .price-facts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .price-fact { padding-left: 12px; border-left: 1px solid var(--shs-border); }
      .price-fact:nth-child(3n + 1) { padding-left: 0; border-left: 0; }
    }

    @media (max-width: 680px) {
      .page-head { align-items: flex-start; margin-bottom: 20px; }
      .connection { display: none; }
      h1 { font-size: 23px; }
      .section { margin-top: 22px; }
      .section-title h2 { font-size: 16px; }
      .live-surface { grid-template-columns: 1fr; }
      .live-home { min-height: 160px; padding: 22px; border-right: 0; border-bottom: 1px solid var(--shs-border); }
      .live-value { font-size: 38px; margin-top: 14px; }
      .source-list { grid-template-columns: 1fr; }
      .source-row { min-height: 88px; padding: 15px 17px; border-right: 0; }
      .source-row:last-child:nth-child(odd) { grid-column: auto; }
      .source-row:nth-last-child(-n + 2) { border-bottom: 1px solid var(--shs-border); }
      .source-row:last-child { border-bottom: 0; }
      .price-summary { padding: 20px; }
      .price-value { font-size: 34px; }
      .price-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .price-fact { padding-left: 12px; border-left: 1px solid var(--shs-border); }
      .price-fact:nth-child(odd) { padding-left: 0; border-left: 0; }
      .price-fact:nth-child(n + 3) { border-top: 1px solid var(--shs-border); margin-top: 10px; padding-top: 10px; }
      .price-chart-wrap { padding: 16px 10px 12px; }
      .cheapest-strip { padding: 14px 10px; }
      .chart-top { align-items: flex-start; }
      .chart-legend { display: none; }
      .chart svg { height: 205px; }
      .power-surface .chart svg { height: auto; }
      .power-surface { padding: 16px 10px 12px; }
      .power-summary { padding: 0 7px; }
      .power-stat { min-width: 0; flex: 1; padding-right: 10px; margin-right: 10px; }
      .smart-list { grid-template-columns: 1fr; }
      .smart-item { border-right: 0; border-bottom: 1px solid var(--shs-border); }
      .smart-item:last-child { border-bottom: 0; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => this._load(), 60000);
  }

  disconnectedCallback(): void {
    if (this._timer) window.clearInterval(this._timer);
    if (this._accountPollTimer) window.clearTimeout(this._accountPollTimer);
    this._timer = undefined;
    this._accountPollTimer = undefined;
    this._accountPollAttempts = 0;
    this._powerChartObserver?.disconnect();
    this._powerChartObserver = undefined;
    this._powerChartElement = undefined;
    this._anchorObserver?.disconnect();
    this._anchorObserver = undefined;
    // Never leave the page scroller frozen if we unmount with the dialog open.
    this._lockPageScroll(false);
    super.disconnectedCallback();
  }

  protected updated(): void {
    const element = this.renderRoot.querySelector('.power-surface .chart');
    if (element === this._powerChartElement) return;

    this._powerChartObserver?.disconnect();
    this._powerChartElement = element || undefined;
    if (!element || typeof ResizeObserver === 'undefined') return;

    this._powerChartObserver = new ResizeObserver(entries => {
      const width = Math.round(entries[0]?.contentRect.width || 0);
      if (width > 0 && Math.abs(width - this._powerChartWidth) > 1) {
        this._powerChartWidth = width;
      }
    });
    this._powerChartObserver.observe(element);
  }

  protected willUpdate(): void {
    if (this.hass && !this._loadStarted) {
      this._loadStarted = true;
      this._load();
    }
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    if (this._loading) return this._loading;
    this._loading = this._loadData().finally(() => { this._loading = undefined; });
    return this._loading;
  }

  private async _callWS<T>(message: Record<string, unknown>, timeoutMs: number): Promise<T> {
    let timeoutId: number | undefined;
    try {
      return await Promise.race([
        this.hass.callWS<T>(message),
        new Promise<T>((_, reject) => {
          timeoutId = window.setTimeout(
            () => reject(new Error(`${String(message.type)} timed out`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }

  private async _loadData(): Promise<void> {
    // Loading the Energy page must never depend on the external price API.
    // Read the cached coordinator state immediately; refreshes are scheduled
    // by the backend or started explicitly from the account controls.
    this._startAccountLoad('smarthomeshop/account');

    try {
      const [sources, entities, schedules, battery] = await Promise.allSettled([
        this._callWS<{ sources: Sources }>(
          { type: 'smarthomeshop/energy_sources' },
          EnergyHub.INITIAL_LOAD_TIMEOUT,
        ),
        this._callWS<{ entities: Record<string, string | null> }>(
          { type: 'smarthomeshop/prices/entities' },
          EnergyHub.INITIAL_LOAD_TIMEOUT,
        ),
        this._callWS<{ schedules: any[] }>(
          { type: 'smarthomeshop/schedules' },
          EnergyHub.INITIAL_LOAD_TIMEOUT,
        ),
        this._callWS<{ battery: any }>(
          { type: 'smarthomeshop/battery' },
          EnergyHub.INITIAL_LOAD_TIMEOUT,
        ),
      ]);

      if (sources.status === 'fulfilled') this._sources = sources.value.sources || {};
      if (entities.status === 'fulfilled') this._priceEntity = entities.value.entities?.electricity_price || undefined;
      if (schedules.status === 'fulfilled') this._schedules = schedules.value.schedules || [];
      if (battery.status === 'fulfilled') this._battery = battery.value.battery || {};
    } catch (err) {
      console.warn('Energy overview load failed', err);
    } finally {
      // A slow optional endpoint must never leave the complete Energy page blocked.
      this._loaded = true;
      this._startHistoryLoad();
    }
  }

  private _startAccountLoad(type: string): void {
    if (this._accountLoading) return;
    this._accountLoading = this._callWS<any>(
      { type },
      EnergyHub.BACKGROUND_LOAD_TIMEOUT,
    ).then(account => {
      this._account = account;
      this._watchAccountRefresh(account, true);
    }).catch(err => {
      console.warn('Energy account load failed', err);
    }).finally(() => {
      this._accountLoading = undefined;
    });
  }

  private _watchAccountRefresh(account: any, reset = false): void {
    if (reset) {
      if (this._accountPollTimer) window.clearTimeout(this._accountPollTimer);
      this._accountPollTimer = undefined;
      this._accountPollAttempts = 0;
    }
    if (!account?.refreshing) {
      if (this._accountPollTimer) window.clearTimeout(this._accountPollTimer);
      this._accountPollTimer = undefined;
      this._accountPollAttempts = 0;
      return;
    }
    if (!this.isConnected || this._accountPollTimer || this._accountPollAttempts >= 30) return;

    this._accountPollTimer = window.setTimeout(() => {
      this._accountPollTimer = undefined;
      void this._pollAccountRefresh();
    }, 1500);
  }

  private async _pollAccountRefresh(): Promise<void> {
    if (!this.isConnected) return;
    this._accountPollAttempts += 1;
    try {
      const account = await this._callWS<any>(
        { type: 'smarthomeshop/account' },
        EnergyHub.INITIAL_LOAD_TIMEOUT,
      );
      this._account = account;
      this._watchAccountRefresh(account);
    } catch (err) {
      if (this._accountPollAttempts < 30) this._watchAccountRefresh(this._account);
      else console.warn('Energy account status polling failed', err);
    }
  }

  private _startHistoryLoad(): void {
    if (this._historyLoading) return;
    this._historyLoading = this._loadHistory().finally(() => {
      this._historyLoading = undefined;
    });
  }

  private async _loadHistory(): Promise<void> {
    const ids = [this._netEntity(), this._sources.solar_power, this._sources.battery_power]
      .filter(Boolean) as string[];
    if (!ids.length) {
      this._history = {};
      return;
    }

    try {
      const start = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      const result = await this._callWS<Record<string, any[]>>(
        {
          type: 'history/history_during_period',
          start_time: start,
          entity_ids: ids,
          minimal_response: true,
          no_attributes: true,
          significant_changes_only: false,
        },
        EnergyHub.BACKGROUND_LOAD_TIMEOUT,
      );
      const history: Record<string, HistoryPoint[]> = {};

      for (const id of ids) {
        const invert = id === this._sources.solar_power
          ? !!this._sources.solar_invert
          : id === this._sources.battery_power
            ? !!this._sources.battery_invert
            : false;
        const scale = this._scale(id);
        const points = (result[id] || []).map((point: any) => {
          const rawTime = point.lu ?? point.lc ?? point.last_updated ?? point.last_changed;
          const numericTime = typeof rawTime === 'number'
            ? (rawTime > 1000000000000 ? rawTime : rawTime * 1000)
            : Date.parse(String(rawTime));
          return {
            t: numericTime,
            v: (invert ? -1 : 1) * scale * Number(point.s ?? point.state),
          };
        }).filter((point: HistoryPoint) => Number.isFinite(point.v) && Number.isFinite(point.t) && point.t > 0);
        history[id] = this._downsample(points, 180);
      }
      this._history = history;
    } catch {
      this._history = {};
    }
  }

  private _downsample(points: HistoryPoint[], maxPoints: number): HistoryPoint[] {
    if (points.length <= maxPoints) return points;
    const step = (points.length - 1) / (maxPoints - 1);
    return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)]);
  }

  private _netEntity(): string | undefined {
    return Object.keys(this.hass.states || {})
      .find(entityId => entityId.startsWith('sensor.') && entityId.includes('_net_grid_power'));
  }

  private _scale(entityId?: string): number {
    const unit = String((entityId && this.hass.states[entityId]?.attributes?.unit_of_measurement) || '');
    return /^kw$/i.test(unit) ? 1000 : 1;
  }

  private _num(entityId?: string, invert = false): number | null {
    if (!entityId) return null;
    const state = this.hass.states[entityId];
    if (!state || state.state === 'unavailable' || state.state === 'unknown') return null;
    const value = Number(state.state);
    if (!Number.isFinite(value)) return null;
    return (invert ? -1 : 1) * this._scale(entityId) * value;
  }

  private _isDead(entityId?: string): boolean {
    if (!entityId) return false;
    const state = this.hass.states[entityId];
    return !state || state.state === 'unavailable' || state.state === 'unknown';
  }

  private _formatPower(watts: number | null, absolute = false): { value: string; unit: string } {
    if (watts === null) return { value: '-', unit: '' };
    const value = absolute ? Math.abs(watts) : watts;
    if (Math.abs(value) >= 1000) return { value: (value / 1000).toFixed(2), unit: 'kW' };
    return { value: String(Math.round(value)), unit: 'W' };
  }

  private _formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '-';
    return `€ ${Number(value).toFixed(3)}`;
  }

  private _priceRows(which: 'today' | 'tomorrow'): PriceRow[] {
    const attributes = this._priceEntity ? this.hass.states[this._priceEntity]?.attributes : undefined;
    const rows = which === 'today' ? attributes?.prices_today : attributes?.prices_tomorrow;
    return Array.isArray(rows)
      ? rows.filter((row: any) => row && typeof row.start === 'string' && typeof row.consumer === 'number')
      : [];
  }

  private _periodFromRow(row: PriceRow): PricePeriod {
    return {
      start: row.start,
      end: new Date(new Date(row.start).getTime() + 3600000).toISOString(),
      price: row.consumer,
    };
  }

  private _cheapestPriceBlock(rows: PriceRow[], hours: number): CheapestBlock | null {
    const duration = Math.max(1, Math.min(6, Math.round(hours)));
    if (rows.length < duration) return null;

    const sorted = [...rows].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    let cheapest: CheapestBlock | null = null;

    for (let index = 0; index + duration <= sorted.length; index += 1) {
      const block = sorted.slice(index, index + duration);
      const starts = block.map(row => new Date(row.start).getTime());
      const isValid = starts.every(Number.isFinite)
        && starts.slice(1).every((start, offset) => Math.abs(start - starts[offset] - 3600000) < 1000);
      if (!isValid) continue;

      const average = block.reduce((total, row) => total + row.consumer, 0) / duration;
      if (!cheapest || average < cheapest.average) {
        cheapest = {
          hours: duration,
          start: block[0].start,
          end: new Date(starts[starts.length - 1] + 3600000).toISOString(),
          average,
        };
      }
    }

    return cheapest;
  }

  private _priceInsights(today: PriceRow[], tomorrow: PriceRow[]): PriceInsights | null {
    if (!today.length) return null;

    const now = Date.now();
    const currentRow = today.find(row => {
      const start = new Date(row.start).getTime();
      return Number.isFinite(start) && start <= now && start + 3600000 > now;
    });
    const accountCurrent = Number(this._account?.current?.electricity);
    const current = currentRow?.consumer ?? accountCurrent;
    if (!Number.isFinite(current)) return null;

    const prices = today.map(row => row.consumer);
    const average = prices.reduce((total, price) => total + price, 0) / prices.length;
    const sorted = [...prices].sort((a, b) => a - b);
    const lowestRow = today.reduce((best, row) => row.consumer < best.consumer ? row : best, today[0]);
    const highestRow = today.reduce((best, row) => row.consumer > best.consumer ? row : best, today[0]);
    const difference = current - average;
    const differencePercentage = Math.abs(average) > 0.000001
      ? difference / Math.abs(average) * 100
      : null;
    const nextLowerRow = [...today, ...tomorrow]
      .filter(row => new Date(row.start).getTime() > now && row.consumer < current)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
    const summaryNext = this._account?.summary?.next_lower_period as PricePeriod | undefined;
    const summaryNextStart = summaryNext ? new Date(summaryNext.start).getTime() : Number.NaN;
    const validSummaryNext = summaryNext
      && Number.isFinite(summaryNextStart)
      && summaryNextStart > now
      && Number(summaryNext.price) < current;
    const accountFeedIn = Number(this._account?.current?.feed_in);

    return {
      current,
      feedIn: typeof currentRow?.feed_in === 'number'
        ? currentRow.feed_in
        : Number.isFinite(accountFeedIn) ? accountFeedIn : null,
      average,
      difference,
      differencePercentage,
      rank: sorted.filter(price => price < current).length + 1,
      rankedHours: today.length,
      lowest: this._periodFromRow(lowestRow),
      highest: this._periodFromRow(highestRow),
      nextLower: validSummaryNext
        ? summaryNext
        : nextLowerRow
          ? { ...this._periodFromRow(nextLowerRow), saving: current - nextLowerRow.consumer }
          : null,
      negativeHours: prices.filter(price => price < 0).length,
      spread: Math.max(...prices) - Math.min(...prices),
    };
  }

  private _sourceRow(options: {
    name: string;
    icon: string;
    iconClass: string;
    value: number | null;
    status: string;
    statusClass?: string;
    dead?: boolean;
    soc?: number | null;
  }) {
    const formatted = this._formatPower(options.value, true);
    return html`
      <div class="source-row">
        <div class="source-icon ${options.iconClass}"><ha-icon icon=${options.icon}></ha-icon></div>
        <div>
          <div class="source-name">${options.name}</div>
          <div class="source-status ${options.dead ? 'bad' : options.statusClass || ''}">
            ${options.dead ? 'Sensor unavailable' : options.status}
          </div>
        </div>
        <div class="source-value">${formatted.value} <span>${formatted.unit}</span></div>
        ${options.soc !== null && options.soc !== undefined ? html`
          <div class="battery-meta">
            <div class="soc"><span style="width:${Math.max(0, Math.min(100, options.soc))}%"></span></div>
            <div class="soc-txt">${Math.round(options.soc)}% charged</div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderLive(house: number | null, grid: number | null, solar: number | null, battery: number | null, soc: number | null, contributorDead: boolean) {
    const home = this._formatPower(house);
    const sourceCount = 1 + (this._sources.solar_power ? 1 : 0) + (this._sources.battery_power ? 1 : 0);
    return html`
      <section class="section">
        <div class="section-head">
          <div class="section-title"><h2>Live energy</h2><span>${sourceCount} source${sourceCount === 1 ? '' : 's'} connected</span></div>
        </div>
        <div class="surface live-surface">
          <div class="live-home">
            <div class="metric-label"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon>Home consumption</div>
            <div class="live-value">${home.value} <span>${home.unit}</span></div>
            <div class="live-caption ${house === null && contributorDead ? 'error' : ''}">
              ${house === null && contributorDead ? 'A connected power sensor is unavailable' : 'Calculated from all connected energy flows'}
            </div>
          </div>
          <div class="source-list">
            ${this._sourceRow({
              name: 'Grid',
              icon: grid !== null && grid < -5 ? 'mdi:transmission-tower-export' : 'mdi:transmission-tower-import',
              iconClass: grid === null || Math.abs(grid) <= 5 ? '' : grid > 5 ? 'grid-in' : 'grid-out',
              value: grid,
              dead: this._isDead(this._netEntity()),
              status: grid === null ? 'No reading' : grid > 5 ? 'Importing from grid' : grid < -5 ? 'Exporting to grid' : 'Grid balanced',
              statusClass: grid !== null && grid < -5 ? 'good' : '',
            })}
            ${this._sources.solar_power ? this._sourceRow({
              name: 'Solar',
              icon: 'mdi:solar-power-variant',
              iconClass: 'solar',
              value: solar,
              dead: this._isDead(this._sources.solar_power),
              status: solar !== null && solar > 5 ? 'Producing now' : 'No production',
              statusClass: solar !== null && solar > 5 ? 'good' : '',
            }) : nothing}
            ${this._sources.battery_power ? this._sourceRow({
              name: 'Battery',
              icon: battery !== null && battery < -5 ? 'mdi:battery-arrow-up-outline' : 'mdi:battery-arrow-down-outline',
              iconClass: battery !== null && battery < -5 ? 'battery-in' : battery !== null && battery > 5 ? 'battery-out' : '',
              value: battery,
              dead: this._isDead(this._sources.battery_power),
              status: battery === null ? 'No reading' : battery > 5 ? 'Discharging' : battery < -5 ? 'Charging' : 'Idle',
              statusClass: battery !== null && battery > 5 ? 'good' : '',
              soc,
            }) : nothing}
          </div>
        </div>
        ${!this._sources.solar_power && !this._sources.battery_power ? html`
          <div class="setup-note">
            <ha-icon icon="mdi:connection"></ha-icon>
            <div>Only grid power is connected. Add your solar and battery entities to see production, storage and state of charge.</div>
            ${this.hass.user?.is_admin ? html`<button class="cta-btn ghost" @click=${() => this._openSettings('sources')}>Set up</button>` : nothing}
          </div>
        ` : nothing}
      </section>
    `;
  }

  private _priceChart(rows: PriceRow[]) {
    const width = 760;
    const height = 220;
    const left = 48;
    const right = 750;
    const top = 24;
    const bottom = 178;
    const values = rows.map(row => row.consumer);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const yMax = (maximum <= 0 ? 0.01 : maximum) * 1.08;
    const yMin = Math.min(0, minimum) * 1.08;
    const range = Math.max(0.001, yMax - yMin);
    const y = (value: number) => top + (yMax - value) / range * (bottom - top);
    const zeroY = y(0);
    const barWidth = (right - left) / rows.length;
    const now = Date.now();
    const nowIndex = rows.findIndex(row => {
      const start = new Date(row.start).getTime();
      return start <= now && start + 3600000 > now;
    });
    const color = (value: number) => {
      const position = maximum === minimum ? .5 : (value - minimum) / (maximum - minimum);
      return position <= .34 ? '#159957' : position <= .67 ? '#d8890b' : '#d34a4a';
    };
    const ticks = yMin < 0 ? [yMax, 0, yMin] : [yMax, yMax / 2, 0];
    const hover = this._hoverBar >= 0 && this._hoverBar < rows.length ? this._hoverBar : -1;
    const hourIndexes = [0, Math.floor(rows.length / 4), Math.floor(rows.length / 2), Math.floor(rows.length * .75)]
      .filter((value, index, all) => value < rows.length && all.indexOf(value) === index);

    return html`
      <div class="chart">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Hourly electricity prices" @pointerleave=${() => { this._hoverBar = -1; }}>
          ${ticks.map(tick => svg`
            <line class="grid" x1=${left} y1=${y(tick)} x2=${right} y2=${y(tick)}></line>
            <text x=${left - 7} y=${y(tick) + 3} text-anchor="end">${tick.toFixed(2)}</text>
          `)}
          <line class="axis" x1=${left} y1=${top} x2=${left} y2=${bottom}></line>
          ${rows.map((row, index) => {
            const rowY = y(row.consumer);
            const rectY = Math.min(zeroY, rowY);
            const rectHeight = Math.max(2, Math.abs(rowY - zeroY));
            const selected = index === nowIndex || index === hover;
            return svg`
              <rect
                x=${left + index * barWidth + 1.5}
                y=${rectY}
                width=${Math.max(2, barWidth - 3)}
                height=${rectHeight}
                rx="2"
                fill=${color(row.consumer)}
                opacity=${selected ? 1 : .62}
              ></rect>
            `;
          })}
          ${nowIndex >= 0 ? svg`
            <line class="nowline" x1=${left + nowIndex * barWidth + barWidth / 2} y1=${top} x2=${left + nowIndex * barWidth + barWidth / 2} y2=${bottom}></line>
            <text class="nowtext" x=${left + nowIndex * barWidth + barWidth / 2} y="13" text-anchor="middle">Now</text>
          ` : nothing}
          ${hourIndexes.map(index => svg`
            <text x=${left + index * barWidth + barWidth / 2} y=${height - 10} text-anchor="middle">${this._hm(rows[index].start)}</text>
          `)}
          ${rows.map((row, index) => svg`
            <rect
              class="hit"
              x=${left + index * barWidth}
              y=${top}
              width=${barWidth}
              height=${bottom - top}
              @pointerenter=${() => { this._hoverBar = index; }}
              @click=${() => { this._hoverBar = index; }}
            ><title>${this._hm(row.start)} ${this._formatPrice(row.consumer)}/kWh</title></rect>
          `)}
          ${hover >= 0 ? this._priceTooltip(rows[hover], left + hover * barWidth + barWidth / 2, left, right, top) : nothing}
        </svg>
      </div>
    `;
  }

  private _priceTooltip(row: PriceRow, center: number, left: number, right: number, top: number) {
    const width = 104;
    const height = 38;
    const x = Math.max(left + width / 2, Math.min(right - width / 2, center));
    return svg`
      <g pointer-events="none">
        <rect class="tip-bg" x=${x - width / 2} y=${top} width=${width} height=${height} rx="5"></rect>
        <text class="tip-h" x=${x} y=${top + 14} text-anchor="middle">${this._hm(row.start)}</text>
        <text class="tip-p" x=${x} y=${top + 29} text-anchor="middle">${this._formatPrice(row.consumer)}/kWh</text>
      </g>
    `;
  }

  private _renderPriceSection(priceOk: boolean) {
    // Plot whenever price rows exist, even during a transient connection
    // error (cached prices remain valid); the page-level banner explains the
    // connection state.
    if (!priceOk && !this._priceRows('today').length && !this._priceRows('tomorrow').length) return nothing;

    const today = this._priceRows('today');
    const tomorrow = this._priceRows('tomorrow');
    const rows = this._priceTab === 'tomorrow' && tomorrow.length ? tomorrow : today;
    const insights = this._priceInsights(today, tomorrow);
    if (!rows.length || !insights) return nothing;
    const belowAverage = insights.difference <= 0;
    const selectedDay = this._priceTab === 'tomorrow' && tomorrow.length ? 'Tomorrow' : 'Today';
    const cheapestBlock = this._cheapestPriceBlock(rows, this._cheapestHours);

    return html`
      <section class="section">
        <div class="section-head">
          <div class="section-title"><h2>Price outlook</h2><span>All-in consumer price</span></div>
          ${tomorrow.length ? html`
            <div class="seg" aria-label="Price day">
              <button class=${this._priceTab === 'today' ? 'on' : ''} @click=${() => { this._priceTab = 'today'; this._hoverBar = -1; }}>Today</button>
              <button class=${this._priceTab === 'tomorrow' ? 'on' : ''} @click=${() => { this._priceTab = 'tomorrow'; this._hoverBar = -1; }}>Tomorrow</button>
            </div>
          ` : nothing}
        </div>
        <div class="surface price-surface">
          <div class="price-summary">
            <div class="price-kicker">
              <span>Price now</span>
              <span class="price-rank">${insights.rank} of ${insights.rankedHours}</span>
            </div>
            <div class="price-value">${this._formatPrice(insights.current)} <span>/kWh</span></div>
            <div class="price-state ${belowAverage ? 'good' : 'bad'}">
              <ha-icon icon=${belowAverage ? 'mdi:trending-down' : 'mdi:trending-up'}></ha-icon>
              ${insights.differencePercentage === null
                ? (belowAverage ? 'Below daily average' : 'Above daily average')
                : `${Math.abs(insights.differencePercentage).toFixed(0)}% ${belowAverage ? 'below' : 'above'} daily average`}
            </div>
            <div class="price-facts">
              <div class="price-fact"><div class="price-fact-label">Daily average</div><div class="price-fact-value">${this._formatPrice(insights.average)}</div></div>
              <div class="price-fact"><div class="price-fact-label">Feed-in now</div><div class="price-fact-value">${this._formatPrice(insights.feedIn)}</div></div>
              <div class="price-fact"><div class="price-fact-label">Next lower</div><div class="price-fact-value">${insights.nextLower ? `${this._hm(insights.nextLower.start)}, save ${this._formatPrice(insights.nextLower.saving)}` : 'None available'}</div></div>
              <div class="price-fact"><div class="price-fact-label">Lowest</div><div class="price-fact-value">${this._formatPrice(insights.lowest.price)} at ${this._hm(insights.lowest.start)}</div></div>
              <div class="price-fact"><div class="price-fact-label">Highest</div><div class="price-fact-value">${this._formatPrice(insights.highest.price)} at ${this._hm(insights.highest.start)}</div></div>
              <div class="price-fact"><div class="price-fact-label">${insights.negativeHours > 0 ? 'Negative prices' : 'Daily spread'}</div><div class="price-fact-value">${insights.negativeHours > 0 ? `${insights.negativeHours} hour${insights.negativeHours === 1 ? '' : 's'}` : this._formatPrice(insights.spread)}</div></div>
            </div>
          </div>
          <div class="price-chart-wrap">
            <div class="chart-top">
              <div class="chart-title">${this._priceTab === 'tomorrow' ? 'Tomorrow by hour' : 'Today by hour'} (EUR/kWh)</div>
              <div class="chart-legend"><span><i style="background:#159957"></i>Lower</span><span><i style="background:#d34a4a"></i>Higher</span></div>
            </div>
            ${this._priceChart(rows)}
            <div class="chart-foot">
              <a class="chart-link" href=${EnergyHub.APP_STATS_URL} target="_blank" rel="noopener">
                Detailed statistics <ha-icon icon="mdi:open-in-new"></ha-icon>
              </a>
            </div>
          </div>
          <div class="cheapest-strip">
            <div>
              <div class="cheapest-kicker">Cheapest consecutive block - ${selectedDay}</div>
              <div class="cheapest-result">
                ${cheapestBlock ? html`
                  <strong>${this._hm(cheapestBlock.start)}-${this._hm(cheapestBlock.end)}</strong>
                  <span>${this._formatPrice(cheapestBlock.average)}/kWh average</span>
                ` : html`<strong>Not available</strong>`}
              </div>
            </div>
            <div class="cheapest-options" role="group" aria-label="Cheapest block duration">
              ${[1, 2, 3, 4, 5, 6].map(hours => html`
                <button
                  type="button"
                  class=${this._cheapestHours === hours ? 'active' : ''}
                  aria-pressed=${this._cheapestHours === hours ? 'true' : 'false'}
                  title=${`Show the cheapest ${hours}-hour block`}
                  @click=${() => { this._cheapestHours = hours; }}
                >${hours}h</button>
              `)}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  private _powerSeries(): PowerSeries[] {
    return [
      { id: this._netEntity(), label: 'Grid', color: '#4361ee' },
      { id: this._sources.solar_power, label: 'Solar', color: '#d8890b' },
      { id: this._sources.battery_power, label: 'Battery', color: '#159957' },
    ].filter(series => series.id && (this._history[series.id]?.length || 0) > 1) as PowerSeries[];
  }

  private _renderPowerSection(grid: number | null) {
    const series = this._powerSeries();
    if (!series.length) return nothing;
    const net = this._netEntity();
    const gridHistory = net ? this._history[net] || [] : [];
    const peakImport = gridHistory.length ? Math.max(0, ...gridHistory.map(point => point.v)) : 0;
    const peakExport = gridHistory.length ? Math.abs(Math.min(0, ...gridHistory.map(point => point.v))) : 0;
    const gridLabel = grid === null ? 'Grid now' : grid < 0 ? 'Export now' : 'Import now';

    return html`
      <section class="section">
        <div class="section-head">
          <div class="section-title"><h2>Power trend</h2><span>Last 2 hours</span></div>
        </div>
        <div class="surface power-surface">
          <div class="power-summary">
            ${this._powerStat(gridLabel, this._formatPower(grid, true))}
            ${this._powerStat('Peak import', this._formatPower(peakImport))}
            ${this._powerStat('Peak export', this._formatPower(peakExport))}
          </div>
          ${this._powerChart(series)}
        </div>
      </section>
    `;
  }

  private _powerStat(label: string, value: { value: string; unit: string }) {
    return html`<div class="power-stat"><div class="power-stat-label">${label}</div><div class="power-stat-value">${value.value} ${value.unit}</div></div>`;
  }

  private _nicePowerStep(span: number, targetIntervals: number): number {
    const rough = Math.max(Number.EPSILON, span / Math.max(1, targetIntervals));
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const fraction = rough / magnitude;
    const niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
    return niceFraction * magnitude;
  }

  private _powerScale(values: number[]): { minimum: number; maximum: number; ticks: number[] } {
    let minimum = Math.min(0, ...values);
    let maximum = Math.max(0, ...values);

    if (minimum === maximum) {
      minimum = Math.min(0, minimum - 1);
      maximum = Math.max(1, maximum + 1);
    }

    const span = Math.max(1, maximum - minimum);
    if (minimum < 0) minimum -= span * .06;
    if (maximum > 0) maximum += span * .06;

    const step = this._nicePowerStep(maximum - minimum, 4);
    const niceMinimum = Math.floor(minimum / step) * step;
    const niceMaximum = Math.ceil(maximum / step) * step;
    const ticks: number[] = [];

    for (let value = niceMinimum; value <= niceMaximum + step * .5; value += step) {
      ticks.push(Number(value.toPrecision(12)));
    }

    return { minimum: niceMinimum, maximum: niceMaximum, ticks };
  }

  private _nearestPowerPoint(points: HistoryPoint[], time: number): HistoryPoint | undefined {
    if (!points.length) return undefined;
    let low = 0;
    let high = points.length - 1;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (points[middle].t < time) low = middle + 1;
      else high = middle;
    }

    const after = points[low];
    const before = points[Math.max(0, low - 1)];
    return Math.abs(before.t - time) <= Math.abs(after.t - time) ? before : after;
  }

  private _nearestPowerTime(times: number[], target: number): number | undefined {
    if (!times.length) return undefined;
    let low = 0;
    let high = times.length - 1;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (times[middle] < target) low = middle + 1;
      else high = middle;
    }

    const after = times[low];
    const before = times[Math.max(0, low - 1)];
    return Math.abs(before - target) <= Math.abs(after - target) ? before : after;
  }

  private _setPowerHover(event: PointerEvent, times: number[]): void {
    const bounds = (event.currentTarget as SVGRectElement).getBoundingClientRect();
    if (bounds.width <= 0 || !times.length) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const target = times[0] + ratio * (times[times.length - 1] - times[0]);
    const next = this._nearestPowerTime(times, target);
    if (next !== undefined && next !== this._hoverPowerTime) this._hoverPowerTime = next;
  }

  private _movePowerHover(event: KeyboardEvent, times: number[]): void {
    if (!times.length) return;
    if (event.key === 'Escape') {
      this._hoverPowerTime = undefined;
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    if (event.key === 'Home') {
      this._hoverPowerTime = times[0];
      return;
    }
    if (event.key === 'End') {
      this._hoverPowerTime = times[times.length - 1];
      return;
    }

    const current = this._hoverPowerTime === undefined
      ? times.length - 1
      : times.indexOf(this._hoverPowerTime);
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    const next = Math.max(0, Math.min(times.length - 1, (current < 0 ? times.length - 1 : current) + direction));
    this._hoverPowerTime = times[next];
  }

  private _powerChart(series: PowerSeries[]) {
    const width = Math.max(280, this._powerChartWidth);
    const height = Math.round(Math.max(230, Math.min(320, width * .29)));
    const left = width < 420 ? 44 : 52;
    const right = width - 12;
    const top = 22;
    const bottom = height - 34;
    const points = series.flatMap(item => this._history[item.id]);
    const minimumTime = Math.min(...points.map(point => point.t));
    const maximumTime = Math.max(...points.map(point => point.t));
    const scale = this._powerScale(points.map(point => point.v));
    const maximumValue = scale.maximum;
    const minimumValue = scale.minimum;
    const range = Math.max(1, maximumValue - minimumValue);
    const x = (time: number) => maximumTime === minimumTime ? right : left + (time - minimumTime) / (maximumTime - minimumTime) * (right - left);
    const y = (value: number) => top + (maximumValue - value) / range * (bottom - top);
    const zeroY = y(0);
    const timeTickCount = width < 430 ? 3 : width < 720 ? 4 : 5;
    const timeTicks = Array.from({ length: timeTickCount }, (_, index) =>
      minimumTime + (maximumTime - minimumTime) * index / (timeTickCount - 1));
    const hoverTimes = [...new Set(points.map(point => point.t))].sort((a, b) => a - b);
    const hoverTime = this._hoverPowerTime === undefined
      ? undefined
      : this._nearestPowerTime(hoverTimes, this._hoverPowerTime);
    const hoverX = hoverTime === undefined ? undefined : x(hoverTime);
    const hoveredSeries = hoverTime === undefined
      ? []
      : series.map(item => ({ item, point: this._nearestPowerPoint(this._history[item.id], hoverTime) }))
        .filter((entry): entry is { item: PowerSeries; point: HistoryPoint } => !!entry.point);

    return html`
      <div class="chart">
        <div class="chart-top">
          <div class="chart-title">Live power (W)</div>
          <div class="chart-legend">${series.map(item => html`<span><i style="background:${item.color}"></i>${item.label}</span>`)}</div>
        </div>
        <svg
          class="power-chart-svg"
          viewBox="0 0 ${width} ${height}"
          style=${`height:${height}px`}
          role="group"
          aria-label="Interactive power history for the last two hours"
        >
          ${scale.ticks.map(tick => svg`
            <line class=${Math.abs(tick) < .01 ? 'zero' : 'grid'} x1=${left} y1=${y(tick)} x2=${right} y2=${y(tick)}></line>
            <text x=${left - 7} y=${y(tick) + 3} text-anchor="end">${this._shortPower(tick)}</text>
          `)}
          ${timeTicks.slice(1, -1).map(time => svg`
            <line class="grid time-grid" x1=${x(time)} y1=${top} x2=${x(time)} y2=${bottom}></line>
          `)}
          ${series.map(item => {
            const history = this._history[item.id];
            const path = history
              .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.t).toFixed(1)},${y(point.v).toFixed(1)}`)
              .join(' ');
            const first = history[0];
            const last = history[history.length - 1];
            const area = `${path} L${x(last.t).toFixed(1)},${zeroY.toFixed(1)} L${x(first.t).toFixed(1)},${zeroY.toFixed(1)} Z`;
            return svg`
              <path class="power-area" d=${area} fill=${item.color}></path>
              <path class="power-line" d=${path} fill="none" stroke=${item.color} stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"></path>
              <circle class="power-endpoint" cx=${x(last.t)} cy=${y(last.v)} r="3" fill=${item.color} stroke="var(--card-background-color)" stroke-width="1.5"></circle>
            `;
          })}
          ${timeTicks.map((time, index) => svg`
            <text x=${x(time)} y=${height - 10} text-anchor=${index === 0 ? 'start' : index === timeTicks.length - 1 ? 'end' : 'middle'}>${this._time(time)}</text>
          `)}
          <rect
            class="power-hit"
            x=${left}
            y=${top}
            width=${right - left}
            height=${bottom - top}
            tabindex="0"
            role="img"
            aria-label=${hoverTime === undefined
              ? 'Move over the chart or use the left and right arrow keys to inspect power values'
              : `Power values at ${this._powerTime(hoverTime)}`}
            @pointermove=${(event: PointerEvent) => this._setPowerHover(event, hoverTimes)}
            @pointerdown=${(event: PointerEvent) => this._setPowerHover(event, hoverTimes)}
            @pointerleave=${() => { this._hoverPowerTime = undefined; }}
            @focus=${() => { if (this._hoverPowerTime === undefined) this._hoverPowerTime = hoverTimes[hoverTimes.length - 1]; }}
            @keydown=${(event: KeyboardEvent) => this._movePowerHover(event, hoverTimes)}
          ></rect>
          ${hoverTime !== undefined && hoverX !== undefined ? svg`
            <line class="power-crosshair" x1=${hoverX} y1=${top} x2=${hoverX} y2=${bottom}></line>
            ${hoveredSeries.map(entry => svg`
              <circle
                class="power-hover-dot"
                cx=${x(entry.point.t)}
                cy=${y(entry.point.v)}
                r="4.2"
                fill=${entry.item.color}
                stroke="var(--card-background-color)"
                stroke-width="2"
              ></circle>
            `)}
            ${this._powerTooltip(hoverTime, hoverX, hoveredSeries, left, right, top, width)}
          ` : nothing}
        </svg>
      </div>
    `;
  }

  private _powerTooltip(
    time: number,
    center: number,
    entries: Array<{ item: PowerSeries; point: HistoryPoint }>,
    left: number,
    right: number,
    top: number,
    chartWidth: number,
  ) {
    const width = Math.min(chartWidth < 480 ? 158 : 188, right - left - 8);
    const height = 34 + entries.length * 20;
    const preferredX = center > (left + right) / 2 ? center - width - 12 : center + 12;
    const x = Math.max(left + 4, Math.min(right - width - 4, preferredX));
    const y = top + 7;

    return svg`
      <g pointer-events="none">
        <rect class="power-tip-bg" x=${x} y=${y} width=${width} height=${height} rx="6"></rect>
        <text class="power-tip-time" x=${x + 11} y=${y + 17}>${this._powerTime(time)}</text>
        ${entries.map((entry, index) => {
          const rowY = y + 36 + index * 20;
          const formatted = this._formatPower(entry.point.v);
          const label = entry.item.label === 'Grid'
            ? entry.point.v < 0 ? 'Grid export' : 'Grid import'
            : entry.item.label;
          return svg`
            <circle cx=${x + 12} cy=${rowY - 3} r="3" fill=${entry.item.color}></circle>
            <text class="power-tip-label" x=${x + 22} y=${rowY}>${label}</text>
            <text class="power-tip-value" x=${x + width - 10} y=${rowY} text-anchor="end">${formatted.value} ${formatted.unit}</text>
          `;
        })}
      </g>
    `;
  }

  private _renderSmartEnergy(priceOk: boolean, activeSchedules: number, batteryOn: boolean) {
    const today = this._priceRows('today');
    const tomorrow = this._priceRows('tomorrow');
    const selectedDay = this._priceTab === 'tomorrow' && tomorrow.length ? 'tomorrow' : 'today';
    const selectedRows = selectedDay === 'tomorrow' ? tomorrow : today;
    const cheapest = this._cheapestPriceBlock(selectedRows, this._cheapestHours);
    const nextSchedule = this._schedules
      .map(schedule => schedule.next_start)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    return html`
      <section class="section">
        <div class="section-head"><div class="section-title"><h2>Smart control</h2><span>Automation readiness</span></div></div>
        <div class="surface smart-list">
          <div class="smart-item">
            <div class="smart-icon ${priceOk ? 'good' : ''}"><ha-icon icon="mdi:currency-eur"></ha-icon></div>
            <div><div class="smart-name">Dynamic price</div><div class="smart-detail">${priceOk ? `Cheapest ${this._cheapestHours}h ${selectedDay} from ${this._hm(cheapest?.start) || 'not available'}` : 'Account not connected'}</div></div>
            ${!priceOk && this.hass.user?.is_admin ? html`<button class="cta-btn ghost" @click=${() => this._openSettings('account')}>Connect</button>` : nothing}
          </div>
          <div class="smart-item">
            <div class="smart-icon ${activeSchedules > 0 ? 'good' : ''}"><ha-icon icon="mdi:calendar-clock"></ha-icon></div>
            <div><div class="smart-name">Schedules</div><div class="smart-detail">${activeSchedules > 0 ? `${activeSchedules} running now` : nextSchedule ? `Next at ${this._hm(nextSchedule)}` : 'Created on a device page (Automations)'}</div></div>
          </div>
          <div class="smart-item">
            <div class="smart-icon ${batteryOn ? 'good' : ''}"><ha-icon icon="mdi:home-battery-outline"></ha-icon></div>
            <div><div class="smart-name">Battery control</div><div class="smart-detail">${batteryOn ? this._batterySummary() : 'Not configured'}</div></div>
            ${!batteryOn && this.hass.user?.is_admin ? html`<button class="cta-btn ghost" @click=${() => this._openSettings('battery')}>Set up</button>` : nothing}
          </div>
        </div>
      </section>
    `;
  }

  protected render() {
    if (!this._loaded) {
      return html`<div class="loading"><div><div class="loading-ring"></div>Loading energy data</div></div>`;
    }

    const net = this._netEntity();
    const grid = this._num(net);
    const solar = this._sources.solar_power
      ? Math.max(0, this._num(this._sources.solar_power, this._sources.solar_invert) ?? 0)
      : null;
    const battery = this._sources.battery_power
      ? this._num(this._sources.battery_power, this._sources.battery_invert)
      : null;
    const soc = this._num(this._sources.battery_soc);
    const contributorDead = this._isDead(net)
      || (!!this._sources.solar_power && this._isDead(this._sources.solar_power))
      || (!!this._sources.battery_power && this._isDead(this._sources.battery_power));
    const house = grid !== null && !contributorDead
      ? Math.max(0, grid + (solar ?? 0) + (battery ?? 0))
      : null;
    const priceOk = this._account?.status === 'ok';
    const hasKey = !!this._account?.has_key;
    const activeSchedules = this._schedules.filter(schedule =>
      schedule.entity_id ? this.hass.states[schedule.entity_id]?.state === 'on' : schedule.active,
    ).length;
    const batteryOn = !!this._battery?.enabled;
    const contractName = this._account?.contract?.name;

    return html`
      <header class="page-head">
        <div>
          <div class="eyebrow">Smart Energy</div>
          <h1>Energy</h1>
          <div class="subtitle">Live flow, price planning, and automated control in one overview.</div>
        </div>
        <div class="head-actions">
          ${priceOk ? html`<div class="connection"><span class="connection-dot"></span>${contractName || 'Energy prices connected'}</div>` : nothing}
          ${this.hass.user?.is_admin ? html`
            <button class="settings-btn" @click=${() => this._openSettings(priceOk ? '' : 'account')}>
              <ha-icon icon="mdi:cog-outline"></ha-icon>Settings
            </button>` : nothing}
        </div>
      </header>

      ${!hasKey ? html`
        <div class="empty">
          <ha-icon icon="mdi:account-key-outline"></ha-icon>
          <div>Connect your SmartHomeShop account to get dynamic prices, cheapest-hours planning and automated control.</div>
          ${this.hass.user?.is_admin ? html`<button class="cta-btn" @click=${() => this._openSettings('account')}>Connect</button>` : nothing}
        </div>` : !priceOk ? html`
        <div class="empty">
          <ha-icon icon="mdi:cloud-alert-outline"></ha-icon>
          <div>The price connection has a problem right now. Cached prices stay in use where available.</div>
          ${this.hass.user?.is_admin ? html`<button class="cta-btn ghost" @click=${() => this._openSettings('account')}>Check connection</button>` : nothing}
        </div>` : nothing}

      ${this._renderLive(house, grid, solar, battery, soc, contributorDead)}
      ${this._renderPriceSection(priceOk)}
      ${this._renderPowerSection(grid)}
      ${this._renderSmartEnergy(priceOk, activeSchedules, batteryOn)}
      ${this._renderSettingsDialog()}
    `;
  }

  private _openSettings(focus: 'account' | 'sources' | 'battery' | '' = ''): void {
    this._settingsFocus = focus;
    this._settingsOpen = true;
    this._lockPageScroll(true);
    this.updateComplete.then(() => {
      (this.renderRoot.querySelector('.dlg') as HTMLElement | null)?.focus();
      if (focus) this._anchorSection(focus);
    });
  }

  // The dialog's cards load their content async and grow while rendering, so
  // a single scrollIntoView lands on a still-empty section. Re-anchor on every
  // size change of the dialog body until the layout settles.
  private _anchorSection(focus: string): void {
    this._anchorObserver?.disconnect();
    const scroll = (behavior: ScrollBehavior) =>
      this.renderRoot.querySelector(`[data-sec="${focus}"]`)?.scrollIntoView({ block: 'start', behavior });
    scroll('smooth');
    const body = this.renderRoot.querySelector('.dlg-body');
    if (!body || typeof ResizeObserver === 'undefined') return;
    this._anchorObserver = new ResizeObserver(() => scroll('auto'));
    this._anchorObserver.observe(body);
    window.setTimeout(() => { this._anchorObserver?.disconnect(); this._anchorObserver = undefined; }, 2500);
  }

  private _closeSettings(): void {
    this._anchorObserver?.disconnect();
    this._anchorObserver = undefined;
    this._settingsOpen = false;
    this._settingsFocus = '';
    this._lockPageScroll(false);
    // Reflect whatever was changed in the dialog on the overview.
    this._load();
  }

  // The page scrolls in the panel's .panel-content container (not the body);
  // freeze it while the dialog is open so backdrop scrolling cannot move the
  // overview underneath.
  private _lockPageScroll(lock: boolean): void {
    const root = this.getRootNode();
    const container = root instanceof ShadowRoot
      ? (root.querySelector('.panel-content') as HTMLElement | null)
      : null;
    if (container) container.style.overflow = lock ? 'hidden' : '';
  }

  private _onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this._closeSettings();
    }
  }

  private _onBackdropPointerDown(event: PointerEvent): void {
    // Only arm the backdrop-close when the gesture STARTS on the backdrop, so
    // releasing a drag from a form field over the backdrop cannot close it.
    this._backdropArmed = event.target === event.currentTarget;
  }

  private _onBackdropClick(event: MouseEvent): void {
    if (this._backdropArmed && event.target === event.currentTarget) this._closeSettings();
    this._backdropArmed = false;
  }

  private _scrollToAccountSection(): void {
    this._anchorSection('account');
  }

  // One dialog for everything you configure on this page: the account and
  // contract, the solar/battery measurement entities, and home-battery
  // control. The cards keep their own edit dialogs, which layer on top.
  private _renderSettingsDialog() {
    if (!this._settingsOpen) return nothing;
    return html`
      <div class="dlg-backdrop"
        @pointerdown=${this._onBackdropPointerDown}
        @click=${this._onBackdropClick}>
        <div class="dlg" role="dialog" aria-modal="true" aria-label="Energy settings" tabindex="-1"
          @keydown=${this._onDialogKeydown}
          @hass-more-info=${this._closeSettings}
          @click=${(e: Event) => e.stopPropagation()}>
          <div class="dlg-head">
            <div>
              <div class="dlg-title">Energy settings</div>
              <div class="dlg-sub">Account, solar and battery for your whole home - set up once, used everywhere.</div>
            </div>
            <button class="dlg-x" title="Close" @click=${this._closeSettings}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>
          <div class="dlg-body">
            <div class="dlg-sec ${this._settingsFocus === 'account' ? 'focus' : ''}" data-sec="account">
              <shs-account-prices
                .hass=${this.hass}
                @account-changed=${this._handleAccountChanged}>
              </shs-account-prices>
            </div>
            <div class="dlg-sec ${this._settingsFocus === 'sources' ? 'focus' : ''}" data-sec="sources">
              <shs-energy-sources
                .hass=${this.hass}
                @shs-energy-sources-changed=${this._handleEnergySourcesChanged}>
              </shs-energy-sources>
            </div>
            <div class="dlg-sec ${this._settingsFocus === 'battery' ? 'focus' : ''}" data-sec="battery">
              <shs-energy-battery
                .hass=${this.hass}
                .deviceName=${'Home battery'}
                @open-device-settings=${this._scrollToAccountSection}>
              </shs-energy-battery>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async _handleEnergySourcesChanged(): Promise<void> {
    try {
      const response = await this._callWS<{ sources: Sources }>(
        { type: 'smarthomeshop/energy_sources' },
        EnergyHub.BACKGROUND_LOAD_TIMEOUT,
      );
      this._sources = response.sources || {};
      this._history = {};
      this._startHistoryLoad();

      const battery = this.renderRoot.querySelector('shs-energy-battery') as (HTMLElement & { refresh?: () => Promise<void> }) | null;
      await battery?.refresh?.();
    } catch (err) {
      console.warn('Energy source refresh failed', err);
    }
  }

  private _handleAccountChanged(event: CustomEvent<{ account?: any }>): void {
    // The battery card gates on the account status, so connecting a key in
    // the dialog must refresh it too (it sits right below the account card).
    const battery = this.renderRoot.querySelector('shs-energy-battery') as (HTMLElement & { refresh?: () => Promise<void> }) | null;
    battery?.refresh?.();
    if (event.detail?.account) {
      this._account = event.detail.account;
      this._watchAccountRefresh(event.detail.account, true);
      return;
    }
    this._startAccountLoad('smarthomeshop/account');
  }

  private _batterySummary(): string {
    const config = this._battery || {};
    const target = config.target_soc;
    const mode = config.automatic_control ? 'Automatic execution on' : 'Advice only';
    return `${mode}${typeof target === 'number' ? ` - target ${target}%` : ''}`;
  }

  private _shortPower(watts: number): string {
    return Math.abs(watts) >= 1000 ? `${(watts / 1000).toFixed(1)}k` : String(Math.round(watts));
  }

  private _time(timestamp: number): string {
    const timeZone = this.hass.config?.time_zone;
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      ...(timeZone ? { timeZone } : {}),
    });
  }

  private _powerTime(timestamp: number): string {
    const timeZone = this.hass.config?.time_zone;
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...(timeZone ? { timeZone } : {}),
    });
  }

  private _hm(iso?: string | null): string {
    if (!iso) return '';
    const timestamp = new Date(iso).getTime();
    return Number.isFinite(timestamp) ? this._time(timestamp) : '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-energy-hub': EnergyHub;
  }
}
