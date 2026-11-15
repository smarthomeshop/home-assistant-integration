import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PANEL_TRANSLATIONS,
  SUPPORTED_PANEL_LANGUAGES,
  panelLanguage,
  panelText,
} from '../src/utils/panel-translations.ts';

const REQUIRED = ['en', 'nl', 'de', 'fr', 'es'];

test('follows the Home Assistant language including region variants', () => {
  assert.deepEqual([...SUPPORTED_PANEL_LANGUAGES], REQUIRED);
  assert.equal(panelLanguage({ language: 'nl-NL' }), 'nl');
  assert.equal(panelLanguage({ language: 'de_DE' }), 'de');
  assert.equal(panelLanguage({ locale: { language: 'fr-FR' } }), 'fr');
  assert.equal(panelLanguage({ language: 'it-IT' }), 'en');
});

test('contains complete catalogs for every required non-English language', () => {
  const sourceKeys = Object.keys(PANEL_TRANSLATIONS.nl).sort();
  assert.ok(sourceKeys.length >= 970);
  for (const language of REQUIRED.slice(1)) {
    assert.deepEqual(Object.keys(PANEL_TRANSLATIONS[language]).sort(), sourceKeys);
    assert.equal(Object.values(PANEL_TRANSLATIONS[language]).some(value => value.includes('ZXQ')), false);
  }
});

test('translates primary navigation and the device visibility flow', () => {
  assert.equal(panelText({ language: 'nl' }, 'Devices'), 'Apparaten');
  assert.equal(panelText({ language: 'de' }, 'Floorplan Designer'), 'Grundriss-Designer');
  assert.equal(panelText({ language: 'fr' }, 'Hidden devices'), 'Appareils masqués');
  assert.equal(panelText({ language: 'es' }, 'Enable Smart Energy'), 'Activar Smart Energy');
});

test('translates the searchable device overview in every supported language', () => {
  const keys = [
    'Device filters',
    'Search devices',
    'Refresh devices',
    'Filter devices by status',
    'Showing {shown} of {total} devices',
    'No devices match these filters',
    'Clear search and filters',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) {
      assert.notEqual(panelText({ language }, key, { shown: 2, total: 5 }), key);
    }
  }
});

test('translates mirror reflection protection in every supported language', () => {
  for (const language of REQUIRED.slice(1)) {
    assert.notEqual(panelText({ language }, 'Reflection protection'), 'Reflection protection');
    assert.notEqual(panelText({ language }, 'Protection depth (cm)'), 'Protection depth (cm)');
    assert.match(
      panelText({ language }, '{used}/2 radar exclusion slots used.', { used: 2 }),
      /2\/2/,
    );
  }
});

test('translates the polished Room Designer workspace in every supported language', () => {
  const keys = [
    'Rooms',
    'Layout',
    'Room summary',
    'Area',
    'Corners',
    'Fit room to screen',
    'Drag to rotate • Scroll to zoom',
    'Import room',
    'Export selected room',
    'Import as new room',
    'Room backup contents',
    'Import room backup or LiDAR scan',
    'Apple RoomPlan (LiDAR scan)',
    'Room from scan',
    'RoomPlan measurements are converted from metres to millimetres. Check the walls, doors, windows and furniture after import because LiDAR scans can contain small gaps.',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key), key);
  }
});

test('translates multi-sensor 3D alignment and Z safety in every supported language', () => {
  const keys = [
    'Three-position alignment test',
    'Capture position {count}/3',
    'Alignment verified. Room-wide handover is ready.',
    'Count unknown · {count} source tracks',
    '3D target point',
    'Raw Z only (no height claim)',
    'I verified this direction with a real movement test',
    '{height} m target point',
    'Projection',
    'Floor X/Y',
    'Forward X/Y',
    'Advanced',
    'Legacy detection is active until Home Assistant reloads the integration.',
    'This saved radar is not currently available in Home Assistant. The room stays unchanged; reconnect it or choose another positioning radar.',
    '{current} is active; {required} is required for {mounting} mounting.',
    'Switch to {mode}',
    'Duplicate distance changed. Repeat the neighbouring overlap alignment before fusion can resume.',
    'Edit {name}',
    'Detection zones ({count}/{maximum})',
    'Exclusion zones ({count}/{maximum})',
    'Interference zones ({count}/{maximum})',
    'Entry lines ({count}/{maximum})',
    'Smoothing: {percent}%',
    'This room changed or was removed in another browser. Reload the Floorplan Designer before saving again.',
    'The safety calibration could not be revoked yet. Fusion stays off here and retrying continues automatically.',
    'Safety calibration was revoked, but this room changed elsewhere. Reload the Floorplan Designer before saving other changes.',
    'This room was removed elsewhere. Reload the Floorplan Designer to refresh the room list.',
    'Presence detected · sensor data incomplete',
    'Safety revocation is pending. Fusion and alignment controls stay disabled.',
    'Fusion was disabled because this calibration was revoked elsewhere. Reload before saving other room changes.',
    'An administrator must open the Floorplan Designer to finish this safety revocation. Fusion stays disabled on this browser.',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key, {
      count: 2, maximum: 4, height: '1.20', name: 'Zone A', percent: 35,
    }), key);
  }
});

