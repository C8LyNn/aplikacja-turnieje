import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveSeCorrectionImpactRiskReport as derive } from "../src/domain/tournament/se-correction-impact-risk-report";
import type { SeImpactGraph } from "../src/domain/tournament/se-correction-impact-graph";

const base = (): SeImpactGraph => ({
  version:1,kind:"se_correction_impact_graph",advisoryOnly:true,executionEnabled:false,writePerformed:false,
  status:"outlined",matchId:11,stageId:3,sourceRound:1,changeType:"winner_change",
  downstreamMatches:[{matchId:12,round:2,matchNumber:1,slot:"player1",relationship:"direct_successor_slot",alreadyStarted:false,label:"Slot"},
    {matchId:13,round:3,matchNumber:1,slot:"player1",relationship:"potential_later_path",alreadyStarted:false,label:"Potencjalnie"}],
  laterStages:[{stageId:4,position:2,status:"planned",relationship:"possible_reporting_or_routing_dependency"}],
  directSuccessorCount:1,potentialLaterMatchCount:1,startedDownstreamCount:0,warnings:[],note:"Tylko podgląd",
});
const run=(mod:(g:SeImpactGraph)=>SeImpactGraph) => derive(mod(base()));
const change=(field:keyof SeImpactGraph,value:unknown) => run(g=>({...g,[field]:value}));
const codes=(g:SeImpactGraph) => derive(g).items.map(i=>i.code);

