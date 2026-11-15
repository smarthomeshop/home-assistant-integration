// Live presence for the floor planner page.
//
// Turns the Home Assistant states of the linked radars into people on the
// house plan and a status per room. Positions are millimetres in the house
// frame (Live Home), like the rest of the integration. This is the planner's
// own copy of the panel's whole-home presence rules: it is stricter about
// future timestamps and keeps the report time of every exact position, which
// the fusion of overlapping radars needs.
import { hasUnknownVisiblePeopleCount } from './safety.js';
import { roomInteriorPoint, safeSuppressionRoomPolygon, transformHomePoint } from '../../../panel/src/utils/whole-home.ts';
import { normalizeRadarCoordinate, projectRadarTargetToRoom } from '../../../panel/src/utils/radar-coordinates.ts';
import { safelyOutsideRoom } from '../../../panel/src/utils/reflection-protection.ts';

const invalidStates = new Set(['', 'unknown', 'unavailable', 'none', 'null', 'nan']);

const finite = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const isObject = value => typeof value === 'object' && value !== null && !Array.isArray(value);

// The smarthomeshop/radar/profiles devices as this page reads them. An entry
// without a profile says nothing about the room, so it counts as a radar that
// is not available; missing aliases or targets are simply none.
export const radarProfiles = devices => (Array.isArray(devices) ? devices : [])
    .filter(device => isObject(device) && isObject(device.profile))
    .map(device => ({
        ...device,
        aliases: Array.isArray(device.aliases) ? device.aliases.filter(alias => typeof alias === 'string') : [],
        targets: Array.isArray(device.targets) ? device.targets.filter(isObject) : [],
    }));

// The entities that carry the radars' own evidence. They must not set the
// clock that judges them, see latestIndependentReportTimestamp.
export const radarEntityIds = profiles => new Set(profiles.flatMap(device => [
    device.profile.tracking_presence_entity_id,
    device.profile.tracking_target_count_entity_id,
    device.profile.reported_installation_mode_entity_id,
    ...(device.profile.supplementary_presence_sensors ?? []),
    ...device.targets.flatMap(target => [target.x_entity_id, target.y_entity_id, target.z_entity_id, target.presence_entity_id]),
].filter(Boolean)));

const roomSources = room => {
    const sources = Array.isArray(room.sensors) ? room.sensors : [];
    if (sources.length) return sources.filter(source => typeof source === 'object' && source !== null);
    return room.sensor ? [room.sensor] : [];
};

const profileForSource = (profiles, deviceId) => profiles.find(profile =>
    profile.device_id === deviceId || profile.entity_prefix === deviceId || profile.aliases.includes(deviceId));

const stateText = value => String(typeof value === 'object' && value !== null ? value.state || '' : value || '');
const isOn = value => stateText(value).toLowerCase() === 'on';
const validState = value => !invalidStates.has(stateText(value).trim().toLowerCase());

// A value without a report time counts as fresh: there is nothing to judge.
function isFresh(value, freshnessSeconds, now) {
    if (typeof value !== 'object' || value === null) return true;
    if (Object.hasOwn(value, 'received_at_ms')) {
        const receivedAt = Number(value.received_at_ms);
        return Number.isFinite(receivedAt) && receivedAt <= now && now - receivedAt <= freshnessSeconds * 1000;
    }
    // last_updated only changes with the value, so a steady state never goes stale on it.
    if (!value.last_reported) return true;
    const reportedAt = Date.parse(value.last_reported);
    return !Number.isFinite(reportedAt) || reportedAt > now ? false : now - reportedAt <= freshnessSeconds * 1000;
}

// A state from the future cannot be trusted, whatever it says.
function notFromFuture(value, now) {
    if (!validState(value)) return false;
    if (typeof value !== 'object' || value === null) return true;
    if (Object.hasOwn(value, 'received_at_ms')) {
        const receivedAt = Number(value.received_at_ms);
        return Number.isFinite(receivedAt) && receivedAt <= now;
    }
    const timestamp = value.last_reported || value.last_updated;
    if (!timestamp) return true;
    const reportedAt = Date.parse(timestamp);
    return Number.isFinite(reportedAt) && reportedAt <= now;
}

function insidePolygon(point, polygon) {
    let inside = false;
    for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
        const a = polygon[current], b = polygon[previous];
        if ((a.y > point.y) !== (b.y > point.y)
            && point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || Number.EPSILON) + a.x) inside = !inside;
    }
    return inside;
}

