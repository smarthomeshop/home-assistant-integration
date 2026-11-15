export interface TrackingPoint {
  x: number;
  y: number;
}

export type ZMappingMode = 'raw' | 'floor_up' | 'sensor_down';

export interface ZMapping {
  mode: ZMappingMode;
  verified: boolean;
  verificationFingerprint?: string;
}

export interface TrackObservation extends TrackingPoint {
  sourceId: string;
  localTrackId: string;
  observedAtMs: number;
  rawZMm: number | null;
  roomZMm: number | null;
}

export interface FusedObservation extends TrackingPoint {
  memberIds: string[];
  sourceIds: string[];
  rawZMm: number | null;
  roomZMm: number | null;
  observedAtMs: number;
  roomZContributorCount?: number;
}

export interface RoomTrack extends FusedObservation {
  id: string;
  held: boolean;
}

export interface SourceAlignment {
  placement_fingerprint: string;
  verified_at: string;
  sample_count: number;
  rmse_mm: number;
  duplicate_distance_mm: number;
}

export interface FusionSource {
  id: string;
  deviceId?: string | null;
  x?: number;
  y?: number;
  rotation?: number;
  heightMm?: number;
  mountingMode?: string;
  sourceVersion?: number;
  capabilities?: Record<string, unknown>;
}

/** Bind an in-progress capture set to the exact physical source geometry. */
export const alignmentCaptureFingerprint = (sources: FusionSource[]): string =>
  sources
    .map(source => `${source.id}:${sourcePlacementFingerprint(source)}`)
    .sort()
    .join('|');

export interface AlignmentAssessment {
  ready: boolean;
  reason: 'ready' | 'need_sources' | 'need_samples' | 'need_spread' | 'too_far_apart';
  sampleCount: number;
  spreadMm: number;
  rmseMm: number;
  maximumDisagreementMm: number;
}

export interface FusionReadiness {
  ready: boolean;
  missingSourceIds: string[];
  staleSourceIds: string[];
}

export interface FusionOptions {
  duplicateDistanceMm: number;
  zToleranceMm: number;
  /** Maximum normal report skew before a confirmed pair is split safely. */
  reportSkewGraceMs?: number;
}

/** Production association timing must stay shorter than coordinate freshness. */
export const roomFusionOptions = (
  duplicateDistanceMm: number,
  zToleranceMm: number,
  observationFreshnessMs: number,
): FusionOptions => ({
  duplicateDistanceMm,
  zToleranceMm,
  reportSkewGraceMs: Math.max(500, Math.min(1500, observationFreshnessMs / 2)),
});

export interface TrackEngineOptions {
  matchDistanceMm: number;
  holdMs: number;
}

export interface AssociationAssessment {
  confirmedPairs: ReadonlySet<string>;
  ambiguous: boolean;
  candidatePairs: number;
}

export interface RoomTrackingSourceEvidence {
  discovered: boolean;
  live: boolean;
  presenceInputsComplete: boolean;
  targetCountComplete: boolean;
  positioning: boolean;
  activeTargetCount: number;
  primaryPresence: boolean;
  supplementaryPresence: boolean;
  unpositionedTargetPresence: boolean;
  reportedTargetCount: number | null;
}

export interface RoomTrackingStatus {
  countKnown: boolean;
  occupied: boolean;
  hasUnpositionedPresence: boolean;
}

export interface AggregatePresenceExplanation {
  hasTargetCountContract: boolean;
  reportedTargetCount: number | null;
  explicitTargetContractComplete: boolean;
  explicitPositiveTargetCount: number;
  excludedTargetCount: number;
  visibleTargetCount: number;
  hasUnpositionedTarget: boolean;
}

export interface ReconciledTargetCount {
  effectiveTargetCount: number | null;
  accountingComplete: boolean;
}

/** Keep raw mismatches visible instead of letting exclusion subtraction hide them. */
export const reconcileReportedTargetCount = (
  reportedTargetCount: number | null,
  visibleTargetCount: number,
  excludedTargetCount: number,
): ReconciledTargetCount => {
  if (reportedTargetCount === null) {
    return { effectiveTargetCount: null, accountingComplete: false };
  }
  const accountingComplete = reportedTargetCount
    === visibleTargetCount + excludedTargetCount;
  return {
    effectiveTargetCount: accountingComplete
      ? reportedTargetCount - excludedTargetCount
      : reportedTargetCount,
    accountingComplete,
  };
};

/**
 * Suppress a device-wide presence flag only when complete target evidence
 * proves that every reported person is already accounted for by an exclusion.
 */
