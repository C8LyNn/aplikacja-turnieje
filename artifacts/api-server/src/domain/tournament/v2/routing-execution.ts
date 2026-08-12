import type {
  CompiledParticipantRouteV2,
  CompiledTournamentRoutingPlanV2,
  LogicalMatchKeyV2,
  RouteKeyV2,
  StageKeyV2,
} from "./compiled-routing-model";

export const ROUTING_EXECUTION_VERSION_V2 = 1 as const;

export interface RoutingExecutionEntryV2 {
  participantKey: string;
  position: number;
}

export interface RoutingExecutionDecisionV2 {
  matchKey: string;
  winnerParticipantKey: string;
}

export interface RoutingExecutionSnapshotV2 {
  executionVersion: typeof ROUTING_EXECUTION_VERSION_V2;
  stageKey: string;
  entries: readonly RoutingExecutionEntryV2[];
  decisions: readonly RoutingExecutionDecisionV2[];
}

export type RoutingExecutionMatchStatusV2 =
  | "blocked"
  | "ready"
  | "completed"
  | "bye"
  | "skipped";

export interface RoutingExecutionMatchV2 {
  matchKey: string;
  name?: string;
  order: number;
  slots: readonly [string | null, string | null];
  status: RoutingExecutionMatchStatusV2;
  winnerParticipantKey: string | null;
  loserParticipantKey: string | null;
}

export interface RoutingExecutionParticipantV2 {
  participantKey: string;
  losses: number;
  status: "active" | "eliminated" | "winner";
}

export interface RoutingExecutionEvaluationV2 {
  snapshot: RoutingExecutionSnapshotV2;
  matches: readonly RoutingExecutionMatchV2[];
  outputs: Readonly<Record<string, string>>;
  participants: readonly RoutingExecutionParticipantV2[];
  championParticipantKey: string | null;
  completed: boolean;
}

export class RoutingExecutionErrorV2 extends Error {
  constructor(
    public readonly code:
      | "INVALID_EXECUTION_SNAPSHOT"
      | "STAGE_NOT_FOUND"
      | "MATCH_NOT_FOUND"
      | "MATCH_NOT_READY"
      | "WINNER_NOT_PARTICIPANT"
      | "RESULT_NOT_FOUND"
      | "ROUTING_CONFLICT",
  ) {
    super(code);
    this.name = "RoutingExecutionErrorV2";
  }
}

interface RoutedParticipant {
  participantKey: string;
  lineages: Set<string>;
}

interface InternalMatch extends RoutingExecutionMatchV2 {
  winner: RoutedParticipant | null;
  loser: RoutedParticipant | null;
}

function pairKey(left: string, right: string): string {
  return `${left}\u0000${right}`;
}

function routeLineage(routeKey: RouteKeyV2): string {
  return `route:${routeKey}`;
}

function entryLineage(stageKey: string, entryKey: string): string {
  return `entry:${stageKey}/${entryKey}`;
}

function assertSnapshot(
  plan: CompiledTournamentRoutingPlanV2,
  snapshot: RoutingExecutionSnapshotV2,
): { stageKey: StageKeyV2; decisions: Map<string, string> } {
  if (
    snapshot.executionVersion !== ROUTING_EXECUTION_VERSION_V2 ||
    typeof snapshot.stageKey !== "string" ||
    !snapshot.stageKey.trim() ||
    !Array.isArray(snapshot.entries) ||
    !Array.isArray(snapshot.decisions)
  ) {
    throw new RoutingExecutionErrorV2("INVALID_EXECUTION_SNAPSHOT");
  }
  const stage = plan.stages.find((candidate) => candidate.stageKey === snapshot.stageKey);
  if (!stage) throw new RoutingExecutionErrorV2("STAGE_NOT_FOUND");
  const entryKeys = plan.entryPoints
    .filter((entry) => entry.stageKey === stage.stageKey)
    .map((entry) => entry.entryKey);
  if (entryKeys.length !== 1) {
    throw new RoutingExecutionErrorV2("INVALID_EXECUTION_SNAPSHOT");
  }
  const participantKeys = new Set<string>();
  const positions = new Set<number>();
  for (const entry of snapshot.entries) {
    if (
      typeof entry.participantKey !== "string" ||
      !entry.participantKey.trim() ||
      !Number.isInteger(entry.position) ||
      entry.position < 1 ||
      entry.position > stage.exactParticipantCapacity ||
      participantKeys.has(entry.participantKey) ||
      positions.has(entry.position)
    ) {
      throw new RoutingExecutionErrorV2("INVALID_EXECUTION_SNAPSHOT");
    }
    participantKeys.add(entry.participantKey);
    positions.add(entry.position);
  }
  if (snapshot.entries.length !== stage.exactParticipantCapacity) {
    throw new RoutingExecutionErrorV2("INVALID_EXECUTION_SNAPSHOT");
  }
  const decisions = new Map<string, string>();
  for (const decision of snapshot.decisions) {
    if (
      typeof decision.matchKey !== "string" ||
      !decision.matchKey.trim() ||
      typeof decision.winnerParticipantKey !== "string" ||
      !participantKeys.has(decision.winnerParticipantKey) ||
      decisions.has(decision.matchKey)
    ) {
      throw new RoutingExecutionErrorV2("INVALID_EXECUTION_SNAPSHOT");
    }
    decisions.set(decision.matchKey, decision.winnerParticipantKey);
  }
  return { stageKey: stage.stageKey, decisions };
}

