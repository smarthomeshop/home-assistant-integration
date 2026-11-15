import { projectSpace } from './floor-planner-space.mjs';
import { splitVerticesAtHeight } from './floor-planner-depth.mjs';

const tones = {
    jacket: [183, 137, 94], shoulder: [187, 144, 101], hem: [136, 99, 70],
    shirt: [238, 229, 209], seam: [123, 89, 61], pants: [83, 102, 120],
    shoe: [55, 59, 63], toe: [75, 80, 82], sole: [208, 201, 182],
    skin: [226, 176, 144], warmth: [218, 158, 130], skinFold: [176, 121, 100], lips: [173, 104, 95],
    eye: [236, 225, 211], iris: [83, 101, 93], pupil: [46, 43, 42], brow: [83, 55, 44],
    hair: [65, 45, 38], hairLight: [80, 57, 46],
};
const womanTones = {
    ...tones,
    jacket: [122, 154, 139], shoulder: [136, 165, 147], hem: [94, 127, 113], seam: [99, 135, 119],
    pants: [68, 76, 94], shoe: [172, 150, 131], toe: [188, 168, 150],
    skin: [205, 150, 115], warmth: [197, 137, 105], skinFold: [154, 96, 78], lips: [153, 86, 83],
    iris: [103, 78, 58], hair: [47, 35, 32], hairLight: [62, 43, 37],
};
const childTones = {
    ...tones,
    jacket: [141, 128, 182], shoulder: [153, 139, 194], hem: [110, 97, 150], seam: [102, 90, 138],
    pants: [89, 101, 123], shoe: [103, 117, 153], toe: [125, 138, 170],
    skin: [238, 190, 154], warmth: [229, 171, 143], hair: [104, 73, 47], hairLight: [122, 87, 54],
};

const figures = {
    man: { palette:tones, size:1, torso:1, limbs:1, head:1, hair:'short' },
    woman: { palette:womanTones, size:.94, torso:.90, limbs:.88, head:.96, hair:'long' },
    child: { palette:childTones, size:.72, torso:.89, limbs:.88, head:1.13, headHeight:1.14, hair:'wavy' },
};

const mix = ([x, y, z], [a, b, c], t) => [x + (a - x) * t, y + (b - y) * t, z + (c - z) * t];
const add = ([x, y, z], [a, b, c]) => [x + a, y + b, z + c];
const subtract = ([x, y, z], [a, b, c]) => [x - a, y - b, z - c];
const scale = ([x, y, z], amount) => [x * amount, y * amount, z * amount];
const dot = ([x, y, z], [a, b, c]) => x * a + y * b + z * c;
const cross = ([x, y, z], [a, b, c]) => [y * c - z * b, z * a - x * c, x * b - y * a];
const unit = vector => scale(vector, 1 / (Math.hypot(...vector) || 1));
const angles = count => Array.from({ length: count }, (_, index) => {
    const angle = index / count * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
});
const limbRing = angles(9);
const bodyRing = angles(12);
const headRing = angles(18);

// Rings are perpendicular to a body segment. The side axis stays aligned with the person.
function crossSection(center, axis, width, depth, ring) {
    const reference = Math.abs(axis[1]) < .93 ? [0, 1, 0] : [0, 0, 1];
    const side = unit(subtract(reference, scale(axis, dot(reference, axis))));
    const front = cross(axis, side);
    return ring.map(([u, v]) => add(center, add(scale(side, u * width), scale(front, v * depth))));
}

function shell(rings, sections, addFace, { start = true, end = true } = {}) {
    const normals = rings.map((ring, row) => {
        const earlier = rings[Math.max(0, row - 1)], later = rings[Math.min(rings.length - 1, row + 1)];
        return ring.map((_, index) => {
            const around = subtract(ring[(index + 1) % ring.length], ring[(index + ring.length - 1) % ring.length]);
            return unit(cross(around, subtract(later[index], earlier[index])));
        });
    });
    if (start) addFace([...rings[0]].reverse(), sections[0][3]);
    for (let section = 1; section < rings.length; section++) {
        const a = rings[section - 1], b = rings[section];
        const normalA = normals[section - 1], normalB = normals[section];
        for (let index = 0; index < a.length; index++) {
            const next = (index + 1) % a.length;
            addFace([a[index], a[next], b[next], b[index]], sections[section][3],
                [normalA[index], normalA[next], normalB[next], normalB[index]]);
        }
    }
    if (end) addFace(rings.at(-1), sections.at(-1)[3]);
}