export const exclusionsExplainAggregatePresence = (
  evidence: AggregatePresenceExplanation,
): boolean => {
  if (evidence.visibleTargetCount > 0 || evidence.hasUnpositionedTarget) return false;
  if (evidence.hasTargetCountContract) {
    return evidence.reportedTargetCount !== null
      && evidence.reportedTargetCount > 0
      && evidence.excludedTargetCount === evidence.reportedTargetCount;
  }
  return evidence.explicitTargetContractComplete
    && evidence.explicitPositiveTargetCount > 0
    && evidence.excludedTargetCount === evidence.explicitPositiveTargetCount;
};

/** Honest Floorplan Designer count/occupancy status across every configured source. */
export const assessRoomTrackingStatus = (
  sources: RoomTrackingSourceEvidence[],
  _fusionReady: boolean,
  _associationAmbiguous: boolean,
  visibleTrackCount: number,
): RoomTrackingStatus => {
  const positioningSourceCount = sources.filter(source => source.positioning).length;
  const hasUnpositionedPresence = sources.some(source =>
    source.supplementaryPresence
    || source.unpositionedTargetPresence
    || (source.primaryPresence && source.activeTargetCount === 0)
    || (source.reportedTargetCount !== null
      && source.reportedTargetCount > source.activeTargetCount));
  const hasCountMismatch = sources.some(source =>
    source.reportedTargetCount !== null
      && source.reportedTargetCount !== source.activeTargetCount);
  const allConfiguredSourcesLive = sources.length > 0
    && sources.every(source => source.discovered
      && source.live
      && source.presenceInputsComplete
      && source.targetCountComplete);
  return {
    countKnown: allConfiguredSourcesLive
      && !hasUnpositionedPresence
      && !hasCountMismatch
      // Position-only fusion cannot prove that two close, similarly moving
      // single-radar tracks are the same person. Keep multi-radar counts
      // explicitly conservative while still rendering the fused positions.
      && positioningSourceCount <= 1,
    occupied: visibleTrackCount > 0
      || sources.some(source => source.activeTargetCount > 0
        || source.primaryPresence
        || source.supplementaryPresence
        || source.unpositionedTargetPresence
        || (source.reportedTargetCount ?? 0) > 0),
    hasUnpositionedPresence,
  };
};

const finite = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (value: unknown): number => Math.round(finite(value));

/** Stable identity for the placement that was validated by the walk test. */
export const sourcePlacementFingerprint = (source: FusionSource): string => [
  source.deviceId || '',
  round(source.x),
  round(source.y),
  round(source.rotation),
  round(source.heightMm),
  source.mountingMode || '',
  String(source.capabilities?.radar_model || ''),
  String(source.capabilities?.coordinate_frame || ''),
  String(source.capabilities?.coordinate_projection || ''),
  String(source.capabilities?.installation_mode || ''),
  round(source.capabilities?.installation_height_mm),
  round(source.capabilities?.installation_angle_tenths),
].join('|');

/**
 * A raw radar Z value is never silently presented as body or floor height.
 * It is mapped only after the user explicitly verifies the relevant axis.
 */
export const mapReportedZToRoom = (
  rawZMm: number | null,
  sensorHeightMm: number,
  mapping: ZMapping | null | undefined,
): number | null => {
  if (rawZMm === null || !Number.isFinite(rawZMm) || !mapping?.verified) return null;
  if (mapping.mode === 'floor_up') return rawZMm >= 0 && rawZMm <= sensorHeightMm + 1000 ? rawZMm : null;
  if (mapping.mode === 'sensor_down') {
    const roomZ = sensorHeightMm - rawZMm;
    return rawZMm >= 0 && roomZ >= 0 && roomZ <= sensorHeightMm + 500 ? roomZ : null;
  }
  return null;
};

export const observationTimestamp = (
  state: { last_reported?: string; last_updated?: string } | null | undefined,
): number | null => {
  const parsed = Date.parse(state?.last_reported || state?.last_updated || '');
  return Number.isFinite(parsed) ? parsed : null;
};

export const isFreshObservation = (
  timestampMs: number | null,
  nowMs: number,
  maximumAgeMs: number,
): boolean => timestampMs !== null
  && timestampMs <= nowMs + 5000
  && nowMs - timestampMs <= Math.max(250, maximumAgeMs);