// Exclusion zones of the room that apply to this source: shared ones and its own.
const excludedByZone = (room, point, sourceId) => (Array.isArray(room.zones) ? room.zones : [])
    .filter(zone => typeof zone === 'object' && zone !== null && zone.type === 'exclusion'
        && (!(zone.sensorId || zone.sensor_id) || (zone.sensorId || zone.sensor_id) === sourceId))
    .some(zone => [Array.isArray(zone.points) ? zone.points : [], ...(Array.isArray(zone.parts) ? zone.parts : [])]
        .some(part => Array.isArray(part) && part.length >= 3 && insidePolygon(point, part)));

const emptyStatus = () => ({ linked: 0, live: 0, unavailable: 0, positioning: 0, positive: 0, negative: 0, unknown: 0 });

// Rooms that share one physical radar. Such a radar cannot say which of the
// rooms it sees, so all of them are left out.
function conflictingRoomIds(rooms, profiles) {
    const roomsByDevice = new Map();
    for (const room of rooms) {
        for (const source of roomSources(room)) {
            if (!source.deviceId) continue;
            const deviceId = profileForSource(profiles, source.deviceId)?.device_id || source.deviceId;
            const roomIds = roomsByDevice.get(deviceId) || new Set();
            roomIds.add(room.id);
            roomsByDevice.set(deviceId, roomIds);
        }
    }
    const conflicting = new Set();
    for (const roomIds of roomsByDevice.values()) {
        if (roomIds.size > 1) roomIds.forEach(roomId => conflicting.add(roomId));
    }
    return conflicting;
}