function cloneParticipant(
  participant: RoutedParticipant,
  routeKey: RouteKeyV2,
): RoutedParticipant {
  return {
    participantKey: participant.participantKey,
    lineages: new Set([...participant.lineages, routeLineage(routeKey)]),
  };
}

function conditionSatisfied(
  route: CompiledParticipantRouteV2,
  participant: RoutedParticipant | null,
  matchByKey: ReadonlyMap<string, InternalMatch>,
): { settled: boolean; matches: boolean } {
  if (route.condition.type === "always") return { settled: true, matches: true };
  if (route.condition.type === "participant_lineage") {
    if (participant == null) return { settled: true, matches: false };
    const lineage = route.condition.lineage;
    return {
      settled: true,
      matches: participant.lineages.has(
        lineage.type === "route"
          ? routeLineage(lineage.routeKey)
          : entryLineage(lineage.stageKey, lineage.entryKey),
      ),
    };
  }
  const conditionMatch = matchByKey.get(route.condition.matchKey);
  if (
    conditionMatch == null ||
    !["completed", "bye", "skipped"].includes(conditionMatch.status)
  ) {
    return { settled: false, matches: false };
  }
  const winner = conditionMatch.winner;
  if (winner == null) return { settled: true, matches: false };
  const lineage = route.condition.lineage;
  return {
    settled: true,
    matches: winner.lineages.has(
      lineage.type === "route"
        ? routeLineage(lineage.routeKey)
        : entryLineage(lineage.stageKey, lineage.entryKey),
    ),
  };
}

function routeSource(
  route: CompiledParticipantRouteV2,
  snapshot: RoutingExecutionSnapshotV2,
  stageKey: StageKeyV2,
  entryKey: string,
  matchByKey: ReadonlyMap<string, InternalMatch>,
): { settled: boolean; participant: RoutedParticipant | null } {
  if (route.source.type === "stage_entry") {
    const source = route.source;
    if (source.stageKey !== stageKey || source.entryKey !== entryKey) {
      return { settled: false, participant: null };
    }
    const entry = snapshot.entries.find(
      (candidate) => candidate.position === source.position,
    );
    return {
      settled: true,
      participant: entry == null
        ? null
        : {
            participantKey: entry.participantKey,
            lineages: new Set([entryLineage(stageKey, entryKey)]),
          },
    };
  }
  if (route.source.type !== "match_outcome") {
    return { settled: false, participant: null };
  }
  const match = matchByKey.get(route.source.matchKey);
  if (match == null || !["completed", "bye", "skipped"].includes(match.status)) {
    return { settled: false, participant: null };
  }
  return {
    settled: true,
    participant: route.source.outcome === "winner" ? match.winner : match.loser,
  };
}

