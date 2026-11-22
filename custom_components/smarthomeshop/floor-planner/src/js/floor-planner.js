import '../css/floor-planner.css';
import { formatPlannerLink, parsePlannerLink } from './ceilsense-planner';
import { ceilingDirections, ceilingHeightAt, ceilingHeightLimits, ceilingPitch, ceilingPosition, ceilingProfile, ceilingTypes } from './floor-planner-ceiling.mjs';
import {
    blankPlan, canAimSensor, ceilingCoverageStatus, ceilingReferenceRange, contains, demoPlan, devices, floorFinishes, guidePlanForRoom, hasMotionSensor, installationFor, installationsFor,
    newId, radarNames, radarsFor, readDemo, roomForDevice, sameSensorPlacement, sensorPan, sensorTilt, snap, validPlan, wallColors, zoneTypes,
} from './floor-planner-model.mjs';
import { escapeText, paintFurniture, paintPlacementPreview, paintPlan } from './floor-planner-drawing.mjs';
import {
    defaultWindowSill, edgePosition, maxRoomCorners, outlineBounds, polygonEdges, roomArea, roomContains, roomCorners, roomInteriorPoint, roomRayEnd,
    roomWallEdges,
} from './floor-planner-geometry.mjs';
import { furnitureAt, furnitureCatalog, furnitureFootprint, furnitureMaterials, maxFurniture, withFurniture } from './floor-planner-furniture.mjs';
import { defaultSpaceCamera, orbitSpaceCamera, paintBuilding, paintSpace, projectSpace, unprojectFloor } from './floor-planner-space.mjs';
import { buildingFormat, floorLabel, localizeSampleRooms, maxFloors, moveRoomToFloor, roomContents, roomOpening, rotatedRoom, sampleBuilding, snapRoomOffset, translatedItem, validProject, wallOpeningPosition } from './floor-planner-building.mjs';
import { floorStackHeight, insideStairwell, paintStairPlan, stairGait, stairGaitDuration, stairHeading, stairOcclusionId, stairPoint,
    stairSafeStart, stairTrip, stairWalls } from './floor-planner-stairs.mjs';
import { paintBeam, paintFloorCoverage, paintWallCoverage } from './floor-planner-beam.mjs';
import { ceilingProfiles, motionField, radarFields, radarProfileFor } from './floor-planner-radar.mjs';
import { aimSideView, aimTopView, directionTo, heightTo, motionReach, onDevice, reachText, tiltText, tiltTo, turnText, turnTo } from './floor-planner-aim.mjs';
import { emptyRoute, movePerson, paintPerson, paintWalkLines, personAt, personSignals, preparePersonSensors, recordWalk, routeCoverage, solidWalls } from './floor-planner-person.mjs';
import { createWalkControls } from './floor-planner-person-input.mjs';
import { fadeLabelsNear, liveFloorFigures, screenOffset } from './floor-planner-live.mjs';
import { createWalkNetwork } from './floor-planner-walk-route.mjs';
import { activityDuration, createWalkActivities, paintActivityEffect, walkTestPhase } from './floor-planner-activity.mjs';
import { prepareFurnitureOcclusion } from './floor-planner-obstruction.mjs';
import { wallModes } from './floor-planner-maquette.mjs';
import { daylights } from './floor-planner-daylight.mjs';
import { coverageCells, coverageSummary, paintCoverageHeat } from './floor-planner-heatmap.mjs';
import { doorAt, doorsHeldOpen, planWithOpenDoors, prepareSight } from './floor-planner-sight.mjs';
import { removeOrphanedSensorZones, removeZonesOwnedBySensor } from './floor-planner-zones.mjs';
import {
    calibrateUnderlay, imagePart, loadUnderlay, maxImageData, movedPart, roomTransparency, startingWidth, underlayKind, underlayMessage,
    underlayPixels, usablePart, wholeImage,
} from './floor-planner-underlay.mjs';
import { followTracedWalls, traceFloorPlan } from './floor-planner-trace.mjs';
import { embeddedMap, mapRooms, traceColourMap } from './floor-planner-vacuum.mjs';
import { chosenTool, toolRepeats } from './floor-planner-tools.mjs';
import { recognise as siteRecognise, sharing as siteSharing } from './floor-planner-account.js';
import { pdfDocument, sheetFileName, sheetFloors, sheetPages } from './floor-planner-sheet.mjs';
import {
    draftFromRecognition, planWithDraft, recognitionNote, recognitionProblem, recognitionProgress, recognitionWaiting, roomsWaitingForScale,
} from './floor-planner-recognise.mjs';
import {
    devicesForRoomArea, roomWithHomeAssistantArea, roomWithHomeAssistantFloor,
} from './floor-planner-home-assistant.mjs';

const element = id => document.getElementById(id);
const root = element('floor-planner');
const canvas = element('fp-plan');
const board = element('fp-board');
const drawing = element('fp-drawing');
const ghost = element('fp-ghost');
const roomMidpoints = element('fp-room-midpoints');
const roomHandles = element('fp-room-handles');
const roomHandleFeedback = element('fp-room-handle-feedback');
const space = element('fp-space');
const sensorTip = element('fp-sensor-tip');
const stage = element('fp-walk-stage');
const stairPrompt = element('fp-stair-prompt');
const simGuide = element('fp-sim-guide');
const simCast = element('fp-sim-cast');
const simTools = element('fp-sim-tools');
const simMenus = [simCast, simTools];
const simReading = root.querySelector('[data-action="show_readings"]');
const sensorEdit = element('fp-sensor-edit');
const pdfPages = element('fp-pdf-pages');
// A page that was made before a part of the image could be chosen has no such dialog.
const imageParts = element('fp-crop');
const sensorEditForm = element('fp-sensor-edit-form');
const projectMenu = element('fp-project-menu');
const projectTrigger = projectMenu.querySelector('summary');
const floorMenu = element('fp-floor-menu');
const floorTrigger = floorMenu.querySelector('summary');
const drawingMenu = element('fp-drawing-menu');
const toolbox = element('fp-toolbox');
const viewMenu = element('fp-view-menu');
const library = element('fp-library');
const sidebar = element('fp-sidebar');
const compactLibrary = matchMedia('(max-width: 760px)');
const libraryIsOpen = () => sidebar.hasAttribute('data-library') || library.matches(':popover-open');
const libraryButton = root.querySelector('[data-action="library"]');
const roomForm = element('fp-room-form');
const roomStep = root.querySelector('[data-action="flow_room"]');
const sensorStep = root.querySelector('[data-action="flow_sensor"]');
const testStep = root.querySelector('[data-action="test_person"]');
const orderStep = root.querySelector('[data-action="next_order"]');
const extraSensor = root.querySelector('[data-action="next_extra_sensor"]');
const copy = JSON.parse(element('fp-copy').textContent);
const integration = globalThis.floorPlannerHost;
const appPlanner = integration?.mode === 'app';
// Finding the rooms on an uploaded floor plan runs in an account service: the
// host's (Home Assistant), or the one the site provides. Without one, or
// without the texts for it, the button is not shown at all.
const recogniseRooms = (integration ? integration.recognise : siteRecognise) || null;
const recognition = recogniseRooms && copy.recognise_action ? (() => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fp-recognise';
    button.dataset.action = 'recognise_underlay';
    button.textContent = copy.recognise_action;
    const note = document.createElement('p');
    note.className = 'fp-note fp-recognise-note';
    note.setAttribute('role', 'status');
    const controls = document.getElementById('fp-underlay-controls');
    controls.insertBefore(button, controls.querySelector('[data-action="scale_underlay"]'));
    // While the plan is being read: a bar with an estimate of how far it is.
    const meter = document.createElement('span');
    meter.className = 'fp-recognise-meter';
    meter.hidden = true;
    const bar = document.createElement('progress');
    bar.max = 100;
    bar.setAttribute('aria-label', copy.recognise_action);
    const share = document.createElement('span');
    share.setAttribute('aria-hidden', 'true');
    meter.append(bar, share);
    controls.append(meter, note);
    // And a light that sweeps over the image itself, where the user is looking.
    const drawn = name => document.createElementNS('http://www.w3.org/2000/svg', name);
    const scan = drawn('g');
    scan.setAttribute('class', 'fp-underlay-scan');
    scan.setAttribute('pointer-events', 'none');
    scan.setAttribute('hidden', '');
    const light = drawn('linearGradient');
    light.id = 'fp-underlay-scan-light';
    for (const [offset, opacity] of [[0, 0], [.5, .55], [1, 0]]) {
        const stop = drawn('stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-opacity', opacity);
        light.append(stop);
    }
    // A drawing of its own with the size of the image, so the light stays inside it.
    const frame = drawn('svg');
    const tint = drawn('rect'), beam = drawn('rect');
    tint.setAttribute('class', 'fp-underlay-scan-tint');
    beam.setAttribute('class', 'fp-underlay-scan-beam');
    beam.setAttribute('fill', 'url(#fp-underlay-scan-light)');
    for (const [shape, width] of [[tint, '100%'], [beam, '16%']]) {
        shape.setAttribute('width', width);
        shape.setAttribute('height', '100%');
    }
    frame.append(tint, beam);
    scan.append(light, frame);
    document.getElementById('fp-underlay').after(scan);
    const percentage = new Intl.NumberFormat(root.dataset.locale, { style: 'percent' });
    return { button, note, meter, bar, share, scan, frame, percentage, timer: 0, state: 'idle', image: null, pending: null };
})() : null;

// Tracing the walls on the image runs here, in the browser: no account and
// nothing is sent. It needs the image's scale, because a wall, a door and a
// room are only told apart by their real size.
const tracing = copy.trace_action ? (() => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = 'trace_underlay';
    button.textContent = copy.trace_action;
    const note = document.createElement('p');
    note.className = 'fp-note fp-recognise-note';
    note.setAttribute('role', 'status');
    note.hidden = true;
    const controls = document.getElementById('fp-underlay-controls');
    controls.insertBefore(button, controls.querySelector('[data-action="scale_underlay"]'));
    controls.append(note);
    return { button, note, busy: false, pending: false, image: null };
})() : null;

// The plan as an image or a PDF, and as a link where the site keeps shared
// plans, sit with the other files in the project menu. So does the map of a
// robot vacuum, where Home Assistant has one.
const fileButtons = (() => {
    const files = root.querySelector('.fp-project-files');
    if (!files) return {};
    const made = {};
    // Each goes after the button it belongs with, or after the one before it.
    for (const [action, label, drawing, after] of [
        ['vacuum_map', integration?.vacuumMaps && integration.picker.vacuumAction,
            '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.2"/><path d="M10 3v2.3m-5.4 1 1.7 1.4m9.1-1.4-1.7 1.4"/>', 'import_underlay'],
        ['sheet_image', copy.sheet_image, '<rect x="3" y="4" width="14" height="12" rx="1.5"/><path d="m3 13 4-4 3 3 2-2 5 5m-4-7h.1"/>', 'export'],
        ['sheet_pdf', copy.sheet_pdf, '<path d="M5 2.5h6l4 4v11H5zM11 2.5v4h4M7.5 11h5m-5 3h5"/>', 'sheet_image'],
        ['share', siteSharing && copy.share_action, '<path d="M8.6 11.4a3 3 0 0 0 4.2 0l2.7-2.7a3 3 0 0 0-4.2-4.2l-1 1m1.1 3.1a3 3 0 0 0-4.2 0l-2.7 2.7a3 3 0 0 0 4.2 4.2l1-1"/>', 'sheet_pdf'],
    ]) {
        if (!label) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = action;
        button.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${drawing}</svg>`;
        button.append(' ' + label);
        (made[after] ?? files.querySelector(`[data-action="${after}"]`) ?? files.querySelector('[data-action="export"]') ?? files.lastElementChild).after(button);
        made[action] = button;
    }
    return made;
})();

// A home without a robot vacuum has no map to offer. One may be added while
// the planner is open, so the menu looks again every time it opens.
if (fileButtons.vacuum_map) {
    const offer = () => { fileButtons.vacuum_map.hidden = !integration.robotVacuum(); };
    offer();
    projectMenu.addEventListener('toggle', offer);
}

// A home with more than one robot map, or a robot that keeps a map of every
// floor, asks which one to use.
const vacuumChoice = fileButtons.vacuum_map ? (() => {
    const picked = integration.picker;
    const dialog = document.createElement('dialog');
    dialog.className = 'fp-furniture-dialog fp-sensor-edit fp-vacuum-maps';
    dialog.id = 'fp-vacuum-maps';
    dialog.setAttribute('aria-labelledby', 'fp-vacuum-title');
    dialog.setAttribute('aria-describedby', 'fp-vacuum-text');
    dialog.innerHTML = `<div class="fp-furniture-heading"><div><h2 id="fp-vacuum-title"></h2><p id="fp-vacuum-text"></p></div></div>
        <form method="dialog"><div class="fp-sensor-edit-body fp-vacuum-list"></div>
        <div class="fp-sensor-edit-footer"><button type="submit" value=""></button></div></form>`;
    dialog.querySelector('h2').textContent = picked.vacuumTitle;
    dialog.querySelector('#fp-vacuum-text').textContent = picked.vacuumIntro;
    dialog.querySelector('.fp-sensor-edit-footer button').textContent = copy.cancel_place;
    document.getElementById('fp-pdf-pages').after(dialog);
    return { dialog, list: dialog.querySelector('.fp-vacuum-list') };
})() : null;

// In Home Assistant a room can get an automation that lets its lights follow
// who is there. The host makes it; this is where it is set up.
const automationPanel = integration?.presenceLights ? (() => {
    const picked = integration.picker;
    const dialog = document.createElement('dialog');
    dialog.className = 'fp-furniture-dialog fp-sensor-edit fp-room-automation';
    dialog.id = 'fp-room-automation';
    dialog.setAttribute('aria-labelledby', 'fp-automation-title');
    dialog.setAttribute('aria-describedby', 'fp-automation-text');
    dialog.innerHTML = `<div class="fp-furniture-heading"><div><h2 id="fp-automation-title"></h2><p id="fp-automation-text"></p></div></div>
        <form method="dialog"><div class="fp-sensor-edit-body">
            <p class="fp-note" data-automation="lights" hidden></p>
            <label data-automation="minutes" hidden><span></span><input type="number" min="1" max="120" step="1" inputmode="numeric" required></label>
            <label class="fp-sensor-edit-check" data-automation="dark" hidden><input type="checkbox"> <span></span></label>
            <p class="fp-note" role="status" hidden></p>
            <a data-automation="open" target="_blank" rel="noopener" hidden></a>
        </div>
        <div class="fp-sensor-edit-footer">
            <button type="submit" value=""></button>
            <button type="button" data-automation="remove" hidden></button>
            <button type="button" class="fp-primary" data-automation="save" hidden></button>
        </div></form>`;
    const part = name => dialog.querySelector(`[data-automation="${name}"]`);
    dialog.querySelector('h2').textContent = picked.automationTitle;
    part('minutes').firstElementChild.textContent = picked.automationMinutes;
    part('dark').lastElementChild.textContent = picked.automationDark;
    part('remove').textContent = picked.automationRemove;
    part('open').textContent = picked.automationOpen;
    document.getElementById('fp-pdf-pages').after(dialog);
    return { dialog, text: dialog.querySelector('#fp-automation-text'), lights: part('lights'), minutes: part('minutes'), dark: part('dark'),
        note: dialog.querySelector('[role="status"]'), open: part('open'), remove: part('remove'), save: part('save'),
        close: dialog.querySelector('.fp-sensor-edit-footer button'), room: null };
})() : null;

// Sharing asks first: the link opens a copy of the plan for anyone who has it.
const sharePanel = fileButtons.share ? (() => {
    const dialog = document.createElement('dialog');
    dialog.className = 'fp-furniture-dialog fp-sensor-edit fp-share';
    dialog.id = 'fp-share';
    dialog.setAttribute('aria-labelledby', 'fp-share-title');
    dialog.setAttribute('aria-describedby', 'fp-share-text');
    dialog.innerHTML = `<div class="fp-furniture-heading"><div><h2 id="fp-share-title"></h2><p id="fp-share-text"></p></div></div>
        <div class="fp-sensor-edit-body">
            <label class="fp-share-link" hidden><span></span><input type="text" readonly></label>
            <p class="fp-note" role="status" hidden></p>
        </div>
        <form method="dialog"><div class="fp-sensor-edit-footer">
            <button type="submit" value=""></button>
            <button type="button" class="fp-primary" data-share="create"></button>
            <button type="button" class="fp-primary" data-share="copy" hidden></button>
        </div></form>`;
    dialog.querySelector('h2').textContent = copy.share_title;
    dialog.querySelector('#fp-share-text').textContent = copy.share_intro;
    const [close, create, copyLink] = dialog.querySelectorAll('button');
    close.textContent = copy.cancel_place;
    create.textContent = copy.share_create;
    copyLink.textContent = copy.share_copy;
    const field = dialog.querySelector('.fp-share-link');
    field.firstElementChild.textContent = copy.share_label;
    document.getElementById('fp-pdf-pages').after(dialog);
    return { dialog, close, create, copyLink, field, link: field.querySelector('input'), note: dialog.querySelector('[role="status"]') };
})() : null;

// Zoom in the corner of the map, where it is seen: out, how far the map is
// zoomed, in, and back to the whole plan. It works in 2D and in 3D. The same
// actions stay in the view menu.
const zoomBar = copy.zoom_in && copy.zoom_out && copy.fit ? (() => {
    const bar = document.createElement('div');
    bar.className = 'fp-zoom-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', copy.zoom_controls ?? copy.zoom_in);
    const button = (action, label, drawing) => {
        const control = document.createElement('button');
        control.type = 'button';
        control.dataset.action = action;
        control.title = label;
        control.setAttribute('aria-label', label);
        control.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${drawing}"/></svg>`;
        return control;
    };
    const zoomIn = button('map_zoom_in', copy.zoom_in, 'M4 10h12m-6-6v12');
    const level = document.createElement('output');
    level.className = 'fp-zoom-level';
    const zoomOut = button('map_zoom_out', copy.zoom_out, 'M4 10h12');
    const whole = button('map_fit', copy.fit, 'M7 3H3v4m10-4h4v4m0 6v4h-4m-6 0H3v-4');
    bar.append(zoomIn, level, zoomOut, whole);
    document.getElementById('fp-walk-stage').append(bar);
    return { zoomIn, zoomOut, level, share: new Intl.NumberFormat(root.dataset.locale, { style: 'percent', maximumFractionDigits: 0 }) };
})() : null;

// Where a wall sensor looks. Two drawings in the sensor dialog show it from
// above and from the side. Dragging in them, or the slider under each, turns
// and tilts the sensor; the number beside the slider sets it exactly. Made
// here so every page that shows the planner has them.
const sensorAim = ['aim_top', 'aim_side', 'aim_turn', 'aim_tilt', 'aim_reach'].every(key => copy[key]) ? (() => {
    const box = document.createElement('div');
    box.className = 'fp-aim';
    box.hidden = true;
    const views = document.createElement('div');
    views.className = 'fp-aim-views';
    const part = (view, caption, name, title) => {
        const figure = document.createElement('figure');
        figure.className = 'fp-aim-view';
        figure.dataset.view = view;
        const heading = document.createElement('figcaption');
        heading.textContent = caption;
        const drawing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        drawing.setAttribute('aria-hidden', 'true');
        const row = document.createElement('div');
        row.className = 'fp-aim-row';
        const label = document.createElement('label');
        const text = document.createElement('span');
        text.textContent = title;
        const words = document.createElement('output');
        const slider = document.createElement('input');
        Object.assign(slider, { type: 'range', step: 1, id: `fp-aim-${name}`, disabled: true });
        label.htmlFor = slider.id;
        label.append(text, words);
        const input = document.createElement('input');
        Object.assign(input, { name, type: 'number', step: 1, required: true, disabled: true });
        input.setAttribute('aria-label', title);
        row.append(label, slider, input);
        figure.append(heading, drawing, row);
        views.append(figure);
        return { drawing, slider, input, words };
    };
    const turn = part('top', copy.aim_top, 'aim', copy.aim_turn), tilt = part('side', copy.aim_side, 'tilt', copy.aim_tilt);
    for (const control of [tilt.input, tilt.slider]) Object.assign(control, { min: sensorTilt.min, max: sensorTilt.max });
    const hint = document.createElement('p');
    hint.className = 'fp-note';
    hint.textContent = copy.aim_hint ?? '';
    hint.hidden = !hint.textContent;
    const note = document.createElement('p');
    note.className = 'fp-note fp-aim-seen';
    note.setAttribute('role', 'status');
    // What the PIR of the device adds, and what it does not see.
    const lens = document.createElement('p');
    lens.className = 'fp-note fp-aim-lens';
    lens.hidden = true;
    box.append(views, hint, note, lens);
    document.getElementById('fp-sensor-edit-height').after(box);
    return { box, turn, tilt, note, lens, preview: null };
})() : null;

// What can be done with the selected door, on the map itself: the panel with
// its settings is often closed, and a door is opened and closed all the time.
const doorActions = copy.door_close && copy.door_open ? (() => {
    const bar = document.createElement('div');
    bar.className = 'fp-place-actions fp-door-actions';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', copy.door);
    bar.hidden = true;
    const name = document.createElement('span');
    name.textContent = copy.door;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.dataset.action = 'toggle_door';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.action = 'delete';
    remove.textContent = copy.remove;
    bar.append(name, toggle, remove);
    document.getElementById('fp-walk-stage').append(bar);
    return { bar, toggle };
})() : null;

function showDoorActions() {
    if (!doorActions) return;
    const { type, item } = selectedItem();
    const shown = type === 'doors' && tool === 'edit' && !simulation && !liveMode;
    doorActions.bar.hidden = !shown;
    if (shown) doorActions.toggle.textContent = item.closed ? copy.door_open : copy.door_close;
}

// Removing a room takes what hangs on its walls with it, so it asks first.
const roomRemoval = copy.room_delete_title && copy.room_delete_confirm ? (() => {
    const dialog = document.createElement('dialog');
    dialog.className = 'fp-furniture-dialog fp-sensor-edit';
    dialog.id = 'fp-room-delete';
    dialog.setAttribute('aria-labelledby', 'fp-room-delete-title');
    dialog.setAttribute('aria-describedby', 'fp-room-delete-text');
    dialog.innerHTML = `<div class="fp-furniture-heading"><div><h2 id="fp-room-delete-title"></h2><p id="fp-room-delete-text"></p></div></div>
        <form method="dialog"><div class="fp-sensor-edit-footer">
            <button type="submit" value="" autofocus></button>
            <button type="submit" class="fp-primary fp-danger" value="delete"></button>
        </div></form>`;
    dialog.querySelector('h2').textContent = copy.room_delete_title;
    const [keep, remove] = dialog.querySelectorAll('button');
    keep.textContent = copy.cancel_place;
    remove.textContent = copy.room_delete_confirm;
    pdfPages.after(dialog);
    return dialog;
})() : null;

// The rooms between the walls on the image, at the given width in metres.
// Null when the image cannot be read or traced.
async function tracedUnderlay(underlay, metres = underlay.width) {
    try {
        const pixels = await underlayPixels(underlay);
        const traced = traceFloorPlan(pixels, metres);
        // An image without walls to find, such as the map of a robot vacuum,
        // has its rooms as areas of colour.
        return traced?.rooms.length ? traced : traceColourMap(pixels, metres) ?? traced;
    } catch {
        return null;
    }
}

// Adds the rooms of an answer to the plan, on the image as it lies now. A
// room that matches the walls on the image takes their outline.
async function addRecognisedRooms(answer, keepScale) {
    const underlay = plan.underlay;
    const width = answer?.recognition?.width_m;
    const traced = await tracedUnderlay(underlay, !keepScale && Number.isFinite(width) && width > 0 ? width : underlay.width);
    if (plan.underlay?.data !== underlay.data) return showRecognition('idle');
    const recognition = traced ? followTracedWalls(answer?.recognition, traced) : answer?.recognition;
    const draft = draftFromRecognition(recognition, plan.underlay, { roomName: copy.room, keepScale });
    const next = draft && planWithDraft(plan, draft);
    if (!next) throw Object.assign(new Error('No rooms'), { code: draft ? 'recognition_failed' : 'no_rooms_found' });
    remember();
    const added = next.rooms.length - plan.rooms.length;
    plan = next;
    setTool('edit');
    finish();
    fit();
    showRecognition('idle', recognitionNote(copy, { rooms: added, quota: answer.quota }, value => number.format(value)));
}

function showTracing(message = '', busy = false) {
    if (!tracing) return;
    tracing.busy = busy;
    tracing.button.disabled = busy;
    tracing.button.toggleAttribute('aria-busy', busy);
    tracing.note.textContent = message;
    tracing.note.hidden = !message;
}

// Adds the rooms found between the walls of the image, which has its scale.
// Spaces that already have a room keep it.
async function traceUnderlay() {
    const underlay = plan.underlay;
    showTracing(copy.trace_busy, true);
    // Let the message show before the work, which takes a moment, starts.
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
    const traced = await tracedUnderlay(underlay);
    if (plan.underlay?.data !== underlay.data) return showTracing();
    const draft = traced?.rooms.length ? draftFromRecognition(traced, plan.underlay, { roomName: copy.room, keepScale: true }) : null;
    if (!draft) return showTracing(copy.trace_none);
    const rooms = draft.rooms.filter(room => !plan.rooms.some(existing => roomContains(existing, roomInteriorPoint(room))));
    const kept = new Set(rooms.map(room => room.id));
    const next = rooms.length && planWithDraft(plan, { ...draft, rooms, doors: draft.doors.filter(door => kept.has(door.roomId)) });
    if (!next) return showTracing(rooms.length ? copy.trace_none : copy.trace_none_new);
    remember();
    const added = next.rooms.length - plan.rooms.length;
    plan = next;
    setTool('edit');
    finish();
    fit();
    showTracing(copy.trace_done.replace(':count', number.format(added)));
}

// idle: the plain button. armed: the user saw where the image goes and can
// send it. busy: waiting for the answer. A message stays until the next step.
function showRecognition(state, message = '') {
    if (!recognition) return;
    recognition.state = state;
    recognition.button.textContent = copy[state === 'armed' ? 'recognise_send' : 'recognise_action'];
    recognition.button.disabled = state === 'busy';
    recognition.button.toggleAttribute('aria-busy', state === 'busy');
    recognition.note.textContent = state === 'armed' ? `${copy.recognise_privacy} ${copy.recognise_account}`
        : state === 'busy' ? copy.recognise_busy : message;
    recognition.note.hidden = !recognition.note.textContent;
    // The bar and the light over the image only show while the answer is awaited.
    clearInterval(recognition.timer);
    recognition.meter.hidden = state !== 'busy';
    recognition.scan.toggleAttribute('hidden', state !== 'busy');
    if (state !== 'busy') return;
    const started = performance.now();
    const tick = () => {
        const done = recognitionProgress(performance.now() - started);
        recognition.bar.value = done;
        recognition.share.textContent = recognition.percentage.format(done / 100);
    };
    tick();
    recognition.timer = setInterval(tick, 250);
}
// Ceilings above the measured range get a conservative estimated outline,
// in the shop as well as in Home Assistant, instead of no outline at all.
const coverageRadarOptions = { allowHeightEstimate: true };
const coverageEstimateLabel = integration?.coverageEstimate ?? copy.coverage_estimate ?? copy.height_note;
const coverageEstimateLegend = document.createElement('span');
if (coverageEstimateLegend) {
    const symbol = document.createElement('i');
    symbol.className = 'fp-legend-range';
    symbol.setAttribute('aria-hidden', 'true');
    coverageEstimateLegend.hidden = true;
    coverageEstimateLegend.append(symbol, coverageEstimateLabel);
    element('fp-legend').append(coverageEstimateLegend);
}
// The PIR of a sensor has its own line on the map; the legend says what it is.
const motionLegend = copy.legend_motion ? (() => {
    const entry = document.createElement('span');
    const symbol = document.createElement('i');
    symbol.className = 'fp-legend-motion';
    symbol.setAttribute('aria-hidden', 'true');
    entry.hidden = true;
    entry.append(symbol, copy.legend_motion);
    element('fp-legend').append(entry);
    return entry;
})() : null;
let liveMode = false;
let livePeople = [];
const openingWidth = element('fp-opening-width');
const openingHeight = element('fp-opening-height');
const openingDefaults = {
    door: { width: .9, min: .5, max: 2 },
    window: { width: 1.2, min: .1, max: 8, height: 1.05, base: defaultWindowSill },
    mirror: { width: .7, min: .1, max: 8, height: 1.4, base: .5 },
};
const number = new Intl.NumberFormat(root.dataset.locale, { maximumFractionDigits: 2 });
const tenth = new Intl.NumberFormat(root.dataset.locale, { maximumFractionDigits: 1 });
const maxProjectFileSize = maxFloors * (maxImageData + 1_000_000);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const sharedRoom = parsePlannerLink(location.hash);
const demo = sharedRoom ?? readDemo(location.search);
const exampleHome = !integration && !demo && new URLSearchParams(location.search).get('example') === 'home';
// A plan opened from a shared link is kept apart, so it does not replace the
// visitor's own plan.
const sharedPlan = !integration && !demo && !exampleHome && typeof siteSharing?.key === 'string' && siteSharing.key ? siteSharing.key : null;
const storageKey = 'smarthomeshop.sensor-planner.v1' + (sharedRoom ? location.hash : demo
    ? `.${demo.width}-${demo.depth}-${demo.height}-${demo.radar}${demo.obstacles ? '-obstacles' : ''}` : exampleHome ? '.example-home'
        : sharedPlan ? '.shared.' + sharedPlan : '');

const withEditableFurniture = plan => withFurniture(plan, copy.furniture_items);
const demoHome = () => sampleBuilding(copy.names, copy.furniture_items);
let building = exampleHome ? demoHome() : null;
let plan = building?.floors[0].plan ?? withEditableFurniture(demo ? demoPlan(demo, copy.names) : blankPlan(copy.names.untitled));
let showStart = !demo && !exampleHome;
let stopDemoPreview;
let roomFormOpen = false;
let placementInstallation = null;
let placementDevice = null;
let allFloors = false;
let floorSeparation = 1;
let showMeasures = false;
let tool = 'edit';
const placingOpening = () => Object.hasOwn(openingDefaults, tool);
let choice = null;
// How many items the active tool has placed since it was chosen.
let placedWithTool = 0;
let start = null;
let roomDraft = [];
let draftCorner = 0;
let selected = plan.sensors[0]?.id;
let showCoverage = true;
let showHeatmap = false;
let heatCache = null;
let beamChoices = [];
let beamChoice = '';
let beamKey = null;
let beamPanelKey = null;
let detectedBeam = null;
let inspectedMarker = null;
let sensorTipTimer = 0;
let editingSensor = null;
let view = '2d';
let spaceCamera = defaultSpaceCamera;
let spaceBounds = null;
let spaceZoom = 1;
let wallMode = viewPreference('fp-wall-mode', wallModes);
let daylight = viewPreference('fp-daylight', daylights);
let detailedSpacePeople = true;
let spaceFollow = false;
let orbitDrag = null;
let orbitFrame = 0;
let ignoreSpaceClick = false;
let simulation = false;
let reviewedCoverage = false;
const walkers = { man: null, woman: null, child: null };
let activeWalker = 'man';
const currentWalker = () => walkers[activeWalker];
const walkFloorId = () => building?.activeFloor ?? 'ground';
const walkersOnFloor = () => Object.entries(walkers).filter(([, walker]) => walker?.floorId === walkFloorId());
let walkWalls = [];
let walkSensors = [];
let walkFurniture = [];
// What the test people are seen through: the walls and open doors of the
// floor. A closed door counts as open while somebody stands at it.
let walkSight = null;
let heldDoors = new Set();
let heldDoorPaint = false;
let readingKey = null;
let autoWalk = null;
let autoWalkFrame = 0;
let stairWalk = null;
let stairFrame = 0;
let camera = { x: 5, y: 4, height: 11 };
let interaction = null;
const touchPositions = new Map();
let pinch = null;
let ignoreTouchClick = false;
let recentUndo = null;
let cursor = null;
let underlayMeasure = null;
let libraryOpener = null;
let libraryPanelWasOpen = false;
let quickPlacement = null;
let placementPoint = null;
let catalogMount = 'all';
let catalogRoomId = null;
let catalogAreaOnly = false;
let placementAreaId = null;
let lastRoomClick = null;
let placementOpener = null;
let furnitureOpener = null;
const history = [];
const future = [];

let unreadableDraft = null;
// Whether the shared plan still has to come in: not when this browser already
// holds its own copy of it, with the visitor's changes.
let sharedPending = Boolean(sharedPlan);
try {
    const raw = integration ? (integration.project ? JSON.stringify(integration.project) : null) : localStorage.getItem(storageKey);
    if (raw !== null) {
        showStart = false;
        sharedPending = false;
        unreadableDraft = raw;
        const saved = JSON.parse(raw);
        if (validProject(saved)) {
            readProject(saved);
            selected = plan.sensors[0]?.id;
            unreadableDraft = null;
        }
    }
} catch {
    // Keep the original local data when reading or parsing fails.
}

function readProject(project) {
    const localized = localizeSampleRooms(project, copy.names, copy.sample_name_languages);
    building = localized.format === buildingFormat ? localized : null;
    const floor = building?.floors.find(floor => floor.id === building.activeFloor);
    plan = withEditableFurniture(floor?.plan ?? localized);
}

function projectDocument(activePlan = plan) {
    return building ? { ...building, floors: building.floors.map(floor =>
        floor.id === building.activeFloor ? { ...floor, plan: activePlan } : floor) } : activePlan;
}

function projectFloors() {
    return projectDocument().floors ?? [{ id: 'ground', level: 0, name: null, plan }];
}

const currentStairTrip = () => building?.staircase ? stairTrip(projectDocument()) : null;

function save(replaceUnreadable = false) {
    const recovery = element('fp-recovery');
    if (integration) {
        if (!liveMode) integration.update(projectDocument());
        return;
    }
    if (unreadableDraft !== null && !replaceUnreadable) {
        recovery.hidden = false;
        element('fp-save').textContent = copy.recovery_note;
        return;
    }
    try {
        localStorage.setItem(storageKey, JSON.stringify(projectDocument()));
        unreadableDraft = null;
        recovery.hidden = true;
        element('fp-save').textContent = '';
    } catch {
        element('fp-save').textContent = copy.local_error;
    }
}

function remember(previous = JSON.stringify(plan)) {
    reviewedCoverage = false;
    recentUndo = null;
    history.push(building ? JSON.stringify(projectDocument(JSON.parse(previous))) : previous);
    if (history.length > 35) history.shift();
    future.length = 0;
}

function finish() {
    // Walls and doors may have changed.
    walkSight = null;
    save();
    render();
}

function selectedItem() {
    for (const type of ['sensors', 'furniture', 'doors', 'windows', 'mirrors', 'zones', 'walls', 'rooms']) {
        const item = plan[type]?.find(item => item.id === selected);
        if (item) return { type, item };
    }
    return {};
}

function currentRoom() {
    const { type, item } = selectedItem();
    if (type === 'rooms') return item;
    if (type === 'sensors') return roomForDevice(plan.rooms, item);
    if (item?.roomId) return plan.rooms.find(room => room.id === item.roomId);
    return type === 'furniture' ? plan.rooms.find(room => contains(room, item)) : null;
}

function placementRoom() {
    return currentRoom() ?? (plan.rooms.length === 1 || ['furnish', 'move_furniture'].includes(tool) ? plan.rooms[0] : null);
}

function placementOrigin() {
    const room = placementRoom();
    if (!room) return limitPoint(camera);
    return roomInteriorPoint(room, { x: room.x + room.width / 2, y: room.y + room.depth * (devices[choice]?.mount === 'wall' ? 1 : .5) });
}

function setTool(next, model = null, device = null) {
    if (interaction?.vertex !== undefined) interaction = null;
    lastRoomClick = null;
    tool = next;
    placedWithTool = 0;
    placementDevice = device;
    if (next !== 'place') placementAreaId = null;
    if (next !== 'edit') closeSensorTip();
    choice = model;
    if (model && Object.hasOwn(devices, model)) placementInstallation = catalogMount === 'wall'
        && installationsFor(model).includes('wall-bracket') ? 'wall-bracket' : installationsFor(model)[0];
    placementPoint = null;
    if (placingOpening()) {
        const defaults = openingDefaults[tool];
        const item = plan[tool + 's']?.find(item => item.id === choice);
        openingWidth.min = defaults.min;
        openingWidth.max = defaults.max;
        openingWidth.value = item?.width ?? defaults.width;
        openingHeight.value = item?.height ?? defaults.height ?? '';
        root.removeAttribute('data-panel');
    }
    if (next === 'zone') element('fp-zone-type').disabled = Boolean(model);
    start = null;
    roomDraft = [];
    draftCorner = 0;
    ghost.replaceChildren();
    ghost.removeAttribute('data-invalid');
    ghost.removeAttribute('data-preview');
    canvas.removeAttribute('data-room-corner-drag');
    roomHandleFeedback.textContent = '';
    updateTools();
}

