import { furnitureFootprint, furnitureParts } from './floor-planner-furniture.mjs';

const dense = new Set(['metal', 'stone']);
const epsilon = 1e-6;

export function prepareFurnitureOcclusion(items) {
    return items.filter(item => item.material !== 'ignore').map(item => {
        const angle = item.angle * Math.PI / 180;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const corners = furnitureFootprint(item);
        const xs = corners.map(point => point[0]), ys = corners.map(point => point[1]);
        return {
            id: item.id, name: item.name, kind: item.kind, hard: dense.has(item.material), parts: furnitureParts(item),
            bounds: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
            local: ({ x, y, z }) => {
                const dx = x - item.x, dy = y - item.y;
                return [dx * cos + dy * sin, dy * cos - dx * sin, z];
            },
        };
    });
}

function boxEntry(from, to, part) {
    let enter = epsilon;
    let exit = 1 - epsilon;
    const lower = [part.x, part.y, part.low];
    const upper = [part.x + part.w, part.y + part.d, part.high];
    for (let axis = 0; axis < 3; axis++) {
        const delta = to[axis] - from[axis];
        if (Math.abs(delta) < epsilon) {
            if (from[axis] <= lower[axis] || from[axis] >= upper[axis]) return null;
            continue;
        }
        const a = (lower[axis] - from[axis]) / delta, b = (upper[axis] - from[axis]) / delta;
        enter = Math.max(enter, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));
        if (exit - enter <= epsilon) return null;
    }
    return enter;
}

function traceRay(from, to, furniture) {
    let first = null;
    let hard = null;
    const left = Math.min(from.x, to.x), right = Math.max(from.x, to.x);
    const top = Math.min(from.y, to.y), bottom = Math.max(from.y, to.y);
    for (const object of furniture) {
        const [x1, y1, x2, y2] = object.bounds;
        if (right < x1 || left > x2 || bottom < y1 || top > y2) continue;
        const a = object.local(from), b = object.local(to);
        for (const part of object.parts) {
            const t = boxEntry(a, b, part);
            if (t === null) continue;
            const hit = { object, t, point: {
                x: from.x + (to.x - from.x) * t,
                y: from.y + (to.y - from.y) * t,
                z: from.z + (to.z - from.z) * t,
            } };
            if (!first || t < first.t) first = hit;
            if (object.hard && (!hard || t < hard.t)) hard = hit;
        }
    }
    return { first, hard };
}

const samples = { standing: [-.23, 0, .24], sitting: [-.22, 0, .24], lying: [-.08, 0, .10] };

export function furnitureOcclusion(from, person, height, furniture) {
    if (!furniture.length) return null;
    const rays = samples[person.pose].map(offset =>
        traceRay(from, { x: person.x, y: person.y, z: height + offset }, furniture));
    const blocked = rays.every(ray => ray.hard);
    const hit = blocked ? rays[1].hard : rays[1].first ?? rays.find(ray => ray.first)?.first;
    return hit ? { status: blocked ? 'blocked' : 'shadow', id: hit.object.id, name: hit.object.name, point: hit.point } : null;
}
