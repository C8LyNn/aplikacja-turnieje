import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveSeCorrectionReadiness } from "../src/domain/tournament/se-correction-readiness";
import type { SeReadinessInput } from "../src/domain/tournament/se-correction-readiness";

function sample(): SeReadinessInput {
  const match = {id:101,revision:3,stageId:12,round:1,matchNumber:1,status:"completed",
    resultType:"played",bestOf:3,score1:2,score2:0,winnerId:1,player1Id:1,player2Id:2,
    completedAt:"2026-10-11T12:00:00Z"};
  return {
    assessment:{
      tournamentStatus:"active",stage:{id:12,position:1,format:"single_elimination",status:"active",currentRound:1,totalRounds:2},
      stages:[{id:12,position:1,format:"single_elimination",status:"active",currentRound:1,totalRounds:2}],
      match,stageMatches:[match,{id:102,revision:1,stageId:12,round:1,matchNumber:2,status:"pending",resultType:null,
        bestOf:3,score1:null,score2:null,winnerId:null,player1Id:3,player2Id:4,completedAt:null},
        {id:201,revision:1,stageId:12,round:2,matchNumber:1,status:"pending",resultType:null,
        bestOf:3,score1:null,score2:null,winnerId:null,player1Id:1,player2Id:null,completedAt:null}],
      score1:0,score2:2,qualificationCommitted:false,routingCommitted:false,
      historyVerified:true,completionActionUnambiguous:true,
    },
    expectedMatchRevision:3,actualMatchRevision:3,expectedStageVersionVector:"stage-r3",
    actualStageVersionVector:"stage-r3",expectedCompletionActionId:51,activeCompletionActionId:51,
    allowExecution:false,
  };
}

test("pristine first round creates an advisory candidate, not execution permission",()=>{
  const result=deriveSeCorrectionReadiness(sample());
  assert.equal(result.status,"candidate");assert.equal(result.executionEnabled,false);
  assert.equal(result.advisoryOnly,true);assert.equal(result.writePerformed,false);
  assert.equal(result.hypotheticalWinnerId,2);assert.deepEqual(result.dependentMatch,{id:201,round:2,matchNumber:1,slot:"player1"});
  assert.equal(result.issues.length,0);
});
const changeCases: Array<[string, (input: SeReadinessInput) => void, string]> = [
 ["match revision changed",x=>{x.actualMatchRevision=4},"EXPECTED_MATCH_REVISION_STALE"],
 ["invalid expected match revision",x=>{x.expectedMatchRevision=0;x.actualMatchRevision=0},"EXPECTED_MATCH_REVISION_STALE"],
 ["stage version changed",x=>{x.actualStageVersionVector="stage-r4"},"EXPECTED_STAGE_VERSION_STALE"],
 ["empty expected version",x=>{x.expectedStageVersionVector="";x.actualStageVersionVector=""},"EXPECTED_STAGE_VERSION_STALE"],
 ["wrong action",x=>{x.activeCompletionActionId=52},"CONFIRMATION_ACTION_MISMATCH"],
 ["missing action",x=>{x.activeCompletionActionId=null},"CONFIRMATION_ACTION_MISMATCH"],
 ["invalid action ID",x=>{x.expectedCompletionActionId=-1;x.activeCompletionActionId=-1},"CONFIRMATION_ACTION_MISMATCH"],
 ["later match started",x=>{x.assessment.stageMatches[2].status="in_progress"},"LATER_RESULTS_EXIST"],
 ["downstream wrong slot",x=>{x.assessment.stageMatches[2].player1Id=2},"DOWNSTREAM_SLOT_MISMATCH"],
 ["downstream completed",x=>{x.assessment.stageMatches[2].status="completed"},"LATER_RESULTS_EXIST"],
 ["no successor",x=>{x.assessment={...x.assessment,stageMatches:x.assessment.stageMatches.slice(0,-1)}},"NEXT_MATCH_MISSING"],
 ["advanced round",x=>{x.assessment.stage.currentRound=2},"ROUND_ALREADY_ADVANCED"],
 ["final",x=>{x.assessment.stage.totalRounds=1},"FINAL_ROUND_REQUIRES_REVIEW"],
 ["missing history",x=>{x.assessment.historyVerified=false},"HISTORY_NOT_VERIFIED"],
 ["multiple completions",x=>{x.assessment.completionActionUnambiguous=false},"COMPLETION_ACTION_AMBIGUOUS"],
 ["approved qualification",x=>{x.assessment.qualificationCommitted=true},"QUALIFICATION_ALREADY_COMMITTED"],
 ["committed route",x=>{x.assessment.routingCommitted=true},"ROUTING_ALREADY_COMMITTED"],
 ["stage completed",x=>{x.assessment.stage.status="completed"},"STAGE_NOT_ACTIVE"],
 ["tournament completed",x=>{x.assessment.tournamentStatus="completed"},"TOURNAMENT_NOT_ACTIVE"],
 ["same scores",x=>{x.assessment.score1=2;x.assessment.score2=0},"NO_CHANGE"],
 ["invalid score",x=>{x.assessment.score1=2;x.assessment.score2=2},"INVALID_PROPOSED_SCORE"],
 ["other stage progressed",x=>{x.assessment={...x.assessment,stages:[...x.assessment.stages,{id:13,position:2,format:"single_elimination",status:"active",currentRound:1,totalRounds:2}]}},"STAGE_ADVANCED"],
 ["wrong format",x=>{x.assessment.stage.format="double_elimination"},"NOT_SINGLE_ELIMINATION"],
 ["duplicate coordinates",x=>{x.assessment.stageMatches[1].matchNumber=1},"DUPLICATE_MATCH_COORDINATES"],
];
for(const [name,mutate,code] of changeCases){
  test(`blocks ${name}`,()=>{
    const input=sample();mutate(input);const result=deriveSeCorrectionReadiness(input);
    assert.equal(result.status,"blocked");assert.equal(result.executionEnabled,false);
    assert.ok(result.issues.includes(code as never),JSON.stringify(result.issues));
  });
}
test("does not mutate source rows or version tokens",()=>{
  const input=sample();const before=JSON.stringify(input);
  const a=deriveSeCorrectionReadiness(input);const b=deriveSeCorrectionReadiness(input);
  assert.equal(JSON.stringify(input),before);assert.deepEqual(a,b);
});
