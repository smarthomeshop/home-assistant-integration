// The reflection filter of a mirror, as the designer draws it in Home Assistant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { exclusionSlots, mirrorProtection } from '../../src/ha/ha-mirrors.js';
import { plannerDevices, projectFromRooms } from '../../src/ha/ha-rooms.js';
import { saveChanges } from '../../src/ha/ha-save.js';
import { createMirrorReflectionPolygon } from '../../../panel/src/utils/reflection-protection.ts';

const room = { id: 'room', name: 'Room', x: 0, y: 0, width: 5, depth: 4, height: 2.6 };
// On the right wall, between 1.5 and 2.5 m down it.
const mirror = { id: 'mirror', roomId: 'room', x: 5, y: 1.5, width: 1, angle: 90, base: .4, height: 1.6, protectionEnabled: true, reflectionDepthM: 2 };
const radar = { id: 'radar', model: 'ultimatesensor-v2', radar: 'ld2450', x: 0, y: 2, angle: 90, installation: 'wall-bracket' };
const plan = more => ({ rooms: [room], sensors: [radar], mirrors: [mirror], zones: [], ...more });

test('a protected mirror gives each tracking radar of its room a wedge behind the wall', () => {
    const { wedges, crowded } = mirrorProtection(plan());
    assert.deepEqual(crowded, []);
    assert.equal(wedges.length, 1);
    const [{ mirrorId, sensorId, points }] = wedges;
    assert.deepEqual([mirrorId, sensorId], ['mirror', 'radar']);
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
    // It starts past the margin behind the wall and reaches as deep as was asked for.
    assert.ok(Math.abs(Math.min(...xs) - 5.35) < .01, String(Math.min(...xs)));
    assert.ok(Math.abs(Math.max(...xs) - 7.35) < .01, String(Math.max(...xs)));
    // Seen from the radar it fans out: it is wider at the back than at the wall.
    const span = at => { const side = points.filter(([x]) => Math.abs(x - at) < .01).map(([, y]) => y); return Math.max(...side) - Math.min(...side); };
    assert.ok(span(7.35) > span(5.35) && span(5.35) > 1);
    assert.ok(Math.min(...ys) < 1.5 && Math.max(...ys) > 2.5);

    // A radar somewhere else in the room looks at the mirror from another side, so its wedge differs.
    const second = { ...radar, id: 'second', radar: 'ld2460', x: 2, y: 0, angle: 180 };
    const both = mirrorProtection(plan({ sensors: [radar, second] })).wedges;
    assert.deepEqual(both.map(wedge => wedge.sensorId), ['radar', 'second']);
    assert.notDeepEqual(both[0].points, both[1].points);
    // A deeper filter reaches further.
    const deep = mirrorProtection(plan({ mirrors: [{ ...mirror, reflectionDepthM: 4 }] })).wedges[0].points;
    assert.ok(Math.abs(Math.max(...deep.map(([x]) => x)) - 9.35) < .01);
});

test('only radars that track a position in the room of the mirror get a wedge', () => {
    assert.deepEqual(mirrorProtection(plan({ mirrors: [{ ...mirror, protectionEnabled: false }] })).wedges, []);
    assert.deepEqual(mirrorProtection(plan({ mirrors: [] })).wedges, []);
    // A presence radar on the ceiling reports no position that a reflection could fake.
    const ceiling = { id: 'ceiling', model: 'ceilsense-v2', radar: 'ld2412', x: 2.5, y: 2, angle: 0 };
    assert.deepEqual(mirrorProtection(plan({ sensors: [ceiling] })).wedges, []);
    assert.deepEqual(mirrorProtection(plan({ sensors: [{ ...radar, radar: 'none' }] })).wedges, []);
    // A radar in the next room does not look at this mirror.
    const next = { ...room, id: 'next', x: 5 };
    assert.deepEqual(mirrorProtection(plan({ rooms: [room, next], sensors: [{ ...radar, x: 9.9, y: 2, angle: 270 }] })).wedges, []);
    // A mirror that hangs on no wall has nothing behind it to hide.
    assert.deepEqual(mirrorProtection(plan({ mirrors: [{ ...mirror, x: 3 }] })).wedges, []);
});

