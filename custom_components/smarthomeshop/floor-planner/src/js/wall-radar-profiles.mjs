// Horizontal fields used by the wall-mount demo, shown at 80% of the reference distances.
const derate = .8;
export const wallPresence = { half: 75, range: 9 * derate };
export const wallTrackers = {
    ld2450: { half: 60, range: 6 * derate, still: 6 * derate, max: 3, maxStill: 3 },
    ld2460: { half: 60, range: 6 * derate, still: 5 * derate, max: 5, maxStill: 3 },
};
