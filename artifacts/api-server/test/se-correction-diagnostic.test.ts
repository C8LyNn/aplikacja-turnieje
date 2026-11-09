import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {deriveSeCorrectionDiagnostic} from "../src/domain/tournament/se-correction-diagnostic";
import type {SeReadinessResult} from "../src/domain/tournament/se-correction-readiness";
import type {SeCorrectionActionPlan} from "../src/domain/tournament/se-correction-action-plan";

const ready:SeReadinessResult={
  version:1,status:"candidate",advisoryOnly:true,executionEnabled:false,writePerformed:false,
  matchId:101,expectedMatchRevision:3,stageVersionVector:"stage-A",
  originalWinnerId:12,hypotheticalWinnerId:13,
  dependentMatch:{id:201,round:2,matchNumber:1,slot:"player1"},
  requiredChecks:[],issues:[],reason:"candidate",
};
const plan:SeCorrectionActionPlan={
  version:1,kind:"se_correction_advisory_plan",advisoryOnly:true,executionEnabled:false,writePerformed:false,
  state:"candidate",changeType:"winner_change",matchId:101,
  evidence:{expectedMatchRevision:3,stageVersionVector:"stage-A"},
  score:{current:[2,0],proposed:[0,2]},winner:{currentId:12,hypotheticalId:13},
  successor:{matchId:201,round:2,matchNumber:1,slot:"player1",previousPlayerId:12,hypotheticalPlayerId:13,changes:true},
  steps:[],blockerCodes:[],note:"advisory",
};
function make(r:Partial<SeReadinessResult>={},p:Partial<SeCorrectionActionPlan>={},action=9){
  return deriveSeCorrectionDiagnostic({readiness:{...ready,...r},plan:{...plan,...p},expectedCompletionActionId:action});
}
describe("Pack21: snapshot-only Single Elimination diagnostics",()=>{
  it("marks consistent candidate as advisory only",()=>{
    const x=make();assert.equal(x.status,"candidate");assert.equal(x.issueCount,0);
    assert.equal(x.advisoryOnly,true);assert.equal(x.executionEnabled,false);assert.equal(x.writePerformed,false);
    assert.equal(x.validity,"snapshot_only");assert.equal(x.assessmentId.length,64);
  });
  it("hash is deterministic and independent of issue order",()=>{
    const a=make({status:"blocked",issues:["NO_CHANGE","EXPECTED_MATCH_REVISION_STALE"]},{state:"blocked",blockerCodes:["NO_CHANGE"]});
    const b=make({status:"blocked",issues:["EXPECTED_MATCH_REVISION_STALE","NO_CHANGE"]},{state:"blocked",blockerCodes:["NO_CHANGE"]});
    assert.equal(a.assessmentId,b.assessmentId);
  });
  it("different revision changes identifier",()=>assert.notEqual(make().assessmentId,make({expectedMatchRevision:4},{evidence:{expectedMatchRevision:4,stageVersionVector:"stage-A"}}).assessmentId));
  it("different stage vector changes identifier",()=>assert.notEqual(make().assessmentId,make({stageVersionVector:"stage-B"},{evidence:{expectedMatchRevision:3,stageVersionVector:"stage-B"}}).assessmentId));
  it("different completion action changes identifier",()=>assert.notEqual(make({}, {},9).assessmentId,make({}, {},10).assessmentId));
  it("different proposed scores change identifier",()=>assert.notEqual(make().assessmentId,make({}, {score:{current:[2,0],proposed:[2,1]}}).assessmentId));
  it("different dependent slot changes identifier",()=>assert.notEqual(make().assessmentId,make({}, {successor:{...plan.successor!,slot:"player2"}}).assessmentId));
  it("groups identical blocker codes once",()=>{const x=make({status:"blocked",issues:["NO_CHANGE","NO_CHANGE"]},{state:"blocked",blockerCodes:["NO_CHANGE"]});assert.equal(x.issueCount,1)});
  it("explains stale revision with refresh action",()=>{
    const x=make({status:"blocked",issues:["EXPECTED_MATCH_REVISION_STALE"]},{state:"blocked",blockerCodes:["EXPECTED_MATCH_REVISION_STALE"]});
    assert.equal(x.priorityCategory,"staleness");assert.equal(x.blockers[0].resolution,"refresh_snapshot");
  });
  it("explains missing audit history",()=>{
    const x=make({status:"blocked",issues:["HISTORY_NOT_VERIFIED"]},{state:"blocked"});
    assert.equal(x.blockers[0].category,"history");assert.equal(x.blockers[0].resolution,"inspect_audit");
  });
  it("identifies committed qualification",()=>{
    const x=make({status:"blocked",issues:["QUALIFICATION_ALREADY_COMMITTED"]},{state:"blocked"});
    assert.equal(x.blockers[0].category,"progression");
  });
  it("identifies later bracket match in use",()=>{
    const x=make({status:"blocked",issues:["NEXT_MATCH_NOT_PRISTINE"]},{state:"blocked"});
    assert.equal(x.blockers[0].resolution,"review_bracket");
  });
  it("ranks integrity higher than staleness and score",()=>{
    const issues=["NO_CHANGE","MATCH_STAGE_INCONSISTENT","EXPECTED_MATCH_REVISION_STALE"] as const;
    const x=make({status:"blocked",issues:[...issues]},{state:"blocked",blockerCodes:[...issues]});
    assert.deepEqual(x.blockers.map(b=>b.category),["integrity","staleness","score"]);
  });
  it("deduplicates recommendations across multiple related blockers",()=>{
    const issues=["EXPECTED_MATCH_REVISION_STALE","EXPECTED_STAGE_VERSION_STALE"] as const;
    const x=make({status:"blocked",issues:[...issues]},{state:"blocked",blockerCodes:[...issues]});
    assert.equal(x.recommendedNextActions.length,1);
  });
  it("unavailable plan without issues remains blocked",()=>{const x=make({}, {state:"blocked"});assert.equal(x.status,"blocked");assert.equal(x.blockers[0].code,"ACTION_PLAN_NOT_ELIGIBLE")});
  it("inconsistent stage evidence always blocks",()=>{
    const x=make({}, {evidence:{expectedMatchRevision:3,stageVersionVector:"different"}});
    assert.equal(x.status,"blocked");assert.ok(x.blockers.some(b=>b.code==="ACTION_PLAN_INCONSISTENT"));
  });
  it("inconsistent match id always blocks",()=>assert.equal(make({}, {matchId:999}).status,"blocked"));
  it("inconsistent revision always blocks",()=>assert.equal(make({}, {evidence:{expectedMatchRevision:4,stageVersionVector:"stage-A"}}).status,"blocked"));
  it("unsafe readiness advisory flags fail closed",()=>{
    const x=make({executionEnabled:true as false});assert.equal(x.status,"blocked");assert.ok(x.blockers.some(b=>b.code==="UNSAFE_ADVISORY_FLAGS"));
  });
  it("unsafe plan advisory flags fail closed",()=>{
    const x=make({}, {writePerformed:true as false});assert.equal(x.status,"blocked");assert.ok(x.blockers.some(b=>b.code==="UNSAFE_ADVISORY_FLAGS"));
  });
  it("unknown issues fall back to manual review",()=>{
    const x=make({status:"blocked",issues:["FUTURE_ISSUE" as any]},{state:"blocked"});
    assert.equal(x.blockers[0].resolution,"manual_review");
  });
  it("does not mutate inputs",()=>{
    const a=structuredClone(ready),b=structuredClone(plan);make();assert.deepEqual(ready,a);assert.deepEqual(plan,b);
  });
  it("makes all issue messages user-facing",()=>{
    const issues=["NOT_SINGLE_ELIMINATION","COMPLETION_ACTION_AMBIGUOUS","ROUTING_ALREADY_COMMITTED","INVALID_PROPOSED_SCORE"] as const;
    const x=make({status:"blocked",issues:[...issues]},{state:"blocked",blockerCodes:[...issues]});
    assert.equal(x.issueCount,4);
    for(const issue of x.blockers){assert.ok(issue.title.length>2);assert.ok(issue.detail.length>2);assert.ok(issue.recommendation.length>2)}
  });
  it("candidate always explains execution remains disabled",()=>assert.match(make().recommendedNextActions[0],/wyłączone/));
});
