import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { appendSeAssessmentHistory, emptySeAssessmentHistory, summarizeSeAssessmentHistory,
  SE_HISTORY_LIMIT, type SeAssessmentHistory } from "./se-assessment-history";
import type { SeAssessmentSnapshot } from "./se-diagnostic-comparison";
const id = (n: number) => n.toString(16).padStart(64, "0");
const blocked = (code: string) => ({ code, category: "state", title: code, detail: "detail", recommendation: "check", resolution: "manual" });
const make = (n: number, codes: string[] = [], overrides: Partial<SeAssessmentSnapshot> = {}): SeAssessmentSnapshot => ({
  tournamentId: 3, matchId: 41, proposedScore1: 1, proposedScore2: 2,
  expectedCompletionActionId: 71, stageVersionVector: "stage:1",
  diagnostic: {
    version: 1, kind: "se_correction_diagnostic", advisoryOnly: true,
    executionEnabled: false, writePerformed: false, validity: "snapshot_only",
    assessmentId: id(n), matchId: 41, expectedMatchRevision: 2,
    status: codes.length ? "blocked" : "candidate", issueCount: codes.length,
    blockers: codes.map(blocked),
  }, ...overrides,
});
const many = (...samples: SeAssessmentSnapshot[]): SeAssessmentHistory =>
  samples.reduce((history, snapshot) => appendSeAssessmentHistory(history, snapshot), emptySeAssessmentHistory());
describe("Pack 23 history: immutable in-memory audit trail", () => {
  test("empty state is advisory-only", () => {const s=summarizeSeAssessmentHistory(emptySeAssessmentHistory());assert.equal(s.count,0);assert.equal(s.executionEnabled,false);assert.equal(s.currentAssessmentId,null);});
  test("one snapshot establishes baseline, not new issues",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"])));assert.equal(s.count,1);assert.deepEqual(s.events,[]);});
  test("new code is introduced after initial baseline",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"]),make(2,["A","B"])));assert.deepEqual(s.events.map(e=>e.type+":"+e.code),["introduced:B"]);});
  test("resolved code is labelled an observation, not proof of fix",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"]),make(2)));assert.deepEqual(s.events.map(e=>e.type),["resolved"]);});
  test("A -> absent -> A becomes reappeared",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"]),make(2),make(3,["A"])));assert.equal(s.reappeared.length,1);assert.equal(s.reappeared[0].code,"A");});
  test("A -> A is not regression",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"]),make(2,["A"])));assert.deepEqual(s.reappeared,[]);assert.deepEqual(s.persistentCodes,["A"]);});
  test("A -> absent -> B never labels B as reappeared",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"]),make(2),make(3,["B"])));assert.deepEqual(s.reappeared,[]);});
  test("A -> absent -> A -> absent -> A yields two recurring events",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"]),make(2),make(3,["A"]),make(4),make(5,["A"])));assert.equal(s.reappeared.length,2);});
  test("revision changes are counted",()=>{const next=make(2);next.diagnostic.expectedMatchRevision=3;const s=summarizeSeAssessmentHistory(many(make(1),next));assert.equal(s.revisionChanges,1);});
  test("version-vector drift is counted",()=>{const s=summarizeSeAssessmentHistory(many(make(1),make(2,[],{stageVersionVector:"stage:2"})));assert.equal(s.stageVectorChanges,1);});
  test("completion-action drift is counted",()=>{const s=summarizeSeAssessmentHistory(many(make(1),make(2,[],{expectedCompletionActionId:72})));assert.equal(s.completionActionChanges,1);});
  test("duplicate identical assessment does not add another entry",()=>{const h=many(make(1,["A"]),make(1,["A"]));assert.equal(h.snapshots.length,1);assert.equal(h.evicted,0);});
  test("same ID with different blocker set clears history and reports conflict",()=>{const h=many(make(1,["A"]),make(1,["B"]));assert.equal(h.issue,"conflicting_assessment_id");assert.equal(h.snapshots.length,0);});
  test("same ID with different stage version clears history",()=>{const h=many(make(1),make(1,[],{stageVersionVector:"changed"}));assert.equal(h.issue,"conflicting_assessment_id");});
  test("same ID with modified title clears history",()=>{const m=make(1,["A"]);m.diagnostic.blockers[0].title="different";const h=many(make(1,["A"]),m);assert.equal(h.issue,"conflicting_assessment_id");});
  test("changed match resets rather than merging histories",()=>{const m=make(2);m.matchId=42;m.diagnostic.matchId=42;const h=many(make(1),m);assert.equal(h.snapshots.length,1);assert.equal(h.snapshots[0].matchId,42);});
  test("changed proposed score resets history",()=>{const h=many(make(1),make(2,[],{proposedScore1:2}));assert.equal(h.snapshots.length,1);});
  test("changed tournament resets history",()=>{const h=many(make(1),make(2,[],{tournamentId:4}));assert.equal(h.snapshots.length,1);});
  test("invalid snapshot clears stale evidence",()=>{const bad=make(2);bad.diagnostic.writePerformed=true as false;const h=many(make(1),bad);assert.equal(h.issue,"invalid_snapshot");assert.equal(h.snapshots.length,0);});
  test("recovers from invalid snapshot by starting new baseline",()=>{const bad=make(2);bad.diagnostic.issueCount=99;const h=many(make(1),bad,make(3));assert.equal(h.issue,null);assert.equal(h.snapshots.length,1);});
  test("limit keeps only 12 newest and reports evicted count",()=>{let h=emptySeAssessmentHistory();for(let i=1;i<=30;i++) h=appendSeAssessmentHistory(h,make(i));assert.equal(h.snapshots.length,SE_HISTORY_LIMIT);assert.equal(h.evicted,18);assert.equal(h.snapshots[0].diagnostic.assessmentId,id(19));});
  test("older evicted assessment cannot create a fabricated recurrence",()=>{let h=emptySeAssessmentHistory();h=appendSeAssessmentHistory(h,make(1,["A"]));for(let i=2;i<=14;i++) h=appendSeAssessmentHistory(h,make(i));h=appendSeAssessmentHistory(h,make(15,["A"]));assert.equal(summarizeSeAssessmentHistory(h).reappeared.length,0);});
  test("history never mutates original array or blocker objects",()=>{const a=make(1,["A"]);const old=emptySeAssessmentHistory();const first=appendSeAssessmentHistory(old,a);a.diagnostic.blockers[0].title="changed";assert.equal(first.snapshots[0].diagnostic.blockers[0].title,"A");assert.equal(old.snapshots.length,0);});
  test("history is volatile only, and does not use storage APIs",()=>{const h=many(make(1),make(2));assert.equal(h.snapshots.length,2);assert.notEqual(emptySeAssessmentHistory(),h);});
  test("the summary never provides authorization",()=>{const h=many(make(1,["A"]),make(2),make(3,["A"]));const s=summarizeSeAssessmentHistory(h);assert.deepEqual([s.advisoryOnly,s.executionEnabled,s.writePerformed],[true,false,false]);assert.match(s.advisoryNote,/nie uprawnia/i);});
  test("same historical ID repeated out of order cannot invent events",()=>{const h=many(make(1),make(2,["A"]),make(1));assert.equal(h.snapshots.length,2);});
  test("statuses represent most recent snapshot only",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"]),make(2)));assert.equal(s.currentStatus,"candidate");});
  test("persistent issue disappears when absent in one retained snapshot",()=>{const s=summarizeSeAssessmentHistory(many(make(1,["A"]),make(2),make(3,["A"])));assert.deepEqual(s.persistentCodes,[]);});
});