// A tool that stays active says so while nothing is in progress.
function hint() {
    const message = toolHint();
    return toolRepeats(tool, choice) && !start && !roomDraft.length ? `${message} ${copy.tool_repeat}` : message;
}

function toolHint() {
    if (tool === 'place') return `${copy.sensor_hint} · ${placementDevice?.name ?? devices[choice].name}`;
    if (tool === 'furnish' || tool === 'move_furniture') {
        const name = tool === 'furnish' ? copy.furniture_items[choice] : selectedItem().item?.name;
        return `${copy.furniture_place_hint} · ${name ?? ''}`;
    }
    if (tool === 'scale_underlay') return start ? copy.underlay_end : copy.underlay_start;
    if (tool === 'outline_room') return copy[roomDraft.length ? 'room_outline_more' : 'room_outline_start'];
    if (tool === 'zone') return copy[element('fp-zone-type').value === 'entry' ? 'zone_entry_hint' : roomDraft.length ? 'zone_more' : 'zone_start'];
    if (tool === 'edit_outline') return copy[selectedItem().type === 'zones' ? 'zone_edit_hint' : 'room_edit_hint'] + (roomDraft.length
        ? ' ' + copy.room_corner_status.replace(':index', number.format(draftCorner + 1)).replace(':total', number.format(roomDraft.length)) : '');
    if (tool === 'room' || tool === 'wall') return copy[`${tool}_${start ? 'end' : 'start'}`];
    if (tool === 'edit') return plan.rooms.length
        ? (matchMedia('(any-pointer: fine)').matches ? copy.quick_place_hint : copy.select_hint)
        : copy[roomFormOpen ? 'room_form_map_hint' : 'empty_hint'];
    return copy[`${tool}_hint`];
}

function updateTools() {
    renderFlow();
    const status = element('fp-hint');
    const message = hint();
    if (status.textContent !== message) status.textContent = message;
    status.hidden = tool === 'edit';
    element('fp-draw-keys').hidden = tool !== 'room' && tool !== 'wall';
    // Doors, windows, mirrors and zones have a bar with a button to stop.
    // The wall tool has none, so it gets its own.
    element('fp-tool-stop').hidden = tool !== 'wall';
    showDoorActions();
    canvas.dataset.tool = tool;
    renderRoomHandles();
    root.querySelectorAll('[data-sensor-marker]').forEach(marker => {
        marker.setAttribute('tabindex', tool === 'edit' ? '0' : '-1');
    });
    const furnishing = tool === 'furnish' || tool === 'move_furniture';
    const placing = tool === 'place';
    const moving = tool === 'move_item';
    const opening = placingOpening();
    const repeating = toolRepeats(tool, choice);
    // Once something has been placed, leaving the tool no longer cancels anything.
    const leave = copy[repeating && placedWithTool ? 'tool_done' : 'cancel_place'];
    const placementBar = element('fp-placement-bar');
    placementBar.hidden = view !== '2d' || (!placing && !furnishing && !moving && !opening);
    const wallPreview = opening && placementPoint ? renderOpeningPreview(placementPoint) : null;
    element('fp-place-title').textContent = placing ? copy.place_model.replace(':model', placementDevice?.name ?? devices[choice].name)
        : opening ? copy[tool] : moving ? copy.move_item : message;
    element('fp-place-help').textContent = opening
        ? openingHelp(wallPreview) + (repeating && !placementPoint ? ` ${copy.tool_repeat}` : '') : moving ? message : placing
        ? copy[placementPoint ? 'place_confirm_hint' : !integration && !devices[choice].defaultRadar ? 'place_marker_only'
            : matchMedia('(pointer: coarse)').matches ? 'place_touch' : 'place_hover']
            + (!placementPoint && devices[choice].mount === 'wall' && placementInstallation !== 'freestanding' ? ' ' + copy.place_wall_snap : '')
        : '';
    element('fp-place-cancel').textContent = leave;
    const confirmPlacement = element('fp-place-confirm');
    confirmPlacement.hidden = (!placing && !opening) || !placementPoint;
    confirmPlacement.disabled = opening && Boolean(placementPoint) && !wallPreview?.position;
    element('fp-place-installation-field').hidden = !placing;
    element('fp-opening-dimensions').hidden = !opening;
    element('fp-opening-height-field').hidden = tool === 'door';
    if (placing) {
        const options = installationsFor(choice).map(value => `<option value="${value}">${copy.installations[value]}</option>`).join('');
        const input = element('fp-place-installation');
        if (input.innerHTML !== options) input.innerHTML = options;
        input.value = placementInstallation;
    }
    updateSelectionJump();
    root.toggleAttribute('data-placing-object', !placementBar.hidden);
    space.toggleAttribute('data-furnishing', furnishing);
    element('fp-space-placement').hidden = !furnishing || view !== '3d';
    if (furnishing) element('fp-space-placement-text').textContent = message;
    root.querySelectorAll('button[data-tool], button[data-model]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.tool === tool || button.dataset.model === choice
            || (button.dataset.tool === 'room' && tool === 'outline_room')));
    });
    const drawingOutline = tool === 'outline_room' || tool === 'zone', editingOutline = tool === 'edit_outline';
    const zoneTool = tool === 'zone';
    const zoneEdit = editingOutline && selectedItem().type === 'zones';
    element('fp-outline-tools').hidden = tool !== 'room' && !drawingOutline && !editingOutline;
    element('fp-zone-options').hidden = !zoneTool;
    element('fp-room-corner-position').hidden = !editingOutline;
    element('fp-room-modes').hidden = tool !== 'room' && tool !== 'outline_room';
    element('fp-room-outline-actions').hidden = !drawingOutline && !editingOutline;
    root.querySelectorAll('[data-room-mode]').forEach(button =>
        button.setAttribute('aria-pressed', String(button.dataset.roomMode === tool)));
    const saveOutline = root.querySelector('[data-action="save_outline"]');
    const entry = (zoneTool && element('fp-zone-type').value === 'entry') || (zoneEdit && selectedItem().item.type === 'entry');
    saveOutline.disabled = roomDraft.length < (entry ? 2 : 3);
    saveOutline.textContent = copy[zoneTool || zoneEdit ? 'zone_save' : editingOutline ? 'room_save_outline' : 'room_close_outline'];
    const undoCorner = root.querySelector('[data-action="undo_corner"]');
    undoCorner.hidden = editingOutline;
    undoCorner.disabled = !roomDraft.length;
    const removeCorner = root.querySelector('[data-action="remove_corner"]');
    removeCorner.hidden = !editingOutline;
    removeCorner.disabled = roomDraft.length <= 3;
    root.querySelector('[data-action="cancel_outline"]').textContent = roomDraft.length ? copy.cancel_place : leave;
    board.setAttribute('aria-describedby', editingOutline ? 'fp-keys fp-outline-keys' : placing || opening ? 'fp-place-help fp-keys' : 'fp-keys');
    element('fp-place-center').hidden = Boolean(placementPoint) || !(furnishing && plan.rooms.length)
        && (tool !== 'place' || !placementRoom() || devices[choice].mount !== 'ceiling');
    element('fp-space-place-center').hidden = !furnishing || !plan.rooms.length;
    drawingMenu.toggleAttribute('data-active', ['wall', 'door', 'window', 'mirror', 'zone'].includes(tool));
    libraryButton.toggleAttribute('data-placing', tool === 'place');
    const coverageToggle = root.querySelector('[data-action="coverage"]');
    const hasSensors = allFloors ? projectFloors().some(floor => visibleSensors(floor.plan).length) : Boolean(visibleSensors(plan).length);
    coverageToggle.setAttribute('aria-pressed', String(showCoverage));
    coverageToggle.hidden = !hasSensors;
    element('fp-legend').hidden = !hasSensors && !simulation;
    element('fp-undo-notice').hidden = !recentUndo || simulation || tool !== 'edit';
    element('fp-undo-message').textContent = recentUndo ?? '';
    root.querySelector('[data-action="undo"]').disabled = history.length === 0 && !(drawingOutline && roomDraft.length) && !editingOutline;
    root.querySelector('[data-action="redo"]').disabled = future.length === 0;
    root.querySelector('[data-action="measures"]').setAttribute('aria-pressed', String(showMeasures));
}

function renderFlow() {
    element('fp-start').hidden = !showStart;
    element('fp-editor').hidden = showStart;
    const roomCount = plan.rooms.length, sensorCount = plan.sensors.length;
    const choosingSensor = sensorStep.getAttribute('aria-expanded') === 'true';
    const busy = roomFormOpen || tool !== 'edit' || choosingSensor;
    const canTestBuilding = allFloors && projectFloors().some(floor => floor.plan.rooms.length);
    const next = integration && !appPlanner ? (allFloors || busy || liveMode ? null : !roomCount ? roomStep
        : !plan.sensors.some(sensor => sensor.haDevice) ? sensorStep : null)
        : simulation || canTestBuilding ? testStep : allFloors || busy ? null
        : !roomCount ? roomStep : !sensorCount ? sensorStep : reviewedCoverage && !appPlanner ? orderStep : testStep;
    for (const step of [roomStep, sensorStep, testStep, orderStep]) step.hidden = step !== next;
    extraSensor.hidden = allFloors || simulation || (next !== testStep && next !== orderStep);
    element('fp-next').hidden = simulation || (!next && (Boolean(integration) || !allFloors));
    const room = placementRoom();
    const sensorMessage = room ? copy.next_sensor_room.replace(':room', room.name) : copy.next_sensor;
    const message = integration && next === sensorStep ? integration.picker.prompt
        : simulation ? '' : allFloors ? copy[canTestBuilding ? 'next_all_test' : 'next_all_floors']
        : !roomCount ? copy.next_room : !sensorCount ? sensorMessage : reviewedCoverage && !appPlanner ? copy.next_reviewed : copy.next_test;
    if (element('fp-next-message').textContent !== message) element('fp-next-message').textContent = message;
    roomForm.hidden = !roomFormOpen || simulation;
    roomStep.setAttribute('aria-expanded', String(!roomForm.hidden));
    root.querySelector('[data-action="open_advisor"]').disabled = !roomCount || allFloors;
    root.querySelector('[data-action="preview_walk"]').hidden = !roomCount || Boolean(sensorCount) || allFloors;
    root.querySelector('[data-action="repeat_test"]').hidden = !roomCount || !sensorCount || !reviewedCoverage || allFloors;
    element('fp-add-room').hidden = !roomCount || allFloors;
    testStep.textContent = copy[simulation ? 'flow_test_exit' : 'flow_test'];
}

function focusNext() {
    const next = element('fp-next').querySelector('.fp-primary:not([hidden])') ?? toolbox.querySelector('summary');
    if (compactLibrary.matches) next.scrollIntoView({ block: 'nearest' });
    next.focus({ preventScroll: true });
}
const deviceIcon = mount => mount === 'ceiling'
    ? '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6"/><circle cx="10" cy="10" r="2"/></svg>'
    : '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="5" width="12" height="10" rx="2"/><path d="m8 11 2-2 2 2"/></svg>';

function haDevice(id) {
    return integration?.device(id);
}

const homeAssistantAreas = () => integration?.areas?.() ?? [];
const homeAssistantFloors = () => integration?.floors?.() ?? [];
const roomById = id => projectFloors().flatMap(floor => floor.plan.rooms).find(room => room.id === id) ?? null;
const linkedAreaIds = exceptRoom => new Set(projectFloors().flatMap(floor => floor.plan.rooms)
    .filter(room => room.id !== exceptRoom?.id && room.haAreaId).map(room => room.haAreaId));
const homeAssistantAreaName = id => homeAssistantAreas().find(area => area.id === id)?.name ?? id;

function visibleSensors(floorPlan) {
    return integration ? floorPlan.sensors.filter(sensor => haDevice(sensor.haDevice)) : floorPlan.sensors;
}

const visiblePlan = floorPlan => integration ? { ...floorPlan, sensors: visibleSensors(floorPlan) } : floorPlan;

// The plan as it is drawn: a door a test person stands at is shown open.
function planForDrawing(floorPlan) {
    return floorPlan === plan ? planWithOpenDoors(visiblePlan(floorPlan), heldDoors) : visiblePlan(floorPlan);
}

// `placed` is a person who is being put somewhere and is not among the
// walkers yet: { name, person }. They stand where they are put, not where the
// walker of that name stood before.
function walkSightNow(placed = null) {
    const people = walkersOnFloor().filter(([name]) => name !== placed?.name).map(([, walker]) => walker.person);
    if (placed) people.push(placed.person);
    const held = simulation ? doorsHeldOpen(plan, people) : new Set();
    const key = [...held].sort().join(' ');
    if (walkSight?.plan !== plan || walkSight.key !== key) {
        const changed = [...heldDoors].sort().join(' ') !== key;
        heldDoors = held;
        walkSight = Object.assign(prepareSight(plan, held), { plan, key });
        // The door swings open or shut on the drawing as well.
        if (changed && !heldDoorPaint) {
            heldDoorPaint = true;
            queueMicrotask(() => {
                heldDoorPaint = false;
                renderDrawing();
            });
        }
    }
    return walkSight;
}

// Opens or closes a door. During the coverage test the people are read again at once.
function toggleDoor(door) {
    remember();
    if (door.closed) delete door.closed;
    else door.closed = true;
    finish();
    if (!simulation) return;
    for (const [, walker] of walkersOnFloor()) {
        walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
    }
    readingKey = null;
    renderPerson();
}

function haPlacements(except = null) {
    return new Map(projectFloors().flatMap(floor => floor.plan.sensors.filter(item => item.haDevice && item.id !== except)
        .map(item => [haDevice(item.haDevice)?.id ?? item.haDevice,
            roomForDevice(floor.plan.rooms, item)?.name || floorLabel(floor, copy)])));
}

function sensorName(item) {
    return haDevice(item.haDevice)?.name ?? devices[item.model].name;
}

function renderHaCatalog() {
    const picked = integration.picker;
    const placements = haPlacements();
    const query = element('fp-search').value.trim().toLocaleLowerCase(root.dataset.locale);
    const registered = integration.devices();
    const room = roomById(catalogRoomId);
    const available = devicesForRoomArea(registered, room, catalogAreaOnly);
    const matching = available.filter(device => [device.name, device.product, device.radarModel].some(term =>
        term?.toLocaleLowerCase(root.dataset.locale).includes(query)));
    const status = element('fp-search-empty');
    status.textContent = !registered.length ? (integration.deviceError() ? picked.error : picked.empty)
        : catalogAreaOnly && room?.haAreaId && !available.length ? picked.noAreaDevices
            : !matching.length ? picked.noResults : matching.every(device => placements.has(device.id)) && !query ? picked.allPlaced : '';
    status.hidden = !status.textContent;
    element('fp-search').hidden = !registered.length;
    element('fp-library-context').hidden = !registered.length;
    const area = room?.haAreaId ? homeAssistantAreaName(room.haAreaId) : '';
    const areaFilter = room?.haAreaId ? `<div class="fp-ha-area-filter">
        <span>${escapeText(picked.showingArea.replace('{area}', area))}</span>
        <button type="button" data-action="toggle_area_filter">${escapeText(catalogAreaOnly ? picked.showAll : picked.showAreaOnly)}</button>
    </div>` : '';
    element('fp-catalog').innerHTML = areaFilter + [false, true].map(placed => {
        const group = matching.filter(device => placements.has(device.id) === placed);
        if (!group.length) return '';
        return `<div class="fp-device-group"><p>${placed ? picked.placed : picked.free}</p>${group.map(device => {
            const details = [device.product !== device.name ? device.product : '',
                !catalogAreaOnly && device.areaId ? homeAssistantAreaName(device.areaId) : '',
                placed ? placements.get(device.id) : device.online === false ? picked.offline : ''].filter(Boolean).join(' · ');
            return `<button type="button" data-ha-device="${escapeText(device.id)}" ${placed ? 'disabled' : ''}>
                <span class="fp-device-icon ${device.mount}">${deviceIcon(device.mount)}</span>
                <span>${escapeText(device.name)}${details ? `<small>${escapeText(details)}</small>` : ''}</span>
                <span class="fp-add" aria-hidden="true">${placed ? '✓' : '+'}</span></button>`;
        }).join('')}</div>`;
    }).join('');
}

function renderCatalog() {
    if (integration) { renderHaCatalog(); return; }
    element('fp-catalog').innerHTML = ['ceiling', 'wall'].map(mount => `
        <div class="fp-device-group">
            <p><span class="fp-dot ${mount}"></span>${copy[mount + '_mount']}</p>
            ${Object.entries(devices).filter(([, device]) => device.mount === mount).map(([model, device]) => `
                <button type="button" data-model="${model}" aria-pressed="false">
                    <span class="fp-device-icon ${mount}">${device.image
                        ? `<img src="${integration?.asset(device.image) ?? device.image}" alt="" width="34" height="27" loading="lazy">`
                    : deviceIcon(mount)}</span><span>${device.name}${device.coming ? ` <small>${model === 'wallsense' ? copy.planning_only : copy.planning}</small>` : ''}</span><span class="fp-add" aria-hidden="true">+</span>
                </button>`).join('')}
        </div>`).join('');
}

const furnitureDialog = element('fp-furniture-library');

function renderFurnitureCatalog() {
    const query = element('fp-furniture-search').value.trim().toLocaleLowerCase(root.dataset.locale);
    const category = element('fp-furniture-category').value;
    element('fp-furniture-catalog').innerHTML = Object.entries(furnitureCatalog).filter(([kind, model]) =>
        (!category || model.category === category) && copy.furniture_items[kind].toLocaleLowerCase(root.dataset.locale).includes(query)
    ).map(([kind, model]) => {
        const shape = furniturePartsForPreview(kind);
        return `<button type="button" data-furniture="${kind}">
            <svg viewBox="-1.6 -1.2 3.2 2.4" aria-hidden="true">${shape}</svg>
            <span><strong>${copy.furniture_items[kind]}</strong><small>${[model.width, model.depth, model.height].map(value => number.format(value)).join(' × ')} m</small></span>
        </button>`;
    }).join('') || `<p class="fp-note" role="status">${copy.furniture_no_match}</p>`;
}

function furniturePartsForPreview(kind) {
    const item = furnitureAt(kind, '', { x: 0, y: 0 });
    return paintFurniture(item, false, false);
}

function openFurnitureLibrary(button) {
    furnitureOpener = button;
    element('fp-furniture-search').value = '';
    element('fp-furniture-category').value = '';
    renderFurnitureCatalog();
    furnitureDialog.showModal();
    const initial = matchMedia('(max-width: 760px)').matches
        ? furnitureDialog.querySelector('[data-action="close_furniture"]') : element('fp-furniture-search');
    initial.focus();
}

function startFurniturePlacement(next, kind = null) {
    if (!plan.rooms.length) {
        setView('2d');
        setTool('room');
        element('fp-hint').textContent = copy.furniture_need_room;
        board.focus({ preventScroll: true });
        return;
    }
    setTool(next, kind);
    if (view === '2d') board.focus({ preventScroll: true });
    else element('fp-space-place-center').focus({ preventScroll: true });
    if (matchMedia('(max-width: 760px)').matches) {
        (view === '2d' ? canvas : space).scrollIntoView({ block: 'center' });
    }
}

function radarLabel(item, radar = item.radar) {
    if (radar === 'none') return copy.no_radar;
    if (radar === 'ld2460' && devices[item.model].mount === 'wall') return copy.wall_upgrade;
    return radarNames[radar];
}

function scd41Label(item) {
    const standard = ['ceilsense-pro', 'ultimatesensor-v2', 'ultimatesensor-mini-v2', 'wallsense'].includes(item.model);
    return standard ? copy.sensor_scd41_standard
        : item.model === 'ceilsense-v2' ? copy[item.climate ? 'sensor_scd41_added' : 'sensor_scd41_optional']
            : item.model === 'ceilsense-mini' ? copy.sensor_scd41_absent : copy.sensor_unknown;
}

