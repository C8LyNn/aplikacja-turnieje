import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveQualificationRoutingPreview,
  type QualificationRoutingInput,
} from "../src/application/operations/tournament-qualification-routing-preflight";

function example(): QualificationRoutingInput {
  return {
    tournamentId: 42, flowAuthority: "basket_v1", validConfiguration: true,
    configurationProblems: [],
    stages: [
      { id: 11, name: "Grupy", position: 1, status: "completed" },
      { id: 12, name: "Play-off", position: 2, status: "planned" },
    ],
    baskets: [
      { id: "source", stageId: 11, type: "output", qualifierCount: 2 },
      { id: "destination", stageId: 12, type: "input", qualifierCount: null },
    ],
    routes: [{ id: "route1", sourceBasketId: "source", targetBasketId: "destination" }],
    proposals: [],
    routeStatuses: [{ routeId: "route1", sourceBasketId: "source", targetBasketId: "destination", sourceOutputApproved: false, materialized: false, routedPlayerCount: 0 }],
  };
}
const proposal = (status: string = "pending") => ({ stageId: 11, revision: 3, status, entries: [
  { basketId: "source", playerId: 1 }, { basketId: "source", playerId: 2 },
] });
const status = (overrides: Partial<QualificationRoutingInput["routeStatuses"][number]> = {}) => ({
  ...example().routeStatuses[0], ...overrides,
});
const run = (changes: Partial<QualificationRoutingInput> = {}) => deriveQualificationRoutingPreview({ ...example(), ...changes });

