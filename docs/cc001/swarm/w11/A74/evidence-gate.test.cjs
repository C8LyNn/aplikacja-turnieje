'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {sha,inspect,scan}=require('./evidence-gate.cjs');
const SCRIPT=path.join(__dirname,'evidence-gate.cjs');
function fixture(t,pc1='CC_NET_INTENT_ACCEPT owner=1 seq=1 action=2\n',pc2='CC_NET_STATE_APPLIED rev=4\n'){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a74-w11-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const f1='PC1_Player.redacted.log',f2='PC2_Player.redacted.log';
 fs.writeFileSync(path.join(dir,f1),pc1);fs.writeFileSync(path.join(dir,f2),pc2);
 const m={schemaVersion:1,project:'CC-001',evidenceStatus:'CAPTURED_UNVERIFIED_BY_A60',
   pc1:{log:{file:f1,sanitizedSha256:sha(Buffer.from(pc1)),sanitizedBytes:Buffer.byteLength(pc1)}},
   pc2:{log:{file:f2,sanitizedSha256:sha(Buffer.from(pc2)),sanitizedBytes:Buffer.byteLength(pc2)}}};
 const save=()=>fs.writeFileSync(path.join(dir,'evidence-manifest.json'),JSON.stringify(m,null,2)+'\n');
 save();return {dir,m,save,f1,f2};
}
const run=dir=>cp.spawnSync(process.execPath,[SCRIPT,'--bundle',dir],{encoding:'utf8'});

test('valid A44 bundle yields bounded scan only, never G3 PASS',t=>{
 const x=fixture(t);const r=run(x.dir);assert.equal(r.status,0,r.stderr);
 const j=JSON.parse(r.stdout);assert.equal(j.status,'PASS_BOUNDED_SCAN_NOT_QA');
 assert.equal(j.peers.length,2);assert.equal(j.sourceEvidenceStatus,'CAPTURED_UNVERIFIED_BY_A60');
 assert.match(j.warnings.join(' '),/Manual privacy review/);
 assert.ok(!r.stdout.includes('CC_NET_INTENT_ACCEPT'));
});

test('known A44 redaction regression: token= canary fails with secret omitted',t=>{
 const x=fixture(t,'CC_NET_HOST_READY addr=[IP_REDACTED] token=secret123\nCC_NET_INTENT_ACCEPT owner=1 seq=1 action=2\n');
 const r=run(x.dir);assert.equal(r.status,3,r.stderr);
 const j=JSON.parse(r.stdout);assert.equal(j.status,'FAIL_SENSITIVE_PATTERN');
 assert.ok(j.findings.some(f=>f.category==='CREDENTIAL_ASSIGNMENT'&&f.role==='pc1'));
 assert.ok(!r.stdout.includes('secret123'));assert.ok(!r.stdout.includes('CC_NET_INTENT_ACCEPT'));
});

test('redacted placeholder is accepted and does not strip telemetry evidence',t=>{
 const x=fixture(t,'CC_NET_INTENT_ACCEPT owner=1 seq=1 action=2 token=[REDACTED]\n');
 assert.equal(run(x.dir).status,0);
});

for(const [name,line,label] of [
 ['session-token','session_token=abc123secret','CREDENTIAL_ASSIGNMENT'],
 ['access-token','access_token:abc123secret','CREDENTIAL_ASSIGNMENT'],
 ['plain-password','password=hello123','CREDENTIAL_ASSIGNMENT'],
 ['bearer-assignment','bearer=live-CANARY','CREDENTIAL_ASSIGNMENT'],
 ['bearer-header','Authorization: Bearer abcdefghijklmnopqrstuvwxyz','BEARER_AUTH'],
 ['IPV4','peer=192.168.1.19','IPV4_ADDRESS'],
 ['IPV6','peer=[2001:db8::1]','IPV6_ADDRESS'],
 ['email','admin@example.org','EMAIL_ADDRESS'],
 ['URL','https://sample.invalid/join?code=secret','WEB_URL'],
 ['win-profile','C:\\Users\\operator\\AppData\\LocalLow','WINDOWS_USER_PATH']]){
 test('rejects '+name+' but exposes only generic category, not secret text',t=>{
   const x=fixture(t,'CC_NET_STATE_APPLIED '+line+'\n');const r=run(x.dir);
   assert.equal(r.status,3,`${name} ${r.stderr} ${r.stdout}`);
   const j=JSON.parse(r.stdout);assert.ok(j.findings.some(f=>f.category===label),name);
   assert.ok(!r.stdout.includes(line));
 });
}

