import { plannerRadars, radarFootprint, roomLimits } from './ceilsense-room-model.mjs';
import { ceilingHeightAt } from './floor-planner-ceiling.mjs';
import { ceilingCoverageStatus, devices, wallVector } from './floor-planner-model.mjs';
import { roomContainsLine } from './floor-planner-geometry.mjs';
import { wallPresence, wallTrackers } from './wall-radar-profiles.mjs';

export const ceilingProfiles = ['seated', 'standing', 'moving'];
export const radarProfileFor = person => person?.moving ? 'moving' : person?.pose === 'standing' ? 'standing' : 'seated';

export function wallSector({ half, range }) {
    const radians = half * Math.PI / 180;
    const x = range * Math.sin(radians);
    const y = -range * Math.cos(radians);
    return `M0 0 ${-x} ${y} A${range} ${range} 0 0 1 ${x} ${y}Z`;
}

export function radarOrigin(item) {
    if (devices[item.model].mount === 'ceiling') return item;
    const facing = wallVector(item.angle);
    return { x: item.x + facing.x * .08, y: item.y + facing.y * .08 };
}

export const radarHasLineOfSight = (room, item, point) => !room.outline || roomContainsLine(room, radarOrigin(item), point);

export function sensorMountHeight(item, room) {
    return devices[item.model].mount === 'wall' ? item.mountHeight ?? 1.4 : room ? ceilingHeightAt(room, item) : 0;
}

export function radarFields(room, item, { allowHeightEstimate = false } = {}) {
    if (!room || item.radar === 'none') return [];
    if (devices[item.model].mount === 'wall') {
        return [
            { ...wallPresence, radar: 'ld2412', mode: 'presence', secondary: true },
            { ...wallTrackers[item.radar], radar: item.radar, mode: 'xy' },
        ];
    }

    if (!plannerRadars.includes(item.radar)) return [];
    const status = ceilingCoverageStatus(room, item);
    const height = ceilingHeightAt(room, item);
    const [minHeight, maxHeight] = roomLimits.height;
    const estimatedHeight = status === 'height' && allowHeightEstimate && height >= minHeight && height <= maxHeight;
    if (status !== 'reference' && !estimatedHeight) return [];
    const radars = item.radar === 'combined' ? ['ld6002b', 'ld2412'] : [item.radar];
    return radars.map((radar, index) => {
        const footprint = radarFootprint(radar, height);
        return {
            radii: footprint.seated,
            profiles: radar === 'ld2412' ? footprint : null,
            radar,
            mode: { ld2412: 'presence', ld2460: 'xy', ld6002b: 'xyz' }[radar],
            secondary: index > 0,
            estimatedHeight,
        };
    });
}

export function fieldCoversPoint(field, item, point, profile = 'seated') {
    const angle = item.angle * Math.PI / 180;
    const dx = point.x - item.x;
    const dy = point.y - item.y;
    const x = dx * Math.cos(angle) + dy * Math.sin(angle);
    const y = -dx * Math.sin(angle) + dy * Math.cos(angle);
    if (field.radii) {
        const [rx, ry] = field.profiles?.[profile] ?? field.radii;
        return (x / rx) ** 2 + (y / ry) ** 2 <= 1;
    }
    const distance = Math.hypot(x, y);
    return distance <= field.range && (distance === 0 || Math.abs(Math.atan2(x, -y)) <= field.half * Math.PI / 180);
}
