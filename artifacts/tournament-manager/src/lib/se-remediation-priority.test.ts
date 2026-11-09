import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveSeRemediationPriorityPlan } from "./se-remediation-priority";
import { appendSeAssessmentHistory, emptySeAssessmentHistory, type SeAssessmentHistory } from "./se-assessment-history";
import type { SeAssessmentSnapshot } from "./se-diagnostic-comparison";

const IDX = "0123456789abcdef";
const id = (n: number) => n.toString(16).padStart(64, "0");
const scenarios = [
  ["HISTORY_NOT_VERIFIED", "history", "inspect_audit"],
  ["EXPECTED_MATCH_REVISION_STALE", "staleness", "refresh_snapshot"],
  ["INVALID_PROPOSED_SCORE", "score", "adjust_score"],
  ["NEXT_MATCH_NOT_PRISTINE", "bracket", "review_bracket"],
  ["STAGE_ADVANCED", "progression", "review_progression"],
  ["EXTERNAL_EXECUTION_DISABLED", "manual", "manual_review"],
] as const;
function makeSnapshot(
  counter: number, active: readonly (typeof scenarios)[number][] = [scenarios[0]],
): SeAssessmentSnapshot {
  return {
    tournamentId: 5, matchId: 8, proposedScore1: 2, proposedScore2: 1,
    stageVersionVector: `stage-${counter}`, expectedCompletionActionId: 10,
    diagnostic: {
      version: 1, kind: "se_correction_diagnostic", advisoryOnly: true,
      executionEnabled: false, writePerformed: false, validity: "snapshot_only",
      status: active.length ? "blocked" : "candidate",
      assessmentId: id(counter), matchId: 8, expectedMatchRevision: counter,
      issueCount: active.length,
      blockers: active.map(([code, category, resolution]) => ({
        code, category, resolution, title: code, detail: "opis", recommendation: "sprawdź",
      })),
    },
  };
}
function historyOf(...states: SeAssessmentSnapshot[]): SeAssessmentHistory {
  return states.reduce((h, s) => appendSeAssessmentHistory(h, s), emptySeAssessmentHistory());
}
const plan = (...states: SeAssessmentSnapshot[]) => deriveSeRemediationPriorityPlan(states.at(-1)!, historyOf(...states));