function profile(start, end, sections, addFace, ring = limbRing) {
    const axis = unit(subtract(end, start));
    shell(sections.map(([position, width, depth]) => crossSection(mix(start, end, position), axis, width, depth, ring)), sections, addFace);
}

function bentProfile([start, joint, end], sections, addFace) {
    const center = t => t <= .5 ? mix(start, joint, 2 * t) : mix(joint, end, 2 * t - 1);
    const rings = sections.map(([t, width, depth]) => {
        const axis = unit(subtract(center(Math.min(1, t + .075)), center(Math.max(0, t - .075))));
        return crossSection(center(t), axis, width, depth, limbRing);
    });
    shell(rings, sections, addFace);
}

function step(phase, side) {
    const position = (phase + (side < 0 ? .5 : 0)) % 1;
    if (position < .61) return { reach: .315 - position * 1.04, lift: 0 };
    const swing = (position - .61) / .39;
    return { reach: -.32 + (.5 - .5 * Math.cos(swing * Math.PI)) * .635, lift: .105 * Math.sin(swing * Math.PI) ** 1.2 };
}

function standing(phase) {
    const moving = phase !== null;
    const bob = moving ? .012 * Math.cos(phase * Math.PI * 4) : 0;
    const sway = moving ? .016 * Math.sin(phase * Math.PI * 2) : .011;
    return {
        hips: [0, sway, .92 + bob], shoulders: [.032, -sway * .45, 1.44 + bob],
        chin: [.052, 0, 1.49 + bob], crown: [.045, 0, 1.73 + bob], face: [1, 0, 0],
        leg(side) {
            const { reach, lift } = moving ? step(phase, side) : { reach: side * .03, lift: 0 };
            return [[0, side * .10 + sway, .94 + bob], [reach * .47 + .039 + lift * .60, side * .105, .51 + lift * .62],
                [reach, side * .112, .085 + lift]];
        },
        arm(side) {
            const swing = moving ? Math.cos((phase + (side < 0 ? .5 : 0)) * Math.PI * 2) : 0;
            return [[.029 - swing * .023, side * .145 - sway * .45, 1.43 + bob], [-swing * .094 - .021, side * .194, 1.174 + bob],
                [-swing * .164 + .042, side * .192, 1.004 + bob + Math.max(0, -swing) * .038]];
        },
        toes: [1, 0, 0],
    };
}

function kneeFor(hip, ankle) {
    const thigh = .463, shin = .445;
    const difference = subtract(ankle, hip);
    const distance = Math.hypot(...difference);
    const axis = scale(difference, 1 / distance);
    const forward = unit([-axis[2], 0, axis[0]]);
    const along = (thigh ** 2 - shin ** 2 + distance ** 2) / (2 * distance);
    const bend = Math.sqrt(Math.max(0, thigh ** 2 - along ** 2));
    return add(add(hip, scale(axis, along)), scale(forward, bend));
}

function stairStance(phase, feet, size) {
    const body = standing(phase);
    const ankles = feet.map(({ ahead, height }, index) => [ahead / size, (index ? 1 : -1) * .109, .078 + height / size]);
    const hipHeight = Math.min(.913 + .012 * Math.cos(phase * Math.PI * 4),
        ...ankles.map(([ahead, , z]) => z + Math.sqrt(Math.max(.07, .89 ** 2 - (ahead - .02) ** 2))));
    const adjust = ([x, y, z], lean = .045) => [x + lean, y, z + hipHeight - .94];
    return {
        ...body, hips: [.02, 0, hipHeight - .018], shoulders: adjust(body.shoulders), shoeScale: .93,
        chin: adjust(body.chin), crown: adjust(body.crown),
        leg(side) {
            const hip = [.02, side * .10, hipHeight];
            const ankle = ankles[side > 0 ? 1 : 0];
            return [hip, kneeFor(hip, ankle), ankle];
        },
        arm(side) { return body.arm(side).map(point => adjust(point, .027)); },
    };
}

const sitting = {
    hips: [-.09, 0, .48], shoulders: [-.008, 0, .984],
    chin: [.028, 0, 1.03], crown: [.022, 0, 1.265], face: [1, 0, 0],
    leg: side => [[-.08, side * .10, .48], [.331, side * .129, .46], [.307, side * .139, .085]],
    arm: side => [[-.02, side * .147, .975], [.095, side * .206, .714], [.263, side * .16, .561]],
    toes: [1, 0, 0],
};

