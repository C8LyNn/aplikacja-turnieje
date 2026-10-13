import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveDoubleEliminationRoutingImpact, type DeImpactInput } from "../src/application/operations/tournament-de-routing-impact";
import type { CorrectionPreview } from "../src/application/operations/tournament-result-correction-preflight";
import type { CompiledTournamentRoutingPlanV2, RoutingExecutionEvaluationV2 } from "../src/domain/tournament/v2";

const sourceKey = "de/r1";
const downKey = "de/l1";
function fixture(): DeImpactInput {
  const p = { matchId: 5, expectedRevision: 2, proposedResult: { score1: 1, score2: 2, winnerId: 2, winnerChanges: true }, issues: [] } as unknown as CorrectionPreview;
  const plan = {
    logicalMatches: [
      { matchKey: sourceKey, stageKey: "de", name: "Górna 1", order: 1 },
      { matchKey: downKey, stageKey: "de", name: "Dolna 1", order: 2 },
    ],
    routes: [
      { routeKey: "w", source: { type: "match_outcome", stageKey: "de", matchKey: sourceKey, outcome: "winner" }, target: { type: "match_slot", stageKey: "de", matchKey: downKey, slot: 1 } },
      { routeKey: "l", source: { type: "match_outcome", stageKey: "de", matchKey: sourceKey, outcome: "loser" }, target: { type: "match_slot", stageKey: "de", matchKey: downKey, slot: 2 } },
    ],
  } as unknown as CompiledTournamentRoutingPlanV2;
  const before = {
    snapshot: { stageKey: "de", entries: [], executionVersion: 1, decisions: [
      { matchKey: sourceKey, winnerParticipantKey: "1" }, { matchKey: downKey, winnerParticipantKey: "1" },
    ] },
    matches: [
      { matchKey: sourceKey, status: "completed", winnerParticipantKey: "1", slots: ["1", "2"] },
      { matchKey: downKey, status: "completed", winnerParticipantKey: "1", slots: ["1", "3"] },
    ],
    completed: true, championParticipantKey: "1",
  } as unknown as RoutingExecutionEvaluationV2;
  const after = {
    snapshot: { stageKey: "de", entries: [], executionVersion: 1, decisions: [{ matchKey: sourceKey, winnerParticipantKey: "2" }] },
    matches: [
      { matchKey: sourceKey, status: "completed", winnerParticipantKey: "2", slots: ["1", "2"] },
      { matchKey: downKey, status: "ready", winnerParticipantKey: null, slots: ["2", "3"] },
    ],
    completed: false, championParticipantKey: null,
  } as unknown as RoutingExecutionEvaluationV2;
  return {
    stageId: 3, stageKey: "de", matchKey: sourceKey,
    matchId: 5, matchRevision: 2, actualWinnerId: 1, preflight: p,
    plan, planRevision: 2, executionRevision: 12,
    current: before, hypothetical: after,
    canonicalMatches: [
      { id: 5, routingMatchKey: sourceKey, status: "completed", winnerId: 1, player1Id: 1, player2Id: 2 },
      { id: 6, routingMatchKey: downKey, status: "completed", winnerId: 1, player1Id: 1, player2Id: 3 },
    ],
  };
}
function available(input = fixture()) { const r = deriveDoubleEliminationRoutingImpact(input); assert.equal(r.status, "available"); if (r.status !== "available") throw Error("unavailable"); return r; }
function unavailable(input: DeImpactInput, code: string) { const r = deriveDoubleEliminationRoutingImpact(input); assert.equal(r.status, "unavailable"); if (r.status === "unavailable") assert.equal(r.reasonCode, code); }

test("detects invalidated decisions and changed DE routing slots", () => {
  const r = available(); assert.equal(r.provisional, true); assert.equal(r.scope, "double_elimination_routing_v2");
  assert.deepEqual(r.invalidatedDecisions.map(x => x.matchKey), [downKey]);
  assert.equal(r.invalidatedDecisions[0].canonicalMatchAlreadyCompleted, true);
  assert.equal(r.affectedMatches.length, 2); assert.equal(r.affectedMatches[1].hypotheticalSlots[0], "2");
  assert(r.warningCodes.includes("DOWNSTREAM_RESULTS_INVALIDATED"));
  assert(r.warningCodes.includes("COMPLETED_CANONICAL_MATCH_AFFECTED"));
  assert.equal(r.planRevision, 2); assert.equal(r.executionRevision, 12);
});
test("shows both winner and loser route evidence", () => {
  const r = available(); assert.deepEqual(r.upstreamRoutes.map(x => x.outcome), ["winner", "loser"]);
});
test("compares champion without asserting new champion", () => {
  const r = available(); assert.equal(r.currentChampionId, 1); assert.equal(r.hypotheticalChampionId, null);
});
test("same-winner correction leaves graph unchanged when evaluation equal", () => {
  const f = fixture(); f.preflight.proposedResult.winnerId = 1; f.preflight.proposedResult.winnerChanges = false; f.hypothetical = f.current;
  const r = available(f); assert.equal(r.winnerChanges, false); assert.equal(r.affectedMatches.length, 0); assert.equal(r.invalidatedDecisions.length, 0);
});
test("rejects stale revision", () => { const f=fixture();f.matchRevision=4;unavailable(f,"INVALID_PREVIEW_STATE"); });
test("rejects invalid preflight scores", () => { const f=fixture();f.preflight.issues.push({code:"INVALID_PROPOSED_RESULT",severity:"block",message:""});unavailable(f,"INVALID_PREVIEW_STATE"); });
test("rejects absent routing match key", () => { const f=fixture();f.matchKey=null;unavailable(f,"INVALID_PREVIEW_STATE"); });
test("rejects stage-key mismatch", () => { const f=fixture();f.stageKey="else";unavailable(f,"STAGE_KEY_MISMATCH"); });
test("rejects missing logical match", () => { const f=fixture();f.matchKey="nope";unavailable(f,"ROUTING_PLAN_MISMATCH"); });
test("rejects wrong routing winner", () => { const f=fixture();f.actualWinnerId=2;unavailable(f,"ROUTING_DECISION_MISMATCH"); });
test("rejects missing source decision", () => { const f=fixture();f.current.snapshot.decisions=[];unavailable(f,"ROUTING_DECISION_MISSING"); });
test("rejects canonical winner mismatch", () => { const f=fixture();f.canonicalMatches[0].winnerId=2;unavailable(f,"CANONICAL_RESULT_MISMATCH"); });
test("rejects duplicate canonical routing key", () => { const f=fixture();f.canonicalMatches=[...f.canonicalMatches,f.canonicalMatches[0]];unavailable(f,"CANONICAL_MATCH_MISMATCH"); });
test("rejects graph changes", () => { const f=fixture();f.hypothetical.matches=f.hypothetical.matches.slice(0,1);unavailable(f,"ROUTING_GRAPH_CHANGED"); });
test("rejects incorrect simulated winner", () => { const f=fixture();f.hypothetical.snapshot.decisions=[{matchKey:sourceKey,winnerParticipantKey:"1"}];unavailable(f,"HYPOTHETICAL_DECISION_MISMATCH"); });
test("notes lack of immediate route evidence rather than inventing it", () => { const f=fixture();f.plan.routes=[];assert(available(f).warningCodes.includes("NO_DIRECT_ROUTE_EVIDENCE")); });
test("does not mutate caller-owned inputs", () => { const f=fixture();const frozen=JSON.stringify(f);available(f);assert.equal(JSON.stringify(f),frozen); });
