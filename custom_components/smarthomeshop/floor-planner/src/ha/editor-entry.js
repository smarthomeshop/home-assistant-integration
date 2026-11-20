// Home Assistant entry point for the floor planner editor.
//
// The panel (host.js) opens the editor in an iframe and hangs its adapter on
// the iframe element as `floorPlannerHost`. The editor reads that adapter once,
// at start-up, from globalThis, so it is copied over before the editor module
// runs. Opened on its own, without a host, the page stays empty on purpose:
// there is nothing to save to.
import { mirrorProtection } from './ha-mirrors.js';

const host = window.frameElement?.floorPlannerHost;

if (host) {
    // The editor draws what the reflection filter of a mirror will hide; the geometry of it lives on this side.
    host.mirrorProtection = mirrorProtection;
    window.floorPlannerHost = host;
    document.documentElement.dataset.haTheme = host.theme();
    document.querySelector('#main-content').setAttribute('aria-label', window.frameElement.title);
    document.querySelector('#floor-planner').setAttribute('data-ha-editor', '');
    document.querySelector('#fp-ha-device-label').textContent = host.labels[9];
    document.querySelector('#fp-library-title').textContent = host.picker.title;
    document.querySelector('label[for="fp-search"]').textContent = host.picker.search;
    document.querySelector('#fp-search').placeholder = host.picker.search;
    host.mountActions(document.querySelector('#fp-project'));
    await import('../js/floor-planner.js');
}
