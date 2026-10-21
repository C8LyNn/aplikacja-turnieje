/**
 * WEB-005 / W6H Variant B — read-only DB-free source-contract regressions.
 * Deliberately does NOT run test fixtures, migrations, SQL or PostgreSQL.
 * This is a lexical guard, NOT proof that recursive PG dependencies are safe.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = name => readFileSync(new URL('../../../artifacts/api-server/test/' + name, import.meta.url), 'utf8');

test('B01 W6H: automatic S1 CASCADE is prohibited until exhaustive proof', () => {
  const code=source('pg16-test-ownership.ts');
  const cleanup=code.slice(code.indexOf('export async function dropRunSchema('),code.indexOf('export function sealedFixtureChildEnv('));
  assert.match(cleanup,/S1_AUTOMATIC_CASCADE_DISABLED/);
  assert.match(cleanup,/journal\(ctx,receipt\.slot,"CLEANUP_HOLD",schema/);
  assert.doesNotMatch(cleanup,/DROP SCHEMA/);
  assert.doesNotMatch(cleanup,/DROP_ATTEMPTED/);
  assert.ok(cleanup.indexOf('S1_AUTOMATIC_CASCADE_DISABLED') > cleanup.indexOf('verifyPersistedEvent('));
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

test('B01 W6H: no executable owned-schema auto-delete remains', () => {
  const code=source('pg16-test-ownership.ts');
  const cleanup=code.slice(code.indexOf('export async function dropRunSchema('),code.indexOf('export function sealedFixtureChildEnv('));
  assert.match(cleanup,/requireOwnedSchema\(pool, schema, ctx\)/);
  assert.match(cleanup,/verifyPersistedEvent\(receipt\.evidence/);
  assert.doesNotMatch(cleanup,/pool\.query\(.*DROP SCHEMA/);
  assert.doesNotMatch(cleanup,/createdSchemaReceipts\.delete\(schema\)/);
});
