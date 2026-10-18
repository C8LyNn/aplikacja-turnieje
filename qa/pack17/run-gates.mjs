#!/usr/bin/env node
/** Pack 17: explicit, fail-closed code/PG release gates. No deploy or prod migrations.
 * --static is a deliberately incomplete check and is NEVER release approval.
 * Always run from monorepo root; full DB execution needs approved isolated TEST PG16.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { assertCompleteTap, assertSafeTestDatabaseEnv } from './gate-contract.mjs';
import { firstFailureEvidence } from './failure-evidence.mjs';

const mode = process.argv[2];
if (process.argv.length !== 3 || !['--static', '--integration', '--full'].includes(mode)) {
  console.error('Usage: node qa/pack17/run-gates.mjs --static|--integration|--full (mode required)');
  process.exit(2);
}
if (!existsSync('pnpm-workspace.yaml') || !existsSync('artifacts/api-server/package.json')) {
  console.error('BLOCKED: invoke from tournament monorepo root');
  process.exit(2);
}

const required = {
  '--static': ['source contracts', 'gate fail-closed contracts'],
  '--integration': ['source contracts', 'gate fail-closed contracts', 'PostgreSQL atomic correction'],
  '--full': [
    'source contracts', 'gate fail-closed contracts', 'PostgreSQL atomic correction', 'workspace typecheck',
    'API unit tests', 'API integration tests', 'frontend tests',
    'API build', 'frontend build',
  ],
}[mode];
const completed = [];

class GateFailure extends Error {
  constructor(exitCode) {
    super('Pack17 gate failed');
    this.exitCode = Number.isSafeInteger(exitCode) && exitCode > 0 ? exitCode : 1;
  }
}

function run(name, cmd, args, { tapSummaries = 0 } = {}) {
  if (name !== required[completed.length]) {
    console.error('BLOCKED: omitted/out-of-order Pack17 gate: expected ' + required[completed.length] + ', got ' + name);
    throw new GateFailure(2);
  }
  console.log('\n>>> GATE ' + name);
  // Capture TAP from nested Node test processes. Inherited stdio loses skip counts.
  // A truncated output buffer is an error (fail closed), not a PASS.
  const result = spawnSync(cmd, args, {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32', env: process.env,
  });
  // In a large full-suite run GitHub Actions can truncate high-volume TAP
  // before the actual failing test. Keep raw child stdout/stderr in memory for
  // assertCompleteTap; emit only short redacted evidence to shared CI logs.
  const failed = Boolean(result.error || result.signal || result.status !== 0);
  if (failed) {
    const evidence = firstFailureEvidence(result.stdout, result.stderr);
    console.error('FIRST_FAILING_TAP: ' + (evidence.firstFailingTap ?? 'NOT_FOUND_IN_CAPTURED_OUTPUT'));
    if (evidence.firstDiagnostic) console.error('FIRST_TAP_DIAGNOSTIC: ' + evidence.firstDiagnostic);
    console.error('TAP_COUNTERS: ' + JSON.stringify(evidence.summary));
    console.error('CAPTURE_METADATA: ' + JSON.stringify({
      stdoutChars:evidence.stdoutChars,stderrChars:evidence.stderrChars,
      stderrKind:evidence.stderrKind,
    }));
    console.error('BLOCKED: ' + name + ' execution failed', result.error?.code ?? ('exit ' + result.status + '; signal ' + (result.signal ?? 'none')));
    // Do not call process.exit(): it can truncate buffered error output.
    // The outer catch sets exitCode, lets stderr drain, and stops later gates.
    throw new GateFailure(result.status || 1);
  }
  // Successful tests are summarized by assertCompleteTap below; dumping all
  // passing subtests would exhaust the shared workflow log budget.
  console.log('CAPTURED ' + name + ': stdout chars ' +
    String(result.stdout ?? '').length + ', stderr chars ' +
    String(result.stderr ?? '').length);
  if (tapSummaries) {
    try {
      const evidence = assertCompleteTap(result.stdout, tapSummaries);
      console.log('VERIFIED TAP: ' + evidence.tests + ' executed, ' + evidence.summaries + ' complete summary(s), no skips/todo');
    } catch (e) {
      console.error('BLOCKED: ' + name + ' lacks complete test evidence: ' + e.message);
      throw new GateFailure(1);
    }
  }
  completed.push(name);
  console.log('PASS ' + name);
}
function pnpm(name, args, config) { run(name, 'pnpm', args, config); }
function assertAllGatesCompleted() {
  if (completed.length !== required.length) {
    console.error('BLOCKED: only ' + completed.length + '/' + required.length + ' required Pack17 gates completed');
    throw new GateFailure(1);
  }
}

function main() {
run('source contracts', 'node', ['--test', '--test-reporter=tap', 'qa/pack17/source-contract.test.mjs'], { tapSummaries: 1 });
run('gate fail-closed contracts', 'node', ['--test', '--test-reporter=tap', 'qa/pack17/gate-contract.test.mjs'], { tapSummaries: 1 });
if (mode === '--static') {
  assertAllGatesCompleted();
  console.log('STATIC-ONLY PASS. No PostgreSQL, backend/frontend runtime or full release checks. RELEASE STOP.');
  return;
}
try { assertSafeTestDatabaseEnv(process.env); }
catch (e) { console.error(e.message); throw new GateFailure(2); }
// Integration tests use the existing isolated-schema reset helper and PostgreSQL 16.
pnpm('PostgreSQL atomic correction', ['--filter', '@workspace/api-server', 'exec', 'node', '--import', 'tsx', '--test', 'test/tournament-atomic-correction-postgresql.integration.test.ts'], { tapSummaries: 1 });
if (mode === '--integration') {
  assertAllGatesCompleted();
  console.log('TARGETED PG PASS. Workspace/build/browser gates NOT EXECUTED. RELEASE STOP.');
  return;
}
pnpm('workspace typecheck', ['run', 'typecheck']);
pnpm('API unit tests', ['--filter', '@workspace/api-server', 'run', 'test:unit'], { tapSummaries: 3 });
pnpm('API integration tests', ['--filter', '@workspace/api-server', 'run', 'test:integration'], { tapSummaries: 1 });
pnpm('frontend tests', ['--filter', '@workspace/tournament-manager', 'run', 'test'], { tapSummaries: 1 });
pnpm('API build', ['--filter', '@workspace/api-server', 'run', 'build']);
pnpm('frontend build', ['--filter', '@workspace/tournament-manager', 'run', 'build']);
assertAllGatesCompleted();
console.log('PACK17 CODE/PG GATES PASS. Manual browser QA, combined-PR validation and release approval still required.');

}
try {
  main();
} catch (error) {
  if (error instanceof GateFailure) {
    // Node drains buffered stderr/stdout naturally before process termination.
    // Unlike process.exit(), this preserves FIRST_FAILING_TAP evidence.
    process.exitCode = error.exitCode;
  } else {
    console.error('BLOCKED: unexpected Pack17 runner error; private diagnostics required');
    process.exitCode = 1;
  }
}
