import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  deriveResultCorrectionPreflight,
  type CorrectionPreviewInput, type CorrectionMatch,
} from "../src/application/operations/tournament-result-correction-preflight";
import { deriveEliminationBracketImpact } from "../src/application/operations/tournament-elimination-bracket-impact";

function match(id: number, round: number, matchNumber: number, player1Id: number | null, player2Id: number | null, status = "pending"): CorrectionMatch {
  return {id, stageId:4, round, matchNumber, status, revision:1,
    resultType:null,resultReason:null, player1Id,player2Id,winnerId:null,
    score1:null,score2:null,bestOf:3,completedAt:null};
}
function fixture(): CorrectionPreviewInput {
  const original = { ...match(101,1,1,11,12,"completed"), revision:3,
    resultType:"played",winnerId:11,score1:2,score2:0,completedAt:new Date("2026-09-01T12:00:00Z") };
  return {
    tournament:{status:"active",winnerId:null}, match:original,
    stages:[{id:4,position:1,name:"Play-off",format:"single_elimination",status:"active",currentRound:1,totalRounds:3}],
    stageMatches:[original,
      match(102,1,2,21,22),match(103,1,3,31,32),match(104,1,4,41,42),
      match(201,2,1,11,21),match(202,2,2,31,41),match(301,3,1,null,null)],
    nextStageMatches:[],approvedQualification:false,materializedRoute:false,
    latestHistoryMatches:true,activeCompletionActions:1,expectedRevision:3,
    proposedScore1:1,proposedScore2:2,
  };
}
function evaluate(modify?: (data: CorrectionPreviewInput)=>void) {
  const input=fixture();modify?.(input);
  return deriveEliminationBracketImpact({
    stage:input.stages.find(s=>s.id===input.match.stageId),
    match:input.match, stageMatches:input.stageMatches,
    preflight:deriveResultCorrectionPreflight(input),
  });
}
function available(result: ReturnType<typeof evaluate>) {
  if(result.status!=="available") {
    assert.fail(result.message);
  }
  assert.equal(result.status,"available");
  return result;
}

