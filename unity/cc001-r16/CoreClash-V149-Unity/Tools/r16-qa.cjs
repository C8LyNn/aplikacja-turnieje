'use strict';
// Run managed QA in a fresh source copy; preserve all R9–R15 evidence bytes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const arg=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
const base=path.resolve(arg||path.join(root,'../../QA/R16'));
if(base===root||base.startsWith(root+path.sep))throw Error('Output must be outside project');
const run=path.join(base,new Date().toISOString().replace(/[:.]/g,'-'));
const project=path.join(run,'isolated/CoreClash-V149-Unity');fs.mkdirSync(project,{recursive:true});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const walk=(p)=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const protectedFiles=walk(path.join(root,'Evidence')).filter(p=>!p.startsWith(path.join(root,'Evidence/R16')+path.sep));
const before=Object.fromEntries(protectedFiles.map(p=>[path.relative(root,p),hash(p)]));
for(const dir of ['Assets','Packages','ProjectSettings','Tests','Tools','Evidence'])fs.cpSync(path.join(root,dir),path.join(project,dir),{recursive:true,filter:p=>!['Library','Temp','.git','bin','obj'].includes(path.basename(p))});
fs.copyFileSync(path.join(root,'NuGet.Config'),path.join(project,'NuGet.Config'));
fs.cpSync(path.join(root,'../Reference'),path.join(project,'../Reference'),{recursive:true});
const stages=[];
for(const [name,exe,args] of [
 ['data','node',['Tools/verify-data.cjs']],
 ['managed','dotnet',['run','--project','Tests/CoreClash.Tests.csproj','--','.']],
 ['codec','node',['Tools/network-codec-test.cjs']]
]){
 const result=cp.spawnSync(exe,args,{cwd:project,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});
 fs.writeFileSync(path.join(run,name+'.log'),(result.stdout||'')+(result.stderr||'')+(result.error?.message||''));
 stages.push({name,exitCode:result.status,status:result.error?.code==='ENOENT'?'BLOCKED':result.status===0?'PASS':'FAIL'});
}
const managedRoot=path.join(root,'Evidence/R16/Managed');
const fresh=path.join(managedRoot,path.basename(run));fs.mkdirSync(fresh,{recursive:true});
// Only reports demonstrably regenerated during this run are copied as current evidence.
for(const p of walk(path.join(project,'Evidence'))){const rel=path.relative(path.join(project,'Evidence'),p);if(!rel.startsWith('R16'+path.sep)&&(!before[path.join('Evidence',rel)]||hash(p)!==before[path.join('Evidence',rel)]))fs.copyFileSync(p,path.join(fresh,path.basename(p)));}
const preserved=protectedFiles.every(p=>before[path.relative(root,p)]===hash(p));
const report={time:new Date().toISOString(),candidate:'R16',stages,historicalEvidenceUnchanged:preserved,isolatedProject:project,unityTested:false};
fs.writeFileSync(path.join(run,'results.json'),JSON.stringify(report,null,2));
fs.copyFileSync(path.join(run,'results.json'),path.join(fresh,'qa-results.json'));
fs.writeFileSync(path.join(managedRoot,'latest.json'),JSON.stringify({run:path.basename(run),stages,historicalEvidenceUnchanged:preserved},null,2));
for(const name of ['data','managed','codec'])fs.copyFileSync(path.join(run,name+'.log'),path.join(fresh,name+'.log'));
console.log(JSON.stringify(report,null,2));process.exitCode=preserved&&stages.every(s=>s.status==='PASS')?0:1;
