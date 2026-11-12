import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCurrentRound } from '../../artifacts/tournament-manager/src/lib/stage-utils.ts';
const match=(round,status)=>({round,status});
test('active round dominates the last completed round',()=>{
 assert.equal(deriveCurrentRound([match(1,'completed'),match(2,'in_progress'),match(3,'pending')]),2);
});
test('out-of-order concurrent in-progress matches select the latest active round',()=>{
 assert.equal(deriveCurrentRound([match(2,'in_progress'),match(4,'in_progress'),match(3,'completed')]),4);
 assert.equal(deriveCurrentRound([match(4,'in_progress'),match(2,'in_progress'),match(3,'completed')]),4);
});
test('after active matches finish, choose latest completed round',()=>{
 assert.equal(deriveCurrentRound([match(2,'completed'),match(4,'pending'),match(1,'completed')]),2);
});
test('pending-only and empty states do not invent a completed round',()=>{
 assert.equal(deriveCurrentRound([match(1,'pending')]),null);
 assert.equal(deriveCurrentRound([]),null);
});
test('large tournament histories do not overflow the call stack',()=>{
 const list=Array.from({length:160000},(_,i)=>match(i%100+1,'completed'));
 assert.equal(deriveCurrentRound(list),100);
});
test('does not mutate caller match order or status',()=>{
 const input=[match(1,'in_progress'),match(2,'completed')];
 const copy=input.map(x=>({...x}));
 deriveCurrentRound(input);
 assert.deepEqual(input,copy);
});
