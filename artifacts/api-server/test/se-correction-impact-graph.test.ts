import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveSeCorrectionImpactGraph as derive, type ImpactGraphInput, type ImpactMatchRow } from "../src/domain/tournament/se-correction-impact-graph";

const m = (id: number, round: number, matchNumber: number, other: Partial<ImpactMatchRow> = {}): ImpactMatchRow => ({
  id, stageId: 7, round, matchNumber, status: "pending", resultType: null,
  score1: null, score2: null, winnerId: null, player1Id: null, player2Id: null,
  completedAt: null, ...other,
});
const seed = (): ImpactGraphInput => ({
  matchId: 1,
  stage: { id: 7, position: 1, format: "single_elimination", status: "active", totalRounds: 4 },
  stages: [
    { id: 7, position: 1, format: "single_elimination", status: "active", totalRounds: 4 },
    { id: 9, position: 2, format: "round_robin", status: "planned", totalRounds: 3 },
  ],
  stageMatches: [m(1,1,1,{status:"completed",resultType:"played",score1:2,score2:0,winnerId:11,player1Id:11,player2Id:12,completedAt:"2026-10-10T09:00:00Z"}),
    m(2,2,1,{player1Id:11}),m(3,3,1),m(4,4,1)],
  actionPlan: {kind:"se_correction_advisory_plan",advisoryOnly:true,executionEnabled:false,
    writePerformed:false,state:"candidate",changeType:"winner_change",matchId:1},
  qualificationCommitted:false,routingCommitted:false,
});
const update = (modify: (x: ImpactGraphInput) => ImpactGraphInput) => derive(modify(seed()));
const altered = (key: keyof ImpactGraphInput, value: unknown) => update(x => ({...x,[key]:value}));

