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
  @state() private _baseUrlInput = '';
  @state() private _showAdvanced = false;
  @state() private _savingKey = false;
  @state() private _showKeyForm = false;
  @state() private _syncing = false;
  @state() private _contracts: any[] = [];
  @state() private _locations: any[] = [];
  @state() private _error: string | null = null;
  private _refreshFollow?: Promise<void>;

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
    .contract-row { display: flex; align-items: center; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
    .contract-row label { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
    .contract-row select { flex: 1; min-width: 200px; padding: 9px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 13px; font-family: inherit; }
    .contract-row select:focus { outline: none; border-color: var(--shs-primary); }
    .summary-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .chip-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--secondary-text-color); background: var(--secondary-background-color); border-radius: 999px; padding: 4px 12px; }
    .chip-tag.good { color: #22c55e; background: rgba(34,197,94,0.12); }
    .chip-tag ha-icon { --mdc-icon-size: 14px; }
    .chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 14px; }
    .chip { background: var(--secondary-background-color); border-radius: 10px; padding: 10px 12px; }
    .chip.clickable { cursor: pointer; transition: background 0.12s, transform 0.12s; }
    .chip.clickable:hover { background: var(--divider-color); transform: translateY(-1px); }
    .chip.clickable:active { transform: none; }
    .chip-label { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
    .chip-value { font-size: 16px; font-weight: 700; color: var(--primary-text-color); margin-top: 2px; }
    .chip-value .unit { font-size: 11px; font-weight: 400; color: var(--secondary-text-color); }
    .form { display: flex; gap: 8px; margin-top: 14px; }
    .form input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 8px; background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: inherit; }
    .form input:focus { outline: none; border-color: var(--shs-primary); }
    .actions { display: flex; gap: 10px; margin-top: 14px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border: none; }
    .btn ha-icon { --mdc-icon-size: 16px; }
    .sync-info { display: flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 11.5px; color: var(--secondary-text-color); }
    .sync-info ha-icon { --mdc-icon-size: 15px; color: var(--shs-primary); }
    .btn.primary { background: var(--shs-primary); color: #fff; }
    .btn.primary:disabled { opacity: 0.5; cursor: default; }
    .btn.ghost { background: transparent; border: 1px solid var(--divider-color); color: var(--primary-text-color); }
    .btn.ghost.danger { color: #ef4444; }
    .hint { font-size: 11.5px; color: var(--secondary-text-color); margin-top: 12px; line-height: 1.5; }
    .warn { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); border-radius: 8px; padding: 10px 12px; margin-top: 10px; font-size: 12px; color: var(--primary-text-color); line-height: 1.45; }
    .hint code { background: var(--secondary-background-color); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
    .linkbtn { margin-top: 10px; background: none; border: none; padding: 0; color: var(--shs-primary); font-size: 12px; font-family: inherit; cursor: pointer; }
    .linkbtn:hover { text-decoration: underline; }
    .error-banner { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 12px; border-radius: 8px; font-size: 12.5px; background: rgba(239,68,68,0.1); color: #ef4444; }
    .error-banner ha-icon { --mdc-icon-size: 16px; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._load();
  }

  private async _callWS<T = any>(message: Record<string, unknown>, timeoutMs = 20000): Promise<T> {
    let timeoutId: number | undefined;
    try {
      return await Promise.race([
        this.hass.callWS<T>(message),
        new Promise<T>((_, reject) => {
          timeoutId = window.setTimeout(
            () => reject(new Error('The connection check timed out.')),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }

  // The contract/location list is available whenever the key is valid, so it
  // must also load in the no_contract state where the user needs it to fix
  // the very problem (pick a location that has a contract).
  private _picksLoadable(status?: string): boolean {
    return status === 'ok' || status === 'no_contract';
  }

  private async _load(): Promise<void> {
    try {
      this._account = await this._callWS({ type: 'smarthomeshop/account' }, 8000);
      this._baseUrlInput = this._account?.base_url || '';
      if (this._picksLoadable(this._account?.status)) this._loadContracts();
      this._startRefreshFollow();
    } catch (err) { console.error('account load failed', err); }
  }

  private async _loadContracts(): Promise<void> {
    try {
      const res = await this._callWS<{ contracts: any[]; locations: any[] }>(
        { type: 'smarthomeshop/account/contracts' }, 8000);
      this._contracts = res.contracts || [];
      this._locations = res.locations || [];
    } catch (err) { console.error('contracts load failed', err); }
  }

  private async _selectContract(id: string): Promise<void> {
    if (this._savingKey) return;
    this._savingKey = true;
    this._error = null;
    try {
      this._account = await this._callWS({ type: 'smarthomeshop/account/set', contract_id: id }, 12000);
      if (this._picksLoadable(this._account?.status)) void this._loadContracts();
      this._notifyAccountChanged();
      this._startRefreshFollow();
    } catch (err) {
      console.error('select contract failed', err);
      this._error = err instanceof Error ? err.message : 'Could not select the contract.';
      // A user-changed native select does not follow re-rendered attributes,
      // so reset it to the actual saved state after a failed save.
      this._resetSelect('.js-contract-select', this._account?.contract_id);
    } finally {
      this._savingKey = false;
    }
  }

  private _pinnedContractName(): string {
    const id = this._account?.contract_id;
    if (!id) return '';
    const found = this._contracts.find((c) => String(c.id) === String(id));
    return found?.name || '';
  }

  private _resetSelect(selector: string, savedId: unknown): void {
    const select = this.renderRoot?.querySelector(selector) as HTMLSelectElement | null;
    if (select) select.value = savedId == null ? '' : String(savedId);
  }

  private async _selectLocation(id: string): Promise<void> {
    if (this._savingKey) return;
    this._savingKey = true;
    this._error = null;
    try {
      // Picking a location clears any pinned contract, otherwise the pin
      // would keep overriding the location (contract wins on the server).
      this._account = await this._callWS(
        { type: 'smarthomeshop/account/set', location_id: id, contract_id: null }, 12000);
      if (this._picksLoadable(this._account?.status)) void this._loadContracts();
      this._notifyAccountChanged();
      this._startRefreshFollow();
    } catch (err) {
      console.error('select location failed', err);
      this._error = err instanceof Error ? err.message : 'Could not select the location.';
      // Nothing was saved: restore the select to the real state. With a pin
      // still active the shown option is the synthetic "__pinned" one, not
      // the location id (which is still empty).
      this._resetSelect(
        '.js-location-select',
        this._account?.contract_id ? '__pinned' : this._account?.location_id,
      );
    } finally {
      this._savingKey = false;
    }
  }

  private async _save(): Promise<void> {
    if (this._savingKey) return;
    this._savingKey = true;
    this._error = null;
    try {
      // Never send an empty api_key: the backend treats a key as write-once
      // per submit, and an empty value must not wipe a working connection.
      const payload: Record<string, unknown> = {
        type: 'smarthomeshop/account/set',
        base_url: this._baseUrlInput.trim(),
      };
      const key = this._apiKeyInput.trim();
      if (key) payload.api_key = key;
      this._account = await this._callWS(payload, 12000);
      this._apiKeyInput = '';
      this._showKeyForm = this._account?.status !== 'ok';
      if (this._picksLoadable(this._account?.status)) void this._loadContracts();
      this._notifyAccountChanged();
      this._startRefreshFollow();
    } catch (err) {
      console.error('account save failed', err);
      this._error = err instanceof Error ? err.message : 'Could not save - please try again.';
    } finally {
      this._savingKey = false;
    }
  }

  private async _syncNow(): Promise<void> {
    if (this._syncing) return;
    this._syncing = true;
    this._error = null;
    try {
      const account = await this._callWS({ type: 'smarthomeshop/account/refresh' }, 12000);
      this._account = await this._waitForRefresh(account);
      if (this._picksLoadable(this._account?.status)) this._loadContracts();
      this._notifyAccountChanged();
    } catch (err) {
      console.error('sync failed', err);
      this._error = err instanceof Error ? err.message : 'Could not refresh prices.';
    } finally {
      this._syncing = false;
    }
  }

  private _startRefreshFollow(): void {
    if (!this._account?.refreshing || this._refreshFollow) return;
    this._syncing = true;
    this._refreshFollow = this._waitForRefresh(this._account)
      .then(account => {
        this._account = account;
        if (this._picksLoadable(account?.status)) void this._loadContracts();
        this._notifyAccountChanged();
      })
      .catch(err => console.warn('price refresh status polling failed', err))
      .finally(() => {
        this._syncing = false;
        this._refreshFollow = undefined;
      });
  }

  private async _waitForRefresh(account: any): Promise<any> {
    let current = account;
    const deadline = Date.now() + 45000;
    let lastError: unknown;
    while (current?.refreshing && this.isConnected && Date.now() < deadline) {
      await new Promise(resolve => window.setTimeout(resolve, 1500));
      try {
        current = await this._callWS({ type: 'smarthomeshop/account' }, 8000);
        this._account = current;
        lastError = undefined;
      } catch (err) {
        // Home Assistant can briefly replace the WebSocket while integrations
        // are being set up. Keep following the existing background refresh.
        lastError = err;
      }
    }
    if (current?.refreshing && lastError) throw lastError;
    return current;
  }

  private _moreInfo(entityId?: string): void {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  private _notifyAccountChanged(): void {
    this.dispatchEvent(new CustomEvent('account-changed', {
      detail: { account: this._account },
      bubbles: true,
      composed: true,
    }));
  }

  private _chip(label: string, value: unknown, entityId?: string) {
    return html`
      <div class="chip ${entityId ? 'clickable' : ''}"
        title=${entityId ? 'Open in Home Assistant' : ''}
        @click=${() => this._moreInfo(entityId)}>
        <div class="chip-label">${label}</div>
        <div class="chip-value">${value}</div>
      </div>`;
  }

  private _hm(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  private _lastSyncedLabel(iso: string): string {
    try {
      const then = new Date(iso).getTime();
      const mins = Math.floor((Date.now() - then) / 60000);
      if (mins <= 0) return 'just now';
      if (mins < 60) return `${mins} min ago`;
      return `at ${this._hm(iso)}`;
    } catch {
      return '';
    }
  }

  private async _disconnect(): Promise<void> {
    this._savingKey = true;
    this._error = null;
    try {
      // Explicit null = disconnect (an empty string is ignored by the backend).
      this._account = await this._callWS({ type: 'smarthomeshop/account/set', api_key: null });
      this._notifyAccountChanged();
    } catch (err) {
      console.error('disconnect failed', err);
      this._error = err instanceof Error ? err.message : 'Could not disconnect - please try again.';
    } finally {
      this._savingKey = false;
    }
  }

  protected render() {
    const a = this._account;
    const status = a?.status || 'unconfigured';
    const cur = a?.current;
    const statusText: Record<string, string> = {
      unconfigured: 'Connect once here to use live dynamic spot prices across SmartHomeShop Energy. The integration keeps working locally without an account.',
      connecting: 'Checking your API key and loading dynamic energy prices...',
      ok: 'Connected - live prices are being fetched.',
      no_contract: 'Connected, but the selected location has no active energy contract yet, so there are no prices to show.',
      unauthorized: 'That API key is invalid or was revoked.',
      forbidden: 'The price service rejected this key. Create a new API token in your account.',
      error: 'Could not reach the price service. Check your connection and try again.',
    };
    const cls = status === 'ok' ? 'ok' : status === 'unconfigured' ? '' : 'alert';
    const badgeText: Record<string, string> = { ok: 'Connected', no_contract: 'No contract' };

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
              ${a?.has_key ? html`<span class="status-badge ${cls === 'ok' ? 'ok' : 'alert'}">${badgeText[status] || status}</span>` : nothing}
              ${status === 'error' && a?.last_error
                ? a.last_error
                : statusText[status] || statusText.error}
            </div>
          </div>

          ${this._error ? html`
            <div class="error-banner">
              <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              <span>${this._error}</span>
            </div>
          ` : nothing}

          ${this._picksLoadable(status) && this._locations.length > 0 ? html`
            <div class="contract-row">
              <label>Location</label>
              <select class="js-location-select" ?disabled=${this._savingKey}
                @change=${(e: Event) => this._selectLocation((e.target as HTMLSelectElement).value)}>
                ${a?.contract_id ? html`
                  <option value="__pinned" selected disabled>
                    Pinned contract${this._pinnedContractName() ? ` · ${this._pinnedContractName()}` : ''}
                  </option>` : nothing}
                <option value="" ?selected=${!a?.location_id && !a?.contract_id}>Active contract (automatic)</option>
                ${this._locations.map((loc) => html`
                  <option value=${String(loc.id)} ?selected=${String(a?.location_id) === String(loc.id) && !a?.contract_id}>
                    ${loc.name}${loc.active_contract
                      ? ` · ${loc.active_contract.name}${loc.active_contract.provider ? ` (${loc.active_contract.provider})` : ''}`
                      : ' · no active contract'}
                  </option>`)}
              </select>
            </div>
            <div class="hint">
              ${a?.contract_id
                ? html`SmartHomeShop Energy is pinned to a specific contract. Pick a location above to follow its active contract instead.`
                : !a?.location_id
                  ? html`<b>Active contract (automatic)</b> follows whichever contract is active in your SmartHomeShop account. Pick a location to always follow that location's active contract, so prices update by themselves when you switch contracts there.`
                  : html`Prices follow the active contract for this location and update by themselves when you change it in your SmartHomeShop account.`}
            </div>
            ${status === 'no_contract' ? html`
              <div class="warn">
                This location has no active energy contract, so no prices are shown. Add or
                activate a contract for it in your SmartHomeShop account, or pick another location.
              </div>` : nothing}
          ` : this._picksLoadable(status) && this._contracts.length > 0 ? html`
            <div class="contract-row">
              <label>Contract</label>
              <select class="js-contract-select" ?disabled=${this._savingKey}
                @change=${(e: Event) => this._selectContract((e.target as HTMLSelectElement).value)}>
                <option value="" ?selected=${!a?.contract_id}>Active contract (automatic)</option>
                ${this._contracts.map((c) => html`
                  <option value=${String(c.id)} ?selected=${String(a?.contract_id) === String(c.id)}>
                    ${c.name}${c.supplier ? ` · ${c.supplier}` : ''}
                  </option>`)}
              </select>
            </div>
            <div class="hint">
              ${!a?.contract_id
                ? html`<b>Active contract (automatic)</b> follows whichever contract is active in your SmartHomeShop account, so prices update by themselves when you switch contracts there. Pick a specific contract above to pin it instead.`
                : html`SmartHomeShop Energy is pinned to a specific contract. Choose <b>Active contract (automatic)</b> to always follow the active contract in your account instead.`}
            </div>
            ${status === 'no_contract' ? html`
              <div class="warn">
                The active contract for today has expired or is not set, so no prices are shown.
                Pin a specific contract above, or add an active contract in your SmartHomeShop account.
              </div>` : status === 'ok' && a?.contract_id && !a?.contract ? html`
              <div class="warn">
                The pinned contract no longer exists in your account, so generic prices without
                contract tariffs are used. Pick another contract above.
              </div>` : nothing}
          ` : nothing}

          ${status === 'ok' && cur ? html`
            <div class="chips">
              ${this._chip('Electricity now', html`€ ${(cur.electricity ?? 0).toFixed(3)} <span class="unit">/kWh</span>`, a?.entities?.electricity)}
              ${cur.level ? this._chip('Tariff level', html`<span style="text-transform: capitalize;">${String(cur.level).replace('_', ' ')}</span>`, a?.entities?.level) : nothing}
              ${cur.feed_in != null ? this._chip('Feed-in now', html`€ ${cur.feed_in.toFixed(3)} <span class="unit">/kWh</span>`, a?.entities?.feed_in) : nothing}
              ${cur.gas != null ? this._chip('Gas now', html`€ ${cur.gas.toFixed(3)} <span class="unit">/m³</span>`, a?.entities?.gas) : nothing}
              ${a?.contract?.tariffs?.water > 0 ? this._chip('Water', html`€ ${Number(a.contract.tariffs.water).toFixed(4)} <span class="unit">/m³</span>`) : nothing}
            </div>
            ${a?.summary ? html`
              <div class="summary-row">
                ${a.summary.cheap_now != null ? html`
                  <span class="chip-tag ${a.summary.cheap_now ? 'good' : ''}">
                    <ha-icon icon=${a.summary.cheap_now ? 'mdi:cash-clock' : 'mdi:clock-outline'}></ha-icon>
                    ${a.summary.cheap_now ? 'Cheap right now' : 'Above average now'}
                  </span>
                ` : nothing}
                ${a.summary.cheapest_3h ? html`
                  <span class="chip-tag">Cheapest 3h: ${this._hm(a.summary.cheapest_3h.start)}-${this._hm(a.summary.cheapest_3h.end)} · € ${Number(a.summary.cheapest_3h.average).toFixed(3)}</span>
                ` : nothing}
                ${a.summary.average != null ? html`<span class="chip-tag">Avg today € ${Number(a.summary.average).toFixed(3)}</span>` : nothing}
              </div>
            ` : nothing}
            <div class="hint">
              Point the Home Assistant Energy Dashboard at
              <code>sensor.smarthomeshop_energy_prices_electricity_price</code>
              ("use an entity with current price") for accurate dynamic cost tracking. There are
              also sensors for the average/low/high price and the cheapest 1-6&nbsp;hour blocks,
              plus a <code>binary_sensor...cheap_electricity_now</code> for easy automations.
            </div>
          ` : nothing}

          ${a?.has_key && status === 'ok' ? html`
            <div class="sync-info">
              <ha-icon icon="mdi:sync"></ha-icon>
              <span>
                ${a?.last_synced ? `Last synced ${this._lastSyncedLabel(a.last_synced)}` : 'Not synced yet'}
                · auto-syncs every ${a?.interval_minutes ?? 30} min
              </span>
            </div>
          ` : nothing}

          ${a?.has_key && !this._showKeyForm ? html`
            <div class="actions">
              <button class="btn primary" ?disabled=${this._syncing} @click=${this._syncNow}>
                <ha-icon icon="mdi:sync"></ha-icon> ${this._syncing ? 'Syncing...' : 'Sync now'}
              </button>
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
                ${this._savingKey ? 'Connecting...' : 'Connect'}
              </button>
              ${a?.has_key ? html`
                <button class="btn ghost" @click=${() => { this._showKeyForm = false; this._apiKeyInput = ''; }}>Cancel</button>
              ` : nothing}
            </div>
            <div class="hint">
              Fixed prices are set above and are free. For live dynamic spot prices, create an
              API key in your account at <b>smarthomeshop.io → Settings → API tokens</b>
              (free with any account) and paste it here.
            </div>
            <button class="linkbtn" @click=${() => { this._showAdvanced = !this._showAdvanced; }}>
              ${this._showAdvanced ? 'Hide advanced' : 'Advanced'}
            </button>
            ${this._showAdvanced ? html`
              <div class="form" style="margin-top: 8px;">
                <input type="text" placeholder="https://api.smarthomeshop.io" autocomplete="off"
                  .value=${this._baseUrlInput}
                  @input=${(e: Event) => { this._baseUrlInput = (e.target as HTMLInputElement).value; }} />
              </div>
              <div class="hint">Server URL - leave empty for the default. Only change this for self-hosting or local testing.</div>
            ` : nothing}
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
