import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, renderSeriesV1MigrationForTestSchema, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

let app: Express;
let database: typeof import("@workspace/db");
let config: TestDatabaseConfig;
let initialized = false;
before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = randomUUID();
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  app = (await import("../src/app")).default;
});
after(async () => {
  if (initialized) await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  if (database) await database.pool.end();
});

async function fixture() {
  const created = await request(app).post("/api/tournaments").send({
    name: `Revision ${randomUUID()}`, organizerPassword: "revision-test-password",
    format: "round_robin", defaultBestOf: 1,
  }).expect(201);
  const id: number = created.body.id;
  const auth = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= 3; seed++) {
    await request(app).post(`/api/tournaments/${id}/players`).set(auth).send({ name: `P${seed}`, seed }).expect(201);
  }
  await request(app).post(`/api/tournaments/${id}/start`).set(auth).expect(200);
  const [match] = (await request(app).get(`/api/tournaments/${id}/matches`).expect(200)).body;
  const read = async () => (await request(app).get(`/api/matches/${match.id}`).expect(200)).body;
  const snapshot = async () => Promise.all([
    "matches", "stage_participants", "tournament_stages", "result_history", "action_log",
  ].map(async table => (await database.pool.query(`SELECT * FROM ${table} WHERE tournament_id=$1 ORDER BY id`, [id])).rows));
  return { id, auth, match, read, snapshot };
}

for (const resultType of ["played", "walkover", "no_contest"] as const) {
  test(`${resultType}: rejects stale revision without writes and accepts a fresh revision`, async () => {
    const f = await fixture();
    assert.equal(f.match.revision, 1);
    const body = resultType === "played" ? { resultType, score1: 1, score2: 0 }
      : resultType === "walkover" ? { resultType, winnerId: f.match.player1Id } : { resultType };
    await request(app).post(`/api/matches/${f.match.id}/swap-players`).set(f.auth).expect(200);
    const current = await f.read();
    assert.equal(current.revision, 2);
    const before = await f.snapshot();
    const stale = await request(app).post(`/api/matches/${f.match.id}/complete`).set(f.auth)
      .send({ ...body, expectedRevision: f.match.revision }).expect(409);
    assert.equal(stale.body.code, "CONCURRENT_MODIFICATION");
    assert.deepEqual(await f.snapshot(), before);
    const fresh = await request(app).post(`/api/matches/${f.match.id}/complete`).set(f.auth)
      .send({ ...body, expectedRevision: current.revision }).expect(200);
    assert.equal(fresh.body.revision, 3);
    assert.equal((await f.read()).revision, 3);
  });
}

test("ABA: two swaps restore the same pair but invalidate the original form", async () => {
  const f = await fixture();
  for (let i = 0; i < 2; i++) await request(app).post(`/api/matches/${f.match.id}/swap-players`).set(f.auth).expect(200);
  const now = await f.read();
  assert.equal(now.player1Id, f.match.player1Id);
  assert.equal(now.player2Id, f.match.player2Id);
  assert.equal(now.revision, f.match.revision + 2);
  const before = await f.snapshot();
  const stale = await request(app).post(`/api/matches/${f.match.id}/complete`).set(f.auth)
    .send({ resultType: "played", score1: 1, score2: 0, expectedRevision: f.match.revision }).expect(409);
  assert.equal(stale.body.code, "CONCURRENT_MODIFICATION");
  assert.deepEqual(await f.snapshot(), before);
});

test("two writers using the same revision persist exactly one result and one history entry", async () => {
  const f = await fixture();
  const responses = await Promise.all([0, 1].map(score1 => request(app).post(`/api/matches/${f.match.id}/complete`).set(f.auth)
    .send({ resultType: "played", score1, score2: 1 - score1, expectedRevision: f.match.revision })));
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  assert.equal(responses.find(response => response.status === 409)!.body.code, "CONCURRENT_MODIFICATION");
  const accepted = responses.find(response => response.status === 200)!.body;
  assert.equal((await f.read()).winnerId, accepted.winnerId);
  assert.equal((await f.read()).revision, f.match.revision + 1);
  const history = await database.pool.query("SELECT winner_id FROM result_history WHERE match_id=$1", [f.match.id]);
  assert.deepEqual(history.rows, [{ winner_id: accepted.winnerId }]);
  const actions = await database.pool.query("SELECT count(*)::int AS count FROM action_log WHERE match_id=$1 AND action_type='match_result_submitted'", [f.match.id]);
  assert.equal(actions.rows[0].count, 1);
});

