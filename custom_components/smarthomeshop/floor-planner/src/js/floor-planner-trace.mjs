// Finds the rooms on a floor plan image without any service: the walls are
// the dark, uncoloured parts of the drawing that are thick enough to be a
// wall, and every space they close off is a room.
//
// It works on the pixels of the image and needs the plan's scale, because a
// wall, a door and a room are only told apart by their real size. It handles
// walls drawn as solid bands, as two thin lines with nothing or a hatch in
// between, and at any angle. Thin lines (dimensions, text, door swings,
// furniture) are left out, coloured areas (floors, furniture, notes) never
// count as walls, and a door opening between two walls is closed so the
// rooms on both sides stay apart. Outside is what reaches the edge of the
// image through a passage wider than a door, so a front door that was not
// closed does not turn the hall into outside.
//
// A window is a stretch of a solid wall that is drawn open with lines or a
// light band in it, between two solid ends of that wall. It is found on
// drawings with solid walls only: where every wall is two lines, a window
// cannot be told from a wall.
//
// The answer has the shape of a recognition (see floor-planner-recognise.mjs):
// image coordinates from 0 to 1, x across and y down.
import { recognitionLimits } from './floor-planner-recognise.mjs';

// Sizes in metres.
const sizes = {
    // Breaks in a line shorter than twice this are closed: a scan or a
    // shrunk image loses bits of thin lines.
    lineGap: .015,
    // Loose bits shorter than this (text, symbols) are no walls.
    shortestBit: .8,
    // Two long lines this close together are the two faces of one wall.
    longLine: .5,
    wallFaces: .45,
    // Half the widest gap between the lines of a wall or column drawn as an
    // outline, when that gap is closed off all round. Wider closed gaps are
    // corners of a room, such as one cut off by a dimension line.
    wallCavity: .145,
    // Lines thinner than this are drawing, not wall.
    line: .055,
    // The thickest wall, and the widest door or passage that is closed.
    thickestWall: .7,
    widestOpening: 1.3,
    // The thickest wall that an opening is closed in.
    doorWall: .45,
    narrowestDoor: .55,
    // The shortest piece of wall whose end can close an opening.
    shortestWall: .25,
    // A room is at least this wide, and this large in square metres.
    narrowestRoom: .6,
    smallestRoom: 1.2,
    // How far an outline may stray from the traced edge, and the most it
    // may stray to keep a room within the planner's number of corners.
    outline: .05,
    roughOutline: .3,
    // Notches in a room narrower than twice this (columns, furniture against
    // a wall) are left out of its outline.
    notch: .2,
    // A window lies in a wall at least this thick, and is this wide. With a
    // room on both sides it is narrower, and the wall goes on past it.
    windowWall: .12,
    narrowestWindow: .35,
    widestWindow: 5,
    widestInnerWindow: 2.5,
    wallPastWindow: .5,
};

// Ink darker than this is a line or a wall. Between it and the light limit
// it is a grey: a wall fill or a faint line, unless it covers a whole area.
const darkLimit = 128;
const lightLimit = 190;
// A line or a narrow band is at least this much darker than what lies on
// both sides of it. The lines of a window can be faint.
const faintStep = 18;

// The planner takes as many rooms and corners as it takes from a recognition.
export const traceLimits = { rooms: recognitionLimits.rooms, corners: recognitionLimits.corners, pixels: 4_200_000 };

const empty = size => new Uint8Array(size);

// Every pixel within r of a set pixel (or, with every, only pixels whose whole
// square of radius r is set). Done per row and then per column with running
// sums, so it costs the same for any radius.
export function spread(mask, width, height, r, every) {
    if (r <= 0) return mask.slice();
    const across = empty(width * height), out = empty(width * height);
    const sums = new Int32Array(Math.max(width, height) + 1);
    const pass = (source, target, count, length, at) => {
        for (let line = 0; line < count; line++) {
            for (let i = 0; i < length; i++) sums[i + 1] = sums[i] + source[at(line, i)];
            for (let i = 0; i < length; i++) {
                const from = Math.max(0, i - r), to = Math.min(length, i + r + 1);
                const set = sums[to] - sums[from];
                target[at(line, i)] = every ? (set === to - from ? 1 : 0) : (set > 0 ? 1 : 0);
            }
        }
    };
    pass(mask, across, height, width, (y, x) => y * width + x);
    pass(across, out, width, height, (x, y) => y * width + x);
    return out;
}

// Keeps only the parts of a mask that hold a square of 2r + 1 pixels.
const opened = (mask, width, height, r) => spread(spread(mask, width, height, r, true), width, height, r, false);

