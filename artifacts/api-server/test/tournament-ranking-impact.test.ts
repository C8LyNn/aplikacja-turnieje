import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveTournamentRankingImpact, type RankingSnapshotRow } from '../src/application/operations/tournament-ranking-impact';
const row = (id: number, rank: number, wins = 0, gameDiff = 0, buchholz: number | null = null): RankingSnapshotRow => ({
  playerId: id, playerName: `Zespół ${id}`, rank, matchWins: wins, matchLosses: 2-wins,
  gameWins: Math.max(gameDiff,0), gameLosses: Math.max(-gameDiff,0), gameDiff, buchholz,
});
const before = [row(1,1,2,2),row(2,2,1,1),row(3,3,1,-1),row(4,4,0,-2)];
test('rank changes and qualification delta are exact',()=>{
  const result=deriveTournamentRankingImpact({ before, after:[row(3,1,2,3),row(1,2,1,0),row(2,3,1,1),row(4,4,0,-2)], qualifierCutoff:2 });
  assert.deepEqual(result.qualifierImpact.gainingPlayerIds,[3]);
  assert.deepEqual(result.qualifierImpact.losingPlayerIds,[2]);
  assert.equal(result.rows[0].rankDelta,2);
  assert.equal(result.movedRows,3);
});
test('same winner with different game score still flags stats',()=>{
  const result=deriveTournamentRankingImpact({ before, after:[row(1,1,2,3),...before.slice(1)], qualifierCutoff:2 });
  assert.equal(result.movedRows,0); assert.equal(result.changedRows,1);
  assert.deepEqual(result.qualifierImpact.gainingPlayerIds,[]);
});
test('buchholz change without rank change is shown',()=>{
  const result=deriveTournamentRankingImpact({ before, after:[row(1,1,2,2,4),...before.slice(1)], qualifierCutoff:null });
  assert.equal(result.changedRows,1);
  assert.equal(result.qualifierImpact.status,'not_applicable');
});
test('renames without sport changes do not count as sporting changes',()=>{
  const after=before.map(x=>({...x,playerName:'Nowa nazwa'}));
  assert.equal(deriveTournamentRankingImpact({before,after,qualifierCutoff:2}).changedRows,0);
});
test('no cutoff means no automatic advancement prediction',()=>{
  const result=deriveTournamentRankingImpact({before,after:before,qualifierCutoff:null});
  assert.deepEqual(result.qualifierImpact.beforePlayerIds,[]);
});
test('qualifier cutoff must fit participant set',()=>{
  assert.throws(()=>deriveTournamentRankingImpact({before,after:before,qualifierCutoff:5}),/Invalid qualification cutoff/);
  assert.throws(()=>deriveTournamentRankingImpact({before,after:before,qualifierCutoff:0}),/Invalid qualification cutoff/);
});
test('invalid participant change is rejected',()=>{
  assert.throws(()=>deriveTournamentRankingImpact({before,after:[row(9,1),...before.slice(1)],qualifierCutoff:null}),/membership changed/);
  assert.throws(()=>deriveTournamentRankingImpact({before,after:before.slice(0,3),qualifierCutoff:null}),/membership changed/);
});
test('duplicate player IDs are rejected',()=>{
  assert.throws(()=>deriveTournamentRankingImpact({before:[row(1,1),row(1,2)],after:[row(1,1),row(2,2)],qualifierCutoff:1}),/duplicate/);
});
test('duplicate rank is rejected',()=>{
  assert.throws(()=>deriveTournamentRankingImpact({before:[row(1,1),row(2,1)],after:[row(1,1),row(2,2)],qualifierCutoff:1}),/rank/);
});
test('empty ranking is rejected',()=>{
  assert.throws(()=>deriveTournamentRankingImpact({before:[],after:[],qualifierCutoff:null}),/empty/);
});
test('does not mutate original arrays',()=>{
  const a=structuredClone(before),b=structuredClone(before);
  deriveTournamentRankingImpact({before,after:b,qualifierCutoff:3});
  assert.deepEqual(a,b);
});
test('ordering is deterministic even when supplied after array is permuted',()=>{
  const actual=deriveTournamentRankingImpact({before,after:[before[3],before[1],before[0],before[2]],qualifierCutoff:2});
  assert.deepEqual(actual.rows.map(x=>x.playerId),[1,2,3,4]);
});
