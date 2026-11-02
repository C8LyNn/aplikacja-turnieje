// Node tests for the W17-01 gate wrapper itself (not for Core Clash gameplay).
// They use a fake `dotnet` so the wrapper's isolation, exit-code and
// determinism logic can be exercised on machines without the .NET SDK.
// The real managed suite still has to be executed with the real SDK.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const gate = require('./managed-gate.cjs');

const GATE = path.join(__dirname, 'managed-gate.cjs');
const REAL_REPO = path.resolve(__dirname, '..', '..', '..');

const FAKE_DOTNET = `'use strict';
const fs=require('node:fs'),path=require('node:path');
const a=process.argv.slice(2);
if(a[0]==='--version'){console.log('9.0.999-fake');process.exit(0);}
if(a[0]!=='run'){console.error('fake dotnet: unsupported '+a.join(' '));process.exit(9);}
const root=a[a.indexOf('--')+1];
const program=fs.readFileSync(path.join(root,'Tests/Program.cs'),'utf8');
// Behave like the historical driver: write Evidence under the root argument.
fs.mkdirSync(path.join(root,'Evidence'),{recursive:true});
fs.writeFileSync(path.join(root,'Evidence/unity-tests.json'),'{"fake":true}');
if(process.env.FAKE_MUTATE_SOURCE)fs.writeFileSync(process.env.FAKE_MUTATE_SOURCE,'mutated by fake dotnet');
let names=['new match has source bases and distinct owners','second test','third test'];
if(process.env.FAKE_NONDET_COUNTER){const f=process.env.FAKE_NONDET_COUNTER;const n=fs.existsSync(f)?Number(fs.readFileSync(f,'utf8')):0;fs.writeFileSync(f,String(n+1));if(n>0)names.push('extra test');}
if(process.env.FAKE_NO_RESULT){console.log('PASS only');process.exit(0);}
let failed=0;
for(const n of names){if(n===names[0]&&program.includes('Eq(21,s.State.players[0].hp)')){console.log('FAIL '+n+': expected 21, got 20');failed++;}else console.log('PASS '+n);}
console.log('RESULT: '+(names.length-failed)+' passed, '+failed+' failed');
process.exit(failed?1:0);
`;

function git(dir, ...args) {
  const r = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

function fixture({ verifyExit = 0, anchor = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cc001-gate-fixture-'));
  const unity = path.join(root, gate.UNITY_REL);
  const w = (rel, text) => { const f = path.join(unity, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
  w('Tests/CoreClash.Tests.csproj', '<Project />\n');
  w('Tests/Program.cs', anchor ? 'Test("x",()=>{Eq(20,s.State.players[0].hp);});\n' : 'no anchor\n');
  w('Assets/CoreClash/Core/A.cs', 'class A{}\n');
  w('Assets/Resources/Data/catalog.json', '{}\n');
  w('Tools/verify-data.cjs', `console.log('${verifyExit ? 'FAIL: fixture' : 'PASS: fixture'}');process.exitCode=${verifyExit};\n`);
  w('Evidence/historical.json', '{"historical":true}\n');
  const fake = path.join(root, 'fake-dotnet.cjs');
  fs.writeFileSync(fake, FAKE_DOTNET);
  fs.writeFileSync(path.join(root, '.gitignore'), 'fake-dotnet.cjs\n');
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'gate@test.invalid');
  git(root, 'config', 'user.name', 'gate test');
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'fixture');
  return { root, unity, fake, head: git(root, 'rev-parse', 'HEAD') };
}

function runGate(args, env = {}) {
  const r = spawnSync(process.execPath, [GATE, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
  const m = /summary: (.+)$/m.exec(r.stdout);
  const summary = m && fs.existsSync(m[1].trim()) ? JSON.parse(fs.readFileSync(m[1].trim(), 'utf8')) : null;
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, summary };
}

const outDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'cc001-gate-out-'));

test('GREEN: exit 0, counts parsed, Evidence and git status untouched', () => {
  const f = fixture();
  const evidenceBefore = gate.treeHash(path.join(f.unity, 'Evidence'));
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir(), '--expect-sha', f.head]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.summary.status, 'GREEN');
  assert.deepEqual(r.summary.managed, { passed: 3, failed: 0, runs: 1, exitCodes: [0] });
  assert.equal(r.summary.verifyData.exitCode, 0);
  assert.equal(r.summary.source.unchanged, true);
  assert.deepEqual(gate.treeHash(path.join(f.unity, 'Evidence')), evidenceBefore);
  assert.equal(git(f.root, 'status', '--porcelain'), '');
  assert.equal(r.summary.repo.head, f.head);
});

