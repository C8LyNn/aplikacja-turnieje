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

// W12: integration contract with exact placeholder shapes emitted by A44 PR #164.
test('W12 A44 redacted Windows/Unix profile paths pass bounded privacy scan',t=>{
 const pc1='CC_NET_HOST_READY path=C:\\Users\\[USER]\\AppData\\LocalLow\\Player.log addr=[IP_REDACTED] token=[REDACTED]\n';
 const pc2='CC_NET_CLIENT_READY path=/home/[USER]/.config/unity3d/Player.log Authorization: [REDACTED]\n';
 const x=fixture(t,pc1,pc2),r=run(x.dir);
 assert.equal(r.status,0,r.stderr+' '+r.stdout);
 const output=JSON.parse(r.stdout);
 assert.deepEqual(output.findings,[]);
 assert.equal(output.peers.length,2);
 assert.equal(output.status,'PASS_BOUNDED_SCAN_NOT_QA');
});

test('W12 A44 Windows profile without further folder accepted',()=>{
 assert.deepEqual(scan('C:\\Users\\[USER]').findings,[]);
});

test('W12 Windows raw user segment still rejected',t=>{
 const x=fixture(t,'C:\\Users\\john.smith\\AppData\\Unity.log\n');const r=run(x.dir);
 assert.equal(r.status,3);
 assert.ok(JSON.parse(r.stdout).findings.some(f=>f.category==='WINDOWS_USER_PATH'));
 assert.ok(!r.stdout.includes('john.smith'));
});

test('W12 Unix raw user segment still rejected',t=>{
 const x=fixture(t,'/home/john.smith/logs/Player.log\n');const r=run(x.dir);
 assert.equal(r.status,3);
 assert.ok(JSON.parse(r.stdout).findings.some(f=>f.category==='UNIX_USER_PATH'));
 assert.ok(!r.stdout.includes('john.smith'));
});

test('W12 valid placeholder does not hide a second leaking Windows profile',()=>{
 const s=scan('C:\\Users\\[USER]\\foo C:\\Users\\secretperson\\foo');
 assert.ok(s.findings.some(x=>x.category==='WINDOWS_USER_PATH'));
});

test('W12 valid placeholder does not hide a second leaking Unix profile',()=>{
 const s=scan('/home/[USER]/foo /Users/secretperson/private');
 assert.ok(s.findings.some(x=>x.category==='UNIX_USER_PATH'));
});

test('W12 placeholder with appended username is rejected, not an allowed exact segment',()=>{
 const s=scan('C:\\Users\\[USER]john\\foo /home/[USER]secret/private');
 assert.deepEqual(s.findings.map(x=>x.category),['WINDOWS_USER_PATH','UNIX_USER_PATH']);
});

test('W12 only profile placeholder is permitted; raw credential on same line still fails',t=>{
 const x=fixture(t,'C:\\Users\\[USER]\\Player.log token=visible123\n');const r=run(x.dir);
 assert.equal(r.status,3);
 const output=JSON.parse(r.stdout);
 assert.ok(output.findings.some(x=>x.category==='CREDENTIAL_ASSIGNMENT'));
 assert.ok(!r.stdout.includes('visible123'));
});
