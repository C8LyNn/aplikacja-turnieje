import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveCorrectionRecoveryPlan, type CorrectionRecoveryPlanInput } from "../src/application/operations/tournament-correction-recovery-plan";

function input(overrides: Partial<CorrectionRecoveryPlanInput> = {}): CorrectionRecoveryPlanInput {
  return {
    format: "round_robin",
    guard: { status: "stable_on_recheck", stageId: 30, stageVersionVector: "stage-30-digest" },
    preview: {
      version: 1, advisory: true, mutationPerformed: false, previewIsAuthorization: false,
      requiresTransactionalRecheck: true, state: "requires_review", matchId: 77, expectedRevision: 3,
      stageName: "Etap 1", existingResult: { score1: 2, score2: 0, winnerId: 10 },
      proposedResult: { score1: 2, score2: 1, winnerId: 10, winnerChanges: false },
      issues: [], effects: [], downstreamMatchIds: [], recommendedAction: "Review",
    },
    ...overrides,
  };
}
function deInput(overrides: Partial<CorrectionRecoveryPlanInput> = {}) {
  return input({
    format: "double_elimination",
    doubleEliminationImpact: {
      status: "available", provisional: true, scope: "double_elimination_routing_v2",
      stageId: 30, sourceMatchKey: "ub-r1-1", winnerChanges: true, currentWinnerId: 10,
      proposedWinnerId: 20, planRevision: 5, executionRevision: 17,
      upstreamRoutes: [], affectedMatches: [{
        matchKey: "lb-r1-1", label: "L1", currentStatus: "ready", hypotheticalStatus: "blocked",
        currentSlots: ["10", "40"], hypotheticalSlots: ["20", "40"],
        existingCanonicalMatchId: 99, canonicalMatchAlreadyCompleted: false,
      }],
      invalidatedDecisions: [], currentChampionId: null, hypotheticalChampionId: null,
      warningCodes: [], note: "Simulated",
    },
    ...overrides,
  });
}

test("proposes a manual-only sequence for a changed score", () => {
  const r = deriveCorrectionRecoveryPlan(input());
  assert.equal(r.status, "manual_review");
  assert.deepEqual(r.steps.map(x => x.id), ["review_evidence", "approve", "backup", "recheck", "revert", "submit", "verify"]);
  assert.equal(r.steps.filter(x=>x.mutation).length, 2);
  assert.equal(r.steps.find(x=>x.id === "submit")?.dependsOn[0], "revert");
  assert.equal(r.steps.find(x=>x.id === "revert")?.requiresOrganizerApproval, true);
  assert.equal(r.steps.find(x=>x.id === "submit")?.requiresOrganizerApproval, true);
  assert.ok(r.steps.every(x=>x.automaticExecutionAllowed === false));
  assert.equal(r.executable, false);
  assert.equal(r.permissionToExecute, false);
  assert.equal(r.mutationPerformed, false);
});

test("returns no-op for an unchanged score and no blockers", () => {
  const x=input();
  x.preview.proposedResult.score1=2;
  x.preview.proposedResult.score2=0;
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"no_change");assert.equal(r.risk,"none");
  assert.deepEqual(r.steps.map(s=>s.id),["finish"]);
  assert.equal(r.steps.some(s=>s.mutation),false);
});

test("fails closed on a stale guard", () => {
  const r=deriveCorrectionRecoveryPlan(input({guard:{status:"changed_during_read",stageId:30,stageVersionVector:"diff"}}));
  assert.equal(r.status,"stale"); assert.ok(r.blockerCodes.includes("PREVIEW_NOT_CURRENT"));
  assert.deepEqual(r.steps.map(s=>s.id),["refresh"]);
  assert.equal(r.evidence.stageVersionVector,null);
});

test("fails closed on absent guard",()=>{
  const r=deriveCorrectionRecoveryPlan(input({guard:undefined}));
  assert.equal(r.status,"stale"); assert.equal(r.evidence.stageId,0);
  assert.deepEqual(r.steps.map(s=>s.id),["refresh"]);
});

test("fails closed on empty version vector",()=>{
  const r=deriveCorrectionRecoveryPlan(input({guard:{status:"stable_on_recheck",stageId:30,stageVersionVector:""}}));
  assert.equal(r.status,"stale");
});

test("preserves source blocking codes",()=>{
  const x=input(); x.preview.state="blocked";
  x.preview.issues=[{code:"STALE_MATCH_REVISION",severity:"block",message:"Stale"}];
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"blocked"); assert.ok(r.blockerCodes.includes("STALE_MATCH_REVISION"));
  assert.equal(r.steps.some(s=>s.mutation),false);
});

test("does not convert a review issue into a blocker",()=>{
  const x=input();x.preview.issues=[{code:"REVIEW_WARNING",severity:"review",message:"Confirm"}];
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"manual_review");assert.equal(r.blockerCodes.length,0);
});

test("DE unavailable always blocks standard playbook",()=>{
  const r=deriveCorrectionRecoveryPlan(input({format:"double_elimination"}));
  assert.equal(r.status,"blocked");assert.ok(r.blockerCodes.includes("DE_ROUTING_UNVERIFIED"));
  assert.equal(r.steps.some(x=>x.mutation),false);
});