// Distance from every open pixel to the nearest blocked one, in pixels
// (chamfer 3-4, close to the true distance). Beyond the image is open.
export function distances(blocked, width, height) {
    const far = 1e9;
    const d = new Float32Array(width * height);
    for (let i = 0; i < d.length; i++) d[i] = blocked[i] ? 0 : far;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            if (!d[i]) continue;
            let v = d[i];
            if (x > 0) v = Math.min(v, d[i - 1] + 3);
            if (y > 0) {
                v = Math.min(v, d[i - width] + 3);
                if (x > 0) v = Math.min(v, d[i - width - 1] + 4);
                if (x < width - 1) v = Math.min(v, d[i - width + 1] + 4);
            }
            d[i] = v;
        }
    }
    for (let y = height - 1; y >= 0; y--) {
        for (let x = width - 1; x >= 0; x--) {
            const i = y * width + x;
            if (!d[i]) continue;
            let v = d[i];
            if (x < width - 1) v = Math.min(v, d[i + 1] + 3);
            if (y < height - 1) {
                v = Math.min(v, d[i + width] + 3);
                if (x < width - 1) v = Math.min(v, d[i + width + 1] + 4);
                if (x > 0) v = Math.min(v, d[i + width - 1] + 4);
            }
            d[i] = v;
        }
    }
    for (let i = 0; i < d.length; i++) d[i] /= 3;
    return d;
}

// The open areas of a mask, each with its size, whether it reaches the edge of
// the image and how far its inside lies from anything blocked.
export function areas(blocked, width, height, distance) {
    const labels = new Int32Array(width * height);
    const found = [null];
    const stack = new Int32Array(width * height);
    for (let start = 0; start < labels.length; start++) {
        if (blocked[start] || labels[start]) continue;
        const id = found.length;
        const area = { id, size: 0, edge: false, depth: 0, first: start, box: [width, height, 0, 0] };
        labels[start] = id;
        let top = 0;
        stack[top++] = start;
        while (top) {
            const i = stack[--top];
            const x = i % width, y = (i - x) / width;
            area.size++;
            if (distance[i] > area.depth) area.depth = distance[i];
            if (x < area.box[0]) area.box[0] = x;
            if (y < area.box[1]) area.box[1] = y;
            if (x > area.box[2]) area.box[2] = x;
            if (y > area.box[3]) area.box[3] = y;
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) area.edge = true;
            const visit = next => {
                if (!blocked[next] && !labels[next]) {
                    labels[next] = id;
                    stack[top++] = next;
                }
            };
            if (x > 0) visit(i - 1);
            if (x < width - 1) visit(i + 1);
            if (y > 0) visit(i - width);
            if (y < height - 1) visit(i + width);
        }
        found.push(area);
    }
    return { labels, found };
}

// The mask with the space between two long parallel lines filled, where they
// are at most widest pixels apart: across between lines running down, and
// down between lines running across.
function betweenLines(mask, width, height, longest, widest) {
    const out = mask.slice();
    for (const down of [false, true]) {
        const lines = down ? width : height, length = down ? height : width;
        const at = down ? (line, i) => i * width + line : (line, i) => line * width + i;
        // Pixels that lie on a long straight run.
        const long = empty(width * height);
        for (let line = 0; line < lines; line++) {
            let from = -1;
            for (let i = 0; i <= length; i++) {
                const set = i < length && mask[at(line, i)];
                if (set && from < 0) from = i;
                if (!set && from >= 0) {
                    if (i - from >= longest) for (let k = from; k < i; k++) long[at(line, k)] = 1;
                    from = -1;
                }
            }
        }
        // Across those runs, from one to the next.
        const crossAt = down ? (line, i) => line * width + i : (line, i) => i * width + line;
        for (let line = 0; line < length; line++) {
            let last = -1;
            for (let i = 0; i < lines; i++) {
                if (!long[crossAt(line, i)]) continue;
                if (last >= 0 && i - last > 1 && i - last <= widest) for (let k = last + 1; k < i; k++) out[crossAt(line, k)] = 1;
                last = i;
            }
        }
    }
    return out;
}

// Clears every group of set pixels that fits in a square of the given size.
function dropShortBits(mask, width, height, shortest) {
    const labels = new Int32Array(width * height);
    const sizesOf = [0];
    const stack = new Int32Array(width * height);
    for (let start = 0; start < labels.length; start++) {
        if (!mask[start] || labels[start]) continue;
        const id = sizesOf.length;
        let top = 0;
        let left = width, right = 0, up = height, down = 0;
        labels[start] = id;
        stack[top++] = start;
        while (top) {
            const i = stack[--top];
            const x = i % width, y = (i - x) / width;
            left = Math.min(left, x);
            right = Math.max(right, x);
            up = Math.min(up, y);
            down = Math.max(down, y);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                    const next = ny * width + nx;
                    if (mask[next] && !labels[next]) {
                        labels[next] = id;
                        stack[top++] = next;
                    }
                }
            }
        }
        sizesOf.push(Math.max(right - left, down - up) + 1);
    }
    for (let i = 0; i < labels.length; i++) if (labels[i] && sizesOf[labels[i]] < shortest) mask[i] = 0;
}

