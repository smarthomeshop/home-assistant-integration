import { drawnCoverage, plannerRadars, roomPlans, supportedMounting, validRoom } from './ceilsense-room-model.mjs';

const readMeasure = value => /^\d+(?:[.,]\d+)?$/.test(String(value).trim())
    ? Number(String(value).replace(',', '.')) : NaN;
const positiveMeasure = value => Number.isFinite(value) && value > 0;
export const formatMeasure = value => new Intl.NumberFormat(document.documentElement.lang, {
    maximumFractionDigits: 5, useGrouping: false,
}).format(value);

export function ceilsensePlanner(overrides = {}) {
    const planner = {
        roomWidth: '', roomDepth: '', roomHeight: '', roomObstacles: false,
        plannerRadar: 'ld2412', plannerCount: 1, plannerManualCount: false,
        plannerPriority: null,
        plannerPlans: [], plannerPositions: [], plannerDrawn: { coverage: 0, covered: '', overlap: '' },

        get plannerRoom() {
            return { width: readMeasure(this.roomWidth), depth: readMeasure(this.roomDepth), height: readMeasure(this.roomHeight) };
        },
        get plannerValid() { return validRoom(this.plannerRoom); },
        get plannerHasMeasurements() { return Object.values(this.plannerRoom).every(positiveMeasure); },
        invalidMeasure(value) {
            return String(value).trim() !== '' && !positiveMeasure(readMeasure(value));
        },
        get plannerMountingOK() { return supportedMounting(this.plannerRadar, this.plannerRoom.height); },
        get plannerCanEstimate() { return this.plannerValid && this.plannerMountingOK && !this.roomObstacles; },
        get plannerAdvice() {
            if (!this.plannerCanEstimate) return 0;
            return this.plannerPlans.findIndex(plan => plan.reachesGoal) + 1;
        },
        floorPlannerLink(destination) {
            const { width, depth, height } = this.plannerRoom;
            if (!this.plannerHasMeasurements || !plannerRadars.includes(this.plannerRadar)) return destination;
            const url = new URL(destination, location.href);
            url.search = new URLSearchParams({ width, depth, height, radar: this.plannerRadar });
            if (this.roomObstacles) url.searchParams.set('obstacles', '1');
            return url.href;
        },
        updatePlanner() {
            this.plannerPlans = this.plannerCanEstimate ? roomPlans(this.plannerRoom, this.plannerRadar, this.plannerPriority) : [];
            this.plannerManualCount = false;
            this.selectPlannerCount(this.plannerAdvice || 1, false);
        },

        selectPlannerCount(count, manual = true) {
            this.plannerCount = count;
            this.plannerManualCount = manual;
            const plan = this.plannerPlans[this.plannerCount - 1];
            this.plannerPositions = (plan?.positions || []).map(position => ({ ...position }));
            this.drawPlanner();
        },

        drawPlanner() {
            this.plannerDrawn = drawnCoverage(this.plannerRoom, this.plannerRadar, this.plannerPositions, this.plannerPriority);
        },

    };
    return Object.defineProperties(planner, Object.getOwnPropertyDescriptors(overrides));
}

export function formatPlannerLink({ width, depth, height, radar, obstacles, count, priority, positions }) {
    const pair = ({ x, y }) => [x, y].map(value => Number(value.toFixed(4)));
    const points = positions.flatMap(position => [...pair(position), Number(Boolean(position.rotated))]);
    return 'cs-room=' + ['v3', width, depth, height, radar, Number(Boolean(obstacles)), count,
        ...pair(priority || { x: 0, y: 0 }), ...points].join(',');
}

export function parsePlannerLink(hash) {
    if (!hash.startsWith('#cs-room=') || hash.length > 180) return null;
    const [version, width, depth, height, radar, obstacles, choice, ...layout] = hash.slice(9).split(',');
    if (version !== 'v3' && version !== 'v2') return null;
    const legacy = version === 'v2';
    const [oldRotation, px, py, ...points] = legacy ? layout : [null, ...layout];
    const stride = legacy ? 2 : 3;
    const room = { width: Number(width), depth: Number(depth), height: Number(height) };
    const count = Number(choice);
    const validPoint = value => Number(value) >= .05 && Number(value) <= .95;
    const priority = px === '0' && py === '0' ? null : { x: Number(px), y: Number(py) };
    if (!validRoom(room) || !plannerRadars.includes(radar) || !['0', '1'].includes(obstacles)
        || (legacy && !['0', '1'].includes(oldRotation))
        || ![0, 1, 2, 3].includes(count) || ![1, 2, 3].includes(points.length / stride)
        || (count && points.length !== count * stride)
        || (priority && ![px, py].every(validPoint))) return null;
    const positions = [];
    for (let i = 0; i < points.length; i += stride) {
        const [x, y, rotated] = points.slice(i, i + stride);
        if (![x, y].every(value => value?.trim() && Number(value) >= 0 && Number(value) <= 1) || (!legacy && !['0', '1'].includes(rotated))) return null;
        positions.push({ x: Number(x), y: Number(y), rotated: (legacy ? oldRotation : rotated) === '1' });
    }
    return { ...room, radar, obstacles: obstacles === '1', count, priority, positions };
}