function sittingOnCushion(height, size) {
    const lift = height / size - mix(sitting.hips, sitting.shoulders, -.23)[2];
    const raised = ([x, y, z], amount = lift) => [x, y, z + amount];
    return {
        ...sitting,
        hips: raised(sitting.hips), shoulders: raised(sitting.shoulders),
        chin: raised(sitting.chin), crown: raised(sitting.crown),
        leg(side) {
            const [hip, knee, ankle] = sitting.leg(side);
            return [raised(hip), raised(knee, lift * .55), ankle];
        },
        arm: side => sitting.arm(side).map(point => raised(point)),
    };
}

function blendPose(from, to, progress) {
    const joint = name => side => from[name](side).map((point, index) => mix(point, to[name](side)[index], progress));
    return {
        ...from,
        hips: mix(from.hips, to.hips, progress),
        shoulders: mix(from.shoulders, to.shoulders, progress),
        chin: mix(from.chin, to.chin, progress),
        crown: mix(from.crown, to.crown, progress),
        face: unit(mix(from.face, to.face, progress)),
        toes: unit(mix(from.toes, to.toes, progress)),
        leg: joint('leg'), arm: joint('arm'),
    };
}

function smokeStance(phase, time, animate) {
    const neutral = standing(null);
    const reaching = phase === 'start' || phase === 'fire';
    if (reaching) {
        const reach = {
            ...neutral, hips: [-.08, 0, .87], shoulders: [.22, 0, 1.32],
            chin: [.30, 0, 1.35], crown: [.40, 0, 1.56], face: [.83, 0, -.55],
            arm: side => side > 0
                ? [[.21, .145, 1.31], [.43, .19, 1.14], [.65, .12, 1.06]]
                : [[.21, -.145, 1.31], [.03, -.23, 1.11], [.03, -.23, .93]],
        };
        const progress = phase === 'start' ? Math.min(1, time / .65) : 1 - Math.min(1, (time - .85) / .68);
        return blendPose(neutral, reach, animate ? progress * progress * (3 - 2 * progress) : .65);
    }
    const wave = animate ? time * Math.PI * 4.6 : 0;
    const sway = Math.sin(wave * .54) * .055;
    const alarm = {
        ...neutral,
        hips: [-.035, sway * .35, .90], shoulders: [-.06, sway, 1.42],
        chin: [-.055, sway * 1.3, 1.48], crown: [-.055, sway * 1.4, 1.72],
        arm(side) {
            const pulse = Math.sin(wave + side * .91);
            return [[-.055, side * .145 + sway, 1.42],
                [.027, sway + side * (.293 + .035 * pulse), 1.61 + .05 * pulse],
                [.073, sway + side * (.29 + .11 * pulse), 1.856 + .072 * pulse]];
        },
    };
    return blendPose(neutral, alarm, animate ? Math.min(1, (time - 1.65) / .26) : 1);
}

const lying = {
    hips: [-.235, 0, .128], shoulders: [.291, 0, .143],
    chin: [.358, 0, .123], crown: [.592, 0, .145], face: [0, 0, 1],
    leg: side => [[-.218, side * .096, .134], [-.592, side * .13, side === 1 ? .17 : .092], [-.938, side * .15, .078]],
    arm: side => [[.288, side * .146, .143], [.031, side * .245, .092], [-.121, side * .208, .081]],
    toes: [-.61, 0, .79],
};

const offBalance = {
    hips: [-.09, 0, .85], shoulders: [-.31, 0, 1.34],
    chin: [-.31, 0, 1.42], crown: [-.43, 0, 1.63], face: [.88, 0, .48],
    leg: side => [[-.09, side * .10, .86], [.20, side * .13, .50],
        [side > 0 ? .22 : -.24, side * .14, .085]],
    arm: side => [[-.27, side * .145, 1.34], [-.12, side * .29, 1.22],
        [.08, side * .38, 1.28]],
    toes: [1, 0, 0],
};
const mirror = ([x, y, z]) => [-x, y, z];
const fallen = {
    hips: mirror(lying.hips), shoulders: mirror(lying.shoulders),
    chin: mirror(lying.chin), crown: mirror(lying.crown), face: lying.face, toes: mirror(lying.toes),
    leg: side => lying.leg(side).map(mirror), arm: side => lying.arm(side).map(mirror),
};

