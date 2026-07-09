import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';

/**
 * Optional account connection for dynamic energy prices.
 * The integration itself is fully local; this only pulls live spot prices
 * from the SmartHomeShop.io account API when a key is provided.
 */
@customElement('shs-account-prices')
export class AccountPrices extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _account: any | null = null;
  @state() private _apiKeyInput = '';
  @state() private _savingKey = false;
  @state() private _showKeyForm = false;

  static styles = css`
    :host { display: block; --shs-primary: #4361ee; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; margin-bottom: 20px; }
    .head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--divider-color); }
    .head ha-icon { color: var(--shs-primary); --mdc-icon-size: 18px; }
    .head-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color); flex: 1; }
    .optional { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--secondary-text-color); background: var(--secondary-background-color); padding: 2px 8px; border-radius: 999px; }
    .body { padding: 16px; }
    .status { display: flex; align-items: center; gap: 12px; }
    .status-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(148,163,184,0.15); color: var(--secondary-text-color); flex-shrink: 0; }
    .status-icon.ok { background: rgba(34,197,94,0.15); color: #22c55e; }
    .status-icon.alert { background: rgba(239,68,68,0.12); color: #ef4444; }
    .status-icon ha-icon { --mdc-icon-size: 20px; }
    .status-text { font-size: 13px; color: var(--secondary-text-color); line-height: 1.45; }
    .status-badge { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; text-transform: capitalize; margin-left: 6px; }
    .status-badge.ok { background: rgba(34,197,94,0.12); color: #22c55e; }
    .status-badge.alert { background: rgba(239,68,68,0.12); color: #ef4444; }
    .chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 14px; }
    .chip { background: var(--secondary-background-color); border-radius: 10px; padding: 10px 12px; }
    .chip-label { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
    .chip-value { font-size: 16px; font-weight: 700; color: var(--primary-text-color); margin-top: 2px; }
    .chip-value .unit { font-size: 11px; font-weight: 400; color: var(--secondary-text-color); }
    .form { display: flex; gap: 8px; margin-top: 14px; }
    .form input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .form input:focus { outline: none; border-color: var(--shs-primary); }
    .actions { display: flex; gap: 10px; margin-top: 14px; }
    .btn { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border: none; }
    .btn.primary { background: var(--shs-primary); color: #fff; }
    .btn.primary:disabled { opacity: 0.5; cursor: default; }
    .btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .btn.ghost.danger { color: #ef4444; }
    .hint { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 12px; line-height: 1.5; }
    .hint code { background: var(--secondary-background-color); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  private async _load(): Promise<void> {
    try {
      this._account = await this.hass.callWS({ type: 'smarthomeshop/account' });
    } catch (err) { console.error('account load failed', err); }
  }

  private async _save(): Promise<void> {
    if (this._savingKey) return;
    this._savingKey = true;
    try {
      this._account = await this.hass.callWS({ type: 'smarthomeshop/account/set', api_key: this._apiKeyInput.trim() });
      this._apiKeyInput = '';
      this._showKeyForm = false;
    } catch (err) { console.error('account save failed', err); }
    this._savingKey = false;
  }

  private async _disconnect(): Promise<void> {
    this._savingKey = true;
    try {
      this._account = await this.hass.callWS({ type: 'smarthomeshop/account/set', api_key: '' });
    } catch (err) { console.error('disconnect failed', err); }
    this._savingKey = false;
  }

  protected render() {
    const a = this._account;
    const status = a?.status || 'unconfigured';
    const cur = a?.current;
    const statusText: Record<string, string> = {
      unconfigured: 'The integration works fully locally — no account needed. Connect a key only to pull live dynamic spot prices.',
      ok: 'Connected — live prices are being fetched.',
      unauthorized: 'That API key is invalid or was revoked.',
      forbidden: 'The price service rejected this key. Create a new API token in your account.',
      error: 'Could not reach the price service. Check your connection and try again.',
    };
    const cls = status === 'ok' ? 'ok' : status === 'unconfigured' ? '' : 'alert';

    return html`
      <div class="card">
        <div class="head">
          <ha-icon icon="mdi:flash"></ha-icon>
          <span class="head-title">Dynamic energy prices</span>
          <span class="optional">Optional</span>
        </div>
        <div class="body">
          <div class="status">
            <div class="status-icon ${cls}"><ha-icon icon="mdi:cloud-outline"></ha-icon></div>
            <div class="status-text">
              ${a?.has_key ? html`<span class="status-badge ${cls === 'ok' ? 'ok' : 'alert'}">${status === 'ok' ? 'Connected' : status}</span>` : nothing}
              ${statusText[status] || statusText.error}
            </div>
          </div>

          ${status === 'ok' && cur ? html`
            <div class="chips">
              <div class="chip"><div class="chip-label">Electricity now</div><div class="chip-value">€ ${(cur.electricity ?? 0).toFixed(3)} <span class="unit">/kWh</span></div></div>
              ${cur.level ? html`<div class="chip"><div class="chip-label">Tariff level</div><div class="chip-value" style="text-transform: capitalize;">${String(cur.level).replace('_', ' ')}</div></div>` : nothing}
              ${cur.feed_in != null ? html`<div class="chip"><div class="chip-label">Feed-in now</div><div class="chip-value">€ ${cur.feed_in.toFixed(3)} <span class="unit">/kWh</span></div></div>` : nothing}
              ${cur.gas != null ? html`<div class="chip"><div class="chip-label">Gas now</div><div class="chip-value">€ ${cur.gas.toFixed(3)} <span class="unit">/m³</span></div></div>` : nothing}
            </div>
            <div class="hint">
              Point the Home Assistant Energy Dashboard at
              <code>sensor.smarthomeshop_energy_prices_electricity_price</code>
              ("use an entity with current price") for accurate dynamic cost tracking.
            </div>
          ` : nothing}

          ${a?.has_key && !this._showKeyForm ? html`
            <div class="actions">
              <button class="btn ghost" @click=${() => { this._showKeyForm = true; }}>Replace key</button>
              <button class="btn ghost danger" ?disabled=${this._savingKey} @click=${this._disconnect}>Disconnect</button>
            </div>
          ` : html`
            <div class="form">
              <input type="password" placeholder="Paste your API key" autocomplete="off"
                .value=${this._apiKeyInput}
                @input=${(e: Event) => { this._apiKeyInput = (e.target as HTMLInputElement).value; }}
                @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' && this._apiKeyInput.trim()) this._save(); }} />
              <button class="btn primary" ?disabled=${!this._apiKeyInput.trim() || this._savingKey} @click=${this._save}>
                ${this._savingKey ? 'Connecting…' : 'Connect'}
              </button>
            </div>
            <div class="hint">
              Fixed prices are set above and are free. For live dynamic spot prices, create an
              API key in your account at <b>smarthomeshop.io → Settings → API tokens</b>
              (free with any account) and paste it here.
            </div>
          `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-account-prices': AccountPrices;
  }
}