function sensorOptions(item) {
    if (integration) {
        const device = haDevice(item.haDevice);
        const status = device?.online === false ? ` · ${integration.picker.offline}` : '';
        const binding = device ? device.name + status : item.haDevice ? integration.picker.missing : integration.picker.unlinked;
        return `<dl class="fp-sensor-options"><div><dt>Home Assistant</dt><dd>${escapeText(binding)}</dd></div>
            <div><dt>mmWave</dt><dd>${escapeText(device?.radarModel?.toUpperCase() ?? integration.picker.unknown)}</dd></div>
            <div><dt>${escapeText(copy.sensor_mount_label)}</dt><dd>${escapeText(copy.installations[installationFor(item)])}</dd></div></dl>`;
    }
    const rows = [
        ['mmWave', devices[item.model].defaultRadar ? radarLabel(item) : copy.sensor_unknown],
        ['SCD41 (CO₂)', scd41Label(item)],
        [copy.sensor_mount_label, copy.installations[installationFor(item)]],
    ];
    if (item.model === 'ceilsense-pro') rows.push([copy.sensor_smoke_label, copy.sensor_smoke_optical]);
    if (['ceilsense-pro', 'ultimatesensor-v2'].includes(item.model)) rows.push([copy.sensor_audio_label, copy.sensor_audio_voice]);
    if (hasMotionSensor(item.model) && copy.sensor_pir_range) rows.push(['PIR', copy.sensor_pir_range]);
    return `<dl class="fp-sensor-options">${rows.map(([label, value]) =>
        `<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join('')}</dl>`;
}

function sensorEditValues(model, previous) {
    const radars = radarsFor(model);
    const mounts = installationsFor(model);
    return {
        model,
        radar: radars.includes(previous.radar) ? previous.radar : devices[model].defaultRadar ?? radars[0],
        installation: mounts.includes(previous.installation) ? previous.installation : mounts[0],
        climate: previous.climate ?? false,
        mountHeight: previous.mountHeight ?? 1.4,
        level: previous.level ?? false,
        // The direction of a sensor that stands free, and how far one on a bracket is turned from the wall.
        angle: previous.angle ?? 0,
        pan: previous.pan ?? 0,
        tilt: previous.tilt ?? 0,
    };
}

function readSensorEdit(model = sensorEditForm.elements.model.value) {
    const { radar, installation, climate, mountHeight, level, aim, tilt } = sensorEditForm.elements;
    const values = { model, radar: integration ? editingSensor.radar : radar.value, installation: installation.value, climate: climate.checked,
        mountHeight: mountHeight.valueAsNumber, level: level.checked, ...editingSensor.aim };
    // The one field for the direction is the turn on the bracket, or the direction of a sensor that stands free.
    if (aim && !aim.disabled && Number.isFinite(aim.valueAsNumber)) values[editingSensor.aimed] = aim.valueAsNumber;
    if (tilt && !tilt.disabled && Number.isFinite(tilt.valueAsNumber)) values.tilt = tilt.valueAsNumber;
    return values;
}

function updateSensorEditNote(item, values, error = '') {
    const note = element('fp-sensor-edit-placement');
    const snaps = isWallMounted(values) && installationFor(item) !== values.installation;
    note.textContent = error || (snaps ? copy.sensor_edit_snaps : '');
    note.hidden = !note.textContent;
    note.classList.toggle('fp-warning', Boolean(error));
}

function renderSensorEdit(item, values) {
    const fields = sensorEditForm.elements;
    const device = devices[values.model];
    fields.model.value = values.model;
    fields.radar.innerHTML = options(radarsFor(values.model), values.radar, radar =>
        device.defaultRadar ? radarLabel(values, radar) : copy.sensor_unknown);
    fields.installation.innerHTML = options(installationsFor(values.model), values.installation, mount => copy.installations[mount]);
    fields.mountHeight.value = values.mountHeight;
    fields.climate.checked = values.climate;
    fields.level.checked = values.level;
    const wall = device.mount === 'wall';
    const room = roomForDevice(plan.rooms, item);
    element('fp-sensor-edit-height').hidden = fields.mountHeight.disabled = !wall;
    if (sensorAim) {
        const aims = canAimSensor(values);
        const onBracket = isWallMounted(values);
        editingSensor.aim = { angle: values.angle, pan: values.pan, tilt: values.tilt };
        editingSensor.aimed = onBracket ? 'pan' : 'angle';
        sensorAim.box.hidden = !aims;
        sensorEdit.classList.toggle('fp-sensor-edit-aims', aims);
        const limits = onBracket ? { min: -sensorPan, max: sensorPan } : { min: 0, max: 359 };
        for (const control of [sensorAim.turn.input, sensorAim.turn.slider]) Object.assign(control, limits, { value: Math.round(onBracket ? values.pan : values.angle) });
        for (const control of [sensorAim.tilt.input, sensorAim.tilt.slider]) control.value = values.tilt;
        for (const { input, slider } of [sensorAim.turn, sensorAim.tilt]) input.disabled = slider.disabled = !aims;
    }
    element('fp-sensor-edit-scd41').hidden = fields.climate.disabled = Boolean(integration) || values.model !== 'ceilsense-v2';
    element('fp-sensor-edit-level').hidden = fields.level.disabled = wall || !room?.ceiling;
    const image = element('fp-sensor-edit-image');
    image.hidden = !device.image;
    if (device.image) image.src = integration?.asset(device.image) ?? device.image;
    else image.removeAttribute('src');
    const features = element('fp-sensor-edit-features');
    features.textContent = integration ? (haDevice(fields.haDevice.value)?.radarModel?.toUpperCase() ?? integration.picker.unknown) : [
        device.coming && copy.planning_only,
        values.model !== 'ceilsense-v2' && `SCD41 (CO₂) · ${scd41Label(values)}`,
        values.model === 'ceilsense-pro' && copy.sensor_smoke_label,
    ].filter(Boolean).join(' · ');
    features.hidden = !features.textContent;
    updateSensorEditNote(item, values);
    paintSensorAim();
}

// The drawings and words of the aim tool, for what the dialog holds now.
function paintSensorAim() {
    const item = plan.sensors.find(item => item.id === editingSensor?.id);
    if (!sensorAim) return;
    sensorAim.preview = null;
    if (sensorAim.box.hidden || !item) return;
    const values = readSensorEdit();
    // A height that is still being typed is not a height yet.
    if (!(values.mountHeight >= .15 && values.mountHeight <= 6)) values.mountHeight = item.mountHeight ?? 1.4;
    const room = roomForDevice(plan.rooms, item);
    const preview = replacementSensor(item, values, room) ?? { ...item, model: values.model, radar: values.radar, mountHeight: values.mountHeight, tilt: values.tilt };
    const home = roomForDevice(plan.rooms, preview) ?? room;
    const radars = home ? radarFields(home, preview) : [];
    const motion = home && copy.pir_note ? motionField(preview) : null;
    const fields = motion ? [...radars, motion] : radars;
    const onBracket = isWallMounted(preview);
    const side = aimSideView({ room: home, item: preview, fields, onWall: onBracket });
    for (const [{ drawing }, view] of [[sensorAim.turn, aimTopView({ room: home, item: preview, fields })], [sensorAim.tilt, side]]) {
        drawing.setAttribute('viewBox', view.viewBox);
        drawing.innerHTML = view.markup;
    }
    sensorAim.turn.words.textContent = turnText(copy, onBracket ? preview.pan ?? 0 : preview.angle, onBracket);
    sensorAim.tilt.words.textContent = tiltText(copy, preview.tilt ?? 0);
    const metres = value => number.format(Number(value.toFixed(1)));
    sensorAim.note.textContent = radars.length ? reachText(copy, side.reach, metres) : '';
    sensorAim.note.hidden = !sensorAim.note.textContent;
    sensorAim.lens.textContent = motion ? [copy.aim_motion?.replace(':to', metres(motionReach(home, preview, motion))), copy.pir_note].filter(Boolean).join(' ') : '';
    sensorAim.lens.hidden = !sensorAim.lens.textContent;
    sensorAim.preview = { item: preview, room: home, onBracket };
}

if (sensorAim) {
    const set = (part, value) => {
        part.input.value = part.slider.value = value;
        paintSensorAim();
    };
    for (const part of [sensorAim.turn, sensorAim.tilt]) {
        part.slider.addEventListener('input', () => set(part, part.slider.value));
        part.input.addEventListener('input', () => {
            if (part.input.validity.valid && part.input.value !== '') part.slider.value = part.input.value;
            paintSensorAim();
        });
    }
    sensorEditForm.elements.mountHeight.addEventListener('input', paintSensorAim);
    // A press in a drawing aims the sensor there, and keeps aiming while the pointer is held.
    const follow = (drawing, begin, move) => drawing.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !sensorAim.preview) return;
        event.preventDefault();
        const at = pointer => {
            const point = new DOMPoint(pointer.clientX, pointer.clientY).matrixTransform(drawing.getScreenCTM().inverse());
            return { x: point.x, y: point.y };
        };
        const held = begin(at(event));
        const moved = pointer => move(at(pointer), held);
        const stop = () => {
            drawing.removeEventListener('pointermove', moved);
            drawing.removeEventListener('pointerup', stop);
            drawing.removeEventListener('pointercancel', stop);
        };
        drawing.setPointerCapture(event.pointerId);
        drawing.addEventListener('pointermove', moved);
        drawing.addEventListener('pointerup', stop);
        drawing.addEventListener('pointercancel', stop);
        moved(event);
    });
    follow(sensorAim.turn.drawing, () => null, point => {
        const { item, onBracket } = sensorAim.preview;
        // Right on the sensor there is no direction to read.
        if (Math.hypot(point.x - item.x, point.y - item.y) < .12) return;
        set(sensorAim.turn, onBracket ? turnTo(item, point, sensorPan) : directionTo(item, point));
    });
    const mounted = () => sensorAim.preview.item.mountHeight ?? 1.4;
    follow(sensorAim.tilt.drawing, point => onDevice(mounted(), { ahead: point.x, height: -point.y }) ? 'height' : 'tilt', (point, held) => {
        const spot = { ahead: point.x, height: -point.y };
        if (held === 'height') {
            sensorEditForm.elements.mountHeight.value = heightTo(spot.height, sensorAim.preview.room?.height);
            paintSensorAim();
        } else set(sensorAim.tilt, tiltTo(mounted(), spot));
    });
}

function openSensorEdit(id) {
    const index = plan.sensors.findIndex(item => item.id === id);
    if (index < 0 || sensorEdit.open || tool !== 'edit' || allFloors || liveMode) return;
    closeSensorTip();
    stopAutoWalk();
    walkControls.stop();
    if (simulation || view === '3d') chooseBeamForMarker(activeSensorMarker(id));
    const item = plan.sensors[index];
    const room = roomForDevice(plan.rooms, item);
    editingSensor = { id, model: item.model, radar: item.radar, drafts: new Map() };
    const models = integration ? [item.model] : Object.keys(devices).filter(model => devices[model].defaultRadar || model === item.model);
    sensorEditForm.elements.model.innerHTML = options(models, item.model, model => devices[model].name);
    element('fp-sensor-edit-context').textContent = [String(index + 1).padStart(2, '0'), room?.name].filter(Boolean).join(' · ');
    const values = sensorEditValues(item.model, { ...item, installation: installationFor(item),
        level: Boolean(room?.ceiling && item.levelMountRoom === room.id) });
    if (integration) {
        const select = sensorEditForm.elements.haDevice;
        const current = haDevice(item.haDevice);
        const placed = haPlacements(item.id);
        const choices = devicesForRoomArea(integration.devices(), room, Boolean(room?.haAreaId))
            .filter(device => device.mount === devices[item.model].mount
            && device.id !== current?.id && !placed.has(device.id));
        select.replaceChildren(new Option(item.haDevice ? (current?.name ?? integration.picker.missing) : integration.picker.choose, item.haDevice ?? ''),
            ...choices.map(device => new Option(device.name, device.id)));
        select.required = true;
        select.value = item.haDevice ?? '';
    }
    renderSensorEdit(item, values);
    sensorEdit.showModal();
    if (integration) sensorEditForm.elements.haDevice.focus();
}

sensorEditForm.addEventListener('change', event => {
    const item = plan.sensors.find(item => item.id === editingSensor?.id);
    if (!item) return;
    if (event.target.name === 'haDevice' && integration) {
        const device = haDevice(event.target.value);
        const previous = readSensorEdit();
        const unchanged = event.target.value === item.haDevice;
        editingSensor.radar = unchanged ? item.radar : device?.radar ?? 'none';
        const model = unchanged ? item.model : device?.model ?? item.model;
        sensorEditForm.elements.model.replaceChildren(new Option(devices[model].name, model));
        renderSensorEdit(item, sensorEditValues(model, { ...previous, radar: editingSensor.radar }));
    } else if (event.target.name === 'model') {
        const previous = readSensorEdit(editingSensor.model);
        editingSensor.drafts.set(previous.model, previous);
        const model = event.target.value;
        editingSensor.model = model;
        renderSensorEdit(item, editingSensor.drafts.get(model) ?? sensorEditValues(model, previous));
    } else if (event.target.name === 'installation' && sensorAim) {
        // Taken off its bracket the sensor keeps looking where it looked.
        const values = readSensorEdit();
        if (sensorAim.preview) values.angle = sensorAim.preview.item.angle;
        renderSensorEdit(item, values);
    } else updateSensorEditNote(item, readSensorEdit());
});

function replacementSensor(item, values, room) {
    let next = { ...item, model: values.model, radar: values.radar };
    if (item.installation !== undefined || item.model !== values.model || installationFor(item) !== values.installation) {
        next.installation = values.installation;
    }
    if (values.model === 'ceilsense-v2' && (values.climate || item.climate !== undefined)) next.climate = values.climate;
    else delete next.climate;
    if (devices[next.model].mount === 'wall' && (item.mountHeight !== undefined || values.mountHeight !== 1.4)) {
        next.mountHeight = values.mountHeight;
    } else delete next.mountHeight;
    if (devices[next.model].mount === 'ceiling' && values.level && room?.ceiling) next.levelMountRoom = room.id;
    else if (item.levelMountRoom !== null) delete next.levelMountRoom;
    // Where it looks: tilted, and turned on its bracket or pointed freely.
    const turnedBefore = item.pan ?? 0;
    delete next.tilt;
    delete next.pan;
    if (sensorAim && canAimSensor(next)) {
        if (values.tilt) next.tilt = values.tilt;
        if (isWallMounted(next)) {
            if (values.pan) next.pan = values.pan;
        } else if (Number.isFinite(values.angle)) next.angle = ((values.angle % 360) + 360) % 360;
    } else if (!sensorAim) {
        if (item.tilt !== undefined) next.tilt = item.tilt;
        if (item.pan !== undefined) next.pan = item.pan;
    }
    if (isWallMounted(next) && (installationFor(next) !== installationFor(item) || (next.pan ?? 0) !== turnedBefore)) {
        if (!room) return null;
        next = alignSensorToWall(next, room);
    }
    if (room && !isWallMounted(next) && roomForDevice(plan.rooms, next)?.id !== room.id) {
        const point = roomInteriorPoint(room);
        const distance = Math.hypot(point.x - next.x, point.y - next.y);
        const inward = Math.min(1, .16 / (distance || 1));
        next.x += (point.x - next.x) * inward;
        next.y += (point.y - next.y) * inward;
    }
    return next;
}

sensorEditForm.addEventListener('submit', event => {
    event.preventDefault();
    const id = editingSensor?.id;
    const item = plan.sensors.find(item => item.id === id);
    if (!item) return;
    const values = readSensorEdit();
    const room = roomForDevice(plan.rooms, item);
    const next = replacementSensor(item, values, room);
    if (!next) {
        updateSensorEditNote(item, values, copy.sensor_edit_room_required);
        return;
    }
    if (integration) {
        const deviceId = sensorEditForm.elements.haDevice.value;
        const device = haDevice(deviceId);
        if (!deviceId || (deviceId !== item.haDevice && (!device || haPlacements(item.id).has(device.id)))) {
            updateSensorEditNote(item, values, integration.picker.invalid);
            return;
        }
        next.haDevice = deviceId;
    }
    const candidate = { ...plan, sensors: plan.sensors.map(sensor => sensor.id === id ? next : sensor) };
    if (!validPlan(candidate) || (room && roomForDevice(candidate.rooms, next)?.id !== room.id)) {
        updateSensorEditNote(item, values, copy.sensor_edit_invalid);
        return;
    }
    if (JSON.stringify(next) !== JSON.stringify(item)) {
        remember();
        plan = candidate;
        selected = id;
        beamChoice = '';
        if (simulation) {
            walkSensors = preparePersonSensors(planForDrawing(plan));
            for (const [, walker] of walkersOnFloor()) {
                walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
            }
            readingKey = null;
        }
        finish();
        if (simulation || view === '3d') chooseBeamForMarker(activeSensorMarker(id));
        element('fp-event').textContent = copy.sensor_edit_saved;
    }
    sensorEdit.close();
});

sensorEdit.addEventListener('close', () => {
    const id = editingSensor?.id;
    editingSensor = null;
    if (id) activeSensorMarker(id)?.focus({ preventScroll: true });
});

function activeSensorMarker(id) {
    return (view === '3d' ? space : drawing).querySelector(`[data-sensor-marker][data-item="${CSS.escape(id)}"]`);
}

function closeSensorTip() {
    clearTimeout(sensorTipTimer);
    if (!inspectedMarker) return false;
    activeSensorMarker(inspectedMarker.id)?.removeAttribute('aria-describedby');
    inspectedMarker = null;
    sensorTip.hidden = true;
    return true;
}

function refreshSensorTip() {
    if (!inspectedMarker) return;
    const { id } = inspectedMarker;
    const sensors = visibleSensors(plan);
    const index = sensors.findIndex(item => item.id === id);
    const marker = activeSensorMarker(id);
    if (index < 0 || !marker || tool !== 'edit' || allFloors) {
        closeSensorTip();
        return;
    }
    const item = sensors[index];
    const room = roomForDevice(plan.rooms, item);
    const heading = `<strong>${String(index + 1).padStart(2, '0')} · ${escapeText(sensorName(item))}</strong>`;
    const html = heading + (room ? `<p>${escapeText(room.name)}</p>` : '') + sensorOptions(item);
    if (sensorTip.innerHTML !== html) sensorTip.innerHTML = html;
    const anchor = marker.querySelector(view === '3d' ? 'circle' : '.fp-sensor-halo').getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    if (anchor.right < bounds.left || anchor.left > bounds.right || anchor.bottom < bounds.top || anchor.top > bounds.bottom) {
        closeSensorTip();
        return;
    }
    sensorTip.hidden = false;
    marker.setAttribute('aria-describedby', sensorTip.id);
    const { offsetWidth: width, offsetHeight: height } = sensorTip;
    const margin = 8;
    let x = anchor.right - bounds.left + margin;
    let y = anchor.top - bounds.top - margin;
    if (x + width > bounds.width - margin) x = anchor.left - bounds.left - width - margin;
    if (x < margin) {
        x = (anchor.left + anchor.right) / 2 - bounds.left - width / 2;
        y = anchor.bottom - bounds.top + margin;
        if (y + height > bounds.height - margin) y = anchor.top - bounds.top - height - margin;
    }
    sensorTip.style.left = `${Math.max(margin, Math.min(x, bounds.width - width - margin))}px`;
    sensorTip.style.top = `${Math.max(margin, Math.min(y, bounds.height - height - margin))}px`;
}

function showSensorTip(id, source) {
    if (!id || tool !== 'edit' || allFloors || sensorEdit.open) return;
    if (inspectedMarker?.id !== id) closeSensorTip();
    clearTimeout(sensorTipTimer);
    if (inspectedMarker?.id !== id || source !== 'hover') inspectedMarker = { id, source };
    refreshSensorTip();
}

function replaceMapMarkup(layer, markup) {
    const focused = document.activeElement;
    const restore = focused?.hasAttribute('data-sensor-marker') && layer.contains(focused) ? focused.dataset.item : null;
    layer.innerHTML = markup;
    if (tool !== 'edit') layer.querySelectorAll('[data-sensor-marker]').forEach(marker => marker.setAttribute('tabindex', '-1'));
    if (restore) activeSensorMarker(restore)?.focus({ preventScroll: true });
    refreshSensorTip();
}

const sensorMarkerAt = target => target?.closest?.('[data-sensor-marker]');

stage.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch' || event.buttons) return;
    if (sensorTip.contains(event.target)) clearTimeout(sensorTipTimer);
    const marker = sensorMarkerAt(event.target);
    if (marker && marker !== sensorMarkerAt(event.relatedTarget)) showSensorTip(marker.dataset.item, 'hover');
});
stage.addEventListener('pointerout', event => {
    if (inspectedMarker?.source !== 'hover') return;
    const from = sensorMarkerAt(event.target);
    if (!from && !sensorTip.contains(event.target)) return;
    if (sensorMarkerAt(event.relatedTarget)?.dataset.item === inspectedMarker.id || sensorTip.contains(event.relatedTarget)) return;
    clearTimeout(sensorTipTimer);
    sensorTipTimer = setTimeout(closeSensorTip, 180);
});
stage.addEventListener('focusin', event => {
    const marker = sensorMarkerAt(event.target);
    if (marker) showSensorTip(marker.dataset.item, 'focus');
});
stage.addEventListener('focusout', event => {
    if (inspectedMarker?.source === 'focus' && !sensorMarkerAt(event.relatedTarget)) closeSensorTip();
});
document.addEventListener('pointerdown', event => {
    if (!sensorTip.contains(event.target)) closeSensorTip();
}, { capture: true });
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && closeSensorTip()) {
        event.preventDefault();
        event.stopPropagation();
    }
}, { capture: true });

function renderLists() {
    const displayed = visibleSensors(plan);
    const numbers = new Map(displayed.map((sensor, index) => [sensor.id, String(index + 1).padStart(2, '0')]));
    element('fp-count').textContent = displayed.length;
    element('fp-placements').closest('.fp-sensors').hidden = !plan.sensors.length;
    element('fp-furniture-items').closest('.fp-furniture-panel').hidden = !plan.furniture.length;
    const orderCount = projectFloors().reduce((total, floor) => total + floor.plan.sensors.length, 0);
    element('fp-order-count').textContent = orderCount;
    element('fp-open-order').toggleAttribute('data-empty', !orderCount);
    element('fp-object-count').textContent = plan.rooms.length;
    const placementList = element('fp-placements');
    const savedExpanded = placementList.querySelector('details')?.open;
    const placementRow = item => {
        const room = roomForDevice(plan.rooms, item);
        const device = haDevice(item.haDevice);
        const detail = !integration ? radarLabel(item) : device ? device.radarModel?.toUpperCase() ?? integration.picker.unknown
            : item.haDevice ? integration.picker.missing : integration.picker.unlinked;
        return `
        <button type="button" class="fp-placed" data-select="${item.id}" aria-pressed="${selected === item.id}">
            <span class="fp-index ${devices[item.model].mount}">${numbers.get(item.id) ?? '-'}</span>
            <span><strong>${escapeText(sensorName(item))}</strong><small>${escapeText(detail)}${room ? ' · ' + escapeText(room.name) : ''}</small></span>
        </button>`;
    };
    const saved = plan.sensors.filter(item => !numbers.has(item.id));
    placementList.innerHTML = (displayed.map(placementRow).join('') || `<p class="fp-note">${copy.empty_placements}</p>`)
        + (saved.length ? `<details class="fp-saved-placements" ${savedExpanded ? 'open' : ''}>
            <summary>${escapeText(integration.picker.savedPositions)} (${saved.length})</summary>${saved.map(placementRow).join('')}</details>` : '');
    element('fp-objects').innerHTML = plan.rooms.map(room => `
        <button type="button" class="fp-room-row" data-select="${room.id}" aria-pressed="${selected === room.id}">
            <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="4" width="12" height="12" rx="1"/><path d="M9 4v5h7"/></svg>
            <span>${escapeText(room.name)}</span><small>${number.format(roomArea(room))} m²</small>
        </button>`).join('') || `<p class="fp-note">${copy.empty_rooms}</p>`;
    const structure = [
        ...plan.walls.map((item, index) => [item, `${copy.wall} ${index + 1}`]),
        ...plan.doors.map((item, index) => [item, `${copy.door} ${index + 1}`]),
        ...(plan.windows ?? []).map((item, index) => [item, `${copy.window} ${index + 1}`]),
        ...(plan.mirrors ?? []).map((item, index) => [item, `${copy.mirror} ${index + 1}`]),
        ...(plan.zones ?? []).map(item => [item, item.name]),
    ];
    element('fp-structure').hidden = !structure.length;
    element('fp-structure-count').textContent = structure.length;
    element('fp-structure-items').innerHTML = structure.map(([item, name]) =>
        `<button type="button" data-select="${item.id}" aria-pressed="${selected === item.id}">${escapeText(name)}</button>`).join('');
    renderFurnitureList();
}

function renderFurnitureList() {
    element('fp-furniture-count').textContent = plan.furniture.length;
    element('fp-furniture-items').innerHTML = plan.furniture.map(item => {
        const room = plan.rooms.find(room => contains(room, item));
        return `<button type="button" class="fp-furniture-row" data-select="${item.id}" aria-pressed="${selected === item.id}">
            <strong>${escapeText(item.name)}</strong><small>${room ? escapeText(room.name) + ' · ' : ''}${number.format(item.width)} × ${number.format(item.depth)} m</small>
        </button>`;
    }).join('') || `<p class="fp-note">${copy.furniture_empty}</p>`;
}

const field = (item, key, label, min, max, step) => `
    <label>${label}<input type="number" data-field="${key}" min="${min}" max="${max}" step="${step}" value="${Number(item[key].toFixed(2))}" required></label>`;

// Only Home Assistant knows which radars can see a mirror, so the reflection
// filter is offered there and nowhere else.
const mirrorReflectionCopy = {
    en: ['Suppress mirror reflections', 'Reflection depth (m)', 'Creates a conservative exclusion behind this mirror for each linked radar. Real room space is never excluded automatically.',
        'No radar with position tracking in this room looks at this mirror, so nothing is excluded yet.',
        'A radar holds two exclusion areas. With this mirror a radar here needs more, and sending to the radars is refused until a zone or a mirror filter is removed.'],
    nl: ['Spiegelreflecties onderdrukken', 'Reflectiediepte (m)', 'Maakt per gekoppelde radar een veilige uitsluiting achter deze spiegel. Echte ruimte wordt nooit automatisch uitgesloten.',
        'Geen radar met positiebepaling in deze kamer kijkt naar deze spiegel, dus er wordt nog niets uitgesloten.',
        'Een radar onthoudt twee uitsluitingsvlakken. Met deze spiegel heeft een radar hier er meer nodig, en verzenden naar de radars wordt geweigerd tot je een zone of een spiegelfilter weghaalt.'],
    de: ['Spiegelreflexionen unterdrücken', 'Reflexionstiefe (m)', 'Erstellt pro verknüpftem Radar einen sicheren Ausschluss hinter diesem Spiegel. Echter Raum wird nie automatisch ausgeschlossen.',
        'Kein Radar mit Positionserkennung in diesem Raum sieht diesen Spiegel, daher wird noch nichts ausgeschlossen.',
        'Ein Radar speichert zwei Ausschlussflächen. Mit diesem Spiegel braucht ein Radar hier mehr, und das Senden an die Radare wird abgelehnt, bis eine Zone oder ein Spiegelfilter entfernt wird.'],
    fr: ['Supprimer les reflets du miroir', 'Profondeur de réflexion (m)', "Crée une exclusion prudente derrière ce miroir pour chaque radar associé. L'espace réel n'est jamais exclu automatiquement.",
        "Aucun radar de suivi dans cette pièce ne regarde ce miroir, donc rien n'est encore exclu.",
        "Un radar retient deux zones d'exclusion. Avec ce miroir, un radar en demande plus ici. L'envoi aux radars est refusé tant qu'une zone ou un filtre de miroir n'est pas retiré."],
    es: ['Suprimir reflejos del espejo', 'Profundidad de reflexión (m)', 'Crea una exclusión prudente detrás del espejo para cada radar vinculado. El espacio real nunca se excluye automáticamente.',
        'Ningún radar de seguimiento de esta habitación mira a este espejo, así que todavía no se excluye nada.',
        'Un radar guarda dos áreas de exclusión. Con este espejo, un radar necesita más aquí, y el envío a los radares se rechaza hasta que quites una zona o un filtro de espejo.'],
};

// A reflection lies as far behind a mirror as the person stands in front of
// it, so the room in front of the mirror says how deep the filter has to look.
function reflectionDepth(mirror) {
    const room = plan.rooms.find(room => room.id === mirror.roomId);
    if (!room) return 2;
    const turn = mirror.angle * Math.PI / 180;
    const middle = { x: mirror.x + Math.cos(turn) * mirror.width / 2, y: mirror.y + Math.sin(turn) * mirror.width / 2 };
    const across = side => {
        const [x, y] = roomRayEnd(room, middle, { x: middle.x - Math.sin(turn) * side * 80, y: middle.y + Math.cos(turn) * side * 80 });
        return Math.hypot(x - middle.x, y - middle.y);
    };
    return Math.max(.25, Math.min(6, Math.round(Math.max(across(1), across(-1)) * 20) / 20));
}

// The areas the reflection filters hide, drawn behind their mirrors.
function paintMirrorWedges() {
    const protection = integration?.mirrorProtection?.(planForDrawing(plan));
    return protection ? protection.wedges.map(({ mirrorId, sensorId, points }) =>
        `<polygon class="fp-mirror-wedge${mirrorId === selected ? ' selected' : ''}" data-mirror="${mirrorId}" data-sensor="${sensorId}"
            points="${points.map(point => point.join(',')).join(' ')}"/>`).join('') : '';
}

function mirrorSettings(item) {
    if (!integration) return `<p class="fp-note">${copy.mirror_note}</p>`;
    const [label, depth, note, unseen, crowded] = mirrorReflectionCopy[document.documentElement.lang?.split('-')[0]] ?? mirrorReflectionCopy.en;
    // Home Assistant uses 2 m until someone picks a depth, so show that here too.
    const depthField = field({ reflectionDepthM: item.reflectionDepthM ?? 2 }, 'reflectionDepthM', depth, .25, 6, 'any');
    // Say so when the filter does nothing yet, or asks more of a radar than it can hold.
    const protection = item.protectionEnabled ? integration.mirrorProtection?.(plan) : null;
    const own = protection?.wedges.filter(wedge => wedge.mirrorId === item.id) ?? [];
    const warning = !protection ? '' : !own.length ? unseen : own.some(wedge => protection.crowded.includes(wedge.sensorId)) ? crowded : '';
    return `<label class="fp-climate-field"><input type="checkbox" data-field="protectionEnabled" ${item.protectionEnabled ? 'checked' : ''}> ${label}</label>
        ${item.protectionEnabled ? depthField : ''}
        <p class="fp-note">${item.protectionEnabled ? note : copy.mirror_note}</p>
        ${warning ? `<p class="fp-note fp-warning">${escapeText(warning)}</p>` : ''}`;
}

const heightField = (key, label, value) => `<label>${label}
    <input data-field="${key}" data-decimal type="text" inputmode="decimal" maxlength="8" value="${number.format(value)}" required></label>`;

const options = (values, active, label) => values.map(value =>
    `<option value="${value}" ${value === active ? 'selected' : ''}>${label(value)}</option>`).join('');

function ceilingTypeField(ceiling) {
    return `<label>${copy.ceiling_type}<select data-field="ceilingType">${options(ceilingTypes, ceiling?.type ?? 'flat',
        type => copy['ceiling_' + type])}</select></label>`;
}

function focusCeilingType() {
    const field = element('fp-inspector').querySelector('[data-field="ceilingType"]');
    const details = field.closest('details');
    if (details) details.open = true;
    field.focus({ preventScroll: true });
}

// Floor and wall finish only change how the room looks in 3D.
function roomFinishFields(room) {
    const choice = (key, values, label, prefix) => `<label>${label}<select data-field="${key}">
        <option value="" ${room[key] ? '' : 'selected'}>${copy.finish_automatic}</option>
        ${values.map(value => `<option value="${value}" ${room[key] === value ? 'selected' : ''}>${copy[prefix + value]}</option>`).join('')}</select></label>`;
    return `<div class="fp-fields">${choice('floorFinish', floorFinishes, copy.room_floor_finish, 'floor_finish_')}${choice('wallColor', wallColors, copy.room_wall_color, 'wall_color_')}</div>`;
}

function roomCeilingFields(room) {
    const ceiling = room.ceiling;
    const height = ceiling ? `<div class="fp-fields">
        ${heightField('height', ceiling.type === 'gable' ? copy.ceiling_eave : copy.ceiling_low, room.height)}
        ${heightField('ceilingHigh', ceiling.type === 'gable' ? copy.ceiling_ridge : copy.ceiling_high, ceiling.high)}
    </div>` : heightField('height', copy.height, room.height);
    const axes = ceiling?.type === 'gable';
    const directions = axes ? ['x+', 'y+'] : ceilingDirections;
    const direction = ceiling ? `<label>${axes ? copy.ceiling_axis : copy.ceiling_direction}
        <select data-field="ceilingDirection">${options(directions, ceiling.direction, value => axes
            ? copy['ceiling_axis_' + value[0]]
            : copy['ceiling_' + value[0] + (value.endsWith('+') ? '_plus' : '_minus')])}</select></label>` : '';
    return `<fieldset class="fp-ceiling-settings"><legend>${copy.ceiling_section}</legend>
        ${height}${direction}<div id="fp-ceiling-profile"></div>
        ${ceiling ? `<p class="fp-note fp-ceiling-note">${copy.ceiling_room_note}</p>` : ''}
    </fieldset>`;
}

function crossSection(room, item = null) {
    const profile = ceilingProfile(room);
    const maxHeight = room.ceiling?.high ?? room.height;
    const span = room.ceiling?.direction.startsWith('x') === false ? room.depth : room.width;
    const scale = Math.min(194 / span, 61 / maxHeight);
    const left = (220 - span * scale) / 2;
    const floor = 79;
    const coordinates = (position, height) => [left + position * span * scale, floor - height * scale];
    const sides = room.ceiling.direction.startsWith('x') ? [copy.ceiling_left, copy.ceiling_right] : [copy.ceiling_top, copy.ceiling_bottom];
    const outline = profile.map(([position, height]) => coordinates(position, height).join(',')).join(' ');
    let marker = '';
    if (item) {
        const position = ceilingPosition(room, item);
        const [x, y] = coordinates(position, ceilingHeightAt(room, item));
        const ascending = room.ceiling.type === 'gable' ? position < .5 : room.ceiling.direction.endsWith('+');
        const vertical = item.levelMountRoom === room.id;
        const ridge = room.ceiling.type === 'gable' && Math.abs(position - .5) < .000001;
        const pitch = vertical ? 0 : ceilingPitch(room) * Math.PI / 180 * (ascending ? 1 : -1);
        const direction = vertical || !ridge
            ? `<path class="fp-cross-direction" d="M${x} ${y}l${12 * Math.sin(pitch)} ${12 * Math.cos(pitch)}"/>` : '';
        marker = `<path class="fp-cross-height" d="M${x} ${floor}V${y}"/>
            <circle class="fp-cross-marker" cx="${x}" cy="${y}" r="3"/>${direction}`;
    }
    return `<figure class="fp-cross-section">
        <svg viewBox="0 0 220 91" aria-hidden="true">
            <path class="fp-cross-wall" d="M${left} ${floor}V${coordinates(...profile[0])[1]} M${220-left} ${floor}V${coordinates(...profile.at(-1))[1]}"/>
            <path class="fp-cross-floor" d="M${left - 7} ${floor}H${227 - left}"/>
            <polyline class="fp-cross-roof" points="${outline}"/>${marker}
        </svg>
        <div class="fp-cross-sides"><span>A · ${sides[0]}</span><span>B · ${sides[1]}</span></div>
        <figcaption><span>${copy.ceiling_profile}</span><strong>${copy.ceiling_pitch} ≈${number.format(Math.round(ceilingPitch(room)))}°</strong></figcaption>
    </figure>`;
}

function sensorNote(item, room) {
    const device = devices[item.model];
    if (!device.defaultRadar && !integration) return copy.no_profile;
    if (item.radar === 'none') return '';
    if (!room) return copy.room_note;
    if (device.mount !== 'ceiling') return '';
    const status = ceilingCoverageStatus(room, item);
    if (status === 'tilted') return copy.ceiling_tilted;
    if (status === 'height') {
        const range = ceilingReferenceRange(item.radar);
        const estimated = radarFields(room, item, coverageRadarOptions).some(field => field.estimatedHeight);
        const fill = text => text.replaceAll(':low', number.format(range[0])).replaceAll(':high', number.format(range[1]));
        // Too high but still estimable: explain what changes and what helps.
        // This is advice, not a warning, so it is not shown in warning colours.
        if (estimated && range && copy.height_estimate) return Object.assign(new String(fill(copy.height_estimate)), { advice: true });
        return [copy.height_note, range && fill(copy.ceiling_range)].filter(Boolean).join(' ');
    }
    return room.ceiling ? copy.ceiling_local_range : '';
}

function updateSensorDetails(item) {
    element('fp-sensor-config').innerHTML = sensorOptions(item);
    const room = roomForDevice(plan.rooms, item);
    const note = element('fp-placement-note');
    if (note) {
        const text = sensorNote(item, room);
        note.textContent = text;
        note.hidden = !note.textContent;
        note.classList.toggle('fp-warning', !text?.advice);
    }
    const mount = element('fp-mount');
    if (!mount) return;
    mount.hidden = !room;
    if (!room) return;
    const edit = element('fp-edit-ceiling');
    edit.dataset.selectRoom = room.id;
    edit.title = room.name;
    element('fp-mount-height').textContent = `${number.format(ceilingHeightAt(room, item))} m`;
    element('fp-mount-level').hidden = !room.ceiling;
    element('fp-mount-level').querySelector('input').checked = item.levelMountRoom === room.id;
    const ridge = room.ceiling?.type === 'gable' && Math.abs(ceilingPosition(room, item) - .5) < .000001;
    element('fp-mount-profile').innerHTML = room.ceiling
        ? crossSection(room, item) + (ridge && item.levelMountRoom !== room.id ? `<p class="fp-note">${copy.ceiling_ridge_note}</p>` : '')
        : '';
}

// The way to the automation of a room, under its link to Home Assistant.
function roomAutomationLink() {
    if (!automationPanel) return '';
    const picked = integration.picker;
    return `<fieldset class="fp-ha-room-link">
        <legend>${escapeText(picked.automationTitle)}</legend>
        <p>${escapeText(picked.automationNote)}</p>
        <button type="button" data-action="room_automation">${escapeText(picked.automationAction)}</button>
    </fieldset>`;
}

// Shows what the room has for its automation: what is still missing, or the
// settings with the automation it has.
function showRoomAutomation(room, state, message = '') {
    const picked = integration.picker;
    const panel = automationPanel;
    const fill = text => text.replaceAll('{room}', room.name).replaceAll('{area}', state?.areaName ?? '');
    const missing = !state ? '' : !state.presence ? picked.automationNeedsSave : !state.areaId ? picked.automationNeedsArea
        : !state.lights.length ? fill(picked.automationNoLights) : '';
    const ready = Boolean(state) && !missing;
    panel.text.textContent = state ? missing || fill(picked.automationIntro) : '';
    panel.lights.hidden = !ready;
    if (ready) {
        const names = state.lights.slice(0, 6).map(light => light.name);
        if (state.lights.length > names.length) names.push('+' + number.format(state.lights.length - names.length));
        panel.lights.textContent = fill(picked.automationLights).replace('{lights}', names.join(', '));
    }
    panel.minutes.hidden = !ready;
    panel.dark.hidden = !ready || !state.sun;
    panel.save.hidden = !ready;
    panel.save.disabled = false;
    panel.remove.disabled = false;
    panel.save.textContent = state?.saved ? picked.automationUpdate : picked.automationCreate;
    panel.remove.hidden = !ready || !state.saved;
    panel.open.hidden = !ready || !state.saved;
    if (ready) panel.open.href = `/config/automation/edit/${encodeURIComponent(state.id)}`;
    panel.note.textContent = message;
    panel.note.hidden = !message;
    // Nothing left to decide once it is done, or while something is missing.
    panel.close.textContent = ready && !message ? copy.cancel_place : copy.tool_done ?? copy.cancel_place;
}

async function openRoomAutomation() {
    const room = currentRoom();
    if (!automationPanel || !room) return;
    const picked = integration.picker;
    const panel = automationPanel;
    panel.room = room;
    showRoomAutomation(room, null);
    panel.dialog.showModal();
    try {
        const state = await integration.presenceLights.state(room);
        // The window may have been closed, or opened for another room, in the meantime.
        if (panel.room !== room || !panel.dialog.open) return;
        panel.minutes.querySelector('input').value = state.saved?.minutes ?? 3;
        panel.dark.querySelector('input').checked = state.saved ? state.saved.onlyDark : true;
        showRoomAutomation(room, state);
    } catch {
        showRoomAutomation(room, null, picked.automationError);
    }
}

if (automationPanel) {
    const panel = automationPanel;
    const picked = integration.picker;
    // After a change, the room is asked again what it has, so the window shows what Home Assistant holds.
    const change = async (work, done) => {
        const room = panel.room;
        const minutes = panel.minutes.querySelector('input');
        if (!room || (work === 'save' && !minutes.reportValidity())) return;
        panel.save.disabled = panel.remove.disabled = true;
        try {
            if (work === 'save') await integration.presenceLights.save(room, { minutes: minutes.valueAsNumber, onlyDark: panel.dark.querySelector('input').checked });
            else await integration.presenceLights.remove(room);
            const state = await integration.presenceLights.state(room);
            if (panel.room === room && panel.dialog.open) showRoomAutomation(room, state, done);
        } catch {
            if (panel.room !== room) return;
            panel.save.disabled = panel.remove.disabled = false;
            panel.note.textContent = picked.automationError;
            panel.note.hidden = false;
        }
    };
    panel.save.addEventListener('click', () => change('save', picked.automationSaved));
    panel.remove.addEventListener('click', () => change('remove', picked.automationRemoved));
}

function homeAssistantRoomLink(room) {
    if (!integration) return '';
    const picked = integration.picker;
    const floors = homeAssistantFloors();
    const areas = homeAssistantAreas();
    const used = linkedAreaIds(room);
    const selectedFloor = room.haFloorId ?? '';
    const selectedArea = room.haAreaId ?? '';
    const floorKnown = !selectedFloor || floors.some(floor => floor.id === selectedFloor);
    const areaKnown = !selectedArea || areas.some(area => area.id === selectedArea);
    const floorOptions = [
        `<option value="">${escapeText(picked.notLinked)}</option>`,
        ...(!floorKnown ? [`<option value="${escapeText(selectedFloor)}" selected>${escapeText(picked.missingArea.replace('{id}', selectedFloor))}</option>`] : []),
        ...floors.map(floor => `<option value="${escapeText(floor.id)}" ${floor.id === selectedFloor ? 'selected' : ''}>${escapeText(floor.name)}</option>`),
    ].join('');
    const areaOptions = areas.filter(area => !selectedFloor || !area.floorId || area.floorId === selectedFloor || area.id === selectedArea);
    const optionsHtml = [
        `<option value="">${escapeText(picked.notLinked)}</option>`,
        ...(!areaKnown ? [`<option value="${escapeText(selectedArea)}" selected>${escapeText(picked.missingArea.replace('{id}', selectedArea))}</option>`] : []),
        ...areaOptions.map(area => {
            const unavailable = used.has(area.id);
            const label = unavailable ? `${area.name} · ${picked.areaAlreadyLinked}` : area.name;
            return `<option value="${escapeText(area.id)}" ${area.id === selectedArea ? 'selected' : ''} ${unavailable ? 'disabled' : ''}>${escapeText(label)}</option>`;
        }),
    ].join('');
    return `<fieldset class="fp-ha-room-link">
        <legend>${escapeText(picked.homeAssistantLink)}</legend>
        <p>${escapeText(picked.homeAssistantLinkNote)}</p>
        <label>${escapeText(picked.homeAssistantFloor)}<select id="fp-room-ha-floor">${floorOptions}</select></label>
        <label>${escapeText(picked.homeAssistantArea)}<select id="fp-room-ha-area">${optionsHtml}</select></label>
    </fieldset>`;
}

function renderInspector() {
    showDoorActions();
    const { type, item } = selectedItem();
    const inspector = element('fp-inspector');
    const title = element('fp-inspector-title');
    title.textContent = type === 'rooms' ? item.name
        : type === 'sensors' ? sensorName(item) : ['furniture', 'zones'].includes(type) ? item.name
            : ['windows', 'mirrors'].includes(type) ? copy[type === 'windows' ? 'window' : 'mirror'] : copy.selection;
    if (!item) {
        inspector.innerHTML = `<p class="fp-note">${copy.select_hint}</p>`;
        return;
    }
    const isSensor = type === 'sensors';
    const canRotate = (isSensor && !isWallMounted(item)) || type === 'doors' || type === 'furniture';
    const advancedOpen = inspector.dataset.item === item.id && inspector.querySelector('details.fp-inspector-more')?.open;
    inspector.dataset.item = item.id;
    let settings = '';
    let link = '';
    let roomFloor = '';
    if (type === 'rooms') {
        const floors = projectFloors();
        const calibration = integration?.calibrationLabel(item.haRoom);
        roomFloor = floors.length > 1 ? `<label>${copy.floor_move_room}<select id="fp-room-floor">
            ${floors.map(floor => `<option value="${floor.id}" ${floor.id === building.activeFloor ? 'selected' : ''}>${escapeText(floorLabel(floor, copy))}</option>`).join('')}</select></label>` : '';
        settings = `<div id="fp-room-metrics"></div><label>${copy.name}<input data-field="name" maxlength="48" value="${escapeText(item.name)}" required></label>
            ${item.outline ? `<p class="fp-note">${copy.room_outline} · ${number.format(roomArea(item))} m²</p>`
                : `<div class="fp-fields">${field(item, 'width', copy.width, .5, 60, 'any')}${field(item, 'depth', copy.depth, .5, 60, 'any')}</div>`}
            ${item.ceiling ? roomCeilingFields(item) : heightField('height', copy.height, item.height)}
            ${roomFinishFields(item)}
            ${calibration ? `<p class="fp-note">${escapeText(calibration)}</p>` : ''}
            ${homeAssistantRoomLink(item)}${roomAutomationLink()}`;
    } else if (type === 'walls') {
        settings = `<div class="fp-fields">${field(item, 'endX', copy.end_x, -100, 100, 'any')}${field(item, 'endY', copy.end_y, -100, 100, 'any')}</div>`;
    } else if (type === 'doors') {
        settings = field(item, 'width', copy.width, .5, 2, 'any');
    } else if (type === 'windows' || type === 'mirrors') {
        settings = `<div class="fp-fields">${field(item, 'width', copy.width, .1, 8, 'any')}${field(item, 'height', copy.object_height, .1, 6, 'any')}</div>
            ${field(item, 'base', copy.furniture_base, 0, 6, 'any')}
            ${type === 'mirrors' ? mirrorSettings(item) : ''}`;
    } else if (type === 'zones') {
        const room = currentRoom();
        const sensors = plan.sensors.filter(sensor => roomForDevice(plan.rooms, sensor)?.id === room?.id);
        settings = `<p class="fp-note">${copy['zone_' + item.type]} · ${copy.zone_parts.replace(':count', item.parts.length)}</p>
            <label>${copy.name}<input data-field="name" maxlength="48" value="${escapeText(item.name)}" required></label>
            <label>${copy.zone_sensor}<select data-field="sensorId">
                <option value="">${copy.zone_all_sensors}</option>
                ${sensors.map(sensor => `<option value="${sensor.id}" ${item.sensorId === sensor.id ? 'selected' : ''}>
                    ${escapeText(devices[sensor.model].name)} · ${plan.sensors.indexOf(sensor) + 1}</option>`).join('')}
            </select></label>
            ${item.parts.length > 1 ? `<label>${copy.zone_part}<select id="fp-zone-part-index">${item.parts.map((_, i) =>
                `<option value="${i}">${number.format(i + 1)}</option>`).join('')}</select></label>` : ''}
            ${item.type === 'entry' ? `<label>${copy.zone_direction}<select data-field="direction">
                ${options(['left', 'right'], item.direction ?? 'right', value => copy['zone_' + value])}</select></label>` : ''}
            <p class="fp-note">${copy.zone_note}</p>`;
    } else if (type === 'furniture') {
        settings = `<label>${copy.name}<input data-field="name" maxlength="48" value="${escapeText(item.name)}" required></label>
            <div class="fp-fields">${field(item, 'width', copy.width, .02, 12, 'any')}${field(item, 'depth', copy.depth, .02, 12, 'any')}
            ${field(item, 'height', copy.furniture_height, .01, 6, 'any')}${field(item, 'base', copy.furniture_base, 0, 6, 'any')}</div>
            <label>${copy.furniture_material}<select data-field="material">${furnitureMaterials.map(material =>
                `<option value="${material}" ${material === item.material ? 'selected' : ''}>${copy.furniture_materials[material]}</option>`).join('')}</select></label>
            <p class="fp-note">${furnitureCatalog[item.kind]?.category === 'motion' ? copy.furniture_motion_note : copy.furniture_material_note}</p>`;
    } else {
        const radars = radarsFor(item.model);
        if (integration) settings = sensorOptions(item);
        if (!integration && radars.length > 1) {
            settings = `<label>${copy.radar}<select data-field="radar">${radars.map(radar =>
                `<option value="${radar}" ${radar === item.radar ? 'selected' : ''}>${radarLabel(item, radar)}</option>`).join('')}</select></label>`;
        }
        if (devices[item.model].mount === 'wall') {
            settings += field({ ...item, mountHeight: item.mountHeight ?? 1.4 }, 'mountHeight', copy.wall_sensor_height, .15, 6, 'any');
        }
        if (sensorAim && canAimSensor(item)) {
            if (isWallMounted(item)) settings += field({ ...item, pan: item.pan ?? 0 }, 'pan', copy.wall_sensor_pan, -sensorPan, sensorPan, 1);
            settings += field({ ...item, tilt: item.tilt ?? 0 }, 'tilt', copy.wall_sensor_tilt, sensorTilt.min, sensorTilt.max, 1);
        }
        if (!integration && item.model === 'ceilsense-v2') {
            settings += `<label class="fp-climate-field"><input type="checkbox" data-field="climate" ${item.climate ? 'checked' : ''}> ${copy.plan_scd41}</label>`;
        }
        if (!integration) link = item.model === 'wallsense' ? `<a class="fp-product" href="${escapeText(root.dataset.wallsenseUrl)}">WallSense ↗</a>`
            : ['ceilsense-mini', 'ceilsense-pro'].includes(item.model)
            ? `<p class="fp-note">${copy.planning}</p>`
            : `<a class="fp-product" href="${escapeText(root.dataset.productPrefix)}${item.model}">${copy.product} ↗</a>`;
    }
    const positionFields = ['zones', 'windows', 'mirrors'].includes(type) ? ''
        : `<div class="fp-fields">${field(item, 'x', 'X (m)', -100, 100, 'any')}${field(item, 'y', 'Y (m)', -100, 100, 'any')}</div>`;
    const roomMore = `<details class="fp-inspector-more" ${advancedOpen ? 'open' : ''}><summary>${copy.room_settings_more}</summary>
        <div>${type === 'rooms' ? ceilingTypeField(item.ceiling) : ''}${roomFloor}${positionFields}<div class="fp-inspector-actions">
            <button type="button" data-action="edit_outline">${copy.room_edit_outline}</button>
            <button type="button" data-action="rotate_room">${copy.rotate}</button>
            ${copy.room_delete_confirm ? '' : `<button type="button" data-action="delete">${copy.remove}</button>`}
        </div></div></details>
        ${copy.room_delete_confirm ? `<div class="fp-inspector-actions"><button type="button" class="fp-room-remove" data-action="delete">${copy.room_delete_confirm}</button></div>` : ''}`;
    inspector.innerHTML = `
        ${isSensor ? '<div id="fp-sensor-config"></div>' : ''}
        ${isSensor ? '<div class="fp-range-key" id="fp-range-key"></div>' : ''}
        ${settings}
        ${isSensor ? `<label>${copy.installation}<select data-field="installation">${installationsFor(item.model).map(value =>
            `<option value="${value}" ${installationFor(item) === value ? 'selected' : ''}>${copy.installations[value]}</option>`).join('')}</select></label>
            ${item.model === 'wallsense' ? `<p class="fp-note">${copy.wallsense_note}</p>` : ''}
            ${item.installation && ['ultimatesensor-v2', 'ultimatesensor-mini-v2'].includes(item.model) ? `<p class="fp-note">${copy.mount_kit_note}</p>` : ''}` : ''}
        ${['rooms', 'sensors', 'walls'].includes(type)
            ? `<button type="button" class="fp-touch-move" data-action="move_item">${copy.move_item}</button>` : ''}
        ${type === 'rooms' ? roomMore : positionFields}
        ${canRotate ? field(item, 'angle', copy.angle, 0, 359, 1) : ''}
        ${isSensor && devices[item.model].mount === 'ceiling' ? `<div class="fp-mount" id="fp-mount">
            <p>${copy.ceiling_mount_height} <strong id="fp-mount-height"></strong></p>
            <div id="fp-mount-level"><label><input type="checkbox" data-field="levelMount"> ${copy.ceiling_mount_level}</label>
                <small>${copy.ceiling_mount_hint}</small></div>
            <div id="fp-mount-profile"></div>
            <button type="button" class="fp-mount-edit" id="fp-edit-ceiling">${copy.ceiling_edit} <span aria-hidden="true">→</span></button>
        </div>` : ''}
        ${isSensor ? `<div class="fp-nudge" role="group" aria-label="${copy.nudge_title}">
            <span>${copy.nudge_title}</span>${[['left','←'],['up','↑'],['down','↓'],['right','→']].map(([direction, icon]) =>
                `<button type="button" data-nudge="${direction}" aria-label="${copy['nudge_' + direction]}">${icon}</button>`).join('')}</div>
            <p class="fp-note fp-warning" id="fp-placement-note" hidden></p>` : ''}
        ${type === 'doors' && copy.door_note ? `<p class="fp-note">${copy.door_note}</p>` : ''}
        ${type === 'rooms' ? '' : `<div class="fp-inspector-actions">
            ${type === 'doors' && copy.door_close ? `<button type="button" data-action="toggle_door">${item.closed ? copy.door_open : copy.door_close}</button>` : ''}
            ${['doors', 'windows', 'mirrors'].includes(type) ? `<button type="button" data-action="move_opening">${copy.opening_move}</button>` : ''}
            ${type === 'zones' && item.type !== 'entry' && item.parts.length < 12 ? `<button type="button" data-action="zone_part">${copy.zone_add_part}</button>` : ''}
            ${type === 'zones' ? `<button type="button" data-action="edit_zone_part">${copy.zone_edit_part}</button>` : ''}
            ${type === 'zones' && item.parts.length > 1 ? `<button type="button" data-action="remove_zone_part">${copy.zone_remove_part}</button>` : ''}
            ${canRotate ? `<button type="button" data-action="rotate">${copy.rotate}</button>` : ''}
            ${type === 'furniture' ? `<button type="button" data-action="move_furniture">${copy.furniture_move}</button>
                <button type="button" data-action="duplicate_furniture">${copy.furniture_duplicate}</button>` : ''}
            <button type="button" data-action="delete">${copy.remove}</button>
        </div>`}
        ${link}`;
    if (isSensor) {
        updateRangeKey(item);
        updateSensorDetails(item);
    }
    if (type === 'rooms') {
        renderRoomMetrics(item);
        if (item.ceiling) element('fp-ceiling-profile').innerHTML = crossSection(item);
    }
}

function renderRoomMetrics(room) {
    const metrics = element('fp-room-metrics');
    if (!metrics) return;
    const objects = roomContents(plan, room);
    const corners = roomCorners(room);
    const perimeter = polygonEdges(corners).reduce((sum, [[ax, ay], [bx, by]]) => sum + Math.hypot(bx - ax, by - ay), 0);
    const counts = [[copy.room_corners, room.outline ? corners.length : 0], [copy.placements, objects.sensors.length],
        [copy.furniture_short, objects.furniture.length], [copy.room_doors, objects.doors.length],
        [copy.room_windows, objects.windows.length], [copy.room_mirrors, objects.mirrors.length],
        [copy.room_zones, objects.zones.length]].filter(([, value]) => value);
    metrics.innerHTML = `<div class="fp-room-metric-lead"><strong>${number.format(roomArea(room))} m²</strong>
        <span>${copy.room_perimeter.replace(':length', number.format(perimeter))}</span></div>
        ${counts.length ? `<div class="fp-room-metric-grid">${counts.map(([label, value]) =>
            `<span><strong>${value}</strong> ${label}</span>`).join('')}</div>` : ''}`;
}

function filterCatalog() {
    if (integration) { renderHaCatalog(); return; }
    const query = element('fp-search').value.trim().toLowerCase();
    let matches = 0;
    library.querySelectorAll('.fp-device-group').forEach(group => {
        let count = 0;
        group.querySelectorAll('[data-model]').forEach(button => {
            const model = button.dataset.model;
            const device = devices[model];
            const terms = [device.name, ...radarsFor(model).filter(radar => radar !== 'none').map(radar => radarNames[radar])];
            const fits = catalogMount === 'all' || catalogMount === 'ceiling' && device.mount === 'ceiling'
                || catalogMount === 'recessed' && button.dataset.model === 'wallsense'
                || catalogMount === 'freestanding' && installationsFor(button.dataset.model).includes('freestanding')
                || catalogMount === 'wall' && installationsFor(button.dataset.model).includes('wall-bracket');
            const found = fits && terms.some(term => term.toLowerCase().includes(query));
            button.hidden = !found;
            count += Number(found);
        });
        group.hidden = count === 0;
        matches += count;
    });
    element('fp-search-empty').hidden = matches > 0;
    library.querySelectorAll('[data-catalog-mount]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.catalogMount === catalogMount));
    });
}

function setLibraryExpanded(expanded) {
    for (const button of root.querySelectorAll('[data-action="library"], [data-action="flow_sensor"], [data-action="next_extra_sensor"]')) {
        button.setAttribute('aria-expanded', String(expanded));
    }
    renderFlow();
}

function openLibrary(opener, position = null) {
    closeLibrary(false);
    libraryPanelWasOpen = root.hasAttribute('data-panel');
    root.setAttribute('data-panel', '');
    libraryOpener = opener;
    quickPlacement = position?.point ?? null;
    catalogRoomId = position?.room?.id ?? placementRoom()?.id ?? null;
    catalogAreaOnly = Boolean(roomById(catalogRoomId)?.haAreaId);
    drawingMenu.open = false;
    const context = element('fp-library-context');
    context.textContent = integration?.picker.prompt ?? (position ? copy.quick_place_room.replace(':room', position.room.name) : copy.catalog_prompt);
    const search = element('fp-search');
    search.value = '';
    catalogMount = 'all';
    filterCatalog();
    library.style.removeProperty('left');
    library.style.removeProperty('top');
    const mode = position ? 'quick' : compactLibrary.matches ? 'sheet' : 'dock';
    library.querySelector('[data-action="catalog_advice"]').hidden = Boolean(integration) || mode === 'quick' || !plan.rooms.length || allFloors;
    library.dataset.mode = mode;
    library.hidden = false;
    if (mode === 'dock') {
        root.setAttribute('data-panel', '');
        library.removeAttribute('popover');
        sidebar.setAttribute('data-library', '');
        setLibraryExpanded(true);
    } else {
        library.setAttribute('popover', 'auto');
        library.showPopover();
        if (position) {
            const x = Math.min(position.x + 10, innerWidth - library.offsetWidth - 10);
            const below = position.y + 10;
            const y = below + library.offsetHeight < innerHeight - 12 ? below : position.y - library.offsetHeight - 8;
            library.style.left = `${scrollX + Math.max(10, x)}px`;
            library.style.top = `${scrollY + Math.max(10, y)}px`;
        }
    }
    (mode === 'sheet' || search.hidden ? library.querySelector('button') : search).focus({ preventScroll: true });
    if (integration) void integration.refreshDevices().then(() => {
        if (libraryIsOpen()) filterCatalog();
    });
}

function closeLibrary(restore = true) {
    if (!libraryIsOpen()) return;
    if (sidebar.hasAttribute('data-library')) {
        library.hidden = true;
        sidebar.removeAttribute('data-library');
        setLibraryExpanded(false);
    } else library.hidePopover();
    if (restore) (libraryOpener ?? libraryButton).focus({ preventScroll: true });
    libraryOpener = null;
    quickPlacement = null;
    catalogRoomId = null;
    catalogAreaOnly = false;
}

library.addEventListener('beforetoggle', event => {
    setLibraryExpanded(event.newState === 'open');
    if (event.newState === 'closed') {
        quickPlacement = null;
        catalogRoomId = null;
        catalogAreaOnly = false;
        root.toggleAttribute('data-panel', libraryPanelWasOpen);
    }
});
function arrangeProjectControls() {
    const name = element('fp-project-name');
    projectMenu.open = false;
    floorMenu.open = false;
    if (compactLibrary.matches) element('fp-mobile-project-options').append(name);
    else element('fp-project').prepend(name);
}

compactLibrary.addEventListener('change', () => {
    closeLibrary();
    arrangeProjectControls();
});
element('fp-search').addEventListener('input', filterCatalog);
element('fp-place-installation').addEventListener('change', event => {
    placementInstallation = event.target.value;
    placementPoint = null;
    ghost.replaceChildren();
    updateTools();
});
for (const input of [openingWidth, openingHeight]) {
    input.addEventListener('input', () => {
        if (placingOpening()) updateTools();
    });
    input.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.isComposing || event.repeat || !placingOpening() || !placementPoint) return;
        event.preventDefault();
        element('fp-place-confirm').click();
    });
}

function updateRangeKey(item) {
    const key = element('fp-range-key');
    if (!key) return;
    const wall = devices[item.model].mount === 'wall';
    const two = item.radar === 'combined' || (wall && item.radar !== 'none');
    key.hidden = !two;
    key.innerHTML = two ? `
        <span><i></i> ${copy.tracking_line} · ${item.radar === 'combined' ? 'LD6002B' : item.radar.toUpperCase()}</span>
        <span><i></i> ${copy.presence_line} · LD2412</span>
        ${hasMotionSensor(item.model) && copy.sim_motion ? `<span class="fp-range-key-motion"><i></i> ${copy.sim_motion} · PIR</span>` : ''}` : '';
}

function renderHandoff() {
    const room = selectedItem().type === 'furniture' ? null : currentRoom();
    const panel = element('fp-handoff');
    panel.hidden = !room || !plan.sensors.some(item => item.model === 'ceilsense-v2' && roomForDevice(plan.rooms, item)?.id === room.id);
    if (panel.hidden) return;

    const target = guidePlanForRoom(plan, room);
    const title = `<h3>${copy.handoff_title}</h3><p class="fp-note">${escapeText(room.name)}</p>`;
    if (target.reason) {
        panel.innerHTML = title + `<p class="fp-note">${copy['handoff_' + target.reason]}</p>`
            + (target.reason === 'ceiling' ? `<a href="${escapeText(root.dataset.productPrefix)}ceilsense-v2">${copy.v2_link} ↗</a>` : '');
        return;
    }
    const url = root.dataset.productPrefix + 'ceilsense-v2#' + formatPlannerLink(target);
    panel.innerHTML = title + `
        <p class="fp-note">${target.count} × CeilSense V2 · ${radarNames[target.radar]}</p>
        <a href="${escapeText(url)}">${copy.handoff_action} <span aria-hidden="true">→</span></a>`;
}

function updateSelectionJump() {
    const jump = element('fp-selection-jump');
    const editing = !element('fp-properties').hidden && Boolean(selectedItem().item);
    jump.hidden = simulation || tool !== 'edit' || allFloors || !plan.rooms.length;
    jump.setAttribute('aria-controls', editing ? 'fp-properties' : 'fp-outline');
    element('fp-selection-name').textContent = editing ? copy.edit_selection : copy.plan_outline;
}

function showPanel(name, open = true) {
    root.toggleAttribute('data-panel', open);
    for (const panel of ['outline', 'properties']) {
        const tab = element('fp-tab-' + panel);
        tab.setAttribute('aria-selected', String(name === panel));
        tab.tabIndex = name === panel ? 0 : -1;
        element('fp-' + panel).hidden = name !== panel;
    }
    updateSelectionJump();
}

function showInspectorStart(open = true) {
    closeLibrary(false);
    showPanel('properties', open);
    element('fp-properties').scrollTop = 0;
}

function inspectMapSelection(type, changed) {
    if (type === 'rooms') {
        showInspectorStart(root.hasAttribute('data-panel') && !compactLibrary.matches);
    } else if (selected && type !== 'sensors' && (changed || !element('fp-outline').hidden)) {
        showInspectorStart();
    }
}

function announcePosition(point, item = null, prefix = copy.position_status) {
    const room = item ? roomForDevice(plan.rooms, item) : null;
    const height = room && devices[item.model].mount === 'ceiling'
        ? ` · ${copy.ceiling_mount_height} ${number.format(ceilingHeightAt(room, item))} m` : '';
    element('fp-event').textContent = `${prefix} · X ${number.format(point.x)} m · Y ${number.format(point.y)} m${height}`;
}

function render() {
    element('fp-name').value = building?.name ?? plan.name;
    renderFloors();
    renderLists();
    renderInspector();
    renderHandoff();
    renderUnderlay();
    updateTools();
    renderDrawing();
}

function renderFloors() {
    const floors = [...projectFloors()].sort((a, b) => a.level - b.level);
    const current = building?.activeFloor ?? floors[0].id;
    const currentName = floorLabel(floors.find(floor => floor.id === current), copy);
    const options = floors.map(floor => ({
        id: floor.id, label: floorLabel(floor, copy), level: (floor.level > 0 ? '+' : '') + number.format(floor.level),
    })).reverse();
    if (floors.length > 1) options.push({ id: 'all', label: copy.floor_all, level: '3D' });
    const choices = element('fp-floor-choices');
    if (choices.childElementCount !== options.length) {
        const template = element('fp-floor-choice-template').content.firstElementChild;
        choices.replaceChildren(...options.map(() => template.cloneNode(true)));
    }
    options.forEach(({ id, label, level }, index) => {
        const button = choices.children[index];
        button.dataset.floorChoice = id;
        button.setAttribute('aria-current', String(id === (allFloors ? 'all' : current)));
        const levelLabel = button.querySelector('.fp-floor-level');
        levelLabel.textContent = level;
        levelLabel.setAttribute('aria-hidden', String(id !== 'all'));
        button.querySelector('.fp-floor-choice-label').textContent = label;
    });
    element('fp-floor-current').textContent = allFloors ? copy.floor_all : currentName;
    element('fp-floor-rename').hidden = allFloors;
    element('fp-floor-gap').hidden = !allFloors;
    element('fp-floor-name').value = currentName;
    root.querySelector('[data-action="add_upper_floor"]').disabled = floors.length >= maxFloors || floors.at(-1).level >= 20;
    root.querySelector('[data-action="add_lower_floor"]').disabled = floors.length >= maxFloors || floors[0].level <= -5;
    const remove = root.querySelector('[data-action="remove_floor"]');
    remove.disabled = Boolean(plan.underlay || ['rooms', 'walls', 'doors', 'sensors', 'furniture', 'windows', 'mirrors', 'zones'].some(key => plan[key]?.length));
    remove.hidden = allFloors || floors.length < 2 || remove.disabled;
    root.toggleAttribute('data-all-floors', allFloors);
}

function closeFloorMenu() {
    floorMenu.open = false;
    floorTrigger.focus({ preventScroll: true });
}

function showFloor(id, keepOverview = false) {
    closeSensorTip();
    closeLibrary(false);
    reviewedCoverage = false;
    recentUndo = null;
    toolbox.open = false;
    viewMenu.open = false;
    roomFormOpen = false;
    if (floorMenu.open) closeFloorMenu();
    if (id === 'all') {
        setView('3d');
        allFloors = true;
        spaceZoom = 1;
        spaceFollow = false;
        render();
        return;
    }
    if (simulation) setSimulation(false);
    allFloors = keepOverview;
    if (building) {
        const project = projectDocument();
        if (!project.floors.some(floor => floor.id === id)) return;
        project.activeFloor = id;
        readProject(project);
    }
    selected = plan.sensors[0]?.id;
    beamChoice = '';
    underlayMeasure = null;
    spaceZoom = 1;
    setTool('edit');
    showPanel('outline');
    render();
    fit();
    save();
}

function addFloor(direction) {
    const floors = projectFloors();
    if (floors.length >= maxFloors) return;
    const levels = floors.map(floor => floor.level);
    const level = direction > 0 ? Math.max(...levels) + 1 : Math.min(...levels) - 1;
    if (level < -5 || level > 20) return;
    remember();
    const next = { id: newId(), level, name: null, plan: withEditableFurniture({ ...blankPlan(plan.name), furniture: [] }) };
    building = { ...building, format: buildingFormat, version: 1, name: building?.name ?? plan.name,
        floors: [...floors, next], activeFloor: next.id };
    plan = next.plan;
    showFloor(next.id);
}

function renderUnderlay() {
    const image = element('fp-underlay');
    const controls = element('fp-underlay-controls');
    const underlay = plan.underlay;
    image.toggleAttribute('hidden', !underlay);
    controls.hidden = view !== '2d' || !underlay;
    element('fp-underlay-measure').hidden = !underlay || !underlayMeasure;
    root.toggleAttribute('data-underlay', !controls.hidden);
    if (!underlay) {
        image.removeAttribute('href');
        return;
    }
    if (image.getAttribute('href') !== underlay.data) image.setAttribute('href', underlay.data);
    // Another image starts again: its message and consent belong to the old one.
    if (recognition && recognition.image !== underlay.data && recognition.state !== 'busy') {
        recognition.image = underlay.data;
        recognition.pending = null;
        showRecognition('idle');
    }
    if (tracing && tracing.image !== underlay.data && !tracing.busy) {
        tracing.image = underlay.data;
        tracing.pending = false;
        showTracing();
    }
    const place = { x: underlay.x, y: underlay.y, width: underlay.width, height: underlay.width / underlay.ratio };
    for (const [key, value] of Object.entries({ ...place, opacity: underlay.opacity / 100 })) image.setAttribute(key, value);
    if (recognition) for (const [key, value] of Object.entries(place)) recognition.frame.setAttribute(key, value);
    element('fp-underlay-opacity').value = underlay.opacity;
    element('fp-underlay-rooms').value = roomTransparency(underlay);
    showRoomTransparency(roomTransparency(underlay));
}

// Only the floor of a room becomes see-through, and only while the image is
// shown: the stylesheet uses this value under [data-underlay].
function showRoomTransparency(percent) {
    canvas.style.setProperty('--fp-room-fill', (100 - percent) / 100);
}

// Asks which page of a PDF to use, with a preview of the page. Resolves to the
// page number, or to null when the dialog is closed without choosing.
function choosePdfPage(pdf) {
    const input = element('fp-pdf-page');
    const preview = element('fp-pdf-preview');
    const status = element('fp-pdf-status');
    const use = pdfPages.querySelector('button[type="submit"]');
    let latest = 0;
    const show = async () => {
        if (!input.validity.valid) return;
        const turn = ++latest;
        const canvas = await pdf.render(input.valueAsNumber, 440).catch(() => null);
        if (turn !== latest) return;
        preview.replaceChildren(...(canvas ? [canvas] : []));
        status.textContent = canvas ? '' : copy.underlay_pdf_error;
        use.disabled = !canvas;
    };
    input.max = pdf.pages;
    input.value = 1;
    element('fp-pdf-page-label').textContent = copy.underlay_pdf_page.replace(':count', number.format(pdf.pages));
    return new Promise(resolve => {
        input.oninput = show;
        pdfPages.onclose = () => {
            latest += 1;
            input.oninput = pdfPages.onclose = null;
            preview.replaceChildren();
            resolve(pdfPages.returnValue === 'use' ? input.valueAsNumber : null);
        };
        pdfPages.returnValue = '';
        pdfPages.showModal();
        show();
    });
}

// Asks which part of an uploaded image to use, so one floor plan can be kept
// from a sheet that shows more. Dragging on the picture draws a box, its
// corners resize it and the box itself can be moved; the keyboard does the
// same from the picture. Resolves to the part in shares of the image, or to
// null when the dialog is closed without choosing.
function chooseImagePart(picture, ratio) {
    const stage = element('fp-crop-stage'), box = element('fp-crop-box');
    const whole = imageParts.querySelector('button[value="whole"]'), use = imageParts.querySelector('button[value="part"]');
    const step = .02;
    let part = null, drag = null;
    const show = () => {
        const usable = usablePart(part, ratio);
        box.hidden = !part;
        if (part) {
            Object.assign(box.style, { left: `${part.x * 100}%`, top: `${part.y * 100}%`,
                width: `${part.width * 100}%`, height: `${part.height * 100}%` });
        }
        use.disabled = !usable;
        use.classList.toggle('fp-primary', usable);
        whole.classList.toggle('fp-primary', !usable);
    };
    const at = event => {
        const bounds = stage.getBoundingClientRect();
        return { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
    };
    const far = () => ({ x: part.x + part.width, y: part.y + part.height });
    stage.style.setProperty('--fp-crop-ratio', ratio);
    stage.prepend(picture);
    show();
    return new Promise(resolve => {
        stage.onpointerdown = event => {
            if (event.button) return;
            const point = at(event), corner = event.target.dataset.corner;
            if (corner && part) {
                // The opposite corner stays where it is.
                drag = { from: { x: corner.includes('w') ? far().x : part.x, y: corner.includes('n') ? far().y : part.y } };
            } else if (event.target === box && part) {
                drag = { grip: point, start: part };
            } else {
                drag = { from: point };
                part = null;
                show();
            }
            stage.setPointerCapture(event.pointerId);
        };
        stage.onpointermove = event => {
            if (!drag) return;
            const point = at(event);
            part = drag.from ? imagePart(drag.from, point, 0) : movedPart(drag.start, point.x - drag.grip.x, point.y - drag.grip.y);
            show();
        };
        stage.onpointerup = stage.onpointercancel = () => {
            if (!drag) return;
            drag = null;
            // A click, or a box too small to be meant, leaves nothing chosen.
            if (part && !imagePart(part, far())) part = null;
            show();
        };
        stage.onkeydown = event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                (use.disabled ? whole : use).click();
                return;
            }
            const [dx, dy] = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key] ?? [];
            const removes = part && ['Delete', 'Backspace'].includes(event.key);
            if (dx === undefined && !removes) return;
            event.preventDefault();
            if (removes) part = null;
            // The first arrow key starts with the middle of the image.
            else if (!part) part = { x: .25, y: .25, width: .5, height: .5 };
            else if (event.shiftKey) part = imagePart(part, { x: far().x + dx, y: far().y + dy }) ?? part;
            else part = movedPart(part, dx, dy);
            show();
        };
        imageParts.onclose = () => {
            stage.onpointerdown = stage.onpointermove = stage.onpointerup = stage.onpointercancel = stage.onkeydown = null;
            imageParts.onclose = null;
            picture.remove();
            const answer = imageParts.returnValue;
            resolve(answer === 'part' && usablePart(part, ratio) ? part : answer === 'whole' ? wholeImage : null);
        };
        imageParts.returnValue = '';
        imageParts.showModal();
    });
}

function renderDrawing() {
    renderRoomHandles();
    heatLegend.hidden = !showHeatmap;
    const sight = showCoverage ? prepareSight(planForDrawing(plan)) : null;
    beamChoices = showCoverage ? visibleSensors(plan).flatMap((item, index) => {
        const room = roomForDevice(plan.rooms, item);
        const marker = String(index + 1).padStart(2, '0');
        const motion = room && copy.sim_motion ? motionField(item) : null;
        return [...radarFields(room, item, coverageRadarOptions).reverse(), ...(motion ? [motion] : [])].map(field => {
            const radar = field.radar.toUpperCase();
            return {
                item, room, field, sight, key: `${item.id}:${field.radar}`,
                label: `${marker} · ${devices[item.model].name} · ${radar}`,
                shortLabel: `${marker} · ${radar}`,
            };
        });
    }) : [];
    if (showCoverage && beamChoice && !beamChoices.some(choice => choice.key === beamChoice)) beamChoice = '';
    if (motionLegend) motionLegend.hidden = !beamChoices.some(choice => choice.field.mode === 'motion');
    beamPanelKey = null;
    if (view === '3d') {
        renderSpatialDrawing();
        return;
    }
    beamKey = null;
    renderPerson();
}

function renderSpatialDrawing() {
    beamKey = null;
    const crossing = stairWalk?.crossing != null;
    const stacked = allFloors || crossing;
    const stair = currentStairTrip();
    const beams = allFloors && showCoverage ? (floor, camera) => paintFloorCoverage(floor, camera, coverageRadarOptions) : null;
    const heat = (floorPlan, camera) => paintCoverageHeat(heatCells(floorPlan), { project: point => projectSpace(point, .012, camera) });
    const floorCoverage = showHeatmap && allFloors ? (floor, camera) => {
        const coverage = beams?.(floor, camera) ?? {};
        return { ...coverage, floorOverlay: heat(floor.plan, camera) + (coverage.floorOverlay ?? '') };
    } : beams;
    const singleCoverage = showHeatmap ? { floorOverlay: heat(plan, spaceCamera) + '<g id="fp-wall-coverage-space" pointer-events="none"></g>' } : null;
    const draft = space.hasAttribute('data-orbiting');
    const scene = stacked ? paintBuilding(projectFloors().map(floor => ({ ...floor, plan: planForDrawing(floor.plan), label: floorLabel(floor, copy) })),
        spaceCamera, floorSeparation, building?.staircase, floorCoverage, { draft, wallMode, daylight })
        : paintSpace(planForDrawing(plan), spaceCamera, selected, { interactiveSensors: true, staircase: stair?.stair, upperStair: stair && !stair.up, draft, wallMode, daylight, coverage: singleCoverage });
    element('fp-space-empty').hidden = Boolean(scene);
    element('fp-space-guide').hidden = !scene;
    element('fp-space-furniture').hidden = !scene?.hasFurniture;
    space.setAttribute('aria-hidden', String(stacked));
    replaceMapMarkup(space, scene ? scene.markup + '<g id="fp-activity-space-layer" pointer-events="none"></g><g id="fp-person-space-layer" pointer-events="none"></g>' : '');
    if (stacked && coverageEstimateLegend) coverageEstimateLegend.hidden = !space.querySelector('[data-height-estimate]');
    if (allFloors && simulation && !crossing && scene) {
        const floor = space.querySelector(`[data-building-floor="${building.activeFloor}"]`);
        if (floor) {
            floor.setAttribute('data-sim-floor', '');
            const trail = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            trail.id = 'fp-stacked-walk-lines';
            trail.setAttribute('pointer-events', 'none');
            floor.append(trail, element('fp-activity-space-layer'));
            element('fp-person-space-layer').setAttribute('transform', floor.getAttribute('transform'));
        }
    }
    const wallLayer = element('fp-wall-coverage-space');
    if (wallLayer) wallLayer.innerHTML = paintWallCoverage(beamChoices, spaceCamera);
    spaceBounds = scene ? scene.viewBox.split(' ').map(Number) : null;
    if (scene) {
        updateSpatialViewport();
        updateSpaceControls();
        sizeSpaceLabels();
    }
    if (stacked) element('fp-radar-panel').hidden = true;
    if (crossing) {
        highlightStairFloor(stairWalk.to.id);
        renderStairTravel();
    } else if (!allFloors || simulation || integration) renderPerson();
}

function stackedElevation(floor) {
    const levels = building.floors.map(entry => entry.level);
    return floorStackHeight(floor.level, Math.min(...levels), floorSeparation);
}

function updateSpatialViewport() {
    if (!spaceBounds) return;
    const [left, top, width, height] = spaceBounds;
    const person = currentWalker()?.person;
    const floor = allFloors && spaceFollow && person ? building.floors.find(entry => entry.id === building.activeFloor) : null;
    const [x, y] = spaceFollow && person
        ? projectSpace([person.x, person.y], .45 + (floor ? stackedElevation(floor) : 0), spaceCamera)
        : [left + width / 2, top + height / 2];
    const w = width / spaceZoom, h = height / spaceZoom;
    const viewBox = [x - w / 2, y - h / 2, w, h].join(' ');
    if (space.getAttribute('viewBox') !== viewBox) space.setAttribute('viewBox', viewBox);
    refreshSensorTip();
}

// 3D view choices that each viewer keeps for themselves. The first value is
// the default; storage can be missing, and then a choice lasts until the page closes.
function viewPreference(key, values) {
    try {
        const saved = localStorage.getItem(key);
        return values.includes(saved) ? saved : values[0];
    } catch {
        return values[0];
    }
}

function rememberViewPreference(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Not remembered, see viewPreference.
    }
}

// The wall and light switches live with the other 3D camera controls. They
// are added here rather than in the page markup, so every page that hosts the
// planner gets them.
const viewSwitchIcons = {
    wall_mode: {
        cutaway: 'M3 16h14M4 16V9l6-5 6 5M16 9v7',
        up: 'M3 16h14M4 16V6l6-3 6 3v10M8 16v-4h4v4',
        down: 'M3 16h14M4 16v-3h12v3',
    },
    daylight: {
        studio: 'M10 4v2m0 8v2M4 10h2m8 0h2M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
        morning: 'M3 15h14M6 15a4 4 0 0 1 8 0M10 6v2M5 9l1.4 1.4M15 9l-1.4 1.4',
        midday: 'M10 3v2m0 10v2M3 10h2m10 0h2M5 5l1.4 1.4m7.2 7.2L15 15M5 15l1.4-1.4m7.2-7.2L15 5M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
        evening: 'M3 15h14M6 15a4 4 0 0 1 8 0M8 6l2 2 2-2',
        night: 'M13 4a6 6 0 1 0 3 9 5 5 0 0 1-3-9',
    },
};
const viewSwitches = Object.fromEntries(Object.keys(viewSwitchIcons).map(action => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;
    root.querySelector('.fp-space-controls [data-action="reset_view"]')?.before(button);
    return [action, button];
}));

// Coverage map toggle and legend, next to the coverage switch.
const heatToggle = document.createElement('button');
heatToggle.type = 'button';
heatToggle.className = 'fp-heat-toggle';
heatToggle.dataset.action = 'heatmap';
heatToggle.setAttribute('aria-pressed', 'false');
heatToggle.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h6v6H3zm8 0h6v6h-6zM3 11h6v6H3zm8 0h6v6h-6z"/></svg>${escapeText(copy.heatmap)}`;
root.querySelector('.fp-view-actions [data-action="coverage"]')?.after(heatToggle);
const heatLegend = document.createElement('p');
heatLegend.className = 'fp-heat-legend';
heatLegend.hidden = true;
element('fp-walk-stage')?.append(heatLegend);

