// The 3D models of the wall sensors, and the drawings of the sensor dialog
// that show where one looks.
import assert from 'node:assert/strict';
import test from 'node:test';

import { aimSideView, aimTopView, directionTo, heightTo, motionReach, onDevice, reachText, tiltText, tiltTo, turnText, turnTo, wallAhead } from '../src/js/floor-planner-aim.mjs';
import { deviceHousing, devicePose, deviceScale, paintDevice } from '../src/js/floor-planner-device-mesh.mjs';
import { paintPlan } from '../src/js/floor-planner-drawing.mjs';
import { blankPlan, hasMotionSensor, sensorPan } from '../src/js/floor-planner-model.mjs';
import { personSignals } from '../src/js/floor-planner-person.mjs';
import { motionField, radarFields } from '../src/js/floor-planner-radar.mjs';
import { defaultSpaceCamera, paintSpace, projectSpace } from '../src/js/floor-planner-space.mjs';

const room = { id: 'room', name: 'Room', x: 0, y: 0, width: 5, depth: 4, height: 2.6 };
const cabinet = { id: 'cabinet', kind: 'cabinet', name: 'Cabinet', x: 4.2, y: .25, angle: 0, width: 1.25, depth: .42, height: 1.05, base: 0, material: 'wood' };
const bracket = { id: 'bracket', model: 'ultimatesensor-v2', radar: 'ld2450', x: .3, y: 0, angle: 135, installation: 'wall-bracket', mountHeight: 2.4, pan: -45, tilt: 30 };
const standing = { id: 'standing', model: 'ultimatesensor-mini-v2', radar: 'ld2450', x: 4.2, y: .3, angle: 180, mountHeight: 1.09 };
const project = (point, height) => projectSpace(point, height, defaultSpaceCamera);
// The default camera looks down on the room from where x and y are large.
const fromFront = [1, 1, 1], fromBehind = [-1, -1, 1];
const paint = (item, height, more = {}) => paintDevice(item, height, { project, towardCamera: fromFront, ...more });

test('the housings have the real proportions of the devices', () => {
    assert.deepEqual([deviceHousing('ultimatesensor-v2').height, deviceHousing('ultimatesensor-v2').width, deviceHousing('ultimatesensor-v2').depth], [.107, .056, .041]);
    assert.deepEqual([deviceHousing('ultimatesensor-mini-v2').height, deviceHousing('ultimatesensor-mini-v2').depth], [.087, .038]);
    assert.equal(deviceHousing('ceilsense-v2'), null);
    assert.equal(paint({ id: 'c', model: 'ceilsense-v2', x: 1, y: 1, angle: 0 }, 2.6), '');
});

test('a sensor on its bracket hangs in front of the wall and looks where it is aimed', () => {
    const pose = devicePose(bracket, 2.4);
    assert.equal(pose.mounting, 'wall-bracket');
    // Straight out of this wall is down the plan; the sensor is turned 45 degrees from it.
    assert.ok(Math.abs(pose.bracket.out.x) < 1e-9 && Math.abs(pose.bracket.out.y - 1) < 1e-9);
    assert.ok(pose.bracket.joint[1] > 0 && pose.centre[1] > pose.bracket.joint[1]);
    // Tilted 30 degrees down it looks down and its centre hangs below the joint.
    assert.ok(Math.abs(pose.frame.ahead[2] + .5) < 1e-9);
    assert.ok(pose.centre[2] < 2.4);
    assert.ok(Math.abs(Math.hypot(...pose.frame.ahead) - 1) < 1e-9);
    const markup = paint(bracket, 2.4);
    assert.match(markup, /class="fp-device fp-space-puck wall" data-device="ultimatesensor-v2" data-mounting="wall-bracket"/);
    // Every shape carries its own colours, so the style of the marker around it changes nothing.
    for (const shape of markup.match(/<(?:polygon|path) [^>]*>/g)) assert.match(shape, /fill="[^"]+"[^>]* stroke="[^"]+"/, shape);
    assert.match(markup, /fp-device-bracket/);
    assert.doesNotMatch(markup, /fp-device-stand/);
    assert.doesNotMatch(markup, /NaN|<circle|<ellipse|<line/);
});

