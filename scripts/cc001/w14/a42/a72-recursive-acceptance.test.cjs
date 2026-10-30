'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {FREEZE,gitBlob,fixture,exercise,argsMap}=require('./a72-recursive-acceptance.cjs');
const ORIGINAL=path.resolve(__dirname,'a72-source/verify-w10-player.cjs');
const OLD_BLOB='7b704b969c40abe84aaefdbf62cc82c81860ae72';
function withPatched(t){const src=fs.readFileSync(ORIGINAL,'utf8');
 assert(src.includes('function files(root){')&&src.includes('out=out.concat(files(f))'));
 const updated=src.replace('function files(root){','function files(root,playerRoot=root){')
  .replace('out=out.concat(files(f))','out=out.concat(files(f,playerRoot))')
  .replace('path.relative(root,f)','path.relative(playerRoot,f)');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w14-a42-fixture-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const file=path.join(tmp,'verify-w10-player.cjs');fs.writeFileSync(file,updated);return {file,blob:gitBlob(Buffer.from(updated))};
}
test('original exact A72 SHA-1 matches live GitHub blob',()=>assert.equal(gitBlob(fs.readFileSync(ORIGINAL)),OLD_BLOB));
test('historical A72 self-test is green but conceals nested manifest bug',()=>{const p=cp.spawnSync(process.execPath,[ORIGINAL,'--self-test'],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);const r=JSON.parse(p.stdout);assert.equal(r.pass,12);assert.equal(r.fail,0)});
test('genuine original A72 binary verifier FAILS independent correctly-rooted manifest',()=>{const r=exercise(ORIGINAL,OLD_BLOB);assert.equal(r.verdict,'A72_VERIFIER_CONTRACT_HOLD');const case0=r.checks.find(x=>x.id==='NESTED_CANONICAL_55FILES');assert.equal(case0.pass,false);assert.equal(case0.observed.exit,2)});
test('test-only repaired recursion passes all five canonical/negative original CLI tests',t=>{const a=withPatched(t),r=exercise(a.file,a.blob);assert.equal(r.verdict,'A72_VERIFIER_FIXTURE_CONTRACT_ACCEPTED',JSON.stringify(r.checks));assert.equal(r.checks.length,5);assert(r.checks.every(x=>x.pass));assert.equal(r.G3,'NOT_ATTESTED')});
test('tampered or stale expected verifier Git blob is rejected before execution',()=>assert.throws(()=>exercise(ORIGINAL,'0'.repeat(40)),/NOT_PINNED/));
test('requires an absolute original A72 verifier path',()=>assert.throws(()=>exercise('verify-w10-player.cjs',OLD_BLOB),/ABSOLUTE/));
test('rejects CLI missing required arguments',()=>assert.throws(()=>argsMap(['--sha='+OLD_BLOB]),/MISSING/));
test('rejects unknown and duplicate arguments',()=>{assert.throws(()=>argsMap(['--a=b']),/INVALID/);assert.throws(()=>argsMap(['--sha=x','--sha=y']),/INVALID/)});
test('CLI original bad A72 source returns exit2/HOLD and no QA claim',t=>{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w14-a42-cli-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const p=cp.spawnSync(process.execPath,[path.join(__dirname,'a72-recursive-acceptance.cjs'),'--verifier='+ORIGINAL,'--sha='+OLD_BLOB],{encoding:'utf8'});assert.equal(p.status,2,p.stderr);const report=JSON.parse(p.stdout);assert.equal(report.verdict,'A72_VERIFIER_CONTRACT_HOLD');assert.equal(report.nativeWindowsPlayer,'NOT_TESTED')});
test('CLI test-only repaired fixture returns exit0 scoped, not game PASS',t=>{const a=withPatched(t),p=cp.spawnSync(process.execPath,[path.join(__dirname,'a72-recursive-acceptance.cjs'),'--verifier='+a.file,'--sha='+a.blob],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);const report=JSON.parse(p.stdout);assert.equal(report.G3,'NOT_ATTESTED');assert.equal(report.verdict,'A72_VERIFIER_FIXTURE_CONTRACT_ACCEPTED')});
test('CLI refuses to overwrite an evidence report',t=>{const a=withPatched(t),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w14-a42-output-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const out=path.join(tmp,'report.json');const args=[path.join(__dirname,'a72-recursive-acceptance.cjs'),'--verifier='+a.file,'--sha='+a.blob,'--out='+out];const p1=cp.spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(p1.status,0);const p2=cp.spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(p2.status,3);assert.match(p2.stderr,/EEXIST/)});
test('independent fixture preserves exact Windows nested paths',t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w14-a42-path-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const m=fixture(dir);assert.equal(m.playerInventory.length,55);assert(m.playerInventory.some(x=>x.path==='CoreClash_Data/Managed/Assembly-CSharp.dll'));assert(m.playerInventory.every(x=>!x.path.includes('\\')));assert.equal(m.candidateSHA,FREEZE)});
