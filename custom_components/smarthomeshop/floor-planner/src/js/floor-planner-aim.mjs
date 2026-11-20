// The two drawings in the sensor dialog that show where a wall sensor looks,
// and what a pointer in them means. From above it is turned; from the side it
// is tilted and moved up and down. Both are drawn in metres.
import { deviceHousing, deviceScale } from './floor-planner-device-mesh.mjs';
import { roomCorners, roomRayEnd } from './floor-planner-geometry.mjs';
import { sensorTilt, wallVector } from './floor-planner-model.mjs';
import { fieldCoversPoint, wallMountHeight, wallReach, wallSector } from './floor-planner-radar.mjs';

const degree = Math.PI / 180;
const fixed = value => Number(value.toFixed(3));
// A pointer sets whole steps; the slider and the number beside it set single degrees.
const turnStep = 5;
const heightStep = .05;
// How far from the radar the handle sits that is dragged to aim it.
const handleReach = 1.3;
const personHeight = 1.75;

const snapped = (value, step) => step ? Math.round(value / step) * step : value;
const clamped = (value, low, high) => Math.max(low, Math.min(high, value));
export const wrapDegrees = value => ((value % 360) + 360) % 360;
// The same angle between -180 and 180.
const signedDegrees = value => wrapDegrees(value + 180) - 180;

/** How far the wall is that a sensor looks at, in metres. Infinity outside a room. */
export function wallAhead(room, item) {
    if (!room) return Infinity;
    const { x, y } = wallVector(item.angle);
    const [endX, endY] = roomRayEnd(room, item, { x: item.x + x * 80, y: item.y + y * 80 });
    const distance = Math.hypot(endX - item.x, endY - item.y);
    return distance > .01 ? distance : Infinity;
}

/** The direction from a sensor to a point of the plan, in degrees. */
export function directionTo(item, point, step = turnStep) {
    return wrapDegrees(snapped(Math.atan2(point.x - item.x, item.y - point.y) / degree, step));
}

/** How far a sensor on a bracket is turned when it looks at a point: from straight out of the wall, no further than it can. */
export function turnTo(item, point, limit, step = turnStep) {
    const straight = item.angle - (item.pan ?? 0);
    return clamped(snapped(signedDegrees(directionTo(item, point, 0) - straight), step), -limit, limit);
}

/** The tilt of a sensor that looks at a point of the side view: metres ahead of it and above the floor. */
export function tiltTo(mount, { ahead, height }, step = turnStep) {
    return clamped(snapped(Math.atan2(mount - height, Math.max(ahead, .05)) / degree, step), sensorTilt.min, sensorTilt.max);
}

/** The mounting height for a point of the side view, kept under the ceiling. */
export function heightTo(height, ceiling = 6) {
    return fixed(clamped(snapped(height, heightStep), .15, Math.min(6, ceiling - .1)));
}

/** Whether a point of the side view is on the sensor itself, which moves it up and down instead of tilting it. */
export const onDevice = (mount, { ahead, height }) => Math.hypot(ahead, height - mount) < .34;

// The device from above and from the side, at the size it has in the 3D scene.
function glyph(model) {
    const housing = deviceHousing(model) ?? deviceHousing('ultimatesensor-v2');
    // The large lens on the front, for the devices that have one, shows which way a device looks.
    return { width: housing.width * deviceScale, height: housing.height * deviceScale, depth: housing.depth * deviceScale, lens: housing.front === 'dome' };
}

const drawnField = field => `class="fp-aim-field" data-radar="${field.radar}" data-secondary="${Boolean(field.secondary)}"`;

/**
 * The room from above with the floor the sensor covers.
 * Returns { viewBox, markup }; a pointer in it is a point of the plan.
 */
