#!/usr/bin/env node
'use strict';
// A51 R17 static source/fixture preflight ONLY; never a Unity gameplay acceptance test.
const fs=require('node:fs'),path=require('node:path');
const argv=process.argv.slice(2);
function arg(key){let found=argv.find(a=>a.startsWith('--'+key+'='));return found&&found.slice(key.length+3);}
const source=arg('source'),matrix=arg('matrix');
if(!source||!matrix){console.error('Usage: node r17-a51-static-preflight.cjs --source=/path/CoreClash-V149-Unity --matrix=/path/R17_A51_PARTIAL_FIXTURE_MATRIX_001.json');process.exit(2);}
const expected=['wallmaker','barricade','repairpulse','engineer','bastion','commander','quartermaster','armorer','splitter','hatchery','replicator','mitosis','swarmcore','conscriptor','firebrand','chainfrost','ashcore','furnace','frostguard'];
const errors=[],check=(v,msg)=>{if(!v)errors.push(msg);};
try{
 const root=path.resolve(source),data=JSON.parse(fs.readFileSync(matrix,'utf8'));
 const support=JSON.parse(fs.readFileSync(path.join(root,'Evidence/R16/ability-support.json'),'utf8'));
 check(data.schema==='CC001_R17_A51_PARTIAL_ACCEPTANCE_FIXTURES_V1','unexpected fixture schema');
 check(support.revision==='R16','wrong R16 status registry revision');
 check(data.abilities?.length===19,'expected exactly 19 abilities');
 check(data.fixtures?.length===42,'expected exactly 42 unexecuted fixture definitions');
 check(new Set(data.abilities?.map(a=>a.id)).size===19,'duplicate ability ID');
 check(new Set(data.fixtures?.map(a=>a.case_id)).size===42,'duplicate fixture ID');
 for(const id of expected){
   const a=data.abilities.find(x=>x.id===id),status=support.balls.find(x=>x.id===id);
   check(!!a,id+': ability missing');if(!a)continue;
   check(status?.status==='PARTIAL',id+': baseline no longer PARTIAL');
   check(a.readiness==='PARTIAL'&&a.runtime_acceptance==='NOT_EXECUTED_R17',id+': unauthorized readiness claim');
   for(const k of ['source_file','existing_test_file']){
     const f=path.resolve(root,a[k]);
     check(f.startsWith(root+path.sep),id+': source path escape');
     check(fs.existsSync(f),id+': missing '+k);
     if(fs.existsSync(f))check(fs.readFileSync(f,'utf8').toLowerCase().includes(id),id+': identifier not present in '+k);
   }
   for(const kind of ['POSITIVE','CATCH'])check(data.fixtures.some(x=>x.ball_id===id&&x.kind===kind),id+': missing '+kind);
 }
 for(const f of data.fixtures||[]){
   check(expected.includes(f.ball_id),'out-of-cohort '+f.case_id);
   check(f.execution_status==='NOT_RUN','false execution claim '+f.case_id);
   check(f.oracle_status==='PENDING_A50_A60','false semantic-approval claim '+f.case_id);
   check(['source_id','target_id','event_order','state_before','state_after','host_authority'].every(k=>f.record?.includes(k)),'missing trace fields '+f.case_id);
 }
 console.log(JSON.stringify({kind:'STATIC_ONLY',abilities:data.abilities.length,fixture_definitions:data.fixtures.length,check:errors.length?'FAIL':'PASS',errors},null,2));
 process.exit(errors.length?1:0);
}catch(e){console.error('BLOCKED: '+e.message);process.exit(2);}
