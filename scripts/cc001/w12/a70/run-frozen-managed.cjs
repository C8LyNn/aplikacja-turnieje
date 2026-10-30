'use strict';
// A70 W12 isolated managed-only Windows QA. Never builds Unity or declares G3.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { archiveAndRemoveStaleResult, validateNewResult } = require('./fresh-test-evidence.cjs');

const FROZEN = '3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const REF = 'refs/heads/integration/cc001-r17-w11-qa-freeze-20261030';
const RC1 = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const PROJECT = 'unity/cc001-r16/CoreClash-V149-Unity';
const PROTECTED = [
  PROJECT + '/Assets/CoreClash/Networking/NgoWireProtocol.cs',
  PROJECT + '/Assets/CoreClash/Editor/BuildTools.cs',
  PROJECT + '/Packages/manifest.json',
  PROJECT + '/ProjectSettings/ProjectSettings.asset',
  PROJECT + '/Assets/Resources/Data/catalog.json'
];
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function parse(argv) {
  if (argv.length !== 2) throw Error('Usage: --repo=CHECKOUT --out=NEW_EVIDENCE_DIR');
  const o = {};
  for (const item of argv) {
    const m = /^--(repo|out)=(.+)$/.exec(item);
    if (!m || Object.hasOwn(o,m[1])) throw Error('Invalid or repeated argument');
    o[m[1]] = path.resolve(m[2]);
  }
  if (!o.repo || !o.out || o.repo === o.out || o.out.startsWith(o.repo + path.sep))
    throw Error('Evidence must use a separate directory outside source checkout');
  return o;
}
function checkIdentity(head, remote, rc1Ancestor, protectedDiff) {
  if (head !== FROZEN) throw Error('WRONG_CHECKOUT_SHA');
  if (remote !== FROZEN) throw Error('FROZEN_QA_REF_DRIFT');
  if (!rc1Ancestor) throw Error('RC1_NOT_ANCESTOR');
  if (protectedDiff.trim()) throw Error('PROTECTED_PATH_CHANGED');
  return 'PINNED_SOURCE_ONLY';
}
function command(bin,args,cwd,logPath) {
  const result = cp.spawnSync(bin,args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:64*1024*1024});
  const output = (result.stdout || '') + (result.stderr || '');
  if (logPath) fs.writeFileSync(logPath,output,'utf8');
  return {code:result.status === null ? 127 : result.status,output,error:result.error?.message || null};
}
function git(root,args) {
  const r = command('git',['-C',root,...args],root);
  if (r.code !== 0) throw Error('GIT_FAILURE: ' + (r.error || r.output).slice(-350));
  return r.output.trim();
}
function selfTest() {
  const tests = [
    () => assert.equal(checkIdentity(FROZEN,FROZEN,true,''),'PINNED_SOURCE_ONLY'),
    () => assert.throws(()=>checkIdentity('0'.repeat(40),FROZEN,true,''),/WRONG_CHECKOUT_SHA/),
    () => assert.throws(()=>checkIdentity(FROZEN,'f'.repeat(40),true,''),/FROZEN_QA_REF_DRIFT/),
    () => assert.throws(()=>checkIdentity(FROZEN,FROZEN,false,''),/RC1_NOT_ANCESTOR/),
    () => assert.throws(()=>checkIdentity(FROZEN,FROZEN,true,PROTECTED[0]),/PROTECTED_PATH_CHANGED/),
    () => assert.equal(PROTECTED.length,5),
    () => assert.throws(()=>parse([]),/Usage/),
    () => assert.throws(()=>parse(['--repo=x','--repo=y']),/repeated/),
    () => assert.throws(()=>parse(['--repo=x','--out=x/inside']),/separate directory/),
    () => assert.ok(/^[a-f0-9]{40}$/.test(FROZEN)),
    () => assert.ok(REF.endsWith('qa-freeze-20261030')),
    () => assert.equal(hash('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  ];
  for (const t of tests) t();
  process.stdout.write(JSON.stringify({scope:'NODE_SELF_TEST_ONLY',passed:tests.length,failed:0})+'\n');
}
function writeJson(file,obj) {fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n');}
function execute(args) {
  if (process.platform !== 'win32') throw Error('WINDOWS_ONLY: real .NET execution requires Windows host');
  const o = parse(args);
  if (!fs.existsSync(o.repo) || fs.existsSync(o.out)) throw Error('Missing source or evidence output already exists');
  fs.mkdirSync(o.out,{recursive:true});
  const summary = {
    schema:'CC001-W11-A70-MANAGED-FREEZE-1',
    frozenSource:FROZEN, frozenRef:REF, protectedRc1:RC1,
    status:'HOLD', hostPlatform:process.platform,
    dotnetVersion:null, buildExit:null, runExit:null,
    testsPassed:null, testsFailed:null, evidence: {},
    meaning:'Managed C# suite on frozen SHA only; never Unity Windows Player, PC1-PC2, G3, G4 or release.'
  };
  let error=null;
  try {
    const current = git(o.repo,['rev-parse','HEAD']);
    const remoteRaw = git(o.repo,['ls-remote','origin',REF]);
    const remote = remoteRaw.split(/\s+/)[0] || '';
    const ancestor = command('git',['-C',o.repo,'merge-base','--is-ancestor',RC1,current],o.repo).code === 0;
    const changed = git(o.repo,['diff','--name-only',RC1,current,'--',...PROTECTED]);
    checkIdentity(current,remote,ancestor,changed);
    // Reject poisoned checkout bytes; the immutable Git commit alone is insufficient.
    if (git(o.repo,['status','--porcelain=v1','--untracked-files=all']))
      throw Error('DIRTY_FROZEN_SOURCE_CHECKOUT');
    const projectRoot=path.join(o.repo,PROJECT);
    const csproj=path.join(projectRoot,'Tests','CoreClash.Tests.csproj');
    const runner=path.join(projectRoot,'Tests','Program.cs');
    if (!fs.existsSync(csproj) || !fs.existsSync(runner)) throw Error('MANAGED_TEST_PROJECT_MISSING');
    summary.evidence.csprojSHA256=hash(fs.readFileSync(csproj));
    summary.evidence.testRunnerSHA256=hash(fs.readFileSync(runner));
    const version=command('dotnet',['--version'],o.repo,path.join(o.out,'dotnet-version.log'));
    summary.dotnetVersion=version.output.trim();
    if(version.code!==0 || !/^9\.\d+\.\d+/.test(summary.dotnetVersion))throw Error('DOTNET9_REQUIRED');
    const build=command('dotnet',['build',csproj,'-c','Release','--nologo'],o.repo,path.join(o.out,'managed-build.log'));
    summary.buildExit=build.code;
    if(build.code!==0) throw Error('MANAGED_BUILD_FAILED');
    // Frozen source tracks R16 Evidence/unity-tests.json (historical 180/0 PASS).
    // Archive and remove it BEFORE execution; never accept it as current test proof.
    const evidencePath=path.join(projectRoot,'Evidence','unity-tests.json');
    summary.evidence.staleResult=archiveAndRemoveStaleResult(evidencePath,o.out);
    const start=Date.now();
    const run=command('dotnet',['run','--no-build','-c','Release','--project',csproj,'--',projectRoot],o.repo,path.join(o.out,'managed-tests.log'));
    const finish=Date.now();
    summary.runExit=run.code;
    if(run.code!==0) throw Error('MANAGED_TEST_PROCESS_FAILED');
    const fresh=validateNewResult(evidencePath,start,finish);
    fs.writeFileSync(path.join(o.out,'unity-tests.json'),fresh.body,{flag:'wx'});
    summary.evidence.testJsonSHA256=fresh.sha256;
    summary.testsPassed=fresh.parsed.passed;
    summary.testsFailed=fresh.parsed.failed;
    summary.status='PASS_MANAGED_ONLY';
  } catch(e) {error=e.message;summary.blocker=error;}
  for (const name of ['dotnet-version.log','managed-build.log','managed-tests.log','unity-tests.json','preexisting-unity-tests.json']) {
    const file=path.join(o.out,name);
    if(fs.existsSync(file)) summary.evidence[name]={bytes:fs.statSync(file).size,sha256:hash(fs.readFileSync(file))};
  }
  writeJson(path.join(o.out,'summary.json'),summary);
  process.stdout.write(JSON.stringify({status:summary.status,source:summary.frozenSource,blocker:error,testsPassed:summary.testsPassed,output:o.out})+'\n');
  return summary.status==='PASS_MANAGED_ONLY'?0:2;
}
if(require.main===module){
  if(process.argv.slice(2).includes('--self-test'))selfTest();
  else {try{process.exitCode=execute(process.argv.slice(2));}catch(e){process.stderr.write('HOLD: '+e.message+'\n');process.exitCode=2;}}
}
module.exports={FROZEN,REF,RC1,PROTECTED,checkIdentity,parse,hash,selfTest,execute};