test('a sensor that stands free rests on the furniture below it, or on a stand of its own', () => {
    const onCabinet = devicePose(standing, 1.09, [cabinet]);
    assert.equal(onCabinet.stand, null);
    // Its foot is where the real device stands; the larger model rises from there.
    const foot = 1.09 - .087 / 2;
    assert.ok(Math.abs(onCabinet.centre[2] - (foot + .087 * deviceScale / 2)) < 1e-9);
    assert.ok(Math.abs(foot - 1.05) < .03);
    const alone = devicePose(standing, 1.09, []);
    assert.deepEqual([alone.stand.low, Number(alone.stand.high.toFixed(4))], [0, Number(foot.toFixed(4))]);
    // A cabinet that is taller than where the sensor stands is not what it stands on.
    assert.equal(devicePose({ ...standing, mountHeight: .6 }, .6, [cabinet]).stand.low, 0);
    assert.match(paint(standing, 1.09), /fp-device-stand/);
    assert.doesNotMatch(paint(standing, 1.09, { furniture: [cabinet] }), /fp-device-stand|fp-device-bracket/);
});

test('the front of a device is only drawn when it faces the camera', () => {
    const shapes = markup => markup.match(/<polygon/g).length;
    const towards = paint({ ...standing, angle: 135 }, 1.09, { furniture: [cabinet] });
    const away = paintDevice({ ...standing, angle: 135 }, 1.09, { project, towardCamera: fromBehind, furniture: [cabinet] });
    assert.match(towards, /fp-device-light/);
    assert.doesNotMatch(away, /fp-device-light/);
    assert.ok(shapes(towards) > shapes(away));
    // While the camera moves the small holes of the grille are left out.
    assert.ok(shapes(paint({ ...standing, angle: 135 }, 1.09, { furniture: [cabinet], fine: false })) < shapes(towards));
    // WallSense lies flat on its wall and has no bracket or stand.
    const wallsense = paint({ id: 'w', model: 'wallsense', radar: 'ld2450', x: 0, y: 2, angle: 90, installation: 'wall-recessed' }, 1.2);
    assert.match(wallsense, /data-mounting="wall-recessed"/);
    assert.doesNotMatch(wallsense, /fp-device-stand|fp-device-bracket|fp-device-light/);
});

test('the 3D scene shows wall sensors as devices and keeps the puck for the ceiling', () => {
    const plan = blankPlan('Models');
    plan.rooms = [room];
    plan.furniture = [cabinet];
    plan.sensors = [bracket, standing, { id: 'ceiling', model: 'ceilsense-v2', radar: 'ld2412', x: 2.5, y: 2, angle: 0 }];
    const { markup } = paintSpace(plan, defaultSpaceCamera);
    assert.equal(markup.match(/class="fp-device fp-space-puck wall"/g).length, 2);
    assert.equal(markup.match(/fp-space-puck face/g).length, 1);
    assert.doesNotMatch(markup, /<rect class="fp-space-puck wall"/);
    // A sensor on furniture has no line to the floor; one on a wall keeps it.
    const marker = id => markup.slice(markup.indexOf(`data-item="${id}"`)).split('</g>\n')[0];
    assert.match(markup.slice(markup.indexOf('data-item="bracket"'), markup.indexOf('data-item="standing"')), /<line /);
    assert.doesNotMatch(markup.slice(markup.indexOf('data-item="standing"'), markup.indexOf('data-item="ceiling"')), /<line /);
    assert.ok(marker('bracket'));

    // A page that shows a recessed sensor on its own can ask for the wall behind it.
    plan.sensors = [{ id: 'recessed', model: 'wallsense', radar: 'ld2450', x: 5, y: 2, angle: 270, installation: 'wall-recessed', mountHeight: 1.2 }];
    assert.doesNotMatch(paintSpace(plan, defaultSpaceCamera).markup, /fp-wall-mount-support/);
    const shown = paintSpace(plan, defaultSpaceCamera, null, { showWallMount: true }).markup;
    assert.match(shown, /class="fp-wall-mount-support"/);
    assert.ok(shown.indexOf('fp-wall-mount-support') < shown.indexOf('fp-device'));
    assert.doesNotMatch(shown.slice(shown.indexOf('data-item="recessed"')), /<line /);
});

