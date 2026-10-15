import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { captureSeAssessment, compareSeAssessments, type SeAssessmentSnapshot,
  type SeAssessmentBlocker } from "./se-diagnostic-comparison";

const BLOCK_A:SeAssessmentBlocker = {code:"HISTORY_NOT_VERIFIED",category:"history",title:"Historia",detail:"Niezgodna",recommendation:"Sprawdź audyt",resolution:"inspect_audit"};
const BLOCK_B:SeAssessmentBlocker = {code:"NEXT_MATCH_NOT_PRISTINE",category:"bracket",title:"Drabinka",detail:"Mecz rozpoczęty",recommendation:"Sprawdź mecz",resolution:"review_bracket"};
const BLOCK_C:SeAssessmentBlocker = {code:"EXPECTED_STAGE_VERSION_STALE",category:"staleness",title:"Wersja",detail:"Nowa",recommendation:"Odśwież",resolution:"refresh_snapshot"};
const id = (symbol:string) => symbol.repeat(64);
function snap(overrides:Partial<SeAssessmentSnapshot>={},blockers:SeAssessmentBlocker[]=[BLOCK_A,BLOCK_B]):SeAssessmentSnapshot {
  return {
    tournamentId:3, matchId:5, proposedScore1:0, proposedScore2:2,
    stageVersionVector:"stage-one",expectedCompletionActionId:11,
    diagnostic:{version:1,kind:"se_correction_diagnostic",advisoryOnly:true,executionEnabled:false,writePerformed:false,
      status:blockers.length>0?"blocked":"candidate",assessmentId:id("a"),validity:"snapshot_only",
      matchId:5,expectedMatchRevision:2,issueCount:blockers.length,blockers},...overrides,
  };
}
const changed = (blockers:SeAssessmentBlocker[], symbol="b", overrides:Partial<SeAssessmentSnapshot>={}) =>
  snap({...overrides,diagnostic:{...snap().diagnostic,status:blockers.length?"blocked":"candidate",assessmentId:id(symbol),issueCount:blockers.length,blockers,...overrides.diagnostic}},blockers);

