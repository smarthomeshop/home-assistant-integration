// The area behind a protected mirror that each radar of the room is told to
// ignore, for the designer to draw. The wedge itself is worked out by the
// panel's reflection code, in millimetres along the walls of a room; here a
// plan in metres is turned into that and back.
import { createMirrorReflectionPolygon } from '../../../panel/src/utils/reflection-protection.ts';
import { edgePosition, polygonEdges, roomCorners } from '../js/floor-planner-geometry.mjs';
import { roomForDevice } from '../js/floor-planner-model.mjs';

// The radars that report where someone is. Only they see a reflection as a
// person in a place, and only they can be given an area to ignore.
const tracking = ['ld2450', 'ld2460'];
// How many areas to ignore one radar can hold.
export const exclusionSlots = 2;
// A mirror further than this from every wall of its room hangs on none of them.
const wallReach = .1;

const middleOf = mirror => {
    const turn = mirror.angle * Math.PI / 180;
    return { x: mirror.x + Math.cos(turn) * mirror.width / 2, y: mirror.y + Math.sin(turn) * mirror.width / 2 };
};

/**
 * What the reflection filter of a plan comes to.
 *
 *   wedges    one per protected mirror and tracking radar of its room:
 *             { mirrorId, sensorId, points } with the points in plan metres
 *   crowded   the ids of the radars that would need more areas to ignore
 *             than they can hold, counting the exclusion zones drawn for them
 */
export function mirrorProtection(plan) {
    const wedges = (plan.mirrors ?? []).filter(mirror => mirror.protectionEnabled === true).flatMap(mirror => {
        const room = plan.rooms.find(room => room.id === mirror.roomId);
        if (!room) return [];
        const corners = roomCorners(room);
        const middle = middleOf(mirror);
        const [wall] = polygonEdges(corners).map(([a, b], index) => ({ index, ...edgePosition(a, b, middle) }))
            .map(edge => ({ ...edge, away: Math.hypot(edge.x - middle.x, edge.y - middle.y) })).sort((a, b) => a.away - b.away);
        if (!wall || wall.away > wallReach) return [];
        const outline = corners.map(([x, y]) => ({ x: x * 1000, y: y * 1000 }));
        const placement = { id: mirror.id, wallIndex: wall.index, position: wall.along / wall.length, width: mirror.width * 1000,
            protectionEnabled: true, reflectionDepthMm: Math.round((mirror.reflectionDepthM ?? 2) * 1000) };
        return plan.sensors.filter(sensor => tracking.includes(sensor.radar) && roomForDevice(plan.rooms, sensor)?.id === room.id).flatMap(sensor => {
            const wedge = createMirrorReflectionPolygon(outline, placement, { id: sensor.id, x: sensor.x * 1000, y: sensor.y * 1000 });
            return wedge ? [{ mirrorId: mirror.id, sensorId: sensor.id,
                points: wedge.points.map(({ x, y }) => [Number((x / 1000).toFixed(3)), Number((y / 1000).toFixed(3))]) }] : [];
        });
    });
    const crowded = plan.sensors.filter(sensor => {
        const room = roomForDevice(plan.rooms, sensor);
        const drawn = (plan.zones ?? []).filter(zone => zone.type === 'exclusion' && zone.roomId === room?.id
            && (!zone.sensorId || zone.sensorId === sensor.id)).length;
        const mirrored = wedges.filter(wedge => wedge.sensorId === sensor.id).length;
        return mirrored > 0 && drawn + mirrored > exclusionSlots;
    }).map(sensor => sensor.id);
    return { wedges, crowded };
}
