export const roomLimits = { width: [2, 15], depth: [2, 12], height: [2, 4] };
export const mountingRanges = { ld2412: [2, 3], ld2460: [2, 3], ld6002b: [2, 3] };
export const plannerRadars = [...Object.keys(mountingRanges), 'combined'];
export const modelGoal = 90;
const grid = 24;
const slots = [.5, .25, .75, 1 / 6, 5 / 6];

const scale = (height, reference, radii) => {
    const factor = Math.min(height / reference, reference / height);
    return radii.map(radius => radius * factor);
};

// The existing ceiling demo's Hi-Link references. Interpolation is illustrative.
export function radarFootprint(radar, height) {
    if (radar === 'combined') return radarFootprint('ld6002b', height);
    if (radar === 'ld2412') {
        return {
            moving: scale(height, 2.8, [4.8, 6.4]),
            standing: scale(height, 2.8, [4.4, 5.6]),
            seated: scale(height, 2.8, [3, 4.2]),
        };
    }
    const radii = radar === 'ld2460' ? scale(height, 2.8, [4, 2.8])
        : height < 2.7 ? scale(height, 2.7, [2.5, 1.5])
        : height <= 3 ? [1.5 + (3 - height) / .3, 1.5]
        : scale(height, 3, [1.5, 1.5]);
    return { moving: radii, standing: radii, seated: radii };
}

export function validRoom(room) {
    return Object.entries(roomLimits).every(([key, [min, max]]) =>
        Number.isFinite(room[key]) && room[key] >= min && room[key] <= max);
}

export function supportedMounting(radar, height) {
    const range = mountingRange(radar);
    return Boolean(range && height >= range[0] && height <= range[1]);
}

export function mountingRange(radar) {
    if (radar !== 'combined') return mountingRanges[radar];
    const [presenceMin, presenceMax] = mountingRanges.ld2412;
    const [positionMin, positionMax] = mountingRanges.ld6002b;
    return [Math.max(presenceMin, positionMin), Math.min(presenceMax, positionMax)];
}

const percent = cells => Math.floor(cells / (grid * grid) * 100);
const oriented = (radii, rotated) => rotated ? [radii[1], radii[0]] : radii;

const coversPoint = (room, [rx, ry], position, point) =>
    ((point.x - position.x) * room.width / rx) ** 2 + ((point.y - position.y) * room.depth / ry) ** 2 <= 1;

function coverageMask(room, radii, position) {
    const [rx, ry] = radii;
    return Array.from({ length: grid }, (_, row) => {
        const dy = (((row + .5) / grid - position.y) * room.depth / ry) ** 2;
        let bits = 0;
        for (let col = 0; col < grid; col++) {
            const dx = (((col + .5) / grid - position.x) * room.width / rx) ** 2;
            if (dx + dy <= 1) bits |= 1 << col;
        }
        return bits;
    });
}

function countBits(bits) {
    let count = 0;
    while (bits) {
        bits &= bits - 1;
        count++;
    }
    return count;
}

export function roomPlans(room, radar, priority = null) {
    if (!validRoom(room) || !plannerRadars.includes(radar)) return [];
    const footprint = radarFootprint(radar, room.height).seated;
    const possiblePositions = slots.flatMap(x => slots.map(y => ({ x, y })));
    const best = [null, null, null];
    const orientations = footprint[0] === footprint[1] ? [false] : [false, true];
    const candidates = possiblePositions.map(position => orientations.map(rotated => {
        const radii = oriented(footprint, rotated);
        return {
            position: { ...position, rotated }, mask: coverageMask(room, radii, position),
            coversPriority: priority && coversPoint(room, radii, position, priority),
        };
    }));
    function search(start, positions, mask, priorityCovered) {
        const cells = mask.reduce((sum, row) => sum + countBits(row), 0);
        const index = positions.length - 1;
        const current = best[index];
        if (!current || (priorityCovered && !current.priorityCovered)
            || (priorityCovered === current.priorityCovered && cells > current.cells)) {
            best[index] = { positions, cells, priorityCovered };
        }
        if (positions.length === 3) return;
        for (let i = start; i < candidates.length; i++) {
            for (const next of candidates[i]) {
                search(i + 1, [...positions, next.position], mask.map((row, j) => row | next.mask[j]),
                    priorityCovered || next.coversPriority);
            }
        }
    }
    search(0, [], Array(grid).fill(0), !priority);
    return best.map(({ positions, cells, priorityCovered }) => ({
        positions, coverage: percent(cells), reachesGoal: priorityCovered && cells * 100 >= modelGoal * grid * grid,
    }));
}

export function drawnCoverage(room, radar, positions, priority = null) {
    if (!positions.length || !validRoom(room)) return { coverage: 0, covered: '', overlap: '' };
    const footprint = radarFootprint(radar, room.height).seated;
    const masks = positions.map(position => coverageMask(room, oriented(footprint, position.rotated), position));
    const dx = room.width / grid;
    const dy = room.depth / grid;
    let cells = 0;
    let covered = '';
    let overlap = '';
    for (let y = 0; y < grid; y++) {
        for (let x = 0; x < grid; x++) {
            const hits = masks.reduce((sum, mask) => sum + Number(Boolean(mask[y] & (1 << x))), 0);
            if (!hits) continue;
            cells++;
            const square = 'M' + x * dx + ' ' + y * dy + 'h' + dx + 'v' + dy + 'h-' + dx + 'Z';
            if (hits === 1) covered += square;
            else overlap += square;
        }
    }
    return { coverage: percent(cells), covered, overlap,
        priorityCovered: priority && positions.some(position => coversPoint(room, oriented(footprint, position.rotated), position, priority)) };
}
