// Coverage map: how many radars would see a standing person on each spot of
// the floor. Spots no radar covers are the dead zones worth fixing first.
//
// The floor is sampled on a grid of `step` metres. Each cell gets the number
// of radars that see a person standing in its middle, and whether furniture
// is the only thing in the way.
import { roomCorners } from './floor-planner-geometry.mjs';
import { contains } from './floor-planner-model.mjs';
import { prepareFurnitureOcclusion } from './floor-planner-obstruction.mjs';
import { personSignals, preparePersonSensors } from './floor-planner-person.mjs';

export const heatStep = .25;

export function coverageCells(plan, { step = heatStep, furniture = true } = {}) {
    const sensors = preparePersonSensors(plan);
    const obstacles = furniture ? prepareFurnitureOcclusion(plan.furniture ?? []) : [];
    const cells = [];
    for (const room of plan.rooms) {
        const corners = roomCorners(room);
        const xs = corners.map(([x]) => x), ys = corners.map(([, y]) => y);
        const left = Math.floor(Math.min(...xs) / step) * step, top = Math.floor(Math.min(...ys) / step) * step;
        for (let y = top; y < Math.max(...ys); y += step) {
            for (let x = left; x < Math.max(...xs); x += step) {
                const centre = { x: x + step / 2, y: y + step / 2 };
                if (!contains(room, centre, false)) continue;
                const readings = personSignals(plan, { ...centre, pose: 'standing', heading: 0 }, sensors, obstacles);
                const seen = readings.filter(reading => reading.seen).length;
                cells.push({ x, y, seen, shadow: !seen && readings.some(reading => reading.obstacle) });
            }
        }
    }
    return cells;
}

// One path per kind of cell keeps the overlay to a handful of elements, even
// for a large home. Pass `project` to lay the map on the 3D floor.
export function paintCoverageHeat(cells, { step = heatStep, project = null } = {}) {
    const groups = new Map();
    for (const cell of cells) {
        const level = cell.seen >= 2 ? 'many' : cell.seen === 1 ? 'one' : cell.shadow ? 'shadow' : 'none';
        const square = [[cell.x, cell.y], [cell.x + step, cell.y], [cell.x + step, cell.y + step], [cell.x, cell.y + step]];
        const points = project ? square.map(point => project(point)) : square;
        if (!groups.has(level)) groups.set(level, []);
        groups.get(level).push(`M${points.map(point => point.join(' ')).join('L')}Z`);
    }
    return `<g class="fp-heat" pointer-events="none">${[...groups].map(([level, paths]) =>
        `<path class="fp-heat-cells" data-seen="${level}" d="${paths.join('')}"/>`).join('')}</g>`;
}

// Share of the floor each radar count covers, for the legend.
export function coverageSummary(cells) {
    const total = cells.length || 1;
    const share = test => Math.round(cells.filter(test).length / total * 100);
    return { none: share(cell => !cell.seen), one: share(cell => cell.seen === 1), many: share(cell => cell.seen >= 2) };
}