function fallStance(progress) {
    const buckle = .37;
    if (progress <= buckle) return blendPose(standing(null), offBalance, (progress / buckle) ** 1.4);
    return blendPose(offBalance, fallen, ((progress - buckle) / (1 - buckle)) ** 1.6);
}

// Heights, temple widths and separate face and skull radii, measured from the chin.
const skull = [
    [0, .039, .049, .048], [.10, .060, .066, .063], [.24, .075, .076, .080],
    [.39, .084, .082, .090], [.53, .087, .079, .095], [.65, .086, .084, .096],
    [.77, .084, .079, .091], [.87, .073, .065, .080], [.95, .051, .045, .058], [1, .014, .014, .018],
];

function skullAt(height) {
    const index = Math.max(1, skull.findIndex(([level]) => level >= height));
    const lower = skull[index - 1], upper = skull[index];
    const t = (height - lower[0]) / (upper[0] - lower[0]);
    return [height, lower[1] + (upper[1] - lower[1]) * t, lower[2] + (upper[2] - lower[2]) * t,
        lower[3] + (upper[3] - lower[3]) * t];
}

function buildHead(pose, model, addFace, detailed) {
    const up = unit(subtract(pose.crown, pose.chin));
    const forward = unit(subtract(pose.face, scale(up, dot(up, pose.face))));
    const side = cross(up, forward);
    const headPoint = (height, lateral, depth) => add(mix(pose.crown, pose.chin, (1 - height) * (model.headHeight ?? 1)),
        add(scale(side, lateral * model.head), scale(forward, depth * model.head)));
    const ring = detailed ? headRing : bodyRing;
    const hairline = ([u, v]) => {
        const front = Math.max(0, u);
        const sweep = model.hair === 'short' ? v * .085 : v * .053;
        return (model.hair === 'long' ? .44 : .48) + .31 * front ** 1.8 + sweep * front;
    };
    const aroundHead = ([u, v], height, fullness = 0, lift = 0) => {
        const [, width, face, back] = skullAt(height);
        return headPoint(height + lift, v * (width + fullness), u * ((u > 0 ? face : back) + fullness));
    };
    // Skin and hair share one edge so the scalp never intersects the hair mesh.
    const skinBands = [0, .16, .36, .57, .72, .86, 1];
    const skin = skinBands.map(level => ring.map(angle => aroundHead(angle, hairline(angle) * level)));
    shell(skin, skinBands.map(() => [0, 0, 0, 'skin']), addFace, { end:false });
    const hairBands = [0, .25, .48, .68, .84, 1];
    const hair = hairBands.map(level => ring.map(angle => {
        const line = hairline(angle);
        const wave = model.hair === 'wavy' ? .014 + .004 * Math.cos(angle[1] * 19) : .012;
        const volume = wave * Math.sin(level * Math.PI * .91);
        return aroundHead(angle, line + (1 - line) * level, volume, .032 * level);
    }));
    shell(hair, hairBands.map(() => [0, 0, 0, 'hair']), addFace, { start:false });

    if (model.hair === 'long') {
        for (const direction of [-1, 1]) {
            const roots = headPoint(.66, direction * .062, -.059);
            const tip = add(pose.shoulders, add(scale(side, direction * .112), scale(forward, -.051)));
            profile(roots, tip, [[0, .052, .038, 'hairLight'], [.52, .060, .042, 'hair'],
                [.83, .047, .033, 'hair'], [1, .016, .018, 'hair']], addFace);
        }
    }
    const face = (lateral, height, lift) => {
        const [, width, depth] = skullAt(height);
        return headPoint(height, lateral, depth * Math.sqrt(Math.max(0, 1 - (lateral / width) ** 2)) + lift);
    };
    const patch = (outline, tone) => {
        const vertices = outline.map(([lateral, height, lift = .003]) => face(lateral, height, lift));
        const normal = cross(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0]));
        addFace(dot(normal, forward) < 0 ? vertices.reverse() : vertices, tone);
    };
    const tip = [0, .440, .032];
    patch([[0, .648, .004], [-.018, .458, .009], tip], 'skin');
    patch([[0, .648, .004], tip, [.018, .458, .009]], 'skin');
    patch([[-.018, .458, .009], [-.012, .405, .010], [0, .406, .019], tip], 'warmth');
    patch([tip, [0, .406, .019], [.012, .405, .010], [.018, .458, .009]], 'warmth');
    if (!detailed) return;
    patch([[-.025, .282], [-.010, .301, .006], [0, .287, .007], [.010, .301, .006], [.025, .282],
        [0, .257, .007]], 'lips');
    for (const direction of [-1, 1]) {
        const outer = (value, height, lift) => [direction * value, height, lift];
        patch([outer(.020, .565, .005), outer(.034, .596, .007), outer(.051, .586, .006),
            outer(.059, .569, .004), outer(.038, .552, .007)], 'eye');
        patch([outer(.034, .556, .010), outer(.031, .575, .011), outer(.037, .593, .010),
            outer(.043, .585, .010), outer(.045, .562, .010)], 'iris');
        patch([outer(.035, .562, .014), outer(.034, .582, .014), outer(.041, .581, .014),
            outer(.041, .563, .014)], 'pupil');
        patch([outer(.019, .624, .006), outer(.031, .652, .007), outer(.051, .651, .007),
            outer(.063, .627, .006), outer(.033, .630, .009)], 'brow');
        const ear = headPoint(.41, direction * .084, -.007);
        profile(ear, add(ear, scale(up, .052)), [[0, .006, .007, 'skinFold'],
            [.36, .014, .012, 'warmth'], [.70, .013, .013, 'skin'], [1, .006, .007, 'skin']], addFace);
    }
}

