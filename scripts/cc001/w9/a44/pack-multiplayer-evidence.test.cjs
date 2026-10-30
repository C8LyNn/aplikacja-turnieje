'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { capture, redact, sha, parseArgs } = require('./pack-multiplayer-evidence.cjs');
function withInputs(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc001-a44-test-'));
  const host = path.join(dir, 'pc1.log'), client = path.join(dir, 'pc2.log');
  fs.writeFileSync(host, 'CC_NET_HOST_READY addr=192.168.1.3 token=secret123\nCC_NET_INTENT_ACCEPT owner=1 seq=1 action=2\n');
  fs.writeFileSync(client, 'CC_NET_STATE_APPLIED rev=4\nCC_NET_TRACE_RX rev=4 serial=2 tms=55 turn=1\n');
  try { run({ dir, host, client, out: path.join(dir, 'bundle'), session: 'W9_PAIR_01' }); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
test('private IP, user path, email, URL, secrets redacted without deleting A31 trace identity', () => {
  const s = redact('CC_NET_INTENT_ACCEPT owner=1 seq=3 action=5 192.168.1.3 C:\\Users\\alice\\foo aa@host.test https://example.org/?key=123 join_code=abc');
  assert.match(s, /CC_NET_INTENT_ACCEPT owner=1 seq=3 action=5/);
  for (const secret of ['192.168.1.3', 'alice', 'aa@host.test', 'example.org', 'join_code=abc']) assert.ok(!s.includes(secret));
});
test('creates redacted-only bundle with reproducible SHA and consistent PC1/PC2 names', () => withInputs(o => {
  const before = fs.readFileSync(o.host);
  const manifest = capture(o);
  assert.equal(manifest.project, 'CC-001');
  assert.equal(manifest.sessionId, 'W9_PAIR_01');
  assert.equal(manifest.pc1.log.originalSha256, sha(before));
  assert.equal(manifest.pc1.exe.status, 'NOT_PROVIDED');
  assert.equal(fs.readFileSync(o.host).equals(before), true);
  const redacted = fs.readFileSync(path.join(o.out, manifest.pc1.log.file), 'utf8');
  assert.equal(redacted.includes('192.168.1.3'), false);
  assert.equal(redacted.includes('token=secret123'), false); // A74 W10 credential canary
  assert.match(redacted, /CC_NET_INTENT_ACCEPT owner=1 seq=1 action=2/);
  const out = fs.readFileSync(path.join(o.out, manifest.pc2.log.file));
  assert.equal(sha(out), manifest.pc2.log.sanitizedSha256);
  assert.equal(fs.readdirSync(o.out).length, 3);
  assert.equal(JSON.parse(fs.readFileSync(path.join(o.out, 'evidence-manifest.json'))).pc2.seatClaim, 'P2');
}));
test('credentials in key/value and bearer-header formats are removed from saved PC1 log', () => withInputs(o => {
  const line = 'CC_NET_PEER_CONNECTED owner=1 session_token=session-ABC bearer=driver-Q Authorization: Bearer header-SECRET refresh_token=RESTART\n';
  fs.appendFileSync(o.host, line);
  const m = capture(o);
  const saved = fs.readFileSync(path.join(o.out, m.pc1.log.file), 'utf8');
  for (const secret of ['session-ABC','driver-Q','header-SECRET','RESTART']) assert.equal(saved.includes(secret), false);
  assert.match(saved, /CC_NET_PEER_CONNECTED owner=1/);
  assert.match(saved, /session_token=\[REDACTED\]/);
  assert.match(saved, /Authorization: \[REDACTED\]/);
  assert.equal(fs.readFileSync(o.host,'utf8').includes('header-SECRET'), true); // raw input untouched
}));
test('reject duplicate log paths before writing', () => withInputs(o => {
  assert.throws(() => capture({ ...o, client: o.host }), /DUPLICATE_LOG_SOURCE/);
  assert.equal(fs.existsSync(o.out), false);
}));
test('reject invalid session, missing log and existing output', () => withInputs(o => {
  assert.throws(() => capture({ ...o, session: '../oops' }), /INVALID_SESSION_ID/);
  assert.throws(() => capture({ ...o, client: path.join(o.dir, 'missing.log') }));
  capture(o);
  assert.throws(() => capture(o), /OUTPUT_ALREADY_EXISTS/);
}));
test('reject stale or mismatched binary without committing a bundle', () => withInputs(o => {
  const h = path.join(o.dir, 'h.exe'), c = path.join(o.dir, 'c.exe');
  fs.writeFileSync(h, 'same bytes'); fs.writeFileSync(c, 'different bytes');
  const expected = sha(Buffer.from('same bytes'));
  assert.throws(() => capture({ ...o, hostExe:h, clientExe:c, expectedExeSha:expected }), /BUILD_SHA_MISMATCH/);
  assert.equal(fs.existsSync(o.out), false);
}));
test('both matching binaries classified as operator-bound, not A70-certified', () => withInputs(o => {
  const h = path.join(o.dir, 'h.exe'), c = path.join(o.dir, 'c.exe');
  fs.writeFileSync(h, 'same'); fs.writeFileSync(c, 'same');
  const m=capture({ ...o, hostExe:h, clientExe:c, expectedExeSha:sha(Buffer.from('same')) });
  assert.equal(m.pc1.exe.status, 'MATCHES_OPERATOR_EXPECTATION');
  assert.equal(m.pc2.exe.sha256, m.pc1.exe.sha256);
  assert.equal(m.evidenceStatus, 'CAPTURED_UNVERIFIED_BY_A60');
}));
test('argument parser rejects unknown and repeated flags', () => {
  assert.deepEqual(parseArgs(['--host', 'a', '--client', 'b']).host, 'a');
  assert.throws(() => parseArgs(['--host', 'a', '--host', 'b']), /DUPLICATE_ARGUMENT/);
  assert.throws(() => parseArgs(['--unknown', 'x']), /INVALID_ARGUMENT/);
});

// A74 W13: actual A44 persisted output must not leak websocket endpoints or Windows UNC shares.
test('W14: saved PC1 and PC2 evidence redacts ws/wss and UNC without destroying diagnostic markers',()=>withInputs(o=>{
 const network = String.raw`CC_NET_TRACE_RX rev=7 owner=1 seq=3 action=6 endpoint=wss://private-lan.example/ws?key=123 share=\\LAN-HOST\private-share\sensitive\asset.db`;
 const other = String.raw`CC_NET_TRACE_TX rev=7 owner=0 seq=4 action=8 ws://legacy-host.internal/ws \\NAS-PRIVATE\secret-bucket\player.log`;
 fs.appendFileSync(o.host,network+'\n');
 fs.appendFileSync(o.client,other+'\n');
 const sourcePC1=fs.readFileSync(o.host),sourcePC2=fs.readFileSync(o.client);
 const m=capture(o);
 const saved1=fs.readFileSync(path.join(o.out,'PC1_Player.redacted.log'),'utf8');
 const saved2=fs.readFileSync(path.join(o.out,'PC2_Player.redacted.log'),'utf8');
 for(const secret of ['private-lan.example','LAN-HOST','private-share','sensitive','legacy-host.internal','NAS-PRIVATE','secret-bucket']){
  assert.equal((saved1+'\n'+saved2).includes(secret),false,secret);
 }
 assert.match(saved1,/CC_NET_TRACE_RX rev=7 owner=1 seq=3 action=6/);
 assert.match(saved2,/CC_NET_TRACE_TX rev=7 owner=0 seq=4 action=8/);
 assert.match(saved1,/\[UNC_REDACTED\]/);
 assert.match(saved2,/\[UNC_REDACTED\]/);
 assert.equal(m.pc1.log.originalSha256,sha(sourcePC1));
 assert.equal(m.pc2.log.originalSha256,sha(sourcePC2));
 assert.equal(m.pc1.log.sanitizedSha256,sha(Buffer.from(saved1)));
 assert.equal(m.pc2.log.sanitizedSha256,sha(Buffer.from(saved2)));
 assert.equal(fs.readFileSync(o.host).equals(sourcePC1),true);
 assert.equal(fs.readFileSync(o.client).equals(sourcePC2),true);
}));

test('W14: websocket and UNC path variants are individually scrubbed',()=>{
 for(const [leak,safe] of [
  ['ws://relay.internal:7777/snapshot','[URL_REDACTED]'],
  ['wss://host.internal/token=abcd','[URL_REDACTED]'],
  [String.raw`\\PC1-PRIVATE\media\entry.txt`,'[UNC_REDACTED]'],
 ]){
  const output=redact('CC_NET_HOST_READY owner=0 '+leak);
  assert.ok(!output.includes(leak));
  assert.ok(output.includes(safe));
  assert.match(output,/CC_NET_HOST_READY owner=0/);
 }
});
