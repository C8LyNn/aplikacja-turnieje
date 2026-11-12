import { test } from 'node:test';
import assert from 'node:assert/strict';
import { organizerStageSummary } from '../../artifacts/tournament-manager/src/lib/organizer-stage-summary.ts';
const stage = (format='swiss',status='active',extra={}) => ({id:71,format,status,...extra});
const match = (round,status,stageId=71) => ({round,status,stageId});
test('classic active stage: unfinished earliest round is preferred, not a stale stage counter',()=>{
  const result=organizerStageSummary(stage('swiss','active',{currentRound:99}),[
    match(1,'completed'),match(2,'pending'),match(3,'pending'),match(10,'in_progress',88)]);
  assert.equal(result.round,2);
  assert.equal(result.roundLabel,'Runda 2/3');
  assert.equal(result.totalMatches,3);
  assert.equal(result.completed,1);
  assert.equal(result.remaining,2);
});
test('live round dominates pending matches; smallest live round wins',()=>{
  const ms=[match(4,'in_progress'),match(6,'pending'),match(3,'in_progress'),match(2,'completed')];
  assert.equal(organizerStageSummary(stage(),ms).round,3);
});
test('completed classic stage chooses last existing positive round',()=>{
  const result=organizerStageSummary(stage('round_robin','completed'),[
    match(1,'completed'),match(5,'completed'),match(0,'completed')]);
  assert.equal(result.round,5);
  assert.equal(result.roundLabel,'Ostatnia runda 5/5');
});
test('planned stage does not present a current round',()=>{
  assert.equal(organizerStageSummary(stage('single_elimination','planned'),[match(1,'pending')]).round,undefined);
});
test('parallel double-elimination/group stages do not invent a shared round',()=>{
  for(const fmt of ['double_elimination','group_stage'])
    assert.equal(organizerStageSummary(stage(fmt),[match(1,'pending')]).round,undefined);
});
test('missing and zero-valued rounds do not infer a false active round',()=>{
  for(const ms of [undefined,[],[match(0,'completed')]]){
    const result=organizerStageSummary(stage('swiss'),ms);
    assert.equal(result.round,undefined);
    assert.equal(result.roundLabel,'Sprawdzanie rundy');
  }
});
test('160k matches: max and min computations do not overflow argument stack',()=>{
  const n=160_000;
  const ms=Array.from({length:n},(_,i)=>match((i%98)+1,'completed'));
  const result=organizerStageSummary(stage('single_elimination','completed'),ms);
  assert.equal(result.round,98);
  assert.equal(result.totalMatches,n);
  assert.equal(result.completed,n);
  assert.equal(result.remaining,0);
});
test('large pending array: candidate min does not overflow stack',()=>{
  const n=160_000;
  const ms=Array.from({length:n},(_,i)=>match((i%98)+1,'pending'));
  assert.equal(organizerStageSummary(stage('swiss'),ms).round,1);
});
test('does not mutate order or contents of the caller array',()=>{
  const ms=[match(2,'pending'),match(1,'completed')];const before=structuredClone(ms);
  organizerStageSummary(stage('swiss'),ms);assert.deepEqual(ms,before);
});