// Straight pieces of wall running across (or, with down, down) the image:
// rows of the mask whose runs line up, as { axis, start, end, thickness }.
function pieces(mask, width, height, down, { shortest, thinnest, thickest }) {
    const lines = down ? width : height, length = down ? height : width;
    const at = down ? (line, i) => i * width + line : (line, i) => line * width + i;
    const done = [];
    let active = [];
    for (let line = 0; line < lines; line++) {
        const runs = [];
        let from = -1;
        for (let i = 0; i <= length; i++) {
            const set = i < length && mask[at(line, i)];
            if (set && from < 0) from = i;
            if (!set && from >= 0) {
                if (i - from >= shortest) runs.push([from, i]);
                from = -1;
            }
        }
        const used = new Array(runs.length).fill(false);
        const next = [];
        for (const band of active) {
            // A line continues a piece when the two cover nearly the same span.
            const k = runs.findIndex(([s, e], index) => !used[index]
                && Math.min(e, band.end) - Math.max(s, band.start) > .8 * Math.max(band.end - band.start, e - s));
            if (k < 0) {
                done.push(band);
                continue;
            }
            used[k] = true;
            // The piece keeps the span all its lines share.
            next.push({ ...band, start: Math.max(band.start, runs[k][0]), end: Math.min(band.end, runs[k][1]), last: line });
        }
        runs.forEach(([start, end], k) => {
            if (!used[k]) next.push({ start, end, first: line, last: line });
        });
        active = next;
    }
    done.push(...active);
    return done.map(band => ({ axis: (band.first + band.last + 1) / 2, start: band.start, end: band.end,
        thickness: band.last - band.first + 1 }))
        .filter(piece => piece.thickness >= thinnest && piece.thickness <= thickest && piece.end - piece.start >= shortest);
}

// Closes the openings between wall ends: from the end of every piece of wall,
// straight on along it, up to the next wall within reach. Marks them on the
// mask and returns them, each with its box [left, top, right, bottom] in
// pixels, the width of the opening, and the axis and thickness of the wall.
function closeOpenings(mask, width, height, down, wall, reach, thickest) {
    const at = down ? (along, across) => along * width + across : (along, across) => across * width + along;
    const length = down ? height : width, breadth = down ? width : height;
    const bridges = [];
    // Only a piece shaped like a wall, longer than it is thick and not thicker
    // than a wall with a door in it, closes an opening; a block of furniture
    // or fixtures does not.
    for (const piece of wall.filter(piece => piece.end - piece.start >= 1.5 * piece.thickness && piece.thickness <= thickest)) {
        // The middle of the wall's thickness; its outer pixels may be ragged.
        const half = Math.max(1, Math.floor(piece.thickness * .25));
        const centre = Math.floor(piece.axis);
        const from = Math.max(0, centre - half), to = Math.min(breadth - 1, centre + half);
        const filled = along => {
            let set = 0;
            for (let across = from; across <= to; across++) set += mask[at(along, across)];
            return set >= .5 * (to - from + 1);
        };
        for (const direction of [-1, 1]) {
            const end = direction > 0 ? piece.end : piece.start - 1;
            let step = 1;
            while (step <= reach) {
                const along = end + direction * step;
                if (along < 0 || along >= length) break;
                if (filled(along)) break;
                step++;
            }
            const along = end + direction * step;
            if (step === 1 || step > reach || along < 0 || along >= length) continue;
            const [a, b] = direction > 0 ? [end + 1, along] : [along + 1, end + 1];
            const top = Math.round(piece.axis - piece.thickness / 2), bottom = Math.round(piece.axis + piece.thickness / 2);
            bridges.push(down ? { box: [top, a, bottom, b], down, gap: b - a, axis: piece.axis, thickness: piece.thickness }
                : { box: [a, top, b, bottom], down, gap: b - a, axis: piece.axis, thickness: piece.thickness });
        }
    }
    for (const { box: [left, top, right, bottom] } of bridges) {
        for (let y = Math.max(0, top); y < Math.min(height, bottom); y++) {
            for (let x = Math.max(0, left); x < Math.min(width, right); x++) mask[y * width + x] = 1;
        }
    }
    return bridges;
}

// Whether the middle of a wall's thickness is wall at a place along it. The
// outer pixels of a wall may be ragged.
function wallAt(mask, width, breadth, down, { axis, thickness }) {
    const half = Math.max(1, Math.floor(thickness * .25));
    const centre = Math.floor(axis);
    const from = Math.max(0, centre - half), to = Math.min(breadth - 1, centre + half);
    return along => {
        let set = 0;
        for (let across = from; across <= to; across++) set += mask[down ? along * width + across : across * width + along];
        return set >= .5 * (to - from + 1);
    };
}

