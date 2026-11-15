import { furnitureParts } from './floor-planner-furniture.mjs';

const ring = (width, depth, radius, z, x = 0, y = 0, steps = 5) => {
    const r = Math.min(radius, width / 2 - .0001, depth / 2 - .0001);
    return [[1,-1],[1,1],[-1,1],[-1,-1]].flatMap(([sx, sy], corner) =>
        Array.from({ length:steps + 1 }, (_, index) => {
            const angle = (corner - 1 + index / steps) * Math.PI / 2;
            return [x + sx * (width / 2 - r) + r * Math.cos(angle), y + sy * (depth / 2 - r) + r * Math.sin(angle), z];
        }));
};

const circle = (x, y, z, radius, count = 10) => Array.from({ length:count }, (_, index) => {
    const angle = index * 2 * Math.PI / count;
    return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, z];
});

function bridge(from, to, surface) {
    return from.map((point, index) => {
        const next = (index + 1) % from.length;
        return { vertices:[point, from[next], to[next], to[index]], surface, face:'face' };
    });
}

function roundBox(width, depth, radius, low, high, surface, x = 0, y = 0) {
    const bottom = ring(width, depth, radius, low, x, y, 2);
    const top = bottom.map(([x, y]) => [x, y, high]);
    return [...bridge(bottom, top, surface), { vertices:top, surface, face:'top' }];
}

function cushion({ w, d, low, high, surface, x, y }) {
    const r = Math.min(w, d) * .19;
    const center = [x + w / 2, y + d / 2];
    const bevel = Math.min(r * .4, (high - low) * .25);
    const bottom = ring(w, d, r, low, ...center, 3);
    const shoulder = bottom.map(([x, y]) => [x, y, high - bevel]);
    const top = ring(w - 2 * bevel, d - 2 * bevel, r - bevel, high, ...center, 3);
    return [...bridge(bottom, shoulder, surface), ...bridge(shoulder, top, surface), { vertices:top, surface, face:'top' }];
}

const block = (x, y, w, d, low, high, surface) => ({ x, y, w, d, low, high, surface });

function bath({ width:w, depth:d, height:h, base:z }) {
    const r = Math.min(w, d) * .39;
    const low = ring(w * .86, d * .78, r * .81, z + .035 * h);
    const body = ring(w * .99, d * .98, r, z + .76 * h);
    const edge = ring(w, d, r, z + .83 * h);
    const rim = ring(w * .95, d * .90, r * .94, z + h * .845);
    const inner = ring(w * .83, d * .73, r * .83, z + .815 * h);
    const bottom = ring(w * .67, d * .56, r * .66, z + .30 * h);
    const drain = circle(-w * .21, 0, z + .304 * h, Math.min(w, d) * .037);
    const tap = circle(-w * .44, 0, z + h * .83, Math.min(w, d) * .024, 8);
    const tapTop = tap.map(([x,y]) => [x,y,z + h]);
    return [
        ...bridge(low, body, 'ceramic'), ...bridge(body, edge, 'ceramic'),
        ...bridge(edge, rim, 'ceramic-rim'), ...bridge(rim, inner, 'ceramic-rim'), ...bridge(inner, bottom, 'basin'),
        { vertices:bottom, surface:'basin-floor', face:'top' }, { vertices:drain, surface:'chrome', face:'top' },
        ...bridge(tap, tapTop, 'chrome'), { vertices:tapTop, surface:'chrome', face:'top' },
        ...roundBox(w * .085, d * .034, Math.min(w,d) * .014, z + h * .955, z + h, 'chrome', -w * .411, 0),
    ];
}

function curtain({ width:w, depth:d, height:h, base:z }) {
    const pleats = Math.max(4, Math.min(8, Math.round(w / .26)));
    const segments = pleats * 4;
    const cloth = (index, height, width, amplitude) => {
        const along = index / segments - .5;
        return [along * w * width, Math.sin(index / 4 * Math.PI * 2) * d * amplitude, z + h * height];
    };
    const faces = [];
    for (let i = 0; i < segments; i++) {
        for (const [bottom, top, bottomWidth, topWidth, bottomDepth, topDepth] of [
            [.02,.055,1,1,.48,.47], [.055,.78,1,.985,.47,.36], [.78,.96,.985,.95,.36,.32],
        ]) {
            const surface = bottom === .02 ? 'cloth-hem' : ['cloth', 'cloth-shadow', 'cloth', 'cloth-light'][i % 4];
            const vertices = [cloth(i,bottom,bottomWidth,bottomDepth), cloth(i+1,bottom,bottomWidth,bottomDepth),
                cloth(i+1,top,topWidth,topDepth), cloth(i,top,topWidth,topDepth)];
            const [a,b,c,e] = vertices;
            // The gathering changes along the height, so split each twisted strip into planar faces.
            for (const vertices of [[a,b,c],[a,c,e]]) faces.push({ vertices, surface, face:'face' },
                { vertices:[...vertices].reverse(), surface, face:'face' });
        }
    }
    return faces.concat(roundBox(w, d * .64, d * .30, z + h * .969, z + h, 'rail'));
}