test("complete requires a positive integer expectedRevision for every result type", async () => {
  const f = await fixture();
  const before = await f.snapshot();
  for (const body of [
    { resultType: "played", score1: 1, score2: 0 },
    { resultType: "walkover", winnerId: f.match.player1Id },
    { resultType: "no_contest" },
  ]) {
    for (const expectedRevision of [undefined, null, 0, -1, 1.5, "1"]) {
      await request(app).post(`/api/matches/${f.match.id}/complete`).set(f.auth)
        .send({ ...body, expectedRevision }).expect(422);
    }
  }
  assert.deepEqual(await f.snapshot(), before);
  const { completeMatch } = await import("../src/application/matches/complete-match");
  await assert.rejects(() => completeMatch({ matchId: f.match.id, resultType: "played", score1: 1, score2: 0 } as Parameters<typeof completeMatch>[0]),
    (error: unknown) => error instanceof Error && "code" in error && error.code === "INVALID_MATCH_REVISION");
  assert.deepEqual(await f.snapshot(), before);
});

test("PATCH cannot bypass dedicated match cancellation or restoration", async () => {
  const f = await fixture();
  const url = `/api/matches/${f.match.id}`;
  const baseline = await f.snapshot();

  const directCancel = await request(app).patch(url).set(f.auth)
    .send({ status: "cancelled" }).expect(422);
  assert.equal(directCancel.body.code, "MATCH_CANCELLATION_REQUIRES_DEDICATED_ACTION");
  assert.deepEqual(await f.snapshot(), baseline);

  await request(app).post(`${url}/cancel`).set(f.auth).send({ note: "operator cancelled" }).expect(200);
  assert.equal((await f.read()).status, "cancelled");
  const cancellationActions = await database.pool.query(
    "SELECT count(*)::int AS count FROM action_log WHERE match_id=$1 AND action_type='match_cancelled'",
    [f.match.id],
  );
  assert.equal(cancellationActions.rows[0].count, 1);

  const cancelledSnapshot = await f.snapshot();
  for (const status of ["pending", "in_progress", "postponed"] as const) {
    const blocked = await request(app).patch(url).set(f.auth).send({ status }).expect(422);
    assert.equal(blocked.body.code, "CANCELLED_MATCH_PATCH_FORBIDDEN");
    assert.deepEqual(await f.snapshot(), cancelledSnapshot);
  }

  await request(app).post(`${url}/restore-cancelled`).set(f.auth).expect(200);
  assert.equal((await f.read()).status, "pending");
});

test("BO, status, cancel, restore and revert invalidate forms; presentation fields do not", async () => {
  const f = await fixture();
  await request(app).patch(`/api/matches/${f.match.id}`).set(f.auth).send({ note: "court note" }).expect(200);
  await database.pool.query("UPDATE matches SET sort_order=99, scheduled_at=now(), revision=999 WHERE id=$1", [f.match.id]);
  assert.equal((await f.read()).revision, 1);
  await request(app).patch(`/api/matches/${f.match.id}`).set(f.auth).send({ bestOf: 3 }).expect(200);
  assert.equal((await f.read()).revision, 2);
  await request(app).patch(`/api/matches/${f.match.id}`).set(f.auth).send({ status: "in_progress" }).expect(200);
  assert.equal((await f.read()).revision, 3);
  await request(app).post(`/api/matches/${f.match.id}/cancel`).set(f.auth).send({}).expect(200);
  assert.equal((await f.read()).revision, 4);
  await request(app).post(`/api/matches/${f.match.id}/restore-cancelled`).set(f.auth).expect(200);
  assert.equal((await f.read()).revision, 5);
  await request(app).post(`/api/matches/${f.match.id}/complete`).set(f.auth)
    .send({ resultType: "played", score1: 2, score2: 0, expectedRevision: 5 }).expect(200);
  const completed = await f.read();
  await request(app).post(`/api/matches/${f.match.id}/revert`).set(f.auth).expect(200);
  const reopened = await f.read();
  assert.equal(reopened.revision, completed.revision + 1);
  const before = await f.snapshot();
  await request(app).post(`/api/matches/${f.match.id}/complete`).set(f.auth)
    .send({ resultType: "played", score1: 2, score2: 0, expectedRevision: 5 }).expect(409);
  assert.deepEqual(await f.snapshot(), before);
});

