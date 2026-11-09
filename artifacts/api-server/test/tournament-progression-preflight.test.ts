import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveTournamentOperations, type OperationsInput } from "../src/application/operations/tournament-operations";
import { deriveTournamentProgressionPreflight } from "../src/application/operations/tournament-progression-preflight";

function make(overrides: Partial<OperationsInput> = {}): OperationsInput {
  return {
    tournament: {id: 12, status: "active", format: "single_elimination", currentRound: 1, totalRounds: 1, activeStageId: 8},
    players: Array.from({length: 8}, (_,i) => ({id:i+1,seed:i+1})),
    stages: [{id:8,name:"Play-off",position:1,status:"active",format:"single_elimination",currentRound:1,totalRounds:1}],
    matches: [{id:1,stageId:8,round:1,status:"completed"},{id:2,stageId:8,round:1,status:"completed"}],
    ...overrides,
  };
}
function preview(input: OperationsInput) {
  return deriveTournamentProgressionPreflight(input, deriveTournamentOperations(input));
}
test("completed stage proposes review, never direct execution", () => {
  const result = preview(make());
  assert.equal(result.kind,"complete_stage");
  assert.equal(result.availability,"ready_for_review");
  assert.equal(result.requiresConfirmation,true);
  assert.equal(result.executionMustRevalidate,true);
  assert.ok(result.effects.some(x=>x.code==="QUALIFICATION_VERIFICATION"));
});
test("draft planned stage requires authoritative readiness", () => {
  const x=make({tournament:{id:12,status:"draft",format:"single_elimination",currentRound:null,totalRounds:null},stages:[{id:8,name:"Play-off",position:1,status:"planned",format:"single_elimination",currentRound:null,totalRounds:null}],matches:[]});
  assert.equal(preview(x).availability,"blocked");
  const y=preview({...x,plannedStageReadiness:{ready:true,reasonCode:"READY",message:"Etap gotowy"}});
  assert.equal(y.kind,"start_stage");
  assert.equal(y.availability,"ready_for_review");
});
test("not enough participants block draft stage",()=>{
  const x=make({tournament:{id:12,status:"draft",format:"single_elimination",currentRound:null,totalRounds:null},players:[],stages:[{id:8,name:"Play-off",position:1,status:"planned",format:"single_elimination",currentRound:null,totalRounds:null}],matches:[],plannedStageReadiness:{ready:true,reasonCode:"READY",message:"Gotowe"}});
  assert.ok(preview(x).checks.some(x=>x.code==="INSUFFICIENT_PARTICIPANTS"));
});
test("planned next stage displays prior completion and conditional effects",()=>{
  const x=make({stages:[{id:2,name:"Grupy",position:1,status:"completed",format:"group_stage",currentRound:1,totalRounds:1},{id:8,name:"Play-off",position:2,status:"planned",format:"single_elimination",currentRound:null,totalRounds:null}],matches:[],plannedStageReadiness:{ready:true,reasonCode:"READY",message:"Gotowe"}});
  const result=preview(x);
  assert.equal(result.availability,"ready_for_review");
  assert.equal(result.stageId,8);
  assert.ok(result.checks.some(c=>c.code==="PREVIOUS_STAGES_COMPLETE"&&c.status==="pass"));
});
test("open, live, postponed and cancelled matches each block closing",()=>{
  for(const status of ["pending","in_progress","postponed","cancelled"] as const) {
    const x=make({matches:[{id:1,stageId:8,round:1,status}]});
    const y=preview(x);
    assert.equal(y.availability,"blocked",status);
    assert.ok(y.checks.some(c=>c.code==="ALL_MATCHES_RESOLVED"&&c.status==="block"));
  }
});
test("no matches never authorizes stage completion",()=>{
  const y=preview(make({matches:[]}));
  assert.equal(y.availability,"blocked");
});
test("other stages matches are excluded from stage result",()=>{
  const y=preview(make({matches:[{id:1,stageId:8,round:1,status:"completed"},{id:2,stageId:99,round:1,status:"pending"}]}));
  assert.equal(y.availability,"ready_for_review");
});
test("swiss next round only when current round exists and is complete",()=>{
  const stage={id:8,name:"Swiss",position:1,status:"active" as const,format:"swiss",currentRound:2,totalRounds:4,plannedRounds:4};
  const x=make({tournament:{id:12,status:"active",format:"swiss",currentRound:2,totalRounds:4},stages:[stage],matches:[{id:1,stageId:8,round:2,status:"completed"}]});
  const a=preview(x);
  assert.equal(a.kind,"swiss_next_round"); assert.equal(a.availability,"ready_for_review");
  const b=preview({...x,matches:[{id:1,stageId:8,round:1,status:"completed"}]});
  assert.equal(b.availability,"blocked");
});
test("swiss unknown round metadata always blocks",()=>{
  const y=preview(make({tournament:{id:12,status:"active",format:"swiss",currentRound:null,totalRounds:null},stages:[{id:8,name:"Swiss",position:1,status:"active",format:"swiss",currentRound:null,totalRounds:null}],matches:[{id:1,stageId:8,round:1,status:"completed"}]}));
  assert.equal(y.availability,"blocked");
});
test("downstream stages are conditional, never auto-start",()=>{
  const x=make({stages:[{id:8,name:"Grupy",position:1,status:"active",format:"group_stage",currentRound:1,totalRounds:1},{id:9,name:"Play-off",position:2,status:"planned",format:"single_elimination",currentRound:null,totalRounds:null}]});
  const y=preview(x);
  assert.ok(y.effects.some(e=>e.code==="NEXT_STAGE_STILL_PLANNED"));
  assert.equal(y.requiresConfirmation,true);
});
test("inconsistent active stages stop progression",()=>{
  const x=make({stages:[{id:8,name:"A",position:1,status:"active",format:"round_robin",currentRound:1,totalRounds:1},{id:9,name:"B",position:2,status:"active",format:"round_robin",currentRound:1,totalRounds:1}]});
  const y=preview(x);assert.equal(y.kind,"review");assert.equal(y.availability,"blocked");
});
test("completed tournament has no mutable progression",()=>{
  const y=preview(make({tournament:{id:12,status:"completed",format:"single_elimination",currentRound:1,totalRounds:1}}));
  assert.equal(y.kind,"none");assert.equal(y.availability,"not_applicable");
});
test("pure deterministic input remains unchanged",()=>{
  const input=make();const snapshot=structuredClone(input);
  assert.deepEqual(preview(input),preview(input));assert.deepEqual(input,snapshot);
});