test('translates the whole-home presence experience in every supported language', () => {
  const keys = [
    'Whole-home presence',
    'Arrange rooms',
    'Exact radar position',
    'Room presence only',
    'Home setup',
    'Auto-arrange rooms',
    'Save home layout',
    'tracked now',
    'Data unavailable',
    'Partial sensor outage',
    'Presence · incomplete sensor data',
    '{offline} of {total} sensors offline',
    'Select a room and use the arrow keys or move buttons to position it. Hold Shift with an arrow key for fine movement.',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key), key);
  }
});

test('translates the device live radar view in every supported language', () => {
  const keys = [
    'Live radar view',
    'Position and movement trail',
    'Live target positions from this device. Coordinates use the same verified radar profile as the Floorplan Designer.',
    'Installation data is incomplete or the radar is in the wrong mounting mode. Positions are diagnostic until height, angle and mounting mode are confirmed.',
    'Movement trail',
    'Keep movement trail',
    'Clear trail',
    'Radar range',
    'No live target positions right now.',
    '{count} live positions',
    'Ceiling mounted',
    'Wall mounted',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) {
      assert.notEqual(panelText({ language }, key, { count: 2 }), key);
    }
  }
});

test('translates Smart Energy safety, simulation and learning in every supported language', () => {
  const keys = [
    'Live grid and fuse guard',
    'Capacity tariff & peak shaving',
    'Safe self-learning',
    'Execution mode',
    'Advice only',
    'Simulation / shadow mode',
    'Automatic execution',
    'Decision journal',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key), key);
  }
});

test('translates Smart EV planning and charger safety in every supported language', () => {
  const keys = [
    'Smart EV',
    'Enable Smart EV',
    'Ready-by schedule',
    'Charger control and verification',
    'Solar, price and grid safety',
    'Live P1 and fuse guard',
    'Prefer one continuous session',
    'Allow home-battery support',
    'Charging now in a selected low-cost energy period',
    'The charger did not confirm the requested state',
    'Automatic grid guarding also requires a live charging-power entity so the EV is not counted twice.',
    'The vehicle charging-power measurement is unavailable or stale',
    'The previous charger route has not confirmed its stop yet',
    'The charger became active while the command was being sent',
    'The owned charger could not confirm a safety stop after the failed adjustment',
    'Another safely assigned vehicle is using this shared charger',
    'charger control cannot safely use the available headroom',
    'Phases used while charging',
    'Select the number of phases the connected vehicle actually uses while charging, not only the wallbox capability; a wrong value can make automatic grid guarding unsafe.',
    'The charger already matched this request; Smart EV did not claim ownership',
    'The charger did not confirm the safety stop',
    'The charger is inactive and no command is needed',
    'Smart EV is waiting after an unconfirmed charger command; it can try this command again after five minutes',
    'Waiting after unconfirmed command',
    'Automatic select control needs different charge and pause options',
    'Automatic select control needs charge and pause options exposed by the entity',
    'Check vehicle values and charger control settings.',
    'Expected charge power must be greater than 0 kW.',
    'The charger phase setting exceeds the currently confirmed P1 phase coverage',
    'Automatic battery power data is unavailable or stale',
    'Measured charging power exceeds the configured charger power',
    'Home-battery discharge is active while battery support is disabled',
    'Charging is waiting after a recent safety stop',
    'The charger was stopped outside Smart EV; automatic restart is paused',
    'The charger confirmed lower setpoints, but measured power remained above the safe limit',
    'No charging period is available without home-battery support',
    'The configured earliest start leaves no usable charging window',
    'The configured earliest start leaves too little time to reach the target',
    'This charger session was already active outside Smart EV; its setpoint and stop control remain untouched',
    'This charger became active outside Smart EV while the command was being prepared; it remains untouched',
    'The charger control became unavailable; Smart EV used its stored stop route',
    'The unavailable charger did not confirm its safety stop',
    'The manual stop was detected but ownership could not be persisted',
    'The charger became externally active before the safety retry and remains untouched',
    'Smart EV could not complete this charger update:',
    'Automatic charging is paused until the charger settings change',
    'The live safety guard blocked charging',
    'Live safety conditions changed during the command',
    'Smart EV planning failed safely:',
    'The unconfirmed charger start was stopped and will not be retried immediately',
    'The unconfirmed charger start could not be stopped safely',
    'Smart EV sent the charger command but could not save the stop responsibility',
    'Vehicles sharing one charger control must use the same stop route',
    'choose a separate stop switch because the current control cannot accept the configured off current',
    'A delayed charger start was stopped during the safety watch',
    'A delayed charger start could not be stopped safely',
    'Smart EV is watching for a delayed charger start after the confirmed rollback',
    'Smart EV confirmed the charger stop but could not save the released stop responsibility',
    'Smart EV could not release the expired late-start watch',
    'Commands use normal Home Assistant services. Smart EV waits for entity-state confirmation. A new start that cannot be confirmed is stopped and waits five minutes; adjustments to an already owned session can be retried once. A current controller that cannot accept 0 A requires a separate stop switch before Automatic mode can start it.',
    'Commands use normal Home Assistant services. Smart EV waits for entity-state confirmation. A new start that cannot be confirmed is stopped and waits five minutes; a failed adjustment to an owned session is stopped safely before one fresh start attempt after another live safety check. A current controller that cannot accept 0 A requires a separate stop switch before Automatic mode can start it.',
    'Automatic control waits for fresh P1 data, respects main-fuse headroom and verifies charger feedback. An unconfirmed new start is stopped instead of retried immediately. Missing or stale safety signals block charging instead of guessing.',
    'cooldown',
    'manual_override',
    'battery_support_disabled',
    '{count} vehicles planned with your home energy',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key), key);
  }
});

