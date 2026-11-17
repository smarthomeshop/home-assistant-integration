import { exampleWindows, furnitureParts } from './floor-planner-furniture.mjs';
import { ceilingProfiles, radarFields, radarOrigin, sensorMountHeight, wallSector } from './floor-planner-radar.mjs';
import { devices, roomForDevice } from './floor-planner-model.mjs';
import { polygonEdges, roomArea, roomCorners, roomInteriorPoint } from './floor-planner-geometry.mjs';
import { prepareSight, sightPolygon } from './floor-planner-sight.mjs';

import { ceilingHeightAt } from './floor-planner-ceiling.mjs';

export const escapeText = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const rectangle = (x, y, width, depth, radius = 0) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${depth}" rx="${radius}"/>`;

export function paintRoomSurface(room, attributes = '', local = false) {
    if (!room.outline) return `<rect ${attributes} x="${local ? 0 : room.x}" y="${local ? 0 : room.y}" width="${room.width}" height="${room.depth}"/>`;
    const points = local ? room.outline : roomCorners(room);
    return `<polygon ${attributes} points="${points.map(point => point.join(',')).join(' ')}"/>`;
}

export function paintZone(item, project, active) {
    return `<g class="fp-plan-zone ${item.type}${active ? ' selected' : ''}" data-item="${item.id}">
        ${item.parts.map(part => {
            const entry = item.type === 'entry';
            const shape = `<${entry ? 'polyline' : 'polygon'} points="${part.map(project).map(point => point.join(',')).join(' ')}"/>`;
            if (!entry) return shape;
            const [[ax, ay], [bx, by]] = part;
            const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy);
            const x = (ax + bx) / 2, y = (ay + by) / 2;
            const side = item.direction === 'left' ? -1 : 1;
            const normalX = -dy / length * side, normalY = dx / length * side;
            const arrow = [[x - normalX * .07, y - normalY * .07], [x + normalX * .23, y + normalY * .23]].map(project);
            const left = project([x + normalX * .13 + dx / length * .09, y + normalY * .13 + dy / length * .09]);
            const right = project([x + normalX * .13 - dx / length * .09, y + normalY * .13 - dy / length * .09]);
            return shape + `<path class="fp-entry-arrow" d="M${arrow[0].join(' ')}L${arrow[1].join(' ')}M${left.join(' ')}L${arrow[1].join(' ')}L${right.join(' ')}"/>`;
        }).join('')}
    </g>`;
}

function paintWindows(room) {
    if (room.outline) return '';
    return exampleWindows(room).map(([x, y, endX, endY]) =>
        `<path class="fp-window" d="M${x * room.width} ${y * room.depth}L${endX * room.width} ${endY * room.depth}"/>`).join('');
}

export function paintFurniture(item, selected = false, interactive = true) {
    const shape = furnitureParts(item).map(part =>
        `<rect class="fp-furniture-part" x="${part.x}" y="${part.y}" width="${part.w}" height="${part.d}"/>`).join('');
    return `<g class="fp-plan-furniture${selected ? ' selected' : ''}" ${interactive ? `data-item="${item.id}" data-furniture-id="${item.id}"` : ''} data-material="${item.material}"
        transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
        <rect class="fp-furniture-hit" x="${-item.width / 2}" y="${-item.depth / 2}" width="${item.width}" height="${item.depth}"/>${shape}</g>`;
}

