const epsilon = .00001;
const dot = ([x, y, z], [a, b, c]) => x * a + y * b + z * c;

function planeFor([a, b, c]) {
    const [x, y, z] = b.map((value, axis) => value - a[axis]);
    const [u, v, w] = c.map((value, axis) => value - a[axis]);
    const normal = [y * w - z * v, z * u - x * w, x * v - y * u];
    const length = Math.hypot(...normal);
    if (length <= epsilon) return null;
    const unit = normal.map(value => value / length);
    return { normal: unit, offset: dot(unit, a) };
}

const planeDistance = (plane, point) => dot(plane.normal, point) - plane.offset;

function sideOf(face, plane) {
    const { normal: [x, y, z], offset } = plane;
    let side = 0;
    for (const point of face.vertices) {
        const distance = x * point[0] + y * point[1] + z * point[2] - offset;
        if (distance > epsilon) side |= 1;
        if (distance < -epsilon) side |= 2;
        if (side === 3) break;
    }
    return side;
}

function choosePlane(faces) {
    let best = faces[0].plane, score = Infinity;
    const stride = Math.max(1, Math.ceil(faces.length / 8));
    for (let index = 0; index < faces.length; index += stride) {
        const plane = faces[index].plane;
        let front = 0, back = 0, split = 0;
        for (const face of faces) {
            const side = sideOf(face, plane);
            if (side === 1) front++;
            if (side === 2) back++;
            if (side === 3 && ++split * 9 >= score) break;
        }
        const cost = split * 9 + Math.abs(front - back);
        if (cost < score) {
            best = plane;
            score = cost;
        }
        if (!score) break;
    }
    return best;
}

function splitFace(face, plane) {
    const front = [], back = [];
    face.vertices.forEach((point, index) => {
        const next = face.vertices[(index + 1) % face.vertices.length];
        const a = planeDistance(plane, point), b = planeDistance(plane, next);
        if (a >= -epsilon) front.push(point);
        if (a <= epsilon) back.push(point);
        if ((a > epsilon && b < -epsilon) || (a < -epsilon && b > epsilon)) {
            const fraction = a / (a - b);
            const intersection = point.map((value, axis) => value + (next[axis] - value) * fraction);
            front.push(intersection);
            back.push(intersection);
        }
    });
    const boundary = face.boundary ?? face.vertices;
    return [{ ...face, vertices: front, boundary }, { ...face, vertices: back, boundary }];
}

export function splitVerticesAtHeight(vertices, height) {
    const face = { vertices };
    const plane = { normal: [0, 0, 1], offset: height };
    const side = sideOf(face, plane);
    if (side === 0 || side === 1) return [[], vertices];
    if (side === 2) return [vertices, []];
    const [above, below] = splitFace(face, plane);
    return [below.vertices, above.vertices];
}

// Back-to-front BSP traversal. Faces crossing a partition are split so both
// sides retain their own depth, even when their projected areas overlap.
export function depthOrder(faces, towardCamera) {
    const visible = faces.flatMap(face => {
        const plane = planeFor(face.vertices);
        return plane && dot(plane.normal, towardCamera) > epsilon ? [{ ...face, plane }] : [];
    });
    const ordered = [];
    const depth = face => face.vertices.reduce((sum, point) => sum + dot(point, towardCamera), 0) / face.vertices.length;
    function visit(group, level = 0) {
        if (!group.length) return;
        if (group.length === 1) {
            ordered.push(group[0]);
            return;
        }
        // A face that is not quite flat can keep splitting without end. Far
        // down the tree, sorting by distance is close enough.
        if (level > 120) {
            ordered.push(...[...group].sort((a, b) => depth(a) - depth(b)));
            return;
        }
        const plane = choosePlane(group);
        const front = [], back = [], aligned = [];
        for (const face of group) {
            switch (sideOf(face, plane)) {
                case 0: aligned.push(face); break;
                case 1: front.push(face); break;
                case 2: back.push(face); break;
                default: {
                    const [near, far] = splitFace(face, plane);
                    front.push(near);
                    back.push(far);
                }
            }
        }
        const frontFirst = dot(plane.normal, towardCamera) < 0;
        visit(frontFirst ? front : back, level + 1);
        for (const face of aligned) ordered.push(face);
        visit(frontFirst ? back : front, level + 1);
    }
    visit(visible);
    return ordered;
}

export function onFaceEdge(point, a, b) {
    const edge = b.map((value, axis) => value - a[axis]);
    const offset = point.map((value, axis) => value - a[axis]);
    const fraction = dot(offset, edge) / dot(edge, edge);
    return fraction >= -epsilon && fraction <= 1 + epsilon &&
        offset.every((value, axis) => Math.abs(value - fraction * edge[axis]) < epsilon);
}
