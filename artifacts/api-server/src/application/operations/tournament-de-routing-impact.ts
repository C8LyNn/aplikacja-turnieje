/**
 * Pack 11: compare two evaluations of the SAME compiled DE routing plan.
 * The counterfactual evaluation is produced by correctRoutingMatchResultV2;
 * this module only explains that difference. Never write or authorize a result.
 */
import type {
  CompiledTournamentRoutingPlanV2,
  RoutingExecutionEvaluationV2,
} from "../../domain/tournament/v2";
import type { CorrectionPreview } from "./tournament-result-correction-preflight";

export type DoubleEliminationCorrectionImpact =
  | { status: "unavailable"; reasonCode: string; message: string }
  | {
      status: "available";
      provisional: true;
      scope: "double_elimination_routing_v2";
      stageId: number;
      sourceMatchKey: string;
      winnerChanges: boolean;
      currentWinnerId: number;
      proposedWinnerId: number;
      planRevision: number;
      executionRevision: number;
      upstreamRoutes: Array<{
        routeKey: string;
        outcome: "winner" | "loser";
        targetMatchKey: string;
        targetSlot: 1 | 2;
      }>;
      affectedMatches: Array<{
        matchKey: string;
        label: string;
        currentStatus: string;
        hypotheticalStatus: string;
        currentSlots: [string | null, string | null];
        hypotheticalSlots: [string | null, string | null];
        existingCanonicalMatchId: number | null;
        canonicalMatchAlreadyCompleted: boolean;
      }>;
      invalidatedDecisions: Array<{ matchKey: string; canonicalMatchId: number | null; canonicalMatchAlreadyCompleted: boolean }>;
      currentChampionId: number | null;
      hypotheticalChampionId: number | null;
      warningCodes: string[];
      note: string;
    };

export interface CanonicalRoutingMatchSnapshot {
  id: number;
  routingMatchKey: string | null;
  status: string;
  winnerId: number | null;
  player1Id: number | null;
  player2Id: number | null;
}

export interface DeImpactInput {
  stageId: number;
  stageKey: string;
  matchKey: string | null;
  matchId: number;
  matchRevision: number;
  actualWinnerId: number | null;
  preflight: CorrectionPreview;
  plan: CompiledTournamentRoutingPlanV2;
  planRevision: number;
  executionRevision: number;
  canonicalMatches: readonly CanonicalRoutingMatchSnapshot[];
  current: RoutingExecutionEvaluationV2;
  hypothetical: RoutingExecutionEvaluationV2;
}

const unavailable = (reasonCode: string, message: string): DoubleEliminationCorrectionImpact =>
  ({ status: "unavailable", reasonCode, message });

