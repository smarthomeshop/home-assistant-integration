// Light for the 3D model. 'studio' is the even, neutral light the planner has
// always used. The others follow the sun through the day: low and warm from
// the east in the morning, high from the south at midday, low and orange from
// the west in the evening, and a dim blue moonlight at night. Plans are drawn
// with north up, so east is +x and south is +y.
//
//   sun    direction towards the light, used to shade every face
//   cast   where furniture shadows fall, as an offset per metre of height
//   dim    how much the light fades, 0 to 1
const presets = {
    studio: { sun: [-.42, -.43, .8], cast: [1, .83], dim: 0 },
    morning: { sun: [.82, .2, .5], cast: [-1.55, -.35], dim: .05 },
    midday: { sun: [.12, .46, .88], cast: [-.22, -.6], dim: 0 },
    evening: { sun: [-.8, .28, .46], cast: [1.6, -.45], dim: .12 },
    night: { sun: [-.3, -.35, .89], cast: [.45, .4], dim: .6 },
};

export const daylights = Object.keys(presets);
export const daylightFor = name => presets[name] ?? presets.studio;

// The part of the day a clock time falls in, for scenes that follow real time.
export function daylightAt(date = new Date()) {
    const hour = date.getHours() + date.getMinutes() / 60;
    if (hour < 6 || hour >= 21.5) return 'night';
    if (hour < 10.5) return 'morning';
    return hour < 16.5 ? 'midday' : 'evening';
}