// The range of a sensor, cut off where it cannot see: at walls and closed
// doors, and past an open door only as far as it looks through it.
function coverage(item, room, isSelected, focus, radarOptions, sight) {
    const fields = radarFields(room, item, radarOptions);
    if (!fields.length) return '';
    const ceiling = devices[item.model].mount === 'ceiling';
    const shape = fields.map(field => {
        const style = field.secondary ? ' class="fp-secondary-range"' : '';
        if (!field.radii) return `<path${style} d="${wallSector(field)}"/>`;
        if (field.profiles && focus?.item.id === item.id && focus.field.radar === field.radar) {
            return [...ceilingProfiles].reverse().map(name => {
                const [rx, ry] = field.profiles[name];
                return `<ellipse class="fp-profile-rim${name === focus.profile ? ' active' : ''}" data-profile="${name}" rx="${rx}" ry="${ry}"/>`;
            }).join('');
        }
        const [rx, ry] = field.radii;
        return `<ellipse${style} rx="${rx}" ry="${ry}"/>`;
    }).join('');
    const clipId = 'fp-sight-' + item.id;
    const seen = sightPolygon(sight, radarOrigin(item), { height: sensorMountHeight(item, room) });
    const clip = `<defs><clipPath id="${clipId}">
        <polygon points="${seen.map(point => point.map(value => Number(value.toFixed(3))).join(',')).join(' ')}"/>
    </clipPath></defs>`;
    return `${clip}<g class="fp-range ${ceiling ? 'ceiling' : 'wall'} ${isSelected ? 'selected' : ''}"
        ${fields.some(field => field.estimatedHeight) ? 'data-height-estimate' : ''} clip-path="url(#${clipId})">
        <g transform="translate(${item.x} ${item.y}) rotate(${item.angle})">${shape}</g></g>`;
}

export function paintPlacementPreview(plan, item, radarOptions) {
    const room = roomForDevice(plan.rooms, item);
    const mount = devices[item.model].mount;
    const marker = mount === 'ceiling' ? '<circle r=".18"/>' : '<rect x="-.19" y="-.14" width=".38" height=".28" rx=".05"/>';
    return `<g class="fp-placement-preview">
        ${coverage({ ...item, id: '__placement_preview' }, room, true, null, radarOptions, prepareSight(plan))}
        <g class="fp-placement-marker ${mount}" transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
            <circle r=".34" class="fp-placement-ring"/>${marker}<path d="M-.07 0H.07M0-.07V.07"/>
        </g>
    </g>`;
}

function ceilingMarks(room, number, active) {
    if (!room.ceiling) return '';
    const { direction, type, high } = room.ceiling;
    const alongX = direction.startsWith('x');
    const slopeSize = alongX ? room.width : room.depth;
    const crossSize = alongX ? room.depth : room.width;
    const center = crossSize / 2;
    const low = direction.endsWith('+') ? .2 * slopeSize : .8 * slopeSize;
    const top = type === 'gable' ? slopeSize / 2 : slopeSize - low;
    const path = alongX ? `M${low} ${center}H${top}` : `M${center} ${low}V${top}`;
    const labels = alongX ? [[low, center + .24], [top, center - .1]]
        : [[center + .12, low], [center + .12, top]];
    const ridge = type !== 'gable' ? '' : alongX ? `M${top} 0V${crossSize}` : `M0 ${top}H${crossSize}`;
    const sideMarks = alongX ? [[.13, center - .14], [room.width - .13, center - .14]]
        : [[center - .16, .24], [center - .16, room.depth - .13]];
    return `<g class="fp-ceiling-marks${active ? ' active' : ''}">
        ${active ? sideMarks.map(([x, y], index) => `<text x="${x}" y="${y}" text-anchor="middle">${index ? 'B' : 'A'}</text>`).join('') : ''}
        ${ridge ? `<path d="${ridge}"/>` : ''}
        <path class="fp-slope-arrow" d="${path}" marker-end="url(#fp-slope-tip)"/>
        ${labels.map(([x, y], index) => `<text x="${x}" y="${y}" text-anchor="middle">${number.format(index === 0 ? room.height : high)} m</text>`).join('')}
    </g>`;
}

const heightTag = { x: .27, y: -.48, width: .8, height: .27 };
const roomLabelPosition = room => roomInteriorPoint(room, { x: room.x + room.width * .32, y: room.y + room.depth * .22 });

function ceilingMask(rooms, sensors, heightTagSensor) {
    const x = Math.min(...rooms.map(room => room.x)) - 1;
    const y = Math.min(...rooms.map(room => room.y)) - 1;
    const width = Math.max(...rooms.map(room => room.x + room.width)) - x + 1;
    const height = Math.max(...rooms.map(room => room.y + room.depth)) - y + 1;
    const sensorsCutout = sensors.map(item => `<g transform="translate(${item.x} ${item.y})" fill="black">
        <circle r=".39"/>
        <rect class="fp-number-cutout" x=".29" y="-.19" width=".39" height=".34"/>
        ${item === heightTagSensor
            ? `<rect class="fp-height-cutout" x="${heightTag.x - .06}" y="${heightTag.y - .06}"
                width="${heightTag.width + .12}" height="${heightTag.height + .12}"/>` : ''}
    </g>`).join('');
    const labelsCutout = rooms.filter(room => room.outline).map(room => {
        const label = roomLabelPosition(room);
        const width = Math.min(room.width, Math.min(24, room.name.length) * .15 + .45);
        return `<rect x="${label.x - width / 2}" y="${label.y - .27}" width="${width}" height=".66" fill="black"/>`;
    }).join('');

    return `<mask id="fp-slope-clearance" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"
        x="${x}" y="${y}" width="${width}" height="${height}">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white"/>${sensorsCutout}${labelsCutout}
    </mask>`;
}

