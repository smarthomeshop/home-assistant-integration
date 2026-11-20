// The sensors that hang on a wall or stand on a cabinet, as small 3D models
// in the scene. A sensor of a hand's size disappears in a whole room, so the
// models are drawn four times their real size. Their proportions, and what
// is on their front, are those of the real devices.
import { furnitureFootprint } from './floor-planner-furniture.mjs';
import { convexHull, pointInOutline } from './floor-planner-geometry.mjs';
import { installationFor, wallVector } from './floor-planner-model.mjs';

export const deviceScale = 4;

// Real sizes in metres: width, height and depth of the housing.
const tall = { width: .056, height: .107, depth: .041, front: 'dome' };
const short = { width: .056, height: .087, depth: .038, front: 'eye' };
const housings = {
    ultimatesensor: tall,
    'ultimatesensor-v2': tall,
    'ultimatesensor-mini': short,
    'ultimatesensor-mini-v2': short,
    // The cover frame of a wall box, with the square sensor plate in it.
    wallsense: { width: .081, height: .081, depth: .011, front: 'plate' },
};
export const deviceHousing = model => housings[model] ?? null;

const degree = Math.PI / 180;
const plastic = [246, 247, 249];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const number = value => Number(value.toFixed(3));

// The directions of a device in the room: to its side, where it looks and its top.
function axes(angle, tilt) {
    const { x, y } = wallVector(angle);
    const cos = Math.cos(tilt * degree), sin = Math.sin(tilt * degree);
    return { side: [-y, x, 0], ahead: [x * cos, y * cos, -sin], up: [x * sin, y * sin, cos] };
}

const placed = (centre, { side, ahead, up }) => ([s, f, u]) => centre.map((value, index) => value + s * side[index] + f * ahead[index] + u * up[index]);

// How far the upright edges of a housing are rounded, as a part of its smaller side.
const rounding = .24;

// A box with rounded upright edges, as flat faces that each catch their own light.
function housingFaces(width, height, depth) {
    const w = width / 2, d = depth / 2, h = height / 2, radius = Math.min(width, depth) * rounding;
    const ring = [[1, -1, -90], [1, 1, 0], [-1, 1, 90], [-1, -1, 180]].flatMap(([s, f, from]) => [0, 1, 2, 3].map(step => {
        const turn = (from + step * 30) * degree;
        return [s * (w - radius) + Math.cos(turn) * radius, f * (d - radius) + Math.sin(turn) * radius];
    }));
    const sides = ring.map(([s, f], index) => {
        const [nextS, nextF] = ring[(index + 1) % ring.length];
        return { normal: [nextF - f, s - nextS, 0], corners: [[s, f, -h], [nextS, nextF, -h], [nextS, nextF, h], [s, f, h]] };
    });
    return [...sides,
        { normal: [0, 0, 1], corners: ring.map(([s, f]) => [s, f, h]), lid: true },
        { normal: [0, 0, -1], corners: ring.map(([s, f]) => [s, f, -h]).reverse(), lid: true }];
}

const disc = (s, u, radius, points = 14) => Array.from({ length: points }, (_, index) => {
    const turn = index * 2 * Math.PI / points;
    return [s + Math.cos(turn) * radius, u + Math.sin(turn) * radius];
});
const band = (left, right, low, high) => [[left, low], [right, low], [right, high], [left, high]];

