import { ceilingHeightAt, ceilingPitch, ceilingPosition } from './floor-planner-ceiling.mjs';
import { escapeText, sensorMarkerAttributes } from './floor-planner-drawing.mjs';
import { devices, roomForDevice, wallVector } from './floor-planner-model.mjs';
import { convexHull, polygonEdges, roomCorners, roomInteriorPoint, roomLineSpans } from './floor-planner-geometry.mjs';
import { cutawayWallHeight, floorSlabDepth, paintMaquette, spacePolygon as poly } from './floor-planner-maquette.mjs';
import { sensorMountHeight } from './floor-planner-radar.mjs';
import { floorStackHeight, paintStairFlight, paintStairOcclusion, paintStairOpening } from './floor-planner-stairs.mjs';

const coordinates = (x, y) => ({ x, y });

// Keep projection independent of the editor, storage and any live device bindings.
const baseTilt = Math.asin(.42 / .866);
export const defaultSpaceCamera = { yaw: 0, tilt: baseTilt };

export function orbitSpaceCamera(camera, dx, dy) {
    return {
        yaw: (camera.yaw + dx * .012) % (Math.PI * 2),
        tilt: Math.max(.22, Math.min(1.23, camera.tilt - dy * .008)),
    };
}

export function projectSpace([x, y], height, { yaw, tilt }, rounded = true) {
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const u = x * cos - y * sin, v = x * sin + y * cos;
    const floorDepth = .866 * Math.sin(tilt);
    const vertical = .88 * Math.cos(tilt) / Math.cos(baseTilt);
    const point = [(u - v) * .866, (u + v) * floorDepth - height * vertical];
    return rounded ? point.map(value => Number(value.toFixed(3))) : point;
}

export function unprojectFloor([x, y], { yaw, tilt }) {
    const depth = y / (.866 * Math.sin(tilt));
    const u = (x / .866 + depth) / 2, v = (depth - x / .866) / 2;
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    return [u * cos + v * sin, -u * sin + v * cos];
}

function towardCamera({ yaw, tilt }) {
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const vertical = .88 * Math.cos(tilt) / Math.cos(baseTilt);
    return [(cos + sin) * vertical, (cos - sin) * vertical, 2 * .866 * Math.sin(tilt)];
}

const sensorRing = Array.from({ length: 32 }, (_, index) => {
    const angle = index * Math.PI * 2 / 32;
    return [Math.cos(angle), Math.sin(angle)];
});

function paintCeilingSensor(item, room, height, project, towardViewer) {
    const ceiling = room?.ceiling;
    const axis = ceiling?.direction ?? 'x+';
    const rise = ceiling?.type === 'gable' ? ceilingPosition(room, item) < .5 : axis.endsWith('+');
    const pitch = ceiling && item.levelMountRoom !== room.id ? ceilingPitch(room) * Math.PI / 180 : 0;
    const cosine = Math.cos(pitch), sine = Math.sin(pitch) * (rise ? 1 : -1);
    const alongX = axis.startsWith('x');
    const [slopeX, slopeY] = alongX ? [sine, 0] : [0, sine];
    const radius = .19, thickness = .06;
    const points = sensorRing.map(([u, v]) => [
        item.x + u * radius * (alongX ? cosine : 1),
        item.y + v * radius * (alongX ? 1 : cosine),
        height + radius * (u * slopeX + v * slopeY),
    ]);
    const back = points.map(([x, y, z]) => project([x, y], z));
    const front = points.map(([x, y, z]) => project([x + slopeX * thickness, y + slopeY * thickness], z - cosine * thickness));
    const [vx, vy, vz] = towardViewer;
    const visibleFace = -vx * slopeX - vy * slopeY + vz * cosine >= 0 ? back : front;
    return poly('polygon', convexHull([...back, ...front]), 'class="fp-space-puck side"')
        + poly('polygon', visibleFace, 'class="fp-space-puck face"');
}

