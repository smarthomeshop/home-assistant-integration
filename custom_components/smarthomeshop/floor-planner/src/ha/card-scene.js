// <shs-floor-card-scene>: the floor planner scene inside the Live Home
// Lovelace card. The card hands it the project and the live presence; this
// element draws the home in 2D or 3D and keeps the people on it up to date.
//
//   scene    { plan, rooms, focus, scope, view, spacing, locale, labels,
//              floorNames, roomNames, dark }
//   presence { people, rooms, houses, trails? }
//   control('rotate' | 'fit' | 'zoom-in' | 'zoom-out')
import plannerCss from '../css/floor-planner.css?inline';
import haCss from './editor-ha.css?inline';
import { escapeText, paintPlan, paintRoomSurface } from '../js/floor-planner-drawing.mjs';
import { roomCorners } from '../js/floor-planner-geometry.mjs';
import { roomContents, validProject } from '../js/floor-planner-building.mjs';
import { defaultSpaceCamera, orbitSpaceCamera, paintBuilding, paintSpace, projectSpace } from '../js/floor-planner-space.mjs';
import { paintStairPlan } from '../js/floor-planner-stairs.mjs';
import { fadeLabelsNear, liveFloorFigures, screenOffset } from '../js/floor-planner-live.mjs';
import { paintPerson } from '../js/floor-planner-person.mjs';
import { daylightAt } from '../js/floor-planner-daylight.mjs';
import { findPlannerDevice, plannerDevices, projectFromRooms, withoutHiddenRooms } from './ha-rooms.js';

// The saved project when there is one, otherwise the Room Designer rooms, with
// hidden rooms left out and only sensors that still exist in Home Assistant.
export function prepareCardPlan(saved, rooms, profiles, haDevices) {
    const devices = plannerDevices(profiles, haDevices);
    const project = withoutHiddenRooms(validProject(saved) ? saved : projectFromRooms(rooms, profiles, devices));
    const floors = project.floors ?? [{ id: 'ground', level: 0, plan: project }];
    return {
        staircase: project.staircase,
        floors: floors.map(floor => ({ ...floor, plan: { ...floor.plan,
            sensors: floor.plan.sensors.filter(sensor => findPlannerDevice(devices, sensor.haDevice)) } })),
    };
}

const styles = new CSSStyleSheet();
styles.replaceSync(plannerCss + haCss.replace(/:root(\[[^\]]+\])/g, ':host($1)').replaceAll(':root', ':host') + `
    :host, #floor-planner { display:block; width:100%; height:100%; min-width:0; }
    #floor-planner { background:var(--ha-map); color:var(--ha-ink); overflow:auto; }
    .floor-views { height:100%; display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%, 225px),1fr));
        grid-auto-rows:minmax(148px,1fr); }
    figure { min-width:0; min-height:0; display:grid; grid-template-rows:auto minmax(0,1fr); margin:0; }
    .floor-views figure:only-child { grid-template-rows:minmax(0,1fr); }
    .floor-views figure:only-child figcaption { display:none; }
    .floor-views figure { border:1px solid color-mix(in srgb,var(--ha-border) 48%,transparent); }
    figcaption { padding:5px 10px; background:var(--ha-panel); color:var(--ha-muted); font-size:12px; font-weight:650; }
    svg { display:block; width:100%; height:100%; min-height:0; }
    .map-3d { cursor:grab; touch-action:pan-y; }
    .map-3d[data-dragging] { cursor:grabbing; }
    [data-hide-names] :is(.fp-room-label,.fp-space-room-label) { display:none; }
    .live-room { fill:light-dark(#eb950d35,#ffb95232); stroke:light-dark(#9c5808,#ffcc83); stroke-width:1.6px;
        stroke-dasharray:5 3; vector-effect:non-scaling-stroke; }
    .live-trail { fill:none; stroke-width:2px; stroke-linecap:round; stroke-linejoin:round; opacity:.58;
        vector-effect:non-scaling-stroke; pointer-events:none; }
    .live-target, .live-room { pointer-events:none; }
    .empty-map { display:grid; place-items:center; height:100%; margin:0; padding:14px; text-align:center; color:var(--ha-muted); }
`);

// Rooms are picked by their Home Assistant id; rooms drawn only in the planner by their own.
const roomKey = room => room.haRoom ?? room.id;

const zoomedViewBox = ([x, y, width, height], zoom) => {
    const zoomedWidth = width / zoom, zoomedHeight = height / zoom;
    return [x + (width - zoomedWidth) / 2, y + (height - zoomedHeight) / 2, zoomedWidth, zoomedHeight].join(' ');
};