export const fusionReadiness = (
  sources: FusionSource[],
  alignments: Record<string, SourceAlignment> | null | undefined,
  duplicateDistanceMm: number,
): FusionReadiness => {
  if (sources.length < 2) return { ready: false, missingSourceIds: sources.map(source => source.id), staleSourceIds: [] };
  const missingSourceIds: string[] = [];
  const staleSourceIds: string[] = [];
  sources.forEach(source => {
    const alignment = alignments?.[source.id];
    const maximumRmseMm = Math.min(450, duplicateDistanceMm * 0.6);
    if (!alignment
      || alignment.sample_count < 3
      || !Number.isFinite(alignment.rmse_mm)
      || alignment.rmse_mm > maximumRmseMm) {
      missingSourceIds.push(source.id);
    } else if (alignment.placement_fingerprint !== sourcePlacementFingerprint(source)
      || alignment.duplicate_distance_mm !== duplicateDistanceMm) {
      staleSourceIds.push(source.id);
    }
  });
  return { ready: !missingSourceIds.length && !staleSourceIds.length, missingSourceIds, staleSourceIds };
};

/** Validate that the same single walker was seen consistently at useful room positions. */
export const assessAlignmentSamples = (
  samples: Array<Record<string, TrackingPoint>>,
  sourceIds: string[],
  minimumSpreadMm = 1000,
  maximumRmseMm = 450,
): AlignmentAssessment => {
  if (sourceIds.length < 2) return { ready: false, reason: 'need_sources', sampleCount: samples.length, spreadMm: 0, rmseMm: 0, maximumDisagreementMm: 0 };
  const complete = samples.filter(sample => sourceIds.every(sourceId => {
    const point = sample[sourceId];
    return Number.isFinite(point?.x) && Number.isFinite(point?.y);
  }));
  const centroids = complete.map(sample => {
    const points = sourceIds.map(sourceId => sample[sourceId]);
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    };
  });
  const pairDistances: number[] = [];
  centroids.forEach((first, firstIndex) => centroids.slice(firstIndex + 1).forEach(second => {
    pairDistances.push(Math.hypot(first.x - second.x, first.y - second.y));
  }));
  const spreadMm = pairDistances.length ? Math.max(...pairDistances) : 0;
  const disagreementDistances = complete.flatMap(sample => {
    const points = sourceIds.map(sourceId => sample[sourceId]);
    return points.flatMap((first, firstIndex) => points.slice(firstIndex + 1)
      .map(second => Math.hypot(first.x - second.x, first.y - second.y)));
  });
  const rmseMm = disagreementDistances.length
    ? Math.sqrt(disagreementDistances.reduce((sum, value) => sum + value ** 2, 0) / disagreementDistances.length)
    : 0;
  const maximumDisagreementMm = disagreementDistances.length ? Math.max(...disagreementDistances) : 0;
  const result = { sampleCount: complete.length, spreadMm, rmseMm, maximumDisagreementMm };
  // A single unambiguous disagreement is safety evidence too. Do not hide it
  // behind the sample-count/spread guidance and accidentally approve a chained
  // A-B/B-C network around a conflicting A-C observation.
  if (maximumDisagreementMm > maximumRmseMm) return { ...result, ready: false, reason: 'too_far_apart' };
  if (complete.length < 3) return { ...result, ready: false, reason: 'need_samples' };
  let hasUsefulTriangle = false;
  for (let first = 0; first < centroids.length - 2 && !hasUsefulTriangle; first += 1) {
    for (let second = first + 1; second < centroids.length - 1 && !hasUsefulTriangle; second += 1) {
      for (let third = second + 1; third < centroids.length; third += 1) {
        const points = [centroids[first], centroids[second], centroids[third]];
        const distances = [
          Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
          Math.hypot(points[0].x - points[2].x, points[0].y - points[2].y),
          Math.hypot(points[1].x - points[2].x, points[1].y - points[2].y),
        ];
        const twiceTriangleArea = Math.abs(
          points[0].x * (points[1].y - points[2].y)
            + points[1].x * (points[2].y - points[0].y)
            + points[2].x * (points[0].y - points[1].y),
        );
        if (Math.min(...distances) >= minimumSpreadMm && twiceTriangleArea >= 1_000_000) {
          hasUsefulTriangle = true;
          break;
        }
      }
    }
  }
  if (spreadMm < minimumSpreadMm || !hasUsefulTriangle) return { ...result, ready: false, reason: 'need_spread' };
  return { ...result, ready: true, reason: 'ready' };
};

export interface AlignmentNetworkAssessment {
  ready: boolean;
  connectedSourceIds: string[];
  missingSourceIds: string[];
  pairAssessments: Record<string, AlignmentAssessment>;
  sampleCount: number;
  rmseMm: number;
}

