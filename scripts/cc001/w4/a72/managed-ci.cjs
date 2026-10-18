'use strict';
// CC-001 R17-W4 A72. Manual opt-in .NET 9 gate; only disposable Git worktrees receive test writes.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const cp = require('node:child_process'), crypto = require('node:crypto');
const policy = require('./policy.cjs');
const args = Object.fromEntries(process.argv.slice(2).filter(a=>a.startsWith('--')).map(a=>{
  const pos=a.indexOf('=');return pos===-1?[a.slice(2),'true']:[a.slice(2,pos),a.slice(pos+1)];
}));
const digest = bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const report = {project:'CC-001',wave:'R17-W4',agent:'A72',mode:'manual-managed-only',
  runAt:new Date().toISOString(),target:args.target||null, frozenSha:policy.FROZEN,
  dispatchSha:policy.DISPATCH, observed:{}, stages:[], verdict:'NOT_RUN', merged:false,
  unityTested:false, devicesTested:false, released:false};
let out;
function exec(exe,argv,cwd,timeout=900000) {
  const start=new Date().toISOString();
  const r=cp.spawnSync(exe,argv,{cwd,encoding:'utf8',timeout,maxBuffer:32*1024*1024,
    env:{...process.env,DOTNET_CLI_TELEMETRY_OPTOUT:'1',DOTNET_NOLOGO:'1'}});
  return {command:[exe,...argv],start,end:new Date().toISOString(),exitCode:r.status,
    error:r.error?.message||null,stdout:r.stdout||'',stderr:r.stderr||''};
}
function stage(name,exe,argv,cwd,timeout=900000) {
  const r=exec(exe,argv,cwd,timeout);
  const log='## '+name+' / '+r.start+'\n$ '+r.command.map(JSON.stringify).join(' ')+'\nexitCode='+r.exitCode+
    '\nerror='+(r.error||'NONE')+'\nSTDOUT\n'+r.stdout+'\nSTDERR\n'+r.stderr;
  const file=path.join(out,name+'.log');fs.writeFileSync(file,log+'\n','utf8');
  const result={name,command:r.command,start:r.start,end:r.end,exitCode:r.exitCode,
    error:r.error,log:path.basename(file),logSha256:digest(fs.readFileSync(file)),
    status:r.error?'BLOCKED':r.exitCode===0?'PASS':'FAIL'};
  report.stages.push(result);
  return {raw:r,stage:result};
}
function ensure(condition,message){if(!condition)throw Error(message)}
function git(argv,cwd){const r=exec('git',argv,cwd,120000);ensure(!r.error&&r.exitCode===0,
  'git '+argv.join(' ')+' failed (exit '+r.exitCode+'): '+r.stderr.slice(0,1000));return r.stdout.trim();}
