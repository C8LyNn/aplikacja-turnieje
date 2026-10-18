#!/usr/bin/env node
// Isolated, cross-platform R14 preflight. Distinguishes static PASS from native QA.
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const project=path.resolve(__dirname,'..'),parent=path.dirname(project),argv=process.argv.slice(2);
const staticOnly=argv.includes('--static-only'),buildWindows=argv.includes('--build-windows');
const outputArg=argv.find(x=>x.startsWith('--output='))?.slice('--output='.length);
const driveDefault='G:\\Mój dysk\\ChatGPT';
const base=path.resolve(outputArg || (process.platform==='win32'&&fs.existsSync(driveDefault)?path.join(driveDefault,'CoreClash','QA','R14'):path.join(parent,'CoreClash-R14-QA-Reports')));
if(base===project||base.startsWith(project+path.sep))throw Error('QA output must be outside canonical source project');
fs.mkdirSync(base,{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const run=path.join(base,`r14_${stamp}_${crypto.randomBytes(3).toString('hex')}`);
const isolatedParent=path.join(run,'isolated'),isolated=path.join(isolatedParent,'CoreClash-V149-Unity');
fs.mkdirSync(isolated,{recursive:true});
const dig=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const protectedPaths=['Evidence/unity-tests.json','Evidence/ability-support.json','Evidence/network-codec-tests.json'];
const original=path.join(parent,'Reference','V148_reference_original.html');
if(!fs.existsSync(original))throw Error('Missing original V148 reference');
const before={};for(const rel of protectedPaths){const p=path.join(project,rel);if(fs.existsSync(p))before[rel]=dig(p);}
before['../Reference/V148_reference_original.html']=dig(original);
for(const rel of ['Assets','Packages','ProjectSettings','Tests','Tools','Evidence']){
 const src=path.join(project,rel);if(!fs.existsSync(src))throw Error('Missing source directory '+rel);
 fs.cpSync(src,path.join(isolated,rel),{recursive:true,force:true,filter:p=>!['Library','Temp','obj','bin','.git'].includes(path.basename(p))});
}
const nuget=path.join(project,'NuGet.Config');if(fs.existsSync(nuget))fs.copyFileSync(nuget,path.join(isolated,'NuGet.Config'));
fs.cpSync(path.join(parent,'Reference'),path.join(isolatedParent,'Reference'),{recursive:true,force:true});
const stages=[];
function stage(name,exe,args){
 const r=cp.spawnSync(exe,args,{cwd:isolated,encoding:'utf8',maxBuffer:32*1024*1024});
 const status=r.error?.code==='ENOENT'?'BLOCKED':r.error?'FAIL':r.status===0?'PASS':'FAIL';
 const logfile=path.join(run,`${name}.log`);
 fs.writeFileSync(logfile,[`$ ${exe} ${args.join(' ')}`,r.stdout||'',r.stderr||'',r.error?.message||''].join('\n'));
 stages.push({name,status,exitCode:r.status,error:r.error?.message||null,log:logfile});
 console.log(status,name, r.error?.message||'');
}
stage('static_source_audit','node',['Tools/r14-static-audit.cjs','--output='+path.join(run,'static-audit.json')]);
stage('catalog_and_reference','node',['Tools/verify-data.cjs']);
if(!staticOnly){
 stage('csharp_all_tests','dotnet',['run','--project','Tests/CoreClash.Tests.csproj','--','.']);
 if(stages[stages.length-1].status==='BLOCKED'){
  const logfile=path.join(run,'network_codec.log');
  fs.writeFileSync(logfile,'SKIPPED_DEPENDENCY: .NET SDK unavailable; network codec requires dotnet.\n');
  stages.push({name:'network_codec',status:'SKIPPED_DEPENDENCY',exitCode:null,error:'dotnet unavailable',log:logfile});
  console.log('SKIPPED_DEPENDENCY network_codec');
 }else stage('network_codec','node',['Tools/network-codec-test.cjs']);
 if(buildWindows)stage('unity_windows_build','pwsh',['-NoProfile','-File',path.join(isolated,'Tools','build.ps1'),'-Target','Windows']);
}
const after={};for(const key of Object.keys(before)){
 const file=key.startsWith('../')?original:path.join(project,key);
 after[key]=fs.existsSync(file)?dig(file):'MISSING';
}
const sourceUnchanged=Object.keys(before).every(k=>before[k]===after[k]);
const stagesPass=stages.every(x=>x.status==='PASS');
const verdict=!sourceUnchanged?'FAIL_SOURCE_MUTATION':!stagesPass?'FAIL_OR_BLOCKED':staticOnly?'STATIC_ONLY_PASS':'MANAGED_TESTS_PASS_NOT_UNITY_CERTIFIED';
const report={project:'CC-001',candidate:'R14 SOURCE on R13',time:new Date().toISOString(),staticOnly,buildWindowsRequested:buildWindows,
 verdict,stages,sourceUnchanged,sourceHashBefore:before,sourceHashAfter:after,isolatedProject:isolated,
 originalHTMLUnmodified:before['../Reference/V148_reference_original.html']===after['../Reference/V148_reference_original.html'],
 cloudSyncVerified:false,publicDeployment:false};
fs.writeFileSync(path.join(run,'r14-results.json'),JSON.stringify(report,null,2)+'\n');
console.log('R14 VERDICT:',verdict,'REPORT:',path.join(run,'r14-results.json'));
process.exitCode=stagesPass&&sourceUnchanged?0:1;