test("migration upgrades existing results without changing them and is safe to replay", async () => {
  const f = await fixture();
  await request(app).post(`/api/matches/${f.match.id}/complete`).set(f.auth)
    .send({ resultType: "played", score1: 1, score2: 0, expectedRevision: f.match.revision }).expect(200);
  // Reconstruct the pre-0028 catalog only inside this disposable test schema.
  await database.pool.query("DROP TRIGGER matches_increment_revision ON matches");
  await database.pool.query("ALTER TABLE matches DROP COLUMN revision");
  const readResults = async () => (await database.pool.query("SELECT id, player1_id, player2_id, best_of, status, score1, score2, winner_id, result_type, completed_at FROM matches ORDER BY id")).rows;
  const before = await readResults();
  const history = (await database.pool.query("SELECT * FROM result_history ORDER BY id")).rows;
  const sql = renderSeriesV1MigrationForTestSchema(await readFile(new URL("../../../lib/db/migrations/0028_match_revision.sql", import.meta.url), "utf8"), config.schema);
  await database.pool.query(sql);
  assert.deepEqual(await readResults(), before);
  assert.deepEqual((await database.pool.query("SELECT * FROM result_history ORDER BY id")).rows, history);
  assert.ok((await database.pool.query("SELECT revision FROM matches")).rows.every(row => row.revision === 1));
  await database.pool.query("UPDATE matches SET best_of=3 WHERE id=$1", [f.match.id]);
  await database.pool.query(sql);
  assert.equal((await f.read()).revision, 2, "replaying migration must not reset versions");
});


test("undo-last restores an unchanged cancellation and preserves the prior note", async () => {
  const f = await fixture();
  const url = `/api/matches/${f.match.id}`;
  await request(app).patch(url).set(f.auth).send({ note: "Original operator note" }).expect(200);
  await request(app).post(`${url}/cancel`).set(f.auth)
    .send({ note: "Cancellation only" }).expect(200);
  assert.equal((await f.read()).status, "cancelled");
  await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.auth).expect(200);
  const restored = await f.read();
  assert.equal(restored.status, "pending");
  assert.equal(restored.note, "Original operator note");
});

test("undo-last refuses stale cancellation without changing data or action history", async () => {
  const f = await fixture();
  await request(app).post(`/api/matches/${f.match.id}/cancel`).set(f.auth)
    .send({ note: "Cancelled" }).expect(200);
  // Simulate an out-of-band state change, as during drift or a legacy import.
  await database.pool.query("UPDATE matches SET status='in_progress' WHERE id=$1", [f.match.id]);
  const baseline = await f.snapshot();
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await f.snapshot(), baseline);
});

test("undo-last refuses stale restoration without overwriting a newer match status", async () => {
  const f = await fixture();
  const url = `/api/matches/${f.match.id}`;
  await request(app).post(`${url}/cancel`).set(f.auth).send({}).expect(200);
  await request(app).post(`${url}/restore-cancelled`).set(f.auth).expect(200);
  assert.equal((await f.read()).status, "pending");
  await database.pool.query("UPDATE matches SET status='postponed' WHERE id=$1", [f.match.id]);
  const baseline = await f.snapshot();
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await f.snapshot(), baseline);
});

async function undoSnapshot(tournamentId: number, matchId: number) {
  const [matchRows, tournamentRows, pickRows, actionRows] = await Promise.all([
    database.pool.query("SELECT * FROM matches WHERE id=$1", [matchId]),
    database.pool.query("SELECT * FROM tournaments WHERE id=$1", [tournamentId]),
    database.pool.query("SELECT * FROM match_game_picks WHERE match_id=$1 ORDER BY game_number", [matchId]),
    database.pool.query("SELECT * FROM action_log WHERE tournament_id=$1 ORDER BY id", [tournamentId]),
  ]);
  return {
    match: matchRows.rows,
    featuredMatchId: tournamentRows.rows[0]?.featured_match_id,
    picks: pickRows.rows,
    actions: actionRows.rows,
  };
}

test("undo-last safely restores BO while a pending match is unchanged", async () => {
  const f = await fixture();
  const url = `/api/matches/${f.match.id}`;
  await request(app).patch(url).set(f.auth).send({ bestOf: 3 }).expect(200);
  assert.equal((await f.read()).bestOf, 3);
  await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.auth).expect(200);
  assert.equal((await f.read()).bestOf, 1);
});

