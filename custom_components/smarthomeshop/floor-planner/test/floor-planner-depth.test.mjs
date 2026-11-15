import assert from 'node:assert/strict';
import test from 'node:test';
import { depthOrder, onFaceEdge } from '../src/js/floor-planner-depth.mjs';
import { paintAvatar } from '../src/js/floor-planner-avatar.mjs';
import { defaultSpaceCamera } from '../src/js/floor-planner-space.mjs';
import { stairGait, stairGaitDuration } from '../src/js/floor-planner-stairs.mjs';

test('intersecting surfaces are split and drawn on both sides of the occluding plane', () => {
    const wall = { id: 'wall', vertices: [[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0]] };
    const furniture = { id: 'furniture', vertices: [[0, 0, -1], [2, 0, 1], [2, 2, 1], [0, 2, -1]] };
    const order = depthOrder([wall, furniture], [0, 0, 1]);
    assert.deepEqual(order.map(face => face.id), ['furniture', 'wall', 'furniture']);
    assert.ok(order[0].vertices.every(([, , z]) => z <= 0));
    assert.ok(order[2].vertices.every(([, , z]) => z >= 0));
    assert.deepEqual(order[0].boundary, furniture.vertices);
    assert.ok(onFaceEdge([1, 0, 0], ...furniture.vertices.slice(0, 2)));
    assert.equal(onFaceEdge([1, 1, 0], ...furniture.vertices.slice(0, 2)), false);
});

test('each stair gait plants one shoe on a tread and finishes on the landing in both directions', () => {
    const stair = { bottom: { x: 5.8, y: 7.67 }, top: { x: 5.8, y: 4.78 }, width: .94 };
    const steps = stairGaitDuration(true) / 375;
    const rise = 4.2;
    for (const up of [true, false]) {
        for (let index = 0; index < steps; index++) {
            const planted = frame => {
                const { ahead, height } = frame.feet[index % 2 ? 0 : 1];
                return [frame.y + (up ? -1 : 1) * (ahead + .03), frame.elevation + height];
            };
            const first = planted(stairGait(stair, (index + .21) / steps, rise, up));
            const last = planted(stairGait(stair, (index + .74) / steps, rise, up));
            assert.ok(first.every((value, axis) => Math.abs(value - last[axis]) < 1e-10));
            assert.ok(Math.abs(first[1] * 13 / rise - Math.round(first[1] * 13 / rise)) < 1e-10);
        }
        const arrival = stairGait(stair, 1, rise, up);
        assert.ok(Math.abs(arrival.y - (up ? stair.top.y : stair.bottom.y)) < 1e-10);
        assert.equal(arrival.elevation, up ? rise : 0);
        assert.ok(arrival.feet.every(foot => foot.height === 0));
        const mid = stairGait(stair, .42, rise, up);
        const figure = paintAvatar({ ...mid, heading: up ? 0 : 180, pose: 'standing', avatar: 'woman' }, defaultSpaceCamera, true);
        assert.match(figure, /data-stair-gait/);
        assert.doesNotMatch(figure, /NaN|Infinity/);
    }
});

test('a stair walker emerges through the landing at the height of each body part', () => {
    const height = 4.2;
    const occlusion = { id: 'stair-floor', height };
    const render = elevation => paintAvatar({ x: 5.8, y: 5.3, elevation, heading: 0, pose: 'standing' },
        defaultSpaceCamera, false, false, occlusion);
    const low = render(1);
    const halfway = render(3.1);
    const landed = render(height);
    const lower = /<g mask="url\(#stair-floor\)">[\s\S]*?<g class="fp-avatar-mesh"><polygon/;
    const upper = /<g class="fp-avatar-mesh"><polygon[^]*?<\/g>\s*<\/g>\s*$/;
    assert.match(low, lower);
    assert.match(low, /<g class="fp-avatar-mesh"><\/g>\s*<\/g>$/);
    assert.match(halfway, lower);
    assert.match(halfway, /<\/g><\/g>\s*<g class="fp-avatar-mesh"><polygon/);
    assert.doesNotMatch(landed, /mask=/);
    assert.match(landed, upper);
});
