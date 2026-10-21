import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basketCasEtag, executeBasketCas } from './basket-cas-server-core.mjs';
import { createBasketCasPgSourceAdapter, readBasketCasSnapshot, freshCloneCasIdentity, refuseInPlaceBasketRestore } from './basket-cas-pg-source-adapter.mjs';

const EPOCH='123e4567-e89b-42d3-a456-426614174000';
const BASE={ id:77,status:'draft',revision:'0',epoch:EPOCH };
const GRAPH={baskets:[],routes:[]};
const REPLACE={baskets:[{id:'new'}],routes:[]};
function fake(){
 let db={tournament:{...BASE},graph:structuredClone(GRAPH),stages:[{id:9,status:'planned',version:1}],players:[{id:12,name:'A'}],memberships:[],assignments:[],routes:[],routeEntries:[],routeExecutions:[],routingPlans:[],gameConfigs:[],proposals:[],proposalEntries:[],outputPlayers:[],groups:[],routingExecutions:[]};
 let log=[],begun=false,working=null,commits=0,rollbacks=0,fail='',denyWrite=false,denyRead=false,releaseCount=0,releaseArgs=[];
 const ports={
   async assertOrganizer(client,row,actor){log.push('authorize-write');if(denyWrite||actor!=='owner')throw Error('DENIED_WRITE');return true;},
   async assertReader(client,row,actor){log.push('authorize-read');if(denyRead||actor!=='viewer')throw Error('DENIED_READ');return true;},
   async readGraph(client,id){log.push('graph-read');return structuredClone(working.graph);},
   async validateGraph(client,id,graph,actor){log.push('validate-actor:'+String(actor));log.push('graph-validate');if(!graph||!Array.isArray(graph.baskets)||!Array.isArray(graph.routes))throw Error('INVALID_GRAPH');if(fail==='validation')throw Error('BAD_GRAPH');return true;},
   async replaceGraph(client,id,graph,actor){log.push('replace-actor:'+String(actor));log.push('graph-replace');working.graph=structuredClone(graph);if(fail==='replace')throw Error('REPLACE_FAILURE');return true;},
 };
 const client={
   async query(sql,params=[]){
     log.push(sql); if(fail==='query' && /to_jsonb/.test(sql))throw Error('READ_FAILURE');
     if(fail==='network' && /to_jsonb/.test(sql)){const e=Error('SIMULATED_CONNECTION_TERMINATED');e.code='08006';throw e;}
     if(fail==='begin' && sql.startsWith('BEGIN'))throw Error('SIMULATED_BEGIN_FAILED');
     if(sql.startsWith('BEGIN')){assert.equal(begun,false);begun=true;working=structuredClone(db);return {rowCount:0,rows:[]};}
     if(sql==='COMMIT'){if(fail==='commit')throw Error('COMMIT_FAILURE');db=working;commits++;begun=false;return {rowCount:0,rows:[]};}
     if(sql==='ROLLBACK'){if(fail==='rollback')throw Error('ROLLBACK_CONNECTION_FAILED');rollbacks++;begun=false;return {rowCount:0,rows:[]};}
     assert.ok(begun,'query outside transaction');
     if(sql.includes('to_jsonb(t) AS row FROM tournaments t'))return {rows:[{row:structuredClone(working.tournament)}],rowCount:1};
     if(/SELECT.*FROM tournaments.*FOR UPDATE/i.test(sql))return {rows:[{...working.tournament}],rowCount:1};
     if(/SELECT.*FROM tournaments/i.test(sql))return {rows:[{...working.tournament}],rowCount:1};
     if(/UPDATE tournaments/i.test(sql)){
       const [id,previous,epoch,next]=params;
       if(fail==='cas-rowcount')return {rows:[],rowCount:0};
       assert.equal(id,77);assert.equal(previous,working.tournament.revision);assert.equal(epoch,working.tournament.epoch);
       working.tournament.revision=String(next);
       return {rows:[{revision:String(next)}],rowCount:1};
     }
     if(sql.includes('to_jsonb(')){
       if(sql.includes('FROM stage_groups g JOIN'))return {rows:working.groups.map(row=>({row:structuredClone(row)}))};
       if(sql.includes('FROM tournament_routing_executions e JOIN'))return {rows:working.routingExecutions.map(row=>({row:structuredClone(row)}))};
       const hit=[['tournament_stages','stages'],['stage_participants','memberships'],['stage_basket_participants','assignments'],['stage_basket_route_entries','routeEntries'],['stage_basket_route_executions','routeExecutions'],['tournament_routing_plans','routingPlans'],['tournament_game_configs','gameConfigs'],['qualification_proposals','proposals'],['qualification_proposal_entries','proposalEntries'],['stage_basket_output_players','outputPlayers'],['players','players']].find(([table])=>sql.includes('FROM '+table+' '));
       if(!hit)throw Error('UNEXPECTED_SQL '+sql);
       const rows=working[hit[1]];
       return {rows:rows.map(row=>({row:structuredClone(row)})),rowCount:rows.length};
     }
     throw Error('UNEXPECTED_SQL '+sql);
   },
   release(reason){releaseCount++;releaseArgs.push(reason);}
 };
 const pool={async connect(){log.push('connect');return client;}};
 const adapter=createBasketCasPgSourceAdapter({pool,ports});
 return {adapter,ports,log,read:()=>structuredClone(db),mutate(fn){fn(db);},fail(v){fail=v;},denyWrite(v){denyWrite=v;},denyRead(v){denyRead=v;},commits:()=>commits,rollbacks:()=>rollbacks,releases:()=>releaseCount,releaseArgs:()=>releaseArgs};
}
async function current(f){const x=await readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'viewer'});return x.etag;}