// The stretches where a solid wall is drawn open with something in it: from
// the end of every piece of wall, straight on along it, to where it is solid
// again. drawn holds everything drawn, heavy what is as dark and thick as a
// thin wall. A stretch has drawing all along it and next to no thin wall.
function glassGaps(sturdy, drawn, heavy, width, height, down, wall, { narrowest, widest }) {
    const at = down ? (along, across) => along * width + across : (along, across) => across * width + along;
    const length = down ? height : width, breadth = down ? width : height;
    const gaps = [];
    for (const piece of wall) {
        const filled = wallAt(sturdy, width, breadth, down, piece);
        const top = Math.max(0, Math.round(piece.axis - piece.thickness / 2));
        const bottom = Math.min(breadth, Math.round(piece.axis + piece.thickness / 2));
        const holds = (mask, along) => {
            for (let across = top; across < bottom; across++) if (mask[at(along, across)]) return true;
            return false;
        };
        for (const direction of [-1, 1]) {
            const end = direction > 0 ? piece.end : piece.start - 1;
            let step = 1;
            while (step <= widest) {
                const along = end + direction * step;
                if (along < 0 || along >= length || filled(along)) break;
                step++;
            }
            const along = end + direction * step;
            if (step > widest || along < 0 || along >= length) continue;
            const [a, b] = direction > 0 ? [end + 1, along] : [along + 1, end + 1];
            if (b - a < narrowest) continue;
            let glass = 0, thin = 0;
            for (let k = a; k < b; k++) {
                if (holds(drawn, k)) glass++;
                if (holds(heavy, k)) thin++;
            }
            if (glass < .85 * (b - a) || thin > .3 * (b - a)) continue;
            gaps.push({ down, a, b, gap: b - a, axis: piece.axis, thickness: piece.thickness });
        }
    }
    return gaps;
}

// Whether a door swings at an opening: a quarter circle from one of its ends,
// or the leaf standing open at a right angle, as wide as the opening or (for
// a double door) half of it. A window has neither.
function doorSwings(drawn, width, height, { down, a, b, gap, axis, thickness }) {
    const marked = (along, across, slack) => {
        for (let dy = -slack; dy <= slack; dy++) {
            for (let dx = -slack; dx <= slack; dx++) {
                const x = Math.round(down ? across : along) + dx, y = Math.round(down ? along : across) + dy;
                if (x >= 0 && y >= 0 && x < width && y < height && drawn[y * width + x]) return true;
            }
        }
        return false;
    };
    for (const radius of [gap, gap / 2]) {
        const slack = Math.max(1, Math.min(4, Math.round(radius * .06)));
        for (const [hinge, into] of [[a, 1], [b, -1]]) {
            for (const side of [-1, 1]) {
                // The hinge sits on the middle of the wall or on one of its faces.
                for (const face of [0, side * thickness / 2, -side * thickness / 2]) {
                    let arc = 0, leaf = 0;
                    const steps = 15;
                    for (let k = 1; k <= steps; k++) {
                        const angle = (8 + 74 * k / steps) * Math.PI / 180;
                        if (marked(hinge + into * radius * Math.cos(angle), axis + face + side * radius * Math.sin(angle), slack)) arc++;
                        if (marked(hinge, axis + side * (thickness / 2 + (radius - thickness / 2) * (.15 + .8 * k / steps)), slack)) leaf++;
                    }
                    if (arc >= .7 * steps || leaf >= .85 * steps) return true;
                }
            }
        }
    }
    return false;
}

// The open space that reaches the edge of the image through passages at
// least 2r + 1 pixels wide, up to where those passages narrow.
function outsideOf(blocked, width, height, r) {
    const open = empty(width * height);
    for (let i = 0; i < open.length; i++) open[i] = blocked[i] ? 0 : 1;
    const cores = spread(open, width, height, r, true);
    // Only the cores that touch the edge are outside.
    const seen = empty(width * height);
    const stack = new Int32Array(width * height);
    let top = 0;
    const push = i => {
        if (cores[i] && !seen[i]) {
            seen[i] = 1;
            stack[top++] = i;
        }
    };
    for (let x = 0; x < width; x++) {
        push(x);
        push((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
        push(y * width);
        push(y * width + width - 1);
    }
    while (top) {
        const i = stack[--top];
        const x = i % width, y = (i - x) / width;
        if (x > 0) push(i - 1);
        if (x < width - 1) push(i + 1);
        if (y > 0) push(i - width);
        if (y < height - 1) push(i + width);
    }
    const outside = spread(seen, width, height, r, false);
    for (let i = 0; i < outside.length; i++) outside[i] &= open[i];
    return outside;
}

// The outer edge of an area, as corners on the pixel grid, walking with the
// area on the right.
function outerEdge(labels, width, height, id, start) {
    const inside = (x, y) => x >= 0 && y >= 0 && x < width && y < height && labels[y * width + x] === id;
    // Ahead-left and ahead-right cell of a corner, for each heading: east, south, west, north.
    const headings = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const aheadLeft = [[0, -1], [0, 0], [-1, 0], [-1, -1]];
    const aheadRight = [[0, 0], [-1, 0], [-1, -1], [0, -1]];
    const x0 = start % width, y0 = (start - x0) / width;
    let x = x0, y = y0, heading = 0;
    const corners = [];
    for (let guard = 0; guard < 4 * labels.length; guard++) {
        x += headings[heading][0];
        y += headings[heading][1];
        const right = inside(x + aheadRight[heading][0], y + aheadRight[heading][1]);
        const left = inside(x + aheadLeft[heading][0], y + aheadLeft[heading][1]);
        const turn = !right ? 1 : left ? 3 : 0;
        if (turn) {
            corners.push([x, y]);
            heading = (heading + turn) % 4;
        }
        if (x === x0 && y === y0 && heading === 0) break;
    }
    return corners;
}

// The outer edge of a room with its small notches filled, in pixels.
export function roomEdge(labels, width, height, area, notch) {
    const pad = notch + 2;
    const [left, top, right, bottom] = area.box;
    const across = right - left + 1 + 2 * pad, down = bottom - top + 1 + 2 * pad;
    const local = empty(across * down);
    for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) if (labels[y * width + x] === area.id) local[(y - top + pad) * across + x - left + pad] = 1;
    }
    const smooth = spread(spread(local, across, down, notch, false), across, down, notch, true);
    const start = smooth.indexOf(1);
    return outerEdge(smooth, across, down, 1, start).map(([x, y]) => [x + left - pad, y + top - pad]);
}