test('corrupt sanitized SHA256 or size => HOLD exit2',t=>{
 const x=fixture(t);x.m.pc1.log.sanitizedSha256='0'.repeat(64);x.save();
 const r=run(x.dir);assert.equal(r.status,2);assert.match(r.stderr,/SANITIZED_HASH_OR_SIZE_MISMATCH/);
 assert.equal(r.stdout,'');
});

test('path traversal file claim is rejected before reading',t=>{
 const x=fixture(t);x.m.pc2.log.file='../outside';x.save();assert.equal(run(x.dir).status,2);
});

test('additional files fail closed (original raw logs must NOT be packed)',t=>{
 const x=fixture(t);fs.writeFileSync(path.join(x.dir,'raw_Player.log'),'private raw data');
 assert.equal(run(x.dir).status,2);
});

test('symlinked redacted log fails closed',t=>{
 const x=fixture(t);fs.renameSync(path.join(x.dir,x.f1),path.join(x.dir,'source.log'));
 fs.symlinkSync(path.join(x.dir,'source.log'),path.join(x.dir,x.f1));
 assert.equal(run(x.dir).status,2);
});

test('same log bytes with two different filenames are rejected',t=>{
 const x=fixture(t,'same_log\n','same_log\n');assert.equal(run(x.dir).status,2);
});

test('unknown or falsely certified manifest verdict fails closed',t=>{
 const x=fixture(t);x.m.evidenceStatus='QA_PASS';x.save();assert.equal(run(x.dir).status,2);
});

test('UTF16 or binary data cannot be accepted as UTF8',t=>{
 const x=fixture(t);const data=Buffer.from('CC_NET_INTENT_ACCEPT\n','utf16le');
 fs.writeFileSync(path.join(x.dir,x.f1),data);
 x.m.pc1.log.sanitizedSha256=sha(data);x.m.pc1.log.sanitizedBytes=data.length;x.save();
 assert.equal(run(x.dir).status,2);
});

test('help and malformed CLI have correct exit contract',()=>{
 const h=cp.spawnSync(process.execPath,[SCRIPT,'--help'],{encoding:'utf8'});
 assert.equal(h.status,0);assert.match(h.stdout,/Usage/);
 const bad=cp.spawnSync(process.execPath,[SCRIPT,'--bundle','x','--extra','y'],{encoding:'utf8'});
 assert.equal(bad.status,2);
});

test('read-only: processing bundle does not mutate any input file bytes',t=>{
 const x=fixture(t);const before=[x.f1,x.f2,'evidence-manifest.json'].map(p=>fs.readFileSync(path.join(x.dir,p)));
 const r=run(x.dir);assert.equal(r.status,0);
 const after=[x.f1,x.f2,'evidence-manifest.json'].map(p=>fs.readFileSync(path.join(x.dir,p)));
 before.forEach((b,i)=>assert.ok(b.equals(after[i])));
 assert.equal(fs.readdirSync(x.dir).length,3);
});

test('sampled error location never echoes log text',()=>{
 const data=scan('auth=verysecret\nreason=private username john\n');
 assert.deepEqual(data.findings,[{line:1,category:'CREDENTIAL_ASSIGNMENT'}]);
 assert.equal(JSON.stringify(data).includes('verysecret'),false);
});
