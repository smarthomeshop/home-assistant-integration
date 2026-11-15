import { depthOrder } from './floor-planner-depth.mjs';
import { polygonEdges, roomContains, roomCorners } from './floor-planner-geometry.mjs';

export const floorStackHeight = (level, base, separation) => (level - base) * 4.2 * separation;

export function validStaircase(staircase, floors) {
    if (!staircase || !Number.isFinite(staircase.width) || staircase.width < .6 || staircase.width > 2.4) return false;
    const lower = floors.find(floor => floor.id === staircase.lower);
    const upper = floors.find(floor => floor.id === staircase.upper);
    if (!lower || upper?.level !== lower.level + 1) return false;
    const { bottom, top } = staircase;
    if (![bottom, top].every(point => point && [point.x, point.y].every(value => Number.isFinite(value) && Math.abs(value) <= 100))) return false;
    const run = Math.hypot(top.x - bottom.x, top.y - bottom.y);
    return run >= 1 && run <= 8;
}

export function stairTrip(project) {
    const stair = project.staircase;
    if (!stair) return null;
    const up = project.activeFloor === stair.lower;
    if (!up && project.activeFloor !== stair.upper) return null;
    const from = project.floors.find(floor => floor.id === project.activeFloor);
    const to = project.floors.find(floor => floor.id === (up ? stair.upper : stair.lower));
    if (!from.plan.rooms.some(room => roomContains(room, up ? stair.bottom : stair.top))
        || !to?.plan.rooms.some(room => roomContains(room, up ? stair.top : stair.bottom))) return null;
    return { from, to, up, stair };
}

export function stairPoint({ bottom, top }, fraction, side = 0) {
    const dx = top.x - bottom.x, dy = top.y - bottom.y;
    const length = Math.hypot(dx, dy);
    return { x: bottom.x + dx * fraction - dy / length * side, y: bottom.y + dy * fraction + dx / length * side };
}

const polygon = (points, className) => `<polygon class="${className}" points="${points.map(point => point.join(',')).join(' ')}"/>`;
const steps = 13;
const start = .09, end = .91;
const onTread = index => start + (end - start) * index / steps;
const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const stairSteps = steps + 2;
export const stairGaitDuration = up => stairSteps * (up ? 375 : 345);

export function stairHeading(stair, up) {
    const direction = up ? 1 : -1;
    return Math.atan2(direction * (stair.top.x - stair.bottom.x), direction * (stair.bottom.y - stair.top.y)) * 180 / Math.PI;
}

export function stairGait(stair, progress, rise, up, lane = 0) {
    const step = clamp(progress) * stairSteps;
    const index = Math.min(stairSteps - 1, Math.floor(step));
    const time = step - index;
    const run = Math.hypot(stair.top.x - stair.bottom.x, stair.top.y - stair.bottom.y);
    const station = order => {
        const number = up ? order : steps + 3 - order;
        if (number < 2) return { fraction: 0, height: 0 };
        if (number > steps + 1) return { fraction: 1, height: rise };
        return { fraction: onTread(number - 1.5), height: rise * (number - 1) / steps };
    };
    const from = station(index), support = station(index + 1), to = station(index + 2);
    const rootFraction = (support.fraction + mix(from.fraction, to.fraction, time)) / 2;
    const elevation = (support.height + mix(from.height, to.height, smooth(time))) / 2;
    // The grounded foot stays on its tread. Lift the other shoe above both
    // contact heights before moving it across a riser, then lower it onto the tread.
    const clearance = Math.max(from.height, to.height) + .064;
    const swingHeight = time < .32 ? mix(from.height, clearance, smooth(time / .32))
        : mix(clearance, to.height, smooth((time - .79) / .21));
    const swingFraction = mix(from.fraction, to.fraction, smooth((time - .20) / .62));
    const direction = up ? 1 : -1;
    const foot = ({ fraction, height }) => ({
        ahead: (fraction - rootFraction) * run * direction - .03,
        height: height - elevation,
    });
    const swing = foot({ fraction: swingFraction, height: swingHeight });
    const planted = foot(support);
    return {
        ...stairPoint(stair, rootFraction, lane), elevation,
        feet: index % 2 ? [planted, swing] : [swing, planted],
        phase: step / 2,
    };
}

export function stairWalls(stair) {
    const corners = [[start, -1], [start, 1], [end, 1], [end, -1]].map(([fraction, side]) => {
        const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
        return [x, y];
    });
    return corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
}

export function insideStairwell({ bottom, top, width }, point) {
    const dx = top.x - bottom.x, dy = top.y - bottom.y;
    const x = point.x - bottom.x, y = point.y - bottom.y;
    const length = Math.hypot(dx, dy);
    const fraction = (x * dx + y * dy) / (length * length);
    return fraction > start && fraction < end && Math.abs(y * dx - x * dy) < width * length / 2;
}

export function stairSafeStart(trip, person) {
    if (!trip || !insideStairwell(trip.stair, person)) return person;
    return { ...person, ...stairPoint(trip.stair, trip.up ? 0 : 1) };
}