for (const [code, , resolution] of scenarios) {
  test(`one blocker ${code} produces ${resolution}`, () => {
    const result = plan(makeSnapshot(1, [scenarios.find(s => s[0] === code)!]));
    assert.equal(result.status, "triage");
    assert.equal(result.steps.length, 1);
    assert.equal(result.primaryStep, resolution);
    assert.deepEqual(result.steps[0].codes, [code]);
    assert.equal(result.executionEnabled, false);
    assert.equal(result.writePerformed, false);
  });
}
test("candidate with no blockers is informational, never executable", () => {
  const result = plan(makeSnapshot(1, []));
  assert.equal(result.status, "no_blockers");
  assert.equal(result.primaryStep, null);
  assert.deepEqual(result.steps, []);
  assert.equal(result.advisoryOnly, true);
});
test("priority grouping deduplicates resolution steps", () => {
  const s = makeSnapshot(1, [
    ["HISTORY_NOT_VERIFIED", "history", "inspect_audit"],
    ["COMPLETION_ACTION_AMBIGUOUS", "history", "inspect_audit"],
  ]);
  const result = plan(s);
  assert.equal(result.problemCount, 2);
  assert.equal(result.steps.length, 1);
  assert.deepEqual(result.steps[0].codes, ["COMPLETION_ACTION_AMBIGUOUS", "HISTORY_NOT_VERIFIED"]);
});
test("bracket step depends on audit, refreshing and score correction if all present", () => {
  const result = plan(makeSnapshot(1, scenarios.slice(0,4)));
  const bracket = result.steps.find(s => s.id === "review_bracket")!;
  assert.deepEqual(bracket.dependsOn, ["inspect_audit", "refresh_snapshot", "adjust_score"]);
  assert.equal(result.steps.indexOf(bracket), 3);
});
test("progression depends on bracket and manual review depends on other steps", () => {
  const result = plan(makeSnapshot(1, scenarios));
  const progression = result.steps.find(s => s.id === "review_progression")!;
  assert.ok(progression.dependsOn.includes("review_bracket"));
  assert.equal(result.steps.at(-1)?.id, "manual_review");
  assert.equal(result.steps.length, 6);
});
test("standalone bracket has no invented dependencies", () => {
  const result = plan(makeSnapshot(1, [scenarios[3]]));
  assert.deepEqual(result.steps[0].dependsOn, []);
});
test("recurring issue must be present in CURRENT assessment", () => {
  const a = makeSnapshot(1,[scenarios[0]]);
  const b = makeSnapshot(2,[scenarios[1]]);
  const c = makeSnapshot(3,[scenarios[0]]);
  const d = makeSnapshot(4,[scenarios[1]]);
  const recurring = plan(a,b,c);
  assert.deepEqual(recurring.recurringCodes,["HISTORY_NOT_VERIFIED"]);
  assert.deepEqual(recurring.steps[0].recurringCodes,["HISTORY_NOT_VERIFIED"]);
  const later = plan(a,b,c,d);
  assert.deepEqual(later.recurringCodes, ["EXPECTED_MATCH_REVISION_STALE"]);
});
test("persistent blockers get special marker", () => {
  const first = makeSnapshot(1,[scenarios[0]]);
  const second = makeSnapshot(2,[scenarios[0],scenarios[1]]);
  const p = plan(first,second);
  const audit = p.steps.find(s => s.id === "inspect_audit")!;
  assert.deepEqual(audit.persistentCodes, ["HISTORY_NOT_VERIFIED"]);
});
test("independent steps sort by priority and stable order", () => {
  const p = plan(makeSnapshot(1,[scenarios[2],scenarios[0],scenarios[1]]));
  assert.deepEqual(p.steps.map(s => s.id), ["inspect_audit", "refresh_snapshot", "adjust_score"]);
});
test("invalid snapshot -> fail closed", () => {
  const valid = makeSnapshot(1);
  const corrupt = {...valid, diagnostic:{...valid.diagnostic, executionEnabled:true}} as unknown as SeAssessmentSnapshot;
  const p=deriveSeRemediationPriorityPlan(corrupt,historyOf(valid));
  assert.equal(p.status,"inconsistent");
  assert.equal(p.primaryStep,null);
});
test("unknown resolution -> fail closed", () => {
  const s = makeSnapshot(1);
  const bad = {...s,diagnostic:{...s.diagnostic,blockers:[{...s.diagnostic.blockers[0],resolution:"executeNow"}]}};
  assert.equal(plan(bad).status,"inconsistent");
});
test("different current assessment than newest history -> fail closed", () => {
  const s1=makeSnapshot(1), s2=makeSnapshot(2);
  const p=deriveSeRemediationPriorityPlan(s2,historyOf(s1));
  assert.equal(p.status,"inconsistent");
});
test("no history -> fail closed, not a ready state", () => {
  const p=deriveSeRemediationPriorityPlan(makeSnapshot(1),emptySeAssessmentHistory());
  assert.equal(p.status,"inconsistent");
});
test("conflicting history -> fail closed", () => {
  const s=makeSnapshot(1);
  const h=historyOf(s);
  const p=deriveSeRemediationPriorityPlan(s,{...h,issue:"conflicting_assessment_id"});
  assert.equal(p.status,"inconsistent");
});
test("other match -> fail closed", () => {
  const s=makeSnapshot(1);
  const changed={...s,matchId:9,diagnostic:{...s.diagnostic,matchId:9}};
  const p=deriveSeRemediationPriorityPlan(changed,historyOf(s));
  assert.equal(p.status,"inconsistent");
});
test("other proposed score -> fail closed", () => {
  const s=makeSnapshot(1);
  assert.equal(deriveSeRemediationPriorityPlan({...s,proposedScore1:0},historyOf(s)).status,"inconsistent");
});
test("changed action/revision or version vector -> fail closed", () => {
  const s=makeSnapshot(1), h=historyOf(s);
  for (const changed of [
    {...s,expectedCompletionActionId:11},
    {...s,stageVersionVector:"changed"},
    {...s,diagnostic:{...s.diagnostic,expectedMatchRevision:2}},
  ]) assert.equal(deriveSeRemediationPriorityPlan(changed,h).status,"inconsistent");
});
test("malformed status -> fail closed", () => {
  const s=makeSnapshot(1);
  const bad={...s,diagnostic:{...s.diagnostic,status:"candidate"}} as unknown as SeAssessmentSnapshot;
  assert.equal(deriveSeRemediationPriorityPlan(bad,historyOf(s)).status,"inconsistent");
});
test("malformed history content -> fail closed", () => {
  const s=makeSnapshot(1);
  const bad={...historyOf(s),snapshots:[{...s,diagnostic:{...s.diagnostic,writePerformed:true}}]};
  assert.equal(deriveSeRemediationPriorityPlan(s,bad as unknown as SeAssessmentHistory).status,"inconsistent");
});
test("history limited to 12 assessments still gives bounded output", () => {
  const states=Array.from({length:16},(_,i)=>makeSnapshot(i+1,[scenarios[i%2]]));
  const hist=historyOf(...states);
  assert.equal(hist.snapshots.length,12);
  const out=deriveSeRemediationPriorityPlan(states.at(-1)!,hist);
  assert.equal(out.status,"triage");
  assert.equal(out.recurringCodes.length,1);
});
test("note explicitly disclaims permission, mutation flags are immutable false", () => {
  const out=plan(makeSnapshot(1));
  assert.match(out.note,/nie uprawnia/);
  assert.equal(out.executionEnabled,false);
  assert.equal(out.writePerformed,false);
});

test("null snapshot inside history does not throw and fails closed", () => {
  const s=makeSnapshot(1);
  const bad = { ...historyOf(s), snapshots: [null] } as unknown as SeAssessmentHistory;
  assert.equal(deriveSeRemediationPriorityPlan(s,bad).status,"inconsistent");
});
test("null current assessment does not throw and fails closed", () => {
  const s=makeSnapshot(1);
  assert.equal(deriveSeRemediationPriorityPlan(null as unknown as SeAssessmentSnapshot,historyOf(s)).status,"inconsistent");
});
test("duplicate assessment ids in input history are rejected", () => {
  const s=makeSnapshot(1);
  const bad = { ...historyOf(s), snapshots: [s,s] };
  assert.equal(deriveSeRemediationPriorityPlan(s,bad).status,"inconsistent");
});