test("winner-change walks three rounds without predicting future winners", () => {
  const result=derive(seed());
  assert.equal(result.status,"outlined");
  assert.deepEqual(result.downstreamMatches.map(x=>x.matchId),[2,3,4]);
  assert.deepEqual(result.downstreamMatches.map(x=>x.slot),["player1","player1","player1"]);
  assert.deepEqual(result.downstreamMatches.map(x=>x.relationship),
    ["direct_successor_slot","potential_later_path","potential_later_path"]);
  assert.equal(result.directSuccessorCount,1);
  assert.equal(result.potentialLaterMatchCount,2);
  assert.equal(result.startedDownstreamCount,0);
  assert.equal(result.executionEnabled,false);
  assert.equal(result.writePerformed,false);
});
test("right-side source maps to player2 in next match",()=>{
  const result=update(x=>({...x,matchId:5,
    stageMatches:[...x.stageMatches,m(5,1,2,{status:"completed"})],
    actionPlan:{...x.actionPlan,matchId:5}}));
  assert.equal(result.status,"outlined");
  assert.equal(result.downstreamMatches[0].slot,"player2");
});
test("nontrivial number progresses 5->3->2->1",()=>{
  const result=update(x=>({...x,matchId:10,
    stageMatches:[m(10,1,5),m(11,2,3),m(12,3,2),m(13,4,1)],
    actionPlan:{...x.actionPlan,matchId:10}}));
  assert.deepEqual(result.downstreamMatches.map(n=>n.matchNumber),[3,2,1]);
  assert.deepEqual(result.downstreamMatches.map(n=>n.slot),["player1","player1","player2"]);
});
test("score-only does not invent winner path",()=>{
  const result=update(x=>({...x,actionPlan:{...x.actionPlan,changeType:"score_only"}}));
  assert.equal(result.status,"outlined");
  assert.equal(result.downstreamMatches.length,0);
  assert.match(result.warnings[0],/samego wyniku/);
  assert.equal(result.laterStages.length,1);
});
test("unknown blocked plan describes hypothetical path but requires review",()=>{
  const result=update(x=>({...x,actionPlan:{...x.actionPlan,state:"blocked",changeType:"unknown"}}));
  assert.equal(result.status,"review_required");
  assert.equal(result.downstreamMatches.length,3);
  assert.match(result.warnings.join(" "),/zablokowana/);
});
test("started immediate descendant warns, remains nonexecutable",()=>{
  const result=update(x=>({...x,stageMatches:x.stageMatches.map(row=>row.id===2?{...row,status:"active"}:row)}));
  assert.equal(result.status,"review_required");
  assert.equal(result.startedDownstreamCount,1);
  assert.equal(result.downstreamMatches[0].alreadyStarted,true);
  assert.equal(result.executionEnabled,false);
});
test("completed grandchild also warned",()=>{
  const result=update(x=>({...x,stageMatches:x.stageMatches.map(row=>row.id===3?{...row,winnerId:22}:row)}));
  assert.equal(result.status,"review_required");
  assert.equal(result.startedDownstreamCount,1);
  assert.equal(result.downstreamMatches[1].relationship,"potential_later_path");
});
test("qualification committed warns",()=>{
  const result=altered("qualificationCommitted",true);
  assert.equal(result.status,"review_required");
  assert.match(result.warnings.join(" "),/kwalifikacje/);
});
test("routing committed warns",()=>{
  const result=altered("routingCommitted",true);
  assert.match(result.warnings.join(" "),/routing/);
});
test("already active later stage warns",()=>{
  const result=update(x=>({...x,stages:x.stages.map(s=>s.id===9?{...s,status:"active"}:s)}));
  assert.equal(result.status,"review_required");
  assert.equal(result.laterStages[0].stageId,9);
});
test("later stages are sorted by position",()=>{
  const result=update(x=>({...x,stages:[...x.stages,
    {id:10,position:3,format:"double_elimination",status:"planned",totalRounds:4}].reverse()}));
  assert.deepEqual(result.laterStages.map(s=>s.stageId),[9,10]);
});
test("source in final round no successors",()=>{
  const result=update(x=>({...x,matchId:4,actionPlan:{...x.actionPlan,matchId:4}}));
  assert.equal(result.status,"outlined");
  assert.equal(result.downstreamMatches.length,0);
});
test("missing next match fails closed with bounded partial chain",()=>{
  const result=update(x=>({...x,stageMatches:x.stageMatches.filter(m=>m.id!==3)}));
  assert.equal(result.status,"incomplete");
  assert.deepEqual(result.downstreamMatches.map(m=>m.matchId),[2]);
  assert.equal(result.directSuccessorCount,1);
  assert.equal(result.potentialLaterMatchCount,0);
});
test("missing source fails closed",()=>{
  const result=update(x=>({...x,stageMatches:x.stageMatches.filter(m=>m.id!==1)}));
  assert.equal(result.status,"incomplete");
  assert.equal(result.downstreamMatches.length,0);
});
test("duplicate coordinate fails closed",()=>{
  const result=update(x=>({...x,stageMatches:[...x.stageMatches,m(5,2,1)]}));
  assert.equal(result.status,"incomplete");
});
test("duplicate match id fails closed",()=>{
  const result=update(x=>({...x,stageMatches:[...x.stageMatches,m(1,2,2)]}));
  assert.equal(result.status,"incomplete");
});
test("other stage id in list fails closed",()=>{
  const result=update(x=>({...x,stageMatches:[...x.stageMatches,m(6,2,2,{stageId:9})]}));
  assert.equal(result.status,"incomplete");
});
test("invalid bracket number fails closed",()=>{
  const result=update(x=>({...x,stageMatches:[m(1,1,9),...x.stageMatches.slice(1)]}));
  assert.equal(result.status,"incomplete");
});
test("round bigger than total rounds fails closed",()=>{
  const result=update(x=>({...x,stageMatches:[...x.stageMatches,m(20,5,1)]}));
  assert.equal(result.status,"incomplete");
});
test("same stage position two stages fails closed",()=>{
  const result=update(x=>({...x,stages:[...x.stages,{...x.stages[1],id:88,position:2}]}));
  assert.equal(result.status,"incomplete");
});
test("changed snapshot stage row fails closed",()=>{
  const result=update(x=>({...x,stage:{...x.stage,status:"planned"}}));
  assert.equal(result.status,"incomplete");
});
test("non-SE format fails closed",()=>{
  const result=update(x=>({...x,stage:{...x.stage,format:"double_elimination"},
    stages:[{...x.stages[0],format:"double_elimination"},x.stages[1]]}));
  assert.equal(result.status,"incomplete");
});
test("broken action plan flags fail closed",()=>{
  for(const change of [{executionEnabled:true},{writePerformed:true},{advisoryOnly:false},{kind:"bad"}]){
    const result=update(x=>({...x,actionPlan:{...x.actionPlan,...change} as ImpactGraphInput["actionPlan"]}));
    assert.equal(result.status,"incomplete");
  }
});
test("candidate with unknown change fails closed",()=>{
  const result=update(x=>({...x,actionPlan:{...x.actionPlan,changeType:"unknown"}}));
  assert.equal(result.status,"incomplete");
});
test("blocked plan claiming winner change fails closed",()=>{
  const result=update(x=>({...x,actionPlan:{...x.actionPlan,state:"blocked"}}));
  assert.equal(result.status,"incomplete");
});
test("plan different match fails closed",()=>{
  const result=update(x=>({...x,actionPlan:{...x.actionPlan,matchId:2}}));
  assert.equal(result.status,"incomplete");
});
test("invalid type for routing flags fails closed",()=>{
  const result=altered("routingCommitted","false");
  assert.equal(result.status,"incomplete");
});
test("malformed date fails closed",()=>{
  const result=update(x=>({...x,stageMatches:[m(1,1,1,{completedAt:"notadate"}),...x.stageMatches.slice(1)]}));
  assert.equal(result.status,"incomplete");
});
test("null current analysis fails closed without throwing",()=>{
  assert.equal(derive(null as unknown as ImpactGraphInput).status,"incomplete");
});
test("bounded match count (2049) fails closed",()=>{
  const result=update(x=>({...x,stageMatches:Array.from({length:2049},(_,i)=>m(i+1,1,i+1))}));
  assert.equal(result.status,"incomplete");
});
test("bounded stage count (129) fails closed",()=>{
  const result=update(x=>({...x,stages:Array.from({length:129},(_,i)=>({id:i+1,position:i+1,format:"single_elimination",status:"planned",totalRounds:1}))}));
  assert.equal(result.status,"incomplete");
});
test("final-stage scenarios don't claim automatic route updates",()=>{
  const result=update(x=>({...x,stages:[x.stages[0]]}));
  assert.equal(result.laterStages.length,0);
  assert.match(result.note,/odrębnej oceny/);
  assert.equal(result.writePerformed,false);
});
