'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {sha,scan}=require('./evidence-gate.cjs');
const cli=path.join(__dirname,'evidence-gate.cjs');

function bundle(t, pc1, pc2='CC_NET_STATE_APPLIED rev=17\n') {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a74-w14-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const f1='PC1_Player.redacted.log',f2='PC2_Player.redacted.log';
  const a=Buffer.from(pc1),b=Buffer.from(pc2);
  fs.writeFileSync(path.join(dir,f1),a);fs.writeFileSync(path.join(dir,f2),b);
  const m={schemaVersion:1,project:'CC-001',evidenceStatus:'CAPTURED_UNVERIFIED_BY_A60',
    pc1:{log:{file:f1,sanitizedSha256:sha(a),sanitizedBytes:a.length}},
    pc2:{log:{file:f2,sanitizedSha256:sha(b),sanitizedBytes:b.length}}};
  fs.writeFileSync(path.join(dir,'evidence-manifest.json'),JSON.stringify(m));
  return {dir,originals:[a,b],files:[f1,f2]};
}
const run=x=>cp.spawnSync(process.execPath,[cli,'--bundle',x.dir],{encoding:'utf8'});
function expectPrivate(t, secretLine, expectedCategory) {
  const x=bundle(t,'CC_NET_HOST_READY '+secretLine+'\n'),r=run(x);
  assert.equal(r.status,3,r.stderr+' '+r.stdout);
  const out=JSON.parse(r.stdout);
  assert.equal(out.status,'FAIL_SENSITIVE_PATTERN');
  assert.ok(out.findings.some(z=>z.role==='pc1'&&z.category===expectedCategory));
  assert.equal(r.stdout.includes(secretLine),false,'must never echo private contents');
  assert.equal(r.stderr.includes(secretLine),false,'must not echo private contents on stderr');
  x.files.forEach((f,i)=>assert.ok(fs.readFileSync(path.join(x.dir,f)).equals(x.originals[i])));
  assert.equal(fs.readdirSync(x.dir).length,3);
}

for(const [name,line,cls] of [
  ['token redacted then raw suffix','token=[REDACTED]secret-SUFFIX','CREDENTIAL_ASSIGNMENT'],
  ['session token redacted then raw suffix','session_token=[REDACTED]live-session','CREDENTIAL_ASSIGNMENT'],
  ['refresh token alternate placeholder suffix','refresh_token=[TOKEN_REDACTED]still-live','CREDENTIAL_ASSIGNMENT'],
  ['password alternate placeholder suffix','password=[SECRET_REDACTED]append','CREDENTIAL_ASSIGNMENT'],
  ['api key redacted prefix with raw suffix','api_key=[REDACTED]opaque','CREDENTIAL_ASSIGNMENT'],
  ['authorization colon with raw suffix','Authorization: [REDACTED]carry','CREDENTIAL_ASSIGNMENT'],
  ['join code appended','join_code=[REDACTED]invite','CREDENTIAL_ASSIGNMENT'],
  ['bearer assignment suffix','bearer=[REDACTED]live','CREDENTIAL_ASSIGNMENT'],
  ['bare Bearer header suffix','Bearer [REDACTED]live-secret','BEARER_AUTH'],
  ['quoted redaction suffix','token="[REDACTED]suffix"','CREDENTIAL_ASSIGNMENT']
])test('W14 rejects '+name+' without leaking text',t=>expectPrivate(t,line,cls));

test('W14 original exact A44 placeholder accepts token and bearer fields',t=>{
  const x=bundle(t,'CC_NET_HOST_READY owner=1 token=[REDACTED] session_token=[REDACTED] bearer=[REDACTED] Authorization: [REDACTED]\n');
  const r=run(x);
  assert.equal(r.status,0,r.stderr+' '+r.stdout);
  assert.equal(JSON.parse(r.stdout).status,'PASS_BOUNDED_SCAN_NOT_QA');
});

test('W14 all three documented standalone redaction markers still pass',t=>{
  const x=bundle(t,'CC_NET_HOST_READY access_token=[TOKEN_REDACTED] secret=[SECRET_REDACTED] token=[REDACTED]\n');
  const r=run(x);
  assert.equal(r.status,0,r.stderr+' '+r.stdout);
  assert.equal(JSON.parse(r.stdout).findings.length,0);
});

test('W14 comma and semicolon delimited standalone markers retain normal semantics',t=>{
  const x=bundle(t,'CC_NET_READY token=[REDACTED],rev=1 password=[REDACTED];owner=2\n');
  const r=run(x);assert.equal(r.status,0,r.stderr+' '+r.stdout);
});

test('W14 hidden credential still fails when a benign placeholder appears first',t=>{
  expectPrivate(t,'token=[REDACTED] owner=1 session_token=[REDACTED]leak','CREDENTIAL_ASSIGNMENT');
});

test('W14 previously fixed WebSocket / UNC and user placeholder semantics preserved',()=>{
  const out=scan('endpoint=ws://private.lan:7777 file=\\\\NAS-TEST\\share\\foo C:\\Users\\[USER]\\Player.log');
  assert.ok(out.findings.some(x=>x.category==='WEB_URL'));
  assert.ok(out.findings.some(x=>x.category==='UNC_SHARE_PATH'));
  assert.ok(!out.findings.some(x=>x.category==='WINDOWS_USER_PATH'));
});

test('W14 every report is metadata-only including during sensitive failure',t=>{
  const x=bundle(t,'CC_NET_HOST_READY owner=2 token=[REDACTED]secret-HIDDEN\n');
  const out=run(x);
  assert.equal(out.status,3);
  const obj=JSON.parse(out.stdout);
  assert.ok(obj.peers.every(z=>/^[a-f0-9]{64}$/.test(z.sha256)));
  assert.deepEqual(Object.keys(obj.findings[0]).sort(),['category','line','role']);
  for(const secret of ['secret-HIDDEN','CC_NET_HOST_READY']) assert.ok(!out.stdout.includes(secret));
});