// A ring of points with fewer corners, none further than tolerance from the
// edge it replaces (in the units of the points).
export function fewerCorners(points, tolerance) {
    if (points.length <= 4) return points;
    const away = (p, a, b) => {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const length = Math.hypot(dx, dy);
        return length ? Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / length : Math.hypot(p[0] - a[0], p[1] - a[1]);
    };
    const reduce = (list) => {
        let worst = 0, index = 0;
        for (let i = 1; i < list.length - 1; i++) {
            const d = away(list[i], list[0], list[list.length - 1]);
            if (d > worst) {
                worst = d;
                index = i;
            }
        }
        if (worst <= tolerance) return [list[0], list[list.length - 1]];
        return [...reduce(list.slice(0, index + 1)).slice(0, -1), ...reduce(list.slice(index))];
    };
    // Split the ring at the corner furthest from the first one.
    let far = 0;
    points.forEach((p, i) => {
        if (Math.hypot(p[0] - points[0][0], p[1] - points[0][1]) > Math.hypot(points[far][0] - points[0][0], points[far][1] - points[0][1])) far = i;
    });
    const ring = [...points, points[0]];
    return [...reduce(ring.slice(0, far + 1)).slice(0, -1), ...reduce(ring.slice(far)).slice(0, -1)];
}

const containsPoint = (points, [x, y]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
};

/**
 * The rooms, doors and windows on a floor plan image.
 *
 * image is { data, width, height } with RGBA pixels, as a canvas gives them;
 * metresAcross is the real width of the whole image. Returns
 * { rooms: [{ points }], doors: [{ from, to }], windows: [{ from, to }],
 * labels, size } with points in image coordinates from 0 to 1, or null when
 * the image cannot be traced.
 * labels holds, for every pixel, the number of the room it belongs to (its
 * index in rooms plus one), or 0. When stages is an object, it receives the
 * masks the tracing went through, to look into a result.
 */
