/**
 * Shared styles for SmartHomeShop cards
 * Using Home Assistant CSS variables for proper theming
 * Based on: https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/
 */

import { css } from 'lit';

export const baseStyles = css`
  /*
   * Home Assistant CSS Variables Reference:
   * --primary-text-color: Main text color
   * --secondary-text-color: Muted/secondary text
   * --primary-background-color: Main background
   * --secondary-background-color: Cards/sections background
   * --card-background-color: Card background
   * --divider-color: Borders and dividers
   * --primary-color: Theme accent color
   * --text-primary-color: Text on primary color backgrounds
   * --error-color: Red for errors/alerts
   * --warning-color: Orange for warnings
   * --success-color: Green for success states
   * --info-color: Blue for information
   * --state-icon-color: Default icon color
   */

  :host {
    display: block;
    container-type: inline-size;
    --shs-surface: color-mix(
      in srgb,
      var(--secondary-background-color) 78%,
      var(--card-background-color)
    );
    --shs-surface-hover: color-mix(
      in srgb,
      var(--primary-color) 6%,
      var(--shs-surface)
    );
    --shs-outline: color-mix(in srgb, var(--divider-color) 88%, transparent);
  }

  ha-card {
    height: 100%;
    overflow: hidden;
  }

  .card-content {
    padding: 16px;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .header-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
    transition: transform 180ms ease-out, background-color 180ms ease-out;
  }

  .header-icon ha-icon {
    --mdc-icon-size: 24px;
  }

  .header-icon svg {
    width: 26px;
    height: 26px;
    display: block;
  }

  .header-icon.flowing {
    animation: pulse 1.5s ease-in-out infinite;
    background: var(--primary-color);
    color: var(--text-primary-color);
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .header-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
    line-height: 1.2;
  }

  .header-subtitle {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  /* Status badges */
  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    transition: background-color 180ms ease-out, color 180ms ease-out;
  }

  .status-badge ha-icon {
    --mdc-icon-size: 16px;
  }

  .status-ok {
    background: color-mix(in srgb, var(--success-color) 15%, transparent);
    color: var(--success-color);
  }

  .status-active {
    background: color-mix(in srgb, var(--info-color) 15%, transparent);
    color: var(--info-color);
  }

  .status-alert {
    background: color-mix(in srgb, var(--error-color) 15%, transparent);
    color: var(--error-color);
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* Compact meter calibration (shared by water cards) */
  .meter-counter-section {
    background: var(--shs-surface);
    border-radius: 12px;
    padding: 10px;
    margin-top: 12px;
    border: 1px solid var(--shs-outline);
  }

  .meter-counter-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .meter-counter-upgrade {
    display: flex;
    align-items: center;
    gap: 10px;
    background: color-mix(in srgb, var(--warning-color) 8%, var(--shs-surface));
    border-color: color-mix(in srgb, var(--warning-color) 35%, var(--shs-outline));
  }

  .meter-counter-upgrade .meter-counter-icon {
    background: color-mix(in srgb, var(--warning-color) 14%, transparent);
    color: var(--warning-color);
  }

  .meter-counter-reading {
    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px;
    text-align: left;
    cursor: pointer;
  }

  .meter-counter-icon {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--info-color) 13%, transparent);
    color: var(--info-color);
  }

  .meter-counter-icon ha-icon { --mdc-icon-size: 20px; }

  .meter-counter-copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .meter-counter-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--primary-text-color);
  }

  .meter-counter-subtitle {
    font-size: 11px;
    line-height: 1.2;
    color: var(--secondary-text-color);
  }

  .meter-counter-value {
    margin-left: auto;
    white-space: nowrap;
    font-size: 16px;
    font-weight: 650;
    color: var(--primary-text-color);
  }

  .meter-counter-value span {
    margin-left: 3px;
    font-size: 11px;
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .meter-counter-calibrate {
    appearance: none;
    border: 1px solid var(--shs-outline);
    background: var(--card-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 36px;
    padding: 0 10px;
    border-radius: 10px;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    color: var(--info-color);
    cursor: pointer;
    transition: background-color 180ms ease-out, border-color 180ms ease-out;
  }

  .meter-counter-calibrate:hover,
  .meter-counter-calibrate[aria-expanded='true'] {
    border-color: color-mix(in srgb, var(--info-color) 45%, var(--divider-color));
    background: color-mix(in srgb, var(--info-color) 9%, var(--card-background-color));
  }

  .meter-counter-calibrate ha-icon { --mdc-icon-size: 16px; }

  /* Inline "set meter reading" form */
  .meter-form {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--shs-outline);
  }
  .meter-form-help {
    font-size: 12px;
    line-height: 1.5;
    color: var(--secondary-text-color);
    margin-bottom: 10px;
  }
  .meter-form-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .meter-form-row input {
    flex: 1;
    min-width: 0;
    background: var(--secondary-background-color, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.15));
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 15px;
    color: var(--primary-text-color);
    outline: none;
  }
  .meter-form-row input:focus {
    border-color: var(--primary-color);
  }
  .meter-form-unit {
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  .meter-form-save {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .meter-form-save:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Value display - main metric */
  .value-display {
    background: var(--shs-surface);
    border: 1px solid var(--shs-outline);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: background-color 180ms ease-out, border-color 180ms ease-out;
  }

  .value-display:hover {
    background: var(--shs-surface-hover);
    border-color: color-mix(in srgb, var(--primary-color) 28%, var(--divider-color));
  }

  .value-display::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--divider-color);
    transition: background 0.3s ease;
  }

  .value-display.active::before {
    background: var(--primary-color);
  }

  .value-big {
    font-size: 2rem;
    font-weight: 600;
    color: var(--primary-text-color);
    line-height: 1;
  }

  .value-unit {
    font-size: 1rem;
    color: var(--secondary-text-color);
    margin-left: 4px;
    font-weight: 400;
  }

  .value-label {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    margin-top: 8px;
    text-transform: uppercase;
    letter-spacing: 0;
    font-weight: 500;
  }

  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .stat-item {
    background: var(--shs-surface);
    border: 1px solid var(--shs-outline);
    border-radius: 12px;
    padding: 12px 8px;
    text-align: center;
    cursor: pointer;
    transition: background-color 180ms ease-out, border-color 180ms ease-out;
  }

  .stat-item:hover {
    background: var(--shs-surface-hover);
    border-color: color-mix(in srgb, var(--primary-color) 25%, var(--divider-color));
  }

  .stat-value {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .stat-unit {
    font-size: 0.65rem;
    color: var(--secondary-text-color);
    font-weight: 400;
  }

  .stat-label {
    font-size: 0.65rem;
    color: var(--secondary-text-color);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  /* Graph section */
  .graph-section {
    background: var(--shs-surface);
    border: 1px solid var(--shs-outline);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .graph-section:hover {
    background: var(--shs-surface-hover);
  }

  .graph-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .graph-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .graph-max {
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    opacity: 0.8;
  }

  .sparkline {
    width: 100%;
    height: 50px;
  }

  .sparkline-fill {
    fill: url(#gradient);
  }

  .sparkline-line {
    fill: none;
    stroke: var(--primary-color);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .graph-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
  }

  .graph-labels span {
    font-size: 0.6rem;
    color: var(--secondary-text-color);
    opacity: 0.7;
  }

  /* Info bar (leak detection) */
  .info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--shs-surface);
    border: 1px solid var(--shs-outline);
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .info-bar:hover {
    background: var(--shs-surface-hover);
  }

  .info-bar.alert {
    background: color-mix(in srgb, var(--error-color) 10%, var(--secondary-background-color));
    border: 1px solid color-mix(in srgb, var(--error-color) 30%, transparent);
  }

  .info-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .info-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-icon.ok {
    background: color-mix(in srgb, var(--success-color) 15%, transparent);
    color: var(--success-color);
  }

  .info-icon.alert {
    background: color-mix(in srgb, var(--error-color) 15%, transparent);
    color: var(--error-color);
  }

  .info-icon ha-icon {
    --mdc-icon-size: 20px;
  }

  .info-text {
    font-size: 0.85rem;
    color: var(--primary-text-color);
    font-weight: 500;
  }

  .info-subtext {
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  .info-right {
    text-align: right;
    cursor: pointer;
  }

  .info-right ha-icon {
    --mdc-icon-size: 20px;
    color: var(--secondary-text-color);
  }

  .info-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--primary-text-color);
  }

  .info-label {
    font-size: 0.65rem;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  /* Section divider */
  .section-divider {
    height: 1px;
    background: var(--divider-color);
    margin: 16px 0;
  }

  /* Section headers */
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    letter-spacing: 0;
  }

  .section-header ha-icon {
    --mdc-icon-size: 18px;
  }

  .section-header.water {
    color: var(--info-color);
  }

  .section-header.energy {
    color: var(--warning-color);
  }

  /* Dual stats for energy section */
  .dual-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  .dual-stats .stat-item {
    padding: 14px 10px;
  }

  /* Domain-specific accent colors using HA variables */
  .water-accent {
    --domain-color: var(--info-color);
  }

  .energy-accent {
    --domain-color: var(--warning-color);
  }

  .alert-accent {
    --domain-color: var(--error-color);
  }

  .success-accent {
    --domain-color: var(--success-color);
  }

  @container (max-width: 430px) {
    .card-content {
      padding: 14px;
    }

    .header {
      align-items: flex-start;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      flex-basis: 40px;
    }

    .status-badge {
      padding: 6px 8px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .meter-counter-main {
      align-items: stretch;
      flex-wrap: wrap;
    }

    .meter-counter-reading {
      flex-basis: calc(100% - 48px);
    }

    .meter-counter-calibrate {
      width: 40px;
      padding: 0;
    }

    .meter-counter-calibrate span {
      display: none;
    }

    .meter-form-row {
      flex-wrap: wrap;
    }

    .meter-form-row input {
      flex-basis: calc(100% - 42px);
    }

    .meter-form-save {
      width: 100%;
    }
  }
`;