// People and room states from the radars' Home Assistant states.
//
//   rooms             rooms placed in the house (roomsInHouse)
//   profiles          smarthomeshop/radar/profiles devices
//   getState(id)      the state of one entity, with received_at_ms when known
//   runtimeByRoom     the integration's own room runtime (rooms/runtime)
//   runtimeAvailable  whether that runtime may decide occupancy right now
//
// An exact person needs fresh coordinates from a trusted placement. Anything
// less becomes an approximate marker in the middle of the room, and the room
// is only reported clear when every source proves it.
export function collectLivePresence(rooms, profiles, getState, now = Date.now(), runtimeByRoom = {}, runtimeAvailable = true) {
    const people = [];
    let linkedSensors = 0, liveSensors = 0, unavailableSensors = 0;
    const statusByRoom = new Map();
    const incompletePositioning = new Set();
    const incompletePresence = new Set();
    const ambiguousSupplementary = new Set();
    const suppressionExplained = new Set();
    const unsafeClearEvidence = new Set();
    const conflicting = conflictingRoomIds(rooms, profiles);

    for (const room of rooms) {
        const sources = roomSources(room);
        const freshnessSeconds = Math.max(1, Math.min(15, finite(room.aggregation?.tracking?.observation_freshness_ms, 5000) / 1000));
        const selectedSources = new Set(room.aggregation?.presence?.source_ids || []);
        for (const [offset, source] of sources.entries()) {
            if (!source.deviceId) continue;
            const status = statusByRoom.get(room.id) || emptyStatus();
            const selected = !selectedSources.size || Boolean(source.id && selectedSources.has(source.id));
            const device = profileForSource(profiles, source.deviceId);
            if (!device) {
                unavailableSensors += 1;
                status.unavailable += 1;
                if (selected) status.unknown += 1;
                statusByRoom.set(room.id, status);
                continue;
            }
            linkedSensors += 1;
            status.linked += 1;
            statusByRoom.set(room.id, status);

            const { profile, targets } = device;
            const read = entityId => {
                if (!entityId) return undefined;
                const value = getState(entityId);
                return notFromFuture(value, now) ? value : undefined;
            };
            const presenceEntity = profile.tracking_presence_entity_id;
            const presence = read(presenceEntity);
            const supplementary = (profile.supplementary_presence_sensors || []).map(entityId => read(entityId));
            const presenceComplete = [...(presenceEntity ? [presence] : []), ...supplementary].every(validState);
            const scale = profile.coordinate_scale_to_mm || 1;
            const evidence = targets.map(target => {
                const rawX = read(target.x_entity_id);
                const rawY = read(target.y_entity_id);
                const targetPresence = read(target.presence_entity_id);
                const reportedX = normalizeRadarCoordinate(stateText(rawX), scale);
                const reportedY = normalizeRadarCoordinate(stateText(rawY), scale);
                const fresh = isFresh(rawX, freshnessSeconds, now) && isFresh(rawY, freshnessSeconds, now);
                return {
                    target,
                    targetPresence: isFresh(targetPresence, freshnessSeconds, now) ? targetPresence : undefined,
                    targetPresenceAvailable: targetPresence,
                    coordinatesAvailable: validState(rawX) && validState(rawY),
                    x: fresh ? reportedX : null,
                    y: fresh ? reportedY : null,
                    reportedX,
                    reportedY,
                    observedAtMs: fresh ? Math.max(Number(rawX?.received_at_ms) || 0, Number(rawY?.received_at_ms) || 0) || now : null,
                    staleCoordinates: !fresh && reportedX !== null && reportedY !== null,
                };
            });

            // A configurable radar only measures in the mode it is installed
            // for. When the device reports its mode, trust what it reports.
            const modeEntity = profile.reported_installation_mode_entity_id;
            const reportedMode = stateText(read(modeEntity)).trim().toLowerCase();
            const hardwareMode = modeEntity ? (reportedMode === 'side' || reportedMode === 'top' ? reportedMode : null)
                : profile.current_hardware_mode;
            const placementTrusted = ['x', 'y', 'x_m', 'y_m', 'rotation', 'orientation_deg'].every(field =>
                !(field in source) || source[field] == null || Number.isFinite(Number(source[field])));
            const geometryTrusted = placementTrusted && !(['ld2460', 'ld6002b'].includes(profile.radar_model)
                && ['side', 'top'].includes(profile.required_installation_mode)
                && hardwareMode !== profile.required_installation_mode);
            const hasCoordinates = evidence.some(item => item.x !== null && item.y !== null);
            if (!geometryTrusted) incompletePositioning.add(room.id);
            if ((presenceEntity ? validState(presence) : false) || supplementary.some(validState) || hasCoordinates) {
                liveSensors += 1;
                status.live += 1;
                if (hasCoordinates && profile.positioning_available !== false) status.positioning += 1;
            } else {
                unavailableSensors += 1;
                status.unavailable += 1;
            }
            // Every target either has a position that agrees with its own
            // presence switch, or is explicitly empty.
            const targetsComplete = evidence.every(item => {
                if (!item.target.presence_entity_id) return item.x !== null && item.y !== null;
                if (!validState(item.targetPresence)) return false;
                return item.x !== null && item.y !== null
                    ? (item.x !== 0 || item.y !== 0) === isOn(item.targetPresence)
                    : !isOn(item.targetPresence);
            });
            if (profile.positioning_available !== false && targets.length && !targetsComplete) incompletePositioning.add(room.id);

            const found = [];
            let suppressed = 0;
            let unpositioned = false;
            for (const { target, targetPresence, x, y, reportedX, reportedY, observedAtMs, staleCoordinates } of evidence) {
                // A target that says it is on is stronger than a conflicting
                // room switch: keep the person and make the room cautious.
                const targetOn = Boolean(target.presence_entity_id && isOn(targetPresence));
                if (x === null || y === null) {
                    if (!target.presence_entity_id && staleCoordinates && reportedX === 0 && reportedY === 0) continue;
                    const staleSomewhere = staleCoordinates && (reportedX !== 0 || reportedY !== 0);
                    if (targetOn || (!target.presence_entity_id && staleSomewhere && (isOn(presence) || !presenceEntity))) unpositioned = true;
                    continue;
                }
                if (x === 0 && y === 0) {
                    if (targetOn) unpositioned = true;
                    continue;
                }
                if (!geometryTrusted) {
                    unpositioned = true;
                    continue;
                }
                const local = projectRadarTargetToRoom({ x, y },
                    { x: finite(source.x), y: finite(source.y), rotation: finite(source.rotation) }, profile.coordinate_projection);
                if (safelyOutsideRoom(local, safeSuppressionRoomPolygon(room)) || excludedByZone(room, local, source.id)) {
                    suppressed += 1;
                    continue;
                }
                const point = transformHomePoint(local, room.house);
                found.push({
                    id: `${room.id}:${device.device_id}:${target.index}`, roomId: room.id, roomName: room.name,
                    x: point.x, y: point.y, floor: room.house.floor, approximate: false,
                    sourceDeviceId: device.device_id, observedAtMs,
                });
            }

            const countEntity = profile.tracking_target_count_entity_id;
            const countState = read(countEntity);
            const parsedCount = Number(stateText(countState));
            const count = validState(countState) && isFresh(countState, freshnessSeconds, now)
                && Number.isInteger(parsedCount) && parsedCount >= 0 ? parsedCount : null;
            if (countEntity && count === null) incompletePositioning.add(room.id);
            if (count !== null && count !== found.length + suppressed) incompletePositioning.add(room.id);
            if (count !== null && count > found.length + suppressed) unpositioned = true;
            // Presence is explained away only when the suppressed positions
            // account for exactly every reported person, never more or less.
            const explicitOn = evidence.filter(item => Boolean(item.target.presence_entity_id) && isOn(item.targetPresence)).length;
            const explicitComplete = evidence.length > 0
                && evidence.every(item => Boolean(item.target.presence_entity_id) && validState(item.targetPresence));
            const countExplains = count !== null && count > 0 && suppressed === count && found.length === 0 && !unpositioned;
            const explicitExplains = explicitComplete && explicitOn > 0 && suppressed === explicitOn && found.length === 0 && !unpositioned;
            const explained = countEntity ? countExplains : explicitExplains;
            const supplementaryOn = supplementary.some(isOn);
            if (!presenceComplete) incompletePresence.add(room.id);
            if (supplementaryOn && found.length > 0) ambiguousSupplementary.add(room.id);
            if (unpositioned || (!found.length && (supplementaryOn || (!explained && isOn(presence))))) {
                const centre = transformHomePoint(roomInteriorPoint(room), room.house);
                found.push({
                    id: `${room.id}:${device.device_id}:${unpositioned ? 'unpositioned' : `room-${offset}`}`,
                    roomId: room.id, roomName: room.name, x: centre.x, y: centre.y, floor: room.house.floor,
                    approximate: true, sourceDeviceId: device.device_id,
                });
            }
            if (selected) {
                const targetContract = evidence.every(item => item.coordinatesAvailable
                    && (!item.target.presence_entity_id || validState(item.targetPresenceAvailable)));
                const countContract = !countEntity || (validState(countState) && Number.isInteger(parsedCount) && parsedCount >= 0);
                if (!presenceComplete || !targetContract || !countContract || !geometryTrusted) unsafeClearEvidence.add(room.id);
                if (explained) suppressionExplained.add(room.id);
                const inputs = explained ? supplementary : [presence, ...supplementary];
                const clearProven = presenceComplete && (!countEntity || count !== null) && targetsComplete;
                if (found.length || inputs.some(isOn)) status.positive += 1;
                else if (clearProven && ((explained && inputs.length === 0)
                    || (inputs.length > 0 && inputs.every(value => validState(value) && !isOn(value))))) status.negative += 1;
                else status.unknown += 1;
            }
            if (room.house.visible !== false) people.push(...found);
        }
    }

    // While the runtime is not available, its last "occupied" does not count
    // for a room whose sources all explain their presence as suppressed
    // positions (outside the room or in an exclusion zone), unless the
    // runtime was clearing the room.
    const runtimeExplained = (room, status, presence) => {
        const selected = status ? status.positive + status.negative + status.unknown : 0;
        return suppressionExplained.has(room.id) && !runtimeAvailable && selected > 0 && status?.positive === 0
            && status?.unknown === 0 && status?.negative === selected && presence?.status !== 'clearing';
    };
    const shown = people.filter(person => !conflicting.has(person.roomId));
    // A vacancy delay keeps a room occupied after its last exact position is
    // gone. Show that as an approximate marker rather than an empty room.
    for (const room of rooms) {
        const presence = runtimeByRoom[room.id]?.presence;
        if (room.house.visible === false || conflicting.has(room.id) || presence?.occupied !== true
            || runtimeExplained(room, statusByRoom.get(room.id), presence)
            || shown.some(person => person.roomId === room.id)) continue;
        const centre = transformHomePoint(roomInteriorPoint(room), room.house);
        shown.push({
            id: `${room.id}:runtime-hold`, roomId: room.id, roomName: room.name, x: centre.x, y: centre.y,
            floor: room.house.floor, approximate: true, sourceDeviceId: 'runtime',
        });
    }

    const states = rooms.map(room => {
        const roomPeople = shown.filter(person => person.roomId === room.id);
        const status = statusByRoom.get(room.id) || emptyStatus();
        const selected = status.positive + status.negative + status.unknown;
        const occupied = status.positive > 0;
        const presenceKnown = occupied || (selected > 0 && status.negative === selected);
        const sensorCount = roomSources(room).filter(source => source.deviceId).length;
        const approximate = roomPeople.some(person => person.approximate);
        const evidenceComplete = sensorCount > 0 && status.linked === sensorCount && status.unavailable === 0
            && status.positioning === sensorCount && !incompletePositioning.has(room.id) && !incompletePresence.has(room.id)
            && !ambiguousSupplementary.has(room.id) && !approximate;
        const presence = runtimeByRoom[room.id]?.presence;
        const runtimeKnown = runtimeAvailable && typeof presence?.occupied === 'boolean';
        const cachedRuntimeKnown = typeof presence?.occupied === 'boolean';
        const localClearSafe = !unsafeClearEvidence.has(room.id) && sensorCount > 0 && status.linked === sensorCount
            && !ambiguousSupplementary.has(room.id);
        return {
            roomId: room.id,
            roomName: room.name,
            floor: room.house.floor,
            people: roomPeople.filter(person => !person.approximate).length,
            // One radar with complete evidence is the only exact count.
            peopleCountKnown: runtimeKnown && !conflicting.has(room.id) && sensorCount === 1 && evidenceComplete,
            trackingEvidenceComplete: evidenceComplete,
            approximate,
            occupied: conflicting.has(room.id) ? false
                : (cachedRuntimeKnown && presence?.occupied === true && !runtimeExplained(room, status, presence)) || occupied,
            available: conflicting.has(room.id) ? false : presence
                ? runtimeKnown && (occupied || localClearSafe)
                : runtimeAvailable && presenceKnown && (occupied || !incompletePositioning.has(room.id)) && !incompletePresence.has(room.id),
            visible: room.house.visible !== false,
            sensorCount,
            linkedSensorCount: status.linked,
            liveSensorCount: status.live,
            unavailableSensorCount: status.unavailable,
            positioningSensorCount: status.positioning,
        };
    });
    return { people: shown, rooms: states, linkedSensors, liveSensors, unavailableSensors };
}

