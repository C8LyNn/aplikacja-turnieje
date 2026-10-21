import {test} from 'node:test';
import assert from 'node:assert/strict';
import {basketCasEtag, executeBasketCas, nextBasketRevision} from './basket-cas-server-core.mjs';

const epoch='123e4567-e89b-42d3-a456-426614174000';
const snapshot={tournamentId:77,epoch,revision:0n,stageDigest:'a'.repeat(64),rosterDigest:'b'.repeat(64),graph:{baskets:[],routes:[]}};
const TAG=()=>basketCasEtag(snapshot);
function fixture(){
  let durable=structuredClone(snapshot), writes=0, queue=Promise.resolve();
  const flags={deny:false,replaceFail:false,revisionFail:false};
  const adapter={
    async withTournamentTransaction(id,fn){
      const previous=queue;let release;queue=new Promise(r=>release=r);await previous;
      const working=structuredClone(durable);
      const tx={
        async assertOrganizer(actor){if(flags.deny||actor!=='organizer')throw Error('FORBIDDEN');},
        async readBasketState(){return {...structuredClone(working),tournamentId:id};},
        async validateReplacementGraph(graph){if(!graph||!Array.isArray(graph.baskets)||!Array.isArray(graph.routes))throw Error('BAD_GRAPH');},
        async replaceGraph(graph){working.graph=structuredClone(graph);if(flags.replaceFail)throw Error('REPLACE_FAILED');},
        async advanceRevision(expected,next){if(flags.revisionFail)throw Error('REVISION_FAILED');if(working.revision!==expected)return 0;working.revision=next;return 1;}
      };
      try{const result=await fn(tx);durable=working;writes++;return result;}finally{release();}
    }
  };
  return {adapter,flags,read:()=>structuredClone(durable),commits:()=>writes,edit(fn){const change=structuredClone(durable);fn(change);durable=change;}};
}
const args=(tag=TAG(),graph={baskets:[{id:'one'}],routes:[]})=>({tournamentId:77,actor:'organizer',ifMatch:tag,graph});

test('CAS-C01 opaque strong ETag deterministic and 43-char digest',()=>{
  assert.match(TAG(),/^"[A-Za-z0-9_-]{43}"$/);assert.equal(TAG(),TAG());
});
test('CAS-C02 ETag changes on revision, epoch, stage, roster or tournament',()=>{
  const current=TAG();
  for(const patch of [{revision:1n},{epoch:'123e4567-e89b-42d3-a456-426614174001'},
    {stageDigest:'c'.repeat(64)},{rosterDigest:'d'.repeat(64)},{tournamentId:78}]){
    assert.notEqual(basketCasEtag({...snapshot,...patch}),current);
  }
});
test('CAS-C03 rejects invalid token inputs and revision overflow',()=>{
  for(const value of [-1n,2n**63n,'1',1,undefined])assert.throws(()=>nextBasketRevision(value));
  assert.equal(nextBasketRevision(0n),1n);assert.equal(nextBasketRevision(2n**63n-2n),2n**63n-1n);
  assert.throws(()=>basketCasEtag({...snapshot,revision:2n**63n}),/REVISION/);
  assert.throws(()=>basketCasEtag({...snapshot,epoch:'bad'}),/EPOCH/);
});
test('CAS-C04 one accepted write advances persisted revision and ETag',async()=>{
  const f=fixture();const r=await executeBasketCas(f.adapter,args());
  assert.equal(r.status,200);assert.equal(f.read().revision,1n);assert.notEqual(r.etag,TAG());assert.equal(f.commits(),1);
  assert.deepEqual(r.graph,f.read().graph);
});
test('CAS-C05 an accepted no-op still advances revision (candidate policy)',async()=>{
  const f=fixture();const r=await executeBasketCas(f.adapter,args(TAG(),snapshot.graph));
  assert.equal(f.read().revision,1n);assert.notEqual(r.etag,TAG());
});
test('CAS-C06 stale token fails 412 before any graph writes',async()=>{
  const f=fixture();f.edit(s=>{s.revision=1n;});const before=f.read();
  await assert.rejects(executeBasketCas(f.adapter,args(TAG())),e=>e.status===412&&e.code==='STAGE_BASKET_CONFIGURATION_STALE');
  assert.deepEqual(f.read(),before);assert.equal(f.commits(),0);
});
test('CAS-C07 stage and roster drift invalidate previous validator',async()=>{
  for(const key of ['stageDigest','rosterDigest']){
    const f=fixture();f.edit(s=>{s[key]='d'.repeat(64)});
    await assert.rejects(executeBasketCas(f.adapter,args(TAG())),e=>e.status===412);
    assert.equal(f.commits(),0);
  }
});
test('CAS-C08 restore epoch rotation rejects previous token',async()=>{
  const f=fixture();f.edit(s=>{s.epoch='123e4567-e89b-42d3-a456-426614174001';s.revision=0n;});
  await assert.rejects(executeBasketCas(f.adapter,args(TAG())),e=>e.status===412);
});
test('CAS-C09 invalid precondition and denied actor never mutate durable state',async()=>{
  const f=fixture();
  await assert.rejects(executeBasketCas(f.adapter,{...args(),ifMatch:undefined}),e=>e.status===428);
  await assert.rejects(executeBasketCas(f.adapter,args('W/'+TAG())),e=>e.status===400);
  f.flags.deny=true;
  await assert.rejects(executeBasketCas(f.adapter,args()),/FORBIDDEN/);
  assert.equal(f.commits(),0);assert.equal(f.read().revision,0n);
});
test('CAS-C10 simulated rollback on graph/revision errors',async()=>{
  for(const key of ['replaceFail','revisionFail']){
    const f=fixture();f.flags[key]=true;
    await assert.rejects(executeBasketCas(f.adapter,args()));
    assert.equal(f.commits(),0);assert.deepEqual(f.read(),snapshot);
  }
});
test('CAS-C11 competing writers: exactly one accepted and one stale',async()=>{
  const f=fixture();const same=TAG();
  const results=await Promise.allSettled([executeBasketCas(f.adapter,args(same)),executeBasketCas(f.adapter,args(same))]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(results.filter(x=>x.status==='rejected'&&x.reason.status===412).length,1);
  assert.equal(f.read().revision,1n);assert.equal(f.commits(),1);
});
test('CAS-C12 failed CAS compare-and-set rolls back any graph changes',async()=>{
  const f=fixture();f.flags.revisionFail=true;
  await assert.rejects(executeBasketCas(f.adapter,args()),/REVISION_FAILED/);
  assert.deepEqual(f.read().graph,snapshot.graph);assert.equal(f.read().revision,0n);
});
test('CAS-C13 stable canonical binary SHA256 golden vector',()=>{
  assert.equal(TAG(),'"HtytNJDRiqgY4jw5p3cR30QgOATDG0_VMTAjCZnqeKA"');
});
test('CAS-C14 unauthorized actor rejected before revealing CAS precondition status',async()=>{
  const f=fixture();f.flags.deny=true;
  await assert.rejects(executeBasketCas(f.adapter,{...args(),ifMatch:undefined}),/FORBIDDEN/);
  assert.equal(f.commits(),0);
});