/** Actual engine evaluations, not approximate round-number propagation. */
export function deriveDoubleEliminationRoutingImpact(input: DeImpactInput): DoubleEliminationCorrectionImpact {
  const { preflight, current, hypothetical, matchKey, actualWinnerId } = input;
  if (!matchKey || preflight.matchId !== input.matchId ||
      preflight.expectedRevision !== input.matchRevision ||
      preflight.proposedResult.winnerId == null || actualWinnerId == null ||
      preflight.issues.some(issue => [
        "STALE_MATCH_REVISION", "INVALID_PROPOSED_RESULT", "MATCH_NOT_COMPLETED",
        "RESULT_INCONSISTENT", "PARTICIPANTS_INVALID", "SYSTEM_BYE_REVERT_BLOCKED",
        "RESULT_TYPE_REQUIRES_MANUAL_REVIEW", "STAGE_NOT_FOUND",
      ].includes(issue.code))) {
    return unavailable("INVALID_PREVIEW_STATE", "Dane meczu lub propozycja korekty są nieaktualne albo niespójne.");
  }
  if (current.snapshot.stageKey !== input.stageKey || hypothetical.snapshot.stageKey !== input.stageKey) {
    return unavailable("STAGE_KEY_MISMATCH", "Stan routingu nie należy do wskazanego etapu.");
  }
  const stageLogical = input.plan.logicalMatches.filter(m => m.stageKey === input.stageKey);
  const logical = new Map(stageLogical.map(m => [String(m.matchKey), m]));
  const source = logical.get(matchKey);
  if (!source || !Number.isSafeInteger(input.planRevision) || !Number.isSafeInteger(input.executionRevision)) {
    return unavailable("ROUTING_PLAN_MISMATCH", "Brakuje jednoznacznego, wersjonowanego meczu logicznego DE.");
  }
  const currentByKey = new Map(current.matches.map(m => [m.matchKey, m]));
  const hypotheticalByKey = new Map(hypothetical.matches.map(m => [m.matchKey, m]));
  const actual = currentByKey.get(matchKey);
  if (!actual || actual.status !== "completed" || actual.winnerParticipantKey !== String(actualWinnerId)) {
    return unavailable("ROUTING_DECISION_MISMATCH", "Wynik meczu nie zgadza się z zapisaną decyzją silnika DE.");
  }
  const decisions = new Map(current.snapshot.decisions.map(d => [d.matchKey, d.winnerParticipantKey]));
  if (decisions.get(matchKey) !== String(actualWinnerId)) {
    return unavailable("ROUTING_DECISION_MISSING", "Nie znaleziono zgodnej, zatwierdzonej decyzji silnika DE.");
  }
  const canonicalByKey = new Map<string, CanonicalRoutingMatchSnapshot>();
  for (const row of input.canonicalMatches) {
    if (!row.routingMatchKey) continue;
    if (canonicalByKey.has(row.routingMatchKey) || !logical.has(row.routingMatchKey)) {
      return unavailable("CANONICAL_MATCH_MISMATCH", "Mecze kanoniczne DE mają zduplikowane lub nieznane klucze.");
    }
    canonicalByKey.set(row.routingMatchKey, row);
    const evaluated = currentByKey.get(row.routingMatchKey);
    if (!evaluated) return unavailable("CANONICAL_MATCH_MISMATCH", "Nie znaleziono odpowiadającego meczu logicznego w stanie DE.");
    if (row.status === "completed" && (evaluated.status !== "completed" ||
        evaluated.winnerParticipantKey !== String(row.winnerId))) {
      return unavailable("CANONICAL_RESULT_MISMATCH", "Wynik jednego z meczów kanonicznych nie zgadza się ze stanem routingu.");
    }
  }
  const selectedCanonical = canonicalByKey.get(matchKey);
  if (!selectedCanonical || selectedCanonical.id !== input.matchId || selectedCanonical.winnerId !== actualWinnerId ||
      selectedCanonical.status !== "completed") {
    return unavailable("SOURCE_CANONICAL_MISMATCH", "Mecz źródłowy nie odpowiada aktualnemu wynikowi DE.");
  }
  if (current.matches.length !== hypothetical.matches.length ||
      current.matches.some(m => !hypotheticalByKey.has(m.matchKey))) {
    return unavailable("ROUTING_GRAPH_CHANGED", "Porównywane stany zawierają różne struktury meczów.");
  }
  const retained = new Set(hypothetical.snapshot.decisions.map(d => d.matchKey));
  if (hypothetical.snapshot.decisions.some(d => d.matchKey === matchKey && d.winnerParticipantKey !== String(preflight.proposedResult.winnerId))) {
    return unavailable("HYPOTHETICAL_DECISION_MISMATCH", "Symulacja nie zachowała proponowanego zwycięzcy.");
  }
  const invalidatedDecisions = current.snapshot.decisions.filter(d => !retained.has(d.matchKey))
    .map(d => ({
      matchKey: d.matchKey,
      canonicalMatchId: canonicalByKey.get(d.matchKey)?.id ?? null,
      canonicalMatchAlreadyCompleted: canonicalByKey.get(d.matchKey)?.status === "completed",
    }));
  const keyOrder = new Map(stageLogical.map(m => [String(m.matchKey), m.order]));
  const affectedMatches = current.matches.flatMap(before => {
    const after = hypotheticalByKey.get(before.matchKey)!;
    if (before.status === after.status && before.winnerParticipantKey === after.winnerParticipantKey &&
        before.slots[0] === after.slots[0] && before.slots[1] === after.slots[1]) return [];
    const row = canonicalByKey.get(before.matchKey);
    return [{
      matchKey: before.matchKey,
      label: logical.get(before.matchKey)?.name ?? before.matchKey,
      currentStatus: before.status,
      hypotheticalStatus: after.status,
      currentSlots: [before.slots[0], before.slots[1]] as [string | null, string | null],
      hypotheticalSlots: [after.slots[0], after.slots[1]] as [string | null, string | null],
      existingCanonicalMatchId: row?.id ?? null,
      canonicalMatchAlreadyCompleted: row?.status === "completed",
    }];
  }).sort((a, b) => (keyOrder.get(a.matchKey) ?? Infinity) - (keyOrder.get(b.matchKey) ?? Infinity));
  const upstreamRoutes = input.plan.routes.flatMap(route => {
    if (route.source.type !== "match_outcome" || String(route.source.matchKey) !== matchKey ||
        String(route.source.stageKey) !== input.stageKey || route.target.type !== "match_slot" ||
        String(route.target.stageKey) !== input.stageKey) return [];
    return [{ routeKey: String(route.routeKey), outcome: route.source.outcome,
      targetMatchKey: String(route.target.matchKey), targetSlot: route.target.slot }];
  });
  const parseChampion = (s: string | null): number | null => {
    if (s == null) return null;
    const value = Number(s);
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  };
  const warningCodes = new Set<string>();
  if (invalidatedDecisions.some(d => d.matchKey !== matchKey)) warningCodes.add("DOWNSTREAM_RESULTS_INVALIDATED");
  if (affectedMatches.some(d => d.canonicalMatchAlreadyCompleted && d.matchKey !== matchKey)) warningCodes.add("COMPLETED_CANONICAL_MATCH_AFFECTED");
  if (current.completed !== hypothetical.completed) warningCodes.add("COMPLETION_STATUS_CHANGED");
  if (!upstreamRoutes.length) warningCodes.add("NO_DIRECT_ROUTE_EVIDENCE");
  return {
    status: "available", provisional: true, scope: "double_elimination_routing_v2",
    stageId: input.stageId, sourceMatchKey: matchKey,
    winnerChanges: preflight.proposedResult.winnerId !== actualWinnerId,
    currentWinnerId: actualWinnerId, proposedWinnerId: preflight.proposedResult.winnerId,
    planRevision: input.planRevision, executionRevision: input.executionRevision,
    upstreamRoutes, affectedMatches, invalidatedDecisions,
    currentChampionId: parseChampion(current.championParticipantKey),
    hypotheticalChampionId: parseChampion(hypothetical.championParticipantKey),
    warningCodes: [...warningCodes],
    note: "Hipotetyczna symulacja stanu DE oparta na zapisanym planie routingu, nie na numerach rund. Zmiany w meczach nie są zapisywane. Unieważnione decyzje mogą obejmować zakończone mecze. Wynik nie jest autoryzacją korekty; dopiero aktualna transakcja weryfikuje uprawnienia i spójność.",
  };
}
