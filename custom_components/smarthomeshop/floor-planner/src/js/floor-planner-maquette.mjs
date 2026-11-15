import { contains } from './floor-planner-model.mjs';
import { depthOrder, onFaceEdge } from './floor-planner-depth.mjs';
import { paintZone } from './floor-planner-drawing.mjs';
import { defaultWindowSill, doorsOnPlan, polygonEdges, roomCorners, wallSegments } from './floor-planner-geometry.mjs';
import { exampleFloor, exampleWindows, furnitureFootprint, furnitureProjection } from './floor-planner-furniture.mjs';
import { furnitureMesh, rugLayers } from './floor-planner-furniture-mesh.mjs';
import { daylightFor } from './floor-planner-daylight.mjs';

export const floorSlabDepth = .17;

export const spacePolygon = (tag, points, attributes = '') =>
    `<${tag} points="${points.map(point => point.join(',')).join(' ')}" ${attributes}/>`;

const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const shift = (point, normal, amount) => [point[0] + normal[0] * amount, point[1] + normal[1] * amount];
const inward = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    return [-dy / length, dx / length];
};
const wallColor = room => room?.wallColor ? ` data-wall="${room.wallColor}"` : '';
const rectangle = (x, y, w, d) => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];

export function cutawayWallHeight(room, depth) {
    const facing = Math.max(0, Math.min(1, depth / .30));
    return Math.min(room.height * .88, .43 + 1.8 * facing * facing * (3 - 2 * facing));
}

function blockFaces(corners, base, top, attributes, drawTop = true) {
    const faces = polygonEdges(corners).map(([a, b]) => ({
        vertices: [[...a, base], [...b, base], [...b, top], [...a, top]], className: 'fp-model-face', attributes,
    }));
    if (drawTop) faces.push({ vertices: corners.map(point => [...point, top]), className: 'fp-model-top', attributes });
    return faces;
}

function paintFaces(faces, project, towardCamera, { sun: [sunX, sunY, sunZ], dim } = daylightFor('studio')) {
    return depthOrder(faces, towardCamera).map(({ vertices, boundary, plane, className, attributes = '' }) => {
        const points = vertices.map(([x, y, z]) => project([x, y], z));
        // Use a world-space light so the material does not change when the camera rotates.
        const [nx, ny, nz] = plane.normal;
        const light = sunX * nx + sunY * ny + sunZ * nz;
        const highlight = Math.round(Math.max(0, light) * 19 * (1 - dim));
        const shadow = Math.round(Math.max(0, .55 - light) * 19 + dim * 22);
        const polygon = spacePolygon('polygon', points, `class="${className}${boundary ? ' fp-depth-fragment' : ''}"`);
        const originalEdges = boundary && polygonEdges(boundary);
        const edges = originalEdges ? polygonEdges(vertices).map(([a, b], index) => {
            if (!originalEdges.some(([start, end]) => onFaceEdge(a, start, end) && onFaceEdge(b, start, end))) return '';
            return `M${points[index].join(' ')}L${points[(index + 1) % points.length].join(' ')}`;
        }).join('') : '';
        return `<g ${attributes} style="--fp-light:${highlight}%;--fp-shadow:${shadow}%">${polygon}${edges ? `<path class="${className} fp-depth-boundary" d="${edges}"/>` : ''}</g>`;
    }).join('');
}

// Like the wall buttons in a dollhouse game: 'cutaway' lowers the walls facing
// the camera, 'up' shows every wall at full height and 'down' keeps only a low
// edge so the whole floor is visible.
export const wallModes = ['cutaway', 'up', 'down'];