test("legacy flow is never represented as broken or executable", () => {
  const result = run({ flowAuthority: "legacy" });
  assert.equal(result.state, "not_applicable");
  assert.equal(result.qualificationStages.length, 0);
  assert.equal(result.executionMustRevalidate, true);
});
test("invalid basket graph prevents proposal and routing guidance", () => {
  const result = run({ validConfiguration: false, configurationProblems: [{ code: "CYCLE", message: "Detected cycle" }] });
  assert.equal(result.state, "needs_attention");
  assert.equal(result.issues[0].code, "CYCLE");
  assert.equal(result.summary.routesTotal, 0);
});
test("finished source stage without proposal recommends preparing it", () => {
  const result = run();
  assert.equal(result.state, "prepare_qualification");
  assert.equal(result.qualificationStages[0].nextAction, "prepare_proposal");
  assert.equal(result.summary.routesMaterialized, 0);
});
test("active source stage waits instead of recommending approval", () => {
  const stages = example().stages.map(x => x.id === 11 ? { ...x, status: "active" as const } : x);
  assert.equal(run({ stages, proposals: [proposal()] }).state, "waiting_for_matches");
});
test("draft source stage also waits", () => {
  const stages = example().stages.map(x => x.id === 11 ? { ...x, status: "planned" as const } : x);
  assert.equal(run({ stages }).qualificationStages[0].nextAction, "wait");
});
test("pending proposal recommends explicit human approval", () => {
  const result = run({ proposals: [proposal()] });
  assert.equal(result.state, "review_qualification");
  assert.equal(result.summary.proposalsPending, 1);
  assert.equal(result.qualificationStages[0].proposalRevision, 3);
});
test("approved proposal and unmaterialized route are advisory only", () => {
  const result = run({ proposals: [proposal("approved")], routeStatuses: [status({ sourceOutputApproved: true })] });
  assert.equal(result.state, "route_qualifiers");
  assert.equal(result.qualificationStages[0].routes[0].state, "ready_for_review");
  assert.equal(result.executionMustRevalidate, true);
  assert.equal(result.noMutationsPerformed, true);
  assert.equal(result.proposalFingerprintRevalidated, false);
});
test("materialized route is counted as completed", () => {
  const result = run({ proposals: [proposal("approved")], routeStatuses: [status({ sourceOutputApproved: true, materialized: true, routedPlayerCount: 2 })] });
  assert.equal(result.state, "complete");
  assert.equal(result.summary.routesMaterialized, 1);
  assert.equal(result.qualificationStages[0].nextAction, "review_next_stage");
});
test("target stage started before route blocks next operation", () => {
  const stages = example().stages.map(s => s.id === 12 ? { ...s, status: "active" as const } : s);
  const result = run({ stages, proposals: [proposal("approved")], routeStatuses: [status({ sourceOutputApproved: true })] });
  assert.equal(result.state, "needs_attention");
  assert.ok(result.issues.some(x => x.code === "TARGET_STAGE_ALREADY_STARTED"));
});
test("wrong proposal quota blocks instead of silently allocating", () => {
  const result = run({ proposals: [{ ...proposal("approved"), entries: [{ basketId: "source", playerId: 1 }] }], routeStatuses: [status({ sourceOutputApproved: true })] });
  assert.equal(result.state, "needs_attention");
  assert.ok(result.issues.some(x => x.code === "PROPOSAL_QUOTA_MISMATCH"));
});
test("approved proposal with route denying approval blocks", () => {
  const result = run({ proposals: [proposal("approved")], routeStatuses: [status()] });
  assert.equal(result.state, "needs_attention");
  assert.ok(result.issues.some(x => x.code === "SOURCE_OUTPUT_NOT_APPROVED"));
});
test("missing route status blocks, cannot imply readiness", () => {
  const result = run({ proposals: [proposal("approved")], routeStatuses: [] });
  assert.ok(result.issues.some(x => x.code === "ROUTE_STATUS_MISSING"));
});
test("wrong route status binding blocks", () => {
  const result = run({ proposals: [proposal("approved")], routeStatuses: [status({ targetBasketId: "WRONG" })] });
  assert.equal(result.qualificationStages[0].routes[0].state, "blocked");
});
test("missing configured outgoing route blocks", () => {
  const result = run({ routes: [] });
  assert.equal(result.state, "needs_attention");
  assert.ok(result.issues.some(x => x.code === "OUTPUT_ROUTE_MISSING"));
});
test("materialized route with wrong count is an inconsistency, not success", () => {
  const result = run({ proposals: [proposal("approved")], routeStatuses: [status({ sourceOutputApproved: true, materialized: true, routedPlayerCount: 1 })] });
  assert.ok(result.issues.some(x => x.code === "ROUTE_EXECUTION_INCONSISTENT"));
  assert.equal(result.summary.routesMaterialized, 0);
});
test("unknown proposal statuses never auto approve", () => {
  const result = run({ proposals: [proposal("stale")] });
  assert.ok(result.issues.some(x => x.code === "UNKNOWN_PROPOSAL_STATUS"));
});
test("does not leak player names; output only counts and IDs of stages and routes", () => {
  const output = JSON.stringify(run({ proposals: [proposal("approved")] }));
  assert.equal(output.includes("playerId"), false);
  assert.equal(output.includes("rankingFingerprint"), false);
});
test("input is immutable and repeatable", () => {
  const input = example(); const original = structuredClone(input);
  const a = deriveQualificationRoutingPreview(input);
  const b = deriveQualificationRoutingPreview(input);
  assert.deepEqual(a,b);
  assert.deepEqual(input,original);
});
test("multiple sources are ordered deterministically", () => {
  const initial=example();
  const result = run({
    stages: [{ id: 24, name: "Późny", position: 3, status: "completed" },...initial.stages],
    baskets: [...initial.baskets,{ id: "later", stageId: 24, type: "output", qualifierCount: 2 }],
  });
  assert.deepEqual(result.qualificationStages.map(s=>s.stageId), [11,24]);
  assert.equal(result.summary.sourceStages,2);
});
test("mismatch by basket is detected even when overall proposal count matches", () => {
  const input = example();
  const result = run({
    baskets: [...input.baskets, { id:"other", stageId: 11, type: "output", qualifierCount: 1 }],
    routes: [...input.routes, { id:"route2", sourceBasketId:"other", targetBasketId:"destination" }],
    proposals: [{ ...proposal("approved"), entries: [
      {basketId:"source", playerId: 1}, {basketId:"source", playerId: 2}, {basketId:"source", playerId: 3},
    ] }],
    routeStatuses: [status({sourceOutputApproved:true}), { ...status({sourceOutputApproved:true}), routeId:"route2", sourceBasketId:"other" }],
  });
  assert.ok(result.issues.some(x => x.code === "OUTPUT_ALLOCATION_MISMATCH"));
});
test("materialized without confirmed approval is an inconsistency", () => {
  const result = run({ proposals:[proposal("approved")], routeStatuses:[status({materialized:true,routedPlayerCount:2,sourceOutputApproved:false})] });
  assert.ok(result.issues.some(x=>x.code==="ROUTE_EXECUTION_INCONSISTENT"));
});
test("wrong target stage ID from source route record is blocked", () => {
  const result = run({ proposals:[proposal("approved")], routeStatuses:[status({sourceOutputApproved:true,targetStageId:999})] });
  assert.ok(result.issues.some(x=>x.code==="ROUTE_STATUS_MISSING"));
});
test("no qualifying output baskets is not applicable",()=>{
  const result = run({ baskets: [], routes: [], routeStatuses: [] });
  assert.equal(result.state,"not_applicable");
});
