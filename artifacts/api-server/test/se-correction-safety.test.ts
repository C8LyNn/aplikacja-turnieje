import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { evaluateSeCorrectionSafety, type SeCorrectionSafetyInput } from "../src/domain/tournament/se-correction-safety";

function fixture(): SeCorrectionSafetyInput {
  const now = new Date("2026-10-11T20:00:00Z");
  return {
    tournamentStatus:"active",
    stage:{id:3,position:1,format:"single_elimination",status:"active",currentRound:1,totalRounds:3},
    stages:[{id:3,position:1,format:"single_elimination",status:"active",currentRound:1,totalRounds:3}],
    match:{id:10,stageId:3,round:1,matchNumber:1,status:"completed",resultType:"played",bestOf:3,
      score1:2,score2:1,winnerId:100,player1Id:100,player2Id:101,completedAt:now},
    stageMatches:[
      {id:10,stageId:3,round:1,matchNumber:1,status:"completed",resultType:"played",bestOf:3,
        score1:2,score2:1,winnerId:100,player1Id:100,player2Id:101,completedAt:now},
      {id:11,stageId:3,round:1,matchNumber:2,status:"pending",resultType:null,bestOf:3,
        score1:null,score2:null,winnerId:null,player1Id:102,player2Id:103,completedAt:null},
      {id:20,stageId:3,round:2,matchNumber:1,status:"pending",resultType:null,bestOf:3,
        score1:null,score2:null,winnerId:null,player1Id:100,player2Id:null,completedAt:null},
      {id:30,stageId:3,round:3,matchNumber:1,status:"pending",resultType:null,bestOf:3,
        score1:null,score2:null,winnerId:null,player1Id:null,player2Id:null,completedAt:null},
    ],
    score1:1,score2:2,qualificationCommitted:false,routingCommitted:false,
    historyVerified:true,completionActionUnambiguous:true,
  };
}
function outcome(edit:(fixture:SeCorrectionSafetyInput)=>void=()=>{}) {
  const input=fixture();edit(input);return evaluateSeCorrectionSafety(input);
}
function includes(code:string, edit:(fixture:SeCorrectionSafetyInput)=>void) {
  const result=outcome(edit); assert.equal(result.status,"blocked"); assert.ok(result.issues.includes(code as never),`${code} missing: ${result.issues}`);
}

describe("Pack 18: read-only Single Elimination correction safety",()=>{
  test("identifies a structurally safe first-round change without authorizing writes",()=>{
    const value=outcome();assert.equal(value.status,"structurally_safe");assert.equal(value.advisoryOnly,true);
    assert.equal(value.proposedWinnerId,101);assert.equal(value.winnerChanges,true);
    assert.deepEqual(value.dependentMatch,{id:20,round:2,matchNumber:1,slot:"player1"});
  });
  test("accepts valid score change preserving winner",()=>{
    const result=outcome(f=>{f.score1=2;f.score2=0;});assert.equal(result.status,"structurally_safe");assert.equal(result.winnerChanges,false);
  });
  test("reports other bracket slot for second sibling",()=>{
    const result=outcome(f=>{
      f.match={...f.stageMatches[0],id:11,matchNumber:2,player1Id:102,player2Id:103,status:"completed",score1:2,score2:1,winnerId:102};
      f.stageMatches=[f.stageMatches[0],f.match,{...f.stageMatches[2],player2Id:102},f.stageMatches[3]];
    });assert.equal(result.status,"structurally_safe");assert.equal(result.dependentMatch?.slot,"player2");
  });
  test("blocks malformed score",()=>includes("INVALID_PROPOSED_SCORE",f=>{f.score1=1;f.score2=1;}));
  test("blocks same score",()=>includes("NO_CHANGE",f=>{f.score1=2;f.score2=1;}));
  test("blocks stale later round",()=>includes("ROUND_ALREADY_ADVANCED",f=>{f.stage={...f.stage,currentRound:2};}));
  test("blocks final round",()=>includes("FINAL_ROUND_REQUIRES_REVIEW",f=>{f.stage={...f.stage,totalRounds:1};}));
  test("blocks missing next match",()=>includes("NEXT_MATCH_MISSING",f=>{f.stageMatches=f.stageMatches.filter(m=>m.id!==20);}));
  test("blocks completed dependent match",()=>includes("NEXT_MATCH_NOT_PRISTINE",f=>{f.stageMatches=f.stageMatches.map(m=>m.id===20?{...m,status:"completed"}:m);}));
  test("blocks occupied downstream slot mismatch",()=>includes("DOWNSTREAM_SLOT_MISMATCH",f=>{f.stageMatches=f.stageMatches.map(m=>m.id===20?{...m,player1Id:103}:m);}));
  test("blocks started later stage",()=>includes("STAGE_ADVANCED",f=>{f.stages=[...f.stages,{id:4,position:2,format:"round_robin",status:"active",currentRound:1,totalRounds:1}];}));
  test("blocks approved qualification",()=>includes("QUALIFICATION_ALREADY_COMMITTED",f=>{f.qualificationCommitted=true;}));
  test("blocks routed participants",()=>includes("ROUTING_ALREADY_COMMITTED",f=>{f.routingCommitted=true;}));
  test("blocks mismatched result history",()=>includes("HISTORY_NOT_VERIFIED",f=>{f.historyVerified=false;}));
  test("blocks ambiguous active completion actions",()=>includes("COMPLETION_ACTION_AMBIGUOUS",f=>{f.completionActionUnambiguous=false;}));
  test("blocks duplicate bracket coordinates",()=>includes("DUPLICATE_MATCH_COORDINATES",f=>{f.stageMatches=[...f.stageMatches,{...f.stageMatches[2],id:99}];}));
  test("blocks later non-pending match",()=>includes("LATER_RESULTS_EXIST",f=>{f.stageMatches=f.stageMatches.map(m=>m.id===30?{...m,status:"in_progress"}:m);}));
  test("blocks winner inconsistent with recorded score",()=>includes("MATCH_RESULT_INCONSISTENT",f=>{f.match={...f.match,winnerId:101};}));
  test("blocks non-SE formats",()=>includes("NOT_SINGLE_ELIMINATION",f=>{f.stage={...f.stage,format:"double_elimination"};}));
  test("blocks inactive tournament",()=>includes("TOURNAMENT_NOT_ACTIVE",f=>{f.tournamentStatus="completed";}));
  test("blocks inactive stage",()=>includes("STAGE_NOT_ACTIVE",f=>{f.stage={...f.stage,status:"completed"};}));
  test("blocks malformed stage assignment",()=>includes("MATCH_STAGE_INCONSISTENT",f=>{f.match={...f.match,stageId:77};}));
  test("blocks inconsistent match snapshots during read",()=>includes("MATCH_STAGE_INCONSISTENT",f=>{
    f.stageMatches=f.stageMatches.map(item=>item.id===10?{...item,score1:0}:item);
  }));
});