function buildBody(pose, addFace, model, detailed) {
    const tube = (a, b, width, depth, endWidth, endDepth, color) =>
        profile(a, b, [[0, width, depth, color], [1, endWidth, endDepth, color]], addFace);
    const widths = (sections, factor) => sections.map(([t, width, depth, tone]) => [t, width * factor, depth * factor, tone]);
    profile(pose.hips, pose.shoulders, widths([
        [0, .131, .090, 'hem'], [.065, .153, .102, 'hem'], [.21, .150, .105, 'jacket'],
        [.43, .138, .097, 'jacket'], [.70, .163, .112, 'jacket'], [.87, .178, .104, 'jacket'],
        [.96, .134, .083, 'jacket'], [1, .101, .070, 'shoulder'],
    ], model.torso), addFace, bodyRing);
    profile(mix(pose.hips, pose.shoulders, -.23), mix(pose.hips, pose.shoulders, .05), widths([
        [0, .089, .059, 'pants'], [.35, .137, .087, 'pants'], [.72, .148, .097, 'pants'], [1, .141, .092, 'pants'],
    ], model.torso), addFace, bodyRing);
    profile(mix(pose.shoulders, pose.chin, -.13), mix(pose.shoulders, pose.chin, .96), [
        [0, .066, .060, 'shirt'], [.25, .058, .056, 'shirt'], [.44, .047, .045, 'skin'], [1, .047, .044, 'skin'],
    ], addFace);
    buildHead(pose, model, addFace, detailed);

    if (detailed && model.hair !== 'long') {
        const chest = unit(subtract(pose.shoulders, pose.hips));
        const forward = unit(subtract(pose.face, scale(chest, dot(chest, pose.face))));
        const lateral = cross(chest, forward);
        const seam = (height, width, depth) => add(mix(pose.hips, pose.shoulders, height),
            add(scale(forward, depth * model.torso), scale(lateral, width)));
        const zip = [[.09,.103],[.23,.109],[.42,.102],[.69,.117],[.86,.111],[.99,.078]];
        for (let index = 1; index < zip.length; index++) {
            const [bottom, lowerDepth] = zip[index - 1], [top, upperDepth] = zip[index];
            addFace([seam(bottom, -.004, lowerDepth), seam(bottom, .004, lowerDepth),
                seam(top, .004, upperDepth), seam(top, -.004, upperDepth)], 'seam');
        }
    }
    for (const side of [-1, 1]) {
        const leg = pose.leg(side);
        const ankle = leg.at(-1);
        bentProfile(leg, widths([[0, .088, .094, 'pants'], [.17, .089, .093, 'pants'], [.40, .062, .063, 'pants'],
            [.52, .055, .060, 'pants'], [.72, .058, .059, 'pants'], [.90, .040, .047, 'pants'], [1, .038, .043, 'pants']], model.limbs), addFace);

        const foot = add(ankle, [0, 0, -.032]);
        const shoeScale = (pose.shoeScale ?? 1) * (model.size < .9 ? 1.04 : model.torso);
        const heel = add(foot, scale(pose.toes, -.065 * shoeScale)), toe = add(foot, scale(pose.toes, .132 * shoeScale));
        profile(add(heel, [0, 0, -.031]), add(toe, [0, 0, -.031]), widths([
            [0, .042, .010, 'sole'], [.16, .052, .014, 'sole'], [.83, .054, .012, 'sole'], [1, .035, .009, 'sole'],
        ], shoeScale), addFace);
        profile(heel, toe, widths([[0, .041, .026, 'shoe'], [.22, .052, .043, 'shoe'], [.52, .055, .034, 'shoe'],
            [.83, .051, .026, 'toe'], [1, .032, .014, 'toe']], shoeScale), addFace);

        const arm = pose.arm(side).map(([x, y, z]) => [x, y * model.torso, z]);
        const [, elbow, wrist] = arm;
        bentProfile(arm, widths([[0, .033, .039, 'jacket'], [.13, .058, .061, 'jacket'], [.32, .051, .055, 'jacket'],
            [.51, .039, .046, 'jacket'], [.70, .043, .044, 'jacket'], [.91, .035, .034, 'jacket'],
            [.96, .034, .034, 'hem'], [1, .032, .031, 'hem']], model.limbs), addFace);
        const hand = unit(subtract(wrist, elbow));
        const palm = add(wrist, scale(hand, .027));
        profile(wrist, add(wrist, scale(hand, .082)), widths([[0, .024, .024, 'skin'], [.34, .033, .024, 'skin'],
            [.72, .027, .017, 'warmth'], [1, .016, .010, 'skin']], model.limbs), addFace);
        if (detailed) {
            const thumb = add(palm, [0, -side * .018, 0]);
            const end = add(add(thumb, scale(hand, .023)), [.017, -side * .009, 0]);
            tube(thumb, end, .013 * model.limbs, .011, .008, .007, 'skin');
        }
    }
}