export function traceFloorPlan(image, metresAcross, stages = null) {
    const { data, width, height } = image ?? {};
    if (!data || !Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16
        || width * height > traceLimits.pixels || data.length < width * height * 4) return null;
    if (!Number.isFinite(metresAcross) || metresAcross <= 0) return null;
    const perMetre = width / metresAcross;
    const px = metres => metres * perMetre;
    const count = width * height;

    // Ink: dark, or a grey that is not a filled area. Every pixel keeps its
    // tone, to find the faint lines of a window later.
    const dark = empty(count), grey = empty(count), tone = empty(count).fill(255);
    for (let i = 0, p = 0; i < count; i++, p += 4) {
        const r = data[p], g = data[p + 1], b = data[p + 2];
        if (data[p + 3] < 128) continue;
        const luma = (299 * r + 587 * g + 114 * b) / 1000;
        tone[i] = luma;
        const most = Math.max(r, g, b), spreadOf = most - Math.min(r, g, b);
        if (spreadOf > 30 && spreadOf > .28 * most) continue;
        if (luma < darkLimit) dark[i] = 1;
        else if (luma < lightLimit) grey[i] = 1;
    }
    // A grey that fills an area wider than a wall is a floor, also where
    // lines and symbols are drawn on it.
    const either = grey.slice();
    for (let i = 0; i < count; i++) either[i] |= dark[i];
    const fill = opened(either, width, height, Math.max(2, Math.round(px(sizes.thickestWall / 2))));
    const ink = dark.slice();
    for (let i = 0; i < count; i++) if (grey[i] && !fill[i]) ink[i] = 1;
    if (stages) stages.ink = ink.slice();

    // A wall drawn as two lines becomes solid: between two long lines that
    // run close together, and where the space between them is closed off all
    // round and nowhere further than half a wall from its lines.
    const lineGap = Math.max(1, Math.round(px(sizes.lineGap)));
    const seal = mask => spread(spread(mask, width, height, lineGap, false), width, height, lineGap, true);
    const sealed = seal(ink);
    const solid = betweenLines(sealed, width, height, Math.round(px(sizes.longLine)), Math.round(px(sizes.wallFaces)));
    const cavities = areas(solid, width, height, distances(solid, width, height));
    const narrow = new Set(cavities.found.filter(area => area && !area.edge && area.depth <= px(sizes.wallCavity)).map(area => area.id));
    for (let i = 0; i < count; i++) if (narrow.has(cavities.labels[i])) solid[i] = 1;

    // Lines too thin to be a wall fall away, and so do loose bits (text,
    // symbols) that do not hang together with the walls.
    const thinnestWall = Math.max(1, Math.round(px(sizes.line) / 2));
    const walls = opened(solid, width, height, thinnestWall);
    dropShortBits(walls, width, height, px(sizes.shortestBit));
    if (stages) Object.assign(stages, { solid, walls: walls.slice() });

    const limits = { shortest: Math.max(3, Math.round(px(sizes.shortestWall))), thinnest: Math.max(2, Math.round(px(sizes.line))),
        thickest: Math.max(4, Math.round(px(sizes.thickestWall))) };
    const across = pieces(walls, width, height, false, limits), down = pieces(walls, width, height, true, limits);
    const reach = Math.round(px(sizes.widestOpening));
    const closed = walls.slice();
    const doorWall = Math.round(px(sizes.doorWall));
    const bridges = [...closeOpenings(closed, width, height, false, across, reach, doorWall),
        ...closeOpenings(closed, width, height, true, down, reach, doorWall)];

    // Where a solid wall is drawn open with lines or a light band in it,
    // there is glass: a window, or a door with glass in it. Only on a drawing
    // whose walls are solid; a wall of two lines looks the same all along.
    const sturdy = opened(sealed, width, height, Math.max(1, Math.round(px(sizes.windowWall) / 2)));
    let solidWalls = 0, allWalls = 0;
    for (let i = 0; i < count; i++) {
        if (!walls[i]) continue;
        allWalls++;
        solidWalls += sturdy[i];
    }
    const panes = [];
    const drawn = empty(count), fine = empty(count);
    if (allWalls && solidWalls >= .5 * allWalls) {
        // Drawn is what is darker than both its sides, a wall's thickness
        // away: lines and narrow bands in any colour, not the edge of a floor.
        const away = Math.max(3, Math.round(px(sizes.windowWall)));
        for (let y = 0, i = 0; y < height; y++) {
            for (let x = 0; x < width; x++, i++) {
                const limit = tone[i] + faintStep;
                const lighter = (before, after) => (before ? tone[i - before] : 255) >= limit && (after ? tone[i + after] : 255) >= limit;
                if (lighter(x >= away ? away : 0, x + away < width ? away : 0)
                    || lighter(y >= away ? away * width : 0, y + away < height ? away * width : 0)) drawn[i] = 1;
            }
        }
        const heavy = opened(dark, width, height, thinnestWall);
        // What is drawn thin, away from the walls: the swing of a door.
        const nearWalls = spread(walls, width, height, Math.max(2, Math.round(px(.03))), false);
        for (let i = 0; i < count; i++) if (drawn[i] && !nearWalls[i]) fine[i] = 1;
        const solidLimits = { shortest: Math.max(3, Math.round(px(.15))), thinnest: 2, thickest: limits.thickest };
        const glassSizes = { narrowest: Math.round(px(sizes.narrowestWindow)), widest: Math.round(px(sizes.widestWindow)) };
        for (const goesDown of [false, true]) {
            const ends = pieces(sturdy, width, height, goesDown, solidLimits).filter(piece => piece.end - piece.start >= .6 * piece.thickness);
            for (const pane of glassGaps(sturdy, drawn, heavy, width, height, goesDown, ends, glassSizes)) {
                // A stretch is found from both its ends; keep it once.
                if (!panes.some(other => other.down === pane.down && Math.abs(other.axis - pane.axis) < Math.max(other.thickness, pane.thickness)
                    && Math.min(other.b, pane.b) - Math.max(other.a, pane.a) > .5 * Math.min(other.gap, pane.gap))) panes.push(pane);
            }
        }
    }
    if (stages) Object.assign(stages, { sturdy, drawn, panes });

    // The rooms that a mask of walls and closed openings holds.
    const roomsBetween = shut => {
        // Outside is what reaches the edge of the image through a passage
        // wider than a door. An opening that was not closed still keeps it out.
        const blocked = shut.slice();
        const outside = outsideOf(blocked, width, height, Math.round(px(sizes.widestOpening / 2)) + 1);
        for (let i = 0; i < count; i++) if (outside[i]) blocked[i] = 1;
        // Every enclosed open space large enough to stand in is a room.
        const spaces = areas(blocked, width, height, distances(blocked, width, height));
        const candidates = spaces.found.filter(area => area && !area.edge && area.size >= px(1) * px(sizes.smallestRoom)
            && area.depth >= px(sizes.narrowestRoom / 2));
        const tolerance = Math.max(1.5, px(sizes.outline));
        for (const area of candidates) {
            let points = fewerCorners(roomEdge(spaces.labels, width, height, area, Math.round(px(sizes.notch))), tolerance);
            for (let wider = tolerance * 1.4; points.length > traceLimits.corners && wider <= px(sizes.roughOutline); wider *= 1.4) {
                points = fewerCorners(points, wider);
            }
            area.points = points;
        }
        // A frame around the drawing encloses the building and its rooms: it is no room.
        const rooms = candidates.filter(area => area.points.length >= 3 && area.points.length <= traceLimits.corners
            && candidates.filter(other => other !== area && containsPoint(area.points, other.points[0])).length < 2)
            .sort((a, b) => b.size - a.size).slice(0, traceLimits.rooms);
        const numbers = new Map(rooms.map((area, index) => [area.id, index + 1]));
        const labels = new Uint16Array(count);
        for (let i = 0; i < count; i++) labels[i] = numbers.get(spaces.labels[i]) ?? 0;
        return { blocked, outside, spaces, rooms, labels };
    };
    let found = roomsBetween(closed);

    // The room on each side of a stretch of wall, and whether a side without
    // a room lies in the open.
    const besides = ({ down: goesDown, a, b, axis, thickness }) => [-1, 1].map(sign => {
        const offset = thickness / 2 + Math.max(2, px(.1));
        const seen = new Map();
        let open = false;
        for (const part of [.25, .5, .75]) {
            const along = Math.round(a + (b - a) * part), over = Math.round(axis + sign * offset);
            const [x, y] = goesDown ? [over, along] : [along, over];
            if (x < 0 || y < 0 || x >= width || y >= height) {
                open = true;
                continue;
            }
            const i = y * width + x;
            if (found.labels[i]) seen.set(found.labels[i], (seen.get(found.labels[i]) ?? 0) + 1);
            else if (found.outside[i] || found.spaces.found[found.spaces.labels[i]]?.edge) open = true;
        }
        const room = [...seen].sort((one, two) => two[1] - one[1])[0]?.[0] ?? 0;
        return { room, open: !room && open };
    });

    // A wide window drawn with thin lines was not closed like a door, and
    // lets the outside into its room. Close what is still open and look
    // again. A line inside one room stays what it was.
    const stillOpen = panes.filter(pane => {
        const [one, two] = besides(pane);
        if (one.room && one.room === two.room) return false;
        if (!one.room && !two.room && !one.open && !two.open) return false;
        let shut = 0;
        const centre = Math.floor(pane.axis);
        for (let along = pane.a; along < pane.b; along++) shut += closed[pane.down ? along * width + centre : centre * width + along];
        return shut < .9 * pane.gap;
    });
    if (stillOpen.length) {
        for (const { down: goesDown, a, b, axis, thickness } of stillOpen) {
            const from = Math.max(0, Math.round(axis - thickness / 2)), to = Math.round(axis + thickness / 2);
            // A little into the wall on both ends, so no slit stays open.
            for (let along = Math.max(0, a - 2); along < Math.min(goesDown ? height : width, b + 2); along++) {
                for (let over = from; over < Math.min(goesDown ? width : height, to); over++) closed[goesDown ? along * width + over : over * width + along] = 1;
            }
        }
        found = roomsBetween(closed);
    }
    if (stages) Object.assign(stages, { closed: found.blocked, spaces: found.spaces });
    const { rooms, labels } = found;

    const share = ([x, y]) => [Math.min(1, Math.max(0, x / width)), Math.min(1, Math.max(0, y / height))];
    const span = ({ down: goesDown, a, b, axis }) => goesDown ? { from: share([axis, a]), to: share([axis, b]) } : { from: share([a, axis]), to: share([b, axis]) };
    const doors = [];
    // Each opening is found from both its ends; keep it once.
    const addDoor = door => {
        if (!doors.some(other => Math.hypot(other.from[0] - door.from[0], (other.from[1] - door.from[1]) * height / width) < px(.2) / width)) doors.push(door);
    };

    // Glass with a room on one side and the open on the other is a window.
    // Between two rooms it is one only where the wall goes on past it. Where
    // a door swings at it, it is a door, or a front door that is left out.
    const windows = [], glazed = [];
    for (const pane of panes) {
        const [one, two] = besides(pane);
        pane.sides = [one, two];
        if (one.room === two.room) continue;
        const inner = Boolean(one.room && two.room);
        if (!inner && !one.open && !two.open) continue;
        if (doorSwings(fine, width, height, pane)) {
            if (inner) addDoor(span(pane));
            glazed.push(pane);
            pane.found = 'door';
            continue;
        }
        if (inner) {
            const filled = wallAt(sturdy, width, pane.down ? width : height, pane.down, pane);
            const length = pane.down ? height : width, past = Math.round(px(sizes.wallPastWindow));
            let before = 0, after = 0;
            for (let k = 0; k < past; k++) {
                if (pane.a - 2 - k >= 0 && filled(pane.a - 2 - k)) before++;
                if (pane.b + k < length && filled(pane.b + k)) after++;
            }
            if (pane.gap > px(sizes.widestInnerWindow) || before < .9 * past || after < .9 * past) continue;
        }
        windows.push(span(pane));
        glazed.push(pane);
        pane.found = 'window';
    }

    // An opening that was closed between two rooms is a door, unless it
    // turned out to hold a window.
    for (const bridge of bridges) {
        if (bridge.gap < px(sizes.narrowestDoor)) continue;
        const [left, top, right, bottom] = bridge.box;
        const middle = bridge.down ? (top + bottom) / 2 : (left + right) / 2;
        if (glazed.some(pane => pane.down === bridge.down && Math.abs(pane.axis - bridge.axis) < Math.max(pane.thickness, bridge.thickness)
            && middle > pane.a && middle < pane.b)) continue;
        const offset = bridge.thickness / 2 + Math.max(2, px(.1));
        const side = sign => {
            const x = Math.round(bridge.down ? bridge.axis + sign * offset : middle);
            const y = Math.round(bridge.down ? middle : bridge.axis + sign * offset);
            return x >= 0 && y >= 0 && x < width && y < height ? labels[y * width + x] : 0;
        };
        const [one, two] = [side(-1), side(1)];
        if (!one || !two || one === two) continue;
        addDoor(bridge.down ? { from: [bridge.axis / width, top / height], to: [bridge.axis / width, bottom / height] }
            : { from: [left / width, bridge.axis / height], to: [right / width, bridge.axis / height] });
    }

    return {
        rooms: rooms.map(area => ({ points: area.points.map(share) })),
        doors,
        windows,
        labels,
        size: { width, height },
    };
}