function paintWallSense(item, height, project, cutawayHeight) {
    const { x, y } = wallVector(item.angle);
    const facePoint = (side, up, inset = .025) => project([item.x + x * inset - y * side, item.y + y * inset + x * side], height + up);
    const plate = [[-.15, -.15], [.15, -.15], [.15, .15], [-.15, .15]].map(point => facePoint(...point));
    const [cx, cy] = facePoint(0, 0);
    const supportTop = .23;
    const supportBottom = cutawayHeight - height;
    const support = supportBottom < supportTop
        ? poly('polygon', [[-.32, supportBottom], [.32, supportBottom], [.32, supportTop], [-.32, supportTop]]
            .map(([side, z]) => facePoint(side, z, 0)), 'class="fp-wall-mount-support" fill="#bdb9ac"')
        : '';
    return support + poly('polygon', plate, 'class="fp-space-puck wall"')
        + `<ellipse cx="${cx}" cy="${cy}" rx=".035" ry=".045" fill="#6d8496"/>`;
}

export function paintSpace(plan, camera, selected, {
    sensorHeight = sensorMountHeight, decorations = true, interactiveSensors = false, staircase = null, upperStair = false, coverage = null, sceneId, showWallMount = false,
    draft = false, wallMode, daylight = 'studio',
} = {}) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    const include = ([x, y]) => {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
    };
    const project = (position, height = 0) => {
        const point = projectSpace(position, height, camera);
        include(point);
        return point;
    };
    const selectedRoom = plan.rooms.find(room => room.id === selected);
    const floorOverlay = coverage?.floorOverlay ?? (decorations ? '<g id="fp-wall-coverage-space" pointer-events="none"></g>' : '');
    const direction = towardCamera(camera);
    const model = paintMaquette(plan, project, normal => projectSpace(normal, 0, { ...camera, tilt: baseTilt })[1],
        direction, selected, floorOverlay, sceneId, { draft, wallMode, daylight });

    const ceilings = plan.rooms.filter(room => room.ceiling || room === selectedRoom).map(room => {
        const outline = roomCorners(room);
        const ceilingPoint = point => project(point, ceilingHeightAt(room, coordinates(...point)));
        const ridge = room.ceiling?.type === 'gable';
        const alongX = room.ceiling?.direction.startsWith('x');
        const ridgeEnds = alongX ? [[room.x + room.width / 2, room.y], [room.x + room.width / 2, room.y + room.depth]]
            : [[room.x, room.y + room.depth / 2], [room.x + room.width, room.y + room.depth / 2]];
        const [first, last] = ridgeEnds;
        const axis = alongX ? 0 : 1;
        const path = ridge ? polygonEdges(outline).flatMap(([a, b]) => {
            const t = (first[axis] - a[axis]) / (b[axis] - a[axis]);
            return t > 0 && t < 1 ? [a, a.map((value, i) => value + (b[i] - value) * t)] : [a];
        }) : outline;
        const ridges = ridge ? roomLineSpans(room, coordinates(...first), coordinates(...last)).map(span =>
            span.map(t => first.map((value, i) => value + (last[i] - value) * t))) : [];
        const dropLines = [outline[0], outline[Math.floor(outline.length / 2)], ...ridges.flat()];
        return `<g class="fp-space-ceiling${room === selectedRoom ? ' selected' : ''}">
            ${poly('polygon', path.map(ceilingPoint))}
            ${ridges.map(line => poly('polyline', line.map(ceilingPoint))).join('')}
            ${dropLines.map(point =>
                poly('polyline', [project(point), ceilingPoint(point)])).join('')}
        </g>`;
    });

    const labels = plan.rooms.filter(room => Math.min(room.width, room.depth) >= 2).map(room => {
        const label = roomInteriorPoint(room, { x: room.x + room.width / 2, y: room.y + room.depth * .68 });
        const [x, y] = project([label.x, label.y]);
        return `<text class="fp-space-room-label" x="${x}" y="${y}">${escapeText(room.name.length > 19 ? room.name.slice(0, 18) + '...' : room.name)}</text>`;
    });
    const markers = plan.sensors.map((item, index) => {
        const { mount } = devices[item.model];
        const room = roomForDevice(plan.rooms, item);
        const position = [item.x, item.y];
        const [x, y] = project(position);
        const height = sensorHeight(item, room);
        const [, top] = project(position, height);
        const badgeX = height ? x + .48 : x;
        const facing = showWallMount && item.model === 'wallsense' ? wallVector(item.angle) : null;
        const wallTop = facing && room
            ? cutawayWallHeight(room, projectSpace([facing.x, facing.y], 0, { ...camera, tilt: baseTilt })[1])
            : Infinity;
        if (height) include([badgeX, top]);
        return `<g class="fp-space-marker ${mount}${item.id === selected ? ' selected' : ''}" data-item="${item.id}" ${interactiveSensors ? sensorMarkerAttributes(item, index) : ''}>
            ${height ? `${facing ? '' : `<line x1="${x}" x2="${x}" y1="${y}" y2="${top}"/><ellipse class="fp-space-anchor" cx="${x}" cy="${y}" rx=".13" ry=".075"/>`}
                ${mount === 'ceiling' ? paintCeilingSensor(item, room, height, project, direction)
                : item.model === 'wallsense' ? paintWallSense(item, height, project, wallTop) :
                `<rect class="fp-space-puck wall" x="${x - .18}" y="${top - .12}" width=".36" height=".24" rx=".045"/>`}` : ''}
            <circle cx="${badgeX}" cy="${top}" r=".29"/><text x="${badgeX}" y="${top}">${String(index + 1).padStart(2, '0')}</text>
            ${interactiveSensors ? `<circle class="fp-sensor-focus" cx="${badgeX}" cy="${top}" r=".37"/>` : ''}
        </g>`;
    });
    const stairs = staircase ? (upperStair ? paintStairOpening(staircase, project) : paintStairFlight(staircase, project, 0, 2.7, direction)) : '';
    if (!Number.isFinite(left)) return null;

    const width = Math.max(2, right - left);
    const height = Math.max(2, bottom - top);
    const padding = Math.max(.85, Math.max(width, height) * .075);
    const view = { x: left - padding, y: top - padding, width: width + 2 * padding, height: height + 2 * padding };
    return {
        viewBox: Object.values(view).join(' '),
        hasFurniture: model.hasFurniture,
        markup: `${decorations ? spaceGrid(camera, view) : ''}<g class="fp-daylight" data-daylight="${daylight}">${model.markup}
            ${stairs}
            ${ceilings.join('')}</g>${coverage?.beamOverlay ?? (decorations ? '<g id="fp-cone-space" pointer-events="none"></g>' : '')}
            ${labels.join('')}${markers.join('')}`,
    };
}

