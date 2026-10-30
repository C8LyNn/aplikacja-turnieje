'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const { scan, sha } = require('./evidence-gate.cjs');
const script = path.join(__dirname, 'evidence-gate.cjs');

function pair(t, hostLine, clientLine = 'CC_NET_STATE_APPLIED rev=4\n') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc001-a74-w13-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const files = ['PC1_Player.redacted.log', 'PC2_Player.redacted.log'];
  const data = [hostLine, clientLine].map(x => Buffer.from(x));
  for (let i=0; i<2; i++) fs.writeFileSync(path.join(dir, files[i]), data[i]);
  const manifest = {
    schemaVersion: 1, project: 'CC-001', evidenceStatus: 'CAPTURED_UNVERIFIED_BY_A60',
    pc1: { log: { file: files[0], sanitizedSha256: sha(data[0]), sanitizedBytes: data[0].length } },
    pc2: { log: { file: files[1], sanitizedSha256: sha(data[1]), sanitizedBytes: data[1].length } }
  };
  fs.writeFileSync(path.join(dir, 'evidence-manifest.json'), JSON.stringify(manifest));
  return { dir, data, files };
}
function run(dir) {
  return cp.spawnSync(process.execPath, [script, '--bundle', dir], {encoding:'utf8'});
}

test('W13: raw ws:// peer URL must fail even with no IP or token key', t => {
  const x = pair(t, 'CC_NET_CONNECT endpoint=ws://match-coreclash.lan:7777/session\n');
  const r=run(x.dir);
  assert.equal(r.status,3,r.stderr+' '+r.stdout);
  const o=JSON.parse(r.stdout);
  assert.equal(o.status,'FAIL_SENSITIVE_PATTERN');
  assert.ok(o.findings.some(f=>f.role==='pc1'&&f.category==='WEB_URL'));
  assert.equal(r.stdout.includes('match-coreclash.lan'),false);
});

test('W13: raw mixed-case WSS:// remote websocket URL must fail', t => {
  const x=pair(t,'CC_NET_CONNECT endpoint=WSS://private-relay.internal:9443/socket\n');
  const r=run(x.dir);
  assert.equal(r.status,3,r.stderr);
  assert.ok(JSON.parse(r.stdout).findings.some(f=>f.category==='WEB_URL'));
  assert.equal(r.stdout.includes('private-relay.internal'),false);
});

test('W13: raw UNC share path with hostname and share must fail', t => {
  const x=pair(t,'CC_NET_FILE path=\\\\LAN-NAS-01\\privateQA\\Player.log\n');
  const r=run(x.dir);
  assert.equal(r.status,3,r.stderr);
  assert.ok(JSON.parse(r.stdout).findings.some(f=>f.category==='UNC_SHARE_PATH'));
  assert.equal(r.stdout.includes('LAN-NAS-01'),false);
});

test('W13: explicit URL placeholder passes without removing network diagnostic trace',t=>{
  const x=pair(t,'CC_NET_CONNECT endpoint=[URL_REDACTED] owner=2 revision=7\n');
  const r=run(x.dir);
  assert.equal(r.status,0,r.stderr+' '+r.stdout);
  assert.equal(JSON.parse(r.stdout).status,'PASS_BOUNDED_SCAN_NOT_QA');
  assert.equal(r.stdout.includes('CC_NET_CONNECT'),false);
});

test('W13: W12 sanitized user path still accepted after URL/UNC changes',t=>{
  const x=pair(t,'CC_NET_STATE path=C:\\Users\\[USER]\\LocalLow\\Player.log addr=[IP_REDACTED]\n',
    'CC_NET_CLIENT path=/home/[USER]/.config/unity3d/Player.log\n');
  assert.equal(run(x.dir).status,0);
});

test('W13: websocket URL and separately leaked credential each reported without values',t=>{
  const x=pair(t,'endpoint=wss://relay.example:7443/conn token=sensitive-credential\n');
  const r=run(x.dir),j=JSON.parse(r.stdout);
  assert.equal(r.status,3);
  assert.deepEqual(j.findings.filter(f=>f.role==='pc1').map(f=>f.category).sort(),
    ['CREDENTIAL_ASSIGNMENT','WEB_URL']);
  assert.equal(r.stdout.includes('sensitive-credential'),false);
  assert.equal(r.stdout.includes('relay.example'),false);
});

test('W13: UNC and ws URL cannot be hidden by benign placeholder on same line',()=>{
  const list=scan('path=C:\\Users\\[USER]\\File.log endpoint=ws://internal.lan/path smb=\\\\QA-BOX\\logs\\PC2.log');
  assert.ok(list.findings.some(f=>f.category==='WEB_URL'));
  assert.ok(list.findings.some(f=>f.category==='UNC_SHARE_PATH'));
  assert.ok(!list.findings.some(f=>f.category==='WINDOWS_USER_PATH'));
});

test('W13: read-only sensitive rejection does not mutate supplied source files',t=>{
  const x=pair(t,'CC_NET_CONNECT uri=ws://private-target.local:7777\n');
  const before=x.files.map(f=>fs.readFileSync(path.join(x.dir,f)));
  const r=run(x.dir);assert.equal(r.status,3);
  before.forEach((v,i)=>assert.ok(v.equals(fs.readFileSync(path.join(x.dir,x.files[i])))));
  assert.equal(fs.readdirSync(x.dir).length,3);
});

test('W13: original HTTP(S) and IPv4 detection still active',()=>{
  const c=scan('url=https://example.invalid/a remote=192.168.1.50');
  assert.ok(c.findings.some(f=>f.category==='WEB_URL'));
  assert.ok(c.findings.some(f=>f.category==='IPV4_ADDRESS'));
});
