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
    margin-bottom: 16px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
    transition: all 0.3s ease;
  }

  .header-icon ha-icon {
    --mdc-icon-size: 28px;
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
    font-size: 1.1rem;
    font-weight: 500;
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
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
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

  /* Value display - main metric */
  .value-display {
    background: var(--secondary-background-color);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 12px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .value-display:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
    font-size: 2.5rem;
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
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }

  .stat-item {
    background: var(--secondary-background-color);
    border-radius: 12px;
    padding: 12px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .stat-item:hover {
    background: color-mix(in srgb, var(--primary-color) 10%, var(--secondary-background-color));
    transform: translateY(-2px);
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
    letter-spacing: 0.3px;
  }

  /* Graph section */
  .graph-section {
    background: var(--secondary-background-color);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .graph-section:hover {
    background: color-mix(in srgb, var(--primary-color) 5%, var(--secondary-background-color));
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
    background: var(--secondary-background-color);
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .info-bar:hover {
    background: color-mix(in srgb, var(--primary-color) 5%, var(--secondary-background-color));
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
`;