export function paintStairPlan(stair, label, up) {
    const edge = (fraction, side) => {
        const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
        return [x, y];
    };
    const footprint = [edge(start, -1), edge(start, 1), edge(end, 1), edge(end, -1)];
    const treads = Array.from({ length: steps - 1 }, (_, index) => {
        const [x1, y1] = edge(onTread(index + 1), -1), [x2, y2] = edge(onTread(index + 1), 1);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }).join('');
    const [a, b] = (up ? [.28, .72] : [.72, .28]).map(fraction => edge(fraction, 0));
    const wing = side => stairPoint(stair, up ? .59 : .41, side * .20);
    const [left, right] = [-1, 1].map(wing);
    const [x, y] = edge(up ? .98 : .025, 0);
    return `<g class="fp-stair-plan" data-staircase pointer-events="none">${polygon(footprint, 'fp-stairwell')}${treads}
        <path d="M${a.join(' ')}L${b.join(' ')} M${left.x} ${left.y}L${b.join(' ')}L${right.x} ${right.y}"/>
        <text x="${x}" y="${y}" text-anchor="middle">${label}</text></g>`;
}

function stairOpening(stair, project, height) {
    return [[.20, -1], [.20, 1], [end, 1], [end, -1]].map(([fraction, side]) => {
        const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
        return project([x, y], height);
    });
}

export function paintStairOpening(stair, project, height = 0) {
    return polygon(stairOpening(stair, project, height), 'fp-stair-opening');
}

export const stairOcclusionId = stair => `fp-stair-occlusion-${stair.upper}`;

export function paintStairOcclusion(stair, rooms, project, height, slabDepth, bounds) {
    const slab = rooms.flatMap(room => {
        const outline = roomCorners(room);
        const top = outline.map(point => project(point, height));
        const bottom = outline.map(point => project(point, height - slabDepth));
        return [top, bottom, ...polygonEdges(top).map(([a, b], index) =>
            [a, b, bottom[(index + 1) % bottom.length], bottom[index]])];
    });
    const { x, y, width, height: viewHeight } = bounds;
    const id = stairOcclusionId(stair);
    const mask = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${viewHeight}">
        <rect x="${x}" y="${y}" width="${width}" height="${viewHeight}" fill="white"/>
        <g fill="black">${slab.map(points => polygon(points, '')).join('')}</g>
        <g fill="white">${polygon(stairOpening(stair, project, height), '')}</g>
    </mask></defs>`;
    return { id, mask };
}

export function paintStairFlight(stair, project, base, rise, towardCamera, occlusion = null) {
    const vertex = (fraction, side, height) => {
        const { x, y } = stairPoint(stair, fraction, side * stair.width / 2);
        return [x, y, base + height];
    };
    const projectVertex = ([x, y, z]) => project([x, y], z);
    const edge = (...args) => projectVertex(vertex(...args));
    const faces = Array.from({ length: steps }, (_, index) => {
        const a = onTread(index), b = onTread(index + 1);
        const lower = rise * index / steps, upper = rise * (index + 1) / steps;
        return [
            { vertices: [vertex(a, 1, lower), vertex(a, -1, lower), vertex(a, -1, upper), vertex(a, 1, upper)], className: 'fp-stair-riser' },
            { vertices: [vertex(a, 1, upper), vertex(a, -1, upper), vertex(b, -1, upper), vertex(b, 1, upper)], className: 'fp-stair-tread' },
            ...[-1, 1].map(side => {
                const vertices = [vertex(a, side, lower - .09), vertex(b, side, upper - .09),
                    vertex(b, side, upper), vertex(a, side, upper)];
                return { vertices: side === 1 ? vertices.reverse() : vertices, className: 'fp-stair-side' };
            }),
        ];
    }).flat();
    const treads = depthOrder(faces, towardCamera).map(({ vertices, className }) =>
        polygon(vertices.map(projectVertex), className)).join('');
    const line = ([x1, y1], [x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    const railHeight = .77;
    const railSplit = start + (end - start) * (rise - railHeight) / rise;
    const posts = [start, .5, end].map(fraction => {
        const height = rise * (fraction - start) / (end - start);
        return { fraction, height };
    });
    const masked = occlusion ? ` mask="url(#${occlusion.id})"` : '';
    const railUnder = occlusion ? edge(railSplit, 1, rise) : edge(end, 1, rise + railHeight);
    const lowerPosts = posts.map(({ fraction, height }) =>
        line(edge(fraction, 1, height), edge(fraction, 1, occlusion ? Math.min(rise, height + railHeight) : height + railHeight))).join('');
    const upperRail = occlusion ? posts.filter(({ height }) => height + railHeight > rise)
        .map(({ fraction, height }) => line(edge(fraction, 1, rise), edge(fraction, 1, height + railHeight))).join('')
        + line(railUnder, edge(end, 1, rise + railHeight)) : '';
    return `${occlusion?.mask ?? ''}<g class="fp-stair-flight" data-staircase pointer-events="none">
        <g${masked}>${treads}</g><g data-stair-walkers=""></g><g data-stair-rail=""${masked}>${lowerPosts}${line(edge(start, 1, railHeight), railUnder)}</g>${upperRail}
    </g>`;
}