const color = (tone, light) => '#' + tone.map(value =>
    Math.min(255, Math.round(value * light)).toString(16).padStart(2, '0')).join('');

function gradientPrefix(person, camera) {
    const key = [person.avatar, person.id, person.x, person.y, person.heading, person.elevation, person.pose, person.seatHeight, camera.yaw, camera.tilt].join('|');
    let hash = 0;
    for (const character of key) hash = Math.imul(hash, 31) + character.charCodeAt(0) | 0;
    return `fp-avatar-light-${(hash >>> 0).toString(36)}-`;
}

export function paintAvatar(person, camera, animate, detailed = true, occlusion = null) {
    const model = figures[person.avatar] ?? figures.man;
    const { palette, size } = model;
    const floorHeight = occlusion ? (occlusion.height - (person.elevation ?? 0)) / size : 0;
    const heading = person.heading * Math.PI / 180;
    const sin = Math.sin(heading), cos = Math.cos(heading);
    const project = ([ahead, side, z]) => projectSpace([
        person.x + size * (ahead * sin + side * cos), person.y + size * (-ahead * cos + side * sin),
    ], z * size + (person.elevation ?? 0), camera);
    const yaw = camera.yaw + Math.PI / 4;
    const viewX = Math.sin(yaw) * Math.cos(camera.tilt);
    const viewY = Math.cos(yaw) * Math.cos(camera.tilt);
    const view = [viewX * sin - viewY * cos, viewX * cos + viewY * sin, Math.sin(camera.tilt)];
    const light = unit([-.42 * sin + .43 * cos, -.42 * cos - .43 * sin, .80]);
    const faces = [];
    const gradients = [];
    const prefix = detailed ? gradientPrefix(person, camera) : '';
    const projected = new WeakMap();
    const point = vertex => {
        if (!projected.has(vertex)) {
            const [x, y] = project(vertex);
            projected.set(vertex, { x, y, xy:`${x},${y}` });
        }
        return projected.get(vertex);
    };
    const intensity = normal => .79 + Math.max(0, dot(normal, light)) * .25 + .05 * Math.max(0, dot(normal, view));
    const polygon = (vertices, fill) => `<polygon points="${vertices.map(vertex => point(vertex).xy).join(' ')}" fill="${fill}" stroke="${fill}"/>`;
    const addFace = (vertices, tone, normals) => {
        const normal = unit(cross(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0])));
        if (!(dot(normal, view) > .001)) return;
        const points = vertices.map(point);
        const levels = normals?.map(intensity) ?? [intensity(normal)];
        let fill = color(palette[tone], levels.reduce((sum, value) => sum + value, 0) / levels.length);
        if (detailed && levels.length > 1) {
            const lo = Math.min(...levels), hi = Math.max(...levels);
            const a = points[levels.indexOf(lo)], b = points[levels.indexOf(hi)];
            if (hi - lo >= .029 && Math.hypot(b.x - a.x, b.y - a.y) >= .016) {
                const id = prefix + gradients.length;
                gradients.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"><stop stop-color="${color(palette[tone], lo)}"/><stop offset="1" stop-color="${color(palette[tone], hi)}"/></linearGradient>`);
                fill = `url(#${id})`;
            }
        }
        const [below, above] = occlusion ? splitVerticesAtHeight(vertices, floorHeight) : [[], vertices];
        faces.push({ depth: vertices.reduce((sum, vertex) => sum + dot(vertex, view), 0) / vertices.length,
            below: below.length ? polygon(below, fill) : '',
            above: above.length ? polygon(above, fill) : '' });
    };
    const phase = person.moving && animate ? (person.stride ?? 0) / 1.04 : null;
    const climbing = Boolean(person.feet && animate);
    const onCushion = person.pose === 'sitting' && Number.isFinite(person.seatHeight);
    const pose = climbing ? stairStance(person.phase, person.feet, size)
        : person.fallProgress !== undefined ? fallStance(animate ? person.fallProgress : Number(person.pose === 'lying'))
        : person.smokePhase ? smokeStance(person.smokePhase, person.smokeTime, animate)
        : person.sitProgress !== undefined ? blendPose(standing(null), sitting, person.sitProgress)
        : person.pose === 'standing' ? standing(phase) : onCushion ? sittingOnCushion(person.seatHeight, size)
            : person.pose === 'sitting' ? sitting : lying;
    buildBody(pose, addFace, model, detailed);
    const onFloor = person.pose === 'lying';
    const shadowCenter = onFloor ? (person.activity === 'fall' ? .17 : -.17) : onCushion ? .36 : .035;
    const shadow = bodyRing.map(([x, y]) => project([shadowCenter + x * (onFloor ? .86 : .35),
        .04 + y * (onFloor ? .29 : .23), 0]).join(',')).join(' ');
    const [floorX, floorY] = project([onCushion ? shadowCenter : 0, 0, 0]);
    const base = `<polygon class="fp-avatar-shadow" points="${shadow}"/>
        <ellipse class="fp-person-base" cx="${floorX}" cy="${floorY}" rx="${.35 * size}" ry="${.15 * size}"/>`;
    faces.sort((a, b) => a.depth - b.depth);
    const lowerMesh = faces.map(face => face.below).join('');
    const upperMesh = faces.map(face => face.above).join('');
    const belowFloor = occlusion && floorHeight > 0;
    const plumbob = person.plumbob ? paintPlumbob(project([pose.crown[0], 0, pose.crown[2] + .36 / size]), person.plumbob) : '';
    return `<g class="fp-person-space" data-avatar="${person.avatar ?? 'man'}" data-pose="${person.pose}" data-activity="${person.activity ?? ''}" ${person.active ? 'data-active' : ''} ${climbing ? 'data-stair-gait' : ''} aria-hidden="true">
        ${gradients.length ? `<defs>${gradients.join('')}</defs>` : ''}
        ${!belowFloor ? base : ''}
        ${belowFloor || lowerMesh ? `<g mask="url(#${occlusion.id})">${belowFloor ? base : ''}<g class="fp-avatar-mesh">${lowerMesh}</g></g>` : ''}
        <g class="fp-avatar-mesh">${upperMesh}</g>${plumbob}
    </g>`;
}

// The diamond above a person tells at a glance whether a radar sees them:
// 'clear' (seen), 'shadow' (only behind furniture) or 'none' (not seen).
function paintPlumbob([x, y], status) {
    const half = .085, tip = .15;
    const top = `${x},${y - tip}`, bottom = `${x},${y + tip}`;
    return `<g class="fp-plumbob" data-status="${status}"><g class="fp-plumbob-gem">
        <polygon class="fp-plumbob-lit" points="${top} ${bottom} ${x - half},${y}"/>
        <polygon class="fp-plumbob-shade" points="${top} ${x + half},${y} ${bottom}"/>
        <path class="fp-plumbob-edge" d="M${x - half} ${y}H${x + half}"/></g></g>`;
}