// The map only changes when rooms, sensors, furniture or zones do, so it is
// worked out once per change and then reused for every frame.
function heatCells(floorPlan) {
    // The map shows the plan as it is set, not a door a test person happens to hold open.
    const drawn = visiblePlan(floorPlan);
    const furniture = element('fp-include-furniture')?.checked !== false;
    const key = JSON.stringify([drawn.rooms, drawn.sensors, furniture ? drawn.furniture : null, drawn.zones, drawn.doors, drawn.walls]);
    heatCache ??= new Map();
    if (!heatCache.has(key)) {
        if (heatCache.size > 8) heatCache.clear();
        heatCache.set(key, coverageCells(drawn, { furniture }));
    }
    const cells = heatCache.get(key);
    if (floorPlan === plan) {
        const share = coverageSummary(cells);
        heatLegend.innerHTML = ['none', 'one', 'many'].map(level =>
            `<span data-seen="${level}">${escapeText(copy['heatmap_' + level])} ${share[level]}%</span>`).join('');
    }
    return cells;
}

function renderViewSwitches() {
    for (const [action, value] of [['wall_mode', wallMode], ['daylight', daylight]]) {
        viewSwitches[action].innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${viewSwitchIcons[action][value]}"/></svg>${escapeText(copy[action + '_' + value])}`;
    }
}
renderViewSwitches();

function updateSpaceControls() {
    const follow = root.querySelector('[data-action="follow_person"]');
    follow.hidden = !currentWalker() || stairWalk?.crossing != null;
    follow.setAttribute('aria-pressed', String(spaceFollow));
    root.querySelector('[data-action="space_zoom_out"]').disabled = spaceZoom <= 1;
    root.querySelector('[data-action="space_zoom_in"]').disabled = spaceZoom >= 3.2;
    showZoom();
}

function zoomSpace(factor) {
    spaceZoom = Math.max(1, Math.min(3.2, spaceZoom * factor));
    updateSpatialViewport();
    const previousDetail = detailedSpacePeople;
    sizeSpaceLabels();
    if (previousDetail !== detailedSpacePeople) renderPerson();
    updateSpaceControls();
}

const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const wasd = { w: 'ArrowUp', a: 'ArrowLeft', s: 'ArrowDown', d: 'ArrowRight' };
const walkControls = createWalkControls(element('fp-sim-dock'), () => activeWalker, walk, settleWalk, renderPerson);

function renderBeam() {
    const { person = null, readings = [] } = currentWalker() ?? {};
    const seen = choice => readings.find(reading => reading.item.id === choice.item.id)?.signals
        .some(signal => signal.radar === choice.field.radar && signal.seen) ?? false;
    const room = person && plan.rooms.find(room => contains(room, person));
    const focus = beamChoices.find(choice => choice.key === beamChoice)
        ?? beamChoices.find(seen)
        ?? beamChoices.find(choice => room && choice.room.id === room.id)
        ?? beamChoices.find(choice => choice.item.id === selected)
        ?? beamChoices[0];
    const profile = radarProfileFor(person);
    const wall = focus && !focus.field.radii;
    if (coverageEstimateLegend) {
        coverageEstimateLegend.hidden = view === '3d' ? !focus?.field.estimatedHeight
            : !beamChoices.some(choice => choice.field.estimatedHeight);
    }
    const layer = element('fp-cone-space');
    if (view === '3d' && layer) {
        layer.toggleAttribute('data-wall', Boolean(wall));
        const nextDetected = focus && seen(focus) ? focus.key : null;
        const detected = String(nextDetected !== null);
        if (layer.dataset.detected !== detected) layer.dataset.detected = detected;
        if (nextDetected && nextDetected !== detectedBeam) {
            layer.classList.add('fp-beam-pulse');
            layer.addEventListener('animationend', () => layer.classList.remove('fp-beam-pulse'), { once: true });
        }
        detectedBeam = nextDetected;
    }
    const lying = person?.pose === 'lying';
    const key = focus ? `${focus.key}:${focus.field.profiles ? profile + (lying ? ':lying' : '') : ''}` : '';
    if (beamKey === key) return;
    beamKey = key;
    if (view === '2d') {
        const stair = currentStairTrip();
        replaceMapMarkup(drawing, paintPlan(planForDrawing(plan), showCoverage, selected, number,
            focus && { ...focus, profile }, { measures: showMeasures, interactiveSensors: true, radarOptions: coverageRadarOptions,
                casing: Boolean(plan.underlay), motion: Boolean(copy.sim_motion) })
            + (stair ? paintStairPlan(stair.stair, escapeText(copy.staircase), stair.up) : '')
            + (showHeatmap ? paintCoverageHeat(heatCells(plan)) : '') + paintMirrorWedges());
    }
    else if (layer) layer.innerHTML = focus ? paintBeam(focus, spaceCamera, profile) : '';
    const panelKey = `${key}:${beamChoice}`;
    if (beamPanelKey === panelKey) return;
    beamPanelKey = panelKey;
    element('fp-radar-panel').hidden = !focus;
    if (!focus) return;
    const select = element('fp-radar-focus');
    const options = `<option value="">${copy.beam_auto} · ${focus.shortLabel}</option>`
        + beamChoices.map(choice => `<option value="${choice.key}">${escapeText(choice.label)}</option>`).join('');
    if (select.dataset.options !== options) {
        select.innerHTML = options;
        select.dataset.options = options;
    }
    select.value = beamChoice;
    const radii = element('fp-radar-radii');
    radii.hidden = !focus.field.profiles && !wall;
    element('fp-beam-note').textContent = [
        focus.field.profiles && `${copy.beam_radius}.`,
        wall ? copy[view === '3d' ? 'beam_wall_note_3d' : 'beam_wall_note'] : copy.beam_note,
        focus.field.estimatedHeight && copy.height_note,
        focus.field.profiles && lying && copy.beam_lying_note,
    ].filter(Boolean).join(' ');
    if (focus.field.profiles) {
        radii.innerHTML = `<span class="fp-visually-hidden">${copy.beam_radius}</span>` + ceilingProfiles.map(name =>
            `<span class="fp-radar-radius${name === profile ? ' active' : ''}" data-profile="${name}" aria-current="${name === profile}">
                <span><i aria-hidden="true"></i>${copy['beam_' + name]}</span>
                <strong>${focus.field.profiles[name].map(value => number.format(value)).join(' × ')} m</strong>
            </span>`).join('');
    } else if (wall) {
        radii.innerHTML = `<span class="fp-radar-radius active"><span>${copy.beam_wall_range}</span>
            <strong>${number.format(focus.field.range)} m · ±${number.format(focus.field.half)}°</strong></span>`;
    }
}

