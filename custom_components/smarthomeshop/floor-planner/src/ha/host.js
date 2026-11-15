// <shs-floor-planner-page>: the floor planner page of the SmartHomeShop panel.
//
// Loads the floor plan and the radars from Home Assistant, opens the editor
// (en.html and friends) in an iframe and hangs an adapter on the iframe as
// `floorPlannerHost`, which editor-entry.js hands to the editor. Saves the
// project back as Home Assistant rooms, and in both modes feeds the editor
// the people the radars see.
//
//   hass    the Home Assistant object
//   mode    'edit' or 'live'
//   isDirty, focusRadarButton(), applyRadarCalibration({ room, previousRevision })
//   fires open-radar-tools with the selected room and sensor
import { StatefulWholeHomeFusion, applyAuthoritativeRuntimeTracking, runtimeSnapshotIsAuthoritative } from './fusion.js';
import { FloorPlanValidationError, floorPlanValidationMessage } from './safety.js';
import { findPlannerDevice, plannerDevices, projectFromRooms, roomsInHouse, withoutHiddenRooms } from './ha-rooms.js';
import { saveChanges } from './ha-save.js';
import {
    collectLivePresence, detectionSummary, livePeople, liveTracks, radarEntityIds, radarProfiles, withFusedRooms,
} from './ha-live.js';
import { coverageEstimateCopy, editorLabels, pageText, pickerCopy } from './host-copy.js';
import { validProject } from '../js/floor-planner-building.mjs';
import { EntityReportReceiptTracker, latestIndependentReportTimestamp } from '../../../panel/src/utils/whole-home.ts';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// The floor being looked at is not a change worth saving.
const withoutActiveFloor = ({ activeFloor, ...project }) => project;
const editorLanguages = ['nl', 'en', 'de', 'fr', 'es'];
// A runtime answer that took longer than this is too old to trust.
const runtimeTimeout = 2500;

// The status line and the two buttons. They live in the editor's project bar
// once the editor mounts them (mountActions); the styles here cover the time
// before that.
const template = `<style>
    :host { display:flex; flex:1; flex-direction:column; min-width:0; min-height:0; }
    .fp-ha-actions { padding:10px 14px; color:var(--secondary-text-color,#526178); }
    .fp-ha-actions p { margin:0; font-size:13px; }
    .fp-ha-actions p[data-error] { color:var(--error-color,#aa2b25); }
    .fp-ha-actions button, .fp-ha-actions .detections { display:none; }
    iframe { display:block; border:0; width:100%; flex:1; min-height:0; background:var(--primary-background-color,#f4f6f8); }
    [hidden] { display:none; }
</style><div class="fp-ha-actions"><div class="fp-ha-status"><p class="detections" role="status"></p><p class="save-status" role="status"></p></div>
    <button class="secondary" type="button"><svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.5"/><path d="m10 10 5-5"/></svg><span></span></button>
    <button class="save" type="button"><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 3h10l3 3v11H3V3zm2 0v5h7V3m-7 14v-5h8v5"/></svg><span></span></button>
</div>`;

class FloorPlannerPage extends HTMLElement {
    #hass;
    #mode = 'edit';
    // The smarthomeshop/floor_plan answer: project, rooms, revisions, version.
    #floorPlan;
    // The project as last loaded or saved, and the editor's current one.
    #saved;
    #current;
    // What the editor gave connect(): applySaved, setMode, setPeople, ...
    #editor;
    #actions;
    #saveButton;
    #radarButton;
    #saveStatus;
    #detections;
    #frame;
    // The language the editor in the frame was opened in.
    #frameLanguage;
    #loading = false;
    #saving = false;
    #runtime;
    #profiles = [];
    #devices = [];
    #devicesRequest;
    #devicesFailed = false;
    #receipts = new EntityReportReceiptTracker();
    #refreshTimer;
    #liveFrame;
    #sentPeople;
    #tracks = new Map();
    #fusion = new StatefulWholeHomeFusion();
    #runtimeRequest = 0;
    #runtimePending = false;
    #runtimeReceivedAt = 0;
    #text = pageText('nl');

