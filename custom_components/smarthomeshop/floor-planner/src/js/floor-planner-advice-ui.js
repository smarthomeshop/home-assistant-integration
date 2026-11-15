import { adviceMountHeightLimit, adviseRoom, defaultAdvice, prepareAdviceFurniture } from './floor-planner-advice.mjs';
import { escapeText, paintRoomSurface } from './floor-planner-drawing.mjs';
import { furnitureFootprint } from './floor-planner-furniture.mjs';
import { contains, devices, radarNames, roomForDevice } from './floor-planner-model.mjs';

export function openAdvisor(plan, current, copy, locale, place) {
    const get = suffix => document.getElementById('fp-advisor-' + suffix);
    const dialog = document.getElementById('fp-advisor');
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const obstacles = prepareAdviceFurniture(plan);
    const settings = new Map(plan.rooms.map(room => [room.id,
        { ...defaultAdvice, wallHeight: Math.min(defaultAdvice.wallHeight, adviceMountHeightLimit(room)) }]));
    const existingSensors = new Map(plan.rooms.map(room => [room.id, []]));
    for (const sensor of plan.sensors) existingSensors.get(roomForDevice(plan.rooms, sensor)?.id)?.push(sensor);
    const emptyRooms = plan.rooms.filter(room => !existingSensors.get(room.id).length);
    const results = new Map();
    const selectedChoice = new Map();
    const choiceFor = room => results.get(room.id)?.choices[selectedChoice.get(room.id) ?? 0];
    const session = new AbortController();
    const options = { signal: session.signal };
    let active = current ?? plan.rooms[0];
    let timer = 0;
    get('status').textContent = '';
    get('place-all').disabled = true;
    const validHeight = () => get('mount').value === 'ceiling' || get('goal').value === 'height' || get('wall').validity.valid;

    function title(choice) {
        return choice.upgrade ? copy.advisor_upgrade_scd41 : `${choice.sensors.length} × ${devices[choice.sensors[0].model].name}`;
    }

    function renderOverview() {
        get('rooms').innerHTML = plan.rooms.map(room => {
            const result = results.get(room.id);
            const best = choiceFor(room);
            const adding = existingSensors.get(room.id).length && settings.get(room.id).strategy !== 'replace';
            const label = best ? (adding && !best.upgrade ? '+ ' : '') + title(best) + (best.percent === null ? '' : ` · ${best.percent}%`)
                : result ? copy['advisor_' + result.reason + '_short'] ?? copy.advisor_no_suggestion : copy.advisor_wait;
            return `<button type="button" data-advice-room="${room.id}" aria-pressed="${room === active}">
                <strong>${escapeText(room.name)}</strong><small>${label}</small></button>`;
        }).join('') || `<p class="fp-note">${copy.advisor_empty}</p>`;
        get('place-all').disabled = !validHeight() || !emptyRooms.every(room => results.has(room.id))
            || !emptyRooms.some(room => results.get(room.id)?.choices.length);
        get('place-all').hidden = plan.rooms.length < 2 || !emptyRooms.length;
        get('place-all').textContent = emptyRooms.length === plan.rooms.length ? copy.advisor_place_all : copy.advisor_place_empty;
    }

    function preview(room, sensors) {
        const radius = Math.min(room.width, room.depth) * .048;
        const pieces = (plan.furniture ?? []).filter(item => contains(room, item)).map(item =>
            `<polygon class="fp-advice-object" points="${furnitureFootprint(item).map(point => point.join(',')).join(' ')}"/>`).join('');
        return `<svg class="fp-advisor-preview" viewBox="${room.x - radius * 1.4} ${room.y - radius * 1.4} ${room.width + radius * 2.8} ${room.depth + radius * 2.8}" aria-hidden="true">
            ${paintRoomSurface(room, 'class="fp-advice-floor"')}${pieces}
            ${sensors.map((item, index) => `<circle cx="${item.x}" cy="${item.y}" r="${radius}"/>
                <text x="${item.x}" y="${item.y}" font-size="${radius * 1.2}">${index + 1}</text>`).join('')}
        </svg>`;
    }

    function renderResults() {
        get('place').hidden = true;
        get('place').disabled = !validHeight();
        const result = active && results.get(active.id);
        if (!result?.choices.length) {
            get('results').innerHTML = `<p class="fp-note">${result ? copy['advisor_' + result.reason] : active ? copy.advisor_wait : copy.advisor_empty}</p>`;
            return;
        }
        get('place').hidden = false;
        const choice = choiceFor(active);
        const action = choice.upgrade ? copy.advisor_upgrade_room : !existingSensors.get(active.id).length ? copy.advisor_place_room
            : settings.get(active.id).strategy === 'replace' ? copy.advisor_replace_room : copy.advisor_add_room;
        get('place').textContent = action.replace(':room', active.name);
        const select = result.choices.length > 1 ? `<label class="fp-advisor-alternatives">${copy.advisor_choose}
            <select id="fp-advisor-choice">${result.choices.map((item, index) =>
                `<option value="${index}" ${item === choice ? 'selected' : ''}>${title(item)} · ${copy.advisor_mounts[item.family]}</option>`).join('')}</select>
            </label>` : '';
        get('results').innerHTML = `${select}<article class="fp-advisor-result">
            <div><p class="fp-advisor-rank">${choice === result.choices[0] ? copy.advisor_recommended : copy.advisor_alternative}</p>
                <h4>${title(choice)}${choice.sensors[0].model === 'wallsense' ? ` <small>${copy.planning_only}</small>` : ''}</h4>
                <p>${choice.upgrade ? copy.advisor_upgrade_climate : choice.percent === null ? copy.advisor_climate : existingSensors.get(active.id).length && settings.get(active.id).strategy !== 'replace'
                    ? copy.advisor_gain.replace(':before', number.format(choice.baselinePercent)).replace(':after', number.format(choice.percent))
                    : copy.advisor_score.replace(':percent', number.format(choice.percent))}</p>
                <p class="fp-note">${[choice.sensors[0].radar === 'none' ? '' : radarNames[choice.sensors[0].radar],
                    choice.needsScd41 ? copy.advisor_scd41 : ''].filter(Boolean).join(' · ')}</p>
                <p class="fp-note">${copy.installations[choice.sensors[0].installation] ?? ''}</p>
                ${choice.unmodelled ? `<p class="fp-note">${copy.advisor_unmodelled.replace(':count', number.format(choice.unmodelled))}</p>` : ''}
                ${choice.needsSurface ? `<p class="fp-note">${copy.advisor_needs_surface}</p>` : ''}
                ${choice.reachesGoal ? '' : `<p class="fp-note fp-warning">${copy.advisor_partial}</p>`}
                <details class="fp-advisor-positions"><summary>${copy.advisor_positions}</summary>
                    <p class="fp-note">${copy.advisor_origin}<br>${choice.sensors.map((item, index) => `${index + 1} · X ${number.format(item.x - active.x)} m / Y ${number.format(item.y - active.y)} m`).join('<br>')}</p>
                </details>
            </div>${preview(active, choice.sensors)}
        </article>`;
    }

    function renderSettings() {
        get('status').textContent = '';
        get('controls').hidden = !active;
        get('room-title').textContent = active?.name ?? '';
        if (!active) return;
        const set = settings.get(active.id);
        get('goal').value = set.goal;
        get('mount').value = set.mount;
        get('air').checked = set.air;
        get('level').checked = set.level;
        const existing = existingSensors.get(active.id);
        get('existing').hidden = !existing.length;
        get('existing-note').textContent = copy.advisor_existing.replace(':sensors', existing.map(sensor => devices[sensor.model].name).join(', '));
        get('strategy').value = set.strategy ?? 'add';
        get('wall').max = adviceMountHeightLimit(active);
        get('wall').value = set.wallHeight;
        get('wall-field').hidden = set.mount === 'ceiling' || set.goal === 'height';
        get('air-field').hidden = set.goal === 'climate';
        get('level-field').hidden = !active.ceiling || ['wall', 'recessed', 'freestanding'].includes(set.mount);
    }

    function calculate(room) {
        results.set(room.id, adviseRoom(plan, room, settings.get(room.id), obstacles));
        renderOverview();
        if (room === active) renderResults();
    }

    function queue() {
        clearTimeout(timer);
        const next = plan.rooms.find(room => !results.has(room.id));
        if (next) timer = setTimeout(() => { calculate(next); queue(); }, 0);
    }

    function checkHeight() {
        const valid = validHeight();
        get('place').disabled = !valid;
        if (!valid) get('place-all').disabled = true;
        get('status').textContent = valid ? '' : copy.advisor_height_invalid.replace(':max', number.format(Number(get('wall').max)));
        return valid;
    }
    get('wall').addEventListener('input', checkHeight, options);
    get('controls').addEventListener('change', () => {
        if (!active || !checkHeight()) return;
        settings.set(active.id, { goal: get('goal').value, mount: get('mount').value,
            air: get('air').checked, level: get('level').checked,
            wallHeight: get('wall').validity.valid ? get('wall').valueAsNumber : settings.get(active.id).wallHeight,
            strategy: get('strategy').value });
        results.delete(active.id);
        selectedChoice.delete(active.id);
        renderSettings();
        calculate(active);
        queue();
    }, options);
    get('results').addEventListener('change', event => {
        if (event.target.id !== 'fp-advisor-choice' || !active) return;
        selectedChoice.set(active.id, Number(event.target.value));
        renderOverview();
        renderResults();
        get('choice').focus({ preventScroll: true });
    }, options);
    get('rooms').addEventListener('click', event => {
        const selected = event.target.closest('[data-advice-room]');
        if (!selected) return;
        active = plan.rooms.find(room => room.id === selected.dataset.adviceRoom);
        if (!results.has(active.id)) calculate(active);
        renderSettings();
        renderOverview();
        renderResults();
        get('goal').focus({ preventScroll: true });
        if (matchMedia('(max-width: 760px)').matches) get('room-title').scrollIntoView({ block: 'start' });
    }, options);
    const apply = (rooms, replaceRooms = new Set()) => {
        if (!checkHeight()) return;
        const picks = rooms.flatMap(room => choiceFor(room)?.sensors ?? []);
        if (!picks.length) return;
        const result = place(picks, replaceRooms);
        if (result > 0) dialog.close();
        else get('status').textContent = result < 0 ? copy.advisor_limit : copy.advisor_exists;
    };
    get('place').addEventListener('click', () => apply([active],
        new Set(settings.get(active.id).strategy === 'replace' ? [active.id] : [])), options);
    get('place-all').addEventListener('click', () => apply(emptyRooms), options);
    get('close').addEventListener('click', () => dialog.close(), options);
    dialog.addEventListener('close', () => { clearTimeout(timer); session.abort(); }, { once: true });
    renderSettings();
    renderOverview();
    renderResults();
    dialog.showModal();
    if (active) timer = setTimeout(() => { calculate(active); queue(); }, 0);
}
