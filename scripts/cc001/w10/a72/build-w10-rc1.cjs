'use strict';
// CC-001 / R17-W11 / A72 - frozen QA Windows build, no merge/deploy.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {inspect,inspectDirectory}=require('./w11-source-readiness.cjs');
const ROOT='unity/cc001-r16/CoreClash-V149-Unity';
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const W11='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const W11_REF='integration/cc001-r17-w11-qa-freeze-20261030';
const UNITY_VERSION='6000.4.0f1';
const DIAG='CC001_PHOENIX_DIAGNOSTIC';
const PROTECTED=[`${ROOT}/.gitattributes`,`${ROOT}/Packages/manifest.json`,`${ROOT}/ProjectSettings/ProjectSettings.asset`,`${ROOT}/Assets/CoreClash/Networking/NgoWireProtocol.cs`,`${ROOT}/Assets/CoreClash/Editor/BuildTools.cs`];
const safeRef=s=>s===W11_REF;
const goodSha=s=>/^[a-f0-9]{40}$/.test(s);
const safeSha=s=>goodSha(s)&&s===W11;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
const ensure=(v,m)=>{if(!v)throw new Error(m)};
const shaFile=p=>hash(fs.readFileSync(p));
const utf8=(s)=>Buffer.from(s,'utf8');
const lf=b=>Buffer.from(b.toString('binary').replace(/\r\n/g,'\n'),'binary');
const same=(a,b)=>a.equals(b);
function allowedEOL(head,work,attr){
  if(same(head,work))return 'IDENTICAL_BYTES';
  if(attr==='lf'&&!head.includes(0)&&!work.includes(0)&&head.includes(13)&&same(lf(head),work))return 'CRLF_TO_LF_ONLY';
  return 'DIFFERENT_BYTES';
}
const split0=b=>b.toString('utf8').split('\0').filter(Boolean);
const fileLegal=p=>p.startsWith(`${ROOT}/`)||p.startsWith('docs/cc001/')||p.startsWith('scripts/cc001/')||p.startsWith('tools/cc001-');
const pathSafe=p=>!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').includes('..')&&!p.includes('\0');
function run(cmd,args,opts={}){
 const r=cp.spawnSync(cmd,args,{cwd:opts.cwd,encoding:null,maxBuffer:128*1024*1024,windowsHide:true,...opts});
 if(r.error)throw r.error;
 if(r.status!==0)throw Error(`${cmd} exited ${r.status}: ${(r.stderr||Buffer.alloc(0)).toString('utf8').slice(-900)}`);
 return r.stdout||Buffer.alloc(0);
}
function git(repo,args,opts={}){return run('git',['-C',repo,...args],opts)}
const gitText=(repo,args)=>git(repo,args).toString('utf8').trim();
function parseStatus(raw,phase){
 const parts=split0(raw),bad=[],modified=[];
 for(let i=0;i<parts.length;i++){
  const entry=parts[i],code=entry.slice(0,2),p=entry.slice(3);
  if(code===' M'&&pathSafe(p)){modified.push(p);continue}
  if(code==='??'&&phase==='AFTER'&&[
   `${ROOT}/Evidence/R16/Unity/unity-smoke.json`,
   `${ROOT}/Evidence/R16/Unity/build-StandaloneWindows64.json`
  ].includes(p))continue;
  bad.push({code,path:p});
  if(code[0]==='R'||code[0]==='C'||code[1]==='R'||code[1]==='C')i++;
 }
 return {bad,modified};
}
function sourceSnapshot(repo,phase){
 const files=split0(git(repo,['ls-files','-z','--',ROOT]));
 ensure(files.length>100&&files.length<2000,`Unexpected tracked Unity source count ${files.length}`);
 const status=parseStatus(git(repo,['status','--porcelain=v1','-z','--untracked-files=all']),phase);
 ensure(!status.bad.length,'Unexpected staged/untracked/non-EOL changes: '+JSON.stringify(status.bad.slice(0,6)));
 ensure(status.modified.every(p=>p.startsWith(ROOT+'/')),'Modified tracked file outside Unity project');
 const mismatch=[];const ledger=[];
 for(const rel of files){
  ensure(pathSafe(rel)&&rel.startsWith(ROOT+'/'),'Unsafe source path');
  const abs=path.resolve(repo,...rel.split('/'));
  ensure(abs.startsWith(path.resolve(repo)+path.sep),'Source escaped checkout');
  const st=fs.lstatSync(abs);ensure(st.isFile()&&!st.isSymbolicLink(),'Missing/symlink source: '+rel);
  const blob=gitText(repo,['rev-parse',`HEAD:${rel}`]);
  const head=git(repo,['cat-file','blob',blob]);const work=fs.readFileSync(abs);
  let classification='IDENTICAL_BYTES';
  if(!same(head,work)){
   const attr=gitText(repo,['check-attr','eol','--',rel]).split(': ').pop();
   classification=allowedEOL(head,work,attr);
   if(classification==='DIFFERENT_BYTES')mismatch.push({path:rel,headSHA256:hash(head),workSHA256:hash(work),eolAttr:attr});
  }
  ledger.push({path:rel,blob,gitBytes:head.length,gitSHA256:hash(head),workBytes:work.length,workSHA256:hash(work),classification});
 }
 return {phase,head:gitText(repo,['rev-parse','HEAD']),total:ledger.length,dirtyTracked:status.modified.length,ledger,failures:mismatch};
}
function compareSource(before,after){
 const old=new Map(before.ledger.map(x=>[x.path,x]));const changes=[];
 for(const entry of after.ledger){const b=old.get(entry.path);
  if(!b||b.blob!==entry.blob||entry.classification==='DIFFERENT_BYTES')changes.push({path:entry.path,reason:'GIT_BLOB_OR_UNSAFE_WORKTREE'});
  else if(b.workSHA256!==entry.workSHA256)changes.push({path:entry.path,reason:'WORK_BYTES_CHANGED_BETWEEN_PRE_AND_POST',before:b.workSHA256,after:entry.workSHA256,postClass:entry.classification});
 }
 return changes;
}
function scopeCheck(repo,sha){
 const diff=split0(git(repo,['diff','--name-only','-z',`${RC1}..${sha}`]));
 ensure(diff.length>=1&&diff.length<=150,'Unexpected changed path count '+diff.length);
 for(const p of diff){ensure(pathSafe(p)&&fileLegal(p),'Unexpected integration candidate path: '+p);ensure(!PROTECTED.includes(p),'Protected file modified: '+p);ensure(!p.endsWith('.gitattributes'),'EOL policy mutation prohibited');}
 ensure(diff.some(p=>p.startsWith(`${ROOT}/`)&&p.endsWith('.cs')),'No integration C# production changes: refusing redundant build');
 return diff;
}
function argsParse(argv){const out={};for(const a of argv){const x=/^--([a-z-]+)=(.*)$/.exec(a);ensure(x,'Use --key=value arguments');ensure(!(x[1] in out),'Duplicate '+x[1]);out[x[1]]=x[2];}return out;}
function json(p,value){fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n')}
function allFiles(dir){let a=[];for(const item of fs.readdirSync(dir,{withFileTypes:true}).sort((x,y)=>x.name.localeCompare(y.name))){const f=path.join(dir,item.name);const s=fs.lstatSync(f);ensure(!s.isSymbolicLink(),'Symlink inside evidence: '+f);if(s.isDirectory())a=a.concat(allFiles(f));else{ensure(s.isFile(),'Nonfile in artifact');a.push(f)}}return a}
function inventory(dir){return allFiles(dir).map(f=>({path:path.relative(dir,f).replace(/\\/g,'/'),bytes:fs.statSync(f).size,sha256:shaFile(f)}));}
function noDiagPre(project){
 const ps=fs.readFileSync(path.join(project,'ProjectSettings','ProjectSettings.asset'),'utf8');
 ensure(/^\s*scriptingDefineSymbols: \{\}\s*$/m.test(ps),'ProjectSettings has active scripting defines');
 ensure(!ps.includes(DIAG),'Diagnostic project setting');
 const app=fs.readFileSync(path.join(project,'Assets/CoreClash/Presentation/CoreClashApp.cs'),'utf8');
 ensure(!app.includes(DIAG),'Diagnostic CoreClashApp source');
 const rsp=allFiles(project).filter(p=>p.toLowerCase().endsWith('.rsp'));
 ensure(!rsp.length,'Pre-existing project response-file override: '+rsp.join(','));
 for(const key of ['UNITY_CSHARP_DEFINES','UNITY_EXTRA_DEFINES','CscToolPath','CscToolExe'])ensure(!process.env[key],'Compiler environment override '+key);
 return {scriptingDefineSymbols:'{}',diagnostic:false,preexistingResponseFiles:0};
}
function findRsp(project,out){const lib=path.join(project,'Library','Bee','artifacts');const result=[];
 if(!fs.existsSync(lib))return result;
 for(const f of allFiles(lib)){
  if(!/Assembly-CSharp\.rsp2?$/.test(path.basename(f)))continue;
  const body=fs.readFileSync(f);const str=body.toString('utf8');
  const rel=path.relative(project,f).replace(/\\/g,'/');
  const player=rel.includes('1900b0aP.dag')||str.includes('UNITY_STANDALONE_WIN');
  const defines=[...str.matchAll(/(?:^|\s)-define:([^\s]+)/gm)].map(x=>x[1]);
  const x={path:rel,bytes:body.length,sha256:hash(body),player,defineCount:defines.length,hasEditor:defines.some(y=>y.includes('UNITY_EDITOR')),hasWindows:defines.some(y=>y.includes('UNITY_STANDALONE_WIN')),hasDiagnostic:str.includes(DIAG),hasNested:/^\s*['"]?@[^\s]+/m.test(str)};
  const dst=path.join(out,'compiler-rsp',...rel.split('/'));fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(f,dst);
  result.push(x);
 }
 return result;
}
function boolGates(o){return Object.entries(o).filter(([,v])=>!v).map(([k])=>k)}
async function spawnLog(cmd,args,cwd,logPath){
 fs.mkdirSync(path.dirname(logPath),{recursive:true});const fd=fs.openSync(logPath,'w');
 try{return await new Promise((resolve,reject)=>{const p=cp.spawn(cmd,args,{cwd,stdio:['ignore',fd,fd],windowsHide:true});p.once('error',reject);p.once('exit',(code,signal)=>resolve({exitCode:code,signal}));});}
 finally{fs.closeSync(fd)}
}
async function build(a){
 ensure(process.platform==='win32','Windows 11 operator only. No Unity build on this host.');
 ensure(safeRef(a.ref||''),'Exact A70-approved W11 QA-freeze ref required');
 ensure(safeSha(a.sha||''),'Exact A70 W11 QA-freeze SHA required; do not use moved or alternate ref');
 ensure(a.unity&&path.isAbsolute(a.unity)&&fs.existsSync(a.unity),'Installed Unity.exe absolute path required');
 ensure(/[/\\]6000\.4\.0f1[/\\]Editor[/\\]Unity\.exe$/i.test(a.unity),'Editor must be Unity 6000.4.0f1');
 ensure(a.out&&path.isAbsolute(a.out)&&!fs.existsSync(a.out),'Fresh unused absolute output directory required');
 const root=path.resolve(a.out),repo=path.join(root,'checkout'),evidence=path.join(root,'evidence');
 fs.mkdirSync(path.join(evidence,'logs'),{recursive:true});
 const log=(label,msg)=>{fs.appendFileSync(path.join(evidence,'logs','gate-events.txt'),`${new Date().toISOString()} ${label} ${msg}\n`)};
 let fatal=null,unity=null,managed=null,managedSdk=null,managedReport=null,pre=null,post=null,scope=null,responses=[],binary=[],sourceChanges=[],buildReport=null;
 try{
  log('START',`ref=${a.ref} sha=${a.sha}`);
  const cloned=await spawnLog('git',['clone','--single-branch','--branch',a.ref,'--no-checkout','https://github.com/C8LyNn/aplikacja-turnieje.git',repo],root,path.join(evidence,'logs','git-clone.log'));
  ensure(cloned.exitCode===0,'Private Git clone failed; authenticate via Git Credential Manager');
  ensure(gitText(repo,['rev-parse',`refs/remotes/origin/${a.ref}`])===a.sha,'A70 ref moved: refusing stale SHA');
  ensure(gitText(repo,['cat-file','-t',RC1])==='commit','Frozen RC1 commit not reachable');
  ensure(run('git',['-C',repo,'merge-base','--is-ancestor',RC1,a.sha]).length===0,'Unexpected merge-base output');
  scope=scopeCheck(repo,a.sha);
  git(repo,['checkout','--detach',a.sha]);
  ensure(gitText(repo,['rev-parse','HEAD'])===a.sha,'Checkout identity mismatch');
  const project=path.join(repo,...ROOT.split('/'));
  ensure(fs.readFileSync(path.join(project,'ProjectSettings','ProjectVersion.txt'),'utf8').includes(UNITY_VERSION),'Wrong project Unity version');
  ensure(gitText(repo,['rev-parse',`HEAD:${ROOT}/Assets/CoreClash/Editor/BuildTools.cs`])==='d4866b0ee5e5ef9c92c94a900a5fc8f9121beab9','Build entrypoint changed');
  ensure(gitText(repo,['rev-parse',`HEAD:${ROOT}/Assets/CoreClash/Networking/NgoWireProtocol.cs`])==='4a611ee8bdcd929b577f515768fa10dcef8410fc','Protocol149 changed');
  ensure(gitText(repo,['rev-parse',`HEAD:${ROOT}/ProjectSettings/ProjectSettings.asset`])==='8a0952f873139d850d1a4cc3d51774038b498ac5','Project settings changed');
  const config=noDiagPre(project);json(path.join(evidence,'preflight.json'),{ref:a.ref,sha:a.sha,rc1:RC1,unityVersion:UNITY_VERSION,unityExecutableSHA256:shaFile(a.unity),sourceTree:gitText(repo,['rev-parse',`HEAD:${ROOT}`]),commitTree:gitText(repo,['rev-parse','HEAD^{tree}']),changedPaths:scope,config});
  const sourceGate=inspectDirectory(project,a.sha);json(path.join(evidence,'w11-source-readiness.json'),sourceGate);
  ensure(sourceGate.status==='GO_SOURCE_SHAPE_ONLY','W11 P0/P1 source readiness HOLD: '+sourceGate.gates.filter(g=>g.status==='HOLD').map(g=>g.id).join(','));
  pre=sourceSnapshot(repo,'BEFORE');json(path.join(evidence,'source-before.json'),pre);ensure(!pre.failures.length,'Initial Git source raw bytes differ beyond historical CRLF→LF');
  // Independent worktree keeps managed test-generated files away from the frozen Unity build checkout.
  managedSdk=run('dotnet',['--version']).toString('utf8').trim();
  ensure(/^9\./.test(managedSdk),'Required .NET SDK major 9, found '+managedSdk);
  const managedCheckout=path.join(root,'managed-checkout');
  git(repo,['worktree','add','--detach',managedCheckout,a.sha]);
  const managedProject=path.join(managedCheckout,...ROOT.split('/'));
  managed=await spawnLog('dotnet',['run','--project',path.join(managedProject,'Tests','CoreClash.Tests.csproj'),'--configuration','Release','--',managedProject],managedProject,path.join(evidence,'logs','managed-dotnet9.log'));
  const managedResultFile=path.join(managedProject,'Evidence','unity-tests.json');
  if(fs.existsSync(managedResultFile)){
   fs.copyFileSync(managedResultFile,path.join(evidence,'managed-test-results.json'));
   managedReport=JSON.parse(fs.readFileSync(managedResultFile,'utf8'));
  }
  json(path.join(evidence,'managed-summary.json'),{sdk:managedSdk,exitCode:managed.exitCode,signal:managed.signal,passed:managedReport?.passed??null,failed:managedReport?.failed??null});
  ensure(managed.exitCode===0&&managedReport&&managedReport.failed===0&&managedReport.passed>0,
   'Managed .NET9 compile/tests failed or result missing. See original managed-dotnet9.log');

  // Exactly ONE original Windows build from selected A70 SHA; Unity may normalize scene EOL.
  unity=await spawnLog(a.unity,['-batchmode','-nographics','-quit','-buildTarget','StandaloneWindows64','-projectPath',project,'-executeMethod','CoreClash.Editor.BuildTools.BuildWindows','-logFile',path.join(evidence,'logs','unity-editor.log')],project,path.join(evidence,'logs','unity-console.log'));
  log('UNITY',`exit=${unity.exitCode} signal=${unity.signal}`);
  const player=path.join(project,'Builds','Windows');const buildJson=path.join(project,'Evidence','R16','Unity','build-StandaloneWindows64.json');
  if(fs.existsSync(buildJson)){
   fs.copyFileSync(buildJson,path.join(evidence,'unity-build-result.json'));
   try{buildReport=JSON.parse(fs.readFileSync(buildJson,'utf8'))}catch(e){log('JSON_FAIL',e.message)}
  }
  const dest=path.join(evidence,'WindowsPlayer');
  if(fs.existsSync(player)){fs.cpSync(player,dest,{recursive:true,errorOnExist:true,force:false});binary=inventory(dest);json(path.join(evidence,'player-inventory.json'),binary);}
  responses=findRsp(project,evidence);json(path.join(evidence,'compiler-response-inventory.json'),responses);
  try{post=sourceSnapshot(repo,'AFTER');json(path.join(evidence,'source-after.json'),post);sourceChanges=compareSource(pre,post);}catch(e){log('SOURCE_AUDIT_FAIL',e.message);sourceChanges=[{reason:'SOURCE_AUDIT_ERROR',message:e.message}]}
  const playerRsp=responses.filter(x=>x.player&&!x.path.endsWith('.rsp2'));
  const editorLog=path.join(evidence,'logs','unity-editor.log');const logBody=fs.existsSync(editorLog)?fs.readFileSync(editorLog,'utf8'):'';
  const dll=path.join(dest,'CoreClash_Data','Managed','Assembly-CSharp.dll');
  const dllContent=fs.existsSync(dll)?fs.readFileSync(dll):Buffer.alloc(0);
  const diagDll= dllContent.includes(Buffer.from(DIAG,'utf8'))||dllContent.includes(Buffer.from(DIAG,'utf16le'));
  const gates={managedDotnet9:managedSdk?.startsWith('9.')&&managed?.exitCode===0&&managedReport?.failed===0&&managedReport?.passed>0,sourcePreExact:!pre.failures.length,sourceAfterMaterialized:!!post&&!post.failures.length,
   sourceNotMutated:sourceChanges.length===0,unityExitZero:unity.exitCode===0,
   buildSucceeded:buildReport?.result==='Succeeded'&&buildReport?.errors===0,
   playerComplete:binary.length>50&&binary.some(f=>f.path==='CoreClash.exe')&&binary.some(f=>f.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'),
   compilerResponseCaptured:playerRsp.length>=1,playerDefineCorrect:playerRsp.some(x=>x.hasWindows&&!x.hasEditor&&!x.hasDiagnostic&&!x.hasNested),
   noDiagnostic:!responses.some(x=>x.hasDiagnostic)&&!diagDll&&!logBody.includes(DIAG),
   buildMarker:logBody.includes('CORE_CLASH_BUILD_PASS StandaloneWindows64')};
  const summary={schema:'CC001-W10-A72-WINDOWS-1',ref:a.ref,candidateSHA:a.sha,rc1Base:RC1,unity,managedSdk,managed,managedTests:{passed:managedReport?.passed??null,failed:managedReport?.failed??null},buildReport,
   sourceFileCount:pre.total,sourceAfterCount:post?.total??null,sourceChanges,playerCount:binary.length,playerInventory:binary,
   compilerResponseCount:responses.length,playerRspCount:playerRsp.length,
   gates,status:boolGates(gates).length?'HOLD':'PASS_BUILD_EVIDENCE_ONLY',
   blockers:boolGates(gates),meaning:'One isolated A70 candidate native Windows build. NOT independent A60 QA, not PC1-PC2 PASS, not release.'};
  json(path.join(evidence,'summary.json'),summary);
  json(path.join(evidence,'evidence-inventory.json'),inventory(evidence).filter(x=>x.path!=='evidence-inventory.json'));
  console.log(JSON.stringify({status:summary.status,blockers:summary.blockers,output:evidence,sha:a.sha},null,2));
  process.exitCode=summary.status==='PASS_BUILD_EVIDENCE_ONLY'?0:2;
 }catch(e){fatal=e;console.error('A72 HOLD: '+e.message);log('FATAL',e.message);json(path.join(evidence,'failure.json'),{status:'HOLD',cause:e.message,sha:a.sha,ref:a.ref,unity});process.exitCode=2;}
 finally{json(path.join(evidence,'receipt.json'),{schema:'CC001-W10-A72-RECEIPT-1',candidateSHA:a.sha,rc1:RC1,status:fatal?'HOLD':(process.exitCode===0?'PASS_BUILD_EVIDENCE_ONLY':'HOLD'),utc:new Date().toISOString()});}
}
function selfTest(){const assert=require('node:assert/strict');let passed=0;const test=(f)=>{f();passed++};
 test(()=>assert.equal(allowedEOL(utf8('A\r\nB\r\n'),utf8('A\nB\n'),'lf'),'CRLF_TO_LF_ONLY'));
 test(()=>assert.equal(allowedEOL(utf8('A\r\nB'),utf8('A\r\nB'),'lf'),'IDENTICAL_BYTES'));
 test(()=>assert.equal(allowedEOL(utf8('A\r\nB'),utf8('A\nB'),'unspecified'),'DIFFERENT_BYTES'));
 test(()=>assert.equal(allowedEOL(utf8('A\r\nB'),utf8('A\nB\n'),'lf'),'DIFFERENT_BYTES'));
 test(()=>assert.equal(allowedEOL(Buffer.from([0,13,10]),Buffer.from([0,10]),'lf'),'DIFFERENT_BYTES'));
 test(()=>assert.equal(safeRef(W11_REF),true));
 test(()=>assert.equal(safeSha(W11),true));
 test(()=>assert.equal(safeSha('173273122c11cbf738e8b954e32506a6196fe8ec'),false));
 test(()=>assert.equal(safeSha('wrong-sha'),false));
 test(()=>assert.equal(safeRef('integration/cc001-r17-w11-multiplayer-qa-candidate-20261030'),false));
 test(()=>assert.equal(safeRef('feat/cc001-r17-w9-a30-multiplayer-repair'),false));
 test(()=>assert.equal(safeRef('integration/cc001-r17-w8-phoenix-rc1'),false));
 test(()=>assert.equal(safeRef('integration/cc001-r17-w10-multiplayer-dev-candidate-20261030'),false));
 test(()=>assert.equal(goodSha(RC1),true));
 test(()=>assert.equal(goodSha('A'.repeat(40)),false));
 test(()=>assert.equal(fileLegal(`${ROOT}/Assets/CoreClash/Presentation/MatchView.cs`),true));
 test(()=>assert.equal(fileLegal('artifacts/tournament-manager/file.js'),false));
 test(()=>assert.equal(parseStatus(Buffer.from(' M project/A.cs\0'), 'BEFORE').modified[0],'project/A.cs'));
 test(()=>assert.equal(parseStatus(Buffer.from('?? rogue.exe\0'),'AFTER').bad.length,1));
 test(()=>assert.equal(parseStatus(Buffer.from(`?? ${ROOT}/Evidence/R16/Unity/unity-smoke.json\0`),'AFTER').bad.length,0));
 test(()=>assert.equal(PROTECTED.includes(`${ROOT}/Assets/CoreClash/Networking/NgoWireProtocol.cs`),true));
 test(()=>assert.equal(compareSource({ledger:[{path:'f',blob:'abc',workSHA256:'A'}]},{ledger:[{path:'f',blob:'abc',workSHA256:'A',classification:'IDENTICAL_BYTES'}]}).length,0));
 test(()=>assert.equal(compareSource({ledger:[{path:'f',blob:'abc',workSHA256:'A'}]},{ledger:[{path:'f',blob:'abc',workSHA256:'B',classification:'CRLF_TO_LF_ONLY'}]}).length,1));
 test(()=>assert.deepEqual(boolGates({a:true,b:false}),['b']));
 const gatePass={ngo:'adapter.Apply(packet,decode,out reason); LastAppliedRevision=revision; app.ReceiveNetworkState(adapter.State,revision);',app:'RemoteBallSmoother x; void ReceiveNetworkState(GameState state,int snapshotRevision=-1) { remoteBallSmoother.Observe(state,Time.unscaledTime,instantBallIds,snapshotRevision); Simulation.State=state; remoteBallSmoother.Reset(); }',board:'remoteVisual.TryGetPosition(ballId,now,out x,out y);',match:'Draw.Text("OK");',smoother:'if(snapshotRevision>=0&&lastSnapshotRevision>=0&&snapshotRevision<=lastSnapshotRevision)return; void Reset() { lastSnapshotRevision=-1; }'};
 test(()=>assert.equal(inspect(gatePass,'a'.repeat(40)).status,'GO_SOURCE_SHAPE_ONLY'));
 test(()=>assert.equal(inspect({...gatePass,match:'Draw.Round(new Rect(0,y,w*lastPower,5),color);'},'a'.repeat(40)).status,'HOLD_SOURCE_BLOCKER'));
 console.log(JSON.stringify({suite:'CC001-W11-A72-offline',pass:passed,fail:0}));
}
if(require.main===module){const argv=process.argv.slice(2);if(argv.length===1&&argv[0]==='--self-test'){selfTest();}else{try{build(argsParse(argv)).catch(e=>{console.error(e);process.exitCode=2})}catch(e){console.error('A72 STOP: '+e.message);process.exitCode=1}}}
module.exports={allowedEOL,parseStatus,compareSource,scopeCheck,safeRef,safeSha,goodSha,ROOT,RC1};