    get isDirty() {
        return Boolean(this.#current && !same(withoutActiveFloor(this.#current), withoutActiveFloor(this.#saved)));
    }

    focusRadarButton() {
        this.#radarButton?.focus({ preventScroll: true });
    }

    // The radar tools saved a calibration for one room. Take it over only when
    // it was made on the revision this page has, so nothing newer is lost.
    // Without revisions there is no telling, so the page keeps what it has.
    applyRadarCalibration({ room, previousRevision } = {}) {
        const revisions = this.#floorPlan?.revisions;
        if (!room || !revisions || typeof revisions !== 'object' || !Object.hasOwn(revisions, room.id)
            || (revisions[room.id] ?? null) !== (previousRevision ?? null)) return;
        this.#floorPlan.rooms = this.#floorPlan.rooms.map(candidate => candidate.id === room.id ? room : candidate);
        revisions[room.id] = room.updated_at ?? null;
        this.#editor?.devicesChanged?.();
        this.#refreshRuntime();
    }

    set hass(hass) {
        this.#hass = hass;
        if (!this.isConnected) return;
        this.#followLanguage();
        const editorRoot = this.#frame?.contentDocument?.documentElement;
        const theme = this.#theme();
        if (editorRoot && editorRoot.dataset.haTheme !== theme) editorRoot.dataset.haTheme = theme;
        if (!this.#floorPlan) this.#load();
        // States arrive many times a second; draw at most once per frame.
        if (this.#editor && !this.#liveFrame) {
            this.#liveFrame = requestAnimationFrame(() => {
                this.#liveFrame = null;
                this.#renderLive();
            });
        }
    }