test("undo-last rejects a stale BO change without modifying the match or log", async () => {
  const f = await fixture();
  await request(app).patch(`/api/matches/${f.match.id}`).set(f.auth)
    .send({ bestOf: 3 }).expect(200);
  await database.pool.query("UPDATE matches SET best_of=5 WHERE id=$1", [f.match.id]);
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});

test("undo-last restores a featured match when no later change occurred", async () => {
  const f = await fixture();
  const url = `/api/tournaments/${f.id}`;
  await request(app).patch(url).set(f.auth)
    .send({ featuredMatchId: f.match.id }).expect(200);
  let state = await undoSnapshot(f.id, f.match.id);
  assert.equal(state.featuredMatchId, f.match.id);
  await request(app).post(`${url}/undo-last`).set(f.auth).expect(200);
  state = await undoSnapshot(f.id, f.match.id);
  assert.equal(state.featuredMatchId, null);
});

test("undo-last rejects a stale featured match pointer", async () => {
  const f = await fixture();
  const matches = (await request(app).get(`/api/tournaments/${f.id}/matches`).expect(200)).body;
  const otherMatchId = matches.find((m: { id: number }) => m.id !== f.match.id)?.id as number;
  assert.ok(otherMatchId, "fixture must have a second match");
  await request(app).patch(`/api/tournaments/${f.id}`).set(f.auth)
    .send({ featuredMatchId: f.match.id }).expect(200);
  await database.pool.query("UPDATE tournaments SET featured_match_id=$1 WHERE id=$2", [otherMatchId, f.id]);
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});

test("undo-last restores swapped players and unmodified Deadlock picks", async () => {
  const f = await fixture();
  await database.pool.query(
    "INSERT INTO match_game_picks (match_id, game_number, player1_hero_id, player2_hero_id, player1_side) VALUES ($1,1,'hero-a','hero-b','archmother')",
    [f.match.id],
  );
  const original = await undoSnapshot(f.id, f.match.id);
  await request(app).post(`/api/matches/${f.match.id}/swap-players`).set(f.auth).expect(200);
  const swapped = await undoSnapshot(f.id, f.match.id);
  assert.equal(swapped.match[0].player1_id, original.match[0].player2_id);
  assert.equal(swapped.picks[0].player1_hero_id, "hero-b");
  await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.auth).expect(200);
  const restored = await undoSnapshot(f.id, f.match.id);
  assert.equal(restored.match[0].player1_id, original.match[0].player1_id);
  assert.equal(restored.match[0].player2_id, original.match[0].player2_id);
  assert.equal(restored.picks[0].player1_hero_id, "hero-a");
  assert.equal(restored.picks[0].player2_hero_id, "hero-b");
  assert.equal(restored.picks[0].player1_side, "archmother");
});

test("undo-last rejects a swap when a pick was edited after swapping", async () => {
  const f = await fixture();
  await database.pool.query(
    "INSERT INTO match_game_picks (match_id, game_number, player1_hero_id, player2_hero_id, player1_side) VALUES ($1,1,'hero-a','hero-b','archmother')",
    [f.match.id],
  );
  await request(app).post(`/api/matches/${f.match.id}/swap-players`).set(f.auth).expect(200);
  await database.pool.query(
    "UPDATE match_game_picks SET player1_hero_id='edited-later' WHERE match_id=$1 AND game_number=1",
    [f.match.id],
  );
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});

test("undo-last rejects a swap after the match revision changed", async () => {
  const f = await fixture();
  await request(app).post(`/api/matches/${f.match.id}/swap-players`).set(f.auth).expect(200);
  await database.pool.query("UPDATE matches SET best_of=3 WHERE id=$1", [f.match.id]);
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});

test("undo-last supports an older BO action with no nextBestOf metadata", async () => {
  const f = await fixture();
  await request(app).patch(`/api/matches/${f.match.id}`).set(f.auth)
    .send({ bestOf: 3 }).expect(200);
  await database.pool.query(
    "UPDATE action_log SET undo_payload=(undo_payload::jsonb - 'nextBestOf' - 'nextRevision')::text WHERE tournament_id=$1 AND action_type='match_bo_changed'",
    [f.id],
  );
  await request(app).post(`/api/tournaments/${f.id}/undo-last`).set(f.auth).expect(200);
  assert.equal((await f.read()).bestOf, 1);
});