test('a radar that would need more areas than it holds is named', () => {
    assert.equal(exclusionSlots, 2);
    const zone = (id, sensorId) => ({ id, type: 'exclusion', roomId: 'room', ...(sensorId ? { sensorId } : {}), parts: [[]] });
    assert.deepEqual(mirrorProtection(plan({ zones: [zone('a')] })).crowded, []);
    assert.deepEqual(mirrorProtection(plan({ zones: [zone('a'), zone('b', 'radar')] })).crowded, ['radar']);
    // A zone drawn for another radar does not take a place on this one.
    assert.deepEqual(mirrorProtection(plan({ zones: [zone('a'), zone('b', 'other')] })).crowded, []);
    // Detection zones are not areas to ignore.
    assert.deepEqual(mirrorProtection(plan({ zones: [{ ...zone('a'), type: 'detection' }, { ...zone('b'), type: 'detection' }] })).crowded, []);
    // Three protected mirrors alone are already one too many.
    const mirrors = [mirror, { ...mirror, id: 'top', x: 1, y: 0, angle: 0 }, { ...mirror, id: 'bottom', x: 1, y: 4, angle: 0 }];
    const three = mirrorProtection(plan({ mirrors, sensors: [{ ...radar, x: 2.5, y: 2 }] }));
    assert.equal(three.wedges.length, 3);
    assert.deepEqual(three.crowded, ['radar']);
});

test('what is sent to a radar is the area the designer draws, also for a room that is turned in the house', () => {
    const square = (width, depth) => [[0, 0], [width, 0], [width, depth], [0, depth]]
        .map(([x, y], index, corners) => ({ x1: x, y1: y, x2: corners[(index + 1) % 4][0], y2: corners[(index + 1) % 4][1] }));
    const profiles = [{ device_id: 'radar', profile: { mounting_mode: 'wall', radar_model: 'ld2450', detected_product: 'ultimatesensor-v2' } }];
    const devices = plannerDevices(profiles, [{ id: 'radar', name: 'UltimateSensor', model: 'UltimateSensor V2', product_type: 'ultimatesensor' }]);
    for (const rotationDeg of [0, 90, 180]) {
        const stored = { id: 'living', name: 'Living', walls: square(5000, 4000), house: { x: 2000, y: 1000, floor: 0, rotationDeg }, ceilingHeightMm: 2600,
            doors: [], windows: [], furniture: [], zones: [],
            mirrors: [{ id: 'mirror', wallIndex: 1, position: .3, width: 800, height: 1600 }],
            sensors: [{ id: 'source', deviceId: 'radar', x: 100, y: 2000, rotation: 90, heightMm: 1400, mountingMode: 'wall' }] };
        const saved = projectFromRooms([stored], profiles, devices);
        const edited = structuredClone(saved);
        const plan = edited.floors[0].plan;
        Object.assign(plan.mirrors[0], { protectionEnabled: true, reflectionDepthM: 3 });
        // What the designer draws, in plan metres.
        const [drawn] = mirrorProtection(plan).wedges;
        assert.ok(drawn, `a wedge is drawn at ${rotationDeg} degrees`);
        // What the save hands the radar settings: the room's own walls, mirror and sensor in millimetres.
        const [change] = saveChanges(edited, saved, [stored]).changes;
        assert.deepEqual([change.mirrors[0].protectionEnabled, change.mirrors[0].reflectionDepthMm], [true, 3000]);
        const outline = (change.walls ?? stored.walls).map(({ x1, y1 }) => ({ x: x1, y: y1 }));
        // Only what changed is in it; the walls and the sensor are as they were stored.
        const [source] = change.sensors ?? stored.sensors;
        const sent = createMirrorReflectionPolygon(outline, change.mirrors[0], { x: source.x, y: source.y });
        assert.ok(sent, `a wedge is sent at ${rotationDeg} degrees`);
        // The two are the same shape seen from the radar: every corner is as far from it in both.
        const radar = plan.sensors[0];
        const far = values => values.sort((a, b) => a - b);
        const inPlan = far(drawn.points.map(([x, y]) => Math.hypot(x - radar.x, y - radar.y) * 1000));
        const inRoom = far(sent.points.map(({ x, y }) => Math.hypot(x - source.x, y - source.y)));
        inPlan.forEach((distance, index) => assert.ok(Math.abs(distance - inRoom[index]) < 3, `${rotationDeg} degrees: ${distance} is not ${inRoom[index]}`));
    }
});
