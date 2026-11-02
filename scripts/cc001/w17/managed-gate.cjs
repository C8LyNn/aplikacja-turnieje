#!/usr/bin/env node
// CC-001 W17-01 (#283): local, repeatable managed C# + data gate for Core Clash Unity.
//
// What it does (and nothing more):
//   1. Records the repository HEAD and a fingerprint of the Unity project's
//      tracked/untracked state and Evidence/ tree.
//   2. Copies ONLY the inputs the existing managed test project needs into a
//      fresh temporary directory, so the historical test driver (which writes
//      Evidence/*.json under its root argument) can never touch the worktree.
//   3. Runs the EXISTING test project (Tests/CoreClash.Tests.csproj) with
//      `dotnet run` against that copy, N times if requested, and the EXISTING
//      Tools/verify-data.cjs against the same copy.
//   4. Re-checks the source fingerprint and writes summary.json + logs to an
//      output directory outside the repository.
//
// It is not a builder, not CI, not a release pipeline and does not replace
// A72 (#188). It never pushes, commits or modifies the repository.
//
// Exit codes: 0 gate GREEN, 1 gate RED (tests/data failed, or --red probe
// produced the expected failure), 2 BLOCKED_OPERATOR (missing dotnet/node/
// git/inputs), 3 gate integrity error (source mutated, nondeterministic
// counts, red probe anchor missing, unparseable test output).
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const UNITY_REL = 'unity/cc001-r16/CoreClash-V149-Unity';
const REFERENCE_REL = 'unity/cc001-r16/Reference/V148_reference_original.html';
// Inputs required by Tests/CoreClash.Tests.csproj (Compile items) and by
// Program.Main (catalog + featured decks) plus verify-data.cjs.
const COPY_DIRS = ['Assets/CoreClash', 'Assets/Resources/Data', 'Tests'];
const COPY_FILES = ['Tools/verify-data.cjs'];
const SKIP_DIR_NAMES = new Set(['bin', 'obj', '.vs']);
// Deliberate, copy-only breakage used by --red: the very first registered
// assertion in Tests/Program.cs (bases start at 20 HP, R16 value) is flipped.
const RED_ANCHOR = 'Eq(20,s.State.players[0].hp)';
const RED_REPLACEMENT = 'Eq(21,s.State.players[0].hp)';
const RED_TEST_NAME = 'new match has source bases and distinct owners';

function usage() {
  return [
    'Usage: node scripts/cc001/w17/managed-gate.cjs [options]',
    '  --repo <dir>          repository root (default: two levels above this script)',
    '  --expect-sha <sha>    fail (exit 2) unless HEAD equals this commit',
    '  --out <dir>           output directory (default: <tmp>/cc001-w17-gate/<UTC stamp>)',
    '  --runs <n>            run the managed suite n times (default 1) and require identical results',
    '  --configuration <c>   dotnet build configuration (default Release)',
    '  --dotnet <path>       dotnet executable (default: dotnet on PATH; .js/.cjs runs with node)',
    '  --red                 RED probe: break one assertion in the temporary copy; expect exit 1',
    '  --keep                keep the temporary copy for inspection',
    '  --roll-forward        allow running the net9.0 tests on a newer runtime (DOTNET_ROLL_FORWARD=Major); reported in summary',
    '  --help'
  ].join('\n');
}

function parseArgs(argv) {
  const opts = { runs: 1, configuration: 'Release', red: false, keep: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`missing value for ${a}`);
      return argv[++i];
    };
    if (a === '--repo') opts.repo = next();
    else if (a === '--expect-sha') opts.expectSha = next().toLowerCase();
    else if (a === '--out') opts.out = next();
    else if (a === '--runs') opts.runs = Number(next());
    else if (a === '--configuration') opts.configuration = next();
    else if (a === '--dotnet') opts.dotnet = next();
    else if (a === '--red') opts.red = true;
    else if (a === '--keep') opts.keep = true;
    else if (a === '--roll-forward') opts.rollForward = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  if (!Number.isInteger(opts.runs) || opts.runs < 1 || opts.runs > 10) throw new Error('--runs must be an integer 1..10');
  if (opts.expectSha && !/^[0-9a-f]{7,40}$/.test(opts.expectSha)) throw new Error('--expect-sha must be a hex commit id');
  return opts;
}

