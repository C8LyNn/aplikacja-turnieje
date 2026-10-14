/** Pack 17 fail-closed evidence and test-database preflight. Pure: no IO or DB writes. */
import { URL } from 'node:url';

/** Require complete Node TAP summaries, not merely a successful process exit code.
 * Multiple Node test processes in one pnpm script must each produce a summary.
 */
export function assertCompleteTap(output, expectedSummaries = 1) {
  if (!Number.isSafeInteger(expectedSummaries) || expectedSummaries < 1) {
    throw new Error('Invalid expected TAP summary count');
  }
  const cleaned = String(output).replace(/\x1b\[[0-9;]*m/g, '').replace(/\r/g, '');
  const lines = cleaned.split('\n');
  const summaries = [];
  let current = null;
  let versions = 0;
  for (const line of lines) {
    if (/^TAP version 13\s*$/.test(line)) versions++;
    const match = /^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$/.exec(line);
    if (!match) continue;
    const [, kind, raw] = match;
    if (kind === 'tests') {
      current = { tests: Number(raw) };
      summaries.push(current);
    } else {
      if (!current || Object.hasOwn(current, kind)) throw new Error('Malformed or duplicate TAP summary: ' + kind);
      current[kind] = Number(raw);
    }
  }
  if (summaries.length !== expectedSummaries || versions < expectedSummaries) {
    throw new Error(`Incomplete TAP evidence: ${summaries.length}/${expectedSummaries} summaries, ${versions} TAP headers`);
  }
  let total = 0;
  for (const [index, s] of summaries.entries()) {
    if (!['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].every(k => Number.isSafeInteger(s[k]))) {
      throw new Error(`TAP summary ${index + 1} lacks mandatory counters`);
    }
    if (s.tests < 1 || s.pass !== s.tests || s.fail !== 0 || s.cancelled !== 0 || s.skipped !== 0 || s.todo !== 0) {
      throw new Error(`TAP summary ${index + 1} is not a complete PASS: ${JSON.stringify(s)}`);
    }
    total += s.tests;
  }
  return { summaries: summaries.length, tests: total };
}

/** Validate environment before any destructive test helper executes. Does not prove
 * physical DB isolation: A50 must provision/verify a disposable PostgreSQL 16 instance.
 */
export function assertSafeTestDatabaseEnv(env) {
  if (env.NODE_ENV !== 'test') throw new Error('BLOCKED: NODE_ENV=test is mandatory for Pack17 database gates');
  if (env.TEST_DATABASE_RESET !== 'DROP_TM_TEST_SCHEMA') throw new Error('BLOCKED: explicit test-schema reset consent required');
  if (!env.TEST_DATABASE_URL) throw new Error('BLOCKED: TEST_DATABASE_URL is required');
  let parsed;
  try { parsed = new URL(env.TEST_DATABASE_URL); }
  catch { throw new Error('BLOCKED: invalid TEST_DATABASE_URL'); }
  let dbName;
  try { dbName = decodeURIComponent(parsed.pathname.replace(/^\//, '')); }
  catch { throw new Error('BLOCKED: malformed test database name'); }
  const schema = env.TEST_DATABASE_SCHEMA ?? 'tm_test_access';
  const target = `${parsed.hostname}/${dbName}`.toLowerCase();
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !dbName.toLowerCase().includes('test') || target.includes('prod') || !/^tm_test_[a-z0-9_]+$/.test(schema)) {
    throw new Error('BLOCKED: require a nonproduction PostgreSQL test database and isolated tm_test_* schema');
  }
  return { schema, databaseName: dbName }; // never return credentials or log URL
}
