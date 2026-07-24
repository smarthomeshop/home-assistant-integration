import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types/home-assistant';

type EnergyCardType = 'live' | 'price' | 'power' | 'savings' | 'automations';

@customElement('smarthomeshop-energy-card-editor')
export class SmartHomeShopEnergyCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ attribute: false }) public cardType: EnergyCardType = 'live';
  @state() private config: Record<string, any> = {};

  static styles = css`
    :host { display: block; }
    * { box-sizing: border-box; }
    .intro {
      margin-bottom: 17px;
      padding: 12px 13px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      border-radius: 10px;
      color: var(--secondary-text-color);
      background: color-mix(in srgb, var(--primary-color) 8%, var(--card-background-color));
      font-size: 12px;
      line-height: 1.45;
    }
    .intro ha-icon { --mdc-icon-size: 19px; flex: 0 0 auto; color: var(--primary-color); }
    .field { margin-bottom: 16px; }
    .label, .section-title {
      display: block;
      margin-bottom: 6px;
      color: var(--primary-text-color);
      font-size: 12px;
      font-weight: 650;
    }
    .section-title {
      margin: 19px 0 10px;
      color: var(--secondary-text-color);
      font-size: 10.5px;
      letter-spacing: .6px;
      text-transform: uppercase;
    }
    input[type="text"], select {
      width: 100%;
      min-height: 42px;
      padding: 9px 11px;
      border: 1px solid var(--divider-color);
      border-radius: 9px;
      outline: 0;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }
    input[type="text"]:focus, select:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color);
    }
    .toggle {
      min-height: 43px;
      padding: 9px 2px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 72%, transparent);
      cursor: pointer;
    }
    .toggle:last-child { border-bottom: 0; }
    .toggle-copy { min-width: 0; }
    .toggle-name { color: var(--primary-text-color); font-size: 13px; font-weight: 560; }
    .toggle-note { margin-top: 2px; color: var(--secondary-text-color); font-size: 10.5px; line-height: 1.35; }
    input[type="checkbox"] { width: 19px; height: 19px; flex: 0 0 auto; accent-color: var(--primary-color); }
    .pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    @media (max-width: 420px) { .pair { grid-template-columns: 1fr; } }
  `;

  public setConfig(config: Record<string, any>): void {
    this.config = { ...config };
  }

  private setValue(key: string, value: unknown): void {
    const next = { ...this.config };
    if (value === undefined || value === '') delete next[key];
    else next[key] = value;
    this.config = next;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: next },
      bubbles: true,
      composed: true,
    }));
  }

  private toggle(
    key: string,
    name: string,
    note: string,
    defaultValue = true,
  ) {
    const checked = this.config[key] ?? defaultValue;
    return html`
      <label class="toggle">
        <span class="toggle-copy"><span class="toggle-name">${name}</span><span class="toggle-note">${note}</span></span>
        <input type="checkbox" .checked=${checked} @change=${(event: Event) =>
          this.setValue(key, (event.target as HTMLInputElement).checked)}>
      </label>
    `;
  }

  protected render() {
    return html`
      <div class="intro">
        <ha-icon icon="mdi:lightning-bolt-outline"></ha-icon>
        <span>Uses the entities and energy contract configured in SmartHomeShop Energy settings. No duplicate entity setup is needed in this card.</span>
      </div>
      <div class="field">
        <label class="label" for="title">Card title (optional)</label>
        <input id="title" type="text" .value=${this.config.title || ''}
          placeholder=${this._defaultTitle()}
          @input=${(event: Event) => this.setValue('title', (event.target as HTMLInputElement).value)}>
      </div>
      ${this.toggle('show_header', 'Show card header', 'Title, icon and a short explanation')}
      <div class="section-title">Content</div>
      ${this._typeFields()}
    `;
  }

  private _defaultTitle(): string {
    return {
      live: 'Live energy',
      price: 'Price outlook',
      power: 'Power trend',
      savings: 'Smart savings',
      automations: 'Smart automations',
    }[this.cardType];
  }

  private _typeFields() {
    if (this.cardType === 'live') {
      return html`
        ${this.toggle('show_home', 'Home consumption', 'Large calculated consumption overview')}
        ${this.toggle('show_grid', 'Grid', 'Current grid import or export')}
        ${this.toggle('show_solar', 'Solar', 'Live solar production when configured')}
        ${this.toggle('show_battery', 'Battery', 'Battery flow and state of charge')}
      `;
    }
    if (this.cardType === 'price') {
      return html`
        <div class="pair">
          <div class="field">
            <label class="label" for="day">Initial day</label>
            <select id="day" .value=${this.config.day || 'auto'}
              @change=${(event: Event) => this.setValue('day', (event.target as HTMLSelectElement).value)}>
              <option value="auto">Automatic</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
          </div>
          <div class="field">
            <label class="label" for="hours">Cheapest block</label>
            <select id="hours" .value=${String(this.config.cheapest_hours || 3)}
              @change=${(event: Event) => this.setValue('cheapest_hours', Number((event.target as HTMLSelectElement).value))}>
              ${[1, 2, 3, 4, 5, 6].map((hours) => html`<option value=${hours}>${hours} hour${hours > 1 ? 's' : ''}</option>`)}
            </select>
          </div>
        </div>
        ${this.toggle('show_facts', 'Price insights', 'Daily average, low, high and feed-in facts')}
        ${this.toggle('show_cheapest_block', 'Cheapest block', 'Show the best consecutive period below the chart')}
      `;
    }
    if (this.cardType === 'power') {
      return html`
        ${this.toggle('show_summary', 'Current and peak values', 'Summary strip above the graph')}
        ${this.toggle('show_grid_import', 'Grid import line', 'Power drawn from the grid')}
        ${this.toggle('show_grid_export', 'Grid export line', 'Power returned to the grid')}
        ${this.toggle('show_solar', 'Solar line', 'Solar production during the day')}
        ${this.toggle('show_battery', 'Battery line', 'Charging and discharging power')}
      `;
    }
    if (this.cardType === 'savings') {
      return html`
        ${this.toggle('show_breakdown', 'Today’s breakdown', 'Separate battery and schedule contributions')}
        ${this.toggle('show_explanation', 'Measurement explanation', 'Explain how Smart Savings is calculated')}
      `;
    }
    if (this.cardType === 'automations') {
      return html`
        <div class="field">
          <label class="label" for="view">Card density</label>
          <select id="view" .value=${this.config.view || 'expanded'}
            @change=${(event: Event) => this.setValue('view', (event.target as HTMLSelectElement).value)}>
            <option value="expanded">Expanded — status and details</option>
            <option value="compact">Compact — status only</option>
          </select>
        </div>
        ${this.toggle('show_schedules', 'Deadline schedules', 'Show ready-by schedules below reactive automations')}
        ${this.toggle('show_controls', 'Quick controls', 'Pause and resume directly from the card')}
        ${this.toggle('show_last_triggered', 'Last triggered', 'Show when each automation last ran')}
      `;
    }
    return nothing;
  }
}