function evaluateOnce(
  plan: CompiledTournamentRoutingPlanV2,
  snapshot: RoutingExecutionSnapshotV2,
  decisions: ReadonlyMap<string, string>,
): { evaluation: RoutingExecutionEvaluationV2; usedDecisions: Set<string> } {
  const { stageKey } = assertSnapshot(plan, snapshot);
  const entry = plan.entryPoints.find((candidate) => candidate.stageKey === stageKey)!;
  const planMatches = plan.logicalMatches
    .filter((match) => match.stageKey === stageKey)
    .sort((left, right) => left.order - right.order || left.matchKey.localeCompare(right.matchKey));
  const matchByKey = new Map<string, InternalMatch>(
    planMatches.map((match) => [
      match.matchKey,
      {
        matchKey: match.matchKey,
        ...(match.name == null ? {} : { name: match.name }),
        order: match.order,
        slots: [null, null],
        status: "blocked",
        winnerParticipantKey: null,
        loserParticipantKey: null,
        winner: null,
        loser: null,
      },
    ]),
  );
  const routes = plan.routes.filter((route) => {
    const sourceStage = route.source.type === "registration_bucket"
      ? null
      : route.source.stageKey;
    return sourceStage === stageKey || route.target.stageKey === stageKey;
  });
  const usedDecisions = new Set<string>();

  const incomingBySlot = new Map<string, CompiledParticipantRouteV2[]>();
  for (const route of routes) {
    if (route.target.type !== "match_slot" || route.target.stageKey !== stageKey) continue;
    const key = pairKey(route.target.matchKey, String(route.target.slot));
    const incoming = incomingBySlot.get(key) ?? [];
    incoming.push(route);
    incomingBySlot.set(key, incoming);
  }

  for (let pass = 0; pass <= planMatches.length; pass += 1) {
    let changed = false;
    for (const planMatch of planMatches) {
      const match = matchByKey.get(planMatch.matchKey)!;
      if (match.status !== "blocked") continue;
      const delivered: Array<RoutedParticipant | null> = [null, null];
      let allSettled = true;
      for (const slot of [1, 2] as const) {
        const incoming = incomingBySlot.get(pairKey(planMatch.matchKey, String(slot))) ?? [];
        const candidates: RoutedParticipant[] = [];
        for (const route of incoming) {
          const source = routeSource(route, snapshot, stageKey, entry.entryKey, matchByKey);
          if (!source.settled) {
            allSettled = false;
            continue;
          }
          const condition = conditionSatisfied(route, source.participant, matchByKey);
          if (!condition.settled) {
            allSettled = false;
            continue;
          }
          if (condition.matches && source.participant != null) {
            candidates.push(cloneParticipant(source.participant, route.routeKey));
          }
        }
        if (candidates.length > 1) {
          throw new RoutingExecutionErrorV2("ROUTING_CONFLICT");
        }
        delivered[slot - 1] = candidates[0] ?? null;
      }
      if (!allSettled) continue;
      const occupied = delivered.filter((value): value is RoutedParticipant => value != null);
      match.slots = [delivered[0]?.participantKey ?? null, delivered[1]?.participantKey ?? null];
      if (occupied.length === 0) {
        match.status = "skipped";
      } else if (occupied.length === 1) {
        match.status = "bye";
        match.winner = occupied[0];
        match.winnerParticipantKey = occupied[0].participantKey;
      } else {
        const decision = decisions.get(planMatch.matchKey);
        if (decision == null || !occupied.some((value) => value.participantKey === decision)) {
          match.status = "ready";
        } else {
          match.status = "completed";
          match.winner = occupied.find((value) => value.participantKey === decision)!;
          match.loser = occupied.find((value) => value.participantKey !== decision)!;
          match.winnerParticipantKey = match.winner.participantKey;
          match.loserParticipantKey = match.loser.participantKey;
          usedDecisions.add(planMatch.matchKey);
        }
      }
      changed = true;
    }
    if (!changed) break;
  }

  const outputs: Record<string, string> = {};
  for (const route of routes) {
    if (route.target.type !== "stage_output" || route.target.stageKey !== stageKey) continue;
    const source = routeSource(route, snapshot, stageKey, entry.entryKey, matchByKey);
    if (!source.settled || source.participant == null) continue;
    const condition = conditionSatisfied(route, source.participant, matchByKey);
    if (!condition.settled || !condition.matches) continue;
    const existing = outputs[route.target.outputKey];
    if (existing != null && existing !== source.participant.participantKey) {
      throw new RoutingExecutionErrorV2("ROUTING_CONFLICT");
    }
    outputs[route.target.outputKey] = source.participant.participantKey;
  }

  const champion = outputs.champion ?? null;
  const losses = new Map(snapshot.entries.map((item) => [item.participantKey, 0]));
  for (const match of matchByKey.values()) {
    if (match.status === "completed" && match.loserParticipantKey != null) {
      losses.set(match.loserParticipantKey, (losses.get(match.loserParticipantKey) ?? 0) + 1);
    }
  }
  const participants = snapshot.entries
    .map((item) => ({
      participantKey: item.participantKey,
      losses: losses.get(item.participantKey) ?? 0,
      status: champion === item.participantKey
        ? "winner" as const
        : (losses.get(item.participantKey) ?? 0) >= 2
          ? "eliminated" as const
          : "active" as const,
    }))
    .sort((left, right) => left.participantKey.localeCompare(right.participantKey));

  return {
    usedDecisions,
    evaluation: {
      snapshot,
      matches: [...matchByKey.values()].map(({ winner: _winner, loser: _loser, ...match }) => match),
      outputs,
      participants,
      championParticipantKey: champion,
      completed: champion != null,
    },
  };
}

