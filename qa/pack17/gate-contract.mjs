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
  const headers = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^TAP version 13\s*$/.test(lines[i])) headers.push(i);
  }
  if (headers.length !== expectedSummaries) {
    throw new Error(`Incomplete TAP evidence: expected ${expectedSummaries} TAP headers, found ${headers.length}`);
  }
  // One independently complete TAP result per header; a stray header or a
  // summary belonging to another process must never count as a passing gate.
  const kinds = ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'];
  const linePattern = /^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\s*$/;
  if (lines.slice(0, headers[0]).some(line => linePattern.test(line))) {
    throw new Error('Malformed TAP evidence: summary before TAP header');
  }
  const summaries = [];
  let total = 0;
  for (let i = 0; i < headers.length; i++) {
    const from = headers[i] + 1;
    const to = headers[i + 1] ?? lines.length;
    const summary = {};
    for (const line of lines.slice(from, to)) {
      const match = linePattern.exec(line);
      if (!match) continue;
      const [, kind, raw] = match;
      if (Object.hasOwn(summary, kind)) throw new Error('Malformed or duplicate TAP summary: ' + kind);
      summary[kind] = Number(raw);
    }
    if (!kinds.every(k => Number.isSafeInteger(summary[k]))) {
      throw new Error(`TAP summary ${i + 1} lacks mandatory counters`);
    }
    if (summary.tests < 1 || summary.pass !== summary.tests || summary.fail !== 0 || summary.cancelled !== 0 || summary.skipped !== 0 || summary.todo !== 0) {
      throw new Error(`TAP summary ${i + 1} is not a complete PASS: ${JSON.stringify(summary)}`);
    }
    summaries.push(summary);
    total += summary.tests;
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
