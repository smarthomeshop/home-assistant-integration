// Fields of the radars in a wall sensor, shown at 80% of the reference distances.
// `half` is how far the radar sees to each side, `pitch` how far up and down,
// both in degrees from where it points: the LD2412 sees a cone of 75 degrees,
// the LD2450 60 by 35 and the LD2460 60 by 45 (a field of 120 by 90).
const derate = .8;
export const wallPresence = { half: 75, pitch: 75, range: 9 * derate };
// The motion sensor behind the large lens of the UltimateSensor: a Panasonic
// long distance PIR (EKMC1603111). Its sheet gives 12 m and a field of 102
// degrees wide by 92 high, for a person who walks across it.
export const wallMotion = { half: 51, pitch: 46, range: 12 * derate };
export const wallTrackers = {
    ld2450: { half: 60, pitch: 35, range: 6 * derate, still: 6 * derate, max: 3, maxStill: 3 },
    ld2460: { half: 60, pitch: 45, range: 6 * derate, still: 5 * derate, max: 5, maxStill: 3 },
};