test("DE available includes routing revisions",()=>{
  const r=deriveCorrectionRecoveryPlan(deInput());
  assert.equal(r.status,"manual_review");assert.equal(r.risk,"high");
  assert.equal(r.evidence.doubleEliminationExecutionRevision,17);
  assert.equal(r.evidence.doubleEliminationPlanRevision,5);
  assert.equal(r.affected.possibleAffectedLogicalMatches,1);
  assert.ok(r.approvalQuestions.some(s=>s.includes("routingu DE")));
});

test("DE downstream completed decisions trigger critical blocker",()=>{
  const x=deInput();if(x.doubleEliminationImpact?.status!=="available")throw new Error("Fixture");
  x.doubleEliminationImpact.invalidatedDecisions=[
    {matchKey:"ub-r1-1",canonicalMatchId:77,canonicalMatchAlreadyCompleted:true},
    {matchKey:"lb-r1-1",canonicalMatchId:99,canonicalMatchAlreadyCompleted:true},
  ];
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"blocked");assert.equal(r.risk,"critical");
  assert.equal(r.affected.potentiallyInvalidatedCompletedResults,1);
  assert.ok(r.blockerCodes.includes("DOWNSTREAM_RESULTS_WOULD_BE_INVALIDATED"));
  assert.deepEqual(r.steps.map(s=>s.id),["inspect_blockers","escalate_dependencies"]);
  assert.equal(r.steps.some(s=>s.mutation),false);
});

test("DE source decision does not count as downstream invalidation",()=>{
  const x=deInput();if(x.doubleEliminationImpact?.status!=="available")throw new Error("Fixture");
  x.doubleEliminationImpact.invalidatedDecisions=[{matchKey:"ub-r1-1",canonicalMatchId:77,canonicalMatchAlreadyCompleted:true}];
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"manual_review");assert.equal(r.affected.potentiallyInvalidatedCompletedResults,0);
});

test("DE warnings cause fail-closed inspection",()=>{
  const x=deInput();if(x.doubleEliminationImpact?.status!=="available")throw new Error("Fixture");
  x.doubleEliminationImpact.warningCodes=["ROUTE_STALE"];
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"blocked");assert.ok(r.blockerCodes.includes("DE_ROUTING_WARNINGS"));
});

test("SE missing impact fails closed when winner changes",()=>{
  const x=input({format:"single_elimination"});x.preview.proposedResult.winnerChanges=true;
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"blocked");
  assert.equal(r.risk,"high"); assert.ok(r.blockerCodes.includes("SE_DEPENDENCY_UNVERIFIED"));
});

test("SE explicitly unavailable impact blocks changed winner",()=>{
  const x=input({format:"single_elimination",bracketImpact:{status:"unavailable",reasonCode:"MISSING",message:"No chain"}});
  x.preview.proposedResult.winnerChanges=true;
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"blocked"); assert.ok(r.blockerCodes.includes("SE_DEPENDENCY_UNVERIFIED"));
});

test("SE stable score-only change ignores unavailable structural impact",()=>{
  const x=input({format:"single_elimination",bracketImpact:{status:"unavailable",reasonCode:"NO_GRAPH",message:"Graph incomplete"}});
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"manual_review");
});

test("SE ambiguous structural chain blocks changing winner",()=>{
  const x=input({format:"single_elimination",bracketImpact:{
    status:"available",stageId:30,stageName:"SE",format:"single_elimination",provisional:true,
    forecastScope:"structure_only",winnerChanges:true,
    sourceMatch:{matchId:77,round:1,matchNumber:1},directSlot:null,
    possibleDownstream:[],issues:[{code:"AMBIGUOUS",message:"ambiguous"}],chainComplete:false,
    finalRoundWinnerMayChange:false,note:"warning"},});
  x.preview.proposedResult.winnerChanges=true;
  const r=deriveCorrectionRecoveryPlan(x);
  assert.equal(r.status,"blocked");assert.ok(r.blockerCodes.includes("SE_BRACKET_INTEGRITY_REVIEW"));
});

test("deduplicates and sorts affected match ids",()=>{
  const x=input();x.preview.downstreamMatchIds=[20,10,20,5];
  const r=deriveCorrectionRecoveryPlan(x);
  assert.deepEqual(r.affected.knownDownstreamMatchIds,[5,10,20]);
});

test("winner change adds explicit approval question",()=>{
  const x=input();x.preview.proposedResult.winnerChanges=true;
  const r=deriveCorrectionRecoveryPlan(x);
  assert.ok(r.approvalQuestions.some(s=>s.includes("zmianę zwycięzcy")));
});

test("retains requested score and expected revision",()=>{
  const r=deriveCorrectionRecoveryPlan(input());
  assert.deepEqual(r.proposedScore,{score1:2,score2:1});
  assert.equal(r.expectedRevision,3); assert.equal(r.matchId,77);
});

test("output never claims to perform mutation in any state",()=>{
  const cases=[input(),input({guard:undefined}),input({format:"double_elimination"}),deInput()];
  for(const x of cases){const r=deriveCorrectionRecoveryPlan(x);assert.equal(r.executable,false);assert.equal(r.mutationPerformed,false);assert.equal(r.permissionToExecute,false);assert.ok(r.steps.every(s=>!s.automaticExecutionAllowed))}
});