test('W6I-01 GET uses REPEATABLE READ READ ONLY and committed graph/ETag',async()=>{
 const f=fake();const result=await readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'viewer'});
 assert.equal(result.status,200);assert.equal(result.cacheControl,'private, no-store');assert.deepEqual(result.body,GRAPH);assert.match(result.etag,/^"[A-Za-z0-9_-]{43}"$/);
 assert.ok(f.log.indexOf('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')<f.log.indexOf('authorize-read'));
 assert.ok(f.log.includes('COMMIT'));assert.equal(f.releases(),1);
});
test('W6I-02 PUT starts SERIALIZABLE and parent FOR UPDATE before actor and graph',async()=>{
 const f=fake();const tag=await current(f);f.log.length=0;
 const out=await executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:tag,graph:REPLACE});
 assert.equal(out.status,200);assert.equal(f.read().tournament.revision,'1');assert.deepEqual(f.read().graph,REPLACE);assert.equal(f.commits(),2);
 const lock=f.log.findIndex(x=>/FOR UPDATE/.test(x)),auth=f.log.indexOf('authorize-write'),graph=f.log.indexOf('graph-replace');
 assert.ok(f.log.indexOf('BEGIN ISOLATION LEVEL SERIALIZABLE')<lock);assert.ok(lock<auth&&auth<graph);
 assert.ok(f.log.findIndex(x=>/UPDATE tournaments/.test(x))>graph);
});
test('W6I-03 missing/weak If-Match fails after auth, no update',async()=>{
 for(const token of [undefined,'W/"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"']){
   const f=fake();await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:token,graph:REPLACE}),e=>e.status=== (token?400:428));
   assert.equal(f.commits(),0);assert.equal(f.rollbacks(),1);assert.equal(f.read().tournament.revision,'0');assert.ok(!f.log.some(x=>/UPDATE tournaments/.test(x)));
 }
});
test('W6I-04 revoked organizer fails before If-Match exposure or graph reads',async()=>{
 const f=fake();f.denyWrite(true);
 await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:undefined,graph:REPLACE}),/DENIED_WRITE/);
 assert.ok(!f.log.includes('graph-read'));assert.equal(f.rollbacks(),1);
});
test('W6I-05 stale validator prevents graph writes',async()=>{
 const f=fake();const stale=await current(f);f.mutate(db=>{db.tournament.revision='1'});
 await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:stale,graph:REPLACE}),e=>e.status===412);
 assert.deepEqual(f.read().graph,GRAPH);assert.equal(f.read().tournament.revision,'1');
});
test('W6I-06 stage and roster edits invalidate GET ETag',async()=>{
 const f=fake();const initial=await current(f);
 f.mutate(x=>{x.stages[0].version++});assert.notEqual(await current(f),initial);
 f.mutate(x=>{x.players.push({id:13,name:'B'})});assert.notEqual(await current(f),initial);
});
test('W6I-07 accepted no-op increments revision exactly once',async()=>{
 const f=fake(),tag=await current(f);const o=await executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:tag,graph:GRAPH});
 assert.notEqual(o.etag,tag);assert.equal(f.read().tournament.revision,'1');
});
test('W6I-08 graph validation failure rolls back and keeps revision',async()=>{
 const f=fake(),tag=await current(f);f.fail('validation');
 await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:tag,graph:REPLACE}),/BAD_GRAPH/);
 assert.equal(f.read().tournament.revision,'0');assert.deepEqual(f.read().graph,GRAPH);
});
test('W6I-09 graph write failure rolls back',async()=>{
 const f=fake(),tag=await current(f);f.fail('replace');
 await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:tag,graph:REPLACE}),/REPLACE_FAILURE/);
 assert.equal(f.read().tournament.revision,'0');assert.deepEqual(f.read().graph,GRAPH);
});
test('W6I-10 conditional revision miss rolls back graph',async()=>{
 const f=fake(),tag=await current(f);f.fail('cas-rowcount');
 await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:tag,graph:REPLACE}),/CONDITIONAL_REVISION_WRITE_FAILED/);
 assert.equal(f.read().tournament.revision,'0');assert.deepEqual(f.read().graph,GRAPH);
});
test('W6I-11 bad source query fails closed and releases connection',async()=>{
 const f=fake();f.fail('query');await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'viewer'}),/READ_FAILURE/);
 assert.equal(f.rollbacks(),1);assert.equal(f.releases(),1);
});
test('W6I-12 unauthorized GET returns no graph and rolls back',async()=>{
 const f=fake();f.denyRead(true);await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'viewer'}),/DENIED_READ/);
 assert.ok(!f.log.includes('graph-read'));assert.equal(f.rollbacks(),1);
});
test('W6I-13 COMMIT ambiguous never claims success',async()=>{
 const f=fake(),tag=await current(f);f.fail('commit');await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:tag,graph:REPLACE}),/COMMIT_UNCERTAIN/);
 assert.ok(!f.read().tournament.revision||f.read().tournament.revision==='0');
});
test('W6I-14 clone minted fresh UUID/revision and forbids in-place restore',()=>{
 const a=freshCloneCasIdentity(),b=freshCloneCasIdentity();assert.equal(a.revision,0n);assert.notEqual(a.epoch,b.epoch);
 assert.match(a.epoch,/^[0-9a-f-]{36}$/);assert.throws(()=>refuseInPlaceBasketRestore(),/IN_PLACE_RESTORE_DENIED/);
});
test('W6I-15 reject unverified adapter ports and invalid request scope',async()=>{
 assert.throws(()=>createBasketCasPgSourceAdapter({pool:{},ports:{}}),/ADAPTER_CONTRACT/);
 const f=fake();await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:0,actor:'viewer'}),/TOURNAMENT_INVALID/);
});
test('W6I-16 no key-order dependence in canonical DB rows',async()=>{
 const f=fake(),a=await current(f);
 f.mutate(x=>{x.stages=[{version:1,status:'planned',id:9}];x.players=[{name:'A',id:12}];});
 assert.equal(await current(f),a);
});