function plant({ width:w, depth:d, height:h, base:z }) {
    const radius = Math.min(w,d) * .31;
    const foot = circle(0,0,z, radius * .76), top = circle(0,0,z + h * .30,radius);
    const foliage = Array.from({ length:9 }, (_, index) => {
        const a = index * 2.39996;
        const point = (length, side, y) => [Math.cos(a)*w*length-Math.sin(a)*w*side,
            Math.sin(a)*d*length+Math.cos(a)*d*side,z+h*y];
        const tip = point(index > 5 ? .31 : .46, 0, index > 5 ? .91 + .022 * (index - 6) : .67 + .036 * index);
        const root = point(.04,0,.27 + index*.033), mid = point(.30,0,.69 + index*.027);
        const leaf = [root, point(.23,.13,.57 + index*.03), tip, point(.25,-.12,.60 + index*.028)];
        return leaf.flatMap((vertex, i) => {
            const vertices = [vertex, leaf[(i+1)%4], mid];
            const surface = i % 2 ? 'leaf-light' : 'leaf';
            return [{ vertices, surface, face:'face' }, { vertices:[...vertices].reverse(), surface, face:'face' }];
        });
    });
    return [...bridge(foot,top,'planter'), { vertices:top, surface:'soil', face:'top' }, ...foliage.flat()];
}

const frontCircle = (x, y, z, rx, rz) => Array.from({ length:14 }, (_, index) => {
    const angle = index * 2 * Math.PI / 14;
    return [x + Math.cos(angle) * rx, y, z - Math.sin(angle) * rz];
});

function washer({ width:w, depth:d, height:h, base:z }) {
    const outer = frontCircle(0, d * .485, z + h*.48,w*.35,h*.27);
    const bezel = frontCircle(0, d * .50, z + h*.48,w*.35*.94,h*.27*.94);
    const glass = frontCircle(0, d * .50, z + h*.48,w*.265,h*.203);
    const drum = frontCircle(0, d * .501, z + h*.48,w*.192,h*.15);
    const dial = frontCircle(w*.25, d*.497, z+h*.86,w*.067,h*.053);
    return [...roundBox(w,d*.966,Math.min(w,d)*.05,z,z+h,'appliance'), ...bridge(outer,bezel,'chrome'), ...bridge(bezel,glass,'gasket'),
        { vertices:glass, surface:'porthole', face:'face' }, { vertices:drum, surface:'drum', face:'face' }, { vertices:dial, surface:'chrome', face:'face' }];
}

function fan({ width:w, depth:d, height:h, base:z }) {
    const centre = z + h * .8;
    // The grill is the rim scaled exactly, so the ring between them stays flat.
    const rim = frontCircle(0, d * .08, centre, w * .48, h * .19);
    const grill = frontCircle(0, d * .08, centre, w * .48 * .9, h * .19 * .9);
    const hub = frontCircle(0, d * .115, centre, w * .08, h * .032);
    return [
        ...roundBox(w * .64, d * .92, Math.min(w, d) * .3, z, z + h * .04, 'appliance'),
        ...roundBox(.036, .036, .012, z + h * .04, z + h * .7, 'chrome'),
        ...roundBox(w * .22, d * .4, Math.min(w, d) * .08, centre - h * .06, centre + h * .06, 'appliance', 0, -d * .14),
        ...bridge(rim, grill, 'fan-rim'),
        { vertices:grill, surface:'fan-grill', face:'face' }, { vertices:hub, surface:'chrome', face:'face' },
    ];
}

// A dog lying down: body, head with snout, and a tail.
function pet({ width:w, depth:d, height:h, base:z }) {
    return [
        ...cushion({ w:w * .7, d:d * .82, low:z + h * .04, high:z + h * .62, surface:'fur', x:-w * .44, y:-d * .41 }),
        ...cushion({ w:w * .27, d:d * .6, low:z + h * .32, high:z + h, surface:'fur', x:w * .2, y:-d * .3 }),
        ...roundBox(w * .12, d * .32, Math.min(w, d) * .06, z + h * .38, z + h * .66, 'fur-dark', w * .43, 0),
        ...roundBox(w * .17, d * .12, Math.min(w, d) * .04, z + h * .26, z + h * .38, 'fur-dark', -w * .5, d * .1),
    ];
}