function renderActivities(camera3D) {
    const activities = autoWalk ? [...autoWalk.routes.values()].map(route => route.playing).filter(Boolean) : [];
    const tests = activities.filter(activity => activity.kind === 'fall' || activity.kind === 'smoke');
    const layer = element(camera3D ? 'fp-activity-space-layer' : 'fp-activity-flat-layer');
    const key = tests.map(({ kind, name, started, checked, detected, smokePhase }) => [kind, name, started, checked, detected, smokePhase].join(':')).join('/');
    if (layer && layer.dataset.effects !== key) {
        layer.dataset.effects = key;
        const now = performance.now();
        layer.innerHTML = tests.map(activity => paintActivityEffect(activity, camera3D, now)).join('');
    }
    const current = activities.find(activity => activity.detected)
        ?? activities.find(activity => activity.name === activeWalker) ?? activities[0];
    const status = element('fp-sim-activity');
    const suffix = current?.detected ? '_detected' : current?.checked ? '_undetected'
        : current?.smokePhase === 'start' ? '_start' : current?.smokePhase === 'fire' ? '_fire' : '';
    const label = current ? copy['sim_activity_' + current.kind + suffix]
        .replace(':person', copy['sim_' + current.name]).replace(':room', current.room.name) : '';
    if (status.textContent !== label) status.textContent = label;
    if (status.dataset.alarm !== String(Boolean(current?.detected))) status.dataset.alarm = String(Boolean(current?.detected));
    return new Set(tests.filter(activity => activity.detected).map(activity => activity.detector.item.id));
}

function renderPerson() {
    if (integration && !simulation) {
        if (!allFloors) renderBeam();
        integration.sceneChanged?.();
        const layer = element(view === '3d' ? 'fp-person-space-layer' : 'fp-person-flat');
        if (!layer) return;
        const floors = projectFloors();
        const active = floors.find(floor => floor.id === (building?.activeFloor ?? 'ground'));
        const camera = view === '3d' ? spaceCamera : null;
        const figures = (allFloors ? floors : active ? [active] : []).flatMap(floor =>
            liveFloorFigures(livePeople, floor.plan.rooms).map(person => ({ ...person, elevation: allFloors ? stackedElevation(floor) : 0, plumbob: 'clear' })));
        layer.innerHTML = figures.map(person => `<g data-live-person="" pointer-events="none">${paintPerson(person, camera, !reducedMotion.matches, detailedSpacePeople)}</g>`).join('');
        if (camera) fadeLabelsNear(space, figures.map(figure => projectedFigure(figure, camera, screenOffset(layer, space))));
        return;
    }
    if (stairWalk?.crossing != null) {
        renderStairTravel();
        return;
    }
    updateStairPrompt();
    if (!allFloors) renderBeam();
    const layer = element(view === '3d' ? 'fp-person-space-layer' : 'fp-person-flat');
    const walker = currentWalker();
    const camera3D = view === '3d' ? spaceCamera : null;
    const alarms = renderActivities(camera3D);
    if (!simulation || !walker) {
        layer?.replaceChildren();
        if (camera3D) fadeLabelsNear(space, []);
        return;
    }

    const { person, route, readings } = walker;
    if (layer) {
        const floors = allFloors ? building.floors : [];
        const origin = allFloors ? stackedElevation(floors.find(floor => floor.id === walkFloorId())) : 0;
        const figures = (allFloors ? Object.entries(walkers).filter(([, walker]) => walker) : walkersOnFloor())
            .map(([name, walker]) => {
                const floor = floors.find(floor => floor.id === walker.floorId);
                return walkFigure(name, walker, floor ? stackedElevation(floor) - origin : 0);
            });
        const trail = element('fp-stacked-walk-lines');
        const lines = paintWalkLines(person, route, readings, camera3D);
        if (trail) trail.innerHTML = lines;
        layer.innerHTML = (trail ? '' : lines) + paintWalkers(figures, camera3D);
        if (camera3D) fadeLabelsNear(space, figures.map(figure => projectedFigure(figure, camera3D, screenOffset(layer, space))));
    }
    if (view === '3d' && spaceFollow) updateSpatialViewport();
    const room = plan.rooms.find(room => contains(room, person));
    const seen = new Set(readings.filter(reading => reading.seen).map(reading => reading.item.id));
    const obstacles = new Map();
    for (const { obstacle } of readings) {
        if (obstacle && obstacles.get(obstacle.id) !== 'blocked') obstacles.set(obstacle.id, obstacle.status);
    }
    const map = view === '3d' ? space : drawing;
    const activeScene = allFloors ? map.querySelector('[data-sim-floor]') : map;
    activeScene?.querySelectorAll('[data-furniture-id]').forEach(item => {
        const effect = obstacles.get(item.dataset.furnitureId);
        if (effect) item.dataset.occlusion = effect;
        else item.removeAttribute('data-occlusion');
    });
    activeScene?.querySelectorAll(view === '3d' ? '.fp-space-marker' : '.fp-sensor').forEach(marker => {
        marker.classList.toggle('fp-sim-seen', seen.has(marker.dataset.item));
        marker.classList.toggle('fp-sim-alarm', alarms.has(marker.dataset.item));
    });
    if (allFloors) {
        activeScene?.querySelectorAll('.fp-stack-beam, .fp-wall-fan[data-plane="floor"]').forEach(field => {
            const reading = readings.find(entry => entry.item.id === field.dataset.sensor);
            field.toggleAttribute('data-detected', Boolean(reading?.signals.some(signal =>
                signal.seen && (!field.dataset.radar || signal.radar === field.dataset.radar))));
        });
    }
    const count = copy.sim_count.replace(':seen', number.format(seen.size)).replace(':total', number.format(readings.length));
    const affected = readings.filter(reading => reading.obstacle).length;
    const extra = affected ? ' · ' + copy.sim_risk_count.replace(':count', number.format(affected)) : '';
    const floorLabelText = allFloors ? floorLabel(building.floors.find(floor => floor.id === building.activeFloor), copy) + ' · ' : '';
    const summary = (walkers.woman || walkers.child ? `${copy['sim_' + activeWalker]} · ` : '')
        + floorLabelText + (room ? `${room.name} · ${count}` : count) + extra;
    const status = element('fp-sim-summary');
    if (status.textContent !== summary) status.textContent = summary;
    const roomLabel = room?.name ?? copy.sim_outside_rooms;
    const floor = building?.floors.find(floor => floor.id === walkFloorId());
    const levelLabel = floor ? floorLabel(floor, copy) : '';
    const metric = readings.length ? copy.sim_count_short.replace(':seen', number.format(seen.size))
        .replace(':total', number.format(readings.length)) : copy.sim_no_sensors_short;
    const readingLabel = copy.sim_view_readings + ' · ' + metric + (readings.length ? ' ' + copy.sim_detecting_sensors : '');
    if (element('fp-sim-room-label').textContent !== roomLabel) element('fp-sim-room-label').textContent = roomLabel;
    if (element('fp-sim-floor-label').textContent !== levelLabel) element('fp-sim-floor-label').textContent = levelLabel;
    element('fp-sim-floor-label').hidden = !levelLabel;
    if (element('fp-sim-count').textContent !== metric) element('fp-sim-count').textContent = metric;
    element('fp-sim-detect-label').hidden = !readings.length;
    if (simReading.getAttribute('aria-label') !== readingLabel) simReading.setAttribute('aria-label', readingLabel);
    const roomSelect = element('fp-sim-room');
    if (roomSelect.value !== room?.id) roomSelect.value = room?.id ?? '';
    const position = element('fp-sim-position');
    const tracked = room && readings.some(reading => reading.signals.some(signal => signal.seen && signal.mode !== 'presence'));
    position.hidden = !tracked;
    if (tracked) {
        const coordinates = copy.sim_room_position.replace(':x', tenth.format(person.x - room.x))
            .replace(':y', tenth.format(person.y - room.y));
        if (position.textContent !== coordinates) position.textContent = coordinates;
    }
    const distance = element('fp-route-distance');
    const distanceLabel = route.distance ? copy.sim_route_distance.replace(':covered', tenth.format(route.covered))
        .replace(':total', tenth.format(route.distance)) : copy.sim_route_empty;
    const routeLabel = route.uncertain > .049 ? distanceLabel + ' · ' + copy.sim_risk_route.replace(':distance', tenth.format(route.uncertain)) : distanceLabel;
    if (distance.textContent !== routeLabel) distance.textContent = routeLabel;
    const fill = element('fp-route-fill');
    fill.parentElement.hidden = !route.distance;
    fill.style.width = route.distance ? `${Math.min(100, route.covered / route.distance * 100)}%` : '';
    root.querySelector('[data-action="clear_walk"]').disabled = !route.distance;
    root.querySelectorAll('[data-person-pose]').forEach(button => {
        const pressed = String(button.dataset.personPose === person.pose);
        if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
    });
    const profile = radarProfileFor(person);
    const key = person.pose + ':' + profile + ':' + readings.map(reading => reading.signals.map(signal =>
        signal.obstacle ? signal.obstacle.id + signal.obstacle.status : signal.exclusion?.id ?? Number(signal.seen)).join(',')
        + (reading.motion ? `,${Number(reading.motion.seen)}${Number(reading.motion.still)}` : '')).join('/');
    if (readingKey === key) return;
    readingKey = key;
    element('fp-sim-sensors').innerHTML = readings.map(({ item, index, room: home, signals, motion, seen, obstacle }) => `<li>
        <div class="fp-sim-device"><span class="fp-index ${devices[item.model].mount}">${String(index + 1).padStart(2, '0')}</span>
            <strong>${devices[item.model].name}</strong><span class="fp-sim-light" data-seen="${seen}" aria-hidden="true"></span></div>
        ${signals.length ? signals.map(signal => `<div class="fp-sim-signal">
            <span>${signal.radar.toUpperCase()} · ${signal.profiles ? copy['beam_' + (person.pose === 'lying' ? 'lying' : profile)] : copy['sim_' + signal.mode]}</span>
            <span data-seen="${signal.seen}" data-status="${signal.obstacle?.status ?? ''}">${signal.obstacle ? copy['sim_' + signal.obstacle.status] : signal.exclusion ? copy.sim_excluded : signal.seen ? copy.sim_seen : copy.sim_missed}</span>
        </div>${signal.height === null ? '' : `<p class="fp-sim-height">Z · ${copy['sim_' + person.pose]} · ${copy.sim_height.replace(':height', number.format(signal.height))}</p>`}`).join('')
            : `<p class="fp-note">${escapeText(String(sensorNote(item, home) || copy.sim_no_profile))}</p>`}
        ${signals.some(signal => signal.estimatedHeight) ? `<p class="fp-note fp-sim-estimate">${escapeText(coverageEstimateLabel)}</p>` : ''}
        ${motion && copy.sim_motion ? `<div class="fp-sim-signal fp-sim-motion"><span>PIR · ${copy.sim_motion}</span>
            <span data-seen="${motion.seen}">${motion.seen ? copy.sim_seen : motion.still ? copy.sim_still : copy.sim_missed}</span></div>` : ''}
        ${obstacle ? `<p class="fp-obstacle-name" data-status="${obstacle.status}">${escapeText(obstacle.name)}</p>` : ''}
    </li>`).join('') || `<li class="fp-note">${copy.sim_empty}</li>`;
}

function walkFigure(name, walker, offset = 0) {
    const active = name === activeWalker;
    return { ...walker.person, active, elevation: (walker.person.elevation ?? 0) + offset,
        plumbob: active && walker.readings?.length ? routeCoverage(walker.readings) : undefined };
}

// Where a figure stands and where its head is, on screen, for label fading.
function projectedFigure({ x, y, elevation = 0 }, camera, offset = 0) {
    const [screenX, foot] = projectSpace([x, y], elevation, camera);
    return { x: screenX, foot: foot + offset, head: projectSpace([x, y], elevation + 1.8, camera)[1] + offset };
}

function paintWalkers(figures, camera3D, occlusion = null) {
    if (camera3D) {
        const depth = ({ x, y, elevation }) => projectSpace([x, y], elevation ?? 0, camera3D)[1];
        figures.sort((a, b) => depth(a) - depth(b));
    }
    return figures.map(figure => paintPerson(figure, camera3D, !reducedMotion.matches, detailedSpacePeople,
        occlusion)).join('');
}

function prepareWalkFloor() {
    const trip = currentStairTrip();
    walkWalls = [...solidWalls(plan), ...(trip ? stairWalls(trip.stair) : [])];
    walkSensors = preparePersonSensors(planForDrawing(plan));
    walkFurniture = element('fp-include-furniture').checked ? prepareFurnitureOcclusion(plan.furniture) : [];
    const hasRooms = Boolean(plan.rooms.length);
    element('fp-sim-room').innerHTML = plan.rooms.map(room =>
        `<option value="${room.id}">${escapeText(room.name)}</option>`).join('');
    element('fp-sim-summary').textContent = hasRooms ? '' : copy.sim_need_room;
    element('fp-sim-room-label').textContent = hasRooms ? '' : copy.sim_need_room;
    element('fp-sim-floor-label').hidden = true;
    element('fp-sim-instructions').hidden = !hasRooms;
    element('fp-sim-sensors').hidden = !hasRooms;
    element('fp-sim-position').hidden = true;
    element('fp-route-summary').hidden = !hasRooms;
    element('fp-sim-room').disabled = !hasRooms;
    simReading.hidden = !hasRooms;
}

function loadWalkFloor(id) {
    readProject({ ...projectDocument(), activeFloor: id });
    closeSensorTip();
    selected = plan.sensors[0]?.id;
    beamChoice = '';
    detectedBeam = null;
    readingKey = null;
    prepareWalkFloor();
    for (const [, walker] of walkersOnFloor()) {
        walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
    }
}

function focusWalkMap() {
    const map = view === '2d' ? board : stage;
    if (document.activeElement !== map) map.focus({ preventScroll: true });
}

function setSimulation(active) {
    if (integration && !appPlanner && active) return;
    stopStairWalk();
    stopAutoWalk();
    walkControls.stop();
    simulation = active;
    if (active) reviewedCoverage = false;
    root.toggleAttribute('data-simulation', active);
    if (active && appPlanner) integration.sceneChanged?.();
    testStep.setAttribute('aria-pressed', String(active));
    if (active) roomFormOpen = false;
    element('fp-simulation').hidden = !active;
    simGuide.hidden = !active;
    simMenus.forEach(menu => { menu.open = false; });
    if (active) element('fp-sim-exit').append(testStep);
    else orderStep.before(testStep);
    for (const name of Object.keys(walkers)) walkers[name] = null;
    activeWalker = 'man';
    readingKey = null;
    if (active) {
        root.removeAttribute('data-panel');
        const room = currentRoom() ?? plan.rooms[0];
        closeLibrary(false);
        setTool('edit');
        cursor = null;
        updateCursor();
        prepareWalkFloor();
        if (room) walkers.man = startWalker(stairSafeStart(currentStairTrip(), personAt(room)), 'man');
    } else {
        if (spaceFollow) {
            spaceFollow = false;
            spaceZoom = 1;
        }
        walkWalls = [];
        walkSensors = [];
        walkFurniture = [];
        element('fp-person-flat').replaceChildren();
    }
    updateWalkerControls();
    root.querySelectorAll('[data-walk-legend]').forEach(label => { label.hidden = !currentWalker(); });
    element('fp-sim-dock').hidden = !currentWalker();
    renderDrawing();
    if (active && currentWalker() && view === '2d') fit();
    updateTools();
    if (active) focusWalkMap();
}

function startWalker(position, avatar) {
    const person = { ...position, avatar, moving: false, stride: 0 };
    return { person, floorId: walkFloorId(), route: emptyRoute(), readings: personSignals(plan, person, walkSensors, walkFurniture, walkSightNow({ name: avatar, person })) };
}

function updateWalkerControls() {
    const multiple = Boolean(walkers.woman || walkers.child);
    element('fp-sim-people').hidden = !walkers.man;
    simTools.hidden = !walkers.man;
    element('fp-sim-dual-note').hidden = !multiple;
    simCast.querySelectorAll('[data-toggle-walker]').forEach(button => {
        const name = button.dataset.toggleWalker;
        const present = Boolean(walkers[name]);
        button.toggleAttribute('data-present', present);
        button.querySelector('span').textContent = copy[(present ? 'sim_remove_' : 'sim_add_') + name];
    });
    root.querySelectorAll('[data-walker]').forEach(button => {
        button.hidden = !walkers[button.dataset.walker];
        button.setAttribute('aria-pressed', String(button.dataset.walker === activeWalker));
    });
    updateStairControls();
}

function selectWalker(name) {
    const walker = walkers[name];
    if (!walker) return;
    walkControls.stop();
    if (name !== activeWalker) stopStairWalk();
    const changedFloor = walker.floorId !== walkFloorId();
    if (changedFloor) stopAutoWalk();
    activeWalker = name;
    readingKey = null;
    if (changedFloor) loadWalkFloor(walker.floorId);
    updateWalkerControls();
    if (changedFloor) {
        finish();
        if (view === '2d') fit();
    } else renderPerson();
}

function restartWalk(position) {
    const stair = currentStairTrip()?.stair;
    if (stair && insideStairwell(stair, position)) return;
    stopStairWalk();
    stopAutoWalk();
    walkControls.stop();
    const { person } = currentWalker();
    walkers[activeWalker] = startWalker({ ...person, x: position.x, y: position.y }, activeWalker);
    renderPerson();
}

function toggleWalker(name) {
    if (!currentWalker() || stairWalk?.crossing != null) return;
    simCast.open = false;
    stopStairWalk();
    stopAutoWalk();
    walkControls.stop();
    if (walkers[name]) {
        walkers[name] = null;
        const next = name === activeWalker ? walkersOnFloor()[0]?.[0] ?? 'man' : activeWalker;
        selectWalker(next);
        simCast.querySelector('summary').focus({ preventScroll: true });
        return;
    }
    const { person } = currentWalker();
    const room = plan.rooms.find(room => contains(room, person));
    const rooms = room ? [room] : plan.rooms;
    const stair = currentStairTrip()?.stair;
    const neighbours = walkersOnFloor().map(([, walker]) => walker.person);
    let position = person;
    search: for (const distance of [1, .68, .4, .22]) {
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0], [.71, -.71], [.71, .71], [-.71, .71], [-.71, -.71]]) {
            const candidate = movePerson(rooms, walkWalls, person, dx * distance, dy * distance);
            if (candidate === person || (stair && insideStairwell(stair, candidate))) continue;
            if (position === person) position = candidate;
            if (neighbours.every(other => Math.hypot(other.x - candidate.x, other.y - candidate.y) > .55)) {
                position = candidate;
                break search;
            }
        }
    }
    walkers[name] = startWalker({ ...position, heading: person.heading, pose: 'standing' }, name);
    selectWalker(name);
    focusWalkMap();
}

function walk(name, x, y, distance) {
    if (stairWalk) return false;
    stopAutoWalk();
    let dx = x, dy = y;
    if (view === '3d') {
        const [worldX, worldY] = unprojectFloor([x, y], spaceCamera);
        const length = Math.hypot(worldX, worldY);
        [dx, dy] = [worldX / length, worldY / length];
    }
    return advanceWalker(name, dx, dy, distance, true);
}

function advanceWalker(name, dx, dy, distance, slide = false) {
    const walker = walkers[name];
    if (walker?.floorId !== walkFloorId()) return false;
    const { person, route, readings } = walker;
    const step = (x, y) => movePerson(plan.rooms, walkWalls, person, x * distance, y * distance);
    let next = step(dx, dy);
    if (next === person && slide && dx && dy) {
        next = step(dx, 0);
        if (next === person) next = step(0, dy);
    }
    if (next === person) {
        return settleWalk(name);
    }
    const before = person;
    const hadCoverage = routeCoverage(before.moving ? readings
        : personSignals(plan, { ...before, moving: true }, walkSensors, walkFurniture, walkSightNow()));
    const stride = ((before.stride ?? 0) + Math.hypot(next.x - before.x, next.y - before.y)) % 1.1;
    walker.person = { ...next, pose: 'standing', moving: true, stride };
    walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
    recordWalk(route, before, walker.person, hadCoverage, routeCoverage(walker.readings));
    if (view === '2d' && (name === activeWalker || !currentWalker().person.moving)) {
        const { x, y, width, height } = canvas.viewBox.baseVal;
        if (next.x < x + .35 || next.x > x + width - .35 || next.y < y + .35 || next.y > y + height - .35) {
            camera.x = next.x;
            camera.y = next.y;
            updateView();
        }
    }
    return true;
}

function settleWalk(name) {
    const walker = walkers[name];
    if (walker?.floorId !== walkFloorId() || !walker.person.moving) return false;
    walker.person.moving = false;
    walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
    return true;
}

function updateAutoWalkStatus(message = '') {
    const button = root.querySelector('[data-action="auto_walk"]');
    const pressed = String(Boolean((autoWalk && !autoWalk.test) || stairWalk?.repeat));
    if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
    button.querySelector('span').textContent = copy[pressed === 'true' ? 'sim_auto_stop' : 'sim_auto'];
    for (const test of root.querySelectorAll('[data-activity-test]')) {
        const kind = test.dataset.activityTest;
        const active = autoWalk?.test === kind;
        test.setAttribute('aria-pressed', String(active));
        test.querySelector('span').textContent = copy[active ? 'sim_test_stop_' + kind : 'sim_test_' + kind];
    }
    const status = element('fp-sim-auto-status');
    if (status.textContent !== message) status.textContent = message;
    element('fp-sim-instructions').hidden = Boolean(autoWalk || stairWalk) || !currentWalker();
}

function stopAutoWalk() {
    if (!autoWalk) {
        if (element('fp-sim-auto-status').textContent) updateAutoWalkStatus();
        return;
    }
    cancelAnimationFrame(autoWalkFrame);
    closeSmokeTestAudio();
    autoWalkFrame = 0;
    for (const [name, route] of autoWalk.routes) finishWalkActivity(name, route);
    autoWalk = null;
    updateAutoWalkStatus();
    Object.keys(walkers).forEach(settleWalk);
    renderPerson();
}

function updateStairControls() {
    const travelling = Boolean(stairWalk);
    const stairs = root.querySelector('[data-action="take_stairs"]');
    stairs.hidden = !simulation || !currentWalker() || travelling || !currentStairTrip();
    stairs.querySelector('span').textContent = copy[walkersOnFloor().length > 1 ? 'sim_stair_take_group' : 'sim_stair_take'];
    root.querySelector('[data-action="stop_stairs"]').hidden = !travelling;
    simGuide.toggleAttribute('data-stair-travel', travelling);
    if (travelling) simMenus.forEach(menu => { menu.open = false; });
    updateStairPrompt();
}

function highlightStairFloor(id) {
    root.toggleAttribute('data-stair-preview', Boolean(id && (allFloors || stairWalk?.crossing != null)));
    for (const floor of space.querySelectorAll('[data-building-floor]')) {
        floor.toggleAttribute('data-stair-target', floor.dataset.buildingFloor === id);
    }
}

function updateStairPrompt() {
    const walker = currentWalker();
    const trip = simulation && walker && !autoWalk && !stairWalk ? currentStairTrip() : null;
    let show = false;
    if (trip) {
        const landing = trip.up ? trip.stair.bottom : trip.stair.top;
        const distance = Math.hypot(walker.person.x - landing.x, walker.person.y - landing.y);
        if (distance > .95) walker.dismissStairPrompt = false;
        const samePrompt = !stairPrompt.hidden && stairPrompt.dataset.walker === activeWalker
            && stairPrompt.dataset.target === trip.to.id;
        show = !walker.dismissStairPrompt && distance <= (samePrompt ? .95 : .75);
    }
    stairPrompt.hidden = !show;
    if (show) {
        const direction = trip.up ? 'up' : 'down';
        const question = copy.sim_stair_destination.replace(':floor', floorLabel(trip.to, copy));
        if (element('fp-stair-question').textContent !== question) element('fp-stair-question').textContent = question;
        const confirmLabel = copy['sim_stair_go_' + direction];
        if (element('fp-stair-confirm-label').textContent !== confirmLabel) element('fp-stair-confirm-label').textContent = confirmLabel;
        stairPrompt.dataset.direction = direction;
        stairPrompt.dataset.walker = activeWalker;
        stairPrompt.dataset.target = trip.to.id;
    }
    if (allFloors || root.hasAttribute('data-stair-preview') || stairWalk?.crossing != null) {
        highlightStairFloor(stairWalk?.to.id ?? (show ? trip.to.id : null));
    }
}

function stopStairWalk() {
    if (!stairWalk) return;
    const { returnView } = stairWalk;
    cancelAnimationFrame(stairFrame);
    stairWalk = null;
    root.removeAttribute('data-stair-crossing');
    Object.keys(walkers).forEach(settleWalk);
    updateStairControls();
    updateAutoWalkStatus();
    if (!allFloors && view !== returnView) setView(returnView);
    else renderDrawing();
}

function startStairWalk(repeat = false, only = null) {
    const trip = currentStairTrip();
    if (!trip || !currentWalker() || stairWalk) return false;
    const { to, up, stair } = trip;
    const approach = createWalkNetwork(plan, walkWalls);
    const arrival = createWalkNetwork(to.plan, [...solidWalls(to.plan), ...stairWalls(stair)]);
    const routes = [];
    const group = walkersOnFloor().filter(([name]) => !only || only === name);
    for (const [index, [name, walker]] of group.entries()) {
        const lane = group.length === 1 ? 0 : (2 * index / (group.length - 1) - 1) * .21 * stair.width;
        const entry = stairPoint(stair, up ? 0 : 1, lane);
        const exit = stairPoint(stair, up ? 1 : 0, lane);
        const start = approach.startAt(walker.person);
        const points = start && approach.routeTo(start, entry);
        if (!points || !arrival.clear(exit, exit) || !arrival.startAt(exit)) {
            if (!repeat) updateAutoWalkStatus(copy.sim_stair_blocked);
            return false;
        }
        routes.push({ name, lane, start, points, exit });
    }
    stopAutoWalk();
    walkControls.stop();
    routes.forEach(({ name, start }) => {
        const { person } = walkers[name];
        if (start !== person) walkers[name] = startWalker({ ...person, x: start.x, y: start.y }, name);
    });
    stairWalk = { ...trip, routes, repeat, returnView: view, time: performance.now(), crossing: null, elapsed: 0,
        duration: reducedMotion.matches ? 260 : stairGaitDuration(up), turn: reducedMotion.matches ? 0 : 190,
        delay: reducedMotion.matches ? 0 : 690 };
    updateStairControls();
    updateAutoWalkStatus(copy.sim_stair_travel.replace(':floor', floorLabel(to, copy)));
    stairFrame = requestAnimationFrame(tickStairWalk);
    return true;
}

function renderStairTravel() {
    const layer = element('fp-person-space-layer');
    if (!layer) return;
    const { from, to, up, stair, routes, elapsed, duration, delay, turn } = stairWalk;
    const low = stackedElevation(up ? from : to);
    const high = stackedElevation(up ? to : from);
    const heading = stairHeading(stair, up);
    const figures = routes.map(({ name, lane, entryHeading }, index) => {
        const time = elapsed - index * delay;
        const progress = Math.max(0, Math.min(1, (time - turn) / duration));
        const rotation = ((heading - entryHeading + 540) % 360) - 180;
        const turning = turn ? Math.max(0, Math.min(1, time / turn)) : 1;
        const gait = stairGait(stair, progress, high - low, up, lane);
        return { ...gait, avatar: name, active: name === activeWalker, elevation: low + gait.elevation,
            pose: 'standing', heading: entryHeading + rotation * turning * turning * (3 - 2 * turning) };
    });
    const waiting = [];
    for (const [name, walker] of Object.entries(walkers)) {
        if (!walker || routes.some(route => route.name === name)) continue;
        const floor = building.floors.find(floor => floor.id === walker.floorId);
        if (floor) waiting.push(walkFigure(name, walker, stackedElevation(floor)));
    }
    const stairLayer = space.querySelector('[data-stair-walkers]');
    if (stairLayer) {
        stairLayer.innerHTML = paintWalkers(figures, spaceCamera, { id: stairOcclusionId(stair), height: high });
        layer.innerHTML = paintWalkers(waiting, spaceCamera);
    } else layer.innerHTML = paintWalkers([...figures, ...waiting], spaceCamera);
}

function tickStairWalk(now) {
    const travel = stairWalk;
    const { routes } = travel;
    if (travel.crossing !== null) {
        travel.elapsed = now - travel.crossing;
        if (travel.elapsed >= travel.turn + travel.duration + (routes.length - 1) * travel.delay) {
            stairWalk = null;
            root.removeAttribute('data-stair-crossing');
            loadWalkFloor(travel.to.id);
            const heading = stairHeading(travel.stair, travel.up);
            for (const { name, exit } of routes) {
                walkers[name] = startWalker({ ...exit, pose: 'standing', heading }, name);
                walkers[name].dismissStairPrompt = true;
            }
            if (!allFloors && view !== travel.returnView) setView(travel.returnView);
            updateWalkerControls();
            updateAutoWalkStatus();
            finish();
            if (view === '2d') fit();
            if (document.activeElement === stage || document.activeElement === board || document.activeElement === document.body) focusWalkMap();
            if (travel.repeat) startAutoWalk();
            return;
        }
        renderStairTravel();
    } else {
        const step = Math.min(.05, Math.max(0, (now - travel.time) / 1000)) * 1.35;
        travel.time = now;
        for (const { name, points } of routes) {
            if (!points.length || !step) continue;
            const { person } = walkers[name];
            const dx = points[0].x - person.x, dy = points[0].y - person.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 1e-7) {
                advanceWalker(name, dx / distance, dy / distance, Math.min(step, distance));
                if (walkers[name].person === person) {
                    stopStairWalk();
                    updateAutoWalkStatus(copy.sim_stair_blocked);
                    return;
                }
            }
            if (distance <= step) points.shift();
        }
        if (routes.every(route => !route.points.length)) {
            for (const route of routes) route.entryHeading = walkers[route.name].person.heading;
            travel.crossing = now;
            spaceFollow = false;
            spaceZoom = 1;
            root.setAttribute('data-stair-crossing', '');
            updateStairControls();
            if (view === '3d') renderSpatialDrawing();
            else setView('3d');
        } else renderPerson();
    }
    stairFrame = requestAnimationFrame(tickStairWalk);
}

function startAutoWalk() {
    if (!currentWalker()) return;
    walkControls.stop();
    const network = createWalkNetwork(plan, walkWalls);
    const chooseActivity = createWalkActivities(plan, walkWalls, walkSensors, walkFurniture, network);
    const routes = new Map();
    let relocated = false;
    autoWalk = { network, chooseActivity, routes, time: performance.now(),
        stairsAt: currentStairTrip() ? performance.now() + 11_000 : null };
    for (const [name, walker] of walkersOnFloor()) {
        const { person } = walker;
        const point = network.startAt(person);
        if (!point) continue;
        const queue = name === activeWalker ? ['seat', 'fall', 'bed'] : ['bed', 'seat'];
        const route = { points: [], pause: 0, next: null, playing: null, queue };
        if (!planAutoRoute(route, point)) continue;
        if (point !== person) {
            walkers[name] = startWalker({ ...person, x: point.x, y: point.y }, name);
            relocated = true;
        }
        routes.set(name, route);
    }
    if (!routes.size) {
        autoWalk = null;
        updateAutoWalkStatus(copy.sim_auto_blocked);
        return;
    }
    autoWalk.time = performance.now();
    const partial = routes.size < walkersOnFloor().length;
    updateAutoWalkStatus(partial ? copy.sim_auto_partial : relocated ? copy.sim_auto_repositioned : copy.sim_auto_active);
    renderPerson();
    autoWalkFrame = requestAnimationFrame(tickAutoWalk);
}

let smokeTestAudio = null;

function playSmokeAlarm() {
    const audio = smokeTestAudio;
    if (audio?.state !== 'running') return;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    const start = audio.currentTime + .025;
    tone.frequency.value = 880;
    volume.gain.value = 0;
    tone.connect(volume).connect(audio.destination);
    for (let index = 0; index < 3; index++) {
        const at = start + index * .31;
        volume.gain.setValueAtTime(0, at);
        volume.gain.linearRampToValueAtTime(.075, at + .025);
        volume.gain.setValueAtTime(.075, at + .13);
        volume.gain.linearRampToValueAtTime(0, at + .19);
    }
    tone.start(start);
    tone.stop(start + .83);
    tone.onended = () => {
        tone.disconnect();
        volume.disconnect();
    };
}

function closeSmokeTestAudio() {
    if (!smokeTestAudio) return;
    void smokeTestAudio.close().catch(() => {});
    smokeTestAudio = null;
}

function startWalkTest(kind) {
    const wasRunning = autoWalk?.test === kind;
    stopStairWalk();
    stopAutoWalk();
    if (wasRunning || !currentWalker()) return;
    walkControls.stop();
    const { person } = currentWalker();
    const room = plan.rooms.find(room => contains(room, person));
    if (!room) return;
    const network = createWalkNetwork(plan, walkWalls);
    const chooseActivity = createWalkActivities(plan, walkWalls, walkSensors, walkFurniture, network);
    const point = network.startAt(person);
    const activity = point && chooseActivity(kind, point, new Set(), room);
    if (!activity) {
        updateAutoWalkStatus(copy['sim_test_no_place_' + kind]);
        return;
    }
    if (kind === 'smoke' && activity.detector && window.AudioContext) {
        try {
            smokeTestAudio = new AudioContext();
            void smokeTestAudio.resume().catch(() => {});
        } catch {
            smokeTestAudio = null;
        }
    }
    if (point !== person) walkers[activeWalker] = startWalker({ ...person, x: point.x, y: point.y }, activeWalker);
    const route = { points: activity.points, pause: 0, next: activity, playing: null };
    autoWalk = { test: kind, routes: new Map([[activeWalker, route]]), time: performance.now() };
    updateAutoWalkStatus(copy['sim_test_start_' + kind].replace(':room', room.name));
    renderPerson();
    autoWalkFrame = requestAnimationFrame(tickAutoWalk);
}

function planAutoRoute(route, person) {
    const { network, chooseActivity, routes } = autoWalk;
    const occupied = new Set([...routes.values()].map(other => (other.playing ?? other.next)?.item?.id).filter(Boolean));
    const pending = route.queue.length;
    for (let index = 0; index < pending; index++) {
        const kind = route.queue.shift();
        const next = chooseActivity(kind, person, occupied);
        if (!next) {
            if (occupied.size && (kind === 'seat' || kind === 'bed')) route.queue.push(kind);
            continue;
        }
        route.next = next;
        route.points = next.points;
        return true;
    }
    route.points = network.routeFrom(person);
    return Boolean(route.points.length);
}

function beginWalkActivity(name, route, now) {
    const walker = walkers[name];
    const activity = route.next;
    route.next = null;
    if (!activity) {
        route.pause = now + 480;
        return settleWalk(name);
    }
    const before = { ...walker.person, pose: 'standing', moving: false };
    const pose = activity.kind === 'seat' ? 'sitting' : activity.kind === 'bed' ? 'lying' : 'standing';
    walker.person = { ...before, ...activity.point, heading: activity.heading, moving: false,
        pose, elevation: activity.elevation, activity: activity.kind };
    walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
    route.playing = { ...activity, before, name, started: now };
    updateWalkTest(walker, route.playing, now);
    if (autoWalk.test) updateAutoWalkStatus('');
    route.pause = now + activityDuration[activity.kind];
    return true;
}

function updateWalkTest(walker, activity, now) {
    if (!activity || !['smoke', 'fall'].includes(activity.kind)) return false;
    const elapsed = now - activity.started;
    const phase = walkTestPhase(activity.kind, elapsed, reducedMotion.matches);
    if (activity.kind === 'smoke') {
        const changed = activity.smokePhase !== phase.smokePhase;
        if (!changed && (reducedMotion.matches || now - activity.lastFrame < 40)) return false;
        activity.lastFrame = now;
        activity.smokePhase = phase.smokePhase;
        walker.person.smokePhase = phase.smokePhase;
        walker.person.smokeTime = elapsed / 1000;
        if (phase.checked && !activity.checked) {
            activity.checked = true;
            activity.detected = Boolean(activity.detector);
            if (activity.detected) playSmokeAlarm();
        }
        return true;
    }
    if (activity.checked) return false;
    walker.person.fallProgress = phase.fallProgress;
    if (phase.checked) walker.person.pose = 'lying';
    walker.readings = personSignals(plan, walker.person, walkSensors, walkFurniture, walkSightNow());
    if (phase.checked) {
        activity.detector = walker.readings.find(reading =>
            reading.signals.some(signal => signal.radar === 'ld6002b' && signal.seen));
        activity.checked = true;
        activity.detected = Boolean(activity.detector);
    }
    return true;
}

function finishWalkActivity(name, route) {
    if (!route.playing) return false;
    walkers[name].person = route.playing.before;
    walkers[name].readings = personSignals(plan, walkers[name].person, walkSensors, walkFurniture, walkSightNow());
    route.playing = null;
    return true;
}

