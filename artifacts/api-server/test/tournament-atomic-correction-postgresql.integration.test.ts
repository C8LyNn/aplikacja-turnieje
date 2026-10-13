/** Pack 17 — real PostgreSQL tests for Pack 15/16. NO MOCK DB.
 * Requires dedicated TEST_DATABASE_URL containing 'test' and explicit schema-reset consent.
 * Uses isolated test schema; 0030 and 0031 are applied inside that schema after existing resetTestSchema (0001–0028).
 * Not intended to run against production; see QA_REPORT and run-gates.mjs.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { and, asc, desc, eq } from "drizzle-orm";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  renderSeriesV1MigrationForTestSchema,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

type Database = typeof import("@workspace/db");
type Atomic = typeof import("../src/application/operations/tournament-atomic-correction");
type Complete = typeof import("../src/application/matches/complete-match");
type ExpressApp = typeof import("../src/app").default;
let database: Database;
let atomic: Atomic;
let completeMatch: Complete["completeMatch"];
let app: ExpressApp;
let config: TestDatabaseConfig;
let ready = false;
let organizerToken: typeof import("../src/auth").signVersionedOrganizerToken;
let vector: typeof import("../src/application/operations/tournament-preview-coherence").stageMatchVersionVector;

const urls = [
  new URL("../../../lib/db/migrations/0030_controlled_correction_operations.sql", import.meta.url),
  new URL("../../../lib/db/migrations/0031_atomic_correction_receipts.sql", import.meta.url),
];

async function applyCorrectionMigrations(): Promise<void> {
  for (const url of urls) {
    let ddl = renderSeriesV1MigrationForTestSchema(await readFile(url, "utf8"), config.schema);
    // Existing integration migration runner executes in a test schema already.
    // Remove standalone boundaries from 0031 to keep execution handling explicit.
    ddl = ddl.replace(/^\s*(?:BEGIN|COMMIT);\s*$/gm, "");
    await database.pool.query(ddl);
  }
  const { rows } = await database.pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = 'tournament_correction_operations'`,
    [config.schema],
  );
  const columns = new Set(rows.map(row => String(row.column_name)));
  for (const column of ["completion_action_id", "corrected_match_revision", "expected_stage_version_vector"]) {
    assert.ok(columns.has(column), `Migration column missing: ${column}`);
  }
}

before(async () => {
  // getSafeTestDatabaseConfig itself refuses non-test URLs or absent reset confirmation.
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `pack17-test-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  ready = true;
  await applyCorrectionMigrations();
  atomic = await import("../src/application/operations/tournament-atomic-correction");
  completeMatch = (await import("../src/application/matches/complete-match")).completeMatch;
  vector = (await import("../src/application/operations/tournament-preview-coherence")).stageMatchVersionVector;
  organizerToken = (await import("../src/auth")).signVersionedOrganizerToken;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (!database || !config) return;
  try { if (ready) await dropTestSchema(database.pool as unknown as TestPool, config.schema); }
  finally { await database.pool.end(); }
});

const passwordHash = "pack17-test-organizer-hash";
interface Fixture { tournamentId: number; matchId: number; otherMatchId: number; operationId: string; headers: Record<string,string>; }
async function fixture(proposed: [number, number] = [1, 2]): Promise<Fixture> {
  const db = database.db;
  const [tournament] = await db.insert(database.tournamentsTable).values({
    name: `Pack17 atomic ${randomUUID()}`,
    format: "round_robin", status: "active", visibility: "public_online",
    organizerPasswordHash: passwordHash, defaultBestOf: 3, currentRound: 1, totalRounds: 1,
  }).returning();
  const players = await db.insert(database.playersTable).values(
    [1,2,3,4].map(seed => ({ tournamentId: tournament.id, name: `P${seed}-${randomUUID()}`, seed })),
  ).returning();
  // Keep a third match pending: the conflict test completes match 2, but the stage must remain active.
  const matches = await db.insert(database.matchesTable).values([
    { tournamentId: tournament.id, round: 1, matchNumber: 1, player1Id: players[0].id, player2Id: players[1].id, bestOf: 3, status: "pending" as const },
    { tournamentId: tournament.id, round: 1, matchNumber: 2, player1Id: players[2].id, player2Id: players[3].id, bestOf: 3, status: "pending" as const },
    { tournamentId: tournament.id, round: 1, matchNumber: 3, player1Id: players[0].id, player2Id: players[2].id, bestOf: 3, status: "pending" as const },
  ]).returning();
  const matchId = matches[0].id;
  await completeMatch({matchId, expectedRevision: matches[0].revision, resultType:"played",score1:2,score2:1,actor:{type:"organizer"}});
  const [match] = await db.select().from(database.matchesTable).where(eq(database.matchesTable.id, matchId));
  const stageMatches = await db.select().from(database.matchesTable).where(eq(database.matchesTable.stageId,match.stageId));
  const [action] = await db.select().from(database.actionLogTable).where(and(
    eq(database.actionLogTable.matchId,matchId),
    eq(database.actionLogTable.actionType,"match_result_submitted"),
    eq(database.actionLogTable.isUndone,false),
  )).orderBy(desc(database.actionLogTable.id));
  assert.ok(action);
  const operationId = randomUUID();
  await db.insert(database.tournamentCorrectionOperationsTable).values({
    id: operationId, tournamentId:tournament.id, matchId,
    expectedRevision:match.revision, expectedCompletionActionId:action.id,
    expectedStageVersionVector:vector(stageMatches,match.stageId),
    proposedScore1:proposed[0], proposedScore2:proposed[1],
    requestFingerprint:"pack17-fixture-"+operationId,
    approvedBy:"organizer",status:"approved",expiresAt:new Date(Date.now()+600_000),
  });
  return {tournamentId:tournament.id,matchId,otherMatchId:matches[1].id,operationId,
    headers:{"x-organizer-token":organizerToken(tournament.id,passwordHash)}};
}

async function getOperation(f:Fixture) {
  const [op] = await database.db.select().from(database.tournamentCorrectionOperationsTable)
    .where(eq(database.tournamentCorrectionOperationsTable.id,f.operationId));
  assert.ok(op);return op;
}
async function snapshot(f:Fixture): Promise<string> {
  const pool=database.pool;
  const [match,hist,actions,journal] = await Promise.all([
    pool.query("SELECT id,revision,status,result_type,score1,score2,winner_id,completed_at FROM matches WHERE id=$1",[f.matchId]),
    pool.query("SELECT match_id,revision,result_type,score1,score2,winner_id FROM result_history WHERE match_id=$1 ORDER BY revision",[f.matchId]),
    pool.query("SELECT id,action_type,is_undone,undo_payload FROM action_log WHERE match_id=$1 ORDER BY id",[f.matchId]),
    pool.query("SELECT id,status,revert_action_id,reverted_match_revision,completion_action_id,corrected_match_revision,completed_at FROM tournament_correction_operations WHERE id=$1",[f.operationId]),
  ]);
  return JSON.stringify([match.rows,hist.rows,actions.rows,journal.rows]);
}
const input = async(f:Fixture) => ({operation:await getOperation(f),tournamentId:f.tournamentId,actor:{type:"organizer"} as const});
const executeUrl = (f:Fixture) => `/api/tournaments/${f.tournamentId}/operations/correction-intents/${f.operationId}/execute-atomic`;

test("PG: atomic correction commits both result history entries and one durable receipt", async () => {
  const f=await fixture();
  const r=await atomic.executeAtomicRoundRobinCorrection(await input(f));
  assert.equal(r.operationId,f.operationId);
  const op=await getOperation(f);
  assert.equal(op.status,"corrected");
  assert.equal(op.completionActionId,r.completedActionId);
  const result=await database.pool.query("SELECT score1,score2,status FROM matches WHERE id=$1",[f.matchId]);
  assert.deepEqual([result.rows[0].score1,result.rows[0].score2,result.rows[0].status],[1,2,"completed"]);
  const {rows:history}=await database.pool.query("SELECT revision FROM result_history WHERE match_id=$1 ORDER BY revision",[f.matchId]);
  assert.equal(history.length,2);
  const {rows:actions}=await database.pool.query("SELECT action_type,is_undone FROM action_log WHERE match_id=$1 ORDER BY id",[f.matchId]);
  assert.equal(actions.filter(a=>a.action_type==="match_result_submitted"&&!a.is_undone).length,1);
  assert.equal(actions.filter(a=>a.action_type==="match_result_submitted"&&a.is_undone).length,1);
  assert.equal(actions.filter(a=>a.action_type==="match_result_reverted").length,1);
  // Lost-response recovery does not execute the operation again.
  const recovered=await request(app).post(executeUrl(f)).set(f.headers).send({});
  assert.equal(recovered.status,200);
  assert.equal(recovered.body.status,"corrected");
  assert.equal(recovered.body.completionActionId,r.completedActionId);
  assert.equal((await database.pool.query("SELECT COUNT(*)::int AS count FROM result_history WHERE match_id=$1",[f.matchId])).rows[0].count,2);
});

test("PG rollback: fault after revert preserves original result, history, audit and approval", async () => {
  const f=await fixture(), beforeState=await snapshot(f);
  await assert.rejects(atomic.executeAtomicRoundRobinCorrection(await input(f),{
    afterRevert:()=>{throw new Error("PACK17_INJECT_AFTER_REVERT");},
  }),/PACK17_INJECT_AFTER_REVERT/);
  assert.equal(await snapshot(f),beforeState);
  assert.equal((await getOperation(f)).status,"approved");
  // Approval remains usable after a fully rolled-back attempt.
  const result=await atomic.executeAtomicRoundRobinCorrection(await input(f));
  assert.equal(result.operationId,f.operationId);
});

test("PG rollback: fault after complete undoes both operations and receipt", async () => {
  const f=await fixture(), beforeState=await snapshot(f);
  await assert.rejects(atomic.executeAtomicRoundRobinCorrection(await input(f),{
    afterComplete:()=>{throw new Error("PACK17_INJECT_AFTER_COMPLETE");},
  }),/PACK17_INJECT_AFTER_COMPLETE/);
  assert.equal(await snapshot(f),beforeState);
});

test("PG conflict: change to unrelated match invalidates stage version vector", async () => {
  const f=await fixture();
  const [other]=await database.db.select().from(database.matchesTable).where(eq(database.matchesTable.id,f.otherMatchId));
  await completeMatch({matchId:f.otherMatchId,expectedRevision:other.revision,resultType:"played",score1:2,score2:0,actor:{type:"organizer"}});
  const [stageAfterOtherResult] = await database.db.select({ status: database.tournamentStagesTable.status })
    .from(database.tournamentStagesTable).where(eq(database.tournamentStagesTable.id, other.stageId));
  assert.equal(stageAfterOtherResult?.status, "active", "The fixture must isolate a version conflict, not stage completion");
  const [sourceMatch] = await database.db.select().from(database.matchesTable)
    .where(eq(database.matchesTable.id, f.matchId));
  const latestStageMatches = await database.db.select().from(database.matchesTable)
    .where(eq(database.matchesTable.stageId, sourceMatch.stageId));
  const savedApproval = await getOperation(f);
  assert.equal(sourceMatch.revision, savedApproval.expectedRevision,
    "The original match must remain unchanged for this conflict scenario");
  assert.notEqual(vector(latestStageMatches, sourceMatch.stageId), savedApproval.expectedStageVersionVector,
    "Another match must invalidate the approved stage version vector");
  const beforeState=await snapshot(f);
  await assert.rejects(atomic.executeAtomicRoundRobinCorrection(await input(f)), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.ok("code" in error, "Expected typed domain error, not just a message");
    assert.equal(error.code, "CONCURRENT_MODIFICATION");
    return true;
  });
  assert.equal(await snapshot(f),beforeState);
});

test("PG invalid new score cannot cause partial writes", async () => {
  const f=await fixture([1,1]), beforeState=await snapshot(f);
  await assert.rejects(atomic.executeAtomicRoundRobinCorrection(await input(f)),/CORRECTION_RESULT_INVALID/);
  assert.equal(await snapshot(f),beforeState);
});

test("HTTP: unauthenticated execution is denied without changing a result", async () => {
  const f=await fixture(), beforeState=await snapshot(f);
  const reply=await request(app).post(executeUrl(f)).send({});
  assert.equal(reply.status,403);
  assert.equal(await snapshot(f),beforeState);
});

test("HTTP: expired approval cannot execute", async () => {
  const f=await fixture();
  await database.db.update(database.tournamentCorrectionOperationsTable).set({expiresAt:new Date(Date.now()-60_000)})
    .where(eq(database.tournamentCorrectionOperationsTable.id,f.operationId));
  const beforeState=await snapshot(f);
  const reply=await request(app).post(executeUrl(f)).set(f.headers).send({});
  assert.equal(reply.status,409);
  assert.equal(reply.body.code,"CORRECTION_APPROVAL_EXPIRED");
  assert.equal(await snapshot(f),beforeState);
});

test("HTTP: parallel duplicate execution yields one correction and recoverable receipt", async () => {
  const f=await fixture();
  const responses=await Promise.all([
    request(app).post(executeUrl(f)).set(f.headers).send({}),
    request(app).post(executeUrl(f)).set(f.headers).send({}),
  ]);
  assert.ok(responses.every(r=>r.status===200),`Concurrent status codes ${responses.map(r=>r.status).join(",")}`);
  assert.equal(responses[0].body.completionActionId,responses[1].body.completionActionId);
  assert.equal((await getOperation(f)).status,"corrected");
  const {rows}=await database.pool.query("SELECT COUNT(*)::int AS count FROM result_history WHERE match_id=$1",[f.matchId]);
  assert.equal(rows[0].count,2);
});