function spaceGrid(camera, view) {
    const gridMatrix = [...projectSpace([1, 0], 0, camera), ...projectSpace([0, 1], 0, camera), 0, 0].join(' ');
    return `<defs>
        <filter id="fp-model-shadow" x="-20%" y="-25%" width="145%" height="155%"><feGaussianBlur stdDeviation=".30"/></filter>
        <filter id="fp-contact-shadow" x="-20%" y="-25%" width="140%" height="150%"><feGaussianBlur stdDeviation=".058"/></filter>
        <filter id="fp-cast-shadow" x="-20%" y="-25%" width="140%" height="150%"><feGaussianBlur stdDeviation=".115"/></filter>
        <pattern id="fp-space-grid" width="1" height="1" patternUnits="userSpaceOnUse"
            patternTransform="matrix(${gridMatrix})">
            <path d="M0 1V0H1" fill="none" stroke="#465563" stroke-width=".75" vector-effect="non-scaling-stroke"/>
        </pattern>
        <pattern id="fp-floor-boards" width="2.64" height=".81" patternUnits="userSpaceOnUse" patternTransform="matrix(${gridMatrix})">
            <path d="M0 .27H2.64V.54H0zM0 .54H.87v.27H0zM1.68 0H2.64V.27H1.68z" fill="#fff8e9" opacity=".13"/>
            <path d="M0 0H2.64M0 .27H2.64M0 .54H2.64M.54 0v.27M1.68 0v.27M.22 .27v.27M1.42 .27v.27M2.4 .27v.27M.87 .54v.27M2 .54v.27" fill="none" stroke="#665440" stroke-opacity=".23" stroke-width=".013"/>
            <path d="M.14 .083q.25 -.023 .32 .004m.31 .076q.35 .03 .68 .001m.32 -.042q.37 -.023 .75 0M.49 .386q.27 -.025 .72 0m.44 .05q.21 .026 .50 0M.14 .649q.22 .016 .55 -.002m.36 .047q.36 -.031 .76 0m.29 -.073q.21 .016 .38 0" fill="none" stroke="#785d42" stroke-opacity=".2" stroke-width=".012"/>
        </pattern>
        <pattern id="fp-floor-tiles" width=".64" height=".64" patternUnits="userSpaceOnUse" patternTransform="matrix(${gridMatrix})">
            <rect x=".018" y=".018" width=".604" height=".604" fill="#fff8ec" opacity=".18"/>
            <path d="M0 0H.64M0 0V.64" fill="none" stroke="#82786d" stroke-opacity=".33" stroke-width=".018"/>
        </pattern>
        </defs><rect x="${view.x}" y="${view.y}" width="${view.width}" height="${view.height}" fill="url(#fp-space-grid)" opacity=".18"/>`;
}