// The share of each traced room that a polygon in image coordinates covers,
// counted on a grid of every step-th pixel.
function overlaps(points, traced, step) {
    const { labels, size: { width, height } } = traced;
    const xs = points.map(([x]) => x * width), ys = points.map(([, y]) => y * height);
    const hits = new Map();
    let area = 0;
    const top = Math.max(0, Math.floor(Math.min(...ys))), bottom = Math.min(height - 1, Math.ceil(Math.max(...ys)));
    for (let y = top; y <= bottom; y += step) {
        // Where this row crosses the outline.
        const crossings = [];
        for (let i = 0, j = xs.length - 1; i < xs.length; j = i++) {
            if ((ys[i] > y) !== (ys[j] > y)) crossings.push(xs[i] + (y - ys[i]) * (xs[j] - xs[i]) / (ys[j] - ys[i]));
        }
        crossings.sort((a, b) => a - b);
        for (let k = 0; k + 1 < crossings.length; k += 2) {
            for (let x = Math.max(0, Math.ceil(crossings[k])); x <= Math.min(width - 1, crossings[k + 1]); x += step) {
                area++;
                const label = labels[y * width + x];
                if (label) hits.set(label, (hits.get(label) ?? 0) + 1);
            }
        }
    }
    return { area, hits };
}

