export const ceilingHeightLimits = [1, 12];
export const ceilingTypes = ['flat', 'slope', 'gable'];
export const ceilingDirections = ['x+', 'x-', 'y+', 'y-'];

const isHeight = height => Number.isFinite(height)
    && height >= ceilingHeightLimits[0] && height <= ceilingHeightLimits[1];

export function validCeiling(room) {
    if (!isHeight(room.height)) return false;
    if (room.ceiling == null) return true;
    const { type, high, direction } = room.ceiling;
    return (type === 'slope' || type === 'gable') && isHeight(high) && high > room.height
        && ceilingDirections.includes(direction) && (type !== 'gable' || direction.endsWith('+'));
}

const activeCeiling = room => validCeiling(room) ? room.ceiling : null;

export function ceilingProfile(room) {
    const ceiling = activeCeiling(room);
    if (!ceiling) return [[0, room.height], [1, room.height]];
    if (ceiling.type === 'gable') return [[0, room.height], [.5, ceiling.high], [1, room.height]];
    return ceiling.direction.endsWith('+')
        ? [[0, room.height], [1, ceiling.high]]
        : [[0, ceiling.high], [1, room.height]];
}

export function ceilingPosition(room, point) {
    const alongX = activeCeiling(room)?.direction.startsWith('x');
    const position = alongX ? (point.x - room.x) / room.width : (point.y - room.y) / room.depth;
    return Math.max(0, Math.min(1, position));
}

export function ceilingHeightAt(room, point) {
    const ceiling = activeCeiling(room);
    if (!ceiling) return room.height;
    const position = ceilingPosition(room, point);
    const { type, direction, high } = ceiling;
    const proportion = type === 'gable' ? 1 - Math.abs(2 * position - 1)
        : direction.endsWith('+') ? position : 1 - position;
    // Remove floating-point noise at exact radar-profile boundaries.
    return Number((room.height + (high - room.height) * proportion).toFixed(6));
}

export function ceilingPitch(room) {
    const ceiling = activeCeiling(room);
    if (!ceiling) return 0;
    const span = ceiling.direction.startsWith('x') ? room.width : room.depth;
    const run = ceiling.type === 'gable' ? span / 2 : span;
    return Math.atan2(ceiling.high - room.height, run) * 180 / Math.PI;
}
