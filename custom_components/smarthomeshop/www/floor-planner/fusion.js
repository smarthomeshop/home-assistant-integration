// Generated from floor-planner/src by floor-planner/build.mjs. Edit the source, then rebuild.

// src/ha/fusion.js
var finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
var round = (value) => Math.round(finite(value));
var sourcePlacementFingerprint = (source) => [
  source.deviceId || "",
  round(source.x),
  round(source.y),
  round(source.rotation),
  round(source.heightMm),
  source.mountingMode || "",
  String(source.capabilities?.radar_model || ""),
  String(source.capabilities?.coordinate_frame || ""),
  String(source.capabilities?.coordinate_projection || ""),
  String(source.capabilities?.installation_mode || ""),
  round(source.capabilities?.installation_height_mm),
  round(source.capabilities?.installation_angle_tenths)
].join("|");
var pairKey = (first, second) => [first, second].sort().join("|");
var distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);
var profileFor = (profiles, deviceId) => profiles.find((profile) => profile.device_id === deviceId || profile.entity_prefix === deviceId || (profile.aliases || []).includes(deviceId));
var enrichedSourceForProfile = (source, profile) => {
  if (!profile) return source;
  const heightValue = profile.profile.installation_height_m;
  const angleValue = profile.profile.installation_angle_deg;
  const height = Number(heightValue);
  const angle = Number(angleValue);
  const hasHeight = heightValue !== null && heightValue !== void 0 && Number.isFinite(height);
  const hasAngle = angleValue !== null && angleValue !== void 0 && Number.isFinite(angle);
  const resolvedHeightMm = hasHeight ? Math.round(height * 1e3) : round(source.heightMm);
  return {
    ...source,
    heightMm: resolvedHeightMm,
    capabilities: {
      ...source.capabilities || {},
      radar_model: profile.profile.radar_model || "",
      coordinate_frame: profile.profile.coordinate_frame || "",
      coordinate_projection: profile.profile.coordinate_projection || "",
      installation_mode: profile.profile.current_hardware_mode || "",
      installation_height_mm: resolvedHeightMm,
      installation_angle_tenths: hasAngle ? Math.round(angle * 10) : finite(source.capabilities?.installation_angle_tenths)
    }
  };
};
var oneToOneCandidates = (observations, radius) => {
  const allEdges = /* @__PURE__ */ new Map();
  const adjacency = new Map(observations.map((item) => [item.id, /* @__PURE__ */ new Set()]));
  for (let firstIndex = 0; firstIndex < observations.length - 1; firstIndex += 1) {
    const first = observations[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < observations.length; secondIndex += 1) {
      const second = observations[secondIndex];
      if (first.sourceId === second.sourceId || distance(first, second) > radius) continue;
      const key = pairKey(first.id, second.id);
      allEdges.set(key, { first, second, cost: distance(first, second) });
      adjacency.get(first.id).add(second.id);
      adjacency.get(second.id).add(first.id);
    }
  }
  const byId = new Map(observations.map((item) => [item.id, item]));
  const visited = /* @__PURE__ */ new Set();
  const candidates = /* @__PURE__ */ new Map();
  const competingIds = /* @__PURE__ */ new Set();
  for (const observation of observations) {
    if (visited.has(observation.id) || !adjacency.get(observation.id)?.size) continue;
    const component = [];
    const pending = [observation.id];
    while (pending.length) {
      const id = pending.pop();
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);
      adjacency.get(id)?.forEach((neighbour) => pending.push(neighbour));
    }
    const sources = component.map((id) => byId.get(id).sourceId);
    const uniqueSources = new Set(sources);
    const completeClique = uniqueSources.size === component.length && component.every((first, index) => component.slice(index + 1).every((second) => allEdges.has(pairKey(first, second))));
    if (!completeClique) {
      component.forEach((id) => competingIds.add(id));
      continue;
    }
    for (let first = 0; first < component.length - 1; first += 1) {
      for (let second = first + 1; second < component.length; second += 1) {
        const key = pairKey(component[first], component[second]);
        candidates.set(key, allEdges.get(key));
      }
    }
  }
  return { candidates, competingIds };
};
var applyAuthoritativeRuntimeTracking = (rooms, runtimeByRoom = {}, trackingAuthoritative = false) => rooms.map((room) => {
  const runtimeTracking = runtimeByRoom?.[room.id]?.tracking;
  const localTracking = room.aggregation?.tracking || {};
  if (!trackingAuthoritative || !runtimeTracking || typeof runtimeTracking !== "object") {
    if (localTracking.experimental_fusion !== true && !Object.keys(localTracking.source_alignments || {}).length) return room;
    return {
      ...room,
      aggregation: {
        ...room.aggregation || {},
        tracking: {
          ...localTracking,
          experimental_fusion: false,
          source_alignments: {}
        }
      }
    };
  }
  const localRevocation = localTracking.alignment_revoked_at;
  const runtimeRevocation = runtimeTracking.alignment_revoked_at;
  const revokedElsewhere = typeof runtimeRevocation === "string" && runtimeRevocation && runtimeRevocation !== localRevocation;
  const localAllowsFusion = localTracking.experimental_fusion === true;
  const runtimeAllowsFusion = runtimeTracking.experimental_fusion === true;
  const fusionAllowed = localAllowsFusion && runtimeAllowsFusion && !revokedElsewhere;
  return {
    ...room,
    aggregation: {
      ...room.aggregation || {},
      tracking: {
        ...localTracking,
        ...runtimeTracking,
        experimental_fusion: fusionAllowed,
        source_alignments: fusionAllowed ? runtimeTracking.source_alignments || {} : {}
      }
    }
  };
});
var runtimeSnapshotIsAuthoritative = (snapshot, receivedAtMs, nowMs = Date.now(), maximumAgeMs = 2500) => Boolean(
  snapshot?.tracking_authoritative === true && Number.isFinite(receivedAtMs) && receivedAtMs > 0 && nowMs >= receivedAtMs && nowMs - receivedAtMs <= maximumAgeMs
);
var validAlignment = (sources, tracking) => {
  const radius = finite(tracking?.duplicate_distance_mm, 650);
  if (!tracking?.experimental_fusion || sources.length < 2) return false;
  return sources.every((source) => {
    const alignment = tracking.source_alignments?.[source.id];
    return alignment && alignment.sample_count >= 3 && Number.isFinite(alignment.rmse_mm) && alignment.rmse_mm <= Math.min(450, radius * 0.6) && alignment.duplicate_distance_mm === radius && alignment.placement_fingerprint === sourcePlacementFingerprint(source);
  });
};
var RoomFusionState = class {
  constructor() {
    this.evidence = /* @__PURE__ */ new Map();
    this.tracks = [];
    this.nextTrack = 1;
    this.lastInputAt = null;
  }
  reset() {
    this.evidence.clear();
    this.tracks = [];
    this.lastInputAt = null;
  }
  confirmedPairs(observations, radius, ambiguityRadius, nowMs, freshnessMs) {
    if (this.lastInputAt !== null && nowMs - this.lastInputAt > freshnessMs) this.reset();
    this.lastInputAt = nowMs;
    const { candidates, competingIds } = oneToOneCandidates(observations, radius);
    const plausiblePairs = /* @__PURE__ */ new Set();
    for (let firstIndex = 0; firstIndex < observations.length - 1; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < observations.length; secondIndex += 1) {
        const first = observations[firstIndex];
        const second = observations[secondIndex];
        const reportSkewMs = Math.abs(first.observedAtMs - second.observedAtMs);
        const timeAdjustedAmbiguity = Math.max(
          ambiguityRadius,
          radius + 3 * reportSkewMs
        );
        if (first.sourceId !== second.sourceId && distance(first, second) <= timeAdjustedAmbiguity) {
          plausiblePairs.add(pairKey(first.id, second.id));
        }
      }
    }
    const confirmed = /* @__PURE__ */ new Set();
    for (const [key, { first, second }] of candidates) {
      const existing = this.evidence.get(key);
      if (!existing) {
        this.evidence.set(key, {
          sightings: 1,
          firstAt: Math.min(first.observedAtMs, second.observedAtMs),
          first,
          second,
          lastFirst: first,
          lastSecond: second,
          confirmed: false,
          lastSeenAt: Math.max(first.observedAtMs, second.observedAtMs)
        });
        continue;
      }
      if (nowMs - existing.lastSeenAt > freshnessMs) {
        this.evidence.delete(key);
        continue;
      }
      const firstReportAdvanced = first.observedAtMs > existing.lastFirst.observedAtMs;
      const secondReportAdvanced = second.observedAtMs > existing.lastSecond.observedAtMs;
      const bothReportsAdvanced = firstReportAdvanced && secondReportAdvanced;
      const movementFirst = distance(first, existing.first);
      const movementSecond = distance(second, existing.second);
      const relativeStart = {
        x: existing.first.x - existing.second.x,
        y: existing.first.y - existing.second.y
      };
      const relativeNow = { x: first.x - second.x, y: first.y - second.y };
      const drift = distance(relativeStart, relativeNow);
      const inconsistent = Math.abs(movementFirst - movementSecond) > 150 || drift > Math.min(200, radius * 0.25);
      const reportSkewMs = Math.abs(first.observedAtMs - second.observedAtMs);
      const staleOneSidedPair = firstReportAdvanced !== secondReportAdvanced && reportSkewMs > 1500;
      if (staleOneSidedPair || inconsistent && bothReportsAdvanced) {
        existing.confirmed = false;
        existing.sightings = 1;
        existing.firstAt = Math.min(first.observedAtMs, second.observedAtMs);
        existing.first = first;
        existing.second = second;
        existing.lastFirst = first;
        existing.lastSecond = second;
      } else if (bothReportsAdvanced) {
        existing.sightings += 1;
        const correlated = movementFirst >= 300 && movementSecond >= 300 && !inconsistent;
        if (existing.sightings >= 4 && Math.max(first.observedAtMs, second.observedAtMs) - existing.firstAt >= 750 && correlated) {
          existing.confirmed = true;
        }
        existing.lastFirst = first;
        existing.lastSecond = second;
      }
      existing.lastSeenAt = Math.max(first.observedAtMs, second.observedAtMs);
      if (existing.confirmed) confirmed.add(key);
    }
    for (const [key, evidence] of [...this.evidence.entries()]) {
      if (nowMs - evidence.lastSeenAt > freshnessMs || !candidates.has(key) && !plausiblePairs.has(key)) this.evidence.delete(key);
    }
    return {
      confirmed,
      ambiguous: competingIds.size > 0 || candidates.size > confirmed.size || [...plausiblePairs].some((key) => !confirmed.has(key))
    };
  }
  fuse(observations, confirmed) {
    const adjacency = new Map(observations.map((item) => [item.id, /* @__PURE__ */ new Set()]));
    for (const key of confirmed) {
      const [first, second] = key.split("|");
      adjacency.get(first)?.add(second);
      adjacency.get(second)?.add(first);
    }
    const byId = new Map(observations.map((item) => [item.id, item]));
    const visited = /* @__PURE__ */ new Set();
    const fused = [];
    for (const observation of observations) {
      if (visited.has(observation.id)) continue;
      const members = [];
      const pending = [observation.id];
      while (pending.length) {
        const id = pending.pop();
        if (visited.has(id)) continue;
        visited.add(id);
        members.push(byId.get(id));
        adjacency.get(id)?.forEach((next) => pending.push(next));
      }
      const clique = members.every((first, index) => members.slice(index + 1).every((second) => first.sourceId === second.sourceId || confirmed.has(pairKey(first.id, second.id))));
      if (!clique) {
        fused.push(...members.map((member) => ({ ...member, memberIds: [member.id] })));
        continue;
      }
      fused.push({
        id: members.map((member) => member.id).sort().join("+"),
        x: members.reduce((sum, member) => sum + member.x, 0) / members.length,
        y: members.reduce((sum, member) => sum + member.y, 0) / members.length,
        roomId: observation.roomId,
        roomName: observation.roomName,
        floor: observation.floor,
        approximate: false,
        sourceDeviceId: "fused",
        memberIds: members.map((member) => member.id)
      });
    }
    return fused;
  }
  track(observations, nowMs, radius, holdMs) {
    const unused = new Set(this.tracks.map((_, index) => index));
    const next = observations.map((observation) => {
      let best = null;
      for (const index of unused) {
        const candidate = this.tracks[index];
        const cost = distance(candidate, observation);
        const shared = observation.memberIds.some((id) => candidate.memberIds.includes(id));
        if (cost <= radius + (shared ? 1500 : 0) && (!best || cost < best.cost)) best = { index, cost };
      }
      if (!best) return {
        ...observation,
        id: `${observation.roomId}:fused-track-${this.nextTrack++}`,
        lastSeen: nowMs
      };
      unused.delete(best.index);
      return { ...observation, id: this.tracks[best.index].id, lastSeen: nowMs };
    });
    for (const index of unused) {
      const previous = this.tracks[index];
      if (nowMs - previous.lastSeen <= holdMs) {
        next.push({ ...previous, held: true, approximate: true });
      }
    }
    this.tracks = next;
    return next;
  }
};
var StatefulWholeHomeFusion = class {
  constructor() {
    this.rooms = /* @__PURE__ */ new Map();
  }
  reset() {
    this.rooms.clear();
  }
  apply(people, rooms, profiles, nowMs = Date.now()) {
    let output = [...people];
    const fusedRoomIds = /* @__PURE__ */ new Set();
    const ambiguousRoomIds = /* @__PURE__ */ new Set();
    for (const room of rooms) {
      const tracking = room.aggregation?.tracking;
      const sensors = (room.sensors || []).filter((source) => source.id && source.deviceId).map((source) => enrichedSourceForProfile(source, profileFor(profiles, source.deviceId)));
      let state = this.rooms.get(room.id);
      state ||= new RoomFusionState();
      this.rooms.set(room.id, state);
      if (!validAlignment(sensors, tracking)) {
        state.reset();
        continue;
      }
      const deviceToSource = /* @__PURE__ */ new Map();
      for (const source of sensors) {
        const profile = profileFor(profiles, source.deviceId);
        if (profile) deviceToSource.set(profile.device_id, source.id);
      }
      const exact = output.filter((person) => person.roomId === room.id && !person.approximate).map((person) => ({ ...person, sourceId: deviceToSource.get(person.sourceDeviceId), originalId: person.id })).filter((person) => person.sourceId).map((person) => ({
        ...person,
        id: `${person.sourceId}:${person.originalId}`,
        observedAtMs: Number.isFinite(person.observedAtMs) ? person.observedAtMs : nowMs
      }));
      if (new Set(exact.map((item) => item.sourceId)).size < 2) {
        state.reset();
        if (exact.length) ambiguousRoomIds.add(room.id);
        continue;
      }
      const radius = finite(tracking.duplicate_distance_mm, 650);
      const freshnessMs = Math.max(1e3, finite(tracking.observation_freshness_ms, 5e3));
      const assessment = state.confirmedPairs(exact, radius, radius * 2, nowMs, freshnessMs);
      if (assessment.ambiguous) ambiguousRoomIds.add(room.id);
      if (!assessment.confirmed.size) continue;
      const fused = state.track(
        state.fuse(exact, assessment.confirmed),
        nowMs,
        Math.max(radius, 900),
        Math.max(0, finite(tracking.handoff_hold_ms, 1800))
      );
      output = output.filter((person) => person.roomId !== room.id || person.approximate);
      output.push(...fused.map(({ memberIds: _members, lastSeen: _lastSeen, held: _held, ...person }) => person));
      fusedRoomIds.add(room.id);
    }
    for (const roomId of [...this.rooms.keys()]) {
      if (!rooms.some((room) => room.id === roomId)) this.rooms.delete(roomId);
    }
    return { people: output, fusedRoomIds, ambiguousRoomIds };
  }
};
export {
  StatefulWholeHomeFusion,
  applyAuthoritativeRuntimeTracking,
  enrichedSourceForProfile,
  runtimeSnapshotIsAuthoritative,
  sourcePlacementFingerprint
};
