import { paintFloorCoverage } from './floor-planner-beam.mjs';
import { contains } from './floor-planner-model.mjs';
import { prepareFurnitureOcclusion } from './floor-planner-obstruction.mjs';
import { paintPerson, personSignals, preparePersonSensors, solidWalls } from './floor-planner-person.mjs';
import { defaultSpaceCamera, paintBuilding, projectSpace } from './floor-planner-space.mjs';
import { floorStackHeight, stairGait, stairGaitDuration, stairHeading, stairOcclusionId, stairWalls } from './floor-planner-stairs.mjs';
import { createWalkNetwork } from './floor-planner-walk-route.mjs';

const camera = defaultSpaceCamera;
const separation = 1.16;
const pace = 1.45;
const frameTime = 50;
const groundStart = { x: 8.25, y: 1.7 };

export function demoStairForeground(stair, view = camera) {
    const [, viewX] = projectSpace([1, 0], 0, view, false);
    const [, viewY] = projectSpace([0, 1], 0, view, false);
    const walls = stairWalls(stair);
    const screenXs = walls.map(([point]) => projectSpace(point, 0, view, false)[0]);
    const left = Math.min(...screenXs), right = Math.max(...screenXs);
    const faces = walls.flatMap(([[ax, ay], [bx, by]]) => {
        const nx = ay - by, ny = bx - ax;
        return nx * viewX + ny * viewY > 1e-7 ? [{ ax, ay, nx, ny }] : [];
    });
    return ({ x, y }) => {
        const [screenX] = projectSpace([x, y], 0, view, false);
        return screenX >= left - .35 && screenX <= right + .35
            && faces.some(({ ax, ay, nx, ny }) => (x - ax) * nx + (y - ay) * ny >= -1e-7);
    };
}

export function demoWalkSequence([ground, upper], stair) {
    const path = (floor, stops) => {
        const { plan } = floor;
        const network = createWalkNetwork(plan, [...solidWalls(plan), ...stairWalls(stair)]);
        const legs = [];
        for (let index = 1; index < stops.length; index++) {
            const route = network.routeTo(stops[index - 1], stops[index]);
            if (!route) return [];
            let from = stops[index - 1];
            for (const to of route) {
                const dx = to.x - from.x, dy = to.y - from.y;
                const distance = Math.hypot(dx, dy);
                if (distance > 1e-6) legs.push({ floor, from, to, duration: distance / pace * 1000,
                    heading: Math.atan2(dx, -dy) * 180 / Math.PI, distance });
                from = to;
            }
        }
        return legs;
    };
    const towardsStair = path(ground, [groundStart, { x: 4.9, y: 1.7 }, stair.bottom]);
    const upstairs = path(upper, [stair.top, { x: 8.3, y: 6.3 }, { x: 8.6, y: 2.45 }, stair.top]);
    const downstairs = path(ground, [stair.bottom, groundStart]);
    if (!towardsStair.length || !upstairs.length || !downstairs.length) return [];
    const cross = up => ({ stair, floor: up ? ground : upper, up, duration: stairGaitDuration(up) });
    return [...towardsStair, cross(true), ...upstairs, cross(false), ...downstairs];
}

