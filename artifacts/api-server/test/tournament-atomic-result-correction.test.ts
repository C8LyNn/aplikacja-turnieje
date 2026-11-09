import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {deriveAtomicCorrectionDecision,isTerminalCorrectionState} from "../src/domain/tournament/atomic-result-correction";
const base = {bestOf:3,oldScore1:2,oldScore2:1,score1:1,score2:2,player1Id:7,player2Id:8};
describe("Pack 15 atomic correction pure contract",()=>{
  it("predicts new winner without mutation",()=>{
    const input={...base}; const copy={...input};
    assert.deepEqual(deriveAtomicCorrectionDecision(input),{allowed:true,winnerId:8,score1:1,score2:2});
    assert.deepEqual(input,copy);
  });
  it("preserves winner if corrected score does not change winner",()=>assert.deepEqual(
    deriveAtomicCorrectionDecision({...base,bestOf:5,oldScore1:3,oldScore2:1,score1:3,score2:2}),
    {allowed:true,winnerId:7,score1:3,score2:2}));
  for(const [name,values,code] of [
    ["no change",{score1:2,score2:1},"NO_CHANGE"],
    ["no p1",{player1Id:null},"INVALID_PARTICIPANTS"],
    ["no p2",{player2Id:null},"INVALID_PARTICIPANTS"],
    ["same player",{player2Id:7},"INVALID_PARTICIPANTS"],
    ["tie",{score1:1,score2:1},"INVALID_SERIES"],
    ["negative",{score1:-1,score2:2},"INVALID_SERIES"],
    ["fraction",{score1:0.5,score2:2},"INVALID_SERIES"],
    ["excess win threshold",{score1:2,score2:3},"INVALID_SERIES"],
    ["both reach wins",{score1:2,score2:2},"INVALID_SERIES"],
    ["odd series",{bestOf:2},"INVALID_SERIES"],
    ["zero best-of",{bestOf:0},"INVALID_SERIES"],
  ] as const) it(name,()=>{
    const result=deriveAtomicCorrectionDecision({...base,...values});
    assert.equal(result.allowed,false);
    if(!result.allowed) assert.equal(result.code,code);
  });
  it("allows BO1 correction",()=>assert.deepEqual(
    deriveAtomicCorrectionDecision({...base,bestOf:1,oldScore1:1,oldScore2:0,score1:0,score2:1}),
    {allowed:true,winnerId:8,score1:0,score2:1}));
  for(const [status,result] of [["approved",false],["corrected",true],["reverted_requires_resubmission",true],["expired",false],["pending",false]] as const)
    it(`terminal=${status}`,()=>assert.equal(isTerminalCorrectionState(status),result));
});