describe("Pack 10 — structural elimination bracket impact",()=>{
  test("finds direct slot and traces only structural ancestors",()=>{
    const x=available(evaluate());
    assert.equal(x.forecastScope,"structure_only");
    assert.equal(x.directSlot?.matchId,201);
    assert.equal(x.directSlot?.slot,"player1");
    assert.equal(x.directSlot?.currentPlayerId,11);
    assert.equal(x.directSlot?.hypotheticalPlayerId,12);
    assert.equal(x.directSlot?.pristine,true);
    assert.deepEqual(x.possibleDownstream.map(m=>m.matchId),[201,301]);
    assert.deepEqual(x.possibleDownstream.map(m=>m.relation),["direct_slot","possible_later_match"]);
    assert.equal(x.chainComplete,true);
  });
  test("maps even match number to second slot in next bracket match",()=>{
    const x=available(evaluate(i=>{
      i.match={...i.match,id:102,matchNumber:2,player1Id:21,player2Id:22,winnerId:21};
      i.expectedRevision=3;
      i.stageMatches=i.stageMatches.map(m=>m.id===102?i.match:m);
      i.stageMatches=i.stageMatches.map(m=>m.id===201?{...m,player2Id:21}:m);
    }));
    assert.equal(x.directSlot?.matchId,201);
    assert.equal(x.directSlot?.slot,"player2");
    assert.equal(x.directSlot?.currentPlayerId,21);
    assert.equal(x.directSlot?.hypotheticalPlayerId,22);
  });
  test("fourth first-round match feeds second semi-final",()=>{
    const x=available(evaluate(i=>{
      i.match={...i.match,id:104,matchNumber:4,player1Id:41,player2Id:42,winnerId:41};
      i.stageMatches=i.stageMatches.map(m=>m.id===104?i.match:m);
    }));
    assert.equal(x.directSlot?.matchId,202);
    assert.equal(x.directSlot?.slot,"player2");
  });
  test("score-only correction never invents changed participants",()=>{
    const x=available(evaluate(i=>{i.proposedScore1=2;i.proposedScore2=1;}));
    assert.equal(x.winnerChanges,false);
    assert.equal(x.directSlot,null);
    assert.deepEqual(x.possibleDownstream,[]);
  });
  test("direct match already started is a dependency warning, not green approval",()=>{
    const x=available(evaluate(i=>{
      i.stageMatches=i.stageMatches.map(m=>m.id===201?{...m,status:"in_progress"}:m);
    }));
    assert.equal(x.directSlot?.pristine,false);
    assert.ok(x.issues.some(m=>m.code==="DOWNSTREAM_MATCH_USED"));
    assert.equal(x.possibleDownstream[0].blocking,true);
  });
  test("direct match with finalized result is marked blocking",()=>{
    const x=available(evaluate(i=>{
      i.stageMatches=i.stageMatches.map(m=>m.id===201?{...m,status:"completed",resultType:"played",score1:2,score2:0,winnerId:11,completedAt:new Date()}:m);
    }));
    assert.equal(x.directSlot?.pristine,false);
    assert.equal(x.possibleDownstream[0].blocking,true);
  });
  test("wrong original winner in downstream slot is identified",()=>{
    const x=available(evaluate(i=>{
      i.stageMatches=i.stageMatches.map(m=>m.id===201?{...m,player1Id:99}:m);
    }));
    assert.equal(x.directSlot?.matchingCurrentWinner,false);
    assert.ok(x.issues.some(issue=>issue.code==="DIRECT_SLOT_MISMATCH"));
  });
  test("proposed winner cannot occur twice in downstream match",()=>{
    const x=available(evaluate(i=>{
      i.stageMatches=i.stageMatches.map(m=>m.id===201?{...m,player2Id:12}:m);
    }));
    assert.equal(x.directSlot?.pristine,false);
    assert.ok(x.issues.some(issue=>issue.code==="DUPLICATE_PARTICIPANT"));
  });
  test("missing parent round yields partial chain instead of fabricated descendant",()=>{
    const x=available(evaluate(i=>{i.stageMatches=i.stageMatches.filter(m=>m.round!==2);}));
    assert.equal(x.chainComplete,false);
    assert.equal(x.directSlot,null);
    assert.ok(x.issues.some(issue=>issue.code==="PARENT_ROUND_MISSING"));
  });
  test("duplicate match numbers yield partial chain",()=>{
    const x=available(evaluate(i=>{
      i.stageMatches=i.stageMatches.map(m=>m.id===202?{...m,matchNumber:1}:m);
    }));
    assert.equal(x.chainComplete,false);
    assert.ok(x.issues.some(issue=>issue.code==="AMBIGUOUS_NEXT_ROUND"));
  });
  test("noncontiguous match numbers do not infer parent from sorted index",()=>{
    const x=available(evaluate(i=>{
      i.stageMatches=i.stageMatches.map(m=>m.id===201?{...m,matchNumber:3}:m);
    }));
    assert.equal(x.chainComplete,false);
    assert.equal(x.directSlot,null);
  });
  test("mismatch between stage and match is unavailable",()=>{
    const x=evaluate(i=>{i.stages=[{...i.stages[0],id:99}];});
    assert.equal(x.status,"unavailable");
  });
  test("double elimination never pretends standard SE links are valid",()=>{
    const x=evaluate(i=>{i.stages=[{...i.stages[0],format:"double_elimination"}];});
    assert.equal(x.status,"unavailable");
    if(x.status==="unavailable") assert.equal(x.reasonCode,"DE_RUNTIME_REQUIRED");
  });
  test("Swiss and round robin are not elimination bracket projections",()=>{
    for(const format of ["swiss","round_robin","group_stage"] as const){
      const x=evaluate(i=>{i.stages=[{...i.stages[0],format}];});
      assert.equal(x.status,"unavailable");
    }
  });
  test("duplicate source match from separate reads is rejected",()=>{
    const x=evaluate(i=>{i.stageMatches=[...i.stageMatches,i.match];});
    assert.equal(x.status,"unavailable");
    if(x.status==="unavailable")assert.equal(x.reasonCode,"MATCH_SNAPSHOT_MISMATCH");
  });
  test("changed source revision between queries is rejected",()=>{
    const x=evaluate(i=>{i.stageMatches=i.stageMatches.map(m=>m.id===101?{...m,revision:4}:m);});
    assert.equal(x.status,"unavailable");
    if(x.status==="unavailable")assert.equal(x.reasonCode,"MATCH_SNAPSHOT_MISMATCH");
  });
  test("duplicate match numbers in source round stop structural guessing",()=>{
    const x=evaluate(i=>{i.stageMatches=i.stageMatches.map(m=>m.id===104?{...m,matchNumber:3}:m);});
    assert.equal(x.status,"unavailable");
    if(x.status==="unavailable")assert.equal(x.reasonCode,"AMBIGUOUS_SOURCE_ROUND");
  });
  test("missing totalRounds marks analysis incomplete",()=>{
    const x=available(evaluate(i=>{i.stages=[{...i.stages[0],totalRounds:null}];}));
    assert.equal(x.chainComplete,false);
    assert.ok(x.issues.some(issue=>issue.code==="TOTAL_ROUNDS_UNKNOWN"));
  });
  test("round after declared final round is unavailable",()=>{
    const x=evaluate(i=>{i.stages=[{...i.stages[0],totalRounds:0}];});
    assert.equal(x.status,"unavailable");
  });
  test("stale revision blocks exact bracket projection",()=>{
    const x=evaluate(i=>{i.expectedRevision=2;});
    assert.equal(x.status,"unavailable");
  });
  test("invalid result blocks projection",()=>{
    const x=evaluate(i=>{i.proposedScore1=1;i.proposedScore2=0;});
    assert.equal(x.status,"unavailable");
  });
  test("a final-round match has champion impact but no guessed parent",()=>{
    const x=available(evaluate(i=>{
      i.match={...i.match,id:301,round:3,matchNumber:1,player1Id:11,player2Id:31,winnerId:11};
      i.stageMatches=i.stageMatches.map(m=>m.id===301?i.match:m);
    }));
    assert.equal(x.finalRoundWinnerMayChange,true);
    assert.equal(x.directSlot,null);
    assert.deepEqual(x.possibleDownstream,[]);
  });
  test("approved qualification still blocks real correction even if bracket structurally resolvable",()=>{
    const x=available(evaluate(i=>{i.approvedQualification=true;}));
    assert.equal(x.provisional,true);
    assert.equal(x.directSlot?.matchId,201);
  });
  test("analysis is deterministic and never mutates any input",()=>{
    const original=fixture();const copy=structuredClone(original);
    const preflight=deriveResultCorrectionPreflight(original);
    const a=deriveEliminationBracketImpact({stage:original.stages[0],match:original.match,stageMatches:original.stageMatches,preflight});
    const b=deriveEliminationBracketImpact({stage:original.stages[0],match:original.match,stageMatches:original.stageMatches,preflight});
    assert.deepEqual(a,b);assert.deepEqual(original,copy);
  });
  test("does not accept another match's preflight result",()=>{
    const input=fixture();const preflight=deriveResultCorrectionPreflight(input);
    const x=deriveEliminationBracketImpact({stage:input.stages[0],match:input.match,stageMatches:input.stageMatches,preflight:{...preflight,matchId:999}});
    assert.equal(x.status,"unavailable");
  });
  test("structural result is never an operation authorization",()=>{
    const x=available(evaluate());
    assert.equal(x.provisional,true);
    assert.equal(x.forecastScope,"structure_only");
    assert.equal("canExecute" in x,false);
  });
});