export function startDemoPreview(section, floors, stair, copy, reducedMotion) {
    const map = section.querySelector('#fp-start-preview');
    const control = section.querySelector('#fp-demo-playback');
    const status = section.querySelector('#fp-demo-detection');
    const scene = paintBuilding(floors, camera, separation, stair, paintFloorCoverage);
    if (!scene) return () => {};
    map.setAttribute('viewBox', scene.viewBox);
    const [x, y, width, height] = scene.viewBox.split(' ');
    const walkerMask = 'fp-demo-walker-in-front';
    map.innerHTML = scene.markup + `<defs>
        <filter id="fp-demo-walker-silhouette"><feColorMatrix type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
        <mask id="${walkerMask}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${height}">
            <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white"/>
            <use href="#fp-demo-walker-mesh" filter="url(#fp-demo-walker-silhouette)"/>
        </mask>
    </defs>`;
    const figure = document.createElementNS(map.namespaceURI, 'g');
    figure.setAttribute('data-demo-person', '');
    figure.setAttribute('pointer-events', 'none');
    const stairs = map.querySelector('.fp-stair-flight');
    const stairLayer = stairs.querySelector('[data-stair-walkers]');
    const inFrontOfStair = demoStairForeground(stair);
    const markers = floors.map(floor => {
        const layer = map.querySelector(`[data-building-floor="${floor.id}"]`);
        return {
            floor, plan: floor.plan, layer,
            sensors: preparePersonSensors(floor.plan), furniture: prepareFurnitureOcclusion(floor.plan.furniture ?? []),
            elements: layer.querySelectorAll('.fp-space-marker, .fp-stack-beam, .fp-wall-fan'),
        };
    });
    const rise = floorStackHeight(floors[1].level, floors[0].level, separation);
    const stairOcclusion = { id: stairOcclusionId(stair), height: rise };
    let current = 0, elapsed = 0, stride = 0, frame = 0, previous = 0;
    let sequence, paused = reducedMotion.matches, visible = false;

    function draw(floor, pose, crossing = false) {
        const readings = crossing ? [] : personSignals(floor.plan, pose, floor.sensors, floor.furniture);
        const detected = readings.filter(reading => reading.seen);
        for (const layer of markers) {
            for (const element of layer.elements) {
                const id = element.dataset.sensor ?? element.dataset.item;
                const seen = layer === floor && detected.some(({ item, signals }) => item.id === id
                    && (!element.dataset.radar || signals.some(signal => signal.seen && signal.radar === element.dataset.radar)));
                element.toggleAttribute('data-detected', seen);
            }
        }
        const room = floor.plan.rooms.find(room => contains(room, pose));
        const count = copy.sim_count.replace(':seen', detected.length).replace(':total', floor.plan.sensors.length);
        const next = copy.demo_detection + (crossing ? ' · ' + copy.staircase : ' · ' + [room?.name, count].filter(Boolean).join(' · '));
        if (status.textContent !== next) status.textContent = next;
        status.toggleAttribute('data-detected', detected.length > 0);
        // Use floor-local coordinates while walking. On the stairs, draw between the treads and the near rail.
        const layer = crossing ? stairLayer : floor.layer;
        if (figure.parentNode !== layer) layer.append(figure);
        figure.innerHTML = paintPerson({ pose: 'standing', avatar: 'man', ...pose,
            elevation: crossing ? pose.elevation : 0 }, camera, !reducedMotion.matches, false, crossing ? stairOcclusion : null);
        // Let the walker cover the stairs without lifting the ground-floor figure above the upper floor.
        if (!crossing && floor.floor.id === stair.lower && inFrontOfStair(pose)) {
            figure.querySelector('.fp-avatar-mesh').id = 'fp-demo-walker-mesh';
            stairs.setAttribute('mask', `url(#${walkerMask})`);
        } else stairs.removeAttribute('mask');
    }

    function tick(now) {
        if (now - previous >= frameTime) {
            elapsed += previous ? Math.min(100, now - previous) : 0;
            previous = now;
            let leg = sequence[current];
            while (elapsed >= leg.duration) {
                elapsed -= leg.duration;
                stride += leg.distance ?? 0;
                current = (current + 1) % sequence.length;
                leg = sequence[current];
            }
            const fraction = elapsed / leg.duration;
            const floor = markers.find(entry => entry.floor === leg.floor);
            if (leg.stair) {
                const gait = stairGait(stair, fraction, rise, leg.up);
                draw(floor, { ...gait, heading: stairHeading(stair, leg.up) }, true);
            } else {
                draw(floor, { x: leg.from.x + (leg.to.x - leg.from.x) * fraction,
                    y: leg.from.y + (leg.to.y - leg.from.y) * fraction, pose: 'standing', heading: leg.heading,
                    moving: true, stride: stride + leg.distance * fraction });
            }
        }
        frame = requestAnimationFrame(tick);
    }

    function sync() {
        const playing = !paused && visible && !document.hidden;
        control.setAttribute('aria-label', copy[paused ? 'demo_play' : 'demo_pause']);
        control.toggleAttribute('data-playing', !paused);
        if (!playing) {
            cancelAnimationFrame(frame);
            frame = previous = 0;
        } else if (!frame) {
            sequence ??= demoWalkSequence(floors, stair);
            if (sequence.length) frame = requestAnimationFrame(tick);
            else control.hidden = true;
        }
    }

    const toggle = () => { paused = !paused; sync(); };
    const motionChanged = () => { paused = reducedMotion.matches; sync(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .12 });
    draw(markers[0], { ...groundStart, pose: 'standing', heading: 0 });
    control.hidden = false;
    control.addEventListener('click', toggle);
    reducedMotion.addEventListener('change', motionChanged);
    document.addEventListener('visibilitychange', sync);
    observer.observe(map);
    sync();
    return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        control.removeEventListener('click', toggle);
        reducedMotion.removeEventListener('change', motionChanged);
        document.removeEventListener('visibilitychange', sync);
    };
}