test("undo-last restores the last unfeatured match using the new history payload", async () => {
  const f = await fixture();
  const url = `/api/tournaments/${f.id}`;
  await request(app).patch(url).set(f.auth).send({ featuredMatchId: f.match.id }).expect(200);
  await request(app).patch(url).set(f.auth).send({ featuredMatchId: null }).expect(200);
  assert.equal((await undoSnapshot(f.id, f.match.id)).featuredMatchId, null);
  await request(app).post(`${url}/undo-last`).set(f.auth).expect(200);
  assert.equal((await undoSnapshot(f.id, f.match.id)).featuredMatchId, f.match.id);
});

test("legacy swap action without a pick snapshot refuses undo when picks exist", async () => {
  const f = await fixture();
  await database.pool.query(
    "INSERT INTO match_game_picks (match_id, game_number, player1_hero_id, player2_hero_id) VALUES ($1,1,'hero-a','hero-b')",
    [f.match.id],
  );
  await request(app).post(`/api/matches/${f.match.id}/swap-players`).set(f.auth).expect(200);
  await database.pool.query(
    "UPDATE action_log SET undo_payload=(undo_payload::jsonb - 'nextPicks' - 'nextRevision' - 'nextStatus')::text WHERE tournament_id=$1 AND action_type='match_players_swapped'",
    [f.id],
  );
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});

test("undo-last rejects ABA status changes that return to the same visible status", async () => {
  const f = await fixture();
  await request(app).patch(`/api/matches/${f.match.id}`).set(f.auth)
    .send({ status: "in_progress" }).expect(200);
  const initialRevision = (await f.read()).revision;
  await database.pool.query("UPDATE matches SET status='postponed' WHERE id=$1", [f.match.id]);
  await database.pool.query("UPDATE matches SET status='in_progress' WHERE id=$1", [f.match.id]);
  assert.equal((await f.read()).status, "in_progress");
  assert.ok((await f.read()).revision > initialRevision);
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});

test("undo-last refuses ABA cancellation when the match revision has changed", async () => {
  const f = await fixture();
  await request(app).post(`/api/matches/${f.match.id}/cancel`).set(f.auth)
    .send({ note: "Cancelled by organizer" }).expect(200);
  const initialRevision = (await f.read()).revision;
  await database.pool.query("UPDATE matches SET status='pending' WHERE id=$1", [f.match.id]);
  await database.pool.query("UPDATE matches SET status='cancelled' WHERE id=$1", [f.match.id]);
  assert.equal((await f.read()).status, "cancelled");
  assert.ok((await f.read()).revision > initialRevision);
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});

test("undo-last accepts the current match-start status and restores pending", async () => {
  const f = await fixture();
  await request(app).patch(`/api/matches/${f.match.id}`).set(f.auth)
    .send({ status: "in_progress" }).expect(200);
  assert.equal((await f.read()).status, "in_progress");
  await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(200);
  assert.equal((await f.read()).status, "pending");
});

test("undo-last reverses dedicated cancelled-match restoration without overwriting new data", async () => {
  const f = await fixture();
  const url = `/api/matches/${f.match.id}`;
  await request(app).post(`${url}/cancel`).set(f.auth)
    .send({ note: "Cancelled" }).expect(200);
  await request(app).post(`${url}/restore-cancelled`).set(f.auth).expect(200);
  await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(200);
  assert.equal((await f.read()).status, "cancelled");
});

test("undo-last does not overwrite a note edited after cancellation", async () => {
  const f = await fixture();
  const url = `/api/matches/${f.match.id}`;
  await request(app).post(`${url}/cancel`).set(f.auth)
    .send({ note: "Initial cancellation note" }).expect(200);
  await request(app).patch(url).set(f.auth)
    .send({ note: "Operator updated the note" }).expect(200);
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});

test("old cancellation logs fail closed if cancellation changed the note", async () => {
  const f = await fixture();
  await request(app).post(`/api/matches/${f.match.id}/cancel`).set(f.auth)
    .send({ note: "New cancellation note" }).expect(200);
  await database.pool.query(
    "UPDATE action_log SET undo_payload=(undo_payload::jsonb - 'nextNote' - 'nextRevision')::text WHERE tournament_id=$1 AND action_type='match_cancelled'",
    [f.id],
  );
  const baseline = await undoSnapshot(f.id, f.match.id);
  const rejected = await request(app).post(`/api/tournaments/${f.id}/undo-last`)
    .set(f.auth).expect(409);
  assert.equal(rejected.body.code, "UNDO_ACTION_CHANGED");
  assert.deepEqual(await undoSnapshot(f.id, f.match.id), baseline);
});