export function evaluateRoutingExecutionV2(
  plan: CompiledTournamentRoutingPlanV2,
  snapshot: RoutingExecutionSnapshotV2,
): RoutingExecutionEvaluationV2 {
  const { decisions } = assertSnapshot(plan, snapshot);
  let normalized = new Map(decisions);
  for (;;) {
    const result = evaluateOnce(plan, snapshot, normalized);
    const stale = [...normalized.keys()].filter((key) => !result.usedDecisions.has(key));
    if (stale.length === 0) {
      const normalizedSnapshot: RoutingExecutionSnapshotV2 = {
        ...snapshot,
        entries: snapshot.entries.map((entry) => ({ ...entry })),
        decisions: [...normalized.entries()]
          .map(([matchKey, winnerParticipantKey]) => ({ matchKey, winnerParticipantKey }))
          .sort((left, right) => left.matchKey.localeCompare(right.matchKey)),
      };
      return evaluateOnce(plan, normalizedSnapshot, normalized).evaluation;
    }
    stale.forEach((key) => normalized.delete(key));
  }
}

export function createRoutingExecutionV2(
  plan: CompiledTournamentRoutingPlanV2,
  stageKey: string,
  participantKeysBySeed: readonly string[],
): RoutingExecutionEvaluationV2 {
  const snapshot: RoutingExecutionSnapshotV2 = {
    executionVersion: ROUTING_EXECUTION_VERSION_V2,
    stageKey,
    entries: participantKeysBySeed.map((participantKey, index) => ({
      participantKey,
      position: index + 1,
    })),
    decisions: [],
  };
  return evaluateRoutingExecutionV2(plan, snapshot);
}

export function recordRoutingMatchResultV2(
  plan: CompiledTournamentRoutingPlanV2,
  snapshot: RoutingExecutionSnapshotV2,
  matchKey: string,
  winnerParticipantKey: string,
): RoutingExecutionEvaluationV2 {
  const current = evaluateRoutingExecutionV2(plan, snapshot);
  const match = current.matches.find((candidate) => candidate.matchKey === matchKey);
  if (!match) throw new RoutingExecutionErrorV2("MATCH_NOT_FOUND");
  if (match.status !== "ready") throw new RoutingExecutionErrorV2("MATCH_NOT_READY");
  if (!match.slots.includes(winnerParticipantKey)) {
    throw new RoutingExecutionErrorV2("WINNER_NOT_PARTICIPANT");
  }
  return evaluateRoutingExecutionV2(plan, {
    ...current.snapshot,
    decisions: [
      ...current.snapshot.decisions,
      { matchKey, winnerParticipantKey },
    ],
  });
}

export function correctRoutingMatchResultV2(
  plan: CompiledTournamentRoutingPlanV2,
  snapshot: RoutingExecutionSnapshotV2,
  matchKey: string,
  winnerParticipantKey: string,
): RoutingExecutionEvaluationV2 {
  const existing = snapshot.decisions.find((decision) => decision.matchKey === matchKey);
  if (!existing) throw new RoutingExecutionErrorV2("RESULT_NOT_FOUND");
  const withoutTarget = snapshot.decisions.filter((decision) => decision.matchKey !== matchKey);
  const base = evaluateRoutingExecutionV2(plan, { ...snapshot, decisions: withoutTarget });
  const match = base.matches.find((candidate) => candidate.matchKey === matchKey);
  if (!match) throw new RoutingExecutionErrorV2("MATCH_NOT_FOUND");
  if (match.status !== "ready") throw new RoutingExecutionErrorV2("MATCH_NOT_READY");
  if (!match.slots.includes(winnerParticipantKey)) {
    throw new RoutingExecutionErrorV2("WINNER_NOT_PARTICIPANT");
  }
  return evaluateRoutingExecutionV2(plan, {
    ...base.snapshot,
    decisions: [...base.snapshot.decisions, { matchKey, winnerParticipantKey }],
  });
}

export function revertRoutingMatchResultV2(
  plan: CompiledTournamentRoutingPlanV2,
  snapshot: RoutingExecutionSnapshotV2,
  matchKey: string,
): RoutingExecutionEvaluationV2 {
  const existing = snapshot.decisions.find((decision) => decision.matchKey === matchKey);
  if (!existing) throw new RoutingExecutionErrorV2("RESULT_NOT_FOUND");
  return evaluateRoutingExecutionV2(plan, {
    ...snapshot,
    decisions: snapshot.decisions.filter((decision) => decision.matchKey !== matchKey),
  });
}

export function resetRoutingExecutionV2(
  plan: CompiledTournamentRoutingPlanV2,
  snapshot: RoutingExecutionSnapshotV2,
): RoutingExecutionEvaluationV2 {
  return evaluateRoutingExecutionV2(plan, { ...snapshot, decisions: [] });
}