export function aimTopView({ room, item, fields }) {
    const corners = room ? roomCorners(room) : [[item.x - 3, item.y - 3], [item.x + 3, item.y - 3], [item.x + 3, item.y + 3], [item.x - 3, item.y + 3]];
    const xs = corners.map(([x]) => x), ys = corners.map(([, y]) => y);
    const left = Math.min(...xs), top = Math.min(...ys);
    const width = Math.max(...xs) - left, depth = Math.max(...ys) - top;
    const edge = Math.max(width, depth) * .07 + .3;
    // The device and the handle keep a size that can be seen and taken hold of, whatever the room.
    const span = Math.max(width, depth);
    const scale = clamped(span / 2.7, 1.5, 5);
    const { width: side, depth: deep, lens } = glyph(item.model);
    const reach = clamped(span * .3, 1, 3.5);
    const outline = corners.map(corner => corner.map(fixed).join(',')).join(' ');
    return {
        viewBox: [left - edge, top - edge, width + 2 * edge, depth + 2 * edge].map(fixed).join(' '),
        markup: `<defs><clipPath id="fp-aim-top-room"><polygon points="${outline}"/></clipPath></defs>
            ${room ? `<polygon class="fp-aim-room" points="${outline}"/>` : ''}
            <g clip-path="url(#fp-aim-top-room)"><g transform="translate(${fixed(item.x)} ${fixed(item.y)}) rotate(${fixed(item.angle)})">
                ${fields.map(field => `<path ${drawnField(field)} d="${wallSector(field)}"/>`).join('')}
            </g></g>
            <g transform="translate(${fixed(item.x)} ${fixed(item.y)}) rotate(${fixed(item.angle)})">
                <path class="fp-aim-line" d="M0 0V${fixed(-reach)}"/>
                <g transform="scale(${fixed(scale)})">
                    <rect class="fp-aim-device" x="${fixed(-side / 2)}" y="${fixed(-deep / 2)}" width="${fixed(side)}" height="${fixed(deep)}" rx="${fixed(deep * .24)}"/>
                    ${lens ? `<path class="fp-aim-device-lens" d="M${fixed(-side * .23)} ${fixed(-deep / 2)}a${fixed(side * .2)} ${fixed(side * .17)} 0 0 1 ${fixed(side * .4)} 0z"/>`
                        : `<path class="fp-aim-device-light" d="M${fixed(-side * .3)} ${fixed(-deep / 2)}H${fixed(side * .3)}"/>`}
                </g>
                <circle class="fp-aim-handle" cy="${fixed(-reach)}" r="${fixed(span * .028)}"/>
            </g>`,
        handle: { x: item.x + wallVector(item.angle).x * reach, y: item.y + wallVector(item.angle).y * reach },
    };
}

/**
 * The room from the side, along where the sensor looks: the wall or cabinet
 * it is on, how high it hangs, the beam of its tracking radar and a person.
 * Returns { viewBox, markup, reach, seen, frame }. `reach` is the stretch of
 * floor on which it sees someone standing, or null. `frame` turns a point of
 * the drawing into metres ahead of the sensor and above the floor.
 */
