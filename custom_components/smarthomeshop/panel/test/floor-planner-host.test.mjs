import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The readable builds of floor-planner/src (floor-planner/build.mjs).
const host = fs.readFileSync(new URL('../../www/floor-planner/host.js', import.meta.url), 'utf8');
const editor = fs.readFileSync(new URL('../../www/floor-planner/editor.js', import.meta.url), 'utf8');

test('Floorplan live view refreshes every second and keeps approximate occupancy visible', () => {
  assert.match(host, /setInterval\(\(\) => \{[\s\S]*?this\.#refreshRuntime\(\);[\s\S]*?\}, (?:1000|1e3)\)/);
  assert.match(host, /this\.#tracks = liveTracks\(this\.#tracks, fusion\.people, houses, now\)/);
  assert.match(host, /function liveTracks\(previous, people, houses, now\) \{\s*const tracks = (?:\/\* @__PURE__ \*\/ )?new Map\(\);\s*for \(const person of people\) \{/);
  assert.match(host, /Exact people count unknown/);
  assert.doesNotMatch(host, /liveTracks\([^)]*\.filter\(/);
  assert.doesNotMatch(host, /for \(const person of people\.filter\(\(person\) => !person\.approximate\)\)/);
});

test('Floorplan exclusion accounting requires exact equality', () => {
  assert.match(host, /suppressed === count/);
  assert.match(host, /suppressed === explicitOn/);
  assert.doesNotMatch(host, /suppressed >= count/);
  assert.doesNotMatch(host, /suppressed >= explicitOn/);
});

test('Floorplan host has native English, Dutch, German, French and Spanish copy', () => {
  for (const language of ['nl', 'en', 'de', 'fr', 'es']) {
    assert.match(host, new RegExp(`\\b${language}: \\[|\\b${language}: \\{`));
  }
  assert.match(host, /Réglages du radar/);
  assert.match(host, /Radareinstellungen/);
  assert.match(host, /Ajustes del radar/);
});

test('Floorplan IDs work on non-secure LAN origins without crypto.randomUUID', () => {
  assert.match(editor, /cryptoApi\?\.randomUUID/);
  assert.match(editor, /cryptoApi\?\.getRandomValues/);
  assert.doesNotMatch(editor, /globalThis\.crypto\.randomUUID\(\)/);
});

test('Floorplan preserves valid legacy rooms and reconnects without duplicating its iframe', () => {
  assert.match(host, /if \(!view\.floor\) \{/);
  assert.match(host, /skippedRooms\.push\(view\.room\?\.name/);
  assert.match(host, /if \(!this\.shadowRoot\)/);
  assert.match(host, /if \(this\.#floorPlan \|\| this\.#loading\) return;/);
  assert.match(host, /get project\(\)/);
});

test('Floorplan mirror protection metadata round-trips through host and editor', () => {
  assert.match(host, /protectionEnabled/);
  assert.match(host, /reflectionDepthM/);
  assert.match(host, /reflectionDepthMm/);
  assert.match(editor, /protectionEnabled/);
  assert.match(editor, /reflectionDepthM/);
  assert.match(editor, /mirrorReflectionCopy/);
});

test('Fused positions never claim an exact multi-radar people count', () => {
  assert.match(host, /trackingEvidenceComplete: evidenceComplete/);
  assert.match(host, /if \(!fusedRoomIds\.has\(room\.roomId\)\) continue;[\s\S]*?room\.peopleCountKnown = false/);
  assert.match(host, /withFusedRooms\(presence\.rooms, fusion\.people, fusion\.fusedRoomIds\)/);
});

test('Floorplan save never renders an arbitrary backend or Dutch-only error', () => {
  assert.match(host, /error instanceof FloorPlanValidationError\d* \? floorPlanValidationMessage\(error, this\.#hass\?\.language\)/);
  assert.match(host, /: this\.#text\.saveFailed\)/);
  assert.doesNotMatch(host, /error\?\.message \?\? this\.#text\.saveFailed/);
  assert.doesNotMatch(host, /#showError\([^;]*\.message/);
});

test('live Floorplan overlays authoritative runtime tracking before fusion', () => {
  assert.match(host, /const authoritative = runtimeSnapshotIsAuthoritative\(this\.#runtime, this\.#runtimeReceivedAt, now\)/);
  assert.match(host, /applyAuthoritativeRuntimeTracking\(this\.#floorPlan\.rooms, runtimeRooms, authoritative\)[\s\S]*?this\.#fusion\.apply\(/);
  assert.match(host, /const request = \+\+this\.#runtimeRequest/);
  assert.match(host, /if \(request !== this\.#runtimeRequest\) return/);
  assert.match(host, /if \(this\.#runtimePending\)/);
  assert.match(host, /this\.#runtimeReceivedAt = 0/);
  assert.match(host, /runtimeSnapshotIsAuthoritative/);
  assert.match(host, /var runtimeTimeout = 2500;/);
  assert.match(host, /Date\.now\(\) - requestedAt > runtimeTimeout/);
  assert.match(host, /disconnectedCallback\(\) \{[\s\S]*?this\.#runtimeRequest \+= 1;/);
});

test('Floorplan rejects malformed calibration and conflicting legacy runtime holds', () => {
  assert.match(host, /Array\.isArray\(calibration\.corners\)/);
  assert.match(host, /room\.house\.visible === false \|\| conflicting\.has\(room\.id\) \|\| presence\?\.occupied !== true/);
});

test('Floorplan exact counts require per-room runtime authority and live configurable-radar mode', () => {
  assert.match(host, /peopleCountKnown: runtimeKnown && !conflicting\.has\(room\.id\)/);
  assert.match(host, /const modeEntity = profile\.reported_installation_mode_entity_id/);
  assert.match(host, /hardwareMode !== profile\.required_installation_mode/);
  assert.match(host, /const runtimeKnown = runtimeAvailable && typeof presence\?\.occupied === "boolean"/);
  assert.match(host, /return notFromFuture\(value, now\) \? value : void 0/);
});

test('geometry imports never broaden a source-owned exclusion zone', () => {
  // A zone linked to a sensor is left out of a geometry import and flagged for review.
  assert.match(editor, /if \(zone\.sensorId \|\| zone\.sensor_id\) \{\s*review = true;\s*continue;\s*\}/);
});

test('Floorplan preserves legacy zone ownership and rejects missing owners', () => {
  assert.match(host, /zone\.sensorId \|\| zone\.sensor_id/);
  assert.match(host, /zoneOwnerIsAvailable/);
  assert.match(host, /FloorPlanValidationError\d*\("zone_owner_outside_room"/);
  assert.match(host, /\{ sensor_id: _legacyOwner, \.\.\.zone \} = original \?\? \{\}/);
});

test('Floorplan loading errors never expose raw backend details', () => {
  assert.match(host, /this\.#showError\(this\.#text\.openFailed\)/);
  assert.doesNotMatch(host, /this\.#showError\(`[^`]*\$\{[^}]*message/);
});