test('RED probe: deliberately broken assertion gives non-zero exit and is attributed', () => {
  const f = fixture();
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir(), '--red']);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.equal(r.summary.status, 'RED_CONFIRMED');
  assert.equal(r.summary.redProbe.detected, true);
  assert.equal(r.summary.runs[0].exitCode, 1);
  assert.deepEqual(r.summary.runs[0].failures.map(x => x.name), [gate.RED_TEST_NAME]);
  // the breakage lived only in the temporary copy
  assert.match(fs.readFileSync(path.join(f.unity, 'Tests/Program.cs'), 'utf8'), /Eq\(20,/);
  assert.equal(git(f.root, 'status', '--porcelain'), '');
});

test('RED probe refuses to run when its anchor is missing (no silent pass)', () => {
  const f = fixture({ anchor: false });
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir(), '--red']);
  assert.equal(r.status, 3);
  assert.equal(r.summary.status, 'GATE_ERROR');
});

test('repeated runs on a clean tree report identical counts', () => {
  const f = fixture();
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir(), '--runs', '3']);
  assert.equal(r.status, 0, r.stdout);
  assert.equal(r.summary.runs.length, 3);
  assert.equal(new Set(r.summary.runs.map(x => `${x.result.passed}/${x.result.failed}/${x.namesSha256}`)).size, 1);
});

test('nondeterministic test lists fail the gate', () => {
  const f = fixture();
  const counter = path.join(outDir(), 'counter');
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir(), '--runs', '2'], { FAKE_NONDET_COUNTER: counter });
  assert.equal(r.status, 3);
  assert.match(r.summary.reasons.join(' '), /nondeterministic/);
});

test('a run that mutates the source worktree fails the gate', () => {
  const f = fixture();
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir()], { FAKE_MUTATE_SOURCE: path.join(f.unity, 'Evidence', 'unity-tests.json') });
  assert.equal(r.status, 3);
  assert.equal(r.summary.source.unchanged, false);
});

test('verify-data failure makes the gate RED even when managed tests pass', () => {
  const f = fixture({ verifyExit: 1 });
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir()]);
  assert.equal(r.status, 1);
  assert.equal(r.summary.status, 'RED');
  assert.equal(r.summary.verifyData.exitCode, 1);
});

test('missing RESULT line is a gate error, not a pass', () => {
  const f = fixture();
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir()], { FAKE_NO_RESULT: '1' });
  assert.equal(r.status, 3);
});

test('missing dotnet is BLOCKED_OPERATOR (exit 2), never PASS', () => {
  const f = fixture();
  const r = runGate(['--repo', f.root, '--dotnet', path.join(f.root, 'no-such-dotnet'), '--out', outDir()]);
  assert.equal(r.status, 2);
  assert.equal(r.summary.status, 'BLOCKED_OPERATOR');
});

test('wrong --expect-sha is refused before anything runs', () => {
  const f = fixture();
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', outDir(), '--expect-sha', '0000000']);
  assert.equal(r.status, 2);
  assert.equal(r.summary.runs.length, 0);
});

test('--out inside the repository is refused', () => {
  const f = fixture();
  const r = runGate(['--repo', f.root, '--dotnet', f.fake, '--out', path.join(f.root, 'gate-out')]);
  assert.equal(r.status, 2);
  assert.equal(fs.existsSync(path.join(f.root, 'gate-out')), false);
});

test('real checkout: copy layout runs the real verify-data.cjs against the real catalog', { skip: !fs.existsSync(path.join(REAL_REPO, gate.UNITY_REL, 'Tools/verify-data.cjs')) }, () => {
  const f = fixture(); // only for the fake dotnet script
  const r = runGate(['--repo', REAL_REPO, '--dotnet', f.fake, '--out', outDir()]);
  assert.equal(r.summary.verifyData.exitCode, 0, JSON.stringify(r.summary.verifyData));
  assert.match(r.summary.verifyData.stdout, /^PASS: 227 records/);
  assert.equal(r.summary.source.unchanged, true);
});

test('parser counts PASS/FAIL lines and RESULT', () => {
  const p = gate.parseManagedOutput('PASS a\r\nFAIL b: boom\nnoise\nRESULT: 1 passed, 1 failed\n');
  assert.deepEqual(p.result, { passed: 1, failed: 1 });
  assert.deepEqual(p.tests, [{ name: 'a', pass: true }, { name: 'b', pass: false, error: 'boom' }]);
});