export const sensorMarkerAttributes = (item, index) =>
    `data-sensor-marker="" tabindex="0" role="button" aria-haspopup="dialog" aria-label="${String(index + 1).padStart(2, '0')} · ${devices[item.model].name}"`;

// With casing, every room outline gets a wider line in the floor colour under
// it. The editor asks for that while the floors are see-through on top of an
// image, where the outline alone would fade into a light plan.
export function paintPlan(plan, showCoverage, selected, number, focus = null, { measures = false, interactiveSensors = false, radarOptions, casing = false } = {}) {
    const selectedClass = item => selected === item.id ? ' selected' : '';
    const activeSensor = plan.sensors.find(item => item.id === selected);
    const activeRoom = plan.rooms.find(room => room.id === selected) ?? (activeSensor && roomForDevice(plan.rooms, activeSensor));
    const rooms = plan.rooms.map(room => `<g data-item="${room.id}" class="fp-room${selectedClass(room)}" transform="translate(${room.x} ${room.y})">
        ${casing ? paintRoomSurface(room, 'class="fp-room-casing"', true) : ''}
        ${paintRoomSurface(room, 'class="fp-room-floor"', true)}
        ${plan.windows?.some(window => window.roomId === room.id) ? '' : paintWindows(room)}
    </g>`).join('');
    const roomLabels = plan.rooms.map(room => {
        const measures = room.outline ? `${number.format(roomArea(room))} m²` : `${number.format(room.width)} × ${number.format(room.depth)} m`;
        const label = room.outline ? roomLabelPosition(room) : null;
        const name = room.name.length > 24 && label ? room.name.slice(0, 23) + '...' : room.name;
        return `<g pointer-events="none" transform="translate(${room.x} ${room.y})">
            ${label ? `<g class="fp-room-label" text-anchor="middle" transform="translate(${label.x - room.x} ${label.y - room.y})">
                <text>${escapeText(name)}</text><text class="fp-room-size" y=".28">${measures}</text>
            </g>` : `<svg class="fp-room-label" x=".23" y=".17" width="${room.width - .31}" height="1.5" overflow="hidden">
                <text y=".34">${escapeText(room.name)}</text>
                <text class="fp-room-size" y=".64">${measures}</text>
            </svg>`}
        </g>`;
    }).join('');
    const ceilingRooms = plan.rooms.filter(room => room.ceiling);
    const heightTagSensor = activeRoom?.ceiling && activeSensor && devices[activeSensor.model].mount === 'ceiling'
        ? activeSensor : null;
    // Only the ceiling annotations are cut away. The room, coverage and sensor remain visible.
    const slopeMask = ceilingRooms.length && (plan.sensors.length || ceilingRooms.some(room => room.outline))
        ? ceilingMask(ceilingRooms, plan.sensors, heightTagSensor) : '';
    const marks = ceilingRooms.map(room => `<g${room.outline ? ` clip-path="url(#clip-${room.id})"` : ''}>
        <g transform="translate(${room.x} ${room.y})">${ceilingMarks(room, number, room.id === activeRoom?.id)}</g>
    </g>`).join('');
    const ceilingLayer = marks ? `<g${slopeMask ? ' mask="url(#fp-slope-clearance)"' : ''}>${marks}</g>` : '';
    const clips = plan.rooms.map(room => `<clipPath id="clip-${room.id}">${paintRoomSurface(room)}</clipPath>`).join('');
    const sight = showCoverage ? prepareSight(plan) : null;
    const ranges = showCoverage ? plan.sensors.map(item =>
        coverage(item, roomForDevice(plan.rooms, item), selected === item.id, focus, radarOptions, sight)).join('') : '';
    const outline = activeRoom && activeRoom.id === selected
        ? paintRoomSurface(activeRoom, 'class="fp-room-outline"') : '';
    const walls = plan.walls.map(wall => `<g class="fp-wall${selectedClass(wall)}" data-item="${wall.id}">
        <line class="fp-wall-hit" x1="${wall.x}" y1="${wall.y}" x2="${wall.endX}" y2="${wall.endY}"/>
        <line x1="${wall.x}" y1="${wall.y}" x2="${wall.endX}" y2="${wall.endY}"/></g>`).join('');
    const doors = plan.doors.map(door => `<g data-item="${door.id}" class="fp-door${door.closed ? ' closed' : ''}${selectedClass(door)}" transform="translate(${door.x} ${door.y}) rotate(${door.angle})">
        <path class="fp-door-gap" d="M0 0h${door.width}"/>
        ${door.closed ? `<path class="fp-door-shut" d="M0 0h${door.width}"/>`
            : `<path class="fp-door-leaf" d="M0 0v-${door.width}a${door.width} ${door.width} 0 0 1 ${door.width} ${door.width}"/>`}
        ${rectangle(-.12, -door.width - .12, door.width + .24, door.width + .24)}
    </g>`).join('');
    const sensors = plan.sensors.map((item, index) => {
        const mount = devices[item.model].mount;
        const icon = mount === 'ceiling'
            ? '<circle r=".2"/><circle class="fp-sensor-eye" r=".072"/>'
            : '<rect x="-.2" y="-.16" width=".4" height=".32" rx=".06"/><path d="M-.07 .025 0-.06.07 .025" fill="none"/>';
        const mountHeight = item === heightTagSensor
            ? `<g class="fp-sensor-height" transform="translate(${heightTag.x} ${heightTag.y})">
                <rect x="0" y="0" width="${heightTag.width}" height="${heightTag.height}" rx=".05"/>
                <text x=".4" y=".18" text-anchor="middle">${number.format(ceilingHeightAt(activeRoom, item))} m</text>
            </g>` : '';
        return `<g data-item="${item.id}" class="fp-sensor ${mount}${selectedClass(item)}" transform="translate(${item.x} ${item.y})" ${interactiveSensors ? sensorMarkerAttributes(item, index) : ''}>
            <circle r=".34" class="fp-sensor-halo"/><g transform="rotate(${item.angle})">${icon}</g>
            ${interactiveSensors ? '<circle class="fp-sensor-focus" r=".39"/>' : ''}
            <text x=".36" y=".08">${String(index + 1).padStart(2, '0')}</text>${mountHeight}
        </g>`;
    }).join('');
    const furniture = (plan.furniture ?? []).map(item => paintFurniture(item, selected === item.id)).join('');
    const openings = ['windows', 'mirrors'].flatMap(type => (plan[type] ?? []).map(item =>
        `<g class="fp-opening ${type}${selectedClass(item)}" data-item="${item.id}" transform="translate(${item.x} ${item.y}) rotate(${item.angle})">
            <line class="fp-opening-hit" x2="${item.width}"/><line x2="${item.width}"/>
            <path d="M0 -.075v.15 M${item.width} -.075v.15"/></g>`)).join('');
    const dimensions = measures ? plan.rooms.map(room => polygonEdges(roomCorners(room)).map(([[ax, ay], [bx, by]]) => {
        const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy);
        const x = (ax + bx) / 2 - dy / length * .2, y = (ay + by) / 2 + dx / length * .2;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const rotation = angle > 90 || angle < -90 ? angle + 180 : angle;
        return length < .35 ? '' : `<text class="fp-wall-measure" x="${x}" y="${y}" transform="rotate(${rotation} ${x} ${y})">${number.format(length)} m</text>`;
    }).join('')).join('') : '';
    const zones = (plan.zones ?? []).map(item => paintZone(item, point => point, selected === item.id)).join('');
    return `<defs>${clips}${slopeMask}<marker id="fp-slope-tip" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2 0 4Z" fill="#b4baff"/></marker></defs>${rooms}${furniture}${ranges}${zones}${ceilingLayer}${walls}${outline}${doors}${openings}${dimensions}${roomLabels}${sensors}`;
}
