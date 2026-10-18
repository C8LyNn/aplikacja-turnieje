#!/usr/bin/env node
'use strict';
// CC-001 R15: isolated, evidence-preserving integration gate.
// Example: node Tools/r15-qa.cjs [--static-only] [--output=G:\Mój dysk\ChatGPT\CoreClash\QA\R15]
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),parent=path.dirname(root),argv=process.argv.slice(2);
const staticOnly=argv.includes('--static-only'),buildWindows=argv.includes('--build-windows');
const specified=argv.find(x=>x.startsWith('--output='))?.slice('--output='.length);
const drive='G:\\Mój dysk\\ChatGPT';
const base=path.resolve(specified || (process.platform==='win32'&&fs.existsSync(drive)?path.join(drive,'CoreClash','QA','R15'):path.join(parent,'CoreClash-R15-QA-Reports')));
if(base===root||base.startsWith(root+path.sep))throw Error('Output must be outside the project');
fs.mkdirSync(base,{recursive:true});
const run=path.join(base,'r15_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+crypto.randomBytes(3).toString('hex'));
fs.mkdirSync(run,{recursive:true});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rels=['Evidence/unity-tests.json','Evidence/ability-support.json','Evidence/network-codec-tests.json','../Reference/V148_reference_original.html'];
for(const rel of rels)if(!fs.existsSync(path.join(root,rel)))throw Error('Missing immutable baseline evidence '+rel);
const before=Object.fromEntries(rels.map(rel=>[rel,hash(path.join(root,rel))]));
function spawn(name,args){
 const call=cp.spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
 const status=call.error?'FAIL':call.status===0?'PASS':'FAIL';
 fs.writeFileSync(path.join(run,name+'.log'),[`${process.execPath} ${args.join(' ')}`,call.stdout||'',call.stderr||'',call.error?.message||''].join('\n'));
 return {status,exitCode:call.status,error:call.error?.message||null};
}
const staticAudit=spawn('r15-static',['Tools/r15-static-audit.cjs','--output='+path.join(run,'r15-static.json')]);
const legacyFolder=path.join(run,'isolated-QA');
const old=spawn('r14-isolated',['Tools/r14-qa.cjs','--output='+legacyFolder,...(staticOnly?['--static-only']:[]),...(buildWindows?['--build-windows']:[])]);
const runs=fs.existsSync(legacyFolder)?fs.readdirSync(legacyFolder).filter(n=>n.startsWith('r14_')).sort():[];
let prior=null;
if(runs.length){
 const filename=path.join(legacyFolder,runs[runs.length-1],'r14-results.json');
 if(fs.existsSync(filename))prior=JSON.parse(fs.readFileSync(filename,'utf8'));
}
const after=Object.fromEntries(rels.map(rel=>[rel,fs.existsSync(path.join(root,rel))?hash(path.join(root,rel)):'MISSING']));
const immutable=rels.every(rel=>before[rel]===after[rel]);
const managed=prior?.stages?.find(s=>s.name==='csharp_all_tests');
const managedStatus=staticOnly?'NOT_REQUESTED':managed?.status||'NOT_STARTED';
const verdict=!immutable?'FAIL_IMMUTABILITY':staticAudit.status!=='PASS'?'FAIL_STATIC':!prior?'FAIL_ISOLATED_QA':old.status==='PASS'?(staticOnly?'STATIC_PASS_ONLY':buildWindows?'WINDOWS_QA_STAGES_PASS_NEEDS_REVIEW':'MANAGED_PASS_NEEDS_UNITY'):
 managedStatus==='BLOCKED'?'BLOCKED_DOTNET':managedStatus==='FAIL'?'FAIL_MANAGED_OR_DEPENDENCY':'FAIL_OR_BLOCKED_OTHER';
const report={candidate:'CC-001 R15 source over R14',timestamp:new Date().toISOString(),staticOnly,buildWindows,verdict,
  staticAudit,isolatedQA:old,isolatedResult:prior?.verdict||'MISSING',isolatedStages:prior?.stages||[],managedStatus,
  protectedSourceUnchanged:immutable,protectedSourceBefore:before,protectedSourceAfter:after,
  sourceCompilerAvailable:!!(cp.spawnSync('dotnet',['--version'],{encoding:'utf8'}).status===0),
  noUnityReleaseClaim:true,publicDeployment:false,cloudSyncConfirmed:false};
fs.writeFileSync(path.join(run,'r15-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({verdict,managedStatus,staticAudit:staticAudit.status,protectedSourceUnchanged:immutable,report:path.join(run,'r15-results.json')},null,2));
process.exitCode=(staticOnly&&verdict==='STATIC_PASS_ONLY')||(!staticOnly&&verdict==='MANAGED_PASS_NEEDS_UNITY')?0:1;