test('W6I-17 out-of-band graph mutation invalidates current server token',async()=>{
 const f=fake(),a=await current(f);f.mutate(x=>{x.graph={baskets:[{id:'injected'}],routes:[]};});
 assert.notEqual(await current(f),a);
});
test('W6I-18 missing stages cannot yield apparently valid validator',async()=>{
 const f=fake();f.mutate(x=>{x.stages=[]});
 await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'viewer'}),/STAGES_MISSING/);
 assert.equal(f.rollbacks(),1);
});

// W6I-R3 / A30 negative regression matrix: explicit authorization, sealing,
// and connection quarantine. Pure injected fake client; no real SQL executed.
test('R3-01 CAS-SEC-01: organizer false, null, undefined and nonboolean reject before graph',async()=>{
  for(const result of [false,null,undefined,0,1,'true',{},[]]){
    const f=fake();f.ports.assertOrganizer=async()=>result;
    await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:undefined,graph:REPLACE}),/WEB005_BASKET_CAS_AUTHORIZATION_DENIED/);
    assert.ok(!f.log.includes('graph-read'));assert.ok(!f.log.includes('graph-replace'));
    assert.equal(f.commits(),0);assert.equal(f.rollbacks(),1);assert.equal(f.releases(),1);
  }
});
test('R3-02 CAS-SEC-01: reader false, null, undefined and nonboolean reject before graph',async()=>{
  for(const result of [false,null,undefined,0,1,'true',{},[]]){
    const f=fake();f.ports.assertReader=async()=>result;
    await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'viewer'}),/WEB005_BASKET_CAS_AUTHORIZATION_DENIED/);
    assert.ok(!f.log.includes('graph-read'));assert.equal(f.commits(),0);assert.equal(f.rollbacks(),1);
  }
});
test('R3-03 CAS-SEC-02: arbitrary transaction callback no longer publicly available',()=>{
  const f=fake();assert.equal('withTournamentTransaction' in f.adapter,false);
  assert.equal(typeof f.adapter.executeBasketCasWrite,'function');
});
test('R3-04 CAS-SEC-02: direct writer cannot omit If-Match even if organizer valid',async()=>{
  const f=fake();await assert.rejects(f.adapter.executeBasketCasWrite({tournamentId:77,actor:'owner',graph:REPLACE}),e=>e.status===428);
  assert.deepEqual(f.read().graph,GRAPH);assert.equal(f.read().tournament.revision,'0');assert.equal(f.commits(),0);
});
test('R3-05 CAS-SEC-02: direct writer cannot bypass organizer with valid ETag',async()=>{
  const f=fake();const etag=await current(f);f.ports.assertOrganizer=async()=>false;
  await assert.rejects(f.adapter.executeBasketCasWrite({tournamentId:77,actor:'owner',ifMatch:etag,graph:REPLACE}),/AUTHORIZATION_DENIED/);
  assert.deepEqual(f.read().graph,GRAPH);assert.equal(f.read().tournament.revision,'0');
});
test('R3-06 CAS-SEC-02: direct writer must validate graph and cannot bump revision on rejected graph',async()=>{
  const f=fake(),etag=await current(f);f.ports.validateGraph=async()=>false;
  await assert.rejects(f.adapter.executeBasketCasWrite({tournamentId:77,actor:'owner',ifMatch:etag,graph:REPLACE}),/GRAPH_VALIDATION_DENIED/);
  assert.equal(f.read().tournament.revision,'0');assert.deepEqual(f.read().graph,GRAPH);
  assert.ok(!f.log.includes('graph-replace'));assert.ok(!f.log.some(x=>/^UPDATE tournaments/.test(x)));
});
test('R3-07 CAS-SEC-02: one direct valid no-op write increments exactly once',async()=>{
  const f=fake(),etag=await current(f);const result=await f.adapter.executeBasketCasWrite({tournamentId:77,actor:'owner',ifMatch:etag,graph:GRAPH});
  assert.equal(result.status,200);assert.equal(f.read().tournament.revision,'1');assert.notEqual(result.etag,etag);
  assert.equal(f.log.filter(x=>/^UPDATE tournaments/.test(x)).length,1);
});
test('R3-08 CAS-SEC-03: uncertain COMMIT discards client (never reusable release)',async()=>{
  const f=fake(),etag=await current(f);f.fail('commit');
  await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:etag,graph:REPLACE}),/COMMIT_UNCERTAIN/);
  assert.equal(f.releases(),2);assert.ok(f.releaseArgs()[1] instanceof Error);
  assert.equal(f.releaseArgs()[0],undefined);
});
test('R3-09 CAS-SEC-03: failed ROLLBACK quarantines and preserves causes',async()=>{
  const f=fake();f.fail('rollback');let cause;
  await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'untrusted'}),e=>{
    cause=e.cause;return /ROLLBACK_UNCERTAIN/.test(e.message)&&cause instanceof AggregateError&&cause.errors.length===2;
  });
  assert.ok(f.releaseArgs()[0] instanceof Error);assert.match(cause.errors[0].message,/DENIED_READ/);
  assert.match(cause.errors[1].message,/ROLLBACK_CONNECTION_FAILED/);
});
test('R3-10 CAS-SEC-03: terminal network errors discard even after successful ROLLBACK',async()=>{
  const f=fake();f.fail('network');await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'viewer'}),/SIMULATED_CONNECTION_TERMINATED/);
  assert.equal(f.rollbacks(),1);assert.ok(f.releaseArgs()[0] instanceof Error);
});
test('R3-11 CAS-SEC-03: BEGIN uncertainty discards, no normal release',async()=>{
  const f=fake();f.fail('begin');await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'viewer'}),/SIMULATED_BEGIN_FAILED/);
  assert.ok(f.releaseArgs()[0] instanceof Error);assert.equal(f.releases(),1);
});
test('R3-12 CAS-SEC-03: ordinary validated rollback returns healthy client normally',async()=>{
  const f=fake();await assert.rejects(readBasketCasSnapshot(f.adapter,{tournamentId:77,actor:'not-viewer'}),/DENIED_READ/);
  assert.equal(f.releaseArgs()[0],undefined);assert.equal(f.rollbacks(),1);
});