export function furnitureMesh(item) {
    const { width:w, depth:d, height:h, base:z, kind } = item;
    if (kind === 'bath') return { faces:bath(item), parts:[] };
    if (kind === 'curtain') return { faces:curtain(item), parts:[] };
    if (kind === 'plant') return { faces:plant(item), parts:[] };
    if (kind === 'fan') return { faces:fan(item), parts:[] };
    if (kind === 'pet') return { faces:pet(item), parts:[] };
    if (kind === 'washer') return { faces:washer(item), parts:[block(-w*.34,d*.485,w*.35,d*.015,z+h*.82,z+h*.9,'display')] };
    const slice = (x,y,width,depth,low,high,surface) => block(w*x,d*y,w*width,d*depth,z+h*low,z+h*high,surface);
    const round = (width, depth, radius, low, high, surface) => roundBox(w*width,d*depth,Math.min(w,d)*radius,z+h*low,z+h*high,surface);
    const parts = furnitureParts(item);
    if (kind === 'tv') return { faces:round(.98,.68,.042,.12,1,'bezel'), parts:[slice(-.45,.34,.90,.024,.19,.94,'display'),
        slice(-.055,-.12,.11,.29,.025,.22,'rail'),slice(-.21,-.48,.42,.96,0,.035,'rail')] };
    if (kind === 'glass') return { faces:[], parts:[slice(-.46,-.13,.92,.26,.04,.95,'pane'),
        slice(-.50,-.50,.04,1,0,1,'rail'),slice(.46,-.50,.04,1,0,1,'rail'),
        slice(-.46,-.50,.92,1,.945,1,'rail'),slice(-.46,-.50,.92,1,0,.05,'rail')] };
    if (kind === 'screen') return { faces:[], parts:[slice(-.50,-.44,1,.88,0,.055,'frame'),
        ...Array.from({ length:3 }, (_, i) => slice(-.497+i*.339,-.4+(i%2)*.25,.315,.54,.05,.97,'screen-panel')),
        ...[-.5,-.17,.17,.475].map(x => slice(x,-.5,.025,1,.04,1,'frame'))] };
    if (kind === 'radiator' || kind === 'heater') {
        const fins = kind === 'radiator' ? 11 : 7;
        const width = .92 / fins;
        return { faces:[], parts:[
            ...(kind === 'heater' ? [slice(-.42,-.5,.06,1,0,.08,'chrome'),slice(.36,-.5,.06,1,0,.08,'chrome'),slice(.3,-.2,.16,.4,.9,1,'appliance')] : []),
            slice(-.47,-.3,.94,.6,kind === 'heater' ? .1 : .02,.98,'radiator'),
            ...Array.from({ length:fins }, (_, index) => slice(-.46 + index * width + width * .15, -.5, width * .7, 1,
                kind === 'heater' ? .08 : 0, kind === 'heater' ? .92 : 1, 'radiator-fin')),
        ] };
    }
    if (kind === 'fridge') return { faces:round(1,.94,.047,.015,1,'appliance'), parts:[
        slice(-.44,.47,.88,.03,.035,.295,'appliance-door'), slice(-.44,.47,.88,.03,.309,.97,'appliance-door'),
        slice(-.36,.493,.048,.03,.38,.69,'chrome'),slice(-.36,.493,.048,.03,.15,.275,'chrome')] };
    if (['island','cabinet','wardrobe','nightstand'].includes(kind)) {
        const drawer = kind === 'nightstand';
        const faceCount = drawer ? 2 : kind === 'island' ? 3 : 2;
        const inserts = Array.from({ length:faceCount }, (_, index) => {
            const x = drawer ? -.435 : -.456 + index*.93/faceCount;
            const low = drawer ? .13+index*.38 : .10, high = drawer ? low+.34 : .86;
            const width = drawer ? .87 : .89/faceCount;
            return [slice(x,.459,width,.027,low,high,'panel'),slice(x+width*.32,.485,width*.36,.023,high-.12,high-.092,'chrome')];
        }).flat();
        return { faces:round(1,1,.033,.91,1,kind === 'island' ? 'countertop' : 'top'), parts:[
            slice(-.45,-.43,.90,.86,.06,.915,'body'),slice(-.40,-.36,.80,.72,0,.07,'frame'), ...inserts] };
    }
    if (kind === 'shelves') return { faces:[], parts:parts.concat([
        slice(-.37,-.37,.060,.62,.32,.47,'book'),slice(-.295,-.38,.049,.6,.32,.49,'book-light'),
        slice(-.22,-.36,.067,.58,.32,.46,'book'),slice(.06,-.32,.26,.58,.59,.675,'panel'),
        slice(-.33,-.30,.25,.56,.83,.875,'book-light')]) };
    if (['coffee','dining','desk'].includes(kind)) return { faces:round(1,1,.085,.89,1,'top'), parts:parts.filter(part => part.surface !== 'top') };
    if (['sofa','corner','armchair','chair','bed'].includes(kind)) {
        const soft = ['seat','pillow','duvet'];
        const upholstered = ['sofa','corner','armchair'].includes(kind);
        const padded = part => soft.includes(part.surface) || (upholstered && part.surface === 'body' && part.low > z);
        const pads = parts.filter(padded).flatMap(part => {
            if (kind !== 'sofa' || part.surface !== 'seat') return cushion(part);
            const seats = w > 2 ? 3 : 2;
            const gap = Math.min(.024, part.w * .025);
            const width = (part.w - (seats - 1) * gap) / seats;
            return Array.from({ length:seats }, (_, index) => cushion({ ...part, w:width, x:part.x + index * (width + gap) })).flat();
        });
        return { faces:pads, parts:parts.filter(part => !padded(part)) };
    }
    return { faces:[], parts };
}

export function rugLayers({ width, depth, height, base }) {
    return [.998, .94].map((factor, index) => ring(width * factor, depth * factor,
        Math.min(width, depth) * .065, base + height + index * .002, 0, 0, 2));
}