    set mode(mode) {
        if (this.#mode === mode) return;
        this.#mode = mode;
        if (this.#editor) {
            this.#editor.applySaved(this.#shownProject());
            this.#editor.setMode(mode);
        }
        this.#sentPeople = undefined;
        this.#renderStatus();
        if (this.#editor) this.#refreshRuntime();
    }

    connectedCallback() {
        // Properties set before the element was defined shadow the setters.
        for (const name of ['hass', 'mode']) {
            if (!Object.hasOwn(this, name)) continue;
            const value = this[name];
            delete this[name];
            if (name === 'hass') this.#hass = value;
            else this.#mode = value;
        }
        if (!this.shadowRoot) {
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.innerHTML = template;
            this.#actions = this.shadowRoot.querySelector('.fp-ha-actions');
            this.#saveButton = this.shadowRoot.querySelector('.save');
            this.#radarButton = this.shadowRoot.querySelector('.secondary');
            this.#saveStatus = this.shadowRoot.querySelector('.save-status');
            this.#detections = this.shadowRoot.querySelector('.detections');
            this.#saveButton.addEventListener('click', () => void this.#save());
            this.#radarButton.setAttribute('aria-haspopup', 'dialog');
            // With unsaved changes in the editor the radar tools open
            // read-only, so the two never save over each other.
            this.#radarButton.addEventListener('click', () => this.dispatchEvent(new CustomEvent('open-radar-tools', {
                bubbles: true,
                composed: true,
                detail: { ...this.#editor?.radarContext?.(), readOnly: this.isDirty },
            })));
        }
        this.#applyText();
        this.#renderStatus();
        if (this.#frame) this.#followLanguage();
        if (this.#editor) {
            this.#editor.applySaved(this.#shownProject());
            this.#editor.setMode(this.#mode);
            this.#refreshRuntime();
        }
        if (this.#hass) this.#load();
        clearInterval(this.#refreshTimer);
        this.#refreshTimer = setInterval(() => {
            if (this.#editor && !document.hidden) this.#refreshRuntime();
        }, 1000);
    }

    disconnectedCallback() {
        clearInterval(this.#refreshTimer);
        this.#refreshTimer = undefined;
        // Drop any runtime request still on its way.
        this.#runtimeRequest += 1;
        this.#runtimePending = false;
        this.#runtimeReceivedAt = 0;
        if (this.#liveFrame != null) cancelAnimationFrame(this.#liveFrame);
        this.#liveFrame = null;
    }

    #language() {
        return this.#hass?.language?.split('-')[0];
    }

    // Live mode shows the saved project without the rooms Live Home hides,
    // edit mode the editor's own project, or the saved one before it has any.
    #shownProject() {
        return this.#mode === 'live' ? withoutHiddenRooms(this.#saved) : this.#current ?? this.#saved;
    }

    #applyText() {
        this.#text = pageText(this.#language());
        for (const [button, name, text] of [
            [this.#saveButton, this.#text.saveFloorPlan, this.#text.save],
            [this.#radarButton, this.#text.radarSettings],
        ]) {
            button.setAttribute('aria-label', name);
            button.title = name;
            button.querySelector('span').textContent = text ?? name;
        }
        if (this.#frame) this.#frame.title = this.#text.floorPlan;
    }

    // The editor's pages and labels come in one language each. When Home
    // Assistant switches language the editor opens again in the new one, with
    // the project as it is, unsaved changes included. Never during a save: the
    // next state update tries again.
    #followLanguage() {
        if (!this.#frame || this.#saving || this.#language() === this.#frameLanguage) return;
        this.#applyText();
        this.#openEditor();
        this.#renderStatus();
    }

    #openEditor() {
        const language = this.#language();
        const frame = document.createElement('iframe');
        frame.title = this.#text.floorPlan;
        frame.floorPlannerHost = this.#editorAdapter(language, frame);
        const page = new URL(`./${editorLanguages.includes(language) ? language : 'en'}.html`, import.meta.url);
        // The editor pages are versioned like this module.
        page.search = new URL(import.meta.url).search;
        frame.src = page.href;
        if (this.#frame) {
            // The status line and buttons were mounted in the old editor; keep them.
            this.shadowRoot.insertBefore(this.#actions, this.#frame);
            this.#frame.replaceWith(frame);
        } else this.shadowRoot.append(frame);
        this.#frame = frame;
        this.#frameLanguage = language;
        this.#editor = undefined;
        this.#sentPeople = undefined;
    }

    #theme() {
        return (this.#hass?.themes?.darkMode ?? matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    // Once per page: the floor plan and the radars, then the editor.
    async #load() {
        if (this.#floorPlan || this.#loading) return;
        this.#loading = true;
        try {
            const [floorPlan] = await Promise.all([this.#hass.callWS({ type: 'smarthomeshop/floor_plan' }), this.#loadDevices()]);
            if (!this.isConnected) return;
            this.#saved = validProject(floorPlan.project) ? floorPlan.project
                : projectFromRooms(floorPlan.rooms, this.#profiles, this.#devices);
            this.#floorPlan = floorPlan;
            if (this.#saved.skippedRooms?.length) this.#showError(this.#skippedRooms(this.#saved.skippedRooms.length));
            if (Number(floorPlan.recovery?.count) > 0) this.#showError(this.#skippedRooms(floorPlan.recovery.count));
            this.#applyText();
            this.#openEditor();
        } catch {
            this.#showError(this.#text.openFailed);
        } finally {
            this.#loading = false;
        }
    }

    #skippedRooms(count) {
        return this.#text.skippedRooms.replace('{count}', String(count));
    }

    // What the editor in the iframe sees of Home Assistant. An editor that was
    // replaced (see #followLanguage) is no longer listened to.
    #editorAdapter(language, frame) {
        const page = this;
        return {
            get project() {
                return structuredClone(page.#shownProject());
            },
            theme: () => this.#theme(),
            mountActions: parent => parent.append(this.#actions),
            labels: editorLabels(this.#text),
            picker: pickerCopy[language] ?? pickerCopy.en,
            coverageEstimate: coverageEstimateCopy[language] ?? coverageEstimateCopy.en,
            devices: () => this.#devices,
            device: id => findPlannerDevice(this.#devices, id),
            deviceError: () => this.#devicesFailed,
            refreshDevices: () => this.#loadDevices(),
            asset: path => `/smarthomeshop_panel/floor-planner${path}`,
            calibrationLabel: roomId => {
                const calibration = this.#floorPlan.rooms.find(room => room.id === roomId)?.calibration;
                return calibration?.enabled
                    ? `${this.#text.savedCalibration} · ${calibration.corners?.length ?? 0} ${this.#text.points}` : '';
            },
            update: project => {
                // In live mode the editor shows a filtered copy, which is no
                // project to edit or save.
                if (frame !== this.#frame || this.#mode === 'live') return;
                const copy = structuredClone(project);
                // The editor's first update is the loaded project as it reads
                // it, unless it reopened with unsaved changes.
                if (!this.#editor && !this.isDirty) this.#saved = copy;
                this.#current = copy;
                this.#renderStatus();
            },
            connect: editor => {
                if (frame !== this.#frame) return;
                this.#editor = editor;
                if (this.#mode === 'live') editor.applySaved(withoutHiddenRooms(this.#saved));
                editor.setMode(this.#mode);
                this.#renderStatus();
                this.#refreshRuntime();
            },
        };
    }

    // Radar profiles and Home Assistant devices, one request at a time.
    #loadDevices() {
        this.#devicesRequest ??= Promise.allSettled([
            this.#hass.callWS({ type: 'smarthomeshop/radar/profiles' }),
            this.#hass.callWS({ type: 'smarthomeshop/devices' }),
        ]).then(([profiles, devices]) => {
            if (profiles.status === 'fulfilled') this.#profiles = radarProfiles(profiles.value?.devices);
            this.#devicesFailed = profiles.status === 'rejected' && devices.status === 'rejected';
            if (this.#devicesFailed) return;
            const hidden = (devices.value?.hidden_devices ?? []).map(device => ({ ...device, hidden: true }));
            const found = plannerDevices(this.#profiles, [...devices.value?.devices ?? [], ...hidden]);
            const changed = !same(this.#devices, found);
            this.#devices = found;
            if (changed) this.#editor?.devicesChanged?.();
            this.#renderLive();
        }).finally(() => {
            this.#devicesRequest = null;
        });
        return this.#devicesRequest;
    }

    #renderStatus() {
        if (!this.#saveStatus) return;
        this.#saveButton.hidden = this.#mode === 'live' || !this.#hass?.user?.is_admin;
        this.#saveButton.disabled = !this.isDirty || this.#saving;
        this.#radarButton.hidden = this.#saveButton.hidden;
        this.#radarButton.disabled = !this.#editor || this.#saving;
        // An error stays until the next save attempt.
        if (this.#saveStatus.hasAttribute('data-error')) return;
        const status = this.#saving ? this.#text.saving
            : !this.#editor ? this.#text.loading
                : this.isDirty ? this.#text.unsaved
                    : this.#mode === 'live' ? '' : this.#text.saved;
        this.#saveStatus.hidden = !status;
        if (this.#saveStatus.textContent !== status) this.#saveStatus.textContent = status;
    }

    #showError(message) {
        this.#saveStatus.hidden = false;
        this.#saveStatus.setAttribute('data-error', '');
        this.#saveStatus.textContent = message;
    }

    async #save() {
        if (this.#saving || !this.isDirty || this.#mode !== 'edit') return;
        const project = structuredClone(this.#current);
        this.#saveStatus.removeAttribute('data-error');
        this.#saving = true;
        this.#frame.inert = true;
        this.#renderStatus();
        try {
            // saveChanges also marks the project's items with the records they
            // were saved to, so the project goes out after it.
            const { changes, removed } = saveChanges(project, this.#saved, this.#floorPlan.rooms);
            const saved = await this.#hass.callWS({
                type: 'smarthomeshop/floor_plan/save', project, changes, removed,
                revisions: this.#floorPlan.revisions, version: this.#floorPlan.version,
            });
            this.#floorPlan = saved;
            this.#current = this.#saved = saved.project;
            this.#editor.applySaved(saved.project);
        } catch (error) {
            // Never show a raw backend message.
            this.#showError(error?.code === 'conflict' ? this.#text.changedElsewhere
                : error?.code === 'invalid_format' ? this.#text.checkBeforeSaving
                    : error instanceof FloorPlanValidationError ? floorPlanValidationMessage(error, this.#hass?.language)
                        : this.#text.saveFailed);
        } finally {
            this.#saving = false;
            this.#frame.inert = false;
            this.#renderStatus();
        }
    }

    // The integration's room runtime decides occupancy where it can. Only one
    // request runs at a time; an answer that arrives late or after the page
    // went away is dropped, and so is the fusion state built on the old one.
    async #refreshRuntime() {
        if (!this.#floorPlan) return;
        if (this.#runtimePending) {
            this.#renderLive();
            return;
        }
        const request = ++this.#runtimeRequest;
        const requestedAt = Date.now();
        this.#runtimePending = true;
        try {
            const snapshot = await this.#hass.callWS({ type: 'smarthomeshop/rooms/runtime' });
            if (request !== this.#runtimeRequest) return;
            if (Date.now() - requestedAt > runtimeTimeout) {
                this.#runtimeReceivedAt = 0;
                this.#fusion.reset();
                return;
            }
            this.#runtime = snapshot;
            this.#runtimeReceivedAt = Date.now();
        } catch {
            if (request !== this.#runtimeRequest) return;
            this.#runtimeReceivedAt = 0;
            this.#fusion.reset();
        } finally {
            if (request === this.#runtimeRequest) this.#runtimePending = false;
        }
        this.#renderLive();
    }

    // The people on the plan and the detection line under it.
    #renderLive() {
        if (!this.#floorPlan || !this.#editor) return;
        const states = this.#hass.states ?? {};
        const now = Date.now();
        // Home Assistant's clock, as far as the browser can tell, from states
        // that are not the radar evidence being judged.
        const serverNow = latestIndependentReportTimestamp(states, radarEntityIds(this.#profiles), now);
        const runtimeRooms = this.#runtime?.rooms ?? {};
        const authoritative = runtimeSnapshotIsAuthoritative(this.#runtime, this.#runtimeReceivedAt, now);
        const rooms = roomsInHouse(applyAuthoritativeRuntimeTracking(this.#floorPlan.rooms, runtimeRooms, authoritative));
        const houses = new Map(rooms.map(room => [room.id, room.house]));
        const presence = collectLivePresence(rooms, this.#profiles,
            entityId => this.#receipts.state(entityId, states[entityId], now, serverNow),
            now, runtimeRooms, authoritative && this.#runtime?.available === true);
        const fusion = this.#fusion.apply(presence.people, rooms, this.#profiles, now);
        const roomStates = withFusedRooms(presence.rooms, fusion.people, fusion.fusedRoomIds);
        // Approximate markers stay on the plan: an occupied room without an
        // exact position, or the vacancy hold, is still somebody there.
        this.#tracks = liveTracks(this.#tracks, fusion.people, houses, now);
        const people = livePeople(this.#tracks, now);
        if (!same(this.#sentPeople, people)) {
            this.#editor.setPeople(people);
            this.#sentPeople = people;
        }
        const summary = detectionSummary(this.#text, people, roomStates);
        if (this.#detections.textContent !== summary) this.#detections.textContent = summary;
    }
}

if (!customElements.get('shs-floor-planner-page')) customElements.define('shs-floor-planner-page', FloorPlannerPage);
