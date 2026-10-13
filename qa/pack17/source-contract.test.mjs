/** Pack 17 non-destructive source contract tests.
 * Node built-ins only; does not connect to DB or require pnpm. Run in repo root.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read=(p)=>readFileSync(p,'utf8');
const app='artifacts/api-server/src/';
const atomic=read(app+'application/operations/tournament-atomic-correction.ts');
const revert=read(app+'application/matches/revert-match.ts');
const complete=read(app+'application/matches/complete-match.ts');
const route=read(app+'routes/tournament-atomic-correction.ts');
const root=read(app+'routes/index.ts');
const op=read('lib/db/src/schema/tournament-correction-operations.ts');
const mig30=read('lib/db/migrations/0030_controlled_correction_operations.sql');
const mig31=read('lib/db/migrations/0031_atomic_correction_receipts.sql');

test('atomic correction delegates both domain mutations the SAME transaction',()=>{
  assert.match(atomic,/return db\.transaction\(async tx =>/);
  assert.match(atomic,/revertMatch\([\s\S]*?\},\{\},tx\)/);
  assert.match(atomic,/completeMatch\([\s\S]*?\},\{\},tx\)/);
});
test('single-domain mutation entry points also accept an injected transaction',()=>{
  assert.match(revert,/transaction\?\s*:\s*Parameters<Parameters<typeof db\.transaction>/);
  assert.match(revert,/return transaction \? perform\(transaction\) : db\.transaction\(perform\)/);
  assert.match(complete,/transaction\?\s*:\s*MatchTransaction/);
  assert.match(complete,/return transaction \? perform\(transaction\) : db\.transaction\(perform\)/);
});
test('optimistic guard and approval receipt are checked inside revert transaction',()=>{
  for(const needle of ['expectedMatchRevision','expectedStageVersionVector','correctionOperationId', 'requireActiveRoundRobin'])
    assert.ok(revert.includes(needle),needle);
  assert.match(revert,/\.update\(tournamentCorrectionOperationsTable\)/);
});
test('auditing requires a unique active completion with matching original match',()=>{
  assert.match(atomic,/completions\.length !== 1/);
  assert.match(atomic,/JSON\.parse\(completion\.undoPayload/);
  assert.match(atomic,/undo as \{matchId\?:unknown\}\)\.matchId !== completed\.id/);
});
test('atomic operation changes to corrected only after new result is committed inside transaction',()=>{
  const ixComplete=atomic.indexOf('const completed = await completeMatch(');
  const ixReceipt=atomic.indexOf('status:"corrected",completedAt:');
  assert.ok(ixComplete>0 && ixReceipt>ixComplete);
  assert.match(atomic,/eq\(tournamentCorrectionOperationsTable\.status,"reverted_requires_resubmission"\)/);
});
test('HTTP endpoint is organizer-protected and uses idempotent receipt recovery',()=>{
  assert.match(route,/requireOrganizer\(req,res,tournamentId\)/);
  assert.match(route,/operation\.status==="corrected"/);
  assert.match(route,/const finished=await find\(\)/);
  assert.match(route,/Cache-Control","no-store"/);
});
test('mounted atomic router is reachable',()=>{
  assert.match(root,/import atomicCorrectionRouter from "\.\/tournament-atomic-correction"/);
  assert.match(root,/router\.use\(atomicCorrectionRouter\)/);
});
test('approval records persist correction identifiers and receipts',()=>{
  for(const name of ['revertActionId','revertedMatchRevision','completionActionId','correctedMatchRevision'])
    assert.ok(op.includes(name), name);
});
test('migration 0030 creates journal scoped to tournament and match',()=>{
  assert.match(mig30,/CREATE TABLE IF NOT EXISTS public\.tournament_correction_operations/);
  assert.match(mig30,/tournament_id integer NOT NULL REFERENCES public\.tournaments\(id\)/);
  assert.match(mig30,/match_id integer NOT NULL REFERENCES public\.matches\(id\)/);
});
test('migration 0031 adds corrected state AND both receipt fields',()=>{
  assert.match(mig31,/completion_action_id integer/);
  assert.match(mig31,/corrected_match_revision integer/);
  assert.match(mig31,/CHECK\(status IN \('approved','reverted_requires_resubmission','corrected'\)\)/);
});
test('PostgreSQL migration files do not drop tournaments or matches',()=>{
  for(const sql of [mig30,mig31]){
    assert.doesNotMatch(sql,/DROP\s+TABLE/i);
    assert.doesNotMatch(sql,/TRUNCATE\s+/i);
    assert.doesNotMatch(sql,/DELETE\s+FROM\s+(?:public\.)?matches/i);
  }
});
test('Pack 17 real-db tests are present and require isolated test database config',()=>{
  const integration=read('artifacts/api-server/test/tournament-atomic-correction-postgresql.integration.test.ts');
  assert.match(integration,/getSafeTestDatabaseConfig\(\)/);
  assert.match(integration,/resetTestSchema\(/);
  assert.match(integration,/dropTestSchema\(/);
  assert.match(integration,/0030_controlled_correction_operations\.sql/);
  assert.match(integration,/0031_atomic_correction_receipts\.sql/);
  assert.match(integration,/afterRevert:/);
  assert.match(integration,/afterComplete:/);
});