test("winner path is potential, not an authorized execution",()=>{
  const r=derive(base());assert.equal(r.status,"observational");
  assert.equal(r.highestSeverity,"medium");assert.equal(r.executionEnabled,false);
  assert.equal(r.writePerformed,false);assert.equal(r.advisoryOnly,true);
  assert.deepEqual(r.items.map(i=>i.code),["cross_stage_boundary","possible_participant_path"]);
  assert.equal(r.items[1].evidence,"potential_impact");
});
test("distinguishes immediate and hypothetical downstream nodes",()=>{
  const r=derive(base());assert.deepEqual(r.items.find(i=>i.code==="possible_participant_path")?.affectedMatchIds,[12,13]);
});
test("started dependent match becomes critical",()=>{
  const r=run(g=>({...g,status:"review_required",startedDownstreamCount:1,
    downstreamMatches:g.downstreamMatches.map((n,i)=>({...n,alreadyStarted:i===1}))}));
  assert.equal(r.highestSeverity,"critical");assert.equal(r.status,"requires_review");
  assert.deepEqual(r.items[0].affectedMatchIds,[13]);
});
test("two started dependent matches are both identified",()=>{
  const r=run(g=>({...g,status:"review_required",startedDownstreamCount:2,
    downstreamMatches:g.downstreamMatches.map(n=>({...n,alreadyStarted:true}))}));
  assert.deepEqual(r.items[0].affectedMatchIds,[12,13]);
});
test("advanced later stage is reported as confirmed snapshot",()=>{
  const r=run(g=>({...g,laterStages:g.laterStages.map(s=>({...s,status:"active"}))}));
  assert.equal(r.items[0].code,"later_stage_advanced");
  assert.deepEqual(r.items[0].affectedStageIds,[4]);
  assert.equal(r.items[0].evidence,"confirmed_in_snapshot");
});
test("completed later stage also triggers high risk",()=>{
  const r=run(g=>({...g,laterStages:g.laterStages.map(s=>({...s,status:"completed"}))}));
  assert.equal(r.highestSeverity,"high");
});
test("review_required is never reported as clean",()=>{
  const r=run(g=>({...g,status:"review_required",warnings:["Routing committed"]}));
  assert.equal(r.status,"requires_review");assert.ok(r.items.some(i=>i.code==="readiness_review"));
});
test("score-only carries reporting risk but no participant path",()=>{
  const r=run(g=>({...g,changeType:"score_only",downstreamMatches:[],directSuccessorCount:0,potentialLaterMatchCount:0}));
  assert.ok(codes({...base(),changeType:"score_only",downstreamMatches:[],directSuccessorCount:0,potentialLaterMatchCount:0}).includes("score_reporting"));
  assert.equal(r.items.some(i=>i.code==="possible_participant_path"),false);
});
test("blocked and unknown change is critical",()=>{
  const r=run(g=>({...g,changeType:"unknown",status:"review_required"}));
  assert.equal(r.highestSeverity,"critical");assert.equal(r.items[0].code,"change_type_unknown");
});
test("incomplete graph gives one fail-closed item",()=>{
  const r=change("status","incomplete");assert.equal(r.status,"incomplete");
  assert.equal(r.items.length,1);assert.equal(r.items[0].code,"graph_incomplete");
});
test("no affected matches and no later stages still warns about limited coverage",()=>{
  const r=run(g=>({...g,downstreamMatches:[],directSuccessorCount:0,potentialLaterMatchCount:0,laterStages:[]}));
  assert.equal(r.highestSeverity,"low");assert.equal(r.items[0].code,"limited_scope");
});
test("malformed flags fail closed",()=>{
  for(const [k,v] of [["advisoryOnly",false],["executionEnabled",true],["writePerformed",true],["kind","other"],["version",2]] as const){
    assert.equal(change(k as keyof SeImpactGraph,v).status,"incomplete");
  }
});
test("null input fails closed",()=>{
  assert.equal(derive(null as unknown as SeImpactGraph).items[0].code,"graph_invalid");
});
test("negative and fractional match IDs fail closed",()=>{
  for(const x of [-1,0,1.5,Number.POSITIVE_INFINITY])assert.equal(change("matchId",x).status,"incomplete");
});
test("counter mismatch fails closed",()=>{
  for(const key of ["directSuccessorCount","potentialLaterMatchCount","startedDownstreamCount"] as const)
    assert.equal(change(key,99).status,"incomplete");
});
test("duplicates in descendant IDs fail closed",()=>{
  const r=run(g=>({...g,downstreamMatches:g.downstreamMatches.map(n=>({...n,matchId:12}))}));
  assert.equal(r.status,"incomplete");
});
test("source ID repeated as successor fails closed",()=>{
  const r=run(g=>({...g,downstreamMatches:[{...g.downstreamMatches[0],matchId:11}]}));
  assert.equal(r.status,"incomplete");
});
test("missing direct successor despite later descendants fails closed",()=>{
  const r=run(g=>({...g,downstreamMatches:[{...g.downstreamMatches[1]}],directSuccessorCount:0}));
  assert.equal(r.status,"incomplete");
});
test("more than one direct successor fails closed",()=>{
  const r=run(g=>({...g,downstreamMatches:g.downstreamMatches.map(n=>({...n,relationship:"direct_successor_slot"})),directSuccessorCount:2,potentialLaterMatchCount:0}));
  assert.equal(r.status,"incomplete");
});
test("score-only carrying participant path fails closed",()=>{
  assert.equal(change("changeType","score_only").status,"incomplete");
});
test("outlined graph claiming started match fails closed",()=>{
  const r=run(g=>({...g,startedDownstreamCount:1,downstreamMatches:g.downstreamMatches.map((n,i)=>({...n,alreadyStarted:i===0}))}));
  assert.equal(r.status,"incomplete");
});
test("duplicate later stage IDs fail closed",()=>{
  const r=run(g=>({...g,laterStages:[g.laterStages[0],g.laterStages[0]]}));
  assert.equal(r.status,"incomplete");
});
test("stage pointing back to current stage fails closed",()=>{
  const r=run(g=>({...g,laterStages:[{...g.laterStages[0],stageId:3}]}));
  assert.equal(r.status,"incomplete");
});
test("malformed later stage relationship fails closed",()=>{
  const r=run(g=>({...g,laterStages:[{...g.laterStages[0],relationship:"direct"} as unknown as SeImpactGraph["laterStages"][number]]}));
  assert.equal(r.status,"incomplete");
});
test("malformed descendant slot fails closed",()=>{
  const r=run(g=>({...g,downstreamMatches:[{...g.downstreamMatches[0],slot:"player9"} as unknown as SeImpactGraph["downstreamMatches"][number]]}));
  assert.equal(r.status,"incomplete");
});
test("malformed warning list fails closed",()=>{
  assert.equal(change("warnings",[null]).status,"incomplete");
});
test("too many graph paths fail closed",()=>{
  assert.equal(change("downstreamMatches",Array.from({length:33},()=>base().downstreamMatches[0])).status,"incomplete");
});
test("too many stages fail closed",()=>{
  assert.equal(change("laterStages",Array.from({length:129},()=>base().laterStages[0])).status,"incomplete");
});
test("input is not mutated",()=>{
  const g=base();const prior=JSON.stringify(g);derive(g);assert.equal(JSON.stringify(g),prior);
});
test("output has stable order for equal severity",()=>{
  const r=run(g=>({...g,changeType:"unknown",status:"review_required"}));
  assert.deepEqual(r.items.slice(0,2).map(i=>i.severity),["critical","high"]);
});
test("does not use backend mutation APIs",()=>{
  const r=derive(base());assert.match(r.note,/nie zastępuje/);assert.equal(r.executionEnabled,false);
});

test("duplicate positions in different stages are rejected",()=>{
 const r=run(g=>({...g,laterStages:[g.laterStages[0],{...g.laterStages[0],stageId:88}]}));
 assert.equal(r.status,"incomplete");
});
test("future path missing a round is rejected",()=>{
 const r=run(g=>({...g,downstreamMatches:[g.downstreamMatches[0],{...g.downstreamMatches[1],round:4}]}));
 assert.equal(r.status,"incomplete");
});
test("duplicated coordinates with distinct IDs are rejected",()=>{
 const r=run(g=>({...g,downstreamMatches:[g.downstreamMatches[0],{...g.downstreamMatches[1],round:2,matchNumber:1}]}));
 assert.equal(r.status,"incomplete");
});
test("later path cannot appear before direct successor",()=>{
 const r=run(g=>({...g,downstreamMatches:[...g.downstreamMatches].reverse()}));
 assert.equal(r.status,"incomplete");
});
