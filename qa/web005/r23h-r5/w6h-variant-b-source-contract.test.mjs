/**
 * WEB-005 / W6H Variant B — read-only DB-free source-contract regressions.
 * Deliberately does NOT run test fixtures, migrations, SQL or PostgreSQL.
 * This is a lexical guard, NOT proof that recursive PG dependencies are safe.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = name => readFileSync(new URL('../../../artifacts/api-server/test/' + name, import.meta.url), 'utf8');

test('B01: S1 CASCADE preflight follows all pg_depend catalog classes', () => {
  const code = source('pg16-test-ownership.ts');
  const cleanup = code.slice(code.indexOf('export async function dropRunSchema('),code.indexOf('export function sealedFixtureChildEnv('));
  assert.match(cleanup, /WITH RECURSIVE impacted\(classid, objid\)/);
  assert.match(cleanup, /FROM pg_depend d[\s\S]*?JOIN impacted i ON d\.refclassid=i\.classid AND d\.refobjid=i\.objid/);
  assert.match(cleanup, /CROSS JOIN LATERAL pg_identify_object\(i\.classid, i\.objid, 0\) obj/);
  assert.match(cleanup, /obj\.schema IS DISTINCT FROM \$1/);
  assert.doesNotMatch(cleanup, /JOIN pg_class dep ON d\.classid/);
  assert.ok(cleanup.indexOf('S1_FOREIGN_CASCADE_DEPENDENCY') < cleanup.indexOf('DROP SCHEMA'));
});

test('B02: an earlier confirmed catalog DROP cannot be rewritten as HOLD', () => {
  const code = source('replit-schema-catalog-reconciliation.integration.test.ts');
  assert.match(code,/const completedDropLabels = new Set/);
  const after = code.slice(code.indexOf('after(async () =>'));
  const drop=after.indexOf('await dropRunDatabase(adminPool, receipt, DATABASE_NAME_PATTERN)');
  const confirmed=after.indexOf('completedDropLabels.add(label)',drop);
  const catchBlock=after.indexOf('catch(error)',confirmed);
  assert.ok(drop>=0 && confirmed>drop && catchBlock>confirmed);
  assert.match(after,/later !== label && createdDatabaseReceipts\[later\] && !completedDropLabels\.has\(later\)/);
});

test('B03: any Drizzle preflight STOP blocks automatic FORCE DROP', () => {
  const code=source('drizzle-schema-diff.integration.test.ts');
  const fn=code.slice(code.indexOf('async function applyReplitPushToDisposableDatabase()'),code.indexOf('async function documentedProductionCleanupSql()'));
  const flag=fn.indexOf('drizzlePushOutcomeUncertain = true');
  const verify=fn.indexOf('const signed = requireVerifiedSourceContext()');
  const attest=fn.indexOf('attest("DRIZZLE_OUTPUT_EXPECTED"');
  const clear=fn.indexOf('drizzlePushOutcomeUncertain = false');
  assert.ok(flag>=0 && verify>flag && attest>verify && clear>attest);
  const after=code.slice(code.indexOf('after(async () =>'));
  assert.ok(after.indexOf('if (drizzlePushOutcomeUncertain)') < after.indexOf('await dropRunDatabase('));
  assert.match(after,/DRIZZLE_PUSH_UNCERTAIN_NO_FORCE_DROP/);
});

test('B02: terminal confirmed DB slot is immutable, even on redundant HOLD', () => {
  const code=source('pg16-test-ownership.ts');
  const hold=code.slice(code.indexOf('export function holdRunDatabaseSlot('),code.indexOf('function slotForDb('));
  assert.match(hold,/slotStates\.get\(slot\)\?\.state==="DROP_CONFIRMED"\) return/);
  const journal=code.slice(code.indexOf('function journal('),code.indexOf('const createdSchemaReceipts'));
  assert.match(journal,/S2_TERMINAL_DROP_CONFIRMED_IMMUTABLE/);
  assert.ok(journal.indexOf('S2_TERMINAL_DROP_CONFIRMED_IMMUTABLE') < journal.indexOf('persistSafetyEvent('));
});

test('B03: first successful Drizzle push still cannot unlock FORCE cleanup', () => {
  const code=source('drizzle-schema-diff.integration.test.ts');
  assert.match(code,/let drizzlePushOutcomeUncertain = true/);
  const fn=code.slice(code.indexOf('async function applyReplitPushToDisposableDatabase()'),code.indexOf('async function documentedProductionCleanupSql()'));
  assert.match(fn,/if \(ord === 2\) drizzlePushOutcomeUncertain = false/);
  assert.doesNotMatch(fn, /^\s*drizzlePushOutcomeUncertain = false;/m);
});