// What is on the front, as flat shapes on it: [corners as side and up, colour].
// Seen from the front, the side axis points to the left.
function frontShapes({ width: w, height: h, depth, front }, fine) {
    const flat = w / 2 - Math.min(w, depth) * rounding;
    if (front === 'plate') {
        const plate = .055 * deviceScale / 2;
        return [[band(-plate, plate, -plate, plate), [250, 250, 251]], [disc(0, -plate * .12, plate * .46), [236, 239, 242]],
            [band(-plate * .2, plate * .2, plate * .62, plate * .74), [92, 62, 66]]];
    }
    const low = -h / 2;
    const grille = [low + h * .03, low + h * .25];
    const holes = fine ? [.25, .5, .75].flatMap(row => [-.72, -.48, -.24, 0, .24, .48, .72].map(column => {
        const s = column * flat, u = grille[0] + (grille[1] - grille[0]) * row, size = w * .028;
        return [band(s - size, s + size, u - size, u + size), [150, 160, 170]];
    })) : [];
    const eye = front === 'dome'
        ? [[disc(-w * .03, h * .31, w * .235), [213, 219, 225]], [disc(-w * .03, h * .31, w * .2), [252, 252, 253]],
            [disc(w * .29, h * .31, w * .05, 8), [140, 148, 157]]]
        : [[disc(w * .26, h * .2, w * .07, 10), [176, 184, 192]], [disc(w * .26, h * .2, w * .04, 8), [96, 104, 113]]];
    // The strip above the grille is the light of the device; it takes the colour of its marker.
    return [[band(-flat, flat, ...grille), [226, 230, 234]], ...holes,
        [band(-flat, flat, low + h * .265, low + h * .32), [214, 221, 227], 'light'], ...eye];
}

/**
 * Where a wall device sits in the room: its centre, its directions, and what
 * holds it. On a bracket it hangs in front of the wall and turns and tilts on
 * the joint. Standing free it rests on the furniture below it, or on a stand
 * of its own where there is none at that height.
 */
export function devicePose(item, height, furniture = []) {
    const housing = deviceHousing(item.model);
    if (!housing) return null;
    const size = { width: housing.width * deviceScale, height: housing.height * deviceScale, depth: housing.depth * deviceScale };
    const mounting = installationFor(item);
    const frame = axes(item.angle, housing.front === 'plate' ? 0 : item.tilt ?? 0);
    if (mounting === 'wall-recessed') {
        const centre = [item.x + frame.ahead[0] * size.depth / 2, item.y + frame.ahead[1] * size.depth / 2, height];
        return { housing, size, frame, centre, mounting };
    }
    if (mounting === 'wall-bracket') {
        // Straight out of the wall is where it looks without its turn.
        const out = wallVector(item.angle - (item.pan ?? 0));
        const wall = [item.x, item.y, height];
        const joint = [item.x + out.x * .028 * deviceScale, item.y + out.y * .028 * deviceScale, height];
        const reach = size.depth / 2 + .004 * deviceScale;
        return { housing, size, frame, centre: joint.map((value, index) => value + frame.ahead[index] * reach), mounting, bracket: { wall, joint, out } };
    }
    // The real device stands with its foot half its height below the radar.
    const foot = height - housing.height / 2;
    const below = furniture.filter(piece => pointInOutline(furnitureFootprint(piece), item))
        .map(piece => piece.base + piece.height).filter(top => top <= foot + .03);
    const rest = Math.max(0, ...below);
    return { housing, size, frame, centre: [item.x, item.y, foot + size.height / 2], mounting,
        stand: foot - rest > .03 ? { low: rest, high: foot } : null };
}

/**
 * The model of a wall device as SVG, or '' for a model without a housing.
 *
 * `project` turns a point of the room, [x, y] at a height, into the drawing.
 * `towardCamera` and `sun` are directions in the room, as the rest of the
 * scene uses them. `fine` adds the small details that only show close up.
 */
