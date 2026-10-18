#!/usr/bin/env node
'use strict';
// Source contract and negative-control friendly validation. Not a C# compiler.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),results=[];
const output=process.argv.find(x=>x.startsWith('--output='))?.slice('--output='.length);
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const check=(name,fn)=>{try{const note=fn();results.push({name,status:'PASS',note:note||''});console.log('PASS',name);}catch(e){results.push({name,status:'FAIL',note:e.message});console.log('FAIL',name,e.message);}};
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
check('R14 baseline structural audit',()=>{
 const run=cp.spawnSync(process.execPath,['Tools/r14-static-audit.cjs'],{cwd:root,encoding:'utf8'});
 need(run.status===0,`R14 baseline audit failed: ${run.stderr||run.stdout}`);
 return 'Seven previously defined baseline checks passed';
});
check('Randomness uses the serialized state, never a resolver-private seed',()=>{
 const spatial=read('Assets/CoreClash/Core/SpatialEffects.cs');
 const state=read('Assets/CoreClash/Core/GameState.cs');
 need(/public\s+uint\s+randomState\s*=\s*149/.test(state),'Missing persisted nonzero RNG seed');
 need(/S\.randomState\s*=\s*value/.test(spatial),'Random stream not committed to GameState');
 need(!/\buint\s+rng\s*=/.test(spatial),'Transient private RNG seed still exists');
 need(/int\s+RandomIndex\s*\(int\s+count\)/.test(spatial),'RandomIndex missing');
 return 'Wildcard, Collector, Necromancer use shared RandomIndex';
});
check('Network adapter rejects malformed snapshots before revision and state advance',()=>{
 const network=read('Assets/CoreClash/Networking/NetworkGameSession.cs');
 need(/if\(!IsValidState\(next\)\)return false;/.test(network),'No admission guard');
 need(network.indexOf('if(!IsValidState(next))return false;')<network.indexOf('State=next;revision=packet.revision'), 'Revision may advance on invalid payload');
 for(const token of ['s.randomState==0','b==null','g==null','z==null','p==null','GameSimulation.Finite(b.vx)'])
   need(network.includes(token),'Missing defensive check: '+token);
 return 'Rejects missing entities, nonfinite movement/geometry and zero RNG';
});
check('R15 runtime tests registered, including replay and malformed snapshots',()=>{
 const program=read('Tests/Program.cs'),test=read('Tests/StabilityR15Tests.cs');
 need(program.includes('StabilityR15Tests();'),'R15 suite not registered');
 need((test.match(/Test\("R15 /g)||[]).length===4,'Unexpected number of R15 regression cases');
 need(test.includes('original.State.randomState,restored.State.randomState'),'State-continuation check missing');
 return 'Four managed tests await actual execution';
});
const report={kind:'R15_STATIC_AUDIT',timestamp:new Date().toISOString(),status:results.every(x=>x.status==='PASS')?'PASS':'FAIL',warning:'STATIC ONLY; .NET 9 compilation and Unity runtime still required',results};
if(output){fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(path.resolve(output),JSON.stringify(report,null,2)+'\n');}
console.log(`R15 structural audit: ${results.filter(x=>x.status==='PASS').length}/${results.length}`);
process.exitCode=report.status==='PASS'?0:1;