const pairKey = (first: string, second: string): string => [first, second].sort().join('::');

/**
 * Validate neighbouring overlap instead of requiring every radar to see the
 * walker at the same instant. A-B followed by B-C is sufficient for one
 * trustworthy room-wide coordinate network.
 */
export const assessPairwiseAlignmentNetwork = (
  samples: Array<Record<string, TrackingPoint>>,
  sourceIds: string[],
  minimumSpreadMm = 1000,
  maximumRmseMm = 450,
): AlignmentNetworkAssessment => {
  const pairAssessments: Record<string, AlignmentAssessment> = {};
  const edges = new Map<string, Set<string>>();
  sourceIds.forEach(sourceId => edges.set(sourceId, new Set()));
  for (let firstIndex = 0; firstIndex < sourceIds.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < sourceIds.length; secondIndex += 1) {
      const first = sourceIds[firstIndex];
      const second = sourceIds[secondIndex];
      const assessment = assessAlignmentSamples(samples, [first, second], minimumSpreadMm, maximumRmseMm);
      pairAssessments[pairKey(first, second)] = assessment;
      if (assessment.ready) {
        edges.get(first)?.add(second);
        edges.get(second)?.add(first);
      }
    }
  }
  const connected = new Set<string>();
  const pending = sourceIds.length ? [sourceIds[0]] : [];
  while (pending.length) {
    const current = pending.shift()!;
    if (connected.has(current)) continue;
    connected.add(current);
    edges.get(current)?.forEach(neighbour => {
      if (!connected.has(neighbour)) pending.push(neighbour);
    });
  }
  const passing = Object.values(pairAssessments).filter(assessment => assessment.ready);
  const explicitDisagreement = Object.values(pairAssessments).some(
    assessment => assessment.reason === 'too_far_apart',
  );
  return {
    ready: sourceIds.length >= 2
      && connected.size === sourceIds.length
      && !explicitDisagreement,
    connectedSourceIds: sourceIds.filter(sourceId => connected.has(sourceId)),
    missingSourceIds: sourceIds.filter(sourceId => !connected.has(sourceId)),
    pairAssessments,
    sampleCount: passing.reduce((sum, assessment) => sum + assessment.sampleCount, 0),
    rmseMm: passing.length
      ? Math.sqrt(passing.reduce((sum, assessment) => sum + assessment.rmseMm ** 2, 0) / passing.length)
      : 0,
  };
};

/** A captured physical disagreement always revokes an earlier approval. */
export const shouldRevokeAlignment = (
  assessment: AlignmentNetworkAssessment,
): boolean => Object.values(assessment.pairAssessments).some(
  pair => pair.reason === 'too_far_apart',
);

/**
 * Polynomial maximum-cardinality, minimum-cost bipartite association.
 * Successive shortest augmenting paths avoid exponential backtracking when a
 * room contains many radars or targets.
 */
export const minimumCostMaximumCardinalityMatches = (
  leftCount: number,
  rightCount: number,
  cost: (leftIndex: number, rightIndex: number) => number | null,
): Map<number, number> => {
  interface Edge { to: number; reverse: number; capacity: number; cost: number; original: boolean; }
  const source = 0;
  const leftOffset = 1;
  const rightOffset = leftOffset + leftCount;
  const sink = rightOffset + rightCount;
  const graph: Edge[][] = Array.from({ length: sink + 1 }, () => []);
  const addEdge = (from: number, to: number, edgeCost: number, original = false): void => {
    const forward: Edge = { to, reverse: graph[to].length, capacity: 1, cost: edgeCost, original };
    const reverse: Edge = { to: from, reverse: graph[from].length, capacity: 0, cost: -edgeCost, original: false };
    graph[from].push(forward);
    graph[to].push(reverse);
  };
  for (let left = 0; left < leftCount; left += 1) addEdge(source, leftOffset + left, 0);
  for (let right = 0; right < rightCount; right += 1) addEdge(rightOffset + right, sink, 0);
  for (let left = 0; left < leftCount; left += 1) {
    for (let right = 0; right < rightCount; right += 1) {
      const edgeCost = cost(left, right);
      if (edgeCost !== null && Number.isFinite(edgeCost)) addEdge(leftOffset + left, rightOffset + right, edgeCost, true);
    }
  }
  while (true) {
    const distance = Array(graph.length).fill(Number.POSITIVE_INFINITY);
    const previousNode = Array(graph.length).fill(-1);
    const previousEdge = Array(graph.length).fill(-1);
    distance[source] = 0;
    for (let iteration = 0; iteration < graph.length - 1; iteration += 1) {
      let changed = false;
      for (let node = 0; node < graph.length; node += 1) {
        if (!Number.isFinite(distance[node])) continue;
        graph[node].forEach((edge, edgeIndex) => {
          const candidate = distance[node] + edge.cost;
          if (edge.capacity > 0 && candidate < distance[edge.to] - 1e-9) {
            distance[edge.to] = candidate;
            previousNode[edge.to] = node;
            previousEdge[edge.to] = edgeIndex;
            changed = true;
          }
        });
      }
      if (!changed) break;
    }
    if (previousNode[sink] < 0) break;
    for (let node = sink; node !== source; node = previousNode[node]) {
      const edge = graph[previousNode[node]][previousEdge[node]];
      edge.capacity -= 1;
      graph[node][edge.reverse].capacity += 1;
    }
  }
  const matches = new Map<number, number>();
  for (let left = 0; left < leftCount; left += 1) {
    graph[leftOffset + left].forEach(edge => {
      if (edge.original && edge.capacity === 0 && edge.to >= rightOffset && edge.to < sink) {
        matches.set(left, edge.to - rightOffset);
      }
    });
  }
  return matches;
};