function tickAutoWalk(now) {
    const { routes, time, test } = autoWalk;
    if (autoWalk.stairsAt && now >= autoWalk.stairsAt && [...routes.values()].every(route => !route.playing)) {
        autoWalk.stairsAt = null;
        if (startStairWalk(true)) return;
    }
    const step = Math.min(.05, Math.max(0, (now - time) / 1000)) * 1.2;
    autoWalk.time = now;
    let changed = false;
    let completed = false;
    for (const [name, route] of routes) {
        if (updateWalkTest(walkers[name], route.playing, now)) changed = true;
        if (!step || route.pause > now) continue;
        if (finishWalkActivity(name, route)) {
            changed = true;
            if (test) {
                routes.delete(name);
                completed = true;
                continue;
            }
        }
        const { person } = walkers[name];
        if (!route.points.length && (test || !planAutoRoute(route, person))) {
            routes.delete(name);
            continue;
        }
        const target = route.points[0];
        if (!target) {
            routes.delete(name);
            continue;
        }
        const x = target.x - person.x, y = target.y - person.y;
        const gap = Math.hypot(x, y);
        if (gap > 1e-7) {
            if (advanceWalker(name, x / gap, y / gap, Math.min(step, gap))) changed = true;
            if (person === walkers[name].person) {
                routes.delete(name);
                continue;
            }
        }
        if (gap <= step) {
            route.points.shift();
            if (!route.points.length) {
                if (beginWalkActivity(name, route, now)) changed = true;
            }
        }
    }
    if (changed) renderPerson();
    if (!routes.size) {
        closeSmokeTestAudio();
        autoWalk = null;
        autoWalkFrame = 0;
        updateAutoWalkStatus(completed ? copy['sim_test_finished_' + test] : copy.sim_auto_blocked);
        updateStairPrompt();
        return;
    }
    if (!test && routes.size < walkersOnFloor().length) updateAutoWalkStatus(copy.sim_auto_partial);
    autoWalkFrame = requestAnimationFrame(tickAutoWalk);
}

function chooseBeamForMarker(marker) {
    const choice = beamChoices.find(choice => choice.item.id === marker?.dataset.item);
    if (!choice) return false;
    beamChoice = choice.key;
    beamKey = null;
    renderPerson();
    return true;
}

function sizeSpaceLabels() {
    if (view !== '3d' || !space.clientWidth) return;
    const { width, height } = space.viewBox.baseVal;
    const pixelsPerUnit = Math.min(space.clientWidth / width, space.clientHeight / height);
    if (!(pixelsPerUnit > 0)) return;
    detailedSpacePeople = pixelsPerUnit >= 50;
    space.style.setProperty('--fp-space-label', `${Math.max(.27, 9 / pixelsPerUnit)}px`);
    space.style.setProperty('--fp-space-pin', `${Math.max(.29, 8 / pixelsPerUnit)}px`);
    space.style.setProperty('--fp-space-number', `${Math.max(.19, 8 / pixelsPerUnit)}px`);
}

function setView(next) {
    if (view === next) return;
    closeSensorTip();
    closeLibrary(false);
    drawingMenu.open = false;
    walkControls.stop();
    stopOrbit();
    cancelAnimationFrame(orbitFrame);
    orbitFrame = 0;
    detectedBeam = null;
    element(view === '3d' ? 'fp-person-space-layer' : 'fp-person-flat')?.replaceChildren();
    const effects = element(view === '3d' ? 'fp-activity-space-layer' : 'fp-activity-flat-layer');
    effects?.replaceChildren();
    effects?.removeAttribute('data-effects');
    view = next;
    element('fp-view-mode').textContent = next.toUpperCase();
    root.dataset.view = next;
    const spatial = next === '3d';
    if (!spatial) allFloors = false;
    if (spatial && !['furnish', 'move_furniture'].includes(tool)) setTool('edit');
    else updateTools();
    board.hidden = spatial;
    space.toggleAttribute('hidden', !spatial);
    element('fp-space-empty').hidden = true;
    element('fp-space-guide').hidden = true;
    element('fp-space-furniture').hidden = true;
    for (const name of ['2d', '3d']) {
        root.querySelector(`[data-action="view_${name}"]`).setAttribute('aria-pressed', String(next === name));
        root.querySelectorAll(`[data-legend="${name}"]`).forEach(label => { label.hidden = next !== name; });
    }
    renderDrawing();
    renderUnderlay();
    renderFloors();
    if (!spatial) updateView();
    showZoom();
}

function stopOrbit() {
    orbitDrag = null;
    if (!space.hasAttribute('data-orbiting')) return;
    space.removeAttribute('data-orbiting');
    // Frames drawn while orbiting are drafts; draw the full model once at rest.
    cancelAnimationFrame(orbitFrame);
    orbitFrame = 0;
    if (view === '3d') renderSpatialDrawing();
}

space.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || !space.firstElementChild) return;
    ignoreSpaceClick = false;
    orbitDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: spaceCamera, touch: event.pointerType === 'touch' };
});

space.addEventListener('pointermove', event => {
    if (orbitDrag?.id !== event.pointerId) return;
    const dx = event.clientX - orbitDrag.x, dy = event.clientY - orbitDrag.y;
    if (!ignoreSpaceClick) {
        if (Math.hypot(dx, orbitDrag.touch ? 0 : dy) < 5) return;
        ignoreSpaceClick = true;
        closeSensorTip();
        walkControls.stop();
        space.setPointerCapture(event.pointerId);
        space.setAttribute('data-orbiting', '');
    }
    spaceCamera = orbitSpaceCamera(orbitDrag.camera, dx, orbitDrag.touch ? 0 : dy);
    if (!orbitFrame) orbitFrame = requestAnimationFrame(() => {
        orbitFrame = 0;
        if (view === '3d') renderSpatialDrawing();
    });
});

for (const name of ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave']) {
    space.addEventListener(name, event => {
        if (orbitDrag?.id !== event.pointerId) return;
        if (name !== 'pointerleave' || !space.hasPointerCapture(event.pointerId)) stopOrbit();
    });
}

function placeWalkerOnStack(event, floorId) {
    const floor = projectFloors().find(entry => entry.id === floorId);
    if (!floor?.plan.rooms.length) return;
    let position = null;
    if (event.target.closest('.fp-space-floor')) {
        const point = eventPoint(event, space);
        const [, offset] = projectSpace([0, 0], stackedElevation(floor), spaceCamera);
        const [x, y] = unprojectFloor([point.x, point.y - offset], spaceCamera);
        if (!floor.plan.rooms.some(room => contains(room, { x, y }))) return;
        const stair = building.staircase;
        if (stair && [stair.lower, stair.upper].includes(floorId) && insideStairwell(stair, { x, y })) return;
        position = { x, y };
    } else if (!event.target.closest('[data-floor-label]')) return;

    if (floorId !== building.activeFloor) {
        stopStairWalk();
        stopAutoWalk();
        walkControls.stop();
        const { person } = currentWalker();
        loadWalkFloor(floorId);
        const room = currentRoom() ?? plan.rooms[0];
        const next = position ?? stairSafeStart(currentStairTrip(), personAt(room, person.pose));
        walkers[activeWalker] = startWalker({ ...person, ...next }, activeWalker);
        updateWalkerControls();
        finish();
    } else if (position) restartWalk(position);
    focusWalkMap();
}

function pickAvatar(target) {
    const name = target.closest('[data-avatar]')?.dataset.avatar;
    if (!simulation || !name || !walkers[name]) return false;
    selectWalker(name);
    focusWalkMap();
    return true;
}

space.addEventListener('click', event => {
    if (ignoreSpaceClick) {
        ignoreSpaceClick = false;
        return;
    }
    if (stairWalk?.crossing != null) return;
    if (pickAvatar(event.target)) return;
    if (allFloors) {
        const floor = event.target.closest('[data-building-floor], [data-floor-label]');
        if (!floor) return;
        const id = floor.dataset.buildingFloor ?? floor.dataset.floorLabel;
        if (simulation) placeWalkerOnStack(event, id);
        else showFloor(id);
        return;
    }
    const marker = sensorMarkerAt(event.target);
    if (marker && tool === 'edit') {
        openSensorEdit(marker.dataset.item);
        return;
    }
    if (simulation) {
        // A click on a door opens or closes it; anywhere else on the floor the person walks there.
        const leaf = plan.doors.find(item => item.id === event.target.closest('.fp-space-door-leaf, .fp-space-door')?.dataset.item);
        if (leaf) toggleDoor(leaf);
        else if (currentWalker() && event.target.closest('.fp-space-floor')) {
            const point = eventPoint(event, space);
            const [x, y] = unprojectFloor([point.x, point.y], spaceCamera);
            const door = doorAt(plan, { x, y });
            if (door) toggleDoor(door);
            else if (plan.rooms.some(room => contains(room, { x, y }))) restartWalk({ x, y });
        }
        focusWalkMap();
        return;
    }
    if (tool === 'furnish' || tool === 'move_furniture') {
        if (event.target.closest('.fp-space-floor')) {
            const point = eventPoint(event, space);
            const [x, y] = unprojectFloor([point.x, point.y], spaceCamera);
            drawAt({ x, y });
        }
        return;
    }
    const item = event.target.closest('[data-item]');
    if (!item) return;
    beamChoice = '';
    selected = item.dataset.item;
    render();
    showInspectorStart();
});

function updateCursor() {
    const marker = element('fp-cursor');
    marker.setAttribute('visibility', cursor ? 'visible' : 'hidden');
    if (cursor) marker.setAttribute('transform', `translate(${cursor.x} ${cursor.y})`);
}

function updateView() {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height) return;
    const viewWidth = camera.height * width / height;
    const view = { x: camera.x - viewWidth / 2, y: camera.y - camera.height / 2, width: viewWidth, height: camera.height };
    canvas.setAttribute('viewBox', Object.values(view).join(' '));
    const grid = element('fp-grid-plane');
    Object.entries(view).forEach(([key, value]) => grid.setAttribute(key, value));
    const pixelsPerMetre = height / camera.height;
    canvas.style.setProperty('--fp-label-size', `${Math.max(.238, 11 / pixelsPerMetre)}px`);
    canvas.style.setProperty('--fp-room-size', `${Math.max(.17, 9 / pixelsPerMetre)}px`);
    canvas.style.setProperty('--fp-corner-radius', `${4.2 / pixelsPerMetre}px`);
    canvas.style.setProperty('--fp-draft-size', `${13 / pixelsPerMetre}px`);
    const scale = element('fp-scale');
    const metres = pixelsPerMetre > 110 ? .5 : pixelsPerMetre > 34 ? 1 : pixelsPerMetre > 15 ? 2 : 5;
    scale.style.setProperty('--metre', `${metres * pixelsPerMetre}px`);
    scale.lastChild.textContent = `${number.format(metres)} m`;
    showZoom();
    refreshSensorTip();
}

// The camera that shows the whole plan.
function fittedCamera() {
    const items = [...plan.rooms, ...plan.walls, ...plan.doors, ...plan.sensors];
    if (plan.underlay) items.push({ ...plan.underlay, depth: plan.underlay.width / plan.underlay.ratio });
    if (!items.length) return { x: 5, y: 3.5, height: 10 };
    {
        const xs = items.flatMap(item => [item.x, item.endX ?? item.x + (item.depth ? item.width : 0)]);
        const ys = items.flatMap(item => [item.y, item.endY ?? item.y + (item.depth ?? 0)]);
        for (const [x, y] of plan.furniture.flatMap(furnitureFootprint)) {
            xs.push(x);
            ys.push(y);
        }
        for (const door of plan.doors) {
            const angle = door.angle * Math.PI / 180;
            xs.push(door.x + Math.cos(angle) * door.width, door.x + Math.sin(angle) * door.width);
            ys.push(door.y + Math.sin(angle) * door.width, door.y - Math.cos(angle) * door.width);
        }
        const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        const { clientWidth, clientHeight } = board.parentElement;
        const topGap = Math.min(simulation ? 235 : 122, clientHeight * .29);
        const bottomGap = Math.min(simulation ? 161 : 94, clientHeight * .2);
        const usableHeight = Math.max(1, clientHeight - topGap - bottomGap);
        const ratio = clientWidth / usableHeight || 1;
        const height = Math.max(4, bottom - top + 1.12, (right - left + 1.35) / ratio)
            * Math.max(1, clientHeight) / usableHeight;
        return {
            x: (left + right) / 2, y: (top + bottom) / 2 + (bottomGap - topGap) * height / (2 * Math.max(1, clientHeight)),
            height,
        };
    }
}

function fit() {
    camera = fittedCamera();
    updateView();
}

// How far the map is zoomed: 100% shows the whole plan in 2D, and the room as it opens in 3D.
function showZoom() {
    if (!zoomBar) return;
    const flat = view !== '3d';
    zoomBar.level.textContent = zoomBar.share.format(flat ? fittedCamera().height / camera.height : spaceZoom);
    zoomBar.zoomIn.disabled = flat ? camera.height <= 2 : spaceZoom >= 3.2;
    zoomBar.zoomOut.disabled = flat ? camera.height >= 280 : spaceZoom <= 1;
}

function zoom(factor, anchor = null) {
    const height = Math.max(2, Math.min(280, camera.height * factor));
    if (anchor) {
        const scale = height / camera.height;
        camera.x = anchor.x + (camera.x - anchor.x) * scale;
        camera.y = anchor.y + (camera.y - anchor.y) * scale;
    }
    camera.height = height;
    updateView();
}

function pinchGeometry() {
    const [a, b] = touchPositions.values();
    return { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2,
        distance: Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)) };
}

function eventPoint(event, surface = canvas) {
    const point = surface.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(surface.getScreenCTM().inverse());
}

const limitPoint = point => ({
    x: Math.max(-100, Math.min(100, snap(point.x))),
    y: Math.max(-100, Math.min(100, snap(point.y))),
});
const finePoint = point => ({
    x: Math.max(-100, Math.min(100, Number(point.x.toFixed(2)))),
    y: Math.max(-100, Math.min(100, Number(point.y.toFixed(2)))),
});

function box(first, second) {
    return { x: Math.min(first.x, second.x), y: Math.min(first.y, second.y),
        width: Math.abs(first.x - second.x), depth: Math.abs(first.y - second.y) };
}

function nearestEdge(point, roomBoundary = false, maximumDistance = .4, preferredRoom = null) {
    const edges = (preferredRoom ? [preferredRoom] : plan.rooms).flatMap(room => roomWallEdges(room).map(([a, b]) =>
        ({ ...edgePosition(a, b, point), roomId: room.id, inRoom: true })));
    for (const wall of roomBoundary ? [] : plan.walls) {
        const edge = edgePosition([wall.x, wall.y], [wall.endX, wall.endY], point);
        edges.push({ ...edge, facing: edge.angle, roomId: plan.rooms.find(room => contains(room, edge))?.id });
    }
    let nearest = null, distance = maximumDistance;
    for (const edge of edges) {
        const current = Math.hypot(edge.x - point.x, edge.y - point.y);
        if (!(current <= distance) || (nearest && current === distance)) continue;
        nearest = edge;
        distance = current;
    }
    return nearest;
}

function drawingPoint(point, free) {
    if (free) return finePoint(point);
    const grid = limitPoint(point);
    const edge = nearestEdge(point);
    const tolerance = Math.min(.18, camera.height * 10 / Math.max(1, canvas.clientHeight));
    if (!edge || Math.hypot(edge.x - point.x, edge.y - point.y) > tolerance) return grid;
    if (tool === 'wall') return finePoint(edge);
    if (Math.abs(edge.a[0] - edge.b[0]) < .001) grid.x = edge.x;
    if (Math.abs(edge.a[1] - edge.b[1]) < .001) grid.y = edge.y;
    return finePoint(grid);
}

function makeItem(type, values) {
    const furnishing = type === 'furniture';
    const items = plan[type] ?? [];
    if (items.length >= (furnishing ? maxFurniture : 80)) {
        const message = furnishing ? copy.furniture_limit : copy.limit;
        element(tool === 'place' || placingOpening() ? 'fp-place-help' : 'fp-hint').textContent = message;
        if (furnishing && view === '3d') element('fp-space-placement-text').textContent = message;
        return;
    }
    const item = { id: newId(), ...values };
    const version = ['windows', 'mirrors', 'zones'].includes(type) ? 3 : type === 'rooms' && item.outline ? Math.max(2, plan.version) : plan.version;
    const candidate = { ...plan, version, [type]: [...items, item] };
    if (!validPlan(candidate)) {
        element(tool === 'place' || placingOpening() ? 'fp-place-help' : 'fp-hint').textContent = copy.invalid;
        return;
    }
    remember();
    plan = candidate;
    selected = item.id;
    if (toolRepeats(tool, choice) && type === `${tool}s`) {
        continueTool();
        return true;
    }
    setTool('edit');
    finish();
    if (type === 'rooms') {
        showPanel('outline');
        if (plan.rooms.length === 1) {
            fit();
            focusNext();
        }
    } else showInspectorStart();
    if (type === 'sensors') {
        announcePosition(item, item, `${copy.placed_status} · ${devices[item.model].name}`);
        if (!items.length) focusNext();
    }
    return true;
}

// After a tool that stays active has placed something: the new item is
// selected and the tool is ready for the next one.
function continueTool() {
    placedWithTool += 1;
    start = null;
    placementPoint = null;
    roomDraft = [];
    ghost.replaceChildren();
    ghost.removeAttribute('data-invalid');
    ghost.removeAttribute('data-preview');
    finish();
    showInspectorStart(root.hasAttribute('data-panel'));
    board.focus({ preventScroll: true });
}

function cornerHitRadius() {
    return Math.min(.22, canvas.viewBox.baseVal.width * 14 / Math.max(1, canvas.clientWidth));
}

function selectedRoomForHandles() {
    if (tool !== 'edit' || view !== '2d' || simulation) return null;
    return plan.rooms.find(room => room.id === selected);
}

function renderRoomHandles() {
    const room = selectedRoomForHandles();
    const points = room ? (interaction?.roomCorner ? roomDraft : roomCorners(room)) : [];
    const key = room ? room.id + ':' + points.length : '';
    if (roomHandles.dataset.room !== key) {
        roomHandles.dataset.room = key;
        roomHandleFeedback.textContent = '';
        roomHandles.innerHTML = points.map((_, index) => {
            const label = copy.room_corner_status.replace(':index', number.format(index + 1)).replace(':total', number.format(points.length));
            return `<g class="fp-room-handle" data-room-handle="${index}" role="button" tabindex="0"
                aria-label="${escapeText(label)}" aria-describedby="fp-room-handle-keys">
                <circle class="fp-room-handle-hit" r=".08"/><circle class="fp-room-handle-focus" r=".14"/>
                <circle class="fp-room-handle-dot" r=".08"/></g>`;
        }).join('');
        roomMidpoints.innerHTML = points.length < maxRoomCorners ? points.map((_, index) => {
            const label = escapeText(copy.room_midpoint_label.replace(':index', number.format(index + 1)));
            return `<g class="fp-room-midpoint" data-room-midpoint="${index}" role="button" tabindex="0" aria-label="${label}">
                <title>${label}</title>
                <circle class="fp-room-handle-hit" r=".08"/>
                <circle class="fp-room-midpoint-ring" r=".08"/><circle class="fp-room-midpoint-dot" r=".06"/></g>`;
        }).join('') : '';
    }
    points.forEach(([x, y], index) => {
        const handle = roomHandles.children[index];
        handle.setAttribute('transform', `translate(${x} ${y})`);
        handle.toggleAttribute('data-dragging', Boolean(interaction?.roomCorner && interaction.vertex === index));
    });
    if (!roomMidpoints.childElementCount) return;
    polygonEdges(points).forEach(([[ax, ay], [bx, by]], index) =>
        roomMidpoints.children[index].setAttribute('transform', `translate(${(ax + bx) / 2} ${(ay + by) / 2})`));
}

function highlightRoomMidpoint(point) {
    const room = selectedRoomForHandles();
    if (!room || !roomMidpoints.childElementCount) return;
    let nearest = -1;
    let distance = canvas.viewBox.baseVal.height * 20 / canvas.clientHeight;
    if (point) polygonEdges(roomCorners(room)).forEach(([a, b], index) => {
        const edge = edgePosition(a, b, point);
        const gap = Math.hypot(edge.x - point.x, edge.y - point.y);
        if (gap >= distance) return;
        nearest = index;
        distance = gap;
    });
    for (const midpoint of roomMidpoints.children) {
        midpoint.toggleAttribute('data-near', Number(midpoint.dataset.roomMidpoint) === nearest);
    }
}

function insertWallMidpoint(points, edge) {
    const [ax, ay] = points[edge];
    const [bx, by] = points[(edge + 1) % points.length];
    points.splice(edge + 1, 0, [(ax + bx) / 2, (ay + by) / 2]);
    return edge + 1;
}

function renderRoomDraft(pointer = null) {
    const editing = tool === 'edit_outline';
    if (editing) {
        const [x, y] = roomDraft[draftCorner];
        for (const input of element('fp-room-corner-position').querySelectorAll('input')) {
            input.value = Number((input.dataset.cornerAxis === 'x' ? x : y).toFixed(4));
        }
    }
    const points = pointer ? [...roomDraft, [pointer.x, pointer.y]] : roomDraft;
    const shape = points.length > 2 ? 'polygon' : 'polyline';
    ghost.toggleAttribute('data-invalid', roomDraft.length >= 3 && !outlineBounds(roomDraft,
        tool === 'zone' || (editing && selectedItem().type === 'zones') ? { minSpan: .1, minArea: .025 } : undefined));
    ghost.innerHTML = points.length ? `<${shape} class="fp-outline-draft" points="${points.map(point => point.join(',')).join(' ')}"/>
        ${roomDraft.map(([x, y], index) => `<circle class="fp-outline-corner" cx="${x}" cy="${y}" r=".08"
            data-room-vertex="${index}" data-current="${index === (editing ? draftCorner : 0)}"/>`).join('')}` : '';
}

function saveRoomDraft() {
    if (tool === 'zone') {
        const existing = (plan.zones ?? []).find(zone => zone.id === choice);
        const type = existing?.type ?? element('fp-zone-type').value;
        const first = roomDraft[0];
        const room = first && plan.rooms.find(room => existing ? room.id === existing.roomId : contains(room, { x: first[0], y: first[1] }));
        if (!room) { element('fp-hint').textContent = copy.zone_outside; return; }
        const item = existing ? { ...existing, parts: [...existing.parts, roomDraft] }
            : { id: newId(), type, roomId: room.id, parts: [roomDraft], name: `${copy['zone_' + type]} ${(plan.zones?.length ?? 0) + 1}`,
                ...(type === 'entry' ? { direction: 'right' } : {}) };
        const zones = existing ? plan.zones.map(zone => zone === existing ? item : zone) : [...(plan.zones ?? []), item];
        const candidate = { ...plan, version: 3, zones };
        if (!validPlan(candidate)) { element('fp-hint').textContent = copy.zone_outside; return; }
        remember();
        plan = candidate;
        selected = item.id;
        if (toolRepeats(tool, choice)) {
            continueTool();
            return;
        }
        setTool('edit');
        finish();
        showInspectorStart();
        return;
    }
    const selectedZone = selectedItem();
    if (tool === 'edit_outline' && selectedZone.type === 'zones') {
        const item = selectedZone.item;
        const parts = item.parts.map((part, i) => i === Number(choice) ? roomDraft : part);
        const candidate = { ...plan, zones: plan.zones.map(zone => zone === item ? { ...zone, parts } : zone) };
        if (!validPlan(candidate)) { element('fp-hint').textContent = copy.zone_outside; return; }
        remember();
        plan = candidate;
        setTool('edit');
        finish();
        board.focus({ preventScroll: true });
        return;
    }
    const geometry = outlineBounds(roomDraft);
    if (!geometry) {
        element('fp-hint').textContent = copy.room_outline_invalid;
        return;
    }
    if (tool === 'outline_room') {
        makeItem('rooms', { ...geometry, height: 2.7, name: `${copy.room} ${plan.rooms.length + 1}` });
        return;
    }
    const { type, item } = selectedItem();
    if (type !== 'rooms') return;
    const previous = roomCorners(item);
    if (previous.length === roomDraft.length && previous.every(([x, y], index) => x === roomDraft[index][0] && y === roomDraft[index][1])) {
        actions.cancel_outline();
        return;
    }
    if (!applyRoomOutline(item, geometry)) {
        element('fp-hint').textContent = copy.room_outline_invalid;
        return;
    }
    setTool('edit');
    finish();
    showInspectorStart();
    board.focus({ preventScroll: true });
}

function applyRoomOutline(room, geometry) {
    const updated = { ...room, ...geometry };
    const candidate = { ...plan, version: Math.max(2, plan.version), rooms: plan.rooms.map(item => item === room ? updated : item) };
    for (const key of ['windows', 'mirrors']) if (plan[key]) {
        candidate[key] = plan[key].map(opening => opening.roomId === room.id ? roomOpening(updated, opening) : opening);
    }
    candidate.doors = plan.doors.map(door => door.roomId === room.id && doorWall(door, room)
        ? roomOpening(updated, door, door.width, { preserveDirection: true, minWidth: openingDefaults.door.min }) : door);
    if (!validPlan(candidate)) return false;
    remember();
    plan = candidate;
    if (room.x !== geometry.x || room.y !== geometry.y || room.width !== geometry.width || room.depth !== geometry.depth) clearRoomMounts(room.id);
    return true;
}

const isWallMounted = item => ['wall-bracket', 'wall-recessed'].includes(installationFor(item));

function alignSensorToWall(item, room = plan.rooms.find(room => contains(room, item))) {
    if (!isWallMounted(item)) return item;
    const edge = nearestEdge(item, true, Infinity, room);
    // On its bracket the sensor can be turned away from straight out of the wall.
    const turned = canAimSensor(item) ? item.pan ?? 0 : 0;
    return edge ? { ...item, x: edge.x, y: edge.y, angle: (((edge.facing + turned) % 360) + 360) % 360 } : item;
}

function sensorPlacement(point) {
    // A sensor that is put down looks into its room, not at the wall it stands against.
    const room = devices[choice].mount === 'wall' ? plan.rooms.find(room => contains(room, point)) : null;
    const middle = room && roomInteriorPoint(room);
    const angle = middle && Math.hypot(middle.x - point.x, middle.y - point.y) > .3 ? directionTo(point, middle, 45) : 0;
    return alignSensorToWall({ ...point, angle, model: choice, radar: placementDevice?.radar ?? devices[choice].defaultRadar ?? 'none',
        installation: placementInstallation, ...(placementDevice ? { haDevice: placementDevice.id, mountHeight: placementDevice.mountHeight,
            ...(placementDevice.tilt ? { tilt: placementDevice.tilt } : {}) } : {}) });
}

function doorWall(door, room = null) {
    const angle = door.angle * Math.PI / 180;
    const middle = { x: door.x + Math.cos(angle) * door.width / 2, y: door.y + Math.sin(angle) * door.width / 2 };
    const edge = nearestEdge(middle, Boolean(room), .04, room);
    return edge && Math.abs(Math.sin(angle - edge.angle * Math.PI / 180)) < .01 ? edge : null;
}

function openingPlacement(point) {
    const tolerance = Math.max(.4, Math.min(1, 22 * camera.height / canvas.clientHeight));
    const edge = nearestEdge(point, tool !== 'door', tolerance);
    if (!edge) return null;
    const width = openingWidth.valueAsNumber;
    if (!openingWidth.validity.valid || (tool !== 'door' && !openingHeight.validity.valid)) return { edge };
    if (width - edge.length > 1e-7) return { edge, tooWide: true };
    const geometry = wallOpeningPosition(edge, Math.min(width, edge.length), tool === 'door' && edge.inRoom);
    return { edge, position: { ...geometry, ...(edge.roomId ? { roomId: edge.roomId } : {}) } };
}

function renderOpeningPreview(point) {
    const preview = openingPlacement(point);
    if (!preview) {
        ghost.replaceChildren();
        ghost.removeAttribute('data-preview');
        return null;
    }
    const { edge: { a, b }, position } = preview;
    const opening = position ? `<g transform="translate(${position.x} ${position.y}) rotate(${position.angle})">
        <path class="fp-opening-preview-span" d="M0 0h${position.width}"/>
        ${tool === 'door' ? `<path class="fp-opening-preview-swing" d="M0 0v-${position.width}a${position.width} ${position.width} 0 0 1 ${position.width} ${position.width}"/>`
            : `<path class="fp-opening-preview-ends" d="M0 -.1v.2 M${position.width} -.1v.2"/>`}
    </g>` : '';
    const markup = `<g class="fp-opening-preview" data-opening="${tool}">
        <line class="fp-opening-preview-wall" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>
        ${opening}</g>`;
    if (ghost.dataset.preview !== markup) {
        ghost.dataset.preview = markup;
        ghost.innerHTML = markup;
    }
    return preview;
}

function openingHelp(preview) {
    if (!preview) return copy.opening_choose_wall;
    if (preview.tooWide) return copy.opening_too_wide.replace(':length', number.format(preview.edge.length));
    return copy[preview.position ? 'opening_ready' : 'opening_invalid_dimensions'];
}

function placeOpening() {
    if (!placementPoint) return;
    const preview = openingPlacement(placementPoint);
    if (!preview?.position) return;
    const type = tool + 's';
    const existing = plan[type]?.find(item => item.id === choice);
    const values = { ...preview.position };
    if (tool !== 'door') {
        values.height = openingHeight.valueAsNumber;
        values.base = existing?.base ?? openingDefaults[tool].base;
    }
    if (!existing) {
        makeItem(type, values);
        return;
    }
    const updated = { ...existing, ...values };
    if (!values.roomId) delete updated.roomId;
    const candidate = { ...plan, [type]: plan[type].map(item => item === existing ? updated : item) };
    if (!validPlan(candidate)) {
        element('fp-place-help').textContent = copy.invalid;
        return;
    }
    remember();
    plan = candidate;
    setTool('edit');
    finish();
    showInspectorStart();
}

function drawAt(point) {
    if (tool === 'outline_room' || tool === 'zone') {
        const next = limitPoint(point);
        const first = roomDraft[0], last = roomDraft.at(-1);
        const zoneEntry = tool === 'zone' && element('fp-zone-type').value === 'entry';
        if (zoneEntry && roomDraft.length >= 2) return;
        if (first && roomDraft.length >= 3 && (Math.hypot(first[0] - point.x, first[1] - point.y) <= cornerHitRadius()
            || (first[0] === next.x && first[1] === next.y))) {
            saveRoomDraft();
            return;
        }
        if (last && last[0] === next.x && last[1] === next.y) return;
        if (roomDraft.length >= maxRoomCorners) {
            element('fp-hint').textContent = copy.room_outline_limit.replace(':count', maxRoomCorners);
            return;
        }
        roomDraft.push([next.x, next.y]);
        updateTools();
        renderRoomDraft();
        return;
    }
    if (tool === 'scale_underlay') {
        const image = plan.underlay;
        if (!contains({ ...image, depth: image.width / image.ratio }, point)) return;
        if (!start) {
            start = point;
            updateTools();
        } else {
            const length = Math.hypot(point.x - start.x, point.y - start.y);
            if (length < .1) return;
            underlayMeasure = { start, length };
            setTool('edit');
            renderUnderlay();
            element('fp-underlay-distance').focus();
        }
        return;
    }
    if (tool === 'furnish' || tool === 'move_furniture') {
        const coordinate = value => Math.min(100, Math.max(-100, Number(value.toFixed(2))));
        const position = { x: coordinate(point.x), y: coordinate(point.y) };
        if (!plan.rooms.some(room => contains(room, position))) return;
        if (tool === 'furnish') {
            makeItem('furniture', furnitureAt(choice, copy.furniture_items[choice], position));
        } else {
            const { item } = selectedItem();
            remember();
            Object.assign(item, position);
            setTool('edit');
            finish();
            showInspectorStart();
        }
        return;
    }
    if (tool === 'place') {
        if (integration && !haDevice(placementDevice?.id)) {
            element('fp-place-help').textContent = integration.picker.invalid;
            return;
        }
        const destination = integration && plan.rooms.find(room => contains(room, point));
        if (integration && !destination) {
            element('fp-place-help').textContent = integration.picker.inside;
            return;
        }
        if (integration && placementAreaId && destination.haAreaId && destination.haAreaId !== placementAreaId) {
            element('fp-place-help').textContent = integration.picker.wrongArea
                .replace('{area}', homeAssistantAreaName(destination.haAreaId));
            return;
        }
        makeItem('sensors', sensorPlacement(point));
        return;
    }
    if (placingOpening()) {
        if (openingPlacement(point)) {
            placementPoint = point;
            updateTools();
        } else if (!placementPoint) {
            element('fp-place-help').textContent = copy.opening_wall_missing;
        }
        return;
    }
    if (!start) {
        start = point;
        updateTools();
        return;
    }
    if (tool === 'room') {
        makeItem('rooms', { ...box(start, point), height: 2.7, name: `${copy.room} ${plan.rooms.length + 1}` });
    } else {
        makeItem('walls', { ...start, endX: point.x, endY: point.y });
    }
}

function showGhost(point, anchor = start) {
    if (placingOpening()) {
        if (!placementPoint) renderOpeningPreview(point);
        return;
    }
    if (tool === 'place') {
        const key = `${point.x},${point.y}`;
        if (ghost.dataset.preview !== key) {
            ghost.dataset.preview = key;
            ghost.innerHTML = paintPlacementPreview(plan, sensorPlacement(point), coverageRadarOptions);
        }
        return;
    }
    if (tool === 'outline_room' || tool === 'zone') {
        renderRoomDraft(point);
        return;
    }
    if (tool === 'furnish' || tool === 'move_furniture') {
        const item = tool === 'furnish' ? furnitureAt(choice, '', point) : { ...selectedItem().item, ...point };
        ghost.innerHTML = paintFurniture(item, false, false);
        return;
    }
    if (!anchor) return;
    let mark, x, y, dimensions;
    if (tool === 'room') {
        const room = box(anchor, point);
        mark = `<rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.depth}"/>`;
        x = room.x + room.width / 2;
        y = room.y + room.depth / 2;
        dimensions = `${number.format(room.width)} × ${number.format(room.depth)} m`;
    } else {
        mark = `<line x1="${anchor.x}" y1="${anchor.y}" x2="${point.x}" y2="${point.y}"/>`;
        if (tool !== 'wall') { ghost.innerHTML = mark; return; }
        x = (anchor.x + point.x) / 2;
        y = (anchor.y + point.y) / 2;
        dimensions = `${number.format(Math.hypot(point.x - anchor.x, point.y - anchor.y))} m`;
    }
    ghost.innerHTML = `${mark}<text class="fp-draft-dimension" x="${x}" y="${y}" dy="-.5em" text-anchor="middle">${dimensions}</text>`;
}