export function paintBuilding(floors, camera, separation = 1, staircase = null, paintCoverage = null, {
    selected = null, sensorHeight, paintForeground, draft = false, wallMode, daylight = 'studio',
} = {}) {
    const levels = [...floors].sort((a, b) => a.level - b.level);
    const base = levels[0]?.level ?? 0;
    const scenes = levels.flatMap(floor => {
        const upperStair = staircase?.upper === floor.id;
        const scene = paintSpace(floor.plan, camera, selected, {
            decorations: false, staircase: upperStair ? staircase : null, upperStair, coverage: paintCoverage?.(floor, camera), sensorHeight, sceneId: floor.id, draft, wallMode, daylight,
        });
        if (!scene) return [];
        const [x, y, width, height] = scene.viewBox.split(' ').map(Number);
        const [, offset] = projectSpace([0, 0], floorStackHeight(floor.level, base, separation), camera);
        return [{ floor, scene, x, y, width, height, offset }];
    });
    if (!scenes.length) return null;
    const x = Math.min(...scenes.map(scene => scene.x)) - .35;
    const y = Math.min(...scenes.map(scene => scene.y + scene.offset));
    const width = Math.max(...scenes.map(scene => scene.x + scene.width)) - x;
    const labels = scenes.map(scene => ({ floor:scene.floor, x:scene.x + .13, y:scene.y + scene.offset + 1.68 }))
        .sort((a, b) => a.y - b.y);
    for (let index = 1; index < labels.length; index++) {
        labels[index].y = Math.max(labels[index].y, labels[index - 1].y + .44);
    }
    const height = Math.max(labels.at(-1).y + .35, ...scenes.map(scene => scene.y + scene.offset + scene.height)) - y;
    const lower = scenes.find(({ floor }) => floor.id === staircase?.lower);
    const upper = scenes.find(({ floor }) => floor.id === staircase?.upper);
    const bounds = { x, y, width, height };
    let stairs = '';
    if (lower && upper) {
        const project = (point, height) => projectSpace(point, height, camera);
        const stairBase = floorStackHeight(lower.floor.level, base, separation);
        const rise = floorStackHeight(upper.floor.level, lower.floor.level, separation);
        const occlusion = paintStairOcclusion(staircase, upper.floor.plan.rooms, project, stairBase + rise, floorSlabDepth, bounds);
        stairs = paintStairFlight(staircase, project, stairBase, rise, towardCamera(camera), occlusion);
    }
    return {
        viewBox: [x, y, width, height].join(' '),
        hasFurniture: scenes.some(({ scene }) => scene.hasFurniture),
        markup: spaceGrid(camera, bounds) + scenes.map(({ floor, scene, offset }) =>
            `<g data-building-floor="${floor.id}" transform="translate(0 ${offset})">${scene.markup}${paintForeground?.(floor) ?? ''}</g>`).join('') + stairs
            + labels.map(({ floor, x, y }) =>
                `<text class="fp-building-label" data-floor-label="${floor.id}" x="${x}" y="${y}">${escapeText(floor.label)}</text>`).join(''),
    };
}