const compatibleZ = (first: FusedObservation, second: TrackObservation, tolerance: number): boolean =>
  first.roomZMm === null || second.roomZMm === null || Math.abs(first.roomZMm - second.roomZMm) <= tolerance;

/**
 * Merge only cross-source observations. Each fused group can contain at most
 * one local track from a source, so two people reported by one radar survive.
 */
export const fuseObservations = (
  observations: TrackObservation[],
  options: FusionOptions,
  confirmedPairs?: ReadonlySet<string>,
): FusedObservation[] => {
  const bySource = new Map<string, TrackObservation[]>();
  observations.forEach(observation => bySource.set(
    observation.sourceId,
    [...(bySource.get(observation.sourceId) || []), observation],
  ));
  const sourceGroups = [...bySource.values()]
    .map(group => [...group].sort((a, b) => a.localTrackId.localeCompare(b.localTrackId)))
    .sort((a, b) => b.length - a.length || a[0].sourceId.localeCompare(b[0].sourceId));
  const fused: FusedObservation[] = [];
  sourceGroups.forEach(group => {
    if (!fused.length) {
      fused.push(...group.map(observation => ({
        x: observation.x, y: observation.y,
        rawZMm: observation.rawZMm, roomZMm: observation.roomZMm,
        observedAtMs: observation.observedAtMs,
        roomZContributorCount: observation.roomZMm === null ? 0 : 1,
        memberIds: [`${observation.sourceId}:${observation.localTrackId}`],
        sourceIds: [observation.sourceId],
      })));
      return;
    }
    const bestMatches = minimumCostMaximumCardinalityMatches(group.length, fused.length, (groupIndex, fusedIndex) => {
      const observation = group[groupIndex];
      const existing = fused[fusedIndex];
      if (existing.sourceIds.includes(observation.sourceId)
        || !compatibleZ(existing, observation, options.zToleranceMm)) return null;
      if (confirmedPairs && !existing.memberIds.every(memberId => confirmedPairs.has(pairKey(
        memberId,
        `${observation.sourceId}:${observation.localTrackId}`,
      )))) return null;
      const distance = Math.hypot(existing.x - observation.x, existing.y - observation.y);
      return distance <= options.duplicateDistanceMm ? distance : null;
    });
    group.forEach((observation, groupIndex) => {
      const fusedIndex = bestMatches.get(groupIndex);
      if (fusedIndex === undefined) return;
      const existing = fused[fusedIndex];
      const count = existing.memberIds.length;
      existing.x = (existing.x * count + observation.x) / (count + 1);
      existing.y = (existing.y * count + observation.y) / (count + 1);
      if (observation.roomZMm !== null) {
        const mappedCount = existing.roomZContributorCount || 0;
        existing.roomZMm = ((existing.roomZMm || 0) * mappedCount + observation.roomZMm) / (mappedCount + 1);
        existing.roomZContributorCount = mappedCount + 1;
      }
      if (observation.rawZMm !== null && existing.rawZMm === null) existing.rawZMm = observation.rawZMm;
      existing.observedAtMs = Math.max(existing.observedAtMs, observation.observedAtMs);
      existing.memberIds.push(`${observation.sourceId}:${observation.localTrackId}`);
      existing.sourceIds.push(observation.sourceId);
    });
    group.forEach((observation, index) => {
      if (bestMatches.has(index)) return;
      fused.push({
        x: observation.x, y: observation.y,
        rawZMm: observation.rawZMm, roomZMm: observation.roomZMm,
        observedAtMs: observation.observedAtMs,
        roomZContributorCount: observation.roomZMm === null ? 0 : 1,
        memberIds: [`${observation.sourceId}:${observation.localTrackId}`],
        sourceIds: [observation.sourceId],
      });
    });
  });
  return fused;
};