function immutableBlob(commit,name,cwd){
  return git(['rev-parse',commit+':'+name],cwd);
}
function checkFresh(filename,startedMs) {
  ensure(fs.existsSync(filename),'No fresh generated evidence at '+filename);
  ensure(fs.statSync(filename).mtimeMs>=startedMs-2000,
    'Generated evidence predates current stage: '+filename);
}
function recordArtifact(file,key){
  if(!fs.existsSync(file))return null;
  const copy=path.join(out,key);fs.copyFileSync(file,copy);
  return {file:path.basename(copy),sha256:digest(fs.readFileSync(copy)),bytes:fs.statSync(copy).size};
}
function finish(){
  const output=path.join(out,'results.json');
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n','utf8');
  console.log(JSON.stringify({status:report.verdict,sha:report.observed.selectedSha||null,
    target:report.target,results:report.stages.map(x=>({name:x.name,status:x.status,exitCode:x.exitCode})),
    evidence:output},null,2));
}
if(args['self-test']==='true'){
  const t=policy.selfTest();
  console.log(JSON.stringify({scope:'pure policy negative/positive controls',...t},null,2));
  process.exitCode=t.failed?1:0;
} else {
  let error=null;
  try {
    const repo=process.cwd();
    out=path.resolve(args.out||fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a72-results-')));
    const rel=path.relative(repo,out);
    ensure(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel),
      'Refuse evidence output inside checkout');
    fs.mkdirSync(out,{recursive:true});
    const selection=policy.select(args.target,args['candidate-sha']||'');
    report.observed.selectedSha=selection.sha;
    report.observed.expectedMinTests=selection.expectedMinTests;
    report.observed.expectedRed=selection.expectedRed;
    report.observed.scriptSha256=digest(fs.readFileSync(__filename));
    report.observed.policySha256=digest(fs.readFileSync(path.join(__dirname,'policy.cjs')));
    const controls=policy.selfTest();report.observed.policyControls=controls;
    ensure(controls.failed===0,'A72 policy self-test failure');
    report.observed.ciRepository=process.env.GITHUB_REPOSITORY||'LOCAL';
    if(process.env.GITHUB_REPOSITORY)
      ensure(process.env.GITHUB_REPOSITORY==='C8LyNn/aplikacja-turnieje','Wrong CI repository');
    const node=stage('node-version','node',['--version'],repo);
    ensure(node.stage.status==='PASS'&&/^v22\./.test(node.raw.stdout.trim()),'Node 22 required');
    const dotnet=stage('dotnet-version','dotnet',['--version'],repo);
    ensure(dotnet.stage.status==='PASS'&&/^9\./.test(dotnet.raw.stdout.trim()),'.NET SDK 9 required');
    const checkoutSha=git(['rev-parse','HEAD'],repo);
    report.observed.runnerCommit=checkoutSha;
    if(process.env.GITHUB_ACTIONS==='true')
      ensure(checkoutSha===process.env.GITHUB_SHA,'Checkout HEAD does not match workflow SHA');
    ensure(git(['cat-file','-t',policy.FROZEN],repo)==='commit','Frozen commit absent');
    ensure(git(['cat-file','-t',selection.sha],repo)==='commit','Pinned target commit not fetched');
    git(['merge-base','--is-ancestor',policy.FROZEN,selection.sha],repo);
    const deltaRaw=exec('git',['diff','--name-only','-z',policy.FROZEN,selection.sha],repo);
    ensure(deltaRaw.exitCode===0&&!deltaRaw.error,'Changed-path diff failed');
    const delta=deltaRaw.stdout.split('\0').filter(Boolean);
    report.observed.changedFiles=delta;
    report.observed.pathPolicy=policy.checkPaths(args.target,delta);
    const immutable=[
      'unity/cc001-r16/Reference/V148_reference_original.html',
      policy.PROJECT+'Assets/Resources/Data/catalog.json',
      policy.PROJECT+'Assets/Resources/Data/featured-decks.json',
      policy.PROJECT+'Packages/manifest.json',
      policy.PROJECT+'Packages/packages-lock.json',
      policy.PROJECT+'ProjectSettings/ProjectVersion.txt',
      policy.PROJECT+'Tests/Program.cs'
    ];
    for(const name of immutable)ensure(immutableBlob(policy.FROZEN,name,repo)===
      immutableBlob(selection.sha,name,repo),'Protected object changed: '+name);
    if(args.target==='baseline')ensure(git(['rev-parse',selection.sha+':unity/cc001-r16'],repo)===
      '1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6','Wrong canonical source tree');
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a72-disposable-'));
    const worktree=path.join(temp,'checkout');
    const create=stage('disposable-checkout','git',['worktree','add','--detach',worktree,selection.sha],repo,180000);
    ensure(create.stage.status==='PASS','Cannot create temporary detached checkout');
    ensure(git(['rev-parse','HEAD'],worktree)===selection.sha,'Disposable checkout SHA mismatch');
    const project=path.join(worktree,policy.PROJECT);
    ensure(fs.existsSync(path.join(project,'Tests/CoreClash.Tests.csproj')),'Missing managed project');
    report.observed.isolatedProject=project;
    const data=stage('data','node',['Tools/verify-data.cjs'],project);
    if(data.stage.status!=='PASS')throw Error('Data verifier failed; managed execution aborted');
    const managedEvidence=path.join(project,'Evidence/unity-tests.json');
    const codecEvidence=path.join(project,'Evidence/network-codec-tests.json');
    // Stale-result trap: remove only in disposable worktree; never mutate A70 imported source.
    for(const file of [managedEvidence,codecEvidence])if(fs.existsSync(file))fs.rmSync(file);
    const managedStart=Date.now();
    const managed=stage('managed','dotnet',['run','--configuration','Release','--project',
      'Tests/CoreClash.Tests.csproj','--','.'],project,900000);
    try {
      checkFresh(managedEvidence,managedStart);
      const j=JSON.parse(fs.readFileSync(managedEvidence,'utf8'));
      report.observed.managed={passed:j.passed,failed:j.failed,tests:Array.isArray(j.results)?j.results.length:null,
        freshEvidence:recordArtifact(managedEvidence,'managed-tests.json')};
      ensure(Number.isInteger(j.passed)&&j.passed>=selection.expectedMinTests,
        'Managed test count below required minimum '+selection.expectedMinTests);
      ensure(Number.isInteger(j.failed)&&j.failed===0,'Managed suite has failing tests');
      ensure(managed.stage.status==='PASS','Managed runner nonzero exit');
    } catch(e){managed.stage.status='FAIL';managed.stage.validationError=e.message;}
    const codecStart=Date.now();
    const codec=stage('codec','node',['Tools/network-codec-test.cjs'],project,480000);
    try {
      checkFresh(codecEvidence,codecStart);
      const j=JSON.parse(fs.readFileSync(codecEvidence,'utf8'));
      report.observed.codec={exitCode:j.exitCode,freshEvidence:recordArtifact(codecEvidence,'codec-tests.json')};
      ensure(codec.stage.status==='PASS'&&j.exitCode===0,'Codec runner/child returned nonzero');
      ensure(/RESULT:\s*13 network wire tests passed/.test(codec.raw.stdout),
        'Missing actual 13/13 codec completion marker');
    } catch(e){codec.stage.status='FAIL';codec.stage.validationError=e.message;}
    const success=data.stage.status==='PASS'&&managed.stage.status==='PASS'&&codec.stage.status==='PASS';
    report.verdict=selection.expectedRed?(success?'HOLD_UNEXPECTED_GREEN_F02':'HOLD_EXPECTED_RED_F02'):
      success?'PASS_MANAGED_CODEC_ONLY':'HOLD_TEST_FAILURE';
    process.exitCode=success&&!selection.expectedRed?0:1;
  } catch(e) {
    error=e.message||String(e);
    report.error=error;
    report.verdict=report.stages.some(s=>s.status==='BLOCKED')?'NOT_RUN_TOOLCHAIN_BLOCKED':'HOLD_PRECHECK_OR_TEST_ERROR';
    process.exitCode=1;
  } finally {
    if(!out){out=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a72-error-'));}
    fs.mkdirSync(out,{recursive:true});finish();
    if(error)console.error('A72 FAIL-CLOSED: '+error);
  }
}