export function aimSideView({ room, item, fields, onWall }) {
    const mount = item.mountHeight ?? wallMountHeight, tilt = item.tilt ?? 0;
    const ceiling = Math.max(room?.height ?? 2.6, mount + .25);
    const wall = wallAhead(room, item);
    const primary = fields.find(field => !field.secondary) ?? fields[0] ?? null;
    const end = Math.min(wall, Math.max(4.5, ...fields.map(field => field.range)));
    const { height: tall, depth: deep, lens } = glyph(item.model);
    const back = -(deep / 2 + .12);

    const open = primary ? wallReach(primary) : null;
    const reach = open && open.from < wall ? { from: open.from, to: Math.min(open.to, wall) } : null;
    const person = Math.max(.6, Math.min(2.5, end - .45));
    const seen = Boolean(primary) && person <= wall
        && fieldCoversPoint(primary, { x: 0, y: 0, angle: 0 }, { x: 0, y: -person }, 'standing', 1.35);

    // Height goes up, so it is drawn at minus its value.
    const beam = field => {
        const low = -tilt - field.pitch, high = -tilt + field.pitch;
        const arc = Array.from({ length: 13 }, (_, index) => (low + (high - low) * index / 12) * degree)
            .map(angle => `${fixed(Math.cos(angle) * field.range)} ${fixed(-mount - Math.sin(angle) * field.range)}`);
        return `<path ${drawnField(field)} d="M0 ${fixed(-mount)}L${arc.join('L')}Z"/>`;
    };
    const aim = -tilt * degree;
    const handle = { ahead: Math.cos(aim) * handleReach, height: mount + Math.sin(aim) * handleReach };
    const left = back - .5, right = end + .4, top = -(ceiling + .3), bottom = .32;
    return {
        viewBox: [left, top, right - left, bottom - top].map(fixed).join(' '),
        reach, seen,
        frame: ({ x, y }) => ({ ahead: x, height: -y }),
        markup: `<defs><clipPath id="fp-aim-side-room"><rect x="0" y="${fixed(-ceiling)}" width="${fixed(end)}" height="${fixed(ceiling)}"/></clipPath></defs>
            <path class="fp-aim-ceiling" d="M${fixed(onWall ? back : left)} ${fixed(-ceiling)}H${fixed(end)}"/>
            ${onWall ? `<rect class="fp-aim-wall" x="${fixed(back - .16)}" y="${fixed(-ceiling)}" width=".16" height="${fixed(ceiling)}"/>
                <path class="fp-aim-arm" d="M${fixed(back)} ${fixed(-mount)}H0"/>`
                : mount - tall / 2 > .08 ? `<rect class="fp-aim-cabinet" x="-.42" y="${fixed(-(mount - tall / 2))}" width=".84" height="${fixed(mount - tall / 2)}" rx=".03"/>` : ''}
            ${Number.isFinite(wall) && wall <= end + 1e-6 ? `<rect class="fp-aim-wall" x="${fixed(end)}" y="${fixed(-ceiling)}" width=".16" height="${fixed(ceiling)}"/>` : ''}
            <g clip-path="url(#fp-aim-side-room)">${[...fields].sort((a, b) => Boolean(b.secondary) - Boolean(a.secondary)).map(beam).join('')}</g>
            <path class="fp-aim-floor" d="M${fixed(left)} 0H${fixed(right)}"/>
            ${reach ? `<path class="fp-aim-reach" d="M${fixed(reach.from)} 0H${fixed(reach.to)}"/>` : ''}
            <g class="fp-aim-person" ${seen ? 'data-seen' : ''} transform="translate(${fixed(person)} 0)">
                <circle cy="${fixed(-personHeight + .13)}" r=".13"/>
                <path d="M-.2 ${fixed(-personHeight + .34)}q0 -.05 .05 -.05h.3q.05 0 .05 .05v.62q0 .04 -.06 .04v.7q0 .05 -.05 .05h-.18q-.05 0 -.05 -.05v-.7q-.06 0 -.06 -.04z"/>
            </g>
            <path class="fp-aim-line" d="M0 ${fixed(-mount)}L${fixed(handle.ahead)} ${fixed(-handle.height)}"/>
            <g transform="translate(0 ${fixed(-mount)}) rotate(${fixed(tilt)})">
                <rect class="fp-aim-device" x="${fixed(-deep / 2)}" y="${fixed(-tall / 2)}" width="${fixed(deep)}" height="${fixed(tall)}" rx="${fixed(deep * .24)}"/>
                <path class="fp-aim-device-light" d="M${fixed(deep / 2)} ${fixed(tall * .2)}V${fixed(tall * .34)}"/>
                ${lens ? `<path class="fp-aim-device-lens" d="M${fixed(deep / 2)} ${fixed(-tall * .42)}a${fixed(tall * .075)} ${fixed(tall * .1)} 0 0 1 0 ${fixed(tall * .2)}z"/>` : ''}
            </g>
            <circle class="fp-aim-handle" cx="${fixed(handle.ahead)}" cy="${fixed(-handle.height)}" r=".13"/>`,
    };
}

const fill = (text, values) => Object.entries(values).reduce((line, [key, value]) => line.replaceAll(`:${key}`, value), text ?? '');

/** In words how far a sensor is turned: on its bracket to a side, standing free as a direction. */
export function turnText(copy, value, onBracket) {
    if (!onBracket) return `${Math.round(wrapDegrees(value))}°`;
    return value ? fill(value < 0 ? copy.aim_left : copy.aim_right, { value: String(Math.abs(Math.round(value))) }) : copy.aim_straight;
}

/** In words how far a sensor is tilted. */
export function tiltText(copy, value) {
    return value ? fill(value < 0 ? copy.aim_up : copy.aim_down, { value: String(Math.abs(Math.round(value))) }) : copy.aim_level;
}

/** How far the PIR of a sensor sees someone move, straight ahead and no further than the wall it looks at. Null without a PIR. */
export function motionReach(room, item, field) {
    const reach = field && wallReach(field);
    return reach ? Math.min(reach.to, wallAhead(room, item)) : null;
}

/** What the sensor sees of the floor, for under the drawings. */
export function reachText(copy, reach, number = String) {
    return reach ? fill(copy.aim_reach, { from: number(reach.from), to: number(reach.to) }) : copy.aim_reach_none;
}