// A draft keeps the walls exact but draws furniture as plain blocks and leaves
// out textures and shadows. It is meant for frames drawn while the camera moves,
// where the full model costs more time than a frame has.
export function paintMaquette(plan, project, depthOf, towardCamera, selected, floorOverlay = '', sceneId = 'single', { draft = false, wallMode = 'cutaway', daylight = 'studio' } = {}) {
    const light = daylightFor(daylight);
    const doors = doorsOnPlan(plan);
    const objects = [];
    const floors = [];
    const bases = [];
    const shadows = [];
    const floorShadows = [];
    const contactShadows = [];
    const floorClip = [];
    const furniture = plan.furniture ?? [];
    const wallHeight = (room, normal, exterior) => {
        if (wallMode === 'up') return room.height;
        if (wallMode === 'down' || !exterior) return Math.min(room.height * .75, .25);
        // Lift the far walls to show the windows, while the near wall remains a cutaway.
        return cutawayWallHeight(room, depthOf(normal));
    };
    const wallGeometry = (a, b, room, normal) => {
        const [x, y] = shift(midpoint(a, b), normal, -.045);
        const exterior = room && !plan.rooms.some(other => other !== room && contains(other, { x, y }));
        const loose = wallMode === 'up' ? Math.max(.42, ...plan.rooms.map(entry => entry.height)) : wallMode === 'down' ? .25 : .42;
        return { height: room ? wallHeight(room, normal, exterior) : loose,
            outside: exterior ? -.12 : room ? 0 : -.06, inside: exterior ? 0 : .055 };
    };
    const addWall = (a, b, room, id) => {
        const normal = inward(a, b);
        for (const [start, end] of wallSegments(a, b, doors)) {
            const { height, outside, inside } = wallGeometry(start, end, room, normal);
            const wall = [shift(start, normal, outside), shift(end, normal, outside),
                shift(end, normal, inside), shift(start, normal, inside)];
            objects.push(...blockFaces(wall, 0, height, `class="fp-space-wall${id === selected ? ' selected' : ''}" data-item="${id}"${wallColor(room)}`));
        }
    };
    const addOutsideCorner = (previous, corner, next, room) => {
        const before = inward(previous, corner), after = inward(corner, next);
        if (before[0] * after[1] - before[1] * after[0] <= .0001) return;
        const closeToCorner = point => {
            const ratio = Math.min(.4, .09 / Math.hypot(point[0] - corner[0], point[1] - corner[1]));
            return corner.map((value, axis) => value + (point[axis] - value) * ratio);
        };
        const left = closeToCorner(previous), right = closeToCorner(next);
        const first = wallGeometry(left, corner, room, before), second = wallGeometry(corner, right, room, after);
        const thickness = first.outside;
        if (!thickness || second.outside !== thickness) return;
        const touches = point => Math.hypot(point[0] - corner[0], point[1] - corner[1]) < .001;
        if (!wallSegments(left, corner, doors).some(([, end]) => touches(end))
            || !wallSegments(corner, right, doors).some(([start]) => touches(start))) return;
        const sum = before.map((value, axis) => value + after[axis]);
        const miter = thickness / (1 + before[0] * after[0] + before[1] * after[1]);
        const joint = [corner, shift(corner, before, thickness)];
        if (Math.hypot(...sum) * Math.abs(miter) < .28) joint.push(shift(corner, sum, miter));
        joint.push(shift(corner, after, thickness));
        objects.push(...blockFaces(joint, 0, Math.min(first.height, second.height),
            `class="fp-space-wall${room.id === selected ? ' selected' : ''}" data-item="${room.id}"${wallColor(room)}`));
    };
    const addWindow = (start, end, room, normal, base, top, className, attributes = '', frame = false) => {
        const [nx, ny] = inward(start, end);
        const [a, b] = nx * normal[0] + ny * normal[1] > 0 ? [start, end] : [end, start];
        const { height, outside, inside } = wallGeometry(a, b, room, normal);
        const visibleTop = Math.min(height - .035, top);
        if (visibleTop <= base + .004) {
            if (frame) {
                const corners = [shift(a, normal, outside + .012), shift(b, normal, outside + .012),
                    shift(b, normal, inside - .012), shift(a, normal, inside - .012)];
                objects.push({ vertices: corners.map(point => [...point, height + .002]), className: 'fp-model-window-sill' });
            }
            return;
        }
        const pane = (from, to, offset, name) => {
            const left = shift(from, normal, inside + offset);
            const right = shift(to, normal, inside + offset);
            const vertices = [[...left, base], [...left, visibleTop], [...right, visibleTop], [...right, base]];
            objects.push({ vertices, className: name, attributes });
        };
        pane(a, b, .002, className);
        if (frame) {
            const center = midpoint(a, b);
            const direction = [normal[1], -normal[0]];
            pane(shift(center, direction, -.012), shift(center, direction, .012), .004, 'fp-model-window-frame');
        }
    };
    for (const room of plan.rooms) {
        const outline = roomCorners(room);
        const points = outline.map(point => project(point));
        const active = room.id === selected ? ' selected' : '';
        const floor = room.floorFinish ?? (exampleFloor(room) || 'boards');
        floorClip.push(spacePolygon('polygon', points));
        shadows.push('M' + points.map(point => point.join(' ')).join('L') + 'Z');
        bases.push(...blockFaces(outline, -floorSlabDepth, 0, 'class="fp-model-base"', false));
        floors.push(spacePolygon('polygon', points, `class="fp-space-floor${active}" data-item="${room.id}" data-floor="${floor}"`));
        // Only wood and tiles have a texture; other finishes are a plain colour.
        if (!draft && (floor === 'boards' || floor === 'tiles')) floors.push(spacePolygon('polygon', points, `class="fp-model-texture" data-floor="${floor}"`));
        polygonEdges(outline).forEach(([a, b], index) => {
            addWall(a, b, room, room.id);
            addOutsideCorner(outline[(index + outline.length - 1) % outline.length], a, b, room);
        });
        for (const [x, y, endX, endY] of room.outline || plan.windows?.some(window => window.roomId === room.id) ? [] : exampleWindows(room)) {
            const start = [room.x + x * room.width, room.y + y * room.depth];
            const end = [room.x + endX * room.width, room.y + endY * room.depth];
            const normal = x === endX ? [x === 0 ? 1 : -1, 0] : [0, y === 0 ? 1 : -1];
            const sill = room.id === 'kitchen' ? 1.22 : defaultWindowSill;
            addWindow(start, end, room, normal, sill, sill + .94, 'fp-model-window', '', true);
        }
    }
    for (const item of furniture) {
        const transform = furnitureProjection(item);
        const attributes = `data-item="${item.id}" data-furniture-id="${item.id}" data-material="${item.material}" data-model="${item.kind}"`;
        const active = item.id === selected ? ' selected' : '';
        const style = `class="fp-model-furniture${active}" ${attributes}`;
        if (item.kind === 'rug') {
            for (const [index, vertices] of rugLayers(item).slice(0, draft ? 1 : undefined).entries()) {
                floors.push(spacePolygon('polygon', vertices.map(([x, y, z]) => project(transform([x, y]), z)),
                    `class="fp-model-rug${active}" ${attributes} data-layer="${index}"`));
            }
            continue;
        }
        if (draft) {
            objects.push(...blockFaces(furnitureFootprint(item), item.base, item.base + item.height, `${style} data-surface="body"`));
            continue;
        }
        const { parts, faces } = furnitureMesh(item);
        if (item.kind !== 'glass' && item.kind !== 'curtain') {
            const reach = Math.min(.32, item.height * .19);
            const cast = furnitureFootprint(item).map(([x, y]) => project([x + reach * light.cast[0], y + reach * light.cast[1]]));
            floorShadows.push(spacePolygon('polygon', cast));
            if (item.base <= .05) {
                const touches = parts.filter(part => part.low <= .05);
                const contact = touches.length ? touches.map(part => rectangle(part.x, part.y, part.w, part.d).map(transform))
                    : [furnitureFootprint(item)];
                contactShadows.push(...contact.map(outline => spacePolygon('polygon', outline.map(point => project(point)))));
            }
        }
        for (const part of parts) {
            const corners = rectangle(part.x, part.y, part.w, part.d).map(transform);
            objects.push(...blockFaces(corners, part.low, part.high,
                `${style} data-surface="${part.surface}"`));
        }
        objects.push(...faces.map(({ vertices, surface, face }) => ({
            vertices:vertices.map(([x, y, z]) => [...transform([x, y]), z]),
            className:`fp-model-${face}`,
            attributes:`${style} data-surface="${surface}"`,
        })));
    }
    for (const wall of plan.walls) addWall([wall.x, wall.y], [wall.endX, wall.endY], null, wall.id);
    for (const type of ['windows', 'mirrors']) for (const item of plan[type] ?? []) {
        const room = plan.rooms.find(entry => entry.id === item.roomId);
        if (!room) continue;
        const angle = item.angle * Math.PI / 180;
        const a = [item.x, item.y], b = [item.x + Math.cos(angle) * item.width, item.y + Math.sin(angle) * item.width];
        const normal = inward(a, b);
        const [x, y] = shift(midpoint(a, b), normal, .025);
        const facing = contains(room, { x, y }) ? normal : normal.map(value => -value);
        addWindow(a, b, room, facing, item.base, item.base + item.height,
            `fp-space-opening ${type}${item.id === selected ? ' selected' : ''}`, `data-item="${item.id}"`);
    }
    const zones = (plan.zones ?? []).map(item => paintZone(item, point => project(point, .025), item.id === selected)).join('');
    const openings = doors.map((door, index) => spacePolygon('polyline', door.map(point => project(point)),
        `class="fp-space-door${plan.doors[index].id === selected ? ' selected' : ''}" data-item="${plan.doors[index].id}"`));
    const shadowId = `fp-floor-clip-${sceneId}`;
    const interiorShadows = floorClip.length && !draft ? `<defs><clipPath id="${shadowId}">${floorClip.join('')}</clipPath></defs>
        <g class="fp-interior-shadow" clip-path="url(#${shadowId})">
            <g class="fp-wall-contact">${floorClip.join('')}</g>
            <g class="fp-furniture-shadow">${floorShadows.join('')}</g>
            <g class="fp-furniture-contact">${contactShadows.join('')}</g>
        </g>` : '';
    return {
        hasFurniture: furniture.length > 0,
        markup: `${draft ? '' : `<path class="fp-model-shadow" d="${shadows.join('')}"/>`}${paintFaces(bases, project, towardCamera, light)}${floors.join('')}${interiorShadows}${floorOverlay}${zones}
            ${openings.join('')}${paintFaces(objects, project, towardCamera, light)}`,
    };
}