test('a pointer in the drawings turns, tilts and lifts the sensor in whole steps', () => {
    const onWall = { ...bracket, pan: 0, angle: 180 };
    // Straight down the plan is straight out of this wall.
    assert.equal(directionTo(onWall, { x: .3, y: 2 }), 180);
    assert.equal(directionTo(onWall, { x: 2.3, y: 2 }), 135);
    assert.equal(directionTo(onWall, { x: .3, y: -1 }), 0);
    assert.equal(turnTo(onWall, { x: 2.3, y: 2 }, sensorPan), -45);
    assert.equal(turnTo(onWall, { x: -1.7, y: 2 }, sensorPan), 45);
    // Not further than the bracket turns, also for a point behind the wall.
    assert.equal(turnTo(onWall, { x: 4, y: .05 }, sensorPan), -85);
    assert.equal(turnTo(onWall, { x: 2, y: -2 }, sensorPan), -85);
    // A sensor that is already turned is measured from the wall, not from where it looks.
    assert.equal(turnTo(bracket, { x: .3, y: 2 }, sensorPan), 0);

    assert.equal(tiltTo(2.4, { ahead: 2, height: 2.4 }), 0);
    assert.equal(tiltTo(2.4, { ahead: 2, height: 1.25 }), 30);
    assert.equal(tiltTo(1, { ahead: 2, height: 2 }), -25);
    assert.equal(tiltTo(2.4, { ahead: .1, height: 0 }), 75);
    assert.equal(tiltTo(1, { ahead: .1, height: 2.6 }), -30);
    assert.equal(heightTo(1.83, 2.6), 1.85);
    assert.equal(heightTo(4, 2.6), 2.5);
    assert.equal(heightTo(-1, 2.6), .15);
    assert.equal(onDevice(2.4, { ahead: .1, height: 2.3 }), true);
    assert.equal(onDevice(2.4, { ahead: 1.3, height: 1.7 }), false);
});

test('the drawings show the room, the beam and whether a standing person is seen', () => {
    const fields = radarFields(room, bracket);
    const top = aimTopView({ room, item: bracket, fields });
    assert.match(top.markup, /class="fp-aim-room" points="0,0 5,0 5,4 0,4"/);
    assert.equal(top.markup.match(/class="fp-aim-field"/g).length, 2);
    assert.match(top.markup, /translate\(0\.3 0\) rotate\(135\)/);
    const [left, , width] = top.viewBox.split(' ').map(Number);
    assert.ok(left < 0 && left + width > 5);
    // The handle lies where the sensor looks: down the plan and to the right.
    assert.ok(top.handle.x > bracket.x + .5 && top.handle.y > .5);

    // Diagonally through a room of 5 by 4 m the far wall is 5.66 m away.
    assert.ok(Math.abs(wallAhead(room, bracket) - Math.hypot(4, 4)) < .01);
    assert.equal(wallAhead(null, bracket), Infinity);
    const side = aimSideView({ room, item: bracket, fields, onWall: true });
    assert.ok(Math.abs(side.reach.from - .49) < .03 && Math.abs(side.reach.to - 4.68) < .03);
    assert.equal(side.seen, true);
    assert.match(side.markup, /class="fp-aim-person" data-seen/);
    assert.match(side.markup, /fp-aim-wall/);
    assert.match(side.markup, /rotate\(30\)/);
    assert.doesNotMatch(side.markup + top.markup, /NaN|Infinity/);
    // Hung high and level it looks over someone close by; standing free it has a cabinet under it.
    const level = { ...bracket, tilt: 0 };
    assert.ok(aimSideView({ room, item: level, fields: radarFields(room, level), onWall: true }).reach.from > 1.4);
    const up = { ...bracket, mountHeight: 2.5, tilt: -30 };
    const blind = aimSideView({ room, item: up, fields: radarFields(room, up), onWall: true });
    assert.equal(blind.seen, false);
    assert.doesNotMatch(blind.markup, /class="fp-aim-person" data-seen/);
    const free = aimSideView({ room, item: standing, fields: radarFields(room, standing), onWall: false });
    assert.match(free.markup, /fp-aim-cabinet/);
    assert.doesNotMatch(free.markup, /fp-aim-arm/);
    // Without a radar there is no beam, but the sensor can still be aimed.
    const bare = aimSideView({ room, item: bracket, fields: [], onWall: true });
    assert.equal(bare.reach, null);
    assert.doesNotMatch(bare.markup, /fp-aim-field|NaN/);
    // A short room ends at its wall, and so does what the sensor sees.
    const short = aimSideView({ room: { ...room, depth: 3 }, item: { ...bracket, pan: 0, angle: 180 }, fields, onWall: true });
    assert.ok(Math.abs(short.reach.to - 3) < 1e-6);
});

test('the words beside the sliders say which way, not a signed number', () => {
    const copy = { aim_left: ':value° left', aim_right: ':value° right', aim_straight: 'Straight', aim_down: ':value° down', aim_up: ':value° up', aim_level: 'Level',
        aim_reach: 'From :from to :to m', aim_reach_none: 'Nobody' };
    assert.equal(turnText(copy, -45, true), '45° left');
    assert.equal(turnText(copy, 20, true), '20° right');
    assert.equal(turnText(copy, 0, true), 'Straight');
    assert.equal(turnText(copy, 370, false), '10°');
    assert.equal(tiltText(copy, 30), '30° down');
    assert.equal(tiltText(copy, -10), '10° up');
    assert.equal(tiltText(copy, 0), 'Level');
    assert.equal(reachText(copy, { from: .5, to: 4.7 }), 'From 0.5 to 4.7 m');
    assert.equal(reachText(copy, null), 'Nobody');
});