canvas.addEventListener('pointerdown', event => {
    if (liveMode) return;
    if (event.isPrimary && !pinch) ignoreTouchClick = false;
    if (event.pointerType === 'touch') {
        touchPositions.set(event.pointerId, event);
        if (touchPositions.size >= 2) {
            if (interaction) endInteraction({ pointerId: interaction.pointer, type: 'pointercancel' });
            for (const id of touchPositions.keys()) canvas.setPointerCapture(id);
            pinch = pinchGeometry();
            ignoreTouchClick = true;
            return;
        }
    }
    if (!event.isPrimary || event.button !== 0) return;
    if (simulation) {
        board.focus({ preventScroll: true });
        return;
    }
    roomHandleFeedback.textContent = '';
    // A door wins from the edge and the handles of the room it sits in: it is small and lies on the wall.
    const doorHit = tool === 'edit' ? doorAt(plan, eventPoint(event), .16) : null;
    const handle = doorHit ? null : event.target.closest('[data-room-handle], [data-room-midpoint]');
    if (handle) {
        const room = selectedRoomForHandles();
        if (!room) return;
        event.preventDefault();
        roomDraft = roomCorners(room);
        const midpoint = handle.hasAttribute('data-room-midpoint');
        const vertex = midpoint ? insertWallMidpoint(roomDraft, Number(handle.dataset.roomMidpoint)) : Number(handle.dataset.roomHandle);
        interaction = { pointer: event.pointerId, roomCorner: true, midpoint, vertex, cornerStart: roomDraft[vertex],
            origin: eventPoint(event), originX: event.clientX, originY: event.clientY };
        lastRoomClick = null;
        canvas.setAttribute('data-room-corner-drag', '');
        renderRoomHandles();
        canvas.setPointerCapture(event.pointerId);
        board.focus({ preventScroll: true });
        return;
    }
    const target = doorHit?.id ?? event.target.closest('[data-item]')?.dataset.item;
    if (event.pointerType === 'touch' && tool === 'edit') {
        interaction = { pointer: event.pointerId, tapSelection: target ?? null, originX: event.clientX, originY: event.clientY, camera: { ...camera } };
        canvas.setPointerCapture(event.pointerId);
        return;
    }
    cursor = null;
    updateCursor();
    const origin = eventPoint(event);
    if (tool === 'edit_outline') {
        const original = [...roomDraft];
        const radius = cornerHitRadius();
        let closest = radius, vertex = -1;
        roomDraft.forEach(([x, y], index) => {
            const distance = Math.hypot(x - origin.x, y - origin.y);
            if (distance < closest) {
                closest = distance;
                vertex = index;
            }
        });
        if (vertex < 0 && roomDraft.length < maxRoomCorners && selectedItem().item?.type !== 'entry') {
            let split;
            polygonEdges(roomDraft).forEach(([a, b], index) => {
                const edge = edgePosition(a, b, origin);
                const distance = Math.hypot(edge.x - origin.x, edge.y - origin.y);
                if (distance < closest && edge.along > .08 && edge.along < edge.length - .08) {
                    closest = distance;
                    vertex = index + 1;
                    split = [edge.x, edge.y];
                }
            });
            if (split) roomDraft.splice(vertex, 0, split);
        }
        if (vertex < 0) return;
        draftCorner = vertex;
        interaction = { pointer: event.pointerId, vertex, outline: original, originX: event.clientX, originY: event.clientY };
        updateTools();
        renderRoomDraft();
        canvas.setPointerCapture(event.pointerId);
        board.focus({ preventScroll: true });
        return;
    }
    if (tool === 'pan') {
        interaction = { pointer: event.pointerId, originX: event.clientX, originY: event.clientY, camera: { ...camera } };
    } else if (tool !== 'edit' && tool !== 'move_item') {
        interaction = { pointer: event.pointerId, place: true, origin, originX: event.clientX, originY: event.clientY };
    } else {
        const previousSelection = selected;
        if (tool === 'move_item' && target !== selected) return;
        selected = target;
        const { item, type } = selectedItem();
        if (type !== 'rooms') lastRoomClick = null;
        if (item && !['windows', 'mirrors', 'zones'].includes(type)) {
            const group = type === 'rooms' ? Object.values(roomContents(plan, item)).flat().map(entry => [entry, { ...entry }]) : null;
            interaction = { pointer: event.pointerId, origin, originX: event.clientX, originY: event.clientY,
                item, type, original: { ...item }, group, previous: JSON.stringify(plan) };
        }
        render();
        inspectMapSelection(type, selected !== previousSelection);
    }
    if (interaction) canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('click', event => {
    if (ignoreTouchClick || sensorEdit.open) return;
    if (pickAvatar(event.target)) return;
    const marker = sensorMarkerAt(event.target);
    if (marker && (simulation || event.detail === 0)) {
        openSensorEdit(marker.dataset.item);
        return;
    }
    if (!currentWalker()) return;
    const point = eventPoint(event);
    // During the coverage test a click on a door opens or closes it.
    const door = simulation && doorAt(plan, point);
    if (door) toggleDoor(door);
    else if (plan.rooms.some(room => contains(room, point))) restartWalk(point);
});

canvas.addEventListener('contextmenu', event => {
    if (simulation || ['edit', 'pan'].includes(tool)) return;
    event.preventDefault();
    if (placingOpening() || ['place', 'furnish', 'move_furniture', 'move_item'].includes(tool)) cancelPlacement();
    else setTool('edit');
});

canvas.addEventListener('pointermove', event => {
    if (touchPositions.has(event.pointerId)) {
        touchPositions.set(event.pointerId, event);
        if (pinch) {
            if (touchPositions.size >= 2) {
                const geometry = pinchGeometry();
                const anchor = eventPoint(pinch);
                const point = eventPoint(geometry);
                camera.x += anchor.x - point.x;
                camera.y += anchor.y - point.y;
                zoom(pinch.distance / geometry.distance, anchor);
                pinch = geometry;
            }
            return;
        }
    }
    if (tool === 'place' && event.pointerType !== 'touch' && !placementPoint) {
        showGhost(limitPoint(eventPoint(event)));
    }
    if (placingOpening() && event.pointerType !== 'touch' && !placementPoint) renderOpeningPreview(eventPoint(event));
    const drawing = tool === 'room' || tool === 'wall';
    if (interaction?.pointer !== event.pointerId) {
        if (event.pointerType !== 'touch' && !event.buttons && roomMidpoints.childElementCount) highlightRoomMidpoint(eventPoint(event));
        if (drawing && start) showGhost(drawingPoint(eventPoint(event), event.shiftKey));
        else if (start || tool === 'outline_room' || tool === 'zone') showGhost(limitPoint(eventPoint(event)));
        else if (tool === 'furnish' || tool === 'move_furniture') showGhost(eventPoint(event));
        return;
    }
    if (interaction.tapSelection !== undefined) {
        const metres = camera.height / canvas.clientHeight;
        camera.x = interaction.camera.x + (interaction.originX - event.clientX) * metres;
        camera.y = interaction.camera.y + (interaction.originY - event.clientY) * metres;
        updateView();
        return;
    }
    if (interaction.vertex !== undefined) {
        if (Math.hypot(event.clientX - interaction.originX, event.clientY - interaction.originY) < 3) return;
        let target = eventPoint(event);
        if (interaction.roomCorner) {
            const { origin, cornerStart: [x, y] } = interaction;
            target = { x: x + target.x - origin.x, y: y + target.y - origin.y };
        }
        const point = (event.altKey ? finePoint : limitPoint)(target);
        roomDraft[interaction.vertex] = [point.x, point.y];
        if (interaction.roomCorner) {
            ghost.toggleAttribute('data-invalid', !outlineBounds(roomDraft));
            ghost.innerHTML = `<polygon class="fp-outline-draft" points="${roomDraft.map(point => point.join(',')).join(' ')}"/>`;
            renderRoomHandles();
            return;
        }
        renderRoomDraft();
        return;
    }
    if (interaction.place) {
        if (drawing && Math.hypot(event.clientX - interaction.originX, event.clientY - interaction.originY) > 9) {
            interaction.anchor ??= start ?? drawingPoint(interaction.origin, event.shiftKey);
        }
        if (drawing && (start || interaction.anchor)) showGhost(drawingPoint(eventPoint(event), event.shiftKey), interaction.anchor ?? start);
        else if (start) showGhost(limitPoint(eventPoint(event)));
        return;
    }
    if (interaction.camera) {
        const metres = camera.height / canvas.clientHeight;
        camera.x = interaction.camera.x + (interaction.originX - event.clientX) * metres;
        camera.y = interaction.camera.y + (interaction.originY - event.clientY) * metres;
        updateView();
        return;
    }
    const { origin, item, type, original, group } = interaction;
    if (type === 'sensors' && tool === 'edit' && !interaction.dragged) {
        if (Math.hypot(event.clientX - interaction.originX, event.clientY - interaction.originY) <= 6) return;
        interaction.dragged = true;
    }
    const point = eventPoint(event);
    if (group) {
        const rawX = point.x - origin.x, rawY = point.y - origin.y;
        if (Math.hypot(rawX, rawY) < .025 && item.x === original.x && item.y === original.y) return;
        const offset = event.altKey ? { x: rawX, y: rawY } : snapRoomOffset(original, plan.rooms, rawX, rawY);
        const dx = Math.abs(offset.x - rawX) > 1e-7 || event.altKey ? offset.x : snap(rawX);
        const dy = Math.abs(offset.y - rawY) > 1e-7 || event.altKey ? offset.y : snap(rawY);
        const moves = group.map(([entry, previous]) => [entry, translatedItem(previous, dx, dy)]);
        const outside = moves.some(([, entry]) => (entry.parts ? entry.parts.flat(2) : [entry.x, entry.y, entry.endX ?? 0, entry.endY ?? 0])
            .some(value => Math.abs(value) > 100));
        if (outside) return;
        for (const [entry, next] of moves) Object.assign(entry, next);
        renderDrawing();
        return;
    }
    const dx = snap(point.x - origin.x);
    const dy = snap(point.y - origin.y);
    const next = { ...original, x: original.x + dx, y: original.y + dy };
    if (type === 'walls') {
        next.endX += dx;
        next.endY += dy;
    }
    if ([next.x, next.y, next.endX ?? 0, next.endY ?? 0].some(value => Math.abs(value) > 100)) return;
    Object.assign(item, type === 'sensors' ? alignSensorToWall(next) : next);
    if (item.levelMountRoom && (dx || dy)) item.levelMountRoom = null;
    renderDrawing();
});

canvas.addEventListener('pointerleave', event => {
    if (!canvas.hasPointerCapture(event.pointerId)) touchPositions.delete(event.pointerId);
    highlightRoomMidpoint(null);
    if ((tool !== 'place' && !placingOpening()) || placementPoint) return;
    ghost.replaceChildren();
    ghost.removeAttribute('data-preview');
});

function endInteraction(event) {
    if (interaction?.pointer !== event.pointerId) return;
    const { item, type, previous, original, place, origin, originX, originY, outline, group, anchor, tapSelection, dragged,
        roomCorner, midpoint, vertex, cornerStart } = interaction;
    interaction = null;
    if (roomCorner) {
        const [x, y] = roomDraft[vertex];
        const room = selectedRoomForHandles();
        const changed = event.type === 'pointerup' && room && (midpoint || x !== cornerStart[0] || y !== cornerStart[1]);
        const geometry = changed && outlineBounds(roomDraft);
        roomDraft = [];
        canvas.removeAttribute('data-room-corner-drag');
        ghost.replaceChildren();
        ghost.removeAttribute('data-invalid');
        if (geometry && applyRoomOutline(room, geometry)) {
            recentUndo = copy[midpoint ? 'room_midpoint_saved' : 'room_corner_saved'];
            const frame = canvas.viewBox.baseVal;
            const margin = 24 * frame.height / canvas.clientHeight;
            const dx = x - Math.max(frame.x + margin, Math.min(x, frame.x + frame.width - margin));
            const dy = y - Math.max(frame.y + margin, Math.min(y, frame.y + frame.height - margin));
            if (dx || dy) {
                camera.x += dx;
                camera.y += dy;
                updateView();
            }
            finish();
        } else {
            renderRoomHandles();
            if (changed) roomHandleFeedback.textContent = copy.room_outline_invalid;
            else if (event.type === 'pointerup' && event.pointerType === 'mouse') {
                roomHandles.children[vertex]?.focus({ preventScroll: true });
            }
        }
        return;
    }
    if (tapSelection !== undefined) {
        if (event.type !== 'pointerup' || Math.hypot(event.clientX - originX, event.clientY - originY) > 9) return;
        if (plan.sensors.some(sensor => sensor.id === tapSelection)) {
            openSensorEdit(tapSelection);
            return;
        }
        const changed = selected !== tapSelection;
        selected = tapSelection;
        render();
        inspectMapSelection(selectedItem().type, changed);
        return;
    }
    if (outline && event.type === 'pointercancel') {
        roomDraft = outline;
        draftCorner = Math.min(draftCorner, roomDraft.length - 1);
        updateTools();
        renderRoomDraft();
    }
    if (place && event.type === 'pointerup') {
        if (anchor) {
            start = anchor;
            drawAt(drawingPoint(eventPoint(event), event.shiftKey));
            if (start) { start = null; ghost.replaceChildren(); }
        } else if (Math.hypot(event.clientX - originX, event.clientY - originY) <= 9) {
            if (tool === 'place' && event.pointerType === 'touch') {
                placementPoint = limitPoint(origin);
                showGhost(placementPoint);
                updateTools();
            } else if (tool === 'room' || tool === 'wall') drawAt(drawingPoint(origin, event.shiftKey));
            else drawAt(['furnish', 'move_furniture', 'scale_underlay', 'outline_room', 'zone', 'door', 'window', 'mirror'].includes(tool) ? origin : limitPoint(origin));
        }
    } else if (place && anchor && !start) {
        ghost.replaceChildren();
    }
    if (item && (item.x !== original.x || item.y !== original.y || item.angle !== original.angle)) {
        lastRoomClick = null;
        if (event.type === 'pointercancel' || !validPlan(plan)) {
            plan = JSON.parse(previous);
            render();
            return;
        }
        if (!group && item.levelMountRoom) item.levelMountRoom = null;
        remember(previous);
        if (tool === 'move_item') {
            placementOpener = null;
            setTool('edit');
        }
        recentUndo = copy.undo_moved;
        finish();
    } else if (type === 'sensors' && tool === 'edit' && !dragged && event.type === 'pointerup'
        && Math.hypot(event.clientX - originX, event.clientY - originY) <= 6) {
        openSensorEdit(item.id);
    } else if (type === 'rooms' && event.pointerType === 'mouse') {
        // The room SVG is redrawn on selection, so a native double-click loses its original target.
        const { clientX: x, clientY: y, timeStamp: time } = event;
        const clicked = event.type === 'pointerup' && Math.hypot(x - originX, y - originY) < 6;
        const previousClick = lastRoomClick;
        lastRoomClick = clicked ? { room: item.id, x, y, time } : null;
        if (clicked && previousClick?.room === item.id && time - previousClick.time < 450
            && Math.hypot(x - previousClick.x, y - previousClick.y) < 10) {
            lastRoomClick = null;
            openLibrary(board, { room: item, point: finePoint(origin), x, y });
        }
    }
}
function finishPointer(event) {
    const tracked = touchPositions.delete(event.pointerId);
    if (tracked && pinch) {
        if (!touchPositions.size) pinch = null;
        else if (touchPositions.size >= 2) pinch = pinchGeometry();
        return;
    }
    endInteraction(event);
}

canvas.addEventListener('pointerup', finishPointer);
canvas.addEventListener('pointercancel', finishPointer);
canvas.addEventListener('touchmove', event => {
    if (pinch && event.touches.length >= 2 && event.cancelable) event.preventDefault();
}, { passive: false });
canvas.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    zoom(Math.exp(Math.max(-100, Math.min(100, event.deltaY)) * .004), eventPoint(event));
}, { passive: false });

function replacePlan(next) {
    if (simulation) setSimulation(false);
    if (!showStart) remember();
    else {
        stopDemoPreview?.();
        element('fp-start-preview').replaceChildren();
    }
    showStart = false;
    roomFormOpen = false;
    readProject(next);
    allFloors = false;
    underlayMeasure = null;
    selected = plan.sensors[0]?.id;
    setTool('edit');
    showPanel('outline');
    root.removeAttribute('data-panel');
    fit();
    finish();
}

function download(contents, filename, type = 'application/json') {
    const url = URL.createObjectURL(contents instanceof Blob ? contents : new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportPlan() {
    const project = projectDocument();
    const filename = (project.name.replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '') || 'sensor-plan') + '.json';
    download(JSON.stringify(project, null, 2), filename);
}

// The project as it is shown: in Home Assistant without the sensors that are hidden.
function shownProject() {
    const project = projectDocument();
    return project.floors ? { ...project, floors: project.floors.map(floor => ({ ...floor, plan: visiblePlan(floor.plan) })) } : visiblePlan(project);
}

// A page of the sheet as a canvas, drawn larger than its size so it prints sharp.
async function sheetCanvas(page, scale = 1.5) {
    const image = new Image();
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(page.svg);
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(page.width * scale);
    canvas.height = Math.round(page.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
}

const canvasFile = (canvas, type, quality) => new Promise((resolve, reject) =>
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No image')), type, quality));

// Saves the plan as a picture of the floor that is open, or as a PDF with a
// page for every floor.
async function saveSheet(kind) {
    const status = element('fp-save');
    const project = shownProject();
    const pages = sheetPages(project, { copy, number, radarOptions: coverageRadarOptions,
        date: new Date().toLocaleDateString(root.dataset.locale, { dateStyle: 'long' }) });
    if (!pages.length) {
        status.textContent = copy.sheet_empty;
        return;
    }
    const button = fileButtons[kind === 'pdf' ? 'sheet_pdf' : 'sheet_image'];
    button.disabled = true;
    try {
        if (kind === 'pdf') {
            const images = [];
            for (const page of pages) {
                const canvas = await sheetCanvas(page);
                const file = await canvasFile(canvas, 'image/jpeg', .92);
                images.push({ jpeg: new Uint8Array(await file.arrayBuffer()), width: canvas.width, height: canvas.height });
            }
            download(new Blob([pdfDocument(images, { title: project.name, creator: copy.sheet_credit })], { type: 'application/pdf' }),
                sheetFileName(project, 'pdf'));
        } else {
            const open = sheetFloors(project).findIndex(floor => floor.id === building?.activeFloor);
            const page = pages[Math.max(0, open)];
            download(await canvasFile(await sheetCanvas(page), 'image/png'),
                sheetFileName(pages.length > 1 ? { name: `${project.name} ${page.name}` } : project, 'png'));
        }
        status.textContent = copy.sheet_done;
    } catch {
        status.textContent = copy.sheet_error;
    } finally {
        button.disabled = false;
    }
}

// A drawing as a PNG file: pixels as mapRooms makes them, or an SVG picture.
async function pictureFile(source) {
    const canvas = document.createElement('canvas');
    if (source.data) {
        canvas.width = source.width;
        canvas.height = source.height;
        canvas.getContext('2d').putImageData(new ImageData(source.data, source.width, source.height), 0, 0);
    } else {
        const url = URL.createObjectURL(source);
        try {
            const image = new Image();
            image.src = url;
            await image.decode();
            // An SVG has no pixels of its own: draw it large enough to trace.
            const scale = 1600 / Math.max(image.naturalWidth || 1600, image.naturalHeight || 1600);
            canvas.width = Math.round((image.naturalWidth || 1600) * scale);
            canvas.height = Math.round((image.naturalHeight || 1200) * scale);
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        } finally {
            URL.revokeObjectURL(url);
        }
    }
    return canvasFile(canvas, 'image/png');
}

// Puts the map of a robot vacuum under the plan. A map that knows its rooms
// (a Valetudo robot's) brings them along, to scale. Any other map is an image
// like an uploaded one: its rooms are found once it has its scale.
async function useVacuumMap(id) {
    const picked = integration.picker;
    const status = element(showStart ? 'fp-start-status' : 'fp-save');
    const original = plan;
    status.toggleAttribute('data-busy', true);
    status.textContent = picked.vacuumLoading;
    try {
        let file = await integration.vacuumMap(id);
        const map = await embeddedMap(new Uint8Array(await file.arrayBuffer()));
        const drawn = map && mapRooms(map, { roomName: copy.room });
        // The picture around a robot's own map is a notice, not a map.
        if (map && !drawn) throw new Error('Empty map');
        if (drawn) file = await pictureFile(drawn.image);
        else if (file.type.startsWith('image/svg')) file = await pictureFile(file);
        const image = await loadUnderlay(file);
        if (!image || plan !== original) {
            status.textContent = '';
            return;
        }
        if (showStart) replacePlan({ ...blankPlan(copy.names.untitled), underlay: image });
        else {
            remember();
            plan.underlay = image;
        }
        underlayMeasure = null;
        setView('2d');
        setTool('edit');
        status.textContent = '';
        if (!drawn) {
            finish();
            fit();
            // Asks for the scale, and finds the rooms right after.
            actions.trace_underlay();
            return;
        }
        const draft = draftFromRecognition(drawn.recognition, plan.underlay, { roomName: copy.room });
        const rooms = (draft?.rooms ?? []).filter(room => !plan.rooms.some(existing => roomContains(existing, roomInteriorPoint(room))));
        const next = rooms.length && planWithDraft(plan, { ...draft, rooms });
        if (next) plan = next;
        else if (draft) plan.underlay = draft.underlay;
        finish();
        fit();
        element('fp-save').textContent = picked.vacuumRooms.replace('{count}', number.format(next ? rooms.length : 0));
    } catch {
        status.textContent = picked.vacuumError;
    } finally {
        status.removeAttribute('data-busy');
    }
}

function openVacuumMaps() {
    if (!vacuumChoice) return;
    projectMenu.open = false;
    const maps = integration.vacuumMaps();
    if (!maps.length) {
        element(showStart ? 'fp-start-status' : 'fp-save').textContent = integration.picker.vacuumNone;
        return;
    }
    if (maps.length === 1) {
        useVacuumMap(maps[0].id);
        return;
    }
    vacuumChoice.list.replaceChildren(...maps.map(map => {
        const button = document.createElement('button');
        button.type = 'submit';
        button.value = map.id;
        button.textContent = map.name;
        return button;
    }));
    vacuumChoice.dialog.onclose = () => {
        const id = vacuumChoice.dialog.returnValue;
        if (maps.some(map => map.id === id)) useVacuumMap(id);
    };
    vacuumChoice.dialog.returnValue = '';
    vacuumChoice.dialog.showModal();
}

// What a link hands out: the plan without the image it was drawn on, which
// may show more than the plan and makes it heavy.
function projectToShare() {
    const bare = ({ underlay, ...floorPlan }) => floorPlan;
    const project = projectDocument();
    return project.floors ? { ...project, floors: project.floors.map(floor => ({ ...floor, plan: bare(floor.plan) })) } : bare(project);
}

function showShare(message = '', url = '') {
    const { create, copyLink, field, link, note } = sharePanel;
    note.textContent = message;
    note.hidden = !message;
    field.hidden = !url;
    link.value = url;
    create.hidden = Boolean(url);
    copyLink.hidden = !url;
    sharePanel.close.textContent = url ? copy.tool_done ?? copy.cancel_place : copy.cancel_place;
}

function openShare() {
    if (!sharePanel) return;
    projectMenu.open = false;
    showShare();
    sharePanel.create.disabled = false;
    sharePanel.dialog.showModal();
}

if (sharePanel) {
    sharePanel.create.addEventListener('click', async () => {
        const { create, link } = sharePanel;
        create.disabled = true;
        showShare(copy.share_busy);
        try {
            const { url } = await siteSharing.save(projectToShare());
            showShare(copy.share_ready, url);
            link.focus();
            link.select();
        } catch {
            showShare(copy.share_error);
            create.disabled = false;
        }
    });
    sharePanel.copyLink.addEventListener('click', async () => {
        const { link } = sharePanel;
        try {
            await navigator.clipboard.writeText(link.value);
            showShare(copy.share_copied, link.value);
        } catch {
            // No clipboard here: the link is selected, ready to copy by hand.
            link.focus();
            link.select();
        }
    });
}

// The plan behind a shared link, once. From then on this browser has its
// own copy of it.
async function openSharedPlan() {
    try {
        const project = await siteSharing.open();
        if (!validProject(project)) throw new Error('No plan');
        // Somebody who started drawing while it came in keeps what they drew.
        if (!showStart) return;
        replacePlan(project);
        element('fp-save').textContent = copy.share_opened ?? '';
    } catch {
        if (showStart) element('fp-start-status').textContent = copy.share_missing ?? '';
    }
}

function clearRoomMounts(roomId) {
    plan.sensors.forEach(sensor => {
        if (sensor.levelMountRoom === roomId) sensor.levelMountRoom = null;
    });
}

function cancelPlacement() {
    const returnToInspector = tool === 'move_item' && placementOpener?.closest('#fp-sidebar');
    setTool('edit');
    if (returnToInspector) root.setAttribute('data-panel', '');
    placementOpener?.focus();
    placementOpener = null;
}

const actions = {
    close_panel() {
        root.removeAttribute('data-panel');
        (simulation ? simReading : board).focus({ preventScroll: true });
    },
    start_new() {
        replacePlan(blankPlan(copy.names.untitled));
        actions.flow_room();
    },
    start_example() {
        if (integration) return;
        replacePlan(demoHome());
        testStep.focus({ preventScroll: true });
    },
    new() { if (confirm(copy.confirm)) actions.start_new(); },
    example() { if (!integration && confirm(copy.confirm)) replacePlan(demoHome()); },
    flow_room() {
        root.removeAttribute('data-panel');
        if (simulation) setSimulation(false);
        closeLibrary(false);
        setView('2d');
        setTool('edit');
        roomFormOpen = !roomFormOpen;
        element('fp-room-form-error').hidden = true;
        updateTools();
        if (roomFormOpen) element(matchMedia('(pointer: coarse)').matches ? 'fp-room-form-title' : 'fp-room-form-width').focus();
    },
    edit_add_room() { actions.flow_room(); },
    close_room_form() {
        roomFormOpen = false;
        updateTools();
        focusNext();
    },
    flow_draw() {
        roomFormOpen = false;
        setTool('room');
        board.scrollIntoView({ block: 'center' });
        board.focus({ preventScroll: true });
    },
    import() { element('fp-start-status').textContent = ''; element('fp-file').click(); },
    import_underlay() { element('fp-start-status').textContent = ''; element('fp-underlay-file').click(); },
    scale_underlay() {
        underlayMeasure = null;
        renderUnderlay();
        setTool('scale_underlay');
        board.focus({ preventScroll: true });
    },
    confirm_underlay_scale() {
        const input = element('fp-underlay-distance');
        if (!underlayMeasure || !input.reportValidity()) return;
        const next = calibrateUnderlay(plan.underlay, underlayMeasure.start, underlayMeasure.length, input.valueAsNumber);
        if (!next) {
            input.setCustomValidity(copy.invalid);
            input.reportValidity();
            input.setCustomValidity('');
            return;
        }
        remember();
        plan.underlay = next;
        underlayMeasure = null;
        finish();
        fit();
        board.focus({ preventScroll: true });
        // Rooms that were waiting for this scale go in now.
        const waiting = recognition?.pending;
        if (waiting) {
            recognition.pending = null;
            addRecognisedRooms(waiting, true).catch(error => showRecognition('idle', recognitionProblem(copy, error, root.dataset.locale)));
        } else if (tracing?.pending) {
            tracing.pending = false;
            traceUnderlay();
        }
    },
    // Finds the rooms between the walls on the image, once it has a scale.
    trace_underlay() {
        if (!tracing || !plan.underlay || tracing.busy) return;
        if (plan.underlay.width === startingWidth) {
            tracing.pending = true;
            showTracing(copy.trace_needs_scale);
            return actions.scale_underlay();
        }
        traceUnderlay();
    },
    // Two clicks: the first says where the image goes, the second sends it.
    // The request starts inside the click, so a sign-in window may open.
    recognise_underlay() {
        const underlay = plan.underlay;
        if (!recognition || !underlay || recognition.state === 'busy') return;
        if (recognition.state !== 'armed') return showRecognition('armed');
        showRecognition('busy');
        new Promise(resolve => resolve(recogniseRooms(underlay.data))).then(answer => {
            // The answer is only for the image it was asked for.
            if (plan.underlay?.data !== underlay.data) return showRecognition('idle');
            // A scale somebody measured on this image wins over the one read from it.
            const measured = plan.underlay.width !== startingWidth;
            const waiting = roomsWaitingForScale(answer?.recognition);
            if (!waiting) throw Object.assign(new Error('No rooms'), { code: 'no_rooms_found' });
            // No scale anywhere: ask for it first and add the rooms after it,
            // from this same answer.
            if (!measured && !draftFromRecognition(answer.recognition, plan.underlay)?.scaled) {
                recognition.pending = answer;
                showRecognition('idle', recognitionWaiting(copy, waiting, value => number.format(value)));
                return actions.scale_underlay();
            }
            return addRecognisedRooms(answer, measured);
        }).catch(error => showRecognition('idle', recognitionProblem(copy, error, root.dataset.locale)));
    },
    remove_underlay() {
        remember();
        delete plan.underlay;
        underlayMeasure = null;
        setTool('edit');
        finish();
    },
    export: exportPlan,
    vacuum_map: openVacuumMaps,
    room_automation: openRoomAutomation,
    sheet_image() { saveSheet('image'); },
    sheet_pdf() { saveSheet('pdf'); },
    share: openShare,
    add_upper_floor() { addFloor(1); },
    add_lower_floor() { addFloor(-1); },
    remove_floor() {
        const button = root.querySelector('[data-action="remove_floor"]');
        if (button.disabled || !building) return;
        const floors = projectFloors().filter(floor => floor.id !== building.activeFloor);
        remember();
        const staircase = building.staircase;
        if (staircase && [staircase.lower, staircase.upper].includes(building.activeFloor)) delete building.staircase;
        building = { ...building, floors, activeFloor: floors[0].id };
        plan = floors[0].plan;
        showFloor(floors[0].id);
    },
    async open_advisor() {
        if (integration) return;
        stopAutoWalk();
        walkControls.stop();
        const { openAdvisor } = await import('./floor-planner-advice-ui');
        if (element('fp-advisor').open) return;
        openAdvisor(plan, currentRoom(), copy, root.dataset.locale, (proposals, replaceRooms) => {
            const keep = plan.sensors.filter(sensor => !replaceRooms.has(roomForDevice(plan.rooms, sensor)?.id)
                || proposals.some(item => sameSensorPlacement(sensor, item)));
            const removed = new Set(plan.sensors.filter(sensor => !keep.includes(sensor)).map(sensor => sensor.id));
            const added = [];
            const upgrades = new Set();
            for (const item of proposals) {
                const existing = [...keep, ...added].find(sensor => sameSensorPlacement(sensor, item));
                if (existing) {
                    if (item.climate && !existing.climate) upgrades.add(existing.id);
                    continue;
                }
                added.push({ id: newId(), ...item });
            }
            const count = added.length + upgrades.size + removed.size;
            if (!count) return 0;
            const next = { ...plan, sensors: [...keep, ...added].map(sensor =>
                upgrades.has(sensor.id) ? { ...sensor, climate: true } : sensor) };
            if (removed.size && plan.zones) next.zones = plan.zones.map(zone =>
                removed.has(zone.sensorId) ? { ...zone, sensorId: null } : zone);
            if (!validPlan(next)) return -1;
            if (simulation) setSimulation(false);
            remember();
            plan = next;
            selected = added[0]?.id ?? upgrades.values().next().value;
            setTool('edit');
            finish();
            showPanel('outline');
            return count;
        });
    },
    catalog_advice() {
        closeLibrary();
        return actions.open_advisor();
    },
    recover_file() { if (unreadableDraft !== null) download(unreadableDraft, 'sensor-plan-origineel.json'); },
    replace_saved() {
        if (unreadableDraft !== null && confirm(copy.recovery_confirm)) save(true);
    },
    cancel_place: cancelPlacement,
    close_furniture() { furnitureDialog.close(); },
    move_furniture() {
        placementOpener = root.querySelector('[data-action="move_furniture"]');
        startFurniturePlacement('move_furniture');
    },
    move_item() {
        placementOpener = root.querySelector('[data-action="move_item"]');
        root.removeAttribute('data-panel');
        setView('2d');
        setTool('move_item');
        element('fp-placement-bar').scrollIntoView({ block: 'start' });
        board.focus({ preventScroll: true });
    },
    duplicate_furniture() {
        const { item } = selectedItem();
        const { id, ...values } = item;
        makeItem('furniture', { ...values, x: Math.min(100, item.x + .25), y: Math.min(100, item.y + .25) });
    },
    fit,
    zoom_in: () => zoom(.8),
    zoom_out: () => zoom(1.25),
    // The zoom bar on the map: the same in 2D and in 3D.
    map_zoom_in: () => view === '3d' ? actions.space_zoom_in() : actions.zoom_in(),
    map_zoom_out: () => view === '3d' ? actions.space_zoom_out() : actions.zoom_out(),
    map_fit: () => view === '3d' ? actions.reset_view() : fit(),
    view_2d() { stopStairWalk(); setView('2d'); },
    view_3d() { stopStairWalk(); setView('3d'); },
    turn_view() {
        walkControls.stop();
        spaceCamera = { ...spaceCamera, yaw: (spaceCamera.yaw + Math.PI / 2) % (Math.PI * 2) };
        renderSpatialDrawing();
    },
    reset_view() {
        walkControls.stop();
        spaceCamera = defaultSpaceCamera;
        spaceZoom = 1;
        spaceFollow = false;
        renderSpatialDrawing();
    },
    space_zoom_in: () => zoomSpace(1.28),
    space_zoom_out: () => zoomSpace(1 / 1.28),
    wall_mode() {
        wallMode = wallModes[(wallModes.indexOf(wallMode) + 1) % wallModes.length];
        rememberViewPreference('fp-wall-mode', wallMode);
        renderViewSwitches();
        if (view === '3d') renderSpatialDrawing();
    },
    daylight() {
        daylight = daylights[(daylights.indexOf(daylight) + 1) % daylights.length];
        rememberViewPreference('fp-daylight', daylight);
        renderViewSwitches();
        if (view === '3d') renderSpatialDrawing();
    },
    follow_person() {
        spaceFollow = !spaceFollow;
        spaceZoom = spaceFollow ? Math.max(1.7, spaceZoom) : 1;
        zoomSpace(1);
    },
    test_person() {
        if (integration) return;
        if (simulation) reviewedCoverage = Boolean(plan.sensors.length);
        if (!simulation && allFloors && !plan.rooms.length) {
            const floor = projectFloors().find(entry => entry.plan.rooms.length);
            if (!floor) return;
            showFloor(floor.id, true);
        }
        setSimulation(!simulation);
        if (!simulation) focusNext();
    },
    preview_walk() { actions.test_person(); },
    repeat_test() { actions.test_person(); },
    next_order() { openOrder(orderStep); },
    inspect_selection() {
        const editing = element('fp-selection-jump').getAttribute('aria-controls') === 'fp-properties';
        if (editing) showInspectorStart();
        else showPanel('outline');
        const target = element(editing ? 'fp-inspector-title' : 'fp-outline');
        target.scrollIntoView({ block: 'start' });
        target.focus({ preventScroll: true });
    },
    room_rectangle() {
        setTool('room');
        board.focus({ preventScroll: true });
    },
    room_outline() {
        setTool('outline_room');
        board.focus({ preventScroll: true });
    },
    edit_outline(corner = 0) {
        const { type, item } = selectedItem();
        if (type !== 'rooms') return;
        setView('2d');
        setTool('edit_outline');
        roomDraft = roomCorners(item);
        draftCorner = corner;
        updateTools();
        renderRoomDraft();
        if (compactLibrary.matches) {
            root.removeAttribute('data-panel');
            board.scrollIntoView({ block: 'center' });
        }
        board.focus({ preventScroll: true });
    },
    toggle_door() {
        const door = plan.doors.find(item => item.id === selected);
        if (door) toggleDoor(door);
    },
    move_opening() {
        const { type, item } = selectedItem();
        if (!['doors', 'windows', 'mirrors'].includes(type)) return;
        setView('2d');
        setTool(type.slice(0, -1), item.id);
        board.focus({ preventScroll: true });
    },
    zone_part() {
        const { type, item } = selectedItem();
        if (type !== 'zones') return;
        setView('2d');
        element('fp-zone-type').value = item.type;
        setTool('zone', item.id);
        board.focus({ preventScroll: true });
    },
    edit_zone_part() {
        const { type, item } = selectedItem();
        if (type !== 'zones') return;
        const index = Number(element('fp-zone-part-index')?.value ?? 0);
        setView('2d');
        setTool('edit_outline', String(index));
        roomDraft = [...item.parts[index]];
        updateTools();
        renderRoomDraft();
        if (matchMedia('(max-width: 760px)').matches) board.scrollIntoView({ block: 'center' });
        board.focus({ preventScroll: true });
    },
    remove_zone_part() {
        const { type, item } = selectedItem();
        if (type !== 'zones' || item.parts.length < 2) return;
        const index = Number(element('fp-zone-part-index')?.value ?? 0);
        remember();
        item.parts = item.parts.filter((_, i) => i !== index);
        finish();
    },
    save_outline: saveRoomDraft,
    undo_corner() {
        roomDraft.pop();
        updateTools();
        renderRoomDraft();
        board.focus({ preventScroll: true });
    },
    remove_corner() {
        if (roomDraft.length <= 3) return;
        roomDraft.splice(draftCorner, 1);
        draftCorner = Math.min(draftCorner, roomDraft.length - 1);
        updateTools();
        renderRoomDraft();
        board.focus({ preventScroll: true });
    },
    cancel_outline() {
        setTool('edit');
        board.focus({ preventScroll: true });
    },
    stop_tool() { actions.cancel_outline(); },
    auto_walk() {
        const wasAutomatic = (autoWalk && !autoWalk.test) || stairWalk?.repeat;
        stopStairWalk();
        stopAutoWalk();
        if (!wasAutomatic) startAutoWalk();
    },
    take_stairs() {
        startStairWalk();
    },
    stop_stairs() {
        stopStairWalk();
        focusWalkMap();
    },
    confirm_stair() {
        if (!stairPrompt.hidden && startStairWalk(false, activeWalker)) focusWalkMap();
    },
    dismiss_stair() {
        if (stairPrompt.hidden) return;
        currentWalker().dismissStairPrompt = true;
        updateStairPrompt();
        focusWalkMap();
    },
    test_smoke() { startWalkTest('smoke'); },
    test_fall() { startWalkTest('fall'); },
    close_sensor_edit() { sensorEdit.close(); },
    close_pdf_pages() { pdfPages.close(); },
    close_crop() { imageParts.close(); },
    second_person() { toggleWalker('woman'); },
    child_person() { toggleWalker('child'); },
    show_readings() {
        root.setAttribute('data-panel', '');
        const title = element('fp-simulation-title');
        title.scrollIntoView({ block: 'start' });
        title.focus({ preventScroll: true });
    },
    show_walk_map() {
        root.removeAttribute('data-panel');
        simReading.focus({ preventScroll: true });
    },
    clear_walk() {
        restartWalk(currentWalker().person);
        element('fp-route-title').focus({ preventScroll: true });
    },
    coverage() { showCoverage = !showCoverage; updateTools(); renderDrawing(); },
    heatmap() {
        showHeatmap = !showHeatmap;
        heatToggle.setAttribute('aria-pressed', String(showHeatmap));
        renderDrawing();
    },
    measures() { showMeasures = !showMeasures; updateTools(); renderDrawing(); },
    rotate_room() {
        const { type, item } = selectedItem();
        if (type !== 'rooms') return;
        const next = rotatedRoom(plan, item);
        if (!next) { element('fp-save').textContent = copy.invalid; return; }
        remember();
        plan = next;
        finish();
        fit();
    },
    undo() {
        if (['outline_room', 'zone'].includes(tool) && roomDraft.length) {
            actions.undo_corner();
            return;
        }
        if (tool === 'edit_outline') {
            actions.cancel_outline();
            return;
        }
        if (!history.length) return;
        reviewedCoverage = false;
        recentUndo = null;
        if (simulation) setSimulation(false);
        future.push(JSON.stringify(projectDocument()));
        readProject(JSON.parse(history.pop()));
        allFloors = false;
        underlayMeasure = null;
        if (!selectedItem().item) selected = null;
        fit();
        finish();
    },
    redo() {
        if (!future.length) return;
        reviewedCoverage = false;
        recentUndo = null;
        if (simulation) setSimulation(false);
        history.push(JSON.stringify(projectDocument()));
        readProject(JSON.parse(future.pop()));
        allFloors = false;
        underlayMeasure = null;
        if (!selectedItem().item) selected = null;
        fit();
        finish();
    },
    undo_recent() {
        actions.undo();
        board.focus({ preventScroll: true });
    },
    rotate() {
        const { item, type } = selectedItem();
        if (!item || (type === 'sensors' && isWallMounted(item))) return;
        remember();
        item.angle = (item.angle + 90) % 360;
        finish();
    },
    delete() {
        const { type, item } = selectedItem();
        if (!item) return;
        if (type === 'rooms' && roomRemoval) askRoomRemoval(item);
        else removeSelected();
    },
};

// Asks whether the room may go, and removes it on a yes.
function askRoomRemoval(room) {
    if (roomRemoval.open) return;
    element('fp-room-delete-text').textContent = copy.room_delete_text.replaceAll(':name', room.name);
    roomRemoval.returnValue = '';
    roomRemoval.onclose = () => {
        roomRemoval.onclose = null;
        if (roomRemoval.returnValue === 'delete' && selectedItem().item?.id === room.id) removeSelected();
        if (view === '2d') board.focus({ preventScroll: true });
    };
    roomRemoval.showModal();
}

function removeSelected() {
    {
        const { type, item } = selectedItem();
        if (!item) return;
        remember();
        plan[type] = plan[type].filter(entry => entry.id !== item.id);
        if (type === 'rooms') {
            clearRoomMounts(item.id);
            for (const key of ['windows', 'mirrors', 'zones']) if (plan[key]) plan[key] = plan[key].filter(entry => entry.roomId !== item.id);
            plan.doors = plan.doors.map(door => door.roomId === item.id ? { ...door, roomId: undefined } : door);
        }
        if (type === 'sensors' && plan.zones) plan.zones = removeZonesOwnedBySensor(plan.zones, item.id);
        selected = null;
        recentUndo = copy.undo_removed;
        finish();
    }
}

root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.floorChoice) {
        if (button.getAttribute('aria-current') === 'true') closeFloorMenu();
        else showFloor(button.dataset.floorChoice);
        return;
    }
    const fromToolbox = toolbox.contains(button);
    const historyAction = fromToolbox && ['undo', 'redo'].includes(button.dataset.action);
    if (fromToolbox && !historyAction) {
        toolbox.open = false;
        drawingMenu.open = false;
        toolbox.querySelector('summary').focus({ preventScroll: true });
    }
    if (viewMenu.contains(button) && !['zoom_in', 'zoom_out', 'space_zoom_in', 'space_zoom_out', 'wall_mode', 'daylight'].includes(button.dataset.action)) {
        viewMenu.open = false;
        viewMenu.querySelector('summary').focus({ preventScroll: true });
    }
    if (button.dataset.catalogMount) {
        catalogMount = button.dataset.catalogMount;
        filterCatalog();
        return;
    }
    if (button.dataset.action === 'toggle_area_filter') {
        catalogAreaOnly = !catalogAreaOnly;
        renderHaCatalog();
        return;
    }
    if (simulation && button.closest('.fp-drawing')) button.focus({ preventScroll: true });
    const { personMove, personPose, walker } = button.dataset;
    if (walker) {
        selectWalker(walker);
        if (event.detail > 0) focusWalkMap();
        return;
    }
    if (personMove) {
        if (event.detail === 0) walkControls.tap(personMove);
        return;
    }
    if (personPose && currentWalker()) {
        stopAutoWalk();
        walkControls.stop();
        const { person } = currentWalker();
        person.pose = personPose;
        currentWalker().readings = personSignals(plan, person, walkSensors, walkFurniture, walkSightNow());
        renderPerson();
        return;
    }
    if (button.matches('[role="tab"]')) {
        if (button.id === 'fp-tab-properties') showInspectorStart();
        else showPanel('outline');
        return;
    }
    const { action, model, nudge, select, selectRoom, tool: next } = button.dataset;
    if (action === 'furniture_library') {
        openFurnitureLibrary(fromToolbox ? toolbox.querySelector('summary') : button);
        return;
    }
    if (button.dataset.furniture) {
        placementOpener = furnitureOpener;
        furnitureDialog.close();
        startFurniturePlacement('furnish', button.dataset.furniture);
        return;
    }
    if (nudge) {
        const { item } = selectedItem();
        const [key, delta] = { left: ['x', -.1], right: ['x', .1], up: ['y', -.1], down: ['y', .1] }[nudge];
        const next = Number((item[key] + delta).toFixed(4));
        if (Math.abs(next) <= 100) {
            const position = alignSensorToWall({ ...item, [key]: next }, roomForDevice(plan.rooms, item));
            if (position.x === item.x && position.y === item.y && position.angle === item.angle) return;
            remember();
            Object.assign(item, position);
            if (item.levelMountRoom) item.levelMountRoom = null;
            finish();
            announcePosition(item, item);
            element('fp-inspector').querySelector(`[data-nudge="${nudge}"]`).focus({ preventScroll: true });
        }
        return;
    }
    if (action === 'place_center' || action === 'place_preview') {
        if (action === 'place_preview' && placingOpening()) {
            placeOpening();
            if (tool === 'edit') board.focus({ preventScroll: true });
            return;
        }
        const point = action === 'place_center' ? placementOrigin() : placementPoint;
        if (!point) return;
        const firstSensor = tool === 'place' && !plan.sensors.length;
        drawAt(point);
        if (firstSensor && plan.sensors.length) return;
        if (view === '2d') board.focus({ preventScroll: true });
        else element('fp-tab-properties').focus({ preventScroll: true });
        return;
    }
    if (selectRoom) {
        selected = selectRoom;
        setTool('edit');
        render();
        showInspectorStart();
        focusCeilingType();
        return;
    }
    if (action === 'library' || action === 'flow_sensor' || action === 'next_extra_sensor') {
        if (simulation) setSimulation(false);
        roomFormOpen = false;
        updateTools();
        if (libraryIsOpen()) closeLibrary();
        else openLibrary(fromToolbox ? toolbox.querySelector('summary') : button);
        return;
    }
    if (action === 'close_library') {
        closeLibrary();
        return;
    }
    if (action) {
        const restore = document.activeElement === button;
        if (projectMenu.contains(button)) {
            projectMenu.open = false;
            if (restore) projectTrigger.focus({ preventScroll: true });
        }
        actions[action]();
        if (simTools.contains(button)) {
            simTools.open = false;
            focusWalkMap();
        }
        if (historyAction && button.disabled) {
            (toolbox.querySelector('.fp-history button:not(:disabled)') ?? toolbox.querySelector('summary')).focus({ preventScroll: true });
        }
        if (restore && action === 'rotate') root.querySelector('[data-action="rotate"]')?.focus({ preventScroll: true });
        if (restore && action === 'delete') {
            showPanel('outline');
            element('fp-tab-outline').focus({ preventScroll: true });
        }
    }
    if (next) {
        roomFormOpen = false;
        setTool(chosenTool(tool, next));
        if (fromToolbox || (!event.detail && next !== 'edit')) board.focus({ preventScroll: true });
    }
    const registered = integration && haDevice(button.dataset.haDevice);
    if (integration ? registered && !haPlacements().has(registered.id) : model) {
        const strictArea = catalogAreaOnly ? roomById(catalogRoomId)?.haAreaId ?? null : null;
        placementOpener = libraryOpener ?? libraryButton;
        const point = quickPlacement;
        closeLibrary(false);
        root.removeAttribute('data-panel');
        setView('2d');
        setTool('place', registered?.model ?? model, registered || null);
        placementAreaId = strictArea;
        if (point) {
            const firstSensor = !plan.sensors.length;
            drawAt(point);
            if (firstSensor && plan.sensors.length) return;
        }
        if (matchMedia('(max-width: 760px)').matches) canvas.scrollIntoView({ block: 'center' });
        board.focus({ preventScroll: true });
    }
    if (select) {
        selected = select;
        setTool('edit');
        render();
        showInspectorStart();
        element('fp-tab-properties').focus({ preventScroll: true });
        if (event.detail && matchMedia('(max-width: 760px)').matches) {
            element('fp-inspector').closest('.fp-panel').scrollIntoView({ block: 'nearest' });
        }
    }
});