// Fused positions are useful, but position-only association cannot prove that
// two close tracks of different radars are one person. A fused room never
// gets an exact people count.
export function withFusedRooms(rooms, people, fusedRoomIds) {
    for (const room of rooms) {
        if (!fusedRoomIds.has(room.roomId)) continue;
        room.people = people.filter(person => person.roomId === room.roomId && !person.approximate).length;
        room.approximate = people.some(person => person.roomId === room.roomId && person.approximate);
        room.peopleCountKnown = false;
    }
    return rooms;
}

// The figures the editor draws, in metres, with the heading and stride of the
// last step so walking looks continuous between updates.
export function liveTracks(previous, people, houses, now) {
    const tracks = new Map();
    for (const person of people) {
        const last = previous.get(person.id);
        const x = person.x / 1000, y = person.y / 1000;
        const dx = x - (last?.x ?? x), dy = y - (last?.y ?? y);
        const distance = Math.hypot(dx, dy);
        const moved = last?.floor === person.floor && distance >= .05;
        tracks.set(person.id, {
            x, y, floor: person.floor, roomId: person.roomId, house: houses.get(person.roomId),
            // An approximate marker only says "somewhere in this room". It never gets a seated or fallen pose.
            pose: 'standing',
            approximate: person.approximate,
            heading: moved ? Math.atan2(dx, -dy) * 180 / Math.PI : last?.heading ?? 0,
            stride: (last?.stride ?? 0) + (moved ? distance : 0),
            movedAt: moved ? now : last?.movedAt ?? 0,
        });
    }
    return tracks;
}

export const livePeople = (tracks, now) => [...tracks.values()].map(({ movedAt, ...person }) => ({ ...person, moving: now - movedAt < 800 }));

// One line under the plan: exact positions first, then occupied rooms
// without one, then rooms whose sensors cannot tell.
export function detectionSummary(copy, people, rooms) {
    const exact = people.filter(person => !person.approximate);
    const approximate = rooms.filter(room => room.occupied && room.approximate).map(room => room.roomName);
    const unknown = rooms.filter(room => !room.available).map(room => room.roomName);
    const countKnown = !hasUnknownVisiblePeopleCount(rooms, people);
    let summary = exact.length ? `${copy.livePositions} · ${countKnown ? exact.length : copy.countUnknown}`
        : approximate.length ? `${copy.occupiedWithoutPosition} · ${approximate.join(', ')}`
            : unknown.length ? `${copy.sensorStatusUnknown} · ${unknown.join(', ')}`
                : copy.noExactPositions;
    if (unknown.length && exact.length) summary += ` · ${copy.sensorStatusUnknown}: ${unknown.join(', ')}`;
    return summary;
}