interface PairEvidence {
  sightings: number;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
  lastReportA: number;
  lastReportB: number;
  firstA: TrackingPoint;
  firstB: TrackingPoint;
  confirmed: boolean;
}

/**
 * Do not collapse two nearby source tracks after a single frame. A pair must
 * stay reciprocal, update repeatedly and show correlated movement first.
 * Static ambiguity remains visible and the people count stays unknown.
 */
export class CrossSourceAssociationGate {
  private evidence = new Map<string, PairEvidence>();

  reset(): void { this.evidence.clear(); }

  update(observations: TrackObservation[], options: FusionOptions): AssociationAssessment {
    const candidates = new Map<string, { first: TrackObservation; second: TrackObservation }>();
    const plausiblePairs = new Set<string>();
    const competingMembers = new Set<string>();
    const sources = [...new Set(observations.map(observation => observation.sourceId))].sort();
    for (let firstIndex = 0; firstIndex < sources.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < sources.length; secondIndex += 1) {
        const firstGroup = observations.filter(item => item.sourceId === sources[firstIndex]);
        const secondGroup = observations.filter(item => item.sourceId === sources[secondIndex]);
        const firstDegrees = Array(firstGroup.length).fill(0);
        const secondDegrees = Array(secondGroup.length).fill(0);
        firstGroup.forEach((first, left) => secondGroup.forEach((second, right) => {
          const zCompatible = compatibleZ(
            { ...first, memberIds: [], sourceIds: [], roomZContributorCount: 0 },
            second,
            options.zToleranceMm,
          );
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          const reportSkewMs = Math.abs(first.observedAtMs - second.observedAtMs);
          // At asynchronous report times, one walker can legitimately be
          // farther apart than the merge radius. Keep the count unknown for
          // any cross-source pair reachable at a conservative 3 m/s instead
          // of claiming two people from two different moments in time.
          const ambiguityDistance = options.duplicateDistanceMm + 3 * reportSkewMs;
          if (zCompatible && distance <= ambiguityDistance) {
            plausiblePairs.add(pairKey(
              `${first.sourceId}:${first.localTrackId}`,
              `${second.sourceId}:${second.localTrackId}`,
            ));
          }
          const compatible = zCompatible && distance <= options.duplicateDistanceMm;
          if (compatible) {
            firstDegrees[left] += 1;
            secondDegrees[right] += 1;
          }
        }));
        firstGroup.forEach((first, index) => {
          if (firstDegrees[index] > 1) competingMembers.add(`${first.sourceId}:${first.localTrackId}`);
        });
        secondGroup.forEach((second, index) => {
          if (secondDegrees[index] > 1) competingMembers.add(`${second.sourceId}:${second.localTrackId}`);
        });
        const matches = minimumCostMaximumCardinalityMatches(firstGroup.length, secondGroup.length, (left, right) => {
          const first = firstGroup[left];
          const second = secondGroup[right];
          if (!compatibleZ({ ...first, memberIds: [], sourceIds: [], roomZContributorCount: 0 }, second, options.zToleranceMm)) return null;
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          return distance <= options.duplicateDistanceMm ? distance : null;
        });
        matches.forEach((right, left) => {
          const first = firstGroup[left];
          const second = secondGroup[right];
          candidates.set(pairKey(`${first.sourceId}:${first.localTrackId}`, `${second.sourceId}:${second.localTrackId}`), { first, second });
        });
      }
    }
    const confirmedPairs = new Set<string>();
    candidates.forEach(({ first, second }, key) => {
      const existing = this.evidence.get(key);
      if (!existing) {
        this.evidence.set(key, {
          sightings: 1,
          firstSeenAtMs: Math.min(first.observedAtMs, second.observedAtMs),
          lastSeenAtMs: Math.max(first.observedAtMs, second.observedAtMs),
          lastReportA: first.observedAtMs,
          lastReportB: second.observedAtMs,
          firstA: first,
          firstB: second,
          confirmed: false,
        });
        return;
      }
      const firstAdvanced = first.observedAtMs > existing.lastReportA;
      const secondAdvanced = second.observedAtMs > existing.lastReportB;
      const bothAdvanced = firstAdvanced && secondAdvanced;
      if (bothAdvanced) {
        existing.sightings += 1;
        // Consume the pair only when both devices have supplied a newer
        // report. This lets asynchronous A-then-B updates become one piece of
        // correlation evidence instead of requiring the same browser poll.
        existing.lastReportA = first.observedAtMs;
        existing.lastReportB = second.observedAtMs;
      }
      existing.lastSeenAtMs = Math.max(first.observedAtMs, second.observedAtMs);
      const movementA = Math.hypot(first.x - existing.firstA.x, first.y - existing.firstA.y);
      const movementB = Math.hypot(second.x - existing.firstB.x, second.y - existing.firstB.y);
      const relativeStart = { x: existing.firstA.x - existing.firstB.x, y: existing.firstA.y - existing.firstB.y };
      const relativeNow = { x: first.x - second.x, y: first.y - second.y };
      const relativeDrift = Math.hypot(relativeNow.x - relativeStart.x, relativeNow.y - relativeStart.y);
      const movementDifference = Math.abs(movementA - movementB);
      const firstMember = `${first.sourceId}:${first.localTrackId}`;
      const secondMember = `${second.sourceId}:${second.localTrackId}`;
      const competitive = competingMembers.has(firstMember) || competingMembers.has(secondMember);
      const reportSkewGraceMs = Math.max(500, options.reportSkewGraceMs ?? 1500);
      const staleOneSidedPair = firstAdvanced !== secondAdvanced
        && Math.abs(first.observedAtMs - second.observedAtMs) > reportSkewGraceMs;
      const maximumRelativeDrift = Math.min(250, options.duplicateDistanceMm * 0.4);
      const inconsistent = movementDifference > 150
        || relativeDrift > maximumRelativeDrift;
      const correlated = movementA >= 300
        && movementB >= 300
        && !inconsistent;
      // Independent ESPHome devices rarely report in the same browser poll.
      // Short one-sided skew is normal for independent ESPHome devices. Once
      // that skew exceeds the bounded grace period, retaining a confirmation
      // could merge a fresh person with a frozen old target indefinitely, so
      // split conservatively until correlated reports rebuild the evidence.
      if (competitive || staleOneSidedPair || (bothAdvanced && inconsistent)) {
        existing.confirmed = false;
        existing.sightings = 1;
        existing.firstSeenAtMs = Math.min(first.observedAtMs, second.observedAtMs);
        existing.lastReportA = first.observedAtMs;
        existing.lastReportB = second.observedAtMs;
        existing.firstA = first;
        existing.firstB = second;
      }
      if (existing.sightings >= 4
        && existing.lastSeenAtMs - existing.firstSeenAtMs >= 750
        && bothAdvanced
        && correlated
        && !competitive) {
        existing.confirmed = true;
      }
      if (existing.confirmed) confirmedPairs.add(key);
    });
    this.evidence.forEach((value, key) => {
      if (!candidates.has(key)) {
        if (!plausiblePairs.has(key)) this.evidence.delete(key);
        return;
      }
      if (value.confirmed) confirmedPairs.add(key);
    });
    const confirmedAdjacency = new Map<string, Set<string>>();
    candidates.forEach(({ first, second }, key) => {
      if (!confirmedPairs.has(key)) return;
      const firstMember = `${first.sourceId}:${first.localTrackId}`;
      const secondMember = `${second.sourceId}:${second.localTrackId}`;
      confirmedAdjacency.set(firstMember, new Set([
        ...(confirmedAdjacency.get(firstMember) || []), secondMember,
      ]));
      confirmedAdjacency.set(secondMember, new Set([
        ...(confirmedAdjacency.get(secondMember) || []), firstMember,
      ]));
    });
    let incompleteConfirmedGroup = false;
    const visited = new Set<string>();
    confirmedAdjacency.forEach((_neighbours, root) => {
      if (visited.has(root)) return;
      const component: string[] = [];
      const pending = [root];
      while (pending.length) {
        const member = pending.pop()!;
        if (visited.has(member)) continue;
        visited.add(member);
        component.push(member);
        confirmedAdjacency.get(member)?.forEach(neighbour => pending.push(neighbour));
      }
      for (let first = 0; first < component.length - 1; first += 1) {
        for (let second = first + 1; second < component.length; second += 1) {
          if (!confirmedPairs.has(pairKey(component[first], component[second]))) {
            incompleteConfirmedGroup = true;
          }
        }
      }
    });
    return {
      confirmedPairs,
      ambiguous: plausiblePairs.size > confirmedPairs.size
        || candidates.size > confirmedPairs.size
        || competingMembers.size > 0
        || incompleteConfirmedGroup,
      candidatePairs: candidates.size,
    };
  }
}