test('translates Smart Loads planning and safety in every supported language', () => {
  const keys = [
    'Smart Loads',
    'Enable Smart Loads',
    'Run household devices at the best moment without overloading the grid.',
    'Device control and feedback',
    'Protect main fuse',
    'Grid protection is always active. Automatic starts require fresh P1 grid and phase-headroom data.',
    'Safe ownership',
    'Completed runs',
    'Automatic start needs running or power feedback',
    'P1 grid or phase headroom is unavailable or stale',
    'The device did not confirm its stop',
    'Feedback was lost; the non-interruptible cycle will not be stopped',
    'Run now completed; choose a new mode to run again',
    'Grid protection paused this load for five minutes',
    'Shadow plan is ready but does not control the device',
    'Confirm off and release',
    'Only continue after you have physically confirmed that {name} is switched off. Smart Loads will release its saved stop responsibility and will not send a stop command. Release control?',
    'Polling tolerance forced an immediate start to meet the deadline',
    'Low power is being verified before completion',
    'Run paused; completed time was preserved',
    'capacity-tariff target',
    'grid import limit',
    'main-fuse phase headroom',
    'simulate_start',
    'confirmed_off',
    'guard_paused',
    'released',
    'shutdown',
    'The device did not confirm its stop after three attempts',
    'The device still reports that it is running; switch it off first',
    'Smart Load is not currently owned',
    'Home Assistant service {service} is unavailable',
    '{name}: one of its controls is still used by an enabled legacy deadline schedule',
    '{name} shares a control route with {other}',
    'Device feedback confirmed the uncertain start remained off',
    'Wait for running Smart Loads to finish before changing their configuration',
    '{name}: automatic control needs running or power feedback',
    '{name}: interruptible automatic control needs a stop action',
    '{name}: start service {service} is unavailable',
    '{field} must use the explicit entity_id field for target safety',
    'control_entity must belong to {domains}',
    'Smart Loads configuration changed; reload before saving',
    'Smart Loads could not refresh its current state',
    'No safe capacity window fits before the deadline',
    'estimated',
    'Device control is active but Smart Loads does not own it',
    '{field} must be a number',
    '{field}.service must be domain.service',
  ];
  for (const language of REQUIRED.slice(1)) {
    for (const key of keys) assert.notEqual(panelText({ language }, key), key);
  }
});

test('keeps interpolation values intact and falls back safely to English', () => {
  assert.equal(
    panelText({ language: 'es' }, 'Delete "{name}" and its automation?', { name: 'Lavavajillas' }),
    '¿Eliminar «Lavavajillas» y su automatización?',
  );
  assert.equal(panelText({ language: 'it' }, 'Hidden devices'), 'Hidden devices');
  assert.equal(panelText({ language: 'nl' }, 'Uncatalogued technical value'), 'Uncatalogued technical value');
});