/**
 * A recognition whose rooms follow the traced walls where they match: a room
 * the service found that covers about the same space as a traced room takes
 * the traced outline and keeps its own name. Other rooms stay as they were.
 */
export function followTracedWalls(recognition, traced) {
    if (!traced?.rooms?.length || !Array.isArray(recognition?.rooms)) return recognition;
    const step = Math.max(1, Math.round(Math.max(traced.size.width, traced.size.height) / 500));
    const sizes = new Map();
    for (let y = 0; y < traced.size.height; y += step) {
        for (let x = 0; x < traced.size.width; x += step) {
            const label = traced.labels[y * traced.size.width + x];
            if (label) sizes.set(label, (sizes.get(label) ?? 0) + 1);
        }
    }
    const taken = new Set();
    const rooms = recognition.rooms.map(room => {
        if (!Array.isArray(room?.points) || room.points.length < 3
            || !room.points.every(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))) return room;
        const { area, hits } = overlaps(room.points, traced, step);
        let best = null;
        for (const [label, shared] of hits) {
            const union = area + sizes.get(label) - shared;
            const match = union > 0 ? shared / union : 0;
            if (!best || match > best.match) best = { label, match };
        }
        if (!best || best.match < .7 || taken.has(best.label)) return room;
        taken.add(best.label);
        return { ...room, points: traced.rooms[best.label - 1].points };
    });
    return { ...recognition, rooms };
}