function run(cmd, args, options = {}) {
  let file = cmd, fullArgs = args;
  if (/\.(c?js|mjs)$/i.test(cmd)) { file = process.execPath; fullArgs = [cmd, ...args]; }
  const started = Date.now();
  const r = spawnSync(file, fullArgs, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, windowsHide: true, ...options });
  return {
    status: r.status, signal: r.signal, error: r.error ? String(r.error.message || r.error) : null,
    stdout: r.stdout || '', stderr: r.stderr || '', ms: Date.now() - started
  };
}

function walkFiles(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, base, out);
    else if (entry.isFile()) out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

function treeHash(dir) {
  const h = crypto.createHash('sha256');
  const files = walkFiles(dir);
  for (const rel of files) {
    h.update(rel + '\0');
    h.update(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, rel))).digest('hex') + '\n');
  }
  return { files: files.length, sha256: h.digest('hex') };
}

function sourceFingerprint(repo, gitOk) {
  const unity = path.join(repo, UNITY_REL);
  const fp = { evidence: treeHash(path.join(unity, 'Evidence')), testsBinObjPresent: ['bin', 'obj'].filter(n => fs.existsSync(path.join(unity, 'Tests', n))) };
  if (gitOk) {
    const st = run('git', ['-C', repo, 'status', '--porcelain=v1', '--untracked-files=all', '--', UNITY_REL, 'scripts/cc001/w17']);
    fp.gitStatus = st.status === 0 ? st.stdout : `git status failed: ${st.stderr}`;
  }
  return fp;
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIR_NAMES.has(entry.name)) continue;
    const s = path.join(src, entry.name), d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyTree(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

function prepareCopy(repo, work, red) {
  const unitySrc = path.join(repo, UNITY_REL);
  const unityDst = path.join(work, UNITY_REL);
  for (const rel of COPY_DIRS) {
    const s = path.join(unitySrc, rel);
    if (!fs.existsSync(s)) throw Object.assign(new Error(`missing input directory ${UNITY_REL}/${rel}`), { gateExit: 2 });
    copyTree(s, path.join(unityDst, rel));
  }
  for (const rel of COPY_FILES) {
    const s = path.join(unitySrc, rel);
    if (!fs.existsSync(s)) throw Object.assign(new Error(`missing input file ${UNITY_REL}/${rel}`), { gateExit: 2 });
    fs.mkdirSync(path.dirname(path.join(unityDst, rel)), { recursive: true });
    fs.copyFileSync(s, path.join(unityDst, rel));
  }
  const ref = path.join(repo, REFERENCE_REL);
  if (fs.existsSync(ref)) {
    fs.mkdirSync(path.dirname(path.join(work, REFERENCE_REL)), { recursive: true });
    fs.copyFileSync(ref, path.join(work, REFERENCE_REL));
  }
  let redPatched = false;
  if (red) {
    const program = path.join(unityDst, 'Tests/Program.cs');
    const text = fs.readFileSync(program, 'utf8');
    if (text.split(RED_ANCHOR).length !== 2) throw Object.assign(new Error(`red probe anchor not found exactly once: ${RED_ANCHOR}`), { gateExit: 3 });
    fs.writeFileSync(program, text.replace(RED_ANCHOR, RED_REPLACEMENT));
    redPatched = true;
  }
  return { unityDst, redPatched };
}

function parseManagedOutput(stdout) {
  const lines = stdout.split(/\r?\n/);
  const tests = [];
  let result = null;
  for (const line of lines) {
    let m;
    if ((m = /^PASS (.+)$/.exec(line))) tests.push({ name: m[1], pass: true });
    else if ((m = /^FAIL (.+?)(?:: (.*))?$/.exec(line))) tests.push({ name: m[1], pass: false, error: m[2] || '' });
    else if ((m = /^RESULT: (\d+) passed, (\d+) failed\s*$/.exec(line))) result = { passed: Number(m[1]), failed: Number(m[2]) };
  }
  return { tests, result };
}

// Compiler diagnostics (MSBuild format) and missing-runtime messages, so a
// broken build is reported as RED / BLOCKED_OPERATOR instead of a parse error.
function buildDiagnostics(text) {
  const errors = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /([^\\/(]+\.cs)\((\d+),(\d+)\): error (CS\d+): ([^\[]*)/.exec(line);
    if (m && !errors.some(e => e.file === m[1] && e.line === Number(m[2]) && e.code === m[4]))
      errors.push({ file: m[1], line: Number(m[2]), column: Number(m[3]), code: m[4], message: m[5].trim() });
  }
  const missingRuntime = /You must install or update \.NET|framework 'Microsoft\.NETCore\.App', version '[0-9.]+' \(x64\) was not found|The framework 'Microsoft\.NETCore\.App'/i.test(text);
  return { errors, missingRuntime };
}

function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

function main(argv) {
  let opts;
  try { opts = parseArgs(argv); } catch (e) { console.error(`ERROR: ${e.message}\n${usage()}`); return 2; }
  if (opts.help) { console.log(usage()); return 0; }

  const repo = path.resolve(opts.repo || path.join(__dirname, '..', '..', '..'));
  const out = path.resolve(opts.out || path.join(os.tmpdir(), 'cc001-w17-gate', stamp()));
  const relOut = path.relative(repo, out);
  if (!relOut.startsWith('..') && !path.isAbsolute(relOut)) {
    console.error(`ERROR: --out must be outside the repository (${out})`);
    return 2;
  }
  fs.mkdirSync(out, { recursive: true });
  const summary = {
    gate: 'CC-001 W17-01 managed C# + data gate', schema: 1,
    startedUtc: new Date().toISOString(), mode: opts.red ? 'RED_PROBE' : 'NORMAL',
    host: { platform: process.platform, arch: process.arch, node: process.version },
    repo: { path: repo }, runs: [], verifyData: null, status: 'UNKNOWN', reasons: []
  };
  const finish = (code, status, reason) => {
    summary.status = status; if (reason) summary.reasons.push(reason);
    summary.exitCode = code; summary.finishedUtc = new Date().toISOString();
    fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
    console.log(`GATE ${status} exit=${code}${summary.reasons.length ? ' — ' + summary.reasons.join('; ') : ''}`);
    console.log(`summary: ${path.join(out, 'summary.json')}`);
    return code;
  };

  if (!fs.existsSync(path.join(repo, UNITY_REL, 'Tests', 'CoreClash.Tests.csproj')))
    return finish(2, 'BLOCKED_OPERATOR', `not a Core Clash checkout: ${repo}`);

  const git = run('git', ['-C', repo, 'rev-parse', 'HEAD']);
  const gitOk = git.status === 0;
  summary.repo.head = gitOk ? git.stdout.trim() : null;
  if (!gitOk) summary.reasons.push('git unavailable; source fingerprint uses Evidence hash only');
  if (opts.expectSha) {
    summary.repo.expectedSha = opts.expectSha;
    if (!gitOk || !summary.repo.head.startsWith(opts.expectSha))
      return finish(2, 'BLOCKED_OPERATOR', `HEAD ${summary.repo.head} does not match --expect-sha ${opts.expectSha}`);
  }

  const dotnet = opts.dotnet || process.env.CC001_GATE_DOTNET || 'dotnet';
  const ver = run(dotnet, ['--version']);
  if (ver.status !== 0) {
    return finish(2, 'BLOCKED_OPERATOR',
      `dotnet SDK not runnable (${ver.error || ver.stderr.trim() || 'exit ' + ver.status}); install .NET SDK 9 (winget install Microsoft.DotNet.SDK.9) and re-run`);
  }
  summary.host.dotnet = ver.stdout.trim();
  summary.host.rollForward = !!opts.rollForward;
  const runtimes = run(dotnet, ['--list-runtimes']);
  summary.host.runtimes = runtimes.status === 0 ? runtimes.stdout.split(/\r?\n/).filter(l => /^Microsoft\.NETCore\.App /.test(l)).map(l => l.split(' ').slice(0, 2).join(' ')) : [];
  summary.host.net9RuntimePresent = summary.host.runtimes.some(r => /^Microsoft\.NETCore\.App 9\./.test(r));

  const before = sourceFingerprint(repo, gitOk);
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc001-w17-work-'));
  summary.workRoot = tmpRoot;
  let first = null;
  try {
    for (let i = 0; i < opts.runs; i++) {
      const work = path.join(tmpRoot, `run-${i + 1}`);
      let copy;
      try { copy = prepareCopy(repo, work, opts.red); }
      catch (e) { return finish(e.gateExit || 3, e.gateExit === 2 ? 'BLOCKED_OPERATOR' : 'GATE_ERROR', e.message); }
      const project = path.join(copy.unityDst, 'Tests', 'CoreClash.Tests.csproj');
      const env = { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' };
      if (opts.rollForward) env.DOTNET_ROLL_FORWARD = 'Major';
      const r = run(dotnet, ['run', '--project', project, '-c', opts.configuration, '--', copy.unityDst],
        { cwd: copy.unityDst, env });
      const log = path.join(out, `managed-run-${i + 1}.log`);
      fs.writeFileSync(log, `$ dotnet run --project <copy>/Tests/CoreClash.Tests.csproj -c ${opts.configuration} -- <copy>\n--- stdout ---\n${r.stdout}\n--- stderr ---\n${r.stderr}\n--- exit ${r.status} signal ${r.signal} error ${r.error} ---\n`);
      const parsed = parseManagedOutput(r.stdout);
      const entry = {
        run: i + 1, exitCode: r.status, signal: r.signal, durationMs: r.ms, log: path.basename(log),
        redPatched: copy.redPatched, result: parsed.result, parsedTests: parsed.tests.length,
        failures: parsed.tests.filter(t => !t.pass).map(t => ({ name: t.name, error: t.error })),
        namesSha256: crypto.createHash('sha256').update(parsed.tests.map(t => t.name).join('\n')).digest('hex'),
        stderrTail: r.stderr.split(/\r?\n/).filter(Boolean).slice(-5),
        diagnostics: buildDiagnostics(r.stdout + '\n' + r.stderr)
      };
      summary.runs.push(entry);
      if (i === 0) {
        first = entry;
        const v = run(process.execPath, [path.join(copy.unityDst, 'Tools', 'verify-data.cjs')], { cwd: copy.unityDst });
        summary.verifyData = { exitCode: v.status, stdout: v.stdout.trim(), stderr: v.stderr.trim(), durationMs: v.ms };
      }
    }
  } finally {
    if (!opts.keep) fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  const after = sourceFingerprint(repo, gitOk);
  summary.source = { before, after, unchanged: JSON.stringify(before) === JSON.stringify(after) };
  if (!summary.source.unchanged) return finish(3, 'GATE_ERROR', 'source worktree or Evidence/ changed during the gate');

  const runtime = summary.runs.find(r => !r.result && r.diagnostics.missingRuntime);
  if (runtime) return finish(2, 'BLOCKED_OPERATOR', `run ${runtime.run}: .NET 9 runtime not available for the net9.0 test project; install it (winget install Microsoft.DotNet.Runtime.9) or re-run with --roll-forward`);
  const broken = summary.runs.find(r => !r.result && r.exitCode !== 0 && r.diagnostics.errors.length > 0);
  if (broken) {
    summary.build = { failed: true, errors: broken.diagnostics.errors };
    if (opts.red) return finish(3, 'GATE_ERROR', 'RED probe is meaningless: the managed project does not compile');
    return finish(1, 'RED', `managed project does not compile: ${broken.diagnostics.errors.map(e => `${e.file}(${e.line}) ${e.code}`).join(', ')}`);
  }
  const unparsed = summary.runs.find(r => !r.result || r.parsedTests !== r.result.passed + r.result.failed);
  if (unparsed) return finish(3, 'GATE_ERROR', `run ${unparsed.run}: missing RESULT line or PASS/FAIL count mismatch (exit ${unparsed.exitCode})`);
  const drift = summary.runs.find(r => r.result.passed !== first.result.passed || r.result.failed !== first.result.failed || r.namesSha256 !== first.namesSha256);
  if (drift) return finish(3, 'GATE_ERROR', `nondeterministic managed results between run 1 and run ${drift.run}`);
  summary.managed = { passed: first.result.passed, failed: first.result.failed, runs: summary.runs.length, exitCodes: summary.runs.map(r => r.exitCode) };

  if (opts.red) {
    const hit = first.failures.some(f => f.name === RED_TEST_NAME);
    summary.redProbe = { anchor: RED_ANCHOR, replacement: RED_REPLACEMENT, expectedFailingTest: RED_TEST_NAME, detected: hit && first.exitCode !== 0 };
    if (!summary.redProbe.detected) return finish(3, 'GATE_ERROR', 'RED probe was NOT detected: the managed suite did not fail as expected');
    return finish(1, 'RED_CONFIRMED', `deliberately broken assertion made dotnet exit ${first.exitCode}`);
  }
  const managedOk = summary.runs.every(r => r.exitCode === 0) && first.result.failed === 0 && first.result.passed > 0;
  const dataOk = summary.verifyData && summary.verifyData.exitCode === 0;
  if (!managedOk) summary.reasons.push(`managed suite failed: ${first.result.failed} failed, exits ${summary.managed.exitCodes.join(',')}`);
  if (!dataOk) summary.reasons.push(`verify-data failed: exit ${summary.verifyData && summary.verifyData.exitCode}`);
  return managedOk && dataOk ? finish(0, 'GREEN') : finish(1, 'RED');
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { main, parseArgs, parseManagedOutput, buildDiagnostics, prepareCopy, treeHash, RED_ANCHOR, RED_TEST_NAME, UNITY_REL };
