import { LitElement, css, html, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from '../types';
import { evaluateRadarOrientationWalk } from '../utils/radar-installation';
import { settingsText } from '../utils/settings-translations';

export interface CalibrationPoint {
  x: number;
  y: number;
}

export interface CalibrationTarget extends CalibrationPoint {
  active: boolean;
}

const CAPTURE_DURATION_MS = 5000;
const ORIENTATION_CAPTURE_DURATION_MS = 4000;
const ORIENTATION_CAPTURE_TIMEOUT_MS = 12000;
const CORNER_KEYS = ['near_left', 'near_right', 'far_right', 'far_left'] as const;
const CALIBRATION_COPY = {
  en: {
    title: 'Calibrate sensor coverage', intro: 'Walk to each measurement point and stand still for five seconds.', back: 'Back to radar settings', close: 'Close',
    measure_title: 'You are measuring the sensor, not the room', measure_text: 'Choose four positions where {radar} still detects you reliably. The points may be in front of the walls.',
    preview: 'Live sensor coverage preview', live: 'Live target', saved: 'Saved point', progress: 'Calibration points', point: 'Point {current} of 4',
    none: 'No target detected. Stand where the sensor can see you.', multiple: 'Multiple targets detected. Only one person can be in view while measuring.', one: 'One target detected by {sensor}.',
    paused: 'Measurement paused', still: 'Stand still', one_required: 'Exactly one visible target is needed. The timer will continue automatically.', measuring: 'Measuring {point}...', cancel_measurement: 'Cancel measurement',
    ready: 'All four points are ready. Select a point above to measure it again, or save this detection area.', invalid: 'The measured points overlap or do not form a usable area. Select a point above and measure it again.',
    cancel: 'Cancel', save: 'Save detection area', mark: 'Mark {point}',
  },
  nl: {
    title: 'Sensorbereik kalibreren', intro: 'Loop naar elk meetpunt en sta vijf seconden stil tijdens het meten.', back: 'Terug naar radarinstellingen', close: 'Sluiten',
    measure_title: 'Je meet de sensor, niet de kamer', measure_text: 'Kies vier plekken waar {radar} je nog betrouwbaar ziet. De punten mogen vóór de muren liggen.',
    preview: 'Live voorbeeld van het sensorbereik', live: 'Live doel', saved: 'Opgeslagen punt', progress: 'Kalibratiepunten', point: 'Meetpunt {current} van 4',
    none: 'Geen doel gedetecteerd. Ga staan waar de sensor je kan zien.', multiple: 'Meerdere doelen gedetecteerd. Tijdens het meten mag maar één persoon zichtbaar zijn.', one: 'Eén doel gedetecteerd door {sensor}.',
    paused: 'Meting gepauzeerd', still: 'Blijf stilstaan', one_required: 'Er is precies één zichtbaar doel nodig. De timer gaat automatisch verder.', measuring: '{point} wordt gemeten...', cancel_measurement: 'Meting annuleren',
    ready: 'Alle vier punten zijn klaar. Kies hierboven een punt om opnieuw te meten of sla dit detectiegebied op.', invalid: 'De gemeten punten overlappen of vormen geen bruikbaar gebied. Kies hierboven een punt en meet opnieuw.',
    cancel: 'Annuleren', save: 'Detectiegebied opslaan', mark: '{point} meten',
  },
  de: {
    title: 'Sensorbereich kalibrieren', intro: 'Gehe zu jedem Messpunkt und bleibe fünf Sekunden still stehen.', back: 'Zurück zu den Radareinstellungen', close: 'Schließen',
    measure_title: 'Du misst den Sensor, nicht den Raum', measure_text: 'Wähle vier Positionen, an denen {radar} dich noch zuverlässig erkennt. Die Punkte dürfen vor den Wänden liegen.',
    preview: 'Live-Vorschau des Sensorbereichs', live: 'Live-Ziel', saved: 'Gespeicherter Punkt', progress: 'Kalibrierungspunkte', point: 'Messpunkt {current} von 4',
    none: 'Kein Ziel erkannt. Stelle dich in den Sichtbereich des Sensors.', multiple: 'Mehrere Ziele erkannt. Während der Messung darf nur eine Person sichtbar sein.', one: 'Ein Ziel von {sensor} erkannt.',
    paused: 'Messung pausiert', still: 'Still stehen', one_required: 'Genau ein sichtbares Ziel ist erforderlich. Der Timer läuft automatisch weiter.', measuring: '{point} wird gemessen...', cancel_measurement: 'Messung abbrechen',
    ready: 'Alle vier Punkte sind bereit. Wähle oben einen Punkt für eine neue Messung oder speichere den Bereich.', invalid: 'Die Messpunkte überlappen oder bilden keinen nutzbaren Bereich. Wähle einen Punkt und miss erneut.',
    cancel: 'Abbrechen', save: 'Erkennungsbereich speichern', mark: '{point} messen',
  },
  fr: {
    title: 'Étalonner la portée du capteur', intro: 'Allez à chaque point de mesure et restez immobile pendant cinq secondes.', back: 'Retour aux réglages du radar', close: 'Fermer',
    measure_title: 'Vous mesurez le capteur, pas la pièce', measure_text: 'Choisissez quatre positions où {radar} vous détecte encore de façon fiable. Les points peuvent être devant les murs.',
    preview: 'Aperçu en direct de la portée', live: 'Cible en direct', saved: 'Point enregistré', progress: 'Points d\'étalonnage', point: 'Point {current} sur 4',
    none: 'Aucune cible détectée. Placez-vous dans le champ du capteur.', multiple: 'Plusieurs cibles détectées. Une seule personne doit être visible pendant la mesure.', one: 'Une cible détectée par {sensor}.',
    paused: 'Mesure en pause', still: 'Restez immobile', one_required: 'Une seule cible visible est nécessaire. Le minuteur reprendra automatiquement.', measuring: 'Mesure de {point}...', cancel_measurement: 'Annuler la mesure',
    ready: 'Les quatre points sont prêts. Sélectionnez un point pour le remesurer ou enregistrez la zone.', invalid: 'Les points se chevauchent ou ne forment pas une zone utilisable. Sélectionnez un point et recommencez.',
    cancel: 'Annuler', save: 'Enregistrer la zone de détection', mark: 'Mesurer {point}',
  },
  es: {
    title: 'Calibrar la cobertura del sensor', intro: 'Ve a cada punto de medición y permanece quieto durante cinco segundos.', back: 'Volver a los ajustes del radar', close: 'Cerrar',
    measure_title: 'Estás midiendo el sensor, no la habitación', measure_text: 'Elige cuatro posiciones donde {radar} aún te detecte de forma fiable. Los puntos pueden quedar delante de las paredes.',
    preview: 'Vista previa de la cobertura en directo', live: 'Objetivo en directo', saved: 'Punto guardado', progress: 'Puntos de calibración', point: 'Punto {current} de 4',
    none: 'No se detecta ningún objetivo. Colócate donde el sensor pueda verte.', multiple: 'Se detectan varios objetivos. Solo puede haber una persona visible durante la medición.', one: '{sensor} detecta un objetivo.',
    paused: 'Medición en pausa', still: 'No te muevas', one_required: 'Se necesita exactamente un objetivo visible. El temporizador continuará automáticamente.', measuring: 'Midiendo {point}...', cancel_measurement: 'Cancelar medición',
    ready: 'Los cuatro puntos están listos. Selecciona uno para repetirlo o guarda el área.', invalid: 'Los puntos se solapan o no forman un área útil. Selecciona un punto y vuelve a medirlo.',
    cancel: 'Cancelar', save: 'Guardar área de detección', mark: 'Medir {point}',
  },
} as const;

export class SensorCoverageCalibration extends LitElement {
  @property({ type: Array }) targets: CalibrationTarget[] = [];
  @property({ type: Array }) initialCorners: CalibrationPoint[] = [];
  @property({ type: Number }) range = 6000;
  @property({ type: Number }) fov = 120;
  @property({ type: String }) sensorName = 'Selected sensor';
  @property({ type: String }) mountingMode: 'wall' | 'ceiling' = 'wall';
  @property({ type: String }) radarModel = 'positioning radar';
  @property({ attribute: false }) hass?: HomeAssistant;
  @property({ type: Boolean }) requiresOrientationCheck = false;
  @property({ type: Boolean }) isRemeasurement = false;
  @property({ type: Boolean, reflect: true }) embedded = false;

  @state() private _activeCorner = 0;
  @state() private _corners: Array<CalibrationPoint | null> = [null, null, null, null];
  @state() private _capturing = false;
  @state() private _capturePaused = false;
  @state() private _captureProgress = 0;
  @state() private _orientation: Record<'forward' | 'sideways', 'idle' | 'recording' | 'passed' | 'failed'> = {
    forward: 'idle',
    sideways: 'idle',
  };

  private _captureFrame: number | null = null;
  private _captureCancelled = false;
  private _orientationFrame: number | null = null;
  private _initialized = false;
  private _hasInteracted = false;
  private _initialCornersKey = '';

  connectedCallback(): void {
    super.connectedCallback();
    if (!this._initialized) {
      this._initialized = true;
      this._loadInitialCorners();
    }
    window.addEventListener('keydown', this._handleKeydown);
  }

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('initialCorners') && !this._hasInteracted) {
      this._loadInitialCorners();
    }
  }

  protected firstUpdated(): void {
    if (this.embedded) this.renderRoot.querySelector<HTMLElement>('#coverage-title')?.focus();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._handleKeydown);
    this._cancelCapture();
    if (this._orientationFrame !== null) {
      cancelAnimationFrame(this._orientationFrame);
      this._orientationFrame = null;
    }
  }

  private _handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (this._capturing) {
      this._cancelCapture();
    } else {
      this._cancel();
    }
  };

  private get _activeTargets(): CalibrationTarget[] {
    return this.targets.filter(target =>
      target.active && Number.isFinite(target.x) && Number.isFinite(target.y));
  }

  private _loadInitialCorners(): void {
    const key = JSON.stringify(this.initialCorners || []);
    if (key === this._initialCornersKey) return;
    this._initialCornersKey = key;
    this._corners = [0, 1, 2, 3].map(index => {
      const point = this.initialCorners[index];
      return point ? { ...point } : null;
    });
    const firstMissing = this._corners.findIndex(point => point === null);
    this._activeCorner = firstMissing === -1 ? 0 : firstMissing;
  }

  private _selectCorner(index: number): void {
    if (this._capturing) return;
    this._hasInteracted = true;
    this._activeCorner = index;
  }

  private _median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  private _startCapture(): void {
    if (this._activeTargets.length !== 1 || this._capturing) return;

    this._hasInteracted = true;
    this._capturing = true;
    this._capturePaused = false;
    this._captureProgress = 0;
    this._captureCancelled = false;

    const samples: CalibrationPoint[] = [];
    let validElapsed = 0;
    let lastFrame = performance.now();

    const captureFrame = (now: number) => {
      if (this._captureCancelled) return;
      const elapsed = Math.min(250, now - lastFrame);
      lastFrame = now;
      const targets = this._activeTargets;
      this._capturePaused = targets.length !== 1;

      if (targets.length === 1) {
        validElapsed += elapsed;
        samples.push({ x: targets[0].x, y: targets[0].y });
      }

      this._captureProgress = Math.min(1, validElapsed / CAPTURE_DURATION_MS);
      if (validElapsed < CAPTURE_DURATION_MS) {
        this._captureFrame = requestAnimationFrame(captureFrame);
        return;
      }

      this._captureFrame = null;
      this._capturing = false;
      this._capturePaused = false;
      if (!samples.length) return;

      const point = {
        x: this._median(samples.map(sample => sample.x)),
        y: this._median(samples.map(sample => sample.y)),
      };
      const corners = [...this._corners];
      corners[this._activeCorner] = point;
      this._corners = corners;

      const nextMissing = corners.findIndex((corner, index) =>
        index > this._activeCorner && corner === null);
      if (nextMissing !== -1) {
        this._activeCorner = nextMissing;
      } else {
        const anyMissing = corners.findIndex(corner => corner === null);
        if (anyMissing !== -1) this._activeCorner = anyMissing;
      }
    };

    this._captureFrame = requestAnimationFrame(captureFrame);
  }

  private _cancelCapture(): void {
    this._captureCancelled = true;
    this._capturing = false;
    this._capturePaused = false;
    this._captureProgress = 0;
    if (this._captureFrame !== null) {
      cancelAnimationFrame(this._captureFrame);
      this._captureFrame = null;
    }
  }

  private _cancel(): void {
    this.dispatchEvent(new CustomEvent('calibration-cancel', {
      bubbles: true,
      composed: true,
    }));
  }

  private _text(key: string): string {
    return settingsText(this.hass, key);
  }

  private _copy(key: keyof typeof CALIBRATION_COPY.en, values: Record<string, string | number> = {}): string {
    const language = this.hass?.language?.split('-')[0] as keyof typeof CALIBRATION_COPY;
    let text: string = (CALIBRATION_COPY[language] || CALIBRATION_COPY.en)[key];
    Object.entries(values).forEach(([name, value]) => {
      text = text.split(`{${name}}`).join(String(value));
    });
    return text;
  }

  private _cornerLabel(index: number): string {
    return this._text(`radar.coverage.${CORNER_KEYS[index]}`);
  }

  private _startOrientationCheck(kind: 'forward' | 'sideways'): void {
    if (Object.values(this._orientation).includes('recording') || this._activeTargets.length !== 1) return;
    this._orientation = { ...this._orientation, [kind]: 'recording' };
    const samples: CalibrationPoint[] = [];
    let validElapsed = 0;
    let previous = performance.now();
    const started = previous;
    const frame = (now: number) => {
      const elapsed = Math.min(250, now - previous);
      previous = now;
      const targets = this._activeTargets;
      if (targets.length === 1) {
        validElapsed += elapsed;
        samples.push({ x: targets[0].x, y: targets[0].y });
      }
      if (validElapsed < ORIENTATION_CAPTURE_DURATION_MS && now - started < ORIENTATION_CAPTURE_TIMEOUT_MS) {
        this._orientationFrame = requestAnimationFrame(frame);
        return;
      }
      this._orientationFrame = null;
      this._orientation = {
        ...this._orientation,
        [kind]: validElapsed >= ORIENTATION_CAPTURE_DURATION_MS
          && evaluateRadarOrientationWalk(kind, samples) ? 'passed' : 'failed',
      };
    };
    this._orientationFrame = requestAnimationFrame(frame);
  }

  private _save(): void {
    if (!this._hasValidShape() || !this._orientationReady) return;
    this.dispatchEvent(new CustomEvent('calibration-save', {
      detail: { corners: this._corners.map(point => ({ ...point! })) },
      bubbles: true,
      composed: true,
    }));
  }

  private get _orientationReady(): boolean {
    return !this.requiresOrientationCheck
      || (this._orientation.forward === 'passed' && this._orientation.sideways === 'passed');
  }

  private _plotPoint(point: CalibrationPoint): { x: number; y: number } {
    const safeRange = Math.max(1000, this.range);
    if (this.mountingMode === 'ceiling') {
      return {
        x: 300 + (point.x / safeRange) * 132,
        y: 160 + (point.y / safeRange) * 132,
      };
    }
    const plotRadius = 138;
    return {
      x: 300 + (point.x / safeRange) * plotRadius,
      y: 42 + (Math.max(0, point.y) / safeRange) * 238,
    };
  }

  private _hasValidShape(): boolean {
    if (!this._corners.every(point => point !== null)) return false;
    const corners = this._corners as CalibrationPoint[];
    for (let i = 0; i < corners.length; i++) {
      for (let j = i + 1; j < corners.length; j++) {
        if (Math.hypot(corners[i].x - corners[j].x, corners[i].y - corners[j].y) < 200) return false;
      }
    }
    const twiceArea = Math.abs(corners.reduce((sum, point, index) => {
      const next = corners[(index + 1) % corners.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0));
    return twiceArea >= 200000;
  }

  private _renderCoveragePlot() {
    const halfAngle = Math.min(85, Math.max(20, this.fov / 2));
    const leftRadians = (90 + halfAngle) * Math.PI / 180;
    const rightRadians = (90 - halfAngle) * Math.PI / 180;
    const radius = 250;
    const origin = this.mountingMode === 'ceiling' ? { x: 300, y: 160 } : { x: 300, y: 32 };
    const left = {
      x: origin.x + Math.cos(leftRadians) * radius,
      y: origin.y + Math.sin(leftRadians) * radius,
    };
    const right = {
      x: origin.x + Math.cos(rightRadians) * radius,
      y: origin.y + Math.sin(rightRadians) * radius,
    };
    const cornerPoints = this._corners
      .map((point, index) => point ? { point: this._plotPoint(point), index } : null)
      .filter((entry): entry is { point: CalibrationPoint; index: number } => entry !== null);
    const polygon = cornerPoints.length === 4
      ? cornerPoints.map(entry => `${entry.point.x},${entry.point.y}`).join(' ')
      : '';

    return html`
      <div class="coverage-plot" aria-label=${this._copy('preview')}>
        <svg viewBox="0 0 600 320" role="img">
          ${this.mountingMode === 'ceiling' ? svg`
            <circle cx="300" cy="160" r="136" class="fov" />
            <circle cx="300" cy="160" r="52" class="range-line" />
            <circle cx="300" cy="160" r="94" class="range-line" />
          ` : svg`
            <path
              d="M ${origin.x} ${origin.y} L ${left.x} ${left.y} A ${radius} ${radius} 0 0 0 ${right.x} ${right.y} Z"
              class="fov"
            />
            <path d="M 300 32 A 92 92 0 0 0 208 124" class="range-line" />
            <path d="M 300 32 A 170 170 0 0 0 130 202" class="range-line" />
          `}
          ${polygon ? svg`<polygon points="${polygon}" class="calibration-shape" />` : nothing}
          ${cornerPoints.map(entry => svg`
            <g class="marked-point">
              <circle cx="${entry.point.x}" cy="${entry.point.y}" r="9" />
              <text x="${entry.point.x}" y="${entry.point.y + 4}">${entry.index + 1}</text>
            </g>
          `)}
          ${this._activeTargets.map(target => {
            const point = this._plotPoint(target);
            return svg`
              <g class="live-point">
                <circle cx="${point.x}" cy="${point.y}" r="11" />
                <circle cx="${point.x}" cy="${point.y}" r="19" class="pulse" />
              </g>
            `;
          })}
          <g class="sensor-marker">
            <circle cx="${origin.x}" cy="${origin.y}" r="10" />
            <path d="M 294 31 L 300 38 L 306 31" />
          </g>
        </svg>
        <div class="plot-legend">
          <span><i class="legend-dot live"></i>${this._copy('live')}</span>
          <span><i class="legend-dot marked"></i>${this._copy('saved')}</span>
        </div>
      </div>
    `;
  }

  render() {
    const activeTargets = this._activeTargets;
    const allMarked = this._corners.every(point => point !== null);
    const validShape = this._hasValidShape();
    const canMark = activeTargets.length === 1 && !this._capturing;
    const status = activeTargets.length === 0
      ? this._copy('none')
      : activeTargets.length > 1
        ? this._copy('multiple')
        : this._copy('one', { sensor: this.sensorName });

    return html`
      <div class="overlay" @mousedown="${(event: MouseEvent) => {
        if (event.target === event.currentTarget && !this._capturing) this._cancel();
      }}">
        <section class="wizard" role=${this.embedded ? 'region' : 'dialog'} aria-modal=${this.embedded ? nothing : 'true'} aria-labelledby="coverage-title">
          <header>
            <div>
              <p class="eyebrow">FLOORPLAN DESIGNER</p>
              <h2 id="coverage-title" tabindex=${this.embedded ? '-1' : nothing}>${this._copy('title')}</h2>
              <p class="intro">${this._copy('intro')}</p>
            </div>
            <button class="close-button" @click="${this._cancel}" ?disabled="${this._capturing}"
              aria-label=${this.embedded ? this._copy('back') : this._copy('close')}>
              <ha-icon icon=${this.embedded ? 'mdi:arrow-left' : 'mdi:close'}></ha-icon>
            </button>
          </header>

          <div class="range-notice">
            <ha-icon icon="mdi:radar"></ha-icon>
            <div>
              <strong>${this._copy('measure_title')}</strong>
              <span>${this._copy('measure_text', { radar: this.radarModel.toUpperCase() })}</span>
            </div>
          </div>

          ${this.embedded ? html`<details class="axis-details">
            <summary>${this._text('radar.coverage.axes_title')}</summary>
            <p>${this._text('radar.coverage.axes_description')}</p>
          </details>` : html`<div class="axis-guide">
            <ha-icon icon="mdi:axis-arrow"></ha-icon>
            <div>
              <strong>${this._text('radar.coverage.axes_title')}</strong>
              <span>${this._text('radar.coverage.axes_description')}</span>
            </div>
          </div>`}

          ${this.isRemeasurement ? html`
            <div class="remeasure-notice" role="status">
              <ha-icon icon="mdi:backup-restore"></ha-icon>
              <span>${this._text('radar.coverage.remeasure_notice')}</span>
            </div>
          ` : nothing}

          ${this.requiresOrientationCheck ? html`
            <section class="orientation-check" aria-labelledby="orientation-title">
              <div>
                <strong id="orientation-title">${this._text('radar.orientation.title')}</strong>
                <p>${this._text('radar.orientation.description')}</p>
              </div>
              <div class="orientation-actions">
                ${(['forward', 'sideways'] as const).map(kind => html`
                  <button class="orientation-action ${this._orientation[kind]}"
                    @click="${() => this._startOrientationCheck(kind)}"
                    ?disabled="${this._activeTargets.length !== 1 || Object.values(this._orientation).includes('recording')}">
                    <ha-icon icon="${this._orientation[kind] === 'passed' ? 'mdi:check-circle' : kind === 'forward' ? 'mdi:arrow-up-bold' : 'mdi:arrow-left-right-bold'}"></ha-icon>
                    <span>
                      <strong>${this._text(`radar.orientation.${kind}`)}</strong>
                      <small>${this._orientation[kind] === 'recording'
                        ? this._text('radar.orientation.recording')
                        : this._orientation[kind] === 'passed'
                          ? this._text('radar.orientation.passed')
                          : this._orientation[kind] === 'failed'
                            ? this._text('radar.orientation.failed')
                            : this._text('radar.orientation.start')}</small>
                    </span>
                  </button>
                `)}
              </div>
              ${this._orientation.forward === 'failed' || this._orientation.sideways === 'failed' ? html`
                <div class="orientation-warning" role="alert">
                  <ha-icon icon="mdi:rotate-3d-variant"></ha-icon>
                  <span>${this._text('radar.orientation.physical_warning')}</span>
                </div>
              ` : nothing}
            </section>
          ` : nothing}

          <div class="corner-progress" aria-label=${this._copy('progress')}>
            ${CORNER_KEYS.map((_key, index) => html`
              <button
                class="corner-chip ${this._corners[index] ? 'done' : ''} ${this._activeCorner === index ? 'active' : ''}"
                @click="${() => this._selectCorner(index)}"
                ?disabled="${this._capturing}"
                aria-current="${this._activeCorner === index ? 'step' : 'false'}"
              >
                <span class="corner-number">${this._corners[index] ? '✓' : index + 1}</span>
                ${this._cornerLabel(index)}
              </button>
              ${index < 3 && !this.embedded ? html`<ha-icon class="step-arrow" icon="mdi:chevron-right"></ha-icon>` : nothing}
            `)}
          </div>

          <p class="current-step">
            ${this._copy('point', { current: this._activeCorner + 1 })}
            <strong>${this._cornerLabel(this._activeCorner)}</strong>
            ${this.embedded ? nothing : html`<span>${this._text('radar.coverage.axes_description')}</span>`}
          </p>

          ${this._renderCoveragePlot()}

          <div class="target-status ${activeTargets.length === 1 ? 'ready' : 'warning'}" role="status">
            <span class="status-dot"></span>
            <span>${status}</span>
          </div>

          ${this._capturing ? html`
            <div class="capture-panel" aria-live="polite">
              <div class="capture-copy">
                <strong>${this._capturePaused ? this._copy('paused') : this._copy('still')}</strong>
                <span>
                  ${this._capturePaused
                    ? this._copy('one_required')
                    : this._copy('measuring', { point: this._cornerLabel(this._activeCorner) })}
                </span>
              </div>
              <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                   aria-valuenow="${Math.round(this._captureProgress * 100)}">
                <span style="transform: scaleX(${this._captureProgress})"></span>
              </div>
              <button class="text-button" @click="${this._cancelCapture}">${this._copy('cancel_measurement')}</button>
            </div>
          ` : nothing}

          ${allMarked ? html`
            <p class="save-help">
              ${validShape
                ? this._copy('ready')
                : this._copy('invalid')}
            </p>
          ` : nothing}

          <footer>
            <button class="button secondary" @click="${this._cancel}" ?disabled="${this._capturing}">${this._copy('cancel')}</button>
            ${allMarked ? html`
              <button class="button primary" @click="${this._save}" ?disabled="${!validShape || !this._orientationReady}">
                <ha-icon icon="mdi:content-save-outline"></ha-icon>
                ${this._copy('save')}
              </button>
            ` : html`
              <button class="button primary" @click="${this._startCapture}" ?disabled="${!canMark}">
                <ha-icon icon="mdi:map-marker-radius"></ha-icon>
                ${this._copy('mark', { point: this._cornerLabel(this._activeCorner) })}
              </button>
            `}
          </footer>
        </section>
      </div>
    `;
  }

  static styles = css`
    :host {
      --calibration-blue: var(--primary-color, #4361ee);
      --calibration-green: #22a35a;
      --calibration-amber: #d97706;
      color: var(--primary-text-color, #172033);
    }
    * { box-sizing: border-box; }
    button { font: inherit; }
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: grid;
      place-items: center;
      padding: 24px;
      overflow-y: auto;
      background: rgba(9, 14, 25, 0.72);
    }
    .wizard {
      width: min(780px, 100%);
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      padding: clamp(22px, 4vw, 38px);
      border: 1px solid var(--divider-color, #d9dee8);
      border-radius: 18px;
      background: var(--card-background-color, #fbfcfe);
      box-shadow: 0 24px 70px rgba(4, 11, 27, 0.28);
    }
    :host([embedded]) .overlay { position: static; display: block; padding: 0; overflow: visible; background: none; }
    :host([embedded]) .wizard { max-height: none; padding: 0; overflow: visible; border: 0; border-radius: 0; box-shadow: none; }
    :host([embedded]) .eyebrow { display: none; }
    :host([embedded]) h2 { font-size: 19px; }
    :host([embedded]) .coverage-plot svg { height: 245px; }
    :host([embedded]) .orientation-actions { grid-template-columns: 1fr; }
    :host([embedded]) .corner-progress { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); overflow: visible; }
    :host([embedded]) .corner-chip { min-width: 0; min-height: 44px; border-radius: 9px; white-space: normal; text-align: start; }
    .axis-details { margin: 10px 0 13px; font-size: 13px; color: var(--secondary-text-color, #5f6878); }
    .axis-details summary { min-height: 32px; align-content: center; cursor: pointer; font-weight: 650; }
    .axis-details p { margin: 0 0 8px; line-height: 1.5; }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
    }
    .eyebrow {
      margin: 0 0 7px;
      color: var(--calibration-blue);
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 0.09em;
    }
    h2 {
      margin: 0;
      color: var(--primary-text-color, #172033);
      font-size: clamp(23px, 4vw, 30px);
      line-height: 1.15;
      letter-spacing: -0.025em;
    }
    .intro {
      max-width: 650px;
      margin: 12px 0 0;
      color: var(--secondary-text-color, #5f6878);
      font-size: 15px;
      line-height: 1.55;
    }
    .close-button {
      display: grid;
      flex: 0 0 40px;
      width: 40px;
      height: 40px;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color, #5f6878);
      cursor: pointer;
    }
    .close-button:hover { background: var(--secondary-background-color, #eef1f6); }
    .close-button:disabled { opacity: 0.4; cursor: not-allowed; }
    .close-button ha-icon { --mdc-icon-size: 22px; }
    .range-notice {
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 13px;
      margin: 24px 0;
      padding: 15px 17px;
      border: 1px solid color-mix(in srgb, var(--calibration-amber) 34%, transparent);
      border-radius: 12px;
      background: color-mix(in srgb, var(--calibration-amber) 9%, var(--card-background-color, #fbfcfe));
    }
    .range-notice > ha-icon {
      --mdc-icon-size: 23px;
      color: var(--calibration-amber);
      margin-top: 1px;
    }
    .range-notice strong,
    .range-notice span { display: block; }
    .range-notice strong { margin-bottom: 4px; font-size: 13px; }
    .range-notice span {
      color: var(--secondary-text-color, #5f6878);
      font-size: 12.5px;
      line-height: 1.5;
    }
    .axis-guide,
    .remeasure-notice {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      gap: 11px;
      align-items: start;
      margin: -10px 0 24px;
      padding: 13px 15px;
      border: 1px solid var(--divider-color, #d9dee8);
      border-radius: 11px;
      background: var(--secondary-background-color, #eef1f6);
    }
    .axis-guide ha-icon,
    .remeasure-notice ha-icon { --mdc-icon-size: 20px; color: var(--calibration-blue); }
    .axis-guide strong,
    .axis-guide span { display: block; }
    .axis-guide strong { margin-bottom: 4px; font-size: 12.5px; }
    .axis-guide span,
    .remeasure-notice span {
      color: var(--secondary-text-color, #5f6878);
      font-size: 12px;
      line-height: 1.5;
    }
    .remeasure-notice {
      margin-top: -12px;
      border-color: color-mix(in srgb, var(--calibration-blue) 28%, var(--divider-color, #d9dee8));
      background: color-mix(in srgb, var(--calibration-blue) 7%, var(--card-background-color, #fbfcfe));
    }
    .orientation-check {
      margin: -8px 0 24px;
      padding: 16px;
      border: 1px solid var(--divider-color, #d9dee8);
      border-radius: 12px;
      background: var(--card-background-color, #fbfcfe);
    }
    .orientation-check > div > strong { display: block; font-size: 13px; }
    .orientation-check p { margin: 5px 0 13px; color: var(--secondary-text-color, #5f6878); font-size: 12px; line-height: 1.5; }
    .orientation-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
    .orientation-action { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 9px; align-items: center; min-height: 58px; padding: 10px; border: 1px solid var(--divider-color, #d9dee8); border-radius: 9px; background: var(--secondary-background-color, #eef1f6); color: var(--primary-text-color, #172033); text-align: left; cursor: pointer; }
    .orientation-action:hover:not(:disabled) { border-color: var(--calibration-blue); }
    .orientation-action:focus-visible { outline: 2px solid var(--calibration-blue); outline-offset: 2px; }
    .orientation-action:disabled { opacity: .62; cursor: not-allowed; }
    .orientation-action.passed { border-color: color-mix(in srgb, var(--calibration-green) 45%, transparent); background: color-mix(in srgb, var(--calibration-green) 9%, var(--card-background-color, #fbfcfe)); }
    .orientation-action.failed { border-color: color-mix(in srgb, var(--calibration-amber) 52%, transparent); }
    .orientation-action ha-icon { --mdc-icon-size: 22px; color: var(--calibration-blue); }
    .orientation-action.passed ha-icon { color: var(--calibration-green); }
    .orientation-action span, .orientation-action strong, .orientation-action small { display: block; min-width: 0; }
    .orientation-action strong { font-size: 12px; }
    .orientation-action small { margin-top: 3px; color: var(--secondary-text-color, #5f6878); font-size: 10.5px; line-height: 1.3; }
    .orientation-warning { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 9px; margin-top: 11px; padding: 10px; border-radius: 8px; background: color-mix(in srgb, var(--calibration-amber) 10%, var(--card-background-color, #fbfcfe)); color: #b45309; font-size: 11px; line-height: 1.45; }
    .orientation-warning ha-icon { --mdc-icon-size: 19px; }
    .corner-progress {
      display: flex;
      align-items: center;
      gap: 7px;
      overflow-x: auto;
      padding: 2px 2px 8px;
      scrollbar-width: thin;
    }
    .corner-chip {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 7px;
      min-height: 38px;
      padding: 7px 12px 7px 8px;
      border: 1px solid var(--divider-color, #d9dee8);
      border-radius: 999px;
      background: var(--card-background-color, #fbfcfe);
      color: var(--secondary-text-color, #5f6878);
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
    }
    .corner-chip:hover { border-color: var(--calibration-blue); }
    .corner-chip.active {
      border-color: var(--calibration-blue);
      color: var(--calibration-blue);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--calibration-blue) 16%, transparent);
    }
    .corner-chip.done {
      border-color: color-mix(in srgb, var(--calibration-green) 42%, transparent);
      background: color-mix(in srgb, var(--calibration-green) 11%, var(--card-background-color, #fbfcfe));
      color: var(--calibration-green);
    }
    .corner-chip.done.active { border-color: var(--calibration-blue); color: var(--calibration-blue); }
    .corner-chip:disabled { cursor: not-allowed; }
    .corner-number {
      display: grid;
      width: 22px;
      height: 22px;
      place-items: center;
      border-radius: 50%;
      background: var(--secondary-background-color, #eef1f6);
      font-size: 11px;
    }
    .corner-chip.done .corner-number {
      background: var(--calibration-green);
      color: white;
    }
    .step-arrow {
      --mdc-icon-size: 17px;
      flex: 0 0 auto;
      color: var(--disabled-text-color, #9aa2af);
    }
    .current-step {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin: 8px 0 14px;
      color: var(--secondary-text-color, #5f6878);
      font-size: 13px;
    }
    .current-step strong { color: var(--primary-text-color, #172033); }
    .current-step span { width: 100%; font-size: 11.5px; }
    .coverage-plot {
      overflow: hidden;
      border: 1px solid var(--divider-color, #d9dee8);
      border-radius: 14px;
      background: var(--secondary-background-color, #10182b);
    }
    .coverage-plot svg {
      display: block;
      width: 100%;
      height: clamp(230px, 36vw, 330px);
    }
    .fov {
      fill: rgba(50, 106, 184, 0.18);
      stroke: #2f6fa9;
      stroke-width: 2;
    }
    .range-line {
      fill: none;
      stroke: rgba(180, 200, 229, 0.21);
      stroke-width: 2;
      stroke-dasharray: 6 7;
    }
    .calibration-shape {
      fill: rgba(245, 158, 11, 0.09);
      stroke: #f59e0b;
      stroke-width: 2;
      stroke-dasharray: 7 5;
    }
    .marked-point circle { fill: #f59e0b; stroke: white; stroke-width: 3; }
    .marked-point text {
      fill: #172033;
      font-size: 9px;
      font-weight: 800;
      text-anchor: middle;
      pointer-events: none;
    }
    .live-point circle:first-child { fill: #3498eb; stroke: white; stroke-width: 3; }
    .live-point .pulse {
      fill: none;
      stroke: #3498eb;
      stroke-width: 2;
      opacity: 0.45;
    }
    .sensor-marker circle { fill: #3498eb; stroke: white; stroke-width: 3; }
    .sensor-marker path { fill: none; stroke: white; stroke-width: 2; stroke-linecap: round; }
    .plot-legend {
      display: flex;
      gap: 18px;
      padding: 10px 14px;
      border-top: 1px solid rgba(180, 200, 229, 0.12);
      color: #b8c2d4;
      font-size: 11px;
    }
    .plot-legend span { display: inline-flex; align-items: center; gap: 6px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-dot.live { background: #3498eb; }
    .legend-dot.marked { background: #f59e0b; }
    .target-status {
      display: flex;
      align-items: center;
      gap: 9px;
      min-height: 40px;
      margin-top: 12px;
      color: var(--secondary-text-color, #5f6878);
      font-size: 12.5px;
    }
    .status-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--calibration-amber); }
    .target-status.ready .status-dot { background: var(--calibration-green); }
    .capture-panel {
      margin-top: 8px;
      padding: 15px;
      border-radius: 12px;
      background: var(--secondary-background-color, #eef1f6);
    }
    .capture-copy { display: flex; justify-content: space-between; gap: 14px; font-size: 12px; }
    .capture-copy span { color: var(--secondary-text-color, #5f6878); text-align: right; }
    .progress-track {
      height: 7px;
      margin: 12px 0 8px;
      overflow: hidden;
      border-radius: 999px;
      background: color-mix(in srgb, var(--divider-color, #d9dee8) 70%, transparent);
    }
    .progress-track span {
      display: block;
      width: 100%;
      height: 100%;
      transform-origin: left;
      border-radius: inherit;
      background: var(--calibration-blue);
    }
    .text-button {
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--calibration-blue);
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
    }
    .save-help {
      margin: 13px 0 0;
      color: var(--secondary-text-color, #5f6878);
      font-size: 12px;
      line-height: 1.45;
    }
    footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 24px;
      padding-top: 19px;
      border-top: 1px solid var(--divider-color, #d9dee8);
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 43px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .button ha-icon { --mdc-icon-size: 18px; }
    .button.secondary {
      border: 1px solid var(--divider-color, #d9dee8);
      background: transparent;
      color: var(--secondary-text-color, #5f6878);
    }
    .button.primary {
      border: 1px solid var(--calibration-blue);
      background: var(--calibration-blue);
      color: white;
    }
    .button:disabled { opacity: 0.45; cursor: not-allowed; }
    @media (max-width: 640px) {
      .overlay { align-items: start; padding: 0; }
      .wizard {
        min-height: 100vh;
        max-height: none;
        border: 0;
        border-radius: 0;
        padding: 22px 16px 20px;
      }
      .range-notice { grid-template-columns: 28px minmax(0, 1fr); padding: 13px; }
      .orientation-actions { grid-template-columns: 1fr; }
      .corner-progress { margin-inline: -2px; }
      .step-arrow { display: none; }
      .coverage-plot svg { height: 245px; }
      .capture-copy { flex-direction: column; gap: 4px; }
      .capture-copy span { text-align: left; }
      footer { position: sticky; bottom: -20px; margin-inline: -16px; padding: 14px 16px 20px; background: var(--card-background-color, #fbfcfe); }
      .button.primary { flex: 1; }
    }
    @media (prefers-reduced-motion: no-preference) {
      .live-point .pulse { animation: target-pulse 1.5s ease-out infinite; }
      @keyframes target-pulse {
        from { transform: scale(0.65); transform-origin: center; opacity: 0.7; }
        to { transform: scale(1.35); transform-origin: center; opacity: 0; }
      }
    }
  `;
}

if (!customElements.get('shs-sensor-coverage-calibration')) {
  customElements.define(
    'shs-sensor-coverage-calibration',
    SensorCoverageCalibration,
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'shs-sensor-coverage-calibration': SensorCoverageCalibration;
  }
}
