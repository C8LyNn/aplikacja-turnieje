import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stageMatchVersionVector } from '../src/application/operations/tournament-preview-coherence';
const a = { id: 11, stageId: 5, revision: 1, status:'completed', player1Id:1,player2Id:2,winnerId:1,score1:2,score2:1,resultType:'played',routingMatchKey:'m1' };
const b = { id: 12, stageId: 5, revision: 2, status:'pending', player1Id:1,player2Id:null,winnerId:null };
test('order independent and excludes unrelated stages',()=>{ const x=stageMatchVersionVector([a,b],5);assert.equal(x,stageMatchVersionVector([b,{...a}, {...a,id:90,stageId:6}],5)); });
test('detects revision, winner, scores and key changes',()=>{ const base=stageMatchVersionVector([a,b],5); for(const change of [{revision:3},{winnerId:2},{score1:0},{resultType:'bye'},{routingMatchKey:'m2'},{player2Id:5},{status:'cancelled'}]) assert.notEqual(stageMatchVersionVector([{...a,...change},b],5),base); });
test('detects added and removed matches',()=>{ assert.notEqual(stageMatchVersionVector([a],5),stageMatchVersionVector([a,b],5)); });
