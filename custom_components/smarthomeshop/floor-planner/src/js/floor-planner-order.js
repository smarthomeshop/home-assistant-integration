// "Sensors across the home": which sensors the plan places in which room.
//
// This build has nothing to sell, so the overview only lists them. A build
// that does sell sensors can swap this module for one that adds them to a
// cart; openPlannerOrder is the only entry point the editor uses.
import { devices, radarNames, roomForDevice } from './floor-planner-model.mjs';
import { escapeText } from './floor-planner-drawing.mjs';

const el = id => document.getElementById(id);
let overview = null;

export function openPlannerOrder(plan, copy, opener = el('fp-open-order')) {
    overview ??= createOverview(copy);
    overview?.open(plan, opener);
}

// Sensors per room, one row per identical sensor.
export function sensorsByRoom(plan) {
    if (Array.isArray(plan.floors)) {
        return plan.floors.flatMap(floor => sensorsByRoom(floor.plan).map(room => ({
            ...room, name: [floor.label, room.name].filter(Boolean).join(' · '),
        })));
    }
    const rooms = new Map();
    for (const sensor of plan.sensors ?? []) {
        const room = roomForDevice(plan.rooms, sensor);
        const roomId = room?.id ?? '';
        if (!rooms.has(roomId)) rooms.set(roomId, { name: room?.name, rows: new Map() });
        const { rows } = rooms.get(roomId);
        const key = JSON.stringify([sensor.model, sensor.radar, Boolean(sensor.climate)]);
        if (!rows.has(key)) rows.set(key, { model: sensor.model, radar: sensor.radar, quantity: 0 });
        rows.get(key).quantity++;
    }
    return [...rooms.values()].map(room => ({ name: room.name, rows: [...room.rows.values()] }));
}

function createOverview(copy) {
    const dialog = el('fp-order');
    const body = el('fp-order-body');
    if (!dialog || !body) return null;
    let opener = null;

    // This build has nothing to order, so the cart footer and the intro that
    // talks about choosing what to order are left out.
    dialog.querySelector('.fp-order-footer')?.setAttribute('hidden', '');
    dialog.querySelector('.fp-order-heading p')?.setAttribute('hidden', '');
    const title = el('fp-order-title');
    if (title && copy.order_scope) title.textContent = copy.order_scope;

    el('fp-order-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));

    const render = plan => {
        const rooms = sensorsByRoom(plan);
        if (!rooms.length) {
            body.innerHTML = `<p class="fp-order-notice">${escapeText(copy.order_empty ?? '')}</p>`;
            return;
        }
        body.innerHTML = rooms.map(room => `<section class="fp-order-room">
            <h3>${escapeText(room.name ?? copy.order_no_room ?? '')}</h3>
            ${room.rows.map(row => {
                const radar = row.radar && row.radar !== 'none' ? radarNames[row.radar] : '';
                const name = [devices[row.model]?.name ?? row.model, radar].filter(Boolean).join(' · ');
                return `<div class="fp-order-line"><span>${escapeText(name)}</span><strong>${row.quantity}x</strong></div>`;
            }).join('')}
        </section>`).join('');
    };

    return {
        open(plan, trigger) {
            opener = trigger;
            render(plan);
            dialog.showModal();
        },
    };
}