test('only the UltimateSensor V2 has a PIR, with the field of its Panasonic lens', () => {
    assert.equal(hasMotionSensor('ultimatesensor-v2'), true);
    for (const model of ['ultimatesensor-mini-v2', 'wallsense', 'ceilsense-v2', 'ultimatesensor']) assert.equal(hasMotionSensor(model), false, model);
    assert.equal(motionField(standing), null);
    const field = motionField(bracket);
    // 102 degrees wide and 92 high; its 12 m is planned with the same margin as the radars.
    assert.deepEqual([field.half, field.pitch, Number(field.range.toFixed(2))], [51, 46, 9.6]);
    assert.deepEqual([field.radar, field.mode, field.mount, field.tilt], ['pir', 'motion', 2.4, 30]);
    // It is not one of the radar fields that decide where a person is covered.
    assert.deepEqual(radarFields(room, bracket).map(radar => radar.radar), ['ld2412', 'ld2450']);
});

test('the PIR sees someone who moves, not someone who stands still or is behind a wall', () => {
    const plan = blankPlan('PIR');
    // A long room, and one beside it behind a wall.
    plan.rooms = [{ ...room, width: 12 }, { ...room, id: 'next', name: 'Next', y: 4 }];
    const sensor = { id: 'pir', model: 'ultimatesensor-v2', radar: 'ld2450', x: 0, y: 2, angle: 90, mountHeight: 1.4 };
    plan.sensors = [sensor];
    const reading = person => personSignals(plan, { pose: 'standing', ...person })[0];
    const walking = reading({ x: 3, y: 2, moving: true });
    assert.deepEqual([walking.motion.seen, walking.motion.still, walking.seen], [true, false, true]);
    assert.deepEqual(walking.signals.map(signal => signal.radar), ['ld2412', 'ld2450']);
    const standingStill = reading({ x: 3, y: 2, moving: false });
    assert.deepEqual([standingStill.motion.seen, standingStill.motion.still, standingStill.seen], [false, true, true]);
    // Further than the radars reach, the PIR still notices someone walking, but that alone is not coverage.
    const far = reading({ x: 9, y: 2, moving: true });
    assert.deepEqual([far.motion.seen, far.seen], [true, false]);
    assert.deepEqual([reading({ x: 9, y: 2, moving: false }).motion.still, reading({ x: 11.5, y: 2, moving: true }).motion.seen], [true, false]);
    // Not through the wall to the next room, and not beside its field.
    assert.deepEqual([reading({ x: 3, y: 5.5, moving: true }).motion.seen, reading({ x: .3, y: 3.8, moving: true }).motion.seen], [false, false]);
    // A device without a PIR has no such reading.
    plan.sensors = [{ ...sensor, model: 'ultimatesensor-mini-v2' }];
    assert.equal(reading({ x: 3, y: 2, moving: true }).motion, null);
});

test('the PIR has a line of its own on the map and in the drawings of the dialog', () => {
    const plan = blankPlan('PIR');
    plan.rooms = [room];
    plan.sensors = [bracket, standing];
    const number = new Intl.NumberFormat('en');
    assert.doesNotMatch(paintPlan(plan, true, null, number), /fp-motion-range/);
    assert.equal(paintPlan(plan, true, null, number, null, { motion: true }).match(/class="fp-motion-range"/g).length, 1);
    assert.doesNotMatch(paintPlan(plan, false, null, number, null, { motion: true }), /fp-motion-range/);

    const fields = [...radarFields(room, bracket), motionField(bracket)];
    const top = aimTopView({ room, item: bracket, fields });
    assert.equal(top.markup.match(/data-radar="pir"/g).length, 1);
    const side = aimSideView({ room, item: bracket, fields, onWall: true });
    assert.equal(side.markup.match(/data-radar="pir"/g).length, 1);
    // What it sees of a standing person is still what the tracking radar sees.
    assert.ok(Math.abs(side.reach.to - 4.68) < .03);
    // The PIR looks further: to the far wall of this room, 5.66 m away.
    assert.ok(Math.abs(motionReach(room, bracket, motionField(bracket)) - Math.hypot(4, 4)) < .01);
    assert.equal(motionReach(room, standing, motionField(standing)), null);
    // The large lens marks the front of the device that has it.
    assert.match(top.markup + side.markup, /fp-aim-device-lens/);
    const mini = [aimTopView({ room, item: standing, fields: radarFields(room, standing) }), aimSideView({ room, item: standing, fields: radarFields(room, standing), onWall: false })];
    assert.doesNotMatch(mini.map(view => view.markup).join(''), /fp-aim-device-lens|data-radar="pir"/);
});