describe("Pack22 - SE historical comparisons are advisory only",()=>{
  it("makes an independent capture",()=>{const x=snap();const c=captureSeAssessment(x)!;assert.notStrictEqual(c,x);assert.notStrictEqual(c.diagnostic.blockers,x.diagnostic.blockers);});
  it("rejects wrong assessment id length",()=>assert.equal(captureSeAssessment(snap({diagnostic:{...snap().diagnostic,assessmentId:"not hash"}})),null));
  it("rejects invalid signature case",()=>assert.equal(captureSeAssessment(snap({diagnostic:{...snap().diagnostic,assessmentId:id("A")}})),null));
  it("rejects inconsistent count",()=>assert.equal(captureSeAssessment(snap({diagnostic:{...snap().diagnostic,issueCount:3}})),null));
  it("rejects repeated blocker codes",()=>assert.equal(captureSeAssessment(snap({diagnostic:{...snap().diagnostic,issueCount:2,blockers:[BLOCK_A,BLOCK_A]}})),null));
  it("rejects falsely marked candidate",()=>assert.equal(captureSeAssessment(snap({diagnostic:{...snap().diagnostic,status:"candidate"}})),null));
  it("rejects blocked with no blockers",()=>assert.equal(captureSeAssessment(changed([],"b",{diagnostic:{...changed([]).diagnostic,status:"blocked"}})),null));
  it("rejects write enabled flag",()=>assert.equal(captureSeAssessment(snap({diagnostic:{...snap().diagnostic,executionEnabled:true as false}})),null));
  it("rejects mismatched match identity",()=>assert.equal(captureSeAssessment(snap({diagnostic:{...snap().diagnostic,matchId:100}})),null));
  it("rejects fractional proposed result",()=>assert.equal(captureSeAssessment(snap({proposedScore1:0.5})),null));
  it("rejects unsafe negative completion action",()=>assert.equal(captureSeAssessment(snap({expectedCompletionActionId:-1})),null));
  it("rejects empty stage vector",()=>assert.equal(captureSeAssessment(snap({stageVersionVector:""})),null));
  it("has no baseline on initial snapshot",()=>assert.equal(compareSeAssessments(null,snap()).kind,"no_baseline"));
  it("reports identical analyses",()=>{const x=compareSeAssessments(snap(),snap());assert.equal(x.kind,"identical");if(x.kind==="identical")assert.equal(x.continuing.length,2);});
  it("adds one new blocker",()=>{const x=compareSeAssessments(snap(),changed([BLOCK_A,BLOCK_B,BLOCK_C]));assert.equal(x.kind,"changed");if(x.kind==="changed")assert.deepEqual(x.added.map(b=>b.code),[BLOCK_C.code]);});
  it("removes one former blocker",()=>{const x=compareSeAssessments(snap(),changed([BLOCK_A]));assert.equal(x.kind,"changed");if(x.kind==="changed")assert.deepEqual(x.resolved.map(b=>b.code),[BLOCK_B.code]);});
  it("retains persistent blockers",()=>{const x=compareSeAssessments(snap(),changed([BLOCK_A,BLOCK_C]));if(x.kind==="changed")assert.deepEqual(x.continuing.map(b=>b.code),[BLOCK_A.code]);else assert.fail("expected changed");});
  it("detects blocked to candidate",()=>{const x=compareSeAssessments(snap(),changed([]));assert.equal(x.kind,"changed");if(x.kind==="changed")assert.deepEqual([x.previousStatus,x.currentStatus],["blocked","candidate"]);});
  it("detects candidate to blocked",()=>{const x=compareSeAssessments(changed([]),snap());assert.equal(x.kind,"changed");if(x.kind==="changed")assert.deepEqual([x.previousStatus,x.currentStatus],["candidate","blocked"]);});
  it("rejects cross-tournament mixing",()=>assert.equal(compareSeAssessments(snap(),snap({tournamentId:20})).kind,"different_scope"));
  it("rejects cross-match mixing",()=>assert.equal(compareSeAssessments(snap(),snap({matchId:6,diagnostic:{...snap().diagnostic,matchId:6}})).kind,"different_scope"));
  it("rejects different proposed scores",()=>assert.equal(compareSeAssessments(snap(),snap({proposedScore2:1})).kind,"different_scope"));
  it("detects changed revision",()=>{const x=compareSeAssessments(snap(),changed([BLOCK_A,BLOCK_B],"b",{diagnostic:{...snap().diagnostic,assessmentId:id("b"),expectedMatchRevision:3}}));assert.equal(x.kind,"changed");if(x.kind==="changed")assert.equal(x.revisionChanged,true);});
  it("detects new stage vector",()=>{const x=compareSeAssessments(snap(),changed([BLOCK_A,BLOCK_B],"b",{stageVersionVector:"stage-two"}));if(x.kind==="changed")assert.equal(x.stageVectorChanged,true);else assert.fail("expected changed");});
  it("detects new completion action",()=>{const x=compareSeAssessments(snap(),changed([BLOCK_A,BLOCK_B],"b",{expectedCompletionActionId:12}));if(x.kind==="changed")assert.equal(x.completionActionChanged,true);else assert.fail("expected changed");});
  it("fails closed on same assessment ID but new stage vector",()=>assert.equal(compareSeAssessments(snap(),snap({stageVersionVector:"stage-two"})).kind,"inconsistent"));
  it("fails closed on same assessment ID but new blockers",()=>assert.equal(compareSeAssessments(snap(),changed([BLOCK_A],"a")).kind,"inconsistent"));
  it("fails closed on malformed previous snapshot",()=>assert.equal(compareSeAssessments(snap({expectedCompletionActionId:0}),snap()).kind,"inconsistent"));
  it("fails closed on malformed current snapshot",()=>assert.equal(compareSeAssessments(snap(),snap({proposedScore1:-1})).kind,"inconsistent"));
  it("never grants write authority",()=>{const x=compareSeAssessments(snap(),changed([]));assert.equal(x.advisoryOnly,true);assert.equal(x.executionEnabled,false);assert.equal(x.writePerformed,false);});
  it("does not modify the original snapshots",()=>{const before=snap(),after=changed([BLOCK_A]);const b=structuredClone(before),a=structuredClone(after);compareSeAssessments(before,after);assert.deepEqual(before,b);assert.deepEqual(after,a);});
});