test('CLOSE-01 full mutable parent and game config change the ETag',async()=>{
 const f=fake(),previous=await current(f);
 f.mutate(x=>x.tournament.maxPlayers=64);assert.notEqual(await current(f),previous);
 const f2=fake(),old=await current(f2);f2.mutate(x=>x.gameConfigs.push({tournament_id:77,game_id:'g',config:{quota:3}}));assert.notEqual(await current(f2),old);
});
test('CLOSE-02 qualification proposals and output cannot reuse old validator',async()=>{
 for(const field of ['proposals','proposalEntries','outputPlayers']){
  const f=fake(),old=await current(f);f.mutate(x=>x[field].push({id:17,tournament_id:77,revision:2}));assert.notEqual(await current(f),old);
 }
});
test('CLOSE-03 group and routing-execution mutation invalidate GET',async()=>{
 for(const field of ['groups','routingExecutions']){
  const f=fake(),old=await current(f);f.mutate(x=>x[field].push({id:18,revision:3}));assert.notEqual(await current(f),old);
 }
});
test('CLOSE-04 injected graph operations receive exact authenticated actor and shared client',async()=>{
 const f=fake(),token=await current(f);
 const out=await executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:token,graph:REPLACE});
 assert.equal(out.status,200);assert.ok(f.log.includes('validate-actor:owner'));assert.ok(f.log.includes('replace-actor:owner'));
 const lock=f.log.findIndex(x=>typeof x==='string'&&x.includes('FOR UPDATE'));
 assert.ok(lock<f.log.indexOf('validate-actor:owner'));
});
test('CLOSE-05 no write accepted on stale game config snapshot',async()=>{
 const f=fake(),stale=await current(f);
 f.mutate(x=>x.gameConfigs.push({tournament_id:77,game_id:'g',config:{quota:99}}));
 await assert.rejects(executeBasketCas(f.adapter,{tournamentId:77,actor:'owner',ifMatch:stale,graph:REPLACE}),e=>e.status===412);
 assert.equal(f.read().tournament.revision,'0');assert.deepEqual(f.read().graph,GRAPH);
});