export function paintDevice(item, height, { project, towardCamera, sun = [-.42, -.43, .8], dim = 0, furniture = [], fine = true } = {}) {
    const pose = devicePose(item, height, furniture);
    if (!pose) return '';
    const { housing, size, frame, centre, bracket, stand } = pose;
    const drawn = corner => project([corner[0], corner[1]], corner[2]).map(number);
    const point = corner => drawn(corner).join(',');
    const polygon = (corners, fill, more = '') => `<polygon points="${corners.map(point).join(' ')}" fill="${fill}" ${more}/>`;
    const shade = (colour, normal) => {
        const light = Math.max(.76, Math.min(1, .87 + .13 * dot(normal, sun))) * (1 - .45 * dim);
        return `rgb(${colour.map(value => Math.round(value * light)).join(' ')})`;
    };
    const line = 'stroke-linejoin="round" vector-effect="non-scaling-stroke"';
    const local = placed(centre, frame);
    const turned = ([s, f, u]) => [0, 1, 2].map(index => s * frame.side[index] + f * frame.ahead[index] + u * frame.up[index]);

    const faces = housingFaces(size.width, size.height, size.depth).map(face => ({ ...face, normal: turned(face.normal), corners: face.corners.map(local) }));
    // One outline around the whole housing; the faces within it meet without a seam.
    const outline = `<polygon points="${convexHull(faces.flatMap(face => face.corners.map(drawn))).map(corner => corner.join(',')).join(' ')}"
        fill="none" stroke="#5f6d7a" stroke-width="1.6" ${line}/>`;
    const body = faces.filter(face => dot(face.normal, towardCamera) > 0).map(face => {
        const length = Math.hypot(...face.normal);
        const fill = shade(plastic, face.normal.map(value => value / length));
        return polygon(face.corners, fill, `stroke="${face.lid ? '#aab4bd' : fill}" stroke-width=".6" ${line}`);
    }).join('');
    const facesCamera = dot(frame.ahead, towardCamera) > 0;
    const front = facesCamera ? frontShapes({ ...size, front: housing.front }, fine).map(([shape, colour, part]) => {
        const corners = shape.map(([s, u]) => local([s, size.depth / 2 + .002, u]));
        return polygon(corners, shade(colour, frame.ahead), 'stroke="none"')
            + (part === 'light' ? polygon(corners, 'currentColor', 'class="fp-device-light" fill-opacity=".62" stroke="none"') : '');
    }).join('') : '';

    let holder = '';
    if (bracket) {
        const { wall, joint, out } = bracket;
        const across = [-out.y, out.x, 0];
        const unit = deviceScale / 1000;
        const plate = [[-18, -25], [18, -25], [18, 25], [-18, 25]].map(([side, up]) =>
            [wall[0] + across[0] * side * unit + out.x * .006, wall[1] + across[1] * side * unit + out.y * .006, wall[2] + up * unit]);
        const back = local([0, -size.depth / 2, 0]);
        holder = `<g class="fp-device-bracket">${polygon(plate, shade([224, 228, 232], [out.x, out.y, 0]), `stroke="#75838f" stroke-width=".7" ${line}`)}
            <path d="M${point(wall)}L${point(joint)}L${point(back)}" fill="none" stroke="#9aa5af" stroke-width="${number(11 * unit)}" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M${point(joint)}h0" fill="none" stroke="#6f7c88" stroke-width="${number(19 * unit)}" stroke-linecap="round"/></g>`;
    } else if (stand) {
        // A plain plinth, see-through so it is not taken for furniture of the plan.
        const upright = axes(item.angle, 0);
        const corner = (s, f, z) => [item.x + s * upright.side[0] + f * upright.ahead[0], item.y + s * upright.side[1] + f * upright.ahead[1], z];
        const w = size.width / 2 + .04, d = size.depth / 2 + .04;
        const foot = [[-w, -d], [w, -d], [w, d], [-w, d]];
        const sides = foot.map(([s, f], index) => {
            const [nextS, nextF] = foot[(index + 1) % foot.length];
            const normal = [0, 1].map(axis => (nextF - f) * upright.side[axis] + (s - nextS) * upright.ahead[axis]);
            return { normal: [...normal, 0], corners: [corner(s, f, stand.low), corner(nextS, nextF, stand.low), corner(nextS, nextF, stand.high), corner(s, f, stand.high)] };
        }).filter(face => dot(face.normal, towardCamera) > 0);
        holder = `<g class="fp-device-stand">${[...sides, { normal: [0, 0, 1], corners: foot.map(([s, f]) => corner(s, f, stand.high)) }].map(face =>
            polygon(face.corners, shade([226, 231, 236], face.normal), `fill-opacity=".62" stroke="#8a97a3" stroke-opacity=".8" stroke-width=".8" ${line}`)).join('')}</g>`;
    }
    // Seen from behind, what holds the device is in front of it.
    const parts = bracket && !facesCamera ? outline + body + front + holder : holder + outline + body + front;
    // The whole device is the body of its marker, the part a page may style or swap for a drawing of its own.
    return `<g class="fp-device fp-space-puck wall" data-device="${item.model}" data-mounting="${pose.mounting}">${parts}</g>`;
}