const planViewBox = ({ rooms }) => {
    const left = Math.min(...rooms.map(room => room.x)), top = Math.min(...rooms.map(room => room.y));
    const right = Math.max(...rooms.map(room => room.x + room.width)), bottom = Math.max(...rooms.map(room => room.y + room.depth));
    return [left - .65, top - .65, right - left + 1.3, bottom - top + 1.3];
};

// Live positions arrive about once a second. People glide to each new position
// in about that time instead of jumping, unless they moved too far for a walk.
const glideTime = 950;
const longestGlide = 4;
const easing = t => t * t * (3 - 2 * t);

function glidePosition(motion, now) {
    const t = Math.max(0, Math.min(1, (now - motion.start) / glideTime));
    const distance = Math.hypot(motion.to.x - motion.from.x, motion.to.y - motion.from.y);
    const progress = easing(t);
    return {
        x: motion.from.x + (motion.to.x - motion.from.x) * progress,
        y: motion.from.y + (motion.to.y - motion.from.y) * progress,
        stride: motion.stride + distance * progress,
        moving: t < 1 && distance >= .05,
    };
}

// One floor cut down to the rooms the card shows.
function floorWithRooms(floor, keys) {
    const { plan } = floor;
    const rooms = plan.rooms.filter(room => keys.has(roomKey(room)));
    if (!rooms.length) return [];
    if (rooms.length === plan.rooms.length) return [floor];
    const parts = rooms.map(room => roomContents(plan, room));
    const contents = Object.fromEntries(Object.keys(parts[0]).map(key => [key, parts.flatMap(part => part[key])]));
    return [{ ...floor, plan: { ...plan, ...contents } }];
}