/** Short-lived in-browser track identity for smooth overlap and handover. */
export class MultiSensorTrackEngine {
  private tracks: Array<RoomTrack & {
    vx: number;
    vy: number;
    lastSeenAtMs: number;
    lastObservationAtMs: number;
    visible: boolean;
  }> = [];
  private nextId = 1;

  reset(): void {
    this.tracks = [];
    this.nextId = 1;
  }

  update(observations: FusedObservation[], nowMs: number, options: TrackEngineOptions): RoomTrack[] {
    // Matching gets a small grace window even when visual hold is disabled.
    // This preserves identity between two consecutive fresh reports without
    // leaving an absent marker on screen.
    const associationGraceMs = Math.max(1000, options.holdMs);
    const eligibleTracks = this.tracks.filter(track => nowMs - track.lastSeenAtMs <= associationGraceMs);
    const candidateCost = (trackIndex: number, observationIndex: number): number | null => {
      const track = eligibleTracks[trackIndex];
      const observation = observations[observationIndex];
      const elapsed = Math.max(0, observation.observedAtMs - track.lastObservationAtMs) / 1000;
      const predictionHorizon = Math.min(0.75, elapsed);
      const reportSilence = Math.max(0, nowMs - track.lastObservationAtMs) / 1000;
      const velocityWeight = Math.max(0, 1 - reportSilence / 1.5);
      const predictedX = track.x + track.vx * predictionHorizon * velocityWeight;
      const predictedY = track.y + track.vy * predictionHorizon * velocityWeight;
      const distance = Math.hypot(predictedX - observation.x, predictedY - observation.y);
      const sharedMember = observation.memberIds.some(memberId => track.memberIds.includes(memberId));
      const continuityGate = options.matchDistanceMm + (sharedMember ? Math.min(2500, 2500 * elapsed) : 0);
      if (distance > continuityGate) return null;
      return distance - (sharedMember ? options.matchDistanceMm * 0.25 : 0);
    };
    const bestMatches = minimumCostMaximumCardinalityMatches(
      observations.length,
      eligibleTracks.length,
      (observationIndex, trackIndex) => candidateCost(trackIndex, observationIndex),
    );

    const matchedTrackIndexes = new Set(bestMatches.values());
    const next: typeof this.tracks = [];
    observations.forEach((observation, observationIndex) => {
      const trackIndex = bestMatches.get(observationIndex);
      if (trackIndex === undefined) {
        next.push({
          ...observation,
          id: `room-track-${this.nextId++}`,
          held: false,
          vx: 0,
          vy: 0,
          lastSeenAtMs: nowMs,
          lastObservationAtMs: observation.observedAtMs,
          visible: true,
        });
        return;
      }
      const previous = eligibleTracks[trackIndex];
      const hasNewObservation = observation.observedAtMs > previous.lastObservationAtMs;
      const elapsedSeconds = Math.max(0.05, (observation.observedAtMs - previous.lastObservationAtMs) / 1000);
      const rawVx = hasNewObservation ? (observation.x - previous.x) / elapsedSeconds : previous.vx;
      const rawVy = hasNewObservation ? (observation.y - previous.y) / elapsedSeconds : previous.vy;
      const speed = Math.hypot(rawVx, rawVy);
      const velocityScale = speed > 5000 ? 5000 / speed : 1;
      next.push({
        ...observation,
        id: previous.id,
        held: false,
        vx: rawVx * velocityScale,
        vy: rawVy * velocityScale,
        lastSeenAtMs: nowMs,
        lastObservationAtMs: hasNewObservation ? observation.observedAtMs : previous.lastObservationAtMs,
        visible: true,
      });
    });
    eligibleTracks.forEach((track, index) => {
      if (!matchedTrackIndexes.has(index) && nowMs - track.lastSeenAtMs <= associationGraceMs) {
        next.push({
          ...track,
          held: nowMs - track.lastSeenAtMs <= options.holdMs,
          visible: nowMs - track.lastSeenAtMs <= options.holdMs,
        });
      }
    });
    this.tracks = next.sort((a, b) => a.id.localeCompare(b.id));
    return this.tracks.filter(track => track.visible).map(({
      vx: _vx,
      vy: _vy,
      lastSeenAtMs: _lastSeenAtMs,
      lastObservationAtMs: _lastObservationAtMs,
      visible: _visible,
      ...track
    }) => track);
  }
}