function readField(item, key) {
    if (key === 'ceilingType') return item.ceiling?.type ?? 'flat';
    if (key === 'levelMount') return Boolean(item.levelMountRoom && item.levelMountRoom === currentRoom()?.id);
    if (key === 'ceilingHigh') return item.ceiling?.high;
    if (key === 'ceilingDirection') return item.ceiling?.direction;
    if (key === 'mountHeight') return item.mountHeight ?? 1.4;
    if (key === 'tilt' || key === 'pan') return item[key] ?? 0;
    if (key === 'sensorId') return item.sensorId ?? '';
    return item[key];
}

function updateField(input) {
    const { item, type } = selectedItem();
    if (!item || !input.validity.valid) {
        input.reportValidity();
        return;
    }
    const key = input.dataset.field;
    const raw = input.value.trim();
    const decimal = input.hasAttribute('data-decimal');
    const value = decimal ? (/^\d+(?:[.,]\d+)?$/.test(raw) ? Number(raw.replace(',', '.')) : NaN)
        : input.type === 'number' ? input.valueAsNumber : input.type === 'checkbox' ? input.checked : raw;
    const original = readField(item, key);
    if (value === original) return;
    const previous = JSON.stringify(plan);
    const savedItem = { ...item };
    const group = type === 'rooms' && ['x', 'y'].includes(key) ? Object.values(roomContents(plan, item)).flat() : null;
    const isCeilingField = key.startsWith('ceiling') || (key === 'height' && type === 'rooms');
    if (key === 'ceilingType') {
        if (value === 'flat') item.ceiling = null;
        else {
            const max = ceilingHeightLimits[1];
            if (item.height === max) item.height = max - .6;
            const direction = item.ceiling?.direction ?? 'x+';
            item.ceiling = { type: value, high: item.ceiling?.high ?? Math.min(max, item.height + .6),
                direction: value === 'gable' ? direction[0] + '+' : direction };
        }
    } else if (key === 'floorFinish' || key === 'wallColor') {
        if (value) item[key] = value;
        else delete item[key];
    } else if (key === 'levelMount') {
        item.levelMountRoom = value ? currentRoom()?.id : null;
    } else if (key === 'ceilingHigh' || key === 'ceilingDirection') {
        item.ceiling = { ...item.ceiling, [key === 'ceilingHigh' ? 'high' : 'direction']: value };
    } else if (group) {
        for (const entry of group) Object.assign(entry, translatedItem(entry, key === 'x' ? value - original : 0, key === 'y' ? value - original : 0));
    } else if (type === 'sensors' && (key === 'installation' || key === 'pan' || ['x', 'y'].includes(key) && isWallMounted(item))) {
        Object.assign(item, alignSensorToWall({ ...item, [key]: value }, roomForDevice(plan.rooms, item)));
    } else if (key === 'width' && ['windows', 'mirrors'].includes(type)) {
        Object.assign(item, roomOpening(currentRoom(), item, value));
        input.value = item.width;
    } else if (key === 'width' && type === 'doors') {
        const edge = doorWall(item);
        if (edge && edge.length >= openingDefaults.door.min) {
            const reversed = Math.cos((item.angle - edge.angle) * Math.PI / 180) < 0;
            Object.assign(item, wallOpeningPosition(edge, Math.min(value, edge.length), reversed));
        } else item.width = value;
        input.value = item.width;
    } else {
        item[key] = key === 'sensorId' ? value || null : value;
    }
    // A filter that is switched on starts as deep as the room in front of its mirror.
    // The 2 m it may carry is what was filled in before anybody chose a depth.
    if (type === 'mirrors' && key === 'protectionEnabled' && value && [undefined, 2].includes(item.reflectionDepthM)) item.reflectionDepthM = reflectionDepth(item);
    // A sensor that looks level, or straight out of its wall, carries no tilt or turn.
    if (type === 'sensors') {
        if (!item.tilt) delete item.tilt;
        if (!item.pan || !isWallMounted(item)) delete item.pan;
    }
    const validationPlan = key === 'ceilingType' && value === 'flat'
        ? { ...plan, sensors: plan.sensors.map(sensor => sensor.levelMountRoom === item.id ? { ...sensor, levelMountRoom: null } : sensor) }
        : plan;
    if (!validPlan(validationPlan)) {
        if (group) plan = JSON.parse(previous);
        Object.assign(item, savedItem);
        if (!Object.hasOwn(savedItem, key)) delete item[key];
        input.value = decimal ? number.format(original) : original;
        const message = isCeilingField ? copy.ceiling_invalid : copy.invalid;
        input.setCustomValidity(message);
        input.reportValidity();
        input.setCustomValidity('');
        element('fp-hint').textContent = message;
        return;
    }
    if (isCeilingField) clearRoomMounts(item.id);
    if (type === 'rooms' && key === 'name' && item.useSampleName) item.useSampleName = false;
    if (type === 'sensors' && (key === 'x' || key === 'y') && item.levelMountRoom) item.levelMountRoom = null;
    if (decimal) input.value = number.format(value);
    remember(previous);
    save();
    updateTools();
    renderDrawing();
    renderHandoff();
    const row = root.querySelector(`[data-select="${item.id}"]`);
    if (key === 'name') {
        if (type === 'rooms' && row) row.querySelector('span')?.replaceChildren(value);
        element('fp-inspector-title').textContent = value;
    }
    if (type === 'furniture') renderFurnitureList();
    if (type === 'rooms') renderRoomMetrics(item);
    if (type === 'zones' && key === 'name') renderLists();
    if (key === 'radar') {
        row?.querySelector('small')?.replaceChildren(radarLabel(item));
        updateRangeKey(item);
    }
    // Turning the mirror filter on or off adds or removes the depth field.
    if ((type === 'sensors' && (key === 'installation' || ['x', 'y'].includes(key) && isWallMounted(item)))
        || (type === 'mirrors' && key === 'protectionEnabled')) {
        const restore = document.activeElement === input;
        renderInspector();
        if (restore) element('fp-inspector').querySelector(`[data-field="${key}"]`)?.focus({ preventScroll: true });
    }
    if (type === 'sensors') updateSensorDetails(item);
    if (key === 'ceilingType') {
        const restore = document.activeElement === input;
        renderInspector();
        if (restore) focusCeilingType();
    } else if (type === 'rooms' && item.ceiling && (isCeilingField || key === 'width' || key === 'depth')) {
        element('fp-ceiling-profile').innerHTML = crossSection(item);
    }

}

root.addEventListener('change', async ({ target }) => {
    if (integration && (target.id === 'fp-room-ha-area' || target.id === 'fp-room-ha-floor')) {
        const { type, item } = selectedItem();
        if (type !== 'rooms') return;
        const next = target.id === 'fp-room-ha-area'
            ? roomWithHomeAssistantArea(item, target.value, homeAssistantAreas())
            : roomWithHomeAssistantFloor(item, target.value, homeAssistantAreas());
        if (JSON.stringify(next) === JSON.stringify(item)) return;
        remember();
        plan.rooms = plan.rooms.map(room => room.id === item.id ? next : room);
        selected = next.id;
        finish();
        showInspectorStart();
        element(target.id)?.focus({ preventScroll: true });
        return;
    }
    if (target.id === 'fp-room-floor' && building) {
        const { type, item } = selectedItem();
        if (type !== 'rooms' || target.value === building.activeFloor) return;
        const project = moveRoomToFloor(projectDocument(), item, target.value);
        if (!project) {
            target.value = building.activeFloor;
            element('fp-save').textContent = copy.invalid;
            return;
        }
        remember();
        readProject(project);
        showFloor(project.activeFloor);
        selected = item.id;
        render();
        showInspectorStart();
        return;
    }
    if (target.id === 'fp-zone-type' && tool === 'zone') {
        roomDraft = [];
        updateTools();
        renderRoomDraft();
        return;
    }
    if (target.id === 'fp-floor-name') {
        const name = target.value.trim();
        const floor = projectFloors().find(floor => floor.id === (building?.activeFloor ?? 'ground'));
        if (!name || name === floorLabel(floor, copy)) { renderFloors(); return; }
        remember();
        const floors = projectFloors().map(entry => entry.id === floor.id ? { ...entry, name } : entry);
        building = { ...building, format: buildingFormat, version: 1, name: building?.name ?? plan.name, floors, activeFloor: floor.id };
        finish();
        return;
    }
    if (target.dataset.cornerAxis && tool === 'edit_outline') {
        if (target.validity.valid) {
            const point = [...roomDraft[draftCorner]];
            point[target.dataset.cornerAxis === 'x' ? 0 : 1] = target.valueAsNumber;
            roomDraft[draftCorner] = point;
        } else {
            target.reportValidity();
        }
        renderRoomDraft();
        return;
    }
    if (target.id === 'fp-underlay-file' && target.files[0]) {
        const file = target.files[0], original = plan;
        const status = element(showStart ? 'fp-start-status' : 'fp-save');
        target.value = '';
        // Reading a PDF takes a moment: the status says so, not as an error.
        const opening = underlayKind(file) === 'pdf';
        status.toggleAttribute('data-busy', opening);
        if (opening) status.textContent = copy.underlay_pdf_opening;
        try {
            const image = await loadUnderlay(file, choosePdfPage, imageParts ? chooseImagePart : undefined);
            // Nothing changes when choosing the page or the part was cancelled.
            if (!image || plan !== original) {
                status.textContent = '';
                return;
            }
            if (showStart) {
                replacePlan({ ...blankPlan(copy.names.untitled), underlay: image });
            } else {
                remember();
                plan.underlay = image;
            }
            underlayMeasure = null;
            setView('2d');
            setTool('edit');
            finish();
            fit();
            status.textContent = '';
            element('fp-save').textContent = copy.underlay_ready;
        } catch (error) {
            status.textContent = copy[underlayMessage(error)];
        } finally {
            status.removeAttribute('data-busy');
        }
        return;
    }
    if (['fp-underlay-opacity', 'fp-underlay-rooms'].includes(target.id) && plan.underlay) {
        remember();
        plan.underlay[target.id === 'fp-underlay-rooms' ? 'roomTransparency' : 'opacity'] = target.valueAsNumber;
        save();
        renderUnderlay();
        return;
    }
    if (target.id === 'fp-include-furniture') {
        if (currentWalker()) {
            walkControls.stop();
            walkFurniture = target.checked ? prepareFurnitureOcclusion(plan.furniture) : [];
            for (const [name, walker] of walkersOnFloor()) {
                walkers[name] = startWalker(walker.person, name);
            }
            renderPerson();
        }
        return;
    }
    if (target.id === 'fp-furniture-category') {
        renderFurnitureCatalog();
        return;
    }
    if (target.id === 'fp-radar-focus') {
        beamChoice = target.value;
        beamKey = null;
        renderPerson();
        return;
    }
    if (target.id === 'fp-sim-room' && currentWalker()) {
        const room = plan.rooms.find(room => room.id === target.value);
        if (room) {
            restartWalk(stairSafeStart(currentStairTrip(), personAt(room, currentWalker().person.pose)));
            if (view === '2d') fit();
        }
        return;
    }
    if (target.dataset.field) updateField(target);
    if (target.id === 'fp-name') {
        const name = target.value.trim();
        const previous = building?.name ?? plan.name;
        if (name && name !== previous) {
            remember();
            if (building) building.name = name;
            else plan.name = name;
            save();
            updateTools();
        } else {
            target.value = previous;
        }
    }
    if (target.id === 'fp-file' && target.files[0]) {
        const file = target.files[0];
        target.value = '';
        try {
            // A Sweet Home 3D project is a ZIP archive, often large with its
            // textures; only the home inside it is read.
            const sweetHome = await import('./floor-planner-sh3d.mjs');
            let result;
            if (await sweetHome.isSweetHome(file)) result = { ...await sweetHome.importSweetHome(file, copy), sweetHome: true };
            else {
                if (file.size > maxProjectFileSize) throw new Error('File size');
                const data = JSON.parse(await file.text());
                result = validProject(data) ? { project: data } : (await import('./floor-planner-import.mjs')).importRoomGeometry(data, copy);
            }
            if (showStart || confirm(copy.confirm)) {
                if (integration) {
                    const used = new Set();
                    for (const floor of result.project.floors ?? [{ plan: result.project }]) {
                        const original = floor.plan.sensors;
                        floor.plan.sensors = original.flatMap(sensor => {
                            const device = haDevice(sensor.haDevice);
                            if (!device || used.has(device.id) || devices[sensor.model].mount !== device.mount) return [];
                            used.add(device.id);
                            return [{ ...sensor, haDevice:device.id, radar:device.radar }];
                        });
                        const retained = new Set(floor.plan.sensors.map(sensor => sensor.id));
                        if (floor.plan.zones) floor.plan.zones = removeOrphanedSensorZones(floor.plan.zones, retained);
                    }
                }
                replacePlan(result.project);
                focusNext();
                const skipped = result.sweetHome && result.review ? copy.import_sh3d_review : '';
                if (integration && !appPlanner) element('fp-save').textContent = [integration.picker.importNote, skipped].filter(Boolean).join(' ');
                else if (result.sweetHome) element('fp-save').textContent = [copy.import_sh3d_done, skipped].filter(Boolean).join(' ');
                else if (result.review) element('fp-save').textContent = result.backup ? copy.import_ha_notes : copy.import_scan_notes;
            }
        } catch (error) {
            element(showStart ? 'fp-start-status' : 'fp-save').textContent = error?.code === 'sh3d_old' && copy.import_sh3d_old
                ? copy.import_sh3d_old : copy.import_error;
        }
    }
});

root.addEventListener('keydown', event => {
    if (liveMode) return;
    if (event.target.closest('dialog')) return;
    // Delete or Backspace removes the selected room, after a question. Not while typing or drawing.
    if (['Delete', 'Backspace'].includes(event.key) && !event.repeat && roomRemoval && tool === 'edit' && !simulation
        && !event.ctrlKey && !event.metaKey && !event.altKey
        && !event.target.closest('input, textarea, select, [contenteditable]')) {
        const { type, item } = selectedItem();
        if (type === 'rooms') {
            event.preventDefault();
            askRoomRemoval(item);
            return;
        }
    }
    if (event.key === 'Enter' && !event.isComposing && ['fp-floor-name', 'fp-name'].includes(event.target.id)) {
        event.preventDefault();
        const trigger = event.target.id === 'fp-floor-name' ? floorTrigger : projectTrigger;
        trigger.focus({ preventScroll: true });
        return;
    }
    const marker = sensorMarkerAt(event.target);
    if (marker && tool === 'edit' && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openSensorEdit(marker.dataset.item);
        return;
    }
    if (event.target.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const properties = event.key === 'End' || (event.key !== 'Home' && event.target.id === 'fp-tab-outline');
        const tab = element(properties ? 'fp-tab-properties' : 'fp-tab-outline');
        tab.click();
        tab.focus();
        return;
    }
    if (event.key === 'Escape') {
        const simMenu = simMenus.find(menu => menu.open);
        if (simMenu) {
            event.preventDefault();
            simMenu.open = false;
            simMenu.querySelector('summary').focus({ preventScroll: true });
            return;
        } else if (floorMenu.open) {
            event.preventDefault();
            closeFloorMenu();
            return;
        } else if (projectMenu.open) {
            event.preventDefault();
            projectMenu.open = false;
            projectTrigger.focus({ preventScroll: true });
        } else if (libraryIsOpen()) {
            event.preventDefault();
            closeLibrary();
        } else if (drawingMenu.open) {
            event.preventDefault();
            drawingMenu.open = false;
            drawingMenu.querySelector('summary').focus({ preventScroll: true });
        } else if (viewMenu.open || toolbox.open) {
            event.preventDefault();
            const menu = viewMenu.open ? viewMenu : toolbox;
            menu.open = false;
            menu.querySelector('summary').focus({ preventScroll: true });
        } else if (roomFormOpen) {
            event.preventDefault();
            actions.close_room_form();
        } else if (simulation) {
            event.preventDefault();
            if (!stairPrompt.hidden) actions.dismiss_stair();
            else if (stairWalk) actions.stop_stairs();
            else actions.test_person();
            return;
        } else if (placingOpening() || ['place', 'furnish', 'move_furniture', 'move_item'].includes(tool)) cancelPlacement();
        else setTool('edit');
    }
    if (event.target.closest('input, select, textarea, [contenteditable]')) return;
    if (simulation) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || !event.target.closest('.fp-drawing')) return;
        if (event.key === 'Enter' && !stairPrompt.hidden &&
            !event.target.closest('summary, a, button:not([data-action="confirm_stair"]):not([data-person-move])')) {
            event.preventDefault();
            if (!event.repeat) actions.confirm_stair();
            return;
        }
        const key = event.key.toLowerCase();
        const movement = Object.hasOwn(direction, event.key) ? event.key : Object.hasOwn(wasd, key) ? wasd[key] : null;
        if (movement && currentWalker() && !event.target.closest('.fp-sim-menu[open]')) {
            event.preventDefault();
            if (!event.repeat && !stairWalk) {
                focusWalkMap();
                walkControls.press(event.code || event.key, movement, activeWalker);
            }
        }
        return;
    }
    if ((event.ctrlKey || event.metaKey) && ['y', 'z'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        if (event.key.toLowerCase() === 'y' || event.shiftKey) actions.redo();
        else actions.undo();
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing || event.repeat
        || !event.target.closest('.fp-drawing') || libraryIsOpen() || drawingMenu.open) return;
    const key = event.key.toLowerCase();
    if (key === 'q') {
        setView(view === '2d' ? '3d' : '2d');
        (view === '2d' ? board : viewMenu.querySelector('summary')).focus({ preventScroll: true });
    } else if (key === 'd') openLibrary(board);
    else if (key === 'f') {
        if (view === '2d') fit();
        else actions.reset_view();
    } else {
        const next = { v: 'edit', h: 'pan', r: 'room', w: 'wall' }[key];
        if (!next || view !== '2d') return;
        setTool(next);
        board.focus({ preventScroll: true });
    }
    event.preventDefault();
});

board.addEventListener('keydown', event => {
    if (simulation || liveMode) return;
    const midpoint = event.target.closest('[data-room-midpoint]');
    if (midpoint && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        const room = selectedRoomForHandles();
        if (!room) return;
        const points = roomCorners(room);
        const index = insertWallMidpoint(points, Number(midpoint.dataset.roomMidpoint));
        const geometry = outlineBounds(points);
        if (geometry && applyRoomOutline(room, geometry)) {
            recentUndo = copy.room_midpoint_saved;
            finish();
            roomHandles.children[index]?.focus({ preventScroll: true });
        }
        return;
    }
    const handle = event.target.closest('[data-room-handle]');
    if (handle && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        actions.edit_outline(Number(handle.dataset.roomHandle));
        return;
    }
    const offset = direction[event.key];
    if (tool === 'edit_outline') {
        if (event.key === 'PageUp' || event.key === 'PageDown') {
            event.preventDefault();
            draftCorner = (draftCorner + (event.key === 'PageUp' ? -1 : 1) + roomDraft.length) % roomDraft.length;
            updateTools();
            renderRoomDraft();
        } else if (offset) {
            event.preventDefault();
            const [x, y] = roomDraft[draftCorner];
            const step = event.altKey ? .05 : .25;
            const point = finePoint({ x: x + offset[0] * step, y: y + offset[1] * step });
            roomDraft[draftCorner] = [point.x, point.y];
            renderRoomDraft();
            announcePosition(point);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            saveRoomDraft();
        }
        return;
    }
    if (['outline_room', 'zone'].includes(tool) && event.key === 'Backspace') {
        event.preventDefault();
        actions.undo_corner();
        return;
    }
    if (tool === 'move_item') return;
    if (event.key === 'Enter' && !['edit', 'pan'].includes(tool)) {
        event.preventDefault();
        if (placingOpening() && placementPoint) placeOpening();
        else if (['outline_room', 'zone'].includes(tool) && event.shiftKey) saveRoomDraft();
        else drawAt(cursor ?? (['place', 'furnish', 'move_furniture'].includes(tool) ? placementOrigin() : limitPoint(camera)));
    }
    if (!offset) return;
    event.preventDefault();
    if (placingOpening() && placementPoint) {
        placementPoint = null;
        updateTools();
    }
    if (tool === 'pan') {
        camera.x += offset[0] * .5;
        camera.y += offset[1] * .5;
        updateView();
        return;
    }
    cursor ??= tool === 'place' ? placementOrigin() : limitPoint(camera);
    const step = event.shiftKey ? 1 : .25;
    cursor = limitPoint({ x: cursor.x + offset[0] * step, y: cursor.y + offset[1] * step });
    const { x, y, width, height } = canvas.viewBox.baseVal;
    if (cursor.x < x + .25 || cursor.x > x + width - .25) camera.x = cursor.x;
    if (cursor.y < y + .25 || cursor.y > y + height - .25) camera.y = cursor.y;
    updateView();
    updateCursor();
    showGhost(cursor);
    announcePosition(cursor);
});
board.addEventListener('blur', () => {
    cursor = null;
    updateCursor();
});

roomForm.addEventListener('submit', event => {
    event.preventDefault();
    const [width, depth, height] = ['width', 'depth', 'height'].map(field => roomForm.elements[field].valueAsNumber);
    const rooms = plan.rooms;
    const right = rooms.length ? Math.max(...rooms.map(room => room.x + room.width)) + .5 : 0;
    const bottom = rooms.length ? Math.max(...rooms.map(room => room.y + room.depth)) + .5 : 0;
    const atRight = right + width <= 100;
    const position = atRight ? { x: right, y: 0 } : { x: 0, y: bottom };
    const error = element('fp-room-form-error');
    if (!atRight && bottom + depth > 100) {
        error.hidden = false;
        return;
    }
    roomFormOpen = false;
    if (!makeItem('rooms', { ...position, width, depth, height, name: `${copy.room} ${rooms.length + 1}` })) {
        roomFormOpen = true;
        renderFlow();
        error.hidden = false;
        return;
    }
    fit();
    roomForm.reset();
    focusNext();
});

renderCatalog();
element('fp-floor-separation').addEventListener('input', event => {
    floorSeparation = event.target.valueAsNumber;
    if (allFloors) renderSpatialDrawing();
});
element('fp-furniture-search').addEventListener('input', renderFurnitureCatalog);
element('fp-underlay-opacity').addEventListener('input', event => {
    element('fp-underlay').setAttribute('opacity', event.target.valueAsNumber / 100);
});
element('fp-underlay-rooms').addEventListener('input', event => showRoomTransparency(event.target.valueAsNumber));
arrangeProjectControls();
if (exampleHome && building?.floors.length > 1) showFloor('all');
else render();
fit();
if (showStart) {
    const { floors, staircase } = demoHome();
    void import('./floor-planner-preview.mjs').then(({ startDemoPreview }) => {
        if (showStart) stopDemoPreview = startDemoPreview(element('fp-start'),
            floors.map(floor => ({ ...floor, label: floorLabel(floor, copy) })), staircase, copy, reducedMotion);
    });
}
else save();
if (sharedPending) openSharedPlan();
if (integration) integration.connect({
    devicesChanged() { render(); },
    roomPlacements() {
        const floors = allFloors ? projectFloors() : projectFloors().filter(floor => floor.id === (building?.activeFloor ?? 'ground'));
        return floors.flatMap(floor => {
            const assignments = new Map();
            for (const sensor of floor.plan.sensors) {
                const room = roomForDevice(floor.plan.rooms, sensor);
                const device = sensor.haDevice && haDevice(sensor.haDevice) ? sensor.haDevice : null;
                if (room && device) assignments.set(room.id, [...(assignments.get(room.id) ?? []), device]);
            }
            return floor.plan.rooms.map(room => ({ id: room.id, floor: floor.id, name: room.name,
                devices: assignments.get(room.id) ?? [] }));
        });
    },
    radarContext() {
        const { type, item } = selectedItem();
        const room = currentRoom() ?? plan.rooms[0];
        return { roomId: room?.haRoom ?? room?.id, sensorId: type === 'sensors' ? item.haSource ?? item.id : undefined };
    },
    setMode(mode) {
        const live = mode === 'live';
        if (live === liveMode) return;
        if (simulation) setSimulation(false);
        sensorEdit.close();
        liveMode = live;
        root.toggleAttribute('data-ha-live', live);
        element('fp-name').readOnly = live;
        if (live) {
            setTool('edit');
            showFloor(projectFloors().length > 1 ? 'all' : projectFloors()[0].id);
            if (view !== '3d') setView('3d');
        } else {
            showFloor(building?.activeFloor ?? 'ground');
        }
        root.removeAttribute('data-panel');
        renderDrawing();
    },
    setPeople(people) {
        livePeople = people;
        renderPerson();
    },
    applySaved(project) {
        readProject(project);
        render();
    },
});
root.removeAttribute('data-panel');
new ResizeObserver(updateView).observe(canvas);
new ResizeObserver(sizeSpaceLabels).observe(space);

for (const menu of [projectMenu, floorMenu, ...simMenus]) {
    menu.addEventListener('focusout', event => {
        if (event.relatedTarget?.tabIndex >= 0 && !menu.contains(event.relatedTarget)) menu.open = false;
    });
}
document.addEventListener('click', event => {
    for (const menu of simMenus) {
        if (menu.open && !menu.contains(event.target)) menu.open = false;
    }
    if (projectMenu.open && !projectMenu.contains(event.target)) projectMenu.open = false;
    if (floorMenu.open && !floorMenu.contains(event.target)) floorMenu.open = false;
    if (drawingMenu.open && !drawingMenu.contains(event.target)) drawingMenu.open = false;
    if (viewMenu.open && !viewMenu.contains(event.target)) viewMenu.open = false;
    if (toolbox.open && !toolbox.contains(event.target)) toolbox.open = false;
});
toolbox.addEventListener('toggle', () => {
    if (toolbox.open && compactLibrary.matches && toolbox.getBoundingClientRect().bottom > innerHeight * .52) {
        toolbox.querySelector('summary').scrollIntoView({ block: 'center' });
    }
});
document.addEventListener('focusin', event => {
    if (simulation && !event.target.closest('.fp-drawing')) walkControls.stop();
});

const orderButton = element('fp-open-order');
async function openOrder(opener) {
    if (orderButton.disabled) return;
    stopAutoWalk();
    walkControls.stop();
    orderButton.disabled = true;
    orderStep.disabled = true;
    try {
        const { openPlannerOrder } = await import('./floor-planner-order');
        const project = projectDocument();
        openPlannerOrder(building ? { ...project, floors: project.floors.map(floor => ({ ...floor, label: floorLabel(floor, copy) })) } : plan, copy, opener);
    } catch {
        element('fp-event').textContent = copy.order_error;
    } finally {
        orderButton.disabled = false;
        orderStep.disabled = false;
    }
}
orderButton.addEventListener('click', () => openOrder(orderButton));

document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoWalk();
});