class FloorCardScene extends HTMLElement {
    #scene;
    #approximateRooms;
    #camera = { ...defaultSpaceCamera };
    #zoom = 1;
    #drag;
    #frame;
    #tracks = new Map();
    #motion = new Map();
    #liveFrame = 0;
    #daylight;
    #floors = [];
    #sceneKey = '';
    #people = [];
    #trails = [];
    #root;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [styles];
        this.shadowRoot.innerHTML = '<div id="floor-planner" class="fp fp-design-center"></div>';
        this.#root = this.shadowRoot.firstElementChild;
        this.#root.addEventListener('pointerdown', event => {
            if (this.#scene?.view !== '3d' || event.button !== 0 || !event.target.closest('svg')) return;
            this.#drag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: this.#camera };
            this.#root.setPointerCapture(event.pointerId);
            this.#root.querySelector('.map-3d')?.setAttribute('data-dragging', '');
        });
        this.#root.addEventListener('pointermove', event => {
            if (this.#drag?.id !== event.pointerId) return;
            this.#drag.moved = true;
            this.#camera = orbitSpaceCamera(this.#drag.camera, event.clientX - this.#drag.x, event.clientY - this.#drag.y);
            this.#frame ||= requestAnimationFrame(() => {
                this.#frame = null;
                this.#render();
            });
        });
        this.#root.addEventListener('lostpointercapture', () => {
            const moved = this.#drag?.moved;
            this.#drag = null;
            this.#root.querySelector('.map-3d')?.removeAttribute('data-dragging');
            // Frames drawn while dragging are drafts; draw the full model once at rest.
            if (moved) {
                cancelAnimationFrame(this.#frame);
                this.#frame = null;
                this.#render();
            }
        });
    }

    disconnectedCallback() {
        cancelAnimationFrame(this.#frame);
        cancelAnimationFrame(this.#liveFrame);
        this.#frame = null;
        this.#liveFrame = 0;
        this.#drag = null;
    }

    set scene(scene) {
        const scopeChanged = this.#scene?.scope !== scene.scope || this.#scene?.view !== scene.view;
        const key = JSON.stringify([scene.rooms, scene.focus, scene.spacing, scene.view, scene.locale, scene.labels, scene.floorNames]);
        const changed = this.#scene?.plan !== scene.plan || this.#sceneKey !== key;
        this.#scene = scene;
        this.dataset.haTheme = scene.dark ? 'dark' : 'light';
        this.#root.toggleAttribute('data-hide-names', !scene.roomNames);
        if (scopeChanged) this.#zoom = 1;
        if (!changed && !scopeChanged) return;
        this.#sceneKey = key;
        const keys = new Set(scene.rooms);
        this.#floors = scene.plan.floors.flatMap(floor => floorWithRooms(floor, keys))
            .map(floor => ({ ...floor, label: scene.floorNames[floor.level] }));
        this.#render();
    }

    // Live positions come in as millimetres in each room's own frame. Only
    // exact positions get a figure; a room that is occupied without one is
    // outlined instead.
    set presence({ people, rooms, houses, trails = [] }) {
        const now = performance.now();
        const tracks = new Map();
        const motion = new Map();
        for (const person of people) {
            const house = houses[person.roomId];
            if (person.approximate || !house) continue;
            const previous = this.#tracks.get(person.id);
            const x = person.x / 1000, y = person.y / 1000;
            const dx = x - (previous?.x ?? x), dy = y - (previous?.y ?? y);
            const moved = previous?.floor === person.floor && Math.hypot(dx, dy) >= .05;
            tracks.set(person.id, { ...person, x, y, house, pose: 'standing', plumbob: 'clear',
                heading: moved ? Math.atan2(dx, -dy) * 180 / Math.PI : previous?.heading ?? 0 });
            // The card hands over presence on every render; only a new position starts a new glide.
            const current = this.#motion.get(person.id);
            if (current && current.to.x === x && current.to.y === y && current.floor === person.floor) {
                motion.set(person.id, current);
                continue;
            }
            const shown = current ? glidePosition(current, now) : null;
            const glide = shown && current.floor === person.floor && Math.hypot(x - shown.x, y - shown.y) <= longestGlide;
            motion.set(person.id, { floor: person.floor, start: now, stride: shown?.stride ?? 0,
                from: glide ? { x: shown.x, y: shown.y } : { x, y }, to: { x, y } });
        }
        this.#tracks = tracks;
        this.#motion = motion;
        this.#trails = trails.flatMap(trail => {
            const house = houses[trail.roomId];
            if (!house || !Array.isArray(trail.points)) return [];
            const points = trail.points.flatMap((point, index) =>
                Number.isFinite(point?.x) && Number.isFinite(point?.y)
                    ? [{ ...point, id: `${trail.id}-point-${index}`, roomId: trail.roomId,
                        floor: trail.floor, x: point.x / 1000, y: point.y / 1000,
                        approximate: false, house, heading: 0 }]
                    : []);
            return points.length > 1 ? [{ ...trail, points }] : [];
        });
        this.#approximateRooms = new Set(rooms.filter(room => room.occupied && room.approximate).map(room => room.roomId));
        // Presence arrives every second, which is a good moment to notice evening has come.
        if (this.#scene?.view === '3d' && this.#daylight && this.#daylight !== daylightAt()) this.#render();
        this.#animateLive();
    }

    #animateLive() {
        cancelAnimationFrame(this.#liveFrame);
        this.#liveFrame = 0;
        const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const step = () => {
            const now = performance.now();
            let gliding = false;
            this.#people = [...this.#tracks.values()].map(person => {
                const motion = this.#motion.get(person.id);
                const shown = still ? { ...motion.to, stride: motion.stride, moving: false } : glidePosition(motion, now);
                gliding ||= shown.moving;
                return { ...person, ...shown };
            });
            this.#paintLive();
            this.#liveFrame = gliding ? requestAnimationFrame(step) : 0;
        };
        step();
    }

    control(action) {
        if (action === 'rotate') this.#camera = orbitSpaceCamera(this.#camera, Math.PI / .024, 0);
        if (action === 'fit') {
            this.#camera = { ...defaultSpaceCamera };
            this.#zoom = 1;
        }
        if (action === 'zoom-in' || action === 'zoom-out') {
            this.#zoom = action === 'zoom-in' ? Math.min(3.2, this.#zoom * 1.28) : Math.max(1, this.#zoom / 1.28);
            // Zooming only moves the view, so the drawing stays as it is.
            this.#applyZoom();
            return;
        }
        this.#render();
    }

    #applyZoom() {
        for (const svg of this.#root.querySelectorAll('svg[data-view]')) {
            svg.setAttribute('viewBox', zoomedViewBox(svg.dataset.view.split(' ').map(Number), this.#zoom));
        }
    }

    #render() {
        const { view, labels, locale, focus, spacing, scope, plan } = this.#scene;
        const floors = this.#floors;
        if (!floors.length) {
            this.#root.innerHTML = `<p class="empty-map">${escapeText(labels.empty)}</p>`;
            return;
        }
        // Live people are drawn into these layers by #paintLive.
        const liveLayer = floor => `<g data-live-floor="${escapeText(floor.id)}"></g>`;
        const selected = floors.flatMap(floor => floor.plan.rooms).find(room => roomKey(room) === focus)?.id;
        const staircase = scope.startsWith('room:') ? null : plan.staircase;
        if (view === '2d') {
            const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
            this.#root.innerHTML = `<div class="floor-views">${[...floors].sort((a, b) => b.level - a.level).map((floor, index) => {
                const view = planViewBox(floor.plan);
                const lower = staircase?.lower === floor.id;
                const stair = staircase && (lower || staircase.upper === floor.id) ? paintStairPlan(staircase, labels.stairs, lower) : '';
                // Every figure needs its own pattern ids.
                const drawing = paintPlan(floor.plan, false, selected, number).replaceAll('fp-slope-clearance', `fp-slope-clearance-${index}`);
                return `<figure data-floor="${floor.level}"><figcaption>${escapeText(floor.label)}</figcaption>
                    <svg viewBox="${zoomedViewBox(view, this.#zoom)}" data-view="${view.join(' ')}" role="img" aria-label="${escapeText(floor.label)} · 2D">
                        <defs><pattern id="card-grid-${index}" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 1V0H1" fill="none" stroke="var(--ha-grid-major)" stroke-width=".7" vector-effect="non-scaling-stroke"/></pattern></defs>
                        <rect x="-500" y="-500" width="1000" height="1000" fill="url(#card-grid-${index})" opacity=".42"/>${drawing}${stair}${liveLayer(floor)}
                    </svg></figure>`;
            }).join('')}</div>`;
        } else {
            const [first] = floors;
            const stacked = floors.length > 1;
            const ownStair = staircase?.lower === first.id || staircase?.upper === first.id;
            const draft = Boolean(this.#drag?.moved);
            // Live Home shows the home in the light of the current time of day.
            const daylight = this.#daylight = daylightAt();
            const space = stacked
                ? paintBuilding(floors, this.#camera, spacing, staircase, null, { selected, paintForeground: liveLayer, draft, daylight })
                : paintSpace(first.plan, this.#camera, selected, { staircase: ownStair ? staircase : null, upperStair: staircase?.upper === first.id, draft, daylight });
            if (!space) return;
            this.#root.innerHTML = `<svg class="map-3d" ${this.#drag ? 'data-dragging' : ''} viewBox="${zoomedViewBox(space.viewBox.split(' ').map(Number), this.#zoom)}"
                data-view="${space.viewBox}" role="img" aria-label="${escapeText(labels.map)} · 3D">${space.markup}${stacked ? '' : liveLayer(first)}</svg>`;
        }
        this.#paintLive();
    }

    // Redraws only the live layers, and only the ones whose markup changed.
    #paintLive() {
        const camera = this.#scene?.view === '3d' ? this.#camera : null;
        const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
        const faded = [];
        const svg = this.#root.querySelector('.map-3d');
        for (const layer of this.#root.querySelectorAll('[data-live-floor]')) {
            const rooms = this.#floors.find(floor => floor.id === layer.dataset.liveFloor).plan.rooms;
            const occupied = rooms.filter(room => this.#approximateRooms?.has(roomKey(room))).map(room => camera
                ? `<polygon class="live-room" points="${roomCorners(room).map(corner => projectSpace(corner, .022, camera).join(',')).join(' ')}"/>`
                : paintRoomSurface(room, 'class="live-room"'));
            const trails = this.#trails.flatMap(trail => {
                const points = liveFloorFigures(trail.points, rooms);
                if (points.length < 2) return [];
                const projected = points.map(point => camera
                    ? projectSpace([point.x, point.y], .025, camera).join(',')
                    : `${point.x},${point.y}`).join(' ');
                const color = /^#[\da-f]{6}$/i.test(trail.color || '') ? trail.color : '#4361ee';
                return [`<polyline class="live-trail" stroke="${color}" points="${projected}"/>`];
            });
            const people = liveFloorFigures(this.#people, rooms);
            const figures = people.map(person => `<g class="live-target">${paintPerson(person, camera, motion)}</g>`);
            const markup = occupied.join('') + trails.join('') + figures.join('');
            if (layer.liveMarkup !== markup) {
                layer.liveMarkup = markup;
                layer.innerHTML = markup;
            }
            if (camera) {
                const offset = screenOffset(layer, svg);
                faded.push(...people.map(({ x, y }) => {
                    const [screenX, foot] = projectSpace([x, y], 0, camera);
                    return { x: screenX, foot: foot + offset, head: projectSpace([x, y], 1.8, camera)[1] + offset };
                }));
            }
        }
        if (camera) fadeLabelsNear(svg, faded);
    }
}

if (!customElements.get('shs-floor-card-scene')) customElements.define('shs-floor-card-scene', FloorCardScene);
