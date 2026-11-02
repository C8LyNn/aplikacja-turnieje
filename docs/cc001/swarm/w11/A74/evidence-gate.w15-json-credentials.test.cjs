'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const {scan,sha}=require('./evidence-gate.cjs');
const cli=path.join(__dirname,'evidence-gate.cjs');
function bundle(t,host,client='CC_NET_STATE_APPLIED rev=9\n') {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a74-w15-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const f1='PC1_Player.redacted.log',f2='PC2_Player.redacted.log';
 const a=Buffer.from(host),b=Buffer.from(client);
 fs.writeFileSync(path.join(dir,f1),a);fs.writeFileSync(path.join(dir,f2),b);
 const m={schemaVersion:1,project:'CC-001',evidenceStatus:'CAPTURED_UNVERIFIED_BY_A60',
  pc1:{log:{file:f1,sanitizedSha256:sha(a),sanitizedBytes:a.length}},
  pc2:{log:{file:f2,sanitizedSha256:sha(b),sanitizedBytes:b.length}}};
 fs.writeFileSync(path.join(dir,'evidence-manifest.json'),JSON.stringify(m));
 return {dir,files:[f1,f2],buffers:[a,b]};
}
const run=x=>cp.spawnSync(process.execPath,[cli,'--bundle',x.dir],{encoding:'utf8'});
const bad=[
 ['quoted JSON token','{"token":"high-entropy-key-very-private"}'],
 ['JSON password','{"password":"password-private-001"}'],
 ['JSON session token with spaces','{"session_token": "session secret with spaces"}'],
 ['JSON api key','{"api_key":"api_value_ABC123"}'],
 ['JSON bearer field','{"bearer":"bearer-private-123"}'],
 ['JSON access token in single quotes',"{'access_token':'access_token_private'}"],
 ['JSON credential followed by benign metadata','{"auth":"private-authorization","owner":2,"rev":42}'],
 ['JSON redacted marker with appended suffix','{"token":"[REDACTED]secret-suffix"}'],
 ['JSON alternate marker with suffix','{"refresh_token":"[TOKEN_REDACTED]very-private"}'],
 ['JSON secret numeric value','{"secret":123456789}'],
 ['raw credential after already-redacted field','{"token":"[REDACTED]","password":"another-private-value"}'],
 ['JSON quoted escape sequences','{"token":"hidden\\u002dsecret"}']
];
for (const [name,payload] of bad) test('W15 rejects '+name+' without leaking content',t=>{
 const x=bundle(t,'CC_NET_TRACE_RX owner=1 '+payload+'\n');
 const r=run(x);assert.equal(r.status,3,r.stderr+' '+r.stdout);
 const out=JSON.parse(r.stdout);
 assert.equal(out.status,'FAIL_SENSITIVE_PATTERN');
 assert.ok(out.findings.some(f=>f.role==='pc1'&&f.category==='JSON_CREDENTIAL_FIELD'));
 assert.ok(!r.stdout.includes(payload));assert.ok(!r.stderr.includes(payload));
 assert.ok(!r.stdout.includes('CC_NET_TRACE_RX'));
 x.files.forEach((f,i)=>assert.ok(fs.readFileSync(path.join(x.dir,f)).equals(x.buffers[i])));
 assert.equal(fs.readdirSync(x.dir).length,3);
});
for (const [name,payload] of [
 ['exact REDACTED','{"token":"[REDACTED]"}'],
 ['exact TOKEN_REDACTED','{"session_token":"[TOKEN_REDACTED]"}'],
 ['exact SECRET_REDACTED','{"secret":"[SECRET_REDACTED]"}'],
 ['JSON null','{"token":null}'],
 ['JSON empty string','{"password":""}'],
 ['legacy non-JSON A44 markers','CC_NET_HOST_READY token=[REDACTED] Authorization: [REDACTED]'],
 ['old redacted user path','CC_NET_HOST_READY path=C:\\Users\\[USER]\\Player.log']
]) test('W15 preserves '+name,t=>{
 const x=bundle(t,payload+'\n');const r=run(x);
 assert.equal(r.status,0,r.stderr+' '+r.stdout);
 assert.equal(JSON.parse(r.stdout).status,'PASS_BOUNDED_SCAN_NOT_QA');
});
test('W15 prior W14 partial-redaction suffix still rejected',()=>{
 assert.ok(scan('token=[REDACTED]leaked').findings.some(f=>f.category==='CREDENTIAL_ASSIGNMENT'));
});
test('W15 prior W13 ws and UNC still rejected',()=>{
 const x=scan('endpoint=wss://a.lan:7777 file=\\\\SERVER\\share\\f');
 assert.ok(x.findings.some(f=>f.category==='WEB_URL'));
 assert.ok(x.findings.some(f=>f.category==='UNC_SHARE_PATH'));
});
test('W15 two JSON credentials on one line, first benign, second secret still detected',()=>{
 const x=scan('{"token":"[REDACTED]","refresh_token":"privacy-leak"}');
 assert.ok(x.findings.some(f=>f.category==='JSON_CREDENTIAL_FIELD'));
 assert.equal(JSON.stringify(x).includes('privacy-leak'),false);
});
