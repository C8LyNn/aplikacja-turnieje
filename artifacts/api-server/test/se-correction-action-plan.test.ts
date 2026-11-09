import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveSeCorrectionActionPlan } from "../src/domain/tournament/se-correction-action-plan";
import type { SeReadinessResult } from "../src/domain/tournament/se-correction-readiness";

const base: SeReadinessResult = {
  version:1,status:"candidate",advisoryOnly:true,executionEnabled:false,writePerformed:false,
  matchId:21,expectedMatchRevision:3,stageVersionVector:"stage-hash-xyz",
  originalWinnerId:101,hypotheticalWinnerId:102,
  dependentMatch:{id:28,round:2,matchNumber:1,slot:"player1"},
  requiredChecks:[],issues:[],reason:"candidate",
};
const make = (overrides: Partial<SeReadinessResult> = {},scores={score1:0,score2:2,originalScore1:2,originalScore2:0}) =>
  deriveSeCorrectionActionPlan({readiness:{...base,...overrides},...scores});

describe("Pack 20: immutable SE advisory change plan",()=>{
  it("describes a reversible winner-change and successor slot",()=>{
    const plan=make();
    assert.equal(plan.state,"candidate"); assert.equal(plan.changeType,"winner_change");
    assert.deepEqual(plan.successor,{
      matchId:28,round:2,matchNumber:1,slot:"player1",previousPlayerId:101,hypotheticalPlayerId:102,changes:true,
    });
    assert.deepEqual(plan.steps.map(x=>x.code),[
      "REVALIDATE_UNDER_LOCK","REVERT_PREVIOUS","RECORD_REPLACEMENT","PROPAGATE_WINNER","VERIFY_AUDIT",
    ]);
  });
  it("produces no slot write for an unchanged winner",()=>{
    const p=make({hypotheticalWinnerId:101},{score1:2,score2:1,originalScore1:2,originalScore2:0});
    assert.equal(p.changeType,"score_only");assert.equal(p.successor?.changes,false);
    assert.ok(p.steps.every(s=>s.code!=="PROPAGATE_WINNER"));
  });
  it("does not treat the same score as candidate",()=>{
    const p=make({}, {score1:2,score2:0,originalScore1:2,originalScore2:0});
    assert.equal(p.state,"blocked");assert.equal(p.steps.length,0);
  });
  it("blocks readiness with issues despite a candidate status",()=>{
    const p=make({issues:["EXPECTED_MATCH_REVISION_STALE"]});
    assert.equal(p.state,"blocked"); assert.ok(p.blockerCodes.includes("EXPECTED_MATCH_REVISION_STALE"));
  });
  it("blocks a missing successor",()=>assert.equal(make({dependentMatch:null}).state,"blocked"));
  it("blocks unknown original winner",()=>assert.equal(make({originalWinnerId:null}).state,"blocked"));
  it("blocks unknown hypothetical winner",()=>assert.equal(make({hypotheticalWinnerId:null}).state,"blocked"));
  it("blocks negative score",()=>assert.equal(make({}, {score1:-1,score2:2,originalScore1:2,originalScore2:0}).state,"blocked"));
  it("blocks decimal score",()=>assert.equal(make({}, {score1:0.5,score2:2,originalScore1:2,originalScore2:0}).state,"blocked"));
  it("blocks unsafe score",()=>assert.equal(make({}, {score1:Number.MAX_SAFE_INTEGER+1,score2:2,originalScore1:2,originalScore2:0}).state,"blocked"));
  it("never enables execution even when candidate",()=>{
    const p=make();assert.equal(p.advisoryOnly,true);assert.equal(p.executionEnabled,false);assert.equal(p.writePerformed,false);
    assert.ok(p.steps.every(x=>x.requiresTransaction));
  });
  it("preserves the revision/vector as evidence",()=>{
    assert.deepEqual(make().evidence,{expectedMatchRevision:3,stageVersionVector:"stage-hash-xyz"});
  });
  it("deduplicates blocker codes",()=>{
    const p=make({status:"blocked",issues:["NO_CHANGE","NO_CHANGE"]});
    assert.deepEqual(p.blockerCodes,["NO_CHANGE","ACTION_PLAN_NOT_ELIGIBLE"]);
  });
  it("does not mutate input",()=>{
    const copy=structuredClone(base);make();assert.deepEqual(base,copy);
  });
  it("reports source score and proposed score",()=>{
    const p=make();assert.deepEqual(p.score,{current:[2,0],proposed:[0,2]});
  });
});
